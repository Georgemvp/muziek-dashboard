// ── Automations View ──────────────────────────────────────────────────────────
// Beheer geplande en event-gedreven workflows.

import { apiFetch } from '../api.js';
import { esc } from '../helpers.js';

// ── Constanten ────────────────────────────────────────────────────────────────
const TRIGGER_TYPES = [
  { value: 'schedule', label: 'Cron expressie' },
  { value: 'daily',    label: 'Dagelijks tijdstip' },
  { value: 'weekly',   label: 'Wekelijks tijdstip' },
  { value: 'interval', label: 'Interval (elke X tijd)' },
  { value: 'event',    label: 'Event (event bus)' },
];

const ACTION_TYPES = [
  { value: 'refresh_discovery',      label: 'Refresh Discovery' },
  { value: 'refresh_gaps',           label: 'Refresh Gaps' },
  { value: 'refresh_releases',       label: 'Refresh Releases' },
  { value: 'generate_playlist',      label: 'Genereer Playlist' },
  { value: 'process_wishlist',       label: 'Verwerk Wishlist' },
  { value: 'scan_library',           label: 'Plex Library Scan' },
  { value: 'cache_discovery_rebuild','label': 'Herbouw Cache Discovery' },
  { value: 'maintenance_scan',       label: 'Maintenance Scan' },
  { value: 'custom_endpoint',        label: 'Custom API Endpoint' },
];

const THEN_ACTION_TYPES = [
  { value: 'notify_discord',   label: 'Discord notificatie' },
  { value: 'notify_telegram',  label: 'Telegram notificatie' },
  { value: 'notify_pushbullet',label: 'Pushbullet notificatie' },
  { value: 'fire_signal',      label: 'Vuur signaal af (chain)' },
  { value: 'play_chime',       label: 'Speel chime af (frontend)' },
];

const PLAYLIST_TYPES = [
  { value: 'daily_mix',           label: 'Daily Mix' },
  { value: 'discovery_weekly',    label: 'Discovery Weekly' },
  { value: 'release_radar',       label: 'Release Radar' },
  { value: 'forgotten_favorites', label: 'Forgotten Favorites' },
  { value: 'hidden_gems',         label: 'Hidden Gems' },
];

const WEEKDAYS = [
  { value: 'mon', label: 'Maandag' },
  { value: 'tue', label: 'Dinsdag' },
  { value: 'wed', label: 'Woensdag' },
  { value: 'thu', label: 'Donderdag' },
  { value: 'fri', label: 'Vrijdag' },
  { value: 'sat', label: 'Zaterdag' },
  { value: 'sun', label: 'Zondag' },
];

// ── State ─────────────────────────────────────────────────────────────────────
let _automations  = [];
let _pipelines    = [];
let _container    = null;
let _editingId    = null;
let _runningIds   = new Set();

// ── Main render ───────────────────────────────────────────────────────────────
export async function loadAutomations(container) {
  _container = container;
  _container.innerHTML = `
    <div class="auto-view">
      <div class="auto-header">
        <div class="auto-header-left">
          <h1 class="auto-title">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>
            Automatisering
          </h1>
          <span class="auto-count" id="auto-count">0 automations</span>
        </div>
        <div class="auto-header-actions">
          <div class="auto-pipelines-wrapper">
            <button class="btn btn-secondary" id="auto-pipelines-btn">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
              Pipelines
            </button>
            <div class="auto-pipelines-dropdown" id="auto-pipelines-dropdown" hidden></div>
          </div>
          <button class="btn btn-primary" id="auto-new-btn">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nieuw
          </button>
        </div>
      </div>

      <div class="auto-list" id="auto-list">
        <div class="auto-loading">
          <div class="spinner"></div>
          <span>Automations laden…</span>
        </div>
      </div>
    </div>
  `;

  _bindHeaderEvents();
  await _loadData();
}

async function _loadData() {
  try {
    const [autoRes, pipeRes] = await Promise.all([
      apiFetch('/api/automations'),
      apiFetch('/api/automations/pipelines'),
    ]);
    _automations = autoRes.automations || [];
    _pipelines   = pipeRes.pipelines   || [];
    _renderList();
    _renderPipelinesDropdown();
    document.getElementById('auto-count').textContent =
      `${_automations.length} automation${_automations.length !== 1 ? 's' : ''}`;
  } catch (err) {
    document.getElementById('auto-list').innerHTML =
      `<div class="auto-error">⚠ Kon automations niet laden: ${esc(err.message)}</div>`;
  }
}

