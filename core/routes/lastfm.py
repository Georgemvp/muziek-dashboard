"""
core/routes/lastfm.py — Last.fm & artiest-routes als Flask Blueprint.

Migratie van routes/lastfm.js en routes/artist.js naar de Python Core backend.
Alle endpoints vallen onder /api/core/* en worden via de Express proxy bereikt.

Endpoints:
  GET /api/core/user                     — Last.fm gebruikersprofiel
  GET /api/core/recent                   — Recente tracks
  GET /api/core/top/artists              — Top artiesten (?period=7day)
  GET /api/core/top/tracks               — Top tracks (?period=7day)
  GET /api/core/top/albums               — Top albums (?period=overall)
  GET /api/core/loved                    — Loved tracks
  GET /api/core/artist/search            — Artiest zoeken via Deezer (?q=naam)
  GET /api/core/artist/<name>            — Artiest detail (Deezer + MBZ + Plex)
  GET /api/core/artist/<name>/info       — Alias voor /<name>
  GET /api/core/artist/<name>/similar    — Vergelijkbare artiesten via Deezer
  GET /api/core/genre/<genre>            — Artiesten per genre uit Plex
"""
from __future__ import annotations

import contextlib
import logging
from urllib.parse import unquote

from flask import Blueprint, jsonify, request

import core.database as db
import core.deezer_client as deezer
import core.plex_client as plex
from core.lastfm_client import call_api

log = logging.getLogger(__name__)

lastfm_bp = Blueprint("lastfm", __name__)

# ── Stale-or-error helper ──────────────────────────────────────────────────────

def _stale_or_503(cache_key: str, err: Exception):
    stale = db.get_cache(cache_key, float("inf"))
    if stale:
        return jsonify({**stale, "_stale": True, "_staleReason": str(err)}), 200
    return jsonify({"error": "Last.fm is tijdelijk niet bereikbaar.", "_lfmDown": True}), 503


# ── /api/core/user ─────────────────────────────────────────────────────────────

@lastfm_bp.get("/api/core/user")
def get_user():
    cache_key = "api:core:user"
    cached = db.get_cache(cache_key, 300_000)
    if cached:
        return jsonify(cached), 200, {"Cache-Control": "private, max-age=600"}
    try:
        data = call_api("user.getinfo")
        db.set_cache(cache_key, data)
        return jsonify(data), 200, {"Cache-Control": "private, max-age=600"}
    except Exception as exc:
        log.warning("GET /api/core/user mislukt: %s", exc)
        return _stale_or_503(cache_key, exc)


# ── /api/core/recent ───────────────────────────────────────────────────────────

@lastfm_bp.get("/api/core/recent")
def get_recent():
    cache_key = "api:core:recent"
    cached = db.get_cache(cache_key, 120_000)
    if cached:
        return jsonify(cached), 200, {"Cache-Control": "private, max-age=30"}
    try:
        data = call_api("user.getrecenttracks", {"limit": 20})
        db.set_cache(cache_key, data)
        return jsonify(data), 200, {"Cache-Control": "private, max-age=30"}
    except Exception as exc:
        log.warning("GET /api/core/recent mislukt: %s", exc)
        return _stale_or_503(cache_key, exc)


# ── /api/core/top/artists ──────────────────────────────────────────────────────

@lastfm_bp.get("/api/core/top/artists")
def get_top_artists():
    period    = request.args.get("period", "7day")
    cache_key = f"api:core:top:artists:{period}"
    cached = db.get_cache(cache_key, 300_000)
    if cached:
        return jsonify(cached), 200, {"Cache-Control": "private, max-age=300"}
    try:
        data = call_api("user.gettopartists", {"period": period, "limit": 20})
        db.set_cache(cache_key, data)
        return jsonify(data), 200, {"Cache-Control": "private, max-age=300"}
    except Exception as exc:
        log.warning("GET /api/core/top/artists mislukt: %s", exc)
        return _stale_or_503(cache_key, exc)


# ── /api/core/top/tracks ──────────────────────────────────────────────────────

