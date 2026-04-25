// ── MediaSage view: iframe wrapper ──────────────────────────────────────────
// Toont de MediaSage FastAPI UI in een iframe op /mediasage/
// Patroon identiek aan loadTidarrUI() in downloads.js

/**
 * Toon de MediaSage iframe, verberg de normale content area.
 * Iframe src wordt lazy geladen bij eerste activatie.
 */
export function loadMediaSage() {
  const wrap    = document.getElementById('mediasage-ui-wrap');
  const iframe  = document.getElementById('mediasage-iframe');
  const content = document.getElementById('content');

  if (!wrap || !iframe) return;

  wrap.style.display    = 'flex';
  content.style.display = 'none';

  // Lazy-load: src pas instellen bij eerste bezoek
  if (!iframe.dataset.loaded) {
    iframe.src = iframe.dataset.src;
    iframe.dataset.loaded = '1';
  }
}

/**
 * Verberg de MediaSage iframe en herstel de normale content area.
 * Aanroepen vanuit andere views zodat de wrap niet blijft hangen.
 */
export function hideMediaSageUI() {
  const wrap    = document.getElementById('mediasage-ui-wrap');
  const content = document.getElementById('content');
  if (wrap)    wrap.style.display    = 'none';
  if (content) content.style.display = '';
}
