// ── Automation Engine ─────────────────────────────────────────────────────────
// Beheert geplande en event-gedreven workflows.
// Trigger types : schedule | interval | event | daily | weekly
// Action types  : refresh_discovery | refresh_gaps | refresh_releases |
//                 generate_playlist | process_wishlist | scan_library |
//                 cache_discovery_rebuild | maintenance_scan | custom_endpoint
// Then actions  : notify_discord | notify_telegram | notify_pushbullet |
//                 fire_signal | play_chime
'use strict';

const cron   = require('node-cron');
const logger = require('../logger').child({ service: 'automation' });
const events = require('./events');
const { sendDiscord, sendTelegram, sendPushbullet } = require('./notifications');

// ── State ─────────────────────────────────────────────────────────────────────
let _db   = null;
let _deps = null;

/** Map<automationId, Array<{ type:'cron'|'interval'|'event', job, eventName?, intervalId? }>> */
const _activeJobs = new Map();

/** Map<automationId, timestamp> — laatste keer getriggerd via fire_signal */
const _signalCooldown = new Map();

const SIGNAL_COOLDOWN_MS = 5 * 60 * 1000; // 5 minuten
const MAX_CHAIN_DEPTH    = 5;

// ── Voorgebouwde pipelines ────────────────────────────────────────────────────
const PIPELINES = {
  'new-music': {
    name: 'Nieuwe Muziek Pipeline',
    description: 'Controleert nieuwe releases dagelijks en verwerkt de wishlist automatisch.',
    automations: [
      {
        name: 'Check Releases',
        trigger_type: 'daily',
        trigger_config: { time: '08:00' },
        action_type: 'refresh_releases',
        then_actions: [{ type: 'fire_signal', config: { signal: 'releases_done' } }],
        group_name: 'Nieuwe Muziek Pipeline',
      },
      {
        name: 'Download Nieuwe',
        trigger_type: 'event',
        trigger_config: { event: 'signal:releases_done' },
        action_type: 'process_wishlist',
        then_actions: [],
        group_name: 'Nieuwe Muziek Pipeline',
      },
    ],
  },
  'nightly': {
    name: 'Nachtelijke Operaties',
    description: 'Vernieuwt discovery, gaps en cache elke nacht.',
    automations: [
      {
        name: 'Refresh Discovery',
        trigger_type: 'schedule',
        trigger_config: { cron: '0 2 * * *' },
        action_type: 'refresh_discovery',
        then_actions: [],
        group_name: 'Nachtelijke Operaties',
      },
      {
        name: 'Check Gaps',
        trigger_type: 'schedule',
        trigger_config: { cron: '0 3 * * *' },
        action_type: 'refresh_gaps',
        then_actions: [],
        group_name: 'Nachtelijke Operaties',
      },
      {
        name: 'Rebuild Cache',
        trigger_type: 'schedule',
        trigger_config: { cron: '0 4 * * *' },
        action_type: 'cache_discovery_rebuild',
        then_actions: [],
        group_name: 'Nachtelijke Operaties',
      },
    ],
  },
  'full-maintenance': {
    name: 'Volledig Onderhoud',
    description: 'Wekelijkse library scan en maintenance check op zondag.',
    automations: [
      {
        name: 'Library Scan',
        trigger_type: 'weekly',
        trigger_config: { day: 'sun', time: '03:00' },
        action_type: 'scan_library',
        then_actions: [{ type: 'fire_signal', config: { signal: 'scan_done' } }],
        group_name: 'Volledig Onderhoud',
      },
      {
        name: 'Maintenance Check',
        trigger_type: 'event',
        trigger_config: { event: 'signal:scan_done' },
        action_type: 'maintenance_scan',
        then_actions: [],
        group_name: 'Volledig Onderhoud',
      },
    ],
  },
};

