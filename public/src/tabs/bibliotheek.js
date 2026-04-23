// ── Tab: Bibliotheek ──────────────────────────────────────────────────────
import { state } from '../state.js';
import { apiFetch } from '../api.js';
import { getCached, setCache, invalidate } from '../cache.js';
import {
  esc, fmt, initials, gradientFor, tagsHtml, bookmarkBtn, downloadBtn,
  countryFlag, albumCard, showLoading, setContent, showError,
  setupLazyLoad, runWithSection, contentEl, sanitizeArtistName, periodLabel,
  getImg, trackImg, timeAgo, proxyImg, p, limitConcurrency
} from '../helpers.js';
import { loadWishlist } from '../components/wishlist.js';
import { loadPlexStatus } from '../api.js';
import { playOnZone, pauseZone, skipZone, getSelectedZone } from '../components/plexRemote.js';
import { hideTidarrUI, stopTidarrQueuePolling } from './downloads.js';

// ═══════════════════════════════════════════════════════════════
// Bibliotheek Tab — Apple Music style redesign
// ═══════════════════════════════════════════════════════════════

let blibData     = null;   // ruwe data (cache over navigatie)
let blibFiltered = null;   // na filter/sort
let blibSort     = 'artist';
let blibSearchTerm = '';
let blibPlayerTrack = null;
let blibScroller    = null;

const BLIB_ROW_HEIGHT = 210;  // cover 160px + label ~50px
const BLIB_BUFFER     = 3;    // extra rijen boven/onder viewport

// ── Kolommen o.b.v. breedte ─────────────────────────────────
function blibGetCols() {
  const w = window.innerWidth;
  if (w >= 1400) return 6;
  if (w >= 1000) return 5;
  if (w >= 800)  return 4;
  if (w >= 640)  return 3;
  return 2;
}

// ── Data laden ───────────────────────────────────────────────
async function blibLoad() {
  if (blibData) return blibData;
  const res = await apiFetch('/api/plex/library/all');
  if (!res.ok || !res.library?.length) return [];
  blibData = res.library.map(([artist, album, ratingKey, thumb]) => ({
    artist, album, ratingKey, thumb
  }));
  return blibData;
}

// ── Filter + sort ─────────────────────────────────────────────
function blibApplyFilters() {
  let data = blibData || [];
  const q = blibSearchTerm.toLowerCase().trim();
  if (q) data = data.filter(x =>
    x.artist.toLowerCase().includes(q) || x.album.toLowerCase().includes(q)
  );
  if (blibSort === 'artist') {
    data = [...data].sort((a, b) =>
      a.artist.localeCompare(b.artist, 'nl', { sensitivity: 'base' }) ||
      a.album.localeCompare(b.album,   'nl', { sensitivity: 'base' })
    );
  } else if (blibSort === 'recent') {
    data = [...data].reverse();
  }
  blibFiltered = data;
  return data;
}

// ── Groepeer op eerste letter ─────────────────────────────────
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

