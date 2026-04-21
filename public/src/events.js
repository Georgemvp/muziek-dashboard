// ── Globale event delegation en keyboard shortcuts ────────────────────────
import { state } from './state.js';
import { invalidate } from './cache.js';
import { p } from './helpers.js';
import {
  applyRecsFilter, loadOntdek, renderDiscover, renderReleases,
  loadSpotifyRecs, clearSpotifyRecs, loadRecs, loadReleases, loadDiscover
} from './tabs/ontdek.js';
import {
  renderGaps, loadBibliotheek, buildPlexLibraryHtml, loadPlexLibrary,
  loadGaps, loadTopArtists, loadTopTracks, loadLoved, loadStats,
  handlePlexLibraryClick
} from './tabs/bibliotheek.js';
import { loadNu, loadRecent, clearDashboardPolling } from './tabs/nu.js';
import {
  setTidalView, loadTidarrUI, hideTidarrUI,
  triggerTidarrDownload, refreshTidarrQueueBadge,
  stopTidarrQueuePolling, loadDownloads, loadTidal,
  renderTidalSearch
} from './tabs/downloads.js';
import { openArtistPanel, closeArtistPanel } from './components/panel.js';
import { toggleWishlist, loadWishlist, updateWishlistBadge } from './components/wishlist.js';
import { playPreview } from './components/player.js';
import { loadPlexStatus } from './api.js';
import { contentEl, runWithSection } from './helpers.js';

// ── Tab loaders map ────────────────────────────────────────────────────────
export const tabLoaders = {
  // Hoofd-tabs
  nu:          () => loadNu(),
  ontdek:      () => loadOntdek(),
  bibliotheek: () => loadBibliotheek(),
  downloads:   () => loadDownloads(),
  // Backward-compat voor keyboard shortcuts en sub-tab loaders
  discover:    () => loadDiscover(),
  gaps:        () => loadGaps(),
  recent:      () => loadRecent(),
  recs:        () => loadRecs(),
  releases:    () => loadReleases(),
  topartists:  () => loadTopArtists(state.currentPeriod),
  toptracks:   () => loadTopTracks(state.currentPeriod),
  loved:       () => loadLoved(),
  stats:       () => loadStats(),
  wishlist:    () => loadWishlist(),
  plexlib:     () => loadPlexLibrary(),
  tidal:       () => loadTidal(),
};

// ── Hoofd-tab navigatie ────────────────────────────────────────────────────
document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => {
    const tab     = btn.dataset.tab;
    const allTabs = document.querySelectorAll('.tab');
    const currentTabEl = document.querySelector('.tab.active');
    const oldIndex = Array.from(allTabs).indexOf(currentTabEl);
    const newIndex = Array.from(allTabs).indexOf(btn);
    const direction = newIndex > oldIndex ? 'rtl' : 'ltr';
    document.documentElement.style.setProperty('--tab-direction', direction === 'ltr' ? '-1' : '1');

    allTabs.forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    state.activeTab = tab;
    state.sectionContainerEl = null;

    // Abort vorige tab requests
    if (state.tabAbort) state.tabAbort.abort();
    state.tabAbort = new AbortController();

    ['tb-period','tb-recs','tb-mood','tb-releases','tb-discover',
     'tb-gaps','tb-plexlib','tb-tidarr-ui'].forEach(id =>
      document.getElementById(id)?.classList.remove('visible'));
    document.getElementById('tb-gaps')?.classList.toggle('visible', tab === 'gaps');
    document.getElementById('tb-tidal')?.classList.toggle('visible', tab === 'downloads');

    if (tab !== 'downloads') hideTidarrUI();
    if (tab !== 'downloads') stopTidarrQueuePolling();
    if (tab !== 'nu') clearDashboardPolling();

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
      try {
        tabLoaders[tab]?.();
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.error('Tab load error:', err);
        contentEl.innerHTML = `<div class="error-box">⚠️ Laden mislukt: ${err.message}. Druk op R om opnieuw te proberen.</div>`;
      }
    }
  });
});

// ── Periode-knoppen ───────────────────────────────────────────────────────
document.querySelectorAll('[data-period]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-period]').forEach(b => b.classList.remove('sel-def'));
    btn.classList.add('sel-def');
    state.currentPeriod = btn.dataset.period;
    tabLoaders[state.activeTab]?.();
  });
});

