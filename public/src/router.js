// ── Router: View switching met lazy loading cache ──────────────────────────
// Beheert navigatie, view caching en loading states

import { state } from './state.js';

// ── View metadata ──────────────────────────────────────────────────────────
// renderFn = naam van de export-functie in de view module.
// Om een nieuwe view toe te voegen: één regel hier + één regel in viewLoaders.
const viewMeta = {
  home:        { title: 'Muziek · Home',                       renderFn: 'loadHome' },
  ontdek:      { title: 'Muziek · Ontdek',                     renderFn: 'loadOntdek' },
  gaps:        { title: 'Muziek · Gaps',                       renderFn: 'loadGaps' },
  downloads:   { title: 'Muziek · Downloads',                  renderFn: 'loadDownloads' },
  nu:          { title: 'Muziek · Nu Bezig',                   renderFn: 'loadNu' },
  genres:      { title: 'Muziek · Genres',                     renderFn: 'loadGenres' },
  radio:       { title: 'Muziek · Live Radio',                 renderFn: 'loadRadio' },
  'listen-later': { title: 'Muziek · Listen Later',            renderFn: 'loadListenLater' },
  tags:        { title: 'Muziek · Tags',                       renderFn: 'loadTags' },
  history:     { title: 'Muziek · History',                    renderFn: 'loadHistory' },
  albums:      { title: 'Muziek · Albums',                     renderFn: 'loadAlbums' },
  artists:     { title: 'Muziek · Artists',                    renderFn: 'loadArtists' },
  tracks:      { title: 'Muziek · Tracks',                     renderFn: 'loadTracks' },
  composers:   { title: 'Muziek · Composers',                  renderFn: 'loadComposers' },
  folders:     { title: 'Muziek · Folders',                    renderFn: 'loadFolders' },
  'artist-detail':         { title: 'Muziek · Artiest',        renderFn: 'loadArtistDetail' },
  playlists:               { title: 'Muziek · Afspeellijsten', renderFn: 'loadPlaylists' },
  'playlist-detail':       { title: 'Muziek · Afspeellijst',   renderFn: 'loadPlaylistDetail' },
  stats:                   { title: 'Muziek · Statistieken',   renderFn: 'loadStats' },
  mediasage:               { title: 'Muziek · MediaSage',              renderFn: 'loadMediaSage' },
  'mediasage-playlist':    { title: 'Muziek · AI Playlist Generator',  renderFn: 'loadMediaSagePlaylist' },
  'mediasage-recommend':   { title: 'Muziek · AI Album Aanbevelingen', renderFn: 'loadMediaSageRecommend' },
  'mediasage-iframe':      { title: 'Muziek · MediaSage (iframe versie)', renderFn: 'loadMediaSageIframe' },
  tidarr:                        { title: 'Muziek · Tidarr',          renderFn: 'loadDownloads' },
  audiomuse:                     { title: 'Muziek · AudioMuse',        renderFn: 'loadAudioMuse' },
  'audiomuse-smart-playlists':   { title: 'Muziek · Smart Playlists',  renderFn: 'loadAudioMuseSmartPlaylists' },
  orpheus:                       { title: 'Muziek · OrpheusDL',        renderFn: 'loadOrpheus' },
  releases:                      { title: 'Muziek · New Releases',      renderFn: 'loadReleases' },
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
  'artist-detail':   () => import('./views/artist-detail.js'),
  playlists:         () => import('./views/playlists.js'),
  'playlist-detail': () => import('./views/playlists.js'),
  stats:             () => import('./views/stats.js'),
  mediasage:               () => import('./views/mediasage.js'),
  'mediasage-playlist':    () => import('./views/mediasage-playlist.js'),
  'mediasage-recommend':   () => import('./views/mediasage-recommend.js'),
  'mediasage-iframe':      () => import('./views/mediasage-iframe.js'),
  tidarr:                        () => import('./views/downloads.js'),
  audiomuse:                     () => import('./views/audiomuse.js'),
  'audiomuse-smart-playlists':   () => import('./views/audiomuse-smart-playlists.js'),
  orpheus:                       () => import('./views/orpheus.js'),
  releases:                      () => import('./views/releases.js'),
};

// ── Module cache ───────────────────────────────────────────────────────────
const viewCache = {};

// ── Hash routing helpers ───────────────────────────────────────────────────
// Vlag om te voorkomen dat we ons eigen hashchange event verwerken
let suppressHashChange = false;

/**
 * Verwerkt een location.hash naar { view, params }.
 * Formaten:
 *   #/home              → { view: 'home', params: null }
 *   #/artist/Radiohead  → { view: 'artist-detail', params: { name: 'Radiohead' } }
 */
