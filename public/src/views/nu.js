// ── Tab: Nu — Widget Dashboard ────────────────────────────────────────────
import { state }    from '../state.js';
import { apiFetch, fetchOnce } from '../api.js';
import { getCached, setCache, invalidate } from '../cache.js';
import {
  esc, timeAgo, getImg, proxyImg, gradientFor, initials,
  plexBadge, bookmarkBtn, downloadBtn, contentEl, fmt
} from '../helpers.js';
import { hideTidarrUI, stopTidarrQueuePolling, renderDashboardQueue } from './downloads.js';
import { playOnZone, pauseZone, skipZone, getSelectedZone } from '../components/plexRemote.js';

// ── Dashboard polling interval ────────────────────────────────────────────
let _dashPoller = null;
export function clearDashboardPolling() {
  if (_dashPoller) { clearInterval(_dashPoller); _dashPoller = null; }
}

// ── Plex Nu Bezig (globale header, ook buiten dashboard) ──────────────────
export async function loadPlexNP() {
  const wrap = document.getElementById('plex-np-wrap');
  if (!wrap) return;
  try {
    const d = await fetch('/api/plex/nowplaying').then(r => r.json());
    if (!wrap.isConnected) return; // element kan weg zijn na async fetch
    wrap.innerHTML = d.playing
      ? `<div class="plex-np"><div class="plex-np-dot"></div><span class="plex-np-label">PLEX NU</span>
           <div class="card-info"><div class="card-title">${esc(d.track)}</div>
           <div class="card-sub">${esc(d.artist)}${d.album ? ' · '+esc(d.album) : ''}</div></div></div>`
      : '';
  } catch { if (wrap.isConnected) wrap.innerHTML = ''; }
}

// ── Widget-label lookup ───────────────────────────────────────────────────
function wLabel(id) {
  return {
    'nu-luisteren':      '🎶 Nu luisteren',
    'recente-nummers':   '🕐 Recente nummers',
    'nieuwe-releases':   '💿 Nieuwe releases deze week',
    'download-voortgang':'⬇ Download-voortgang',
    'vandaag-cijfers':   '📊 Vandaag in cijfers',
    'aanbeveling':       '✨ Aanbeveling van de dag',
    'collectie-stats':   '📀 Collectie-stats',
  }[id] || id;
}

const DEFAULT_WIDGETS = [
  'nu-luisteren', 'recente-nummers', 'nieuwe-releases',
  'download-voortgang', 'vandaag-cijfers', 'aanbeveling', 'collectie-stats',
];

// Opmerkink: /api/recs cache wordt nu beheerd door cache.js module

