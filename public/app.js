// ── State ─────────────────────────────────────────────────────────────────
let currentTab    = 'recent';
let currentPeriod = '7day';
let recsFilter    = 'all';
let discFilter    = 'all';
let gapsSort      = 'missing';
let plexOk        = false;
let lastDiscover  = null;
let lastGaps      = null;

// ── Helpers ───────────────────────────────────────────────────────────────
const getImg = (imgs, size = 'medium') => {
  if (!imgs) return null;
  const i = imgs.find(x => x.size === size);
  return (i && i['#text'] && !i['#text'].includes('2a96cbd8b46e442fc41c2b86b821562f')) ? i['#text'] : null;
};
const initials = n => n.split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);
const fmt  = n => parseInt(n).toLocaleString('nl-NL');
const esc  = s => String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
const periodLabel = p => ({ '7day':'week','1month':'maand','3month':'3 maanden','12month':'jaar','overall':'alles' }[p] || p);

function timeAgo(ts) {
  const s = Math.floor(Date.now()/1000) - ts;
  if (s < 120)   return 'zojuist';
  if (s < 3600)  return `${Math.floor(s/60)}m`;
  if (s < 86400) return `${Math.floor(s/3600)}u`;
  return `${Math.floor(s/86400)}d`;
}

function gradientFor(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffff;
  const hue = h % 360;
  return `linear-gradient(135deg,hsl(${hue},45%,20%),hsl(${(hue+45)%360},55%,14%))`;
}

function countryFlag(code) {
  if (!code || code.length !== 2) return '';
  return [...code.toUpperCase()].map(c => String.fromCodePoint(c.charCodeAt(0) + 127397)).join('');
}

function tagsHtml(tags, max = 4) {
  if (!tags?.length) return '';
  return `<div class="tags" style="margin-top:5px">${tags.slice(0, max).map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>`;
}

function plexBadge(inPlex) {
  if (!plexOk) return '';
  return inPlex
    ? `<span class="badge plex">▶ In Plex</span>`
    : `<span class="badge new">✦ Nieuw</span>`;
}

