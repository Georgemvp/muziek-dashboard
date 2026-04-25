// ── Startup validatie ──────────────────────────────────────────────────────
const logger = require('./logger');

logger.info({
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
  port: process.env.PORT || 80
}, '═══ LastFM App Starting ═══');

if (!process.env.LASTFM_API_KEY || !process.env.LASTFM_USER) {
  logger.fatal('LASTFM_API_KEY en LASTFM_USER zijn verplicht. Controleer je .env bestand.');
  process.exit(1);
}
logger.info('Required environment variables validated');

const express    = require('express');
const compression = require('compression');
const path       = require('path');
const rateLimit  = require('express-rate-limit');
const { createProxyMiddleware, responseInterceptor } = require('http-proxy-middleware');
const app        = express();
const PORT    = process.env.PORT || 80;

// ── Tidarr UI proxy ────────────────────────────────────────────────────────
// Alle verzoeken naar /tidarr-ui/ worden doorgestuurd naar de Tidarr container.
const TIDARR_BASE = (process.env.TIDARR_URL || 'http://tidarr:8484').replace(/\/$/, '');
logger.info({ tidarrUrl: TIDARR_BASE }, 'Tidarr proxy configured');

// ── MediaSage UI + API proxy ────────────────────────────────────────────────
// Alle verzoeken naar /mediasage/ worden doorgestuurd naar de MediaSage FastAPI.
const MEDIASAGE_BASE = (process.env.MEDIASAGE_URL || 'http://localhost:5765').replace(/\/$/, '');
logger.info({ mediasageUrl: MEDIASAGE_BASE }, 'MediaSage proxy configured');

