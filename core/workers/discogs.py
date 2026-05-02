"""
discogs.py — Discogs enrichment worker.

Rate limit: 25 calls/min zonder token, 60/min met token.
We gebruiken 1 call per 2.5 sec als veilige marge.
"""

import logging
import time
from typing import Any, Optional

import discogs_client

from core.workers.base import BaseWorker

RATE_INTERVAL = 2.5   # seconden


class DiscogsWorker(BaseWorker):
    source = "discogs"

    def __init__(self, database, logger: logging.Logger,
                 token: Optional[str] = None,
                 user_agent: str = "LastfmMuziekApp/1.0 +https://github.com/muziek"):
        super().__init__(database, logger)
        self._last_call = 0.0
        self._token     = token
        self._ua        = user_agent

        self._client = discogs_client.Client(
            self._ua,
            user_token=token or "",
        )

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
            self.log.warning(f"Discogs worker mislukt voor '{item.get('entity_name')}': {exc}")
            return {"ok": False, "error": str(exc)}

    def _search(self, name: str, entity_type: str = "artist") -> Optional[dict]:
        discogs_type = (
            "artist"  if entity_type == "artist" else
            "master"  if entity_type == "album"  else
            "release"
        )

        self._rate_limit()
        results = self._client.search(name, type=discogs_type)
        items   = list(results.page(1)[:5]) if results else []
        if not items:
            return None

        # Probeer exacte match op title
        norm  = lambda s: (s or "").lower().strip()
        exact = next((i for i in items if norm(getattr(i, "title", "")) == norm(name)), None)
        best  = exact or items[0]

        if entity_type == "artist":
            return self._enrich_artist(best, name)
        return self._map_release(best)

    def _enrich_artist(self, item, original_name: str) -> dict:
        base = {
            "discogsId":   item.id,
            "title":       item.title,
            "thumb":       item.thumb or None,
            "coverImage":  getattr(item, "cover_image", None),
            "uri":         item.url if hasattr(item, "url") else None,
            "resourceUrl": item.data.get("resource_url") if hasattr(item, "data") else None,
            "source":      "discogs",
            "fetchedAt":   int(time.time() * 1000),
        }

        # Haal detail op voor biografie etc.
        try:
            self._rate_limit()
            detail = item.fetch()
            base["profile"]        = getattr(detail, "profile", None)
            base["aliases"]        = [a.name for a in (getattr(detail, "aliases", None) or [])]
            base["members"]        = [m.name for m in (getattr(detail, "members", None) or [])]
            base["urls"]           = list(getattr(detail, "urls", []) or [])
            base["nameVariations"] = list(getattr(detail, "namevariations", []) or [])
        except Exception as exc:
            self.log.debug(f"Discogs artist detail mislukt voor '{original_name}': {exc}")

        return base

    def _map_release(self, item) -> dict:
        d = item.data if hasattr(item, "data") else {}
        return {
            "discogsId":  item.id,
            "title":      item.title,
            "year":       d.get("year"),
            "label":      ", ".join(d.get("label", [])) or None,
            "catno":      d.get("catno"),
            "format":     ", ".join(d.get("format", [])) or None,
            "genre":      d.get("genre", []),
            "style":      d.get("style", []),
            "country":    d.get("country"),
            "thumb":      item.thumb or None,
            "coverImage": d.get("cover_image"),
            "uri":        item.url if hasattr(item, "url") else None,
            "source":     "discogs",
            "fetchedAt":  int(time.time() * 1000),
        }
