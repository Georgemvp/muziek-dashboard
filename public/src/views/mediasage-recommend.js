// ── View: MediaSage AI Album Aanbevelingen ───────────────────────────────────
// Multi-stap wizard voor AI-gebaseerde album-aanbevelingen via de MediaSage backend.
// Stap 1: Prompt + Modus + Vertrouwdheid
// Stap 2: Verduidelijkende vragen (of overslaan)
// Stap 3: Resultaat + Acties (afhankelijk van modus)

import { state } from '../state.js';
import { esc, gradientFor, initials } from '../helpers.js';
import {
  recommendAnalyzePrompt, recommendGenerate, recommendSwitchMode,
  getPlexClients, getAlbumArt, playQueue,
} from '../modules/mediasage-api.js';
import { apiFetch } from '../api.js';
import { switchView } from '../router.js';

// ── Module-level state ────────────────────────────────────────────────────────
let mrStep       = 1;
let mrMode       = 'library';     // 'library' | 'discovery'
let mrFamiliarity = null;         // 'comfort' | 'hidden' | 'rediscovery'
let mrPromptText = '';
let mrAnalysis   = null;          // resultaat van recommendAnalyzePrompt
let mrQuestions  = [];            // [ { question, options: [] }, ... ]
let mrAnswers    = {};            // { 0: 'antwoord', 1: 'antwoord' }
let mrResult     = null;          // aanbevelingsresultaat van recommendGenerate
let mrAbortCtrl  = null;
let mrPlexClients = [];
let mrTidarrResults = [];

// ── Entry point ───────────────────────────────────────────────────────────────
export async function loadMediaSageRecommend() {
  mrStep        = 1;
  mrMode        = 'library';
  mrFamiliarity = null;
  mrPromptText  = '';
  mrAnalysis    = null;
  mrQuestions   = [];
  mrAnswers     = {};
  mrResult      = null;
  mrPlexClients = [];
  mrTidarrResults = [];
  if (mrAbortCtrl) { mrAbortCtrl.abort(); mrAbortCtrl = null; }

  injectStyles();
  renderStep();
}

