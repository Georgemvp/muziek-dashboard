// ── OrpheusDL Settings Modal ───────────────────────────────────────────────────
// Tabblad-gebaseerde configuratie-UI voor alle OrpheusDL platforms.
// Laadt en bewaart /app/orpheusdl/config/settings.json via de backend API.

import { apiFetch } from '../api.js';
import { esc } from '../helpers.js';

// ── Platform-definities ───────────────────────────────────────────────────────

const PLATFORM_DEFS = [
  {
    id: 'global',
    label: 'Global',
    color: '#888',
    icon: '⚙️',
    fields: [
      { key: 'general.download_path',         label: 'Download pad',      type: 'text',   placeholder: '/music' },
      { key: 'general.download_quality',      label: 'Kwaliteit',         type: 'select', options: ['hifi','lossless','high','low'] },
      { key: 'general.search_limit',          label: 'Zoeklimiet',        type: 'number', min: 1, max: 100 },
      { key: 'formatting.album_format',       label: 'Album formaat',     type: 'text',   placeholder: '{artist}/{name}{explicit}' },
      { key: 'formatting.track_filename_format', label: 'Track formaat',  type: 'text',   placeholder: '{track_number}. {name}' },
      { key: 'covers.embed_cover',            label: 'Hoes insluiten',    type: 'toggle' },
      { key: 'covers.main_resolution',        label: 'Hoes resolutie',    type: 'number', min: 300, max: 3000 },
      { key: 'lyrics.embed_lyrics',           label: 'Songtekst insluiten', type: 'toggle' },
      { key: 'lyrics.save_synced_lyrics',     label: 'Gesynchroniseerde tekst opslaan', type: 'toggle' },
    ],
    credentialKeys: [],
    description: 'Algemene download- en formatteringsinstellingen.',
  },
  {
    id: 'tidal',
    label: 'Tidal',
    color: '#33ffe7',
    icon: '🎵',
    settingsKey: 'modules.tidal',
    fields: [
      { key: 'quality_format',            label: 'Kwaliteit',                    type: 'select', options: ['atmos','hifi','lossless','high','low'] },
      { key: 'tv_atmos_token',            label: 'TV Atmos Token',               type: 'text',   placeholder: 'Aanbevolen: laat leeg voor auto-login' },
      { key: 'tv_atmos_secret',           label: 'TV Atmos Secret',              type: 'password', placeholder: '' },
      { key: 'mobile_atmos_hires_token',  label: 'Mobile Atmos/HiRes Token',     type: 'text',   placeholder: '' },
      { key: 'mobile_hires_token',        label: 'Mobile HiRes Token',           type: 'text',   placeholder: '' },
    ],
    credentialKeys: ['tv_atmos_token', 'tv_atmos_secret', 'mobile_atmos_hires_token', 'mobile_hires_token'],
    description: 'Bij de eerste download opent OrpheusDL automatisch een browser voor Tidal-inlog. Tokens zijn optioneel.',
    info: 'ⓘ Je hoeft geen tokens in te vullen — bij de eerste download wordt automatisch een browservenster geopend voor inloggen via Tidal.',
  },
  {
    id: 'qobuz',
    label: 'Qobuz',
    color: '#0070ef',
    icon: '🎶',
    settingsKey: 'modules.qobuz',
    fields: [
      { key: 'quality_format', label: 'Kwaliteit',       type: 'select',   options: ['hifi','lossless','high'] },
      { key: 'username',       label: 'E-mailadres',     type: 'text',     placeholder: 'jouw@email.com' },
      { key: 'password',       label: 'Wachtwoord',      type: 'password', placeholder: '' },
      { key: 'user_id',        label: 'Gebruikers-ID',   type: 'text',     placeholder: 'alternatief voor email/wachtwoord' },
      { key: 'auth_token',     label: 'Auth token',      type: 'password', placeholder: 'alternatief voor email/wachtwoord' },
      { key: 'app_id',         label: 'App ID',          type: 'text',     placeholder: '798273057', recommended: '798273057' },
      { key: 'app_secret',     label: 'App Secret',      type: 'text',     placeholder: 'abb21364945c0583309667d13ca3d93a', recommended: 'abb21364945c0583309667d13ca3d93a' },
    ],
    credentialKeys: ['username', 'password', 'user_id', 'auth_token'],
    description: 'Qobuz-account credentials. App ID en secret zijn ingevuld met standaardwaarden.',
  },
  {
    id: 'deezer',
    label: 'Deezer',
    color: '#a238ff',
    icon: '🎸',
    settingsKey: 'modules.deezer',
    fields: [
      { key: 'quality_format', label: 'Kwaliteit',      type: 'select',   options: ['lossless','high','low'] },
      { key: 'email',          label: 'E-mailadres',    type: 'text',     placeholder: 'jouw@email.com' },
      { key: 'password',       label: 'Wachtwoord',     type: 'password', placeholder: '' },
      { key: 'arl',            label: 'ARL token',      type: 'password', placeholder: 'alternatief voor email/wachtwoord' },
      { key: 'client_id',      label: 'Client ID',      type: 'text',     placeholder: '613143', recommended: '613143' },
      { key: 'client_secret',  label: 'Client Secret',  type: 'text',     placeholder: 'e635f790edfbc8f7574447214e3271e7', recommended: 'e635f790edfbc8f7574447214e3271e7' },
      { key: 'bf_secret',      label: 'BF Secret',      type: 'text',     placeholder: 'g93bsW9bwfo79ml6', recommended: 'g93bsW9bwfo79ml6' },
    ],
    credentialKeys: ['email', 'password', 'arl'],
    description: 'Deezer-account credentials. Je kunt inloggen met email+wachtwoord of alleen een ARL-token.',
  },
  {
    id: 'spotify',
    label: 'Spotify',
    color: '#1cc659',
    icon: '🎧',
    settingsKey: 'modules.spotify',
    fields: [
      { key: 'quality_format',  label: 'Kwaliteit',       type: 'select', options: ['high','low'] },
      { key: 'username',        label: 'Gebruikersnaam',  type: 'text',   placeholder: 'jouw Spotify-gebruikersnaam' },
      { key: 'client_id',       label: 'Client ID',       type: 'text',   placeholder: 'van developer.spotify.com' },
      { key: 'client_secret',   label: 'Client Secret',   type: 'password', placeholder: 'van developer.spotify.com' },
    ],
    credentialKeys: ['username', 'client_id', 'client_secret'],
    description: 'Maak een app op developer.spotify.com en voeg de redirect URI <code>http://127.0.0.1:4381/login</code> toe.',
    info: 'ⓘ Maak een app aan op <a href="https://developer.spotify.com" target="_blank" rel="noopener">developer.spotify.com</a> en voeg redirect URI <code>http://127.0.0.1:4381/login</code> toe.',
  },
  {
    id: 'soundcloud',
    label: 'SoundCloud',
    color: '#ff5502',
    icon: '☁️',
    settingsKey: 'modules.soundcloud',
    fields: [
      { key: 'quality_format',    label: 'Kwaliteit',    type: 'select',   options: ['high'] },
      { key: 'web_access_token', label: 'OAuth token',  type: 'password', placeholder: 'haal op uit browser cookies na inloggen' },
    ],
    credentialKeys: ['web_access_token'],
    description: 'Haal de OAuth-token op uit je browsercookies na inloggen op soundcloud.com. Vereist een Go+-abonnement.',
    info: 'ⓘ Haal het OAuth-token op uit je browsercookies na inloggen op <a href="https://soundcloud.com" target="_blank" rel="noopener">soundcloud.com</a>. Vereist een SoundCloud Go+-abonnement.',
  },
  {
    id: 'applemusic',
    label: 'Apple Music',
    color: '#FA586A',
    icon: '🍎',
    settingsKey: 'modules.applemusic',
    fields: [
      { key: 'quality_format', label: 'Kwaliteit',       type: 'select', options: ['high'] },
      { key: 'cookies_path',   label: 'Cookies bestand', type: 'text',   placeholder: './config/cookies.txt' },
    ],
    credentialKeys: ['cookies_path'],
    description: 'Exporteer je cookies als cookies.txt vanuit je browser na inloggen op music.apple.com.',
    info: 'ⓘ Exporteer cookies als <code>cookies.txt</code> vanuit een browser-extensie na inloggen op <a href="https://music.apple.com" target="_blank" rel="noopener">music.apple.com</a>. Sla het bestand op als <code>./config/cookies.txt</code>.',
  },
  {
    id: 'beatport',
    label: 'Beatport',
    color: '#00ff89',
    icon: '🎛️',
    settingsKey: 'modules.beatport',
    fields: [
      { key: 'quality_format', label: 'Kwaliteit',     type: 'select',   options: ['lossless','high','low'] },
      { key: 'username',       label: 'Gebruikersnaam', type: 'text',    placeholder: 'jouw Beatport-email' },
      { key: 'password',       label: 'Wachtwoord',    type: 'password', placeholder: '' },
    ],
    credentialKeys: ['username', 'password'],
    description: 'Vereist een Beatport Professional-abonnement.',
  },
  {
    id: 'beatsource',
    label: 'Beatsource',
    color: '#16a8f4',
    icon: '🎚️',
    settingsKey: 'modules.beatsource',
    fields: [
      { key: 'quality_format', label: 'Kwaliteit',      type: 'select',   options: ['lossless','high','low'] },
      { key: 'username',       label: 'Gebruikersnaam', type: 'text',    placeholder: 'jouw Beatsource-email' },
      { key: 'password',       label: 'Wachtwoord',     type: 'password', placeholder: '' },
    ],
    credentialKeys: ['username', 'password'],
    description: 'Vereist een Beatsource Pro-abonnement.',
  },
  {
    id: 'youtube',
    label: 'YouTube',
    color: '#FF0000',
    icon: '▶️',
    settingsKey: 'modules.youtube',
    fields: [
      { key: 'quality_format', label: 'Kwaliteit',       type: 'select', options: ['lossless','high','low'] },
      { key: 'cookies_path',   label: 'Cookies bestand', type: 'text',   placeholder: './config/youtube-cookies.txt' },
    ],
    credentialKeys: ['cookies_path'],
    description: 'Exporteer cookies als youtube-cookies.txt vanuit een incognito-sessie op youtube.com.',
    info: 'ⓘ Exporteer cookies als <code>youtube-cookies.txt</code> vanuit een incognito-sessie op YouTube. Sla het bestand op als <code>./config/youtube-cookies.txt</code>.',
  },
];

