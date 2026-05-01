// ── Sidebar: Toggle, overlay, playlist handling ────────────────────────────
// Beheert sidebar open/close state en event handling
// Desktop: collapsed/open inline, Mobiel: off-canvas overlay

import { state } from '../state.js';
import { apiFetch, orpheusStatus, orpheusPlatforms } from '../api.js';
import { esc } from '../helpers.js';
import { openOrpheusSettingsModal } from './orpheusSettings.js';

const appShell = document.querySelector('.app-shell');
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebar-toggle');
const SIDEBAR_KEY = 'sidebar-state';

/**
 * Zorg dat sidebar overlay bestaat (voeg toe aan DOM als nodig).
 * @returns {HTMLElement} De overlay element
 */
function ensureSidebarOverlay() {
  let overlay = document.getElementById('sidebar-overlay');
  if (overlay) return overlay;
  overlay = document.createElement('button');
  overlay.id = 'sidebar-overlay';
  overlay.className = 'sidebar-overlay';
  overlay.setAttribute('aria-label', 'Sluit zijbalk');
  document.body.appendChild(overlay);
  return overlay;
}

const sidebarOverlay = ensureSidebarOverlay();

/**
 * Set sidebar open/closed state en update aria/overlay.
 * Sidebar start altijd als closed (overlay-drawer model).
 * @param {boolean} open - True = open, false = closed
 */
export function setSidebarOpen(open) {
  if (!appShell) return;
  appShell.classList.toggle('sidebar-open', open);
  sidebarToggle?.setAttribute('aria-expanded', open ? 'true' : 'false');
  sidebarOverlay.classList.toggle('visible', open);
}

/**
 * Initialize sidebar event listeners.
 * Roep dit eenmaal aan uit main.js
 */
export function initSidebar() {
  // ── Sidebar start altijd als closed (overlay-drawer model) ────────────
  // Geen localStorage restore — altijd dicht bij opstarten.
  setSidebarOpen(false);

  // ── Toggle button ──────────────────────────────────────────────────────
  sidebarToggle?.addEventListener('click', () => {
    const isOpen = appShell?.classList.contains('sidebar-open');
    setSidebarOpen(!isOpen);
  });

  // ── Overlay click (close) ──────────────────────────────────────────────
  sidebarOverlay.addEventListener('click', () => setSidebarOpen(false));

  // ── Nav-item klik sluit de sidebar automatisch ────────────────────────
  document.querySelectorAll('.nav-item[data-view]').forEach(item => {
    item.addEventListener('click', () => setSidebarOpen(false));
  });

  // ── Listen for router close event ──────────────────────────────────────
  document.addEventListener('sidebar:close', () => setSidebarOpen(false));

  // ── Collapsible sidebar groups ──────────────────────────────────────────
  document.querySelectorAll('.sidebar-collapse-toggle').forEach(toggle => {
    // Herstel staat uit localStorage
    const groupId = toggle.getAttribute('aria-controls');
    const savedState = localStorage.getItem(`sidebar-group-${groupId}`);
    if (savedState === 'open') {
      toggle.setAttribute('aria-expanded', 'true');
    }

    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', isExpanded ? 'false' : 'true');
      localStorage.setItem(`sidebar-group-${groupId}`, isExpanded ? 'closed' : 'open');
    });
  });

  // ── Settings panel ────────────────────────────────────────────────────
  initSettingsPanel();

  // ── Load sidebar playlists ────────────────────────────────────────────
  loadSidebarPlaylists().catch(err => {
    console.error('Failed to load sidebar playlists:', err);
  });
}

// ── Settings Panel ────────────────────────────────────────────────────────

