// ── Miscellaneous API Routes ─────────────────────────────────────────────────

const logger = require('../logger');

/**
 * Probeert een URL te bereiken binnen maxMs milliseconden.
 * Geeft altijd { up: boolean, ms: number } terug — gooit nooit.
 */
async function checkService(url, maxMs = 3000) {
  const start = Date.now();
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), maxMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal, method: 'HEAD' });
    clearTimeout(timer);
    // Elke HTTP-respons (ook 4xx) = service is bereikbaar
    return { up: res.status < 500, ms: Date.now() - start };
  } catch (_e) {
    clearTimeout(timer);
    return { up: false, ms: Date.now() - start };
  }
}

module.exports = function(app, deps) {
  const {
    proxyImage, getDiscover, refreshDiscover, getGaps, refreshGaps, getReleases,
    refreshReleases, getWishlist, addToWishlist, removeFromWishlist, getCache,
    getCacheAge, getPlexStatus, PLEX_URL, PLEX_TOKEN, TIDARR_URL, ORPHEUS_URL
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

  // ── /api/audiomuse/status ─────────────────────────────────────────────────
  app.get('/api/audiomuse/status', async (req, res) => {
    const AUDIOMUSE_BASE = (process.env.AUDIOMUSE_URL || 'http://localhost:8000').replace(/\/$/, '');
    try {
      const response = await fetch(`${AUDIOMUSE_BASE}/api/health`);
      res.json({ status: 'online', code: response.status });
    } catch (e) {
      res.json({ status: 'offline', error: e.message });
    }
  });

  // ── /health ───────────────────────────────────────────────────────────────
  // Geen API-key vereist — wordt ook door de Docker HEALTHCHECK gebruikt.
  // Controleert alle sub-services parallel (Promise.allSettled) zodat een
  // falende service de rest niet blokkeert. Respons binnen ~3 seconden.
  app.get('/health', async (req, res) => {
    const TIDARR_BASE    = (TIDARR_URL  || 'http://localhost:8484').replace(/\/$/, '');
    const ORPHEUS_BASE   = (ORPHEUS_URL || 'http://localhost:5000').replace(/\/$/, '');
    const MEDIASAGE_BASE = (process.env.MEDIASAGE_URL || 'http://localhost:5765').replace(/\/$/, '');
    const AUDIOMUSE_BASE = (process.env.AUDIOMUSE_URL || 'http://localhost:8000').replace(/\/$/, '');

    const plexStatus      = getPlexStatus();
    const discoverAge     = getCacheAge('discover');
    const gapsAge         = getCacheAge('gaps');
    const lastFmDown      = deps.lastFmDown      ? deps.lastFmDown()      : false;
    const lastFmDownSince = deps.lastFmDownSince ? deps.lastFmDownSince() : null;

    const [tidarrResult, orpheusResult, mediasageResult, audiomuseResult] =
      await Promise.allSettled([
        checkService(`${TIDARR_BASE}/`),
        checkService(`${ORPHEUS_BASE}/`),
        checkService(`${MEDIASAGE_BASE}/health`),
        checkService(`${AUDIOMUSE_BASE}/api/health`),
      ]);

    const svc = (r) => r.status === 'fulfilled' ? r.value : { up: false, ms: 0 };

    res.json({
      ok:     true,
      uptime: Math.round(process.uptime()),
      services: {
        plex:      plexStatus,
        tidarr:    svc(tidarrResult),
        orpheus:   svc(orpheusResult),
        mediasage: svc(mediasageResult),
        audiomuse: svc(audiomuseResult),
      },
      // Behoud bestaande velden voor backward compatibiliteit
      status:          'ok',
      plexConnected:   plexStatus.ok === true,
      lastFmDown,
      lastFmDownSince: lastFmDownSince ? new Date(lastFmDownSince).toISOString() : null,
      cache: {
        discover: discoverAge < Infinity ? Math.round(discoverAge / 1000) + 's' : 'leeg',
        gaps:     gapsAge     < Infinity ? Math.round(gapsAge     / 1000) + 's' : 'leeg'
      }
    });
  });
};