// ── Album card HTML ───────────────────────────────────────────
function blibAlbumCard(item) {
  const src = item.thumb ? proxyImg(item.thumb, 240) : null;
  const img = src
    ? `<img src="${esc(src)}" alt="" loading="lazy"
         onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
       <div class="blib-cover-ph" style="display:none;background:${gradientFor(item.album)}">${initials(item.album)}</div>`
    : `<div class="blib-cover-ph" style="background:${gradientFor(item.album)}">${initials(item.album)}</div>`;

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
    <div class="blib-album-artist">${esc(item.artist)}</div>
  </div>`;
}

// ═══════════════════════════════════════════════════════════════
// Virtual Scroller
// ═══════════════════════════════════════════════════════════════
class BlibVirtualScroller {
  constructor(container, items) {
    this.container = container;
    this.items     = items;
    this.cols      = blibGetCols();
    this.lastStart = -1;
    this.lastEnd   = -1;
    this.useGroups = (blibSort === 'artist' && !blibSearchTerm);
    this.groups    = this.useGroups ? blibGroupByLetter(items) : null;
    this.flatRows  = this._buildFlatRows();
    this._createDOM();
    this._onScroll = this._onScroll.bind(this);
    this._onResize = this._onResize.bind(this);
    window.addEventListener('scroll', this._onScroll, { passive: true });
    window.addEventListener('resize', this._onResize);
    this.render();
  }

  _buildFlatRows() {
    const rows = [];
    let offset = 0;
    if (this.groups) {
      for (const [letter, items] of this.groups) {
        rows.push({ type: 'header', letter, height: 62, offset });
        offset += 62;
        for (let i = 0; i < items.length; i += this.cols) {
          rows.push({ type: 'albums', items: items.slice(i, i + this.cols), height: BLIB_ROW_HEIGHT, offset });
          offset += BLIB_ROW_HEIGHT;
        }
      }
    } else {
      for (let i = 0; i < this.items.length; i += this.cols) {
        rows.push({ type: 'albums', items: this.items.slice(i, i + this.cols), height: BLIB_ROW_HEIGHT, offset });
        offset += BLIB_ROW_HEIGHT;
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

  _onScroll() { this.render(); }

  _onResize() {
    const newCols = blibGetCols();
    if (newCols !== this.cols) {
      this.cols     = newCols;
      this.flatRows = this._buildFlatRows();
      const vc = this.container.querySelector('.blib-virtual-container');
      if (vc) vc.style.height = this.totalHeight + 'px';
      this.lastStart = -1;
      this.lastEnd   = -1;
    }
    this.render();
  }

  render() {
    const scrollTop    = window.scrollY || document.documentElement.scrollTop;
    const containerTop = this.container.getBoundingClientRect().top + scrollTop;
    const relTop       = scrollTop - containerTop;
    const viewH        = window.innerHeight;
    const buf          = BLIB_BUFFER * BLIB_ROW_HEIGHT;

    let start = 0, end = this.flatRows.length - 1;

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
        html += `<div class="blib-letter-header" style="height:${row.height}px;box-sizing:border-box">${esc(row.letter)}</div>`;
      } else {
        html += `<div class="blib-grid">`;
        for (const item of row.items) html += blibAlbumCard(item);
        html += `</div>`;
      }
    }

    this.winEl.style.top = (this.flatRows[start]?.offset || 0) + 'px';
    this.winEl.innerHTML = html;
  }

  destroy() {
    window.removeEventListener('scroll', this._onScroll);
    window.removeEventListener('resize', this._onResize);
  }

  scrollToLetter(letter) {
    for (const row of this.flatRows) {
      if (row.type === 'header' && row.letter === letter) {
        const top = this.container.getBoundingClientRect().top + window.scrollY + row.offset - 120;
        window.scrollTo({ top, behavior: 'smooth' });
        return;
      }
    }
  }

  getAvailableLetters() {
    return new Set(this.flatRows.filter(r => r.type === 'header').map(r => r.letter));
  }
}

// ═══════════════════════════════════════════════════════════════
// A-Z Navigatierail
// ═══════════════════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════════════════
// Album detail panel
// ═══════════════════════════════════════════════════════════════
function blibOpenDetail(item) {
  let overlay = document.getElementById('blib-detail-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'blib-detail-overlay';
    overlay.className = 'blib-detail-overlay';
    document.body.appendChild(overlay);
  }

  const src = item.thumb ? proxyImg(item.thumb, 320) : null;
  const coverHtml = src
    ? `<img src="${esc(src)}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
       <div class="blib-detail-cover-ph" style="display:none;background:${gradientFor(item.album)}">${initials(item.album)}</div>`
    : `<div class="blib-detail-cover-ph" style="background:${gradientFor(item.album)}">${initials(item.album)}</div>`;

  overlay.innerHTML = `
    <div class="blib-detail-panel">
      <button class="blib-detail-close" id="blib-detail-close">✕</button>
      <div class="blib-detail-hero">
        <div class="blib-detail-cover">${coverHtml}</div>
        <div class="blib-detail-info">
          <div class="blib-detail-title">${esc(item.album)}</div>
          <div class="blib-detail-artist">${esc(item.artist)}</div>
          <button class="blib-detail-play-all" id="blib-detail-play-all">▶ Alles afspelen</button>
        </div>
      </div>
      <div class="blib-tracklist" id="blib-tracklist">
        <div class="loading"><div class="spinner"></div></div>
      </div>
    </div>`;

  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';

  overlay.querySelector('#blib-detail-close').addEventListener('click', blibCloseDetail);
  overlay.addEventListener('click', e => { if (e.target === overlay) blibCloseDetail(); });

  overlay.querySelector('#blib-detail-play-all').addEventListener('click', () => {
    if (item.ratingKey) {
      playOnZone(item.ratingKey, 'music');
      blibShowPlayer(item);
    }
  });

  // Laad tracklist
  if (item.ratingKey) {
    apiFetch(`/api/plex/album/${encodeURIComponent(item.ratingKey)}/tracks`)
      .then(data => {
        const tl = document.getElementById('blib-tracklist');
        if (!tl) return;
        const tracks = data.tracks || [];
        if (!tracks.length) {
          tl.innerHTML = '<div class="blib-empty"><p>Geen tracks gevonden.</p></div>';
          return;
        }
        tl.innerHTML = tracks.map((t, i) => {
          const dur = t.duration ? Math.floor(t.duration / 1000) : 0;
          const min = Math.floor(dur / 60);
          const sec = String(dur % 60).padStart(2, '0');
          return `<div class="blib-track-row"
              data-track-key="${esc(t.ratingKey || '')}"
              data-track-title="${esc(t.title || '')}">
            <div class="blib-track-num"><span>${i + 1}</span></div>
            <div class="blib-track-title">${esc(t.title || '')}</div>
            ${dur ? `<div class="blib-track-duration">${min}:${sec}</div>` : ''}
          </div>`;
        }).join('');

        tl.addEventListener('click', e => {
          const row = e.target.closest('.blib-track-row');
          if (row?.dataset.trackKey) {
            playOnZone(row.dataset.trackKey, 'music');
            blibShowPlayer(item);
          }
        });
      })
      .catch(() => {
        const tl = document.getElementById('blib-tracklist');
        if (tl) tl.innerHTML = '<div class="blib-empty"><p>Tracks laden mislukt.</p></div>';
      });
  }
}

function blibCloseDetail() {
  const overlay = document.getElementById('blib-detail-overlay');
  if (overlay) overlay.classList.remove('open');
  document.body.style.overflow = '';
}

// ═══════════════════════════════════════════════════════════════
// Sticky player bar
// ═══════════════════════════════════════════════════════════════
function blibEnsurePlayer() {
  if (!document.getElementById('blib-player')) {
    const el = document.createElement('div');
    el.id = 'blib-player';
    el.className = 'blib-player';
    document.body.appendChild(el);
  }
}

function blibShowPlayer(item) {
  blibPlayerTrack = item;
  blibEnsurePlayer();
  const player = document.getElementById('blib-player');

  const src = item.thumb ? proxyImg(item.thumb, 80) : null;
  const coverHtml = src
    ? `<img src="${esc(src)}" alt="" onerror="this.style.display='none'">`
    : `<div style="width:44px;height:44px;border-radius:6px;background:${gradientFor(item.album)};
         display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff">
         ${initials(item.album)}</div>`;

  player.innerHTML = `
    <div class="blib-player-progress"><div class="blib-player-progress-fill" id="blib-progress-fill"></div></div>
    <div class="blib-player-cover">${coverHtml}</div>
    <div class="blib-player-info">
      <div class="blib-player-title">${esc(item.album)}</div>
      <div class="blib-player-artist">${esc(item.artist)}</div>
    </div>
    <div class="blib-player-controls">
      <button class="blib-ctrl-btn" id="blib-prev" title="Vorige">⏮</button>
      <button class="blib-ctrl-btn primary" id="blib-pause" title="Pauze">⏸</button>
      <button class="blib-ctrl-btn" id="blib-next" title="Volgende">⏭</button>
    </div>`;

  player.classList.add('visible');
  player.querySelector('#blib-prev').addEventListener('click',  () => skipZone('prev'));
  player.querySelector('#blib-next').addEventListener('click',  () => skipZone('next'));
  player.querySelector('#blib-pause').addEventListener('click', () => pauseZone());
}

// ── Aantal badge ─────────────────────────────────────────────
function blibUpdateCount(n) {
  const el = document.getElementById('blib-count');
  if (el) el.textContent = `${fmt(n)} albums`;
}

// ── Render + virtual scroller opstarten ──────────────────────
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
          : 'Plex bibliotheek is leeg of nog niet gesynchroniseerd.'}</p>
      </div>`;
    return;
  }

  blibScroller = new BlibVirtualScroller(container, data);

  if (blibSort === 'artist' && !blibSearchTerm) {
    blibRenderAZRail(blibScroller);
  } else {
    const rail = document.getElementById('blib-az-rail');
    if (rail) rail.innerHTML = '';
  }
}

