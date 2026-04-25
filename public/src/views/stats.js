// ── View: Luisterstatistieken Dashboard ───────────────────────────────────
// Toont dagelijks speelgedrag, top artiesten, samenvattingscards en
// een periodefilter. Gebruikt Chart.js (CDN) voor de grafieken.

import { apiFetch } from '../api.js';
import { esc, proxyImg } from '../helpers.js';

// ── Instantie-cache zodat grafieken bij herlaad worden vernietigd ─────────
let _lineChart = null;
let _barChart  = null;

// Huidige periode
let _period = '1month';

// Beschikbare periodes
const PERIODS = [
  { key: '7day',    label: '7 dagen' },
  { key: '1month',  label: '1 maand' },
  { key: '3month',  label: '3 maanden' },
  { key: '12month', label: '12 maanden' },
  { key: 'overall', label: 'Alles' },
];

// ── Helpers ───────────────────────────────────────────────────────────────

function fmt(n) {
  if (n == null || isNaN(n)) return '—';
  return Number(n).toLocaleString('nl-NL');
}

function fmtDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
}

/** Bereken kleur uit CSS custom property (voor Chart.js) */
function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/** Gemiddeld aantal plays per actieve dag */
function avgPerDay(dailyPlays) {
  if (!dailyPlays || dailyPlays.length === 0) return 0;
  const activeDays = dailyPlays.filter(d => d.count > 0);
  if (activeDays.length === 0) return 0;
  const total = activeDays.reduce((s, d) => s + d.count, 0);
  return Math.round(total / activeDays.length);
}

/** Meest actieve dag (highest count) */
function mostActiveDay(dailyPlays) {
  if (!dailyPlays || dailyPlays.length === 0) return null;
  return dailyPlays.reduce((best, d) => (d.count > (best?.count ?? 0) ? d : best), null);
}

/**
 * Langste aaneengesloten reeks met minstens 1 play per dag.
 * dailyPlays is gesorteerd van recent naar oud → omkeren voor streak-berekening.
 */
function longestStreak(dailyPlays) {
  if (!dailyPlays || dailyPlays.length === 0) return 0;
  const sorted = [...dailyPlays].sort((a, b) => a.date.localeCompare(b.date));
  let max = 0, cur = 0;
  for (const d of sorted) {
    if (d.count > 0) { cur++; max = Math.max(max, cur); }
    else cur = 0;
  }
  return max;
}

/** Vernietig Chart.js instanties om memory leaks te voorkomen */
function destroyCharts() {
  if (_lineChart) { _lineChart.destroy(); _lineChart = null; }
  if (_barChart)  { _barChart.destroy();  _barChart  = null; }
}

// ── Render functies ───────────────────────────────────────────────────────

function renderSkeleton() {
  return `
    <div class="stats-skeleton">
      <div class="stats-skeleton-cards">
        ${[1,2,3,4].map(() => `<div class="stats-skel-card skeleton-pulse"></div>`).join('')}
      </div>
      <div class="stats-skeleton-charts">
        <div class="stats-skel-chart skeleton-pulse"></div>
        <div class="stats-skel-chart skeleton-pulse"></div>
      </div>
    </div>
  `;
}

