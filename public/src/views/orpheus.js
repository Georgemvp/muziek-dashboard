// ── View: OrpheusDL – multi-platform muziek downloader ───────────────────────
// Dedicated pagina voor OrpheusDL met zoeken, platform-keuze, directe URL-download
// en live job-tracking.

import { state } from '../state.js';
import {
  orpheusSearch,
  orpheusDownload,
  orpheusJobStatus,
  orpheusJobStop,
  orpheusStatus,
} from '../api.js';
import { esc, gradientFor, initials, setContent } from '../helpers.js';
import { openOrpheusSettingsModal } from '../components/orpheusSettings.js';

// ── Platform configuratie ─────────────────────────────────────────────────────

const PLATFORM_COLORS = {
  all:        '#888',
  tidal:      '#33ffe7',
  qobuz:      '#0070ef',
  deezer:     '#a238ff',
  spotify:    '#1cc659',
  soundcloud: '#ff5502',
  applemusic: '#FA586A',
  beatport:   '#00ff89',
  beatsource: '#16a8f4',
  youtube:    '#FF0000',
};

const PLATFORM_LABELS = {
  all:        'All',
  tidal:      'Tidal',
  qobuz:      'Qobuz',
  deezer:     'Deezer',
  spotify:    'Spotify',
  soundcloud: 'SoundCloud',
  applemusic: 'Apple Music',
  beatport:   'Beatport',
  beatsource: 'Beatsource',
  youtube:    'YouTube',
};

const QUALITY_OPTIONS = {
  tidal:      [['atmos','Atmos'],['hifi','HiFi'],['lossless','Lossless'],['high','High'],['low','Low']],
  qobuz:      [['hifi','HiFi'],['lossless','Lossless'],['high','High']],
  deezer:     [['lossless','Lossless'],['high','High'],['low','Low']],
  spotify:    [['high','High'],['low','Low']],
  soundcloud: [['high','High']],
  applemusic: [['high','High']],
  beatport:   [['lossless','Lossless'],['high','High'],['low','Low']],
  beatsource: [['lossless','Lossless'],['high','High'],['low','Low']],
  youtube:    [['opus','Opus'],['aac','AAC'],['mp3','MP3']],
  all:        [['hifi','HiFi'],['lossless','Lossless'],['high','High'],['low','Low'],['atmos','Atmos'],['opus','Opus'],['aac','AAC'],['mp3','MP3']],
};

const PLATFORMS = ['all','tidal','qobuz','deezer','spotify','soundcloud','applemusic','beatport','beatsource','youtube'];

const TYPES = [
  ['album',    'Album'],
  ['track',    'Track'],
  ['playlist', 'Playlist'],
  ['artist',   'Artiest'],
];

