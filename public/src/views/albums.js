// ── Albums view — Roon-achtige album grid met virtual scroller ──────────

import { state } from '../state.js';
import { apiFetch } from '../api.js';
import { esc, fmt, initials, gradientFor, proxyImg } from '../helpers.js';
import { playOnZone, getSelectedZone } from '../components/plexRemote.js';

// ═══════════════════════════════════════════════════════════════════════════
// Module-level state
// ═══════════════════════════════════════════════════════════════════════════

let albumsData = null;        // raw library data
let albumsScroller = null;    // virtual scroller instance

// Row dimensions for virtual scroller
const ALBUMS_GRID_ROW_H = 210;
const ALBUMS_BUFFER = 3;

// ── Helpers ────────────────────────────────────────────────────────────────

function getContent() {
  return document.getElementById('content');
}

function getCols() {
  const w = window.innerWidth;
  if (w >= 1600) return 8;
  if (w >= 1300) return 7;
  if (w >= 1050) return 6;
  if (w >= 850) return 5;
  if (w >= 650) return 4;
  if (w >= 480) return 3;
  return 2;
}

// ── Data loading ───────────────────────────────────────────────────────────

async function loadData() {
  if (albumsData) return albumsData;
  try {
    const res = await apiFetch('/api/plex/library/all');
    if (!res || !res.library) {
      console.warn('Albums API response is null/undefined:', res);
      return [];
    }
    if (!Array.isArray(res.library)) {
      console.warn('Library is not an array:', res.library);
      return [];
    }
    if (!res.library.length) return [];

    albumsData = res.library.map(([artist, album, ratingKey, thumb, addedAt]) => ({
      artist: artist || '',
      album: album || '',
      ratingKey: ratingKey || '',
      thumb: thumb || '',
      addedAt: addedAt || 0
    }));
    return albumsData;
  } catch (e) {
    console.error('Error loading albums:', e);
    return [];
  }
}

// ── Group by first letter ──────────────────────────────────────────────────

function groupByLetter(data) {
  const groups = new Map();
  for (const item of data) {
    const first = (item.artist[0] || '#').toUpperCase();
    const letter = /[A-Z]/.test(first) ? first : '#';
    if (!groups.has(letter)) groups.set(letter, []);
    groups.get(letter).push(item);
  }
  return groups;
}

// ── Album card HTML ───────────────────────────────────────────────────────

function albumCard(item) {
  const src = item.thumb ? proxyImg(item.thumb, 240) : null;
  const img = src
    ? `<img src="${esc(src)}" alt="${esc(item.album)} by ${esc(item.artist)}" loading="lazy" decoding="async"
         onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
       <div class="albums-cover-ph" style="display:none;background:${gradientFor(item.album)}">${initials(item.album)}</div>`
    : `<div class="albums-cover-ph" style="background:${gradientFor(item.album)}">${initials(item.album)}</div>`;

  return `<div class="albums-album"
    data-rating-key="${esc(item.ratingKey)}"
    data-album="${esc(item.album)}"
    data-artist="${esc(item.artist)}"
    data-thumb="${esc(item.thumb || '')}">
    <div class="albums-cover">
      ${img}
      <div class="albums-play-overlay"><button class="albums-play-btn" title="Play">▶</button></div>
    </div>
    <div class="albums-album-title" title="${esc(item.album)}">${esc(item.album)}</div>
    <button class="albums-artist-btn" title="${esc(item.artist)}">${esc(item.artist)}</button>
  </div>`;
}

// ═══════════════════════════════════════════════════════════════════════════
// Virtual Scroller
// ═══════════════════════════════════════════════════════════════════════════

class AlbumsVirtualScroller {
  constructor(container, items) {
    this.container = container;
    this.items = items;
    this.cols = getCols();
    this.rowH = ALBUMS_GRID_ROW_H;
    this.lastStart = -1;
    this.lastEnd = -1;

    this.groups = groupByLetter(items);
    this.flatRows = this._buildFlatRows();
    this._createDOM();

    // Scroll listener
    this._scrollEl = getContent() || window;
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
      `<div class="albums-virtual-container" style="height:${this.totalHeight}px;position:relative">
         <div class="albums-virtual-window" style="position:absolute;left:0;right:0;top:0"></div>
       </div>`;
    this.winEl = this.container.querySelector('.albums-virtual-window');
  }

  _getScrollTop() {
    return this._scrollEl === window
      ? (window.scrollY || document.documentElement.scrollTop)
      : this._scrollEl.scrollTop;
  }

  _getViewHeight() {
    return this._scrollEl === window ? window.innerHeight : this._scrollEl.clientHeight;
  }