// ── Filter-knoppen (externe toolbars, legacy) ─────────────────────────────
document.querySelectorAll('[data-filter]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('sel-def','sel-new','sel-plex'));
    state.recsFilter = btn.dataset.filter;
    btn.classList.add(state.recsFilter === 'all' ? 'sel-def' : state.recsFilter === 'new' ? 'sel-new' : 'sel-plex');
    applyRecsFilter();
  });
});

document.querySelectorAll('[data-dfilter]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-dfilter]').forEach(b => b.classList.remove('sel-def','sel-new','sel-miss'));
    state.discFilter = btn.dataset.dfilter;
    btn.classList.add(state.discFilter === 'all' ? 'sel-def' : state.discFilter === 'new' ? 'sel-new' : 'sel-miss');
    renderDiscover();
  });
});

document.querySelectorAll('[data-gsort]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-gsort]').forEach(b => b.classList.remove('sel-def'));
    btn.classList.add('sel-def');
    state.gapsSort = btn.dataset.gsort;
    renderGaps();
  });
});

document.querySelectorAll('[data-rtype]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-rtype]').forEach(b => b.classList.remove('sel-def'));
    btn.classList.add('sel-def');
    state.releasesFilter = btn.dataset.rtype;
    renderReleases();
  });
});

document.querySelectorAll('[data-rsort]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-rsort]').forEach(b => b.classList.remove('sel-def'));
    btn.classList.add('sel-def');
    state.releasesSort = btn.dataset.rsort;
    renderReleases();
  });
});

// ── Refresh-knoppen (externe toolbars) ────────────────────────────────────
document.getElementById('btn-refresh-releases')?.addEventListener('click', async () => {
  state.lastReleases = null;
  invalidate('releases');  // Wis cache VOOR de fetch
  try { await p('/api/releases/refresh', { method: 'POST' }); } catch (e) { if (e.name !== 'AbortError') throw e; }
  loadReleases();
});

document.getElementById('btn-refresh-discover')?.addEventListener('click', async () => {
  state.lastDiscover = null;
  invalidate('discover');  // Wis cache VOOR de fetch
  try { await p('/api/discover/refresh', { method: 'POST' }); } catch (e) { if (e.name !== 'AbortError') throw e; }
  loadDiscover();
});

document.getElementById('btn-refresh-gaps')?.addEventListener('click', async () => {
  state.lastGaps = null;
  try { await p('/api/gaps/refresh', { method: 'POST' }); } catch (e) { if (e.name !== 'AbortError') throw e; }
  loadGaps();
});

// ── Plex lib zoeken (externe toolbar) ────────────────────────────────────
document.getElementById('plib-search')?.addEventListener('input', e => {
  if (!state.plexLibData || state.activeSubTab !== 'collectie') return;
  contentEl.innerHTML = buildPlexLibraryHtml(state.plexLibData, e.target.value);
});

