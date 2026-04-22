/**
 * tests/setup.js
 * Injecteert een in-memory vervanger voor de SQLite-database als de
 * better-sqlite3 native binding niet beschikbaar is.
 *
 * In de Docker-productieomgeving is de binary gecompileerd voor het juiste
 * platform en werkt alles normaal.  In een CI-sandbox of sandbox-omgeving
 * met een ander platform (arm64 vs amd64) is de binary niet aanwezig – dan
 * mocken we `db.js` zelf via require.cache zodat alle testen toch kunnen
 * draaien met een in-memory store.
 *
 * Strategie: test of `new Database(':memory:')` slaagt.  Zo ja, laat de
 * echte module intact.  Zo nee, vervang de geëxporteerde functies van db.js
 * door een in-memory implementatie.
 */

'use strict';

const Module = require('node:module');
const path   = require('node:path');

// Pad naar db.js (absoluut, zodat de cache-sleutel overeenkomt)
const DB_JS_PATH = path.resolve(__dirname, '../db.js');

// ── 1. Controleer of better-sqlite3 echt werkt ─────────────────────────────
let nativeWorks = false;
try {
  const DB = require('better-sqlite3');
  const testDb = new DB(':memory:');
  testDb.close();
  nativeWorks = true;
} catch { /* native binding niet beschikbaar */ }

if (nativeWorks) return; // Alles prima – geen mock nodig.

// ── 2. In-memory db-implementatie ──────────────────────────────────────────
// Implementeert exact de interface die db.js exporteert.

const _tables = { cache: [], wishlist: [], downloads: [] };
let   _wishlistSeq = 0;
let   _downloadSeq = 0;

function getCache(key, maxAgeMs = Infinity) {
  const row = _tables.cache.find(r => r.key === key);
  if (!row) return null;
  if (maxAgeMs !== Infinity && Date.now() - row.updated_at > maxAgeMs) return null;
  try { return JSON.parse(row.data); } catch { return null; }
}

function setCache(key, data) {
  const updated_at = Date.now();
  const idx = _tables.cache.findIndex(r => r.key === key);
  const row = { key, data: JSON.stringify(data), updated_at };
  if (idx >= 0) _tables.cache[idx] = row;
  else           _tables.cache.push(row);
}

function clearCache(key) {
  _tables.cache = _tables.cache.filter(r => r.key !== key);
}

function getCacheAge(key) {
  const row = _tables.cache.find(r => r.key === key);
  return row ? Date.now() - row.updated_at : Infinity;
}

function getWishlist() {
  return [..._tables.wishlist].sort((a, b) => b.added_at - a.added_at);
}

function addToWishlist(type, name, artist, image) {
  const existing = _tables.wishlist.find(r => r.type === type && r.name === name);
  if (existing) return existing.id;
  const id = ++_wishlistSeq;
  _tables.wishlist.push({ id, type, name, artist, image, added_at: Date.now() });
  return id;
}

function removeFromWishlist(id) {
  _tables.wishlist = _tables.wishlist.filter(r => r.id !== id);
}

function isInWishlist(type, name) {
  const row = _tables.wishlist.find(r => r.type === type && r.name === name);
  return row ? row.id : null;
}

function pruneCache() {}

function addDownload({ tidal_id, artist, title, url, quality }) {
  const id = ++_downloadSeq;
  _tables.downloads.push({ id, tidal_id, artist, title, url, quality, downloaded_at: Date.now() });
  return id;
}

function getDownloads() {
  return [..._tables.downloads].sort((a, b) => b.downloaded_at - a.downloaded_at);
}

function getDownloadKeys() {
  return new Set(_tables.downloads.map(r => r.tidal_id).filter(Boolean));
}

function removeDownload(id) {
  _tables.downloads = _tables.downloads.filter(r => r.id !== id);
}

// ── 3. Injecteer de mock als db.js in require.cache ────────────────────────
const fakeDbModule    = new Module(DB_JS_PATH, null);
fakeDbModule.exports  = {
  getCache, setCache, clearCache, getCacheAge,
  getWishlist, addToWishlist, removeFromWishlist, isInWishlist,
  addDownload, getDownloads, getDownloadKeys, removeDownload, pruneCache,
};
fakeDbModule.filename = DB_JS_PATH;
fakeDbModule.loaded   = true;
fakeDbModule.id       = DB_JS_PATH;

require.cache[DB_JS_PATH] = fakeDbModule;
