// ── Tab: Ontdek ───────────────────────────────────────────────────────────
import { state } from '../state.js';
import { apiFetch, fetchOnce } from '../api.js';
import { getCached, setCache, invalidate } from '../cache.js';
import {
  esc, fmt, initials, gradientFor, tagsHtml, plexBadge, bookmarkBtn,
  downloadBtn, countryFlag, albumCard, showLoading, setContent, showError,
  setupLazyLoad, runWithSection, contentEl, proxyImg, p
} from '../helpers.js';
import { hideTidarrUI, stopTidarrQueuePolling } from './downloads.js';
import { updateNavBadge } from '../components/sidebar.js';
import { skeletonGrid } from '../modules/skeleton.js';

// ────────────────────────────────────────────────────────────────────────────
// MODULE STATE
// ────────────────────────────────────────────────────────────────────────────
let ontdekCurrentTab = localStorage.getItem('ontdekTab') || 'discover';
let verkennerData    = {};   // cache per sectie: undiscovered, genres_new, labels, deep_cuts, genre_explorer
let genreModalOpen   = false;
let recsData = null;
let releasesData = null;
let discoverData = null;
let _discoverCache = null; // { data: discObj, at: timestamp }
const DISCOVER_CACHE_TTL = 5 * 60 * 1000;
let recsFilter = 'all';
let releasesFilter = 'all';
let releasesSort = 'date';
let discFilter = 'all';
let discSearchTerm = '';
let discExpandedCards = new Set();

// ────────────────────────────────────────────────────────────────────────────
// SPOTIFY SUPPORT
// ────────────────────────────────────────────────────────────────────────────
export async function checkSpotifyStatus() {
  try {
    const data = await apiFetch('/api/spotify/status');
    state.spotifyEnabled = !!data.enabled;
  } catch { state.spotifyEnabled = false; }
}

export function spotifyCard(t, idx) {
  const imgEl = t.image
    ? `<img src="${esc(t.image)}" alt="${esc(t.name)} by ${esc(t.artist)}" loading="lazy" decoding="async"
         onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
       <div class="spotify-cover-ph" style="display:none">♪</div>`
    : `<div class="spotify-cover-ph">♪</div>`;
  const playBtn = t.preview_url
    ? `<button class="spotify-play-btn" data-spotify-preview="${esc(t.preview_url)}"
         data-artist="${esc(t.artist)}" data-track="${esc(t.name)}"
         id="spbtn-${idx}" title="Luister preview">▶</button>` : '';
  const spotifyLink = t.spotify_url
    ? `<a class="spotify-link-btn" href="${esc(t.spotify_url)}" target="_blank" rel="noopener">♫ Open in Spotify</a>` : '';
  return `<div class="spotify-card">
      <div class="spotify-cover">${imgEl}${playBtn}
        <div class="play-bar" style="position:absolute;bottom:0;left:0;width:100%;height:3px;background:rgba(0,0,0,0.3)">
          <div class="play-bar-fill" id="spbar-${idx}"></div></div></div>
      <div class="spotify-info">
        <div class="spotify-track" title="${esc(t.name)}">${esc(t.name)}</div>
        <div class="spotify-artist artist-link" data-artist="${esc(t.artist)}">${esc(t.artist)}</div>
        <div class="spotify-album" title="${esc(t.album)}">${esc(t.album)}</div>${spotifyLink}</div></div>`;
}

export async function loadSpotifyRecs(mood) {
  const section = document.getElementById('spotify-recs-section');
  if (!section) return;
  const moodLabels = {
    energiek: '⚡ Energiek', chill: '🌊 Chill',
    melancholisch: '🌧 Melancholisch', experimenteel: '🔬 Experimenteel', feest: '🎉 Feest'
  };
  section.innerHTML = `<div class="loading"><div class="spinner"></div>Spotify laden…</div>`;
  try {
    const spotifyCacheKey = `spotify:${mood}`;
    let tracks = getCached(spotifyCacheKey, 5 * 60 * 1000);
    if (!tracks) {
      tracks = await apiFetch(`/api/spotify/recs?mood=${encodeURIComponent(mood)}`);
      setCache(spotifyCacheKey, tracks);
    }
    if (!tracks.length) { section.innerHTML = `<div class="empty">Geen Spotify-aanbevelingen gevonden.</div>`; return; }
    let html = `<div class="spotify-section-title">🎯 Spotify aanbevelingen · ${esc(moodLabels[mood] || mood)}</div><div class="spotify-grid">`;
    tracks.forEach((t, i) => { html += spotifyCard(t, i); });
    section.innerHTML = html + '</div>';
  } catch { section.innerHTML = ''; }
}

export function clearSpotifyRecs() {
  const section = document.getElementById('spotify-recs-section');
  if (section) section.innerHTML = '';
}

// Spotify play-preview delegation
document.addEventListener('click', e => {
  const spBtn = e.target.closest('.spotify-play-btn');
  if (!spBtn) return;
  const ps = state.playerState;
  if (!ps) return;
  e.stopPropagation();
  const previewUrl = spBtn.dataset.spotifyPreview;
  if (!previewUrl) return;
  if (ps.previewBtn === spBtn) {
    if (ps.previewAudio.paused) {
      ps.previewAudio.play(); spBtn.textContent = '⏸'; spBtn.classList.add('playing');
    } else {
      ps.previewAudio.pause(); spBtn.textContent = '▶'; spBtn.classList.remove('playing');
    }
    return;
  }
  if (ps.previewBtn) {
    ps.previewAudio.pause();
    ps.previewBtn.textContent = '▶';
    ps.previewBtn.classList.remove('playing');
    const oldFill = ps.previewBtn.closest('.spotify-card')?.querySelector('.play-bar-fill')
      || ps.previewBtn.closest('.card')?.querySelector('.play-bar-fill');
    if (oldFill) oldFill.style.width = '0%';
  }
  ps.previewBtn = spBtn;
  ps.previewAudio.src = previewUrl;
  ps.previewAudio.currentTime = 0;
  ps.previewAudio.play().then(() => {
    spBtn.textContent = '⏸'; spBtn.classList.add('playing');
  }).catch(() => { spBtn.textContent = '▶'; ps.previewBtn = null; });
}, true);

// ────────────────────────────────────────────────────────────────────────────
// TAB SWITCHING
// ────────────────────────────────────────────────────────────────────────────
async function ontdekSwitchTab(tabKey) {
  ontdekCurrentTab = tabKey;
  localStorage.setItem('ontdekTab', tabKey);

  // Update tab bar
  document.querySelectorAll('.ontdek-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabKey);
  });

  // Clear content & scroll
  contentEl.style.opacity = '0';
  contentEl.style.transform = 'translateY(10px)';
  setTimeout(() => {
    window.scrollTo(0, 0);
    contentEl.style.opacity = '1';
    contentEl.style.transform = '';
  }, 0);

  // Load tab data
  if (tabKey === 'recs') {
    await renderRecsTab();
  } else if (tabKey === 'releases') {
    await renderReleasesTab();
  } else if (tabKey === 'discover') {
    await renderDiscoverTab();
  } else if (tabKey === 'verkenner') {
    await renderVerkennerTab();
  }
}

// ────────────────────────────────────────────────────────────────────────────
// RECS TAB
// ────────────────────────────────────────────────────────────────────────────
function applyRecsFilter() {
  document.querySelectorAll('.rec-card[data-inplex]').forEach(card => {
    const inPlex = card.dataset.inplex === 'true';
    let show = true;
    if (recsFilter === 'new')  show = !inPlex;
    if (recsFilter === 'plex') show = inPlex;
    card.classList.toggle('hidden', !show);
  });
}

