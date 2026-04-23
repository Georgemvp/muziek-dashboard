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

// ── Spotify ───────────────────────────────────────────────────────────────
export async function checkSpotifyStatus() {
  try {
    const data = await apiFetch('/api/spotify/status');
    state.spotifyEnabled = !!data.enabled;
    const tb = document.getElementById('tb-mood');
    if (state.spotifyEnabled && state.activeView === 'ontdek') {
      tb.style.display = ''; tb.classList.add('visible');
    } else if (state.spotifyEnabled) {
      tb.style.display = '';
    }
  } catch { state.spotifyEnabled = false; }
}

export function spotifyCard(t, idx) {
  const imgEl = t.image
    ? `<img src="${esc(t.image)}" alt="" loading="lazy"
         onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
       <div class="spotify-cover-ph" style="display:none">♪</div>`
    : `<div class="spotify-cover-ph">♪</div>`;
  const playBtn = t.preview_url
    ? `<button class="spotify-play-btn" data-spotify-preview="${esc(t.preview_url)}"
         data-artist="${esc(t.artist)}" data-track="${esc(t.name)}"
         id="spbtn-${idx}" title="Luister preview">▶</button>` : '';
  const spotifyLink = t.spotify_url
    ? `<a class="spotify-link-btn" href="${esc(t.spotify_url)}" target="_blank" rel="noopener">♫ Open in Spotify</a>` : '';
  return `
    <div class="spotify-card">
      <div class="spotify-cover">
        ${imgEl}${playBtn}
        <div class="play-bar" style="position:absolute;bottom:0;left:0;width:100%;height:3px;background:rgba(0,0,0,0.3)">
          <div class="play-bar-fill" id="spbar-${idx}"></div>
        </div>
      </div>
      <div class="spotify-info">
        <div class="spotify-track" title="${esc(t.name)}">${esc(t.name)}</div>
        <div class="spotify-artist artist-link" data-artist="${esc(t.artist)}">${esc(t.artist)}</div>
        <div class="spotify-album" title="${esc(t.album)}">${esc(t.album)}</div>
        ${spotifyLink}
      </div>
    </div>`;
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
    // Haal Spotify recs uit cache (TTL: 5 minuten)
    const spotifyCacheKey = `spotify:${mood}`;
    let tracks = getCached(spotifyCacheKey, 5 * 60 * 1000);
    if (!tracks) {
      tracks = await apiFetch(`/api/spotify/recs?mood=${encodeURIComponent(mood)}`);
      setCache(spotifyCacheKey, tracks);
    }

    if (!tracks.length) {
      section.innerHTML = `<div class="empty">Geen Spotify-aanbevelingen gevonden voor deze mood.</div>`;
      return;
    }
    let html = `
      <div class="spotify-section-title">🎯 Spotify aanbevelingen · ${esc(moodLabels[mood] || mood)}</div>
      <div class="spotify-grid">`;
    tracks.forEach((t, i) => { html += spotifyCard(t, i); });
    html += '</div>';
    section.innerHTML = html;
  } catch { section.innerHTML = ''; }
}

export function clearSpotifyRecs() {
  const section = document.getElementById('spotify-recs-section');
  if (section) section.innerHTML = '';
}

// Statische mood-toolbar knoppen (legacy extern toolbar)
document.querySelectorAll('.mood-btn').forEach(btn => {
  btn.addEventListener('click', async () => {
    const mood = btn.dataset.mood;
    document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('sel-mood', 'loading'));
    if (state.activeMood === mood) {
      state.activeMood = null;
      clearSpotifyRecs();
      document.getElementById('btn-clear-mood').style.display  = 'none';
      document.getElementById('mood-sep-clear').style.display  = 'none';
      return;
    }
    state.activeMood = mood;
    btn.classList.add('sel-mood', 'loading');
    document.getElementById('btn-clear-mood').style.display  = '';
    document.getElementById('mood-sep-clear').style.display  = '';
    await loadSpotifyRecs(mood);
    btn.classList.remove('loading');
  });
});

document.getElementById('btn-clear-mood')?.addEventListener('click', () => {
  state.activeMood = null;
  document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('sel-mood'));
  document.getElementById('btn-clear-mood').style.display  = 'none';
  document.getElementById('mood-sep-clear').style.display  = 'none';
  clearSpotifyRecs();
});

// Spotify play-preview event delegation
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