// ── State ──────────────────────────────────────────────────────────────────────

let currentSettings = null;
let activeTab = 'global';
let isSaving = false;

// ── Hulpfuncties ───────────────────────────────────────────────────────────────

/**
 * Lees een geneste waarde met dot-notatie (bijv. 'general.download_path').
 */
function getNestedValue(obj, dotKey) {
  return dotKey.split('.').reduce((cur, k) => (cur && cur[k] !== undefined ? cur[k] : ''), obj);
}

/**
 * Schrijf een geneste waarde met dot-notatie.
 */
function setNestedValue(obj, dotKey, value) {
  const keys = dotKey.split('.');
  let cur = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!cur[keys[i]] || typeof cur[keys[i]] !== 'object') cur[keys[i]] = {};
    cur = cur[keys[i]];
  }
  cur[keys[keys.length - 1]] = value;
}

/**
 * Controleer of een platform geconfigureerd is (credentials ingevuld).
 */
function isPlatformConfigured(def, settings) {
  if (def.id === 'global') return true;
  const modSettings = getNestedValue(settings, def.settingsKey) || {};
  return def.credentialKeys.some(k => {
    const v = modSettings[k];
    return v && String(v).trim().length > 0;
  });
}

/**
 * Bouw de settings-object op basis van de formulierwaarden.
 */
