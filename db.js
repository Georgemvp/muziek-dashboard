// ── SQLite persistente cache ────────────────────────────────────────────────
const Database = require('better-sqlite3');
const path     = require('path');
const fs       = require('fs');

const dataDir = '/data';
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'cache.db'));
db.exec(`
  CREATE TABLE IF NOT EXISTS cache (
    key        TEXT PRIMARY KEY,
    data       TEXT    NOT NULL,
    updated_at INTEGER NOT NULL
  )
`);
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

module.exports = { getCache, setCache, clearCache, getCacheAge, getWishlist, addToWishlist, removeFromWishlist, isInWishlist };
