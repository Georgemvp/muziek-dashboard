"""
lastfm_client.py — Last.fm API client voor de discovery module.

Dunne wrapper om pylast voor de calls die discovery nodig heeft:
top artists, loved tracks, recent tracks.
"""
from __future__ import annotations

import logging
import os

import pylast

from core import config

log = logging.getLogger(__name__)

_network: pylast.LastFMNetwork | None = None


def _get_network() -> pylast.LastFMNetwork:
    global _network
    if _network is None:
        _network = pylast.LastFMNetwork(
            api_key=config.LASTFM_API_KEY,
            api_secret=os.environ.get("LASTFM_API_SECRET", ""),
        )
    return _network


def get_top_artists(period: str = "overall", limit: int = 50) -> list[dict]:
    """
    Haal top-artiesten op voor de geconfigureerde Last.fm user.

    period: 'overall', '12month', '6month', '3month', '1month', '7day'

    Returns list van { name, playcount }.
    """
    if not config.LASTFM_API_KEY or not config.LASTFM_USER:
        log.warning("Last.fm: LASTFM_API_KEY of LASTFM_USER niet geconfigureerd")
        return []
    try:
        net  = _get_network()
        user = net.get_user(config.LASTFM_USER)
        results = user.get_top_artists(period=period, limit=limit)
        return [
            {
                "name":      item.item.name,
                "playcount": int(item.weight or 0),
            }
            for item in results
        ]
    except Exception as exc:
        log.warning("Last.fm get_top_artists mislukt (%s): %s", period, exc)
        return []


def get_loved_tracks(limit: int = 50) -> list[str]:
    """
    Geeft unieke artiestennamen terug van loved tracks.
    """
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
    """
    Geeft unieke artiestennamen terug van recent tracks.
    """
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
