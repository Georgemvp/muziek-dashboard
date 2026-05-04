"""
replaygain.py — ReplayGain loudness analyse en tag-schrijven via ffmpeg.

Analyseert het gemiddelde geluidsvolume (EBU R128) van een audiobestand en
schrijft de standaard ReplayGain tags terug naar het bestand.

ffmpeg 'replaygain' audio-filter rapporteert track_gain en track_peak in zijn
stderr; deze module parsert die waarden en schrijft ze als metadata.

Vereisten:
    - ffmpeg in PATH (al aanwezig in Docker image)

Gebruik:
    from core.replaygain import analyze_replaygain, tag_replaygain

    # Alleen analyseren (geen tags schrijven):
    info = analyze_replaygain('/music/track.flac')
    print(info)  # {'track_gain': '-4.72 dB', 'track_peak': '0.982341'}

    # Analyseren + tags schrijven in één stap:
    ok = tag_replaygain('/music/track.flac')
"""
from __future__ import annotations

import logging
import os
import re
import shutil
import subprocess
import tempfile
from dataclasses import dataclass

log = logging.getLogger(__name__)

# ── Regex-patronen voor ffmpeg stderr parsing ─────────────────────────────────
_TRACK_GAIN_RE = re.compile(
    r"track_gain\s*[=:]\s*([+-]?\d+\.?\d*)\s*dB",
    re.IGNORECASE,
)
_TRACK_PEAK_RE = re.compile(
    r"track_peak\s*[=:]\s*(\d+\.?\d*)",
    re.IGNORECASE,
)
# Alternatieve ffmpeg-output stijl (older ffmpeg builds)
_MEAN_VOLUME_RE = re.compile(
    r"mean_volume\s*:\s*([+-]?\d+\.?\d*)\s*dB",
    re.IGNORECASE,
)
_MAX_VOLUME_RE = re.compile(
    r"max_volume\s*:\s*([+-]?\d+\.?\d*)\s*dB",
    re.IGNORECASE,
)


@dataclass
class ReplayGainInfo:
    """Resultaat van een ReplayGain analyse."""
    track_gain:  str          # bijv. '-4.72 dB'
    track_peak:  str          # bijv. '0.982341'
    track_gain_db: float      # numerieke waarde zonder eenheid
    track_peak_linear: float  # numerieke waarde


