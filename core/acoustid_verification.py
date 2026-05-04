"""
acoustid_verification.py — AcoustID audio fingerprint verificatie.

Gebruikt fpcalc (Chromaprint) voor fingerprinting en vergelijkt het resultaat
met de AcoustID API. Fail-open: bij fouten of API-uitval wordt de download
NOOIT geblokkeerd.

Confidence scoring:
    >= 0.8  → verified match
    0.5–0.8 → probable match (waarschuwing)
    < 0.5   → mismatch (markeer als potentieel fout bestand)

Vereisten:
    - fpcalc in PATH (apt-get install libchromaprint-tools)
    - ACOUSTID_API_KEY omgevingsvariabele (of doorgeven als parameter)
"""
from __future__ import annotations

import json
import logging
import os
import subprocess
import time
import urllib.parse
import urllib.request
from dataclasses import dataclass, field
from typing import Any

log = logging.getLogger(__name__)

_ACOUSTID_LOOKUP_URL = "https://api.acoustid.org/v2/lookup"
_API_KEY             = os.environ.get("ACOUSTID_API_KEY", "")

# AcoustID staat ~3 req/s toe; wij bewaren dit conservatief op 400ms interval
_LAST_API_CALL: float = 0.0
_MIN_INTERVAL: float  = 0.4


@dataclass
class AcoustIDResult:
    """Resultaat van een AcoustID verificatie."""
    verified:        bool         = False
    score:           float        = 0.0      # AcoustID API confidence (0.0–1.0)
    duration:        int          = 0        # bestandsduur in seconden
    fingerprint:     str          = ""
    matched_recordings: list[dict] = field(default_factory=list)
    best_recording:  dict | None  = None     # beste match (hoogste score)
    mismatch_reason: str | None   = None
    error:           str | None   = None


def fingerprint(filepath: str) -> tuple[int, str]:
    """
    Bereken de AcoustID fingerprint van een audiobestand via fpcalc.

    Parameters
    ----------
    filepath : str
        Pad naar het audiobestand.

    Returns
    -------
    tuple[int, str]
        (duration_in_seconds, fingerprint_string)

    Raises
    ------
    RuntimeError
        Als fpcalc niet beschikbaar is of een fout geeft.
    """
    try:
        result = subprocess.run(
            ["fpcalc", "-json", filepath],
            capture_output=True,
            text=True,
            timeout=60,
        )
    except FileNotFoundError:
        raise RuntimeError(
            "fpcalc niet gevonden. Installeer libchromaprint-tools: "
            "apt-get install libchromaprint-tools"
        )
    except subprocess.TimeoutExpired:
        raise RuntimeError(f"fpcalc timeout bij '{filepath}'")

    if result.returncode != 0:
        raise RuntimeError(
            f"fpcalc fout (code {result.returncode}): {result.stderr.strip()}"
        )

    try:
        data = json.loads(result.stdout)
    except json.JSONDecodeError as exc:
        raise RuntimeError(f"fpcalc gaf ongeldige JSON: {exc}") from exc

    duration = int(data.get("duration", 0))
    fp       = data.get("fingerprint", "")

    if not fp:
        raise RuntimeError("fpcalc gaf geen fingerprint terug")

    return duration, fp