// ── Schema setup ──────────────────────────────────────────────────────────────
function _initSchema() {
  _db.exec(`
    CREATE TABLE IF NOT EXISTS automations (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      name           TEXT    NOT NULL,
      enabled        INTEGER DEFAULT 1,
      trigger_type   TEXT    NOT NULL,
      trigger_config TEXT    NOT NULL,
      action_type    TEXT    NOT NULL,
      action_config  TEXT,
      then_actions   TEXT,
      last_run       INTEGER,
      last_status    TEXT,
      last_error     TEXT,
      run_count      INTEGER DEFAULT 0,
      created_at     INTEGER DEFAULT (strftime('%s','now')),
      group_name     TEXT    DEFAULT 'Standaard'
    )
  `);
  _db.exec(`
    CREATE TABLE IF NOT EXISTS automation_log (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      automation_id INTEGER,
      trigger_type  TEXT,
      action_type   TEXT,
      status        TEXT,
      duration_ms   INTEGER,
      details       TEXT,
      created_at    INTEGER DEFAULT (strftime('%s','now')),
      FOREIGN KEY (automation_id) REFERENCES automations(id) ON DELETE CASCADE
    )
  `);
  _db.exec('CREATE INDEX IF NOT EXISTS idx_auto_log_aid ON automation_log(automation_id)');
  _db.exec('CREATE INDEX IF NOT EXISTS idx_auto_log_ts  ON automation_log(created_at)');
  logger.debug('Automation schema initialized');
}

// ── Prepared statements ───────────────────────────────────────────────────────
let _stmtGetAll, _stmtGetOne, _stmtInsert, _stmtUpdate, _stmtDelete,
    _stmtSetEnabled, _stmtUpdateRunResult, _stmtInsertLog, _stmtGetLog;

