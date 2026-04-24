// ── View: Home Dashboard ──────────────────────────────────────────────────
// Startpagina met preview-widgets die elk doorlinken naar een volledige view.
// Secties: greeting + stats, recent activity, listen later,
//          daily mixes, new releases, listening stats.

import { apiFetch } from '../api.js';
import { switchView } from '../router.js';
import { esc, proxyImg, gradientFor } from '../helpers.js';
import { state } from '../state.js';

// ── Kleuren voor donut chart genres ───────────────────────────────────────
const DONUT_COLORS = ['#7c3aed', '#2962ff', '#4a9e6e', '#c0574e', '#c4a46c', '#8b7ec8'];

// ── Helpers ───────────────────────────────────────────────────────────────

function fmt(n) {
  if (n == null || isNaN(n)) return '—';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

function ageLabel(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days < 1) return 'Vandaag';
  if (days === 1) return 'Gisteren';
  if (days < 7) return `${days}d geleden`;
  if (days < 31) return `${Math.floor(days / 7)}w geleden`;
  return `${Math.floor(days / 30)}mo geleden`;
}

function coverImg(url, size = 120) {
  if (!url) return null;
  return proxyImg(url, size);
}

// ── Section 1: Greeting + Stats ───────────────────────────────────────────

function renderGreeting(username, libData) {
  const displayName = username || 'Muzikant';

  const artists   = libData?.artists   ?? libData?.artistCount   ?? '…';
  const albums    = libData?.albums    ?? libData?.albumCount    ?? '…';
  const tracks    = libData?.tracks    ?? libData?.trackCount    ?? '…';
  const composers = libData?.composers ?? libData?.composerCount ?? '—';

  const iconArtist = `<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>`;
  const iconAlbum  = `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="3" x2="12" y2="9"/></svg>`;
  const iconTrack  = `<svg viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`;
  const iconComp   = `<svg viewBox="0 0 24 24"><path d="M9 12h6M9 8h6M9 16h4"/><rect x="3" y="4" width="18" height="16" rx="2"/></svg>`;

  return `
    <div class="home-greeting">
      <div class="home-greeting-text">Hi, ${esc(displayName)}</div>
      <div class="home-stat-cards">
        <div class="home-stat-card">
          <div class="home-stat-icon">${iconArtist}</div>
          <div class="home-stat-body">
            <div class="home-stat-value" id="hstat-artists">${fmt(artists)}</div>
            <div class="home-stat-label">Artists</div>
          </div>
        </div>
        <div class="home-stat-card">
          <div class="home-stat-icon">${iconAlbum}</div>
          <div class="home-stat-body">
            <div class="home-stat-value" id="hstat-albums">${fmt(albums)}</div>
            <div class="home-stat-label">Albums</div>
          </div>
        </div>
        <div class="home-stat-card">
          <div class="home-stat-icon">${iconTrack}</div>
          <div class="home-stat-body">
            <div class="home-stat-value" id="hstat-tracks">${fmt(tracks)}</div>
            <div class="home-stat-label">Tracks</div>
          </div>
        </div>
        <div class="home-stat-card">
          <div class="home-stat-icon">${iconComp}</div>
          <div class="home-stat-body">
            <div class="home-stat-value" id="hstat-composers">${fmt(composers)}</div>
            <div class="home-stat-label">Composers</div>
          </div>
        </div>
      </div>
    </div>`;
}

// ── Section 2: Recent Activity ────────────────────────────────────────────

