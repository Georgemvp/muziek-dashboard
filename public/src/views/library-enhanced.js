// ── View: Enhanced Library Manager ───────────────────────────────────────────
// Uitgebreide bibliotheekbeheer met enrichment coverage, per-bron metadata,
// inline bewerking en tag-schrijven naar Plex.

import { apiFetch } from '../api.js';
import { esc } from '../helpers.js';

// ═══════════════════════════════════════════════════════════════════════════════
// Module state
// ═══════════════════════════════════════════════════════════════════════════════
let _artists      = [];
let _filtered     = [];
let _sortCol      = 'name';
let _sortDir      = 1;        // 1 = oplopend, -1 = aflopend
let _searchTerm   = '';
let _selected     = null;     // geselecteerde artiestNaam (string)
let _artistDetail = null;     // { name, albums, enrichmentData, ... }
let _activeSource = 'lastfm';
let _diffState    = null;     // { ratingKey, type, diff, proposed }
let _diffChecked  = {};       // { field: bool }
let _stylesOk     = false;
let _settings     = { artist_separator: ', ', feat_to_title: false };
let _showSettings = false;

const KNOWN_SOURCES = [
  'lastfm', 'musicbrainz', 'spotify', 'deezer',
  'audiodb', 'discogs', 'itunes', 'tidal', 'qobuz', 'genius',
];
const SOURCE_LABELS = {
  lastfm: 'Last.fm', musicbrainz: 'MusicBrainz', spotify: 'Spotify',
  deezer: 'Deezer',  audiodb: 'AudioDB',          discogs: 'Discogs',
  itunes: 'iTunes',  tidal: 'Tidal',               qobuz: 'Qobuz',
  genius: 'Genius',
};
const SOURCE_ICONS = {
  lastfm: '🎵', musicbrainz: '🎼', spotify: '💚', deezer: '🎶',
  audiodb: '🎸', discogs: '💿', itunes: '🍎', tidal: '🌊',
  qobuz: '🎹', genius: '📝', manual: '✏️',
};

