"""
lossy_converter.py — ffmpeg-gebaseerde lossy audio conversie.

Converteert FLAC (of een ander lossless formaat) naar MP3, Opus of AAC.
Optioneel: downsample Hi-Res (>16-bit of >44.1kHz) naar CD-kwaliteit.

Vereisten:
    - ffmpeg in PATH (al aanwezig in Docker image)

Gebruik:
    from core.lossy_converter import LossyConverter
    conv = LossyConverter(format='opus', bitrate='256', output_dir='/music/lossy')
    out_path = conv.convert('/music/flac/Artist/Album/01 - Track.flac')

    # Of via de module-level helper:
    from core.lossy_converter import convert_to_lossy
    out = convert_to_lossy('/music/track.flac', format='mp3', bitrate='320', output_dir='/music/lossy')
"""
from __future__ import annotations

import logging
import os
import shutil
import subprocess
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import Literal

log = logging.getLogger(__name__)

# ── Codec- en extensie-mapping ────────────────────────────────────────────────
_FORMAT_CONFIG: dict[str, dict[str, str]] = {
    "mp3":  {"codec": "libmp3lame", "ext": ".mp3",  "max_bitrate": "320"},
    "opus": {"codec": "libopus",    "ext": ".opus", "max_bitrate": "256"},
    "aac":  {"codec": "aac",        "ext": ".m4a",  "max_bitrate": "256"},
}

AudioFormat = Literal["mp3", "opus", "aac"]


@dataclass
class ConversionResult:
    """Resultaat van een lossy conversie."""
    success:     bool
    output_path: str | None  = None
    input_path:  str          = ""
    format:      str          = ""
    bitrate:     str          = ""
    error:       str | None   = None
    downsampled: bool         = False  # True als Hi-Res werd gedownsampled


