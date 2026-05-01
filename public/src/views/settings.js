// ── Settings view ──────────────────────────────────────────────────────────
// Volledige instellingenpagina met 8 tabs. Alle data wordt opgeslagen in
// SQLite via /api/settings. .env waarden zijn read-only informatief.

import { apiFetch } from '../api.js';
import { esc } from '../helpers.js';

// ── Globale state voor deze view ───────────────────────────────────────────
let _settings = {};   // { category: { key: value } }
let _env      = {};   // read-only .env info
let _activeTab = 'algemeen';

// ── Toast helper ───────────────────────────────────────────────────────────
function showSettingsToast(msg, type = 'ok') {
  let toast = document.getElementById('settings-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'settings-toast';
    toast.className = 'settings-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.className = `settings-toast${type === 'error' ? ' error' : ''}`;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('visible'));
  });
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('visible'), 2800);
}

// ── API helpers ────────────────────────────────────────────────────────────
async function fetchSettings() {
  const data = await apiFetch('/api/settings');
  _settings = data.categories || {};
  _env      = data.env        || {};
}

async function saveCategory(category, values) {
  await apiFetch(`/api/settings/${category}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(values),
  });
}

// ── Helpers ────────────────────────────────────────────────────────────────
function get(category, key, fallback = '') {
  return _settings[category]?.[key] ?? fallback;
}

function toggleHtml(category, key, defaultVal = false) {
  const checked = get(category, key, defaultVal) === true || get(category, key, defaultVal) === 'true';
  const id = `stg-${category}-${key}`;
  return `
    <label class="settings-toggle" title="">
      <input type="checkbox" id="${id}" data-cat="${esc(category)}" data-key="${esc(key)}" ${checked ? 'checked' : ''}>
      <span class="settings-toggle-track"></span>
    </label>`;
}

function selectHtml(category, key, options, defaultVal = '') {
  const val = get(category, key, defaultVal);
  const id  = `stg-${category}-${key}`;
  const opts = options.map(o =>
    typeof o === 'string'
      ? `<option value="${esc(o)}" ${val === o ? 'selected' : ''}>${esc(o)}</option>`
      : `<option value="${esc(o.value)}" ${val === o.value ? 'selected' : ''}>${esc(o.label)}</option>`
  ).join('');
  return `<select class="settings-select" id="${id}" data-cat="${esc(category)}" data-key="${esc(key)}">${opts}</select>`;
}

function inputHtml(category, key, opts = {}) {
  const { type = 'text', placeholder = '', readonly = false, cls = '' } = opts;
  const val = get(category, key, opts.defaultVal ?? '');
  const id  = `stg-${category}-${key}`;
  return `<input
    class="settings-input ${cls}"
    id="${id}"
    type="${esc(type)}"
    placeholder="${esc(placeholder)}"
    value="${esc(String(val))}"
    data-cat="${esc(category)}"
    data-key="${esc(key)}"
    ${readonly ? 'readonly' : ''}>`;
}

function sliderHtml(category, key, { min = 0, max = 100, step = 1, unit = '', defaultVal = 50 } = {}) {
  const val = Number(get(category, key, defaultVal));
  const id  = `stg-${category}-${key}`;
  return `
    <div class="settings-slider-wrap">
      <input
        class="settings-slider"
        id="${id}"
        type="range"
        min="${min}" max="${max}" step="${step}"
        value="${val}"
        data-cat="${esc(category)}"
        data-key="${esc(key)}"
        data-unit="${esc(unit)}">
      <span class="settings-slider-value" id="${id}-val">${val}${unit}</span>
    </div>`;
}

function statusDot(status) {
  const cls = status === 'ok' ? 'ok' : status === 'loading' ? 'loading' : status === 'error' ? 'error' : 'idle';
  const label = status === 'ok' ? 'Verbonden' : status === 'loading' ? 'Testen…' : status === 'error' ? 'Niet bereikbaar' : 'Onbekend';
  return `<span class="settings-status"><span class="settings-status-dot ${cls}"></span>${label}</span>`;
}

function saveBtn(category) {
  return `<button class="settings-btn settings-btn-primary settings-save-btn" data-cat="${esc(category)}">Opslaan</button>`;
}

// ── Tab: Algemeen ──────────────────────────────────────────────────────────
function renderAlgemeen() {
  const views = [
    { value: 'home',       label: 'Home' },
    { value: 'albums',     label: 'Albums' },
    { value: 'artists',    label: 'Artists' },
    { value: 'ontdek',     label: 'Ontdek' },
    { value: 'nu',         label: 'Nu Bezig' },
    { value: 'downloads',  label: 'Downloads' },
    { value: 'releases',   label: 'Nieuwe Releases' },
    { value: 'stats',      label: 'Statistieken' },
  ];

  return `
  <div class="settings-panel active" id="tab-algemeen">
    <div class="settings-card">
      <h3 class="settings-card-title">Weergave & Navigatie</h3>
      <div class="settings-group">
        <div class="settings-row">
          <div class="settings-row-label">
            <strong>Taal</strong>
            <span>Interface taal (herstart vereist)</span>
          </div>
          <div class="settings-row-control">
            ${selectHtml('algemeen', 'language', [
              { value: 'nl', label: 'Nederlands' },
              { value: 'en', label: 'English' },
            ], 'nl')}
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label">
            <strong>Thema</strong>
            <span>Kleurschema van de interface</span>
          </div>
          <div class="settings-row-control">
            ${selectHtml('algemeen', 'theme', [
              { value: 'light', label: 'Licht' },
              { value: 'dark',  label: 'Donker' },
              { value: 'auto',  label: 'Systeem (auto)' },
            ], 'light')}
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label">
            <strong>Startpagina</strong>
            <span>Welke view wordt geladen bij opstarten</span>
          </div>
          <div class="settings-row-control">
            ${selectHtml('algemeen', 'startView', views, 'home')}
          </div>
        </div>
      </div>
    </div>

    <div class="settings-card">
      <h3 class="settings-card-title">Sidebar items</h3>
      <div class="settings-group">
        ${[
          { key: 'showGenres',    label: 'Genres',          desc: 'Genre browser in de sidebar' },
          { key: 'showRadio',     label: 'Live Radio',       desc: 'Live radio tab' },
          { key: 'showHistory',   label: 'History',          desc: 'Afspeel-geschiedenis' },
          { key: 'showStats',     label: 'Statistieken',     desc: 'Last.fm statistieken' },
          { key: 'showComposers', label: 'Componisten',      desc: 'Klassieke muziek componisten' },
          { key: 'showFolders',   label: 'Folders',          desc: 'Bestandsmappen browser' },
          { key: 'showTags',      label: 'Tags',             desc: 'Genre tags overzicht' },
          { key: 'showMediaSage', label: 'MediaSage AI',     desc: 'AI aanbevelingen tools' },
        ].map(item => `
          <div class="settings-row">
            <div class="settings-row-label">
              <strong>${esc(item.label)}</strong>
              <span>${esc(item.desc)}</span>
            </div>
            <div class="settings-row-control">
              ${toggleHtml('sidebar', item.key, true)}
            </div>
          </div>`).join('')}
      </div>
      <div class="settings-save-row">${saveBtn('algemeen')}${saveBtn('sidebar')}</div>
    </div>
  </div>`;
}

// ── Tab: Verbindingen ──────────────────────────────────────────────────────
function renderVerbindingen() {
  const lastfm  = _env.lastfm  || {};
  const plex    = _env.plex    || {};
  const spotify = _env.spotify || {};
  const tidarr  = _env.tidarr  || {};
  const orpheus = _env.orpheus || {};

  return `
  <div class="settings-panel" id="tab-verbindingen">

    <div class="settings-card">
      <h3 class="settings-card-title">Last.fm</h3>
      <div class="settings-group">
        <div class="settings-row">
          <div class="settings-row-label"><strong>API Key</strong><span>Geconfigureerd in .env (read-only)</span></div>
          <div class="settings-row-control">
            <input class="settings-input settings-input-sm" type="text" value="${esc(lastfm.api_key || '—')}" readonly>
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label"><strong>Gebruikersnaam</strong><span>Last.fm account</span></div>
          <div class="settings-row-control">
            <input class="settings-input settings-input-sm" type="text" value="${esc(lastfm.username || '—')}" readonly>
          </div>
        </div>
      </div>
      <div class="settings-info">ℹ️ Last.fm inloggegevens worden beheerd via de <code>.env</code> omgevingsvariabelen op de server.</div>
    </div>

    <div class="settings-card" id="enrichment-settings-card">
      <h3 class="settings-card-title">Metadata Enrichment</h3>
      <div class="settings-group" id="enrichment-settings-form">
        <div class="settings-row">
          <div class="settings-row-label"><strong>Genius API Key</strong><span>Songteksten + artiest bio (gratis via genius.com/api-clients)</span></div>
          <div class="settings-row-control">
            <input class="settings-input settings-input-sm" type="password" id="enr-genius-key" placeholder="Voer API key in…">
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label"><strong>Discogs Token</strong><span>Optioneel — hogere rate limit (60/min)</span></div>
          <div class="settings-row-control">
            <input class="settings-input settings-input-sm" type="password" id="enr-discogs-token" placeholder="Persoonlijk token…">
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label"><strong>Discogs User-Agent</strong><span>Verplicht voor Discogs API</span></div>
          <div class="settings-row-control">
            <input class="settings-input" type="text" id="enr-discogs-ua" value="LastfmMuziekApp/1.0">
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label"><strong>Genre Whitelist Filter</strong><span>Filter ongeldige genres uit alle enrichment-data</span></div>
          <div class="settings-row-control">
            <label class="settings-toggle">
              <input type="checkbox" id="enr-genre-filter">
              <span class="settings-toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>

      <h4 style="font-size:var(--text-sm);font-weight:600;color:var(--text-secondary);margin:var(--space-4) 0 var(--space-3);">Workers in-/uitschakelen</h4>
      <div class="settings-group">
        ${['itunes', 'discogs', 'audiodb', 'genius', 'tidal', 'qobuz'].map(src => `
        <div class="settings-row">
          <div class="settings-row-label"><strong>${esc(src.charAt(0).toUpperCase() + src.slice(1))}</strong></div>
          <div class="settings-row-control">
            <label class="settings-toggle">
              <input type="checkbox" class="enr-worker-toggle" data-source="${esc(src)}" checked>
              <span class="settings-toggle-slider"></span>
            </label>
          </div>
        </div>`).join('')}
      </div>

      <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;">
        <button class="settings-btn settings-btn-primary" id="save-enrichment-settings">Opslaan</button>
        <button class="settings-btn settings-btn-secondary" id="enr-manage-genres">Genre Whitelist Beheren</button>
      </div>
      <div id="enrichment-settings-msg" style="font-size:12px;margin-top:8px;min-height:16px;color:var(--color-accent)"></div>
    </div>

    <div class="settings-card">
      <h3 class="settings-card-title">Plex</h3>
      <div class="settings-group">
        <div class="settings-row">
          <div class="settings-row-label"><strong>Server URL</strong><span>Geconfigureerd in .env (read-only)</span></div>
          <div class="settings-row-control">
            <input class="settings-input" type="url" value="${esc(plex.url || '—')}" readonly>
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label"><strong>Token</strong><span>Plex authenticatie token</span></div>
          <div class="settings-row-control">
            <input class="settings-input settings-input-sm" type="text" value="${esc(plex.token || '—')}" readonly>
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label"><strong>Verbindingsstatus</strong></div>
          <div class="settings-row-control">
            <span id="plex-status-dot">${statusDot('idle')}</span>
            <button class="settings-btn settings-btn-secondary" id="test-plex-btn">Test</button>
          </div>
        </div>
      </div>
    </div>

    <div class="settings-card">
      <h3 class="settings-card-title">Spotify</h3>
      <div class="settings-group">
        <div class="settings-row">
          <div class="settings-row-label"><strong>Client ID</strong><span>Geconfigureerd in .env (read-only)</span></div>
          <div class="settings-row-control">
            <input class="settings-input settings-input-sm" type="text" value="${esc(spotify.client_id || '—')}" readonly>
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label"><strong>Client Secret</strong></div>
          <div class="settings-row-control">
            <input class="settings-input settings-input-sm" type="password" value="${spotify.client_secret ? '••••••••' : '—'}" readonly>
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label"><strong>Status</strong></div>
          <div class="settings-row-control">
            ${spotify.configured ? statusDot('ok') : statusDot('error')}
            <button class="settings-btn settings-btn-secondary" id="test-spotify-btn">Test</button>
          </div>
        </div>
      </div>
    </div>

    <div class="settings-card">
      <h3 class="settings-card-title">Tidarr</h3>
      <div class="settings-group">
        <div class="settings-row">
          <div class="settings-row-label"><strong>URL</strong><span>Intern Tidarr adres</span></div>
          <div class="settings-row-control">
            <input class="settings-input" type="url" value="${esc(tidarr.url || 'http://localhost:8484')}" readonly>
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label"><strong>API Key</strong></div>
          <div class="settings-row-control">
            <input class="settings-input settings-input-sm" type="text" value="${esc(tidarr.api_key || '—')}" readonly>
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label"><strong>Verbindingsstatus</strong></div>
          <div class="settings-row-control">
            <span id="tidarr-status-dot">${statusDot('idle')}</span>
            <button class="settings-btn settings-btn-secondary" id="test-tidarr-btn">Test</button>
          </div>
        </div>
      </div>
    </div>

    <div class="settings-card">
      <h3 class="settings-card-title">OrpheusDL</h3>
      <div class="settings-group">
        <div class="settings-row">
          <div class="settings-row-label"><strong>URL</strong><span>OrpheusDL web UI adres</span></div>
          <div class="settings-row-control">
            <input class="settings-input" type="url" value="${esc(orpheus.url || 'http://localhost:5000')}" readonly>
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label"><strong>Verbindingsstatus</strong></div>
          <div class="settings-row-control">
            <span id="orpheus-status-dot">${statusDot('idle')}</span>
            <button class="settings-btn settings-btn-secondary" id="test-orpheus-btn">Test</button>
          </div>
        </div>
      </div>
      <h4 style="font-size:var(--text-sm);font-weight:600;color:var(--text-secondary);margin:var(--space-4) 0 var(--space-3);">Platform status</h4>
      <div class="settings-platform-grid" id="orpheus-platforms">
        ${['Tidal','Qobuz','Deezer','Spotify','SoundCloud','Apple Music','Beatport','Beatsource','YouTube'].map(p =>
          `<div class="settings-platform-item">
            <span class="settings-status-dot idle" id="plat-${p.toLowerCase().replace(' ','')}"></span>
            ${esc(p)}
          </div>`
        ).join('')}
      </div>
    </div>
  </div>`;
}

// ── Tab: Downloads ─────────────────────────────────────────────────────────
function renderDownloads() {
  const priority = (() => {
    try {
      const raw = get('downloads', 'sourcePriority', null);
      return raw ? JSON.parse(raw) : ['orpheus', 'tidarr'];
    } catch { return ['orpheus', 'tidarr']; }
  })();

  const sources = [
    { id: 'orpheus', label: 'OrpheusDL', badge: '9 platforms' },
    { id: 'tidarr',  label: 'Tidarr',    badge: 'Tidal' },
  ];

  // Sorteer op prioriteit
  const sortedSources = [...sources].sort((a, b) => {
    const ai = priority.indexOf(a.id);
    const bi = priority.indexOf(b.id);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  return `
  <div class="settings-panel" id="tab-downloads">

    <div class="settings-card">
      <h3 class="settings-card-title">Kwaliteit & Locatie</h3>
      <div class="settings-group">
        <div class="settings-row">
          <div class="settings-row-label">
            <strong>Standaard kwaliteit</strong>
            <span>Formaat voor nieuwe downloads</span>
          </div>
          <div class="settings-row-control">
            ${selectHtml('downloads', 'defaultQuality', [
              { value: 'lossless', label: 'FLAC (Lossless)' },
              { value: 'high',     label: 'MP3 320kbps' },
              { value: 'low',      label: 'MP3 128kbps' },
            ], 'lossless')}
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label">
            <strong>Download locatie</strong>
            <span>Pad naar de muziekmap op de server</span>
          </div>
          <div class="settings-row-control">
            ${inputHtml('downloads', 'downloadPath', { placeholder: '/music', cls: 'settings-input-full' })}
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label">
            <strong>Mapstructuur</strong>
            <span>Template voor mapindeling van downloads</span>
          </div>
          <div class="settings-row-control" style="flex-direction:column;align-items:flex-start;gap:8px;">
            ${inputHtml('downloads', 'folderTemplate', {
              placeholder: '$albumartist/$year - $album',
              defaultVal:  '$albumartist/$year - $album',
              cls: 'settings-input-full'
            })}
            <div class="settings-var-ref">
              ${['$albumartist','$artist','$album','$title','$track','$year','$genre','$quality']
                .map(v => `<span class="settings-var-chip">${v}</span>`).join('')}
            </div>
          </div>
        </div>
      </div>
      <div class="settings-save-row">${saveBtn('downloads')}</div>
    </div>

    <div class="settings-card">
      <h3 class="settings-card-title">Download-bron prioriteit</h3>
      <p style="font-size:var(--text-xs);color:var(--text-muted);margin:0 0 var(--space-4)">
        Sleep de bronnen in de gewenste volgorde. Hogere positie = hogere prioriteit.
      </p>
      <ul class="settings-drag-list" id="source-priority-list">
        ${sortedSources.map(s => {
          const enabled = get('downloads', `${s.id}Enabled`, true) !== false;
          return `
          <li class="settings-drag-item" draggable="true" data-source="${esc(s.id)}">
            <span class="settings-drag-handle">⠿</span>
            <span class="settings-drag-item-label">${esc(s.label)}</span>
            <span class="settings-drag-item-badge">${esc(s.badge)}</span>
            <label class="settings-toggle" style="margin-left:auto">
              <input type="checkbox" class="source-enabled-toggle" data-source="${esc(s.id)}" ${enabled ? 'checked' : ''}>
              <span class="settings-toggle-track"></span>
            </label>
          </li>`;
        }).join('')}
      </ul>

      <div class="settings-row" style="margin-top:var(--space-4)">
        <div class="settings-row-label">
          <strong>Hybrid mode</strong>
          <span>Automatisch naar volgende bron als download mislukt</span>
        </div>
        <div class="settings-row-control">
          ${toggleHtml('downloads', 'hybridMode', true)}
        </div>
      </div>

      <div class="settings-save-row">${saveBtn('downloads')}</div>
    </div>
  </div>`;
}

// ── Tab: Post-Processing ───────────────────────────────────────────────────
function renderPostProcessing() {
  const lossyCopy = get('postprocess', 'lossyCopy', false) === true || get('postprocess', 'lossyCopy', false) === 'true';

  return `
  <div class="settings-panel" id="tab-postprocess">
    <div class="settings-card">
      <h3 class="settings-card-title">Audio Conversie</h3>
      <div class="settings-group">
        <div class="settings-row">
          <div class="settings-row-label">
            <strong>Lossy kopie aanmaken</strong>
            <span>Maak naast FLAC ook een gecomprimeerde kopie</span>
          </div>
          <div class="settings-row-control">
            ${toggleHtml('postprocess', 'lossyCopy', false)}
          </div>
        </div>
        <div id="lossy-options" style="${lossyCopy ? '' : 'display:none'}">
          <div class="settings-row">
            <div class="settings-row-label">
              <strong>Lossy formaat</strong>
            </div>
            <div class="settings-row-control">
              ${selectHtml('postprocess', 'lossyFormat', [
                { value: 'mp3',  label: 'MP3' },
                { value: 'opus', label: 'Opus' },
                { value: 'aac',  label: 'AAC' },
              ], 'mp3')}
            </div>
          </div>
          <div class="settings-row">
            <div class="settings-row-label">
              <strong>Bitrate</strong>
            </div>
            <div class="settings-row-control">
              ${sliderHtml('postprocess', 'lossyBitrate', { min: 128, max: 320, step: 64, unit: 'kbps', defaultVal: 320 })}
            </div>
          </div>
        </div>

        <div class="settings-row">
          <div class="settings-row-label">
            <strong>Hi-Res downsampling</strong>
            <span>Converteer 24-bit → 16-bit / 44.1kHz voor compatibiliteit</span>
          </div>
          <div class="settings-row-control">
            ${toggleHtml('postprocess', 'hiresDownsample', false)}
          </div>
        </div>
      </div>
    </div>

    <div class="settings-card">
      <h3 class="settings-card-title">Metadata & Kwaliteit</h3>
      <div class="settings-group">
        <div class="settings-row">
          <div class="settings-row-label">
            <strong>ReplayGain</strong>
            <span>Normaliseer afspeelvolume tussen tracks en albums</span>
          </div>
          <div class="settings-row-control">
            ${toggleHtml('postprocess', 'replaygain', false)}
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label">
            <strong>Synchronized lyrics (LRC)</strong>
            <span>Download tijdgestempelde songteksten indien beschikbaar</span>
          </div>
          <div class="settings-row-control">
            ${toggleHtml('postprocess', 'syncedLyrics', true)}
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label">
            <strong>Album consistentie check</strong>
            <span>Waarschuw als tracks van een album ontbreken of metadata verschilt</span>
          </div>
          <div class="settings-row-control">
            ${toggleHtml('postprocess', 'albumConsistency', true)}
          </div>
        </div>
      </div>
    </div>

    <div class="settings-card">
      <h3 class="settings-card-title">Opruimen</h3>
      <div class="settings-group">
        <div class="settings-row">
          <div class="settings-row-label">
            <strong>Blasphemy Mode</strong>
            <span>Verwijder het originele FLAC-bestand na lossy conversie</span>
          </div>
          <div class="settings-row-control">
            ${toggleHtml('postprocess', 'deleteOriginal', false)}
          </div>
        </div>
      </div>
      <div class="settings-warning" id="blasphemy-warning" style="${get('postprocess','deleteOriginal',false) ? '' : 'display:none'}">
        <span class="settings-warning-icon">⚠️</span>
        <span class="settings-warning-text">
          <strong>Let op!</strong> Het originele lossless bestand wordt permanent verwijderd na conversie.
          Dit is onomkeerbaar. Zorg dat je een backup hebt.
        </span>
      </div>
      <div class="settings-save-row">${saveBtn('postprocess')}</div>
    </div>
  </div>`;
}

// ── Tab: Discovery ─────────────────────────────────────────────────────────
function renderDiscovery() {
  const decades = ['1960s','1970s','1980s','1990s','2000s','2010s','2020s'];
  const savedDecades = (() => {
    try {
      const raw = get('discovery', 'activeDecades', null);
      return raw ? JSON.parse(raw) : ['1990s','2000s','2010s','2020s'];
    } catch { return ['1990s','2000s','2010s','2020s']; }
  })();

  const days = [
    { value: '1', label: 'Maandag' },
    { value: '2', label: 'Dinsdag' },
    { value: '3', label: 'Woensdag' },
    { value: '4', label: 'Donderdag' },
    { value: '5', label: 'Vrijdag' },
    { value: '6', label: 'Zaterdag' },
    { value: '0', label: 'Zondag' },
  ];

  return `
  <div class="settings-panel" id="tab-discovery">

    <div class="settings-card">
      <h3 class="settings-card-title">Discovery Weekly</h3>
      <div class="settings-group">
        <div class="settings-row">
          <div class="settings-row-label">
            <strong>Discovery Weekly</strong>
            <span>Wekelijkse aanbevelingen op basis van luistergeschiedenis</span>
          </div>
          <div class="settings-row-control">
            ${toggleHtml('discovery', 'weeklyEnabled', true)}
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label">
            <strong>Dag van de week</strong>
            <span>Wanneer wordt de lijst vernieuwd</span>
          </div>
          <div class="settings-row-control">
            ${selectHtml('discovery', 'weeklyDay', days, '1')}
          </div>
        </div>
      </div>
    </div>

    <div class="settings-card">
      <h3 class="settings-card-title">Release Radar</h3>
      <div class="settings-group">
        <div class="settings-row">
          <div class="settings-row-label">
            <strong>Release Radar</strong>
            <span>Automatisch nieuwe releases opsporen van artiesten in je bibliotheek</span>
          </div>
          <div class="settings-row-control">
            ${toggleHtml('discovery', 'radarEnabled', true)}
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label">
            <strong>Check interval</strong>
            <span>Hoe vaak controleren op nieuwe releases</span>
          </div>
          <div class="settings-row-control">
            ${selectHtml('discovery', 'radarInterval', [
              { value: '6',  label: 'Elke 6 uur' },
              { value: '12', label: 'Elke 12 uur' },
              { value: '24', label: 'Dagelijks' },
              { value: '48', label: 'Om de dag' },
              { value: '168',label: 'Wekelijks' },
            ], '24')}
          </div>
        </div>
      </div>
    </div>

    <div class="settings-card">
      <h3 class="settings-card-title">Afspeellijsten</h3>
      <div class="settings-group">
        <div class="settings-row">
          <div class="settings-row-label">
            <strong>Seizoensplaylists</strong>
            <span>Automatische playlists gebaseerd op het huidige seizoen</span>
          </div>
          <div class="settings-row-control">
            ${toggleHtml('discovery', 'seasonalPlaylists', true)}
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label">
            <strong>Decennium playlists</strong>
            <span>Actieve decennia voor retro-playlists</span>
          </div>
          <div class="settings-row-control"></div>
        </div>
        <div class="settings-checkbox-grid" id="decade-grid">
          ${decades.map(d => {
            const active = savedDecades.includes(d);
            return `<label class="settings-checkbox-pill${active ? ' checked' : ''}" data-decade="${esc(d)}">
              <input type="checkbox" ${active ? 'checked' : ''} value="${esc(d)}">
              ${esc(d)}
            </label>`;
          }).join('')}
        </div>

        <div class="settings-row" style="margin-top:var(--space-3)">
          <div class="settings-row-label">
            <strong>Genre playlists</strong>
            <span>Automatische playlists per muziekgenre</span>
          </div>
          <div class="settings-row-control">
            ${toggleHtml('discovery', 'genrePlaylists', true)}
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label">
            <strong>Max tracks per playlist</strong>
            <span>Maximaal aantal nummers in een automatische playlist</span>
          </div>
          <div class="settings-row-control">
            <input class="settings-number" type="number" min="10" max="200" step="5"
              id="stg-discovery-maxTracks" data-cat="discovery" data-key="maxTracks"
              value="${Number(get('discovery','maxTracks',50))}">
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label">
            <strong>Serendipity factor</strong>
            <span>Hoe "verrassend" de aanbevelingen zijn (0% = alleen bekende artiesten, 100% = maximale ontdekking)</span>
          </div>
          <div class="settings-row-control">
            ${sliderHtml('discovery', 'serendipity', { min: 0, max: 100, step: 5, unit: '%', defaultVal: 30 })}
          </div>
        </div>
      </div>
      <div class="settings-save-row">${saveBtn('discovery')}</div>
    </div>
  </div>`;
}

// ── Tab: Automatisering ────────────────────────────────────────────────────
function renderAutomatisering() {
  return `
  <div class="settings-panel" id="tab-automatisering">
    <div class="settings-card">
      <div class="settings-coming-soon">
        <div class="settings-coming-soon-icon">⚙️</div>
        <h3 class="settings-coming-soon-title">Automatisering</h3>
        <p class="settings-coming-soon-sub">Automatische taken, schema's en triggers komen binnenkort.</p>
      </div>
    </div>
  </div>`;
}

// ── Tab: Notificaties ──────────────────────────────────────────────────────
function renderNotificaties() {
  const events = [
    { key: 'notifNewRelease',    label: 'Nieuwe release',          desc: 'Artiest uit je bibliotheek heeft iets uitgebracht' },
    { key: 'notifDownloadDone',  label: 'Download voltooid',       desc: 'Een album is succesvol gedownload' },
    { key: 'notifLibraryScan',   label: 'Library scan klaar',      desc: 'Plex bibliotheek synchronisatie voltooid' },
    { key: 'notifError',         label: 'Fout opgetreden',         desc: 'Download of service fout' },
  ];

  return `
  <div class="settings-panel" id="tab-notificaties">

    <div class="settings-card">
      <h3 class="settings-card-title">Discord</h3>
      <div class="settings-group">
        <div class="settings-row">
          <div class="settings-row-label">
            <strong>Webhook URL</strong>
            <span>Discord kanaal webhook voor notificaties</span>
          </div>
          <div class="settings-row-control" style="flex:1">
            ${inputHtml('notifications', 'discordWebhook', { placeholder: 'https://discord.com/api/webhooks/...', cls: 'settings-input-full' })}
          </div>
        </div>
      </div>
      <div class="settings-save-row">
        <button class="settings-btn settings-btn-secondary" id="test-discord-btn">Test Discord</button>
        ${saveBtn('notifications')}
      </div>
    </div>

    <div class="settings-card">
      <h3 class="settings-card-title">Telegram</h3>
      <div class="settings-group">
        <div class="settings-row">
          <div class="settings-row-label">
            <strong>Bot Token</strong>
            <span>Van @BotFather op Telegram</span>
          </div>
          <div class="settings-row-control" style="flex:1">
            ${inputHtml('notifications', 'telegramToken', { placeholder: '123456:ABC-DEF...', cls: 'settings-input-full' })}
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label">
            <strong>Chat ID</strong>
            <span>Je Telegram chat of groep ID</span>
          </div>
          <div class="settings-row-control">
            ${inputHtml('notifications', 'telegramChatId', { placeholder: '-1001234567890', cls: 'settings-input-sm' })}
          </div>
        </div>
      </div>
      <div class="settings-save-row">
        <button class="settings-btn settings-btn-secondary" id="test-telegram-btn">Test Telegram</button>
        ${saveBtn('notifications')}
      </div>
    </div>

    <div class="settings-card">
      <h3 class="settings-card-title">Pushbullet</h3>
      <div class="settings-group">
        <div class="settings-row">
          <div class="settings-row-label">
            <strong>API Key</strong>
            <span>Van pushbullet.com/account</span>
          </div>
          <div class="settings-row-control" style="flex:1">
            ${inputHtml('notifications', 'pushbulletKey', { placeholder: 'o.xxxxxxxxxxxxxxxxxx', cls: 'settings-input-full' })}
          </div>
        </div>
      </div>
      <div class="settings-save-row">
        <button class="settings-btn settings-btn-secondary" id="test-pushbullet-btn">Test Pushbullet</button>
        ${saveBtn('notifications')}
      </div>
    </div>

    <div class="settings-card">
      <h3 class="settings-card-title">Notificatie types</h3>
      <div class="settings-group">
        ${events.map(e => `
          <div class="settings-row">
            <div class="settings-row-label">
              <strong>${esc(e.label)}</strong>
              <span>${esc(e.desc)}</span>
            </div>
            <div class="settings-row-control">
              ${toggleHtml('notifications', e.key, true)}
            </div>
          </div>`).join('')}
      </div>
      <div class="settings-save-row">${saveBtn('notifications')}</div>
    </div>
  </div>`;
}

// ── Tab: Onderhoud ─────────────────────────────────────────────────────────
function renderOnderhoud() {
  return `
  <div class="settings-panel" id="tab-onderhoud">

    <div class="settings-card">
      <h3 class="settings-card-title">Database</h3>
      <div class="settings-db-stats" id="db-stats">
        <div class="settings-db-stat">
          <span class="settings-db-stat-value" id="db-cache-count">…</span>
          <span class="settings-db-stat-label">Cache items</span>
        </div>
        <div class="settings-db-stat">
          <span class="settings-db-stat-value" id="db-wishlist-count">…</span>
          <span class="settings-db-stat-label">Wishlist items</span>
        </div>
        <div class="settings-db-stat">
          <span class="settings-db-stat-value" id="db-downloads-count">…</span>
          <span class="settings-db-stat-label">Download records</span>
        </div>
        <div class="settings-db-stat">
          <span class="settings-db-stat-value" id="db-settings-count">…</span>
          <span class="settings-db-stat-label">Instellingen</span>
        </div>
      </div>
      <div style="display:flex;gap:var(--space-2);flex-wrap:wrap;">
        <button class="settings-btn settings-btn-secondary" id="refresh-db-stats-btn">↻ Vernieuwen</button>
        <button class="settings-btn settings-btn-danger" id="clear-cache-btn">Cache leegmaken</button>
      </div>
    </div>

    <div class="settings-card">
      <h3 class="settings-card-title">Logging</h3>
      <div class="settings-group">
        <div class="settings-row">
          <div class="settings-row-label">
            <strong>Log niveau</strong>
            <span>Hoeveelheid detail in de server logs (herstart vereist)</span>
          </div>
          <div class="settings-row-control">
            ${selectHtml('onderhoud', 'logLevel', [
              { value: 'trace', label: 'Trace (meest detail)' },
              { value: 'debug', label: 'Debug' },
              { value: 'info',  label: 'Info (standaard)' },
              { value: 'warn',  label: 'Warn' },
              { value: 'error', label: 'Error' },
              { value: 'fatal', label: 'Fatal (minst detail)' },
            ], 'info')}
          </div>
        </div>
      </div>
      <div class="settings-save-row">${saveBtn('onderhoud')}</div>
    </div>

    <div class="settings-card">
      <h3 class="settings-card-title">Auto-backup</h3>
      <div class="settings-group">
        <div class="settings-row">
          <div class="settings-row-label">
            <strong>Auto-backup interval</strong>
            <span>Hoe vaak wordt de database automatisch geback-upt</span>
          </div>
          <div class="settings-row-control">
            ${selectHtml('onderhoud', 'backupInterval', [
              { value: 'never',   label: 'Nooit' },
              { value: 'daily',   label: 'Dagelijks' },
              { value: 'weekly',  label: 'Wekelijks' },
              { value: 'monthly', label: 'Maandelijks' },
            ], 'weekly')}
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label">
            <strong>Laatste backup</strong>
          </div>
          <div class="settings-row-control">
            <span style="font-size:var(--text-sm);color:var(--text-muted)" id="last-backup-date">—</span>
          </div>
        </div>
      </div>
      <div class="settings-save-row">${saveBtn('onderhoud')}</div>
    </div>
  </div>`;
}

// ── Tab definitie ──────────────────────────────────────────────────────────
const TABS = [
  { id: 'algemeen',      label: 'Algemeen',       render: renderAlgemeen },
  { id: 'verbindingen',  label: 'Verbindingen',   render: renderVerbindingen },
  { id: 'downloads',     label: 'Downloads',      render: renderDownloads },
  { id: 'postprocess',   label: 'Post-Processing',render: renderPostProcessing },
  { id: 'discovery',     label: 'Discovery',      render: renderDiscovery },
  { id: 'automatisering',label: 'Automatisering', render: renderAutomatisering },
  { id: 'notificaties',  label: 'Notificaties',   render: renderNotificaties },
  { id: 'onderhoud',     label: 'Onderhoud',      render: renderOnderhoud },
];

// ── Collecteer waarden uit het formulier ────────────────────────────────────
function collectCategory(category) {
  const values = {};

  // Tekst/getal/select inputs
  document.querySelectorAll(`[data-cat="${category}"]`).forEach(el => {
    if (!el.dataset.key) return;
    const key = el.dataset.key;
    if (el.type === 'checkbox') {
      values[key] = el.checked;
    } else if (el.type === 'range' || el.type === 'number') {
      values[key] = Number(el.value);
    } else {
      values[key] = el.value;
    }
  });

  return values;
}

// ── DB statistieken laden ───────────────────────────────────────────────────
async function loadDbStats() {
  try {
    const data = await apiFetch('/api/settings');
    const cats = data.categories || {};
    let settingsCount = 0;
    for (const cat of Object.values(cats)) {
      settingsCount += Object.keys(cat).length;
    }

    const el = (id) => document.getElementById(id);
    if (el('db-settings-count')) el('db-settings-count').textContent = settingsCount;

    // Haal download count op
    try {
      const dlData = await apiFetch('/api/downloads/history');
      if (el('db-downloads-count') && Array.isArray(dlData)) {
        el('db-downloads-count').textContent = dlData.length;
      }
    } catch { if (el('db-downloads-count')) el('db-downloads-count').textContent = '?'; }

    // Wishlist count
    try {
      const wlData = await apiFetch('/api/wishlist');
      if (el('db-wishlist-count') && Array.isArray(wlData)) {
        el('db-wishlist-count').textContent = wlData.length;
      }
    } catch { if (el('db-wishlist-count')) el('db-wishlist-count').textContent = '?'; }

    if (el('db-cache-count')) el('db-cache-count').textContent = '?';
  } catch (err) {
    console.warn('DB stats failed:', err);
  }
}

// ── Test verbinding ─────────────────────────────────────────────────────────
async function testConnection(dotId, endpoint) {
  const dot = document.getElementById(dotId);
  if (dot) dot.innerHTML = statusDot('loading');
  try {
    const data = await apiFetch(endpoint);
    const ok = data && (data.up !== false);
    if (dot) dot.innerHTML = statusDot(ok ? 'ok' : 'error');
  } catch {
    if (dot) dot.innerHTML = statusDot('error');
  }
}

// ── Drag-to-reorder ─────────────────────────────────────────────────────────
function initDragList() {
  const list = document.getElementById('source-priority-list');
  if (!list) return;

  let dragEl = null;

  list.querySelectorAll('.settings-drag-item').forEach(item => {
    item.addEventListener('dragstart', () => {
      dragEl = item;
      item.style.opacity = '0.5';
    });
    item.addEventListener('dragend', () => {
      item.style.opacity = '';
      dragEl = null;
      list.querySelectorAll('.settings-drag-item').forEach(i => i.classList.remove('drag-over'));
      // Sla nieuwe volgorde op
      const order = [...list.querySelectorAll('.settings-drag-item')].map(i => i.dataset.source);
      apiFetch('/api/settings/downloads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourcePriority: JSON.stringify(order) }),
      }).catch(() => {});
    });
    item.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (dragEl && dragEl !== item) {
        item.classList.add('drag-over');
        const rect = item.getBoundingClientRect();
        const mid  = rect.top + rect.height / 2;
        if (e.clientY < mid) {
          list.insertBefore(dragEl, item);
        } else {
          list.insertBefore(dragEl, item.nextSibling);
        }
      }
    });
    item.addEventListener('dragleave', () => item.classList.remove('drag-over'));
    item.addEventListener('drop', (e) => e.preventDefault());
  });
}

// ── Decade checkbox pills ───────────────────────────────────────────────────
function initDecadeGrid() {
  const grid = document.getElementById('decade-grid');
  if (!grid) return;

  grid.querySelectorAll('.settings-checkbox-pill').forEach(pill => {
    const input = pill.querySelector('input');
    if (!input) return;

    pill.addEventListener('click', (e) => {
      if (e.target === input) return; // Laat browser het afhandelen
      input.checked = !input.checked;
    });

    input.addEventListener('change', () => {
      pill.classList.toggle('checked', input.checked);
    });
  });
}

// ── Event listeners ─────────────────────────────────────────────────────────
function attachListeners() {
  const page = document.getElementById('settings-page');
  if (!page) return;

  // ── Tab knoppen ────────────────────────────────────────────────────────
  page.querySelectorAll('.settings-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      _activeTab = btn.dataset.tab;
      page.querySelectorAll('.settings-tab-btn').forEach(b => b.classList.toggle('active', b === btn));
      page.querySelectorAll('.settings-panel').forEach(p => p.classList.remove('active'));
      const target = document.getElementById(`tab-${_activeTab}`);
      if (target) target.classList.add('active');
    });
  });

  // ── Opslaan knoppen ────────────────────────────────────────────────────
  page.querySelectorAll('.settings-save-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const category = btn.dataset.cat;
      if (!category) return;

      btn.disabled = true;
      btn.textContent = 'Opslaan…';

      try {
        const values = collectCategory(category);

        // Speciale gevallen: decade grid
        if (category === 'discovery') {
          const pills = document.querySelectorAll('#decade-grid .settings-checkbox-pill input:checked');
          const decades = [...pills].map(p => p.value);
          values.activeDecades = JSON.stringify(decades);
        }

        await saveCategory(category, values);
        // Update lokale state
        _settings[category] = { ...(_settings[category] || {}), ...values };
        showSettingsToast('✓ Instellingen opgeslagen');
      } catch (err) {
        console.error('Save failed:', err);
        showSettingsToast('Opslaan mislukt: ' + err.message, 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Opslaan';
      }
    });
  });

  // ── Slider live-preview ────────────────────────────────────────────────
  page.querySelectorAll('.settings-slider').forEach(slider => {
    const valEl = document.getElementById(`${slider.id}-val`);
    if (valEl) {
      slider.addEventListener('input', () => {
        valEl.textContent = slider.value + (slider.dataset.unit || '');
      });
    }
  });

  // ── Lossy copy toggle ──────────────────────────────────────────────────
  const lossyToggle = document.getElementById('stg-postprocess-lossyCopy');
  const lossyOpts   = document.getElementById('lossy-options');
  if (lossyToggle && lossyOpts) {
    lossyToggle.addEventListener('change', () => {
      lossyOpts.style.display = lossyToggle.checked ? '' : 'none';
    });
  }

  // ── Blasphemy mode warning ─────────────────────────────────────────────
  const blasphemyToggle  = document.getElementById('stg-postprocess-deleteOriginal');
  const blasphemyWarning = document.getElementById('blasphemy-warning');
  if (blasphemyToggle && blasphemyWarning) {
    blasphemyToggle.addEventListener('change', () => {
      blasphemyWarning.style.display = blasphemyToggle.checked ? '' : 'none';
    });
  }

  // ── Verbinding testen ──────────────────────────────────────────────────
  document.getElementById('test-plex-btn')?.addEventListener('click', () =>
    testConnection('plex-status-dot', '/api/plex/status'));

  document.getElementById('test-tidarr-btn')?.addEventListener('click', async () => {
    const dot = document.getElementById('tidarr-status-dot');
    if (dot) dot.innerHTML = statusDot('loading');
    try {
      const data = await apiFetch('/api/tidarr/status');
      if (dot) dot.innerHTML = statusDot(data?.online ? 'ok' : 'error');
    } catch { if (dot) dot.innerHTML = statusDot('error'); }
  });

  document.getElementById('test-orpheus-btn')?.addEventListener('click', async () => {
    const dot = document.getElementById('orpheus-status-dot');
    if (dot) dot.innerHTML = statusDot('loading');
    try {
      const data = await apiFetch('/api/orpheus/status');
      if (dot) dot.innerHTML = statusDot(data?.online ? 'ok' : 'error');
    } catch { if (dot) dot.innerHTML = statusDot('error'); }
  });

  document.getElementById('test-spotify-btn')?.addEventListener('click', async () => {
    showSettingsToast('Spotify verbinding getest');
  });

  document.getElementById('test-discord-btn')?.addEventListener('click', async () => {
    const url = (document.getElementById('stg-notifications-discordWebhook')?.value || '').trim();
    if (!url) return showSettingsToast('Voer eerst een webhook URL in', 'error');
    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: '🎵 Muziekdashboard test notificatie' }),
      });
      showSettingsToast('✓ Discord test verstuurd');
    } catch (err) {
      showSettingsToast('Discord test mislukt', 'error');
    }
  });

  document.getElementById('test-telegram-btn')?.addEventListener('click', () =>
    showSettingsToast('Telegram test (nog niet geïmplementeerd)'));

  document.getElementById('test-pushbullet-btn')?.addEventListener('click', () =>
    showSettingsToast('Pushbullet test (nog niet geïmplementeerd)'));

  // ── Cache leegmaken ────────────────────────────────────────────────────
  document.getElementById('clear-cache-btn')?.addEventListener('click', async () => {
    const ok = confirm('Weet je zeker dat je de cache wilt leegmaken? De app is even langzamer totdat de cache opnieuw is gevuld.');
    if (!ok) return;
    try {
      await apiFetch('/api/cache/clear', { method: 'POST' });
      showSettingsToast('✓ Cache geleegd');
      loadDbStats();
    } catch {
      showSettingsToast('Cache leegmaken mislukt', 'error');
    }
  });

  // ── DB stats vernieuwen ────────────────────────────────────────────────
  document.getElementById('refresh-db-stats-btn')?.addEventListener('click', loadDbStats);

  // ── Enrichment Settings ────────────────────────────────────────────────
  _initEnrichmentSettings();

  // ── Drag list init ─────────────────────────────────────────────────────
  initDragList();
  initDecadeGrid();
}

/** Laad en initialiseer de enrichment settings UI. */
async function _initEnrichmentSettings() {
  try {
    const res  = await fetch('/api/enrichment/settings');
    if (!res.ok) return;
    const cfg  = await res.json();

    // Vul Genius API key veld (toon alleen placeholder als geconfigureerd)
    const geniusEl = document.getElementById('enr-genius-key');
    if (geniusEl && cfg.genius_api_key) geniusEl.placeholder = '••••••••••••••••';

    // Discogs token
    const discogsEl = document.getElementById('enr-discogs-token');
    if (discogsEl && cfg.discogs_token) discogsEl.placeholder = '••••••••••••••••';

    // Discogs user-agent
    const discogsUaEl = document.getElementById('enr-discogs-ua');
    if (discogsUaEl && cfg.discogs_user_agent) discogsUaEl.value = cfg.discogs_user_agent;

    // Genre filter toggle
    const genreFilterEl = document.getElementById('enr-genre-filter');
    if (genreFilterEl) genreFilterEl.checked = !!cfg.genre_filter_enabled;

    // Worker toggles
    document.querySelectorAll('.enr-worker-toggle').forEach(toggle => {
      const src   = toggle.dataset.source;
      const key   = `worker_${src}_enabled`;
      toggle.checked = cfg[key] !== false;
    });
  } catch (err) {
    console.warn('Enrichment settings load failed:', err);
  }

  // Opslaan
  document.getElementById('save-enrichment-settings')?.addEventListener('click', async () => {
    const msgEl = document.getElementById('enrichment-settings-msg');
    if (msgEl) msgEl.textContent = 'Opslaan…';

    const body = {};

    const geniusEl   = document.getElementById('enr-genius-key');
    const discogsEl  = document.getElementById('enr-discogs-token');
    const discogsUaEl = document.getElementById('enr-discogs-ua');
    const genreFilterEl = document.getElementById('enr-genre-filter');

    if (geniusEl?.value.trim())    body.genius_api_key   = geniusEl.value.trim();
    if (discogsEl?.value.trim())   body.discogs_token    = discogsEl.value.trim();
    if (discogsUaEl?.value.trim()) body.discogs_user_agent = discogsUaEl.value.trim();
    if (genreFilterEl)             body.genre_filter_enabled = genreFilterEl.checked;

    document.querySelectorAll('.enr-worker-toggle').forEach(toggle => {
      body[`worker_${toggle.dataset.source}_enabled`] = toggle.checked;
    });

    try {
      const res = await fetch('/api/enrichment/settings', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      if (msgEl) { msgEl.textContent = '✓ Opgeslagen!'; setTimeout(() => { if (msgEl) msgEl.textContent = ''; }, 3000); }
    } catch (err) {
      if (msgEl) msgEl.textContent = `Fout: ${err.message}`;
    }
  });

  // Genre Whitelist beheren
  document.getElementById('enr-manage-genres')?.addEventListener('click', () => _openGenreWhitelist());
}

/** Toon een inline genre whitelist beheerder. */
async function _openGenreWhitelist() {
  try {
    const res  = await fetch('/api/enrichment/genres');
    const data = await res.json();
    const genres = data.genres || [];

    const card = document.getElementById('enrichment-settings-card');
    if (!card) return;

    // Verwijder bestaand genre-panel
    document.getElementById('enr-genre-panel')?.remove();

    const panel = document.createElement('div');
    panel.id    = 'enr-genre-panel';
    panel.style.cssText = 'margin-top:16px;padding:14px;background:var(--color-bg2,rgba(128,128,128,.08));border-radius:8px;';

    const searchId = 'enr-genre-search-' + Date.now();
    panel.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
        <strong style="font-size:13px;">Genre Whitelist (${genres.length} genres)</strong>
        <button id="enr-genre-panel-close" style="background:none;border:none;cursor:pointer;font-size:16px;color:var(--color-muted)">✕</button>
      </div>
      <input id="${searchId}" type="search" placeholder="Zoek genre…" style="width:100%;font-size:12px;padding:5px 8px;border:1px solid var(--color-border,rgba(128,128,128,.2));border-radius:4px;background:var(--color-bg);color:var(--color-text);margin-bottom:8px;">
      <div id="enr-genre-list" style="max-height:220px;overflow-y:auto;display:flex;flex-wrap:wrap;gap:4px;">
        ${genres.map(g => `
          <label style="display:flex;align-items:center;gap:4px;font-size:11px;padding:3px 6px;background:${g.enabled ? 'var(--color-accent,#1a73e8)' : 'var(--color-bg2,rgba(128,128,128,.12))'};color:${g.enabled ? '#fff' : 'var(--color-text)'};border-radius:12px;cursor:pointer;user-select:none;">
            <input type="checkbox" class="enr-genre-check" data-genre="${g.genre}" ${g.enabled ? 'checked' : ''} style="width:0;height:0;opacity:0;position:absolute;">
            ${g.genre}
          </label>`).join('')}
      </div>
      <div style="display:flex;gap:8px;margin-top:10px;">
        <button id="enr-genre-save" class="settings-btn settings-btn-primary" style="font-size:12px;">Opslaan</button>
        <button id="enr-genre-select-all" class="settings-btn settings-btn-secondary" style="font-size:12px;">Alles aan</button>
        <button id="enr-genre-deselect-all" class="settings-btn settings-btn-secondary" style="font-size:12px;">Alles uit</button>
      </div>
      <div id="enr-genre-msg" style="font-size:11px;margin-top:6px;color:var(--color-accent)"></div>`;

    card.appendChild(panel);
    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    // Sluit knop
    panel.querySelector('#enr-genre-panel-close')?.addEventListener('click', () => panel.remove());

    // Zoek filter
    panel.querySelector(`#${searchId}`)?.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      panel.querySelectorAll('.enr-genre-check').forEach(cb => {
        const label = cb.closest('label');
        if (label) label.style.display = cb.dataset.genre.includes(q) ? '' : 'none';
      });
    });

    // Toggle styling on change
    panel.querySelectorAll('.enr-genre-check').forEach(cb => {
      cb.addEventListener('change', () => {
        const label = cb.closest('label');
        if (label) {
          label.style.background = cb.checked ? 'var(--color-accent,#1a73e8)' : 'var(--color-bg2,rgba(128,128,128,.12))';
          label.style.color      = cb.checked ? '#fff' : 'var(--color-text)';
        }
      });
    });

    // Alles aan/uit
    panel.querySelector('#enr-genre-select-all')?.addEventListener('click', () => {
      panel.querySelectorAll('.enr-genre-check').forEach(cb => {
        cb.checked = true;
        cb.dispatchEvent(new Event('change'));
      });
    });
    panel.querySelector('#enr-genre-deselect-all')?.addEventListener('click', () => {
      panel.querySelectorAll('.enr-genre-check').forEach(cb => {
        cb.checked = false;
        cb.dispatchEvent(new Event('change'));
      });
    });

    // Opslaan
    panel.querySelector('#enr-genre-save')?.addEventListener('click', async () => {
      const msgEl = panel.querySelector('#enr-genre-msg');
      if (msgEl) msgEl.textContent = 'Opslaan…';

      const updated = [];
      panel.querySelectorAll('.enr-genre-check').forEach(cb => {
        updated.push({ genre: cb.dataset.genre, enabled: cb.checked });
      });

      try {
        const r = await fetch('/api/enrichment/genres', {
          method:  'PUT',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ genres: updated }),
        });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        if (msgEl) { msgEl.textContent = `✓ ${updated.length} genres opgeslagen`; }
      } catch (err) {
        if (msgEl) msgEl.textContent = `Fout: ${err.message}`;
      }
    });

  } catch (err) {
    console.warn('Genre whitelist load failed:', err);
  }
}

