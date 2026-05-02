"""
database.py — SQLite verbinding voor de Core Flask backend.

Deelt /data/cache.db met de Node.js lastfm-app.  WAL-mode en busy_timeout
zorgen dat gelijktijdige schrijvers elkaar niet blokkeren.

Tabellen (zelfde schema als db.js):
  cache              – generieke key/value cache (TTL in ms)
  discover_sections  – vooraf gebouwde discover-pagina-blokken
  enrichment_data    – verrijkte metadata per entiteit + bron
  enrichment_queue   – wachtrij voor enrichment workers
  genre_whitelist    – toegestane genres voor filtering
  settings           – algemene instellingen (categorie + sleutel)
"""

import json
import sqlite3
import time
import threading
from contextlib import contextmanager
from typing import Any, Optional

from core.config import DB_PATH, CACHE_MAX_ROWS, CACHE_MAX_AGE_MS

# ── Thread-local verbindingen ──────────────────────────────────────────────────
# SQLite-verbindingen zijn NIET thread-safe; elke thread krijgt zijn eigen
# verbinding via threading.local() zodat Gunicorn workers geen conflict hebben.
_local = threading.local()


def _get_connection() -> sqlite3.Connection:
    """Geeft de thread-lokale SQLite-verbinding terug (maakt hem aan indien nodig)."""
    if not hasattr(_local, "conn") or _local.conn is None:
        conn = sqlite3.connect(DB_PATH, check_same_thread=False)
        conn.row_factory = sqlite3.Row

        # WAL-mode: readers blokkeren writers niet, zelfde instelling als db.js
        conn.execute("PRAGMA journal_mode=WAL")
        # Wacht maximaal 5 seconden op een lock (db.js gebruikt ook 5000 ms)
        conn.execute("PRAGMA busy_timeout=5000")
        # Beter leesbaarheid bij gelijktijdige reads
        conn.execute("PRAGMA synchronous=NORMAL")

        _local.conn = conn

    return _local.conn


@contextmanager
def get_db():
    """Context-manager die een SQLite-verbinding levert en fouten logt."""
    conn = _get_connection()
    try:
        yield conn
    except sqlite3.Error:
        raise


def list_tables() -> list[str]:
    """Geeft alle tabelnamen in de database terug."""
    with get_db() as conn:
        rows = conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
        ).fetchall()
        return [row["name"] for row in rows]


# ── Cache ──────────────────────────────────────────────────────────────────────
# Schema (db.js):
#   cache(key TEXT PK, data TEXT NOT NULL, updated_at INTEGER NOT NULL)

def get_cache(key: str, max_age_ms: float = float("inf")) -> Optional[Any]:
    """
    Haal een gecachede waarde op.

    Parameters
    ----------
    key        : cache-sleutel
    max_age_ms : maximale leeftijd in milliseconden (Infinity = geen limiet)

    Returns
    -------
    De gedeserialiseerde waarde, of None als niet gevonden / verlopen.
    """
    with get_db() as conn:
        row = conn.execute(
            "SELECT data, updated_at FROM cache WHERE key = ?", (key,)
        ).fetchone()

        if row is None:
            return None

        if max_age_ms != float("inf"):
            age_ms = int(time.time() * 1000) - row["updated_at"]
            if age_ms > max_age_ms:
                return None

        try:
            return json.loads(row["data"])
        except (json.JSONDecodeError, TypeError):
            return None


def set_cache(key: str, data: Any) -> None:
    """
    Sla een waarde op in de cache met de huidige timestamp.

    Identiek gedrag als db.js: INSERT OR REPLACE zodat duplicaten worden
    overschreven.  Pruning wordt hier bewust weggelaten — de Node.js app
    beheert de pruning-cyclus om dubbele prune-runs te vermijden.
    """
    now_ms = int(time.time() * 1000)
    data_str = json.dumps(data, ensure_ascii=False)

    with get_db() as conn:
        conn.execute(
            "INSERT OR REPLACE INTO cache (key, data, updated_at) VALUES (?, ?, ?)",
            (key, data_str, now_ms),
        )
        conn.commit()


