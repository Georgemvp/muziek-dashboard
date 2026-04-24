// ── Miscellaneous API Routes ─────────────────────────────────────────────────

const logger = require('../logger');

module.exports = function(app, deps) {
  const {
    proxyImage, getDiscover, refreshDiscover, getGaps, refreshGaps, getReleases,
    refreshReleases, getWishlist, addToWishlist, removeFromWishlist, getCache,
    getCacheAge, getPlexStatus, PLEX_URL, PLEX_TOKEN
  } = deps;

  // ── /api/discover, /api/gaps, /api/releases ───────────────────────────────

  app.get('/api/discover', (req, res) => {
    res.set('Cache-Control', 'private, max-age=600');
    res.json(getDiscover());
  });

  app.get('/api/gaps', (req, res) => {
    res.set('Cache-Control', 'private, max-age=600');
    res.json(getGaps());
  });

  app.get('/api/releases', (req, res) => {
    res.set('Cache-Control', 'private, max-age=300');
    res.json(getReleases());
  });

  app.post('/api/discover/refresh', (req, res) => res.json(refreshDiscover()));
  app.post('/api/gaps/refresh', (req, res) => res.json(refreshGaps()));
  app.post('/api/releases/refresh', (req, res) => res.json(refreshReleases()));

  // ── /api/wishlist ──────────────────────────────────────────────────────────

  app.get('/api/wishlist', (req, res) => {
    res.set('Cache-Control', 'private, max-age=300');
    res.json(getWishlist());
  });

  app.post('/api/wishlist', (req, res) => {
    const { type, name, artist, image } = req.body || {};
    if (!type || !name) return res.status(400).json({ error: 'type en name zijn verplicht' });
    const id = addToWishlist(type, name, artist || null, image || null);
    res.json({ id, added: true });
  });

  app.delete('/api/wishlist/:id', (req, res) => {
    removeFromWishlist(parseInt(req.params.id));
    res.json({ removed: true });
  });

  // ── /api/img ───────────────────────────────────────────────────────────────
  // GET /api/img?url=ENCODED_URL&w=120&h=120
  // Resizet en converteert externe afbeeldingen naar WebP (met disk-cache).
  // Fallback: redirect naar de originele URL als sharp faalt (bijv. SVG).

  app.get('/api/img', async (req, res) => {
    let url = (req.query.url || '').trim();
    if (!url) return res.status(400).json({ error: 'url parameter is verplicht' });

    // Relatieve Plex-paden (bijv. /library/metadata/.../thumb/...)
    // omzetten naar volledige URL met Plex token
    if (url.startsWith('/') && !url.startsWith('//') && PLEX_URL && PLEX_TOKEN) {
      const sep = url.includes('?') ? '&' : '?';
      url = `${PLEX_URL}${url}${sep}X-Plex-Token=${PLEX_TOKEN}`;
    }

    // Basisvalidatie: sta alleen http(s)-URLs toe
    if (!/^https?:\/\//i.test(url)) {
      return res.status(400).json({ error: 'Ongeldige URL' });
    }

    const w      = parseInt(req.query.w) || 120;
    const h      = parseInt(req.query.h) || 0;
    const format = (req.query.fmt || 'webp') === 'jpeg' ? 'jpeg' : 'webp';
    const mime   = format === 'jpeg' ? 'image/jpeg' : 'image/webp';

    try {
      const buffer = await proxyImage(url, w, h, format);
      res.set({
        'Content-Type':  mime,
        'Cache-Control': 'public, max-age=604800, immutable',
        'X-Proxy-Cache': 'hit'
      });
      return res.send(buffer);
    } catch (err) {
      // Als sharp faalt (bijv. SVG of corrupt bestand): stuur redirect
      logger.warn({ err, url }, '/api/img proxy mislukt, redirect naar origineel');
      return res.redirect(302, url);
    }
  });

  // ── /health ───────────────────────────────────────────────────────────────
  // Note: lastFmDown and lastFmDownSince are passed via deps
  // The lastfm route module should export these for use here

  app.get('/health', (req, res) => {
    const { ok: plexConnected } = getPlexStatus();
    const discoverAge = getCacheAge('discover');
    const gapsAge     = getCacheAge('gaps');

    // Get lastFmDown status from deps if available, otherwise assume up
    const lastFmDown = deps.lastFmDown ? deps.lastFmDown() : false;
    const lastFmDownSince = deps.lastFmDownSince ? deps.lastFmDownSince() : null;

    res.json({
      status:       'ok',
      uptime:       Math.round(process.uptime()),
      plexConnected,
      lastFmDown,
      lastFmDownSince: lastFmDownSince ? new Date(lastFmDownSince).toISOString() : null,
      cache: {
        discover: discoverAge < Infinity ? Math.round(discoverAge / 1000) + 's' : 'leeg',
        gaps:     gapsAge     < Infinity ? Math.round(gapsAge     / 1000) + 's' : 'leeg'
      }
    });
  });
};
