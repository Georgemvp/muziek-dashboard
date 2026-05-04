"""
postprocess_pipeline.py — Post-processing pipeline orchestrator.

Combineert alle post-download stappen in de juiste volgorde:
  1. AcoustID verificatie (fail-open)
  2. Album consistency (MusicBrainz release preflight)
  3. Tag writing (mutagen)
  4. Cover art embedding
  5. ReplayGain analyse + tagging
  6. Lossy kopie aanmaken (als geconfigureerd)
  7. Plex library scan triggeren

Elk stap is onafhankelijk — een fout stopt de pipeline niet.

Gebruik vanuit de download orchestrator:
    from core.postprocess_pipeline import PostProcessPipeline
    pipeline = PostProcessPipeline()
    pipeline.process('/music/downloads/Artist/Album/01 - Track.flac', metadata)

Of asynchroon (thread pool):
    pipeline.process_async(filepath, metadata)
"""
from __future__ import annotations

import logging
import os
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Callable

log = logging.getLogger(__name__)

# ── Lazy imports: importeer modules pas als ze gebruikt worden ─────────────────
# Zo crasht de pipeline niet als één dependency ontbreekt.

def _import_tag_writer():
    from core.tag_writer import TagWriter
    return TagWriter

def _import_acoustid():
    from core.acoustid_verification import verify as acoustid_verify
    return acoustid_verify

def _import_album_consistency():
    from core.album_consistency import AlbumConsistency
    return AlbumConsistency

def _import_lossy_converter():
    from core.lossy_converter import LossyConverter
    return LossyConverter

def _import_replaygain():
    from core.replaygain import analyze_replaygain, tag_replaygain
    return analyze_replaygain, tag_replaygain


# ── Stap-resultaat ─────────────────────────────────────────────────────────────

@dataclass
class StepResult:
    """Resultaat van één pipeline-stap."""
    step:       str
    status:     str           # 'ok', 'skipped', 'error', 'mismatch', 'warning'
    duration_s: float  = 0.0
    details:    dict   = field(default_factory=dict)
    error:      str | None = None


@dataclass
class PipelineResult:
    """Gecombineerd resultaat van de volledige pipeline."""
    filepath:      str
    success:       bool
    steps:         list[StepResult] = field(default_factory=list)
    final_path:    str | None       = None
    total_time_s:  float            = 0.0

    def step(self, name: str) -> StepResult | None:
        return next((s for s in self.steps if s.step == name), None)

    def __repr__(self) -> str:
        status = "ok" if self.success else "error"
        step_summary = ", ".join(f"{s.step}:{s.status}" for s in self.steps)
        return f"PipelineResult({status}, {step_summary})"


# ── Settings helper ────────────────────────────────────────────────────────────

def _get_setting(key: str, default: Any = None) -> Any:
    """Haal een postprocess-instelling op uit de SQLite settings tabel."""
    try:
        from core.database import get_setting
        val = get_setting("postprocess", key)
        return val if val is not None else default
    except Exception:
        return default


# ── Pipeline ───────────────────────────────────────────────────────────────────

