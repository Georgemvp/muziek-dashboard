// ── Mirrored Playlists Routes ──────────────────────────────────────────────────
'use strict';

const logger  = require('../logger');
const service = require('../services/mirroredPlaylists');

module.exports = function(app, deps) {

  // ── GET /api/mirrored ─────────────────────────────────────────────────────
  // Geeft alle gespiegelde playlists terug, gesorteerd op aanmaakdatum.
  app.get('/api/mirrored', (req, res) => {
    try {
      const playlists = service.getAllMirroredPlaylists();
      res.set('Cache-Control', 'private, no-cache');
      res.json(playlists);
    } catch (err) {
      logger.error({ err }, 'GET /api/mirrored fout');
      res.status(500).json({ error: 'Interne fout' });
    }
  });

  // ── POST /api/mirrored ────────────────────────────────────────────────────
  // Voeg een nieuwe gespiegelde playlist toe.
  // Body: { url, auto_sync?, sync_interval_hours?, auto_download?, download_quality? }
  app.post('/api/mirrored', async (req, res) => {
    const { url, auto_sync, sync_interval_hours, auto_download, download_quality } = req.body || {};

    if (!url || typeof url !== 'string' || !url.trim()) {
      return res.status(400).json({ error: 'url is verplicht' });
    }

    const platform = service.detectPlatform(url.trim());
    if (!platform) {
      return res.status(400).json({
        error: 'Onbekend platform. Ondersteund: Spotify, Deezer, YouTube, Tidal',
      });
    }

    try {
      const playlist = await service.add(url.trim(), {
        auto_sync:           auto_sync           ?? 1,
        sync_interval_hours: sync_interval_hours ?? 24,
        auto_download:       auto_download       ?? 0,
        download_quality:    download_quality    ?? 'flac',
      }, deps);

      res.status(201).json(playlist);
    } catch (err) {
      logger.warn({ err, url }, 'POST /api/mirrored fout');
      const status = err.message?.includes('bestaat al') ? 409 : 500;
      res.status(status).json({ error: err.message });
    }
  });

  // ── DELETE /api/mirrored/:id ──────────────────────────────────────────────
  app.delete('/api/mirrored/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ error: 'Ongeldig id' });

    const existing = service.getMirroredPlaylist(id);
    if (!existing) return res.status(404).json({ error: 'Playlist niet gevonden' });

    try {
      service.deleteMirroredPlaylist(id);
      res.json({ ok: true });
    } catch (err) {
      logger.error({ err, id }, 'DELETE /api/mirrored/:id fout');
      res.status(500).json({ error: 'Interne fout' });
    }
  });

  // ── POST /api/mirrored/:id/sync ───────────────────────────────────────────
  app.post('/api/mirrored/:id/sync', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ error: 'Ongeldig id' });

    try {
      const result = await service.sync(id, deps);
      res.json(result);
    } catch (err) {
      logger.warn({ err, id }, 'POST /api/mirrored/:id/sync fout');
      const status = err.message?.includes('niet gevonden') ? 404 : 500;
      res.status(status).json({ error: err.message });
    }
  });

  // ── POST /api/mirrored/sync-all ───────────────────────────────────────────
  app.post('/api/mirrored/sync-all', async (req, res) => {
    try {
      const results = await service.syncAll(deps);
      res.json({ synced: results.length, results });
    } catch (err) {
      logger.error({ err }, 'POST /api/mirrored/sync-all fout');
      res.status(500).json({ error: err.message });
    }
  });

  // ── GET /api/mirrored/:id/tracks ──────────────────────────────────────────
  // Query params: ?status=matched|unmatched|downloading|downloaded|pending
  app.get('/api/mirrored/:id/tracks', (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ error: 'Ongeldig id' });

    const existing = service.getMirroredPlaylist(id);
    if (!existing) return res.status(404).json({ error: 'Playlist niet gevonden' });

    try {
      let tracks = service.getMirroredTracks(id);
      const { status } = req.query;
      if (status) tracks = tracks.filter(t => t.match_status === status);

      res.set('Cache-Control', 'private, no-cache');
      res.json({ playlist: existing, tracks });
    } catch (err) {
      logger.error({ err, id }, 'GET /api/mirrored/:id/tracks fout');
      res.status(500).json({ error: 'Interne fout' });
    }
  });

  // ── POST /api/mirrored/:id/download-missing ───────────────────────────────
  app.post('/api/mirrored/:id/download-missing', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ error: 'Ongeldig id' });

    try {
      const result = await service.downloadMissing(id, deps);
      res.json(result);
    } catch (err) {
      logger.warn({ err, id }, 'POST /api/mirrored/:id/download-missing fout');
      const status = err.message?.includes('niet gevonden') ? 404 : 500;
      res.status(status).json({ error: err.message });
    }
  });

  // ── POST /api/mirrored/:id/tracks/:trackId/unmatch ────────────────────────
  // Body: { unmatched: true|false }
  app.post('/api/mirrored/:id/tracks/:trackId/unmatch', (req, res) => {
    const id      = parseInt(req.params.id, 10);
    const trackId = parseInt(req.params.trackId, 10);
    if (!id || !trackId) return res.status(400).json({ error: 'Ongeldig id' });

    const unmatch = req.body?.unmatched !== false; // standaard true

    try {
      service.setMirroredTrackUnmatched(trackId, unmatch);
      // Herbereken playlist-tellers
      const counts = service.getMirroredPlaylistCounts(id);
      service.updateMirroredPlaylist(id, counts);
      res.json({ ok: true, unmatched: unmatch });
    } catch (err) {
      logger.error({ err, id, trackId }, 'POST unmatch fout');
      res.status(500).json({ error: err.message });
    }
  });

  // ── POST /api/mirrored/:id/match ──────────────────────────────────────────
  // Hermatchen van alle pending/unmatched tracks (handig na Plex-sync)
  app.post('/api/mirrored/:id/match', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ error: 'Ongeldig id' });

    try {
      const result = await service.matchTracks(id, deps);
      res.json(result);
    } catch (err) {
      logger.warn({ err, id }, 'POST /api/mirrored/:id/match fout');
      res.status(500).json({ error: err.message });
    }
  });

  // ── PATCH /api/mirrored/:id ───────────────────────────────────────────────
  // Update instellingen van een playlist
  app.patch('/api/mirrored/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ error: 'Ongeldig id' });

    const allowed = ['auto_sync', 'sync_interval_hours', 'auto_download', 'download_quality'];
    const fields  = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) fields[key] = req.body[key];
    }

    try {
      const updated = service.updateMirroredPlaylist(id, fields);
      if (!updated) return res.status(404).json({ error: 'Playlist niet gevonden' });
      res.json(updated);
    } catch (err) {
      logger.error({ err, id }, 'PATCH /api/mirrored/:id fout');
      res.status(500).json({ error: err.message });
    }
  });
};
