// ── Cache-powered Discovery Routes ────────────────────────────────────────────
'use strict';

const logger = require('../logger');
const {
  getUndiscoveredAlbums,
  getNewInYourGenres,
  getFromYourLabels,
  getDeepCuts,
  getGenreExplorer,
  getGenreDetail,
  rebuildAllCaches,
} = require('../services/cacheDiscovery');

/**
 * Standaard response-helper.
 * Geeft { status: 'building', message } terug als data null is (nog niet gecached).
 */
function sendDiscovery(res, data, type) {
  if (data === null) {
    // Trigger achtergrond-rebuild
    rebuildAllCaches().catch(() => {});
    return res.json({
      status:  'building',
      type,
      message: 'Data wordt opgebouwd uit cache… Probeer het over 10 seconden opnieuw.',
      items:   [],
    });
  }
  res.set('Cache-Control', 'private, max-age=3600');
  return res.json({ status: 'ok', type, items: data });
}

module.exports = function(app, deps) {

  // ── GET /api/discover/undiscovered ──────────────────────────────────────────
  app.get('/api/discover/undiscovered', async (req, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
      const data  = await getUndiscoveredAlbums(limit);
      sendDiscovery(res, data, 'undiscovered');
    } catch (err) {
      logger.error({ err }, 'GET /api/discover/undiscovered fout');
      res.status(500).json({ error: err.message });
    }
  });

  // ── GET /api/discover/genres-new ────────────────────────────────────────────
  app.get('/api/discover/genres-new', async (req, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
      const data  = await getNewInYourGenres(limit);
      sendDiscovery(res, data, 'genres_new');
    } catch (err) {
      logger.error({ err }, 'GET /api/discover/genres-new fout');
      res.status(500).json({ error: err.message });
    }
  });

  // ── GET /api/discover/labels ─────────────────────────────────────────────────
  app.get('/api/discover/labels', async (req, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
      const data  = await getFromYourLabels(limit);
      sendDiscovery(res, data, 'labels');
    } catch (err) {
      logger.error({ err }, 'GET /api/discover/labels fout');
      res.status(500).json({ error: err.message });
    }
  });

  // ── GET /api/discover/deep-cuts ──────────────────────────────────────────────
  app.get('/api/discover/deep-cuts', async (req, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit, 10) || 30, 100);
      const data  = await getDeepCuts(limit);
      sendDiscovery(res, data, 'deep_cuts');
    } catch (err) {
      logger.error({ err }, 'GET /api/discover/deep-cuts fout');
      res.status(500).json({ error: err.message });
    }
  });

  // ── GET /api/discover/genre-explorer ─────────────────────────────────────────
  app.get('/api/discover/genre-explorer', async (req, res) => {
    try {
      const data = await getGenreExplorer();
      sendDiscovery(res, data, 'genre_explorer');
    } catch (err) {
      logger.error({ err }, 'GET /api/discover/genre-explorer fout');
      res.status(500).json({ error: err.message });
    }
  });

  // ── GET /api/discover/genre-detail/:genre ────────────────────────────────────
  app.get('/api/discover/genre-detail/:genre', async (req, res) => {
    try {
      const genre = decodeURIComponent(req.params.genre || '');
      if (!genre) return res.status(400).json({ error: 'genre is verplicht' });

      const data = await getGenreDetail(genre);
      if (!data) return res.status(404).json({ error: 'Genre niet gevonden of geen data' });

      res.set('Cache-Control', 'private, max-age=3600');
      res.json(data);
    } catch (err) {
      logger.error({ err }, 'GET /api/discover/genre-detail fout');
      res.status(500).json({ error: err.message });
    }
  });

  // ── POST /api/discover/cache-refresh ─────────────────────────────────────────
  app.post('/api/discover/cache-refresh', async (req, res) => {
    try {
      // Start rebuild asynchroon — return meteen
      rebuildAllCaches().catch(err => logger.error({ err }, 'Rebuild cache discovery mislukt'));
      res.json({ status: 'rebuilding', message: 'Cache discovery wordt herbouwd op de achtergrond.' });
    } catch (err) {
      logger.error({ err }, 'POST /api/discover/cache-refresh fout');
      res.status(500).json({ error: err.message });
    }
  });
};
