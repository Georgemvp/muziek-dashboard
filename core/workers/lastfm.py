"""
lastfm.py — Last.fm enrichment worker.

Gebruikt pylast. Vereist LASTFM_API_KEY omgevingsvariabele.
Ingebouwde caching via SQLite (7 dagen TTL) om de API te ontlasten.
"""

import html
import logging
import os
import re
import time
from typing import Any, Optional

import pylast

from core.workers.base import BaseWorker
import core.database as db

CACHE_TTL_MS = 7 * 24 * 3600 * 1000  # 7 dagen


def _strip_html(text: str) -> str:
    """Strip HTML-tags en entiteiten uit Last.fm bio's."""
    if not text:
        return ""
    # Verwijder anchor-tags maar bewaar de tekst
    text = re.sub(r"<a\b[^>]*>(.*?)</a>", r"\1", text, flags=re.IGNORECASE | re.DOTALL)
    text = re.sub(r"<[^>]+>", "", text)
    text = html.unescape(text)
    return re.sub(r"\s+", " ", text).strip()


class LastfmWorker(BaseWorker):
    source = "lastfm"

    def __init__(self, database, logger: logging.Logger):
        super().__init__(database, logger)
        api_key = os.environ.get("LASTFM_API_KEY", "")
        api_secret = os.environ.get("LASTFM_API_SECRET", "")
        self._network = pylast.LastFMNetwork(
            api_key=api_key,
            api_secret=api_secret,
        ) if api_key else None

    def process(self, item: dict) -> dict[str, Any]:
        if not self._network:
            return {"ok": False, "error": "LASTFM_API_KEY niet geconfigureerd"}
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
                return {"ok": False, "error": "Geen Last.fm resultaat"}
            return {"ok": True, "data": data}

        except pylast.WSError as exc:
            if "not found" in str(exc).lower() or "6" in str(exc):
                return {"ok": False, "error": "Niet gevonden op Last.fm"}
            self.log.warning(f"Last.fm worker mislukt voor '{item.get('entity_name')}': {exc}")
            return {"ok": False, "error": str(exc)}
        except Exception as exc:
            self.log.warning(f"Last.fm worker mislukt voor '{item.get('entity_name')}': {exc}")
            return {"ok": False, "error": str(exc)}

    # ── Cache helpers ──────────────────────────────────────────────────────────

    def _get_cached(self, key: str):
        return db.get_cache(key, max_age_ms=CACHE_TTL_MS)

    def _set_cached(self, key: str, data):
        db.set_cache(key, data)

    # ── Artiest ───────────────────────────────────────────────────────────────

    def _process_artist(self, name: str) -> Optional[dict]:
        cache_key = f"enrichment:lfm:artist:{name.lower()}"
        cached = self._get_cached(cache_key)
        if cached:
            return cached

        artist = self._network.get_artist(name)
        info   = artist.get_bio_summary(language="en")
        tags   = [t.item.get_name() for t in (artist.get_top_tags(limit=10) or [])]

        similar = []
        try:
            for s in (artist.get_similar(limit=10) or []):
                sim_artist = s.item
                similar.append({
                    "name":      sim_artist.get_name(),
                    "image_url": None,
                })
        except Exception:
            pass

        # Statistieken
        try:
            listeners = int(artist.get_listener_count() or 0)
        except Exception:
            listeners = 0
        try:
            playcount = int(artist.get_playcount() or 0)
        except Exception:
            playcount = 0

        result = {
            "listeners":       listeners,
            "playcount":       playcount,
            "tags":            tags,
            "similar_artists": similar,
            "bio":             _strip_html(info) or None,
            "bio_content":     None,
            "published":       None,
            "artwork_url":     None,
            "lastfm_url":      artist.get_url(),
            "mbid":            artist.get_mbid() or None,
            "on_tour":         False,
            "source":          "lastfm",
            "fetchedAt":       int(time.time() * 1000),
        }

        self._set_cached(cache_key, result)
        return result

    # ── Album ─────────────────────────────────────────────────────────────────

    def _process_album(self, name: str) -> Optional[dict]:
        cache_key = f"enrichment:lfm:album:{name.lower()}"
        cached = self._get_cached(cache_key)
        if cached:
            return cached

        # Zoek album via search
        results = pylast.LastFMNetwork.search_for_album(self._network, name).get_next_page()
        if not results:
            return None

        album = results[0]
        tags  = []
        try:
            tags = [t.item.get_name() for t in (album.get_top_tags(limit=10) or [])]
        except Exception:
            pass

        try:
            listeners = int(album.get_listener_count() or 0)
        except Exception:
            listeners = 0
        try:
            playcount = int(album.get_playcount() or 0)
        except Exception:
            playcount = 0

        result = {
            "listeners":   listeners,
            "playcount":   playcount,
            "tags":        tags,
            "wiki":        None,
            "artwork_url": album.get_cover_image() or None,
            "lastfm_url":  album.get_url(),
            "mbid":        album.get_mbid() or None,
            "source":      "lastfm",
            "fetchedAt":   int(time.time() * 1000),
        }

        self._set_cached(cache_key, result)
        return result

    # ── Track ─────────────────────────────────────────────────────────────────

    def _process_track(self, name: str) -> Optional[dict]:
        cache_key = f"enrichment:lfm:track:{name.lower()}"
        cached = self._get_cached(cache_key)
        if cached:
            return cached

        results = pylast.LastFMNetwork.search_for_track(self._network, "", name).get_next_page()
        if not results:
            return None

        track = results[0]
        tags  = []
        try:
            tags = [t.item.get_name() for t in (track.get_top_tags(limit=10) or [])]
        except Exception:
            pass

        try:
            listeners = int(track.get_listener_count() or 0)
        except Exception:
            listeners = 0
        try:
            playcount = int(track.get_playcount() or 0)
        except Exception:
            playcount = 0
        try:
            duration_ms = int(track.get_duration() or 0) or None
        except Exception:
            duration_ms = None

        result = {
            "listeners":   listeners,
            "playcount":   playcount,
            "duration_ms": duration_ms,
            "tags":        tags,
            "wiki":        None,
            "lastfm_url":  track.get_url(),
            "mbid":        track.get_mbid() or None,
            "source":      "lastfm",
            "fetchedAt":   int(time.time() * 1000),
        }

        self._set_cached(cache_key, result)
        return result
