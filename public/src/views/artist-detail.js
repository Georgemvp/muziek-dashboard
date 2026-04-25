// ── Artist Detail View ────────────────────────────────────────────────────────
// Comprehensive artist page with progressive loading for hero, bio, albums, gaps, and similar artists

import { state } from '../state.js';
import { apiFetch } from '../api.js';
import {
  esc, fmt, initials, gradientFor, tagsHtml, bookmarkBtn, countryFlag,
  albumCard, showLoading, showError, proxyImg, p, downloadBtn
} from '../helpers.js';
import { playOnZone } from '../components/plexRemote.js';
import { switchView } from '../router.js';

// ═══════════════════════════════════════════════════════════════════════════
// Module state
// ═══════════════════════════════════════════════════════════════════════════

let currentArtist = null;
let artistData = null;

/**
 * Load artist detail view - PROGRESSIVE LOADING VERSION
 * Expects state.viewParams = { name: 'Artist Name' }
 */
export async function loadArtistDetail() {
  const artistName = state.viewParams?.name;
  if (!artistName) {
    showError('Geen artiest geselecteerd');
    return;
  }

  currentArtist = artistName;

  // ── STAP 1: Laad snel /api/artist/:name/info en render hero + albums ────
  try {
    const info = await apiFetch(`/api/artist/${encodeURIComponent(artistName)}/info`);

    // Render hero + albums direct (niet showLoading() die hele pagina blokkeert)
    renderHeroAndAlbums(artistName, info);

    // ── STAP 2: Laad daarna parallel andere secties zonder blocking ──────────
    // Wikipedia, similar artists, gaps, top tracks
    loadAdditionalSections(artistName, info);

  } catch (err) {
    showError(`Kan artiest niet laden: ${err.message}`);
  }
}

/**
 * Render hero section + owned albums direct (fast path)
 */
function renderHeroAndAlbums(name, info) {
  const content = document.getElementById('content');

  // Build hero HTML
  const heroImg = proxyImg(info.imageXl || info.image, 600) || (info.imageXl || info.image);
  const heroBg = heroImg
    ? `background-image: url('${esc(heroImg)}'); background-size: cover; background-position: center;`
    : `background: ${gradientFor(name)};`;

  const metaItems = [];
  if (info.country) {
    metaItems.push(`${countryFlag(info.country)} ${esc(info.country)}`);
  }
  if (info.startYear) {
    metaItems.push(`Actief sinds ${info.startYear}`);
  }
  if (state.plexOk && info.inPlex) {
    metaItems.push('▶ In je Plex bibliotheek');
  }
  const metaHtml = metaItems.length > 0 ? `<div class="detail-meta">${metaItems.join(' · ')}</div>` : '';

  let tagHtml = '';
  if (info.tags && info.tags.length > 0) {
    tagHtml = `<div class="detail-tags">${tagsHtml(info.tags, 8)}</div>`;
  }

  const backBtn = state.previousView ? `
    <button class="detail-back-btn" data-previous-view="${esc(state.previousView)}" title="Terug">
      ← Terug
    </button>
  ` : '';

  const heroHtml = `
    <div class="detail-hero" style="${heroBg}">
      <div class="detail-hero-overlay"></div>
      ${backBtn}
      <div class="detail-hero-content">
        <h1 class="detail-artist-name">${esc(name)}</h1>
        ${metaHtml}
        ${tagHtml}
        <div class="detail-hero-actions">
          ${bookmarkBtn('artist', name, '', info.image || '')}
        </div>
      </div>
    </div>
  `;

  // Build albums section
  let albumsHtml = '';
  if (info.albums && info.albums.length > 0) {
    const ownedAlbums = info.albums.filter(a => a.inPlex);
    if (ownedAlbums.length > 0) {
      albumsHtml = `
        <section class="detail-section" id="section-albums">
          <div class="section-header">
            <h2>Albums die je hebt</h2>
            <span class="section-count">${ownedAlbums.length}</span>
          </div>
          <div class="detail-grid">
            ${ownedAlbums.map(a => renderAlbumCard(name, a)).join('')}
          </div>
        </section>
      `;
    }
  }

  // Render initial page structure
  content.innerHTML = `
    <article class="detail-page">
      ${heroHtml}
      <div class="detail-content">
        ${albumsHtml}

        <!-- Loading placeholders for sections to be filled later -->
        <section class="detail-section" id="section-wikipedia">
          <div class="section-loading">Biografie laden...</div>
        </section>
        <section class="detail-section" id="section-tracks">
          <div class="section-loading">Populaire nummers laden...</div>
        </section>
        <section class="detail-section" id="section-gaps">
          <div class="section-loading">Ontbrekende albums scannen...</div>
        </section>
        <section class="detail-section" id="section-similar">
          <div class="section-loading">Vergelijkbare artiesten laden...</div>
        </section>
      </div>
    </article>
  `;

  document.title = `Muziek · ${name}`;

  // ── Register event handlers on hero ────────────────────────────────────
  setupEventHandlers();
}

