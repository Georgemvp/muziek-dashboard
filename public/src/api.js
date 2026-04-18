// ── API-laag ──────────────────────────────────────────────────────────────
import { state } from './state.js';
import { getImg, esc, fmt } from './helpers.js';

export async function apiFetch(url) {
  const res = await fetch(url);
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
    const pill = document.getElementById('plex-pill');
    const text = document.getElementById('plex-pill-text');
    if (d.connected) {
      state.plexOk = true;
      pill.className = 'plex-pill on';
      const albumPart = d.albums ? ` · ${fmt(d.albums)} albums` : '';
      text.textContent = `Plex · ${fmt(d.artists)} artiesten${albumPart}`;
    } else {
      pill.className = 'plex-pill off';
      text.textContent = 'Plex offline';
    }
  } catch {
    document.getElementById('plex-pill-text').textContent = 'Plex offline';
  }
}

// ── Gebruikersprofiel ─────────────────────────────────────────────────────
export async function loadUser() {
  try {
    const d = await apiFetch('/api/user');
    const u = d.user;
    const src = getImg(u.image, 'large');
    const av = src
      ? `<img class="user-avatar" src="${src}" alt="">`
      : `<div class="user-avatar-ph">${(u.name || 'U')[0].toUpperCase()}</div>`;
    const year = new Date(parseInt(u.registered?.unixtime) * 1000).getFullYear();
    document.getElementById('user-wrap').innerHTML = `
      <div class="user-card">${av}
        <div><div class="user-name">${esc(u.realname || u.name)}</div>
        <div class="user-sub">${fmt(u.playcount)} scrobbles · lid sinds ${year}</div></div>
      </div>`;
  } catch {}
}
