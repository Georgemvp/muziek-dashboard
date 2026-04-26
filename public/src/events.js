// ── Globale event delegation en keyboard shortcuts ────────────────────────
import { state } from './state.js';
import { invalidate } from './cache.js';
import { p } from './helpers.js';
import { loadNu, loadRecent, clearDashboardPolling } from './views/nu.js';
import { toggleWishlist, loadWishlist, updateWishlistBadge } from './components/wishlist.js';
import { loadPlexStatus } from './api.js';
import { contentEl, runWithSection } from './helpers.js';
import { switchView } from './router.js';

let ontdekModulePromise;
let downloadsModulePromise;
let playerModulePromise;
let gapsModulePromise;
let albumsModulePromise;

function loadOntdekModule() {
  if (!ontdekModulePromise) ontdekModulePromise = import('./views/ontdek.js');
  return ontdekModulePromise;
}

function loadDownloadsModule() {
  if (!downloadsModulePromise) downloadsModulePromise = import('./views/downloads.js');
  return downloadsModulePromise;
}

function loadGapsModule() {
  if (!gapsModulePromise) gapsModulePromise = import('./views/gaps.js');
  return gapsModulePromise;
}

function loadAlbumsModule() {
  if (!albumsModulePromise) albumsModulePromise = import('./views/albums.js');
  return albumsModulePromise;
}

function loadPlayerModule() {
  if (!playerModulePromise) playerModulePromise = import('./components/player.js');
  return playerModulePromise;
}

// ── Tab loaders map ────────────────────────────────────────────────────────
export const tabLoaders = {
  // Hoofd-tabs
  nu:          () => loadNu(),
  ontdek:      async () => (await loadOntdekModule()).loadOntdek(),
  downloads:   async () => (await loadDownloadsModule()).loadDownloads(),
  albums:      async () => (await loadAlbumsModule()).loadAlbums(),
  // Backward-compat voor keyboard shortcuts en sub-tab loaders
  discover:    async () => (await loadOntdekModule()).loadDiscover(),
  gaps:        async () => (await loadGapsModule()).loadGaps(),
  recent:      () => loadRecent(),
  recs:        async () => (await loadOntdekModule()).loadRecs(),
  releases:    async () => (await loadOntdekModule()).loadReleases(),
  wishlist:    () => loadWishlist(),
  tidal:       async () => (await loadDownloadsModule()).loadTidal(),
};

// ── Hoofd-navigatie (sidebar nav-items + legacy .tab) ─────────────────────
function setupNavItem(btn) {
  btn.addEventListener('click', () => {
    // Ondersteun zowel data-view (sidebar) als data-tab (legacy)
    const tab = btn.dataset.view || btn.dataset.tab;
    if (!tab) return;

    const allNav = document.querySelectorAll('.nav-item, .tab');
    const currentEl = document.querySelector('.nav-item.active, .tab.active');
    const oldIndex  = Array.from(allNav).indexOf(currentEl);
    const newIndex  = Array.from(allNav).indexOf(btn);
    const direction = newIndex > oldIndex ? 'rtl' : 'ltr';
    document.documentElement.style.setProperty('--tab-direction', direction === 'ltr' ? '-1' : '1');

    allNav.forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    state.activeView = tab;
    state.sectionContainerEl = null;

    // Wis de view-toolbar bij elke navigatie
    const viewToolbar = document.getElementById('view-toolbar');
    if (viewToolbar) viewToolbar.innerHTML = '';

    // Abort vorige tab requests
    if (state.tabAbort) state.tabAbort.abort();
    state.tabAbort = new AbortController();

    if (tab !== 'downloads') {
      loadDownloadsModule().then(m => {
        m.hideTidarrUI();
        m.stopTidarrQueuePolling();
      });
    }
    if (tab !== 'nu') clearDashboardPolling();

    // Sync bottom nav badges
    document.querySelectorAll('.bnav-btn').forEach(b =>
      b.classList.toggle('active', (b.dataset.view || b.dataset.tab) === tab));

    if (document.startViewTransition) {
      document.startViewTransition(async () => {
        try {
          await tabLoaders[tab]?.();
        } catch (err) {
          if (err.name === 'AbortError') return;
          console.error('Tab load error:', err);
          contentEl.innerHTML = `<div class="error-box">⚠️ Laden mislukt: ${err.message}. Druk op R om opnieuw te proberen.</div>`;
        }
      }).finished.catch(() => {});
    } else {
      tabLoaders[tab]?.()?.catch?.(err => {
        if (err.name === 'AbortError') return;
        console.error('Tab load error:', err);
        contentEl.innerHTML = `<div class="error-box">⚠️ Laden mislukt: ${err.message}. Druk op R om opnieuw te proberen.</div>`;
      });
    }
  });
}