function _prepareStatements() {
  _stmtGetAll = _db.prepare('SELECT * FROM automations ORDER BY group_name, id');
  _stmtGetOne = _db.prepare('SELECT * FROM automations WHERE id = ?');
  _stmtInsert = _db.prepare(`
    INSERT INTO automations (name, enabled, trigger_type, trigger_config, action_type, action_config, then_actions, group_name)
    VALUES (@name, @enabled, @trigger_type, @trigger_config, @action_type, @action_config, @then_actions, @group_name)
  `);
  _stmtUpdate = _db.prepare(`
    UPDATE automations
    SET name=@name, enabled=@enabled, trigger_type=@trigger_type, trigger_config=@trigger_config,
        action_type=@action_type, action_config=@action_config, then_actions=@then_actions, group_name=@group_name
    WHERE id=@id
  `);
  _stmtDelete        = _db.prepare('DELETE FROM automations WHERE id = ?');
  _stmtSetEnabled    = _db.prepare('UPDATE automations SET enabled=? WHERE id=?');
  _stmtUpdateRunResult = _db.prepare(`
    UPDATE automations
    SET last_run=?, last_status=?, last_error=?, run_count=run_count+1
    WHERE id=?
  `);
  _stmtInsertLog = _db.prepare(`
    INSERT INTO automation_log (automation_id, trigger_type, action_type, status, duration_ms, details)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  _stmtGetLog = _db.prepare(`
    SELECT * FROM automation_log
    WHERE automation_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `);
}

// ── Trigger helpers ───────────────────────────────────────────────────────────

/** Zet een daily trigger om naar een cron expression. */
function _dailyToCron(time) {
  const [h, m] = (time || '08:00').split(':').map(Number);
  return `${m || 0} ${h || 8} * * *`;
}

/** Zet een weekly trigger om naar een cron expression. */
function _weeklyToCron(day, time) {
  const days = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
  const dow   = days[(day || 'sun').toLowerCase()] ?? 0;
  const [h, m] = (time || '03:00').split(':').map(Number);
  return `${m || 0} ${h || 3} * * ${dow}`;
}

/** Zet een interval config om naar milliseconden. */
function _intervalToMs(config) {
  const cfg = config || {};
  if (cfg.minutes) return cfg.minutes * 60_000;
  if (cfg.hours)   return cfg.hours   * 3_600_000;
  return 3_600_000; // default 1 uur
}

/** Geeft een leesbare omschrijving van de trigger. */
function describeTrigger(triggerType, config) {
  const cfg = config || {};
  switch (triggerType) {
    case 'schedule': return `Cron: ${cfg.cron || '—'}`;
    case 'interval': {
      if (cfg.hours)   return `Elke ${cfg.hours} uur`;
      if (cfg.minutes) return `Elke ${cfg.minutes} minuten`;
      return 'Interval';
    }
    case 'event':   return `Event: ${cfg.event || '—'}`;
    case 'daily':   return `Dagelijks om ${cfg.time || '08:00'}`;
    case 'weekly':  return `Wekelijks ${cfg.day || 'zon'} ${cfg.time || '03:00'}`;
    default:        return triggerType;
  }
}

/** Geeft een leesbare omschrijving van de actie. */
function describeAction(actionType, config) {
  const cfg = config || {};
  switch (actionType) {
    case 'refresh_discovery':      return 'Refresh Discovery';
    case 'refresh_gaps':           return 'Refresh Gaps';
    case 'refresh_releases':       return 'Refresh Releases';
    case 'generate_playlist':      return `Genereer playlist: ${cfg.type || 'daily_mix'}`;
    case 'process_wishlist':       return 'Verwerk Wishlist';
    case 'scan_library':           return 'Plex Library Scan';
    case 'cache_discovery_rebuild':return 'Herbouw Cache';
    case 'maintenance_scan':       return 'Maintenance Check';
    case 'custom_endpoint':        return `POST → ${cfg.url || '—'}`;
    default:                       return actionType;
  }
}

// ── Actie uitvoerder ──────────────────────────────────────────────────────────

/** Voert de gespecificeerde actie uit. Gooit een error als het mislukt. */
async function _executeAction(automation) {
  const cfg = _parseJSON(automation.action_config) || {};
  switch (automation.action_type) {

    case 'refresh_discovery': {
      const { refreshDiscover } = require('./discover');
      await refreshDiscover();
      break;
    }

    case 'refresh_gaps': {
      const { refreshGaps } = require('./gaps');
      await refreshGaps();
      break;
    }

    case 'refresh_releases': {
      const { refreshReleases } = require('./releases');
      await refreshReleases();
      break;
    }

    case 'generate_playlist': {
      const type   = cfg.type || 'daily_mix';
      const module = require('./playlists');
      const fnMap  = {
        daily_mix:          module.generateDailyMix,
        discovery_weekly:   module.generateDiscoveryWeekly,
        release_radar:      module.generateReleaseRadar,
        forgotten_favorites:module.generateForgottenFavorites,
        hidden_gems:        module.generateHiddenGems,
      };
      const fn = fnMap[type];
      if (!fn) throw new Error(`Onbekend playlist type: ${type}`);
      await fn();
      break;
    }

    case 'process_wishlist': {
      if (_deps && _deps.downloadOrchestrator) {
        await _deps.downloadOrchestrator.processWishlist();
      } else {
        logger.warn('downloadOrchestrator niet beschikbaar voor process_wishlist');
      }
      break;
    }

    case 'scan_library': {
      const { syncPlexLibrary } = require('./plex');
      await syncPlexLibrary(true);
      break;
    }

    case 'cache_discovery_rebuild': {
      const { rebuildAllCaches } = require('./cacheDiscovery');
      await rebuildAllCaches();
      break;
    }

    case 'maintenance_scan': {
      // Combineert een Plex sync met refresh gaps voor een volledige onderhoudsscan
      const { syncPlexLibrary } = require('./plex');
      const { refreshGaps }     = require('./gaps');
      await syncPlexLibrary(true);
      await refreshGaps();
      break;
    }

    case 'custom_endpoint': {
      if (!cfg.url) throw new Error('custom_endpoint vereist een url in action_config');
      const res = await fetch(cfg.url, {
        method: cfg.method || 'POST',
        headers: { 'Content-Type': 'application/json', ...(cfg.headers || {}) },
        body: cfg.body ? JSON.stringify(cfg.body) : undefined,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} van ${cfg.url}`);
      break;
    }

    default:
      throw new Error(`Onbekend action type: ${automation.action_type}`);
  }
}

// ── Then-actions ──────────────────────────────────────────────────────────────

/** Verwerkt alle then-actions na een succesvolle uitvoering. */
async function _executeThenActions(automation, chainDepth = 0) {
  const thenActions = _parseJSON(automation.then_actions) || [];
  for (const ta of thenActions) {
    try {
      await _executeThenAction(ta, automation, chainDepth);
    } catch (err) {
      logger.warn({ automationId: automation.id, thenAction: ta.type, err: err.message },
        'Then-action mislukt (niet fataal)');
    }
  }
}

