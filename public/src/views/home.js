// ── View: Home Dashboard ──────────────────────────────────────────────────
// Startpagina met preview-widgets die elk doorlinken naar een volledige view.
// Secties: greeting + stats, recent activity, listen later,
//          daily mixes, new releases, listening stats.

import { apiFetch } from '../api.js';
import { switchView } from '../router.js';
import { esc, proxyImg, gradientFor } from '../helpers.js';
import { state } from '../state.js';
import { openArtistPanel } from '../components/panel.js';

// ── Kleuren voor genre donut (blauw-paars spectrum) ───────────────────────
const GENRE_COLORS = ['#1a237e', '#283593', '#3949ab', '#5c6bc0', '#7986cb', '#9fa8da'];

// Huidige Chart.js instantie — vernietigen voor hergebruik
let _genreChartInstance = null;

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

// ── Section 3b: Your Recent Artists ──────────────────────────────────────

function renderRecentArtists(topArtists) {
  const artists = (topArtists?.topartists?.artist || []).slice(0, 5);
  if (!artists.length) return '';

  const artistsHtml = artists.map(a => {
    const img = coverImg(a.image?.[3]?.['#text'] || a.image?.[2]?.['#text'], 200);
    const imgEl = img
      ? `<img class="home-artist-circle-img" src="${esc(img)}" alt="${esc(a.name)}" loading="lazy">`
      : `<div class="home-artist-circle-ph">♪</div>`;
    return `
      <div class="home-artist-circle-item" data-artist="${esc(a.name)}">
        <div class="home-artist-circle">${imgEl}</div>
        <div class="home-artist-circle-name">${esc(a.name)}</div>
      </div>`;
  }).join('');

  return `
    <div class="home-section-header">
      <div class="home-section-title">Your recent artists</div>
      <div class="home-recent-artists-nav">
        <button class="home-recent-artists-btn" id="home-artists-prev" aria-label="Vorige">&#8249;</button>
        <button class="home-recent-artists-btn" id="home-artists-next" aria-label="Volgende">&#8250;</button>
      </div>
      <button class="home-more-btn" data-switch="bibliotheek">MORE</button>
    </div>
    <div class="home-recent-artists-wrap">
      <div class="home-recent-artists" id="home-recent-artists">${artistsHtml}</div>
    </div>`;
}

// ── Section 4: Daily Mixes ────────────────────────────────────────────────

function renderDailyMixes(topArtists) {
  const artists = (topArtists?.topartists?.artist || []).slice(0, 2);

  const cards = artists.map((a, i) => {
    const rawImg = a.image?.[3]?.['#text'] || a.image?.[2]?.['#text'] || '';
    const imgUrl = rawImg ? proxyImg(rawImg, 400) : '';
    const bgCss = imgUrl
      ? `background: linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.6)), url('${esc(imgUrl)}'); background-size: cover; background-position: center;`
      : `background: linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.7));`;
    return `
      <div class="home-mix-card" data-switch="ontdek" style="${bgCss}">
        <div class="home-mix-info">
          <div class="home-mix-label">DAILY MIX</div>
          <div class="home-mix-name">${esc(a.name)} Mix</div>
          <div class="home-mix-featuring" id="home-mix-featuring-${i}">Laden…</div>
        </div>
      </div>`;
  });

  // Vul aan met placeholders als minder dan 2 artiesten
  while (cards.length < 2) {
    const n = cards.length + 1;
    cards.push(`
      <div class="home-mix-card" data-switch="ontdek" style="background: var(--bg-tertiary);">
        <div class="home-mix-ph">♪</div>
        <div class="home-mix-info">
          <div class="home-mix-label">DAILY MIX</div>
          <div class="home-mix-name">Laden…</div>
          <div class="home-mix-featuring"></div>
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

// ── Lazy-load "Featuring…" tekst voor Daily Mixes ─────────────────────────

async function loadDailyMixFeaturing(topArtists) {
  const artists = (topArtists?.topartists?.artist || []).slice(0, 2);
  for (let i = 0; i < artists.length; i++) {
    const a = artists[i];
    const el = document.getElementById(`home-mix-featuring-${i}`);
    if (!el) continue;
    try {
      const data = await apiFetch(`/api/artist/${encodeURIComponent(a.name)}/similar`);
      const similar = (data?.similarartists?.artist || data?.similar || []).slice(0, 3);
      if (similar.length) {
        const names = similar.map(s => esc(s.name || s)).join(', ');
        el.textContent = `Featuring ${similar.slice(0, 3).map(s => s.name || s).join(', ')} and more`;
      } else {
        el.textContent = '';
      }
    } catch {
      el.textContent = '';
    }
  }
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

// ── Section 6: What you've been listening to ─────────────────────────────

// ── Blok 1: Genres ─────────────────────────────────────────────────────────

function drawGenreChart(genres) {
  const canvas = document.getElementById('home-donut-chart');
  if (!canvas || !window.Chart) return;

  if (_genreChartInstance) {
    _genreChartInstance.destroy();
    _genreChartInstance = null;
  }

  _genreChartInstance = new window.Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: genres.map(g => g.name),
      datasets: [{
        data:            genres.map(g => g.count),
        backgroundColor: genres.map(g => g.color),
        borderWidth:     0,
        hoverOffset:     4,
      }],
    },
    options: {
      cutout: '65%',
      plugins: {
        legend:  { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.label}: ${fmt(ctx.parsed)} plays`,
          },
        },
      },
      animation: { duration: 400 },
    },
  });
}

