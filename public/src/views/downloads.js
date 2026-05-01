// ── Tab: Downloads (Tidarr / Tidal + OrpheusDL) ────────────────────────────
import { state } from '../state.js';
import { apiFetch, orpheusSearch, orpheusDownload, orpheusJobStatus, orpheusJobStop } from '../api.js';
import { esc, gradientFor, initials, fmt, markDownloaded, setContent, p } from '../helpers.js';
import { skeletonList } from '../modules/skeleton.js';

// ── OrpheusDL platform-configuratie ──────────────────────────────────────
const ORPHEUS_PLATFORM_COLORS = {
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

const ORPHEUS_PLATFORM_LABELS = {
  tidal: 'Tidal', qobuz: 'Qobuz', deezer: 'Deezer',
  spotify: 'Spotify', soundcloud: 'SoundCloud', applemusic: 'Apple Music',
  beatport: 'Beatport', beatsource: 'Beatsource', youtube: 'YouTube',
};

const ORPHEUS_QUALITY_OPTIONS = {
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

/** URL-patronen voor directe download via OrpheusDL */
const ORPHEUS_URL_PATTERNS = [
  { pattern: /tidal\.com/i,          platform: 'tidal'       },
  { pattern: /open\.qobuz\.com/i,    platform: 'qobuz'       },
  { pattern: /deezer\.com/i,         platform: 'deezer'      },
  { pattern: /open\.spotify\.com/i,  platform: 'spotify'     },
  { pattern: /soundcloud\.com/i,     platform: 'soundcloud'  },
  { pattern: /music\.apple\.com/i,   platform: 'applemusic'  },
  { pattern: /beatport\.com/i,       platform: 'beatport'    },
  { pattern: /beatsource\.com/i,     platform: 'beatsource'  },
  { pattern: /youtube\.com|youtu\.be/i, platform: 'youtube'  },
];

/** Detect platform uit URL */
function detectPlatformFromUrl(url) {
  for (const { pattern, platform } of ORPHEUS_URL_PATTERNS) {
    if (pattern.test(url)) return platform;
  }
  return null;
}

/** Kwaliteitsopties voor het actieve platform */
export function getOrpheusQuality() {
  return localStorage.getItem('orpheusQuality') || 'hifi';
}

function setOrpheusQuality(val) {
  localStorage.setItem('orpheusQuality', val);
}

/** Render kwaliteitsopties als <select> voor een platform */
function orpheusQualitySelectHtml(platform) {
  const opts = ORPHEUS_QUALITY_OPTIONS[platform] || ORPHEUS_QUALITY_OPTIONS.all;
  const saved = getOrpheusQuality();
  return `
    <label class="orpheus-quality-wrap" title="Download kwaliteit">
      <select id="orpheus-quality" class="orpheus-quality-sel" aria-label="Kwaliteit kiezen">
        ${opts.map(([val, label]) =>
          `<option value="${val}"${val === saved ? ' selected' : ''}>${label}</option>`
        ).join('')}
      </select>
    </label>`;
}

// ── Download-kwaliteit ─────────────────────────────────────────────────────
export function getDownloadQuality() {
  return localStorage.getItem('downloadQuality') || 'high';
}

// ── Tidarr status ─────────────────────────────────────────────────────────
export async function loadTidarrStatus() {
  const signal = state.tabAbort?.signal;
  try {
    const d = await apiFetch('/api/tidarr/status', { signal });
    if (signal?.aborted) return;
    const pill = document.getElementById('tidarr-status-pill');
    const text = document.getElementById('tidarr-status-text');
    state.tidarrOk = !!d.connected;
    if (pill && text) {
      pill.className = `tidarr-status-pill ${state.tidarrOk ? 'on' : 'off'}`;
      text.textContent = state.tidarrOk
        ? `Tidarr · verbonden${d.quality ? ' · ' + d.quality : ''}`
        : 'Tidarr offline';
    }
  } catch (e) {
    if (e.name === 'AbortError') return;
    state.tidarrOk = false;
    const text = document.getElementById('tidarr-status-text');
    if (text) text.textContent = 'Tidarr offline';
  }
}

export async function refreshTidarrQueueBadge() {
  const signal = state.tabAbort?.signal;
  try {
    const d = await apiFetch('/api/tidarr/queue', { signal });
    if (signal?.aborted) return;
    const count = (d.items || []).length;
    const badges = [
      document.getElementById('badge-tidarr-queue'),
      document.getElementById('badge-tidarr-queue-inline')
    ];
    for (const b of badges) {
      if (!b) continue;
      if (count > 0) { b.textContent = count; b.style.display = ''; }
      else           { b.style.display = 'none'; }
    }
  } catch (e) { if (e.name === 'AbortError') return; }
}

// ── Tidal zoekresultaat card ──────────────────────────────────────────────
export function tidalResultCard(item) {
  const imgEl = item.image
    ? `<img class="tidal-img" src="${esc(item.image)}" alt="${esc(item.title)} by ${esc(item.artist)}" loading="lazy" decoding="async"
         onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
       <div class="tidal-ph" style="display:none;background:${gradientFor(item.title)}">${initials(item.title)}</div>`
    : `<div class="tidal-ph" style="background:${gradientFor(item.title)}">${initials(item.title)}</div>`;
  const meta = [
    item.type === 'album' ? 'Album' : 'Nummer',
    item.year,
    item.album && item.type === 'track' ? item.album : null,
    item.tracks ? `${item.tracks} nummers` : null
  ].filter(Boolean).join(' · ');
  return `
    <div class="tidal-card">
      <div class="tidal-cover">${imgEl}</div>
      <div class="tidal-info">
        <div class="tidal-title">${esc(item.title)}</div>
        <div class="tidal-artist artist-link" data-artist="${esc(item.artist)}">${esc(item.artist)}</div>
        <div class="tidal-meta">${esc(meta)}</div>
      </div>
      <button class="tidal-dl-btn" data-dlurl="${esc(item.url)}" title="Download via Tidarr">⬇ Download</button>
    </div>`;
}

// ── OrpheusDL zoekresultaat card ──────────────────────────────────────────
export function orpheusResultCard(item) {
  const platform = item.platform || 'unknown';
  const color = ORPHEUS_PLATFORM_COLORS[platform] || '#888';
  const label = ORPHEUS_PLATFORM_LABELS[platform] || platform;
  const imgEl = item.image
    ? `<img class="tidal-img" src="${esc(item.image)}" alt="${esc(item.title)} by ${esc(item.artist)}" loading="lazy" decoding="async"
         onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
       <div class="tidal-ph" style="display:none;background:${gradientFor(item.title)}">${initials(item.title)}</div>`
    : `<div class="tidal-ph" style="background:${gradientFor(item.title)}">${initials(item.title)}</div>`;
  const meta = [
    item.type === 'album' ? 'Album' : 'Nummer',
    item.year,
    item.album && item.type === 'track' ? item.album : null,
    item.tracks ? `${item.tracks} nummers` : null
  ].filter(Boolean).join(' · ');
  return `
    <div class="tidal-card orpheus-card" data-orpheus-jobid="">
      <div class="tidal-cover">${imgEl}</div>
      <div class="tidal-info">
        <div class="tidal-title">${esc(item.title)}</div>
        <div class="tidal-artist artist-link" data-artist="${esc(item.artist)}">${esc(item.artist)}</div>
        <div class="tidal-meta">${esc(meta)}</div>
      </div>
      <div class="orpheus-card-actions">
        <span class="orpheus-platform-badge" style="--badge-color:${color}">${esc(label)}</span>
        <button class="tidal-dl-btn orpheus-dl-btn"
                data-orpheus-url="${esc(item.url || '')}"
                data-orpheus-title="${esc(item.title)}"
                data-orpheus-artist="${esc(item.artist)}"
                data-orpheus-platform="${esc(platform)}"
                title="Download via OrpheusDL">⬇ Download</button>
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

// ── OrpheusDL job polling ─────────────────────────────────────────────────
const _orpheusPollers = new Map(); // jobId → intervalId

export function startOrpheusJobPoll(jobId, cardEl) {
  if (_orpheusPollers.has(jobId)) return;

  const progressWrap = cardEl?.querySelector('.orpheus-progress-wrap');
  const barFill      = cardEl?.querySelector('.orpheus-bar-fill');
  const statusEl     = cardEl?.querySelector('.orpheus-job-status');
  const pctEl        = cardEl?.querySelector('.orpheus-pct');
  const dlBtn        = cardEl?.querySelector('.orpheus-dl-btn');
  const stopBtn      = cardEl?.querySelector('.orpheus-stop-btn');

  if (progressWrap) progressWrap.style.display = '';
  if (dlBtn) { dlBtn.disabled = true; dlBtn.textContent = '…'; }

  const intervalId = setInterval(async () => {
    try {
      const job = await orpheusJobStatus(jobId);
      const pct = typeof job.progress === 'number' ? Math.round(job.progress) : 0;
      if (barFill) barFill.style.width = `${pct}%`;
      if (pctEl)   pctEl.textContent   = `${pct}%`;

      const statusMap = {
        pending: { label: 'In wachtrij', cls: 'q-pending' },
        running: { label: 'Downloaden…', cls: 'q-active'  },
        done:    { label: '✓ Klaar',     cls: 'q-done'    },
        error:   { label: '⚠ Fout',      cls: 'q-error'   },
        stopped: { label: '■ Gestopt',   cls: 'q-pending'  },
      };
      const s = statusMap[job.status] || { label: job.status, cls: 'q-pending' };
      if (statusEl) {
        statusEl.textContent = s.label;
        statusEl.className = `q-status ${s.cls} orpheus-job-status`;
      }

      if (job.status === 'done' || job.status === 'error' || job.status === 'stopped') {
        clearInterval(intervalId);
        _orpheusPollers.delete(jobId);
        if (stopBtn) stopBtn.style.display = 'none';
        if (job.status === 'done' && dlBtn) {
          dlBtn.textContent = '✓';
          dlBtn.classList.add('dl-done');
        } else if (dlBtn) {
          dlBtn.disabled = false;
          dlBtn.textContent = '⬇ Download';
        }
        // Update activeOrpheusJobs
        state.activeOrpheusJobs = state.activeOrpheusJobs.filter(j => j.jobId !== jobId);
        window.dispatchEvent(new CustomEvent('orpheus-jobs-update'));
      } else {
        // Update activeOrpheusJobs progress
        const jobEntry = state.activeOrpheusJobs.find(j => j.jobId === jobId);
        if (jobEntry) { jobEntry.progress = pct; jobEntry.status = job.status; }
        window.dispatchEvent(new CustomEvent('orpheus-jobs-update'));
      }
    } catch {
      clearInterval(intervalId);
      _orpheusPollers.delete(jobId);
    }
  }, 800);

  _orpheusPollers.set(jobId, intervalId);

  // Stop-knop handler
  stopBtn?.addEventListener('click', async () => {
    try { await orpheusJobStop(jobId); } catch { /* stil falen */ }
    clearInterval(intervalId);
    _orpheusPollers.delete(jobId);
    if (statusEl) { statusEl.textContent = '■ Gestopt'; statusEl.className = 'q-status q-pending orpheus-job-status'; }
    if (dlBtn) { dlBtn.disabled = false; dlBtn.textContent = '⬇ Download'; }
  }, { once: true });
}

// ── OrpheusDL zoeken ──────────────────────────────────────────────────────
export async function renderOrpheusSearch(query) {
  const target = document.getElementById('tidal-content');
  if (!target) return;
  const q = (query || '').trim();

  // Controleer of het een directe URL is
  const urlPlatform = q.startsWith('http') ? detectPlatformFromUrl(q) : null;
  if (urlPlatform) {
    renderOrpheusUrlDownload(q, urlPlatform, target);
    return;
  }

  if (q.length < 2) {
    target.innerHTML = `<div class="empty">Begin met typen om te zoeken via OrpheusDL.</div>`;
    return;
  }
  target.innerHTML = `<div class="loading"><div class="spinner"></div>Zoeken via OrpheusDL (${ORPHEUS_PLATFORM_LABELS[state.orpheusPlatform] || state.orpheusPlatform})…</div>`;
  try {
    const d = await orpheusSearch(q, state.orpheusPlatform);
    const results = d.results || [];
    if (d.error) { target.innerHTML = `<div class="error-box">⚠️ ${esc(d.error)}</div>`; return; }
    if (!results.length) {
      target.innerHTML = `<div class="empty">Geen resultaten voor "<strong>${esc(q)}</strong>" via OrpheusDL.</div>`;
      return;
    }
    const albums = results.filter(r => r.type === 'album');
    const tracks = results.filter(r => r.type === 'track');
    // Kwaliteitsselector boven resultaten
    const ql = orpheusQualitySelectHtml(state.orpheusPlatform);
    let html = `<div class="orpheus-quality-row">${ql}</div>`;
    if (albums.length)
      html += `<div class="section-title">Albums (${albums.length})</div>
        <div class="tidal-grid">${albums.map(orpheusResultCard).join('')}</div>`;
    if (tracks.length)
      html += `<div class="section-title" style="margin-top:1.5rem">Nummers (${tracks.length})</div>
        <div class="tidal-grid">${tracks.map(orpheusResultCard).join('')}</div>`;
    target.innerHTML = html;

    // Kwaliteitswijziging opslaan
    target.querySelector('#orpheus-quality')?.addEventListener('change', e => {
      setOrpheusQuality(e.target.value);
    });
  } catch (e) {
    target.innerHTML = `<div class="error-box">⚠️ ${esc(e.message)}</div>`;
  }
}

/** Render een directe URL download kaart (OrpheusDL) */
function renderOrpheusUrlDownload(url, platform, target) {
  const label   = ORPHEUS_PLATFORM_LABELS[platform] || platform;
  const color   = ORPHEUS_PLATFORM_COLORS[platform] || '#888';
  const ql      = orpheusQualitySelectHtml(platform);
  target.innerHTML = `
    <div class="orpheus-url-card">
      <div class="orpheus-url-info">
        <span class="orpheus-platform-badge" style="--badge-color:${color}">${esc(label)}</span>
        <div class="orpheus-url-text">${esc(url)}</div>
      </div>
      <div class="orpheus-url-actions">
        ${ql}
        <button class="tidal-dl-btn orpheus-dl-btn orpheus-url-dl-btn"
                data-orpheus-url="${esc(url)}"
                data-orpheus-title="${esc(url)}"
                data-orpheus-artist=""
                data-orpheus-platform="${esc(platform)}">
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
  target.querySelector('#orpheus-quality')?.addEventListener('change', e => {
    setOrpheusQuality(e.target.value);
  });
}

// ── Tidal zoeken ──────────────────────────────────────────────────────────
export async function renderTidalSearch(query) {
  const target = document.getElementById('tidal-content');
  if (!target) return;
  const q = (query || '').trim();
  if (q.length < 2) {
    target.innerHTML = `<div class="empty">Begin met typen om te zoeken op Tidal.</div>`;
    return;
  }
  target.innerHTML = `<div class="loading"><div class="spinner"></div>Zoeken op Tidal…</div>`;
  try {
    const d = await apiFetch(`/api/tidarr/search?q=${encodeURIComponent(q)}`);
    state.tidalSearchResults = d.results || [];
    if (d.error) { target.innerHTML = `<div class="error-box">⚠️ ${esc(d.error)}</div>`; return; }
    if (!state.tidalSearchResults.length) {
      target.innerHTML = `<div class="empty">Geen resultaten op Tidal voor "<strong>${esc(q)}</strong>".</div>`;
      return;
    }
    const albums = state.tidalSearchResults.filter(r => r.type === 'album');
    const tracks = state.tidalSearchResults.filter(r => r.type === 'track');
    let html = '';
    if (albums.length)
      html += `<div class="section-title">Albums (${albums.length})</div>
        <div class="tidal-grid">${albums.map(tidalResultCard).join('')}</div>`;
    if (tracks.length)
      html += `<div class="section-title" style="margin-top:1.5rem">Nummers (${tracks.length})</div>
        <div class="tidal-grid">${tracks.map(tidalResultCard).join('')}</div>`;
    target.innerHTML = html;
  } catch (e) {
    target.innerHTML = `<div class="error-box">⚠️ ${esc(e.message)}</div>`;
  }
}

// ── Queue item row ─────────────────────────────────────────────────────────
export function queueItemRow(item, isHistory = false) {
  const statusClass = {
    queued: 'q-pending', pending: 'q-pending',
    downloading: 'q-active', processing: 'q-active',
    completed: 'q-done', done: 'q-done',
    error: 'q-error', failed: 'q-error'
  }[String(item.status || '').toLowerCase()] || 'q-pending';
  const pct = typeof item.progress === 'number' ? Math.round(item.progress) : null;
  const progHtml = pct !== null
    ? `<div class="q-bar"><div class="q-bar-fill" style="width:${pct}%"></div></div>
       <div class="q-pct">${pct}%</div>` : '';
  const actionHtml = isHistory
    ? '' : `<button class="q-remove" data-qid="${esc(item.id)}" title="Verwijder uit queue">✕</button>`;
  return `
    <div class="q-row">
      <div class="q-info">
        <div class="q-title">${esc(item.title || '(onbekend)')}</div>
        ${item.artist ? `<div class="q-artist artist-link" data-artist="${esc(item.artist)}">${esc(item.artist)}</div>` : ''}
        <span class="q-status ${statusClass}">${esc(item.status || 'queued')}</span>
      </div>
      ${progHtml}${actionHtml}
    </div>`;
}

// ── Queue renderen ────────────────────────────────────────────────────────
export function renderTidalQueue() {
  const target = document.getElementById('tidal-content');
  if (!target) return;
  const items = state.tidarrQueueItems;
  if (!items.length) {
    target.innerHTML = `<div class="empty">De download-queue is leeg.</div>`;
    return;
  }
  const statusLabel = {
    queue_download: 'In wachtrij', queue_processing: 'Verwerken (wacht)',
    download: 'Downloaden…', processing: 'Verwerken…',
    finished: 'Klaar', error: 'Fout'
  };
  const statusClass = {
    queue_download: 'q-pending', queue_processing: 'q-pending',
    download: 'q-active', processing: 'q-active',
    finished: 'q-done', error: 'q-error'
  };
  target.innerHTML = `
    <div class="section-title">${items.length} item${items.length !== 1 ? 's' : ''} in queue</div>
    <div class="q-list">${items.map(it => {
      const sc  = statusClass[it.status] || 'q-pending';
      const lbl = statusLabel[it.status] || it.status || 'In wachtrij';
      const pct = it.progress?.current && it.progress?.total
        ? Math.round(it.progress.current / it.progress.total * 100) : null;
      const progHtml = pct !== null
        ? `<div class="q-bar"><div class="q-bar-fill" style="width:${pct}%"></div></div><div class="q-pct">${pct}%</div>` : '';
      return `<div class="q-row">
        <div class="q-info">
          <div class="q-title">${esc(it.title || '(onbekend)')}</div>
          ${it.artist ? `<div class="q-artist" data-artist="${esc(it.artist)}">${esc(it.artist)}</div>` : ''}
          <span class="q-status ${sc}">${esc(lbl)}</span>
        </div>
        ${progHtml}
        <button class="q-remove" data-qid="${esc(it.id)}" title="Verwijder">✕</button>
      </div>`;
    }).join('')}</div>`;
}

// ── Geschiedenis ──────────────────────────────────────────────────────────
export async function renderTidalHistory() {
  const target = document.getElementById('tidal-content');
  if (!target) return;
  target.innerHTML = skeletonList(5);
  try {
    const items = await apiFetch('/api/downloads');
    if (!items.length) {
      target.innerHTML = `<div class="empty">Nog geen downloads opgeslagen.</div>`; return;
    }
    const qualityLabel = { max: '24-bit', high: 'Lossless', normal: 'AAC', low: '96kbps' };
    target.innerHTML = `
      <div class="section-title">${items.length} gedownloade albums
        <button class="tool-btn" id="dl-history-clear" style="margin-left:auto;font-size:11px">🗑 Wis alles</button>
      </div>
      <div class="q-list">${items.map(it => {
        const date = it.queued_at
          ? new Date(it.queued_at).toLocaleDateString('nl-NL', { day:'numeric', month:'short', year:'numeric' }) : '';
        const ql = qualityLabel[it.quality] || it.quality || '';
        const art = it.image || it.cover || it.album_art || '';
        const artHtml = art
          ? `<img class="q-thumb" src="${esc(art)}" alt="${esc(it.title)} by ${esc(it.artist)}" loading="lazy" decoding="async">`
          : `<div class="q-thumb q-thumb-ph" style="background:${gradientFor(it.title || it.artist || '?')}">${initials(it.title || it.artist || '?')}</div>`;
        return `<div class="q-row">
          ${artHtml}
          <div class="q-info">
            <div class="q-title">${esc(it.title)}</div>
            ${it.artist ? `<div class="q-artist artist-link" data-artist="${esc(it.artist)}">${esc(it.artist)}</div>` : ''}
            <span class="q-status q-done">✓ gedownload${ql ? ' · '+ql : ''}${date ? ' · '+date : ''}</span>
          </div>
          <button class="q-remove" data-dlid="${it.id}" title="Verwijder uit geschiedenis">✕</button>
        </div>`;
      }).join('')}</div>`;

    document.getElementById('dl-history-clear')?.addEventListener('click', async () => {
      if (!confirm('Wis de volledige download-geschiedenis?')) return;
      try { await p('/api/downloads', { method: 'DELETE' }); } catch (e) { if (e.name !== 'AbortError') {} }
      for (const it of items)
        try { await p(`/api/downloads/${it.id}`, { method: 'DELETE' }); } catch (e) { if (e.name !== 'AbortError') {} }
      state.downloadedSet.clear();
      renderTidalHistory();
    });
  } catch (e) {
    target.innerHTML = `<div class="error-box">⚠️ ${esc(e.message)}</div>`;
  }
}

// ── View wisselen ──────────────────────────────────────────────────────────
export function setTidalView(view) {
  state.tidalView = view;
  document.querySelectorAll('[data-tidal-view]').forEach(b => {
    const active = b.dataset.tidalView === view;
    b.classList.toggle('sel-def', active);
    b.setAttribute('aria-selected', active ? 'true' : 'false');
  });
  const sw = document.getElementById('tidal-search-wrap');
  if (sw) sw.style.display = view === 'search' ? '' : 'none';
  if (view === 'search') {
    const q = document.getElementById('tidal-search')?.value || '';
    if (state.downloadEngine === 'orpheus') renderOrpheusSearch(q);
    else renderTidalSearch(q);
  }
  else if (view === 'queue')   renderTidalQueue();
  else if (view === 'history') renderTidalHistory();
}

// ── Tidarr SSE ───────────────────────────────────────────────────────────
export function startTidarrSSE() {
  if (state.tidarrSseSource) return;
  const es = new EventSource('/api/tidarr/stream');
  state.tidarrSseSource = es;

  es.onmessage = e => {
    try { state.tidarrQueueItems = JSON.parse(e.data) || []; }
    catch { state.tidarrQueueItems = []; }

    const active = state.tidarrQueueItems.filter(i => i.status !== 'finished' && i.status !== 'error');
    const badges = [
      document.getElementById('badge-tidarr-queue'),
      document.getElementById('badge-tidarr-queue-inline')
    ];
    for (const b of badges) {
      if (!b) continue;
      if (active.length > 0) { b.textContent = active.length; b.style.display = ''; }
      else                    { b.style.display = 'none'; }
    }
    updateQueueFab(state.tidarrQueueItems);
    if (state.activeView === 'downloads' && state.tidalView === 'queue') renderTidalQueue();
    if (document.getElementById('queue-popover')?.classList.contains('open')) renderQueuePopover();
    // Dashboard download-widget auto-refresh
    if (state.activeView === 'nu') {
      const dwEl = document.getElementById('wbody-download-voortgang');
      if (dwEl) renderDashboardQueue(dwEl, active);
    }
    // Notify global download queue indicator
    window.dispatchEvent(new CustomEvent('tidarr-queue-update'));
  };

  es.onerror = () => {
    es.close();
    state.tidarrSseSource = null;
    setTimeout(startTidarrSSE, 10_000);
  };
}

export function stopTidarrSSE() {
  if (state.tidarrSseSource) { state.tidarrSseSource.close(); state.tidarrSseSource = null; }
}

// ── Dashboard download-widget renderer (ook gebruikt door nu.js) ──────────
export function renderDashboardQueue(el, items) {
  if (!items) items = state.tidarrQueueItems.filter(i => i.status !== 'finished' && i.status !== 'error');
  if (!items.length) {
    el.innerHTML = '<div class="empty" style="font-size:12px">Geen actieve downloads</div>';
    return;
  }
  const statusLabel = {
    queue_download: 'In wachtrij', queue_processing: 'Verwerken',
    download: 'Downloaden…', processing: 'Verwerken…',
  };
  el.innerHTML = `<div class="w-queue-list">${items.slice(0, 5).map(i => {
    const pct = i.progress?.current && i.progress?.total
      ? Math.round(i.progress.current / i.progress.total * 100) : null;
    return `<div class="w-q-row"><div class="w-q-info">
      <div class="w-q-title">${esc(i.title || '(onbekend)')}</div>
      ${i.artist ? `<div class="w-q-artist" data-artist="${esc(i.artist)}">${esc(i.artist)}</div>` : ''}
      ${pct !== null
        ? `<div class="q-bar" style="margin-top:4px"><div class="q-bar-fill" style="width:${pct}%"></div></div>
           <div style="font-size:10px;color:var(--muted2);margin-top:2px">${pct}%</div>`
        : `<span class="q-status q-pending" style="margin-top:4px;display:inline-block">${esc(statusLabel[i.status] || i.status)}</span>`}
    </div></div>`;
  }).join('')}${items.length > 5 ? `<div style="font-size:11px;color:var(--muted2);margin-top:6px">+${items.length - 5} meer</div>` : ''}</div>`;
}

export function startTidarrQueuePolling() { startTidarrSSE(); }
export function stopTidarrQueuePolling()  { /* SSE blijft actief */ }

// ── Tidarr/content UI helpers ────────────────────────────────────────────
export function loadTidarrUI() {
  const iframe  = document.getElementById('tidarr-iframe');
  const wrap    = document.getElementById('tidarr-ui-wrap');
  const content = document.getElementById('content');
  wrap.style.display    = 'flex';
  content.style.display = 'none';
  if (!iframe.dataset.loaded) {
    iframe.src = iframe.dataset.src;
    iframe.dataset.loaded = '1';
  }
}

export function hideTidarrUI() {
  document.getElementById('tidarr-ui-wrap').style.display = 'none';
  document.getElementById('content').style.display        = '';
}

// ── Queue FAB ─────────────────────────────────────────────────────────────
export function updateQueueFab(items) {
  const fab   = document.getElementById('queue-fab');
  const badge = document.getElementById('fab-queue-badge');
  if (!fab) return;
  const active = (items || []).filter(i => i.status !== 'finished' && i.status !== 'error');
  if (items && items.length > 0) {
    fab.style.display = '';
    if (active.length > 0) { badge.textContent = active.length; badge.style.display = ''; }
    else                    { badge.style.display = 'none'; }
  } else {
    fab.style.display = 'none';
    document.getElementById('queue-popover')?.classList.remove('open');
  }
}

export function renderQueuePopover() {
  const list = document.getElementById('queue-popover-list');
  if (!list) return;
  const items = state.tidarrQueueItems;
  if (!items.length) { list.innerHTML = `<div class="qpop-empty">Queue is leeg</div>`; return; }
  const statusLabel = {
    queue_download: 'In wachtrij', queue_processing: 'Verwerken',
    download: 'Downloaden…', processing: 'Verwerken…',
    finished: 'Klaar ✓', error: 'Fout'
  };
  const statusClass = {
    queue_download: 'q-pending', queue_processing: 'q-pending',
    download: 'q-active', processing: 'q-active',
    finished: 'q-done', error: 'q-error'
  };
  list.innerHTML = items.map(it => {
    const sc  = statusClass[it.status] || 'q-pending';
    const lbl = statusLabel[it.status] || it.status || 'In wachtrij';
    const pct = it.progress?.current && it.progress?.total
      ? Math.round(it.progress.current / it.progress.total * 100) : null;
    const progHtml = pct !== null
      ? `<div class="q-bar" style="margin-top:4px"><div class="q-bar-fill" style="width:${pct}%"></div></div>` : '';
    return `<div class="qpop-row">
      <div class="qpop-title">${esc(it.title || '(onbekend)')}</div>
      ${it.artist ? `<div class="qpop-artist" data-artist="${esc(it.artist)}">${esc(it.artist)}</div>` : ''}
      <span class="q-status ${sc}">${esc(lbl)}</span>
      ${progHtml}
    </div>`;
  }).join('');
}

export function toggleQueuePopover() {
  const pop = document.getElementById('queue-popover');
  if (!pop) return;
  const isOpen = pop.classList.toggle('open');
  if (isOpen) renderQueuePopover();
}

export function closeQueuePopover() {
  document.getElementById('queue-popover')?.classList.remove('open');
}

// ── Artiest-normalisatie ──────────────────────────────────────────────────
export function normalizeArtist(s) {
  return (s || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}
export function artistMatches(found, wanted) {
  const f = normalizeArtist(found);
  const w = normalizeArtist(wanted);
  if (!f || !w) return true;
  return f === w || f.includes(w) || w.includes(f);
}

// ── Download bevestigingsdialog ───────────────────────────────────────────
export function openDownloadConfirm(candidates, wantedArtist, wantedAlbum, btn) {
  return new Promise(resolve => {
    state.dlResolve = resolve;
    const modal   = document.getElementById('dl-confirm-modal');
    const content = document.getElementById('dl-confirm-cards');
    document.getElementById('dl-confirm-wanted').textContent =
      `"${wantedAlbum}"${wantedArtist ? ' – ' + wantedArtist : ''}`;

    content.innerHTML = candidates.map((c, i) => {
      const mismatch = !artistMatches(c.artist, wantedArtist);
      const imgEl = c.image
        ? `<img class="dlc-img" src="${esc(c.image)}" alt="" loading="lazy" decoding="async"
             onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
           <div class="dlc-ph" style="display:none">${initials(c.title)}</div>`
        : `<div class="dlc-ph">${initials(c.title)}</div>`;
      const artistHtml = mismatch
        ? `<div class="dlc-artist dlc-artist-warn">⚠ ${esc(c.artist)}</div>`
        : `<div class="dlc-artist">${esc(c.artist)}</div>`;
      const scorePct = c.score ?? 0;
      return `
        <button class="dlc-card${i === 0 ? ' dlc-best' : ''}" data-dlc-idx="${i}">
          <div class="dlc-cover">${imgEl}</div>
          <div class="dlc-info">
            <div class="dlc-title">${esc(c.title)}</div>
            ${artistHtml}
            <div class="dlc-meta">${c.year ? esc(c.year) : ''}${c.year && c.tracks ? ' · ' : ''}${c.tracks ? c.tracks + ' nrs' : ''}</div>
            <div class="dlc-score-bar"><div class="dlc-score-fill" style="width:${scorePct}%"></div></div>
            <div class="dlc-score-label">${scorePct}% overeenkomst</div>
          </div>
          ${i === 0 ? '<span class="dlc-badge-best">Beste match</span>' : ''}
        </button>`;
    }).join('');

    content.querySelectorAll('.dlc-card').forEach(card => {
      card.addEventListener('click', () => {
        const idx = parseInt(card.dataset.dlcIdx);
        closeDownloadConfirm();
        resolve({ chosen: candidates[idx], btn });
      });
    });

    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  });
}

export function closeDownloadConfirm() {
  document.getElementById('dl-confirm-modal')?.classList.remove('open');
  document.body.style.overflow = '';
  if (state.dlResolve) { state.dlResolve({ chosen: null }); state.dlResolve = null; }
}

// ── Download uitvoeren ────────────────────────────────────────────────────
export async function executeDownload(chosen, wantedArtist, wantedAlbum, btn) {
  const res = await p('/api/tidarr/download', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url:     chosen.url,
      type:    chosen.type   || 'album',
      title:   chosen.title  || wantedAlbum  || '',
      artist:  chosen.artist || wantedArtist || '',
      id:      String(chosen.id || ''),
      quality: getDownloadQuality()
    })
  });
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data.error || 'download mislukt');
  markDownloaded(chosen.artist || wantedArtist || '', chosen.title || wantedAlbum || '');
  if (btn) { btn.textContent = '✓'; btn.classList.add('dl-done'); btn.disabled = false; }
  await refreshTidarrQueueBadge();
}

