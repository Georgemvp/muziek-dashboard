"""
core/routes/plex.py — Plex API routes als Flask Blueprint.

Port van routes/plex.js. Alle endpoints onder /api/core/plex/*.
Webhook + SSE blijven in de Node-laag (vereisen in-process state).
"""
from __future__ import annotations

import logging
import re

import requests
from flask import Blueprint, Response, jsonify, request, stream_with_context

import core.database as db
import core.plex_service as plex
from core import config

log = logging.getLogger(__name__)

plex_bp = Blueprint("plex", __name__)

PLEX_TOKEN = config.PLEX_TOKEN or ""
PLEX_URL   = (config.PLEX_URL or "").rstrip("/")


# ── /api/core/plex/thumb ─────────────────────────────────────────────────────
# Image-proxy: haalt Plex-thumbnails server-side op zodat PLEX_TOKEN
# de browser nooit bereikt. SSRF-bescherming: alleen /library en /photo.

@plex_bp.get("/api/core/plex/thumb")
def plex_thumb():
    thumb_path = request.args.get("path", "")
    if not thumb_path or not thumb_path.startswith("/"):
        return "", 400
    if not re.match(r"^/(library|photo)/", thumb_path):
        return "", 400
    try:
        sep = "&" if "?" in thumb_path else "?"
        url = f"{PLEX_URL}{thumb_path}{sep}X-Plex-Token={PLEX_TOKEN}"
        upstream = requests.get(url, timeout=8, stream=True)
        if not upstream.ok:
            return "", upstream.status_code
        ct = upstream.headers.get("content-type", "image/jpeg")

        def _gen():
            for chunk in upstream.iter_content(8192):
                yield chunk

        return Response(
            stream_with_context(_gen()),
            status=200,
            content_type=ct,
            headers={"Cache-Control": "private, max-age=86400"},
        )
    except Exception as exc:
        log.warning("Plex thumb proxy fout: %s", exc)
        return "", 502


# ── /api/core/plex/status ─────────────────────────────────────────────────────

@plex_bp.get("/api/core/plex/status")
def plex_status():
    if not PLEX_TOKEN:
        return jsonify({"connected": False, "reason": "Geen PLEX_TOKEN"}), 200
    try:
        plex.sync_library(True)
        s = plex.get_status()
        return jsonify({
            "connected": s["ok"],
            "artists":   s["artistCount"],
            "albums":    s["albumCount"],
            "tracks":    s["trackCount"],
            "lastSync":  s["lastSync"],
        }), 200, {"Cache-Control": "private, max-age=300"}
    except Exception as exc:
        return jsonify({"connected": False, "reason": str(exc)}), 200, {"Cache-Control": "private, max-age=300"}


# ── /api/core/plex/refresh ────────────────────────────────────────────────────

@plex_bp.post("/api/core/plex/refresh")
def plex_refresh():
    if not PLEX_TOKEN:
        return jsonify({"connected": False, "reason": "Geen PLEX_TOKEN"})
    try:
        plex.sync_library(True)
        s = plex.get_status()
        return jsonify({
            "connected": s["ok"],
            "artists":   s["artistCount"],
            "albums":    s["albumCount"],
            "tracks":    s["trackCount"],
            "lastSync":  s["lastSync"],
        })
    except Exception as exc:
        return jsonify({"connected": False, "reason": str(exc)})


# ── /api/core/plex/nowplaying ─────────────────────────────────────────────────
# Pollt de Plex API (webhook-state zit in Node; dit is de fallback).