async function renderRecsTab() {
  setContent(skeletonGrid(4, 2));
  try {
    if (!recsData) {
      let d = getCached('recs', 5 * 60 * 1000);
      if (!d) {
        d = await fetchOnce('/api/recs');
        setCache('recs', d);
      }
      recsData = d;
      state.plexOk = d.plexConnected || state.plexOk;
      state.lastRecs = d;
      if (d.plexConnected && d.plexArtistCount) {
        const dot = document.getElementById('plex-dot');
        if (dot) dot.classList.add('connected');
      }
    }

    const { recommendations: recs = [], albumRecs = [], trackRecs = [] } = recsData;
    if (!recs.length) { setContent('<div class="empty">Geen aanbevelingen gevonden.</div>'); return; }

    const newC = recs.filter(r => !r.inPlex).length;
    const plexC = recs.filter(r => r.inPlex).length;
    let html = `<div class="spotify-section" id="spotify-recs-section"></div>
      <div class="section-title">Gebaseerd op jouw smaak: ${(recsData.basedOn||[]).slice(0,3).join(', ')}
      ${state.plexOk ? ` &nbsp;·&nbsp; <span style="color:var(--new)">${newC} nieuw</span> · <span style="color:var(--plex)">${plexC} in Plex</span>` : ''}</div>
      <div class="rec-grid">`;

    recs.forEach((r, i) => {
      const pct = Math.round(r.match * 100);
      html += `<div class="rec-card" data-inplex="${r.inPlex}" id="rc-${i}">
        <div class="rec-photo artist-link" id="rph-${i}" data-artist="${esc(r.name)}" title="${esc(r.name)} openen" style="cursor:pointer">
          <div class="rec-photo-ph skeleton" style="background:${gradientFor(r.name)}">${initials(r.name)}</div></div>
        <div class="rec-body">
          <div class="rec-header">
            <div class="rec-title-row">
              <span class="rec-name artist-link" data-artist="${esc(r.name)}">${esc(r.name)}</span>${plexBadge(r.inPlex)}</div>
            <span class="rec-match">${pct}%</span></div>
          <div class="rec-reason">Vergelijkbaar met ${esc(r.reason)}</div>
          <div id="rtags-${i}"><div class="skeleton" style="height:24px;border-radius:4px"></div></div>
          <div id="ralb-${i}"><div class="skeleton" style="height:80px;border-radius:4px;margin-top:8px"></div></div></div></div>`;
    });
    html += '</div>';

    if (albumRecs.length) {
      html += `<div class="section-title" style="margin-top:2rem">Aanbevolen Albums</div><div class="albrec-grid">`;
      albumRecs.forEach(a => {
        const img = proxyImg(a.image, 80) || a.image;
        const imgEl = img
          ? `<img class="albrec-img" src="${esc(img)}" alt="${esc(a.album)} by ${esc(a.artist)}" loading="lazy" decoding="async"
             onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
           <div class="albrec-ph" style="display:none;background:${gradientFor(a.album)}">${initials(a.album)}</div>`
          : `<div class="albrec-ph" style="background:${gradientFor(a.album)}">${initials(a.album)}</div>`;
        const badge = state.plexOk && (a.inPlex ? `<span class="badge plex" style="font-size:9px;margin-top:4px">▶ In Plex</span>`
          : `<span class="badge new" style="font-size:9px;margin-top:4px">✦ Nieuw</span>`) || '';
        html += `<div class="albrec-card"><div class="albrec-cover">${imgEl}</div><div class="albrec-info">
          <div class="albrec-title">${esc(a.album)}</div><div class="albrec-artist artist-link" data-artist="${esc(a.artist)}">${esc(a.artist)}</div>
          <div class="albrec-reason">via ${esc(a.reason)}</div>${badge}${downloadBtn(a.artist, a.album, a.inPlex)}</div></div>`;
      });
      html += '</div>';
    }

    if (trackRecs.length) {
      html += `<div class="section-title" style="margin-top:2rem">Aanbevolen Nummers</div><div class="trackrec-list">`;
      trackRecs.forEach(t => {
        const plays = t.playcount > 0 ? `<span class="trackrec-plays">${fmt(t.playcount)}×</span>` : '';
        const link = t.url ? `<a class="trackrec-link" href="${esc(t.url)}" target="_blank" rel="noopener">Last.fm ↗</a>` : '';
        html += `<div class="trackrec-row"><div class="trackrec-info">
          <div class="trackrec-title">${esc(t.track)}</div><div class="trackrec-artist artist-link" data-artist="${esc(t.artist)}">${esc(t.artist)}</div>
          <div class="trackrec-reason">via ${esc(t.reason)}</div></div><div class="trackrec-meta">${plays}${link}</div></div>`;
      });
      html += '</div>';
    }

    setContent(html, () => { if (state.activeMood) loadSpotifyRecs(state.activeMood); });
    applyRecsFilter();

    // Parallel fetch artist info
    const results = await Promise.allSettled(recs.map((r, i) =>
      apiFetch(`/api/artist/${encodeURIComponent(r.name)}/info`)
        .then(info => ({ i, info }))
    ));

    results.forEach(res => {
      if (res.status === 'fulfilled') {
        const { i, info } = res.value;
        const r = recs[i];
        const ph = document.getElementById(`rph-${i}`);
        if (ph && info.image) {
          // Bewaar data-artist en cursor op het foto-element (voor klikbaarheid)
          ph.setAttribute('data-artist', r.name);
          ph.style.cursor = 'pointer';
          ph.innerHTML = `<img src="${proxyImg(info.image, 120) || info.image}" alt="${esc(r.name)}" loading="lazy" decoding="async"
            onerror="this.parentElement.innerHTML='<div class=\\'rec-photo-ph\\' style=\\'background:${gradientFor(r.name)}\\'>${initials(r.name)}</div>'">`;
        }
        const tagsEl = document.getElementById(`rtags-${i}`);
        if (tagsEl) tagsEl.innerHTML = tagsHtml(info.tags, 3) + `<div style="height:6px"></div>`;
        const albEl = document.getElementById(`ralb-${i}`);
        if (albEl && info.albums?.length) {
          let ah = '<div class="rec-albums-label">Bekende albums</div><div class="rec-albums-list">';
          info.albums.slice(0, 4).forEach(a => {
            const img = a.image ? `<img class="rec-album-img" src="${proxyImg(a.image, 48) || a.image}" alt="${esc(a.name)}" loading="lazy" decoding="async">`
              : `<div class="rec-album-ph">♪</div>`;
            const plex = state.plexOk && a.inPlex ? `<span class="rec-album-plex">▶</span>` : '';
            ah += `<div class="rec-album-row">${img}<span class="rec-album-name">${esc(a.name)}</span>${plex}${downloadBtn(r.name, a.name, a.inPlex)}</div>`;
          });
          albEl.innerHTML = ah + '</div>';
        }
      }
    });
  } catch (e) { if (e.name !== 'AbortError') showError(e.message); }
}

// ────────────────────────────────────────────────────────────────────────────
// RELEASES TAB
// ────────────────────────────────────────────────────────────────────────────
function relativeDate(dateStr) {
  if (!dateStr) return '';
  const rel = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now - rel) / 86_400_000);
  if (diffDays === 0) return 'vandaag';
  if (diffDays === 1) return 'gisteren';
  if (diffDays < 7) return `${diffDays} dagen geleden`;
  return rel.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' });
}

async function renderReleasesTab() {
  setContent(skeletonGrid(4, 2));
  try {
    if (!releasesData) {
      let d = getCached('releases', 5 * 60 * 1000);
      if (!d) {
        d = await apiFetch('/api/core/releases');
        if (d.status === 'building') {
          setContent(`<div class="loading"><div class="spinner"></div><div>${esc(d.message)}</div>
            <div class="build-hint">Pagina ververst automatisch over 5 seconden</div></div>`);
          setTimeout(() => { if (state.activeView === 'ontdek') renderReleasesTab(); }, 5000);
          return;
        }
        setCache('releases', d);
      }
      releasesData = d;
    }

    let releases = releasesData.releases || [];
    state.newReleaseIds = new Set(releasesData.newReleaseIds || []);

    let filtered = releases;
    if (releasesFilter !== 'all') filtered = releases.filter(r => (r.type || 'album').toLowerCase() === releasesFilter);
    if (releasesSort === 'listening')
      filtered = [...filtered].sort((a, b) => (b.artistPlaycount || 0) - (a.artistPlaycount || 0) || new Date(b.releaseDate) - new Date(a.releaseDate));
    else
      filtered = [...filtered].sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate));

    if (!filtered.length) { setContent(`<div class="empty">Geen releases voor dit filter.</div>`); return; }

    const typeLabel = t => ({ album: 'Album', single: 'Single', ep: 'EP' })[t?.toLowerCase()] || 'Album';
    const typeBadgeClass = t => ({ album: 'rel-type-album', single: 'rel-type-single', ep: 'rel-type-ep' })[t?.toLowerCase()] || 'rel-type-album';

    let html = `<div class="section-title">${filtered.length} release${filtered.length !== 1 ? 's' : ''} in de afgelopen 30 dagen</div><div class="releases-grid">`;
    filtered.forEach(r => {
      const isNew = state.newReleaseIds.has(`${r.artist}::${r.album}`);
      const img = r.image ? `<img class="rel-img" src="${esc(r.image)}" alt="${esc(r.album)} by ${esc(r.artist)}" loading="lazy" decoding="async"
         onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
       <div class="rel-ph" style="display:none;background:${gradientFor(r.album)}">${initials(r.album)}</div>`
        : `<div class="rel-ph" style="background:${gradientFor(r.album)}">${initials(r.album)}</div>`;
      const absDate = r.releaseDate ? new Date(r.releaseDate).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' }) : '';
      const relDate = relativeDate(r.releaseDate);
      const dateHtml = absDate ? `<div class="rel-date">${absDate} <span class="rel-date-rel">(${relDate})</span></div>` : '';
      const plex = state.plexOk && (r.inPlex ? `<span class="badge plex" style="font-size:9px">▶ In Plex</span>`
        : (r.artistInPlex ? `<span class="badge new" style="font-size:9px">✦ Artiest in Plex</span>` : '')) || '';
      const deezer = r.deezerUrl ? `<a class="rel-deezer-link" href="${esc(r.deezerUrl)}" target="_blank" rel="noopener">Deezer ↗</a>` : '';
      html += `<div class="rel-card${isNew ? ' rel-card-new' : ''}"><div class="rel-cover">${img}</div><div class="rel-info">
        <span class="rel-type-badge ${typeBadgeClass(r.type)}">${typeLabel(r.type)}</span>
        <div class="rel-album">${esc(r.album)}</div><div class="rel-artist artist-link" data-artist="${esc(r.artist)}">${esc(r.artist)}</div>
        ${dateHtml}<div class="rel-footer">${plex}${deezer}${downloadBtn(r.artist, r.album, r.inPlex)}</div></div></div>`;
    });
    setContent(html + '</div>');

    // Markeer alle huidige releases als gezien + verwijder badge
    const allIds = releases.map(r => `${r.artist}::${r.album}`);
    localStorage.setItem('seenReleaseIds', JSON.stringify(allIds));
    state.newReleaseCount = 0;
    updateNavBadge('ontdek', 0);

  } catch (e) { if (e.name !== 'AbortError') showError(e.message); }
}

