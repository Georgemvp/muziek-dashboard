// ── SQLite persistente cache ────────────────────────────────────────────────
const Database = require('better-sqlite3');
const path     = require('path');
const fs       = require('fs');
const logger   = require('./logger');

const dataDir = process.env.DATA_DIR || '/data';
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  logger.info({ dataDir }, 'Data directory created');
}

let db;
try {
  const dbPath = path.join(dataDir, 'cache.db');
  db = new Database(dbPath);
  logger.info({ dbPath }, 'SQLite database connected');
} catch (err) {
  logger.fatal({ err }, 'Failed to initialize database');
  process.exit(1);
}

// Initialize cache table
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS cache (
      key        TEXT PRIMARY KEY,
      data       TEXT    NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);
  // Index helpt bij prune-queries (DELETE/ORDER BY updated_at)
  db.exec('CREATE INDEX IF NOT EXISTS idx_cache_updated_at ON cache(updated_at)');
  logger.debug('Cache tables and indices initialized');
} catch (err) {
  logger.error({ err }, 'Error initializing cache tables');
  throw err;
}

// Cache-prune configuratie: voorkomt onbegrensde groei van de cache-tabel.
const CACHE_MAX_ROWS = Number(process.env.CACHE_MAX_ROWS || 2000);
const CACHE_MAX_AGE_MS = Number(process.env.CACHE_MAX_AGE_MS || (14 * 24 * 60 * 60 * 1000));

let _cacheWriteCount = 0;
const CACHE_PRUNE_EVERY_WRITES = 100;

/**
 * Houd cache performant door oude records en overtollige rows op te ruimen.
 * @param {object} [opts]
 * @param {number} [opts.maxRows] - Max aantal rows om te bewaren.
 * @param {number} [opts.maxAgeMs] - Max ouderdom in ms (Infinity = niet op leeftijd schonen).
 */
function pruneCache({ maxRows = CACHE_MAX_ROWS, maxAgeMs = CACHE_MAX_AGE_MS } = {}) {
  try {
    let deletedCount = 0;

    if (Number.isFinite(maxAgeMs) && maxAgeMs > 0) {
      const cutoff = Date.now() - maxAgeMs;
      const info = _stmtPruneOldCache.run(cutoff);
      deletedCount += info.changes;
      logger.debug({ cutoff, deleted: info.changes }, 'Pruned old cache entries');
    }

    if (Number.isFinite(maxRows) && maxRows > 0) {
      // Verwijder oudste items boven het maximum.
      const info = _stmtPruneExcessCache.run(maxRows);
      deletedCount += info.changes;
      if (info.changes > 0) {
        logger.debug({ maxRows, deleted: info.changes }, 'Pruned excess cache entries');
      }
    }

    return deletedCount;
  } catch (err) {
    logger.error({ err, maxRows, maxAgeMs }, 'Error during cache pruning');
    throw err;
  }
}

