// ── View: Home Dashboard ──────────────────────────────────────────────────
// Startpagina met preview-widgets die elk doorlinken naar een volledige view.
// Secties: greeting + stats, recent activity, listen later,
//          daily mixes, new releases, listening stats.

import { apiFetch, plexFirstFetch } from '../api.js';
import { switchView } from '../router.js';
import { esc, proxyImg, gradientFor } from '../helpers.js';
import { state } from '../state.js';
import { openArtistPanel } from '../components/panel.js';

// ── Kleuren voor genre donut (blauw-paars spectrum) ───────────────────────
const GENRE_COLORS = ['#1a237e', '#283593', '#3949ab', '#5c6bc0', '#7986cb', '#9fa8da'];

// Huidige Chart.js instantie — vernietigen voor hergebruik
let _genreChartInstance = null;

// ── Plex Data Normalisatie ────────────────────────────────────────────────
// Converteer Plex API responses naar Last.fm formaat voor render-functies

function normalizePlexArtists(plexTopArtists) {
  if (!plexTopArtists || !Array.isArray(plexTopArtists)) {
    return { topartists: { artist: [] } };
  }

  return {
    topartists: {
      artist: plexTopArtists.map(a => {
        const thumbUrl = a.thumb
          ? (a.thumb.startsWith('http') ? a.thumb : `/api/imageproxy?url=${encodeURIComponent(a.thumb)}`)
          : '';
        return {
          name: a.name,
          playcount: String(a.playcount || 0),
          image: [null, null, { '#text': thumbUrl }, { '#text': thumbUrl }],
          topTag: a.genre || null,
        };
      })
    }
  };
}

function normalizePlexTracks(plexTopTracks) {
  if (!plexTopTracks || !Array.isArray(plexTopTracks)) {
    return { toptracks: { track: [] } };
  }

  return {
    toptracks: {
      track: plexTopTracks.map(t => {
        const thumbUrl = t.thumb
          ? (t.thumb.startsWith('http') ? t.thumb : `/api/imageproxy?url=${encodeURIComponent(t.thumb)}`)
          : '';
        return {
          name: t.title,
          playcount: String(t.playcount || 0),
          artist: { name: t.artist, '#text': t.artist },
          album: { '#text': t.album, name: t.album },
          image: [null, null, { '#text': thumbUrl }],
        };
      })
    }
  };
}

function normalizePlexRecent(plexRecentTracks) {
  if (!plexRecentTracks || !Array.isArray(plexRecentTracks)) {
    return [];
  }

  return plexRecentTracks.map(t => {
    const thumbUrl = t.thumb
      ? (t.thumb.startsWith('http') ? t.thumb : `/api/imageproxy?url=${encodeURIComponent(t.thumb)}`)
      : '';
    return {
      name: t.title,
      artist: { '#text': t.artist },
      album: { '#text': t.album },
      image: [null, null, { '#text': thumbUrl }],
      date: { uts: String(t.viewedAt) },
    };
  });
}

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

// ── Live Radio Bar ────────────────────────────────────────────────────────

function renderLiveRadioBar() {
  return `
    <div class="live-radio-bar">
      <div class="live-radio-badge">
        <span class="live-radio-dot"></span>
        <span class="live-radio-name">NPO Radio 2</span>
      </div>
      <div class="live-radio-info">NPO Radio 2 — Hilversum, Netherlands, 92.6 FM</div>
      <a href="#" class="live-radio-more" onclick="return false">More live radio</a>
    </div>`;
}

// ── Activity Matrix helpers ───────────────────────────────────────────────