@lastfm_bp.get("/api/core/top/tracks")
def get_top_tracks():
    period    = request.args.get("period", "7day")
    cache_key = f"api:core:top:tracks:{period}"
    cached = db.get_cache(cache_key, 300_000)
    if cached:
        return jsonify(cached), 200, {"Cache-Control": "private, max-age=300"}
    try:
        data = call_api("user.gettoptracks", {"period": period, "limit": 20})
        db.set_cache(cache_key, data)
        return jsonify(data), 200, {"Cache-Control": "private, max-age=300"}
    except Exception as exc:
        log.warning("GET /api/core/top/tracks mislukt: %s", exc)
        return _stale_or_503(cache_key, exc)


# ── /api/core/top/albums ──────────────────────────────────────────────────────

@lastfm_bp.get("/api/core/top/albums")
def get_top_albums():
    period    = request.args.get("period", "overall")
    cache_key = f"api:core:top:albums:{period}"
    cached = db.get_cache(cache_key, 600_000)
    if cached:
        return jsonify(cached), 200, {"Cache-Control": "private, max-age=600"}
    try:
        data    = call_api("user.gettopalbums", {"period": period, "limit": 50})
        albums  = [
            {
                "name":      a.get("name"),
                "artist":    (a.get("artist") or {}).get("name") or a.get("artist") or "",
                "playcount": int(a.get("playcount", 0) or 0),
                "url":       a.get("url"),
                "image":     a.get("image"),
            }
            for a in (data.get("topalbums", {}).get("album") or [])
        ]
        result = {"topalbums": {"album": albums}}
        db.set_cache(cache_key, result)
        return jsonify(result), 200, {"Cache-Control": "private, max-age=600"}
    except Exception as exc:
        log.warning("GET /api/core/top/albums mislukt: %s", exc)
        return _stale_or_503(cache_key, exc)


# ── /api/core/loved ───────────────────────────────────────────────────────────

@lastfm_bp.get("/api/core/loved")
def get_loved():
    cache_key = "api:core:loved"
    cached = db.get_cache(cache_key, 600_000)
    if cached:
        return jsonify(cached), 200, {"Cache-Control": "private, max-age=600"}
    try:
        data = call_api("user.getlovedtracks", {"limit": 50})
        db.set_cache(cache_key, data)
        return jsonify(data), 200, {"Cache-Control": "private, max-age=600"}
    except Exception as exc:
        log.warning("GET /api/core/loved mislukt: %s", exc)
        return _stale_or_503(cache_key, exc)


# ── /api/core/artist/search ───────────────────────────────────────────────────
# Gebruikt Deezer als primaire zoekbron (zelfde als /api/search in Node.js)

@lastfm_bp.get("/api/core/artist/search")
def artist_search():
    q = (request.args.get("q") or "").strip()
    if len(q) < 2:
        return jsonify({"results": []}), 200, {"Cache-Control": "private, max-age=300"}
    try:
        artists = deezer.search_artists(q)
        results = [
            {
                "name":      a["name"],
                "listeners": a.get("nb_fan", 0),
                "image":     a.get("picture_medium"),
            }
            for a in artists
        ]
        return jsonify({"results": results}), 200, {"Cache-Control": "private, max-age=300"}
    except Exception as exc:
        log.warning("GET /api/core/artist/search mislukt: %s", exc)
        return jsonify({"results": [], "error": str(exc)}), 200, {"Cache-Control": "private, max-age=300"}


# ── Artist detail helper ──────────────────────────────────────────────────────