class PostProcessPipeline:
    """
    Post-processing pipeline voor gedownloade audiobestanden.

    Parameters
    ----------
    max_workers : int
        Maximale gelijktijdige pipeline-runs (standaard 2, voor ffmpeg-gebruik).
    on_step : Callable, optional
        Callback die na elke stap wordt aangeroepen: fn(step_result: StepResult).
    on_complete : Callable, optional
        Callback die na de volledige pipeline wordt aangeroepen: fn(pipeline_result).
    """

    def __init__(
        self,
        max_workers:  int              = 2,
        on_step:      Callable | None  = None,
        on_complete:  Callable | None  = None,
    ) -> None:
        self._executor   = ThreadPoolExecutor(max_workers=max_workers, thread_name_prefix="postprocess")
        self._on_step    = on_step
        self._on_complete = on_complete
        self._lock       = threading.Lock()

        # Module-level singletons (aangemaakt bij eerste gebruik)
        self._album_consistency = None

        log.info("PostProcessPipeline geïnitialiseerd (max_workers=%d)", max_workers)

    # ── Publieke API ──────────────────────────────────────────────────────────

    def process(
        self,
        filepath: str,
        metadata: dict[str, Any],
        download_id: int | None = None,
    ) -> PipelineResult:
        """
        Verwerk één gedownload audiobestand synchroon.

        Parameters
        ----------
        filepath : str
            Pad naar het audiobestand.
        metadata : dict
            Download-metadata: artist, album, title, track_number, enz.
            Dezelfde sleutels als tag_writer.write_tags() verwacht.
        download_id : int, optional
            ID van de download-job (voor logging en DB-updates).

        Returns
        -------
        PipelineResult
        """
        t0     = time.monotonic()
        result = PipelineResult(filepath=filepath, success=True, final_path=filepath)

        if not os.path.isfile(filepath):
            log.warning("Pipeline: bestand niet gevonden '%s'", filepath)
            result.success = False
            return result

        artist = metadata.get("artist", "")
        album  = metadata.get("album", "")

        log.info(
            "[pipeline] start — '%s' (artist=%s album=%s job=%s)",
            os.path.basename(filepath), artist, album, download_id,
        )

        # ── 1. AcoustID verificatie ────────────────────────────────────────
        if _get_setting("acoustid_verify", False):
            step = self._run_step("acoustid", self._step_acoustid, filepath, metadata)
            result.steps.append(step)
            self._emit_step(step)

        # ── 2. Album consistency — haal release MBID op ───────────────────
        release_mbid: str | None = None
        if _get_setting("album_consistency", True) and album:
            step = self._run_step("consistency", self._step_consistency, artist, album, metadata)
            result.steps.append(step)
            release_mbid = step.details.get("mbid")
            if release_mbid:
                metadata = {**metadata, "mbid_release": release_mbid}
            self._emit_step(step)

        # ── 3. Tag writing ────────────────────────────────────────────────
        if _get_setting("tag_embedding", True):
            step = self._run_step("tags", self._step_tags, filepath, metadata)
            result.steps.append(step)
            self._emit_step(step)

        # ── 4. Cover art embedding ────────────────────────────────────────
        if _get_setting("embed_art", True):
            cover_path = self._find_cover(filepath)
            if cover_path:
                step = self._run_step("art", self._step_art, filepath, cover_path)
            else:
                step = StepResult(step="art", status="skipped",
                                  details={"reason": "geen cover.jpg gevonden"})
            result.steps.append(step)
            self._emit_step(step)

        # ── 5. ReplayGain ─────────────────────────────────────────────────
        if _get_setting("replaygain", False):
            step = self._run_step("replaygain", self._step_replaygain, filepath)
            result.steps.append(step)
            self._emit_step(step)

        # ── 6. Lossy copy ─────────────────────────────────────────────────
        lossy_path: str | None = None
        if _get_setting("lossy_copy", False):
            step = self._run_step("lossy", self._step_lossy, filepath)
            result.steps.append(step)
            lossy_path = step.details.get("output_path")
            self._emit_step(step)

        # ── 7. Plex library scan ──────────────────────────────────────────
        if _get_setting("plex_scan", True):
            step = self._run_step("plex_scan", self._step_plex_scan, filepath)
            result.steps.append(step)
            self._emit_step(step)

        result.final_path   = filepath
        result.total_time_s = time.monotonic() - t0

        ok_steps  = sum(1 for s in result.steps if s.status == "ok")
        err_steps = sum(1 for s in result.steps if s.status == "error")
        log.info(
            "[pipeline] klaar in %.1fs — %d ok, %d errors (job=%s)",
            result.total_time_s, ok_steps, err_steps, download_id,
        )

        if self._on_complete:
            try:
                self._on_complete(result)
            except Exception as exc:
                log.warning("on_complete callback fout: %s", exc)

        return result

    def process_async(
        self,
        filepath:    str,
        metadata:    dict[str, Any],
        download_id: int | None = None,
    ) -> None:
        """
        Verwerk een bestand asynchroon in een achtergrond thread.

        Gebruikt de interne ThreadPoolExecutor (max_workers threads).
        Fouten worden gelogd maar gooien geen exceptions in de aanroepende thread.
        """
        def _run():
            try:
                self.process(filepath, metadata, download_id)
            except Exception as exc:
                log.error(
                    "Onverwachte pipeline-fout voor '%s': %s",
                    filepath, exc, exc_info=True,
                )

        self._executor.submit(_run)
        log.debug("Pipeline asynchroon gepland voor '%s'", os.path.basename(filepath))

    def shutdown(self, wait: bool = True) -> None:
        """Stop de ThreadPoolExecutor (aanroepen bij applicatie-afsluiting)."""
        self._executor.shutdown(wait=wait)
        log.info("PostProcessPipeline afgesloten")

    # ── Stap-implementaties ───────────────────────────────────────────────────

    def _step_acoustid(self, filepath: str, metadata: dict) -> dict:
        """AcoustID verificatie (altijd fail-open)."""
        acoustid_verify = _import_acoustid()
        api_key = _get_setting("acoustid_api_key") or os.environ.get("ACOUSTID_API_KEY")

        result = acoustid_verify(
            filepath,
            expected_artist = metadata.get("artist"),
            expected_title  = metadata.get("title"),
            api_key         = api_key,
        )

        details: dict[str, Any] = {
            "score":      result.score,
            "verified":   result.verified,
            "duration_s": result.duration,
        }
        if result.best_recording:
            details["matched_recording"] = result.best_recording.get("id")
        if result.error:
            details["error"] = result.error
        if result.mismatch_reason:
            details["mismatch_reason"] = result.mismatch_reason

        # Fail-open: altijd 'ok' of 'mismatch', nooit blokkeren
        if result.error:
            status = "warning"
        elif result.mismatch_reason:
            status = "mismatch"
        elif result.verified:
            status = "ok"
        else:
            status = "warning"

        return {"status": status, **details}

    def _step_consistency(self, artist: str, album: str, metadata: dict) -> dict:
        """MusicBrainz release preflight."""
        AlbumConsistency = _import_album_consistency()

        with self._lock:
            if self._album_consistency is None:
                self._album_consistency = AlbumConsistency()
        consistency = self._album_consistency

        year = str(metadata.get("year", "") or "")[:4] or None
        mbid = consistency.preflight_album(artist, album, year)

        if mbid:
            # Verrijk metadata met label/catalog als beschikbaar
            info = consistency.get_release_info(artist, album, year)
            details: dict[str, Any] = {"mbid": mbid}
            if info:
                details.update({
                    "label":        info.label,
                    "catalog":      info.catalog,
                    "track_count":  info.track_count,
                    "release_type": info.release_type,
                    "country":      info.country,
                })
            return {"status": "ok", **details}
        else:
            return {"status": "warning", "reason": "Geen MBZ release gevonden"}

    def _step_tags(self, filepath: str, metadata: dict) -> dict:
        """Schrijf metadata tags via mutagen."""
        TagWriter = _import_tag_writer()
        writer    = TagWriter(
            artist_separator = _get_setting("artist_separator", "; "),
            multi_artist_tag = _get_setting("multi_artist_tag", True),
        )
        ok = writer.write_tags(filepath, metadata)
        return {"status": "ok" if ok else "error"}

    def _step_art(self, filepath: str, cover_path: str) -> dict:
        """Embed cover art vanuit cover.jpg/png via mutagen."""
        TagWriter = _import_tag_writer()
        writer    = TagWriter()
        ok = writer.embed_cover_art(filepath, cover_path)
        return {
            "status":     "ok" if ok else "error",
            "cover_path": cover_path,
        }

    def _step_replaygain(self, filepath: str) -> dict:
        """Analyseer ReplayGain en schrijf tags."""
        analyze_replaygain, tag_replaygain = _import_replaygain()
        info = analyze_replaygain(filepath)
        tag_replaygain(filepath, info)
        return {
            "status":     "ok",
            "track_gain": info.track_gain,
            "track_peak": info.track_peak,
        }

    def _step_lossy(self, filepath: str) -> dict:
        """Maak een lossy kopie van het audiobestand."""
        LossyConverter = _import_lossy_converter()
        conv = LossyConverter(
            format           = _get_setting("lossy_format", "mp3"),
            bitrate          = str(_get_setting("lossy_bitrate", "320")),
            output_dir       = _get_setting("lossy_output_dir") or None,
            source_base      = _get_setting("music_base_path") or None,
            preserve_structure = True,
            downsample_hires = _get_setting("lossy_downsample_hires", False),
        )
        result = conv.convert(filepath)
        if result.success:
            return {
                "status":       "ok",
                "output_path":  result.output_path,
                "format":       result.format,
                "bitrate":      result.bitrate,
                "downsampled":  result.downsampled,
            }
        else:
            raise RuntimeError(result.error or "Onbekende conversiefout")

    def _step_plex_scan(self, filepath: str) -> dict:
        """Trigger een Plex library scan voor de map van het bestand."""
        import urllib.request
        import urllib.parse

        plex_url   = _get_setting("plex_url") or os.environ.get("PLEX_URL", "")
        plex_token = _get_setting("plex_token") or os.environ.get("PLEX_TOKEN", "")

        if not plex_url or not plex_token:
            return {"status": "skipped", "reason": "Geen PLEX_URL/PLEX_TOKEN"}

        # Haal de Plex bibliotheek-sectie op via de API
        section_id = self._get_plex_section_id(plex_url, plex_token, filepath)
        if not section_id:
            return {"status": "skipped", "reason": "Plex sectie niet gevonden voor dit pad"}

        scan_url = (
            f"{plex_url.rstrip('/')}/library/sections/{section_id}/refresh"
            f"?path={urllib.parse.quote(str(Path(filepath).parent))}"
            f"&X-Plex-Token={plex_token}"
        )
        req = urllib.request.Request(scan_url, method="GET")
        with urllib.request.urlopen(req, timeout=10) as resp:
            status_code = resp.status

        log.info("Plex scan getriggerd voor sectie %s (HTTP %d)", section_id, status_code)
        return {"status": "ok", "section_id": section_id, "http_status": status_code}

    # ── Hulpmethoden ──────────────────────────────────────────────────────────

    @staticmethod
    def _run_step(
        name: str,
        fn:   Callable,
        *args,
        **kwargs,
    ) -> StepResult:
        """Voer één stap uit en vang alle exceptions op."""
        t0 = time.monotonic()
        try:
            details = fn(*args, **kwargs)
            status  = details.pop("status", "ok")
            return StepResult(
                step       = name,
                status     = status,
                duration_s = time.monotonic() - t0,
                details    = details,
            )
        except Exception as exc:
            log.warning("[pipeline] stap '%s' mislukt: %s", name, exc)
            return StepResult(
                step       = name,
                status     = "error",
                duration_s = time.monotonic() - t0,
                error      = str(exc),
            )

    def _emit_step(self, step: StepResult) -> None:
        """Roep de on_step callback aan als die ingesteld is."""
        if self._on_step:
            try:
                self._on_step(step)
            except Exception as exc:
                log.warning("on_step callback fout: %s", exc)

    @staticmethod
    def _find_cover(filepath: str) -> str | None:
        """Zoek cover.jpg of cover.png in de map van het audiobestand."""
        directory = Path(filepath).parent
        for name in ("cover.jpg", "cover.jpeg", "cover.png", "folder.jpg", "folder.png"):
            candidate = directory / name
            if candidate.is_file():
                return str(candidate)
        return None

    @staticmethod
    def _get_plex_section_id(
        plex_url:   str,
        plex_token: str,
        filepath:   str,
    ) -> str | None:
        """
        Vind de Plex bibliotheek-sectie ID die het opgegeven pad bevat.

        Doet een GET /library/sections en vergelijkt de Location-paden.
        """
        import json
        import urllib.request

        sections_url = (
            f"{plex_url.rstrip('/')}/library/sections"
            f"?X-Plex-Token={plex_token}"
        )
        req = urllib.request.Request(
            sections_url,
            headers={"Accept": "application/json"},
        )
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode("utf-8"))
        except Exception as exc:
            log.warning("Plex sections API fout: %s", exc)
            return None

        sections = (
            data.get("MediaContainer", {}).get("Directory", [])
        )
        norm_filepath = os.path.normpath(filepath)

        for section in sections:
            for location in section.get("Location", []):
                section_path = os.path.normpath(location.get("path", ""))
                if norm_filepath.startswith(section_path):
                    return str(section.get("key", ""))

        return None