function collectFormValues(def, formEl) {
  const result = {};
  def.fields.forEach(field => {
    const input = formEl.querySelector(`[data-field="${field.key}"]`);
    if (!input) return;
    if (field.type === 'toggle') {
      result[field.key] = input.checked;
    } else if (field.type === 'number') {
      result[field.key] = Number(input.value) || 0;
    } else {
      result[field.key] = input.value;
    }
  });
  return result;
}

// ── Render ──────────────────────────────────────────────────────────────────────

function renderTabBar(settings) {
  return `
    <div class="osm-tabs" role="tablist">
      ${PLATFORM_DEFS.map(def => {
        const configured = isPlatformConfigured(def, settings);
        const isActive = def.id === activeTab;
        return `
          <button class="osm-tab${isActive ? ' active' : ''}"
                  role="tab"
                  aria-selected="${isActive}"
                  data-tab="${def.id}"
                  title="${esc(def.label)}">
            <span class="osm-tab-dot" style="background:${def.color}" aria-hidden="true"></span>
            <span class="osm-tab-label">${esc(def.label)}</span>
            ${def.id !== 'global' ? `<span class="osm-tab-badge ${configured ? 'configured' : 'unconfigured'}"
              title="${configured ? 'Geconfigureerd' : 'Niet ingesteld'}"
              aria-label="${configured ? 'Geconfigureerd' : 'Niet ingesteld'}">
              ${configured ? '✓' : '○'}
            </span>` : ''}
          </button>`;
      }).join('')}
    </div>`;
}

