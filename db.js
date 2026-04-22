// ── SQLite persistente cache ────────────────────────────────────────────────
const Database = require('better-sqlite3');
const path     = require('path');
const fs       = require('fs');

const dataDir = process.env.DATA_DIR || '/data';
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'cache.db'));
db.exec(`
  CREATE TABLE IF NOT EXISTS cache (
    key        TEXT PRIMARY KEY,
    data       TEXT    NOT NULL,
    updated_at INTEGER NOT NULL
  )
`);
// Index helpt bij prune-queries (DELETE/ORDER BY updated_at)
db.exec('CREATE INDEX IF NOT EXISTS idx_cache_updated_at ON cache(updated_at)');

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
  if (Number.isFinite(maxAgeMs) && maxAgeMs > 0) {
    db.prepare('DELETE FROM cache WHERE updated_at < ?').run(Date.now() - maxAgeMs);
  }

  if (Number.isFinite(maxRows) && maxRows > 0) {
    // Verwijder oudste items boven het maximum.
    db.prepare(`
      DELETE FROM cache
      WHERE key IN (
        SELECT key
        FROM cache
        ORDER BY updated_at DESC
        LIMIT -1 OFFSET ?
      )
    `).run(maxRows);
  }
}

// Eenmalige startup-prune
pruneCache();

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

/** Haal een gecachede waarde op. Geeft null terug als niet aanwezig of verlopen. */
function getCache(key, maxAgeMs = Infinity) {
  const row = db.prepare('SELECT data, updated_at FROM cache WHERE key = ?').get(key);
  if (!row) return null;
  if (maxAgeMs !== Infinity && Date.now() - row.updated_at > maxAgeMs) return null;
  try { return JSON.parse(row.data); } catch { return null; }
}

/** Sla een waarde op in de cache met de huidige timestamp. */
function setCache(key, data) {
  db.prepare('INSERT OR REPLACE INTO cache (key, data, updated_at) VALUES (?, ?, ?)')
    .run(key, JSON.stringify(data), Date.now());

  _cacheWriteCount++;
  if (_cacheWriteCount >= CACHE_PRUNE_EVERY_WRITES) {
    _cacheWriteCount = 0;
    pruneCache();
  }
}

/** Verwijder een cache-entry. */
function clearCache(key) {
  db.prepare('DELETE FROM cache WHERE key = ?').run(key);
}

/** Geeft de leeftijd in ms van een cache-entry terug (Infinity als niet aanwezig). */
function getCacheAge(key) {
  const row = db.prepare('SELECT updated_at FROM cache WHERE key = ?').get(key);
  return row ? Date.now() - row.updated_at : Infinity;
}

/** Geeft alle verlanglijst-items terug, nieuwste eerst. */
function getWishlist() {
  return db.prepare('SELECT * FROM wishlist ORDER BY added_at DESC').all();
}

/** Voeg een item toe aan de verlanglijst. Geeft het id terug (ook als het al bestond). */
function addToWishlist(type, name, artist, image) {
  const res = db.prepare(
    'INSERT OR IGNORE INTO wishlist (type, name, artist, image, added_at) VALUES (?, ?, ?, ?, ?)'
  ).run(type, name, artist || null, image || null, Date.now());
  if (res.changes === 0) {
    return db.prepare('SELECT id FROM wishlist WHERE type = ? AND name = ?').get(type, name).id;
  }
  return res.lastInsertRowid;
}

/** Verwijder een verlanglijst-item op id. */
function removeFromWishlist(id) {
  db.prepare('DELETE FROM wishlist WHERE id = ?').run(id);
}

/** Geeft het id terug als het item in de verlanglijst staat, anders null. */
function isInWishlist(type, name) {
  const row = db.prepare('SELECT id FROM wishlist WHERE type = ? AND name = ?').get(type, name);
  return row ? row.id : null;
}

// ── Downloads (persistente download-geschiedenis) ──────────────────────────
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

/** Sla een gedownload album op in de geschiedenis. */
function addDownload({ tidal_id, artist, title, url, quality }) {
  db.prepare(`
    INSERT INTO downloads (tidal_id, artist, title, url, quality, queued_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(tidal_id || null, artist || '', title || '', url || null, quality || null, Date.now());
}

/** Geeft alle downloads terug, nieuwste eerst. */
function getDownloads() {
  return db.prepare('SELECT * FROM downloads ORDER BY queued_at DESC').all();
}

/** Geeft een Set van genormaliseerde "artist|title" sleutels van alle downloads. */
function getDownloadKeys() {
  const rows = db.prepare('SELECT artist, title FROM downloads').all();
  return new Set(rows.map(r => normalizeKey(r.artist, r.title)));
}

/** Verwijder een download-record op id. */
function removeDownload(id) {
  db.prepare('DELETE FROM downloads WHERE id = ?').run(id);
}

/** Normaliseer artiest+titel tot een opzoeksleutel (ook gebruikt door de frontend). */
function normalizeKey(artist, title) {
  const n = s => (s || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
  return `${n(artist)}|${n(title)}`;
}

module.exports = {
  getCache, setCache, clearCache, getCacheAge, pruneCache,
  getWishlist, addToWishlist, removeFromWishlist, isInWishlist,
  addDownload, getDownloads, getDownloadKeys, removeDownload, normalizeKey
};