async function apiFetch(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Serverfout ${res.status}`);
  return res.json();
}
const setContent  = html => { document.getElementById('content').innerHTML = html; };
const showLoading = msg  => setContent(`<div class="loading"><div class="spinner"></div>${msg || 'Laden...'}</div>`);
const showError   = msg  => setContent(`<div class="error-box">⚠️ ${esc(msg)}</div>`);
const trackImg    = imgs => {
  const src = getImg(imgs);
  return src ? `<img class="card-img" src="${src}" alt="" loading="lazy">` : `<div class="card-ph">♪</div>`;
};

// ── Album card ─────────────────────────────────────────────────────────────
function albumCard(album, showBadge = true, small = false) {
  const owned = album.inPlex;
  const bg = gradientFor(album.title || '');
  const year = album.year || '—';
  const grid = small ? 'gaps-album-grid' : '';
  return `
    <div class="album-card ${owned ? 'owned' : 'missing'}" title="${esc(album.title)}${year !== '—' ? ' ('+year+')' : ''}">
      <div class="album-cover" style="background:${bg}">
        <div class="album-cover-ph">${initials(album.title || '?')}</div>
        <img src="${esc(album.coverUrl || '')}" alt="" loading="lazy"
          style="opacity:0;transition:opacity 0.35s;position:relative;z-index:1"
          onload="this.style.opacity='1'" onerror="this.remove()">
      </div>
      <div class="album-info">
        <div class="album-title">${esc(album.title)}</div>
        <div class="album-year">${year}</div>
        ${showBadge ? `<span class="album-status ${owned ? 'own' : 'miss'}">${owned ? '▶ In Plex' : '✦ Ontbreekt'}</span>` : ''}
      </div>
    </div>`;
}

// ── Plex status ────────────────────────────────────────────────────────────
async function loadPlexStatus() {
  try {
    const d = await fetch('/api/plex/status').then(r => r.json());
    const pill = document.getElementById('plex-pill');
    const text = document.getElementById('plex-pill-text');
    if (d.connected) {
      plexOk = true;
      pill.className = 'plex-pill on';
      text.textContent = `Plex · ${fmt(d.artists)} artiesten`;
    } else {
      pill.className = 'plex-pill off';
      text.textContent = 'Plex offline';
    }
  } catch (e) { document.getElementById('plex-pill-text').textContent = 'Plex offline'; }
}

async function loadPlexNP() {
  const wrap = document.getElementById('plex-np-wrap');
  try {
    const d = await fetch('/api/plex/nowplaying').then(r => r.json());
    wrap.innerHTML = d.playing
      ? `<div class="plex-np"><div class="plex-np-dot"></div><span class="plex-np-label">PLEX NU</span>
           <div class="card-info"><div class="card-title">${esc(d.track)}</div>
           <div class="card-sub">${esc(d.artist)}${d.album ? ' · '+esc(d.album) : ''}</div></div></div>`
      : '';
  } catch (e) { wrap.innerHTML = ''; }
}

// ── Recent ─────────────────────────────────────────────────────────────────
async function loadRecent() {
  showLoading(); loadPlexNP();
  try {
    const d = await apiFetch('/api/recent');
    const tracks = d.recenttracks?.track || [];
    if (!tracks.length) { setContent('<div class="empty">Geen recente nummers.</div>'); return; }
    let html = '<div class="card-list">';
    for (const t of tracks) {
      const isNow = t['@attr']?.nowplaying;
      const when  = t.date?.uts ? timeAgo(parseInt(t.date.uts)) : '';
      const art   = t.artist?.['#text'] || '';
      const artwork = trackImg(t.image);
      if (isNow) {
        html += `<div class="now-playing">${artwork}<div class="np-dot"></div><span class="np-label">NU</span>
          <div class="card-info"><div class="card-title">${esc(t.name)}</div><div class="card-sub">${esc(art)}</div></div></div>`;
      } else {
        html += `<div class="card">${artwork}<div class="card-info">
          <div class="card-title">${esc(t.name)}</div><div class="card-sub">${esc(art)}</div>
          </div><div class="card-meta">${when}</div></div>`;
      }
    }
    setContent(html + '</div>');
  } catch (e) { showError(e.message); }
}

// ── Top artiesten ──────────────────────────────────────────────────────────
async function loadTopArtists(period) {
  showLoading();
  try {
    const d = await apiFetch(`/api/topartists?period=${period}`);
    const artists = d.topartists?.artist || [];
    if (!artists.length) { setContent('<div class="empty">Geen data.</div>'); return; }
    const max = parseInt(artists[0]?.playcount || 1);
    let html = `<div class="section-title">Top artiesten · ${periodLabel(period)}</div><div class="artist-grid">`;
    for (let i = 0; i < artists.length; i++) {
      const a = artists[i];
      const pct = Math.round(parseInt(a.playcount) / max * 100);
      const lfmImg = getImg(a.image, 'large') || getImg(a.image);
      const photoHtml = lfmImg
        ? `<img src="${lfmImg}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
          + `<div class="ag-photo-ph" style="display:none;background:${gradientFor(a.name)}">${initials(a.name)}</div>`
        : `<div class="ag-photo-ph" style="background:${gradientFor(a.name)}">${initials(a.name)}</div>`;
      html += `<div class="ag-card"><div class="ag-photo" id="agp-${i}">${photoHtml}</div>
        <div class="ag-info"><div class="ag-name">${esc(a.name)}</div>
        <div class="card-bar"><div class="card-bar-fill" style="width:${pct}%"></div></div>
        <div class="ag-plays">${fmt(a.playcount)} plays</div></div></div>`;
    }
    setContent(html + '</div>');
    artists.forEach(async (a, i) => {
      try {
        const info = await apiFetch(`/api/artist/${encodeURIComponent(a.name)}/info`);
        if (info.image) {
          const el = document.getElementById(`agp-${i}`);
          if (el) el.innerHTML = `<img src="${info.image}" alt="" loading="lazy" onerror="this.style.display='none'">`;
        }
      } catch (e) {}
    });
  } catch (e) { showError(e.message); }
}