const PLATFORMS = [
  { id: 'all',         label: 'All',         color: '#888' },
  { id: 'tidal',       label: 'Tidal',       color: '#33ffe7' },
  { id: 'qobuz',       label: 'Qobuz',       color: '#0070ef' },
  { id: 'deezer',      label: 'Deezer',      color: '#a238ff' },
  { id: 'spotify',     label: 'Spotify',     color: '#1cc659' },
  { id: 'soundcloud',  label: 'SoundCloud',  color: '#ff5502' },
  { id: 'applemusic',  label: 'Apple Music', color: '#FA586A' },
  { id: 'beatport',    label: 'Beatport',    color: '#00ff89' },
  { id: 'beatsource',  label: 'Beatsource',  color: '#16a8f4' },
  { id: 'youtube',     label: 'YouTube',     color: '#FF0000' },
];

function initSettingsPanel() {
  const sidebarEl = document.getElementById('sidebar');
  if (!sidebarEl) return;

  // Herstel geselecteerde engine + platform uit localStorage
  const savedEngine   = localStorage.getItem('downloadEngine')   || 'tidarr';
  const savedPlatform = localStorage.getItem('orpheusPlatform')  || 'all';
  state.downloadEngine  = savedEngine;
  state.orpheusPlatform = savedPlatform;

  // ── Bouw settings panel HTML ──────────────────────────────────────────
  const panel = document.createElement('div');
  panel.className = 'sidebar-settings-panel';
  panel.id = 'sidebar-settings-panel';
  panel.setAttribute('aria-hidden', 'true');
  panel.innerHTML = `
    <div class="ssp-header">
      <span class="ssp-title">Instellingen</span>
      <button class="ssp-close-btn" aria-label="Instellingen sluiten">✕</button>
    </div>

    <div class="ssp-group">
      <div class="ssp-group-label">Download engine</div>
      <div class="ssp-engine-toggle">
        <button class="ssp-engine-btn${savedEngine === 'tidarr' ? ' active' : ''}" data-engine="tidarr">
          <span class="ssp-status-dot" id="dot-tidarr"></span>Tidarr
        </button>
        <button class="ssp-engine-btn${savedEngine === 'orpheus' ? ' active' : ''}" data-engine="orpheus">
          <span class="ssp-status-dot" id="dot-orpheus"></span>OrpheusDL
        </button>
      </div>
    </div>

    <div class="ssp-group" id="ssp-orpheus-config-group" style="${savedEngine === 'orpheus' ? '' : 'display:none'}">
      <button class="ssp-orpheus-settings-btn" id="ssp-orpheus-settings-btn" type="button">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <circle cx="12" cy="12" r="3"/>
          <path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m5.08 5.08l4.24 4.24M1 12h6m6 0h6M4.22 19.78l4.24-4.24m5.08-5.08l4.24-4.24"/>
        </svg>
        OrpheusDL Instellingen
      </button>
    </div>

    <div class="ssp-group" id="ssp-platform-group" style="${savedEngine === 'orpheus' ? '' : 'display:none'}">
      <div class="ssp-group-label">Zoekplatform</div>
      <div class="ssp-pills" id="ssp-platform-pills">
        ${PLATFORMS.map(p => `
          <button class="ssp-pill${savedPlatform === p.id ? ' active' : ''}"
                  data-platform="${p.id}"
                  style="${p.id !== 'all' ? `--platform-color:${p.color}` : ''}">
            ${p.id !== 'all' ? `<span class="ssp-pill-dot" style="background:${p.color}"></span>` : ''}
            ${p.label}
          </button>`).join('')}
      </div>
      <div class="ssp-platform-list" id="ssp-platform-list">
        <div class="ssp-loading-text">Platforms laden…</div>
      </div>
    </div>

    <div class="ssp-group" id="ssp-dl-priority-group">
      <div class="ssp-group-label">Download-bron prioriteit</div>
      <div class="dl-hybrid-row">
        <div>
          <div>Fallback modus</div>
          <div class="dl-hybrid-desc">Probeer volgende bron bij falen</div>
        </div>
        <input type="checkbox" class="dl-priority-toggle" id="dl-hybrid-toggle" checked>
      </div>
      <div class="dl-priority-list" id="dl-priority-list">
        <div class="ssp-loading-text">Prioriteiten laden…</div>
      </div>
      <div class="dl-settings-save-bar">
        <button class="tool-btn" id="dl-priority-save-btn" type="button">Opslaan</button>
        <span class="dl-settings-saved" id="dl-priority-saved">✓ Opgeslagen</span>
      </div>
    </div>

    <div class="ssp-group" id="ssp-scrobbling-group">
      <div class="ssp-group-label">Scrobbling</div>

      <div class="ssp-scrobble-section">
        <div class="ssp-scrobble-header">
          <span class="ssp-scrobble-service-label">
            <span class="ssp-status-dot" id="dot-lastfm"></span>Last.fm
          </span>
          <label class="ssp-toggle-label">
            <input type="checkbox" id="ssp-lastfm-enabled" class="ssp-toggle-cb">
            <span class="ssp-toggle-track"></span>
          </label>
        </div>
        <div class="ssp-scrobble-body" id="ssp-lastfm-body">
          <div class="ssp-scrobble-status" id="ssp-lastfm-status">Laden…</div>
          <div class="ssp-scrobble-actions">
            <button class="tool-btn tool-btn--sm" id="ssp-lastfm-auth-btn" type="button">Autoriseer via Last.fm</button>
            <button class="tool-btn tool-btn--sm tool-btn--danger" id="ssp-lastfm-disconnect-btn" type="button" style="display:none">Ontkoppelen</button>
          </div>
          <div class="ssp-hint">Vereist LASTFM_API_SECRET in .env</div>
        </div>
      </div>

      <div class="ssp-scrobble-section">
        <div class="ssp-scrobble-header">
          <span class="ssp-scrobble-service-label">
            <span class="ssp-status-dot" id="dot-listenbrainz"></span>ListenBrainz
          </span>
          <label class="ssp-toggle-label">
            <input type="checkbox" id="ssp-lb-enabled" class="ssp-toggle-cb">
            <span class="ssp-toggle-track"></span>
          </label>
        </div>
        <div class="ssp-scrobble-body" id="ssp-lb-body">
          <input type="text" class="ssp-text-input" id="ssp-lb-username" placeholder="ListenBrainz gebruikersnaam">
          <input type="password" class="ssp-text-input" id="ssp-lb-token" placeholder="User Token (van listenbrainz.org)">
          <button class="tool-btn tool-btn--sm" id="ssp-lb-save-btn" type="button">Opslaan</button>
          <span class="dl-settings-saved" id="ssp-lb-saved">✓ Opgeslagen</span>
        </div>
      </div>
    </div>
  `;
  sidebarEl.appendChild(panel);

  // ── Sluiten via close-knop ────────────────────────────────────────────
  panel.querySelector('.ssp-close-btn').addEventListener('click', closeSettingsPanel);

  // ── Scrobbling ────────────────────────────────────────────────────────
  initScrobblingHandlers(panel);
  loadScrobblerSettings();

  // ── Settings-knop opent panel ─────────────────────────────────────────
  document.querySelector('.sidebar-settings-btn')?.addEventListener('click', toggleSettingsPanel);

  // ── Engine toggle ─────────────────────────────────────────────────────
  panel.querySelectorAll('.ssp-engine-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const engine = btn.dataset.engine;
      state.downloadEngine = engine;
      localStorage.setItem('downloadEngine', engine);
      panel.querySelectorAll('.ssp-engine-btn').forEach(b =>
        b.classList.toggle('active', b.dataset.engine === engine));
      const platformGroup = document.getElementById('ssp-platform-group');
      if (platformGroup) platformGroup.style.display = engine === 'orpheus' ? '' : 'none';
      const configGroup = document.getElementById('ssp-orpheus-config-group');
      if (configGroup) configGroup.style.display = engine === 'orpheus' ? '' : 'none';
      // Vernieuw zoekresultaten als downloads-view actief is
      document.dispatchEvent(new CustomEvent('engine:changed', { detail: { engine } }));
    });
  });

  // ── Platform pills ────────────────────────────────────────────────────
  panel.querySelectorAll('.ssp-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      const platform = btn.dataset.platform;
      state.orpheusPlatform = platform;
      localStorage.setItem('orpheusPlatform', platform);
      panel.querySelectorAll('.ssp-pill').forEach(b =>
        b.classList.toggle('active', b.dataset.platform === platform));
      document.dispatchEvent(new CustomEvent('platform:changed', { detail: { platform } }));
    });
  });

  // ── OrpheusDL Instellingen knop ──────────────────────────────────────
  document.getElementById('ssp-orpheus-settings-btn')?.addEventListener('click', () => {
    closeSettingsPanel();
    openOrpheusSettingsModal();
  });

  // ── Laad verbindingsstatus ────────────────────────────────────────────
  updateEngineStatus();

  // ── Download-bron prioriteit ──────────────────────────────────────────
  loadDownloadPriority(panel);
}

