"""
qobuz.py — Qobuz enrichment worker via OrpheusDL API proxy.

Geen directe Qobuz API-calls — gaat via de lokale OrpheusDL instantie.
Rate limit: conservatief 1 call per 3 sec.
"""

import logging
import os
import time
from typing import Any, Optional

import requests

from core.workers.base import BaseWorker

RATE_INTERVAL   = 3.0
REQUEST_TIMEOUT = 12


class QobuzWorker(BaseWorker):
    source = "qobuz"

    def __init__(self, database, logger: logging.Logger,
                 orpheus_url: Optional[str] = None):
        super().__init__(database, logger)
        self._url       = orpheus_url or os.environ.get("ORPHEUS_URL", "http://localhost:5000")
        self._last_call = 0.0
        self._session   = requests.Session()
        self._session.headers.update({"Accept": "application/json"})

    @property
    def is_configured(self) -> bool:
        return bool(self._url)

    def _rate_limit(self) -> None:
        wait = max(0.0, RATE_INTERVAL - (time.time() - self._last_call))
        if wait > 0:
            time.sleep(wait)
        self._last_call = time.time()

    def _get(self, path: str) -> Optional[dict]:
        self._rate_limit()
        resp = self._session.get(f"{self._url}{path}", timeout=REQUEST_TIMEOUT)
        if resp.status_code == 404:
            return None
        if resp.status_code in (401, 403):
            raise RuntimeError("Qobuz: niet geauthenticeerd via OrpheusDL")
        resp.raise_for_status()
        return resp.json()

    def process(self, item: dict) -> dict[str, Any]:
        if not self.is_configured:
            return {"ok": False, "error": "OrpheusDL URL niet geconfigureerd"}
        try:
            data = self._search(item["entity_name"], item["entity_type"])
            if not data:
                return {"ok": False, "error": "No results found"}
            return {"ok": True, "data": data}
        except Exception as exc:
            self.log.warning(f"Qobuz/OrpheusDL worker mislukt voor '{item.get('entity_name')}': {exc}")
            return {"ok": False, "error": str(exc)}

    def _search(self, name: str, entity_type: str = "artist") -> Optional[dict]:
        from urllib.parse import quote
        try:
            search_type = (
                "albums"  if entity_type == "album" else
                "tracks"  if entity_type == "track" else
                "artists"
            )
            data = self._get(f"/api/search?query={quote(name)}&platform=qobuz&type={search_type}")
            if not data or not data.get("results"):
                return None

            norm    = lambda s: (s or "").lower().strip()
            results = data["results"]
            exact   = next(
                (r for r in results if norm(r.get("name") or r.get("title", "")) == norm(name)),
                None,
            )
            best = exact or results[0]
            return self._map_item(best, entity_type)

        except requests.exceptions.ConnectionError:
            self.log.debug(f"OrpheusDL niet bereikbaar, Qobuz enrichment overgeslagen voor '{name}'")
            return None

    def _map_item(self, item: dict, entity_type: str) -> dict:
        if entity_type == "artist":
            img = item.get("image") or {}
            return {
                "qobuzId":    item.get("id"),
                "name":       item.get("name"),
                "imageUrl":   img.get("large") or img.get("small"),
                "popularity": item.get("popularity"),
                "albumCount": item.get("albums_count"),
                "biography":  (item.get("biography") or {}).get("content"),
                "genres":     item.get("genres_list", []),
                "source":     "qobuz",
                "fetchedAt":  int(time.time() * 1000),
            }
        if entity_type == "album":
            img = item.get("image") or {}
            return {
                "qobuzId":       item.get("id"),
                "title":         item.get("title"),
                "artistName":    (item.get("artist") or {}).get("name"),
                "releaseDate":   item.get("release_date_original") or item.get("released_at"),
                "duration":      item.get("duration"),
                "trackCount":    item.get("tracks_count"),
                "label":         (item.get("label") or {}).get("name"),
                "genre":         (item.get("genre") or {}).get("name"),
                "maxSampleRate": item.get("maximum_sampling_rate"),
                "maxBitDepth":   item.get("maximum_bit_depth"),
                "imageUrl":      img.get("large"),
                "isHiRes":       bool(item.get("hires") or item.get("hires_streamable")),
                "upc":           item.get("upc"),
                "source":        "qobuz",
                "fetchedAt":     int(time.time() * 1000),
            }
        # track
        return {
            "qobuzId":       item.get("id"),
            "title":         item.get("title"),
            "artistName":    (item.get("performer") or {}).get("name"),
            "albumTitle":    (item.get("album") or {}).get("title"),
            "duration":      item.get("duration"),
            "trackNumber":   item.get("track_number"),
            "isrc":          item.get("isrc"),
            "maxSampleRate": item.get("maximum_sampling_rate"),
            "maxBitDepth":   item.get("maximum_bit_depth"),
            "isHiRes":       bool(item.get("hires") or item.get("hires_streamable")),
            "source":        "qobuz",
            "fetchedAt":     int(time.time() * 1000),
        }
