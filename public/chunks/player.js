/**
 * player.js — Persistente Player Bar Controller
 *
 * MODE 1: Plex Remote Control (primair)
 *   Stuurt commando's naar een geselecteerde Plex client via REST API.
 *   Real-time updates via SSE (/api/plex/stream), fallback: poll elke 30s.
 *
 * MODE 2: Deezer Preview (secundair)
 *   30-seconden previews via /api/preview. Gebruikt een <audio> element.
 *
 * ES Module — importeer de gewenste exports in je app.
 */

// ─────────────────────────────────────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────────────────────────────────────

const ZONE_KEY = 'plexSelectedZone';

/** @type {PlayerState} */
const playerState = {
  mode:        'remote', // 'remote' | 'preview' | 'web'
  playing:     false,
  paused:      false,
  track:       '',
  artist:      '',
  album:       '',
  thumb:       null,
  duration:    0,   // ms
  viewOffset:  0,   // ms
  machineId:   null,
  ratingKey:   null,
  queue:       [],  // [{ratingKey, title, artist, album, duration, thumb}]
  queueIndex:  -1,
  shuffle:     false,
  repeat:      'off', // 'off' | 'all' | 'one'
};

/** Geregistreerde state-change listeners. */
const _listeners = [];

/** <audio> element voor Deezer preview mode. */
const _audio = new Audio();
_audio.preload = 'none';

// SSE / poll handles
let _sseSource       = null;
let _pollTimer       = null;
let _reconnectTimer  = null;
let _progressTimer   = null;  // interval voor lokale voortgangsanimatie

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Initialiseer de player: verbind SSE, bind UI-knoppen.
 * Roep aan vanuit main.js na DOMContentLoaded.
 */
export function initPlayer() {
  _bindUIEvents();
  _connectSSE();
  _startProgressTick();

  // Herstel zone-naam uit localStorage
  const savedZone = _loadZone();
  if (savedZone) {
    playerState.machineId = savedZone.machineId;
  }
}

/**
 * Speel een track af op de geselecteerde Plex zone.
 * @param {string|number} ratingKey
 * @param {string} title
 * @param {string} artist
 * @param {string} album
 * @param {string|null} thumb  - URL van album art
 */
export async function playTrack(ratingKey, title, artist, album, thumb = null) {
  const zone = _loadZone();
  if (!zone) {
    _toast('Selecteer eerst een zone', '#e05a2b');
    return;
  }

  if (zone.machineId === '__web__') {
    _stopPreview();
    playerState.mode      = 'web';
    playerState.ratingKey = String(ratingKey);
    playerState.machineId = '__web__';
    playerState.duration  = 0;
    playerState.viewOffset = 0;
    _applyTrackInfo({ title, artist, album, thumb, playing: true, paused: false });

    try {
      _audio.src = `/api/plex/stream/audio/${ratingKey}`;
      _audio.currentTime = 0;
      await _audio.play();
      playerState.playing = true;
      _updatePlayerBarDOM();
      _notifyListeners();
    } catch (e) {
      console.error('[Player] web play fout:', e);
      _toast(`Afspelen mislukt: ${e.message}`, '#e05a2b');
      _applyTrackInfo({ playing: false, paused: false });
    }
    return;
  }

  _stopPreview();
  playerState.mode      = 'remote';
  playerState.ratingKey = String(ratingKey);
  playerState.machineId = zone.machineId;

  // Optimistische UI update
  _applyTrackInfo({ title, artist, album, thumb, playing: true, paused: false });

  try {
    const res  = await fetch('/api/plex/play', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ machineId: zone.machineId, ratingKey: String(ratingKey) }),
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || 'Afspelen mislukt');
  } catch (e) {
    console.error('[Player] playTrack fout:', e);
    _toast(`⚠ ${e.message}`, '#e05a2b');
    _applyTrackInfo({ playing: false, paused: false });
  }
}

/**
 * Laad tracks van een album en speel het eerste af.
 * @param {string|number} albumRatingKey
 */
export async function playAlbum(albumRatingKey) {
  try {
    const res   = await fetch(`/api/plex/album/${albumRatingKey}/tracks`);
    const data  = await res.json();
    const tracks = data.tracks || data || [];
    if (!tracks.length) { _toast('⚠ Geen tracks gevonden', '#e05a2b'); return; }
    _fillQueue(tracks);
    await playTrack(
      tracks[0].ratingKey,
      tracks[0].title,
      tracks[0].artist,
      tracks[0].album,
      tracks[0].thumb ?? null,
    );
  } catch (e) {
    console.error('[Player] playAlbum fout:', e);
    _toast(`⚠ Album laden mislukt: ${e.message}`, '#e05a2b');
  }
}