// ── Hoofdrender functie ────────────────────────────────────────────────────
export async function loadSettings() {
  const content = document.getElementById('content');
  if (!content) return;

  // Laad-toestand
  content.innerHTML = `<div style="padding:48px;text-align:center;color:var(--text-muted)">Instellingen laden…</div>`;

  try {
    await fetchSettings();
  } catch (err) {
    console.error('Settings load failed:', err);
    // Ga door met lege state
  }

  const tabsHtml = TABS.map(t =>
    `<button class="settings-tab-btn${t.id === _activeTab ? ' active' : ''}" data-tab="${esc(t.id)}">${esc(t.label)}</button>`
  ).join('');

  const panelsHtml = TABS.map(t => t.render()).join('\n');

  content.innerHTML = `
    <div class="settings-page" id="settings-page">
      <div class="settings-page-header">
        <h1 class="settings-page-title">Instellingen</h1>
        <p class="settings-page-subtitle">Pas het muziekdashboard aan naar jouw wensen</p>
      </div>
      <div class="settings-tabs">${tabsHtml}</div>
      ${panelsHtml}
    </div>`;

  document.title = 'Muziek · Instellingen';

  attachListeners();

  // Laad DB stats asynchroon
  if (_activeTab === 'onderhoud') {
    loadDbStats();
  }
}
