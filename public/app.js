// ── State ─────────────────────────────────────────────────────────────────
let currentTab    = 'nu';
let currentMainTab = 'nu';       // 4-tab navigatie-staat
let bibSubTab     = 'collectie'; // actieve Bibliotheek sub-tab
let sectionContainerEl = null;   // section-bewust renderen
let currentPeriod = '7day';
let recsFilter    = 'all';
let discFilter    = 'all';
let gapsSort      = 'missing';
let releasesSort  = 'listening';  // STAP 2
let plexOk        = false;
let lastDiscover  = null;
let lastGaps      = null;
let plexLibData   = null;         // gecachede Plex-bibliotheek data
let wishlistMap   = new Map();   // key "type:name" → id
let searchTimeout = null;
// ── Tidarr state ──────────────────────────────────────────────────────────
let tidarrOk           = false;
let tidalView          = 'search';  // 'search' | 'queue' | 'history'
let tidalSearchResults = null;
let tidalSearchTimeout = null;
let tidarrQueuePoll    = null;
let tidarrSseSource    = null;      // SSE-verbinding voor real-time queue
let tidarrQueueItems   = [];        // live queue-items van Tidarr SSE
let downloadedSet      = new Set(); // genormaliseerde "artist|title" sleutels

// ── Spotify state ─────────────────────────────────────────────────────────
let spotifyEnabled  = false;   // wordt ingesteld door checkSpotifyStatus()
let activeMood      = null;    // momenteel geselecteerde mood

// ── Audio preview state ───────────────────────────────────────────────────
const _previewAudio = new Audio();
let   _previewBtn   = null; // de actieve play-knop

// ── Helpers ───────────────────────────────────────────────────────────────
const getImg = (imgs, size = 'medium') => {
  if (!imgs) return null;
  const i = imgs.find(x => x.size === size);
  return (i && i['#text'] && !i['#text'].includes('2a96cbd8b46e442fc41c2b86b821562f')) ? i['#text'] : null;
};
const initials = n => String(n || '?').split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);
const fmt  = n => parseInt(n).toLocaleString('nl-NL');
const esc  = s => String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
const periodLabel = p => ({ '7day':'week','1month':'maand','3month':'3 maanden','12month':'jaar','overall':'alles' }[p] || p);

function timeAgo(ts) {
  const s = Math.floor(Date.now()/1000) - ts;
  if (s < 120)   return 'zojuist';
  if (s < 3600)  return `${Math.floor(s/60)}m`;
  if (s < 86400) return `${Math.floor(s/3600)}u`;
  return `${Math.floor(s/86400)}d`;
}

function gradientFor(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++)
    h = (h * 31 + name.charCodeAt(i)) & 0xffffff;
  const hue = h % 360;
  return `linear-gradient(135deg, hsl(${hue}, 65%, 28%), hsl(${(hue + 40) % 360}, 55%, 18%))`;
}

function countryFlag(code) {
  if (!code || code.length !== 2) return '';
  return [...code.toUpperCase()].map(c => String.fromCodePoint(c.charCodeAt(0) + 127397)).join('');
}

function tagsHtml(tags, max = 4) {
  if (!tags?.length) return '';
  return `<div class="tags" style="margin-top:5px">${tags.slice(0, max).map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>`;
}

function plexBadge(inPlex) {
  if (!plexOk) return '';
  return inPlex
    ? `<span class="badge plex">▶ In Plex</span>`
    : `<span class="badge new">✦ Nieuw</span>`;
}

function bookmarkBtn(type, name, artist = '', image = '') {
  const saved = wishlistMap.has(`${type}:${name}`);
  return `<button class="bookmark-btn${saved ? ' saved' : ''}"
    data-btype="${esc(type)}" data-bname="${esc(name)}"
    data-bartist="${esc(artist)}" data-bimage="${esc(image)}"
    title="${saved ? 'Verwijder uit lijst' : 'Sla op in lijst'}">🔖</button>`;
}

