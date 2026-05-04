"""
tag_writer.py — Mutagen-gebaseerde metadata tag writer.

Schrijft standaard- en uitgebreide tags naar MP3, FLAC, OGG Vorbis en M4A/AAC.
Ondersteunt cover art embedding, MusicBrainz IDs, ISRC, service IDs en
multi-artist tags voor Navidrome/Jellyfin-compatibiliteit.

Gebruik:
    from core.tag_writer import TagWriter
    writer = TagWriter()
    ok = writer.write_tags('/music/track.flac', {
        'title':    'Song Title',
        'artist':   'Artist Name',
        'album':    'Album Name',
        'year':     '2024',
        'mbid_recording': '...',
    })
"""
from __future__ import annotations

import logging
import mimetypes
import os
from pathlib import Path
from typing import Any

log = logging.getLogger(__name__)

# ── Mutagen imports ────────────────────────────────────────────────────────────
try:
    from mutagen.flac import FLAC, Picture
    from mutagen.id3 import (
        APIC, ID3, ID3NoHeaderError, TALB, TDRC, TCON, TDRC,
        TIT2, TPE1, TPE2, TPOS, TRCK, TSRC, TXXX, TPUB,
        TextFrame,
    )
    from mutagen.mp3 import MP3
    from mutagen.mp4 import MP4, MP4Cover
    from mutagen.oggvorbis import OggVorbis
    _MUTAGEN_OK = True
except ImportError:
    _MUTAGEN_OK = False
    log.warning("mutagen niet geïnstalleerd — tag_writer heeft beperkte functionaliteit")


# ── Veld-mapping ───────────────────────────────────────────────────────────────
# Basis-veld → Vorbis Comment tag naam (FLAC/OGG)
_VORBIS_MAP: dict[str, str] = {
    "title":           "TITLE",
    "artist":          "ARTIST",
    "album":           "ALBUM",
    "album_artist":    "ALBUMARTIST",
    "track_number":    "TRACKNUMBER",
    "disc_number":     "DISCNUMBER",
    "year":            "DATE",
    "genre":           "GENRE",
    "isrc":            "ISRC",
    "label":           "ORGANIZATION",
    "catalog_number":  "CATALOGNUMBER",
    "comment":         "COMMENT",
    # MusicBrainz IDs
    "mbid_recording":  "MUSICBRAINZ_TRACKID",
    "mbid_release":    "MUSICBRAINZ_ALBUMID",
    "mbid_artist":     "MUSICBRAINZ_ARTISTID",
    # Service IDs (opgeslagen als custom tags)
    "spotify_id":      "SPOTIFY_ID",
    "deezer_id":       "DEEZER_ID",
    "tidal_id":        "TIDAL_ID",
}

# Basis-veld → MP4 atom naam
_MP4_MAP: dict[str, str] = {
    "title":           "\xa9nam",
    "artist":          "\xa9ART",
    "album":           "\xa9alb",
    "album_artist":    "aART",
    "track_number":    "trkn",
    "disc_number":     "disk",
    "year":            "\xa9day",
    "genre":           "\xa9gen",
    "isrc":            "----:com.apple.iTunes:ISRC",
    "label":           "----:com.apple.iTunes:LABEL",
    "catalog_number":  "----:com.apple.iTunes:CATALOGNUMBER",
    "comment":         "\xa9cmt",
    # MusicBrainz IDs
    "mbid_recording":  "----:com.apple.iTunes:MusicBrainz Track Id",
    "mbid_release":    "----:com.apple.iTunes:MusicBrainz Album Id",
    "mbid_artist":     "----:com.apple.iTunes:MusicBrainz Artist Id",
    # Service IDs
    "spotify_id":      "----:com.apple.iTunes:SPOTIFY_ID",
    "deezer_id":       "----:com.apple.iTunes:DEEZER_ID",
    "tidal_id":        "----:com.apple.iTunes:TIDAL_ID",
}