// ── Top nummers ────────────────────────────────────────────────────────────
async function loadTopTracks(period) {
  showLoading();
  try {
    const d = await apiFetch(`/api/toptracks?period=${period}`);
    const tracks = d.toptracks?.track || [];
    if (!tracks.length) { setContent('<div class="empty">Geen data.</div>'); return; }
    const max = parseInt(tracks[0]?.playcount || 1);
    let html = `<div class="section-title">Top nummers · ${periodLabel(period)}</div><div class="card-list">`;
    for (const t of tracks) {
      const pct = Math.round(parseInt(t.playcount) / max * 100);
      html += `<div class="card">${trackImg(t.image)}<div class="card-info">
        <div class="card-title">${esc(t.name)}</div><div class="card-sub">${esc(t.artist?.name || '')}</div>
        <div class="card-bar"><div class="card-bar-fill" style="width:${pct}%"></div></div>
        </div><div class="card-meta">${fmt(t.playcount)}×</div></div>`;
    }
    setContent(html + '</div>');
  } catch (e) { showError(e.message); }
}

// ── Aanbevelingen (snelle versie + Plex + MBZ tags) ───────────────────────
async function loadRecs() {
  showLoading();
  try {
    const d = await apiFetch('/api/recs');
    const recs = d.recommendations || [];
    plexOk = d.plexConnected || plexOk;
    if (d.plexConnected && d.plexArtistCount) {
      document.getElementById('plex-pill').className = 'plex-pill on';
      document.getElementById('plex-pill-text').textContent = `Plex · ${fmt(d.plexArtistCount)} artiesten`;
    }
    if (!recs.length) { setContent('<div class="empty">Geen aanbevelingen gevonden.</div>'); return; }

    const newC  = recs.filter(r => !r.inPlex).length;
    const plexC = recs.filter(r =>  r.inPlex).length;
    let html = `<div class="section-title">Gebaseerd op jouw smaak: ${(d.basedOn||[]).slice(0,3).join(', ')}
      ${plexOk ? ` &nbsp;·&nbsp; <span style="color:var(--new)">${newC} nieuw</span> · <span style="color:var(--plex)">${plexC} in Plex</span>` : ''}
      </div><div class="rec-grid">`;

    for (let i = 0; i < recs.length; i++) {
      const r = recs[i];
      const pct = Math.round(r.match * 100);
      html += `
        <div class="rec-card" data-inplex="${r.inPlex}" id="rc-${i}">
          <div class="rec-photo" id="rph-${i}">
            <div class="rec-photo-ph" style="background:${gradientFor(r.name)}">${initials(r.name)}</div>
          </div>
          <div class="rec-body">
            <div class="rec-header">
              <div class="rec-title-row"><span class="rec-name">${esc(r.name)}</span>${plexBadge(r.inPlex)}</div>
              <span class="rec-match">${pct}%</span>
            </div>
            <div class="rec-reason">Vergelijkbaar met ${esc(r.reason)}</div>
            <div id="rtags-${i}"></div>
            <div id="ralb-${i}"><div class="rec-loading">Albums laden…</div></div>
          </div>
        </div>`;
    }
    setContent(html + '</div>');
    applyRecsFilter();

    recs.forEach(async (r, i) => {
      try {
        const info = await apiFetch(`/api/artist/${encodeURIComponent(r.name)}/info`);

        const ph = document.getElementById(`rph-${i}`);
        if (ph && info.image) ph.innerHTML = `<img src="${info.image}" alt="" loading="lazy"
          onerror="this.parentElement.innerHTML='<div class=\\'rec-photo-ph\\' style=\\'background:${gradientFor(r.name)}\\'>${initials(r.name)}</div>'">`;

        const tagsEl = document.getElementById(`rtags-${i}`);
        if (tagsEl) tagsEl.innerHTML = tagsHtml(info.tags, 3) + `<div style="height:6px"></div>`;

        const albEl = document.getElementById(`ralb-${i}`);
        if (albEl) {
          const albums = (info.albums || []).slice(0, 4);
          if (albums.length) {
            let ah = '<div class="rec-albums-label">Bekende albums</div><div class="rec-albums-list">';
            for (const a of albums) {
              const imgEl = a.image
                ? `<img class="rec-album-img" src="${a.image}" alt="" loading="lazy">`
                : `<div class="rec-album-ph">♪</div>`;
              const plexMark = plexOk && a.inPlex ? `<span class="rec-album-plex">▶</span>` : '';
              ah += `<div class="rec-album-row">${imgEl}<span class="rec-album-name">${esc(a.name)}</span>${plexMark}</div>`;
            }
            albEl.innerHTML = ah + '</div>';
          } else { albEl.innerHTML = ''; }
        }
      } catch (e) {
        const albEl = document.getElementById(`ralb-${i}`);
        if (albEl) albEl.innerHTML = '';
      }
    });
  } catch (e) { showError(e.message); }
}

