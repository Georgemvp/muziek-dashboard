"""
soulseek_client.py — HTTP client voor de slskd Soulseek REST API.

slskd is een open-source Soulseek client met REST API:
https://github.com/slskd/slskd

Configuratie via environment variables:
  SLSKD_URL      base-URL van de slskd instance (default: http://localhost:5030)
  SLSKD_API_KEY  API key geconfigureerd in slskd settings.yml
"""
from __future__ import annotations

import logging
import os
import time
import uuid
from dataclasses import dataclass
from typing import Optional

import requests

log = logging.getLogger(__name__)

SLSKD_BASE = (os.environ.get("SLSKD_URL") or "http://localhost:5030").rstrip("/")
SLSKD_KEY  = os.environ.get("SLSKD_API_KEY") or ""

_TIMEOUT             = 10
_SEARCH_POLL_INTERVAL = 1.5   # seconden tussen polls
_MIN_MP3_BITRATE     = 320    # kbps — lagere bitrates worden gefilterd

# In-memory peer-reuse tracker: username → aantal succesvolle downloads
_successful_peers: dict[str, int] = {}


@dataclass
class SearchResult:
    username: str
    filename: str
    size: int
    bitrate: Optional[int] = None
    sample_rate: Optional[int] = None
    bit_depth: Optional[int] = None
    length: Optional[int] = None
    upload_speed: int = 0
    queue_length: int = 0
    free_slot: bool = False
    score: float = 0.0


@dataclass
class DownloadStatus:
    id: str
    username: str
    filename: str
    state: str
    size: int = 0
    bytes_transferred: int = 0


def _headers() -> dict:
    h = {"Accept": "application/json", "Content-Type": "application/json"}
    if SLSKD_KEY:
        h["X-API-Key"] = SLSKD_KEY
    return h


def get_status() -> dict:
    try:
        r = requests.get(f"{SLSKD_BASE}/api/v0/application", headers=_headers(), timeout=_TIMEOUT)
        r.raise_for_status()
        return {"connected": True, **r.json()}
    except Exception as exc:
        return {"connected": False, "reason": str(exc)}


def search(query: str, timeout: int = 30) -> list[SearchResult]:
    """
    Zoek op het Soulseek netwerk via slskd.

    Pollt GET /api/v0/searches/{id} tot resultaten beschikbaar zijn of timeout
    bereikt is. Resultaten worden gerangschikt: FLAC > MP3 ≥ 320kbps,
    hogere upload-snelheid, kortere queue, vrije upload-slots.
    """
    search_id = str(uuid.uuid4())
    try:
        r = requests.post(
            f"{SLSKD_BASE}/api/v0/searches",
            json={"searchText": query, "id": search_id},
            headers=_headers(),
            timeout=_TIMEOUT,
        )
        r.raise_for_status()
    except Exception as exc:
        log.warning("slskd: zoekoperatie starten mislukt voor '%s': %s", query, exc)
        return []

    deadline = time.monotonic() + timeout
    responses: list[dict] = []
    while time.monotonic() < deadline:
        try:
            resp = requests.get(
                f"{SLSKD_BASE}/api/v0/searches/{search_id}",
                headers=_headers(),
                timeout=_TIMEOUT,
            )
            resp.raise_for_status()
            data = resp.json()
            state = data.get("state") or ""
            responses = data.get("responses") or []
            if state in ("Completed", "TimedOut", "Cancelled") or len(responses) >= 5:
                break
        except Exception as exc:
            log.debug("slskd: poll mislukt: %s", exc)
        time.sleep(_SEARCH_POLL_INTERVAL)

    return _rank_results(responses)


