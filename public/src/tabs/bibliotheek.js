// ── Tab: Bibliotheek ──────────────────────────────────────────────────────
import { state } from '../state.js';
import { apiFetch } from '../api.js';
import {
  esc, fmt, initials, gradientFor, tagsHtml, bookmarkBtn, downloadBtn,
  countryFlag, albumCard, showLoading, setContent, showError,
  setupLazyLoad, runWithSection, contentEl, sanitizeArtistName, periodLabel,
  getImg, trackImg, timeAgo, proxyImg
} from '../helpers.js';
import { loadWishlist } from '../components/wishlist.js';
import { loadPlexStatus } from '../api.js';
import { hideTidarrUI, stopTidarrQueuePolling } from './downloads.js';

// ── Plex bibliotheek HTML builder ─────────────────────────────────────────
export function buildPlexLibraryHtml(library, query) {
  const q = (query || '').toLowerCase().trim();
  let filtered = library;
  if (q) filtered = library.filter(x =>
    x.artist.toLowerCase().includes(q) || x.album.toLowerCase().includes(q));
  if (!filtered.length)
    return `<div class="empty">Geen resultaten voor "<strong>${esc(query)}</strong>".</div>`;

  const byArtist = new Map();
  for (const x of filtered) {
    if (!byArtist.has(x.artist)) byArtist.set(x.artist, []);
    byArtist.get(x.artist).push(x.album);
  }

  let html = `<div class="section-title">${byArtist.size} artiesten · ${fmt(filtered.length)} albums</div>
    <div class="plib-list">`;
  for (const [artist, albums] of byArtist) {
    html += `
      <div class="plib-artist-block">
        <div class="plib-artist-header artist-link" data-artist="${esc(artist)}">
          <div class="plib-avatar" style="background:${gradientFor(artist)}">${initials(artist)}</div>
          <span class="plib-artist-name">${esc(artist)}</span>
          <span class="plib-album-count">${albums.length}</span>
        </div>
        <div class="plib-albums">
          ${albums.map(a => `<div class="plib-album-row">
            <span class="plib-album-badge">▶</span>
            <span class="plib-album-title" title="${esc(a)}">${esc(a)}</span>
          </div>`).join('')}
        </div>
      </div>`;
  }
  return html + '</div>';
}

export async function loadPlexLibrary() {
  showLoading();
  try {
    const d = await apiFetch('/api/plex/library');
    state.plexLibData = d.library || [];
    const searchEl = document.getElementById('plib-search');
    if (searchEl) searchEl.value = '';
    if (!state.plexLibData.length) {
      setContent('<div class="empty">Plex bibliotheek is leeg of nog niet gesynchroniseerd.<br>Klik ↻ Sync Plex om te beginnen.</div>');
      return;
    }
    setContent(buildPlexLibraryHtml(state.plexLibData, ''));
  } catch (e) { showError(e.message); }
}

// ── Top artiesten ─────────────────────────────────────────────────────────
export async function loadTopArtists(period) {
  showLoading();
  try {
    const d = await apiFetch(`/api/topartists?period=${period}`);
    const artists = d.topartists?.artist || [];
    if (!artists.length) { setContent('<div class="empty">Geen data.</div>'); return; }
    const max = parseInt(artists[0]?.playcount || 1);
    let html = `<div class="section-title">Top artiesten · ${periodLabel(period)}</div><div class="artist-grid">`;
    for (let i = 0; i < artists.length; i++) {
      const a = artists[i];
      const pct = Math.round(parseInt(a.playcount) / max * 100);
      const lfmImg = getImg(a.image, 'large') || getImg(a.image);
      const agImgSrc = proxyImg(lfmImg, 120) || lfmImg;
      const photoHtml = agImgSrc
        ? `<img src="${agImgSrc}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
           <div class="ag-photo-ph" style="display:none;background:${gradientFor(a.name, true)}">${initials(a.name)}</div>`
        : `<div class="ag-photo-ph" style="background:${gradientFor(a.name, true)}">${initials(a.name)}</div>`;
      html += `<div class="ag-card">
        <div class="ag-photo" id="agp-${i}" style="view-transition-name: artist-${sanitizeArtistName(a.name)}">${photoHtml}</div>
        <div class="ag-info">
          <div class="ag-name artist-link" data-artist="${esc(a.name)}">${esc(a.name)}</div>
          <div class="card-bar"><div class="card-bar-fill" style="width:${pct}%"></div></div>
          <div class="ag-plays">${fmt(a.playcount)} plays</div>
        </div></div>`;
    }
    setContent(html + '</div>');
    artists.forEach(async (a, i) => {
      try {
        const info = await apiFetch(`/api/artist/${encodeURIComponent(a.name)}/info`);
        if (info.image) {
          const el = document.getElementById(`agp-${i}`);
          if (el) el.innerHTML = `<img src="${proxyImg(info.image, 120) || info.image}" alt="" loading="lazy" onerror="this.style.display='none'">`;
        }
      } catch {}
    });
  } catch (e) { showError(e.message); }
}

