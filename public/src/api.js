// ── API-laag ──────────────────────────────────────────────────────────────
import { state } from './state.js';
import { getImg, esc, fmt } from './helpers.js';
import { getCached, setCache } from './cache.js';

// ── Request Deduplication (Request Coalescing) ─────────────────────────────
// Voorkomt duplicate simultane requests naar dezelfde URL
const _inflight = new Map();

/**
 * Haal een URL op met deduplicatie: als dezelfde URL al aan het laden is,
 * return de bestaande Promise i.p.v. een nieuwe fetch te starten.
 * @param {string} url - Request URL
 * @returns {Promise} Resolves met JSON response
 */
export async function fetchOnce(url) {
  // Check if request is already in flight
  if (_inflight.has(url)) {
    return _inflight.get(url);
  }

  // Start new request
  const promise = apiFetch(url);

  // Store in flight
  _inflight.set(url, promise);

  // Remove from inflight when done (success or error)
  promise.finally(() => {
    _inflight.delete(url);
  });

  return promise;
}

/**
 * Toont een tijdelijke melding bovenaan de pagina bij een 429-fout.
 * Verdwijnt automatisch na 8 seconden; herhaalde meldingen worden genegeerd.
 */
function _showRateLimitNotice(msg) {
  if (document.getElementById('rate-limit-notice')) return;
  const el = document.createElement('div');
  el.id = 'rate-limit-notice';
  Object.assign(el.style, {
    position:    'fixed',
    top:         '16px',
    left:        '50%',
    transform:   'translateX(-50%)',
    background:  '#e05a2b',
    color:       '#fff',
    padding:     '12px 24px',
    borderRadius:'8px',
    zIndex:      '9999',
    fontSize:    '14px',
    fontFamily:  'sans-serif',
    boxShadow:   '0 4px 16px rgba(0,0,0,0.35)',
    whiteSpace:  'nowrap'
  });
  el.textContent = '⏱ ' + msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 8000);
}

export async function apiFetch(url, { signal } = {}) {
  const res = await fetch(url, { signal });
  if (res.status === 429) {
    const data = await res.json().catch(() => ({}));
    const msg  = data.error || 'Te veel verzoeken, probeer het over een minuut opnieuw';
    _showRateLimitNotice(msg);
    throw new Error(msg);
  }
  if (!res.ok) throw new Error(`Serverfout ${res.status}`);
  return res.json();
}

// ── Download-geschiedenis ─────────────────────────────────────────────────
export async function loadDownloadHistory() {
  try {
    const keys = await apiFetch('/api/downloads/keys');
    state.downloadedSet = new Set(keys);
  } catch { state.downloadedSet = new Set(); }
}

// ── Plex status ───────────────────────────────────────────────────────────
export async function loadPlexStatus() {
  try {
    const d = await fetch('/api/plex/status').then(r => r.json());
    const dot = document.getElementById('plex-dot');
    const text = document.getElementById('plex-status-text');

    if (d.connected) {
      state.plexOk = true;
      if (dot) dot.classList.toggle('connected', true);
      if (text) {
        const albumPart = d.albums ? ` · ${fmt(d.albums)} albums` : '';
        text.textContent = `Plex · ${fmt(d.artists)} artiesten${albumPart}`;
      }
    } else {
      if (dot) dot.classList.toggle('connected', false);
      if (text) text.textContent = 'Plex offline';
    }
  } catch (err) {
    state.plexOk = false;
    const text = document.getElementById('plex-status-text');
    if (text) text.textContent = 'Plex offline';
  }
}

// ── Gebruikersprofiel ─────────────────────────────────────────────────────
export async function loadUser() {
  try {
    // TTL: 10 minuten
    let d = getCached('user', 10 * 60 * 1000);
    if (!d) {
      d = await apiFetch('/api/user');
      setCache('user', d);
    }

    const u = d.user;
    const src = getImg(u.image, 'large');
    const av = src
      ? `<img class="user-avatar" src="${src}" alt="${esc(u.realname || u.name)}" loading="lazy">`
      : `<div class="user-avatar-ph">${(u.name || 'U')[0].toUpperCase()}</div>`;
    const year = new Date(parseInt(u.registered?.unixtime) * 1000).getFullYear();

    // user-wrap element bestaat mogelijk niet meer in layout - voeg null-check toe
    const userWrap = document.getElementById('user-wrap');
    if (userWrap) {
      userWrap.innerHTML = `
        <div class="user-card">${av}
          <div><div class="user-name">${esc(u.realname || u.name)}</div>
          <div class="user-sub">${fmt(u.playcount)} scrobbles · lid sinds ${year}</div></div>
        </div>`;
    }
  } catch {}
}