// ── Download-helpers ───────────────────────────────────────────────────────
function normalizeKey(artist, title) {
  const n = s => (s || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
  return `${n(artist)}|${n(title)}`;
}
function isDownloaded(artist, title) {
  return downloadedSet.has(normalizeKey(artist, title));
}
function markDownloaded(artist, title) {
  downloadedSet.add(normalizeKey(artist, title));
}

async function loadDownloadHistory() {
  try {
    const keys = await apiFetch('/api/downloads/keys');
    downloadedSet = new Set(keys);
  } catch { downloadedSet = new Set(); }
}

// Kleine download-knop (Tidarr) — opent zoek-en-download flow vanuit Gaps/Discover/panel.
// inPlex=true → geen knop (al in je collectie).
function downloadBtn(artist, album = '', inPlex = false) {
  if (!tidarrOk || inPlex) return '';
  if (isDownloaded(artist, album)) {
    return `<button class="download-btn dl-done"
      data-dlartist="${esc(artist)}" data-dlalbum="${esc(album)}"
      title="Al gedownload">✓</button>`;
  }
  return `<button class="download-btn"
    data-dlartist="${esc(artist)}" data-dlalbum="${esc(album)}"
    title="Download via Tidarr">⬇</button>`;
}

// ── Audio preview logica ───────────────────────────────────────────────────
async function playPreview(btn, artist, track) {
  // Zelfde knop → toggle play/pauze
  if (_previewBtn === btn) {
    if (_previewAudio.paused) {
      await _previewAudio.play();
      btn.textContent = '⏸';
      btn.classList.add('playing');
    } else {
      _previewAudio.pause();
      btn.textContent = '▶';
      btn.classList.remove('playing');
    }
    return;
  }

  // Stop vorige track
  if (_previewBtn) {
    _previewAudio.pause();
    _previewBtn.textContent = '▶';
    _previewBtn.classList.remove('playing');
    const oldFill = _previewBtn.closest('.card')?.querySelector('.play-bar-fill');
    if (oldFill) oldFill.style.width = '0%';
  }

  _previewBtn = btn;
  btn.textContent = '…';
  btn.disabled = true;

  try {
    const params = new URLSearchParams({ artist, track });
    const data = await apiFetch(`/api/preview?${params}`);
    if (!data.preview) {
      btn.textContent = '—';
      btn.disabled = false;
      setTimeout(() => { if (btn.textContent === '—') btn.textContent = '▶'; }, 1800);
      _previewBtn = null;
      return;
    }
    _previewAudio.src = data.preview;
    _previewAudio.currentTime = 0;
    await _previewAudio.play();
    btn.textContent = '⏸';
    btn.disabled = false;
    btn.classList.add('playing');
  } catch {
    btn.textContent = '▶';
    btn.disabled = false;
    _previewBtn = null;
  }
}

_previewAudio.addEventListener('timeupdate', () => {
  if (!_previewBtn || !_previewAudio.duration) return;
  const fill = _previewBtn.closest('.card')?.querySelector('.play-bar-fill');
  if (fill) fill.style.width = `${(_previewAudio.currentTime / _previewAudio.duration * 100).toFixed(1)}%`;
});

_previewAudio.addEventListener('ended', () => {
  if (_previewBtn) {
    _previewBtn.textContent = '▶';
    _previewBtn.classList.remove('playing');
    const fill = _previewBtn.closest('.card')?.querySelector('.play-bar-fill');
    if (fill) fill.style.width = '0%';
    _previewBtn = null;
  }
});

// Stop audio als de tab onzichtbaar wordt
document.addEventListener('visibilitychange', () => {
  if (document.hidden && !_previewAudio.paused) {
    _previewAudio.pause();
    if (_previewBtn) {
      _previewBtn.textContent = '▶';
      _previewBtn.classList.remove('playing');
    }
  }
});

async function apiFetch(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Serverfout ${res.status}`);
  return res.json();
}

const contentEl = document.getElementById('content');
function setContent(html, callback) {
  const target = sectionContainerEl || contentEl;

  // Gebruik View Transitions API als beschikbaar
  if (!sectionContainerEl && document.startViewTransition) {
    document.startViewTransition(() => {
      target.innerHTML = html;
      // Staggered fade-in voor grid-children
      document.querySelectorAll('.card-list > *, .artist-grid > *, .rec-grid > *, .releases-grid > *, .wishlist-grid > *').forEach((el, i) => {
        el.classList.add('stagger-in');
        el.style.animationDelay = `${i * 30}ms`;
      });
      if (callback) requestAnimationFrame(callback);
    }).finished.catch(() => {});
  } else {
    target.innerHTML = html;
    if (!sectionContainerEl) {
      // Fallback voor browsers zonder View Transitions API
      contentEl.style.opacity = '0';
      contentEl.style.transform = 'translateY(6px)';
      requestAnimationFrame(() => {
        void contentEl.offsetHeight; // force reflow
        contentEl.style.opacity = '1';
        contentEl.style.transform = '';
        // STAP 6: Staggered fade-in voor grid-children
        document.querySelectorAll('.card-list > *, .artist-grid > *, .rec-grid > *, .releases-grid > *, .wishlist-grid > *').forEach((el, i) => {
          el.classList.add('stagger-in');
          el.style.animationDelay = `${i * 30}ms`;
        });
        if (callback) requestAnimationFrame(callback);
      });
    } else {
      if (callback) callback();
    }
  }
}
const showError = msg => setContent(`<div class="error-box">⚠️ ${esc(msg)}</div>`);

// STAP 5: Skeleton loaders
function showSkeleton(type) {
  let html = '';
  if (type === 'cards') {
    html = '<div class="skeleton-list">' + Array(6).fill('<div class="skeleton skeleton-card"></div>').join('') + '</div>';
  } else if (type === 'grid') {
    html = '<div class="skeleton-grid">' + Array(8).fill('<div class="skeleton skeleton-square"></div>').join('') + '</div>';
  } else if (type === 'stats') {
    html = '<div class="skeleton-stats"><div class="skeleton skeleton-stat-full"></div><div class="skeleton-two"><div class="skeleton skeleton-stat-half"></div><div class="skeleton skeleton-stat-half"></div></div></div>';
  } else {
    html = `<div class="loading"><div class="spinner"></div>${type || 'Laden...'}</div>`;
  }
  setContent(html);
}
const showLoading = msg => {
  if (sectionContainerEl) {
    sectionContainerEl.innerHTML = `<div class="loading"><div class="spinner"></div>${msg || 'Laden...'}</div>`;
    return;
  }
  // Kies automatisch de juiste skeleton op basis van huidige tab
  const skeletonMap = {
    recent: 'cards', loved: 'cards', toptracks: 'cards',
    topartists: 'grid', releases: 'grid', recs: 'grid',
    discover: 'grid', gaps: 'grid',
    stats: 'stats',
    wishlist: 'grid',
    plexlib: 'cards',
    nu: 'cards', ontdek: 'grid', bibliotheek: 'cards', downloads: 'cards'
  };
  const skType = skeletonMap[currentTab];
  if (skType && !msg) {
    showSkeleton(skType);
  } else {
    setContent(`<div class="loading"><div class="spinner"></div>${msg || 'Laden...'}</div>`);
  }
};

// Track image with proper fallback (6b)
const trackImg = imgs => {
  const src = getImg(imgs);
  if (src) return `<img class="card-img" src="${src}" alt="" loading="lazy"
    onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
    <div class="card-ph" style="display:none">♪</div>`;
  return `<div class="card-ph">♪</div>`;
};

// ── Album card ─────────────────────────────────────────────────────────────
function albumCard(album, showBadge = true, artist = '') {
  const owned = album.inPlex;
  const bg = gradientFor(album.title || '');
  const year = album.year || '—';
  const alreadyDl = isDownloaded(artist, album.title || '');
  const dlHtml = (tidarrOk && artist && !owned)
    ? alreadyDl
      ? `<button class="album-dl-btn download-btn dl-done" data-dlartist="${esc(artist)}" data-dlalbum="${esc(album.title || '')}" title="Al gedownload">✓</button>`
      : `<button class="album-dl-btn download-btn" data-dlartist="${esc(artist)}" data-dlalbum="${esc(album.title || '')}" title="Download via Tidarr">⬇</button>`
    : '';
  return `
    <div class="album-card ${owned ? 'owned' : 'missing'}" title="${esc(album.title)}${year !== '—' ? ' ('+year+')' : ''}">
      <div class="album-cover" style="background:${bg}">
        <div class="album-cover-ph">${initials(album.title || '?')}</div>
        <img src="${esc(album.coverUrl || '')}" alt="" loading="lazy"
          style="opacity:0;transition:opacity 0.35s;position:relative;z-index:1"
          onload="this.style.opacity='1'" onerror="this.remove()">
        ${dlHtml}
      </div>
      <div class="album-info">
        <div class="album-title">${esc(album.title)}</div>
        <div class="album-year">${year}</div>
        ${showBadge ? `<span class="album-status ${owned ? 'own' : 'miss'}">${owned ? '▶ In Plex' : '✦ Ontbreekt'}</span>` : ''}
      </div>
    </div>`;
}

// ── Wishlist ───────────────────────────────────────────────────────────────
async function loadWishlistState() {
  try {
    const items = await apiFetch('/api/wishlist');
    wishlistMap.clear();
    for (const item of items) wishlistMap.set(`${item.type}:${item.name}`, item.id);
    updateWishlistBadge();
  } catch {}
}

function updateWishlistBadge() {
  const badge = document.getElementById('badge-wishlist');
  if (badge) badge.textContent = wishlistMap.size || '0';
}

async function toggleWishlist(type, name, artist, image) {
  const key = `${type}:${name}`;
  if (wishlistMap.has(key)) {
    await fetch(`/api/wishlist/${wishlistMap.get(key)}`, { method: 'DELETE' });
    wishlistMap.delete(key);
    updateWishlistBadge();
    return false;
  } else {
    const res = await fetch('/api/wishlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, name, artist, image })
    });
    const data = await res.json();
    wishlistMap.set(key, data.id);
    updateWishlistBadge();
    return true;
  }
}

async function loadWishlist() {
  showLoading();
  await loadWishlistState();
  try {
    const items = await apiFetch('/api/wishlist');
    if (!items.length) {
      setContent('<div class="empty">Je lijst is leeg.<br>Voeg artiesten toe via het 🔖 icoon in Ontdek en Collectiegaten.</div>');
      return;
    }
    let html = `<div class="section-title">${items.length} opgeslagen</div><div class="wishlist-grid">`;
    for (const item of items) {
      const imgHtml = item.image
        ? `<img src="${esc(item.image)}" alt="" loading="lazy"
            onerror="this.onerror=null;this.style.display='none'">`
        : '';
      html += `
        <div class="wish-card">
          <div class="wish-photo" style="background:${gradientFor(item.name)}">
            ${imgHtml}
            <div class="wish-ph">${initials(item.name)}</div>
          </div>
          <div class="wish-body">
            <div class="wish-info">
              <div class="wish-name artist-link" data-artist="${esc(item.name)}">${esc(item.name)}</div>
              ${item.artist ? `<div class="wish-sub">${esc(item.artist)}</div>` : ''}
              <div class="wish-type">${item.type === 'artist' ? 'Artiest' : 'Album'}</div>
            </div>
            <button class="wish-remove" data-wid="${item.id}" title="Verwijder">✕</button>
          </div>
        </div>`;
    }
    setContent(html + '</div>');
  } catch (e) { showError(e.message); }
}

// ── Plex Bibliotheek ──────────────────────────────────────────────────────

/**
 * Bouwt de HTML voor de Plex-bibliotheekweergave. Groepeert albums per artiest
 * en filtert optioneel op `query`. Retourneert HTML-string (geen DOM-aanpassing).
 */
function buildPlexLibraryHtml(library, query) {
  const q = (query || '').toLowerCase().trim();
  let filtered = library;
  if (q) {
    filtered = library.filter(x =>
      x.artist.toLowerCase().includes(q) || x.album.toLowerCase().includes(q)
    );
  }
  if (!filtered.length) {
    return `<div class="empty">Geen resultaten voor "<strong>${esc(query)}</strong>".</div>`;
  }

  // Groepeer op artiest (originele volgorde is al gesorteerd op artiest)
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

/** Haalt de Plex-bibliotheek op van de server en rendert hem. */
async function loadPlexLibrary() {
  showLoading();
  try {
    const d = await apiFetch('/api/plex/library');
    plexLibData = d.library || [];
    // Reset zoekbalk
    const searchEl = document.getElementById('plib-search');
    if (searchEl) searchEl.value = '';
    if (!plexLibData.length) {
      setContent('<div class="empty">Plex bibliotheek is leeg of nog niet gesynchroniseerd.<br>Klik ↻ Sync Plex om te beginnen.</div>');
      return;
    }
    setContent(buildPlexLibraryHtml(plexLibData, ''));
  } catch (e) { showError(e.message); }
}

// ── Helper: zet artiesnaam om naar CSS-safe string ──
function sanitizeArtistName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
}

// ── Artiest panel (5b) ─────────────────────────────────────────────────────
function openArtistPanel(name) {
  const overlay  = document.getElementById('panel-overlay');
  const panelContent = document.getElementById('panel-content');
  const sanitized = sanitizeArtistName(name);

  const doOpen = () => {
    panelContent.innerHTML = `<div style="height:260px;background:var(--surface2)"></div>
      <div class="panel-body"><div class="loading" style="padding:2rem 0"><div class="spinner"></div>Laden...</div></div>`;
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  if (document.startViewTransition) {
    document.startViewTransition(doOpen).finished.catch(() => {});
  } else {
    doOpen();
  }

  Promise.allSettled([
    apiFetch(`/api/artist/${encodeURIComponent(name)}/info`),
    apiFetch(`/api/artist/${encodeURIComponent(name)}/similar`)
  ]).then(([infoR, simR]) => {
    const info    = infoR.status === 'fulfilled' ? infoR.value : {};
    const similar = simR.status === 'fulfilled' ? (simR.value.similar || []) : [];

    const photoHtml = info.image
      ? `<img src="${esc(info.image)}" alt="" style="width:100%;height:100%;object-fit:cover;display:block"
           onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
         <div class="panel-photo-ph" style="background:${gradientFor(name)};display:none">${initials(name)}</div>`
      : `<div class="panel-photo-ph" style="background:${gradientFor(name)}">${initials(name)}</div>`;

    const meta = [
      info.country ? countryFlag(info.country) + ' ' + info.country : null,
      info.startYear ? `Actief vanaf ${info.startYear}` : null,
      plexOk && info.inPlex !== undefined ? (info.inPlex ? '▶ In Plex' : '✦ Nieuw voor jou') : null
    ].filter(Boolean).join(' · ');

    let albumsHtml = '';
    if (info.albums?.length) {
      albumsHtml = `<div class="panel-section">Albums</div><div class="panel-albums">`;
      for (const a of info.albums) {
        const imgEl = a.image
          ? `<img class="panel-album-img" src="${esc(a.image)}" alt="" loading="lazy" onerror="this.onerror=null;this.remove()">`
          : `<div class="panel-album-ph">♪</div>`;
        const plexMark = plexOk && a.inPlex ? `<span class="badge plex" style="font-size:9px">▶</span>` : '';
        albumsHtml += `<div class="panel-album-row">${imgEl}
          <span class="panel-album-name">${esc(a.name)}</span>${plexMark}${downloadBtn(name, a.name, a.inPlex)}</div>`;
      }
      albumsHtml += `</div>`;
    }

    let simHtml = '';
    if (similar.length) {
      simHtml = `<div class="panel-section">Vergelijkbare artiesten</div><div class="panel-similar">`;
      for (const s of similar) {
        simHtml += `<button class="panel-similar-chip artist-link" data-artist="${esc(s.name)}">${esc(s.name)}</button>`;
      }
      simHtml += `</div>`;
    }

    panelContent.innerHTML = `
      <div class="panel-photo-wrap" style="view-transition-name: artist-${sanitized}">${photoHtml}</div>
      <div class="panel-body">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px">
          <div class="panel-artist-name">${esc(name)}</div>
          ${bookmarkBtn('artist', name, '', info.image || '')}
        </div>
        ${meta ? `<div class="panel-meta">${esc(meta)}</div>` : ''}
        ${tagsHtml(info.tags, 6)}
        ${albumsHtml}
        ${simHtml}
      </div>`;
  });
}

function closeArtistPanel() {
  document.getElementById('panel-overlay').classList.remove('open');
  document.body.style.overflow = '';
}

// ── Zoekbalk (5a) ──────────────────────────────────────────────────────────
async function doSearch(q) {
  const results = document.getElementById('search-results');
  if (q.length < 2) { results.classList.remove('open'); return; }
  try {
    const data = await apiFetch(`/api/search?q=${encodeURIComponent(q)}`);
    if (!data.results?.length) {
      results.innerHTML = `<div style="padding:12px 14px;color:var(--muted2);font-size:13px">Geen resultaten</div>`;
    } else {
      results.innerHTML = data.results.map(a => {
        const imgEl = a.image
          ? `<img class="search-result-img" src="${esc(a.image)}" alt="" loading="lazy"
               onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
             <div class="search-result-ph" style="background:${gradientFor(a.name)};display:none">${initials(a.name)}</div>`
          : `<div class="search-result-ph" style="background:${gradientFor(a.name)}">${initials(a.name)}</div>`;
        const listeners = a.listeners ? `${fmt(a.listeners)} luisteraars` : '';
        return `<button class="search-result-item" data-artist="${esc(a.name)}">
          ${imgEl}
          <div><div class="search-result-name">${esc(a.name)}</div>
          ${listeners ? `<div class="search-result-sub">${listeners}</div>` : ''}</div>
        </button>`;
      }).join('');
    }
    results.classList.add('open');
  } catch {}
}

document.getElementById('search-input').addEventListener('input', e => {
  clearTimeout(searchTimeout);
  const q = e.target.value.trim();
  if (!q) { document.getElementById('search-results').classList.remove('open'); return; }
  searchTimeout = setTimeout(() => doSearch(q), 320);
});

document.addEventListener('click', e => {
  if (!e.target.closest('#search-wrap')) {
    document.getElementById('search-results').classList.remove('open');
  }
});

// ── Plex status ────────────────────────────────────────────────────────────
async function loadPlexStatus() {
  try {
    const d = await fetch('/api/plex/status').then(r => r.json());
    const pill = document.getElementById('plex-pill');
    const text = document.getElementById('plex-pill-text');
    if (d.connected) {
      plexOk = true;
      pill.className = 'plex-pill on';
      const albumPart = d.albums ? ` · ${fmt(d.albums)} albums` : '';
      text.textContent = `Plex · ${fmt(d.artists)} artiesten${albumPart}`;
    } else {
      pill.className = 'plex-pill off';
      text.textContent = 'Plex offline';
    }
  } catch (e) { document.getElementById('plex-pill-text').textContent = 'Plex offline'; }
}

async function loadPlexNP() {
  const wrap = document.getElementById('plex-np-wrap');
  try {
    const d = await fetch('/api/plex/nowplaying').then(r => r.json());
    wrap.innerHTML = d.playing
      ? `<div class="plex-np"><div class="plex-np-dot"></div><span class="plex-np-label">PLEX NU</span>
           <div class="card-info"><div class="card-title">${esc(d.track)}</div>
           <div class="card-sub">${esc(d.artist)}${d.album ? ' · '+esc(d.album) : ''}</div></div></div>`
      : '';
  } catch (e) { wrap.innerHTML = ''; }
}

// ── Recent ─────────────────────────────────────────────────────────────────
async function loadRecent() {
  showLoading(); loadPlexNP();
  try {
    const d = await apiFetch('/api/recent');
    const tracks = d.recenttracks?.track || [];
    if (!tracks.length) { setContent('<div class="empty">Geen recente nummers.</div>'); return; }
    let html = '<div class="card-list">';
    for (const t of tracks) {
      const isNow = t['@attr']?.nowplaying;
      const when  = t.date?.uts ? timeAgo(parseInt(t.date.uts)) : '';
      const art   = t.artist?.['#text'] || '';
      const artwork = trackImg(t.image);
      if (isNow) {
        html += `<div class="now-playing">${artwork}<div class="np-dot"></div><span class="np-label">NU</span>
          <div class="card-info"><div class="card-title">${esc(t.name)}</div>
          <div class="card-sub artist-link" data-artist="${esc(art)}">${esc(art)}</div></div></div>`;
      } else {
        html += `<div class="card">${artwork}<div class="card-info">
          <div class="card-title">${esc(t.name)}</div>
          <div class="card-sub artist-link" data-artist="${esc(art)}">${esc(art)}</div>
          </div><div class="card-meta">${when}</div>
          <button class="play-btn" data-artist="${esc(art)}" data-track="${esc(t.name)}" title="Preview afspelen">▶</button>
          <div class="play-bar"><div class="play-bar-fill"></div></div></div>`;
      }
    }
    setContent(html + '</div>');
  } catch (e) { showError(e.message); }
}

// ── Top artiesten ──────────────────────────────────────────────────────────
async function loadTopArtists(period) {
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
      const photoHtml = lfmImg
        ? `<img src="${lfmImg}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
          + `<div class="ag-photo-ph" style="display:none;background:${gradientFor(a.name)}">${initials(a.name)}</div>`
        : `<div class="ag-photo-ph" style="background:${gradientFor(a.name)}">${initials(a.name)}</div>`;
      html += `<div class="ag-card"><div class="ag-photo" id="agp-${i}" style="view-transition-name: artist-${sanitizeArtistName(a.name)}">${photoHtml}</div>
        <div class="ag-info"><div class="ag-name artist-link" data-artist="${esc(a.name)}">${esc(a.name)}</div>
        <div class="card-bar"><div class="card-bar-fill" style="width:${pct}%"></div></div>
        <div class="ag-plays">${fmt(a.playcount)} plays</div></div></div>`;
    }
    setContent(html + '</div>');
    artists.forEach(async (a, i) => {
      try {
        const info = await apiFetch(`/api/artist/${encodeURIComponent(a.name)}/info`);
        if (info.image) {
          const el = document.getElementById(`agp-${i}`);
          if (el) el.innerHTML = `<img src="${info.image}" alt="" loading="lazy" onerror="this.style.display='none'">`;
        }
      } catch (e) {}
    });
  } catch (e) { showError(e.message); }
}

