'use strict';

/**
 * Assembleert het gedeelde dependency-object voor alle route-modules.
 *
 * Gebruik in server.js:
 *   const deps = require('./middleware/deps');
 *
 * Na het registreren van routes/lastfm.js voeg je de statusfuncties toe:
 *   const lastfmFuncs = require('./routes/lastfm')(app, deps);
 *   deps.lastFmDown      = lastfmFuncs.lastFmDown;
 *   deps.lastFmDownSince = lastfmFuncs.lastFmDownSince;
 */

const { limitConcurrency } = require('./helpers');

// ── Services ──────────────────────────────────────────────────────────────────
const { proxyImage } = require('../services/imageproxy');
const { lfm }        = require('../services/lastfm');

const {
  plexGet, plexPost, plexPut, syncPlexLibrary, artistInPlex, albumInPlex,
  getPlexStatus, getPlexArtistNames, getPlexLibrary, getAlbumRatingKey,
  getPlexClients, playOnClient, pauseClient, stopClient, skipNext, skipPrev,
  getPlexPlaylists, getPlaylistTracks, getAlbumTracks, triggerPlexScan,
  rateItem, searchPlexLibrary, PLEX_TOKEN, PLEX_URL,
  getPlayHistory, aggregateTopArtists, aggregateTopTracks, aggregateDailyPlays,
  enrichArtistsWithThumbs, getGenresFromPlex, getPlexArtistsByGenre, periodToTimestamp
} = require('../services/plex');

const { getMBZArtist } = require('../services/musicbrainz');

const {
  getDeezerImage, getDeezerArtist, getDeezerArtistAlbums,
  getDeezerArtistTopTracks, searchDeezerArtist, getSimilarArtists
} = require('../services/deezer');

const { getDiscover, refreshDiscover, initDiscover }    = require('../services/discover');
const { getGaps, refreshGaps, initGaps, getArtistGaps } = require('../services/gaps');
const { getReleases, refreshReleases, initReleases }    = require('../services/releases');

const {
  searchTidal, findBestAlbum, findTopAlbums, addToQueue, getQueue, getHistory,
  removeFromQueue, getTidarrStatus, TIDARR_URL, TIDARR_API_KEY
} = require('../services/tidarr');

const {
  searchOrpheus, downloadOrpheus, downloadFromSearch, getOrpheusJobStatus,
  stopOrpheusJob, getOrpheusStatus, getOrpheusSettings, saveOrpheusSettings,
  ORPHEUS_URL, PLATFORMS: ORPHEUS_PLATFORMS, QUALITY_OPTIONS: ORPHEUS_QUALITY_OPTIONS
} = require('../services/orpheus');

const {
  getCache, setCache, getCacheAge,
  getWishlist, addToWishlist, removeFromWishlist,
  addDownload, getDownloads, getDownloadKeys, removeDownload
} = require('../db');

const { SPOTIFY_OK, MOODS, searchArtistId, getRecommendations } = require('../services/spotify');
const { getWikipediaExtract } = require('../services/wikipedia');

// ── Deps-object ───────────────────────────────────────────────────────────────
// lastFmDown / lastFmDownSince worden door server.js toegevoegd ná de lastfm-routeregistratie.
const deps = {
  // Cache (SQLite)
  getCache, setCache, getCacheAge,

  // Last.fm
  lfm,

  // Plex
  plexGet, plexPost, plexPut, syncPlexLibrary, artistInPlex, albumInPlex,
  getPlexStatus, getPlexArtistNames, getPlexLibrary, getAlbumRatingKey,
  getPlexClients, playOnClient, pauseClient, stopClient, skipNext, skipPrev,
  getPlexPlaylists, getPlaylistTracks, getAlbumTracks, triggerPlexScan,
  rateItem, searchPlexLibrary, PLEX_TOKEN, PLEX_URL,
  getPlayHistory, aggregateTopArtists, aggregateTopTracks, aggregateDailyPlays,
  enrichArtistsWithThumbs, getGenresFromPlex, getPlexArtistsByGenre, periodToTimestamp,

  // MusicBrainz
  getMBZArtist,

  // Deezer
  getDeezerImage, getDeezerArtist, getDeezerArtistAlbums,
  getDeezerArtistTopTracks, searchDeezerArtist, getSimilarArtists,

  // Discovery & gaps
  getDiscover, refreshDiscover, initDiscover,
  getGaps, getArtistGaps, refreshGaps, initGaps,
  getReleases, refreshReleases, initReleases,

  // Tidarr
  searchTidal, findBestAlbum, findTopAlbums, addToQueue, getQueue, getHistory,
  removeFromQueue, getTidarrStatus, TIDARR_URL, TIDARR_API_KEY,
  addDownload, getDownloads, getDownloadKeys, removeDownload,

  // OrpheusDL
  searchOrpheus, downloadOrpheus, downloadFromSearch, getOrpheusJobStatus,
  stopOrpheusJob, getOrpheusStatus, getOrpheusSettings, saveOrpheusSettings,
  ORPHEUS_URL, ORPHEUS_PLATFORMS, ORPHEUS_QUALITY_OPTIONS,

  // Image proxy
  proxyImage,

  // Wishlist
  getWishlist, addToWishlist, removeFromWishlist,

  // Spotify
  SPOTIFY_OK, MOODS, searchArtistId, getRecommendations,

  // Wikipedia
  getWikipediaExtract,

  // Helpers
  limitConcurrency,
};

module.exports = deps;
