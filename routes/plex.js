// ── Plex API Routes ───────────────────────────────────────────────────────────

const logger = require('../logger');
const { Readable } = require('stream');

module.exports = function(app, deps) {
  const {
    plexGet, plexPost, plexPut, syncPlexLibrary, artistInPlex, albumInPlex,
    getPlexStatus, getPlexLibrary, getAlbumRatingKey, getPlexClients, playOnClient,
    pauseClient, stopClient, skipNext, skipPrev, getPlexPlaylists, getPlaylistTracks,
    getAlbumTracks, triggerPlexScan, rateItem, searchPlexLibrary, PLEX_TOKEN, PLEX_URL, getCache, setCache,
    getPlayHistory, aggregateTopArtists, aggregateTopTracks, aggregateDailyPlays, enrichArtistsWithThumbs, getGenresFromPlex
  } = deps;

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

  // ── /api/plex/webhook ─────────────────────────────────────────────────────
  const express = require('express');
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
        const plexStreamUrl = process.env.PLEX_URL_EXTERNAL || PLEX_URL;
        const thumb = meta.parentThumb
          ? `${plexStreamUrl}${meta.parentThumb}?X-Plex-Token=${PLEX_TOKEN}`
          : (meta.grandparentThumb ? `${plexStreamUrl}${meta.grandparentThumb}?X-Plex-Token=${PLEX_TOKEN}` : null);

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

  // ── /api/plex/stream ──────────────────────────────────────────────────────
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

  // ── /api/plex/status ──────────────────────────────────────────────────────
  app.get('/api/plex/status', async (req, res) => {
    if (!PLEX_TOKEN) {
      res.set('Cache-Control', 'private, max-age=300');
      return res.json({ connected: false, reason: 'Geen PLEX_TOKEN' });
    }
    try {
      await syncPlexLibrary(true);
      const { ok, artistCount, albumCount, trackCount, lastSync } = getPlexStatus();
      res.set('Cache-Control', 'private, max-age=300');
      res.json({ connected: ok, artists: artistCount, albums: albumCount, tracks: trackCount, lastSync: new Date(lastSync).toISOString() });
    } catch (e) {
      res.set('Cache-Control', 'private, max-age=300');
      res.json({ connected: false, reason: e.message });
    }
  });

  // ── /api/plex/nowplaying ─────────────────────────────────────────────────
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
      const plexStreamUrl = process.env.PLEX_URL_EXTERNAL || PLEX_URL;
      res.set('Cache-Control', 'private, max-age=30');
      res.json({
        playing:        music.Player?.state !== 'paused',
        paused:         music.Player?.state === 'paused',
        track:          music.title,
        artist:         music.grandparentTitle || music.originalTitle,
        album:          music.parentTitle,
        ratingKey:      music.ratingKey      || null,
        albumRatingKey: music.parentRatingKey || null,
        thumb:          thumb ? `${plexStreamUrl}${thumb}?X-Plex-Token=${PLEX_TOKEN}` : null,
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

  // ── /api/plex/refresh ─────────────────────────────────────────────────────
  app.post('/api/plex/refresh', async (req, res) => {
    if (!PLEX_TOKEN) return res.json({ connected: false, reason: 'Geen PLEX_TOKEN' });
    try {
      await syncPlexLibrary(true);
      const { ok, artistCount, albumCount, trackCount, lastSync } = getPlexStatus();
      res.json({ connected: ok, artists: artistCount, albums: albumCount, tracks: trackCount, lastSync: new Date(lastSync).toISOString() });
    } catch (e) { res.json({ connected: false, reason: e.message }); }
  });

  // ── /api/plex/library ─────────────────────────────────────────────────────
  app.get('/api/plex/library', (req, res) => {
    if (!PLEX_TOKEN) {
      res.set('Cache-Control', 'private, max-age=300');
      return res.json({ connected: false, artistCount: 0, albumCount: 0, total: 0, page: 1, limit: 100, library: [] });
    }
    const page  = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(500, Math.max(1, parseInt(req.query.limit) || 100));
    const q     = (req.query.q || '').toLowerCase().trim();
    const sort  = req.query.sort || null; // e.g., "addedAt:desc"

    let lib = getPlexLibrary();

    if (q) lib = lib.filter(x =>
      x.artist.toLowerCase().includes(q) || x.album.toLowerCase().includes(q)
    );

    // Sorteer indien nodig
    if (sort === 'addedAt:desc') {
      lib = lib.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
    } else if (sort === 'addedAt:asc') {
      lib = lib.sort((a, b) => (a.addedAt || 0) - (b.addedAt || 0));
    }

    const { ok, artistCount } = getPlexStatus();
    const total = lib.length;
    const plexStreamUrl = process.env.PLEX_URL_EXTERNAL || PLEX_URL;
    const slice = lib.slice((page - 1) * limit, page * limit).map(x => ({
      ...x,
      thumb: x.thumb ? `${plexStreamUrl}${x.thumb}?X-Plex-Token=${PLEX_TOKEN}` : null
    }));
    res.set('Cache-Control', 'private, max-age=300');
    res.json({ connected: ok, artistCount, total, page, limit, library: slice });
  });

  // ── /api/plex/library/all ─────────────────────────────────────────────────
  app.get('/api/plex/library/all', async (req, res) => {
    if (!PLEX_TOKEN) {
      res.set('Cache-Control', 'private, max-age=300');
      return res.json({ ok: false, library: [] });
    }
    try {
      // Ensure library is synced before returning
      await syncPlexLibrary(false);
      const lib = getPlexLibrary();
      const plexStreamUrl = process.env.PLEX_URL_EXTERNAL || PLEX_URL;
      // Compact array-formaat: [artist, album, ratingKey, thumb, addedAt] per item
      // Dit is ~60% kleiner dan het object-formaat van /api/plex/library
      const compact = (lib || []).map(x => ([
        x.artist,
        x.album,
        x.ratingKey || '',
        x.thumb ? `${plexStreamUrl}${x.thumb}?X-Plex-Token=${PLEX_TOKEN}` : '',
        x.addedAt || 0  // Unix timestamp
      ]));
      res.set('Cache-Control', 'private, max-age=300');
      res.json({ ok: true, total: compact.length, library: compact });
    } catch (e) {
      logger.warn({ err: e }, 'Plex library/all ophalen mislukt');
      res.set('Cache-Control', 'private, max-age=300');
      res.status(500).json({ ok: false, error: e.message, library: [] });
    }
  });

  // ── /api/plex/playlists ──────────────────────────────────────────────────
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

  // ── /api/plex/playlists/:key/tracks ──────────────────────────────────────
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

  // ── /api/plex/album/:key/tracks ──────────────────────────────────────────
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

  // ── /api/plex/stream/audio/:ratingKey ─────────────────────────────────────
  app.get('/api/plex/stream/audio/:ratingKey', async (req, res) => {
    if (!PLEX_TOKEN) return res.status(503).json({ error: 'Geen PLEX_TOKEN geconfigureerd' });
    try {
      const { ratingKey } = req.params;
      const data = await plexGet(`/library/metadata/${ratingKey}`);
      const partKey = data?.MediaContainer?.Metadata?.[0]?.Media?.[0]?.Part?.[0]?.key;
      if (!partKey) return res.status(404).json({ error: 'Track niet gevonden' });

      // Construct the full Plex URL with token
      const separator = partKey.includes('?') ? '&' : '?';
      const plexStreamUrl = `${PLEX_URL}${partKey}${separator}X-Plex-Token=${PLEX_TOKEN}`;

      // Build headers for the fetch request
      const fetchHeaders = {};
      if (req.headers.range) {
        fetchHeaders['Range'] = req.headers.range;
      }

      // Fetch the audio stream from Plex
      const plexRes = await fetch(plexStreamUrl, { headers: fetchHeaders });

      // Handle non-2xx responses
      if (!plexRes.ok) {
        logger.warn({ status: plexRes.status, statusText: plexRes.statusText }, 'Plex audio stream fout');
        return res.status(502).json({ error: `Plex returned ${plexRes.status}: ${plexRes.statusText}` });
      }

      // Handle 206 Partial Content (Range request)
      if (plexRes.status === 206) {
        res.status(206);
        const contentRange = plexRes.headers.get('Content-Range');
        if (contentRange) {
          res.setHeader('Content-Range', contentRange);
        }
      }

      // Copy Content-Type header
      const contentType = plexRes.headers.get('Content-Type');
      if (contentType) {
        res.setHeader('Content-Type', contentType);
      }

      // Copy Content-Length header if present
      const contentLength = plexRes.headers.get('Content-Length');
      if (contentLength) {
        res.setHeader('Content-Length', contentLength);
      }

      // Set caching and seek support headers
      res.setHeader('Cache-Control', 'private, max-age=300');
      res.setHeader('Accept-Ranges', 'bytes');

      // Pipe the Plex response body to res
      const readable = Readable.from(plexRes.body);
      readable.pipe(res).on('error', (err) => {
        logger.warn({ err }, 'Plex audio stream pipe fout');
        if (!res.headersSent) {
          res.status(502).json({ error: 'Stream fout' });
        }
      });
    } catch (e) {
      logger.warn({ err: e }, 'Plex audio stream ophalen mislukt');
      if (!res.headersSent) {
        res.status(500).json({ error: e.message });
      }
    }
  });

  // ── /api/plex/clients ─────────────────────────────────────────────────────
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

  // ── /api/plex/clients/debug ──────────────────────────────────────────────
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

  // ── /api/plex/play ────────────────────────────────────────────────────────
  app.post('/api/plex/play', async (req, res) => {
    if (!PLEX_TOKEN) return res.status(503).json({ error: 'Geen PLEX_TOKEN geconfigureerd' });
    const { machineId, ratingKey, type = 'music' } = req.body || {};
    if (!machineId || !ratingKey) return res.status(400).json({ error: 'machineId en ratingKey zijn vereist' });
    try {
      // '__web__' = lokale web browser player
      if (machineId === '__web__') {
        // Get track metadata to extract the actual audio Part key
        const data = await plexGet(`/library/metadata/${ratingKey}`);
        const meta = data?.MediaContainer?.Metadata?.[0];

        if (!meta) return res.status(404).json({ error: 'Track niet gevonden of geen audio beschikbaar' });

        // Use local proxy endpoint instead of direct Plex URL (keeps token server-side)
        const webStream = `/api/plex/stream/audio/${ratingKey}`;

        // Extract track metadata
        // Use external URL for browser-facing responses (thumbs)
        const plexStreamUrl = process.env.PLEX_URL_EXTERNAL || PLEX_URL;
        const track = meta?.title || null;
        const artist = meta?.grandparentTitle || meta?.originalTitle || null;
        const album = meta?.parentTitle || null;
        const thumb = meta?.parentThumb
          ? `${plexStreamUrl}${meta.parentThumb}?X-Plex-Token=${PLEX_TOKEN}`
          : null;
        const duration = meta?.duration || null;

        return res.json({
          ok: true,
          webStream,
          track,
          artist,
          album,
          thumb,
          duration
        });
      }

      await playOnClient(machineId, String(ratingKey), type);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ ok: false, error: e.message });
    }
  });

  // ── /api/plex/pause ───────────────────────────────────────────────────────
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

  // ── /api/plex/skip ────────────────────────────────────────────────────────
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

  // ── /api/plex/rate ────────────────────────────────────────────────────────
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

  // ── /api/plex/artists ─────────────────────────────────────────────────────
  // GET alle artiesten uit Plex. Cached voor 10 minuten.
  app.get('/api/plex/artists', async (req, res) => {
    if (!PLEX_TOKEN) {
      res.set('Cache-Control', 'private, max-age=300');
      return res.json({ artists: [] });
    }

    try {
      // Controleer cache (10 minuten)
      const cacheKey = 'api:plex:artists:all';
      const cached = getCache(cacheKey, 600_000);
      if (cached) {
        res.set('Cache-Control', 'private, max-age=600');
        return res.json(cached);
      }

      // Ensure library is synced before fetching
      await syncPlexLibrary(false);

      // Verkrijg muziek section key
      const sections = await plexGet('/library/sections');
      const music = (sections?.MediaContainer?.Directory || []).find(s => s.type === 'artist');
      if (!music) {
        res.set('Cache-Control', 'private, max-age=300');
        return res.json({ artists: [] });
      }

      // Haal alle artiesten op (type=8)
      const data = await plexGet(`/library/sections/${music.key}/all?type=8`);
      const artistMeta = (data?.MediaContainer?.Metadata || []);
      const plexStreamUrl = process.env.PLEX_URL_EXTERNAL || PLEX_URL;

      // Map artiesten naar vereist formaat en sorteer op naam
      const artists = artistMeta
        .map(a => ({
          ratingKey: a.ratingKey,
          title: a.title || '',
          thumb: a.thumb ? `${plexStreamUrl}${a.thumb}?X-Plex-Token=${PLEX_TOKEN}` : null,
          albumCount: a.leafCount || 0,
          genre: (a.Genre && Array.isArray(a.Genre) ? a.Genre.map(g => g.tag).join(', ') : (a.Genre?.tag || ''))
        }))
        .sort((a, b) => a.title.localeCompare(b.title, 'nl', { sensitivity: 'base' }));

      const result = { artists };
      setCache(cacheKey, result);
      res.set('Cache-Control', 'private, max-age=600');
      res.json(result);
    } catch (e) {
      logger.warn({ err: e }, 'Plex artists ophalen mislukt');
      res.set('Cache-Control', 'private, max-age=300');
      res.status(500).json({ error: e.message, artists: [] });
    }
  });

  // ── /api/plex/tracks ──────────────────────────────────────────────────────
  // GET nummers uit Plex met optioneel filtering op artiest/album en paginatie.
  // Cached voor 10 minuten.
  app.get('/api/plex/tracks', async (req, res) => {
    if (!PLEX_TOKEN) {
      res.set('Cache-Control', 'private, max-age=60');
      return res.json({ tracks: [], total: 0, limit: 100, offset: 0 });
    }

    try {
      const artist = (req.query.artist || '').trim().toLowerCase();
      const album = (req.query.album || '').trim().toLowerCase();
      const limit = Math.min(500, Math.max(1, parseInt(req.query.limit) || 100));
      const offset = Math.max(0, parseInt(req.query.offset) || 0);

      // NIEUW: Cache alle tracks voor 10 minuten
      const cacheKey = 'api:plex:tracks:all';
      let allTracks = getCache(cacheKey, 600_000);
      if (!allTracks) {
        await syncPlexLibrary(false);
        const sections = await plexGet('/library/sections');
        const music = (sections?.MediaContainer?.Directory || []).find(s => s.type === 'artist');
        if (!music) {
          res.set('Cache-Control', 'private, max-age=60');
          return res.json({ tracks: [], total: 0, limit, offset });
        }
        const data = await plexGet(`/library/sections/${music.key}/all?type=10`);
        const trackMeta = (data?.MediaContainer?.Metadata || []);
        const plexStreamUrl = process.env.PLEX_URL_EXTERNAL || PLEX_URL;
        allTracks = trackMeta.map(t => ({
          ratingKey: t.ratingKey,
          title: t.title || '',
          artist: t.grandparentTitle || t.originalTitle || '',
          album: t.parentTitle || '',
          duration: t.duration || 0,
          trackNumber: t.index || 0,
          thumb: t.parentThumb ? `${plexStreamUrl}${t.parentThumb}?X-Plex-Token=${PLEX_TOKEN}` : null
        }));
        setCache(cacheKey, allTracks);
      }

      // Filter
      let filtered = allTracks;
      if (artist) filtered = filtered.filter(t => t.artist.toLowerCase().includes(artist));
      if (album) filtered = filtered.filter(t => t.album.toLowerCase().includes(album));

      const total = filtered.length;
      const slice = filtered.slice(offset, offset + limit);

      res.set('Cache-Control', 'private, max-age=60');
      res.json({ tracks: slice, total, limit, offset });
    } catch (e) {
      logger.warn({ err: e }, 'Plex tracks ophalen mislukt');
      res.set('Cache-Control', 'private, max-age=60');
      res.status(500).json({ error: e.message, tracks: [], total: 0 });
    }
  });

  // ── /api/plex/genres ──────────────────────────────────────────────────────
  // GET alle genres met artiesten gegroepeerd per genre.
  app.get('/api/plex/genres', async (req, res) => {
    if (!PLEX_TOKEN) {
      res.set('Cache-Control', 'private, max-age=300');
      return res.json({ genres: [] });
    }

    try {
      // Controleer cache (10 minuten)
      const cacheKey = 'api:plex:genres:all';
      const cached = getCache(cacheKey, 600_000);
      if (cached) {
        res.set('Cache-Control', 'private, max-age=600');
        return res.json(cached);
      }

      // Ensure library is synced before fetching
      await syncPlexLibrary(false);

      // Verkrijg muziek section key
      const sections = await plexGet('/library/sections');
      const music = (sections?.MediaContainer?.Directory || []).find(s => s.type === 'artist');
      if (!music) {
        res.set('Cache-Control', 'private, max-age=300');
        return res.json({ genres: [] });
      }

      // Haal alle artiesten op om genres te extraheren
      const data = await plexGet(`/library/sections/${music.key}/all?type=8`);
      const artistMeta = (data?.MediaContainer?.Metadata || []);
      const plexStreamUrl = process.env.PLEX_URL_EXTERNAL || PLEX_URL;

      // Groepeer artiesten per genre
      const genreMap = new Map();
      for (const artist of artistMeta) {
        const genres = (artist.Genre && Array.isArray(artist.Genre)) ? artist.Genre : (artist.Genre ? [artist.Genre] : []);
        const genreList = genres.map(g => (typeof g === 'string' ? g : (g?.tag || '')));

        for (const genre of genreList) {
          if (genre && !genreMap.has(genre)) {
            genreMap.set(genre, []);
          }
          if (genre) {
            genreMap.get(genre).push({
              title: artist.title || '',
              thumb: artist.thumb ? `${plexStreamUrl}${artist.thumb}?X-Plex-Token=${PLEX_TOKEN}` : null,
              ratingKey: artist.ratingKey
            });
          }
        }
      }

      // Converteer naar array en sorteer op genre naam
      const genres = Array.from(genreMap.entries())
        .map(([genre, artists]) => ({
          genre,
          artistCount: artists.length,
          artists: artists.sort((a, b) => a.title.localeCompare(b.title, 'nl', { sensitivity: 'base' }))
        }))
        .sort((a, b) => a.genre.localeCompare(b.genre));

      const result = { genres };
      setCache(cacheKey, result);
      res.set('Cache-Control', 'private, max-age=600');
      res.json(result);
    } catch (e) {
      logger.warn({ err: e }, 'Plex genres ophalen mislukt');
      res.set('Cache-Control', 'private, max-age=300');
      res.status(500).json({ error: e.message, genres: [] });
    }
  });

  // ── /api/plex/stats ─────────────────────────────────────────────────────────
  // GET statistieken over speelgeschiedenis: top artiesten, nummers, genres, etc.
  // Query param: period (7day, 1month, 3month, 12month, overall; default: 7day)
  app.get('/api/plex/stats', async (req, res) => {
    if (!PLEX_TOKEN) {
      res.set('Cache-Control', 'private, max-age=300');
      return res.json({ error: 'Geen PLEX_TOKEN', source: null });
    }

    try {
      const period = req.query.period || '7day';
      const validPeriods = ['today', '7day', '1month', '3month', '12month', 'overall'];

      // Valideer period parameter
      if (!validPeriods.includes(period)) {
        res.set('Cache-Control', 'private, max-age=300');
        return res.status(400).json({
          error: `Ongeldige period. Geldige waarden: ${validPeriods.join(', ')}`,
          source: null
        });
      }

      // Cache check (10 minuten = 600_000 ms)
      const cacheKey = `plex:stats:${period}`;
      const cached = getCache(cacheKey, 600_000);
      if (cached) {
        res.set('Cache-Control', 'private, max-age=300');
        return res.json(cached);
      }

      // Haal speelgeschiedenis op voor de gegeven periode
      const history = await getPlayHistory(period);

      // Bereken statistieken
      let topArtists = aggregateTopArtists(history, 20);
      const topTracks = aggregateTopTracks(history, 20);
      const dailyPlays = aggregateDailyPlays(history);
      const genres = getGenresFromPlex(topArtists); // Nu synchrone functie (geen API calls meer)
      const recentTracks = history.slice(0, 30);

      // Verrijk top artiesten met thumbnail-URLs
      topArtists = await enrichArtistsWithThumbs(topArtists);

      // Bouw response
      const result = {
        topArtists,
        topTracks,
        dailyPlays,
        genres,
        recentTracks,
        totalPlays: history.length,
        source: 'plex'
      };

      // Sla op in cache
      setCache(cacheKey, result);

      res.set('Cache-Control', 'private, max-age=300');
      res.json(result);
    } catch (e) {
      logger.warn({ err: e, period: req.query.period }, 'Plex stats ophalen mislukt');
      res.set('Cache-Control', 'private, max-age=300');
      res.status(500).json({ error: e.message, source: null });
    }
  });

  // ── /api/plex/search ────────────────────────────────────────────────────────
  // Parallel zoeken in artiesten, albums, nummers en afspeellijsten
  // Query params: q (zoekterm, min 2 chars), limit (max resultaten per categorie, default 5)
  app.get('/api/plex/search', async (req, res) => {
    if (!PLEX_TOKEN) {
      res.set('Cache-Control', 'private, max-age=60');
      return res.json({ artists: [], albums: [], tracks: [], playlists: [] });
    }

    try {
      const { q, limit } = req.query;
      const parsedLimit = Math.min(parseInt(limit) || 5, 20); // max 20 per categorie

      if (!q || q.length < 2) {
        res.set('Cache-Control', 'private, max-age=60');
        return res.json({ artists: [], albums: [], tracks: [], playlists: [] });
      }

      // Cache per zoekterm (5 minuten)
      const cacheKey = `api:plex:search:${q.toLowerCase()}:${parsedLimit}`;
      const cached = getCache(cacheKey, 300_000);
      if (cached) {
        res.set('Cache-Control', 'private, max-age=300');
        return res.json(cached);
      }

      const results = await searchPlexLibrary(q, parsedLimit);

      setCache(cacheKey, results);
      res.set('Cache-Control', 'private, max-age=300');
      res.json(results);
    } catch (e) {
      logger.warn({ err: e }, 'Plex search mislukt');
      res.set('Cache-Control', 'private, max-age=60');
      res.status(500).json({
        error: 'Zoeken mislukt',
        artists: [],
        albums: [],
        tracks: [],
        playlists: []
      });
    }
  });

  // ── /api/plex/artists/:ratingKey ──────────────────────────────────────────
  // GET detail van één artiest met albums.
  app.get('/api/plex/artists/:ratingKey', async (req, res) => {
    if (!PLEX_TOKEN) {
      res.set('Cache-Control', 'private, max-age=60');
      return res.json({ artist: null });
    }

    try {
      const { ratingKey } = req.params;

      // Controleer cache per artiest (5 minuten)
      const cacheKey = `api:plex:artist:${ratingKey}`;
      const cached = getCache(cacheKey, 300_000);
      if (cached) {
        res.set('Cache-Control', 'private, max-age=300');
        return res.json(cached);
      }

      const plexStreamUrl = process.env.PLEX_URL_EXTERNAL || PLEX_URL;

      // Haal artiest-metadata op
      const artistData = await plexGet(`/library/metadata/${ratingKey}`);
      const artistMeta = artistData?.MediaContainer?.Metadata?.[0];
      if (!artistMeta) {
        res.set('Cache-Control', 'private, max-age=60');
        return res.status(404).json({ error: 'Artiest niet gevonden' });
      }

      // Haal albums op (children)
      const albumsData = await plexGet(`/library/metadata/${ratingKey}/children`);
      const albumMeta = albumsData?.MediaContainer?.Metadata || [];

      const albums = albumMeta.map(a => ({
        ratingKey: a.ratingKey,
        title: a.title,
        year: a.year || null,
        thumb: a.thumb ? `${plexStreamUrl}${a.thumb}?X-Plex-Token=${PLEX_TOKEN}` : null,
        trackCount: a.leafCount || 0
      }));

      // Haal alle genres voor deze artiest
      const genres = (artistMeta.Genre && Array.isArray(artistMeta.Genre))
        ? artistMeta.Genre.map(g => typeof g === 'string' ? g : g.tag)
        : (artistMeta.Genre ? [typeof artistMeta.Genre === 'string' ? artistMeta.Genre : artistMeta.Genre.tag] : []);

      const totalTracks = albums.reduce((sum, a) => sum + a.trackCount, 0);

      const result = {
        artist: {
          ratingKey: artistMeta.ratingKey,
          title: artistMeta.title,
          thumb: artistMeta.thumb ? `${plexStreamUrl}${artistMeta.thumb}?X-Plex-Token=${PLEX_TOKEN}` : null,
          albums,
          genres,
          totalTracks
        }
      };

      setCache(cacheKey, result);
      res.set('Cache-Control', 'private, max-age=300');
      res.json(result);
    } catch (e) {
      logger.warn({ err: e }, 'Plex artist detail ophalen mislukt');
      res.set('Cache-Control', 'private, max-age=60');
      res.status(500).json({ error: e.message });
    }
  });

  // ── /api/plex/check-batch ─────────────────────────────────────────────────
  // POST batch-check of meerdere artiest+album combinaties in Plex zitten
  // Body: { items: [{ artist, album }, ...] }
  // Response: { results: { "artist||album": true|false, ... } }
  app.post('/api/plex/check-batch', (req, res) => {
    if (!PLEX_TOKEN) {
      res.set('Cache-Control', 'private, max-age=60');
      return res.json({ results: {} });
    }

    try {
      const items = req.body?.items || [];
      if (!Array.isArray(items) || items.length === 0) {
        res.set('Cache-Control', 'private, max-age=60');
        return res.json({ results: {} });
      }

      const results = {};

      // Limiteer tot max 20 items per request
      const limit = Math.min(items.length, 20);
      for (let i = 0; i < limit; i++) {
        const item = items[i];
        const artist = (item.artist || '').trim();
        const album = (item.album || '').trim();
        const key = `${artist}||${album}`;

        // Check: eerst album + artist, dan alleen artist als fallback
        results[key] = albumInPlex(artist, album) || artistInPlex(artist);
      }

      res.set('Cache-Control', 'private, max-age=60');
      res.json({ results });
    } catch (e) {
      logger.warn({ err: e }, 'Plex check-batch mislukt');
      res.set('Cache-Control', 'private, max-age=60');
      res.status(500).json({ error: e.message, results: {} });
    }
  });
};
