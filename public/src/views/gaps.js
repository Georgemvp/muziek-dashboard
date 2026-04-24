import { apiFetch } from '../api.js';
import { getCached, setCached } from '../cache.js';
import {
  esc, fmt, initials, gradientFor, tagsHtml, bookmarkBtn, countryFlag,
  albumCard, showLoading, showError, proxyImg, p, plexBadge, downloadBtn
} from '../helpers.js';
import { hideTidarrUI, stopTidarrQueuePolling } from './downloads.js';

// Module state
let gapsData = null;
let gapsSort = 'missing';
let gapsSearchTerm = '';
let expandedArtists = new Set();

function renderToolbar() {
  const toolbar = document.getElementById('view-toolbar');
  const uniqueArtists = gapsData ? new Set(gapsData.gaps.map(g => g.artistId)).size : 0;
  const totalGaps = gapsData ? gapsData.gaps.length : 0;

  toolbar.innerHTML = `
    <div class="toolbar-group">
      <input type="text" id="gaps-search" placeholder="Filter artiesten..." class="toolbar-input" value="${esc(gapsSearchTerm)}">
      <select id="gaps-sort" class="toolbar-select">
        <option value="missing" ${gapsSort === 'missing' ? 'selected' : ''}>Meeste ontbrekend</option>
        <option value="name" ${gapsSort === 'name' ? 'selected' : ''}>Naam A-Z</option>
      </select>
    </div>
    <div class="toolbar-group">
      <span class="toolbar-badge">${totalGaps} ontbrekende albums bij ${uniqueArtists} artiesten</span>
      <button id="gaps-refresh" class="toolbar-btn">↻ Vernieuwen</button>
    </div>
  `;

  document.getElementById('gaps-search').addEventListener('input', e => {
    gapsSearchTerm = e.target.value;
    renderGaps();
  });

  document.getElementById('gaps-sort').addEventListener('change', e => {
    gapsSort = e.target.value;
    renderGaps();
  });

  document.getElementById('gaps-refresh').addEventListener('click', async () => {
    showLoading();
    try {
      await apiFetch('/api/gaps/refresh', { method: 'POST' });
      setCached('gaps', null);
      gapsData = null;
      expandedArtists.clear();
      await renderGaps();
    } catch (err) {
      showError('Kan gaps niet verversen: ' + err.message);
    }
  });
}

function renderArtistCard(artist) {
  const isExpanded = expandedArtists.has(artist.artistId);
  const gapCount = artist.missing?.length || 0;
  const completeness = Math.round((artist.ownedCount / (artist.ownedCount + gapCount)) * 100);

  let html = `
    <div class="gaps-artist-card" data-artist-id="${artist.artistId}">
      <div class="gaps-artist-header">
        <div class="gaps-artist-info">
          <img src="${proxyImg(artist.thumb)}" class="gaps-artist-photo" alt="">
          <div class="gaps-artist-meta">
            <h3><a href="#" class="artist-link" data-id="${artist.artistId}">${esc(artist.title)}</a></h3>
            <div class="gaps-artist-tags">${countryFlag(artist.country)} ${tagsHtml(artist.genres?.slice(0, 3) || [])}</div>
          </div>
        </div>
        <div class="gaps-artist-actions">
          ${bookmarkBtn(artist.artistId, artist.wishedFor)}
          <button class="gaps-toggle-btn" data-id="${artist.artistId}">
            ${isExpanded ? '▼' : '▶'} ${gapCount} ontbreken
          </button>
        </div>
      </div>
      <div class="gaps-completeness">
        <div class="completeness-bar"><div class="bar-fill" style="width: ${completeness}%"></div></div>
        <span>${artist.ownedCount}/${artist.ownedCount + gapCount} albums</span>
      </div>
  `;

  if (isExpanded && gapCount > 0) {
    html += `<div class="gaps-albums-section">
      <h4>Ontbrekende albums</h4>
      <div class="gaps-albums-grid">
        ${artist.missing.map(album => albumCard(album)).join('')}
      </div>`;

    if (artist.owned?.length > 0) {
      html += `
        <details class="gaps-owned-details">
          <summary>Albums die je al hebt (${artist.owned.length})</summary>
          <div class="gaps-albums-grid">
            ${artist.owned.map(album => albumCard(album)).join('')}
          </div>
        </details>`;
    }
    html += `</div>`;
  }

  html += `</div>`;
  return html;
}

async function renderGaps() {
  const content = document.getElementById('content');

  try {
    if (!gapsData) {
      showLoading();
      gapsData = await getCached('gaps', () => apiFetch('/api/gaps'), 5 * 60 * 1000);

      if (gapsData.status === 'building') {
        content.innerHTML = `<div class="loading-state"><p>Gaps-scanning lopend...</p>${showLoading()}</div>`;
        setTimeout(() => { gapsData = null; renderGaps(); }, 15000);
        return;
      }
    }

    renderToolbar();

    // Filter & sort
    let filtered = gapsData.gaps || [];
    if (gapsSearchTerm) {
      filtered = filtered.filter(g => g.title.toLowerCase().includes(gapsSearchTerm.toLowerCase()));
    }

    if (gapsSort === 'missing') {
      filtered.sort((a, b) => (b.missing?.length || 0) - (a.missing?.length || 0));
    } else {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    }

    // Render
    content.innerHTML = `<div class="gaps-container"></div>`;
    const container = content.querySelector('.gaps-container');

    filtered.forEach(artist => {
      container.innerHTML += renderArtistCard(artist);
    });

    // Event delegation
    container.addEventListener('click', e => {
      if (e.target.classList.contains('gaps-toggle-btn')) {
        e.preventDefault();
        const artistId = parseInt(e.target.dataset.id);
        expandedArtists.has(artistId) ? expandedArtists.delete(artistId) : expandedArtists.add(artistId);
        renderGaps();
      }
      if (e.target.classList.contains('artist-link')) {
        e.preventDefault();
        window.showArtistPanel?.(e.target.dataset.id);
      }
    });

  } catch (err) {
    showError('Kan gaps niet laden: ' + err.message);
  }
}

export async function loadGaps() {
  hideTidarrUI();
  stopTidarrQueuePolling();
  await renderGaps();
}
