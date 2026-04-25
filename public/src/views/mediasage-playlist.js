// ── View: MediaSage AI Playlist Generator ────────────────────────────────────
// Multi-step wizard voor AI-gebaseerde playlist generatie via de MediaSage backend.
// Stap 1: Prompt invoer  → Stap 2: Filter review → Stap 3: Genereren (SSE)
// Stap 4: Resultaat      → Stap 5: Acties (play / opslaan)

import { state } from '../state.js';
import { esc, gradientFor, initials } from '../helpers.js';
import {
  analyzePrompt, analyzeTrack, filterPreview, streamPlaylist,
  savePlaylist, updatePlaylist, playQueue,
  getPlexClients, getPlexPlaylists, getAlbumArt, searchLibrary,
} from '../modules/mediasage-api.js';
import { switchView } from '../router.js';

// ── Module-level state ────────────────────────────────────────────────────────
let msStep          = 1;
let msAnalysis      = null;     // response van analyzePrompt / analyzeTrack
let msActiveGenres  = new Set();
let msActiveDecades = new Set();
let msMinRating     = 1;
let msExcludeLive   = false;
let msTrackCount    = 25;
let msTracks        = [];       // gegenereerde tracks
let msPlaylistName  = 'Mijn playlist';
let msStreamCtrl    = null;     // AbortController voor SSE-stream
let msPlexClients   = [];
let msPlexPlaylists = [];
let msSelectedClient = null;
let msSeedTrack     = null;     // optionele seed-track
let msCost          = null;
let msTokens        = null;
let msPromptText    = '';
let msPreviewDebounce = null;
let msSearchDebounce  = null;

// ── Entry point ───────────────────────────────────────────────────────────────
export async function loadMediaSagePlaylist() {
  // Reset alle module state bij elke laad
  msStep           = 1;
  msAnalysis       = null;
  msActiveGenres   = new Set();
  msActiveDecades  = new Set();
  msMinRating      = 1;
  msExcludeLive    = false;
  msTrackCount     = 25;
  msTracks         = [];
  msPlaylistName   = 'Mijn playlist';
  if (msStreamCtrl) { msStreamCtrl.abort(); msStreamCtrl = null; }
  msPlexClients    = [];
  msPlexPlaylists  = [];
  msSelectedClient = null;
  msSeedTrack      = null;
  msCost           = null;
  msTokens         = null;
  msPromptText     = '';

  injectStyles();
  renderStep();
}

