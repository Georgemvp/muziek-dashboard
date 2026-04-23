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
const { plexGet, plexPost, plexPut, syncPlexLibrary, artistInPlex, albumInPlex, getPlexStatus, getPlexArtistNames, getPlexLibrary, getAlbumRatingKey, getPlexClients, playOnClient, pauseClient, stopClient, skipNext, skipPrev, getPlexPlaylists, getPlaylistTracks, getAlbumTracks, triggerPlexScan, rateItem, PLEX_TOKEN, PLEX_URL } = require('./services/plex');
const { getMBZArtist }                                              = require('./services/musicbrainz');
const { getDeezerImage }                                            = require('./services/deezer');
const { getDiscover, refreshDiscover, initDiscover }               = require('./services/discover');
const { getGaps, refreshGaps, initGaps }                           = require('./services/gaps');
const { getReleases, refreshReleases, initReleases }               = require('./services/releases');
const { searchTidal, findBestAlbum, findTopAlbums, addToQueue, getQueue, getHistory, removeFromQueue, getTidarrStatus } = require('./services/tidarr');
const { getCache, setCache, getCacheAge, getWishlist, addToWishlist, removeFromWishlist, addDownload, getDownloads, getDownloadKeys, removeDownload } = require('./db');
const { TIDARR_URL, TIDARR_API_KEY } = require('./services/tidarr');
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

// ── API: Last.fm ───────────────────────────────────────────────────────────

// ── Last.fm bereikbaarheidsstatus ──────────────────────────────────────────
let lastFmDown = false;
let lastFmDownSince = null;

function markLastFmDown() {
  if (!lastFmDown) { lastFmDown = true; lastFmDownSince = Date.now(); }
}
function markLastFmUp() {
  lastFmDown = false; lastFmDownSince = null;
}

/**
 * Geeft stale gecachede data terug als Last.fm onbereikbaar is,
 * met een _stale: true vlag zodat de frontend dit kan tonen.
 */
function staleOrError(cacheKey, err, res) {
  const stale = getCache(cacheKey, Infinity);
  if (stale) {
    markLastFmDown();
    return res.json({ ...stale, _stale: true, _staleReason: err.message });
  }
  markLastFmDown();
  res.status(503).json({ error: 'Last.fm is tijdelijk niet bereikbaar en er is geen gecachede data beschikbaar.', _lfmDown: true });
}

app.get('/api/user', async (req, res) => {
  try {
    const cached = getCache('api:user', 300_000);
    if (cached) {
      res.set('Cache-Control', 'private, max-age=600');
      return res.json(cached);
    }
    const data = await lfm({ method: 'user.getinfo' });
    markLastFmUp();
    setCache('api:user', data);
    res.set('Cache-Control', 'private, max-age=600');
    res.json(data);
  } catch (e) { staleOrError('api:user', e, res); }
});

app.get('/api/recent', async (req, res) => {
  try {
    const cached = getCache('api:recent', 120_000);
    if (cached) {
      res.set('Cache-Control', 'private, max-age=30');
      return res.json(cached);
    }
    const data = await lfm({ method: 'user.getrecenttracks', limit: 20 });
    markLastFmUp();
    setCache('api:recent', data);
    res.set('Cache-Control', 'private, max-age=30');
    res.json(data);
  } catch (e) { staleOrError('api:recent', e, res); }
});

app.get('/api/topartists', async (req, res) => {
  try {
    const period = req.query.period || '7day';
    const cacheKey = `api:topartists:${period}`;
    const cached = getCache(cacheKey, 300_000);
    if (cached) {
      res.set('Cache-Control', 'private, max-age=300');
      return res.json(cached);
    }
    const data = await lfm({ method: 'user.gettopartists', period, limit: 20 });
    markLastFmUp();
    setCache(cacheKey, data);
    res.set('Cache-Control', 'private, max-age=300');
    res.json(data);
  } catch (e) { staleOrError(`api:topartists:${req.query.period || '7day'}`, e, res); }
});

app.get('/api/toptracks', async (req, res) => {
  try {
    const period = req.query.period || '7day';
    const cacheKey = `api:toptracks:${period}`;
    const cached = getCache(cacheKey, 300_000);
    if (cached) {
      res.set('Cache-Control', 'private, max-age=300');
      return res.json(cached);
    }
    const data = await lfm({ method: 'user.gettoptracks', period, limit: 20 });
    markLastFmUp();
    setCache(cacheKey, data);
    res.set('Cache-Control', 'private, max-age=300');
    res.json(data);
  } catch (e) { staleOrError(`api:toptracks:${req.query.period || '7day'}`, e, res); }
});

app.get('/api/loved', async (req, res) => {
  try {
    const cached = getCache('api:loved', 600_000);
    if (cached) {
      res.set('Cache-Control', 'private, max-age=600');
      return res.json(cached);
    }
    const data = await lfm({ method: 'user.getlovedtracks', limit: 20 });
    markLastFmUp();
    setCache('api:loved', data);
    res.set('Cache-Control', 'private, max-age=600');
    res.json(data);
  } catch (e) { staleOrError('api:loved', e, res); }
});

// ── API: Artiest info ──────────────────────────────────────────────────────

