"""
decade.py — Generator: Per-decennium playlists.

Logica:
  1. Laad alle tracks uit de Plex bibliotheek.
  2. Filter op het opgegeven decennium (bijv. 1990 → 1990–1999).
  3. Shuffle en retourneer max 50 tracks.

Het jaartal wordt bepaald via track.parentYear (albumjaar) — hetzelfde als
wat de Plex plexapi API retourneert.
"""

import logging
import random

import core.plex_client as plex

log = logging.getLogger(__name__)

_MAX_TRACKS = 50


def build(decade: int) -> list[dict]:
    """
    Bouw een decennium-playlist voor het opgegeven decennium.

    Parameters
    ----------
    decade : int
        Startjaar van het decennium, bijv. 1990 voor 1990s.
    """
    decade_start = int(decade)
    decade_end   = decade_start + 9

    log.debug("Decade %ds: tracks laden...", decade_start)

    all_tracks = plex.get_all_track_objects()
    if not all_tracks:
        log.warning("Decade %ds: geen Plex tracks beschikbaar", decade_start)
        return []

    # Filter op jaar
    decade_tracks = [
        t for t in all_tracks
        if t.get("year") and decade_start <= int(t["year"]) <= decade_end
    ]

    log.info(
        "Decade %ds: %d van %d tracks passen",
        decade_start, len(decade_tracks), len(all_tracks),
    )

    if not decade_tracks:
        return []

    random.shuffle(decade_tracks)
    return decade_tracks[:_MAX_TRACKS]