// ── CSS injecteren (eenmalig) ─────────────────────────────────────────────────
function injectStyles() {
  if (document.getElementById('ms-playlist-styles')) return;
  const style = document.createElement('style');
  style.id = 'ms-playlist-styles';
  style.textContent = `
    /* ── Layout ─────────────────────────────────────────────────────────────── */
    .ms-view {
      max-width: 860px;
      margin: 0 auto;
      padding-bottom: 60px;
    }
    .ms-header {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 16px 20px 8px;
    }
    .ms-back-btn {
      background: none;
      border: 1px solid var(--color-border);
      color: var(--color-text-secondary);
      border-radius: 8px;
      padding: 6px 13px;
      cursor: pointer;
      font-size: 13px;
      font-family: inherit;
      transition: color .15s, border-color .15s;
      flex-shrink: 0;
    }
    .ms-back-btn:hover { color: var(--color-text); border-color: var(--color-accent); }
    .ms-title {
      font-size: 20px;
      font-weight: 700;
      color: var(--color-text);
      margin: 0;
    }

    /* ── Step indicator ──────────────────────────────────────────────────────── */
    .ms-steps {
      display: flex;
      align-items: center;
      padding: 14px 20px 10px;
      overflow-x: auto;
      scrollbar-width: none;
    }
    .ms-steps::-webkit-scrollbar { display: none; }
    .ms-step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      flex-shrink: 0;
    }
    .ms-step-dot {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
      background: var(--color-card);
      border: 2px solid var(--color-border);
      color: var(--color-text-secondary);
      transition: all .2s;
    }
    .ms-step.active .ms-step-dot {
      background: var(--color-accent);
      border-color: var(--color-accent);
      color: #fff;
    }
    .ms-step.done .ms-step-dot {
      background: var(--color-accent);
      border-color: var(--color-accent);
      color: #fff;
      opacity: .55;
    }
    .ms-step-label {
      font-size: 11px;
      color: var(--color-text-secondary);
      white-space: nowrap;
    }
    .ms-step.active .ms-step-label { color: var(--color-accent); font-weight: 600; }
    .ms-step-line {
      flex: 1;
      height: 2px;
      background: var(--color-border);
      margin: 0 4px 14px;
      min-width: 18px;
      transition: background .2s;
    }
    .ms-step-line.done { background: var(--color-accent); opacity: .45; }

    /* ── Card ────────────────────────────────────────────────────────────────── */
    .ms-card {
      background: var(--color-card);
      border: 1px solid var(--color-border);
      border-radius: 12px;
      padding: 22px 24px;
      margin: 0 20px 14px;
    }
    .ms-card h2 {
      font-size: 16px;
      font-weight: 700;
      color: var(--color-text);
      margin: 0 0 18px;
    }

    /* ── Prompt ──────────────────────────────────────────────────────────────── */
    .ms-textarea {
      width: 100%;
      min-height: 96px;
      background: var(--color-bg);
      border: 1px solid var(--color-border);
      border-radius: 8px;
      color: var(--color-text);
      font-size: 15px;
      padding: 11px 13px;
      resize: vertical;
      box-sizing: border-box;
      font-family: inherit;
      transition: border-color .15s;
      line-height: 1.5;
    }
    .ms-textarea:focus { outline: none; border-color: var(--color-accent); }

    /* ── Seed track ──────────────────────────────────────────────────────────── */
    .ms-seed-toggle-row {
      display: flex;
      align-items: center;
      gap: 7px;
      margin-top: 12px;
      cursor: pointer;
      font-size: 13px;
      color: var(--color-text-secondary);
      user-select: none;
    }
    .ms-seed-toggle-row input { cursor: pointer; accent-color: var(--color-accent); }
    .ms-seed-section { display: none; margin-top: 10px; }
    .ms-seed-section.visible { display: block; }
    .ms-text-input {
      width: 100%;
      background: var(--color-bg);
      border: 1px solid var(--color-border);
      border-radius: 8px;
      color: var(--color-text);
      font-size: 14px;
      padding: 9px 12px;
      box-sizing: border-box;
      font-family: inherit;
      transition: border-color .15s;
    }
    .ms-text-input:focus { outline: none; border-color: var(--color-accent); }
    .ms-search-results {
      margin-top: 6px;
      background: var(--color-bg);
      border: 1px solid var(--color-border);
      border-radius: 8px;
      max-height: 230px;
      overflow-y: auto;
    }
    .ms-search-result {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
      cursor: pointer;
      border-bottom: 1px solid var(--color-border);
      transition: background .12s;
    }
    .ms-search-result:last-child { border-bottom: none; }
    .ms-search-result:hover { background: var(--color-card); }
    .ms-thumb {
      width: 36px;
      height: 36px;
      border-radius: 5px;
      object-fit: cover;
      flex-shrink: 0;
    }
    .ms-thumb-ph {
      width: 36px;
      height: 36px;
      border-radius: 5px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 700;
      color: rgba(255,255,255,.75);
      flex-shrink: 0;
    }
    .ms-result-info { flex: 1; min-width: 0; }
    .ms-result-title {
      font-size: 13px;
      font-weight: 600;
      color: var(--color-text);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .ms-result-sub {
      font-size: 11px;
      color: var(--color-text-secondary);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .ms-seed-chosen {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 9px 11px;
      background: color-mix(in srgb, var(--color-accent) 10%, transparent);
      border: 1px solid color-mix(in srgb, var(--color-accent) 28%, transparent);
      border-radius: 8px;
      margin-top: 6px;
    }
    .ms-seed-info { flex: 1; min-width: 0; }
    .ms-seed-name { font-size: 13px; font-weight: 600; color: var(--color-text); }
    .ms-seed-artist { font-size: 11px; color: var(--color-text-secondary); }
    .ms-seed-clear {
      background: none; border: none;
      color: var(--color-text-secondary);
      cursor: pointer; padding: 4px 6px; font-size: 15px; line-height: 1;
      transition: color .12s;
    }
    .ms-seed-clear:hover { color: #e53e3e; }

    /* ── Buttons ─────────────────────────────────────────────────────────────── */
    .ms-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 10px 20px;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      font-family: inherit;
      transition: opacity .15s, transform .1s;
      white-space: nowrap;
    }
    .ms-btn:disabled { opacity: .4; cursor: not-allowed; }
    .ms-btn:not(:disabled):hover { opacity: .82; }
    .ms-btn:not(:disabled):active { transform: scale(.97); }
    .ms-btn-primary   { background: var(--color-accent); color: #fff; }
    .ms-btn-secondary {
      background: var(--color-card);
      color: var(--color-text);
      border: 1px solid var(--color-border);
    }
    .ms-btn-ghost {
      background: none;
      color: var(--color-text-secondary);
      border: 1px solid var(--color-border);
    }
    .ms-row {
      display: flex;
      gap: 10px;
      margin-top: 20px;
      flex-wrap: wrap;
      align-items: center;
    }

    /* ── Chips ───────────────────────────────────────────────────────────────── */
    .ms-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 7px;
    }
    .ms-chip {
      padding: 5px 12px;
      border-radius: 20px;
      border: 1px solid var(--color-border);
      background: var(--color-bg);
      color: var(--color-text-secondary);
      font-size: 12px;
      cursor: pointer;
      transition: all .14s;
      user-select: none;
      font-family: inherit;
    }
    .ms-chip:hover { border-color: var(--color-accent); color: var(--color-text); }
    .ms-chip.active {
      background: var(--color-accent);
      border-color: var(--color-accent);
      color: #fff;
    }

    /* ── Form fields ─────────────────────────────────────────────────────────── */
    .ms-field { margin-top: 18px; }
    .ms-field > label {
      display: block;
      font-size: 13px;
      font-weight: 600;
      color: var(--color-text-secondary);
      margin-bottom: 6px;
    }
    .ms-slider {
      width: 100%;
      accent-color: var(--color-accent);
      cursor: pointer;
    }
    .ms-slider-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .ms-slider-edge { font-size: 12px; color: var(--color-text-secondary); flex-shrink: 0; }
    .ms-slider-val {
      font-size: 14px;
      font-weight: 700;
      color: var(--color-accent);
      min-width: 28px;
    }
    .ms-checkbox-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 18px;
      font-size: 13px;
      color: var(--color-text);
      cursor: pointer;
      user-select: none;
    }
    .ms-checkbox-row input { cursor: pointer; accent-color: var(--color-accent); }
    .ms-preview-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 14px;
      background: var(--color-bg);
      border: 1px solid var(--color-border);
      border-radius: 8px;
      margin-top: 18px;
      font-size: 13px;
      color: var(--color-text-secondary);
    }
    .ms-preview-count {
      font-size: 22px;
      font-weight: 800;
      color: var(--color-accent);
    }

    /* ── Generating ──────────────────────────────────────────────────────────── */
    .ms-gen-hero {
      text-align: center;
      padding: 28px 0 12px;
    }
    .ms-gen-spinner {
      width: 44px;
      height: 44px;
      border: 4px solid var(--color-border);
      border-top-color: var(--color-accent);
      border-radius: 50%;
      animation: ms-spin .85s linear infinite;
      margin: 0 auto 14px;
    }
    @keyframes ms-spin { to { transform: rotate(360deg); } }
    .ms-gen-text {
      font-size: 15px;
      color: var(--color-text-secondary);
    }

    /* ── Track rows ──────────────────────────────────────────────────────────── */
    .ms-track-list { margin-top: 10px; }
    .ms-track-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 7px 8px;
      border-radius: 7px;
      transition: background .12s;
    }
    .ms-track-row:hover { background: var(--color-bg); }
    .ms-track-num {
      font-size: 12px;
      color: var(--color-text-secondary);
      min-width: 22px;
      text-align: right;
      flex-shrink: 0;
    }
    .ms-track-art {
      width: 38px;
      height: 38px;
      border-radius: 5px;
      object-fit: cover;
      flex-shrink: 0;
    }
    .ms-track-art-ph {
      width: 38px;
      height: 38px;
      border-radius: 5px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 700;
      color: rgba(255,255,255,.75);
      flex-shrink: 0;
    }
    .ms-track-info { flex: 1; min-width: 0; }
    .ms-track-title {
      font-size: 13px;
      font-weight: 600;
      color: var(--color-text);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .ms-track-sub {
      font-size: 11px;
      color: var(--color-text-secondary);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .ms-track-dur {
      font-size: 12px;
      color: var(--color-text-secondary);
      flex-shrink: 0;
    }
    .ms-track-remove {
      background: none; border: none;
      color: var(--color-text-secondary);
      cursor: pointer;
      padding: 4px 6px;
      border-radius: 4px;
      font-size: 13px;
      flex-shrink: 0;
      opacity: 0;
      transition: opacity .14s, color .14s;
      line-height: 1;
    }
    .ms-track-row:hover .ms-track-remove { opacity: 1; }
    .ms-track-remove:hover { color: #e53e3e; }

    /* ── Playlist name input ─────────────────────────────────────────────────── */
    .ms-playlist-name-input {
      font-size: 19px;
      font-weight: 700;
      background: transparent;
      border: none;
      border-bottom: 2px solid var(--color-border);
      color: var(--color-text);
      padding: 3px 0;
      width: 100%;
      font-family: inherit;
      box-sizing: border-box;
      transition: border-color .15s;
    }
    .ms-playlist-name-input:focus {
      outline: none;
      border-color: var(--color-accent);
    }

    /* ── Meta bar ────────────────────────────────────────────────────────────── */
    .ms-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 14px;
      font-size: 12px;
      color: var(--color-text-secondary);
      margin-top: 7px;
      margin-bottom: 4px;
    }

    /* ── Action cards ────────────────────────────────────────────────────────── */
    .ms-action-card {
      background: var(--color-card);
      border: 1px solid var(--color-border);
      border-radius: 10px;
      padding: 16px 18px;
      margin: 0 20px 12px;
    }
    .ms-action-card h3 {
      margin: 0 0 12px;
      font-size: 14px;
      font-weight: 700;
      color: var(--color-text);
    }
    .ms-select {
      width: 100%;
      background: var(--color-bg);
      border: 1px solid var(--color-border);
      border-radius: 8px;
      color: var(--color-text);
      font-size: 14px;
      padding: 9px 12px;
      box-sizing: border-box;
      font-family: inherit;
      cursor: pointer;
      margin-bottom: 10px;
    }
    .ms-select:focus { outline: none; border-color: var(--color-accent); }
    .ms-status-txt {
      margin-left: 10px;
      font-size: 13px;
      color: var(--color-text-secondary);
      vertical-align: middle;
    }

    /* ── Shimmer ─────────────────────────────────────────────────────────────── */
    .ms-shimmer {
      background: linear-gradient(
        90deg,
        var(--color-border) 25%,
        var(--color-card)   50%,
        var(--color-border) 75%
      );
      background-size: 200% 100%;
      animation: ms-shimmer 1.3s infinite;
      border-radius: 4px;
      display: inline-block;
    }
    @keyframes ms-shimmer { to { background-position: -200% 0; } }

    /* ── Error box margin fix ─────────────────────────────────────────────────── */
    .ms-view .error-box { margin: 0 20px 14px; }

    /* ── Responsive ──────────────────────────────────────────────────────────── */
    @media (max-width: 768px) {
      .ms-card { margin: 0 12px 14px; padding: 16px; }
      .ms-action-card { margin: 0 12px 12px; }
      .ms-header { padding: 12px 14px 6px; }
      .ms-steps { padding: 10px 14px 8px; }
      .ms-title { font-size: 17px; }
      .ms-row { flex-direction: column; align-items: stretch; }
      .ms-btn { width: 100%; }
    }
  `;
  document.head.appendChild(style);
}