// ── Lijst ─────────────────────────────────────────────────────────────────────
function _renderList() {
  const list = document.getElementById('auto-list');
  if (!_automations.length) {
    list.innerHTML = `
      <div class="auto-empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity=".3"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>
        <p>Geen automations gevonden.</p>
        <p>Maak er een aan of installeer een pipeline.</p>
      </div>
    `;
    return;
  }

  // Groepeer op group_name
  const groups = {};
  for (const a of _automations) {
    const g = a.group_name || 'Standaard';
    if (!groups[g]) groups[g] = [];
    groups[g].push(a);
  }

  list.innerHTML = Object.entries(groups).map(([groupName, items]) => `
    <div class="auto-group">
      <div class="auto-group-header">${esc(groupName)}</div>
      <div class="auto-group-items">
        ${items.map(_renderCard).join('')}
      </div>
    </div>
  `).join('');

  // Bind card events
  list.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', _handleCardAction);
  });
}

function _renderCard(a) {
  const lastRun = a.last_run
    ? `<span class="auto-meta-value ${a.last_status === 'error' ? 'auto-meta-error' : 'auto-meta-ok'}">${_formatDate(a.last_run)}</span>`
    : `<span class="auto-meta-value auto-meta-muted">Nog niet gedraaid</span>`;

  const statusDot = a.enabled
    ? `<span class="auto-status-dot auto-status-enabled" title="Ingeschakeld"></span>`
    : `<span class="auto-status-dot auto-status-disabled" title="Uitgeschakeld"></span>`;

  const isRunning = _runningIds.has(a.id);

  return `
    <div class="auto-card ${a.enabled ? '' : 'auto-card-disabled'}" data-id="${a.id}">
      <div class="auto-card-main">
        <div class="auto-card-top">
          ${statusDot}
          <span class="auto-card-name">${esc(a.name)}</span>
          <label class="auto-toggle" title="${a.enabled ? 'Uitschakelen' : 'Inschakelen'}">
            <input type="checkbox" class="auto-toggle-input" ${a.enabled ? 'checked' : ''}
              data-action="toggle" data-id="${a.id}">
            <span class="auto-toggle-track"></span>
          </label>
        </div>

        <div class="auto-card-meta">
          <div class="auto-meta-row">
            <span class="auto-meta-label">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              Trigger
            </span>
            <span class="auto-meta-value">${esc(a.trigger_label || a.trigger_type)}</span>
          </div>
          <div class="auto-meta-row">
            <span class="auto-meta-label">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Actie
            </span>
            <span class="auto-meta-value">${esc(a.action_label || a.action_type)}</span>
          </div>
          <div class="auto-meta-row">
            <span class="auto-meta-label">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-.08-8.01"/></svg>
              Laatste run
            </span>
            ${lastRun}
          </div>
          ${a.then_actions && a.then_actions.length ? `
          <div class="auto-meta-row">
            <span class="auto-meta-label">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/></svg>
              Dan
            </span>
            <span class="auto-meta-value">${a.then_actions.map(t => _thenLabel(t)).join(', ')}</span>
          </div>` : ''}
        </div>
      </div>

      <div class="auto-card-actions">
        <button class="auto-btn auto-btn-run ${isRunning ? 'auto-btn-running' : ''}"
          data-action="run" data-id="${a.id}" title="Nu uitvoeren" ${isRunning ? 'disabled' : ''}>
          ${isRunning
            ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>`
            : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>`
          }
          ${isRunning ? 'Loopt…' : 'Draai nu'}
        </button>
        <button class="auto-btn" data-action="log" data-id="${a.id}" title="Log bekijken">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          Log
        </button>
        <button class="auto-btn" data-action="edit" data-id="${a.id}" title="Bewerken">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          Bewerk
        </button>
        <button class="auto-btn auto-btn-danger" data-action="delete" data-id="${a.id}" title="Verwijderen">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
        </button>
      </div>
    </div>
  `;
}

