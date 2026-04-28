// ── AudioMuse Deep Integration View ─────────────────────────────────────────
// Dashboard voor AudioMuse: status, similar songs zoeker, CLAP sonic search
// en directe toegang tot de AudioMuse UI.

import { esc } from '../helpers.js';
import {
  getAnalysisStatus,
  findSimilarForTrack,
  clapSearch,
  renderTrackList,
} from '../modules/audiomuse-api.js';
import { playOnZone } from '../components/plexRemote.js';
import { apiFetch } from '../api.js';

// ── Module state ────────────────────────────────────────────────────────────
let _statusInterval = null;

// ── Helpers ─────────────────────────────────────────────────────────────────

function getContent() { return document.getElementById('content'); }

function stopPolling() {
  if (_statusInterval) { clearInterval(_statusInterval); _statusInterval = null; }
}

// ── Status rendering ─────────────────────────────────────────────────────────

function statusDot(status) {
  // status kan zijn: 'idle', 'analyzing', 'complete', null (offline)
  if (!status) return { cls: 'am-dot-red',    label: 'Offline' };
  const s = (status.status || '').toLowerCase();
  if (s === 'complete' || s === 'idle' || s === 'done')
    return { cls: 'am-dot-green',  label: 'Klaar' };
  if (s === 'analyzing' || s === 'running' || s === 'processing')
    return { cls: 'am-dot-orange', label: 'Bezig…' };
  return { cls: 'am-dot-green', label: 'Online' };
}

function progressBar(status) {
  if (!status) return '';
  const pct = status.percent ?? (status.analyzed && status.total
    ? Math.round(status.analyzed / status.total * 100) : 0);
  const analyzed = status.analyzed ?? 0;
  const total    = status.total    ?? 0;
  return `
    <div class="am-progress-wrap">
      <div class="am-progress-bar" style="width:${pct}%"></div>
    </div>
    <div class="am-progress-label">${analyzed.toLocaleString('nl-NL')} / ${total.toLocaleString('nl-NL')} nummers geanalyseerd (${pct}%)</div>`;
}

// ── Main render ──────────────────────────────────────────────────────────────

export async function loadAudioMuse() {
  stopPolling();

  const content = getContent();
  if (!content) return;

  content.innerHTML = `
    <div class="am-view">

      <!-- ══ Header ══ -->
      <div class="am-header">
        <div class="am-header-left">
          <div class="am-logo-icon" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
              <path d="M2 10a2 2 0 0 1 2-2h1l2-4h10l2 4h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z"/>
              <circle cx="8.5" cy="13" r="1.5"/>
              <circle cx="15.5" cy="13" r="1.5"/>
              <path d="M8.5 13h7"/>
            </svg>
          </div>
          <div>
            <h1 class="am-view-title">AudioMuse</h1>
            <p class="am-view-sub">Sonic analyse &amp; aanbevelingen</p>
          </div>
        </div>
        <div class="am-header-right">
          <div class="am-status-inline" id="am-status-inline">
            <span class="am-status-dot am-dot-grey" id="am-inline-dot"></span>
            <span id="am-inline-label">Verbinden…</span>
          </div>
          <a href="/audiomuse/" target="_blank" class="am-open-btn" rel="noopener">
            Open AudioMuse UI
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </a>
        </div>
      </div>

      <!-- ══ Status kaart ══ -->
      <div class="am-card am-status-card" id="am-status-card">
        <div class="am-card-title">Analyse Status</div>
        <div id="am-status-body">
          <div class="am-loading-small">
            <div class="spinner" aria-hidden="true"></div>Status laden…
          </div>
        </div>
      </div>

      <!-- ══ Two-column grid ══ -->
      <div class="am-two-col">

        <!-- ═ Similar Songs ═ -->
        <div class="am-card">
          <div class="am-card-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/>
              <circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
            Vergelijkbare nummers
          </div>
          <form class="am-search-form" id="am-similar-form" autocomplete="off">
            <input type="text" class="am-input" id="am-sim-artist" placeholder="Artiest" />
            <input type="text" class="am-input" id="am-sim-title"  placeholder="Nummer"  />
            <button type="submit" class="am-submit-btn">Zoeken</button>
          </form>
          <div id="am-similar-results" class="am-results-area"></div>
        </div>

        <!-- ═ Sonic Search ═ -->
        <div class="am-card">
          <div class="am-card-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
              <path d="M9 18V5l12-2v13"/>
              <circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
            </svg>
            Sonic Search
          </div>
          <p class="am-card-hint">
            Omschrijf het geluid dat je zoekt, bijv. <em>"calm piano music"</em> of <em>"high energy electronic"</em>.
          </p>
          <form class="am-search-form" id="am-sonic-form" autocomplete="off">
            <input type="text" class="am-input am-input-full" id="am-sonic-query"
                   placeholder="Beschrijf het geluid…" />
            <button type="submit" class="am-submit-btn">Zoeken</button>
          </form>
          <div id="am-sonic-results" class="am-results-area"></div>
        </div>

      </div><!-- /.am-two-col -->

      <!-- ══ Smart Playlists link ══ -->
      <div class="am-card am-playlists-promo">
        <div class="am-playlists-promo-inner">
          <div>
            <div class="am-card-title">Smart Playlists</div>
            <p class="am-card-hint">AudioMuse groepeert je muziek automatisch op sonic kenmerken. Bekijk de gegenereerde afspeellijsten en speel ze direct af via Plex.</p>
          </div>
          <button class="am-nav-btn" data-view="audiomuse-smart-playlists">
            Bekijk Smart Playlists →
          </button>
        </div>
      </div>

    </div>`;

  // Wire up nav button
  content.querySelector('[data-view="audiomuse-smart-playlists"]')?.addEventListener('click', () => {
    import('../router.js').then(m => m.switchView('audiomuse-smart-playlists'));
  });

  // Load status immediately
  await _refreshStatus();

  // Poll every 15s while this view is active
  _statusInterval = setInterval(_refreshStatus, 15_000);

  // Cleanup on view change
  document.addEventListener('sidebar:close', stopPolling, { once: true });
  document.addEventListener('am:view-unload', stopPolling, { once: true });

  // ── Similar Songs form ──────────────────────────────────────────────────
  document.getElementById('am-similar-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const artist = document.getElementById('am-sim-artist').value.trim();
    const title  = document.getElementById('am-sim-title').value.trim();
    if (!artist || !title) return;
    const resultsEl = document.getElementById('am-similar-results');
    resultsEl.innerHTML = `<div class="am-loading-small"><div class="spinner"></div>Zoeken…</div>`;
    const result = await findSimilarForTrack(artist, title);
    if (!result) {
      resultsEl.innerHTML = `<div class="am-empty">Nummer niet gevonden in AudioMuse database.</div>`;
      return;
    }
    resultsEl.innerHTML = `
      <div class="am-results-header">Vergelijkbaar met <strong>${esc(result.source.title || title)}</strong></div>
      ${renderTrackList(result.similar)}`;
    _wirePlayButtons(resultsEl);
  });

  // ── Sonic search form ───────────────────────────────────────────────────
  document.getElementById('am-sonic-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const query = document.getElementById('am-sonic-query').value.trim();
    if (!query) return;
    const resultsEl = document.getElementById('am-sonic-results');
    resultsEl.innerHTML = `<div class="am-loading-small"><div class="spinner"></div>Zoeken…</div>`;
    const tracks = await clapSearch(query);
    resultsEl.innerHTML = `
      <div class="am-results-header">Resultaten voor <em>"${esc(query)}"</em></div>
      ${renderTrackList(tracks)}`;
    _wirePlayButtons(resultsEl);
  });
}