// ── Aanbevelingen ─────────────────────────────────────────────────────────
export async function loadRecs() {
  showLoading();
  const signal = state.tabAbort?.signal;
  try {
    // Haal /api/recs uit cache (TTL: 5 minuten)
    let d = getCached('recs', 5 * 60 * 1000);
    const isCached = d !== null;
    if (!isCached) {
      // Gebruik fetchOnce voor deduplicatie (dashboard widget kan dit ook ophalen)
      d = await fetchOnce('/api/recs');
      if (signal?.aborted) return;
      setCache('recs', d);
    }

    const recs      = d.recommendations || [];
    const albumRecs = d.albumRecs        || [];
    const trackRecs = d.trackRecs        || [];
    state.plexOk = d.plexConnected || state.plexOk;
    state.lastRecs = d;  // Bewaar in state voor persistentie
    if (d.plexConnected && d.plexArtistCount) {
      const dot = document.getElementById('plex-dot');
      const text = document.getElementById('plex-status-text');
      if (dot) dot.classList.toggle('connected', true);
      if (text) text.textContent = `Plex · ${fmt(d.plexArtistCount)} artiesten`;
    }
    if (!recs.length) { setContent('<div class="empty">Geen aanbevelingen gevonden.</div>'); return; }

    const newC  = recs.filter(r => !r.inPlex).length;
    const plexC = recs.filter(r =>  r.inPlex).length;
    const titleRecs = document.getElementById('hdr-title-recs');
    if (titleRecs) titleRecs.textContent = `🎯 Aanbevelingen · ${recs.length} artiesten`;

    let html = `<div class="spotify-section" id="spotify-recs-section"></div>`;
    html += `<div class="section-title">Gebaseerd op jouw smaak: ${(d.basedOn||[]).slice(0,3).join(', ')}
      ${state.plexOk ? ` &nbsp;·&nbsp; <span style="color:var(--new)">${newC} nieuw</span> · <span style="color:var(--plex)">${plexC} in Plex</span>` : ''}
      </div><div class="rec-grid">`;

    for (let i = 0; i < recs.length; i++) {
      const r = recs[i];
      const pct = Math.round(r.match * 100);
      html += `
        <div class="rec-card" data-inplex="${r.inPlex}" id="rc-${i}">
          <div class="rec-photo" id="rph-${i}">
            <div class="rec-photo-ph" style="background:${gradientFor(r.name)}">${initials(r.name)}</div>
          </div>
          <div class="rec-body">
            <div class="rec-header">
              <div class="rec-title-row">
                <span class="rec-name artist-link" data-artist="${esc(r.name)}">${esc(r.name)}</span>
                ${plexBadge(r.inPlex)}
              </div>
              <span class="rec-match">${pct}%</span>
            </div>
            <div class="rec-reason">Vergelijkbaar met ${esc(r.reason)}</div>
            <div id="rtags-${i}"></div>
            <div id="ralb-${i}"><div class="rec-loading">Albums laden…</div></div>
          </div>
        </div>`;
    }
    html += '</div>';

    if (albumRecs.length) {
      html += `<div class="section-title" style="margin-top:2rem">Aanbevolen Albums</div>
        <div class="albrec-grid">`;
      for (const a of albumRecs) {
        const albrecImgSrc = proxyImg(a.image, 80) || a.image;
        const imgEl = albrecImgSrc
          ? `<img class="albrec-img" src="${esc(albrecImgSrc)}" alt="" loading="lazy"
               onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
             <div class="albrec-ph" style="display:none;background:${gradientFor(a.album)}">${initials(a.album)}</div>`
          : `<div class="albrec-ph" style="background:${gradientFor(a.album)}">${initials(a.album)}</div>`;
        const badge = state.plexOk
          ? (a.inPlex
            ? `<span class="badge plex" style="font-size:9px;margin-top:4px">▶ In Plex</span>`
            : `<span class="badge new" style="font-size:9px;margin-top:4px">✦ Nieuw</span>`)
          : '';
        html += `
          <div class="albrec-card">
            <div class="albrec-cover">${imgEl}</div>
            <div class="albrec-info">
              <div class="albrec-title">${esc(a.album)}</div>
              <div class="albrec-artist artist-link" data-artist="${esc(a.artist)}">${esc(a.artist)}</div>
              <div class="albrec-reason">via ${esc(a.reason)}</div>
              ${badge}${downloadBtn(a.artist, a.album, a.inPlex)}
            </div>
          </div>`;
      }
      html += '</div>';
    }

    if (trackRecs.length) {
      html += `<div class="section-title" style="margin-top:2rem">Aanbevolen Nummers</div>
        <div class="trackrec-list">`;
      for (const t of trackRecs) {
        const playsHtml = t.playcount > 0
          ? `<span class="trackrec-plays">${fmt(t.playcount)}×</span>` : '';
        const linkHtml = t.url
          ? `<a class="trackrec-link" href="${esc(t.url)}" target="_blank" rel="noopener">Last.fm ↗</a>` : '';
        html += `
          <div class="trackrec-row">
            <div class="trackrec-info">
              <div class="trackrec-title">${esc(t.track)}</div>
              <div class="trackrec-artist artist-link" data-artist="${esc(t.artist)}">${esc(t.artist)}</div>
              <div class="trackrec-reason">via ${esc(t.reason)}</div>
            </div>
            <div class="trackrec-meta">${playsHtml}${linkHtml}</div>
          </div>`;
      }
      html += '</div>';
    }

    setContent(html, () => { if (state.activeMood) loadSpotifyRecs(state.activeMood); });
    applyRecsFilter();

    const previewEl = document.getElementById('sec-recs-preview');
    if (previewEl) {
      const previewItems = recs.slice(0, 8);
      previewEl.innerHTML = `<div class="collapsed-thumbs">${previewItems.map((r, i) =>
        `<div class="collapsed-thumb collapsed-thumb-round" id="recs-thumb-${i}" style="background:${gradientFor(r.name)}">
          <span class="collapsed-thumb-ph">${initials(r.name)}</span>
        </div>`
      ).join('')}${recs.length > 8 ? `<span class="collapsed-thumbs-more">+${recs.length - 8}</span>` : ''}</div>`;
      previewItems.forEach(async (r, i) => {
        try {
          const info = await apiFetch(`/api/artist/${encodeURIComponent(r.name)}/info`);
          const el = document.getElementById(`recs-thumb-${i}`);
          if (el && info.image) el.innerHTML = `<img src="${esc(proxyImg(info.image, 48) || info.image)}" alt="" loading="lazy" onerror="this.remove()">`;
        } catch {}
      });
    }

    recs.forEach(async (r, i) => {
      try {
        const info = await apiFetch(`/api/artist/${encodeURIComponent(r.name)}/info`);
        const ph = document.getElementById(`rph-${i}`);
        if (ph && info.image) ph.innerHTML = `<img src="${proxyImg(info.image, 120) || info.image}" alt="" loading="lazy"
          onerror="this.parentElement.innerHTML='<div class=\\'rec-photo-ph\\' style=\\'background:${gradientFor(r.name)}\\'>${initials(r.name)}</div>'">`;
        const tagsEl = document.getElementById(`rtags-${i}`);
        if (tagsEl) tagsEl.innerHTML = tagsHtml(info.tags, 3) + `<div style="height:6px"></div>`;
        const albEl = document.getElementById(`ralb-${i}`);
        if (albEl) {
          const albums = (info.albums || []).slice(0, 4);
          if (albums.length) {
            let ah = '<div class="rec-albums-label">Bekende albums</div><div class="rec-albums-list">';
            for (const a of albums) {
              const imgEl = a.image
                ? `<img class="rec-album-img" src="${proxyImg(a.image, 48) || a.image}" alt="" loading="lazy">` : `<div class="rec-album-ph">♪</div>`;
              const plexMark = state.plexOk && a.inPlex ? `<span class="rec-album-plex">▶</span>` : '';
              ah += `<div class="rec-album-row">${imgEl}<span class="rec-album-name">${esc(a.name)}</span>${plexMark}${downloadBtn(r.name, a.name, a.inPlex)}</div>`;
            }
            albEl.innerHTML = ah + '</div>';
          } else { albEl.innerHTML = ''; }
        }
      } catch { const albEl = document.getElementById(`ralb-${i}`); if (albEl) albEl.innerHTML = ''; }
    });
  } catch (e) { if (e.name === 'AbortError') return; showError(e.message); }
}

