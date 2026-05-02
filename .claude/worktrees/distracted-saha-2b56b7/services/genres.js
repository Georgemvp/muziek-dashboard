'use strict';
// ── Genre Explorer service ────────────────────────────────────────────────────
// Bouwt een genre-map op basis van enrichment cache (puur SQLite-reads bij laden).
// Achtergrond-builds mogen MBZ/Deezer aanroepen voor album/track-data.

const logger = require('../logger');
const { getMBZAlbums }                        = require('./musicbrainz');
const { getDeezerArtistTopTracks }            = require('./deezer');
const { albumInPlex, getPlexArtistNames }     = require('./plex');
const { getCache, setCache, getCacheAge, getEnrichmentData } = require('../db');
const { GENRE_WHITELIST, GENRE_COLORS, DEFAULT_GENRE_COLOR } = require('./constants');

// ── Cache-sleutels & TTLs ─────────────────────────────────────────────────────
const KEY_MAP   = 'genre:map';
const KEY_DEEP  = (g) => `genre:deep:${g.toLowerCase().replace(/\s+/g, '_')}`;

const TTL_MAP   = 86_400_000;       // 24h
const TTL_DEEP  = 12 * 3_600_000;  // 12h

let _buildMap  = null;  // actieve build-belofte voor de genre-map
const _buildDeep = {};  // actieve build-beloftes per genre

// ── Hulpfuncties ──────────────────────────────────────────────────────────────

/** Haal genres uit alle enrichment-bronnen voor één artiest. */
function _collectGenres(enrichData) {
  const raw = [];
  if (enrichData.lastfm?.tags)           raw.push(...enrichData.lastfm.tags);
  if (enrichData.musicbrainz?.tags)      raw.push(...enrichData.musicbrainz.tags);
  if (enrichData.spotify?.genres)        raw.push(...enrichData.spotify.genres);
  if (enrichData.itunes?.primaryGenre)   raw.push(enrichData.itunes.primaryGenre);
  if (enrichData.itunes?.genres)         raw.push(...(enrichData.itunes.genres || []));
  if (enrichData.audiodb?.genre)         raw.push(enrichData.audiodb.genre);
  if (enrichData.audiodb?.style)         raw.push(enrichData.audiodb.style);
  if (enrichData.deezer?.genres)         raw.push(...enrichData.deezer.genres);
  if (Array.isArray(enrichData.discogs?.genre)) raw.push(...enrichData.discogs.genre);
  if (Array.isArray(enrichData.discogs?.style)) raw.push(...enrichData.discogs.style);

  return [...new Set(
    raw.map(g => (g || '').toLowerCase().trim()).filter(g => g && GENRE_WHITELIST.has(g))
  )];
}

/** Artiest-populariteit: Spotify popularity > Last.fm listeners (genormaliseerd). */
function _popularity(enrichData) {
  if (enrichData.spotify?.popularity != null) return enrichData.spotify.popularity;
  const listeners = enrichData.lastfm?.listeners;
  if (listeners) return Math.min(100, Math.round(Math.log10(listeners + 1) * 20));
  return 0;
}

// ── Genre-map bouwen ──────────────────────────────────────────────────────────

async function buildGenreMap() {
  logger.info('Genres: genre-map bouwen');
  try {
    const artistNames = getPlexArtistNames() || [];
    const genreMap    = new Map(); // genre → { count, artists: [] }

    for (const name of artistNames) {
      const enrichData = getEnrichmentData('artist', name);
      const genres     = _collectGenres(enrichData);
      const popularity = _popularity(enrichData);
      const image      = enrichData.deezer?.artwork_url || null;

      for (const genre of genres) {
        if (!genreMap.has(genre)) genreMap.set(genre, { count: 0, artists: [] });
        const entry = genreMap.get(genre);
        entry.count++;
        entry.artists.push({ name, image, popularity });
      }
    }

    // Sorteer artiesten per genre op popularity (hoog → laag)
    for (const entry of genreMap.values()) {
      entry.artists.sort((a, b) => b.popularity - a.popularity);
    }

    // Serialiseer als array gesorteerd op count
    const genres = [...genreMap.entries()]
      .sort((a, b) => b[1].count - a[1].count)
      .map(([genre, { count, artists }]) => ({
        genre,
        count,
        topArtists: artists.slice(0, 3),
        color: GENRE_COLORS[genre] || DEFAULT_GENRE_COLOR,
      }));

    setCache(KEY_MAP, { genres, builtAt: Date.now() });
    logger.info({ genres: genres.length, artists: artistNames.length }, 'Genres: genre-map klaar');
  } catch (e) {
    logger.error({ err: e }, 'Genres: genre-map bouwen mislukt');
  }
}

// ── Genre Deep Dive bouwen ────────────────────────────────────────────────────

