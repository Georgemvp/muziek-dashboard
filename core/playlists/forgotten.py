"""
forgotten.py — Generator: Forgotten Favorites.

Logica (zero externe API calls):
  1. Haal Last.fm top-artiesten 'overall' op uit de SQLite cache.
  2. Haal Last.fm top-artiesten '3month' op uit de SQLite cache.
  3. Vind artiesten die hoog staan in 'overall' maar NIET in '3month'
     — dit zijn de "vergeten" favorieten.
  4. Filter op aanwezigheid in Plex.
  5. Haal hun tracks op en return max 50.

Fallback: als de cache leeg is, gebruik enrichment_data.lastfm.playcount als
proxy voor populariteit (artiesten met hoge overall playcount die al lang
niet zijn voorgesteld).
"""

import json
import logging
import random

import core.database as db
import core.lastfm_client as lastfm
import core.plex_client as plex

log = logging.getLogger(__name__)

_MAX_TRACKS = 50
_MAX_PER_ARTIST = 4
_OVERALL_LIMIT  = 100  # top-N overall
_RECENT_LIMIT   = 30   # top-N recent (3month)
_TOP_RANK       = 50   # artiest moet in overall top-N staan


def _get_cached_top_artists(period: str) -> list[str]:
    """Laad top-artiesten uit SQLite cache (gesla door Node.js)."""
    for key in [
        f"api:topartists:{period}",
        f"api:top:artists:{period}",
    ]:
        cached = db.get_cache(key)
        if not cached:
            continue
        artists = []
        if isinstance(cached, dict):
            artists = (
                cached.get("topartists", {}).get("artist", [])
                or cached.get("artists", [])
                or []
            )
        elif isinstance(cached, list):
            artists = cached

        names = []
        for a in artists:
            name = a.get("name") if isinstance(a, dict) else str(a)
            if name:
                names.append(name)
        if names:
            return names
    return []


def _get_enrichment_fallback() -> list[str]:
    """
    Fallback: haal artiesten op uit enrichment_data gesorteerd op
    Last.fm overall playcount.
    """
    try:
        with db.get_db() as conn:
            rows = conn.execute(
                "SELECT entity_name, data_json FROM enrichment_data "
                "WHERE entity_type = 'artist' AND source = 'lastfm'"
            ).fetchall()
    except Exception as exc:
        log.warning("Forgotten: enrichment_data lezen mislukt: %s", exc)
        return []

    artist_plays: list[tuple[str, int]] = []
    for row in rows:
        try:
            data = json.loads(row["data_json"])
            playcount = int(data.get("playcount", 0) or 0)
            if playcount > 0:
                artist_plays.append((row["entity_name"], playcount))
        except (json.JSONDecodeError, TypeError, ValueError):
            continue

    artist_plays.sort(key=lambda x: x[1], reverse=True)
    return [name for name, _ in artist_plays[:_OVERALL_LIMIT]]


def build() -> list[dict]:
    """Bouw de Forgotten Favorites playlist."""

    # ── Haal overall top-artiesten op ─────────────────────────────────────
    overall = _get_cached_top_artists("overall")
    if not overall:
        log.debug("Forgotten: geen 'overall' cache — API proberen")
        try:
            overall = [a["name"] for a in lastfm.get_top_artists("overall", _OVERALL_LIMIT)]
        except Exception:
            pass

    if not overall:
        log.debug("Forgotten: API ook leeg — enrichment_data fallback")
        overall = _get_enrichment_fallback()

    if not overall:
        log.warning("Forgotten Favorites: geen artiesten-data beschikbaar")
        return []

    # ── Haal recente top-artiesten op (3 maanden) ──────────────────────────
    recent = _get_cached_top_artists("3month")
    if not recent:
        try:
            recent = [a["name"] for a in lastfm.get_top_artists("3month", _RECENT_LIMIT)]
        except Exception:
            pass

    recent_set = {r.lower() for r in recent}

    log.debug(
        "Forgotten: %d overall, %d recent (%d recent unique)",
        len(overall), len(recent), len(recent_set),
    )

    # ── Filter: hoog in overall, afwezig in recent ─────────────────────────
    forgotten: list[str] = []
    for artist_name in overall[:_TOP_RANK]:
        if artist_name.lower() in recent_set:
            continue
        if not plex.artist_in_plex(artist_name):
            continue
        forgotten.append(artist_name)

    log.info("Forgotten Favorites: %d vergeten artiesten", len(forgotten))

    if not forgotten:
        # Versoepeld: pak Plex-artiesten die in overall staan (ook als recent)
        forgotten = [a for a in overall[:_TOP_RANK] if plex.artist_in_plex(a)]
        log.debug("Forgotten (versoepeld): %d artiesten", len(forgotten))

    # ── Haal tracks op ────────────────────────────────────────────────────
    random.shuffle(forgotten)
    tracks: list[dict] = []

    for artist_name in forgotten:
        if len(tracks) >= _MAX_TRACKS:
            break
        artist_tracks = plex.get_tracks_for_artist(artist_name)
        if not artist_tracks:
            continue
        sample = random.sample(artist_tracks, min(_MAX_PER_ARTIST, len(artist_tracks)))
        tracks.extend(sample)

    random.shuffle(tracks)
    log.info("Forgotten Favorites: %d tracks", len(tracks))
    return tracks[:_MAX_TRACKS]