async function _executeThenAction(thenAction, automation, chainDepth) {
  const cfg = thenAction.config || {};
  switch (thenAction.type) {

    case 'notify_discord': {
      const settings = _getNotificationSettings();
      const url = cfg.webhookUrl || settings.discord_webhook;
      if (!url) { logger.warn('Discord webhook URL niet geconfigureerd'); return; }
      const msg = cfg.message || `✅ Automation "${automation.name}" voltooid`;
      await sendDiscord(url, msg);
      break;
    }

    case 'notify_telegram': {
      const settings = _getNotificationSettings();
      const token  = cfg.botToken  || settings.telegram_bot_token;
      const chatId = cfg.chatId    || settings.telegram_chat_id;
      if (!token || !chatId) { logger.warn('Telegram config ontbreekt'); return; }
      const msg = cfg.message || `✅ Automation "${automation.name}" voltooid`;
      await sendTelegram(token, chatId, msg);
      break;
    }

    case 'notify_pushbullet': {
      const settings = _getNotificationSettings();
      const key = cfg.apiKey || settings.pushbullet_api_key;
      if (!key) { logger.warn('Pushbullet API key ontbreekt'); return; }
      await sendPushbullet(key, cfg.title || 'Automation', cfg.message || `"${automation.name}" voltooid`);
      break;
    }

    case 'fire_signal': {
      if (!cfg.signal) { logger.warn('fire_signal zonder signal naam'); return; }
      if (chainDepth >= MAX_CHAIN_DEPTH) {
        logger.warn({ automationId: automation.id, signal: cfg.signal, chainDepth },
          'Max signal chain depth bereikt — verdere signalen gestopt');
        return;
      }
      const eventName = `signal:${cfg.signal}`;
      logger.debug({ signal: cfg.signal, chainDepth }, 'Signal afgevuurd');
      events.emit(eventName, { sourceAutomationId: automation.id, chainDepth: chainDepth + 1 });
      break;
    }

    case 'play_chime': {
      // Emit een SSE-event dat de frontend kan oppikken
      events.emit('automation:chime', { automationId: automation.id, name: automation.name });
      break;
    }

    default:
      logger.warn({ type: thenAction.type }, 'Onbekend then-action type');
  }
}

function _getNotificationSettings() {
  try {
    const { getSettings } = require('../db');
    return getSettings('notifications') || {};
  } catch { return {}; }
}

// ── Uitvoering met logging ────────────────────────────────────────────────────

/**
 * Voert een automation volledig uit: actie + then-actions + logging.
 * @param {object|number} automationOrId - automation-row of id
 * @param {string} [triggerType] - hoe getriggerd (voor logging)
 * @param {number} [chainDepth]  - diepte in signaalketens
 */
async function runAutomation(automationOrId, triggerType = 'manual', chainDepth = 0) {
  const row = typeof automationOrId === 'number'
    ? _stmtGetOne.get(automationOrId)
    : automationOrId;

  if (!row) { logger.warn({ id: automationOrId }, 'Automation niet gevonden'); return; }
  if (!row.enabled) { logger.debug({ id: row.id }, 'Automation uitgeschakeld — overgeslagen'); return; }

  // Signal cooldown check
  if (triggerType === 'event' || triggerType.startsWith('signal')) {
    const lastTime = _signalCooldown.get(row.id) || 0;
    if (Date.now() - lastTime < SIGNAL_COOLDOWN_MS) {
      logger.debug({ id: row.id, name: row.name }, 'Automation in cooldown — overgeslagen');
      return;
    }
  }

  const startTime = Date.now();
  logger.info({ id: row.id, name: row.name, trigger: triggerType }, '▶ Automation starten');

  try {
    await _executeAction(row);
    const durationMs = Date.now() - startTime;

    // Sla resultaat op
    _stmtUpdateRunResult.run(Date.now(), 'success', null, row.id);
    _stmtInsertLog.run(row.id, triggerType, row.action_type, 'success', durationMs,
      JSON.stringify({ message: `${describeAction(row.action_type)} voltooid` }));

    // Update cooldown timestamp
    if (triggerType === 'event') _signalCooldown.set(row.id, Date.now());

    logger.info({ id: row.id, name: row.name, durationMs }, '✓ Automation voltooid');

    // Then-actions uitvoeren
    await _executeThenActions(row, chainDepth);

  } catch (err) {
    const durationMs = Date.now() - startTime;
    const errMsg = err.message || String(err);

    _stmtUpdateRunResult.run(Date.now(), 'error', errMsg, row.id);
    _stmtInsertLog.run(row.id, triggerType, row.action_type, 'error', durationMs,
      JSON.stringify({ error: errMsg }));

    logger.error({ id: row.id, name: row.name, err: errMsg, durationMs }, '✗ Automation mislukt');
  }
}

// ── Scheduling ────────────────────────────────────────────────────────────────

