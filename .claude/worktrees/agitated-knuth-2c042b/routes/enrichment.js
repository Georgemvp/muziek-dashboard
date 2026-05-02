'use strict';
// ── Enrichment API Routes ─────────────────────────────────────────────────────

const logger = require('../logger');
const enrichmentManager = require('../services/enrichment/manager');

const {
  getEnrichmentData,
  getEnrichmentDataBySource,
  getGenreWhitelist,
  setGenreEnabled,
  setGenreWhitelist,
  getSetting,
  setSetting,
} = require('../db');

module.exports = function(app, deps) {

  // ── Status ─────────────────────────────────────────────────────────────────

  /**
   * GET /api/enrichment/status
   * Geeft de status terug van alle workers.
   */
  app.get('/api/enrichment/status', (req, res) => {
    try {
      res.set('Cache-Control', 'private, no-cache');
      res.json(enrichmentManager.getStatus());
    } catch (err) {
      logger.error({ err: err.message }, 'Error getting enrichment status');
      res.status(500).json({ error: err.message });
    }
  });

  // ── Worker controls ────────────────────────────────────────────────────────

  /**
   * POST /api/enrichment/pause/:source
   * Pauzeer een specifieke worker.
   */
  app.post('/api/enrichment/pause/:source', (req, res) => {
    const { source } = req.params;
    try {
      if (source === 'all') {
        enrichmentManager.pauseAll();
      } else {
        enrichmentManager.pause(source);
      }
      res.json({ ok: true, action: 'paused', source });
    } catch (err) {
      logger.error({ err: err.message, source }, 'Error pausing enrichment worker');
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * POST /api/enrichment/resume/:source
   * Hervat een specifieke worker.
   */
  app.post('/api/enrichment/resume/:source', (req, res) => {
    const { source } = req.params;
    try {
      if (source === 'all') {
        enrichmentManager.resumeAll();
      } else {
        enrichmentManager.resume(source);
      }
      res.json({ ok: true, action: 'resumed', source });
    } catch (err) {
      logger.error({ err: err.message, source }, 'Error resuming enrichment worker');
      res.status(500).json({ error: err.message });
    }
  });

  // ── Queue management ───────────────────────────────────────────────────────

  /**
   * POST /api/enrichment/queue/artist/:name
   * Voeg één artiest toe aan de queue.
   */
  app.post('/api/enrichment/queue/artist/:name', (req, res) => {
    const { name } = req.params;
    try {
      const added = enrichmentManager.queueArtist(decodeURIComponent(name));
      res.json({ ok: true, artist: name, queued: added });
    } catch (err) {
      logger.error({ err: err.message, name }, 'Error queueing artist');
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * POST /api/enrichment/queue/all
   * Queue alle artiesten uit de Plex-bibliotheek.
   */
  app.post('/api/enrichment/queue/all', async (req, res) => {
    try {
      const result = await enrichmentManager.queueAll();
      res.json({ ok: true, ...result });
    } catch (err) {
      logger.error({ err: err.message }, 'Error queueing all artists');
      res.status(500).json({ error: err.message });
    }
  });

  // ── Data ophalen ───────────────────────────────────────────────────────────

  /**
   * GET /api/enrichment/data/:entityType/:entityName
   * Haal enrichment data op voor een entiteit (alle bronnen).
   */
  app.get('/api/enrichment/data/:entityType/:entityName', (req, res) => {
    const { entityType, entityName } = req.params;
    try {
      res.set('Cache-Control', 'private, max-age=300');
      const data = getEnrichmentData(entityType, decodeURIComponent(entityName));
      res.json({ entityType, entityName, sources: data });
    } catch (err) {
      logger.error({ err: err.message, entityType, entityName }, 'Error getting enrichment data');
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * GET /api/enrichment/data/:entityType/:entityName/primary
   * Haal enrichment data op van de geconfigureerde primaire bron.
   * Als die bron geen data heeft, val terug op de eerste beschikbare bron.
   */
  app.get('/api/enrichment/data/:entityType/:entityName/primary', (req, res) => {
    const { entityType, entityName } = req.params;
    try {
      res.set('Cache-Control', 'private, max-age=300');
      const primarySource = getSetting('enrichment', 'primary_source') || 'spotify';
      // Probeer primaire bron
      let data = getEnrichmentDataBySource(entityType, decodeURIComponent(entityName), primarySource);
      let usedSource = primarySource;

      // Fallback: eerste beschikbare bron
      if (!data) {
        const all = getEnrichmentData(entityType, decodeURIComponent(entityName));
        // getEnrichmentData geeft een { source: data } object terug
        const sources = Object.keys(all || {});
        if (sources.length > 0) {
          usedSource = sources[0];
          data = all[usedSource];
        }
      }

      if (!data) return res.status(404).json({ error: 'Geen enrichment data beschikbaar' });
      res.json({ entityType, entityName, source: usedSource, primarySource, data });
    } catch (err) {
      logger.error({ err: err.message }, 'Error getting primary enrichment data');
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * GET /api/enrichment/data/:entityType/:entityName/:source
   * Haal enrichment data op van één specifieke bron.
   */
  app.get('/api/enrichment/data/:entityType/:entityName/:source', (req, res) => {
    const { entityType, entityName, source } = req.params;
    try {
      res.set('Cache-Control', 'private, max-age=300');
      const data = getEnrichmentDataBySource(entityType, decodeURIComponent(entityName), source);
      if (!data) return res.status(404).json({ error: 'No enrichment data found' });
      res.json({ entityType, entityName, source, data });
    } catch (err) {
      logger.error({ err: err.message }, 'Error getting enrichment data by source');
      res.status(500).json({ error: err.message });
    }
  });

  // ── Genre Whitelist ────────────────────────────────────────────────────────

  /**
   * GET /api/enrichment/genres
   * Haal de genre whitelist op.
   */
  app.get('/api/enrichment/genres', (req, res) => {
    try {
      res.set('Cache-Control', 'private, max-age=60');
      const genres  = getGenreWhitelist();
      const enabled = getSetting('enrichment', 'genre_filter_enabled');
      res.json({
        genres,
        filterEnabled: enabled === true || enabled === 'true',
      });
    } catch (err) {
      logger.error({ err: err.message }, 'Error getting genre whitelist');
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * PUT /api/enrichment/genres
   * Bulk-update de genre whitelist en/of de filter-instelling.
   * Body: { genres: [{ genre, enabled }], filterEnabled?: boolean }
   */
  app.put('/api/enrichment/genres', (req, res) => {
    const { genres, filterEnabled } = req.body || {};
    try {
      if (Array.isArray(genres)) {
        setGenreWhitelist(genres);
        enrichmentManager.refreshGenreCache();
      }
      if (typeof filterEnabled === 'boolean') {
        setSetting('enrichment', 'genre_filter_enabled', filterEnabled);
        enrichmentManager.setGenreFilterEnabled(filterEnabled);
      }
      res.json({ ok: true });
    } catch (err) {
      logger.error({ err: err.message }, 'Error updating genre whitelist');
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * PATCH /api/enrichment/genres/:genre
   * Zet één genre aan of uit.
   * Body: { enabled: boolean }
   */
  app.patch('/api/enrichment/genres/:genre', (req, res) => {
    const { genre } = req.params;
    const { enabled } = req.body || {};
    try {
      setGenreEnabled(decodeURIComponent(genre), enabled !== false);
      enrichmentManager.refreshGenreCache();
      res.json({ ok: true, genre, enabled });
    } catch (err) {
      logger.error({ err: err.message, genre }, 'Error updating genre');
      res.status(500).json({ error: err.message });
    }
  });

  // ── Settings ───────────────────────────────────────────────────────────────

  /**
   * GET /api/enrichment/settings
   * Haal enrichment-instellingen op (API keys, worker toggles).
   */
  app.get('/api/enrichment/settings', (req, res) => {
    try {
      res.set('Cache-Control', 'private, no-cache');
      const settings = {
        genius_api_key:        getSetting('enrichment', 'genius_api_key') ? '***' : null,
        discogs_token:         getSetting('enrichment', 'discogs_token')  ? '***' : null,
        discogs_user_agent:    getSetting('enrichment', 'discogs_user_agent') || null,
        genre_filter_enabled:  getSetting('enrichment', 'genre_filter_enabled') || false,
        worker_itunes_enabled: getSetting('enrichment', 'worker_itunes_enabled') !== false,
        worker_discogs_enabled: getSetting('enrichment', 'worker_discogs_enabled') !== false,
        worker_audiodb_enabled: getSetting('enrichment', 'worker_audiodb_enabled') !== false,
        worker_genius_enabled:  getSetting('enrichment', 'worker_genius_enabled') !== false,
        worker_tidal_enabled:        getSetting('enrichment', 'worker_tidal_enabled') !== false,
        worker_qobuz_enabled:        getSetting('enrichment', 'worker_qobuz_enabled') !== false,
        worker_spotify_enabled:      getSetting('enrichment', 'worker_spotify_enabled') !== false,
        worker_musicbrainz_enabled:  getSetting('enrichment', 'worker_musicbrainz_enabled') !== false,
        worker_lastfm_enabled:       getSetting('enrichment', 'worker_lastfm_enabled') !== false,
        worker_deezer_enabled:       getSetting('enrichment', 'worker_deezer_enabled') !== false,
        primary_source:              getSetting('enrichment', 'primary_source') || 'spotify',
      };
      res.json(settings);
    } catch (err) {
      logger.error({ err: err.message }, 'Error getting enrichment settings');
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * PUT /api/enrichment/settings
   * Sla enrichment-instellingen op.
   * Body: { genius_api_key?, discogs_token?, discogs_user_agent?, genre_filter_enabled?,
   *         worker_*_enabled? }
   */
  app.put('/api/enrichment/settings', (req, res) => {
    try {
      const allowed = [
        'genius_api_key', 'discogs_token', 'discogs_user_agent', 'genre_filter_enabled',
        'worker_itunes_enabled', 'worker_discogs_enabled', 'worker_audiodb_enabled',
        'worker_genius_enabled', 'worker_tidal_enabled', 'worker_qobuz_enabled',
        'worker_spotify_enabled', 'worker_musicbrainz_enabled',
        'worker_lastfm_enabled', 'worker_deezer_enabled',
        'primary_source',
      ];
      const body = req.body || {};
      for (const key of allowed) {
        if (key in body) {
          setSetting('enrichment', key, body[key]);
        }
      }
      // Pas genre filter direct aan
      if ('genre_filter_enabled' in body) {
        enrichmentManager.setGenreFilterEnabled(body.genre_filter_enabled);
      }
      res.json({ ok: true });
    } catch (err) {
      logger.error({ err: err.message }, 'Error saving enrichment settings');
      res.status(500).json({ error: err.message });
    }
  });
};