// ── Top nummers ────────────────────────────────────────────────────────────
async function loadTopTracks(period) {
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
        <div class="card-sub artist-link" data-artist="${esc(t.artist?.name||'')}">${esc(t.artist?.name || '')}</div>
        <div class="card-bar"><div class="card-bar-fill" style="width:${pct}%"></div></div>
        </div><div class="card-meta">${fmt(t.playcount)}×</div>
        <button class="play-btn" data-artist="${esc(t.artist?.name||'')}" data-track="${esc(t.name)}" title="Preview afspelen">▶</button>
        <div class="play-bar"><div class="play-bar-fill"></div></div></div>`;
    }
    setContent(html + '</div>');
  } catch (e) { showError(e.message); }
}

// ── Spotify mood-aanbevelingen ────────────────────────────────────────────
async function checkSpotifyStatus() {
  try {
    const data = await apiFetch('/api/spotify/status');
    spotifyEnabled = !!data.enabled;
    const tb = document.getElementById('tb-mood');
    if (spotifyEnabled && currentTab === 'recs') {
      tb.style.display = '';
      tb.classList.add('visible');
    } else if (spotifyEnabled) {
      // Klaar staan voor wanneer de recs-tab actief wordt
      tb.style.display = '';
    }
  } catch {
    spotifyEnabled = false;
  }
}

// Rendert een Spotify-track als card (met optionele play-preview)
function spotifyCard(t, idx) {
  const imgEl = t.image
    ? `<img src="${esc(t.image)}" alt="" loading="lazy"
         onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
       <div class="spotify-cover-ph" style="display:none">♪</div>`
    : `<div class="spotify-cover-ph">♪</div>`;

  const playBtn = t.preview_url
    ? `<button class="spotify-play-btn" data-spotify-preview="${esc(t.preview_url)}"
         data-artist="${esc(t.artist)}" data-track="${esc(t.name)}"
         id="spbtn-${idx}" title="Luister preview">▶</button>`
    : '';

  const spotifyLink = t.spotify_url
    ? `<a class="spotify-link-btn" href="${esc(t.spotify_url)}" target="_blank" rel="noopener">
         ♫ Open in Spotify
       </a>`
    : '';

  return `
    <div class="spotify-card">
      <div class="spotify-cover">
        ${imgEl}
        ${playBtn}
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

async function loadSpotifyRecs(mood) {
  const section = document.getElementById('spotify-recs-section');
  if (!section) return;

  const moodLabels = {
    energiek:      '⚡ Energiek',
    chill:         '🌊 Chill',
    melancholisch: '🌧 Melancholisch',
    experimenteel: '🔬 Experimenteel',
    feest:         '🎉 Feest'
  };

  section.innerHTML = `<div class="loading"><div class="spinner"></div>Spotify laden…</div>`;

  try {
    const tracks = await apiFetch(`/api/spotify/recs?mood=${encodeURIComponent(mood)}`);
    if (!tracks.length) {
      section.innerHTML = `<div class="empty">Geen Spotify-aanbevelingen gevonden voor deze mood.</div>`;
      return;
    }
    let html = `
      <div class="spotify-section-title">
        🎯 Spotify aanbevelingen · ${esc(moodLabels[mood] || mood)}
      </div>
      <div class="spotify-grid">`;
    tracks.forEach((t, i) => { html += spotifyCard(t, i); });
    html += '</div>';
    section.innerHTML = html;
  } catch {
    section.innerHTML = '';
  }
}

function clearSpotifyRecs() {
  const section = document.getElementById('spotify-recs-section');
  if (section) section.innerHTML = '';
}

// Mood-toolbar knoppen
document.addEventListener('DOMContentLoaded', () => {}, false); // no-op guard
document.querySelectorAll('.mood-btn').forEach(btn => {
  btn.addEventListener('click', async () => {
    const mood = btn.dataset.mood;

    // Deselect alle mood-knoppen
    document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('sel-mood', 'loading'));

    if (activeMood === mood) {
      // Zelfde mood → wis selectie
      activeMood = null;
      clearSpotifyRecs();
      document.getElementById('btn-clear-mood').style.display  = 'none';
      document.getElementById('mood-sep-clear').style.display  = 'none';
      return;
    }

    activeMood = mood;
    btn.classList.add('sel-mood', 'loading');
    document.getElementById('btn-clear-mood').style.display  = '';
    document.getElementById('mood-sep-clear').style.display  = '';

    await loadSpotifyRecs(mood);
    btn.classList.remove('loading');
  });
});

document.getElementById('btn-clear-mood')?.addEventListener('click', () => {
  activeMood = null;
  document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('sel-mood'));
  document.getElementById('btn-clear-mood').style.display  = 'none';
  document.getElementById('mood-sep-clear').style.display  = 'none';
  clearSpotifyRecs();
});

// Play-preview voor Spotify cards (event delegation)
document.addEventListener('click', e => {
  const spBtn = e.target.closest('.spotify-play-btn');
  if (!spBtn) return;
  e.stopPropagation();
  const previewUrl = spBtn.dataset.spotifyPreview;
  if (!previewUrl) return;

  // Stop vorige Spotify preview als dezelfde knop
  if (_previewBtn === spBtn) {
    if (_previewAudio.paused) {
      _previewAudio.play();
      spBtn.textContent = '⏸';
      spBtn.classList.add('playing');
    } else {
      _previewAudio.pause();
      spBtn.textContent = '▶';
      spBtn.classList.remove('playing');
    }
    return;
  }

  // Stop vorige
  if (_previewBtn) {
    _previewAudio.pause();
    _previewBtn.textContent = '▶';
    _previewBtn.classList.remove('playing');
    const oldFill = _previewBtn.closest('.spotify-card')?.querySelector('.play-bar-fill')
      || _previewBtn.closest('.card')?.querySelector('.play-bar-fill');
    if (oldFill) oldFill.style.width = '0%';
  }

  _previewBtn = spBtn;
  _previewAudio.src = previewUrl;
  _previewAudio.currentTime = 0;
  _previewAudio.play().then(() => {
    spBtn.textContent = '⏸';
    spBtn.classList.add('playing');
  }).catch(() => {
    spBtn.textContent = '▶';
    _previewBtn = null;
  });
}, true);