def _rate_limited_request(url: str) -> dict[str, Any]:
    """Doe een HTTP GET naar de AcoustID API met rate-limiting."""
    global _LAST_API_CALL
    elapsed = time.monotonic() - _LAST_API_CALL
    if elapsed < _MIN_INTERVAL:
        time.sleep(_MIN_INTERVAL - elapsed)

    req = urllib.request.Request(
        url,
        headers={"User-Agent": "LastfmMuziekApp/2.0 (muziek-dashboard)"},
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            _LAST_API_CALL = time.monotonic()
            return json.loads(resp.read().decode("utf-8"))
    except Exception as exc:
        raise RuntimeError(f"AcoustID API fout: {exc}") from exc


def lookup(
    duration: int,
    fp: str,
    api_key: str | None = None,
    meta: str = "recordings+releasegroups+compress",
) -> list[dict]:
    """
    Zoek fingerprint op via de AcoustID API.

    Parameters
    ----------
    duration : int
        Bestandsduur in seconden (van fpcalc).
    fp : str
        Fingerprint string (van fpcalc).
    api_key : str, optional
        AcoustID API key. Valt terug op ACOUSTID_API_KEY env var.
    meta : str
        Welke extra informatie de API moet teruggeven.

    Returns
    -------
    list[dict]
        Lijst van AcoustID resultaten gesorteerd op score (hoogste eerst).
    """
    key = api_key or _API_KEY
    if not key:
        raise RuntimeError(
            "Geen AcoustID API key. Stel ACOUSTID_API_KEY in of geef api_key door."
        )

    params = urllib.parse.urlencode({
        "client":      key,
        "duration":    duration,
        "fingerprint": fp,
        "meta":        meta,
        "format":      "json",
    })
    url = f"{_ACOUSTID_LOOKUP_URL}?{params}"

    data = _rate_limited_request(url)
    if data.get("status") != "ok":
        raise RuntimeError(f"AcoustID API status: {data.get('status', 'onbekend')}")

    results = data.get("results", [])
    results.sort(key=lambda r: r.get("score", 0.0), reverse=True)
    return results


def _normalize(s: str) -> str:
    """Normaliseer string voor vergelijking (lowercase, geen leestekens)."""
    import re
    s = s.lower().strip()
    s = re.sub(r"^the\s+", "", s)
    s = re.sub(r"[^\w\s]", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def _artist_match(
    recordings: list[dict],
    expected_artist: str | None,
) -> tuple[bool, str | None]:
    """
    Controleer of de verwachte artiest in de gevonden opnames voorkomt.

    Returns
    -------
    tuple[bool, str | None]
        (matched, matched_artist_name)
    """
    if not expected_artist:
        return True, None  # Geen verwachting → accepteer altijd

    norm_expected = _normalize(expected_artist)
    for rec in recordings:
        for artist in rec.get("artists", []):
            name = artist.get("name", "")
            if _normalize(name) == norm_expected:
                return True, name
            # Gedeeltelijke match: verwachte naam zit in gevonden naam of vice versa
            if norm_expected in _normalize(name) or _normalize(name) in norm_expected:
                return True, name
    return False, None


def verify(
    filepath: str,
    expected_artist: str | None = None,
    expected_title:  str | None = None,
    api_key: str | None         = None,
    min_score: float            = 0.5,
) -> AcoustIDResult:
    """
    Verifieer een audiobestand via AcoustID.

    Fail-open: als verificatie niet mogelijk is (geen API key, API down,
    fpcalc niet beschikbaar), geeft deze functie altijd een AcoustIDResult
    terug met verified=False en een error string — de pipeline wordt NOOIT
    geblokkeerd.

    Parameters
    ----------
    filepath : str
        Pad naar het audiobestand.
    expected_artist : str, optional
        Verwachte artiestnaam voor extra verificatie.
    expected_title : str, optional
        Verwachte tracktitel (momenteel informatief).
    api_key : str, optional
        AcoustID API key.
    min_score : float
        Minimale AcoustID-score om een match te accepteren (standaard 0.5).

    Returns
    -------
    AcoustIDResult
        Altijd een geldig object — nooit een exception.
    """
    result = AcoustIDResult()

    # ── Stap 1: Fingerprint ────────────────────────────────────────────────
    try:
        duration, fp = fingerprint(filepath)
        result.duration    = duration
        result.fingerprint = fp
        log.debug("fpcalc: %ds, fingerprint %s…", duration, fp[:20])
    except Exception as exc:
        result.error = f"fpcalc fout: {exc}"
        log.warning("AcoustID fingerprinting mislukt (fail-open): %s", exc)
        return result

    # ── Stap 2: API lookup ─────────────────────────────────────────────────
    try:
        matches = lookup(duration, fp, api_key=api_key)
    except Exception as exc:
        result.error = f"AcoustID API fout: {exc}"
        log.warning("AcoustID API lookup mislukt (fail-open): %s", exc)
        return result

    if not matches:
        result.mismatch_reason = "Geen AcoustID resultaten gevonden"
        log.info("AcoustID: geen resultaten voor '%s'", filepath)
        return result

    result.score = matches[0].get("score", 0.0)
    result.matched_recordings = [
        rec
        for match in matches
        for rec in match.get("recordings", [])
    ]

    # ── Stap 3: Confidence scoring ─────────────────────────────────────────
    if result.score < min_score:
        result.mismatch_reason = (
            f"Score te laag: {result.score:.2f} < drempel {min_score}"
        )
        log.warning(
            "AcoustID mismatch '%s': score %.2f < %.2f",
            filepath, result.score, min_score,
        )
        return result

    if result.score >= 0.8:
        confidence_label = "verified"
    elif result.score >= 0.5:
        confidence_label = "probable"
        log.info(
            "AcoustID probable match voor '%s': score %.2f",
            filepath, result.score,
        )
    else:
        confidence_label = "low"

    # ── Stap 4: Artiest-verificatie ────────────────────────────────────────
    if expected_artist and result.matched_recordings:
        artist_ok, matched_name = _artist_match(
            result.matched_recordings, expected_artist
        )
        if not artist_ok and confidence_label == "low":
            result.mismatch_reason = (
                f"Artiest '{expected_artist}' niet gevonden in AcoustID resultaten"
            )
            log.warning(
                "AcoustID artiest mismatch voor '%s': verwacht '%s'",
                filepath, expected_artist,
            )
            return result

    # ── Stap 5: Beste recording kiezen ────────────────────────────────────
    if result.matched_recordings:
        result.best_recording = result.matched_recordings[0]

    result.verified = result.score >= 0.8
    log.info(
        "AcoustID '%s': score=%.2f, verified=%s, confidence=%s",
        os.path.basename(filepath),
        result.score,
        result.verified,
        confidence_label,
    )
    return result