const URL_PATTERNS = [
  { pattern: /tidal\.com/i,             platform: 'tidal'       },
  { pattern: /open\.qobuz\.com/i,       platform: 'qobuz'       },
  { pattern: /deezer\.com/i,            platform: 'deezer'      },
  { pattern: /open\.spotify\.com/i,     platform: 'spotify'     },
  { pattern: /soundcloud\.com/i,        platform: 'soundcloud'  },
  { pattern: /music\.apple\.com/i,      platform: 'applemusic'  },
  { pattern: /beatport\.com/i,          platform: 'beatport'    },
  { pattern: /beatsource\.com/i,        platform: 'beatsource'  },
  { pattern: /youtube\.com|youtu\.be/i, platform: 'youtube'     },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function detectPlatform(url) {
  for (const { pattern, platform } of URL_PATTERNS) {
    if (pattern.test(url)) return platform;
  }
  return null;
}

function getSavedQuality() {
  return localStorage.getItem('orpheusQuality') || 'hifi';
}

function setSavedQuality(val) {
  localStorage.setItem('orpheusQuality', val);
}

function getActivePlatform() {
  return state.orpheusPlatform || 'all';
}

function getActiveType() {
  return state.orpheusType || 'album';
}

// ── HTML builders ─────────────────────────────────────────────────────────────

function platformPillsHtml(selected) {
  return PLATFORMS.map(p => `
    <button class="oph-platform-pill${p === selected ? ' active' : ''}"
            data-platform="${p}"
            style="--pill-color:${PLATFORM_COLORS[p]}">
      <span class="oph-pill-dot"></span>
      ${esc(PLATFORM_LABELS[p])}
    </button>`).join('');
}

function typePillsHtml(selected) {
  return TYPES.map(([val, label]) => `
    <button class="oph-type-pill${val === selected ? ' active' : ''}" data-type="${val}">
      ${esc(label)}
    </button>`).join('');
}

function qualitySelectHtml(platform) {
  const opts = QUALITY_OPTIONS[platform] || QUALITY_OPTIONS.all;
  const saved = getSavedQuality();
  return `<select class="oph-quality-sel" id="oph-quality-sel" aria-label="Download kwaliteit">
    ${opts.map(([val, label]) =>
      `<option value="${val}"${val === saved ? ' selected' : ''}>${esc(label)}</option>`
    ).join('')}
  </select>`;
}

function resultCardHtml(item) {
  const platform = item.platform || getActivePlatform() || 'unknown';
  const color    = PLATFORM_COLORS[platform] || '#888';
  const label    = PLATFORM_LABELS[platform] || platform;
  const inPlex   = !!item.inPlex;
  const imgEl    = item.image
    ? `<img class="tidal-img" src="${esc(item.image)}" alt="${esc(item.title)} by ${esc(item.artist || '')}"
           loading="lazy" decoding="async"
           onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
       <div class="tidal-ph" style="display:none;background:${gradientFor(item.title)}">${initials(item.title)}</div>`
    : `<div class="tidal-ph" style="background:${gradientFor(item.title)}">${initials(item.title)}</div>`;
  const typeLabel = item.type === 'album'    ? 'Album'
                  : item.type === 'playlist' ? 'Playlist'
                  : item.type === 'artist'   ? 'Artiest'
                  : 'Track';
  const meta = [typeLabel, item.year, item.tracks ? `${item.tracks} nrs` : null]
    .filter(Boolean).join(' · ');

  // Acties: toon Plex-badge als het item al in de bibliotheek staat,
  // anders de normale download-knop.
  const actionsHtml = inPlex
    ? `<span class="orpheus-platform-badge" style="--badge-color:${color}">${esc(label)}</span>
       <span class="oph-plex-badge" title="Al in je Plex bibliotheek">▶ In Plex</span>`
    : `<span class="orpheus-platform-badge" style="--badge-color:${color}">${esc(label)}</span>
       <button class="tidal-dl-btn orpheus-dl-btn oph-dl-btn"
               data-orpheus-url="${esc(item.url || '')}"
               data-orpheus-title="${esc(item.title)}"
               data-orpheus-artist="${esc(item.artist || '')}"
               data-orpheus-platform="${esc(platform)}"
               title="Download via OrpheusDL">⬇ Download</button>`;

  return `
    <div class="tidal-card orpheus-card oph-result-card${inPlex ? ' oph-in-plex' : ''}" data-orpheus-jobid="">
      <div class="tidal-cover">${imgEl}</div>
      <div class="tidal-info">
        <div class="tidal-title">${esc(item.title)}</div>
        <div class="tidal-artist">${esc(item.artist || '')}</div>
        <div class="tidal-meta">${esc(meta)}</div>
      </div>
      <div class="orpheus-card-actions">
        ${actionsHtml}
      </div>
      <div class="orpheus-progress-wrap" style="display:none">
        <div class="q-bar"><div class="q-bar-fill orpheus-bar-fill" style="width:0%"></div></div>
        <div class="orpheus-progress-row">
          <span class="q-status q-pending orpheus-job-status">In wachtrij</span>
          <span class="orpheus-pct">0%</span>
          <button class="orpheus-stop-btn" title="Stop download" aria-label="Stop download">■</button>
        </div>
      </div>
    </div>`;
}

function urlDownloadCardHtml(url, platform) {
  const label = PLATFORM_LABELS[platform] || platform || 'Onbekend';
  const color = PLATFORM_COLORS[platform] || '#888';
  const opts  = QUALITY_OPTIONS[platform] || QUALITY_OPTIONS.all;
  const saved = getSavedQuality();
  return `
    <div class="oph-url-card">
      <div class="oph-url-info">
        <span class="orpheus-platform-badge" style="--badge-color:${color}">${esc(label)}</span>
        <div class="oph-url-text">${esc(url)}</div>
      </div>
      <div class="oph-url-dl-actions">
        <select class="oph-quality-sel" id="oph-url-quality" aria-label="Kwaliteit">
          ${opts.map(([val, lbl]) => `<option value="${val}"${val === saved ? ' selected' : ''}>${esc(lbl)}</option>`).join('')}
        </select>
        <button class="tidal-dl-btn orpheus-dl-btn oph-dl-btn"
                data-orpheus-url="${esc(url)}"
                data-orpheus-title="${esc(url)}"
                data-orpheus-artist=""
                data-orpheus-platform="${esc(platform || 'all')}">
          ⬇ Direct downloaden
        </button>
      </div>
      <div class="orpheus-progress-wrap" style="display:none">
        <div class="q-bar"><div class="q-bar-fill orpheus-bar-fill" style="width:0%"></div></div>
        <div class="orpheus-progress-row">
          <span class="q-status q-pending orpheus-job-status">In wachtrij</span>
          <span class="orpheus-pct">0%</span>
          <button class="orpheus-stop-btn" title="Stop download">■</button>
        </div>
      </div>
    </div>`;
}

// ── Job polling ───────────────────────────────────────────────────────────────

const _pollers = new Map(); // jobId → intervalId

function startJobPoll(jobId, cardEl) {
  if (_pollers.has(jobId)) return;

  const progressWrap = cardEl?.querySelector('.orpheus-progress-wrap');
  const barFill      = cardEl?.querySelector('.orpheus-bar-fill');
  const statusEl     = cardEl?.querySelector('.orpheus-job-status');
  const pctEl        = cardEl?.querySelector('.orpheus-pct');
  const dlBtn        = cardEl?.querySelector('.oph-dl-btn');
  const stopBtn      = cardEl?.querySelector('.orpheus-stop-btn');

  if (progressWrap) progressWrap.style.display = '';
  if (dlBtn) { dlBtn.disabled = true; dlBtn.textContent = '…'; }

  const statusMap = {
    pending: { label: 'In wachtrij', cls: 'q-pending' },
    running: { label: 'Downloaden…', cls: 'q-active'  },
    done:    { label: '✓ Klaar',     cls: 'q-done'    },
    error:   { label: '⚠ Fout',      cls: 'q-error'   },
    stopped: { label: '■ Gestopt',   cls: 'q-pending'  },
  };

  const intervalId = setInterval(async () => {
    try {
      const job = await orpheusJobStatus(jobId);
      const pct = typeof job.progress === 'number' ? Math.round(job.progress) : 0;
      if (barFill) barFill.style.width = `${pct}%`;
      if (pctEl) pctEl.textContent = `${pct}%`;

      const s = statusMap[job.status] || { label: job.status, cls: 'q-pending' };
      if (statusEl) {
        statusEl.textContent = s.label;
        statusEl.className = `q-status ${s.cls} orpheus-job-status`;
      }

      if (job.status === 'done' || job.status === 'error' || job.status === 'stopped') {
        clearInterval(intervalId);
        _pollers.delete(jobId);
        if (stopBtn) stopBtn.style.display = 'none';
        if (job.status === 'done' && dlBtn) {
          dlBtn.textContent = '✓';
          dlBtn.classList.add('dl-done');
        } else if (dlBtn) {
          dlBtn.disabled = false;
          dlBtn.textContent = '⬇ Download';
        }
        // Verwijder uit actieve jobs en ververs sectie
        if (state.activeOrpheusJobs) {
          state.activeOrpheusJobs = state.activeOrpheusJobs.filter(j => j.jobId !== jobId);
          _refreshActiveJobsSection();
        }
      } else {
        // Update progress in state
        const entry = (state.activeOrpheusJobs || []).find(j => j.jobId === jobId);
        if (entry) { entry.progress = pct; entry.status = job.status; }
      }
    } catch {
      clearInterval(intervalId);
      _pollers.delete(jobId);
    }
  }, 800);

  _pollers.set(jobId, intervalId);

  stopBtn?.addEventListener('click', async () => {
    try { await orpheusJobStop(jobId); } catch { /* stil falen */ }
    clearInterval(intervalId);
    _pollers.delete(jobId);
    if (statusEl) { statusEl.textContent = '■ Gestopt'; statusEl.className = 'q-status q-pending orpheus-job-status'; }
    if (dlBtn) { dlBtn.disabled = false; dlBtn.textContent = '⬇ Download'; }
  }, { once: true });
}

// ── Actieve downloads sectie ──────────────────────────────────────────────────

function _refreshActiveJobsSection() {
  const section = document.getElementById('oph-active-jobs');
  if (!section) return;
  const jobs = state.activeOrpheusJobs || [];
  if (!jobs.length) {
    section.style.display = 'none';
    section.innerHTML = '';
    return;
  }
  section.style.display = '';
  const statusMap = {
    pending: { label: 'In wachtrij', cls: 'q-pending' },
    running: { label: 'Downloaden…', cls: 'q-active'  },
    done:    { label: '✓ Klaar',     cls: 'q-done'    },
    error:   { label: '⚠ Fout',      cls: 'q-error'   },
  };
  section.innerHTML = `
    <div class="oph-section-header">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <polyline points="8 17 12 21 16 17"/><line x1="12" y1="3" x2="12" y2="21"/>
      </svg>
      Actieve downloads
      <span class="oph-jobs-count">${jobs.length}</span>
    </div>
    <div class="oph-active-list">
      ${jobs.map(job => {
        const pct   = job.progress || 0;
        const color = PLATFORM_COLORS[job.platform] || '#888';
        const s     = statusMap[job.status] || { label: job.status || 'In wachtrij', cls: 'q-pending' };
        return `<div class="oph-active-row" data-job-id="${esc(job.jobId)}">
          <div class="oph-active-info">
            <span class="oph-platform-dot" style="background:${color}"></span>
            <div class="oph-active-text">
              <div class="oph-active-title">${esc(job.title || '(onbekend)')}</div>
              ${job.artist ? `<div class="oph-active-artist">${esc(job.artist)}</div>` : ''}
            </div>
          </div>
          <div class="oph-active-progress">
            <div class="q-bar"><div class="q-bar-fill" style="width:${pct}%"></div></div>
            <div class="oph-active-meta">
              <span class="q-status ${s.cls}">${s.label}</span>
              <span class="oph-pct-small">${pct}%</span>
            </div>
          </div>
        </div>`;
      }).join('')}
    </div>`;
}

// ── Download handler ──────────────────────────────────────────────────────────

function bindDownloadButtons(container) {
  container.querySelectorAll('.oph-dl-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const url      = btn.dataset.orpheusUrl;
      const title    = btn.dataset.orpheusTitle;
      const artist   = btn.dataset.orpheusArtist;
      const platform = btn.dataset.orpheusPlatform;
      if (!url) return;

      // Kwaliteit: prioriteit aan het url-quality select (als aanwezig), anders globale selector
      const quality =
        btn.closest('.oph-url-card')?.querySelector('#oph-url-quality')?.value ||
        document.getElementById('oph-quality-sel')?.value ||
        getSavedQuality();

      btn.disabled = true;
      btn.textContent = '…';

      try {
        const res = await orpheusDownload(url, quality, title, artist);
        if (!res.ok) throw new Error(res.error || 'Download mislukt');
        const jobId = res.jobId;

        // Bijhouden in state
        if (!state.activeOrpheusJobs) state.activeOrpheusJobs = [];
        state.activeOrpheusJobs.push({ jobId, title, artist, platform, progress: 0, status: 'pending' });
        _refreshActiveJobsSection();

        // Start polling op de kaart
        const cardEl = btn.closest('.tidal-card, .oph-url-card');
        startJobPoll(jobId, cardEl);
      } catch (e) {
        btn.disabled = false;
        btn.textContent = '⬇ Download';
        alert('Download mislukt: ' + e.message);
      }
    });
  });
}