// ── Dashboard hoofd-renderer ──────────────────────────────────────────────
export function loadDashboard() {
  let savedOrder   = null;
  let hiddenWidgets = [];
  try { savedOrder    = JSON.parse(localStorage.getItem('dashWidgetOrder')); }  catch {}
  try { hiddenWidgets = JSON.parse(localStorage.getItem('dashWidgetHidden')) || []; } catch {}

  const order   = (Array.isArray(savedOrder) && savedOrder.length) ? savedOrder : DEFAULT_WIDGETS;
  const visible = order.filter(w => DEFAULT_WIDGETS.includes(w) && !hiddenWidgets.includes(w));

  const checkboxes = DEFAULT_WIDGETS.map(w =>
    `<label class="dash-widget-label">
      <input type="checkbox" class="dash-widget-cb" data-widget="${esc(w)}"${hiddenWidgets.includes(w) ? '' : ' checked'}>
      ${esc(wLabel(w))}
    </label>`
  ).join('');

  const cards = visible.map(w =>
    `<div class="widget-card" id="widget-${esc(w)}" data-widget="${esc(w)}">
      <div class="widget-hdr"><span class="widget-title">${esc(wLabel(w))}</span></div>
      <div class="widget-body" id="wbody-${esc(w)}">
        <div class="loading" style="padding:12px 0"><div class="spinner"></div></div>
      </div>
    </div>`
  ).join('');

  const html = `
    <div class="dashboard-topbar">
      <span class="dashboard-heading">🎵 Nu</span>
      <button class="dash-customize-btn" id="dash-customize-btn">✦ Pas aan</button>
    </div>
    <div class="dash-customize-panel" id="dash-customize-panel" style="display:none">
      <div class="dash-customize-title">Widgets tonen/verbergen</div>
      <div class="dash-widget-checkboxes">${checkboxes}</div>
    </div>
    <div class="widget-grid" id="widget-grid">${cards}</div>`;

  // Schrijf direct naar contentEl — géén geneste startViewTransition.
  // Dit is veilig wanneer we al binnen een tab-klik view transition zitten,
  // én bij initieel laden. setContent zou een geneste transition starten die
  // de outer transition kapot maakt.
  state.sectionContainerEl = null;
  contentEl.innerHTML = html;

  requestAnimationFrame(() => {
    // Alle widgets parallel laden
    Promise.allSettled([
      dw_nuLuisteren(),
      dw_recenteNummers(),
      dw_nieuweReleases(),
      dw_downloadVoortgang(),
      dw_vandaagCijfers(),
      dw_aanbeveling(),
      dw_collectieStats(),
    ]);

    // "Pas aan" knop
    document.getElementById('dash-customize-btn')?.addEventListener('click', () => {
      const panel = document.getElementById('dash-customize-panel');
      if (panel) panel.style.display = panel.style.display === 'none' ? '' : 'none';
    });

    // Widget checkboxes → sla op en herlaad
    document.querySelectorAll('.dash-widget-cb').forEach(cb => {
      cb.addEventListener('change', () => {
        const hidden = [];
        document.querySelectorAll('.dash-widget-cb').forEach(c => {
          if (!c.checked) hidden.push(c.dataset.widget);
        });
        localStorage.setItem('dashWidgetHidden', JSON.stringify(hidden));
        loadDashboard();
      });
    });
  });
}

// ── Widget error helper ───────────────────────────────────────────────────
function dwErr(id, msg) {
  const el = document.getElementById('wbody-' + id);
  if (el) el.innerHTML = `<div class="widget-error">⚠ ${esc(msg || 'Niet beschikbaar')}</div>`;
}

