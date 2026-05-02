// ── View: Library Maintenance Suite ──────────────────────────────────────────
// Dashboard met 10 scan-typen, findings-tabellen, fix/negeer knoppen.

import { apiFetch } from '../api.js';
import { esc } from '../helpers.js';
import { state } from '../state.js';

// ── Constanten ────────────────────────────────────────────────────────────────
const SCAN_LABELS = {
  dead_files:         'Dead Files',
  orphan_files:       'Orphan Files',
  duplicates:         'Duplicaten',
  metadata_gaps:      'Metadata Gaps',
  album_completeness: 'Album Compleetheid',
  missing_covers:     'Ontbrekende Covers',
  fake_lossless:      'Fake Lossless',
  track_numbers:      'Tracknummers',
  mbid_mismatch:      'MBID Mismatch',
  empty_folders:      'Lege Mappen',
};

const SCAN_ICONS = {
  dead_files:         '💀',
  orphan_files:       '👻',
  duplicates:         '📋',
  metadata_gaps:      '🏷️',
  album_completeness: '💿',
  missing_covers:     '🖼️',
  fake_lossless:      '🎭',
  track_numbers:      '🔢',
  mbid_mismatch:      '🔗',
  empty_folders:      '📁',
};

const SEVERITY_COLORS = {
  error:   '#e53e3e',
  warning: '#dd6b20',
  info:    '#3182ce',
};

// ── State ────────────────────────────────────────────────────────────────────
let _summary     = {};
let _findings    = {};    // scanType → findings[]
let _expanded    = new Set();
let _pollTimer   = null;
let _filterStatus = 'open'; // 'open' | 'fixed' | 'ignored' | 'all'

// ── Helpers ───────────────────────────────────────────────────────────────────
function cardColor(openCount) {
  if (openCount === 0)   return 'var(--color-success, #38a169)';
  if (openCount <= 10)   return 'var(--color-warning, #dd6b20)';
  return 'var(--color-danger, #e53e3e)';
}

function severityBadge(severity) {
  const color = SEVERITY_COLORS[severity] || '#718096';
  return `<span class="maint-severity" style="background:${color}">${esc(severity)}</span>`;
}

function statusBadge(status) {
  const map = { open: '#3182ce', fixed: '#38a169', ignored: '#718096' };
  const color = map[status] || '#718096';
  return `<span class="maint-status-badge" style="background:${color}">${esc(status)}</span>`;
}

function relTime(ts) {
  if (!ts) return '—';
  const secs = Math.floor((Date.now() / 1000) - ts);
  if (secs < 60)    return 'zojuist';
  if (secs < 3600)  return `${Math.floor(secs/60)}m geleden`;
  if (secs < 86400) return `${Math.floor(secs/3600)}u geleden`;
  return `${Math.floor(secs/86400)}d geleden`;
}

function durationLabel(ms) {
  if (!ms) return '';
  if (ms < 1000)  return `${ms}ms`;
  if (ms < 60000) return `${(ms/1000).toFixed(1)}s`;
  return `${Math.floor(ms/60000)}m ${Math.floor((ms%60000)/1000)}s`;
}

