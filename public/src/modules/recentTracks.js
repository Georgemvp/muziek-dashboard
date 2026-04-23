// ── Recent Tracks Module ────────────────────────────────────────────────────
// Toont recent gespeelde tracks in de bibliotheek

import { queueManager } from './queueManager.js';
import {
  esc, fmt, gradientFor, initials, proxyImg, getImg,
  showLoading, setContent, setupLazyLoad
} from '../helpers.js';

export async function renderRecentTracks(container) {
  try {
    // Laad recente tracks
    const recentTracks = queueManager.getRecent();

    if (!recentTracks || recentTracks.length === 0) {
      container.innerHTML = `
        <div style="padding: 40px 20px; text-align: center; color: var(--text-muted);">
          <p style="font-size: 14px; margin: 0;">Geen recent afgespeelde nummers</p>
          <p style="font-size: 12px; color: var(--text-muted); margin-top: 8px;">
            Nummers verschijnen hier nadat je ze hebt afgespeeld
          </p>
        </div>
      `;
      return;
    }

    // Render list
    const html = `
      <div class="recent-tracks-list">
        <div class="recent-header">
          <button class="recent-clear-btn" id="recent-clear">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            Wis geschiedenis
          </button>
        </div>
        <div class="recent-items">
          ${recentTracks.map((track, idx) => renderRecentTrack(track, idx)).join('')}
        </div>
      </div>
    `;

    container.innerHTML = html;
    setupLazyLoad();

    // Setup event listeners
    const clearBtn = container.querySelector('#recent-clear');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (confirm('Geschiedenis wissen?')) {
          queueManager.clearRecent();
          renderRecentTracks(container);
        }
      });
    }

    // Setup click handlers for tracks
    container.querySelectorAll('.recent-item').forEach((el) => {
      el.addEventListener('click', async (e) => {
        e.preventDefault();
        const track = {
          ratingKey: el.dataset.ratingKey,
          title: el.dataset.title,
          artist: el.dataset.artist,
          album: el.dataset.album,
          thumb: el.dataset.thumb,
          duration: el.dataset.duration ? parseInt(el.dataset.duration) : 0,
        };

        // Play track via web player
        try {
          const res = await fetch('/api/plex/play', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              machineId: '__web__',
              ratingKey: track.ratingKey,
            }),
          });
          const data = await res.json();
          if (res.ok && data.ok) {
            // Import player functions
            const { playWebStream, playerState } = await import('../components/player.js');
            await playWebStream(data.webStream);

            // Update player bar
            const titleEl = document.getElementById('player-title');
            const artistEl = document.getElementById('player-artist');
            const artEl = document.getElementById('player-art');
            const playBtn = document.getElementById('player-play');

            if (titleEl) titleEl.textContent = track.title;
            if (artistEl) artistEl.textContent = track.artist;
            if (artEl && (track.thumb || data.thumb)) {
              artEl.src = track.thumb || data.thumb;
            }
            if (playBtn) {
              playBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
            }
          }
        } catch (e) {
          console.error('Fout bij afspelen:', e);
        }
      });
    });

  } catch (e) {
    console.error('Fout bij laden recent tracks:', e);
    container.innerHTML = `<div style="color: var(--text-muted); padding: 20px;">Fout bij laden</div>`;
  }
}

function renderRecentTrack(track, idx) {
  const src = track.thumb ? proxyImg(track.thumb, 120) : null;
  const img = src
    ? `<img src="${esc(src)}" alt="${esc(track.title)}" loading="lazy"
         onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
    : '';
  const placeholder = `<div class="recent-ph" style="background:${gradientFor(track.title)}">${initials(track.title)}</div>`;

  const playedAt = track.playedAt ? new Date(track.playedAt) : null;
  const timeStr = playedAt ? formatTime(playedAt) : '';

  return `
    <div class="recent-item"
         data-rating-key="${esc(track.ratingKey)}"
         data-title="${esc(track.title)}"
         data-artist="${esc(track.artist)}"
         data-album="${esc(track.album || '')}"
         data-thumb="${esc(track.thumb || '')}"
         data-duration="${track.duration || 0}">
      <div class="recent-cover">
        ${img}
        ${placeholder}
      </div>
      <div class="recent-info">
        <div class="recent-title">${esc(track.title)}</div>
        <div class="recent-artist">${esc(track.artist)}</div>
        <div class="recent-time">${timeStr}</div>
      </div>
      <button class="recent-play-btn" aria-label="Afspelen">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2">
          <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
      </button>
    </div>
  `;
}

function formatTime(date) {
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Net gespeeld';
  if (minutes < 60) return `${minutes}m geleden`;
  if (hours < 24) return `${hours}u geleden`;
  if (days < 7) return `${days}d geleden`;

  return date.toLocaleDateString('nl-NL');
}
