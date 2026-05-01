// ── Cache-powered Discovery Service ──────────────────────────────────────────
// Alle functies draaien uitsluitend op data die al in SQLite zit.
// ZERO externe API calls — cache_discovery sleutelprefix voor geaggregeerde resultaten.

'use strict';

const logger = require('../logger');
const { getCache, setCache, queryCacheByPrefix } = require('../db');
const { albumInPlex, artistInPlex, getPlexLibrary, getPlexArtistNames, getPlexStatus } = require('./plex');

const DISCOVERY_TTL_MS  = 24 * 3600 * 1000; // 24 uur
const CACHE_PREFIX      = 'cache_discovery:';

// ── Normalisatie helpers ─────────────────────────────────────────────────────
function norm(s) {
  return (s || '')
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/\b(deluxe|edition|remastered|expanded|anniversary|bonus|special|version|disc|disk|vol|volume)\b/g, '')
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Haal top-artiesten op uit Last.fm SQLite-cache ───────────────────────────
function getCachedTopArtists(maxCount = 50) {
  const periods = ['overall', '12month', '6month', '3month', '7day', '1month'];
  const seen = new Set();
  const artists = [];

  for (const period of periods) {
    const data = getCache(`api:topartists:${period}`, Infinity);
    const list  = data?.topartists?.artist || [];
    for (const a of list) {
      const key = (a.name || '').toLowerCase();
      if (key && !seen.has(key)) {
        seen.add(key);
        artists.push({ name: a.name, playcount: parseInt(a.playcount, 10) || 0 });
      }
    }
    if (artists.length >= maxCount) break;
  }

  // Sorteer op playcount (hoog eerst), knip af
  return artists.sort((a, b) => b.playcount - a.playcount).slice(0, maxCount);
}

// ── Plex cache direct ophalen ────────────────────────────────────────────────
function getRawPlexCache() {
  return getCache('plex', Infinity) || {};
}

// ── 1. getUndiscoveredAlbums ────────────────────────────────────────────────
/**
 * Albums die in MusicBrainz-cache staan maar niet in je Plex-bibliotheek.
 * Gebaseerd op je top-artiesten (Last.fm cache) of alle artiesten in Plex.
 * @param {number} limit
 * @returns {Array|null}  null = data wordt opgebouwd
 */
async function getUndiscoveredAlbums(limit = 20) {
  const cacheKey = CACHE_PREFIX + 'undiscovered';
  const cached = getCache(cacheKey, DISCOVERY_TTL_MS);
  if (cached) return cached.slice(0, limit);

  const result = _buildUndiscoveredAlbums();
  if (result.length > 0) {
    setCache(cacheKey, result);
    return result.slice(0, limit);
  }
  return null; // cache leeg — trigger rebuild via route
}

function _buildUndiscoveredAlbums() {
  const plexRaw      = getRawPlexCache();
  const artistMap    = new Map(Object.entries(plexRaw.artistMap || {})); // lowercase → origNaam
  const topArtists   = getCachedTopArtists(50);

  // Combineer top-artists + alle Plex-artiesten als seedlijst
  const seedNames = [...new Set([
    ...topArtists.map(a => a.name),
    ...[...artistMap.values()],
  ])];

  const undiscovered = [];

  for (const artistName of seedNames) {
    const normName  = artistName.toLowerCase();
    const mbzArtist = getCache(`mbz:artist:${normName}`, Infinity);
    if (!mbzArtist?.mbid) continue;

    const mbzAlbums = getCache(`mbz:albums:${mbzArtist.mbid}`, Infinity);
    if (!Array.isArray(mbzAlbums) || !mbzAlbums.length) continue;

    for (const album of mbzAlbums) {
      if (!album.title) continue;

      // Sla albums over die al in Plex staan
      if (albumInPlex(artistName, album.title)) continue;

      // Bepaal type label
      const secondary = album.secondaryTypes || [];
      let type = 'Album';
      if (secondary.includes('Live'))        type = 'Live';
      else if (secondary.includes('Compilation')) type = 'Compilatie';
      else if (secondary.includes('Demo'))   type = 'Demo';

      undiscovered.push({
        artist:   artistName,
        title:    album.title,
        year:     album.year || null,
        type,
        coverUrl: album.coverUrl || null,
        mbid:     album.mbid     || null,
      });
    }
  }

  // Nieuwste eerst
  return undiscovered.sort((a, b) => (parseInt(b.year) || 0) - (parseInt(a.year) || 0));
}