app.get('/api/artist/:name/info', async (req, res) => {
  const name = decodeURIComponent(req.params.name);
  const cacheKey = `artist:info:${name.toLowerCase()}`;

  // ── Check cache eerst (TTL: 1 uur) ─────────────────────────────────────
  const cached = getCache(cacheKey, 1 * 3_600_000);
  if (cached) {
    res.set('Cache-Control', 'private, max-age=3600');
    return res.json(cached);
  }

  try {
    const [deezerR, albumsR, mbzR] = await Promise.allSettled([
      fetch(`https://api.deezer.com/search/artist?q=${encodeURIComponent(name)}&limit=3`, { signal: AbortSignal.timeout(5_000) }).then(r => r.json()),
      lfm({ method: 'artist.gettopalbums', artist: name, limit: 6 }, { includeUser: false }),
      getMBZArtist(name)
    ]);

    let image = null;
    if (deezerR.status === 'fulfilled') {
      const results = deezerR.value?.data || [];
      const exact   = results.find(a => a.name.toLowerCase() === name.toLowerCase());
      const best    = exact || results[0];
      if (best?.picture_medium && !best.picture_medium.includes('/artist//')) image = best.picture_medium;
    }

    let albums = [];
    if (albumsR.status === 'fulfilled') {
      albums = (albumsR.value.topalbums?.album || [])
        .filter(a => a.name && a.name !== '(null)' && a.name !== '[unknown]')
        .slice(0, 5)
        .map(a => {
          const img = a.image?.find(i => i.size === 'medium')?.['#text'] || null;
          const inPlex = albumInPlex(name, a.name);
          return {
            name:      a.name,
            image:     (img && !img.includes('2a96cbd8b46e442fc41c2b86b821562f')) ? img : null,
            playcount: parseInt(a.playcount) || 0,
            inPlex,
            ratingKey: inPlex ? getAlbumRatingKey(name, a.name) : null,
          };
        });
    }

    const mbz = mbzR.status === 'fulfilled' ? mbzR.value : null;
    const result = {
      image, albums,
      inPlex:    artistInPlex(name),
      country:   mbz?.country   || null,
      startYear: mbz?.startYear || null,
      tags:      mbz?.tags      || [],
      mbid:      mbz?.mbid      || null
    };

    // ── Cache succesvolle response (1 uur TTL) ────────────────────────────
    setCache(cacheKey, result);

    // ── Voeg browser cache header toe ──────────────────────────────────
    res.set('Cache-Control', 'private, max-age=3600');
    res.json(result);
  } catch (e) {
    // ── Geen caching bij errors ────────────────────────────────────────
    res.status(500).json({ error: e.message, image: null, albums: [], inPlex: false, tags: [] });
  }
});

// ── API: Deezer preview ────────────────────────────────────────────────────

app.get('/api/preview', async (req, res) => {
  const artist = (req.query.artist || '').trim();
  const track  = (req.query.track  || '').trim();
  if (!artist || !track) {
    res.set('Cache-Control', 'private, max-age=86400');
    return res.json({ preview: null });
  }

  const cacheKey = `preview:${artist.toLowerCase()}:${track.toLowerCase()}`;
  const cached = getCache(cacheKey, 7 * 24 * 60 * 60 * 1000); // 7 dagen TTL
  if (cached) {
    res.set('Cache-Control', 'private, max-age=86400');
    return res.json(cached);
  }

  try {
    const q   = `artist:"${artist}" track:"${track}"`;
    const url = `https://api.deezer.com/search/track?q=${encodeURIComponent(q)}&limit=3`;
    const data = await fetch(url, { signal: AbortSignal.timeout(5_000) }).then(r => r.json());
    const results = data?.data || [];
    const hit = results.find(t => t.preview) || null;

    const result = hit ? {
      preview: hit.preview,
      title:   hit.title,
      artist:  hit.artist?.name || artist,
      album:   hit.album?.title || '',
      cover:   hit.album?.cover_medium || null
    } : { preview: null };

    setCache(cacheKey, result);
    res.set('Cache-Control', 'private, max-age=86400');
    res.json(result);
  } catch (e) {
    res.set('Cache-Control', 'private, max-age=86400');
    res.json({ preview: null });
  }
});

// ── API: Aanbevelingen ─────────────────────────────────────────────────────

