// ── View: Home Dashboard ──────────────────────────────────────────────────
// Startpagina met preview-widgets die elk doorlinken naar een volledige view.
// Secties: greeting + stats, recent activity, listen later,
//          daily mixes, new releases, listening stats.

import { apiFetch, plexFirstFetch } from '../api.js';
import { switchView } from '../router.js';
import { esc, proxyImg, gradientFor } from '../helpers.js';
import { state } from '../state.js';
import { skeletonHero, skeletonGrid } from '../modules/skeleton.js';

// ── Kleuren voor genre donut (blauw-paars spectrum) ───────────────────────
const GENRE_COLORS = ['#1a237e', '#283593', '#3949ab', '#5c6bc0', '#7986cb', '#9fa8da'];

// Huidige Chart.js instantie — vernietigen voor hergebruik
let _genreChartInstance = null;

// ── Shuffle helper (Fisher-Yates) ─────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Global image onerror fallback handler ─────────────────────────────────
// Gedefinieerd op window zodat onerror-attributen in HTML-strings dit kunnen aanroepen.
// Fase 1: probeer data-fb (Deezer fallback); Fase 2: toon placeholder.
if (typeof window !== 'undefined' && !window._imgFb) {
  window._imgFb = function(el, ph) {
    if (!el._d) {
      el._d = 1;
      var fb = el.getAttribute('data-fb');
      if (fb) { el.src = fb; return; }
    }
    el.style.display = 'none';
    el.insertAdjacentHTML('afterend', '<div class="home-recent-cover-ph">' + (ph || '♪') + '</div>');
  };
}

// ── Img element builder met Deezer onerror-fallback ───────────────────────
// lastfmUrl : Last.fm image URL (kan leeg zijn)
// artistName: voor Deezer-fallback via /api/imageproxy/artist/:name
// alt       : alt-tekst
// size      : gewenste breedte/hoogte in px
// placeholder: karakter voor placeholder-div als alle bronnen falen
// cssClass  : optionele CSS class op het img-element
function artistImgEl(lastfmUrl, artistName, alt, size, placeholder, cssClass) {
  size        = size        || 120;
  placeholder = placeholder || '♪';
  const proxyUrl = lastfmUrl ? proxyImg(lastfmUrl, size) : null;
  const deezerFb = artistName ? '/api/imageproxy/artist/' + encodeURIComponent(artistName) : null;
  const src = proxyUrl || deezerFb;
  if (!src) return '<div class="home-recent-cover-ph">' + placeholder + '</div>';
  const classAttr = cssClass ? ' class="' + esc(cssClass) + '"' : '';
  const altAttr   = alt ? ' alt="' + esc(alt) + '"' : '';
  const fbAttr    = (proxyUrl && deezerFb) ? ' data-fb="' + esc(deezerFb) + '"' : '';
  // onerror roept window._imgFb aan. esc() HTML-encodeert &#039; → browser decodeert naar ' bij uitvoer.
  const onerrorJs = "_imgFb(this,'" + placeholder + "')";
  return '<img src="' + esc(src) + '"' + altAttr + classAttr + fbAttr + ' loading="lazy" onerror="' + esc(onerrorJs) + '">';
}

// ── Plex Data Normalisatie ────────────────────────────────────────────────
// Converteer Plex API responses naar Last.fm formaat voor render-functies

