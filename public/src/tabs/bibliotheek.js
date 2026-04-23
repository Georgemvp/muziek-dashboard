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

// ═══════════════════════════════════════════════════════════════════════════
// Module-level state
// ═══════════════════════════════════════════════════════════════════════════
let blibData         = null;     // raw library data (array of {artist,album,ratingKey,thumb})
let blibArtists      = null;     // artiesten data (array of {ratingKey,title,thumb,albumCount,genre})
let blibTracks       = null;     // nummers data (array of {ratingKey,title,artist,album,duration,trackNumber,thumb})
let blibGenres       = null;     // genres data (array of {genre,artistCount,artists[]})
let blibTab          = 'albums'; // 'albums' | 'artists' | 'tracks'
let blibSort         = 'artist'; // sort value per tab
let blibSearchTerm   = '';
let blibViewMode     = 'grid';   // 'grid' | 'list'
let blibArtistFilter = null;     // artist name string or null
let blibGenreFilter  = null;     // genre string or null
let blibInPlexFilter = null;     // null | 'in' | 'not-in' (for gaps/discover)
let blibCurrentView  = 'grid';   // 'grid' | 'detail' | 'artist' | 'playlist'
let blibDetailItem   = null;
let blibScroller     = null;
let blibPlaylistKey  = null;

// ── Statistics cache ──────────────────────────────────────────────────────
let blibStats = { artists: 0, albums: 0, tracks: 0, genres: 0 };

// ── Sort options per tab ──────────────────────────────────────────────────
const BLIB_SORT_OPTIONS = {
  albums: [
    { value: 'artist-az', label: 'Artiest A–Z' },
    { value: 'artist-za', label: 'Artiest Z–A' },
    { value: 'album-az', label: 'Album A–Z' },
    { value: 'album-za', label: 'Album Z–A' },
    { value: 'recent', label: 'Recent toegevoegd' },
    { value: 'year-new', label: 'Jaar (nieuwste eerst)' },
    { value: 'year-old', label: 'Jaar (oudste eerst)' }
  ],
  artists: [
    { value: 'name-az', label: 'Naam A–Z' },
    { value: 'name-za', label: 'Naam Z–A' },
    { value: 'albums', label: 'Aantal albums (meeste eerst)' }
  ],
  tracks: [
    { value: 'title-az', label: 'Titel A–Z' },
    { value: 'artist-az', label: 'Artiest A–Z' },
    { value: 'album-az', label: 'Album A–Z' },
    { value: 'duration-short', label: 'Duur (kortste eerst)' },
    { value: 'duration-long', label: 'Duur (langste eerst)' }
  ]
};

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
  if (blibData && blibArtists && blibTracks && blibGenres) {
    blibUpdateStats();
    return blibData;
  }

  try {
    // Load all data in parallel
    const [albumRes, artistRes, trackRes, genreRes] = await Promise.all([
      apiFetch('/api/plex/library/all'),
      apiFetch('/api/plex/artists'),
      apiFetch('/api/plex/tracks?limit=1000'),
      apiFetch('/api/plex/genres')
    ]);

    // Albums
    if (albumRes.ok && albumRes.library?.length) {
      blibData = albumRes.library.map(([artist, album, ratingKey, thumb]) => ({
        artist, album, ratingKey, thumb
      }));
    } else {
      blibData = [];
    }

    // Artists
    if (artistRes.ok && artistRes.artists?.length) {
      blibArtists = artistRes.artists;
    } else {
      blibArtists = [];
    }

    // Tracks
    if (trackRes.ok && trackRes.tracks?.length) {
      blibTracks = trackRes.tracks;
    } else {
      blibTracks = [];
    }

    // Genres
    if (genreRes.ok && genreRes.genres?.length) {
      blibGenres = genreRes.genres;
    } else {
      blibGenres = [];
    }

    blibUpdateStats();
    return blibData;
  } catch (e) {
    if (e.name !== 'AbortError') showError('Fout bij laden bibliotheek: ' + e.message);
    blibData = [];
    blibArtists = [];
    blibTracks = [];
    blibGenres = [];
    return [];
  }
}

// ── Update statistics ──────────────────────────────────────────────────────
function blibUpdateStats() {
  blibStats = {
    artists: blibArtists?.length || 0,
    albums: blibData?.length || 0,
    tracks: blibTracks?.length || 0,
    genres: blibGenres?.length || 0
  };
}