export async function triggerOrpheusDownload(artist, album, btn) {
  if (!state.orpheusConnected) {
    alert('OrpheusDL is niet verbonden. Controleer de OrpheusDL-instellingen.');
    return;
  }
  if (btn) { btn.disabled = true; btn.textContent = '…'; }
  try {
    const query = [artist, album].filter(Boolean).join(' ');
    const d = await orpheusSearch(query, state.orpheusPlatform || 'all');
    const results = d.results || [];

    if (!results.length) {
      alert(`Niet gevonden via OrpheusDL: "${album}"${artist ? ' van ' + artist : ''}\n\nProbeer handmatig via de Downloads-tab.`);
      if (btn) { btn.disabled = false; btn.textContent = '⬇'; }
      return;
    }

    // Score elk resultaat op artiest-match, titel-match, type en platform
    const scoreResult = (r) => {
      let score = 0;
      const rArtist    = (r.artist || '').toLowerCase();
      const rTitle     = (r.title  || '').toLowerCase();
      const wantArtist = (artist   || '').toLowerCase();
      const wantAlbum  = (album    || '').toLowerCase();

      // Artiest-match is het belangrijkst
      if (rArtist && wantArtist) {
        if (rArtist === wantArtist)                                             score += 100;
        else if (rArtist.includes(wantArtist) || wantArtist.includes(rArtist)) score += 60;
        else                                                                    score -= 50;
      }

      // Titel-match
      if (rTitle && wantAlbum) {
        if (rTitle === wantAlbum)                                              score += 80;
        else if (rTitle.includes(wantAlbum) || wantAlbum.includes(rTitle))    score += 40;
      }

      // Voorkeur voor albums boven tracks/playlists
      if (r.type === 'album') score += 30;

      // Voorkeur voor lossless platforms
      if (['qobuz', 'tidal', 'deezer'].includes(r.platform)) score += 20;

      // Straf voor remixes / live / original mix tenzij dat ook gewenst is
      if (/remix|original mix|live|remaster/i.test(rTitle) &&
          !/remix|live|remaster/i.test(wantAlbum)) score -= 30;

      return score;
    };

    results.sort((a, b) => scoreResult(b) - scoreResult(a));

    const quality = getOrpheusQuality();

    const doDownload = async (chosen) => {
      const result = await orpheusDownload(chosen.url, quality, chosen.title, chosen.artist);
      if (!result.ok) throw new Error(result.error || 'download mislukt');
      markDownloaded(chosen.artist || artist, chosen.title || album);
      const cardEl = btn?.closest('.orpheus-card, .gaps-artist-card');
      if (result.jobId && cardEl) {
        state.activeOrpheusJobs = state.activeOrpheusJobs || [];
        state.activeOrpheusJobs.push({
          jobId: result.jobId, title: chosen.title, artist: chosen.artist, status: 'pending', progress: 0
        });
        window.dispatchEvent(new CustomEvent('orpheus-jobs-update'));
        startOrpheusJobPoll(result.jobId, cardEl);
      } else if (btn) {
        btn.textContent = '✓';
        btn.classList.add('dl-done');
        btn.disabled = false;
      }
    };

    const best = results[0];
    if (artist && !artistMatches(best.artist, artist)) {
      if (btn) { btn.disabled = false; btn.textContent = '⬇'; }
      const candidates = results.slice(0, 3).map((r) => ({
        title: r.title, artist: r.artist, url: r.url,
        image: r.image, year: r.year,
        score: scoreResult(r)
      }));
      const { chosen } = await openDownloadConfirm(candidates, artist, album, btn);
      if (!chosen) return;
      if (btn) { btn.disabled = true; btn.textContent = '…'; }
      await doDownload(chosen);
    } else {
      await doDownload(best);
    }
  } catch (e) {
    alert('OrpheusDL downloaden mislukt: ' + e.message);
    if (btn) { btn.disabled = false; btn.textContent = '⬇'; }
  }
}

