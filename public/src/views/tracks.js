// ── Tracks view — Roon-style My Tracks tabel met Plex + Last.fm ──────────

import { state } from '../state.js';
import { apiFetch } from '../api.js';
import { esc, fmt, proxyImg, showLoading, showError } from '../helpers.js';
import { playOnZone, getSelectedZone } from '../components/plexRemote.js';
import { openArtistPanel } from '../components/panel.js';

// ═══════════════════════════════════════════════════════════════════════════
// Module-level state
// ═══════════════════════════════════════════════════════════════════════════

let tracksData = null;           // merged tracks data {plex: [], lastfm: [], all: []}
let tracksSearchTerm = '';       // current search term
let tracksSort = 'artist';       // sort mode: track, length, artist, album
let tracksSortDir = 'asc';       // sort direction: asc or desc
let tracksFilter = 'all';        // filter: all, plex-only, lastfm-only
let tracksScrollPos = 0;         // saved scroll position

// Virtual scrolling config
const TRACK_ROW_HEIGHT = 48;     // Hoogte van elke track-rij in px
const TRACKS_BUFFER = 5;         // Buffer rows boven/onder viewport

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

/** Merge Plex tracks met Last.fm data. */
function mergeTrackData(plexTracks, lastfmTracks) {
  const lastfmMap = new Map();
  (lastfmTracks || []).forEach(t => {
    const artistName = typeof t.artist === 'object' ? t.artist.name : t.artist;
    const key = normalizeTrackName(`${t.name}|${artistName}`);
    lastfmMap.set(key, { ...t, artist: artistName });
  });

  // Enriched Plex tracks
  const enriched = (plexTracks || []).map(t => {
    const key = normalizeTrackName(`${t.title}|${t.artist}`);
    const lfm = lastfmMap.get(key);
    return {
      ...t,
      source: 'plex',
      plays: lfm?.playcount || 0,
      url: lfm?.url || null,
      inPlex: true
    };
  });

  // Last.fm-only tracks (not in Plex)
  const lastfmOnly = (lastfmTracks || [])
    .filter(t => {
      const artistName = typeof t.artist === 'object' ? t.artist.name : t.artist;
      return !plexTracks.find(p =>
        normalizeTrackName(p.title) === normalizeTrackName(t.name) &&
        normalizeTrackName(p.artist) === normalizeTrackName(artistName)
      );
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
        inPlex: false
      };
    });

  return {
    plex: enriched,
    lastfm: lastfmOnly,
    all: [...enriched, ...lastfmOnly]
  };
}