function applyRecsFilter() {
  document.querySelectorAll('.rec-card[data-inplex]').forEach(card => {
    const inPlex = card.dataset.inplex === 'true';
    let show = true;
    if (recsFilter === 'new')  show = !inPlex;
    if (recsFilter === 'plex') show = inPlex;
    card.classList.toggle('hidden', !show);
  });
}

// ── Discover (deep: MBZ + album grid) ─────────────────────────────────────
async function loadDiscover() {
  showLoading('Ontdekkingen ophalen...');
  try {
    const d = await apiFetch('/api/discover');
    if (d.status === 'building') {
      setContent(`<div class="loading"><div class="spinner"></div>
        <div>${esc(d.message)}</div>
        <div class="build-hint">Pagina ververst automatisch over 20 seconden</div></div>`);
      setTimeout(() => { if (currentTab === 'discover') loadDiscover(); }, 20_000);
      return;
    }
    lastDiscover = d;
    if (d.plexConnected) { plexOk = true; }
    renderDiscover();
  } catch (e) { showError(e.message); }
}

function renderDiscover() {
  if (!lastDiscover) return;
  const { artists, basedOn } = lastDiscover;
  if (!artists?.length) { setContent('<div class="empty">Geen ontdekkingen gevonden.</div>'); return; }

  let filtered = artists;
  if (discFilter === 'new')     filtered = artists.filter(a => !a.inPlex);
  if (discFilter === 'partial') filtered = artists.filter(a => a.inPlex && a.missingCount > 0);

  if (!filtered.length) { setContent('<div class="empty">Geen artiesten voor dit filter.</div>'); return; }

  const totalMissing = filtered.reduce((s, a) => s + a.missingCount, 0);
  let html = `<div class="section-title">Gebaseerd op: ${(basedOn||[]).slice(0,3).join(', ')}
    &nbsp;·&nbsp; <span style="color:var(--new)">${totalMissing} albums te ontdekken</span></div>`;

  for (const a of filtered) {
    const matchPct = Math.round(a.match * 100);
    const meta = [
      countryFlag(a.country),
      a.country,
      a.startYear ? `Actief vanaf ${a.startYear}` : null,
      a.totalAlbums ? `${a.totalAlbums} studio-albums` : null
    ].filter(Boolean).join(' · ');

    const photo = a.image
      ? `<img class="discover-photo" src="${esc(a.image)}" alt="" loading="lazy"
           onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
         <div class="discover-photo-ph" style="display:none;background:${gradientFor(a.name)}">${initials(a.name)}</div>`
      : `<div class="discover-photo-ph" style="background:${gradientFor(a.name)}">${initials(a.name)}</div>`;

    html += `
      <div class="discover-section">
        <div class="discover-artist-card">
          ${photo}
          <div class="discover-info">
            <div class="discover-name">${esc(a.name)} ${plexBadge(a.inPlex)}</div>
            <div class="discover-meta">${esc(meta)}</div>
            ${tagsHtml(a.tags, 5)}
            <div class="discover-reason" style="margin-top:6px">Vergelijkbaar met <strong>${esc(a.reason)}</strong></div>
            ${a.missingCount > 0
              ? `<div class="discover-missing">✦ ${a.missingCount} ${a.missingCount === 1 ? 'album' : 'albums'} te ontdekken</div>`
              : `<div style="font-size:12px;color:var(--plex);margin-top:4px">▶ Volledig in Plex</div>`}
          </div>
          <span class="discover-match">${matchPct}%</span>
        </div>`;

    if (a.albums?.length) {
      html += `<div class="album-grid">`;
      for (const alb of a.albums) html += albumCard(alb, true);
      html += `</div>`;
    } else {
      html += `<div style="font-size:13px;color:var(--muted2);padding:8px 0">Albums nog niet beschikbaar. Vernieuw straks.</div>`;
    }
    html += `</div>`;
  }

  setContent(html);
}