// ── Download-bron prioriteit drag-and-drop ─────────────────────────────────

const SOURCE_LABELS = {
  tidarr:             { label: 'Tidal (Tidarr)',  color: '#33ffe7' },
  orpheus_tidal:      { label: 'Tidal (Orpheus)', color: '#33ffe7' },
  orpheus_qobuz:      { label: 'Qobuz',           color: '#0070ef' },
  orpheus_deezer:     { label: 'Deezer',          color: '#a238ff' },
  orpheus_spotify:    { label: 'Spotify',         color: '#1cc659' },
  orpheus_soundcloud: { label: 'SoundCloud',      color: '#ff5502' },
  orpheus_applemusic: { label: 'Apple Music',     color: '#FA586A' },
  orpheus_beatport:   { label: 'Beatport',        color: '#00ff89' },
  orpheus_beatsource: { label: 'Beatsource',      color: '#16a8f4' },
  orpheus_youtube:    { label: 'YouTube',         color: '#FF0000' },
};

async function loadDownloadPriority(panel) {
  const listEl   = panel.querySelector('#dl-priority-list');
  const saveBtn  = panel.querySelector('#dl-priority-save-btn');
  const savedEl  = panel.querySelector('#dl-priority-saved');
  const hybridEl = panel.querySelector('#dl-hybrid-toggle');
  if (!listEl) return;

  // Haal settings op van de server
  let settings;
  try {
    const r = await fetch('/api/download/settings');
    settings = await r.json();
  } catch {
    listEl.innerHTML = '<div class="ssp-loading-text">Instellingen niet beschikbaar</div>';
    return;
  }

  const priority = settings.source_priority || Object.keys(SOURCE_LABELS);
  const enabled  = settings.source_enabled  || {};
  const hybrid   = settings.hybrid_mode !== false;

  if (hybridEl) hybridEl.checked = hybrid;

  // Render de draggable lijst
  function renderPriorityList(order) {
    listEl.innerHTML = order.map((src, idx) => {
      const cfg     = SOURCE_LABELS[src] || { label: src, color: '#888' };
      const isOn    = enabled[src] !== false;
      return `
        <div class="dl-priority-item" draggable="true" data-source="${esc(src)}" data-enabled="${isOn}">
          <span class="dl-priority-handle" aria-hidden="true">⠿</span>
          <span class="dl-priority-dot" style="background:${cfg.color}"></span>
          <span class="dl-priority-name">${esc(cfg.label)}</span>
          <span class="dl-priority-status">#${idx + 1}</span>
          <input type="checkbox" class="dl-priority-toggle" data-src="${esc(src)}"
                 ${isOn ? 'checked' : ''} title="Bron in-/uitschakelen"
                 aria-label="${esc(cfg.label)} in-/uitschakelen">
        </div>`;
    }).join('');

    // ── Toggle handlers ──────────────────────────────────────────────���───
    listEl.querySelectorAll('.dl-priority-toggle').forEach(cb => {
      cb.addEventListener('change', () => {
        const src = cb.dataset.src;
        enabled[src] = cb.checked;
        const item = cb.closest('.dl-priority-item');
        if (item) item.dataset.enabled = String(cb.checked);
      });
    });

    // ── Drag-and-drop handlers ───────────────────────────────────────────
    let dragSrc = null;

    listEl.querySelectorAll('.dl-priority-item').forEach(item => {
      item.addEventListener('dragstart', e => {
        dragSrc = item;
        item.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', item.dataset.source);
      });

      item.addEventListener('dragend', () => {
        item.classList.remove('dragging');
        listEl.querySelectorAll('.dl-priority-item').forEach(i => i.classList.remove('drag-over'));
        dragSrc = null;
        // Update nummers
        listEl.querySelectorAll('.dl-priority-item').forEach((i, idx) => {
          const statusEl = i.querySelector('.dl-priority-status');
          if (statusEl) statusEl.textContent = `#${idx + 1}`;
        });
      });

      item.addEventListener('dragover', e => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (dragSrc && dragSrc !== item) {
          listEl.querySelectorAll('.dl-priority-item').forEach(i => i.classList.remove('drag-over'));
          item.classList.add('drag-over');
        }
      });

      item.addEventListener('dragleave', () => {
        item.classList.remove('drag-over');
      });

      item.addEventListener('drop', e => {
        e.preventDefault();
        item.classList.remove('drag-over');
        if (!dragSrc || dragSrc === item) return;

        // Bepaal positie en herorden
        const items = [...listEl.querySelectorAll('.dl-priority-item')];
        const fromIdx = items.indexOf(dragSrc);
        const toIdx   = items.indexOf(item);

        if (fromIdx < toIdx) {
          item.after(dragSrc);
        } else {
          item.before(dragSrc);
        }
      });
    });
  }

  renderPriorityList(priority);

  // ── Opslaan ─────────────────────────────��────────────────────────────────
  saveBtn?.addEventListener('click', async () => {
    const newOrder = [...listEl.querySelectorAll('.dl-priority-item')]
      .map(i => i.dataset.source);

    const newEnabled = {};
    listEl.querySelectorAll('.dl-priority-toggle[data-src]').forEach(cb => {
      newEnabled[cb.dataset.src] = cb.checked;
    });

    saveBtn.disabled = true;
    try {
      await fetch('/api/download/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_priority: newOrder,
          hybrid_mode:     hybridEl?.checked ?? true,
          source_enabled:  newEnabled,
        }),
      });
      if (savedEl) {
        savedEl.classList.add('visible');
        setTimeout(() => savedEl.classList.remove('visible'), 2500);
      }
    } catch (e) {
      alert('Opslaan mislukt: ' + e.message);
    } finally {
      saveBtn.disabled = false;
    }
  });
}