// ── Widget 1: Nu luisteren ────────────────────────────────────────────────
export async function dw_nuLuisteren() {
  const el = document.getElementById('wbody-nu-luisteren');
  if (!el) return;
  // Guard: don't update widget if we've switched tabs
  if (state.activeView !== 'nu') return;
  const signal = state.tabAbort?.signal;
  try {
    // Haal /api/recent uit cache (TTL: 60 seconden)
    let lfmData = getCached('recent', 60 * 1000);
    const lfmIsCached = lfmData !== null;

    const [plexRes, lfmRes] = await Promise.allSettled([
      fetch('/api/plex/nowplaying', { signal }).then(r => r.json()),
      lfmIsCached ? Promise.resolve(lfmData) : fetchOnce('/api/recent'),
    ]);
    if (signal?.aborted) return;

    // Sla /api/recent op in cache als het een echte fetch was
    if (!lfmIsCached && lfmRes.status === 'fulfilled') {
      setCache('recent', lfmRes.value);
    }

    let html = '';

    if (plexRes.status === 'fulfilled' && plexRes.value?.playing) {
      const p = plexRes.value;
      const hasZone = !!getSelectedZone();
      const rk = p.ratingKey || '';
      html += `<div class="w-np-row">
        <div class="w-np-dot plex"></div>
        <div class="w-np-info">
          <div class="w-np-title">${esc(p.track)}</div>
          <div class="w-np-sub">${esc(p.artist)}${p.album ? ' · ' + esc(p.album) : ''}</div>
          <span class="badge plex" style="font-size:10px">▶ Plex</span>
        </div>
        ${hasZone ? `<div class="w-np-controls">
          <button class="plex-ctrl-btn" data-plex-action="prev" title="Vorige">⏮</button>
          <button class="plex-ctrl-btn" data-plex-action="pause" title="Pauze/Hervat">⏸</button>
          <button class="plex-ctrl-btn" data-plex-action="next" title="Volgende">⏭</button>
        </div>` : `<div class="w-np-controls">
          <button class="plex-ctrl-btn" data-plex-action="zone" title="Selecteer zone">🔊</button>
        </div>`}
      </div>`;
    }

    if (lfmRes.status === 'fulfilled') {
      const tracks = lfmRes.value.recenttracks?.track || [];
      const np = tracks.find(t => t['@attr']?.nowplaying);
      if (np) {
        const artist = np.artist?.['#text'] || '';
        const img    = getImg(np.image, 'medium');
        html += `<div class="w-np-row">
          <div class="w-np-dot lfm"></div>
          ${img ? `<img class="w-np-img" src="${esc(img)}" alt="${esc(np.name)} by ${esc(artist)}" loading="lazy" width="48" height="48">` : ''}
          <div class="w-np-info">
            <div class="w-np-title">${esc(np.name)}</div>
            <div class="w-np-sub artist-link" data-artist="${esc(artist)}">${esc(artist)}</div>
            <span class="badge" style="background:var(--red);color:#fff;font-size:10px">● Last.fm</span>
          </div>
        </div>`;
      }
    }

    el.innerHTML = html || '<div class="empty" style="font-size:12px;padding:8px 0">Niets aan het afspelen</div>';

    // Plex playback-control knoppen
    el.querySelectorAll('[data-plex-action]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const action = btn.dataset.plexAction;
        if      (action === 'pause') pauseZone();
        else if (action === 'next')  skipZone('next');
        else if (action === 'prev')  skipZone('prev');
        else if (action === 'zone') {
          const { toggleZonePicker } = await import('../components/plexRemote.js');
          toggleZonePicker();
        }
      });
    });
  } catch (e) { if (e.name === 'AbortError') return; dwErr('nu-luisteren', e.message); }
}

// ── Widget 2: Recente nummers ─────────────────────────────────────────────
async function dw_recenteNummers() {
  const el = document.getElementById('wbody-recente-nummers');
  if (!el) return;
  const signal = state.tabAbort?.signal;
  try {
    // Haal /api/recent uit cache (TTL: 60 seconden)
    let data = getCached('recent', 60 * 1000);
    if (!data) {
      // Gebruik fetchOnce voor deduplicatie (andere widgets kunnen dit ook ophalen)
      data = await fetchOnce('/api/recent');
      if (signal?.aborted) return;
      setCache('recent', data);
    }

    const tracks = (data.recenttracks?.track || [])
      .filter(t => !t['@attr']?.nowplaying)
      .slice(0, 8);

    if (!tracks.length) { el.innerHTML = '<div class="empty" style="font-size:12px">Geen recente nummers</div>'; return; }

    el.innerHTML = `<div class="w-track-list">${tracks.map(t => {
      const artist = t.artist?.['#text'] || '';
      const ago    = t.date?.uts ? timeAgo(parseInt(t.date.uts)) : '';
      return `<div class="w-track-row">
        <div class="w-track-info">
          <div class="w-track-title">${esc(t.name)}</div>
          <div class="w-track-artist artist-link" data-artist="${esc(artist)}">${esc(artist)}</div>
        </div>
        <span class="w-track-ago">${ago}</span>
      </div>`;
    }).join('')}</div>`;
  } catch (e) { if (e.name === 'AbortError') return; dwErr('recente-nummers', e.message); }
}

