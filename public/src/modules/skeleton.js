// ── Skeleton Loading Helpers ───────────────────────────────────────────────
// Genereer placeholder HTML voor loading states in de muziek-dashboard views.
// Gebruikt CSS classes uit public/css/skeleton.css.
//
// Element-klassen:  .skeleton (base shimmer), .skeleton-img, .skeleton-text, .skeleton-title
// Container-klassen (prefix sk- om conflict met utils.css te voorkomen):
//   .sk-card, .sk-grid, .sk-list, .sk-hero

/**
 * Eén skeleton card: afbeelding-placeholder + 2 tekstregels.
 * @returns {string} HTML string
 */
export function skeletonCard() {
  return `
    <div class="sk-card">
      <div class="skeleton skeleton-img"></div>
      <div class="sk-card-body">
        <div class="skeleton skeleton-title"></div>
        <div class="skeleton skeleton-text"></div>
      </div>
    </div>`;
}

/**
 * Grid van skeleton cards.
 * @param {number} cols  Aantal kolommen (bepaalt --sk-cols CSS-variabele)
 * @param {number} rows  Aantal rijen
 * @returns {string} HTML string
 */
export function skeletonGrid(cols = 4, rows = 3) {
  const count = cols * rows;
  const cards = Array.from({ length: count }, () => skeletonCard()).join('');
  return `<div class="sk-grid" style="--sk-cols:${cols}">${cards}</div>`;
}

/**
 * Lijst van skeleton rijen (bijv. voor downloads-wachtrij).
 * @param {number} rows  Aantal rijen
 * @returns {string} HTML string
 */
export function skeletonList(rows = 5) {
  const items = Array.from({ length: rows }, () => `
    <div class="sk-list-row">
      <div class="skeleton sk-list-thumb"></div>
      <div class="sk-list-lines">
        <div class="skeleton skeleton-title"></div>
        <div class="skeleton skeleton-text"></div>
      </div>
      <div class="skeleton sk-list-badge"></div>
    </div>`).join('');
  return `<div class="sk-list">${items}</div>`;
}

/**
 * Grote hero-placeholder: brede afbeelding met tekst eronder.
 * @returns {string} HTML string
 */
export function skeletonHero() {
  return `
    <div class="sk-hero">
      <div class="skeleton sk-hero-img"></div>
      <div class="sk-hero-body">
        <div class="skeleton sk-hero-title"></div>
        <div class="skeleton skeleton-text" style="width:55%"></div>
        <div class="skeleton skeleton-text" style="width:40%"></div>
      </div>
    </div>`;
}