// ── Card events ───────────────────────────────────────────────────────────────
async function _handleCardAction(e) {
  const btn    = e.currentTarget;
  const action = btn.dataset.action;
  const id     = Number(btn.dataset.id);

  if (action === 'toggle') {
    const checked = btn.checked;
    try {
      await apiFetch(`/api/automations/${id}/toggle`, { method: 'POST' });
      await _loadData();
    } catch (err) {
      alert(`Fout: ${err.message}`);
      btn.checked = !checked;
    }
    return;
  }

  if (action === 'run') {
    _runningIds.add(id);
    _renderList();
    try {
      await apiFetch(`/api/automations/${id}/run`, { method: 'POST' });
      // Wacht even en ververs dan
      setTimeout(async () => {
        _runningIds.delete(id);
        await _loadData();
      }, 2000);
    } catch (err) {
      _runningIds.delete(id);
      _renderList();
      alert(`Fout: ${err.message}`);
    }
    return;
  }

  if (action === 'edit') {
    _editingId = id;
    const auto = _automations.find(a => a.id === id);
    _openModal(auto);
    return;
  }

  if (action === 'log') {
    await _openLogModal(id);
    return;
  }

  if (action === 'delete') {
    const auto = _automations.find(a => a.id === id);
    if (!confirm(`Automation "${auto?.name}" verwijderen?`)) return;
    try {
      await apiFetch(`/api/automations/${id}`, { method: 'DELETE' });
      await _loadData();
    } catch (err) {
      alert(`Fout: ${err.message}`);
    }
    return;
  }
}

// ── Header events ─────────────────────────────────────────────────────────────
function _bindHeaderEvents() {
  document.getElementById('auto-new-btn').addEventListener('click', () => {
    _editingId = null;
    _openModal(null);
  });

  document.getElementById('auto-pipelines-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    const dd = document.getElementById('auto-pipelines-dropdown');
    dd.hidden = !dd.hidden;
  });

  document.addEventListener('click', () => {
    const dd = document.getElementById('auto-pipelines-dropdown');
    if (dd) dd.hidden = true;
  }, { capture: false });
}

function _renderPipelinesDropdown() {
  const dd = document.getElementById('auto-pipelines-dropdown');
  if (!dd) return;
  dd.innerHTML = _pipelines.map(p => `
    <button class="auto-pipeline-item" data-pipeline="${esc(p.key)}">
      <span class="auto-pipeline-name">${esc(p.name)}</span>
      <span class="auto-pipeline-desc">${esc(p.description || '')}</span>
      <span class="auto-pipeline-count">${p.automationCount} automation${p.automationCount !== 1 ? 's' : ''}</span>
    </button>
  `).join('');

  dd.querySelectorAll('[data-pipeline]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      dd.hidden = true;
      const key = btn.dataset.pipeline;
      const pipeline = _pipelines.find(p => p.key === key);
      if (!confirm(`Pipeline "${pipeline?.name}" installeren?\nDit maakt ${pipeline?.automationCount} automation(s) aan.`)) return;
      try {
        const res = await apiFetch(`/api/automations/pipelines/${key}/install`, { method: 'POST' });
        await _loadData();
        alert(`✓ ${res.installed?.length || 0} automation(s) geïnstalleerd!`);
      } catch (err) {
        alert(`Fout bij installeren: ${err.message}`);
      }
    });
  });
}