function recentCoversHtml(tracks) {
  if (!tracks?.length) {
    return `<div style="color:rgba(255,255,255,0.5);font-size:13px;padding:12px 0">Geen recente activiteit</div>`;
  }
  const items = tracks.slice(0, 8);
  return items.map(t => {
    const img = coverImg(t.image?.[2]?.['#text'] || t.image?.[1]?.['#text'], 120);
    const imgEl = img
      ? `<img src="${esc(img)}" alt="${esc(t.name)}" loading="lazy">`
      : `<div class="home-recent-cover-ph">♪</div>`;
    return `
      <div class="home-recent-cover">
        ${imgEl}
        <div class="home-recent-cover-label" title="${esc(t.name)}">${esc(t.name)}</div>
        <div class="home-recent-cover-label" style="opacity:.7">${esc(t.artist?.['#text'] || t.artist || '')}</div>
      </div>`;
  }).join('');
}

function renderRecentActivity(tracks) {
  return `
    <div class="home-recent-banner">
      <div class="home-recent-header">
        <div class="home-recent-title">Recent activity</div>
        <div class="home-recent-tabs">
          <button class="home-recent-tab active" data-recent-tab="played">PLAYED</button>
          <button class="home-recent-tab" data-recent-tab="loved">LOVED</button>
        </div>
        <button class="home-recent-more" id="home-recent-more">MORE</button>
      </div>
      <div class="home-recent-row">
        <button class="home-recent-nav" id="home-recent-prev" aria-label="Vorige">&#8249;</button>
        <div class="home-recent-covers-wrap">
          <div class="home-recent-covers" id="home-recent-covers">
            ${recentCoversHtml(tracks)}
          </div>
        </div>
        <button class="home-recent-nav" id="home-recent-next" aria-label="Volgende">&#8250;</button>
      </div>
    </div>`;
}

// ── Section 3: Listen Later ───────────────────────────────────────────────

function renderListenLater(wishlist) {
  const items = (wishlist || []).slice(0, 4);
  if (!items.length) {
    return `
      <div class="home-section-header">
        <div class="home-section-title" style="font-family:var(--font-display)">Listen Later</div>
        <button class="home-more-btn" data-switch="bibliotheek">MORE</button>
      </div>
      <div class="home-listen-later-grid">
        <div class="home-listen-later-empty">Je wishlist is leeg. Voeg albums toe via de zoekfunctie.</div>
      </div>`;
  }

  const itemsHtml = items.map(item => {
    const img = coverImg(item.image, 96);
    const imgEl = img
      ? `<img class="home-listen-later-img" src="${esc(img)}" alt="${esc(item.name)}" loading="lazy">`
      : `<div class="home-listen-later-ph">♫</div>`;
    return `
      <div class="home-listen-later-item">
        ${imgEl}
        <div class="home-listen-later-info">
          <div class="home-listen-later-name" title="${esc(item.name)}">${esc(item.name)}</div>
          <div class="home-listen-later-artist" title="${esc(item.artist || '')}">${esc(item.artist || '')}</div>
        </div>
        <div class="home-listen-later-type">${esc(item.type || 'album')}</div>
      </div>`;
  }).join('');

  return `
    <div class="home-section-header">
      <div class="home-section-title" style="font-family:var(--font-display)">Listen Later</div>
      <button class="home-more-btn" data-switch="bibliotheek">MORE</button>
    </div>
    <div class="home-listen-later-grid">${itemsHtml}</div>`;
}

// ── Section 4: Daily Mixes ────────────────────────────────────────────────

function renderDailyMixes(topArtists) {
  const artists = (topArtists?.topartists?.artist || []).slice(0, 2);

  const cards = artists.map((a, i) => {
    const img = coverImg(a.image?.[3]?.['#text'] || a.image?.[2]?.['#text'], 400);
    const imgEl = img
      ? `<img src="${esc(img)}" alt="${esc(a.name)}" loading="lazy">`
      : `<div class="home-mix-ph">♪</div>`;
    return `
      <div class="home-mix-card">
        ${imgEl}
        <div class="home-mix-overlay"></div>
        <div class="home-mix-info">
          <div class="home-mix-label">Daily Mix ${i + 1}</div>
          <div class="home-mix-name">${esc(a.name)}</div>
        </div>
      </div>`;
  });

  // Vul aan met placeholders als minder dan 2 artiesten
  while (cards.length < 2) {
    const n = cards.length + 1;
    cards.push(`
      <div class="home-mix-card">
        <div class="home-mix-ph">♪</div>
        <div class="home-mix-overlay"></div>
        <div class="home-mix-info">
          <div class="home-mix-label">Daily Mix ${n}</div>
          <div class="home-mix-name">Laden…</div>
        </div>
      </div>`);
  }

  return `
    <div class="home-section-header">
      <div class="home-section-title">Your Daily Mixes</div>
      <button class="home-more-btn" data-switch="ontdek">MORE</button>
    </div>
    <div class="home-daily-mixes">${cards.join('')}</div>`;
}