// ── Aanbevelingen ──────────────────────────────────────────────────────────
async function loadRecs() {
  showLoading();
  try {
    const d = await apiFetch('/api/recs');
    const recs      = d.recommendations || [];
    const albumRecs = d.albumRecs        || [];
    const trackRecs = d.trackRecs        || [];
    plexOk = d.plexConnected || plexOk;
    if (d.plexConnected && d.plexArtistCount) {
      document.getElementById('plex-pill').className = 'plex-pill on';
      document.getElementById('plex-pill-text').textContent = `Plex · ${fmt(d.plexArtistCount)} artiesten`;
    }
    if (!recs.length) { setContent('<div class="empty">Geen aanbevelingen gevonden.</div>'); return; }

    const newC  = recs.filter(r => !r.inPlex).length;
    const plexC = recs.filter(r =>  r.inPlex).length;

    // Update ontdek-sectie header met telling
    const titleRecs = document.getElementById('hdr-title-recs');
    if (titleRecs) titleRecs.textContent = `🎯 Aanbevelingen · ${recs.length} artiesten`;

    // ── Artiest-aanbevelingen ─────────────────────────────────────────────
    // Spotify-sectie placeholder (gevuld wanneer gebruiker een mood kiest)
    let html = `<div class="spotify-section" id="spotify-recs-section"></div>`;
    html += `<div class="section-title">Gebaseerd op jouw smaak: ${(d.basedOn||[]).slice(0,3).join(', ')}
      ${plexOk ? ` &nbsp;·&nbsp; <span style="color:var(--new)">${newC} nieuw</span> · <span style="color:var(--plex)">${plexC} in Plex</span>` : ''}
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

    // ── Aanbevolen Albums ───────────────────────────────────────────────
    if (albumRecs.length) {
      html += `<div class="section-title" style="margin-top:2rem">Aanbevolen Albums</div>
        <div class="albrec-grid">`;
      for (const a of albumRecs) {
        const imgEl = a.image
          ? `<img class="albrec-img" src="${esc(a.image)}" alt="" loading="lazy"
               onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
             <div class="albrec-ph" style="display:none;background:${gradientFor(a.album)}">${initials(a.album)}</div>`
          : `<div class="albrec-ph" style="background:${gradientFor(a.album)}">${initials(a.album)}</div>`;
        const badge = plexOk
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
              ${badge}
              ${downloadBtn(a.artist, a.album, a.inPlex)}
            </div>
          </div>`;
      }
      html += '</div>';
    }

    // ── Aanbevolen Nummers ──────────────────────────────────────────────
    if (trackRecs.length) {
      html += `<div class="section-title" style="margin-top:2rem">Aanbevolen Nummers</div>
        <div class="trackrec-list">`;
      for (const t of trackRecs) {
        const playsHtml = t.playcount > 0
          ? `<span class="trackrec-plays">${fmt(t.playcount)}×</span>`
          : '';
        const linkHtml = t.url
          ? `<a class="trackrec-link" href="${esc(t.url)}" target="_blank" rel="noopener">Last.fm ↗</a>`
          : '';
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

    setContent(html, () => {
      // Herstel Spotify-sectie als er al een mood actief is
      if (activeMood) loadSpotifyRecs(activeMood);
    });
    applyRecsFilter();

    recs.forEach(async (r, i) => {
      try {
        const info = await apiFetch(`/api/artist/${encodeURIComponent(r.name)}/info`);

        const ph = document.getElementById(`rph-${i}`);
        if (ph && info.image) ph.innerHTML = `<img src="${info.image}" alt="" loading="lazy"
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
                ? `<img class="rec-album-img" src="${a.image}" alt="" loading="lazy">`
                : `<div class="rec-album-ph">♪</div>`;
              const plexMark = plexOk && a.inPlex ? `<span class="rec-album-plex">▶</span>` : '';
              ah += `<div class="rec-album-row">${imgEl}<span class="rec-album-name">${esc(a.name)}</span>${plexMark}${downloadBtn(r.name, a.name, a.inPlex)}</div>`;
            }
            albEl.innerHTML = ah + '</div>';
          } else { albEl.innerHTML = ''; }
        }
      } catch (e) {
        const albEl = document.getElementById(`ralb-${i}`);
        if (albEl) albEl.innerHTML = '';
      }
    });
  } catch (e) { showError(e.message); }
}

function applyRecsFilter() {
  document.querySelectorAll('.rec-card[data-inplex]').forEach(card => {
    const inPlex = card.dataset.inplex === 'true';
    let show = true;
    if (recsFilter === 'new')  show = !inPlex;
    if (recsFilter === 'plex') show = inPlex;
    card.classList.toggle('hidden', !show);
  });
}

// ── Nieuwe Releases ────────────────────────────────────────────────────────
let releasesFilter  = 'all';
let lastReleases    = null;
let newReleaseIds   = new Set();  // STAP 10

async function loadReleases() {
  showLoading();
  try {
    const d = await apiFetch('/api/releases');
    if (d.status === 'building') {
      setContent(`<div class="loading"><div class="spinner"></div>
        <div>${esc(d.message)}</div>
        <div class="build-hint">Pagina ververst automatisch over 5 seconden</div></div>`);
      setTimeout(() => { if (currentTab === 'releases' || currentTab === 'ontdek') loadReleases(); }, 5_000);
      return;
    }
    lastReleases  = d.releases || [];
    // STAP 10: Sla nieuwe release-ids op en toon badge
    newReleaseIds = new Set(d.newReleaseIds || []);
    updateReleasesBadge(d.newCount || 0);
    renderReleases();
  } catch (e) { showError(e.message); }
}

// STAP 10: Badge updater
function updateReleasesBadge(count) {
  const badge = document.getElementById('badge-releases');
  if (!badge) return;
  if (count > 0) {
    badge.textContent = count;
    badge.style.display = '';
  } else {
    badge.style.display = 'none';
  }
}

// STAP 13.4: Relatieve datum helper
function relativeDate(dateStr) {
  if (!dateStr) return '';
  const rel = new Date(dateStr);
  const now = new Date();
  const diffMs = now - rel;
  const diffDays = Math.floor(diffMs / 86_400_000);
  if (diffDays === 0) return 'vandaag';
  if (diffDays === 1) return 'gisteren';
  if (diffDays < 7)  return `${diffDays} dagen geleden`;
  return rel.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' });
}

function renderReleases() {
  const releases = lastReleases || [];
  if (!releases.length) {
    setContent('<div class="empty">Geen recente releases gevonden (afgelopen 30 dagen).</div>');
    return;
  }

  // STAP 2: Type-filter
  let filtered = releases;
  if (releasesFilter !== 'all') {
    filtered = releases.filter(r => (r.type || 'album').toLowerCase() === releasesFilter);
  }
  if (!filtered.length) {
    setContent(`<div class="empty">Geen ${releasesFilter === 'ep' ? "EP's" : releasesFilter + 's'} gevonden voor dit filter.</div>`);
    return;
  }

  // STAP 2: Sorteren op basis van releasesSort
  if (releasesSort === 'listening') {
    filtered = [...filtered].sort((a, b) => {
      const playDiff = (b.artistPlaycount || 0) - (a.artistPlaycount || 0);
      if (playDiff !== 0) return playDiff;
      return new Date(b.releaseDate) - new Date(a.releaseDate);
    });
  } else {
    filtered = [...filtered].sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate));
  }

  // Update ontdek-sectie header met telling
  const titleReleases = document.getElementById('hdr-title-releases');
  if (titleReleases) titleReleases.textContent = `💿 Nieuwe Releases · ${filtered.length} release${filtered.length !== 1 ? 's' : ''}`;

  const typeLabel = t => ({ album: 'Album', single: 'Single', ep: 'EP' })[t?.toLowerCase()] || (t || 'Album');
  const typeBadgeClass = t => ({ album: 'rel-type-album', single: 'rel-type-single', ep: 'rel-type-ep' })[t?.toLowerCase()] || 'rel-type-album';

  let html = `<div class="section-title">${filtered.length} release${filtered.length !== 1 ? 's' : ''} in de afgelopen 30 dagen</div>
    <div class="releases-grid">`;

  for (const r of filtered) {
    const isNew = newReleaseIds.has(`${r.artist}::${r.album}`);  // STAP 10
    const imgEl = r.image
      ? `<img class="rel-img" src="${esc(r.image)}" alt="" loading="lazy"
           onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
         <div class="rel-ph" style="display:none;background:${gradientFor(r.album)}">${initials(r.album)}</div>`
      : `<div class="rel-ph" style="background:${gradientFor(r.album)}">${initials(r.album)}</div>`;

    // STAP 13.4: Toon relatieve datum + absolute datum
    const absDate  = r.releaseDate ? new Date(r.releaseDate).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' }) : '';
    const relDate  = relativeDate(r.releaseDate);
    const dateHtml = absDate ? `<div class="rel-date">${absDate} <span class="rel-date-rel">(${relDate})</span></div>` : '';

    const plexStatus = plexOk
      ? (r.inPlex
        ? `<span class="badge plex" style="font-size:9px">▶ In Plex</span>`
        : (r.artistInPlex
          ? `<span class="badge new" style="font-size:9px">✦ Artiest in Plex</span>`
          : ''))
      : '';

    const deezerLink = r.deezerUrl
      ? `<a class="rel-deezer-link" href="${esc(r.deezerUrl)}" target="_blank" rel="noopener">Deezer ↗</a>`
      : '';

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
}

// ── Discover (deep: MBZ + album grid) ─────────────────────────────────────
async function loadDiscover() {
  showLoading('Ontdekkingen ophalen...');
  try {
    const d = await apiFetch('/api/discover');
    if (d.status === 'building') {
      setContent(`<div class="loading"><div class="spinner"></div>
        <div>${esc(d.message)}</div>
        <div class="build-hint">Pagina ververst automatisch over 20 seconden</div></div>`);
      setTimeout(() => { if (currentTab === 'discover' || currentTab === 'ontdek') loadDiscover(); }, 20_000);
      return;
    }
    lastDiscover = d;
    if (d.plexConnected) { plexOk = true; }
    renderDiscover();
  } catch (e) { showError(e.message); }
}

function renderDiscover() {
  if (!lastDiscover) return;
  const { artists, basedOn } = lastDiscover;
  if (!artists?.length) { setContent('<div class="empty">Geen ontdekkingen gevonden.</div>'); return; }

  let filtered = artists;
  if (discFilter === 'new')     filtered = artists.filter(a => !a.inPlex);
  if (discFilter === 'partial') filtered = artists.filter(a => a.inPlex && a.missingCount > 0);

  if (!filtered.length) { setContent('<div class="empty">Geen artiesten voor dit filter.</div>'); return; }

  // Update ontdek-sectie header met telling
  const titleDiscover = document.getElementById('hdr-title-discover');
  if (titleDiscover) titleDiscover.textContent = `🔭 Ontdek Artiesten · ${filtered.length} artiesten`;

  const totalMissing = filtered.reduce((s, a) => s + a.missingCount, 0);
  let html = `<div class="section-title">Gebaseerd op: ${(basedOn||[]).slice(0,3).join(', ')}
    &nbsp;·&nbsp; <span style="color:var(--new)">${totalMissing} albums te ontdekken</span></div>
    <div class="discover-grid">`;

  for (let i = 0; i < filtered.length; i++) {
    const a = filtered[i];
    const matchPct = Math.round(a.match * 100);
    const meta = [
      countryFlag(a.country),
      a.country,
      a.startYear ? `Actief vanaf ${a.startYear}` : null,
      a.totalAlbums ? `${a.totalAlbums} studio-albums` : null
    ].filter(Boolean).join(' · ');

    const photo = a.image
      ? `<img class="discover-photo" src="${esc(a.image)}" alt="" loading="lazy"
           onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
         <div class="discover-photo-ph" style="display:none;background:${gradientFor(a.name)}">${initials(a.name)}</div>`
      : `<div class="discover-photo-ph" style="background:${gradientFor(a.name)}">${initials(a.name)}</div>`;

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
              ? `<img class="discover-preview-thumb" src="${esc(alb.coverUrl)}" alt="${esc(alb.title)}" loading="lazy" title="${esc(alb.title)}${alb.year ? ' ('+alb.year+')' : ''}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><div class="discover-preview-ph" style="display:none;background:${bg}">${initials(alb.title || '?')}</div>`
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
}

// ── Collection Gaps ────────────────────────────────────────────────────────
async function loadGaps() {
  showLoading('Collectiegaten zoeken...');
  try {
    const d = await apiFetch('/api/gaps');
    if (d.status === 'building') {
      setContent(`<div class="loading"><div class="spinner"></div>
        <div>${esc(d.message)}</div>
        <div class="build-hint">Pagina ververst automatisch over 20 seconden</div></div>`);
      setTimeout(() => { if (currentTab === 'gaps') loadGaps(); }, 20_000);
      return;
    }
    lastGaps = d;
    renderGaps();
  } catch (e) { showError(e.message); }
}

function renderGaps() {
  if (!lastGaps) return;
  let artists = [...(lastGaps.artists || [])];
  if (!artists.length) {
    setContent('<div class="empty">Geen collectiegaten gevonden — je hebt alles al! 🎉</div>');
    document.getElementById('badge-gaps').textContent = '0';
    return;
  }

  if (gapsSort === 'missing') artists.sort((a, b) => b.missingAlbums.length - a.missingAlbums.length);
  if (gapsSort === 'name')    artists.sort((a, b) => a.name.localeCompare(b.name));

  const totalMissing = artists.reduce((s, a) => s + a.missingAlbums.length, 0);
  document.getElementById('badge-gaps').textContent = totalMissing;

  let html = `<div class="section-title">${totalMissing} ontbrekende albums bij ${artists.length} artiesten die je al hebt</div>`;

  for (const a of artists) {
    const pct = Math.round(a.ownedCount / a.totalCount * 100);
    const meta = [countryFlag(a.country), a.country, a.startYear].filter(Boolean).join(' · ');
    const photo = a.image
      ? `<img class="gaps-photo" src="${esc(a.image)}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
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

// ── Geliefd ────────────────────────────────────────────────────────────────
async function loadLoved() {
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

// ── Statistieken (5c) ──────────────────────────────────────────────────────
async function loadStats() {
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

function renderStatsCharts(d) {
  if (typeof Chart === 'undefined') return;

  const isDark = !window.matchMedia('(prefers-color-scheme: light)').matches;
  const gridColor   = isDark ? '#2c2c2c' : '#ddd';
  const tickColor   = isDark ? '#888' : '#777';
  const labelColor  = isDark ? '#efefef' : '#111';

  Chart.defaults.color = tickColor;
  Chart.defaults.borderColor = gridColor;

  // Daily scrobbles bar chart
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

  // Top artists horizontal bar
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

  // Genre donut
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

// ── Tidarr / Tidal ────────────────────────────────────────────────────────
async function loadTidarrStatus() {
  try {
    const d = await apiFetch('/api/tidarr/status');
    const pill = document.getElementById('tidarr-status-pill');
    const text = document.getElementById('tidarr-status-text');
    tidarrOk = !!d.connected;
    if (pill && text) {
      pill.className = `tidarr-status-pill ${tidarrOk ? 'on' : 'off'}`;
      text.textContent = tidarrOk
        ? `Tidarr · verbonden${d.quality ? ' · ' + d.quality : ''}`
        : 'Tidarr offline';
    }
  } catch {
    tidarrOk = false;
    const text = document.getElementById('tidarr-status-text');
    if (text) text.textContent = 'Tidarr offline';
  }
}

async function refreshTidarrQueueBadge() {
  try {
    const d = await apiFetch('/api/tidarr/queue');
    const count = (d.items || []).length;
    const badges = [document.getElementById('badge-tidarr-queue'), document.getElementById('badge-tidarr-queue-inline')];
    for (const b of badges) {
      if (!b) continue;
      if (count > 0) { b.textContent = count; b.style.display = ''; }
      else           { b.style.display = 'none'; }
    }
  } catch {}
}

function tidalResultCard(item) {
  const imgEl = item.image
    ? `<img class="tidal-img" src="${esc(item.image)}" alt="" loading="lazy"
         onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
       <div class="tidal-ph" style="display:none;background:${gradientFor(item.title)}">${initials(item.title)}</div>`
    : `<div class="tidal-ph" style="background:${gradientFor(item.title)}">${initials(item.title)}</div>`;
  const meta = [
    item.type === 'album' ? 'Album' : 'Nummer',
    item.year,
    item.album && item.type === 'track' ? item.album : null,
    item.tracks ? `${item.tracks} nummers` : null
  ].filter(Boolean).join(' · ');
  return `
    <div class="tidal-card">
      <div class="tidal-cover">${imgEl}</div>
      <div class="tidal-info">
        <div class="tidal-title">${esc(item.title)}</div>
        <div class="tidal-artist artist-link" data-artist="${esc(item.artist)}">${esc(item.artist)}</div>
        <div class="tidal-meta">${esc(meta)}</div>
      </div>
      <button class="tidal-dl-btn" data-dlurl="${esc(item.url)}" title="Download via Tidarr">⬇ Download</button>
    </div>`;
}

async function renderTidalSearch(query) {
  const target = document.getElementById('tidal-content');
  if (!target) return;
  const q = (query || '').trim();
  if (q.length < 2) {
    target.innerHTML = `<div class="empty">Begin met typen om te zoeken op Tidal.</div>`;
    return;
  }
  target.innerHTML = `<div class="loading"><div class="spinner"></div>Zoeken op Tidal…</div>`;
  try {
    const d = await apiFetch(`/api/tidarr/search?q=${encodeURIComponent(q)}`);
    tidalSearchResults = d.results || [];
    if (d.error) {
      target.innerHTML = `<div class="error-box">⚠️ ${esc(d.error)}</div>`;
      return;
    }
    if (!tidalSearchResults.length) {
      target.innerHTML = `<div class="empty">Geen resultaten op Tidal voor "<strong>${esc(q)}</strong>".</div>`;
      return;
    }
    const albums = tidalSearchResults.filter(r => r.type === 'album');
    const tracks = tidalSearchResults.filter(r => r.type === 'track');
    let html = '';
    if (albums.length) {
      html += `<div class="section-title">Albums (${albums.length})</div>
        <div class="tidal-grid">${albums.map(tidalResultCard).join('')}</div>`;
    }
    if (tracks.length) {
      html += `<div class="section-title" style="margin-top:1.5rem">Nummers (${tracks.length})</div>
        <div class="tidal-grid">${tracks.map(tidalResultCard).join('')}</div>`;
    }
    target.innerHTML = html;
  } catch (e) {
    target.innerHTML = `<div class="error-box">⚠️ ${esc(e.message)}</div>`;
  }
}

function queueItemRow(item, isHistory = false) {
  const statusClass = {
    queued:      'q-pending',
    pending:     'q-pending',
    downloading: 'q-active',
    processing:  'q-active',
    completed:   'q-done',
    done:        'q-done',
    error:       'q-error',
    failed:      'q-error'
  }[String(item.status || '').toLowerCase()] || 'q-pending';
  const pct = typeof item.progress === 'number' ? Math.round(item.progress) : null;
  const progHtml = pct !== null
    ? `<div class="q-bar"><div class="q-bar-fill" style="width:${pct}%"></div></div>
       <div class="q-pct">${pct}%</div>`
    : '';
  const actionHtml = isHistory
    ? ''
    : `<button class="q-remove" data-qid="${esc(item.id)}" title="Verwijder uit queue">✕</button>`;
  return `
    <div class="q-row">
      <div class="q-info">
        <div class="q-title">${esc(item.title || '(onbekend)')}</div>
        ${item.artist ? `<div class="q-artist artist-link" data-artist="${esc(item.artist)}">${esc(item.artist)}</div>` : ''}
        <span class="q-status ${statusClass}">${esc(item.status || 'queued')}</span>
      </div>
      ${progHtml}
      ${actionHtml}
    </div>`;
}

function renderTidalQueue() {
  const target = document.getElementById('tidal-content');
  if (!target) return;
  const items = tidarrQueueItems;
  if (!items.length) {
    target.innerHTML = `<div class="empty">De download-queue is leeg.</div>`;
    return;
  }
  const statusLabel = {
    queue_download:   'In wachtrij',
    queue_processing: 'Verwerken (wacht)',
    download:         'Downloaden…',
    processing:       'Verwerken…',
    finished:         'Klaar',
    error:            'Fout'
  };
  const statusClass = {
    queue_download:   'q-pending',
    queue_processing: 'q-pending',
    download:         'q-active',
    processing:       'q-active',
    finished:         'q-done',
    error:            'q-error'
  };
  target.innerHTML = `
    <div class="section-title">${items.length} item${items.length !== 1 ? 's' : ''} in queue</div>
    <div class="q-list">${items.map(it => {
      const sc  = statusClass[it.status]  || 'q-pending';
      const lbl = statusLabel[it.status]  || it.status || 'In wachtrij';
      const pct = it.progress?.current && it.progress?.total
        ? Math.round(it.progress.current / it.progress.total * 100) : null;
      const progHtml = pct !== null
        ? `<div class="q-bar"><div class="q-bar-fill" style="width:${pct}%"></div></div><div class="q-pct">${pct}%</div>`
        : '';
      const isDone = it.status === 'finished' || it.status === 'error';
      const removeBtn = `<button class="q-remove" data-qid="${esc(it.id)}" title="Verwijder">✕</button>`;
      return `<div class="q-row">
        <div class="q-info">
          <div class="q-title">${esc(it.title || '(onbekend)')}</div>
          ${it.artist ? `<div class="q-artist">${esc(it.artist)}</div>` : ''}
          <span class="q-status ${sc}">${esc(lbl)}</span>
        </div>
        ${progHtml}
        ${removeBtn}
      </div>`;
    }).join('')}</div>`;
}

async function renderTidalHistory() {
  const target = document.getElementById('tidal-content');
  if (!target) return;
  target.innerHTML = `<div class="loading"><div class="spinner"></div>Geschiedenis ophalen…</div>`;
  try {
    const items = await apiFetch('/api/downloads');
    if (!items.length) {
      target.innerHTML = `<div class="empty">Nog geen downloads opgeslagen.</div>`;
      return;
    }
    const qualityLabel = { max: '24-bit', high: 'Lossless', normal: 'AAC', low: '96kbps' };
    target.innerHTML = `
      <div class="section-title">${items.length} gedownloade albums
        <button class="tool-btn" id="dl-history-clear" style="margin-left:auto;font-size:11px">🗑 Wis alles</button>
      </div>
      <div class="q-list">${items.map(it => {
        const date = it.queued_at ? new Date(it.queued_at).toLocaleDateString('nl-NL', { day:'numeric', month:'short', year:'numeric' }) : '';
        const ql   = qualityLabel[it.quality] || it.quality || '';
        return `<div class="q-row">
          <div class="q-info">
            <div class="q-title">${esc(it.title)}</div>
            ${it.artist ? `<div class="q-artist artist-link" data-artist="${esc(it.artist)}">${esc(it.artist)}</div>` : ''}
            <span class="q-status q-done">✓ gedownload${ql ? ' · ' + ql : ''}${date ? ' · ' + date : ''}</span>
          </div>
          <button class="q-remove" data-dlid="${it.id}" title="Verwijder uit geschiedenis">✕</button>
        </div>`;
      }).join('')}</div>`;

    document.getElementById('dl-history-clear')?.addEventListener('click', async () => {
      if (!confirm('Wis de volledige download-geschiedenis?')) return;
      await fetch('/api/downloads', { method: 'DELETE' }).catch(() => {});
      // Verwijder elk item apart (geen bulk-endpoint, dus per item)
      for (const it of items) {
        await fetch(`/api/downloads/${it.id}`, { method: 'DELETE' }).catch(() => {});
      }
      downloadedSet.clear();
      renderTidalHistory();
    });
  } catch (e) {
    target.innerHTML = `<div class="error-box">⚠️ ${esc(e.message)}</div>`;
  }
}

function setTidalView(view) {
  tidalView = view;
  document.querySelectorAll('[data-tidal-view]').forEach(b => {
    b.classList.toggle('sel-def', b.dataset.tidalView === view);
  });
  if (view === 'search') renderTidalSearch(document.getElementById('tidal-search')?.value || '');
  else if (view === 'queue')   renderTidalQueue();
  else if (view === 'history') renderTidalHistory();
}

// ── Tidarr SSE: real-time queue updates ───────────────────────────────────
function startTidarrSSE() {
  if (tidarrSseSource) return;
  const es = new EventSource('/api/tidarr/stream');
  tidarrSseSource = es;

  es.onmessage = (e) => {
    try {
      tidarrQueueItems = JSON.parse(e.data) || [];
    } catch { tidarrQueueItems = []; }

    // Badge bijwerken (tab + inline + FAB)
    const active = tidarrQueueItems.filter(i => i.status !== 'finished' && i.status !== 'error');
    const badges = [document.getElementById('badge-tidarr-queue'), document.getElementById('badge-tidarr-queue-inline')];
    for (const b of badges) {
      if (!b) continue;
      if (active.length > 0) { b.textContent = active.length; b.style.display = ''; }
      else                    { b.style.display = 'none'; }
    }
    updateQueueFab(tidarrQueueItems);
    // Queue-tab live bijwerken als die open is
    if (currentTab === 'tidal' && tidalView === 'queue') renderTidalQueue();
    // Queue popover live bijwerken als die open is
    if (document.getElementById('queue-popover')?.classList.contains('open')) renderQueuePopover();
  };

  es.onerror = () => {
    es.close();
    tidarrSseSource = null;
    // Herverbind na 10 seconden
    setTimeout(startTidarrSSE, 10_000);
  };
}
function stopTidarrSSE() {
  if (tidarrSseSource) { tidarrSseSource.close(); tidarrSseSource = null; }
}

// Legacy polling (fallback badge refresh voor als SSE niet werkt)
function startTidarrQueuePolling() { startTidarrSSE(); }
function stopTidarrQueuePolling()  { /* SSE blijft actief */ }

async function loadTidal() {
  setContent(`<div id="tidal-content"><div class="empty">Begin met typen om te zoeken op Tidal.</div></div>`);
  await loadTidarrStatus();
  await refreshTidarrQueueBadge();
  setTidalView(tidalView);
  startTidarrQueuePolling();
}

// ── Artiest-normalisatie voor vergelijking ─────────────────────────────────
function normalizeArtist(s) {
  return (s || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}
function artistMatches(found, wanted) {
  const f = normalizeArtist(found);
  const w = normalizeArtist(wanted);
  if (!f || !w) return true; // onbekend → geen mismatch
  return f === w || f.includes(w) || w.includes(f);
}

// ── Bevestigingsdialog voor download ─────────────────────────────────────
let _dlResolve = null; // callback van openDownloadConfirm

function openDownloadConfirm(candidates, wantedArtist, wantedAlbum, btn) {
  return new Promise(resolve => {
    _dlResolve = resolve;

    const modal   = document.getElementById('dl-confirm-modal');
    const content = document.getElementById('dl-confirm-cards');

    document.getElementById('dl-confirm-wanted').textContent =
      `"${wantedAlbum}"${wantedArtist ? ' – ' + wantedArtist : ''}`;

    content.innerHTML = candidates.map((c, i) => {
      const mismatch = !artistMatches(c.artist, wantedArtist);
      const imgEl = c.image
        ? `<img class="dlc-img" src="${esc(c.image)}" alt="" loading="lazy"
             onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
           <div class="dlc-ph" style="display:none">${initials(c.title)}</div>`
        : `<div class="dlc-ph">${initials(c.title)}</div>`;
      const artistHtml = mismatch
        ? `<div class="dlc-artist dlc-artist-warn">⚠ ${esc(c.artist)}</div>`
        : `<div class="dlc-artist">${esc(c.artist)}</div>`;
      const scorePct = c.score ?? 0;
      return `
        <button class="dlc-card${i === 0 ? ' dlc-best' : ''}" data-dlc-idx="${i}">
          <div class="dlc-cover">${imgEl}</div>
          <div class="dlc-info">
            <div class="dlc-title">${esc(c.title)}</div>
            ${artistHtml}
            <div class="dlc-meta">${c.year ? esc(c.year) : ''}${c.year && c.tracks ? ' · ' : ''}${c.tracks ? c.tracks + ' nrs' : ''}</div>
            <div class="dlc-score-bar"><div class="dlc-score-fill" style="width:${scorePct}%"></div></div>
            <div class="dlc-score-label">${scorePct}% overeenkomst</div>
          </div>
          ${i === 0 ? '<span class="dlc-badge-best">Beste match</span>' : ''}
        </button>`;
    }).join('');

    // Klik op kandidaat → bevestig met die optie
    content.querySelectorAll('.dlc-card').forEach(card => {
      card.addEventListener('click', () => {
        const idx = parseInt(card.dataset.dlcIdx);
        closeDownloadConfirm();
        resolve({ chosen: candidates[idx], btn });
      });
    });

    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  });
}

function closeDownloadConfirm() {
  document.getElementById('dl-confirm-modal')?.classList.remove('open');
  document.body.style.overflow = '';
  if (_dlResolve) { _dlResolve({ chosen: null }); _dlResolve = null; }
}

document.getElementById('dl-confirm-cancel')?.addEventListener('click', () => {
  closeDownloadConfirm();
});
document.getElementById('dl-confirm-modal')?.addEventListener('click', e => {
  if (e.target === document.getElementById('dl-confirm-modal')) closeDownloadConfirm();
});

// ── Download uitvoeren met een gekozen kandidaat ───────────────────────────
async function executeDownload(chosen, wantedArtist, wantedAlbum, btn) {
  const res = await fetch('/api/tidarr/download', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      url:     chosen.url,
      type:    chosen.type   || 'album',
      title:   chosen.title  || wantedAlbum  || '',
      artist:  chosen.artist || wantedArtist || '',
      id:      String(chosen.id || ''),
      quality: getDownloadQuality()
    })
  });
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data.error || 'download mislukt');
  markDownloaded(chosen.artist || wantedArtist || '', chosen.title || wantedAlbum || '');
  if (btn) { btn.textContent = '✓'; btn.classList.add('dl-done'); btn.disabled = false; }
  await refreshTidarrQueueBadge();
}

// Download-knop klik: haalt top-3 kandidaten op, toont confirm-dialog als artiest afwijkt.
async function triggerTidarrDownload(artist, album, btn) {
  if (!tidarrOk) {
    alert('Tidarr is niet verbonden. Controleer TIDARR_URL en TIDARR_API_KEY.');
    return;
  }
  if (btn) { btn.disabled = true; btn.textContent = '…'; }
  try {
    const params = new URLSearchParams();
    if (artist) params.set('artist', artist);
    if (album)  params.set('album',  album);

    // Haal top-3 kandidaten op voor mogelijke confirm-dialog
    const candRes = await fetch(`/api/tidarr/candidates?${params}`);

    if (!candRes.ok) {
      if (candRes.status === 401) {
        alert('Niet ingelogd bij TIDAL.\nGa naar de 🎛️ Tidarr-tab en koppel je TIDAL-account eerst.');
      } else {
        alert(`Niet gevonden op TIDAL: "${album}"${artist ? ' van ' + artist : ''}\n\nProbeer het handmatig via de 🌊 Tidal-tab.`);
      }
      if (btn) { btn.disabled = false; btn.textContent = '⬇'; }
      return;
    }

    const { candidates } = await candRes.json();
    if (!candidates?.length) {
      alert(`Niet gevonden op TIDAL: "${album}"${artist ? ' van ' + artist : ''}`);
      if (btn) { btn.disabled = false; btn.textContent = '⬇'; }
      return;
    }

    const best = candidates[0];

    // Toon confirm-dialog als de beste match een andere artiest heeft
    if (artist && !artistMatches(best.artist, artist)) {
      if (btn) { btn.disabled = false; btn.textContent = '⬇'; }
      const { chosen } = await openDownloadConfirm(candidates, artist, album, btn);
      if (!chosen) return; // gebruiker heeft geannuleerd
      if (btn) { btn.disabled = true; btn.textContent = '…'; }
      await executeDownload(chosen, artist, album, btn);
    } else {
      // Artiest klopt → direct downloaden
      await executeDownload(best, artist, album, btn);
    }
  } catch (e) {
    alert('Downloaden mislukt: ' + e.message);
    if (btn) { btn.disabled = false; btn.textContent = '⬇'; }
  }
}

// ── Queue FAB (floating queue knop) ───────────────────────────────────────
function updateQueueFab(items) {
  const fab   = document.getElementById('queue-fab');
  const badge = document.getElementById('fab-queue-badge');
  if (!fab) return;
  const active = (items || []).filter(i => i.status !== 'finished' && i.status !== 'error');
  if (items && items.length > 0) {
    fab.style.display = '';
    if (active.length > 0) { badge.textContent = active.length; badge.style.display = ''; }
    else                    { badge.style.display = 'none'; }
  } else {
    fab.style.display = 'none';
    document.getElementById('queue-popover')?.classList.remove('open');
  }
}

function renderQueuePopover() {
  const list = document.getElementById('queue-popover-list');
  if (!list) return;
  const items = tidarrQueueItems;
  if (!items.length) {
    list.innerHTML = `<div class="qpop-empty">Queue is leeg</div>`;
    return;
  }
  const statusLabel = {
    queue_download:   'In wachtrij',
    queue_processing: 'Verwerken',
    download:         'Downloaden…',
    processing:       'Verwerken…',
    finished:         'Klaar ✓',
    error:            'Fout'
  };
  const statusClass = {
    queue_download:   'q-pending',
    queue_processing: 'q-pending',
    download:         'q-active',
    processing:       'q-active',
    finished:         'q-done',
    error:            'q-error'
  };
  list.innerHTML = items.map(it => {
    const sc  = statusClass[it.status]  || 'q-pending';
    const lbl = statusLabel[it.status]  || it.status || 'In wachtrij';
    const pct = it.progress?.current && it.progress?.total
      ? Math.round(it.progress.current / it.progress.total * 100) : null;
    const progHtml = pct !== null
      ? `<div class="q-bar" style="margin-top:4px"><div class="q-bar-fill" style="width:${pct}%"></div></div>`
      : '';
    return `<div class="qpop-row">
      <div class="qpop-title">${esc(it.title || '(onbekend)')}</div>
      ${it.artist ? `<div class="qpop-artist">${esc(it.artist)}</div>` : ''}
      <span class="q-status ${sc}">${esc(lbl)}</span>
      ${progHtml}
    </div>`;
  }).join('');
}

function toggleQueuePopover() {
  const pop = document.getElementById('queue-popover');
  if (!pop) return;
  const isOpen = pop.classList.toggle('open');
  if (isOpen) renderQueuePopover();
}

function closeQueuePopover() {
  document.getElementById('queue-popover')?.classList.remove('open');
}

document.getElementById('queue-fab')?.addEventListener('click', toggleQueuePopover);
document.getElementById('qpop-close')?.addEventListener('click', e => { e.stopPropagation(); closeQueuePopover(); });
document.getElementById('qpop-goto-tidal')?.addEventListener('click', () => {
  closeQueuePopover();
  document.querySelector('.tab[data-tab="downloads"]')?.click();
  setTimeout(() => setTidalView('queue'), 150);
});
// Klik buiten popover → sluiten
document.addEventListener('click', e => {
  const pop = document.getElementById('queue-popover');
  const fab = document.getElementById('queue-fab');
  if (pop?.classList.contains('open') && !pop.contains(e.target) && !fab?.contains(e.target)) {
    closeQueuePopover();
  }
}, true);

// ── Navigatie ──────────────────────────────────────────────────────────────

// ── Lazy-load helper via IntersectionObserver ──────────────────────────────
function setupLazyLoad(el, callback) {
  if (!el) return;
  if (!('IntersectionObserver' in window)) { callback(); return; }
  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { obs.unobserve(entry.target); callback(); }
    });
  }, { rootMargin: '300px' });
  obs.observe(el);
}

// ── Mutex voor sectionContainerEl ──────────────────────────────────────────
// Voorkomt race conditions wanneer meerdere async functies tegelijk
// sectionContainerEl willen gebruiken (bijv. lazy-load callbacks in Ontdek).
let _sectionMutex = Promise.resolve();
function runWithSection(el, fn) {
  const result = _sectionMutex.then(async () => {
    sectionContainerEl = el;
    try {
      await fn();
    } finally {
      sectionContainerEl = null;
    }
  });
  // Zorg dat een fout de keten niet breekt voor volgende aanroepen
  _sectionMutex = result.catch(() => {});
  return result;
}

// ── Composiet loader: Nu ────────────────────────────────────────────────────
function loadNu() {
  currentTab = 'recent';
  hideTidarrUI();
  stopTidarrQueuePolling();
  loadRecent();
}

// ── Collapsible sections state management ────────────────────────────────────
const collapsibleSections = {
  recs: false,      // false = expanded, true = collapsed
  releases: false,
  discover: false
};

function loadCollapsibleState() {
  try {
    const saved = localStorage.getItem('ontdek-sections');
    if (saved) {
      const state = JSON.parse(saved);
      Object.assign(collapsibleSections, state);
    }
  } catch (e) {
    // fallback to defaults if localStorage fails
  }
}

function saveCollapsibleState() {
  try {
    localStorage.setItem('ontdek-sections', JSON.stringify(collapsibleSections));
  } catch (e) {
    // ignore if localStorage is full
  }
}

function setupSectionToggle(sectionId, sectionKey) {
  const block = document.querySelector(`[data-section="${sectionId}"]`);
  if (!block) return;

  const btn = block.querySelector('.section-toggle-btn');
  if (!btn) return;

  // Update button state based on collapsibleSections
  updateToggleButtonState(btn, collapsibleSections[sectionKey]);

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    collapsibleSections[sectionKey] = !collapsibleSections[sectionKey];
    saveCollapsibleState();
    updateToggleButtonState(btn, collapsibleSections[sectionKey]);
    block.classList.toggle('collapsed');
  });

  // Apply initial collapsed state
  if (collapsibleSections[sectionKey]) {
    block.classList.add('collapsed');
  }
}

function updateToggleButtonState(btn, isCollapsed) {
  btn.classList.remove('expanded', 'collapsed');
  btn.classList.add(isCollapsed ? 'collapsed' : 'expanded');
}

// ── Composiet loader: Ontdek ────────────────────────────────────────────────
async function loadOntdek() {
  loadCollapsibleState();
  currentTab = 'ontdek';
  hideTidarrUI();
  stopTidarrQueuePolling();

  const moodHtml = spotifyEnabled ? `
    <div class="section-block sec-mood-block">
      <div class="inline-toolbar">
        <span class="toolbar-label spotify-label">🎯 Spotify mood</span>
        <span class="toolbar-sep"></span>
        <button class="tool-btn${activeMood==='energiek'?' sel-mood':''}" data-mood="energiek">⚡ Energiek</button>
        <button class="tool-btn${activeMood==='chill'?' sel-mood':''}" data-mood="chill">🌊 Chill</button>
        <button class="tool-btn${activeMood==='melancholisch'?' sel-mood':''}" data-mood="melancholisch">🌧 Melancholisch</button>
        <button class="tool-btn${activeMood==='experimenteel'?' sel-mood':''}" data-mood="experimenteel">🔬 Experimenteel</button>
        <button class="tool-btn${activeMood==='feest'?' sel-mood':''}" data-mood="feest">🎉 Feest</button>
        ${activeMood ? `<span class="toolbar-sep"></span><button class="tool-btn" id="btn-clear-mood-inline">✕ Wis mood</button>` : ''}
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
            <button class="tool-btn${recsFilter==='all'?' sel-def':''}" data-filter="all">Alle</button>
            <button class="tool-btn${recsFilter==='new'?' sel-new':''}" data-filter="new">✦ Nieuw voor mij</button>
            <button class="tool-btn${recsFilter==='plex'?' sel-plex':''}" data-filter="plex">▶ Al in Plex</button>
          </div>
        </div>
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
            <button class="tool-btn${releasesFilter==='all'?' sel-def':''}" data-rtype="all">Alle</button>
            <button class="tool-btn${releasesFilter==='album'?' sel-def':''}" data-rtype="album">Albums</button>
            <button class="tool-btn${releasesFilter==='single'?' sel-def':''}" data-rtype="single">Singles</button>
            <button class="tool-btn${releasesFilter==='ep'?' sel-def':''}" data-rtype="ep">EP's</button>
            <span class="toolbar-sep"></span>
            <button class="tool-btn${releasesSort==='listening'?' sel-def':''}" data-rsort="listening">Op luistergedrag</button>
            <button class="tool-btn${releasesSort==='date'?' sel-def':''}" data-rsort="date">Op datum</button>
            <span class="toolbar-sep"></span>
            <button class="tool-btn refresh-btn" id="btn-ref-releases-ontdek">↻</button>
          </div>
        </div>
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
            <button class="tool-btn${discFilter==='all'?' sel-def':''}" data-dfilter="all">Alle artiesten</button>
            <button class="tool-btn${discFilter==='new'?' sel-new':''}" data-dfilter="new">✦ Nieuw voor mij</button>
            <button class="tool-btn${discFilter==='partial'?' sel-miss':''}" data-dfilter="partial">▶ Gedeeltelijk in Plex</button>
            <span class="toolbar-sep"></span>
            <button class="tool-btn refresh-btn" id="btn-ref-discover-ontdek">↻</button>
          </div>
        </div>
        <div class="section-content" id="sec-discover-content">
          <div class="loading"><div class="spinner"></div>Laden...</div>
        </div>
      </div>
    </div>`;

  contentEl.style.opacity = '1';
  contentEl.style.transform = '';

  // Inline refresh-knoppen
  document.getElementById('btn-ref-releases-ontdek')?.addEventListener('click', async () => {
    lastReleases = null;
    await fetch('/api/releases/refresh', { method: 'POST' });
    await runWithSection(document.getElementById('sec-releases-content'), loadReleases);
  });
  document.getElementById('btn-ref-discover-ontdek')?.addEventListener('click', async () => {
    lastDiscover = null;
    await fetch('/api/discover/refresh', { method: 'POST' });
    await runWithSection(document.getElementById('sec-discover-content'), loadDiscover);
  });
  document.getElementById('btn-clear-mood-inline')?.addEventListener('click', () => {
    activeMood = null;
    document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('sel-mood', 'loading'));
    clearSpotifyRecs();
    loadOntdek(); // herbouw zonder clear-knop
  });

  // 1. Laad recs onmiddellijk
  sectionContainerEl = document.getElementById('sec-recs-content');
  await loadRecs();
  sectionContainerEl = null;

  // 2. Lazy-load releases en discover — via mutex om race condition op
  //    sectionContainerEl te voorkomen wanneer beide callbacks tegelijk vuren.
  setupLazyLoad(document.getElementById('sec-releases-content'), () =>
    runWithSection(document.getElementById('sec-releases-content'), loadReleases));
  setupLazyLoad(document.getElementById('sec-discover-content'), () =>
    runWithSection(document.getElementById('sec-discover-content'), loadDiscover));

  // 3. Setup collapsible sections
  setupSectionToggle('recs', 'recs');
  setupSectionToggle('releases', 'releases');
  setupSectionToggle('discover', 'discover');
}

// ── Composiet loader: Bibliotheek sub-tab wisselen ──────────────────────────
async function switchBibSubTab(subTab) {
  bibSubTab = subTab;
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
        if (!plexLibData) return;
        bibContent.innerHTML = buildPlexLibraryHtml(plexLibData, e.target.value);
      });
      document.getElementById('btn-sync-plex-bib')?.addEventListener('click', async () => {
        const btn = document.getElementById('btn-sync-plex-bib');
        const orig = btn.textContent;
        btn.disabled = true; btn.textContent = '↻ Bezig…';
        try {
          await fetch('/api/plex/refresh', { method: 'POST' });
          await loadPlexStatus();
          plexLibData = null;
          sectionContainerEl = bibContent;
          await loadPlexLibrary();
          sectionContainerEl = null;
        } catch (e) {}
        finally { btn.disabled = false; btn.textContent = orig; }
      });
    } else if (subTab === 'gaten') {
      bibToolbar.innerHTML = `
        <div class="inline-toolbar" style="margin-bottom:12px">
          <button class="tool-btn${gapsSort==='missing'?' sel-def':''}" data-gsort="missing">Meest ontbrekend</button>
          <button class="tool-btn${gapsSort==='name'?' sel-def':''}" data-gsort="name">A–Z</button>
          <span class="toolbar-sep"></span>
          <button class="tool-btn refresh-btn" id="btn-ref-gaps-bib">↻ Vernieuwen</button>
        </div>`;
      document.getElementById('btn-ref-gaps-bib')?.addEventListener('click', async () => {
        lastGaps = null;
        await fetch('/api/gaps/refresh', { method: 'POST' });
        sectionContainerEl = document.getElementById('bib-sub-content');
        await loadGaps();
        sectionContainerEl = null;
      });
    } else {
      bibToolbar.innerHTML = '';
    }
  }

  sectionContainerEl = bibContent;
  try {
    if (subTab === 'collectie') {
      currentTab = 'plexlib';
      await loadPlexLibrary();
    } else if (subTab === 'gaten') {
      currentTab = 'gaps';
      await loadGaps();
    } else if (subTab === 'lijst') {
      currentTab = 'wishlist';
      await loadWishlist();
    }
  } finally {
    sectionContainerEl = null;
  }
}

// ── Composiet loader: Bibliotheek ───────────────────────────────────────────
async function loadBibliotheek() {
  currentTab = 'plexlib';
  hideTidarrUI();
  stopTidarrQueuePolling();

  contentEl.innerHTML = `
    <div class="bib-layout">
      <div class="bib-strips-wrap">
        <div class="scroll-strip">
          <div class="strip-label">Top artiesten <span class="strip-period">(${periodLabel(currentPeriod)})</span></div>
          <div class="strip-body" id="strip-artists-body">
            <div class="loading"><div class="spinner"></div></div>
          </div>
        </div>
        <div class="scroll-strip" style="margin-top:16px">
          <div class="strip-label">Top nummers <span class="strip-period">(${periodLabel(currentPeriod)})</span></div>
          <div class="strip-body" id="strip-tracks-body">
            <div class="loading"><div class="spinner"></div></div>
          </div>
        </div>
      </div>

      <div class="bib-subtabs" id="bib-subtabs">
        <button class="bib-tab${bibSubTab==='collectie'?' active':''}" data-bibtab="collectie">Collectie</button>
        <button class="bib-tab${bibSubTab==='gaten'?' active':''}" data-bibtab="gaten">Gaten <span class="bib-tab-badge" id="badge-gaps-bib"></span></button>
        <button class="bib-tab${bibSubTab==='lijst'?' active':''}" data-bibtab="lijst">Lijst</button>
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

  contentEl.style.opacity = '1';
  contentEl.style.transform = '';

  // Badges synchroniseren
  const gapsBibBadge = document.getElementById('badge-gaps-bib');
  const mainGapsBadge = document.getElementById('badge-gaps');
  if (gapsBibBadge && mainGapsBadge) gapsBibBadge.textContent = mainGapsBadge.textContent;

  // Sub-tab klik-handlers
  document.querySelectorAll('.bib-tab').forEach(btn => {
    btn.addEventListener('click', () => switchBibSubTab(btn.dataset.bibtab));
  });

  // Strips laden (sequentieel om sectionContainerEl-conflict te vermijden)
  sectionContainerEl = document.getElementById('strip-artists-body');
  await loadTopArtists(currentPeriod);
  sectionContainerEl = null;

  sectionContainerEl = document.getElementById('strip-tracks-body');
  await loadTopTracks(currentPeriod);
  sectionContainerEl = null;

  // Initieel sub-tab laden
  await switchBibSubTab(bibSubTab);

  // Stats lazy-loaden — via mutex om conflict met strip-loads te voorkomen
  setupLazyLoad(document.getElementById('bib-stats-content'), () =>
    runWithSection(document.getElementById('bib-stats-content'), loadStats));
}

// ── Composiet loader: Downloads ─────────────────────────────────────────────
function loadDownloads() {
  currentTab = 'tidal';
  hideTidarrUI();
  document.getElementById('tb-tidal')?.classList.add('visible');
  loadTidal();
}

const tabLoaders = {
  // ── Nieuwe 4-tab navigatie ────────────────────────────────────────────────
  nu:          () => loadNu(),
  ontdek:      () => loadOntdek(),
  bibliotheek: () => loadBibliotheek(),
  downloads:   () => loadDownloads(),
  // ── Backward-compat (voor 'r' shortcut en sub-tab loaders) ───────────────
  discover:    () => loadDiscover(),
  gaps:        () => loadGaps(),
  recent:      () => loadRecent(),
  recs:        () => loadRecs(),
  releases:    () => loadReleases(),
  topartists:  () => loadTopArtists(currentPeriod),
  toptracks:   () => loadTopTracks(currentPeriod),
  loved:       () => loadLoved(),
  stats:       () => loadStats(),
  wishlist:    () => loadWishlist(),
  plexlib:     () => loadPlexLibrary(),
  tidal:       () => loadTidal(),
  'tidarr-ui': () => loadTidarrUI()
};

// ── Tidarr UI (iframe) ─────────────────────────────────────────────────────
function loadTidarrUI() {
  const iframe  = document.getElementById('tidarr-iframe');
  const wrap    = document.getElementById('tidarr-ui-wrap');
  const content = document.getElementById('content');
  wrap.style.display    = 'flex';
  content.style.display = 'none';
  // Laad de iframe de eerste keer dat de tab wordt geopend
  if (!iframe.dataset.loaded) {
    iframe.src          = iframe.dataset.src;
    iframe.dataset.loaded = '1';
  }
}

function hideTidarrUI() {
  document.getElementById('tidarr-ui-wrap').style.display = 'none';
  document.getElementById('content').style.display        = '';
}

document.getElementById('btn-tidarr-reload')?.addEventListener('click', () => {
  const iframe = document.getElementById('tidarr-iframe');
  iframe.src = iframe.dataset.src;
});

document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    currentMainTab = tab;

    // Alle externe toolbars verbergen; composiet-tabs beheren hun eigen inline toolbars
    ['tb-period','tb-recs','tb-mood','tb-releases','tb-discover',
     'tb-gaps','tb-plexlib','tb-tidarr-ui'].forEach(id =>
      document.getElementById(id)?.classList.remove('visible'));

    // Tidal-toolbar alleen tonen voor Downloads-tab
    document.getElementById('tb-tidal')?.classList.toggle('visible', tab === 'downloads');

    // Tidarr UI verbergen tenzij in Downloads-context
    if (tab !== 'downloads') hideTidarrUI();
    if (tab !== 'downloads') stopTidarrQueuePolling();

    // Gebruik View Transitions API als beschikbaar
    if (document.startViewTransition) {
      document.startViewTransition(() => {
        tabLoaders[tab]?.();
      }).finished.catch(() => {});
    } else {
      tabLoaders[tab]?.();
    }
  });
});

document.querySelectorAll('[data-period]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-period]').forEach(b => b.classList.remove('sel-def'));
    btn.classList.add('sel-def');
    currentPeriod = btn.dataset.period;
    tabLoaders[currentTab]?.();
  });
});