// ── Widget 3: Nieuwe releases deze week ──────────────────────────────────
async function dw_nieuweReleases() {
  const el = document.getElementById('wbody-nieuwe-releases');
  if (!el) return;
  const signal = state.tabAbort?.signal;
  try {
    let releases = state.lastReleases;
    if (!releases) {
      const data = await apiFetch('/api/releases', { signal });
      if (signal?.aborted) return;
      if (data.status === 'building') {
        el.innerHTML = '<div class="empty" style="font-size:12px">Releases worden geladen…</div>';
        return;
      }
      releases = data.releases || [];
    }

    const cutoff = Date.now() - 7 * 24 * 3600 * 1000;
    const recent = releases
      .filter(r => r.releaseDate && new Date(r.releaseDate).getTime() > cutoff)
      .sort((a, b) => (b.artistPlaycount || 0) - (a.artistPlaycount || 0))
      .slice(0, 3);

    if (!recent.length) { el.innerHTML = '<div class="empty" style="font-size:12px">Geen releases deze week</div>'; return; }

    el.innerHTML = `<div class="w-releases-list">${recent.map(r => {
      const img = r.image
        ? `<img class="w-rel-img" src="${esc(r.image)}" alt="${esc(r.album)} by ${esc(r.artist)}" loading="lazy" onerror="this.style.display='none'">`
        : `<div class="w-rel-ph" style="background:${gradientFor(r.album)}">${initials(r.album)}</div>`;
      return `<div class="w-rel-row">
        <div class="w-rel-cover">${img}</div>
        <div class="w-rel-info">
          <div class="w-rel-title">${esc(r.album)}</div>
          <div class="w-rel-artist artist-link" data-artist="${esc(r.artist)}">${esc(r.artist)}</div>
        </div>
        ${downloadBtn(r.artist, r.album, r.inPlex)}
      </div>`;
    }).join('')}</div>`;
  } catch (e) { if (e.name === 'AbortError') return; dwErr('nieuwe-releases', e.message); }
}

// ── Widget 4: Download-voortgang ──────────────────────────────────────────
export async function dw_downloadVoortgang() {
  const el = document.getElementById('wbody-download-voortgang');
  if (!el) return;
  if (!state.tidarrOk) { el.innerHTML = '<div class="widget-error">⚠ Tidarr offline</div>'; return; }
  const signal = state.tabAbort?.signal;
  try {
    const data  = await apiFetch('/api/tidarr/queue', { signal });
    if (signal?.aborted) return;
    const items = (data.items || state.tidarrQueueItems || [])
      .filter(i => i.status !== 'finished' && i.status !== 'error');
    renderDashboardQueue(el, items);
  } catch (e) { if (e.name === 'AbortError') return; dwErr('download-voortgang', 'Tidarr niet bereikbaar'); }
}

// ── Widget 5: Vandaag in cijfers ──────────────────────────────────────────
async function dw_vandaagCijfers() {
  const el = document.getElementById('wbody-vandaag-cijfers');
  if (!el) return;
  const signal = state.tabAbort?.signal;
  try {
    // Haal /api/recent uit cache (TTL: 60 seconden)
    let data = getCached('recent', 60 * 1000);
    if (!data) {
      // Gebruik fetchOnce voor deduplicatie (andere widgets kunnen dit ook ophalen)
      data = await fetchOnce('/api/recent');
      if (signal?.aborted) return;
      setCache('recent', data);
    }

    const tracks      = data.recenttracks?.track || [];
    const today       = new Date().toDateString();
    const todayTracks = tracks.filter(t =>
      t.date?.uts && new Date(parseInt(t.date.uts) * 1000).toDateString() === today
    );
    const uniqueArtists = new Set(todayTracks.map(t => t.artist?.['#text'])).size;

    const artistCount = {};
    for (const t of todayTracks) {
      const a = t.artist?.['#text'] || '';
      artistCount[a] = (artistCount[a] || 0) + 1;
    }
    const topEntry = Object.entries(artistCount).sort((a, b) => b[1] - a[1])[0];

    el.innerHTML = `<div class="w-stats-grid">
      <div class="w-stat-block">
        <div class="w-stat-val">${todayTracks.length}</div>
        <div class="w-stat-lbl">scrobbles</div>
      </div>
      <div class="w-stat-block">
        <div class="w-stat-val">${uniqueArtists}</div>
        <div class="w-stat-lbl">artiesten</div>
      </div>
      ${topEntry ? `<div class="w-stat-block w-stat-wide">
        <div class="w-stat-val" style="font-size:13px;line-height:1.3">${esc(topEntry[0])}</div>
        <div class="w-stat-lbl">meest gespeeld (${topEntry[1]}×)</div>
      </div>` : ''}
    </div>`;
  } catch (e) { if (e.name === 'AbortError') return; dwErr('vandaag-cijfers', e.message); }
}