/**
 * Load additional sections in parallel and update DOM as they arrive
 */
async function loadAdditionalSections(artistName, info) {
  // Load all sections in parallel
  const [wikipediaData, similarData, gapsData, tracksData] = await Promise.allSettled([
    apiFetch(`/api/artist/${encodeURIComponent(artistName)}/wikipedia`).catch(() => null),
    apiFetch(`/api/artist/${encodeURIComponent(artistName)}/similar`).catch(() => null),
    apiFetch(`/api/gaps/${encodeURIComponent(artistName)}`).catch(() => null),
    apiFetch(`/api/artist/${encodeURIComponent(artistName)}/tracks`).catch(() => null),
  ]);

  // ── Update sections as data arrives (but check view is still active) ────

  // Wikipedia section
  if (state.activeView === 'artist-detail' && currentArtist === artistName) {
    const wikiData = wikipediaData.status === 'fulfilled' ? wikipediaData.value : null;
    if (wikiData) {
      renderWikipediaSection(wikiData);
    } else {
      document.getElementById('section-wikipedia').innerHTML = '';
    }
  }

  // Top tracks section
  if (state.activeView === 'artist-detail' && currentArtist === artistName) {
    const tracksData_ = tracksData.status === 'fulfilled' ? tracksData.value : null;
    if (tracksData_ && Array.isArray(tracksData_) && tracksData_.length > 0) {
      renderTracksSection(artistName, tracksData_);
    } else {
      document.getElementById('section-tracks').innerHTML = '';
    }
  }

  // Gaps section
  if (state.activeView === 'artist-detail' && currentArtist === artistName) {
    const gapsData_ = gapsData.status === 'fulfilled' ? gapsData.value : null;
    if (gapsData_ && gapsData_.missing && gapsData_.missing.length > 0) {
      renderGapsSection(artistName, gapsData_);
    } else {
      document.getElementById('section-gaps').innerHTML = '';
    }
  }

  // Similar artists section
  if (state.activeView === 'artist-detail' && currentArtist === artistName) {
    const similarData_ = similarData.status === 'fulfilled' ? similarData.value : null;
    if (similarData_ && (similarData_.similar || similarData_.artists)) {
      const artists = similarData_.similar || similarData_.artists || [];
      if (artists.length > 0) {
        renderSimilarSection(artists);
      } else {
        document.getElementById('section-similar').innerHTML = '';
      }
    } else {
      document.getElementById('section-similar').innerHTML = '';
    }
  }
}

/**
 * Render Wikipedia bio section
 */
function renderWikipediaSection(wikiData) {
  const sectionEl = document.getElementById('section-wikipedia');
  if (!wikiData || !wikiData.extract) {
    sectionEl.innerHTML = '';
    return;
  }

  const paragraphs = wikiData.extract
    .split('\n')
    .filter(p => p.trim().length > 0)
    .slice(0, 3)
    .map(p => `<p>${esc(p)}</p>`)
    .join('');

  const langBadge = wikiData.lang ? `<span class="wiki-lang-badge">${wikiData.lang.toUpperCase()}</span>` : '';

  sectionEl.innerHTML = `
    <div class="section-header">
      <h2>Over deze artiest</h2>
      ${langBadge}
    </div>
    <div class="detail-bio">
      ${paragraphs}
    </div>
    ${wikiData.url ? `<a href="${esc(wikiData.url)}" target="_blank" rel="noopener" class="detail-link">Lees meer op Wikipedia →</a>` : ''}
  `;
}

/**
 * Render top tracks section
 */
function renderTracksSection(artistName, tracks) {
  const sectionEl = document.getElementById('section-tracks');
  if (!tracks || tracks.length === 0) {
    sectionEl.innerHTML = '';
    return;
  }

  sectionEl.innerHTML = `
    <div class="section-header">
      <h2>Populairste nummers</h2>
      <span class="section-count">${tracks.length}</span>
    </div>
    <div class="detail-tracks-list">
      ${tracks.map((t, idx) => renderTrackRow(artistName, t, idx + 1)).join('')}
    </div>
  `;
}

/**
 * Render gaps (missing albums) section
 */
function renderGapsSection(artistName, gapsData) {
  const sectionEl = document.getElementById('section-gaps');
  if (!gapsData || !gapsData.missing || gapsData.missing.length === 0) {
    sectionEl.innerHTML = '';
    return;
  }

  const completeness = gapsData.completeness || 0;
  const completnessBadge = `<span class="section-badge" title="Discografie compleet">${completeness}%</span>`;

  sectionEl.innerHTML = `
    <div class="section-header">
      <h2>Ontbrekende albums</h2>
      <span class="section-count">${gapsData.missing.length}</span>
      ${completnessBadge}
    </div>
    <div class="detail-grid">
      ${gapsData.missing.map(g => renderGapCard(artistName, g)).join('')}
    </div>
  `;
}