export async function triggerTidarrDownload(artist, album, btn) {
  if (!state.tidarrOk) {
    alert('Tidarr is niet verbonden. Controleer TIDARR_URL en TIDARR_API_KEY.');
    return;
  }
  if (btn) { btn.disabled = true; btn.textContent = '…'; }
  try {
    const params = new URLSearchParams();
    if (artist) params.set('artist', artist);
    if (album)  params.set('album', album);
    const candRes = await p(`/api/tidarr/candidates?${params}`);
    if (!candRes.ok) {
      if (candRes.status === 401) {
        alert('Niet ingelogd bij TIDAL.\nGa naar de 🎛️ Tidarr-tab en koppel je TIDAL-account eerst.');
      } else {
        alert(`Niet gevonden op TIDAL: "${album}"${artist ? ' van ' + artist : ''}\n\nProbeer het handmatig via de 🌊 Tidal-tab.`);
      }
      if (btn) { btn.disabled = false; btn.textContent = '⬇'; }
      return;
    }
    const { candidates } = await candRes.json();
    if (!candidates?.length) {
      alert(`Niet gevonden op TIDAL: "${album}"${artist ? ' van ' + artist : ''}`);
      if (btn) { btn.disabled = false; btn.textContent = '⬇'; }
      return;
    }
    const best = candidates[0];
    if (artist && !artistMatches(best.artist, artist)) {
      if (btn) { btn.disabled = false; btn.textContent = '⬇'; }
      const { chosen } = await openDownloadConfirm(candidates, artist, album, btn);
      if (!chosen) return;
      if (btn) { btn.disabled = true; btn.textContent = '…'; }
      await executeDownload(chosen, artist, album, btn);
    } else {
      await executeDownload(best, artist, album, btn);
    }
  } catch (e) {
    alert('Downloaden mislukt: ' + e.message);
    if (btn) { btn.disabled = false; btn.textContent = '⬇'; }
  }
}

