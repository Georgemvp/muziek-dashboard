"""
undiscovered.py — Sectie: ontbrekende albums van je top-artiesten.

Logica gelijk aan buildUndiscoveredAlbums() in services/discover.js:
  1. Haal top-50 meest-gespeelde artiesten op via Last.fm (overall).
  2. Zoek de MBID op via enrichment_data, of direct via MusicBrainz.
  3. Vergelijk de MBZ discografie met de Plex bibliotheek.
  4. Retourneer albums die NIET in Plex staan.
"""

import logging
from typing import Any

import core.database as db
import core.lastfm_client as lastfm
import core.musicbrainz_client as mbz
import core.plex_client as plex

log = logging.getLogger(__name__)


def build() -> dict[str, Any]:
    """
    Bouw de 'undiscovered albums' sectie.
    Returns het resultaat-dict dat door builder.py wordt opgeslagen.
    """
    log.info("Undiscovered: bouwen")

    top_artists = lastfm.get_top_artists(period="overall", limit=50)
    results: list[dict] = []

    for artist in top_artists:
        name      = artist["name"]
        playcount = artist["playcount"]

        # MBID ophalen: eerst enrichment cache, daarna directe API call
        enrich = db.get_enrichment_data("artist", name)
        artist_mbid = (enrich.get("musicbrainz") or {}).get("mbid")
        if not artist_mbid:
            artist_mbid = mbz.get_artist_mbid(name)
        if not artist_mbid:
            continue

        albums = mbz.get_albums(artist_mbid)
        for album in albums:
            if plex.album_in_plex(name, album["title"]):
                continue
            results.append({
                "artist":    name,
                "playcount": playcount,
                "title":     album["title"],
                "year":      album.get("year"),
                "mbid":      album.get("mbid"),
                "cover_url": (
                    album.get("cover_url")
                    or (enrich.get("deezer") or {}).get("artwork_url")
                ),
                "in_plex":   False,
            })

    # Meest gespeelde artiesten eerst, daarna nieuwste albums
    results.sort(
        key=lambda r: (-r["playcount"], -(int(r["year"]) if r.get("year") else 0))
    )

    log.info("Undiscovered: klaar — %d albums", min(len(results), 30))
    return {"albums": results[:30]}