// ── Section 5: New Releases ───────────────────────────────────────────────

function renderNewReleases(releases) {
  const items = (releases?.releases || releases || []).slice(0, 3);

  if (!items.length) {
    return `
      <div class="home-section-header">
        <div class="home-tabs">
          <button class="home-tab active">ALBUMS</button>
          <button class="home-tab">SINGLES</button>
        </div>
        <div class="home-section-title">New releases for you</div>
        <button class="home-more-btn" data-switch="ontdek">MORE</button>
      </div>
      <div class="home-releases-grid">
        <div class="home-releases-empty">Geen nieuwe releases gevonden.</div>
      </div>`;
  }

  const [main, ...rest] = items;
  const mainImg = coverImg(main.image || main.thumb, 400);
  const mainImgEl = mainImg
    ? `<img src="${esc(mainImg)}" alt="${esc(main.title || main.album || '')}" loading="lazy">`
    : `<div style="width:100%;height:100%;background:${gradientFor(main.title || 'release')};position:absolute;inset:0"></div>`;

  const smallCards = rest.slice(0, 2).map(r => {
    const img = coverImg(r.image || r.thumb, 120);
    const imgEl = img
      ? `<img src="${esc(img)}" alt="${esc(r.title || r.album || '')}" loading="lazy">`
      : `<div class="home-release-small-ph">♫</div>`;
    const badge = r.type?.toLowerCase() === 'single' ? 'Single' : 'Album';
    return `
      <div class="home-release-small">
        ${imgEl}
        <div class="home-release-small-info">
          <div class="home-release-small-title" title="${esc(r.title || r.album || '')}">${esc(r.title || r.album || '—')}</div>
          <div class="home-release-small-artist">${esc(r.artist || '—')}</div>
        </div>
        <div class="home-release-small-badge">${esc(badge)}</div>
      </div>`;
  }).join('');

  return `
    <div class="home-section-header">
      <div class="home-tabs">
        <button class="home-tab active">ALBUMS</button>
        <button class="home-tab">SINGLES</button>
      </div>
      <div class="home-section-title">New releases for you</div>
      <button class="home-more-btn" data-switch="ontdek">MORE</button>
    </div>
    <div class="home-releases-grid">
      <div class="home-release-main">
        ${mainImgEl}
        <div class="home-release-main-overlay"></div>
        <div class="home-release-main-info">
          <div class="home-release-main-artist">${esc(main.artist || '—')}</div>
          <div class="home-release-main-title">${esc(main.title || main.album || '—')}</div>
          <div class="home-release-main-meta">${esc(main.date || main.releaseDate || '')}</div>
        </div>
      </div>
      ${smallCards}
    </div>`;
}

// ── Section 6: Listening Stats ────────────────────────────────────────────