// ── Tidal tab loader ──────────────────────────────────────────────────────
export async function loadTidal() {
  const isOrpheus = state.downloadEngine === 'orpheus';
  const platformLabel = ORPHEUS_PLATFORM_LABELS[state.orpheusPlatform] || state.orpheusPlatform;
  const searchPlaceholder = isOrpheus
    ? `Zoek via OrpheusDL${state.orpheusPlatform !== 'all' ? ' · ' + platformLabel : ''}… of plak een URL`
    : 'Zoek albums of tracks op Tidal…';

  setContent(`
    <div class="tidal-page">
      <div class="tidal-tabs-row">
        <div class="seg-tabs" role="tablist" aria-label="Downloads secties">
          <button class="tool-btn sel-def" data-tidal-view="search" role="tab" aria-selected="true">Zoeken</button>
          <button class="tool-btn" data-tidal-view="queue" role="tab" aria-selected="false">Queue <span class="badge-inline" id="badge-tidarr-queue-inline" style="display:none">0</span></button>
          <button class="tool-btn" data-tidal-view="history" role="tab" aria-selected="false">Geschiedenis</button>
        </div>
        <div class="tidal-tabs-actions">
          <span class="tidarr-status-pill off" id="tidarr-status-pill"><span class="tidarr-dot"></span><span id="tidarr-status-text">Tidarr status…</span></span>
          ${isOrpheus ? `<span class="tidarr-status-pill off" id="orpheus-status-pill"><span class="tidarr-dot"></span><span id="orpheus-status-text">OrpheusDL status…</span></span>` : ''}
          <button class="tool-btn" id="btn-open-tidarr" type="button">Open Tidarr</button>
        </div>
      </div>
      ${isOrpheus ? `<div class="orpheus-engine-banner">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
        Download engine: <strong>OrpheusDL</strong>${state.orpheusPlatform !== 'all' ? ` · Platform: <strong>${esc(platformLabel)}</strong>` : ''}
        — <button class="orpheus-engine-settings-link" type="button">Wijzig in ⚙ Instellingen</button>
      </div>` : ''}
      <div class="tidal-search-wrap" id="tidal-search-wrap">
        <input id="tidal-search" class="tidal-search" type="search"
               placeholder="${esc(searchPlaceholder)}" autocomplete="off">
      </div>
      <div id="tidal-content"><div class="empty">Begin met typen om te zoeken${isOrpheus ? ' via OrpheusDL' : ' op Tidal'}.</div></div>
    </div>
  `);

  // Instellingen-link in banner
  document.querySelector('.orpheus-engine-settings-link')?.addEventListener('click', () => {
    document.querySelector('.sidebar-settings-btn')?.click();
  });

  // Herlaad bij engine/platform wisseling
  const reloadHandler = () => {
    if (state.activeView === 'downloads') loadTidal();
  };
  document.addEventListener('engine:changed',   reloadHandler, { once: true });
  document.addEventListener('platform:changed', reloadHandler, { once: true });

  await loadTidarrStatus();
  if (isOrpheus) await loadOrpheusStatusPill();
  await refreshTidarrQueueBadge();
  setTidalView(state.tidalView);
  startTidarrQueuePolling();
}

