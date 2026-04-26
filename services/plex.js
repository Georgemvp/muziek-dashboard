// ── Plex service ─────────────────────────────────────────────────────────────
const { getCache, setCache } = require('../db');
const logger = require('../logger');

const PLEX_URL   = (process.env.PLEX_URL || 'http://localhost:32400').replace(/\/$/, '');
const PLEX_TOKEN = process.env.PLEX_TOKEN || '';

let plexArtists       = new Set();
let plexArtistMap     = new Map(); // lowercase → originele naam
let plexArtistGenres  = new Map(); // lowercase artiestNaam → [genre strings]
let plexAlbums        = new Set();
let plexAlbumsNorm    = new Set();
let plexAlbumsByArtist = new Map(); // normArtist → Set van normAlbum strings (lookup voor snelle albumInPlex checks)
let plexTrackCount    = 0; // totaal aantal tracks in bibliotheek
let plexLastSync      = 0;
let plexSyncOk        = false;
let plexLibrary       = []; // [{artist, album}] originele casing, gesorteerd op artiest

// ── Herstel vanuit SQLite bij opstarten ────────────────────────────────────
const cached = getCache('plex', 3_600_000);
if (cached) {
  plexArtists    = new Set(cached.artists    || []);
  plexArtistMap  = new Map(Object.entries(cached.artistMap || {}));
  plexArtistGenres = new Map(Object.entries(cached.artistGenres || {}));
  plexAlbums     = new Set(cached.albums     || []);
  plexAlbumsNorm = new Set(cached.albumsNorm || []);
  if (cached.albumsByArtist) {
    plexAlbumsByArtist = new Map(
      Object.entries(cached.albumsByArtist).map(([k, v]) => [k, new Set(v)])
    );
  }
  plexLibrary    = cached.library  || [];
  plexTrackCount = cached.trackCount || 0;
  plexLastSync   = cached.lastSync || 0;
  plexSyncOk     = cached.syncOk   || false;
  logger.info({ artists: plexArtists.size, albums: plexLibrary.length, tracks: plexTrackCount }, 'Plex: geladen uit SQLite-cache');
}

/** Normaliseer albumtitels voor fuzzy matching (Plex vs MusicBrainz). */
function normStr(s) {
  return (s || '').toLowerCase()
    .replace(/\(.*?\)/g, '').replace(/\[.*?\]/g, '')
    .replace(/\b(deluxe|edition|remastered|expanded|anniversary|bonus|special|version|disc|disk|vol|volume)\b/g, '')
    .replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
}

/**
 * Eenvoudige fuzzy score functie.
 * Berekent een match-score tussen query en target (0-1).
 * Exact match = 1.0, substring match = 0.9, woord-prefix match = 0.8, etc.
 */
