"""
listening_stats.py — Luisterstatistieken via de Last.fm API.

Haalt play-data op voor de geconfigureerde Last.fm-gebruiker, aggregeert
die naar overzichten, timelines en top-lijsten en slaat de resultaten
15–60 minuten op in de gedeelde SQLite-cache.

Ondersteunde perioden (zelfde als Last.fm API):
    7day | 1month | 3month | 12month | overall
"""

import logging
import time
from datetime import UTC, datetime, timedelta

import requests

from core import config
from core import database as db

log = logging.getLogger(__name__)

LFM_BASE = "http://ws.audioscrobbler.com/2.0/"
VALID_PERIODS = {"7day", "1month", "3month", "12month", "overall"}

# Cache TTL in milliseconden
TTL_OVERVIEW = 10 * 60_000   # 10 min
TTL_LONG     = 60 * 60_000   # 1 uur


# ── Interne helpers ────────────────────────────────────────────────────────────

def _lfm(method: str, extra: dict) -> dict:
    """Roep de Last.fm API aan en gooi bij fouten een ValueError."""
    if not config.LASTFM_API_KEY or not config.LASTFM_USER:
        raise ValueError("LASTFM_API_KEY of LASTFM_USER niet geconfigureerd")
    params = {
        "method":  method,
        "user":    config.LASTFM_USER,
        "api_key": config.LASTFM_API_KEY,
        "format":  "json",
        **extra,
    }
    resp = requests.get(LFM_BASE, params=params, timeout=15)
    resp.raise_for_status()
    data = resp.json()
    if "error" in data:
        raise ValueError(f"Last.fm fout {data['error']}: {data.get('message', '')}")
    return data


def _norm_period(period: str | None) -> str:
    p = (period or "1month").lower()
    return p if p in VALID_PERIODS else "1month"


def _period_seconds(period: str) -> int | None:
    return {
        "7day":    7  * 86400,
        "1month":  30 * 86400,
        "3month":  90 * 86400,
        "12month": 365 * 86400,
        "overall": None,
    }[period]


def _first_image(images: list, size: str = "medium") -> str | None:
    """Geef de URL van het eerste afbeelding met de opgegeven maat."""
    for img in images:
        if img.get("size") == size and img.get("#text"):
            return img["#text"]
    return None


def _as_list(value) -> list:
    """Last.fm geeft een dict terug als er maar één item is; normaliseer naar list."""
    if value is None:
        return []
    return value if isinstance(value, list) else [value]


# ── Publieke functies ──────────────────────────────────────────────────────────

def get_overview(period: str | None = None) -> dict:
    """
    Gecombineerd overzicht: totaal plays, luistertijd, unieke artiesten.

    Response:
        {
            totalPlays:    int,
            listeningHours: int,
            uniqueArtists: int,
            plexArtists:   int,   # alias
            plexLibrarySize: 0,
            plexAlbums:    0,
        }
    """
    period = _norm_period(period)
    cache_key = f"core:stats:overview:{period}"
    cached = db.get_cache(cache_key, TTL_OVERVIEW)
    if cached:
        return cached

    try:
        user_data   = _lfm("user.getinfo", {})
        user        = user_data.get("user", {})
        total_plays = int(user.get("playcount") or 0)

        # Schat luistertijd op basis van gemiddelde tracktijd van 3:30
        listening_hours = round(total_plays * 3.5 / 60)

        top_attr      = _lfm("user.gettopartists", {"period": period, "limit": 1})
        unique_artists = int(
            top_attr.get("topartists", {}).get("@attr", {}).get("total", 0)
        )

        result = {
            "totalPlays":     total_plays,
            "listeningHours": listening_hours,
            "uniqueArtists":  unique_artists,
            "plexArtists":    unique_artists,
            "plexLibrarySize": 0,
            "plexAlbums":     0,
        }
        db.set_cache(cache_key, result)
        return result

    except Exception as exc:
        log.warning("stats overview mislukt: %s", exc)
        return {
            "totalPlays": 0, "listeningHours": 0,
            "uniqueArtists": 0, "plexArtists": 0,
            "plexLibrarySize": 0, "plexAlbums": 0,
        }


def get_top_artists(period: str | None = None, limit: int = 20) -> dict:
    """
    Top artiesten voor de opgegeven periode.

    Response: { artists: [{ name, playcount, image, thumb }] }
    """
    period = _norm_period(period)
    cache_key = f"core:stats:top_artists:{period}:{limit}"
    cached = db.get_cache(cache_key, TTL_LONG)
    if cached:
        return cached

    try:
        data    = _lfm("user.gettopartists", {"period": period, "limit": limit})
        artists = _as_list(data.get("topartists", {}).get("artist"))
        result  = {
            "artists": [
                {
                    "name":      a["name"],
                    "playcount": int(a.get("playcount") or 0),
                    "image":     _first_image(a.get("image", []), "medium"),
                    "thumb":     _first_image(a.get("image", []), "small"),
                    "url":       a.get("url"),
                }
                for a in artists
            ]
        }
        db.set_cache(cache_key, result)
        return result

    except Exception as exc:
        log.warning("stats top_artists mislukt: %s", exc)
        return {"artists": []}


