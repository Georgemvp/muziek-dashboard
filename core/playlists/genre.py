"""
genre.py — Generator: Per-genre playlists.

Logica:
  1. Aggregeer genres uit alle enrichment_data bronnen per artiest:
       lastfm.tags, deezer.genres, discogs.genre + style,
       spotify.genres, musicbrainz.tags.
  2. Verzamel alle Plex-artiesten waarvan minstens één genre overeenkomt.
  3. Haal hun tracks op uit de Plex bibliotheek.
  4. Shuffle en retourneer max 50 tracks.
"""

import logging
import random

import core.database as db
import core.plex_client as plex

log = logging.getLogger(__name__)

_MAX_TRACKS = 50
_MAX_PER_ARTIST = 4


def _extract_genres(enrich: dict) -> list[str]:
    """Verzamel genre-strings uit alle enrichment-bronnen (zelfde als similar.py)."""
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


def build(genre: str) -> list[dict]:
    """
    Bouw een genre-playlist voor het opgegeven genre.

    Parameters
    ----------
    genre : str
        Genre-naam, bijv. 'jazz', 'rock', 'hip-hop' (case-insensitive).
    """
    target_genre = genre.lower().strip()
    log.debug("Genre '%s': artiesten zoeken in enrichment_data...", target_genre)

    # ── Haal alle verrijkte artiesten op ──────────────────────────────────
    artist_names = db.get_enrichment_artists()
    log.debug("Genre '%s': %d artiesten in enrichment_data", target_genre, len(artist_names))

    # ── Filter op genre-match ──────────────────────────────────────────────
    matching_artists: list[str] = []

    for artist_name in artist_names:
        if not plex.artist_in_plex(artist_name):
            continue  # alleen Plex-artiesten

        enrich = db.get_enrichment_data("artist", artist_name)
        genres = _extract_genres(enrich)

        # Partial match: 'hip-hop' matcht ook 'hip hop', 'hip-hop & rap', etc.
        for g in genres:
            if target_genre in g or g in target_genre:
                matching_artists.append(artist_name)
                break

    log.info("Genre '%s': %d passende artiesten in Plex", target_genre, len(matching_artists))

    if not matching_artists:
        return []

    # ── Haal tracks op ────────────────────────────────────────────────────
    random.shuffle(matching_artists)
    tracks: list[dict] = []

    for artist_name in matching_artists:
        if len(tracks) >= _MAX_TRACKS:
            break
        artist_tracks = plex.get_tracks_for_artist(artist_name)
        if not artist_tracks:
            continue
        sample = random.sample(artist_tracks, min(_MAX_PER_ARTIST, len(artist_tracks)))
        tracks.extend(sample)

    random.shuffle(tracks)
    log.info("Genre '%s': %d tracks", target_genre, len(tracks))
    return tracks[:_MAX_TRACKS]
