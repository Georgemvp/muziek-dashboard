// ── Artists view — Grid van artiesten met Plex en Last.fm data ──────

import { state } from '../state.js';
import { apiFetch } from '../api.js';
import { getCached, setCache } from '../cache.js';
import {
  esc, fmt, initials, gradientFor, tagsHtml, proxyImg,
  bookmarkBtn, showLoading, showError
} from '../helpers.js';

// ═══════════════════════════════════════════════════════════════════════════
// Module state
// ═══════════════════════════════════════════════════════════════════════════

let artistsData = null;        // combined data from Plex + Last.fm
let artistsSearchTerm = '';    // search filter
let artistsSort = 'name';      // sort mode: name, playcount, recent
let detailViewData = null;     // current artist detail view data
let scrollPosition = 0;        // saved scroll position

// ═══════════════════════════════════════════════════════════════════════════
// Helper functions
// ═══════════════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════════════
// Toolbar rendering
// ═══════════════════════════════════════════════════════════════════════════

function renderToolbar() {
  const toolbar = document.getElementById('view-toolbar');
  if (!toolbar) return;

  const totalArtists = artistsData ? artistsData.length : 0;

  toolbar.innerHTML = `
    <div class="toolbar-group">
      <input type="text" id="artists-search" placeholder="Filter artiesten..." class="toolbar-input" value="${esc(artistsSearchTerm)}">
      <select id="artists-sort" class="toolbar-select">
        <option value="name" ${artistsSort === 'name' ? 'selected' : ''}>Naam A-Z</option>
        <option value="playcount" ${artistsSort === 'playcount' ? 'selected' : ''}>Meest beluisterd</option>
        <option value="recent" ${artistsSort === 'recent' ? 'selected' : ''}>Recent toegevoegd</option>
      </select>
    </div>
    <div class="toolbar-group">
      <span class="toolbar-badge">${totalArtists} artiesten</span>
    </div>
  `;

  document.getElementById('artists-search').addEventListener('input', e => {
    artistsSearchTerm = e.target.value;
    renderArtistsGrid();
  });

  document.getElementById('artists-sort').addEventListener('change', e => {
    artistsSort = e.target.value;
    renderArtistsGrid();
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// Artist card rendering
// ═══════════════════════════════════════════════════════════════════════════

function renderArtistCard(artist) {
  const thumb = artist.thumb ? proxyImg(artist.thumb, 200) : null;
  const bg = gradientFor(artist.name || '?');
  const playcountBadge = artist.playcount
    ? `<span class="artist-playcount-badge">${fmt(artist.playcount)} plays</span>`
    : '';

  return `
    <div class="artist-card" data-artist-name="${esc(artist.name)}" title="${esc(artist.name)}">
      <div class="artist-cover">
        ${thumb
          ? `<img src="${esc(thumb)}" alt="${esc(artist.name)}" class="artist-photo" loading="lazy" decoding="async">`
          : `<div class="artist-photo-ph" style="background:${bg}">${initials(artist.name)}</div>`
        }
        <div class="artist-overlay">
          <button class="artist-detail-btn" data-artist-detail="${esc(artist.name)}" title="Bekijk details">→</button>
        </div>
      </div>
      <div class="artist-info">
        <div class="artist-name">${esc(artist.name)}</div>
        ${artist.genres && artist.genres.length > 0 ? tagsHtml(artist.genres.slice(0, 2), 2) : ''}
        ${playcountBadge}
      </div>
      <div class="artist-actions">
        ${bookmarkBtn('artist', artist.name, artist.name, artist.thumb || '')}
      </div>
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════════════════════
// Filter and sort
// ═══════════════════════════════════════════════════════════════════════════

function filterAndSort(artists) {
  let filtered = [...artists];

  // Filter by search term
  if (artistsSearchTerm) {
    const q = artistsSearchTerm.toLowerCase();
    filtered = filtered.filter(a =>
      a.name.toLowerCase().includes(q) ||
      (a.genres && a.genres.some(g => g.toLowerCase().includes(q)))
    );
  }

  // Sort
  if (artistsSort === 'playcount') {
    filtered.sort((a, b) => (b.playcount || 0) - (a.playcount || 0));
  } else if (artistsSort === 'recent') {
    filtered.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
  } else {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  }

  return filtered;
}

// ═══════════════════════════════════════════════════════════════════════════
// Detail view
// ═══════════════════════════════════════════════════════════════════════════

async function showArtistDetail(artist) {
  detailViewData = artist;
  const content = getContent();
  if (!content) return;

  // Save scroll position
  scrollPosition = content.scrollTop || 0;

  // Render detail view
  await renderArtistDetailView();
}

function hideArtistDetail() {
  detailViewData = null;
  const content = getContent();
  if (content) {
    // Restore grid view
    const filtered = filterAndSort(artistsData || []);
    renderArtistsGrid().then(() => {
      // Restore scroll position
      setTimeout(() => {
        content.scrollTop = scrollPosition;
      }, 0);
    });
  }
}

async function renderArtistDetailView() {
  const content = getContent();
  if (!content || !detailViewData) return;

  const artist = detailViewData;
  const coverSrc = artist.thumb ? proxyImg(artist.thumb, 320) : null;

  // Try to load artist info from Last.fm
  let artistInfo = { genres: artist.genres || [], bio: '' };
  try {
    const res = await apiFetch(`/api/artist/${encodeURIComponent(artist.name)}/info`);
    if (res) {
      artistInfo = {
        genres: res.genres || artist.genres || [],
        bio: res.bio || '',
        playcount: res.playcount || artist.playcount || 0
      };
    }
  } catch (e) {
    console.warn('Error loading artist info:', e);
  }

  const bioHtml = artistInfo.bio
    ? `<div class="artist-detail-bio" style="margin: 24px 0; font-size: 14px; line-height: 1.6; color: var(--text-secondary);">
         ${esc(artistInfo.bio.substring(0, 300))}${artistInfo.bio.length > 300 ? '...' : ''}
       </div>`
    : '';

  const genresHtml = artistInfo.genres && artistInfo.genres.length > 0
    ? `<div style="margin: 12px 0;">${tagsHtml(artistInfo.genres.slice(0, 5), 5)}</div>`
    : '';

  content.innerHTML = `
    <div class="artist-detail-view">
      <!-- Header: Back button -->
      <button class="artist-detail-back" title="Terug naar artiesten">← Alle artiesten</button>

      <!-- Hero Section -->
      <div class="artist-detail-hero">
        <div class="artist-detail-cover-wrapper">
          ${coverSrc
            ? `<img src="${esc(coverSrc)}" alt="${esc(artist.name)}" class="artist-detail-cover">`
            : `<div class="artist-detail-cover-ph" style="background:${gradientFor(artist.name)}">${initials(artist.name)}</div>`
          }
        </div>
        <div class="artist-detail-info">
          <h1>${esc(artist.name)}</h1>
          ${genresHtml}
          <div class="artist-detail-stats">
            ${artistInfo.playcount ? `<span>${fmt(artistInfo.playcount)} plays</span>` : ''}
          </div>
          <div class="artist-detail-actions">
            ${bookmarkBtn('artist', artist.name, artist.name, artist.thumb || '')}
          </div>
        </div>
      </div>

      <!-- Bio -->
      ${bioHtml}
    </div>
  `;

  // Attach back button listener
  content.querySelector('.artist-detail-back')?.addEventListener('click', hideArtistDetail);
}

// ═══════════════════════════════════════════════════════════════════════════
// Render grid
// ═══════════════════════════════════════════════════════════════════════════

async function renderArtistsGrid() {
  const content = getContent();
  if (!content) return;

  try {
    if (!artistsData) {
      showLoading();

      // Fetch Plex library
      let plexArtists = [];
      try {
        const plexRes = await apiFetch('/api/plex/library');
        if (plexRes && Array.isArray(plexRes)) {
          plexArtists = plexRes.map(a => ({
            name: a.title,
            thumb: a.thumb,
            addedAt: a.addedAt || 0,
            playcount: 0  // Will be merged with Last.fm data
          }));
        }
      } catch (e) {
        console.error('Error loading Plex library:', e);
        showError('Kan Plex-bibliotheek niet laden: ' + e.message);
        return;
      }

      // Fetch Last.fm top artists
      let lastfmArtists = {};
      try {
        const lastfmRes = await apiFetch('/api/top/artists?period=overall');
        if (lastfmRes && Array.isArray(lastfmRes)) {
          lastfmRes.forEach(a => {
            lastfmArtists[a.name.toLowerCase()] = {
              playcount: parseInt(a.playcount, 10) || 0,
              genres: a.tags || [],
              url: a.url
            };
          });
        }
      } catch (e) {
        console.warn('Error loading Last.fm data:', e);
        // Continue without Last.fm data
      }

      // Merge Plex and Last.fm data
      const mergedArtists = plexArtists.map(artist => ({
        ...artist,
        ...(lastfmArtists[artist.name.toLowerCase()] || {})
      }));

      artistsData = mergedArtists;
      setCache('artists', artistsData);
    }

    renderToolbar();

    // Filter and sort
    const filtered = filterAndSort(artistsData);

    // Render grid
    const cols = getCols();
    const html = `
      <div class="artists-grid" style="display: grid; grid-template-columns: repeat(${cols}, minmax(150px, 1fr)); gap: var(--grid-gap); padding: 16px 0;">
        ${filtered.map(a => renderArtistCard(a)).join('')}
      </div>
    `;

    content.innerHTML = html;

    // Attach event listeners
    content.querySelectorAll('.artist-detail-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        const card = btn.closest('.artist-card');
        const artistName = card?.dataset.artistName;
        if (artistName) {
          const artist = artistsData.find(a => a.name === artistName);
          if (artist) showArtistDetail(artist);
        }
      });
    });

    content.querySelectorAll('.artist-card').forEach(card => {
      card.addEventListener('click', e => {
        if (e.target.closest('.artist-actions, .artist-detail-btn')) return;
        const artistName = card.dataset.artistName;
        if (artistName) {
          const artist = artistsData.find(a => a.name === artistName);
          if (artist) showArtistDetail(artist);
        }
      });
    });

  } catch (err) {
    showError('Error: ' + err.message);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Main export
// ═══════════════════════════════════════════════════════════════════════════

export async function loadArtists() {
  document.title = 'Muziek · Artists';

  // Reset state
  artistsSearchTerm = '';
  artistsSort = 'name';
  detailViewData = null;

  // Try to load from cache first
  const cached = getCached('artists', 30 * 60 * 1000);
  if (cached) {
    artistsData = cached;
  } else {
    artistsData = null;
  }

  await renderArtistsGrid();
}
