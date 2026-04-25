// ── Tracks view — Roon-style My Tracks tabel met Plex + Last.fm ──────────

import { state } from '../state.js';
import { apiFetch } from '../api.js';
import { esc, fmt, proxyImg, showLoading, showError } from '../helpers.js';
import { playOnZone, getSelectedZone } from '../components/plexRemote.js';
import { switchView } from '../router.js';

// ═══════════════════════════════════════════════════════════════════════════
// Module-level state
// ═══════════════════════════════════════════════════════════════════════════

let tracksData = null;           // merged tracks data {plex: [], lastfm: [], all: []}
let tracksSearchTerm = '';       // current search term
let tracksSort = 'artist';       // sort mode: track, length, artist, album
let tracksSortDir = 'asc';       // sort direction: asc or desc
let tracksFilter = 'all';        // filter: all, plex-only, lastfm-only
let tracksScrollPos = 0;         // saved scroll position

// Paginatie
let plexTracksLoadedOffset = 0;  // hoeveel Plex tracks we al opgehaald hebben
let plexTracksTotal = 0;         // totaal aantal Plex tracks
let isLoadingMore = false;       // prevent concurrent load-more requests
const BATCH_SIZE = 200;          // load 200 tracks per batch

// Virtual scrolling config
const TRACK_ROW_HEIGHT = 48;     // Hoogte van elke track-rij in px
const TRACKS_BUFFER = 5;         // Buffer rows boven/onder viewport

// Module-level collator voor optimale sort performance
const collator = new Intl.Collator('nl', { sensitivity: 'base' });

// Scroll debounce
let scrollAnimationFrame = null;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function getContent() {
  return document.getElementById('content');
}

function getToolbar() {
  return document.getElementById('view-toolbar');
}

