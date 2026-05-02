// ── AudioMuse Smart Playlists view ───────────────────────────────────────────
// Toont AudioMuse clustering-resultaten als Roon-stijl playlist kaarten.
// Elke kaart toont naam, aantal nummers en top moods.
// Klik opent de tracklist, nummers afspelen via Plex.

import { esc, gradientFor } from '../helpers.js';
import {
  getSmartPlaylists,
  getSmartPlaylistTracks,
  renderTrackList,
  getAnalysisStatus,
} from '../modules/audiomuse-api.js';
import { playOnZone } from '../components/plexRemote.js';
import { apiFetch } from '../api.js';

// ── Helpers ─────────────────────────────────────────────────────────────────

function getContent() { return document.getElementById('content'); }

function moodBadges(moods) {
  if (!moods || moods.length === 0) return '';
  return `<div class="am-mood-list">${
    moods.slice(0, 4).map(m => `<span class="am-mood-badge">${esc(String(m))}</span>`).join('')
  }</div>`;
}

// ── Playlist card HTML ───────────────────────────────────────────────────────

function playlistCard(pl) {
  const name    = pl.name || `Playlist ${pl.id}`;
  const count   = pl.track_count ?? pl.tracks?.length ?? 0;
  const moods   = pl.moods || pl.tags || [];
  const bg      = gradientFor(name, true);
  return `
    <div class="am-pl-card" data-pl-id="${esc(String(pl.id))}" tabindex="0" role="button"
         aria-label="Bekijk ${esc(name)}">
      <div class="am-pl-cover" style="background:${bg}">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
             stroke="rgba(255,255,255,0.7)" stroke-width="1.5" aria-hidden="true">
          <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
        </svg>
      </div>
      <div class="am-pl-info">
        <div class="am-pl-name">${esc(name)}</div>
        <div class="am-pl-meta">${count} nummers</div>
        ${moodBadges(moods)}
      </div>
    </div>`;
}

// ── Track detail panel ───────────────────────────────────────────────────────

