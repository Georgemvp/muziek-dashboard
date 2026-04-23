// ── Startup validatie ──────────────────────────────────────────────────────
const logger = require('./logger');

if (!process.env.LASTFM_API_KEY || !process.env.LASTFM_USER) {
  logger.fatal('LASTFM_API_KEY en LASTFM_USER zijn verplicht. Controleer je .env bestand.');
  process.exit(1);
}

const express    = require('express');
const compression = require('compression');
const path       = require('path');
const rateLimit  = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app        = express();
const PORT    = process.env.PORT || 80;

// ── Tidarr UI proxy ────────────────────────────────────────────────────────
// Alle verzoeken naar /tidarr-ui/ worden doorgestuurd naar de Tidarr container.
const TIDARR_BASE = (process.env.TIDARR_URL || 'http://tidarr:8484').replace(/\/$/, '');
app.use('/tidarr-ui', createProxyMiddleware({
  target:       TIDARR_BASE,
  changeOrigin: true,
  pathRewrite:  { '^/tidarr-ui': '' },
  on: {
    // Verwijder headers die het tonen in een iframe blokkeren
    proxyRes: (proxyRes) => {
      delete proxyRes.headers['x-frame-options'];
      delete proxyRes.headers['content-security-policy'];
      delete proxyRes.headers['x-content-type-options'];
    },
    error: (err, req, res) => {
      res.status(502).send(`
        <div style="font-family:sans-serif;padding:40px;color:#ccc;background:#1a1a2e;height:100vh;box-sizing:border-box">
          <h2>⚠️ Tidarr niet bereikbaar</h2>
          <p>Tidarr is nog niet opgestart of er is een fout opgetreden.</p>
          <p style="color:#888;font-size:13px">Fout: ${err.message}</p>
          <button onclick="location.reload()" style="margin-top:16px;padding:8px 20px;background:#4a9eff;color:#fff;border:none;border-radius:6px;cursor:pointer">↻ Opnieuw proberen</button>
        </div>
      `);
    }
  }
}));

app.use(compression());

// ── Services ───────────────────────────────────────────────────────────────
const { proxyImage }                                                = require('./services/imageproxy');
const { lfm, getSimilarArtists }                                    = require('./services/lastfm');
const { plexGet, plexPost, plexPut, syncPlexLibrary, artistInPlex, albumInPlex, getPlexStatus, getPlexArtistNames, getPlexLibrary, getAlbumRatingKey, getPlexClients, playOnClient, pauseClient, stopClient, skipNext, skipPrev, getPlexPlaylists, getPlaylistTracks, getAlbumTracks, triggerPlexScan, rateItem, searchPlexLibrary, PLEX_TOKEN, PLEX_URL } = require('./services/plex');
const { getMBZArtist }                                              = require('./services/musicbrainz');
const { getDeezerImage }                                            = require('./services/deezer');
const { getDiscover, refreshDiscover, initDiscover }               = require('./services/discover');
const { getGaps, refreshGaps, initGaps }                           = require('./services/gaps');
const { getReleases, refreshReleases, initReleases }               = require('./services/releases');
const { searchTidal, findBestAlbum, findTopAlbums, addToQueue, getQueue, getHistory, removeFromQueue, getTidarrStatus, TIDARR_URL, TIDARR_API_KEY } = require('./services/tidarr');
const { getCache, setCache, getCacheAge, getWishlist, addToWishlist, removeFromWishlist, addDownload, getDownloads, getDownloadKeys, removeDownload } = require('./db');
const { SPOTIFY_OK, MOODS, searchArtistId, getRecommendations } = require('./services/spotify');

app.use(express.static(path.join(__dirname, 'public'), {
  etag: true,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
      return;
    }
    if (filePath.includes(`${path.sep}chunks${path.sep}`)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      return;
    }
    if (/\.(?:css|js|mjs|png|jpg|jpeg|gif|webp|svg|ico|woff2?)$/i.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=86400');
    }
  }
}));
app.use(express.json());

// ── Request logging middleware ─────────────────────────────────────────────
// Logt elke inkomende request met method, pad, statuscode en responstijd.
// Slaat /health en statische bestanden over voor een cleaner logboek.
app.use((req, res, next) => {
  const SKIP_PREFIXES = ['/health'];
  if (SKIP_PREFIXES.some(p => req.path === p || req.path.startsWith('/tidarr-ui'))) {
    return next();
  }
  const t0 = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - t0;
    const level = res.statusCode >= 500 ? 'error'
                : res.statusCode >= 400 ? 'warn'
                : 'info';
    logger[level]({ method: req.method, path: req.path, status: res.statusCode, ms }, 'request');
  });
  next();
});

// ── Rate limiting ──────────────────────────────────────────────────────────

const rateLimitHandler = (req, res) =>
  res.status(429).json({
    error:      'Te veel verzoeken, probeer het over een minuut opnieuw',
    retryAfter: 60
  });