function buildGenreData(topTracks) {
  // Haal tags uit top tracks om genre-verdeling te simuleren
  // We gebruiken artiestnamen als proxy voor genres als tags ontbreken
  const tracks = topTracks?.toptracks?.track || [];
  const countMap = {};
  for (const t of tracks) {
    const tag = t.artist?.name || t.artist || 'Overig';
    countMap[tag] = (countMap[tag] || 0) + (parseInt(t.playcount, 10) || 1);
  }
  const sorted = Object.entries(countMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const total = sorted.reduce((s, [, v]) => s + v, 0);
  return sorted.map(([name, count], i) => ({
    name,
    count,
    pct: total ? Math.round((count / total) * 100) : 0,
    color: DONUT_COLORS[i % DONUT_COLORS.length],
  }));
}

function topBarsHtml(items, valueKey = 'playcount', nameKey = 'name') {
  if (!items?.length) return `<div style="color:var(--text-muted);font-size:13px">Geen data</div>`;
  const max = parseInt(items[0]?.[valueKey], 10) || 1;
  return items.slice(0, 4).map((item, i) => {
    const count = parseInt(item[valueKey], 10) || 0;
    const pct = Math.round((count / max) * 100);
    const img = coverImg(item.image?.[1]?.['#text'] || item.image?.[0]?.['#text'], 64);
    const imgEl = img
      ? `<img class="home-top-bar-img" src="${esc(img)}" alt="${esc(item[nameKey] || '')}" loading="lazy">`
      : `<div class="home-top-bar-ph">♪</div>`;
    return `
      <div class="home-top-bar-item">
        <div class="home-top-bar-rank">${i + 1}</div>
        ${imgEl}
        <div class="home-top-bar-info">
          <div class="home-top-bar-name">${esc(item[nameKey] || '—')}</div>
          <div class="home-top-bar-sub">${fmt(count)} plays</div>
          <div class="home-top-bar-track">
            <div class="home-top-bar-fill" style="width:${pct}%"></div>
          </div>
        </div>
      </div>`;
  }).join('');
}

function renderListeningStats(topArtists, topTracks) {
  const artists = topArtists?.topartists?.artist || [];
  const tracks  = topTracks?.toptracks?.track   || [];
  const genres  = buildGenreData(topTracks);

  const legendHtml = genres.map(g => `
    <div class="home-donut-legend-item">
      <div class="home-donut-legend-dot" style="background:${g.color}"></div>
      <div class="home-donut-legend-name">${esc(g.name)}</div>
      <div class="home-donut-legend-pct">${g.pct}%</div>
    </div>`).join('');

  return `
    <div class="home-stats-header">
      <div class="home-stats-title">What you've been listening to</div>
      <select class="home-stats-period" id="home-stats-period">
        <option value="7day" selected>Last week</option>
        <option value="1month">Last month</option>
        <option value="3month">Last 3 months</option>
        <option value="12month">Last year</option>
      </select>
      <button class="home-more-btn" data-switch="bibliotheek">MORE</button>
    </div>
    <div class="home-stats-grid">
      <div class="home-donut-wrap">
        <div class="home-donut-canvas-wrap">
          <canvas id="home-donut-chart" width="160" height="160"></canvas>
        </div>
        <div class="home-donut-label">Genres</div>
        <div class="home-donut-legend" id="home-donut-legend">${legendHtml}</div>
      </div>
      <div class="home-top-col">
        <div class="home-top-col-title">Top Artists</div>
        ${topBarsHtml(artists, 'playcount', 'name')}
      </div>
      <div class="home-top-col">
        <div class="home-top-col-title">Top Tracks</div>
        ${topBarsHtml(tracks, 'playcount', 'name')}
      </div>
    </div>`;
}

// ── Donut chart tekenen via canvas 2D ─────────────────────────────────────

function drawDonut(canvasId, genres) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const cx = W / 2;
  const cy = H / 2;
  const outerR = W / 2 - 6;
  const innerR = outerR * 0.58;
  const total = genres.reduce((s, g) => s + g.pct, 0) || 1;

  ctx.clearRect(0, 0, W, H);

  let angle = -Math.PI / 2;
  for (const g of genres) {
    const slice = (g.pct / total) * 2 * Math.PI;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, outerR, angle, angle + slice);
    ctx.closePath();
    ctx.fillStyle = g.color;
    ctx.fill();
    angle += slice;
  }

  // Punch inner circle (donut hole)
  ctx.beginPath();
  ctx.arc(cx, cy, innerR, 0, 2 * Math.PI);
  ctx.fillStyle = getComputedStyle(document.documentElement)
    .getPropertyValue('--bg-primary').trim() || '#ffffff';
  ctx.fill();
}

