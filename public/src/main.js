// ── Main Entry Point ──────────────────────────────────────────────────────
// Initialiseert alles: state, components, router, event delegation

import { state } from './state.js';
import { prefersReducedMotion } from './helpers.js';

// ── Import components + routers ───────────────────────────────────────────
import { initSidebar } from './components/sidebar.js';
import { initRouter, switchView } from './router.js';
import { initPlayer } from './components/player.js';
import { initZonePicker, playOnZone, getSelectedZone } from './components/plexRemote.js';
import { loadWishlistState, loadWishlist, updateWishlistBadge } from './components/wishlist.js';
import { openArtistPanel, closeArtistPanel } from './components/panel.js';
import { playPreview } from './components/player.js';
import './components/search.js';  // Standalone event listeners
import './events.js';  // Global event delegation
import { loadPlexNP } from './views/nu.js';  // Now playing sync

import {
  loadPlexStatus,
  loadDownloadHistory,
  loadUser,
  apiFetch,
} from './api.js';

import { getCached, setCache } from './cache.js';
import { p } from './helpers.js';

// ── Theme initialization ────────────────────────────────────────────────────
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
}

function initTheme() {
  const saved = localStorage.getItem('theme');
  applyTheme(saved || 'light');
}

document.getElementById('theme-toggle')?.addEventListener('click', () => {
  const current = document.documentElement.dataset.theme;
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  localStorage.setItem('theme', next);
});

// ── Download quality initialization ────────────────────────────────────────
function initDownloadQuality() {
  const saved = localStorage.getItem('downloadQuality') || 'high';
  const sel = document.getElementById('download-quality');
  if (sel && state.VALID_QUALITIES.includes(saved)) sel.value = saved;
}

document.getElementById('download-quality')?.addEventListener('change', e => {
  localStorage.setItem('downloadQuality', e.target.value);
});

// ── Reduce motion ──────────────────────────────────────────────────────────
if (prefersReducedMotion) {
  document.documentElement.setAttribute('data-reduce-motion', 'true');
}

// ── Playlist click from player queue ────────────────────────────────────────
document.addEventListener('click', e => {
  const albumPlay = e.target.closest('[data-play-album]');
  if (albumPlay?.dataset.playAlbum) {
    playOnZone(albumPlay.dataset.playAlbum);
  }
});

// ── Background prefetch voor snellere tab-navigatie ──────────────────────────
function prefetchBackgroundData() {
  const endpoints = [
    { url: '/api/discover', key: 'discover', ttl: 5 * 60 * 1000 },
    { url: '/api/gaps', key: 'gaps', ttl: 5 * 60 * 1000 },
    { url: '/api/releases', key: 'releases', ttl: 5 * 60 * 1000 },
    { url: '/api/recs', key: 'recs', ttl: 5 * 60 * 1000 },
  ];
  for (const { url, key, ttl } of endpoints) {
    if (!getCached(key, ttl)) {
      apiFetch(url)
        .then(data => { if (data) setCache(key, data); })
        .catch(() => {}); // stil falen, gebruiker merkt niets
    }
  }
}

// ── Bootstrap application ──────────────────────────────────────────────────
async function start() {
  // Initialize state and storage
  initTheme();
  initDownloadQuality();

  // Initialize components
  initSidebar();
  initRouter();
  initZonePicker();
  initPlayer();

  // Load initial data
  await loadPlexStatus();
  await loadPlexNP();
  await loadUser();
  await loadWishlistState();
  await loadDownloadHistory();

  // Navigate to first view
  await switchView('bibliotheek');

  // Load sidebar playlists
  try {
    const bibliotheek = await import('./views/bibliotheek.js');
    if (bibliotheek?.loadSidebarPlaylists) {
      await bibliotheek.loadSidebarPlaylists();
    }
  } catch (err) {
    console.error('Failed to load sidebar playlists:', err);
  }

  // Background prefetch (non-blocking)
  prefetchBackgroundData();

  // Load downloads tidarr status
  try {
    const downloads = await import('./views/downloads.js');
    if (downloads?.loadTidarrStatus) {
      await downloads.loadTidarrStatus();
      downloads.startTidarrSSE?.();
    }
  } catch (err) {
    console.error('Failed to load tidarr status:', err);
  }

  // Periodic now playing sync (outside Nu tab)
  setInterval(async () => {
    if (state.activeView !== 'nu') {
      await loadPlexNP();
    }
  }, 30_000);

  // First sync
  await loadPlexNP();
}

// ── Go ─────────────────────────────────────────────────────────────────────
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start);
} else {
  start();
}
