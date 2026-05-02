// ── View: Luisterstatistieken Dashboard ────────────────────────────────────
// Volledig dashboard met Chart.js visualisaties, period-selector en
// rijke kaarten voor artiesten, albums, tracks en bibliotheek-gezondheid.

import { apiFetch } from '../api.js';
import { esc, proxyImg, gradientFor, fmt, initials } from '../helpers.js';
import { switchView } from '../router.js';

// ── Chart.js lazy-load ────────────────────────────────────────────────────
let _chartJsPromise = null;
function loadChartJs() {
  if (!_chartJsPromise) {
    _chartJsPromise = new Promise((resolve, reject) => {
      if (window.Chart) { resolve(window.Chart); return; }
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js';
      s.onload  = () => resolve(window.Chart);
      s.onerror = () => reject(new Error('Chart.js laden mislukt'));
      document.head.appendChild(s);
    });
  }
  return _chartJsPromise;
}

// ── Chart instantie-cache ─────────────────────────────────────────────────
const _charts = {};
function destroyChart(key) {
  if (_charts[key]) { _charts[key].destroy(); delete _charts[key]; }
}
function destroyAllCharts() {
  Object.keys(_charts).forEach(destroyChart);
}

// ── State ─────────────────────────────────────────────────────────────────
let _period = '1month';
const PERIODS = [
  { key: '7day',    label: '7 Dagen' },
  { key: '1month',  label: '30 Dagen' },
  { key: '3month',  label: '3 Maanden' },
  { key: '12month', label: '12 Maanden' },
  { key: 'overall', label: 'All Time' },
];

// ── CSS variabelen → Chart.js ─────────────────────────────────────────────
function cv(name, fallback = '') {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}
function chartColors() {
  return {
    accent:      cv('--accent',          '#7c3aed'),
    accentMuted: cv('--accent-muted',    'rgba(124,58,237,0.12)'),
    text:        cv('--text',            '#1a1a1a'),
    textMuted:   cv('--text-secondary',  '#888'),
    border:      cv('--border',          '#e5e5e5'),
    surface:     cv('--surface2',        '#f8f8f8'),
  };
}

// ── Kleurenpalet voor donut/bar grafieken ─────────────────────────────────
const PALETTE = [
  '#7c3aed','#2563eb','#0891b2','#059669','#ca8a04',
  '#ea580c','#dc2626','#9333ea','#0284c7','#16a34a',
  '#d97706','#e11d48',
];

// ── Helpers ───────────────────────────────────────────────────────────────
function fmtHours(h) {
  if (h >= 8760) return `${Math.round(h / 8760)} jaar`;
  if (h >= 720)  return `${Math.round(h / 720)} mnd`;
  if (h >= 24)   return `${Math.round(h / 24)} dgn`;
  return `${h} uur`;
}

function artistThumb(a, size = 40) {
  const url = a.thumb || a.image || null;
  return url ? proxyImg(url, size) : null;
}

function artistAvatar(a, size = 64) {
  const src = artistThumb(a, size);
  const bg  = gradientFor(a.name || '');
  const ini = initials(a.name || '?');
  const imgTag = src ? `<img src="${src}" alt="${esc(a.name)}" class="stats-bubble-img" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">` : '';
  return `${imgTag}<div class="stats-bubble-ph" style="${src ? 'display:none;' : ''}background:${bg};width:${size}px;height:${size}px">${ini}</div>`;
}

function albumCover(a, size = 44) {
  const src = a.image ? proxyImg(a.image, size) : null;
  const bg  = gradientFor(a.name || a.album || '');
  const ini = initials(a.name || a.album || '?');
  if (src) return `<img class="stats-cover" src="${src}" alt="${esc(a.name)}" loading="lazy" width="${size}" height="${size}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><div class="stats-cover-ph" style="display:none;background:${bg};width:${size}px;height:${size}px">${ini}</div>`;
  return `<div class="stats-cover-ph" style="background:${bg};width:${size}px;height:${size}px">${ini}</div>`;
}

