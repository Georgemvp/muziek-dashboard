// ── PostProcess API Routes ────────────────────────────────────────────────────
// Status, log en herverwerking van de post-download pipeline.
'use strict';

const logger = require('../logger');

module.exports = function(app, deps) {
  const { postProcessor, getPostprocessLog, getPostprocessLogByJob } = deps;

  if (!postProcessor) {
    logger.warn('PostProcessor niet beschikbaar — routes worden geregistreerd maar retourneren 503');
  }

  // ── GET /api/postprocess/status ───────────────────────────────────────────
  // Geeft de huidige queue-status en de laatste 50 log-items terug.
  app.get('/api/postprocess/status', (req, res) => {
    try {
      if (!postProcessor) {
        return res.status(503).json({ error: 'PostProcessor niet beschikbaar' });
      }
      const status = postProcessor.getStatus();
      res.set('Cache-Control', 'private, no-cache');
      res.json({
        ok:            true,
        ffmpegActive:  status.ffmpegActive,
        ffmpegQueued:  status.ffmpegQueued,
        recentLog:     status.recentLog,
      });
    } catch (err) {
      logger.error({ err }, 'GET /api/postprocess/status mislukt');
      res.status(500).json({ error: 'Status ophalen mislukt' });
    }
  });

  // ── POST /api/postprocess/reprocess/:downloadId ───────────────────────────
  // Start de postprocessing-pipeline opnieuw voor een bestaande download.
  // De pipeline draait asynchroon; de response confirmeert alleen de start.
  app.post('/api/postprocess/reprocess/:downloadId', async (req, res) => {
    const downloadId = parseInt(req.params.downloadId, 10);
    if (!downloadId || isNaN(downloadId)) {
      return res.status(400).json({ error: 'Ongeldig downloadId' });
    }
    if (!postProcessor) {
      return res.status(503).json({ error: 'PostProcessor niet beschikbaar' });
    }
    try {
      // Fire-and-forget: fouten worden gelogd door PostProcessor zelf
      postProcessor.reprocess(downloadId).catch(err => {
        logger.error({ err: err.message, downloadId }, 'Herverwerking mislukt');
      });
      res.json({ ok: true, downloadId, message: 'Herverwerking gestart' });
    } catch (err) {
      logger.error({ err }, 'POST /api/postprocess/reprocess mislukt');
      res.status(500).json({ error: err.message });
    }
  });

  // ── GET /api/postprocess/log ──────────────────────────────────────────────
  // Laatste 50 postprocess-logregels uit de DB (alle jobs).
  app.get('/api/postprocess/log', (req, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);
      const log   = getPostprocessLog ? getPostprocessLog(limit) : (postProcessor?._recentLog?.slice(0, limit) ?? []);
      res.set('Cache-Control', 'private, no-cache');
      res.json({ ok: true, log });
    } catch (err) {
      logger.error({ err }, 'GET /api/postprocess/log mislukt');
      res.status(500).json({ error: 'Log ophalen mislukt' });
    }
  });

  // ── GET /api/postprocess/log/:downloadId ─────────────────────────────────
  // Log-items voor één specifieke download-job.
  app.get('/api/postprocess/log/:downloadId', (req, res) => {
    const downloadId = parseInt(req.params.downloadId, 10);
    if (!downloadId || isNaN(downloadId)) {
      return res.status(400).json({ error: 'Ongeldig downloadId' });
    }
    try {
      const log = getPostprocessLogByJob ? getPostprocessLogByJob(downloadId) : [];
      res.set('Cache-Control', 'private, no-cache');
      res.json({ ok: true, downloadId, log });
    } catch (err) {
      logger.error({ err, downloadId }, 'GET /api/postprocess/log/:id mislukt');
      res.status(500).json({ error: 'Log ophalen mislukt' });
    }
  });
};
