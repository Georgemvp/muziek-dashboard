// ── Tab: Nu (recent) ──────────────────────────────────────────────────────
import { state } from '../state.js';
import { apiFetch } from '../api.js';
import { esc, timeAgo, trackImg, showLoading, setContent, showError } from '../helpers.js';
import { hideTidarrUI, stopTidarrQueuePolling } from './downloads.js';

// ── Plex Nu Bezig ─────────────────────────────────────────────────────────
export async function loadPlexNP() {
  const wrap = document.getElementById('plex-np-wrap');
  try {
    const d = await fetch('/api/plex/nowplaying').then(r => r.json());
    wrap.innerHTML = d.playing
      ? `<div class="plex-np"><div class="plex-np-dot"></div><span class="plex-np-label">PLEX NU</span>
           <div class="card-info"><div class="card-title">${esc(d.track)}</div>
           <div class="card-sub">${esc(d.artist)}${d.album ? ' · '+esc(d.album) : ''}</div></div></div>`
      : '';
  } catch { wrap.innerHTML = ''; }
}

// ── Recente nummers ───────────────────────────────────────────────────────
export async function loadRecent() {
  showLoading();
  loadPlexNP();
  try {
    const d = await apiFetch('/api/recent');
    const tracks = d.recenttracks?.track || [];
    if (!tracks.length) { setContent('<div class="empty">Geen recente nummers.</div>'); return; }
    let html = '<div class="card-list">';
    for (const t of tracks) {
      const isNow   = t['@attr']?.nowplaying;
      const when    = t.date?.uts ? timeAgo(parseInt(t.date.uts)) : '';
      const art     = t.artist?.['#text'] || '';
      const artwork = trackImg(t.image);
      if (isNow) {
        html += `<div class="now-playing">${artwork}<div class="np-dot"></div>
          <span class="np-label">NU</span>
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

// ── Composiet loader ──────────────────────────────────────────────────────
export function loadNu() {
  state.currentTab = 'recent';
  hideTidarrUI();
  stopTidarrQueuePolling();
  loadRecent();
}