function parseHash(hash) {
  const path = (hash || '').replace(/^#\//, '').split('/');
  const segment = path[0] || 'home';

  if (segment === 'artist' && path[1]) {
    return { view: 'artist-detail', params: { name: decodeURIComponent(path[1]) } };
  }

  // Bekende view of val terug op 'home'
  const view = viewLoaders[segment] ? segment : 'home';
  return { view, params: null };
}

/**
 * Bouwt een hash string op basis van view en optionele params.
 */
function buildHash(viewName, params) {
  if (viewName === 'artist-detail' && params?.name) {
    return `#/artist/${encodeURIComponent(params.name)}`;
  }
  return `#/${viewName}`;
}

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
 * - URL hash (deep links, F5, browser-back)
 * - UI state (nav-item.active, aria-current)
 * - Abort signal voor eerdere requests
 * - View title
 * - Content clearing en error handling
 * @param {string} viewName - View om in te laden (home, ontdek, gaps, downloads, nu, etc.)
 * @param {object} params - Optional parameters voor de view (bijv. { name: 'Artist' } voor artist-detail)
 */
export async function switchView(viewName, params = null) {
  if (!viewLoaders[viewName]) return;

  // Save current view as previous (voordat we naar nieuw view gaan)
  if (state.activeView && state.activeView !== viewName) {
    state.previousView = state.activeView;
  }

  // Store params in state if provided (artist-detail uses this)
  if (params) {
    state.viewParams = params;
  }

  // ── Update URL hash (zonder een nieuw hashchange event te triggeren) ──────
  const newHash = buildHash(viewName, params);
  if (location.hash !== newHash) {
    suppressHashChange = true;
    location.hash = newHash;
    // Reset na de synchrone microtask-ronde zodat toekomstige hashchanges weer werken
    setTimeout(() => { suppressHashChange = false; }, 0);
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

  // ── Verberg iframe wraps bij view-wissel (tenzij de view ze zelf toont) ──
  const tidarrWrap      = document.getElementById('tidarr-ui-wrap');
  const mediasageWrap   = document.getElementById('mediasage-iframe-wrap');
  const audiomuseWrap   = document.getElementById('audiomuse-wrap');
  const contentEl       = document.getElementById('content');
  if (tidarrWrap)     tidarrWrap.style.display     = 'none';
  if (mediasageWrap)  mediasageWrap.style.display  = 'none';
  if (audiomuseWrap)  audiomuseWrap.style.display  = 'none';
  if (contentEl)      contentEl.style.display      = '';

  // ── Clear toolbar ──────────────────────────────────────────────────────
  const toolbar = document.getElementById('view-toolbar');
  if (toolbar) toolbar.innerHTML = '';

  // ── Load and render view ───────────────────────────────────────────────
  try {
    const viewModule = await loadViewModule(viewName);
    const meta = viewMeta[viewName];
    const renderFn = meta && viewModule[meta.renderFn];

    if (renderFn) {
      await renderFn();
      document.title = meta.title || 'Muziek';
    }
  } catch (err) {
    if (err.name === 'AbortError') return;

    // Reset abort controller zodat navigatie naar andere views niet geblokkeerd blijft
    state.tabAbort = new AbortController();

    const content = document.getElementById('content');
    if (content) {
      content.innerHTML = `
        <div class="error-box">
          ⚠️ Laden mislukt: ${err.message}
          <button class="error-retry-btn" style="margin-left:12px;padding:4px 10px;cursor:pointer;">
            Probeer opnieuw
          </button>
        </div>`;
      content.querySelector('.error-retry-btn')?.addEventListener('click', () => {
        switchView(viewName, params);
      });
    }
    console.error(`Failed to load view ${viewName}:`, err);
  }
}

/**
 * Initialiseer router: nav-item click listeners, hashchange listener en initiële navigatie.
 * Bepaalt zelf de startview (via hash of 'home'). Roep dit eenmaal aan uit main.js.
 */
export function initRouter() {
  // ── Nav-item click listeners ───────────────────────────────────────────
  document.querySelectorAll('.nav-item[data-view]').forEach(btn => {
    btn.addEventListener('click', async () => {
      await switchView(btn.dataset.view);
      // Close sidebar na klik (laat sidebar module dit doen via event)
      document.dispatchEvent(new CustomEvent('sidebar:close'));
    });
  });

  // ── Hashchange listener (browser-back, forward, handmatige URL-wijziging) ─
  window.addEventListener('hashchange', () => {
    if (suppressHashChange) return;
    const { view, params } = parseHash(location.hash);
    switchView(view, params);
  });

  // ── Initiële navigatie ────────────────────────────────────────────────
  const hash = location.hash;
  if (hash && hash !== '#' && hash !== '#/') {
    const { view, params } = parseHash(hash);
    switchView(view, params);
  } else {
    switchView('home');
  }
}