app.get('/api/recs', async (req, res) => {
  const t0 = Date.now();
  try {
    // Cache key rotates every 2 hours to ensure fresh seed rotation
    const cacheKeyRotation = Math.floor(Date.now() / 7_200_000);
    const cacheKey = `api:recs:${cacheKeyRotation}`;
    const cached = getCache(cacheKey, 900_000); // 15 min TTL per key
    if (cached) {
      res.set('Cache-Control', 'private, max-age=300');
      return res.json(cached);
    }

    await syncPlexLibrary();
    const top        = await lfm({ method: 'user.gettopartists', period: '3month', limit: 30 });
    const topArtists = (top.topartists?.artist || []).map(a => a.name);

    // ── 1. SEED-DIVERSITEIT: Top-5 + 5 random uit posities 10-30 ──────────
    const seedArtists = [];
    seedArtists.push(...topArtists.slice(0, 5));
    const candidateRange = topArtists.slice(10, 30);
    if (candidateRange.length > 0) {
      const randomIndices = new Set();
      while (randomIndices.size < Math.min(5, candidateRange.length)) {
        randomIndices.add(Math.floor(Math.random() * candidateRange.length));
      }
      randomIndices.forEach(idx => seedArtists.push(candidateRange[idx]));
    }

    // ── Genre tracking voor genre-spreiding ──────────────────────────────
    const genreCount = {};
    const stopwords = new Set(['seen live', 'listened', 'favourite', 'favorites', 'love', 'loved', 'awesome', 'cool', 'good', 'great']);

    // Helper: haal top-3 tags op met 24-uurs cache per artiest
    async function getArtistTags(artist) {
      const tagCacheKey = `tags:${artist.toLowerCase()}`;
      const tagCached = getCache(tagCacheKey, 86_400_000); // 24 uur TTL
      if (tagCached) return tagCached;
      const result = await lfm({ method: 'artist.gettoptags', artist }, { includeUser: false });
      const tags = (result.toptags?.tag || []).slice(0, 3);
      setCache(tagCacheKey, tags);
      return tags;
    }

    // Verzamel genres van seed artiesten (parallel)
    const seedGenreResults = await Promise.allSettled(
      seedArtists.map(artist => getArtistTags(artist))
    );
    for (const result of seedGenreResults) {
      if (result.status === 'fulfilled') {
        for (const tag of result.value) {
          const name = tag.name.toLowerCase().trim();
          if (name.length > 2 && !stopwords.has(name) && !/^\d+$/.test(name)) {
            genreCount[name] = (genreCount[name] || 0) + 1;
          }
        }
      }
    }

    // ── Artiest-aanbevelingen ──────────────────────────────────────────
    const simResults = await Promise.all(
      seedArtists.map(async artist => {
        try {
          return { artist, similar: await getSimilarArtists(artist, 3) };
        }
        catch { return { artist, similar: [] }; }
      })
    );

    // Verzamel unieke kandidaten (deduplicatie vóór tag-calls)
    const candidates = [];
    const seenNames  = new Set();
    for (const { artist, similar } of simResults) {
      for (const s of similar) {
        if (!topArtists.includes(s.name) && !seenNames.has(s.name)) {
          seenNames.add(s.name);
          candidates.push({ name: s.name, reason: artist, match: parseFloat(s.match) });
        }
      }
    }

    // ── 2. BATCH genre-tags: max 5 concurrent, 24h gecached ──────────────
    const tagTasks   = candidates.map(c => () => getArtistTags(c.name));
    const tagResults = await limitConcurrency(tagTasks, 5);

    // Bereken adjustedMatch met genre-penalisatie
    const recs = candidates.map((c, i) => {
      const inPlex = artistInPlex(c.name);
      let adjustedMatch = c.match * (inPlex ? 0.9 : 1.4);

      const tagResult = tagResults[i];
      if (tagResult?.status === 'fulfilled') {
        let hasOnlyCommonGenres = true;
        let commonGenreCount    = 0;

        for (const tag of tagResult.value) {
          const name = tag.name.toLowerCase().trim();
          if (name.length > 2 && !stopwords.has(name) && !/^\d+$/.test(name)) {
            const count = genreCount[name] || 0;
            if (count < 3) {
              hasOnlyCommonGenres = false;
              break;
            } else {
              commonGenreCount++;
            }
          }
        }

        // Als alle genres al 3+ keer voorkomen, penaliseer met 50%
        if (hasOnlyCommonGenres && commonGenreCount > 0) {
          adjustedMatch *= 0.5;
        }
      }

      return { name: c.name, reason: c.reason, match: c.match, adjustedMatch, inPlex };
    });

    recs.sort((a, b) => b.adjustedMatch - a.adjustedMatch);
    const topRecs = recs.slice(0, 30);
    const top8    = topRecs.slice(0, 8);

    // ── 3. Album- én track-aanbevelingen PARALLEL ────────────────────────
    const [albumResults, trackResults] = await Promise.all([
      Promise.allSettled(
        top8.map(async rec => {
          try {
            const data = await lfm({ method: 'artist.gettopalbums', artist: rec.name, limit: 3 }, { includeUser: false });
            return (data.topalbums?.album || [])
              .filter(a => a.name && a.name !== '(null)' && a.name !== '[unknown]')
              .map(a => {
                const img = a.image?.find(i => i.size === 'large')?.['#text'] || a.image?.find(i => i.size === 'medium')?.['#text'] || null;
                return {
                  album:  a.name,
                  artist: rec.name,
                  reason: rec.reason,
                  image:  (img && !img.includes('2a96cbd8b46e442fc41c2b86b821562f')) ? img : null,
                  inPlex: albumInPlex(rec.name, a.name)
                };
              });
          } catch { return []; }
        })
      ),
      Promise.allSettled(
        top8.map(async rec => {
          try {
            const data = await lfm({ method: 'artist.gettoptracks', artist: rec.name, limit: 3 }, { includeUser: false });
            return (data.toptracks?.track || []).map(t => ({
              track:     t.name,
              artist:    rec.name,
              reason:    rec.reason,
              playcount: parseInt(t.playcount) || 0,
              url:       t.url || null
            }));
          } catch { return []; }
        })
      )
    ]);

    const albumRecs = albumResults
      .filter(r => r.status === 'fulfilled')
      .flatMap(r => r.value)
      .slice(0, 20);

    const trackRecs = trackResults
      .filter(r => r.status === 'fulfilled')
      .flatMap(r => r.value)
      .slice(0, 20);

    const { ok, artistCount } = getPlexStatus();
    const result = {
      recommendations:  topRecs,
      albumRecs,
      trackRecs,
      basedOn:          topArtists,
      seedArtists,      // Transparantie: laat zien welke seeds gebruikt zijn
      plexConnected:    ok,
      plexArtistCount:  artistCount
    };
    markLastFmUp();
    setCache(cacheKey, result); // Cache per 2-uur rotatie
    logger.info({ ms: Date.now() - t0 }, '/api/recs voltooid');
    res.set('Cache-Control', 'private, max-age=300');
    res.json(result);
  } catch (e) {
    markLastFmDown();
    logger.error({ err: e, ms: Date.now() - t0 }, '/api/recs fout');
    // Probeer huidige rotatie-sleutel (stale), daarna vorige rotatie
    const currentKey  = `api:recs:${Math.floor(Date.now() / 7_200_000)}`;
    const previousKey = `api:recs:${Math.floor(Date.now() / 7_200_000) - 1}`;
    const stale = getCache(currentKey, Infinity) || getCache(previousKey, Infinity);
    if (stale) {
      res.set('Cache-Control', 'private, max-age=300');
      return res.json({ ...stale, _stale: true, _staleReason: e.message });
    }
    res.set('Cache-Control', 'private, max-age=300');
    res.status(503).json({ error: 'Last.fm is tijdelijk niet bereikbaar en er is geen gecachede data beschikbaar.', _lfmDown: true });
  }
});

// ── API: Discover & Gaps ───────────────────────────────────────────────────

app.get('/api/discover',          (req, res) => {
  res.set('Cache-Control', 'private, max-age=600');
  res.json(getDiscover());
});
app.get('/api/gaps',              (req, res) => {
  res.set('Cache-Control', 'private, max-age=600');
  res.json(getGaps());
});
app.get('/api/releases',          (req, res) => {
  res.set('Cache-Control', 'private, max-age=300');
  res.json(getReleases());
});
app.post('/api/discover/refresh', (req, res) => res.json(refreshDiscover()));
app.post('/api/gaps/refresh',     (req, res) => res.json(refreshGaps()));
app.post('/api/releases/refresh', (req, res) => res.json(refreshReleases()));

// ── API: Plex ──────────────────────────────────────────────────────────────

// ── Plex Webhook state + SSE ──────────────────────────────────────────────
// Ontvangt real-time events van de Plex Media Server via webhooks (Plex Pass).
// Clients kunnen live updates ontvangen via GET /api/plex/stream (SSE).

let _webhookState = null; // laatste ontvangen Plex webhook event
let _webhookTime  = 0;
const _sseClients = new Set(); // actieve SSE verbindingen

/** Stuur een SSE event naar alle verbonden clients. */
function _sseEmit(eventName, data) {
  const msg = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of _sseClients) {
    try { client.write(msg); }
    catch { _sseClients.delete(client); }
  }
}

/** Parse de Plex multipart/form-data webhook body en retourneer het JSON payload-object. */
function parsePlexWebhook(rawBody, contentType) {
  const bMatch = (contentType || '').match(/boundary=([^\s;]+)/);
  if (!bMatch) return null;
  const bodyStr = rawBody.toString('utf8');
  // Zoek het "payload" form-field in de multipart body
  const re = /Content-Disposition:\s*form-data;\s*name="payload"[\r\n]+[\r\n]+([\s\S]+?)(?:\r?\n--)/;
  const m  = bodyStr.match(re);
  if (!m) return null;
  try { return JSON.parse(m[1].trim()); } catch { return null; }
}

