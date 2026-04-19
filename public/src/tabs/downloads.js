// ── Tab: Downloads (Tidarr / Tidal) ──────────────────────────────────────
import { state } from '../state.js';
import { apiFetch } from '../api.js';
import { esc, gradientFor, initials, fmt, markDownloaded, setContent } from '../helpers.js';

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
    ? `<img class="tidal-img" src="${esc(item.image)}" alt="" loading="lazy"
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
          ${it.artist ? `<div class="q-artist">${esc(it.artist)}</div>` : ''}
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
  target.innerHTML = `<div class="loading"><div class="spinner"></div>Geschiedenis ophalen…</div>`;
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
        return `<div class="q-row">
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
      await fetch('/api/downloads', { method: 'DELETE' }).catch(() => {});
      for (const it of items)
        await fetch(`/api/downloads/${it.id}`, { method: 'DELETE' }).catch(() => {});
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
  document.querySelectorAll('[data-tidal-view]').forEach(b =>
    b.classList.toggle('sel-def', b.dataset.tidalView === view));
  if (view === 'search')
    renderTidalSearch(document.getElementById('tidal-search')?.value || '');
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
    if (state.activeSubTab === 'tidal' && state.tidalView === 'queue') renderTidalQueue();
    if (document.getElementById('queue-popover')?.classList.contains('open')) renderQueuePopover();
    // Dashboard download-widget auto-refresh
    if (state.activeTab === 'nu') {
      const dwEl = document.getElementById('wbody-download-voortgang');
      if (dwEl) renderDashboardQueue(dwEl, active);
    }
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
      ${i.artist ? `<div class="w-q-artist">${esc(i.artist)}</div>` : ''}
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
      ${it.artist ? `<div class="qpop-artist">${esc(it.artist)}</div>` : ''}
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
        ? `<img class="dlc-img" src="${esc(c.image)}" alt="" loading="lazy"
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
  const res = await fetch('/api/tidarr/download', {
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
    const candRes = await fetch(`/api/tidarr/candidates?${params}`);
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
  setContent(`<div id="tidal-content"><div class="empty">Begin met typen om te zoeken op Tidal.</div></div>`);
  await loadTidarrStatus();
  await refreshTidarrQueueBadge();
  setTidalView(state.tidalView);
  startTidarrQueuePolling();
}

export function loadDownloads() {
  state.activeSubTab = 'tidal';
  hideTidarrUI();
  document.getElementById('tb-tidal')?.classList.add('visible');
  loadTidal();
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
