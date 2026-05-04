// ── Tidarr routes — stub die naar Python Core doorverwijst ─────────────────────
//
// /api/tidarr/* → /api/core/download/* (via Python Core orchestrator)
// /api/tidarr/stream → SSE proxy naar Tidarr direct (blijft hier)
// /api/downloads, /api/download → ongewijzigd (SQLite-backed Node endpoints)

const logger = require('../logger');
const { sendError } = require('./helpers');
const { Readable } = require('stream');

const CORE_BASE   = (process.env.CORE_URL   || 'http://localhost:5001').replace(/\/$/, '');
const TIDARR_BASE = (process.env.TIDARR_URL || 'http://localhost:8484').replace(/\/$/, '');

async function forwardToCore(req, res, corePath) {
  const qs  = new URLSearchParams(req.query).toString();
  const url = `${CORE_BASE}${corePath}${qs ? `?${qs}` : ''}`;

  const fetchOpts = {
    method: req.method,
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(30_000),
  };
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
    fetchOpts.body = JSON.stringify(req.body);
  }
  try {
    const upstream = await fetch(url, fetchOpts);
    res.status(upstream.status);
    const ct = upstream.headers.get('content-type');
    if (ct) res.setHeader('Content-Type', ct);
    const cc = upstream.headers.get('cache-control');
    if (cc) res.setHeader('Cache-Control', cc);
    Readable.from(upstream.body).pipe(res);
  } catch (e) {
    logger.warn({ err: e.message, url }, 'Tidarr Core forward mislukt');
    if (!res.headersSent) res.status(502).json({ error: 'Core backend niet bereikbaar', reason: e.message });
  }
}

module.exports = function(app, deps) {
  const {
    addDownload, getDownloads, getDownloadKeys, removeDownload
  } = deps;

  // ── /api/tidarr/status → Core download status ────────────────────────────
  app.get('/api/tidarr/status', (req, res) => forwardToCore(req, res, '/api/core/download/status'));

  // ── /api/tidarr/search → Core download search ────────────────────────────
  app.get('/api/tidarr/search', (req, res) => forwardToCore(req, res, '/api/core/download/search'));

  // ── /api/tidarr/find & /api/tidarr/candidates ────────────────────────────
  // Directe Tidarr endpoints: behoud via Core search (beste match).
  app.get('/api/tidarr/find', async (req, res) => {
    const artist = (req.query.artist || '').trim();
    const album  = (req.query.album  || '').trim();
    if (!album) {
      res.set('Cache-Control', 'private, max-age=300');
      return res.status(400).json({ error: 'album is verplicht' });
    }
    // Forward naar Core search en pak het beste resultaat
    try {
      const qs  = new URLSearchParams({ q: `${artist} ${album}`, type: 'album' }).toString();
      const url = `${CORE_BASE}/api/core/download/search?${qs}`;
      const r   = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(15_000) });
      const data = await r.json();
      const results = data.results || [];
      if (!results.length) {
        res.set('Cache-Control', 'private, max-age=300');
        return res.status(404).json({ error: 'Niet gevonden', artist, album });
      }
      res.set('Cache-Control', 'private, max-age=300');
      res.json(results[0]);
    } catch (e) {
      res.set('Cache-Control', 'private, max-age=300');
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/tidarr/candidates', async (req, res) => {
    const artist = (req.query.artist || '').trim();
    const album  = (req.query.album  || '').trim();
    if (!album) {
      res.set('Cache-Control', 'private, max-age=300');
      return res.status(400).json({ error: 'album is verplicht' });
    }
    try {
      const qs  = new URLSearchParams({ q: `${artist} ${album}`, type: 'album' }).toString();
      const url = `${CORE_BASE}/api/core/download/search?${qs}`;
      const r   = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(15_000) });
      const data = await r.json();
      const candidates = (data.results || []).slice(0, 3);
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

  // ── /api/tidarr/download → Core download start ───────────────────────────
  app.post('/api/tidarr/download', async (req, res) => {
    const { url, type, title, artist, id, quality } = req.body || {};
    if (!url) return res.status(400).json({ error: 'url is verplicht' });

    // Vertaal tidarr-download naar Core download request
    try {
      const r = await fetch(`${CORE_BASE}/api/core/download`, {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ artist: artist || '', album: title || '', type: type || 'album', quality: quality || 'flac', source: 'tidarr' }),
        signal: AbortSignal.timeout(30_000),
      });
      const data = await r.json();
      // Sla ook op in legacy downloads tabel
      try { addDownload({ tidal_id: id || null, artist: artist || '', title: title || '', url, quality: quality || 'high' }); } catch {}
      res.json({ ok: true, result: data });
    } catch (e) { sendError(res, 500, e.message); }
  });

  // ── /api/tidarr/queue ─────────────────────────────────────────────────────
  app.get('/api/tidarr/queue', (req, res) => forwardToCore(req, res, '/api/core/download/queue'));

  app.delete('/api/tidarr/queue/:id', async (req, res) => {
    try {
      const r = await fetch(`${TIDARR_BASE}/api/queue/${req.params.id}`, {
        method: 'DELETE',
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(10_000),
      });
      res.json({ ok: r.ok });
    } catch (e) { sendError(res, 500, e.message); }
  });

  // ── /api/tidarr/history ───────────────────────────────────────────────────
  app.get('/api/tidarr/history', (req, res) => forwardToCore(req, res, '/api/core/download/history'));

  // ── /api/tidarr/stream — SSE proxy blijft direct naar Tidarr ─────────────
  app.get('/api/tidarr/stream', async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const apiKey  = process.env.TIDARR_API_KEY || '';
    const sseUrl  = `${TIDARR_BASE}/api/stream-processing${apiKey ? `?apikey=${encodeURIComponent(apiKey)}` : ''}`;
    const ac      = new AbortController();
    req.on('close', () => ac.abort());

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

  // ── /api/downloads — persistente download-geschiedenis (SQLite, ongewijzigd) ─
  app.get('/api/downloads', (req, res) => {
    try {
      const result = getDownloads();
      res.set('Cache-Control', 'private, max-age=300');
      res.json(result);
    } catch (e) {
      res.set('Cache-Control', 'private, max-age=300');
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/downloads/keys', (req, res) => {
    try {
      const result = [...getDownloadKeys()];
      res.set('Cache-Control', 'private, max-age=300');
      res.json(result);
    } catch (e) {
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
