"""
new_in_genres.py — Sectie: nieuwe releases in jouw top-genres.

Logica gelijk aan buildNewInGenres() in services/discover.js:
  1. Bepaal top-5 genres uit de enrichment_data van alle Plex-artiesten.
  2. Zoek via MusicBrainz Search API naar releases van de afgelopen 60 dagen.
  3. Retourneer gesorteerd op releasedatum (nieuwste eerst).
"""

import logging
from typing import Any

import core.database as db
import core.musicbrainz_client as mbz
import core.plex_client as plex

log = logging.getLogger(__name__)

_CUTOFF_DAYS = 60


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
    Bouw de 'new in genres' sectie.
    Returns het resultaat-dict dat door builder.py wordt opgeslagen.
    """
    log.info("NewInGenres: bouwen")

    # ── Top-genres bepalen uit enrichment_data van alle Plex-artiesten ────────
    artist_names = plex.get_artist_names()
    genre_freq: dict[str, int] = {}
    for name in artist_names:
        enrich = db.get_enrichment_data("artist", name)
        for genre in _extract_genres(enrich):
            genre_freq[genre] = genre_freq.get(genre, 0) + 1

    top_genres = [
        g for g, _ in sorted(genre_freq.items(), key=lambda x: -x[1])
    ][:5]

    if not top_genres:
        log.info("NewInGenres: geen genres gevonden — Plex of enrichment leeg?")
        return {"releases": [], "genres": []}

    # ── Releases zoeken per genre ──────────────────────────────────────────────
    cutoff = mbz.cutoff_iso(_CUTOFF_DAYS)
    seen: set[str] = set()
    results: list[dict] = []

    for genre in top_genres:
        releases = mbz.search_by_tag(tag=genre, cutoff_date=cutoff, limit=20)
        for r in releases:
            if r["mbid"] in seen:
                continue
            seen.add(r["mbid"])
            results.append({
                **r,
                "in_plex": plex.album_in_plex(r["artist"], r["title"]),
                "genre":   genre,
            })

    results.sort(key=lambda r: r["release_date"], reverse=True)

    log.info("NewInGenres: klaar — %d releases voor genres %s", len(results), top_genres)
    return {"releases": results, "genres": top_genres}
