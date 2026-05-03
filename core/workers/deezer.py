"""
deezer.py — Deezer enrichment worker.

Gebruikt de gratis Deezer API (geen auth nodig).
Highlights: BPM voor tracks, label + record_type voor albums.
Rate limit: conservatief 1 call/sec.
"""
from __future__ import annotations

import logging
import time
from typing import Any

import requests

from core.workers.base import BaseWorker

DEEZER_BASE     = "https://api.deezer.com"
RATE_INTERVAL   = 1.1   # seconden
FUZZY_THRESHOLD = 0.80
REQUEST_TIMEOUT = 12


class DeezerWorker(BaseWorker):
    source = "deezer"

    def __init__(self, database, logger: logging.Logger):
        super().__init__(database, logger)
        self._last_call = 0.0
        self._session   = requests.Session()
        self._session.headers.update({"Accept": "application/json"})

    def _rate_limit(self) -> None:
        wait = max(0.0, RATE_INTERVAL - (time.time() - self._last_call))
        if wait > 0:
            time.sleep(wait)
        self._last_call = time.time()

    def _get(self, path: str) -> dict:
        self._rate_limit()
        url = f"{DEEZER_BASE}{path}"
        resp = self._session.get(url, timeout=REQUEST_TIMEOUT)
        if resp.status_code == 429:
            raise RuntimeError("Deezer rate limit bereikt")
        resp.raise_for_status()
        data = resp.json()
        if isinstance(data, dict) and data.get("error"):
            err = data["error"]
            raise RuntimeError(f"Deezer fout: {err.get('message', err)}")
        return data

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
                return {"ok": False, "error": "Geen Deezer-resultaat gevonden"}
            return {"ok": True, "data": data}

        except Exception as exc:
            self.log.warning(f"Deezer worker mislukt voor '{item.get('entity_name')}': {exc}")
            return {"ok": False, "error": str(exc)}

    def _process_artist(self, name: str) -> dict | None:
        data  = self._get(f"/search/artist?q={requests.utils.quote(name)}&limit=5")
        items = data.get("data", [])
        if not items:
            return None

        best = self.fuzzy_best(items, name, lambda a: a.get("name", ""), FUZZY_THRESHOLD)
        if not best:
            return None

        # Volledige artiest-details
        try:
            full = self._get(f"/artist/{best['id']}")
        except Exception:
            full = best

        # Genres via top albums
        genres = []
        try:
            album_data = self._get(f"/artist/{best['id']}/albums?limit=10")
            genre_set: set[str] = set()
            for al in album_data.get("data", []):
                for g in (al.get("genres") or {}).get("data", []):
                    genre_set.add(g["name"])
            genres = list(genre_set)[:8]
        except Exception:
            pass

        return {
            "deezer_id":   full.get("id"),
            "name":        full.get("name"),
            "artwork_url": full.get("picture_xl") or full.get("picture_big") or full.get("picture"),
            "nb_album":    full.get("nb_album"),
            "nb_fan":      full.get("nb_fan"),
            "radio":       full.get("radio"),
            "deezer_url":  full.get("link"),
            "genres":      genres,
            "source":      "deezer",
            "fetchedAt":   int(time.time() * 1000),
        }

    def _process_album(self, name: str) -> dict | None:
        data  = self._get(f"/search/album?q={requests.utils.quote(name)}&limit=5")
        items = data.get("data", [])
        if not items:
            return None

        best = self.fuzzy_best(items, name, lambda a: a.get("title", ""), FUZZY_THRESHOLD)
        if not best:
            return None

        try:
            full = self._get(f"/album/{best['id']}")
        except Exception:
            full = best

        genres = [(g["name"]) for g in (full.get("genres") or {}).get("data", [])]

        return {
            "deezer_id":    full.get("id"),
            "title":        full.get("title"),
            "artwork_url":  full.get("cover_xl") or full.get("cover_big") or full.get("cover"),
            "label":        full.get("label"),
            "genres":       genres,
            "explicit":     full.get("explicit_lyrics"),
            "record_type":  full.get("record_type"),
            "release_date": full.get("release_date"),
            "nb_tracks":    full.get("nb_tracks"),
            "deezer_url":   full.get("link"),
            "upc":          full.get("upc"),
            "source":       "deezer",
            "fetchedAt":    int(time.time() * 1000),
        }

    def _process_track(self, name: str) -> dict | None:
        data  = self._get(f"/search?q={requests.utils.quote(name)}&limit=5")
        items = data.get("data", [])
        if not items:
            return None

        best = self.fuzzy_best(items, name, lambda t: t.get("title", ""), FUZZY_THRESHOLD)
        if not best:
            return None

        try:
            full = self._get(f"/track/{best['id']}")
        except Exception:
            full = best

        album = full.get("album") or {}
        return {
            "deezer_id":   full.get("id"),
            "title":       full.get("title"),
            "bpm":         full.get("bpm"),
            "duration":    full.get("duration"),
            "explicit":    full.get("explicit_lyrics") or full.get("explicit_content_lyrics"),
            "gain":        full.get("gain"),
            "preview_url": full.get("preview"),
            "artwork_url": album.get("cover_xl") or album.get("cover_big"),
            "deezer_url":  full.get("link"),
            "isrc":        full.get("isrc"),
            "rank":        full.get("rank"),
            "source":      "deezer",
            "fetchedAt":   int(time.time() * 1000),
        }
