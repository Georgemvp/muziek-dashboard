// ── Gedeelde applicatie-state ─────────────────────────────────────────────
// Één gemuteerd object zodat alle modules dezelfde referentie delen.

export const state = {
  // ── Navigatie ───────────────────────────────────────────────────────────
  currentTab:       'nu',
  currentMainTab:   'nu',
  bibSubTab:        'collectie',
  sectionContainerEl: null,

  // ── Filter / sort ───────────────────────────────────────────────────────
  currentPeriod:  '7day',
  recsFilter:     'all',
  discFilter:     'all',
  gapsSort:       'missing',
  releasesSort:   'listening',
  releasesFilter: 'all',

  // ── Data caches ──────────────────────────────────────────────────────────
  plexOk:      false,
  lastDiscover: null,
  lastGaps:    null,
  lastReleases: null,
  plexLibData: null,
  wishlistMap: new Map(),    // "type:name" → id
  newReleaseIds: new Set(),

  // ── Timeouts ─────────────────────────────────────────────────────────────
  searchTimeout:      null,
  tidalSearchTimeout: null,

  // ── Tidarr / Tidal ───────────────────────────────────────────────────────
  tidarrOk:           false,
  tidalView:          'search',   // 'search' | 'queue' | 'history'
  tidalSearchResults: null,
  tidarrQueuePoll:    null,
  tidarrSseSource:    null,
  tidarrQueueItems:   [],
  downloadedSet:      new Set(),

  // ── Spotify ──────────────────────────────────────────────────────────────
  spotifyEnabled: false,
  activeMood:     null,

  // ── Audio preview ────────────────────────────────────────────────────────
  previewAudio: new Audio(),
  previewBtn:   null,

  // ── Collapsible sections (Ontdek) ────────────────────────────────────────
  collapsibleSections: { recs: false, releases: false, discover: false },

  // ── Mutex voor sectionContainerEl ───────────────────────────────────────
  sectionMutex: Promise.resolve(),

  // ── Download confirm callback ─────────────────────────────────────────────
  dlResolve: null,

  // ── Kwaliteitsopties ─────────────────────────────────────────────────────
  VALID_QUALITIES: ['max', 'high', 'normal', 'low'],
};