// ── Render dispatcher ─────────────────────────────────────────────────────────
function renderStep() {
  const content = document.getElementById('content');
  if (!content) return;
  content.innerHTML = `
    <div class="ms-view">
      ${renderHeader()}
      ${renderStepIndicator()}
      <div id="ms-body">${renderCurrentStep()}</div>
    </div>
  `;
  bindEvents();
}

function goToStep(n) {
  msStep = n;
  // Update just the step indicator and body for a smoother feel
  const indicator = document.querySelector('.ms-steps');
  const body      = document.getElementById('ms-body');
  if (indicator) indicator.outerHTML = renderStepIndicator();
  if (body) {
    body.innerHTML = renderCurrentStep();
    bindEvents();
    // Scroll to top of view
    document.querySelector('.ms-view')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    renderStep();
  }
}

// ── Header ────────────────────────────────────────────────────────────────────
function renderHeader() {
  return `
    <div class="ms-header">
      <button class="ms-back-btn" id="ms-back-btn">← Terug</button>
      <h1 class="ms-title">🎵 AI Playlist Generator</h1>
    </div>
  `;
}

// ── Step indicator ────────────────────────────────────────────────────────────
function renderStepIndicator() {
  const steps = [
    { n: 1, label: 'Prompt'    },
    { n: 2, label: 'Filters'   },
    { n: 3, label: 'Genereren' },
    { n: 4, label: 'Resultaat' },
    { n: 5, label: 'Acties'    },
  ];
  return `
    <nav class="ms-steps" aria-label="Stappen">
      ${steps.map((s, i) => `
        <div class="ms-step${msStep === s.n ? ' active' : ''}${msStep > s.n ? ' done' : ''}">
          <div class="ms-step-dot">${msStep > s.n ? '✓' : s.n}</div>
          <span class="ms-step-label">${s.label}</span>
        </div>
        ${i < steps.length - 1 ? `<div class="ms-step-line${msStep > s.n ? ' done' : ''}"></div>` : ''}
      `).join('')}
    </nav>
  `;
}

