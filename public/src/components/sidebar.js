// ── Sidebar: Toggle, overlay, playlist handling ────────────────────────────
// Beheert sidebar open/close state en event handling

import { state } from '../state.js';

const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebar-toggle');

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
  if (!sidebar) return;
  sidebar.dataset.open = open ? 'true' : 'false';
  sidebarToggle?.setAttribute('aria-expanded', open ? 'true' : 'false');
  sidebarOverlay.classList.toggle('visible', open);
}

/**
 * Initialize sidebar event listeners.
 * Roep dit eenmaal aan uit main.js
 */
export function initSidebar() {
  // ── Toggle button ──────────────────────────────────────────────────────
  sidebarToggle?.addEventListener('click', () => {
    const open = sidebar?.dataset.open !== 'true';
    setSidebarOpen(open);
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
