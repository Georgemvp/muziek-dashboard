"""
audiodb.py — TheAudioDB enrichment worker.

Gratis publieke API, geen auth nodig.
Rate limit: conservatief 1 call per 3 sec.
"""

import logging
import time
from typing import Any, Optional

import requests

from core.workers.base import BaseWorker

AUDIODB_BASE    = "https://theaudiodb.com/api/v1/json/2"
RATE_INTERVAL   = 3.0
REQUEST_TIMEOUT = 12


class AudioDBWorker(BaseWorker):
    source = "audiodb"

    def __init__(self, database, logger: logging.Logger):
        super().__init__(database, logger)
        self._last_call = 0.0
        self._session   = requests.Session()
        self._session.headers.update({
            "Accept":     "application/json",
            "User-Agent": "LastfmMuziekApp/1.0",
        })

    def _rate_limit(self) -> None:
        wait = max(0.0, RATE_INTERVAL - (time.time() - self._last_call))
        if wait > 0:
            time.sleep(wait)
        self._last_call = time.time()

    def _get(self, url: str) -> dict:
        self._rate_limit()
        resp = self._session.get(url, timeout=REQUEST_TIMEOUT)
        resp.raise_for_status()
        return resp.json()

    def process(self, item: dict) -> dict[str, Any]:
        try:
            data = self._search(item["entity_name"], item["entity_type"])
            if not data:
                return {"ok": False, "error": "No results found"}
            return {"ok": True, "data": data}
        except Exception as exc:
            self.log.warning(f"AudioDB worker mislukt voor '{item.get('entity_name')}': {exc}")
            return {"ok": False, "error": str(exc)}

    def _search(self, name: str, entity_type: str = "artist") -> Optional[dict]:
        if entity_type == "artist":
            return self._search_artist(name)
        if entity_type == "album":
            return self._search_album(name)
        return None

    def _search_artist(self, name: str) -> Optional[dict]:
        from urllib.parse import quote
        data    = self._get(f"{AUDIODB_BASE}/search.php?s={quote(name)}")
        artists = data.get("artists") or []
        if not artists:
            return None

        norm  = lambda s: (s or "").lower().strip()
        exact = next((a for a in artists if norm(a.get("strArtist", "")) == norm(name)), None)
        a     = exact or artists[0]

        return {
            "audiodbId":     a.get("idArtist"),
            "name":          a.get("strArtist"),
            "formedYear":    a.get("intFormedYear"),
            "bornYear":      a.get("intBornYear"),
            "disbandedYear": a.get("intDisbandYear"),
            "gender":        a.get("strGender"),
            "members":       a.get("intMembers"),
            "country":       a.get("strCountry"),
            "countryCode":   a.get("strCountryCode"),
            "genre":         a.get("strGenre"),
            "style":         a.get("strStyle"),
            "mood":          a.get("strMood"),
            "theme":         a.get("strTheme"),
            "website":       a.get("strWebsite"),
            "facebook":      a.get("strFacebook"),
            "twitter":       a.get("strTwitter"),
            "biography": {
                "en": a.get("strBiographyEN"),
                "nl": a.get("strBiographyNL"),
                "de": a.get("strBiographyDE"),
                "fr": a.get("strBiographyFR"),
            },
            "logo":          a.get("strArtistLogo"),
            "thumb":         a.get("strArtistThumb"),
            "banner":        a.get("strArtistBanner"),
            "fanart":        a.get("strArtistFanart") or a.get("strArtistFanart2"),
            "musicbrainzId": a.get("strMusicBrainzID"),
            "lastfmChart":   a.get("strLastFMChart"),
            "source":        "audiodb",
            "fetchedAt":     int(time.time() * 1000),
        }

    def _search_album(self, name: str) -> Optional[dict]:
        from urllib.parse import quote
        data   = self._get(f"{AUDIODB_BASE}/searchalbum.php?s=all&a={quote(name)}")
        albums = data.get("album") or []
        if not albums:
            return None

        norm  = lambda s: (s or "").lower().strip()
        exact = next((a for a in albums if norm(a.get("strAlbum", "")) == norm(name)), None)
        al    = exact or albums[0]

        return {
            "audiodbId":     al.get("idAlbum"),
            "name":          al.get("strAlbum"),
            "artistName":    al.get("strArtist"),
            "year":          al.get("intYearReleased"),
            "genre":         al.get("strGenre"),
            "style":         al.get("strStyle"),
            "mood":          al.get("strMood"),
            "theme":         al.get("strTheme"),
            "speed":         al.get("strSpeed"),
            "description": {
                "en": al.get("strDescriptionEN"),
                "nl": al.get("strDescriptionNL"),
            },
            "thumbUrl":      al.get("strAlbumThumb"),
            "thumbBackUrl":  al.get("strAlbumThumbBack"),
            "cdArtUrl":      al.get("strAlbumCDart"),
            "spine":         al.get("strAlbumSpine"),
            "label":         al.get("strLabel"),
            "score":         al.get("intScore"),
            "loved":         al.get("intLoved"),
            "musicbrainzId": al.get("strMusicBrainzID"),
            "source":        "audiodb",
            "fetchedAt":     int(time.time() * 1000),
        }