// ────────────────────────────────────────────────────────────────────────────
// DISCOVER TAB v2 — multi-sectie scrollbare pagina
// ────────────────────────────────────────────────────────────────────────────

const DISC_TYPE_ICONS = {
  discovery_weekly: '🔭', release_radar: '📡', daily_mix: '🎧',
  forgotten_favorites: '💫', hidden_gems: '💎', popular_picks: '🔥',
  discovery_shuffle: '🎲', familiar_favorites: '❤️',
  seasonal: '🌸', decade: '📅', genre: '🎸',
};

function _dscSectionHdr(emoji, title, refreshKey, id = '') {
  const metaSpan = id ? `<span class="dsc-section-meta" id="dsc-meta-${id}"></span>` : `<span class="dsc-section-meta"></span>`;
  return `<div class="vk-section-header">
    <span class="vk-section-emoji">${emoji}</span>
    <span class="vk-section-title">${esc(title)}</span>
    ${metaSpan}
    <button class="vk-section-refresh tool-btn" data-dsc-refresh="${esc(refreshKey)}" title="Vernieuwen">↻</button>
  </div>`;
}

function _dscBuildingBadge() {
  return `<div class="dsc-building-badge"><div class="dsc-spin"></div> Wordt opgebouwd…</div>`;
}

function _dscSkelRow(n = 6) {
  const c = `<div class="vk-album-card" style="min-width:140px"><div class="vk-cover skeleton"></div>
    <div class="vk-card-body"><div class="skeleton" style="height:12px;width:80%;border-radius:2px;margin-bottom:4px"></div>
    <div class="skeleton" style="height:10px;width:55%;border-radius:2px"></div></div></div>`;
  return `<div class="vk-scroll-row">${c.repeat(n)}</div>`;
}

function _dscSkelGrid(n = 8) {
  const c = `<div class="vk-album-card"><div class="vk-cover skeleton"></div>
    <div class="vk-card-body"><div class="skeleton" style="height:12px;width:80%;border-radius:2px;margin-bottom:4px"></div>
    <div class="skeleton" style="height:10px;width:55%;border-radius:2px"></div></div></div>`;
  return `<div class="vk-grid">${c.repeat(n)}</div>`;
}

function _dscSkelArtists(n = 6) {
  const c = `<div class="dsc-similar-card">
    <div class="dsc-similar-ph skeleton" style="width:52px;height:52px;border-radius:50%;flex-shrink:0"></div>
    <div style="flex:1"><div class="skeleton" style="height:14px;width:65%;border-radius:2px;margin-bottom:6px"></div>
    <div class="skeleton" style="height:11px;width:45%;border-radius:2px;margin-bottom:8px"></div>
    <div class="skeleton" style="height:3px;width:100%;border-radius:2px"></div></div></div>`;
  return `<div class="dsc-similar-grid">${c.repeat(n)}</div>`;
}

// ── S1: Hero — Muziek DNA ────────────────────────────────────────────────────
function _dscFillHero(container, data) {
  if (!data || data.status === 'building') {
    container.innerHTML = `<div class="vk-empty">${esc(data?.message || 'Genre-data wordt opgebouwd…')}</div>`;
    return;
  }
  const genres = (data.genres || []).slice(0, 8);
  if (!genres.length) { container.innerHTML = `<div class="vk-empty">Nog geen genre-data beschikbaar.</div>`; return; }

  let html = `<div class="dsc-genre-pills">`;
  genres.forEach(g => {
    const color  = g.color || 'var(--accent)';
    const sample = (g.topArtists || []).slice(0, 2).map(a => esc(a.name)).join(', ');
    html += `<button class="dsc-genre-pill" data-genre="${esc(g.genre)}" style="--pill-bg:${esc(color)}">
      <span class="dsc-genre-name">${esc(g.genre)}</span>
      <span class="dsc-genre-count">${g.count} artiesten</span>
      ${sample ? `<span class="dsc-genre-sample">${sample}</span>` : ''}
    </button>`;
  });
  html += `</div>`;
  container.innerHTML = html;

  container.addEventListener('click', e => {
    const pill = e.target.closest('.dsc-genre-pill');
    if (!pill) return;
    openGenreModal(pill.dataset.genre, genres.map(g => ({
      genre: g.genre, artistCount: g.count,
      sampleArtists: (g.topArtists || []).map(a => a.name),
    })));
  });
}

// ── S2: Undiscovered Albums ──────────────────────────────────────────────────
function _dscFillUndiscovered(container, items, isBuilding) {
  if (!items.length) {
    container.innerHTML = (isBuilding ? _dscBuildingBadge() : '') +
      `<div class="vk-empty">Geen ontbrekende albums gevonden. Verken artiesten om de MusicBrainz-cache te vullen.</div>`;
    return;
  }
  let html = isBuilding ? _dscBuildingBadge() : '';
  html += `<div class="vk-scroll-row">`;
  items.forEach(a => { html += verkennerAlbumCard(a, true); });
  html += `</div>`;
  container.innerHTML = html;
}

// ── S3: New In Your Genres ───────────────────────────────────────────────────
function _dscFillNewInGenres(container, items, isBuilding) {
  if (!items.length) {
    container.innerHTML = (isBuilding ? _dscBuildingBadge() : '') +
      `<div class="vk-empty">Nog geen releases. Bezoek artiestpagina's om de genre-cache te vullen.</div>`;
    return;
  }
  const byGenre = new Map();
  items.forEach(r => {
    if (!byGenre.has(r.genre)) byGenre.set(r.genre, []);
    byGenre.get(r.genre).push(r);
  });

  let html = isBuilding ? _dscBuildingBadge() : '';
  byGenre.forEach((releases, genre) => {
    html += `<div class="dsc-genre-group">
      <div class="dsc-genre-group-label">${esc(genre)}</div>
      <div class="vk-scroll-row">`;
    releases.forEach(r => {
      html += verkennerAlbumCard({
        title: r.title, artist: r.artist,
        year: relativeDate(r.releaseDate) || (r.releaseDate || '').slice(0, 4),
        coverUrl: r.coverUrl, genre: r.primaryType || null,
      }, true);
    });
    html += `</div></div>`;
  });
  container.innerHTML = html;
}

// ── S4: Similar Artists (verbeterd met popularity bar) ──────────────────────
function _dscFillSimilar(container, artists, basedOn, isBuilding) {
  if (!artists.length) {
    container.innerHTML = (isBuilding ? _dscBuildingBadge() : '') +
      `<div class="vk-empty">Geen aanbevelingen beschikbaar.</div>`;
    return;
  }
  const metaEl = document.getElementById('dsc-meta-similar');
  if (metaEl && basedOn?.length) {
    metaEl.textContent = `Op basis van: ${basedOn.slice(0, 3).join(', ')}`;
  }

  let html = isBuilding ? _dscBuildingBadge() : '';
  html += `<div class="dsc-similar-grid">`;
  artists.slice(0, 24).forEach(a => {
    const pct   = Math.round(a.match * 100);
    const img   = proxyImg(a.image, 120) || a.image;
    const photo = img
      ? `<img class="dsc-similar-photo" src="${esc(img)}" alt="${esc(a.name)}" loading="lazy" decoding="async"
           onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
         <div class="dsc-similar-ph" style="display:none;background:${gradientFor(a.name, true)}">${initials(a.name)}</div>`
      : `<div class="dsc-similar-ph" style="background:${gradientFor(a.name, true)}">${initials(a.name)}</div>`;
    html += `<div class="dsc-similar-card artist-link" data-artist="${esc(a.name)}">
      ${photo}
      <div class="dsc-similar-info">
        <div class="dsc-similar-name">${esc(a.name)}${plexBadge(a.inPlex)}</div>
        <div class="dsc-similar-reason">Vergelijkbaar met <strong>${esc(a.reason)}</strong></div>
        ${tagsHtml(a.tags, 3)}
        <div class="dsc-pop-bar" title="${pct}% match">
          <div class="dsc-pop-fill" style="width:${pct}%"></div>
        </div>
      </div>
      <span class="dsc-similar-match">${pct}%</span>
    </div>`;
  });
  html += `</div>`;
  container.innerHTML = html;
}

