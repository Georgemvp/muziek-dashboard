"""
deezer_client.py — Deezer API client voor de discovery module.

Gebruikt de gratis Deezer API (geen auth) voor similar artists,
top tracks en artiestfoto's.
Rate limit: conservatief 1 call/sec (zelfde als DeezerWorker).
"""
from __future__ import annotations

import logging
import time

import requests

log = logging.getLogger(__name__)

_DEEZER_BASE   = "https://api.deezer.com"
_RATE_INTERVAL = 1.1   # seconden tussen calls
_TIMEOUT       = 12    # request timeout in seconden
_last_call     = 0.0
_session       = requests.Session()
_session.headers.update({"Accept": "application/json"})


def _rate_limit() -> None:
    global _last_call
    wait = max(0.0, _RATE_INTERVAL - (time.time() - _last_call))
    if wait > 0:
        time.sleep(wait)
    _last_call = time.time()


def _get(path: str) -> dict:
    _rate_limit()
    resp = _session.get(f"{_DEEZER_BASE}{path}", timeout=_TIMEOUT)
    if resp.status_code == 429:
        raise RuntimeError("Deezer rate limit bereikt")
    resp.raise_for_status()
    data = resp.json()
    if isinstance(data, dict) and data.get("error"):
        err = data["error"]
        raise RuntimeError(f"Deezer fout: {err.get('message', err)}")
    return data


def _find_artist_id(name: str) -> int | None:
    """Zoek Deezer artiest-ID op naam. Exact match heeft voorrang."""
    data  = _get(f"/search/artist?q={requests.utils.quote(name)}&limit=5")
    items = data.get("data", [])
    if not items:
        return None
    name_lower = name.lower()
    best = next(
        (a for a in items if a.get("name", "").lower() == name_lower),
        items[0],
    )
    return best.get("id")


def get_similar_artists(artist_name: str, limit: int = 20) -> list[dict]:
    """
    Haalt artiesten op gerelateerd aan artist_name via Deezer /related.

    Returns list van { name, match (0-1, dalend), image (URL of None) }.
    Identiek aan getSimilarArtists() in services/deezer.js.
    """
    try:
        artist_id = _find_artist_id(artist_name)
        if not artist_id:
            return []

        related = _get(f"/artist/{artist_id}/related?limit={limit}")
        artists = related.get("data", [])
        total   = max(len(artists), 1)
        return [
            {
                "name":  a.get("name"),
                "match": round(1.0 - (i / total), 3),
                "image": (
                    a.get("picture_medium")
                    or a.get("picture")
                    or None
                ),
            }
            for i, a in enumerate(artists)
            if a.get("name")
        ]
    except Exception as exc:
        log.debug("Deezer similar artists mislukt voor '%s': %s", artist_name, exc)
        return []


def get_artist_top_tracks(deezer_id: int | str, limit: int = 50) -> list[dict]:
    """
    Haalt top tracks op voor een Deezer artiest-ID.

    Returns list van { id, title, rank }.
    Identiek aan getDeezerArtistTopTracks() in services/deezer.js.
    """
    try:
        data   = _get(f"/artist/{deezer_id}/top?limit={limit}")
        tracks = data.get("data", [])
        return [
            {
                "id":    t.get("id"),
                "title": t.get("title"),
                "rank":  t.get("rank", 0),
            }
            for t in tracks
        ]
    except Exception as exc:
        log.debug("Deezer top tracks mislukt voor artiest %s: %s", deezer_id, exc)
        return []


def get_artist_image(artist_name: str) -> str | None:
    """
    Geeft de medium-formaat artiestfoto-URL terug van Deezer, of None.
    Identiek aan getDeezerImage() in services/deezer.js.
    """
    try:
        data  = _get(f"/search/artist?q={requests.utils.quote(artist_name)}&limit=3")
        items = data.get("data", [])
        if not items:
            return None
        name_lower = artist_name.lower()
        best = next(
            (a for a in items if a.get("name", "").lower() == name_lower),
            items[0],
        )
        return best.get("picture_medium") or best.get("picture") or None
    except Exception as exc:
        log.debug("Deezer get_artist_image mislukt voor '%s': %s", artist_name, exc)
        return None
