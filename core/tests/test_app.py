"""
core/tests/test_app.py
Basis smoke-tests voor de Core Flask backend.

Verifieert dat:
  1. de app factory zonder externe services kan opstarten
  2. het /api/core/health endpoint reageert
  3. proxy-endpoints bestaan (routing is aanwezig)

Externe afhankelijkheden (Plex, Last.fm, SQLite /data/cache.db) worden
gemockt via pytest monkeypatch / tmpdir zodat CI zonder echte services slaagt.
"""

import os

import pytest


# ── Omgeving instellen vóór module-import ─────────────────────────────────────
@pytest.fixture(scope="session", autouse=True)
def set_env(tmp_path_factory):
    """Stel omgevingsvariabelen in zodat de app een tijdelijke DB gebruikt."""
    tmp = tmp_path_factory.mktemp("core_ci")
    os.environ.setdefault("DATA_DIR", str(tmp))
    os.environ.setdefault("LASTFM_API_KEY", "ci-test-key")
    os.environ.setdefault("LASTFM_USER", "ci-test-user")
    os.environ.setdefault("PLEX_URL", "http://localhost:32400")
    os.environ.setdefault("PLEX_TOKEN", "ci-test-token")
    yield
    # Cleanup omgevingsvariabelen (optioneel — CI-omgeving wordt toch weggegooid)


@pytest.fixture(scope="session")
def client(set_env):
    """Flask test-client voor alle tests in deze sessie."""
    # Lokale import zodat env-vars al zijn ingesteld vóór config.py laadt
    from core.app import create_app  # noqa: PLC0415

    app = create_app()
    app.config["TESTING"] = True
    with app.test_client() as c:
        yield c


# ══════════════════════════════════════════════════════════════════════════════
# Smoke tests
# ══════════════════════════════════════════════════════════════════════════════

class TestHealth:
    def test_health_returns_200(self, client):
        """Health endpoint moet bereikbaar zijn en 200 teruggeven."""
        resp = client.get("/api/core/health")
        assert resp.status_code == 200

    def test_health_body_has_status(self, client):
        """Health response moet een 'status' veld bevatten."""
        resp = client.get("/api/core/health")
        data = resp.get_json()
        assert data is not None, "Response body moet JSON zijn"
        assert "status" in data, "Response moet 'status' veld bevatten"
        assert data["status"] in ("ok", "error")


class TestRoutesMounted:
    """Verifieer dat alle verwachte Core-routes bestaan (geen 404)."""

    EXPECTED_ROUTES = [
        ("GET",  "/api/core/discover"),
        ("GET",  "/api/core/discover/status"),
        ("POST", "/api/core/discover/refresh"),
        ("GET",  "/api/core/gaps"),
        ("GET",  "/api/core/releases"),
        ("GET",  "/api/core/playlists"),
        ("GET",  "/api/core/playlists/discovery"),
        ("POST", "/api/core/playlists/discovery/refresh"),
        # Enrichment routes
        ("GET",  "/api/core/enrichment/status"),
        ("POST", "/api/core/enrichment/pause/all"),
        ("POST", "/api/core/enrichment/resume/all"),
        ("POST", "/api/core/enrichment/queue/artist/test-artist"),
        ("POST", "/api/core/enrichment/queue/all"),
        ("GET",  "/api/core/enrichment/data/artist/test-artist"),
        ("GET",  "/api/core/enrichment/data/artist/test-artist/primary"),
        ("GET",  "/api/core/enrichment/data/artist/test-artist/spotify"),
        ("GET",  "/api/core/enrichment/genres"),
        ("PUT",  "/api/core/enrichment/genres"),
        ("PATCH", "/api/core/enrichment/genres/rock"),
        ("GET",  "/api/core/enrichment/settings"),
        ("PUT",  "/api/core/enrichment/settings"),
        # Genre whitelist routes
        ("GET",    "/api/core/genres/whitelist"),
        ("POST",   "/api/core/genres/whitelist"),
        ("DELETE", "/api/core/genres/whitelist"),
        ("POST",   "/api/core/genres/whitelist/reset"),
        # Stats routes
        ("GET", "/api/core/stats"),
        ("GET", "/api/core/stats/top/artists"),
        ("GET", "/api/core/stats/top/albums"),
        ("GET", "/api/core/stats/top/tracks"),
        ("GET", "/api/core/stats/genres"),
        ("GET", "/api/core/stats/timeline"),
        # Last.fm routes (gemigreerd vanuit routes/lastfm.js)
        ("GET", "/api/core/user"),
        ("GET", "/api/core/recent"),
        ("GET", "/api/core/top/artists"),
        ("GET", "/api/core/top/tracks"),
        ("GET", "/api/core/top/albums"),
        ("GET", "/api/core/loved"),
        ("GET", "/api/core/artist/search"),
        ("GET", "/api/core/artist/test-artist"),
        ("GET", "/api/core/artist/test-artist/info"),
        ("GET", "/api/core/artist/test-artist/similar"),
        ("GET", "/api/core/genre/rock"),
        # Spotify routes (gemigreerd vanuit routes/spotify.js)
        ("GET", "/api/core/spotify/status"),
        ("GET", "/api/core/spotify/recs"),
        # Plex routes (gemigreerd vanuit routes/plex.js)
        ("GET",  "/api/core/plex/status"),
        ("POST", "/api/core/plex/refresh"),
        ("GET",  "/api/core/plex/nowplaying"),
        ("GET",  "/api/core/plex/library"),
        ("GET",  "/api/core/plex/library/all"),
        ("GET",  "/api/core/plex/playlists"),
        ("GET",  "/api/core/plex/playlists/123/tracks"),
        ("GET",  "/api/core/plex/album/123/tracks"),
        ("GET",  "/api/core/plex/clients"),
        ("GET",  "/api/core/plex/clients/debug"),
        ("GET",  "/api/core/plex/remotequeue"),
        ("GET",  "/api/core/plex/artists"),
        ("GET",  "/api/core/plex/artists/123"),
        ("GET",  "/api/core/plex/tracks"),
        ("GET",  "/api/core/plex/genres"),
        ("GET",  "/api/core/plex/stats"),
        ("GET",  "/api/core/plex/search"),
        ("POST", "/api/core/plex/check-batch"),
        ("POST", "/api/core/plex/play"),
        ("POST", "/api/core/plex/pause"),
        ("POST", "/api/core/plex/stop"),
        ("POST", "/api/core/plex/skip"),
        ("POST", "/api/core/plex/skip/next"),
        ("POST", "/api/core/plex/skip/prev"),
        ("POST", "/api/core/plex/rate"),
        ("POST", "/api/core/plex/refresh-library"),
        ("GET",  "/api/core/plex/stream/audio/123"),
        # Download routes (gemigreerd vanuit routes/download.js)
        ("POST", "/api/core/download"),
        ("GET",  "/api/core/download/search"),
        ("GET",  "/api/core/download/status"),
        ("GET",  "/api/core/download/queue"),
        ("GET",  "/api/core/download/history"),
        ("POST", "/api/core/download/retry-all"),
        ("GET",  "/api/core/download/settings"),
        ("POST", "/api/core/download/settings"),
    ]

    @pytest.mark.parametrize("method,path", EXPECTED_ROUTES)
    def test_route_is_not_404(self, client, method, path):
        """Een gemonteerde route mag geen 404 teruggeven."""
        resp = client.open(path, method=method)
        assert resp.status_code != 404, (
            f"{method} {path} geeft 404 — route is niet gemonteerd of verwijderd"
        )