document.querySelectorAll('[data-filter]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('sel-def','sel-new','sel-plex'));
    recsFilter = btn.dataset.filter;
    btn.classList.add(recsFilter === 'all' ? 'sel-def' : recsFilter === 'new' ? 'sel-new' : 'sel-plex');
    applyRecsFilter();
  });
});

document.querySelectorAll('[data-dfilter]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-dfilter]').forEach(b => b.classList.remove('sel-def','sel-new','sel-miss'));
    discFilter = btn.dataset.dfilter;
    btn.classList.add(discFilter === 'all' ? 'sel-def' : discFilter === 'new' ? 'sel-new' : 'sel-miss');
    renderDiscover();
  });
});

document.querySelectorAll('[data-gsort]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-gsort]').forEach(b => b.classList.remove('sel-def'));
    btn.classList.add('sel-def');
    gapsSort = btn.dataset.gsort;
    renderGaps();
  });
});

document.querySelectorAll('[data-rtype]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-rtype]').forEach(b => b.classList.remove('sel-def'));
    btn.classList.add('sel-def');
    releasesFilter = btn.dataset.rtype;
    renderReleases();
  });
});

// STAP 2: Sorteer-knoppen voor releases
document.querySelectorAll('[data-rsort]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-rsort]').forEach(b => b.classList.remove('sel-def'));
    btn.classList.add('sel-def');
    releasesSort = btn.dataset.rsort;
    renderReleases();
  });
});