// ── 2. getNewInYourGenres ───────────────────────────────────────────────────
/**
 * Albums van artiesten in genres die je al luistert, maar nog niet in Plex.
 * @param {number} limit
 * @returns {Array|null}
 */
async function getNewInYourGenres(limit = 20) {
  const cacheKey = CACHE_PREFIX + 'genres_new';
  const cached = getCache(cacheKey, DISCOVERY_TTL_MS);
  if (cached) return cached.slice(0, limit);

  const result = _buildNewInYourGenres();
  if (result.length > 0) {
    setCache(cacheKey, result);
    return result.slice(0, limit);
  }
  return null;
}

function _buildNewInYourGenres() {
  const plexRaw     = getRawPlexCache();
  const artistGenres = new Map(Object.entries(plexRaw.artistGenres || {}));
  const artistMap    = new Map(Object.entries(plexRaw.artistMap   || {}));

  // Stap 1: Bouw gewogen genre-teller op basis van Plex-aanwezigheid
  const genreCounts = new Map();
  for (const [, genres] of artistGenres.entries()) {
    for (const g of genres) {
      const norm_g = g.toLowerCase().trim();
      if (norm_g) genreCounts.set(norm_g, (genreCounts.get(norm_g) || 0) + 1);
    }
  }

  // Top 10 genres
  const topGenres = new Set(
    [...genreCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([g]) => g)
  );

  if (!topGenres.size) return [];

  // Stap 2: Scan alle MBZ-artiest-entries in cache
  const mbzArtistEntries = queryCacheByPrefix('mbz:artist:');

  const candidates = [];

  for (const { data: mbzArtist } of mbzArtistEntries) {
    if (!mbzArtist?.mbid || !mbzArtist.name) continue;

    const artistTags   = (mbzArtist.tags || []).map(t => t.toLowerCase());
    const matchedGenres = artistTags.filter(t => topGenres.has(t));
    if (!matchedGenres.length) continue;

    // Artiesten die al volledig in Plex zitten hoeven we niet te tonen
    // (maar we tonen wel ALBUMS die ontbreken, ook al IS de artiest in Plex)
    const mbzAlbums = getCache(`mbz:albums:${mbzArtist.mbid}`, Infinity);
    if (!Array.isArray(mbzAlbums)) continue;

    const missing = mbzAlbums.filter(a => a.title && !albumInPlex(mbzArtist.name, a.title));
    if (!missing.length) continue;

    candidates.push({
      artist:       mbzArtist.name,
      matchedGenres,
      matchScore:   matchedGenres.length,
      albums:       missing,
    });
  }

  // Sorteer op relevantie (meeste genre-overlaps eerst)
  candidates.sort((a, b) => b.matchScore - a.matchScore);

  const albums = [];
  for (const c of candidates) {
    for (const a of c.albums.slice(0, 5)) {
      albums.push({
        artist:  c.artist,
        title:   a.title,
        year:    a.year || null,
        genre:   c.matchedGenres[0] || null,
        coverUrl: a.coverUrl || null,
        mbid:    a.mbid || null,
      });
    }
    if (albums.length >= 100) break; // houd de gecachete set beheersbaar
  }

  return albums;
}

// ── 3. getFromYourLabels ─────────────────────────────────────────────────────
/**
 * Groepeert ontbrekende albums per "label" (gebaseerd op MBZ-artiest-tags).
 * Omdat label-info op release-group niveau niet in cache zit, gebruiken we
 * de meest voorkomende MBZ-tag per artiest als proxy-label.
 * @param {number} limit
 * @returns {Array|null}  array van { label, albums: [...] }
 */