// ── Zoeken ────────────────────────────────────────────────────────────────────

async function doSearch(query) {
  const resultsEl = document.getElementById('oph-results');
  if (!resultsEl) return;

  const q        = (query || '').trim();
  const platform = getActivePlatform();
  const type     = getActiveType();

  // Directe URL?
  if (q.startsWith('http')) {
    const detected = detectPlatform(q);
    const cardHtml = urlDownloadCardHtml(q, detected || 'all');
    resultsEl.innerHTML = cardHtml;
    resultsEl.querySelector('#oph-url-quality')?.addEventListener('change', e => setSavedQuality(e.target.value));
    bindDownloadButtons(resultsEl);
    return;
  }

  if (q.length < 2) {
    resultsEl.innerHTML = `<div class="empty">Begin met typen om te zoeken via OrpheusDL.</div>`;
    return;
  }

  resultsEl.innerHTML = `<div class="loading"><div class="spinner"></div>Zoeken via OrpheusDL${platform !== 'all' ? ' · ' + (PLATFORM_LABELS[platform] || platform) : ''}…</div>`;

  try {
    const d       = await orpheusSearch(q, platform, type === 'artist' ? 'all' : type);
    const results = d.results || [];
    if (d.error) {
      resultsEl.innerHTML = `<div class="error-box">⚠️ ${esc(d.error)}</div>`;
      return;
    }
    if (!results.length) {
      resultsEl.innerHTML = `<div class="empty">Geen resultaten voor "<strong>${esc(q)}</strong>" via OrpheusDL.</div>`;
      return;
    }
    resultsEl.innerHTML = `<div class="tidal-grid">${results.map(resultCardHtml).join('')}</div>`;
    bindDownloadButtons(resultsEl);
  } catch (e) {
    resultsEl.innerHTML = `<div class="error-box">⚠️ ${esc(e.message)}</div>`;
  }
}