// ── CSS injecteren (eenmalig, hergebruik ms-* classes van playlist view) ───────
function injectStyles() {
  if (document.getElementById('ms-recommend-styles')) return;
  const style = document.createElement('style');
  style.id = 'ms-recommend-styles';
  style.textContent = `
    /* ── Hergebruik .ms-view, .ms-header, .ms-back-btn, .ms-title,           */
    /* .ms-card, .ms-btn, .ms-chips, .ms-chip, .ms-textarea van playlist view */

    /* ── Mode toggle ──────────────────────────────────────────────────────── */
    .msr-mode-row {
      display: flex;
      gap: 8px;
      margin-top: 14px;
    }
    .msr-mode-btn {
      flex: 1;
      padding: 10px 14px;
      border-radius: 8px;
      border: 2px solid var(--color-border);
      background: var(--color-bg);
      color: var(--color-text-secondary);
      font-size: 13px;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      text-align: center;
      transition: all .15s;
    }
    .msr-mode-btn:hover { border-color: var(--color-accent); color: var(--color-text); }
    .msr-mode-btn.active {
      border-color: var(--color-accent);
      background: color-mix(in srgb, var(--color-accent) 12%, transparent);
      color: var(--color-accent);
    }

    /* ── Familiarity cards ───────────────────────────────────────────────── */
    .msr-fam-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-top: 14px;
    }
    @media (max-width: 560px) {
      .msr-fam-grid { grid-template-columns: 1fr; }
    }
    .msr-fam-card {
      border: 2px solid var(--color-border);
      border-radius: 10px;
      padding: 14px 12px;
      cursor: pointer;
      text-align: center;
      transition: all .15s;
      background: var(--color-bg);
      user-select: none;
    }
    .msr-fam-card:hover { border-color: var(--color-accent); }
    .msr-fam-card.active {
      border-color: var(--color-accent);
      background: color-mix(in srgb, var(--color-accent) 10%, transparent);
    }
    .msr-fam-icon { font-size: 26px; margin-bottom: 6px; }
    .msr-fam-label {
      font-size: 13px;
      font-weight: 700;
      color: var(--color-text);
      margin-bottom: 3px;
    }
    .msr-fam-desc { font-size: 11px; color: var(--color-text-secondary); line-height: 1.35; }

    /* ── Vragen ──────────────────────────────────────────────────────────── */
    .msr-question-block { margin-bottom: 20px; }
    .msr-question-text {
      font-size: 14px;
      font-weight: 600;
      color: var(--color-text);
      margin-bottom: 10px;
      line-height: 1.4;
    }
    .msr-answer-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 7px;
    }
    .msr-answer-btn {
      padding: 7px 15px;
      border-radius: 20px;
      border: 1.5px solid var(--color-border);
      background: var(--color-bg);
      color: var(--color-text-secondary);
      font-size: 13px;
      font-family: inherit;
      cursor: pointer;
      transition: all .14s;
      user-select: none;
    }
    .msr-answer-btn:hover { border-color: var(--color-accent); color: var(--color-text); }
    .msr-answer-btn.selected {
      background: var(--color-accent);
      border-color: var(--color-accent);
      color: #fff;
      font-weight: 600;
    }

    /* ── Laad-indicator ──────────────────────────────────────────────────── */
    .msr-loading {
      text-align: center;
      padding: 32px 20px;
    }
    .msr-spinner {
      width: 40px;
      height: 40px;
      border: 3px solid var(--color-border);
      border-top-color: var(--color-accent);
      border-radius: 50%;
      animation: msr-spin .8s linear infinite;
      margin: 0 auto 14px;
    }
    @keyframes msr-spin { to { transform: rotate(360deg); } }
    .msr-loading-text { font-size: 14px; color: var(--color-text-secondary); }

    /* ── Primaire aanbeveling ────────────────────────────────────────────── */
    .msr-primary-card {
      background: var(--color-card);
      border: 1px solid var(--color-border);
      border-radius: 14px;
      padding: 22px;
      margin: 0 20px 16px;
      display: flex;
      gap: 20px;
      align-items: flex-start;
    }
    @media (max-width: 560px) {
      .msr-primary-card { flex-direction: column; align-items: center; text-align: center; margin: 0 12px 14px; }
    }
    .msr-album-art {
      width: 200px;
      height: 200px;
      border-radius: 10px;
      object-fit: cover;
      flex-shrink: 0;
    }
    .msr-album-art-ph {
      width: 200px;
      height: 200px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 42px;
      font-weight: 800;
      color: rgba(255,255,255,.75);
      flex-shrink: 0;
    }
    @media (max-width: 560px) {
      .msr-album-art, .msr-album-art-ph { width: 160px; height: 160px; }
    }
    .msr-album-meta { flex: 1; min-width: 0; }
    .msr-album-badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .05em;
      color: var(--color-accent);
      margin-bottom: 6px;
    }
    .msr-album-title {
      font-size: 22px;
      font-weight: 800;
      color: var(--color-text);
      line-height: 1.2;
      margin-bottom: 4px;
    }
    .msr-album-artist {
      font-size: 15px;
      color: var(--color-text-secondary);
      margin-bottom: 10px;
    }
    .msr-album-pitch {
      font-size: 14px;
      color: var(--color-text);
      line-height: 1.55;
      margin-bottom: 12px;
      font-style: italic;
      opacity: .85;
    }
    .msr-album-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      margin-bottom: 16px;
    }
    @media (max-width: 560px) { .msr-album-tags { justify-content: center; } }
    .msr-tag {
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 11px;
      background: color-mix(in srgb, var(--color-accent) 14%, transparent);
      color: var(--color-accent);
      border: 1px solid color-mix(in srgb, var(--color-accent) 28%, transparent);
    }

    /* ── Secundaire picks ────────────────────────────────────────────────── */
    .msr-picks-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin: 0 20px 16px;
    }
    @media (max-width: 560px) {
      .msr-picks-row { grid-template-columns: 1fr; margin: 0 12px 14px; }
    }
    .msr-pick-card {
      background: var(--color-card);
      border: 1px solid var(--color-border);
      border-radius: 10px;
      padding: 14px;
      display: flex;
      gap: 12px;
      align-items: center;
    }
    .msr-pick-art {
      width: 64px;
      height: 64px;
      border-radius: 7px;
      object-fit: cover;
      flex-shrink: 0;
    }
    .msr-pick-art-ph {
      width: 64px;
      height: 64px;
      border-radius: 7px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      font-weight: 700;
      color: rgba(255,255,255,.75);
      flex-shrink: 0;
    }
    .msr-pick-info { flex: 1; min-width: 0; }
    .msr-pick-title {
      font-size: 13px;
      font-weight: 700;
      color: var(--color-text);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      margin-bottom: 2px;
    }
    .msr-pick-artist {
      font-size: 11px;
      color: var(--color-text-secondary);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      margin-bottom: 3px;
    }
    .msr-pick-pitch {
      font-size: 11px;
      color: var(--color-text);
      opacity: .75;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    /* ── Actie-sectie ────────────────────────────────────────────────────── */
    .msr-actions-card {
      background: var(--color-card);
      border: 1px solid var(--color-border);
      border-radius: 10px;
      padding: 16px 20px;
      margin: 0 20px 12px;
    }
    @media (max-width: 768px) { .msr-actions-card { margin: 0 12px 12px; } }
    .msr-actions-title {
      font-size: 13px;
      font-weight: 700;
      color: var(--color-text-secondary);
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: .05em;
    }

    /* ── Tidarr zoekresultaten ────────────────────────────────────────────── */
    .msr-tidarr-results {
      margin-top: 12px;
      background: var(--color-bg);
      border: 1px solid var(--color-border);
      border-radius: 8px;
      max-height: 260px;
      overflow-y: auto;
    }
    .msr-tidarr-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 9px 12px;
      border-bottom: 1px solid var(--color-border);
      transition: background .12s;
    }
    .msr-tidarr-row:last-child { border-bottom: none; }
    .msr-tidarr-row:hover { background: var(--color-card); }
    .msr-tidarr-info { flex: 1; min-width: 0; }
    .msr-tidarr-title {
      font-size: 13px;
      font-weight: 600;
      color: var(--color-text);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .msr-tidarr-artist {
      font-size: 11px;
      color: var(--color-text-secondary);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }

    /* ── Select voor Plex client ─────────────────────────────────────────── */
    .msr-select {
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
    .msr-select:focus { outline: none; border-color: var(--color-accent); }

    /* ── Navigatie knoppen onderaan ──────────────────────────────────────── */
    .msr-bottom-bar {
      display: flex;
      gap: 10px;
      margin: 4px 20px 60px;
      flex-wrap: wrap;
    }
    @media (max-width: 560px) {
      .msr-bottom-bar { flex-direction: column; margin: 4px 12px 60px; }
      .msr-bottom-bar .ms-btn { width: 100%; }
    }

    /* ── Responsive overrides ────────────────────────────────────────────── */
    @media (max-width: 768px) {
      .ms-card  { margin: 0 12px 14px; padding: 16px; }
      .ms-header { padding: 12px 14px 6px; }
      .ms-steps  { padding: 10px 14px 8px; }
      .ms-title  { font-size: 17px; }
      .ms-row    { flex-direction: column; align-items: stretch; }
      .ms-btn    { width: 100%; }
    }
  `;
  document.head.appendChild(style);
}