// ═══════════════════════════════════════════════════════════════════════════════
// CSS injectie (eenmalig)
// ═══════════════════════════════════════════════════════════════════════════════
function injectStyles() {
  if (_stylesOk || document.getElementById('libmgr-css')) { _stylesOk = true; return; }
  _stylesOk = true;
  const s = document.createElement('style');
  s.id = 'libmgr-css';
  s.textContent = `
/* ── Enhanced Library Manager ─────────────────────────────────────────── */
.libmgr { display:flex; flex-direction:column; height:calc(100vh - var(--player-height,76px) - 56px); overflow:hidden; background:var(--bg-primary); }
.libmgr-header { display:flex; align-items:center; gap:12px; padding:14px 20px 10px; border-bottom:1px solid var(--border); flex-shrink:0; flex-wrap:wrap; }
.libmgr-title { font-size:var(--text-lg); font-weight:600; color:var(--text-primary); margin:0; white-space:nowrap; }
.libmgr-mode-group { display:flex; border:1px solid var(--border); border-radius:var(--radius-md); overflow:hidden; }
.libmgr-mode-btn { padding:5px 14px; font-size:var(--text-sm); background:none; border:none; cursor:pointer; color:var(--text-secondary); transition:background .15s; white-space:nowrap; }
.libmgr-mode-btn:hover { background:var(--bg-secondary); }
.libmgr-mode-btn.active { background:var(--accent); color:#fff; }
.libmgr-search { flex:1; min-width:160px; max-width:320px; padding:6px 10px; border:1px solid var(--border); border-radius:var(--radius-md); background:var(--bg-secondary); color:var(--text-primary); font-size:var(--text-sm); }
.libmgr-search:focus { outline:none; border-color:var(--accent); }
.libmgr-stats { font-size:var(--text-xs); color:var(--text-muted); white-space:nowrap; }
.libmgr-settings-btn { padding:5px 10px; font-size:var(--text-sm); background:var(--bg-secondary); border:1px solid var(--border); border-radius:var(--radius-md); cursor:pointer; color:var(--text-secondary); transition:background .15s; }
.libmgr-settings-btn:hover { background:var(--bg-tertiary); }
.libmgr-settings-btn.active { background:var(--accent-light); border-color:var(--accent); color:var(--accent); }

/* Settings dropdown */
.libmgr-settings-panel { background:var(--bg-primary); border:1px solid var(--border); border-radius:var(--radius-lg); padding:16px; width:320px; position:absolute; right:16px; top:56px; z-index:200; box-shadow:var(--shadow-lg); }
.libmgr-settings-panel h4 { margin:0 0 12px; font-size:var(--text-sm); color:var(--text-primary); }
.libmgr-settings-row { display:flex; align-items:center; gap:8px; margin-bottom:10px; font-size:var(--text-sm); }
.libmgr-settings-row label { flex:1; color:var(--text-secondary); }
.libmgr-settings-row input, .libmgr-settings-row select { padding:4px 8px; border:1px solid var(--border); border-radius:var(--radius-sm); background:var(--bg-secondary); color:var(--text-primary); font-size:var(--text-sm); }
.libmgr-settings-save { width:100%; padding:7px; background:var(--accent); color:#fff; border:none; border-radius:var(--radius-md); cursor:pointer; font-size:var(--text-sm); margin-top:4px; }

/* Main layout */
.libmgr-body { display:flex; flex:1; overflow:hidden; position:relative; }
.libmgr-table-wrap { flex:1; overflow-y:auto; overflow-x:auto; }
.libmgr-panel-open .libmgr-table-wrap { flex:0 0 55%; }

/* Table */
.libmgr-table { width:100%; border-collapse:collapse; font-size:var(--text-sm); }
.libmgr-table thead th { position:sticky; top:0; background:var(--bg-secondary); border-bottom:2px solid var(--border); padding:9px 12px; text-align:left; font-weight:600; color:var(--text-secondary); font-size:var(--text-xs); text-transform:uppercase; letter-spacing:.04em; white-space:nowrap; z-index:2; }
.libmgr-table thead th.sortable { cursor:pointer; user-select:none; }
.libmgr-table thead th.sortable:hover { color:var(--text-primary); }
.libmgr-table thead th.sort-active { color:var(--accent); }
.libmgr-table tbody tr { border-bottom:1px solid var(--border); transition:background .1s; cursor:pointer; }
.libmgr-table tbody tr:hover { background:var(--bg-secondary); }
.libmgr-table tbody tr.selected { background:var(--accent-light) !important; }
.libmgr-table td { padding:8px 12px; vertical-align:middle; }
.libmgr-td-thumb { width:40px; }
.libmgr-thumb { width:36px; height:36px; border-radius:3px; object-fit:cover; background:var(--bg-tertiary); }
.libmgr-name-cell { font-weight:500; color:var(--text-primary); }
.libmgr-album-count { color:var(--text-muted); font-size:var(--text-xs); }
.libmgr-genre-tag { display:inline-block; padding:1px 7px; background:var(--accent-muted); color:var(--accent); border-radius:10px; font-size:11px; margin:1px 2px 1px 0; }
.libmgr-actions { display:flex; gap:4px; opacity:0; transition:opacity .15s; }
tr:hover .libmgr-actions, tr.selected .libmgr-actions { opacity:1; }
.libmgr-action-btn { padding:3px 8px; font-size:11px; background:var(--bg-tertiary); border:1px solid var(--border); border-radius:var(--radius-sm); cursor:pointer; color:var(--text-secondary); }
.libmgr-action-btn:hover { background:var(--border); color:var(--text-primary); }

/* Enrichment coverage ring */
.libmgr-ring { display:block; }
.libmgr-ring-wrap { display:flex; align-items:center; gap:6px; }
.libmgr-ring-label { font-size:11px; color:var(--text-muted); }

/* Detail panel */
.libmgr-panel { width:45%; flex-shrink:0; border-left:1px solid var(--border); display:flex; flex-direction:column; overflow:hidden; background:var(--bg-primary); transform:translateX(100%); transition:transform .25s ease; position:absolute; right:0; top:0; bottom:0; }
.libmgr-panel-open .libmgr-panel { transform:translateX(0); position:relative; }
.libmgr-panel-header { display:flex; align-items:center; gap:12px; padding:14px 16px; border-bottom:1px solid var(--border); flex-shrink:0; }
.libmgr-panel-thumb { width:56px; height:56px; border-radius:4px; object-fit:cover; background:var(--bg-tertiary); flex-shrink:0; }
.libmgr-panel-info { flex:1; overflow:hidden; }
.libmgr-panel-name { margin:0 0 3px; font-size:var(--text-lg); font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; color:var(--text-primary); }
.libmgr-panel-meta { font-size:var(--text-xs); color:var(--text-muted); }
.libmgr-panel-close { padding:4px 8px; background:none; border:1px solid var(--border); border-radius:var(--radius-sm); cursor:pointer; font-size:16px; color:var(--text-muted); flex-shrink:0; }
.libmgr-panel-close:hover { background:var(--bg-secondary); }
.libmgr-panel-actions { display:flex; gap:8px; padding:10px 16px; border-bottom:1px solid var(--border); flex-shrink:0; flex-wrap:wrap; }
.libmgr-panel-btn { padding:5px 12px; font-size:var(--text-xs); border:1px solid var(--border); border-radius:var(--radius-md); cursor:pointer; background:var(--bg-secondary); color:var(--text-secondary); white-space:nowrap; }
.libmgr-panel-btn:hover { background:var(--bg-tertiary); color:var(--text-primary); }
.libmgr-panel-btn.primary { background:var(--accent); border-color:var(--accent); color:#fff; }
.libmgr-panel-btn.primary:hover { background:var(--accent-hover); }

/* Source tabs */
.libmgr-source-tabs { display:flex; gap:2px; padding:8px 12px 0; border-bottom:1px solid var(--border); flex-shrink:0; overflow-x:auto; scrollbar-width:none; }
.libmgr-source-tabs::-webkit-scrollbar { display:none; }
.libmgr-source-tab { padding:5px 10px; font-size:11px; border:1px solid transparent; border-bottom:none; border-radius:4px 4px 0 0; cursor:pointer; background:none; color:var(--text-muted); white-space:nowrap; position:relative; bottom:-1px; }
.libmgr-source-tab:hover { color:var(--text-primary); background:var(--bg-secondary); }
.libmgr-source-tab.active { background:var(--bg-primary); border-color:var(--border); color:var(--text-primary); font-weight:600; }
.libmgr-source-tab .tab-dot { width:6px; height:6px; border-radius:50%; display:inline-block; margin-right:4px; vertical-align:middle; }
.libmgr-source-tab .tab-dot.has-data { background:var(--green); }
.libmgr-source-tab .tab-dot.no-data { background:var(--border); }

/* Source content */
.libmgr-source-content { flex:1; overflow-y:auto; padding:14px 16px; }
.libmgr-source-empty { color:var(--text-muted); font-size:var(--text-sm); padding:20px 0; text-align:center; }
.libmgr-field-grid { display:grid; gap:8px; }
.libmgr-field-row { display:grid; grid-template-columns:120px 1fr; gap:8px; align-items:start; }
.libmgr-field-key { font-size:11px; font-weight:600; color:var(--text-muted); text-transform:uppercase; letter-spacing:.04em; padding-top:2px; }
.libmgr-field-val { font-size:var(--text-sm); color:var(--text-primary); word-break:break-word; }
.libmgr-field-val.editable { cursor:text; border-radius:var(--radius-sm); padding:1px 4px; margin:-1px -4px; }
.libmgr-field-val.editable:hover { background:var(--bg-secondary); outline:1px solid var(--border); }
.libmgr-field-val.editable:focus { background:var(--bg-primary); outline:2px solid var(--accent); }
.libmgr-field-val[contenteditable="true"] { background:var(--bg-secondary); outline:2px solid var(--accent); border-radius:var(--radius-sm); padding:2px 6px; }
.libmgr-tags-wrap { display:flex; flex-wrap:wrap; gap:4px; }
.libmgr-tag { padding:2px 8px; background:var(--accent-muted); color:var(--accent); border-radius:10px; font-size:11px; }
.libmgr-bio { font-size:var(--text-sm); color:var(--text-secondary); line-height:1.6; max-height:120px; overflow:hidden; position:relative; }
.libmgr-bio::after { content:''; position:absolute; bottom:0; left:0; right:0; height:32px; background:linear-gradient(transparent, var(--bg-primary)); }
.libmgr-bio.expanded { max-height:none; }
.libmgr-bio.expanded::after { display:none; }
.libmgr-bio-toggle { font-size:11px; color:var(--accent); cursor:pointer; margin-top:4px; display:inline-block; }
.libmgr-albums-section { margin-top:12px; border-top:1px solid var(--border); padding-top:12px; }
.libmgr-albums-title { font-size:11px; font-weight:600; color:var(--text-muted); text-transform:uppercase; margin-bottom:8px; }
.libmgr-album-row { display:flex; align-items:center; gap:8px; padding:5px 0; border-bottom:1px solid var(--bg-secondary); }
.libmgr-album-thumb { width:32px; height:32px; border-radius:2px; object-fit:cover; background:var(--bg-tertiary); }
.libmgr-album-name { flex:1; font-size:var(--text-sm); }
.libmgr-album-write { padding:2px 7px; font-size:11px; background:none; border:1px solid var(--border); border-radius:var(--radius-sm); cursor:pointer; color:var(--text-muted); }
.libmgr-album-write:hover { background:var(--accent-light); border-color:var(--accent); color:var(--accent); }

/* Diff modal */
.libmgr-overlay { position:fixed; inset:0; background:rgba(0,0,0,.5); z-index:1000; display:flex; align-items:center; justify-content:center; }
.libmgr-modal { background:var(--bg-primary); border-radius:var(--radius-xl); box-shadow:var(--shadow-lg); width:min(720px,96vw); max-height:85vh; display:flex; flex-direction:column; overflow:hidden; }
.libmgr-modal-hdr { display:flex; align-items:center; padding:14px 18px; border-bottom:1px solid var(--border); flex-shrink:0; }
.libmgr-modal-hdr h3 { flex:1; margin:0; font-size:var(--text-base); font-weight:600; }
.libmgr-modal-src { font-size:11px; color:var(--text-muted); margin-right:12px; }
.libmgr-modal-close { padding:3px 9px; background:none; border:1px solid var(--border); border-radius:var(--radius-sm); cursor:pointer; font-size:16px; color:var(--text-muted); }
.libmgr-modal-close:hover { background:var(--bg-secondary); }
.libmgr-diff-table { width:100%; border-collapse:collapse; overflow-y:auto; flex:1; display:block; }
.libmgr-diff-table thead { display:table; width:100%; table-layout:fixed; }
.libmgr-diff-table tbody { display:block; max-height:420px; overflow-y:auto; }
.libmgr-diff-table tr { display:table; width:100%; table-layout:fixed; }
.libmgr-diff-table th { padding:8px 12px; background:var(--bg-secondary); border-bottom:2px solid var(--border); font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:.04em; color:var(--text-muted); text-align:left; }
.libmgr-diff-table td { padding:8px 12px; font-size:var(--text-sm); border-bottom:1px solid var(--border); vertical-align:top; }
.diff-row-changed { background:rgba(245,158,11,.06); }
.diff-row-same    { opacity:.55; }
.diff-cur  { color:var(--text-secondary); }
.diff-new  { color:var(--green); font-weight:500; }
.diff-tag  { display:inline-block; padding:1px 6px; border-radius:8px; font-size:11px; margin:1px; }
.diff-tag-added   { background:var(--green-bg); color:var(--green); }
.diff-tag-removed { background:var(--red-bg); color:var(--red); text-decoration:line-through; }
.diff-tag-same    { background:var(--bg-secondary); color:var(--text-muted); }
.diff-check { width:16px; height:16px; cursor:pointer; }
.libmgr-modal-ftr { display:flex; justify-content:flex-end; gap:8px; padding:12px 18px; border-top:1px solid var(--border); flex-shrink:0; }
.libmgr-modal-cancel  { padding:7px 16px; background:var(--bg-secondary); border:1px solid var(--border); border-radius:var(--radius-md); cursor:pointer; font-size:var(--text-sm); }
.libmgr-modal-confirm { padding:7px 16px; background:var(--accent); color:#fff; border:none; border-radius:var(--radius-md); cursor:pointer; font-size:var(--text-sm); }
.libmgr-modal-confirm:disabled { opacity:.5; cursor:not-allowed; }

/* Loading / empty states */
.libmgr-loading { display:flex; flex-direction:column; align-items:center; justify-content:center; flex:1; gap:10px; color:var(--text-muted); font-size:var(--text-sm); }
.libmgr-spinner { width:28px; height:28px; border:3px solid var(--border); border-top-color:var(--accent); border-radius:50%; animation:libmgr-spin .7s linear infinite; }
@keyframes libmgr-spin { to { transform:rotate(360deg); } }
`;
  document.head.appendChild(s);
}

