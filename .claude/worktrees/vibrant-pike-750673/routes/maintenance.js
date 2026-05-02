// ── Maintenance Routes ────────────────────────────────────────────────────────
// REST-endpoints voor Library Maintenance Suite.
// Scans draaien asynchroon; voortgang via SSE of polling op /api/maintenance/findings.

'use strict';

const logger = require('../logger');

// Actieve scan-runs bijhouden (type → { status, startedAt, progress })
const _activeScan = new Map();

module.exports = function(app, deps) {
  const {
    getMaintenanceFindings,
    getMaintenanceFinding,
    updateMaintenanceFindingStatus,
    getMaintenanceSummary,
    getMaintenanceRuns,
    getDb,
  } = require('../db');

  const maintenanceSvc = require('../services/maintenance');

  // Initialiseer de maintenance service met de DB-instantie
  maintenanceSvc.initMaintenance(getDb());

  // ── GET /api/maintenance/scans ──────────────────────────────────────────────
  // Beschikbare scan types + hun metadata
  app.get('/api/maintenance/scans', (req, res) => {
    res.setHeader('Cache-Control', 'no-cache');
    const types = Object.entries(maintenanceSvc.SCAN_TYPES).map(([key, def]) => ({
      type:        key,
      label:       def.label,
      description: def.description,
    }));
    res.json({ scans: types });
  });

  // ── GET /api/maintenance/status ─────────────────────────────────────────────
  // Actieve scan status opvragen (voor polling)
  app.get('/api/maintenance/status', (req, res) => {
    res.setHeader('Cache-Control', 'no-cache');
    const active = {};
    for (const [type, info] of _activeScan) {
      active[type] = info;
    }
    res.json({ active });
  });

  // ── POST /api/maintenance/scan/:type ───────────────────────────────────────
  // Start een enkele scan. Draait asynchroon; status via /api/maintenance/status
  app.post('/api/maintenance/scan/:type', async (req, res) => {
    const { type } = req.params;

    if (!maintenanceSvc.SCAN_TYPES[type]) {
      return res.status(400).json({ error: `Onbekend scan type: ${type}` });
    }
    if (_activeScan.get(type)?.status === 'running') {
      return res.status(409).json({ error: `Scan "${type}" is al actief` });
    }

    // Start scan asynchroon
    _activeScan.set(type, { status: 'running', startedAt: Date.now(), progress: null, findings: 0 });

    res.json({ ok: true, message: `Scan "${type}" gestart` });

    // Draai scan op de achtergrond
    setImmediate(async () => {
      try {
        const result = await maintenanceSvc.runScan(type, (progress) => {
          _activeScan.set(type, {
            status: 'running',
            startedAt: _activeScan.get(type)?.startedAt || Date.now(),
            progress,
            findings: _activeScan.get(type)?.findings || 0,
          });
        });
        _activeScan.set(type, {
          status: 'completed',
          startedAt: _activeScan.get(type)?.startedAt,
          completedAt: Date.now(),
          findings: result.findings.length,
          durationMs: result.durationMs,
        });
        logger.info({ type, findings: result.findings.length, durationMs: result.durationMs }, 'Maintenance scan voltooid');
      } catch (err) {
        _activeScan.set(type, {
          status: 'error',
          startedAt: _activeScan.get(type)?.startedAt,
          error: err.message,
        });
        logger.error({ err, type }, 'Maintenance scan fout');
      }
    });
  });

  // ── POST /api/maintenance/scan/all ─────────────────────────────────────────
  // Draai alle scans na elkaar (niet parallel — te zwaar)
  app.post('/api/maintenance/scan/all', async (req, res) => {
    const types = Object.keys(maintenanceSvc.SCAN_TYPES);
    const alreadyRunning = types.filter(t => _activeScan.get(t)?.status === 'running');
    if (alreadyRunning.length > 0) {
      return res.status(409).json({ error: `Scans al actief: ${alreadyRunning.join(', ')}` });
    }

    for (const t of types) {
      _activeScan.set(t, { status: 'queued', startedAt: null, progress: null });
    }

    res.json({ ok: true, message: `${types.length} scans in de wachtrij` });

    setImmediate(async () => {
      for (const t of types) {
        _activeScan.set(t, { status: 'running', startedAt: Date.now(), progress: null, findings: 0 });
        try {
          const result = await maintenanceSvc.runScan(t, (progress) => {
            _activeScan.set(t, { ..._activeScan.get(t), progress });
          });
          _activeScan.set(t, {
            status: 'completed', startedAt: _activeScan.get(t)?.startedAt,
            completedAt: Date.now(), findings: result.findings.length, durationMs: result.durationMs,
          });
        } catch (err) {
          _activeScan.set(t, { status: 'error', error: err.message });
          logger.error({ err, type: t }, 'Maintenance scan fout (scan all)');
        }
      }
    });
  });

  // ── GET /api/maintenance/findings ──────────────────────────────────────────
  // Findings ophalen met optionele filters: ?type=dead_files&status=open
  app.get('/api/maintenance/findings', (req, res) => {
    res.setHeader('Cache-Control', 'no-cache');
    try {
      const { type, status } = req.query;
      const findings = getMaintenanceFindings({
        scanType: type  || null,
        status:   status || null,
      });
      res.json({ findings, total: findings.length });
    } catch (err) {
      logger.error({ err }, 'Fout bij ophalen findings');
      res.status(500).json({ error: err.message });
    }
  });

  // ── POST /api/maintenance/fix/:findingId ───────────────────────────────────
  // Fix één finding (als autoFixable)
  app.post('/api/maintenance/fix/:findingId', async (req, res) => {
    const id = parseInt(req.params.findingId, 10);
    if (!id) return res.status(400).json({ error: 'Ongeldig finding ID' });

    try {
      const finding = getMaintenanceFinding(id);
      if (!finding) return res.status(404).json({ error: 'Finding niet gevonden' });
      if (!finding.auto_fixable) return res.status(400).json({ error: 'Finding is niet auto-fixable' });
      if (finding.status !== 'open') return res.status(400).json({ error: `Finding is al ${finding.status}` });

      const result = await maintenanceSvc.fixFinding(id);
      res.json(result);
    } catch (err) {
      logger.error({ err, id }, 'Fix finding fout');
      res.status(500).json({ error: err.message });
    }
  });

  // ── POST /api/maintenance/fix-all/:scanType ────────────────────────────────
  // Fix alle auto-fixable findings van een scan type
  app.post('/api/maintenance/fix-all/:scanType', async (req, res) => {
    const { scanType } = req.params;
    try {
      const results = await maintenanceSvc.fixAll(scanType);
      const fixed   = results.filter(r => r.status === 'fixed').length;
      const skipped = results.filter(r => r.status === 'skipped').length;
      const errors  = results.filter(r => r.status === 'error').length;
      res.json({ ok: true, total: results.length, fixed, skipped, errors, results });
    } catch (err) {
      logger.error({ err, scanType }, 'Fix-all fout');
      res.status(500).json({ error: err.message });
    }
  });

  // ── POST /api/maintenance/ignore/:findingId ────────────────────────────────
  // Markeer finding als genegeerd
  app.post('/api/maintenance/ignore/:findingId', (req, res) => {
    const id = parseInt(req.params.findingId, 10);
    if (!id) return res.status(400).json({ error: 'Ongeldig finding ID' });

    try {
      const finding = getMaintenanceFinding(id);
      if (!finding) return res.status(404).json({ error: 'Finding niet gevonden' });

      updateMaintenanceFindingStatus(id, 'ignored');
      res.json({ ok: true, id, status: 'ignored' });
    } catch (err) {
      logger.error({ err, id }, 'Ignore finding fout');
      res.status(500).json({ error: err.message });
    }
  });

  // ── POST /api/maintenance/reopen/:findingId ────────────────────────────────
  // Markeer finding als open (ongedaan maken van ignore)
  app.post('/api/maintenance/reopen/:findingId', (req, res) => {
    const id = parseInt(req.params.findingId, 10);
    if (!id) return res.status(400).json({ error: 'Ongeldig finding ID' });

    try {
      updateMaintenanceFindingStatus(id, 'open');
      res.json({ ok: true, id, status: 'open' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── GET /api/maintenance/summary ───────────────────────────────────────────
  // Samenvatting per scan type (voor dashboard-kaarten)
  app.get('/api/maintenance/summary', (req, res) => {
    res.setHeader('Cache-Control', 'no-cache');
    try {
      const summary = getMaintenanceSummary();
      const runs    = getMaintenanceRuns();
      const active  = {};
      for (const [type, info] of _activeScan) {
        active[type] = info;
      }
      // Voeg labels toe aan summary
      const enriched = {};
      for (const [type, def] of Object.entries(maintenanceSvc.SCAN_TYPES)) {
        enriched[type] = {
          label:       def.label,
          description: def.description,
          ...(summary[type] || { open: 0, fixed: 0, ignored: 0, error: 0, warning: 0, info: 0 }),
          active:      active[type] || null,
          lastRun:     runs.find(r => r.scan_type === type) || null,
        };
      }
      res.json({ summary: enriched });
    } catch (err) {
      logger.error({ err }, 'Summary fout');
      res.status(500).json({ error: err.message });
    }
  });

  // ── GET /api/maintenance/runs ──────────────────────────────────────────────
  // Geschiedenis van scan-runs
  app.get('/api/maintenance/runs', (req, res) => {
    res.setHeader('Cache-Control', 'no-cache');
    try {
      res.json({ runs: getMaintenanceRuns() });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
};
