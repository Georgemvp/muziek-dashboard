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

function addDownload({ tidal_id, artist, title, url, quality, source, platform }) {
  const id = ++_downloadSeq;
  _tables.downloads.push({ id, tidal_id, artist, title, url, quality, source: source || null, platform: platform || null, downloaded_at: Date.now() });
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

/** Normaliseer artiest+titel tot een opzoeksleutel (zelfde logica als db.js). */
function normalizeKey(artist, title) {
  const n = s => (s || '').toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '');
  return `${n(artist)}|${n(title)}`;
}

// ── Stub-factory: no-op stubs voor functies die niet in de mock zitten ────
const noop    = () => {};
const nullFn  = () => null;
const arrFn   = () => [];
const zeroFn  = () => 0;

// getDb stubs — maintenance.js belt getDb() om een db-instantie te krijgen.
// De stub retourneert een leeg object zodat initMaintenance niet crasht.
function getDb() { return {}; }

// Cache helpers die in de mock ontbreken
function queryCacheByPrefix() { return []; }

// Discover (verplaatst naar Python Core, maar routes/misc.js importeert nog steeds)
function getDiscoverSection()    { return null; }
function setDiscoverSection()    {}
function getDiscoverSectionAge() { return Infinity; }

// Settings
const _settings = {};
function getSettings()             { return { ..._settings }; }
function getSetting(k, def)        { return _settings[k] ?? def ?? null; }
function setSetting(k, v)          { _settings[k] = v; }
function setSettings(obj)          { Object.assign(_settings, obj); }
function getAllSettings()           { return { ..._settings }; }

// Download jobs
const _jobs = [];
let _jobSeq = 0;
function createDownloadJob(data)   { const j = { id: ++_jobSeq, ...data, status: 'pending', created_at: Date.now() }; _jobs.push(j); return j.id; }
function getDownloadJob(id)        { return _jobs.find(j => j.id === id) ?? null; }
function updateDownloadJob(id, up) { const j = _jobs.find(j => j.id === id); if (j) Object.assign(j, up); }
function getPendingDownloadJobs()  { return _jobs.filter(j => j.status === 'pending'); }
function getRecentDownloadJobs()   { return [..._jobs].slice(-50); }
function getActiveDownloadJobs()   { return _jobs.filter(j => j.status === 'active'); }
function getDownloadJobsByStatus(s){ return _jobs.filter(j => j.status === s); }

// Post-processing & AcoustID
function logPostprocessStep()           {}
function getPostprocessLog()            { return []; }
function getPostprocessLogByJob()       { return []; }
function saveAcoustidResult()           {}
function getAcoustidResultByJob()       { return null; }
function getAcoustidResultByPath()      { return null; }
function getAcoustidResults()           { return []; }

// Saved playlists
const _playlists = {};
const PLAYLIST_TTL = 7 * 24 * 60 * 60 * 1000;
function savePlaylist(key, data)        { _playlists[key] = { key, data: JSON.stringify(data), saved_at: Date.now() }; }
function getPlaylist(key)               { return _playlists[key] ? JSON.parse(_playlists[key].data) : null; }
function getAllSavedPlaylists()         { return Object.values(_playlists); }
function pruneExpiredPlaylists()        {}

// Stats snapshots
function saveStatsSnapshot()            {}
function getStatsSnapshot()             { return null; }
function getRecentStatsSnapshots()      { return []; }

// Enrichment
function enqueueEnrichment()            {}
function getPendingEnrichmentItems()    { return []; }
function updateEnrichmentItem()         {}
function resetStuckEnrichmentItems()    {}
function getEnrichmentQueueStats()      { return { pending: 0, done: 0, failed: 0 }; }
function saveEnrichmentData()           {}
function getEnrichmentData()            { return null; }
function getEnrichmentDataBySource()    { return []; }

// Genre whitelist
const _genres = [];
function getGenreWhitelist()            { return [..._genres]; }
function setGenreEnabled(g, v)          {}
function setGenreWhitelist(list)        { _genres.splice(0, _genres.length, ...list); }
function seedGenreWhitelist(list)       { if (_genres.length === 0) _genres.push(...list); }

// Watchlist
const _watchlist = [];
let _wlSeq = 0;
function getAllWatchlist()                           { return [..._watchlist]; }
function getWatchlistItem(id)                        { return _watchlist.find(r => r.id === id) ?? null; }
function getWatchlistByName(name)                    { return _watchlist.find(r => r.name === name) ?? null; }
function addWatchlistItem(data)                      { const r = { id: ++_wlSeq, ...data }; _watchlist.push(r); return r.id; }
function updateWatchlistItem(id, data)               { const r = _watchlist.find(r => r.id === id); if (r) Object.assign(r, data); }
function removeWatchlistItem(id)                     { const i = _watchlist.findIndex(r => r.id === id); if (i >= 0) _watchlist.splice(i, 1); }
function markWatchlistScanned(id)                    { updateWatchlistItem(id, { last_scanned: Date.now() }); }
function getWatchlistReleases()                      { return []; }
function addWatchlistRelease()                       {}
function updateWatchlistReleaseStatus()              {}
function getDueWatchlistItems()                      { return []; }