// ── Widget 6: Aanbeveling van de dag ─────────────────────────────────────
async function dw_aanbeveling() {
  const el = document.getElementById('wbody-aanbeveling');
  if (!el) return;
  const signal = state.tabAbort?.signal;
  try {
    // Haal /api/recs uit cache (TTL: 5 minuten)
    let data = getCached('recs', 5 * 60 * 1000);
    if (!data) {
      // Gebruik fetchOnce voor deduplicatie (Ontdek-tab kan dit ook ophalen)
      data = await fetchOnce('/api/recs');
      if (signal?.aborted) return;
      setCache('recs', data);
    }

    const recsCache = data.recommendations || [];
    state.lastRecs = data;  // Bewaar in state voor persistentie

    if (!recsCache.length) { el.innerHTML = '<div class="empty" style="font-size:12px">Geen aanbevelingen</div>'; return; }

    const today = Math.floor(Date.now() / 86_400_000);
    const pick = recsCache[today % recsCache.length];

    // Parallel fetch artist info with timeout fallback
    let info = null;
    try {
      const infoRes = await Promise.race([
        apiFetch(`/api/artist/${encodeURIComponent(pick.name)}/info`, { signal }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000))
      ]);
      info = infoRes;
    } catch {}

    const img  = info?.image ? proxyImg(info.image, 80) || info.image : null;
    const albs = (info?.albums || []).slice(0, 3);

    el.innerHTML = `<div class="w-rec-wrap">
      <div class="w-rec-top">
        ${img
          ? `<img class="w-rec-img" src="${esc(img)}" alt="${esc(pick.name)}" loading="lazy">`
          : `<div class="w-rec-ph" style="background:${gradientFor(pick.name)}">${initials(pick.name)}</div>`}
        <div class="w-rec-info">
          <div class="w-rec-name artist-link" data-artist="${esc(pick.name)}">${esc(pick.name)}</div>
          <div class="w-rec-reason">Vergelijkbaar met ${esc(pick.reason)}</div>
          ${plexBadge(pick.inPlex)}
          ${bookmarkBtn('artist', pick.name, '', info?.image || '')}
        </div>
      </div>
      ${albs.length
        ? `<div class="w-rec-albums">${albs.map(a => `<span class="w-rec-album">${esc(a.name)}</span>`).join('')}</div>`
        : ''}
    </div>`;
  } catch (e) { if (e.name === 'AbortError') return; dwErr('aanbeveling', e.message); }
}