// ── Render dispatcher ─────────────────────────────────────────────────────────
function renderStep() {
  const content = document.getElementById('content');
  if (!content) return;
  content.innerHTML = `
    <div class="ms-view" style="max-width:860px;margin:0 auto;padding-bottom:60px">
      ${renderHeader()}
      ${renderStepIndicator()}
      <div id="msr-body">${renderCurrentStep()}</div>
    </div>
  `;
  bindEvents();
}

function goToStep(n) {
  mrStep = n;
  const indicator = document.querySelector('.ms-steps');
  const body      = document.getElementById('msr-body');
  if (indicator) indicator.outerHTML = renderStepIndicator();
  const newBody = document.getElementById('msr-body') || body;
  if (newBody) {
    newBody.innerHTML = renderCurrentStep();
    bindEvents();
    document.querySelector('.ms-view')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    renderStep();
  }
}

// ── Header ────────────────────────────────────────────────────────────────────
function renderHeader() {
  return `
    <div class="ms-header">
      <button class="ms-back-btn" id="msr-back-btn">← Terug</button>
      <h1 class="ms-title">💿 AI Album Aanbevelingen</h1>
    </div>
  `;
}

// ── Step indicator ────────────────────────────────────────────────────────────
function renderStepIndicator() {
  const steps = [
    { n: 1, label: 'Prompt'   },
    { n: 2, label: 'Vragen'   },
    { n: 3, label: 'Resultaat'},
  ];
  return `
    <nav class="ms-steps" aria-label="Stappen">
      ${steps.map((s, i) => `
        <div class="ms-step${mrStep === s.n ? ' active' : ''}${mrStep > s.n ? ' done' : ''}">
          <div class="ms-step-dot">${mrStep > s.n ? '✓' : s.n}</div>
          <span class="ms-step-label">${s.label}</span>
        </div>
        ${i < steps.length - 1 ? `<div class="ms-step-line${mrStep > s.n ? ' done' : ''}"></div>` : ''}
      `).join('')}
    </nav>
  `;
}

function renderCurrentStep() {
  switch (mrStep) {
    case 1: return renderStep1();
    case 2: return renderStep2();
    case 3: return renderStep3();
    default: return '';
  }
}

