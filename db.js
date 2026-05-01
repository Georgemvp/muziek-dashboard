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
  const walResult = db.pragma('journal_mode = WAL');
  logger.info({ dbPath, walMode: walResult }, 'SQLite database connected');
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

/**
 * Geeft alle cache-entries terug waarvan de key begint met `prefix`.
 * Parset de data-kolom als JSON. Entries waarbij JSON parsen mislukt worden overgeslagen.
 * @param {string} prefix
 * @returns {Array<{ key: string, data: any, updated_at: number }>}
 */
function queryCacheByPrefix(prefix) {
  try {
    const rows = _stmtQueryByPrefix.all(`${prefix}%`);
    const result = [];
    for (const row of rows) {
      try {
        result.push({ key: row.key, data: JSON.parse(row.data), updated_at: row.updated_at });
      } catch { /* corrupte entry overslaan */ }
    }
    return result;
  } catch (err) {
    logger.error({ err, prefix }, 'Error querying cache by prefix');
    return [];
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

  // Migratie: voeg source en platform kolommen toe als ze nog niet bestaan.
  // SQLite ondersteunt geen IF NOT EXISTS bij ALTER TABLE, dus we gebruiken try/catch.
  try { db.exec("ALTER TABLE downloads ADD COLUMN source   TEXT"); } catch {}
  try { db.exec("ALTER TABLE downloads ADD COLUMN platform TEXT"); } catch {}

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
const _stmtQueryByPrefix = db.prepare('SELECT key, data, updated_at FROM cache WHERE key LIKE ?');
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
  'INSERT INTO downloads (tidal_id, artist, title, url, quality, queued_at, source, platform) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
);
const _stmtGetDownloads = db.prepare('SELECT * FROM downloads ORDER BY queued_at DESC');
const _stmtGetDownloadKeys = db.prepare('SELECT artist, title FROM downloads');
const _stmtRemoveDownload = db.prepare('DELETE FROM downloads WHERE id = ?');

/**
 * Sla een gedownload album op in de geschiedenis.
 * @param {object} opts
 * @param {string} [opts.tidal_id]  - Tidal track/album ID (legacy veld, ook gebruikt als generiek id)
 * @param {string} [opts.artist]
 * @param {string} [opts.title]
 * @param {string} [opts.url]
 * @param {string} [opts.quality]
 * @param {string} [opts.source]    - "tidarr" | "orpheus" (of andere downloader)
 * @param {string} [opts.platform]  - "tidal" | "qobuz" | "deezer" | "spotify" | ... (platform van de bron-URL)
 */
function addDownload({ tidal_id, artist, title, url, quality, source, platform }) {
  try {
    _stmtAddDownload.run(
      tidal_id  || null,
      artist    || '',
      title     || '',
      url       || null,
      quality   || null,
      Date.now(),
      source    || null,
      platform  || null
    );

    logger.info({ artist, title, quality, tidal_id, source, platform }, 'Download added to history');
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

// ── Download Jobs (orchestrator tracking) ──────────────────────────────────
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS download_jobs (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      artist           TEXT NOT NULL,
      album            TEXT,
      track            TEXT,
      type             TEXT NOT NULL,
      quality          TEXT DEFAULT 'flac',
      source_requested TEXT DEFAULT 'auto',
      source_used      TEXT,
      status           TEXT DEFAULT 'pending',
      attempts         INTEGER DEFAULT 0,
      error_log        TEXT,
      created_at       INTEGER DEFAULT (strftime('%s','now')),
      completed_at     INTEGER,
      file_path        TEXT
    )
  `);
  db.exec('CREATE INDEX IF NOT EXISTS idx_djobs_status ON download_jobs(status)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_djobs_created ON download_jobs(created_at)');
  logger.debug('Download jobs table initialized');
} catch (err) {
  logger.error({ err }, 'Error initializing download_jobs table');
  throw err;
}

// ── Settings (persistente gebruikersinstellingen) ──────────────────────────
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      category   TEXT NOT NULL,
      key        TEXT NOT NULL,
      value      TEXT,
      type       TEXT DEFAULT 'string',
      updated_at INTEGER DEFAULT (strftime('%s','now')),
      PRIMARY KEY (category, key)
    )
  `);
  logger.debug('Settings table initialized');
} catch (err) {
  logger.error({ err }, 'Error initializing settings table');
  throw err;
}

// Settings prepared statements
const _stmtGetSettings    = db.prepare('SELECT key, value, type FROM settings WHERE category = ?');
const _stmtGetSetting     = db.prepare('SELECT value, type FROM settings WHERE category = ? AND key = ?');
const _stmtSetSetting     = db.prepare(
  'INSERT OR REPLACE INTO settings (category, key, value, type, updated_at) VALUES (?, ?, ?, ?, strftime(\'%s\',\'now\'))'
);
const _stmtGetAllSettings = db.prepare('SELECT category, key, value, type FROM settings ORDER BY category, key');

/**
 * Haal alle settings op voor een categorie als { key: value } object.
 * @param {string} category
 * @returns {object}
 */
function getSettings(category) {
  try {
    const rows = _stmtGetSettings.all(category);
    const result = {};
    for (const row of rows) {
      result[row.key] = deserializeSettingValue(row.value, row.type);
    }
    logger.trace({ category, count: rows.length }, 'Settings retrieved');
    return result;
  } catch (err) {
    logger.error({ category, err }, 'Error retrieving settings');
    return {};
  }
}

/**
 * Haal één setting op. Geeft null terug als niet gevonden.
 * @param {string} category
 * @param {string} key
 * @returns {*}
 */
function getSetting(category, key) {
  try {
    const row = _stmtGetSetting.get(category, key);
    if (!row) return null;
    return deserializeSettingValue(row.value, row.type);
  } catch (err) {
    logger.error({ category, key, err }, 'Error retrieving setting');
    return null;
  }
}

/**
 * Sla één setting op.
 * @param {string} category
 * @param {string} key
 * @param {*} value
 * @param {string} [type] - 'string'|'number'|'boolean'|'json'
 */
function setSetting(category, key, value, type) {
  try {
    const { serialized, detectedType } = serializeSettingValue(value, type);
    _stmtSetSetting.run(category, key, serialized, detectedType);
    logger.trace({ category, key, type: detectedType }, 'Setting saved');
  } catch (err) {
    logger.error({ category, key, err }, 'Error saving setting');
    throw err;
  }
}

/**
 * Bulk-update settings voor een categorie.
 * @param {string} category
 * @param {object} settingsObj - { key: value, ... }
 */
function setSettings(category, settingsObj) {
  try {
    const bulkInsert = db.transaction((cat, obj) => {
      for (const [key, value] of Object.entries(obj)) {
        const { serialized, detectedType } = serializeSettingValue(value);
        _stmtSetSetting.run(cat, key, serialized, detectedType);
      }
    });
    bulkInsert(category, settingsObj);
    logger.debug({ category, keys: Object.keys(settingsObj) }, 'Settings bulk-saved');
  } catch (err) {
    logger.error({ category, err }, 'Error bulk-saving settings');
    throw err;
  }
}

/**
 * Haal ALLE settings op als genest object { category: { key: value } }.
 * @returns {object}
 */
function getAllSettings() {
  try {
    const rows = _stmtGetAllSettings.all();
    const result = {};
    for (const row of rows) {
      if (!result[row.category]) result[row.category] = {};
      result[row.category][row.key] = deserializeSettingValue(row.value, row.type);
    }
    return result;
  } catch (err) {
    logger.error({ err }, 'Error retrieving all settings');
    return {};
  }
}

/** Serialiseer een JS-waarde naar een string voor SQLite opslag. */
function serializeSettingValue(value, explicitType) {
  let detectedType = explicitType;
  let serialized;

  if (!detectedType) {
    if (typeof value === 'boolean') detectedType = 'boolean';
    else if (typeof value === 'number') detectedType = 'number';
    else if (typeof value === 'object' && value !== null) detectedType = 'json';
    else detectedType = 'string';
  }

  if (detectedType === 'json') serialized = JSON.stringify(value);
  else if (value === null || value === undefined) serialized = null;
  else serialized = String(value);

  return { serialized, detectedType };
}

/** Deserialiseer een SQLite string terug naar een JS-waarde. */
function deserializeSettingValue(value, type) {
  if (value === null || value === undefined) return null;
  if (type === 'boolean') return value === 'true' || value === '1';
  if (type === 'number') return Number(value);
  if (type === 'json') {
    try { return JSON.parse(value); } catch { return value; }
  }
  return value;
}

// ── Download Jobs prepared statements ─────────────────────────────────────
const _stmtCreateJob     = db.prepare(`
  INSERT INTO download_jobs (artist, album, track, type, quality, source_requested, status)
  VALUES (?, ?, ?, ?, ?, ?, 'pending')
`);
const _stmtGetJob        = db.prepare('SELECT * FROM download_jobs WHERE id = ?');
const _stmtUpdateJob     = db.prepare(`
  UPDATE download_jobs SET status=?, source_used=?, attempts=?, error_log=?, completed_at=?, file_path=?
  WHERE id=?
`);
const _stmtGetPendingJobs   = db.prepare("SELECT * FROM download_jobs WHERE status IN ('pending','failed') ORDER BY created_at ASC");
const _stmtGetJobsByStatus  = db.prepare('SELECT * FROM download_jobs WHERE status = ? ORDER BY created_at DESC');
const _stmtGetRecentJobs    = db.prepare('SELECT * FROM download_jobs ORDER BY created_at DESC LIMIT ?');
const _stmtGetActiveJobs    = db.prepare("SELECT * FROM download_jobs WHERE status IN ('pending','running') ORDER BY created_at ASC");

/** Maak een nieuw download-job record aan. Geeft de id terug. */
function createDownloadJob({ artist, album, track, type, quality, source_requested }) {
  try {
    const res = _stmtCreateJob.run(
      artist            || '',
      album             || null,
      track             || null,
      type              || 'album',
      quality           || 'flac',
      source_requested  || 'auto'
    );
    logger.debug({ id: res.lastInsertRowid, artist, album }, 'Download job created');
    return res.lastInsertRowid;
  } catch (err) {
    logger.error({ err, artist, album }, 'Error creating download job');
    throw err;
  }
}

/** Haal een job op op id. */
function getDownloadJob(id) {
  try {
    return _stmtGetJob.get(id) || null;
  } catch (err) {
    logger.error({ err, id }, 'Error getting download job');
    return null;
  }
}

/**
 * Update de status en resultaat van een job.
 * @param {number} id
 * @param {object} opts
 * @param {string} opts.status          - 'pending'|'running'|'completed'|'failed'
 * @param {string} [opts.source_used]
 * @param {number} [opts.attempts]
 * @param {string} [opts.error_log]
 * @param {string} [opts.file_path]
 */
function updateDownloadJob(id, { status, source_used, attempts, error_log, file_path } = {}) {
  try {
    const current = _stmtGetJob.get(id);
    const completed_at = (status === 'completed' || status === 'failed') ? Math.floor(Date.now() / 1000) : (current?.completed_at || null);
    _stmtUpdateJob.run(
      status       || current?.status       || 'pending',
      source_used  !== undefined ? source_used  : (current?.source_used  || null),
      attempts     !== undefined ? attempts     : (current?.attempts     || 0),
      error_log    !== undefined ? error_log    : (current?.error_log    || null),
      completed_at,
      file_path    !== undefined ? file_path    : (current?.file_path    || null),
      id
    );
    logger.debug({ id, status }, 'Download job updated');
  } catch (err) {
    logger.error({ err, id }, 'Error updating download job');
    throw err;
  }
}

/** Haal alle pending/failed jobs op (voor retry). */
function getPendingDownloadJobs() {
  try {
    return _stmtGetPendingJobs.all();
  } catch (err) {
    logger.error({ err }, 'Error getting pending download jobs');
    return [];
  }
}

/** Haal recente jobs op (voor queue/history weergave). */
function getRecentDownloadJobs(limit = 50) {
  try {
    return _stmtGetRecentJobs.all(limit);
  } catch (err) {
    logger.error({ err }, 'Error getting recent download jobs');
    return [];
  }
}

/** Haal actieve (pending + running) jobs op. */
function getActiveDownloadJobs() {
  try {
    return _stmtGetActiveJobs.all();
  } catch (err) {
    logger.error({ err }, 'Error getting active download jobs');
    return [];
  }
}

/** Haal jobs op gefilterd op status. */
function getDownloadJobsByStatus(status) {
  try {
    return _stmtGetJobsByStatus.all(status);
  } catch (err) {
    logger.error({ err, status }, 'Error getting download jobs by status');
    return [];
  }
}

// ── postprocess_log tabel ─────────────────────────────────────────────────────
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS postprocess_log (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      download_id  INTEGER,
      step         TEXT    NOT NULL,
      status       TEXT    DEFAULT 'pending',
      input_path   TEXT,
      output_path  TEXT,
      details      TEXT,
      started_at   INTEGER,
      completed_at INTEGER,
      FOREIGN KEY (download_id) REFERENCES download_jobs(id)
    )
  `);
  db.exec('CREATE INDEX IF NOT EXISTS idx_pplog_download_id ON postprocess_log(download_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_pplog_completed   ON postprocess_log(completed_at)');
  logger.debug('postprocess_log table initialized');
} catch (err) {
  logger.error({ err }, 'Error initializing postprocess_log table');
  throw err;
}

const _stmtInsertPPLog = db.prepare(`
  INSERT INTO postprocess_log
    (download_id, step, status, input_path, output_path, details, started_at, completed_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);
const _stmtGetPPLog = db.prepare(`
  SELECT * FROM postprocess_log
  ORDER BY completed_at DESC
  LIMIT ?
`);
const _stmtGetPPLogByJob = db.prepare(`
  SELECT * FROM postprocess_log
  WHERE download_id = ?
  ORDER BY completed_at ASC
`);

/**
 * Sla een postprocessing-stap op in de log.
 * @param {object} opts
 * @param {number} [opts.download_id]
 * @param {string} opts.step
 * @param {string} opts.status      - 'ok' | 'error' | 'skipped'
 * @param {string} [opts.input_path]
 * @param {string} [opts.output_path]
 * @param {string} [opts.details]   - JSON-string met extra info
 * @param {number} [opts.started_at]
 * @param {number} [opts.completed_at]
 */
function logPostprocessStep({ download_id = null, step, status, input_path = null, output_path = null, details = null, started_at = null, completed_at = null } = {}) {
  try {
    _stmtInsertPPLog.run(
      download_id,
      step,
      status,
      input_path,
      output_path,
      typeof details === 'string' ? details : JSON.stringify(details ?? null),
      started_at   ?? Date.now(),
      completed_at ?? Date.now()
    );
  } catch (err) {
    logger.error({ err, step, status }, 'Error logging postprocess step');
    throw err;
  }
}

/** Haal de laatste N postprocess-logregels op. */
function getPostprocessLog(limit = 50) {
  try {
    return _stmtGetPPLog.all(limit);
  } catch (err) {
    logger.error({ err }, 'Error getting postprocess log');
    return [];
  }
}

/** Haal alle postprocess-logregels op voor één download-job. */
function getPostprocessLogByJob(downloadId) {
  try {
    return _stmtGetPPLogByJob.all(downloadId);
  } catch (err) {
    logger.error({ err, downloadId }, 'Error getting postprocess log by job');
    return [];
  }
}

// ── acoustid_results tabel ────────────────────────────────────────────────────
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS acoustid_results (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      download_id     INTEGER,
      file_path       TEXT    NOT NULL,
      fingerprint     TEXT,
      acoustid_score  REAL,
      expected_artist TEXT,
      expected_title  TEXT,
      matched_artist  TEXT,
      matched_title   TEXT,
      matched_mbid    TEXT,
      verified        INTEGER DEFAULT 0,
      mismatch_reason TEXT,
      created_at      INTEGER DEFAULT (strftime('%s','now')),
      FOREIGN KEY (download_id) REFERENCES download_jobs(id)
    )
  `);
  db.exec('CREATE INDEX IF NOT EXISTS idx_acid_download_id ON acoustid_results(download_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_acid_file_path   ON acoustid_results(file_path)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_acid_created_at  ON acoustid_results(created_at)');
  logger.debug('acoustid_results table initialized');
} catch (err) {
  logger.error({ err }, 'Error initializing acoustid_results table');
  throw err;
}

const _stmtInsertAcoustid = db.prepare(`
  INSERT OR REPLACE INTO acoustid_results
    (download_id, file_path, fingerprint, acoustid_score,
     expected_artist, expected_title, matched_artist, matched_title,
     matched_mbid, verified, mismatch_reason, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, strftime('%s','now'))
`);
const _stmtGetAcoustidByJob  = db.prepare('SELECT * FROM acoustid_results WHERE download_id = ? ORDER BY created_at DESC LIMIT 1');
const _stmtGetAcoustidByPath = db.prepare('SELECT * FROM acoustid_results WHERE file_path = ? ORDER BY created_at DESC LIMIT 1');
const _stmtGetAcoustidRecent = db.prepare('SELECT * FROM acoustid_results ORDER BY created_at DESC LIMIT ?');

/**
 * Sla een AcoustID verificatie-resultaat op.
 * @param {object} r
 */
function saveAcoustidResult({
  download_id = null, file_path, fingerprint = null, acoustid_score = null,
  expected_artist = null, expected_title = null,
  matched_artist = null, matched_title = null, matched_mbid = null,
  verified = 0, mismatch_reason = null
} = {}) {
  try {
    _stmtInsertAcoustid.run(
      download_id, file_path,
      fingerprint  ? fingerprint.slice(0, 500) : null, // afkappen: fingerprints zijn lang
      acoustid_score,
      expected_artist, expected_title,
      matched_artist, matched_title, matched_mbid,
      verified ? 1 : 0, mismatch_reason
    );
  } catch (err) {
    logger.error({ err, file_path }, 'Error saving acoustid result');
    throw err;
  }
}

/** Haal het meest recente AcoustID-resultaat op voor een download-job. */
function getAcoustidResultByJob(downloadId) {
  try {
    return _stmtGetAcoustidByJob.get(downloadId) || null;
  } catch (err) {
    logger.error({ err, downloadId }, 'Error getting acoustid result by job');
    return null;
  }
}

/** Haal het meest recente AcoustID-resultaat op voor een bestandspad. */
function getAcoustidResultByPath(filePath) {
  try {
    return _stmtGetAcoustidByPath.get(filePath) || null;
  } catch (err) {
    logger.error({ err, filePath }, 'Error getting acoustid result by path');
    return null;
  }
}

/** Haal de laatste N AcoustID-resultaten op. */
function getAcoustidResults(limit = 50) {
  try {
    return _stmtGetAcoustidRecent.all(Math.min(limit, 200));
  } catch (err) {
    logger.error({ err }, 'Error getting acoustid results');
    return [];
  }
}

// ── Playlists tabel ──────────────────────────────────────────────────────────
// Persistente opslag van gegenereerde playlists met TTL per type.
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS playlists (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      type         TEXT    NOT NULL,
      name         TEXT    NOT NULL,
      params       TEXT,
      tracks       TEXT    NOT NULL,
      track_count  INTEGER DEFAULT 0,
      generated_at INTEGER DEFAULT (strftime('%s','now')),
      expires_at   INTEGER
    )
  `);
  db.exec('CREATE INDEX IF NOT EXISTS idx_playlists_type ON playlists(type)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_playlists_expires ON playlists(expires_at)');
  logger.debug('Playlists table initialized');
} catch (err) {
  logger.error({ err }, 'Error initializing playlists table');
  throw err;
}

