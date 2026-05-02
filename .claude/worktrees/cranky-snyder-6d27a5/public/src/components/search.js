// ── Zoekbalk ──────────────────────────────────────────────────────────────
import { state } from '../state.js';
import { apiFetch } from '../api.js';
import { esc, fmt, gradientFor, initials, proxyImg } from '../helpers.js';

// ── Modi ───────────────────────────────────────────────────────────────────
// 'normal'  → Plex/Last.fm artiestenzoek
// 'sonic'   → AudioMuse CLAP tekst-zoek
let _searchMode = 'normal';

// ── Normal search ──────────────────────────────────────────────────────────
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
          ? `<img class="search-result-img" src="${esc(imgSrc)}" alt="${esc(a.name)}" loading="lazy" decoding="async" width="56" height="56"
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

// ── Sonic Search (AudioMuse CLAP) ──────────────────────────────────────────
async function doSonicSearch(q) {
  const results = document.getElementById('search-results');
  if (q.length < 3) { results.classList.remove('open'); return; }

  results.innerHTML = `
    <div class="search-sonic-header">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
      </svg>
      Sonic zoeken…
    </div>
    <div style="padding:8px 14px;color:var(--muted2);font-size:13px">
      <div class="spinner" style="width:14px;height:14px;display:inline-block;vertical-align:middle;margin-right:6px"></div>
      AudioMuse doorzoeken…
    </div>`;
  results.classList.add('open');

  try {
    const { clapSearch } = await import('../modules/audiomuse-api.js');
    const tracks = await clapSearch(q, 15);

    if (!tracks.length) {
      results.innerHTML = `
        <div class="search-sonic-header">Sonic zoeken</div>
        <div style="padding:12px 14px;color:var(--muted2);font-size:13px">Geen resultaten voor "${esc(q)}"</div>`;
      return;
    }

    results.innerHTML = `
      <div class="search-sonic-header">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
        </svg>
        Sonic resultaten voor <em>"${esc(q)}"</em>
      </div>
      ${tracks.map(t => {
        const artist = t.artist || t.album_artist || '';
        const title  = t.title  || t.name || '';
        const album  = t.album  || '';
        const sub    = [artist, album].filter(Boolean).join(' · ');
        const bg     = gradientFor(artist || title);
        return `<button class="search-result-item search-sonic-item"
                         data-am-artist="${esc(artist)}"
                         data-am-title="${esc(title)}">
          <div class="search-result-ph" style="background:${bg};font-size:10px">♫</div>
          <div>
            <div class="search-result-name">${esc(title)}</div>
            ${sub ? `<div class="search-result-sub">${esc(sub)}</div>` : ''}
          </div>
        </button>`;
      }).join('')}`;

    // Click op sonic resultaat → similar songs modal
    results.querySelectorAll('.search-sonic-item').forEach(btn => {
      btn.addEventListener('click', () => {
        results.classList.remove('open');
        document.getElementById('search-input').value = '';
        const artist = btn.dataset.amArtist || '';
        const title  = btn.dataset.amTitle  || '';
        // Gooi een click event zodat de bestaande event delegation het oppikt
        const fakeBtn = document.createElement('button');
        fakeBtn.className = 'am-similar-btn';
        fakeBtn.dataset.amArtist = artist;
        fakeBtn.dataset.amTitle  = title;
        document.body.appendChild(fakeBtn);
        fakeBtn.click();
        fakeBtn.remove();
      });
    });
  } catch {
    results.innerHTML = `
      <div class="search-sonic-header">Sonic zoeken</div>
      <div style="padding:12px 14px;color:var(--muted2);font-size:13px">AudioMuse niet bereikbaar</div>`;
  }
}

// ── Mode toggle ────────────────────────────────────────────────────────────
function renderModeToggle() {
  const wrap = document.getElementById('search-wrap');
  if (!wrap || wrap.querySelector('.search-mode-toggle')) return;
  const toggle = document.createElement('button');
  toggle.className = 'search-mode-toggle';
  toggle.id = 'search-mode-toggle';
  toggle.type = 'button';
  toggle.title = 'Wissel naar Sonic Search (AudioMuse)';
  toggle.setAttribute('aria-label', 'Zoek op geluid via AudioMuse');
  toggle.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2" aria-hidden="true">
    <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
  </svg>`;
  wrap.appendChild(toggle);

  toggle.addEventListener('click', () => {
    _searchMode = _searchMode === 'normal' ? 'sonic' : 'normal';
    const input = document.getElementById('search-input');
    if (_searchMode === 'sonic') {
      toggle.classList.add('active');
      toggle.title = 'Terug naar normale zoekfunctie';
      input.placeholder = 'Beschrijf het geluid… (bijv. "calm piano")';
      document.getElementById('search-results').classList.remove('open');
    } else {
      toggle.classList.remove('active');
      toggle.title = 'Wissel naar Sonic Search (AudioMuse)';
      input.placeholder = 'Zoek artiest, album of nummer…';
      document.getElementById('search-results').classList.remove('open');
    }
    input.focus();
  });
}

// Init toggle after DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderModeToggle);
} else {
  renderModeToggle();
}

// ── Zoekbalk event listeners ──────────────────────────────────────────────
document.getElementById('search-input').addEventListener('input', e => {
  clearTimeout(state.searchTimeout);
  const q = e.target.value.trim();
  if (!q) { document.getElementById('search-results').classList.remove('open'); return; }
  state.searchTimeout = setTimeout(() => {
    if (_searchMode === 'sonic') {
      doSonicSearch(q);
    } else {
      doSearch(q);
    }
  }, 320);
});

document.addEventListener('click', e => {
  if (!e.target.closest('#search-wrap'))
    document.getElementById('search-results').classList.remove('open');
});
