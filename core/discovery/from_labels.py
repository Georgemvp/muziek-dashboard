"""
from_labels.py — Sectie: recente releases van jouw labels.

Logica gelijk aan buildFromYourLabels() in services/discover.js:
  1. Bepaal top-10 meest voorkomende labels uit Discogs enrichment_data.
  2. Zoek via MusicBrainz Search API releases van de afgelopen 365 dagen.
  3. Artiesten die je nog NIET hebt krijgen voorrang.
"""

import logging
from typing import Any

import core.database as db
import core.musicbrainz_client as mbz
import core.plex_client as plex

log = logging.getLogger(__name__)

_CUTOFF_DAYS = 365


def build() -> dict[str, Any]:
    """
    Bouw de 'from your labels' sectie.
    Returns het resultaat-dict dat door builder.py wordt opgeslagen.
    """
    log.info("FromLabels: bouwen")

    # ── Top-10 labels bepalen uit Discogs enrichment ───────────────────────────
    artist_names = plex.get_artist_names()
    label_freq: dict[str, int] = {}

    for name in artist_names:
        enrich     = db.get_enrichment_data("artist", name)
        label_str  = (enrich.get("discogs") or {}).get("label") or ""
        # Discogs label is opgeslagen als komma-gescheiden string (zie deezer.js)
        for label in label_str.split(","):
            label = label.strip()
            if len(label) > 2:
                label_freq[label] = label_freq.get(label, 0) + 1

    top_labels = [
        label for label, _ in sorted(label_freq.items(), key=lambda x: -x[1])
    ][:10]

    if not top_labels:
        log.info("FromLabels: geen labels gevonden — Discogs enrichment ontbreekt?")
        return {"releases": [], "labels": []}

    # ── Releases zoeken per label ──────────────────────────────────────────────
    cutoff = mbz.cutoff_iso(_CUTOFF_DAYS)
    seen: set[str] = set()
    results: list[dict] = []

    for label in top_labels:
        releases = mbz.search_by_label(label=label, cutoff_date=cutoff, limit=10)
        for r in releases:
            if r["mbid"] in seen:
                continue
            seen.add(r["mbid"])
            results.append({
                **r,
                "label":   label,
                "in_plex": plex.artist_in_plex(r["artist"]),
            })

    # Artiesten die je NIET hebt krijgen voorrang (False < True → sorteert eerst)
    results.sort(key=lambda r: int(r["in_plex"]))

    log.info("FromLabels: klaar — %d releases van %d labels", len(results), len(top_labels))
    return {"releases": results, "labels": top_labels}
