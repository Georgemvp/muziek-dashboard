"""
spotify.py — Spotify enrichment worker.

Gebruikt spotipy met Client Credentials flow (geen user-auth nodig).
Vereist SPOTIFY_CLIENT_ID + SPOTIFY_CLIENT_SECRET.
Rate limit: conservatief 1 call/sec + respecteer Retry-After bij 429.
"""
from __future__ import annotations

import logging
import os
import time
from typing import Any

import spotipy
from spotipy.oauth2 import SpotifyClientCredentials

from core.workers.base import BaseWorker

FUZZY_THRESHOLD = 0.80
DAILY_CAP       = 3000
RATE_INTERVAL   = 1.1   # seconden


class SpotifyWorker(BaseWorker):
    source = "spotify"

    def __init__(self, database, logger: logging.Logger):
        super().__init__(database, logger)
        self._last_call   = 0.0
        self._daily_count = 0
        self._daily_date  = ""
        self._sp: spotipy.Spotify | None = None
        self._init_client()

    def _init_client(self) -> None:
        client_id     = os.environ.get("SPOTIFY_CLIENT_ID", "")
        client_secret = os.environ.get("SPOTIFY_CLIENT_SECRET", "")
        if client_id and client_secret:
            ccm = SpotifyClientCredentials(
                client_id=client_id,
                client_secret=client_secret,
            )
            self._sp = spotipy.Spotify(
                auth_manager=ccm,
                requests_timeout=12,
                retries=1,
                backoff_factor=0.5,
            )

    @property
    def is_configured(self) -> bool:
        return self._sp is not None

    def _rate_limit(self) -> None:
        wait = max(0.0, RATE_INTERVAL - (time.time() - self._last_call))
        if wait > 0:
            time.sleep(wait)
        self._last_call = time.time()

    def _check_daily_budget(self) -> None:
        today = time.strftime("%Y-%m-%d")
        if self._daily_date != today:
            self._daily_date  = today
            self._daily_count = 0
        if self._daily_count >= DAILY_CAP:
            raise RuntimeError(f"Spotify daily budget van {DAILY_CAP} bereikt")
        self._daily_count += 1

    def _search(self, query: str, search_type: str, limit: int = 5) -> dict:
        self._check_daily_budget()
        self._rate_limit()
        return self._sp.search(q=query, type=search_type, limit=limit) or {}

    def process(self, item: dict) -> dict[str, Any]:
        if not self.is_configured:
            return {"ok": False, "error": "Spotify credentials niet geconfigureerd"}
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
                return {"ok": False, "error": "Geen resultaat gevonden"}
            return {"ok": True, "data": data}

        except Exception as exc:
            self.log.warning(f"Spotify worker mislukt voor '{item.get('entity_name')}': {exc}")
            return {"ok": False, "error": str(exc)}

    def _process_artist(self, name: str) -> dict | None:
        result = self._search(name, "artist")
        items  = (result.get("artists") or {}).get("items", [])
        if not items:
            return None

        best = self.fuzzy_best(items, name, lambda a: a.get("name", ""), FUZZY_THRESHOLD)
        if not best:
            return None

        images = best.get("images") or []
        return {
            "spotify_id":  best["id"],
            "genres":      best.get("genres", []),
            "popularity":  best.get("popularity"),
            "artwork_url": images[0]["url"] if images else None,
            "spotify_url": (best.get("external_urls") or {}).get("spotify"),
            "followers":   (best.get("followers") or {}).get("total"),
            "source":      "spotify",
            "fetchedAt":   int(time.time() * 1000),
        }

    def _process_album(self, name: str) -> dict | None:
        result = self._search(name, "album")
        items  = (result.get("albums") or {}).get("items", [])
        if not items:
            return None

        best = self.fuzzy_best(items, name, lambda a: a.get("name", ""), FUZZY_THRESHOLD)
        if not best:
            return None

        images = best.get("images") or []
        return {
            "spotify_id":   best["id"],
            "artwork_url":  images[0]["url"] if images else None,
            "genres":       best.get("genres", []),
            "release_date": best.get("release_date"),
            "total_tracks": best.get("total_tracks"),
            "spotify_url":  (best.get("external_urls") or {}).get("spotify"),
            "source":       "spotify",
            "fetchedAt":    int(time.time() * 1000),
        }

    def _process_track(self, name: str) -> dict | None:
        result = self._search(name, "track")
        items  = (result.get("tracks") or {}).get("items", [])
        if not items:
            return None

        best = self.fuzzy_best(items, name, lambda t: t.get("name", ""), FUZZY_THRESHOLD)
        if not best:
            return None

        album_images = (best.get("album") or {}).get("images") or []
        return {
            "spotify_id":  best["id"],
            "preview_url": best.get("preview_url"),
            "popularity":  best.get("popularity"),
            "duration_ms": best.get("duration_ms"),
            "explicit":    best.get("explicit"),
            "artwork_url": album_images[0]["url"] if album_images else None,
            "spotify_url": (best.get("external_urls") or {}).get("spotify"),
            "source":      "spotify",
            "fetchedAt":   int(time.time() * 1000),
        }