// ── S5: From Your Labels ─────────────────────────────────────────────────────
function _dscFillFromLabels(container, items, isBuilding) {
  if (!items.length) {
    container.innerHTML = (isBuilding ? _dscBuildingBadge() : '') +
      `<div class="vk-empty">Geen label-data gevonden. Zorg dat artiesten Discogs-tags hebben.</div>`;
    return;
  }
  const byLabel = new Map();
  items.forEach(r => {
    const lbl = r.label || 'Overig';
    if (!byLabel.has(lbl)) byLabel.set(lbl, []);
    byLabel.get(lbl).push(r);
  });

  let html = isBuilding ? _dscBuildingBadge() : '';
  byLabel.forEach((releases, label) => {
    html += `<div class="dsc-label-group">
      <div class="dsc-label-name"># ${esc(label)} <span>${releases.length} release${releases.length !== 1 ? 's' : ''}</span></div>
      <div class="vk-scroll-row">`;
    releases.forEach(r => {
      html += verkennerAlbumCard({
        title: r.title, artist: r.artist,
        year: (r.releaseDate || '').slice(0, 4), coverUrl: r.coverUrl,
      }, true);
    });
    html += `</div></div>`;
  });
  container.innerHTML = html;
}

// ── S6: Deep Cuts ────────────────────────────────────────────────────────────
function _dscFillDeepCuts(container, items, isBuilding) {
  if (!items.length) {
    container.innerHTML = (isBuilding ? _dscBuildingBadge() : '') +
      `<div class="vk-empty">Geen deep cuts gevonden. Verken meer artiesten.</div>`;
    return;
  }
  let html = isBuilding ? _dscBuildingBadge() : '';
  html += `<div class="dsc-deepcuts-list">`;
  items.slice(0, 15).forEach(a => {
    const img   = proxyImg(a.image, 80) || a.image;
    const photo = img
      ? `<img class="dsc-deepcuts-photo" src="${esc(img)}" alt="${esc(a.artist)}" loading="lazy" decoding="async"
           onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
         <div class="dsc-deepcuts-ph" style="display:none;background:${gradientFor(a.artist)}">${initials(a.artist)}</div>`
      : `<div class="dsc-deepcuts-ph" style="background:${gradientFor(a.artist)}">${initials(a.artist)}</div>`;
    const popLabel = a.popularity != null ? `Pop. ${a.popularity}/100` : 'Laag bereik';
    html += `<div class="dsc-deepcuts-artist">
      <div class="dsc-deepcuts-header">
        ${photo}
        <span class="dsc-deepcuts-name artist-link" data-artist="${esc(a.artist)}">${esc(a.artist)}</span>
        ${tagsHtml(a.tags, 2)}
        <span class="dsc-pop-label">🔭 ${esc(popLabel)}</span>
      </div>
      ${(a.tracks || []).length ? `<div class="dsc-tracks-mini">${(a.tracks).map(t =>
        `<div class="dsc-track-mini-row"><span style="opacity:.5">♫</span><span>${esc(t.title || '')}</span></div>`
      ).join('')}</div>` : ''}
    </div>`;
  });
  html += `</div>`;
  container.innerHTML = html;
}

// ── S7: Hidden Gems ──────────────────────────────────────────────────────────
function _dscFillHiddenGems(container, items, isBuilding) {
  if (!items.length) {
    container.innerHTML = (isBuilding ? _dscBuildingBadge() : '') +
      `<div class="vk-empty">Geen vergeten favorieten gevonden.</div>`;
    return;
  }
  let html = isBuilding ? _dscBuildingBadge() : '';
  html += `<div class="dsc-hiddengems-grid">`;
  items.forEach(a => {
    const img   = proxyImg(a.image, 120) || a.image;
    const photo = img
      ? `<img class="dsc-hidden-photo" src="${esc(img)}" alt="${esc(a.name)}" loading="lazy" decoding="async"
           onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
         <div class="dsc-hidden-ph" style="display:none;background:${gradientFor(a.name)}">${initials(a.name)}</div>`
      : `<div class="dsc-hidden-ph" style="background:${gradientFor(a.name)}">${initials(a.name)}</div>`;
    html += `<div class="dsc-hidden-card artist-link" data-artist="${esc(a.name)}">
      ${photo}
      <div class="dsc-hidden-name">${esc(a.name)}</div>
      ${tagsHtml(a.tags, 2)}
    </div>`;
  });
  html += `</div>`;
  container.innerHTML = html;
}

// ── S8: Playlists ────────────────────────────────────────────────────────────
function _dscFillPlaylists(container, data) {
  if (!data?.catalog?.length) {
    container.innerHTML = `<div class="vk-empty">Geen playlists. Ga naar de Playlists-tab om te genereren.</div>`;
    return;
  }
  const show = data.catalog.filter(d =>
    ['discovery_weekly','release_radar','daily_mix','forgotten_favorites','hidden_gems','popular_picks'].includes(d.type)
  );
  if (!show.length) { container.innerHTML = `<div class="vk-empty">Geen playlist-types geconfigureerd.</div>`; return; }

  let html = `<div class="dsc-playlist-grid">`;
  show.forEach(def => {
    const icon   = DISC_TYPE_ICONS[def.type] || '🎵';
    const covers = (def.tracks || []).filter(t => t.image).slice(0, 4);
    const mosaic = covers.length >= 2
      ? `<div class="dsc-playlist-mosaic">${covers.map(t =>
          `<img src="${esc(proxyImg(t.image, 100) || t.image)}" alt="" loading="lazy" decoding="async">`
        ).join('')}</div>`
      : `<div class="dsc-playlist-mosaic-single">${icon}</div>`;
    const age = def.generated_at ? relativeDate(new Date(def.generated_at * 1000).toISOString()) : '';
    html += `<div class="dsc-playlist-card" data-playlist-type="${esc(def.type)}">
      ${mosaic}
      <div class="dsc-playlist-body">
        <div class="dsc-playlist-name">${esc(def.name)}</div>
        <div class="dsc-playlist-meta">${def.cached ? `${def.track_count} tracks${age ? ` · ${age}` : ''}` : 'Nog niet gegenereerd'}</div>
        <button class="dsc-playlist-btn">${def.cached ? '▶ Bekijk' : '⚡ Genereer'}</button>
      </div>
    </div>`;
  });
  html += `</div>`;
  container.innerHTML = html;

  container.addEventListener('click', () => { location.hash = '#/playlists'; });
}

// ── S9: ListenBrainz ─────────────────────────────────────────────────────────
function _dscFillListenBrainz(container, section, data) {
  if (!data?.enabled) { section.style.display = 'none'; return; }
  section.style.display = '';
  const artists = data.artists || [];
  if (!artists.length) {
    container.innerHTML = `<div class="vk-empty">Geen aanbevelingen van ListenBrainz voor ${esc(data.username || '')}.</div>`;
    return;
  }
  let html = `<div class="dsc-lb-grid">`;
  artists.slice(0, 24).forEach(a => {
    const img   = proxyImg(a.image, 80) || a.image;
    const photo = img
      ? `<img class="dsc-lb-photo" src="${esc(img)}" alt="${esc(a.name)}" loading="lazy" decoding="async"
           onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
         <div class="dsc-lb-ph" style="display:none;background:${gradientFor(a.name)}">${initials(a.name)}</div>`
      : `<div class="dsc-lb-ph" style="background:${gradientFor(a.name)}">${initials(a.name)}</div>`;
    html += `<div class="dsc-lb-card artist-link" data-artist="${esc(a.name)}">
      ${photo}
      <div class="dsc-lb-info">
        <div class="dsc-lb-name">${esc(a.name)}</div>
        <div class="dsc-lb-meta">${a.inPlex ? '▶ In Plex' : '✦ Nieuw'}${a.genres?.length ? ` · ${esc(a.genres[0])}` : ''}</div>
      </div>
    </div>`;
  });
  html += `</div>`;
  container.innerHTML = html;
}

// ── Discover section polling ──────────────────────────────────────────────────
let _discoverPollTimer = null;

function _stopDiscoverPolling() {
  if (_discoverPollTimer) { clearInterval(_discoverPollTimer); _discoverPollTimer = null; }
}

