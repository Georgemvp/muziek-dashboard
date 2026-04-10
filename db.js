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

module.exports = { getCache, setCache, clearCache, getCacheAge };