// ── STAP 1: Prompt + Modus + Vertrouwdheid ────────────────────────────────────
function renderStep1() {
  const famCards = [
    { key: 'comfort',    icon: '🛋️', label: 'Comfort picks',   desc: 'Albums die je al kent en geweldig vindt' },
    { key: 'hidden',     icon: '💎', label: 'Hidden gems',      desc: 'Minder bekende pareltjes die je verrassen' },
    { key: 'rediscovery',icon: '🔄', label: 'Rediscoveries',    desc: 'Albums die je vergeten was maar weer wil horen' },
  ];

  return `
    <div class="ms-card">
      <h2>Beschrijf wat je wilt horen</h2>
      <textarea
        class="ms-textarea"
        id="msr-prompt"
        placeholder="Bijv. 'Een dromerig post-rock album voor een rustige avond' of 'Stevige jazz met een donkere sfeer…'"
        maxlength="500"
      >${esc(mrPromptText)}</textarea>

      <div class="ms-field" style="margin-top:18px">
        <label style="display:block;font-size:13px;font-weight:600;color:var(--color-text-secondary);margin-bottom:6px">Modus</label>
        <div class="msr-mode-row">
          <button class="msr-mode-btn${mrMode === 'library' ? ' active' : ''}" id="msr-mode-library">
            📚 Library
            <div style="font-weight:400;font-size:11px;margin-top:2px;opacity:.8">Albums die je hebt</div>
          </button>
          <button class="msr-mode-btn${mrMode === 'discovery' ? ' active' : ''}" id="msr-mode-discovery">
            🌍 Discovery
            <div style="font-weight:400;font-size:11px;margin-top:2px;opacity:.8">Nieuwe albums ontdekken</div>
          </button>
        </div>
      </div>

      <div class="ms-field">
        <label style="display:block;font-size:13px;font-weight:600;color:var(--color-text-secondary);margin-bottom:6px">Vertrouwdheid</label>
        <div class="msr-fam-grid">
          ${famCards.map(f => `
            <div class="msr-fam-card${mrFamiliarity === f.key ? ' active' : ''}" data-fam="${f.key}">
              <div class="msr-fam-icon">${f.icon}</div>
              <div class="msr-fam-label">${f.label}</div>
              <div class="msr-fam-desc">${f.desc}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="ms-row">
        <button class="ms-btn ms-btn-primary" id="msr-analyze-btn">Analyseer →</button>
      </div>
    </div>
  `;
}

// ── STAP 2: Verduidelijkende vragen ───────────────────────────────────────────
function renderStep2() {
  if (!mrQuestions.length) {
    // Toon laad-indicator terwijl we wachten op vragen
    return `
      <div class="ms-card">
        <div class="msr-loading">
          <div class="msr-spinner"></div>
          <div class="msr-loading-text">Vragen genereren…</div>
        </div>
      </div>
    `;
  }

  const questionBlocks = mrQuestions.slice(0, 2).map((q, qi) => {
    const options = Array.isArray(q.options) ? q.options : [];
    const selected = mrAnswers[qi];
    return `
      <div class="msr-question-block">
        <div class="msr-question-text">${esc(q.question || q.text || `Vraag ${qi + 1}`)}</div>
        <div class="msr-answer-grid">
          ${options.map(opt => {
            const optText = typeof opt === 'string' ? opt : (opt.label || opt.text || String(opt));
            return `<button class="msr-answer-btn${selected === optText ? ' selected' : ''}"
              data-qi="${qi}" data-answer="${esc(optText)}">${esc(optText)}</button>`;
          }).join('')}
        </div>
      </div>
    `;
  }).join('');

  const allAnswered = mrQuestions.slice(0, 2).every((_, qi) => mrAnswers[qi]);

  return `
    <div class="ms-card">
      <h2>Wat past het beste bij jou?</h2>
      <p style="font-size:13px;color:var(--color-text-secondary);margin:-10px 0 18px">
        Beantwoord de vragen voor nauwkeurigere aanbevelingen.
      </p>
      <div id="msr-questions-body">
        ${questionBlocks}
      </div>
      <div class="ms-row">
        <button class="ms-btn ms-btn-ghost" id="msr-back-to-1">← Terug</button>
        <button class="ms-btn ms-btn-ghost"    id="msr-skip-btn">Sla over</button>
        ${allAnswered ? `<button class="ms-btn ms-btn-primary" id="msr-generate-btn">Genereer →</button>` : ''}
      </div>
    </div>
  `;
}

// ── STAP 3: Resultaat ─────────────────────────────────────────────────────────
function renderStep3() {
  if (!mrResult) {
    return `
      <div class="ms-card">
        <div class="msr-loading">
          <div class="msr-spinner"></div>
          <div class="msr-loading-text">Aanbeveling genereren…</div>
        </div>
      </div>
    `;
  }

  const primary   = mrResult.primary   || mrResult.recommendation || mrResult;
  const picks     = mrResult.picks     || mrResult.alternatives   || [];
  const altMode   = mrMode === 'library' ? 'discovery' : 'library';
  const altLabel  = mrMode === 'library' ? '🌍 Schakel naar Discovery' : '📚 Schakel naar Library';

  return `
    ${renderPrimaryCard(primary)}
    ${picks.length ? renderSecondaryPicks(picks.slice(0, 2)) : ''}
    ${renderActionsCard(primary)}

    <div class="msr-bottom-bar">
      <button class="ms-btn ms-btn-secondary" id="msr-another-btn">↻ Ander album</button>
      <button class="ms-btn ms-btn-ghost"     id="msr-switch-mode-btn" data-mode="${altMode}">${altLabel}</button>
      <button class="ms-btn ms-btn-ghost"     id="msr-back-to-1-result">← Nieuwe zoekopdracht</button>
    </div>
  `;
}

// ── Primaire albumcard ────────────────────────────────────────────────────────
function renderPrimaryCard(album) {
  if (!album) return '';
  const title   = album.album   || album.title || 'Onbekend album';
  const artist  = album.artist  || album.artist_name || '';
  const year    = album.year    || album.release_year || '';
  const pitch   = album.pitch   || album.description || album.editorial || '';
  const genres  = album.genres  || album.tags || [];
  const rk      = album.ratingKey || album.rating_key;
  const coverUrl = album.cover_url || album.cover || (rk ? getAlbumArt(rk) : null);

  const artHtml = coverUrl
    ? `<img src="${esc(coverUrl)}" class="msr-album-art" alt="${esc(title)}"
         loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
    : '';
  const phHtml = `<div class="msr-album-art-ph"
    style="background:${gradientFor(title)};${coverUrl ? 'display:none' : ''}"
  >${initials(title)}</div>`;

  const modeBadge = mrMode === 'library' ? '📚 In je bibliotheek' : '🌍 Nieuw te ontdekken';
  const genreTags = genres.slice(0, 5).map(g => `<span class="msr-tag">${esc(String(g))}</span>`).join('');

  return `
    <div class="msr-primary-card" id="msr-primary-card">
      ${artHtml}${phHtml}
      <div class="msr-album-meta">
        <span class="msr-album-badge">${modeBadge}</span>
        <div class="msr-album-title">${esc(title)}</div>
        <div class="msr-album-artist">${esc(artist)}${year ? ` · ${esc(String(year))}` : ''}</div>
        ${pitch ? `<div class="msr-album-pitch">"${esc(pitch)}"</div>` : ''}
        ${genreTags ? `<div class="msr-album-tags">${genreTags}</div>` : ''}
      </div>
    </div>
  `;
}