function renderCurrentStep() {
  switch (msStep) {
    case 1: return renderStep1();
    case 2: return renderStep2();
    case 3: return renderStep3();
    case 4: return renderStep4();
    case 5: return renderStep5();
    default: return '';
  }
}

// ── STAP 1: Prompt invoer ─────────────────────────────────────────────────────
function renderStep1() {
  const seedSectionHtml = msSeedTrack
    ? renderSeedChosen()
    : `
      <input type="text" class="ms-text-input" id="ms-seed-search"
        placeholder="Zoek een nummer uit je bibliotheek..."
        autocomplete="off" value="">
      <div id="ms-seed-results"></div>
    `;

  return `
    <div class="ms-card">
      <h2>Beschrijf je playlist</h2>
      <textarea
        class="ms-textarea"
        id="ms-prompt"
        placeholder="Beschrijf je playlist... bijv. 'Melancholy 90s alternative for a rainy day'"
        maxlength="500"
      >${esc(msPromptText)}</textarea>

      <label class="ms-seed-toggle-row">
        <input type="checkbox" id="ms-seed-toggle" ${msSeedTrack ? 'checked' : ''}>
        Start vanuit een specifiek nummer
      </label>

      <div class="ms-seed-section${msSeedTrack ? ' visible' : ''}" id="ms-seed-section">
        ${seedSectionHtml}
      </div>

      <div class="ms-analyze-btn-row">
        <button class="ms-btn ms-btn-primary" id="ms-analyze-btn"
          ${!msPromptText.trim() && !msSeedTrack ? 'disabled' : ''}>Analyseer →</button>
      </div>
    </div>
  `;
}

function renderSeedChosen() {
  if (!msSeedTrack) return '';
  const artHtml = msSeedTrack.ratingKey
    ? `<img src="${getAlbumArt(msSeedTrack.ratingKey)}" class="ms-thumb" alt="" onerror="this.remove()">`
    : `<div class="ms-thumb-ph" style="background:${gradientFor(msSeedTrack.title || '')}">♪</div>`;
  return `
    <div class="ms-seed-chosen">
      ${artHtml}
      <div class="ms-seed-info">
        <div class="ms-seed-name">${esc(msSeedTrack.title || 'Onbekende track')}</div>
        <div class="ms-seed-artist">${esc(msSeedTrack.artist || '')}${msSeedTrack.album ? ' · ' + esc(msSeedTrack.album) : ''}</div>
      </div>
      <button class="ms-seed-clear" id="ms-seed-clear" title="Verwijder seed track">✕</button>
    </div>
  `;
}

// ── STAP 2: Filter review ─────────────────────────────────────────────────────
function renderStep2() {
  const genres  = msAnalysis?.genres  || [];
  const decades = msAnalysis?.decades || [];

  const genreChips = genres.length
    ? genres.map(g => `<button class="ms-chip${msActiveGenres.has(g) ? ' active' : ''}" data-chip-genre="${esc(g)}">${esc(g)}</button>`).join('')
    : `<span style="font-size:13px;color:var(--color-text-secondary)">Geen genres gesuggereerd</span>`;

  const decadeChips = decades.length
    ? decades.map(d => `<button class="ms-chip${msActiveDecades.has(d) ? ' active' : ''}" data-chip-decade="${esc(d)}">${esc(d)}</button>`).join('')
    : `<span style="font-size:13px;color:var(--color-text-secondary)">Geen decennia gesuggereerd</span>`;

  const stars = Array(5).fill(0).map((_, i) => i < msMinRating ? '★' : '☆').join('');

  return `
    <div class="ms-card">
      <h2>Stel filters in</h2>

      <div class="ms-field">
        <label>Genres</label>
        <div class="ms-chips" id="ms-genre-chips">${genreChips}</div>
      </div>

      <div class="ms-field">
        <label>Decennia</label>
        <div class="ms-chips" id="ms-decade-chips">${decadeChips}</div>
      </div>

      <div class="ms-field">
        <label>Minimale beoordeling: <span id="ms-rating-label">${stars} (${msMinRating}+)</span></label>
        <div class="ms-slider-row">
          <span class="ms-slider-edge">1</span>
          <input type="range" class="ms-slider" id="ms-rating-slider"
            min="1" max="5" step="1" value="${msMinRating}">
          <span class="ms-slider-edge">5</span>
        </div>
      </div>

      <label class="ms-checkbox-row">
        <input type="checkbox" id="ms-exclude-live" ${msExcludeLive ? 'checked' : ''}>
        Live versies uitsluiten
      </label>

      <div class="ms-field">
        <label>Aantal tracks: <span class="ms-slider-val" id="ms-count-val">${msTrackCount}</span></label>
        <div class="ms-slider-row">
          <span class="ms-slider-edge">10</span>
          <input type="range" class="ms-slider" id="ms-count-slider"
            min="10" max="50" step="5" value="${msTrackCount}">
          <span class="ms-slider-edge">50</span>
        </div>
      </div>

      <div class="ms-preview-bar">
        <span>Beschikbare tracks die matchen:</span>
        <span class="ms-preview-count" id="ms-preview-count">
          <span class="ms-shimmer" style="width:40px;height:22px;vertical-align:middle;"></span>
        </span>
      </div>

      <div class="ms-row">
        <button class="ms-btn ms-btn-ghost" id="ms-back-to-1">← Terug</button>
        <button class="ms-btn ms-btn-primary" id="ms-generate-btn">Genereer playlist →</button>
      </div>
    </div>
  `;
}