@plex_bp.get("/api/core/plex/nowplaying")
def plex_nowplaying():
    if not PLEX_TOKEN:
        return jsonify({"playing": False}), 200, {"Cache-Control": "private, max-age=30"}
    try:
        data  = plex.plex_get("/status/sessions")
        music = next(
            (m for m in ((data.get("MediaContainer") or {}).get("Metadata") or [])
             if m.get("type") == "track"),
            None,
        )
        if not music:
            return jsonify({"playing": False}), 200, {"Cache-Control": "private, max-age=30"}
        tp = music.get("parentThumb") or music.get("grandparentThumb")
        return jsonify({
            "playing":        (music.get("Player") or {}).get("state") != "paused",
            "paused":         (music.get("Player") or {}).get("state") == "paused",
            "track":          music.get("title"),
            "artist":         music.get("grandparentTitle") or music.get("originalTitle"),
            "album":          music.get("parentTitle"),
            "ratingKey":      music.get("ratingKey"),
            "albumRatingKey": music.get("parentRatingKey"),
            "thumb":          (f"/api/core/plex/thumb?path={requests.utils.quote(tp)}" if tp else None),
            "duration":       music.get("duration"),
            "viewOffset":     music.get("viewOffset"),
            "state":          (music.get("Player") or {}).get("state") or "playing",
            "playerName":     (music.get("Player") or {}).get("title"),
            "playerProduct":  (music.get("Player") or {}).get("product"),
            "machineId":      (music.get("Player") or {}).get("machineIdentifier"),
            "source":         "poll",
        }), 200, {"Cache-Control": "private, max-age=30"}
    except Exception:
        return jsonify({"playing": False}), 200, {"Cache-Control": "private, max-age=30"}


# ── /api/core/plex/library ────────────────────────────────────────────────────

@plex_bp.get("/api/core/plex/library")
def plex_library():
    if not PLEX_TOKEN:
        return jsonify({"connected": False, "artistCount": 0, "albumCount": 0, "total": 0, "library": []}), 200, {"Cache-Control": "private, max-age=300"}
    page  = max(1, int(request.args.get("page")  or 1))
    limit = min(500, max(1, int(request.args.get("limit") or 100)))
    q     = (request.args.get("q") or "").lower().strip()
    sort  = request.args.get("sort")

    lib = plex.get_library()
    if q:
        lib = [x for x in lib if q in x["artist"].lower() or q in x["album"].lower()]
    if sort == "addedAt:desc":
        lib = sorted(lib, key=lambda x: -(x.get("addedAt") or 0))
    elif sort == "addedAt:asc":
        lib = sorted(lib, key=lambda x: (x.get("addedAt") or 0))

    s     = plex.get_status()
    total = len(lib)
    slice_  = lib[(page - 1) * limit : page * limit]
    items = [
        {**x, "thumb": (f"/api/core/plex/thumb?path={requests.utils.quote(x['thumb'])}" if x.get("thumb") else None)}
        for x in slice_
    ]
    return jsonify({"connected": s["ok"], "artistCount": s["artistCount"], "total": total, "page": page, "limit": limit, "library": items}), 200, {"Cache-Control": "private, max-age=300"}


@plex_bp.get("/api/core/plex/library/all")
def plex_library_all():
    if not PLEX_TOKEN:
        return jsonify({"ok": False, "library": []}), 200, {"Cache-Control": "private, max-age=300"}
    try:
        plex.sync_library(False)
        lib     = plex.get_library()
        compact = [
            [
                x["artist"],
                x["album"],
                x.get("ratingKey") or "",
                (f"/api/core/plex/thumb?path={requests.utils.quote(x['thumb'])}" if x.get("thumb") else ""),
                x.get("addedAt") or 0,
            ]
            for x in lib
        ]
        return jsonify({"ok": True, "total": len(compact), "library": compact}), 200, {"Cache-Control": "private, max-age=300"}
    except Exception as exc:
        return jsonify({"ok": False, "error": str(exc), "library": []}), 500, {"Cache-Control": "private, max-age=300"}


# ── /api/core/plex/playlists ──────────────────────────────────────────────────

@plex_bp.get("/api/core/plex/playlists")
def plex_playlists():
    if not PLEX_TOKEN:
        return jsonify({"playlists": []}), 200, {"Cache-Control": "private, max-age=300"}
    try:
        cached = db.get_cache("api:plex:playlists", 300_000)
        if cached:
            return jsonify(cached), 200, {"Cache-Control": "private, max-age=300"}
        playlists = plex.get_playlists()
        result    = {"playlists": playlists}
        db.set_cache("api:plex:playlists", result)
        return jsonify(result), 200, {"Cache-Control": "private, max-age=300"}
    except Exception as exc:
        return jsonify({"error": str(exc), "playlists": []}), 500, {"Cache-Control": "private, max-age=300"}