// Mirrored playlists
const _mirrored = [];
let _mpSeq = 0;
function getAllMirroredPlaylists()                   { return [..._mirrored]; }
function getMirroredPlaylist(id)                     { return _mirrored.find(r => r.id === id) ?? null; }
function getMirroredPlaylistByUrl(url)               { return _mirrored.find(r => r.url === url) ?? null; }
function createMirroredPlaylist(data)                { const r = { id: ++_mpSeq, ...data }; _mirrored.push(r); return r.id; }
function updateMirroredPlaylist(id, data)            { const r = getMirroredPlaylist(id); if (r) Object.assign(r, data); }
function deleteMirroredPlaylist(id)                  { const i = _mirrored.findIndex(r => r.id === id); if (i >= 0) _mirrored.splice(i, 1); }
function getDueMirroredPlaylists()                   { return []; }
function getMirroredTracks()                         { return []; }
function getMirroredTrack()                          { return null; }
function getPendingMirroredTracks()                  { return []; }
function getUnmatchedMirroredTracks()                { return []; }
function upsertMirroredTrack()                       {}
function updateMirroredTrackMatch()                  {}
function updateMirroredTrackStatus()                 {}
function setMirroredTrackUnmatched()                 {}
function deleteMirroredTracksByPlaylist()            {}
function getMirroredPlaylistCounts()                 { return {}; }

// Maintenance
const _findings = [];
function getMaintenanceFindings(opts)  { return { findings: [], total: 0, offset: 0 }; }
function getMaintenanceFinding(id)     { return null; }
function updateMaintenanceFindingStatus() {}
function getMaintenanceSummary()       { return {}; }
function getMaintenanceRuns()          { return []; }

// Scrobbling
function insertScrobble()              {}
function getRecentScrobbles()          { return []; }
function getScrobble()                 { return null; }
function updateScrobbleLastfm()        {}
function updateScrobbleLB()            {}
function getPendingScrobbles()         { return []; }

// ── 3. Injecteer de mock als db.js in require.cache ────────────────────────
const fakeDbModule    = new Module(DB_JS_PATH, null);
fakeDbModule.exports  = {
  getDb,
  getCache, setCache, clearCache, getCacheAge, pruneCache, queryCacheByPrefix,
  getDiscoverSection, setDiscoverSection, getDiscoverSectionAge,
  getWishlist, addToWishlist, removeFromWishlist, isInWishlist,
  addDownload, getDownloads, getDownloadKeys, removeDownload, normalizeKey,
  getSettings, getSetting, setSetting, setSettings, getAllSettings,
  createDownloadJob, getDownloadJob, updateDownloadJob,
  getPendingDownloadJobs, getRecentDownloadJobs, getActiveDownloadJobs, getDownloadJobsByStatus,
  logPostprocessStep, getPostprocessLog, getPostprocessLogByJob,
  saveAcoustidResult, getAcoustidResultByJob, getAcoustidResultByPath, getAcoustidResults,
  savePlaylist, getPlaylist, getAllSavedPlaylists, pruneExpiredPlaylists, PLAYLIST_TTL,
  saveStatsSnapshot, getStatsSnapshot, getRecentStatsSnapshots,
  enqueueEnrichment, getPendingEnrichmentItems, updateEnrichmentItem,
  resetStuckEnrichmentItems, getEnrichmentQueueStats,
  saveEnrichmentData, getEnrichmentData, getEnrichmentDataBySource,
  getGenreWhitelist, setGenreEnabled, setGenreWhitelist, seedGenreWhitelist,
  getAllWatchlist, getWatchlistItem, getWatchlistByName,
  addWatchlistItem, updateWatchlistItem, removeWatchlistItem, markWatchlistScanned,
  getWatchlistReleases, addWatchlistRelease, updateWatchlistReleaseStatus, getDueWatchlistItems,
  getAllMirroredPlaylists, getMirroredPlaylist, getMirroredPlaylistByUrl,
  createMirroredPlaylist, updateMirroredPlaylist, deleteMirroredPlaylist,
  getDueMirroredPlaylists,
  getMirroredTracks, getMirroredTrack, getPendingMirroredTracks, getUnmatchedMirroredTracks,
  upsertMirroredTrack, updateMirroredTrackMatch, updateMirroredTrackStatus,
  setMirroredTrackUnmatched, deleteMirroredTracksByPlaylist, getMirroredPlaylistCounts,
  getMaintenanceFindings, getMaintenanceFinding, updateMaintenanceFindingStatus,
  getMaintenanceSummary, getMaintenanceRuns,
  insertScrobble, getRecentScrobbles, getScrobble,
  updateScrobbleLastfm, updateScrobbleLB, getPendingScrobbles,
};
fakeDbModule.filename = DB_JS_PATH;
fakeDbModule.loaded   = true;
fakeDbModule.id       = DB_JS_PATH;

require.cache[DB_JS_PATH] = fakeDbModule;