// ── Verbindingsstatus ─────────────────────────────────────────────────────────

async function updateConnectionStatus() {
  const dot  = document.getElementById('oph-conn-dot');
  const text = document.getElementById('oph-conn-text');
  if (!dot || !text) return;
  try {
    const d = await orpheusStatus();
    state.orpheusConnected = !!d.connected;
    dot.className  = `oph-conn-dot ${d.connected ? 'connected' : 'disconnected'}`;
    text.textContent = d.connected ? 'Verbonden' : 'Offline';
  } catch {
    state.orpheusConnected = false;
    if (dot)  dot.className  = 'oph-conn-dot disconnected';
    if (text) text.textContent = 'Offline';
  }
}

// ── Platform pills wisselen ───────────────────────────────────────────────────

function syncPlatformPills(platform) {
  document.querySelectorAll('#oph-platform-pills [data-platform]').forEach(el =>
    el.classList.toggle('active', el.dataset.platform === platform)
  );
}

function syncTypePills(type) {
  document.querySelectorAll('#oph-type-pills [data-type]').forEach(el =>
    el.classList.toggle('active', el.dataset.type === type)
  );
}

function rebuildQualitySelect(platform) {
  const qs = document.getElementById('oph-quality-sel');
  if (!qs) return;
  const opts  = QUALITY_OPTIONS[platform] || QUALITY_OPTIONS.all;
  const saved = getSavedQuality();
  qs.innerHTML = opts.map(([val, lbl]) =>
    `<option value="${val}"${val === saved ? ' selected' : ''}>${esc(lbl)}</option>`
  ).join('');
}