# ── Enrichment data ────────────────────────────────────────────────────────────
# Schema (db.js):
#   enrichment_data(
#     id INTEGER PK AUTOINCREMENT,
#     entity_type TEXT NOT NULL,
#     entity_name TEXT NOT NULL,
#     source      TEXT NOT NULL,
#     data_json   TEXT NOT NULL,
#     created_at  INTEGER DEFAULT (strftime('%s','now')),
#     updated_at  INTEGER,
#     UNIQUE(entity_type, entity_name, source)
#   )

def get_enrichment_data(entity_type: str, entity_name: str) -> dict[str, Any]:
    """
    Haal alle enrichment-data op voor een entiteit, gegroepeerd per bron.

    Returns
    -------
    Dict van { source: data } of een leeg dict als er niets is.
    """
    with get_db() as conn:
        rows = conn.execute(
            "SELECT source, data_json FROM enrichment_data "
            "WHERE entity_type = ? AND entity_name = ?",
            (entity_type, entity_name),
        ).fetchall()

        result: dict[str, Any] = {}
        for row in rows:
            try:
                result[row["source"]] = json.loads(row["data_json"])
            except (json.JSONDecodeError, TypeError):
                pass
        return result


def save_enrichment_data(
    entity_type: str, entity_name: str, source: str, data: Any
) -> None:
    """
    Sla enrichment-data op voor een entiteit+bron.

    Gebruikt INSERT … ON CONFLICT DO UPDATE zodat het gedrag exact overeenkomt
    met de Node.js implementatie in db.js (_stmtSaveEnrichmentData).
    """
    now_epoch = int(time.time())
    data_str = json.dumps(data, ensure_ascii=False)

    with get_db() as conn:
        conn.execute(
            """
            INSERT INTO enrichment_data
                (entity_type, entity_name, source, data_json, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(entity_type, entity_name, source)
            DO UPDATE SET data_json = excluded.data_json,
                          updated_at = excluded.updated_at
            """,
            (entity_type, entity_name, source, data_str, now_epoch, now_epoch),
        )
        conn.commit()


# ── Discover sections ──────────────────────────────────────────────────────────
# Schema (db.js):
#   discover_sections(
#     section    TEXT PK,
#     data_json  TEXT NOT NULL,
#     built_at   INTEGER NOT NULL,
#     expires_at INTEGER NOT NULL
#   )

def get_discover_section(section: str) -> Optional[Any]:
    """
    Haal een discover-sectie op.

    Returns None als de sectie niet bestaat of verlopen is (expires_at < now).
    Identiek gedrag als getDiscoverSection() in db.js.
    """
    with get_db() as conn:
        row = conn.execute(
            "SELECT data_json, built_at, expires_at "
            "FROM discover_sections WHERE section = ?",
            (section,),
        ).fetchone()

        if row is None:
            return None

        now_ms = int(time.time() * 1000)
        if now_ms > row["expires_at"]:
            return None

        try:
            return json.loads(row["data_json"])
        except (json.JSONDecodeError, TypeError):
            return None


def set_discover_section(section: str, data: Any, ttl_ms: int) -> None:
    """
    Sla een discover-sectie op met een TTL in milliseconden.

    Identiek gedrag als setDiscoverSection() in db.js.
    """
    now_ms = int(time.time() * 1000)
    data_str = json.dumps(data, ensure_ascii=False)

    with get_db() as conn:
        conn.execute(
            "INSERT OR REPLACE INTO discover_sections "
            "(section, data_json, built_at, expires_at) VALUES (?, ?, ?, ?)",
            (section, data_str, now_ms, now_ms + ttl_ms),
        )
        conn.commit()


# ── Enrichment queue ───────────────────────────────────────────────────────────
# Schema (db.js):
#   enrichment_queue(
#     id            INTEGER PK AUTOINCREMENT,
#     entity_type   TEXT NOT NULL,
#     entity_name   TEXT NOT NULL,
#     entity_id     TEXT,
#     source        TEXT NOT NULL,
#     status        TEXT DEFAULT 'pending',
#     attempts      INTEGER DEFAULT 0,
#     last_attempt  INTEGER,
#     error_message TEXT,
#     created_at    INTEGER DEFAULT (strftime('%s','now'))
#   )