/**
 * Laad tracks van een afspeellijst en speel het eerste af.
 * @param {string|number} playlistRatingKey
 */
export async function playPlaylist(playlistRatingKey) {
  try {
    const res    = await fetch(`/api/plex/playlist/${playlistRatingKey}/tracks`);
    const data   = await res.json();
    const tracks = data.tracks || data || [];
    if (!tracks.length) { _toast('⚠ Geen tracks gevonden', '#e05a2b'); return; }
    _fillQueue(tracks);
    await playTrack(
      tracks[0].ratingKey,
      tracks[0].title,
      tracks[0].artist,
      tracks[0].album,
      tracks[0].thumb ?? null,
    );
  } catch (e) {
    console.error('[Player] playPlaylist fout:', e);
    _toast(`⚠ Afspeellijst laden mislukt: ${e.message}`, '#e05a2b');
  }
}

/** Pauzeer of hervat afspelen op de geselecteerde zone. */
export async function togglePlayPause() {
  if (playerState.mode === 'web' || playerState.mode === 'preview') {
    _togglePreviewPlayback();
    return;
  }
  const zone = _loadZone();
  if (!zone) return;
  try {
    await fetch('/api/plex/pause', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ machineId: zone.machineId }),
    });
    // State wordt bijgewerkt via SSE
  } catch (e) {
    console.warn('[Player] togglePlayPause fout:', e);
  }
}

/** Sla over naar de volgende track in de queue. */
export async function skipNext() {
  if (playerState.mode === 'web' || playerState.mode === 'preview') {
    _nextInQueue();
    return;
  }
  const zone = _loadZone();
  if (zone) {
    try {
      await fetch('/api/plex/skip', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ machineId: zone.machineId, direction: 'next' }),
      });
    } catch (e) {
      console.warn('[Player] skipNext fout:', e);
    }
  }
  _nextInQueue();
}

/** Sla over naar de vorige track (of herstart als > 3s verstreken). */
export async function skipPrev() {
  if (playerState.mode === 'web' || playerState.mode === 'preview') {
    _prevInQueue();
    return;
  }
  // Als de track meer dan 3 seconden bezig is → herstart
  if (playerState.viewOffset > 3000) {
    const zone = _loadZone();
    if (zone) {
      try {
        await fetch('/api/plex/skip', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ machineId: zone.machineId, direction: 'prev' }),
        });
      } catch (e) {
        console.warn('[Player] skipPrev (restart) fout:', e);
      }
    }
    return;
  }
  const zone = _loadZone();
  if (zone) {
    try {
      await fetch('/api/plex/skip', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ machineId: zone.machineId, direction: 'prev' }),
      });
    } catch (e) {
      console.warn('[Player] skipPrev fout:', e);
    }
  }
  _prevInQueue();
}

/**
 * Selecteer een Plex afspeelzone.
 * @param {string} machineId
 * @param {string} name
 */
export function setZone(machineId, name) {
  const zone = { machineId, name };
  localStorage.setItem(ZONE_KEY, JSON.stringify(zone));
  playerState.machineId = machineId;
  _notifyListeners();
}

/**
 * Haal beschikbare Plex clients op.
 * @returns {Promise<Array>}
 */
export async function getZones() {
  try {
    const res  = await fetch(`/api/plex/clients?t=${Date.now()}`);
    const data = await res.json();
    return data.clients || [];
  } catch {
    return [];
  }
}

/** Geeft een kopie van de huidige player state. */
export function getPlayerState() {
  return { ...playerState, queue: [...playerState.queue] };
}

/**
 * Registreer een callback die aangeroepen wordt bij iedere state-wijziging.
 * @param {function} callback
 */
export function onStateChange(callback) {
  if (typeof callback === 'function') _listeners.push(callback);
}

// ─────────────────────────────────────────────────────────────────────────────
// SSE — REAL-TIME PLEX UPDATES
// ─────────────────────────────────────────────────────────────────────────────