/** POST /api/plex/webhook — ontvang Plex webhooks (Plex Pass vereist).
 *  Configureer in Plex: Instellingen → Webhooks → voeg toe: http://<jouw-server>:9090/api/plex/webhook */
app.post('/api/plex/webhook',
  express.raw({ type: ['multipart/form-data', 'application/x-www-form-urlencoded', '*/*'], limit: '10mb' }),
  (req, res) => {
    const contentType = req.headers['content-type'] || '';
    const payload = parsePlexWebhook(req.body, contentType);
    if (!payload) {
      logger.warn({ contentType }, 'Plex webhook: kon payload niet parsen');
      return res.sendStatus(400);
    }

    const event = payload.event || '';
    const meta  = payload.Metadata;

    // Alleen muziek-events verwerken
    if (!meta || meta.type !== 'track') return res.sendStatus(200);

    if (['media.play','media.resume','media.pause','media.stop','media.scrobble'].includes(event)) {
      const thumb = meta.parentThumb
        ? `${PLEX_URL}${meta.parentThumb}?X-Plex-Token=${PLEX_TOKEN}`
        : (meta.grandparentThumb ? `${PLEX_URL}${meta.grandparentThumb}?X-Plex-Token=${PLEX_TOKEN}` : null);

      _webhookState = {
        event,
        playing:        event === 'media.play' || event === 'media.resume',
        paused:         event === 'media.pause',
        stopped:        event === 'media.stop',
        track:          meta.title || '',
        artist:         meta.grandparentTitle || meta.originalTitle || '',
        album:          meta.parentTitle || '',
        ratingKey:      meta.ratingKey      || null,
        albumRatingKey: meta.parentRatingKey || null,
        thumb,
        duration:       meta.duration   || null,
        viewOffset:     meta.viewOffset  || null,
        state:          event === 'media.pause' ? 'paused' : event === 'media.stop' ? 'stopped' : 'playing',
        playerName:     payload.Player?.title || null,
        playerProduct:  payload.Player?.product || null,
        machineId:      payload.Player?.machineIdentifier || null,
        updatedAt:      Date.now(),
        source:         'webhook',
      };
      _webhookTime = Date.now();
      logger.info({ event, track: meta.title, artist: meta.grandparentTitle }, 'Plex webhook ontvangen');
      _sseEmit('plex', _webhookState);
    }

    res.sendStatus(200);
  }
);

/** GET /api/plex/stream — SSE stream voor real-time Plex events (webhook doorsturen naar browser). */
app.get('/api/plex/stream', (req, res) => {
  res.setHeader('Content-Type',  'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection',    'keep-alive');
  res.flushHeaders();

  _sseClients.add(res);

  // Stuur huidige staat direct bij verbinden
  if (_webhookState) {
    res.write(`event: plex\ndata: ${JSON.stringify(_webhookState)}\n\n`);
  }

  // Heartbeat elke 30s zodat de verbinding open blijft
  const hb = setInterval(() => {
    try { res.write(':heartbeat\n\n'); }
    catch { clearInterval(hb); _sseClients.delete(res); }
  }, 30_000);

  req.on('close', () => {
    clearInterval(hb);
    _sseClients.delete(res);
  });
});

app.get('/api/plex/status', async (req, res) => {
  if (!PLEX_TOKEN) {
    res.set('Cache-Control', 'private, max-age=300');
    return res.json({ connected: false, reason: 'Geen PLEX_TOKEN' });
  }
  try {
    await syncPlexLibrary(true);
    const { ok, artistCount, albumCount, lastSync } = getPlexStatus();
    res.set('Cache-Control', 'private, max-age=300');
    res.json({ connected: ok, artists: artistCount, albums: albumCount, lastSync: new Date(lastSync).toISOString() });
  } catch (e) {
    res.set('Cache-Control', 'private, max-age=300');
    res.json({ connected: false, reason: e.message });
  }
});

app.get('/api/plex/nowplaying', async (req, res) => {
  if (!PLEX_TOKEN) {
    res.set('Cache-Control', 'private, max-age=30');
    return res.json({ playing: false });
  }

  // ── Webhook state preferentie (real-time, max 2 min oud) ─────────────────
  if (_webhookState && Date.now() - _webhookTime < 120_000) {
    const s = _webhookState;
    res.set('Cache-Control', 'no-store');
    if (s.stopped) return res.json({ playing: false, source: 'webhook' });
    return res.json({ ...s, webhookActive: true });
  }

  // ── Fallback: poll Plex API ───────────────────────────────────────────────
  try {
    const data  = await plexGet('/status/sessions');
    const music = (data?.MediaContainer?.Metadata || []).find(s => s.type === 'track');
    if (!music) {
      res.set('Cache-Control', 'private, max-age=30');
      return res.json({ playing: false });
    }
    const thumb = music.parentThumb || music.grandparentThumb;
    res.set('Cache-Control', 'private, max-age=30');
    res.json({
      playing:        music.Player?.state !== 'paused',
      paused:         music.Player?.state === 'paused',
      track:          music.title,
      artist:         music.grandparentTitle || music.originalTitle,
      album:          music.parentTitle,
      ratingKey:      music.ratingKey      || null,
      albumRatingKey: music.parentRatingKey || null,
      thumb:          thumb ? `${PLEX_URL}${thumb}?X-Plex-Token=${PLEX_TOKEN}` : null,
      duration:       music.duration   || null,
      viewOffset:     music.viewOffset || null,
      state:          music.Player?.state || 'playing',
      playerName:     music.Player?.title || music.Player?.product || null,
      playerProduct:  music.Player?.product || null,
      machineId:      music.Player?.machineIdentifier || null,
      source:         'poll',
    });
  } catch {
    res.set('Cache-Control', 'private, max-age=30');
    res.json({ playing: false });
  }
});

app.post('/api/plex/refresh', async (req, res) => {
  if (!PLEX_TOKEN) return res.json({ connected: false, reason: 'Geen PLEX_TOKEN' });
  try {
    await syncPlexLibrary(true);
    const { ok, artistCount, albumCount, lastSync } = getPlexStatus();
    res.json({ connected: ok, artists: artistCount, albums: albumCount, lastSync: new Date(lastSync).toISOString() });
  } catch (e) { res.json({ connected: false, reason: e.message }); }
});