// Playlist TTLs per type (in seconden)
const PLAYLIST_TTL = {
  discovery_weekly:   7 * 24 * 3600,   // 7 dagen
  release_radar:      24 * 3600,        // 24 uur
  daily_mix:          24 * 3600,        // 24 uur
  seasonal:           30 * 24 * 3600,   // 30 dagen
  decade:             14 * 24 * 3600,   // 14 dagen
  genre:              14 * 24 * 3600,   // 14 dagen
  forgotten_favorites:24 * 3600,        // 24 uur
  hidden_gems:        7 * 24 * 3600,    // 7 dagen
  custom:             24 * 3600,        // 24 uur
};

const _stmtSavePlaylist = db.prepare(`
  INSERT OR REPLACE INTO playlists (type, name, params, tracks, track_count, generated_at, expires_at)
  VALUES (?, ?, ?, ?, ?, strftime('%s','now'), ?)
`);
const _stmtGetPlaylist       = db.prepare('SELECT * FROM playlists WHERE type = ? AND (params = ? OR (params IS NULL AND ? IS NULL)) ORDER BY generated_at DESC LIMIT 1');
const _stmtGetAllPlaylists   = db.prepare('SELECT id, type, name, params, track_count, generated_at, expires_at FROM playlists ORDER BY generated_at DESC');
const _stmtDeletePlaylist    = db.prepare('DELETE FROM playlists WHERE type = ? AND (params = ? OR (params IS NULL AND ? IS NULL))');
const _stmtDeleteExpired     = db.prepare('DELETE FROM playlists WHERE expires_at IS NOT NULL AND expires_at < ?');