@plex_bp.get("/api/core/plex/playlists/<key>/tracks")
def plex_playlist_tracks(key: str):
    if not PLEX_TOKEN:
        return jsonify({"tracks": []}), 200, {"Cache-Control": "private, max-age=60"}
    try:
        cached = db.get_cache(f"api:plex:playlist:{key}", 120_000)
        if cached:
            return jsonify(cached), 200, {"Cache-Control": "private, max-age=120"}
        tracks = plex.get_playlist_tracks(key)
        result = {"tracks": tracks}
        db.set_cache(f"api:plex:playlist:{key}", result)
        return jsonify(result), 200, {"Cache-Control": "private, max-age=120"}
    except Exception as exc:
        return jsonify({"error": str(exc), "tracks": []}), 500, {"Cache-Control": "private, max-age=120"}


@plex_bp.get("/api/core/plex/album/<key>/tracks")
def plex_album_tracks(key: str):
    if not PLEX_TOKEN:
        return jsonify({"tracks": []}), 200, {"Cache-Control": "private, max-age=60"}
    try:
        cached = db.get_cache(f"api:plex:album:{key}", 120_000)
        if cached:
            return jsonify(cached), 200, {"Cache-Control": "private, max-age=600"}
        tracks = plex.get_album_tracks(key)
        result = {"tracks": tracks}
        db.set_cache(f"api:plex:album:{key}", result)
        return jsonify(result), 200, {"Cache-Control": "private, max-age=600"}
    except Exception as exc:
        return jsonify({"error": str(exc), "tracks": []}), 500, {"Cache-Control": "private, max-age=600"}


# ── /api/core/plex/clients ────────────────────────────────────────────────────

@plex_bp.get("/api/core/plex/clients")
def plex_clients():
    if not PLEX_TOKEN:
        return jsonify({"clients": []})
    try:
        force   = bool(request.args.get("t"))
        clients = plex.get_clients(force)
        return jsonify({"clients": clients}), 200, {"Cache-Control": "no-store"}
    except Exception as exc:
        return jsonify({"clients": [], "error": str(exc)})


@plex_bp.get("/api/core/plex/clients/debug")
def plex_clients_debug():
    if not PLEX_TOKEN:
        return jsonify({"error": "Geen PLEX_TOKEN"}), 503
    try:
        sessions_raw = plex.plex_get("/status/sessions")
        clients_raw  = plex.plex_get("/clients")
        sessions = [
            {
                "title": m.get("title"), "type": m.get("type"),
                "player": {
                    "machineId": (m.get("Player") or {}).get("machineIdentifier"),
                    "name":      (m.get("Player") or {}).get("title"),
                    "product":   (m.get("Player") or {}).get("product"),
                    "state":     (m.get("Player") or {}).get("state"),
                    "address":   (m.get("Player") or {}).get("address"),
                    "port":      (m.get("Player") or {}).get("port"),
                } if m.get("Player") else None,
            }
            for m in ((sessions_raw.get("MediaContainer") or {}).get("Metadata") or [])
        ]
        clients = [
            {"name": c.get("name"), "machineId": c.get("machineIdentifier"),
             "product": c.get("product"), "host": c.get("host"), "port": c.get("port")}
            for c in ((clients_raw.get("MediaContainer") or {}).get("Server") or [])
        ]
        return jsonify({"sessions": sessions, "clients": clients})
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


# ── /api/core/plex/remotequeue ────────────────────────────────────────────────