// Initialize wishlist table
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS wishlist (
      id       INTEGER PRIMARY KEY AUTOINCREMENT,
      type     TEXT    NOT NULL,
      name     TEXT    NOT NULL,
      artist   TEXT,
      image    TEXT,
      added_at INTEGER NOT NULL,
      UNIQUE(type, name)
    )
  `);
  logger.debug('Wishlist table initialized');
} catch (err) {
  logger.error({ err }, 'Error initializing wishlist table');
  throw err;
}

/** Haal een gecachede waarde op. Geeft null terug als niet aanwezig of verlopen. */
function getCache(key, maxAgeMs = Infinity) {
  try {
    const row = _stmtGetCache.get(key);
    if (!row) {
      logger.trace({ key }, 'Cache miss');
      return null;
    }
    if (maxAgeMs !== Infinity && Date.now() - row.updated_at > maxAgeMs) {
      logger.trace({ key, ageMs: Date.now() - row.updated_at, maxAgeMs }, 'Cache expired');
      return null;
    }
    try {
      const result = JSON.parse(row.data);
      logger.trace({ key, ageMs: Date.now() - row.updated_at }, 'Cache hit');
      return result;
    } catch (parseErr) {
      logger.warn({ key, err: parseErr }, 'Cache data corruption detected');
      return null;
    }
  } catch (err) {
    logger.error({ key, err }, 'Error reading from cache');
    return null;
  }
}

/** Sla een waarde op in de cache met de huidige timestamp. */
function setCache(key, data) {
  try {
    const dataStr = JSON.stringify(data);
    const now = Date.now();
    _stmtSetCache.run(key, dataStr, now);

    logger.trace({ key, size: dataStr.length }, 'Cache written');

    _cacheWriteCount++;
    if (_cacheWriteCount >= CACHE_PRUNE_EVERY_WRITES) {
      _cacheWriteCount = 0;
      pruneCache();
    }
  } catch (err) {
    logger.error({ key, err }, 'Error writing to cache');
    throw err;
  }
}

/** Verwijder een cache-entry. */
function clearCache(key) {
  try {
    const info = _stmtClearCache.run(key);
    logger.trace({ key, deleted: info.changes > 0 }, 'Cache entry cleared');
  } catch (err) {
    logger.error({ key, err }, 'Error clearing cache entry');
    throw err;
  }
}

/** Geeft de leeftijd in ms van een cache-entry terug (Infinity als niet aanwezig). */
function getCacheAge(key) {
  try {
    const row = _stmtGetCacheAge.get(key);
    const age = row ? Date.now() - row.updated_at : Infinity;
    logger.trace({ key, ageMs: age === Infinity ? 'not-found' : age }, 'Cache age checked');
    return age;
  } catch (err) {
    logger.error({ key, err }, 'Error getting cache age');
    return Infinity;
  }
}

/** Geeft alle verlanglijst-items terug, nieuwste eerst. */
function getWishlist() {
  try {
    const items = _stmtGetWishlist.all();
    logger.trace({ count: items.length }, 'Wishlist retrieved');
    return items;
  } catch (err) {
    logger.error({ err }, 'Error retrieving wishlist');
    return [];
  }
}

/** Voeg een item toe aan de verlanglijst. Geeft het id terug (ook als het al bestond). */
function addToWishlist(type, name, artist, image) {
  try {
    const res = _stmtAddToWishlist.run(type, name, artist || null, image || null, Date.now());

    let id;
    if (res.changes === 0) {
      id = _stmtGetWishlistId.get(type, name).id;
      logger.trace({ type, name, id, status: 'duplicate' }, 'Wishlist item already exists');
    } else {
      id = res.lastInsertRowid;
      logger.info({ type, name, artist, id }, 'Item added to wishlist');
    }
    return id;
  } catch (err) {
    logger.error({ type, name, artist, err }, 'Error adding to wishlist');
    throw err;
  }
}

/** Verwijder een verlanglijst-item op id. */
function removeFromWishlist(id) {
  try {
    const info = _stmtRemoveFromWishlist.run(id);
    if (info.changes > 0) {
      logger.info({ id }, 'Item removed from wishlist');
    } else {
      logger.warn({ id }, 'Wishlist item not found for deletion');
    }
  } catch (err) {
    logger.error({ id, err }, 'Error removing from wishlist');
    throw err;
  }
}

/** Geeft het id terug als het item in de verlanglijst staat, anders null. */
function isInWishlist(type, name) {
  try {
    const row = _stmtIsInWishlist.get(type, name);
    return row ? row.id : null;
  } catch (err) {
    logger.error({ type, name, err }, 'Error checking wishlist');
    return null;
  }
}

// ── Downloads (persistente download-geschiedenis) ──────────────────────────
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS downloads (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      tidal_id   TEXT,
      artist     TEXT NOT NULL,
      title      TEXT NOT NULL,
      url        TEXT,
      quality    TEXT,
      queued_at  INTEGER NOT NULL
    )
  `);
  // Index voor snelle opzoekacties op artiest+titel
  db.exec('CREATE INDEX IF NOT EXISTS idx_dl_artist_title ON downloads(artist, title)');
  logger.debug('Downloads table initialized');
} catch (err) {
  logger.error({ err }, 'Error initializing downloads table');
  throw err;
}

