// ── Artist Detail View ────────────────────────────────────────────────────────
// Comprehensive artist page with hero, bio, albums, gaps, and similar artists

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
 * Load artist detail view
 * Expects state.viewParams = { name: 'Artist Name' }
 */
export async function loadArtistDetail() {
  showLoading();

  const artistName = state.viewParams?.name;
  if (!artistName) {
    showError('Geen artiest geselecteerd');
    return;
  }

  currentArtist = artistName;

  try {
    // Fetch comprehensive artist data
    const data = await apiFetch(`/api/artist/${encodeURIComponent(artistName)}/full`);
    artistData = data;

    renderArtistDetail(data);
  } catch (err) {
    showError(`Kan artiest niet laden: ${err.message}`);
  }
}

/**
 * Render complete artist detail page
 */
function renderArtistDetail(data) {
  const content = document.getElementById('content');
  const { name, info, wikipedia, similar, gaps } = data;

  // ────────────────────────────────────────────────────────────────────────
  // 1. HERO SECTION
  // ────────────────────────────────────────────────────────────────────────

  // Gebruiken picture_xl als beschikbaar, fallback naar picture_medium
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

  // Back button
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

  // ────────────────────────────────────────────────────────────────────────
  // 2. WIKIPEDIA BIO SECTION
  // ────────────────────────────────────────────────────────────────────────

  let wikiHtml = '';
  if (wikipedia && wikipedia.extract) {
    const paragraphs = wikipedia.extract
      .split('\n')
      .filter(p => p.trim().length > 0)
      .slice(0, 3)
      .map(p => `<p>${esc(p)}</p>`)
      .join('');

    const langBadge = wikipedia.lang ? `<span class="wiki-lang-badge">${wikipedia.lang.toUpperCase()}</span>` : '';

    wikiHtml = `
      <section class="detail-section">
        <div class="section-header">
          <h2>Over deze artiest</h2>
          ${langBadge}
        </div>
        <div class="detail-bio">
          ${paragraphs}
        </div>
        ${wikipedia.url ? `<a href="${esc(wikipedia.url)}" target="_blank" rel="noopener" class="detail-link">Lees meer op Wikipedia →</a>` : ''}
      </section>
    `;
  }

  // ────────────────────────────────────────────────────────────────────────
  // 3. ALBUMS SECTION (albums in je Plex)
  // ────────────────────────────────────────────────────────────────────────

  let albumsHtml = '';
  if (info.albums && info.albums.length > 0) {
    const ownedAlbums = info.albums.filter(a => a.inPlex);
    if (ownedAlbums.length > 0) {
      albumsHtml = `
        <section class="detail-section">
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

  // ────────────────────────────────────────────────────────────────────────
  // 4. GAPS SECTION (missing albums)
  // ────────────────────────────────────────────────────────────────────────

  let gapsHtml = '';
  if (gaps && gaps.missing && gaps.missing.length > 0) {
    const completenessPercent = gaps.completeness ? Math.round(gaps.completeness * 100) : 0;
    const completnessBadge = `<span class="section-badge" title="Discografie compleet">${completenessPercent}%</span>`;

    gapsHtml = `
      <section class="detail-section">
        <div class="section-header">
          <h2>Ontbrekende albums</h2>
          <span class="section-count">${gaps.missing.length}</span>
          ${completnessBadge}
        </div>
        <div class="detail-grid">
          ${gaps.missing.map(g => renderGapCard(name, g)).join('')}
        </div>
      </section>
    `;
  }

  // ────────────────────────────────────────────────────────────────────────
  // 5. SIMILAR ARTISTS SECTION
  // ────────────────────────────────────────────────────────────────────────

  let similarHtml = '';
  if (similar && similar.artists && similar.artists.length > 0) {
    similarHtml = `
      <section class="detail-section">
        <div class="section-header">
          <h2>Vergelijkbare artiesten</h2>
        </div>
        <div class="detail-similar-row">
          ${similar.artists.map(s => `
            <button class="detail-similar-chip" data-artist-detail="${esc(s.name)}">
              ${esc(s.name)}
            </button>
          `).join('')}
        </div>
      </section>
    `;
  }

  // ────────────────────────────────────────────────────────────────────────
  // Render everything
  // ────────────────────────────────────────────────────────────────────────

  content.innerHTML = `
    <article class="detail-page">
      ${heroHtml}
      <div class="detail-content">
        ${wikiHtml}
        ${albumsHtml}
        ${gapsHtml}
        ${similarHtml}
      </div>
    </article>
  `;

  document.title = `Muziek · ${name}`;

  // ────────────────────────────────────────────────────────────────────────
  // Event handlers
  // ────────────────────────────────────────────────────────────────────────

  // Back button
  const backBtn = content.querySelector('.detail-back-btn');
  if (backBtn) {
    backBtn.addEventListener('click', async e => {
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

  // Download buttons (already handled by global event delegation in events.js)

  // Similar artist chips
  content.querySelectorAll('.detail-similar-chip').forEach(chip => {
    chip.addEventListener('click', async e => {
      e.preventDefault();
      const artistName = chip.dataset.artistDetail;
      if (artistName) {
        // Maak de currentArtist als previousView voordat we navigeren
        state.previousView = state.activeView;
        state.viewParams = { name: artistName };
        await loadArtistDetail();
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