// ── STAP 3: Genereren via SSE ─────────────────────────────────────────────────
function renderStep3() {
  return `
    <div class="ms-card">
      <div class="ms-gen-hero">
        <div class="ms-gen-spinner" id="ms-gen-spinner"></div>
        <div class="ms-gen-text" id="ms-gen-text">Playlist wordt gegenereerd…</div>
      </div>

      <div class="ms-track-list" id="ms-stream-tracks"></div>

      <div class="ms-row" style="justify-content:center;display:none" id="ms-gen-done-row">
        <button class="ms-btn ms-btn-primary" id="ms-to-result-btn">Bekijk resultaat →</button>
      </div>
    </div>
  `;
}

// ── STAP 4: Resultaat ─────────────────────────────────────────────────────────
function renderStep4() {
  const totalMs   = msTracks.reduce((s, t) => s + (t.duration || 0), 0);
  const trackRows = msTracks.map((t, i) => renderTrackRow(t, i, true)).join('');

  return `
    <div class="ms-card">
      <input
        type="text"
        class="ms-playlist-name-input"
        id="ms-playlist-name"
        value="${esc(msPlaylistName)}"
        placeholder="Playlist naam…"
        maxlength="80"
      >
      <div class="ms-meta">
        <span>🎵 ${msTracks.length} tracks</span>
        <span>⏱ ${formatDuration(totalMs)}</span>
        ${msCost   ? `<span>💰 ${esc(String(msCost))}</span>`   : ''}
        ${msTokens ? `<span>🔤 ${esc(String(msTokens))} tokens</span>` : ''}
      </div>

      <div class="ms-track-list" id="ms-result-tracks">
        ${trackRows || `<div style="padding:20px;text-align:center;color:var(--color-text-secondary)">Geen tracks gegenereerd</div>`}
      </div>

      <div class="ms-row">
        <button class="ms-btn ms-btn-ghost"      id="ms-back-to-2">← Terug naar filters</button>
        <button class="ms-btn ms-btn-secondary"  id="ms-regen-btn">↻ Opnieuw genereren</button>
        <button class="ms-btn ms-btn-primary"    id="ms-to-actions-btn">Acties →</button>
      </div>
    </div>
  `;
}

// ── STAP 5: Acties ────────────────────────────────────────────────────────────
function renderStep5() {
  const clientOptions = msPlexClients.length
    ? msPlexClients.map(c => {
        const id    = c.clientIdentifier || c.id    || c.name  || '';
        const label = c.name             || c.title || c.clientIdentifier || id;
        return `<option value="${esc(id)}"${msSelectedClient === id ? ' selected' : ''}>${esc(label)}</option>`;
      }).join('')
    : '<option value="">Geen clients gevonden</option>';

  const playlistOptions = msPlexPlaylists.length
    ? msPlexPlaylists.map(p => {
        const id    = p.ratingKey || p.id   || '';
        const label = p.title     || p.name || id;
        return `<option value="${esc(id)}">${esc(label)}</option>`;
      }).join('')
    : '<option value="">Geen playlists gevonden</option>';

  return `
    <div class="ms-card" style="margin-bottom:0">
      <h2 style="margin-bottom:4px">Playlist klaar ✓</h2>
      <div class="ms-meta"><span>🎵 ${msTracks.length} tracks · ${esc(msPlaylistName)}</span></div>
    </div>

    <div class="ms-action-card">
      <h3>▶ Nu afspelen</h3>
      <select class="ms-select" id="ms-client-select">
        <option value="">Kies een Plex-client…</option>
        ${clientOptions}
      </select>
      <button class="ms-btn ms-btn-primary" id="ms-play-btn"
        ${msPlexClients.length ? '' : 'disabled'}>▶ Play Now</button>
      <span class="ms-status-txt" id="ms-play-status"></span>
    </div>

    <div class="ms-action-card">
      <h3>💾 Opslaan als nieuwe playlist</h3>
      <button class="ms-btn ms-btn-secondary" id="ms-save-btn">Opslaan in Plex</button>
      <span class="ms-status-txt" id="ms-save-status"></span>
    </div>

    <div class="ms-action-card">
      <h3>➕ Toevoegen aan bestaande playlist</h3>
      <select class="ms-select" id="ms-playlist-select">
        <option value="">Kies een playlist…</option>
        ${playlistOptions}
      </select>
      <button class="ms-btn ms-btn-secondary" id="ms-add-btn"
        ${msPlexPlaylists.length ? '' : 'disabled'}>Toevoegen</button>
      <span class="ms-status-txt" id="ms-add-status"></span>
    </div>

    <div class="ms-action-card" style="border:none;background:none;padding-top:0">
      <div class="ms-row" style="margin-top:0">
        <button class="ms-btn ms-btn-ghost" id="ms-back-to-4">← Terug naar resultaat</button>
      </div>
    </div>
  `;
}

