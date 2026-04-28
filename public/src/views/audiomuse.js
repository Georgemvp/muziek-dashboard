// ── AudioMuse view ──────────────────────────────────────────────────────────
// Toont de AudioMuse Flask UI als een iframe binnen het dashboard.

export function loadAudioMuse() {
  const iframe  = document.getElementById('audiomuse-iframe');
  const wrap    = document.getElementById('audiomuse-wrap');
  const content = document.getElementById('content');

  if (!wrap || !iframe) return;

  wrap.style.display    = 'flex';
  content.style.display = 'none';

  // Laad iframe src eenmalig (lazy) zodat de pagina niet herlaadt bij tab-wissel
  if (!iframe.dataset.loaded) {
    iframe.src = iframe.dataset.src;
    iframe.dataset.loaded = '1';
  }
}
