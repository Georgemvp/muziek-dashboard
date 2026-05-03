"""
engine.py — PlaylistEngine: orchestreert alle playlist generators.

Caching-strategie:
  - Bij generate() wordt eerst de playlists-tabel gecheckt.
  - Gecachede playlists worden teruggegeven zonder opnieuw te bouwen.
  - Bij refresh() wordt de cache genegeerd en de playlist opnieuw gebouwd.
  - TTLs zijn gedefinieerd in database.PLAYLIST_TTL (zelfde als db.js).

Track-formaat (elke generator geeft dit terug):
  {
    "artist":    str,
    "title":     str | None,
    "album":     str | None,
    "year":      int | None,
    "duration":  int | None,   # milliseconden
    "plex_key":  str | None,   # None = niet in Plex (bijv. discovery/new releases)
    "cover_url": str | None,
  }
"""

import logging
import time
from typing import Any, Optional

import core.database as db

log = logging.getLogger(__name__)

# Beschikbare playlist types met hun display-namen
PLAYLIST_NAMES: dict[str, str] = {
    "release_radar":        "Release Radar",
    "discovery_weekly":     "Discovery Weekly",
    "daily_mix":            "Daily Mix",
    "forgotten_favorites":  "Forgotten Favorites",
}

# Decade playlists worden dynamisch aangemaakt
AVAILABLE_DECADES = [1960, 1970, 1980, 1990, 2000, 2010, 2020]


