"""
core/routes/spotify.py — Spotify mood-aanbevelingen als Flask Blueprint.

Migratie van routes/spotify.js naar de Python Core backend.

Endpoints:
  GET /api/core/spotify/recs     — Mood-gebaseerde aanbevelingen (?mood=chill)
  GET /api/core/spotify/status   — Spotify configuratiestatus
"""
from __future__ import annotations

import logging

from flask import Blueprint, jsonify, request

import core.database as db
import core.spotify_client as spotify
from core.lastfm_client import call_api

log = logging.getLogger(__name__)

spotify_bp = Blueprint("spotify", __name__)


@spotify_bp.get("/api/core/spotify/status")
def spotify_status():
    ok = spotify.is_configured()
    return (
        jsonify({"enabled": ok, "moods": list(spotify.MOODS.keys()) if ok else []}),
        200,
        {"Cache-Control": "private, max-age=600"},
    )


@spotify_bp.get("/api/core/spotify/recs")
def spotify_recs():
    if not spotify.is_configured():
        return jsonify([]), 200, {"Cache-Control": "private, max-age=300"}

    mood = (request.args.get("mood") or "").lower().strip()
    audio_features = spotify.MOODS.get(mood)
    if not audio_features:
        return (
            jsonify({"error": f"Onbekende mood: {mood}. Kies uit: {', '.join(spotify.MOODS)}"}),
            400,
        )

    cache_key = f"spotify:recs:{mood}"
    cached = db.get_cache(cache_key, 30 * 60 * 1000)
    if cached:
        return jsonify(cached), 200, {"Cache-Control": "private, max-age=300"}

    try:
        top = call_api("user.gettopartists", {"period": "3month", "limit": 10})
        top_names = [a.get("name") for a in (top.get("topartists", {}).get("artist") or [])[:5]]

        seed_ids = [sid for name in top_names if name for sid in [spotify.search_artist_id(name)] if sid]

        if not seed_ids:
            db.set_cache(cache_key, [])
            return jsonify([]), 200, {"Cache-Control": "private, max-age=300"}

        tracks = spotify.get_recommendations(seed_ids, audio_features)
        result = [
            {
                "name":        t.get("name"),
                "artist":      (t.get("artists") or [{}])[0].get("name", ""),
                "album":       (t.get("album") or {}).get("name", ""),
                "image":       (
                    ((t.get("album") or {}).get("images") or [None, None])[1] or
                    ((t.get("album") or {}).get("images") or [{}])[0] or {}
                ).get("url"),
                "preview_url": t.get("preview_url"),
                "spotify_url": (t.get("external_urls") or {}).get("spotify"),
            }
            for t in tracks
        ]
        db.set_cache(cache_key, result)
        return jsonify(result), 200, {"Cache-Control": "private, max-age=300"}
    except Exception as exc:
        log.warning("GET /api/core/spotify/recs mislukt (graceful fallback): %s", exc)
        return jsonify([]), 200, {"Cache-Control": "private, max-age=300"}