async function showPlaylistDetail(playlistId, playlistName) {
  const content = getContent();
  if (!content) return;

  content.innerHTML = `
    <div class="am-view">
      <div class="am-header">
        <button class="am-back-btn" id="am-back-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
          Terug
        </button>
        <h1 class="am-view-title">${esc(playlistName)}</h1>
      </div>
      <div class="am-card">
        <div class="am-loading-small"><div class="spinner"></div>Nummers laden…</div>
      </div>
    </div>`;

  document.getElementById('am-back-btn')?.addEventListener('click', () => {
    loadAudioMuseSmartPlaylists();
  });

  const tracks = await getSmartPlaylistTracks(playlistId);
  const card = content.querySelector('.am-card');
  if (!card) return;

  if (tracks.length === 0) {
    card.innerHTML = `<div class="am-empty">Geen nummers gevonden voor deze playlist.</div>`;
    return;
  }

  card.innerHTML = `
    <div class="am-pl-detail-header">
      <span class="am-pl-detail-count">${tracks.length} nummers</span>
      <button class="am-submit-btn am-play-all-btn" id="am-play-all">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <polygon points="5 3 19 12 5 21 5 3"/>
        </svg>
        Alles afspelen
      </button>
    </div>
    <div class="am-track-list" id="am-pl-tracks">
      ${renderTrackList(tracks)}
    </div>`;

  // Wire track play buttons
  _wirePlayButtons(card);

  // Play all button
  document.getElementById('am-play-all')?.addEventListener('click', async () => {
    const btn = document.getElementById('am-play-all');
    if (btn) { btn.disabled = true; btn.textContent = 'Laden…'; }
    // Find first track with a ratingKey and play it; Plex will queue the rest
    const firstWithKey = tracks.find(t => t.plex_rating_key || t.rating_key);
    if (firstWithKey) {
      playOnZone(firstWithKey.plex_rating_key || firstWithKey.rating_key);
    } else if (tracks[0]) {
      const t = tracks[0];
      const artist = t.artist || '';
      const title  = t.title  || t.name || '';
      try {
        const data = await apiFetch(`/api/plex/search?q=${encodeURIComponent(`${artist} ${title}`)}`);
        const found = (data.tracks || data.results || []).find(r =>
          (r.title || '').toLowerCase().includes(title.toLowerCase())
        );
        if (found?.ratingKey) playOnZone(found.ratingKey);
      } catch { /* ignore */ }
    }
    if (btn) { btn.disabled = false; btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="5 3 19 12 5 21 5 3"/></svg> Alles afspelen'; }
  });
}

// ── Main view ────────────────────────────────────────────────────────────────

export async function loadAudioMuseSmartPlaylists() {
  const content = getContent();
  if (!content) return;

  content.innerHTML = `
    <div class="am-view">
      <div class="am-header">
        <div class="am-header-left">
          <button class="am-back-btn" id="am-spl-back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
            AudioMuse
          </button>
          <div>
            <h1 class="am-view-title">Smart Playlists</h1>
            <p class="am-view-sub">AudioMuse groepeert je muziek op sonic kenmerken</p>
          </div>
        </div>
      </div>
      <div id="am-spl-body">
        <div class="am-loading-small"><div class="spinner"></div>Playlists laden…</div>
      </div>
    </div>`;

  document.getElementById('am-spl-back')?.addEventListener('click', () => {
    import('../router.js').then(m => m.switchView('audiomuse'));
  });

  // Check status first
  const status = await getAnalysisStatus();
  const body = document.getElementById('am-spl-body');
  if (!body) return;

  if (!status) {
    body.innerHTML = `
      <div class="am-card">
        <div class="am-status-row">
          <span class="am-status-dot am-dot-red"></span>
          <span class="am-status-text">AudioMuse is offline. Smart Playlists zijn niet beschikbaar.</span>
        </div>
      </div>`;
    return;
  }

  const playlists = await getSmartPlaylists();

  if (playlists.length === 0) {
    const s = (status.status || '').toLowerCase();
    const isAnalyzing = s === 'analyzing' || s === 'running' || s === 'processing';
    body.innerHTML = `
      <div class="am-card">
        ${isAnalyzing
          ? `<div class="am-status-row">
               <span class="am-status-dot am-dot-orange"></span>
               <span>AudioMuse is bezig met analyseren (${status.percent ?? 0}%). Smart Playlists verschijnen zodra de analyse klaar is.</span>
             </div>`
          : `<div class="am-empty">Nog geen Smart Playlists beschikbaar. Start de analyse vanuit AudioMuse UI.</div>`
        }
      </div>`;
    return;
  }

  body.innerHTML = `
    <div class="am-pl-grid" id="am-pl-grid">
      ${playlists.map(playlistCard).join('')}
    </div>`;

  // Click handlers on cards
  body.querySelectorAll('.am-pl-card').forEach(card => {
    const handler = () => {
      const plId   = card.dataset.plId;
      const plName = card.querySelector('.am-pl-name')?.textContent || `Playlist ${plId}`;
      showPlaylistDetail(plId, plName);
    };
    card.addEventListener('click', handler);
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') handler(); });
  });
}

// ── Play button wiring ───────────────────────────────────────────────────────

function _wirePlayButtons(container) {
  container.querySelectorAll('.am-play-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const ratingKey = btn.dataset.playRatingkey;
      if (ratingKey) { playOnZone(ratingKey); return; }

      const artist = btn.dataset.amArtist || '';
      const title  = btn.dataset.amTitle  || '';
      if (!artist && !title) return;
      btn.disabled = true;
      const orig = btn.innerHTML;
      btn.textContent = '…';
      try {
        const data = await apiFetch(`/api/plex/search?q=${encodeURIComponent(`${artist} ${title}`)}`);
        const track = (data.tracks || data.results || []).find(t =>
          (t.title || '').toLowerCase().includes(title.toLowerCase())
        );
        if (track?.ratingKey) {
          playOnZone(track.ratingKey);
        } else {
          btn.textContent = '?';
          setTimeout(() => { btn.disabled = false; btn.innerHTML = orig; }, 2000);
        }
      } catch {
        btn.disabled = false;
        btn.innerHTML = orig;
      }
    });
  });
}