/**
 * Render similar artists section
 */
function renderSimilarSection(artists) {
  const sectionEl = document.getElementById('section-similar');
  if (!artists || artists.length === 0) {
    sectionEl.innerHTML = '';
    return;
  }

  sectionEl.innerHTML = `
    <div class="section-header">
      <h2>Vergelijkbare artiesten</h2>
    </div>
    <div class="detail-similar-row">
      ${artists.map(s => `
        <button class="detail-similar-chip" data-artist-detail="${esc(s.name)}">
          ${esc(s.name)}
        </button>
      `).join('')}
    </div>
  `;

  // Setup event handlers for similar artist chips
  document.querySelectorAll('.detail-similar-chip').forEach(chip => {
    chip.addEventListener('click', async e => {
      e.preventDefault();
      const artistName = chip.dataset.artistDetail;
      if (artistName) {
        state.previousView = state.activeView;
        state.viewParams = { name: artistName };
        await loadArtistDetail();
      }
    });
  });
}

/**
 * Setup general event handlers (back button, play buttons, etc.)
 */
function setupEventHandlers() {
  const content = document.getElementById('content');

  // Back button
  const backBtnEl = content.querySelector('.detail-back-btn');
  if (backBtnEl) {
    backBtnEl.addEventListener('click', async e => {
      e.preventDefault();
      const prevView = state.previousView || 'home';
      await switchView(prevView);
    });
  }

  // Play album buttons
  content.querySelectorAll('.detail-album-play-btn').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.stopPropagation();
      const ratingKey = btn.dataset.ratingKey;
      if (ratingKey) {
        btn.disabled = true;
        const origText = btn.textContent;
        btn.textContent = '…';
        const ok = await playOnZone(ratingKey, 'music');
        btn.disabled = false;
        btn.textContent = ok ? '▶ Speelt af' : origText;
        if (ok) setTimeout(() => { btn.textContent = origText; }, 3000);
      }
    });
  });
}

/**
 * Render an album card (from artist's Plex albums)
 */
function renderAlbumCard(artistName, album) {
  const img = proxyImg(album.image, 120) || album.image;
  const imgEl = img
    ? `<img src="${esc(img)}" alt="${esc(album.name)}" loading="lazy" decoding="async">`
    : `<div class="album-ph">♪</div>`;

  const playBtn = state.plexOk && album.inPlex && album.ratingKey
    ? `<button class="detail-album-play-btn" data-rating-key="${esc(album.ratingKey)}" title="Speel af op Plex">▶</button>`
    : '';

  const pcHtml = album.playcount > 0
    ? `<div class="album-playcount" title="${album.playcount} keer beluisterd">${fmt(album.playcount)} × ♪</div>`
    : '';

  return `
    <div class="album-card">
      <div class="album-cover">
        ${imgEl}
        ${playBtn}
      </div>
      <div class="album-info">
        <div class="album-name">${esc(album.name)}</div>
        ${pcHtml}
        ${downloadBtn(artistName, album.name, album.inPlex)}
      </div>
    </div>
  `;
}

/**
 * Render a gap card (missing album)
 */
function renderGapCard(artistName, gap) {
  const img = proxyImg(gap.image, 120) || gap.image;
  const imgEl = img
    ? `<img src="${esc(img)}" alt="${esc(gap.name)}" loading="lazy" decoding="async">`
    : `<div class="album-ph">♪</div>`;

  const typeLabel = gap.albumType || 'Album';
  const yearHtml = gap.releaseDate ? `<div class="album-year">${gap.releaseDate.slice(0, 4)}</div>` : '';

  // Download button via Tidarr
  const dlBtn = gap.url
    ? `<button class="tidal-dl-btn" data-dlurl="${esc(gap.url)}" title="Download via Tidarr">⬇</button>`
    : '';

  return `
    <div class="album-card">
      <div class="album-cover">
        ${imgEl}
        ${dlBtn}
      </div>
      <div class="album-info">
        <div class="album-name">${esc(gap.name)}</div>
        <div class="album-meta">${typeLabel} ${yearHtml.trim()}</div>
      </div>
    </div>
  `;
}

/**
 * Render a track row in the top tracks list
 */
function renderTrackRow(artistName, track, position) {
  const playcountHtml = track.playcount > 0
    ? `<span class="track-playcount" title="${track.playcount} keer beluisterd">${fmt(track.playcount)} × ♪</span>`
    : '';

  const playBtn = `
    <button class="track-play-btn" data-artist="${esc(artistName)}" data-track="${esc(track.name)}" title="Speel voorbeeld af">
      ▶
    </button>
  `;

  return `
    <div class="track-row">
      <div class="track-rank">${position}</div>
      <div class="track-info">
        <div class="track-name">${esc(track.name)}</div>
        ${playcountHtml}
      </div>
      <div class="track-actions">
        ${playBtn}
      </div>
    </div>
  `;
}