/** Filter en sorteer tracks. */
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

  // Sort
  const ascending = tracksSortDir === 'asc';
  const compare = (a, b) => {
    let result = 0;

    switch (tracksSort) {
      case 'artist':
        result = (a.artist || '').localeCompare(b.artist || '') ||
                 (a.album || '').localeCompare(b.album || '') ||
                 (a.title || '').localeCompare(b.title || '');
        break;
      case 'album':
        result = (a.album || '').localeCompare(b.album || '') ||
                 (a.artist || '').localeCompare(b.artist || '') ||
                 (a.title || '').localeCompare(b.title || '');
        break;
      case 'length':
        result = (a.duration || 0) - (b.duration || 0);
        break;
      case 'track':
      default:
        result = (a.title || '').localeCompare(b.title || '');
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

/** Render Roon-style track tabel met virtual scrolling. */
async function renderTracks() {
  const content = getContent();
  if (!content || !tracksData) return;

  renderHeader();

  const filtered = filterAndSort(tracksData.all);
  const zone = getSelectedZone();

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

  // Render container met virtual scrolling
  content.innerHTML = `
    <div class="tracks-roon-table-wrapper">
      <table class="tracks-roon-table">
        <thead class="tracks-roon-thead">
          <tr>
            <th class="tracks-col-num">#</th>
            <th class="tracks-col-art"></th>
            <th class="tracks-col-title">
              <span>Track</span>
              <span class="tracks-search-icon">🔍</span>
            </th>
            <th class="tracks-col-heart">♡</th>
            <th class="tracks-col-length" data-sort="length">
              <span>Length</span>
              ${tracksSort === 'length' ? `<span class="tracks-sort-arrow ${tracksSortDir}">${tracksSortDir === 'asc' ? '↑' : '↓'}</span>` : ''}
            </th>
            <th class="tracks-col-artist" data-sort="artist">
              <span>Album artist</span>
              ${tracksSort === 'artist' ? `<span class="tracks-sort-arrow ${tracksSortDir}">${tracksSortDir === 'asc' ? '↑' : '↓'}</span>` : ''}
              <span class="tracks-search-icon">🔍</span>
            </th>
            <th class="tracks-col-album" data-sort="album">
              <span>Album</span>
              ${tracksSort === 'album' ? `<span class="tracks-sort-arrow ${tracksSortDir}">${tracksSortDir === 'asc' ? '↑' : '↓'}</span>` : ''}
              <span class="tracks-search-icon">🔍</span>
            </th>
            <th class="tracks-col-menu">⚙️</th>
          </tr>
        </thead>
        <tbody id="tracks-tbody" class="tracks-roon-tbody">
          ${renderVisibleRows(filtered, 0)}
        </tbody>
      </table>
      <div class="tracks-virtual-spacer" id="tracks-virtual-spacer"></div>
    </div>
  `;

  // Update spacer height
  const totalHeight = filtered.length * TRACK_ROW_HEIGHT;
  document.getElementById('tracks-virtual-spacer').style.height = totalHeight + 'px';

  // Attach event listeners
  attachTableEvents(content, filtered, zone);

  // Add scroll listener voor virtual scrolling
  content.addEventListener('scroll', () => {
    const scrollTop = content.scrollTop;
    const startIdx = Math.max(0, Math.floor(scrollTop / TRACK_ROW_HEIGHT) - TRACKS_BUFFER);
    const endIdx = Math.min(filtered.length, startIdx + getViewportRows());
    const tbody = document.getElementById('tracks-tbody');
    if (tbody) {
      tbody.innerHTML = renderVisibleRows(filtered, startIdx, endIdx);
      tbody.style.transform = `translateY(${startIdx * TRACK_ROW_HEIGHT}px)`;
      attachTableEvents(content, filtered, zone);
    }
  });
}

/** Render alleen zichtbare rijen (virtual scrolling). */
function renderVisibleRows(filtered, startIdx, endIdx = null) {
  if (endIdx === null) {
    endIdx = Math.min(filtered.length, startIdx + getViewportRows());
  }

  const zone = getSelectedZone();

  return filtered.slice(startIdx, endIdx).map((track, idx) => {
    const actualIdx = startIdx + idx;
    const coverSrc = track.thumb ? proxyImg(track.thumb, 40) : null;
    const inPlexIcon = track.inPlex ? '<span class="tracks-plex-pin" title="In Plex">📌</span>' : '';

    return `
      <tr class="tracks-roon-row" data-idx="${actualIdx}" data-rating-key="${track.ratingKey || ''}">
        <td class="tracks-col-num">${actualIdx + 1}</td>
        <td class="tracks-col-art">
          ${coverSrc
            ? `<img src="${esc(coverSrc)}" alt="album art" class="tracks-thumb">`
            : '<div class="tracks-thumb-placeholder">♪</div>'
          }
        </td>
        <td class="tracks-col-title">
          <span class="tracks-title-text">${esc(track.title)}</span>
          ${inPlexIcon}
        </td>
        <td class="tracks-col-heart">
          <button class="tracks-heart-toggle" data-track-id="${esc(track.title)}" title="Add to favorites">♡</button>
        </td>
        <td class="tracks-col-length">${formatDuration(track.duration)}</td>
        <td class="tracks-col-artist">
          <span class="tracks-artist-link" data-artist="${esc(track.artist)}">${esc(track.artist)}</span>
        </td>
        <td class="tracks-col-album">
          <span class="tracks-album-link" data-album="${esc(track.album)}">${esc(track.album)}</span>
        </td>
        <td class="tracks-col-menu">
          <button class="tracks-menu-btn" title="More options">⋯</button>
        </td>
      </tr>
    `;
  }).join('');
}

/** Attach event listeners aan tabel-elementen. */
function attachTableEvents(content, filtered, zone) {
  // Header sort clicks
  content.querySelectorAll('.tracks-roon-thead th[data-sort]').forEach(th => {
    th.style.cursor = 'pointer';
    th.addEventListener('click', () => {
      const newSort = th.getAttribute('data-sort');
      if (tracksSort === newSort) {
        // Toggle direction
        tracksSortDir = tracksSortDir === 'asc' ? 'desc' : 'asc';
      } else {
        tracksSort = newSort;
        tracksSortDir = 'asc';
      }
      renderTracks();
    });
  });

  // Artist links
  content.querySelectorAll('.tracks-artist-link').forEach(link => {
    link.style.cursor = 'pointer';
    link.addEventListener('click', (e) => {
      e.stopPropagation();
      const artist = link.getAttribute('data-artist');
      if (artist) openArtistPanel(artist);
    });
  });

  // Album links
  content.querySelectorAll('.tracks-album-link').forEach(link => {
    link.style.cursor = 'pointer';
    link.addEventListener('click', (e) => {
      e.stopPropagation();
      const albumName = link.getAttribute('data-album');
      // TODO: navigate to album detail
    });
  });

  // Play buttons
  content.querySelectorAll('.tracks-roon-row').forEach(row => {
    const ratingKey = row.getAttribute('data-rating-key');
    if (!ratingKey) return;

    row.style.cursor = 'pointer';
    row.addEventListener('dblclick', async (e) => {
      e.preventDefault();
      if (!zone) {
        showError('Selecteer eerst een Plex zone');
        return;
      }
      try {
        await playOnZone(ratingKey, 'music');
      } catch (err) {
        showError('Kan nummer niet afspelen: ' + err.message);
      }
    });
  });

  // Heart toggles
  content.querySelectorAll('.tracks-heart-toggle').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      // Toggle favorite via Last.fm API
      btn.classList.toggle('loved');
    });
  });

  // Menu buttons
  content.querySelectorAll('.tracks-menu-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      // Show context menu
    });
  });
}

/** Load tracks from both Plex and Last.fm. */
async function loadTracksData() {
  showLoading();

  try {
    // Load from both sources in parallel
    const [plexRes, lastfmRes] = await Promise.allSettled([
      apiFetch('/api/plex/tracks'),
      apiFetch('/api/top/tracks?period=overall')
    ]);

    const plexTracks = plexRes.status === 'fulfilled' ? plexRes.value.tracks || [] : [];
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
    showError('Kan tracks niet laden: ' + err.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Export
// ─────────────────────────────────────────────────────────────────────────────

export async function loadTracks() {
  const content = getContent();
  if (!content) return;

  showLoading();
  await loadTracksData();
}