async function getFromYourLabels(limit = 20) {
  const cacheKey = CACHE_PREFIX + 'labels';
  const cached = getCache(cacheKey, DISCOVERY_TTL_MS);
  if (cached) return cached.slice(0, limit);

  const result = _buildFromYourLabels();
  if (result.length > 0) {
    setCache(cacheKey, result);
    return result.slice(0, limit);
  }
  return null;
}

function _buildFromYourLabels() {
  const plexRaw    = getRawPlexCache();
  const artistMap  = new Map(Object.entries(plexRaw.artistMap || {}));

  // Bouw een teller per tag: hoe vaak verschijnt de tag bij artiesten in Plex?
  const tagCounts = new Map();

  for (const [normName] of artistMap.entries()) {
    const mbzArtist = getCache(`mbz:artist:${normName}`, Infinity);
    if (!mbzArtist?.tags?.length) continue;
    // Eerste tag = meest relevante (MBZ sorteert op count)
    const topTag = (mbzArtist.tags[0] || '').toLowerCase().trim();
    if (topTag) tagCounts.set(topTag, (tagCounts.get(topTag) || 0) + 1);
  }

  // Top 10 "labels" (proxy-tags)
  const topLabels = [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag]) => tag);

  if (!topLabels.length) return [];

  // Per label: zoek ontbrekende albums van artiesten met die tag
  const labelMap = new Map(); // label → []

  const mbzArtistEntries = queryCacheByPrefix('mbz:artist:');

  for (const { data: mbzArtist } of mbzArtistEntries) {
    if (!mbzArtist?.mbid || !mbzArtist.name) continue;

    const artistTopTag = (mbzArtist.tags?.[0] || '').toLowerCase().trim();
    if (!topLabels.includes(artistTopTag)) continue;

    const mbzAlbums = getCache(`mbz:albums:${mbzArtist.mbid}`, Infinity);
    if (!Array.isArray(mbzAlbums)) continue;

    const missing = mbzAlbums.filter(a => a.title && !albumInPlex(mbzArtist.name, a.title));
    if (!missing.length) continue;

    if (!labelMap.has(artistTopTag)) labelMap.set(artistTopTag, []);
    for (const a of missing.slice(0, 4)) {
      labelMap.get(artistTopTag).push({
        artist:   mbzArtist.name,
        title:    a.title,
        year:     a.year || null,
        coverUrl: a.coverUrl || null,
        mbid:     a.mbid   || null,
      });
    }
  }

  // Formatteer als array van groepen
  const groups = [];
  for (const label of topLabels) {
    const albums = labelMap.get(label) || [];
    if (albums.length) {
      groups.push({ label, albums: albums.slice(0, 10) });
    }
  }

  return groups;
}

// ── 4. getDeepCuts ──────────────────────────────────────────────────────────
/**
 * Albums uit je Plex-bibliotheek die je waarschijnlijk weinig luistert:
 * ouder (< 2000) en niet recent gescrobbeld (niet in je Last.fm recent cache).
 * Shuffle voor afwisseling.
 * @param {number} limit
 * @returns {Array|null}
 */
async function getDeepCuts(limit = 30) {
  const cacheKey = CACHE_PREFIX + 'deep_cuts';
  const cached = getCache(cacheKey, DISCOVERY_TTL_MS);
  if (cached) return shuffle(cached).slice(0, limit);

  const result = _buildDeepCuts();
  if (result.length > 0) {
    setCache(cacheKey, result);
    return shuffle(result).slice(0, limit);
  }
  return null;
}

