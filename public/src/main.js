import { state } from './state.js';
import { prefersReducedMotion, p } from './helpers.js';
import { loadPlexStatus, loadDownloadHistory } from './api.js';
import { openArtistPanel, closeArtistPanel } from './components/panel.js';
import { loadWishlistState, toggleWishlist, loadWishlist, updateWishlistBadge } from './components/wishlist.js';
import { playPreview } from './components/player.js';
import {
  initPlayer,
  getPlayerState,
  playAlbum,
  getZones,
  setZone,
} from '../chunks/player.js';

// Search module behoudt debounce + /api/search gedrag.
import './components/search.js';

const loadBibliotheek = () => import('./tabs/bibliotheek.js');
const loadOntdek = () => import('./tabs/ontdek.js');
const loadDownloads = () => import('./tabs/downloads.js');

const viewTitles = {
  bibliotheek: 'Muziek · Bibliotheek',
  ontdek: 'Muziek · Ontdek',
  gaps: 'Muziek · Gaps',
  downloads: 'Muziek · Downloads',
};

const views = {
  bibliotheek: async () => (await loadBibliotheek()).loadBibliotheek(),
  ontdek: async () => (await loadOntdek()).loadOntdek(),
  gaps: async () => (await loadBibliotheek()).loadGaps(),
  downloads: async () => (await loadDownloads()).loadDownloads(),
};

if (prefersReducedMotion) {
  document.documentElement.setAttribute('data-reduce-motion', 'true');
}

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
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  localStorage.setItem('theme', next);
});

