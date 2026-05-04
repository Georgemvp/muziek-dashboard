"""
album_consistency.py — MusicBrainz release preflight voor album-consistentie.

Picard-stijl: voordat een album gedownload wordt, zoek de MusicBrainz release
eenmalig op zodat ALLE tracks van dat album dezelfde release-ID krijgen.

Zonder dit systeem kan track 1 release ID "abc" krijgen en track 5 "def"
als twee verschillende MBZ results worden gevonden.

Gebruik:
    from core.album_consistency import AlbumConsistency
    consistency = AlbumConsistency()

    # Preflight voor een heel album
    release_id = consistency.preflight_album("Pink Floyd", "The Wall")

    # Gebruik die release_id voor alle tracks
    for track_meta in album_tracks:
        track_meta['mbid_release'] = release_id
"""
from __future__ import annotations

import logging
import threading
import time
from dataclasses import dataclass, field
from typing import Any

import musicbrainzngs

log = logging.getLogger(__name__)

musicbrainzngs.set_useragent("LastfmMuziekApp", "2.0", "muziek-dashboard")
musicbrainzngs.set_rate_limit(limit_or_interval=1.0, new_requests=1)


@dataclass
class ReleaseInfo:
    """Gevonden MusicBrainz release informatie."""
    mbid:         str
    title:        str
    artist:       str
    date:         str        = ""
    country:      str        = ""
    label:        str        = ""
    catalog:      str        = ""
    track_count:  int        = 0
    medium_count: int        = 0
    release_type: str        = ""  # Album, Single, EP, …
    score:        int        = 0   # MBZ relevantie score (0–100)