// ── Scrobbling settings ────────────────────────────────────────────────────────

async function loadScrobblerSettings() {
  try {
    const s = await apiFetch('/api/scrobbler/settings');

    // Last.fm
    const lfmToggle     = document.getElementById('ssp-lastfm-enabled');
    const lfmStatus     = document.getElementById('ssp-lastfm-status');
    const lfmAuthBtn    = document.getElementById('ssp-lastfm-auth-btn');
    const lfmDisconnect = document.getElementById('ssp-lastfm-disconnect-btn');
    const dotLfm        = document.getElementById('dot-lastfm');

    if (lfmToggle)     lfmToggle.checked = !!s.lastfm_enabled;
    if (dotLfm)        dotLfm.classList.toggle('connected', !!s.lastfm_connected);
    if (lfmStatus) {
      lfmStatus.textContent = s.lastfm_connected
        ? `Verbonden als ${s.lastfm_username || '—'}`
        : 'Niet verbonden';
    }
    if (lfmAuthBtn)    lfmAuthBtn.style.display    = s.lastfm_connected ? 'none' : '';
    if (lfmDisconnect) lfmDisconnect.style.display = s.lastfm_connected ? '' : 'none';

    // ListenBrainz
    const lbToggle    = document.getElementById('ssp-lb-enabled');
    const lbUsername  = document.getElementById('ssp-lb-username');
    const dotLb       = document.getElementById('dot-listenbrainz');

    if (lbToggle)   lbToggle.checked   = !!s.lb_enabled;
    if (lbUsername) lbUsername.value   = s.lb_username || '';
    if (dotLb)      dotLb.classList.toggle('connected', !!s.lb_token_set && !!s.lb_enabled);
  } catch { /* stille fout */ }
}

