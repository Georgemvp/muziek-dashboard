import { apiFetch } from '../api.js';
import { getCached, setCache, invalidate } from '../cache.js';
import {
  esc, initials, gradientFor, tagsHtml, bookmarkBtn, countryFlag,
  showLoading, showError, proxyImg, isDownloaded
} from '../helpers.js';
import { state } from '../state.js';
import { hideTidarrUI, stopTidarrQueuePolling } from './downloads.js';

let gapsData = null;
let gapsSort = 'missing';
let gapsSearchTerm = '';
let expandedArtists = new Set();

function computeStats(gaps) {
  let totalMissing = 0, totalOwned = 0, maxMissing = -1, maxPct = -1;
  let mostMissing = null, mostComplete = null;
  for (const a of gaps) {
    const m = a.missing?.length || 0;
    const o = a.ownedCount || 0;
    const tot = m + o;
    totalMissing += m;
    totalOwned += o;
    if (m > maxMissing) { maxMissing = m; mostMissing = a.title; }
    const pct = tot ? o / tot : 0;
    if (pct > maxPct) { maxPct = pct; mostComplete = a.title; }
  }
  const grand = totalMissing + totalOwned;
  return {
    totalMissing,
    completePct: grand ? Math.round((totalOwned / grand) * 100) : 100,
    mostMissing,
    mostComplete
  };
}

function renderHero(gaps) {
  const { totalMissing, completePct, mostMissing, mostComplete } = computeStats(gaps);
  return `
    <div class="gaps-hero">
      <div class="gaps-hero-stats">
        <div class="gaps-hero-stat">
          <span class="gaps-hero-num">${totalMissing}</span>
          <span class="gaps-hero-label">ontbrekende albums</span>
        </div>
        <div class="gaps-hero-stat">
          <span class="gaps-hero-num">${gaps.length}</span>
          <span class="gaps-hero-label">artiesten</span>
        </div>
      </div>
      <div class="gaps-hero-progress">
        <div class="gaps-hero-bar">
          <div class="gaps-hero-bar-fill" style="width:${completePct}%"></div>
        </div>
        <span class="gaps-hero-pct">${completePct}% van je collectie compleet</span>
      </div>
      <div class="gaps-hero-qs">
        ${mostMissing ? `<span class="gaps-hero-qs-item">Meeste gaps: <strong>${esc(mostMissing)}</strong></span>` : ''}
        ${mostComplete ? `<span class="gaps-hero-qs-item">Meest compleet: <strong>${esc(mostComplete)}</strong></span>` : ''}
      </div>
    </div>`;
}

function renderAlbumCard(album, artistName) {
  const bg = gradientFor(album.title || '');
  const year = album.releaseDate ? album.releaseDate.slice(0, 4) : '—';
  const typeLabel = album.albumType || 'Album';
  const alreadyDl = artistName ? isDownloaded(artistName, album.title || '') : false;
  const canDownload = (state.tidarrOk || state.orpheusConnected) && !album.inPlex;

  const imgUrl = album.image ? proxyImg(album.image, 160) : null;
  const statusBadge = album.inPlex
    ? `<span class="gaps-album-badge own">✓ In Plex</span>`
    : `<span class="gaps-album-badge miss">✦ Ontbreekt</span>`;

  const dlBtn = canDownload && artistName
    ? alreadyDl
      ? `<button class="gaps-album-dl dl-done" data-dlartist="${esc(artistName)}" data-dlalbum="${esc(album.title || '')}" title="Al gedownload">✓</button>`
      : `<button class="gaps-album-dl download-btn" data-dlartist="${esc(artistName)}" data-dlalbum="${esc(album.title || '')}" title="Download">⬇</button>`
    : '';

  return `
    <div class="gaps-album-card${album.inPlex ? ' is-owned' : ''}">
      <div class="gaps-album-cover" style="background:${bg}">
        <div class="gaps-album-ph">${initials(album.title || '?')}</div>
        ${imgUrl ? `<img src="${esc(imgUrl)}" alt="" loading="lazy" decoding="async" onload="this.style.opacity='1'" onerror="this.remove()" style="opacity:0;transition:opacity 0.3s">` : ''}
        ${dlBtn}
      </div>
      <div class="gaps-album-info">
        <div class="gaps-album-title" title="${esc(album.title)}">${esc(album.title)}</div>
        <div class="gaps-album-year">${year} · <span class="gaps-type-badge">${esc(typeLabel)}</span></div>
        ${statusBadge}
      </div>
    </div>`;
}

