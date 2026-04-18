// ── Artiest detail-panel ──────────────────────────────────────────────────
import { state } from '../state.js';
import { apiFetch } from '../api.js';
import {
  esc, initials, gradientFor, sanitizeArtistName,
  countryFlag, tagsHtml, bookmarkBtn, downloadBtn
} from '../helpers.js';

export function openArtistPanel(name) {
  const overlay     = document.getElementById('panel-overlay');
  const panelContent = document.getElementById('panel-content');
  const sanitized   = sanitizeArtistName(name);

  const doOpen = () => {
    panelContent.innerHTML = `<div style="height:260px;background:var(--surface2)"></div>
      <div class="panel-body"><div class="loading" style="padding:2rem 0"><div class="spinner"></div>Laden...</div></div>`;
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  if (document.startViewTransition) {
    document.startViewTransition(doOpen).finished.catch(() => {});
  } else {
    doOpen();
  }

  Promise.allSettled([
    apiFetch(`/api/artist/${encodeURIComponent(name)}/info`),
    apiFetch(`/api/artist/${encodeURIComponent(name)}/similar`)
  ]).then(([infoR, simR]) => {
    const info    = infoR.status === 'fulfilled' ? infoR.value : {};
    const similar = simR.status === 'fulfilled' ? (simR.value.similar || []) : [];

    const photoHtml = info.image
      ? `<img src="${esc(info.image)}" alt="" style="width:100%;height:100%;object-fit:cover;display:block"
           onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
         <div class="panel-photo-ph" style="background:${gradientFor(name)};display:none">${initials(name)}</div>`
      : `<div class="panel-photo-ph" style="background:${gradientFor(name)}">${initials(name)}</div>`;

    const meta = [
      info.country ? countryFlag(info.country) + ' ' + info.country : null,
      info.startYear ? `Actief vanaf ${info.startYear}` : null,
      state.plexOk && info.inPlex !== undefined
        ? (info.inPlex ? '▶ In Plex' : '✦ Nieuw voor jou') : null
    ].filter(Boolean).join(' · ');

    let albumsHtml = '';
    if (info.albums?.length) {
      albumsHtml = `<div class="panel-section">Albums</div><div class="panel-albums">`;
      for (const a of info.albums) {
        const imgEl = a.image
          ? `<img class="panel-album-img" src="${esc(a.image)}" alt="" loading="lazy" onerror="this.onerror=null;this.remove()">`
          : `<div class="panel-album-ph">♪</div>`;
        const plexMark = state.plexOk && a.inPlex
          ? `<span class="badge plex" style="font-size:9px">▶</span>` : '';
        albumsHtml += `<div class="panel-album-row">${imgEl}
          <span class="panel-album-name">${esc(a.name)}</span>${plexMark}${downloadBtn(name, a.name, a.inPlex)}</div>`;
      }
      albumsHtml += `</div>`;
    }

    let simHtml = '';
    if (similar.length) {
      simHtml = `<div class="panel-section">Vergelijkbare artiesten</div><div class="panel-similar">`;
      for (const s of similar)
        simHtml += `<button class="panel-similar-chip artist-link" data-artist="${esc(s.name)}">${esc(s.name)}</button>`;
      simHtml += `</div>`;
    }

    panelContent.innerHTML = `
      <div class="panel-photo-wrap" style="view-transition-name: artist-${sanitized}">${photoHtml}</div>
      <div class="panel-body">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px">
          <div class="panel-artist-name">${esc(name)}</div>
          ${bookmarkBtn('artist', name, '', info.image || '')}
        </div>
        ${meta ? `<div class="panel-meta">${esc(meta)}</div>` : ''}
        ${tagsHtml(info.tags, 6)}
        ${albumsHtml}
        ${simHtml}
      </div>`;
  });
}

export function closeArtistPanel() {
  document.getElementById('panel-overlay').classList.remove('open');
  document.body.style.overflow = '';
}