function _startDiscoverPolling(initialBuilding) {
  _stopDiscoverPolling();
  if (!Object.values(initialBuilding).some(Boolean)) return;

  let knownBuilding = { ...initialBuilding };

  _discoverPollTimer = setInterval(async () => {
    if (state.activeView !== 'ontdek' || ontdekCurrentTab !== 'discover') {
      _stopDiscoverPolling(); return;
    }
    try {
      const status = await apiFetch('/api/core/discover/status');
      const newlyReady = Object.keys(knownBuilding).filter(k => knownBuilding[k] && status[k] && !status[k].building && status[k].ready);

      if (newlyReady.length) {
        const fresh = await apiFetch('/api/core/discover');
        if (fresh.status === 'ok') {
          _discoverCache = { data: fresh, at: Date.now() };
          discoverData = fresh;
          const b2 = fresh.building || {};
          const g = id => document.getElementById(`dsc-body-${id}`);
          if (newlyReady.includes('undiscovered') && g('undiscovered'))
            _dscFillUndiscovered(g('undiscovered'), fresh.undiscoveredAlbums || [], b2.undiscovered);
          if (newlyReady.includes('newInGenres') && g('new-genres'))
            _dscFillNewInGenres(g('new-genres'), fresh.newInGenres || [], b2.newInGenres);
          if (newlyReady.includes('similar') && g('similar'))
            _dscFillSimilar(g('similar'), fresh.similarArtists || [], fresh.basedOn || [], b2.similar);
          if (newlyReady.includes('fromLabels') && g('labels'))
            _dscFillFromLabels(g('labels'), fresh.fromYourLabels || [], b2.fromLabels);
          if (newlyReady.includes('deepCuts') && g('deepcuts'))
            _dscFillDeepCuts(g('deepcuts'), fresh.deepCuts || [], b2.deepCuts);
          if (newlyReady.includes('hiddenGems') && g('hiddengems'))
            _dscFillHiddenGems(g('hiddengems'), fresh.hiddenGems || [], b2.hiddenGems);
          knownBuilding = { ...b2 };
        }
      }

      if (!Object.values(status).some(s => s.building)) _stopDiscoverPolling();
    } catch {}
  }, 5000);
}

// ── Discover secties vullen vanuit een disc-object ────────────────────────────
function _fillDiscoverSections(disc, overrideBuilding) {
  const b = overrideBuilding || disc.building || {};
  const g = id => document.getElementById(`dsc-body-${id}`);
  if (g('undiscovered'))  _dscFillUndiscovered(g('undiscovered'), disc.undiscoveredAlbums || [], b.undiscovered);
  if (g('new-genres'))    _dscFillNewInGenres(g('new-genres'),    disc.newInGenres        || [], b.newInGenres);
  if (g('similar'))       _dscFillSimilar(g('similar'),           disc.similarArtists     || [], disc.basedOn || [], b.similar);
  if (g('labels'))        _dscFillFromLabels(g('labels'),         disc.fromYourLabels     || [], b.fromLabels);
  if (g('deepcuts'))      _dscFillDeepCuts(g('deepcuts'),         disc.deepCuts           || [], b.deepCuts);
  if (g('hiddengems'))    _dscFillHiddenGems(g('hiddengems'),     disc.hiddenGems         || [], b.hiddenGems);
}

// ── Discover tab hoofdrenderer ────────────────────────────────────────────────
async function renderDiscoverTab() {
  const skelList = Array(5).fill(`<div class="vk-track-row">
    <div class="vk-track-thumb skeleton"></div>
    <div style="flex:1"><div class="skeleton" style="height:13px;width:60%;border-radius:2px;margin-bottom:4px"></div>
    <div class="skeleton" style="height:11px;width:40%;border-radius:2px"></div></div></div>`).join('');

  const pageHtml = `<div class="vk-page" id="dsc-page">

    <div class="vk-section vk-section--hero">
      ${_dscSectionHdr('🧬', 'Jouw Muziek DNA', 'genres')}
      <p class="vk-section-desc">Jouw top-genres op basis van Plex-bibliotheek. Klik op een genre om artiesten te verkennen.</p>
      <div class="vk-section-body" id="dsc-body-hero">
        <div class="dsc-genre-pills">${Array(6).fill('<div class="dsc-genre-pill skeleton" style="min-width:140px;height:76px"></div>').join('')}</div>
      </div>
    </div>

    <div class="vk-section">
      ${_dscSectionHdr('📀', 'Ontbrekende Albums', 'discover')}
      <p class="vk-section-desc">Albums van jouw top-artiesten die in MusicBrainz staan maar niet in je Plex-bibliotheek.</p>
      <div class="vk-section-body" id="dsc-body-undiscovered">${_dscSkelRow()}</div>
    </div>

    <div class="vk-section">
      ${_dscSectionHdr('🎸', 'Nieuw in jouw genres', 'discover')}
      <p class="vk-section-desc">Recente releases die passen bij jouw top-genres.</p>
      <div class="vk-section-body" id="dsc-body-new-genres">${_dscSkelRow()}</div>
    </div>

    <div class="vk-section">
      ${_dscSectionHdr('🔭', 'Ontdek Nieuwe Artiesten', 'discover', 'similar')}
      <p class="vk-section-desc">Vergelijkbare artiesten op basis van jouw luistergedrag.</p>
      <div class="vk-section-body" id="dsc-body-similar">${_dscSkelArtists()}</div>
    </div>

    <div class="vk-section">
      ${_dscSectionHdr('🏷️', 'Van jouw labels', 'discover')}
      <p class="vk-section-desc">Recente releases van labels die jouw favoriete artiesten uitbrengen.</p>
      <div class="vk-section-body" id="dsc-body-labels">${_dscSkelRow()}</div>
    </div>

    <div class="vk-section">
      ${_dscSectionHdr('🎵', 'Deep Cuts', 'discover')}
      <p class="vk-section-desc">Artiesten in je bibliotheek met een laag bereik — muziek dat je waarschijnlijk nog niet kent.</p>
      <div class="vk-section-body" id="dsc-body-deepcuts"><div class="vk-track-list">${skelList}</div></div>
    </div>

    <div class="vk-section">
      ${_dscSectionHdr('💎', 'Vergeten Favorieten', 'discover')}
      <p class="vk-section-desc">Je luisterde vroeger veel naar deze artiesten, maar al een tijdje niet meer.</p>
      <div class="vk-section-body" id="dsc-body-hiddengems">${_dscSkelGrid(6)}</div>
    </div>

    <div class="vk-section">
      ${_dscSectionHdr('🎧', 'Discovery Playlists', 'playlists')}
      <p class="vk-section-desc">Automatisch gegenereerde playlists op basis van jouw luisterdata.</p>
      <div class="vk-section-body" id="dsc-body-playlists">${_dscSkelRow(4)}</div>
    </div>

    <div class="vk-section" id="dsc-lb-section" style="display:none">
      ${_dscSectionHdr('📻', 'ListenBrainz Aanbevelingen', 'lb')}
      <p class="vk-section-desc">Aanbevolen artiesten op basis van jouw ListenBrainz-profiel.</p>
      <div class="vk-section-body" id="dsc-body-lb">${_dscSkelArtists(4)}</div>
    </div>

  </div>`;

  const now = Date.now();
  const cachedDisc = _discoverCache && _discoverCache.data.status === 'ok' ? _discoverCache : null;
  const isFresh    = cachedDisc && (now - cachedDisc.at) < DISCOVER_CACHE_TTL;

  setContent(pageHtml);

  if (isFresh) {
    // Toon gecachede data direct, haal niet-discover endpoints op de achtergrond op
    if (cachedDisc.data.plexConnected) state.plexOk = true;
    discoverData = cachedDisc.data;
    _fillDiscoverSections(cachedDisc.data);

    const [genresRes, plRes, lbRes] = await Promise.allSettled([
      apiFetch('/api/genres'),
      apiFetch('/api/playlists'),
      apiFetch('/api/listenbrainz/recommendations'),
    ]);
    const g = id => document.getElementById(`dsc-body-${id}`);
    _dscFillHero(g('hero'), genresRes.status === 'fulfilled' ? genresRes.value : null);
    _dscFillPlaylists(g('playlists'), plRes.status === 'fulfilled' ? plRes.value : null);
    const lbSection = document.getElementById('dsc-lb-section');
    if (lbSection) _dscFillListenBrainz(g('lb'), lbSection, lbRes.status === 'fulfilled' ? lbRes.value : null);

    // Stille achtergrond-update van discover-data
    apiFetch('/api/core/discover').then(fresh => {
      if (fresh.status === 'ok') {
        _discoverCache = { data: fresh, at: Date.now() };
        discoverData = fresh;
        _fillDiscoverSections(fresh);
        _startDiscoverPolling(fresh.building || {});
      }
    }).catch(() => {});
    return;
  }

  // Geen verse cache: alle endpoints parallel ophalen
  const [discRes, genresRes, plRes, lbRes] = await Promise.allSettled([
    apiFetch('/api/core/discover'),
    apiFetch('/api/genres'),
    apiFetch('/api/playlists'),
    apiFetch('/api/listenbrainz/recommendations'),
  ]);

  const g = id => document.getElementById(`dsc-body-${id}`);

  // Genres hero
  _dscFillHero(g('hero'), genresRes.status === 'fulfilled' ? genresRes.value : null);

  // Playlists
  _dscFillPlaylists(g('playlists'), plRes.status === 'fulfilled' ? plRes.value : null);

  // ListenBrainz
  const lbSection = document.getElementById('dsc-lb-section');
  if (lbSection) _dscFillListenBrainz(g('lb'), lbSection, lbRes.status === 'fulfilled' ? lbRes.value : null);

  // Discover (6 secties uit één call)
  if (discRes.status !== 'fulfilled') {
    const errHtml = `<div class="vk-empty">Discover-data kon niet worden geladen.</div>`;
    ['undiscovered','new-genres','similar','labels','deepcuts','hiddengems'].forEach(id => {
      const el = g(id); if (el) el.innerHTML = errHtml;
    });
    return;
  }

  const disc = discRes.value;
  if (disc.status === 'building') {
    if (cachedDisc) {
      // Toon verouderde data met "wordt bijgewerkt" per sectie die bouwt
      if (cachedDisc.data.plexConnected) state.plexOk = true;
      discoverData = cachedDisc.data;
      const allBuilding = { similar: true, undiscovered: true, newInGenres: true, fromLabels: true, deepCuts: true, hiddenGems: true };
      _fillDiscoverSections(cachedDisc.data, allBuilding);
    } else {
      const buildHtml = `<div class="vk-building">
        <div class="spinner" style="margin-bottom:10px"></div>
        <div class="vk-building-title">Muziekontdekkingen worden geanalyseerd</div>
        <div class="vk-building-sub">${esc(disc.message || '')}<br>Pagina ververst over 20 seconden.</div>
      </div>`;
      ['undiscovered','new-genres','similar','labels','deepcuts','hiddengems'].forEach(id => {
        const el = g(id); if (el) el.innerHTML = buildHtml;
      });
    }
    _startDiscoverPolling({ similar: true, undiscovered: true, newInGenres: true, fromLabels: true, deepCuts: true, hiddenGems: true });
    return;
  }

  if (disc.plexConnected) state.plexOk = true;
  discoverData = disc;
  _discoverCache = { data: disc, at: Date.now() };

  _fillDiscoverSections(disc);
  _startDiscoverPolling(disc.building || {});

  // Sectie-niveau refresh (delegeert op contentEl, loopt onschadelijk af op andere tabs)
  contentEl.addEventListener('click', async e => {
    if (ontdekCurrentTab !== 'discover') return;
    const btn = e.target.closest('.vk-section-refresh[data-dsc-refresh]');
    if (!btn) return;
    const type = btn.dataset.dscRefresh;
    const bodyId = btn.closest('.vk-section')?.querySelector('.vk-section-body')?.id;
    if (!bodyId) return;
    const container = document.getElementById(bodyId);
    if (!container) return;

    btn.disabled = true;
    btn.textContent = '⏳';
    try {
      if (type === 'genres') {
        await p('/api/genres/refresh', { method: 'POST' }).catch(() => {});
        _dscFillHero(container, await apiFetch('/api/genres'));
      } else if (type === 'playlists') {
        _dscFillPlaylists(container, await apiFetch('/api/playlists'));
      } else if (type === 'discover') {
        // Volledige discover refresh — herlaad de hele tab
        await p('/api/core/discover/refresh', { method: 'POST' }).catch(() => {});
        discoverData = null;
        _discoverCache = null;
        invalidate('discover');
        renderDiscoverTab();
        return;
      }
    } catch {}
    btn.disabled = false;
    btn.textContent = '↻';
  });
}

