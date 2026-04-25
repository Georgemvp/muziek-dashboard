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

// ────────────────────────────────────────────────────────────────────────────
// MODULE STATE
// ────────────────────────────────────────────────────────────────────────────
let ontdekCurrentTab = localStorage.getItem('ontdekTab') || 'recs';
let recsData = null;
let releasesData = null;
let discoverData = null;
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
  showLoading();
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
        <div class="rec-photo" id="rph-${i}">
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
  showLoading();
  try {
    if (!releasesData) {
      let d = getCached('releases', 5 * 60 * 1000);
      if (!d) {
        d = await apiFetch('/api/releases');
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
// DISCOVER TAB
// ────────────────────────────────────────────────────────────────────────────
async function renderDiscoverTab() {
  showLoading('Ontdekkingen ophalen...');
  try {
    if (!discoverData) {
      let d = getCached('discover', 5 * 60 * 1000);
      if (!d) {
        d = await apiFetch('/api/discover');
        if (d.status === 'building') {
          setContent(`<div class="loading"><div class="spinner"></div><div>${esc(d.message)}</div>
            <div class="build-hint">Pagina ververst automatisch over 20 seconden</div></div>`);
          setTimeout(() => { if (state.activeView === 'ontdek') renderDiscoverTab(); }, 20000);
          return;
        }
        setCache('discover', d);
      }
      discoverData = d;
      if (d.plexConnected) state.plexOk = true;
    }

    const { artists, basedOn } = discoverData;
    let filtered = artists;
    if (discFilter === 'new') filtered = artists.filter(a => !a.inPlex);
    if (discFilter === 'partial') filtered = artists.filter(a => a.inPlex && a.missingCount > 0);
    if (!filtered.length) { setContent('<div class="empty">Geen artiesten voor dit filter.</div>'); return; }

    const totalMissing = filtered.reduce((s, a) => s + a.missingCount, 0);
    let html = `<div class="section-title">Gebaseerd op: ${(basedOn||[]).slice(0,3).join(', ')}
      &nbsp;·&nbsp; <span style="color:var(--new)">${totalMissing} albums te ontdekken</span></div><div class="discover-grid">`;

    filtered.forEach((a, i) => {
      const pct = Math.round(a.match * 100);
      const meta = [countryFlag(a.country), a.country, a.startYear ? `Actief vanaf ${a.startYear}` : null,
        a.totalAlbums ? `${a.totalAlbums} studio-albums` : null].filter(Boolean).join(' · ');
      const img = proxyImg(a.image, 120) || a.image;
      const photo = img
        ? `<img class="discover-photo" src="${esc(img)}" alt="${esc(a.name)}" loading="lazy" decoding="async"
           onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
         <div class="discover-photo-ph" style="display:none;background:${gradientFor(a.name, true)}">${initials(a.name)}</div>`
        : `<div class="discover-photo-ph" style="background:${gradientFor(a.name, true)}">${initials(a.name)}</div>`;
      const albCount = a.albums?.length || 0;
      const albLabel = `${albCount} album${albCount !== 1 ? 's' : ''}`;
      html += `<div class="discover-section collapsed" id="disc-${i}">
        <div class="discover-card discover-card-toggle">
          <div class="discover-card-top">${photo}<div class="discover-card-info">
            <div class="discover-card-name"><span class="artist-link" data-artist="${esc(a.name)}">${esc(a.name)}</span>${plexBadge(a.inPlex)}</div>
            <div class="discover-card-sub">Vergelijkbaar met <strong>${esc(a.reason)}</strong></div></div>
            <span class="discover-match">${pct}%</span>${bookmarkBtn('artist', a.name, '', a.image || '')}</div>
          ${meta ? `<div class="discover-meta">${esc(meta)}</div>` : ''}${tagsHtml(a.tags, 3)}
          ${a.missingCount > 0 ? `<div class="discover-missing">✦ ${a.missingCount} ${a.missingCount === 1 ? 'album' : 'albums'} te ontdekken</div>`
          : `<div style="font-size:11px;color:var(--plex);margin-top:4px">▶ Volledig in Plex</div>`}
          <button class="disc-toggle-btn collapsed" data-disc-id="disc-${i}" data-album-count="${albCount}"
            title="Toon/verberg albums" aria-label="Albums tonen/verbergen">Toon ${albLabel}</button>
          ${a.albums?.length ? `<div class="discover-preview-row">${a.albums.slice(0, 5).map(alb => {
            const bg = gradientFor(alb.title || '');
            return alb.coverUrl
              ? `<img class="discover-preview-thumb" src="${esc(alb.coverUrl)}" alt="${esc(alb.title)}" loading="lazy" decoding="async"
                 onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
               <div class="discover-preview-ph" style="display:none;background:${bg}">${initials(alb.title || '?')}</div>`
              : `<div class="discover-preview-ph" style="background:${bg}">${initials(alb.title || '?')}</div>`;
          }).join('')}${a.albums.length > 5 ? `<div class="discover-preview-more">+${a.albums.length - 5}</div>` : ''}</div>` : ''}</div>
        <div class="discover-albums-wrap">`;
      if (a.albums?.length) {
        html += `<div class="album-grid">`;
        a.albums.forEach(alb => { html += albumCard(alb, true, a.name); });
        html += `</div>`;
      } else {
        html += `<div style="font-size:13px;color:var(--muted2);padding:8px 0">Albums nog niet beschikbaar.</div>`;
      }
      html += `</div></div>`;
    });

    setContent(html + '</div>');

    // Setup discover toggle delegation
    contentEl.addEventListener('click', e => {
      const toggleBtn = e.target.closest('.disc-toggle-btn');
      if (!toggleBtn) return;
      e.stopPropagation();
      const section = toggleBtn.closest('.discover-section');
      if (!section) return;
      const id = section.id;
      const isCollapsed = section.classList.contains('collapsed');
      section.classList.toggle('collapsed');
      toggleBtn.classList.toggle('collapsed', !isCollapsed);
      toggleBtn.classList.toggle('expanded', isCollapsed);
      const count = toggleBtn.dataset.albumCount;
      toggleBtn.textContent = isCollapsed
        ? `Verberg ${count} album${count != 1 ? 's' : ''}`
        : `Toon ${count} album${count != 1 ? 's' : ''}`;
    });
  } catch (e) { if (e.name !== 'AbortError') showError(e.message); }
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
      else if (ontdekCurrentTab === 'releases') { invalidate('releases'); releasesData = null; try { await p('/api/releases/refresh', { method: 'POST' }); } catch (e) {} renderReleasesTab(); }
      else if (ontdekCurrentTab === 'discover') { invalidate('discover'); discoverData = null; try { await p('/api/discover/refresh', { method: 'POST' }); } catch (e) {} renderDiscoverTab(); }
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