export function applyRecsFilter() {
  document.querySelectorAll('.rec-card[data-inplex]').forEach(card => {
    const inPlex = card.dataset.inplex === 'true';
    let show = true;
    if (state.recsFilter === 'new')  show = !inPlex;
    if (state.recsFilter === 'plex') show = inPlex;
    card.classList.toggle('hidden', !show);
  });
}

// ── Nieuwe Releases ───────────────────────────────────────────────────────
export function updateReleasesBadge(count) {
  const badge = document.getElementById('badge-releases');
  if (!badge) return;
  if (count > 0) { badge.textContent = count; badge.style.display = ''; }
  else           { badge.style.display = 'none'; }
}

export function relativeDate(dateStr) {
  if (!dateStr) return '';
  const rel = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now - rel) / 86_400_000);
  if (diffDays === 0) return 'vandaag';
  if (diffDays === 1) return 'gisteren';
  if (diffDays < 7)  return `${diffDays} dagen geleden`;
  return rel.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' });
}

export async function loadReleases() {
  showLoading();
  const signal = state.tabAbort?.signal;
  try {
    // Haal /api/releases uit cache (TTL: 5 minuten)
    let d = getCached('releases', 5 * 60 * 1000);
    if (!d) {
      d = await apiFetch('/api/releases', { signal });
      if (signal?.aborted) return;
      setCache('releases', d);
    }
    if (d.status === 'building') {
      setContent(`<div class="loading"><div class="spinner"></div>
        <div>${esc(d.message)}</div>
        <div class="build-hint">Pagina ververst automatisch over 5 seconden</div></div>`);
      setTimeout(() => {
        if (state.activeView === 'ontdek') loadReleases();
      }, 5_000);
      return;
    }
    state.lastReleases = d.releases || [];
    state.newReleaseIds = new Set(d.newReleaseIds || []);
    updateReleasesBadge(d.newCount || 0);
    renderReleases();
  } catch (e) { if (e.name === 'AbortError') return; showError(e.message); }
}