// ── Top nummers ───────────────────────────────────────────────────────────
export async function loadTopTracks(period) {
  showLoading();
  try {
    const d = await apiFetch(`/api/toptracks?period=${period}`);
    const tracks = d.toptracks?.track || [];
    if (!tracks.length) { setContent('<div class="empty">Geen data.</div>'); return; }
    const max = parseInt(tracks[0]?.playcount || 1);
    let html = `<div class="section-title">Top nummers · ${periodLabel(period)}</div><div class="card-list">`;
    for (const t of tracks) {
      const pct = Math.round(parseInt(t.playcount) / max * 100);
      html += `<div class="card">${trackImg(t.image)}<div class="card-info">
        <div class="card-title">${esc(t.name)}</div>
        <div class="card-sub artist-link" data-artist="${esc(t.artist?.name||'')}">${esc(t.artist?.name||'')}</div>
        <div class="card-bar"><div class="card-bar-fill" style="width:${pct}%"></div></div>
        </div><div class="card-meta">${fmt(t.playcount)}×</div>
        <button class="play-btn" data-artist="${esc(t.artist?.name||'')}" data-track="${esc(t.name)}" title="Preview afspelen">▶</button>
        <div class="play-bar"><div class="play-bar-fill"></div></div></div>`;
    }
    setContent(html + '</div>');
  } catch (e) { showError(e.message); }
}

// ── Geliefd ───────────────────────────────────────────────────────────────
export async function loadLoved() {
  showLoading();
  try {
    const d = await apiFetch('/api/loved');
    const tracks = d.lovedtracks?.track || [];
    if (!tracks.length) { setContent('<div class="empty">Geen geliefde nummers.</div>'); return; }
    let html = '<div class="section-title">Geliefde nummers</div><div class="card-list">';
    for (const t of tracks) {
      const when = t.date?.uts ? timeAgo(parseInt(t.date.uts)) : '';
      html += `<div class="card">${trackImg(t.image)}<div class="card-info">
        <div class="card-title">${esc(t.name)}</div>
        <div class="card-sub artist-link" data-artist="${esc(t.artist?.name||'')}">${esc(t.artist?.name||'')}</div>
        </div><div class="card-meta" style="color:var(--red)">♥ ${when}</div>
        <button class="play-btn" data-artist="${esc(t.artist?.name||'')}" data-track="${esc(t.name)}" title="Preview afspelen">▶</button>
        <div class="play-bar"><div class="play-bar-fill"></div></div></div>`;
    }
    setContent(html + '</div>');
  } catch (e) { showError(e.message); }
}

// ── Statistieken ──────────────────────────────────────────────────────────
export async function loadStats() {
  showLoading('Statistieken ophalen...');
  try {
    const d = await apiFetch('/api/stats');
    const chartHtml = `
      <div class="stats-grid">
        <div class="stats-card full">
          <div class="stats-card-title">Scrobbles afgelopen 7 dagen</div>
          <div class="chart-wrap"><canvas id="chart-daily"></canvas></div>
        </div>
        <div class="stats-card">
          <div class="stats-card-title">Top artiesten deze maand</div>
          <div class="chart-wrap" style="max-height:320px"><canvas id="chart-top"></canvas></div>
        </div>
        <div class="stats-card">
          <div class="stats-card-title">Genre verdeling</div>
          <div class="chart-wrap"><canvas id="chart-genres"></canvas></div>
        </div>
      </div>`;
    setContent(chartHtml, () => renderStatsCharts(d));
  } catch (e) { showError(e.message); }
}