// Globale limiter: beschermt alle routes (excl. statische bestanden hierboven)
// Ruim genoeg voor normale single-user browsing; echte Last.fm-bescherming
// zit in de outbound throttle in services/lastfm.js.
app.use(rateLimit({
  windowMs:      60_000,
  max:           300,
  standardHeaders: true,
  legacyHeaders:   false,
  handler:         rateLimitHandler
}));

// API limiter voor /api/*: beschermt tegen extreme burst (bijv. scripts/bots)
app.use('/api', rateLimit({
  windowMs:      60_000,
  max:           120,
  standardHeaders: true,
  legacyHeaders:   false,
  handler:         rateLimitHandler
}));

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Voert `tasks` (een array van functies die een Promise teruggeven) uit
 * met maximaal `limit` gelijktijdige uitvoeringen.
 * Geeft een array van PromiseSettledResult-objecten terug (zelfde interface als Promise.allSettled).
 */
function limitConcurrency(tasks, limit) {
  return new Promise((resolve) => {
    if (tasks.length === 0) return resolve([]);
    const results = new Array(tasks.length);
    let started   = 0;
    let completed = 0;

    function runNext() {
      while (started < tasks.length && (started - completed) < limit) {
        const idx = started++;
        Promise.resolve()
          .then(() => tasks[idx]())
          .then(
            (val) => { results[idx] = { status: 'fulfilled', value: val }; },
            (err) => { results[idx] = { status: 'rejected',  reason: err }; }
          )
          .finally(() => {
            completed++;
            if (completed === tasks.length) resolve(results);
            else runNext();
          });
      }
    }
    runNext();
  });
}

// ── Import and register route modules ──────────────────────────────────────

// Collect all dependencies for route modules
const lastfmRouteModule = require('./routes/lastfm');
const lastfmFuncs = lastfmRouteModule(app, {
  lfm,
  getSimilarArtists,
  getCache,
  setCache,
  syncPlexLibrary,
  artistInPlex,
  albumInPlex,
  getAlbumRatingKey,
  limitConcurrency,
  getPlexStatus
});

// Store lastfm status functions for use in other modules and health endpoint
const lastFmStatusFuncs = lastfmFuncs;

// Common dependencies shared by all route modules
const deps = {
  // Last.fm
  lfm,
  getSimilarArtists,
  getCache,
  setCache,
  getCacheAge,

  // Plex
  plexGet,
  plexPost,
  plexPut,
  syncPlexLibrary,
  artistInPlex,
  albumInPlex,
  getPlexStatus,
  getPlexArtistNames,
  getPlexLibrary,
  getAlbumRatingKey,
  getPlexClients,
  playOnClient,
  pauseClient,
  stopClient,
  skipNext,
  skipPrev,
  getPlexPlaylists,
  getPlaylistTracks,
  getAlbumTracks,
  triggerPlexScan,
  rateItem,
  searchPlexLibrary,
  PLEX_TOKEN,
  PLEX_URL,

  // MusicBrainz
  getMBZArtist,

  // Deezer
  getDeezerImage,

  // Discovery
  getDiscover,
  refreshDiscover,
  getGaps,
  refreshGaps,
  getReleases,
  refreshReleases,

  // Tidarr
  searchTidal,
  findBestAlbum,
  findTopAlbums,
  addToQueue,
  getQueue,
  getHistory,
  removeFromQueue,
  getTidarrStatus,
  addDownload,
  getDownloads,
  getDownloadKeys,
  removeDownload,

  // Image proxy
  proxyImage,

  // Wishlist
  getWishlist,
  addToWishlist,
  removeFromWishlist,

  // Spotify
  SPOTIFY_OK,
  MOODS,
  searchArtistId,
  getRecommendations,

  // Helpers
  limitConcurrency,

  // LastFM status (from lastfm route module)
  lastFmDown: lastfmFuncs.lastFmDown,
  lastFmDownSince: lastfmFuncs.lastFmDownSince
};

// Register all route modules
require('./routes/artist')(app, deps);
require('./routes/plex')(app, deps);
require('./routes/tidarr')(app, deps);
require('./routes/spotify')(app, deps);
require('./routes/misc')(app, deps);

// ── Start ──────────────────────────────────────────────────────────────────

if (require.main === module) {
  app.listen(PORT, () => {
    logger.info({ port: PORT }, 'App gestart');
    syncPlexLibrary(true).catch(() => {});
    initDiscover();
    initGaps();
    initReleases();
    // Automatische Plex achtergrond-sync elke 30 minuten
    setInterval(() => {
      syncPlexLibrary(true).catch(e => logger.warn({ err: e }, 'Plex achtergrond-sync mislukt'));
    }, 30 * 60 * 1_000);
  });
}

module.exports = app;