function renderTabContent(def, settings) {
  const modPath = def.settingsKey;
  const modSettings = modPath ? (getNestedValue(settings, modPath) || {}) : settings.global || {};

  const infoHtml = def.info ? `<div class="osm-info-box">${def.info}</div>` : '';

  const fieldsHtml = def.fields.map(field => {
    // Voor globale tab: lees uit settings.global.{subpath}
    const rawVal = def.id === 'global'
      ? getNestedValue(settings.global || {}, field.key)
      : modSettings[field.key];

    // Gebruik recommended waarde als fallback wanneer veld leeg of ontbrekend is
    const isEmpty = rawVal === undefined || rawVal === null || rawVal === '';
    const val = isEmpty ? (field.recommended || '') : rawVal;

    let inputHtml;
    if (field.type === 'toggle') {
      const checked = val === true || val === 'true';
      inputHtml = `
        <label class="osm-toggle-label">
          <input type="checkbox" class="osm-toggle-input" data-field="${esc(field.key)}" ${checked ? 'checked' : ''}>
          <span class="osm-toggle-track"><span class="osm-toggle-thumb"></span></span>
        </label>`;
    } else if (field.type === 'select') {
      inputHtml = `
        <select class="osm-select" data-field="${esc(field.key)}">
          ${(field.options || []).map(opt =>
            `<option value="${esc(opt)}" ${String(val) === opt ? 'selected' : ''}>${esc(opt)}</option>`
          ).join('')}
        </select>`;
    } else {
      const isPassword = field.type === 'password';
      inputHtml = `
        <div class="osm-input-wrap">
          <input type="${isPassword ? 'password' : field.type === 'number' ? 'number' : 'text'}"
                 class="osm-input"
                 data-field="${esc(field.key)}"
                 value="${esc(String(val))}"
                 placeholder="${esc(field.placeholder || '')}"
                 ${field.min !== undefined ? `min="${field.min}"` : ''}
                 ${field.max !== undefined ? `max="${field.max}"` : ''}>
          ${isPassword ? `<button type="button" class="osm-reveal-btn" data-target="${esc(field.key)}" aria-label="Wachtwoord tonen/verbergen">👁</button>` : ''}
          ${field.recommended ? `<button type="button" class="osm-fill-btn" data-field="${esc(field.key)}" data-value="${esc(field.recommended)}" title="Vul aanbevolen waarde in">↩</button>` : ''}
        </div>`;
    }

    return `
      <div class="osm-field">
        <label class="osm-field-label">${esc(field.label)}</label>
        ${inputHtml}
      </div>`;
  }).join('');

  return `
    <div class="osm-tab-content" role="tabpanel">
      <p class="osm-platform-desc">${def.description}</p>
      ${infoHtml}
      <div class="osm-fields">
        ${fieldsHtml}
      </div>
    </div>`;
}

function renderModal(settings) {
  const def = PLATFORM_DEFS.find(d => d.id === activeTab) || PLATFORM_DEFS[0];
  return `
    <div class="osm-overlay" id="osm-overlay" role="dialog" aria-modal="true" aria-label="OrpheusDL Instellingen">
      <div class="osm-modal">
        <div class="osm-header">
          <div class="osm-header-left">
            <span class="osm-logo">OrpheusDL Instellingen</span>
          </div>
          <div class="osm-header-right">
            <button class="osm-save-btn" id="osm-save-btn" type="button">Opslaan</button>
            <button class="osm-close-btn" id="osm-close-btn" type="button" aria-label="Sluiten">✕</button>
          </div>
        </div>

        ${renderTabBar(settings)}

        <div class="osm-body" id="osm-body">
          ${renderTabContent(def, settings)}
        </div>

        <div class="osm-footer">
          <span class="osm-save-status" id="osm-save-status"></span>
          <div class="osm-footer-badges">
            ${PLATFORM_DEFS.filter(d => d.id !== 'global').map(d => {
              const ok = isPlatformConfigured(d, settings);
              return `<span class="osm-footer-badge ${ok ? 'configured' : 'unconfigured'}" title="${esc(d.label)}">
                <span class="osm-fb-dot" style="background:${d.color}"></span>
                ${esc(d.label)} ${ok ? '✓' : '○'}
              </span>`;
            }).join('')}
          </div>
        </div>
      </div>
    </div>`;
}

