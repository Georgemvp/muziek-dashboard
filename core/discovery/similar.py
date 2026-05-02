"""
similar.py — Sectie: vergelijkbare artiesten.

Logica gelijk aan buildSimilarArtists() in services/discover.js:
  1. Haal top-artiesten op uit twee willekeurige Last.fm-periodes +
     loved tracks + recent tracks.
  2. Zoek Deezer gerelateerde artiesten voor elk seed-artiest.
  3. Verrijk kandidaten met enrichment data (mbid, tags, albums).
  4. Diversificeer op genre (max 8 per primair genre).
"""

import logging
import random
from typing import Any

import core.database as db
import core.deezer_client as deezer
import core.lastfm_client as lastfm
import core.musicbrainz_client as mbz
import core.plex_client as plex

log = logging.getLogger(__name__)

_SEED_PERIODS = ["1month", "3month", "6month", "12month", "overall"]
_MAX_PER_GENRE = 8


def _extract_genres(enrich: dict) -> list[str]:
    """Verzamel genre-strings uit alle enrichment bronnen."""
    genres: list[str] = []
    if enrich.get("lastfm", {}).get("tags"):
        genres.extend(enrich["lastfm"]["tags"])
    if enrich.get("deezer", {}).get("genres"):
        genres.extend(enrich["deezer"]["genres"])
    if isinstance(enrich.get("discogs", {}).get("genre"), list):
        genres.extend(enrich["discogs"]["genre"])
    if isinstance(enrich.get("discogs", {}).get("style"), list):
        genres.extend(enrich["discogs"]["style"])
    if enrich.get("spotify", {}).get("genres"):
        genres.extend(enrich["spotify"]["genres"])
    if enrich.get("musicbrainz", {}).get("tags"):
        genres.extend(enrich["musicbrainz"]["tags"])
    return [g.lower().strip() for g in genres if g]


def build() -> dict[str, Any]:
    """
    Bouw de 'similar artists' sectie.
    Returns het resultaat-dict dat door builder.py wordt opgeslagen.
    """
    period1 = random.choice(_SEED_PERIODS)
    period2 = random.choice(_SEED_PERIODS)
    log.info("Similar: bouwen (period1=%s, period2=%s)", period1, period2)

    # ── History bijhouden zodat we niet steeds dezelfde artiesten tonen ───────
    history_array: list[str] = db.get_discover_section("history") or []
    # get_discover_section geeft None terug als verlopen — val terug op cache
    if history_array is None:
        raw = db.get_cache("discover:history")
        history_array = raw if isinstance(raw, list) else []
    history_set = {n.lower() for n in history_array}

    # ── Seeds verzamelen ───────────────────────────────────────────────────────
    names1    = [a["name"] for a in lastfm.get_top_artists(period1, 30)]
    names2    = [a["name"] for a in lastfm.get_top_artists(period2, 30)]
    loved     = lastfm.get_loved_tracks(30)
    recent    = lastfm.get_recent_tracks(50)

    all_seeds = list(dict.fromkeys([*loved, *recent, *names1, *names2]))
    seeds     = random.sample(all_seeds, min(35, len(all_seeds)))
    seed_set  = set(s.lower() for s in seeds)

    # ── Kandidaten verzamelen via Deezer related ───────────────────────────────
    candidate_map: dict[str, dict] = {}
    for seed in seeds:
        for s in deezer.get_similar_artists(seed, 20):
            name = s.get("name") or ""
            if not name:
                continue
            if name.lower() in seed_set:
                continue
            if name in candidate_map:
                continue
            if name.lower() in history_set:
                continue
            candidate_map[name] = {
                "name":   name,
                "match":  s.get("match", 1.0),
                "reason": seed,
                "image":  s.get("image"),
                "in_plex": plex.artist_in_plex(name),
            }

    # Sorteer: nieuw (niet in Plex) iets hoger, daarna match-score
    all_candidates = sorted(
        candidate_map.values(),
        key=lambda c: c["match"] * (0.8 if c["in_plex"] else 1.2),
        reverse=True,
    )

    # Neem een gevarieerde pool: shuffle top-helft en bottom-helft apart
    half = max(1, len(all_candidates) // 2)
    top_half    = all_candidates[:half]
    bottom_half = all_candidates[half:]
    random.shuffle(top_half)
    random.shuffle(bottom_half)
    pool = (top_half + bottom_half)[:60]

    # ── Verrijken via enrichment_data ─────────────────────────────────────────
    enriched: list[dict] = []
    for c in pool:
        enrich = db.get_enrichment_data("artist", c["name"])
        artist_mbid = (enrich.get("musicbrainz") or {}).get("mbid")

        albums: list[dict] = []
        if artist_mbid:
            raw_albums = mbz.get_albums(artist_mbid)
            albums = [
                {**a, "in_plex": plex.album_in_plex(c["name"], a["title"])}
                for a in raw_albums
            ]

        enriched.append({
            **c,
            "image":         c["image"] or (enrich.get("deezer") or {}).get("artwork_url"),
            "mbid":          artist_mbid,
            "country":       (enrich.get("musicbrainz") or {}).get("country"),
            "start_year":    ((enrich.get("musicbrainz") or {}).get("begin_date") or "")[:4] or None,
            "tags":          (enrich.get("lastfm") or {}).get("tags")
                             or (enrich.get("musicbrainz") or {}).get("tags")
                             or [],
            "albums":        albums,
            "missing_count": sum(1 for a in albums if not a.get("in_plex")),
            "total_albums":  len(albums),
        })

    # ── Diversificeer op primair genre ────────────────────────────────────────
    genre_count: dict[str, int] = {}
    diverse_pool: list[dict] = []
    for artist in enriched:
        primary_genre = (artist["tags"][0] if artist["tags"] else "unknown").lower()
        count = genre_count.get(primary_genre, 0)
        if count < _MAX_PER_GENRE:
            genre_count[primary_genre] = count + 1
            diverse_pool.append(artist)

    # ── History bijwerken ─────────────────────────────────────────────────────
    new_history = (history_array + [a["name"] for a in diverse_pool])[-200:]
    # Sla history op als reguliere cache (7 dagen)
    db.set_cache("discover:history", new_history)

    log.info("Similar: klaar — %d artiesten", len(diverse_pool))
    return {
        "artists":  diverse_pool,
        "based_on": seeds,
        "periods":  [period1, period2],
    }