app.get('/api/plex/library', (req, res) => {
  if (!PLEX_TOKEN) {
    res.set('Cache-Control', 'private, max-age=300');
    return res.json({ connected: false, artistCount: 0, albumCount: 0, total: 0, page: 1, limit: 100, library: [] });
  }
  const page  = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(500, Math.max(1, parseInt(req.query.limit) || 100));
  const q     = (req.query.q || '').toLowerCase().trim();
  let lib = getPlexLibrary();
  if (q) lib = lib.filter(x =>
    x.artist.toLowerCase().includes(q) || x.album.toLowerCase().includes(q)
  );
  const { ok, artistCount } = getPlexStatus();
  const total = lib.length;
  const slice = lib.slice((page - 1) * limit, page * limit).map(x => ({
    ...x,
    thumb: x.thumb ? `${PLEX_URL}${x.thumb}?X-Plex-Token=${PLEX_TOKEN}` : null
  }));
  res.set('Cache-Control', 'private, max-age=300');
  res.json({ connected: ok, artistCount, total, page, limit, library: slice });
});

app.get('/api/plex/library/all', (req, res) => {
  if (!PLEX_TOKEN) {
    return res.json({ ok: false, library: [] });
  }
  const lib = getPlexLibrary();
  // Compact array-formaat: [artist, album, ratingKey, thumb] per item
  // Dit is ~60% kleiner dan het object-formaat van /api/plex/library
  const compact = lib.map(x => ([
    x.artist,
    x.album,
    x.ratingKey || '',
    x.thumb ? `${PLEX_URL}${x.thumb}?X-Plex-Token=${PLEX_TOKEN}` : ''
  ]));
  res.set('Cache-Control', 'private, max-age=300');
  res.json({ ok: true, total: compact.length, library: compact });
});

app.get('/api/plex/playlists', async (req, res) => {
  if (!PLEX_TOKEN) {
    res.set('Cache-Control', 'private, max-age=300');
    return res.json({ playlists: [] });
  }
  try {
    const cached = getCache('api:plex:playlists', 300_000); // 5 min cache
    if (cached) {
      res.set('Cache-Control', 'private, max-age=300');
      return res.json(cached);
    }
    const playlists = await getPlexPlaylists();
    const result = { playlists };
    setCache('api:plex:playlists', result);
    res.set('Cache-Control', 'private, max-age=300');
    res.json(result);
  } catch (e) {
    logger.warn({ err: e }, 'Plex playlists ophalen mislukt');
    res.set('Cache-Control', 'private, max-age=300');
    res.status(500).json({ error: e.message, playlists: [] });
  }
});

app.get('/api/plex/playlists/:key/tracks', async (req, res) => {
  if (!PLEX_TOKEN) {
    res.set('Cache-Control', 'private, max-age=60');
    return res.json({ tracks: [] });
  }
  try {
    const key = req.params.key;
    const cached = getCache(`api:plex:playlist:${key}`, 120_000); // 2 min cache
    if (cached) {
      res.set('Cache-Control', 'private, max-age=120');
      return res.json(cached);
    }
    const tracks = await getPlaylistTracks(key);
    const result = { tracks };
    setCache(`api:plex:playlist:${key}`, result);
    res.set('Cache-Control', 'private, max-age=120');
    res.json(result);
  } catch (e) {
    logger.warn({ err: e }, 'Plex playlist tracks ophalen mislukt');
    res.set('Cache-Control', 'private, max-age=120');
    res.status(500).json({ error: e.message, tracks: [] });
  }
});

app.get('/api/plex/album/:key/tracks', async (req, res) => {
  if (!PLEX_TOKEN) {
    res.set('Cache-Control', 'private, max-age=60');
    return res.json({ tracks: [] });
  }
  try {
    const key = req.params.key;
    const cached = getCache(`api:plex:album:${key}`, 120_000); // 2 min cache
    if (cached) {
      res.set('Cache-Control', 'private, max-age=600');
      return res.json(cached);
    }
    const tracks = await getAlbumTracks(key);
    const result = { tracks };
    setCache(`api:plex:album:${key}`, result);
    res.set('Cache-Control', 'private, max-age=600');
    res.json(result);
  } catch (e) {
    logger.warn({ err: e }, 'Plex album tracks ophalen mislukt');
    res.set('Cache-Control', 'private, max-age=600');
    res.status(500).json({ error: e.message, tracks: [] });
  }
});

app.get('/api/plex/stream/audio/:ratingKey', async (req, res) => {
  if (!PLEX_TOKEN) return res.status(503).json({ error: 'Geen PLEX_TOKEN geconfigureerd' });
  try {
    const { ratingKey } = req.params;
    const data = await plexGet(`/library/metadata/${ratingKey}`);
    const partKey = data?.MediaContainer?.Metadata?.[0]?.Media?.[0]?.Part?.[0]?.key;
    if (!partKey) return res.status(404).json({ error: 'Track niet gevonden' });
    const separator = partKey.includes('?') ? '&' : '?';
    return res.redirect(302, `${PLEX_URL}${partKey}${separator}X-Plex-Token=${PLEX_TOKEN}`);
  } catch (e) {
    logger.warn({ err: e }, 'Plex audio stream ophalen mislukt');
    res.status(500).json({ error: e.message });
  }
});

// ── API: Plex Playback Control ────────────────────────────────────────────

app.get('/api/plex/clients', async (req, res) => {
  if (!PLEX_TOKEN) return res.json({ clients: [] });
  try {
    // Invalideer cache als ?t= (forced refresh) meegegeven wordt
    const clients = await getPlexClients(!!req.query.t);
    res.set('Cache-Control', 'no-store');
    res.json({ clients });
  } catch (e) {
    res.json({ clients: [], error: e.message });
  }
});

