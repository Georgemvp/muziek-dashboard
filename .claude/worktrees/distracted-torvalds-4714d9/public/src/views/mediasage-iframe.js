// ── MediaSage iframe fallback view ──────────────────────────────────────────
// Tijdelijke view die MediaSage als iframe laadt zolang de SSE proxy-fix
// nog niet actief is. Toont een waarschuwingsbanner in de wrap-div.

export function loadMediaSageIframe() {
  const iframe  = document.getElementById('mediasage-iframe');
  const wrap    = document.getElementById('mediasage-iframe-wrap');
  const content = document.getElementById('content');

  if (!wrap || !iframe) return;

  wrap.style.display    = 'flex';
  content.style.display = 'none';

  // Laad iframe src eenmalig (lazy)
  if (!iframe.dataset.loaded) {
    iframe.src = iframe.dataset.src;
    iframe.dataset.loaded = '1';
  }
}
