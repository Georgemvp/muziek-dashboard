"""
release_radar.py — Generator: Release Radar.

Logica (zero externe API calls):
  1. Laad alle artiesten met musicbrainz enrichment data uit SQLite.
  2. Filter artiesten waarvan je Last.fm playcount > 0 hebt (= artiesten die
     je luistert/geluisterd hebt).
  3. Zoek in de gecachede musicbrainz.releases naar releases van de afgelopen
     30 dagen.
  4. Sorteer op Last.fm overall playcount (meest gespeeld = meest relevant).
  5. Bouw track-objecten — plex_key is ingevuld als het album al in Plex staat,
     anders None (= nieuwe release, nog niet in library).

Limiet: max 50 items.
"""
from __future__ import annotations

import json
import logging
from datetime import UTC, datetime, timedelta

import core.database as db
import core.plex_client as plex

log = logging.getLogger(__name__)

_MAX_TRACKS = 50
_LOOKBACK_DAYS = 30


def _parse_date(date_str: str) -> datetime | None:
    """Probeer YYYY-MM-DD of YYYY te parsen naar een datetime (UTC)."""
    if not date_str:
        return None
    for fmt in ("%Y-%m-%d", "%Y-%m", "%Y"):
        try:
            return datetime.strptime(date_str[:len(fmt)], fmt).replace(tzinfo=UTC)
        except ValueError:
            continue
    return None


def build() -> list[dict]:
    """
    Bouw de Release Radar playlist.

    Leest uitsluitend uit enrichment_data (SQLite) — geen externe API calls.
    """
    cutoff = datetime.now(UTC) - timedelta(days=_LOOKBACK_DAYS)

    # ── Laad alle artist enrichment data in één query ──────────────────────
    try:
        with db.get_db() as conn:
            rows = conn.execute(
                "SELECT entity_name, source, data_json FROM enrichment_data "
                "WHERE entity_type = 'artist'"
            ).fetchall()
    except Exception as exc:
        log.error("Release Radar: enrichment_data lezen mislukt: %s", exc)
        return []

    # Groepeer per artiest
    artist_data: dict[str, dict] = {}
    for row in rows:
        name   = row["entity_name"]
        source = row["source"]
        try:
            data = json.loads(row["data_json"])
        except (json.JSONDecodeError, TypeError):
            continue
        if name not in artist_data:
            artist_data[name] = {}
        artist_data[name][source] = data

    log.debug("Release Radar: %d artiesten in enrichment_data", len(artist_data))

    # ── Doorzoek releases op datum ─────────────────────────────────────────
    results: list[dict] = []

    for artist_name, sources in artist_data.items():
        mb = sources.get("musicbrainz", {})
        releases = mb.get("releases", [])
        if not releases:
            continue

        # Last.fm playcount voor sortering
        lastfm_data = sources.get("lastfm", {})
        playcount   = int(lastfm_data.get("playcount", 0) or 0)

        # Artwork
        artwork_url = (
            (sources.get("deezer") or {}).get("artwork_url")
            or (sources.get("audiodb") or {}).get("artwork_url")
        )

        for release in releases:
            date_str = release.get("date") or ""
            release_date = _parse_date(date_str)
            if not release_date or release_date < cutoff:
                continue

            title = release.get("title") or ""
            if not title:
                continue

            in_plex = plex.album_in_plex(artist_name, title)

            results.append({
                "artist":    artist_name,
                "title":     title,          # album/single titel
                "album":     title,
                "year":      release_date.year,
                "duration":  None,
                "plex_key":  _find_plex_album_key(artist_name, title) if in_plex else None,
                "cover_url": artwork_url,
                "release_date": date_str,
                "playcount":    playcount,
                "release_type": release.get("type"),
                "mbid":         release.get("mbid"),
                "in_plex":      in_plex,
            })

    # ── Sorteer: recente datum eerst, bij gelijkspel op playcount ──────────
    results.sort(
        key=lambda r: (r["release_date"] or "", r["playcount"]),
        reverse=True,
    )

    # Dedupliceer op artiest+titel
    seen: set[str] = set()
    unique: list[dict] = []
    for r in results:
        key = f"{r['artist'].lower()}||{r['album'].lower()}"
        if key not in seen:
            seen.add(key)
            unique.append(r)

    log.info("Release Radar: %d recente releases gevonden", len(unique))
    return unique[:_MAX_TRACKS]


def _find_plex_album_key(artist: str, album: str) -> str | None:
    """
    Zoek de Plex ratingKey van een album via de in-memory track cache.
    Geeft de ratingKey van de eerste track van dat album terug, of None.
    """
    try:
        tracks = plex.get_tracks_for_artist(artist)
        for t in tracks:
            if (t.get("album") or "").lower() == album.lower():
                return t.get("plex_key")
    except Exception:
        pass
    return None
