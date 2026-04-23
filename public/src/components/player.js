// ── Audio preview ─────────────────────────────────────────────────────────
import { state } from '../state.js';
import { apiFetch } from '../api.js';

export const playerState = {
  previewAudio: new Audio(),
  previewBtn: null,
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