// ── Status refresh ───────────────────────────────────────────────────────────

async function _refreshStatus() {
  const status = await getAnalysisStatus();
  const dot    = statusDot(status);

  // Update inline header dot
  const inlineDot   = document.getElementById('am-inline-dot');
  const inlineLabel = document.getElementById('am-inline-label');
  if (inlineDot) {
    inlineDot.className = `am-status-dot ${dot.cls}`;
    if (inlineLabel) inlineLabel.textContent = dot.label;
  }

  // Update status card
  const body = document.getElementById('am-status-body');
  if (!body) return;

  if (!status) {
    body.innerHTML = `
      <div class="am-status-row">
        <span class="am-status-dot am-dot-red"></span>
        <span class="am-status-text">AudioMuse is offline of niet bereikbaar.</span>
      </div>
      <p class="am-status-hint">Zorg dat AudioMuse draait op <code>localhost:8000</code> en de proxy actief is.</p>`;
    return;
  }

  const { cls, label } = dot;
  body.innerHTML = `
    <div class="am-status-row">
      <span class="am-status-dot ${cls}"></span>
      <span class="am-status-text">${esc(label)}</span>
    </div>
    ${progressBar(status)}`;
}

// ── Play buttons ─────────────────────────────────────────────────────────────

/**
 * Wire play buttons in een container.
 * Knoppen met data-play-ratingkey: speel direct af via Plex.
 * Knoppen met data-am-artist + data-am-title: zoek eerst in Plex.
 */
function _wirePlayButtons(container) {
  container.querySelectorAll('.am-play-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const ratingKey = btn.dataset.playRatingkey;
      if (ratingKey) {
        playOnZone(ratingKey);
        return;
      }
      // Zoek via Plex search API
      const artist = btn.dataset.amArtist || '';
      const title  = btn.dataset.amTitle  || '';
      if (!artist && !title) return;
      btn.disabled = true;
      btn.textContent = '…';
      try {
        const data = await apiFetch(`/api/plex/search?q=${encodeURIComponent(`${artist} ${title}`)}`);
        const track = (data.tracks || data.results || []).find(t =>
          (t.title || '').toLowerCase().includes(title.toLowerCase())
        );
        if (track?.ratingKey) {
          playOnZone(track.ratingKey);
        } else {
          btn.textContent = '?';
          setTimeout(() => {
            btn.disabled = false;
            btn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
          }, 2000);
        }
      } catch {
        btn.disabled = false;
        btn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
      }
    });
  });
}