// ── Skeleton ──────────────────────────────────────────────────────────────
function skeleton() {
  return `
    <div class="stats-skeletons">
      <div class="stats-overview-row">
        ${[1,2,3,4].map(() => `<div class="stats-card skeleton-pulse" style="height:96px;border-radius:12px"></div>`).join('')}
      </div>
      <div class="stats-charts-row">
        <div class="stats-chart-card skeleton-pulse" style="height:280px"></div>
        <div class="stats-chart-card skeleton-pulse" style="height:280px"></div>
      </div>
      <div class="stats-section-card skeleton-pulse" style="height:140px"></div>
    </div>
  `;
}

// ── Render: Overview Cards (Rij 1) ────────────────────────────────────────
function renderOverviewCards(data) {
  const cards = [
    {
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`,
      label: 'Totaal Plays',
      value: fmt(data.totalPlays || 0),
      sub:   'lifetime scrobbles',
      color: '#7c3aed',
    },
    {
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
      label: 'Luistertijd',
      value: fmtHours(data.listeningHours || 0),
      sub:   `≈ ${fmt(data.listeningHours || 0)} uur`,
      color: '#2563eb',
    },
    {
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
      label: 'Artiesten',
      value: fmt(data.uniqueArtists || data.plexArtists || 0),
      sub:   'in je bibliotheek',
      color: '#059669',
    },
    {
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
      label: 'Tracks in Plex',
      value: fmt(data.plexLibrarySize || data.uniqueTracks || 0),
      sub:   `${fmt(data.plexAlbums || data.uniqueAlbums || 0)} albums`,
      color: '#ca8a04',
    },
  ];

  return `
    <div class="stats-overview-row">
      ${cards.map(c => `
        <div class="stats-overview-card" style="--card-accent:${c.color}">
          <div class="stats-ov-icon" style="color:${c.color}">${c.icon}</div>
          <div class="stats-ov-body">
            <div class="stats-ov-value">${c.value}</div>
            <div class="stats-ov-label">${esc(c.label)}</div>
            <div class="stats-ov-sub">${esc(c.sub)}</div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// ── Render: Timeline Chart (Rij 2, links) ────────────────────────────────
function renderTimelineChart(timeline) {
  const c  = chartColors();
  const el = document.getElementById('stats-timeline-canvas');
  if (!el) return;
  destroyChart('timeline');

  _charts.timeline = new Chart(el, {
    type: 'bar',
    data: {
      labels: timeline.labels || [],
      datasets: [{
        label: 'Plays',
        data:   timeline.values || [],
        backgroundColor: c.accent,
        borderRadius: 2,
        borderSkipped: false,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 600 },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: c.surface,
          titleColor:  c.text,
          bodyColor:   c.textMuted,
          borderColor: c.border,
          borderWidth: 1,
          padding: 10,
          callbacks: { label: ctx => ` ${fmt(ctx.parsed.y)} plays` },
        },
      },
      scales: {
        x: { ticks: { color: c.textMuted, font: { size: 11 }, maxRotation: 45, autoSkip: true, maxTicksLimit: 16 }, grid: { color: c.border } },
        y: { beginAtZero: true, ticks: { color: c.textMuted, font: { size: 11 }, precision: 0 }, grid: { color: c.border } },
      },
    },
  });
}

// ── Render: Genre Donut (Rij 2, rechts) ──────────────────────────────────
function renderGenreDonut(genres) {
  const c  = chartColors();
  const el = document.getElementById('stats-genre-canvas');
  if (!el || !genres?.labels?.length) {
    if (el) el.closest('.stats-donut-canvas-wrap').innerHTML = '<div class="stats-empty-msg">Geen genres.</div>';
    return;
  }
  destroyChart('genre');

  _charts.genre = new Chart(el, {
    type: 'doughnut',
    data: {
      labels: genres.labels,
      datasets: [{ data: genres.values, backgroundColor: PALETTE, borderWidth: 0, hoverOffset: 8 }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 600 },
      cutout: '65%',
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: c.surface, titleColor: c.text, bodyColor: c.textMuted,
          borderColor: c.border, borderWidth: 1, padding: 10,
          callbacks: {
            label: ctx => {
              const total = ctx.dataset.data.reduce((s, v) => s + v, 0);
              const pct   = total > 0 ? Math.round((ctx.parsed / total) * 100) : 0;
              return ` ${fmt(ctx.parsed)} plays (${pct}%)`;
            },
          },
        },
      },
    },
  });

  const legendEl = document.getElementById('stats-genre-legend');
  if (legendEl) {
    const total = genres.values.reduce((s, v) => s + v, 0);
    legendEl.innerHTML = genres.labels.map((label, i) => {
      const pct = total > 0 ? Math.round((genres.values[i] / total) * 100) : 0;
      return `
        <div class="stats-genre-legend-item">
          <span class="stats-legend-dot" style="background:${PALETTE[i % PALETTE.length]}"></span>
          <span class="stats-legend-label" title="${esc(label)}">${esc(label)}</span>
          <span class="stats-legend-pct">${pct}%</span>
        </div>`;
    }).join('');
  }
}

// ── Render: Formats Stacked Bar (Rij 5) ──────────────────────────────────
function renderFormatsBar(formats) {
  const el = document.getElementById('stats-formats-canvas');
  if (!el || !formats?.labels?.length) return;
  destroyChart('formats');

  const total = formats.total || formats.values.reduce((s, v) => s + v, 0) || 1;
  const c     = chartColors();

  _charts.formats = new Chart(el, {
    type: 'bar',
    data: {
      labels: ['Bibliotheek'],
      datasets: formats.labels.map((label, i) => ({
        label,
        data: [formats.values[i]],
        backgroundColor: PALETTE[i % PALETTE.length],
        borderWidth: 0,
        borderSkipped: false,
      })),
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 600 },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: c.surface, titleColor: c.text, bodyColor: c.textMuted,
          borderColor: c.border, borderWidth: 1, padding: 10,
          callbacks: {
            label: ctx => {
              const pct = Math.round((ctx.parsed.x / total) * 100);
              return ` ${ctx.dataset.label}: ${fmt(ctx.parsed.x)} (${pct}%)`;
            },
          },
        },
      },
      scales: {
        x: { stacked: true, display: false, grid: { display: false } },
        y: { stacked: true, display: false, grid: { display: false } },
      },
    },
  });

  const legendEl = document.getElementById('stats-formats-legend');
  if (legendEl) {
    legendEl.innerHTML = formats.labels.map((label, i) => {
      const pct = Math.round((formats.values[i] / total) * 100);
      return `
        <div class="stats-format-item">
          <span class="stats-legend-dot" style="background:${PALETTE[i % PALETTE.length]}"></span>
          <span class="stats-format-label">${esc(label)}</span>
          <span class="stats-format-count">${fmt(formats.values[i])}</span>
          <span class="stats-format-pct">${pct}%</span>
        </div>`;
    }).join('');
  }
}

// ── Render: Enrichment Ring ───────────────────────────────────────────────
function renderEnrichmentRing(health) {
  const el  = document.getElementById('stats-enrich-canvas');
  if (!el) return;
  destroyChart('enrich');

  const pct  = Math.round((health.enrichmentCoverage || 0) * 100);
  const rest = 100 - pct;
  const c    = chartColors();

  _charts.enrich = new Chart(el, {
    type: 'doughnut',
    data: { datasets: [{ data: [pct, rest], backgroundColor: [PALETTE[3], c.border], borderWidth: 0 }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      animation: { duration: 600 }, cutout: '72%',
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
    },
  });

  const label = document.getElementById('stats-enrich-pct');
  if (label) label.textContent = `${pct}%`;
}

// ── Render: Top Artiesten bubbels (Rij 3) ────────────────────────────────
function renderTopArtists(artists) {
  if (!artists?.length) return `<div class="stats-empty-msg">Geen data beschikbaar voor deze periode.</div>`;
  return `
    <div class="stats-artists-scroll">
      ${artists.slice(0, 20).map((a, i) => `
        <button class="stats-artist-bubble" data-artist="${esc(a.name)}" title="${esc(a.name)} — ${fmt(a.playcount)} plays">
          <div class="stats-bubble-img-wrap">
            ${artistAvatar(a, 64)}
            <span class="stats-bubble-rank">${i + 1}</span>
          </div>
          <div class="stats-bubble-name">${esc(a.name)}</div>
          <div class="stats-bubble-plays">${fmt(a.playcount)}</div>
        </button>
      `).join('')}
    </div>`;
}

// ── Render: Top Albums lijst (Rij 4, links) ───────────────────────────────
function renderTopAlbums(albums) {
  if (!albums?.length) return `<div class="stats-empty-msg">Geen albums beschikbaar.</div>`;
  return `
    <ol class="stats-ranked-list">
      ${albums.slice(0, 10).map((a, i) => `
        <li class="stats-ranked-item">
          <span class="stats-rank-num">${i + 1}</span>
          <div class="stats-cover-wrap">${albumCover(a, 44)}</div>
          <div class="stats-ranked-info">
            <div class="stats-ranked-title">${esc(a.name)}</div>
            <div class="stats-ranked-sub">${esc(a.artist)}</div>
          </div>
          <span class="stats-ranked-count">${fmt(a.playcount)}</span>
        </li>
      `).join('')}
    </ol>`;
}

// ── Render: Top Tracks lijst (Rij 4, rechts) ─────────────────────────────
function renderTopTracks(tracks) {
  if (!tracks?.length) return `<div class="stats-empty-msg">Geen tracks beschikbaar.</div>`;
  return `
    <ol class="stats-ranked-list">
      ${tracks.slice(0, 10).map((a, i) => `
        <li class="stats-ranked-item">
          <span class="stats-rank-num">${i + 1}</span>
          <div class="stats-ranked-info" style="padding-left:4px">
            <div class="stats-ranked-title">${esc(a.name)}</div>
            <div class="stats-ranked-sub">${esc(a.artist)}${a.album ? ` · ${esc(a.album)}` : ''}</div>
          </div>
          <span class="stats-ranked-count">${fmt(a.playcount)}</span>
        </li>
      `).join('')}
    </ol>`;
}

// ── Render: Library Health (Rij 5) ────────────────────────────────────────
function renderLibraryHealth(health) {
  const pct    = Math.round((health.enrichmentCoverage || 0) * 100);
  const issues = [
    {
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>`,
      label: 'Ontbrekende Covers',
      value: fmt(health.missingCovers || 0),
      color: (health.missingCovers || 0) > 50 ? '#ea580c' : '#16a34a',
    },
    {
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>`,
      label: 'Geen Genre',
      value: fmt(health.missingGenres || 0),
      color: (health.missingGenres || 0) > 100 ? '#ca8a04' : '#16a34a',
    },
    {
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>`,
      label: 'Incomplete Albums',
      value: fmt(health.incompleteAlbums || 0),
      color: (health.incompleteAlbums || 0) > 50 ? '#ca8a04' : '#16a34a',
    },
  ];

  return `
    <div class="stats-health-grid">
      <!-- Format breakdown -->
      <div class="stats-health-card stats-health-formats">
        <div class="stats-subsection-head">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
          Audio Formaten
        </div>
        <div class="stats-formats-bar-wrap">
          <canvas id="stats-formats-canvas" height="30"></canvas>
        </div>
        <div class="stats-formats-legend" id="stats-formats-legend">
          <div class="stats-empty-msg">Formaten laden…</div>
        </div>
      </div>

      <!-- Enrichment ring -->
      <div class="stats-health-card stats-health-enrich">
        <div class="stats-subsection-head">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          Metadata Dekking
        </div>
        <div class="stats-enrich-ring-wrap">
          <div class="stats-enrich-ring">
            <canvas id="stats-enrich-canvas" width="80" height="80"></canvas>
            <div class="stats-enrich-label" id="stats-enrich-pct">${pct}%</div>
          </div>
          <div class="stats-enrich-detail">
            <div class="stats-enrich-row"><span>Albums met cover</span><strong>${fmt(health.coveredAlbums || 0)} / ${fmt(health.totalAlbums || 0)}</strong></div>
            <div class="stats-enrich-row"><span>Totaal tracks</span><strong>${fmt(health.totalTracks || 0)}</strong></div>
            <div class="stats-enrich-row"><span>Artiesten</span><strong>${fmt(health.totalArtists || 0)}</strong></div>
          </div>
        </div>
      </div>

      <!-- Issue cards -->
      <div class="stats-health-issues">
        ${issues.map(issue => `
          <div class="stats-issue-card">
            <div class="stats-issue-icon" style="color:${issue.color}">${issue.icon}</div>
            <div class="stats-issue-body">
              <div class="stats-issue-value" style="color:${issue.color}">${issue.value}</div>
              <div class="stats-issue-label">${esc(issue.label)}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>`;
}

// ── Hoofd render ──────────────────────────────────────────────────────────
async function renderStats(period) {
  const content = document.getElementById('content');
  if (!content) return;

  // Skeleton tonen
  content.innerHTML = `
    <div class="stats-view">
      <div class="stats-header">
        <h1 class="stats-title">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
          </svg>
          Luisterstatistieken
        </h1>
        <div class="stats-period-tabs" role="tablist">
          ${PERIODS.map(p => `
            <button class="stats-period-tab ${p.key === period ? 'active' : ''}" data-period="${p.key}" role="tab" aria-selected="${p.key === period}">${esc(p.label)}</button>
          `).join('')}
        </div>
      </div>
      ${skeleton()}
    </div>`;

  content.querySelectorAll('.stats-period-tab').forEach(btn => {
    btn.addEventListener('click', () => { if (btn.dataset.period !== _period) { _period = btn.dataset.period; renderStats(_period); } });
  });

  // ── Parallel data ophalen ─────────────────────────────────────────────
  const [ovRes, tlRes, gnRes, taRes, albRes, trRes, hlRes] = await Promise.allSettled([
    apiFetch('/api/stats/overview'),
    apiFetch(`/api/stats/timeline?period=${period}`),
    apiFetch(`/api/stats/genres?period=${period}`),
    apiFetch(`/api/stats/top-artists?period=${period}&limit=20`),
    apiFetch(`/api/stats/top-albums?period=${period}&limit=10`),
    apiFetch(`/api/stats/top-tracks?period=${period}&limit=10`),
    apiFetch('/api/stats/library-health'),
  ]);

  const overview   = ovRes.status  === 'fulfilled' ? ovRes.value  : null;
  const timeline   = tlRes.status  === 'fulfilled' ? tlRes.value  : null;
  const genres     = gnRes.status  === 'fulfilled' ? gnRes.value  : null;
  const topArtists = taRes.status  === 'fulfilled' ? taRes.value  : null;
  const topAlbums  = albRes.status === 'fulfilled' ? albRes.value : null;
  const topTracks  = trRes.status  === 'fulfilled' ? trRes.value  : null;
  const health     = hlRes.status  === 'fulfilled' ? hlRes.value  : null;

  // Fallback naar /api/plex/stats als nieuwe endpoints nog niet beschikbaar zijn
  let fallback = null;
  if (!overview && !topArtists) {
    try {
      fallback = await apiFetch(`/api/plex/stats?period=${period}`);
    } catch {}
  }

  const statsView = content.querySelector('.stats-view');
  if (!statsView) return;

  const overviewData = overview || (fallback ? {
    totalPlays:    fallback.totalPlays || 0,
    listeningHours: Math.round(((fallback.totalPlays || 0) * 3.5) / 60),
    uniqueArtists: 0, plexLibrarySize: 0, plexAlbums: 0, plexArtists: 0,
  } : null);

  const artistsData = topArtists?.artists || fallback?.topArtists || [];
  const albumsData  = topAlbums?.albums  || [];
  const tracksData  = topTracks?.tracks  || [];
  const timelineData = timeline || (fallback?.dailyPlays ? {
    labels: [...fallback.dailyPlays].sort((a,b)=>a.date.localeCompare(b.date)).map(d => d.date.slice(5)),
    values: [...fallback.dailyPlays].sort((a,b)=>a.date.localeCompare(b.date)).map(d => d.count),
    totalPlays: fallback.totalPlays,
  } : null);
  const genreData = genres || (fallback?.genres ? {
    labels: (fallback.genres || []).map(g => g.name),
    values: (fallback.genres || []).map(g => g.count || 1),
  } : null);

  statsView.innerHTML = `
    <!-- Header -->
    <div class="stats-header">
      <h1 class="stats-title">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
        </svg>
        Luisterstatistieken
      </h1>
      <div class="stats-period-tabs" role="tablist">
        ${PERIODS.map(p => `
          <button class="stats-period-tab ${p.key === period ? 'active' : ''}" data-period="${p.key}" role="tab" aria-selected="${p.key === period}">${esc(p.label)}</button>
        `).join('')}
      </div>
    </div>

    <!-- Rij 1: Overview Cards -->
    ${overviewData ? renderOverviewCards(overviewData) : ''}

    <!-- Rij 2: Timeline + Genre Donut -->
    <div class="stats-charts-row">
      <div class="stats-chart-card stats-chart-timeline">
        <div class="stats-chart-head">
          <span class="stats-chart-title">Plays over Tijd</span>
          <span class="stats-chart-sub">${timelineData?.totalPlays != null ? fmt(timelineData.totalPlays) + ' plays' : ''}</span>
        </div>
        <div class="stats-canvas-wrap" style="height:240px">
          <canvas id="stats-timeline-canvas"></canvas>
        </div>
      </div>
      <div class="stats-chart-card stats-chart-genres">
        <div class="stats-chart-head">
          <span class="stats-chart-title">Genres</span>
          <span class="stats-chart-sub">${genreData?.labels?.length ? genreData.labels.length + ' genres' : ''}</span>
        </div>
        <div class="stats-donut-wrap">
          <div class="stats-donut-canvas-wrap">
            <canvas id="stats-genre-canvas"></canvas>
          </div>
          <div class="stats-genre-legend" id="stats-genre-legend"></div>
        </div>
      </div>
    </div>

    <!-- Rij 3: Top Artiesten -->
    <div class="stats-section-card">
      <div class="stats-section-head">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
        Top Artiesten
        <span class="stats-section-period">${PERIODS.find(p => p.key === period)?.label || period}</span>
      </div>
      ${renderTopArtists(artistsData)}
    </div>

    <!-- Rij 4: Top Albums + Top Tracks -->
    <div class="stats-lists-row">
      <div class="stats-section-card">
        <div class="stats-section-head">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0"/></svg>
          Top Albums
        </div>
        ${renderTopAlbums(albumsData)}
      </div>
      <div class="stats-section-card">
        <div class="stats-section-head">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
          Top Tracks
        </div>
        ${renderTopTracks(tracksData)}
      </div>
    </div>

    <!-- Rij 5: Library Health -->
    <div class="stats-section-card">
      <div class="stats-section-head">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
        Bibliotheek Gezondheid
      </div>
      ${health ? renderLibraryHealth(health) : '<div class="stats-empty-msg">Geen gezondheidsdata beschikbaar.</div>'}
    </div>
  `;

  // Period tabs opnieuw koppelen
  statsView.querySelectorAll('.stats-period-tab').forEach(btn => {
    btn.addEventListener('click', () => { if (btn.dataset.period !== _period) { _period = btn.dataset.period; renderStats(_period); } });
  });

  // Artiest-bubbel klik → artiest detail
  statsView.querySelectorAll('.stats-artist-bubble[data-artist]').forEach(btn => {
    btn.addEventListener('click', () => switchView('artist-detail', { name: btn.dataset.artist }));
  });

  // ── Chart.js renderen ─────────────────────────────────────────────────
  requestAnimationFrame(async () => {
    try { await loadChartJs(); } catch (e) { console.warn('[stats] Chart.js laden mislukt:', e); return; }

    if (timelineData?.labels?.length) renderTimelineChart(timelineData);
    if (genreData?.labels?.length)    renderGenreDonut(genreData);

    // Formaten apart ophalen (zwaarder endpoint)
    try {
      const fmtData = await apiFetch('/api/stats/formats');
      if (fmtData?.labels?.length) renderFormatsBar(fmtData);
    } catch {}

    // Enrichment ring (health is al geladen)
    if (health) renderEnrichmentRing(health);
  });
}

// ── CSS injecteren (eenmalig) ─────────────────────────────────────────────
function injectStyles() {
  if (document.getElementById('stats-view-styles')) return;
  const style = document.createElement('style');
  style.id = 'stats-view-styles';
  style.textContent = `
    /* ── Stats View Container ── */
    .stats-view { padding: 20px 24px; max-width: 1400px; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }

    /* ── Header ── */
    .stats-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; padding-bottom: 4px; }
    .stats-title  { display: flex; align-items: center; gap: 8px; font-size: 1.25rem; font-weight: 700; margin: 0; color: var(--text); }

    /* ── Period tabs ── */
    .stats-period-tabs { display: flex; gap: 3px; background: var(--surface2, #f3f3f3); border-radius: 9px; padding: 3px; }
    .stats-period-tab  { border: none; background: transparent; color: var(--text-secondary); padding: 5px 11px; border-radius: 7px; font-size: .8rem; font-weight: 500; cursor: pointer; transition: all .15s; white-space: nowrap; }
    .stats-period-tab.active { background: var(--surface, #fff); color: var(--accent); box-shadow: 0 1px 4px rgba(0,0,0,.08); }
    .stats-period-tab:hover:not(.active) { color: var(--text); }

    /* ── Overview cards (Rij 1) ── */
    .stats-overview-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    .stats-overview-card { background: var(--surface, #fff); border: 1px solid var(--border); border-radius: 12px; padding: 16px; display: flex; align-items: center; gap: 14px; transition: box-shadow .15s; }
    .stats-overview-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,.06); }
    .stats-ov-icon  { flex-shrink: 0; width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; background: color-mix(in srgb, var(--card-accent, #7c3aed) 12%, transparent); }
    .stats-ov-body  { min-width: 0; }
    .stats-ov-value { font-size: 1.3rem; font-weight: 700; color: var(--text); line-height: 1.2; }
    .stats-ov-label { font-size: .75rem; font-weight: 600; color: var(--text-secondary); margin-top: 2px; }
    .stats-ov-sub   { font-size: .7rem; color: var(--text-secondary); opacity: .7; }

    /* ── Charts row (Rij 2) ── */
    .stats-charts-row { display: grid; grid-template-columns: 1.6fr 1fr; gap: 12px; }
    .stats-chart-card { background: var(--surface, #fff); border: 1px solid var(--border); border-radius: 12px; padding: 18px; }
    .stats-chart-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
    .stats-chart-title { font-size: .88rem; font-weight: 600; color: var(--text); }
    .stats-chart-sub   { font-size: .75rem; color: var(--text-secondary); }
    .stats-canvas-wrap { position: relative; }
    .stats-canvas-wrap canvas { width: 100% !important; }

    /* ── Genre donut ── */
    .stats-donut-wrap        { display: flex; align-items: flex-start; gap: 14px; min-height: 220px; }
    .stats-donut-canvas-wrap { flex-shrink: 0; width: 120px; height: 120px; margin-top: 10px; }
    .stats-genre-legend      { flex: 1; overflow-y: auto; max-height: 230px; display: flex; flex-direction: column; gap: 5px; }
    .stats-genre-legend-item { display: flex; align-items: center; gap: 6px; font-size: .77rem; }
    .stats-legend-dot        { flex-shrink: 0; width: 8px; height: 8px; border-radius: 50%; }
    .stats-legend-label      { flex: 1; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .stats-legend-pct        { color: var(--text-secondary); font-size: .7rem; }

    /* ── Section cards ── */
    .stats-section-card { background: var(--surface, #fff); border: 1px solid var(--border); border-radius: 12px; padding: 18px; }
    .stats-section-head { display: flex; align-items: center; gap: 7px; font-size: .85rem; font-weight: 600; color: var(--text); margin-bottom: 14px; }
    .stats-section-period { margin-left: auto; font-size: .73rem; font-weight: 400; color: var(--text-secondary); background: var(--surface2); padding: 2px 8px; border-radius: 20px; }
    .stats-subsection-head { display: flex; align-items: center; gap: 6px; font-size: .78rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 8px; }

    /* ── Top Artiesten bubbels (Rij 3) ── */
    .stats-artists-scroll { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 8px; scrollbar-width: thin; }
    .stats-artist-bubble  { display: flex; flex-direction: column; align-items: center; gap: 5px; background: none; border: none; cursor: pointer; padding: 8px; border-radius: 10px; min-width: 74px; max-width: 74px; text-align: center; transition: background .15s; }
    .stats-artist-bubble:hover { background: var(--surface2, #f3f3f3); }
    .stats-bubble-img-wrap { position: relative; width: 64px; height: 64px; }
    .stats-bubble-img  { width: 64px; height: 64px; border-radius: 50%; object-fit: cover; }
    .stats-bubble-ph   { border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: .8rem; font-weight: 700; color: #fff; }
    .stats-bubble-rank { position: absolute; bottom: 0; right: 0; background: var(--accent); color: #fff; font-size: .58rem; font-weight: 700; width: 16px; height: 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
    .stats-bubble-name  { font-size: .7rem; font-weight: 600; color: var(--text); max-width: 70px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .stats-bubble-plays { font-size: .65rem; color: var(--text-secondary); }

    /* ── Ranked lists (Rij 4) ── */
    .stats-lists-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .stats-ranked-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 9px; }
    .stats-ranked-item { display: flex; align-items: center; gap: 10px; }
    .stats-rank-num    { font-size: .72rem; font-weight: 700; color: var(--text-secondary); min-width: 16px; text-align: right; }
    .stats-cover-wrap  { flex-shrink: 0; display: flex; }
    .stats-cover       { width: 44px; height: 44px; border-radius: 6px; object-fit: cover; }
    .stats-cover-ph    { border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: .7rem; font-weight: 700; color: #fff; }
    .stats-ranked-info { flex: 1; min-width: 0; }
    .stats-ranked-title{ font-size: .82rem; font-weight: 600; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .stats-ranked-sub  { font-size: .72rem; color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-top: 1px; }
    .stats-ranked-count{ font-size: .73rem; font-weight: 600; color: var(--text-secondary); white-space: nowrap; }

    /* ── Library Health (Rij 5) ── */
    .stats-health-grid    { display: grid; grid-template-columns: 1.6fr 1fr auto; gap: 14px; align-items: start; }
    .stats-health-card    { background: var(--surface2, #f8f8f8); border-radius: 10px; padding: 14px; }
    .stats-formats-bar-wrap { margin: 8px 0 6px; height: 30px; position: relative; }
    .stats-formats-bar-wrap canvas { width: 100% !important; height: 30px !important; position: absolute; inset: 0; }
    .stats-formats-legend { display: flex; flex-wrap: wrap; gap: 6px 14px; margin-top: 4px; }
    .stats-format-item    { display: flex; align-items: center; gap: 5px; font-size: .72rem; }
    .stats-format-label   { color: var(--text); font-weight: 500; }
    .stats-format-count   { color: var(--text-secondary); }
    .stats-format-pct     { color: var(--text-secondary); opacity: .7; }

    .stats-health-enrich  { }
    .stats-enrich-ring-wrap { display: flex; align-items: center; gap: 14px; margin-top: 8px; }
    .stats-enrich-ring      { position: relative; width: 80px; height: 80px; flex-shrink: 0; }
    .stats-enrich-ring canvas { width: 80px !important; height: 80px !important; }
    .stats-enrich-label  { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: .88rem; font-weight: 700; color: var(--text); pointer-events: none; }
    .stats-enrich-detail { display: flex; flex-direction: column; gap: 5px; flex: 1; }
    .stats-enrich-row    { display: flex; justify-content: space-between; gap: 8px; font-size: .72rem; color: var(--text-secondary); }
    .stats-enrich-row strong { color: var(--text); font-weight: 600; }

    .stats-health-issues { display: flex; flex-direction: column; gap: 8px; min-width: 160px; }
    .stats-issue-card    { background: var(--surface2, #f8f8f8); border-radius: 10px; padding: 12px 14px; display: flex; align-items: center; gap: 10px; }
    .stats-issue-icon    { flex-shrink: 0; }
    .stats-issue-body    { min-width: 0; }
    .stats-issue-value   { font-size: 1.1rem; font-weight: 700; line-height: 1.1; }
    .stats-issue-label   { font-size: .7rem; color: var(--text-secondary); margin-top: 1px; }

    /* ── Misc ── */
    .stats-empty-msg { color: var(--text-secondary); font-size: .83rem; padding: 12px 0; }
    .stats-skeletons { display: flex; flex-direction: column; gap: 14px; }

    /* ── Responsive ── */
    @media (max-width: 1024px) {
      .stats-health-grid { grid-template-columns: 1fr 1fr; }
      .stats-health-issues { flex-direction: row; flex-wrap: wrap; }
      .stats-issue-card { flex: 1; min-width: 120px; }
    }
    @media (max-width: 860px) {
      .stats-overview-row { grid-template-columns: 1fr 1fr; }
      .stats-charts-row   { grid-template-columns: 1fr; }
      .stats-lists-row    { grid-template-columns: 1fr; }
      .stats-health-grid  { grid-template-columns: 1fr; }
    }
    @media (max-width: 520px) {
      .stats-overview-row { grid-template-columns: 1fr; }
      .stats-view { padding: 12px; }
      .stats-period-tabs { flex-wrap: wrap; }
    }
  `;
  document.head.appendChild(style);
}

// ── Export: entry point voor router ───────────────────────────────────────
export async function loadStats() {
  destroyAllCharts();
  injectStyles();
  document.title = 'Muziek · Statistieken';
  await renderStats(_period);
}