async function loadOrpheusStatusPill() {
  const pill = document.getElementById('orpheus-status-pill');
  const text = document.getElementById('orpheus-status-text');
  if (!pill || !text) return;
  try {
    const { apiFetch: _apiFetch } = await import('../api.js');
    const d = await _apiFetch('/api/orpheus/status');
    state.orpheusConnected = !!d.connected;
    pill.className = `tidarr-status-pill ${d.connected ? 'on' : 'off'}`;
    text.textContent = d.connected ? 'OrpheusDL · verbonden' : 'OrpheusDL offline';
  } catch {
    state.orpheusConnected = false;
    if (pill) pill.className = 'tidarr-status-pill off';
    if (text) text.textContent = 'OrpheusDL offline';
  }
}

export function loadDownloads() {
  state.activeView = 'downloads';
  hideTidarrUI();
  loadTidal();
}

// ══════════════════════════════════════════════════════════════════════════════
// UNIFIED DOWNLOAD ORCHESTRATOR UI
// ══════════════════════════════════════════════════════════════════════════════

// ── Bron-labels en kleuren ────────────────────────────────────────────────────
const SOURCE_CONFIG = {
  tidarr:             { label: 'Tidal (Tidarr)', color: '#33ffe7', short: 'TIDAL' },
  orpheus_tidal:      { label: 'Tidal',          color: '#33ffe7', short: 'TIDAL' },
  orpheus_qobuz:      { label: 'Qobuz',          color: '#0070ef', short: 'QOBUZ' },
  orpheus_deezer:     { label: 'Deezer',         color: '#a238ff', short: 'DEEZER' },
  orpheus_spotify:    { label: 'Spotify',        color: '#1cc659', short: 'SPOTIFY' },
  orpheus_soundcloud: { label: 'SoundCloud',     color: '#ff5502', short: 'SC' },
  orpheus_applemusic: { label: 'Apple Music',    color: '#FA586A', short: 'APPLE' },
  orpheus_beatport:   { label: 'Beatport',       color: '#00ff89', short: 'BEAT' },
  orpheus_beatsource: { label: 'Beatsource',     color: '#16a8f4', short: 'BSRC' },
  orpheus_youtube:    { label: 'YouTube',        color: '#FF0000', short: 'YT' },
};