/**
 * Sla een gegenereerde playlist op in de database.
 * @param {string} type      - Playlist type (bijv. 'daily_mix')
 * @param {string} name      - Weergavenaam
 * @param {Array}  tracks    - Array van track-objecten
 * @param {object} [params]  - Extra parameters (bijv. { genre: 'rock' })
 */
function savePlaylist(type, name, tracks, params = null) {
  try {
    const ttl     = PLAYLIST_TTL[type] || 24 * 3600;
    const now     = Math.floor(Date.now() / 1000);
    const expires = now + ttl;
    const paramsStr = params ? JSON.stringify(params) : null;

    // Verwijder de vorige versie van deze playlist+params
    _stmtDeletePlaylist.run(type, paramsStr, paramsStr);

    _stmtSavePlaylist.run(
      type,
      name,
      paramsStr,
      JSON.stringify(tracks),
      tracks.length,
      expires
    );
    logger.debug({ type, name, tracks: tracks.length }, 'Playlist opgeslagen');
  } catch (err) {
    logger.error({ type, name, err }, 'Error saving playlist');
    throw err;
  }
}

/**
 * Haal een gecachede playlist op. Geeft null terug als verlopen of niet gevonden.
 * @param {string} type
 * @param {object} [params]
 * @returns {{ id, type, name, tracks, generated_at, expires_at } | null}
 */