// ── Nieuw/Bewerk modal ────────────────────────────────────────────────────────
function _openModal(automation) {
  const isEdit = !!automation;
  const title  = isEdit ? `Bewerk: ${automation.name}` : 'Nieuwe Automation';

  const thenActions = automation?.then_actions || [];

  const html = `
    <div class="auto-modal-backdrop" id="auto-modal-backdrop">
      <div class="auto-modal" role="dialog" aria-modal="true" aria-label="${esc(title)}">
        <div class="auto-modal-header">
          <h2 class="auto-modal-title">${esc(title)}</h2>
          <button class="auto-modal-close" id="auto-modal-close" aria-label="Sluiten">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div class="auto-modal-body">
          <div class="auto-form-group">
            <label class="auto-label">Naam</label>
            <input type="text" class="auto-input" id="auto-field-name"
              placeholder="Bijv. Nachtelijke sync" maxlength="200"
              value="${esc(automation?.name || '')}">
          </div>

          <div class="auto-form-group">
            <label class="auto-label">Groep</label>
            <input type="text" class="auto-input" id="auto-field-group"
              placeholder="Standaard" maxlength="100"
              value="${esc(automation?.group_name || 'Standaard')}">
          </div>

          <div class="auto-form-row">
            <div class="auto-form-group auto-form-half">
              <label class="auto-label">Trigger type</label>
              <select class="auto-select" id="auto-field-trigger-type">
                ${TRIGGER_TYPES.map(t => `
                  <option value="${t.value}" ${automation?.trigger_type === t.value ? 'selected' : ''}>
                    ${t.label}
                  </option>
                `).join('')}
              </select>
            </div>
            <div class="auto-form-group auto-form-half">
              <label class="auto-label">Actie type</label>
              <select class="auto-select" id="auto-field-action-type">
                ${ACTION_TYPES.map(t => `
                  <option value="${t.value}" ${automation?.action_type === t.value ? 'selected' : ''}>
                    ${t.label}
                  </option>
                `).join('')}
              </select>
            </div>
          </div>

          <!-- Trigger config (dynamisch) -->
          <div id="auto-trigger-config"></div>

          <!-- Actie config (dynamisch) -->
          <div id="auto-action-config"></div>

          <!-- Then-actions -->
          <div class="auto-form-group">
            <label class="auto-label">
              Dan uitvoeren
              <span class="auto-label-hint">(max 3)</span>
            </label>
            <div id="auto-then-actions">
              ${thenActions.slice(0, 3).map((ta, i) => _renderThenActionRow(ta, i)).join('')}
            </div>
            <button class="auto-btn-add-then" id="auto-add-then-btn" type="button"
              ${thenActions.length >= 3 ? 'disabled' : ''}>
              + Voeg dan-actie toe
            </button>
          </div>
        </div>

        <div class="auto-modal-footer">
          <button class="btn btn-secondary" id="auto-modal-cancel">Annuleer</button>
          <button class="btn btn-primary" id="auto-modal-save">
            ${isEdit ? 'Opslaan' : 'Aanmaken'}
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', html);

  // Render initial configs
  _renderTriggerConfig(automation?.trigger_type || 'schedule', automation?.trigger_config || {});
  _renderActionConfig(automation?.action_type || 'refresh_discovery', automation?.action_config || {});

  // Bind events
  document.getElementById('auto-field-trigger-type').addEventListener('change', (e) => {
    _renderTriggerConfig(e.target.value, {});
  });
  document.getElementById('auto-field-action-type').addEventListener('change', (e) => {
    _renderActionConfig(e.target.value, {});
  });
  document.getElementById('auto-add-then-btn').addEventListener('click', _addThenActionRow);
  document.getElementById('auto-modal-close').addEventListener('click', _closeModal);
  document.getElementById('auto-modal-cancel').addEventListener('click', _closeModal);
  document.getElementById('auto-modal-save').addEventListener('click', _saveModal);
  document.getElementById('auto-modal-backdrop').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) _closeModal();
  });

  // Bind remove-then-action buttons
  _bindThenActionEvents();
}

function _renderTriggerConfig(type, cfg) {
  const el = document.getElementById('auto-trigger-config');
  if (!el) return;

  switch (type) {
    case 'schedule':
      el.innerHTML = `
        <div class="auto-form-group">
          <label class="auto-label">Cron expressie</label>
          <input type="text" class="auto-input" id="auto-tc-cron"
            placeholder="0 3 * * * (elke nacht om 3:00)"
            value="${esc(cfg.cron || '')}">
          <span class="auto-hint">min uur dag maand weekdag — bijv. <code>0 3 * * *</code></span>
        </div>
      `;
      break;

    case 'daily':
      el.innerHTML = `
        <div class="auto-form-group">
          <label class="auto-label">Tijdstip</label>
          <input type="time" class="auto-input auto-input-time" id="auto-tc-time"
            value="${esc(cfg.time || '08:00')}">
        </div>
      `;
      break;

    case 'weekly':
      el.innerHTML = `
        <div class="auto-form-row">
          <div class="auto-form-group auto-form-half">
            <label class="auto-label">Dag</label>
            <select class="auto-select" id="auto-tc-day">
              ${WEEKDAYS.map(d => `<option value="${d.value}" ${cfg.day === d.value ? 'selected' : ''}>${d.label}</option>`).join('')}
            </select>
          </div>
          <div class="auto-form-group auto-form-half">
            <label class="auto-label">Tijdstip</label>
            <input type="time" class="auto-input auto-input-time" id="auto-tc-time"
              value="${esc(cfg.time || '03:00')}">
          </div>
        </div>
      `;
      break;

    case 'interval':
      el.innerHTML = `
        <div class="auto-form-row">
          <div class="auto-form-group auto-form-half">
            <label class="auto-label">Aantal</label>
            <input type="number" class="auto-input" id="auto-tc-amount" min="1"
              value="${esc(cfg.hours ? String(cfg.hours) : cfg.minutes ? String(cfg.minutes) : '1')}">
          </div>
          <div class="auto-form-group auto-form-half">
            <label class="auto-label">Eenheid</label>
            <select class="auto-select" id="auto-tc-unit">
              <option value="hours"   ${cfg.hours   ? 'selected' : ''}>Uur</option>
              <option value="minutes" ${cfg.minutes ? 'selected' : ''}>Minuten</option>
            </select>
          </div>
        </div>
      `;
      break;

    case 'event':
      el.innerHTML = `
        <div class="auto-form-group">
          <label class="auto-label">Event naam</label>
          <input type="text" class="auto-input" id="auto-tc-event"
            placeholder="download:complete of signal:mijn_signaal"
            value="${esc(cfg.event || '')}">
          <span class="auto-hint">Beschikbare events: <code>download:complete</code>, <code>signal:naam</code></span>
        </div>
      `;
      break;

    default:
      el.innerHTML = '';
  }
}

function _renderActionConfig(type, cfg) {
  const el = document.getElementById('auto-action-config');
  if (!el) return;

  switch (type) {
    case 'generate_playlist':
      el.innerHTML = `
        <div class="auto-form-group">
          <label class="auto-label">Playlist type</label>
          <select class="auto-select" id="auto-ac-playlist-type">
            ${PLAYLIST_TYPES.map(p => `<option value="${p.value}" ${cfg.type === p.value ? 'selected' : ''}>${p.label}</option>`).join('')}
          </select>
        </div>
      `;
      break;

    case 'custom_endpoint':
      el.innerHTML = `
        <div class="auto-form-group">
          <label class="auto-label">URL</label>
          <input type="url" class="auto-input" id="auto-ac-url"
            placeholder="http://localhost:8080/webhook"
            value="${esc(cfg.url || '')}">
        </div>
        <div class="auto-form-row">
          <div class="auto-form-group auto-form-half">
            <label class="auto-label">Methode</label>
            <select class="auto-select" id="auto-ac-method">
              <option value="POST" ${cfg.method === 'POST' || !cfg.method ? 'selected' : ''}>POST</option>
              <option value="GET"  ${cfg.method === 'GET' ? 'selected' : ''}>GET</option>
              <option value="PUT"  ${cfg.method === 'PUT' ? 'selected' : ''}>PUT</option>
            </select>
          </div>
        </div>
      `;
      break;

    default:
      el.innerHTML = '';
  }
}

function _renderThenActionRow(ta, index) {
  const cfg = ta.config || {};
  return `
    <div class="auto-then-row" data-then-index="${index}">
      <select class="auto-select auto-then-type" data-then-index="${index}">
        ${THEN_ACTION_TYPES.map(t => `<option value="${t.value}" ${ta.type === t.value ? 'selected' : ''}>${t.label}</option>`).join('')}
      </select>
      <div class="auto-then-config" data-then-index="${index}">
        ${_renderThenConfig(ta.type, cfg)}
      </div>
      <button class="auto-btn-remove-then" data-then-index="${index}" type="button" title="Verwijder">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  `;
}

function _renderThenConfig(type, cfg) {
  switch (type) {
    case 'notify_discord':
      return `<input type="url" class="auto-input auto-then-input" placeholder="Webhook URL (leeg = globale instelling)" value="${esc(cfg.webhookUrl || '')}">
              <input type="text" class="auto-input auto-then-input" placeholder="Bericht (optioneel)" value="${esc(cfg.message || '')}">`;
    case 'notify_telegram':
      return `<input type="text" class="auto-input auto-then-input" placeholder="Bot Token (leeg = globale instelling)" value="${esc(cfg.botToken || '')}">
              <input type="text" class="auto-input auto-then-input" placeholder="Chat ID" value="${esc(cfg.chatId || '')}">`;
    case 'notify_pushbullet':
      return `<input type="text" class="auto-input auto-then-input" placeholder="API Key (leeg = globale instelling)" value="${esc(cfg.apiKey || '')}">`;
    case 'fire_signal':
      return `<input type="text" class="auto-input auto-then-input" placeholder="Signaal naam (bijv. mijn_signaal)" value="${esc(cfg.signal || '')}">`;
    default:
      return '';
  }
}

function _addThenActionRow() {
  const container = document.getElementById('auto-then-actions');
  const existing  = container.querySelectorAll('.auto-then-row').length;
  if (existing >= 3) return;

  const index = existing;
  container.insertAdjacentHTML('beforeend', _renderThenActionRow({ type: 'notify_discord', config: {} }, index));

  // Bind select change for new row
  const newRow = container.querySelector(`[data-then-index="${index}"]`);
  const sel    = newRow.querySelector('.auto-then-type');
  sel.addEventListener('change', () => {
    newRow.querySelector('.auto-then-config').innerHTML = _renderThenConfig(sel.value, {});
  });

  const addBtn = document.getElementById('auto-add-then-btn');
  if (container.querySelectorAll('.auto-then-row').length >= 3) addBtn.disabled = true;

  _bindThenActionEvents();
}

function _bindThenActionEvents() {
  document.querySelectorAll('.auto-btn-remove-then').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.currentTarget.closest('.auto-then-row').remove();
      const addBtn = document.getElementById('auto-add-then-btn');
      if (addBtn) addBtn.disabled = false;
    });
  });

  document.querySelectorAll('.auto-then-type').forEach(sel => {
    sel.addEventListener('change', () => {
      const idx = sel.dataset.thenIndex;
      const cfgEl = document.querySelector(`.auto-then-config[data-then-index="${idx}"]`);
      if (cfgEl) cfgEl.innerHTML = _renderThenConfig(sel.value, {});
    });
  });
}

function _collectTriggerConfig(type) {
  switch (type) {
    case 'schedule': return { cron: document.getElementById('auto-tc-cron')?.value.trim() || '' };
    case 'daily':    return { time: document.getElementById('auto-tc-time')?.value || '08:00' };
    case 'weekly':   return {
      day:  document.getElementById('auto-tc-day')?.value  || 'sun',
      time: document.getElementById('auto-tc-time')?.value || '03:00',
    };
    case 'interval': {
      const amount = Number(document.getElementById('auto-tc-amount')?.value) || 1;
      const unit   = document.getElementById('auto-tc-unit')?.value || 'hours';
      return { [unit]: amount };
    }
    case 'event':    return { event: document.getElementById('auto-tc-event')?.value.trim() || '' };
    default: return {};
  }
}

function _collectActionConfig(type) {
  switch (type) {
    case 'generate_playlist': return { type: document.getElementById('auto-ac-playlist-type')?.value || 'daily_mix' };
    case 'custom_endpoint':   return {
      url:    document.getElementById('auto-ac-url')?.value.trim() || '',
      method: document.getElementById('auto-ac-method')?.value || 'POST',
    };
    default: return {};
  }
}

function _collectThenActions() {
  const rows = document.querySelectorAll('.auto-then-row');
  const result = [];
  rows.forEach(row => {
    const type   = row.querySelector('.auto-then-type')?.value;
    const inputs = row.querySelectorAll('.auto-then-input');
    const config = {};
    switch (type) {
      case 'notify_discord':    config.webhookUrl = inputs[0]?.value; config.message = inputs[1]?.value; break;
      case 'notify_telegram':   config.botToken = inputs[0]?.value; config.chatId = inputs[1]?.value; break;
      case 'notify_pushbullet': config.apiKey = inputs[0]?.value; break;
      case 'fire_signal':       config.signal = inputs[0]?.value; break;
    }
    if (type) result.push({ type, config });
  });
  return result;
}

async function _saveModal() {
  const name        = document.getElementById('auto-field-name')?.value.trim();
  const groupName   = document.getElementById('auto-field-group')?.value.trim() || 'Standaard';
  const triggerType = document.getElementById('auto-field-trigger-type')?.value;
  const actionType  = document.getElementById('auto-field-action-type')?.value;

  if (!name) { alert('Naam is verplicht'); return; }

  const body = {
    name,
    group_name:     groupName,
    trigger_type:   triggerType,
    trigger_config: _collectTriggerConfig(triggerType),
    action_type:    actionType,
    action_config:  _collectActionConfig(actionType),
    then_actions:   _collectThenActions(),
    enabled:        true,
  };

  try {
    if (_editingId) {
      await apiFetch(`/api/automations/${_editingId}`, { method: 'PUT', body: JSON.stringify(body) });
    } else {
      await apiFetch('/api/automations', { method: 'POST', body: JSON.stringify(body) });
    }
    _closeModal();
    await _loadData();
  } catch (err) {
    alert(`Opslaan mislukt: ${err.message}`);
  }
}

function _closeModal() {
  document.getElementById('auto-modal-backdrop')?.remove();
  _editingId = null;
}

// ── Log modal ─────────────────────────────────────────────────────────────────
async function _openLogModal(automationId) {
  const auto = _automations.find(a => a.id === automationId);
  let logEntries = [];
  try {
    const res = await apiFetch(`/api/automations/${automationId}/log?limit=30`);
    logEntries = res.log || [];
  } catch { /* ok */ }

  const html = `
    <div class="auto-modal-backdrop" id="auto-log-modal-backdrop">
      <div class="auto-modal auto-modal-log" role="dialog" aria-modal="true">
        <div class="auto-modal-header">
          <h2 class="auto-modal-title">Log: ${esc(auto?.name || `#${automationId}`)}</h2>
          <button class="auto-modal-close" id="auto-log-modal-close" aria-label="Sluiten">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="auto-modal-body">
          ${logEntries.length === 0
            ? '<div class="auto-empty" style="padding:2rem;">Geen log entries gevonden.</div>'
            : `<div class="auto-log-list">
                ${logEntries.map(e => {
                  const det = typeof e.details === 'string' ? (() => { try { return JSON.parse(e.details); } catch { return {}; } })() : (e.details || {});
                  return `
                    <div class="auto-log-row auto-log-${e.status}">
                      <span class="auto-log-status">${e.status === 'success' ? '✓' : '✗'}</span>
                      <span class="auto-log-time">${_formatDate(e.created_at * 1000)}</span>
                      <span class="auto-log-trigger">${esc(e.trigger_type || '—')}</span>
                      <span class="auto-log-action">${esc(e.action_type || '—')}</span>
                      <span class="auto-log-dur">${e.duration_ms ? `${e.duration_ms}ms` : '—'}</span>
                      ${det.error ? `<span class="auto-log-error">${esc(det.error)}</span>` : ''}
                    </div>
                  `;
                }).join('')}
              </div>`
          }
        </div>
        <div class="auto-modal-footer">
          <button class="btn btn-secondary" id="auto-log-modal-close-btn">Sluiten</button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', html);
  document.getElementById('auto-log-modal-close').addEventListener('click', () =>
    document.getElementById('auto-log-modal-backdrop')?.remove());
  document.getElementById('auto-log-modal-close-btn').addEventListener('click', () =>
    document.getElementById('auto-log-modal-backdrop')?.remove());
  document.getElementById('auto-log-modal-backdrop').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) document.getElementById('auto-log-modal-backdrop')?.remove();
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function _formatDate(ts) {
  if (!ts) return '—';
  const d = new Date(ts > 1e12 ? ts : ts * 1000);
  return d.toLocaleString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function _thenLabel(ta) {
  const map = { notify_discord: '🔔 Discord', notify_telegram: '🔔 Telegram', notify_pushbullet: '🔔 Pushbullet', fire_signal: '⚡ Signaal', play_chime: '🎵 Chime' };
  return map[ta.type] || ta.type;
}
