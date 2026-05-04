"""
youtube_client.py — YouTube audio download client via yt-dlp.

Gebruikt yt-dlp als Python library voor:
- Zoeken op YouTube / YouTube Music
- Audio-only downloads (MP3 320 kbps via FFmpeg post-processing)
- Playlist-downloads
- Cookie-gebaseerde bot-detectie bypass

Configuratie:
    YOUTUBE_COOKIES_FILE — optioneel pad naar een cookies.txt bestand
                           (exporteer via browser-extensie, bijv. "Get cookies.txt LOCALLY")

Hoe cookies.txt exporteren:
    1. Log in op youtube.com / music.youtube.com in je browser
    2. Installeer de extensie "Get cookies.txt LOCALLY" (Chrome/Firefox)
    3. Klik op de extensie → "Export as cookies.txt"
    4. Sla op als /data/youtube_cookies.txt (of stel YOUTUBE_COOKIES_FILE in)
    5. Herstart de container
"""
from __future__ import annotations

import logging
import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

log = logging.getLogger(__name__)

_COOKIES_FILE = os.environ.get("YOUTUBE_COOKIES_FILE", "")


# ── Dataklassen ─────────────────────────────────────────────────────────────────

@dataclass
class Video:
    id:          str
    title:       str
    uploader:    str
    duration:    int = 0         # seconden
    view_count:  int = 0
    url:         str = ""        # https://www.youtube.com/watch?v=...
    thumbnail:   str = ""

@dataclass
class Playlist:
    id:     str
    title:  str
    videos: list[Video] = field(default_factory=list)


# ── yt-dlp helpers ──────────────────────────────────────────────────────────────

def _base_opts(output_dir: str, fmt: str = "mp3", quality: str = "320") -> dict:
    """Stel de basis yt-dlp opties in (audio, post-processing, cookies)."""
    opts: dict = {
        "format":         "bestaudio/best",
        "postprocessors": [
            {
                "key":              "FFmpegExtractAudio",
                "preferredcodec":   fmt,
                "preferredquality": quality,
            }
        ],
        "outtmpl":        str(Path(output_dir) / "%(uploader)s - %(title)s.%(ext)s"),
        "quiet":          True,
        "no_warnings":    True,
        "noprogress":     True,
        "ignoreerrors":   False,
    }
    if _COOKIES_FILE and Path(_COOKIES_FILE).is_file():
        opts["cookiefile"] = _COOKIES_FILE
        log.debug("YouTube: cookies geladen uit %s", _COOKIES_FILE)
    return opts


def _import_ytdlp():
    """Importeer yt-dlp; geef duidelijke fout als niet geïnstalleerd."""
    try:
        import yt_dlp
        return yt_dlp
    except ImportError:
        raise RuntimeError(
            "yt-dlp is niet geïnstalleerd als Python library. "
            "Voeg 'yt-dlp' toe aan core/requirements.txt en herbouw de container."
        )


# ── Client ───────────────────────────────────────────────────────────────────────