function fuzzyScore(query, target) {
  const q = (query || '').toLowerCase().trim();
  const t = (target || '').toLowerCase().trim();

  if (!q || !t) return 0;
  if (q === t) return 1.0;
  if (t.includes(q)) return 0.95; // substring match

  // Woord-prefix matching (bijv. "dark side" → "dark side of the moon")
  const qWords = q.split(/\s+/);
  const tWords = t.split(/\s+/);

  let matchedWords = 0;
  for (const qWord of qWords) {
    if (tWords.some(tWord => tWord.startsWith(qWord))) {
      matchedWords++;
    }
  }

  if (matchedWords === qWords.length) {
    return 0.85; // alle woorden matchen als prefix
  }

  // Levenshtein-achtige afstand (eenvoudig)
  if (matchedWords > 0) {
    return 0.5 + (matchedWords / qWords.length) * 0.3;
  }

  // Character overlap
  const qChars = new Set(q.replace(/\s+/g, ''));
  const tChars = new Set(t.replace(/\s+/g, ''));
  const overlap = [...qChars].filter(c => tChars.has(c)).length;

  if (overlap > 0) {
    return (overlap / Math.max(qChars.size, tChars.size)) * 0.4;
  }

  return 0;
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

    const [artistData, albumData, trackCountData] = await Promise.all([
      plexGet(`/library/sections/${music.key}/all?type=8`),
      plexGet(`/library/sections/${music.key}/all?type=9`),
      plexGet(`/library/sections/${music.key}/all?type=10&X-Plex-Container-Start=0&X-Plex-Container-Size=0`)
    ]);

    const artistMeta = artistData?.MediaContainer?.Metadata || [];
    plexArtists   = new Set(artistMeta.map(a => a.title.toLowerCase()));
    plexArtistMap = new Map(artistMeta.map(a => [a.title.toLowerCase(), a.title]));

    // Bouw plexArtistGenres Map: lowercase artiestNaam → [genre strings]
    plexArtistGenres = new Map();
    for (const a of artistMeta) {
      const genres = (a.Genre || []).map(g => g.tag || g).filter(Boolean);
      if (genres.length) {
        plexArtistGenres.set(a.title.toLowerCase(), genres);
      }
    }

    const albumMeta = albumData?.MediaContainer?.Metadata || [];
    plexTrackCount = trackCountData?.MediaContainer?.totalSize || 0;
    plexAlbums     = new Set(albumMeta.map(a => `${(a.parentTitle || '').toLowerCase()}||${a.title.toLowerCase()}`));
    plexAlbumsNorm = new Set(albumMeta.map(a => `${normStr(a.parentTitle)}||${normStr(a.title)}`));
    plexLibrary    = albumMeta
      .map(a => ({ artist: a.parentTitle || '', album: a.title || '', ratingKey: a.ratingKey || null, thumb: a.thumb || null, addedAt: a.addedAt || 0 }))
      .filter(x => x.artist && x.album)
      .sort((a, b) => a.artist.localeCompare(b.artist, 'nl', { sensitivity: 'base' }));

    // Bouw lookup map voor snelle albumInPlex checks
    plexAlbumsByArtist = new Map();
    for (const entry of plexAlbumsNorm) {
      const sepIdx = entry.indexOf('||');
      const artist = entry.substring(0, sepIdx);
      const album = entry.substring(sepIdx + 2);
      if (!plexAlbumsByArtist.has(artist)) {
        plexAlbumsByArtist.set(artist, new Set());
      }
      plexAlbumsByArtist.get(artist).add(album);
    }

    plexLastSync   = Date.now();
    plexSyncOk     = true;

    setCache('plex', {
      artists:    [...plexArtists],
      artistMap:  Object.fromEntries(plexArtistMap),
      artistGenres: Object.fromEntries(plexArtistGenres),
      albums:     [...plexAlbums],
      albumsNorm: [...plexAlbumsNorm],
      albumsByArtist: Object.fromEntries(
        [...plexAlbumsByArtist].map(([k, v]) => [k, [...v]])
      ),
      library:    plexLibrary,
      trackCount: plexTrackCount,
      lastSync:   plexLastSync,
      syncOk:     plexSyncOk
    });

    logger.info({ artists: plexArtists.size, albums: plexAlbums.size, tracks: plexTrackCount }, 'Plex: gesynchroniseerd');
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

  // Zoek alle artiesten die matchen (exact of substring)
  for (const [plexArtist, albums] of plexAlbumsByArtist) {
    const artistMatches = normArtist === plexArtist ||
                         plexArtist.includes(normArtist) ||
                         normArtist.includes(plexArtist);
    if (!artistMatches) continue;

    // Check albums van deze artiest
    for (const plexAlbum of albums) {
      const albumMatches = normAlbum === plexAlbum ||
                          plexAlbum.includes(normAlbum) ||
                          normAlbum.includes(plexAlbum);
      if (albumMatches) return true;
    }
  }

  return false;
}