/** Stopt alle actieve jobs voor een automation-id. */
function _stopJobs(automationId) {
  const jobs = _activeJobs.get(automationId) || [];
  for (const j of jobs) {
    if (j.type === 'cron') {
      try { j.job.stop(); } catch {}
    } else if (j.type === 'interval') {
      clearInterval(j.intervalId);
    } else if (j.type === 'event') {
      try { events.off(j.eventName, j.handler); } catch {}
    }
  }
  _activeJobs.delete(automationId);
}

/** Start cron/interval/event-listener voor één automation-row. */
function _scheduleOne(row) {
  if (!row.enabled) return;

  _stopJobs(row.id);
  const jobs = [];
  const cfg  = _parseJSON(row.trigger_config) || {};

  switch (row.trigger_type) {
    case 'schedule': {
      const expression = cfg.cron;
      if (!expression || !cron.validate(expression)) {
        logger.warn({ id: row.id, expression }, 'Ongeldige cron expressie — niet gepland');
        return;
      }
      const job = cron.schedule(expression, () => runAutomation(row.id, 'schedule'), { timezone: 'Europe/Amsterdam' });
      jobs.push({ type: 'cron', job });
      logger.debug({ id: row.id, name: row.name, cron: expression }, 'Cron job gepland');
      break;
    }

    case 'daily': {
      const expression = _dailyToCron(cfg.time);
      const job = cron.schedule(expression, () => runAutomation(row.id, 'daily'), { timezone: 'Europe/Amsterdam' });
      jobs.push({ type: 'cron', job });
      logger.debug({ id: row.id, name: row.name, time: cfg.time, cron: expression }, 'Dagelijkse job gepland');
      break;
    }

    case 'weekly': {
      const expression = _weeklyToCron(cfg.day, cfg.time);
      const job = cron.schedule(expression, () => runAutomation(row.id, 'weekly'), { timezone: 'Europe/Amsterdam' });
      jobs.push({ type: 'cron', job });
      logger.debug({ id: row.id, name: row.name, day: cfg.day, time: cfg.time }, 'Wekelijkse job gepland');
      break;
    }

    case 'interval': {
      const ms = _intervalToMs(cfg);
      const intervalId = setInterval(() => runAutomation(row.id, 'interval'), ms);
      jobs.push({ type: 'interval', intervalId });
      logger.debug({ id: row.id, name: row.name, ms }, 'Interval job gepland');
      break;
    }

    case 'event': {
      const eventName = cfg.event;
      if (!eventName) { logger.warn({ id: row.id }, 'Event trigger zonder event naam'); return; }

      const handler = (payload = {}) => {
        const depth = typeof payload.chainDepth === 'number' ? payload.chainDepth : 0;
        runAutomation(row.id, 'event', depth);
      };
      events.on(eventName, handler);
      jobs.push({ type: 'event', eventName, handler });
      logger.debug({ id: row.id, name: row.name, event: eventName }, 'Event listener geregistreerd');
      break;
    }

    default:
      logger.warn({ id: row.id, trigger: row.trigger_type }, 'Onbekend trigger type');
  }

  if (jobs.length > 0) _activeJobs.set(row.id, jobs);
}

/** Laadt alle actieve automations uit de DB en start hun jobs. */
function _loadAndScheduleAll() {
  const rows = _stmtGetAll.all().filter(r => r.enabled);
  logger.info({ count: rows.length }, 'Automations laden en inplannen');
  for (const row of rows) _scheduleOne(row);
}

// ── Publieke API ──────────────────────────────────────────────────────────────

/**
 * Initialiseer de automation engine.
 * Aanroepen vanuit startup.js nadat deps volledig is samengesteld.
 */
function init(deps) {
  _deps = deps;
  const { getDb } = require('../db');
  _db = getDb();
  _initSchema();
  _prepareStatements();
  _loadAndScheduleAll();
  logger.info('✓ Automation Engine geïnitialiseerd');
}

/** Haal alle automations op (met trigger/actie-omschrijvingen). */
function getAll() {
  if (!_db) return [];
  return _stmtGetAll.all().map(_enrich);
}

/** Haal één automation op. */
function getById(id) {
  if (!_db) return null;
  const row = _stmtGetOne.get(id);
  return row ? _enrich(row) : null;
}