// Debug-endpoint: toon ruwe Plex sessies en /clients om relay-problemen te diagnosticeren
app.get('/api/plex/clients/debug', async (req, res) => {
  if (!PLEX_TOKEN) return res.status(503).json({ error: 'Geen PLEX_TOKEN' });
  try {
    const [sessionsRaw, clientsRaw] = await Promise.allSettled([
      plexGet('/status/sessions'),
      plexGet('/clients'),
    ]);
    const sessions = sessionsRaw.status === 'fulfilled'
      ? (sessionsRaw.value?.MediaContainer?.Metadata || []).map(m => ({
          title: m.title, type: m.type,
          player: m.Player ? {
            machineId: m.Player.machineIdentifier,
            name: m.Player.title, product: m.Player.product,
            state: m.Player.state, address: m.Player.address, port: m.Player.port,
          } : null,
        }))
      : { error: sessionsRaw.reason?.message };
    const clientsList = clientsRaw.status === 'fulfilled'
      ? (clientsRaw.value?.MediaContainer?.Server || []).map(c => ({
          name: c.name, machineId: c.machineIdentifier,
          product: c.product, host: c.host, port: c.port,
        }))
      : { error: clientsRaw.reason?.message };
    res.json({ sessions, clients: clientsList });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/plex/play', async (req, res) => {
  if (!PLEX_TOKEN) return res.status(503).json({ error: 'Geen PLEX_TOKEN geconfigureerd' });
  const { machineId, ratingKey, type = 'music' } = req.body || {};
  if (!machineId || !ratingKey) return res.status(400).json({ error: 'machineId en ratingKey zijn vereist' });
  try {
    // '__web__' = lokale web browser player
    if (machineId === '__web__') {
      // Return stream URL voor web playback
      const streamUrl = `${PLEX_URL}/library/metadata/${ratingKey}/part?download=0&X-Plex-Token=${PLEX_TOKEN}`;
      return res.json({ ok: true, webStream: streamUrl });
    }

    await playOnClient(machineId, String(ratingKey), type);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post('/api/plex/pause', async (req, res) => {
  if (!PLEX_TOKEN) return res.status(503).json({ error: 'Geen PLEX_TOKEN geconfigureerd' });
  const { machineId } = req.body || {};
  if (!machineId) return res.status(400).json({ error: 'machineId is vereist' });
  try {
    await pauseClient(machineId);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post('/api/plex/skip', async (req, res) => {
  if (!PLEX_TOKEN) return res.status(503).json({ error: 'Geen PLEX_TOKEN geconfigureerd' });
  const { machineId, direction = 'next' } = req.body || {};
  if (!machineId) return res.status(400).json({ error: 'machineId is vereist' });
  try {
    if (direction === 'prev') await skipPrev(machineId);
    else await skipNext(machineId);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post('/api/plex/rate', async (req, res) => {
  if (!PLEX_TOKEN) return res.status(503).json({ error: 'Geen PLEX_TOKEN geconfigureerd' });
  const { ratingKey, rating } = req.body || {};

  // Validatie
  if (!ratingKey) return res.status(400).json({ error: 'ratingKey is vereist' });
  if (typeof rating !== 'number' || rating < 0 || rating > 10 || !Number.isInteger(rating)) {
    return res.status(400).json({ error: 'rating moet een geheel getal tussen 0 en 10 zijn' });
  }

  try {
    await rateItem(String(ratingKey), rating);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ── API: Zoeken ────────────────────────────────────────────────────────────

app.get('/api/search', async (req, res) => {
  const q = (req.query.q || '').trim();
  if (q.length < 2) {
    res.set('Cache-Control', 'private, max-age=300');
    return res.json({ results: [] });
  }
  try {
    const [searchR, deezerR] = await Promise.allSettled([
      lfm({ method: 'artist.search', artist: q, limit: 6 }, { includeUser: false }),
      fetch(`https://api.deezer.com/search/artist?q=${encodeURIComponent(q)}&limit=6`, { signal: AbortSignal.timeout(5_000) }).then(r => r.json())
    ]);
    const artists = searchR.status === 'fulfilled'
      ? (searchR.value.results?.artistmatches?.artist || []).slice(0, 6)
      : [];
    const deezerMap = {};
    if (deezerR.status === 'fulfilled') {
      for (const d of (deezerR.value?.data || [])) {
        if (d.picture_medium && !d.picture_medium.includes('/artist//'))
          deezerMap[d.name.toLowerCase()] = d.picture_medium;
      }
    }
    const results = artists.map(a => ({
      name: a.name,
      listeners: parseInt(a.listeners) || 0,
      image: deezerMap[a.name.toLowerCase()] || null
    }));
    res.set('Cache-Control', 'private, max-age=300');
    res.json({ results });
  } catch (e) {
    // Zoeken werkt gedeeltelijk zonder Last.fm (alleen Deezer-afbeeldingen)
    res.set('Cache-Control', 'private, max-age=300');
    res.json({ results: [], _lfmDown: true, error: e.message });
  }
});

// ── API: Vergelijkbare artiesten ───────────────────────────────────────────

app.get('/api/artist/:name/similar', async (req, res) => {
  const name = decodeURIComponent(req.params.name);
  try {
    const similar = await getSimilarArtists(name, 6);
    res.set('Cache-Control', 'private, max-age=300');
    res.json({ similar });
  } catch (e) {
    res.set('Cache-Control', 'private, max-age=300');
    res.json({ similar: [], _lfmDown: true, error: e.message });
  }
});

// ── API: Statistieken ──────────────────────────────────────────────────────

app.get('/api/stats', async (req, res) => {
  try {
    const cached = getCache('stats', 3_600_000);
    if (cached) return res.json(cached);

    const [recentR, topR] = await Promise.allSettled([
      lfm({ method: 'user.getrecenttracks', limit: 200 }),
      lfm({ method: 'user.gettopartists', period: '1month', limit: 15 })
    ]);

    // Dagelijkse scrobbles
    const tracks = recentR.status === 'fulfilled'
      ? (recentR.value.recenttracks?.track || []).filter(t => t.date?.uts)
      : [];
    const now = Date.now();
    const days = {};
    for (let i = 6; i >= 0; i--) {
      const key = new Date(now - i * 86_400_000).toISOString().split('T')[0];
      days[key] = 0;
    }
    for (const t of tracks) {
      const key = new Date(parseInt(t.date.uts) * 1000).toISOString().split('T')[0];
      if (key in days) days[key]++;
    }
    const dailyScrobbles = Object.entries(days).map(([date, count]) => ({ date, count }));

    // Top artiesten deze maand
    const topArtists = topR.status === 'fulfilled'
      ? (topR.value.topartists?.artist || []).slice(0, 10).map(a => ({
          name: a.name, playcount: parseInt(a.playcount) || 0
        }))
      : [];

    // Genre-verdeling via artiest-tags
    const stopwords = new Set(['seen live','listened','favourite','favorites','love','loved','awesome','cool','good','great']);
    const tagCounts = {};
    const tagResults = await Promise.allSettled(
      topArtists.slice(0, 8).map(a =>
        lfm({ method: 'artist.gettoptags', artist: a.name }, { includeUser: false })
      )
    );
    for (const r of tagResults) {
      if (r.status !== 'fulfilled') continue;
      for (const tag of (r.value.toptags?.tag || []).slice(0, 3)) {
        const name = tag.name.toLowerCase().trim();
        if (name.length > 2 && !stopwords.has(name) && !/^\d+$/.test(name))
          tagCounts[name] = (tagCounts[name] || 0) + 1;
      }
    }
    const genres = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1]).slice(0, 8)
      .map(([name, count]) => ({ name, count }));

    const result = { dailyScrobbles, topArtists, genres };
    markLastFmUp();
    setCache('stats', result);
    res.set('Cache-Control', 'private, max-age=900');
    res.json(result);
  } catch (e) { staleOrError('stats', e, res); }
});

// ── API: Verlanglijst ──────────────────────────────────────────────────────

app.get('/api/wishlist', (req, res) => {
  res.set('Cache-Control', 'private, max-age=300');
  res.json(getWishlist());
});

app.post('/api/wishlist', (req, res) => {
  const { type, name, artist, image } = req.body || {};
  if (!type || !name) return res.status(400).json({ error: 'type en name zijn verplicht' });
  const id = addToWishlist(type, name, artist || null, image || null);
  res.json({ id, added: true });
});

app.delete('/api/wishlist/:id', (req, res) => {
  removeFromWishlist(parseInt(req.params.id));
  res.json({ removed: true });
});

// ── API: Tidarr ────────────────────────────────────────────────────────────

app.get('/api/tidarr/status', async (req, res) => {
  try {
    const result = await getTidarrStatus();
    res.set('Cache-Control', 'private, max-age=60');
    res.json(result);
  }
  catch (e) {
    res.set('Cache-Control', 'private, max-age=60');
    res.status(500).json({ connected: false, reason: e.message });
  }
});

app.get('/api/tidarr/search', async (req, res) => {
  const q = (req.query.q || '').trim();
  if (q.length < 2) {
    res.set('Cache-Control', 'private, max-age=300');
    return res.json({ results: [] });
  }
  try {
    const result = await searchTidal(q);
    res.set('Cache-Control', 'private, max-age=300');
    res.json(result);
  }
  catch (e) {
    res.set('Cache-Control', 'private, max-age=300');
    res.status(500).json({ error: e.message, results: [] });
  }
});

// Slim album-zoeken met meerdere strategieën en fuzzy matching.
// Geeft het best passende album terug, of 404 als niets gevonden.
app.get('/api/tidarr/find', async (req, res) => {
  const artist = (req.query.artist || '').trim();
  const album  = (req.query.album  || '').trim();
  if (!album) {
    res.set('Cache-Control', 'private, max-age=300');
    return res.status(400).json({ error: 'album is verplicht' });
  }
  try {
    const match = await findBestAlbum(artist, album);
    if (!match) {
      res.set('Cache-Control', 'private, max-age=300');
      return res.status(404).json({ error: 'Niet gevonden', artist, album });
    }
    res.set('Cache-Control', 'private, max-age=300');
    res.json(match);
  } catch (e) {
    res.set('Cache-Control', 'private, max-age=300');
    res.status(500).json({ error: e.message });
  }
});

// Geeft de top-3 kandidaten terug zodat de frontend een keuze-dialog kan tonen.
app.get('/api/tidarr/candidates', async (req, res) => {
  const artist = (req.query.artist || '').trim();
  const album  = (req.query.album  || '').trim();
  if (!album) {
    res.set('Cache-Control', 'private, max-age=300');
    return res.status(400).json({ error: 'album is verplicht' });
  }
  try {
    const candidates = await findTopAlbums(artist, album, 3);
    if (!candidates.length) {
      res.set('Cache-Control', 'private, max-age=300');
      return res.status(404).json({ error: 'Niet gevonden', artist, album });
    }
    res.set('Cache-Control', 'private, max-age=300');
    res.json({ candidates });
  } catch (e) {
    res.set('Cache-Control', 'private, max-age=300');
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/tidarr/download', async (req, res) => {
  const { url, type, title, artist, id, quality } = req.body || {};
  if (!url) return res.status(400).json({ error: 'url is verplicht' });
  const validQualities = ['max', 'high', 'normal', 'low'];
  const q = validQualities.includes(quality) ? quality : null;
  try {
    const result = await addToQueue(url, type || 'album', title || '', artist || '', id || '', q);
    // Trigger Plex library scan na succesvolle toevoeging aan wachtrij
    triggerPlexScan().catch(e => logger.warn({ err: e }, 'Plex scan trigger mislukt'));
    // Sla op in de persistente download-geschiedenis
    addDownload({ tidal_id: id || null, artist: artist || '', title: title || '', url, quality: q || process.env.LOCK_QUALITY || 'high' });
    res.json({ ok: true, result });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

app.get('/api/tidarr/queue', async (req, res) => {
  try {
    const result = await getQueue();
    res.set('Cache-Control', 'private, max-age=60');
    res.json(result);
  }
  catch (e) {
    res.set('Cache-Control', 'private, max-age=60');
    res.status(500).json({ error: e.message, items: [] });
  }
});

app.delete('/api/tidarr/queue/:id', async (req, res) => {
  try {
    const result = await removeFromQueue(req.params.id);
    res.json({ ok: true, result });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

app.get('/api/tidarr/history', async (req, res) => {
  try {
    const result = await getHistory();
    res.set('Cache-Control', 'private, max-age=300');
    res.json(result);
  }
  catch (e) {
    res.set('Cache-Control', 'private, max-age=300');
    res.status(500).json({ error: e.message, items: [] });
  }
});

// ── Download-geschiedenis (persistente SQLite-opslag) ──────────────────────

app.get('/api/downloads', (req, res) => {
  try {
    const result = getDownloads();
    res.set('Cache-Control', 'private, max-age=300');
    res.json(result);
  }
  catch (e) {
    res.set('Cache-Control', 'private, max-age=300');
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/downloads/keys', (req, res) => {
  try {
    const result = [...getDownloadKeys()];
    res.set('Cache-Control', 'private, max-age=300');
    res.json(result);
  }
  catch (e) {
    res.set('Cache-Control', 'private, max-age=300');
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/downloads', (req, res) => {
  const { tidal_id, artist, title, url, quality } = req.body || {};
  if (!title) return res.status(400).json({ error: 'title is verplicht' });
  try {
    addDownload({ tidal_id, artist, title, url, quality });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/downloads/:id', (req, res) => {
  try {
    removeDownload(Number(req.params.id));
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Tidarr SSE-proxy: stuurt real-time queue updates door naar de browser ──
app.get('/api/tidarr/stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const tidarrBase = (process.env.TIDARR_URL || 'http://localhost:8484').replace(/\/$/, '');
  const apiKey     = process.env.TIDARR_API_KEY || '';
  const sseUrl     = `${tidarrBase}/api/stream-processing${apiKey ? `?apikey=${encodeURIComponent(apiKey)}` : ''}`;

  const ac = new AbortController();
  req.on('close', () => ac.abort());

  // Stuur elke 25s een keepalive comment zodat de verbinding open blijft
  // en ERR_INCOMPLETE_CHUNKED_ENCODING wordt voorkomen bij idle streams.
  const heartbeat = setInterval(() => {
    if (!res.writableEnded) res.write(': keepalive\n\n');
  }, 25_000);

  try {
    const upstream = await fetch(sseUrl, { signal: ac.signal });
    const reader   = upstream.body.getReader();
    const dec      = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(dec.decode(value, { stream: true }));
    }
  } catch { /* verbinding gesloten */ }
  clearInterval(heartbeat);
  if (!res.writableEnded) res.end();
});

// ── API: Spotify mood-aanbevelingen ───────────────────────────────────────────
// GET /api/spotify/recs?mood=chill
// Haalt top-5 artiesten van Last.fm, zoekt hun Spotify IDs, en roept de
// Recommendations-API aan met mood-specifieke audio features.
// Cache per mood, 30 minuten TTL. Graceful fallback: [] bij fout.

app.get('/api/spotify/recs', async (req, res) => {
  if (!SPOTIFY_OK) {
    res.set('Cache-Control', 'private, max-age=300');
    return res.json([]);
  }

  const mood = (req.query.mood || '').toLowerCase().trim();
  const audioFeatures = MOODS[mood];
  if (!audioFeatures) {
    res.set('Cache-Control', 'private, max-age=300');
    return res.status(400).json({ error: `Onbekende mood: ${mood}. Kies uit: ${Object.keys(MOODS).join(', ')}` });
  }

  const cacheKey = `spotify:recs:${mood}`;
  const cached   = getCache(cacheKey, 30 * 60 * 1000); // 30 min TTL
  if (cached) {
    res.set('Cache-Control', 'private, max-age=300');
    return res.json(cached);
  }

  try {
    // Haal top-5 artiesten van Last.fm (3 maanden periode)
    const top        = await lfm({ method: 'user.gettopartists', period: '3month', limit: 10 });
    const topNames   = (top.topartists?.artist || []).slice(0, 5).map(a => a.name);

    // Zoek Spotify IDs parallel
    const idResults  = await Promise.all(topNames.map(n => searchArtistId(n)));
    const seedIds    = idResults.filter(Boolean);

    if (!seedIds.length) {
      setCache(cacheKey, []);
      res.set('Cache-Control', 'private, max-age=300');
      return res.json([]);
    }

    // Haal aanbevelingen op
    const tracks = await getRecommendations(seedIds, audioFeatures);

    // Normaliseer naar bruikbaar formaat
    const result = tracks.map(t => ({
      name:        t.name,
      artist:      t.artists?.[0]?.name || '',
      album:       t.album?.name || '',
      image:       t.album?.images?.[1]?.url || t.album?.images?.[0]?.url || null,
      preview_url: t.preview_url || null,
      spotify_url: t.external_urls?.spotify || null
    }));

    setCache(cacheKey, result);
    res.set('Cache-Control', 'private, max-age=300');
    res.json(result);
  } catch (e) {
    logger.warn({ err: e }, 'Spotify recs fout (graceful fallback)');
    res.set('Cache-Control', 'private, max-age=300');
    res.json([]);
  }
});

// Geeft de beschikbare moods + of Spotify geconfigureerd is.
app.get('/api/spotify/status', (req, res) => {
  res.set('Cache-Control', 'private, max-age=600');
  res.json({ enabled: SPOTIFY_OK, moods: SPOTIFY_OK ? Object.keys(MOODS) : [] });
});

// ── API: Image proxy ───────────────────────────────────────────────────────
// GET /api/img?url=ENCODED_URL&w=120&h=120
// Resizet en converteert externe afbeeldingen naar WebP (met disk-cache).
// Fallback: redirect naar de originele URL als sharp faalt (bijv. SVG).

app.get('/api/img', async (req, res) => {
  const url = (req.query.url || '').trim();
  if (!url) return res.status(400).json({ error: 'url parameter is verplicht' });

  // Basisvalidatie: sta alleen http(s)-URLs toe
  if (!/^https?:\/\//i.test(url)) {
    return res.status(400).json({ error: 'Ongeldige URL' });
  }

  const w      = parseInt(req.query.w) || 120;
  const h      = parseInt(req.query.h) || 0;
  const format = (req.query.fmt || 'webp') === 'jpeg' ? 'jpeg' : 'webp';
  const mime   = format === 'jpeg' ? 'image/jpeg' : 'image/webp';

  try {
    const buffer = await proxyImage(url, w, h, format);
    res.set({
      'Content-Type':  mime,
      'Cache-Control': 'public, max-age=604800, immutable',
      'X-Proxy-Cache': 'hit'
    });
    return res.send(buffer);
  } catch (err) {
    // Als sharp faalt (bijv. SVG of corrupt bestand): stuur redirect
    logger.warn({ err, url }, '/api/img proxy mislukt, redirect naar origineel');
    return res.redirect(302, url);
  }
});

// ── Health check ───────────────────────────────────────────────────────────

app.get('/health', (req, res) => {
  const { ok: plexConnected } = getPlexStatus();
  const discoverAge = getCacheAge('discover');
  const gapsAge     = getCacheAge('gaps');
  res.json({
    status:       'ok',
    uptime:       Math.round(process.uptime()),
    plexConnected,
    lastFmDown,
    lastFmDownSince: lastFmDownSince ? new Date(lastFmDownSince).toISOString() : null,
    cache: {
      discover: discoverAge < Infinity ? Math.round(discoverAge / 1000) + 's' : 'leeg',
      gaps:     gapsAge     < Infinity ? Math.round(gapsAge     / 1000) + 's' : 'leeg'
    }
  });
});

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