class AlbumConsistency:
    """
    Centrale cache voor MusicBrainz release lookups per album.

    Thread-safe: meerdere downloads van hetzelfde album tegelijk wachten op
    de eerste lookup in plaats van allemaal een eigen request te doen.

    Parameters
    ----------
    cache_ttl : int
        Hoe lang (seconden) een release in de in-memory cache blijft.
        Standaard 3600 (1 uur) — lang genoeg voor een album-download sessie.
    max_results : int
        Maximale MBZ resultaten per query (1–10).
    """

    def __init__(
        self,
        cache_ttl: int  = 3600,
        max_results: int = 5,
    ) -> None:
        self._cache: dict[str, tuple[ReleaseInfo | None, float]] = {}
        self._locks: dict[str, threading.Lock] = {}
        self._meta_lock = threading.Lock()
        self._cache_ttl = cache_ttl
        self._max_results = max_results

    # ── Publieke API ──────────────────────────────────────────────────────────

    def preflight_album(
        self,
        artist: str,
        album:  str,
        year:   str | None = None,
    ) -> str | None:
        """
        Geef de MusicBrainz release-MBID terug voor een artiest+album combinatie.

        Doet de lookup maar één keer per (artiest, album) — alle volgende calls
        halen het resultaat uit de in-memory cache.

        Parameters
        ----------
        artist : str
            Artiestnaam.
        album : str
            Albumtitel.
        year : str, optional
            Uitjaar als extra filter bij meerdere edities.

        Returns
        -------
        str | None
            MusicBrainz release-MBID, of None als niets gevonden werd.
        """
        cache_key = self._make_key(artist, album)

        # ── Cache check ────────────────────────────────────────────────────
        cached = self._get_cached(cache_key)
        if cached is not False:     # None = eerder niet gevonden; dat is ook geldig
            if cached is not None:
                log.debug("Album consistency cache hit: '%s – %s' → %s", artist, album, cached.mbid)
                return cached.mbid
            return None

        # ── Eén lock per (artiest, album) zodat gelijktijdige threads wachten ─
        lock = self._get_lock(cache_key)
        with lock:
            # Dubbel-check na acquiren van de lock
            cached = self._get_cached(cache_key)
            if cached is not False:
                return cached.mbid if cached else None

            release = self._search_musicbrainz(artist, album, year)
            self._set_cache(cache_key, release)

            if release:
                log.info(
                    "Album consistency: '%s – %s' → MBID %s (%s, %s)",
                    artist, album, release.mbid, release.date, release.country,
                )
                return release.mbid
            else:
                log.warning(
                    "Album consistency: geen MBZ release gevonden voor '%s – %s'",
                    artist, album,
                )
                return None

    def get_release_info(
        self,
        artist: str,
        album:  str,
        year:   str | None = None,
    ) -> ReleaseInfo | None:
        """
        Geef de volledige ReleaseInfo terug (inclusief label, catalog, track count, …).

        Heeft dezelfde cache-semantiek als preflight_album.
        """
        cache_key = self._make_key(artist, album)
        cached = self._get_cached(cache_key)
        if cached is not False:
            return cached

        lock = self._get_lock(cache_key)
        with lock:
            cached = self._get_cached(cache_key)
            if cached is not False:
                return cached

            release = self._search_musicbrainz(artist, album, year)
            self._set_cache(cache_key, release)
            return release

    def enrich_track_metadata(
        self,
        metadata: dict[str, Any],
        artist:   str,
        album:    str,
        year:     str | None = None,
    ) -> dict[str, Any]:
        """
        Verrijk een metadata-dict in-place met MBZ release informatie.

        Voegt toe: mbid_release, label, catalog_number als ze nog niet aanwezig
        zijn en gevonden worden.

        Returns
        -------
        dict
            Het verrijkte metadata-dict (zelfde object, voor method chaining).
        """
        info = self.get_release_info(artist, album, year)
        if not info:
            return metadata

        if not metadata.get("mbid_release"):
            metadata["mbid_release"] = info.mbid
        if not metadata.get("label") and info.label:
            metadata["label"] = info.label
        if not metadata.get("catalog_number") and info.catalog:
            metadata["catalog_number"] = info.catalog
        if not metadata.get("year") and info.date:
            metadata["year"] = info.date[:4]  # Alleen het jaar

        return metadata

    # ── Interne helpers ───────────────────────────────────────────────────────

    @staticmethod
    def _make_key(artist: str, album: str) -> str:
        return f"{artist.lower().strip()}|||{album.lower().strip()}"

    def _get_cached(self, key: str) -> ReleaseInfo | None | bool:
        """
        Haal gecachede waarde op.

        Returns
        -------
        ReleaseInfo | None | False
            ReleaseInfo als gevonden, None als eerder niet gevonden,
            False als niet in cache (of verlopen).
        """
        with self._meta_lock:
            if key not in self._cache:
                return False
            info, expires_at = self._cache[key]
            if time.monotonic() > expires_at:
                del self._cache[key]
                return False
            return info  # kan None zijn (eerder niet gevonden)

    def _set_cache(self, key: str, info: ReleaseInfo | None) -> None:
        with self._meta_lock:
            self._cache[key] = (info, time.monotonic() + self._cache_ttl)

    def _get_lock(self, key: str) -> threading.Lock:
        with self._meta_lock:
            if key not in self._locks:
                self._locks[key] = threading.Lock()
            return self._locks[key]

    def _search_musicbrainz(
        self,
        artist: str,
        album:  str,
        year:   str | None = None,
    ) -> ReleaseInfo | None:
        """
        Zoek de beste MusicBrainz release voor artiest+album.

        Kiest in volgorde van voorkeur:
        1. Exacte titel + exacte artiest
        2. Exacte titel + artiest bevat/bevat-in verwachte naam
        3. Eerste resultaat met score ≥ 70

        Bij meerdere resultaten met dezelfde titel wordt de officiële
        'albumland' release verkozen boven andere edities.
        """
        try:
            query = f'release:"{_escape(album)}" AND artist:"{_escape(artist)}"'
            if year:
                query += f' AND date:{year[:4]}*'

            result   = musicbrainzngs.search_releases(
                query=query,
                limit=self._max_results,
            )
            releases = result.get("release-list", [])
        except Exception as exc:
            log.error("MusicBrainz release search mislukt: %s", exc)
            return None

        if not releases:
            return None

        norm_album  = _normalize(album)
        norm_artist = _normalize(artist)

        # Zoek exact → gedeeltelijk → score-gebaseerd
        best = _find_best_match(releases, norm_album, norm_artist)
        if not best:
            return None

        return _parse_release(best)