function normalizePlexArtists(plexTopArtists) {
  if (!plexTopArtists || !Array.isArray(plexTopArtists)) {
    return { topartists: { artist: [] } };
  }

  return {
    topartists: {
      artist: plexTopArtists.map(a => {
        return {
          name: a.name,
          playcount: String(a.playcount || 0),
          image: [null, null, { '#text': a.thumb || '' }, { '#text': a.thumb || '' }],
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
        return {
          name: t.title,
          playcount: String(t.playcount || 0),
          artist: { name: t.artist, '#text': t.artist },
          album: { '#text': t.album, name: t.album },
          image: [null, null, { '#text': t.thumb || '' }],
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
    return {
      name: t.title,
      artist: { '#text': t.artist },
      album: { '#text': t.album },
      image: [null, null, { '#text': t.thumb || '' }],
      date: { uts: String(t.viewedAt) },
    };
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────

function fmt(n) {
  if (n == null || isNaN(n)) return '—';
  return Number(n).toLocaleString('nl-NL');
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

// ── Section 1: Greeting + Stats + Last.fm Status ──────────────────────────

function renderGreeting(username, libData, lastFmStatus) {
  const displayName = username || 'Muzikant';

  const artists   = libData?.artists   ?? libData?.artistCount   ?? '…';
  const albums    = libData?.albums    ?? libData?.albumCount    ?? '…';
  const tracks    = libData?.tracks    ?? libData?.trackCount    ?? '…';
  const composers = libData?.composers ?? libData?.composerCount ?? '—';

  const iconArtist = `<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>`;
  const iconAlbum  = `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="3" x2="12" y2="9"/></svg>`;
  const iconTrack  = `<svg viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`;
  const iconComp   = `<svg viewBox="0 0 24 24"><path d="M9 12h6M9 8h6M9 16h4"/><rect x="3" y="4" width="18" height="16" rx="2"/></svg>`;

  // Last.fm status indicator
  const lfmStatusDot = lastFmStatus?.ok
    ? `<span style="width: 8px; height: 8px; background: #4caf50; border-radius: 50%; display: inline-block; margin-left: 8px; title='Last.fm connected'"></span>`
    : `<span style="width: 8px; height: 8px; background: #f44336; border-radius: 50%; display: inline-block; margin-left: 8px;" title='Last.fm unavailable'></span>`;

  return `
    <div class="home-greeting">
      <div class="home-greeting-text">Hi, ${esc(displayName)}${lfmStatusDot}</div>

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

function renderActivityMatrix(recentTracks, dailyPlays) {
  // Build dayMap using dailyPlays data if available (more accurate than track counting)
  const dayMap = {};

  if (dailyPlays && Array.isArray(dailyPlays)) {
    // Primaire source: dagelijkse afspeelgegevens van backend
    for (const d of dailyPlays) {
      if (d.date != null) {
        dayMap[d.date] = d.minutes || (d.count ? d.count * 3.5 : 0);
      }
    }
  } else {
    // Fallback: groepeer tracks per dag (als geen dailyPlays beschikbaar)
    for (const t of (recentTracks || [])) {
      const uts = t.date?.uts;
      if (!uts) continue; // skip "now playing" tracks without timestamp
      const date = new Date(parseInt(uts, 10) * 1000);
      const key = date.toISOString().slice(0, 10);
      dayMap[key] = (dayMap[key] || 0) + 3.5; // ~3.5 min per track
    }
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

function recentCoversHtml(tracks, dateType = 'played') {
  if (!tracks?.length) {
    return `<div style="color:rgba(255,255,255,0.5);font-size:13px;padding:12px 0">Geen recente activiteit</div>`;
  }
  const items = tracks.slice(0, 8);
  return items.map(t => {
    // Artiest naam extraheren (ondersteunt zowel string als object)
    const artistName = typeof t.artist === 'object'
      ? (t.artist?.['#text'] || t.artist?.name || '')
      : (t.artist || '');
    const lastfmUrl = t.image?.[2]?.['#text'] || t.image?.[1]?.['#text'] || t.image?.[3]?.['#text'] || '';
    const imgEl = artistImgEl(lastfmUrl, artistName, t.name, 140, '♪');

    // Bepaal de datumslabel op basis van dateType
    let dateLabel = '';
    if (dateType === 'added' && t.addedAt) {
      dateLabel = ageLabel(t.addedAt);
    } else if (dateType === 'played' && t.date?.uts) {
      const d = new Date(parseInt(t.date.uts, 10) * 1000);
      dateLabel = ageLabel(d.toISOString());
    }

    return `
      <div class="home-recent-cover">
        ${imgEl}
        ${dateLabel ? `<div class="home-recent-cover-date">${dateLabel}</div>` : ''}
        <div class="home-recent-cover-title" title="${esc(t.name)}">${esc(t.name)}</div>
        <div class="home-recent-cover-artist" title="${esc(artistName)}">${esc(artistName)}</div>
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
          <button class="home-recent-tab" data-recent-tab="added">ADDED</button>
        </div>
        <button class="home-recent-more" id="home-recent-more">MORE</button>
      </div>
      <!-- Now Playing indicator — gevuld door plex-np-update event -->
      <div id="home-np-indicator" style="display:none" title="Ga naar Nu-view">
        <span class="home-np-dot"></span>
        <span class="home-np-label">Nu: </span>
        <span class="home-np-track"></span>
      </div>
      <div class="home-recent-row">
        <button class="home-recent-nav" id="home-recent-prev" aria-label="Vorige">&#8249;</button>
        <div class="home-recent-covers-wrap">
          <div class="home-recent-covers" id="home-recent-covers">
            ${recentCoversHtml(tracks, 'played')}
          </div>
        </div>
        <button class="home-recent-nav" id="home-recent-next" aria-label="Volgende">&#8250;</button>
      </div>
    </div>`;
}

// ── Section 2b: Loved Tracks (Last.fm) ────────────────────────────────────

function renderLovedTracks(lovedTracks) {
  // Bug 3: shuffle zodat elke pageload 8 willekeurige loved tracks toont
  const items = shuffle(lovedTracks || []).slice(0, 8);
  if (!items.length) {
    return '';
  }

  // Bug 6: correcte artiest-naam extractie (t.artist kan een object zijn)
  // Bug 3: shuffle voor slice → elke pageload andere 8 tracks
  const coversHtml = items.map(t => {
    const artistName = t.artist?.name || t.artist?.['#text'] || (typeof t.artist === 'string' ? t.artist : '');
    const lastfmUrl  = t.image?.[2]?.['#text'] || t.image?.[1]?.['#text'] || t.image?.[3]?.['#text'] || '';
    // Bug 1: gebruik artistImgEl met Deezer fallback
    const imgEl = artistImgEl(lastfmUrl, artistName, t.name, 140, '♥');

    return `
      <div class="home-recent-cover" data-track="${esc(t.name)}" data-artist="${esc(artistName)}">
        ${imgEl}
        <button class="home-loved-play-btn" title="Afspelen in Plex" aria-label="Afspelen">&#9654;</button>
        <div class="home-recent-cover-title" title="${esc(t.name)}">${esc(t.name)}</div>
        <div class="home-recent-cover-artist" title="${esc(artistName)}">${esc(artistName)}</div>
      </div>`;
  }).join('');

  return `
    <div class="home-recent-banner">
      <div class="home-recent-header">
        <div class="home-recent-title">Loved Tracks</div>
        <button class="home-recent-more" id="home-loved-more">MORE</button>
      </div>
      <div class="home-recent-row">
        <div class="home-recent-covers-wrap">
          <div class="home-recent-covers" id="home-loved-covers">
            ${coversHtml}
          </div>
        </div>
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
        <button class="home-more-btn" data-switch="albums">MORE</button>
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
      <button class="home-more-btn" data-switch="albums">MORE</button>
    </div>
    <div class="home-listen-later-grid">${itemsHtml}</div>`;
}

// ── Loved Tracks: Plex album art enrichment ──────────────────────────────
/**
 * Verrijkt de loved-tracks covers met echte album art uit Plex.
 * Wordt asynchroon aangeroepen ná de eerste render zodat de pagina
 * niet blokkeert. Vervangt zowel placeholders (♥) als Deezer-artiest-
 * afbeeldingen door de correcte albumhoes uit Plex.
 */
async function enrichLovedTracksWithPlexArt() {
  const covers = document.querySelectorAll('#home-loved-covers .home-recent-cover');
  if (!covers.length) return;

  // Verzamel unieke artiesten uit de DOM (max 8 om requests te beperken)
  const artistSet = new Set();
  covers.forEach(cover => {
    const el = cover.querySelector('.home-recent-cover-artist');
    const artist = el?.textContent?.trim();
    if (artist && artist !== '[object Object]') artistSet.add(artist);
  });
  if (!artistSet.size) return;

  // Haal Plex tracks op per artiest (parallel)
  const thumbMap = new Map();
  await Promise.allSettled([...artistSet].slice(0, 8).map(async artist => {
    try {
      const data = await apiFetch(`/api/plex/tracks?artist=${encodeURIComponent(artist)}&limit=0`);
      for (const t of (data?.tracks || [])) {
        if (t.thumb) {
          thumbMap.set(`${t.artist.toLowerCase()}||${t.title.toLowerCase()}`, t.thumb);
        }
      }
    } catch {
      // Stille fout — artiest niet in Plex
    }
  }));

  if (!thumbMap.size) return;

  // Update DOM: vervang alleen ster-placeholders (niet bestaande images)
  covers.forEach(cover => {
    const placeholder = cover.querySelector('.home-recent-cover-ph');
    if (!placeholder) return; // heeft al een image, skip

    const titleEl  = cover.querySelector('.home-recent-cover-title');
    const artistEl = cover.querySelector('.home-recent-cover-artist');
    const title    = titleEl?.textContent?.trim()?.toLowerCase();
    const artist   = artistEl?.textContent?.trim()?.toLowerCase();
    if (!title || !artist) return;

    const thumb = thumbMap.get(`${artist}||${title}`);
    if (thumb) {
      const img = document.createElement('img');
      img.src     = thumb;
      img.alt     = titleEl.textContent;
      img.loading = 'lazy';
      img.onerror = () => { /* behoud placeholder bij fout */ };
      placeholder.replaceWith(img);
    }
  });
}

// ── Section 2b: Featured Artist Banner ──────────────────────────────────

/**
 * Kies een random artiest uit de top 10 en genereer een featured artist banner
 * Slaat de keuze op in sessionStorage zodat deze niet bij elke navigatie wisselt
 */
async function renderFeaturedArtist(topArtists) {
  const artists = (topArtists?.topartists?.artist || []).slice(0, 10);
  if (!artists.length) return '';

  // Haal opgeslagen featured artiest op uit sessionStorage
  let featuredArtist = null;
  try {
    const stored = sessionStorage.getItem('featuredArtistName');
    if (stored) {
      // Check of de opgeslagen artiest nog in de top 10 zit
      featuredArtist = artists.find(a => a.name === stored);
    }
  } catch {
    // sessionStorage niet beschikbaar
  }

  // Als geen opgeslagen, of artiest niet meer in top 10, kies random
  if (!featuredArtist) {
    const randomIdx = Math.floor(Math.random() * artists.length);
    featuredArtist = artists[randomIdx];
    try {
      sessionStorage.setItem('featuredArtistName', featuredArtist.name);
    } catch {
      // sessionStorage niet beschikbaar
    }
  }

  // Fetch gerelateerde albums — Plex heeft de echte albumhoezen
  let albums = [];
  try {
    const plexData = await apiFetch(
      `/api/plex/library?q=${encodeURIComponent(featuredArtist.name)}&sort=addedAt:desc&limit=20`
    );
    const plexAlbums = (plexData?.library || [])
      .filter(item => item.artist?.toLowerCase() === featuredArtist.name.toLowerCase());
    if (plexAlbums.length > 0) {
      // Deduplicate op albumnaam
      const seen   = new Set();
      const unique = [];
      for (const a of plexAlbums) {
        if (!seen.has(a.album)) {
          seen.add(a.album);
          unique.push(a);
        }
      }
      albums = unique.slice(0, 3).map(a => ({
        name:       a.album,
        artist:     { name: a.artist },
        _plexThumb: a.thumb   // volledige Plex-URL inclusief token
      }));
    }
  } catch {
    // Stille fout — val terug op Last.fm/Deezer
  }

  // Fallback naar Last.fm/Deezer als Plex geen albums heeft
  if (!albums.length) {
    try {
      const artistData  = await apiFetch(`/api/artist/${encodeURIComponent(featuredArtist.name)}`);
      const artistAlbums = artistData?.topalbums?.album || artistData?.albums || [];
      albums = artistAlbums.slice(0, 3);
    } catch {
      // Stille fout — toon banner zonder albums
    }
  }

  // Genereer kleur op basis van artiest naam
  const bgGradient = gradientFor(featuredArtist.name);

  // HTML voor album kaartjes
  const albumsHtml = albums.map(album => {
    // Prefereer Plex thumb (echte albumhoes); fallback naar Last.fm/Deezer
    const albumArtist = album.artist?.name || album.artist || featuredArtist.name;
    let imgEl;
    if (album._plexThumb) {
      // Plex URL bevat al het token — niet via proxyImg sturen
      imgEl = `<img src="${esc(album._plexThumb)}" alt="${esc(album.name || '')}" class="featured-album-img" loading="lazy" onerror="this.style.display='none'">`;
    } else {
      const albumImg = album.image?.[2]?.['#text'] || album.image?.[1]?.['#text'] || '';
      imgEl = artistImgEl(albumImg, albumArtist, album.name, 80, '♫', 'featured-album-img');
    }

    return `
      <div class="featured-album-card">
        ${imgEl}
        <div class="featured-album-info">
          <div class="featured-album-artist">${esc(album.artist?.name || album.artist || '')}</div>
          <div class="featured-album-title">${esc(album.name || '')}</div>
        </div>
      </div>`;
  }).join('');

  return `
    <div class="home-featured-banner" style="background: ${bgGradient}">
      <div class="featured-content-left">
        <div class="featured-label">PERFORMING THE MUSIC OF</div>
        <div class="featured-name">${esc(featuredArtist.name)}</div>
        <button class="featured-play" id="featured-play-btn" data-artist="${esc(featuredArtist.name)}">
          <span class="featured-play-icon">▶</span>
          <span class="featured-play-text">PLAY TRACKS</span>
        </button>
      </div>
      <div class="featured-albums">
        ${albumsHtml}
      </div>
    </div>`;
}

// ── Section 3b: Your Recent Artists ──────────────────────────────────────

function renderRecentArtists(topArtists) {
  const artists = (topArtists?.topartists?.artist || []).slice(0, 5);
  if (!artists.length) return '';

  const artistsHtml = artists.map(a => {
    const lastfmUrl = a.image?.[3]?.['#text'] || a.image?.[2]?.['#text'] || '';
    const imgEl = artistImgEl(lastfmUrl, a.name, a.name, 200, '♪', 'home-artist-circle-img');
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
      <button class="home-more-btn" data-switch="albums">MORE</button>
    </div>
    <div class="home-recent-artists-wrap">
      <div class="home-recent-artists" id="home-recent-artists">${artistsHtml}</div>
    </div>`;
}

// ── Section 3c: Recommended Artists (Roon-stijl) ──────────────────────

/**
 * Haal aanbevolen artiesten op via discover endpoint of similar artists API
 * Toon maximaal 5 unieke aanbevelingen
 */
async function renderRecommendedArtists(topArtistsRaw) {
  try {
    const topArtists = (topArtistsRaw?.topartists?.artist || topArtistsRaw || []).slice(0, 5);
    if (!topArtists.length) return '';

    // Probeer eerst discover endpoint
    let recommendedList = [];
    try {
      const discoverData = await apiFetch('/api/discover');
      if (discoverData?.artists && Array.isArray(discoverData.artists)) {
        recommendedList = discoverData.artists.slice(0, 5);
      }
    } catch {
      // Fallback naar similar artists
    }

    // Fallback: verzamel similar artists van top 3 artiesten
    if (recommendedList.length === 0) {
      const similarPromises = topArtists.slice(0, 3).map(async (a) => {
        try {
          const data = await apiFetch(`/api/artist/${encodeURIComponent(a.name)}/similar`, {
            signal: AbortSignal.timeout(5000)
          });
          return {
            source: a.name,
            similar: (data?.similarartists?.artist || data?.similar || []).slice(0, 5)
          };
        } catch {
          return { source: a.name, similar: [] };
        }
      });

      const similarResults = await Promise.all(similarPromises);
      const seen = new Set(topArtists.map(a => a.name.toLowerCase()));

      // Verzamel unieke aanbevelingen met hun "reason" (bron-artiesten)
      for (const result of similarResults) {
        for (const similar of result.similar) {
          const name = (similar.name || similar).toLowerCase();
          if (!seen.has(name) && recommendedList.length < 5) {
            seen.add(name);
            recommendedList.push({
              name: similar.name || similar,
              image: similar.image,
              sources: [result.source], // Track bron-artiesten
            });
          }
        }
      }
    }

    if (!recommendedList.length) return '';

    // Render aanbevelingen
    const recArtistsHtml = recommendedList.map(a => {
      const artName = typeof a === 'string' ? a : a.name;
      const artImage = a.image;
      const sources = a.sources || [];

      // Foto ophalen met Deezer fallback
      const thumbUrl = typeof a !== 'string'
        ? (a.image?.[3]?.['#text'] || a.image?.[2]?.['#text'] || a.thumb || '')
        : '';
      const imgEl = artistImgEl(thumbUrl, artName, artName, 120, '♪', 'home-rec-artist-img');

      // "If you like..." tekst opbouwen
      let reasonText = '';
      if (sources.length > 0) {
        const sourceNames = sources.slice(0, 2); // Max 2 bron-artiesten
        if (sourceNames.length === 1) {
          reasonText = `If you like ${sourceNames[0]}`;
        } else {
          reasonText = `If you like ${sourceNames.join(' and ')}`;
        }
      }

      return `
        <div class="home-rec-artist" data-artist="${esc(artName)}">
          <div class="home-rec-artist-img-wrap">${imgEl}</div>
          <div class="home-rec-artist-name">${esc(artName)}</div>
          ${reasonText ? `<div class="home-rec-artist-reason">${esc(reasonText)}</div>` : ''}
        </div>`;
    }).join('');

    return `
      <div class="home-section-header">
        <div class="home-section-title" style="font-family: Georgia, serif; font-size: 20px">Recommended artists</div>
        <div class="home-rec-artists-nav">
          <button class="home-rec-artists-btn" id="home-rec-artists-prev" aria-label="Vorige">&#8249;</button>
          <button class="home-rec-artists-btn" id="home-rec-artists-next" aria-label="Volgende">&#8250;</button>
        </div>
        <button class="home-more-btn" data-switch="ontdek">MORE</button>
      </div>
      <div class="home-recommended-artists-wrap">
        <div class="home-recommended-artists" id="home-recommended-artists">
          ${recArtistsHtml}
        </div>
      </div>`;
  } catch (err) {
    console.warn('Recommended artists render mislukt:', err);
    return '';
  }
}

// ── Section 3b: Your Playlists (Roon-style carousel) ───────────────────────

async function renderPlaylistsSection() {
  try {
    const data = await apiFetch('/api/plex/playlists');
    const playlists = (data?.playlists || data || []).slice(0, 5);

    if (!playlists.length) {
      return ''; // geen playlists, skip sectie
    }

    const cardsHtml = playlists.map(p => {
      // Probeer thumb gebruiken, of composite van eerste 4 albums
      let bgImg = '';
      let bgCss = '';

      if (p.thumb) {
        bgImg = proxyImg(p.thumb, 360);
        bgCss = `background: url('${esc(bgImg)}'); background-size: cover; background-position: center;`;
      } else {
        // Fallback: gradient achtergrond
        bgCss = `background: linear-gradient(135deg, rgba(40,60,140,0.8), rgba(60,30,100,0.8));`;
      }

      return `
        <div class="home-playlist-card" data-playlist-id="${esc(p.ratingKey || p.key || p.id || '')}" data-playlist-title="${esc(p.title || '')}" data-playlist-name="${esc(p.title || '')}">
          ${bgImg ? `<img class="home-playlist-card-img" src="${esc(bgImg)}" alt="${esc(p.title || '')}" loading="lazy">` : `<div class="home-playlist-card-ph">♫</div>`}
          <div class="home-playlist-name">${esc(p.title || 'Playlist')}</div>
        </div>`;
    }).join('');

    return `
      <div class="home-playlists-section">
        <div class="home-playlists-header">
          <div class="home-playlists-title">Your Playlists</div>
          <div class="home-playlists-nav">
            <button class="home-playlist-nav-btn" id="home-playlists-prev" aria-label="Vorige">&#8249;</button>
            <button class="home-playlist-nav-btn" id="home-playlists-next" aria-label="Volgende">&#8250;</button>
          </div>
          <button class="home-more-btn" data-switch="playlists">MORE</button>
        </div>
        <div class="home-playlists" id="home-playlists">
          ${cardsHtml}
        </div>
      </div>`;
  } catch (err) {
    console.warn('Playlists render mislukt:', err);
    return '';
  }
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
      // Probeer similar artists met 5 seconden timeout
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      try {
        const data = await apiFetch(`/api/artist/${encodeURIComponent(a.name)}/similar`, {
          signal: controller.signal
        });
        clearTimeout(timeout);

        const similar = (data?.similarartists?.artist || data?.similar || []).slice(0, 3);
        if (similar.length) {
          el.textContent = `Featuring ${similar.map(s => s.name || s).join(', ')} and more`;
        } else {
          el.textContent = ''; // Verberg als geen similar artists gevonden
        }
      } catch (fetchErr) {
        clearTimeout(timeout);
        // Timeout of ander fetch-error → verberg de tekst
        el.textContent = '';
      }
    } catch {
      // Onverwachte error → verberg stil
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

  if (!items.length) return;

  // ── Batch-check: gather all items, POST to /api/plex/check-batch ──────────
  const checkItems = items.map(r => ({
    artist: r.artist || '',
    album:  r.title || r.album || ''
  }));

  try {
    const res = await fetch('/api/plex/check-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: checkItems })
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const results = data.results || {};

    // ── Update badges based on batch results ────────────────────────────────
    checkItems.forEach((item, i) => {
      const key = `${item.artist}||${item.album}`;
      const badge = document.getElementById(`plex-badge-${i}`);
      if (badge && results[key]) {
        badge.style.display = 'inline-flex';
      }
    });
  } catch (e) {
    console.warn('Plex check-batch aanroep mislukt:', e);
    // Stil falen — badges blijven verborgen
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
    const artist = t.artist?.name || t.artist?.['#text'] || (typeof t.artist === 'string' ? t.artist : '');
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
          <button class="home-more-btn" data-switch="albums">MORE</button>
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
  const STEP = 160; // 140px cover + 20px gap

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
    item.addEventListener('click', () => switchView('artist-detail', { name: item.dataset.artist }));
  });

  // Blok 1: Genres (async, update chart + legend)
  await loadAndRenderGenres(period);
}

// ── Globale periode-selector herlaad ──────────────────────────────────────

async function reloadAllWidgetsForPeriod(period) {
  // Update localStorage zodat periode persistent blijft
  localStorage.setItem('homePeriod', period);

  // Update active styling van pills
  document.querySelectorAll('.home-period-pill').forEach(pill => {
    pill.classList.toggle('active', pill.dataset.period === period);
  });

  // Herlaad Activity Matrix
  try {
    let dailyPlays = null;
    let recentTracks = [];
    // Probeer Plex
    const statsData = await apiFetch(`/api/plex/stats?period=${period}`);
    if (statsData?.dailyPlays?.some(d => d.minutes > 0 || d.count > 0)) {
      dailyPlays = statsData.dailyPlays;
      recentTracks = statsData.recentTracks || [];
    } else {
      // Probeer gecombineerd endpoint
      const activityData = await apiFetch(`/api/activity?period=${period}`);
      if (activityData?.dailyPlays?.some(d => d.minutes > 0 || d.count > 0)) {
        dailyPlays = activityData.dailyPlays;
        recentTracks = activityData.recentTracks || [];
      }
    }
    const matrixEl = document.querySelector('.activity-matrix-card');
    if (matrixEl) {
      // renderActivityMatrix verwacht Last.fm-genormaliseerde tracks als fallback
      const normalizedTracks = recentTracks.length
        ? normalizePlexRecent(recentTracks)
        : [];
      matrixEl.outerHTML = renderActivityMatrix(normalizedTracks, dailyPlays);
    }
  } catch (e) {
    console.warn('Activity matrix herlaad mislukt:', e);
  }

  // Herlaad Recent Activity (bij "today" filter op vandaag, anders standaard recent)
  if (period === 'today') {
    try {
      // Voor vandaag: filter recent tracks op vandaag
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayUts = Math.floor(today.getTime() / 1000);

      const statsData = await apiFetch(`/api/plex/stats?period=today`);
      const recentTracks = (statsData?.recentTracks || []).filter(t => {
        const trackUts = parseInt(t.date?.uts || 0, 10);
        return trackUts >= todayUts;
      });

      const coversEl = document.getElementById('home-recent-covers');
      if (coversEl) {
        coversEl.innerHTML = recentCoversHtml(recentTracks);
      }
    } catch (e) {
      console.warn('Recent activity herlaad mislukt:', e);
    }
  } else {
    // Bij andere periodes: toon standaard recent tracks
    try {
      const statsData = await apiFetch(`/api/plex/stats?period=${period}`);
      const recentTracks = statsData?.recentTracks || [];

      const coversEl = document.getElementById('home-recent-covers');
      if (coversEl) {
        coversEl.innerHTML = recentCoversHtml(recentTracks);
      }
    } catch (e) {
      console.warn('Recent activity herlaad mislukt:', e);
    }
  }

  // Herlaad Listening Stats (genres, top artists, top releases)
  await reloadStats(period);

  // Herlaad Recent Artists (top artiesten van deze periode)
  try {
    const statsData = await apiFetch(`/api/plex/stats?period=${period}`);
    const topArtistsRaw = statsData?.topArtists || [];

    const artistsWrapper = document.getElementById('home-recent-artists');
    if (artistsWrapper) {
      const artists = topArtistsRaw.slice(0, 5);
      if (artists.length) {
        const artistsHtml = artists.map(a => {
          // Plex API geeft thumb direct, Last.fm API geeft image array
          const thumbUrl = a.thumb || (a.image?.[3]?.['#text'] || a.image?.[2]?.['#text']);
          const img = coverImg(thumbUrl, 200);
          const imgEl = img
            ? `<img class="home-artist-circle-img" src="${esc(img)}" alt="${esc(a.name)}" loading="lazy">`
            : `<div class="home-artist-circle-ph">♪</div>`;
          return `
            <div class="home-artist-circle-item" data-artist="${esc(a.name)}">
              <div class="home-artist-circle">${imgEl}</div>
              <div class="home-artist-circle-name">${esc(a.name)}</div>
            </div>`;
        }).join('');

        artistsWrapper.innerHTML = artistsHtml;

        // Rebind click handlers voor artiest-cirkels
        artistsWrapper.querySelectorAll('.home-artist-circle-item').forEach(item => {
          item.addEventListener('click', () => {
            const name = item.dataset.artist;
            if (name) switchView('artist-detail', { name });
          });
        });
      }
    }
  } catch (e) {
    console.warn('Recent artists herlaad mislukt:', e);
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

  // Toon skeleton terwijl data laadt
  content.innerHTML = `
    <div class="home-page" aria-busy="true" aria-label="Laden…">
      ${skeletonHero()}
      ${skeletonGrid(6, 1)}
      ${skeletonGrid(4, 2)}
    </div>`;

  // ── Parallel data fetching ─────────────────────────────────────────────
  // Plex stats ophalen (primaire bron)
  const [username, libRaw, plexStatsRaw, wishlistRaw, releasesRaw, lastfmStatusRaw, lovedTracksRaw] = await Promise.all([
    resolveUsername().catch(() => null),
    apiFetch('/api/plex/status').catch(() => null),
    apiFetch('/api/plex/stats?period=7day').catch(() => null),
    apiFetch('/api/wishlist').catch(() => null),
    apiFetch('/api/releases').catch(() => null),
    apiFetch('/api/user').catch(() => null),  // For Last.fm status
    apiFetch('/api/loved').catch(() => null),  // For loved tracks
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

  // Determine Last.fm status (check if API returned data without _stale flag)
  const lastFmStatus = {
    ok: lastfmStatusRaw && !lastfmStatusRaw._stale,
    user: lastfmStatusRaw?.user?.name || null
  };

  const libData   = normalizeLibStats(libRaw);
  const tracks    = recentRaw?.recenttracks?.track || [];
  const wishlist  = wishlistRaw?.wishlist || wishlistRaw || [];
  const releases  = releasesRaw;
  const lovedTracks = lovedTracksRaw?.lovedtracks?.track || [];
  const genreData = buildGenreData(topArtistsRaw);

  // Featured Artist Banner rendering
  const featuredArtistHtml = await renderFeaturedArtist(topArtistsRaw).catch(() => '');

  // Recommended Artists rendering
  const recommendedArtistsHtml = await renderRecommendedArtists(topArtistsRaw).catch(() => '');

  // Playlists rendering
  const playlistsHtml = await renderPlaylistsSection().catch(() => '');

  // ── Activity Matrix: waterfall fallback ──────────────────────────────────
  let activityMatrixTracks = tracks;
  let activityMatrixDailyPlays = null;
  // Stap 1: Check Plex stats
  const plexHasData = plexStatsRaw?.source === 'plex'
    && plexStatsRaw?.dailyPlays?.some(d => d.minutes > 0 || d.count > 0);
  if (plexHasData) {
    activityMatrixDailyPlays = plexStatsRaw.dailyPlays;
  } else {
    // Stap 2: Probeer het gecombineerde /api/activity endpoint
    try {
      const activityData = await apiFetch('/api/activity?period=1month');
      if (activityData?.dailyPlays?.some(d => d.minutes > 0 || d.count > 0)) {
        activityMatrixDailyPlays = activityData.dailyPlays;
        // Gebruik ook de recentTracks als die er zijn
        if (activityData.recentTracks?.length) {
          activityMatrixTracks = normalizePlexRecent(activityData.recentTracks);
        }
      }
    } catch {
      // Stap 3: Pure Last.fm fallback
      try {
        const lastfmRecent = await apiFetch('/api/recent?limit=200');
        activityMatrixTracks = lastfmRecent?.recenttracks?.track || tracks;
      } catch {
        // Gebruik bestaande tracks als alles faalt
      }
    }
  }

  // ── Render alle secties ────────────────────────────────────────────────
  content.innerHTML = `
    <div class="home-page">

      <!-- 1. Greeting + Stats + Last.fm Status -->
      ${renderGreeting(username, libData, lastFmStatus)}

      <!-- 1b. Live Radio Bar -->
      ${renderLiveRadioBar()}

      <!-- 1c. Recent Listening Activity Matrix -->
      ${renderActivityMatrix(activityMatrixTracks, activityMatrixDailyPlays)}

      <!-- 2. Recent Activity -->
      ${renderRecentActivity(tracks)}

      <!-- 2b. Loved Tracks -->
      ${renderLovedTracks(lovedTracks)}

      <!-- 2c. Featured Artist Banner -->
      ${featuredArtistHtml}

      <!-- 3. Listen Later -->
      <div>${renderListenLater(wishlist)}</div>

      <!-- 3b. Recent Artists -->
      <div>${renderRecentArtists(topArtistsRaw)}</div>

      <!-- 3c. Recommended Artists -->
      <div>${recommendedArtistsHtml}</div>

      <!-- 3d. Your Playlists -->
      <div id="home-playlists-container">${playlistsHtml}</div>

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

  // Haal opgeslagen periode uit localStorage (default: 7day)
  const savedPeriod = localStorage.getItem('homePeriod') || '7day';

  // Stel de standaard active pill in
  content.querySelectorAll('.home-period-pill').forEach(pill => {
    pill.classList.toggle('active', pill.dataset.period === savedPeriod);
  });

  // Event listeners voor periode-pills
  content.querySelectorAll('.home-period-pill').forEach(pill => {
    pill.addEventListener('click', async () => {
      const period = pill.dataset.period;
      if (period) {
        await reloadAllWidgetsForPeriod(period);
      }
    });
  });

  // Carousel
  initRecentCarousel();

  // Loved Tracks: verrijk album art asynchroon via Plex (niet-blokkerend)
  enrichLovedTracksWithPlexArt().catch(() => {});

  // Genre donut — asynchroon laden (eigen API-calls, geen blokkering)
  loadAndRenderGenres('7day');

  // "MORE" knoppen → switchView
  content.querySelectorAll('[data-switch]').forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.switch));
  });

  // Top-artists in WYLBT → open artiest panel
  content.querySelectorAll('#home-wylbt-artists-list [data-artist]').forEach(item => {
    item.addEventListener('click', () => switchView('artist-detail', { name: item.dataset.artist }));
  });

  // Recent "MORE" knop
  document.getElementById('home-recent-more')?.addEventListener('click', () => {
    switchView('albums');
  });

  // Loved "MORE" knop
  document.getElementById('home-loved-more')?.addEventListener('click', () => {
    switchView('listen-later');
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

  // Recent tabs (PLAYED / ADDED)
  let recentTab = 'played';
  content.querySelectorAll('[data-recent-tab]').forEach(tab => {
    tab.addEventListener('click', async () => {
      content.querySelectorAll('[data-recent-tab]').forEach(t =>
        t.classList.toggle('active', t === tab));
      recentTab = tab.dataset.recentTab;

      const coversEl = document.getElementById('home-recent-covers');
      if (!coversEl) return;

      if (recentTab === 'added') {
        try {
          const data = await apiFetch('/api/plex/library?sort=addedAt:desc&limit=8');
          const addedItems = (data?.library || []).map(item => ({
            name: item.album,
            artist: { '#text': item.artist },
            image: item.thumb ? [null, null, { '#text': item.thumb }] : [null, null, { '#text': '' }],
            addedAt: new Date(item.addedAt * 1000).toISOString(),
          }));
          coversEl.innerHTML = recentCoversHtml(addedItems, 'added');
        } catch (err) {
          console.warn('Failed to load added items:', err);
          coversEl.innerHTML = `<div style="color:rgba(255,255,255,0.5);font-size:13px;padding:12px 0">Fout bij laden van recent toegevoegde albums</div>`;
        }
      } else {
        coversEl.innerHTML = recentCoversHtml(tracks, 'played');
      }
    });
  });

  // Artiest cirkels → open artist detail view
  content.querySelectorAll('.home-artist-circle-item').forEach(item => {
    item.addEventListener('click', () => {
      const name = item.dataset.artist;
      if (name) switchView('artist-detail', { name });
    });
  });

  // Featured Artist Banner Play Button
  // ── Bug 2: Featured Artist "PLAY TRACKS" — zoek artiest in Plex, shuffle albums, speel af ──
  const featuredPlayBtn = document.getElementById('featured-play-btn');
  if (featuredPlayBtn) {
    featuredPlayBtn.addEventListener('click', async () => {
      const artistName = featuredPlayBtn.dataset.artist;
      if (!artistName) return;

      featuredPlayBtn.disabled = true;
      featuredPlayBtn.textContent = '…';

      try {
        // Stap 1: zoek artiest in Plex
        const searchData = await apiFetch(`/api/plex/search?q=${encodeURIComponent(artistName)}&limit=3`);
        const plexArtist = (searchData?.artists || []).find(a =>
          a.title?.toLowerCase() === artistName.toLowerCase()
        ) || searchData?.artists?.[0];

        if (!plexArtist?.ratingKey) {
          _homeToast(`"${artistName}" niet gevonden in Plex`, '#e05a2b');
          return;
        }

        // Stap 2: haal albums op voor de artiest
        const artistDetail = await apiFetch(`/api/plex/artists/${plexArtist.ratingKey}`);
        const albums = artistDetail?.artist?.albums || [];

        if (!albums.length) {
          _homeToast('Geen albums gevonden in Plex', '#e05a2b');
          return;
        }

        // Stap 3: shuffle albums en speel eerste af
        const shuffledAlbums = shuffle(albums);
        const { playOnZone } = await import('../components/plexRemote.js');
        await playOnZone(shuffledAlbums[0].ratingKey, 'music');
      } catch (err) {
        console.error('Featured artist play mislukt:', err);
        _homeToast('Afspelen mislukt', '#e05a2b');
      } finally {
        featuredPlayBtn.disabled = false;
        featuredPlayBtn.innerHTML = '<span class="featured-play-icon">▶</span><span class="featured-play-text">PLAY TRACKS</span>';
      }
    });
  }

  // ── Bug 3: Loved Tracks play buttons ─────────────────────────────────────
  content.querySelectorAll('.home-loved-play-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const card       = btn.closest('[data-track]');
      const trackName  = card?.dataset.track  || '';
      const artistName = card?.dataset.artist || '';
      if (!trackName) return;

      btn.textContent = '…';
      try {
        const q = encodeURIComponent(`${trackName} ${artistName}`.trim());
        const searchData = await apiFetch(`/api/plex/search?q=${q}&limit=5`);
        // Zoek naar exact of beste match
        const tracks = searchData?.tracks || [];
        const match  = tracks.find(t =>
          t.title?.toLowerCase() === trackName.toLowerCase()
        ) || tracks[0];

        if (!match?.ratingKey) {
          _homeToast(`"${trackName}" niet gevonden in Plex`, '#e05a2b');
          return;
        }

        const { playOnZone } = await import('../components/plexRemote.js');
        await playOnZone(match.ratingKey, 'music');
      } catch (err) {
        console.error('Loved track play mislukt:', err);
      } finally {
        btn.textContent = '▶';
      }
    });
  });

  // ── Bug 4: Now Playing indicator in Recent Activity ───────────────────────
  const npIndicator = document.getElementById('home-np-indicator');
  if (npIndicator) {
    // Initieel ophalen
    fetch('/api/plex/nowplaying')
      .then(r => r.json())
      .then(np => _updateHomeNP(np))
      .catch(() => {});

    // Klikbaar → navigeer naar Nu-view
    npIndicator.addEventListener('click', () => switchView('nu'));
  }

  // Luister naar plex-np-update events (gegooid vanuit nu.js / main.js)
  const _npHandler = (e) => {
    if (document.getElementById('home-np-indicator')) {
      _updateHomeNP(e.detail);
    } else {
      window.removeEventListener('plex-np-update', _npHandler);
    }
  };
  window.addEventListener('plex-np-update', _npHandler);

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

  // Recommended artists nav pijlen
  const recArtistsRow = document.getElementById('home-recommended-artists');
  if (recArtistsRow) {
    const REC_ARTIST_STEP = 160; // 140px + gap
    document.getElementById('home-rec-artists-prev')?.addEventListener('click', () => {
      recArtistsRow.scrollBy({ left: -REC_ARTIST_STEP * 2, behavior: 'smooth' });
    });
    document.getElementById('home-rec-artists-next')?.addEventListener('click', () => {
      recArtistsRow.scrollBy({ left: REC_ARTIST_STEP * 2, behavior: 'smooth' });
    });
  }

  // Recommended artists click handlers
  content.querySelectorAll('.home-rec-artist').forEach(item => {
    item.addEventListener('click', () => {
      const name = item.dataset.artist;
      if (name) switchView('artist-detail', { name });
    });
  });

  // Playlists: carousel navigation
  const playlistsRow = document.getElementById('home-playlists');
  if (playlistsRow) {
    const PLAYLIST_STEP = 200; // 180px card + 20px gap
    const prevBtn = document.getElementById('home-playlists-prev');
    const nextBtn = document.getElementById('home-playlists-next');

    const updateNavButtons = () => {
      const isAtStart = playlistsRow.scrollLeft <= 0;
      const isAtEnd = playlistsRow.scrollLeft >= playlistsRow.scrollWidth - playlistsRow.clientWidth - 10;
      prevBtn?.toggleAttribute('disabled', isAtStart);
      nextBtn?.toggleAttribute('disabled', isAtEnd);
    };

    prevBtn?.addEventListener('click', () => {
      playlistsRow.scrollBy({ left: -PLAYLIST_STEP * 2, behavior: 'smooth' });
      setTimeout(updateNavButtons, 400);
    });

    nextBtn?.addEventListener('click', () => {
      playlistsRow.scrollBy({ left: PLAYLIST_STEP * 2, behavior: 'smooth' });
      setTimeout(updateNavButtons, 400);
    });

    playlistsRow.addEventListener('scroll', updateNavButtons);
    updateNavButtons(); // Initial state
  }

  // Playlists: click handlers → open playlist detail view
  // (events.js delegation handled via [data-playlist-id] — deze handler is een fallback)
  content.querySelectorAll('.home-playlist-card').forEach(card => {
    card.addEventListener('click', () => {
      const id    = card.dataset.playlistId;
      const title = card.dataset.playlistTitle || card.dataset.playlistName || 'Afspeellijst';
      if (!id) return;
      switchView('playlist-detail', { id, title });
    });
  });

  // Lazy-load "Featuring…" voor Daily Mixes
  loadDailyMixFeaturing(topArtistsRaw);

  // Plex badges asynchroon controleren voor New Releases
  checkPlexBadges(releases, _releasesTab);
}

// ── Bug 4: Now Playing indicator updater ──────────────────────────────────
function _updateHomeNP(np) {
  const indicator = document.getElementById('home-np-indicator');
  if (!indicator) return;
  if (np?.playing && np.track) {
    indicator.querySelector('.home-np-track').textContent =
      `${np.track}${np.artist ? ' — ' + np.artist : ''}`;
    indicator.style.display = 'flex';
  } else {
    indicator.style.display = 'none';
  }
}

// ── Toast helper voor Home view ───────────────────────────────────────────
function _homeToast(msg, bg) {
  bg = bg || '#333';
  const existing = document.getElementById('home-toast');
  if (existing) existing.remove();
  const el = document.createElement('div');
  el.id = 'home-toast';
  el.textContent = msg;
  el.style.cssText = `
    position:fixed;bottom:80px;left:50%;transform:translateX(-50%);
    background:${bg};color:#fff;padding:10px 18px;border-radius:6px;
    font-size:13px;z-index:9999;pointer-events:none;
    animation:fadeInUp .2s ease;
  `;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}
