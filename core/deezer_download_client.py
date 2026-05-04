"""
deezer_download_client.py — Native Deezer download client met ARL-authenticatie.

Authenticatie verloopt via een ARL token (Account Recovery Link) dat je uit de
browser-cookies haalt na inloggen op deezer.com (cookie 'arl').

Configuratie:
    DEEZER_ARL  — env var met je ARL token

Download-kwaliteit:
    flac     → FLAC (lossless, vereist Deezer HiFi abonnement)
    mp3_320  → MP3 320 kbps
    mp3_128  → MP3 128 kbps (fallback)

Blowfish-decryptie:
    Deezer versleutelt streams per chunk van 2048 bytes.
    Alleen chunks met index % 3 == 0 zijn versleuteld (CBC-mode, vaste IV).
    De sleutel is afgeleid van het track-ID via MD5 en een vaste secret.
"""
from __future__ import annotations

import hashlib
import logging
import os
import struct
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

import requests

log = logging.getLogger(__name__)

# ── Constanten ─────────────────────────────────────────────────────────────────
_GW_URL         = "https://www.deezer.com/ajax/gw-light.php"
_MEDIA_URL      = "https://media.deezer.com/v1/get_url"
_CDN_URL        = "https://e-cdns-proxy-{}.dzcdn.net/mobile/1/{}"
_BF_SECRET      = "g4el58wc0zvf9na1"   # Deezer's bekende Blowfish-secret
_CHUNK_SIZE     = 2048
_TIMEOUT        = 30

# Kwaliteit → Deezer format_id
_FORMAT_IDS: dict[str, int] = {
    "flac":    9,    # FLAC (lossless)
    "mp3_320": 3,    # MP3 320 kbps
    "mp3_128": 1,    # MP3 128 kbps
}
_FORMAT_FALLBACK = ["flac", "mp3_320", "mp3_128"]
_FORMAT_EXT: dict[str, str] = {
    "flac":    ".flac",
    "mp3_320": ".mp3",
    "mp3_128": ".mp3",
}

# ── Dataklassen ────────────────────────────────────────────────────────────────

@dataclass
class Track:
    id:       str
    title:    str
    artist:   str
    album:    str
    duration: int = 0
    isrc:     str = ""
    md5:      str = ""      # MD5_ORIGIN (benodigd voor download-URL)
    token:    str = ""      # TRACK_TOKEN

@dataclass
class Album:
    id:     str
    title:  str
    artist: str
    tracks: list[Track] = field(default_factory=list)


# ── Blowfish helpers ────────────────────────────────────────────────────────────

def _bf_key(track_id: str) -> bytes:
    """Leid de Blowfish-sleutel af uit het track-ID."""
    md5 = hashlib.md5(str(track_id).encode()).hexdigest()
    return bytes(
        ord(md5[i]) ^ ord(md5[i + 16]) ^ ord(_BF_SECRET[i])
        for i in range(16)
    )


def _decrypt_chunk(chunk: bytes, key: bytes) -> bytes:
    """Ontsleutel één 2048-byte Blowfish-chunk (CBC, vaste IV)."""
    try:
        from Crypto.Cipher import Blowfish as _BF  # pycryptodome
    except ImportError:
        raise RuntimeError(
            "pycryptodome is niet geïnstalleerd. "
            "Voeg 'pycryptodome' toe aan core/requirements.txt."
        )
    iv     = b"\x00\x01\x02\x03\x04\x05\x06\x07"
    cipher = _BF.new(key, _BF.MODE_CBC, iv)
    # Blowfish vereist veelvoud van 8; vullen indien nodig
    pad = (8 - len(chunk) % 8) % 8
    return cipher.decrypt(chunk + b"\x00" * pad)[:len(chunk)]


# ── Hoofd-client ───────────────────────────────────────────────────────────────