// ── Render: scan-kaarten bovenaan ────────────────────────────────────────────
function renderSummaryCards() {
  const types = Object.keys(SCAN_LABELS);
  return `
    <div class="maint-cards">
      ${types.map(type => {
        const s       = _summary[type] || {};
        const info    = s;
        const open    = info.open    || 0;
        const fixed   = info.fixed   || 0;
        const ignored = info.ignored || 0;
        const active  = info.active;
        const lastRun = info.lastRun;
        const color   = cardColor(open);
        const isRunning = active?.status === 'running' || active?.status === 'queued';

        return `
          <div class="maint-card" data-scan="${esc(type)}">
            <div class="maint-card-header">
              <span class="maint-card-icon">${SCAN_ICONS[type] || '🔍'}</span>
              <span class="maint-card-title">${esc(SCAN_LABELS[type] || type)}</span>
            </div>
            <div class="maint-card-count" style="color:${color}">${open}</div>
            <div class="maint-card-sub">
              ${open > 0 ? `<span class="maint-card-open">${open} open</span>` : '<span class="maint-card-ok">✓ Alles OK</span>'}
              ${fixed   > 0 ? `<span class="maint-card-fixed">${fixed} gefixt</span>` : ''}
              ${ignored > 0 ? `<span class="maint-card-ignored">${ignored} genegeerd</span>` : ''}
            </div>
            <div class="maint-card-meta">
              ${lastRun ? `Laatste scan: ${relTime(lastRun.created_at)} · ${durationLabel(lastRun.duration_ms)}` : 'Nog niet gescand'}
            </div>
            ${isRunning ? `
              <div class="maint-card-progress">
                <div class="maint-progress-bar">
                  <div class="maint-progress-fill maint-progress-indeterminate"></div>
                </div>
                <span class="maint-progress-label">
                  ${active.status === 'queued' ? 'In wachtrij…' :
                    active.progress ? `${active.progress.checked} / ${active.progress.total}` : 'Bezig…'}
                </span>
              </div>` : `
            <button class="maint-scan-btn" data-scan="${esc(type)}">
              🔍 Scan
            </button>`}
          </div>`;
      }).join('')}
    </div>`;
}

// ── Render: findings tabel voor één scan type ─────────────────────────────────
function renderFindingsSection(type) {
  const label    = SCAN_LABELS[type] || type;
  const findings = _findings[type]   || [];
  const s        = _summary[type]    || {};
  const open     = s.open            || 0;
  const isOpen   = _expanded.has(type);

  if (findings.length === 0 && !isOpen) return '';

  const autoFixable = findings.filter(f => f.auto_fixable && f.status === 'open');

  return `
    <div class="maint-section" id="maint-section-${esc(type)}">
      <button class="maint-section-toggle" data-toggle="${esc(type)}" aria-expanded="${isOpen}">
        <span class="maint-section-icon">${SCAN_ICONS[type] || '🔍'}</span>
        <span class="maint-section-label">${esc(label)}</span>
        <span class="maint-section-count ${open > 0 ? (open > 10 ? 'high' : 'med') : 'ok'}">${open}</span>
        <span class="maint-section-chevron">${isOpen ? '▲' : '▼'}</span>
      </button>

      ${isOpen ? `
      <div class="maint-section-body">
        <div class="maint-section-toolbar">
          <div class="maint-filter-group">
            <span class="maint-filter-label">Filter:</span>
            ${['open','fixed','ignored','all'].map(s => `
              <button class="maint-filter-btn ${_filterStatus === s ? 'active' : ''}"
                data-filter-status="${s}" data-filter-type="${esc(type)}">${s}</button>`).join('')}
          </div>
          ${autoFixable.length > 0 ? `
            <button class="maint-fix-all-btn" data-fix-all="${esc(type)}">
              ⚡ Fix Alles (${autoFixable.length})
            </button>` : ''}
        </div>

        ${findings.length === 0
          ? '<p class="maint-empty">Geen findings. Scan eerst dit type.</p>'
          : `<div class="maint-table-wrap">
              <table class="maint-table">
                <thead>
                  <tr>
                    <th>Bestand / Info</th>
                    <th>Artiest</th>
                    <th>Album</th>
                    <th>Probleem</th>
                    <th>Ernst</th>
                    <th>Status</th>
                    <th>Acties</th>
                  </tr>
                </thead>
                <tbody>
                  ${findings.map(f => renderFindingRow(f)).join('')}
                </tbody>
              </table>
            </div>`}
      </div>` : ''}
    </div>`;
}