// ── Event-handlers ─────────────────────────────────────────────────────────────

function attachModalEvents(settings) {
  const overlay = document.getElementById('osm-overlay');
  if (!overlay) return;

  // Sluiten
  document.getElementById('osm-close-btn')?.addEventListener('click', closeOrpheusSettingsModal);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeOrpheusSettingsModal(); });
  document.addEventListener('keydown', handleEsc);

  // Tab-navigatie
  overlay.querySelectorAll('.osm-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      // Sla huidige formulier op in settings-object
      saveCurrentTabToSettings(settings);
      activeTab = btn.dataset.tab;
      rerenderModal(settings);
    });
  });

  // Opslaan
  document.getElementById('osm-save-btn')?.addEventListener('click', () => saveSettings(settings));

  // Wachtwoord tonen/verbergen
  overlay.querySelectorAll('.osm-reveal-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const fieldKey = btn.dataset.target;
      const input = overlay.querySelector(`[data-field="${fieldKey}"]`);
      if (input) input.type = input.type === 'password' ? 'text' : 'password';
    });
  });

  // Aanbevolen waarde invullen
  overlay.querySelectorAll('.osm-fill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const fieldKey = btn.dataset.field;
      const value = btn.dataset.value;
      const input = overlay.querySelector(`[data-field="${fieldKey}"]`);
      if (input) input.value = value;
    });
  });
}

function handleEsc(e) {
  if (e.key === 'Escape') closeOrpheusSettingsModal();
}

function saveCurrentTabToSettings(settings) {
  const def = PLATFORM_DEFS.find(d => d.id === activeTab);
  if (!def) return;
  const formEl = document.getElementById('osm-body');
  if (!formEl) return;

  const values = collectFormValues(def, formEl);

  if (def.id === 'global') {
    if (!settings.global) settings.global = {};
    Object.entries(values).forEach(([dotKey, val]) => {
      setNestedValue(settings.global, dotKey, val);
    });
  } else {
    const keys = (def.settingsKey || '').split('.');
    let cur = settings;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!cur[keys[i]]) cur[keys[i]] = {};
      cur = cur[keys[i]];
    }
    const lastKey = keys[keys.length - 1];
    if (!cur[lastKey]) cur[lastKey] = {};
    Object.assign(cur[lastKey], values);
  }
}

function rerenderModal(settings) {
  const overlay = document.getElementById('osm-overlay');
  if (!overlay) return;

  // Update tabbar
  const tabBar = overlay.querySelector('.osm-tabs');
  if (tabBar) tabBar.outerHTML = renderTabBar(settings);

  // Update body
  const body = document.getElementById('osm-body');
  if (body) {
    const def = PLATFORM_DEFS.find(d => d.id === activeTab) || PLATFORM_DEFS[0];
    body.innerHTML = renderTabContent(def, settings);
  }

  // Update footer badges
  const badgesEl = overlay.querySelector('.osm-footer-badges');
  if (badgesEl) {
    badgesEl.innerHTML = PLATFORM_DEFS.filter(d => d.id !== 'global').map(d => {
      const ok = isPlatformConfigured(d, settings);
      return `<span class="osm-footer-badge ${ok ? 'configured' : 'unconfigured'}" title="${esc(d.label)}">
        <span class="osm-fb-dot" style="background:${d.color}"></span>
        ${esc(d.label)} ${ok ? '✓' : '○'}
      </span>`;
    }).join('');
  }

  // Herbevestig tabbar events
  overlay.querySelectorAll('.osm-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      saveCurrentTabToSettings(settings);
      activeTab = btn.dataset.tab;
      rerenderModal(settings);
    });
  });

  // Herbevestig body events
  overlay.querySelectorAll('.osm-reveal-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const fieldKey = btn.dataset.target;
      const input = overlay.querySelector(`[data-field="${fieldKey}"]`);
      if (input) input.type = input.type === 'password' ? 'text' : 'password';
    });
  });
  overlay.querySelectorAll('.osm-fill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = overlay.querySelector(`[data-field="${btn.dataset.field}"]`);
      if (input) input.value = btn.dataset.value;
    });
  });
}