function renderArtistRow(artist) {
  const missing = artist.missing || [];
  const owned = artist.owned || [];
  const gapCount = missing.length;
  const total = artist.totalCount || (gapCount + (artist.ownedCount || 0));
  const ownedCount = artist.ownedCount || 0;
  const completePct = total ? Math.round((ownedCount / total) * 100) : 100;
  const isExpanded = expandedArtists.has(artist.artistId);
  const canDownload = (state.tidarrOk || state.orpheusConnected) && gapCount > 0;

  const photoHtml = artist.thumb
    ? `<img src="${esc(proxyImg(artist.thumb, 80))}" class="gaps-row-photo" alt="" loading="lazy" decoding="async" onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">`
    : '';
  const photoPh = `<div class="gaps-row-photo-ph" style="background:${gradientFor(artist.title)};${artist.thumb ? 'display:none' : ''}">${initials(artist.title)}</div>`;

  return `
    <div class="gaps-row${isExpanded ? ' expanded' : ''}" data-id="${esc(artist.artistId)}">
      <div class="gaps-row-header">
        <div class="gaps-row-left">
          ${photoHtml}${photoPh}
          <div class="gaps-row-meta">
            <div class="gaps-row-name">
              <a href="#" class="artist-link" data-artist-detail="${esc(artist.title)}">${esc(artist.title)}</a>
              ${countryFlag(artist.country)}
            </div>
            <div class="gaps-row-tags">${tagsHtml(artist.genres?.slice(0, 3) || [])}</div>
          </div>
        </div>
        <div class="gaps-row-center">
          <div class="gaps-row-bar"><div class="gaps-row-bar-fill" style="width:${completePct}%"></div></div>
          <span class="gaps-row-pct">${ownedCount}/${total}</span>
        </div>
        <div class="gaps-row-right">
          ${bookmarkBtn('artist', artist.title, artist.title, artist.thumb || '')}
          ${canDownload ? `<button class="gaps-dl-all download-btn" data-dlartist="${esc(artist.title)}" data-dl-all-gaps="true" title="Download alle ${gapCount} ontbrekende albums">⬇ ${gapCount}</button>` : ''}
          <button class="gaps-row-toggle" data-id="${esc(artist.artistId)}">${isExpanded ? '▼' : '▶'} <span>${gapCount} ontbreken</span></button>
        </div>
      </div>
      <div class="gaps-row-body">
        <div class="gaps-row-body-inner">
          ${gapCount > 0 ? `
            <div class="gaps-section-label">Ontbrekende albums</div>
            <div class="gaps-album-grid">
              ${missing.map(a => renderAlbumCard(a, artist.title)).join('')}
            </div>` : ''}
          ${owned.length > 0 ? `
            <details class="gaps-owned-details">
              <summary>Al in collectie (${owned.length})</summary>
              <div class="gaps-album-grid gaps-album-grid--owned">
                ${owned.map(a => renderAlbumCard(a, artist.title)).join('')}
              </div>
            </details>` : ''}
        </div>
      </div>
    </div>`;
}

function sortedFiltered() {
  let list = gapsData?.gaps || [];
  if (gapsSearchTerm) {
    const q = gapsSearchTerm.toLowerCase();
    list = list.filter(g => g.title.toLowerCase().includes(q));
  }
  if (gapsSort === 'missing') {
    list = [...list].sort((a, b) => (b.missing?.length || 0) - (a.missing?.length || 0));
  } else if (gapsSort === 'name') {
    list = [...list].sort((a, b) => a.title.localeCompare(b.title));
  } else if (gapsSort === 'complete') {
    list = [...list].sort((a, b) => {
      const pa = a.totalCount ? a.ownedCount / a.totalCount : 0;
      const pb = b.totalCount ? b.ownedCount / b.totalCount : 0;
      return pb - pa;
    });
  } else if (gapsSort === 'least') {
    list = [...list].sort((a, b) => {
      const pa = a.totalCount ? a.ownedCount / a.totalCount : 0;
      const pb = b.totalCount ? b.ownedCount / b.totalCount : 0;
      return pa - pb;
    });
  }
  return list;
}