function sourceLabel(src) { return SOURCE_CONFIG[src]?.label || src; }
function sourceColor(src) { return SOURCE_CONFIG[src]?.color || '#888'; }
function sourceShort(src) { return SOURCE_CONFIG[src]?.short || src.toUpperCase(); }

// ── Bron-status balk ──────────────────────────────────────────────────────────
export async function renderSourceStatusBar(container) {
  if (!container) return;
  container.innerHTML = `<div class="src-loading">Status laden…</div>`;
  try {
    const d = await apiFetch('/api/download/status');
    const sources = d.sources || [];
    if (!sources.length) { container.innerHTML = ''; return; }

    const enabled = sources.filter(s => s.enabled !== false);
    container.innerHTML = `
      <div class="src-status-bar">
        ${enabled.map(s => {
          const dotCls = s.available === true ? 'src-dot-ok' : s.available === false ? 'src-dot-err' : 'src-dot-unk';
          const color  = sourceColor(s.name);
          return `<span class="src-pill" title="${esc(s.label || s.name)}${s.errorCount > 0 ? ' · ' + s.errorCount + ' fouten' : ''}">
            <span class="src-dot ${dotCls}" style="--src-color:${color}"></span>
            <span class="src-pill-label">${esc(sourceShort(s.name))}</span>
          </span>`;
        }).join('')}
        <button class="src-refresh-btn tool-btn" type="button" title="Herlaad status" aria-label="Herlaad bron-status">↺</button>
      </div>`;

    container.querySelector('.src-refresh-btn')?.addEventListener('click', () => renderSourceStatusBar(container));
  } catch {
    container.innerHTML = `<span class="src-pill"><span class="src-dot src-dot-err"></span> Status onbekend</span>`;
  }
}

