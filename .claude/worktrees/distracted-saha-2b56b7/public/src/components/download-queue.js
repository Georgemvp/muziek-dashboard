// ── Download Queue Indicator ───────────────────────────────────────────────
// Globale altijd-zichtbare balk die actieve Tidarr- en OrpheusDL-downloads toont.
// Singleton: één instantie, geïnitialiseerd bij boot via initDownloadQueue().

import { state } from '../state.js';
import { esc } from '../helpers.js';
import { switchView } from '../router.js';

// Tidarr actieve statussen
const ACTIVE_STATUSES = new Set(['download', 'processing', 'queue_download', 'queue_processing']);

const TIDARR_STATUS_LABEL = {
  queue_download:   'In wachtrij',
  queue_processing: 'Verwerken (wacht)',
  download:         'Downloaden…',
  processing:       'Verwerken…',
};

// OrpheusDL platform-kleuren (gesynchroniseerd met downloads.js)
const PLATFORM_COLORS = {
  tidal:       '#33ffe7',
  qobuz:       '#0070ef',
  deezer:      '#a238ff',
  spotify:     '#1cc659',
  soundcloud:  '#ff5502',
  applemusic:  '#FA586A',
  beatport:    '#00ff89',
  beatsource:  '#16a8f4',
  youtube:     '#FF0000',
};

const PLATFORM_LABELS = {
  tidal: 'Tidal', qobuz: 'Qobuz', deezer: 'Deezer',
  spotify: 'Spotify', soundcloud: 'SoundCloud', applemusic: 'Apple Music',
  beatport: 'Beatport', beatsource: 'Beatsource', youtube: 'YouTube',
};

// ── Module-state ───────────────────────────────────────────────────────────
let _barEl = null;
let _minimized = false;
let _lastRenderedKey = null;  // Om onnodige DOM-updates te voorkomen

// ── Helpers ────────────────────────────────────────────────────────────────

/** Geeft actieve Tidarr queue-items terug. */
function getActiveTidarr() {
  return (state.tidarrQueueItems || []).filter(i => ACTIVE_STATUSES.has(i.status));
}

/** Geeft actieve OrpheusDL jobs terug. */
function getActiveOrpheus() {
  return (state.activeOrpheusJobs || []).filter(
    j => j.status !== 'done' && j.status !== 'error' && j.status !== 'stopped'
  );
}

/** Bereken voortgangspercentage voor een Tidarr-item. */
function tidarrPct(item) {
  if (item.progress?.current && item.progress?.total) {
    return Math.round(item.progress.current / item.progress.total * 100);
  }
  return null;
}

/** Maak een cache-sleutel om onnodige reflows te vermijden. */
function renderKey(tidarrItems, orpheusJobs) {
  const t = tidarrItems.map(i => `${i.id}:${i.status}:${tidarrPct(i)}`).join('|');
  const o = orpheusJobs.map(j => `${j.jobId}:${j.status}:${Math.round(j.progress ?? 0)}`).join('|');
  return `${t}||${o}`;
}

// ── Rendering ──────────────────────────────────────────────────────────────

/** Render één download-rij (Tidarr of OrpheusDL). */
function renderItem(item) {
  const isTidarr = !!item._source_tidarr;
  const title    = esc(item.title || '(onbekend)');
  const artist   = item.artist ? esc(item.artist) : '';
  const pct      = typeof item._pct === 'number' ? item._pct : null;
  const pctBar   = pct !== null
    ? `<div class="dlq-progress-wrap" aria-label="${pct}% voltooid">
         <div class="dlq-progress-bar">
           <div class="dlq-progress-fill" style="width:${pct}%"></div>
         </div>
         <span class="dlq-pct">${pct}%</span>
       </div>`
    : '';

  let badge;
  if (isTidarr) {
    badge = `<span class="dlq-source-badge dlq-source-tidarr">Tidarr</span>`;
  } else {
    const platform = (item.platform || '').toLowerCase();
    const color    = PLATFORM_COLORS[platform] || '#888';
    const label    = PLATFORM_LABELS[platform] || (item.platform || 'Orpheus');
    badge = `<span class="dlq-source-badge" style="--badge-clr:${color}">${esc(label)}</span>`;
  }

  const statusLabel = isTidarr
    ? (TIDARR_STATUS_LABEL[item.status] || item.status || 'In wachtrij')
    : _orpheusStatusLabel(item.status);

  return `
    <div class="dlq-item">
      <div class="dlq-item-top">
        ${badge}
        <div class="dlq-item-info">
          <span class="dlq-item-title">${title}</span>
          ${artist ? `<span class="dlq-item-artist">${artist}</span>` : ''}
        </div>
        <span class="dlq-item-status">${esc(statusLabel)}</span>
      </div>
      ${pctBar}
    </div>`;
}

function _orpheusStatusLabel(status) {
  const map = {
    pending: 'In wachtrij',
    running: 'Downloaden…',
    done:    '✓ Klaar',
    error:   '⚠ Fout',
    stopped: '■ Gestopt',
  };
  return map[status] || status || 'In wachtrij';
}

