"""
builder.py — DiscoveryBuilder: orchestreert alle discovery secties.

Beheert:
  - Per-sectie TTLs (zelfde waarden als discover.js)
  - Achtergrond-builds via threading.Thread (één actieve build per sectie)
  - Schrijven naar discover_sections in SQLite via set_discover_section()
  - Publieke API: get_all(), refresh(), status()

Wordt aangeroepen vanuit core/app.py:
  - Bij startup: DiscoveryBuilder.init() (15 seconden vertraging)
  - Via GET  /api/core/discover → get_all()
  - Via POST /api/core/discover/refresh → refresh()
"""

import logging
import threading
import time
from typing import Any, Optional

import core.database as db
import core.plex_client as plex

from core.discovery import (
    deep_cuts,
    from_labels,
    hidden_gems,
    new_in_genres,
    similar,
    undiscovered,
)

log = logging.getLogger(__name__)

# ── TTLs in milliseconden (identiek aan services/discover.js) ──────────────────
_TTL: dict[str, int] = {
    "similar":      86_400_000,
    "undiscovered": 86_400_000,
    "new_in_genres": 12 * 3_600_000,
    "from_labels":  86_400_000,
    "deep_cuts":    86_400_000,
    "hidden_gems":  86_400_000,
}

# Section-naam → build-functie
_BUILDERS: dict[str, Any] = {
    "similar":       similar.build,
    "undiscovered":  undiscovered.build,
    "new_in_genres": new_in_genres.build,
    "from_labels":   from_labels.build,
    "deep_cuts":     deep_cuts.build,
    "hidden_gems":   hidden_gems.build,
}

# Één actieve Thread per sectie
_builds: dict[str, Optional[threading.Thread]] = {k: None for k in _BUILDERS}
_builds_lock = threading.Lock()


def _section_age_ms(section: str) -> float:
    """
    Geeft de leeftijd (in ms) van een discover-sectie terug.
    Infinity als de sectie niet bestaat of verlopen is.
    Lees rechtstreeks uit SQLite, inclusief verlopen entries.
    """
    with db.get_db() as conn:
        row = conn.execute(
            "SELECT built_at FROM discover_sections WHERE section = ?",
            (section,),
        ).fetchone()
    if row is None:
        return float("inf")
    now_ms = int(time.time() * 1000)
    return now_ms - row["built_at"]


def _trigger_build(section: str) -> None:
    """Start een achtergrond-build voor een sectie als er geen actieve build is."""
    with _builds_lock:
        if _builds.get(section) and _builds[section].is_alive():
            return

        def _run():
            try:
                log.info("Discovery: start build '%s'", section)
                result = _BUILDERS[section]()
                db.set_discover_section(section, result, _TTL[section])
                log.info("Discovery: sectie '%s' opgeslagen", section)
            except Exception as exc:
                log.error("Discovery: build '%s' mislukt: %s", section, exc, exc_info=True)
            finally:
                with _builds_lock:
                    _builds[section] = None

        t = threading.Thread(target=_run, name=f"discovery-{section}", daemon=True)
        _builds[section] = t
        t.start()


def _check_and_trigger(section: str) -> None:
    """Triggert een rebuild als de sectie verlopen is."""
    if _section_age_ms(section) > _TTL[section]:
        _trigger_build(section)


# ── Publieke API ───────────────────────────────────────────────────────────────

