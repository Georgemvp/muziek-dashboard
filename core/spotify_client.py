"""
spotify_client.py — Spotify API client voor de Core backend.

Gebruikt de Client Credentials flow (geen gebruikerslogin).
Identiek aan services/spotify.js in de Node.js app.
"""
from __future__ import annotations

import base64
import logging
import time

import requests

from core import config

log = logging.getLogger(__name__)

_SPOTIFY_OK = bool(config.SPOTIFY_CLIENT_ID and config.SPOTIFY_CLIENT_SECRET)

MOODS: dict[str, dict] = {
    "energiek":      {"target_energy": 0.8,  "target_valence": 0.7, "target_tempo": 130},
    "chill":         {"target_energy": 0.3,  "target_valence": 0.5, "target_acousticness": 0.6},
    "melancholisch": {"target_energy": 0.3,  "target_valence": 0.2, "target_acousticness": 0.5},
    "experimenteel": {"target_popularity": 25, "target_instrumentalness": 0.4},
    "feest":         {"target_energy": 0.9,  "target_danceability": 0.8, "target_valence": 0.8},
}

_token: str | None = None
_token_exp: float = 0.0
_session = requests.Session()


def is_configured() -> bool:
    return _SPOTIFY_OK


def _get_token() -> str:
    global _token, _token_exp

    if _token and time.time() < _token_exp - 300:
        return _token

    if not config.SPOTIFY_CLIENT_ID or not config.SPOTIFY_CLIENT_SECRET:
        raise RuntimeError("Spotify credentials niet geconfigureerd")

    creds = base64.b64encode(
        f"{config.SPOTIFY_CLIENT_ID}:{config.SPOTIFY_CLIENT_SECRET}".encode()
    ).decode()

    resp = _session.post(
        "https://accounts.spotify.com/api/token",
        headers={"Authorization": f"Basic {creds}", "Content-Type": "application/x-www-form-urlencoded"},
        data="grant_type=client_credentials",
        timeout=8,
    )
    resp.raise_for_status()
    data = resp.json()
    _token = data["access_token"]
    _token_exp = time.time() + data["expires_in"]
    return _token


def _spotify_get(path: str, params: dict | None = None) -> dict:
    token = _get_token()
    resp  = _session.get(
        f"https://api.spotify.com{path}",
        headers={"Authorization": f"Bearer {token}"},
        params={k: v for k, v in (params or {}).items() if v is not None},
        timeout=8,
    )
    resp.raise_for_status()
    return resp.json()


def search_artist_id(name: str) -> str | None:
    """Zoekt een artiest op naam en geeft zijn Spotify-ID terug, of None."""
    try:
        data    = _spotify_get("/v1/search", {"q": name, "type": "artist", "limit": 5})
        artists = data.get("artists", {}).get("items", [])
        if not artists:
            return None
        exact = next(
            (a for a in artists if a["name"].lower() == name.lower()),
            artists[0],
        )
        return exact["id"]
    except Exception:
        return None


def get_recommendations(seed_artist_ids: list[str], audio_features: dict) -> list[dict]:
    """Haalt aanbevolen tracks op op basis van seed-artiest-IDs en audio-features."""
    ids = seed_artist_ids[:5]
    if not ids:
        return []
    params = {"seed_artists": ",".join(ids), "limit": 20, **audio_features}
    data   = _spotify_get("/v1/recommendations", params)
    return data.get("tracks", [])