// Registreer op sidebar nav-items (.nav-item[data-view]) en legacy tabs
document.querySelectorAll('.nav-item[data-view], .tab[data-tab]').forEach(setupNavItem);

// ── Periode-knoppen ───────────────────────────────────────────────────────
document.querySelectorAll('[data-period]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-period]').forEach(b => b.classList.remove('sel-def'));
    btn.classList.add('sel-def');
    state.currentPeriod = btn.dataset.period;
    tabLoaders[state.activeView]?.();
  });
});

// ────────────────────────────────────────────────────────────────────────────
// NOTE: Filter/sort handlers voor ontdek-tabs (recs, releases, discover) en
// gaps-sortering zitten nu in hun eigen view-modules:
// - ontdek.js regelt tab-filters en -sorting
// - gaps.js regelt gaps-sortering
// ────────────────────────────────────────────────────────────────────────────

// ── Refresh-knoppen (externe toolbars) ────────────────────────────────────
document.getElementById('btn-refresh-releases')?.addEventListener('click', async () => {
  state.lastReleases = null;
  invalidate('releases');  // Wis cache VOOR de fetch
  try { await p('/api/releases/refresh', { method: 'POST' }); } catch (e) { if (e.name !== 'AbortError') throw e; }
  (await loadOntdekModule()).loadReleases();
});

document.getElementById('btn-refresh-discover')?.addEventListener('click', async () => {
  state.lastDiscover = null;
  invalidate('discover');  // Wis cache VOOR de fetch
  try { await p('/api/discover/refresh', { method: 'POST' }); } catch (e) { if (e.name !== 'AbortError') throw e; }
  (await loadOntdekModule()).loadDiscover();
});

document.getElementById('btn-refresh-gaps')?.addEventListener('click', async () => {
  try { await p('/api/gaps/refresh', { method: 'POST' }); } catch (e) { if (e.name !== 'AbortError') throw e; }
  (await loadGapsModule()).loadGaps();
});

document.getElementById('btn-sync-plex')?.addEventListener('click', async () => {
  const btn = document.getElementById('btn-sync-plex');
  const orig = btn.textContent;
  btn.disabled = true; btn.textContent = '↻ Bezig…';
  try {
    try { await p('/api/plex/refresh', { method: 'POST' }); } catch (e) { if (e.name !== 'AbortError') throw e; }
    await loadPlexStatus();
    state.plexLibData = null;
  } catch {}
  finally { btn.disabled = false; btn.textContent = orig; }
});

document.getElementById('plex-refresh-btn')?.addEventListener('click', async () => {
  const btn = document.getElementById('plex-refresh-btn');
  btn.classList.add('spinning'); btn.disabled = true;
  try {
    try { await p('/api/plex/refresh', { method: 'POST' }); } catch (e) { if (e.name !== 'AbortError') throw e; }
    await loadPlexStatus();
    state.plexLibData = null;
  } catch {}
  finally { btn.classList.remove('spinning'); btn.disabled = false; }
});

// ── Tidal zoekbalk ────────────────────────────────────────────────────────
document.addEventListener('input', e => {
  if (e.target?.id !== 'tidal-search') return;
  clearTimeout(state.tidalSearchTimeout);
  const q = e.target.value.trim();
  state.tidalSearchTimeout = setTimeout(() => {
    if (state.activeView === 'downloads' && state.tidalView === 'search')
      loadDownloadsModule().then(m => m.renderTidalSearch(q));
  }, 400);
});