export function renderReleases() {
  const releases = state.lastReleases || [];
  if (!releases.length) {
    setContent('<div class="empty">Geen recente releases gevonden (afgelopen 30 dagen).</div>'); return;
  }
  let filtered = releases;
  if (state.releasesFilter !== 'all')
    filtered = releases.filter(r => (r.type || 'album').toLowerCase() === state.releasesFilter);
  if (!filtered.length) {
    setContent(`<div class="empty">Geen ${state.releasesFilter === 'ep' ? "EP's" : state.releasesFilter + 's'} gevonden voor dit filter.</div>`);
    return;
  }
  if (state.releasesSort === 'listening') {
    filtered = [...filtered].sort((a, b) =>
      ((b.artistPlaycount || 0) - (a.artistPlaycount || 0)) || (new Date(b.releaseDate) - new Date(a.releaseDate)));
  } else {
    filtered = [...filtered].sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate));
  }

  const titleReleases = document.getElementById('hdr-title-releases');
  if (titleReleases) titleReleases.textContent =
    `💿 Nieuwe Releases · ${filtered.length} release${filtered.length !== 1 ? 's' : ''}`;

  const typeLabel      = t => ({ album: 'Album', single: 'Single', ep: 'EP' })[t?.toLowerCase()] || (t || 'Album');
  const typeBadgeClass = t => ({ album: 'rel-type-album', single: 'rel-type-single', ep: 'rel-type-ep' })[t?.toLowerCase()] || 'rel-type-album';

  let html = `<div class="section-title">${filtered.length} release${filtered.length !== 1 ? 's' : ''} in de afgelopen 30 dagen</div>
    <div class="releases-grid">`;

  for (const r of filtered) {
    const isNew = state.newReleaseIds.has(`${r.artist}::${r.album}`);
    const imgEl = r.image
      ? `<img class="rel-img" src="${esc(r.image)}" alt="" loading="lazy"
           onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
         <div class="rel-ph" style="display:none;background:${gradientFor(r.album)}">${initials(r.album)}</div>`
      : `<div class="rel-ph" style="background:${gradientFor(r.album)}">${initials(r.album)}</div>`;
    const absDate  = r.releaseDate
      ? new Date(r.releaseDate).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' }) : '';
    const relDate  = relativeDate(r.releaseDate);
    const dateHtml = absDate
      ? `<div class="rel-date">${absDate} <span class="rel-date-rel">(${relDate})</span></div>` : '';
    const plexStatus = state.plexOk
      ? (r.inPlex
        ? `<span class="badge plex" style="font-size:9px">▶ In Plex</span>`
        : (r.artistInPlex ? `<span class="badge new" style="font-size:9px">✦ Artiest in Plex</span>` : ''))
      : '';
    const deezerLink = r.deezerUrl
      ? `<a class="rel-deezer-link" href="${esc(r.deezerUrl)}" target="_blank" rel="noopener">Deezer ↗</a>` : '';
    html += `
      <div class="rel-card${isNew ? ' rel-card-new' : ''}">
        <div class="rel-cover">${imgEl}</div>
        <div class="rel-info">
          <span class="rel-type-badge ${typeBadgeClass(r.type)}">${typeLabel(r.type)}</span>
          <div class="rel-album">${esc(r.album)}</div>
          <div class="rel-artist artist-link" data-artist="${esc(r.artist)}">${esc(r.artist)}</div>
          ${dateHtml}
          <div class="rel-footer">${plexStatus}${deezerLink}${downloadBtn(r.artist, r.album, r.inPlex)}</div>
        </div>
      </div>`;
  }
  setContent(html + '</div>');

  const previewEl = document.getElementById('sec-releases-preview');
  if (previewEl) {
    const previewItems = filtered.slice(0, 8);
    previewEl.innerHTML = `<div class="collapsed-thumbs">${previewItems.map(r => {
      if (r.image) return `<div class="collapsed-thumb">
          <img src="${esc(r.image)}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
          <span class="collapsed-thumb-ph" style="display:none;background:${gradientFor(r.album)}">${initials(r.album)}</span>
        </div>`;
      return `<div class="collapsed-thumb" style="background:${gradientFor(r.album)}"><span class="collapsed-thumb-ph">${initials(r.album)}</span></div>`;
    }).join('')}${filtered.length > 8 ? `<span class="collapsed-thumbs-more">+${filtered.length - 8}</span>` : ''}</div>`;
  }
}

