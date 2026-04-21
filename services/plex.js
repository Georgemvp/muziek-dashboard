// ── Plex service ─────────────────────────────────────────────────────────────
const { getCache, setCache } = require('../db');
const logger = require('../logger');

const PLEX_URL   = (process.env.PLEX_URL || 'http://localhost:32400').replace(/\/$/, '');
const PLEX_TOKEN = process.env.PLEX_TOKEN || '';

let plexArtists    = new Set();
let plexArtistMap  = new Map(); // lowercase → originele naam
let plexAlbums     = new Set();
let plexAlbumsNorm = new Set();
let plexLastSync   = 0;
let plexSyncOk     = false;
let plexLibrary    = []; // [{artist, album}] originele casing, gesorteerd op artiest

// ── Herstel vanuit SQLite bij opstarten ────────────────────────────────────
const cached = getCache('plex', 3_600_000);
if (cached) {
  plexArtists    = new Set(cached.artists    || []);
  plexArtistMap  = new Map(Object.entries(cached.artistMap || {}));
  plexAlbums     = new Set(cached.albums     || []);
  plexAlbumsNorm = new Set(cached.albumsNorm || []);
  plexLibrary    = cached.library  || [];
  plexLastSync   = cached.lastSync || 0;
  plexSyncOk     = cached.syncOk   || false;
  logger.info({ artists: plexArtists.size, albums: plexLibrary.length }, 'Plex: geladen uit SQLite-cache');
}

/** Normaliseer albumtitels voor fuzzy matching (Plex vs MusicBrainz). */
function normStr(s) {
  return (s || '').toLowerCase()
    .replace(/\(.*?\)/g, '').replace(/\[.*?\]/g, '')
    .replace(/\b(deluxe|edition|remastered|expanded|anniversary|bonus|special|version|disc|disk|vol|volume)\b/g, '')
    .replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
}

/** Normaliseer albumnamen voor fuzzy title matching.
 *  - Lowercase
 *  - Verwijder tekst tussen haakjes/brackets: (Deluxe Edition), [Bonus Tracks]
 *  - Verwijder leading "the "
 *  - Verwijder alle niet-alfanumerieke tekens (behalve spaties)
 *  - Collapse meervoudige spaties naar 1 spatie
 *  - Trim
 */
function normalizeTitle(title) {
  return (title || '')
    .toLowerCase()
    .replace(/\(.*?\)/g, '')     // Verwijder (...)
    .replace(/\[.*?\]/g, '')     // Verwijder [...]
    .replace(/^\s*the\s+/, '')   // Verwijder leading "the "
    .replace(/[^a-z0-9 ]/g, '')  // Verwijder niet-alfanumerieke (behalve spaties)
    .replace(/\s+/g, ' ')        // Collapse meervoudige spaties
    .trim();
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
    if (!music) { logger.warn('Plex: geen muziekbibliotheek gevonden'); return; }

    const [artistData, albumData] = await Promise.all([
      plexGet(`/library/sections/${music.key}/all?type=8`),
      plexGet(`/library/sections/${music.key}/all?type=9`)
    ]);

    const artistMeta = artistData?.MediaContainer?.Metadata || [];
    plexArtists   = new Set(artistMeta.map(a => a.title.toLowerCase()));
    plexArtistMap = new Map(artistMeta.map(a => [a.title.toLowerCase(), a.title]));
    const albumMeta = albumData?.MediaContainer?.Metadata || [];
    plexAlbums     = new Set(albumMeta.map(a => `${(a.parentTitle || '').toLowerCase()}||${a.title.toLowerCase()}`));
    plexAlbumsNorm = new Set(albumMeta.map(a => `${normStr(a.parentTitle)}||${normStr(a.title)}`));
    plexLibrary    = albumMeta
      .map(a => ({ artist: a.parentTitle || '', album: a.title || '', ratingKey: a.ratingKey || null }))
      .filter(x => x.artist && x.album)
      .sort((a, b) => a.artist.localeCompare(b.artist, 'nl', { sensitivity: 'base' }));
    plexLastSync   = Date.now();
    plexSyncOk     = true;

    setCache('plex', {
      artists:    [...plexArtists],
      artistMap:  Object.fromEntries(plexArtistMap),
      albums:     [...plexAlbums],
      albumsNorm: [...plexAlbumsNorm],
      library:    plexLibrary,
      lastSync:   plexLastSync,
      syncOk:     plexSyncOk
    });

    logger.info({ artists: plexArtists.size, albums: plexAlbums.size }, 'Plex: gesynchroniseerd');
  } catch (e) {
    logger.warn({ err: e }, 'Plex sync mislukt');
    plexSyncOk = false;
  }
}

function artistInPlex(name) {
  return plexArtists.has((name || '').toLowerCase());
}

function albumInPlex(artist, album) {
  const origArtist = (artist || '').toLowerCase();
  const origAlbum = (album || '').toLowerCase();
  const orig = `${origArtist}||${origAlbum}`;

  // Exact match met origineel
  if (plexAlbums.has(orig)) return true;

  // Fuzzy matching met genormaliseerde titels (exact of substring)
  const normArtist = normalizeTitle(artist);
  const normAlbum = normalizeTitle(album);

  for (let entry of plexAlbumsNorm) {
    const [plexArtNorm, plexAlbNorm] = entry.split('||');

    // Artist moet matchen (exact of substring)
    const artistMatches = normArtist === plexArtNorm ||
                         plexArtNorm.includes(normArtist) ||
                         normArtist.includes(plexArtNorm);

    // Album moet matchen (exact of substring)
    const albumMatches = normAlbum === plexAlbNorm ||
                        plexAlbNorm.includes(normAlbum) ||
                        normAlbum.includes(plexAlbNorm);

    if (artistMatches && albumMatches) return true;
  }

  return false;
}