function initScrobblingHandlers(panel) {
  // Last.fm aan/uit toggle
  panel.querySelector('#ssp-lastfm-enabled')?.addEventListener('change', async (e) => {
    await apiFetch('/api/scrobbler/settings', { method: 'POST', body: JSON.stringify({ lastfm_enabled: e.target.checked }) });
    loadScrobblerSettings();
  });

  // Last.fm autoriseer-knop: open OAuth popup
  panel.querySelector('#ssp-lastfm-auth-btn')?.addEventListener('click', () => {
    const popup = window.open('/api/lastfm/auth', 'lastfm_auth', 'width=600,height=500,resizable=yes');
    const handler = (ev) => {
      if (ev.data === 'lastfm_auth_ok') {
        window.removeEventListener('message', handler);
        popup?.close();
        loadScrobblerSettings();
      }
    };
    window.addEventListener('message', handler);
  });

  // Last.fm ontkoppelen
  panel.querySelector('#ssp-lastfm-disconnect-btn')?.addEventListener('click', async () => {
    if (!confirm('Last.fm ontkoppelen?')) return;
    await apiFetch('/api/lastfm/auth', { method: 'DELETE' });
    loadScrobblerSettings();
  });

  // ListenBrainz aan/uit toggle
  panel.querySelector('#ssp-lb-enabled')?.addEventListener('change', async (e) => {
    await apiFetch('/api/scrobbler/settings', { method: 'POST', body: JSON.stringify({ lb_enabled: e.target.checked }) });
    loadScrobblerSettings();
  });

  // ListenBrainz opslaan
  panel.querySelector('#ssp-lb-save-btn')?.addEventListener('click', async () => {
    const token    = panel.querySelector('#ssp-lb-token')?.value.trim();
    const username = panel.querySelector('#ssp-lb-username')?.value.trim();
    const payload  = {};
    if (username) payload.lb_username = username;
    if (token)    payload.lb_token    = token;
    try {
      await apiFetch('/api/scrobbler/settings', { method: 'POST', body: JSON.stringify(payload) });
      const saved = document.getElementById('ssp-lb-saved');
      if (saved) { saved.classList.add('visible'); setTimeout(() => saved.classList.remove('visible'), 2500); }
      loadScrobblerSettings();
    } catch (e) {
      alert('Opslaan mislukt: ' + e.message);
    }
  });
}