function renderFindingRow(f) {
  const fileParts = (f.file_path || '').split('/');
  const fileName  = fileParts[fileParts.length - 1] || f.file_path || '—';
  const fileDir   = fileParts.length > 1 ? fileParts.slice(0, -1).join('/') : '';

  return `
    <tr class="maint-row ${f.status}" data-finding-id="${f.id}">
      <td class="maint-td-file" title="${esc(f.file_path || '')}">
        <span class="maint-filename">${esc(fileName)}</span>
        ${fileDir ? `<span class="maint-filedir">${esc(fileDir)}</span>` : ''}
      </td>
      <td class="maint-td">${esc(f.artist || '—')}</td>
      <td class="maint-td">${esc(f.album  || '—')}</td>
      <td class="maint-td-issue">
        <span class="maint-issue-text">${esc(f.issue)}</span>
        ${f.suggested_fix ? `<span class="maint-suggested-fix" title="${esc(f.suggested_fix)}">💡 ${esc(f.suggested_fix.slice(0, 60))}${f.suggested_fix.length > 60 ? '…' : ''}</span>` : ''}
      </td>
      <td class="maint-td">${severityBadge(f.severity)}</td>
      <td class="maint-td">${statusBadge(f.status)}</td>
      <td class="maint-td-actions">
        ${f.auto_fixable && f.status === 'open'
          ? `<button class="maint-fix-btn" data-fix-id="${f.id}" title="Fix automatisch">⚡ Fix</button>`
          : ''}
        ${f.status === 'open'
          ? `<button class="maint-ignore-btn" data-ignore-id="${f.id}" title="Negeer">🚫 Negeer</button>`
          : f.status === 'ignored'
            ? `<button class="maint-reopen-btn" data-reopen-id="${f.id}" title="Opnieuw openen">↩ Heropenen</button>`
            : ''}
      </td>
    </tr>`;
}

