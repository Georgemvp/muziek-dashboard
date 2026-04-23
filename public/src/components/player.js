// ── Audio preview ─────────────────────────────────────────────────────────
import { state } from '../state.js';
import { apiFetch } from '../api.js';
import { getSelectedZone, pauseZone, skipZone } from './plexRemote.js';

// ── SVG Icon Strings (Feather/Lucide style) ────────────────────────────────
const PLAY_SVG = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
const PAUSE_SVG = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';

export const playerState = {
  previewAudio: new Audio(),
  previewBtn: null,
  webPlayerAudio: new Audio(),  // Voor Plex web playback
  webPlayerActive: false,
  // Queue properties for web player
  queue: [],            // Array of {ratingKey, title, artist, album, thumb, duration}
  queueIndex: -1,       // Current position in queue
  isWebPlaying: false,
};
state.playerState = playerState;

export async function playPreview(btn, artist, track) {
  // Zelfde knop → toggle play/pauze
  if (playerState.previewBtn === btn) {
    if (playerState.previewAudio.paused) {
      await playerState.previewAudio.play();
      btn.innerHTML = PAUSE_SVG;
      btn.classList.add('playing');
    } else {
      playerState.previewAudio.pause();
      btn.innerHTML = PLAY_SVG;
      btn.classList.remove('playing');
    }
    return;
  }

  // Stop vorige track
  if (playerState.previewBtn) {
    playerState.previewAudio.pause();
    playerState.previewBtn.innerHTML = PLAY_SVG;
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
      setTimeout(() => { if (btn.textContent === '—') btn.innerHTML = PLAY_SVG; }, 1800);
      playerState.previewBtn = null;
      return;
    }
    playerState.previewAudio.src = data.preview;
    playerState.previewAudio.currentTime = 0;
    await playerState.previewAudio.play();
    btn.innerHTML = PAUSE_SVG;
    btn.disabled = false;
    btn.classList.add('playing');
  } catch {
    btn.innerHTML = PLAY_SVG;
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
    playerState.previewBtn.innerHTML = PLAY_SVG;
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
      playerState.previewBtn.innerHTML = PLAY_SVG;
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
    console.debug('[Web Player] Setting stream:', streamUrl);

    // Stop vorige track
    if (!playerState.webPlayerAudio.paused) {
      playerState.webPlayerAudio.pause();
      playerState.webPlayerAudio.currentTime = 0;
    }

    // Speel nieuwe stream
    playerState.webPlayerAudio.src = streamUrl;
    playerState.webPlayerAudio.currentTime = 0;

    console.debug('[Web Player] Audio element src set, waiting for data to load...');

    // Wacht tot het audio element data begint te laden
    return new Promise((resolve, reject) => {
      const onCanPlay = async () => {
        try {
          cleanup();
          console.debug('[Web Player] Audio loaded, starting playback...');
          await playerState.webPlayerAudio.play();
          console.info('[Web Player] Playback started successfully');
          playerState.webPlayerActive = true;
          resolve();
        } catch (e) {
          if (e.name !== 'AbortError') {
            console.error('[Web Player] Play failed after load:', e);
            reject(e);
          } else {
            resolve(); // AbortError is expected when switching tracks
          }
        }
      };

      const onError = (e) => {
        cleanup();
        console.error('[Web Player] Audio load error:', e);
        reject(new Error(`Audio load error: ${playerState.webPlayerAudio.error?.message || 'Unknown'}`));
      };

      const cleanup = () => {
        playerState.webPlayerAudio.removeEventListener('canplay', onCanPlay);
        playerState.webPlayerAudio.removeEventListener('error', onError);
      };

      // Timeout na 10 seconden
      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error('Audio load timeout'));
      }, 10000);

      const originalResolve = resolve;
      resolve = (...args) => {
        clearTimeout(timeout);
        originalResolve(...args);
      };

      playerState.webPlayerAudio.addEventListener('canplay', onCanPlay, { once: true });
      playerState.webPlayerAudio.addEventListener('error', onError, { once: true });

      console.debug('[Web Player] Waiting for canplay event...');
    });
  } catch (e) {
    // Ignore AbortError - happens when user clicks another track while loading
    if (e.name === 'AbortError') {
      console.debug('[Web Player] Playback interrupted (user clicked another track)');
      return;
    }
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

/**
 * Play a queue of tracks on the web player.
 * @param {Array} tracks - Array of track objects: {ratingKey, title, artist, album, thumb, duration}
 * @param {number} startIndex - Starting index in the queue (default 0)
 */
export async function playQueue(tracks, startIndex = 0) {
  playerState.queue = tracks;
  playerState.queueIndex = startIndex;
  await _playTrackAtIndex(startIndex);
  renderQueue();
}

/**
 * Render the play queue panel with current queue tracks.
 * Highlights active track and allows clicking to jump to any track.
 */
export function renderQueue() {
  const listEl = document.getElementById('pq-list');
  if (!listEl) return;

  // Clear existing items
  listEl.innerHTML = '';

  // Empty queue
  if (playerState.queue.length === 0) {
    listEl.innerHTML = '<div style="padding: 20px 16px; text-align: center; color: var(--text-muted); font-size: 13px;">Wachtrij is leeg</div>';
    return;
  }

  // Render tracks
  playerState.queue.forEach((track, index) => {
    const isActive = index === playerState.queueIndex;
    const li = document.createElement('li');
    li.className = `pq-track${isActive ? ' active' : ''}`;
    li.role = 'listitem';

    const trackNum = document.createElement('div');
    trackNum.className = 'pq-track-num';
    trackNum.textContent = (index + 1).toString().padStart(2, '0');

    const trackInfo = document.createElement('div');
    trackInfo.className = 'pq-track-info';

    const trackTitle = document.createElement('div');
    trackTitle.className = 'pq-track-title';
    trackTitle.textContent = track.title || 'Onbekend nummer';
    trackTitle.title = track.title || 'Onbekend nummer';

    const trackArtist = document.createElement('div');
    trackArtist.className = 'pq-track-artist';
    trackArtist.textContent = track.artist || '';
    trackArtist.title = track.artist || '';

    trackInfo.appendChild(trackTitle);
    trackInfo.appendChild(trackArtist);

    li.appendChild(trackNum);
    li.appendChild(trackInfo);

    // Click to play track
    li.addEventListener('click', async () => {
      await _playTrackAtIndex(index);
    });

    listEl.appendChild(li);
  });
}

/**
 * Internal function: Play track at given queue index.
 * @param {number} index - Index in playerState.queue
 * @private
 */
async function _playTrackAtIndex(index) {
  // Bounds check
  if (index < 0 || index >= playerState.queue.length) {
    stopWebPlayer();
    playerState.isWebPlaying = false;
    return;
  }

  playerState.queueIndex = index;
  const track = playerState.queue[index];

  try {
    console.debug('[Queue] Playing track at index', index, ':', {
      ratingKey: track.ratingKey,
      title: track.title,
      artist: track.artist,
      duration: track.duration,
    });

    // Request playback stream from server
    const res = await fetch('/api/plex/play', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        machineId: '__web__',
        ratingKey: track.ratingKey,
      }),
    });
    const data = await res.json();

    if (!res.ok || !data.ok) {
      console.error('[Queue] Track play failed:', { status: res.status, error: data.error });
      throw new Error(data.error || 'Afspelen mislukt');
    }

    // Start playback
    console.debug('[Queue] Stream URL:', data.webStream);
    await playWebStream(data.webStream);

    // Update player bar UI
    const titleEl = document.getElementById('player-title');
    const artistEl = document.getElementById('player-artist');
    const artEl = document.getElementById('player-art');
    const playBtn = document.getElementById('player-play');

    if (titleEl) titleEl.textContent = track.title;
    if (artistEl) artistEl.textContent = track.artist;
    if (artEl && (track.thumb || data.thumb)) {
      artEl.src = track.thumb || data.thumb;
    }
    if (playBtn) playBtn.innerHTML = PAUSE_SVG;

    playerState.isWebPlaying = true;
    renderQueue();
  } catch (e) {
    // Ignore AbortError - user clicked another track while loading
    if (e.name === 'AbortError') {
      console.debug('[Queue] Playback interrupted at index', index);
      return;
    }
    console.error('[Queue] Error playing track at index', index, ':', e);
    playerState.isWebPlaying = false;
  }
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
      // Toggle button SVG
      if (playBtn.innerHTML.includes('polygon')) {
        playBtn.innerHTML = PAUSE_SVG;
      } else {
        playBtn.innerHTML = PLAY_SVG;
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

    // Web player: play next track in queue
    if (zone.machineId === '__web__') {
      if (playerState.queue.length > 0) {
        await _playTrackAtIndex(playerState.queueIndex + 1);
      }
      return;
    }

    // Remote Plex client
    await skipZone('next');
  });

  prevBtn?.addEventListener('click', async () => {
    const zone = getSelectedZone();
    if (!zone) return;

    // Web player: restart current or play previous track
    if (zone.machineId === '__web__') {
      if (playerState.queue.length > 0) {
        // If more than 3 seconds into track, restart it
        if (playerState.webPlayerAudio.currentTime > 3) {
          playerState.webPlayerAudio.currentTime = 0;
        } else {
          // Otherwise play previous track
          await _playTrackAtIndex(playerState.queueIndex - 1);
        }
      }
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

  // ── Queue panel toggle ──────────────────────────────────────────
  const queueBtn = document.getElementById('player-queue-btn');
  const queuePanel = document.getElementById('play-queue-panel');
  const queueCloseBtn = document.getElementById('pq-close');

  queueBtn?.addEventListener('click', () => {
    if (queuePanel) {
      const isVisible = queuePanel.style.display !== 'none';
      queuePanel.style.display = isVisible ? 'none' : '';
    }
  });

  queueCloseBtn?.addEventListener('click', () => {
    if (queuePanel) {
      queuePanel.style.display = 'none';
    }
  });

  // Close queue panel when clicking outside
  document.addEventListener('click', (e) => {
    if (queuePanel && queuePanel.style.display !== 'none') {
      if (!queuePanel.contains(e.target) && !queueBtn?.contains(e.target)) {
        queuePanel.style.display = 'none';
      }
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
          playBtn.innerHTML = PLAY_SVG;
        } else if (data.playing) {
          playBtn.innerHTML = PAUSE_SVG;
        } else if (data.stopped) {
          playBtn.innerHTML = PLAY_SVG;
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

  playerState.webPlayerAudio.addEventListener('ended', async () => {
    // Auto-play next track in queue if available
    if (playerState.queue.length > 0 && playerState.queueIndex < playerState.queue.length - 1) {
      await _playTrackAtIndex(playerState.queueIndex + 1);
    } else {
      // Queue finished or no queue - reset player
      if (progressFill) progressFill.style.width = '0%';
      if (timeCurrent) timeCurrent.textContent = '0:00';
      if (timeTotal) timeTotal.textContent = '0:00';
      if (progressBar) progressBar.setAttribute('aria-valuenow', 0);

      // Reset play button
      if (playBtn) playBtn.innerHTML = PLAY_SVG;
      playerState.isWebPlaying = false;
      renderQueue();
    }
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
        playBtn.innerHTML = np.playing ? PAUSE_SVG : PLAY_SVG;
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