app.use('/mediasage', createProxyMiddleware({
  target:              MEDIASAGE_BASE,
  changeOrigin:        true,
  pathRewrite:         { '^/mediasage': '' },
  selfHandleResponse:  true,
  on: {
    // Herschrijf HTML-responses: /static/ → /mediasage/static/
    // MediaSage's index.html gebruikt absolute paden (/static/style.css) die de
    // browser anders direct bij Express opvraagt i.p.v. via de proxy.
    proxyRes: responseInterceptor(async (buffer, proxyRes, req, res) => {
      delete proxyRes.headers['x-frame-options'];
      delete proxyRes.headers['content-security-policy'];
      delete proxyRes.headers['x-content-type-options'];

      const ct = (proxyRes.headers['content-type'] || '');
      if (ct.includes('text/html')) {
        return buffer.toString('utf8')
          .replace(/(['"\s(])\/static\//g, '$1/mediasage/static/');
      }
      return buffer;
    }),
    error: (err, req, res) => {
      logger.error({
        err: err.message,
        code: err.code,
        target: MEDIASAGE_BASE,
        path: req.path
      }, 'MediaSage proxy error');
      res.status(502).send(`
        <div style="font-family:sans-serif;padding:40px;color:#ccc;background:#1a1a2e;height:100vh;box-sizing:border-box">
          <h2>⚠️ MediaSage niet bereikbaar</h2>
          <p>MediaSage is nog niet opgestart of er is een fout opgetreden.</p>
          <p style="color:#888;font-size:13px">Fout: ${err.message}</p>
          <button onclick="location.reload()" style="margin-top:16px;padding:8px 20px;background:#4a9eff;color:#fff;border:none;border-radius:6px;cursor:pointer">↻ Opnieuw proberen</button>
        </div>
      `);
    }
  }
}));

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
      logger.error({
        err: err.message,
        code: err.code,
        target: TIDARR_BASE,
        path: req.path
      }, 'Tidarr proxy error');
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
const { lfm }                                                       = require('./services/lastfm');
const { plexGet, plexPost, plexPut, syncPlexLibrary, artistInPlex, albumInPlex, getPlexStatus, getPlexArtistNames, getPlexLibrary, getAlbumRatingKey, getPlexClients, playOnClient, pauseClient, stopClient, skipNext, skipPrev, getPlexPlaylists, getPlaylistTracks, getAlbumTracks, triggerPlexScan, rateItem, searchPlexLibrary, PLEX_TOKEN, PLEX_URL, getPlayHistory, aggregateTopArtists, aggregateTopTracks, aggregateDailyPlays, enrichArtistsWithThumbs, getGenresFromPlex, getPlexArtistsByGenre, periodToTimestamp } = require('./services/plex');
const { getMBZArtist }                                              = require('./services/musicbrainz');
const { getDeezerImage, getDeezerArtist, getDeezerArtistAlbums, getDeezerArtistTopTracks, searchDeezerArtist, getSimilarArtists } = require('./services/deezer');
const { getDiscover, refreshDiscover, initDiscover }               = require('./services/discover');
const { getGaps, refreshGaps, initGaps, getArtistGaps }            = require('./services/gaps');
const { getReleases, refreshReleases, initReleases }               = require('./services/releases');
const { searchTidal, findBestAlbum, findTopAlbums, addToQueue, getQueue, getHistory, removeFromQueue, getTidarrStatus, TIDARR_URL, TIDARR_API_KEY } = require('./services/tidarr');
const { getCache, setCache, getCacheAge, getWishlist, addToWishlist, removeFromWishlist, addDownload, getDownloads, getDownloadKeys, removeDownload } = require('./db');
const { SPOTIFY_OK, MOODS, searchArtistId, getRecommendations } = require('./services/spotify');
const { getWikipediaExtract }                                      = require('./services/wikipedia');

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
// Ook voegt request IDs toe voor request tracking.
const { requestLoggingMiddleware } = require('./logger');
app.use(requestLoggingMiddleware);

// ── Rate limiting ──────────────────────────────────────────────────────────

const rateLimitHandler = (req, res) => {
  logger.warn({
    ip: req.ip,
    path: req.path,
    method: req.method
  }, 'Rate limit exceeded');
  res.status(429).json({
    error:      'Te veel verzoeken, probeer het over een minuut opnieuw',
    retryAfter: 60
  });
};

// Globale limiter: beschermt alle routes (excl. statische bestanden hierboven)
// Ruim genoeg voor normale single-user browsing; echte Last.fm-bescherming
// zit in de outbound throttle in services/lastfm.js.
logger.info({ window: '60s', maxRequests: 300 }, 'Global rate limiter configured');
app.use(rateLimit({
  windowMs:      60_000,
  max:           300,
  standardHeaders: true,
  legacyHeaders:   false,
  handler:         rateLimitHandler
}));

// API limiter voor /api/*: beschermt tegen extreme burst (bijv. scripts/bots)
logger.info({ window: '60s', maxRequests: 120 }, 'API rate limiter configured');
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
  getPlexStatus,
  // MusicBrainz voor genre-tags (vervangt Last.fm artist.gettoptags)
  getMBZArtist,
  // Deezer voor zoeken, albums en tracks
  getDeezerArtist,
  getDeezerArtistAlbums,
  getDeezerArtistTopTracks,
  searchDeezerArtist
});

// Store lastfm status functions for use in other modules and health endpoint
const lastFmStatusFuncs = lastfmFuncs;

// Common dependencies shared by all route modules
const deps = {
  // Last.fm (alleen persoonlijke scrobble-data)
  lfm,
  // Deezer getSimilarArtists vervangt Last.fm artist.getsimilar
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
  getPlayHistory,
  aggregateTopArtists,
  aggregateTopTracks,
  aggregateDailyPlays,
  enrichArtistsWithThumbs,
  getGenresFromPlex,
  getPlexArtistsByGenre,
  periodToTimestamp,

  // MusicBrainz
  getMBZArtist,

  // Deezer
  getDeezerImage,
  getDeezerArtist,
  getDeezerArtistAlbums,
  getDeezerArtistTopTracks,
  searchDeezerArtist,

  // Discovery
  getDiscover,
  refreshDiscover,
  getGaps,
  getArtistGaps,
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

  // Wikipedia
  getWikipediaExtract,

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
  const server = app.listen(PORT, () => {
    logger.info({ port: PORT, address: server.address() }, '✓ Express server listening');
  });

  // Parallel initialization: Plex library + discovery services (independent of each other)
  logger.info('🔄 Initializing Plex library and discovery services in parallel...');
  Promise.allSettled([
    syncPlexLibrary(true),
    initDiscover(),
    initGaps(),
    initReleases()
  ])
    .then((results) => {
      const [plexResult, discoverResult, gapsResult, releasesResult] = results;

      // Check Plex status
      if (plexResult.status === 'fulfilled') {
        logger.info({ status: 'ready' }, '✓ Plex library initialized');
      } else {
        logger.warn(
          { err: plexResult.reason, message: plexResult.reason?.message },
          '⚠ Plex library initialization failed (will retry on first request)'
        );
      }

      // Check discovery services status
      const discoveryFailed = [];
      if (discoverResult.status === 'rejected') discoveryFailed.push('Discover');
      if (gapsResult.status === 'rejected') discoveryFailed.push('Gaps');
      if (releasesResult.status === 'rejected') discoveryFailed.push('Releases');

      if (discoveryFailed.length > 0) {
        logger.warn(
          { services: discoveryFailed },
          `⚠ ${discoveryFailed.join(', ')} service(s) initialization failed`
        );
      } else {
        logger.info('✓ All discovery services initialized');
      }

      logger.info('✓ All initialization tasks completed - app fully operational');
    });

  // Automatische Plex achtergrond-sync elke 30 minuten
  logger.debug('Starting background Plex sync (every 30 minutes)');
  setInterval(() => {
    logger.debug('🔄 Running background Plex sync...');
    syncPlexLibrary(true)
      .then(() => {
        logger.debug('✓ Background Plex sync completed');
      })
      .catch(e => {
        logger.warn({ err: e, message: e.message }, '⚠ Background Plex sync failed');
      });
  }, 30 * 60 * 1_000);

  // Graceful shutdown handling
  process.on('SIGTERM', () => {
    logger.warn('SIGTERM received - gracefully shutting down');
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    logger.warn('SIGINT received - gracefully shutting down');
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  });

  // Uncaught exception handler
  process.on('uncaughtException', (err) => {
    logger.fatal({ err, message: err.message, stack: err.stack }, '💥 Uncaught exception - crashing');
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error({ reason, promise }, '💥 Unhandled rejection');
  });
}

module.exports = app;