// ── Recent carousel interactie ────────────────────────────────────────────

function initRecentCarousel() {
  const covers  = document.getElementById('home-recent-covers');
  const prevBtn = document.getElementById('home-recent-prev');
  const nextBtn = document.getElementById('home-recent-next');
  if (!covers || !prevBtn || !nextBtn) return;

  let offset = 0;
  const STEP = 224; // 100px cover + 12px gap × 2

  function update() {
    const maxOffset = Math.max(0, covers.scrollWidth - covers.parentElement.offsetWidth);
    offset = Math.max(0, Math.min(offset, maxOffset));
    covers.style.transform = `translateX(-${offset}px)`;
    prevBtn.disabled = offset <= 0;
    nextBtn.disabled = offset >= maxOffset;
  }

  prevBtn.addEventListener('click', () => { offset = Math.max(0, offset - STEP); update(); });
  nextBtn.addEventListener('click', () => { offset += STEP; update(); });
  update();
}

// ── Stats period herlaad ──────────────────────────────────────────────────

async function reloadStats(period) {
  const statsSection = document.getElementById('home-stats-section');
  if (!statsSection) return;

  try {
    const [topArtists, topTracks] = await Promise.all([
      apiFetch(`/api/topartists?period=${period}`),
      apiFetch(`/api/toptracks?period=${period}`),
    ]);

    const statsGrid = statsSection.querySelector('.home-stats-grid');
    if (!statsGrid) return;

    const genres   = buildGenreData(topTracks);
    const artists  = topArtists?.topartists?.artist || [];
    const tracks   = topTracks?.toptracks?.track   || [];

    // Update legend
    const legend = document.getElementById('home-donut-legend');
    if (legend) {
      legend.innerHTML = genres.map(g => `
        <div class="home-donut-legend-item">
          <div class="home-donut-legend-dot" style="background:${g.color}"></div>
          <div class="home-donut-legend-name">${esc(g.name)}</div>
          <div class="home-donut-legend-pct">${g.pct}%</div>
        </div>`).join('');
    }
    drawDonut('home-donut-chart', genres);

    // Update top cols
    const cols = statsGrid.querySelectorAll('.home-top-col');
    if (cols[0]) {
      cols[0].innerHTML = `<div class="home-top-col-title">Top Artists</div>${topBarsHtml(artists, 'playcount', 'name')}`;
    }
    if (cols[1]) {
      cols[1].innerHTML = `<div class="home-top-col-title">Top Tracks</div>${topBarsHtml(tracks, 'playcount', 'name')}`;
    }
  } catch (err) {
    console.warn('Stats herlaad mislukt:', err);
  }
}

// ── Username resolven ─────────────────────────────────────────────────────

async function resolveUsername() {
  // Probeer state eerst (al geladen via loadUser())
  if (state.user?.name) return state.user.name;
  try {
    const data = await apiFetch('/api/user');
    return data?.user?.name || data?.name || null;
  } catch {
    return null;
  }
}

// ── Library stats normaliseren ────────────────────────────────────────────

function normalizeLibStats(data) {
  // /api/plex/library geeft verschillende vormen terug
  if (!data) return {};
  // Probeer directe properties
  if (data.artistCount !== undefined) return data;
  // Soms genest onder 'library' of 'stats'
  if (data.library) return normalizeLibStats(data.library);
  if (data.stats)   return data.stats;
  // Plex /api/plex/status geeft size, artistCount, albumCount
  return data;
}

