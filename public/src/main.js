// ── Entry point ───────────────────────────────────────────────────────────
// Importeer alle modules; side-effecten (event listeners) worden bij
// import uitgevoerd. Vervolgens initialiseer je de applicatie.

import { state } from './state.js';
import { prefersReducedMotion } from './helpers.js';
import { loadPlexStatus, loadUser, loadDownloadHistory } from './api.js';
import { loadWishlistState } from './components/wishlist.js';
import { loadNu, loadPlexNP } from './tabs/nu.js';
import { initZonePicker } from './components/plexRemote.js';

// Laad event-listener modules (side-effecten)
import './components/player.js';
import './components/search.js';
import './events.js';

// ── Animatie-voorkeur instellen ───────────────────────────────────────────
if (prefersReducedMotion) {
  document.documentElement.setAttribute('data-reduce-motion', 'true');
}

// ── Thema ─────────────────────────────────────────────────────────────────
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
}

(function initTheme() {
  const saved = localStorage.getItem('theme');
  applyTheme(saved || 'light');
})();

document.getElementById('theme-toggle')?.addEventListener('click', () => {
  const current = document.documentElement.dataset.theme;
  const next    = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  localStorage.setItem('theme', next);
});

// ── Download-kwaliteit ────────────────────────────────────────────────────
(function initQuality() {
  const saved = localStorage.getItem('downloadQuality') || 'high';
  const sel   = document.getElementById('download-quality');
  if (sel && state.VALID_QUALITIES.includes(saved)) sel.value = saved;
})();

document.getElementById('download-quality')?.addEventListener('change', e => {
  localStorage.setItem('downloadQuality', e.target.value);
});

// ── Initialisatie ─────────────────────────────────────────────────────────
initZonePicker();
loadPlexStatus();
loadPlexNP();
loadUser();
loadWishlistState();
loadDownloadHistory();
loadNu();
setInterval(loadPlexNP, 30_000);

import('./tabs/downloads.js').then(({ loadTidarrStatus, startTidarrSSE }) => {
  loadTidarrStatus();
  startTidarrSSE();
});
import('./tabs/ontdek.js').then(({ checkSpotifyStatus }) => checkSpotifyStatus());
