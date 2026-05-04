"""
download_orchestrator.py — Unified download orchestrator voor de Core backend.

Port van services/downloadOrchestrator.js: accepteert generieke quality-waarden
(flac / mp3_320 / mp3_128), probeert bronnen in volgorde en slaat job-status op
in de gedeelde SQLite DB.

Bronnen:
  tidarr        — Tidarr (Tidal)
  soulseek      — Soulseek via slskd REST API
  hifi          — HiFi publieke API instances (lossless, geen account)
  orpheus_*     — OrpheusDL platforms (tidal, qobuz, deezer, spotify, ...)

Priority volgorde is configureerbaar via:
  1. DB-instelling  download.source_priority  (UI drag-to-reorder)
  2. Env var        DOWNLOAD_SOURCES          (komma-gescheiden, bijv. soulseek,tidarr,hifi)
  3. Ingebouwde     DEFAULT_SOURCE_PRIORITY
"""
from __future__ import annotations

import contextlib
import logging
import os
import time

import core.database as db
import core.hifi_client as hifi_client
import core.orpheus_client as orpheus
import core.soulseek_client as soulseek
import core.tidarr_client as tidarr
from core.plex_service import _fuzzy_score

log = logging.getLogger(__name__)

# ── Quality mapping ────────────────────────────────────────────────────────────
_QUALITY_MAP: dict[str, dict[str, str]] = {
    "tidarr":           {"flac": "lossless", "mp3_320": "high",     "mp3_128": "low",
                         "atmos": "atmos",   "hifi": "hifi",        "lossless": "lossless",
                         "high": "high",     "low": "low"},
    "soulseek":         {"flac": "flac",     "mp3_320": "mp3_320",  "mp3_128": "mp3_128",
                         "lossless": "flac", "high": "mp3_320",     "low": "mp3_128"},
    "hifi":             {"flac": "flac",     "mp3_320": "flac",     "mp3_128": "flac",
                         "lossless": "flac", "high": "flac"},
    "orpheus_tidal":    {"flac": "hifi",     "mp3_320": "high",     "mp3_128": "low",
                         "hifi": "hifi",     "lossless": "lossless","high": "high", "low": "low", "atmos": "atmos"},
    "orpheus_qobuz":    {"flac": "hifi",     "mp3_320": "high",     "mp3_128": "high",
                         "hifi": "hifi",     "lossless": "lossless","high": "high"},
    "orpheus_deezer":   {"flac": "lossless", "mp3_320": "high",     "mp3_128": "low",
                         "lossless": "lossless", "high": "high",    "low": "low"},
    "orpheus_spotify":  {"flac": "high",     "mp3_320": "high",     "mp3_128": "low",
                         "high": "high",     "low": "low"},
    "orpheus_soundcloud":{"flac": "high",    "mp3_320": "high",     "mp3_128": "high", "high": "high"},
    "orpheus_applemusic":{"flac": "high",    "mp3_320": "high",     "mp3_128": "high", "high": "high"},
    "orpheus_beatport": {"flac": "lossless", "mp3_320": "high",     "mp3_128": "low",
                         "lossless": "lossless", "high": "high",    "low": "low"},
    "orpheus_beatsource":{"flac": "lossless","mp3_320": "high",     "mp3_128": "low",
                         "lossless": "lossless", "high": "high",    "low": "low"},
    "orpheus_youtube":  {"flac": "lossless", "mp3_320": "high",     "mp3_128": "low",
                         "lossless": "lossless", "high": "high",    "low": "low"},
}

# Ingebouwde standaard volgorde — overschrijfbaar via DOWNLOAD_SOURCES env var of DB-instelling
DEFAULT_SOURCE_PRIORITY = [
    "tidarr",
    "soulseek",
    "hifi",
    "orpheus_qobuz",
    "orpheus_tidal",
    "orpheus_deezer",
    "orpheus_spotify",
    "orpheus_soundcloud",
    "orpheus_applemusic",
    "orpheus_beatport",
    "orpheus_beatsource",
    "orpheus_youtube",
]

