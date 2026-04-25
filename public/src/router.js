// ── Router: View switching met lazy loading cache ──────────────────────────
// Beheert navigatie, view caching en loading states

import { state } from './state.js';

// ── View metadata ──────────────────────────────────────────────────────────
const viewMeta = {
  home:        { title: 'Muziek · Home' },
  ontdek:      { title: 'Muziek · Ontdek' },
  gaps:        { title: 'Muziek · Gaps' },
  downloads:   { title: 'Muziek · Downloads' },
  nu:          { title: 'Muziek · Nu Bezig' },
  genres:      { title: 'Muziek · Genres' },
  radio:       { title: 'Muziek · Live Radio' },
  'listen-later': { title: 'Muziek · Listen Later' },
  tags:        { title: 'Muziek · Tags' },
  history:     { title: 'Muziek · History' },
  albums:      { title: 'Muziek · Albums' },
  artists:     { title: 'Muziek · Artists' },
  tracks:      { title: 'Muziek · Tracks' },
  composers:   { title: 'Muziek · Composers' },
  folders:     { title: 'Muziek · Folders' },
  'artist-detail': { title: 'Muziek · Artiest' },
};

// ── Lazy loaders voor view modules ─────────────────────────────────────────
const viewLoaders = {
  home:        () => import('./views/home.js'),
  ontdek:      () => import('./views/ontdek.js'),
  gaps:        () => import('./views/gaps.js'),
  downloads:   () => import('./views/downloads.js'),
  nu:          () => import('./views/nu.js'),
  genres:      () => import('./views/genres.js'),
  radio:       () => import('./views/radio.js'),
  'listen-later': () => import('./views/listen-later.js'),
  tags:        () => import('./views/tags.js'),
  history:     () => import('./views/history.js'),
  albums:      () => import('./views/albums.js'),
  artists:     () => import('./views/artists.js'),
  tracks:      () => import('./views/tracks.js'),
  composers:   () => import('./views/composers.js'),
  folders:     () => import('./views/folders.js'),
  'artist-detail': () => import('./views/artist-detail.js'),
};

// ── Module cache ───────────────────────────────────────────────────────────
const viewCache = {};

/**
 * Load een view module (geëffectueerd via lazy import) en cache het resultaat.
 * @param {string} viewName - De view naam (key in viewLoaders)
 * @returns {Promise} Resolved module
 */
async function loadViewModule(viewName) {
  if (!viewCache[viewName] && viewLoaders[viewName]) {
    viewCache[viewName] = await viewLoaders[viewName]();
  }
  return viewCache[viewName];
}

/**
 * Navigeer naar een view. Beheert:
 * - UI state (nav-item.active, aria-current)
 * - Abort signal voor eerdere requests
 * - View title
 * - Content clearing en error handling
 * @param {string} viewName - View om in te laden (home, ontdek, gaps, downloads, nu, etc.)
 * @param {object} params - Optional parameters voor de view (bijv. { name: 'Artist' } voor artist-detail)
 */
export async function switchView(viewName, params = null) {
  if (!viewLoaders[viewName]) return;

  // Store params in state if provided (artist-detail uses this)
  if (params) {
    state.viewParams = params;
  }

  // ── Mark nav item as active ────────────────────────────────────────────
  document.querySelectorAll('.nav-item[data-view]').forEach(el => {
    const active = el.dataset.view === viewName;
    el.classList.toggle('active', active);
    if (active) el.setAttribute('aria-current', 'page');
    else el.removeAttribute('aria-current');
  });

  // ── Cancel any in-flight requests for previous view ────────────────────
  if (state.tabAbort) state.tabAbort.abort();
  state.tabAbort = new AbortController();
  state.activeView = viewName;
  state.sectionContainerEl = null;

  // ── Clear toolbar ──────────────────────────────────────────────────────
  const toolbar = document.getElementById('view-toolbar');
  if (toolbar) toolbar.innerHTML = '';

  // ── Load and render view ──────────────────────────────────────────────
  try {
    const viewModule = await loadViewModule(viewName);

    // Bepaal welke render functie te roepen
    const renderFn =
      viewName === 'home'        ? viewModule.loadHome :
      viewName === 'gaps'        ? viewModule.loadGaps :
      viewName === 'ontdek'      ? viewModule.loadOntdek :
      viewName === 'downloads'   ? viewModule.loadDownloads :
      viewName === 'nu'          ? viewModule.loadNu :
      viewName === 'genres'      ? viewModule.loadGenres :
      viewName === 'radio'       ? viewModule.loadRadio :
      viewName === 'listen-later' ? viewModule.loadListenLater :
      viewName === 'tags'        ? viewModule.loadTags :
      viewName === 'history'     ? viewModule.loadHistory :
      viewName === 'albums'      ? viewModule.loadAlbums :
      viewName === 'artists'     ? viewModule.loadArtists :
      viewName === 'tracks'      ? viewModule.loadTracks :
      viewName === 'composers'   ? viewModule.loadComposers :
      viewName === 'folders'     ? viewModule.loadFolders :
      viewName === 'artist-detail' ? viewModule.loadArtistDetail :
      null;

    if (renderFn) {
      await renderFn();
      document.title = viewMeta[viewName]?.title || 'Muziek';
    }
  } catch (err) {
    if (err.name === 'AbortError') return;
    const content = document.getElementById('content');
    if (content) {
      content.innerHTML = `<div class="error-box">⚠️ Laden mislukt: ${err.message}</div>`;
    }
    console.error(`Failed to load view ${viewName}:`, err);
  }
}

/**
 * Initialiseer router event listeners op nav items.
 * Roep dit eenmaal aan uit main.js
 */
export function initRouter() {
  document.querySelectorAll('.nav-item[data-view]').forEach(btn => {
    btn.addEventListener('click', async () => {
      await switchView(btn.dataset.view);
      // Close sidebar na klik (laat sidebar module dit doen via event)
      const closeEvent = new CustomEvent('sidebar:close');
      document.dispatchEvent(closeEvent);
    });
  });
}
