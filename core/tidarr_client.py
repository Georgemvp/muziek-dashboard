"""
tidarr_client.py — HTTP client voor de Tidarr container (poort 8484).

Port van de Tidarr-laag uit services/downloadOrchestrator.js en
de helper-functies uit deps.js (searchTidal, findBestAlbum, addToQueue, …).
"""
from __future__ import annotations

import logging
import os

import requests

log = logging.getLogger(__name__)

TIDARR_BASE = (os.environ.get("TIDARR_URL") or "http://localhost:8484").rstrip("/")
TIDARR_KEY  = os.environ.get("TIDARR_API_KEY") or ""

_TIMEOUT = 10


def _headers() -> dict:
    h = {"Accept": "application/json", "Content-Type": "application/json"}
    if TIDARR_KEY:
        h["x-api-key"] = TIDARR_KEY
    return h


def get_status() -> dict:
    try:
        r = requests.get(f"{TIDARR_BASE}/api/status", headers=_headers(), timeout=_TIMEOUT)
        r.raise_for_status()
        return {"connected": True, **r.json()}
    except Exception as exc:
        return {"connected": False, "reason": str(exc)}


def search(query: str) -> dict:
    try:
        r = requests.get(
            f"{TIDARR_BASE}/api/search",
            params={"query": query},
            headers=_headers(),
            timeout=_TIMEOUT,
        )
        r.raise_for_status()
        return r.json()
    except Exception as exc:
        log.warning("Tidarr search mislukt: %s", exc)
        return {"results": []}


def find_best_album(artist: str, album: str) -> dict | None:
    """
    Zoekt het beste passende Tidal-album via meerdere strategieën
    (identiek aan findBestAlbum in deps.js).
    """
    queries = [f"{artist} {album}", album]
    for q in queries:
        try:
            data    = search(q)
            results = data.get("results") or []
            albums  = [r for r in results if r.get("type") in ("album", None)]
            if not albums:
                continue
            # Eenvoudige fuzzy-score op artist + album titel
            from core.plex_service import _fuzzy_score
            scored = sorted(
                [
                    {**a, "_score": (_fuzzy_score(artist, a.get("artist") or "")
                                     + _fuzzy_score(album, a.get("title") or "")) / 2}
                    for a in albums
                ],
                key=lambda x: -x["_score"],
            )
            best = scored[0] if scored else None
            if best and best["_score"] > 0.3:
                return best
        except Exception:
            pass
    return None


def find_top_albums(artist: str, album: str, limit: int = 3) -> list[dict]:
    try:
        data    = search(f"{artist} {album}")
        results = data.get("results") or []
        albums  = [r for r in results if r.get("type") in ("album", None)]
        from core.plex_service import _fuzzy_score
        scored = sorted(
            [
                {**a, "_score": (_fuzzy_score(artist, a.get("artist") or "")
                                 + _fuzzy_score(album, a.get("title") or "")) / 2}
                for a in albums
            ],
            key=lambda x: -x["_score"],
        )
        return scored[:limit]
    except Exception:
        return []


def add_to_queue(url: str, item_type: str, title: str, artist: str,
                 item_id: str, quality: str | None = None) -> dict:
    payload: dict = {
        "url":    url,
        "type":   item_type,
        "title":  title,
        "artist": artist,
        "id":     item_id,
    }
    if quality:
        payload["quality"] = quality
    r = requests.post(f"{TIDARR_BASE}/api/queue", json=payload, headers=_headers(), timeout=_TIMEOUT)
    r.raise_for_status()
    return r.json()


def get_queue() -> dict:
    try:
        r = requests.get(f"{TIDARR_BASE}/api/queue", headers=_headers(), timeout=_TIMEOUT)
        r.raise_for_status()
        return r.json()
    except Exception as exc:
        return {"items": [], "error": str(exc)}


def get_history() -> dict:
    try:
        r = requests.get(f"{TIDARR_BASE}/api/history", headers=_headers(), timeout=_TIMEOUT)
        r.raise_for_status()
        return r.json()
    except Exception as exc:
        return {"items": [], "error": str(exc)}


def remove_from_queue(item_id: str) -> dict:
    r = requests.delete(f"{TIDARR_BASE}/api/queue/{item_id}", headers=_headers(), timeout=_TIMEOUT)
    r.raise_for_status()
    return r.json() if r.content else {}
