// ── Sidebar: Toggle, overlay, playlist handling ────────────────────────────
// Beheert sidebar open/close state en event handling
// Desktop: collapsed/open inline, Mobiel: off-canvas overlay

import { state } from '../state.js';
import { apiFetch } from '../api.js';
import { esc } from '../helpers.js';

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

  // ── Load sidebar playlists ────────────────────────────────────────────
  loadSidebarPlaylists().catch(err => {
    console.error('Failed to load sidebar playlists:', err);
  });
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