// ── Globale event delegation (klikken) ────────────────────────────────────
// Bevat ALLEEN handlers voor cross-view events:
// - Albums clicks (albums-specifiek: kaarten, play, artist, back)
// - Plex bibliotheek clicks (bibliotheek-specifiek maar globaal voor fallback)
// - Play buttons (overal beschikbaar)
// - Artist links en panel management (globaal in alle views)
// - Bookmarks en wishlist (globaal in alle views)
// - Download buttons (globaal in alle views)
// - Queue management (globaal in downloads)
// - Mood buttons (globaal, maar gerefereerd aan ontdek module)
// - Tidal view buttons (globaal in downloads)
// - Panel overlay backdrop (globaal)
//
// VIEW-SPECIFIEKE handlers zitten in hun eigen modules:
// - albums.js: kaart clicks, play buttons, detail view navigation
// - ontdek.js: tab switches, filters, sort, discover toggles
// - gaps.js: search, sort, refresh, artist expansions
// - altri views hebben hun eigen internal event handling
document.addEventListener('click', async e => {
  // Albums view clicks
  if (state.activeView === 'albums') {
    const { handleAlbumsClick } = await loadAlbumsModule();
    if (await handleAlbumsClick(e)) return;
  }

  // Play-knop → audio preview
  const playBtn = e.target.closest('.play-btn');
  if (playBtn) {
    e.stopPropagation();
    (await loadPlayerModule()).playPreview(playBtn, playBtn.dataset.artist, playBtn.dataset.track);
    return;
  }

  // ────────────────────────────────────────────────────────────────────────────
  // NOTE: Discover toggle handlers (.disc-toggle-btn) zitten nu in ontdek.js
  // ────────────────────────────────────────────────────────────────────────────

  // Playlist-kaart of knop → open playlist detail view
  const plCard = e.target.closest('[data-playlist-id]');
  if (plCard) {
    const id    = plCard.dataset.playlistId;
    const title = plCard.dataset.playlistTitle || plCard.dataset.playlistName || 'Afspeellijst';
    if (id) {
      switchView('playlist-detail', { id, title });
      return;
    }
  }

  // Sidebar playlist items (data-playlist-key) → open playlist detail view
  const plItem = e.target.closest('[data-playlist-key]');
  if (plItem) {
    const id    = plItem.dataset.playlistKey;
    const title = plItem.dataset.playlistTitle || 'Afspeellijst';
    if (id) {
      switchView('playlist-detail', { id, title });
      return;
    }
  }

  // Artiest-link → open artist detail view
  const link = e.target.closest('[data-artist], [data-artist-detail]');
  if (link && !link.classList.contains('bookmark-btn')) {
    const artistName = link.dataset.artist || link.dataset.artistDetail;
    if (artistName) {
      if (link.classList.contains('search-result-item')) {
        document.getElementById('search-results').classList.remove('open');
        document.getElementById('search-input').value = '';
      }
      switchView('artist-detail', { name: artistName });
      return;
    }
  }

  // Bookmark toggle
  const bBtn = e.target.closest('.bookmark-btn');
  if (bBtn) {
    e.stopPropagation();
    const { btype, bname, bartist, bimage } = bBtn.dataset;
    const added = await toggleWishlist(btype, bname, bartist, bimage);
    bBtn.classList.toggle('saved', added);
    bBtn.title = added ? 'Verwijder uit lijst' : 'Sla op in lijst';
    document.querySelectorAll(`.bookmark-btn[data-bname="${CSS.escape(bname)}"][data-btype="${btype}"]`).forEach(b => {
      b.classList.toggle('saved', added);
    });
    return;
  }

  // Verlanglijst item verwijderen
  const wRemove = e.target.closest('.wish-remove[data-wid]');
  if (wRemove) {
    try { await p(`/api/wishlist/${wRemove.dataset.wid}`, { method: 'DELETE' }); } catch (e) { if (e.name !== 'AbortError') throw e; }
    state.wishlistMap.forEach((v, k) => { if (String(v) === wRemove.dataset.wid) state.wishlistMap.delete(k); });
    updateWishlistBadge();
    loadWishlist();
    return;
  }

  // Download-knop
  const dlBtn = e.target.closest('.download-btn, .tidal-dl-btn');
  if (dlBtn) {
    e.stopPropagation();
    if (dlBtn.classList.contains('tidal-dl-btn')) {
      const url = dlBtn.dataset.dlurl;
      if (!url) return;
      dlBtn.disabled = true;
      const orig = dlBtn.textContent;
      dlBtn.textContent = '…';
      try {
        const res  = await p('/api/tidarr/download', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url })
        });
        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.error || 'download mislukt');
        dlBtn.textContent = '✓ Toegevoegd';
        dlBtn.classList.add('downloaded');
        (await loadDownloadsModule()).refreshTidarrQueueBadge();
      } catch (err) {
        alert('Downloaden mislukt: ' + err.message);
        dlBtn.textContent = orig; dlBtn.disabled = false;
      }
      return;
    }
    const { dlartist, dlalbum } = dlBtn.dataset;
    await (await loadDownloadsModule()).triggerTidarrDownload(dlartist, dlalbum, dlBtn);
    return;
  }

  // Queue item verwijderen
  const qRemove = e.target.closest('.q-remove[data-qid]');
  if (qRemove) {
    e.stopPropagation();
    try { try { await p('/api/tidarr/queue/' + encodeURIComponent(qRemove.dataset.qid), { method: 'DELETE' }); } catch (e) { if (e.name !== 'AbortError') throw e; } }
    catch (err) { alert('Verwijderen mislukt: ' + err.message); }
    return;
  }

  // Downloadgeschiedenis item verwijderen
  const dlRemove = e.target.closest('.q-remove[data-dlid]');
  if (dlRemove) {
    e.stopPropagation();
    try {
      try { await p(`/api/downloads/${dlRemove.dataset.dlid}`, { method: 'DELETE' }); } catch (e) { if (e.name !== 'AbortError') throw e; }
      dlRemove.closest('.q-row')?.remove();
    } catch (err) { alert('Verwijderen mislukt: ' + err.message); }
    return;
  }

  // ────────────────────────────────────────────────────────────────────────────
  // NOTE: Inline toolbar handlers voor filters en sorting zitten nu in hun
  // respectievelijke view-modules (ontdek.js, gaps.js, etc.)
  // ────────────────────────────────────────────────────────────────────────────

  // Inline mood-knoppen
  const inlineMoodBtn = e.target.closest('.sec-mood-block [data-mood]');
  if (inlineMoodBtn) {
    const mood = inlineMoodBtn.dataset.mood;
    if (state.activeMood === mood) {
      state.activeMood = null;
      document.querySelectorAll('[data-mood]').forEach(b => b.classList.remove('sel-mood', 'loading'));
      const ontdek = await loadOntdekModule();
      ontdek.clearSpotifyRecs();
      ontdek.loadOntdek();
      return;
    }
    state.activeMood = mood;
    document.querySelectorAll('[data-mood]').forEach(b => b.classList.remove('sel-mood', 'loading'));
    inlineMoodBtn.classList.add('sel-mood');
    const itb = inlineMoodBtn.closest('.inline-toolbar');
    if (itb && !document.getElementById('btn-clear-mood-inline')) {
      const sep = document.createElement('span'); sep.className = 'toolbar-sep';
      const clr = document.createElement('button'); clr.className = 'tool-btn';
      clr.id = 'btn-clear-mood-inline'; clr.textContent = '✕ Wis mood';
      clr.addEventListener('click', () => {
        state.activeMood = null;
        document.querySelectorAll('[data-mood]').forEach(b => b.classList.remove('sel-mood','loading'));
        loadOntdekModule().then(m => { m.clearSpotifyRecs(); m.loadOntdek(); });
      });
      itb.appendChild(sep); itb.appendChild(clr);
    }
    (await loadOntdekModule()).loadSpotifyRecs(mood);
    return;
  }

  // Tidal view-knop
  const tvBtn = e.target.closest('[data-tidal-view]');
  if (tvBtn) {
    const view = tvBtn.dataset.tidalView;
    (await loadDownloadsModule()).hideTidarrUI();
    (await loadDownloadsModule()).setTidalView(view);
    return;
  }

  if (e.target.closest('#btn-open-tidarr')) {
    (await loadDownloadsModule()).loadTidarrUI();
    return;
  }

});