function _connectSSE() {
  if (_sseSource) {
    _sseSource.close();
    _sseSource = null;
  }
  clearTimeout(_reconnectTimer);

  try {
    const es = new EventSource('/api/plex/stream');
    _sseSource = es;

    es.addEventListener('plex', e => {
      try {
        const payload = JSON.parse(e.data);
        _handlePlexUpdate(payload);
      } catch (err) {
        console.warn('[Player SSE] parse fout:', err);
      }
    });

    es.addEventListener('open', () => {
      // SSE verbonden — stop poll fallback als die actief was
      _stopPollFallback();
    });

    es.addEventListener('error', () => {
      console.warn('[Player SSE] verbinding verbroken, reconnect over 5s');
      es.close();
      _sseSource = null;
      _startPollFallback();
      _reconnectTimer = setTimeout(_connectSSE, 5000);
    });
  } catch (e) {
    console.warn('[Player SSE] SSE niet beschikbaar:', e);
    _startPollFallback();
  }
}

function _handlePlexUpdate(payload) {
  // payload verwacht: { state, title, artist, album, thumb, duration, viewOffset, ratingKey }
  if (!payload) return;
  if (playerState.mode === 'web') return;

  const wasPlaying = playerState.playing;

  playerState.playing    = payload.state === 'playing';
  playerState.paused     = payload.state === 'paused';
  playerState.track      = payload.title      ?? playerState.track;
  playerState.artist     = payload.artist     ?? playerState.artist;
  playerState.album      = payload.album      ?? playerState.album;
  playerState.thumb      = payload.thumb      ?? playerState.thumb;
  playerState.duration   = payload.duration   ?? playerState.duration;
  playerState.viewOffset = payload.viewOffset ?? playerState.viewOffset;
  playerState.ratingKey  = payload.ratingKey  ?? playerState.ratingKey;

  if (playerState.playing || playerState.paused) {
    playerState.mode = 'remote';
  }

  _updatePlayerBarDOM();
  _notifyListeners();
}

// ─────────────────────────────────────────────────────────────────────────────
// POLL FALLBACK
// ─────────────────────────────────────────────────────────────────────────────

function _startPollFallback() {
  if (_pollTimer) return;
  _pollFetch();
  _pollTimer = setInterval(_pollFetch, 30_000);
}

function _stopPollFallback() {
  if (_pollTimer) { clearInterval(_pollTimer); _pollTimer = null; }
}