// ── Event binding (wordt aangeroepen nadat setContent de DOM heeft bijgewerkt) ─

function _bindOrpheusEvents() {
  // Actieve jobs tonen
  _refreshActiveJobsSection();

  // Verbindingsstatus ophalen
  updateConnectionStatus();

  // Instellingen knop
  document.getElementById('oph-settings-btn')?.addEventListener('click', () => {
    openOrpheusSettingsModal();
  });

  // Platform pills
  document.getElementById('oph-platform-pills')?.addEventListener('click', e => {
    const pill = e.target.closest('[data-platform]');
    if (!pill) return;
    const p = pill.dataset.platform;
    state.orpheusPlatform = p;
    syncPlatformPills(p);
    rebuildQualitySelect(p);
    const q = document.getElementById('oph-search-input')?.value || '';
    if (q.trim().length >= 2) doSearch(q);
  });

  // Type pills
  document.getElementById('oph-type-pills')?.addEventListener('click', e => {
    const pill = e.target.closest('[data-type]');
    if (!pill) return;
    state.orpheusType = pill.dataset.type;
    syncTypePills(state.orpheusType);
    const q = document.getElementById('oph-search-input')?.value || '';
    if (q.trim().length >= 2) doSearch(q);
  });

  // Kwaliteit
  document.getElementById('oph-quality-sel')?.addEventListener('change', e => {
    setSavedQuality(e.target.value);
  });

  // Zoekbalk
  const searchInput = document.getElementById('oph-search-input');
  document.getElementById('oph-search-btn')?.addEventListener('click', () => {
    doSearch(searchInput?.value || '');
  });
  searchInput?.addEventListener('keydown', e => {
    if (e.key === 'Enter') doSearch(searchInput.value);
  });
  // Debounced input: zoek automatisch terwijl de gebruiker typt (320ms vertraging)
  let _searchDebounce = null;
  searchInput?.addEventListener('input', () => {
    clearTimeout(_searchDebounce);
    _searchDebounce = setTimeout(() => doSearch(searchInput.value), 320);
  });

  // URL directe download
  const urlInput  = document.getElementById('oph-url-input');
  const urlSubmit = document.getElementById('oph-url-submit');

  const handleUrlDownload = () => {
    const url = urlInput?.value?.trim();
    if (!url || !url.startsWith('http')) return;
    const resultsEl = document.getElementById('oph-results');
    if (!resultsEl) return;
    const detected = detectPlatform(url);
    resultsEl.innerHTML = urlDownloadCardHtml(url, detected || 'all');
    resultsEl.querySelector('#oph-url-quality')?.addEventListener('change', e => setSavedQuality(e.target.value));
    bindDownloadButtons(resultsEl);
  };

  urlSubmit?.addEventListener('click', handleUrlDownload);
  urlInput?.addEventListener('keydown', e => { if (e.key === 'Enter') handleUrlDownload(); });

  // Zoek direct als er een zoekopdracht is gepast
  const savedQuery = state.orpheusLastQuery;
  if (savedQuery?.length >= 2) {
    if (searchInput) searchInput.value = savedQuery;
    doSearch(savedQuery);
  }
}