(function initQuality() {
  const saved = localStorage.getItem('downloadQuality') || 'high';
  const sel = document.getElementById('download-quality');
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
loadBibliotheek();
// Alleen de header-pill bijwerken als de Nu-tab NIET actief is.
// Op de Nu-tab doet de dashboard-poller (dw_nuLuisteren) dit al,
// anders dubbele aanroepen naar /api/plex/nowplaying.
setInterval(() => { if (state.activeView !== 'nu') loadPlexNP(); }, 30_000); // update header-pill buiten Nu-tab

import('./tabs/downloads.js').then(({ loadTidarrStatus, startTidarrSSE }) => {
  loadTidarrStatus();
  startTidarrSSE();
async function navigateToView(view) {
  if (!views[view]) return;

  document.querySelectorAll('.nav-item[data-view]').forEach(el => {
    const active = el.dataset.view === view;
    el.classList.toggle('active', active);
    if (active) el.setAttribute('aria-current', 'page');
    else el.removeAttribute('aria-current');
  });

  if (state.tabAbort) state.tabAbort.abort();
  state.tabAbort = new AbortController();
  state.activeTab = view;
  state.sectionContainerEl = null;

  const toolbar = document.getElementById('view-toolbar');
  if (toolbar) toolbar.innerHTML = '';

  try {
    await views[view]();
    document.title = viewTitles[view] || 'Muziek';
  } catch (err) {
    if (err.name === 'AbortError') return;
    const content = document.getElementById('content');
    if (content) {
      content.innerHTML = `<div class="error-box">⚠️ Laden mislukt: ${err.message}</div>`;
    }
  }
}

document.querySelectorAll('.nav-item[data-view]').forEach(btn => {
  btn.addEventListener('click', () => {
    navigateToView(btn.dataset.view);
    setSidebarOpen(false);
  });
});

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

const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebar-toggle');
const sidebarOverlay = ensureSidebarOverlay();

function setSidebarOpen(open) {
  if (!sidebar) return;
  sidebar.dataset.open = open ? 'true' : 'false';
  sidebarToggle?.setAttribute('aria-expanded', open ? 'true' : 'false');
  sidebarOverlay.classList.toggle('visible', open);
}

sidebarToggle?.addEventListener('click', () => {
  const open = sidebar?.dataset.open !== 'true';
  setSidebarOpen(open);
});

sidebarOverlay.addEventListener('click', () => setSidebarOpen(false));

async function syncNowPlayingToPlayerBar() {
  try {
    const np = await fetch('/api/plex/nowplaying').then(r => r.json());
    if (!np?.playing) return;
    const current = getPlayerState();
    if (current?.playing) return;

    const titleEl = document.getElementById('player-title');
    const artistEl = document.getElementById('player-artist');
    if (titleEl) titleEl.textContent = np.track || 'Niet aan het afspelen';
    if (artistEl) artistEl.textContent = np.artist || '';
  } catch {
    // noop
  }
}

async function openZonePicker() {
  const dropdown = document.getElementById('plex-zone-dropdown');
  const button = document.getElementById('plex-zone-btn');
  if (!dropdown || !button) return;

  const expanded = button.getAttribute('aria-expanded') === 'true';
  if (expanded) {
    dropdown.style.display = 'none';
    button.setAttribute('aria-expanded', 'false');
    return;
  }

  const zones = await getZones();
  dropdown.innerHTML = zones.map(z => (
    `<button class="zone-item" data-zone-id="${z.machineId}" data-zone-name="${z.name}">${z.name}</button>`
  )).join('');

  dropdown.style.display = '';
  button.setAttribute('aria-expanded', 'true');
}

document.getElementById('plex-zone-btn')?.addEventListener('click', openZonePicker);

document.addEventListener('click', async e => {
  if ((await loadBibliotheek()).handlePlexLibraryClick(e)) return;

  const zoneBtn = e.target.closest('.zone-item[data-zone-id]');
  if (zoneBtn) {
    setZone(zoneBtn.dataset.zoneId, zoneBtn.dataset.zoneName);
    const name = document.getElementById('plex-zone-name');
    if (name) name.textContent = zoneBtn.dataset.zoneName || '—';
    const dropdown = document.getElementById('plex-zone-dropdown');
    if (dropdown) dropdown.style.display = 'none';
    document.getElementById('plex-zone-btn')?.setAttribute('aria-expanded', 'false');
    return;
  }

  const playlistItem = e.target.closest('.sidebar-playlist-item[data-playlist-key]');
  if (playlistItem) {
    await navigateToView('bibliotheek');
    const bibliotheek = await loadBibliotheek();
    bibliotheek.openSidebarPlaylist(playlistItem.dataset.playlistKey, playlistItem.dataset.playlistTitle || 'Playlist');
    return;
  }

  const playBtn = e.target.closest('.play-btn[data-artist][data-track]');
  if (playBtn) {
    e.stopPropagation();
    playPreview(playBtn, playBtn.dataset.artist, playBtn.dataset.track);
    return;
  }

  const artistLink = e.target.closest('.artist-link[data-artist], .search-result-item[data-artist]');
  if (artistLink) {
    if (artistLink.classList.contains('search-result-item')) {
      document.getElementById('search-results')?.classList.remove('open');
      const input = document.getElementById('search-input');
      if (input) input.value = '';
    }
    openArtistPanel(artistLink.dataset.artist);
    return;
  }

  const similarChip = e.target.closest('.panel-similar-chip[data-artist]');
  if (similarChip) {
    openArtistPanel(similarChip.dataset.artist);
    return;
  }

  const bookmarkBtn = e.target.closest('.bookmark-btn');
  if (bookmarkBtn) {
    e.stopPropagation();
    const { btype, bname, bartist, bimage } = bookmarkBtn.dataset;
    const added = await toggleWishlist(btype, bname, bartist, bimage);
    bookmarkBtn.classList.toggle('saved', added);
    bookmarkBtn.title = added ? 'Verwijder uit lijst' : 'Sla op in lijst';
    document.querySelectorAll(`.bookmark-btn[data-bname="${CSS.escape(bname)}"][data-btype="${btype}"]`).forEach(b => {
      b.classList.toggle('saved', added);
    });
    return;
  }

  const dlBtn = e.target.closest('.download-btn, .tidal-dl-btn');
  if (dlBtn) {
    e.stopPropagation();
    const downloads = await loadDownloads();
    if (dlBtn.classList.contains('tidal-dl-btn')) {
      const url = dlBtn.dataset.dlurl;
      if (!url) return;
      dlBtn.disabled = true;
      const orig = dlBtn.textContent;
      dlBtn.textContent = '…';
      try {
        const res = await p('/api/tidarr/download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.error || 'download mislukt');
        dlBtn.textContent = '✓ Toegevoegd';
        dlBtn.classList.add('downloaded');
        downloads.refreshTidarrQueueBadge();
      } catch (err) {
        alert('Downloaden mislukt: ' + err.message);
        dlBtn.textContent = orig;
        dlBtn.disabled = false;
      }
      return;
    }

    await downloads.triggerTidarrDownload(dlBtn.dataset.dlartist, dlBtn.dataset.dlalbum, dlBtn);
    return;
  }

  const queueRemove = e.target.closest('.q-remove[data-qid]');
  if (queueRemove) {
    e.stopPropagation();
    try {
      await p('/api/tidarr/queue/' + encodeURIComponent(queueRemove.dataset.qid), { method: 'DELETE' });
    } catch (err) {
      alert('Verwijderen mislukt: ' + err.message);
    }
    return;
  }

  const historyRemove = e.target.closest('.q-remove[data-dlid]');
  if (historyRemove) {
    e.stopPropagation();
    try {
      await p(`/api/downloads/${historyRemove.dataset.dlid}`, { method: 'DELETE' });
      historyRemove.closest('.q-row')?.remove();
    } catch (err) {
      alert('Verwijderen mislukt: ' + err.message);
    }
    return;
  }

  const tidalViewBtn = e.target.closest('[data-tidal-view]');
  if (tidalViewBtn) {
    const downloads = await loadDownloads();
    downloads.hideTidarrUI();
    downloads.setTidalView(tidalViewBtn.dataset.tidalView);
    return;
  }

  if (e.target.closest('#btn-open-tidarr')) {
    const downloads = await loadDownloads();
    downloads.loadTidarrUI();
    return;
  }

  const wishRemove = e.target.closest('.wish-remove[data-wid]');
  if (wishRemove) {
    try { await p(`/api/wishlist/${wishRemove.dataset.wid}`, { method: 'DELETE' }); } catch (err) { if (err.name !== 'AbortError') throw err; }
    state.wishlistMap.forEach((v, k) => { if (String(v) === wishRemove.dataset.wid) state.wishlistMap.delete(k); });
    updateWishlistBadge();
    loadWishlist();
    return;
  }

  const panelClose = e.target.closest('#panel-close, #panel-overlay');
  if (panelClose && (e.target.id === 'panel-overlay' || e.target.id === 'panel-close')) {
    closeArtistPanel();
    return;
  }

  if (!e.target.closest('#search-wrap')) {
    document.getElementById('search-results')?.classList.remove('open');
  }
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeArtistPanel();
    document.getElementById('search-results')?.classList.remove('open');
    return;
  }

  const inInput = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName);
  if (e.key === '/' && !inInput) {
    e.preventDefault();
    document.getElementById('search-input')?.focus();
  }
});

document.addEventListener('input', e => {
  if (e.target?.id !== 'tidal-search') return;
  clearTimeout(state.tidalSearchTimeout);
  const query = e.target.value.trim();
  state.tidalSearchTimeout = setTimeout(async () => {
    if (state.activeSubTab !== 'tidal' || state.tidalView !== 'search') return;
    const downloads = await loadDownloads();
    downloads.renderTidalSearch(query);
  }, 400);
});

async function start() {
  initPlayer();
  await loadPlexStatus();
  await navigateToView('bibliotheek');
  try {
    const bibliotheek = await loadBibliotheek();
    await bibliotheek.loadSidebarPlaylists();
  } catch {
    // noop
  }
  const downloads = await loadDownloads();
  await downloads.loadTidarrStatus();
  downloads.startTidarrSSE();

  loadWishlistState();
  loadDownloadHistory();

  setInterval(syncNowPlayingToPlayerBar, 30_000);
  syncNowPlayingToPlayerBar();
}

start();

// Sidebar playlist actie vanaf player queue of andere modules.
document.addEventListener('click', e => {
  const albumPlay = e.target.closest('[data-play-album]');
  if (albumPlay?.dataset.playAlbum) {
    playAlbum(albumPlay.dataset.playAlbum);
  }
});