export function renderStatsCharts(d) {
  if (typeof Chart === 'undefined') return;
  const isDark     = !window.matchMedia('(prefers-color-scheme: light)').matches;
  const gridColor  = isDark ? '#2c2c2c' : '#ddd';
  const tickColor  = isDark ? '#888' : '#777';
  const labelColor = isDark ? '#efefef' : '#111';
  Chart.defaults.color       = tickColor;
  Chart.defaults.borderColor = gridColor;

  const dc = document.getElementById('chart-daily');
  if (dc) {
    new Chart(dc, {
      type: 'bar',
      data: {
        labels: d.dailyScrobbles.map(x => {
          const dt = new Date(x.date + 'T12:00:00');
          return dt.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric' });
        }),
        datasets: [{ data: d.dailyScrobbles.map(x => x.count), backgroundColor: 'rgba(213,16,7,0.75)', borderRadius: 4 }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => `${ctx.raw} scrobbles` } } },
        scales: {
          x: { grid: { display: false }, ticks: { color: tickColor } },
          y: { grid: { color: gridColor }, ticks: { color: tickColor }, beginAtZero: true }
        }
      }
    });
  }

  const tc = document.getElementById('chart-top');
  if (tc && d.topArtists?.length) {
    new Chart(tc, {
      type: 'bar',
      data: {
        labels: d.topArtists.map(a => a.name),
        datasets: [{ data: d.topArtists.map(a => a.playcount), backgroundColor: 'rgba(229,160,13,0.75)', borderRadius: 4 }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => `${ctx.raw} plays` } } },
        scales: {
          x: { grid: { color: gridColor }, ticks: { color: tickColor }, beginAtZero: true },
          y: { grid: { display: false }, ticks: { color: labelColor, font: { size: 11 } } }
        }
      }
    });
  }

  const gc = document.getElementById('chart-genres');
  if (gc && d.genres?.length) {
    const colors = ['#d51007','#e5a00d','#6c5ce7','#00b894','#fd79a8','#0984e3','#e17055','#a29bfe'];
    new Chart(gc, {
      type: 'doughnut',
      data: {
        labels: d.genres.map(g => g.name),
        datasets: [{ data: d.genres.map(g => g.count), backgroundColor: colors.slice(0, d.genres.length), borderWidth: 0 }]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'right', labels: { color: tickColor, boxWidth: 12, padding: 10, font: { size: 11 } } } }
      }
    });
  }
}

// ── Collection Gaps ───────────────────────────────────────────────────────
export async function loadGaps() {
  showLoading('Collectiegaten zoeken...');
  try {
    const d = await apiFetch('/api/gaps');
    if (d.status === 'building') {
      setContent(`<div class="loading"><div class="spinner"></div>
        <div>${esc(d.message)}</div>
        <div class="build-hint">Pagina ververst automatisch over 20 seconden</div></div>`);
      setTimeout(() => { if (state.currentTab === 'gaps') loadGaps(); }, 20_000);
      return;
    }
    state.lastGaps = d;
    renderGaps();
  } catch (e) { showError(e.message); }
}

