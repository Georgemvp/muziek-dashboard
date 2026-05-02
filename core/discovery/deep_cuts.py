"""
deep_cuts.py — Sectie: onbekende tracks van obscure Plex-artiesten.

Logica gelijk aan buildDeepCuts() in services/discover.js:
  1. Filter Plex-artiesten met een Spotify popularity < 30 en een Deezer ID.
  2. Haal de top tracks op via Deezer.
  3. Bewaar alleen tracks met een lage rank (< 50_000) — de "deep cuts".
"""

import logging
import random
from typing import Any

import core.database as db
import core.deezer_client as deezer
import core.plex_client as plex

log = logging.getLogger(__name__)

_POPULARITY_THRESHOLD = 30
_MAX_ARTISTS          = 40
_MAX_RESULTS          = 20
_RANK_THRESHOLD       = 50_000


def build() -> dict[str, Any]:
    """
    Bouw de 'deep cuts' sectie.
    Returns het resultaat-dict dat door builder.py wordt opgeslagen.
    """
    log.info("DeepCuts: bouwen")

    artist_names = plex.get_artist_names()
    candidates: list[dict] = []

    for name in artist_names:
        enrich     = db.get_enrichment_data("artist", name)
        popularity = (enrich.get("spotify") or {}).get("popularity")
        deezer_id  = (enrich.get("deezer") or {}).get("deezer_id")

        if popularity is None or popularity >= _POPULARITY_THRESHOLD:
            continue
        if not deezer_id:
            continue

        candidates.append({
            "name":       name,
            "popularity": popularity,
            "deezer_id":  deezer_id,
            "enrich":     enrich,
        })

    random.shuffle(candidates)
    results: list[dict] = []

    for c in candidates[:_MAX_ARTISTS]:
        tracks      = deezer.get_artist_top_tracks(c["deezer_id"])
        deep_tracks = [
            t for t in tracks
            if t.get("rank", 0) > 0 and t["rank"] < _RANK_THRESHOLD
        ]
        if not deep_tracks:
            continue

        enrich = c["enrich"]
        results.append({
            "artist":     c["name"],
            "popularity": c["popularity"],
            "image":      (enrich.get("deezer") or {}).get("artwork_url"),
            "tags":       ((enrich.get("lastfm") or {}).get("tags") or [])[:3],
            "tracks":     deep_tracks[:3],
        })

        if len(results) >= _MAX_RESULTS:
            break

    random.shuffle(results)

    log.info("DeepCuts: klaar — %d artiesten", len(results))
    return {"artists": results}
