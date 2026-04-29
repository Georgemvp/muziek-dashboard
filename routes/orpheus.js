// ── OrpheusDL API Routes ───────────────────────────────────────────────────────
// Exposeert de OrpheusDL WebUI API voor de frontend.
// Ondersteunde platforms: tidal, qobuz, deezer, spotify, soundcloud,
//                         applemusic, beatport, beatsource, youtube.

const logger = require('../logger');

// Geldige kwaliteitsopties per platform (voor validatie)
const QUALITY_OPTIONS = {
  tidal:      ['atmos', 'hifi', 'lossless', 'high', 'low'],
  qobuz:      ['hifi', 'lossless', 'high'],
  deezer:     ['lossless', 'high', 'low'],
  spotify:    ['high', 'low'],
  soundcloud: ['high'],
  applemusic: ['high'],
  beatport:   ['lossless', 'high', 'low'],
  beatsource: ['lossless', 'high', 'low'],
  youtube:    ['lossless', 'high', 'low'],
};

const ALL_PLATFORMS = Object.keys(QUALITY_OPTIONS);
const ALL_QUALITIES = [...new Set(Object.values(QUALITY_OPTIONS).flat())];
const VALID_TYPES   = ['track', 'album', 'artist', 'playlist'];

/**
 * Detecteer het platform op basis van een URL.
 * Retourneert de platformnaam of null als niet herkend.
 */
function detectPlatform(url) {
  if (!url) return null;
  const u = url.toLowerCase();
  if (u.includes('tidal.com'))        return 'tidal';
  if (u.includes('open.qobuz.com') || u.includes('qobuz.com')) return 'qobuz';
  if (u.includes('deezer.com'))       return 'deezer';
  if (u.includes('open.spotify.com') || u.includes('spotify.com')) return 'spotify';
  if (u.includes('soundcloud.com'))   return 'soundcloud';
  if (u.includes('music.apple.com'))  return 'applemusic';
  if (u.includes('beatport.com'))     return 'beatport';
  if (u.includes('beatsource.com'))   return 'beatsource';
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube';
  return null;
}

/**
 * Valideer en normaliseer een kwaliteitsoptie voor een gegeven platform.
 * Geeft de standaardkwaliteit voor dat platform terug als de opgegeven waarde ongeldig is.
 */
function resolveQuality(quality, platform) {
  const opts = QUALITY_OPTIONS[platform] || ALL_QUALITIES;
  if (quality && opts.includes(quality)) return quality;
  // Standaard: eerste (beste) kwaliteit voor dit platform
  return opts[0] || 'high';
}

