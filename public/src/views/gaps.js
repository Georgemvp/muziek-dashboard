import { apiFetch } from '../api.js';
import { getCached, setCache, invalidate } from '../cache.js';
import {
  esc, fmt, initials, gradientFor, tagsHtml, bookmarkBtn, countryFlag,
  albumCard, showLoading, showError, proxyImg, p, plexBadge, downloadBtn,
  isDownloaded, markDownloaded
} from '../helpers.js';
import { state } from '../state.js';
import { hideTidarrUI, stopTidarrQueuePolling } from './downloads.js';

// Module state
let gapsData = null;
let gapsSort = 'missing';
let gapsSearchTerm = '';
let expandedArtists = new Set();

/**
 * Render a gap album card (missing album from MusicBrainz)
 * Albums from gaps have: { title, image, name, albumType, releaseDate, inPlex }
 */
function renderGapAlbumCard(album, artist = '') {
  const bg = gradientFor(album.title || '');
  const year = album.releaseDate ? album.releaseDate.slice(0, 4) : '—';
  const typeLabel = album.albumType || 'Album';
  const alreadyDl = artist ? isDownloaded(artist, album.title || '') : false;

  const dlHtml = (state.tidarrOk && artist && !album.inPlex)
    ? alreadyDl
      ? `<button class="album-dl-btn download-btn dl-done" data-dlartist="${esc(artist)}" data-dlalbum="${esc(album.title||'')}" title="Al gedownload">✓</button>`
      : `<button class="album-dl-btn download-btn" data-dlartist="${esc(artist)}" data-dlalbum="${esc(album.title||'')}" title="Download via Tidarr">⬇</button>`
    : '';

  const imgUrl = album.image ? proxyImg(album.image, 120) : null;
  const imgHtml = imgUrl
    ? `<img src="${esc(imgUrl)}" alt="${esc(album.title)}" loading="lazy" decoding="async" style="opacity:0;transition:opacity 0.35s;position:relative;z-index:1" onload="this.style.opacity='1'" onerror="this.remove()">`
    : '';

  return `
    <div class="album-card missing" title="${esc(album.title)}${year !== '—' ? ' ('+year+')' : ''}">
      <div class="album-cover" style="background:${bg}">
        <div class="album-cover-ph">${initials(album.title || '?')}</div>
        ${imgHtml}
        ${dlHtml}
      </div>
      <div class="album-info">
        <div class="album-title">${esc(album.title)}</div>
        <div class="album-year">${year} · ${typeLabel}</div>
        <span class="album-status miss">✦ Ontbreekt</span>
      </div>
    </div>`;
}

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
      invalidate('gaps');
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
          ${artist.thumb ? `<img src="${proxyImg(artist.thumb)}" class="gaps-artist-photo" alt="">` : `<div class="gaps-artist-photo" style="background:${gradientFor(artist.title)}"></div>`}
          <div class="gaps-artist-meta">
            <h3><a href="#" class="artist-link" data-artist-detail="${esc(artist.title)}">${esc(artist.title)}</a></h3>
            <div class="gaps-artist-tags">${countryFlag(artist.country)} ${tagsHtml(artist.genres?.slice(0, 3) || [])}</div>
          </div>
        </div>
        <div class="gaps-artist-actions">
          ${bookmarkBtn('artist', artist.title, artist.title, artist.thumb || '')}
          ${state.tidarrOk && gapCount > 0 ? `<button class="gaps-dl-all-btn download-btn" data-dlartist="${esc(artist.title)}" data-dl-all-gaps="true" title="Download alle ${gapCount} ontbrekende albums">⬇ Alles (${gapCount})</button>` : ''}
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
        ${(artist.missing || []).map(album => renderGapAlbumCard(album, artist.title)).join('')}
      </div>`;

    if (artist.owned && artist.owned.length > 0) {
      html += `
        <details class="gaps-owned-details">
          <summary>Albums die je al hebt (${artist.owned?.length || 0})</summary>
          <div class="gaps-albums-grid">
            ${(artist.owned || []).map(album => renderGapAlbumCard(album, artist.title)).join('')}
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
      let d = getCached('gaps', 5 * 60 * 1000);

      // Validate cache format - if old format detected, refresh
      if (d?.gaps && d.gaps.length > 0 && !('artistId' in d.gaps[0])) {
        invalidate('gaps');
        d = null;
      }

      if (!d) {
        d = await apiFetch('/api/gaps');
        setCache('gaps', d);
      }
      gapsData = d;

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
    container.addEventListener('click', async e => {
      // Toggle artiest uitklappen
      if (e.target.classList.contains('gaps-toggle-btn')) {
        e.preventDefault();
        const artistId = e.target.dataset.id;
        expandedArtists.has(artistId) ? expandedArtists.delete(artistId) : expandedArtists.add(artistId);
        renderGaps();
        return;
      }

      // Bulk-download alle ontbrekende albums van een artiest
      if (e.target.dataset.dlAllGaps) {
        e.stopPropagation();
        const artistName = e.target.dataset.dlartist;
        const artist = gapsData.gaps.find(g => g.title === artistName);
        if (!artist || !artist.missing?.length) return;

        const missing = artist.missing.filter(a => !a.inPlex);
        if (!missing.length) return;

        if (!confirm(`Download ${missing.length} ontbrekende album${missing.length !== 1 ? 's' : ''} van ${artistName}?`)) return;

        const btn = e.target;
        btn.disabled = true;
        btn.textContent = 'Bezig…';

        try {
          const { triggerTidarrDownload } = await import('./downloads.js');
          for (const album of missing) {
            await triggerTidarrDownload(artistName, album.title, null);
          }
          btn.textContent = '✓ Klaar';
        } catch (err) {
          btn.textContent = '⚠ Fout';
          btn.disabled = false;
          console.error('Bulk download mislukt:', err);
        }
        return;
      }
      // Artist links now use global event delegation in events.js via data-artist-detail attribute
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