class LossyConverter:
    """
    Converteer audiobestanden naar lossy formaten via ffmpeg.

    Parameters
    ----------
    format : str
        Doelformaat: 'mp3', 'opus' of 'aac'.
    bitrate : str
        Bitrate in kbps (bijv. '320', '256', '128').
        Wordt automatisch geclipped aan het maximum voor het formaat.
    output_dir : str | None
        Map voor de geconverteerde bestanden. Als None, wordt dezelfde map als
        het bronbestand gebruikt.
    preserve_structure : bool
        Als True en source_base is ingesteld, bewaar de mapstructuur relatief
        aan source_base in output_dir.
    source_base : str | None
        Basismap voor preserve_structure berekening.
    downsample_hires : bool
        Als True, downsample Hi-Res (>16-bit of >44.1kHz) naar 16-bit/44.1kHz
        vóór de lossy conversie.
    overwrite : bool
        Overschrijf bestaand doelbestand als True.
    """

    def __init__(
        self,
        format:             AudioFormat = "mp3",
        bitrate:            str         = "320",
        output_dir:         str | None  = None,
        preserve_structure: bool        = False,
        source_base:        str | None  = None,
        downsample_hires:   bool        = False,
        overwrite:          bool        = True,
    ) -> None:
        if format not in _FORMAT_CONFIG:
            raise ValueError(f"Ongeldig formaat '{format}'. Kies uit: {list(_FORMAT_CONFIG)}")
        self.format             = format
        self.bitrate            = self._clamp_bitrate(format, bitrate)
        self.output_dir         = output_dir
        self.preserve_structure = preserve_structure
        self.source_base        = source_base
        self.downsample_hires   = downsample_hires
        self.overwrite          = overwrite

        self._check_ffmpeg()

    # ── Publieke API ──────────────────────────────────────────────────────────

    def convert(self, input_path: str) -> ConversionResult:
        """
        Converteer één audiobestand naar het geconfigureerde lossy formaat.

        Parameters
        ----------
        input_path : str
            Pad naar het bronbestand (FLAC, WAV, AIFF, of ander ffmpeg-formaat).

        Returns
        -------
        ConversionResult
            Altijd een geldig object. Bij fout: success=False, error=<beschrijving>.
        """
        if not os.path.isfile(input_path):
            return ConversionResult(
                success=False, input_path=input_path,
                error=f"Bronbestand niet gevonden: '{input_path}'"
            )

        output_path   = self._build_output_path(input_path)
        downsampled   = False
        working_input = input_path

        # ── Stap 1: Optioneel Hi-Res downsampling ─────────────────────────
        if self.downsample_hires:
            ds_result = _check_hires(input_path)
            if ds_result:
                log.info(
                    "Hi-Res gedetecteerd (%s-bit/%sHz) — downsampling voor conversie",
                    ds_result["bits"], ds_result["sample_rate"],
                )
                try:
                    tmp = self._downsample_to_cd(input_path)
                    working_input = tmp
                    downsampled   = True
                except Exception as exc:
                    log.warning("Downsampling mislukt, ga door met origineel: %s", exc)

        # ── Stap 2: Controleer of doelbestand al bestaat ──────────────────
        if os.path.isfile(output_path) and not self.overwrite:
            log.debug("Doelbestand bestaat al, overgeslagen: '%s'", output_path)
            return ConversionResult(
                success=True, input_path=input_path,
                output_path=output_path, format=self.format,
                bitrate=self.bitrate, downsampled=downsampled,
            )

        os.makedirs(os.path.dirname(output_path), exist_ok=True)

        # ── Stap 3: ffmpeg conversie ──────────────────────────────────────
        try:
            cfg  = _FORMAT_CONFIG[self.format]
            args = self._build_ffmpeg_args(working_input, output_path, cfg)
            log.info(
                "Converteer '%s' → '%s' (%s %skbps)",
                os.path.basename(input_path),
                os.path.basename(output_path),
                self.format.upper(),
                self.bitrate,
            )
            _run_ffmpeg(args)
        except Exception as exc:
            return ConversionResult(
                success=False, input_path=input_path,
                format=self.format, bitrate=self.bitrate,
                error=str(exc),
            )
        finally:
            # Verwijder tijdelijk downsampled bestand
            if downsampled and working_input != input_path and os.path.exists(working_input):
                try:
                    os.unlink(working_input)
                except OSError:
                    pass

        log.info("Conversie klaar: '%s'", output_path)
        return ConversionResult(
            success=True, input_path=input_path,
            output_path=output_path, format=self.format,
            bitrate=self.bitrate, downsampled=downsampled,
        )

    # ── Interne helpers ───────────────────────────────────────────────────────

    def _build_output_path(self, input_path: str) -> str:
        """Bereken het doelpad voor het geconverteerde bestand."""
        cfg     = _FORMAT_CONFIG[self.format]
        stem    = Path(input_path).stem
        out_dir = self.output_dir

        if not out_dir:
            out_dir = str(Path(input_path).parent)
        elif self.preserve_structure and self.source_base:
            try:
                relative = Path(input_path).relative_to(self.source_base)
                out_dir  = str(Path(out_dir) / relative.parent)
            except ValueError:
                out_dir = str(Path(out_dir) / Path(input_path).parent.name)

        return str(Path(out_dir) / (stem + cfg["ext"]))

    def _build_ffmpeg_args(
        self,
        input_path:  str,
        output_path: str,
        cfg:         dict[str, str],
    ) -> list[str]:
        """Stel de ffmpeg command-line argumenten samen."""
        args = [
            "ffmpeg",
            "-i", input_path,
            "-codec:a", cfg["codec"],
            "-b:a", f"{self.bitrate}k",
        ]

        # Opus-specifieke opties: normaliseer sample rate voor compatibiliteit
        if self.format == "opus":
            args += ["-ar", "48000"]  # libopus vereist 48kHz

        # Behoud metadata
        args += ["-map_metadata", "0"]

        if self.overwrite:
            args += ["-y"]

        args.append(output_path)
        return args

    def _downsample_to_cd(self, input_path: str) -> str:
        """Downsample Hi-Res FLAC naar 16-bit/44.1kHz in een tijdelijk bestand."""
        tmp_path = tempfile.mktemp(suffix=".flac")
        args = [
            "ffmpeg",
            "-i", input_path,
            "-sample_fmt", "s16",
            "-ar", "44100",
            "-y", tmp_path,
        ]
        _run_ffmpeg(args)
        return tmp_path

    @staticmethod
    def _clamp_bitrate(format: str, bitrate: str) -> str:
        """Clip de bitrate aan het maximum voor het formaat."""
        try:
            max_br  = int(_FORMAT_CONFIG[format]["max_bitrate"])
            req_br  = int(bitrate)
            clamped = min(req_br, max_br)
            if clamped != req_br:
                log.warning(
                    "Bitrate %skbps geclipped naar max %skbps voor %s",
                    req_br, clamped, format
                )
            return str(clamped)
        except (ValueError, KeyError):
            return bitrate

    @staticmethod
    def _check_ffmpeg() -> None:
        """Controleer of ffmpeg beschikbaar is."""
        if not shutil.which("ffmpeg"):
            raise RuntimeError(
                "ffmpeg niet gevonden in PATH. Controleer de Docker configuratie."
            )


