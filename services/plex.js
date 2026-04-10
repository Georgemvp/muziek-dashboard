// ── Plex service ─────────────────────────────────────────────────────────────
const { getCache, setCache } = require('../db');

const PLEX_URL   = (process.env.PLEX_URL || 'http://localhost:32400').replace(/\/$/, '');
const PLEX_TOKEN = process.env.PLEX_TOKEN || '';

let plexArtists    = new Set();
let plexAlbums     = new Set();
let plexAlbumsNorm = new Set();
let plexLastSync   = 0;
let plexSyncOk     = false;

// ── Herstel vanuit SQLite bij opstarten ────────────────────────────────────
const cached = getCache('plex', 3_600_000);
if (cached) {
  plexArtists    = new Set(cached.artists    || []);
  plexAlbums     = new Set(cached.albums     || []);
  plexAlbumsNorm = new Set(cached.albumsNorm || []);
  plexLastSync   = cached.lastSync || 0;
  plexSyncOk     = cached.syncOk   || false;
  console.log(`Plex: ${plexArtists.size} artiesten geladen uit SQLite-cache`);
}

/** Normaliseer albumtitels voor fuzzy matching (Plex vs MusicBrainz). */
function normStr(s) {
  return (s || '').toLowerCase()
    .replace(/\(.*?\)/g, '').replace(/\[.*?\]/g, '')
    .replace(/\b(deluxe|edition|remastered|expanded|anniversary|bonus|special|version|disc|disk|vol|volume)\b/g, '')
    .replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
}

/** Doe een Plex-API-aanroep met timeout. */
async function plexGet(urlPath) {
  const res = await fetch(`${PLEX_URL}${urlPath}`, {
    headers: { 'X-Plex-Token': PLEX_TOKEN, 'Accept': 'application/json' },
    signal: AbortSignal.timeout(8_000)
  });
  if (!res.ok) throw new Error(`Plex HTTP ${res.status}`);
  return res.json();
}

/** Synchroniseer de Plex-bibliotheek. Slaat resultaat op in SQLite. */
async function syncPlexLibrary(force = false) {
  if (!PLEX_TOKEN) return;
  if (!force && Date.now() - plexLastSync < 3_600_000) return;
  try {
    const sections  = await plexGet('/library/sections');
    const music     = (sections?.MediaContainer?.Directory || []).find(s => s.type === 'artist');
    if (!music) { console.warn('Plex: geen muziekbibliotheek gevonden'); return; }

    const [artistData, albumData] = await Promise.all([
      plexGet(`/library/sections/${music.key}/all?type=8`),
      plexGet(`/library/sections/${music.key}/all?type=9`)
    ]);

    plexArtists    = new Set((artistData?.MediaContainer?.Metadata || []).map(a => a.title.toLowerCase()));
    const albumMeta = albumData?.MediaContainer?.Metadata || [];
    plexAlbums     = new Set(albumMeta.map(a => `${(a.parentTitle || '').toLowerCase()}||${a.title.toLowerCase()}`));
    plexAlbumsNorm = new Set(albumMeta.map(a => `${normStr(a.parentTitle)}||${normStr(a.title)}`));
    plexLastSync   = Date.now();
    plexSyncOk     = true;

    setCache('plex', {
      artists:    [...plexArtists],
      albums:     [...plexAlbums],
      albumsNorm: [...plexAlbumsNorm],
      lastSync:   plexLastSync,
      syncOk:     plexSyncOk
    });

    console.log(`Plex: ${plexArtists.size} artiesten, ${plexAlbums.size} albums gesynchroniseerd`);
  } catch (e) {
    console.warn('Plex sync mislukt:', e.message);
    plexSyncOk = false;
  }
}

function artistInPlex(name) {
  return plexArtists.has((name || '').toLowerCase());
}

function albumInPlex(artist, album) {
  const orig = `${(artist || '').toLowerCase()}||${(album || '').toLowerCase()}`;
  const norm = `${normStr(artist)}||${normStr(album)}`;
  return plexAlbums.has(orig) || plexAlbumsNorm.has(norm);
}

function getPlexStatus() {
  return { ok: plexSyncOk, artistCount: plexArtists.size, albumCount: plexAlbums.size, lastSync: plexLastSync };
}

module.exports = { plexGet, syncPlexLibrary, artistInPlex, albumInPlex, getPlexStatus, PLEX_TOKEN };