# Pas DEFAULT_SOURCE_PRIORITY aan op basis van DOWNLOAD_SOURCES env var
_ENV_SOURCES = os.environ.get("DOWNLOAD_SOURCES") or ""
if _ENV_SOURCES.strip():
    _env_list = [s.strip() for s in _ENV_SOURCES.split(",") if s.strip()]
    # Voeg bronnen toe die in env staan maar nog niet in de lijst (inclusief orpheus_* varianten)
    _extra = [s for s in DEFAULT_SOURCE_PRIORITY if s not in _env_list]
    DEFAULT_SOURCE_PRIORITY = _env_list + _extra

_PLATFORM_LABELS = {
    "tidal": "Tidal", "qobuz": "Qobuz", "deezer": "Deezer",
    "spotify": "Spotify", "soundcloud": "SoundCloud", "applemusic": "Apple Music",
    "beatport": "Beatport", "beatsource": "Beatsource", "youtube": "YouTube",
}

# In-memory fout-trackers (herstart = reset)
_source_errors: dict[str, dict] = {}


def _map_quality(source: str, quality: str) -> str:
    m = _QUALITY_MAP.get(source)
    if not m:
        return quality or "high"
    return m.get(quality) or m.get("flac") or quality or "high"


def _platform_label(platform: str) -> str:
    return _PLATFORM_LABELS.get(platform, platform)


def _get_source_priority() -> list[str]:
    val = db.get_setting("download", "source_priority")
    return val if isinstance(val, list) and val else DEFAULT_SOURCE_PRIORITY


def _is_hybrid_mode() -> bool:
    val = db.get_setting("download", "hybrid_mode")
    return True if val is None else bool(val)


def _is_source_enabled(source: str) -> bool:
    val = db.get_setting("download", f"source_enabled_{source}")
    return True if val is None else bool(val)


# ── Tidarr download ────────────────────────────────────────────────────────────

def _download_via_tidarr(artist: str, album: str, track: str,
                          item_type: str, quality: str) -> dict:
    q = _map_quality("tidarr", quality)
    if item_type == "album" or (not track and album):
        found = tidarr.find_best_album(artist, album)
        if not found:
            raise RuntimeError(f"Tidarr: geen album gevonden voor '{artist} - {album}'")
        tidarr.add_to_queue(found.get("url", ""), "album",
                            found.get("title", ""), found.get("artist", ""),
                            str(found.get("id", "")), q)
        return {"source": "tidarr", "title": found.get("title"), "artist": found.get("artist"),
                "url": found.get("url")}
    # Track
    data   = tidarr.search(f"{artist} {track}".strip())
    tracks = [r for r in (data.get("results") or []) if r.get("type") == "track"]
    if not tracks:
        raise RuntimeError(f"Tidarr: geen track gevonden voor '{artist} - {track}'")
    best = tracks[0]
    tidarr.add_to_queue(best.get("url", ""), "track",
                        best.get("title", ""), best.get("artist", ""),
                        str(best.get("id", "")), q)
    return {"source": "tidarr", "title": best.get("title"), "artist": best.get("artist"),
            "url": best.get("url")}


# ── Soulseek download ──────────────────────────────────────────────────────────

def _download_via_soulseek(artist: str, album: str, track: str,
                            item_type: str, quality: str) -> dict:
    query = f"{artist} {track}".strip() if item_type == "track" else f"{artist} {album}".strip()
    results = soulseek.search(query)
    if not results:
        raise RuntimeError(f"Soulseek: geen resultaten voor '{query}'")

    # Kies het best gerangschikte bestand
    best = results[0]
    transfer_id = soulseek.download(best)
    log.info("Soulseek: download gestart — transfer %s", transfer_id)
    return {
        "source":      "soulseek",
        "title":       track or album,
        "artist":      artist,
        "url":         best.filename,
        "transferId":  transfer_id,
        "peer":        best.username,
    }


# ── HiFi download ──────────────────────────────────────────────────────────────

def _download_via_hifi(artist: str, album: str, track: str,
                        item_type: str, quality: str) -> dict:
    query = f"{artist} {track}".strip() if item_type == "track" else f"{artist} {album}".strip()
    want_title = track if item_type == "track" else album

    results = hifi_client.search(query, artist=artist)
    if not results:
        raise RuntimeError(f"HiFi: geen resultaten voor '{query}'")

    # Kies de best overeenkomende track op titel-score
    scored = sorted(
        results,
        key=lambda t: -(
            _fuzzy_score(artist, t.artist) + _fuzzy_score(want_title, t.title)
        ) / 2,
    )
    best = scored[0]

    output_dir = db.get_setting("download", "downloadPath") or "/data/downloads/hifi"
    path = hifi_client.download(best, output_dir)
    return {
        "source": "hifi",
        "title":  best.title,
        "artist": best.artist,
        "url":    path,
    }


