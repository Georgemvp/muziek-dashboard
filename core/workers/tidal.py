"""
tidal.py — Tidal enrichment worker via Tidarr API proxy.

Geen directe Tidal API-calls — gaat via de lokale Tidarr instantie.
Rate limit: conservatief 1 call per 3 sec (20/min max).
"""

import logging
import os
import time
from typing import Any, Optional

import requests

from core.workers.base import BaseWorker

RATE_INTERVAL   = 3.0
REQUEST_TIMEOUT = 10


class TidalWorker(BaseWorker):
    source = "tidal"

    def __init__(self, database, logger: logging.Logger,
                 tidarr_url: Optional[str] = None,
                 tidarr_api_key: Optional[str] = None):
        super().__init__(database, logger)
        self._url       = tidarr_url or os.environ.get("TIDARR_URL", "http://localhost:8484")
        self._api_key   = tidarr_api_key or os.environ.get("TIDARR_API_KEY")
        self._last_call = 0.0
        self._session   = requests.Session()
        self._session.headers.update({"Accept": "application/json", "Content-Type": "application/json"})
        if self._api_key:
            self._session.headers["X-Api-Key"] = self._api_key

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
        resp.raise_for_status()
        return resp.json()

    def process(self, item: dict) -> dict[str, Any]:
        if not self.is_configured:
            return {"ok": False, "error": "Tidarr URL niet geconfigureerd"}
        try:
            data = self._search(item["entity_name"], item["entity_type"])
            if not data:
                return {"ok": False, "error": "No results found"}
            return {"ok": True, "data": data}
        except Exception as exc:
            self.log.warning(f"Tidal/Tidarr worker mislukt voor '{item.get('entity_name')}': {exc}")
            return {"ok": False, "error": str(exc)}

    def _search(self, name: str, entity_type: str = "artist") -> Optional[dict]:
        from urllib.parse import quote
        try:
            search_type = (
                "albums"  if entity_type == "album" else
                "tracks"  if entity_type == "track" else
                "artists"
            )
            data = self._get(f"/api/search?query={quote(name)}&type={search_type}")
            if not data or not data.get("items"):
                return None

            norm  = lambda s: (s or "").lower().strip()
            items = data["items"]
            exact = next(
                (i for i in items if norm(i.get("name") or i.get("title") or i.get("artistName", "")) == norm(name)),
                None,
            )
            best = exact or items[0]
            return self._map_item(best, entity_type)

        except requests.exceptions.ConnectionError:
            self.log.debug(f"Tidarr niet bereikbaar, Tidal enrichment overgeslagen voor '{name}'")
            return None

    def _map_item(self, item: dict, entity_type: str) -> dict:
        if entity_type == "artist":
            return {
                "tidalId":    item.get("id"),
                "name":       item.get("name"),
                "popularity": item.get("popularity"),
                "picture":    item.get("picture"),
                "url":        item.get("url"),
                "source":     "tidal",
                "fetchedAt":  int(time.time() * 1000),
            }
        if entity_type == "album":
            return {
                "tidalId":          item.get("id"),
                "title":            item.get("title"),
                "artistName":       (item.get("artist") or {}).get("name"),
                "releaseDate":      item.get("releaseDate"),
                "duration":         item.get("duration"),
                "numberOfTracks":   item.get("numberOfTracks"),
                "audioQuality":     item.get("audioQuality"),
                "cover":            item.get("cover"),
                "explicitLyrics":   item.get("explicitLyrics", False),
                "url":              item.get("url"),
                "source":           "tidal",
                "fetchedAt":        int(time.time() * 1000),
            }
        # track
        return {
            "tidalId":     item.get("id"),
            "title":       item.get("title"),
            "artistName":  (item.get("artist") or {}).get("name"),
            "albumTitle":  (item.get("album") or {}).get("title"),
            "duration":    item.get("duration"),
            "trackNumber": item.get("trackNumber"),
            "audioQuality": item.get("audioQuality"),
            "isrc":        item.get("isrc"),
            "url":         item.get("url"),
            "source":      "tidal",
            "fetchedAt":   int(time.time() * 1000),
        }
