// ── Audio preview ─────────────────────────────────────────────────────────
import { state } from '../state.js';
import { apiFetch } from '../api.js';

export async function playPreview(btn, artist, track) {
  // Zelfde knop → toggle play/pauze
  if (state.previewBtn === btn) {
    if (state.previewAudio.paused) {
      await state.previewAudio.play();
      btn.textContent = '⏸';
      btn.classList.add('playing');
    } else {
      state.previewAudio.pause();
      btn.textContent = '▶';
      btn.classList.remove('playing');
    }
    return;
  }

  // Stop vorige track
  if (state.previewBtn) {
    state.previewAudio.pause();
    state.previewBtn.textContent = '▶';
    state.previewBtn.classList.remove('playing');
    const oldFill = state.previewBtn.closest('.card')?.querySelector('.play-bar-fill');
    if (oldFill) oldFill.style.width = '0%';
  }

  state.previewBtn = btn;
  btn.textContent = '…';
  btn.disabled = true;

  try {
    const params = new URLSearchParams({ artist, track });
    const data = await apiFetch(`/api/preview?${params}`);
    if (!data.preview) {
      btn.textContent = '—';
      btn.disabled = false;
      setTimeout(() => { if (btn.textContent === '—') btn.textContent = '▶'; }, 1800);
      state.previewBtn = null;
      return;
    }
    state.previewAudio.src = data.preview;
    state.previewAudio.currentTime = 0;
    await state.previewAudio.play();
    btn.textContent = '⏸';
    btn.disabled = false;
    btn.classList.add('playing');
  } catch {
    btn.textContent = '▶';
    btn.disabled = false;
    state.previewBtn = null;
  }
}

// ── Audio event listeners ──────────────────────────────────────────────────
state.previewAudio.addEventListener('timeupdate', () => {
  if (!state.previewBtn || !state.previewAudio.duration) return;
  const fill = state.previewBtn.closest('.card')?.querySelector('.play-bar-fill');
  if (fill)
    fill.style.width =
      `${(state.previewAudio.currentTime / state.previewAudio.duration * 100).toFixed(1)}%`;
});

state.previewAudio.addEventListener('ended', () => {
  if (state.previewBtn) {
    state.previewBtn.textContent = '▶';
    state.previewBtn.classList.remove('playing');
    const fill = state.previewBtn.closest('.card')?.querySelector('.play-bar-fill');
    if (fill) fill.style.width = '0%';
    state.previewBtn = null;
  }
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden && !state.previewAudio.paused) {
    state.previewAudio.pause();
    if (state.previewBtn) {
      state.previewBtn.textContent = '▶';
      state.previewBtn.classList.remove('playing');
    }
  }
});