// ── Widget 7: Collectie-stats ─────────────────────────────────────────────
async function dw_collectieStats() {
  const el = document.getElementById('wbody-collectie-stats');
  if (!el) return;
  const signal = state.tabAbort?.signal;
  try {
    const data = await apiFetch('/api/plex/status', { signal });
    if (signal?.aborted) return;
    if (!data.connected) { el.innerHTML = '<div class="empty" style="font-size:12px">Plex offline</div>'; return; }

    let totalMissing = 0;
    if (state.lastGaps?.artists) {
      totalMissing = state.lastGaps.artists.reduce((sum, g) => sum + (g.missingCount || 0), 0);
    }

    el.innerHTML = `<div class="w-stats-grid">
      <div class="w-stat-block">
        <div class="w-stat-val">${fmt(data.artists || 0)}</div>
        <div class="w-stat-lbl">artiesten</div>
      </div>
      <div class="w-stat-block">
        <div class="w-stat-val">${fmt(data.albums || 0)}</div>
        <div class="w-stat-lbl">albums</div>
      </div>
      ${totalMissing ? `<div class="w-stat-block">
        <div class="w-stat-val">${totalMissing}</div>
        <div class="w-stat-lbl">ontbreekt</div>
      </div>` : ''}
    </div>`;
  } catch (e) { if (e.name === 'AbortError') return; dwErr('collectie-stats', e.message); }
}

// ── Standalone recente nummers (gebruikt door events.js sub-tab routing) ──
export async function loadRecent() {
  const signal = state.tabAbort?.signal;
  try {
    // Haal /api/recent uit cache (TTL: 60 seconden)
    let data = getCached('recent', 60 * 1000);
    if (!data) {
      data = await apiFetch('/api/recent', { signal });
      if (signal?.aborted) return;
      setCache('recent', data);
    }
    const tracks = data.recenttracks?.track || [];
    if (!tracks.length) { setContent('<div class="empty">Geen recente nummers.</div>'); return; }
    let html = '<div class="card-list">';
    for (const t of tracks) {
      const isNow  = t['@attr']?.nowplaying;
      const when   = t.date?.uts ? timeAgo(parseInt(t.date.uts)) : '';
      const art    = t.artist?.['#text'] || '';
      const img    = getImg(t.image);
      const imgEl  = img
        ? `<img class="card-img" src="${esc(img)}" alt="${esc(t.name)} by ${esc(art)}" loading="lazy" width="56" height="56" onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'"><div class="card-ph" style="display:none">♪</div>`
        : `<div class="card-ph">♪</div>`;
      if (isNow) {
        html += `<div class="now-playing">${imgEl}<div class="np-dot"></div>
          <span class="np-label">NU</span>
          <div class="card-info"><div class="card-title">${esc(t.name)}</div>
          <div class="card-sub artist-link" data-artist="${esc(art)}">${esc(art)}</div></div></div>`;
      } else {
        html += `<div class="card">${imgEl}<div class="card-info">
          <div class="card-title">${esc(t.name)}</div>
          <div class="card-sub artist-link" data-artist="${esc(art)}">${esc(art)}</div>
          </div><div class="card-meta">${when}</div>
          <button class="play-btn" data-artist="${esc(art)}" data-track="${esc(t.name)}" title="Preview afspelen">▶</button>
          <div class="play-bar"><div class="play-bar-fill"></div></div></div>`;
      }
    }
    setContent(html + '</div>');
  } catch (e) { if (e.name === 'AbortError') return; setContent(`<div class="error-box">⚠️ ${esc(e.message)}</div>`); }
}

// ── Composiet loader (wordt aangeroepen vanuit events.js tab-routing) ─────
export function loadNu() {
  state.activeView = 'nu';
  hideTidarrUI();
  stopTidarrQueuePolling();

  // Stop eventuele vorige polling
  clearDashboardPolling();

  loadDashboard();

  // Start polling AFTER initial render completes
  // Wait a moment to let widgets load before starting the polling interval
  setTimeout(() => {
    // Only start polling if still on Nu tab
    if (state.activeView !== 'nu') return;

    // Poll de "Nu luisteren" widget elke 30s zolang Nu-tab actief is
    _dashPoller = setInterval(() => {
      if (state.activeView !== 'nu') {
        clearDashboardPolling();
        return;
      }
      dw_nuLuisteren();
    }, 30_000);
  }, 500);
}