// ── View loader (exporteer deze functie) ──────────────────────────────────────

export async function loadOrpheus() {
  const platform = getActivePlatform();
  const type     = getActiveType();

  // BELANGRIJK: geef _bindOrpheusEvents mee als callback zodat event listeners pas
  // worden gebonden nadat setContent() de innerHTML heeft bijgewerkt. Zonder callback
  // gebruikt setContent() document.startViewTransition(), waarvan de update-callback
  // asynchroon wordt aangeroepen — de elementen bestaan dan nog niet in de DOM.
  setContent(`
    <div class="oph-page">

      <!-- ── Koptekst ───────────────────────────────────────────────── -->
      <div class="oph-header">
        <div class="oph-header-left">
          <h1 class="oph-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                 aria-hidden="true">
              <circle cx="12" cy="12" r="10"/>
              <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
            OrpheusDL
          </h1>
          <div class="oph-conn-status">
            <span class="oph-conn-dot" id="oph-conn-dot"></span>
            <span class="oph-conn-label" id="oph-conn-text">Controleren…</span>
          </div>
        </div>
        <button class="tool-btn oph-settings-btn" id="oph-settings-btn" type="button">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
               aria-hidden="true">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
          Instellingen
        </button>
      </div>

      <!-- ── Actieve downloads ───────────────────────────────────────── -->
      <div id="oph-active-jobs" class="oph-active-jobs" style="display:none"></div>

      <!-- ── Directe URL download ────────────────────────────────────── -->
      <div class="oph-url-section">
        <label class="oph-url-label" for="oph-url-input">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2" aria-hidden="true">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
          </svg>
          Directe URL
        </label>
        <div class="oph-url-row">
          <input id="oph-url-input" class="oph-url-input" type="url"
                 placeholder="Plak een URL van elk platform (Tidal, Qobuz, Deezer, Spotify, YouTube…)"
                 autocomplete="off" spellcheck="false">
          <button class="tidal-dl-btn oph-url-submit-btn" id="oph-url-submit" type="button">
            ⬇ Download
          </button>
        </div>
      </div>

      <!-- ── Zoekbesturing ───────────────────────────────────────────── -->
      <div class="oph-controls">

        <!-- Platform pills -->
        <div class="oph-pills-row" id="oph-platform-pills" role="group" aria-label="Platform kiezen">
          ${platformPillsHtml(platform)}
        </div>

        <!-- Type + kwaliteit -->
        <div class="oph-type-quality-row">
          <div class="oph-type-pills" id="oph-type-pills" role="group" aria-label="Type kiezen">
            ${typePillsHtml(type)}
          </div>
          <label class="oph-quality-wrap" aria-label="Kwaliteit">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2" aria-hidden="true">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            ${qualitySelectHtml(platform)}
          </label>
        </div>

        <!-- Zoekbalk -->
        <div class="oph-search-row">
          <input id="oph-search-input" class="tidal-search oph-search-input" type="search"
                 placeholder="Zoek artiest, album of track…" autocomplete="off">
          <button class="tool-btn sel-def oph-search-btn" id="oph-search-btn" type="button">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2" aria-hidden="true">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            Zoeken
          </button>
        </div>
      </div>

      <!-- ── Zoekresultaten ──────────────────────────────────────────── -->
      <div id="oph-results">
        <div class="empty">Kies een platform en zoek muziek, of plak een URL hierboven.</div>
      </div>

    </div>
  `, _bindOrpheusEvents);
}
