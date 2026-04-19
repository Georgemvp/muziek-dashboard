// ── Helpers, UI-utilities en rendering ────────────────────────────────────
import { state } from './state.js';

// ── Fetch-wrapper met AbortController ──────────────────────────────────────
/**
 * Wrapper die automatisch tabAbort signal toevoegt aan fetch.
 * Gebruik dit voor alle tab-data-verzoeken (geen SSE/streaming).
 * @param {string} url    Request URL
 * @param {object} opts   Fetch opties (method, body, etc.)
 * @returns {Promise}     Fetch promise
 */
export function p(url, opts = {}) {
  // Voeg signal toe van huidige tabAbort controller
  // Sla over als er al een signal in opts is (voor SSE bijv.)
  if (!opts.signal && state.tabAbort) {
    opts = { ...opts, signal: state.tabAbort.signal };
  }
  return fetch(url, opts);
}

// ── Animatie-voorkeur ─────────────────────────────────────────────────────
export const prefersReducedMotion =
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── DOM root ──────────────────────────────────────────────────────────────
export const contentEl = document.getElementById('content');

// ── Image proxy helper ────────────────────────────────────────────────────
/**
 * Bouw een /api/img URL die de originele afbeelding resizet naar WebP.
 * @param {string|null} url   Originele afbeelding-URL
 * @param {number}      size  Gewenste breedte én hoogte in px
 * @returns {string|null}
 */
export function proxyImg(url, size = 120) {
  if (!url) return null;
  return `/api/img?url=${encodeURIComponent(url)}&w=${size}&h=${size}`;
}

// ── Pure helpers ──────────────────────────────────────────────────────────
export const getImg = (imgs, size = 'medium') => {
  if (!imgs) return null;
  const i = imgs.find(x => x.size === size);
  return (i && i['#text'] && !i['#text'].includes('2a96cbd8b46e442fc41c2b86b821562f'))
    ? i['#text'] : null;
};

export const initials = n =>
  String(n || '?').split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);