function renderSummaryCards(data) {
  const { totalPlays, dailyPlays } = data;
  const avg     = avgPerDay(dailyPlays);
  const most    = mostActiveDay(dailyPlays);
  const streak  = longestStreak(dailyPlays);

  const cards = [
    {
      icon: '🎵',
      label: 'Totaal plays',
      value: fmt(totalPlays),
      sub: `in geselecteerde periode`,
    },
    {
      icon: '📊',
      label: 'Gem. per actieve dag',
      value: fmt(avg),
      sub: 'plays per dag',
    },
    {
      icon: '🔥',
      label: 'Meest actieve dag',
      value: most ? fmt(most.count) : '—',
      sub: most ? fmtDate(most.date) : 'geen data',
    },
    {
      icon: '⚡',
      label: 'Langste streak',
      value: streak > 0 ? `${streak}d` : '—',
      sub: 'aaneengesloten dagen',
    },
  ];

  return `
    <div class="stats-summary-grid">
      ${cards.map(c => `
        <div class="stats-summary-card">
          <div class="stats-summary-icon">${c.icon}</div>
          <div class="stats-summary-body">
            <div class="stats-summary-value">${c.value}</div>
            <div class="stats-summary-label">${esc(c.label)}</div>
            <div class="stats-summary-sub">${esc(c.sub)}</div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderLineChart(dailyPlays) {
  // Sorteer van oud naar nieuw voor de x-as
  const sorted = [...dailyPlays].sort((a, b) => a.date.localeCompare(b.date));

  const labels = sorted.map(d => fmtDate(d.date));
  const counts = sorted.map(d => d.count);

  const accent      = cssVar('--accent') || '#7c3aed';
  const accentMuted = cssVar('--accent-muted') || 'rgba(124,58,237,0.10)';
  const textMuted   = cssVar('--text-secondary') || '#666';
  const border      = cssVar('--border') || '#e5e5e5';
  const text        = cssVar('--text') || '#1a1a1a';

  const canvas = document.getElementById('stats-line-canvas');
  if (!canvas) return;

  if (_lineChart) { _lineChart.destroy(); _lineChart = null; }

  _lineChart = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Plays per dag',
        data: counts,
        fill: true,
        tension: 0.4,
        borderColor: accent,
        backgroundColor: accentMuted,
        pointBackgroundColor: accent,
        pointRadius: 3,
        pointHoverRadius: 5,
        borderWidth: 2,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: cssVar('--surface2') || '#f8f8f8',
          titleColor: text,
          bodyColor: textMuted,
          borderColor: border,
          borderWidth: 1,
          padding: 10,
          callbacks: {
            label: ctx => ` ${ctx.parsed.y} plays`,
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: textMuted,
            font: { size: 11 },
            maxRotation: 45,
            autoSkip: true,
            maxTicksLimit: 10,
          },
          grid: { color: border, drawBorder: false },
        },
        y: {
          beginAtZero: true,
          ticks: { color: textMuted, font: { size: 11 }, precision: 0 },
          grid: { color: border, drawBorder: false },
        },
      },
    },
  });
}

function renderBarChart(topArtists) {
  const top10   = (topArtists || []).slice(0, 10);
  const labels  = top10.map(a => a.name);
  const counts  = top10.map(a => a.playcount || 0);

  const accent    = cssVar('--accent') || '#7c3aed';
  const textMuted = cssVar('--text-secondary') || '#666';
  const border    = cssVar('--border') || '#e5e5e5';
  const text      = cssVar('--text') || '#1a1a1a';

  // Genereer een kleurspectrum van accent naar lichter
  const colors = top10.map((_, i) => {
    const opacity = 1 - (i / top10.length) * 0.5;
    return accent.startsWith('#')
      ? hexWithOpacity(accent, opacity)
      : accent;
  });

  const canvas = document.getElementById('stats-bar-canvas');
  if (!canvas) return;

  if (_barChart) { _barChart.destroy(); _barChart = null; }

  _barChart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Plays',
        data: counts,
        backgroundColor: colors,
        borderRadius: 3,
        borderSkipped: false,
      }],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: cssVar('--surface2') || '#f8f8f8',
          titleColor: text,
          bodyColor: textMuted,
          borderColor: border,
          borderWidth: 1,
          padding: 10,
          callbacks: {
            label: ctx => ` ${fmt(ctx.parsed.x)} plays`,
          },
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: { color: textMuted, font: { size: 11 }, precision: 0 },
          grid: { color: border },
        },
        y: {
          ticks: {
            color: text,
            font: { size: 12, weight: '500' },
          },
          grid: { display: false },
        },
      },
    },
  });
}