# ── Module-niveau helpers ──────────────────────────────────────────────────────

def _normalize(s: str) -> str:
    import re
    return re.sub(r"\s+", " ", re.sub(r"[^\w\s]", " ", s.lower())).strip()


def _escape(s: str) -> str:
    """Escape Lucene-speciale tekens voor MBZ query."""
    special = r'\+-&&||!(){}[]^"~*?:/'
    return "".join(f"\\{c}" if c in special else c for c in s)


def _find_best_match(
    releases: list[dict],
    norm_album:  str,
    norm_artist: str,
) -> dict | None:
    """Vind de beste MBZ release op basis van fuzzy matching."""
    exact_title_artist = []
    exact_title_only   = []
    high_score         = []

    for rel in releases:
        score      = int(rel.get("ext:score", 0))
        rel_title  = _normalize(rel.get("title", ""))
        artists    = rel.get("artist-credit", [])
        rel_artist = _normalize(
            " ".join(
                ac.get("artist", {}).get("name", "") or ac.get("name", "")
                for ac in artists
                if isinstance(ac, dict)
            )
        )

        title_match  = rel_title == norm_album or norm_album in rel_title
        artist_match = (
            norm_artist == rel_artist
            or norm_artist in rel_artist
            or rel_artist in norm_artist
        )

        if title_match and artist_match:
            exact_title_artist.append((score, rel))
        elif title_match:
            exact_title_only.append((score, rel))
        elif score >= 70:
            high_score.append((score, rel))

    # Kies de groep met de hoogste score, verkozen "NL" of "XW" editie
    for group in (exact_title_artist, exact_title_only, high_score):
        if not group:
            continue
        group.sort(key=lambda x: x[0], reverse=True)
        candidates = [rel for _, rel in group]
        # Verkozen landen voor eerste release (origineel album)
        preferred = [c for c in candidates if c.get("country") in ("NL", "XW", "DE", "GB", "US")]
        return (preferred or candidates)[0]

    return None


def _parse_release(rel: dict) -> ReleaseInfo:
    """Zet een MBZ release-dict om naar een ReleaseInfo dataclass."""
    artists  = rel.get("artist-credit", [])
    artist   = " ".join(
        ac.get("artist", {}).get("name", "") or ac.get("name", "")
        for ac in artists
        if isinstance(ac, dict)
    ).strip()

    # Label en catalogusnummer
    label_info = rel.get("label-info-list", [])
    label   = ""
    catalog = ""
    if label_info and isinstance(label_info, list):
        li = label_info[0]
        if isinstance(li, dict):
            label_dict = li.get("label", {})
            label      = label_dict.get("name", "") if isinstance(label_dict, dict) else ""
            catalog    = li.get("catalog-number", "")

    # Track- en medium-telling
    mediums     = rel.get("medium-list", [])
    track_count = sum(
        int(m.get("track-count", 0))
        for m in mediums
        if isinstance(m, dict)
    )

    return ReleaseInfo(
        mbid         = rel.get("id", ""),
        title        = rel.get("title", ""),
        artist       = artist,
        date         = rel.get("date", ""),
        country      = rel.get("country", ""),
        label        = label,
        catalog      = catalog,
        track_count  = track_count,
        medium_count = len(mediums),
        release_type = rel.get("release-group", {}).get("type", "") if isinstance(rel.get("release-group"), dict) else "",
        score        = int(rel.get("ext:score", 0)),
    )


# ── Module-niveau singleton voor eenvoudig gebruik ────────────────────────────
_default_instance: AlbumConsistency | None = None


def get_album_consistency() -> AlbumConsistency:
    """Geeft de module-niveau AlbumConsistency singleton terug."""
    global _default_instance
    if _default_instance is None:
        _default_instance = AlbumConsistency()
    return _default_instance


def preflight_album(
    artist: str,
    album: str,
    year: str | None = None,
) -> str | None:
    """
    Convenience-functie: zoek MBZ release MBID via de module-singleton.

    Gebruik deze als je geen aparte AlbumConsistency instantie nodig hebt.
    """
    return get_album_consistency().preflight_album(artist, album, year)