function getPlexStatus() {
  return { ok: plexSyncOk, artistCount: plexArtists.size, albumCount: plexAlbums.size, lastSync: plexLastSync };
}

/**
 * Geeft een Map terug van lowercase artiestNaam → originele naam voor alle
 * artiesten in de Plex-bibliotheek. Gebruikt voor de artiestenbron in releases.js.
 */
function getPlexArtistNames() {
  return new Map(plexArtistMap); // kopie zodat externe code de interne Map niet muteert
}

/**
 * Geeft alle albums uit de Plex-bibliotheek terug als array van
 * { artist, album, ratingKey } objecten, gesorteerd op artiestNaam.
 */
function getPlexLibrary() {
  return plexLibrary;
}

/**
 * Zoek de ratingKey van een album in de Plex-bibliotheek.
 * Gebruikt fuzzy matching op artiestNaam en albumnaam.
 * @returns {string|null} ratingKey of null
 */
function getAlbumRatingKey(artist, album) {
  const normArtist = normalizeTitle(artist);
  const normAlbum  = normalizeTitle(album);
  for (const entry of plexLibrary) {
    const eArtist = normalizeTitle(entry.artist);
    const eAlbum  = normalizeTitle(entry.album);
    const artistOk = normArtist === eArtist || eArtist.includes(normArtist) || normArtist.includes(eArtist);
    const albumOk  = normAlbum  === eAlbum  || eAlbum.includes(normAlbum)  || normAlbum.includes(eAlbum);
    if (artistOk && albumOk && entry.ratingKey) return entry.ratingKey;
  }
  return null;
}

// ── Plex Clients cache ─────────────────────────────────────────────────────
let _clientsCache    = null;
let _clientsCacheTime = 0;

/**
 * Haal beschikbare Plex clients/players op (gecached 30 seconden).
 * @returns {Promise<Array<{name,host,port,machineId,product}>>}
 */
async function getPlexClients() {
  if (_clientsCache && Date.now() - _clientsCacheTime < 30_000) {
    return _clientsCache;
  }
  try {
    const data    = await plexGet('/clients');
    const servers = data?.MediaContainer?.Server || [];
    const clients = servers.map(c => ({
      name:      c.name || c.title || 'Onbekend',
      host:      c.host,
      port:      parseInt(c.port) || 32500,
      machineId: c.machineIdentifier,
      product:   c.product || '',
    }));
    _clientsCache     = clients;
    _clientsCacheTime = Date.now();
    return clients;
  } catch (e) {
    logger.warn({ err: e }, 'Plex: clients ophalen mislukt');
    return [];
  }
}

/** Intern: stuur een commando direct naar een Plex client-player. */
async function _playerCmd(machineId, command, extraParams = {}) {
  const clients = await getPlexClients();
  const client  = clients.find(c => c.machineId === machineId);
  if (!client) throw new Error(`Plex client '${machineId}' niet gevonden`);

  const params = new URLSearchParams({ 'X-Plex-Token': PLEX_TOKEN, ...extraParams });
  const res = await fetch(
    `http://${client.host}:${client.port}/player/playback/${command}?${params}`,
    {
      headers: { 'X-Plex-Token': PLEX_TOKEN, 'Accept': 'application/json' },
      signal:  AbortSignal.timeout(8_000),
    }
  );
  // 204 No Content is een geldig succes-antwoord
  if (!res.ok && res.status !== 204) throw new Error(`Plex client HTTP ${res.status}`);
  return true;
}

/**
 * Speel een item af op de opgegeven Plex client.
 * @param {string} machineId   - machineIdentifier van de doelclient
 * @param {string} ratingKey   - ratingKey van het Plex-item
 * @param {string} [type]      - mediatype (standaard 'music')
 */
async function playOnClient(machineId, ratingKey, type = 'music') {
  // Haal server-identity op voor machineIdentifier en adres
  const identity       = await plexGet('/identity');
  const serverMachineId = identity?.MediaContainer?.machineIdentifier || '';
  const url    = new URL(PLEX_URL);
  const address = url.hostname;
  const port    = url.port || (url.protocol === 'https:' ? '443' : '80');
  const protocol = url.protocol === 'https:' ? 'https' : 'http';

  return _playerCmd(machineId, 'playMedia', {
    key:               `/library/metadata/${ratingKey}`,
    offset:            '0',
    machineIdentifier: serverMachineId,
    address,
    port,
    protocol,
    type,
    'X-Plex-Token':    PLEX_TOKEN,
  });
}

/** Pauzeer/hervat afspelen op een Plex client. */
async function pauseClient(machineId) {
  return _playerCmd(machineId, 'pause');
}

/** Stop afspelen op een Plex client. */
async function stopClient(machineId) {
  return _playerCmd(machineId, 'stop');
}

/** Sla over naar het volgende nummer op een Plex client. */
async function skipNext(machineId) {
  return _playerCmd(machineId, 'skipNext');
}

/** Ga terug naar het vorige nummer op een Plex client. */
async function skipPrev(machineId) {
  return _playerCmd(machineId, 'skipPrevious');
}

module.exports = {
  plexGet, syncPlexLibrary,
  artistInPlex, albumInPlex,
  getPlexStatus, getPlexArtistNames, getPlexLibrary,
  getAlbumRatingKey,
  getPlexClients, playOnClient, pauseClient, stopClient, skipNext, skipPrev,
  PLEX_TOKEN,
};