def get_top_albums(period: str | None = None, limit: int = 10) -> dict:
    """
    Top albums voor de opgegeven periode.

    Response: { albums: [{ name, artist, playcount, image }] }
    """
    period = _norm_period(period)
    cache_key = f"core:stats:top_albums:{period}:{limit}"
    cached = db.get_cache(cache_key, TTL_LONG)
    if cached:
        return cached

    try:
        data   = _lfm("user.gettopalbums", {"period": period, "limit": limit})
        albums = _as_list(data.get("topalbums", {}).get("album"))
        result = {
            "albums": [
                {
                    "name":      a["name"],
                    "artist":    a.get("artist", {}).get("name", ""),
                    "playcount": int(a.get("playcount") or 0),
                    "image":     _first_image(a.get("image", []), "medium"),
                }
                for a in albums
            ]
        }
        db.set_cache(cache_key, result)
        return result

    except Exception as exc:
        log.warning("stats top_albums mislukt: %s", exc)
        return {"albums": []}


def get_top_tracks(period: str | None = None, limit: int = 10) -> dict:
    """
    Top tracks voor de opgegeven periode.

    Response: { tracks: [{ name, artist, playcount }] }
    """
    period = _norm_period(period)
    cache_key = f"core:stats:top_tracks:{period}:{limit}"
    cached = db.get_cache(cache_key, TTL_LONG)
    if cached:
        return cached

    try:
        data   = _lfm("user.gettoptracks", {"period": period, "limit": limit})
        tracks = _as_list(data.get("toptracks", {}).get("track"))
        result = {
            "tracks": [
                {
                    "name":      t["name"],
                    "artist":    t.get("artist", {}).get("name", ""),
                    "album":     None,
                    "playcount": int(t.get("playcount") or 0),
                }
                for t in tracks
            ]
        }
        db.set_cache(cache_key, result)
        return result

    except Exception as exc:
        log.warning("stats top_tracks mislukt: %s", exc)
        return {"tracks": []}


def get_genres(period: str | None = None) -> dict:
    """
    Genre-breakdown op basis van enrichment-data van top-artiesten.

    Response: { labels: [...], values: [...] }
    """
    period = _norm_period(period)
    cache_key = f"core:stats:genres:{period}"
    cached = db.get_cache(cache_key, TTL_LONG)
    if cached:
        return cached

    try:
        top          = get_top_artists(period, limit=50)
        genre_counts: dict[str, int] = {}

        for artist in top.get("artists", []):
            weight     = max(artist.get("playcount", 1), 1)
            enrichment = db.get_enrichment_data("artist", artist["name"])

            for source_data in enrichment.values():
                if not isinstance(source_data, dict):
                    continue
                for field in ("genres", "genre", "style"):
                    raw = source_data.get(field, [])
                    if isinstance(raw, str):
                        raw = [raw]
                    for g in raw:
                        if g and isinstance(g, str):
                            key = g.strip().title()
                            genre_counts[key] = genre_counts.get(key, 0) + weight

        if not genre_counts:
            return {"labels": [], "values": []}

        sorted_genres = sorted(genre_counts.items(), key=lambda x: x[1], reverse=True)[:15]
        result = {
            "labels": [g for g, _ in sorted_genres],
            "values": [c for _, c in sorted_genres],
        }
        db.set_cache(cache_key, result)
        return result

    except Exception as exc:
        log.warning("stats genres mislukt: %s", exc)
        return {"labels": [], "values": []}


def get_timeline(period: str | None = None) -> dict:
    """
    Plays-per-tijdseenheid voor de opgegeven periode.

    Granulariteit:
        7day / 1month  → per dag
        3month         → per week
        12month        → per maand
        overall        → per maand (laatste 12 maanden)

    Response: { labels: [...], values: [...], totalPlays: int }
    """
    period = _norm_period(period)
    cache_key = f"core:stats:timeline:{period}"
    cached = db.get_cache(cache_key, TTL_LONG)
    if cached:
        return cached

    try:
        now  = int(time.time())
        secs = _period_seconds(period)

        if period in ("12month", "overall"):
            from_ts     = now - 365 * 86400
            granularity = "month"
            max_pages   = 8
        elif period == "3month":
            from_ts     = now - secs
            granularity = "week"
            max_pages   = 5
        else:
            from_ts     = now - secs
            granularity = "day"
            max_pages   = 5

        result = _build_timeline(from_ts, now, granularity, max_pages)
        db.set_cache(cache_key, result)
        return result

    except Exception as exc:
        log.warning("stats timeline mislukt: %s", exc)
        return {"labels": [], "values": [], "totalPlays": 0}


def _build_timeline(
    from_ts: int,
    to_ts: int,
    granularity: str,
    max_pages: int,
) -> dict:
    """Pagineer door recenttracks en aggregeer naar de gewenste granulariteit."""
    counts: dict[str, int] = {}
    total = 0
    page  = 1

    while page <= max_pages:
        data   = _lfm("user.getrecenttracks", {
            "from": from_ts, "to": to_ts,
            "limit": 200, "page": page,
        })
        tracks = _as_list(data.get("recenttracks", {}).get("track"))

        dated = [t for t in tracks if t.get("date")]
        for track in dated:
            ts = int(track["date"]["uts"])
            dt = datetime.fromtimestamp(ts, tz=UTC)

            if granularity == "day":
                label = dt.strftime("%-d %b")
            elif granularity == "week":
                week_start = dt - timedelta(days=dt.weekday())
                label = week_start.strftime("%-d %b")
            else:  # month
                label = dt.strftime("%b %Y")

            counts[label] = counts.get(label, 0) + 1
            total += 1

        attr        = data.get("recenttracks", {}).get("@attr", {})
        total_pages = int(attr.get("totalPages") or 1)
        if page >= total_pages or page >= max_pages:
            break
        page += 1

    if not counts:
        return {"labels": [], "values": [], "totalPlays": 0}

    sorted_items = sorted(counts.items())
    return {
        "labels":     [k for k, _ in sorted_items],
        "values":     [v for _, v in sorted_items],
        "totalPlays": total,
    }