def get_all() -> dict[str, Any]:
    """
    Retourneert alle discover-secties instant vanuit de cache.
    Verlopen secties worden in de achtergrond herbouwd.

    Identiek aan getDiscover() in services/discover.js.
    """
    for section in _BUILDERS:
        _check_and_trigger(section)

    similar_data      = db.get_discover_section("similar")
    undiscovered_data = db.get_discover_section("undiscovered")
    new_genres_data   = db.get_discover_section("new_in_genres")
    from_labels_data  = db.get_discover_section("from_labels")
    deep_cuts_data    = db.get_discover_section("deep_cuts")
    hidden_gems_data  = db.get_discover_section("hidden_gems")

    if not any([
        similar_data, undiscovered_data, new_genres_data,
        from_labels_data, deep_cuts_data, hidden_gems_data,
    ]):
        return {
            "status":  "building",
            "message": "Muziekontdekkingen worden geanalyseerd (ca. 30 sec)...",
        }

    building = {}
    with _builds_lock:
        for s in _BUILDERS:
            building[s] = bool(_builds.get(s) and _builds[s].is_alive())

    return {
        "status": "ok",
        # Backward compat: frontend verwacht 'artists' als alias voor similar
        "artists":              (similar_data or {}).get("artists", []),
        "similar_artists":      (similar_data or {}).get("artists", []),
        "undiscovered_albums":  (undiscovered_data or {}).get("albums", []),
        "new_in_genres":        (new_genres_data or {}).get("releases", []),
        "from_your_labels":     (from_labels_data or {}).get("releases", []),
        "deep_cuts":            (deep_cuts_data or {}).get("artists", []),
        "hidden_gems":          (hidden_gems_data or {}).get("artists", []),
        "based_on":             (similar_data or {}).get("based_on", []),
        "building":             building,
        "plex_connected":       plex.status()["ok"],
    }


def get_gaps() -> dict[str, Any]:
    """
    Retourneert de undiscovered albums als 'gaps' data.
    Leest uit de discover_sections cache.
    """
    _check_and_trigger("undiscovered")
    data = db.get_discover_section("undiscovered")
    if not data:
        return {"status": "building", "message": "Collectiegaten worden gezocht..."}
    building = bool(_builds.get("undiscovered") and _builds["undiscovered"].is_alive())
    return {
        "status":   "ok",
        "albums":   data.get("albums", []),
        "building": building,
    }


def get_releases() -> dict[str, Any]:
    """
    Retourneert nieuwe releases (new_in_genres + from_labels gecombineerd).
    Leest uit de discover_sections cache.
    """
    for s in ("new_in_genres", "from_labels"):
        _check_and_trigger(s)

    new_genres_data  = db.get_discover_section("new_in_genres")
    from_labels_data = db.get_discover_section("from_labels")

    if not new_genres_data and not from_labels_data:
        return {"status": "building", "message": "Recente releases worden opgehaald..."}

    # Combineer en dedupliceer op mbid
    all_releases: list[dict] = []
    seen: set[str] = set()
    for r in (new_genres_data or {}).get("releases", []):
        if r.get("mbid") and r["mbid"] not in seen:
            seen.add(r["mbid"])
            all_releases.append({**r, "source": "genre"})
    for r in (from_labels_data or {}).get("releases", []):
        if r.get("mbid") and r["mbid"] not in seen:
            seen.add(r["mbid"])
            all_releases.append({**r, "source": "label"})

    all_releases.sort(key=lambda r: r.get("release_date") or "", reverse=True)

    with _builds_lock:
        building = {
            "new_in_genres": bool(_builds.get("new_in_genres") and _builds["new_in_genres"].is_alive()),
            "from_labels":   bool(_builds.get("from_labels") and _builds["from_labels"].is_alive()),
        }

    return {
        "status":   "ok",
        "releases": all_releases,
        "genres":   (new_genres_data or {}).get("genres", []),
        "labels":   (from_labels_data or {}).get("labels", []),
        "building": building,
    }


def refresh() -> dict[str, Any]:
    """Forceer een volledige rebuild van alle secties."""
    for section in _BUILDERS:
        _trigger_build(section)
    return {"ok": True, "building": True}


def section_status() -> dict[str, dict]:
    """Geeft per sectie aan of er gecachede data is en of er een build loopt."""
    result = {}
    with _builds_lock:
        for section in _BUILDERS:
            result[section] = {
                "ready":   _section_age_ms(section) < float("inf"),
                "building": bool(_builds.get(section) and _builds[section].is_alive()),
            }
    return result


def init(delay_seconds: float = 15.0) -> None:
    """
    Start achtergrond-builds bij opstarten na een vertraging.
    Geeft Plex client de kans om eerst te synchroniseren.

    Identiek aan initDiscover() + initGaps() + initReleases() in de Node.js services.
    """
    def _delayed_start():
        time.sleep(delay_seconds)
        log.info("Discovery: achtergrond-builds starten na %.0fs vertraging", delay_seconds)
        for section in _BUILDERS:
            _check_and_trigger(section)

    t = threading.Thread(target=_delayed_start, name="discovery-init", daemon=True)
    t.start()
