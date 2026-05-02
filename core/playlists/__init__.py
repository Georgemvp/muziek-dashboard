"""
core/playlists — Python SoulSync playlist engine.

Cache-Powered Discovery: genereert gepersonaliseerde playlists puur op basis
van SQLite enrichment data en de Plex bibliotheek.  Geen externe API calls
tijdens playlist-generatie — alle data komt uit de lokale database.

Beschikbare generators:
  release_radar        Nieuwe releases van favoriete artiesten (30 dagen)
  discovery_weekly     50 tracks van vergelijkbare/gerelateerde artiesten
  decade               Per-decennium playlists (1960s t/m 2020s)
  genre                Per-genre playlists (top 15 genres)
  forgotten_favorites  Artiesten die je al lang niet meer hebt gespeeld
  daily_mix            Gewogen willekeurige selectie uit hele library
"""

from core.playlists.engine import PlaylistEngine

__all__ = ["PlaylistEngine"]
