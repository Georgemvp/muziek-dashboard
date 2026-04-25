// ── Tracks view — Plex + Last.fm track listing met toolbar ──────────────────

import { state } from '../state.js';
import { apiFetch } from '../api.js';
import { esc, fmt, proxyImg, showLoading, showError, plexBadge, downloadBtn } from '../helpers.js';
import { playOnZone, getSelectedZone } from '../components/plexRemote.js';

// ═══════════════════════════════════════════════════════════════════════════
// Module-level state
// ═══════════════════════════════════════════════════════════════════════════

let tracksData = null;           // merged tracks data {plex: [], lastfm: [], all: []}
let tracksSearchTerm = '';       // current search term
let tracksSort = 'name';         // sort mode: name, artist, album, plays, duration
let tracksFilter = 'all';        // filter: all, plex-only, lastfm-only

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function getContent() {
  return document.getElementById('content');
}

function formatDuration(ms) {
  if (!ms) return '-';
  const totalSecs = Math.floor(ms / 1000);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
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
  switch (tracksSort) {
    case 'artist':
      filtered.sort((a, b) => a.artist.localeCompare(b.artist) || a.title.localeCompare(b.title));
      break;
    case 'album':
      filtered.sort((a, b) => a.album.localeCompare(b.album) || a.artist.localeCompare(b.artist));
      break;
    case 'plays':
      filtered.sort((a, b) => (b.plays || 0) - (a.plays || 0));
      break;
    case 'duration':
      filtered.sort((a, b) => (b.duration || 0) - (a.duration || 0));
      break;
    case 'name':
    default:
      filtered.sort((a, b) => a.title.localeCompare(b.title));
  }

  return filtered;
}

/** Render toolbar met search, sort, filter. */
function renderToolbar() {
  const toolbar = document.getElementById('view-toolbar');
  const totalTracks = tracksData?.all?.length || 0;
  const plexCount = tracksData?.plex?.length || 0;
  const lastfmCount = tracksData?.lastfm?.length || 0;

  toolbar.innerHTML = `
    <div class="tracks-toolbar">
      <div class="toolbar-group">
        <input type="text" id="tracks-search" placeholder="Zoek tracks..." class="toolbar-input" value="${esc(tracksSearchTerm)}">
        <select id="tracks-sort" class="toolbar-select">
          <option value="name" ${tracksSort === 'name' ? 'selected' : ''}>Naam</option>
          <option value="artist" ${tracksSort === 'artist' ? 'selected' : ''}>Artiest</option>
          <option value="album" ${tracksSort === 'album' ? 'selected' : ''}>Album</option>
          <option value="plays" ${tracksSort === 'plays' ? 'selected' : ''}>Meest beluisterd</option>
          <option value="duration" ${tracksSort === 'duration' ? 'selected' : ''}>Duur</option>
        </select>
        <select id="tracks-filter" class="toolbar-select">
          <option value="all" ${tracksFilter === 'all' ? 'selected' : ''}>Alles (${totalTracks})</option>
          <option value="plex-only" ${tracksFilter === 'plex-only' ? 'selected' : ''}>Alleen Plex (${plexCount})</option>
          <option value="lastfm-only" ${tracksFilter === 'lastfm-only' ? 'selected' : ''}>Alleen Last.fm (${lastfmCount})</option>
        </select>
      </div>
      <div class="toolbar-group">
        <span class="toolbar-badge">${totalTracks} nummers</span>
      </div>
    </div>
  `;

  document.getElementById('tracks-search').addEventListener('input', e => {
    tracksSearchTerm = e.target.value;
    renderTracks();
  });

  document.getElementById('tracks-sort').addEventListener('change', e => {
    tracksSort = e.target.value;
    renderTracks();
  });

  document.getElementById('tracks-filter').addEventListener('change', e => {
    tracksFilter = e.target.value;
    renderTracks();
  });
}

/** Render track listing als tabel. */
async function renderTracks() {
  const content = getContent();
  if (!content || !tracksData) return;

  renderToolbar();

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

  content.innerHTML = `
    <div class="tracks-table-container">
      <table class="tracks-table">
        <thead>
          <tr>
            <th></th>
            <th>Nummer</th>
            <th>Artiest</th>
            <th>Album</th>
            <th>Duur</th>
            <th>Plays</th>
            <th></th>
          </tr>
        </thead>
        <tbody id="tracks-tbody">
          ${filtered.map((track, idx) => `
            <tr data-idx="${idx}" data-rating-key="${track.ratingKey || ''}">
              <td>
                ${track.inPlex ? `<span class="plex-badge">P</span>` : '<span class="music-note">♪</span>'}
              </td>
              <td>${esc(track.title)}</td>
              <td>${esc(track.artist)}</td>
              <td>${esc(track.album)}</td>
              <td>${formatDuration(track.duration)}</td>
              <td>${track.plays > 0 ? `<strong>${track.plays}</strong>` : '—'}</td>
              <td>
                ${track.ratingKey ? `
                  <button class="track-play-btn" data-rating-key="${track.ratingKey}" data-zone="${zone?.id || ''}">▶</button>
                ` : ''}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  // Event listeners for play buttons
  document.querySelectorAll('.track-play-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const ratingKey = btn.getAttribute('data-rating-key');

      try {
        await playOnZone(ratingKey, 'music');
        btn.textContent = '⏸';
        setTimeout(() => { btn.textContent = '▶'; }, 2000);
      } catch (err) {
        showError('Kan nummer niet afspelen: ' + err.message);
      }
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