// ────────────────────────────────────────────────────────────────────────────
// VERKENNER TAB — cache-powered discovery secties
// ────────────────────────────────────────────────────────────────────────────

/** Kleine album-kaart voor de verkenner-secties */
function verkennerAlbumCard(album, showArtist = true) {
  const { artist = '', title = '', year = '', coverUrl = null, genre = null } = album;
  const bg  = gradientFor(title);
  const img = coverUrl
    ? `<img class="vk-cover-img" src="${esc(coverUrl)}" alt="${esc(title)}" loading="lazy" decoding="async"
         onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
       <div class="vk-cover-ph" style="display:none;background:${bg}">${initials(title)}</div>`
    : `<div class="vk-cover-ph" style="background:${bg}">${initials(title)}</div>`;
  const artistHtml = showArtist ? `<div class="vk-card-artist artist-link" data-artist="${esc(artist)}">${esc(artist)}</div>` : '';
  const genreTag   = genre ? `<span class="vk-genre-tag">${esc(genre)}</span>` : '';
  return `<div class="vk-album-card">
    <div class="vk-cover">${img}</div>
    <div class="vk-card-body">
      ${genreTag}
      <div class="vk-card-title" title="${esc(title)}">${esc(title)}</div>
      ${artistHtml}
      ${year ? `<div class="vk-card-year">${esc(String(year))}</div>` : ''}
      ${downloadBtn(artist, title, false)}
    </div>
  </div>`;
}

/** Wachtscherm terwijl discovery data opgebouwd wordt */
function buildingHtml(sectionTitle) {
  return `<div class="vk-building">
    <div class="spinner" style="margin-bottom:12px"></div>
    <div class="vk-building-title">${esc(sectionTitle)} wordt opgebouwd</div>
    <div class="vk-building-sub">De eerste keer duurt dit even — data wordt geladen uit de SQLite-cache.<br>
      Pagina ververst automatisch over 15 seconden.</div>
  </div>`;
}

/** Sectie-header met refresh-knop */
function sectionHeader(title, emoji, type) {
  return `<div class="vk-section-header">
    <span class="vk-section-emoji">${emoji}</span>
    <span class="vk-section-title">${esc(title)}</span>
    <button class="vk-section-refresh tool-btn" data-vk-refresh="${esc(type)}" title="Sectie vernieuwen">↻</button>
  </div>`;
}

// ── Sectie: Undiscovered Albums ─────────────────────────────────────────────
async function renderUndiscovered(container) {
  container.innerHTML = buildingHtml('Undiscovered Albums');
  try {
    const res = await apiFetch('/api/discover/undiscovered?limit=30');
    if (res.status === 'building') {
      setTimeout(() => renderUndiscovered(container), 15000);
      return;
    }
    const items = res.items || [];
    if (!items.length) {
      container.innerHTML = `<div class="vk-empty">Geen ontbrekende albums gevonden. Breid je MusicBrainz-cache uit door artiesten op te zoeken.</div>`;
      return;
    }
    let html = `<div class="vk-scroll-row">`;
    items.forEach(a => { html += verkennerAlbumCard(a, true); });
    html += `</div>`;
    container.innerHTML = html;
  } catch (err) {
    container.innerHTML = `<div class="vk-empty">Fout bij laden: ${esc(err.message)}</div>`;
  }
}

// ── Sectie: New In Your Genres ──────────────────────────────────────────────
async function renderGenresNew(container) {
  container.innerHTML = buildingHtml('Nieuw in jouw genres');
  try {
    const res = await apiFetch('/api/discover/genres-new?limit=30');
    if (res.status === 'building') {
      setTimeout(() => renderGenresNew(container), 15000);
      return;
    }
    const items = res.items || [];
    if (!items.length) {
      container.innerHTML = `<div class="vk-empty">Geen resultaten — bezoek meer artiestpagina's om je genre-cache op te bouwen.</div>`;
      return;
    }
    let html = `<div class="vk-grid">`;
    items.forEach(a => { html += verkennerAlbumCard(a, true); });
    html += `</div>`;
    container.innerHTML = html;
  } catch (err) {
    container.innerHTML = `<div class="vk-empty">Fout bij laden: ${esc(err.message)}</div>`;
  }
}

// ── Sectie: From Your Labels ─────────────────────────────────────────────────
async function renderLabels(container) {
  container.innerHTML = buildingHtml('Van jouw labels');
  try {
    const res = await apiFetch('/api/discover/labels?limit=20');
    if (res.status === 'building') {
      setTimeout(() => renderLabels(container), 15000);
      return;
    }
    const groups = res.items || [];
    if (!groups.length) {
      container.innerHTML = `<div class="vk-empty">Geen label-data gevonden. Zorg dat je artiesten MusicBrainz-tags hebben.</div>`;
      return;
    }
    let html = '';
    groups.forEach(group => {
      html += `<div class="vk-label-group">
        <div class="vk-label-name"># ${esc(group.label)}</div>
        <div class="vk-scroll-row">`;
      (group.albums || []).forEach(a => { html += verkennerAlbumCard(a, true); });
      html += `</div></div>`;
    });
    container.innerHTML = html;
  } catch (err) {
    container.innerHTML = `<div class="vk-empty">Fout bij laden: ${esc(err.message)}</div>`;
  }
}

