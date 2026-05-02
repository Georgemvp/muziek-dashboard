// ── Releases view: Volledige New Releases pagina ─────────────────────────────
// Toont alle nieuwe releases, gefilterd op type, gesorteerd op playcount of datum.

import { apiFetch } from '../api.js';
import { switchView } from '../router.js';
import { esc, proxyImg, gradientFor, initials, fmt } from '../helpers.js';
import { state } from '../state.js';

const SEEN_RELEASES_KEY = 'seenReleaseIds';

// Zorg dat _imgFb beschikbaar is op window (zelfde patroon als home.js)
if (typeof window !== 'undefined' && !window._imgFb) {
  window._imgFb = function(el, ph) {
    if (!el._d) {
      el._d = 1;
      var fb = el.getAttribute('data-fb');
      if (fb) { el.src = fb; return; }
    }
    el.style.display = 'none';
    el.insertAdjacentHTML('afterend', '<div class="releases-cover-ph">' + (ph || '♫') + '</div>');
  };
}

// Module state
let releasesData = null;
let activeFilter = 'all';  // 'all' | 'album' | 'single' | 'ep'
let activeSort = 'playcount'; // 'playcount' | 'date'

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  const now = new Date();
  const diffMs = now - d;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Vandaag';
  if (diffDays === 1) return 'Gisteren';
  if (diffDays < 7) return `${diffDays}d geleden`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w geleden`;
  return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' });
}

function typeLabel(type) {
  if (!type) return 'Album';
  switch (type.toLowerCase()) {
    case 'single': return 'Single';
    case 'ep':     return 'EP';
    default:       return 'Album';
  }
}

function getFilteredAndSorted(releases) {
  let filtered = releases;
  if (activeFilter !== 'all') {
    filtered = releases.filter(r => (r.type || 'album').toLowerCase() === activeFilter);
  }
  if (activeSort === 'date') {
    filtered = [...filtered].sort((a, b) => {
      const da = a.releaseDate ? new Date(a.releaseDate) : new Date(0);
      const db = b.releaseDate ? new Date(b.releaseDate) : new Date(0);
      return db - da;
    });
  } else {
    // default: playcount descending
    filtered = [...filtered].sort((a, b) => (b.artistPlaycount || 0) - (a.artistPlaycount || 0));
  }
  return filtered;
}

// ── Render functions ─────────────────────────────────────────────────────────

/**
 * Geeft een <img>-element terug voor de albumhoes van een release.
 *
 * Prioriteit:
 *   1. r.image (pre-resolved Cover Art Archive URL — exacte MusicBrainz-match)
 *   2. /api/imageproxy/album (Deezer album search — fuzzy, gecached door backend)
 *   3. data-fb: artiest-foto via imageproxy
 *   4. ♫ placeholder
 */
function releaseImgEl(r) {
  const deezerArtist = `/api/imageproxy/artist/${encodeURIComponent(r.artist)}`;

  if (r.image) {
    // Directe CAA-URL — geen extra fetch nodig
    return `<img src="${esc(r.image)}" alt="${esc(r.album)}" loading="lazy" decoding="async"
      data-fb="${esc(deezerArtist)}"
      onerror="window._imgFb ? window._imgFb(this,'♫') : this.style.display='none'"
      style="opacity:0;transition:opacity 0.35s;position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:1"
      onload="this.style.opacity='1'">`;
  }

  // Fallback: Deezer album search via imageproxy
  const params = new URLSearchParams({
    q:      `${r.artist} ${r.album}`,
    artist: r.artist,
    album:  r.album
  });
  const deezerAlbum = `/api/imageproxy/album?${params.toString()}`;
  return `<img src="${esc(deezerAlbum)}" alt="${esc(r.album)}" loading="lazy" decoding="async"
    data-fb="${esc(deezerArtist)}"
    onerror="window._imgFb ? window._imgFb(this,'♫') : this.style.display='none'"
    style="opacity:0;transition:opacity 0.35s;position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:1"
    onload="this.style.opacity='1'">`;
}

function renderCard(r) {
  const bg = gradientFor(r.album || r.artist || '');
  const ph = initials(r.album || r.artist || '?');
  const label = typeLabel(r.type);
  const dateStr = formatDate(r.releaseDate);
  const badgeHtml = r.inPlex
    ? `<span class="releases-plex-badge" title="In je Plex bibliotheek">▶ Plex</span>`
    : '';

  return `
    <div class="releases-card">
      <div class="releases-cover" style="background:${bg}">
        <div class="releases-cover-ph">${esc(ph)}</div>
        ${releaseImgEl(r)}
        <span class="releases-type-badge releases-type-badge--${esc((r.type||'album').toLowerCase())}">${esc(label)}</span>
        <button class="releases-download-btn"
          data-artist="${esc(r.artist)}"
          data-album="${esc(r.album)}"
          title="Download via Tidarr / OrpheusDL">⬇</button>
      </div>
      <div class="releases-info">
        <div class="releases-album" title="${esc(r.album)}">${esc(r.album)}</div>
        <div class="releases-artist"
             data-artist="${esc(r.artist)}"
             title="${esc(r.artist)}">${esc(r.artist)}</div>
        <div class="releases-meta">
          <span class="releases-date">${esc(dateStr)}</span>
          ${badgeHtml}
        </div>
      </div>
    </div>`;
}

function renderToolbar(releases) {
  const toolbar = document.getElementById('view-toolbar');
  if (!toolbar) return;

  const total = releases ? releases.length : 0;
  toolbar.innerHTML = `
    <div class="toolbar-group">
      <button class="toolbar-btn releases-filter-btn ${activeFilter === 'all'    ? 'active' : ''}" data-filter="all">Alle</button>
      <button class="toolbar-btn releases-filter-btn ${activeFilter === 'album'  ? 'active' : ''}" data-filter="album">Albums</button>
      <button class="toolbar-btn releases-filter-btn ${activeFilter === 'single' ? 'active' : ''}" data-filter="single">Singles</button>
      <button class="toolbar-btn releases-filter-btn ${activeFilter === 'ep'     ? 'active' : ''}" data-filter="ep">EPs</button>
    </div>
    <div class="toolbar-group">
      <span class="toolbar-badge">${total} release${total !== 1 ? 's' : ''}</span>
      <select id="releases-sort" class="toolbar-select">
        <option value="playcount" ${activeSort === 'playcount' ? 'selected' : ''}>Meest beluisterd</option>
        <option value="date"      ${activeSort === 'date'      ? 'selected' : ''}>Nieuwste eerst</option>
      </select>
      <button id="releases-refresh-btn" class="toolbar-btn">↻ Vernieuwen</button>
    </div>
  `;

  toolbar.querySelectorAll('.releases-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeFilter = btn.dataset.filter;
      renderGrid();
      renderToolbar(releasesData ? releasesData.releases : []);
    });
  });

  document.getElementById('releases-sort')?.addEventListener('change', e => {
    activeSort = e.target.value;
    renderGrid();
  });

  document.getElementById('releases-refresh-btn')?.addEventListener('click', async () => {
    await doRefresh();
  });
}

function renderGrid() {
  const content = document.getElementById('content');
  if (!content) return;

  const grid = content.querySelector('#releases-grid');
  if (!grid) return;

  const releases = releasesData ? releasesData.releases : [];
  const filtered = getFilteredAndSorted(releases);

  if (filtered.length === 0) {
    const filterLabel = activeFilter === 'all' ? '' : ` (${typeLabel(activeFilter)}s)`;
    grid.innerHTML = `
      <div class="releases-empty">
        <div class="releases-empty-icon">♫</div>
        <div class="releases-empty-text">Geen nieuwe releases${filterLabel} gevonden</div>
      </div>`;
    return;
  }

  grid.innerHTML = filtered.map(renderCard).join('');

  // Artist click → artist-detail
  grid.querySelectorAll('.releases-artist[data-artist]').forEach(el => {
    el.addEventListener('click', () => {
      switchView('artist-detail', { name: el.dataset.artist });
    });
  });

  // Download knoppen
  grid.querySelectorAll('.releases-download-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const artist = btn.dataset.artist;
      const album  = btn.dataset.album;
      btn.disabled = true;
      btn.textContent = '…';

      try {
        // Probeer eerst Tidarr
        const searchData = await apiFetch(`/api/tidarr/search?q=${encodeURIComponent(`${artist} ${album}`)}`);
        const results = searchData?.albums || searchData?.results || [];

        if (results.length) {
          const quality = localStorage.getItem('downloadQuality') || 'high';
          await apiFetch('/api/tidarr/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: results[0].id, type: 'album', quality })
          });
          btn.textContent = '✓';
          btn.style.color = '#4caf50';
          return;
        }

        // Fallback: OrpheusDL
        const orpheusSearch = await apiFetch(`/api/orpheus/search?q=${encodeURIComponent(`${artist} ${album}`)}&type=album`);
        const orpheusResults = orpheusSearch?.results || [];
        if (orpheusResults.length) {
          const quality = localStorage.getItem('downloadQuality') || 'high';
          await apiFetch('/api/orpheus/download', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: orpheusResults[0].url, platform: orpheusResults[0].platform, quality })
          });
          btn.textContent = '✓';
          btn.style.color = '#4caf50';
          return;
        }

        btn.textContent = '✗';
        btn.title = 'Niet gevonden in Tidarr of OrpheusDL';
      } catch (err) {
        console.error('Download mislukt:', err);
        btn.textContent = '✗';
      } finally {
        setTimeout(() => {
          if (btn.textContent !== '✓') {
            btn.disabled = false;
            btn.textContent = '⬇';
            btn.style.color = '';
          }
        }, 3000);
      }
    });
  });
}

async function doRefresh() {
  const btn = document.getElementById('releases-refresh-btn');
  if (btn) { btn.disabled = true; btn.textContent = '↻ Bezig…'; }
  try {
    await apiFetch('/api/releases/refresh', { method: 'POST' });
    releasesData = null;
    await loadAndRender();
  } catch (err) {
    const content = document.getElementById('content');
    if (content) {
      const err2 = content.querySelector('.releases-error');
      if (err2) err2.remove();
      const errEl = document.createElement('div');
      errEl.className = 'releases-error error-box';
      errEl.textContent = 'Verversen mislukt: ' + err.message;
      content.prepend(errEl);
    }
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '↻ Vernieuwen'; }
  }
}

async function loadAndRender() {
  const content = document.getElementById('content');
  if (!content) return;

  // Loading state
  content.innerHTML = `
    <div class="releases-loading">
      <div class="releases-loading-spinner"></div>
      <div class="releases-loading-text">Releases laden…</div>
    </div>`;

  try {
    const data = await apiFetch('/api/releases');

    // Building state
    if (data && data.status === 'building') {
      const pct = data.progress?.percent ?? 0;
      content.innerHTML = `
        <div class="releases-building">
          <div class="releases-building-title">Releases worden opgebouwd…</div>
          <div class="releases-building-bar-wrap">
            <div class="releases-building-bar" style="width:${pct}%"></div>
          </div>
          <div class="releases-building-pct">${pct}%</div>
          <div class="releases-building-hint">Dit kan even duren. Probeer het over een minuut opnieuw.</div>
          <button class="toolbar-btn" id="releases-retry-btn" style="margin-top:16px">↻ Opnieuw proberen</button>
        </div>`;
      document.getElementById('releases-retry-btn')?.addEventListener('click', loadAndRender);
      return;
    }

    releasesData = data;

    // Mark all seen in localStorage
    if (data && data.releases) {
      const allIds = data.releases.map(r => `${r.artist}::${r.album}`);
      localStorage.setItem(SEEN_RELEASES_KEY, JSON.stringify(allIds));
      state.newReleaseCount = 0;
      // Reset sidebar badge
      document.querySelectorAll('.nav-releases-badge, .releases-badge').forEach(el => {
        el.style.display = 'none';
        el.textContent = '';
      });
    }

    const releases = (data && data.releases) || [];

    content.innerHTML = `
      <div class="releases-header">
        <h1 class="releases-title">New Releases</h1>
        ${data && data.builtAt ? `<div class="releases-built-at">Bijgewerkt ${formatDate(new Date(data.builtAt).toISOString().split('T')[0])}</div>` : ''}
      </div>
      <div id="releases-grid" class="releases-grid"></div>`;

    renderToolbar(releases);
    renderGrid();

  } catch (err) {
    content.innerHTML = `
      <div class="error-box">
        ⚠️ Releases laden mislukt: ${esc(err.message)}
        <button class="error-retry-btn" style="margin-left:12px;padding:4px 10px;cursor:pointer;">
          Probeer opnieuw
        </button>
      </div>`;
    content.querySelector('.error-retry-btn')?.addEventListener('click', loadAndRender);
  }
}

// ── CSS ───────────────────────────────────────────────────────────────────────

function injectStyles() {
  if (document.getElementById('releases-view-styles')) return;
  const style = document.createElement('style');
  style.id = 'releases-view-styles';
  style.textContent = `
    /* ── Releases: Loading / Building ─────────────────────────────────── */
    .releases-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px 20px;
      gap: 16px;
      color: var(--text-secondary);
    }
    .releases-loading-spinner {
      width: 36px;
      height: 36px;
      border: 3px solid var(--border);
      border-top-color: var(--accent);
      border-radius: 50%;
      animation: releases-spin 0.7s linear infinite;
    }
    @keyframes releases-spin { to { transform: rotate(360deg); } }
    .releases-loading-text { font-size: 14px; }

    .releases-building {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 60px 20px;
      gap: 12px;
      color: var(--text-secondary);
    }
    .releases-building-title { font-size: 16px; font-weight: 600; color: var(--text-primary); }
    .releases-building-bar-wrap {
      width: 280px; height: 6px;
      background: var(--border);
      border-radius: 3px;
      overflow: hidden;
    }
    .releases-building-bar {
      height: 100%;
      background: var(--accent);
      border-radius: 3px;
      transition: width 0.4s ease;
    }
    .releases-building-pct { font-size: 13px; }
    .releases-building-hint { font-size: 12px; opacity: 0.7; }

    /* ── Releases: Header ─────────────────────────────────────────────── */
    .releases-header {
      display: flex;
      align-items: baseline;
      gap: 16px;
      padding: 24px 24px 0;
    }
    .releases-title {
      font-size: 22px;
      font-weight: 700;
      color: var(--text-primary);
      font-family: var(--font-display, inherit);
      margin: 0;
    }
    .releases-built-at {
      font-size: 12px;
      color: var(--text-tertiary);
    }

    /* ── Releases: Grid ───────────────────────────────────────────────── */
    .releases-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 16px;
      padding: 20px 24px 40px;
    }

    /* ── Releases: Card ───────────────────────────────────────────────── */
    .releases-card {
      display: flex;
      flex-direction: column;
      border-radius: 8px;
      overflow: hidden;
      background: var(--bg-secondary);
      transition: transform 0.15s ease, box-shadow 0.15s ease;
      cursor: default;
      position: relative;
    }
    .releases-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0,0,0,0.18);
    }

    .releases-cover {
      position: relative;
      aspect-ratio: 1 / 1;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .releases-cover-ph {
      font-size: 28px;
      font-weight: 700;
      color: rgba(255,255,255,0.6);
      letter-spacing: 1px;
      position: relative;
      z-index: 0;
    }

    .releases-type-badge {
      position: absolute;
      bottom: 6px;
      left: 6px;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 2px 6px;
      border-radius: 3px;
      z-index: 2;
      background: rgba(0,0,0,0.6);
      color: #fff;
    }
    .releases-type-badge--single { background: rgba(var(--accent-rgb, 80,120,255), 0.85); }
    .releases-type-badge--ep     { background: rgba(180,100,20,0.85); }
    .releases-type-badge--album  { background: rgba(0,0,0,0.6); }

    .releases-plex-badge {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      font-size: 10px;
      font-weight: 600;
      color: var(--plex-color, #e5a00d);
      background: rgba(229,160,13,0.12);
      padding: 1px 5px;
      border-radius: 3px;
    }

    .releases-info {
      padding: 10px 10px 12px;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .releases-album {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .releases-artist {
      font-size: 12px;
      color: var(--text-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      cursor: pointer;
      transition: color 0.15s;
    }
    .releases-artist:hover { color: var(--accent); text-decoration: underline; }

    .releases-meta {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 2px;
    }
    .releases-date {
      font-size: 11px;
      color: var(--text-tertiary);
    }

    /* ── Releases: Empty ──────────────────────────────────────────────── */
    .releases-empty {
      grid-column: 1 / -1;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 60px 20px;
      gap: 12px;
      color: var(--text-secondary);
    }
    .releases-empty-icon { font-size: 36px; opacity: 0.4; }
    .releases-empty-text { font-size: 14px; }

    /* ── Releases: Download button ───────────────────────────────────── */
    .releases-download-btn {
      position: absolute;
      top: 8px;
      right: 8px;
      background: rgba(0,0,0,0.6);
      color: #fff;
      border: none;
      border-radius: 50%;
      width: 32px;
      height: 32px;
      font-size: 15px;
      line-height: 1;
      cursor: pointer;
      opacity: 0;
      transition: opacity 0.2s, background 0.15s;
      z-index: 3;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .releases-download-btn:hover { background: rgba(0,0,0,0.85); }
    .releases-download-btn:disabled { cursor: default; }
    .releases-card:hover .releases-download-btn,
    .releases-download-btn:focus { opacity: 1; }

    /* ── Toolbar: filter buttons active state ─────────────────────────── */
    .toolbar-btn.releases-filter-btn.active {
      background: var(--accent);
      color: #fff;
      border-color: var(--accent);
    }

    /* ── Mobile ───────────────────────────────────────────────────────── */
    @media (max-width: 600px) {
      .releases-grid {
        grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
        gap: 12px;
        padding: 16px 12px 32px;
      }
      .releases-header { padding: 16px 12px 0; }
    }
  `;
  document.head.appendChild(style);
}

// ── Entry point ──────────────────────────────────────────────────────────────

export async function loadReleases() {
  injectStyles();
  await loadAndRender();
}