async function _pollFetch() {
  try {
    const res  = await fetch('/api/plex/nowplaying');
    const data = await res.json();
    _handlePlexUpdate(data);
  } catch {
    // Stil falen — geen kritieke fout
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// QUEUE LOGICA
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Vul de queue met een array van track-objecten.
 * Als shuffle aan staat, wordt Fisher-Yates toegepast op een kopie.
 */
function _fillQueue(tracks) {
  let list = tracks.map(t => ({
    ratingKey: String(t.ratingKey ?? t.key ?? ''),
    title:     t.title  ?? t.track  ?? '',
    artist:    t.artist ?? t.grandparentTitle ?? '',
    album:     t.album  ?? t.parentTitle ?? '',
    duration:  t.duration ?? 0,
    thumb:     t.thumb  ?? null,
  }));

  if (playerState.shuffle) list = _fisherYates(list);

  playerState.queue      = list;
  playerState.queueIndex = 0;
}

function _nextInQueue() {
  const { queue, queueIndex, repeat } = playerState;
  if (!queue.length) return;

  let next = queueIndex + 1;

  if (next >= queue.length) {
    if (repeat === 'all') {
      next = 0;
    } else {
      // Einde van queue — stop
      _applyTrackInfo({ playing: false, paused: false });
      return;
    }
  }

  playerState.queueIndex = next;
  const t = queue[next];
  playTrack(t.ratingKey, t.title, t.artist, t.album, t.thumb);
}

function _prevInQueue() {
  const { queue, queueIndex } = playerState;
  if (!queue.length) return;

  const prev = Math.max(0, queueIndex - 1);
  playerState.queueIndex = prev;
  const t = queue[prev];
  playTrack(t.ratingKey, t.title, t.artist, t.album, t.thumb);
}

/** Fisher-Yates shuffle op een kopie van de array. */
function _fisherYates(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─────────────────────────────────────────────────────────────────────────────
// DEEZER PREVIEW MODE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Speel een Deezer preview af (30s).
 * Wordt intern aangeroepen als mode='preview'.
 * @param {string} artist
 * @param {string} track
 * @param {object} [meta] - { title, album, thumb }
 */
export async function playPreview(artist, track, meta = {}) {
  _stopRemoteMode();
  playerState.mode   = 'preview';
  playerState.artist = artist;
  playerState.track  = meta.title  ?? track;
  playerState.album  = meta.album  ?? '';
  playerState.thumb  = meta.thumb  ?? null;

  _applyTrackInfo({
    title:   meta.title ?? track,
    artist,
    album:   meta.album ?? '',
    thumb:   meta.thumb ?? null,
    playing: false,
    paused:  false,
  });

  try {
    const params = new URLSearchParams({ artist, track });
    const res    = await fetch(`/api/preview?${params}`);
    const data   = await res.json();

    if (!data.preview) {
      _toast('Geen preview beschikbaar', '#888');
      return;
    }

    _audio.src          = data.preview;
    _audio.currentTime  = 0;
    playerState.duration = 30_000; // Deezer previews zijn altijd 30s

    await _audio.play();
    playerState.playing = true;
    playerState.paused  = false;
    _updatePlayerBarDOM();
    _notifyListeners();
  } catch (e) {
    console.error('[Player] preview fout:', e);
    _toast('⚠ Preview laden mislukt', '#e05a2b');
  }
}

function _togglePreviewPlayback() {
  if (_audio.paused) {
    _audio.play().then(() => {
      playerState.playing = true;
      playerState.paused  = false;
      _updatePlayerBarDOM();
      _notifyListeners();
    });
  } else {
    _audio.pause();
    playerState.playing = false;
    playerState.paused  = true;
    _updatePlayerBarDOM();
    _notifyListeners();
  }
}

function _stopPreview() {
  _audio.pause();
  _audio.src = '';
}

function _stopRemoteMode() {
  // Geen actieve stop-API call nodig bij overschakelen naar preview
}

// ─────────────────────────────────────────────────────────────────────────────
// UI EVENT BINDING
// ─────────────────────────────────────────────────────────────────────────────

function _bindUIEvents() {
  document.getElementById('player-play')?.addEventListener('click', togglePlayPause);
  document.getElementById('player-next')?.addEventListener('click', skipNext);
  document.getElementById('player-prev')?.addEventListener('click', skipPrev);

  // Volume slider (alleen relevant voor preview mode)
  document.getElementById('player-volume')?.addEventListener('input', e => {
    _audio.volume = e.target.value / 100;
  });

  // Progress bar klikken (preview/web mode: seek)
  document.getElementById('player-progress')?.addEventListener('click', e => {
    if ((playerState.mode !== 'preview' && playerState.mode !== 'web') || !_audio.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct  = (e.clientX - rect.left) / rect.width;
    _audio.currentTime = pct * _audio.duration;
    playerState.viewOffset = Math.round(pct * playerState.duration);
    _updatePlayerBarDOM();
  });

  // Queue-knop (basic: dispatch event zodat andere modules kunnen reageren)
  document.getElementById('player-queue-btn')?.addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent('player-queue-open', {
      detail: { queue: playerState.queue, queueIndex: playerState.queueIndex },
    }));
  });

  _audio.addEventListener('loadedmetadata', () => {
    if (playerState.mode === 'web') {
      playerState.duration = Math.round(_audio.duration * 1000);
      _updateProgressDOM();
    }
  });

  // Audio events voor preview + web mode
  _audio.addEventListener('timeupdate', () => {
    if (playerState.mode !== 'preview' && playerState.mode !== 'web') return;
    playerState.viewOffset = Math.round(_audio.currentTime * 1000);
    if (playerState.mode === 'web') {
      playerState.duration = Math.round((_audio.duration || 0) * 1000);
    }
    _updateProgressDOM();
  });

  _audio.addEventListener('ended', () => {
    playerState.playing    = false;
    playerState.paused     = false;
    playerState.viewOffset = 0;
    _updatePlayerBarDOM();
    _notifyListeners();

    // Repeat one: herstart
    if (playerState.repeat === 'one') {
      _audio.currentTime = 0;
      _audio.play().then(() => {
        playerState.playing = true;
        _updatePlayerBarDOM();
        _notifyListeners();
      });
      return;
    }
    // Volgende in queue
    _nextInQueue();
  });

  _audio.addEventListener('error', () => {
    _toast('⚠ Audio fout', '#e05a2b');
    playerState.playing = false;
    playerState.paused  = false;
    _updatePlayerBarDOM();
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// LOKALE VOORTGANG TICKER (voor Plex remote mode)
// ─────────────────────────────────────────────────────────────────────────────

function _startProgressTick() {
  if (_progressTimer) clearInterval(_progressTimer);
  _progressTimer = setInterval(() => {
    if (playerState.mode !== 'remote' || !playerState.playing) return;
    if (playerState.duration <= 0) return;
    playerState.viewOffset = Math.min(
      playerState.viewOffset + 1000,
      playerState.duration,
    );
    _updateProgressDOM();
  }, 1000);
}

// ─────────────────────────────────────────────────────────────────────────────
// DOM UPDATES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Pas track-info toe op de playerState en update de DOM.
 */
function _applyTrackInfo({ title, artist, album, thumb, playing, paused } = {}) {
  if (title   !== undefined) playerState.track   = title;
  if (artist  !== undefined) playerState.artist  = artist;
  if (album   !== undefined) playerState.album   = album;
  if (thumb   !== undefined) playerState.thumb   = thumb;
  if (playing !== undefined) playerState.playing = playing;
  if (paused  !== undefined) playerState.paused  = paused;
  _updatePlayerBarDOM();
  _notifyListeners();
}

/** Werk de volledige player bar DOM bij op basis van playerState. */
function _updatePlayerBarDOM() {
  const bar     = document.getElementById('player-bar');
  const titleEl = document.getElementById('player-title');
  const artistEl= document.getElementById('player-artist');
  const artEl   = document.getElementById('player-art');
  const playBtn = document.getElementById('player-play');

  const active = playerState.playing || playerState.paused;

  if (bar) {
    bar.classList.toggle('active', active);
    bar.classList.toggle('paused', playerState.paused);
    bar.classList.remove('hidden');
  }

  if (titleEl)  titleEl.textContent  = playerState.track  || 'Niet aan het afspelen';
  if (artistEl) artistEl.textContent = playerState.artist || '';

  if (artEl) {
    if (playerState.thumb) {
      artEl.src = playerState.thumb;
      artEl.style.display = '';
    } else {
      artEl.src = '';
      artEl.style.display = '';
    }
  }

  if (playBtn) {
    playBtn.textContent = (playerState.playing && !playerState.paused) ? '⏸' : '▶';
    playBtn.setAttribute('aria-label', playerState.playing && !playerState.paused
      ? 'Pauzeer' : 'Afspelen');
  }

  _updateProgressDOM();
}

/** Werk alleen de progress-balk en tijden bij (performance: geen full DOM sweep). */
function _updateProgressDOM() {
  const fillEl    = document.getElementById('player-progress-fill');
  const currentEl = document.getElementById('player-time-current');
  const totalEl   = document.getElementById('player-time-total');
  const progressEl= document.getElementById('player-progress');

  const offset   = playerState.mode === 'preview'
    || playerState.mode === 'web'
    ? Math.round((_audio.currentTime ?? 0) * 1000)
    : (playerState.viewOffset ?? 0);
  const duration = playerState.mode === 'preview'
    || playerState.mode === 'web'
    ? Math.round((_audio.duration  ?? 0) * 1000)
    : (playerState.duration ?? 0);

  const pct = duration > 0 ? Math.min((offset / duration) * 100, 100) : 0;

  if (fillEl)     fillEl.style.width   = `${pct.toFixed(1)}%`;
  if (progressEl) progressEl.setAttribute('aria-valuenow', pct.toFixed(0));
  if (currentEl)  currentEl.textContent = _formatMs(offset);
  if (totalEl)    totalEl.textContent   = _formatMs(duration);
}

/** Dispatch CustomEvent + roep listeners aan. */
function _notifyListeners() {
  const snapshot = getPlayerState();

  document.dispatchEvent(new CustomEvent('player-state-change', { detail: snapshot }));

  for (const cb of _listeners) {
    try { cb(snapshot); } catch (e) { console.warn('[Player] listener fout:', e); }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Laad zone uit localStorage (compatibel met bestaande plexRemote.js). */
function _loadZone() {
  try {
    const raw = localStorage.getItem(ZONE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

/** Formatteer milliseconden als M:SS. */
function _formatMs(ms) {
  if (!ms || ms <= 0) return '0:00';
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Toon een korte toast-melding. */
function _toast(msg, bg = '#333') {
  const id = 'player-toast';
  document.getElementById(id)?.remove();
  const el = document.createElement('div');
  el.id = id;
  Object.assign(el.style, {
    position:     'fixed',
    bottom:       '90px',
    left:         '50%',
    transform:    'translateX(-50%)',
    background:   bg,
    color:        '#fff',
    padding:      '10px 20px',
    borderRadius: '8px',
    zIndex:       '9999',
    fontSize:     '13px',
    fontFamily:   'sans-serif',
    boxShadow:    '0 4px 16px rgba(0,0,0,0.35)',
    pointerEvents:'none',
    whiteSpace:   'nowrap',
    transition:   'opacity .3s',
  });
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 350);
  }, 2650);
}