// ── Hoofd-render ──────────────────────────────────────────────────────────────
function renderAll() {
  const content = document.getElementById('content');
  if (!content) return;

  const types = Object.keys(SCAN_LABELS);

  content.innerHTML = `
    <div class="maint-root">
      <div class="maint-header">
        <div class="maint-title-row">
          <h1 class="maint-title">🔧 Bibliotheek Onderhoud</h1>
          <div class="maint-header-actions">
            <button class="maint-scan-all-btn" id="maint-scan-all-btn">
              🔍 Scan Alles
            </button>
            <button class="maint-refresh-btn" id="maint-refresh-summary-btn" title="Ververs">↻</button>
          </div>
        </div>
        <p class="maint-subtitle">
          Scant je muziekbibliotheek op problemen: dead files, duplicaten, ontbrekende metadata, fake lossless en meer.
        </p>
      </div>

      <div id="maint-cards-container">
        ${renderSummaryCards()}
      </div>

      <div class="maint-divider"></div>

      <div class="maint-findings-header">
        <h2 class="maint-findings-title">Findings</h2>
        <div class="maint-global-filter">
          <span>Toon:</span>
          ${['open','fixed','ignored','all'].map(s => `
            <button class="maint-filter-btn global-filter ${_filterStatus === s ? 'active' : ''}"
              data-global-filter="${s}">${s}</button>`).join('')}
        </div>
      </div>

      <div id="maint-sections-container">
        ${types.map(t => renderFindingsSection(t)).join('')}
      </div>
    </div>

    <style>
      .maint-root {
        padding: 24px;
        max-width: 1400px;
        margin: 0 auto;
      }
      .maint-header { margin-bottom: 24px; }
      .maint-title-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;
      }
      .maint-title {
        font-size: 1.5rem;
        font-weight: 700;
        margin: 0;
        color: var(--color-text, #1a202c);
      }
      .maint-subtitle {
        margin: 6px 0 0;
        color: var(--color-muted, #718096);
        font-size: 0.9rem;
      }
      .maint-header-actions { display: flex; gap: 8px; align-items: center; }

      /* ── Scan-all knop ── */
      .maint-scan-all-btn {
        background: var(--color-accent, #4a90d9);
        color: #fff;
        border: none;
        border-radius: 8px;
        padding: 8px 18px;
        font-size: 0.9rem;
        font-weight: 600;
        cursor: pointer;
        transition: opacity .15s;
      }
      .maint-scan-all-btn:hover { opacity: .85; }
      .maint-scan-all-btn:disabled { opacity: .5; cursor: default; }
      .maint-refresh-btn {
        background: var(--color-surface2, #edf2f7);
        border: none;
        border-radius: 8px;
        padding: 8px 12px;
        font-size: 1rem;
        cursor: pointer;
        color: var(--color-text, #1a202c);
      }
      .maint-refresh-btn:hover { opacity: .8; }

      /* ── Kaarten ── */
      .maint-cards {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 14px;
        margin-bottom: 24px;
      }
      .maint-card {
        background: var(--color-surface, #fff);
        border: 1px solid var(--color-border, #e2e8f0);
        border-radius: 12px;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        transition: box-shadow .15s;
      }
      .maint-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,.08); }
      .maint-card-header {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .maint-card-icon { font-size: 1.1rem; }
      .maint-card-title {
        font-size: 0.82rem;
        font-weight: 600;
        color: var(--color-muted, #718096);
        text-transform: uppercase;
        letter-spacing: .04em;
        line-height: 1.2;
      }
      .maint-card-count {
        font-size: 2.2rem;
        font-weight: 800;
        line-height: 1;
      }
      .maint-card-sub {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        font-size: 0.78rem;
      }
      .maint-card-open    { color: var(--color-danger,  #e53e3e); font-weight: 600; }
      .maint-card-ok      { color: var(--color-success, #38a169); font-weight: 600; }
      .maint-card-fixed   { color: var(--color-success, #38a169); }
      .maint-card-ignored { color: var(--color-muted,   #718096); }
      .maint-card-meta {
        font-size: 0.73rem;
        color: var(--color-muted, #718096);
        margin-top: auto;
      }
      .maint-scan-btn {
        background: var(--color-surface2, #edf2f7);
        border: 1px solid var(--color-border, #e2e8f0);
        border-radius: 6px;
        padding: 6px 10px;
        font-size: 0.8rem;
        cursor: pointer;
        color: var(--color-text, #1a202c);
        margin-top: 4px;
        transition: background .12s;
      }
      .maint-scan-btn:hover { background: var(--color-border, #e2e8f0); }

      /* ── Progress bar ── */
      .maint-card-progress { display: flex; flex-direction: column; gap: 4px; margin-top: 4px; }
      .maint-progress-bar {
        height: 4px;
        background: var(--color-border, #e2e8f0);
        border-radius: 2px;
        overflow: hidden;
      }
      .maint-progress-fill {
        height: 100%;
        background: var(--color-accent, #4a90d9);
        border-radius: 2px;
        transition: width .3s;
      }
      @keyframes maint-indeterminate {
        0%   { transform: translateX(-100%); }
        100% { transform: translateX(400%); }
      }
      .maint-progress-indeterminate {
        width: 30%;
        animation: maint-indeterminate 1.2s ease-in-out infinite;
      }
      .maint-progress-label { font-size: 0.73rem; color: var(--color-muted, #718096); }

      /* ── Divider ── */
      .maint-divider {
        height: 1px;
        background: var(--color-border, #e2e8f0);
        margin: 8px 0 20px;
      }

      /* ── Findings-header ── */
      .maint-findings-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;
        margin-bottom: 16px;
      }
      .maint-findings-title {
        font-size: 1.1rem;
        font-weight: 700;
        margin: 0;
      }
      .maint-global-filter {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.82rem;
        color: var(--color-muted, #718096);
      }

      /* ── Sections ── */
      .maint-section {
        border: 1px solid var(--color-border, #e2e8f0);
        border-radius: 10px;
        margin-bottom: 10px;
        overflow: hidden;
        background: var(--color-surface, #fff);
      }
      .maint-section-toggle {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 14px 16px;
        background: none;
        border: none;
        cursor: pointer;
        text-align: left;
        color: var(--color-text, #1a202c);
        font-size: 0.95rem;
      }
      .maint-section-toggle:hover { background: var(--color-surface2, #f7fafc); }
      .maint-section-icon { font-size: 1rem; }
      .maint-section-label { font-weight: 600; flex: 1; }
      .maint-section-count {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 24px;
        height: 22px;
        padding: 0 7px;
        border-radius: 11px;
        font-size: 0.78rem;
        font-weight: 700;
      }
      .maint-section-count.ok  { background: #c6f6d5; color: #276749; }
      .maint-section-count.med { background: #feebc8; color: #7b341e; }
      .maint-section-count.high { background: #fed7d7; color: #822727; }
      .maint-section-chevron { color: var(--color-muted, #718096); font-size: 0.75rem; }
      .maint-section-body { padding: 0 16px 16px; }

      /* ── Toolbar ── */
      .maint-section-toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        flex-wrap: wrap;
        margin-bottom: 12px;
        padding: 8px 0;
        border-bottom: 1px solid var(--color-border, #e2e8f0);
      }
      .maint-filter-group { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; }
      .maint-filter-label { font-size: 0.8rem; color: var(--color-muted, #718096); }
      .maint-filter-btn {
        background: var(--color-surface2, #edf2f7);
        border: 1px solid var(--color-border, #e2e8f0);
        border-radius: 5px;
        padding: 3px 9px;
        font-size: 0.78rem;
        cursor: pointer;
        color: var(--color-text, #1a202c);
        transition: background .1s, border-color .1s;
      }
      .maint-filter-btn.active {
        background: var(--color-accent, #4a90d9);
        border-color: var(--color-accent, #4a90d9);
        color: #fff;
      }
      .maint-fix-all-btn {
        background: var(--color-success, #38a169);
        color: #fff;
        border: none;
        border-radius: 6px;
        padding: 5px 12px;
        font-size: 0.82rem;
        font-weight: 600;
        cursor: pointer;
        transition: opacity .15s;
      }
      .maint-fix-all-btn:hover { opacity: .85; }

      /* ── Tabel ── */
      .maint-table-wrap { overflow-x: auto; }
      .maint-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.82rem;
      }
      .maint-table th {
        text-align: left;
        padding: 8px 10px;
        background: var(--color-surface2, #f7fafc);
        color: var(--color-muted, #718096);
        font-weight: 600;
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: .04em;
        border-bottom: 1px solid var(--color-border, #e2e8f0);
        white-space: nowrap;
      }
      .maint-row { border-bottom: 1px solid var(--color-border, #e2e8f0); }
      .maint-row:last-child { border-bottom: none; }
      .maint-row.fixed   { opacity: .55; }
      .maint-row.ignored { opacity: .4; }
      .maint-row:hover { background: var(--color-surface2, #f7fafc); }
      .maint-td, .maint-td-file, .maint-td-issue, .maint-td-actions {
        padding: 9px 10px;
        vertical-align: top;
        color: var(--color-text, #1a202c);
      }
      .maint-td-file { max-width: 220px; }
      .maint-filename {
        display: block;
        font-family: monospace;
        font-size: 0.8rem;
        word-break: break-all;
      }
      .maint-filedir {
        display: block;
        font-size: 0.7rem;
        color: var(--color-muted, #718096);
        word-break: break-all;
      }
      .maint-td-issue { max-width: 300px; }
      .maint-issue-text { display: block; }
      .maint-suggested-fix {
        display: block;
        font-size: 0.75rem;
        color: var(--color-muted, #718096);
        margin-top: 3px;
        font-style: italic;
      }
      .maint-severity {
        display: inline-block;
        padding: 2px 7px;
        border-radius: 10px;
        color: #fff;
        font-size: 0.72rem;
        font-weight: 600;
        text-transform: uppercase;
      }
      .maint-status-badge {
        display: inline-block;
        padding: 2px 7px;
        border-radius: 10px;
        color: #fff;
        font-size: 0.72rem;
        font-weight: 600;
      }
      .maint-td-actions {
        white-space: nowrap;
        display: flex;
        gap: 5px;
        flex-wrap: wrap;
        align-items: flex-start;
      }
      .maint-fix-btn, .maint-ignore-btn, .maint-reopen-btn {
        border: none;
        border-radius: 5px;
        padding: 3px 8px;
        font-size: 0.75rem;
        cursor: pointer;
        white-space: nowrap;
        transition: opacity .12s;
      }
      .maint-fix-btn    { background: var(--color-success, #38a169); color: #fff; }
      .maint-ignore-btn { background: var(--color-surface2, #edf2f7); color: var(--color-muted, #718096); }
      .maint-reopen-btn { background: var(--color-surface2, #edf2f7); color: var(--color-text, #1a202c); }
      .maint-fix-btn:hover, .maint-ignore-btn:hover, .maint-reopen-btn:hover { opacity: .8; }

      /* ── Empty state ── */
      .maint-empty {
        text-align: center;
        color: var(--color-muted, #718096);
        padding: 20px;
        font-size: 0.85rem;
      }

      /* ── Toast ── */
      .maint-toast {
        position: fixed;
        bottom: 24px;
        right: 24px;
        background: var(--color-surface, #fff);
        border: 1px solid var(--color-border, #e2e8f0);
        border-radius: 10px;
        padding: 12px 18px;
        font-size: 0.88rem;
        box-shadow: 0 4px 16px rgba(0,0,0,.12);
        z-index: 9999;
        animation: maint-toast-in .2s ease;
      }
      @keyframes maint-toast-in {
        from { opacity: 0; transform: translateY(8px); }
        to   { opacity: 1; transform: translateY(0); }
      }

      @media (max-width: 700px) {
        .maint-root { padding: 14px; }
        .maint-cards { grid-template-columns: repeat(2, 1fr); }
        .maint-table th, .maint-td, .maint-td-file,
        .maint-td-issue, .maint-td-actions { padding: 6px; }
      }
    </style>`;
}

