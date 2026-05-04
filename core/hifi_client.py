"""
hifi_client.py — Client voor publieke HiFi music download API instances.

Biedt gratis lossless (FLAC) downloads via configureerbare public API endpoints.
Geen account vereist. Valt automatisch terug op een volgende instance als de
eerste onbereikbaar is.

Configuratie via environment variable:
  HIFI_INSTANCES  komma-gescheiden lijst van base-URLs
                  Voorbeeld: https://hifi1.example.com,https://hifi2.example.com
"""
from __future__ import annotations

import logging
import os
import urllib.parse
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

import requests

log = logging.getLogger(__name__)

_ENV_INSTANCES = os.environ.get("HIFI_INSTANCES") or ""
INSTANCES: list[str] = (
    [u.strip().rstrip("/") for u in _ENV_INSTANCES.split(",") if u.strip()]
    if _ENV_INSTANCES
    else []
)

_TIMEOUT_SEARCH   = 15
_TIMEOUT_DOWNLOAD = 120
_CHUNK_SIZE       = 65_536


@dataclass
class Track:
    track_id: str
    title: str
    artist: str
    album: str = ""
    duration: int = 0
    format: str = "flac"
    instance: str = ""


def _try_instances(method: str, path: str, **kwargs) -> tuple[requests.Response, str]:
    """
    Probeer de request op elke geconfigureerde instance in volgorde.
    Geeft (response, base_url) terug van de eerste succesvolle instance.
    Gooit RuntimeError als alle instances falen.
    """
    if not INSTANCES:
        raise RuntimeError("Geen HiFi instances geconfigureerd (HIFI_INSTANCES is leeg)")

    last_exc: Exception | None = None
    for base in INSTANCES:
        try:
            url = f"{base}{path}"
            r = getattr(requests, method)(url, **kwargs)
            r.raise_for_status()
            return r, base
        except Exception as exc:
            log.debug("HiFi instance %s mislukt: %s", base, exc)
            last_exc = exc

    raise RuntimeError(f"Alle HiFi instances onbereikbaar: {last_exc}") from last_exc


def get_status() -> dict:
    try:
        r, base = _try_instances("get", "/api/health", timeout=_TIMEOUT_SEARCH)
        return {"connected": True, "instance": base}
    except Exception as exc:
        return {"connected": False, "reason": str(exc)}


def search(query: str, artist: Optional[str] = None) -> list[Track]:
    """
    Zoek tracks via geconfigureerde HiFi API instances.

    Probeert instances in volgorde en gebruikt de eerste succesvolle response.
    """
    params: dict[str, str] = {"q": query, "format": "flac"}
    if artist:
        params["artist"] = artist

    path = f"/api/search?{urllib.parse.urlencode(params)}"
    try:
        r, base = _try_instances("get", path, timeout=_TIMEOUT_SEARCH)
        body = r.json()
        if isinstance(body, list):
            items = body
        else:
            items = body.get("results") or []
        tracks = []
        for item in items:
            tracks.append(Track(
                track_id=str(item.get("id") or item.get("track_id") or ""),
                title=item.get("title") or "",
                artist=item.get("artist") or item.get("artist_name") or "",
                album=item.get("album") or item.get("album_name") or "",
                duration=int(item.get("duration") or 0),
                format=item.get("format") or "flac",
                instance=base,
            ))
        log.debug("HiFi: %d resultaten voor '%s'", len(tracks), query)
        return tracks
    except Exception as exc:
        log.warning("HiFi search mislukt voor '%s': %s", query, exc)
        return []


def get_stream_url(track_id: str, instance: str = "") -> str:
    """
    Geeft de stream-URL terug voor een track ID.

    Probeert eerst /api/track/{id} voor metadata; valt terug op directe stream-URL.
    """
    base = instance or (INSTANCES[0] if INSTANCES else "")
    if not base:
        raise RuntimeError("Geen HiFi instances geconfigureerd")
    try:
        r = requests.get(f"{base}/api/track/{track_id}", timeout=_TIMEOUT_SEARCH)
        r.raise_for_status()
        data = r.json()
        return data.get("stream_url") or data.get("url") or f"{base}/api/stream/{track_id}"
    except Exception:
        return f"{base}/api/stream/{track_id}"


def download(track: Track, output_dir: str) -> str:
    """
    Download een FLAC track naar output_dir.

    Returns het absolute pad naar het gedownloade bestand.
    """
    stream_url = get_stream_url(track.track_id, track.instance)

    safe = lambda s, n: "".join(c for c in s if c.isalnum() or c in " -_")[:n]
    filename = f"{safe(track.artist, 50)} - {safe(track.title, 80)}.flac".strip(" -")
    if not filename or filename == ".flac":
        filename = f"hifi_{track.track_id}.flac"

    output_path = Path(output_dir) / filename
    try:
        r = requests.get(stream_url, timeout=_TIMEOUT_DOWNLOAD, stream=True)
        r.raise_for_status()
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, "wb") as fh:
            for chunk in r.iter_content(chunk_size=_CHUNK_SIZE):
                if chunk:
                    fh.write(chunk)
        log.info("HiFi: download voltooid → %s", output_path)
        return str(output_path)
    except Exception as exc:
        raise RuntimeError(
            f"HiFi download mislukt voor track {track.track_id}: {exc}"
        ) from exc
