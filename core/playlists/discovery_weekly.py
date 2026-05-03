"""
discovery_weekly.py — Generator: Discovery Weekly.

Logica (zero externe API calls):
  1. Haal top-10 seed-artiesten op uit gecachede Last.fm data (cache tabel)
     of via lastfm_client als er geen cache is.
  2. Laad deezer.related_artists voor elke seed uit enrichment_data.
  3. Filter: verwijder artiesten die al in Plex staan (we willen nieuwe ontdekkingen).
     Artiesten die WEL in Plex staan maar zelden gespeeld worden worden ook meegenomen.
  4. Voor gerelateerde artiesten die al in Plex staan: voeg hun tracks toe.
     Voor artiesten buiten Plex: voeg ze toe als discovery-items (plex_key=None).
  5. Shuffle en retourneer max 50 items.
"""

import logging
import random

import core.database as db
import core.lastfm_client as lastfm
import core.plex_client as plex

log = logging.getLogger(__name__)

_MAX_TRACKS = 50
_MAX_PER_ARTIST = 3
_SEED_COUNT = 10

# Cache keys gebruikt door de Node.js app voor top-artiesten
_CACHE_KEYS = [
    "api:topartists:1month",
    "api:topartists:3month",
    "api:topartists:overall",
    "api:topartists:7day",
]


def _get_seed_artists() -> list[str]:
    """
    Haal seed-artiesten op — eerst uit SQLite cache, dan via API.
    """
    for cache_key in _CACHE_KEYS:
        cached = db.get_cache(cache_key)
        if cached:
            # Node.js slaat { topartists: { artist: [...] } } op
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
                log.debug("Discovery: seeds uit cache ('%s'): %d artiesten", cache_key, len(names))
                return names[:_SEED_COUNT]

    # Fallback: roep Last.fm API aan
    log.debug("Discovery: geen cache gevonden, haal top-artiesten op via API")
    try:
        artists = lastfm.get_top_artists("1month", 20)
        return [a["name"] for a in artists[:_SEED_COUNT]]
    except Exception as exc:
        log.warning("Discovery: top-artiesten ophalen mislukt: %s", exc)
        return []


def _get_related_artists(seed_name: str) -> list[str]:
    """
    Haal gerelateerde artiesten op uit enrichment_data.deezer.related_artists.
    """
    try:
        enrich = db.get_enrichment_data("artist", seed_name)
        deezer = enrich.get("deezer") or {}

        related = deezer.get("related_artists") or []
        if isinstance(related, list):
            names = []
            for a in related:
                if isinstance(a, dict):
                    names.append(a.get("name") or "")
                elif isinstance(a, str):
                    names.append(a)
            return [n for n in names if n]
    except Exception as exc:
        log.debug("Discovery: related artists voor '%s' mislukten: %s", seed_name, exc)
    return []


def build() -> list[dict]:
    """Bouw de Discovery Weekly playlist."""

    seeds = _get_seed_artists()
    if not seeds:
        log.warning("Discovery Weekly: geen seed-artiesten gevonden")
        return []

    log.debug("Discovery Weekly: seeds = %s", seeds)

    seed_set = {s.lower() for s in seeds}

    # ── Verzamel gerelateerde artiesten ────────────────────────────────────
    candidate_set: dict[str, dict] = {}  # name → {name, reason, in_plex, enrich}

    for seed in seeds:
        related = _get_related_artists(seed)
        for rel_name in related:
            if not rel_name or rel_name.lower() in seed_set:
                continue
            if rel_name in candidate_set:
                continue

            in_plex = plex.artist_in_plex(rel_name)
            enrich  = db.get_enrichment_data("artist", rel_name)

            candidate_set[rel_name] = {
                "name":    rel_name,
                "reason":  seed,
                "in_plex": in_plex,
                "enrich":  enrich,
            }

    log.debug("Discovery Weekly: %d kandidaten", len(candidate_set))

    if not candidate_set:
        log.warning("Discovery Weekly: geen gerelateerde artiesten gevonden in enrichment_data")
        return []

    # ── Bouw tracks ────────────────────────────────────────────────────────
    tracks: list[dict] = []

    # Eerst de artiesten die al in Plex staan
    plex_artists  = [c for c in candidate_set.values() if c["in_plex"]]
    other_artists = [c for c in candidate_set.values() if not c["in_plex"]]

    random.shuffle(plex_artists)
    random.shuffle(other_artists)

    # Voor Plex-artiesten: voeg echte tracks toe
    for candidate in plex_artists:
        if len(tracks) >= _MAX_TRACKS:
            break
        artist_tracks = plex.get_tracks_for_artist(candidate["name"])
        if not artist_tracks:
            continue
        sample = random.sample(artist_tracks, min(_MAX_PER_ARTIST, len(artist_tracks)))
        for t in sample:
            tracks.append({**t, "discovery_reason": f"Vergelijkbaar met {candidate['reason']}"})

    # Vul aan met non-Plex discovery items
    for candidate in other_artists:
        if len(tracks) >= _MAX_TRACKS:
            break

        enrich      = candidate["enrich"]
        deezer      = enrich.get("deezer") or {}
        lastfm_data = enrich.get("lastfm") or {}
        mb          = enrich.get("musicbrainz") or {}

        artwork_url = (
            deezer.get("artwork_url")
            or (enrich.get("audiodb") or {}).get("artwork_url")
        )
        tags = (
            (lastfm_data.get("tags") or [])
            or (mb.get("tags") or [])
            or []
        )

        tracks.append({
            "artist":    candidate["name"],
            "title":     None,
            "album":     None,
            "year":      None,
            "duration":  None,
            "plex_key":  None,
            "cover_url": artwork_url,
            "tags":      tags[:5],
            "discovery_reason": f"Vergelijkbaar met {candidate['reason']}",
        })

    random.shuffle(tracks)
    log.info("Discovery Weekly: %d items", len(tracks))
    return tracks[:_MAX_TRACKS]
