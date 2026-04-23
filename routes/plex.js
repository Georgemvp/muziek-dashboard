// ── Plex API Routes ───────────────────────────────────────────────────────────

const logger = require('../logger');
const { Readable } = require('stream');

module.exports = function(app, deps) {
  const {
    plexGet, plexPost, plexPut, syncPlexLibrary, artistInPlex, albumInPlex,
    getPlexStatus, getPlexLibrary, getAlbumRatingKey, getPlexClients, playOnClient,
    pauseClient, stopClient, skipNext, skipPrev, getPlexPlaylists, getPlaylistTracks,
    getAlbumTracks, triggerPlexScan, rateItem, PLEX_TOKEN, PLEX_URL, getCache, setCache
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
      const { ok, artistCount, albumCount, lastSync } = getPlexStatus();
      res.set('Cache-Control', 'private, max-age=300');
      res.json({ connected: ok, artists: artistCount, albums: albumCount, lastSync: new Date(lastSync).toISOString() });
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
      const { ok, artistCount, albumCount, lastSync } = getPlexStatus();
      res.json({ connected: ok, artists: artistCount, albums: albumCount, lastSync: new Date(lastSync).toISOString() });
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
    let lib = getPlexLibrary();
    if (q) lib = lib.filter(x =>
      x.artist.toLowerCase().includes(q) || x.album.toLowerCase().includes(q)
    );
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
  app.get('/api/plex/library/all', (req, res) => {
    if (!PLEX_TOKEN) {
      return res.json({ ok: false, library: [] });
    }
    const lib = getPlexLibrary();
    const plexStreamUrl = process.env.PLEX_URL_EXTERNAL || PLEX_URL;
    // Compact array-formaat: [artist, album, ratingKey, thumb] per item
    // Dit is ~60% kleiner dan het object-formaat van /api/plex/library
    const compact = lib.map(x => ([
      x.artist,
      x.album,
      x.ratingKey || '',
      x.thumb ? `${plexStreamUrl}${x.thumb}?X-Plex-Token=${PLEX_TOKEN}` : ''
    ]));
    res.set('Cache-Control', 'private, max-age=300');
    res.json({ ok: true, total: compact.length, library: compact });
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
};
