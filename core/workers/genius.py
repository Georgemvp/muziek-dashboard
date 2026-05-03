"""
genius.py — Genius enrichment worker.

Vereist GENIUS_API_KEY (gratis via genius.com/api-clients).
Rate limit: conservatief 1 call per 2 sec.
"""
from __future__ import annotations

import logging
import time
from typing import Any

import requests

from core.workers.base import BaseWorker

GENIUS_BASE     = "https://api.genius.com"
RATE_INTERVAL   = 2.0
REQUEST_TIMEOUT = 12


class GeniusWorker(BaseWorker):
    source = "genius"

    def __init__(self, database, logger: logging.Logger, api_key: str | None = None):
        super().__init__(database, logger)
        self._api_key   = api_key or ""
        self._last_call = 0.0
        self._session   = requests.Session()
        if self._api_key:
            self._session.headers.update({
                "Authorization": f"Bearer {self._api_key}",
                "Accept":        "application/json",
                "User-Agent":    "LastfmMuziekApp/1.0",
            })

    @property
    def is_configured(self) -> bool:
        return bool(self._api_key)

    def _rate_limit(self) -> None:
        wait = max(0.0, RATE_INTERVAL - (time.time() - self._last_call))
        if wait > 0:
            time.sleep(wait)
        self._last_call = time.time()

    def _get(self, path: str, params: dict = None) -> dict:
        if not self._api_key:
            raise RuntimeError("Genius API key niet geconfigureerd")
        self._rate_limit()
        resp = self._session.get(
            f"{GENIUS_BASE}{path}",
            params=params or {},
            timeout=REQUEST_TIMEOUT,
        )
        if resp.status_code == 401:
            raise RuntimeError("Genius: ongeldige API key")
        if resp.status_code == 429:
            raise RuntimeError("Genius rate limit bereikt")
        resp.raise_for_status()
        data = resp.json()
        if data.get("meta", {}).get("status") != 200:
            raise RuntimeError(f"Genius API fout: {data.get('meta', {}).get('message')}")
        return data["response"]

    def process(self, item: dict) -> dict[str, Any]:
        if not self.is_configured:
            return {"ok": False, "error": "Genius API key niet geconfigureerd"}
        try:
            data = self._search(item["entity_name"], item["entity_type"])
            if not data:
                return {"ok": False, "error": "No results found"}
            return {"ok": True, "data": data}
        except Exception as exc:
            self.log.warning(f"Genius worker mislukt voor '{item.get('entity_name')}': {exc}")
            return {"ok": False, "error": str(exc)}

    def _search(self, name: str, entity_type: str = "artist") -> dict | None:
        if entity_type == "artist":
            return self._search_artist(name)
        return self._search_track(name)

    def _search_artist(self, name: str) -> dict | None:
        resp = self._get("/search", {"q": name, "per_page": "5"})
        hits = [h for h in (resp.get("hits") or []) if h.get("type") == "song"]
        if not hits:
            return None

        def norm(s): return (s or "").lower().strip()
        match = next(
            (h for h in hits if norm((h.get("result") or {}).get("primary_artist", {}).get("name", "")) == norm(name)),
            None,
        )
        best   = match or hits[0]
        artist = (best.get("result") or {}).get("primary_artist")
        if not artist:
            return None

        # Haal artiest-detail op
        try:
            detail = self._get(f"/artists/{artist['id']}")
            a = detail.get("artist") or artist
            return {
                "geniusId":       a.get("id"),
                "name":           a.get("name"),
                "slug":           a.get("slug"),
                "url":            a.get("url"),
                "headerImageUrl": a.get("header_image_url"),
                "imageUrl":       a.get("image_url"),
                "description":    (a.get("description") or {}).get("plain"),
                "facebookName":   a.get("facebook_name"),
                "twitterName":    a.get("twitter_name"),
                "instagramName":  a.get("instagram_name"),
                "isVerified":     a.get("is_verified", False),
                "followersCount": a.get("followers_count", 0),
                "source":         "genius",
                "fetchedAt":      int(time.time() * 1000),
            }
        except Exception:
            return {
                "geniusId":  artist.get("id"),
                "name":      artist.get("name"),
                "imageUrl":  artist.get("image_url"),
                "url":       artist.get("url"),
                "source":    "genius",
                "fetchedAt": int(time.time() * 1000),
            }

    def _search_track(self, name: str) -> dict | None:
        resp = self._get("/search", {"q": name, "per_page": "5"})
        hits = [h for h in (resp.get("hits") or []) if h.get("type") == "song"]
        if not hits:
            return None

        def norm(s): return (s or "").lower().strip()
        exact = next(
            (h for h in hits if norm((h.get("result") or {}).get("title", "")) == norm(name)),
            None,
        )
        song = ((exact or hits[0]).get("result") or {})
        if not song:
            return None

        return {
            "geniusId":            song.get("id"),
            "title":               song.get("title"),
            "titleWithFeatured":   song.get("title_with_featured"),
            "artistName":          (song.get("primary_artist") or {}).get("name"),
            "url":                 song.get("url"),
            "lyricsUrl":           song.get("url"),
            "headerImageUrl":      song.get("header_image_url"),
            "thumbnailUrl":        song.get("song_art_image_thumbnail_url"),
            "releaseDate":         song.get("release_date_for_display"),
            "pageViews":           (song.get("stats") or {}).get("pageviews"),
            "source":              "genius",
            "fetchedAt":           int(time.time() * 1000),
        }