@plex_bp.get("/api/core/plex/remotequeue")
def plex_remotequeue():
    if not PLEX_TOKEN:
        return jsonify({"tracks": [], "currentRatingKey": None})
    try:
        machine_id = request.args.get("machineId")
        data       = plex.plex_get("/status/sessions")
        sessions   = (data.get("MediaContainer") or {}).get("Metadata") or []

        session = None
        if machine_id:
            session = next((s for s in sessions if s.get("type") == "track"
                            and (s.get("Player") or {}).get("machineIdentifier") == machine_id), None)
        if not session:
            session = next((s for s in sessions if s.get("type") == "track"), None)
        if not session:
            return jsonify({"tracks": [], "currentRatingKey": None})

        current_rk = session.get("ratingKey")
        play_queue_id = session.get("playQueueID")

        def _map(item: dict) -> dict:
            tp = item.get("parentThumb") or item.get("grandparentThumb")
            return {
                "ratingKey":      item.get("ratingKey"),
                "title":          item.get("title") or "",
                "artist":         item.get("grandparentTitle") or item.get("originalTitle") or "",
                "album":          item.get("parentTitle") or "",
                "duration":       item.get("duration") or 0,
                "thumb":          (f"/api/core/plex/thumb?path={requests.utils.quote(tp)}" if tp else None),
                "playQueueItemID": item.get("playQueueItemID"),
            }

        if play_queue_id:
            try:
                qdata = plex.plex_get(f"/playQueues/{play_queue_id}?type=audio")
                items = (qdata.get("MediaContainer") or {}).get("Metadata") or []
                if items:
                    return jsonify({"tracks": [_map(i) for i in items], "currentRatingKey": current_rk, "source": "playQueue"})
            except Exception:
                pass

        album_rk = session.get("parentRatingKey")
        if album_rk:
            album_tracks = plex.get_album_tracks(album_rk)
            return jsonify({"tracks": album_tracks, "currentRatingKey": current_rk, "source": "albumTracks"})

        stp = session.get("parentThumb") or session.get("grandparentThumb")
        return jsonify({
            "tracks": [{
                "ratingKey": session.get("ratingKey"),
                "title":     session.get("title") or "",
                "artist":    session.get("grandparentTitle") or session.get("originalTitle") or "",
                "album":     session.get("parentTitle") or "",
                "duration":  session.get("duration") or 0,
                "thumb":     (f"/api/core/plex/thumb?path={requests.utils.quote(stp)}" if stp else None),
            }],
            "currentRatingKey": current_rk,
            "source": "singleTrack",
        })
    except Exception as exc:
        log.warning("Remote queue ophalen mislukt: %s", exc)
        return jsonify({"tracks": [], "currentRatingKey": None, "error": str(exc)})


# ── /api/core/plex/play ───────────────────────────────────────────────────────

@plex_bp.post("/api/core/plex/play")
def plex_play():
    if not PLEX_TOKEN:
        return jsonify({"error": "Geen PLEX_TOKEN"}), 503
    body       = request.get_json(silent=True) or {}
    machine_id = body.get("machineId")
    rating_key = body.get("ratingKey")
    media_type = body.get("type", "music")
    if not machine_id or not rating_key:
        return jsonify({"error": "machineId en ratingKey zijn vereist"}), 400
    try:
        if machine_id == "__web__":
            data = plex.plex_get(f"/library/metadata/{rating_key}")
            meta = ((data.get("MediaContainer") or {}).get("Metadata") or [None])[0]
            if not meta:
                return jsonify({"error": "Track niet gevonden"}), 404
            tp = meta.get("parentThumb")
            return jsonify({
                "ok":        True,
                "webStream": f"/api/core/plex/stream/audio/{rating_key}",
                "track":     meta.get("title"),
                "artist":    meta.get("grandparentTitle") or meta.get("originalTitle"),
                "album":     meta.get("parentTitle"),
                "thumb":     (f"/api/core/plex/thumb?path={requests.utils.quote(tp)}" if tp else None),
                "duration":  meta.get("duration"),
            })
        plex.play_on_client(machine_id, str(rating_key), media_type)
        return jsonify({"ok": True})
    except Exception as exc:
        return jsonify({"ok": False, "error": str(exc)}), 500


@plex_bp.post("/api/core/plex/pause")
def plex_pause():
    if not PLEX_TOKEN:
        return jsonify({"error": "Geen PLEX_TOKEN"}), 503
    body = request.get_json(silent=True) or {}
    mid  = body.get("machineId")
    if not mid:
        return jsonify({"error": "machineId is vereist"}), 400
    try:
        plex.pause_client(mid)
        return jsonify({"ok": True})
    except Exception as exc:
        return jsonify({"ok": False, "error": str(exc)}), 500


@plex_bp.post("/api/core/plex/stop")
def plex_stop():
    if not PLEX_TOKEN:
        return jsonify({"error": "Geen PLEX_TOKEN"}), 503
    body = request.get_json(silent=True) or {}
    mid  = body.get("machineId")
    if not mid:
        return jsonify({"error": "machineId is vereist"}), 400
    try:
        plex.stop_client(mid)
        return jsonify({"ok": True})
    except Exception as exc:
        return jsonify({"ok": False, "error": str(exc)}), 500