function getPlaylist(type, params = null) {
  try {
    const paramsStr = params ? JSON.stringify(params) : null;
    const row = _stmtGetPlaylist.get(type, paramsStr, paramsStr);
    if (!row) return null;

    const now = Math.floor(Date.now() / 1000);
    if (row.expires_at && row.expires_at < now) {
      logger.debug({ type }, 'Playlist verlopen');
      return null;
    }

    return {
      ...row,
      tracks: JSON.parse(row.tracks),
      params: row.params ? JSON.parse(row.params) : null,
    };
  } catch (err) {
    logger.error({ type, err }, 'Error getting playlist');
    return null;
  }
}

/**
 * Haal metadata van alle opgeslagen playlists op (zonder tracks).
 * @returns {Array}
 */
function getAllSavedPlaylists() {
  try {
    const now = Math.floor(Date.now() / 1000);
    return _stmtGetAllPlaylists.all()
      .filter(r => !r.expires_at || r.expires_at > now)
      .map(r => ({
        ...r,
        params: r.params ? JSON.parse(r.params) : null,
        is_expired: r.expires_at ? r.expires_at < now : false,
      }));
  } catch (err) {
    logger.error({ err }, 'Error getting all playlists');
    return [];
  }
}

/** Verwijder verlopen playlists. */
function pruneExpiredPlaylists() {
  try {
    const now = Math.floor(Date.now() / 1000);
    const info = _stmtDeleteExpired.run(now);
    if (info.changes > 0) logger.debug({ deleted: info.changes }, 'Verlopen playlists verwijderd');
    return info.changes;
  } catch (err) {
    logger.error({ err }, 'Error pruning expired playlists');
    return 0;
  }
}

// ── Enrichment Queue & Data tabellen ─────────────────────────────────────────
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS enrichment_queue (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_type  TEXT NOT NULL,
      entity_name  TEXT NOT NULL,
      entity_id    TEXT,
      source       TEXT NOT NULL,
      status       TEXT DEFAULT 'pending',
      attempts     INTEGER DEFAULT 0,
      last_attempt INTEGER,
      error_message TEXT,
      created_at   INTEGER DEFAULT (strftime('%s','now'))
    )
  `);
  db.exec('CREATE INDEX IF NOT EXISTS idx_eq_status   ON enrichment_queue(status)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_eq_source   ON enrichment_queue(source)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_eq_entity   ON enrichment_queue(entity_type, entity_name)');

  db.exec(`
    CREATE TABLE IF NOT EXISTS enrichment_data (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_type TEXT NOT NULL,
      entity_name TEXT NOT NULL,
      source      TEXT NOT NULL,
      data_json   TEXT NOT NULL,
      created_at  INTEGER DEFAULT (strftime('%s','now')),
      updated_at  INTEGER,
      UNIQUE(entity_type, entity_name, source)
    )
  `);
  db.exec('CREATE INDEX IF NOT EXISTS idx_ed_entity ON enrichment_data(entity_type, entity_name)');

  db.exec(`
    CREATE TABLE IF NOT EXISTS genre_whitelist (
      genre   TEXT PRIMARY KEY,
      enabled INTEGER DEFAULT 1
    )
  `);
  logger.debug('Enrichment tables initialized');
} catch (err) {
  logger.error({ err }, 'Error initializing enrichment tables');
  throw err;
}

// ── Enrichment prepared statements ───────────────────────────────────────────
const _stmtEnqueueItem = db.prepare(`
  INSERT OR IGNORE INTO enrichment_queue (entity_type, entity_name, entity_id, source, status)
  VALUES (?, ?, ?, ?, 'pending')
