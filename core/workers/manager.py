"""
manager.py — EnrichmentManager: poll-loop + concurrency per worker.

Elke worker draait in een eigen daemon-thread (threading, geen multiprocessing).
Polls de enrichment_queue tabel elke 10 seconden per source.
Max 3 pogingen per item (zelfde als Node.js implementatie).
"""
from __future__ import annotations

import logging
import os
import random
import threading
import time

import core.database as db

MAX_ATTEMPTS  = 3
POLL_INTERVAL = 10.0   # seconden
STARTUP_DELAY = 5.0    # basis wachttijd bij opstart (+ willekeurige jitter)

logger = logging.getLogger("enrichment.manager")


class EnrichmentManager:
    """
    Beheert alle enrichment workers als achtergrond-threads.

    Gebruik:
        manager = EnrichmentManager()
        manager.start_all()   # blokkerend — alle threads draaien
    """

    def __init__(self):
        self._workers: dict[str, dict] = {}   # source → {label, worker, enabled, thread, stats}
        self._paused: set[str] = set()
        self._paused_all = False
        self._stop_event = threading.Event()
        self._genre_filter_enabled = False
        self._genre_set: set | None = None  # None = niet geladen
        self._genre_lock = threading.Lock()

    # ── Worker registratie ─────────────────────────────────────────────────────

    def _register(self, source: str, label: str, worker, enabled: bool) -> None:
        """Registreer een worker. Checkt settings-tabel voor override."""
        # Lees eventuele handmatige override uit de DB
        setting_val = db.get_setting("enrichment", f"worker_{source}_enabled")
        if setting_val is not None:
            enabled = bool(setting_val) and setting_val != "false"

        self._workers[source] = {
            "label":   label,
            "worker":  worker,
            "enabled": enabled,
            "thread":  None,
            "stats": {
                "processed":    0,
                "errors":       0,
                "skipped":      0,
                "last_success": None,
                "last_error":   None,
            },
        }

    # ── Worker initialisatie ───────────────────────────────────────────────────

    def _init_workers(self) -> None:
        """Importeer en instantieer alle workers met hun dependencies."""
        from core.workers.audiodb import AudioDBWorker
        from core.workers.deezer import DeezerWorker
        from core.workers.discogs import DiscogsWorker
        from core.workers.genius import GeniusWorker
        from core.workers.itunes import ITunesWorker
        from core.workers.lastfm import LastfmWorker
        from core.workers.musicbrainz import MusicBrainzWorker
        from core.workers.qobuz import QobuzWorker
        from core.workers.spotify import SpotifyWorker
        from core.workers.tidal import TidalWorker

        log = logging.getLogger("enrichment")

        tidarr_url  = os.environ.get("TIDARR_URL", "http://localhost:8484")
        tidarr_key  = os.environ.get("TIDARR_API_KEY")
        orpheus_url = os.environ.get("ORPHEUS_URL", "http://localhost:5000")
        genius_key  = db.get_setting("enrichment", "genius_api_key") or os.environ.get("GENIUS_API_KEY")
        discogs_tok = db.get_setting("enrichment", "discogs_token")  or os.environ.get("DISCOGS_TOKEN")
        discogs_ua  = db.get_setting("enrichment", "discogs_user_agent") or "LastfmMuziekApp/1.0"

        defs = [
            ("itunes",      "iTunes/Apple Music",       ITunesWorker(db, log),                                  True),
            ("discogs",     "Discogs",                   DiscogsWorker(db, log, token=discogs_tok, user_agent=discogs_ua), True),
            ("audiodb",     "TheAudioDB",                AudioDBWorker(db, log),                                True),
            ("genius",      "Genius",                    GeniusWorker(db, log, api_key=genius_key),              bool(genius_key)),
            ("tidal",       "Tidal (via Tidarr)",        TidalWorker(db, log, tidarr_url=tidarr_url, tidarr_api_key=tidarr_key), bool(tidarr_url)),
            ("qobuz",       "Qobuz (via OrpheusDL)",     QobuzWorker(db, log, orpheus_url=orpheus_url),         bool(orpheus_url)),
            ("spotify",     "Spotify",                   SpotifyWorker(db, log),                                bool(os.environ.get("SPOTIFY_CLIENT_ID") and os.environ.get("SPOTIFY_CLIENT_SECRET"))),
            ("musicbrainz", "MusicBrainz",               MusicBrainzWorker(db, log),                            True),
            ("lastfm",      "Last.fm",                   LastfmWorker(db, log),                                 bool(os.environ.get("LASTFM_API_KEY"))),
            ("deezer",      "Deezer",                    DeezerWorker(db, log),                                 True),
        ]

        for source, label, worker, enabled in defs:
            self._register(source, label, worker, enabled)

    # ── Poll loop per worker ───────────────────────────────────────────────────

    def _run_worker(self, source: str) -> None:
        """Thread-entry point voor één worker. Loopt totdat stop() wordt aangeroepen."""
        entry = self._workers[source]
        log   = logging.getLogger(f"enrichment.{source}")

        # Reset eventueel vastgelopen items
        db.reset_stuck_enrichment_items(source)

        # Kleine jitter zodat niet alle workers tegelijk starten
        jitter = STARTUP_DELAY + random.uniform(0, STARTUP_DELAY)
        log.info(f"Worker gestart, eerste poll over {jitter:.1f}s")
        self._stop_event.wait(timeout=jitter)

        while not self._stop_event.is_set():
            if not (self._paused_all or source in self._paused) and entry["enabled"]:
                try:
                    self._process_batch(source)
                except Exception as exc:
                    log.error(f"Worker crash: {exc}", exc_info=True)
                    entry["stats"]["errors"] += 1
                    entry["stats"]["last_error"] = {"err": str(exc), "at": time.time()}

            self._stop_event.wait(timeout=POLL_INTERVAL)

        log.info("Worker gestopt")

    def _process_batch(self, source: str) -> None:
        """Verwerk één batch pending items voor een bron (max 5 per poll)."""
        entry = self._workers[source]
        items = db.get_pending_enrichment_items(source, limit=5)
        if not items:
            return

        log = logging.getLogger(f"enrichment.{source}")

        for item in items:
            attempts = item.get("attempts", 0)

            if attempts >= MAX_ATTEMPTS:
                db.update_enrichment_item(item["id"], "skipped", f"Max pogingen bereikt ({MAX_ATTEMPTS})")
                entry["stats"]["skipped"] += 1
                continue

            # Markeer als bezig
            db.update_enrichment_item(item["id"], "processing", None)

            try:
                result = entry["worker"].process(item)
            except Exception as exc:
                result = {"ok": False, "error": str(exc)}

            if result.get("ok") and result.get("data"):
                data = self._apply_genre_filter(result["data"])
                db.save_enrichment_data(item["entity_type"], item["entity_name"], source, data)
                db.update_enrichment_item(item["id"], "done", None)
                entry["stats"]["processed"] += 1
                entry["stats"]["last_success"] = time.time()
                log.debug(f"Verwerkt: {item['entity_name']} ({item['entity_type']})")
            else:
                err_msg  = result.get("error") or "Unknown error"
                new_att  = attempts + 1
                new_stat = "error" if new_att >= MAX_ATTEMPTS else "pending"
                db.update_enrichment_item(item["id"], new_stat, err_msg)
                entry["stats"]["errors"] += 1
                entry["stats"]["last_error"] = {"err": err_msg, "at": time.time()}
                log.debug(f"Mislukt (poging {new_att}): {item['entity_name']} — {err_msg}")

    # ── Genre filter ───────────────────────────────────────────────────────────

    def _apply_genre_filter(self, data: dict) -> dict:
        """Filter genre-velden via de whitelist (als ingeschakeld)."""
        if not self._genre_filter_enabled:
            return data

        with self._genre_lock:
            if self._genre_set is None:
                rows = db.get_genre_whitelist()
                self._genre_set = {r["genre"].lower() for r in rows if r["enabled"]}

        genre_set = self._genre_set
        def is_valid(g): return (g or "").lower().strip() in genre_set

        filtered = dict(data)
        for field in ("genres", "genre", "style"):
            if isinstance(filtered.get(field), list):
                filtered[field] = [g for g in filtered[field] if is_valid(g)]
        for field in ("primaryGenre",):
            if isinstance(filtered.get(field), str) and not is_valid(filtered[field]):
                filtered[field] = None
        if isinstance(filtered.get("genre"), str) and not is_valid(filtered.get("genre")):
            filtered["genre"] = None

        return filtered

    def refresh_genre_cache(self) -> None:
        """Invalideer de genre-cache zodat hij opnieuw wordt ingeladen."""
        with self._genre_lock:
            self._genre_set = None

    def set_genre_filter_enabled(self, enabled: bool) -> None:
        self._genre_filter_enabled = bool(enabled)
        self.refresh_genre_cache()

    # ── Publieke API ───────────────────────────────────────────────────────────

    def start_all(self, blocking: bool = True) -> None:
        """
        Start alle ingeschakelde workers in daemon-threads.

        Parameters
        ----------
        blocking : als True blokkeert de aanroep totdat stop() wordt aangeroepen
                   (geschikt voor supervisord; False = achtergrond)
        """
        self._init_workers()

        for source, entry in self._workers.items():
            if entry["enabled"]:
                t = threading.Thread(
                    target=self._run_worker,
                    args=(source,),
                    name=f"enrichment-{source}",
                    daemon=True,
                )
                entry["thread"] = t
                t.start()
                logger.info(f"✓ Enrichment worker gestart: {entry['label']}")
            else:
                logger.debug(f"⏸ Enrichment worker uitgeschakeld: {entry['label']}")

        logger.info(f"Enrichment manager geïnitialiseerd ({len(self._workers)} workers)")

        if blocking:
            try:
                while not self._stop_event.is_set():
                    time.sleep(1)
            except KeyboardInterrupt:
                self.stop()

    def stop(self) -> None:
        """Stop alle workers geordend."""
        logger.info("Enrichment manager stopt…")
        self._stop_event.set()

    def pause(self, source: str) -> None:
        self._paused.add(source)
        logger.info(f"Worker gepauzeerd: {source}")

    def resume(self, source: str) -> None:
        self._paused.discard(source)
        logger.info(f"Worker hervat: {source}")

    def pause_all(self) -> None:
        self._paused_all = True

    def resume_all(self) -> None:
        self._paused_all = False

    def queue_artist(self, name: str, entity_id: str | None = None) -> int:
        """Voeg een artiest toe aan de queue voor alle ingeschakelde bronnen."""
        if not name:
            return 0
        added = 0
        for source, entry in self._workers.items():
            if entry["enabled"] and db.enqueue_enrichment("artist", name, source, entity_id):
                added += 1
        return added

    def queue_all(self, plex_artist_names: list[str]) -> dict:
        """Queue alle artiesten uit een lijst (bijv. vanuit Plex)."""
        queued = 0
        for name in plex_artist_names:
            queued += self.queue_artist(name)
        logger.info(f"Alle artiesten toegevoegd aan enrichment queue: {len(plex_artist_names)} artiesten, {queued} items")
        return {"queued": queued, "artists": len(plex_artist_names)}

    def get_status(self) -> dict:
        """Geef per-worker status + queue-stats terug."""
        queue_stats = db.get_enrichment_queue_stats()
        result = {}
        for source, entry in self._workers.items():
            q = queue_stats.get(source, {})
            result[source] = {
                "label":   entry["label"],
                "enabled": entry["enabled"],
                "paused":  self._paused_all or source in self._paused,
                "queue": {
                    "pending":    q.get("pending", 0),
                    "processing": q.get("processing", 0),
                    "done":       q.get("done", 0),
                    "error":      q.get("error", 0),
                    "skipped":    q.get("skipped", 0),
                },
                "stats": entry["stats"],
                "genre_filter_enabled": self._genre_filter_enabled,
            }
        return result