function getPlexStatus() {
  return { ok: plexSyncOk, artistCount: plexArtists.size, albumCount: plexAlbums.size, trackCount: plexTrackCount, lastSync: plexLastSync };
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
  // ── Speciale behandeling voor web-browser ──────────────────────────────
  // '__web__' is een speciale machineId voor de lokale browser. Dit kan niet
  // extern bestuurd worden via de Plex API. De frontend moet dit afhandelen.
  if (machineId === '__web__') {
    throw new Error(
      `Plex web player kan niet op afstand bestuurd worden. ` +
      `Selecteer een ander apparaat (Plexamp, Plex Media Player, etc.).`
    );
  }

  const cmdId  = String(++_commandId);
  const params = new URLSearchParams({ commandID: cmdId, ...extraParams });

  // ── Aanpak 1: relay via Plex server ────────────────────────────────────
  // Werkt alleen als de client een actieve WebSocket-verbinding heeft met de server.
  // Stuur extra headers mee die Plex nodig heeft voor het companion-protocol.
  let relayOk = false;
  try {
    const res = await fetch(`${PLEX_URL}/player/playback/${command}?${params}`, {
      headers: {
        'X-Plex-Token':                    PLEX_TOKEN,
        'X-Plex-Target-Client-Identifier': machineId,
        'X-Plex-Client-Identifier':        'lastfm-app-server',
        'X-Plex-Device-Name':              'LastFM App',
        'X-Plex-Product':                  'LastFM App',
        'Accept':                          'application/json',
      },
      signal: AbortSignal.timeout(5_000),
    });
    if (res.ok || res.status === 204) {
      logger.info({ command, machineId }, 'Plex relay gelukt via server');
      return true;
    }
    const body = await res.text().catch(() => '');
    logger.warn({ status: res.status, command, body }, 'Plex relay niet succesvol, probeer direct');
  } catch (e) {
    logger.warn({ err: e.message, command }, 'Plex relay mislukt, probeer direct');
  }

  // ── Aanpak 2: direct naar client-IP (fallback) ─────────────────────────
  // Ververs de client-cache zodat we het meest actuele host/port hebben.
  let clients = _clientsCache || [];
  const cacheAge = Date.now() - _clientsCacheTime;
  if (!clients.length || cacheAge > 60_000) {
    try { clients = await getPlexClients(true); } catch {}
  }
  const client = clients.find(c => c.machineId === machineId);

  if (!client?.host) {
    throw new Error(
      `Plex: geen route naar client '${machineId}'. ` +
      `Relay mislukt (server WebSocket niet actief) en geen client-IP beschikbaar. ` +
      `Controleer of de Plex player actief is en zichtbaar via /api/plex/clients.`
    );
  }

  // Probeer poort 32500 (companion HTTP) én de poort uit de sessie.
  const portsToTry = [...new Set([32500, client.port || 32500])];
  let lastErr = null;
  for (const port of portsToTry) {
    try {
      const directParams = new URLSearchParams({ 'X-Plex-Token': PLEX_TOKEN, commandID: cmdId, ...extraParams });
      const res2 = await fetch(
        `http://${client.host}:${port}/player/playback/${command}?${directParams}`,
        {
          headers: {
            'X-Plex-Token':             PLEX_TOKEN,
            'X-Plex-Client-Identifier': 'lastfm-app-server',
            'Accept':                   'application/json',
          },
          signal: AbortSignal.timeout(5_000),
        }
      );
      if (res2.ok || res2.status === 204) {
        logger.info({ command, machineId, host: client.host, port }, 'Plex direct commando gelukt');
        return true;
      }
      lastErr = new Error(`Plex direct HTTP ${res2.status} op poort ${port}`);
    } catch (e) {
      lastErr = e;
      logger.warn({ err: e.message, host: client.host, port, command }, 'Plex direct poging mislukt');
    }
  }
  throw lastErr || new Error('Plex direct commando mislukt');
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

/** Geef een rating aan een item in Plex (album, track, etc).
 *  @param {string} ratingKey - ratingKey van het item
 *  @param {number} rating - rating van 0 tot 10 (0 = geen rating)
 *  @returns {Promise<boolean>} true bij succes
 */
async function rateItem(ratingKey, rating) {
  const url = `/:/rate?key=${ratingKey}&identifier=com.plexapp.plugins.library&rating=${rating}`;
  await plexPut(url);
  return true;
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

// ── Plex library scan trigger ──────────────────────────────────────────────────
let _musicSectionKey = null;
async function triggerPlexScan() {
  if (!PLEX_TOKEN) return;
  if (!_musicSectionKey) {
    const sections = await plexGet('/library/sections');
    const music = (sections?.MediaContainer?.Directory || []).find(s => s.type === 'artist');
    if (music) _musicSectionKey = music.key;
  }
  if (_musicSectionKey) {
    await fetch(`${PLEX_URL}/library/sections/${_musicSectionKey}/refresh`, {
      method: 'POST',
      headers: { 'X-Plex-Token': PLEX_TOKEN },
      signal: AbortSignal.timeout(5_000)
    });
    logger.info({ section: _musicSectionKey }, 'Plex: library scan getriggerd');
  }
}

/**
 * Zoek parallel in artiesten, albums, nummers en afspeellijsten.
 * @param {string} q - zoekterm (minimaal 2 karakters)
 * @param {number} limit - max resultaten per categorie (default: 5)
 * @returns {Promise<{artists, albums, tracks, playlists}>}
 */
async function searchPlexLibrary(q, limit = 5) {
  if (!q || q.length < 2) {
    return { artists: [], albums: [], tracks: [], playlists: [] };
  }

  const query = q.toLowerCase().trim();
  const results = { artists: [], albums: [], tracks: [], playlists: [] };

  try {
    // Parallel requests
    const [artistRes, albumRes, tracksRes, playlistRes] = await Promise.allSettled([
      _searchArtists(query, limit),
      _searchAlbums(query, limit),
      _searchTracks(query, limit),
      _searchPlaylists(query, limit)
    ]);

    if (artistRes.status === 'fulfilled') results.artists = artistRes.value;
    if (albumRes.status === 'fulfilled') results.albums = albumRes.value;
    if (tracksRes.status === 'fulfilled') results.tracks = tracksRes.value;
    if (playlistRes.status === 'fulfilled') results.playlists = playlistRes.value;
  } catch (e) {
    logger.warn({ err: e, query }, 'Plex search mislukt');
  }

  return results;
}

/**
 * Zoek artiesten in de gecachte Plex-bibliotheek.
 * Retourneert [{ratingKey, title, thumb}]
 */
async function _searchArtists(query, limit) {
  const results = [];

  // Artiesten uit gecachte map
  for (const [lowerName, origName] of plexArtistMap) {
    const score = fuzzyScore(query, origName);
    if (score > 0) {
      results.push({ name: origName, score });
    }
  }

  // Sorteer op score (aflopend) en beperk tot limit
  results.sort((a, b) => b.score - a.score);

  // Haal ratingKeys op voor de top results
  const topResults = results.slice(0, limit);
  const artists = [];

  for (const item of topResults) {
    try {
      // Query Plex voor de ratingKey van deze artiest
      const sections = await plexGet('/library/sections');
      const music = (sections?.MediaContainer?.Directory || []).find(s => s.type === 'artist');
      if (!music) continue;

      const data = await plexGet(`/library/sections/${music.key}/all?type=8&title=${encodeURIComponent(item.name)}`);
      const artistMeta = data?.MediaContainer?.Metadata?.[0];
      if (artistMeta) {
        artists.push({
          ratingKey: artistMeta.ratingKey,
          title: item.name,
          thumb: artistMeta.thumb ? `${PLEX_URL}${artistMeta.thumb}?X-Plex-Token=${PLEX_TOKEN}` : null
        });
      }
    } catch (e) {
      logger.warn({ err: e, artist: item.name }, 'Artiest ratingKey ophalen mislukt');
    }
  }

  return artists;
}

/**
 * Zoek albums in de gecachte Plex-bibliotheek.
 * Retourneert [{ratingKey, title, artist, thumb}]
 */
async function _searchAlbums(query, limit) {
  const results = [];

  // Albums uit plexLibrary
  for (const album of plexLibrary) {
    const albumScore = fuzzyScore(query, album.album);
    const artistScore = fuzzyScore(query, album.artist);
    const score = Math.max(albumScore, artistScore);

    if (score > 0) {
      results.push({
        ...album,
        score
      });
    }
  }

  // Sorteer op score en beperk tot limit
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit).map(a => ({
    ratingKey: a.ratingKey,
    title: a.album,
    artist: a.artist,
    thumb: a.thumb ? (a.thumb.startsWith('http') ? a.thumb : `${PLEX_URL}${a.thumb}?X-Plex-Token=${PLEX_TOKEN}`) : null
  }));
}

/**
 * Zoek nummers via Plex API.
 * Retourneert [{ratingKey, title, artist, album, duration, thumb}]
 */
async function _searchTracks(query, limit) {
  try {
    // Haal muziek-section key op
    const sections = await plexGet('/library/sections');
    const music = (sections?.MediaContainer?.Directory || []).find(s => s.type === 'artist');
    if (!music) return [];

    // Zoek via Plex API (type=10 = track)
    const data = await plexGet(`/library/sections/${music.key}/search?type=10&query=${encodeURIComponent(query)}&limit=${limit * 2}`);
    const tracks = data?.MediaContainer?.Metadata || [];

    return tracks.slice(0, limit).map(t => ({
      ratingKey: t.ratingKey,
      title: t.title,
      artist: t.grandparentTitle || t.originalTitle || '',
      album: t.parentTitle || '',
      duration: t.duration || null,
      thumb: t.parentThumb ? `${PLEX_URL}${t.parentThumb}?X-Plex-Token=${PLEX_TOKEN}` : null
    }));
  } catch (e) {
    logger.warn({ err: e }, 'Plex track zoeken mislukt');
    return [];
  }
}

/**
 * Zoek afspeellijsten.
 * Retourneert [{ratingKey, title, trackCount, thumb}]
 */
async function _searchPlaylists(query, limit) {
  try {
    const playlists = await getPlexPlaylists();
    const results = [];

    for (const playlist of playlists) {
      const score = fuzzyScore(query, playlist.title);
      if (score > 0) {
        results.push({ ...playlist, score });
      }
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, limit).map(p => ({
      ratingKey: p.ratingKey,
      title: p.title,
      trackCount: p.trackCount || 0,
      thumb: p.thumb
    }));
  } catch (e) {
    logger.warn({ err: e }, 'Plex playlist zoeken mislukt');
    return [];
  }
}

// ── Play history & analytics ──────────────────────────────────────────────────

/** Converteert een periode-string naar Unix timestamp (seconden). */
function periodToTimestamp(period) {
  const now = new Date();

  // Speciale behandeling voor 'today'
  if (period === 'today') {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    return Math.floor(todayStart.getTime() / 1000);
  }

  let days = 0;

  switch (period) {
    case '7day':
      days = 7;
      break;
    case '1month':
      days = 30;
      break;
    case '3month':
      days = 90;
      break;
    case '12month':
      days = 365;
      break;
    case 'overall':
      days = 365 * 10; // 10 jaren terug
      break;
    default:
      days = 365; // default 1 jaar
  }

  const timestamp = Math.floor((Date.now() - days * 24 * 60 * 60 * 1000) / 1000);
  return timestamp;
}

/**
 * Haalt play history op van de Plex API met paginatie.
 * Retourneert array van {title, artist, album, viewedAt, duration, thumb, ratingKey}
 * Gecached voor 10 minuten per periode.
 *
 * Strategieën om volledigheid te garanderen:
 * 1. Haalt ALLE history op ZONDER librarySectionID filter (blokkeert soms resultaten)
 * 2. Haalt ALLE history op ZONDER viewedAt> filter (niet op alle Plex versies ondersteund)
 * 3. Filtert client-side op type === 'track' EN timestamp
 * 4. Fallback: als leeg, retry ZONDER sort parameter (sommige versies ondersteunen dit niet)
 */
async function getPlayHistory(period = '7day') {
  const cacheKey = `play_history_${period}`;
  const cached = getCache(cacheKey, 600_000); // 10 minuten cache
  if (cached) return cached;

  try {
    const sinceTimestamp = periodToTimestamp(period);
    const history = [];
    let start = 0;
    const pageSize = 500;
    let hasMore = true;
    let useSort = true; // Flag voor retry zonder sort parameter

    while (hasMore) {
      // Bouw parameters: alleen paginatie + optioneel sort
      const params = new URLSearchParams({
        'X-Plex-Container-Start': start,
        'X-Plex-Container-Size': pageSize
      });

      // Voeg sort toe alleen als useSort true is
      if (useSort) {
        params.append('sort', 'viewedAt:desc');
      }

      const path = `/status/sessions/history/all?${params}`;

      // Log de volledige URL voor debugging
      logger.info({ url: `${PLEX_URL}${path}` }, 'Plex play history request');

      const data = await plexGet(path);
      const metadata = data?.MediaContainer?.Metadata || [];

      // Fallback: als geen resultaten en we nog sort gebruikten, probeer zonder
      if (metadata.length === 0) {
        if (useSort && start === 0) {
          logger.info('Plex play history is leeg met sort, retry zonder sort parameter');
          useSort = false;
          continue; // Retry de loop met useSort=false
        }
        hasMore = false;
        break;
      }

      for (const m of metadata) {
        // Filter client-side op muziek-items (type === 'track')
        if (m.type !== 'track') {
          continue;
        }

        // Filter client-side op timestamp
        if (m.viewedAt && m.viewedAt < sinceTimestamp) {
          // Eenmaal we items hebben die ouder zijn dan sinceTimestamp,
          // kunnen we stoppen (geen nieuwere items meer verwacht)
          hasMore = false;
          break;
        }

        // Zet relatieve thumb-paden om naar volledige Plex URLs met token
        const thumbPath = m.parentThumb || m.thumb || null;
        const thumb = thumbPath
          ? `${PLEX_URL}${thumbPath}?X-Plex-Token=${PLEX_TOKEN}`
          : null;

        history.push({
          title: m.title || '',
          artist: m.grandparentTitle || m.originalTitle || '',
          album: m.parentTitle || '',
          viewedAt: m.viewedAt || 0,
          duration: m.duration || 0,
          thumb,
          ratingKey: m.ratingKey || null
        });
      }

      // Controleer of er meer pagina's zijn
      if (metadata.length < pageSize) {
        hasMore = false;
      } else {
        start += pageSize;
      }
    }

    logger.info({
      count: history.length,
      period,
      sinceTimestamp
    }, 'Plex play history opgehaald');

    setCache(cacheKey, history);
    return history;
  } catch (e) {
    logger.warn({ err: e }, 'Play history ophalen mislukt');
    return [];
  }
}

/**
 * Aggregeert de meest gespeelde artiesten uit play history.
 * @param {Array} history - array van history items
 * @param {number} limit - max aantal artiesten (default 20)
 * @returns {Array<{name, playcount}>}
 */
function aggregateTopArtists(history, limit = 20) {
  const artistCounts = new Map();

  for (const item of history) {
    if (!item.artist) continue;
    const count = artistCounts.get(item.artist) || 0;
    artistCounts.set(item.artist, count + 1);
  }

  const result = [...artistCounts.entries()]
    .map(([name, playcount]) => ({ name, playcount }))
    .sort((a, b) => b.playcount - a.playcount)
    .slice(0, limit);

  return result;
}

/**
 * Aggregeert de meest gespeelde tracks uit play history.
 * @param {Array} history - array van history items
 * @param {number} limit - max aantal tracks (default 20)
 * @returns {Array<{title, artist, album, playcount, thumb}>}
 */
function aggregateTopTracks(history, limit = 20) {
  const trackCounts = new Map();

  for (const item of history) {
    if (!item.title || !item.artist) continue;
    const key = `${item.artist}||${item.title}`;
    const existing = trackCounts.get(key) || {
      title: item.title,
      artist: item.artist,
      album: item.album || '',
      playcount: 0,
      thumb: item.thumb || null
    };
    existing.playcount += 1;
    trackCounts.set(key, existing);
  }

  const result = [...trackCounts.values()]
    .sort((a, b) => b.playcount - a.playcount)
    .slice(0, limit);

  return result;
}

/**
 * Groepeert play history per kalenderdatum.
 * @param {Array} history - array van history items
 * @param {number} days - aantal dagen terug (default 28)
 * @returns {Array<{date, count, minutes}>} gesorteerd van recent naar oud
 */
function aggregateDailyPlays(history, days = 28) {
  const now = new Date();
  const dailyMap = new Map();

  // Initialiseer alle dagen met 0
  for (let i = 0; i < days; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    dailyMap.set(dateStr, { date: dateStr, count: 0, minutes: 0 });
  }

  // Tel plays en minuten per dag
  for (const item of history) {
    if (!item.viewedAt) continue;
    const date = new Date(item.viewedAt * 1000); // viewedAt is in seconden
    const dateStr = date.toISOString().split('T')[0];

    if (dailyMap.has(dateStr)) {
      const entry = dailyMap.get(dateStr);
      entry.count += 1;
      entry.minutes += (item.duration > 0) ? Math.ceil(item.duration / 60000) : 3.5;
    }
  }

  // Retourneer gesorteerd van recent naar oud
  const result = [...dailyMap.values()]
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  return result;
}

/**
 * Verrijkt een array van top-artiesten met thumbnail-URLs.
 * Cache de resultaten in memory (TTL: 1 uur).
 * @param {Array} topArtists - array van {name, playcount} objecten
 * @returns {Promise<Array<{name, playcount, thumb}>>}
 */
async function enrichArtistsWithThumbs(topArtists) {
  if (!topArtists || topArtists.length === 0) return topArtists;

  const cacheKey = 'plex:artist_thumbs_cache';
  const cached = getCache(cacheKey, 3_600_000); // 1 uur cache
  const thumbCache = cached ? new Map(Object.entries(cached)) : new Map();

  const plexStreamUrl = process.env.PLEX_URL_EXTERNAL || PLEX_URL;
  const result = [];

  try {
    // Haal muziek-section key op
    const sections = await plexGet('/library/sections');
    const music = (sections?.MediaContainer?.Directory || []).find(s => s.type === 'artist');
    if (!music) {
      logger.warn('Plex: geen muziekbibliotheek gevonden voor artist enrichment');
      return topArtists;
    }

    for (const artist of topArtists) {
      // Check cache eerst
      if (thumbCache.has(artist.name)) {
        result.push({
          ...artist,
          thumb: thumbCache.get(artist.name)
        });
        continue;
      }

      try {
        // Query Plex voor de artiest
        const data = await plexGet(`/library/sections/${music.key}/all?type=8&title=${encodeURIComponent(artist.name)}`);
        const artistMeta = data?.MediaContainer?.Metadata?.[0];

        if (artistMeta?.thumb) {
          const thumbUrl = `${plexStreamUrl}${artistMeta.thumb}?X-Plex-Token=${PLEX_TOKEN}`;
          thumbCache.set(artist.name, thumbUrl);
          result.push({
            ...artist,
            thumb: thumbUrl
          });
        } else {
          // Geen thumb gevonden
          thumbCache.set(artist.name, null);
          result.push({
            ...artist,
            thumb: null
          });
        }
      } catch (e) {
        logger.warn({ err: e, artist: artist.name }, 'Artist thumb ophalen mislukt');
        thumbCache.set(artist.name, null);
        result.push({
          ...artist,
          thumb: null
        });
      }
    }

    // Sla cache op
    setCache(cacheKey, Object.fromEntries(thumbCache));
    return result;
  } catch (e) {
    logger.warn({ err: e }, 'enrichArtistsWithThumbs mislukt');
    return topArtists;
  }
}

/**
 * Haalt genres op voor een array van top artiesten.
 * Gebruikt de gecachte plexArtistGenres Map om N+1 API calls te vermijden.
 * @param {Array} topArtists - array van {name, playcount} objecten
 * @returns {Array<{name, count}>} top 8 genres gewogen naar playcount
 */
function getGenresFromPlex(topArtists) {
  const genreCounts = new Map();

  for (const artist of topArtists) {
    const genres = plexArtistGenres.get(artist.name.toLowerCase()) || [];
    for (const genre of genres) {
      const count = (genreCounts.get(genre) || 0) + (artist.playcount || 1);
      genreCounts.set(genre, count);
    }
  }

  // Sorteer op count aflopend en beperk tot 8
  const result = [...genreCounts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return result;
}

/**
 * Zoekt artiesten in Plex met dezelfde genres als de gegeven artiest.
 * Gebruikt de in-memory plexArtistGenres cache.
 * Handig als Last.fm API faalt.
 *
 * @param {string} artistName - Naam van de artiest waarvan we genres willen vinden
 * @param {number} limit - Hoeveel artiesten teruggeven (default 6)
 * @returns {Promise<Array>} Array van artiest-objecten met { name, ... }
 */
async function getPlexArtistsByGenre(artistName, limit = 6) {
  const queryNorm = (artistName || '').toLowerCase();
  const genres = plexArtistGenres.get(queryNorm) || [];

  if (!genres.length) {
    // Geen genres gevonden voor deze artiest → lege list
    return [];
  }

  // Zoek alle andere artiesten met dezelfde genres
  const candidates = [];
  for (const [artistKey, artistGenres] of plexArtistGenres.entries()) {
    if (artistKey === queryNorm) continue; // Skip de original artiest zelf

    // Check overlap in genres
    const overlap = artistGenres.filter(g => genres.includes(g));
    if (overlap.length > 0) {
      const originalName = plexArtistMap.get(artistKey) || artistKey;
      candidates.push({
        name: originalName,
        genres: overlap,
        overlapCount: overlap.length
      });
    }
  }

  // Sorteer op overlap-count (meest gelijkaardig eerst) en return top N
  return candidates
    .sort((a, b) => b.overlapCount - a.overlapCount)
    .slice(0, limit);
}

module.exports = {
  plexGet, plexPost, plexPut, syncPlexLibrary,
  artistInPlex, albumInPlex,
  getPlexStatus, getPlexArtistNames, getPlexLibrary,
  getAlbumRatingKey,
  getPlexClients, playOnClient, pauseClient, stopClient, skipNext, skipPrev,
  getPlexPlaylists, getPlaylistTracks, getAlbumTracks,
  triggerPlexScan,
  rateItem,
  searchPlexLibrary,
  periodToTimestamp, getPlayHistory, aggregateTopArtists, aggregateTopTracks, aggregateDailyPlays, enrichArtistsWithThumbs, getGenresFromPlex, getPlexArtistsByGenre,
  PLEX_TOKEN,
  PLEX_URL,
};