class PlaylistEngine:
    """
    Centrale orchestrator voor alle playlist generators.

    Gebruik:
        engine = PlaylistEngine()
        tracks = engine.generate("daily_mix")
        tracks = engine.generate("decade", {"decade": 1990})
        tracks = engine.generate("genre", {"genre": "jazz"})
    """

    def generate(
        self,
        playlist_type: str,
        params: Optional[dict] = None,
        force: bool = False,
    ) -> Optional[dict]:
        """
        Genereer een playlist.

        Checkt eerst de SQLite cache (playlists tabel).  Als er een geldige
        gecachede versie is, wordt die teruggegeven.  Anders wordt de generator
        aangeroepen en het resultaat opgeslagen.

        Parameters
        ----------
        playlist_type : str
            Type playlist: 'release_radar', 'discovery_weekly', 'decade',
            'genre', 'forgotten_favorites', 'daily_mix'.
        params : dict, optional
            Extra parameters (bijv. {"decade": 1990} of {"genre": "jazz"}).
        force : bool
            True = sla cache over en bouw opnieuw.

        Returns
        -------
        dict met tracks + metadata, of None als onbekend type.
        """
        if not force:
            cached = db.get_playlist(playlist_type, params)
            if cached:
                log.debug(
                    "Playlist '%s' (params=%s) uit cache gehaald (%d tracks)",
                    playlist_type, params, len(cached.get("tracks", [])),
                )
                return cached

        generators = {
            "release_radar":       self._build_release_radar,
            "discovery_weekly":    self._build_discovery_weekly,
            "decade":              self._build_decade,
            "genre":               self._build_genre,
            "forgotten_favorites": self._build_forgotten,
            "daily_mix":           self._build_daily_mix,
        }

        builder = generators.get(playlist_type)
        if builder is None:
            raise ValueError(f"Onbekend playlist type: {playlist_type}")

        log.info("Playlist '%s' (params=%s) bouwen...", playlist_type, params)
        start = time.time()

        try:
            tracks = builder(params or {})
        except Exception as exc:
            log.error("Playlist '%s' bouwen mislukt: %s", playlist_type, exc, exc_info=True)
            return None

        elapsed = time.time() - start
        log.info(
            "Playlist '%s' klaar in %.1fs — %d tracks",
            playlist_type, elapsed, len(tracks),
        )

        name = self._make_name(playlist_type, params)
        db.save_playlist(playlist_type, name, tracks, params)

        return db.get_playlist(playlist_type, params)

    def list_available(self) -> list[dict]:
        """
        Geef een overzicht terug van alle beschikbare playlist types,
        inclusief welke er al gecached zijn.
        """
        saved = {(p["type"], str(p["params"])): p for p in db.get_all_playlists()}

        available: list[dict] = []

        # Vaste types
        for ptype, pname in PLAYLIST_NAMES.items():
            key = (ptype, "None")
            cached = saved.get(key)
            available.append({
                "type":         ptype,
                "name":         pname,
                "params":       None,
                "cached":       cached is not None,
                "track_count":  cached["track_count"] if cached else 0,
                "generated_at": cached["generated_at"] if cached else None,
                "expires_at":   cached["expires_at"] if cached else None,
            })

        # Decade playlists
        for decade in AVAILABLE_DECADES:
            params = {"decade": decade}
            pname  = f"{decade}s"
            key    = ("decade", str(params))
            cached = saved.get(key)
            available.append({
                "type":         "decade",
                "name":         pname,
                "params":       params,
                "cached":       cached is not None,
                "track_count":  cached["track_count"] if cached else 0,
                "generated_at": cached["generated_at"] if cached else None,
                "expires_at":   cached["expires_at"] if cached else None,
            })

        # Genre playlists — haal beschikbare genres op uit enrichment data
        genres = self._get_top_genres(15)
        for genre in genres:
            params = {"genre": genre}
            pname  = genre.title()
            key    = ("genre", str(params))
            cached = saved.get(key)
            available.append({
                "type":         "genre",
                "name":         pname,
                "params":       params,
                "cached":       cached is not None,
                "track_count":  cached["track_count"] if cached else 0,
                "generated_at": cached["generated_at"] if cached else None,
                "expires_at":   cached["expires_at"] if cached else None,
            })

        return available

    # ── Private builders (thin wrappers naar generator modules) ───────────────

    def _build_release_radar(self, params: dict) -> list[dict]:
        from core.playlists.release_radar import build
        return build()

    def _build_discovery_weekly(self, params: dict) -> list[dict]:
        from core.playlists.discovery_weekly import build
        return build()

    def _build_decade(self, params: dict) -> list[dict]:
        decade = params.get("decade")
        if not isinstance(decade, int):
            raise ValueError(f"'decade' param vereist (int), kreeg: {decade!r}")
        from core.playlists.decade import build
        return build(decade)

    def _build_genre(self, params: dict) -> list[dict]:
        genre = params.get("genre")
        if not genre:
            raise ValueError("'genre' param vereist (str)")
        from core.playlists.genre import build
        return build(genre)

    def _build_forgotten(self, params: dict) -> list[dict]:
        from core.playlists.forgotten import build
        return build()

    def _build_daily_mix(self, params: dict) -> list[dict]:
        from core.playlists.daily_mix import build
        return build()

    # ── Helpers ───────────────────────────────────────────────────────────────

    @staticmethod
    def _make_name(playlist_type: str, params: Optional[dict]) -> str:
        if playlist_type == "decade" and params:
            return f"{params['decade']}s"
        if playlist_type == "genre" and params:
            return params["genre"].title()
        return PLAYLIST_NAMES.get(playlist_type, playlist_type.replace("_", " ").title())

    @staticmethod
    def _get_top_genres(limit: int = 15) -> list[str]:
        """Verzamel de meest voorkomende genres uit enrichment_data."""
        import json

        genre_count: dict[str, int] = {}
        try:
            with db.get_db() as conn:
                rows = conn.execute(
                    "SELECT data_json FROM enrichment_data WHERE entity_type = 'artist'"
                ).fetchall()

            for row in rows:
                try:
                    data = json.loads(row["data_json"])
                except (json.JSONDecodeError, TypeError):
                    continue

                genres: list[str] = []
                if isinstance(data.get("tags"), list):
                    genres.extend(data["tags"])
                if isinstance(data.get("genres"), list):
                    genres.extend(data["genres"])
                if isinstance(data.get("genre"), list):
                    genres.extend(data["genre"])

                for g in genres:
                    if g:
                        key = g.lower().strip()
                        genre_count[key] = genre_count.get(key, 0) + 1

        except Exception as exc:
            log.warning("Genres ophalen mislukt: %s", exc)

        sorted_genres = sorted(genre_count.items(), key=lambda x: x[1], reverse=True)
        return [g for g, _ in sorted_genres[:limit]]


# ── Module-level singleton ────────────────────────────────────────────────────
_engine: Optional[PlaylistEngine] = None


def get_engine() -> PlaylistEngine:
    """Geef de globale PlaylistEngine instantie terug (singleton)."""
    global _engine
    if _engine is None:
        _engine = PlaylistEngine()
    return _engine