// ── Filter + sort ────────────────────────────────────────────────────────

function blibApplyFilters() {
  let data = [];

  // Get data based on active tab
  if (blibTab === 'albums') {
    data = blibData || [];

    // Album-specific filters
    if (blibArtistFilter) {
      data = data.filter(x => x.artist === blibArtistFilter);
    }
    if (blibGenreFilter) {
      // Filter albums by genre (check if artiest has genre)
      const genreArtists = new Set();
      const genre = blibGenres?.find(g => g.genre === blibGenreFilter);
      if (genre) genre.artists.forEach(a => genreArtists.add(a.title));
      data = data.filter(x => genreArtists.has(x.artist));
    }

    // Album sorting
    data = [...data].sort((a, b) => {
      switch (blibSort) {
        case 'artist-az':
          return a.artist.localeCompare(b.artist, 'nl', { sensitivity: 'base' }) ||
                 a.album.localeCompare(b.album, 'nl', { sensitivity: 'base' });
        case 'artist-za':
          return b.artist.localeCompare(a.artist, 'nl', { sensitivity: 'base' }) ||
                 b.album.localeCompare(a.album, 'nl', { sensitivity: 'base' });
        case 'album-az':
          return a.album.localeCompare(b.album, 'nl', { sensitivity: 'base' });
        case 'album-za':
          return b.album.localeCompare(a.album, 'nl', { sensitivity: 'base' });
        case 'recent':
          return 0; // reverse order applied in data
        case 'year-new':
          // Assuming new albums come first in Plex (reverse order)
          return 0;
        case 'year-old':
          return 0;
        default:
          return a.artist.localeCompare(b.artist, 'nl', { sensitivity: 'base' });
      }
    });
  } else if (blibTab === 'artists') {
    data = blibArtists || [];

    // Artists sorting
    data = [...data].sort((a, b) => {
      switch (blibSort) {
        case 'name-az':
          return a.title.localeCompare(b.title, 'nl', { sensitivity: 'base' });
        case 'name-za':
          return b.title.localeCompare(a.title, 'nl', { sensitivity: 'base' });
        case 'albums':
          return b.albumCount - a.albumCount;
        default:
          return a.title.localeCompare(b.title, 'nl', { sensitivity: 'base' });
      }
    });
  } else if (blibTab === 'tracks') {
    data = blibTracks || [];

    // Tracks sorting
    data = [...data].sort((a, b) => {
      switch (blibSort) {
        case 'title-az':
          return a.title.localeCompare(b.title, 'nl', { sensitivity: 'base' });
        case 'artist-az':
          return a.artist.localeCompare(b.artist, 'nl', { sensitivity: 'base' }) ||
                 a.title.localeCompare(b.title, 'nl', { sensitivity: 'base' });
        case 'album-az':
          return a.album.localeCompare(b.album, 'nl', { sensitivity: 'base' }) ||
                 a.title.localeCompare(b.title, 'nl', { sensitivity: 'base' });
        case 'duration-short':
          return (a.duration || 0) - (b.duration || 0);
        case 'duration-long':
          return (b.duration || 0) - (a.duration || 0);
        default:
          return a.title.localeCompare(b.title, 'nl', { sensitivity: 'base' });
      }
    });
  }

  // Apply search term
  const q = blibSearchTerm.toLowerCase().trim();
  if (q) {
    if (blibTab === 'albums') {
      data = data.filter(x =>
        x.artist.toLowerCase().includes(q) || x.album.toLowerCase().includes(q)
      );
    } else if (blibTab === 'artists') {
      data = data.filter(x => x.title.toLowerCase().includes(q));
    } else if (blibTab === 'tracks') {
      data = data.filter(x =>
        x.title.toLowerCase().includes(q) ||
        x.artist.toLowerCase().includes(q) ||
        x.album.toLowerCase().includes(q)
      );
    }
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
  if (!el) return;

  const labels = {
    albums: 'albums',
    artists: 'artiesten',
    tracks: 'nummers'
  };
  const label = labels[blibTab] || 'items';
  el.textContent = `${fmt(n)} ${label}`;
}

// ── Grid/list renderen ─────────────────────────────────────────────────────

async function blibRender(container) {
  if (blibScroller) { blibScroller.destroy(); blibScroller = null; }

  const data = blibApplyFilters();
  blibUpdateCount(data.length);

  // Get empty state messages based on tab
  const emptyMessages = {
    albums: 'Geen albums gevonden',
    artists: 'Geen artiesten gevonden',
    tracks: 'Geen nummers gevonden'
  };
  const emptyTitle = emptyMessages[blibTab] || 'Geen items gevonden';

  if (!data.length) {
    container.innerHTML = `
      <div class="blib-empty">
        <div class="blib-empty-icon">🎵</div>
        <h3>${emptyTitle}</h3>
        <p>${blibSearchTerm
          ? `Geen resultaten voor "<strong>${esc(blibSearchTerm)}</strong>"`
          : 'Bibliotheek is leeg of nog niet gesynchroniseerd.'}</p>
      </div>`;
    return;
  }

  // For artists and tracks, don't use virtual scroller (simpler list layout)
  if (blibTab === 'artists') {
    blibRenderArtistsList(container, data);
    return;
  } else if (blibTab === 'tracks') {
    blibRenderTracksList(container, data);
    return;
  }

  // Albums use virtual scroller for performance
  blibScroller = new BlibVirtualScroller(container, data);

  if ((blibSort === 'artist-az' || blibSort === 'artist-za') && !blibSearchTerm && !blibArtistFilter && blibViewMode === 'grid') {
    blibRenderAZRail(blibScroller);
  } else {
    const rail = document.getElementById('blib-az-rail');
    if (rail) rail.innerHTML = '';
  }
}

// ── Render artists list ────────────────────────────────────────────────────
function blibRenderArtistsList(container, data) {
  let html = '<div class="blib-artists-list" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px;padding:20px">';
  for (const artist of data) {
    const src = artist.thumb ? proxyImg(artist.thumb, 120) : null;
    const img = src
      ? `<img src="${esc(src)}" alt="${esc(artist.title)}" loading="lazy" style="width:100%;height:100%;object-fit:cover"
             onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
      : '';
    const ph = `<div style="display:${src ? 'none' : 'flex'};background:${gradientFor(artist.title)};width:100%;height:100%;align-items:center;justify-content:center;font-weight:bold;color:rgba(255,255,255,0.2);font-size:32px">${initials(artist.title)}</div>`;

    const genres = artist.genre ? artist.genre.split(', ').slice(0, 2) : [];
    const genresHtml = genres.length ? `<div style="font-size:11px;color:var(--text-muted);margin-top:6px">${genres.join(', ')}</div>` : '';

    html += `
      <div style="display:flex;flex-direction:column;gap:8px;cursor:pointer" class="blib-artist-card-grid">
        <div style="width:100%;padding-bottom:100%;position:relative;background:var(--bg-tertiary);border-radius:6px;overflow:hidden">
          ${img}${ph}
        </div>
        <div>
          <div style="font-size:13px;font-weight:500;color:var(--text-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(artist.title)}</div>
          <div style="font-size:11px;color:var(--text-muted)">${artist.albumCount} album${artist.albumCount !== 1 ? 's' : ''}</div>
          ${genresHtml}
        </div>
      </div>`;
  }
  html += '</div>';
  container.innerHTML = html;
}

// ── Render tracks list ────────────────────────────────────────────────────
function blibRenderTracksList(container, data) {
  let html = `<table style="width:100%;border-collapse:collapse">
    <thead>
      <tr style="border-bottom:1px solid var(--border-color)">
        <th style="width:40px;text-align:left;padding:12px;font-size:11px;color:var(--text-muted);font-weight:600;text-transform:uppercase">#</th>
        <th style="text-align:left;padding:12px;font-size:11px;color:var(--text-muted);font-weight:600;text-transform:uppercase">Titel</th>
        <th style="width:180px;text-align:left;padding:12px;font-size:11px;color:var(--text-muted);font-weight:600;text-transform:uppercase">Artiest</th>
        <th style="width:180px;text-align:left;padding:12px;font-size:11px;color:var(--text-muted);font-weight:600;text-transform:uppercase">Album</th>
        <th style="width:60px;text-align:right;padding:12px;font-size:11px;color:var(--text-muted);font-weight:600;text-transform:uppercase">Duur</th>
      </tr>
    </thead>
    <tbody>`;

  for (let i = 0; i < data.length; i++) {
    const t = data[i];
    const dur = t.duration ? Math.floor(t.duration / 1000) : 0;
    const min = Math.floor(dur / 60);
    const sec = String(dur % 60).padStart(2, '0');

    html += `<tr class="blib-track-item" data-rating-key="${esc(t.ratingKey)}" style="border-bottom:1px solid var(--border-color);cursor:pointer;transition:background 0.2s ease;padding:0">
      <td style="padding:12px;text-align:right;font-size:12px;color:var(--text-muted)">${i + 1}</td>
      <td style="padding:12px;font-size:13px;color:var(--text-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(t.title)}</td>
      <td style="padding:12px;font-size:12px;color:var(--text-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(t.artist)}</td>
      <td style="padding:12px;font-size:12px;color:var(--text-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(t.album)}</td>
      <td style="padding:12px;text-align:right;font-size:12px;color:var(--text-muted)">${dur ? `${min}:${sec}` : ''}</td>
    </tr>`;
  }

  html += '</tbody></table>';
  container.innerHTML = html;

  // Add click listener for track playback
  container.addEventListener('click', e => {
    const row = e.target.closest('.blib-track-item');
    if (row?.dataset.ratingKey) {
      playOnZone(row.dataset.ratingKey, 'music');
    }
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// Toolbar (renderen in #view-toolbar)
// ═══════════════════════════════════════════════════════════════════════════

function blibRenderToolbar() {
  const toolbar = document.getElementById('view-toolbar');
  if (!toolbar) return;

  // Get sort options for current tab
  const sortOptions = BLIB_SORT_OPTIONS[blibTab] || BLIB_SORT_OPTIONS.albums;

  // Get genres for filter pills (only in albums tab)
  const genrePills = blibTab === 'albums' && blibGenres ? blibGenres.map(g => g.genre).sort() : [];

  // Get current sort value (use first option as default)
  const currentSort = blibSort || (sortOptions[0]?.value || 'artist-az');

  // Get search placeholder based on tab
  const searchPlaceholders = {
    albums: '🔍 Zoek artiest of album…',
    artists: '🔍 Zoek artiest…',
    tracks: '🔍 Zoek titel, artiest of album…'
  };
  const placeholder = searchPlaceholders[blibTab] || searchPlaceholders.albums;

  // Stats banner
  const statsBanner = `
    <div class="blib-stats-banner">
      <span class="blib-stat">${fmt(blibStats.artists)} artiesten</span>
      <span class="blib-stat-sep">·</span>
      <span class="blib-stat">${fmt(blibStats.albums)} albums</span>
      <span class="blib-stat-sep">·</span>
      <span class="blib-stat">${fmt(blibStats.tracks)} nummers</span>
      <span class="blib-stat-sep">·</span>
      <span class="blib-stat">${blibStats.genres} genres</span>
    </div>`;

  // Tabs HTML
  const tabsHtml = `
    <div class="blib-tabs">
      <button class="blib-tab${blibTab === 'albums' ? ' active' : ''}" id="blib-tab-albums" data-tab="albums">
        Albums
      </button>
      <button class="blib-tab${blibTab === 'artists' ? ' active' : ''}" id="blib-tab-artists" data-tab="artists">
        Artiesten
      </button>
      <button class="blib-tab${blibTab === 'tracks' ? ' active' : ''}" id="blib-tab-tracks" data-tab="tracks">
        Nummers
      </button>
    </div>`;

  // Genre filter pills (only for albums tab)
  const genreFiltersHtml = blibTab === 'albums' && genrePills.length ? `
    <div class="blib-genre-filters">
      <button class="blib-genre-pill${!blibGenreFilter ? ' active' : ''}" id="blib-genre-all">
        Alle genres
      </button>
      ${genrePills.map(g => `
        <button class="blib-genre-pill${blibGenreFilter === g ? ' active' : ''}" id="blib-genre-${esc(g)}" data-genre="${esc(g)}">
          ${esc(g)}
        </button>
      `).join('')}
    </div>` : '';

  toolbar.innerHTML = `
    ${tabsHtml}
    ${statsBanner}
    ${genreFiltersHtml}
    <div class="blib-toolbar">
      <input class="blib-search" id="blib-search" type="text"
        placeholder="${placeholder}" autocomplete="off"
        value="${esc(blibSearchTerm)}">

      <div class="blib-toolbar-sep"></div>

      ${blibTab === 'albums' ? `
        <div class="blib-view-toggle" role="group" aria-label="Weergavemodus">
          <button class="blib-pill${blibViewMode === 'grid' ? ' active' : ''}" id="blib-btn-grid"
                  title="Grid weergave" aria-pressed="${blibViewMode === 'grid'}">⊞</button>
          <button class="blib-pill${blibViewMode === 'list' ? ' active' : ''}" id="blib-btn-list"
                  title="Lijst weergave" aria-pressed="${blibViewMode === 'list'}">☰</button>
        </div>
      ` : ''}

      <select class="blib-sort-select" id="blib-sort-select" aria-label="Sortering">
        ${sortOptions.map(opt => `<option value="${opt.value}"${currentSort === opt.value ? ' selected' : ''}>${opt.label}</option>`).join('')}
      </select>

      <span class="blib-count" id="blib-count"></span>

      <button class="tool-btn" id="btn-sync-plex-blib">↻ Sync Plex</button>
    </div>
    <div class="blib-az-rail" id="blib-az-rail"></div>`;

  blibBindToolbar();
}

function blibBindToolbar() {
  const getContent = () => blibContentEl();

  // ── Tab switching ──────────────────────────────────────────────────────────
  document.querySelectorAll('.blib-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      const newTab = btn.dataset.tab;
      if (newTab === blibTab) return;

      // Switch tab
      blibTab = newTab;
      blibSearchTerm = '';
      blibArtistFilter = null;
      blibGenreFilter = null;
      blibCurrentView = 'grid';

      // Restore sort from localStorage or use default
      const savedSort = localStorage.getItem(`blib-sort-${blibTab}`);
      if (savedSort) {
        blibSort = savedSort;
      } else {
        const sortOptions = BLIB_SORT_OPTIONS[blibTab] || BLIB_SORT_OPTIONS.albums;
        blibSort = sortOptions[0]?.value || 'artist-az';
      }

      // Re-render toolbar and content
      blibRenderToolbar();
      const wrap = document.getElementById('blib-grid-wrap');
      if (wrap) blibRender(wrap);
    });
  });

  // ── Genre filter pills ─────────────────────────────────────────────────────
  document.getElementById('blib-genre-all')?.addEventListener('click', () => {
    blibGenreFilter = null;
    blibSearchTerm = '';
    const wrap = document.getElementById('blib-grid-wrap');
    if (wrap) blibRender(wrap);
  });

  document.querySelectorAll('.blib-genre-pill[data-genre]').forEach(pill => {
    pill.addEventListener('click', () => {
      const genre = pill.dataset.genre;
      blibGenreFilter = blibGenreFilter === genre ? null : genre;
      blibSearchTerm = '';
      const wrap = document.getElementById('blib-grid-wrap');
      if (wrap) blibRender(wrap);
    });
  });

  // ── Search ────────────────────────────────────────────────────────────────
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

  // ── Grid/List toggle (albums only) ─────────────────────────────────────────
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

  // ── Sort select ────────────────────────────────────────────────────────────
  document.getElementById('blib-sort-select')?.addEventListener('change', e => {
    blibSort = e.target.value;
    // Save to localStorage per tab
    localStorage.setItem(`blib-sort-${blibTab}`, blibSort);
    const wrap = document.getElementById('blib-grid-wrap');
    if (wrap) blibRender(wrap);
  });

  // ── Sync Plex ──────────────────────────────────────────────────────────────
  document.getElementById('btn-sync-plex-blib')?.addEventListener('click', async () => {
    const btn = document.getElementById('btn-sync-plex-blib');
    if (!btn) return;
    const orig = btn.textContent;
    btn.disabled = true; btn.textContent = '↻ Bezig…';
    try {
      try { await p('/api/plex/refresh', { method: 'POST' }); } catch (e) { if (e.name !== 'AbortError') throw e; }
      await loadPlexStatus();
      blibData = null;
      blibArtists = null;
      blibTracks = null;
      blibGenres = null;
      await blibLoad();
      const wrap = document.getElementById('blib-grid-wrap');
      if (wrap) blibRender(wrap);
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
  blibTab          = 'albums';
  blibCurrentView  = 'grid';
  blibArtistFilter = null;
  blibGenreFilter  = null;
  blibDetailItem   = null;
  blibPlaylistKey  = null;
  blibSearchTerm   = '';
  blibViewMode     = 'grid';

  // Load sort from localStorage or use defaults
  const sortOptions = BLIB_SORT_OPTIONS[blibTab];
  const savedSort = localStorage.getItem(`blib-sort-${blibTab}`);
  blibSort = savedSort || (sortOptions[0]?.value || 'artist-az');

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
    await blibLoad();
    await blibShowGrid(container);
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