@plex_bp.post("/api/core/plex/skip")
def plex_skip():
    if not PLEX_TOKEN:
        return jsonify({"error": "Geen PLEX_TOKEN"}), 503
    body      = request.get_json(silent=True) or {}
    mid       = body.get("machineId")
    direction = body.get("direction", "next")
    if not mid:
        return jsonify({"error": "machineId is vereist"}), 400
    try:
        if direction == "prev":
            plex.skip_prev(mid)
        else:
            plex.skip_next(mid)
        return jsonify({"ok": True})
    except Exception as exc:
        return jsonify({"ok": False, "error": str(exc)}), 500


@plex_bp.post("/api/core/plex/skip/next")
def plex_skip_next():
    if not PLEX_TOKEN:
        return jsonify({"error": "Geen PLEX_TOKEN"}), 503
    body = request.get_json(silent=True) or {}
    mid  = body.get("machineId")
    if not mid:
        return jsonify({"error": "machineId is vereist"}), 400
    try:
        plex.skip_next(mid)
        return jsonify({"ok": True})
    except Exception as exc:
        return jsonify({"ok": False, "error": str(exc)}), 500


@plex_bp.post("/api/core/plex/skip/prev")
def plex_skip_prev():
    if not PLEX_TOKEN:
        return jsonify({"error": "Geen PLEX_TOKEN"}), 503
    body = request.get_json(silent=True) or {}
    mid  = body.get("machineId")
    if not mid:
        return jsonify({"error": "machineId is vereist"}), 400
    try:
        plex.skip_prev(mid)
        return jsonify({"ok": True})
    except Exception as exc:
        return jsonify({"ok": False, "error": str(exc)}), 500


@plex_bp.post("/api/core/plex/rate")
def plex_rate():
    if not PLEX_TOKEN:
        return jsonify({"error": "Geen PLEX_TOKEN"}), 503
    body       = request.get_json(silent=True) or {}
    rating_key = body.get("ratingKey")
    rating     = body.get("rating")
    if not rating_key:
        return jsonify({"error": "ratingKey is vereist"}), 400
    if not isinstance(rating, int) or not (0 <= rating <= 10):
        return jsonify({"error": "rating moet een geheel getal tussen 0 en 10 zijn"}), 400
    try:
        plex.rate_item(str(rating_key), rating)
        return jsonify({"ok": True})
    except Exception as exc:
        return jsonify({"ok": False, "error": str(exc)}), 500


# ── /api/core/plex/refresh-library ───────────────────────────────────────────

@plex_bp.post("/api/core/plex/refresh-library")
def plex_refresh_library():
    if not PLEX_TOKEN:
        return jsonify({"error": "Geen PLEX_TOKEN"}), 503
    try:
        plex.trigger_scan()
        return jsonify({"ok": True})
    except Exception as exc:
        return jsonify({"ok": False, "error": str(exc)}), 500


# ── /api/core/plex/artists ────────────────────────────────────────────────────

@plex_bp.get("/api/core/plex/artists")
def plex_artists():
    if not PLEX_TOKEN:
        return jsonify({"artists": []}), 200, {"Cache-Control": "private, max-age=300"}
    try:
        cache_key = "api:plex:artists:all"
        cached    = db.get_cache(cache_key, 600_000)
        if cached:
            return jsonify(cached), 200, {"Cache-Control": "private, max-age=600"}
        plex.sync_library(False)
        data = plex.plex_get("/library/sections")
        music = next((s for s in (data.get("MediaContainer", {}).get("Directory") or [])
                      if s.get("type") == "artist"), None)
        if not music:
            return jsonify({"artists": []}), 200, {"Cache-Control": "private, max-age=300"}
        adata = plex.plex_get(f"/library/sections/{music['key']}/all?type=8")
        meta  = (adata.get("MediaContainer") or {}).get("Metadata") or []
        artists = sorted(
            [
                {
                    "ratingKey":  a.get("ratingKey"),
                    "title":      a.get("title") or "",
                    "thumb":      (f"/api/core/plex/thumb?path={requests.utils.quote(a['thumb'])}" if a.get("thumb") else None),
                    "albumCount": a.get("leafCount") or 0,
                    "genre":      ", ".join(g.get("tag", "") for g in (a.get("Genre") or [])),
                }
                for a in meta
            ],
            key=lambda x: x["title"].lower(),
        )
        result = {"artists": artists}
        db.set_cache(cache_key, result)
        return jsonify(result), 200, {"Cache-Control": "private, max-age=600"}
    except Exception as exc:
        return jsonify({"error": str(exc), "artists": []}), 500, {"Cache-Control": "private, max-age=300"}