async function saveSettings(settings) {
  if (isSaving) return;
  isSaving = true;

  // Sla huidig formulier op in settings-object
  saveCurrentTabToSettings(settings);

  const saveBtn = document.getElementById('osm-save-btn');
  const statusEl = document.getElementById('osm-save-status');
  if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Opslaan…'; }
  if (statusEl) { statusEl.textContent = ''; statusEl.className = 'osm-save-status'; }

  try {
    const res = await fetch('/api/orpheus/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.error || `Serverfout ${res.status}`);
    }
    if (statusEl) {
      statusEl.textContent = '✓ Opgeslagen';
      statusEl.className = 'osm-save-status success';
    }
    currentSettings = settings;
    // Herrender om badges bij te werken
    rerenderModal(settings);
  } catch (err) {
    if (statusEl) {
      statusEl.textContent = `✗ Fout: ${err.message}`;
      statusEl.className = 'osm-save-status error';
    }
  } finally {
    isSaving = false;
    if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Opslaan'; }
  }
}

// ── Publieke API ────────────────────────────────────────────────────────────────

export function closeOrpheusSettingsModal() {
  document.removeEventListener('keydown', handleEsc);
  const overlay = document.getElementById('osm-overlay');
  if (overlay) overlay.remove();
}

export async function openOrpheusSettingsModal() {
  // Verwijder eventuele bestaande modal
  closeOrpheusSettingsModal();

  // Laad-indicator injecteren
  const loadingDiv = document.createElement('div');
  loadingDiv.id = 'osm-loading';
  loadingDiv.innerHTML = `
    <div style="position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9999;display:flex;align-items:center;justify-content:center">
      <div style="color:var(--color-text-primary,#fff);font-size:14px">Instellingen laden…</div>
    </div>`;
  document.body.appendChild(loadingDiv);

  let settings;
  try {
    settings = await apiFetch('/api/orpheus/settings');
  } catch (err) {
    loadingDiv.remove();
    alert(`Kan OrpheusDL instellingen niet laden: ${err.message}`);
    return;
  }
  loadingDiv.remove();

  currentSettings = settings;

  // Injecteer modal HTML
  const wrapper = document.createElement('div');
  wrapper.innerHTML = renderModal(settings);
  document.body.appendChild(wrapper.firstElementChild);

  // Injecteer CSS (eenmalig)
  injectStyles();

  // Verbind events
  attachModalEvents(settings);
}

// ── CSS injectie ────────────────────────────────────────────────────────────────

let stylesInjected = false;