document.getElementById('btn-refresh-releases').addEventListener('click', async () => {
  lastReleases = null;
  await fetch('/api/releases/refresh', { method: 'POST' });
  loadReleases();
});

document.getElementById('btn-refresh-discover').addEventListener('click', async () => {
  lastDiscover = null;
  await fetch('/api/discover/refresh', { method: 'POST' });
  loadDiscover();
});

document.getElementById('btn-refresh-gaps').addEventListener('click', async () => {
  lastGaps = null;
  await fetch('/api/gaps/refresh', { method: 'POST' });
  loadGaps();
});

// ── Plex bibliotheek: live zoeken ─────────────────────────────────────────
document.getElementById('plib-search').addEventListener('input', e => {
  if (!plexLibData || currentTab !== 'plexlib') return;
  contentEl.innerHTML = buildPlexLibraryHtml(plexLibData, e.target.value);
});

// ── Plex sync knop in toolbar ─────────────────────────────────────────────
document.getElementById('btn-sync-plex').addEventListener('click', async () => {
  const btn = document.getElementById('btn-sync-plex');
  const orig = btn.textContent;
  btn.disabled = true;
  btn.textContent = '↻ Bezig…';
  try {
    await fetch('/api/plex/refresh', { method: 'POST' });
    await loadPlexStatus();
    plexLibData = null;
    if (currentTab === 'plexlib') await loadPlexLibrary();
  } catch (e) { /* stil falen */ }
  finally {
    btn.disabled = false;
    btn.textContent = orig;
  }
});