  _onScroll() {
    this.render();
  }

  _onResize() {
    const newCols = getCols();
    if (newCols !== this.cols) {
      this.cols = newCols;
      this.flatRows = this._buildFlatRows();
      const vc = this.container.querySelector('.albums-virtual-container');
      if (vc) vc.style.height = this.totalHeight + 'px';
      this.lastStart = -1;
      this.lastEnd = -1;
    }
    this.render();
  }

  render() {
    const scrollTop = this._getScrollTop();
    const viewH = this._getViewHeight();
    const containerTop = this.container.getBoundingClientRect().top +
      (this._scrollEl === window ? window.scrollY : this._scrollEl.getBoundingClientRect().top + this._scrollEl.scrollTop);
    const relTop = scrollTop - containerTop;
    const buf = ALBUMS_BUFFER * this.rowH;

    let start = 0;
    let end = this.flatRows.length - 1;

    for (let i = 0; i < this.flatRows.length; i++) {
      const r = this.flatRows[i];
      if (r.offset + r.height >= relTop - buf) {
        start = Math.max(0, i - ALBUMS_BUFFER);
        break;
      }
    }
    for (let i = start; i < this.flatRows.length; i++) {
      if (this.flatRows[i].offset > relTop + viewH + buf) {
        end = i;
        break;
      }
    }

    if (start === this.lastStart && end === this.lastEnd) return;
    this.lastStart = start;
    this.lastEnd = end;

    let html = '';
    for (let i = start; i <= end && i < this.flatRows.length; i++) {
      const row = this.flatRows[i];
      if (row.type === 'header') {
        html += `<div class="albums-letter-header" style="height:${row.height}px">${esc(row.letter)}</div>`;
      } else {
        html += `<div class="albums-grid">`;
        for (const item of row.items) {
          html += albumCard(item);
        }
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

// ── A-Z navigation rail ────────────────────────────────────────────────────

function renderAZRail(scroller) {
  const rail = document.getElementById('albums-az-rail');
  if (!rail) return;
  const available = scroller.getAvailableLetters();
  rail.innerHTML = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#'.split('').map(l =>
    `<button class="albums-az-btn${available.has(l) ? '' : ' disabled'}" data-letter="${l}">${l}</button>`
  ).join('');
  rail.addEventListener('click', e => {
    const btn = e.target.closest('.albums-az-btn');
    if (btn && !btn.classList.contains('disabled')) scroller.scrollToLetter(btn.dataset.letter);
  });
}

// ── Count badge ────────────────────────────────────────────────────────────

function updateCount(n) {
  const el = document.getElementById('albums-count');
  if (el) el.textContent = `${fmt(n)} albums`;
}

// ── Main render function ───────────────────────────────────────────────────

async function render(container) {
  if (albumsScroller) {
    albumsScroller.destroy();
    albumsScroller = null;
  }

  const data = albumsData || [];
  updateCount(data.length);

  if (!data.length) {
    container.innerHTML = `
      <div class="albums-empty">
        <div class="albums-empty-icon">🎵</div>
        <h3>No albums found</h3>
        <p>Plex library is empty or not yet synchronized.</p>
      </div>`;
    return;
  }

  albumsScroller = new AlbumsVirtualScroller(container, data);
  renderAZRail(albumsScroller);
}

// ── Setup event handlers ───────────────────────────────────────────────────

function setupEventHandlers() {
  const content = getContent();
  if (!content) return;

  content.addEventListener('click', async (e) => {
    const playBtn = e.target.closest('.albums-play-btn');
    if (playBtn) {
      const card = playBtn.closest('.albums-album');
      if (card) {
        const ratingKey = card.dataset.ratingKey;
        const zone = getSelectedZone();
        if (zone) {
          await playOnZone(zone, 'album', ratingKey);
        }
      }
    }
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// Entry point
// ═══════════════════════════════════════════════════════════════════════════

export async function loadAlbums() {
  const content = getContent();
  if (!content) return;

  document.title = 'Muziek · Albums';

  // Show initial UI with count placeholder
  content.innerHTML = `
    <div class="albums-toolbar">
      <h2 style="margin: 0 0 8px 0;">Albums</h2>
      <div style="color: var(--text-muted); font-size: 14px;" id="albums-count">Loading…</div>
    </div>
    <div style="display: flex; gap: 8px;">
      <div style="flex: 1;" id="albums-container"></div>
      <div id="albums-az-rail" class="albums-az-rail"></div>
    </div>
  `;

  // Load data and render
  const data = await loadData();
  if (data && data.length > 0) {
    const container = document.getElementById('albums-container');
    if (container) {
      await render(container);
    }
  }

  setupEventHandlers();
}