/** Bouw de volledige balk-HTML. */
function buildBarHTML(tidarrItems, orpheusJobs) {
  // Combineer: actieve Tidarr-items eerst, dan OrpheusDL jobs
  const combined = [
    ...tidarrItems.map(i => ({
      ...i,
      _source_tidarr: true,
      _pct: tidarrPct(i),
    })),
    ...orpheusJobs.map(j => ({
      ...j,
      _source_orpheus: true,
      _pct: typeof j.progress === 'number' ? Math.round(j.progress) : null,
    })),
  ];

  const total    = combined.length;
  const showMax  = 2;
  const overflow = total > showMax ? total - showMax : 0;
  const visible  = combined.slice(0, showMax);

  const itemsHtml = visible.map(renderItem).join('');
  const overflowHtml = overflow > 0
    ? `<div class="dlq-overflow">+ ${overflow} meer in wachtrij</div>`
    : '';

  const minimizeTitle = _minimized ? 'Uitklappen' : 'Minimaliseren';
  const minimizeIcon  = _minimized ? '▲' : '▼';

  return `
    <div class="dlq-header">
      <span class="dlq-title">
        <svg class="dlq-icon" width="13" height="13" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" stroke-width="2.5"
             stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        Downloaden (${total})
      </span>
      <div class="dlq-actions">
        <button class="dlq-btn" id="dlq-minimize" title="${minimizeTitle}" aria-label="${minimizeTitle}">
          ${minimizeIcon}
        </button>
      </div>
    </div>
    ${_minimized ? '' : `<div class="dlq-body">${itemsHtml}${overflowHtml}</div>`}`;
}

/** Mini-badge (alleen zichtbaar in geminimaliseerde modus). */
function buildMiniHTML(total) {
  return `
    <button class="dlq-mini-btn" id="dlq-mini" title="Download queue tonen (${total} actief)" aria-label="Download queue tonen">
      <svg width="14" height="14" viewBox="0 0 24 24"
           fill="none" stroke="currentColor" stroke-width="2.5"
           stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
      <span class="dlq-mini-count">${total}</span>
    </button>`;
}

// ── Hoofd update-functie ────────────────────────────────────────────────────

/**
 * Update de download queue indicator op basis van huidige state.
 * Veilig om snel achter elkaar aan te roepen — slaat DOM-update over als niets veranderd is.
 */
export function updateDownloadQueue() {
  if (!_barEl) return;

  const tidarrItems = getActiveTidarr();
  const orpheusJobs = getActiveOrpheus();
  const total       = tidarrItems.length + orpheusJobs.length;

  // Niets actief → verberg balk
  if (total === 0) {
    if (_barEl.classList.contains('dlq-visible')) {
      _barEl.classList.remove('dlq-visible');
      _barEl.classList.add('dlq-hiding');
      // Verwijder 'hiding' na animatie
      const onEnd = () => {
        _barEl.classList.remove('dlq-hiding');
        _barEl.removeEventListener('transitionend', onEnd);
      };
      _barEl.addEventListener('transitionend', onEnd);
    }
    _lastRenderedKey = null;
    return;
  }

  // Zichtbaar maken (als dat nog niet zo is)
  if (!_barEl.classList.contains('dlq-visible')) {
    _barEl.classList.remove('dlq-hiding');
    // Forceer reflow voor animatie
    void _barEl.offsetHeight;
    _barEl.classList.add('dlq-visible');
  }

  // Check of er echt iets veranderd is
  const key = renderKey(tidarrItems, orpheusJobs) + `|min:${_minimized}`;
  if (key === _lastRenderedKey) return;
  _lastRenderedKey = key;

  // Minimaliseerde modus → toon alleen mini-badge
  if (_minimized) {
    _barEl.innerHTML = buildMiniHTML(total);
    _bindMiniBtn();
    return;
  }

  // Volledige weergave
  _barEl.innerHTML = buildBarHTML(tidarrItems, orpheusJobs);
  _bindEvents();
}

// ── Event binding ──────────────────────────────────────────────────────────

function _bindEvents() {
  // Klik op balk → navigeer naar downloads queue-tab
  _barEl.addEventListener('click', _onBarClick);

  // Minimaliseer-knop
  const minBtn = _barEl.querySelector('#dlq-minimize');
  if (minBtn) {
    minBtn.addEventListener('click', e => {
      e.stopPropagation();
      _minimized = true;
      _lastRenderedKey = null;
      updateDownloadQueue();
    });
  }
}

function _bindMiniBtn() {
  const miniBtn = _barEl.querySelector('#dlq-mini');
  if (miniBtn) {
    miniBtn.addEventListener('click', e => {
      e.stopPropagation();
      _minimized = false;
      _lastRenderedKey = null;
      updateDownloadQueue();
    });
  }
}

function _onBarClick(e) {
  // Negeer klikken op knoppen
  if (e.target.closest('button')) return;
  _navigateToDownloads();
}

function _navigateToDownloads() {
  try {
    // Importeer setTidalView dynamisch om cirkelafhankelijkheden te vermijden
    import('../views/downloads.js').then(({ setTidalView }) => {
      switchView('downloads');
      setTimeout(() => setTidalView('queue'), 50);
    });
  } catch {
    switchView('downloads');
  }
}

// ── Initialisatie ──────────────────────────────────────────────────────────

/**
 * Initialiseer de download queue indicator.
 * Moet één keer worden aangeroepen vanuit main.js start().
 */
export function initDownloadQueue() {
  _barEl = document.getElementById('dl-queue-bar');
  if (!_barEl) {
    console.warn('[download-queue] #dl-queue-bar element niet gevonden');
    return;
  }

  // Luister naar custom events van SSE/poll updates
  window.addEventListener('tidarr-queue-update', updateDownloadQueue);
  window.addEventListener('orpheus-jobs-update', updateDownloadQueue);

  // Initiële render (waarschijnlijk leeg bij boot)
  updateDownloadQueue();
}