// ── Main loadHome() ───────────────────────────────────────────────────────

export async function loadHome() {
  const content = document.getElementById('content');
  if (!content) return;

  // Toon snel skelet terwijl data laadt
  content.innerHTML = `
    <div class="home-page">
      <div class="home-skeleton" style="height:120px;border-radius:8px"></div>
      <div class="home-skeleton" style="height:200px;border-radius:12px"></div>
      <div class="home-skeleton" style="height:160px;border-radius:8px"></div>
      <div class="home-skeleton" style="height:240px;border-radius:8px"></div>
    </div>`;

  // ── Parallel data fetching ─────────────────────────────────────────────
  const [
    username,
    libRaw,
    recentRaw,
    wishlistRaw,
    topArtistsRaw,
    topTracksRaw,
    releasesRaw,
  ] = await Promise.all([
    resolveUsername().catch(() => null),
    apiFetch('/api/plex/status').catch(() => null),
    apiFetch('/api/recent').catch(() => null),
    apiFetch('/api/wishlist').catch(() => null),
    apiFetch('/api/topartists?period=7day').catch(() => null),
    apiFetch('/api/toptracks?period=7day').catch(() => null),
    apiFetch('/api/releases').catch(() => null),
  ]);

  const libData  = normalizeLibStats(libRaw);
  const tracks   = recentRaw?.recenttracks?.track || [];
  const wishlist = wishlistRaw?.wishlist || wishlistRaw || [];
  const releases = releasesRaw;

  // ── Render alle secties ────────────────────────────────────────────────
  content.innerHTML = `
    <div class="home-page">

      <!-- 1. Greeting + Stats -->
      ${renderGreeting(username, libData)}

      <!-- 2. Recent Activity -->
      ${renderRecentActivity(tracks)}

      <!-- 3. Listen Later -->
      <div>${renderListenLater(wishlist)}</div>

      <!-- 4. Daily Mixes -->
      <div>${renderDailyMixes(topArtistsRaw)}</div>

      <!-- 5. New Releases -->
      <div>${renderNewReleases(releases)}</div>

      <!-- 6. Listening Stats -->
      <div id="home-stats-section">
        ${renderListeningStats(topArtistsRaw, topTracksRaw)}
      </div>

    </div>`;

  // ── Post-render initialisatie ──────────────────────────────────────────

  // Carousel
  initRecentCarousel();

  // Donut chart
  const genres = buildGenreData(topTracksRaw);
  drawDonut('home-donut-chart', genres);

  // "MORE" knoppen → switchView
  content.querySelectorAll('[data-switch]').forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.switch));
  });

  // Recent "MORE" knop
  document.getElementById('home-recent-more')?.addEventListener('click', () => {
    switchView('bibliotheek');
  });

  // Recent tabs (PLAYED / LOVED)
  let recentTab = 'played';
  content.querySelectorAll('[data-recent-tab]').forEach(tab => {
    tab.addEventListener('click', async () => {
      content.querySelectorAll('[data-recent-tab]').forEach(t =>
        t.classList.toggle('active', t === tab));
      recentTab = tab.dataset.recentTab;

      const coversEl = document.getElementById('home-recent-covers');
      if (!coversEl) return;

      if (recentTab === 'loved') {
        try {
          const data = await apiFetch('/api/loved');
          const lovedTracks = data?.lovedtracks?.track || [];
          coversEl.innerHTML = recentCoversHtml(lovedTracks.map(t => ({
            ...t,
            // loved tracks hebben iets andere structuur
            image: t.image,
          })));
        } catch { /* stil falen */ }
      } else {
        coversEl.innerHTML = recentCoversHtml(tracks);
      }
    });
  });

  // Stats period dropdown
  document.getElementById('home-stats-period')?.addEventListener('change', async e => {
    await reloadStats(e.target.value);
  });
}