function renderContent() {
  const content = document.getElementById('content');
  const filtered = sortedFiltered();

  const badge = document.getElementById('gaps-badge');
  if (badge) {
    const total = filtered.reduce((s, a) => s + (a.missing?.length || 0), 0);
    badge.textContent = `${total} gaps · ${filtered.length} artiesten`;
  }

  content.innerHTML =
    renderHero(filtered) +
    `<div class="gaps-list">${filtered.map(renderArtistRow).join('')}</div>`;

  attachListEvents(content.querySelector('.gaps-list'));
}

function renderToolbar() {
  const toolbar = document.getElementById('view-toolbar');
  if (!toolbar) return;
  toolbar.innerHTML = `
    <div class="toolbar-group">
      <input type="text" id="gaps-search" placeholder="Filter artiesten…" class="toolbar-input" value="${esc(gapsSearchTerm)}">
      <select id="gaps-sort" class="toolbar-select">
        <option value="missing">Meeste ontbrekend</option>
        <option value="least">Minst compleet</option>
        <option value="name">Naam A-Z</option>
        <option value="complete">Meest compleet</option>
      </select>
      <button id="gaps-refresh" class="toolbar-btn">↻ Vernieuwen</button>
    </div>
    <span class="toolbar-badge" id="gaps-badge"></span>`;

  toolbar.querySelector('#gaps-sort').value = gapsSort;

  toolbar.querySelector('#gaps-search').addEventListener('input', e => {
    gapsSearchTerm = e.target.value;
    renderContent();
  });
  toolbar.querySelector('#gaps-sort').addEventListener('change', e => {
    gapsSort = e.target.value;
    renderContent();
  });
  toolbar.querySelector('#gaps-refresh').addEventListener('click', async () => {
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

function attachListEvents(list) {
  if (!list) return;
  list.addEventListener('click', async e => {
    // Toggle expand/collapse
    const toggleBtn = e.target.closest('.gaps-row-toggle');
    if (toggleBtn) {
      e.preventDefault();
      const id = toggleBtn.dataset.id;
      const row = list.querySelector(`.gaps-row[data-id="${id}"]`);
      if (!row) return;
      const expanded = row.classList.toggle('expanded');
      const span = toggleBtn.querySelector('span');
      toggleBtn.firstChild.textContent = expanded ? '▼ ' : '▶ ';
      expanded ? expandedArtists.add(id) : expandedArtists.delete(id);
      return;
    }

    // Bulk download all missing albums
    const dlAllBtn = e.target.closest('[data-dl-all-gaps]');
    if (dlAllBtn) {
      e.stopPropagation();
      const artistName = dlAllBtn.dataset.dlartist;
      const artist = gapsData.gaps.find(g => g.title === artistName);
      if (!artist?.missing?.length) return;
      const missing = artist.missing.filter(a => !a.inPlex);
      if (!missing.length) return;
      if (!confirm(`Download ${missing.length} ontbrekende album${missing.length !== 1 ? 's' : ''} van ${artistName}?`)) return;
      dlAllBtn.disabled = true;
      dlAllBtn.textContent = 'Bezig…';
      try {
        const dl = await import('./downloads.js');
        for (const album of missing) {
          if (state.downloadEngine === 'orpheus') {
            await dl.triggerOrpheusDownload(artistName, album.title, null);
          } else {
            await dl.triggerTidarrDownload(artistName, album.title, null);
          }
        }
        dlAllBtn.textContent = '✓ Klaar';
      } catch (err) {
        dlAllBtn.textContent = '⚠ Fout';
        dlAllBtn.disabled = false;
        console.error('Bulk download mislukt:', err);
      }
    }
  });
}

async function renderGaps() {
  const content = document.getElementById('content');
  try {
    if (!gapsData) {
      showLoading();
      let d = getCached('gaps', 5 * 60 * 1000);
      if (d?.gaps?.length > 0 && !('artistId' in d.gaps[0])) {
        invalidate('gaps');
        d = null;
      }
      if (!d) {
        d = await apiFetch('/api/gaps');
        setCache('gaps', d);
      }
      gapsData = d;

      if (gapsData.status === 'building') {
        content.innerHTML = `<div class="loading-state"><p>Gaps-scanning lopend…</p></div>`;
        setTimeout(() => { gapsData = null; renderGaps(); }, 15000);
        return;
      }
    }

    renderToolbar();
    renderContent();
  } catch (err) {
    showError('Kan gaps niet laden: ' + err.message);
  }
}

export async function loadGaps() {
  hideTidarrUI();
  stopTidarrQueuePolling();
  await renderGaps();
}
