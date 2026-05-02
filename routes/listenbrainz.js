'use strict';
// ── ListenBrainz Routes ───────────────────────────────────────────────────────

const logger = require('../logger');
const {
  getListenBrainzRecommendations,
  getListenBrainzPlaylists,
  getListenBrainzSimilarUsers,
  getListenBrainzStatus,
} = require('../services/listenbrainz');

module.exports = function(app /*, deps */) {

  // GET /api/listenbrainz/status
  app.get('/api/listenbrainz/status', async (req, res) => {
    try {
      const status = await getListenBrainzStatus();
      res.set('Cache-Control', 'private, max-age=120');
      res.json(status);
    } catch (err) {
      logger.warn({ err }, 'ListenBrainz status route fout');
      res.set('Cache-Control', 'private, max-age=60');
      res.json({ enabled: false, ok: false, error: err.message });
    }
  });

  // GET /api/listenbrainz/recommendations
  app.get('/api/listenbrainz/recommendations', async (req, res) => {
    try {
      const data = await getListenBrainzRecommendations();
      res.set('Cache-Control', 'private, max-age=1800');
      res.json(data);
    } catch (err) {
      logger.warn({ err }, 'ListenBrainz recommendations route fout');
      res.status(503).json({ enabled: false, artists: [], error: err.message });
    }
  });

  // GET /api/listenbrainz/playlists
  app.get('/api/listenbrainz/playlists', async (req, res) => {
    try {
      const data = await getListenBrainzPlaylists();
      res.set('Cache-Control', 'private, max-age=900');
      res.json(data);
    } catch (err) {
      logger.warn({ err }, 'ListenBrainz playlists route fout');
      res.status(503).json({ enabled: false, playlists: [], error: err.message });
    }
  });

  // GET /api/listenbrainz/similar-users
  app.get('/api/listenbrainz/similar-users', async (req, res) => {
    try {
      const data = await getListenBrainzSimilarUsers();
      res.set('Cache-Control', 'private, max-age=3600');
      res.json(data);
    } catch (err) {
      logger.warn({ err }, 'ListenBrainz similar-users route fout');
      res.status(503).json({ enabled: false, similarUsers: [], error: err.message });
    }
  });
};