`);
const _stmtGetPendingQueue = db.prepare(`
  SELECT * FROM enrichment_queue
  WHERE source = ? AND status = 'pending'
  ORDER BY created_at ASC
  LIMIT ?
`);
const _stmtUpdateQueueItem = db.prepare(`
  UPDATE enrichment_queue
  SET status=?, attempts=attempts+1, last_attempt=strftime('%s','now'), error_message=?
  WHERE id=?
`);
const _stmtResetStuckItems = db.prepare(`
  UPDATE enrichment_queue SET status='pending'
  WHERE source = ? AND status = 'processing'
    AND last_attempt < (strftime('%s','now') - 300)
`);
const _stmtGetQueueStats = db.prepare(`
  SELECT source, status, COUNT(*) as cnt
  FROM enrichment_queue
  GROUP BY source, status
`);
const _stmtSaveEnrichmentData = db.prepare(`
  INSERT INTO enrichment_data (entity_type, entity_name, source, data_json, created_at, updated_at)
  VALUES (?, ?, ?, ?, strftime('%s','now'), strftime('%s','now'))
  ON CONFLICT(entity_type, entity_name, source)
  DO UPDATE SET data_json=excluded.data_json, updated_at=strftime('%s','now')
`);
const _stmtGetEnrichmentData = db.prepare(`
  SELECT * FROM enrichment_data WHERE entity_type=? AND entity_name=?
`);
const _stmtGetEnrichmentDataSource = db.prepare(`
  SELECT * FROM enrichment_data WHERE entity_type=? AND entity_name=? AND source=?
`);
const _stmtCheckAlreadyQueued = db.prepare(`
  SELECT id FROM enrichment_queue
  WHERE entity_type=? AND entity_name=? AND source=?
    AND status NOT IN ('error','skipped')