// ── Discover ──────────────────────────────────────────────────────────────
export async function loadDiscover() {
  showLoading('Ontdekkingen ophalen...');
  const signal = state.tabAbort?.signal;
  try {
    // Haal /api/discover uit cache (TTL: 5 minuten)
    let d = getCached('discover', 5 * 60 * 1000);
    if (!d) {
      d = await apiFetch('/api/discover', { signal });
      if (signal?.aborted) return;
      setCache('discover', d);
    }
    if (d.status === 'building') {
      setContent(`<div class="loading"><div class="spinner"></div>
        <div>${esc(d.message)}</div>
        <div class="build-hint">Pagina ververst automatisch over 20 seconden</div></div>`);
      setTimeout(() => {
        if (state.activeView === 'ontdek') loadDiscover();
      }, 20_000);
      return;
    }
    state.lastDiscover = d;
    if (d.plexConnected) state.plexOk = true;
    renderDiscover();
  } catch (e) { if (e.name === 'AbortError') return; showError(e.message); }
}

export function renderDiscover() {
  if (!state.lastDiscover) return;
  const { artists, basedOn } = state.lastDiscover;
  if (!artists?.length) { setContent('<div class="empty">Geen ontdekkingen gevonden.</div>'); return; }
  let filtered = artists;
  if (state.discFilter === 'new')     filtered = artists.filter(a => !a.inPlex);
  if (state.discFilter === 'partial') filtered = artists.filter(a => a.inPlex && a.missingCount > 0);
  if (!filtered.length) { setContent('<div class="empty">Geen artiesten voor dit filter.</div>'); return; }

  const titleDiscover = document.getElementById('hdr-title-discover');
  if (titleDiscover) titleDiscover.textContent = `🔭 Ontdek Artiesten · ${filtered.length} artiesten`;

  const totalMissing = filtered.reduce((s, a) => s + a.missingCount, 0);
  let html = `<div class="section-title">Gebaseerd op: ${(basedOn||[]).slice(0,3).join(', ')}
    &nbsp;·&nbsp; <span style="color:var(--new)">${totalMissing} albums te ontdekken</span></div>
    <div class="discover-grid">`;

  for (let i = 0; i < filtered.length; i++) {
    const a = filtered[i];
    const matchPct = Math.round(a.match * 100);
    const meta = [countryFlag(a.country), a.country,
      a.startYear ? `Actief vanaf ${a.startYear}` : null,
      a.totalAlbums ? `${a.totalAlbums} studio-albums` : null
    ].filter(Boolean).join(' · ');
    const discImgSrc = proxyImg(a.image, 120) || a.image;
    const photo = discImgSrc
      ? `<img class="discover-photo" src="${esc(discImgSrc)}" alt="" loading="lazy"
           onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
         <div class="discover-photo-ph" style="display:none;background:${gradientFor(a.name, true)}">${initials(a.name)}</div>`
      : `<div class="discover-photo-ph" style="background:${gradientFor(a.name, true)}">${initials(a.name)}</div>`;
    const albumCount = a.albums?.length || 0;
    const albumLabel = `${albumCount} album${albumCount !== 1 ? 's' : ''}`;
    html += `
      <div class="discover-section collapsed" id="disc-${i}">
        <div class="discover-card discover-card-toggle" data-disc-id="disc-${i}">
          <div class="discover-card-top">
            ${photo}
            <div class="discover-card-info">
              <div class="discover-card-name">
                <span class="artist-link" data-artist="${esc(a.name)}">${esc(a.name)}</span>
                ${plexBadge(a.inPlex)}
              </div>
              <div class="discover-card-sub">Vergelijkbaar met <strong>${esc(a.reason)}</strong></div>
            </div>
            <span class="discover-match">${matchPct}%</span>
            ${bookmarkBtn('artist', a.name, '', a.image || '')}
          </div>
          ${meta ? `<div class="discover-meta">${esc(meta)}</div>` : ''}
          ${tagsHtml(a.tags, 3)}
          ${a.missingCount > 0
            ? `<div class="discover-missing">✦ ${a.missingCount} ${a.missingCount === 1 ? 'album' : 'albums'} te ontdekken</div>`
            : `<div style="font-size:11px;color:var(--plex);margin-top:4px">▶ Volledig in Plex</div>`}
          <button class="disc-toggle-btn collapsed" data-disc-id="disc-${i}" data-album-count="${albumCount}"
            title="Toon/verberg albums" aria-label="Albums tonen/verbergen">Toon ${albumLabel}</button>
          ${a.albums?.length ? `<div class="discover-preview-row">${a.albums.slice(0, 5).map(alb => {
            const bg = gradientFor(alb.title || '');
            return alb.coverUrl
              ? `<img class="discover-preview-thumb" src="${esc(alb.coverUrl)}" alt="${esc(alb.title)}" loading="lazy"
                   title="${esc(alb.title)}${alb.year ? ' ('+alb.year+')' : ''}"
                   onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                 <div class="discover-preview-ph" style="display:none;background:${bg}">${initials(alb.title || '?')}</div>`
              : `<div class="discover-preview-ph" style="background:${bg}">${initials(alb.title || '?')}</div>`;
          }).join('')}${a.albums.length > 5 ? `<div class="discover-preview-more">+${a.albums.length - 5}</div>` : ''}</div>` : ''}
        </div>
        <div class="discover-albums-wrap">`;
    if (a.albums?.length) {
      html += `<div class="album-grid">`;
      for (const alb of a.albums) html += albumCard(alb, true, a.name);
      html += `</div>`;
    } else {
      html += `<div style="font-size:13px;color:var(--muted2);padding:8px 0">Albums nog niet beschikbaar. Vernieuw straks.</div>`;
    }
    html += `</div></div>`;
  }
  html += `</div>`;
  setContent(html);

  const previewEl = document.getElementById('sec-discover-preview');
  if (previewEl) {
    const previewItems = filtered.slice(0, 8);
    previewEl.innerHTML = `<div class="collapsed-thumbs">${previewItems.map(a => {
      if (a.image) return `<div class="collapsed-thumb collapsed-thumb-round">
          <img src="${esc(a.image)}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
          <span class="collapsed-thumb-ph" style="display:none;background:${gradientFor(a.name)}">${initials(a.name)}</span>
        </div>`;
      return `<div class="collapsed-thumb collapsed-thumb-round" style="background:${gradientFor(a.name)}"><span class="collapsed-thumb-ph">${initials(a.name)}</span></div>`;
    }).join('')}${filtered.length > 8 ? `<span class="collapsed-thumbs-more">+${filtered.length - 8}</span>` : ''}</div>`;
  }
}

