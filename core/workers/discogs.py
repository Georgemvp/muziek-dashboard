"""
discogs.py — Discogs enrichment worker.

Gebruikt de Discogs REST API direct via requests (geen client library nodig).
Rate limit: 25 calls/min zonder token, 60/min met token.
We gebruiken 1 call per 2.5 sec als veilige marge.
"""

import logging
import time
from typing import Any, Optional
from urllib.parse import urlencode, quote

import requests

from core.workers.base import BaseWorker

DISCOGS_BASE  = "https://api.discogs.com"
RATE_INTERVAL = 2.5   # seconden
REQUEST_TIMEOUT = 12


class DiscogsWorker(BaseWorker):
    source = "discogs"

    def __init__(self, database, logger: logging.Logger,
                 token: Optional[str] = None,
                 user_agent: str = "LastfmMuziekApp/1.0 +https://github.com/muziek"):
        super().__init__(database, logger)
        self._last_call = 0.0
        self._token     = token
        self._session   = requests.Session()
        self._session.headers.update({
            "User-Agent": user_agent,
            "Accept":     "application/json",
        })
        if token:
            self._session.headers["Authorization"] = f"Discogs token={token}"

    def _rate_limit(self) -> None:
        wait = max(0.0, RATE_INTERVAL - (time.time() - self._last_call))
        if wait > 0:
            time.sleep(wait)
        self._last_call = time.time()

    def _get(self, url: str) -> dict:
        self._rate_limit()
        resp = self._session.get(url, timeout=REQUEST_TIMEOUT)
        if resp.status_code == 429:
            raise RuntimeError("Discogs rate limit bereikt")
        resp.raise_for_status()
        return resp.json()

    def process(self, item: dict) -> dict[str, Any]:
        try:
            data = self._search(item["entity_name"], item["entity_type"])
            if not data:
                return {"ok": False, "error": "No results found"}
            return {"ok": True, "data": data}
        except Exception as exc:
            self.log.warning(f"Discogs worker mislukt voor '{item.get('entity_name')}': {exc}")
            return {"ok": False, "error": str(exc)}

    def _search(self, name: str, entity_type: str = "artist") -> Optional[dict]:
        discogs_type = (
            "artist"  if entity_type == "artist" else
            "master"  if entity_type == "album"  else
            "release"
        )

        params = urlencode({"q": name, "type": discogs_type, "per_page": "5"})
        data    = self._get(f"{DISCOGS_BASE}/database/search?{params}")
        results = data.get("results", [])
        if not results:
            return None

        norm  = lambda s: (s or "").lower().strip()
        exact = next((r for r in results if norm(r.get("title", "")) == norm(name)), None)
        best  = exact or results[0]

        if entity_type == "artist":
            return self._enrich_artist(best, name)
        return self._map_release(best)

    def _enrich_artist(self, item: dict, original_name: str) -> dict:
        base = {
            "discogsId":   item.get("id"),
            "title":       item.get("title"),
            "thumb":       item.get("thumb") or None,
            "coverImage":  item.get("cover_image") or None,
            "uri":         item.get("uri") or None,
            "resourceUrl": item.get("resource_url") or None,
            "source":      "discogs",
            "fetchedAt":   int(time.time() * 1000),
        }

        # Haal artist-detail op voor biografie, members, etc.
        resource_url = item.get("resource_url")
        if resource_url:
            try:
                detail = self._get(resource_url)
                base["profile"]        = detail.get("profile") or None
                base["aliases"]        = [a.get("name") for a in (detail.get("aliases") or [])]
                base["members"]        = [m.get("name") for m in (detail.get("members") or [])]
                base["urls"]           = detail.get("urls") or []
                base["nameVariations"] = detail.get("namevariations") or []
            except Exception as exc:
                self.log.debug(f"Discogs artist detail mislukt voor '{original_name}': {exc}")

        return base

    def _map_release(self, item: dict) -> dict:
        return {
            "discogsId":  item.get("id"),
            "title":      item.get("title"),
            "year":       item.get("year"),
            "label":      ", ".join(item.get("label") or []) or None,
            "catno":      item.get("catno"),
            "format":     ", ".join(item.get("format") or []) or None,
            "genre":      item.get("genre") or [],
            "style":      item.get("style") or [],
            "country":    item.get("country"),
            "thumb":      item.get("thumb") or None,
            "coverImage": item.get("cover_image") or None,
            "uri":        item.get("uri") or None,
            "source":     "discogs",
            "fetchedAt":  int(time.time() * 1000),
        }