// ── Sectie: Deep Cuts ───────────────────────────────────────────────────────
async function renderDeepCuts(container) {
  container.innerHTML = buildingHtml('Deep Cuts');
  try {
    const res = await apiFetch('/api/discover/deep-cuts?limit=30');
    if (res.status === 'building') {
      setTimeout(() => renderDeepCuts(container), 15000);
      return;
    }
    const items = res.items || [];
    if (!items.length) {
      container.innerHTML = `<div class="vk-empty">Geen deep cuts gevonden. Luister meer muziek zodat je recente-scrobbles-cache wordt gevuld.</div>`;
      return;
    }
    let html = `<div class="vk-track-list">`;
    items.forEach(({ artist, album, year, coverUrl }) => {
      const bg  = gradientFor(album);
      const img = coverUrl
        ? `<img class="vk-track-img" src="${esc(coverUrl)}" alt="${esc(album)}" loading="lazy" decoding="async"
             onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
           <div class="vk-track-ph" style="display:none;background:${bg}">${initials(album)}</div>`
        : `<div class="vk-track-ph" style="background:${bg}">${initials(album)}</div>`;
      html += `<div class="vk-track-row">
        <div class="vk-track-thumb">${img}</div>
        <div class="vk-track-info">
          <div class="vk-track-album">${esc(album)}</div>
          <div class="vk-track-artist artist-link" data-artist="${esc(artist)}">${esc(artist)}</div>
          ${year ? `<div class="vk-track-year">${esc(String(year))}</div>` : ''}
        </div>
        <div class="vk-track-actions">${downloadBtn(artist, album, true)}</div>
      </div>`;
    });
    html += `</div>`;
    container.innerHTML = html;
  } catch (err) {
    container.innerHTML = `<div class="vk-empty">Fout bij laden: ${esc(err.message)}</div>`;
  }
}

// ── Sectie: Genre Explorer ──────────────────────────────────────────────────
async function renderGenreExplorer(container) {
  container.innerHTML = buildingHtml('Genre Explorer');
  try {
    const res = await apiFetch('/api/discover/genre-explorer');
    if (res.status === 'building') {
      setTimeout(() => renderGenreExplorer(container), 15000);
      return;
    }
    const genres = res.items || [];
    if (!genres.length) {
      container.innerHTML = `<div class="vk-empty">Geen genre-data gevonden. Zorg dat Plex gesynchroniseerd is.</div>`;
      return;
    }
    let html = `<div class="vk-genre-grid">`;
    genres.forEach(({ genre, artistCount, sampleArtists }) => {
      const color = gradientFor(genre);
      html += `<button class="vk-genre-pill" data-genre="${esc(genre)}" style="--pill-color:${color}">
        <span class="vk-genre-pill-name">${esc(genre)}</span>
        <span class="vk-genre-pill-count">${artistCount} artiest${artistCount !== 1 ? 'en' : ''}</span>
        ${sampleArtists?.length
          ? `<span class="vk-genre-pill-sample">${sampleArtists.map(a => esc(a)).join(', ')}</span>`
          : ''}
      </button>`;
    });
    html += `</div>`;
    container.innerHTML = html;

    // Genre pill click → modal met artiesten van dat genre
    container.addEventListener('click', e => {
      const pill = e.target.closest('.vk-genre-pill');
      if (!pill) return;
      openGenreModal(pill.dataset.genre, genres);
    });
  } catch (err) {
    container.innerHTML = `<div class="vk-empty">Fout bij laden: ${esc(err.message)}</div>`;
  }
}

/** Genre-modal Deep Dive: toont artiesten, albums en playcount-statistieken */
function openGenreModal(genre, allGenres) {
  const entry = allGenres.find(g => g.genre === genre);
  if (!entry) return;

  document.getElementById('vk-genre-modal')?.remove();

  const modal = document.createElement('div');
  modal.id = 'vk-genre-modal';
  modal.className = 'vk-modal-overlay';
  modal.innerHTML = `
    <div class="vk-modal vk-modal--genre">
      <div class="vk-modal-header">
        <div>
          <span class="vk-modal-title"># ${esc(entry.genre)}</span>
          <span class="vk-modal-count">${entry.artistCount} artiest${entry.artistCount !== 1 ? 'en' : ''}</span>
        </div>
        <div class="vk-modal-header-acts">
          <button class="vk-genre-gen-btn" id="vk-genre-gen-btn" title="Genereer playlist voor dit genre">
            🎵 Genereer Playlist
          </button>
          <button class="vk-modal-close" id="vk-modal-close">✕</button>
        </div>
      </div>
      <div class="vk-modal-body" id="vk-genre-modal-body">
        <div class="vk-modal-loading"><div class="spinner"></div> Laden…</div>
      </div>
    </div>`;
  document.body.appendChild(modal);

  document.getElementById('vk-modal-close').addEventListener('click', () => modal.remove());
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });

  // Genereer playlist knop
  const genBtn = document.getElementById('vk-genre-gen-btn');
  genBtn?.addEventListener('click', async () => {
    genBtn.disabled = true;
    genBtn.textContent = '⏳ Genereren…';
    try {
      const data = await apiFetch(
        `/api/playlists/generate/genre?force=true&genre=${encodeURIComponent(genre)}`
      );
      const tracks = data.tracks || [];
      genBtn.textContent = `✅ ${tracks.length} tracks`;
      setTimeout(() => { genBtn.disabled = false; genBtn.innerHTML = '🎵 Genereer Playlist'; }, 3000);
    } catch (e) {
      genBtn.textContent = '❌ Mislukt';
      genBtn.disabled = false;
      setTimeout(() => { genBtn.innerHTML = '🎵 Genereer Playlist'; }, 2000);
    }
  });

  const body = document.getElementById('vk-genre-modal-body');

  // Laad rijke data via nieuwe endpoint
  apiFetch(`/api/discover/genre-detail/${encodeURIComponent(genre)}`)
    .then(data => {
      const artists = data.artists || [];
      if (!artists.length) {
        body.innerHTML = `<div class="vk-empty">Geen artiesten voor dit genre gevonden in je bibliotheek.</div>`;
        return;
      }

      // Statistieken header
      const totalPlaycount = artists.reduce((s, a) => s + (a.playcount || 0), 0);
      let html = `
        <div class="vk-genre-stats">
          <div class="vk-genre-stat"><span class="vk-gs-num">${artists.length}</span><span class="vk-gs-lbl">Artiesten</span></div>
          <div class="vk-genre-stat"><span class="vk-gs-num">${totalPlaycount.toLocaleString()}</span><span class="vk-gs-lbl">Totale Plays</span></div>
        </div>
        <div class="vk-genre-artist-list">`;

      artists.forEach(a => {
        const bg    = gradientFor(a.name);
        const cover = a.coverUrl
          ? `<img class="vk-ga-img" src="${esc(a.coverUrl)}" alt="${esc(a.name)}" loading="lazy"
               onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">`
          : '';
        const ph = `<div class="vk-ga-ph" style="${a.coverUrl?'display:none;':''}background:${bg}">${initials(a.name)}</div>`;

        const albumPills = (a.albums || []).slice(0, 4).map(alb =>
          `<span class="vk-ga-album">${esc(alb.title)}</span>`
        ).join('');

        const playbar = a.playcount
          ? `<div class="vk-ga-playbar" title="${a.playcount.toLocaleString()} plays">
               <div class="vk-ga-playbar-fill" style="width:${Math.min(100, Math.round(a.playcount / Math.max(1, artists[0].playcount) * 100))}%"></div>
             </div>`
          : '';

        html += `<div class="vk-genre-artist-row artist-link" data-artist="${esc(a.name)}">
          <div class="vk-ga-thumb">${cover}${ph}</div>
          <div class="vk-ga-info">
            <div class="vk-ga-name">${esc(a.name)}</div>
            <div class="vk-ga-albums">${albumPills}</div>
            ${playbar}
          </div>
          <div class="vk-ga-plays">${a.playcount ? a.playcount.toLocaleString() : '—'}</div>
        </div>`;
      });

      body.innerHTML = html + `</div>`;
    })
    .catch(() => {
      // Fallback: sampleArtists
      body.innerHTML = `<div class="vk-modal-artist-grid">${
        (entry.sampleArtists || []).map(name =>
          `<div class="vk-modal-artist-card artist-link" data-artist="${esc(name)}">
            <div class="vk-modal-artist-ph" style="background:${gradientFor(name)}">${initials(name)}</div>
            <div class="vk-modal-artist-name">${esc(name)}</div>
          </div>`
        ).join('')
      }</div>`;
    });
}