@plex_bp.get("/api/core/plex/artists/<rating_key>")
def plex_artist_detail(rating_key: str):
    if not PLEX_TOKEN:
        return jsonify({"artist": None}), 200, {"Cache-Control": "private, max-age=60"}
    try:
        cache_key = f"api:plex:artist:{rating_key}"
        cached    = db.get_cache(cache_key, 300_000)
        if cached:
            return jsonify(cached), 200, {"Cache-Control": "private, max-age=300"}
        adata  = plex.plex_get(f"/library/metadata/{rating_key}")
        ameta  = ((adata.get("MediaContainer") or {}).get("Metadata") or [None])[0]
        if not ameta:
            return jsonify({"error": "Artiest niet gevonden"}), 404
        abdata = plex.plex_get(f"/library/metadata/{rating_key}/children")
        albums = [
            {
                "ratingKey":  a.get("ratingKey"),
                "title":      a.get("title"),
                "year":       a.get("year"),
                "thumb":      (f"/api/core/plex/thumb?path={requests.utils.quote(a['thumb'])}" if a.get("thumb") else None),
                "trackCount": a.get("leafCount") or 0,
            }
            for a in ((abdata.get("MediaContainer") or {}).get("Metadata") or [])
        ]
        genres = [
            (g if isinstance(g, str) else g.get("tag", ""))
            for g in (ameta.get("Genre") or [])
        ]
        result = {
            "artist": {
                "ratingKey":   ameta.get("ratingKey"),
                "title":       ameta.get("title"),
                "thumb":       (f"/api/core/plex/thumb?path={requests.utils.quote(ameta['thumb'])}" if ameta.get("thumb") else None),
                "albums":      albums,
                "genres":      genres,
                "totalTracks": sum(a["trackCount"] for a in albums),
            }
        }
        db.set_cache(cache_key, result)
        return jsonify(result), 200, {"Cache-Control": "private, max-age=300"}
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500, {"Cache-Control": "private, max-age=60"}


# ── /api/core/plex/tracks ─────────────────────────────────────────────────────

@plex_bp.get("/api/core/plex/tracks")
def plex_tracks():
    if not PLEX_TOKEN:
        return jsonify({"tracks": [], "total": 0}), 200, {"Cache-Control": "private, max-age=60"}
    try:
        artist_q = (request.args.get("artist") or "").strip().lower()
        album_q  = (request.args.get("album")  or "").strip().lower()
        raw      = int(request.args.get("limit") or 100)
        limit    = 999_999 if raw == 0 else min(500, max(1, raw))
        offset   = max(0, int(request.args.get("offset") or 0))

        cache_key = "api:plex:tracks:all"
        all_tracks = db.get_cache(cache_key, 600_000)
        if not all_tracks:
            plex.sync_library(False)
            data  = plex.plex_get("/library/sections")
            music = next((s for s in (data.get("MediaContainer", {}).get("Directory") or [])
                          if s.get("type") == "artist"), None)
            if not music:
                return jsonify({"tracks": [], "total": 0, "limit": limit, "offset": offset}), 200, {"Cache-Control": "private, max-age=60"}
            tdata = plex.plex_get(f"/library/sections/{music['key']}/all?type=10")
            all_tracks = [
                {
                    "ratingKey":   t.get("ratingKey"),
                    "title":       t.get("title") or "",
                    "artist":      t.get("grandparentTitle") or t.get("originalTitle") or "",
                    "album":       t.get("parentTitle") or "",
                    "duration":    t.get("duration") or 0,
                    "trackNumber": t.get("index") or 0,
                    "thumb":       (f"/api/core/plex/thumb?path={requests.utils.quote(t['parentThumb'])}"
                                    if t.get("parentThumb") else None),
                }
                for t in ((tdata.get("MediaContainer") or {}).get("Metadata") or [])
            ]
            db.set_cache(cache_key, all_tracks)

        filtered = all_tracks
        if artist_q:
            filtered = [t for t in filtered if artist_q in t["artist"].lower()]
        if album_q:
            filtered = [t for t in filtered if album_q in t["album"].lower()]
        total = len(filtered)
        return jsonify({"tracks": filtered[offset:offset + limit], "total": total, "limit": limit, "offset": offset}), 200, {"Cache-Control": "private, max-age=60"}
    except Exception as exc:
        return jsonify({"error": str(exc), "tracks": [], "total": 0}), 500, {"Cache-Control": "private, max-age=60"}