// ── Toast melding ─────────────────────────────────────────────────────────────
function showToast(msg, durationMs = 3000) {
  const old = document.querySelector('.maint-toast');
  if (old) old.remove();
  const el = document.createElement('div');
  el.className = 'maint-toast';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), durationMs);
}

// ── Data laden ────────────────────────────────────────────────────────────────
async function loadSummary() {
  try {
    const data = await apiFetch('/api/maintenance/summary');
    _summary = data.summary || {};
  } catch (err) {
    console.warn('Maintenance summary laden mislukt:', err);
  }
}

async function loadFindings(type) {
  try {
    const statusParam = _filterStatus === 'all' ? '' : `&status=${_filterStatus}`;
    const data = await apiFetch(`/api/maintenance/findings?type=${type}${statusParam}`);
    _findings[type] = data.findings || [];
  } catch (err) {
    console.warn('Findings laden mislukt:', err, type);
    _findings[type] = [];
  }
}

// ── Pollen op actieve scans ───────────────────────────────────────────────────
async function pollActiveScanStatus() {
  try {
    const data  = await apiFetch('/api/maintenance/status');
    const active = data.active || {};
    let anyRunning = false;

    for (const [type, info] of Object.entries(active)) {
      if (info.status === 'running' || info.status === 'queued') {
        anyRunning = true;
      }
      // Update summary met actieve info
      if (_summary[type]) {
        _summary[type].active = info;
      } else {
        _summary[type] = { active: info };
      }

      // Als scan klaar is, laad findings en summary opnieuw
      if (info.status === 'completed' && _summary[type]?.active?.status !== 'completed') {
        await loadSummary();
        if (_expanded.has(type)) await loadFindings(type);
      }
    }

    // Update kaarten
    const cardsContainer = document.getElementById('maint-cards-container');
    if (cardsContainer) cardsContainer.innerHTML = renderSummaryCards();

    // Herstart poll als er nog actieve scans zijn
    if (anyRunning) {
      _pollTimer = setTimeout(pollActiveScanStatus, 1500);
    } else {
      await loadSummary();
      if (cardsContainer) cardsContainer.innerHTML = renderSummaryCards();
    }
  } catch { /* netwerk fout, stop pollen */ }
}