// ── Collapsible sections state ─────────────────────────────────────────────
export function loadCollapsibleState() {
  try {
    const saved = localStorage.getItem('ontdek-sections');
    if (saved) Object.assign(state.collapsibleSections, JSON.parse(saved));
  } catch {}
}

export function saveCollapsibleState() {
  try { localStorage.setItem('ontdek-sections', JSON.stringify(state.collapsibleSections)); }
  catch {}
}

export function updateToggleButtonState(btn, isCollapsed) {
  btn.classList.remove('expanded', 'collapsed');
  btn.classList.add(isCollapsed ? 'collapsed' : 'expanded');
}

export function setupSectionToggle(sectionId, sectionKey) {
  const block = document.querySelector(`[data-section="${sectionId}"]`);
  if (!block) return;
  const btn = block.querySelector('.section-toggle-btn');
  if (!btn) return;
  updateToggleButtonState(btn, state.collapsibleSections[sectionKey]);
  btn.addEventListener('click', e => {
    e.preventDefault(); e.stopPropagation();
    state.collapsibleSections[sectionKey] = !state.collapsibleSections[sectionKey];
    saveCollapsibleState();
    updateToggleButtonState(btn, state.collapsibleSections[sectionKey]);
    block.classList.toggle('collapsed');
  });
  if (state.collapsibleSections[sectionKey]) block.classList.add('collapsed');
}