// ── Track row helper ──────────────────────────────────────────────────────────
function renderTrackRow(track, index, showRemove = false) {
  const artUrl = track.ratingKey ? getAlbumArt(track.ratingKey) : null;
  const artHtml = artUrl
    ? `<img src="${esc(artUrl)}" class="ms-track-art" alt="" loading="lazy"
         onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
    : '';
  const phHtml = `<div class="ms-track-art-ph"
    style="background:${gradientFor(track.album || track.title || '')};${artUrl ? 'display:none' : ''}"
  >${initials(track.album || track.title || '?')}</div>`;

  const removeHtml = showRemove
    ? `<button class="ms-track-remove" data-remove-idx="${index}"
         title="Verwijder track" aria-label="Verwijder ${esc(track.title || '')}">✕</button>`
    : '';

  return `
    <div class="ms-track-row" data-track-idx="${index}">
      <span class="ms-track-num">${index + 1}</span>
      ${artHtml}${phHtml}
      <div class="ms-track-info">
        <div class="ms-track-title" title="${esc(track.title || 'Onbekend')}">${esc(track.title || 'Onbekend')}</div>
        <div class="ms-track-sub">${esc(track.artist || track.grandparentTitle || '')}${(track.album || track.parentTitle) ? ' · ' + esc(track.album || track.parentTitle) : ''}</div>
      </div>
      <span class="ms-track-dur">${track.duration ? formatDuration(track.duration) : ''}</span>
      ${removeHtml}
    </div>
  `;
}

// ── Event binding ─────────────────────────────────────────────────────────────
function bindEvents() {
  // Terug-knop: altijd aanwezig
  document.getElementById('ms-back-btn')?.addEventListener('click', () => {
    if (msStreamCtrl) { msStreamCtrl.abort(); msStreamCtrl = null; }
    switchView('mediasage');
  });

  switch (msStep) {
    case 1: bindStep1(); break;
    case 2: bindStep2(); break;
    case 3: startGeneration(); break;
    case 4: bindStep4(); break;
    case 5: bindStep5(); break;
  }
}

// ── Step 1 events ─────────────────────────────────────────────────────────────
function bindStep1() {
  document.getElementById('ms-prompt')?.addEventListener('input', e => {
    msPromptText = e.target.value;
    const btn = document.getElementById('ms-analyze-btn');
    if (btn) btn.disabled = !msPromptText.trim() && !msSeedTrack;
  });

  document.getElementById('ms-seed-toggle')?.addEventListener('change', e => {
    const section = document.getElementById('ms-seed-section');
    if (!section) return;
    if (e.target.checked) {
      section.classList.add('visible');
    } else {
      section.classList.remove('visible');
      msSeedTrack = null;
      section.innerHTML = `
        <input type="text" class="ms-text-input" id="ms-seed-search"
          placeholder="Zoek een nummer uit je bibliotheek…" autocomplete="off">
        <div id="ms-seed-results"></div>
      `;
      bindSeedSearch();
    }
  });

  bindSeedSearch();
  bindSeedClear();

  document.getElementById('ms-analyze-btn')?.addEventListener('click', handleAnalyze);
}

function bindSeedSearch() {
  document.getElementById('ms-seed-search')?.addEventListener('input', e => {
    clearTimeout(msSearchDebounce);
    const q = e.target.value.trim();
    if (!q) { const r = document.getElementById('ms-seed-results'); if (r) r.innerHTML = ''; return; }
    msSearchDebounce = setTimeout(() => runSeedSearch(q), 350);
  });
}

function bindSeedClear() {
  document.getElementById('ms-seed-clear')?.addEventListener('click', () => {
    msSeedTrack = null;
    const section = document.getElementById('ms-seed-section');
    if (section) {
      section.innerHTML = `
        <input type="text" class="ms-text-input" id="ms-seed-search"
          placeholder="Zoek een nummer uit je bibliotheek…" autocomplete="off">
        <div id="ms-seed-results"></div>
      `;
      document.getElementById('ms-seed-toggle').checked = false;
      section.classList.remove('visible');
      bindSeedSearch();
    }
  });
}

async function runSeedSearch(query) {
  const resultsEl = document.getElementById('ms-seed-results');
  if (!resultsEl) return;
  resultsEl.innerHTML = `<div class="loading" style="padding:10px;text-align:center"><div class="spinner"></div></div>`;
  try {
    const raw    = await searchLibrary(query);
    const tracks = Array.isArray(raw) ? raw : (raw?.tracks || raw?.results || []);

    if (!tracks.length) {
      resultsEl.innerHTML = `<div style="padding:10px 12px;font-size:13px;color:var(--color-text-secondary)">Geen nummers gevonden</div>`;
      return;
    }

    const rows = tracks.slice(0, 12).map((t, i) => {
      const title  = t.title  || t.name              || 'Onbekend';
      const artist = t.artist || t.grandparentTitle   || '';
      const album  = t.album  || t.parentTitle        || '';
      const artHtml = t.ratingKey
        ? `<img src="${getAlbumArt(t.ratingKey)}" class="ms-thumb" alt="" onerror="this.remove()">`
        : `<div class="ms-thumb-ph" style="background:${gradientFor(album || title)}">${initials(title)}</div>`;
      const jsonSafe = JSON.stringify({ ratingKey: t.ratingKey, title, artist, album })
        .replace(/'/g, '&#39;');
      return `
        <div class="ms-search-result" data-track='${jsonSafe}'>
          ${artHtml}
          <div class="ms-result-info">
            <div class="ms-result-title">${esc(title)}</div>
            <div class="ms-result-sub">${esc(artist)}${album ? ' · ' + esc(album) : ''}</div>
          </div>
        </div>
      `;
    }).join('');

    resultsEl.innerHTML = `<div class="ms-search-results">${rows}</div>`;

    resultsEl.querySelectorAll('.ms-search-result').forEach(el => {
      el.addEventListener('click', () => {
        try {
          msSeedTrack = JSON.parse(el.dataset.track.replace(/&#39;/g, "'"));
        } catch { return; }
        const section = document.getElementById('ms-seed-section');
        if (section) {
          section.innerHTML = renderSeedChosen();
          bindSeedClear();
        }
      });
    });
  } catch (err) {
    resultsEl.innerHTML = `<div class="error-box">Zoeken mislukt: ${esc(err.message)}</div>`;
  }
}

async function handleAnalyze() {
  const promptEl = document.getElementById('ms-prompt');
  const prompt   = (promptEl?.value || msPromptText).trim();

  if (!prompt && !msSeedTrack) {
    promptEl?.focus();
    return;
  }

  const btn = document.getElementById('ms-analyze-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Analyseren…'; }

  try {
    let result;
    if (msSeedTrack) {
      result = await analyzeTrack({ ...msSeedTrack, prompt: prompt || undefined });
    } else {
      result = await analyzePrompt(prompt);
    }

    msAnalysis      = result;
    msPromptText    = prompt;
    msActiveGenres  = new Set(result?.genres  || []);
    msActiveDecades = new Set(result?.decades || []);

    goToStep(2);
  } catch (err) {
    if (btn) { btn.disabled = false; btn.textContent = 'Analyseer →'; }
    appendError(`Analyse mislukt: ${err.message}`);
  }
}

// ── Step 2 events ─────────────────────────────────────────────────────────────
function bindStep2() {
  // Genre chips
  document.getElementById('ms-genre-chips')?.addEventListener('click', e => {
    const chip = e.target.closest('[data-chip-genre]');
    if (!chip) return;
    const g = chip.dataset.chipGenre;
    msActiveGenres.has(g) ? msActiveGenres.delete(g) : msActiveGenres.add(g);
    chip.classList.toggle('active', msActiveGenres.has(g));
    schedulePreview();
  });

  // Decade chips
  document.getElementById('ms-decade-chips')?.addEventListener('click', e => {
    const chip = e.target.closest('[data-chip-decade]');
    if (!chip) return;
    const d = chip.dataset.chipDecade;
    msActiveDecades.has(d) ? msActiveDecades.delete(d) : msActiveDecades.add(d);
    chip.classList.toggle('active', msActiveDecades.has(d));
    schedulePreview();
  });

  // Rating slider
  document.getElementById('ms-rating-slider')?.addEventListener('input', e => {
    msMinRating = parseInt(e.target.value);
    const label = document.getElementById('ms-rating-label');
    if (label) {
      const stars = Array(5).fill(0).map((_, i) => i < msMinRating ? '★' : '☆').join('');
      label.textContent = `${stars} (${msMinRating}+)`;
    }
    schedulePreview();
  });

  // Track count slider
  document.getElementById('ms-count-slider')?.addEventListener('input', e => {
    msTrackCount = parseInt(e.target.value);
    const val = document.getElementById('ms-count-val');
    if (val) val.textContent = msTrackCount;
  });

  // Exclude live
  document.getElementById('ms-exclude-live')?.addEventListener('change', e => {
    msExcludeLive = e.target.checked;
    schedulePreview();
  });

  document.getElementById('ms-back-to-1')?.addEventListener('click', () => goToStep(1));
  document.getElementById('ms-generate-btn')?.addEventListener('click', () => goToStep(3));

  // Trigger initial preview immediately
  schedulePreview(0);
}

function buildConfig() {
  return {
    prompt:       msPromptText  || undefined,
    seed_track:   msSeedTrack   || undefined,
    genres:       [...msActiveGenres],
    decades:      [...msActiveDecades],
    min_rating:   msMinRating,
    exclude_live: msExcludeLive,
    track_count:  msTrackCount,
  };
}

function schedulePreview(delay = 420) {
  clearTimeout(msPreviewDebounce);
  msPreviewDebounce = setTimeout(async () => {
    const el = document.getElementById('ms-preview-count');
    if (!el) return;
    el.innerHTML = `<span class="ms-shimmer" style="width:38px;height:22px;vertical-align:middle;"></span>`;
    try {
      const res   = await filterPreview(buildConfig());
      const count = res?.count ?? res?.total ?? (typeof res === 'number' ? res : '—');
      const current = document.getElementById('ms-preview-count');
      if (current) current.textContent = count;
    } catch {
      const current = document.getElementById('ms-preview-count');
      if (current) current.textContent = '—';
    }
  }, delay);
}

// ── Step 3: SSE streaming ─────────────────────────────────────────────────────
function startGeneration() {
  msTracks = [];
  msCost   = null;
  msTokens = null;

  if (msStreamCtrl) { msStreamCtrl.abort(); msStreamCtrl = null; }

  msStreamCtrl = streamPlaylist(
    buildConfig(),

    /* onTrack */
    (track) => {
      msTracks.push(track);
      const listEl = document.getElementById('ms-stream-tracks');
      if (listEl) {
        const tmp = document.createElement('div');
        tmp.innerHTML = renderTrackRow(track, msTracks.length - 1, false);
        listEl.appendChild(tmp.firstElementChild);
      }
      const textEl = document.getElementById('ms-gen-text');
      if (textEl) textEl.textContent = `${msTracks.length} track${msTracks.length !== 1 ? 's' : ''} gevonden…`;
    },

    /* onDone */
    (result) => {
      msStreamCtrl = null;
      msCost   = result.cost    || result.estimated_cost || null;
      msTokens = result.tokens  || result.token_usage   || null;

      // Soms stuurt de backend tracks in het done-event
      if (result.tracks?.length && !msTracks.length) {
        msTracks = result.tracks;
        const listEl = document.getElementById('ms-stream-tracks');
        if (listEl) {
          listEl.innerHTML = msTracks.map((t, i) => renderTrackRow(t, i, false)).join('');
        }
      }

      // Suggesties voor naam
      if (msPlaylistName === 'Mijn playlist') {
        const suggested = result.suggested_name || result.name
          || msAnalysis?.suggested_name || msAnalysis?.name;
        if (suggested) msPlaylistName = suggested;
      }

      const textEl    = document.getElementById('ms-gen-text');
      const spinnerEl = document.getElementById('ms-gen-spinner');
      const doneRow   = document.getElementById('ms-gen-done-row');

      if (textEl)    textEl.textContent = `✓ Klaar — ${msTracks.length} tracks`;
      if (spinnerEl) {
        spinnerEl.style.animation    = 'none';
        spinnerEl.style.borderColor  = 'var(--color-accent)';
      }
      if (doneRow) {
        doneRow.style.display = 'flex';
        document.getElementById('ms-to-result-btn')?.addEventListener('click', () => goToStep(4));
      }
    },

    /* onError */
    (err) => {
      if (err?.name === 'AbortError') return;
      appendError(`Generatie mislukt: ${err.message}`);
      const spinnerEl = document.getElementById('ms-gen-spinner');
      if (spinnerEl) spinnerEl.style.animation = 'none';
    }
  );
}

// ── Step 4 events ─────────────────────────────────────────────────────────────
function bindStep4() {
  document.getElementById('ms-playlist-name')?.addEventListener('input', e => {
    msPlaylistName = e.target.value;
  });

  // Track verwijderen via event delegation
  document.getElementById('ms-result-tracks')?.addEventListener('click', e => {
    const btn = e.target.closest('[data-remove-idx]');
    if (!btn) return;
    const idx = parseInt(btn.dataset.removeIdx);
    if (isNaN(idx) || idx < 0 || idx >= msTracks.length) return;
    msTracks.splice(idx, 1);
    const listEl = document.getElementById('ms-result-tracks');
    if (listEl) listEl.innerHTML = msTracks.map((t, i) => renderTrackRow(t, i, true)).join('');
    updateStep4Meta();
  });

  document.getElementById('ms-back-to-2')?.addEventListener('click', () => goToStep(2));

  document.getElementById('ms-regen-btn')?.addEventListener('click', () => {
    msPlaylistName = document.getElementById('ms-playlist-name')?.value || msPlaylistName;
    goToStep(3);
  });

  document.getElementById('ms-to-actions-btn')?.addEventListener('click', async () => {
    msPlaylistName = document.getElementById('ms-playlist-name')?.value || msPlaylistName;
    const btn = document.getElementById('ms-to-actions-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Laden…'; }
    try {
      const [rawClients, rawPlaylists] = await Promise.all([
        getPlexClients().catch(() => []),
        getPlexPlaylists().catch(() => []),
      ]);
      msPlexClients   = Array.isArray(rawClients)   ? rawClients   : (rawClients?.clients   || []);
      msPlexPlaylists = Array.isArray(rawPlaylists) ? rawPlaylists : (rawPlaylists?.playlists || []);
    } catch {
      msPlexClients   = [];
      msPlexPlaylists = [];
    }
    goToStep(5);
  });
}

function updateStep4Meta() {
  const metaEl = document.querySelector('.ms-meta');
  if (!metaEl) return;
  const dur = msTracks.reduce((s, t) => s + (t.duration || 0), 0);
  const spans = metaEl.querySelectorAll('span');
  if (spans[0]) spans[0].textContent = `🎵 ${msTracks.length} tracks`;
  if (spans[1]) spans[1].textContent = `⏱ ${formatDuration(dur)}`;
}

// ── Step 5 events ─────────────────────────────────────────────────────────────
function bindStep5() {
  // Play Now
  document.getElementById('ms-play-btn')?.addEventListener('click', async () => {
    const clientId = document.getElementById('ms-client-select')?.value;
    if (!clientId) return;
    msSelectedClient = clientId;
    const btn    = document.getElementById('ms-play-btn');
    const status = document.getElementById('ms-play-status');
    if (btn) { btn.disabled = true; btn.textContent = 'Bezig…'; }
    try {
      const keys = msTracks.map(t => t.ratingKey).filter(Boolean);
      await playQueue(keys, clientId);
      if (btn)    { btn.disabled = false; btn.textContent = '✓ Afspelen gestart'; }
      if (status) status.textContent = '✓';
    } catch (err) {
      if (btn)    { btn.disabled = false; btn.textContent = '▶ Play Now'; }
      if (status) status.textContent = `Mislukt: ${err.message}`;
    }
  });

  // Opslaan als nieuwe playlist
  document.getElementById('ms-save-btn')?.addEventListener('click', async () => {
    const btn    = document.getElementById('ms-save-btn');
    const status = document.getElementById('ms-save-status');
    if (btn) { btn.disabled = true; btn.textContent = 'Opslaan…'; }
    try {
      await savePlaylist({
        name:       msPlaylistName,
        tracks:     msTracks,
        ratingKeys: msTracks.map(t => t.ratingKey).filter(Boolean),
      });
      if (btn)    { btn.disabled = false; btn.textContent = '✓ Opgeslagen'; }
      if (status) status.textContent = '✓ Playlist aangemaakt in Plex';
    } catch (err) {
      if (btn)    { btn.disabled = false; btn.textContent = 'Opslaan in Plex'; }
      if (status) status.textContent = `Mislukt: ${err.message}`;
    }
  });

  // Toevoegen aan bestaande playlist
  document.getElementById('ms-add-btn')?.addEventListener('click', async () => {
    const playlistId = document.getElementById('ms-playlist-select')?.value;
    if (!playlistId) return;
    const btn    = document.getElementById('ms-add-btn');
    const status = document.getElementById('ms-add-status');
    if (btn) { btn.disabled = true; btn.textContent = 'Toevoegen…'; }
    try {
      await updatePlaylist({
        id:         playlistId,
        ratingKeys: msTracks.map(t => t.ratingKey).filter(Boolean),
      });
      if (btn)    { btn.disabled = false; btn.textContent = 'Toevoegen'; }
      if (status) status.textContent = '✓ Tracks toegevoegd';
    } catch (err) {
      if (btn)    { btn.disabled = false; btn.textContent = 'Toevoegen'; }
      if (status) status.textContent = `Mislukt: ${err.message}`;
    }
  });

  document.getElementById('ms-back-to-4')?.addEventListener('click', () => goToStep(4));
}

// ── Foutmelding onder body invoegen ───────────────────────────────────────────
function appendError(msg) {
  const body = document.getElementById('ms-body');
  if (!body) return;
  const existing = body.querySelector('.error-box.ms-injected');
  if (existing) existing.remove();
  const el = document.createElement('div');
  el.className = 'error-box ms-injected';
  el.textContent = `⚠ ${msg}`;
  body.insertBefore(el, body.firstChild);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDuration(ms) {
  if (!ms) return '';
  const totalSec = Math.round(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}u ${m}m`;
  return `${m}:${String(s).padStart(2, '0')}`;
}
