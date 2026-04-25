// ── Sidebar: Toggle, overlay, playlist handling ────────────────────────────
// Beheert sidebar open/close state en event handling
// Desktop: collapsed/open inline, Mobiel: off-canvas overlay

import { state } from '../state.js';

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
}

/**
 * Load sidebar playlists. Extracted from bibliotheek module.
 * Roep dit aan nadat bibliotheek module geladen is.
 * @param {Object} bibliotheekModule - De bibliotheek.js module
 */
export async function loadSidebarPlaylists(bibliotheekModule) {
  try {
    if (bibliotheekModule?.loadSidebarPlaylists) {
      await bibliotheekModule.loadSidebarPlaylists();
    }
  } catch (err) {
    console.error('Failed to load sidebar playlists:', err);
  }
}