def _fetch_artist_info(name: str) -> dict:
    """
    Haalt artiest-info op via Deezer + MBZ + Plex.
    Gecached 1 uur. Identiek aan fetchArtistInfo() in routes/artist.js.
    """
    cache_key = f"api:core:artist:info:{name.lower()}"
    cached = db.get_cache(cache_key, 3_600_000)
    if cached:
        return cached

    artist_obj = deezer.get_artist_full(name)
    image      = artist_obj["image"]   if artist_obj else None
    image_xl   = artist_obj["imageXl"] if artist_obj else None
    deezer_id  = artist_obj["id"]      if artist_obj else None

    albums: list[dict] = []
    if deezer_id:
        raw = deezer.get_artist_albums(deezer_id)
        for a in raw:
            if not a.get("title") or a["title"] in ("(null)", "[unknown]"):
                continue
            rt = a.get("record_type")
            if rt and rt not in ("album", "ep"):
                continue
            in_plex = plex.album_in_plex(name, a["title"])
            albums.append({
                "name":      a["title"],
                "image":     a.get("cover_medium"),
                "playcount": 0,
                "inPlex":    in_plex,
                "ratingKey": None,
            })
        albums = albums[:50]

    # MBZ-data uit enrichment cache (eerder door enrichment worker gevuld)
    mbz_data  = db.get_enrichment_data_by_source("artist", name, "musicbrainz") or {}
    tags_raw  = mbz_data.get("tags") or []
    tags      = [{"name": t} for t in tags_raw] if tags_raw and isinstance(tags_raw[0], str) else tags_raw
    start_year = None
    begin_date = mbz_data.get("begin_date") or ""
    if begin_date and len(begin_date) >= 4:
        with contextlib.suppress(ValueError):
            start_year = int(begin_date[:4])

    result = {
        "image":     image,
        "imageXl":   image_xl,
        "albums":    albums,
        "inPlex":    plex.artist_in_plex(name),
        "country":   mbz_data.get("country"),
        "startYear": start_year,
        "tags":      tags[:10],
        "mbid":      mbz_data.get("mbid"),
    }
    db.set_cache(cache_key, result)
    return result


# ── /api/core/artist/<name> and /api/core/artist/<name>/info ──────────────────

@lastfm_bp.get("/api/core/artist/<path:name>")
def get_artist(name: str):
    name = unquote(name)
    # Intercept sub-routes
    if name.endswith("/info"):
        name = name[:-5]
        return _artist_info_response(name)
    if name.endswith("/similar"):
        name = name[:-8]
        return _artist_similar_response(name)
    return _artist_info_response(name)


def _artist_info_response(name: str):
    try:
        result = _fetch_artist_info(name)
        return jsonify(result), 200, {"Cache-Control": "private, max-age=3600"}
    except Exception as exc:
        log.warning("GET /api/core/artist/%s mislukt: %s", name, exc)
        return jsonify({
            "error": str(exc), "image": None, "imageXl": None,
            "albums": [], "inPlex": False, "tags": [],
        }), 500


def _artist_similar_response(name: str):
    try:
        similar = deezer.get_similar_artists(name, 6)
        return jsonify({
            "similar": similar or [],
            "source":  "deezer",
            "count":   len(similar or []),
        }), 200, {"Cache-Control": "private, max-age=300"}
    except Exception as exc:
        log.warning("GET /api/core/artist/%s/similar mislukt: %s", name, exc)
        return jsonify({"similar": [], "source": "error", "error": str(exc)}), 200


# ── /api/core/genre/<genre> ───────────────────────────────────────────────────

@lastfm_bp.get("/api/core/genre/<path:genre>")
def get_genre_artists(genre: str):
    genre = unquote(genre)
    try:
        # Haal alle artiesten op uit Plex en filter op genre via enrichment data
        cache_key = f"api:core:genre:{genre.lower()}"
        cached = db.get_cache(cache_key, 3_600_000)
        if cached:
            return jsonify(cached), 200, {"Cache-Control": "private, max-age=1800"}

        # Doorzoek enrichment data op artiesten met dit genre
        with db.get_db() as conn:
            rows = conn.execute(
                "SELECT entity_name, data_json FROM enrichment_data "
                "WHERE entity_type = 'artist' AND source = 'musicbrainz'",
            ).fetchall()

        import json
        genre_lower = genre.lower()
        artists: list[dict] = []
        for row in rows:
            try:
                data = json.loads(row["data_json"])
            except Exception:
                continue
            tags = data.get("tags") or []
            tag_names = [t.lower() if isinstance(t, str) else (t.get("name") or "").lower() for t in tags]
            if genre_lower in tag_names:
                artist_name = row["entity_name"]
                artists.append({
                    "name":    artist_name,
                    "inPlex":  plex.artist_in_plex(artist_name),
                    "country": data.get("country"),
                })

        result = {"genre": genre, "artists": artists[:50], "count": len(artists)}
        db.set_cache(cache_key, result)
        return jsonify(result), 200, {"Cache-Control": "private, max-age=1800"}
    except Exception as exc:
        log.warning("GET /api/core/genre/%s mislukt: %s", genre, exc)
        return jsonify({"genre": genre, "artists": [], "error": str(exc)}), 200
