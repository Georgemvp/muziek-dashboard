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
 * @param {boolean} open - True = open, false = closed
 */
export function setSidebarOpen(open) {
  if (!appShell) return;
  appShell.classList.toggle('sidebar-open', open);
  sidebarToggle?.setAttribute('aria-expanded', open ? 'true' : 'false');
  sidebarOverlay.classList.toggle('visible', open);
  // Sla op in localStorage
  localStorage.setItem(SIDEBAR_KEY, open ? 'open' : 'closed');
}

/**
 * Initialize sidebar event listeners.
 * Roep dit eenmaal aan uit main.js
 */
export function initSidebar() {
  // ── Restore saved state of start (or default to closed) ──────────────
  const saved = localStorage.getItem(SIDEBAR_KEY);
  const shouldBeOpen = saved === 'open';
  if (shouldBeOpen) {
    setSidebarOpen(true);
  }

  // ── Toggle button ──────────────────────────────────────────────────────
  sidebarToggle?.addEventListener('click', () => {
    const isOpen = appShell?.classList.contains('sidebar-open');
    setSidebarOpen(!isOpen);
  });

  // ── Overlay click (close) ──────────────────────────────────────────────
  sidebarOverlay.addEventListener('click', () => setSidebarOpen(false));

  // ── Listen for router close event ──────────────────────────────────────
  document.addEventListener('sidebar:close', () => setSidebarOpen(false));

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
  `;
  sidebarEl.appendChild(panel);

  // ── Sluiten via close-knop ────────────────────────────────────────────
  panel.querySelector('.ssp-close-btn').addEventListener('click', closeSettingsPanel);

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
}

function toggleSettingsPanel() {
  const panel = document.getElementById('sidebar-settings-panel');
  if (!panel) return;
  const isOpen = panel.classList.toggle('open');
  panel.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
  if (isOpen) updateEngineStatus();
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
