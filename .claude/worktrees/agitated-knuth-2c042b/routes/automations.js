// ── Automations API Routes ─────────────────────────────────────────────────────
'use strict';

const logger = require('../logger').child({ service: 'routes/automations' });
const automationService = require('../services/automation');

module.exports = function(app, deps) {

  // GET /api/automations — alle automations
  app.get('/api/automations', (req, res) => {
    try {
      const automations = automationService.getAll();
      res.setHeader('Cache-Control', 'no-cache');
      res.json({ automations });
    } catch (err) {
      logger.error({ err: err.message }, 'GET /api/automations fout');
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/automations/pipelines — beschikbare pipelines
  // Let op: deze route MOET voor /:id staan om te voorkomen dat "pipelines" als id wordt gelezen
  app.get('/api/automations/pipelines', (req, res) => {
    try {
      res.json({ pipelines: automationService.getPipelines() });
    } catch (err) {
      logger.error({ err: err.message }, 'GET /api/automations/pipelines fout');
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/automations/pipelines/:name/install — installeer een pipeline
  app.post('/api/automations/pipelines/:name/install', (req, res) => {
    const { name } = req.params;
    try {
      const created = automationService.installPipeline(name);
      logger.info({ pipeline: name, count: created.length }, 'Pipeline geïnstalleerd');
      res.status(201).json({ installed: created });
    } catch (err) {
      logger.error({ err: err.message, pipeline: name }, 'Pipeline installatie mislukt');
      res.status(400).json({ error: err.message });
    }
  });

  // GET /api/automations/:id — één automation
  app.get('/api/automations/:id', (req, res) => {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'Ongeldig id' });
    try {
      const automation = automationService.getById(id);
      if (!automation) return res.status(404).json({ error: 'Niet gevonden' });
      res.json(automation);
    } catch (err) {
      logger.error({ err: err.message, id }, 'GET /api/automations/:id fout');
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/automations — nieuwe automation
  app.post('/api/automations', (req, res) => {
    try {
      const automation = automationService.create(req.body);
      res.status(201).json(automation);
    } catch (err) {
      logger.error({ err: err.message }, 'POST /api/automations fout');
      res.status(400).json({ error: err.message });
    }
  });

  // PUT /api/automations/:id — update automation
  app.put('/api/automations/:id', (req, res) => {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'Ongeldig id' });
    try {
      const automation = automationService.update(id, req.body);
      res.json(automation);
    } catch (err) {
      logger.error({ err: err.message, id }, 'PUT /api/automations/:id fout');
      res.status(400).json({ error: err.message });
    }
  });

  // DELETE /api/automations/:id — verwijder automation
  app.delete('/api/automations/:id', (req, res) => {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'Ongeldig id' });
    try {
      automationService.remove(id);
      res.json({ ok: true });
    } catch (err) {
      logger.error({ err: err.message, id }, 'DELETE /api/automations/:id fout');
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/automations/:id/toggle — enable/disable
  app.post('/api/automations/:id/toggle', (req, res) => {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'Ongeldig id' });
    try {
      const current = automationService.getById(id);
      if (!current) return res.status(404).json({ error: 'Niet gevonden' });
      automationService.setEnabled(id, !current.enabled);
      const updated = automationService.getById(id);
      res.json(updated);
    } catch (err) {
      logger.error({ err: err.message, id }, 'POST /api/automations/:id/toggle fout');
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/automations/:id/run — handmatig uitvoeren
  app.post('/api/automations/:id/run', async (req, res) => {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'Ongeldig id' });
    try {
      const automation = automationService.getById(id);
      if (!automation) return res.status(404).json({ error: 'Niet gevonden' });
      // Start async — stuur direct 202 terug
      automationService.runNow(id).catch(err =>
        logger.error({ err: err.message, id }, 'runNow achtergrond fout'));
      res.status(202).json({ ok: true, message: 'Automation wordt uitgevoerd' });
    } catch (err) {
      logger.error({ err: err.message, id }, 'POST /api/automations/:id/run fout');
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/automations/:id/log — execution log
  app.get('/api/automations/:id/log', (req, res) => {
    const id    = Number(req.params.id);
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    if (!id) return res.status(400).json({ error: 'Ongeldig id' });
    try {
      const log = automationService.getLog(id, limit);
      res.setHeader('Cache-Control', 'no-cache');
      res.json({ log });
    } catch (err) {
      logger.error({ err: err.message, id }, 'GET /api/automations/:id/log fout');
      res.status(500).json({ error: err.message });
    }
  });
};