export function renderGaps() {
  if (!state.lastGaps) return;
  let artists = [...(state.lastGaps.artists || [])];
  if (!artists.length) {
    setContent('<div class="empty">Geen collectiegaten gevonden — je hebt alles al! 🎉</div>');
    document.getElementById('badge-gaps').textContent = '0';
    return;
  }
  if (state.gapsSort === 'missing') artists.sort((a, b) => b.missingAlbums.length - a.missingAlbums.length);
  if (state.gapsSort === 'name')    artists.sort((a, b) => a.name.localeCompare(b.name));

  const totalMissing = artists.reduce((s, a) => s + a.missingAlbums.length, 0);
  document.getElementById('badge-gaps').textContent = totalMissing;

  let html = `<div class="section-title">${totalMissing} ontbrekende albums bij ${artists.length} artiesten die je al hebt</div>`;
  for (const a of artists) {
    const pct  = Math.round(a.ownedCount / a.totalCount * 100);
    const meta = [countryFlag(a.country), a.country, a.startYear].filter(Boolean).join(' · ');
    const gapsImgSrc = proxyImg(a.image, 56) || a.image;
    const photo = gapsImgSrc
      ? `<img class="gaps-photo" src="${esc(gapsImgSrc)}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
         <div class="gaps-photo-ph" style="display:none;background:${gradientFor(a.name)}">${initials(a.name)}</div>`
      : `<div class="gaps-photo-ph" style="background:${gradientFor(a.name)}">${initials(a.name)}</div>`;
    html += `
      <div class="gaps-block">
        <div class="gaps-header">
          ${photo}
          <div style="flex:1;min-width:0">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:2px">
              <div class="gaps-artist-name artist-link" data-artist="${esc(a.name)}">${esc(a.name)}</div>
              ${bookmarkBtn('artist', a.name, '', a.image || '')}
            </div>
            <div class="gaps-artist-meta">${esc(meta)}</div>
            ${tagsHtml(a.tags, 3)}
            <div style="height:8px"></div>
            <div class="comp-bar"><div class="comp-fill" style="width:${pct}%"></div></div>
            <div class="comp-text">${a.ownedCount} van ${a.totalCount} albums in Plex
              &nbsp;·&nbsp; <span style="color:var(--new);font-weight:600">${a.missingAlbums.length} ontbreken</span></div>
          </div>
        </div>
        <div class="gaps-sub">Ontbrekende albums</div>
        <div class="gaps-album-grid">`;
    for (const alb of a.missingAlbums) html += albumCard(alb, false, a.name);
    html += `</div>`;
    if (a.allAlbums?.filter(x => x.inPlex).length > 0) {
      html += `<details style="margin-top:12px">
        <summary style="font-size:11px;color:var(--muted2);cursor:pointer;user-select:none">
          ▸ ${a.ownedCount} albums die je al hebt
        </summary>
        <div class="gaps-album-grid" style="margin-top:10px">
          ${a.allAlbums.filter(x => x.inPlex).map(alb => albumCard(alb, false, a.name)).join('')}
        </div>
      </details>`;
    }
    html += `</div>`;
  }
  setContent(html);
}

// ── Bibliotheek sub-tab wisselen ──────────────────────────────────────────
export async function switchBibSubTab(subTab) {
  state.bibSubTab = subTab;
  const bibContent = document.getElementById('bib-sub-content');
  const bibToolbar = document.getElementById('bib-subtoolbar');
  if (!bibContent) return;

  document.querySelectorAll('.bib-tab').forEach(b =>
    b.classList.toggle('active', b.dataset.bibtab === subTab));

  if (bibToolbar) {
    if (subTab === 'collectie') {
      bibToolbar.innerHTML = `
        <div class="inline-toolbar" style="margin-bottom:12px">
          <input class="plib-search" id="plib-search-bib" type="text"
            placeholder="🔍  Zoek artiest of album…" autocomplete="off" style="flex:1;min-width:0">
          <button class="tool-btn" id="btn-sync-plex-bib">↻ Sync Plex</button>
        </div>`;
      document.getElementById('plib-search-bib')?.addEventListener('input', e => {
        if (!state.plexLibData) return;
        bibContent.innerHTML = buildPlexLibraryHtml(state.plexLibData, e.target.value);
      });
      document.getElementById('btn-sync-plex-bib')?.addEventListener('click', async () => {
        const btn = document.getElementById('btn-sync-plex-bib');
        const orig = btn.textContent;
        btn.disabled = true; btn.textContent = '↻ Bezig…';
        try {
          await fetch('/api/plex/refresh', { method: 'POST' });
          await loadPlexStatus();
          state.plexLibData = null;
          const myTarget = bibContent;
          state.sectionContainerEl = myTarget;
          await loadPlexLibrary();
          if (state.sectionContainerEl === myTarget) state.sectionContainerEl = null;
        } catch {}
        finally { btn.disabled = false; btn.textContent = orig; }
      });
    } else if (subTab === 'gaten') {
      bibToolbar.innerHTML = `
        <div class="inline-toolbar" style="margin-bottom:12px">
          <button class="tool-btn${state.gapsSort==='missing'?' sel-def':''}" data-gsort="missing">Meest ontbrekend</button>
          <button class="tool-btn${state.gapsSort==='name'?' sel-def':''}" data-gsort="name">A–Z</button>
          <span class="toolbar-sep"></span>
          <button class="tool-btn refresh-btn" id="btn-ref-gaps-bib">↻ Vernieuwen</button>
        </div>`;
      document.getElementById('btn-ref-gaps-bib')?.addEventListener('click', async () => {
        state.lastGaps = null;
        await fetch('/api/gaps/refresh', { method: 'POST' });
        const myTarget = document.getElementById('bib-sub-content');
        state.sectionContainerEl = myTarget;
        await loadGaps();
        if (state.sectionContainerEl === myTarget) state.sectionContainerEl = null;
      });
    } else {
      bibToolbar.innerHTML = '';
    }
  }

  const myTarget = bibContent;
  state.sectionContainerEl = myTarget;
  try {
    if (subTab === 'collectie')     { state.currentTab = 'plexlib';   await loadPlexLibrary(); }
    else if (subTab === 'gaten')    { state.currentTab = 'gaps';      await loadGaps(); }
    else if (subTab === 'lijst')    { state.currentTab = 'wishlist';  await loadWishlist(); }
  } finally {
    if (state.sectionContainerEl === myTarget) state.sectionContainerEl = null;
  }
}