// ── Plex refresh-knop in de pill ──────────────────────────────────────────
document.getElementById('plex-refresh-btn').addEventListener('click', async () => {
  const btn = document.getElementById('plex-refresh-btn');
  btn.classList.add('spinning');
  btn.disabled = true;
  try {
    await fetch('/api/plex/refresh', { method: 'POST' });
    await loadPlexStatus();
    plexLibData = null; // forceer verse load volgende keer de tab wordt geopend
  } catch (e) { /* stil falen */ }
  finally {
    btn.classList.remove('spinning');
    btn.disabled = false;
  }
});

// ── Globale event delegation ───────────────────────────────────────────────
document.addEventListener('click', async e => {
  // Play-knop → audio preview
  const playBtn = e.target.closest('.play-btn');
  if (playBtn) {
    e.stopPropagation();
    playPreview(playBtn, playBtn.dataset.artist, playBtn.dataset.track);
    return;
  }

  // Discover album-sectie toggle (knop of kaart-klik, maar NIET op artiest-link/bookmark)
  const discToggleBtn = e.target.closest('.disc-toggle-btn');
  if (discToggleBtn) {
    e.stopPropagation();
    const sectionId = discToggleBtn.dataset.discId;
    const section = document.getElementById(sectionId);
    if (section) {
      const isCollapsed = section.classList.toggle('collapsed');
      // Sync alle toggle-knoppen en pas tekst aan
      section.querySelectorAll('.disc-toggle-btn').forEach(b => {
        b.classList.toggle('expanded', !isCollapsed);
        b.classList.toggle('collapsed', isCollapsed);
        const n = parseInt(b.dataset.albumCount, 10) || 0;
        const lbl = `${n} album${n !== 1 ? 's' : ''}`;
        b.textContent = isCollapsed ? `Toon ${lbl}` : lbl;
      });
    }
    return;
  }

  // Klik op discover-kaart zelf (niet op artiest-link, bookmark of toggle)
  const discCard = e.target.closest('.discover-card-toggle');
  if (discCard && !e.target.closest('.artist-link') && !e.target.closest('.bookmark-btn') && !e.target.closest('.disc-toggle-btn')) {
    const sectionId = discCard.dataset.discId;
    const section = document.getElementById(sectionId);
    if (section) {
      const isCollapsed = section.classList.toggle('collapsed');
      section.querySelectorAll('.disc-toggle-btn').forEach(b => {
        b.classList.toggle('expanded', !isCollapsed);
        b.classList.toggle('collapsed', isCollapsed);
        const n = parseInt(b.dataset.albumCount, 10) || 0;
        const lbl = `${n} album${n !== 1 ? 's' : ''}`;
        b.textContent = isCollapsed ? `Toon ${lbl}` : lbl;
      });
    }
    return;
  }

  // Artiest-link → open panel
  const link = e.target.closest('[data-artist]');
  if (link?.dataset.artist && !link.classList.contains('bookmark-btn')) {
    // Skip search result items (handled separately)
    if (link.classList.contains('search-result-item')) {
      document.getElementById('search-results').classList.remove('open');
      document.getElementById('search-input').value = '';
    }
    openArtistPanel(link.dataset.artist);
    return;
  }

  // Bookmark toggle
  const bBtn = e.target.closest('.bookmark-btn');
  if (bBtn) {
    e.stopPropagation();
    const { btype, bname, bartist, bimage } = bBtn.dataset;
    const added = await toggleWishlist(btype, bname, bartist, bimage);
    bBtn.classList.toggle('saved', added);
    bBtn.title = added ? 'Verwijder uit lijst' : 'Sla op in lijst';
    // Sync bookmark buttons elsewhere that have same key
    document.querySelectorAll(`.bookmark-btn[data-bname="${CSS.escape(bname)}"][data-btype="${btype}"]`).forEach(b => {
      b.classList.toggle('saved', added);
    });
    return;
  }

  // Verlanglijst verwijderen
  const wRemove = e.target.closest('.wish-remove[data-wid]');
  if (wRemove) {
    await fetch(`/api/wishlist/${wRemove.dataset.wid}`, { method: 'DELETE' });
    wishlistMap.forEach((v, k) => { if (String(v) === wRemove.dataset.wid) wishlistMap.delete(k); });
    updateWishlistBadge();
    loadWishlist();
    return;
  }

  // Soortgelijke artiest chip → nieuwe panel
  const chip = e.target.closest('.panel-similar-chip[data-artist]');
  if (chip) {
    openArtistPanel(chip.dataset.artist);
    return;
  }

  // Tidarr: download-knop (vanuit Gaps, Discover, Tidal tab)
  const dlBtn = e.target.closest('.download-btn, .tidal-dl-btn');
  if (dlBtn) {
    e.stopPropagation();
    if (dlBtn.classList.contains('tidal-dl-btn')) {
      const url = dlBtn.dataset.dlurl;
      if (!url) return;
      dlBtn.disabled = true;
      const orig = dlBtn.textContent;
      dlBtn.textContent = '…';
      try {
        const res  = await fetch('/api/tidarr/download', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ url })
        });
        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.error || 'download mislukt');
        dlBtn.textContent = '✓ Toegevoegd';
        dlBtn.classList.add('downloaded');
        refreshTidarrQueueBadge();
      } catch (err) {
        alert('Downloaden mislukt: ' + err.message);
        dlBtn.textContent = orig;
        dlBtn.disabled = false;
      }
      return;
    }
    const { dlartist, dlalbum } = dlBtn.dataset;
    await triggerTidarrDownload(dlartist, dlalbum, dlBtn);
    return;
  }

  // Tidarr: item uit queue verwijderen
  const qRemove = e.target.closest('.q-remove[data-qid]');
  if (qRemove) {
    e.stopPropagation();
    const id = qRemove.dataset.qid;
    try {
      await fetch('/api/tidarr/queue/' + encodeURIComponent(id), { method: 'DELETE' });
    } catch (err) { alert('Verwijderen mislukt: ' + err.message); }
    return;
  }

  // Downloads: item uit geschiedenis verwijderen
  const dlRemove = e.target.closest('.q-remove[data-dlid]');
  if (dlRemove) {
    e.stopPropagation();
    const id = dlRemove.dataset.dlid;
    try {
      await fetch(`/api/downloads/${id}`, { method: 'DELETE' });
      dlRemove.closest('.q-row')?.remove();
    } catch (err) { alert('Verwijderen mislukt: ' + err.message); }
    return;
  }

  // ── Inline toolbar: recs-filter ───────────────────────────────────────────
  const inlineFilter = e.target.closest('.inline-toolbar [data-filter]');
  if (inlineFilter) {
    document.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('sel-def','sel-new','sel-plex'));
    recsFilter = inlineFilter.dataset.filter;
    inlineFilter.classList.add(recsFilter==='all'?'sel-def':recsFilter==='new'?'sel-new':'sel-plex');
    applyRecsFilter();
    return;
  }

  // ── Inline toolbar: releases type-filter ──────────────────────────────────
  const inlineRtype = e.target.closest('.inline-toolbar [data-rtype]');
  if (inlineRtype) {
    document.querySelectorAll('[data-rtype]').forEach(b => b.classList.remove('sel-def'));
    releasesFilter = inlineRtype.dataset.rtype;
    inlineRtype.classList.add('sel-def');
    const secRel = document.getElementById('sec-releases-content');
    if (secRel && currentMainTab === 'ontdek') {
      sectionContainerEl = secRel; renderReleases(); sectionContainerEl = null;
    } else { renderReleases(); }
    return;
  }

  // ── Inline toolbar: releases sortering ────────────────────────────────────
  const inlineRsort = e.target.closest('.inline-toolbar [data-rsort]');
  if (inlineRsort) {
    document.querySelectorAll('[data-rsort]').forEach(b => b.classList.remove('sel-def'));
    releasesSort = inlineRsort.dataset.rsort;
    inlineRsort.classList.add('sel-def');
    const secRel = document.getElementById('sec-releases-content');
    if (secRel && currentMainTab === 'ontdek') {
      sectionContainerEl = secRel; renderReleases(); sectionContainerEl = null;
    } else { renderReleases(); }
    return;
  }

  // ── Inline toolbar: discover-filter ───────────────────────────────────────
  const inlineDfilter = e.target.closest('.inline-toolbar [data-dfilter]');
  if (inlineDfilter) {
    document.querySelectorAll('[data-dfilter]').forEach(b => b.classList.remove('sel-def','sel-new','sel-miss'));
    discFilter = inlineDfilter.dataset.dfilter;
    inlineDfilter.classList.add(discFilter==='all'?'sel-def':discFilter==='new'?'sel-new':'sel-miss');
    const secDisc = document.getElementById('sec-discover-content');
    if (secDisc && currentMainTab === 'ontdek') {
      sectionContainerEl = secDisc; renderDiscover(); sectionContainerEl = null;
    } else { renderDiscover(); }
    return;
  }

  // ── Inline toolbar: gaps-sortering (Bibliotheek) ───────────────────────────
  const inlineGsort = e.target.closest('.inline-toolbar [data-gsort]');
  if (inlineGsort) {
    document.querySelectorAll('[data-gsort]').forEach(b => b.classList.remove('sel-def'));
    gapsSort = inlineGsort.dataset.gsort;
    inlineGsort.classList.add('sel-def');
    const secGaps = document.getElementById('bib-sub-content');
    if (secGaps && currentMainTab === 'bibliotheek') {
      sectionContainerEl = secGaps; renderGaps(); sectionContainerEl = null;
    } else { renderGaps(); }
    return;
  }

  // ── Inline mood-knoppen (Ontdek) ───────────────────────────────────────────
  const inlineMoodBtn = e.target.closest('.sec-mood-block [data-mood]');
  if (inlineMoodBtn) {
    const mood = inlineMoodBtn.dataset.mood;
    if (activeMood === mood) {
      activeMood = null;
      document.querySelectorAll('[data-mood]').forEach(b => b.classList.remove('sel-mood', 'loading'));
      clearSpotifyRecs();
      loadOntdek(); // herbouw zonder clear-knop
      return;
    }
    activeMood = mood;
    document.querySelectorAll('[data-mood]').forEach(b => b.classList.remove('sel-mood', 'loading'));
    inlineMoodBtn.classList.add('sel-mood');
    // Voeg clear-knop toe als die er nog niet is
    const itb = inlineMoodBtn.closest('.inline-toolbar');
    if (itb && !document.getElementById('btn-clear-mood-inline')) {
      const sep = document.createElement('span'); sep.className = 'toolbar-sep';
      const clr = document.createElement('button'); clr.className = 'tool-btn';
      clr.id = 'btn-clear-mood-inline'; clr.textContent = '✕ Wis mood';
      clr.addEventListener('click', () => {
        activeMood = null;
        document.querySelectorAll('[data-mood]').forEach(b => b.classList.remove('sel-mood','loading'));
        clearSpotifyRecs(); loadOntdek();
      });
      itb.appendChild(sep); itb.appendChild(clr);
    }
    loadSpotifyRecs(mood);
    return;
  }

  // Tidal: view-knop (zoeken / queue / geschiedenis / tidarr)
  const tvBtn = e.target.closest('[data-tidal-view]');
  if (tvBtn) {
    const view = tvBtn.dataset.tidalView;
    if (view === 'tidarr') {
      document.getElementById('tb-tidal')?.classList.remove('visible');
      document.getElementById('tb-tidarr-ui')?.classList.add('visible');
      loadTidarrUI();
    } else {
      hideTidarrUI();
      document.getElementById('tb-tidal')?.classList.add('visible');
      document.getElementById('tb-tidarr-ui')?.classList.remove('visible');
      setTidalView(view);
    }
    return;
  }

  // Panel overlay backdrop click → sluiten
  if (e.target === document.getElementById('panel-overlay')) {
    closeArtistPanel();
    return;
  }
});