// ── Unified zoekresultaat card ────────────────────────────────────────────────
export function unifiedResultCard(item) {
  const src    = item.source || 'unknown';
  const color  = sourceColor(src);
  const lbl    = sourceLabel(src);
  const imgEl  = item.image
    ? `<img class="tidal-img" src="${esc(item.image)}" alt="${esc(item.title)}" loading="lazy" decoding="async"
         onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
       <div class="tidal-ph" style="display:none;background:${gradientFor(item.title)}">${initials(item.title)}</div>`
    : `<div class="tidal-ph" style="background:${gradientFor(item.title)}">${initials(item.title)}</div>`;
  const meta = [
    item.type === 'album' ? 'Album' : 'Nummer',
    item.year,
    item.album && item.type === 'track' ? item.album : null,
  ].filter(Boolean).join(' · ');

  return `
    <div class="tidal-card unified-card"
         data-unified-source="${esc(src)}"
         data-unified-url="${esc(item.url || '')}"
         data-unified-title="${esc(item.title)}"
         data-unified-artist="${esc(item.artist || '')}"
         data-unified-type="${esc(item.type || 'album')}"
         data-unified-id="${esc(String(item.id || ''))}"
         data-unified-platform="${esc(item.platform || '')}">
      <div class="tidal-cover">${imgEl}</div>
      <div class="tidal-info">
        <div class="tidal-title">${esc(item.title)}</div>
        <div class="tidal-artist artist-link" data-artist="${esc(item.artist || '')}">${esc(item.artist || '')}</div>
        <div class="tidal-meta">${esc(meta)}</div>
      </div>
      <div class="unified-card-actions">
        <span class="orpheus-platform-badge" style="--badge-color:${color}">${esc(lbl)}</span>
        <button class="tidal-dl-btn unified-dl-btn" title="Download via ${esc(lbl)}">⬇ Download</button>
      </div>
    </div>`;
}

// ── Unified zoeken ────────────────────────────────────────────────────────────
export async function renderUnifiedSearch(query) {
  const target = document.getElementById('unified-content');
  if (!target) return;
  const q = (query || '').trim();
  if (q.length < 2) {
    target.innerHTML = `<div class="empty">Begin met typen om over alle bronnen te zoeken.</div>`;
    return;
  }
  target.innerHTML = `<div class="loading"><div class="spinner"></div>Zoeken via alle bronnen…</div>`;
  try {
    const type = document.getElementById('unified-type-sel')?.value || 'album';
    const d    = await apiFetch(`/api/download/search?q=${encodeURIComponent(q)}&type=${type}`);
    const results = d.results || [];
    if (d.error) { target.innerHTML = `<div class="error-box">⚠️ ${esc(d.error)}</div>`; return; }
    if (!results.length) {
      target.innerHTML = `<div class="empty">Geen resultaten voor "<strong>${esc(q)}</strong>" via alle bronnen.</div>`;
      return;
    }

    // Groepeer per type
    const albums = results.filter(r => r.type === 'album');
    const tracks = results.filter(r => r.type === 'track');
    let html = `<div class="unified-results-info">${results.length} resultaten over ${new Set(results.map(r => r.source)).size} bronnen</div>`;
    if (albums.length)
      html += `<div class="section-title">Albums (${albums.length})</div>
        <div class="tidal-grid">${albums.map(unifiedResultCard).join('')}</div>`;
    if (tracks.length)
      html += `<div class="section-title" style="margin-top:1.5rem">Nummers (${tracks.length})</div>
        <div class="tidal-grid">${tracks.map(unifiedResultCard).join('')}</div>`;
    target.innerHTML = html;

    // Download button handlers
    target.querySelectorAll('.unified-dl-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const card    = btn.closest('.unified-card');
        const src     = card.dataset.unifiedSource;
        const url     = card.dataset.unifiedUrl;
        const title   = card.dataset.unifiedTitle;
        const artist  = card.dataset.unifiedArtist;
        const type    = card.dataset.unifiedType;

        btn.disabled = true; btn.textContent = '…';
        try {
          await triggerOrchestratorDownload({ artist, album: title, type, source: src, url });
          btn.textContent = '✓'; btn.classList.add('dl-done');
        } catch (e) {
          btn.disabled = false; btn.textContent = '⬇ Download';
          alert('Download mislukt: ' + e.message);
        }
      });
    });
  } catch (e) {
    target.innerHTML = `<div class="error-box">⚠️ ${esc(e.message)}</div>`;
  }
}

// ── Orchestrator download triggeren ──────────────────────────────────────────
export async function triggerOrchestratorDownload({ artist, album, track, type = 'album', quality, source = 'auto', url: _url }) {
  const quality_val = quality || localStorage.getItem('downloadQuality') || 'flac';
  const body = { artist, album, track, type, quality: quality_val, source };

  const res = await fetch('/api/download', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok && res.status >= 500) throw new Error(data.error || 'Orchestrator fout');
  if (data.status === 'failed') throw new Error(data.error || 'Alle bronnen mislukt');

  // Optioneel: markeer als gedownload
  markDownloaded(artist || '', album || track || '');
  return data;
}

// ── Orchestrator queue renderen ───────────────────────────────────────────────
export async function renderOrchestratorQueue() {
  const target = document.getElementById('unified-content');
  if (!target) return;
  target.innerHTML = `<div class="loading"><div class="spinner"></div>Queue laden…</div>`;
  try {
    const d = await apiFetch('/api/download/queue');
    const jobs = d.jobs || [];
    if (!jobs.length) {
      target.innerHTML = `<div class="empty">Geen actieve downloads in de orchestrator queue.</div>`;
      return;
    }
    target.innerHTML = `
      <div class="section-title">${jobs.length} actieve download${jobs.length !== 1 ? 's' : ''}</div>
      <div class="q-list">${jobs.map(job => orchestratorJobRow(job, false)).join('')}</div>`;

    target.querySelectorAll('.unified-retry-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.jobId;
        btn.disabled = true; btn.textContent = '…';
        try {
          await fetch(`/api/download/retry/${id}`, { method: 'POST' });
          await renderOrchestratorQueue();
        } catch { btn.disabled = false; btn.textContent = 'Retry'; }
      });
    });
  } catch (e) {
    target.innerHTML = `<div class="error-box">⚠️ ${esc(e.message)}</div>`;
  }
}

// ── Orchestrator history renderen ─────────────────────────────────────────────
export async function renderOrchestratorHistory() {
  const target = document.getElementById('unified-content');
  if (!target) return;
  target.innerHTML = `<div class="loading"><div class="spinner"></div>Geschiedenis laden…</div>`;
  try {
    const d = await apiFetch('/api/download/history?limit=100');
    const jobs = d.jobs || [];
    if (!jobs.length) {
      target.innerHTML = `<div class="empty">Nog geen downloads via de orchestrator.</div>`;
      return;
    }

    // Knop om alle gefaalde te herstarten
    const failedCount = jobs.filter(j => j.status === 'failed').length;
    target.innerHTML = `
      <div class="section-title">${jobs.length} downloads
        ${failedCount > 0 ? `<button class="tool-btn" id="retry-all-btn" style="margin-left:auto;font-size:11px">↺ Herstart ${failedCount} mislukt</button>` : ''}
      </div>
      <div class="q-list">${jobs.map(job => orchestratorJobRow(job, true)).join('')}</div>`;

    document.getElementById('retry-all-btn')?.addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      btn.disabled = true; btn.textContent = '…';
      try {
        const r = await fetch('/api/download/retry-all', { method: 'POST' }).then(r => r.json());
        btn.textContent = `↺ ${r.retried} herstart`;
        setTimeout(() => renderOrchestratorHistory(), 2000);
      } catch { btn.disabled = false; btn.textContent = 'Fout'; }
    });

    target.querySelectorAll('.unified-retry-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.jobId;
        btn.disabled = true; btn.textContent = '…';
        try {
          await fetch(`/api/download/retry/${id}`, { method: 'POST' });
          await renderOrchestratorHistory();
        } catch { btn.disabled = false; btn.textContent = 'Retry'; }
      });
    });
  } catch (e) {
    target.innerHTML = `<div class="error-box">⚠️ ${esc(e.message)}</div>`;
  }
}