# ── /api/core/plex/genres ─────────────────────────────────────────────────────

@plex_bp.get("/api/core/plex/genres")
def plex_genres():
    if not PLEX_TOKEN:
        return jsonify({"genres": []}), 200, {"Cache-Control": "private, max-age=300"}
    try:
        cache_key = "api:plex:genres:all"
        cached    = db.get_cache(cache_key, 600_000)
        if cached:
            return jsonify(cached), 200, {"Cache-Control": "private, max-age=600"}
        plex.sync_library(False)
        data  = plex.plex_get("/library/sections")
        music = next((s for s in (data.get("MediaContainer", {}).get("Directory") or [])
                      if s.get("type") == "artist"), None)
        if not music:
            return jsonify({"genres": []}), 200, {"Cache-Control": "private, max-age=300"}
        adata = plex.plex_get(f"/library/sections/{music['key']}/all?type=8")
        meta  = (adata.get("MediaContainer") or {}).get("Metadata") or []
        genre_map: dict[str, list] = {}
        for artist in meta:
            raw_genres = artist.get("Genre") or []
            for g in raw_genres:
                tag = g if isinstance(g, str) else g.get("tag", "")
                if not tag:
                    continue
                if tag not in genre_map:
                    genre_map[tag] = []
                tp = artist.get("thumb")
                genre_map[tag].append({
                    "title":     artist.get("title") or "",
                    "thumb":     (f"/api/core/plex/thumb?path={requests.utils.quote(tp)}" if tp else None),
                    "ratingKey": artist.get("ratingKey"),
                })
        genres = sorted(
            [
                {"genre": g, "artistCount": len(artists),
                 "artists": sorted(artists, key=lambda x: x["title"].lower())}
                for g, artists in genre_map.items()
            ],
            key=lambda x: x["genre"],
        )
        result = {"genres": genres}
        db.set_cache(cache_key, result)
        return jsonify(result), 200, {"Cache-Control": "private, max-age=600"}
    except Exception as exc:
        return jsonify({"error": str(exc), "genres": []}), 500, {"Cache-Control": "private, max-age=300"}


# ── /api/core/plex/stats ──────────────────────────────────────────────────────

@plex_bp.get("/api/core/plex/stats")
def plex_stats():
    if not PLEX_TOKEN:
        return jsonify({"error": "Geen PLEX_TOKEN", "source": None}), 200, {"Cache-Control": "private, max-age=300"}
    period = request.args.get("period", "7day")
    valid  = {"today", "7day", "1month", "3month", "12month", "overall"}
    if period not in valid:
        return jsonify({"error": f"Ongeldige period. Geldige waarden: {', '.join(sorted(valid))}"}), 400, {"Cache-Control": "private, max-age=300"}
    try:
        cache_key = f"plex:stats:{period}"
        cached    = db.get_cache(cache_key, 600_000)
        if cached:
            return jsonify(cached), 200, {"Cache-Control": "private, max-age=300"}
        history     = plex.get_play_history(period)
        top_artists = plex.aggregate_top_artists(history, 20)
        top_tracks  = plex.aggregate_top_tracks(history, 20)
        daily_plays = plex.aggregate_daily_plays(history)
        genres      = plex.get_genres_from_plex(top_artists)
        top_artists = plex.enrich_artists_with_thumbs(top_artists)
        result = {
            "topArtists":  top_artists,
            "topTracks":   top_tracks,
            "dailyPlays":  daily_plays,
            "genres":      genres,
            "recentTracks": history[:30],
            "totalPlays":   len(history),
            "source":       "plex",
        }
        db.set_cache(cache_key, result)
        return jsonify(result), 200, {"Cache-Control": "private, max-age=300"}
    except Exception as exc:
        log.warning("Plex stats mislukt: %s", exc)
        return jsonify({"error": str(exc), "source": None}), 500, {"Cache-Control": "private, max-age=300"}