async function loadAndRenderGenres(period) {
  const legendEl = document.getElementById('home-genres-legend');
  try {
    const data    = await apiFetch(`/api/top/artists?period=${period}`);
    const artists = (data?.topartists?.artist || []).slice(0, 8);

    // Groepeer op topTag, tel playcounts op
    const genreMap = {};
    for (const a of artists) {
      const tag      = a.topTag || 'Other';
      const playcount = parseInt(a.playcount, 10) || 0;
      genreMap[tag] = (genreMap[tag] || 0) + playcount;
    }

    const sorted = Object.entries(genreMap).sort((a, b) => b[1] - a[1]);
    const top6   = sorted.slice(0, 6);
    const rest   = sorted.slice(6).reduce((s, [, v]) => s + v, 0);
    if (rest > 0) {
      const otherIdx = top6.findIndex(([n]) => n === 'Other');
      if (otherIdx >= 0) top6[otherIdx][1] += rest;
      else top6.push(['Other', rest]);
    }

    const total  = top6.reduce((s, [, v]) => s + v, 0) || 1;
    const genres = top6.map(([name, count], i) => ({
      name,
      count,
      pct:   Math.round(count / total * 100),
      color: GENRE_COLORS[i % GENRE_COLORS.length],
    }));

    if (legendEl) {
      legendEl.innerHTML = genres.map(g => `
        <div class="home-genres-legend-item">
          <div class="home-genres-legend-dot" style="background:${g.color}"></div>
          <div class="home-genres-legend-name">${esc(g.name)}</div>
        </div>`).join('');
    }
    drawGenreChart(genres);
  } catch (err) {
    console.warn('Genre chart mislukt:', err);
    if (legendEl) legendEl.innerHTML = `<div style="color:var(--text-muted);font-size:13px">Geen genre-data</div>`;
  }
}

// ── Blok 2: Top Artists ────────────────────────────────────────────────────

function renderTopArtistsList(topArtists) {
  const artists = (topArtists?.topartists?.artist || []).slice(0, 4);
  if (!artists.length) return `<div style="color:var(--text-muted);font-size:13px">Geen data</div>`;
  const max = parseInt(artists[0]?.playcount, 10) || 1;
  return artists.map(a => {
    const pct = Math.round((parseInt(a.playcount, 10) || 0) / max * 100);
    const img = coverImg(a.image?.[2]?.['#text'] || a.image?.[1]?.['#text'], 72);
    const imgEl = img
      ? `<img class="home-wylbt-artist-img" src="${esc(img)}" alt="${esc(a.name)}" loading="lazy">`
      : `<div class="home-wylbt-artist-ph">♪</div>`;
    return `
      <div class="home-wylbt-artist-item" data-artist="${esc(a.name)}">
        ${imgEl}
        <div class="home-wylbt-item-info">
          <div class="home-wylbt-item-name">${esc(a.name)}</div>
          <div class="home-wylbt-bar-wrap">
            <div class="home-wylbt-bar-track">
              <div class="home-wylbt-bar-fill" style="width:${pct}%"></div>
            </div>
          </div>
        </div>
        <div class="home-wylbt-item-count">${fmt(parseInt(a.playcount, 10) || 0)}</div>
      </div>`;
  }).join('');
}

// ── Blok 3: Top Releases ───────────────────────────────────────────────────

function buildTopReleases(topTracks) {
  const albumMap = {};
  for (const t of (topTracks?.toptracks?.track || [])) {
    const album  = t.album?.['#text'] || t.album?.name || null;
    const artist = t.artist?.name || t.artist?.['#text'] || t.artist || '';
    if (!album) continue;
    const key = `${album}|||${artist}`;
    if (!albumMap[key]) {
      albumMap[key] = { album, artist, playcount: 0, image: t.image };
    }
    albumMap[key].playcount += parseInt(t.playcount, 10) || 0;
  }
  return Object.values(albumMap)
    .sort((a, b) => b.playcount - a.playcount)
    .slice(0, 4);
}

function renderTopReleasesList(topTracks) {
  const releases = buildTopReleases(topTracks);
  if (!releases.length) return `<div style="color:var(--text-muted);font-size:13px">Geen data</div>`;
  const max = releases[0]?.playcount || 1;
  return releases.map(r => {
    const pct  = Math.round(r.playcount / max * 100);
    const img  = coverImg(r.image?.[2]?.['#text'] || r.image?.[1]?.['#text'], 72);
    const imgEl = img
      ? `<img class="home-wylbt-release-img" src="${esc(img)}" alt="${esc(r.album)}" loading="lazy">`
      : `<div class="home-wylbt-release-ph">♫</div>`;
    return `
      <div class="home-wylbt-release-item">
        ${imgEl}
        <div class="home-wylbt-item-info">
          <div class="home-wylbt-item-name">${esc(r.album)}</div>
          <div class="home-wylbt-item-sub">${esc(r.artist)}</div>
          <div class="home-wylbt-bar-wrap">
            <div class="home-wylbt-bar-track">
              <div class="home-wylbt-bar-fill" style="width:${pct}%"></div>
            </div>
          </div>
        </div>
        <div class="home-wylbt-item-count">${fmt(r.playcount)}</div>
      </div>`;
  }).join('');
}