function toggleSettingsPanel() {
  const panel = document.getElementById('sidebar-settings-panel');
  if (!panel) return;
  const isOpen = panel.classList.toggle('open');
  panel.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
  if (isOpen) {
    updateEngineStatus();
    loadScrobblerSettings();
  }
}

function closeSettingsPanel() {
  const panel = document.getElementById('sidebar-settings-panel');
  if (!panel) return;
  panel.classList.remove('open');
  panel.setAttribute('aria-hidden', 'true');
}

/**
 * Controleer verbindingsstatus van Tidarr en OrpheusDL en update de status-dots.
 */
export async function updateEngineStatus() {
  // Tidarr status
  try {
    const d = await apiFetch('/api/tidarr/status');
    const dot = document.getElementById('dot-tidarr');
    if (dot) dot.classList.toggle('connected', !!d.connected);
  } catch {
    const dot = document.getElementById('dot-tidarr');
    if (dot) dot.classList.remove('connected');
  }

  // OrpheusDL status
  try {
    const d = await orpheusStatus();
    state.orpheusConnected = !!d.connected;
    const dot = document.getElementById('dot-orpheus');
    if (dot) dot.classList.toggle('connected', !!d.connected);
  } catch {
    state.orpheusConnected = false;
    const dot = document.getElementById('dot-orpheus');
    if (dot) dot.classList.remove('connected');
  }

  // Platform lijst
  loadOrpheusPlatformList();
}