// ── Composiet loader: Bibliotheek ─────────────────────────────────────────
export async function loadBibliotheek() {
  state.currentTab = 'plexlib';
  hideTidarrUI();
  stopTidarrQueuePolling();

  contentEl.innerHTML = `
    <div class="bib-layout">
      <div class="bib-strips-wrap">
        <div class="scroll-strip">
          <div class="strip-label">Top artiesten <span class="strip-period">(${periodLabel(state.currentPeriod)})</span></div>
          <div class="strip-body" id="strip-artists-body">
            <div class="loading"><div class="spinner"></div></div>
          </div>
        </div>
        <div class="scroll-strip" style="margin-top:16px">
          <div class="strip-label">Top nummers <span class="strip-period">(${periodLabel(state.currentPeriod)})</span></div>
          <div class="strip-body" id="strip-tracks-body">
            <div class="loading"><div class="spinner"></div></div>
          </div>
        </div>
      </div>

      <div class="bib-subtabs" id="bib-subtabs">
        <button class="bib-tab${state.bibSubTab==='collectie'?' active':''}" data-bibtab="collectie">Collectie</button>
        <button class="bib-tab${state.bibSubTab==='gaten'?' active':''}" data-bibtab="gaten">Gaten <span class="bib-tab-badge" id="badge-gaps-bib"></span></button>
        <button class="bib-tab${state.bibSubTab==='lijst'?' active':''}" data-bibtab="lijst">Lijst</button>
      </div>

      <div id="bib-subtoolbar"></div>
      <div class="bib-sub-content" id="bib-sub-content">
        <div class="loading"><div class="spinner"></div>Laden...</div>
      </div>

      <div class="section-block" style="margin-top:32px">
        <div class="section-hdr">
          <span class="section-hdr-title">Statistieken</span>
        </div>
        <div class="section-content" id="bib-stats-content">
          <div class="loading"><div class="spinner"></div>Laden...</div>
        </div>
      </div>
    </div>`;

  contentEl.style.opacity  = '1';
  contentEl.style.transform = '';

  const gapsBibBadge  = document.getElementById('badge-gaps-bib');
  const mainGapsBadge = document.getElementById('badge-gaps');
  if (gapsBibBadge && mainGapsBadge) gapsBibBadge.textContent = mainGapsBadge.textContent;

  document.querySelectorAll('.bib-tab').forEach(btn =>
    btn.addEventListener('click', () => switchBibSubTab(btn.dataset.bibtab)));

  {
    const myTarget = document.getElementById('strip-artists-body');
    state.sectionContainerEl = myTarget;
    await loadTopArtists(state.currentPeriod);
    if (state.sectionContainerEl === myTarget) state.sectionContainerEl = null;
  }

  {
    const myTarget = document.getElementById('strip-tracks-body');
    state.sectionContainerEl = myTarget;
    await loadTopTracks(state.currentPeriod);
    if (state.sectionContainerEl === myTarget) state.sectionContainerEl = null;
  }

  await switchBibSubTab(state.bibSubTab);

  setupLazyLoad(document.getElementById('bib-stats-content'), () => {
    const myTarget = document.getElementById('bib-stats-content');
    return runWithSection(myTarget, loadStats);
  });
}