class DeezerDownloadClient:
    """
    Native Deezer download client via ARL-token authenticatie.

    Gebruik:
        client = DeezerDownloadClient()          # leest DEEZER_ARL uit env
        client = DeezerDownloadClient(arl="...") # directe token
    """

    def __init__(self, arl: str | None = None) -> None:
        self._arl     = arl or os.environ.get("DEEZER_ARL", "")
        self._session = requests.Session()
        self._sid: str | None = None   # Deezer session-ID na login

        if not self._arl:
            log.warning("DeezerDownloadClient: DEEZER_ARL is niet ingesteld — downloads mislukken")

    # ── Authenticatie ──────────────────────────────────────────────────────────

    def _ensure_logged_in(self) -> None:
        """Controleer of de sessie actief is; log anders in via ARL."""
        if self._sid:
            return
        if not self._arl:
            raise RuntimeError("DEEZER_ARL is niet ingesteld")

        self._session.cookies.set("arl", self._arl, domain=".deezer.com")
        data = self._gw("deezer.getUserData")
        uid  = data.get("USER", {}).get("USER_ID", 0)
        if not uid:
            raise RuntimeError(
                "Deezer ARL authenticatie mislukt — "
                "controleer of je ARL-token nog geldig is"
            )
        self._sid = data.get("checkForm", "")
        log.info(
            "Deezer: ingelogd als %s (plan: %s)",
            data["USER"].get("BLOG_NAME", "?"),
            data["USER"].get("OPTIONS", {}).get("web_sound_quality", {}).get("label", "?"),
        )

    def _gw(self, method: str, params: dict | None = None) -> dict:
        """Roep de Deezer GW (private) API aan."""
        resp = self._session.post(
            _GW_URL,
            params={
                "method":      method,
                "api_version": "1.0",
                "api_token":   self._sid or "null",
                "input":       "3",
                "cid":         str(int(time.time() * 1000)),
            },
            json=params or {},
            timeout=_TIMEOUT,
        )
        resp.raise_for_status()
        payload = resp.json()
        if payload.get("error") and payload["error"]:
            raise RuntimeError(f"Deezer GW fout ({method}): {payload['error']}")
        return payload.get("results", payload)

    # ── Zoeken ─────────────────────────────────────────────────────────────────

    def search(self, query: str, limit: int = 20) -> list[Track]:
        """Zoek tracks via de publieke Deezer API (geen auth vereist)."""
        resp = self._session.get(
            "https://api.deezer.com/search",
            params={"q": query, "limit": limit},
            timeout=_TIMEOUT,
        )
        resp.raise_for_status()
        items = resp.json().get("data", [])
        return [
            Track(
                id=str(t["id"]),
                title=t.get("title", ""),
                artist=t.get("artist", {}).get("name", ""),
                album=t.get("album", {}).get("title", ""),
                duration=t.get("duration", 0),
                isrc=t.get("isrc", ""),
            )
            for t in items
        ]

    # ── Track info ─────────────────────────────────────────────────────────────

    def _get_track_data(self, track_id: str) -> dict:
        """Haal private track-metadata op (bevat MD5_ORIGIN en TRACK_TOKEN)."""
        self._ensure_logged_in()
        return self._gw("song.getData", {"SNG_ID": track_id})

    def _get_track_token(self, track_id: str) -> tuple[str, str, str]:
        """
        Retourneer (md5_origin, media_version, track_token).
        Vereist voor het opbouwen van de download-URL.
        """
        data    = self._get_track_data(track_id)
        md5     = data.get("MD5_ORIGIN", "")
        version = str(data.get("MEDIA_VERSION", 1))
        token   = data.get("TRACK_TOKEN", "")
        return md5, version, token

    # ── Download-URL ────────────────────────────────────────────────────────────

    def _build_download_url(
        self, track_id: str, md5: str, media_version: str, format_id: int
    ) -> str:
        """
        Construeer de Deezer CDN-URL via het klassieke hash-schema.
        Formaat: MD5_ORIGIN + ¤ + FORMAT + ¤ + SNG_ID + ¤ + MEDIA_VERSION
        """
        step1 = "\xa4".join([md5, str(format_id), track_id, media_version])
        step2 = hashlib.md5(step1.encode()).hexdigest() + "\xa4" + step1 + "\xa4"
        # Vul aan tot veelvoud van 16 (AES-ECB padding)
        padded = step2 + " " * (16 - len(step2) % 16)
        # Deezer gebruikt hier zijn eigen AES-128-ECB (zwak, maar zo is het protocol)
        try:
            from Crypto.Cipher import AES
        except ImportError:
            raise RuntimeError("pycryptodome is niet geïnstalleerd")
        cipher = AES.new(b"jo6aey6haid2Teih", AES.MODE_ECB)
        enc    = cipher.encrypt(padded.encode("latin-1"))
        return _CDN_URL.format(md5[0], enc.hex())

    def _get_media_url_v2(
        self, track_token: str, format_id: int, license_token: str
    ) -> str | None:
        """
        Alternatieve URL via media.deezer.com (vereist licentie-token uit getUserData).
        Wordt als fallback gebruikt als de CDN-URL faalt.
        """
        try:
            resp = self._session.post(
                _MEDIA_URL,
                json={
                    "license_token": license_token,
                    "media":         [{"type": "FULL", "formats": [{"cipher": "BF_CBC_STRIPE", "format": _format_name(format_id)}]}],
                    "track_tokens":  [track_token],
                },
                timeout=_TIMEOUT,
            )
            resp.raise_for_status()
            data = resp.json()
            return data.get("data", [{}])[0].get("media", [{}])[0].get("sources", [{}])[0].get("url")
        except Exception as exc:
            log.debug("Media-URL v2 mislukt: %s", exc)
            return None

    # ── Stream downloaden & ontsleutelen ───────────────────────────────────────

    def _download_and_decrypt(
        self, url: str, track_id: str, output_path: Path
    ) -> None:
        """Download encrypted stream en ontsleutel chunk voor chunk."""
        key = _bf_key(track_id)
        with self._session.get(url, stream=True, timeout=60) as resp:
            resp.raise_for_status()
            with output_path.open("wb") as f:
                chunk_index = 0
                buffer      = b""
                for raw in resp.iter_content(chunk_size=_CHUNK_SIZE):
                    buffer += raw
                    while len(buffer) >= _CHUNK_SIZE:
                        chunk  = buffer[:_CHUNK_SIZE]
                        buffer = buffer[_CHUNK_SIZE:]
                        if chunk_index % 3 == 0:
                            chunk = _decrypt_chunk(chunk, key)
                        f.write(chunk)
                        chunk_index += 1
                # Resterende bytes (onversleuteld)
                if buffer:
                    f.write(buffer)

    # ── Publieke download-methoden ─────────────────────────────────────────────

    def download_track(
        self, track_id: str, quality: str = "flac", output_dir: str = "/data/downloads/deezer"
    ) -> str:
        """
        Download een Deezer-track.

        Args:
            track_id:   Deezer track-ID (als string of int)
            quality:    'flac', 'mp3_320' of 'mp3_128' — valt automatisch terug
            output_dir: doelmap voor het gedownloade bestand

        Returns:
            Absoluut pad naar het gedownloade bestand
        """
        self._ensure_logged_in()
        track_id = str(track_id)

        md5, version, token = self._get_track_token(track_id)
        if not md5:
            raise RuntimeError(f"Deezer: geen MD5_ORIGIN voor track {track_id}")

        # Quality fallback
        qualities = _quality_fallback(quality)
        url: str | None  = None
        chosen_fmt: str  = qualities[0]

        for fmt in qualities:
            fmt_id = _FORMAT_IDS[fmt]
            candidate = self._build_download_url(track_id, md5, version, fmt_id)
            # Controleer of URL geldig is (HEAD-request)
            try:
                head = self._session.head(candidate, timeout=10)
                if head.status_code == 200:
                    url        = candidate
                    chosen_fmt = fmt
                    break
                log.debug("Deezer: %s niet beschikbaar (HTTP %d), probeer lager", fmt, head.status_code)
            except Exception as exc:
                log.debug("Deezer HEAD mislukt voor %s: %s", fmt, exc)

        if not url:
            raise RuntimeError(
                f"Deezer: track {track_id} niet beschikbaar in kwaliteit {quality} of lager"
            )

        # Haal track-metadata op voor bestandsnaam
        data    = self._get_track_data(track_id)
        artist  = _safe_filename(data.get("ART_NAME", "Onbekend"))
        title   = _safe_filename(data.get("SNG_TITLE", track_id))
        ext     = _FORMAT_EXT[chosen_fmt]
        outdir  = Path(output_dir)
        outdir.mkdir(parents=True, exist_ok=True)
        outfile = outdir / f"{artist} - {title}{ext}"

        log.info("Deezer: download %s - %s [%s] → %s", artist, title, chosen_fmt, outfile)
        self._download_and_decrypt(url, track_id, outfile)
        log.info("Deezer: ✓ klaar → %s", outfile)
        return str(outfile)

    def download_album(
        self, album_id: str, quality: str = "flac", output_dir: str = "/data/downloads/deezer"
    ) -> list[str]:
        """
        Download een heel Deezer-album.

        Returns:
            Lijst van paden naar gedownloade bestanden
        """
        self._ensure_logged_in()
        album_id = str(album_id)

        data    = self._gw("album.getData", {"ALB_ID": album_id})
        songs   = data.get("SONGS", {}).get("data", [])
        if not songs:
            # Alternatief: publieke API
            resp  = self._session.get(
                f"https://api.deezer.com/album/{album_id}/tracks",
                params={"limit": 200},
                timeout=_TIMEOUT,
            )
            resp.raise_for_status()
            songs = resp.json().get("data", [])

        if not songs:
            raise RuntimeError(f"Deezer: album {album_id} niet gevonden of leeg")

        album_title  = _safe_filename(data.get("ALB_TITLE", album_id))
        artist_name  = _safe_filename(data.get("ART_NAME", "Onbekend"))
        album_outdir = Path(output_dir) / f"{artist_name} - {album_title}"

        paths = []
        for track in songs:
            tid = str(track.get("SNG_ID") or track.get("id", ""))
            if not tid:
                continue
            try:
                path = self.download_track(tid, quality, str(album_outdir))
                paths.append(path)
            except Exception as exc:
                log.warning("Deezer: track %s overgeslagen: %s", tid, exc)
        return paths

    def get_status(self) -> dict:
        """Controleer of de ARL-token geconfigureerd en geldig is."""
        if not self._arl:
            return {"connected": False, "error": "DEEZER_ARL niet ingesteld"}
        try:
            self._ensure_logged_in()
            return {"connected": True}
        except Exception as exc:
            return {"connected": False, "error": str(exc)}


# ── Helpers ────────────────────────────────────────────────────────────────────

def _quality_fallback(quality: str) -> list[str]:
    """Geef quality-volgorde inclusief fallback terug."""
    order = _FORMAT_FALLBACK[:]
    idx   = order.index(quality) if quality in order else 0
    return order[idx:]


def _safe_filename(name: str) -> str:
    """Verwijder onveilige tekens voor bestandsnamen."""
    keep = set(r"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 -_()[]&.,!'")
    return "".join(c if c in keep else "_" for c in name).strip()[:120]


def _format_name(format_id: int) -> str:
    mapping = {9: "FLAC", 3: "MP3_320", 1: "MP3_128"}
    return mapping.get(format_id, "MP3_128")


# ── Singleton helper ────────────────────────────────────────────────────────────
_client: DeezerDownloadClient | None = None


def get_client() -> DeezerDownloadClient:
    global _client
    if _client is None:
        _client = DeezerDownloadClient()
    return _client