def enqueue_enrichment(
    entity_type: str,
    entity_name: str,
    source: str,
    entity_id: Optional[str] = None,
) -> bool:
    """
    Voeg een item toe aan de enrichment queue (INSERT OR IGNORE).

    Returns True als het item nieuw was, False als het al bestond.
    Identiek aan enqueueEnrichment() in db.js.
    """
    with get_db() as conn:
        cursor = conn.execute(
            """
            INSERT OR IGNORE INTO enrichment_queue
                (entity_type, entity_name, entity_id, source, status)
            VALUES (?, ?, ?, ?, 'pending')
            """,
            (entity_type, entity_name, entity_id, source),
        )
        conn.commit()
        return cursor.rowcount > 0


def get_pending_enrichment_items(source: str, limit: int = 10) -> list[dict]:
    """
    Haal pending items op voor een bron, gesorteerd op created_at.

    Identiek aan getPendingEnrichmentItems() in db.js.
    """
    with get_db() as conn:
        rows = conn.execute(
            """
            SELECT * FROM enrichment_queue
            WHERE source = ? AND status = 'pending'
            ORDER BY created_at ASC
            LIMIT ?
            """,
            (source, limit),
        ).fetchall()
        return [dict(row) for row in rows]


def update_enrichment_item(
    item_id: int,
    status: str,
    error_message: Optional[str] = None,
) -> None:
    """
    Update status (en optioneel foutmelding + pogingen) van een queue-item.

    Identiek aan updateEnrichmentItem() in db.js.
    """
    now_epoch = int(time.time())
    with get_db() as conn:
        conn.execute(
            """
            UPDATE enrichment_queue
            SET status        = ?,
                error_message = ?,
                attempts      = attempts + 1,
                last_attempt  = ?
            WHERE id = ?
            """,
            (status, error_message, now_epoch, item_id),
        )
        conn.commit()


def reset_stuck_enrichment_items(source: str) -> None:
    """
    Zet 'processing' items terug naar 'pending' bij opstart.

    Identiek aan resetStuckEnrichmentItems() in db.js.
    """
    with get_db() as conn:
        conn.execute(
            "UPDATE enrichment_queue SET status='pending' WHERE source=? AND status='processing'",
            (source,),
        )
        conn.commit()


def get_enrichment_queue_stats() -> dict[str, dict[str, int]]:
    """
    Geef per-source statistieken van de queue terug.

    Returns { source: { pending, processing, done, error, skipped } }
    Identiek aan getEnrichmentQueueStats() in db.js.
    """
    with get_db() as conn:
        rows = conn.execute(
            """
            SELECT source, status, COUNT(*) as cnt
            FROM enrichment_queue
            GROUP BY source, status
            """
        ).fetchall()

    result: dict[str, dict[str, int]] = {}
    for row in rows:
        src = row["source"]
        if src not in result:
            result[src] = {"pending": 0, "processing": 0, "done": 0, "error": 0, "skipped": 0}
        result[src][row["status"]] = row["cnt"]
    return result


# ── Genre whitelist ────────────────────────────────────────────────────────────

def get_genre_whitelist() -> list[dict]:
    """
    Haal alle genres op uit de whitelist.

    Returns list van { genre: str, enabled: bool }
    Identiek aan getGenreWhitelist() in db.js.
    """
    with get_db() as conn:
        rows = conn.execute(
            "SELECT genre, enabled FROM genre_whitelist ORDER BY genre"
        ).fetchall()
        return [{"genre": row["genre"], "enabled": bool(row["enabled"])} for row in rows]


# ── Settings ───────────────────────────────────────────────────────────────────

def get_setting(category: str, key: str) -> Optional[Any]:
    """
    Lees één instelling uit de settings tabel.

    Returns de waarde (gedeserialiseerd als JSON), of None als niet gevonden.
    Identiek aan getSetting() in db.js.
    """
    with get_db() as conn:
        row = conn.execute(
            "SELECT value FROM settings WHERE category=? AND key=?",
            (category, key),
        ).fetchone()
        if row is None:
            return None
        try:
            return json.loads(row["value"])
        except (json.JSONDecodeError, TypeError):
            return row["value"]
