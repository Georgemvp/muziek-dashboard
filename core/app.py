"""
app.py — Flask app factory voor de Core backend.

Gunicorn entry point:
    gunicorn -w 2 -b 0.0.0.0:5001 core.app:create_app()

Intern beschikbaar via http://localhost:5001.
De Express app proxyt /api/core/* naar dit adres.
"""

import logging
import threading
import time
from urllib.parse import unquote

from flask import Flask, jsonify, request

from core import config
from core.database import list_tables

# ── Enrichment manager singleton ───────────────────────────────────────────────
# Wordt aangemaakt bij de eerste aanroep van _get_enrichment_manager().
# start_all(blocking=False) wordt gestart vanuit de achtergrond startup-thread.
_enrichment_manager = None
_enrichment_manager_lock = threading.Lock()


def _get_enrichment_manager():
    """Geeft de gedeelde EnrichmentManager instantie terug (lazy init)."""
    global _enrichment_manager
    if _enrichment_manager is None:
        with _enrichment_manager_lock:
            if _enrichment_manager is None:
                from core.workers.manager import EnrichmentManager
                _enrichment_manager = EnrichmentManager()
    return _enrichment_manager


def create_app() -> Flask:
    """App factory — aanroepen vanuit Gunicorn of tests."""
    app = Flask(__name__)

    # ── Logging ────────────────────────────────────────────────────────────────
    log_level = getattr(logging, config.LOG_LEVEL, logging.INFO)
    logging.basicConfig(
        level=log_level,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )
    app.logger.setLevel(log_level)

    # ── Blueprints: Last.fm & Spotify routes ─────────────────────────────────
    from core.routes.lastfm import lastfm_bp
    from core.routes.spotify import spotify_bp
    app.register_blueprint(lastfm_bp)
    app.register_blueprint(spotify_bp)

    # ── Health endpoint ────────────────────────────────────────────────────────
    @app.get("/api/core/health")
    def health():
        """
        Geeft de status van de Core backend terug, inclusief beschikbare
        tabellen in de gedeelde SQLite-database.

        Response:
            {
              "status": "ok",
              "db_tables": ["cache", "discover_sections", ...]
            }
        """
        try:
            tables = list_tables()
            return jsonify({"status": "ok", "db_tables": tables})
        except Exception as exc:  # noqa: BLE001
            app.logger.error("Health check failed: %s", exc)
            return jsonify({"status": "error", "error": str(exc)}), 500

    # ── Discovery endpoints ────────────────────────────────────────────────────
    # Lazy import zodat de module alleen geladen wordt als de app echt draait
    # (voorkomt import-fouten tijdens tests zonder Plex/Last.fm config).

    @app.get("/api/core/discover")
    def get_discover():
        """
        Retourneert alle discover-secties vanuit cache.
        Verlopen secties worden in de achtergrond herbouwd.

        Response:
            {
              "status": "ok" | "building",
              "artists":             [...],   # similar artists (backward compat)
              "similar_artists":     [...],
              "undiscovered_albums": [...],
              "new_in_genres":       [...],
              "from_your_labels":    [...],
              "deep_cuts":           [...],
              "hidden_gems":         [...],
              "building":            { "similar": bool, ... },
              "plex_connected":      bool
            }
        """
        try:
            from core.discovery import builder
            return jsonify(builder.get_all())
        except Exception as exc:
            app.logger.error("GET /api/core/discover mislukt: %s", exc)
            return jsonify({"status": "error", "error": str(exc)}), 500

    @app.post("/api/core/discover/refresh")
    def refresh_discover():
        """
        Triggert een volledige rebuild van alle discovery-secties.

        Response: { "ok": true, "building": true }
        """
        try:
            from core.discovery import builder
            return jsonify(builder.refresh())
        except Exception as exc:
            app.logger.error("POST /api/core/discover/refresh mislukt: %s", exc)
            return jsonify({"status": "error", "error": str(exc)}), 500

    @app.get("/api/core/gaps")
    def get_gaps():
        """
        Retourneert undiscovered albums (ontbrekende albums van top-artiesten).

        Response:
            {
              "status": "ok" | "building",
              "albums":   [...],
              "building": bool
            }
        """
        try:
            from core.discovery import builder
            return jsonify(builder.get_gaps())
        except Exception as exc:
            app.logger.error("GET /api/core/gaps mislukt: %s", exc)
            return jsonify({"status": "error", "error": str(exc)}), 500

    @app.get("/api/core/releases")
    def get_releases():
        """
        Retourneert recente releases in jouw genres en van jouw labels.

        Response:
            {
              "status":   "ok" | "building",
              "releases": [...],
              "genres":   [...],
              "labels":   [...],
              "building": { "new_in_genres": bool, "from_labels": bool }
            }
        """
        try:
            from core.discovery import builder
            return jsonify(builder.get_releases())
        except Exception as exc:
            app.logger.error("GET /api/core/releases mislukt: %s", exc)
            return jsonify({"status": "error", "error": str(exc)}), 500

    @app.get("/api/core/discover/status")
    def discover_status():
        """Geeft per sectie aan of er gecachede data is en of er een build loopt."""
        try:
            from core.discovery import builder
            return jsonify(builder.section_status())
        except Exception as exc:
            app.logger.error("GET /api/core/discover/status mislukt: %s", exc)
            return jsonify({"status": "error", "error": str(exc)}), 500

    # ── Playlist endpoints ────────────────────────────────────────────────────
    # Lazy import — PlaylistEngine wordt alleen geladen als de endpoints
    # daadwerkelijk worden aangeroepen.

    @app.get("/api/core/playlists")
    def get_playlists():
        """
        Retourneert een overzicht van alle beschikbare playlist types, inclusief
        welke er al gecached zijn in de database.

        Response:
            {
              "status": "ok",
              "playlists": [
                {
                  "type":         "daily_mix",
                  "name":         "Daily Mix",
                  "params":       null,
                  "cached":       true,
                  "track_count":  50,
                  "generated_at": 1714000000,
                  "expires_at":   1714086400
                },
                ...
              ]
            }
        """
        try:
            from core.playlists.engine import get_engine
            engine = get_engine()
            return jsonify({"status": "ok", "playlists": engine.list_available()})
        except Exception as exc:
            app.logger.error("GET /api/core/playlists mislukt: %s", exc)
            return jsonify({"status": "error", "error": str(exc)}), 500

    @app.get("/api/core/playlists/<playlist_type>")
    def get_playlist(playlist_type: str):
        """
        Genereer of haal een playlist op.

        Checkt eerst de SQLite cache — als er een geldige versie is, wordt die
        teruggegeven zonder opnieuw te bouwen.

        Query params:
          params  JSON-string met extra parameters (bijv. '{"decade":1990}')

        Response:
            {
              "status": "ok",
              "playlist": {
                "type":         "decade",
                "name":         "1990s",
                "params":       {"decade": 1990},
                "tracks":       [...],
                "track_count":  50,
                "generated_at": 1714000000,
                "expires_at":   1714086400 * 14
              }
            }
        """
        try:
            import json as _json
            params = None
            raw_params = request.args.get("params")
            if raw_params:
                try:
                    params = _json.loads(raw_params)
                except _json.JSONDecodeError:
                    return jsonify({"status": "error", "error": "Ongeldige params JSON"}), 400

            from core.playlists.engine import get_engine
            engine   = get_engine()
            playlist = engine.generate(playlist_type, params)

            if playlist is None:
                return jsonify({
                    "status": "error",
                    "error":  f"Generatie mislukt: {playlist_type}",
                }), 500

            return jsonify({"status": "ok", "playlist": playlist})
        except ValueError as exc:
            return jsonify({"status": "error", "error": str(exc)}), 400
        except Exception as exc:
            app.logger.error("GET /api/core/playlists/%s mislukt: %s", playlist_type, exc)
            return jsonify({"status": "error", "error": str(exc)}), 500

    @app.post("/api/core/playlists/<playlist_type>/refresh")
    def refresh_playlist(playlist_type: str):
        """
        Forceer regeneratie van een playlist (negeert cache).

        Request body (optioneel, JSON):
            { "params": { "decade": 1990 } }

        Response:
            { "status": "ok", "playlist": { ... } }
        """
        try:
            params = None
            if request.is_json:
                body = request.get_json(silent=True) or {}
                params = body.get("params")

            from core.playlists.engine import get_engine
            engine   = get_engine()
            playlist = engine.generate(playlist_type, params, force=True)

            if playlist is None:
                return jsonify({
                    "status": "error",
                    "error":  f"Generatie mislukt: {playlist_type}",
                }), 500

            return jsonify({"status": "ok", "playlist": playlist})
        except ValueError as exc:
            return jsonify({"status": "error", "error": str(exc)}), 400
        except Exception as exc:
            app.logger.error(
                "POST /api/core/playlists/%s/refresh mislukt: %s", playlist_type, exc,
            )
            return jsonify({"status": "error", "error": str(exc)}), 500

    # ── Enrichment endpoints ──────────────────────────────────────────────────
    # Dezelfde API-surface als routes/enrichment.js, maar dan in Python.
    # Alle endpoints vallen onder /api/core/enrichment/* zodat ze via de
    # bestaande Express-proxy automatisch worden doorgestuurd.

    @app.get("/api/core/enrichment/status")
    def enrichment_status():
        """
        Geeft de status terug van alle enrichment workers.

        Response: { source: { label, enabled, paused, queue, stats } }
        """
        try:
            manager = _get_enrichment_manager()
            return jsonify(manager.get_status()), 200, {"Cache-Control": "private, no-cache"}
        except Exception as exc:
            app.logger.error("GET /api/core/enrichment/status mislukt: %s", exc)
            return jsonify({"error": str(exc)}), 500

    @app.post("/api/core/enrichment/pause/<source>")
    def enrichment_pause(source: str):
        """Pauzeer een specifieke worker (of 'all')."""
        try:
            manager = _get_enrichment_manager()
            if source == "all":
                manager.pause_all()
            else:
                manager.pause(source)
            return jsonify({"ok": True, "action": "paused", "source": source})
        except Exception as exc:
            app.logger.error("POST /api/core/enrichment/pause/%s mislukt: %s", source, exc)
            return jsonify({"error": str(exc)}), 500

    @app.post("/api/core/enrichment/resume/<source>")
    def enrichment_resume(source: str):
        """Hervat een specifieke worker (of 'all')."""
        try:
            manager = _get_enrichment_manager()
            if source == "all":
                manager.resume_all()
            else:
                manager.resume(source)
            return jsonify({"ok": True, "action": "resumed", "source": source})
        except Exception as exc:
            app.logger.error("POST /api/core/enrichment/resume/%s mislukt: %s", source, exc)
            return jsonify({"error": str(exc)}), 500

    @app.post("/api/core/enrichment/queue/artist/<path:name>")
    def enrichment_queue_artist(name: str):
        """Voeg één artiest toe aan de enrichment queue."""
        try:
            manager = _get_enrichment_manager()
            added = manager.queue_artist(unquote(name))
            return jsonify({"ok": True, "artist": name, "queued": added})
        except Exception as exc:
            app.logger.error("POST /api/core/enrichment/queue/artist mislukt: %s", exc)
            return jsonify({"error": str(exc)}), 500

    @app.post("/api/core/enrichment/queue/all")
    def enrichment_queue_all():
        """Queue alle artiesten uit de Plex-bibliotheek."""
        try:
            import core.plex_client as plex
            manager = _get_enrichment_manager()
            artist_names = plex.get_artist_names()
            result = manager.queue_all(artist_names)
            return jsonify({"ok": True, **result})
        except Exception as exc:
            app.logger.error("POST /api/core/enrichment/queue/all mislukt: %s", exc)
            return jsonify({"error": str(exc)}), 500

    # Registreer de /primary-route vóór de /<source>-route zodat Flask de
    # statische component 'primary' verkiest boven de variabele /<source>.
    @app.get("/api/core/enrichment/data/<entity_type>/<path:entity_and_primary>")
    def enrichment_data_primary(entity_type: str, entity_and_primary: str):
        """
        GET /api/core/enrichment/data/<type>/<name>/primary
        GET /api/core/enrichment/data/<type>/<name>/<source>
        GET /api/core/enrichment/data/<type>/<name>  (alle bronnen)
        """
        import core.database as db
        try:
            parts = entity_and_primary.rsplit("/", 1)
            if len(parts) == 2:
                entity_name_raw, last = parts
                entity_name = unquote(entity_name_raw)
                last_dec = unquote(last)
            else:
                # Geen trailing segment — geef alle bronnen terug
                entity_name = unquote(entity_and_primary)
                data = db.get_enrichment_data(entity_type, entity_name)
                return (
                    jsonify({"entityType": entity_type, "entityName": entity_name, "sources": data}),
                    200,
                    {"Cache-Control": "private, max-age=300"},
                )

            if last_dec == "primary":
                primary_source = db.get_setting("enrichment", "primary_source") or "spotify"
                data = db.get_enrichment_data_by_source(entity_type, entity_name, primary_source)
                used_source = primary_source
                if data is None:
                    all_data = db.get_enrichment_data(entity_type, entity_name)
                    sources = list(all_data.keys())
                    if sources:
                        used_source = sources[0]
                        data = all_data[used_source]
                if data is None:
                    return jsonify({"error": "Geen enrichment data beschikbaar"}), 404
                return (
                    jsonify({
                        "entityType": entity_type,
                        "entityName": entity_name,
                        "source": used_source,
                        "primarySource": primary_source,
                        "data": data,
                    }),
                    200,
                    {"Cache-Control": "private, max-age=300"},
                )
            else:
                # last_dec is een specifieke source-naam
                data = db.get_enrichment_data_by_source(entity_type, entity_name, last_dec)
                if data is None:
                    return jsonify({"error": "No enrichment data found"}), 404
                return (
                    jsonify({
                        "entityType": entity_type,
                        "entityName": entity_name,
                        "source": last_dec,
                        "data": data,
                    }),
                    200,
                    {"Cache-Control": "private, max-age=300"},
                )
        except Exception as exc:
            app.logger.error("GET /api/core/enrichment/data mislukt: %s", exc)
            return jsonify({"error": str(exc)}), 500

    @app.get("/api/core/enrichment/genres")
    def enrichment_genres_get():
        """Haal de genre whitelist + filter-status op."""
        try:
            import core.database as db
            genres = db.get_genre_whitelist()
            enabled = db.get_setting("enrichment", "genre_filter_enabled")
            return (
                jsonify({"genres": genres, "filterEnabled": enabled is True or enabled == "true"}),
                200,
                {"Cache-Control": "private, max-age=60"},
            )
        except Exception as exc:
            app.logger.error("GET /api/core/enrichment/genres mislukt: %s", exc)
            return jsonify({"error": str(exc)}), 500

    @app.put("/api/core/enrichment/genres")
    def enrichment_genres_put():
        """
        Bulk-update de genre whitelist en/of de filter-instelling.
        Body: { genres?: [{genre, enabled}], filterEnabled?: bool }
        """
        try:
            import core.database as db
            body = request.get_json(silent=True) or {}
            manager = _get_enrichment_manager()
            if isinstance(body.get("genres"), list):
                db.set_genre_whitelist(body["genres"])
                manager.refresh_genre_cache()
            if isinstance(body.get("filterEnabled"), bool):
                db.set_setting("enrichment", "genre_filter_enabled", body["filterEnabled"])
                manager.set_genre_filter_enabled(body["filterEnabled"])
            return jsonify({"ok": True})
        except Exception as exc:
            app.logger.error("PUT /api/core/enrichment/genres mislukt: %s", exc)
            return jsonify({"error": str(exc)}), 500

    @app.patch("/api/core/enrichment/genres/<path:genre>")
    def enrichment_genre_patch(genre: str):
        """Zet één genre aan of uit. Body: { enabled: bool }"""
        try:
            import core.database as db
            body = request.get_json(silent=True) or {}
            enabled = body.get("enabled", True)
            db.set_genre_enabled(unquote(genre), enabled is not False)
            _get_enrichment_manager().refresh_genre_cache()
            return jsonify({"ok": True, "genre": genre, "enabled": enabled})
        except Exception as exc:
            app.logger.error("PATCH /api/core/enrichment/genres/%s mislukt: %s", genre, exc)
            return jsonify({"error": str(exc)}), 500

    @app.get("/api/core/enrichment/settings")
    def enrichment_settings_get():
        """Haal enrichment-instellingen op (API keys gemaskeerd als ***)."""
        try:
            import core.database as db
            workers = [
                "itunes", "discogs", "audiodb", "genius", "tidal",
                "qobuz", "spotify", "musicbrainz", "lastfm", "deezer",
            ]
            settings = {
                "genius_api_key":      "***" if db.get_setting("enrichment", "genius_api_key") else None,
                "discogs_token":       "***" if db.get_setting("enrichment", "discogs_token") else None,
                "discogs_user_agent":  db.get_setting("enrichment", "discogs_user_agent"),
                "genre_filter_enabled": db.get_setting("enrichment", "genre_filter_enabled") or False,
                "primary_source":       db.get_setting("enrichment", "primary_source") or "spotify",
            }
            for w in workers:
                val = db.get_setting("enrichment", f"worker_{w}_enabled")
                settings[f"worker_{w}_enabled"] = val is not False and val != "false"
            return jsonify(settings), 200, {"Cache-Control": "private, no-cache"}
        except Exception as exc:
            app.logger.error("GET /api/core/enrichment/settings mislukt: %s", exc)
            return jsonify({"error": str(exc)}), 500

    @app.put("/api/core/enrichment/settings")
    def enrichment_settings_put():
        """Sla enrichment-instellingen op."""
        try:
            import core.database as db
            allowed = [
                "genius_api_key", "discogs_token", "discogs_user_agent",
                "genre_filter_enabled",
                "worker_itunes_enabled", "worker_discogs_enabled", "worker_audiodb_enabled",
                "worker_genius_enabled", "worker_tidal_enabled", "worker_qobuz_enabled",
                "worker_spotify_enabled", "worker_musicbrainz_enabled",
                "worker_lastfm_enabled", "worker_deezer_enabled",
                "primary_source",
            ]
            body = request.get_json(silent=True) or {}
            for key in allowed:
                if key in body:
                    db.set_setting("enrichment", key, body[key])
            if "genre_filter_enabled" in body:
                _get_enrichment_manager().set_genre_filter_enabled(body["genre_filter_enabled"])
            return jsonify({"ok": True})
        except Exception as exc:
            app.logger.error("PUT /api/core/enrichment/settings mislukt: %s", exc)
            return jsonify({"error": str(exc)}), 500

    # ── Genre whitelist endpoints ─────────────────────────────────────────────
    # Beheer van de genre-whitelist die junk-genres filtert uit enrichment data.
    # Gescheiden van /api/core/enrichment/genres zodat deze whitelist ook door
    # andere modules (playlists, stats) kan worden gebruikt.

    @app.get("/api/core/genres/whitelist")
    def genres_whitelist_get():
        """
        Geeft de huidige genre-whitelist terug.

        Response: { genres: [{ genre: str, enabled: bool }], total: int }
        """
        try:
            import core.database as db
            from core.genre_filter import seed_default_genres
            seed_default_genres()
            genres = db.get_genre_whitelist()
            return jsonify({"genres": genres, "total": len(genres)}), 200, {
                "Cache-Control": "private, max-age=60"
            }
        except Exception as exc:
            app.logger.error("GET /api/core/genres/whitelist mislukt: %s", exc)
            return jsonify({"error": str(exc)}), 500

    @app.post("/api/core/genres/whitelist")
    def genres_whitelist_post():
        """
        Voeg een genre toe aan de whitelist.

        Body: { "genre": "Rock" }
        Response: { ok: true, genre: str }
        """
        try:
            import core.database as db
            body  = request.get_json(silent=True) or {}
            genre = (body.get("genre") or "").strip()
            if not genre:
                return jsonify({"error": "genre vereist"}), 400
            db.set_genre_enabled(genre, True)
            _get_enrichment_manager().refresh_genre_cache()
            return jsonify({"ok": True, "genre": genre})
        except Exception as exc:
            app.logger.error("POST /api/core/genres/whitelist mislukt: %s", exc)
            return jsonify({"error": str(exc)}), 500

    @app.delete("/api/core/genres/whitelist")
    def genres_whitelist_delete():
        """
        Verwijder een genre uit de whitelist (zet enabled=False).

        Body: { "genre": "Rock" }
        Response: { ok: true, genre: str }
        """
        try:
            import core.database as db
            body  = request.get_json(silent=True) or {}
            genre = (body.get("genre") or "").strip()
            if not genre:
                return jsonify({"error": "genre vereist"}), 400
            db.set_genre_enabled(genre, False)
            _get_enrichment_manager().refresh_genre_cache()
            return jsonify({"ok": True, "genre": genre})
        except Exception as exc:
            app.logger.error("DELETE /api/core/genres/whitelist mislukt: %s", exc)
            return jsonify({"error": str(exc)}), 500

    @app.post("/api/core/genres/whitelist/reset")
    def genres_whitelist_reset():
        """
        Reset de genre-whitelist naar de standaard (~270 genres).

        Response: { ok: true, total: int }
        """
        try:
            import core.database as db
            from core.genre_filter import DEFAULT_GENRES
            db.set_genre_whitelist([{"genre": g, "enabled": True} for g in DEFAULT_GENRES])
            _get_enrichment_manager().refresh_genre_cache()
            return jsonify({"ok": True, "total": len(DEFAULT_GENRES)})
        except Exception as exc:
            app.logger.error("POST /api/core/genres/whitelist/reset mislukt: %s", exc)
            return jsonify({"error": str(exc)}), 500

    # ── Stats endpoints ────────────────────────────────────────────────────────
    # Luisterstatistieken op basis van de Last.fm API, gecached in SQLite.
    # Periode-parameter: 7day | 1month | 3month | 12month | overall

    @app.get("/api/core/stats")
    def stats_overview():
        """
        Overzicht van luisterstatistieken.

        Query: ?range=7day|1month|3month|12month|overall (default: 1month)
        Response: { totalPlays, listeningHours, uniqueArtists, plexArtists,
                    plexLibrarySize, plexAlbums }
        """
        try:
            from core.stats.listening_stats import get_overview
            period = request.args.get("range") or "1month"
            result = get_overview(period)
            return jsonify(result), 200, {"Cache-Control": "private, max-age=600"}
        except Exception as exc:
            app.logger.error("GET /api/core/stats mislukt: %s", exc)
            return jsonify({"error": str(exc)}), 500

    @app.get("/api/core/stats/top/artists")
    def stats_top_artists():
        """
        Top artiesten voor de opgegeven periode.

        Query: ?range=... &limit=20
        Response: { artists: [{ name, playcount, image, thumb, url }] }
        """
        try:
            from core.stats.listening_stats import get_top_artists
            period = request.args.get("range") or "1month"
            limit  = min(int(request.args.get("limit") or 20), 100)
            result = get_top_artists(period, limit)
            return jsonify(result), 200, {"Cache-Control": "private, max-age=3600"}
        except Exception as exc:
            app.logger.error("GET /api/core/stats/top/artists mislukt: %s", exc)
            return jsonify({"error": str(exc)}), 500

    @app.get("/api/core/stats/top/albums")
    def stats_top_albums():
        """
        Top albums voor de opgegeven periode.

        Query: ?range=... &limit=10
        Response: { albums: [{ name, artist, playcount, image }] }
        """
        try:
            from core.stats.listening_stats import get_top_albums
            period = request.args.get("range") or "1month"
            limit  = min(int(request.args.get("limit") or 10), 50)
            result = get_top_albums(period, limit)
            return jsonify(result), 200, {"Cache-Control": "private, max-age=3600"}
        except Exception as exc:
            app.logger.error("GET /api/core/stats/top/albums mislukt: %s", exc)
            return jsonify({"error": str(exc)}), 500

    @app.get("/api/core/stats/top/tracks")
    def stats_top_tracks():
        """
        Top tracks voor de opgegeven periode.

        Query: ?range=... &limit=10
        Response: { tracks: [{ name, artist, playcount }] }
        """
        try:
            from core.stats.listening_stats import get_top_tracks
            period = request.args.get("range") or "1month"
            limit  = min(int(request.args.get("limit") or 10), 50)
            result = get_top_tracks(period, limit)
            return jsonify(result), 200, {"Cache-Control": "private, max-age=3600"}
        except Exception as exc:
            app.logger.error("GET /api/core/stats/top/tracks mislukt: %s", exc)
            return jsonify({"error": str(exc)}), 500

    @app.get("/api/core/stats/genres")
    def stats_genres():
        """
        Genre-breakdown op basis van enrichment-data van top-artiesten.

        Query: ?range=...
        Response: { labels: [...], values: [...] }
        """
        try:
            from core.stats.listening_stats import get_genres
            period = request.args.get("range") or "1month"
            result = get_genres(period)
            return jsonify(result), 200, {"Cache-Control": "private, max-age=3600"}
        except Exception as exc:
            app.logger.error("GET /api/core/stats/genres mislukt: %s", exc)
            return jsonify({"error": str(exc)}), 500

    @app.get("/api/core/stats/timeline")
    def stats_timeline():
        """
        Plays-per-tijdseenheid (dag/week/maand afhankelijk van periode).

        Query: ?range=...
        Response: { labels: [...], values: [...], totalPlays: int }
        """
        try:
            from core.stats.listening_stats import get_timeline
            period = request.args.get("range") or "1month"
            result = get_timeline(period)
            return jsonify(result), 200, {"Cache-Control": "private, max-age=3600"}
        except Exception as exc:
            app.logger.error("GET /api/core/stats/timeline mislukt: %s", exc)
            return jsonify({"error": str(exc)}), 500

    # ── Background thread: Plex sync + discovery init ─────────────────────────
    # Wacht 15 seconden zodat de database-verbinding en enrichment workers
    # eerst kunnen opstarten. Identiek aan initDiscover/initGaps/initReleases.

    def _startup_background():
        time.sleep(15)
        app.logger.info("Core: achtergrond startup — Plex sync + discovery init + enrichment workers")
        try:
            from core.genre_filter import seed_default_genres
            seed_default_genres()
        except Exception as exc:
            app.logger.warning("Core: genre whitelist seeding mislukt: %s", exc)
        try:
            import core.plex_client as plex
            plex.sync()
        except Exception as exc:
            app.logger.warning("Core: Plex sync bij startup mislukt: %s", exc)
        try:
            from core.discovery import builder
            builder.init(delay_seconds=0)
        except Exception as exc:
            app.logger.warning("Core: discovery init bij startup mislukt: %s", exc)
        try:
            manager = _get_enrichment_manager()
            manager.start_all(blocking=False)
        except Exception as exc:
            app.logger.warning("Core: enrichment workers starten mislukt: %s", exc)

    startup_thread = threading.Thread(
        target=_startup_background,
        name="core-startup",
        daemon=True,
    )
    startup_thread.start()

    app.logger.info(
        "Core backend gestart — DB: %s | poort: %s", config.DB_PATH, config.PORT
    )

    return app