// ── Shell HTML voor de sectie ──────────────────────────────────────────────

function renderListeningStats(topArtists, topTracks) {
  return `
    <div class="home-wylbt-header">
      <div class="home-wylbt-title">What you've been listening to</div>
      <select class="home-stats-period" id="home-stats-period">
        <option value="7day"    selected>Last week</option>
        <option value="1month">Last month</option>
        <option value="3month">Last 3 months</option>
        <option value="12month">Last year</option>
        <option value="overall">All time</option>
      </select>
    </div>

    <div class="home-wylbt-blocks">

      <!-- Blok 1: Genres donut -->
      <div class="home-wylbt-card">
        <div class="home-wylbt-card-header">
          <div class="home-wylbt-card-title">Genres</div>
          <button class="home-more-btn">MORE</button>
        </div>
        <div class="home-genres-body">
          <div class="home-genres-chart-wrap">
            <canvas id="home-donut-chart" width="160" height="160"></canvas>
          </div>
          <div class="home-genres-legend" id="home-genres-legend">
            <div style="color:var(--text-muted);font-size:13px">Laden…</div>
          </div>
        </div>
      </div>

      <!-- Blok 2: Top Artists -->
      <div class="home-wylbt-card">
        <div class="home-wylbt-card-header">
          <div class="home-wylbt-card-title">Your top artists</div>
          <button class="home-more-btn" data-switch="bibliotheek">MORE</button>
        </div>
        <div id="home-wylbt-artists-list">
          ${renderTopArtistsList(topArtists)}
        </div>
      </div>

      <!-- Blok 3: Top Releases -->
      <div class="home-wylbt-card">
        <div class="home-wylbt-card-header">
          <div class="home-wylbt-card-title">Your top releases</div>
          <button class="home-more-btn">MORE</button>
        </div>
        <div id="home-wylbt-releases-list">
          ${renderTopReleasesList(topTracks)}
        </div>
      </div>

    </div>`;
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
  // Alle 3 blokken parallel herladen
  const [topArtists, topTracks] = await Promise.all([
    apiFetch(`/api/topartists?period=${period}`).catch(() => null),
    apiFetch(`/api/toptracks?period=${period}`).catch(() => null),
  ]);

  // Blok 2: Top Artists
  const artistsList = document.getElementById('home-wylbt-artists-list');
  if (artistsList) artistsList.innerHTML = renderTopArtistsList(topArtists);

  // Blok 3: Top Releases
  const releasesList = document.getElementById('home-wylbt-releases-list');
  if (releasesList) releasesList.innerHTML = renderTopReleasesList(topTracks);

  // Klik-handlers voor artiesten opnieuw koppelen
  artistsList?.querySelectorAll('[data-artist]').forEach(item => {
    item.addEventListener('click', () => openArtistPanel(item.dataset.artist));
  });

  // Blok 1: Genres (async, update chart + legend)
  await loadAndRenderGenres(period);
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

      <!-- 3b. Recent Artists -->
      <div>${renderRecentArtists(topArtistsRaw)}</div>

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

  // Genre donut — asynchroon laden (eigen API-calls, geen blokkering)
  loadAndRenderGenres('7day');

  // "MORE" knoppen → switchView
  content.querySelectorAll('[data-switch]').forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.switch));
  });

  // Top-artists in WYLBT → open artiest panel
  content.querySelectorAll('#home-wylbt-artists-list [data-artist]').forEach(item => {
    item.addEventListener('click', () => openArtistPanel(item.dataset.artist));
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

  // Artiest cirkels → open artiest panel
  content.querySelectorAll('.home-artist-circle-item').forEach(item => {
    item.addEventListener('click', () => {
      const name = item.dataset.artist;
      if (name) openArtistPanel(name);
    });
  });

  // Recent artists nav pijlen
  const artistsRow = document.getElementById('home-recent-artists');
  if (artistsRow) {
    const ARTIST_STEP = 128; // 100px + 28px gap
    document.getElementById('home-artists-prev')?.addEventListener('click', () => {
      artistsRow.scrollBy({ left: -ARTIST_STEP * 2, behavior: 'smooth' });
    });
    document.getElementById('home-artists-next')?.addEventListener('click', () => {
      artistsRow.scrollBy({ left: ARTIST_STEP * 2, behavior: 'smooth' });
    });
  }

  // Lazy-load "Featuring…" voor Daily Mixes
  loadDailyMixFeaturing(topArtistsRaw);
}