function startPolling() {
  if (_pollTimer) clearTimeout(_pollTimer);
  _pollTimer = setTimeout(pollActiveScanStatus, 1500);
}

// ── Event handlers ────────────────────────────────────────────────────────────
async function handleScan(type) {
  try {
    await apiFetch(`/api/maintenance/scan/${type}`, { method: 'POST' });
    showToast(`Scan "${SCAN_LABELS[type] || type}" gestart…`);
    startPolling();
    // Update kaart naar running state
    if (_summary[type]) _summary[type].active = { status: 'running', startedAt: Date.now() };
    const cardsContainer = document.getElementById('maint-cards-container');
    if (cardsContainer) cardsContainer.innerHTML = renderSummaryCards();
  } catch (err) {
    showToast(`Fout: ${err.message}`);
  }
}

async function handleScanAll() {
  try {
    const btn = document.getElementById('maint-scan-all-btn');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Bezig…'; }
    await apiFetch('/api/maintenance/scan/all', { method: 'POST' });
    showToast('Alle scans gestart — dit kan enkele minuten duren…', 5000);
    startPolling();
    // Zet alle kaarten naar queued
    for (const type of Object.keys(SCAN_LABELS)) {
      if (!_summary[type]) _summary[type] = {};
      _summary[type].active = { status: 'queued' };
    }
    const cardsContainer = document.getElementById('maint-cards-container');
    if (cardsContainer) cardsContainer.innerHTML = renderSummaryCards();
  } catch (err) {
    showToast(`Fout: ${err.message}`);
    const btn = document.getElementById('maint-scan-all-btn');
    if (btn) { btn.disabled = false; btn.textContent = '🔍 Scan Alles'; }
  }
}

