"""
musicbrainz_client.py — MusicBrainz client voor de discovery module.

Gebruikt musicbrainzngs (rate-limited 1 req/sec) voor artiest-MBID lookups
en album-ophalen, en de MBZ HTTP Search API voor release-group queries.
MBID-resultaten worden permanent gecached in SQLite.
"""
from __future__ import annotations

import logging
from datetime import datetime, timedelta

import musicbrainzngs
import requests as _requests

import core.database as db

log = logging.getLogger(__name__)

musicbrainzngs.set_useragent("LastfmMuziekApp", "2.0", "muziek-dashboard")
musicbrainzngs.set_rate_limit(limit_or_interval=1.0, new_requests=1)

_MBZ_BASE      = "https://musicbrainz.org/ws/2"
_UA_HEADER     = {"User-Agent": "LastfmMuziekApp/2.0 (muziek-dashboard)"}
_ALBUMS_TTL_MS = 7 * 24 * 3600 * 1000   # 7 dagen

SKIP_SECONDARY = frozenset(
    {"compilation", "live", "soundtrack", "interview",
     "spokenword", "audiobook", "remix"}
)


# ── MBID lookup ────────────────────────────────────────────────────────────────

def get_artist_mbid(name: str) -> str | None:
    """
    Geeft de MusicBrainz artiest-MBID terug voor een naam.
    Gecached permanent in SQLite (key: mbid:<lowercase naam>).
    Geeft None terug als de artiest niet gevonden wordt.
    """
    cache_key = f"mbid:{name.lower()}"
    cached = db.get_cache(cache_key, max_age_ms=float("inf"))
    if cached is not None:
        # False = eerder niet gevonden, sla herhaald zoeken over
        return cached if cached is not False else None

    try:
        result  = musicbrainzngs.search_artists(artist=name, limit=5)
        artists = result.get("artist-list", [])
        if not artists:
            db.set_cache(cache_key, False)
            return None

        name_lower = name.lower()
        exact = next(
            (a for a in artists if a.get("name", "").lower() == name_lower),
            None,
        )
        best = exact or artists[0]
        mbid = best.get("id") or None
        db.set_cache(cache_key, mbid if mbid else False)
        return mbid
    except Exception as exc:
        log.warning("MBZ get_artist_mbid mislukt voor '%s': %s", name, exc)
        return None


# ── Album browse ───────────────────────────────────────────────────────────────

def get_albums(mbid: str) -> list[dict]:
    """
    Haalt alle albums/EP's op voor een artiest-MBID via musicbrainzngs.
    Filtert compilaties, live, soundtracks, etc.
    Gecached 7 dagen in SQLite.

    Returns list van { mbid, title, year, cover_url }.
    """
    cache_key = f"mbz:albums:{mbid}"
    cached = db.get_cache(cache_key, max_age_ms=_ALBUMS_TTL_MS)
    if cached is not None:
        return cached

    try:
        result = musicbrainzngs.browse_release_groups(
            artist=mbid,
            release_type=["album", "ep"],
            limit=100,
        )
        groups = result.get("release-group-list", [])
        albums = []
        for rg in groups:
            primary_type = (rg.get("primary-type") or "").lower()
            if primary_type not in ("album", "ep"):
                continue
            secondary_types = [t.lower() for t in rg.get("secondary-type-list", [])]
            if any(t in SKIP_SECONDARY for t in secondary_types):
                continue

            first_release = rg.get("first-release-date", "")
            rgid = rg.get("id")
            albums.append({
                "mbid":      rgid,
                "title":     rg.get("title"),
                "year":      first_release[:4] if first_release else None,
                "cover_url": (
                    f"https://coverartarchive.org/release-group/{rgid}/front-250"
                    if rgid else None
                ),
            })

        db.set_cache(cache_key, albums)
        return albums
    except Exception as exc:
        log.warning("MBZ get_albums mislukt voor mbid '%s': %s", mbid, exc)
        return []


# ── HTTP Search API helpers ────────────────────────────────────────────────────

def _http_search(query: str, limit: int = 20) -> list[dict]:
    """
    Voer een MBZ release-group HTTP-zoekopdracht uit.
    Geeft [] bij fouten.
    """
    try:
        url = (
            f"{_MBZ_BASE}/release-group"
            f"?query={_requests.utils.quote(query)}"
            f"&limit={limit}&fmt=json"
        )
        resp = _requests.get(url, headers=_UA_HEADER, timeout=15)
        resp.raise_for_status()
        return resp.json().get("release-groups", [])
    except Exception as exc:
        log.warning("MBZ HTTP search mislukt: %s", exc)
        return []


def _parse_release_groups(groups: list[dict], cutoff_date: str) -> list[dict]:
    """Parse en filter release-group resultaten op type en datum."""
    results = []
    for rg in groups:
        primary_type = (rg.get("primary-type") or "").lower()
        if primary_type not in ("album", "single", "ep"):
            continue
        secondary_types = [(t or "").lower() for t in (rg.get("secondary-types") or [])]
        if any(t in SKIP_SECONDARY for t in secondary_types):
            continue
        release_date = rg.get("first-release-date") or ""
        if not release_date or release_date < cutoff_date:
            continue

        # Artiestennaam uit artist-credit
        artist_name = ""
        ac = rg.get("artist-credit", [])
        if ac and isinstance(ac[0], dict):
            artist_name = (
                (ac[0].get("artist") or {}).get("name")
                or ac[0].get("name")
                or ""
            )

        rgid = rg.get("id")
        results.append({
            "mbid":         rgid,
            "title":        rg.get("title"),
            "artist":       artist_name,
            "release_date": release_date,
            "primary_type": rg.get("primary-type"),
            "cover_url": (
                f"https://coverartarchive.org/release-group/{rgid}/front-250"
                if rgid else None
            ),
        })
    return results


def search_by_tag(tag: str, cutoff_date: str, limit: int = 20) -> list[dict]:
    """
    Zoek release-groups met een specifieke genre-tag en datum-cutoff.
    cutoff_date: 'YYYY-MM-DD' string.
    """
    query  = f'tag:"{tag}" AND firstreleasedate:[{cutoff_date} TO *]'
    groups = _http_search(query, limit=limit)
    return _parse_release_groups(groups, cutoff_date)


def search_by_label(label: str, cutoff_date: str, limit: int = 10) -> list[dict]:
    """Zoek release-groups van een label-naam met datum-cutoff."""
    safe_label = label.replace('"', "")
    query  = f'label:"{safe_label}" AND firstreleasedate:[{cutoff_date} TO *]'
    groups = _http_search(query, limit=limit)
    return _parse_release_groups(groups, cutoff_date)


def search_by_artist_mbid(mbid: str, cutoff_date: str) -> list[dict]:
    """Zoek recente release-groups voor een artiest-MBID."""
    query  = f"arid:{mbid} AND firstreleasedate:[{cutoff_date} TO *]"
    groups = _http_search(query, limit=25)
    return _parse_release_groups(groups, cutoff_date)


def cutoff_iso(days: int) -> str:
    """Geeft een ISO-datumstring terug voor N dagen geleden."""
    return (datetime.utcnow() - timedelta(days=days)).strftime("%Y-%m-%d")