// ── Composiet loader: Ontdek ──────────────────────────────────────────────
export async function loadOntdek() {
  loadCollapsibleState();
  state.activeView = 'ontdek';
  hideTidarrUI();
  stopTidarrQueuePolling();

  const moodHtml = state.spotifyEnabled ? `
    <div class="section-block sec-mood-block">
      <div class="inline-toolbar">
        <span class="toolbar-label spotify-label">🎯 Spotify mood</span>
        <span class="toolbar-sep"></span>
        <button class="tool-btn${state.activeMood==='energiek'?' sel-mood':''}" data-mood="energiek">⚡ Energiek</button>
        <button class="tool-btn${state.activeMood==='chill'?' sel-mood':''}" data-mood="chill">🌊 Chill</button>
        <button class="tool-btn${state.activeMood==='melancholisch'?' sel-mood':''}" data-mood="melancholisch">🌧 Melancholisch</button>
        <button class="tool-btn${state.activeMood==='experimenteel'?' sel-mood':''}" data-mood="experimenteel">🔬 Experimenteel</button>
        <button class="tool-btn${state.activeMood==='feest'?' sel-mood':''}" data-mood="feest">🎉 Feest</button>
        ${state.activeMood ? `<span class="toolbar-sep"></span><button class="tool-btn" id="btn-clear-mood-inline">✕ Wis mood</button>` : ''}
      </div>
    </div>` : '';

  contentEl.innerHTML = `
    <div class="ontdek-layout">
      ${moodHtml}

      <div class="section-block" data-section="recs">
        <div class="section-hdr">
          <button class="section-toggle-btn expanded" title="Vouw in/uit"></button>
          <span class="section-hdr-title" id="hdr-title-recs">🎯 Aanbevelingen</span>
          <div class="inline-toolbar">
            <button class="tool-btn${state.recsFilter==='all'?' sel-def':''}" data-filter="all">Alle</button>
            <button class="tool-btn${state.recsFilter==='new'?' sel-new':''}" data-filter="new">✦ Nieuw voor mij</button>
            <button class="tool-btn${state.recsFilter==='plex'?' sel-plex':''}" data-filter="plex">▶ Al in Plex</button>
            <span class="toolbar-sep"></span>
            <button class="tool-btn refresh-btn" id="btn-ref-recs-ontdek">↻</button>
          </div>
        </div>
        <div class="section-collapsed-preview" id="sec-recs-preview"></div>
        <div class="section-content" id="sec-recs-content">
          <div class="loading"><div class="spinner"></div>Laden...</div>
        </div>
      </div>

      <div class="ontdek-divider">Nieuwe Releases</div>
      <div class="section-block" data-section="releases">
        <div class="section-hdr">
          <button class="section-toggle-btn expanded" title="Vouw in/uit"></button>
          <span class="section-hdr-title" id="hdr-title-releases">💿 Nieuwe Releases</span>
          <div class="inline-toolbar">
            <button class="tool-btn${state.releasesFilter==='all'?' sel-def':''}" data-rtype="all">Alle</button>
            <button class="tool-btn${state.releasesFilter==='album'?' sel-def':''}" data-rtype="album">Albums</button>
            <button class="tool-btn${state.releasesFilter==='single'?' sel-def':''}" data-rtype="single">Singles</button>
            <button class="tool-btn${state.releasesFilter==='ep'?' sel-def':''}" data-rtype="ep">EP's</button>
            <span class="toolbar-sep"></span>
            <button class="tool-btn${state.releasesSort==='listening'?' sel-def':''}" data-rsort="listening">Op luistergedrag</button>
            <button class="tool-btn${state.releasesSort==='date'?' sel-def':''}" data-rsort="date">Op datum</button>
            <span class="toolbar-sep"></span>
            <button class="tool-btn refresh-btn" id="btn-ref-releases-ontdek">↻</button>
          </div>
        </div>
        <div class="section-collapsed-preview" id="sec-releases-preview"></div>
        <div class="section-content" id="sec-releases-content">
          <div class="loading"><div class="spinner"></div>Laden...</div>
        </div>
      </div>

      <div class="ontdek-divider">Ontdek Artiesten</div>
      <div class="section-block" data-section="discover">
        <div class="section-hdr">
          <button class="section-toggle-btn expanded" title="Vouw in/uit"></button>
          <span class="section-hdr-title" id="hdr-title-discover">🔭 Ontdek Artiesten</span>
          <div class="inline-toolbar">
            <button class="tool-btn${state.discFilter==='all'?' sel-def':''}" data-dfilter="all">Alle artiesten</button>
            <button class="tool-btn${state.discFilter==='new'?' sel-new':''}" data-dfilter="new">✦ Nieuw voor mij</button>
            <button class="tool-btn${state.discFilter==='partial'?' sel-miss':''}" data-dfilter="partial">▶ Gedeeltelijk in Plex</button>
            <span class="toolbar-sep"></span>
            <button class="tool-btn refresh-btn" id="btn-ref-discover-ontdek">↻</button>
          </div>
        </div>
        <div class="section-collapsed-preview" id="sec-discover-preview"></div>
        <div class="section-content" id="sec-discover-content">
          <div class="loading"><div class="spinner"></div>Laden...</div>
        </div>
      </div>
    </div>`;

  contentEl.style.opacity  = '1';
  contentEl.style.transform = '';

  document.getElementById('btn-ref-recs-ontdek')?.addEventListener('click', async () => {
    invalidate('recs');  // Wis cache VOOR de fetch
    await runWithSection(document.getElementById('sec-recs-content'), loadRecs);
  });
  document.getElementById('btn-ref-releases-ontdek')?.addEventListener('click', async () => {
    state.lastReleases = null;
    invalidate('releases');  // Wis cache VOOR de fetch
    try { await p('/api/releases/refresh', { method: 'POST' }); } catch (e) { if (e.name !== 'AbortError') throw e; }
    await runWithSection(document.getElementById('sec-releases-content'), loadReleases);
  });
  document.getElementById('btn-ref-discover-ontdek')?.addEventListener('click', async () => {
    state.lastDiscover = null;
    invalidate('discover');  // Wis cache VOOR de fetch
    try { await p('/api/discover/refresh', { method: 'POST' }); } catch (e) { if (e.name !== 'AbortError') throw e; }
    await runWithSection(document.getElementById('sec-discover-content'), loadDiscover);
  });
  document.getElementById('btn-clear-mood-inline')?.addEventListener('click', () => {
    state.activeMood = null;
    document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('sel-mood', 'loading'));
    clearSpotifyRecs();
    loadOntdek();
  });

  // 1. Laad recs onmiddellijk
  {
    const myTarget = document.getElementById('sec-recs-content');
    state.sectionContainerEl = myTarget;
    await loadRecs();
    if (state.sectionContainerEl === myTarget) state.sectionContainerEl = null;
  }

  // 2. Eager preview releases
  (async () => {
    try {
      if (!state.lastReleases) {
        const d = await apiFetch('/api/releases');
        if (d.status === 'building') return;
        state.lastReleases = d.releases || [];
        state.newReleaseIds = new Set(d.newReleaseIds || []);
        updateReleasesBadge(d.newCount || 0);
      }
      const previewEl = document.getElementById('sec-releases-preview');
      if (previewEl && state.lastReleases.length) {
        let filtered = state.lastReleases;
        if (state.releasesFilter !== 'all')
          filtered = state.lastReleases.filter(r => (r.type || 'album').toLowerCase() === state.releasesFilter);
        if (state.releasesSort === 'listening')
          filtered = [...filtered].sort((a, b) => (b.artistPlaycount || 0) - (a.artistPlaycount || 0) || new Date(b.releaseDate) - new Date(a.releaseDate));
        else
          filtered = [...filtered].sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate));
        const previewItems = filtered.slice(0, 8);
        previewEl.innerHTML = `<div class="collapsed-thumbs">${previewItems.map(r => {
          if (r.image) return `<div class="collapsed-thumb">
              <img src="${esc(r.image)}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
              <span class="collapsed-thumb-ph" style="display:none;background:${gradientFor(r.album)}">${initials(r.album)}</span>
            </div>`;
          return `<div class="collapsed-thumb" style="background:${gradientFor(r.album)}"><span class="collapsed-thumb-ph">${initials(r.album)}</span></div>`;
        }).join('')}${filtered.length > 8 ? `<span class="collapsed-thumbs-more">+${filtered.length - 8}</span>` : ''}</div>`;
        const titleReleases = document.getElementById('hdr-title-releases');
        if (titleReleases) titleReleases.textContent =
          `💿 Nieuwe Releases · ${filtered.length} release${filtered.length !== 1 ? 's' : ''}`;
      }
    } catch {}
  })();

  // 3. Lazy-load releases
  setupLazyLoad(document.getElementById('sec-releases-content'), () => {
    const myTarget = document.getElementById('sec-releases-content');
    return runWithSection(myTarget, loadReleases);
  });

  // 4. Eager preview discover
  (async () => {
    try {
      if (!state.lastDiscover) {
        const d = await apiFetch('/api/discover');
        if (d.status === 'building') return;
        state.lastDiscover = d;
        if (d.plexConnected) state.plexOk = true;
      }
      const { artists } = state.lastDiscover;
      if (!artists?.length) return;
      let filtered = artists;
      if (state.discFilter === 'new')     filtered = artists.filter(a => !a.inPlex);
      if (state.discFilter === 'partial') filtered = artists.filter(a => a.inPlex && a.missingCount > 0);
      const previewEl = document.getElementById('sec-discover-preview');
      if (previewEl && filtered.length) {
        const previewItems = filtered.slice(0, 8);
        previewEl.innerHTML = `<div class="collapsed-thumbs">${previewItems.map(a => {
          if (a.image) return `<div class="collapsed-thumb collapsed-thumb-round">
              <img src="${esc(a.image)}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
              <span class="collapsed-thumb-ph" style="display:none;background:${gradientFor(a.name)}">${initials(a.name)}</span>
            </div>`;
          return `<div class="collapsed-thumb collapsed-thumb-round" style="background:${gradientFor(a.name)}"><span class="collapsed-thumb-ph">${initials(a.name)}</span></div>`;
        }).join('')}${filtered.length > 8 ? `<span class="collapsed-thumbs-more">+${filtered.length - 8}</span>` : ''}</div>`;
        const titleDiscover = document.getElementById('hdr-title-discover');
        if (titleDiscover) titleDiscover.textContent = `🔭 Ontdek Artiesten · ${filtered.length} artiesten`;
      }
    } catch {}
  })();

  // 5. Lazy-load discover
  setupLazyLoad(document.getElementById('sec-discover-content'), () => {
    const myTarget = document.getElementById('sec-discover-content');
    return runWithSection(myTarget, loadDiscover);
  });

  // 6. Setup collapsible sections
  setupSectionToggle('recs', 'recs');
  setupSectionToggle('releases', 'releases');
  setupSectionToggle('discover', 'discover');
}