// ── Secundaire picks ──────────────────────────────────────────────────────────
function renderSecondaryPicks(picks) {
  const cards = picks.map(p => {
    const title    = p.album  || p.title || 'Onbekend';
    const artist   = p.artist || p.artist_name || '';
    const pitch    = p.pitch  || p.description || p.editorial || '';
    const rk       = p.ratingKey || p.rating_key;
    const coverUrl = p.cover_url || p.cover || (rk ? getAlbumArt(rk) : null);

    const artHtml = coverUrl
      ? `<img src="${esc(coverUrl)}" class="msr-pick-art" alt="${esc(title)}"
           loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
      : '';
    const phHtml = `<div class="msr-pick-art-ph"
      style="background:${gradientFor(title)};${coverUrl ? 'display:none' : ''}"
    >${initials(title)}</div>`;

    return `
      <div class="msr-pick-card">
        ${artHtml}${phHtml}
        <div class="msr-pick-info">
          <div class="msr-pick-title" title="${esc(title)}">${esc(title)}</div>
          <div class="msr-pick-artist">${esc(artist)}</div>
          ${pitch ? `<div class="msr-pick-pitch">${esc(pitch)}</div>` : ''}
        </div>
      </div>
    `;
  }).join('');

  return `
    <div style="padding:0 20px 4px;font-size:12px;font-weight:700;color:var(--color-text-secondary);
      text-transform:uppercase;letter-spacing:.05em">Ook het overwegen waard</div>
    <div class="msr-picks-row">${cards}</div>
  `;
}

// ── Acties (afhankelijk van modus) ────────────────────────────────────────────
function renderActionsCard(album) {
  if (!album) return '';
  const title  = album.album  || album.title || '';
  const artist = album.artist || album.artist_name || '';

  if (mrMode === 'library') {
    // Library: Play / Add to Queue
    const clientOptions = mrPlexClients.length
      ? mrPlexClients.map(c => {
          const id    = c.clientIdentifier || c.id    || c.name || '';
          const label = c.name             || c.title || c.clientIdentifier || id;
          return `<option value="${esc(id)}">${esc(label)}</option>`;
        }).join('')
      : '<option value="">Geen clients gevonden</option>';

    return `
      <div class="msr-actions-card">
        <div class="msr-actions-title">▶ Afspelen</div>
        <select class="msr-select" id="msr-client-select">
          <option value="">Kies een Plex-client…</option>
          ${clientOptions}
        </select>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="ms-btn ms-btn-primary" id="msr-play-btn"
            ${mrPlexClients.length ? '' : 'disabled'}>▶ Album afspelen</button>
          <button class="ms-btn ms-btn-secondary" id="msr-queue-btn"
            ${mrPlexClients.length ? '' : 'disabled'}>+ Aan wachtrij</button>
          <span id="msr-play-status" style="font-size:13px;color:var(--color-text-secondary);align-self:center"></span>
        </div>
      </div>
    `;
  } else {
    // Discovery: Zoek in Tidarr / Voeg toe aan Listen Later
    const tidarrResultsHtml = mrTidarrResults.length
      ? `<div class="msr-tidarr-results" id="msr-tidarr-results">
          ${mrTidarrResults.map(r => {
            const rTitle  = r.title  || r.name || r.album || 'Onbekend';
            const rArtist = r.artist || r.artistName || '';
            const jsonSafe = JSON.stringify({ id: r.id, title: rTitle, artist: rArtist })
              .replace(/'/g, '&#39;');
            return `
              <div class="msr-tidarr-row">
                <div class="msr-tidarr-info">
                  <div class="msr-tidarr-title">${esc(rTitle)}</div>
                  <div class="msr-tidarr-artist">${esc(rArtist)}</div>
                </div>
                <button class="ms-btn ms-btn-primary" style="padding:6px 12px;font-size:12px"
                  data-tidarr-item='${jsonSafe}' onclick="this.textContent='↓ Toegevoegd';this.disabled=true">
                  ↓ Download
                </button>
              </div>
            `;
          }).join('')}
        </div>`
      : '';

    return `
      <div class="msr-actions-card">
        <div class="msr-actions-title">🔍 Downloaden &amp; Bewaren</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:${tidarrResultsHtml ? '10px' : '0'}">
          <button class="ms-btn ms-btn-primary" id="msr-tidarr-btn"
            data-q="${esc(`${artist} ${title}`)}">🎵 Zoek in Tidarr</button>
          <button class="ms-btn ms-btn-secondary" id="msr-wishlist-btn"
            data-album="${esc(title)}" data-artist="${esc(artist)}">♡ Listen Later</button>
          <span id="msr-disc-status" style="font-size:13px;color:var(--color-text-secondary);align-self:center"></span>
        </div>
        <div id="msr-tidarr-results-wrap">${tidarrResultsHtml}</div>
      </div>
    `;
  }
}

// ── Event binding ─────────────────────────────────────────────────────────────
function bindEvents() {
  document.getElementById('msr-back-btn')?.addEventListener('click', () => {
    if (mrAbortCtrl) { mrAbortCtrl.abort(); mrAbortCtrl = null; }
    switchView('mediasage');
  });

  switch (mrStep) {
    case 1: bindStep1(); break;
    case 2: bindStep2(); break;
    case 3: bindStep3(); break;
  }
}

// ── Step 1 events ─────────────────────────────────────────────────────────────
function bindStep1() {
  document.getElementById('msr-prompt')?.addEventListener('input', e => {
    mrPromptText = e.target.value;
  });

  document.getElementById('msr-mode-library')?.addEventListener('click', () => {
    mrMode = 'library';
    document.querySelectorAll('.msr-mode-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('msr-mode-library')?.classList.add('active');
  });

  document.getElementById('msr-mode-discovery')?.addEventListener('click', () => {
    mrMode = 'discovery';
    document.querySelectorAll('.msr-mode-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('msr-mode-discovery')?.classList.add('active');
  });

  document.querySelectorAll('.msr-fam-card').forEach(card => {
    card.addEventListener('click', () => {
      const key = card.dataset.fam;
      mrFamiliarity = mrFamiliarity === key ? null : key;
      document.querySelectorAll('.msr-fam-card').forEach(c => {
        c.classList.toggle('active', c.dataset.fam === mrFamiliarity);
      });
    });
  });

  document.getElementById('msr-analyze-btn')?.addEventListener('click', handleAnalyze);
}

async function handleAnalyze() {
  const promptEl = document.getElementById('msr-prompt');
  const prompt   = (promptEl?.value || mrPromptText).trim();

  if (!prompt) { promptEl?.focus(); return; }
  mrPromptText = prompt;

  const btn = document.getElementById('msr-analyze-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Analyseren…'; }

  // Abort eerdere requests
  if (mrAbortCtrl) mrAbortCtrl.abort();
  mrAbortCtrl = new AbortController();

  // Ga alvast naar stap 2 terwijl we de vragen laden
  mrQuestions = [];
  mrAnswers   = {};
  goToStep(2);

  try {
    const result = await recommendAnalyzePrompt(prompt);
    mrAnalysis  = result;

    // Backend kan vragen retourneren in result.questions of result.clarifications
    const rawQ = result?.questions || result?.clarifications || [];
    mrQuestions = Array.isArray(rawQ) ? rawQ : [];

    // Herrender stap 2 nu we de vragen hebben
    const body = document.getElementById('msr-body');
    if (body) {
      body.innerHTML = renderStep2();
      bindStep2();
    }
  } catch (err) {
    if (err.name === 'AbortError') return;
    if (btn) { btn.disabled = false; btn.textContent = 'Analyseer →'; }
    // Geen vragen beschikbaar, genereer direct
    mrQuestions = [];
    startGenerate();
  }
}

// ── Step 2 events ─────────────────────────────────────────────────────────────
function bindStep2() {
  document.getElementById('msr-back-to-1')?.addEventListener('click', () => goToStep(1));

  document.getElementById('msr-skip-btn')?.addEventListener('click', () => startGenerate());

  document.querySelectorAll('.msr-answer-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const qi     = parseInt(btn.dataset.qi);
      const answer = btn.dataset.answer;
      mrAnswers[qi] = answer;

      // Update visuele staat van antwoorden in dezelfde vraaggroep
      document.querySelectorAll(`.msr-answer-btn[data-qi="${qi}"]`).forEach(b => {
        b.classList.toggle('selected', b.dataset.answer === answer);
      });

      // Controleer of alle vragen beantwoord zijn → toon genereerknop of genereer automatisch
      const allAnswered = mrQuestions.slice(0, 2).every((_, i) => mrAnswers[i]);
      if (allAnswered) {
        // Voeg genereer-knop toe als die er nog niet is
        const row = document.querySelector('.ms-row');
        if (row && !document.getElementById('msr-generate-btn')) {
          const genBtn = document.createElement('button');
          genBtn.className = 'ms-btn ms-btn-primary';
          genBtn.id = 'msr-generate-btn';
          genBtn.textContent = 'Genereer →';
          genBtn.addEventListener('click', startGenerate);
          row.appendChild(genBtn);
        }
        // Auto-genereren na korte vertraging
        setTimeout(() => {
          if (mrStep === 2 && mrQuestions.slice(0, 2).every((_, i) => mrAnswers[i])) {
            startGenerate();
          }
        }, 600);
      }
    });
  });

  document.getElementById('msr-generate-btn')?.addEventListener('click', startGenerate);
}

// ── Genereren ─────────────────────────────────────────────────────────────────
async function startGenerate() {
  if (mrAbortCtrl) mrAbortCtrl.abort();
  mrAbortCtrl = new AbortController();

  mrResult        = null;
  mrTidarrResults = [];
  mrPlexClients   = [];

  goToStep(3);   // toon laad-spinner

  try {
    const config = buildRecommendConfig();
    const [result, clients] = await Promise.all([
      recommendGenerate(config),
      mrMode === 'library'
        ? getPlexClients().catch(() => [])
        : Promise.resolve([]),
    ]);

    mrResult      = result;
    mrPlexClients = Array.isArray(clients) ? clients : (clients?.clients || []);

    // Herrender stap 3 met het echte resultaat
    const body = document.getElementById('msr-body');
    if (body) {
      body.innerHTML = renderStep3();
      bindStep3();
    }
  } catch (err) {
    if (err.name === 'AbortError') return;
    appendError(`Generatie mislukt: ${err.message}`);
    const body = document.getElementById('msr-body');
    if (body) body.innerHTML = renderStep3(); // toon spinner weg
  }
}

function buildRecommendConfig() {
  return {
    prompt:      mrPromptText  || undefined,
    mode:        mrMode,
    familiarity: mrFamiliarity || undefined,
    analysis:    mrAnalysis    || undefined,
    answers:     Object.keys(mrAnswers).length ? mrAnswers : undefined,
    questions:   mrQuestions.length ? mrQuestions.slice(0, 2) : undefined,
  };
}

// ── Step 3 events ─────────────────────────────────────────────────────────────
function bindStep3() {
  if (!mrResult) return;

  const primary = mrResult.primary || mrResult.recommendation || mrResult;

  // "Ander album" knop
  document.getElementById('msr-another-btn')?.addEventListener('click', startGenerate);

  // "Nieuwe zoekopdracht" knop
  document.getElementById('msr-back-to-1-result')?.addEventListener('click', () => goToStep(1));

  // "Wissel modus" knop
  document.getElementById('msr-switch-mode-btn')?.addEventListener('click', async e => {
    const newMode = e.currentTarget.dataset.mode;
    const btn = e.currentTarget;
    if (btn) { btn.disabled = true; btn.textContent = 'Wisselen…'; }
    try {
      await recommendSwitchMode(newMode);
      mrMode = newMode;
      mrTidarrResults = [];
      mrPlexClients   = [];
      startGenerate();
    } catch (err) {
      if (btn) { btn.disabled = false; }
      appendError(`Modus wisselen mislukt: ${err.message}`);
    }
  });

  if (mrMode === 'library') {
    bindLibraryActions(primary);
  } else {
    bindDiscoveryActions(primary);
  }
}

function bindLibraryActions(album) {
  document.getElementById('msr-play-btn')?.addEventListener('click', async () => {
    const clientId = document.getElementById('msr-client-select')?.value;
    if (!clientId) return;
    const btn    = document.getElementById('msr-play-btn');
    const status = document.getElementById('msr-play-status');
    if (btn) { btn.disabled = true; btn.textContent = 'Bezig…'; }
    try {
      const keys = extractRatingKeys(album);
      if (!keys.length) throw new Error('Geen trackinformatie beschikbaar');
      await playQueue(keys, clientId);
      if (btn)    { btn.disabled = false; btn.textContent = '✓ Afspelen'; }
      if (status) status.textContent = '✓ Gestart';
    } catch (err) {
      if (btn)    { btn.disabled = false; btn.textContent = '▶ Album afspelen'; }
      if (status) status.textContent = `Mislukt: ${err.message}`;
    }
  });

  document.getElementById('msr-queue-btn')?.addEventListener('click', async () => {
    const clientId = document.getElementById('msr-client-select')?.value;
    if (!clientId) return;
    const btn    = document.getElementById('msr-queue-btn');
    const status = document.getElementById('msr-play-status');
    if (btn) { btn.disabled = true; btn.textContent = 'Toevoegen…'; }
    try {
      const keys = extractRatingKeys(album);
      if (!keys.length) throw new Error('Geen trackinformatie beschikbaar');
      // Voeg toe aan bestaande wachtrij (append=true)
      await playQueue(keys, clientId, true);
      if (btn)    { btn.disabled = false; btn.textContent = '✓ Toegevoegd'; }
      if (status) status.textContent = '✓ Aan wachtrij toegevoegd';
    } catch (err) {
      if (btn)    { btn.disabled = false; btn.textContent = '+ Aan wachtrij'; }
      if (status) status.textContent = `Mislukt: ${err.message}`;
    }
  });
}

function bindDiscoveryActions(album) {
  // Zoek in Tidarr
  document.getElementById('msr-tidarr-btn')?.addEventListener('click', async e => {
    const q   = e.currentTarget.dataset.q;
    const btn = e.currentTarget;
    if (btn) { btn.disabled = true; btn.textContent = 'Zoeken…'; }

    try {
      const res = await apiFetch(`/api/tidarr/search?q=${encodeURIComponent(q)}`);
      mrTidarrResults = Array.isArray(res) ? res : (res?.results || res?.items || []);

      const wrap = document.getElementById('msr-tidarr-results-wrap');
      if (wrap) {
        if (!mrTidarrResults.length) {
          wrap.innerHTML = `<div style="padding:10px;font-size:13px;color:var(--color-text-secondary)">Geen resultaten gevonden</div>`;
        } else {
          wrap.innerHTML = `<div class="msr-tidarr-results">
            ${mrTidarrResults.map(r => {
              const rTitle  = r.title  || r.name  || r.album || 'Onbekend';
              const rArtist = r.artist || r.artistName || '';
              return `
                <div class="msr-tidarr-row">
                  <div class="msr-tidarr-info">
                    <div class="msr-tidarr-title">${esc(rTitle)}</div>
                    <div class="msr-tidarr-artist">${esc(rArtist)}</div>
                  </div>
                  <button class="ms-btn ms-btn-primary" style="padding:6px 12px;font-size:12px"
                    data-tidarr-id="${esc(String(r.id || ''))}"
                    data-tidarr-title="${esc(rTitle)}"
                    data-tidarr-artist="${esc(rArtist)}">
                    ↓ Download
                  </button>
                </div>
              `;
            }).join('')}
          </div>`;

          // Bind download-knoppen
          wrap.querySelectorAll('[data-tidarr-id]').forEach(dlBtn => {
            dlBtn.addEventListener('click', async () => {
              const id     = dlBtn.dataset.tidarrId;
              const dTitle = dlBtn.dataset.tidarrTitle;
              dlBtn.disabled = true;
              dlBtn.textContent = 'Bezig…';
              try {
                await apiFetch('/api/tidarr/download', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ id, title: dTitle }),
                });
                dlBtn.textContent = '✓ Toegevoegd';
              } catch (err) {
                dlBtn.disabled = false;
                dlBtn.textContent = '↓ Download';
                const status = document.getElementById('msr-disc-status');
                if (status) status.textContent = `Mislukt: ${err.message}`;
              }
            });
          });
        }
      }
    } catch (err) {
      const status = document.getElementById('msr-disc-status');
      if (status) status.textContent = `Zoeken mislukt: ${err.message}`;
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = '🎵 Zoek in Tidarr'; }
    }
  });

  // Voeg toe aan Listen Later (wishlist)
  document.getElementById('msr-wishlist-btn')?.addEventListener('click', async e => {
    const albumName  = e.currentTarget.dataset.album;
    const artistName = e.currentTarget.dataset.artist;
    const btn        = e.currentTarget;
    const status     = document.getElementById('msr-disc-status');

    if (btn) { btn.disabled = true; btn.textContent = 'Toevoegen…'; }
    try {
      await apiFetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type:   'album',
          name:   albumName,
          artist: artistName,
        }),
      });
      if (btn)    { btn.textContent = '♥ Opgeslagen'; }
      if (status) status.textContent = '✓ Toegevoegd aan Listen Later';
    } catch (err) {
      if (btn)    { btn.disabled = false; btn.textContent = '♡ Listen Later'; }
      if (status) status.textContent = `Mislukt: ${err.message}`;
    }
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Haal Plex ratingKeys op uit een albumresultaat (album of losse tracks). */
function extractRatingKeys(album) {
  if (!album) return [];
  // Probeer directe ratingKey (album-item)
  if (album.ratingKey || album.rating_key) {
    return [album.ratingKey || album.rating_key];
  }
  // Probeer tracks-array
  if (Array.isArray(album.tracks)) {
    return album.tracks.map(t => t.ratingKey || t.rating_key).filter(Boolean);
  }
  return [];
}

/** Voeg een foutmelding boven de huidige stap in. */
function appendError(msg) {
  const body = document.getElementById('msr-body');
  if (!body) return;
  const existing = body.querySelector('.error-box.msr-injected');
  if (existing) existing.remove();
  const el = document.createElement('div');
  el.className = 'error-box msr-injected';
  el.style.margin = '0 20px 14px';
  el.textContent = `⚠ ${msg}`;
  body.insertBefore(el, body.firstChild);
}