# ── OrpheusDL download ────────────────────────────────────────────────────────

def _download_via_orpheus(artist: str, album: str, track: str,
                           item_type: str, quality: str, platform: str) -> dict:
    src = f"orpheus_{platform}"
    q   = _map_quality(src, quality)
    query = f"{artist} {track}".strip() if item_type == "track" else f"{artist} {album}".strip()
    search_type = "track" if item_type == "track" else "album"

    data    = orpheus.search(query, platform, search_type)
    results = data.get("results") or []
    job_id  = data.get("jobId")

    if not results:
        raise RuntimeError(f"OrpheusDL ({platform}): geen resultaten voor '{query}'")

    want_title = track if item_type == "track" else album
    scored = sorted(
        [
            {**r, "_score": (_fuzzy_score(artist, r.get("artist") or "")
                             + _fuzzy_score(want_title, r.get("title") or "")) / 2}
            for r in results
        ],
        key=lambda x: -x["_score"],
    )
    best = scored[0]

    dl_job_id = None
    if best.get("url"):
        dl = orpheus.download(best["url"], q)
        dl_job_id = dl.get("jobId")
    elif job_id:
        dl = orpheus.download_from_search(job_id, best.get("index", 0), q)
        dl_job_id = dl.get("jobId")
    else:
        raise RuntimeError(f"OrpheusDL ({platform}): geen URL of jobId voor download")

    return {
        "source": src,
        "title":  best.get("title"),
        "artist": best.get("artist"),
        "url":    best.get("url", ""),
        "jobId":  dl_job_id,
    }


# ── Publieke API ───────────────────────────────────────────────────────────────

def download(artist: str, album: str = "", track: str = "",
             item_type: str = "", quality: str = "flac",
             source: str = "auto") -> dict:
    """
    Start een download via de orchestrator.

    Returns { id, status, source, result? }
    """
    if not item_type:
        item_type = "album" if album else "track"

    job_id = db.create_download_job(
        artist=artist, album=album, track=track,
        job_type=item_type, quality=quality, source_requested=source,
    )
    db.update_download_job(job_id, "running", attempts=1)
    log.info("Download gestart — job %d: %s - %s [%s]", job_id, artist, album or track, source)

    priority = _get_source_priority()
    hybrid   = _is_hybrid_mode()

    sources_to_try = [s for s in priority if _is_source_enabled(s)] if source == "auto" else [source]

    if not sources_to_try:
        db.update_download_job(job_id, "failed", error_log="Geen download-bronnen geconfigureerd")
        return {"id": job_id, "status": "failed", "source": "none",
                "error": "Geen download-bronnen geconfigureerd"}

    last_error: Exception | None = None
    attempts = 0

    for src in sources_to_try:
        attempts += 1
        try:
            if src == "tidarr":
                result = _download_via_tidarr(artist, album, track, item_type, quality)
            elif src == "soulseek":
                result = _download_via_soulseek(artist, album, track, item_type, quality)
            elif src == "hifi":
                result = _download_via_hifi(artist, album, track, item_type, quality)
            elif src.startswith("orpheus_"):
                platform = src[len("orpheus_"):]
                result   = _download_via_orpheus(artist, album, track, item_type, quality, platform)
            else:
                raise RuntimeError(f"Onbekende bron: {src}")

            db.update_download_job(job_id, "completed", source_used=src,
                                   attempts=attempts, error_log=None)
            with contextlib.suppress(Exception):
                db.add_download_record(
                    tidal_id=result.get("url") or "",
                    artist=result.get("artist") or artist,
                    title=result.get("title") or album or track,
                    url=result.get("url") or "",
                    quality=_map_quality(src, quality),
                    source=src,
                    platform=(src[len("orpheus_"):] if src.startswith("orpheus_")
                              else src),
                )
            _source_errors.pop(src, None)
            log.info("✓ Download succesvol via %s — job %d", src, job_id)
            return {"id": job_id, "status": "completed", "source": src, "result": result}

        except Exception as exc:
            last_error = exc
            _source_errors[src] = {"count": _source_errors.get(src, {}).get("count", 0) + 1,
                                   "lastMsg": str(exc), "lastAt": time.time()}
            db.update_download_job(job_id, "running", attempts=attempts, error_log=str(exc))
            log.warning("✗ Bron %s mislukt (job %d): %s", src, job_id, exc)
            if not hybrid:
                break

    error_msg = str(last_error) if last_error else "Alle download-bronnen mislukt"
    db.update_download_job(job_id, "failed", attempts=attempts, error_log=error_msg)
    log.error("✗ Download volledig mislukt — job %d: %s", job_id, error_msg)
    return {"id": job_id, "status": "failed", "error": error_msg}


