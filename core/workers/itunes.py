"""
itunes.py — iTunes/Apple Music enrichment worker.

Gebruikt de gratis iTunes Search API (geen auth nodig).
Rate limit: max ~20 calls/min → 1 call per 4 sec.
"""

import logging
import time
from typing import Any, Optional

import requests

from core.workers.base import BaseWorker

ITUNES_BASE   = "https://itunes.apple.com"
RATE_INTERVAL = 4.0   # seconden
REQUEST_TIMEOUT = 10


class ITunesWorker(BaseWorker):
    source = "itunes"

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

    def process(self, item: dict) -> dict[str, Any]:
        try:
            data = self._search(item["entity_name"], item["entity_type"])
            if not data:
                return {"ok": False, "error": "No results found"}
            return {"ok": True, "data": data}
        except Exception as exc:
            self.log.warning(f"iTunes worker mislukt voor '{item.get('entity_name')}': {exc}")
            return {"ok": False, "error": str(exc)}

    def _search(self, name: str, entity_type: str = "artist") -> Optional[dict]:
        self._rate_limit()

        itunes_entity = (
            "musicArtist" if entity_type == "artist" else
            "album"       if entity_type == "album"  else
            "musicTrack"
        )

        resp = self._session.get(
            f"{ITUNES_BASE}/search",
            params={"term": name, "entity": itunes_entity, "limit": 5, "media": "music"},
            timeout=REQUEST_TIMEOUT,
        )
        resp.raise_for_status()

        results = resp.json().get("results", [])
        if not results:
            return None

        # Exacte match op naam-veld
        norm   = lambda s: (s or "").lower().strip()
        fields = ["artistName", "collectionName", "trackName"]
        exact  = next(
            (r for r in results
             if any(norm(r.get(f, "")) == norm(name) for f in fields)),
            None,
        )
        best = exact or results[0]

        if entity_type == "artist":
            return self._map_artist(best, results)
        if entity_type == "album":
            return self._map_album(best)
        return self._map_track(best)

    def _map_artist(self, item: dict, all_results: list) -> dict:
        genres = list({r["primaryGenreName"] for r in all_results if r.get("primaryGenreName")})
        return {
            "artistId":      item.get("artistId"),
            "artistName":    item.get("artistName"),
            "artistType":    item.get("artistType"),
            "primaryGenre":  item.get("primaryGenreName"),
            "genres":        genres,
            "artistLinkUrl": item.get("artistLinkUrl"),
            "artworkUrl":    item.get("artworkUrl100"),
            "source":        "itunes",
            "fetchedAt":     int(time.time() * 1000),
        }

    def _map_album(self, item: dict) -> dict:
        artwork = (item.get("artworkUrl100") or "").replace("100x100", "600x600")
        return {
            "collectionId":    item.get("collectionId"),
            "collectionName":  item.get("collectionName"),
            "artistName":      item.get("artistName"),
            "artworkUrl":      artwork or None,
            "releaseDate":     item.get("releaseDate"),
            "trackCount":      item.get("trackCount"),
            "primaryGenre":    item.get("primaryGenreName"),
            "collectionPrice": item.get("collectionPrice"),
            "currency":        item.get("currency"),
            "country":         item.get("country"),
            "source":          "itunes",
            "fetchedAt":       int(time.time() * 1000),
        }

    def _map_track(self, item: dict) -> dict:
        artwork = (item.get("artworkUrl100") or "").replace("100x100", "600x600")
        return {
            "trackId":         item.get("trackId"),
            "trackName":       item.get("trackName"),
            "artistName":      item.get("artistName"),
            "collectionName":  item.get("collectionName"),
            "previewUrl":      item.get("previewUrl"),
            "artworkUrl":      artwork or None,
            "trackPrice":      item.get("trackPrice"),
            "releaseDate":     item.get("releaseDate"),
            "primaryGenre":    item.get("primaryGenreName"),
            "trackTimeMillis": item.get("trackTimeMillis"),
            "source":          "itunes",
            "fetchedAt":       int(time.time() * 1000),
        }