async function handleToggleSection(type) {
  if (_expanded.has(type)) {
    _expanded.delete(type);
  } else {
    _expanded.add(type);
    // Laad findings als we nog niets hebben
    if (!_findings[type]) {
      await loadFindings(type);
    }
  }
  // Re-render de sectie
  const secEl = document.getElementById(`maint-section-${type}`);
  if (secEl) {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = renderFindingsSection(type);
    const newEl = wrapper.firstElementChild;
    if (newEl) secEl.replaceWith(newEl);
  }
}

async function handleFixFinding(id) {
  try {
    const data = await apiFetch(`/api/maintenance/fix/${id}`, { method: 'POST' });
    showToast(data.status === 'fixed' ? '✓ Gefixt!' : `Overgeslagen: ${data.reason || ''}`);
    // Refresh findings voor dit type
    const row = document.querySelector(`[data-finding-id="${id}"]`);
    const type = row?.closest('.maint-section')?.id?.replace('maint-section-', '');
    if (type) {
      await loadFindings(type);
      await loadSummary();
      redrawSection(type);
      const cardsContainer = document.getElementById('maint-cards-container');
      if (cardsContainer) cardsContainer.innerHTML = renderSummaryCards();
    }
  } catch (err) {
    showToast(`Fout: ${err.message}`);
  }
}

async function handleIgnoreFinding(id) {
  try {
    await apiFetch(`/api/maintenance/ignore/${id}`, { method: 'POST' });
    showToast('Finding genegeerd');
    const row = document.querySelector(`[data-finding-id="${id}"]`);
    const type = row?.closest('.maint-section')?.id?.replace('maint-section-', '');
    if (type) {
      await loadFindings(type);
      await loadSummary();
      redrawSection(type);
      const cardsContainer = document.getElementById('maint-cards-container');
      if (cardsContainer) cardsContainer.innerHTML = renderSummaryCards();
    }
  } catch (err) {
    showToast(`Fout: ${err.message}`);
  }
}

async function handleReopenFinding(id) {
  try {
    await apiFetch(`/api/maintenance/reopen/${id}`, { method: 'POST' });
    showToast('Finding heropend');
    const row = document.querySelector(`[data-finding-id="${id}"]`);
    const type = row?.closest('.maint-section')?.id?.replace('maint-section-', '');
    if (type) {
      await loadFindings(type);
      await loadSummary();
      redrawSection(type);
    }
  } catch (err) {
    showToast(`Fout: ${err.message}`);
  }
}

