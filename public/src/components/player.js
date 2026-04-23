// ── Audio preview ─────────────────────────────────────────────────────────
import { state } from '../state.js';
import { apiFetch } from '../api.js';

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
    try {
      const res = await fetch('/api/plex/playback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'playpause' }),
      });
      if (!res.ok) console.warn('[Player] Play/pause failed');
    } catch (e) {
      console.error('[Player] Play/pause error:', e);
    }
  });

  // ── Next/Prev buttons ──────────────────────────────────────────
  nextBtn?.addEventListener('click', async () => {
    try {
      const res = await fetch('/api/plex/playback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'skip', direction: 'next' }),
      });
      if (!res.ok) console.warn('[Player] Skip next failed');
    } catch (e) {
      console.error('[Player] Skip next error:', e);
    }
  });

  prevBtn?.addEventListener('click', async () => {
    try {
      const res = await fetch('/api/plex/playback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'skip', direction: 'prev' }),
      });
      if (!res.ok) console.warn('[Player] Skip prev failed');
    } catch (e) {
      console.error('[Player] Skip prev error:', e);
    }
  });

  // ── Volume control ────────────────────────────────────────────
  volumeSlider?.addEventListener('input', async (e) => {
    const volume = parseInt(e.target.value);
    try {
      await fetch('/api/plex/playback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'setVolume', volume }),
      });
    } catch (e) {
      console.error('[Player] Volume error:', e);
    }
  });

  // ── Progress bar seeking ───────────────────────────────────────
  progressBar?.addEventListener('click', async (e) => {
    if (!playerState.totalDuration) return;
    const rect = progressBar.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const seconds = percent * playerState.totalDuration;
    try {
      await fetch('/api/plex/playback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'seek', offset: Math.floor(seconds * 1000) }),
      });
    } catch (e) {
      console.error('[Player] Seek error:', e);
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