def search_all(query: str, search_type: str = "album") -> dict:
    """Zoek parallel over alle enabled bronnen."""
    q = (query or "").strip()
    if len(q) < 2:
        return {"results": []}

    priority = _get_source_priority()
    enabled  = [s for s in priority if _is_source_enabled(s)]
    all_results: list[dict] = []

    for src in enabled:
        try:
            if src == "tidarr":
                data = tidarr.search(q)
                for r in (data.get("results") or []):
                    all_results.append({**r, "source": "tidarr", "sourceName": "Tidal (Tidarr)"})
            elif src == "soulseek":
                results = soulseek.search(q, timeout=15)
                for r in results[:20]:  # Begrens Soulseek resultaten
                    all_results.append({
                        "source":     "soulseek",
                        "sourceName": "Soulseek",
                        "title":      r.filename.rsplit("/", 1)[-1],
                        "artist":     "",
                        "filename":   r.filename,
                        "size":       r.size,
                        "bitrate":    r.bitrate,
                        "peer":       r.username,
                        "score":      r.score,
                    })
            elif src == "hifi":
                tracks = hifi_client.search(q)
                for t in tracks:
                    all_results.append({
                        "source":     "hifi",
                        "sourceName": "HiFi",
                        "title":      t.title,
                        "artist":     t.artist,
                        "album":      t.album,
                        "format":     t.format,
                        "trackId":    t.track_id,
                    })
            elif src.startswith("orpheus_"):
                platform = src[len("orpheus_"):]
                data = orpheus.search(q, platform, search_type)
                for r in (data.get("results") or []):
                    all_results.append({**r, "source": src,
                                        "sourceName": _platform_label(platform),
                                        "platform": platform})
        except Exception as exc:
            log.debug("Zoekbron %s mislukt: %s", src, exc)

    return {"results": all_results}


def get_source_status() -> dict:
    sources = []
    priority = _get_source_priority()
    all_sources = DEFAULT_SOURCE_PRIORITY
    for src in all_sources:
        enabled   = _is_source_enabled(src)
        errors    = _source_errors.get(src, {"count": 0})
        available = None
        if enabled:
            try:
                if src == "tidarr":
                    s = tidarr.get_status()
                    available = s.get("connected")
                elif src == "soulseek":
                    s = soulseek.get_status()
                    available = s.get("connected")
                elif src == "hifi":
                    s = hifi_client.get_status()
                    available = s.get("connected")
                elif src.startswith("orpheus_"):
                    s = orpheus.get_status()
                    available = s.get("connected")
            except Exception:
                available = False

        if src == "tidarr":
            label = "Tidal (Tidarr)"
        elif src == "soulseek":
            label = "Soulseek (slskd)"
        elif src == "hifi":
            label = "HiFi"
        else:
            label = _platform_label(src[len("orpheus_"):])

        sources.append({
            "name":       src,
            "label":      label,
            "enabled":    enabled,
            "available":  available,
            "errorCount": errors.get("count", 0),
            "lastError":  errors.get("lastMsg"),
            "priority":   priority.index(src) if src in priority else -1,
        })
    return {"sources": sources}


def retry_failed() -> dict:
    jobs = db.get_pending_download_jobs()
    if not jobs:
        return {"retried": 0}
    retried = 0
    for job in jobs:
        try:
            result = download(
                artist=job.get("artist") or "",
                album=job.get("album") or "",
                track=job.get("track") or "",
                item_type=job.get("type") or "album",
                quality=job.get("quality") or "flac",
                source=job.get("source_requested") or "auto",
            )
            if result.get("status") == "completed":
                retried += 1
        except Exception as exc:
            log.warning("Retry mislukt voor job %s: %s", job.get("id"), exc)
    return {"retried": retried}
