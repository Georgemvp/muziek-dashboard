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

const { getDiscover, refreshDiscover, initDiscover, getDiscoverStatus } = require('../services/discover');
const { getGenreMap, getGenreDeepDive, refreshGenres, initGenres } = require('../services/genres');
const { getGaps, refreshGaps, initGaps, getArtistGaps }           = require('../services/gaps');
const { getReleases, refreshReleases, initReleases }    = require('../services/releases');
const watchlistService                                  = require('../services/watchlist');

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
  addDownload, getDownloads, getDownloadKeys, removeDownload,
  getSettings, getSetting, setSetting, setSettings, getAllSettings,
  getDb,
  getMaintenanceFindings, getMaintenanceFinding, updateMaintenanceFindingStatus,
  getMaintenanceSummary, getMaintenanceRuns,
  insertScrobble, getRecentScrobbles, getScrobble,
  updateScrobbleLastfm, updateScrobbleLB, getPendingScrobbles,
} = require('../db');

const { SPOTIFY_OK, MOODS, searchArtistId, getRecommendations } = require('../services/spotify');
const {
  getListenBrainzRecommendations, getListenBrainzPlaylists,
  getListenBrainzSimilarUsers, getListenBrainzStatus, LB_OK, LB_USER,
} = require('../services/listenbrainz');
const { Scrobbler } = require('../services/scrobbler');
const { getWikipediaExtract } = require('../services/wikipedia');
const mirroredPlaylistsService = require('../services/mirroredPlaylists');
const {
  getPlaylists: getSsPlaylists,
  getPlaylistTracks: getSsPlaylistTracks,
  refreshPlaylist: refreshSsPlaylist,
  syncPlaylistToPlex: syncSsPlaylistToPlex,
  initPlaylists,
} = require('../services/playlists');

// ── Scrobbler ─────────────────────────────────────────────────────────────────
const scrobbler = new Scrobbler({
  db: { insertScrobble, getRecentScrobbles, getScrobble, updateScrobbleLastfm, updateScrobbleLB, getPendingScrobbles },
  getSetting,
  setSetting,
});

// ── Automation Engine ──────────────────────────────────────────────────────────
const automationService = require('../services/automation');

// ── Download Orchestrator ─────────────────────────────────────────────────────
const events = require('../services/events');
const { DownloadOrchestrator }              = require('../services/downloadOrchestrator');
const { PostProcessor }                     = require('../services/postprocess');
const { createAcoustIDService, getAcoustIDService } = require('../services/acoustid');
const {
  createDownloadJob, getDownloadJob, updateDownloadJob,
  getPendingDownloadJobs, getRecentDownloadJobs, getActiveDownloadJobs, getDownloadJobsByStatus,
  logPostprocessStep, getPostprocessLog, getPostprocessLogByJob,
  saveAcoustidResult, getAcoustidResultByJob, getAcoustidResultByPath, getAcoustidResults,
} = require('../db');

// Maak orchestrator aan met de beschikbare services
const downloadOrchestrator = new DownloadOrchestrator({
  tidarrService: {
    searchTidal,
    findBestAlbum,
    findTopAlbums,
    addToQueue,
    getTidarrStatus,
  },
  orpheusService: {
    searchOrpheus,
    downloadOrpheus,
    downloadFromSearch,
    getOrpheusStatus,
    pollJob: require('../services/orpheus').pollJob,
  },
  db: {
    getSetting, setSetting,
    addToWishlist,
    addDownload,
    createDownloadJob,
    getDownloadJob,
    updateDownloadJob,
    getPendingDownloadJobs,
    getRecentDownloadJobs,
    getActiveDownloadJobs,
  },
  events,
});

// ── AcoustID Service ──────────────────────────────────────────────────────────
// Singleton aanmaken zodat de rate-limiter gedeeld wordt over alle callers.
const acoustidService = createAcoustIDService({ getSetting });

// ── PostProcessor ─────────────────────────────────────────────────────────────
// Luistert op download:complete events van de orchestrator en verwerkt bestanden.
const postProcessor = new PostProcessor({
  db: {
    getSetting,
    updateDownloadJob,
    getDownloadJob,
  },
  events,
});

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
  getDiscover, refreshDiscover, initDiscover, getDiscoverStatus,
  getGenreMap, getGenreDeepDive, refreshGenres, initGenres,
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

  // ListenBrainz
  getListenBrainzRecommendations, getListenBrainzPlaylists,
  getListenBrainzSimilarUsers, getListenBrainzStatus, LB_OK, LB_USER,

  // Wikipedia
  getWikipediaExtract,

  // Settings (SQLite)
  getSettings, getSetting, setSetting, setSettings, getAllSettings,

  // Download Orchestrator
  downloadOrchestrator,
  events,

  // Download Jobs (voor routes/download.js)
  createDownloadJob, getDownloadJob, updateDownloadJob,
  getPendingDownloadJobs, getRecentDownloadJobs, getActiveDownloadJobs, getDownloadJobsByStatus,

  // PostProcessor
  postProcessor,
  getPostprocessLog,
  getPostprocessLogByJob,
  logPostprocessStep,

  // AcoustID
  acoustidService,
  getAcoustIDService,
  saveAcoustidResult,
  getAcoustidResultByJob,
  getAcoustidResultByPath,
  getAcoustidResults,

  // Scrobbler
  scrobbler,

  // Automation Engine
  automationService,

  // Watchlist
  watchlistService,

  // Mirrored Playlists
  mirroredPlaylistsService,

  // SoulSync Playlist Engine
  getSsPlaylists, getSsPlaylistTracks, refreshSsPlaylist, syncSsPlaylistToPlex, initPlaylists,

  // Helpers
  limitConcurrency,

  // Maintenance
  getDb,
  getMaintenanceFindings, getMaintenanceFinding, updateMaintenanceFindingStatus,
  getMaintenanceSummary, getMaintenanceRuns,

  // Expose db-object zodat routes direct DB-functies kunnen aanroepen
  db: {
    getSetting, setSetting,
    getDownloadJob, updateDownloadJob,
    logPostprocessStep, getPostprocessLog, getPostprocessLogByJob,
    saveAcoustidResult, getAcoustidResultByJob, getAcoustidResultByPath, getAcoustidResults,
  },
};

module.exports = deps;
