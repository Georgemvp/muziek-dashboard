// ── Artiest detail-panel ──────────────────────────────────────────────────
import { state } from '../state.js';
import { apiFetch } from '../api.js';
import {
  esc, initials, gradientFor, sanitizeArtistName,
  countryFlag, tagsHtml, bookmarkBtn, downloadBtn, proxyImg
} from '../helpers.js';
import { playOnZone } from './plexRemote.js';

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

    const panelImgSrc = proxyImg(info.image, 400) || info.image;
    const photoHtml = panelImgSrc
      ? `<img src="${esc(panelImgSrc)}" alt="${esc(name)}" style="width:100%;height:100%;object-fit:cover;display:block"
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
        const panelAlbImgSrc = proxyImg(a.image, 48) || a.image;
        const imgEl = panelAlbImgSrc
          ? `<img class="panel-album-img" src="${esc(panelAlbImgSrc)}" alt="${esc(a.name)}" loading="lazy" onerror="this.onerror=null;this.remove()">`
          : `<div class="panel-album-ph">♪</div>`;
        const plexMark = state.plexOk && a.inPlex
          ? `<span class="badge plex" style="font-size:9px">▶</span>` : '';
        const plexPlayBtn = state.plexOk && a.inPlex && a.ratingKey
          ? `<button class="plex-play-album-btn" data-rating-key="${esc(a.ratingKey)}" title="Afspelen op Plex">▶ Speel af</button>`
          : '';
        albumsHtml += `<div class="panel-album-row">${imgEl}
          <span class="panel-album-name">${esc(a.name)}</span>${plexMark}${plexPlayBtn}${downloadBtn(name, a.name, a.inPlex)}</div>`;
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

    // Plex album play knoppen
    panelContent.querySelectorAll('.plex-play-album-btn').forEach(btn => {
      btn.addEventListener('click', async e => {
        e.stopPropagation();
        const ratingKey = btn.dataset.ratingKey;
        if (ratingKey) {
          btn.disabled = true;
          btn.textContent = '…';
          const ok = await playOnZone(ratingKey, 'music');
          btn.disabled = false;
          btn.textContent = ok ? '▶ Speelt af' : '▶ Speel af';
          if (ok) setTimeout(() => { btn.textContent = '▶ Speel af'; }, 3000);
        }
      });
    });
  });
}

export function closeArtistPanel() {
  document.getElementById('panel-overlay').classList.remove('open');
  document.body.style.overflow = '';
}
