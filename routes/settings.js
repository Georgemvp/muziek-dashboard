// ── Settings API Routes ───────────────────────────────────────────────────────
// Beheert persistente gebruikersinstellingen opgeslagen in SQLite.
// Alle settings zijn key-value pairs per categorie.
// .env waarden zijn read-only en worden apart teruggegeven.

const logger = require('../logger');

module.exports = function(app, deps) {
  const { getSettings, getSetting, setSetting, setSettings, getAllSettings } = deps;

  // ── Lees-only .env waarden (info-endpoints) ───────────────────────────────
  const ENV_INFO = {
    lastfm: {
      api_key:  process.env.LASTFM_API_KEY  ? '••••••••' + (process.env.LASTFM_API_KEY.slice(-4) || '') : null,
      username: process.env.LASTFM_USER     || null,
    },
    plex: {
      url:   process.env.PLEX_URL   || null,
      token: process.env.PLEX_TOKEN ? '••••••••' + (process.env.PLEX_TOKEN.slice(-4) || '') : null,
    },
    spotify: {
      client_id:     process.env.SPOTIFY_CLIENT_ID     ? '••••' + (process.env.SPOTIFY_CLIENT_ID.slice(-4) || '') : null,
      client_secret: process.env.SPOTIFY_CLIENT_SECRET ? '••••' : null,
      configured:    !!(process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET),
    },
    tidarr: {
      url:     process.env.TIDARR_URL     || 'http://localhost:8484',
      api_key: process.env.TIDARR_API_KEY ? '••••' : null,
    },
    orpheus: {
      url: process.env.ORPHEUS_URL || 'http://localhost:5000',
    },
    slskd: {
      url:     process.env.SLSKD_URL     || 'http://localhost:5030',
      api_key: process.env.SLSKD_API_KEY ? '••••' : null,
    },
    hifi: {
      instances: process.env.HIFI_INSTANCES || '',
    },
  };

  // ── GET /api/settings ─────────────────────────────────────────────────────
  // Alle settings als { categories: { cat: { key: val } }, env: { ... } }
  app.get('/api/settings', (req, res) => {
    try {
      const all = getAllSettings();
      res.set('Cache-Control', 'private, no-cache');
      res.json({ categories: all, env: ENV_INFO });
    } catch (err) {
      logger.error({ err }, 'Failed to get all settings');
      res.status(500).json({ error: 'Instellingen ophalen mislukt' });
    }
  });

  // ── PUT /api/settings ─────────────────────────────────────────────────────
  // Bulk-update meerdere categorieën: body = { category: { key: value } }
  app.put('/api/settings', (req, res) => {
    try {
      const body = req.body || {};
      if (typeof body !== 'object') {
        return res.status(400).json({ error: 'Body moet een JSON-object zijn' });
      }
      for (const [category, values] of Object.entries(body)) {
        if (typeof values === 'object' && values !== null) {
          setSettings(category, values);
        }
      }
      logger.info({ categories: Object.keys(body) }, 'Settings bulk-updated');
      res.json({ saved: true });
    } catch (err) {
      logger.error({ err }, 'Failed to bulk-update settings');
      res.status(500).json({ error: 'Instellingen opslaan mislukt' });
    }
  });

  // ── GET /api/settings/:category ───────────────────────────────────────────
  // Settings voor één categorie als { key: value }
  app.get('/api/settings/:category', (req, res) => {
    try {
      const { category } = req.params;
      if (!/^[a-z0-9_-]+$/i.test(category)) {
        return res.status(400).json({ error: 'Ongeldige categorie naam' });
      }
      const settings = getSettings(category);
      res.set('Cache-Control', 'private, no-cache');
      res.json(settings);
    } catch (err) {
      logger.error({ category: req.params.category, err }, 'Failed to get category settings');
      res.status(500).json({ error: 'Instellingen ophalen mislukt' });
    }
  });

  // ── PUT /api/settings/:category ───────────────────────────────────────────
  // Update settings voor één categorie: body = { key: value, ... }
  app.put('/api/settings/:category', (req, res) => {
    try {
      const { category } = req.params;
      if (!/^[a-z0-9_-]+$/i.test(category)) {
        return res.status(400).json({ error: 'Ongeldige categorie naam' });
      }
      const body = req.body || {};
      if (typeof body !== 'object') {
        return res.status(400).json({ error: 'Body moet een JSON-object zijn' });
      }
      setSettings(category, body);
      logger.info({ category, keys: Object.keys(body) }, 'Category settings updated');
      res.json({ saved: true, category });
    } catch (err) {
      logger.error({ category: req.params.category, err }, 'Failed to update category settings');
      res.status(500).json({ error: 'Instellingen opslaan mislukt' });
    }
  });

  // ── GET /api/settings/env/info ────────────────────────────────────────────
  // Alleen de read-only .env waarden (gemaskeerd)
  app.get('/api/settings/env/info', (req, res) => {
    res.set('Cache-Control', 'private, max-age=60');
    res.json(ENV_INFO);
  });
};
