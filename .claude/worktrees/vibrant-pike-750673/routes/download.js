// ── Unified Download Routes ───────────────────────────────────────────────────
// Alle downloads via één endpoint — de orchestrator kiest de beste bron en
// valt automatisch terug op de volgende als een bron niet werkt.
//
// Bestaande /api/tidarr/* en /api/orpheus/* endpoints blijven behouden als
// directe toegang. Dit zijn de lagere-laag endpoints.
'use strict';

const logger = require('../logger').child({ service: 'routes/download' });

module.exports = function(app, deps) {
  const {
    downloadOrchestrator,
    getRecentDownloadJobs,
    getActiveDownloadJobs,
    getDownloadJob,
    updateDownloadJob,
    getPendingDownloadJobs,
    getSetting, setSetting,
  } = deps;

  if (!downloadOrchestrator) {
    logger.warn('downloadOrchestrator niet beschikbaar — /api/download routes uitgeschakeld');
    return;
  }

  // ── POST /api/download ─────────────────────────────────────────────────────
  // Start een download via de orchestrator.
  app.post('/api/download', async (req, res) => {
    const { artist, album, track, type, quality, source } = req.body || {};

    if (!artist && !album && !track) {
      return res.status(400).json({ error: 'artist, album of track is verplicht' });
    }

    res.setHeader('Cache-Control', 'no-store');

    try {
      const result = await downloadOrchestrator.download({
        artist:  artist  || '',
        album:   album   || '',
        track:   track   || '',
        type:    type    || (album ? 'album' : 'track'),
        quality: quality || 'flac',
        source:  source  || 'auto',
      });

      const statusCode = result.status === 'completed' ? 200 : (result.status === 'failed' ? 503 : 202);
      res.status(statusCode).json({
        id:      result.id,
        status:  result.status,
        source:  result.source,
        message: result.status === 'completed'
          ? `Download gestart via ${result.source}`
          : (result.error || 'Download gestart'),
      });
    } catch (err) {
      logger.error({ err, body: req.body }, 'Download orchestrator fout');
      res.status(500).json({ error: err.message });
    }
  });

  // ── GET /api/download/search ───────────────────────────────────────────────
  // Zoek over alle enabled bronnen parallel.
  app.get('/api/download/search', async (req, res) => {
    const q    = (req.query.q || '').trim();
    const type = req.query.type || 'album';

    if (q.length < 2) {
      return res.status(400).json({ error: 'Zoekterm moet minimaal 2 tekens zijn' });
    }

    res.setHeader('Cache-Control', 'private, max-age=120');

    try {
      const { results } = await downloadOrchestrator.search({ query: q, type });
      res.json({ results, query: q, type });
    } catch (err) {
      logger.error({ err, q }, 'Unified search fout');
      res.status(500).json({ error: err.message, results: [] });
    }
  });

  // ── GET /api/download/status ───────────────────────────────────────────────
  // Status van alle bronnen (connected / enabled / errorCount).
  app.get('/api/download/status', async (req, res) => {
    res.setHeader('Cache-Control', 'private, max-age=30');
    try {
      const { sources } = await downloadOrchestrator.getSourceStatus();
      res.json({ sources });
    } catch (err) {
      logger.error({ err }, 'Status check fout');
      res.status(500).json({ error: err.message, sources: [] });
    }
  });

  // ── GET /api/download/queue ────────────────────────────────────────────────
  // Alle actieve (pending + running) download jobs.
  app.get('/api/download/queue', (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    try {
      const jobs = getActiveDownloadJobs();
      res.json({ jobs });
    } catch (err) {
      logger.error({ err }, 'Queue ophalen mislukt');
      res.status(500).json({ error: err.message, jobs: [] });
    }
  });

  // ── GET /api/download/history ──────────────────────────────────────────────
  // Download-geschiedenis (meest recent eerst).
  app.get('/api/download/history', (req, res) => {
    res.setHeader('Cache-Control', 'private, max-age=60');
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    try {
      const jobs = getRecentDownloadJobs(limit);
      res.json({ jobs });
    } catch (err) {
      logger.error({ err }, 'Geschiedenis ophalen mislukt');
      res.status(500).json({ error: err.message, jobs: [] });
    }
  });

  // ── POST /api/download/retry/:id ──────────────────────────────────────────
  // Retry één gefaalde job.
  app.post('/api/download/retry/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    if (!id) return res.status(400).json({ error: 'Ongeldig job id' });

    res.setHeader('Cache-Control', 'no-store');

    const job = getDownloadJob(id);
    if (!job) return res.status(404).json({ error: 'Job niet gevonden' });

    try {
      // Reset status naar pending zodat de orchestrator het opnieuw probeert
      updateDownloadJob(id, { status: 'pending', error_log: null });

      const result = await downloadOrchestrator.download({
        artist:  job.artist,
        album:   job.album   || '',
        track:   job.track   || '',
        type:    job.type    || 'album',
        quality: job.quality || 'flac',
        source:  job.source_requested || 'auto',
      });
      res.json({ ok: true, result });
    } catch (err) {
      logger.error({ err, id }, 'Retry mislukt');
      res.status(500).json({ error: err.message });
    }
  });

  // ── POST /api/download/retry-all ──────────────────────────────────────────
  // Retry alle gefaalde downloads.
  app.post('/api/download/retry-all', async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    try {
      const { retried } = await downloadOrchestrator.retryFailed();
      res.json({ ok: true, retried });
    } catch (err) {
      logger.error({ err }, 'Retry-all mislukt');
      res.status(500).json({ error: err.message });
    }
  });

  // ── GET /api/download/settings ────────────────────────────────────────────
  // Haal download orchestrator settings op.
  app.get('/api/download/settings', (req, res) => {
    res.setHeader('Cache-Control', 'private, max-age=60');
    try {
      const priority = getSetting('download', 'source_priority');
      const hybrid   = getSetting('download', 'hybrid_mode');
      const enabled  = {};
      const { DEFAULT_SOURCE_PRIORITY } = require('../services/downloadOrchestrator');
      for (const src of DEFAULT_SOURCE_PRIORITY) {
        enabled[src] = getSetting('download', `source_enabled_${src}`);
        if (enabled[src] === null) enabled[src] = true;
      }
      res.json({
        source_priority: priority || DEFAULT_SOURCE_PRIORITY,
        hybrid_mode:     hybrid === null ? true : Boolean(hybrid),
        source_enabled:  enabled,
      });
    } catch (err) {
      logger.error({ err }, 'Settings ophalen mislukt');
      res.status(500).json({ error: err.message });
    }
  });

  // ── POST /api/download/settings ───────────────────────────────────────────
  // Bewaar download orchestrator settings.
  app.post('/api/download/settings', (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    try {
      const { source_priority, hybrid_mode, source_enabled } = req.body || {};

      if (Array.isArray(source_priority)) {
        setSetting('download', 'source_priority', source_priority, 'json');
      }
      if (hybrid_mode !== undefined) {
        setSetting('download', 'hybrid_mode', Boolean(hybrid_mode), 'boolean');
      }
      if (source_enabled && typeof source_enabled === 'object') {
        for (const [src, val] of Object.entries(source_enabled)) {
          setSetting('download', `source_enabled_${src}`, Boolean(val), 'boolean');
        }
      }

      res.json({ ok: true });
    } catch (err) {
      logger.error({ err }, 'Settings opslaan mislukt');
      res.status(500).json({ error: err.message });
    }
  });

  logger.info('Unified download routes geregistreerd (/api/download)');
};
