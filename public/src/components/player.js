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