`);

// Genre whitelist statements
const _stmtGetGenres = db.prepare('SELECT genre, enabled FROM genre_whitelist ORDER BY genre ASC');
const _stmtSetGenre  = db.prepare('INSERT OR REPLACE INTO genre_whitelist (genre, enabled) VALUES (?, ?)');
const _stmtToggleGenre = db.prepare('UPDATE genre_whitelist SET enabled=? WHERE genre=?');

/** Voeg een item toe aan de enrichment queue. Negeert duplicaten. */
function enqueueEnrichment(entityType, entityName, source, entityId = null) {
  try {
    const existing = _stmtCheckAlreadyQueued.get(entityType, entityName, source);
    if (existing) return false;
    _stmtEnqueueItem.run(entityType, entityName, entityId, source);
    return true;
  } catch (err) {
    logger.error({ entityType, entityName, source, err }, 'Error enqueueing enrichment item');
    return false;
  }
}

/** Haal N pending items op voor een bron. */
function getPendingEnrichmentItems(source, limit = 10) {
  try {
    return _stmtGetPendingQueue.all(source, limit);
  } catch (err) {
    logger.error({ source, err }, 'Error getting pending enrichment items');
    return [];
  }
}

/** Update de status van een queue-item. */
function updateEnrichmentItem(id, status, errorMessage = null) {
  try {
    _stmtUpdateQueueItem.run(status, errorMessage, id);
  } catch (err) {
    logger.error({ id, status, err }, 'Error updating enrichment item');
  }
}

/** Reset vastgelopen 'processing' items (ouder dan 5 minuten) naar 'pending'. */
function resetStuckEnrichmentItems(source) {
  try {
    return _stmtResetStuckItems.run(source).changes;
  } catch (err) {
    logger.error({ source, err }, 'Error resetting stuck enrichment items');
    return 0;
  }
}

/** Geeft queue-statistieken terug per bron en status. */
function getEnrichmentQueueStats() {
  try {
    const rows = _stmtGetQueueStats.all();
    const stats = {};
    for (const row of rows) {
      if (!stats[row.source]) stats[row.source] = {};
      stats[row.source][row.status] = row.cnt;
    }
    return stats;
  } catch (err) {
    logger.error({ err }, 'Error getting enrichment queue stats');
    return {};
  }
}

/** Sla enrichment data op voor een entiteit+bron. */
function saveEnrichmentData(entityType, entityName, source, data) {
  try {
    _stmtSaveEnrichmentData.run(entityType, entityName, source, JSON.stringify(data));
  } catch (err) {
    logger.error({ entityType, entityName, source, err }, 'Error saving enrichment data');
    throw err;
  }
}

/** Haal alle enrichment data op voor een entiteit. */
function getEnrichmentData(entityType, entityName) {
  try {
    const rows = _stmtGetEnrichmentData.all(entityType, entityName);
    const result = {};
    for (const row of rows) {
      try { result[row.source] = JSON.parse(row.data_json); } catch {}
    }
    return result;
  } catch (err) {
    logger.error({ entityType, entityName, err }, 'Error getting enrichment data');
    return {};
  }
}

/** Haal enrichment data op voor een specifieke bron. */
function getEnrichmentDataBySource(entityType, entityName, source) {
  try {
    const row = _stmtGetEnrichmentDataSource.get(entityType, entityName, source);
    if (!row) return null;
    try { return JSON.parse(row.data_json); } catch { return null; }
  } catch (err) {
    logger.error({ entityType, entityName, source, err }, 'Error getting enrichment data by source');
    return null;
  }
}

/** Haal genre whitelist op als array van { genre, enabled } objecten. */
function getGenreWhitelist() {
  try {
    return _stmtGetGenres.all();
  } catch (err) {
    logger.error({ err }, 'Error getting genre whitelist');
    return [];
  }
}

/** Voeg genre toe of update enabled-status. */
function setGenreEnabled(genre, enabled) {
  try {
    _stmtSetGenre.run(genre.toLowerCase().trim(), enabled ? 1 : 0);
  } catch (err) {
    logger.error({ genre, enabled, err }, 'Error setting genre whitelist entry');
    throw err;
  }
}

/** Bulk-update genre whitelist. */
function setGenreWhitelist(genres) {
  try {
    const bulkUpdate = db.transaction((list) => {
      for (const { genre, enabled } of list) {
        _stmtSetGenre.run(genre.toLowerCase().trim(), enabled ? 1 : 0);
      }
    });
    bulkUpdate(genres);
  } catch (err) {
    logger.error({ err }, 'Error bulk-updating genre whitelist');
    throw err;
  }
}

/** Vul genre_whitelist met standaard genres als de tabel leeg is. */
function seedGenreWhitelist() {
  try {
    const existing = db.prepare('SELECT COUNT(*) as cnt FROM genre_whitelist').get();
    if (existing.cnt > 0) return;

    const DEFAULT_GENRES = [
      'acid jazz','acid rock','acoustic','afrobeat','alternative','alternative country',
      'alternative metal','alternative rock','ambient','americana','art pop','art rock',
      'avant-garde','avant-garde jazz','baroque','baroque pop','bebop','big band',
      'black metal','bluegrass','blues','blues rock','boogie woogie','bossanova',
      'bossa nova','brass band','breakbeat','britpop','bubblegum pop','celtic',
      'chamber music','chamber pop','chanson','chicago blues','chillout','chillwave',
      'christian rock','christmas','cinematic','classic rock','classical','club',
      'comedy','conscious hip-hop','cool jazz','country','country blues','country pop',
      'country rock','crossover','cumbia','dance','dance pop','dancehall','dark ambient',
      'dark folk','darkwave','death metal','deep house','delta blues','detroit techno',
      'disco','doom metal','downtempo','dream pop','drone','drum and bass','dub',
      'dubstep','east coast hip-hop','easy listening','ebm','electronic','electro',
      'electro house','electronica','electropop','emo','ethereal','experimental',
      'experimental rock','flamenco','folk','folk metal','folk pop','folk rock',
      'freestyle','funk','funk metal','funky house','fusion','g-funk','gangsta rap',
      'garage rock','glam metal','glam rock','gospel','gothic','gothic metal',
      'gothic rock','grindcore','grunge','hard bop','hard rock','hardcore',
      'hardcore punk','heavy metal','hip-hop','hip hop','house','idm',
      'indie','indie folk','indie pop','indie rock','industrial','industrial metal',
      'instrumental','j-pop','j-rock','jazz','jazz fusion','jazz pop','jazz rock',
      'lo-fi','lounge','latin','latin jazz','latin pop','latin rock','math rock',
      'medieval','melodic death metal','melodic hardcore','metal','metalcore',
      'minimal','minimal techno','mod','modern classical','motown','neoclassical',
      'neo soul','new age','new wave','noise','noise rock','nu-jazz','nu-metal',
      'oldies','opera','orchestral','outlaw country','parody','piano','pop',
      'pop punk','pop rock','post-hardcore','post-punk','post-rock','power metal',
      'power pop','progressive','progressive house','progressive metal','progressive rock',
      'psychedelic','psychedelic rock','psychobilly','punk','punk rock','r&b',
      'ragtime','rap','rap rock','rave','reggae','reggaeton','rhythm and blues',
      'rock','rock and roll','rockabilly','roots reggae','salsa','shoegaze',
      'singer-songwriter','ska','ska punk','sludge metal','smooth jazz','soul',
      'sound collage','space rock','speed metal','stoner rock','surf rock',
      'swing','symphonic metal','symphonic rock','synth-pop','synthwave',
      'technical death metal','techno','thrash metal','trance','trap',
      'tribal','trip-hop','tropical','turntablism','twee pop','uk garage',
      'underground hip-hop','urban','vaporwave','viking metal','vocal jazz',
      'west coast hip-hop','world','world music','worship','zydeco',
    ];

    const insert = db.transaction((genres) => {
      for (const g of genres) {
        _stmtSetGenre.run(g, 1);
      }
    });
    insert(DEFAULT_GENRES);
    logger.info({ count: DEFAULT_GENRES.length }, 'Genre whitelist seeded with defaults');
  } catch (err) {
    logger.warn({ err }, 'Error seeding genre whitelist');
  }
}

// Seed genres bij startup
try { seedGenreWhitelist(); } catch {}

// ── Eenmalige startup-prune
try {
  const deleted = pruneCache();
  logger.info({ deletedTotal: deleted }, 'Initial cache pruning completed');
} catch (err) {
  logger.warn({ err }, 'Initial cache pruning failed, continuing anyway');
}

// Verwijder ook verlopen playlists bij opstarten
try {
  pruneExpiredPlaylists();
} catch {}

// ── stats_snapshots tabel ─────────────────────────────────────────────────────
// Dagelijkse snapshots van luisterstatistieken voor trending-data.
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS stats_snapshots (
      date           TEXT    PRIMARY KEY,
      total_plays    INTEGER,
      unique_artists INTEGER,
      unique_tracks  INTEGER,
      library_size   INTEGER,
      data_json      TEXT,
      created_at     INTEGER DEFAULT (strftime('%s','now'))
    )
  `);
  logger.debug('stats_snapshots table initialized');
} catch (err) {
  logger.error({ err }, 'Error initializing stats_snapshots table');
}

const _stmtSaveSnapshot  = db.prepare(`
  INSERT OR REPLACE INTO stats_snapshots (date, total_plays, unique_artists, unique_tracks, library_size, data_json)
  VALUES (?, ?, ?, ?, ?, ?)
`);
const _stmtGetSnapshot   = db.prepare('SELECT * FROM stats_snapshots WHERE date = ?');
const _stmtGetSnapshots  = db.prepare('SELECT * FROM stats_snapshots ORDER BY date DESC LIMIT ?');

function saveStatsSnapshot({ date, totalPlays, uniqueArtists, uniqueTracks, librarySize, data }) {
  _stmtSaveSnapshot.run(
    date,
    totalPlays || 0,
    uniqueArtists || 0,
    uniqueTracks || 0,
    librarySize || 0,
    data ? JSON.stringify(data) : null
  );
}