# ── Module-niveau helpers ──────────────────────────────────────────────────────

def _check_hires(filepath: str) -> dict | None:
    """
    Controleer of een bestand Hi-Res audio bevat (>16-bit of >44.1kHz).

    Returns dict met 'bits' en 'sample_rate', of None als het geen Hi-Res is.
    """
    try:
        result = subprocess.run(
            [
                "ffprobe", "-v", "quiet",
                "-print_format", "json",
                "-show_streams",
                filepath,
            ],
            capture_output=True, text=True, timeout=15,
        )
        import json
        data    = json.loads(result.stdout)
        streams = data.get("streams", [])
        audio   = next((s for s in streams if s.get("codec_type") == "audio"), None)
        if not audio:
            return None

        sample_rate = int(audio.get("sample_rate", "44100"))
        bits        = int(
            audio.get("bits_per_raw_sample")
            or audio.get("bits_per_coded_sample")
            or "16"
        )

        if bits > 16 or sample_rate > 44100:
            return {"bits": bits, "sample_rate": sample_rate}
        return None
    except Exception:
        return None


def _run_ffmpeg(args: list[str]) -> None:
    """Voer ffmpeg uit en gooi een RuntimeError bij een niet-nul exit-code."""
    result = subprocess.run(
        args,
        capture_output=True,
        text=True,
        timeout=600,  # max 10 minuten voor grote bestanden
    )
    if result.returncode != 0:
        # Pak de laatste 10 regels stderr voor een beknopte foutmelding
        stderr_tail = "\n".join(result.stderr.splitlines()[-10:])
        raise RuntimeError(
            f"ffmpeg mislukt (exit {result.returncode}):\n{stderr_tail}"
        )


def convert_to_lossy(
    input_path:       str,
    format:           AudioFormat = "mp3",
    bitrate:          str         = "320",
    output_dir:       str | None  = None,
    downsample_hires: bool        = False,
    overwrite:        bool        = True,
) -> str:
    """
    Convenience-functie: converteer één bestand naar een lossy formaat.

    Parameters
    ----------
    input_path : str
        Pad naar het bronbestand.
    format : str
        Doelformaat: 'mp3', 'opus' of 'aac'.
    bitrate : str
        Bitrate in kbps.
    output_dir : str | None
        Doelmap. Als None → zelfde map als bronbestand.
    downsample_hires : bool
        Downsample Hi-Res naar CD-kwaliteit vóór conversie.
    overwrite : bool
        Overschrijf bestaand doelbestand.

    Returns
    -------
    str
        Pad naar het geconverteerde bestand.

    Raises
    ------
    RuntimeError
        Als conversie mislukt.
    """
    conv = LossyConverter(
        format=format,
        bitrate=bitrate,
        output_dir=output_dir,
        downsample_hires=downsample_hires,
        overwrite=overwrite,
    )
    result = conv.convert(input_path)
    if not result.success:
        raise RuntimeError(f"Conversie mislukt: {result.error}")
    return result.output_path
