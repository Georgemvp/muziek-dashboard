"""
hidden_gems.py — Sectie: vergeten favorieten.

Logica gelijk aan buildHiddenGems() in services/discover.js:
  Artiesten die overall hoog staan in Last.fm maar de afgelopen
  3 maanden NIET gespeeld zijn én aanwezig zijn in Plex.
"""

import logging
from typing import Any

import core.database as db
import core.lastfm_client as lastfm
import core.plex_client as plex

log = logging.getLogger(__name__)


def build() -> dict[str, Any]:
    """
    Bouw de 'hidden gems' sectie.
    Returns het resultaat-dict dat door builder.py wordt opgeslagen.
    """
    log.info("HiddenGems: bouwen")

    overall_artists = [a["name"] for a in lastfm.get_top_artists("overall", 100)]
    recent_artists  = [a["name"] for a in lastfm.get_top_artists("3month",  50)]
    recent_set      = {n.lower() for n in recent_artists}

    forgotten = [
        name for name in overall_artists
        if name.lower() not in recent_set and plex.artist_in_plex(name)
    ]

    results: list[dict] = []
    for name in forgotten[:25]:
        enrich = db.get_enrichment_data("artist", name)
        results.append({
            "name":      name,
            "image":     (enrich.get("deezer") or {}).get("artwork_url"),
            "tags":      ((enrich.get("lastfm") or {}).get("tags") or [])[:3],
            "lastfm_url": (enrich.get("lastfm") or {}).get("lastfm_url"),
        })

    log.info("HiddenGems: klaar — %d artiesten", len(results))
    return {"artists": results}