function injectStyles() {
  if (stylesInjected) return;
  stylesInjected = true;

  const style = document.createElement('style');
  style.textContent = `
/* ── OrpheusDL Settings Modal ── */
.osm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.65);
  z-index: 9000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  backdrop-filter: blur(4px);
}
.osm-modal {
  background: var(--color-surface, #1a1a1a);
  border: 1px solid var(--color-border, #333);
  border-radius: 12px;
  width: 100%;
  max-width: 760px;
  max-height: 88vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 24px 64px rgba(0,0,0,.6);
}
.osm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border, #333);
  flex-shrink: 0;
}
.osm-logo {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-primary, #fff);
  letter-spacing: -0.01em;
}
.osm-header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}
.osm-save-btn {
  background: var(--color-accent, #7c3aed);
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity .15s;
}
.osm-save-btn:hover { opacity: .85; }
.osm-save-btn:disabled { opacity: .5; cursor: not-allowed; }
.osm-close-btn {
  background: none;
  border: none;
  color: var(--color-text-secondary, #888);
  font-size: 16px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  line-height: 1;
}
.osm-close-btn:hover { color: var(--color-text-primary, #fff); }

/* ── Tabbar ── */
.osm-tabs {
  display: flex;
  overflow-x: auto;
  gap: 2px;
  padding: 10px 16px 0;
  border-bottom: 1px solid var(--color-border, #333);
  flex-shrink: 0;
  scrollbar-width: none;
}
.osm-tabs::-webkit-scrollbar { display: none; }
.osm-tab {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 7px 11px;
  border: none;
  background: none;
  color: var(--color-text-secondary, #888);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  border-radius: 6px 6px 0 0;
  white-space: nowrap;
  position: relative;
  transition: color .15s, background .15s;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
}
.osm-tab:hover { color: var(--color-text-primary, #fff); background: var(--color-surface-hover, #252525); }
.osm-tab.active {
  color: var(--color-text-primary, #fff);
  border-bottom-color: var(--color-accent, #7c3aed);
}
.osm-tab-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}
.osm-tab-badge {
  font-size: 10px;
  line-height: 1;
  padding: 1px 4px;
  border-radius: 3px;
  font-weight: 600;
}
.osm-tab-badge.configured  { background: rgba(34,197,94,.18); color: #22c55e; }
.osm-tab-badge.unconfigured { background: rgba(120,120,120,.15); color: #777; }

/* ── Body / velden ── */
.osm-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}
.osm-tab-content {}
.osm-platform-desc {
  font-size: 12px;
  color: var(--color-text-secondary, #888);
  margin: 0 0 12px;
  line-height: 1.5;
}
.osm-info-box {
  background: rgba(124,58,237,.12);
  border: 1px solid rgba(124,58,237,.3);
  border-radius: 6px;
  padding: 10px 12px;
  font-size: 12px;
  color: var(--color-text-secondary, #aaa);
  margin-bottom: 16px;
  line-height: 1.5;
}
.osm-info-box a { color: var(--color-accent, #a78bfa); }
.osm-info-box code { background: rgba(255,255,255,.1); padding: 1px 4px; border-radius: 3px; font-family: monospace; }
.osm-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
@media (max-width: 500px) {
  .osm-fields { grid-template-columns: 1fr; }
}
.osm-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.osm-field-label {
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-secondary, #888);
  text-transform: uppercase;
  letter-spacing: .04em;
}
.osm-input, .osm-select {
  background: var(--color-surface-elevated, #222);
  border: 1px solid var(--color-border, #333);
  border-radius: 6px;
  color: var(--color-text-primary, #fff);
  font-size: 13px;
  padding: 7px 10px;
  width: 100%;
  outline: none;
  transition: border-color .15s;
  box-sizing: border-box;
}
.osm-input:focus, .osm-select:focus { border-color: var(--color-accent, #7c3aed); }
.osm-input-wrap { position: relative; display: flex; align-items: center; }
.osm-input-wrap .osm-input { padding-right: 32px; }
.osm-reveal-btn, .osm-fill-btn {
  position: absolute;
  right: 6px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 13px;
  color: var(--color-text-secondary, #666);
  padding: 2px 3px;
  line-height: 1;
}
.osm-fill-btn { right: 28px; font-size: 11px; color: var(--color-accent, #a78bfa); }
.osm-reveal-btn:hover, .osm-fill-btn:hover { opacity: .8; }
/* Toggle */
.osm-toggle-label { display: flex; align-items: center; cursor: pointer; width: fit-content; }
.osm-toggle-input { display: none; }
.osm-toggle-track {
  width: 36px;
  height: 20px;
  background: var(--color-border, #444);
  border-radius: 10px;
  position: relative;
  transition: background .2s;
}
.osm-toggle-input:checked + .osm-toggle-track { background: var(--color-accent, #7c3aed); }
.osm-toggle-thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 14px;
  height: 14px;
  background: #fff;
  border-radius: 50%;
  transition: transform .2s;
  box-shadow: 0 1px 3px rgba(0,0,0,.3);
}
.osm-toggle-input:checked + .osm-toggle-track .osm-toggle-thumb { transform: translateX(16px); }

/* ── Footer ── */
.osm-footer {
  padding: 12px 20px;
  border-top: 1px solid var(--color-border, #333);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-shrink: 0;
  flex-wrap: wrap;
}
.osm-save-status {
  font-size: 12px;
  min-width: 80px;
}
.osm-save-status.success { color: #22c55e; }
.osm-save-status.error   { color: #ef4444; }
.osm-footer-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.osm-footer-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  padding: 2px 7px;
  border-radius: 4px;
  font-weight: 500;
}
.osm-footer-badge.configured  { background: rgba(34,197,94,.12); color: #22c55e; }
.osm-footer-badge.unconfigured { background: rgba(120,120,120,.1); color: #666; }
.osm-fb-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

/* ── Sidebar settings-knop ── */
.ssp-orpheus-settings-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  background: var(--color-surface-elevated, rgba(124,58,237,.1));
  border: 1px solid rgba(124,58,237,.25);
  border-radius: 6px;
  color: var(--color-text-primary, #ccc);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  text-align: left;
  transition: background .15s, border-color .15s;
}
.ssp-orpheus-settings-btn:hover {
  background: rgba(124,58,237,.2);
  border-color: rgba(124,58,237,.45);
}
`;
  document.head.appendChild(style);
}