// ── Verkenner hoofdrenderer ──────────────────────────────────────────────────
async function renderVerkennerTab() {
  // Structuur: 5 collapsible secties
  let html = `
  <div class="vk-page">

    <!-- Sectie 1: Undiscovered Albums -->
    <div class="vk-section" id="vk-undiscovered">
      ${sectionHeader('Ontbrekende Albums', '📀', 'undiscovered')}
      <p class="vk-section-desc">Albums van jouw top-artiesten die in MusicBrainz staan maar niet in je Plex-bibliotheek.</p>
      <div class="vk-section-body" id="vk-body-undiscovered"></div>
    </div>

    <!-- Sectie 2: New In Your Genres -->
    <div class="vk-section" id="vk-genres-new">
      ${sectionHeader('Nieuw in jouw genres', '🎸', 'genres_new')}
      <p class="vk-section-desc">Albums die passen bij de genres die je al in Plex hebt, maar die je nog mist.</p>
      <div class="vk-section-body" id="vk-body-genres-new"></div>
    </div>

    <!-- Sectie 3: From Your Labels -->
    <div class="vk-section" id="vk-labels">
      ${sectionHeader('Van jouw labels / tags', '🏷️', 'labels')}
      <p class="vk-section-desc">Gegroepeerd op muzikale stijl: releases die bij jouw collectie-DNA passen.</p>
      <div class="vk-section-body" id="vk-body-labels"></div>
    </div>

    <!-- Sectie 4: Deep Cuts -->
    <div class="vk-section" id="vk-deep-cuts">
      ${sectionHeader('Deep Cuts', '🎵', 'deep_cuts')}
      <p class="vk-section-desc">Albums van artiesten die je luistert, maar die je waarschijnlijk al een tijdje niet gehoord hebt.</p>
      <div class="vk-section-body" id="vk-body-deep-cuts"></div>
    </div>

    <!-- Sectie 5: Genre Explorer -->
    <div class="vk-section vk-section--hero" id="vk-genre-explorer">
      ${sectionHeader('Genre Explorer', '🗺️', 'genre_explorer')}
      <p class="vk-section-desc">Alle genres in je bibliotheek. Klik op een genre om de artiesten te bekijken.</p>
      <div class="vk-section-body" id="vk-body-genre-explorer"></div>
    </div>

  </div>`;

  setContent(html);

  // Laad alle secties parallel
  await Promise.allSettled([
    renderUndiscovered(document.getElementById('vk-body-undiscovered')),
    renderGenresNew(document.getElementById('vk-body-genres-new')),
    renderLabels(document.getElementById('vk-body-labels')),
    renderDeepCuts(document.getElementById('vk-body-deep-cuts')),
    renderGenreExplorer(document.getElementById('vk-body-genre-explorer')),
  ]);

  // Refresh-knoppen per sectie
  contentEl.addEventListener('click', async e => {
    const btn = e.target.closest('.vk-section-refresh');
    if (!btn) return;
    const type = btn.dataset.vkRefresh;
    // Invalidate via post
    try { await apiFetch('/api/discover/cache-refresh', { method: 'POST' }); } catch {}
    // Herlaad alleen de betreffende sectie
    const bodyMap = {
      undiscovered: ['vk-body-undiscovered', renderUndiscovered],
      genres_new:   ['vk-body-genres-new',   renderGenresNew],
      labels:       ['vk-body-labels',        renderLabels],
      deep_cuts:    ['vk-body-deep-cuts',     renderDeepCuts],
      genre_explorer: ['vk-body-genre-explorer', renderGenreExplorer],
    };
    if (bodyMap[type]) {
      const [id, fn] = bodyMap[type];
      const el = document.getElementById(id);
      if (el) await fn(el);
    }
  });
}

// ────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT: loadOntdek
// ────────────────────────────────────────────────────────────────────────────
export async function loadOntdek() {
  state.activeView = 'ontdek';
  hideTidarrUI();
  stopTidarrQueuePolling();

  // Render tab bar + toolbar
  let html = `<div class="ontdek-controls" style="padding:12px;border-bottom:1px solid var(--border);background:var(--bg2);display:flex;gap:8px;align-items:center;flex-wrap:wrap">
    <div style="display:flex;gap:4px">
      <button class="ontdek-tab-btn active" data-tab="recs" style="padding:8px 16px;border:none;background:transparent;cursor:pointer;border-bottom:2px solid transparent">🎯 Aanbevelingen</button>
      <button class="ontdek-tab-btn" data-tab="releases" style="padding:8px 16px;border:none;background:transparent;cursor:pointer;border-bottom:2px solid transparent">💿 Releases</button>
      <button class="ontdek-tab-btn" data-tab="discover" style="padding:8px 16px;border:none;background:transparent;cursor:pointer;border-bottom:2px solid transparent">🔭 Ontdek</button>
      <button class="ontdek-tab-btn" data-tab="verkenner" style="padding:8px 16px;border:none;background:transparent;cursor:pointer;border-bottom:2px solid transparent">🔍 Verkenner</button>
    </div>`;

  if (state.spotifyEnabled) {
    html += `<span style="flex:1"></span><span style="font-size:12px;color:var(--muted)">Mood:</span>
      <button class="mood-btn" data-mood="energiek" style="padding:6px 12px">⚡</button>
      <button class="mood-btn" data-mood="chill" style="padding:6px 12px">🌊</button>
      <button class="mood-btn" data-mood="melancholisch" style="padding:6px 12px">🌧</button>
      <button class="mood-btn" data-mood="experimenteel" style="padding:6px 12px">🔬</button>
      <button class="mood-btn" data-mood="feest" style="padding:6px 12px">🎉</button>`;
  }

  html += `</div><div style="padding:12px;border-bottom:1px solid var(--border);background:var(--bg2);display:flex;gap:8px;flex-wrap:wrap">
    <button class="tool-btn ontdek-filter" data-filter="all" data-for="recs" style="display:none">Alle</button>
    <button class="tool-btn ontdek-filter" data-filter="new" data-for="recs" style="display:none">✦ Nieuw</button>
    <button class="tool-btn ontdek-filter" data-filter="plex" data-for="recs" style="display:none">▶ In Plex</button>
    <button class="tool-btn ontdek-filter" data-filter="all" data-for="releases" style="display:none">Alle</button>
    <button class="tool-btn ontdek-filter" data-filter="album" data-for="releases" style="display:none">Albums</button>
    <button class="tool-btn ontdek-filter" data-filter="single" data-for="releases" style="display:none">Singles</button>
    <button class="tool-btn ontdek-filter" data-filter="ep" data-for="releases" style="display:none">EP's</button>
    <button class="tool-btn ontdek-sort" data-sort="date" data-for="releases" style="display:none">Datum</button>
    <button class="tool-btn ontdek-sort" data-sort="listening" data-for="releases" style="display:none">Luistergedrag</button>
    <button class="tool-btn ontdek-filter" data-filter="all" data-for="discover" style="display:none">Alle</button>
    <button class="tool-btn ontdek-filter" data-filter="new" data-for="discover" style="display:none">✦ Nieuw</button>
    <button class="tool-btn ontdek-filter" data-filter="partial" data-for="discover" style="display:none">Gedeeltelijk</button>
    <span style="flex:1"></span>
    <button class="tool-btn refresh-btn" id="ontdek-refresh" style="padding:8px 12px">↻ Vernieuwen</button>
  </div>`;

  contentEl.innerHTML = html;
  contentEl.style.opacity = '1';
  contentEl.style.transform = '';

  // Event delegation for tabs, filters, sort, refresh
  contentEl.addEventListener('click', async e => {
    const tabBtn = e.target.closest('.ontdek-tab-btn');
    if (tabBtn) {
      e.preventDefault();
      await ontdekSwitchTab(tabBtn.dataset.tab);
      return;
    }

    const filterBtn = e.target.closest('.ontdek-filter');
    if (filterBtn) {
      const forTab = filterBtn.dataset.for;
      const filterVal = filterBtn.dataset.filter;
      if (forTab === 'recs') { recsFilter = filterVal; applyRecsFilter(); }
      else if (forTab === 'releases') { releasesFilter = filterVal; renderReleasesTab(); }
      else if (forTab === 'discover') { discFilter = filterVal; renderDiscoverTab(); }
      document.querySelectorAll(`.ontdek-filter[data-for="${forTab}"]`).forEach(b => b.classList.toggle('active', b === filterBtn));
      return;
    }

    const sortBtn = e.target.closest('.ontdek-sort');
    if (sortBtn) {
      releasesSort = sortBtn.dataset.sort;
      renderReleasesTab();
      document.querySelectorAll('.ontdek-sort').forEach(b => b.classList.toggle('active', b === sortBtn));
      return;
    }

    if (e.target.id === 'ontdek-refresh') {
      if (ontdekCurrentTab === 'recs') { invalidate('recs'); recsData = null; renderRecsTab(); }
      else if (ontdekCurrentTab === 'releases') { invalidate('releases'); releasesData = null;  renderReleasesTab(); }
      else if (ontdekCurrentTab === 'discover') {
        invalidate('discover');
        discoverData = null;
        _discoverCache = null;
        _stopDiscoverPolling();
        try { await Promise.allSettled([
          p('/api/core/discover/refresh', { method: 'POST' }),
          p('/api/genres/refresh',   { method: 'POST' }),
        ]); } catch {}
        renderDiscoverTab();
      }
      else if (ontdekCurrentTab === 'verkenner') { try { await apiFetch('/api/discover/cache-refresh', { method: 'POST' }); } catch (e) {} renderVerkennerTab(); }
    }
  });

  // Spotify mood buttons
  document.querySelectorAll('.mood-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.activeMood = btn.dataset.mood;
      await loadSpotifyRecs(state.activeMood);
    });
  });

  // Load first tab
  await ontdekSwitchTab(ontdekCurrentTab);
}