// ── Keyboard shortcuts ────────────────────────────────────────────────────
document.addEventListener('keydown', async e => {
  if (e.key === 'Escape') {
    document.getElementById('search-results').classList.remove('open');
    return;
  }
  const inInput = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName);
  if (e.key === '/' && !inInput) {
    e.preventDefault();
    document.getElementById('search-input').focus();
    return;
  }
  if (e.key === 'r' && !inInput) {
    if (state.activeView === 'ontdek')    (await loadOntdekModule()).loadOntdek();
    else if (state.activeView === 'gaps') (await loadGapsModule()).loadGaps();
    else await tabLoaders[state.activeView]?.();
    return;
  }
  if (!inInput && /^[1-5]$/.test(e.key)) {
    const tabs = document.querySelectorAll('.tab');
    const idx  = parseInt(e.key) - 1;
    if (tabs[idx]) tabs[idx].click();
    return;
  }
});

// ── Bottom nav (mobiel) ───────────────────────────────────────────────────
document.querySelectorAll('.bnav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.view || btn.dataset.tab;
    if (!tab) return;
    // Zoek het bijbehorende sidebar nav-item of legacy tab en klik het
    const navItem = document.querySelector(
      `.nav-item[data-view="${tab}"], .tab[data-tab="${tab}"]`
    );
    if (navItem) {
      navItem.click();
    } else {
      // Geen bijbehorend nav-item: direct laden
      setupNavItem(btn);
      btn.click();
    }
    document.querySelectorAll('.bnav-btn').forEach(b => b.classList.toggle('active', b === btn));
  });
});
