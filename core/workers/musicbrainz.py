"""
musicbrainz.py — MusicBrainz enrichment worker.

Gebruikt de musicbrainzngs bibliotheek (ingebouwde rate limit: 1 req/sec).
Geen API key nodig. User-Agent verplicht.
"""

import logging
import time
from typing import Any, Optional

import musicbrainzngs

from core.workers.base import BaseWorker

musicbrainzngs.set_useragent("LastfmMuziekApp", "2.0", "muziek-dashboard")
musicbrainzngs.set_rate_limit(limit_or_interval=1.0, new_requests=1)


class MusicBrainzWorker(BaseWorker):
    source = "musicbrainz"

    def process(self, item: dict) -> dict[str, Any]:
        try:
            entity_type = item["entity_type"]
            name        = item["entity_name"]

            if entity_type == "artist":
                data = self._process_artist(name)
            elif entity_type == "album":
                data = self._process_album(name)
            elif entity_type == "track":
                data = self._process_track(name)
            else:
                return {"ok": False, "error": f"Onbekend entity_type: {entity_type}"}

            if not data:
                return {"ok": False, "error": "Geen MBZ-resultaat gevonden"}
            return {"ok": True, "data": data}

        except Exception as exc:
            self.log.warning(f"MusicBrainz worker mislukt voor '{item.get('entity_name')}': {exc}")
            return {"ok": False, "error": str(exc)}

    # ── Artiest ───────────────────────────────────────────────────────────────

    def _process_artist(self, name: str) -> Optional[dict]:
        result = musicbrainzngs.search_artists(artist=name, limit=5)
        artists = result.get("artist-list", [])
        if not artists:
            return None

        best = self.fuzzy_best(artists, name, lambda a: a.get("name", ""))
        if not best:
            best = artists[0]

        return {
            "mbid":           best.get("id"),
            "entity_type":    "artist",
            "name":           best.get("name"),
            "sort_name":      best.get("sort-name"),
            "disambiguation": best.get("disambiguation"),
            "country":        best.get("country"),
            "area":           (best.get("area") or {}).get("name"),
            "type":           best.get("type"),
            "gender":         best.get("gender"),
            "begin_date":     (best.get("life-span") or {}).get("begin"),
            "end_date":       (best.get("life-span") or {}).get("end"),
            "ended":          (best.get("life-span") or {}).get("ended") == "true",
            "tags":           [t["name"] for t in sorted(
                                   best.get("tag-list", []),
                                   key=lambda t: -int(t.get("count", 0))
                               )][:10],
            "isni_list":      best.get("isni-list", [])[:3],
            "source":         "musicbrainz",
            "fetchedAt":      int(time.time() * 1000),
        }

    # ── Album (release-group) ─────────────────────────────────────────────────

    def _process_album(self, name: str) -> Optional[dict]:
        result = musicbrainzngs.search_release_groups(releasegroup=name, limit=5)
        groups = result.get("release-group-list", [])
        if not groups:
            return None

        best = self.fuzzy_best(groups, name, lambda g: g.get("title", ""))
        if not best:
            best = groups[0]

        return {
            "mbid":               best.get("id"),
            "entity_type":        "release",
            "title":              best.get("title"),
            "disambiguation":     best.get("disambiguation"),
            "primary_type":       best.get("primary-type"),
            "secondary_types":    best.get("secondary-type-list", []),
            "first_release_date": best.get("first-release-date"),
            "artist_credit":      [
                (ac.get("artist") or {}).get("name")
                for ac in best.get("artist-credit", [])
                if isinstance(ac, dict)
            ],
            "tags":               [t["name"] for t in sorted(
                                       best.get("tag-list", []),
                                       key=lambda t: -int(t.get("count", 0))
                                   )][:8],
            "source":             "musicbrainz",
            "fetchedAt":          int(time.time() * 1000),
        }

    # ── Track (recording) ─────────────────────────────────────────────────────

    def _process_track(self, name: str) -> Optional[dict]:
        result = musicbrainzngs.search_recordings(recording=name, limit=5)
        recordings = result.get("recording-list", [])
        if not recordings:
            return None

        best = self.fuzzy_best(recordings, name, lambda r: r.get("title", ""))
        if not best:
            best = recordings[0]

        return {
            "mbid":           best.get("id"),
            "entity_type":    "recording",
            "title":          best.get("title"),
            "disambiguation": best.get("disambiguation"),
            "length":         best.get("length"),
            "artist_credit":  [
                (ac.get("artist") or {}).get("name")
                for ac in best.get("artist-credit", [])
                if isinstance(ac, dict)
            ],
            "isrcs":          best.get("isrc-list", [])[:3],
            "tags":           [t["name"] for t in sorted(
                                   best.get("tag-list", []),
                                   key=lambda t: -int(t.get("count", 0))
                               )][:8],
            "releases":       [
                {"mbid": r.get("id"), "title": r.get("title"), "date": r.get("date")}
                for r in best.get("release-list", [])[:3]
            ],
            "source":         "musicbrainz",
            "fetchedAt":      int(time.time() * 1000),
        }
