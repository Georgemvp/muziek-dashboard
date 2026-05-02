"""
app.py — Flask app factory voor de Core backend.

Gunicorn entry point:
    gunicorn -w 2 -b 0.0.0.0:5001 core.app:create_app()

Intern beschikbaar via http://localhost:5001.
De Express app proxyt /api/core/* naar dit adres.
"""

import logging

from flask import Flask, jsonify

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

    app.logger.info(
        "Core backend gestart — DB: %s | poort: %s", config.DB_PATH, config.PORT
    )

    return app