function getStatsSnapshot(date) {
  const row = _stmtGetSnapshot.get(date);
  if (!row) return null;
  return { ...row, data: row.data_json ? JSON.parse(row.data_json) : null };
}

function getRecentStatsSnapshots(limit = 30) {
  return _stmtGetSnapshots.all(limit).map(row => ({
    ...row,
    data: row.data_json ? JSON.parse(row.data_json) : null
  }));
}

// ── Watchlist tabellen ────────────────────────────────────────────────────────
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS watchlist (
      id                      INTEGER PRIMARY KEY AUTOINCREMENT,
      artist_name             TEXT    NOT NULL UNIQUE,
      mbid                    TEXT,
      watch_albums            INTEGER DEFAULT 1,
      watch_eps               INTEGER DEFAULT 1,
      watch_singles           INTEGER DEFAULT 0,
      exclude_live            INTEGER DEFAULT 1,
      exclude_remixes         INTEGER DEFAULT 0,
      exclude_compilations    INTEGER DEFAULT 1,
      auto_download           INTEGER DEFAULT 0,
      download_quality        TEXT    DEFAULT 'flac',
      scan_interval_hours     INTEGER DEFAULT 24,
      last_scanned            INTEGER,
      added_at                INTEGER DEFAULT (strftime('%s','now')),
      notes                   TEXT
    )
  `);
  db.exec('CREATE INDEX IF NOT EXISTS idx_watchlist_name ON watchlist(artist_name)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_watchlist_scan ON watchlist(last_scanned)');

  db.exec(`
    CREATE TABLE IF NOT EXISTS watchlist_releases (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      watchlist_id   INTEGER NOT NULL,
      release_title  TEXT    NOT NULL,
      release_type   TEXT,
      release_date   TEXT,
      mbid           TEXT,
      cover_url      TEXT,
      status         TEXT    DEFAULT 'new',
      notified       INTEGER DEFAULT 0,
      created_at     INTEGER DEFAULT (strftime('%s','now')),
      FOREIGN KEY (watchlist_id) REFERENCES watchlist(id) ON DELETE CASCADE
    )
  `);
  db.exec('CREATE INDEX IF NOT EXISTS idx_wl_releases_wid    ON watchlist_releases(watchlist_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_wl_releases_status ON watchlist_releases(status)');
  logger.debug('Watchlist tables initialized');
} catch (err) {
  logger.error({ err }, 'Error initializing watchlist tables');
  throw err;
}

// ── Watchlist prepared statements ─────────────────────────────────────────────
const _stmtGetAllWatchlist = db.prepare('SELECT * FROM watchlist ORDER BY artist_name ASC');
const _stmtGetWatchlistById = db.prepare('SELECT * FROM watchlist WHERE id = ?');
const _stmtGetWatchlistByName = db.prepare('SELECT * FROM watchlist WHERE artist_name = ? COLLATE NOCASE');
const _stmtInsertWatchlist = db.prepare(`
  INSERT INTO watchlist (artist_name, mbid, watch_albums, watch_eps, watch_singles,
    exclude_live, exclude_remixes, exclude_compilations, auto_download, download_quality,
    scan_interval_hours, notes)
  VALUES (@artist_name, @mbid, @watch_albums, @watch_eps, @watch_singles,
    @exclude_live, @exclude_remixes, @exclude_compilations, @auto_download, @download_quality,
    @scan_interval_hours, @notes)
`);
const _stmtUpdateWatchlist = db.prepare(`
  UPDATE watchlist SET
    mbid=@mbid, watch_albums=@watch_albums, watch_eps=@watch_eps, watch_singles=@watch_singles,
    exclude_live=@exclude_live, exclude_remixes=@exclude_remixes,
    exclude_compilations=@exclude_compilations, auto_download=@auto_download,
    download_quality=@download_quality, scan_interval_hours=@scan_interval_hours, notes=@notes
  WHERE id=@id
`);
const _stmtUpdateWatchlistScanned = db.prepare('UPDATE watchlist SET last_scanned=?, mbid=COALESCE(?,mbid) WHERE id=?');
const _stmtDeleteWatchlist = db.prepare('DELETE FROM watchlist WHERE id = ?');

const _stmtGetWatchlistReleases = db.prepare('SELECT * FROM watchlist_releases WHERE watchlist_id = ? ORDER BY release_date DESC, created_at DESC');
const _stmtGetWatchlistRelease  = db.prepare('SELECT * FROM watchlist_releases WHERE watchlist_id = ? AND release_title = ? COLLATE NOCASE');
const _stmtInsertWatchlistRelease = db.prepare(`
  INSERT INTO watchlist_releases (watchlist_id, release_title, release_type, release_date, mbid, cover_url, status)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);
const _stmtUpdateWatchlistReleaseStatus = db.prepare('UPDATE watchlist_releases SET status=? WHERE id=?');
const _stmtMarkReleasesNotified = db.prepare('UPDATE watchlist_releases SET notified=1 WHERE watchlist_id=? AND notified=0');
const _stmtCountNewReleases     = db.prepare("SELECT COUNT(*) as cnt FROM watchlist_releases WHERE watchlist_id=? AND status='new'");
const _stmtGetDueWatchlistItems = db.prepare(`
  SELECT * FROM watchlist
  WHERE last_scanned IS NULL
     OR last_scanned < (strftime('%s','now') - scan_interval_hours * 3600)
  ORDER BY last_scanned ASC
`);

/** Haal alle watchlist artiesten op. */
function getAllWatchlist() {
  try {
    const items = _stmtGetAllWatchlist.all();
    return items.map(w => ({
      ...w,
      new_release_count: _stmtCountNewReleases.get(w.id)?.cnt ?? 0,
    }));
  } catch (err) {
    logger.error({ err }, 'Error getting watchlist');
    return [];
  }
}

/** Haal één watchlist-entry op op id. */
function getWatchlistItem(id) {
  try { return _stmtGetWatchlistById.get(id) || null; }
  catch (err) { logger.error({ id, err }, 'Error getting watchlist item'); return null; }
}

/** Haal één watchlist-entry op op artiestnaam. */
function getWatchlistByName(artistName) {
  try { return _stmtGetWatchlistByName.get(artistName) || null; }
  catch (err) { logger.error({ artistName, err }, 'Error getting watchlist by name'); return null; }
}