export const fmt  = n => parseInt(n).toLocaleString('nl-NL');
export const esc  = s =>
  String(s || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');

export const periodLabel = p =>
  ({ '7day':'week','1month':'maand','3month':'3 maanden','12month':'jaar','overall':'alles' }[p] || p);

export function timeAgo(ts) {
  const s = Math.floor(Date.now() / 1000) - ts;
  if (s < 120)   return 'zojuist';
  if (s < 3600)  return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}u`;
  return `${Math.floor(s / 86400)}d`;
}

export function gradientFor(name, useRadial = false) {
  let h = 0;
  for (let i = 0; i < name.length; i++)
    h = (h * 31 + name.charCodeAt(i)) & 0xffffff;
  const hue  = h % 360;
  const sat1 = 45 + (h % 31);
  const sat2 = 50 + ((h >> 8) % 26);
  const l1   = 20 + ((h >> 16) % 16);
  const l2   = 15 + ((h >> 10) % 11);
  if (useRadial)
    return `radial-gradient(circle, hsl(${hue},${sat1}%,${l1}%), hsl(${(hue+40)%360},${sat2}%,${l2}%))`;
  return `linear-gradient(135deg, hsl(${hue},${sat1}%,${l1}%), hsl(${(hue+40)%360},${sat2}%,${l2}%))`;
}

export function countryFlag(code) {
  if (!code || code.length !== 2) return '';
  return [...code.toUpperCase()]
    .map(c => String.fromCodePoint(c.charCodeAt(0) + 127397)).join('');
}

export function tagsHtml(tags, max = 4) {
  if (!tags?.length) return '';
  return `<div class="tags" style="margin-top:5px">${
    tags.slice(0, max).map(t => `<span class="tag">${esc(t)}</span>`).join('')
  }</div>`;
}

export function plexBadge(inPlex) {
  if (!state.plexOk) return '';
  return inPlex
    ? `<span class="badge plex">▶ In Plex</span>`
    : `<span class="badge new">✦ Nieuw</span>`;
}

export function bookmarkBtn(type, name, artist = '', image = '') {
  const saved = state.wishlistMap.has(`${type}:${name}`);
  return `<button class="bookmark-btn${saved ? ' saved' : ''}"
    data-btype="${esc(type)}" data-bname="${esc(name)}"
    data-bartist="${esc(artist)}" data-bimage="${esc(image)}"
    title="${saved ? 'Verwijder uit lijst' : 'Sla op in lijst'}">🔖</button>`;
}

export function sanitizeArtistName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
}

// ── Download-helpers ──────────────────────────────────────────────────────
export function normalizeKey(artist, title) {
  const n = s => (s || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
  return `${n(artist)}|${n(title)}`;
}
export const isDownloaded  = (a, t) => state.downloadedSet.has(normalizeKey(a, t));
export const markDownloaded = (a, t) => state.downloadedSet.add(normalizeKey(a, t));

export function downloadBtn(artist, album = '', inPlex = false) {
  if (!state.tidarrOk || inPlex) return '';
  if (isDownloaded(artist, album))
    return `<button class="download-btn dl-done"
      data-dlartist="${esc(artist)}" data-dlalbum="${esc(album)}"
      title="Al gedownload">✓</button>`;
  return `<button class="download-btn"
    data-dlartist="${esc(artist)}" data-dlalbum="${esc(album)}"
    title="Download via Tidarr">⬇</button>`;
}

// ── Track/album rendering ──────────────────────────────────────────────────
export const trackImg = imgs => {
  const src = getImg(imgs);
  if (src)
    return `<img class="card-img" src="${src}" alt="" loading="lazy"
      onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
      <div class="card-ph" style="display:none">♪</div>`;
  return `<div class="card-ph">♪</div>`;
};

export function albumCard(album, showBadge = true, artist = '') {
  const owned = album.inPlex;
  const bg    = gradientFor(album.title || '');
  const year  = album.year || '—';
  const alreadyDl = isDownloaded(artist, album.title || '');
  const dlHtml = (state.tidarrOk && artist && !owned)
    ? alreadyDl
      ? `<button class="album-dl-btn download-btn dl-done" data-dlartist="${esc(artist)}" data-dlalbum="${esc(album.title||'')}" title="Al gedownload">✓</button>`
      : `<button class="album-dl-btn download-btn" data-dlartist="${esc(artist)}" data-dlalbum="${esc(album.title||'')}" title="Download via Tidarr">⬇</button>`
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

// ── Staggered animaties ───────────────────────────────────────────────────
export function applyStaggeredAnimations() {
  if (prefersReducedMotion) return;
  const configs = {
    '.rec-grid > *':      60,
    '.card-list > *':     25,
    '.artist-grid > *':   40,
    '.releases-grid > *': 40,
    '.wishlist-grid > *': 40,
  };
  Object.entries(configs).forEach(([sel, ms]) => {
    document.querySelectorAll(sel).forEach((el, i) => {
      el.style.animationDelay = `${i * ms}ms`;
    });
  });
}

// ── Skeleton loaders ──────────────────────────────────────────────────────
export function showSkeleton(type) {
  let html = '';
  if (type === 'cards') {
    html = '<div class="skeleton-list">' +
      Array(6).fill('<div class="skeleton skeleton-card"></div>').join('') + '</div>';
  } else if (type === 'grid') {
    html = '<div class="skeleton-grid">' +
      Array(8).fill('<div class="skeleton skeleton-square"></div>').join('') + '</div>';
  } else if (type === 'stats') {
    html = '<div class="skeleton-stats">' +
      '<div class="skeleton skeleton-stat-full"></div>' +
      '<div class="skeleton-two">' +
      '<div class="skeleton skeleton-stat-half"></div>' +
      '<div class="skeleton skeleton-stat-half"></div>' +
      '</div></div>';
  } else {
    html = `<div class="loading"><div class="spinner"></div>${type || 'Laden...'}</div>`;
  }
  setContent(html);
}

// ── Content weergave ──────────────────────────────────────────────────────
export function setContent(html, callback) {
  // Reset sectionContainerEl if it's no longer in the DOM
  if (state.sectionContainerEl && !document.contains(state.sectionContainerEl)) {
    state.sectionContainerEl = null;
  }
  const target = state.sectionContainerEl || contentEl;

  if (!state.sectionContainerEl && document.startViewTransition) {
    document.startViewTransition(() => {
      target.innerHTML = html;
      applyStaggeredAnimations();
      if (callback) requestAnimationFrame(callback);
    }).finished.catch(() => {});
  } else {
    target.innerHTML = html;
    if (!state.sectionContainerEl) {
      contentEl.style.opacity = '0';
      contentEl.style.transform = 'translateY(6px)';
      requestAnimationFrame(() => {
        void contentEl.offsetHeight;
        contentEl.style.opacity = '1';
        contentEl.style.transform = '';
        applyStaggeredAnimations();
        if (callback) requestAnimationFrame(callback);
      });
    } else {
      if (callback) callback();
    }
  }
}

export const showError = msg =>
  setContent(`<div class="error-box">⚠️ ${esc(msg)}</div>`);

export function showLoading(msg) {
  if (state.sectionContainerEl) {
    state.sectionContainerEl.innerHTML =
      `<div class="loading"><div class="spinner"></div>${msg || 'Laden...'}</div>`;
    return;
  }
  const skeletonMap = {
    recent: 'cards', loved: 'cards', toptracks: 'cards',
    topartists: 'grid', releases: 'grid', recs: 'grid',
    discover: 'grid', gaten: 'grid', stats: 'stats',
    lijst: 'grid', collectie: 'cards', tidal: 'cards',
    nu: 'cards', ontdek: 'grid', bibliotheek: 'cards', downloads: 'cards'
  };
  // Lookup by activeSubTab first, then activeTab
  const lookupTab = state.activeSubTab || state.activeTab;
  const skType = skeletonMap[lookupTab];
  if (skType && !msg) showSkeleton(skType);
  else setContent(`<div class="loading"><div class="spinner"></div>${msg || 'Laden...'}</div>`);
}

// ── Lazy-load via IntersectionObserver ────────────────────────────────────
export function setupLazyLoad(el, callback) {
  if (!el) return;
  if (!('IntersectionObserver' in window)) { callback(); return; }
  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { obs.unobserve(entry.target); callback(); }
    });
  }, { rootMargin: '300px' });
  obs.observe(el);
}

// ── Mutex voor sectionContainerEl ────────────────────────────────────────
export function runWithSection(el, fn) {
  const result = state.sectionMutex.then(async () => {
    state.sectionContainerEl = el;
    try { await fn(); }
    finally { state.sectionContainerEl = null; }
  });
  state.sectionMutex = result.catch(() => {});
  return result;
}