def _rank_results(responses: list[dict]) -> list[SearchResult]:
    """Zet ruwe slskd API-responses om naar gerangschikte SearchResult-objecten."""
    candidates: list[SearchResult] = []

    for peer in responses:
        username     = peer.get("username") or ""
        upload_speed = peer.get("uploadSpeed") or 0
        queue_length = peer.get("queueLength") or 0
        free_slot    = bool(peer.get("hasFreeUploadSlot"))

        for f in peer.get("files") or []:
            filename = f.get("filename") or ""
            ext      = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
            bitrate  = f.get("bitRate")
            size     = f.get("size") or 0

            is_flac = ext == "flac"
            is_mp3  = ext == "mp3"
            if not is_flac and not (is_mp3 and bitrate and bitrate >= _MIN_MP3_BITRATE):
                continue

            # Score: FLAC basis 1000, MP3 basis 500
            score = 1000.0 if is_flac else 500.0
            # Upload-snelheid bonus (max 200 punten bij 2 MB/s)
            score += min(upload_speed / 10_000, 200.0)
            # Queue penalty (10 punten per wachtende, max -100)
            score -= min(queue_length * 10, 100.0)
            # Vrije slot bonus
            if free_slot:
                score += 50.0
            # Peer-reuse bonus: eerder succesvolle peers krijgen extra punten
            score += _successful_peers.get(username, 0) * 25.0

            candidates.append(SearchResult(
                username=username,
                filename=filename,
                size=size,
                bitrate=bitrate,
                sample_rate=f.get("sampleRate"),
                bit_depth=f.get("bitDepth"),
                length=f.get("length"),
                upload_speed=upload_speed,
                queue_length=queue_length,
                free_slot=free_slot,
                score=score,
            ))

    candidates.sort(key=lambda x: -x.score)
    return candidates


def download(file: SearchResult) -> str:
    """
    Start een download via slskd (POST /api/v0/transfers/downloads/{username}).

    Returns een transfer-ID met formaat '{username}|{filename}' voor statuspeilingen.
    """
    r = requests.post(
        f"{SLSKD_BASE}/api/v0/transfers/downloads/{file.username}",
        json=[{"filename": file.filename, "size": file.size}],
        headers=_headers(),
        timeout=_TIMEOUT,
    )
    r.raise_for_status()
    transfer_id = f"{file.username}|{file.filename}"
    log.info("slskd: download gestart van %s: %s", file.username, file.filename)
    return transfer_id


def get_download_status(transfer_id: str) -> DownloadStatus:
    """
    Check de status van een lopende download via GET /api/v0/transfers/downloads/{username}.

    transfer_id heeft het formaat '{username}|{filename}'.
    """
    username, _, filename = transfer_id.partition("|")
    try:
        r = requests.get(
            f"{SLSKD_BASE}/api/v0/transfers/downloads/{username}",
            headers=_headers(),
            timeout=_TIMEOUT,
        )
        r.raise_for_status()
        directories = r.json() or []
    except Exception as exc:
        log.debug("slskd: status ophalen mislukt: %s", exc)
        return DownloadStatus(id=transfer_id, username=username,
                              filename=filename, state="Error")

    for directory in directories:
        for f in directory.get("files") or []:
            if f.get("filename") == filename:
                state = f.get("state") or "Unknown"
                if state == "Completed, Succeeded":
                    _successful_peers[username] = _successful_peers.get(username, 0) + 1
                return DownloadStatus(
                    id=transfer_id,
                    username=username,
                    filename=filename,
                    state=state,
                    size=f.get("size") or 0,
                    bytes_transferred=f.get("bytesTransferred") or 0,
                )

    return DownloadStatus(id=transfer_id, username=username,
                          filename=filename, state="NotFound")


def get_completed_path(transfer_id: str) -> str:
    """
    Geeft het lokale pad naar het gedownloade bestand terug (na voltooiing).

    slskd slaat het pad op als 'localFilename' in de transfer-status.
    """
    username, _, filename = transfer_id.partition("|")
    try:
        r = requests.get(
            f"{SLSKD_BASE}/api/v0/transfers/downloads/{username}",
            headers=_headers(),
            timeout=_TIMEOUT,
        )
        r.raise_for_status()
        directories = r.json() or []
    except Exception:
        return ""

    for directory in directories:
        for f in directory.get("files") or []:
            if f.get("filename") == filename:
                return f.get("localFilename") or ""

    return ""
