// ── Audio preview ─────────────────────────────────────────────────────────
import { state } from '../state.js';
import { apiFetch } from '../api.js';
import { getSelectedZone, pauseZone, skipZone } from './plexRemote.js';

export const playerState = {
  previewAudio: new Audio(),
  previewBtn: null,
  webPlayerAudio: new Audio(),  // Voor Plex web playback
  webPlayerActive: false,
};
state.playerState = playerState;

export async function playPreview(btn, artist, track) {
  // Zelfde knop → toggle play/pauze
  if (playerState.previewBtn === btn) {
    if (playerState.previewAudio.paused) {
      await playerState.previewAudio.play();
      btn.textContent = '⏸';
      btn.classList.add('playing');
    } else {
      playerState.previewAudio.pause();
      btn.textContent = '▶';
      btn.classList.remove('playing');
    }
    return;
  }

  // Stop vorige track
  if (playerState.previewBtn) {
    playerState.previewAudio.pause();
    playerState.previewBtn.textContent = '▶';
    playerState.previewBtn.classList.remove('playing');
    const oldFill = playerState.previewBtn.closest('.card')?.querySelector('.play-bar-fill');
    if (oldFill) oldFill.style.width = '0%';
  }

  playerState.previewBtn = btn;
  btn.textContent = '…';
  btn.disabled = true;

  try {
    const params = new URLSearchParams({ artist, track });
    const data = await apiFetch(`/api/preview?${params}`);
    if (!data.preview) {
      btn.textContent = '—';
      btn.disabled = false;
      setTimeout(() => { if (btn.textContent === '—') btn.textContent = '▶'; }, 1800);
      playerState.previewBtn = null;
      return;
    }
    playerState.previewAudio.src = data.preview;
    playerState.previewAudio.currentTime = 0;
    await playerState.previewAudio.play();
    btn.textContent = '⏸';
    btn.disabled = false;
    btn.classList.add('playing');
  } catch {
    btn.textContent = '▶';
    btn.disabled = false;
    playerState.previewBtn = null;
  }
}

// ── Audio event listeners ──────────────────────────────────────────────────
playerState.previewAudio.addEventListener('timeupdate', () => {
  if (!playerState.previewBtn || !playerState.previewAudio.duration) return;
  const fill = playerState.previewBtn.closest('.card')?.querySelector('.play-bar-fill');
  if (fill)
    fill.style.width =
      `${(playerState.previewAudio.currentTime / playerState.previewAudio.duration * 100).toFixed(1)}%`;
});

playerState.previewAudio.addEventListener('ended', () => {
  if (playerState.previewBtn) {
    playerState.previewBtn.textContent = '▶';
    playerState.previewBtn.classList.remove('playing');
    const fill = playerState.previewBtn.closest('.card')?.querySelector('.play-bar-fill');
    if (fill) fill.style.width = '0%';
    playerState.previewBtn = null;
  }
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden && !playerState.previewAudio.paused) {
    playerState.previewAudio.pause();
    if (playerState.previewBtn) {
      playerState.previewBtn.textContent = '▶';
      playerState.previewBtn.classList.remove('playing');
    }
  }
});

// ── Plex Web Player (lokale browser playback) ──────────────────────────────
/**
 * Speel een stream af in de lokale web browser.
 * Gebruikt voor '__web__' client playback.
 * @param {string} streamUrl - URL van de audio stream
 * @returns {Promise<void>}
 */
export async function playWebStream(streamUrl) {
  try {
    // Stop vorige track
    if (!playerState.webPlayerAudio.paused) {
      playerState.webPlayerAudio.pause();
      playerState.webPlayerAudio.currentTime = 0;
    }

    // Speel nieuwe stream
    playerState.webPlayerAudio.src = streamUrl;
    playerState.webPlayerAudio.currentTime = 0;
    await playerState.webPlayerAudio.play();
    playerState.webPlayerActive = true;
  } catch (e) {
    console.error('[Web Player] Afspelen mislukt:', e);
    throw e;
  }
}

/**
 * Pauzeer/hervat web player.
 */
export function pauseWebPlayer() {
  if (!playerState.webPlayerActive) return;
  if (playerState.webPlayerAudio.paused) {
    playerState.webPlayerAudio.play();
  } else {
    playerState.webPlayerAudio.pause();
  }
}