// ── Toolbar HTML ──────────────────────────────────────────────
function blibToolbarHtml() {
  return `
    <div class="blib-toolbar">
      <input class="blib-search" id="blib-search" type="text"
        placeholder="🔍  Zoek artiest of album…" autocomplete="off"
        value="${esc(blibSearchTerm)}">
      <button class="blib-pill${blibSort === 'artist' ? ' active' : ''}" data-sort="artist">Artiest A–Z</button>
      <button class="blib-pill${blibSort === 'recent' ? ' active' : ''}" data-sort="recent">Recent</button>
      <span class="blib-count" id="blib-count"></span>
      <button class="tool-btn" id="btn-sync-plex-blib" style="margin-left:8px">↻ Sync Plex</button>
    </div>
    <div class="blib-az-rail" id="blib-az-rail"></div>`;
}

function blibBindToolbar(bibContent) {
  document.getElementById('blib-search')?.addEventListener('input', e => {
    blibSearchTerm = e.target.value;
    blibRender(bibContent);
  });

  document.querySelectorAll('.blib-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      blibSort = btn.dataset.sort;
      document.querySelectorAll('.blib-pill').forEach(b =>
        b.classList.toggle('active', b.dataset.sort === blibSort));
      blibRender(bibContent);
    });
  });

  document.getElementById('btn-sync-plex-blib')?.addEventListener('click', async () => {
    const btn = document.getElementById('btn-sync-plex-blib');
    const orig = btn.textContent;
    btn.disabled = true; btn.textContent = '↻ Bezig…';
    try {
      try { await p('/api/plex/refresh', { method: 'POST' }); } catch (e) { if (e.name !== 'AbortError') throw e; }
      await loadPlexStatus();
      blibData = null;
      await blibLoad();
      blibRender(bibContent);
    } catch {}
    finally { btn.disabled = false; btn.textContent = orig; }
  });
}

