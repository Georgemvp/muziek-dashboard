// ── Zoekbalk ──────────────────────────────────────────────────────────────
import { state } from '../state.js';
import { apiFetch } from '../api.js';
import { esc, fmt, gradientFor, initials, proxyImg } from '../helpers.js';

export async function doSearch(q) {
  const results = document.getElementById('search-results');
  if (q.length < 2) { results.classList.remove('open'); return; }
  try {
    const data = await apiFetch(`/api/search?q=${encodeURIComponent(q)}`);
    if (!data.results?.length) {
      results.innerHTML =
        `<div style="padding:12px 14px;color:var(--muted2);font-size:13px">Geen resultaten</div>`;
    } else {
      results.innerHTML = data.results.map(a => {
        const imgSrc = proxyImg(a.image, 56) || a.image;
        const imgEl = imgSrc
          ? `<img class="search-result-img" src="${esc(imgSrc)}" alt="${esc(a.name)}" loading="lazy" width="56" height="56"
               onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
             <div class="search-result-ph" style="background:${gradientFor(a.name)};display:none">${initials(a.name)}</div>`
          : `<div class="search-result-ph" style="background:${gradientFor(a.name)}">${initials(a.name)}</div>`;
        const listeners = a.listeners ? `${fmt(a.listeners)} luisteraars` : '';
        return `<button class="search-result-item" data-artist="${esc(a.name)}">
          ${imgEl}
          <div><div class="search-result-name">${esc(a.name)}</div>
          ${listeners ? `<div class="search-result-sub">${listeners}</div>` : ''}</div>
        </button>`;
      }).join('');
    }
    results.classList.add('open');
  } catch {}
}

// ── Zoekbalk event listeners ──────────────────────────────────────────────
document.getElementById('search-input').addEventListener('input', e => {
  clearTimeout(state.searchTimeout);
  const q = e.target.value.trim();
  if (!q) { document.getElementById('search-results').classList.remove('open'); return; }
  state.searchTimeout = setTimeout(() => doSearch(q), 320);
});

document.addEventListener('click', e => {
  if (!e.target.closest('#search-wrap'))
    document.getElementById('search-results').classList.remove('open');
});