/** Maak een nieuwe automation aan. Geeft de nieuwe row terug. */
function create(data) {
  const row = _normalizeInput(data);
  const res = _stmtInsert.run(row);
  const newRow = _stmtGetOne.get(res.lastInsertRowid);
  _scheduleOne(newRow);
  logger.info({ id: newRow.id, name: newRow.name }, 'Automation aangemaakt');
  return _enrich(newRow);
}

/** Update een bestaande automation. Herstart de jobs. */
function update(id, data) {
  const existing = _stmtGetOne.get(id);
  if (!existing) throw new Error(`Automation ${id} niet gevonden`);
  const row = _normalizeInput({ ...existing, ...data, id });
  _stmtUpdate.run(row);
  const updated = _stmtGetOne.get(id);
  _stopJobs(id);
  if (updated.enabled) _scheduleOne(updated);
  logger.info({ id, name: updated.name }, 'Automation bijgewerkt');
  return _enrich(updated);
}

/** Verwijder een automation. */
function remove(id) {
  _stopJobs(id);
  _stmtDelete.run(id);
  logger.info({ id }, 'Automation verwijderd');
}

/** Zet enabled/disabled. */
function setEnabled(id, enabled) {
  _stmtSetEnabled.run(enabled ? 1 : 0, id);
  const row = _stmtGetOne.get(id);
  if (!row) return;
  _stopJobs(id);
  if (enabled) _scheduleOne(row);
  logger.info({ id, enabled }, 'Automation status gewijzigd');
}

/** Voer een automation direct uit (ongeacht schedule). */
async function runNow(id) {
  return runAutomation(id, 'manual');
}

/** Haal de execution log op. */
function getLog(automationId, limit = 50) {
  if (!_db) return [];
  return _stmtGetLog.all(automationId, limit);
}

/** Geeft alle beschikbare pipelines terug. */
function getPipelines() {
  return Object.entries(PIPELINES).map(([key, p]) => ({
    key,
    name: p.name,
    description: p.description,
    automationCount: p.automations.length,
  }));
}

/** Installeer een pipeline: maakt alle automations aan. */
function installPipeline(pipelineKey) {
  const pipeline = PIPELINES[pipelineKey];
  if (!pipeline) throw new Error(`Pipeline "${pipelineKey}" niet gevonden`);

  const created = [];
  for (const automation of pipeline.automations) {
    try {
      const newAuto = create(automation);
      created.push(newAuto);
    } catch (err) {
      logger.error({ pipelineKey, automation: automation.name, err: err.message },
        'Fout bij installeren pipeline automation');
    }
  }
  logger.info({ pipelineKey, created: created.length }, 'Pipeline geïnstalleerd');
  return created;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function _parseJSON(str) {
  if (!str) return null;
  if (typeof str === 'object') return str;
  try { return JSON.parse(str); } catch { return null; }
}

function _normalizeInput(data) {
  return {
    id:             data.id,
    name:           String(data.name || 'Naamloze automation').slice(0, 200),
    enabled:        data.enabled !== undefined ? (data.enabled ? 1 : 0) : 1,
    trigger_type:   data.trigger_type || 'schedule',
    trigger_config: typeof data.trigger_config === 'string'
      ? data.trigger_config
      : JSON.stringify(data.trigger_config || {}),
    action_type:    data.action_type || 'refresh_discovery',
    action_config:  data.action_config
      ? (typeof data.action_config === 'string' ? data.action_config : JSON.stringify(data.action_config))
      : null,
    then_actions:   data.then_actions
      ? (typeof data.then_actions === 'string' ? data.then_actions : JSON.stringify(data.then_actions))
      : '[]',
    group_name:     String(data.group_name || 'Standaard').slice(0, 100),
  };
}

function _enrich(row) {
  const trigCfg = _parseJSON(row.trigger_config) || {};
  const actCfg  = _parseJSON(row.action_config)  || {};
  return {
    ...row,
    enabled:          row.enabled === 1,
    trigger_config:   trigCfg,
    action_config:    actCfg,
    then_actions:     _parseJSON(row.then_actions) || [],
    trigger_label:    describeTrigger(row.trigger_type, trigCfg),
    action_label:     describeAction(row.action_type, actCfg),
    is_running:       false, // uitbreidbaar met in-memory running state
  };
}

module.exports = {
  init,
  getAll,
  getById,
  create,
  update,
  remove,
  setEnabled,
  runNow,
  getLog,
  getPipelines,
  installPipeline,
  describeTrigger,
  describeAction,
  PIPELINES,
};