class TagWriter:
    """
    Schrijft en leest audio-metadata tags voor MP3, FLAC, OGG en M4A.

    Parameters
    ----------
    artist_separator : str
        Scheidingsteken voor meerdere artiesten in de ARTIST-tag (standaard '; ').
    multi_artist_tag : bool
        Als True, schrijf ook een ARTISTS-tag met afzonderlijke waarden voor
        Navidrome/Jellyfin-compatibiliteit.
    """

    def __init__(
        self,
        artist_separator: str = "; ",
        multi_artist_tag: bool = True,
    ) -> None:
        if not _MUTAGEN_OK:
            raise RuntimeError(
                "mutagen is niet geïnstalleerd. Voeg 'mutagen' toe aan core/requirements.txt"
            )
        self.artist_separator = artist_separator
        self.multi_artist_tag = multi_artist_tag

    # ── Publieke API ──────────────────────────────────────────────────────────

    def write_tags(self, filepath: str, metadata: dict[str, Any]) -> bool:
        """
        Schrijf metadata-tags naar een audiobestand.

        Parameters
        ----------
        filepath : str
            Pad naar het audiobestand.
        metadata : dict
            Veldnamen uit _VORBIS_MAP + optioneel 'artists' (lijst) voor
            multi-artist support.

        Returns
        -------
        bool
            True als het schrijven gelukt is, False bij een fout.
        """
        ext = Path(filepath).suffix.lower()
        try:
            if ext == ".mp3":
                return self._write_mp3(filepath, metadata)
            elif ext == ".flac":
                return self._write_flac(filepath, metadata)
            elif ext == ".ogg":
                return self._write_ogg(filepath, metadata)
            elif ext in (".m4a", ".aac", ".mp4"):
                return self._write_mp4(filepath, metadata)
            else:
                log.warning("Onbekende extensie '%s' — tags niet geschreven", ext)
                return False
        except Exception as exc:
            log.error("Fout bij schrijven tags naar '%s': %s", filepath, exc)
            return False

    def read_tags(self, filepath: str) -> dict[str, Any]:
        """
        Lees metadata-tags uit een audiobestand terug.

        Returns een dict met genormaliseerde veldnamen (dezelfde sleutels als
        write_tags) of een leeg dict bij een fout.
        """
        ext = Path(filepath).suffix.lower()
        try:
            if ext == ".mp3":
                return self._read_mp3(filepath)
            elif ext == ".flac":
                return self._read_flac(filepath)
            elif ext == ".ogg":
                return self._read_ogg(filepath)
            elif ext in (".m4a", ".aac", ".mp4"):
                return self._read_mp4(filepath)
            else:
                return {}
        except Exception as exc:
            log.error("Fout bij lezen tags uit '%s': %s", filepath, exc)
            return {}

    def embed_cover_art(self, filepath: str, image_path: str) -> bool:
        """
        Embed cover art in het audiobestand vanuit een afbeeldingsbestand.

        Parameters
        ----------
        filepath : str
            Pad naar het audiobestand.
        image_path : str
            Pad naar de cover art (JPEG of PNG aanbevolen).

        Returns
        -------
        bool
            True als embedding gelukt is.
        """
        if not os.path.isfile(image_path):
            log.warning("Cover art bestand niet gevonden: '%s'", image_path)
            return False

        try:
            with open(image_path, "rb") as f:
                image_data = f.read()

            mime = mimetypes.guess_type(image_path)[0] or "image/jpeg"
            ext  = Path(filepath).suffix.lower()

            if ext == ".mp3":
                return self._embed_cover_mp3(filepath, image_data, mime)
            elif ext == ".flac":
                return self._embed_cover_flac(filepath, image_data, mime)
            elif ext == ".ogg":
                return self._embed_cover_ogg(filepath, image_data, mime)
            elif ext in (".m4a", ".aac", ".mp4"):
                return self._embed_cover_mp4(filepath, image_data, mime)
            else:
                log.warning("Cover art embedding niet ondersteund voor extensie '%s'", ext)
                return False
        except Exception as exc:
            log.error("Fout bij embedding cover art in '%s': %s", filepath, exc)
            return False

    # ── MP3 (ID3) ─────────────────────────────────────────────────────────────

    def _write_mp3(self, filepath: str, metadata: dict) -> bool:
        try:
            tags = ID3(filepath)
        except ID3NoHeaderError:
            tags = ID3()

        # Basis-velden als ID3-frames
        field_map = {
            "title":        (TIT2, None),
            "artist":       (TPE1, None),
            "album":        (TALB, None),
            "album_artist": (TPE2, None),
            "year":         (TDRC, None),
            "genre":        (TCON, None),
            "isrc":         (TSRC, None),
        }
        for field, (frame_class, _) in field_map.items():
            if field in metadata and metadata[field]:
                tags[frame_class.__name__] = frame_class(
                    encoding=3, text=str(metadata[field])
                )

        # TRCK: track_number [/total]
        if "track_number" in metadata and metadata["track_number"]:
            track_str = str(metadata["track_number"])
            if "track_total" in metadata and metadata["track_total"]:
                track_str += f"/{metadata['track_total']}"
            tags["TRCK"] = TRCK(encoding=3, text=track_str)

        # TPOS: disc_number [/total]
        if "disc_number" in metadata and metadata["disc_number"]:
            disc_str = str(metadata["disc_number"])
            if "disc_total" in metadata and metadata["disc_total"]:
                disc_str += f"/{metadata['disc_total']}"
            tags["TPOS"] = TPOS(encoding=3, text=disc_str)

        # Label → TPUB
        if "label" in metadata and metadata["label"]:
            tags["TPUB"] = TPUB(encoding=3, text=str(metadata["label"]))

        # Extended velden als TXXX custom frames
        txxx_fields = {
            "catalog_number":  "CATALOGNUMBER",
            "mbid_recording":  "MusicBrainz Track Id",
            "mbid_release":    "MusicBrainz Album Id",
            "mbid_artist":     "MusicBrainz Artist Id",
            "spotify_id":      "SPOTIFY_ID",
            "deezer_id":       "DEEZER_ID",
            "tidal_id":        "TIDAL_ID",
        }
        for field, desc in txxx_fields.items():
            if field in metadata and metadata[field]:
                frame_id = f"TXXX:{desc}"
                tags[frame_id] = TXXX(encoding=3, desc=desc, text=str(metadata[field]))

        # Multi-artist: ARTISTS TXXX tag voor Navidrome/Jellyfin
        if self.multi_artist_tag and "artists" in metadata and isinstance(metadata["artists"], list):
            tags["TXXX:ARTISTS"] = TXXX(
                encoding=3, desc="ARTISTS",
                text=self.artist_separator.join(metadata["artists"])
            )

        tags.save(filepath, v2_version=3)
        log.debug("MP3 tags geschreven naar '%s'", filepath)
        return True

    def _read_mp3(self, filepath: str) -> dict:
        audio = MP3(filepath)
        if audio.tags is None:
            return {}
        tags = audio.tags

        result: dict[str, Any] = {}
        simple = {
            "TIT2": "title", "TPE1": "artist", "TALB": "album",
            "TPE2": "album_artist", "TDRC": "year", "TCON": "genre",
            "TSRC": "isrc", "TPUB": "label",
        }
        for frame_id, field in simple.items():
            if frame_id in tags:
                result[field] = str(tags[frame_id].text[0]) if tags[frame_id].text else ""

        if "TRCK" in tags:
            result["track_number"] = str(tags["TRCK"].text[0]).split("/")[0]
        if "TPOS" in tags:
            result["disc_number"] = str(tags["TPOS"].text[0]).split("/")[0]

        # TXXX frames
        txxx_map = {
            "MusicBrainz Track Id": "mbid_recording",
            "MusicBrainz Album Id": "mbid_release",
            "MusicBrainz Artist Id": "mbid_artist",
            "SPOTIFY_ID": "spotify_id",
            "DEEZER_ID":  "deezer_id",
            "TIDAL_ID":   "tidal_id",
            "CATALOGNUMBER": "catalog_number",
        }
        for frame in tags.getall("TXXX"):
            if frame.desc in txxx_map:
                result[txxx_map[frame.desc]] = str(frame.text[0]) if frame.text else ""

        return result

    def _embed_cover_mp3(self, filepath: str, image_data: bytes, mime: str) -> bool:
        try:
            tags = ID3(filepath)
        except ID3NoHeaderError:
            tags = ID3()

        tags.delall("APIC")
        tags["APIC"] = APIC(
            encoding=3,
            mime=mime,
            type=3,         # 3 = Front cover
            desc="Cover",
            data=image_data,
        )
        tags.save(filepath, v2_version=3)
        log.debug("Cover art embedded in MP3 '%s'", filepath)
        return True

    # ── FLAC (VorbisComment) ──────────────────────────────────────────────────

    def _write_flac(self, filepath: str, metadata: dict) -> bool:
        audio = FLAC(filepath)

        for field, vorbis_key in _VORBIS_MAP.items():
            if field in metadata and metadata[field] is not None:
                audio[vorbis_key] = [str(metadata[field])]

        # Track/disc als string
        if "track_number" in metadata and "track_total" in metadata:
            audio["TRACKNUMBER"] = [f"{metadata['track_number']}/{metadata['track_total']}"]
        if "disc_number" in metadata and "disc_total" in metadata:
            audio["DISCNUMBER"] = [f"{metadata['disc_number']}/{metadata['disc_total']}"]

        # Multi-artist tag voor Navidrome/Jellyfin
        if self.multi_artist_tag and "artists" in metadata and isinstance(metadata["artists"], list):
            audio["ARTISTS"] = metadata["artists"]

        audio.save()
        log.debug("FLAC tags geschreven naar '%s'", filepath)
        return True

    def _read_flac(self, filepath: str) -> dict:
        audio = FLAC(filepath)
        result: dict[str, Any] = {}
        reverse = {v: k for k, v in _VORBIS_MAP.items()}
        for vorbis_key, value_list in audio.tags or []:
            field = reverse.get(vorbis_key.upper())
            if field:
                result[field] = value_list[0] if value_list else ""
        return result

    def _embed_cover_flac(self, filepath: str, image_data: bytes, mime: str) -> bool:
        audio = FLAC(filepath)
        audio.clear_pictures()

        pic = Picture()
        pic.type = 3            # Front cover
        pic.mime = mime
        pic.desc = "Cover"
        pic.data = image_data
        audio.add_picture(pic)
        audio.save()
        log.debug("Cover art embedded in FLAC '%s'", filepath)
        return True

    # ── OGG Vorbis (VorbisComment) ────────────────────────────────────────────

    def _write_ogg(self, filepath: str, metadata: dict) -> bool:
        audio = OggVorbis(filepath)

        for field, vorbis_key in _VORBIS_MAP.items():
            if field in metadata and metadata[field] is not None:
                audio[vorbis_key] = [str(metadata[field])]

        if self.multi_artist_tag and "artists" in metadata and isinstance(metadata["artists"], list):
            audio["ARTISTS"] = metadata["artists"]

        audio.save()
        log.debug("OGG tags geschreven naar '%s'", filepath)
        return True

    def _read_ogg(self, filepath: str) -> dict:
        audio = OggVorbis(filepath)
        result: dict[str, Any] = {}
        reverse = {v: k for k, v in _VORBIS_MAP.items()}
        for key, values in (audio.tags or {}).items():
            field = reverse.get(key.upper())
            if field:
                result[field] = values[0] if values else ""
        return result

    def _embed_cover_ogg(self, filepath: str, image_data: bytes, mime: str) -> bool:
        """OGG Vorbis cover art via base64-encoded METADATA_BLOCK_PICTURE."""
        import base64
        import struct

        audio = OggVorbis(filepath)

        pic = Picture()
        pic.type = 3
        pic.mime = mime
        pic.desc = "Cover"
        pic.data = image_data

        # Serialiseer naar bytes en encode als base64
        pic_data = pic.write()
        encoded = base64.b64encode(pic_data).decode("ascii")
        audio["METADATA_BLOCK_PICTURE"] = [encoded]
        audio.save()
        log.debug("Cover art embedded in OGG '%s'", filepath)
        return True

    # ── M4A / AAC (MP4) ───────────────────────────────────────────────────────

    def _write_mp4(self, filepath: str, metadata: dict) -> bool:
        audio = MP4(filepath)
        if audio.tags is None:
            audio.add_tags()

        for field, atom in _MP4_MAP.items():
            if field not in metadata or metadata[field] is None:
                continue
            value = metadata[field]

            if atom.startswith("----"):
                # Freeform atom: waarde als bytes
                audio.tags[atom] = [value.encode("utf-8") if isinstance(value, str) else value]
            elif atom == "trkn":
                try:
                    num = int(str(value).split("/")[0])
                    total = int(metadata.get("track_total", 0) or 0)
                    audio.tags[atom] = [(num, total)]
                except (ValueError, TypeError):
                    pass
            elif atom == "disk":
                try:
                    num = int(str(value).split("/")[0])
                    total = int(metadata.get("disc_total", 0) or 0)
                    audio.tags[atom] = [(num, total)]
                except (ValueError, TypeError):
                    pass
            else:
                audio.tags[atom] = [str(value)]

        audio.save()
        log.debug("MP4 tags geschreven naar '%s'", filepath)
        return True

    def _read_mp4(self, filepath: str) -> dict:
        audio = MP4(filepath)
        result: dict[str, Any] = {}
        reverse = {v: k for k, v in _MP4_MAP.items()}

        for atom, values in (audio.tags or {}).items():
            field = reverse.get(atom)
            if not field or not values:
                continue
            val = values[0]
            if isinstance(val, bytes):
                result[field] = val.decode("utf-8", errors="replace")
            elif isinstance(val, tuple):
                result[field] = val[0]
            else:
                result[field] = str(val)
        return result

    def _embed_cover_mp4(self, filepath: str, image_data: bytes, mime: str) -> bool:
        audio = MP4(filepath)
        if audio.tags is None:
            audio.add_tags()

        fmt = MP4Cover.FORMAT_PNG if "png" in mime else MP4Cover.FORMAT_JPEG
        audio.tags["covr"] = [MP4Cover(image_data, imageformat=fmt)]
        audio.save()
        log.debug("Cover art embedded in M4A '%s'", filepath)
        return True