// ── Collection Gaps ────────────────────────────────────────────────────────
async function loadGaps() {
  showLoading('Collectiegaten zoeken...');
  try {
    const d = await apiFetch('/api/gaps');
    if (d.status === 'building') {
      setContent(`<div class="loading"><div class="spinner"></div>
        <div>${esc(d.message)}</div>
        <div class="build-hint">Pagina ververst automatisch over 20 seconden</div></div>`);
      setTimeout(() => { if (currentTab === 'gaps') loadGaps(); }, 20_000);
      return;
    }
    lastGaps = d;
    renderGaps();
  } catch (e) { showError(e.message); }
}

function renderGaps() {
  if (!lastGaps) return;
  let artists = [...(lastGaps.artists || [])];
  if (!artists.length) {
    setContent('<div class="empty">Geen collectiegaten gevonden — je hebt alles al! 🎉</div>');
    // Update badge
    document.getElementById('badge-gaps').textContent = '0';
    return;
  }

  if (gapsSort === 'missing') artists.sort((a, b) => b.missingAlbums.length - a.missingAlbums.length);
  if (gapsSort === 'name')    artists.sort((a, b) => a.name.localeCompare(b.name));

  const totalMissing = artists.reduce((s, a) => s + a.missingAlbums.length, 0);
  document.getElementById('badge-gaps').textContent = totalMissing;

  let html = `<div class="section-title">${totalMissing} ontbrekende albums bij ${artists.length} artiesten die je al hebt</div>`;

  for (const a of artists) {
    const pct = Math.round(a.ownedCount / a.totalCount * 100);
    const meta = [countryFlag(a.country), a.country, a.startYear].filter(Boolean).join(' · ');
    const photo = a.image
      ? `<img class="gaps-photo" src="${esc(a.image)}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
         <div class="gaps-photo-ph" style="display:none;background:${gradientFor(a.name)}">${initials(a.name)}</div>`
      : `<div class="gaps-photo-ph" style="background:${gradientFor(a.name)}">${initials(a.name)}</div>`;

    html += `
      <div class="gaps-block">
        <div class="gaps-header">
          ${photo}
          <div style="flex:1;min-width:0">
            <div class="gaps-artist-name">${esc(a.name)}</div>
            <div class="gaps-artist-meta">${esc(meta)}</div>
            ${tagsHtml(a.tags, 3)}
            <div style="height:8px"></div>
            <div class="comp-bar"><div class="comp-fill" style="width:${pct}%"></div></div>
            <div class="comp-text">${a.ownedCount} van ${a.totalCount} albums in Plex
              &nbsp;·&nbsp; <span style="color:var(--new);font-weight:600">${a.missingAlbums.length} ontbreken</span></div>
          </div>
        </div>
        <div class="gaps-sub">Ontbrekende albums</div>
        <div class="gaps-album-grid">`;

    for (const alb of a.missingAlbums) html += albumCard(alb, false);
    html += `</div>`;

    // Show owned albums collapsed
    if (a.allAlbums?.filter(x => x.inPlex).length > 0) {
      html += `<details style="margin-top:12px">
        <summary style="font-size:11px;color:var(--muted2);cursor:pointer;user-select:none">
          ▸ ${a.ownedCount} albums die je al hebt
        </summary>
        <div class="gaps-album-grid" style="margin-top:10px">
          ${a.allAlbums.filter(x => x.inPlex).map(alb => albumCard(alb, false)).join('')}
        </div>
      </details>`;
    }

    html += `</div>`;
  }
  setContent(html);
}

