// ── Tab: Bibliotheek ──────────────────────────────────────────────────────
import { state } from '../state.js';
import { apiFetch } from '../api.js';
import { getCached, setCache } from '../cache.js';
import {
  esc, fmt, initials, gradientFor, tagsHtml, bookmarkBtn,
  countryFlag, albumCard, showLoading, setContent, showError,
  setupLazyLoad, runWithSection, contentEl, sanitizeArtistName, periodLabel,
  getImg, trackImg, timeAgo, proxyImg, p, limitConcurrency
} from '../helpers.js';
import { loadWishlist } from '../components/wishlist.js';
import { loadPlexStatus } from '../api.js';
import { playOnZone, pauseZone, skipZone, getSelectedZone } from '../components/plexRemote.js';
import { hideTidarrUI, stopTidarrQueuePolling } from './downloads.js';
import { renderRecentTracks } from '../modules/recentTracks.js';

// ═══════════════════════════════════════════════════════════════════════════
// Module-level state
// ═══════════════════════════════════════════════════════════════════════════
let blibData         = null;     // raw library data (array of {artist,album,ratingKey,thumb})
let blibSort         = 'artist'; // 'artist' | 'album' | 'recent'
let blibSearchTerm   = '';
let blibViewMode     = 'grid';   // 'grid' | 'list'
let blibArtistFilter = null;     // artist name string or null
let blibCurrentView  = 'grid';   // 'grid' | 'detail' | 'artist' | 'playlist'
let blibDetailItem   = null;
let blibScroller     = null;
let blibPlaylistKey  = null;

// ── Tab system ──
let blibCurrentTab   = localStorage.getItem('blibCurrentTab') || 'albums'; // 'albums' | 'artists' | 'tracks' | 'genres' | 'playlists' | 'recent'
let blibArtistsData  = null;     // cache voor artists
let blibTracksData   = null;     // cache voor tracks
let blibGenresData   = null;     // cache voor genres
let blibPlaylistsData = null;    // cache voor playlists
let blibTrackSearchTerm = '';    // search term voor tracks tab
let blibArtistSearchTerm = '';   // search term voor artists tab

// ── Navigation stack ──
let blibNavigationStack = [];    // stack van navigatie-states { view, data }

// Row dimensions for virtual scroller
const BLIB_GRID_ROW_H = 210;
const BLIB_LIST_ROW_H = 62;
const BLIB_BUFFER     = 3;

// ── Helpers ──────────────────────────────────────────────────────────────

function blibContentEl() {
  return document.getElementById('content');
}

function blibGetCols() {
  const w = window.innerWidth;
  if (w >= 1600) return 8;
  if (w >= 1300) return 7;
  if (w >= 1050) return 6;
  if (w >= 850)  return 5;
  if (w >= 650)  return 4;
  if (w >= 480)  return 3;
  return 2;
}

// ── Data loading ─────────────────────────────────────────────────────────

async function blibLoad() {
  if (blibData) return blibData;
  try {
    const res = await apiFetch('/api/plex/library/all');
    if (!res || !res.library) {
      console.warn('Bibliotheek response is null/undefined:', res);
      return [];
    }
    if (!Array.isArray(res.library)) {
      console.warn('Bibliotheek is niet een array:', res.library);
      return [];
    }
    if (!res.library.length) return [];
    blibData = res.library.map(([artist, album, ratingKey, thumb, addedAt]) => ({
      artist: artist || '',
      album: album || '',
      ratingKey: ratingKey || '',
      thumb: thumb || '',
      addedAt: addedAt || 0
    }));
    return blibData;
  } catch (e) {
    console.error('Fout bij laden bibliotheek:', e);
    return [];
  }
}

// ── Filter + sort ────────────────────────────────────────────────────────

function blibApplyFilters() {
  let data = blibData || [];

  if (blibArtistFilter) {
    data = data.filter(x => x.artist === blibArtistFilter);
  }

  const q = blibSearchTerm.toLowerCase().trim();
  if (q) {
    data = data.filter(x =>
      x.artist.toLowerCase().includes(q) || x.album.toLowerCase().includes(q)
    );
  }

  // Enhanced sorting for albums tab
  if (blibSort === 'artist') {
    data = [...data].sort((a, b) =>
      a.artist.localeCompare(b.artist, 'nl', { sensitivity: 'base' }) ||
      a.album.localeCompare(b.album,   'nl', { sensitivity: 'base' })
    );
  } else if (blibSort === 'artist-za') {
    data = [...data].sort((a, b) =>
      b.artist.localeCompare(a.artist, 'nl', { sensitivity: 'base' }) ||
      b.album.localeCompare(a.album,   'nl', { sensitivity: 'base' })
    );
  } else if (blibSort === 'album') {
    data = [...data].sort((a, b) =>
      a.album.localeCompare(b.album, 'nl', { sensitivity: 'base' })
    );
  } else if (blibSort === 'album-za') {
    data = [...data].sort((a, b) =>
      b.album.localeCompare(a.album, 'nl', { sensitivity: 'base' })
    );
  } else if (blibSort === 'recent') {
    // Recent = newest first (by addedAt timestamp)
    data = [...data].sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
  } else if (blibSort === 'year-new' || blibSort === 'year-old') {
    // Year sorting would need additional data from Plex
    // For now, keep order as-is
  }

  return data;
}

// ── Group by first letter ─────────────────────────────────────────────────

function blibGroupByLetter(data) {
  const groups = new Map();
  for (const item of data) {
    const first  = (item.artist[0] || '#').toUpperCase();
    const letter = /[A-Z]/.test(first) ? first : '#';
    if (!groups.has(letter)) groups.set(letter, []);
    groups.get(letter).push(item);
  }
  return groups;
}

// ── Album card HTML ───────────────────────────────────────────────────────

function blibAlbumCard(item) {
  const src = item.thumb ? proxyImg(item.thumb, 240) : null;
  const img = src
    ? `<img src="${esc(src)}" alt="${esc(item.album)} by ${esc(item.artist)}" loading="lazy"
         onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
       <div class="blib-cover-ph" style="display:none;background:${gradientFor(item.album)}">${initials(item.album)}</div>`
    : `<div class="blib-cover-ph" style="background:${gradientFor(item.album)}">${initials(item.album)}</div>`;

  if (blibViewMode === 'list') {
    return `<div class="blib-album blib-album-list"
      data-rating-key="${esc(item.ratingKey)}"
      data-album="${esc(item.album)}"
      data-artist="${esc(item.artist)}"
      data-thumb="${esc(item.thumb || '')}">
      <div class="blib-cover blib-cover-sm">${img}</div>
      <div class="blib-list-info">
        <div class="blib-album-title" title="${esc(item.album)}">${esc(item.album)}</div>
        <button class="blib-artist-filter-btn" data-artist-filter="${esc(item.artist)}">${esc(item.artist)}</button>
      </div>
      <button class="blib-play-btn" title="Afspelen">▶</button>
    </div>`;
  }

  return `<div class="blib-album"
    data-rating-key="${esc(item.ratingKey)}"
    data-album="${esc(item.album)}"
    data-artist="${esc(item.artist)}"
    data-thumb="${esc(item.thumb || '')}">
    <div class="blib-cover">
      ${img}
      <div class="blib-play-overlay"><button class="blib-play-btn" title="Afspelen">▶</button></div>
    </div>
    <div class="blib-album-title" title="${esc(item.album)}">${esc(item.album)}</div>
    <button class="blib-artist-filter-btn" data-artist-filter="${esc(item.artist)}">${esc(item.artist)}</button>
  </div>`;
}

// ═══════════════════════════════════════════════════════════════════════════
// Virtual Scroller — ondersteunt grid én lijst modus
// ═══════════════════════════════════════════════════════════════════════════
class BlibVirtualScroller {
  constructor(container, items) {
    this.container = container;
    this.items     = items;
    this.cols      = blibViewMode === 'list' ? 1 : blibGetCols();
    this.rowH      = blibViewMode === 'list' ? BLIB_LIST_ROW_H : BLIB_GRID_ROW_H;
    this.lastStart = -1;
    this.lastEnd   = -1;

    const useGroups = (blibSort === 'artist' && !blibSearchTerm && !blibArtistFilter && blibViewMode === 'grid');
    this.groups   = useGroups ? blibGroupByLetter(items) : null;
    this.flatRows = this._buildFlatRows();
    this._createDOM();

    // Scroll listener op #content, niet op window
    this._scrollEl = blibContentEl() || window;
    this._onScroll = this._onScroll.bind(this);
    this._onResize = this._onResize.bind(this);
    this._scrollEl.addEventListener('scroll', this._onScroll, { passive: true });
    window.addEventListener('resize', this._onResize);
    this.render();
  }

  _buildFlatRows() {
    const rows = [];
    let offset = 0;

    if (this.groups) {
      for (const [letter, items] of this.groups) {
        rows.push({ type: 'header', letter, height: 56, offset });
        offset += 56;
        for (let i = 0; i < items.length; i += this.cols) {
          rows.push({ type: 'items', items: items.slice(i, i + this.cols), height: this.rowH, offset });
          offset += this.rowH;
        }
      }
    } else {
      for (let i = 0; i < this.items.length; i += this.cols) {
        rows.push({ type: 'items', items: this.items.slice(i, i + this.cols), height: this.rowH, offset });
        offset += this.rowH;
      }
    }

    this.totalHeight = offset;
    return rows;
  }

  _createDOM() {
    this.container.innerHTML =
      `<div class="blib-virtual-container" style="height:${this.totalHeight}px;position:relative">
         <div class="blib-virtual-window" style="position:absolute;left:0;right:0;top:0"></div>
       </div>`;
    this.winEl = this.container.querySelector('.blib-virtual-window');
  }