# ── /api/core/plex/search ─────────────────────────────────────────────────────

@plex_bp.get("/api/core/plex/search")
def plex_search():
    if not PLEX_TOKEN:
        return jsonify({"artists": [], "albums": [], "tracks": [], "playlists": []}), 200, {"Cache-Control": "private, max-age=60"}
    q     = request.args.get("q", "")
    limit = min(int(request.args.get("limit") or 5), 20)
    if not q or len(q) < 2:
        return jsonify({"artists": [], "albums": [], "tracks": [], "playlists": []}), 200, {"Cache-Control": "private, max-age=60"}
    try:
        cache_key = f"api:plex:search:{q.lower()}:{limit}"
        cached    = db.get_cache(cache_key, 300_000)
        if cached:
            return jsonify(cached), 200, {"Cache-Control": "private, max-age=300"}
        results = plex.search_library(q, limit)
        db.set_cache(cache_key, results)
        return jsonify(results), 200, {"Cache-Control": "private, max-age=300"}
    except Exception as exc:
        return jsonify({"error": str(exc), "artists": [], "albums": [], "tracks": [], "playlists": []}), 500, {"Cache-Control": "private, max-age=60"}


# ── /api/core/plex/check-batch ────────────────────────────────────────────────

@plex_bp.post("/api/core/plex/check-batch")
def plex_check_batch():
    if not PLEX_TOKEN:
        return jsonify({"results": {}}), 200, {"Cache-Control": "private, max-age=60"}
    body  = request.get_json(silent=True) or {}
    items = body.get("items") or []
    if not isinstance(items, list) or not items:
        return jsonify({"results": {}}), 200, {"Cache-Control": "private, max-age=60"}
    results = {}
    for item in items[:20]:
        artist = (item.get("artist") or "").strip()
        album  = (item.get("album")  or "").strip()
        key    = f"{artist}||{album}"
        results[key] = plex.album_in_plex(artist, album) or plex.artist_in_plex(artist)
    return jsonify({"results": results}), 200, {"Cache-Control": "private, max-age=60"}


# ── /api/core/plex/stream/audio/<rating_key> ─────────────────────────────────

@plex_bp.get("/api/core/plex/stream/audio/<rating_key>")
def plex_stream_audio(rating_key: str):
    if not PLEX_TOKEN:
        return jsonify({"error": "Geen PLEX_TOKEN"}), 503
    try:
        data     = plex.plex_get(f"/library/metadata/{rating_key}")
        part_key = (
            ((data.get("MediaContainer") or {}).get("Metadata") or [{}])[0]
            .get("Media", [{}])[0]
            .get("Part", [{}])[0]
            .get("key")
        )
        if not part_key:
            return jsonify({"error": "Track niet gevonden"}), 404

        sep      = "&" if "?" in part_key else "?"
        url      = f"{PLEX_URL}{part_key}{sep}X-Plex-Token={PLEX_TOKEN}"
        hdrs     = {}
        if request.headers.get("Range"):
            hdrs["Range"] = request.headers["Range"]

        upstream = requests.get(url, headers=hdrs, stream=True, timeout=30)
        if not upstream.ok:
            return jsonify({"error": f"Plex returned {upstream.status_code}"}), 502

        resp_headers = {
            "Accept-Ranges": "bytes",
            "Cache-Control": "private, max-age=300",
        }
        for h in ("Content-Type", "Content-Length", "Content-Range"):
            v = upstream.headers.get(h)
            if v:
                resp_headers[h] = v

        def _gen():
            for chunk in upstream.iter_content(8192):
                yield chunk

        status = 206 if upstream.status_code == 206 else 200
        return Response(stream_with_context(_gen()), status=status, headers=resp_headers)
    except Exception as exc:
        log.warning("Plex audio stream mislukt: %s", exc)
        return jsonify({"error": str(exc)}), 500
