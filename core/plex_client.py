"""
plex_client.py — Plex library client voor de discovery module.

Gebruikt de plexapi library om de Plex bibliotheek te synchroniseren
en in-memory sets/maps bij te houden voor snelle artist/album lookups.
Zelfde logica als services/plex.js: exact + fuzzy (genormaliseerde) matching.
"""

import logging
import re
import threading
import time
import unicodedata
from typing import Optional

from core import config

log = logging.getLogger(__name__)

try:
    from plexapi.server import PlexServer
    from plexapi.exceptions import Unauthorized, NotFound
    PLEXAPI_AVAILABLE = True
except ImportError:
    PLEXAPI_AVAILABLE = False
    log.warning("plexapi niet geïnstalleerd — voer 'pip install plexapi' uit")

# ── In-memory state ────────────────────────────────────────────────────────────
_lock = threading.Lock()
_artists: set[str] = set()                         # lowercase namen
_artist_map: dict[str, str] = {}                   # lowercase → origineel
_albums: set[str] = set()                          # "artiest||album" exact lowercase
_albums_by_artist: dict[str, set[str]] = {}        # norm_artist → set van norm_album
_last_sync: float = 0.0
_sync_ok: bool = False
_sync_interval: float = 3600.0                     # 1 uur, zelfde als plex.js


def _normalize(s: str) -> str:
    """
    Normaliseer een titel voor fuzzy matching.
    Identiek aan normStr() in services/plex.js.
    """
    if not s:
        return ""
    s = s.lower()
    # Verwijder diacrieten (NFD decomposition)
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    # Verwijder niet-alfanumerieke karakters
    s = re.sub(r"[^\w\s]", " ", s)
    # Meerdere spaties samenvoegen
    s = re.sub(r"\s+", " ", s).strip()
    return s


def sync(force: bool = False) -> None:
    """
    Synchroniseer de Plex muziekbibliotheek naar in-memory state.

    Slaat artiesten en albums op in Sets voor O(1)-lookups.
    Wordt automatisch overgeslagen als de vorige sync < 1 uur geleden was.
    """
    global _last_sync, _sync_ok

    if not config.PLEX_URL or not config.PLEX_TOKEN:
        log.warning("Plex: PLEX_URL of PLEX_TOKEN niet geconfigureerd")
        return

    if not PLEXAPI_AVAILABLE:
        log.error("Plex: plexapi library niet beschikbaar — 'pip install plexapi'")
        return

    if not force and (time.time() - _last_sync) < _sync_interval:
        return

    try:
        server = PlexServer(config.PLEX_URL, config.PLEX_TOKEN, timeout=20)

        # Zoek de muziek-sectie (type == 'artist')
        music_section = None
        for section in server.library.sections():
            if section.type == "artist":
                music_section = section
                break

        if not music_section:
            log.warning("Plex: geen muziekbibliotheek gevonden")
            return

        artists = music_section.searchArtists()
        albums  = music_section.searchAlbums()

        new_artists: set[str] = set()
        new_artist_map: dict[str, str] = {}
        for a in artists:
            key = (a.title or "").lower()
            new_artists.add(key)
            new_artist_map[key] = a.title

        new_albums: set[str] = set()
        new_albums_by_artist: dict[str, set[str]] = {}
        for al in albums:
            parent = al.parentTitle or ""
            title  = al.title or ""

            # Exact lowercase match (zelfde als plexAlbums in plex.js)
            new_albums.add(f"{parent.lower()}||{title.lower()}")

            # Genormaliseerd voor fuzzy matching (zelfde als plexAlbumsNorm)
            norm_artist = _normalize(parent)
            norm_album  = _normalize(title)
            if norm_artist not in new_albums_by_artist:
                new_albums_by_artist[norm_artist] = set()
            new_albums_by_artist[norm_artist].add(norm_album)

        with _lock:
            _artists.clear()
            _artists.update(new_artists)
            _artist_map.clear()
            _artist_map.update(new_artist_map)
            _albums.clear()
            _albums.update(new_albums)
            _albums_by_artist.clear()
            _albums_by_artist.update(new_albums_by_artist)
            _last_sync = time.time()
            _sync_ok = True

        log.info(
            "Plex: gesynchroniseerd — %d artiesten, %d albums",
            len(_artists), len(_albums),
        )

    except Exception as exc:
        with _lock:
            _sync_ok = False
        log.warning("Plex sync mislukt: %s", exc)


def artist_in_plex(name: str) -> bool:
    """True als de artiest in de Plex bibliotheek staat (case-insensitive)."""
    return (name or "").lower() in _artists


def album_in_plex(artist: str, album: str) -> bool:
    """
    True als het album van de artiest in Plex staat.
    Probeert eerst exact match, daarna fuzzy (genormaliseerde substring-match).
    Identiek aan albumInPlex() in services/plex.js.
    """
    artist_lower = (artist or "").lower()
    album_lower  = (album or "").lower()

    # Stap 1: exact lowercase match
    if f"{artist_lower}||{album_lower}" in _albums:
        return True

    # Stap 2: fuzzy match via genormaliseerde titels
    norm_artist = _normalize(artist)
    norm_album  = _normalize(album)

    for plex_artist, plex_albums in _albums_by_artist.items():
        artist_matches = (
            norm_artist == plex_artist
            or (norm_artist and plex_artist in norm_artist)
            or (plex_artist and norm_artist in plex_artist)
        )
        if not artist_matches:
            continue
        for plex_album in plex_albums:
            album_matches = (
                norm_album == plex_album
                or (norm_album and plex_album in norm_album)
                or (plex_album and norm_album in plex_album)
            )
            if album_matches:
                return True

    return False


def get_artist_names() -> list[str]:
    """Geeft een lijst van alle originele artiestennamen terug."""
    with _lock:
        return list(_artist_map.values())


def get_artist_map() -> dict[str, str]:
    """Geeft een kopie terug van de lowercase→origineel map."""
    with _lock:
        return dict(_artist_map)


def status() -> dict:
    """Geeft de huidige sync-status terug (ok, aantallen, timestamp)."""
    return {
        "ok":           _sync_ok,
        "artist_count": len(_artists),
        "album_count":  len(_albums),
        "last_sync":    _last_sync,
    }
