// ── Playlists views — Overzicht en detail van Plex-afspeellijsten ─────────

import { state } from '../state.js';
import { apiFetch } from '../api.js';
import { esc, fmt, proxyImg } from '../helpers.js';
import { switchView } from '../router.js';

// ── Hulpfunctie: milliseconden → M:SS ──────────────────────────────────────
function fmtMs(ms) {
  if (!ms) return '—';
  const totalSec = Math.floor(ms / 1000);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ── Hulpfunctie: milliseconden → "X min" ──────────────────────────────────
function fmtDuration(ms) {
  if (!ms) return '';
  const mins = Math.round(ms / 60000);
  return `${mins} min`;
}

// ═══════════════════════════════════════════════════════════════════════════
// Playlists Overview
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Laad het playlists-overzicht: een grid van alle Plex-afspeellijsten.
 * Verwacht geen state.viewParams.
 */
export async function loadPlaylists() {
  const content = document.getElementById('content');
  if (!content) return;

  content.innerHTML = `
    <div class="playlists-page">
      <div class="playlists-toolbar">
        <h1 class="playlists-title">Afspeellijsten</h1>
      </div>
      <div class="playlists-grid" id="playlists-grid">
        <div class="playlists-loading">
          <div class="spinner-sm"></div>
          <span>Laden…</span>
        </div>
      </div>
    </div>`;

  try {
    const data = await apiFetch('/api/plex/playlists', {
      signal: state.tabAbort?.signal
    });
    const playlists = data?.playlists || data || [];

    const grid = document.getElementById('playlists-grid');
    if (!grid) return;

    if (!playlists.length) {
      grid.innerHTML = `<div class="playlists-empty">Geen afspeellijsten gevonden in Plex.</div>`;
      return;
    }

    grid.innerHTML = playlists.map(pl => {
      const imgUrl = pl.thumb ? proxyImg(pl.thumb, 300) : null;
      const count  = pl.trackCount || 0;
      const dur    = fmtDuration(pl.duration);

      return `
        <button class="playlist-card"
                data-playlist-id="${esc(pl.ratingKey)}"
                data-playlist-title="${esc(pl.title)}"
                aria-label="Open afspeellijst ${esc(pl.title)}">
          <div class="playlist-card-art">
            ${imgUrl
              ? `<img src="${esc(imgUrl)}" alt="${esc(pl.title)}" loading="lazy">`
              : `<div class="playlist-card-ph">♫</div>`
            }
            ${pl.smart ? `<span class="playlist-smart-badge">SMART</span>` : ''}
          </div>
          <div class="playlist-card-info">
            <div class="playlist-card-title">${esc(pl.title)}</div>
            <div class="playlist-card-meta">
              ${count ? `${fmt(count)} nummers` : ''}${count && dur ? ' · ' : ''}${dur}
            </div>
          </div>
        </button>`;
    }).join('');

  } catch (err) {
    if (err.name === 'AbortError') return;
    const grid = document.getElementById('playlists-grid');
    if (grid) grid.innerHTML = `<div class="playlists-empty">Laden mislukt: ${esc(err.message)}</div>`;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Playlist Detail View
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Laad de detail-view van één afspeellijst.
 * Verwacht state.viewParams = { id: ratingKey, title: 'Playlist naam' }
 */
export async function loadPlaylistDetail() {
  const content = document.getElementById('content');
  if (!content) return;

  const id    = state.viewParams?.id;
  const title = state.viewParams?.title || 'Afspeellijst';

  if (!id) {
    content.innerHTML = `<div class="error-box">⚠️ Geen afspeellijst geselecteerd.</div>`;
    return;
  }

  // Terug-knop target: vorige view of playlists-overzicht
  const backView = state.previousView || 'playlists';

  // Render skeleton terwijl we laden
  content.innerHTML = `
    <div class="playlist-detail-page">
      <div class="playlist-detail-header">
        <button class="album-detail-back" id="playlist-back-btn">← Terug</button>
        <div class="playlist-detail-meta">
          <div class="playlist-detail-art-wrap" id="playlist-detail-art">
            <div class="playlist-card-ph">♫</div>
          </div>
          <div class="playlist-detail-info">
            <div class="playlist-detail-label">AFSPEELLIJST</div>
            <h1 class="playlist-detail-title">${esc(title)}</h1>
            <div class="playlist-detail-sub" id="playlist-detail-sub">Laden…</div>
            <div class="playlist-detail-actions">
              <button class="play-all-btn" id="playlist-play-all" disabled>▶ Afspelen</button>
            </div>
          </div>
        </div>
      </div>
      <div class="playlist-track-list" id="playlist-tracks">
        <div class="playlists-loading">
          <div class="spinner-sm"></div>
          <span>Nummers laden…</span>
        </div>
      </div>
    </div>`;

  // Terug-knop handler
  document.getElementById('playlist-back-btn')?.addEventListener('click', () => {
    switchView(backView);
  });

  try {
    const data = await apiFetch(`/api/plex/playlists/${encodeURIComponent(id)}/tracks`, {
      signal: state.tabAbort?.signal
    });
    const tracks = data?.tracks || [];

    // Update subtitle
    const subEl = document.getElementById('playlist-detail-sub');
    if (subEl) {
      const totalMs  = tracks.reduce((s, t) => s + (t.duration || 0), 0);
      const totalMin = Math.round(totalMs / 60000);
      subEl.textContent = `${fmt(tracks.length)} nummers · ${totalMin} min`;
    }

    // Activeer play-knop (placeholder — uitbreidbaar met Plex zone play)
    const playBtn = document.getElementById('playlist-play-all');
    if (playBtn) {
      playBtn.disabled = false;
      playBtn.setAttribute('data-playlist-id', id);
    }

    // Haal playlist thumb op voor artwork
    try {
      const plData = await apiFetch('/api/plex/playlists', { signal: state.tabAbort?.signal });
      const allPl  = plData?.playlists || plData || [];
      const pl     = allPl.find(p => String(p.ratingKey) === String(id));
      if (pl?.thumb) {
        const artEl = document.getElementById('playlist-detail-art');
        if (artEl) {
          artEl.innerHTML = `<img src="${esc(proxyImg(pl.thumb, 240))}" alt="${esc(title)}" class="playlist-detail-art-img">`;
        }
      }
    } catch (_) { /* artwork is optioneel */ }

    // Render tracklist
    const tracksEl = document.getElementById('playlist-tracks');
    if (!tracksEl) return;

    if (!tracks.length) {
      tracksEl.innerHTML = `<div class="playlists-empty">Deze afspeellijst bevat geen nummers.</div>`;
      return;
    }

    tracksEl.innerHTML = `
      <table class="playlist-track-table">
        <thead>
          <tr>
            <th class="plt-num">#</th>
            <th class="plt-title">Titel</th>
            <th class="plt-artist">Artiest</th>
            <th class="plt-album">Album</th>
            <th class="plt-dur">Duur</th>
          </tr>
        </thead>
        <tbody>
          ${tracks.map((t, i) => {
            const thumb = t.thumb ? proxyImg(t.thumb, 48) : null;
            return `
              <tr class="playlist-track-row">
                <td class="plt-num">${i + 1}</td>
                <td class="plt-title">
                  <div class="plt-title-inner">
                    ${thumb
                      ? `<img src="${esc(thumb)}" alt="" class="plt-thumb" loading="lazy">`
                      : `<div class="plt-thumb plt-thumb-ph"></div>`
                    }
                    <span>${esc(t.title)}</span>
                  </div>
                </td>
                <td class="plt-artist">
                  ${t.artist
                    ? `<button class="plt-artist-link" data-artist="${esc(t.artist)}">${esc(t.artist)}</button>`
                    : '—'
                  }
                </td>
                <td class="plt-album">${esc(t.album || '—')}</td>
                <td class="plt-dur">${fmtMs(t.duration)}</td>
              </tr>`;
          }).join('')}
        </tbody>
      </table>`;

  } catch (err) {
    if (err.name === 'AbortError') return;
    const tracksEl = document.getElementById('playlist-tracks');
    if (tracksEl) {
      tracksEl.innerHTML = `<div class="error-box">⚠️ Laden mislukt: ${esc(err.message)}</div>`;
    }
  }
}