// ═══════════════════════════════════════════════════════════════
// Publieke exports — vervangen de oude Bibliotheek functies
// ═══════════════════════════════════════════════════════════════

/** Compat-stub: wordt aangeroepen vanuit events.js voor het oude plib-search veld.
 *  Dat element bestaat niet meer in de nieuwe UI, maar de import moet kloppen. */
export function buildPlexLibraryHtml(library, query) {
  // Noop — zoeken verloopt nu via blibSearchTerm in de inline toolbar
  return '';
}

/** Klik-delegation vanuit events.js globale click handler. */
export function handlePlexLibraryClick(e) {
  // ▶ knop op albumkaart → direct afspelen
  const playBtn = e.target.closest('.blib-play-btn');
  if (playBtn) {
    e.stopPropagation();
    const card = playBtn.closest('.blib-album');
    if (card?.dataset.ratingKey) {
      playOnZone(card.dataset.ratingKey, 'music');
      blibShowPlayer({
        ratingKey: card.dataset.ratingKey,
        album:     card.dataset.album,
        artist:    card.dataset.artist,
        thumb:     card.dataset.thumb,
      });
    }
    return true;
  }

  // Klik op albumkaart → detail panel
  const card = e.target.closest('.blib-album');
  if (card?.dataset.ratingKey) {
    blibOpenDetail({
      ratingKey: card.dataset.ratingKey,
      album:     card.dataset.album,
      artist:    card.dataset.artist,
      thumb:     card.dataset.thumb,
    });
    return true;
  }

  return false;
}

/** Laad (of herlaad) de Plex bibliotheek data. */
export async function loadPlexLibrary() {
  try {
    await blibLoad();
    // Als de sub-content container beschikbaar is, ook renderen
    const bibContent = document.getElementById('bib-sub-content');
    if (bibContent && state.bibSubTab === 'collectie') blibRender(bibContent);
  } catch (e) {
    if (e.name !== 'AbortError') showError(e.message);
  }
}

/** Wissel tussen de sub-tabs van de Bibliotheek (Collectie / Lijst). */
export async function switchBibSubTab(subTab) {
  state.bibSubTab = subTab;
  const bibContent = document.getElementById('bib-sub-content');
  const bibToolbar = document.getElementById('bib-subtoolbar');
  if (!bibContent) return;

  document.querySelectorAll('.bib-tab').forEach(b =>
    b.classList.toggle('active', b.dataset.bibtab === subTab));

  if (subTab === 'collectie') {
    state.activeSubTab = 'collectie';

    // Render toolbar
    if (bibToolbar) {
      bibToolbar.innerHTML = blibToolbarHtml();
      blibBindToolbar(bibContent);
    }

    // Zorg voor detail-overlay en player in de DOM
    if (!document.getElementById('blib-detail-overlay')) {
      const ov = document.createElement('div');
      ov.id = 'blib-detail-overlay';
      ov.className = 'blib-detail-overlay';
      document.body.appendChild(ov);
    }
    blibEnsurePlayer();

    bibContent.innerHTML = `<div class="loading"><div class="spinner"></div>Bibliotheek laden…</div>`;

    try {
      await blibLoad();
      await blibRender(bibContent);
    } catch (e) {
      if (e.name !== 'AbortError') showError(e.message);
    }

  } else if (subTab === 'lijst') {
    state.activeSubTab = 'lijst';
    if (bibToolbar) bibToolbar.innerHTML = '';

    const myTarget = bibContent;
    state.sectionContainerEl = myTarget;
    try {
      await loadWishlist();
    } finally {
      if (state.sectionContainerEl === myTarget) state.sectionContainerEl = null;
    }
  }
}