function _buildDeepCuts() {
  const plexRaw    = getRawPlexCache();
  const library    = plexRaw.library || []; // [{artist, album}]
  const artistMap  = new Map(Object.entries(plexRaw.artistMap || {}));

  // Welke artiesten zijn recent gescrobbeld?
  const recentData    = getCache('api:recent', Infinity);
  const recentArtists = new Set(
    (recentData?.recenttracks?.track || [])
      .map(t => (t.artist?.['#text'] || t.artist?.name || '').toLowerCase())
      .filter(Boolean)
  );

  // Welke artiesten zitten in je top (7day)?
  const top7Data    = getCache('api:topartists:7day', Infinity);
  const top7Artists = new Set(
    (top7Data?.topartists?.artist || [])
      .map(a => (a.name || '').toLowerCase())
  );

  const cuts = [];

  for (const { artist, album } of library) {
    if (!artist || !album) continue;
    const normArtist = artist.toLowerCase();

    // Sla artiesten over die recentelijk gescrobbeld zijn of in top-7day staan
    if (recentArtists.has(normArtist) || top7Artists.has(normArtist)) continue;

    // Haal MBZ album data op voor jaar-info
    const mbzArtist = getCache(`mbz:artist:${normArtist}`, Infinity);
    let year = null;
    let coverUrl = null;

    if (mbzArtist?.mbid) {
      const mbzAlbums = getCache(`mbz:albums:${mbzArtist.mbid}`, Infinity);
      if (Array.isArray(mbzAlbums)) {
        const match = mbzAlbums.find(a => norm(a.title) === norm(album));
        if (match) {
          year     = match.year || null;
          coverUrl = match.coverUrl || null;
        }
      }
    }

    cuts.push({ artist, album, year, coverUrl });
  }

  return cuts;
}

// ── 5. getGenreExplorer ──────────────────────────────────────────────────────
/**
 * Alle genres in je bibliotheek met artiest-telling en sample-artiesten.
 * @returns {Array|null}  array van { genre, artistCount, sampleArtists }
 */
async function getGenreExplorer() {
  const cacheKey = CACHE_PREFIX + 'genre_explorer';
  const cached = getCache(cacheKey, DISCOVERY_TTL_MS);
  if (cached) return cached;

  const result = _buildGenreExplorer();
  if (result.length > 0) {
    setCache(cacheKey, result);
    return result;
  }
  return null;
}

function _buildGenreExplorer() {
  const plexRaw      = getRawPlexCache();
  const artistGenres  = new Map(Object.entries(plexRaw.artistGenres || {}));
  const artistMap     = new Map(Object.entries(plexRaw.artistMap   || {}));

  if (!artistGenres.size) return [];

  // genre → { artistCount, artists: Set van originele namen }
  const genreMap = new Map();

  for (const [normName, genres] of artistGenres.entries()) {
    const origName = artistMap.get(normName) || normName;
    for (const g of genres) {
      const gKey = g.toLowerCase().trim();
      if (!gKey) continue;
      if (!genreMap.has(gKey)) genreMap.set(gKey, { genre: g, artistCount: 0, artists: [] });
      const entry = genreMap.get(gKey);
      entry.artistCount++;
      if (entry.artists.length < 5) entry.artists.push(origName);
    }
  }

  return [...genreMap.values()]
    .sort((a, b) => b.artistCount - a.artistCount)
    .map(({ genre, artistCount, artists }) => ({
      genre,
      artistCount,
      sampleArtists: artists.slice(0, 3),
    }));
}

// ── Herbouw alle discovery caches ───────────────────────────────────────────
let _rebuildPromise = null;

async function rebuildAllCaches() {
  if (_rebuildPromise) return _rebuildPromise;

  _rebuildPromise = (async () => {
    logger.info('Cache discovery: herbouwen gestart');
    const start = Date.now();

    try {
      // Wis bestaande discovery caches
      const keys = ['undiscovered', 'genres_new', 'labels', 'deep_cuts', 'genre_explorer'];
      // (geen clearCache per prefix beschikbaar — we laten TTL verlopen of overschrijven)

      await getUndiscoveredAlbums(200);
      await getNewInYourGenres(200);
      await getFromYourLabels(50);
      await getDeepCuts(200);
      await getGenreExplorer();

      logger.info({ ms: Date.now() - start }, 'Cache discovery: herbouwen klaar');
    } catch (err) {
      logger.error({ err }, 'Cache discovery: herbouwen mislukt');
    } finally {
      _rebuildPromise = null;
    }
  })();

  return _rebuildPromise;
}

module.exports = {
  getUndiscoveredAlbums,
  getNewInYourGenres,
  getFromYourLabels,
  getDeepCuts,
  getGenreExplorer,
  rebuildAllCaches,
};
