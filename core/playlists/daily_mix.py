"""
daily_mix.py — Generator: Daily Mix.

Logica:
  1. Laad alle tracks uit de Plex bibliotheek.
  2. Bepaal gewichten op basis van Last.fm playcount per artiest:
       - Hoog gespeeld → hogere kans om in de mix te belanden.
       - Onbekende playcount → basisgewicht 1.
  3. Gewogen willekeurige selectie van 50 tracks.

Gewicht-formule:
  weight = log2(playcount + 2)   →  playcount=0 ⟹ 1.0, playcount=100 ⟹ 6.7
  (log-schaal zodat populaire artiesten niet alles domineren)

Playcount bronnen (in volgorde):
  1. enrichment_data.lastfm.playcount (opgeslagen door LastFm worker)
  2. api:topartists:overall cache (opgeslagen door Node.js)
  3. basisgewicht 1 als onbekend
"""

import json
import logging
import math
import random
from collections import defaultdict

import core.database as db
import core.plex_client as plex

log = logging.getLogger(__name__)

_MAX_TRACKS = 50


def _load_playcounts() -> dict[str, int]:
    """
    Bouw een artiest → playcount map vanuit enrichment_data en/of cache.
    """
    playcounts: dict[str, int] = defaultdict(int)

    # 1. enrichment_data.lastfm
    try:
        with db.get_db() as conn:
            rows = conn.execute(
                "SELECT entity_name, data_json FROM enrichment_data "
                "WHERE entity_type = 'artist' AND source = 'lastfm'"
            ).fetchall()
        for row in rows:
            try:
                data = json.loads(row["data_json"])
                pc   = int(data.get("playcount", 0) or 0)
                if pc > 0:
                    playcounts[row["entity_name"].lower()] = pc
            except (json.JSONDecodeError, TypeError, ValueError):
                continue
    except Exception as exc:
        log.warning("Daily Mix: enrichment_data lezen mislukt: %s", exc)

    # 2. api:topartists cache (als aanvulling)
    for cache_key in ["api:topartists:overall", "api:topartists:12month"]:
        cached = db.get_cache(cache_key)
        if not cached:
            continue
        artists = []
        if isinstance(cached, dict):
            artists = cached.get("topartists", {}).get("artist", []) or []
        elif isinstance(cached, list):
            artists = cached

        for _i, a in enumerate(artists):
            name      = a.get("name", "") if isinstance(a, dict) else str(a)
            playcount = int(a.get("playcount", 0) or 0) if isinstance(a, dict) else 0
            if not name:
                continue
            key = name.lower()
            if key not in playcounts and playcount > 0:
                playcounts[key] = playcount
            elif playcount > 0:
                # Combineer: neem het maximum
                playcounts[key] = max(playcounts[key], playcount)

    return dict(playcounts)


def build() -> list[dict]:
    """Bouw de Daily Mix playlist."""

    log.debug("Daily Mix: alle Plex tracks laden...")
    all_tracks = plex.get_all_track_objects()
    if not all_tracks:
        log.warning("Daily Mix: geen Plex tracks beschikbaar")
        return []

    # ── Laad playcounts voor weging ────────────────────────────────────────
    playcounts = _load_playcounts()
    log.debug("Daily Mix: %d artiest-playcounts geladen", len(playcounts))

    # ── Bereken gewicht per track ──────────────────────────────────────────
    weights: list[float] = []
    for track in all_tracks:
        artist_key = (track.get("artist") or "").lower()
        pc = playcounts.get(artist_key, 0)
        # log2(pc + 2) zodat tracks van populaire artiesten vaker voorkomen
        # maar niet alles domineren
        weight = math.log2(pc + 2)
        weights.append(weight)

    # ── Gewogen sampling zonder teruglegging ──────────────────────────────
    n = min(_MAX_TRACKS, len(all_tracks))
    try:
        selected = random.choices(all_tracks, weights=weights, k=n * 3)
        # Dedupliceer op plex_key (zelfde track niet twee keer)
        seen_keys: set[str] = set()
        unique: list[dict] = []
        for t in selected:
            key = t.get("plex_key") or f"{t.get('artist')}||{t.get('title')}"
            if key not in seen_keys:
                seen_keys.add(key)
                unique.append(t)
            if len(unique) >= n:
                break
        tracks = unique[:n]
    except Exception as exc:
        log.warning("Daily Mix: gewogen sampling mislukt (%s), gebruik uniform", exc)
        tracks = random.sample(all_tracks, n)

    log.info("Daily Mix: %d tracks geselecteerd uit %d", len(tracks), len(all_tracks))
    return tracks