class YouTubeClient:
    """
    YouTube audio download client via yt-dlp.

    Gebruik:
        client = YouTubeClient()
        results = client.search("Radiohead Karma Police")
        path = client.download("https://www.youtube.com/watch?v=...", "/data/downloads/youtube")
    """

    # ── Zoeken ──────────────────────────────────────────────────────────────────

    def search(self, query: str, max_results: int = 10) -> list[Video]:
        """
        Zoek op YouTube via de ingebouwde yt-dlp zoekfunctie (ytsearch).

        Args:
            query:       Zoekopdracht (artiest + titel)
            max_results: Max aantal resultaten

        Returns:
            Lijst van Video dataklassen
        """
        yt_dlp = _import_ytdlp()
        search_url = f"ytsearch{max_results}:{query}"
        opts = {
            "quiet":        True,
            "no_warnings":  True,
            "extract_flat": True,   # Geen download, alleen metadata
        }
        if _COOKIES_FILE and Path(_COOKIES_FILE).is_file():
            opts["cookiefile"] = _COOKIES_FILE

        try:
            with yt_dlp.YoutubeDL(opts) as ydl:
                info = ydl.extract_info(search_url, download=False)
            entries = info.get("entries", []) if info else []
            return [
                Video(
                    id=e.get("id", ""),
                    title=e.get("title", ""),
                    uploader=e.get("uploader") or e.get("channel", ""),
                    duration=e.get("duration", 0) or 0,
                    view_count=e.get("view_count", 0) or 0,
                    url=f"https://www.youtube.com/watch?v={e.get('id', '')}",
                    thumbnail=e.get("thumbnail", ""),
                )
                for e in entries
                if e.get("id")
            ]
        except Exception as exc:
            log.warning("YouTube zoekfout voor '%s': %s", query, exc)
            return []

    # ── Enkele video downloaden ──────────────────────────────────────────────────

    def download(
        self,
        url: str,
        output_dir: str = "/data/downloads/youtube",
        quality: str = "mp3_320",
    ) -> str:
        """
        Download audio van een YouTube-video.

        Args:
            url:        YouTube URL (watch, shorts, music, etc.)
            output_dir: Doelmap
            quality:    'mp3_320', 'mp3_128' of 'flac' (vereist FFmpeg)

        Returns:
            Absoluut pad naar het gedownloade audiobestand
        """
        yt_dlp = _import_ytdlp()
        fmt, q  = _parse_quality(quality)
        opts    = _base_opts(output_dir, fmt, q)
        Path(output_dir).mkdir(parents=True, exist_ok=True)

        log.info("YouTube: download %s [%s]", url, quality)
        try:
            with yt_dlp.YoutubeDL(opts) as ydl:
                info     = ydl.extract_info(url, download=True)
                filename = ydl.prepare_filename(info)
                # yt-dlp vervangt de extensie na post-processing
                stem     = Path(filename).stem
                final    = Path(output_dir) / f"{stem}.{fmt}"
                if not final.exists():
                    # Zoek het werkelijke bestand (kan iets anders heten)
                    candidates = list(Path(output_dir).glob(f"{stem}*"))
                    if candidates:
                        final = sorted(candidates)[-1]
                log.info("YouTube: ✓ klaar → %s", final)
                return str(final)
        except Exception as exc:
            raise RuntimeError(f"YouTube download mislukt voor {url}: {exc}") from exc

    # ── Playlist downloaden ──────────────────────────────────────────────────────

    def download_playlist(
        self,
        url: str,
        output_dir: str = "/data/downloads/youtube",
        quality: str = "mp3_320",
    ) -> list[str]:
        """
        Download alle video's van een YouTube-playlist als audio.

        Args:
            url:        YouTube playlist-URL
            output_dir: Doelmap (per playlist een submap)
            quality:    'mp3_320', 'mp3_128' of 'flac'

        Returns:
            Lijst van paden naar gedownloade audiobestanden
        """
        yt_dlp = _import_ytdlp()
        fmt, q  = _parse_quality(quality)

        # Haal eerst playlist-metadata op om de naam te bepalen
        meta_opts = {
            "quiet":        True,
            "no_warnings":  True,
            "extract_flat": True,
        }
        if _COOKIES_FILE and Path(_COOKIES_FILE).is_file():
            meta_opts["cookiefile"] = _COOKIES_FILE

        try:
            with yt_dlp.YoutubeDL(meta_opts) as ydl:
                meta = ydl.extract_info(url, download=False)
            playlist_title = _safe_filename(meta.get("title") or "playlist")
            entries        = meta.get("entries") or []
            log.info("YouTube: playlist '%s' — %d video's", playlist_title, len(entries))
        except Exception as exc:
            log.warning("YouTube: playlist-metadata mislukt: %s — probeer direct te downloaden", exc)
            playlist_title = "playlist"
            entries        = []

        playlist_dir = Path(output_dir) / playlist_title
        playlist_dir.mkdir(parents=True, exist_ok=True)

        if entries:
            # Download video voor video (fout per video afvangen)
            paths = []
            for entry in entries:
                vid_url = entry.get("url") or (
                    f"https://www.youtube.com/watch?v={entry['id']}"
                    if entry.get("id") else None
                )
                if not vid_url:
                    continue
                try:
                    path = self.download(vid_url, str(playlist_dir), quality)
                    paths.append(path)
                except Exception as exc:
                    log.warning("YouTube: video %s overgeslagen: %s", vid_url, exc)
            return paths
        else:
            # Geen metadata — download heel de playlist in één keer
            opts = _base_opts(str(playlist_dir), fmt, q)
            opts["ignoreerrors"] = True
            try:
                with yt_dlp.YoutubeDL(opts) as ydl:
                    ydl.download([url])
            except Exception as exc:
                raise RuntimeError(f"YouTube playlist-download mislukt: {exc}") from exc
            return [str(p) for p in playlist_dir.iterdir() if p.is_file()]

    # ── Status ──────────────────────────────────────────────────────────────────

    def get_status(self) -> dict:
        """Controleer of yt-dlp beschikbaar is."""
        try:
            _import_ytdlp()
            return {
                "connected":    True,
                "cookies_file": _COOKIES_FILE or None,
                "cookies_ok":   bool(_COOKIES_FILE and Path(_COOKIES_FILE).is_file()),
            }
        except RuntimeError as exc:
            return {"connected": False, "error": str(exc)}


# ── Helpers ─────────────────────────────────────────────────────────────────────

def _parse_quality(quality: str) -> tuple[str, str]:
    """
    Zet generic quality om naar (codec, bitrate) voor yt-dlp post-processor.

    Returns:
        ("mp3", "320") | ("mp3", "128") | ("flac", "0")
    """
    if quality in ("flac", "lossless"):
        return "flac", "0"
    if quality in ("mp3_128", "low"):
        return "mp3", "128"
    # Default: mp3_320 / high
    return "mp3", "320"


def _safe_filename(name: str) -> str:
    keep = set(r"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 -_()[]&.,!'")
    return "".join(c if c in keep else "_" for c in name).strip()[:80] or "playlist"


# ── Singleton ────────────────────────────────────────────────────────────────────
_client: YouTubeClient | None = None


def get_client() -> YouTubeClient:
    global _client
    if _client is None:
        _client = YouTubeClient()
    return _client