function formatDuration(ms) {
  if (!ms) return '-';
  const totalSecs = Math.floor(ms / 1000);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/** Bereken hoeveel rijen zichtbaar zijn in viewport. */
function getViewportRows() {
  const content = getContent();
  if (!content) return 20;
  const viewportHeight = content.clientHeight - 100; // aftrekken header
  return Math.ceil(viewportHeight / TRACK_ROW_HEIGHT) + (TRACKS_BUFFER * 2);
}

function normalizeTrackName(name) {
  return (name || '').toLowerCase()
    .replace(/\(.*?\)/g, '').replace(/\[.*?\]/g, '')
    .replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
}

/** Merge Plex tracks met Last.fm data (O(n+m) optimization). */
function mergeTrackData(plexTracks, lastfmTracks) {
  // Build Last.fm map for O(1) lookups
  const lastfmMap = new Map();
  (lastfmTracks || []).forEach(t => {
    const artistName = typeof t.artist === 'object' ? t.artist.name : t.artist;
    const key = normalizeTrackName(`${t.name}|${artistName}`);
    lastfmMap.set(key, { ...t, artist: artistName });
  });

  // Build Set of Plex track keys for fast existence check (O(n))
  const plexTrackKeys = new Set();
  (plexTracks || []).forEach(t => {
    const key = normalizeTrackName(`${t.title}|${t.artist}`);
    plexTrackKeys.add(key);
  });

  // Enriched Plex tracks (O(n))
  const enriched = (plexTracks || []).map(t => {
    const key = normalizeTrackName(`${t.title}|${t.artist}`);
    const lfm = lastfmMap.get(key);
    return {
      ...t,
      source: 'plex',
      plays: lfm?.playcount || 0,
      url: lfm?.url || null,
      inPlex: true,
      sortKey: null  // populated later for performance
    };
  });

  // Last.fm-only tracks (not in Plex) — O(m) since we use Set.has() instead of .find()
  const lastfmOnly = (lastfmTracks || [])
    .filter(t => {
      const artistName = typeof t.artist === 'object' ? t.artist.name : t.artist;
      const key = normalizeTrackName(`${t.name}|${artistName}`);
      return !plexTrackKeys.has(key);
    })
    .map(t => {
      const artistName = typeof t.artist === 'object' ? t.artist.name : t.artist;
      return {
        ratingKey: null,
        title: t.name,
        artist: artistName,
        album: t.album || '',
        duration: 0,
        thumb: null,
        source: 'lastfm',
        plays: t.playcount,
        url: t.url,
        inPlex: false,
        sortKey: null  // populated later
      };
    });

  return {
    plex: enriched,
    lastfm: lastfmOnly,
    all: [...enriched, ...lastfmOnly]
  };
}

/** Cache sortKey per track — populated once to avoid repeated localeCompare. */
function buildSortKeys(tracks) {
  tracks.forEach(t => {
    if (!t.sortKey) {
      t.sortKey = {
        artist: (t.artist || '').toLowerCase(),
        album: (t.album || '').toLowerCase(),
        title: (t.title || '').toLowerCase(),
        duration: t.duration || 0
      };
    }
  });
}

/** Filter en sorteer tracks met Intl.Collator voor betere performance. */
function filterAndSort(tracks) {
  let filtered = tracks.filter(t => {
    if (tracksFilter === 'plex-only') return t.inPlex;
    if (tracksFilter === 'lastfm-only') return !t.inPlex;
    return true;
  });

  if (tracksSearchTerm) {
    const q = tracksSearchTerm.toLowerCase().trim();
    filtered = filtered.filter(t =>
      t.title.toLowerCase().includes(q) ||
      t.artist.toLowerCase().includes(q) ||
      t.album.toLowerCase().includes(q)
    );
  }

  // Build sort keys once if not already built
  buildSortKeys(filtered);

  // Sort using Intl.Collator + cached keys
  const ascending = tracksSortDir === 'asc';
  const compare = (a, b) => {
    let result = 0;

    switch (tracksSort) {
      case 'artist':
        result = collator.compare(a.sortKey.artist, b.sortKey.artist) ||
                 collator.compare(a.sortKey.album, b.sortKey.album) ||
                 collator.compare(a.sortKey.title, b.sortKey.title);
        break;
      case 'album':
        result = collator.compare(a.sortKey.album, b.sortKey.album) ||
                 collator.compare(a.sortKey.artist, b.sortKey.artist) ||
                 collator.compare(a.sortKey.title, b.sortKey.title);
        break;
      case 'length':
        result = (a.sortKey.duration) - (b.sortKey.duration);
        break;
      case 'track':
      default:
        result = collator.compare(a.sortKey.title, b.sortKey.title);
    }

    return ascending ? result : -result;
  };

  filtered.sort(compare);
  return filtered;
}

/** Render Roon-style header. */
function renderHeader() {
  const toolbar = getToolbar();
  const totalTracks = tracksData?.all?.length || 0;

  toolbar.innerHTML = `
    <div class="tracks-roon-header">
      <!-- Title & count -->
      <div class="tracks-roon-title">
        <h1>My Tracks</h1>
        <span class="tracks-roon-count">${fmt(totalTracks)} tracks</span>
      </div>

      <!-- Left actions: Focus + Heart -->
      <div class="tracks-roon-left-actions">
        <button class="tracks-focus-btn" title="Focus">
          Focus <span class="tracks-focus-arrow">›</span>
        </button>
        <button class="tracks-heart-btn" title="Favorite">♡</button>
      </div>

      <!-- Right actions: Play now dropdown -->
      <button class="tracks-play-now-btn">
        ▶ Play now <span class="tracks-dropdown-arrow">▼</span>
      </button>
    </div>
  `;

  // Event listeners
  toolbar.querySelector('.tracks-focus-btn')?.addEventListener('click', () => {
    // Focus functionaliteit (toekomstig)
  });

  toolbar.querySelector('.tracks-heart-btn')?.addEventListener('click', () => {
    // Heart functionaliteit (toekomstig)
  });

  toolbar.querySelector('.tracks-play-now-btn')?.addEventListener('click', () => {
    // Speel alle visible tracks af
    const zone = getSelectedZone();
    if (!zone) {
      showError('Selecteer eerst een Plex zone');
      return;
    }
    // Play all visible tracks functionaliteit
  });
}

/** Render Roon-style track tabel met div-gebaseerde virtual scrolling. */
async function renderTracks() {
  const content = getContent();
  if (!content || !tracksData) return;

  renderHeader();

  const filtered = filterAndSort(tracksData.all);

  if (filtered.length === 0) {
    content.innerHTML = `
      <div class="tracks-empty">
        <div class="tracks-empty-icon">♪</div>
        <div class="tracks-empty-message">Geen sporen gevonden</div>
        <div class="tracks-empty-hint">Probeer andere zoekopdracht of filters</div>
      </div>
    `;
    return;
  }

  // Render div-gebaseerde virtual scrolling container
  content.innerHTML = `
    <div class="tracks-roon-container" id="tracks-roon-container" style="overflow-y: auto; position: relative; height: 100%; display: flex; flex-direction: column;">
      <div class="tracks-roon-header-wrapper" style="position: sticky; top: 0; z-index: 10; background: var(--bg-color, white);">
        <div class="tracks-roon-column-headers" style="display: grid; grid-template-columns: 3rem 4rem 1fr 2rem 4rem 8rem 10rem 2rem; gap: 0.5rem; padding: 0.5rem 1rem; border-bottom: 1px solid var(--border-color, #e0e0e0); font-weight: 500; font-size: 0.875rem;">
          <div class="tracks-col-num">#</div>
          <div class="tracks-col-art"></div>
          <div class="tracks-col-title" data-sort="track" style="cursor: pointer;">
            Track ${tracksSort === 'track' ? `<span class="tracks-sort-arrow">${tracksSortDir === 'asc' ? '↑' : '↓'}</span>` : ''}
          </div>
          <div class="tracks-col-heart">♡</div>
          <div class="tracks-col-length" data-sort="length" style="cursor: pointer;">
            Length ${tracksSort === 'length' ? `<span class="tracks-sort-arrow">${tracksSortDir === 'asc' ? '↑' : '↓'}</span>` : ''}
          </div>
          <div class="tracks-col-artist" data-sort="artist" style="cursor: pointer;">
            Artist ${tracksSort === 'artist' ? `<span class="tracks-sort-arrow">${tracksSortDir === 'asc' ? '↑' : '↓'}</span>` : ''}
          </div>
          <div class="tracks-col-album" data-sort="album" style="cursor: pointer;">
            Album ${tracksSort === 'album' ? `<span class="tracks-sort-arrow">${tracksSortDir === 'asc' ? '↑' : '↓'}</span>` : ''}
          </div>
          <div class="tracks-col-menu">⚙️</div>
        </div>
      </div>

      <div class="tracks-virtual-scroller" id="tracks-virtual-scroller" style="position: relative; flex: 1; overflow-y: auto;">
        <div class="tracks-virtual-spacer" id="tracks-virtual-spacer" style="position: relative; width: 100%;"></div>
        <div class="tracks-rows-container" id="tracks-rows-container" style="position: absolute; top: 0; left: 0; right: 0; width: 100%;"></div>
      </div>

      <div class="tracks-load-more-container" id="tracks-load-more-container" style="padding: 1rem; text-align: center; display: none;">
        <button class="tracks-load-more-btn" id="tracks-load-more-btn" style="padding: 0.5rem 1rem; cursor: pointer;">Load More Tracks</button>
      </div>
    </div>
  `;

  // Initialize virtual scrolling
  const scroller = document.getElementById('tracks-virtual-scroller');
  const rowsContainer = document.getElementById('tracks-rows-container');
  const spacer = document.getElementById('tracks-virtual-spacer');
  const container = document.getElementById('tracks-roon-container');

  // Set spacer height
  const totalHeight = filtered.length * TRACK_ROW_HEIGHT;
  spacer.style.height = totalHeight + 'px';

  // Attach header column sort listeners (event delegation)
  const headerWrapper = content.querySelector('.tracks-roon-header-wrapper');
  if (headerWrapper) {
    headerWrapper.addEventListener('click', (e) => {
      const sortBtn = e.target.closest('[data-sort]');
      if (sortBtn) {
        const newSort = sortBtn.getAttribute('data-sort');
        if (tracksSort === newSort) {
          tracksSortDir = tracksSortDir === 'asc' ? 'desc' : 'asc';
        } else {
          tracksSort = newSort;
          tracksSortDir = 'asc';
        }
        renderTracks();
      }
    });
  }

  // Render initial visible rows
  function updateVisibleRows() {
    const scrollTop = scroller.scrollTop;
    const startIdx = Math.max(0, Math.floor(scrollTop / TRACK_ROW_HEIGHT) - TRACKS_BUFFER);
    const endIdx = Math.min(filtered.length, startIdx + getViewportRows());

    rowsContainer.innerHTML = renderVisibleRowsHTML(filtered, startIdx, endIdx);
    rowsContainer.style.transform = `translateY(${startIdx * TRACK_ROW_HEIGHT}px)`;

    // Attach event listeners (event delegation at container level)
    attachTableEventsVirtualized(rowsContainer, filtered);
  }

  // Initial render
  updateVisibleRows();

  // Debounced scroll handler using requestAnimationFrame
  scroller.addEventListener('scroll', () => {
    if (scrollAnimationFrame) cancelAnimationFrame(scrollAnimationFrame);
    scrollAnimationFrame = requestAnimationFrame(() => {
      updateVisibleRows();
    });
  });

  // Load more button
  const loadMoreBtn = document.getElementById('tracks-load-more-btn');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
      loadMoreTracksData();
    });
  }

  // Show load more button if Plex has more tracks
  updateLoadMoreButton();
}