def analyze_replaygain(filepath: str) -> ReplayGainInfo:
    """
    Analyseer het ReplayGain-niveau van een audiobestand via ffmpeg.

    Gebruikt de 'replaygain' audio-filter (EBU R128-gebaseerd) en parsert
    de gain/peak waarden uit de ffmpeg stderr output.

    Parameters
    ----------
    filepath : str
        Pad naar het audiobestand.

    Returns
    -------
    ReplayGainInfo
        Geanalyseerde gain en peak waarden.

    Raises
    ------
    RuntimeError
        Als ffmpeg niet beschikbaar is of de analyse mislukt.
    FileNotFoundError
        Als het audiobestand niet bestaat.
    """
    if not os.path.isfile(filepath):
        raise FileNotFoundError(f"Audiobestand niet gevonden: '{filepath}'")

    if not shutil.which("ffmpeg"):
        raise RuntimeError("ffmpeg niet gevonden in PATH")

    # ffmpeg replaygain filter schrijft resultaten naar stderr en geeft
    # exit-code 1 terug bij '-f null -' — dat is verwacht gedrag.
    result = subprocess.run(
        [
            "ffmpeg",
            "-hide_banner",
            "-i", filepath,
            "-af", "replaygain",
            "-f", "null",
            "-",
        ],
        capture_output=True,
        text=True,
        timeout=120,
    )

    stderr = result.stderr

    # ── Probeer replaygain filter output te parsen ─────────────────────────
    gain_match = _TRACK_GAIN_RE.search(stderr)
    peak_match = _TRACK_PEAK_RE.search(stderr)

    if gain_match and peak_match:
        gain_db   = float(gain_match.group(1))
        peak      = float(peak_match.group(1))
        log.debug(
            "ReplayGain analyse '%s': gain=%.2fdB peak=%.6f",
            os.path.basename(filepath), gain_db, peak,
        )
        return ReplayGainInfo(
            track_gain        = f"{gain_db:+.2f} dB",
            track_peak        = f"{peak:.6f}",
            track_gain_db     = gain_db,
            track_peak_linear = peak,
        )

    # ── Fallback: volumedetect filter voor oudere ffmpeg versies ──────────
    log.debug(
        "replaygain filter output niet parseerbaar, probeer volumedetect fallback"
    )
    vol_result = subprocess.run(
        [
            "ffmpeg",
            "-hide_banner",
            "-i", filepath,
            "-af", "volumedetect",
            "-f", "null",
            "-",
        ],
        capture_output=True,
        text=True,
        timeout=120,
    )

    vol_stderr   = vol_result.stderr
    mean_match   = _MEAN_VOLUME_RE.search(vol_stderr)
    max_match    = _MAX_VOLUME_RE.search(vol_stderr)

    if mean_match:
        # EBU R128 referentie = -23 LUFS; consumer ReplayGain target = -18 LUFS
        # Ruwe benadering: gain = target - mean_volume
        mean_db = float(mean_match.group(1))
        gain_db = -18.0 - mean_db   # benadering, niet EBU-gecalibreerd

        max_db   = float(max_match.group(1)) if max_match else 0.0
        peak     = 10 ** (max_db / 20)   # dB → lineair

        log.info(
            "ReplayGain volumedetect fallback '%s': mean=%.1fdB → gain≈%.2fdB",
            os.path.basename(filepath), mean_db, gain_db,
        )
        return ReplayGainInfo(
            track_gain        = f"{gain_db:+.2f} dB",
            track_peak        = f"{min(peak, 1.0):.6f}",
            track_gain_db     = gain_db,
            track_peak_linear = min(peak, 1.0),
        )

    raise RuntimeError(
        f"ReplayGain analyse mislukt: geen gain/peak gevonden in ffmpeg output.\n"
        f"stderr (laatste 10 regels):\n"
        + "\n".join(stderr.splitlines()[-10:])
    )


def tag_replaygain(
    filepath: str,
    info:     ReplayGainInfo | None = None,
) -> bool:
    """
    Schrijf ReplayGain tags naar een audiobestand.

    Parameters
    ----------
    filepath : str
        Pad naar het audiobestand.
    info : ReplayGainInfo, optional
        Eerder geanalyseerde waarden. Als None, wordt analyze_replaygain()
        aangeroepen.

    Returns
    -------
    bool
        True als het taggen gelukt is.

    Raises
    ------
    RuntimeError
        Als analyse of tag-schrijven mislukt.
    """
    if info is None:
        info = analyze_replaygain(filepath)

    ext  = os.path.splitext(filepath)[1].lower()
    tmp  = tempfile.mktemp(suffix=ext)

    try:
        _write_replaygain_tags(filepath, tmp, info)
        os.replace(tmp, filepath)
        log.info(
            "ReplayGain tags geschreven naar '%s': %s / %s",
            os.path.basename(filepath),
            info.track_gain,
            info.track_peak,
        )
        return True
    except Exception:
        if os.path.exists(tmp):
            try:
                os.unlink(tmp)
            except OSError:
                pass
        raise


def _write_replaygain_tags(
    input_path:  str,
    output_path: str,
    info:        ReplayGainInfo,
) -> None:
    """Gebruik ffmpeg om ReplayGain metadata-tags naar een nieuw bestand te schrijven."""
    result = subprocess.run(
        [
            "ffmpeg",
            "-hide_banner",
            "-i", input_path,
            "-c", "copy",
            "-metadata", f"REPLAYGAIN_TRACK_GAIN={info.track_gain}",
            "-metadata", f"REPLAYGAIN_TRACK_PEAK={info.track_peak}",
            "-y", output_path,
        ],
        capture_output=True,
        text=True,
        timeout=120,
    )

    if result.returncode != 0:
        stderr_tail = "\n".join(result.stderr.splitlines()[-10:])
        raise RuntimeError(
            f"ffmpeg tag-schrijven mislukt (exit {result.returncode}):\n{stderr_tail}"
        )
