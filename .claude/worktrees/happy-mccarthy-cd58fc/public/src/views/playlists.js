// ── View: Playlists ────────────────────────────────────────────────────────────
// Bevat twee views:
//   loadPlaylists()       → Discovery Engine (gegenereerde persoonlijke playlists)
//   loadPlaylistDetail()  → Detail van één Plex-afspeellijst

import { state } from '../state.js';
import { apiFetch } from '../api.js';
import { esc, fmt, proxyImg } from '../helpers.js';
import { switchView } from '../router.js';

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtMs(ms) {
  if (!ms) return '—';
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
function fmtMsDur(ms) {
  if (!ms) return '';
  return `${Math.round(ms / 60000)} min`;
}
function fmtRelTime(unixSec) {
  if (!unixSec) return '';
  const diff = Date.now() / 1000 - unixSec;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m geleden`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}u geleden`;
  return `${Math.floor(diff / 86400)}d geleden`;
}

const SEASON_NL = {
  spring: 'Lente', summer: 'Zomer', autumn: 'Herfst', winter: 'Winter',
  halloween: 'Halloween', christmas: 'Kerstmis', valentines: 'Valentijnsdag',
};
const SEASON_EMOJI = {
  spring: '🌸', summer: '☀️', autumn: '🍂', winter: '❄️',
  halloween: '🎃', christmas: '🎄', valentines: '❤️',
};
const TYPE_ICONS = {
  discovery_weekly:       '🔭',
  release_radar:          '📡',
  daily_mix:              '🎯',
  forgotten_favorites:    '🕰️',
  hidden_gems:            '💎',
  decade:                 '📅',
  seasonal:               '🌸',
  genre:                  '🎸',
  custom:                 '✨',
  // Nieuwe types
  because_you_listen_to:  '🎧',
  daily_genre_mixes:      '🎼',
  popular_picks:          '🔥',
  discovery_shuffle:      '🎲',
  familiar_favorites:     '⭐',
  custom_builder:         '🛠️',
};

function capitalizeFirst(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

// ── Cover-art collage ─────────────────────────────────────────────────────────
function coverCollage(tracks) {
  if (!tracks?.length) return `<div class="dpl-ph"><span>🎵</span></div>`;
  const covers = [];
  const seen = new Set();
  for (const t of tracks) {
    if (t.cover_url && !seen.has(t.cover_url)) { seen.add(t.cover_url); covers.push(t.cover_url); }
    if (covers.length >= 4) break;
  }
  if (!covers.length) return `<div class="dpl-ph"><span>🎵</span></div>`;
  if (covers.length === 1) return `<img class="dpl-single" src="${esc(covers[0])}" alt="" loading="lazy">`;
  while (covers.length < 4) covers.push(covers[covers.length - 1]);
  return `<div class="dpl-collage">${covers.map(u => `<img src="${esc(u)}" alt="" loading="lazy" onerror="this.style.opacity=0">`).join('')}</div>`;
}

// ── Module state ──────────────────────────────────────────────────────────────
let _catalog = [];
let _genres  = [];
let _season  = null;
let _gen     = new Set();
let _modal   = null;

// ── Playlist card ─────────────────────────────────────────────────────────────
function plCard(def, isGen) {
  const count = def.track_count || 0;
  const icon  = def.params?.season ? (SEASON_EMOJI[def.params.season] || '🎵') : (TYPE_ICONS[def.type] || '🎵');
  const key   = def.type + JSON.stringify(def.params || null);
  const thumb = def.cached && def.tracks ? coverCollage(def.tracks) : `<div class="dpl-ph"><span>${icon}</span></div>`;
  const playBtn = def.cached && count > 0
    ? `<button class="dpl-play-btn" data-type="${esc(def.type)}" data-params="${esc(JSON.stringify(def.params||null))}" title="Speel af">▶</button>`
    : '';
  return `<div class="dpl-card ${isGen ? 'is-gen' : ''} ${def.cached ? 'is-cached' : ''}"
    data-type="${esc(def.type)}" data-params="${esc(JSON.stringify(def.params||null))}" data-key="${esc(key)}">
    <div class="dpl-thumb" role="button" tabindex="0">${thumb}${playBtn}</div>
    <div class="dpl-body">
      <div class="dpl-name">${esc(def.name)}</div>
      <div class="dpl-meta">
        ${def.cached
          ? `<span class="dpl-badge dpl-ok">${count} tracks</span>`
          : `<span class="dpl-badge dpl-none">Niet gegenereerd</span>`}
        ${def.generated_at ? `<span class="dpl-age">${fmtRelTime(def.generated_at)}</span>` : ''}
      </div>
    </div>
    <div class="dpl-actions">
      <button class="dpl-btn dpl-gen-btn" data-type="${esc(def.type)}"
        data-params="${esc(JSON.stringify(def.params||null))}" title="Genereer opnieuw">
        ${isGen ? '<span class="dpl-spin"></span>' : '↺'}
      </button>
    </div>
  </div>`;
}

// ── Track-modal ───────────────────────────────────────────────────────────────
function openModal(def, tracks) {
  closeModal();
  const noKey = def.type === 'discovery_weekly' || def.type === 'release_radar';
  const rows = tracks.map((t, i) => {
    const dur     = fmtMs(t.duration);
    const cover   = t.cover_url
      ? `<img src="${esc(t.cover_url)}" alt="" loading="lazy" onerror="this.style.opacity=0">`
      : `<div class="dpl-tph">♪</div>`;
    const playAct = t.plex_key
      ? `<button class="dpl-tplay" data-key="${esc(t.plex_key)}">▶</button>`
      : `<span class="dpl-disc">Ontdek</span>`;
    const reason = t.reason ? `<span class="dpl-reason">via ${esc(t.reason)}</span>` : '';
    return `<div class="dpl-trow">
      <span class="dpl-tnum">${i + 1}</span>
      <div class="dpl-tcover">${cover}</div>
      <div class="dpl-tinfo">
        <div class="dpl-ttitle">${esc(t.title || t.album || '—')}</div>
        <div class="dpl-tsub">${esc(t.artist)}${t.album ? ` · ${esc(t.album)}` : ''}${reason}</div>
      </div>
      <span class="dpl-tdur">${dur}</span>
      <div class="dpl-tact">${playAct}</div>
    </div>`;
  }).join('');

  const playAll = !noKey
    ? `<button class="dpl-btn dpl-primary" id="dpl-play-all"
        data-type="${esc(def.type)}" data-params="${esc(JSON.stringify(def.params||null))}">▶ Speel Alles</button>`
    : '';

  document.body.insertAdjacentHTML('beforeend', `
    <div class="dpl-backdrop" id="dpl-backdrop">
      <div class="dpl-modal" role="dialog">
        <div class="dpl-mhdr">
          <h2 class="dpl-mtitle">${esc(def.name)}</h2>
          <div class="dpl-macts">
            ${playAll}
            <button class="dpl-btn" id="dpl-shuffle">⇌ Shuffle</button>
            <button class="dpl-mclose" id="dpl-mclose" aria-label="Sluiten">✕</button>
          </div>
        </div>
        <div class="dpl-mbody" id="dpl-mbody">
          <div class="dpl-tcount">${tracks.length} tracks</div>
          <div class="dpl-tlist" id="dpl-tlist">${rows}</div>
        </div>
      </div>
    </div>`);

  _modal = document.getElementById('dpl-backdrop');
  _modal.addEventListener('click', e => { if (e.target === _modal) closeModal(); });
  document.getElementById('dpl-mclose').addEventListener('click', closeModal);

  const esc2 = e => { if (e.key === 'Escape') { closeModal(); document.removeEventListener('keydown', esc2); } };
  document.addEventListener('keydown', esc2);

  document.getElementById('dpl-play-all')?.addEventListener('click', () => doPlayPlaylist(def.type, def.params));

  document.getElementById('dpl-shuffle')?.addEventListener('click', () => {
    const shuffled = [...tracks].sort(() => Math.random() - 0.5);
    document.getElementById('dpl-tlist').innerHTML = shuffled.map((t, i) => {
      const dur   = fmtMs(t.duration);
      const cover = t.cover_url ? `<img src="${esc(t.cover_url)}" alt="" loading="lazy">` : `<div class="dpl-tph">♪</div>`;
      const act   = t.plex_key ? `<button class="dpl-tplay" data-key="${esc(t.plex_key)}">▶</button>` : `<span class="dpl-disc">Ontdek</span>`;
      const reason = t.reason ? `<span class="dpl-reason">via ${esc(t.reason)}</span>` : '';
      return `<div class="dpl-trow"><span class="dpl-tnum">${i+1}</span>
        <div class="dpl-tcover">${cover}</div>
        <div class="dpl-tinfo"><div class="dpl-ttitle">${esc(t.title||t.album||'—')}</div>
        <div class="dpl-tsub">${esc(t.artist)}${t.album?` · ${esc(t.album)}`:''}${reason}</div></div>
        <span class="dpl-tdur">${dur}</span><div class="dpl-tact">${act}</div></div>`;
    }).join('');
    bindTrackPlay();
  });

  bindTrackPlay();
}

function bindTrackPlay() {
  document.querySelectorAll('.dpl-tplay').forEach(btn => {
    btn.addEventListener('click', () => doPlayTrack(btn.dataset.key, btn));
  });
}

function closeModal() { if (_modal) { _modal.remove(); _modal = null; } }

// ── Plex afspelen ─────────────────────────────────────────────────────────────
async function getMachineId() {
  const stored = localStorage.getItem('plex_machine_id');
  if (stored) return stored;
  try {
    const data = await apiFetch('/api/plex/clients');
    const clients = Array.isArray(data) ? data : (data.clients || []);
    if (clients.length) { localStorage.setItem('plex_machine_id', clients[0].machineId); return clients[0].machineId; }
  } catch {}
  return null;
}

async function doPlayTrack(plexKey, btn) {
  const mid = await getMachineId();
  if (!mid) { alert('Geen actieve Plex-speler gevonden.'); return; }
  try {
    btn?.classList.add('loading');
    await apiFetch(`/api/plex/play?machineId=${encodeURIComponent(mid)}&ratingKey=${encodeURIComponent(plexKey)}`, { method: 'POST' });
    btn?.classList.remove('loading');
    btn?.classList.add('played');
    setTimeout(() => btn?.classList.remove('played'), 3000);
  } catch (e) {
    btn?.classList.remove('loading');
    alert(`Afspelen mislukt: ${e.message}`);
  }
}

async function doPlayPlaylist(type, params) {
  const mid = await getMachineId();
  if (!mid) { alert('Geen actieve Plex-speler gevonden.'); return; }
  try {
    const ps = params ? Object.entries(params).map(([k,v]) => `${k}=${encodeURIComponent(v)}`).join('&') : '';
    await apiFetch(`/api/playlists/play/${type}?machineId=${encodeURIComponent(mid)}${ps?'&'+ps:''}`, { method: 'POST' });
  } catch (e) { alert(`Afspelen mislukt: ${e.message}`); }
}

// ── Genereer een playlist ─────────────────────────────────────────────────────
async function doGenerate(type, params, cardEl) {
  const key = type + JSON.stringify(params || null);
  if (_gen.has(key)) return;
  _gen.add(key);
  cardEl?.classList.add('is-gen');
  const btn = cardEl?.querySelector('.dpl-gen-btn');
  if (btn) btn.innerHTML = '<span class="dpl-spin"></span>';

  try {
    const ps  = params ? Object.entries(params).map(([k,v]) => `${k}=${encodeURIComponent(v)}`).join('&') : '';
    const data = await apiFetch(`/api/playlists/generate/${type}?force=true${ps?'&'+ps:''}`);

    // Update catalogus-entry
    const idx = _catalog.findIndex(d => d.type === type && JSON.stringify(d.params||null) === JSON.stringify(params||null));
    if (idx >= 0) Object.assign(_catalog[idx], { cached: true, track_count: data.track_count||data.tracks?.length||0, generated_at: data.generated_at, tracks: data.tracks });

    // Herrender kaart
    rerenderCard(type, params, data);
  } catch (e) { alert(`Generatie mislukt: ${e.message}`); }
  finally {
    _gen.delete(key);
    cardEl?.classList.remove('is-gen');
    if (btn) btn.innerHTML = '↺';
  }
}

function rerenderCard(type, params, data) {
  const key = type + JSON.stringify(params || null);
  const el  = document.querySelector(`.dpl-card[data-key="${CSS.escape(key)}"]`);
  if (!el) return;
  const def = _catalog.find(d => d.type === type && JSON.stringify(d.params||null) === JSON.stringify(params||null));
  if (!def) return;
  const tmp = document.createElement('div');
  tmp.innerHTML = plCard({ ...def, tracks: data.tracks }, false);
  const newEl = tmp.firstElementChild;
  el.replaceWith(newEl);
  bindCard(newEl);
}

// ── Card events ───────────────────────────────────────────────────────────────
function bindCard(card) {
  // Thumbnail → open modal
  card.querySelector('.dpl-thumb')?.addEventListener('click', async () => {
    const type   = card.dataset.type;
    const params = JSON.parse(card.dataset.params || 'null');

    if (!card.classList.contains('is-cached')) {
      await doGenerate(type, params, card);
      return;
    }
    try {
      const ps  = params ? Object.entries(params).map(([k,v]) => `${k}=${encodeURIComponent(v)}`).join('&') : '';
      const data = await apiFetch(`/api/playlists/generate/${type}${ps?'?'+ps:''}`);
      const def  = _catalog.find(d => d.type === type && JSON.stringify(d.params||null) === JSON.stringify(params||null))
                   || { type, name: type, params };
      openModal(def, data.tracks || []);
    } catch (e) { alert(`Laden mislukt: ${e.message}`); }
  });

  // Genereer-knop
  card.querySelector('.dpl-gen-btn')?.addEventListener('click', async e => {
    e.stopPropagation();
    await doGenerate(card.dataset.type, JSON.parse(card.dataset.params || 'null'), card);
  });

  // Play-knop op thumbnail
  card.querySelector('.dpl-play-btn')?.addEventListener('click', async e => {
    e.stopPropagation();
    await doPlayPlaylist(card.dataset.type, JSON.parse(card.dataset.params || 'null'));
  });
}

// ── Because You Listen To builder ────────────────────────────────────────────
let _byltSeeds = [];

function bindBecauseYouListenTo() {
  const input   = document.getElementById('dpl-bylt-input');
  const addBtn  = document.getElementById('dpl-bylt-add');
  const genBtn  = document.getElementById('dpl-bylt-gen');
  const seedsEl = document.getElementById('dpl-bylt-seeds');
  const resultEl= document.getElementById('dpl-bylt-result');
  const dl      = document.getElementById('dpl-artists-dl2');

  const render = () => {
    seedsEl.innerHTML = _byltSeeds.map((s, i) =>
      `<span class="dpl-stag">${esc(s)}<button class="dpl-srem" data-i="${i}">✕</button></span>`
    ).join('');
    genBtn.disabled = !_byltSeeds.length;
    seedsEl.querySelectorAll('.dpl-srem').forEach(b => {
      b.addEventListener('click', () => { _byltSeeds.splice(+b.dataset.i, 1); render(); });
    });
  };

  const addSeed = () => {
    const v = input?.value.trim();
    if (!v || _byltSeeds.includes(v) || _byltSeeds.length >= 5) return;
    _byltSeeds.push(v);
    if (input) input.value = '';
    render();
  };

  addBtn?.addEventListener('click', addSeed);
  input?.addEventListener('keydown', e => { if (e.key === 'Enter') addSeed(); });

  let _act2;
  input?.addEventListener('input', () => {
    clearTimeout(_act2);
    const q = input.value.trim();
    if (q.length < 2) return;
    _act2 = setTimeout(async () => {
      try {
        const d = await apiFetch(`/api/plex/search?q=${encodeURIComponent(q)}`);
        const artists = (d.artists || []).map(a => a.title || a.name);
        if (dl) dl.innerHTML = artists.map(a => `<option value="${esc(a)}">`).join('');
      } catch {}
    }, 250);
  });

  genBtn?.addEventListener('click', async () => {
    if (!_byltSeeds.length) return;
    genBtn.disabled = true; genBtn.textContent = 'Genereren…';
    resultEl.innerHTML = `<div class="dpl-loading"><span class="dpl-spin"></span> Even geduld…</div>`;
    try {
      const data = await apiFetch(
        `/api/playlists/generate/because_you_listen_to?force=true&seeds=${encodeURIComponent(_byltSeeds.join(','))}`
      );
      const tracks = data.tracks || [];
      if (!tracks.length) {
        resultEl.innerHTML = `<p class="dpl-empty">Geen vergelijkbare artiesten gevonden in je bibliotheek.</p>`;
      } else {
        resultEl.innerHTML = `<div class="dpl-cres">
          <strong>${tracks.length} tracks</strong> gevonden —
          <button class="dpl-btn dpl-primary" id="dpl-open-bylt">Bekijk →</button>
        </div>`;
        document.getElementById('dpl-open-bylt')?.addEventListener('click', () => {
          openModal({
            type: 'because_you_listen_to',
            name: `Omdat je luistert naar: ${_byltSeeds.slice(0,2).join(', ')}`,
            params: { seeds: _byltSeeds },
          }, tracks);
        });
      }
    } catch (e) { resultEl.innerHTML = `<p class="dpl-err">Fout: ${esc(e.message)}</p>`; }
    finally { genBtn.disabled = false; genBtn.textContent = 'Genereer'; }
  });
}

// ── Custom playlist builder ───────────────────────────────────────────────────
let _seeds = [];

function bindCustomBuilder() {
  const input = document.getElementById('dpl-seed-input');
  const addBtn = document.getElementById('dpl-seed-add');
  const genBtn = document.getElementById('dpl-custom-gen');
  const seedsEl = document.getElementById('dpl-seeds');
  const resultEl = document.getElementById('dpl-custom-result');
  const dl = document.getElementById('dpl-artists-dl');

  const render = () => {
    seedsEl.innerHTML = _seeds.map((s, i) =>
      `<span class="dpl-stag">${esc(s)}<button class="dpl-srem" data-i="${i}">✕</button></span>`
    ).join('');
    genBtn.disabled = !_seeds.length;
    seedsEl.querySelectorAll('.dpl-srem').forEach(b => {
      b.addEventListener('click', () => { _seeds.splice(+b.dataset.i, 1); render(); });
    });
  };

  const addSeed = () => {
    const v = input?.value.trim();
    if (!v || _seeds.includes(v) || _seeds.length >= 5) return;
    _seeds.push(v); if (input) input.value = ''; render();
  };

  addBtn?.addEventListener('click', addSeed);
  input?.addEventListener('keydown', e => { if (e.key === 'Enter') addSeed(); });

  // Autocomplete
  let _act;
  input?.addEventListener('input', () => {
    clearTimeout(_act);
    const q = input.value.trim();
    if (q.length < 2) return;
    _act = setTimeout(async () => {
      try {
        const d = await apiFetch(`/api/plex/search?q=${encodeURIComponent(q)}`);
        const artists = (d.artists || []).map(a => a.title || a.name);
        if (dl) dl.innerHTML = artists.map(a => `<option value="${esc(a)}">`).join('');
      } catch {}
    }, 250);
  });

  // Slider waarden live tonen
  document.getElementById('dpl-track-count')?.addEventListener('input', function() {
    const el = document.getElementById('dpl-tc-val');
    if (el) el.textContent = this.value;
  });
  document.getElementById('dpl-diversity')?.addEventListener('input', function() {
    const el = document.getElementById('dpl-div-val');
    if (el) el.textContent = this.value + '%';
  });

  genBtn?.addEventListener('click', async () => {
    if (!_seeds.length) return;
    genBtn.disabled = true; genBtn.textContent = 'Genereren…';
    resultEl.innerHTML = `<div class="dpl-loading"><span class="dpl-spin"></span> Even geduld…</div>`;

    const trackCount  = document.getElementById('dpl-track-count')?.value || 50;
    const diversity   = (parseInt(document.getElementById('dpl-diversity')?.value || 50) / 100).toFixed(2);
    const inclSeeds   = document.getElementById('dpl-include-seeds')?.checked !== false;

    try {
      const url = `/api/playlists/generate/custom_builder?force=true` +
        `&seeds=${encodeURIComponent(_seeds.join(','))}` +
        `&trackCount=${trackCount}&diversity=${diversity}&includeSeeds=${inclSeeds}`;
      const data   = await apiFetch(url);
      const tracks = data.tracks || [];
      if (!tracks.length) {
        resultEl.innerHTML = `<p class="dpl-empty">Geen tracks gevonden.</p>`;
      } else {
        resultEl.innerHTML = `<div class="dpl-cres">
          <strong>${tracks.length} tracks</strong> gevonden —
          <button class="dpl-btn dpl-primary" id="dpl-open-custom">Bekijk →</button>
        </div>`;
        document.getElementById('dpl-open-custom')?.addEventListener('click', () => {
          openModal({
            type: 'custom_builder',
            name: `Builder Mix: ${_seeds.slice(0,2).join(', ')}`,
            params: { seeds: _seeds, trackCount, diversityFactor: diversity, includeSeeds: inclSeeds },
          }, tracks);
        });
      }
    } catch (e) { resultEl.innerHTML = `<p class="dpl-err">Fout: ${esc(e.message)}</p>`; }
    finally { genBtn.disabled = false; genBtn.textContent = 'Genereer Mix'; }
  });
}

// ── Render hoofdpagina ────────────────────────────────────────────────────────
async function renderDiscovery(data) {
  _catalog = data.catalog || [];
  _genres  = data.genres  || [];
  _season  = data.current_season;

  const hero     = _catalog.filter(d => ['discovery_weekly', 'release_radar'].includes(d.type));
  const main     = _catalog.filter(d => ['daily_mix', 'forgotten_favorites', 'hidden_gems', 'popular_picks', 'discovery_shuffle', 'familiar_favorites'].includes(d.type));
  const seasonal = _catalog.filter(d => d.type === 'seasonal');
  const decades  = _catalog.filter(d => d.type === 'decade');
  const activeSeason = seasonal.find(s => s.params?.season === _season);
  const otherSeasons = seasonal.filter(s => s.params?.season !== _season);
  const topGenres = _genres.slice(0, 12);

  // Plex native playlists (optioneel, best-effort)
  let plexPlaylists = [];
  try {
    const plexData = await apiFetch('/api/plex/playlists', { signal: state.tabAbort?.signal });
    plexPlaylists = (plexData?.playlists || plexData || []).slice(0, 8);
  } catch {}

  const heroHtml = hero.map(def => {
    const key   = def.type + JSON.stringify(def.params || null);
    const isGen = _gen.has(key);
    const icon  = TYPE_ICONS[def.type] || '🎵';
    const bg    = def.cached && def.tracks ? coverCollage(def.tracks)
      : `<div class="dpl-ph big"><span>${icon}</span></div>`;
    return `<div class="dpl-hero-card ${isGen?'is-gen':''} ${def.cached?'is-cached':''}"
      data-type="${esc(def.type)}" data-params="${esc(JSON.stringify(def.params||null))}" data-key="${esc(key)}">
      <div class="dpl-hero-bg">${bg}</div>
      <div class="dpl-hero-cnt">
        <span class="dpl-hero-icon">${icon}</span>
        <h2 class="dpl-hero-title">${esc(def.name)}</h2>
        <p class="dpl-hero-desc">${esc(def.description||'')}</p>
        <div class="dpl-hero-meta">
          ${def.cached ? `<span class="dpl-badge dpl-ok">${def.track_count} tracks</span>` : `<span class="dpl-badge dpl-none">Nog niet gegenereerd</span>`}
          ${def.generated_at ? `<span class="dpl-age">${fmtRelTime(def.generated_at)}</span>` : ''}
        </div>
        <div class="dpl-hero-btns">
          ${def.cached && def.track_count > 0
            ? `<button class="dpl-btn dpl-primary dpl-hero-play" data-type="${esc(def.type)}" data-params="null">▶ Speel Af</button>` : ''}
          <button class="dpl-btn dpl-hero-gen" data-type="${esc(def.type)}" data-params="${esc(JSON.stringify(def.params||null))}">
            ${isGen ? '<span class="dpl-spin"></span> Bezig…' : (def.cached ? '↺ Vernieuw' : '⚡ Genereer')}
          </button>
        </div>
      </div>
    </div>`;
  }).join('');

  const gridCards = (defs) => defs.map(def => {
    const key = def.type + JSON.stringify(def.params||null);
    return plCard(def, _gen.has(key));
  }).join('');

  const plexSection = plexPlaylists.length ? `
    <section class="dpl-section">
      <h2 class="dpl-stitle">📂 Plex Afspeellijsten</h2>
      <div class="dpl-scroll-row">
        ${plexPlaylists.map(pl => {
          const img = pl.thumb ? proxyImg(pl.thumb, 200) : null;
          return `<button class="dpl-plex-card" data-id="${esc(pl.ratingKey)}" data-title="${esc(pl.title)}" aria-label="${esc(pl.title)}">
            <div class="dpl-plex-art">${img ? `<img src="${esc(img)}" alt="" loading="lazy">` : `<div class="dpl-ph"><span>♫</span></div>`}</div>
            <div class="dpl-plex-name">${esc(pl.title)}</div>
            <div class="dpl-plex-meta">${pl.trackCount || 0} nrs${pl.duration ? ' · ' + fmtMsDur(pl.duration) : ''}</div>
          </button>`;
        }).join('')}
      </div>
    </section>` : '';

  document.getElementById('content').innerHTML = `
    <div class="dpl-page">
      <div class="dpl-hdr">
        <h1 class="dpl-page-title">🎵 Discovery Engine</h1>
        <p class="dpl-page-sub">Gepersonaliseerde playlists op basis van jouw luisterdata + Plex-bibliotheek</p>
      </div>

      <section class="dpl-section dpl-hero-section">
        ${heroHtml}
      </section>

      <section class="dpl-section">
        <h2 class="dpl-stitle">Jouw Mix</h2>
        <div class="dpl-grid">${gridCards(main)}</div>
      </section>

      ${activeSeason ? `
      <section class="dpl-section">
        <h2 class="dpl-stitle">${SEASON_EMOJI[_season]||'🌸'} Seizoen: ${SEASON_NL[_season]||_season}</h2>
        <div class="dpl-grid dpl-grid-1">${plCard(activeSeason, _gen.has(activeSeason.type + JSON.stringify(activeSeason.params)))}</div>
      </section>` : ''}

      <section class="dpl-section">
        <h2 class="dpl-stitle">📅 Per Decennium</h2>
        <div class="dpl-scroll-row">${gridCards(decades)}</div>
      </section>

      ${topGenres.length ? `
      <section class="dpl-section">
        <h2 class="dpl-stitle">🎸 Genres</h2>
        <div class="dpl-scroll-row">
          ${topGenres.map(genre => {
            const params = { genre };
            const key    = 'genre' + JSON.stringify(params);
            const saved  = _catalog.find(d => d.type === 'genre' && d.params?.genre === genre);
            const gdef   = {
              type: 'genre', name: capitalizeFirst(genre),
              description: `Jouw tracks in het ${genre} genre`,
              params, cached: !!saved?.cached, track_count: saved?.track_count || 0,
              generated_at: saved?.generated_at || null, tracks: saved?.tracks || null,
            };
            return plCard(gdef, _gen.has(key));
          }).join('')}
        </div>
      </section>` : ''}

      ${otherSeasons.length ? `
      <section class="dpl-section">
        <h2 class="dpl-stitle">🗓️ Andere Seizoenen</h2>
        <div class="dpl-scroll-row">${gridCards(otherSeasons)}</div>
      </section>` : ''}

      ${plexSection}

      <section class="dpl-section dpl-custom-wrap">
        <h2 class="dpl-stitle">🎧 Omdat je luistert naar…</h2>
        <p class="dpl-custom-hint">Vul 1–5 artiesten in — wij vinden vergelijkbare artiesten die al in je Plex-bibliotheek staan.</p>
        <div class="dpl-custom-form">
          <div class="dpl-seeds" id="dpl-bylt-seeds"></div>
          <div class="dpl-input-row">
            <input type="text" id="dpl-bylt-input" class="dpl-input"
              placeholder="Artiestnaam…" autocomplete="off" list="dpl-artists-dl2">
            <datalist id="dpl-artists-dl2"></datalist>
            <button class="dpl-btn" id="dpl-bylt-add">+</button>
          </div>
          <button class="dpl-btn dpl-primary" id="dpl-bylt-gen" disabled>Genereer</button>
        </div>
        <div id="dpl-bylt-result"></div>
      </section>

      <section class="dpl-section dpl-custom-wrap">
        <h2 class="dpl-stitle">🛠️ Geavanceerde Playlist Builder</h2>
        <p class="dpl-custom-hint">Bouw een volledig gepersonaliseerde mix met controle over diversiteit en aantal tracks.</p>
        <div class="dpl-custom-form">
          <div class="dpl-seeds" id="dpl-seeds"></div>
          <div class="dpl-input-row">
            <input type="text" id="dpl-seed-input" class="dpl-input"
              placeholder="Artiestnaam…" autocomplete="off" list="dpl-artists-dl">
            <datalist id="dpl-artists-dl"></datalist>
            <button class="dpl-btn" id="dpl-seed-add">+</button>
          </div>
          <div class="dpl-builder-opts">
            <label class="dpl-opt-label">Tracks: <span id="dpl-tc-val">50</span>
              <input type="range" id="dpl-track-count" min="30" max="100" value="50" step="5" class="dpl-range">
            </label>
            <label class="dpl-opt-label">Diversiteit: <span id="dpl-div-val">50%</span>
              <input type="range" id="dpl-diversity" min="0" max="100" value="50" class="dpl-range">
            </label>
            <label class="dpl-opt-label dpl-opt-check">
              <input type="checkbox" id="dpl-include-seeds" checked> Seed-artiesten zelf opnemen
            </label>
          </div>
          <button class="dpl-btn dpl-primary" id="dpl-custom-gen" disabled>Genereer Mix</button>
        </div>
        <div id="dpl-custom-result"></div>
      </section>
    </div>

    ${styles()}`;

  // Bind hero
  document.querySelectorAll('.dpl-hero-card').forEach(card => {
    card.querySelector('.dpl-hero-gen')?.addEventListener('click', async () => {
      const type   = card.dataset.type;
      const params = JSON.parse(card.dataset.params || 'null');
      const genBtn = card.querySelector('.dpl-hero-gen');
      const key    = type + JSON.stringify(params || null);
      if (_gen.has(key)) return;
      _gen.add(key);
      if (genBtn) { genBtn.classList.add('loading'); genBtn.innerHTML = '<span class="dpl-spin"></span> Bezig…'; }
      try {
        const ps  = params ? Object.entries(params).map(([k,v]) => `${k}=${encodeURIComponent(v)}`).join('&') : '';
        const data = await apiFetch(`/api/playlists/generate/${type}?force=true${ps?'&'+ps:''}`);
        const def  = _catalog.find(d => d.type === type) || { type, name: type, params };
        Object.assign(def, { cached: true, track_count: data.track_count||0, tracks: data.tracks });
        openModal(def, data.tracks || []);
      } catch (e) { alert(`Generatie mislukt: ${e.message}`); }
      finally {
        _gen.delete(key);
        if (genBtn) { genBtn.classList.remove('loading'); genBtn.innerHTML = '↺ Vernieuw'; }
      }
    });
    card.querySelector('.dpl-hero-play')?.addEventListener('click', async e => {
      e.stopPropagation();
      await doPlayPlaylist(card.dataset.type, JSON.parse(card.dataset.params || 'null'));
    });
    card.addEventListener('click', async e => {
      if (e.target.closest('button')) return;
      if (!card.classList.contains('is-cached')) return;
      const type   = card.dataset.type;
      const params = JSON.parse(card.dataset.params || 'null');
      try {
        const ps   = params ? Object.entries(params).map(([k,v]) => `${k}=${encodeURIComponent(v)}`).join('&') : '';
        const data = await apiFetch(`/api/playlists/generate/${type}${ps?'?'+ps:''}`);
        const def  = _catalog.find(d => d.type === type) || { type, name: type, params };
        openModal(def, data.tracks || []);
      } catch {}
    });
  });

  // Bind alle kaarten
  document.querySelectorAll('.dpl-card').forEach(bindCard);

  // Bind Plex playlist knoppen
  document.querySelectorAll('.dpl-plex-card').forEach(btn => {
    btn.addEventListener('click', () => {
      state.viewParams = { id: btn.dataset.id, title: btn.dataset.title };
      switchView('playlist-detail');
    });
  });

  bindBecauseYouListenTo();
  bindCustomBuilder();
}

// ═══════════════════════════════════════════════════════════════════════════
// Mirrored Playlists Tab
// ═══════════════════════════════════════════════════════════════════════════

const PLATFORM_ICONS = {
  spotify: '🟢',
  deezer:  '🟠',
  youtube: '🔴',
  tidal:   '🔵',
};
const PLATFORM_NAMES = {
  spotify: 'Spotify',
  deezer:  'Deezer',
  youtube: 'YouTube',
  tidal:   'Tidal',
};

function fmtSyncAge(unixSec) {
  if (!unixSec) return 'Nooit gesynchroniseerd';
  const diff = Math.floor(Date.now() / 1000) - unixSec;
  if (diff < 60)    return 'Zojuist';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m geleden`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}u geleden`;
  return `${Math.floor(diff / 86400)}d geleden`;
}

function matchPercent(pl) {
  if (!pl.track_count) return 0;
  return Math.round((pl.matched_count / pl.track_count) * 100);
}

function mirrorCard(pl) {
  const icon    = PLATFORM_ICONS[pl.source_platform] || '🎵';
  const pName   = PLATFORM_NAMES[pl.source_platform] || pl.source_platform;
  const pct     = matchPercent(pl);
  const barColor = pct >= 80 ? '#5cb85c' : pct >= 40 ? '#f0ad4e' : '#e05555';

  return `<div class="mir-card" data-id="${pl.id}">
    <div class="mir-card-hdr">
      <span class="mir-platform">${icon} ${esc(pName)}</span>
      ${pl.auto_sync ? '<span class="mir-badge mir-auto">Auto-sync</span>' : ''}
    </div>
    <div class="mir-card-name">${esc(pl.name)}</div>
    <div class="mir-card-stats">
      <div class="mir-pbar-wrap">
        <div class="mir-pbar" style="width:${pct}%;background:${barColor}"></div>
      </div>
      <div class="mir-stat-row">
        <span>${pl.matched_count}/${pl.track_count} in Plex</span>
        <span class="mir-age">${fmtSyncAge(pl.last_synced)}</span>
      </div>
    </div>
    <div class="mir-card-actions">
      <button class="dpl-btn mir-btn-tracks" data-id="${pl.id}" title="Bekijk tracks">Tracks</button>
      <button class="dpl-btn mir-btn-sync"   data-id="${pl.id}" title="Nu synchroniseren">↺ Sync</button>
      <button class="dpl-btn mir-btn-dl"     data-id="${pl.id}" title="Download ontbrekende tracks">⬇ Downloaden</button>
      <button class="dpl-btn mir-btn-del"    data-id="${pl.id}" title="Verwijder gespiegelde playlist">✕</button>
    </div>
  </div>`;
}

async function renderMirrored(container) {
  container.innerHTML = `<div class="dpl-loading"><span class="dpl-spin"></span> Laden…</div>`;

  let playlists = [];
  try {
    playlists = await apiFetch('/api/mirrored');
  } catch (err) {
    container.innerHTML = `<div class="dpl-err">⚠️ Laden mislukt: ${esc(err.message)}</div>`;
    return;
  }

  container.innerHTML = `
    <div class="mir-toolbar">
      <input class="dpl-input mir-url-input" id="mir-url-input" type="url"
        placeholder="Plak een Spotify / Deezer / YouTube / Tidal playlist-URL…">
      <button class="dpl-btn dpl-primary" id="mir-add-btn">+ Toevoegen</button>
    </div>
    <div id="mir-add-msg" class="mir-msg"></div>
    <div class="mir-grid" id="mir-grid">
      ${playlists.length
        ? playlists.map(mirrorCard).join('')
        : `<div class="dpl-empty">Nog geen gespiegelde playlists. Voeg er een toe hierboven.</div>`}
    </div>
    <div id="mir-tracks-panel" class="mir-tracks-panel" style="display:none"></div>`;

  // ── Toevoegen ──────────────────────────────────────────────────────────
  const urlInput = container.querySelector('#mir-url-input');
  const addBtn   = container.querySelector('#mir-add-btn');
  const addMsg   = container.querySelector('#mir-add-msg');

  addBtn.addEventListener('click', async () => {
    const url = urlInput.value.trim();
    if (!url) return;
    addBtn.disabled = true;
    addBtn.textContent = '⏳ Toevoegen…';
    addMsg.textContent = '';
    addMsg.className = 'mir-msg';
    try {
      const pl = await apiFetch('/api/mirrored', { method: 'POST', body: JSON.stringify({ url }) });
      addMsg.textContent = `✓ "${pl.name}" toegevoegd (${pl.track_count} tracks, ${pl.matched_count} in Plex)`;
      addMsg.className = 'mir-msg mir-ok';
      urlInput.value = '';
      await renderMirrored(container);
    } catch (err) {
      addMsg.textContent = `⚠️ ${err.message}`;
      addMsg.className = 'mir-msg mir-err';
    } finally {
      addBtn.disabled = false;
      addBtn.textContent = '+ Toevoegen';
    }
  });

  urlInput.addEventListener('keydown', e => { if (e.key === 'Enter') addBtn.click(); });

  // ── Delegated events op cards ──────────────────────────────────────────
  const grid = container.querySelector('#mir-grid');
  const tracksPanel = container.querySelector('#mir-tracks-panel');

  grid.addEventListener('click', async e => {
    const id = e.target.dataset?.id;
    if (!id) return;

    // Tracks bekijken
    if (e.target.classList.contains('mir-btn-tracks')) {
      await showMirroredTracks(parseInt(id, 10), tracksPanel, grid);
      return;
    }

    // Sync
    if (e.target.classList.contains('mir-btn-sync')) {
      const btn = e.target;
      btn.disabled = true;
      btn.textContent = '⏳';
      try {
        const result = await apiFetch(`/api/mirrored/${id}/sync`, { method: 'POST' });
        btn.textContent = `✓ ${result.matched_count}/${result.track_count}`;
        setTimeout(() => {
          btn.disabled = false;
          btn.textContent = '↺ Sync';
          renderMirrored(container);
        }, 2000);
      } catch (err) {
        btn.textContent = '⚠️';
        btn.disabled = false;
        setTimeout(() => { btn.textContent = '↺ Sync'; }, 2000);
      }
      return;
    }

    // Download ontbrekende
    if (e.target.classList.contains('mir-btn-dl')) {
      const btn = e.target;
      btn.disabled = true;
      btn.textContent = '⏳ Bezig…';
      try {
        const result = await apiFetch(`/api/mirrored/${id}/download-missing`, { method: 'POST' });
        btn.textContent = `✓ ${result.queued} in wachtrij`;
        setTimeout(() => { btn.disabled = false; btn.textContent = '⬇ Downloaden'; }, 3000);
      } catch (err) {
        btn.textContent = '⚠️ Fout';
        setTimeout(() => { btn.disabled = false; btn.textContent = '⬇ Downloaden'; }, 2500);
      }
      return;
    }

    // Verwijderen
    if (e.target.classList.contains('mir-btn-del')) {
      if (!confirm('Gespiegelde playlist verwijderen?')) return;
      try {
        await apiFetch(`/api/mirrored/${id}`, { method: 'DELETE' });
        await renderMirrored(container);
      } catch {}
      return;
    }
  });
}

async function showMirroredTracks(playlistId, panel, grid) {
  panel.style.display = 'block';
  panel.innerHTML = `<div class="dpl-loading"><span class="dpl-spin"></span> Tracks laden…</div>`;
  panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  let data;
  try {
    data = await apiFetch(`/api/mirrored/${playlistId}/tracks`);
  } catch (err) {
    panel.innerHTML = `<div class="dpl-err">⚠️ ${esc(err.message)}</div>`;
    return;
  }

  const { playlist, tracks } = data;

  const statusLabel = {
    matched:     { label: '✓ In Plex',    cls: 'mir-s-ok' },
    unmatched:   { label: '✕ Ontbreekt',  cls: 'mir-s-miss' },
    downloading: { label: '⬇ Bezig',      cls: 'mir-s-dl' },
    downloaded:  { label: '✓ Gedownload', cls: 'mir-s-dl' },
    pending:     { label: '⋯ Pending',    cls: 'mir-s-pend' },
  };

  const rows = tracks.map(t => {
    const s = statusLabel[t.match_status] || statusLabel.pending;
    const conf = t.match_confidence ? `${Math.round(t.match_confidence * 100)}%` : '';
    return `<div class="mir-trow">
      <span class="mir-tstatus ${s.cls}">${s.label}</span>
      <div class="mir-tinfo">
        <div class="mir-ttitle">${esc(t.source_title)}</div>
        <div class="mir-tsub">${esc(t.source_artist)}${t.source_album ? ` · ${esc(t.source_album)}` : ''}</div>
      </div>
      <span class="mir-tconf">${conf}</span>
      ${t.match_status === 'matched'
        ? `<button class="dpl-btn mir-unmatch" data-track="${t.id}" data-pl="${playlistId}" title="Ontkoppel van Plex">Unmatch</button>`
        : (t.unmatched
          ? `<button class="dpl-btn mir-rematch" data-track="${t.id}" data-pl="${playlistId}" title="Opnieuw matchen">Rematch</button>`
          : '')}
    </div>`;
  }).join('');

  panel.innerHTML = `
    <div class="mir-tp-hdr">
      <span class="mir-tp-title">${esc(playlist.name)}</span>
      <span class="mir-tp-stat">${playlist.matched_count}/${playlist.track_count} in Plex</span>
      <button class="dpl-btn" id="mir-tp-close">✕ Sluiten</button>
    </div>
    <div class="mir-tlist">${rows || '<div class="dpl-empty">Geen tracks gevonden.</div>'}</div>`;

  panel.querySelector('#mir-tp-close')?.addEventListener('click', () => {
    panel.style.display = 'none';
    panel.innerHTML = '';
  });

  // Unmatch / rematch knoppen
  panel.addEventListener('click', async e => {
    if (e.target.classList.contains('mir-unmatch')) {
      const trackId = e.target.dataset.track;
      const plId    = e.target.dataset.pl;
      try {
        await apiFetch(`/api/mirrored/${plId}/tracks/${trackId}/unmatch`, {
          method: 'POST', body: JSON.stringify({ unmatched: true }),
        });
        await showMirroredTracks(parseInt(plId, 10), panel, grid);
      } catch {}
    }
    if (e.target.classList.contains('mir-rematch')) {
      const trackId = e.target.dataset.track;
      const plId    = e.target.dataset.pl;
      try {
        await apiFetch(`/api/mirrored/${plId}/tracks/${trackId}/unmatch`, {
          method: 'POST', body: JSON.stringify({ unmatched: false }),
        });
        await showMirroredTracks(parseInt(plId, 10), panel, grid);
      } catch {}
    }
  });
}

function styles() {
  return `<style>
.dpl-page{padding:1.5rem;max-width:1400px}
.dpl-hdr{margin-bottom:1.75rem}
.dpl-page-title{font-size:1.6rem;font-weight:700;margin:0 0 .2rem}
.dpl-page-sub{color:var(--color-secondary);font-size:.875rem;margin:0}
.dpl-section{margin-bottom:2.25rem}
.dpl-stitle{font-size:1rem;font-weight:600;margin:0 0 .875rem}
/* Hero */
.dpl-hero-section{display:grid;grid-template-columns:1fr 1fr;gap:1.25rem}
@media(max-width:640px){.dpl-hero-section{grid-template-columns:1fr}}
.dpl-hero-card{position:relative;border-radius:14px;overflow:hidden;background:var(--color-surface,#1e1e1e);min-height:190px;cursor:pointer;transition:transform .15s}
.dpl-hero-card:hover{transform:scale(1.01)}
.dpl-hero-bg{position:absolute;inset:0;opacity:.3;filter:blur(3px)}
.dpl-hero-bg .dpl-collage,.dpl-hero-bg img,.dpl-hero-bg .dpl-single{width:100%;height:100%;object-fit:cover}
.dpl-hero-bg .dpl-collage{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr}
.dpl-hero-bg .dpl-collage img{width:100%;height:100%;object-fit:cover}
.dpl-hero-cnt{position:relative;z-index:1;padding:1.25rem;display:flex;flex-direction:column;gap:.45rem}
.dpl-hero-icon{font-size:2rem;line-height:1}
.dpl-hero-title{font-size:1.2rem;font-weight:700;margin:0}
.dpl-hero-desc{color:var(--color-secondary);font-size:.82rem;margin:0}
.dpl-hero-meta{display:flex;gap:.5rem;align-items:center;flex-wrap:wrap}
.dpl-hero-btns{display:flex;gap:.5rem;flex-wrap:wrap;margin-top:.2rem}
/* Grid */
.dpl-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:.9rem}
.dpl-grid-1{grid-template-columns:minmax(170px,260px)}
/* Scroll row */
.dpl-scroll-row{display:flex;gap:.9rem;overflow-x:auto;padding-bottom:.6rem;scrollbar-width:thin}
.dpl-scroll-row .dpl-card{flex:0 0 160px}
/* Card */
.dpl-card{border-radius:10px;overflow:hidden;background:var(--color-surface,#1e1e1e);transition:transform .15s,box-shadow .15s}
.dpl-card:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,.3)}
.dpl-card.is-gen{opacity:.65;pointer-events:none}
.dpl-thumb{position:relative;aspect-ratio:1;cursor:pointer;overflow:hidden;background:var(--color-border,#333)}
.dpl-collage{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;height:100%}
.dpl-collage img{width:100%;height:100%;object-fit:cover}
.dpl-single{width:100%;height:100%;object-fit:cover;display:block}
.dpl-ph{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:2.2rem;background:var(--color-border,#333)}
.dpl-ph.big{font-size:3.5rem}
.dpl-play-btn{background:rgba(0,0,0,.65);color:#fff;border:none;border-radius:50%;width:34px;height:34px;cursor:pointer;font-size:.9rem;position:absolute;bottom:.5rem;right:.5rem;display:flex;align-items:center;justify-content:center;transition:background .15s}
.dpl-play-btn:hover{background:var(--color-accent,#6c63ff)}
.dpl-body{padding:.65rem .65rem .2rem}
.dpl-name{font-size:.82rem;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:.2rem}
.dpl-meta{display:flex;gap:.35rem;align-items:center;flex-wrap:wrap}
.dpl-actions{padding:.25rem .65rem .55rem;display:flex;justify-content:flex-end}
/* Plex cards */
.dpl-plex-card{flex:0 0 130px;background:var(--color-surface,#1e1e1e);border:none;border-radius:8px;overflow:hidden;cursor:pointer;text-align:left;padding:0;transition:transform .15s}
.dpl-plex-card:hover{transform:translateY(-2px)}
.dpl-plex-art{aspect-ratio:1;overflow:hidden;background:var(--color-border,#333)}
.dpl-plex-art img{width:100%;height:100%;object-fit:cover}
.dpl-plex-name{font-size:.78rem;font-weight:600;padding:.4rem .5rem .1rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dpl-plex-meta{font-size:.7rem;color:var(--color-secondary);padding:0 .5rem .4rem}
/* Buttons */
.dpl-btn{padding:.3rem .65rem;border-radius:6px;border:none;cursor:pointer;font-size:.8rem;background:var(--color-border,#444);color:var(--color-text);transition:background .15s}
.dpl-btn:hover{background:var(--color-accent,#6c63ff);color:#fff}
.dpl-btn:disabled{opacity:.45;cursor:not-allowed}
.dpl-primary{background:var(--color-accent,#6c63ff);color:#fff}
.dpl-primary:hover{background:var(--color-accent-hover,#5a52e0)}
.dpl-gen-btn{min-width:28px;font-size:.75rem}
.dpl-hero-gen,.dpl-hero-play{padding:.45rem .9rem;font-size:.85rem}
/* Badges */
.dpl-badge{font-size:.68rem;padding:.12rem .38rem;border-radius:4px;font-weight:600;white-space:nowrap}
.dpl-ok{background:rgba(99,197,99,.2);color:#5cb85c}
.dpl-none{background:rgba(150,150,150,.12);color:var(--color-secondary)}
.dpl-age{font-size:.68rem;color:var(--color-secondary)}
/* Spinner */
.dpl-spin{display:inline-block;width:11px;height:11px;border:2px solid currentColor;border-top-color:transparent;border-radius:50%;animation:dpl-rot .6s linear infinite;vertical-align:middle}
@keyframes dpl-rot{to{transform:rotate(360deg)}}
/* Modal */
.dpl-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.72);z-index:1100;display:flex;align-items:center;justify-content:center;padding:1rem}
.dpl-modal{background:var(--color-bg,#141414);border-radius:14px;width:min(660px,100%);max-height:90vh;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,.85);overflow:hidden}
.dpl-mhdr{display:flex;align-items:center;justify-content:space-between;padding:1rem 1.2rem;border-bottom:1px solid var(--color-border,#333);flex-shrink:0}
.dpl-mtitle{font-size:1.05rem;font-weight:700;margin:0}
.dpl-macts{display:flex;gap:.45rem;align-items:center}
.dpl-mclose{background:none;border:none;font-size:1.05rem;cursor:pointer;color:var(--color-secondary);padding:.3rem .45rem;border-radius:4px}
.dpl-mclose:hover{background:var(--color-border,#333)}
.dpl-mbody{overflow-y:auto;padding:.65rem 1.2rem 1.2rem;flex:1}
.dpl-tcount{font-size:.75rem;color:var(--color-secondary);margin-bottom:.6rem}
.dpl-trow{display:grid;grid-template-columns:22px 38px 1fr auto 36px;gap:.5rem;align-items:center;padding:.45rem .2rem;border-radius:6px}
.dpl-trow:hover{background:var(--color-surface,#1e1e1e)}
.dpl-tnum{font-size:.75rem;color:var(--color-secondary);text-align:center}
.dpl-tcover{width:38px;height:38px;border-radius:3px;overflow:hidden}
.dpl-tcover img{width:100%;height:100%;object-fit:cover}
.dpl-tph{width:38px;height:38px;background:var(--color-border,#333);border-radius:3px;display:flex;align-items:center;justify-content:center;font-size:1rem;color:var(--color-secondary)}
.dpl-tinfo{min-width:0}
.dpl-ttitle{font-size:.85rem;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dpl-tsub{font-size:.73rem;color:var(--color-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dpl-reason{font-size:.68rem;color:var(--color-accent,#6c63ff);margin-left:.35rem}
.dpl-tdur{font-size:.75rem;color:var(--color-secondary);text-align:right;white-space:nowrap}
.dpl-tact{display:flex;justify-content:center}
.dpl-tplay{background:none;border:1px solid var(--color-border,#444);color:var(--color-text);border-radius:50%;width:26px;height:26px;cursor:pointer;font-size:.75rem;display:flex;align-items:center;justify-content:center;transition:all .15s}
.dpl-tplay:hover{background:var(--color-accent,#6c63ff);border-color:var(--color-accent,#6c63ff);color:#fff}
.dpl-tplay.loading{opacity:.5}
.dpl-tplay.played{background:#5cb85c;border-color:#5cb85c;color:#fff}
.dpl-disc{font-size:.64rem;padding:.1rem .3rem;border-radius:3px;background:rgba(108,99,255,.18);color:var(--color-accent,#6c63ff)}
/* Custom */
.dpl-custom-wrap{background:var(--color-surface,#1e1e1e);border-radius:12px;padding:1.1rem}
.dpl-custom-hint{color:var(--color-secondary);font-size:.82rem;margin:0 0 .85rem}
.dpl-custom-form{display:flex;flex-direction:column;gap:.65rem}
.dpl-seeds{display:flex;flex-wrap:wrap;gap:.35rem;min-height:24px}
.dpl-stag{display:inline-flex;align-items:center;gap:.2rem;background:rgba(108,99,255,.2);color:var(--color-accent,#6c63ff);padding:.22rem .55rem;border-radius:20px;font-size:.78rem}
.dpl-srem{background:none;border:none;cursor:pointer;color:inherit;font-size:.72rem;padding:0;line-height:1}
.dpl-input-row{display:flex;gap:.45rem}
.dpl-input{flex:1;padding:.45rem .65rem;border-radius:6px;border:1px solid var(--color-border,#333);background:var(--color-bg,#141414);color:var(--color-text);font-size:.85rem}
.dpl-input:focus{outline:none;border-color:var(--color-accent,#6c63ff)}
.dpl-builder-opts{display:flex;flex-direction:column;gap:.65rem;padding:.65rem;background:var(--color-surface,#1e1e1e);border-radius:8px}
.dpl-opt-label{display:flex;flex-direction:column;gap:.3rem;font-size:.82rem;color:var(--color-secondary)}
.dpl-opt-check{flex-direction:row;align-items:center;gap:.4rem;cursor:pointer}
.dpl-range{width:100%;accent-color:var(--color-accent,#6c63ff);cursor:pointer}
.dpl-cres{display:flex;align-items:center;gap:.75rem;margin-top:.4rem;font-size:.85rem}
.dpl-loading,.dpl-empty{padding:.75rem;text-align:center;color:var(--color-secondary);font-size:.85rem;display:flex;gap:.5rem;align-items:center;justify-content:center}
.dpl-err{color:#e05555;padding:.5rem 0;font-size:.85rem}
/* ── Tabs ─────────────────────────────────────────────────────── */
.dpl-tabs{display:flex;gap:0;border-bottom:2px solid var(--color-border,#333);margin-bottom:1.5rem}
.dpl-tab{padding:.55rem 1.1rem;font-size:.88rem;font-weight:600;border:none;background:none;color:var(--color-secondary);cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-2px;transition:color .15s,border-color .15s}
.dpl-tab:hover{color:var(--color-text)}
.dpl-tab.active{color:var(--color-accent,#6c63ff);border-bottom-color:var(--color-accent,#6c63ff)}
/* ── Mirrored Playlists ───────────────────────────────────────── */
.mir-toolbar{display:flex;gap:.55rem;margin-bottom:.75rem}
.mir-url-input{flex:1}
.mir-msg{font-size:.82rem;margin-bottom:.6rem;min-height:1.2em}
.mir-ok{color:#5cb85c}
.mir-err{color:#e05555}
.mir-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1rem}
.mir-card{background:var(--color-surface,#1e1e1e);border-radius:12px;padding:.9rem 1rem;display:flex;flex-direction:column;gap:.55rem;border:1px solid var(--color-border,#2a2a2a)}
.mir-card-hdr{display:flex;align-items:center;gap:.45rem}
.mir-platform{font-size:.78rem;font-weight:600;color:var(--color-secondary)}
.mir-badge{font-size:.64rem;padding:.1rem .35rem;border-radius:3px;font-weight:600}
.mir-auto{background:rgba(108,99,255,.15);color:var(--color-accent,#6c63ff)}
.mir-card-name{font-size:.92rem;font-weight:700;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mir-card-stats{display:flex;flex-direction:column;gap:.25rem}
.mir-pbar-wrap{height:5px;background:var(--color-border,#333);border-radius:3px;overflow:hidden}
.mir-pbar{height:100%;border-radius:3px;transition:width .3s}
.mir-stat-row{display:flex;justify-content:space-between;font-size:.72rem;color:var(--color-secondary)}
.mir-age{opacity:.75}
.mir-card-actions{display:flex;gap:.35rem;flex-wrap:wrap;margin-top:.1rem}
.mir-card-actions .dpl-btn{font-size:.73rem;padding:.22rem .55rem}
.mir-btn-del{color:#e05555}
.mir-btn-del:hover{background:#e05555;color:#fff}
/* Mirrored Tracks Panel */
.mir-tracks-panel{margin-top:1.25rem;background:var(--color-surface,#1e1e1e);border-radius:12px;overflow:hidden;border:1px solid var(--color-border,#2a2a2a)}
.mir-tp-hdr{display:flex;align-items:center;gap:.65rem;padding:.7rem 1rem;border-bottom:1px solid var(--color-border,#333)}
.mir-tp-title{font-weight:700;font-size:.9rem;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mir-tp-stat{font-size:.75rem;color:var(--color-secondary);white-space:nowrap}
.mir-tlist{max-height:420px;overflow-y:auto;padding:.4rem .6rem}
.mir-trow{display:grid;grid-template-columns:100px 1fr auto auto;gap:.5rem;align-items:center;padding:.35rem .2rem;border-radius:6px}
.mir-trow:hover{background:var(--color-bg,#141414)}
.mir-tstatus{font-size:.68rem;font-weight:600;padding:.1rem .32rem;border-radius:3px;white-space:nowrap;text-align:center}
.mir-s-ok{background:rgba(92,184,92,.15);color:#5cb85c}
.mir-s-miss{background:rgba(224,85,85,.12);color:#e05555}
.mir-s-dl{background:rgba(108,99,255,.15);color:var(--color-accent,#6c63ff)}
.mir-s-pend{background:rgba(150,150,150,.1);color:var(--color-secondary)}
.mir-tinfo{min-width:0}
.mir-ttitle{font-size:.82rem;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mir-tsub{font-size:.72rem;color:var(--color-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mir-tconf{font-size:.68rem;color:var(--color-secondary);white-space:nowrap}
</style>`;
}

// ── Entry points ──────────────────────────────────────────────────────────────

/**
 * Discovery Engine view — gepersonaliseerde playlists.
 */
let _activePlaylistTab = state.playlistTab || 'discovery';

export async function loadPlaylists() {
  const content = document.getElementById('content');
  if (!content) return;

  // Herstel actieve tab uit state (zodat tab behouden blijft bij navigatie)
  _activePlaylistTab = state.playlistTab || 'discovery';

  content.innerHTML = `
    ${styles()}
    <div class="dpl-page">
      <div class="dpl-hdr">
        <h1 class="dpl-page-title">🎵 Playlists</h1>
      </div>
      <div class="dpl-tabs">
        <button class="dpl-tab${_activePlaylistTab === 'discovery' ? ' active' : ''}" data-tab="discovery">🔭 Discovery Engine</button>
        <button class="dpl-tab${_activePlaylistTab === 'mirrored'  ? ' active' : ''}" data-tab="mirrored">🔗 Gespiegeld</button>
      </div>
      <div id="dpl-tab-content">
        <div style="padding:2rem;text-align:center;color:var(--color-secondary)">
          <span class="dpl-spin"></span>
          <span style="margin-left:.5rem">Laden…</span>
        </div>
      </div>
    </div>`;

  // Tab-switching
  content.querySelectorAll('.dpl-tab').forEach(tab => {
    tab.addEventListener('click', async () => {
      content.querySelectorAll('.dpl-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      _activePlaylistTab = tab.dataset.tab;
      state.playlistTab  = _activePlaylistTab;
      await loadTabContent(_activePlaylistTab);
    });
  });

  await loadTabContent(_activePlaylistTab);
}

async function loadTabContent(tab) {
  const tabContent = document.getElementById('dpl-tab-content');
  if (!tabContent) return;

  if (tab === 'discovery') {
    tabContent.innerHTML = `<div class="dpl-loading"><span class="dpl-spin"></span> Playlists laden…</div>`;
    try {
      const data = await apiFetch('/api/playlists', { signal: state.tabAbort?.signal });
      await renderDiscovery(data);
    } catch (e) {
      if (e.name === 'AbortError') return;
      tabContent.innerHTML = `<div style="padding:2rem;text-align:center">
        <p style="color:#e05">Playlists konden niet worden geladen: ${esc(e.message)}</p>
        <button onclick="location.reload()" style="margin-top:1rem;padding:.5rem 1rem;cursor:pointer;border-radius:6px;border:none;background:var(--color-border);color:var(--color-text)">Opnieuw laden</button>
      </div>`;
    }
    return;
  }

  if (tab === 'mirrored') {
    tabContent.innerHTML = '';
    await renderMirrored(tabContent);
    return;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Playlist Detail View (Plex native playlists)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Detail van één Plex-afspeellijst.
 * Verwacht state.viewParams = { id: ratingKey, title: 'Playlist naam' }
 */
export async function loadPlaylistDetail() {
  const content = document.getElementById('content');
  if (!content) return;

  const id    = state.viewParams?.id;
  const title = state.viewParams?.title || 'Afspeellijst';

  if (!id) {
    content.innerHTML = `<div class="error-box">⚠️ Geen afspeellijst geselecteerd.</div>`;
    return;
  }

  const backView = state.previousView || 'playlists';

  content.innerHTML = `
    <div class="playlist-detail-page">
      <div class="playlist-detail-header">
        <button class="album-detail-back" id="playlist-back-btn">← Terug</button>
        <div class="playlist-detail-meta">
          <div class="playlist-detail-art-wrap" id="playlist-detail-art">
            <div class="playlist-card-ph">♫</div>
          </div>
          <div class="playlist-detail-info">
            <div class="playlist-detail-label">AFSPEELLIJST</div>
            <h1 class="playlist-detail-title">${esc(title)}</h1>
            <div class="playlist-detail-sub" id="playlist-detail-sub">Laden…</div>
            <div class="playlist-detail-actions">
              <button class="play-all-btn" id="playlist-play-all" disabled>▶ Afspelen</button>
            </div>
          </div>
        </div>
      </div>
      <div class="playlist-track-list" id="playlist-tracks">
        <div class="playlists-loading">
          <div class="spinner-sm"></div><span>Nummers laden…</span>
        </div>
      </div>
    </div>`;

  document.getElementById('playlist-back-btn')?.addEventListener('click', () => switchView(backView));

  try {
    const data = await apiFetch(`/api/plex/playlists/${encodeURIComponent(id)}/tracks`, {
      signal: state.tabAbort?.signal
    });
    const tracks = data?.tracks || [];

    const subEl = document.getElementById('playlist-detail-sub');
    if (subEl) {
      const totalMs  = tracks.reduce((s, t) => s + (t.duration || 0), 0);
      subEl.textContent = `${fmt(tracks.length)} nummers · ${Math.round(totalMs / 60000)} min`;
    }

    document.getElementById('playlist-play-all')?.removeAttribute('disabled');

    // Artwork
    try {
      const plData = await apiFetch('/api/plex/playlists', { signal: state.tabAbort?.signal });
      const pl = (plData?.playlists || plData || []).find(p => String(p.ratingKey) === String(id));
      if (pl?.thumb) {
        const artEl = document.getElementById('playlist-detail-art');
        if (artEl) artEl.innerHTML = `<img src="${esc(proxyImg(pl.thumb, 240))}" alt="${esc(title)}" class="playlist-detail-art-img" loading="lazy">`;
      }
    } catch {}

    const tracksEl = document.getElementById('playlist-tracks');
    if (!tracksEl) return;

    if (!tracks.length) {
      tracksEl.innerHTML = `<div class="playlists-empty">Deze afspeellijst bevat geen nummers.</div>`;
      return;
    }

    tracksEl.innerHTML = `
      <table class="playlist-track-table">
        <thead>
          <tr>
            <th class="plt-num">#</th>
            <th class="plt-title">Titel</th>
            <th class="plt-artist">Artiest</th>
            <th class="plt-album">Album</th>
            <th class="plt-dur">Duur</th>
          </tr>
        </thead>
        <tbody>
          ${tracks.map((t, i) => {
            const thumb = t.thumb ? proxyImg(t.thumb, 48) : null;
            return `<tr class="playlist-track-row">
              <td class="plt-num">${i + 1}</td>
              <td class="plt-title">
                <div class="plt-title-inner">
                  ${thumb ? `<img src="${esc(thumb)}" alt="" class="plt-thumb" loading="lazy">` : `<div class="plt-thumb plt-thumb-ph"></div>`}
                  <span>${esc(t.title)}</span>
                </div>
              </td>
              <td class="plt-artist">${t.artist ? `<button class="plt-artist-link" data-artist="${esc(t.artist)}">${esc(t.artist)}</button>` : '—'}</td>
              <td class="plt-album">${esc(t.album || '—')}</td>
              <td class="plt-dur">${fmtMs(t.duration)}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>`;

  } catch (err) {
    if (err.name === 'AbortError') return;
    const el = document.getElementById('playlist-tracks');
    if (el) el.innerHTML = `<div class="error-box">⚠️ Laden mislukt: ${esc(err.message)}</div>`;
  }
}