/** Hoofd-entry voor de Bibliotheek-tab. */
export async function loadBibliotheek() {
  state.activeSubTab = 'collectie';
  hideTidarrUI();
  stopTidarrQueuePolling();

  contentEl.innerHTML = `
    <div class="bib-layout">
      <div class="bib-strips-wrap">
        <div class="scroll-strip">
          <div class="strip-label">Top artiesten <span class="strip-period">(${periodLabel(state.currentPeriod)})</span></div>
          <div class="strip-body" id="strip-artists-body">
            <div class="loading"><div class="spinner"></div></div>
          </div>
        </div>
        <div class="scroll-strip" style="margin-top:16px">
          <div class="strip-label">Top nummers <span class="strip-period">(${periodLabel(state.currentPeriod)})</span></div>
          <div class="strip-body" id="strip-tracks-body">
            <div class="loading"><div class="spinner"></div></div>
          </div>
        </div>
      </div>

      <div class="bib-subtabs" id="bib-subtabs">
        <button class="bib-tab${state.bibSubTab === 'collectie' ? ' active' : ''}" data-bibtab="collectie">Collectie</button>
        <button class="bib-tab${state.bibSubTab === 'lijst' ? ' active' : ''}" data-bibtab="lijst">Lijst</button>
      </div>

      <div id="bib-subtoolbar"></div>
      <div class="blib-wrap">
        <div class="bib-sub-content" id="bib-sub-content">
          <div class="loading"><div class="spinner"></div>Laden…</div>
        </div>
      </div>

      <div class="section-block" style="margin-top:32px">
        <div class="section-hdr">
          <span class="section-hdr-title">Statistieken</span>
        </div>
        <div class="section-content" id="bib-stats-content">
          <div class="loading"><div class="spinner"></div>Laden…</div>
        </div>
      </div>
    </div>`;

  contentEl.style.opacity  = '1';
  contentEl.style.transform = '';

  document.querySelectorAll('.bib-tab').forEach(btn =>
    btn.addEventListener('click', () => switchBibSubTab(btn.dataset.bibtab)));

  await Promise.all([
    runWithSection(document.getElementById('strip-artists-body'), () => loadTopArtists(state.currentPeriod)),
    runWithSection(document.getElementById('strip-tracks-body'),  () => loadTopTracks(state.currentPeriod)),
  ]);

  await switchBibSubTab(state.bibSubTab);

  setupLazyLoad(document.getElementById('bib-stats-content'), () => {
    const myTarget = document.getElementById('bib-stats-content');
    return runWithSection(myTarget, loadStats);
  });
}

// ═══════════════════════════════════════════════════════════════
// Bestaande functies — ongewijzigd bewaard
// ═══════════════════════════════════════════════════════════════

// ── Top artiesten ─────────────────────────────────────────────
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
        ? `<img src="${agImgSrc}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
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
    await limitConcurrency(artists.map((a, i) => async () => {
      try {
        const info = await apiFetch(`/api/artist/${encodeURIComponent(a.name)}/info`);
        if (info.image) {
          const el = document.getElementById(`agp-${i}`);
          if (el) el.innerHTML = `<img src="${proxyImg(info.image, 120) || info.image}" alt="" loading="lazy" onerror="this.style.display='none'">`;
        }
      } catch {}
    }), 4);
  } catch (e) { if (e.name === 'AbortError') return; showError(e.message); }
}

// ── Top nummers ───────────────────────────────────────────────
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

// ── Geliefd ───────────────────────────────────────────────────
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

// ── Statistieken ──────────────────────────────────────────────
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

// ── Collection Gaps ───────────────────────────────────────────
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
      setTimeout(() => { if (state.activeSubTab === 'gaten') loadGaps(); }, 20_000);
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
    document.getElementById('badge-gaps').textContent = '0';
    return;
  }
  if (state.gapsSort === 'missing') artists.sort((a, b) => b.missingAlbums.length - a.missingAlbums.length);
  if (state.gapsSort === 'name')    artists.sort((a, b) => a.name.localeCompare(b.name));

  const totalMissing = artists.reduce((s, a) => s + a.missingAlbums.length, 0);
  document.getElementById('badge-gaps').textContent = totalMissing;

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