function fmtDuration(minutes) {
  if (!minutes || minutes < 1) return '0m';
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// ── Section: Recent Listening activity matrix ─────────────────────────────

function renderActivityMatrix(recentTracks) {
  // Group tracks by calendar day (YYYY-MM-DD)
  const dayMap = {};
  for (const t of (recentTracks || [])) {
    const uts = t.date?.uts;
    if (!uts) continue; // skip "now playing" tracks without timestamp
    const date = new Date(parseInt(uts, 10) * 1000);
    const key = date.toISOString().slice(0, 10);
    dayMap[key] = (dayMap[key] || 0) + 3.5; // ~3.5 min per track
  }

  // Build 4 weeks (Mon–Sun), most recent first
  const now = new Date();
  const dow = now.getDay(); // 0=Sun
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((dow + 6) % 7));
  monday.setHours(0, 0, 0, 0);

  const weeks = [];
  for (let w = 0; w < 4; w++) {
    const weekStart = new Date(monday);
    weekStart.setDate(monday.getDate() - w * 7);
    const days = [];
    for (let d = 0; d < 7; d++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + d);
      const key = day.toISOString().slice(0, 10);
      days.push({ key, minutes: dayMap[key] || 0 });
    }
    weeks.push({ days, totalMinutes: days.reduce((s, d) => s + d.minutes, 0) });
  }

  const maxWeekMin = Math.max(...weeks.map(w => w.totalMinutes), 1);
  const maxDayMin  = Math.max(...weeks.flatMap(w => w.days.map(d => d.minutes)), 1);

  function dotStyle(minutes) {
    if (!minutes) return 'width:6px;height:6px;background:#e0e0e0;';
    const r = minutes / maxDayMin;
    if (r < 0.25) return 'width:10px;height:10px;background:var(--accent);opacity:0.4;';
    if (r < 0.6)  return 'width:16px;height:16px;background:var(--accent);opacity:0.7;';
    return 'width:24px;height:24px;background:var(--accent);opacity:1;';
  }

  // Each week renders as: 1 bar-wrap cell + 7 dot cells (all direct grid children)
  const rowsHtml = weeks.map(week => {
    const barPct = week.totalMinutes > 0
      ? Math.round(week.totalMinutes / maxWeekMin * 100)
      : 0;
    const dotsHtml = week.days.map(d =>
      `<div class="activity-dot-cell"><div class="activity-dot" style="${dotStyle(d.minutes)}" title="${d.key}: ${Math.round(d.minutes)}min"></div></div>`
    ).join('');
    return `
      <div class="activity-bar-wrap">
        <div class="activity-bar" style="width:${barPct}%"></div>
        <span class="activity-bar-label">${fmtDuration(week.totalMinutes)}</span>
      </div>
      ${dotsHtml}`;
  }).join('');

  const dayLabels = ['M','T','W','T','F','S','S'].map(l =>
    `<div class="activity-day-label">${l}</div>`
  ).join('');

  return `
    <div class="home-wylbt-card activity-matrix-card">
      <div class="home-wylbt-card-header" style="margin-bottom:16px">
        <div class="home-wylbt-card-title">Recent listening</div>
      </div>
      <div class="activity-grid">
        <!-- Header row -->
        <div class="activity-grid-label-header">Last 4 weeks</div>
        ${dayLabels}
        <!-- Week rows -->
        ${rowsHtml}
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

// ── Section: Genres for you ───────────────────────────────────────────────

function buildGenreData(topArtistsRaw) {
  // Plex stats brengen genres direct mee
  if (topArtistsRaw?.genres && Array.isArray(topArtistsRaw.genres)) {
    return topArtistsRaw.genres
      .map((g, i) => ({
        name: g.name,
        count: g.count,
        pct: g.pct || Math.round((g.count / topArtistsRaw.genres.reduce((s, x) => s + x.count, 0)) * 100),
        color: GENRE_COLORS[i % GENRE_COLORS.length],
      }))
      .slice(0, 6);
  }

  // Fallback: Last.fm groepering op topTag per artiest
  const artists = topArtistsRaw?.topartists?.artist || [];
  const genreMap = {};

  for (const a of artists) {
    const tag = a.topTag;
    if (!tag || tag.toLowerCase() === 'other') continue;
    const rawImg = a.image?.[3]?.['#text'] || a.image?.[2]?.['#text'] || '';
    const proxyUrl = rawImg ? proxyImg(rawImg, 400) : null;
    if (!genreMap[tag]) {
      genreMap[tag] = { name: tag, count: 0, artistImage: proxyUrl };
    }
    genreMap[tag].count += parseInt(a.playcount, 10) || 0;
    if (!genreMap[tag].artistImage && proxyUrl) {
      genreMap[tag].artistImage = proxyUrl;
    }
  }

  return Object.values(genreMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
}

function renderGenresForYou(genreData) {
  if (!genreData?.length) return '';

  const cardHtml = (g) => {
    const bg = g.artistImage
      ? `background: linear-gradient(rgba(30,50,140,0.7), rgba(30,50,140,0.7)), url('${esc(g.artistImage)}'); background-size: cover; background-position: center;`
      : `background: linear-gradient(135deg, rgba(30,50,140,0.9), rgba(60,20,120,0.9));`;
    return `
      <div class="genre-card" data-genre="${esc(g.name)}" style="${bg}" role="button" tabindex="0">
        <span class="genre-card-name">${esc(g.name)}</span>
      </div>`;
  };

  const row1 = genreData.slice(0, 3);
  const row2 = genreData.slice(3, 6);

  return `
    <div class="home-section-header">
      <div class="home-section-title">Genres for you</div>
    </div>
    <div class="genres-grid">
      <div class="genres-grid-row">${row1.map(cardHtml).join('')}</div>
      <div class="genres-grid-row">${row2.map(cardHtml).join('')}</div>
    </div>`;
}

// ── Section 5: New Releases (herontworpen) ────────────────────────────────

function buildReleasesHtml(releases, activeTab) {
  const allItems = releases?.releases || (Array.isArray(releases) ? releases : []);
  const albums  = allItems.filter(r => (r.type || 'album').toLowerCase() !== 'single');
  const singles = allItems.filter(r => (r.type || '').toLowerCase() === 'single');
  const items   = (activeTab === 'singles' ? singles : albums).slice(0, 3);

  if (!items.length) {
    return `<div style="padding:32px;text-align:center;color:var(--text-muted);font-size:14px">Geen releases gevonden.</div>`;
  }

  const [main, ...rest] = items;

  const mainImg = coverImg(main.image || main.thumb, 400);
  const mainImgEl = mainImg
    ? `<img src="${esc(mainImg)}" alt="${esc(main.title || main.album || '')}" loading="lazy">`
    : `<div class="releases-main-ph">♫</div>`;

  const desc = main.description || main.bio || '';

  const mainCard = `
    <div class="releases-main-card">
      ${mainImgEl}
      <div class="releases-main-info">
        <div class="releases-main-artist">${esc(main.artist || '—')}</div>
        <div class="releases-main-title">${esc(main.title || main.album || '—')}</div>
        <div class="releases-main-date">${esc(main.date || main.releaseDate || '')}</div>
        ${desc ? `<div class="releases-main-desc">${esc(desc)}</div>` : ''}
        <div class="releases-plex-badge" id="plex-badge-0" style="display:none" title="Beschikbaar in Plex">Q</div>
      </div>
    </div>`;

  const smallCards = rest.slice(0, 2).map((r, i) => {
    const img = coverImg(r.image || r.thumb, 160);
    const imgEl = img
      ? `<img src="${esc(img)}" alt="${esc(r.title || r.album || '')}" loading="lazy">`
      : `<div class="releases-small-ph">♫</div>`;
    return `
      <div class="releases-small-card">
        ${imgEl}
        <div class="releases-small-info">
          <div class="releases-small-artist">${esc(r.artist || '—')}</div>
          <div class="releases-small-title">${esc(r.title || r.album || '—')}</div>
          <div class="releases-small-date">${esc(r.date || r.releaseDate || '')}</div>
          <div class="releases-plex-badge" id="plex-badge-${i + 1}" style="display:none" title="Beschikbaar in Plex">Q</div>
        </div>
      </div>`;
  }).join('');

  return `
    <div class="releases-preview">
      ${mainCard}
      <div class="releases-stack">${smallCards}</div>
    </div>`;
}

function renderNewReleases(releases, activeTab = 'albums') {
  const header = `
    <div class="home-section-header">
      <div class="home-section-title">New releases for you</div>
      <div class="home-tabs">
        <button class="home-tab home-tab--releases ${activeTab === 'albums' ? 'active' : ''}" data-releases-tab="albums">ALBUMS</button>
        <button class="home-tab home-tab--releases ${activeTab === 'singles' ? 'active' : ''}" data-releases-tab="singles">SINGLES</button>
      </div>
      <button class="home-more-btn" data-switch="ontdek">MORE</button>
    </div>`;

  return `
    ${header}
    <div id="releases-body">
      ${buildReleasesHtml(releases, activeTab)}
    </div>`;
}

// ── Async Plex-badge controle ─────────────────────────────────────────────

async function checkPlexBadges(releases, activeTab) {
  const allItems = releases?.releases || (Array.isArray(releases) ? releases : []);
  const albums  = allItems.filter(r => (r.type || 'album').toLowerCase() !== 'single');
  const singles = allItems.filter(r => (r.type || '').toLowerCase() === 'single');
  const items   = (activeTab === 'singles' ? singles : albums).slice(0, 3);

  for (let i = 0; i < items.length; i++) {
    const r = items[i];
    const query = r.title || r.album || r.artist;
    if (!query) continue;
    const badgeEl = document.getElementById(`plex-badge-${i}`);
    if (!badgeEl) continue;
    try {
      const result = await apiFetch(`/api/plex/search?q=${encodeURIComponent(query)}`);
      const found = result?.results?.length || result?.albums?.length ||
                    result?.artists?.length || (Array.isArray(result) && result.length > 0);
      if (found) badgeEl.style.display = 'inline-flex';
    } catch { /* stil falen */ }
  }
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
    // EERST: Probeer Plex stats
    let genres = null;
    try {
      const plexData = await apiFetch(`/api/plex/stats?period=${period}`);
      if (plexData && plexData.source === 'plex' && plexData.genres && Array.isArray(plexData.genres) && plexData.genres.length > 0) {
        const total = plexData.genres.reduce((s, g) => s + g.count, 0) || 1;
        genres = plexData.genres
          .map((g, i) => ({
            name: g.name,
            count: g.count,
            pct: Math.round(g.count / total * 100),
            color: GENRE_COLORS[i % GENRE_COLORS.length],
          }))
          .slice(0, 6);
      }
    } catch {
      // Plex niet beschikbaar, ga verder naar fallback
    }

    // FALLBACK: Last.fm groepering op topTag
    if (!genres) {
      const data = await apiFetch(`/api/top/artists?period=${period}`);
      const artists = (data?.topartists?.artist || []).slice(0, 8);

      // Groepeer op topTag, tel playcounts op
      const genreMap = {};
      for (const a of artists) {
        const tag = a.topTag || 'Other';
        const playcount = parseInt(a.playcount, 10) || 0;
        genreMap[tag] = (genreMap[tag] || 0) + playcount;
      }

      const sorted = Object.entries(genreMap).sort((a, b) => b[1] - a[1]);
      const top6 = sorted.slice(0, 6);
      const rest = sorted.slice(6).reduce((s, [, v]) => s + v, 0);
      if (rest > 0) {
        const otherIdx = top6.findIndex(([n]) => n === 'Other');
        if (otherIdx >= 0) top6[otherIdx][1] += rest;
        else top6.push(['Other', rest]);
      }

      const total = top6.reduce((s, [, v]) => s + v, 0) || 1;
      genres = top6.map(([name, count], i) => ({
        name,
        count,
        pct: Math.round(count / total * 100),
        color: GENRE_COLORS[i % GENRE_COLORS.length],
      }));
    }

    // Render chart en legend
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
  // Probeer eerst Plex stats, fallback naar Last.fm
  let topArtists, topTracks;

  try {
    const plexStats = await apiFetch(`/api/plex/stats?period=${period}`);
    if (plexStats && plexStats.source === 'plex') {
      topArtists = normalizePlexArtists(plexStats.topArtists);
      topTracks = normalizePlexTracks(plexStats.topTracks);
    } else {
      // Fallback naar Last.fm
      [topArtists, topTracks] = await Promise.all([
        apiFetch(`/api/topartists?period=${period}`).catch(() => null),
        apiFetch(`/api/toptracks?period=${period}`).catch(() => null),
      ]);
    }
  } catch {
    // Last.fm fallback bij fout
    [topArtists, topTracks] = await Promise.all([
      apiFetch(`/api/topartists?period=${period}`).catch(() => null),
      apiFetch(`/api/toptracks?period=${period}`).catch(() => null),
    ]);
  }

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

  // Plex /api/plex/status geeft artists, albums, tracks terug
  // Map naar het formaat dat renderGreeting() verwacht
  let normalized = { ...data };

  // Converteer Plex API response properties naar gewenste namen
  if (data.artists !== undefined && data.artistCount === undefined) {
    normalized.artistCount = data.artists;
  }
  if (data.albums !== undefined && data.albumCount === undefined) {
    normalized.albumCount = data.albums;
  }
  if (data.tracks !== undefined && data.trackCount === undefined) {
    normalized.trackCount = data.tracks;
  }

  // Probeer directe properties
  if (normalized.artistCount !== undefined) return normalized;

  // Soms genest onder 'library' of 'stats'
  if (data.library) return normalizeLibStats(data.library);
  if (data.stats)   return data.stats;

  return normalized;
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
  // Plex stats ophalen (primaire bron)
  const [username, libRaw, plexStatsRaw, wishlistRaw, releasesRaw] = await Promise.all([
    resolveUsername().catch(() => null),
    apiFetch('/api/plex/status').catch(() => null),
    apiFetch('/api/plex/stats?period=7day').catch(() => null),
    apiFetch('/api/wishlist').catch(() => null),
    apiFetch('/api/releases').catch(() => null),
  ]);

  // Fallback naar Last.fm als Plex stats niet beschikbaar zijn
  let topArtistsRaw, topTracksRaw, recentRaw;
  if (plexStatsRaw && plexStatsRaw.source === 'plex') {
    topArtistsRaw = normalizePlexArtists(plexStatsRaw.topArtists);
    topTracksRaw = normalizePlexTracks(plexStatsRaw.topTracks);
    recentRaw = { recenttracks: { track: normalizePlexRecent(plexStatsRaw.recentTracks) } };
  } else {
    // Last.fm fallback
    [topArtistsRaw, topTracksRaw, recentRaw] = await Promise.all([
      apiFetch('/api/topartists?period=7day').catch(() => null),
      apiFetch('/api/toptracks?period=7day').catch(() => null),
      apiFetch('/api/recent?limit=200').catch(() => null),
    ]);
  }

  const libData   = normalizeLibStats(libRaw);
  const tracks    = recentRaw?.recenttracks?.track || [];
  const wishlist  = wishlistRaw?.wishlist || wishlistRaw || [];
  const releases  = releasesRaw;
  const genreData = buildGenreData(topArtistsRaw);

  // ── Render alle secties ────────────────────────────────────────────────
  content.innerHTML = `
    <div class="home-page">

      <!-- 1. Greeting + Stats -->
      ${renderGreeting(username, libData)}

      <!-- 1b. Live Radio Bar -->
      ${renderLiveRadioBar()}

      <!-- 1c. Recent Listening Activity Matrix -->
      ${renderActivityMatrix(tracks)}

      <!-- 2. Recent Activity -->
      ${renderRecentActivity(tracks)}

      <!-- 3. Listen Later -->
      <div>${renderListenLater(wishlist)}</div>

      <!-- 3b. Recent Artists -->
      <div>${renderRecentArtists(topArtistsRaw)}</div>

      <!-- 4. Daily Mixes -->
      <div>${renderDailyMixes(topArtistsRaw)}</div>

      <!-- 4b. Genres for you -->
      <div id="home-genres-section">${renderGenresForYou(genreData)}</div>

      <!-- 5. New Releases -->
      <div id="home-releases-section">${renderNewReleases(releases)}</div>

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

  // Genre kaarten → switchView('ontdek')
  content.querySelectorAll('.genre-card').forEach(card => {
    card.addEventListener('click', () => switchView('ontdek'));
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') switchView('ontdek');
    });
  });

  // New Releases tab-switching
  let _releasesTab = 'albums';
  content.querySelectorAll('[data-releases-tab]').forEach(tab => {
    tab.addEventListener('click', () => {
      _releasesTab = tab.dataset.releasesTab;
      // Update actieve tab styling
      content.querySelectorAll('[data-releases-tab]').forEach(t =>
        t.classList.toggle('active', t === tab));
      // Herrender releases body
      const body = document.getElementById('releases-body');
      if (body) {
        body.innerHTML = buildReleasesHtml(releases, _releasesTab);
        // Opnieuw Plex badges checken
        checkPlexBadges(releases, _releasesTab);
      }
    });
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
    const ARTIST_STEP = 128;
    document.getElementById('home-artists-prev')?.addEventListener('click', () => {
      artistsRow.scrollBy({ left: -ARTIST_STEP * 2, behavior: 'smooth' });
    });
    document.getElementById('home-artists-next')?.addEventListener('click', () => {
      artistsRow.scrollBy({ left: ARTIST_STEP * 2, behavior: 'smooth' });
    });
  }

  // Lazy-load "Featuring…" voor Daily Mixes
  loadDailyMixFeaturing(topArtistsRaw);

  // Plex badges asynchroon controleren voor New Releases
  checkPlexBadges(releases, _releasesTab);
}
