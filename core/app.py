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

from flask import Flask, jsonify, request

from core import config
from core.database import list_tables


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
                    "error":  f"Onbekend playlist type of generatie mislukt: {playlist_type}",
                }), 404

            return jsonify({"status": "ok", "playlist": playlist})
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
            import json as _json
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
                    "error":  f"Onbekend playlist type: {playlist_type}",
                }), 404

            return jsonify({"status": "ok", "playlist": playlist})
        except Exception as exc:
            app.logger.error(
                "POST /api/core/playlists/%s/refresh mislukt: %s", playlist_type, exc,
            )
            return jsonify({"status": "error", "error": str(exc)}), 500

    # ── Background thread: Plex sync + discovery init ─────────────────────────
    # Wacht 15 seconden zodat de database-verbinding en enrichment workers
    # eerst kunnen opstarten. Identiek aan initDiscover/initGaps/initReleases.

    def _startup_background():
        time.sleep(15)
        app.logger.info("Core: achtergrond startup — Plex sync + discovery init")
        try:
            import core.plex_client as plex
            plex.sync()
        except Exception as exc:
            app.logger.warning("Core: Plex sync bij startup mislukt: %s", exc)
        try:
            from core.discovery import builder
            # Plex is al gesyncet hierboven — geen extra vertraging nodig
            builder.init(delay_seconds=0)
        except Exception as exc:
            app.logger.warning("Core: discovery init bij startup mislukt: %s", exc)

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