// ── Module-scope prepared statements (voor performance) ──────────────────────
// Cache statements
const _stmtGetCache = db.prepare('SELECT data, updated_at FROM cache WHERE key = ?');
const _stmtSetCache = db.prepare('INSERT OR REPLACE INTO cache (key, data, updated_at) VALUES (?, ?, ?)');
const _stmtClearCache = db.prepare('DELETE FROM cache WHERE key = ?');
const _stmtGetCacheAge = db.prepare('SELECT updated_at FROM cache WHERE key = ?');
const _stmtPruneOldCache = db.prepare('DELETE FROM cache WHERE updated_at < ?');
const _stmtPruneExcessCache = db.prepare(`
  DELETE FROM cache
  WHERE key IN (
    SELECT key
    FROM cache
    ORDER BY updated_at DESC
    LIMIT -1 OFFSET ?
  )
`);

// Wishlist statements
const _stmtGetWishlist = db.prepare('SELECT * FROM wishlist ORDER BY added_at DESC');
const _stmtAddToWishlist = db.prepare(
  'INSERT OR IGNORE INTO wishlist (type, name, artist, image, added_at) VALUES (?, ?, ?, ?, ?)'
);
const _stmtGetWishlistId = db.prepare('SELECT id FROM wishlist WHERE type = ? AND name = ?');
const _stmtRemoveFromWishlist = db.prepare('DELETE FROM wishlist WHERE id = ?');
const _stmtIsInWishlist = db.prepare('SELECT id FROM wishlist WHERE type = ? AND name = ?');

// Downloads statements
const _stmtAddDownload = db.prepare(
  'INSERT INTO downloads (tidal_id, artist, title, url, quality, queued_at) VALUES (?, ?, ?, ?, ?, ?)'
);
const _stmtGetDownloads = db.prepare('SELECT * FROM downloads ORDER BY queued_at DESC');
const _stmtGetDownloadKeys = db.prepare('SELECT artist, title FROM downloads');
const _stmtRemoveDownload = db.prepare('DELETE FROM downloads WHERE id = ?');

/** Sla een gedownload album op in de geschiedenis. */
function addDownload({ tidal_id, artist, title, url, quality }) {
  try {
    _stmtAddDownload.run(tidal_id || null, artist || '', title || '', url || null, quality || null, Date.now());

    logger.info({ artist, title, quality, tidal_id }, 'Download added to history');
  } catch (err) {
    logger.error({ artist, title, err }, 'Error adding download to history');
    throw err;
  }
}

/** Geeft alle downloads terug, nieuwste eerst. */
function getDownloads() {
  try {
    const downloads = _stmtGetDownloads.all();
    logger.trace({ count: downloads.length }, 'Downloads retrieved');
    return downloads;
  } catch (err) {
    logger.error({ err }, 'Error retrieving downloads');
    return [];
  }
}

/** Geeft een Set van genormaliseerde "artist|title" sleutels van alle downloads. */
function getDownloadKeys() {
  try {
    const rows = _stmtGetDownloadKeys.all();
    const keys = new Set(rows.map(r => normalizeKey(r.artist, r.title)));
    logger.trace({ keyCount: keys.size }, 'Download keys retrieved');
    return keys;
  } catch (err) {
    logger.error({ err }, 'Error getting download keys');
    return new Set();
  }
}

/** Verwijder een download-record op id. */
function removeDownload(id) {
  try {
    const info = _stmtRemoveDownload.run(id);
    if (info.changes > 0) {
      logger.info({ id }, 'Download record removed');
    } else {
      logger.warn({ id }, 'Download record not found for deletion');
    }
  } catch (err) {
    logger.error({ id, err }, 'Error removing download record');
    throw err;
  }
}

/** Normaliseer artiest+titel tot een opzoeksleutel (ook gebruikt door de frontend). */
function normalizeKey(artist, title) {
  const n = s => (s || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
  return `${n(artist)}|${n(title)}`;
}

// Eenmalige startup-prune
try {
  const deleted = pruneCache();
  logger.info({ deletedTotal: deleted }, 'Initial cache pruning completed');
} catch (err) {
  logger.warn({ err }, 'Initial cache pruning failed, continuing anyway');
}

module.exports = {
  getCache, setCache, clearCache, getCacheAge, pruneCache,
  getWishlist, addToWishlist, removeFromWishlist, isInWishlist,
  addDownload, getDownloads, getDownloadKeys, removeDownload, normalizeKey
};