async function loadOrpheusPlatformList() {
  const listEl = document.getElementById('ssp-platform-list');
  if (!listEl) return;
  try {
    const data = await orpheusPlatforms();
    const platforms = data.platforms || [];
    state.availableOrpheusPlatforms = platforms;
    if (!platforms.length) {
      listEl.innerHTML = '<div class="ssp-loading-text">Geen platforms gevonden</div>';
      return;
    }
    listEl.innerHTML = platforms.map(p => `
      <div class="ssp-platform-row">
        <span class="ssp-platform-name">${esc(p.name)}</span>
        <span class="ssp-platform-badge ${p.configured ? 'configured' : 'unconfigured'}">
          ${p.configured ? '✓ Actief' : '✗ Niet geconfigureerd'}
        </span>
      </div>`).join('');
  } catch {
    listEl.innerHTML = '<div class="ssp-loading-text">Status ophalen mislukt</div>';
  }
}

/**
 * Toon of verberg een release-notificatiebadge op alle nav-items met data-view="{view}".
 * Werkt voor zowel sidebar nav-items als bottom nav knoppen.
 * @param {string} view - De view-naam (bijv. 'ontdek')
 * @param {number} count - Aantal nieuwe items (0 = badge verbergen)
 */
export function updateNavBadge(view, count) {
  document.querySelectorAll(`[data-view="${view}"]`).forEach(el => {
    let badge = el.querySelector('.nav-release-badge');
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'nav-release-badge';
      badge.setAttribute('aria-hidden', 'true');
      el.appendChild(badge);
    }
    if (count > 0) {
      badge.textContent = count > 99 ? '99+' : String(count);
      badge.classList.add('visible');
    } else {
      badge.classList.remove('visible');
    }
  });
}

/**
 * Load Plex playlists directly from API and render them in the sidebar.
 */
export async function loadSidebarPlaylists() {
  const sidebarEl = document.getElementById('sidebar-playlists');
  if (!sidebarEl) return;

  sidebarEl.innerHTML = `<div class="blib-sidebar-loading"><div class="spinner-sm"></div></div>`;

  try {
    const data = await apiFetch('/api/plex/playlists');
    const playlists = data.playlists || data || [];

    if (!playlists.length) {
      sidebarEl.innerHTML = `<div class="sidebar-empty">Geen afspeellijsten</div>`;
      return;
    }

    sidebarEl.innerHTML = playlists.map(pl => {
      const key = esc(pl.ratingKey || pl.key || '');
      const title = esc(pl.title || 'Playlist');
      const count = pl.leafCount || pl.trackCount || '';
      return `<button class="sidebar-playlist-item" role="listitem"
                data-playlist-key="${key}" data-playlist-title="${title}"
                aria-label="Afspeellijst ${title}">
        <svg class="sidebar-playlist-icon" width="14" height="14" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2" aria-hidden="true">
          <line x1="8" y1="6" x2="21" y2="6"/>
          <line x1="8" y1="12" x2="21" y2="12"/>
          <line x1="8" y1="18" x2="21" y2="18"/>
          <line x1="3" y1="6" x2="3.01" y2="6"/>
          <line x1="3" y1="12" x2="3.01" y2="12"/>
          <line x1="3" y1="18" x2="3.01" y2="18"/>
        </svg>
        <span class="sidebar-playlist-name">${title}</span>
        ${count ? `<span class="sidebar-playlist-count">${count}</span>` : ''}
      </button>`;
    }).join('');

    // Note: Playlist click handling would need to be added if playlists should be clickable
    // Currently, playlists are displayed for information only

  } catch (err) {
    if (err.name !== 'AbortError') {
      sidebarEl.innerHTML = `<div class="sidebar-empty">Laden mislukt</div>`;
    }
  }
}