// ═══════════════════════════════════════════════════════════════════════════════
// Hoofd-entry point
// ═══════════════════════════════════════════════════════════════════════════════
export async function loadLibraryEnhanced() {
  injectStyles();
  const el = document.getElementById('content');
  el.innerHTML = renderShell();
  _bindEvents();
  await Promise.all([_loadArtists(), _loadSettings()]);
}

// ═══════════════════════════════════════════════════════════════════════════════
// Shell HTML
// ═══════════════════════════════════════════════════════════════════════════════
function renderShell() {
  return `
<div class="libmgr" id="libmgr-root">
  <div class="libmgr-header">
    <h2 class="libmgr-title">📚 Library Manager</h2>
    <div class="libmgr-mode-group">
      <button class="libmgr-mode-btn" data-mode="standard">Standaard</button>
      <button class="libmgr-mode-btn active" data-mode="enhanced">Uitgebreid</button>
    </div>
    <input class="libmgr-search" id="libmgr-search" type="search" placeholder="Zoek artiest…" autocomplete="off">
    <span class="libmgr-stats" id="libmgr-stats"></span>
    <button class="libmgr-settings-btn" id="libmgr-settings-btn" title="Instellingen">⚙ Instellingen</button>
  </div>

  <div id="libmgr-settings-panel" style="display:none;position:relative;">
    <div class="libmgr-settings-panel">
      <h4>Multi-artiest instellingen</h4>
      <div class="libmgr-settings-row">
        <label>Artiest-separator</label>
        <select id="libmgr-sep">
          <option value=", ">Komma (, )</option>
          <option value="; ">Puntkomma (; )</option>
          <option value=" / ">Slash ( / )</option>
        </select>
      </div>
      <div class="libmgr-settings-row">
        <label>Featured artiest naar titel verplaatsen</label>
        <input type="checkbox" id="libmgr-feat">
      </div>
      <button class="libmgr-settings-save" id="libmgr-settings-save">Opslaan</button>
    </div>
  </div>

  <div class="libmgr-body" id="libmgr-body">
    <div class="libmgr-table-wrap">
      <table class="libmgr-table">
        <thead>
          <tr>
            <th class="libmgr-td-thumb"></th>
            <th class="sortable sort-active" data-col="name">Artiest <span id="libmgr-sort-name">↑</span></th>
            <th class="sortable" data-col="albumCount">Albums <span id="libmgr-sort-albumCount"></span></th>
            <th>Genres</th>
            <th class="sortable" data-col="enrichmentCoverage">Coverage <span id="libmgr-sort-enrichmentCoverage"></span></th>
            <th>Acties</th>
          </tr>
        </thead>
        <tbody id="libmgr-tbody">
          <tr><td colspan="6"><div class="libmgr-loading"><div class="libmgr-spinner"></div><span>Bibliotheek laden…</span></div></td></tr>
        </tbody>
      </table>
    </div>

    <div class="libmgr-panel" id="libmgr-panel">
      <div class="libmgr-panel-header">
        <img class="libmgr-panel-thumb" id="libmgr-panel-thumb" src="" alt="">
        <div class="libmgr-panel-info">
          <div class="libmgr-panel-name" id="libmgr-panel-name"></div>
          <div class="libmgr-panel-meta" id="libmgr-panel-meta"></div>
        </div>
        <button class="libmgr-panel-close" id="libmgr-panel-close">×</button>
      </div>
      <div class="libmgr-panel-actions">
        <button class="libmgr-panel-btn primary" id="libmgr-btn-enrich">🔄 Herverrijk artiest</button>
        <button class="libmgr-panel-btn" id="libmgr-btn-save-manual">💾 Handmatige edit opslaan</button>
      </div>
      <div class="libmgr-source-tabs" id="libmgr-source-tabs"></div>
      <div class="libmgr-source-content" id="libmgr-source-content">
        <div class="libmgr-source-empty">Selecteer een artiest om de details te zien.</div>
      </div>
    </div>
  </div>

  <div class="libmgr-overlay" id="libmgr-overlay" style="display:none;">
    <div class="libmgr-modal">
      <div class="libmgr-modal-hdr">
        <h3>Tags Preview</h3>
        <span class="libmgr-modal-src" id="libmgr-modal-src"></span>
        <button class="libmgr-modal-close" id="libmgr-modal-close">×</button>
      </div>
      <table class="libmgr-diff-table">
        <thead><tr>
          <th style="width:20%">Veld</th>
          <th style="width:33%">Huidig</th>
          <th style="width:33%">Voorgesteld</th>
          <th style="width:14%">Accepteren</th>
        </tr></thead>
        <tbody id="libmgr-diff-tbody"></tbody>
      </table>
      <div class="libmgr-modal-ftr">
        <button class="libmgr-modal-cancel" id="libmgr-modal-cancel">Annuleren</button>
        <button class="libmgr-modal-confirm" id="libmgr-modal-confirm">Tags Schrijven</button>
      </div>
    </div>
  </div>
</div>`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Data laden
// ═══════════════════════════════════════════════════════════════════════════════
async function _loadArtists() {
  try {
    const data = await apiFetch('/api/library/artists');
    _artists = data.artists || [];
    _applyFilter();
  } catch (err) {
    const tbody = document.getElementById('libmgr-tbody');
    if (tbody) tbody.innerHTML = `<tr><td colspan="6" style="padding:20px;text-align:center;color:var(--red)">Fout bij laden: ${esc(err.message)}</td></tr>`;
  }
}

async function _loadSettings() {
  try {
    _settings = await apiFetch('/api/library/settings');
    const sepEl  = document.getElementById('libmgr-sep');
    const featEl = document.getElementById('libmgr-feat');
    if (sepEl)  sepEl.value   = _settings.artist_separator || ', ';
    if (featEl) featEl.checked = !!_settings.feat_to_title;
  } catch {}
}

async function _loadArtistDetail(name) {
  const contentEl = document.getElementById('libmgr-source-content');
  if (contentEl) contentEl.innerHTML = `<div class="libmgr-loading"><div class="libmgr-spinner"></div><span>Laden…</span></div>`;
  try {
    _artistDetail = await apiFetch(`/api/library/artist/${encodeURIComponent(name)}`);
    _activeSource = KNOWN_SOURCES.find(s => _artistDetail.enrichmentData?.[s]) || 'lastfm';
    _renderPanel();
  } catch (err) {
    if (contentEl) contentEl.innerHTML = `<div class="libmgr-source-empty">Fout: ${esc(err.message)}</div>`;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Filteren & sorteren
// ═══════════════════════════════════════════════════════════════════════════════
function _applyFilter() {
  const q = _searchTerm.toLowerCase().trim();
  _filtered = q ? _artists.filter(a => a.name.toLowerCase().includes(q)) : [..._artists];
  _sortArtists();
  _renderTable();
  _updateStats();
}

function _sortArtists() {
  _filtered.sort((a, b) => {
    const av = a[_sortCol] ?? '';
    const bv = b[_sortCol] ?? '';
    if (typeof av === 'number') return (av - bv) * _sortDir;
    return String(av).localeCompare(String(bv), 'nl', { sensitivity: 'base' }) * _sortDir;
  });
}

function _updateStats() {
  const el = document.getElementById('libmgr-stats');
  if (el) el.textContent = `${_filtered.length} artiesten · ${_artists.reduce((s, a) => s + a.albumCount, 0)} albums`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Tabel renderen
// ═══════════════════════════════════════════════════════════════════════════════
function _renderTable() {
  const tbody = document.getElementById('libmgr-tbody');
  if (!tbody) return;

  if (!_filtered.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="padding:24px;text-align:center;color:var(--text-muted)">Geen artiesten gevonden.</td></tr>`;
    return;
  }

  const rows = _filtered.map(a => {
    const isSelected = a.name === _selected;
    const thumbSrc   = a.thumb ? `/api/plex/thumb?path=${encodeURIComponent(a.thumb)}` : '';
    const thumbImg   = thumbSrc
      ? `<img class="libmgr-thumb" src="${esc(thumbSrc)}" alt="" loading="lazy" onerror="this.style.display='none'">`
      : `<div class="libmgr-thumb" style="background:var(--bg-tertiary)"></div>`;
    const genreTags  = a.genres.map(g => `<span class="libmgr-genre-tag">${esc(g)}</span>`).join('');
    const ring       = _coverageRing(a.enrichmentCoverage, a.enrichmentTotal);
    return `
<tr class="${isSelected ? 'selected' : ''}" data-artist="${esc(a.name)}">
  <td class="libmgr-td-thumb">${thumbImg}</td>
  <td>
    <div class="libmgr-name-cell">${esc(a.name)}</div>
    <div class="libmgr-album-count">${a.albumCount} album${a.albumCount !== 1 ? 's' : ''}</div>
  </td>
  <td>${a.albumCount}</td>
  <td>${genreTags || '<span style="color:var(--text-muted);font-size:11px">—</span>'}</td>
  <td>
    <div class="libmgr-ring-wrap">
      ${ring}
      <span class="libmgr-ring-label">${a.enrichmentCoverage}/${a.enrichmentTotal}</span>
    </div>
  </td>
  <td>
    <div class="libmgr-actions">
      <button class="libmgr-action-btn" data-action="enrich" data-artist="${esc(a.name)}" title="Herverrijk">🔄</button>
    </div>
  </td>
</tr>`;
  });

  tbody.innerHTML = rows.join('');
}

// ═══════════════════════════════════════════════════════════════════════════════
// Coverage ring SVG
// ═══════════════════════════════════════════════════════════════════════════════
function _coverageRing(covered, total) {
  const pct   = total > 0 ? covered / total : 0;
  const r     = 14;
  const circ  = 2 * Math.PI * r;
  const dash  = circ * pct;
  const color = pct >= 0.7 ? 'var(--green)' : pct >= 0.4 ? '#f59e0b' : pct > 0 ? 'var(--accent)' : 'var(--border)';
  return `<svg class="libmgr-ring" width="36" height="36" viewBox="0 0 36 36">
  <circle cx="18" cy="18" r="${r}" fill="none" stroke="var(--border)" stroke-width="3"/>
  <circle cx="18" cy="18" r="${r}" fill="none" stroke="${color}" stroke-width="3"
    stroke-dasharray="${dash.toFixed(2)} ${(circ - dash).toFixed(2)}"
    stroke-linecap="round" transform="rotate(-90 18 18)"/>
  <text x="18" y="22" text-anchor="middle" font-size="9" fill="currentColor">${Math.round(pct * 100)}%</text>
</svg>`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Detail panel renderen
// ═══════════════════════════════════════════════════════════════════════════════
function _renderPanel() {
  if (!_artistDetail) return;
  const { name, albums, enrichmentData } = _artistDetail;

  // Header
  const thumbEl = document.getElementById('libmgr-panel-thumb');
  const nameEl  = document.getElementById('libmgr-panel-name');
  const metaEl  = document.getElementById('libmgr-panel-meta');
  if (nameEl) nameEl.textContent = name;
  if (metaEl) metaEl.textContent = `${albums.length} album${albums.length !== 1 ? 's' : ''}`;

  // Thumbnail van eerste album
  const firstThumb = albums.find(a => a.thumb)?.thumb;
  if (thumbEl) {
    thumbEl.src = firstThumb ? `/api/plex/thumb?path=${encodeURIComponent(firstThumb)}` : '';
    thumbEl.style.display = firstThumb ? '' : 'none';
  }

  // Source tabs
  _renderSourceTabs(enrichmentData);
  // Source inhoud
  _renderSourceContent(enrichmentData);
}

function _renderSourceTabs(enrichmentData) {
  const tabsEl = document.getElementById('libmgr-source-tabs');
  if (!tabsEl) return;
  const allSources = [...KNOWN_SOURCES, 'manual'];
  tabsEl.innerHTML = allSources.map(src => {
    const hasData = !!(enrichmentData?.[src]);
    const label   = SOURCE_LABELS[src] || 'Handmatig';
    const icon    = SOURCE_ICONS[src]  || '✏️';
    return `<button class="libmgr-source-tab${src === _activeSource ? ' active' : ''}"
      data-source="${esc(src)}">
      <span class="tab-dot ${hasData ? 'has-data' : 'no-data'}"></span>
      ${icon} ${esc(label)}
    </button>`;
  }).join('');
}

function _renderSourceContent(enrichmentData) {
  const el = document.getElementById('libmgr-source-content');
  if (!el) return;
  const data = enrichmentData?.[_activeSource];

  if (_activeSource === 'manual') {
    el.innerHTML = _renderManualTab(data, enrichmentData);
    return;
  }

  if (!data) {
    el.innerHTML = `<div class="libmgr-source-empty">Geen data beschikbaar voor ${esc(SOURCE_LABELS[_activeSource] || _activeSource)}.<br><br>
      <button class="libmgr-panel-btn" data-action="enrich" data-artist="${esc(_selected)}">🔄 Verrijken via deze bron</button></div>`;
    return;
  }

  // Albums sectie onderaan
  const albumsHtml = _renderAlbumsList();
  el.innerHTML = _renderFieldGrid(data) + albumsHtml;
}

function _renderManualTab(manualData, enrichmentData) {
  // Stel de beste beschikbare velden voor als startwaarden
  const best  = _bestFields(enrichmentData);
  const md    = manualData || {};
  const fields = [
    { key: 'name',     label: 'Naam',        val: md.name     || best.name     || '' },
    { key: 'genres',   label: 'Genres',      val: (md.genres  || best.genres   || []).join(', ') },
    { key: 'tags',     label: 'Tags',        val: (md.tags    || best.tags     || []).join(', ') },
    { key: 'summary',  label: 'Biografie',   val: md.summary  || best.summary  || '' },
    { key: 'country',  label: 'Land',        val: md.country  || best.country  || '' },
    { key: 'formed',   label: 'Opgericht',   val: md.formed   || best.formed   || '' },
  ];
  return `<div style="padding:4px 0">
    <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:12px">
      Handmatige velden overschrijven alle andere bronnen. Dubbelklik op een veld om te bewerken.
    </p>
    <div class="libmgr-field-grid">
      ${fields.map(f => `
        <div class="libmgr-field-row">
          <div class="libmgr-field-key">${esc(f.label)}</div>
          <div class="libmgr-field-val editable" contenteditable="false"
            data-edit-key="${esc(f.key)}" data-edit-original="${esc(f.val)}"
          >${esc(f.val) || '<span style="color:var(--text-muted);font-style:italic">Leeg</span>'}</div>
        </div>`).join('')}
    </div>
  </div>`;
}

function _bestFields(enrichmentData) {
  const result = {};
  for (const src of ['musicbrainz', 'lastfm', 'audiodb', 'discogs', 'deezer', 'spotify']) {
    const d = enrichmentData?.[src];
    if (!d) continue;
    if (!result.name    && d.name)    result.name    = d.name;
    if (!result.summary && (d.summary || d.biography || d.bio?.content)) {
      result.summary = d.summary || d.biography || d.bio?.content;
    }
    if (!result.country && d.country) result.country = d.country;
    if (!result.formed  && (d.formed || d.beginDate)) result.formed = d.formed || d.beginDate;
    const genres = d.genres || d.tags || [];
    if (!result.genres && genres.length) {
      result.genres = (Array.isArray(genres) ? genres : []).map(t => typeof t === 'string' ? t : t.name || t.tag || '').filter(Boolean);
    }
  }
  return result;
}

function _renderFieldGrid(data) {
  if (!data || typeof data !== 'object') return '<div class="libmgr-source-empty">Geen data</div>';

  const SKIP_KEYS = ['_updatedAt', '_stale', 'id', 'mbid', 'url', 'image', 'images', 'similar'];
  const rows = [];

  // Bepaal prioriteitsvelden om bovenaan te tonen
  const PRIO = ['name', 'country', 'formed', 'disbanded', 'genres', 'tags', 'style', 'mood', 'listeners', 'playcount', 'popularity', 'followers'];

  const keys    = Object.keys(data);
  const sorted  = [...new Set([...PRIO.filter(k => keys.includes(k)), ...keys])];

  for (const key of sorted) {
    if (SKIP_KEYS.includes(key)) continue;
    const val = data[key];
    if (val === null || val === undefined || val === '') continue;

    const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    rows.push(`<div class="libmgr-field-row">
      <div class="libmgr-field-key">${esc(label)}</div>
      <div class="libmgr-field-val">${_renderValue(key, val)}</div>
    </div>`);
  }

  // Biografie apart als grote tekstblok
  const bio = data.biography || data.bio?.content || data.summary || data.profile;
  const bioHtml = bio ? `
    <div style="margin-top:12px;border-top:1px solid var(--border);padding-top:12px">
      <div class="libmgr-field-key" style="margin-bottom:6px">Biografie</div>
      <div class="libmgr-bio" id="libmgr-bio">${esc(_cleanBio(bio)).replace(/\n/g, '<br>')}</div>
      <span class="libmgr-bio-toggle" id="libmgr-bio-toggle">Meer tonen ▾</span>
    </div>` : '';

  return `<div class="libmgr-field-grid">${rows.join('')}</div>${bioHtml}`;
}

function _renderValue(key, val) {
  if (Array.isArray(val)) {
    if (!val.length) return '<span style="color:var(--text-muted)">—</span>';
    const items = val.map(t => typeof t === 'string' ? t : t.name || t.tag || t.title || JSON.stringify(t)).filter(Boolean);
    if (['genres', 'tags', 'styles', 'moods'].includes(key)) {
      return `<div class="libmgr-tags-wrap">${items.map(t => `<span class="libmgr-tag">${esc(t)}</span>`).join('')}</div>`;
    }
    return esc(items.slice(0, 8).join(', '));
  }
  if (typeof val === 'object') {
    return esc(JSON.stringify(val).slice(0, 120));
  }
  if (typeof val === 'number' && val > 1_000_000) {
    return esc(val.toLocaleString('nl'));
  }
  return esc(String(val));
}

function _renderAlbumsList() {
  if (!_artistDetail?.albums?.length) return '';
  const items = _artistDetail.albums.slice(0, 12).map(a => {
    const thumbSrc = a.thumb ? `/api/plex/thumb?path=${encodeURIComponent(a.thumb)}` : '';
    const thumbImg = thumbSrc
      ? `<img class="libmgr-album-thumb" src="${esc(thumbSrc)}" alt="" loading="lazy" onerror="this.style.display='none'">`
      : `<div class="libmgr-album-thumb"></div>`;
    return `<div class="libmgr-album-row">
      ${thumbImg}
      <div class="libmgr-album-name">${esc(a.album)}</div>
      ${a.ratingKey ? `<button class="libmgr-album-write" data-action="tag-preview" data-key="${esc(a.ratingKey)}" data-type="album" title="Tags bekijken">🏷 Tags</button>` : ''}
    </div>`;
  });
  return `<div class="libmgr-albums-section">
    <div class="libmgr-albums-title">Albums in Plex (${_artistDetail.albums.length})</div>
    ${items.join('')}
  </div>`;
}

function _cleanBio(text) {
  return String(text).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().slice(0, 1500);
}

// ═══════════════════════════════════════════════════════════════════════════════
// Diff modal
// ═══════════════════════════════════════════════════════════════════════════════
async function _openDiffModal(ratingKey, type = 'album') {
  const overlay = document.getElementById('libmgr-overlay');
  const tbody   = document.getElementById('libmgr-diff-tbody');
  const srcEl   = document.getElementById('libmgr-modal-src');
  const confirm = document.getElementById('libmgr-modal-confirm');

  if (!overlay || !tbody) return;
  overlay.style.display = 'flex';
  tbody.innerHTML = `<tr><td colspan="4" style="padding:20px;text-align:center"><div class="libmgr-spinner" style="margin:auto"></div></td></tr>`;
  if (confirm) confirm.disabled = true;

  try {
    const data = await apiFetch(`/api/library/tag-preview/${ratingKey}?type=${type}`);
    _diffState   = { ratingKey, type, diff: data.diff, proposed: data.proposed };
    _diffChecked = {};
    data.diff.forEach(row => { _diffChecked[row.field] = row.changed; });

    if (srcEl && data.proposedSource) {
      srcEl.textContent = `Bron: ${SOURCE_LABELS[data.proposedSource] || data.proposedSource}`;
    }

    tbody.innerHTML = data.diff.map(row => {
      const cls = row.changed ? 'diff-row-changed' : 'diff-row-same';
      const proDisplay = row.field === 'genres'
        ? _diffGenreTags(row.current, row.proposed)
        : (row.changed ? `<span class="diff-new">${esc(row.proposed) || '—'}</span>` : esc(row.current) || '—');
      return `<tr class="${cls}">
        <td><strong>${esc(row.label)}</strong></td>
        <td class="diff-cur">${esc(row.current) || '—'}</td>
        <td>${proDisplay}</td>
        <td><input type="checkbox" class="diff-check" data-field="${esc(row.field)}"
          ${_diffChecked[row.field] ? 'checked' : ''} ${!row.changed ? 'disabled' : ''}></td>
      </tr>`;
    }).join('');

    if (confirm) confirm.disabled = false;
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="4" style="padding:16px;color:var(--red)">Fout: ${esc(err.message)}</td></tr>`;
  }
}

function _diffGenreTags(current, proposed) {
  const cur  = current.split(',').map(s => s.trim()).filter(Boolean);
  const pro  = proposed.split(',').map(s => s.trim()).filter(Boolean);
  const curSet = new Set(cur);
  const proSet = new Set(pro);
  const all  = [...new Set([...cur, ...pro])];
  return all.map(t => {
    const cls = !curSet.has(t) ? 'diff-tag-added' : !proSet.has(t) ? 'diff-tag-removed' : 'diff-tag-same';
    return `<span class="diff-tag ${cls}">${esc(t)}</span>`;
  }).join('');
}

async function _confirmDiff() {
  if (!_diffState) return;
  const btn = document.getElementById('libmgr-modal-confirm');
  if (btn) { btn.disabled = true; btn.textContent = 'Bezig…'; }

  // Bouw fields op basis van aangevinkte diff-rijen
  const fields = {};
  document.querySelectorAll('.diff-check').forEach(cb => {
    if (cb.checked && _diffState.proposed) {
      const field = cb.dataset.field;
      const val   = _diffState.proposed[field];
      if (val !== undefined) fields[field] = val;
    }
  });

  if (!Object.keys(fields).length) {
    _closeModal();
    return;
  }

  try {
    const endpoint = _diffState.type === 'album'
      ? `/api/library/album/${_diffState.ratingKey}/retag`
      : `/api/library/track/${_diffState.ratingKey}/retag`;
    await apiFetch(endpoint, { method: 'POST', body: JSON.stringify({ fields }), headers: { 'Content-Type': 'application/json' } });
    _closeModal();
    _showToast('Tags succesvol geschreven ✓');
  } catch (err) {
    _showToast(`Fout: ${err.message}`, 'error');
    if (btn) { btn.disabled = false; btn.textContent = 'Tags Schrijven'; }
  }
}

function _closeModal() {
  const overlay = document.getElementById('libmgr-overlay');
  if (overlay) overlay.style.display = 'none';
  _diffState = null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Event bindings
// ═══════════════════════════════════════════════════════════════════════════════
function _bindEvents() {
  const root = document.getElementById('libmgr-root');
  if (!root) return;

  // Mode toggle (Standaard / Uitgebreid)
  root.querySelectorAll('.libmgr-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.mode === 'standard') {
        window.location.hash = 'bibliotheek';
      }
    });
  });

  // Zoeken
  const searchEl = document.getElementById('libmgr-search');
  if (searchEl) {
    searchEl.addEventListener('input', e => {
      _searchTerm = e.target.value;
      _applyFilter();
    });
  }

  // Tabel klikken (delegatie)
  const tbody = document.getElementById('libmgr-tbody');
  if (tbody) {
    tbody.addEventListener('click', async e => {
      const actionBtn = e.target.closest('[data-action]');
      if (actionBtn) {
        const { action, artist, key, type } = actionBtn.dataset;
        if (action === 'enrich' && artist) {
          await _enrichArtist(artist);
        } else if (action === 'tag-preview' && key) {
          await _openDiffModal(key, type || 'album');
        }
        return;
      }
      const row = e.target.closest('tr[data-artist]');
      if (row) _selectArtist(row.dataset.artist);
    });
  }

  // Panel sluiten
  const closeBtn = document.getElementById('libmgr-panel-close');
  if (closeBtn) closeBtn.addEventListener('click', _closePanel);

  // Source tabs (delegatie)
  const tabsEl = document.getElementById('libmgr-source-tabs');
  if (tabsEl) {
    tabsEl.addEventListener('click', e => {
      const tab = e.target.closest('[data-source]');
      if (tab) {
        _activeSource = tab.dataset.source;
        _renderSourceTabs(_artistDetail?.enrichmentData);
        _renderSourceContent(_artistDetail?.enrichmentData);
      }
    });
  }

  // Panel knoppen
  const enrichBtn = document.getElementById('libmgr-btn-enrich');
  if (enrichBtn) enrichBtn.addEventListener('click', () => _selected && _enrichArtist(_selected));

  const saveBtn = document.getElementById('libmgr-btn-save-manual');
  if (saveBtn) saveBtn.addEventListener('click', _saveManualEdit);

  // Source content klikken (bio toggle, album write)
  const contentEl = document.getElementById('libmgr-source-content');
  if (contentEl) {
    contentEl.addEventListener('click', async e => {
      if (e.target.id === 'libmgr-bio-toggle') {
        const bio = document.getElementById('libmgr-bio');
        if (bio) {
          bio.classList.toggle('expanded');
          e.target.textContent = bio.classList.contains('expanded') ? 'Minder tonen ▴' : 'Meer tonen ▾';
        }
      }
      const actionBtn = e.target.closest('[data-action]');
      if (actionBtn) {
        const { action, key, type } = actionBtn.dataset;
        if (action === 'tag-preview' && key) await _openDiffModal(key, type || 'album');
        if (action === 'enrich' && actionBtn.dataset.artist) await _enrichArtist(actionBtn.dataset.artist);
      }
    });
    // Inline editing: dubbelklik om te bewerken
    contentEl.addEventListener('dblclick', e => {
      const field = e.target.closest('[data-edit-key]');
      if (field) {
        field.contentEditable = 'true';
        field.focus();
        const range = document.createRange();
        range.selectNodeContents(field);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    });
    contentEl.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        const field = e.target.closest('[contenteditable="true"]');
        if (field) {
          field.contentEditable = 'false';
          field.textContent = field.dataset.editOriginal || '';
        }
      }
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        e.target.closest('[contenteditable="true"]')?.blur();
      }
    });
    contentEl.addEventListener('blur', e => {
      const field = e.target.closest('[data-edit-key]');
      if (field && field.contentEditable === 'true') {
        field.contentEditable = 'false';
        field.dataset.editOriginal = field.textContent;
      }
    }, true);
  }

  // Sorteren (thead delegatie)
  const thead = root.querySelector('thead');
  if (thead) {
    thead.addEventListener('click', e => {
      const th = e.target.closest('[data-col]');
      if (!th) return;
      const col = th.dataset.col;
      if (_sortCol === col) { _sortDir *= -1; }
      else { _sortCol = col; _sortDir = 1; }
      _updateSortIndicators();
      _sortArtists();
      _renderTable();
    });
  }

  // Settings knop
  const settingsBtn = document.getElementById('libmgr-settings-btn');
  const settingsPanel = document.getElementById('libmgr-settings-panel');
  if (settingsBtn && settingsPanel) {
    settingsBtn.addEventListener('click', () => {
      _showSettings = !_showSettings;
      settingsPanel.style.display = _showSettings ? 'block' : 'none';
      settingsBtn.classList.toggle('active', _showSettings);
    });
  }

  const saveSettingsBtn = document.getElementById('libmgr-settings-save');
  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener('click', async () => {
      const sep  = document.getElementById('libmgr-sep')?.value;
      const feat = document.getElementById('libmgr-feat')?.checked;
      try {
        await apiFetch('/api/library/settings', {
          method: 'POST',
          body: JSON.stringify({ artist_separator: sep, feat_to_title: feat }),
          headers: { 'Content-Type': 'application/json' },
        });
        _settings = { artist_separator: sep, feat_to_title: feat };
        _showToast('Instellingen opgeslagen ✓');
        if (settingsPanel) settingsPanel.style.display = 'none';
        _showSettings = false;
      } catch (err) {
        _showToast(`Fout: ${err.message}`, 'error');
      }
    });
  }

  // Diff modal knoppen
  const modalClose   = document.getElementById('libmgr-modal-close');
  const modalCancel  = document.getElementById('libmgr-modal-cancel');
  const modalConfirm = document.getElementById('libmgr-modal-confirm');
  if (modalClose)   modalClose.addEventListener('click',   _closeModal);
  if (modalCancel)  modalCancel.addEventListener('click',  _closeModal);
  if (modalConfirm) modalConfirm.addEventListener('click', _confirmDiff);

  // Overlay klik buiten modal sluiten
  const overlay = document.getElementById('libmgr-overlay');
  if (overlay) {
    overlay.addEventListener('click', e => { if (e.target === overlay) _closeModal(); });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════════════
function _selectArtist(name) {
  _selected = name;
  // Update selected row highlight
  document.querySelectorAll('#libmgr-tbody tr').forEach(tr => {
    tr.classList.toggle('selected', tr.dataset.artist === name);
  });
  // Open panel
  const body = document.getElementById('libmgr-body');
  if (body) body.classList.add('libmgr-panel-open');
  _loadArtistDetail(name);
}

function _closePanel() {
  _selected     = null;
  _artistDetail = null;
  const body = document.getElementById('libmgr-body');
  if (body) body.classList.remove('libmgr-panel-open');
  document.querySelectorAll('#libmgr-tbody tr').forEach(tr => tr.classList.remove('selected'));
}

async function _enrichArtist(name) {
  try {
    await apiFetch(`/api/core/enrichment/queue/artist/${encodeURIComponent(name)}`, { method: 'POST' });
    _showToast(`${name} toegevoegd aan enrichment-queue ✓`);
  } catch (err) {
    _showToast(`Fout: ${err.message}`, 'error');
  }
}

async function _saveManualEdit() {
  if (!_selected) return;
  const fields = {};
  document.querySelectorAll('[data-edit-key]').forEach(el => {
    const val = el.textContent.trim();
    if (val) fields[el.dataset.editKey] = val;
  });
  if (!Object.keys(fields).length) return;
  try {
    await apiFetch(`/api/library/artist/${encodeURIComponent(_selected)}/edit`, {
      method: 'POST',
      body: JSON.stringify(fields),
      headers: { 'Content-Type': 'application/json' },
    });
    _showToast('Handmatige edit opgeslagen ✓');
    // Herlaad detail
    await _loadArtistDetail(_selected);
  } catch (err) {
    _showToast(`Fout: ${err.message}`, 'error');
  }
}

function _updateSortIndicators() {
  ['name', 'albumCount', 'enrichmentCoverage'].forEach(col => {
    const el = document.getElementById(`libmgr-sort-${col}`);
    const th = document.querySelector(`[data-col="${col}"]`);
    if (!el) return;
    if (col === _sortCol) {
      el.textContent  = _sortDir === 1 ? '↑' : '↓';
      th?.classList.add('sort-active');
    } else {
      el.textContent  = '';
      th?.classList.remove('sort-active');
    }
  });
}

let _toastTimer;
function _showToast(msg, type = 'ok') {
  let toast = document.getElementById('libmgr-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'libmgr-toast';
    toast.style.cssText = 'position:fixed;bottom:24px;right:24px;padding:10px 18px;border-radius:6px;font-size:13px;z-index:9999;transition:opacity .3s;pointer-events:none;';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.background = type === 'error' ? 'var(--red)' : 'var(--green)';
  toast.style.color = '#fff';
  toast.style.opacity = '1';
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => { toast.style.opacity = '0'; }, 3000);
}