# ── Module-niveau singleton ────────────────────────────────────────────────────
_pipeline_instance: PostProcessPipeline | None = None
_pipeline_lock = threading.Lock()


def get_pipeline() -> PostProcessPipeline:
    """Geeft de module-niveau pipeline singleton terug."""
    global _pipeline_instance
    if _pipeline_instance is None:
        with _pipeline_lock:
            if _pipeline_instance is None:
                _pipeline_instance = PostProcessPipeline()
    return _pipeline_instance


def process_download(
    filepath:    str,
    metadata:    dict[str, Any],
    download_id: int | None = None,
    async_mode:  bool = True,
) -> PipelineResult | None:
    """
    Convenience-functie: verwerk een download via de module-singleton.

    Parameters
    ----------
    filepath : str
        Pad naar het gedownloade audiobestand.
    metadata : dict
        Download-metadata (artist, album, title, track_number, enz.).
    download_id : int, optional
        Download-job ID voor tracing.
    async_mode : bool
        Als True (standaard), verwerk asynchroon in achtergrond thread.
        Als False, wacht op voltooiing en geef PipelineResult terug.

    Returns
    -------
    PipelineResult | None
        PipelineResult als async_mode=False, anders None.
    """
    pipeline = get_pipeline()
    if async_mode:
        pipeline.process_async(filepath, metadata, download_id)
        return None
    else:
        return pipeline.process(filepath, metadata, download_id)