/** Render visible rows HTML for div-based virtual scrolling. */
function renderVisibleRowsHTML(filtered, startIdx, endIdx = null) {
  if (endIdx === null) {
    endIdx = Math.min(filtered.length, startIdx + getViewportRows());
  }

  return filtered.slice(startIdx, endIdx).map((track, idx) => {
    const actualIdx = startIdx + idx;
    const coverSrc = track.thumb ? proxyImg(track.thumb, 40) : null;
    const inPlexIcon = track.inPlex ? '<span class="tracks-plex-pin" title="In Plex">📌</span>' : '';

    return `
      <div class="tracks-roon-row"
        data-idx="${actualIdx}"
        data-rating-key="${track.ratingKey || ''}"
        data-track-idx="${actualIdx}"
        style="
          display: grid;
          grid-template-columns: 3rem 4rem 1fr 2rem 4rem 8rem 10rem 2rem;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-bottom: 1px solid var(--border-color, #e0e0e0);
          align-items: center;
          height: ${TRACK_ROW_HEIGHT}px;
          cursor: pointer;
        ">
        <div class="tracks-col-num">${actualIdx + 1}</div>
        <div class="tracks-col-art">
          ${coverSrc
            ? `<img src="${esc(coverSrc)}" alt="album art" class="tracks-thumb" style="width: 100%; height: 100%; border-radius: 2px;">`
            : '<div class="tracks-thumb-placeholder">♪</div>'
          }
        </div>
        <div class="tracks-col-title">
          <span class="tracks-title-text">${esc(track.title)}</span>
          ${inPlexIcon}
        </div>
        <div class="tracks-col-heart">
          <button class="tracks-heart-toggle" data-track-id="${esc(track.title)}" title="Add to favorites" style="background: none; border: none; cursor: pointer; font-size: 1rem;">♡</button>
        </div>
        <div class="tracks-col-length">${formatDuration(track.duration)}</div>
        <div class="tracks-col-artist">
          <span class="tracks-artist-link" data-artist="${esc(track.artist)}" style="cursor: pointer; text-decoration: underline;">${esc(track.artist)}</span>
        </div>
        <div class="tracks-col-album">
          <span class="tracks-album-link" data-album="${esc(track.album)}" style="cursor: pointer; text-decoration: underline;">${esc(track.album)}</span>
        </div>
        <div class="tracks-col-menu">
          <button class="tracks-menu-btn" title="More options" style="background: none; border: none; cursor: pointer;">⋯</button>
        </div>
      </div>
    `;
  }).join('');
}