document.getElementById('btn-sync-plex')?.addEventListener('click', async () => {
  const btn = document.getElementById('btn-sync-plex');
  const orig = btn.textContent;
  btn.disabled = true; btn.textContent = '↻ Bezig…';
  try {
    try { await p('/api/plex/refresh', { method: 'POST' }); } catch (e) { if (e.name !== 'AbortError') throw e; }
    await loadPlexStatus();
    state.plexLibData = null;
    if (state.activeSubTab === 'collectie') await loadPlexLibrary();
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
document.getElementById('tidal-search')?.addEventListener('input', e => {
  clearTimeout(state.tidalSearchTimeout);
  const q = e.target.value.trim();
  state.tidalSearchTimeout = setTimeout(() => {
    if (state.activeSubTab === 'tidal' && state.tidalView === 'search')
      renderTidalSearch(q);
  }, 400);
});

// ── Panel sluiten ─────────────────────────────────────────────────────────
document.getElementById('panel-close')?.addEventListener('click', closeArtistPanel);

// ── Globale event delegation (klikken) ────────────────────────────────────
document.addEventListener('click', async e => {
  // Plex bibliotheek knoppen (▶ play + artiest-header collapse)
  if (handlePlexLibraryClick(e)) return;

  // Play-knop → audio preview
  const playBtn = e.target.closest('.play-btn');
  if (playBtn) {
    e.stopPropagation();
    playPreview(playBtn, playBtn.dataset.artist, playBtn.dataset.track);
    return;
  }

  // Discover album-sectie toggle
  const discToggleBtn = e.target.closest('.disc-toggle-btn');
  if (discToggleBtn) {
    e.stopPropagation();
    const sectionId = discToggleBtn.dataset.discId;
    const section = document.getElementById(sectionId);
    if (section) {
      const isCollapsed = section.classList.toggle('collapsed');
      section.querySelectorAll('.disc-toggle-btn').forEach(b => {
        b.classList.toggle('expanded', !isCollapsed);
        b.classList.toggle('collapsed', isCollapsed);
        const n = parseInt(b.dataset.albumCount, 10) || 0;
        const lbl = `${n} album${n !== 1 ? 's' : ''}`;
        b.textContent = isCollapsed ? `Toon ${lbl}` : lbl;
      });
    }
    return;
  }

  // Klik op discover-kaart zelf
  const discCard = e.target.closest('.discover-card-toggle');
  if (discCard && !e.target.closest('.artist-link') && !e.target.closest('.bookmark-btn') && !e.target.closest('.disc-toggle-btn')) {
    const sectionId = discCard.dataset.discId;
    const section = document.getElementById(sectionId);
    if (section) {
      const isCollapsed = section.classList.toggle('collapsed');
      section.querySelectorAll('.disc-toggle-btn').forEach(b => {
        b.classList.toggle('expanded', !isCollapsed);
        b.classList.toggle('collapsed', isCollapsed);
        const n = parseInt(b.dataset.albumCount, 10) || 0;
        const lbl = `${n} album${n !== 1 ? 's' : ''}`;
        b.textContent = isCollapsed ? `Toon ${lbl}` : lbl;
      });
    }
    return;
  }

  // Artiest-link → open panel
  const link = e.target.closest('[data-artist]');
  if (link?.dataset.artist && !link.classList.contains('bookmark-btn')) {
    if (link.classList.contains('search-result-item')) {
      document.getElementById('search-results').classList.remove('open');
      document.getElementById('search-input').value = '';
    }
    openArtistPanel(link.dataset.artist);
    return;
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

  // Soortgelijke artiest chip
  const chip = e.target.closest('.panel-similar-chip[data-artist]');
  if (chip) { openArtistPanel(chip.dataset.artist); return; }

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
        refreshTidarrQueueBadge();
      } catch (err) {
        alert('Downloaden mislukt: ' + err.message);
        dlBtn.textContent = orig; dlBtn.disabled = false;
      }
      return;
    }
    const { dlartist, dlalbum } = dlBtn.dataset;
    await triggerTidarrDownload(dlartist, dlalbum, dlBtn);
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

  // Inline toolbar: recs-filter
  const inlineFilter = e.target.closest('.inline-toolbar [data-filter]');
  if (inlineFilter) {
    document.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('sel-def','sel-new','sel-plex'));
    state.recsFilter = inlineFilter.dataset.filter;
    inlineFilter.classList.add(state.recsFilter==='all'?'sel-def':state.recsFilter==='new'?'sel-new':'sel-plex');
    applyRecsFilter();
    return;
  }

  // Inline toolbar: releases type-filter
  const inlineRtype = e.target.closest('.inline-toolbar [data-rtype]');
  if (inlineRtype) {
    document.querySelectorAll('[data-rtype]').forEach(b => b.classList.remove('sel-def'));
    state.releasesFilter = inlineRtype.dataset.rtype;
    inlineRtype.classList.add('sel-def');
    const secRel = document.getElementById('sec-releases-content');
    if (secRel && state.activeTab === 'ontdek') {
      state.sectionContainerEl = secRel;
      renderReleases();
      if (state.sectionContainerEl === secRel) state.sectionContainerEl = null;
    } else { renderReleases(); }
    return;
  }

  // Inline toolbar: releases sortering
  const inlineRsort = e.target.closest('.inline-toolbar [data-rsort]');
  if (inlineRsort) {
    document.querySelectorAll('[data-rsort]').forEach(b => b.classList.remove('sel-def'));
    state.releasesSort = inlineRsort.dataset.rsort;
    inlineRsort.classList.add('sel-def');
    const secRel = document.getElementById('sec-releases-content');
    if (secRel && state.activeTab === 'ontdek') {
      state.sectionContainerEl = secRel;
      renderReleases();
      if (state.sectionContainerEl === secRel) state.sectionContainerEl = null;
    } else { renderReleases(); }
    return;
  }

  // Inline toolbar: discover-filter
  const inlineDfilter = e.target.closest('.inline-toolbar [data-dfilter]');
  if (inlineDfilter) {
    document.querySelectorAll('[data-dfilter]').forEach(b => b.classList.remove('sel-def','sel-new','sel-miss'));
    state.discFilter = inlineDfilter.dataset.dfilter;
    inlineDfilter.classList.add(state.discFilter==='all'?'sel-def':state.discFilter==='new'?'sel-new':'sel-miss');
    const secDisc = document.getElementById('sec-discover-content');
    if (secDisc && state.activeTab === 'ontdek') {
      state.sectionContainerEl = secDisc;
      renderDiscover();
      if (state.sectionContainerEl === secDisc) state.sectionContainerEl = null;
    } else { renderDiscover(); }
    return;
  }

  // Inline toolbar: gaps-sortering
  const inlineGsort = e.target.closest('.inline-toolbar [data-gsort]');
  if (inlineGsort) {
    document.querySelectorAll('[data-gsort]').forEach(b => b.classList.remove('sel-def'));
    state.gapsSort = inlineGsort.dataset.gsort;
    inlineGsort.classList.add('sel-def');
    if (state.activeTab === 'gaps') {
      renderGaps();
    } else {
      renderGaps();
    }
    return;
  }

  // Inline mood-knoppen
  const inlineMoodBtn = e.target.closest('.sec-mood-block [data-mood]');
  if (inlineMoodBtn) {
    const mood = inlineMoodBtn.dataset.mood;
    if (state.activeMood === mood) {
      state.activeMood = null;
      document.querySelectorAll('[data-mood]').forEach(b => b.classList.remove('sel-mood', 'loading'));
      clearSpotifyRecs();
      loadOntdek();
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
        clearSpotifyRecs(); loadOntdek();
      });
      itb.appendChild(sep); itb.appendChild(clr);
    }
    loadSpotifyRecs(mood);
    return;
  }

  // Tidal view-knop
  const tvBtn = e.target.closest('[data-tidal-view]');
  if (tvBtn) {
    const view = tvBtn.dataset.tidalView;
    if (view === 'tidarr') {
      document.getElementById('tb-tidal')?.classList.remove('visible');
      document.getElementById('tb-tidarr-ui')?.classList.add('visible');
      loadTidarrUI();
    } else {
      hideTidarrUI();
      document.getElementById('tb-tidal')?.classList.add('visible');
      document.getElementById('tb-tidarr-ui')?.classList.remove('visible');
      setTidalView(view);
    }
    return;
  }

  // Panel overlay backdrop
  if (e.target === document.getElementById('panel-overlay')) {
    closeArtistPanel();
    return;
  }
});

// ── Keyboard shortcuts ────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeArtistPanel();
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
    if (state.activeTab === 'ontdek')           loadOntdek();
    else if (state.activeTab === 'bibliotheek') loadBibliotheek();
    else if (state.activeTab === 'gaps')        loadGaps();
    else tabLoaders[state.activeTab]?.();
    return;
  }
  if (!inInput && /^[1-5]$/.test(e.key)) {
    const tabs = document.querySelectorAll('.tab');
    const idx  = parseInt(e.key) - 1;
    if (tabs[idx]) tabs[idx].click();
    return;
  }
});

// ── Bottom nav ────────────────────────────────────────────────────────────
document.querySelectorAll('.bnav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    const desktopTab = document.querySelector(`.tab[data-tab="${tab}"]`);
    if (desktopTab) desktopTab.click();
    document.querySelectorAll('.bnav-btn').forEach(b => b.classList.toggle('active', b === btn));
  });
});

document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    document.querySelectorAll('.bnav-btn').forEach(b =>
      b.classList.toggle('active', b.dataset.tab === tab));
  });
});
