// ── PostProcess API Routes ────────────────────────────────────────────────────
// Status, log, herverwerking en AcoustID verificatie endpoints.
'use strict';

const logger = require('../logger');

module.exports = function(app, deps) {
  const {
    postProcessor,
    getPostprocessLog, getPostprocessLogByJob,
    getAcoustidResults, getAcoustidResultByJob,
    acoustidService,
    getDownloadJob,
  } = deps;

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
  // Laatste N postprocess-logregels uit de DB (alle jobs).
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

  // ════════════════════════════════════════════════════════════════════════════
  // AcoustID Verificatie routes
  // ════════════════════════════════════════════════════════════════════════════

  // ── POST /api/verify/:downloadId ─────────────────────────────────────────
  // Verifieer een specifieke download via AcoustID fingerprinting.
  // Asynchroon: start verificatie en geeft direct een 202 terug.
  app.post('/api/verify/:downloadId', async (req, res) => {
    const downloadId = parseInt(req.params.downloadId, 10);
    if (!downloadId || isNaN(downloadId)) {
      return res.status(400).json({ error: 'Ongeldig downloadId' });
    }

    const svc = acoustidService || deps.getAcoustIDService?.();
    if (!svc) {
      return res.status(503).json({ error: 'AcoustID service niet beschikbaar. Controleer de API key in instellingen.' });
    }

    const job = getDownloadJob ? getDownloadJob(downloadId) : null;
    if (!job) {
      return res.status(404).json({ error: `Download-job ${downloadId} niet gevonden` });
    }
    if (!job.file_path) {
      return res.status(422).json({ error: `Job ${downloadId} heeft geen file_path opgeslagen` });
    }

    // Fire-and-forget verificatie
    (async () => {
      try {
        const result = await svc.verify(job.file_path, {
          artist: job.artist || '',
          title:  job.track  || job.album || '',
          album:  job.album  || '',
        });

        const { saveAcoustidResult: save } = require('../db');
        save({
          download_id:     downloadId,
          file_path:       job.file_path,
          fingerprint:     result.fingerprint,
          acoustid_score:  result.score,
          expected_artist: job.artist,
          expected_title:  job.track || job.album,
          matched_artist:  result.matchedRecording?.artists?.join(', ') || null,
          matched_title:   result.matchedRecording?.title || null,
          matched_mbid:    result.matchedRecording?.id   || null,
          verified:        result.verified ? 1 : 0,
          mismatch_reason: result.mismatchReason || null,
        });

        logger.info({ downloadId, verified: result.verified, confidence: result.confidence }, 'Handmatige verificatie voltooid');
      } catch (err) {
        logger.error({ err: err.message, downloadId }, 'Handmatige verificatie mislukt');
      }
    })();

    res.status(202).json({ ok: true, downloadId, message: 'Verificatie gestart' });
  });

  // ── POST /api/verify/album ────────────────────────────────────────────────
  // Verifieer alle audiobestanden in een opgegeven albummap.
  // Body: { path: string }
  app.post('/api/verify/album', async (req, res) => {
    const albumPath = req.body?.path;
    if (!albumPath || typeof albumPath !== 'string') {
      return res.status(400).json({ error: 'Geef een geldig "path" op in de request body' });
    }

    const svc = acoustidService || deps.getAcoustIDService?.();
    if (!svc) {
      return res.status(503).json({ error: 'AcoustID service niet beschikbaar' });
    }

    try {
      // Batch verify blokkeert potentieel lang (meerdere fpcalc runs) → asynchroon
      // maar we wachten hier wel op het resultaat want de caller verwacht uitkomst
      const result = await svc.batchVerify(albumPath);
      res.set('Cache-Control', 'private, no-cache');
      res.json({ ok: true, albumPath, ...result });
    } catch (err) {
      logger.error({ err: err.message, albumPath }, 'Album batch verificatie mislukt');
      res.status(500).json({ error: err.message });
    }
  });

  // ── GET /api/verify/results ───────────────────────────────────────────────
  // Laatste verificatie-resultaten uit de DB.
  app.get('/api/verify/results', (req, res) => {
    try {
      const limit   = Math.min(parseInt(req.query.limit || '50', 10), 200);
      const results = getAcoustidResults ? getAcoustidResults(limit) : [];
      res.set('Cache-Control', 'private, no-cache');
      res.json({ ok: true, results });
    } catch (err) {
      logger.error({ err }, 'GET /api/verify/results mislukt');
      res.status(500).json({ error: 'Resultaten ophalen mislukt' });
    }
  });

  // ── GET /api/verify/results/:downloadId ──────────────────────────────────
  // Verificatie-resultaat voor één specifieke download-job.
  app.get('/api/verify/results/:downloadId', (req, res) => {
    const downloadId = parseInt(req.params.downloadId, 10);
    if (!downloadId || isNaN(downloadId)) {
      return res.status(400).json({ error: 'Ongeldig downloadId' });
    }
    try {
      const result = getAcoustidResultByJob ? getAcoustidResultByJob(downloadId) : null;
      res.set('Cache-Control', 'private, no-cache');
      res.json({ ok: true, downloadId, result });
    } catch (err) {
      logger.error({ err, downloadId }, 'GET /api/verify/results/:id mislukt');
      res.status(500).json({ error: 'Resultaat ophalen mislukt' });
    }
  });
};