/** Attach event listeners using event delegation (single listener on container). */
function attachTableEventsVirtualized(container, filtered) {
  // Event delegation: single listener on rows-container instead of per-element
  container.addEventListener('click', handleRowClick, { capture: false });
  container.addEventListener('dblclick', handleRowDoubleClick, { capture: false });
}

/** Handle clicks on row elements (event delegation). */
async function handleRowClick(e) {
  const row = e.target.closest('.tracks-roon-row');
  if (!row) return;

  const artistLink = e.target.closest('.tracks-artist-link');
  if (artistLink) {
    e.stopPropagation();
    const artist = artistLink.getAttribute('data-artist');
    if (artist) switchView('artist-detail', { name: artist });
    return;
  }

  const albumLink = e.target.closest('.tracks-album-link');
  if (albumLink) {
    e.stopPropagation();
    // TODO: navigate to album detail
    return;
  }

  const heartBtn = e.target.closest('.tracks-heart-toggle');
  if (heartBtn) {
    e.stopPropagation();
    heartBtn.classList.toggle('loved');
    return;
  }

  const menuBtn = e.target.closest('.tracks-menu-btn');
  if (menuBtn) {
    e.stopPropagation();
    // Show context menu
    return;
  }
}

/** Handle double-click to play track. */
async function handleRowDoubleClick(e) {
  const row = e.target.closest('.tracks-roon-row');
  if (!row) return;

  e.preventDefault();
  const ratingKey = row.getAttribute('data-rating-key');
  if (!ratingKey) return;

  const zone = getSelectedZone();
  if (!zone) {
    showError('Selecteer eerst een Plex zone');
    return;
  }

  try {
    await playOnZone(ratingKey, 'music');
  } catch (err) {
    showError('Kan nummer niet afspelen: ' + err.message);
  }
}

