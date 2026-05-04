"""
lastfm_client.py — Last.fm API client voor de discovery module.

Twee lagen:
  1. call_api() — raw HTTP-wrapper identiek aan lfm() in services/lastfm.js,
     retourneert ruwe JSON zoals de API die stuurt (zelfde formaat als Node.js).
  2. pylast-wrappers — voor discovery-module die Python-objecten verwacht.
"""
from __future__ import annotations

import logging
import os
import time

import pylast
import requests

from core import config

log = logging.getLogger(__name__)

_API_URL = "https://ws.audioscrobbler.com/2.0/"
_MIN_INTERVAL = 0.26   # 260 ms ≈ 3.8 req/sec, zelfde als services/lastfm.js
_last_call: float = 0.0
_session = requests.Session()
_session.headers.update({"Accept": "application/json"})

_network: pylast.LastFMNetwork | None = None


# ── Raw HTTP wrapper ────────────────────────────────────────────────────────────

def call_api(
    method: str,
    params: dict | None = None,
    include_user: bool = True,
) -> dict:
    """
    Roept de Last.fm API aan en geeft de ruwe JSON terug.

    Identiek aan lfm() in services/lastfm.js:
      - Throttelt op ≤3.8 req/sec
      - Gooit RuntimeError bij Last.fm fout-codes
    """
    global _last_call

    if not config.LASTFM_API_KEY:
        raise RuntimeError("LASTFM_API_KEY niet geconfigureerd")

    wait = max(0.0, _MIN_INTERVAL - (time.time() - _last_call))
    if wait > 0:
        time.sleep(wait)
    _last_call = time.time()

    p: dict = {"api_key": config.LASTFM_API_KEY, "format": "json", "method": method}
    if include_user and config.LASTFM_USER:
        p["user"] = config.LASTFM_USER
    if params:
        p.update({k: v for k, v in params.items() if v is not None})

    resp = _session.get(_API_URL, params=p, timeout=10)
    resp.raise_for_status()
    data = resp.json()
    if data.get("error"):
        raise RuntimeError(f"Last.fm fout {data['error']}: {data.get('message', '')}")
    return data


# ── pylast wrappers (voor discovery module) ─────────────────────────────────────

def _get_network() -> pylast.LastFMNetwork:
    global _network
    if _network is None:
        _network = pylast.LastFMNetwork(
            api_key=config.LASTFM_API_KEY,
            api_secret=os.environ.get("LASTFM_API_SECRET", ""),
        )
    return _network


def get_top_artists(period: str = "overall", limit: int = 50) -> list[dict]:
    """Haal top-artiesten op. Returns list van { name, playcount }."""
    if not config.LASTFM_API_KEY or not config.LASTFM_USER:
        log.warning("Last.fm: LASTFM_API_KEY of LASTFM_USER niet geconfigureerd")
        return []
    try:
        net  = _get_network()
        user = net.get_user(config.LASTFM_USER)
        results = user.get_top_artists(period=period, limit=limit)
        return [
            {"name": item.item.name, "playcount": int(item.weight or 0)}
            for item in results
        ]
    except Exception as exc:
        log.warning("Last.fm get_top_artists mislukt (%s): %s", period, exc)
        return []


def get_loved_tracks(limit: int = 50) -> list[str]:
    """Geeft unieke artiestennamen terug van loved tracks."""
    if not config.LASTFM_API_KEY or not config.LASTFM_USER:
        return []
    try:
        net  = _get_network()
        user = net.get_user(config.LASTFM_USER)
        results = user.get_loved_tracks(limit=limit)
        seen: set[str] = set()
        names: list[str] = []
        for t in results:
            name = t.track.artist.name if t.track and t.track.artist else None
            if name and name not in seen:
                seen.add(name)
                names.append(name)
        return names
    except Exception as exc:
        log.warning("Last.fm get_loved_tracks mislukt: %s", exc)
        return []


def get_recent_tracks(limit: int = 50) -> list[str]:
    """Geeft unieke artiestennamen terug van recent tracks."""
    if not config.LASTFM_API_KEY or not config.LASTFM_USER:
        return []
    try:
        net  = _get_network()
        user = net.get_user(config.LASTFM_USER)
        results = user.get_recent_tracks(limit=limit)
        seen: set[str] = set()
        names: list[str] = []
        for t in results:
            name = t.track.artist.name if t.track and t.track.artist else None
            if name and name not in seen:
                seen.add(name)
                names.append(name)
        return names
    except Exception as exc:
        log.warning("Last.fm get_recent_tracks mislukt: %s", exc)
        return []