  _getScrollTop() {
    return this._scrollEl === window
      ? (window.scrollY || document.documentElement.scrollTop)
      : this._scrollEl.scrollTop;
  }

  _getViewHeight() {
    return this._scrollEl === window ? window.innerHeight : this._scrollEl.clientHeight;
  }

  _onScroll() { this.render(); }

  _onResize() {
    const newCols = blibViewMode === 'list' ? 1 : blibGetCols();
    if (newCols !== this.cols) {
      this.cols = newCols;
      this.flatRows = this._buildFlatRows();
      const vc = this.container.querySelector('.blib-virtual-container');
      if (vc) vc.style.height = this.totalHeight + 'px';
      this.lastStart = -1;
      this.lastEnd   = -1;
    }
    this.render();
  }

  render() {
    const scrollTop    = this._getScrollTop();
    const viewH        = this._getViewHeight();
    const containerTop = this.container.getBoundingClientRect().top +
      (this._scrollEl === window ? window.scrollY : this._scrollEl.getBoundingClientRect().top + this._scrollEl.scrollTop);
    const relTop = scrollTop - containerTop;
    const buf    = BLIB_BUFFER * this.rowH;

    let start = 0;
    let end   = this.flatRows.length - 1;

    for (let i = 0; i < this.flatRows.length; i++) {
      const r = this.flatRows[i];
      if (r.offset + r.height >= relTop - buf) { start = Math.max(0, i - BLIB_BUFFER); break; }
    }
    for (let i = start; i < this.flatRows.length; i++) {
      if (this.flatRows[i].offset > relTop + viewH + buf) { end = i; break; }
    }

    if (start === this.lastStart && end === this.lastEnd) return;
    this.lastStart = start;
    this.lastEnd   = end;

    let html = '';
    for (let i = start; i <= end && i < this.flatRows.length; i++) {
      const row = this.flatRows[i];
      if (row.type === 'header') {
        html += `<div class="blib-letter-header" style="height:${row.height}px">${esc(row.letter)}</div>`;
      } else {
        const cls = blibViewMode === 'list' ? 'blib-list-rows' : 'blib-grid';
        html += `<div class="${cls}">`;
        for (const item of row.items) html += blibAlbumCard(item);
        html += `</div>`;
      }
    }

    this.winEl.style.top = (this.flatRows[start]?.offset || 0) + 'px';
    this.winEl.innerHTML = html;
  }

  destroy() {
    this._scrollEl.removeEventListener('scroll', this._onScroll);
    window.removeEventListener('resize', this._onResize);
  }

  scrollToLetter(letter) {
    for (const row of this.flatRows) {
      if (row.type === 'header' && row.letter === letter) {
        const scrollEl = this._scrollEl;
        if (scrollEl !== window) {
          scrollEl.scrollTop = row.offset;
        } else {
          const top = this.container.getBoundingClientRect().top + window.scrollY + row.offset - 120;
          window.scrollTo({ top, behavior: 'smooth' });
        }
        return;
      }
    }
  }

  getAvailableLetters() {
    return new Set(this.flatRows.filter(r => r.type === 'header').map(r => r.letter));
  }
}

// ── A-Z navigatie rail ─────────────────────────────────────────────────────

function blibRenderAZRail(scroller) {
  const rail = document.getElementById('blib-az-rail');
  if (!rail) return;
  const available = scroller.getAvailableLetters();
  rail.innerHTML = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#'.split('').map(l =>
    `<button class="blib-az-btn${available.has(l) ? '' : ' disabled'}" data-letter="${l}">${l}</button>`
  ).join('');
  rail.addEventListener('click', e => {
    const btn = e.target.closest('.blib-az-btn');
    if (btn && !btn.classList.contains('disabled')) scroller.scrollToLetter(btn.dataset.letter);
  });
}

// ── Count badge ───────────────────────────────────────────────────────────

function blibUpdateCount(n) {
  const el = document.getElementById('blib-count');
  if (el) el.textContent = `${fmt(n)} albums`;
}

// ── Grid/list renderen ─────────────────────────────────────────────────────

