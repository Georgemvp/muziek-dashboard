// ── Tidarr API Routes ─────────────────────────────────────────────────────────

const logger = require('../logger');

module.exports = function(app, deps) {
  const {
    searchTidal, findBestAlbum, findTopAlbums, addToQueue, getQueue, getHistory,
    removeFromQueue, getTidarrStatus, triggerPlexScan, addDownload, getDownloads,
    getDownloadKeys, removeDownload, getCache, setCache
  } = deps;

  // ── /api/tidarr/status ────────────────────────────────────────────────────
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

  // ── /api/tidarr/search ───────────────────────────────────────────────────
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

  // ── /api/tidarr/find ─────────────────────────────────────────────────────
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

  // ── /api/tidarr/candidates ───────────────────────────────────────────────
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

  // ── /api/tidarr/download ─────────────────────────────────────────────────
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

  // ── /api/tidarr/queue ────────────────────────────────────────────────────
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

  // ── /api/tidarr/queue/:id ────────────────────────────────────────────────
  app.delete('/api/tidarr/queue/:id', async (req, res) => {
    try {
      const result = await removeFromQueue(req.params.id);
      res.json({ ok: true, result });
    } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
  });

  // ── /api/tidarr/history ──────────────────────────────────────────────────
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

  // ── /api/tidarr/stream ───────────────────────────────────────────────────
  // Tidarr SSE-proxy: stuurt real-time queue updates door naar de browser
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

  // ── /api/downloads ───────────────────────────────────────────────────────
  // Download-geschiedenis (persistente SQLite-opslag)

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
};