/**
 * Stop web player.
 */
export function stopWebPlayer() {
  playerState.webPlayerAudio.pause();
  playerState.webPlayerAudio.currentTime = 0;
  playerState.webPlayerActive = false;
}

// ── Player Bar Controller ──────────────────────────────────────────────────
/**
 * Initialiseer de player bar controls en SSE stream listener.
 * Roep aan vanuit main.js tijdens app-startup.
 */
export function initPlayer() {
  const playBtn = document.getElementById('player-play');
  const prevBtn = document.getElementById('player-prev');
  const nextBtn = document.getElementById('player-next');
  const volumeSlider = document.getElementById('player-volume');
  const progressBar = document.getElementById('player-progress');
  const progressFill = document.getElementById('player-progress-fill');
  const timeCurrent = document.getElementById('player-time-current');
  const timeTotal = document.getElementById('player-time-total');
  const titleEl = document.getElementById('player-title');
  const artistEl = document.getElementById('player-artist');

  if (!playBtn) {
    console.warn('[Player] Player bar elementen niet gevonden');
    return;
  }

  // ── Play/Pause button ──────────────────────────────────────────
  playBtn?.addEventListener('click', async () => {
    const zone = getSelectedZone();
    if (!zone) {
      console.warn('[Player] No zone selected');
      return;
    }

    // Web player
    if (zone.machineId === '__web__') {
      pauseWebPlayer();
      // Toggle button text
      if (playBtn.textContent === '▶') {
        playBtn.textContent = '⏸';
      } else {
        playBtn.textContent = '▶';
      }
    } else {
      // Remote Plex client
      await pauseZone();
    }
  });

  // ── Next/Prev buttons ──────────────────────────────────────────
  nextBtn?.addEventListener('click', async () => {
    const zone = getSelectedZone();
    if (!zone) return;

    // Web player: skip not yet implemented
    if (zone.machineId === '__web__') {
      // TODO: Implement web queue/skip when queue management is added
      return;
    }

    // Remote Plex client
    await skipZone('next');
  });

  prevBtn?.addEventListener('click', async () => {
    const zone = getSelectedZone();
    if (!zone) return;

    // Web player: skip not yet implemented
    if (zone.machineId === '__web__') {
      // TODO: Implement web queue/skip when queue management is added
      return;
    }

    // Remote Plex client
    await skipZone('prev');
  });

  // ── Volume control ────────────────────────────────────────────
  volumeSlider?.addEventListener('input', (e) => {
    const zone = getSelectedZone();
    const volume = parseInt(e.target.value);

    if (zone?.machineId === '__web__') {
      // Set web player volume (0-100 scale)
      playerState.webPlayerAudio.volume = volume / 100;
    } else {
      // Remote Plex clients: volume control is unreliable, skip for now
      // TODO: Implement volume control when reliability improves
    }
  });

  // ── Progress bar seeking ───────────────────────────────────────
  progressBar?.addEventListener('click', (e) => {
    const zone = getSelectedZone();
    if (!zone) return;

    const rect = progressBar.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;

    if (zone.machineId === '__web__') {
      // Web player: seek if duration is known
      if (playerState.webPlayerAudio.duration) {
        playerState.webPlayerAudio.currentTime = percent * playerState.webPlayerAudio.duration;
      }
    } else {
      // Remote Plex clients: seeking not yet implemented
      // TODO: Implement remote seeking when available
    }
  });

  // ── SSE Stream listener ────────────────────────────────────────
  playerState.sseEventSource = new EventSource('/api/plex/stream');

  playerState.sseEventSource.addEventListener('plex', (event) => {
    try {
      const data = JSON.parse(event.data);

      // Update track title and artist
      if (titleEl) titleEl.textContent = data.track || 'Niet aan het afspelen';
      if (artistEl) artistEl.textContent = data.artist || '';

      // Update duration if available
      if (data.duration) playerState.totalDuration = data.duration / 1000; // ms to seconds

      // Update play button visual state
      if (playBtn) {
        if (data.state === 'paused') {
          playBtn.textContent = '▶';
        } else if (data.playing) {
          playBtn.textContent = '⏸';
        } else if (data.stopped) {
          playBtn.textContent = '▶';
        }
      }

      // Update progress if viewOffset is available
      if (data.viewOffset !== undefined && data.viewOffset !== null) {
        const offset = data.viewOffset / 1000; // ms to seconds
        playerState.currentTime = offset;

        if (progressFill && playerState.totalDuration) {
          const percent = (offset / playerState.totalDuration * 100).toFixed(1);
          progressFill.style.width = percent + '%';
        }

        if (timeCurrent) {
          timeCurrent.textContent = _formatTime(offset);
        }
        if (timeTotal && playerState.totalDuration) {
          timeTotal.textContent = _formatTime(playerState.totalDuration);
        }

        // Update progress bar aria-valuenow
        if (progressBar && playerState.totalDuration) {
          progressBar.setAttribute('aria-valuenow', Math.round((offset / playerState.totalDuration) * 100));
        }
      }

      // Update album art if available
      const artEl = document.getElementById('player-art');
      if (artEl && data.thumb) {
        artEl.src = data.thumb;
      }
    } catch (e) {
      console.error('[Player] SSE parse error:', e);
    }
  });

  playerState.sseEventSource.addEventListener('error', (event) => {
    console.error('[Player] SSE connection error:', event);
    // Optioneel: automatic reconnect logic hier
  });

  // ── Web Player Audio Events ────────────────────────────────────
  playerState.webPlayerAudio.addEventListener('timeupdate', () => {
    const { currentTime, duration } = playerState.webPlayerAudio;
    if (!duration) return;

    // Update progress bar
    if (progressFill) {
      const percent = (currentTime / duration * 100).toFixed(1);
      progressFill.style.width = percent + '%';
    }

    // Update time displays
    if (timeCurrent) {
      timeCurrent.textContent = _formatTime(currentTime);
    }
    if (timeTotal) {
      timeTotal.textContent = _formatTime(duration);
    }

    // Update progress bar aria-valuenow
    if (progressBar) {
      progressBar.setAttribute('aria-valuenow', Math.round((currentTime / duration) * 100));
    }
  });

  playerState.webPlayerAudio.addEventListener('ended', () => {
    // Reset progress
    if (progressFill) progressFill.style.width = '0%';
    if (timeCurrent) timeCurrent.textContent = '0:00';
    if (timeTotal) timeTotal.textContent = '0:00';
    if (progressBar) progressBar.setAttribute('aria-valuenow', 0);

    // Reset play button
    if (playBtn) playBtn.textContent = '▶';
  });

  // ── Progress ticker (polling fallback) ──────────────────────
  // Only poll if SSE connection is not open (10 second interval)
  setInterval(async () => {
    // Only poll if SSE is not connected
    if (playerState.sseEventSource?.readyState === EventSource.OPEN) {
      return;
    }

    try {
      const np = await fetch('/api/plex/nowplaying').then(r => r.json());
      if (!np) return;

      if (titleEl) titleEl.textContent = np.track || 'Niet aan het afspelen';
      if (artistEl) artistEl.textContent = np.artist || '';
      if (np.duration) playerState.totalDuration = np.duration / 1000;

      if (playBtn) {
        playBtn.textContent = np.playing ? '⏸' : '▶';
      }

      const offset = (np.viewOffset || 0) / 1000;
      playerState.currentTime = offset;

      if (progressFill && playerState.totalDuration) {
        const percent = (offset / playerState.totalDuration * 100).toFixed(1);
        progressFill.style.width = percent + '%';
      }

      if (timeCurrent) timeCurrent.textContent = _formatTime(offset);
      if (timeTotal && playerState.totalDuration) timeTotal.textContent = _formatTime(playerState.totalDuration);

      if (progressBar && playerState.totalDuration) {
        progressBar.setAttribute('aria-valuenow', Math.round((offset / playerState.totalDuration) * 100));
      }
    } catch (e) {
      // noop - SSE zal dit afhandelen
    }
  }, 10000);

  console.log('[Player] Initialized');
}

/** Format seconds to mm:ss */
function _formatTime(seconds) {
  if (!Number.isFinite(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Voeg state properties toe voor SSE
playerState.totalDuration = 0;
playerState.currentTime = 0;
playerState.sseEventSource = null;