async function blibRender(container) {
  if (blibScroller) { blibScroller.destroy(); blibScroller = null; }

  const data = blibApplyFilters();
  blibUpdateCount(data.length);

  if (!data.length) {
    container.innerHTML = `
      <div class="blib-empty">
        <div class="blib-empty-icon">🎵</div>
        <h3>Geen albums gevonden</h3>
        <p>${blibSearchTerm
          ? `Geen resultaten voor "<strong>${esc(blibSearchTerm)}</strong>"`
          : blibArtistFilter
            ? `Geen albums van <strong>${esc(blibArtistFilter)}</strong> in bibliotheek.`
            : 'Plex bibliotheek is leeg of nog niet gesynchroniseerd.'}</p>
      </div>`;
    return;
  }

  blibScroller = new BlibVirtualScroller(container, data);

  if (blibSort === 'artist' && !blibSearchTerm && !blibArtistFilter && blibViewMode === 'grid') {
    blibRenderAZRail(blibScroller);
  } else {
    const rail = document.getElementById('blib-az-rail');
    if (rail) rail.innerHTML = '';
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Tab bar (boven #view-toolbar)
// ═══════════════════════════════════════════════════════════════════════════

function blibRenderTabBar() {
  // Tab bar is now part of blibRenderToolbar()
  blibRenderToolbar();
}

async function blibSwitchTab(tabKey) {
  if (blibCurrentTab === tabKey) return;
  blibCurrentTab = tabKey;
  localStorage.setItem('blibCurrentTab', tabKey);

  // Reset search terms
  blibSearchTerm = '';
  blibTrackSearchTerm = '';
  blibArtistSearchTerm = '';

  // Update tab buttons
  blibRenderTabBar();

  // Load en render nieuwe tab
  const container = blibContentEl();
  if (!container) return;
  container.scrollTop = 0;

  switch (tabKey) {
    case 'albums':
      blibRenderToolbar();
      await blibShowGrid(container);
      break;
    case 'artists':
      await blibShowArtistsTab(container);
      break;
    case 'tracks':
      await blibShowTracksTab(container);
      break;
    case 'genres':
      await blibShowGenresTab(container);
      break;
    case 'playlists':
      await blibShowPlaylistsTab(container);
      break;
    case 'recent':
      await blibShowRecentTab(container);
      break;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Toolbar (renderen in #view-toolbar)
// ═══════════════════════════════════════════════════════════════════════════

function blibRenderToolbar() {
  const toolbar = document.getElementById('view-toolbar');
  if (!toolbar) return;

  // Maak tabbar HTML
  const tabs = ['Albums', 'Artiesten', 'Nummers', 'Genres', 'Playlists', 'Recent'];
  const keys = ['albums', 'artists', 'tracks', 'genres', 'playlists', 'recent'];
  const tabBarHtml = `<div class="blib-tab-bar" id="blib-tab-bar">
    ${tabs.map((name, i) => {
      const key = keys[i];
      const active = blibCurrentTab === key ? ' active' : '';
      return `<button class="blib-tab-btn${active}" data-tab="${key}">${name}</button>`;
    }).join('')}
  </div>`;

  // Maak toolbar content HTML
  let toolbarContentHtml = '';

  // Albums tab toolbar - met uitgebreide sort opties
  if (blibCurrentTab === 'albums') {
    toolbarContentHtml = `
      <div class="blib-toolbar">
        <input class="blib-search" id="blib-search" type="text"
          placeholder="🔍 Zoek artiest of album…" autocomplete="off"
          value="${esc(blibSearchTerm)}">

        <div class="blib-toolbar-sep"></div>

        <div class="blib-view-toggle" role="group" aria-label="Weergavemodus">
          <button class="blib-pill${blibViewMode === 'grid' ? ' active' : ''}" id="blib-btn-grid"
                  title="Grid weergave" aria-pressed="${blibViewMode === 'grid'}">⊞</button>
          <button class="blib-pill${blibViewMode === 'list' ? ' active' : ''}" id="blib-btn-list"
                  title="Lijst weergave" aria-pressed="${blibViewMode === 'list'}">☰</button>
        </div>

        <select class="blib-sort-select" id="blib-sort-select" aria-label="Sortering">
          <option value="artist"${blibSort === 'artist' ? ' selected' : ''}>Artiest A–Z</option>
          <option value="artist-za"${blibSort === 'artist-za' ? ' selected' : ''}>Artiest Z–A</option>
          <option value="album"${blibSort === 'album'   ? ' selected' : ''}>Album A–Z</option>
          <option value="album-za"${blibSort === 'album-za'   ? ' selected' : ''}>Album Z–A</option>
          <option value="recent"${blibSort === 'recent' ? ' selected' : ''}>Recent toegevoegd</option>
          <option value="year-new"${blibSort === 'year-new' ? ' selected' : ''}>Jaar (nieuwste eerst)</option>
          <option value="year-old"${blibSort === 'year-old' ? ' selected' : ''}>Jaar (oudste eerst)</option>
        </select>

        <span class="blib-count" id="blib-count"></span>

        <button class="tool-btn" id="btn-sync-plex-blib">↻ Sync Plex</button>
      </div>
      <div class="blib-az-rail" id="blib-az-rail"></div>`;
  }
  // Artists tab - met sort opties
  else if (blibCurrentTab === 'artists') {
    toolbarContentHtml = `
      <div class="blib-toolbar">
        <input class="blib-search" id="blib-artist-search" type="text"
          placeholder="🔍 Zoek artiest…" autocomplete="off"
          value="${esc(blibArtistSearchTerm)}">

        <div class="blib-toolbar-sep"></div>

        <select class="blib-sort-select" id="blib-sort-select" aria-label="Sortering">
          <option value="artist"${blibSort === 'artist' ? ' selected' : ''}>Naam A–Z</option>
          <option value="artist-za"${blibSort === 'artist-za' ? ' selected' : ''}>Naam Z–A</option>
          <option value="albums"${blibSort === 'albums' ? ' selected' : ''}>Aantal albums (meeste eerst)</option>
        </select>

        <button class="tool-btn" id="btn-sync-plex-blib">↻ Sync Plex</button>
      </div>`;
  }
  // Tracks tab - met sort opties
  else if (blibCurrentTab === 'tracks') {
    toolbarContentHtml = `
      <div class="blib-toolbar">
        <input class="blib-search" id="blib-track-search" type="text"
          placeholder="🔍 Zoek nummer…" autocomplete="off"
          value="${esc(blibTrackSearchTerm)}">

        <div class="blib-toolbar-sep"></div>

        <select class="blib-sort-select" id="blib-sort-select" aria-label="Sortering">
          <option value="title"${blibSort === 'title' ? ' selected' : ''}>Titel A–Z</option>
          <option value="artist"${blibSort === 'artist' ? ' selected' : ''}>Artiest A–Z</option>
          <option value="album"${blibSort === 'album' ? ' selected' : ''}>Album A–Z</option>
          <option value="duration"${blibSort === 'duration' ? ' selected' : ''}>Duur (kortste eerst)</option>
          <option value="duration-long"${blibSort === 'duration-long' ? ' selected' : ''}>Duur (langste eerst)</option>
        </select>

        <button class="tool-btn" id="btn-sync-plex-blib">↻ Sync Plex</button>
      </div>`;
  }
  // Other tabs: only search
  else {
    const placeholder = '🔍 Zoeken…';
    const searchId = 'blib-search';

    toolbarContentHtml = `
      <div class="blib-toolbar">
        <input class="blib-search" id="${searchId}" type="text"
          placeholder="${placeholder}" autocomplete="off"
          value="">
        <button class="tool-btn" id="btn-sync-plex-blib">↻ Sync Plex</button>
      </div>`;
  }

  // Set all HTML at once
  toolbar.innerHTML = tabBarHtml + toolbarContentHtml;

  // Bind tab bar click handlers
  document.querySelectorAll('#blib-tab-bar .blib-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const newTab = btn.dataset.tab;
      blibSwitchTab(newTab);
    });
  });

  blibBindToolbar();
}

function blibBindToolbar() {
  const getContent = () => blibContentEl();

  // Albums tab search
  document.getElementById('blib-search')?.addEventListener('input', e => {
    blibSearchTerm = e.target.value;
    if (blibArtistFilter) {
      blibArtistFilter = null;
      blibCurrentView  = 'grid';
    }
    const content = getContent();
    if (content) {
      const wrap = document.getElementById('blib-grid-wrap');
      if (wrap) blibRender(wrap);
    }
  });

  // Artists tab search
  document.getElementById('blib-artist-search')?.addEventListener('input', e => {
    blibArtistSearchTerm = e.target.value;
    const wrap = document.getElementById('blib-artists-grid');
    if (wrap) blibRenderArtistsGrid(blibArtistsData || [], wrap);
  });

  // Tracks tab search
  document.getElementById('blib-track-search')?.addEventListener('input', e => {
    blibTrackSearchTerm = e.target.value;
    const wrap = document.getElementById('blib-tracks-list');
    if (wrap) blibRenderTracksList(blibTracksData || [], wrap);
  });

  // Grid/list mode (only for albums)
  document.getElementById('blib-btn-grid')?.addEventListener('click', () => {
    if (blibViewMode === 'grid') return;
    blibViewMode = 'grid';
    document.getElementById('blib-btn-grid')?.classList.add('active');
    document.getElementById('blib-btn-list')?.classList.remove('active');
    const wrap = document.getElementById('blib-grid-wrap');
    if (wrap) blibRender(wrap);
  });

  document.getElementById('blib-btn-list')?.addEventListener('click', () => {
    if (blibViewMode === 'list') return;
    blibViewMode = 'list';
    document.getElementById('blib-btn-list')?.classList.add('active');
    document.getElementById('blib-btn-grid')?.classList.remove('active');
    const wrap = document.getElementById('blib-grid-wrap');
    if (wrap) blibRender(wrap);
  });

  document.getElementById('blib-sort-select')?.addEventListener('change', e => {
    blibSort = e.target.value;
    const wrap = document.getElementById('blib-grid-wrap');
    if (wrap) blibRender(wrap);
  });

  document.getElementById('btn-sync-plex-blib')?.addEventListener('click', async () => {
    const btn = document.getElementById('btn-sync-plex-blib');
    if (!btn) return;
    const orig = btn.textContent;
    btn.disabled = true; btn.textContent = '↻ Bezig…';
    try {
      try { await p('/api/plex/refresh', { method: 'POST' }); } catch (e) { if (e.name !== 'AbortError') throw e; }
      await loadPlexStatus();
      blibData = null;
      blibArtistsData = null;
      blibTracksData = null;
      blibGenresData = null;
      blibPlaylistsData = null;
      // Reload current tab
      await blibSwitchTab(blibCurrentTab);
    } catch {}
    finally { btn.disabled = false; btn.textContent = orig; }
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// Hoofd album grid
// ═══════════════════════════════════════════════════════════════════════════

async function blibShowGrid(container) {
  if (!container) return;
  blibCurrentView  = 'grid';
  blibDetailItem   = null;
  blibPlaylistKey  = null;
  container.scrollTop = 0;
  container.innerHTML = `<div id="blib-grid-wrap"></div>`;
  const wrap = document.getElementById('blib-grid-wrap');
  await blibRender(wrap);
}

// ═══════════════════════════════════════════════════════════════════════════
// Album detail view (inline, niet als overlay)
// ═══════════════════════════════════════════════════════════════════════════

async function blibShowDetail(item) {
  blibCurrentView = 'detail';
  blibDetailItem  = item;

  const container = blibContentEl();
  if (!container) return;
  if (blibScroller) { blibScroller.destroy(); blibScroller = null; }
  container.scrollTop = 0;

  const src = item.thumb ? proxyImg(item.thumb, 320) : null;
  const coverHtml = src
    ? `<img src="${esc(src)}" alt="${esc(item.album)} by ${esc(item.artist)}" loading="lazy"
           onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
       <div class="blib-detail-cover-ph" style="display:none;background:${gradientFor(item.album)}">${initials(item.album)}</div>`
    : `<div class="blib-detail-cover-ph" style="background:${gradientFor(item.album)}">${initials(item.album)}</div>`;

  const zone = getSelectedZone();

  // Terug-knop: naar artiest-filter als we daarvandaan kwamen, anders naar grid
  const backToArtist = blibArtistFilter
    ? `<button class="blib-back-btn blib-back-artist" id="blib-back-to-artist">
         ← ${esc(blibArtistFilter)}
       </button>`
    : '';

  container.innerHTML = `
    <div class="blib-detail-view">
      <div class="blib-detail-topbar">
        <button class="blib-back-btn" id="blib-back-to-grid">← Alle albums</button>
        ${backToArtist}
      </div>

      <div class="blib-detail-hero">
        <div class="blib-detail-cover">${coverHtml}</div>
        <div class="blib-detail-info">
          <div class="blib-detail-label">Album</div>
          <h1 class="blib-detail-title">${esc(item.album)}</h1>
          <div class="blib-detail-artist-wrap">
            <button class="blib-artist-filter-btn blib-detail-artist-btn"
                    data-artist-filter="${esc(item.artist)}">${esc(item.artist)}</button>
          </div>
          <div class="blib-detail-actions">
            <button class="blib-action-btn blib-action-primary" id="blib-play-all">
              ▶ Speel album af
            </button>
            ${zone
              ? `<button class="blib-action-btn" id="blib-play-plex" title="Speel op Plex: ${esc(zone)}">
                   🔊 Speel op Plex
                 </button>`
              : ''}
          </div>
        </div>
      </div>

      <div class="blib-tracklist" id="blib-tracklist">
        <div class="loading"><div class="spinner"></div>Tracks laden…</div>
      </div>
    </div>`;

  // ── Back-knoppen ─────────────────────────────────────────────────────────
  document.getElementById('blib-back-to-grid')?.addEventListener('click', () => {
    blibArtistFilter = null;
    blibRenderToolbar();
    blibShowGrid(blibContentEl());
  });

  document.getElementById('blib-back-to-artist')?.addEventListener('click', () => {
    const artist = blibArtistFilter; // bewaar
    blibRenderToolbar();
    blibShowArtistFilter(artist);
  });

  // ── Afspelen knoppen ──────────────────────────────────────────────────────
  document.getElementById('blib-play-all')?.addEventListener('click', () => {
    if (item.ratingKey) playOnZone(item.ratingKey, 'music');
  });

  document.getElementById('blib-play-plex')?.addEventListener('click', async () => {
    if (!item.ratingKey) return;
    try {
      await p('/api/plex/play', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ratingKey: item.ratingKey })
      });
    } catch (e) {
      if (e.name !== 'AbortError') showError('Afspelen mislukt: ' + e.message);
    }
  });

  // ── Tracklist laden ───────────────────────────────────────────────────────
  if (!item.ratingKey) {
    const tl = document.getElementById('blib-tracklist');
    if (tl) tl.innerHTML = '<div class="blib-empty"><p>Geen ratingKey beschikbaar.</p></div>';
    return;
  }

  try {
    const data = await apiFetch(`/api/plex/album/${encodeURIComponent(item.ratingKey)}/tracks`);
    const tl   = document.getElementById('blib-tracklist');
    if (!tl) return;

    const tracks = data.tracks || [];
    if (!tracks.length) {
      tl.innerHTML = '<div class="blib-empty"><p>Geen tracks gevonden.</p></div>';
      return;
    }

    tl.innerHTML = `
      <div class="blib-track-header">
        <span class="blib-track-col-num">#</span>
        <span class="blib-track-col-title">Titel</span>
        <span class="blib-track-col-dur">Duur</span>
      </div>` +
      tracks.map((t, i) => {
        const dur = t.duration ? Math.floor(t.duration / 1000) : 0;
        const min = Math.floor(dur / 60);
        const sec = String(dur % 60).padStart(2, '0');
        return `<div class="blib-track-row"
            data-track-key="${esc(t.ratingKey || '')}"
            data-track-title="${esc(t.title || '')}">
          <div class="blib-track-num">
            <span class="blib-track-num-text">${i + 1}</span>
            <button class="blib-track-play-btn" aria-label="Speel ${esc(t.title || '')} af">▶</button>
          </div>
          <div class="blib-track-title">${esc(t.title || 'Onbekend')}</div>
          <div class="blib-track-duration">${dur ? `${min}:${sec}` : ''}</div>
        </div>`;
      }).join('');

    tl.addEventListener('click', e => {
      const trackPlayBtn = e.target.closest('.blib-track-play-btn');
      const row = (trackPlayBtn ? trackPlayBtn.closest('.blib-track-row') : null)
               || e.target.closest('.blib-track-row');
      if (row?.dataset.trackKey) {
        playOnZone(row.dataset.trackKey, 'music');
      }
    });
  } catch (e) {
    const tl = document.getElementById('blib-tracklist');
    if (tl) tl.innerHTML = '<div class="blib-empty"><p>Tracks laden mislukt.</p></div>';
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Artiest filter view
// ═══════════════════════════════════════════════════════════════════════════

async function blibShowArtistFilter(artist) {
  blibCurrentView  = 'artist';
  blibArtistFilter = artist;

  const container = blibContentEl();
  if (!container) return;
  if (blibScroller) { blibScroller.destroy(); blibScroller = null; }
  container.scrollTop = 0;

  // Update zoekbalk (wis de term)
  blibSearchTerm = '';
  const searchInput = document.getElementById('blib-search');
  if (searchInput) searchInput.value = '';

  container.innerHTML = `
    <div class="blib-artist-view">
      <div class="blib-artist-header">
        <button class="blib-back-btn" id="blib-artist-back">← Alle albums</button>
        <h2 class="blib-artist-title">Alle albums van ${esc(artist)}</h2>
      </div>
      <div id="blib-grid-wrap"></div>
    </div>`;

  document.getElementById('blib-artist-back')?.addEventListener('click', () => {
    blibArtistFilter = null;
    blibCurrentView  = 'grid';
    blibRenderToolbar();
    blibShowGrid(blibContentEl());
  });

  const wrap = document.getElementById('blib-grid-wrap');
  if (wrap) await blibRender(wrap);
}

// ═══════════════════════════════════════════════════════════════════════════
// Plex playlists in sidebar
// ═══════════════════════════════════════════════════════════════════════════

export async function loadSidebarPlaylists() {
  const sidebarEl = document.getElementById('sidebar-playlists');
  if (!sidebarEl) return;

  sidebarEl.innerHTML = `<div class="blib-sidebar-loading"><div class="spinner-sm"></div></div>`;

  try {
    const data      = await apiFetch('/api/plex/playlists');
    const playlists = data.playlists || data || [];

    if (!playlists.length) {
      sidebarEl.innerHTML = `<div class="sidebar-empty">Geen afspeellijsten</div>`;
      return;
    }

    sidebarEl.innerHTML = playlists.map(pl => {
      const key   = esc(pl.ratingKey || pl.key || '');
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

    // Klik op playlist → navigeer naar tracklist
    sidebarEl.addEventListener('click', e => {
      const btn = e.target.closest('.sidebar-playlist-item');
      if (!btn) return;
      // Highlight
      sidebarEl.querySelectorAll('.sidebar-playlist-item').forEach(b =>
        b.classList.toggle('active', b === btn));
      openSidebarPlaylist(btn.dataset.playlistKey, btn.dataset.playlistTitle);
    });

  } catch (e) {
    if (e.name !== 'AbortError') {
      sidebarEl.innerHTML = `<div class="sidebar-empty">Laden mislukt</div>`;
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Playlist tracklist view
// ═══════════════════════════════════════════════════════════════════════════

export async function openSidebarPlaylist(key, title) {
  blibCurrentView = 'playlist';
  blibPlaylistKey = key;

  const container = blibContentEl();
  if (!container) return;
  if (blibScroller) { blibScroller.destroy(); blibScroller = null; }
  container.scrollTop = 0;

  container.innerHTML = `
    <div class="blib-detail-view">
      <div class="blib-detail-topbar">
        <button class="blib-back-btn" id="blib-playlist-back">← Bibliotheek</button>
      </div>
      <div class="blib-playlist-header">
        <div class="blib-playlist-cover">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="1.5" aria-hidden="true">
            <line x1="8" y1="6" x2="21" y2="6"/>
            <line x1="8" y1="12" x2="21" y2="12"/>
            <line x1="8" y1="18" x2="21" y2="18"/>
            <line x1="3" y1="6" x2="3.01" y2="6"/>
            <line x1="3" y1="12" x2="3.01" y2="12"/>
            <line x1="3" y1="18" x2="3.01" y2="18"/>
          </svg>
        </div>
        <div class="blib-detail-info">
          <div class="blib-detail-label">Afspeellijst</div>
          <h1 class="blib-detail-title">${esc(title)}</h1>
          <div class="blib-detail-actions">
            <button class="blib-action-btn blib-action-primary" id="blib-playlist-play-all">
              ▶ Speel alles af
            </button>
          </div>
        </div>
      </div>
      <div class="blib-tracklist" id="blib-playlist-tracks">
        <div class="loading"><div class="spinner"></div>Laden…</div>
      </div>
    </div>`;

  document.getElementById('blib-playlist-back')?.addEventListener('click', () => {
    // Deactiveer playlist items
    document.querySelectorAll('.sidebar-playlist-item').forEach(b => b.classList.remove('active'));
    blibCurrentView = 'grid';
    blibPlaylistKey = null;
    blibShowGrid(blibContentEl());
  });

  try {
    const data   = await apiFetch(`/api/plex/playlists/${encodeURIComponent(key)}/tracks`);
    const tl     = document.getElementById('blib-playlist-tracks');
    if (!tl) return;
    const tracks = data.tracks || [];

    if (!tracks.length) {
      tl.innerHTML = '<div class="blib-empty"><p>Geen nummers in deze afspeellijst.</p></div>';
      return;
    }

    // Play-all knop
    document.getElementById('blib-playlist-play-all')?.addEventListener('click', () => {
      if (tracks[0]?.ratingKey) playOnZone(tracks[0].ratingKey, 'music');
    });

    tl.innerHTML = `
      <div class="blib-track-header">
        <span class="blib-track-col-num">#</span>
        <span class="blib-track-col-title">Titel</span>
        <span class="blib-track-col-dur">Duur</span>
      </div>` +
      tracks.map((t, i) => {
        const dur = t.duration ? Math.floor(t.duration / 1000) : 0;
        const min = Math.floor(dur / 60);
        const sec = String(dur % 60).padStart(2, '0');
        return `<div class="blib-track-row"
            data-track-key="${esc(t.ratingKey || '')}"
            data-track-title="${esc(t.title || '')}">
          <div class="blib-track-num">
            <span class="blib-track-num-text">${i + 1}</span>
            <button class="blib-track-play-btn" aria-label="Speel ${esc(t.title || '')} af">▶</button>
          </div>
          <div class="blib-track-title">
            <div>${esc(t.title || 'Onbekend')}</div>
            ${t.artist ? `<div class="blib-track-artist">${esc(t.artist)}</div>` : ''}
          </div>
          <div class="blib-track-duration">${dur ? `${min}:${sec}` : ''}</div>
        </div>`;
      }).join('');

    tl.addEventListener('click', e => {
      const trackPlayBtn = e.target.closest('.blib-track-play-btn');
      const row = (trackPlayBtn ? trackPlayBtn.closest('.blib-track-row') : null)
               || e.target.closest('.blib-track-row');
      if (row?.dataset.trackKey) {
        playOnZone(row.dataset.trackKey, 'music');
      }
    });
  } catch (e) {
    const tl = document.getElementById('blib-playlist-tracks');
    if (tl) tl.innerHTML = '<div class="blib-empty"><p>Laden mislukt.</p></div>';
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Artists Tab
// ═══════════════════════════════════════════════════════════════════════════

async function blibLoadArtists() {
  if (blibArtistsData) return blibArtistsData;
  try {
    const res = await apiFetch('/api/plex/artists');
    if (!res) {
      console.warn('Artists response is null/undefined');
      return [];
    }
    blibArtistsData = Array.isArray(res.artists) ? res.artists : [];
    return blibArtistsData;
  } catch (e) {
    if (e.name !== 'AbortError') showError('Artiesten laden mislukt: ' + e.message);
    return [];
  }
}

function blibFilterArtists(artists) {
  const q = blibArtistSearchTerm.toLowerCase().trim();
  if (!q) return artists;
  return artists.filter(a => (a.title || '').toLowerCase().includes(q));
}

function blibRenderArtistsGrid(artists, container) {
  const filtered = blibFilterArtists(artists);
  if (!filtered.length) {
    container.innerHTML = `<div class="blib-empty">
      <div class="blib-empty-icon">🎤</div>
      <h3>Geen artiesten gevonden</h3>
      <p>${blibArtistSearchTerm ? 'Geen resultaten voor je zoekopdracht' : 'Geen artiesten in bibliotheek'}</p>
    </div>`;
    return;
  }

  container.innerHTML = `<div class="blib-artists-container">
    ${filtered.map(a => {
      const src = a.thumb ? proxyImg(a.thumb, 200) : null;
      const img = src
        ? `<img src="${esc(src)}" alt="${esc(a.title)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
        : '';
      const ph = `<div class="blib-artist-ph" style="display:${src ? 'none' : 'flex'};background:${gradientFor(a.title)}">${initials(a.title)}</div>`;
      return `<div class="blib-artist-card" data-artist-name="${esc(a.title)}">
        <div class="blib-artist-photo">
          ${img}
          ${ph}
        </div>
        <div class="blib-artist-name">${esc(a.title)}</div>
      </div>`;
    }).join('')}
  </div>`;

  // Event delegation
  container.addEventListener('click', e => {
    const card = e.target.closest('.blib-artist-card');
    if (card) {
      const artistName = card.dataset.artistName;
      if (artistName) blibShowArtistFilter(artistName);
    }
  });
}

async function blibShowArtistsTab(container) {
  if (blibScroller) { blibScroller.destroy(); blibScroller = null; }

  blibRenderToolbar();

  container.innerHTML = `<div class="loading"><div class="spinner"></div>Artiesten laden…</div>`;
  const artists = await blibLoadArtists();
  blibArtistsData = artists;

  container.innerHTML = `<div id="blib-artists-grid" class="blib-grid-wrap"></div>`;
  const wrap = document.getElementById('blib-artists-grid');
  if (wrap) blibRenderArtistsGrid(artists, wrap);
}

// ═══════════════════════════════════════════════════════════════════════════
// Tracks Tab
// ═══════════════════════════════════════════════════════════════════════════

async function blibLoadTracks() {
  if (blibTracksData) return blibTracksData;
  try {
    const res = await apiFetch('/api/plex/tracks?limit=100');
    if (!res) {
      console.warn('Tracks response is null/undefined');
      return [];
    }
    blibTracksData = Array.isArray(res.tracks) ? res.tracks : [];
    return blibTracksData;
  } catch (e) {
    if (e.name !== 'AbortError') showError('Nummers laden mislukt: ' + e.message);
    return [];
  }
}

function blibFilterTracks(tracks) {
  const q = blibTrackSearchTerm.toLowerCase().trim();
  if (!q) return tracks;
  return tracks.filter(t =>
    (t.title || '').toLowerCase().includes(q) ||
    (t.artist || '').toLowerCase().includes(q) ||
    (t.album || '').toLowerCase().includes(q)
  );
}

function blibRenderTracksList(tracks, container) {
  const filtered = blibFilterTracks(tracks);
  if (!filtered.length) {
    container.innerHTML = `<div class="blib-empty">
      <div class="blib-empty-icon">🎵</div>
      <h3>Geen nummers gevonden</h3>
      <p>${blibTrackSearchTerm ? 'Geen resultaten voor je zoekopdracht' : 'Geen nummers in bibliotheek'}</p>
    </div>`;
    return;
  }

  container.innerHTML = `<div class="blib-track-header">
    <span class="blib-track-col-num">#</span>
    <span class="blib-track-col-title">Titel</span>
    <span class="blib-track-col-artist">Artiest</span>
    <span class="blib-track-col-album">Album</span>
    <span class="blib-track-col-dur">Duur</span>
  </div>` + filtered.map((t, i) => {
    const dur = t.duration ? Math.floor(t.duration / 1000) : 0;
    const min = Math.floor(dur / 60);
    const sec = String(dur % 60).padStart(2, '0');
    return `<div class="blib-track-row" data-track-key="${esc(t.ratingKey || '')}">
      <div class="blib-track-num">
        <span class="blib-track-num-text">${i + 1}</span>
        <button class="blib-track-play-btn" aria-label="Speel ${esc(t.title || '')} af">▶</button>
      </div>
      <div class="blib-track-title">${esc(t.title || 'Onbekend')}</div>
      <div class="blib-track-artist">${esc(t.artist || '—')}</div>
      <div class="blib-track-album">${esc(t.album || '—')}</div>
      <div class="blib-track-duration">${dur ? `${min}:${sec}` : ''}</div>
    </div>`;
  }).join('');

  container.addEventListener('click', e => {
    const trackPlayBtn = e.target.closest('.blib-track-play-btn');
    const row = (trackPlayBtn ? trackPlayBtn.closest('.blib-track-row') : null)
             || e.target.closest('.blib-track-row');
    if (row?.dataset.trackKey) {
      playOnZone(row.dataset.trackKey, 'music');
    }
  });
}

async function blibShowTracksTab(container) {
  if (blibScroller) { blibScroller.destroy(); blibScroller = null; }

  blibRenderToolbar();

  container.innerHTML = `<div class="loading"><div class="spinner"></div>Nummers laden…</div>`;
  const tracks = await blibLoadTracks();
  blibTracksData = tracks;

  container.innerHTML = `<div id="blib-tracks-list" class="blib-grid-wrap"></div>`;
  const wrap = document.getElementById('blib-tracks-list');
  if (wrap) blibRenderTracksList(tracks, wrap);
}

// ═══════════════════════════════════════════════════════════════════════════
// Genres Tab
// ═══════════════════════════════════════════════════════════════════════════

function hashStringToHSL(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  const hue = Math.abs(hash) % 360;
  const saturation = 65 + (Math.abs(hash) % 20);
  const lightness = 50 + (Math.abs(hash) % 15);
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

async function blibLoadGenres() {
  if (blibGenresData) return blibGenresData;
  try {
    const res = await apiFetch('/api/plex/genres');
    if (!res) {
      console.warn('Genres response is null/undefined');
      return [];
    }
    blibGenresData = Array.isArray(res.genres) ? res.genres : [];
    return blibGenresData;
  } catch (e) {
    if (e.name !== 'AbortError') showError('Genres laden mislukt: ' + e.message);
    return [];
  }
}

async function blibShowGenresTab(container) {
  if (blibScroller) { blibScroller.destroy(); blibScroller = null; }
  blibRenderToolbar();

  container.innerHTML = `<div class="loading"><div class="spinner"></div>Genres laden…</div>`;
  const genres = await blibLoadGenres();
  blibGenresData = genres;

  if (!genres.length) {
    container.innerHTML = `<div class="blib-empty">
      <div class="blib-empty-icon">🎼</div>
      <h3>Geen genres gevonden</h3>
    </div>`;
    return;
  }

  container.innerHTML = `<div class="blib-genres-grid">
    ${genres.map(g => {
      const color = hashStringToHSL(g.genre);
      const count = g.artistCount || 0;
      return `<div class="blib-genre-card" data-genre="${esc(g.genre)}" style="background: ${color}">
        <div class="blib-genre-name">${esc(g.genre)}</div>
        <div class="blib-genre-count">${count} artiest${count !== 1 ? 'en' : ''}</div>
      </div>`;
    }).join('')}
  </div>`;

  container.addEventListener('click', e => {
    const card = e.target.closest('.blib-genre-card');
    if (card) {
      const genre = card.dataset.genre;
      blibShowGenreDetail(genre, genres);
    }
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// Genre Detail View
// ═══════════════════════════════════════════════════════════════════════════

async function blibShowGenreDetail(genre, allGenres) {
  if (blibScroller) { blibScroller.destroy(); blibScroller = null; }

  const container = blibContentEl();
  if (!container) return;

  // Push to navigation stack
  blibNavigationStack.push({ view: 'genres', data: {} });

  container.scrollTop = 0;

  // Vind genre data
  const genreData = allGenres.find(g => g.genre === genre);
  if (!genreData) {
    container.innerHTML = `<div class="blib-empty">
      <div class="blib-empty-icon">🎼</div>
      <h3>Genre niet gevonden</h3>
    </div>`;
    return;
  }

  const artists = genreData.artists || [];

  container.innerHTML = `
    <div class="blib-detail-view">
      <div class="blib-detail-topbar">
        <button class="blib-back-btn" id="blib-genre-back">← Genres</button>
      </div>
      <div class="blib-genre-detail-header">
        <div class="blib-genre-detail-title">${esc(genre)}</div>
        <div class="blib-genre-detail-count">${artists.length} artiest${artists.length !== 1 ? 'en' : ''}</div>
      </div>
      <div class="blib-genre-artists-grid">
        ${artists.map(a => {
          const src = a.thumb ? proxyImg(a.thumb, 200) : null;
          const img = src
            ? `<img src="${esc(src)}" alt="${esc(a.title)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
            : '';
          const ph = `<div class="blib-artist-ph" style="display:${src ? 'none' : 'flex'};background:${gradientFor(a.title)}">${initials(a.title)}</div>`;
          return `<div class="blib-genre-artist-card" data-artist-rating-key="${esc(a.ratingKey)}">
            <div class="blib-artist-photo">
              ${img}
              ${ph}
            </div>
            <div class="blib-artist-name">${esc(a.title)}</div>
          </div>`;
        }).join('')}
      </div>
    </div>`;

  document.getElementById('blib-genre-back')?.addEventListener('click', () => {
    blibNavigationStack.pop();
    blibShowGenresTab(container);
  });

  container.addEventListener('click', e => {
    const card = e.target.closest('.blib-genre-artist-card');
    if (card) {
      const ratingKey = card.dataset.artistRatingKey;
      if (ratingKey) blibShowArtistDetail(ratingKey);
    }
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// Artiest Detail View
// ═══════════════════════════════════════════════════════════════════════════

async function blibShowArtistDetail(ratingKey) {
  if (blibScroller) { blibScroller.destroy(); blibScroller = null; }

  const container = blibContentEl();
  if (!container) return;

  // Push to navigation stack
  blibNavigationStack.push({ view: 'artist-detail', data: { ratingKey } });

  container.scrollTop = 0;
  container.innerHTML = `<div class="blib-detail-view">
    <div class="loading"><div class="spinner"></div>Artiest laden…</div>
  </div>`;

  try {
    const data = await apiFetch(`/api/plex/artists/${encodeURIComponent(ratingKey)}`);
    if (!data.artist) {
      container.innerHTML = `<div class="blib-empty"><p>Artiest niet gevonden.</p></div>`;
      return;
    }

    const artist = data.artist;
    const zone = getSelectedZone();

    // Haal populaire nummers op
    let popularTracks = [];
    try {
      const tracksData = await apiFetch(`/api/plex/tracks?limit=500`);
      if (tracksData.tracks) {
        popularTracks = tracksData.tracks
          .filter(t => t.artist && t.artist.toLowerCase() === artist.title.toLowerCase())
          .slice(0, 10);
      }
    } catch (e) {
      // Ignore track loading errors
    }

    const coverSrc = artist.thumb ? proxyImg(artist.thumb, 320) : null;
    const coverHtml = coverSrc
      ? `<img src="${esc(coverSrc)}" alt="${esc(artist.title)}" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block"
           onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
         <div class="blib-artist-detail-ph" style="background:${gradientFor(artist.title)};display:none;width:200px;height:200px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:48px">${initials(artist.title)}</div>`
      : `<div class="blib-artist-detail-ph" style="background:${gradientFor(artist.title)};width:200px;height:200px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:48px">${initials(artist.title)}</div>`;

    const backView = blibNavigationStack.length > 1 ? blibNavigationStack[blibNavigationStack.length - 2] : null;
    const backLabel = backView?.view === 'genre' ? '← Genres' : '← Artiesten';

    container.innerHTML = `
      <div class="blib-detail-view">
        <div class="blib-detail-topbar">
          <button class="blib-back-btn" id="blib-artist-detail-back">${backLabel}</button>
        </div>

        <div class="blib-artist-detail-hero">
          <div class="blib-artist-detail-photo">${coverHtml}</div>
          <div class="blib-detail-info">
            <div class="blib-detail-label">Artiest</div>
            <h1 class="blib-detail-title">${esc(artist.title)}</h1>
            ${artist.genres.length > 0 ? `<div class="blib-detail-genres">
              ${artist.genres.map(g => `<span class="blib-genre-tag">${esc(g)}</span>`).join('')}
            </div>` : ''}
            <div class="blib-artist-stats">
              <div class="blib-stat-item">
                <span class="blib-stat-label">Albums</span>
                <span class="blib-stat-value">${fmt(artist.albums.length)}</span>
              </div>
              <div class="blib-stat-item">
                <span class="blib-stat-label">Nummers</span>
                <span class="blib-stat-value">${fmt(artist.totalTracks)}</span>
              </div>
            </div>
            <div class="blib-detail-actions">
              <button class="blib-action-btn blib-action-primary" id="blib-artist-play-all">
                ▶ Speel alles af
              </button>
              ${zone ? `<button class="blib-action-btn" id="blib-artist-play-plex" title="Speel op Plex: ${esc(zone)}">
                🔊 Speel op Plex
              </button>` : ''}
              <button class="blib-action-btn" id="blib-artist-shuffle">
                🔀 Shuffle
              </button>
            </div>
          </div>
        </div>

        <div class="blib-artist-sections">
          ${artist.albums.length > 0 ? `
            <div class="blib-section">
              <h2 class="blib-section-title">Albums (${fmt(artist.albums.length)})</h2>
              <div class="blib-albums-grid">
                ${artist.albums.map(a => {
                  const src = a.thumb ? proxyImg(a.thumb, 200) : null;
                  const img = src
                    ? `<img src="${esc(src)}" alt="${esc(a.title)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
                    : '';
                  const ph = `<div class="blib-cover-ph" style="display:${src ? 'none' : 'flex'};background:${gradientFor(a.title)}">${initials(a.title)}</div>`;
                  return `<div class="blib-album-detail-card" data-album-rating-key="${esc(a.ratingKey)}">
                    <div class="blib-album-detail-cover">
                      ${img}
                      ${ph}
                    </div>
                    <div class="blib-album-detail-info">
                      <div class="blib-album-detail-title" title="${esc(a.title)}">${esc(a.title)}</div>
                      ${a.year ? `<div class="blib-album-detail-year">${a.year}</div>` : ''}
                      <div class="blib-album-detail-count">${a.trackCount} nummer${a.trackCount !== 1 ? 's' : ''}</div>
                    </div>
                  </div>`;
                }).join('')}
              </div>
            </div>
          ` : ''}

          ${popularTracks.length > 0 ? `
            <div class="blib-section">
              <h2 class="blib-section-title">Populaire nummers</h2>
              <div class="blib-track-header">
                <span class="blib-track-col-num">#</span>
                <span class="blib-track-col-title">Titel</span>
                <span class="blib-track-col-album">Album</span>
                <span class="blib-track-col-dur">Duur</span>
              </div>
              ${popularTracks.map((t, i) => {
                const dur = t.duration ? Math.floor(t.duration / 1000) : 0;
                const min = Math.floor(dur / 60);
                const sec = String(dur % 60).padStart(2, '0');
                return `<div class="blib-track-row" data-track-key="${esc(t.ratingKey || '')}">
                  <div class="blib-track-num">
                    <span class="blib-track-num-text">${i + 1}</span>
                    <button class="blib-track-play-btn" aria-label="Speel ${esc(t.title || '')} af">▶</button>
                  </div>
                  <div class="blib-track-title">${esc(t.title || 'Onbekend')}</div>
                  <div class="blib-track-album">${esc(t.album || '—')}</div>
                  <div class="blib-track-duration">${dur ? min + ':' + sec : ''}</div>
                </div>`;
              }).join('')}
            </div>
          ` : ''}
        </div>
      </div>`;

    // Back button
    document.getElementById('blib-artist-detail-back')?.addEventListener('click', () => {
      blibNavigationStack.pop();
      const prevState = blibNavigationStack[blibNavigationStack.length - 1];
      if (prevState?.view === 'genre') {
        blibShowGenreDetail(prevState.data.genre, blibGenresData);
      } else {
        blibShowArtistsTab(container);
      }
    });

    // Play all
    document.getElementById('blib-artist-play-all')?.addEventListener('click', () => {
      if (artist.albums[0]?.ratingKey) {
        playOnZone(artist.albums[0].ratingKey, 'music');
      }
    });

    // Play on Plex
    document.getElementById('blib-artist-play-plex')?.addEventListener('click', async () => {
      if (artist.albums[0]?.ratingKey) {
        try {
          await p('/api/plex/play', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ratingKey: artist.albums[0].ratingKey })
          });
        } catch (e) {
          if (e.name !== 'AbortError') showError('Afspelen mislukt: ' + e.message);
        }
      }
    });

    // Shuffle
    document.getElementById('blib-artist-shuffle')?.addEventListener('click', () => {
      if (artist.albums.length > 0) {
        const randomAlbum = artist.albums[Math.floor(Math.random() * artist.albums.length)];
        playOnZone(randomAlbum.ratingKey, 'music');
      }
    });

    // Album card clicks
    container.addEventListener('click', e => {
      const albumCard = e.target.closest('.blib-album-detail-card');
      if (albumCard) {
        const ratingKey = albumCard.dataset.albumRatingKey;
        if (ratingKey) {
          blibShowDetail({ ratingKey, album: '', artist: artist.title, thumb: '' });
        }
      }

      const trackPlayBtn = e.target.closest('.blib-track-play-btn');
      if (trackPlayBtn) {
        e.stopPropagation();
        const row = trackPlayBtn.closest('.blib-track-row');
        if (row?.dataset.trackKey) {
          playOnZone(row.dataset.trackKey, 'music');
        }
      }

      const trackRow = e.target.closest('.blib-track-row');
      if (trackRow?.dataset.trackKey && !e.target.closest('.blib-track-play-btn')) {
        playOnZone(trackRow.dataset.trackKey, 'music');
      }
    });

  } catch (e) {
    if (e.name !== 'AbortError') {
      container.innerHTML = `<div class="blib-empty"><p>Laden mislukt: ${esc(e.message)}</p></div>`;
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Playlists Tab
// ═══════════════════════════════════════════════════════════════════════════

async function blibLoadPlaylistsTab() {
  if (blibPlaylistsData) return blibPlaylistsData;
  try {
    const res = await apiFetch('/api/plex/playlists');
    blibPlaylistsData = res.playlists || [];
    return blibPlaylistsData;
  } catch (e) {
    if (e.name !== 'AbortError') showError('Playlists laden mislukt: ' + e.message);
    return [];
  }
}

async function blibShowPlaylistsTab(container) {
  if (blibScroller) { blibScroller.destroy(); blibScroller = null; }
  blibRenderToolbar();

  container.innerHTML = `<div class="loading"><div class="spinner"></div>Playlists laden…</div>`;
  const playlists = await blibLoadPlaylistsTab();
  blibPlaylistsData = playlists;

  if (!playlists.length) {
    container.innerHTML = `<div class="blib-empty">
      <div class="blib-empty-icon">🎙️</div>
      <h3>Geen playlists gevonden</h3>
    </div>`;
    return;
  }

  container.innerHTML = `<div class="blib-playlists-grid">
    ${playlists.map(pl => {
      const cover = pl.thumb ? proxyImg(pl.thumb, 200) : null;
      const count = pl.leafCount || pl.trackCount || 0;
      const coverHtml = cover
        ? `<img src="${esc(cover)}" alt="${esc(pl.title || 'Playlist')}" loading="lazy">`
        : `<div class="blib-playlist-ph" style="background:${gradientFor(pl.title || 'Playlist')}">🎙️</div>`;
      return `<div class="blib-playlist-card" data-playlist-key="${esc(pl.ratingKey || pl.key || '')}">
        <div class="blib-playlist-cover">${coverHtml}</div>
        <div class="blib-playlist-info">
          <div class="blib-playlist-title">${esc(pl.title || 'Playlist')}</div>
          <div class="blib-playlist-count">${count} numm${count !== 1 ? 'ers' : 'er'}</div>
        </div>
      </div>`;
    }).join('')}
  </div>`;

  container.addEventListener('click', e => {
    const card = e.target.closest('.blib-playlist-card');
    if (card) {
      const key = card.dataset.playlistKey;
      const title = card.querySelector('.blib-playlist-title')?.textContent || 'Playlist';
      if (key) openSidebarPlaylist(key, title);
    }
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// PUBLIEKE EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

/** Compat-stub: zoeken verloopt intern via blibSearchTerm */
export function buildPlexLibraryHtml(library, query) {
  return '';
}

/** Globale klik-delegation vanuit events.js */
export function handlePlexLibraryClick(e) {
  // ▶ knop op albumkaart
  const playBtn = e.target.closest('.blib-play-btn');
  if (playBtn) {
    e.stopPropagation();
    const card = playBtn.closest('.blib-album');
    if (card?.dataset.ratingKey) {
      playOnZone(card.dataset.ratingKey, 'music');
    }
    return true;
  }

  // Track play-knop in detail/playlist view
  const trackPlayBtn = e.target.closest('.blib-track-play-btn');
  if (trackPlayBtn) {
    e.stopPropagation();
    const row = trackPlayBtn.closest('.blib-track-row');
    if (row?.dataset.trackKey) {
      playOnZone(row.dataset.trackKey, 'music');
    }
    return true;
  }

  // Artiest-filter knop (niet de detail-header artist)
  const artistBtn = e.target.closest('.blib-artist-filter-btn');
  if (artistBtn) {
    e.stopPropagation();
    const artist = artistBtn.dataset.artistFilter;
    if (artist) {
      // In de detail view: ga naar artiest-filter
      blibShowArtistFilter(artist);
    }
    return true;
  }

  // Klik op albumkaart → detail
  const card = e.target.closest('.blib-album');
  if (card?.dataset.ratingKey) {
    blibShowDetail({
      ratingKey: card.dataset.ratingKey,
      album:     card.dataset.album,
      artist:    card.dataset.artist,
      thumb:     card.dataset.thumb,
    });
    return true;
  }

  // Terug-knoppen (intern)
  if (e.target.closest('#blib-back-to-grid') ||
      e.target.closest('#blib-artist-back') ||
      e.target.closest('#blib-playlist-back') ||
      e.target.closest('#blib-back-to-artist')) {
    // Wordt afgehandeld door interne addEventListener
    return true;
  }

  return false;
}

/** Laad (of herlaad) de Plex bibliotheek data */
export async function loadPlexLibrary() {
  try {
    await blibLoad();
    if (blibCurrentView === 'grid') {
      const wrap = document.getElementById('blib-grid-wrap');
      if (wrap) blibRender(wrap);
    }
  } catch (e) {
    if (e.name !== 'AbortError') showError(e.message);
  }
}

/** Hoofd-entry: laad de Bibliotheek view */
export async function loadBibliotheek() {
  hideTidarrUI();
  stopTidarrQueuePolling();

  // Reset view state
  blibCurrentView  = 'grid';
  blibArtistFilter = null;
  blibDetailItem   = null;
  blibPlaylistKey  = null;

  // Render tab bar (creates element if needed)
  blibRenderTabBar();

  // Render toolbar in #view-toolbar
  blibRenderToolbar();

  // Laad playlists in sidebar
  loadSidebarPlaylists().catch(() => {});

  // Toon laad-staat in content
  const container = blibContentEl();
  if (!container) return;
  container.scrollTop = 0;
  container.innerHTML = `<div class="loading" role="status">
    <div class="spinner" aria-hidden="true"></div>Bibliotheek laden…
  </div>`;

  try {
    // Load based on current tab
    if (blibCurrentTab === 'albums') {
      await blibLoad();
      await blibShowGrid(container);
    } else {
      await blibSwitchTab(blibCurrentTab);
    }
  } catch (e) {
    if (e.name !== 'AbortError') showError(e.message);
  }
}

/** Sub-tab wissel (compat met events.js: 'collectie' → album grid, 'lijst' → wishlist) */
export async function switchBibSubTab(subTab) {
  state.bibSubTab = subTab;

  if (subTab === 'collectie') {
    await loadBibliotheek();
  } else if (subTab === 'lijst') {
    const container = blibContentEl();
    if (container) {
      state.sectionContainerEl = container;
      try {
        await loadWishlist();
      } finally {
        if (state.sectionContainerEl === container) state.sectionContainerEl = null;
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Top artiesten
// ═══════════════════════════════════════════════════════════════════════════

export async function loadTopArtists(period) {
  showLoading();
  const signal = state.tabAbort?.signal;
  try {
    const cacheKey = `topartists:${period}`;
    let d = getCached(cacheKey, 5 * 60 * 1000);
    if (!d) {
      d = await apiFetch(`/api/topartists?period=${period}`, { signal });
      if (signal?.aborted) return;
      setCache(cacheKey, d);
    }
    const artists = d.topartists?.artist || [];
    if (!artists.length) { setContent('<div class="empty">Geen data.</div>'); return; }
    const max = parseInt(artists[0]?.playcount || 1);
    let html = `<div class="section-title">Top artiesten · ${periodLabel(period)}</div><div class="artist-grid">`;
    for (let i = 0; i < artists.length; i++) {
      const a = artists[i];
      const pct = Math.round(parseInt(a.playcount) / max * 100);
      const lfmImg   = getImg(a.image, 'large') || getImg(a.image);
      const agImgSrc = proxyImg(lfmImg, 120) || lfmImg;
      const photoHtml = agImgSrc
        ? `<img src="${agImgSrc}" alt="${esc(a.name)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
           <div class="ag-photo-ph" style="display:none;background:${gradientFor(a.name, true)}">${initials(a.name)}</div>`
        : `<div class="ag-photo-ph" style="background:${gradientFor(a.name, true)}">${initials(a.name)}</div>`;
      html += `<div class="ag-card">
        <div class="ag-photo" id="agp-${i}" style="view-transition-name: artist-${sanitizeArtistName(a.name)}">${photoHtml}</div>
        <div class="ag-info">
          <div class="ag-name artist-link" data-artist="${esc(a.name)}">${esc(a.name)}</div>
          <div class="card-bar"><div class="card-bar-fill" style="width:${pct}%"></div></div>
          <div class="ag-plays">${fmt(a.playcount)} plays</div>
        </div></div>`;
    }
    setContent(html + '</div>');

    // Parallel fetch artist images met Promise.allSettled() (progressive rendering)
    const artistImageRequests = artists.map((a, i) =>
      apiFetch(`/api/artist/${encodeURIComponent(a.name)}/info`)
        .then(info => {
          if (info.image) {
            const el = document.getElementById(`agp-${i}`);
            if (el) el.innerHTML = `<img src="${proxyImg(info.image, 120) || info.image}" alt="${esc(a.name)}" loading="lazy" onerror="this.style.display='none'">`;
          }
          return true;
        })
        .catch(() => true)
    );
    Promise.allSettled(artistImageRequests);  // Fire & forget
  } catch (e) { if (e.name === 'AbortError') return; showError(e.message); }
}

// ═══════════════════════════════════════════════════════════════════════════
// Top nummers
// ═══════════════════════════════════════════════════════════════════════════

export async function loadTopTracks(period) {
  showLoading();
  const signal = state.tabAbort?.signal;
  try {
    const cacheKey = `toptracks:${period}`;
    let d = getCached(cacheKey, 5 * 60 * 1000);
    if (!d) {
      d = await apiFetch(`/api/toptracks?period=${period}`, { signal });
      if (signal?.aborted) return;
      setCache(cacheKey, d);
    }
    const tracks = d.toptracks?.track || [];
    if (!tracks.length) { setContent('<div class="empty">Geen data.</div>'); return; }
    const max = parseInt(tracks[0]?.playcount || 1);
    let html = `<div class="section-title">Top nummers · ${periodLabel(period)}</div><div class="card-list">`;
    for (const t of tracks) {
      const pct = Math.round(parseInt(t.playcount) / max * 100);
      html += `<div class="card">${trackImg(t.image)}<div class="card-info">
        <div class="card-title">${esc(t.name)}</div>
        <div class="card-sub artist-link" data-artist="${esc(t.artist?.name || '')}">${esc(t.artist?.name || '')}</div>
        <div class="card-bar"><div class="card-bar-fill" style="width:${pct}%"></div></div>
        </div><div class="card-meta">${fmt(t.playcount)}×</div>
        <button class="play-btn" data-artist="${esc(t.artist?.name || '')}" data-track="${esc(t.name)}" title="Preview afspelen">▶</button>
        <div class="play-bar"><div class="play-bar-fill"></div></div></div>`;
    }
    setContent(html + '</div>');
  } catch (e) { if (e.name === 'AbortError') return; showError(e.message); }
}

// ═══════════════════════════════════════════════════════════════════════════
// Geliefde nummers
// ═══════════════════════════════════════════════════════════════════════════

export async function loadLoved() {
  showLoading();
  const signal = state.tabAbort?.signal;
  try {
    let d = getCached('loved', 10 * 60 * 1000);
    if (!d) {
      d = await apiFetch('/api/loved', { signal });
      if (signal?.aborted) return;
      setCache('loved', d);
    }
    const tracks = d.lovedtracks?.track || [];
    if (!tracks.length) { setContent('<div class="empty">Geen geliefde nummers.</div>'); return; }
    let html = '<div class="section-title">Geliefde nummers</div><div class="card-list">';
    for (const t of tracks) {
      const when = t.date?.uts ? timeAgo(parseInt(t.date.uts)) : '';
      html += `<div class="card">${trackImg(t.image)}<div class="card-info">
        <div class="card-title">${esc(t.name)}</div>
        <div class="card-sub artist-link" data-artist="${esc(t.artist?.name || '')}">${esc(t.artist?.name || '')}</div>
        </div><div class="card-meta" style="color:var(--red)">♥ ${when}</div>
        <button class="play-btn" data-artist="${esc(t.artist?.name || '')}" data-track="${esc(t.name)}" title="Preview afspelen">▶</button>
        <div class="play-bar"><div class="play-bar-fill"></div></div></div>`;
    }
    setContent(html + '</div>');
  } catch (e) { if (e.name === 'AbortError') return; showError(e.message); }
}

// ═══════════════════════════════════════════════════════════════════════════
// Statistieken
// ═══════════════════════════════════════════════════════════════════════════

export async function loadStats() {
  showLoading('Statistieken ophalen...');
  const signal = state.tabAbort?.signal;
  try {
    let d = getCached('stats', 10 * 60 * 1000);
    if (!d) {
      d = await apiFetch('/api/stats', { signal });
      if (signal?.aborted) return;
      setCache('stats', d);
    }
    const chartHtml = `
      <div class="stats-grid">
        <div class="stats-card full">
          <div class="stats-card-title">Scrobbles afgelopen 7 dagen</div>
          <div class="chart-wrap"><canvas id="chart-daily"></canvas></div>
        </div>
        <div class="stats-card">
          <div class="stats-card-title">Top artiesten deze maand</div>
          <div class="chart-wrap" style="max-height:320px"><canvas id="chart-top"></canvas></div>
        </div>
        <div class="stats-card">
          <div class="stats-card-title">Genre verdeling</div>
          <div class="chart-wrap"><canvas id="chart-genres"></canvas></div>
        </div>
      </div>`;
    setContent(chartHtml, () => renderStatsCharts(d));
  } catch (e) { if (e.name === 'AbortError') return; showError(e.message); }
}

export function renderStatsCharts(d) {
  if (typeof Chart === 'undefined') return;
  const isDark     = !window.matchMedia('(prefers-color-scheme: light)').matches;
  const gridColor  = isDark ? '#2c2c2c' : '#ddd';
  const tickColor  = isDark ? '#888'    : '#777';
  const labelColor = isDark ? '#efefef' : '#111';
  Chart.defaults.color       = tickColor;
  Chart.defaults.borderColor = gridColor;

  const dc = document.getElementById('chart-daily');
  if (dc) {
    new Chart(dc, {
      type: 'bar',
      data: {
        labels: d.dailyScrobbles.map(x => {
          const dt = new Date(x.date + 'T12:00:00');
          return dt.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric' });
        }),
        datasets: [{ data: d.dailyScrobbles.map(x => x.count), backgroundColor: 'rgba(213,16,7,0.75)', borderRadius: 4 }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => `${ctx.raw} scrobbles` } } },
        scales: {
          x: { grid: { display: false }, ticks: { color: tickColor } },
          y: { grid: { color: gridColor }, ticks: { color: tickColor }, beginAtZero: true }
        }
      }
    });
  }

  const tc = document.getElementById('chart-top');
  if (tc && d.topArtists?.length) {
    new Chart(tc, {
      type: 'bar',
      data: {
        labels: d.topArtists.map(a => a.name),
        datasets: [{ data: d.topArtists.map(a => a.playcount), backgroundColor: 'rgba(229,160,13,0.75)', borderRadius: 4 }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => `${ctx.raw} plays` } } },
        scales: {
          x: { grid: { color: gridColor }, ticks: { color: tickColor }, beginAtZero: true },
          y: { grid: { display: false }, ticks: { color: labelColor, font: { size: 11 } } }
        }
      }
    });
  }

  const gc = document.getElementById('chart-genres');
  if (gc && d.genres?.length) {
    const colors = ['#d51007','#e5a00d','#6c5ce7','#00b894','#fd79a8','#0984e3','#e17055','#a29bfe'];
    new Chart(gc, {
      type: 'doughnut',
      data: {
        labels: d.genres.map(g => g.name),
        datasets: [{ data: d.genres.map(g => g.count), backgroundColor: colors.slice(0, d.genres.length), borderWidth: 0 }]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'right', labels: { color: tickColor, boxWidth: 12, padding: 10, font: { size: 11 } } } }
      }
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Collectie-gaten
// ═══════════════════════════════════════════════════════════════════════════

export async function loadGaps() {
  showLoading('Collectiegaten zoeken...');
  const signal = state.tabAbort?.signal;
  try {
    const d = await apiFetch('/api/gaps', { signal });
    if (signal?.aborted) return;
    if (d.status === 'building' && (!d.artists || !d.artists.length)) {
      setContent(`<div class="loading"><div class="spinner"></div>
        <div>${esc(d.message)}</div>
        <div class="build-hint">Pagina ververst automatisch over 20 seconden</div></div>`);
      setTimeout(() => { if (state.activeView === 'gaps') loadGaps(); }, 20_000);
      return;
    }
    state.lastGaps = d;
    renderGaps();
    if (d.builtAt && (Date.now() - d.builtAt > 86_400_000)) {
      const banner = document.createElement('div');
      banner.className = 'refresh-banner';
      banner.textContent = '↻ Gaps worden op de achtergrond ververst...';
      const content = state.sectionContainerEl || document.getElementById('content');
      if (content) content.prepend(banner);
      fetch('/api/gaps/refresh', { method: 'POST' }).catch(() => {});
    }
  } catch (e) { if (e.name === 'AbortError') return; showError(e.message); }
}

export function renderGaps() {
  if (!state.lastGaps) return;
  let artists = [...(state.lastGaps.artists || [])];
  if (!artists.length) {
    setContent('<div class="empty">Geen collectiegaten gevonden — je hebt alles al! 🎉</div>');
    const badgeEl = document.getElementById('badge-gaps');
    if (badgeEl) badgeEl.textContent = '0';
    return;
  }
  if (state.gapsSort === 'missing') artists.sort((a, b) => b.missingAlbums.length - a.missingAlbums.length);
  if (state.gapsSort === 'name')    artists.sort((a, b) => a.name.localeCompare(b.name));

  const totalMissing = artists.reduce((s, a) => s + a.missingAlbums.length, 0);
  const badgeEl = document.getElementById('badge-gaps');
  if (badgeEl) badgeEl.textContent = totalMissing;

  let html = `<div class="section-title">${totalMissing} ontbrekende albums bij ${artists.length} artiesten die je al hebt</div>`;
  for (const a of artists) {
    const pct  = Math.round(a.ownedCount / a.totalCount * 100);
    const meta = [countryFlag(a.country), a.country, a.startYear].filter(Boolean).join(' · ');
    const gapsImgSrc = proxyImg(a.image, 56) || a.image;
    const photo = gapsImgSrc
      ? `<img class="gaps-photo" src="${esc(gapsImgSrc)}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
         <div class="gaps-photo-ph" style="display:none;background:${gradientFor(a.name)}">${initials(a.name)}</div>`
      : `<div class="gaps-photo-ph" style="background:${gradientFor(a.name)}">${initials(a.name)}</div>`;
    html += `
      <div class="gaps-block">
        <div class="gaps-header">
          ${photo}
          <div style="flex:1;min-width:0">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:2px">
              <div class="gaps-artist-name artist-link" data-artist="${esc(a.name)}">${esc(a.name)}</div>
              ${bookmarkBtn('artist', a.name, '', a.image || '')}
            </div>
            <div class="gaps-artist-meta">${esc(meta)}</div>
            ${tagsHtml(a.tags, 3)}
            <div style="height:8px"></div>
            <div class="comp-bar"><div class="comp-fill" style="width:${pct}%"></div></div>
            <div class="comp-text">${a.ownedCount} van ${a.totalCount} albums in Plex
              &nbsp;·&nbsp; <span style="color:var(--new);font-weight:600">${a.missingAlbums.length} ontbreken</span></div>
          </div>
        </div>
        <div class="gaps-sub">Ontbrekende albums</div>
        <div class="gaps-album-grid">`;
    for (const alb of a.missingAlbums) html += albumCard(alb, false, a.name);
    html += `</div>`;
    if (a.allAlbums?.filter(x => x.inPlex).length > 0) {
      html += `<details style="margin-top:12px">
        <summary style="font-size:11px;color:var(--muted2);cursor:pointer;user-select:none">
          ▸ ${a.ownedCount} albums die je al hebt
        </summary>
        <div class="gaps-album-grid" style="margin-top:10px">
          ${a.allAlbums.filter(x => x.inPlex).map(alb => albumCard(alb, false, a.name)).join('')}
        </div>
      </details>`;
    }
    html += `</div>`;
  }
  setContent(html);
}

// ═══════════════════════════════════════════════════════════════════════════
// Recent Tracks Tab
// ═══════════════════════════════════════════════════════════════════════════

async function blibShowRecentTab(container) {
  try {
    showLoading(container);

    // Clear toolbar for recent tab
    const toolbar = document.getElementById('view-toolbar');
    if (toolbar) {
      toolbar.innerHTML = `<div class="blib-tab-bar" id="blib-tab-bar">
        ${'Albums,Artiesten,Nummers,Genres,Playlists,Recent'.split(',').map((name, i) => {
          const keys = ['albums', 'artists', 'tracks', 'genres', 'playlists', 'recent'];
          const key = keys[i];
          const active = blibCurrentTab === key ? ' active' : '';
          return `<button class="blib-tab-btn${active}" data-tab="${key}">${name.trim()}</button>`;
        }).join('')}
      </div>`;

      toolbar.addEventListener('click', e => {
        const btn = e.target.closest('.blib-tab-btn');
        if (btn) blibSwitchTab(btn.dataset.tab);
      });
    }

    // Render recent tracks
    container.innerHTML = '';
    await renderRecentTracks(container);

  } catch (e) {
    console.error('Fout bij laden recent tracks:', e);
    showError('Fout bij laden van recente nummers', container);
  }
}