async function buildGenreDeepDive(genre) {
  logger.info({ genre }, 'Genres: deep dive bouwen');
  try {
    const mapData = getCache(KEY_MAP);
    if (!mapData) {
      logger.warn({ genre }, 'Genres: genre-map nog niet beschikbaar voor deep dive');
      return;
    }

    const entry = mapData.genres.find(g => g.genre === genre.toLowerCase());
    if (!entry) {
      setCache(KEY_DEEP(genre), { genre, artists: [], relatedGenres: [], builtAt: Date.now() });
      return;
    }

    // Haal alle artiesten uit de interne map op (max 20 voor deep dive)
    // We lezen de volledige genre-map opnieuw voor de artists-lijst met volledige namen
    const artistNames = getPlexArtistNames() || [];
    const genreArtists = [];
    const relatedGenreFreq = new Map();

    for (const name of artistNames) {
      const enrichData = getEnrichmentData('artist', name);
      const genres     = _collectGenres(enrichData);
      if (!genres.includes(genre.toLowerCase())) continue;

      genreArtists.push({ name, enrichData, popularity: _popularity(enrichData) });

      // Telt andere genres voor related genres
      for (const g of genres) {
        if (g !== genre.toLowerCase()) {
          relatedGenreFreq.set(g, (relatedGenreFreq.get(g) || 0) + 1);
        }
      }
    }

    genreArtists.sort((a, b) => b.popularity - a.popularity);
    const top20 = genreArtists.slice(0, 20);

    // Verrijk met albums + top tracks (gebruikt bestaande SQLite-caches)
    const artists = await Promise.all(top20.map(async ({ name, enrichData }) => {
      const mbid     = enrichData.musicbrainz?.mbid || null;
      const deezerId = enrichData.deezer?.deezer_id || null;

      let albums     = [];
      let topTracks  = [];

      if (mbid) {
        const raw = await getMBZAlbums(mbid).catch(() => []);
        albums = raw.map(a => ({ ...a, inPlex: albumInPlex(name, a.title) }));
      }

      if (deezerId) {
        topTracks = await getDeezerArtistTopTracks(deezerId).catch(() => []);
      }

      return {
        name,
        image:      enrichData.deezer?.artwork_url || null,
        popularity: _popularity(enrichData),
        mbid,
        country:    enrichData.musicbrainz?.country   || null,
        startYear:  enrichData.musicbrainz?.begin_date?.slice(0, 4) || null,
        listeners:  enrichData.lastfm?.listeners   || 0,
        lastfmUrl:  enrichData.lastfm?.lastfm_url  || null,
        bio:        enrichData.lastfm?.bio          || null,
        albums:     albums.slice(0, 20),
        inPlexAlbums:   albums.filter(a =>  a.inPlex).length,
        missingAlbums:  albums.filter(a => !a.inPlex).length,
        topTracks:  topTracks.slice(0, 5),
      };
    }));

    // Related genres gesorteerd op overlap-count
    const relatedGenres = [...relatedGenreFreq.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([g, overlap]) => ({
        genre:   g,
        overlap,
        color:   GENRE_COLORS[g] || DEFAULT_GENRE_COLOR,
      }));

    setCache(KEY_DEEP(genre), {
      genre,
      count:     genreArtists.length,
      color:     GENRE_COLORS[genre] || DEFAULT_GENRE_COLOR,
      artists,
      relatedGenres,
      builtAt:   Date.now(),
    });

    logger.info({ genre, artists: artists.length, related: relatedGenres.length }, 'Genres: deep dive klaar');
  } catch (e) {
    logger.error({ err: e, genre }, 'Genres: deep dive bouwen mislukt');
  }
}

// ── Publieke API ──────────────────────────────────────────────────────────────

/** Retourneert de genre-overzicht array (altijd instant vanuit cache). */
function getGenreMap() {
  if (getCacheAge(KEY_MAP) > TTL_MAP && !_buildMap) {
    _buildMap = buildGenreMap().finally(() => { _buildMap = null; });
  }
  const data = getCache(KEY_MAP);
  if (!data) return { status: 'building', message: 'Genre-overzicht wordt opgebouwd...' };
  return { status: 'ok', genres: data.genres, builtAt: data.builtAt };
}

/**
 * Retourneert deep dive voor één genre (altijd instant vanuit cache).
 * Triggert achtergrond-build als verlopen of ontbrekend.
 */
function getGenreDeepDive(genre) {
  const normalised = genre.toLowerCase().trim();
  const key = KEY_DEEP(normalised);

  if (getCacheAge(key) > TTL_DEEP && !_buildDeep[normalised]) {
    // Zorg dat de genre-map bestaat voor de deep dive builder
    if (getCacheAge(KEY_MAP) > TTL_MAP && !_buildMap) {
      _buildMap = buildGenreMap().then(() => buildGenreDeepDive(normalised)).finally(() => { _buildMap = null; });
    } else {
      _buildDeep[normalised] = buildGenreDeepDive(normalised).finally(() => { delete _buildDeep[normalised]; });
    }
  }

  const data = getCache(key);
  if (!data) return { status: 'building', genre: normalised, message: 'Genre deep dive wordt opgebouwd...' };
  return { status: 'ok', ...data };
}

/** Forceer een volledige rebuild van de genre-map. */
function refreshGenres() {
  if (!_buildMap) {
    _buildMap = buildGenreMap().finally(() => { _buildMap = null; });
  }
  return { ok: true, building: true };
}

/** Start achtergrond-build van de genre-map bij opstarten. */
function initGenres() {
  setTimeout(() => {
    if (getCacheAge(KEY_MAP) > TTL_MAP && !_buildMap) {
      _buildMap = buildGenreMap().finally(() => { _buildMap = null; });
    }
  }, 12_000); // iets later dan discover/gaps zodat Plex eerst klaar is
}

module.exports = { getGenreMap, getGenreDeepDive, refreshGenres, initGenres };
