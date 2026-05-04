// ── Plex routes — stub die naar Python Core doorverwijst ──────────────────────
//
// Webhook + SSE blijven hier (in-process state voor real-time scrobbling).
// Alle andere endpoints worden server-side doorgezet naar /api/core/plex/*.

const logger  = require('../logger');
const { Readable } = require('stream');

const CORE_BASE = (process.env.CORE_URL || 'http://localhost:5001').replace(/\/$/, '');

/** Zet een verzoek door naar de Python Core backend en pipe de response terug. */
async function forwardToCore(req, res, corePath) {
  const qs  = new URLSearchParams(req.query).toString();
  const url = `${CORE_BASE}${corePath}${qs ? `?${qs}` : ''}`;
  const method = req.method;

  const fetchOpts = {
    method,
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(30_000),
  };
  if (['POST', 'PUT', 'PATCH'].includes(method) && req.body) {
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
    logger.warn({ err: e.message, url }, 'Plex Core forward mislukt');
    if (!res.headersSent) res.status(502).json({ error: 'Core backend niet bereikbaar', reason: e.message });
  }
}

module.exports = function(app, deps) {
  const { scrobbler } = deps;

  // ── Webhook state + SSE ─────────────────────────────────────────────────────
  // Blijft hier zodat media.scrobble en now-playing real-time werken zonder
  // dat de Core-backend een SSE-server hoeft te zijn.

  let _webhookState = null;
  let _webhookTime  = 0;
  const _sseClients = new Set();

  function _sseEmit(eventName, data) {
    const msg = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const client of _sseClients) {
      try { client.write(msg); }
      catch { _sseClients.delete(client); }
    }
  }

  function parsePlexWebhook(rawBody, contentType) {
    const bMatch = (contentType || '').match(/boundary=([^\s;]+)/);
    if (!bMatch) return null;
    const bodyStr = rawBody.toString('utf8');
    const re = /Content-Disposition:\s*form-data;\s*name="payload"[\r\n]+[\r\n]+([\s\S]+?)(?:\r?\n--)/;
    const m  = bodyStr.match(re);
    if (!m) return null;
    try { return JSON.parse(m[1].trim()); } catch { return null; }
  }

  // ── /api/plex/webhook/:secret ─────────────────────────────────────────────
  const express = require('express');
  const PLEX_WEBHOOK_SECRET = process.env.PLEX_WEBHOOK_SECRET || '';
  app.post('/api/plex/webhook/:secret',
    express.raw({ type: ['multipart/form-data', 'application/x-www-form-urlencoded', '*/*'], limit: '10mb' }),
    (req, res) => {
      if (!PLEX_WEBHOOK_SECRET || req.params.secret !== PLEX_WEBHOOK_SECRET) {
        logger.warn({ ip: req.ip }, 'Plex webhook: ongeldig of ontbrekend secret');
        return res.sendStatus(403);
      }
      const contentType = req.headers['content-type'] || '';
      const payload = parsePlexWebhook(req.body, contentType);
      if (!payload) {
        logger.warn({ contentType }, 'Plex webhook: kon payload niet parsen');
        return res.sendStatus(400);
      }
      const event = payload.event || '';
      const meta  = payload.Metadata;
      if (!meta || meta.type !== 'track') return res.sendStatus(200);

      if (['media.play','media.resume','media.pause','media.stop','media.scrobble'].includes(event)) {
        const _tp = meta.parentThumb || meta.grandparentThumb || null;
        const thumb = _tp ? `/api/plex/thumb?path=${encodeURIComponent(_tp)}` : null;
        _webhookState = {
          event, playing: event === 'media.play' || event === 'media.resume',
          paused: event === 'media.pause', stopped: event === 'media.stop',
          track: meta.title || '', artist: meta.grandparentTitle || meta.originalTitle || '',
          album: meta.parentTitle || '', ratingKey: meta.ratingKey || null,
          albumRatingKey: meta.parentRatingKey || null, thumb,
          duration: meta.duration || null, viewOffset: meta.viewOffset || null,
          state: event === 'media.pause' ? 'paused' : event === 'media.stop' ? 'stopped' : 'playing',
          playerName: payload.Player?.title || null, playerProduct: payload.Player?.product || null,
          machineId: payload.Player?.machineIdentifier || null,
          updatedAt: Date.now(), source: 'webhook',
        };
        _webhookTime = Date.now();
        logger.info({ event, track: meta.title, artist: meta.grandparentTitle }, 'Plex webhook ontvangen');
        _sseEmit('plex', _webhookState);

        if (scrobbler) {
          const trackArtist = meta.grandparentTitle || meta.originalTitle || '';
          const trackName   = meta.title || '';
          const trackAlbum  = meta.parentTitle || null;
          const duration_ms = meta.duration || null;
          if (event === 'media.scrobble') {
            scrobbler.scrobble({ artist: trackArtist, track: trackName, album: trackAlbum,
              timestamp: Math.floor(Date.now() / 1000), duration_ms, source: 'plex' })
              .catch(err => logger.error({ err }, 'Scrobble fout na media.scrobble'));
          } else if (event === 'media.play' || event === 'media.resume') {
            scrobbler.updateNowPlaying({ artist: trackArtist, track: trackName,
              album: trackAlbum, duration_ms }).catch(() => {});
          }
        }
      }
      res.sendStatus(200);
    }
  );

  // ── /api/plex/stream ──────────────────────────────────────────────────────
  app.get('/api/plex/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    _sseClients.add(res);
    if (_webhookState) res.write(`event: plex\ndata: ${JSON.stringify(_webhookState)}\n\n`);
    const hb = setInterval(() => {
      try { res.write(':heartbeat\n\n'); }
      catch { clearInterval(hb); _sseClients.delete(res); }
    }, 30_000);
    req.on('close', () => { clearInterval(hb); _sseClients.delete(res); });
  });

  // ── /api/plex/nowplaying — hybride: webhook-state of Core poll ────────────
  app.get('/api/plex/nowplaying', async (req, res) => {
    if (_webhookState && Date.now() - _webhookTime < 120_000) {
      const s = _webhookState;
      res.set('Cache-Control', 'no-store');
      if (s.stopped) return res.json({ playing: false, source: 'webhook' });
      return res.json({ ...s, webhookActive: true });
    }
    return forwardToCore(req, res, '/api/core/plex/nowplaying');
  });

  // ── Alle andere /api/plex/* → /api/core/plex/* ───────────────────────────
  const PLEX_PREFIX = '/api/plex';
  const CORE_PREFIX = '/api/core/plex';

  const FORWARDED = [
    'GET  /api/plex/thumb',
    'GET  /api/plex/status',
    'POST /api/plex/refresh',
    'GET  /api/plex/library',
    'GET  /api/plex/library/all',
    'GET  /api/plex/playlists',
    'GET  /api/plex/playlists/:key/tracks',
    'GET  /api/plex/album/:key/tracks',
    'GET  /api/plex/clients',
    'GET  /api/plex/clients/debug',
    'GET  /api/plex/remotequeue',
    'POST /api/plex/play',
    'POST /api/plex/pause',
    'POST /api/plex/stop',
    'POST /api/plex/skip',
    'POST /api/plex/skip/next',
    'POST /api/plex/skip/prev',
    'POST /api/plex/rate',
    'POST /api/plex/refresh-library',
    'GET  /api/plex/artists',
    'GET  /api/plex/artists/:ratingKey',
    'GET  /api/plex/tracks',
    'GET  /api/plex/genres',
    'GET  /api/plex/stats',
    'GET  /api/plex/search',
    'POST /api/plex/check-batch',
    'GET  /api/plex/stream/audio/:ratingKey',
  ];

  for (const entry of FORWARDED) {
    const [method, path] = entry.trim().split(/\s+/);
    const m = method.toLowerCase();
    app[m](path, (req, res) => {
      // Vertaal /api/plex/... naar /api/core/plex/...
      const corePath = CORE_PREFIX + req.path.slice(PLEX_PREFIX.length);
      return forwardToCore(req, res, corePath);
    });
  }
};