module.exports = function(app, deps) {
  const {
    searchOrpheus,
    downloadOrpheus,
    downloadFromSearch,
    getOrpheusJobStatus,
    stopOrpheusJob,
    getOrpheusStatus,
    getOrpheusSettings,
    saveOrpheusSettings,
    triggerPlexScan,
    addDownload,
    getCache,
    setCache,
  } = deps;

  // ── GET /api/orpheus/status ─────────────────────────────────────────────────
  // Verbindingsstatus + lijst van beschikbare/geconfigureerde platforms.
  app.get('/api/orpheus/status', async (req, res) => {
    try {
      const result = await getOrpheusStatus();
      res.set('Cache-Control', 'private, max-age=60');
      res.json(result);
    } catch (e) {
      logger.error({ err: e.message }, 'OrpheusDL status check failed');
      res.set('Cache-Control', 'private, max-age=60');
      res.status(500).json({ connected: false, reason: e.message });
    }
  });

  // ── GET /api/orpheus/platforms ──────────────────────────────────────────────
  // Lijst van alle ondersteunde platforms met configuratiestatus.
  // "configured" = het platform heeft credentials ingevuld in de OrpheusDL settings.
  app.get('/api/orpheus/platforms', async (req, res) => {
    try {
      const settings = await getOrpheusSettings();
      const modules  = settings?.modules || settings?.module_settings || settings || {};

      const platforms = ALL_PLATFORMS.map(name => {
        const mod = modules[name] || modules[name.toLowerCase()] || {};

        // Heuristiek: een platform is geconfigureerd als er credentials aanwezig zijn
        // (bijv. username/password, token, cookies, client_id, etc.)
        const credentialKeys = ['username', 'password', 'token', 'access_token', 'cookie', 'cookies',
                                'client_id', 'client_secret', 'arl', 'email', 'api_key', 'apikey'];
        const configured = credentialKeys.some(k => {
          const v = mod[k];
          return v && String(v).trim().length > 0 && v !== 'your_value_here';
        });

        return {
          name,
          configured,
          qualities:    QUALITY_OPTIONS[name] || [],
          defaultQuality: (QUALITY_OPTIONS[name] || ['high'])[0],
          settings:     mod,
        };
      });

      res.set('Cache-Control', 'private, max-age=60');
      res.json({ platforms });
    } catch (e) {
      logger.error({ err: e.message }, 'OrpheusDL platforms fetch failed');
      res.set('Cache-Control', 'private, max-age=60');
      res.status(500).json({ error: e.message, platforms: [] });
    }
  });

  // ── GET /api/orpheus/search ─────────────────────────────────────────────────
  // Zoek op één of alle platforms.
  // Query params:
  //   q        – zoekterm (verplicht, min. 2 tekens)
  //   platform – "all" (default) of een van de 9 platforms
  //   type     – "track" (default) | "album" | "artist" | "playlist"
  app.get('/api/orpheus/search', async (req, res) => {
    const q        = (req.query.q        || '').trim();
    const platform = (req.query.platform || 'all').toLowerCase();
    const type     = (req.query.type     || 'track').toLowerCase();

    if (q.length < 2) {
      res.set('Cache-Control', 'private, max-age=300');
      return res.status(400).json({ error: 'q moet minimaal 2 tekens bevatten', results: [] });
    }
    if (platform !== 'all' && !ALL_PLATFORMS.includes(platform)) {
      res.set('Cache-Control', 'private, max-age=300');
      return res.status(400).json({
        error: `Ongeldig platform. Kies uit: all, ${ALL_PLATFORMS.join(', ')}`,
        results: []
      });
    }
    if (!VALID_TYPES.includes(type)) {
      res.set('Cache-Control', 'private, max-age=300');
      return res.status(400).json({
        error: `Ongeldig type. Kies uit: ${VALID_TYPES.join(', ')}`,
        results: []
      });
    }

    try {
      const result = await searchOrpheus(q, platform, type);
      res.set('Cache-Control', 'private, max-age=300');
      res.json(result);
    } catch (e) {
      logger.error({ err: e.message, q, platform, type }, 'OrpheusDL search failed');
      res.set('Cache-Control', 'private, max-age=300');
      res.status(500).json({ error: e.message, results: [] });
    }
  });

  // ── POST /api/orpheus/download ──────────────────────────────────────────────
  // Start een download via een directe platform-URL.
  // Body: { url, quality, title?, artist?, platform? }
  // OrpheusDL detecteert het platform automatisch op basis van de URL.
  app.post('/api/orpheus/download', async (req, res) => {
    const { url, quality, title, artist, platform: bodyPlatform } = req.body || {};

    if (!url) {
      return res.status(400).json({ ok: false, error: 'url is verplicht' });
    }

    // Detecteer platform voor kwaliteitsvalidatie en download-geschiedenis
    const detectedPlatform = bodyPlatform || detectPlatform(url);
    const resolvedQuality  = resolveQuality(quality, detectedPlatform);

    try {
      const result = await downloadOrpheus(url, resolvedQuality);

      // Trigger Plex library scan op de achtergrond (net als Tidarr)
      triggerPlexScan().catch(e =>
        logger.warn({ err: e }, 'Plex scan trigger mislukt na OrpheusDL download')
      );

      // Sla op in de persistente download-geschiedenis
      addDownload({
        tidal_id: null,
        artist:   artist   || '',
        title:    title    || url,
        url,
        quality:  resolvedQuality,
        source:   'orpheus',
        platform: detectedPlatform || null,
      });

      logger.info({
        url,
        quality: resolvedQuality,
        platform: detectedPlatform,
        jobId: result.jobId,
        artist,
        title
      }, 'OrpheusDL download gestart');

      res.json({ ok: true, jobId: result.jobId, platform: detectedPlatform, quality: resolvedQuality });
    } catch (e) {
      logger.error({ err: e.message, url }, 'OrpheusDL download mislukt');
      res.status(500).json({ ok: false, error: e.message });
    }
  });

  // ── GET /api/orpheus/job/:id ────────────────────────────────────────────────
  // Real-time job status voor polling vanuit de frontend.
  // Retourneert: { jobId, status, progress, log }
  app.get('/api/orpheus/job/:id', async (req, res) => {
    const jobId = (req.params.id || '').trim();
    if (!jobId) {
      return res.status(400).json({ error: 'jobId is verplicht' });
    }

    try {
      const result = await getOrpheusJobStatus(jobId);
      // Geen cache: dit endpoint wordt actief gepolld voor live updates
      res.set('Cache-Control', 'no-cache');
      res.json(result);
    } catch (e) {
      logger.error({ err: e.message, jobId }, 'OrpheusDL job status ophalen mislukt');
      res.status(500).json({ error: e.message, jobId });
    }
  });

  // ── POST /api/orpheus/job/:id/stop ──────────────────────────────────────────
  // Stop een actieve download job.
  app.post('/api/orpheus/job/:id/stop', async (req, res) => {
    const jobId = (req.params.id || '').trim();
    if (!jobId) {
      return res.status(400).json({ ok: false, error: 'jobId is verplicht' });
    }

    try {
      const result = await stopOrpheusJob(jobId);
      logger.info({ jobId }, 'OrpheusDL job gestopt');
      res.json({ ok: true, jobId, result });
    } catch (e) {
      logger.error({ err: e.message, jobId }, 'OrpheusDL job stop mislukt');
      res.status(500).json({ ok: false, error: e.message });
    }
  });

  // ── GET /api/orpheus/settings ───────────────────────────────────────────────
  // Haal de volledige OrpheusDL-configuratie op (inclusief per-module credentials).
  app.get('/api/orpheus/settings', async (req, res) => {
    try {
      const result = await getOrpheusSettings();
      res.set('Cache-Control', 'private, max-age=60');
      res.json(result);
    } catch (e) {
      logger.error({ err: e.message }, 'OrpheusDL settings ophalen mislukt');
      res.status(500).json({ error: e.message });
    }
  });

  // ── POST /api/orpheus/settings ──────────────────────────────────────────────
  // Bewaar OrpheusDL-configuratie (inclusief per-module credentials).
  app.post('/api/orpheus/settings', async (req, res) => {
    const data = req.body;
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return res.status(400).json({ ok: false, error: 'Body moet een JSON-object zijn' });
    }

    try {
      const result = await saveOrpheusSettings(data);
      logger.info('OrpheusDL settings opgeslagen');
      res.json({ ok: true, result });
    } catch (e) {
      logger.error({ err: e.message }, 'OrpheusDL settings opslaan mislukt');
      res.status(500).json({ ok: false, error: e.message });
    }
  });
};
