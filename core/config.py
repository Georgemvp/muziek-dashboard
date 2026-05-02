"""
config.py — Omgevingsvariabelen voor de Core Flask backend.

Leest dezelfde env vars als de Node.js lastfm-app zodat beide processen
altijd op dezelfde configuratie draaien.
"""

import os

# ── Last.fm ────────────────────────────────────────────────────────────────────
LASTFM_API_KEY: str = os.environ.get("LASTFM_API_KEY", "")
LASTFM_USER: str = os.environ.get("LASTFM_USER", "")

# ── Plex ───────────────────────────────────────────────────────────────────────
PLEX_URL: str = os.environ.get("PLEX_URL", "")
PLEX_TOKEN: str = os.environ.get("PLEX_TOKEN", "")

# ── Spotify (optioneel) ────────────────────────────────────────────────────────
SPOTIFY_CLIENT_ID: str = os.environ.get("SPOTIFY_CLIENT_ID", "")
SPOTIFY_CLIENT_SECRET: str = os.environ.get("SPOTIFY_CLIENT_SECRET", "")

# ── Opslag ─────────────────────────────────────────────────────────────────────
DATA_DIR: str = os.environ.get("DATA_DIR", "/data")
DB_PATH: str = os.path.join(DATA_DIR, "cache.db")

# ── Server ─────────────────────────────────────────────────────────────────────
PORT: int = int(os.environ.get("CORE_PORT", "5001"))
LOG_LEVEL: str = os.environ.get("LOG_LEVEL", "info").upper()

# ── Cache limieten (zelfde defaults als db.js) ─────────────────────────────────
CACHE_MAX_ROWS: int = int(os.environ.get("CACHE_MAX_ROWS", "2000"))
CACHE_MAX_AGE_MS: int = int(os.environ.get("CACHE_MAX_AGE_MS", str(14 * 24 * 60 * 60 * 1000)))
