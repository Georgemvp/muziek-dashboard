// ── Audio preview ─────────────────────────────────────────────────────────
import { state } from '../state.js';
import { apiFetch } from '../api.js';
import { getSelectedZone, pauseZone, skipZone } from './plexRemote.js';
import { setAmbientBackground, initAmbient } from './ambient.js';
import { queueManager } from '../modules/queueManager.js';

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
  // Also update queueManager to keep them in sync
  queueManager.setQueue(tracks, startIndex);
  await _playTrackAtIndex(startIndex);
  renderQueue();
}

/**
 * Render the play queue panel with current queue tracks.
 * Highlights active track and allows clicking to jump to any track.
 * Supports drag-and-drop reordering.
 */
export function renderQueue() {
  const listEl = document.getElementById('pq-list');
  const queueBtn = document.getElementById('player-queue-btn');
  const queueBadge = document.getElementById('queue-badge');

  if (!listEl) return;

  // Update queue badge
  if (queueBadge) {
    if (playerState.queue.length > 0) {
      queueBadge.textContent = playerState.queue.length;
      queueBadge.style.display = '';
    } else {
      queueBadge.style.display = 'none';
    }
  }

  // Clear existing items
  listEl.innerHTML = '';

  // Empty queue
  if (playerState.queue.length === 0) {
    listEl.innerHTML = '<div style="padding: 20px 16px; text-align: center; color: var(--text-muted); font-size: 13px;">Voeg nummers toe aan je wachtrij</div>';
    return;
  }

  // Render tracks
  const currentIndex = queueManager.getCurrentIndex();
  playerState.queue.forEach((track, index) => {
    const isActive = index === currentIndex;
    const li = document.createElement('li');
    li.className = `pq-track${isActive ? ' active' : ''}`;
    li.role = 'listitem';
    li.draggable = true;
    li.dataset.queueIndex = index;

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

    // Remove button
    const removeBtn = document.createElement('button');
    removeBtn.className = 'pq-remove-btn';
    removeBtn.setAttribute('aria-label', `Verwijder ${track.title}`);
    removeBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      playerState.queue.splice(index, 1);
      if (playerState.queueIndex >= index && playerState.queueIndex > 0) {
        playerState.queueIndex--;
      }
      renderQueue();
    });

    li.appendChild(trackNum);
    li.appendChild(trackInfo);
    li.appendChild(removeBtn);

    // Click to play track
    li.addEventListener('click', async () => {
      await _playTrackAtIndex(index);
    });

    // Drag and drop
    li.addEventListener('dragstart', (e) => {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', index);
      li.classList.add('dragging');
    });

    li.addEventListener('dragend', () => {
      li.classList.remove('dragging');
    });

    li.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      li.classList.add('drag-over');
    });

    li.addEventListener('dragleave', () => {
      li.classList.remove('drag-over');
    });

    li.addEventListener('drop', (e) => {
      e.preventDefault();
      li.classList.remove('drag-over');
      const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
      const toIndex = index;
      if (fromIndex !== toIndex) {
        const [track] = playerState.queue.splice(fromIndex, 1);
        playerState.queue.splice(toIndex, 0, track);
        renderQueue();
      }
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
  // Bounds check - use queueManager as source of truth
  const queue = queueManager.getQueue();
  if (index < 0 || index >= queue.length) {
    stopWebPlayer();
    playerState.isWebPlaying = false;
    return;
  }

  playerState.queueIndex = index;
  const track = queue[index];

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
      const artUrl = track.thumb || data.thumb;
      artEl.src = artUrl;
      // Update ambient background
      await setAmbientBackground(artUrl);
    }
    if (playBtn) playBtn.innerHTML = PAUSE_SVG;

    // Add to recently played
    queueManager.addToRecent(track);

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

// ── Remote Playback Helpers ────────────────────────────────────────────────

/** Start een interval dat de progressie 1 seconde per seconde vooruit tikt voor remote playback. */
function _startRemoteProgressTicker() {
  _stopRemoteProgressTicker();
  playerState.remoteProgressTicker = setInterval(() => {
    // Stop als de web player actief is of de remote sessie niet meer speelt
    if (playerState.isWebPlaying && !playerState.webPlayerAudio.paused) {
      _stopRemoteProgressTicker();
      return;
    }
    if (!playerState.activeRemote || playerState.activeRemote.state !== 'playing') {
      _stopRemoteProgressTicker();
      return;
    }
    playerState.currentTime += 1;
    if (playerState.totalDuration && playerState.currentTime >= playerState.totalDuration) {
      playerState.currentTime = playerState.totalDuration;
      _stopRemoteProgressTicker();
    }
    _updateProgressUI(playerState.currentTime);
  }, 1000);
}

/** Stop het progress ticker interval. */
function _stopRemoteProgressTicker() {
  if (playerState.remoteProgressTicker) {
    clearInterval(playerState.remoteProgressTicker);
    playerState.remoteProgressTicker = null;
  }
}

/** Werk de progress bar en tijd-labels bij op basis van currentTime (in seconden). */
function _updateProgressUI(currentTime) {
  const progressFill = document.getElementById('player-progress-fill');
  const progressBar  = document.getElementById('player-progress');
  const timeCurrent  = document.getElementById('player-time-current');
  const timeTotal    = document.getElementById('player-time-total');

  if (progressFill && playerState.totalDuration) {
    progressFill.style.width = (currentTime / playerState.totalDuration * 100).toFixed(1) + '%';
  }
  if (timeCurrent) timeCurrent.textContent = _formatTime(currentTime);
  if (timeTotal && playerState.totalDuration) timeTotal.textContent = _formatTime(playerState.totalDuration);
  if (progressBar && playerState.totalDuration) {
    progressBar.setAttribute('aria-valuenow', Math.round((currentTime / playerState.totalDuration) * 100));
  }
}

/**
 * Haal de remote Plex wachtrij op en render deze in het queue panel.
 * Wordt aangeroepen als er geen web-queue is maar wel een actieve remote sessie.
 */
async function fetchAndRenderRemoteQueue() {
  const listEl    = document.getElementById('pq-list');
  const queueBadge = document.getElementById('queue-badge');
  if (!listEl) return;

  listEl.innerHTML = '<div style="padding: 20px 16px; text-align: center; color: var(--text-muted); font-size: 13px;">Wachtrij ophalen…</div>';

  try {
    const machineId = playerState.activeRemote?.machineId;
    const url = machineId
      ? `/api/plex/remotequeue?machineId=${encodeURIComponent(machineId)}`
      : '/api/plex/remotequeue';

    const data = await fetch(url).then(r => r.json());
    const tracks = data.tracks || [];
    const currentRatingKey = data.currentRatingKey || playerState.activeRemote?.ratingKey;

    playerState.remoteQueueTracks = tracks;

    if (tracks.length === 0) {
      listEl.innerHTML = '<div style="padding: 20px 16px; text-align: center; color: var(--text-muted); font-size: 13px;">Geen wachtrij beschikbaar</div>';
      return;
    }

    // Badge bijwerken
    if (queueBadge) {
      queueBadge.textContent = tracks.length;
      queueBadge.style.display = '';
    }

    listEl.innerHTML = '';
    let activeEl = null;

    tracks.forEach((track, index) => {
      const isActive = String(track.ratingKey) === String(currentRatingKey);
      const li = document.createElement('li');
      li.className = `pq-track${isActive ? ' active' : ''}`;
      li.role = 'listitem';
      if (isActive) activeEl = li;

      const trackNum = document.createElement('div');
      trackNum.className = 'pq-track-num';
      trackNum.textContent = isActive ? '▶' : (index + 1).toString().padStart(2, '0');

      const trackInfo = document.createElement('div');
      trackInfo.className = 'pq-track-info';

      const trackTitle = document.createElement('div');
      trackTitle.className = 'pq-track-title';
      trackTitle.textContent = track.title || 'Onbekend nummer';
      trackTitle.title = track.title || 'Onbekend nummer';

      const trackArtist = document.createElement('div');
      trackArtist.className = 'pq-track-artist';
      trackArtist.textContent = track.artist || '';

      trackInfo.appendChild(trackTitle);
      trackInfo.appendChild(trackArtist);
      li.appendChild(trackNum);
      li.appendChild(trackInfo);
      listEl.appendChild(li);
    });

    // Scroll naar het actieve nummer
    if (activeEl) {
      setTimeout(() => activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
    }
  } catch {
    listEl.innerHTML = '<div style="padding: 20px 16px; text-align: center; color: var(--text-muted); font-size: 13px;">Wachtrij ophalen mislukt</div>';
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

  // Initialize ambient background module
  initAmbient();

  // ── Play/Pause button ──────────────────────────────────────────
  playBtn?.addEventListener('click', async () => {
    const zone = getSelectedZone();

    // Web player (via zone picker)
    if (zone?.machineId === '__web__') {
      pauseWebPlayer();
      playBtn.innerHTML = playerState.webPlayerAudio.paused ? PLAY_SVG : PAUSE_SVG;
      return;
    }

    // Geselecteerde remote zone via zone picker
    if (zone?.machineId) {
      await pauseZone();
      return;
    }

    // Geen zone geselecteerd → gebruik de actief spelende remote sessie (bijv. WiiM Pro)
    const remoteMachineId = playerState.activeRemote?.machineId;
    if (!remoteMachineId) {
      console.warn('[Player] Geen zone of actieve remote sessie gevonden');
      return;
    }

    await fetch('/api/plex/pause', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ machineId: remoteMachineId }),
    }).catch(e => console.warn('[Player] Remote pause fout:', e));
    // De SSE event zal de knop-staat bijwerken zodra Plex antwoordt
  });

  // ── Next/Prev buttons ──────────────────────────────────────────
  nextBtn?.addEventListener('click', async () => {
    const zone = getSelectedZone();

    // Web player via zone picker
    if (zone?.machineId === '__web__') {
      const queue = queueManager.getQueue();
      if (queue.length > 0) {
        const nextIdx = queueManager.getNextIndex();
        if (nextIdx >= 0) {
          await _playTrackAtIndex(nextIdx);
          queueManager.setCurrentIndex(nextIdx);
        }
      }
      return;
    }

    // Geselecteerde remote zone
    if (zone?.machineId) {
      await skipZone('next');
      return;
    }

    // Geen zone → gebruik actieve remote sessie
    const remoteMachineId = playerState.activeRemote?.machineId;
    if (!remoteMachineId) return;

    await fetch('/api/plex/skip', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ machineId: remoteMachineId, direction: 'next' }),
    }).catch(e => console.warn('[Player] Remote skip next fout:', e));
  });

  prevBtn?.addEventListener('click', async () => {
    const zone = getSelectedZone();

    // Web player via zone picker
    if (zone?.machineId === '__web__') {
      const queue = queueManager.getQueue();
      if (queue.length > 0) {
        if (playerState.webPlayerAudio.currentTime > 3) {
          playerState.webPlayerAudio.currentTime = 0;
        } else {
          const prevIdx = queueManager.getPrevIndex();
          if (prevIdx >= 0) {
            await _playTrackAtIndex(prevIdx);
            queueManager.setCurrentIndex(prevIdx);
          }
        }
      }
      return;
    }

    // Geselecteerde remote zone
    if (zone?.machineId) {
      await skipZone('prev');
      return;
    }

    // Geen zone → gebruik actieve remote sessie
    const remoteMachineId = playerState.activeRemote?.machineId;
    if (!remoteMachineId) return;

    await fetch('/api/plex/skip', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ machineId: remoteMachineId, direction: 'prev' }),
    }).catch(e => console.warn('[Player] Remote skip prev fout:', e));
  });

  // ── Volume control ────────────────────────────────────────────
  volumeSlider?.addEventListener('input', (e) => {
    const zone = getSelectedZone();
    const volume = parseInt(e.target.value);

    // Update volume display number
    const volumeNumber = document.getElementById('player-volume-number');
    if (volumeNumber) {
      volumeNumber.textContent = volume;
    }

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
  const queueClearBtn = document.getElementById('pq-clear');

  queueBtn?.addEventListener('click', async () => {
    if (!queuePanel) return;
    const isVisible = queuePanel.style.display !== 'none';
    if (isVisible) {
      queuePanel.style.display = 'none';
      return;
    }
    queuePanel.style.display = '';

    if (playerState.queue.length > 0) {
      // Web player queue: bestaand gedrag
      renderQueue();
    } else if (playerState.activeRemote?.machineId && playerState.activeRemote.state !== 'stopped') {
      // Remote sessie actief: haal wachtrij op van Plex
      await fetchAndRenderRemoteQueue();
    } else {
      // Leeg
      renderQueue();
    }
  });

  queueCloseBtn?.addEventListener('click', () => {
    if (queuePanel) {
      queuePanel.style.display = 'none';
    }
  });

  queueClearBtn?.addEventListener('click', () => {
    if (confirm('Wachtrij wissen?')) {
      playerState.queue = [];
      playerState.queueIndex = -1;
      renderQueue();
      stopWebPlayer();
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

      // Sla actieve remote sessie altijd op (ook bij stop-events)
      playerState.activeRemote = {
        machineId:      data.machineId      || playerState.activeRemote?.machineId      || null,
        playerName:     data.playerName     || playerState.activeRemote?.playerName     || null,
        state:          data.state          || 'stopped',
        ratingKey:      data.ratingKey      || playerState.activeRemote?.ratingKey      || null,
        albumRatingKey: data.albumRatingKey  || playerState.activeRemote?.albumRatingKey || null,
      };

      // Werk play-knop altijd bij op basis van staat
      if (playBtn) {
        playBtn.innerHTML = (data.state === 'playing') ? PAUSE_SVG : PLAY_SVG;
      }

      if (data.stopped || data.state === 'stopped') {
        // Stop-event: ticker stoppen, progressie resetten, niets verder updaten
        _stopRemoteProgressTicker();
        playerState.currentTime = 0;
        _updateProgressUI(0);
        // Zone naam terugzetten als geen zone geselecteerd
        if (!getSelectedZone()) {
          const zn = document.getElementById('plex-zone-name-player');
          if (zn) zn.textContent = data.playerName || '—';
        }
        return;
      }

      // Onderdruk SSE updates als de lokale web player actief aan het spelen is
      if (playerState.isWebPlaying && !playerState.webPlayerAudio.paused) return;

      // Track info
      if (titleEl) titleEl.textContent = data.track  || '—';
      if (artistEl) artistEl.textContent = data.artist || '';

      // Duur (ms → seconden)
      if (data.duration) playerState.totalDuration = data.duration / 1000;

      // Voortgang vanuit viewOffset
      if (data.viewOffset != null) {
        const offset = data.viewOffset / 1000;
        playerState.currentTime = offset;
        _updateProgressUI(offset);
      }

      // Progress ticker starten/stoppen
      if (data.state === 'playing') {
        _startRemoteProgressTicker();
      } else {
        _stopRemoteProgressTicker();
      }

      // Album art — proxy via /api/img zodat het altijd bereikbaar is ongeacht
      // of de browser de interne Plex URL rechtstreeks kan bereiken.
      const artEl = document.getElementById('player-art');
      if (artEl) {
        if (data.thumb) {
          const proxied = `/api/img?url=${encodeURIComponent(data.thumb)}&w=200`;
          // Alleen bijwerken als de art veranderd is (voorkomt onnodige reloads)
          if (artEl.dataset.lastThumb !== data.thumb) {
            artEl.dataset.lastThumb = data.thumb;
            artEl.src = proxied;
            setAmbientBackground(proxied);
          }
        } else {
          artEl.src = '';
          artEl.dataset.lastThumb = '';
          setAmbientBackground(null);
        }
      }

      // Zone naam in de player bar bijwerken als er geen zone handmatig geselecteerd is
      if (!getSelectedZone() && data.playerName) {
        const zoneNamePlayer = document.getElementById('plex-zone-name-player');
        if (zoneNamePlayer) zoneNamePlayer.textContent = data.playerName;
        const zoneNameHeader = document.getElementById('plex-zone-name');
        if (zoneNameHeader) zoneNameHeader.textContent = data.playerName;
      }
    } catch (e) {
      console.error('[Player] SSE parse error:', e);
    }
  });

  playerState.sseEventSource.addEventListener('error', () => {
    // EventSource herverbindt automatisch; logging is voldoende
    console.warn('[Player] SSE verbinding verbroken, wacht op herverbinding…');
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
    const queue = queueManager.getQueue();
    if (queue.length > 0) {
      const nextIdx = queueManager.getNextIndex();
      if (nextIdx >= 0) {
        await _playTrackAtIndex(nextIdx);
        queueManager.setCurrentIndex(nextIdx);
      } else {
        // Queue finished - reset player
        if (progressFill) progressFill.style.width = '0%';
        if (timeCurrent) timeCurrent.textContent = '0:00';
        if (timeTotal) timeTotal.textContent = '0:00';
        if (progressBar) progressBar.setAttribute('aria-valuenow', 0);

        // Reset play button
        if (playBtn) playBtn.innerHTML = PLAY_SVG;
        playerState.isWebPlaying = false;

        // Remove ambient background when playback ends
        setAmbientBackground(null);

        renderQueue();
      }
    } else {
      // No queue - reset player
      if (progressFill) progressFill.style.width = '0%';
      if (timeCurrent) timeCurrent.textContent = '0:00';
      if (timeTotal) timeTotal.textContent = '0:00';
      if (progressBar) progressBar.setAttribute('aria-valuenow', 0);

      // Reset play button
      if (playBtn) playBtn.innerHTML = PLAY_SVG;
      playerState.isWebPlaying = false;

      // Remove ambient background when playback ends
      setAmbientBackground(null);

      renderQueue();
    }
  });

  // ── Polling fallback (alleen als SSE verbroken is) ────────────
  // Elke 5 seconden /api/plex/nowplaying pollen als de SSE verbinding weg is.
  setInterval(async () => {
    if (playerState.sseEventSource?.readyState === EventSource.OPEN) return;
    // Sla over als de web player actief speelt
    if (playerState.isWebPlaying && !playerState.webPlayerAudio.paused) return;

    try {
      const np = await fetch('/api/plex/nowplaying').then(r => r.json());
      if (!np || !np.track) return;

      // Sla active remote info op
      playerState.activeRemote = {
        machineId:      np.machineId       || playerState.activeRemote?.machineId      || null,
        playerName:     np.playerName      || playerState.activeRemote?.playerName     || null,
        state:          np.playing ? 'playing' : (np.paused ? 'paused' : 'stopped'),
        ratingKey:      np.ratingKey       || playerState.activeRemote?.ratingKey      || null,
        albumRatingKey: np.albumRatingKey  || playerState.activeRemote?.albumRatingKey || null,
      };

      if (titleEl)  titleEl.textContent  = np.track  || '—';
      if (artistEl) artistEl.textContent = np.artist || '';
      if (np.duration) playerState.totalDuration = np.duration / 1000;

      if (playBtn) playBtn.innerHTML = np.playing ? PAUSE_SVG : PLAY_SVG;

      const offset = (np.viewOffset || 0) / 1000;
      playerState.currentTime = offset;
      _updateProgressUI(offset);

      if (np.playing) _startRemoteProgressTicker();
      else _stopRemoteProgressTicker();

      const artEl = document.getElementById('player-art');
      if (artEl && np.thumb) {
        const proxied = `/api/img?url=${encodeURIComponent(np.thumb)}&w=200`;
        if (artEl.dataset.lastThumb !== np.thumb) {
          artEl.dataset.lastThumb = np.thumb;
          artEl.src = proxied;
          setAmbientBackground(proxied);
        }
      }
    } catch {
      // noop — SSE zal dit opvangen zodra de verbinding hersteld is
    }
  }, 5000);

  console.log('[Player] Initialized');
}

/** Format seconds to mm:ss */
function _formatTime(seconds) {
  if (!Number.isFinite(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Voeg state properties toe
playerState.totalDuration        = 0;
playerState.currentTime          = 0;
playerState.sseEventSource       = null;
playerState.activeRemote         = null;  // { machineId, playerName, state, ratingKey, albumRatingKey }
playerState.remoteProgressTicker = null;  // setInterval handle voor soepele voortgangsbalk
playerState.remoteQueueTracks    = [];    // Gecachte wachtrij van de actieve remote sessie
