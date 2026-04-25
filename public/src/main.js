// ── Main Entry Point ──────────────────────────────────────────────────────
// Initialiseert alles: state, components, router, event delegation

import { state } from './state.js';
import { prefersReducedMotion } from './helpers.js';

// ── Import components + routers ───────────────────────────────────────────
import { initSidebar, updateNavBadge } from './components/sidebar.js';
import { initRouter, switchView } from './router.js';
import { initPlayer } from './components/player.js';
import { initZonePicker, playOnZone, getSelectedZone } from './components/plexRemote.js';
import { loadWishlistState, loadWishlist, updateWishlistBadge } from './components/wishlist.js';
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
  if (btn) btn.title = theme === 'dark' ? 'Schakel naar licht' : 'Schakel naar donker';
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

// ── Nieuwe releases controleren en badge tonen ────────────────────────────────
const SEEN_RELEASES_KEY = 'seenReleaseIds';

async function checkNewReleases() {
  try {
    const data = await apiFetch('/api/releases');
    if (!data || !data.releases) return;

    const seen = new Set(JSON.parse(localStorage.getItem(SEEN_RELEASES_KEY) || '[]'));
    const allIds = data.releases.map(r => `${r.artist}::${r.album}`);
    const newIds = allIds.filter(id => !seen.has(id));

    state.newReleaseCount = newIds.length;

    if (newIds.length > 0) {
      updateNavBadge('ontdek', newIds.length);

      // Browser-notificatie (alleen als toestemming al gegeven is)
      if (Notification.permission === 'granted') {
        new Notification(`${newIds.length} nieuwe release${newIds.length !== 1 ? 's' : ''}`, {
          body: 'Van artiesten die je volgt — open Ontdek voor meer info.',
          icon: '/icon-192.png',
          tag: 'new-releases',
          renotify: false,
        });
      }
    }
  } catch {
    // Stil falen — niet kritisch
  }
}

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

  // Load initial data non-blocking (cache zorgt voor instant weergave)
  Promise.all([
    loadPlexStatus(),
    loadPlexNP(),
    loadUser(),
    loadWishlistState(),
    loadDownloadHistory(),
  ]).catch(() => {});

  // Navigate to first view (niet blokkeren)
  switchView('home');

  // Background prefetch (non-blocking)
  prefetchBackgroundData();

  // Controleer nieuwe releases en toon badge (non-blocking)
  checkNewReleases().catch(() => {});

  // Load downloads tidarr status (fire-and-forget, non-blocking)
  try {
    const downloads = await import('./views/downloads.js');
    if (downloads?.loadTidarrStatus) {
      downloads.loadTidarrStatus(); // No await - runs in background
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
}

// ── Go ─────────────────────────────────────────────────────────────────────
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start);
} else {
  start();
}