/** Load initial batch of Plex tracks + Last.fm data. */
async function loadTracksData() {
  // Abort any previous request
  if (state.tabAbort) state.tabAbort.abort();
  state.tabAbort = new AbortController();

  try {
    // Load first BATCH_SIZE Plex tracks + Last.fm data in parallel
    const [plexRes, lastfmRes] = await Promise.allSettled([
      apiFetch(`/api/plex/tracks?limit=${BATCH_SIZE}&offset=0`, {
        signal: state.tabAbort.signal
      }),
      apiFetch('/api/top/tracks?period=overall', {
        signal: state.tabAbort.signal
      })
    ]);

    // Check if user navigated away
    if (state.activeView !== 'tracks') return;

    const plexPayload = plexRes.status === 'fulfilled' ? plexRes.value : { tracks: [], total: 0 };
    const plexTracks = plexPayload.tracks || [];
    plexTracksLoadedOffset = plexPayload.tracks?.length || 0;
    plexTracksTotal = plexPayload.total || 0;

    const lastfmTracks = lastfmRes.status === 'fulfilled'
      ? lastfmRes.value?.toptracks?.track || lastfmRes.value?.track || []
      : [];

    // Merge data
    tracksData = mergeTrackData(plexTracks, lastfmTracks);

    if (tracksData.all.length === 0) {
      showError('Geen sporen gevonden. Controleer of Plex en Last.fm geconfigureerd zijn.');
      return;
    }

    // Render view
    await renderTracks();
    document.title = 'Muziek · Tracks';
  } catch (err) {
    // Ignore abort errors (user navigated away)
    if (err.name !== 'AbortError') {
      showError('Kan tracks niet laden: ' + err.message);
    }
  }
}

/** Load more Plex tracks (pagination). */
async function loadMoreTracksData() {
  if (isLoadingMore || plexTracksLoadedOffset >= plexTracksTotal) return;
  isLoadingMore = true;

  // Abort any previous request
  if (state.tabAbort) state.tabAbort.abort();
  state.tabAbort = new AbortController();

  try {
    const res = await apiFetch(
      `/api/plex/tracks?limit=${BATCH_SIZE}&offset=${plexTracksLoadedOffset}`,
      { signal: state.tabAbort.signal }
    );

    // Check if user navigated away
    if (state.activeView !== 'tracks') return;

    const newPlexTracks = res.tracks || [];
    if (newPlexTracks.length === 0) {
      isLoadingMore = false;
      updateLoadMoreButton();
      return;
    }

    // Merge new Plex tracks with existing Last.fm data
    const lastfmMap = new Map();
    (tracksData.lastfm || []).forEach(t => {
      const artistName = typeof t.artist === 'object' ? t.artist.name : t.artist;
      const key = normalizeTrackName(`${t.title}|${artistName}`);
      lastfmMap.set(key, t);
    });

    const enrichedNewTracks = newPlexTracks.map(t => {
      const key = normalizeTrackName(`${t.title}|${t.artist}`);
      const lfm = lastfmMap.get(key);
      return {
        ...t,
        source: 'plex',
        plays: lfm?.playcount || 0,
        url: lfm?.url || null,
        inPlex: true,
        sortKey: null
      };
    });

    // Append to tracksData.plex
    tracksData.plex.push(...enrichedNewTracks);

    // Rebuild tracksData.all incrementally
    tracksData.all = [...tracksData.plex, ...tracksData.lastfm];

    plexTracksLoadedOffset += newPlexTracks.length;

    // Re-render the tracks view
    await renderTracks();
    updateLoadMoreButton();
  } catch (err) {
    if (err.name !== 'AbortError') {
      showError('Kan meer tracks niet laden: ' + err.message);
    }
  } finally {
    isLoadingMore = false;
  }
}

/** Show/hide the "Load more" button. */
function updateLoadMoreButton() {
  const loadMoreContainer = document.getElementById('tracks-load-more-container');
  if (!loadMoreContainer) return;

  if (plexTracksLoadedOffset < plexTracksTotal) {
    loadMoreContainer.style.display = 'block';
  } else {
    loadMoreContainer.style.display = 'none';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Export
// ─────────────────────────────────────────────────────────────────────────────

export async function loadTracks() {
  const content = getContent();
  if (!content) return;

  showLoading();  // Only show loading once at entry point
  await loadTracksData();
}