// Tidal zoekbalk input
document.getElementById('tidal-search')?.addEventListener('input', e => {
  clearTimeout(tidalSearchTimeout);
  const q = e.target.value.trim();
  tidalSearchTimeout = setTimeout(() => {
    if (currentTab === 'tidal' && tidalView === 'search') renderTidalSearch(q);
  }, 400);
});

document.getElementById('panel-close').addEventListener('click', closeArtistPanel);

// STAP 13.2: Keyboard shortcuts
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeArtistPanel();
    document.getElementById('search-results').classList.remove('open');
    return;
  }

  // Niet triggeren als in een invoerveld
  const inInput = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName);

  // '/' → focus zoekbalk
  if (e.key === '/' && !inInput) {
    e.preventDefault();
    document.getElementById('search-input').focus();
    return;
  }

  // 'r' → refresh huidige tab (composiet tabs herladen als geheel)
  if (e.key === 'r' && !inInput) {
    if (currentMainTab === 'ontdek') loadOntdek();
    else if (currentMainTab === 'bibliotheek') loadBibliotheek();
    else tabLoaders[currentTab]?.();
    return;
  }

  // Cijfertoetsen 1–4 → activeer één van de 4 hoofdtabs
  if (!inInput && /^[1-4]$/.test(e.key)) {
    const tabs = document.querySelectorAll('.tab');
    const idx  = parseInt(e.key) - 1;
    if (tabs[idx]) tabs[idx].click();
    return;
  }
});

// STAP 7: Bottom nav click handlers
document.querySelectorAll('.bnav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    // Sync met de gewone tabs
    const desktopTab = document.querySelector(`.tab[data-tab="${tab}"]`);
    if (desktopTab) {
      if (document.startViewTransition) {
        document.startViewTransition(() => {
          desktopTab.click();
        }).finished.catch(() => {});
      } else {
        desktopTab.click();
      }
    }
    // Update bottom nav active state
    document.querySelectorAll('.bnav-btn').forEach(b => b.classList.toggle('active', b === btn));
  });
});

// Sync bottom nav wanneer desktop tab wordt geklikt
document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    document.querySelectorAll('.bnav-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.tab === tab);
    });
  });
});

// STAP 9: Dark/light mode toggle
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
}

(function initTheme() {
  const saved = localStorage.getItem('theme');
  if (saved) {
    applyTheme(saved);
  } else {
    applyTheme('light');
  }
})();

document.getElementById('theme-toggle')?.addEventListener('click', () => {
  const current = document.documentElement.dataset.theme;
  const next    = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  localStorage.setItem('theme', next);
});

// ── Download kwaliteit ─────────────────────────────────────────────────────
const VALID_QUALITIES = ['max', 'high', 'normal', 'low'];

function getDownloadQuality() {
  return localStorage.getItem('downloadQuality') || 'high';
}

(function initQuality() {
  const saved = getDownloadQuality();
  const sel   = document.getElementById('download-quality');
  if (sel && VALID_QUALITIES.includes(saved)) sel.value = saved;
})();

document.getElementById('download-quality')?.addEventListener('change', (e) => {
  localStorage.setItem('downloadQuality', e.target.value);
});

// ── Gebruikersprofiel ──────────────────────────────────────────────────────
async function loadUser() {
  try {
    const d = await apiFetch('/api/user');
    const u = d.user;
    const src = getImg(u.image, 'large');
    const av = src
      ? `<img class="user-avatar" src="${src}" alt="">`
      : `<div class="user-avatar-ph">${(u.name||'U')[0].toUpperCase()}</div>`;
    const year = new Date(parseInt(u.registered?.unixtime) * 1000).getFullYear();
    document.getElementById('user-wrap').innerHTML = `
      <div class="user-card">${av}
        <div><div class="user-name">${esc(u.realname || u.name)}</div>
        <div class="user-sub">${fmt(u.playcount)} scrobbles · lid sinds ${year}</div></div>
      </div>`;
  } catch (e) {}
}

// ── Init ───────────────────────────────────────────────────────────────────
loadPlexStatus();
loadPlexNP();
loadUser();
loadWishlistState();
loadTidarrStatus();
loadDownloadHistory();   // laad persistente download-geschiedenis voor groene vinkjes
startTidarrSSE();        // real-time queue via SSE
checkSpotifyStatus();    // toon mood-toolbar als SPOTIFY_CLIENT_ID aanwezig is
loadNu();
setInterval(loadPlexNP, 30_000);