/** Voeg een artiest toe aan de watchlist. Gooit als al aanwezig. */
function addWatchlistItem(fields) {
  try {
    const res = _stmtInsertWatchlist.run({
      artist_name:         fields.artist_name,
      mbid:                fields.mbid               ?? null,
      watch_albums:        fields.watch_albums        ?? 1,
      watch_eps:           fields.watch_eps           ?? 1,
      watch_singles:       fields.watch_singles       ?? 0,
      exclude_live:        fields.exclude_live        ?? 1,
      exclude_remixes:     fields.exclude_remixes     ?? 0,
      exclude_compilations:fields.exclude_compilations ?? 1,
      auto_download:       fields.auto_download       ?? 0,
      download_quality:    fields.download_quality    ?? 'flac',
      scan_interval_hours: fields.scan_interval_hours ?? 24,
      notes:               fields.notes               ?? null,
    });
    logger.info({ id: res.lastInsertRowid, artist_name: fields.artist_name }, 'Watchlist item added');
    return res.lastInsertRowid;
  } catch (err) {
    logger.error({ fields, err }, 'Error adding watchlist item');
    throw err;
  }
}

/** Update een watchlist-entry. */
function updateWatchlistItem(id, fields) {
  try {
    const current = _stmtGetWatchlistById.get(id);
    if (!current) throw new Error(`Watchlist item ${id} niet gevonden`);
    _stmtUpdateWatchlist.run({
      id,
      mbid:                fields.mbid               ?? current.mbid,
      watch_albums:        fields.watch_albums        ?? current.watch_albums,
      watch_eps:           fields.watch_eps           ?? current.watch_eps,
      watch_singles:       fields.watch_singles       ?? current.watch_singles,
      exclude_live:        fields.exclude_live        ?? current.exclude_live,
      exclude_remixes:     fields.exclude_remixes     ?? current.exclude_remixes,
      exclude_compilations:fields.exclude_compilations ?? current.exclude_compilations,
      auto_download:       fields.auto_download       ?? current.auto_download,
      download_quality:    fields.download_quality    ?? current.download_quality,
      scan_interval_hours: fields.scan_interval_hours ?? current.scan_interval_hours,
      notes:               fields.notes               ?? current.notes,
    });
    logger.debug({ id }, 'Watchlist item updated');
  } catch (err) {
    logger.error({ id, fields, err }, 'Error updating watchlist item');
    throw err;
  }
}

/** Markeer artiest als gescand. */
function markWatchlistScanned(id, mbid = null) {
  try { _stmtUpdateWatchlistScanned.run(Math.floor(Date.now() / 1000), mbid, id); }
  catch (err) { logger.error({ id, err }, 'Error marking watchlist scanned'); }
}

/** Verwijder watchlist artiest (en zijn releases via CASCADE). */
function removeWatchlistItem(id) {
  try {
    const info = _stmtDeleteWatchlist.run(id);
    logger.info({ id, deleted: info.changes > 0 }, 'Watchlist item removed');
  } catch (err) {
    logger.error({ id, err }, 'Error removing watchlist item');
    throw err;
  }
}

/** Haal alle releases op voor een watchlist entry. */
function getWatchlistReleases(watchlistId) {
  try { return _stmtGetWatchlistReleases.all(watchlistId); }
  catch (err) { logger.error({ watchlistId, err }, 'Error getting watchlist releases'); return []; }
}

/** Voeg een release toe (of negeer als al aanwezig). Geeft { id, isNew } terug. */
function addWatchlistRelease(watchlistId, { release_title, release_type, release_date, mbid, cover_url, status = 'new' }) {
  try {
    const existing = _stmtGetWatchlistRelease.get(watchlistId, release_title);
    if (existing) return { id: existing.id, isNew: false };
    const res = _stmtInsertWatchlistRelease.run(watchlistId, release_title, release_type, release_date, mbid ?? null, cover_url ?? null, status);
    return { id: res.lastInsertRowid, isNew: true };
  } catch (err) {
    logger.error({ watchlistId, release_title, err }, 'Error adding watchlist release');
    throw err;
  }
}

/** Update de status van een release ('new'|'downloaded'|'skipped'|'in_library'). */
function updateWatchlistReleaseStatus(releaseId, status) {
  try { _stmtUpdateWatchlistReleaseStatus.run(status, releaseId); }
  catch (err) { logger.error({ releaseId, status, err }, 'Error updating watchlist release status'); }
}

/** Haal alle artiesten op waarvan de scan-interval verlopen is. */
function getDueWatchlistItems() {
  try { return _stmtGetDueWatchlistItems.all(); }
  catch (err) { logger.error({ err }, 'Error getting due watchlist items'); return []; }
}

module.exports = {
  getDb: () => db,
  getCache, setCache, clearCache, getCacheAge, pruneCache, queryCacheByPrefix,
  getWishlist, addToWishlist, removeFromWishlist, isInWishlist,
  addDownload, getDownloads, getDownloadKeys, removeDownload, normalizeKey,
  getSettings, getSetting, setSetting, setSettings, getAllSettings,
  createDownloadJob, getDownloadJob, updateDownloadJob,
  getPendingDownloadJobs, getRecentDownloadJobs, getActiveDownloadJobs, getDownloadJobsByStatus,
  logPostprocessStep, getPostprocessLog, getPostprocessLogByJob,
  saveAcoustidResult, getAcoustidResultByJob, getAcoustidResultByPath, getAcoustidResults,
  savePlaylist, getPlaylist, getAllSavedPlaylists, pruneExpiredPlaylists, PLAYLIST_TTL,
  saveStatsSnapshot, getStatsSnapshot, getRecentStatsSnapshots,
  // Enrichment
  enqueueEnrichment, getPendingEnrichmentItems, updateEnrichmentItem,
  resetStuckEnrichmentItems, getEnrichmentQueueStats,
  saveEnrichmentData, getEnrichmentData, getEnrichmentDataBySource,
  getGenreWhitelist, setGenreEnabled, setGenreWhitelist, seedGenreWhitelist,
  // Watchlist
  getAllWatchlist, getWatchlistItem, getWatchlistByName,
  addWatchlistItem, updateWatchlistItem, removeWatchlistItem, markWatchlistScanned,
  getWatchlistReleases, addWatchlistRelease, updateWatchlistReleaseStatus, getDueWatchlistItems,
};