/** Hex kleur omzetten naar rgba met opacity */
function hexWithOpacity(hex, opacity) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${opacity})`;
}

// ── Top artiesten lijst ───────────────────────────────────────────────────

function renderTopArtistsList(topArtists) {
  const top = (topArtists || []).slice(0, 10);
  if (top.length === 0) {
    return `<div class="stats-empty">Geen artiesten gevonden voor deze periode.</div>`;
  }

  const max = Math.max(...top.map(a => a.playcount || 0), 1);

  return `
    <ol class="stats-artist-list">
      ${top.map((a, i) => {
        const pct = Math.round(((a.playcount || 0) / max) * 100);
        const imgSrc = proxyImg(a.thumb, 40);
        const imgHtml = imgSrc
          ? `<img class="stats-artist-thumb" src="${imgSrc}" alt="${esc(a.name)}" loading="lazy">`
          : `<div class="stats-artist-ph" style="background:${gradientForName(a.name)}">${initials(a.name)}</div>`;
        return `
          <li class="stats-artist-row">
            <span class="stats-artist-rank">${i + 1}</span>
            ${imgHtml}
            <div class="stats-artist-info">
              <div class="stats-artist-name">${esc(a.name)}</div>
              <div class="stats-artist-bar-wrap">
                <div class="stats-artist-bar" style="width:${pct}%"></div>
              </div>
            </div>
            <span class="stats-artist-count">${fmt(a.playcount)}</span>
          </li>
        `;
      }).join('')}
    </ol>
  `;
}

function initials(name) {
  if (!name) return '?';
  return name.split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function gradientForName(name) {
  // Eenvoudige hash → hue
  let h = 0;
  for (let i = 0; i < (name || '').length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
  const hue = Math.abs(h) % 360;
  return `linear-gradient(135deg, hsl(${hue},50%,40%), hsl(${(hue + 40) % 360},60%,30%))`;
}

// ── Hoofdrender ───────────────────────────────────────────────────────────

async function renderStats(period) {
  const content = document.getElementById('content');
  if (!content) return;

  // Laad-staat
  content.innerHTML = `
    <div class="stats-view">
      <div class="stats-toolbar">
        ${PERIODS.map(p => `
          <button class="stats-period-btn ${p.key === period ? 'active' : ''}" data-period="${p.key}">
            ${esc(p.label)}
          </button>
        `).join('')}
      </div>
      ${renderSkeleton()}
    </div>
  `;

  // Periode-knoppen koppelen
  content.querySelectorAll('.stats-period-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      _period = btn.dataset.period;
      renderStats(_period);
    });
  });

  // Data ophalen
  let data;
  try {
    data = await apiFetch(`/api/plex/stats?period=${period}`);
  } catch (e) {
    content.querySelector('.stats-skeleton').innerHTML = `
      <div class="error-box">⚠️ Statistieken laden mislukt: ${esc(e.message)}</div>
    `;
    return;
  }

  if (!data || data.error) {
    content.querySelector('.stats-skeleton').innerHTML = `
      <div class="error-box">⚠️ ${esc(data?.error || 'Geen data beschikbaar')}</div>
    `;
    return;
  }

  // Verwijder skelet en bouw het echte dashboard
  const statsView = content.querySelector('.stats-view');
  if (!statsView) return;

  statsView.innerHTML = `
    <div class="stats-toolbar">
      ${PERIODS.map(p => `
        <button class="stats-period-btn ${p.key === period ? 'active' : ''}" data-period="${p.key}">
          ${esc(p.label)}
        </button>
      `).join('')}
    </div>

    <!-- Samenvattingscards -->
    ${renderSummaryCards(data)}

    <!-- Grafieken rij -->
    <div class="stats-charts-row">

      <!-- Lijndiagram: dagelijkse plays -->
      <div class="stats-chart-card">
        <div class="stats-chart-header">
          <div class="section-title">Dagelijkse plays</div>
          <span class="stats-chart-sub">${data.dailyPlays?.length ?? 0} dagen</span>
        </div>
        <div class="stats-line-wrap">
          <canvas id="stats-line-canvas"></canvas>
        </div>
      </div>

      <!-- Bardiagram: top 10 artiesten -->
      <div class="stats-chart-card">
        <div class="stats-chart-header">
          <div class="section-title">Top artiesten</div>
          <span class="stats-chart-sub">${(data.topArtists || []).length} artiesten</span>
        </div>
        <div class="stats-bar-wrap">
          <canvas id="stats-bar-canvas"></canvas>
        </div>
      </div>

    </div>

    <!-- Top artiesten lijst -->
    <div class="stats-section">
      <div class="stats-section-header">
        <div class="section-title">Top 10 artiesten</div>
      </div>
      ${renderTopArtistsList(data.topArtists)}
    </div>
  `;

  // Periode-knoppen opnieuw koppelen (na innerHTML reset)
  statsView.querySelectorAll('.stats-period-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      _period = btn.dataset.period;
      renderStats(_period);
    });
  });

  // Wacht één frame zodat de canvassen in de DOM staan
  requestAnimationFrame(() => {
    if (data.dailyPlays?.length) {
      renderLineChart(data.dailyPlays);
    }
    if (data.topArtists?.length) {
      renderBarChart(data.topArtists);
    }
  });
}

// ── Export: entry point voor router ──────────────────────────────────────

export async function loadStats() {
  destroyCharts();
  document.title = 'Muziek · Statistieken';
  await renderStats(_period);
}