async function handleFixAll(type) {
  try {
    const btn = document.querySelector(`[data-fix-all="${type}"]`);
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Bezig…'; }
    const data = await apiFetch(`/api/maintenance/fix-all/${type}`, { method: 'POST' });
    showToast(`✓ ${data.fixed} gefixt, ${data.skipped} overgeslagen, ${data.errors} fouten`);
    await loadFindings(type);
    await loadSummary();
    redrawSection(type);
    const cardsContainer = document.getElementById('maint-cards-container');
    if (cardsContainer) cardsContainer.innerHTML = renderSummaryCards();
  } catch (err) {
    showToast(`Fout: ${err.message}`);
  }
}

function redrawSection(type) {
  const secEl = document.getElementById(`maint-section-${type}`);
  if (!secEl) return;
  const wrapper = document.createElement('div');
  wrapper.innerHTML = renderFindingsSection(type);
  const newEl = wrapper.firstElementChild;
  if (newEl) secEl.replaceWith(newEl);
}

// ── Globale event-delegatie ───────────────────────────────────────────────────
function attachEvents(root) {
  root.addEventListener('click', async (e) => {
    const el = e.target.closest('[data-scan]');
    const toggleEl    = e.target.closest('[data-toggle]');
    const fixEl       = e.target.closest('[data-fix-id]');
    const ignoreEl    = e.target.closest('[data-ignore-id]');
    const reopenEl    = e.target.closest('[data-reopen-id]');
    const fixAllEl    = e.target.closest('[data-fix-all]');
    const filterEl    = e.target.closest('[data-filter-status]');
    const globalFEl   = e.target.closest('[data-global-filter]');
    const scanAllBtn  = e.target.closest('#maint-scan-all-btn');
    const refreshBtn  = e.target.closest('#maint-refresh-summary-btn');

    if (scanAllBtn)       return handleScanAll();
    if (refreshBtn)       return handleRefresh();
    if (el?.classList.contains('maint-scan-btn')) return handleScan(el.dataset.scan);
    if (toggleEl)         return handleToggleSection(toggleEl.dataset.toggle);
    if (fixEl)            return handleFixFinding(parseInt(fixEl.dataset.fixId, 10));
    if (ignoreEl)         return handleIgnoreFinding(parseInt(ignoreEl.dataset.ignoreId, 10));
    if (reopenEl)         return handleReopenFinding(parseInt(reopenEl.dataset.reopenId, 10));
    if (fixAllEl)         return handleFixAll(fixAllEl.dataset.fixAll);

    if (filterEl) {
      const { filterStatus, filterType } = filterEl.dataset;
      _filterStatus = filterStatus;
      await loadFindings(filterType);
      redrawSection(filterType);
    }
    if (globalFEl) {
      _filterStatus = globalFEl.dataset.globalFilter;
      // Reload alle geëxpande secties
      const promises = [..._expanded].map(async t => {
        await loadFindings(t);
        redrawSection(t);
      });
      await Promise.all(promises);
      // Update global filter buttons
      document.querySelectorAll('[data-global-filter]').forEach(b => {
        b.classList.toggle('active', b.dataset.globalFilter === _filterStatus);
      });
    }
  });
}

async function handleRefresh() {
  await loadSummary();
  const cardsContainer = document.getElementById('maint-cards-container');
  if (cardsContainer) cardsContainer.innerHTML = renderSummaryCards();
  // Refresh geëxpande secties
  for (const type of _expanded) {
    await loadFindings(type);
    redrawSection(type);
  }
  showToast('Vernieuwd');
}

// ── View entry point ─────────────────────────────────────────────────────────
export async function loadMaintenance() {
  // Reset state
  _expanded.clear();
  if (_pollTimer) { clearTimeout(_pollTimer); _pollTimer = null; }

  const content = document.getElementById('content');
  if (!content) return;
  content.innerHTML = `<div style="padding:40px;text-align:center;color:var(--color-muted,#718096)">
    ⏳ Onderhoud laden…
  </div>`;

  // Laad summary
  await loadSummary();

  // Render dashboard
  renderAll();

  // Attach events op de root-container
  const root = document.querySelector('.maint-root');
  if (root) attachEvents(root);

  // Poll als er actieve scans zijn
  const hasActive = Object.values(_summary).some(s => s.active?.status === 'running' || s.active?.status === 'queued');
  if (hasActive) startPolling();
}
