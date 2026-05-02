// ── Watchlist Routes ──────────────────────────────────────────────────────────
// REST endpoints voor het beheren van de artiest-watchlist.
'use strict';

const logger = require('../logger');
const { sendError } = require('./helpers');
const watchlist = require('../services/watchlist');
const { searchPlexLibrary } = require('../services/plex');
const { lfm } = require('../services/lastfm');

module.exports = function(app, deps) {

  // ── GET /api/watchlist ──────────────────────────────────────────────────────
  // Haal alle watchlist-entries op met statistieken.
  app.get('/api/watchlist', (req, res) => {
    try {
      const items = watchlist.getAll();
      res.set('Cache-Control', 'private, no-cache');
      res.json({ items });
    } catch (e) {
      logger.error({ err: e }, 'GET /api/watchlist mislukt');
      sendError(res, 500, e.message);
    }
  });

  // ── POST /api/watchlist ─────────────────────────────────────────────────────
  // Voeg een artiest toe aan de watchlist.
  // Body: { artist: string, config?: object }
  app.post('/api/watchlist', async (req, res) => {
    const { artist, config = {} } = req.body || {};
    if (!artist || typeof artist !== 'string') {
      return sendError(res, 400, 'artist is verplicht');
    }
    try {
      const entry = await watchlist.add(artist.trim(), config);
      res.set('Cache-Control', 'private, no-cache');
      res.status(201).json({ ok: true, entry });
    } catch (e) {
      logger.warn({ artist, err: e.message }, 'POST /api/watchlist mislukt');
      sendError(res, e.message.includes('al in de watchlist') ? 409 : 500, e.message);
    }
  });

  // ── PUT /api/watchlist/:id ──────────────────────────────────────────────────
  // Update de configuratie van een watchlist-entry.
  app.put('/api/watchlist/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (!id) return sendError(res, 400, 'Ongeldig id');
    try {
      const entry = watchlist.update(id, req.body || {});
      res.set('Cache-Control', 'private, no-cache');
      res.json({ ok: true, entry });
    } catch (e) {
      logger.warn({ id, err: e.message }, 'PUT /api/watchlist/:id mislukt');
      sendError(res, 500, e.message);
    }
  });

  // ── DELETE /api/watchlist/:id ───────────────────────────────────────────────
  app.delete('/api/watchlist/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (!id) return sendError(res, 400, 'Ongeldig id');
    try {
      watchlist.remove(id);
      res.set('Cache-Control', 'private, no-cache');
      res.json({ ok: true });
    } catch (e) {
      logger.warn({ id, err: e.message }, 'DELETE /api/watchlist/:id mislukt');
      sendError(res, 500, e.message);
    }
  });

  // ── POST /api/watchlist/:id/scan ────────────────────────────────────────────
  // Scan één artiest direct op nieuwe releases.
  app.post('/api/watchlist/:id/scan', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (!id) return sendError(res, 400, 'Ongeldig id');
    try {
      const result = await watchlist.scan(id);
      res.set('Cache-Control', 'private, no-cache');
      res.json({ ok: true, ...result });
    } catch (e) {
      logger.warn({ id, err: e.message }, 'POST /api/watchlist/:id/scan mislukt');
      sendError(res, 500, e.message);
    }
  });

  // ── POST /api/watchlist/scan-all ────────────────────────────────────────────
  // Scan alle artiesten waarvan de interval verlopen is.
  app.post('/api/watchlist/scan-all', async (req, res) => {
    // Stuur direct terug — scan loopt op achtergrond
    res.set('Cache-Control', 'private, no-cache');
    res.json({ ok: true, message: 'Scan gestart op achtergrond' });

    watchlist.scanAll().catch(e => {
      logger.error({ err: e }, 'scanAll achtergrond fout');
    });
  });

  // ── GET /api/watchlist/:id/releases ────────────────────────────────────────
  // Haal alle releases op voor één watchlist-entry.
  app.get('/api/watchlist/:id/releases', (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (!id) return sendError(res, 400, 'Ongeldig id');
    try {
      const releases = watchlist.getReleases(id);
      res.set('Cache-Control', 'private, max-age=60');
      res.json({ releases });
    } catch (e) {
      logger.warn({ id, err: e.message }, 'GET /api/watchlist/:id/releases mislukt');
      sendError(res, 500, e.message);
    }
  });

  // ── PUT /api/watchlist/releases/:releaseId ──────────────────────────────────
  // Update status van een individuele release.
  // Body: { status: 'new'|'downloaded'|'skipped'|'in_library' }
  app.put('/api/watchlist/releases/:releaseId', (req, res) => {
    const releaseId = parseInt(req.params.releaseId, 10);
    const { status } = req.body || {};
    const validStatuses = ['new', 'downloaded', 'skipped', 'in_library'];
    if (!releaseId) return sendError(res, 400, 'Ongeldig releaseId');
    if (!validStatuses.includes(status)) return sendError(res, 400, `Status moet een van ${validStatuses.join(', ')} zijn`);
    try {
      watchlist.updateReleaseStatus(releaseId, status);
      res.json({ ok: true });
    } catch (e) {
      sendError(res, 500, e.message);
    }
  });

  // ── POST /api/watchlist/auto-discover/:artistName ───────────────────────────
  // Voeg similar artists van een artiest toe aan de watchlist.
  app.post('/api/watchlist/auto-discover/:artistName', async (req, res) => {
    const artistName = decodeURIComponent(req.params.artistName || '').trim();
    if (!artistName) return sendError(res, 400, 'Artiestnaam is verplicht');
    const config = req.body?.config || {};
    try {
      const result = await watchlist.autoDiscover(artistName, config);
      res.set('Cache-Control', 'private, no-cache');
      res.json({ ok: true, ...result });
    } catch (e) {
      logger.warn({ artist: artistName, err: e.message }, 'Auto-discover mislukt');
      sendError(res, 500, e.message);
    }
  });

  // ── GET /api/watchlist/search ───────────────────────────────────────────────
  // Autocomplete zoekbalk: combineert Plex + Last.fm artiesten.
  app.get('/api/watchlist/search', async (req, res) => {
    const q = (req.query.q || '').trim();
    if (q.length < 2) return res.json({ results: [] });

    const results = new Map();

    // Zoek in Plex library
    try {
      const plexResults = searchPlexLibrary(q, { type: 'artist', limit: 10 });
      for (const r of (plexResults.artists || [])) {
        results.set(r.name.toLowerCase(), { name: r.name, source: 'plex', thumb: r.thumb });
      }
    } catch {}

    // Zoek via Last.fm als aanvulling
    if (results.size < 10) {
      try {
        const lfmData = await lfm({ method: 'artist.search', artist: q, limit: 10 }, { includeUser: false });
        const lfmArtists = lfmData?.results?.artistmatches?.artist || [];
        for (const a of lfmArtists) {
          const key = a.name.toLowerCase();
          if (!results.has(key)) {
            results.set(key, { name: a.name, source: 'lastfm', thumb: null });
          }
        }
      } catch {}
    }

    res.set('Cache-Control', 'private, max-age=60');
    res.json({ results: [...results.values()].slice(0, 15) });
  });
};