// ── Job row helper ────────────────────────────────────────────────────────────
function orchestratorJobRow(job, isHistory) {
  const statusMap = {
    pending:   { cls: 'q-pending', lbl: 'In wachtrij' },
    running:   { cls: 'q-active',  lbl: 'Bezig…' },
    completed: { cls: 'q-done',    lbl: '✓ Voltooid' },
    failed:    { cls: 'q-error',   lbl: '✗ Mislukt' },
  };
  const { cls, lbl } = statusMap[job.status] || { cls: 'q-pending', lbl: job.status };
  const src     = job.source_used || job.source_requested || 'auto';
  const color   = sourceColor(src);
  const srcLbl  = sourceLabel(src);
  const date    = job.created_at
    ? new Date(job.created_at * 1000).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }) : '';

  const retryBtn = (isHistory && job.status === 'failed')
    ? `<button class="tool-btn unified-retry-btn" data-job-id="${job.id}" title="Opnieuw proberen">↺ Retry</button>` : '';

  const errMsg = (job.status === 'failed' && job.error_log)
    ? `<div class="unified-job-err" title="${esc(job.error_log)}">${esc(job.error_log.slice(0, 80))}${job.error_log.length > 80 ? '…' : ''}</div>` : '';

  return `
    <div class="q-row">
      <div class="q-info" style="flex:1">
        <div class="q-title">${esc(job.album || job.track || '(onbekend)')}</div>
        ${job.artist ? `<div class="q-artist artist-link" data-artist="${esc(job.artist)}">${esc(job.artist)}</div>` : ''}
        <div style="display:flex;gap:6px;align-items:center;margin-top:4px;flex-wrap:wrap">
          <span class="q-status ${cls}">${esc(lbl)}</span>
          ${src !== 'auto' && src !== 'none' ? `<span class="orpheus-platform-badge" style="--badge-color:${color};font-size:10px;padding:1px 6px">${esc(srcLbl)}</span>` : ''}
          ${date ? `<span style="font-size:10px;color:var(--muted2)">${esc(date)}</span>` : ''}
          ${job.attempts > 1 ? `<span style="font-size:10px;color:var(--muted2)">${job.attempts}× geprobeerd</span>` : ''}
        </div>
        ${errMsg}
      </div>
      ${retryBtn}
    </div>`;
}

// ── View wisselen voor unified sectie ─────────────────────────────────────────
export function setUnifiedView(view) {
  state.unifiedView = view;
  document.querySelectorAll('[data-unified-view]').forEach(b => {
    const active = b.dataset.unifiedView === view;
    b.classList.toggle('sel-def', active);
    b.setAttribute('aria-selected', active ? 'true' : 'false');
  });

  const sw = document.getElementById('unified-search-wrap');
  if (sw) sw.style.display = view === 'search' ? '' : 'none';

  if (view === 'search') {
    const q = document.getElementById('unified-search')?.value || '';
    if (q.length >= 2) renderUnifiedSearch(q);
    else {
      const t = document.getElementById('unified-content');
      if (t) t.innerHTML = `<div class="empty">Begin met typen om over alle bronnen te zoeken.</div>`;
    }
  } else if (view === 'queue')   renderOrchestratorQueue();
  else if (view === 'history') renderOrchestratorHistory();
}

// ── Unified Download tab loader ───────────────────────────────────────────────
export async function loadUnifiedDownloads() {
  // Bouw de HTML
  setContent(`
    <div class="tidal-page">

      <!-- Bron-status balk -->
      <div id="src-status-container" class="src-status-container"></div>

      <!-- Unified sectie tabs -->
      <div class="tidal-tabs-row" style="margin-top:8px">
        <div class="seg-tabs" role="tablist" aria-label="Download secties">
          <button class="tool-btn sel-def" data-unified-view="search" role="tab" aria-selected="true">🔍 Zoeken</button>
          <button class="tool-btn" data-unified-view="queue" role="tab" aria-selected="false">⏳ Queue</button>
          <button class="tool-btn" data-unified-view="history" role="tab" aria-selected="false">📋 Geschiedenis</button>
        </div>
        <div class="tidal-tabs-actions">
          <button class="tool-btn" id="btn-open-tidarr" type="button">Open Tidarr UI</button>
        </div>
      </div>

      <!-- Unified zoekbalk -->
      <div class="tidal-search-wrap" id="unified-search-wrap">
        <input id="unified-search" class="tidal-search" type="search"
               placeholder="Zoek albums of tracks via alle bronnen…" autocomplete="off">
        <select id="unified-type-sel" class="orpheus-quality-sel" style="margin-left:8px;min-width:90px"
                title="Type" aria-label="Zoek type">
          <option value="album">Albums</option>
          <option value="track">Tracks</option>
        </select>
      </div>

      <div id="unified-content">
        <div class="empty">Begin met typen om over alle bronnen te zoeken.</div>
      </div>

      <!-- Tidarr iframe (verborgen) -->
      <div id="tidarr-ui-wrap" style="display:none;flex-direction:column;height:80vh">
        <button class="tool-btn" id="btn-tidarr-close" style="margin-bottom:8px">← Terug</button>
        <iframe id="tidarr-iframe" data-src="/tidarr-ui" style="flex:1;border:none;border-radius:8px"></iframe>
      </div>
    </div>
  `);

  // Status balk laden
  renderSourceStatusBar(document.getElementById('src-status-container'));

  // Tabs
  document.querySelectorAll('[data-unified-view]').forEach(btn => {
    btn.addEventListener('click', () => setUnifiedView(btn.dataset.unifiedView));
  });

  // Zoek-input debounce
  let searchTimer;
  document.getElementById('unified-search')?.addEventListener('input', e => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => renderUnifiedSearch(e.target.value), 500);
  });
  document.getElementById('unified-type-sel')?.addEventListener('change', () => {
    const q = document.getElementById('unified-search')?.value || '';
    if (q.length >= 2) renderUnifiedSearch(q);
  });

  // Tidarr iframe knoppen
  document.getElementById('btn-open-tidarr')?.addEventListener('click', loadTidarrUI);
  document.getElementById('btn-tidarr-close')?.addEventListener('click', () => {
    document.getElementById('tidarr-ui-wrap').style.display = 'none';
    document.getElementById('content').style.display = '';
  });

  // Start Tidarr SSE voor queue badge updates
  startTidarrQueuePolling();
}

// Export: overschrijf loadDownloads om unified te laden als dat de voorkeur heeft
export function loadDownloadsUnified() {
  state.activeView = 'downloads';
  hideTidarrUI();
  loadUnifiedDownloads();
}

// ── Statische event listeners ──────────────────────────────────────────────
document.getElementById('dl-confirm-cancel')?.addEventListener('click', () => {
  closeDownloadConfirm();
});
document.getElementById('dl-confirm-modal')?.addEventListener('click', e => {
  if (e.target === document.getElementById('dl-confirm-modal')) closeDownloadConfirm();
});
document.getElementById('queue-fab')?.addEventListener('click', toggleQueuePopover);
document.getElementById('qpop-close')?.addEventListener('click', e => {
  e.stopPropagation(); closeQueuePopover();
});
document.getElementById('qpop-goto-tidal')?.addEventListener('click', () => {
  closeQueuePopover();
  document.querySelector('.tab[data-tab="downloads"]')?.click();
  setTimeout(() => setTidalView('queue'), 150);
});
document.addEventListener('click', e => {
  const pop = document.getElementById('queue-popover');
  const fab = document.getElementById('queue-fab');
  if (pop?.classList.contains('open') && !pop.contains(e.target) && !fab?.contains(e.target))
    closeQueuePopover();
}, true);
document.getElementById('btn-tidarr-reload')?.addEventListener('click', () => {
  const iframe = document.getElementById('tidarr-iframe');
  iframe.src = iframe.dataset.src;
});
