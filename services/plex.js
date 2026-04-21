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

/** Doe een Plex-API-aanroep (GET) met timeout. */
async function plexGet(urlPath) {
  const res = await fetch(`${PLEX_URL}${urlPath}`, {
    headers: { 'X-Plex-Token': PLEX_TOKEN, 'Accept': 'application/json' },
    signal: AbortSignal.timeout(8_000)
  });
  if (!res.ok) throw new Error(`Plex HTTP ${res.status}`);
  return res.json();
}

/** Doe een Plex-API-aanroep (POST) met timeout. Parse als JSON als er body is, anders return {}. */
async function plexPost(urlPath) {
  const res = await fetch(`${PLEX_URL}${urlPath}`, {
    method: 'POST',
    headers: { 'X-Plex-Token': PLEX_TOKEN, 'Accept': 'application/json' },
    signal: AbortSignal.timeout(8_000)
  });
  if (!res.ok) throw new Error(`Plex HTTP ${res.status}`);

  const contentLength = res.headers.get('content-length');
  if (contentLength === '0' || !contentLength) return {};

  try {
    return await res.json();
  } catch {
    return {};
  }
}

/** Doe een Plex-API-aanroep (PUT) met timeout. Return true bij succes. */
async function plexPut(urlPath) {
  const res = await fetch(`${PLEX_URL}${urlPath}`, {
    method: 'PUT',
    headers: { 'X-Plex-Token': PLEX_TOKEN, 'Accept': 'application/json' },
    signal: AbortSignal.timeout(8_000)
  });
  if (!res.ok) throw new Error(`Plex HTTP ${res.status}`);
  return true;
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
let _clientsCache     = null;
let _clientsCacheTime = 0;
let _commandId        = 0; // oplopend commandID voor Plex companion-protocol

/**
 * Haal beschikbare Plex players op.
 *
 * Strategie (van meest naar minst betrouwbaar):
 *   1. Actieve sessies via /status/sessions — bevat Player-object van
 *      elk apparaat dat op dit moment iets afspeelt. Dit werkt altijd
 *      als er iemand speelt, ook als /clients leeg is.
 *   2. /clients endpoint — alleen clients die zich recentelijk aangemeld
 *      hebben via het Plex companion-protocol (vaak leeg).
 *
 * Gecached voor 30 seconden.
 * @returns {Promise<Array<{name, machineId, product, state, host, port}>>}
 */
async function getPlexClients(force = false) {
  if (!force && _clientsCache && Date.now() - _clientsCacheTime < 30_000) {
    return _clientsCache;
  }

  const seen = new Map(); // machineId → client-object

  // ── 1. Actieve sessies ── (meest betrouwbaar)
  try {
    const sessions  = await plexGet('/status/sessions');
    const metadata  = sessions?.MediaContainer?.Metadata || [];
    for (const m of metadata) {
      const p = m.Player;
      if (!p?.machineIdentifier) continue;
      seen.set(p.machineIdentifier, {
        name:      p.title || p.product || 'Onbekend',
        machineId: p.machineIdentifier,
        product:   p.product || '',
        state:     p.state   || 'playing',
        host:      p.address || null,
        port:      parseInt(p.port) || 32500,
      });
    }
  } catch (e) {
    logger.warn({ err: e }, 'Plex: sessies ophalen mislukt bij client-discovery');
  }

  // ── 2. /clients endpoint ── (aanvulling; vaak leeg)
  try {
    const data    = await plexGet('/clients');
    const servers = data?.MediaContainer?.Server || [];
    for (const c of servers) {
      if (!c.machineIdentifier || seen.has(c.machineIdentifier)) continue;
      seen.set(c.machineIdentifier, {
        name:      c.name || c.title || 'Onbekend',
        machineId: c.machineIdentifier,
        product:   c.product || '',
        state:     'idle',
        host:      c.host || null,
        port:      parseInt(c.port) || 32500,
      });
    }
  } catch (e) {
    logger.warn({ err: e }, 'Plex: /clients ophalen mislukt');
  }

  const clients = [...seen.values()];
  _clientsCache     = clients;
  _clientsCacheTime = Date.now();
  logger.info({ count: clients.length, machineIds: clients.map(c => c.machineId) }, 'Plex: players gevonden');
  return clients;
}

/**
 * Stuur een playback-commando naar een Plex client.
 *
 * Gebruikt de Plex companion-protocol relay via de server:
 *   GET {PLEX_URL}/player/playback/{command}
 *   Header: X-Plex-Target-Client-Identifier: {machineId}
 *
 * De Plex server stuurt het commando door naar de client via de open
 * WebSocket-verbinding. Dit werkt vanuit Docker zonder directe
 * netwerktoegang tot het client-apparaat.
 *
 * Als server-relay mislukt, proberen we de client direct te bereiken
 * op http://{host}:{port}/player/... als fallback.
 */
async function _playerCmd(machineId, command, extraParams = {}) {
  const cmdId  = String(++_commandId);
  const params = new URLSearchParams({ commandID: cmdId, ...extraParams });

  // ── Aanpak 1: relay via Plex server (werkt vanuit Docker) ──────────────
  try {
    const res = await fetch(`${PLEX_URL}/player/playback/${command}?${params}`, {
      headers: {
        'X-Plex-Token':                    PLEX_TOKEN,
        'X-Plex-Target-Client-Identifier': machineId,
        'Accept':                          'application/json',
      },
      signal: AbortSignal.timeout(8_000),
    });
    // 200 of 204 = succes; andere statussen = relay mislukt → probeer direct
    if (res.ok || res.status === 204) return true;
    logger.warn({ status: res.status, command }, 'Plex relay niet succesvol, probeer direct');
  } catch (e) {
    logger.warn({ err: e, command }, 'Plex relay mislukt, probeer direct');
  }

  // ── Aanpak 2: direct naar client-IP (fallback) ──────────────────────────
  const clients = _clientsCache || [];
  const client  = clients.find(c => c.machineId === machineId);
  if (!client?.host) throw new Error(`Plex: geen route gevonden naar client '${machineId}'`);

  const directParams = new URLSearchParams({ 'X-Plex-Token': PLEX_TOKEN, commandID: cmdId, ...extraParams });
  const res2 = await fetch(
    `http://${client.host}:${client.port}/player/playback/${command}?${directParams}`,
    {
      headers: { 'X-Plex-Token': PLEX_TOKEN, 'Accept': 'application/json' },
      signal:  AbortSignal.timeout(8_000),
    }
  );
  if (!res2.ok && res2.status !== 204) throw new Error(`Plex direct HTTP ${res2.status}`);
  return true;
}

/**
 * Speel een item af op de opgegeven Plex client.
 * @param {string} machineId - machineIdentifier van de doelclient
 * @param {string} ratingKey - ratingKey van het Plex-album of -nummer
 * @param {string} [type]    - mediatype ('music')
 */
async function playOnClient(machineId, ratingKey, type = 'music') {
  const identity        = await plexGet('/identity');
  const serverMachineId = identity?.MediaContainer?.machineIdentifier || '';
  const url      = new URL(PLEX_URL);
  const address  = url.hostname;
  const port     = url.port || (url.protocol === 'https:' ? '443' : '80');
  const protocol = url.protocol === 'https:' ? 'https' : 'http';

  return _playerCmd(machineId, 'playMedia', {
    key:               `/library/metadata/${ratingKey}`,
    offset:            '0',
    machineIdentifier: serverMachineId,
    address,
    port,
    protocol,
    type,
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

/**
 * Haal alle afspeellijsten op uit de Plex-bibliotheek.
 * Filtert op audioafspeellijsten en retourneert metadata.
 * @returns {Promise<Array<{ratingKey, title, duration, trackCount, thumb, smart}>>}
 */
async function getPlexPlaylists() {
  const data = await plexGet('/playlists?playlistType=audio');
  return (data?.MediaContainer?.Metadata || []).map(p => ({
    ratingKey: p.ratingKey,
    title: p.title,
    duration: p.duration,
    trackCount: p.leafCount,
    thumb: p.composite ? `${PLEX_URL}${p.composite}?X-Plex-Token=${PLEX_TOKEN}` : null,
    smart: !!p.smart
  }));
}

/**
 * Haal alle nummers van een Plex-afspeellijst op.
 * @param {string} ratingKey - ratingKey van de afspeellijst
 * @returns {Promise<Array<{ratingKey, title, artist, album, duration, thumb}>>}
 */
async function getPlaylistTracks(ratingKey) {
  const data = await plexGet(`/playlists/${ratingKey}/items`);
  return (data?.MediaContainer?.Metadata || []).map(t => ({
    ratingKey: t.ratingKey,
    title: t.title,
    artist: t.grandparentTitle || t.originalTitle || '',
    album: t.parentTitle || '',
    duration: t.duration,
    thumb: t.parentThumb ? `${PLEX_URL}${t.parentThumb}?X-Plex-Token=${PLEX_TOKEN}` : null
  }));
}

/**
 * Haal alle nummers van een Plex-album op.
 * @param {string} albumRatingKey - ratingKey van het album
 * @returns {Promise<Array<{ratingKey, title, trackNumber, duration, artist}>>}
 */
async function getAlbumTracks(albumRatingKey) {
  const data = await plexGet(`/library/metadata/${albumRatingKey}/children`);
  return (data?.MediaContainer?.Metadata || []).map(t => ({
    ratingKey: t.ratingKey,
    title: t.title,
    trackNumber: t.index,
    duration: t.duration,
    artist: t.grandparentTitle || t.originalTitle || ''
  }));
}

module.exports = {
  plexGet, plexPost, plexPut, syncPlexLibrary,
  artistInPlex, albumInPlex,
  getPlexStatus, getPlexArtistNames, getPlexLibrary,
  getAlbumRatingKey,
  getPlexClients, playOnClient, pauseClient, stopClient, skipNext, skipPrev,
  getPlexPlaylists, getPlaylistTracks, getAlbumTracks,
  PLEX_TOKEN,
};