// ── Geliefd ────────────────────────────────────────────────────────────────
async function loadLoved() {
  showLoading();
  try {
    const d = await apiFetch('/api/loved');
    const tracks = d.lovedtracks?.track || [];
    if (!tracks.length) { setContent('<div class="empty">Geen geliefde nummers.</div>'); return; }
    let html = '<div class="section-title">Geliefde nummers</div><div class="card-list">';
    for (const t of tracks) {
      const when = t.date?.uts ? timeAgo(parseInt(t.date.uts)) : '';
      html += `<div class="card">${trackImg(t.image)}<div class="card-info">
        <div class="card-title">${esc(t.name)}</div><div class="card-sub">${esc(t.artist?.name||'')}</div>
        </div><div class="card-meta" style="color:var(--red)">♥ ${when}</div></div>`;
    }
    setContent(html + '</div>');
  } catch (e) { showError(e.message); }
}

// ── Navigatie ──────────────────────────────────────────────────────────────
const tabLoaders = {
  discover:   () => loadDiscover(),
  gaps:       () => loadGaps(),
  recent:     () => loadRecent(),
  recs:       () => loadRecs(),
  topartists: () => loadTopArtists(currentPeriod),
  toptracks:  () => loadTopTracks(currentPeriod),
  loved:      () => loadLoved()
};

document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    currentTab = btn.dataset.tab;
    document.getElementById('tb-period').classList.toggle('visible', ['topartists','toptracks'].includes(currentTab));
    document.getElementById('tb-recs').classList.toggle('visible', currentTab === 'recs');
    document.getElementById('tb-discover').classList.toggle('visible', currentTab === 'discover');
    document.getElementById('tb-gaps').classList.toggle('visible', currentTab === 'gaps');
    tabLoaders[currentTab]?.();
  });
});

document.querySelectorAll('[data-period]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-period]').forEach(b => b.classList.remove('sel-def'));
    btn.classList.add('sel-def');
    currentPeriod = btn.dataset.period;
    tabLoaders[currentTab]?.();
  });
});

document.querySelectorAll('[data-filter]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('sel-def','sel-new','sel-plex'));
    recsFilter = btn.dataset.filter;
    btn.classList.add(recsFilter === 'all' ? 'sel-def' : recsFilter === 'new' ? 'sel-new' : 'sel-plex');
    applyRecsFilter();
  });
});

document.querySelectorAll('[data-dfilter]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-dfilter]').forEach(b => b.classList.remove('sel-def','sel-new','sel-miss'));
    discFilter = btn.dataset.dfilter;
    btn.classList.add(discFilter === 'all' ? 'sel-def' : discFilter === 'new' ? 'sel-new' : 'sel-miss');
    renderDiscover();
  });
});

document.querySelectorAll('[data-gsort]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-gsort]').forEach(b => b.classList.remove('sel-def'));
    btn.classList.add('sel-def');
    gapsSort = btn.dataset.gsort;
    renderGaps();
  });
});

document.getElementById('btn-refresh-discover').addEventListener('click', async () => {
  lastDiscover = null;
  await fetch('/api/discover/refresh', { method: 'POST' });
  loadDiscover();
});

document.getElementById('btn-refresh-gaps').addEventListener('click', async () => {
  lastGaps = null;
  await fetch('/api/gaps/refresh', { method: 'POST' });
  loadGaps();
});

// ── Gebruikersprofiel ──────────────────────────────────────────────────────
async function loadUser() {
  try {
    const d = await apiFetch('/api/user');
    const u = d.user;
    const src = getImg(u.image, 'large');
    const av = src
      ? `<img class="user-avatar" src="${src}" alt="">`
      : `<div class="user-avatar-ph">${(u.name||'U')[0].toUpperCase()}</div>`;
    const year = new Date(parseInt(u.registered?.unixtime) * 1000).getFullYear();
    document.getElementById('user-wrap').innerHTML = `
      <div class="user-card">${av}
        <div><div class="user-name">${esc(u.realname || u.name)}</div>
        <div class="user-sub">${fmt(u.playcount)} scrobbles · lid sinds ${year}</div></div>
      </div>`;
  } catch (e) {}
}

// ── Init ───────────────────────────────────────────────────────────────────
loadPlexStatus();
loadPlexNP();
loadUser();
loadRecent();
setInterval(loadPlexNP, 30_000);
