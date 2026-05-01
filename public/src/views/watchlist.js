// ── Watchlist view — Artiestenmonitoring ────────────────────────────────────
import { apiFetch } from '../api.js';
import { esc, proxyImg, gradientFor, initials } from '../helpers.js';
import { switchView } from '../router.js';

// ── Module state ──────────────────────────────────────────────────────────────
let watchlistItems = [];
let searchResults  = [];
let searchTimer    = null;
let expandedIds    = new Set();

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(ts) {
  if (!ts) return '—';
  const d = new Date(ts * 1000);
  if (isNaN(d)) return '—';
  return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatReleaseDate(str) {
  if (!str) return '—';
  const d = new Date(str);
  if (isNaN(d)) return str;
  const now  = new Date();
  const diff = Math.floor((now - d) / 86400000);
  if (diff < 0)   return `Over ${Math.abs(diff)}d`;
  if (diff === 0) return 'Vandaag';
  if (diff === 1) return 'Gisteren';
  if (diff < 7)   return `${diff}d geleden`;
  if (diff < 30)  return `${Math.floor(diff / 7)}w geleden`;
  return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' });
}

function typeLabel(type) {
  switch ((type || '').toLowerCase()) {
    case 'single': return 'Single';
    case 'ep':     return 'EP';
    default:       return 'Album';
  }
}

function typeClass(type) {
  switch ((type || '').toLowerCase()) {
    case 'single': return 'wl-badge-single';
    case 'ep':     return 'wl-badge-ep';
    default:       return 'wl-badge-album';
  }
}

function statusLabel(status) {
  switch (status) {
    case 'downloaded': return '↓ Gedownload';
    case 'skipped':    return '✗ Overgeslagen';
    case 'in_library': return '✓ In bibliotheek';
    default:           return '● Nieuw';
  }
}

function statusClass(status) {
  switch (status) {
    case 'downloaded': return 'wl-status-downloaded';
    case 'skipped':    return 'wl-status-skipped';
    case 'in_library': return 'wl-status-library';
    default:           return 'wl-status-new';
  }
}

// ── API calls ─────────────────────────────────────────────────────────────────
async function loadWatchlist() {
  try {
    const data = await apiFetch('/api/watchlist');
    watchlistItems = data.items || [];
    renderList();
  } catch (e) {
    showError('Kon watchlist niet laden: ' + e.message);
  }
}

async function loadReleases(id) {
  try {
    const data = await apiFetch(`/api/watchlist/${id}/releases`);
    return data.releases || [];
  } catch {
    return [];
  }
}

async function searchArtists(q) {
  try {
    const data = await apiFetch(`/api/watchlist/search?q=${encodeURIComponent(q)}`);
    searchResults = data.results || [];
    renderSearchDropdown();
  } catch {
    searchResults = [];
    renderSearchDropdown();
  }
}

// ── Renderen ──────────────────────────────────────────────────────────────────
function getContainer() {
  return document.getElementById('watchlist-view');
}

function showError(msg) {
  const el = document.getElementById('wl-error');
  if (el) { el.textContent = msg; el.hidden = false; }
}

function renderList() {
  const el = document.getElementById('wl-list');
  if (!el) return;

  if (watchlistItems.length === 0) {
    el.innerHTML = `
      <div class="wl-empty">
        <div class="wl-empty-icon">👁</div>
        <p>Je watchlist is leeg.</p>
        <p>Zoek een artiest hierboven om te beginnen.</p>
      </div>`;
    return;
  }

  el.innerHTML = watchlistItems.map(item => renderArtistCard(item)).join('');

  // Herstel expanded staat
  expandedIds.forEach(id => {
    const detail = document.getElementById(`wl-detail-${id}`);
    if (detail) detail.hidden = false;
  });
}

function renderArtistCard(item) {
  const newCount = item.new_release_count || 0;
  const isExpanded = expandedIds.has(item.id);

  const configSummary = [
    item.watch_albums  ? 'Albums'  : null,
    item.watch_eps     ? 'EPs'     : null,
    item.watch_singles ? 'Singles' : null,
  ].filter(Boolean).join(', ') || 'Niets';

  const exclusions = [
    item.exclude_live         ? 'live'       : null,
    item.exclude_remixes      ? 'remixes'    : null,
    item.exclude_compilations ? 'compilaties': null,
  ].filter(Boolean);

  return `
    <div class="wl-card" id="wl-card-${item.id}" data-id="${item.id}">
      <div class="wl-card-header">
        <div class="wl-artist-thumb">
          <div class="wl-artist-initial" style="background:${gradientFor(item.artist_name)}">
            ${esc(initials(item.artist_name))}
          </div>
        </div>
        <div class="wl-card-info">
          <div class="wl-artist-name">${esc(item.artist_name)}</div>
          <div class="wl-config-summary">${esc(configSummary)}${exclusions.length ? ` · geen ${exclusions.join(', ')}` : ''}</div>
          <div class="wl-meta">
            Gescand: ${item.last_scanned ? formatDate(item.last_scanned) : 'Nog niet'}
            ${item.auto_download ? ' · <span class="wl-auto-dl">↓ Auto-download</span>' : ''}
          </div>
        </div>
        <div class="wl-card-actions">
          ${newCount > 0 ? `<span class="wl-new-badge">${newCount} nieuw</span>` : '<span class="wl-uptodate">Up to date</span>'}
          <button class="wl-btn-sm wl-btn-expand" data-id="${item.id}" title="${isExpanded ? 'Inklappen' : 'Uitklappen'}">
            ${isExpanded ? '▲' : '▼'}
          </button>
          <button class="wl-btn-sm wl-btn-edit" data-id="${item.id}" title="Bewerken">✎</button>
          <button class="wl-btn-sm wl-btn-scan" data-id="${item.id}" title="Nu scannen">↻</button>
          <button class="wl-btn-sm wl-btn-delete wl-btn-danger" data-id="${item.id}" title="Verwijderen">✕</button>
        </div>
      </div>
      <div class="wl-card-detail" id="wl-detail-${item.id}" ${isExpanded ? '' : 'hidden'}>
        <div class="wl-releases-loading" id="wl-releases-loading-${item.id}">Releases laden…</div>
        <div class="wl-releases-list" id="wl-releases-list-${item.id}"></div>
      </div>
    </div>`;
}

async function renderReleasesFor(id) {
  const listEl    = document.getElementById(`wl-releases-list-${id}`);
  const loadingEl = document.getElementById(`wl-releases-loading-${id}`);
  if (!listEl) return;

  if (loadingEl) loadingEl.hidden = false;
  const releases = await loadReleases(id);
  if (loadingEl) loadingEl.hidden = true;

  if (releases.length === 0) {
    listEl.innerHTML = '<div class="wl-releases-empty">Geen releases gevonden.</div>';
    return;
  }

  listEl.innerHTML = `
    <div class="wl-releases-grid">
      ${releases.map(r => `
        <div class="wl-release-item ${r.status === 'in_library' ? 'wl-release-in-library' : ''}" data-release-id="${r.id}">
          <div class="wl-release-cover">
            ${r.cover_url
              ? `<img src="${esc(r.cover_url)}" alt="${esc(r.release_title)}" loading="lazy" onerror="this.style.display='none'">`
              : `<div class="wl-release-cover-ph" style="background:${gradientFor(r.release_title)}">♫</div>`
            }
          </div>
          <div class="wl-release-info">
            <div class="wl-release-title">${esc(r.release_title)}</div>
            <div class="wl-release-meta">
              <span class="wl-badge ${typeClass(r.release_type)}">${typeLabel(r.release_type)}</span>
              <span class="wl-release-date">${formatReleaseDate(r.release_date)}</span>
            </div>
            <div class="wl-release-status">
              <span class="wl-status-dot ${statusClass(r.status)}">${statusLabel(r.status)}</span>
            </div>
          </div>
          <div class="wl-release-actions">
            ${r.status === 'new' ? `<button class="wl-btn-sm wl-btn-skip" data-release-id="${r.id}" title="Overslaan">✗</button>` : ''}
            ${r.status !== 'in_library' && r.status !== 'downloaded'
              ? `<button class="wl-btn-sm wl-btn-download-release" data-release-id="${r.id}" data-title="${esc(r.release_title)}" title="Downloaden">↓</button>`
              : ''}
          </div>
        </div>`).join('')}
    </div>`;
}

function renderSearchDropdown() {
  const dropdown = document.getElementById('wl-search-dropdown');
  if (!dropdown) return;

  if (searchResults.length === 0) {
    dropdown.hidden = true;
    return;
  }

  dropdown.innerHTML = searchResults.map(r => `
    <button class="wl-search-result" data-name="${esc(r.name)}">
      <span class="wl-search-result-icon">${r.source === 'plex' ? '📚' : '♫'}</span>
      <span class="wl-search-result-name">${esc(r.name)}</span>
      <span class="wl-search-result-source">${r.source === 'plex' ? 'Plex' : 'Last.fm'}</span>
    </button>`).join('');
  dropdown.hidden = false;
}

function renderConfigModal(item) {
  const existing = document.getElementById('wl-config-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'wl-config-modal';
  modal.className = 'wl-modal-overlay';
  modal.innerHTML = `
    <div class="wl-modal">
      <div class="wl-modal-header">
        <h2 class="wl-modal-title">Instellingen — ${esc(item.artist_name)}</h2>
        <button class="wl-modal-close" id="wl-modal-close">✕</button>
      </div>
      <div class="wl-modal-body">
        <div class="wl-config-section">
          <div class="wl-config-label">Release-types monitoren</div>
          <div class="wl-toggles">
            <label class="wl-toggle">
              <input type="checkbox" id="cfg-albums" ${item.watch_albums ? 'checked' : ''}>
              <span class="wl-toggle-track"></span>
              Albums
            </label>
            <label class="wl-toggle">
              <input type="checkbox" id="cfg-eps" ${item.watch_eps ? 'checked' : ''}>
              <span class="wl-toggle-track"></span>
              EPs
            </label>
            <label class="wl-toggle">
              <input type="checkbox" id="cfg-singles" ${item.watch_singles ? 'checked' : ''}>
              <span class="wl-toggle-track"></span>
              Singles
            </label>
          </div>
        </div>
        <div class="wl-config-section">
          <div class="wl-config-label">Uitsluitingen</div>
          <div class="wl-toggles">
            <label class="wl-toggle">
              <input type="checkbox" id="cfg-excl-live" ${item.exclude_live ? 'checked' : ''}>
              <span class="wl-toggle-track"></span>
              Live-albums uitsluiten
            </label>
            <label class="wl-toggle">
              <input type="checkbox" id="cfg-excl-remix" ${item.exclude_remixes ? 'checked' : ''}>
              <span class="wl-toggle-track"></span>
              Remixes uitsluiten
            </label>
            <label class="wl-toggle">
              <input type="checkbox" id="cfg-excl-comp" ${item.exclude_compilations ? 'checked' : ''}>
              <span class="wl-toggle-track"></span>
              Compilaties uitsluiten
            </label>
          </div>
        </div>
        <div class="wl-config-section">
          <div class="wl-config-label">Automatisch downloaden</div>
          <div class="wl-toggles">
            <label class="wl-toggle">
              <input type="checkbox" id="cfg-auto-dl" ${item.auto_download ? 'checked' : ''}>
              <span class="wl-toggle-track"></span>
              Nieuwe releases automatisch downloaden
            </label>
          </div>
          <div class="wl-config-row" id="cfg-quality-row" ${item.auto_download ? '' : 'hidden'}>
            <label class="wl-config-sublabel" for="cfg-quality">Download-kwaliteit</label>
            <select id="cfg-quality" class="wl-select">
              ${['flac', 'hifi', 'lossless', 'high', 'low', 'atmos'].map(q =>
                `<option value="${q}" ${item.download_quality === q ? 'selected' : ''}>${q.toUpperCase()}</option>`
              ).join('')}
            </select>
          </div>
        </div>
        <div class="wl-config-section">
          <div class="wl-config-label">Scan-interval</div>
          <div class="wl-config-row">
            <select id="cfg-interval" class="wl-select">
              ${[6, 12, 24, 48, 168].map(h =>
                `<option value="${h}" ${item.scan_interval_hours === h ? 'selected' : ''}>${h >= 168 ? '1 week' : h + ' uur'}</option>`
              ).join('')}
            </select>
          </div>
        </div>
        <div class="wl-config-section">
          <label class="wl-config-label" for="cfg-notes">Notities</label>
          <textarea id="cfg-notes" class="wl-textarea" rows="2" placeholder="Optionele notities...">${esc(item.notes || '')}</textarea>
        </div>
      </div>
      <div class="wl-modal-footer">
        <button class="wl-btn wl-btn-secondary" id="wl-modal-cancel">Annuleren</button>
        <button class="wl-btn wl-btn-primary" id="wl-modal-save" data-id="${item.id}">Opslaan</button>
      </div>
    </div>`;

  document.body.appendChild(modal);

  // Toon/verberg quality selector bij toggle auto-download
  modal.querySelector('#cfg-auto-dl').addEventListener('change', e => {
    modal.querySelector('#cfg-quality-row').hidden = !e.target.checked;
  });

  // Sluit modal
  modal.querySelector('#wl-modal-close').addEventListener('click', () => modal.remove());
  modal.querySelector('#wl-modal-cancel').addEventListener('click', () => modal.remove());
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });

  // Opslaan
  modal.querySelector('#wl-modal-save').addEventListener('click', async () => {
    const config = {
      watch_albums:         modal.querySelector('#cfg-albums').checked ? 1 : 0,
      watch_eps:            modal.querySelector('#cfg-eps').checked    ? 1 : 0,
      watch_singles:        modal.querySelector('#cfg-singles').checked ? 1 : 0,
      exclude_live:         modal.querySelector('#cfg-excl-live').checked  ? 1 : 0,
      exclude_remixes:      modal.querySelector('#cfg-excl-remix').checked ? 1 : 0,
      exclude_compilations: modal.querySelector('#cfg-excl-comp').checked  ? 1 : 0,
      auto_download:        modal.querySelector('#cfg-auto-dl').checked    ? 1 : 0,
      download_quality:     modal.querySelector('#cfg-quality').value,
      scan_interval_hours:  parseInt(modal.querySelector('#cfg-interval').value, 10),
      notes:                modal.querySelector('#cfg-notes').value,
    };

    try {
      await apiFetch(`/api/watchlist/${item.id}`, { method: 'PUT', body: JSON.stringify(config) });
      modal.remove();
      await loadWatchlist();
    } catch (e) {
      alert('Opslaan mislukt: ' + e.message);
    }
  });
}

// ── Toevoegen ────────────────────────────────────────────────────────────────
async function addArtist(name) {
  const input = document.getElementById('wl-search-input');
  const dropdown = document.getElementById('wl-search-dropdown');

  try {
    await apiFetch('/api/watchlist', {
      method: 'POST',
      body: JSON.stringify({ artist: name }),
    });
    if (input) input.value = '';
    if (dropdown) dropdown.hidden = true;
    searchResults = [];
    await loadWatchlist();
    showToast(`${name} toegevoegd aan watchlist`);
  } catch (e) {
    showToast(e.message || 'Toevoegen mislukt', 'error');
  }
}

// ── Auto-discover ─────────────────────────────────────────────────────────────
async function runAutoDiscover(artistName) {
  if (!confirm(`Vergelijkbare artiesten van "${artistName}" toevoegen aan de watchlist?`)) return;

  const btn = document.querySelector(`[data-discover="${CSS.escape(artistName)}"]`);
  if (btn) { btn.disabled = true; btn.textContent = '…'; }

  try {
    const data = await apiFetch(`/api/watchlist/auto-discover/${encodeURIComponent(artistName)}`, { method: 'POST' });
    showToast(`${data.added?.length || 0} artiesten toegevoegd, ${data.skipped?.length || 0} al aanwezig`);
    await loadWatchlist();
  } catch (e) {
    showToast('Auto-discover mislukt: ' + e.message, 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '+ Vergelijkbaar'; }
  }
}

// ── Scan ─────────────────────────────────────────────────────────────────────
async function scanOne(id) {
  const btn = document.querySelector(`.wl-btn-scan[data-id="${id}"]`);
  if (btn) { btn.disabled = true; btn.textContent = '…'; }

  try {
    const data = await apiFetch(`/api/watchlist/${id}/scan`, { method: 'POST' });
    const msg = data.newReleases?.length
      ? `${data.newReleases.length} nieuwe releases gevonden!`
      : 'Geen nieuwe releases gevonden';
    showToast(msg);
    await loadWatchlist();
    // Als expanded, verversen
    if (expandedIds.has(id)) await renderReleasesFor(id);
  } catch (e) {
    showToast('Scan mislukt: ' + e.message, 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '↻'; }
  }
}

async function scanAllArtists() {
  const btn = document.getElementById('wl-btn-scan-all');
  if (btn) { btn.disabled = true; btn.textContent = 'Bezig…'; }

  try {
    await apiFetch('/api/watchlist/scan-all', { method: 'POST' });
    showToast('Scan gestart op achtergrond');
    // Na 3s opnieuw laden
    setTimeout(() => loadWatchlist(), 3000);
  } catch (e) {
    showToast('Scan mislukt: ' + e.message, 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Scan alles'; }
  }
}

// ── Toast ──────────────────────────────────────────────────────────────────
function showToast(msg, type = 'info') {
  let el = document.getElementById('wl-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'wl-toast';
    el.className = 'wl-toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.className   = `wl-toast wl-toast-${type} wl-toast-visible`;
  clearTimeout(el._timer);
  el._timer = setTimeout(() => { el.className = 'wl-toast'; }, 3000);
}

// ── Events ────────────────────────────────────────────────────────────────────
function bindEvents() {
  const container = getContainer();
  if (!container) return;

  // Zoekbalk input
  const searchInput = container.querySelector('#wl-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimer);
      const q = searchInput.value.trim();
      if (q.length < 2) {
        searchResults = [];
        const dd = document.getElementById('wl-search-dropdown');
        if (dd) dd.hidden = true;
        return;
      }
      searchTimer = setTimeout(() => searchArtists(q), 300);
    });

    searchInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        const q = searchInput.value.trim();
        if (q.length >= 2) addArtist(q);
      }
      if (e.key === 'Escape') {
        const dd = document.getElementById('wl-search-dropdown');
        if (dd) dd.hidden = true;
      }
    });

    document.addEventListener('click', e => {
      const dd = document.getElementById('wl-search-dropdown');
      if (dd && !dd.contains(e.target) && e.target !== searchInput) dd.hidden = true;
    }, { capture: true });
  }

  // Zoek-dropdown selectie
  container.addEventListener('click', e => {
    const result = e.target.closest('.wl-search-result');
    if (result) {
      addArtist(result.dataset.name);
      return;
    }

    // Expand/collapse kaart
    const expandBtn = e.target.closest('.wl-btn-expand');
    if (expandBtn) {
      const id = parseInt(expandBtn.dataset.id, 10);
      const detail = document.getElementById(`wl-detail-${id}`);
      if (!detail) return;
      const isHidden = detail.hidden;
      detail.hidden = !isHidden;
      expandBtn.textContent = isHidden ? '▲' : '▼';
      if (isHidden) {
        expandedIds.add(id);
        renderReleasesFor(id);
      } else {
        expandedIds.delete(id);
      }
      return;
    }

    // Edit knop
    const editBtn = e.target.closest('.wl-btn-edit');
    if (editBtn) {
      const id   = parseInt(editBtn.dataset.id, 10);
      const item = watchlistItems.find(w => w.id === id);
      if (item) renderConfigModal(item);
      return;
    }

    // Scan knop
    const scanBtn = e.target.closest('.wl-btn-scan');
    if (scanBtn) {
      scanOne(parseInt(scanBtn.dataset.id, 10));
      return;
    }

    // Delete knop
    const deleteBtn = e.target.closest('.wl-btn-delete');
    if (deleteBtn) {
      const id   = parseInt(deleteBtn.dataset.id, 10);
      const item = watchlistItems.find(w => w.id === id);
      if (item && confirm(`"${item.artist_name}" verwijderen uit watchlist?`)) {
        apiFetch(`/api/watchlist/${id}`, { method: 'DELETE' })
          .then(() => { expandedIds.delete(id); loadWatchlist(); })
          .catch(err => showToast('Verwijderen mislukt: ' + err.message, 'error'));
      }
      return;
    }

    // Skip release
    const skipBtn = e.target.closest('.wl-btn-skip');
    if (skipBtn) {
      const releaseId = parseInt(skipBtn.dataset.releaseId, 10);
      apiFetch(`/api/watchlist/releases/${releaseId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'skipped' }),
      }).then(() => {
        skipBtn.closest('.wl-release-item').querySelector('.wl-status-dot').textContent = statusLabel('skipped');
        skipBtn.closest('.wl-release-item').querySelector('.wl-status-dot').className = `wl-status-dot ${statusClass('skipped')}`;
        skipBtn.remove();
        loadWatchlist(); // Update badge teller
      }).catch(e => showToast('Overslaan mislukt: ' + e.message, 'error'));
      return;
    }
  });

  // Scan-all knop
  const scanAllBtn = document.getElementById('wl-btn-scan-all');
  if (scanAllBtn) scanAllBtn.addEventListener('click', scanAllArtists);
}

// ── CSS ───────────────────────────────────────────────────────────────────────
function injectStyles() {
  if (document.getElementById('wl-styles')) return;
  const style = document.createElement('style');
  style.id = 'wl-styles';
  style.textContent = `
    /* ── Watchlist layout ── */
    .wl-view { max-width: 900px; margin: 0 auto; padding: 24px 16px; }
    .wl-header { display: flex; align-items: center; justify-content: space-between;
      flex-wrap: wrap; gap: 12px; margin-bottom: 24px; }
    .wl-title { font-size: 1.5rem; font-weight: 700; color: var(--color-text); margin: 0; }
    .wl-header-actions { display: flex; gap: 8px; }

    /* ── Zoekbalk ── */
    .wl-search-wrap { position: relative; margin-bottom: 20px; }
    .wl-search-input {
      width: 100%; padding: 10px 16px; border-radius: 10px; border: 1.5px solid var(--color-border);
      background: var(--color-surface); color: var(--color-text); font-size: 0.95rem;
      outline: none; transition: border-color 0.15s;
    }
    .wl-search-input:focus { border-color: var(--color-accent, #6c63ff); }
    .wl-search-dropdown {
      position: absolute; top: calc(100% + 4px); left: 0; right: 0;
      background: var(--color-surface); border: 1.5px solid var(--color-border);
      border-radius: 10px; z-index: 200; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,.15);
    }
    .wl-search-result {
      display: flex; align-items: center; gap: 10px; width: 100%;
      padding: 10px 14px; border: none; background: none; color: var(--color-text);
      cursor: pointer; text-align: left; font-size: 0.92rem;
    }
    .wl-search-result:hover { background: var(--color-hover, rgba(108,99,255,.08)); }
    .wl-search-result-source { margin-left: auto; font-size: 0.78rem; color: var(--color-text-muted); }

    /* ── Artiest-kaart ── */
    .wl-list { display: flex; flex-direction: column; gap: 12px; }
    .wl-card {
      background: var(--color-surface); border-radius: 14px;
      border: 1.5px solid var(--color-border); overflow: hidden;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .wl-card:hover { border-color: var(--color-accent, #6c63ff); box-shadow: 0 4px 16px rgba(0,0,0,.08); }
    .wl-card-header {
      display: flex; align-items: center; gap: 14px;
      padding: 14px 16px; cursor: default;
    }
    .wl-artist-thumb { flex-shrink: 0; }
    .wl-artist-initial {
      width: 48px; height: 48px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 1rem; font-weight: 700; color: #fff; user-select: none;
    }
    .wl-card-info { flex: 1; min-width: 0; }
    .wl-artist-name { font-weight: 600; font-size: 1rem; color: var(--color-text);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .wl-config-summary { font-size: 0.8rem; color: var(--color-text-muted); margin-top: 2px; }
    .wl-meta { font-size: 0.78rem; color: var(--color-text-muted); margin-top: 2px; }
    .wl-auto-dl { color: var(--color-accent, #6c63ff); }

    .wl-card-actions { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
    .wl-new-badge {
      background: var(--color-accent, #6c63ff); color: #fff;
      border-radius: 999px; padding: 2px 10px; font-size: 0.78rem; font-weight: 600;
    }
    .wl-uptodate { font-size: 0.78rem; color: var(--color-text-muted); }

    /* ── Knoppen ── */
    .wl-btn {
      padding: 8px 16px; border-radius: 8px; border: none; font-size: 0.88rem;
      font-weight: 600; cursor: pointer; transition: opacity 0.15s, background 0.15s;
    }
    .wl-btn:disabled { opacity: .5; cursor: default; }
    .wl-btn-primary { background: var(--color-accent, #6c63ff); color: #fff; }
    .wl-btn-primary:hover:not(:disabled) { opacity: .85; }
    .wl-btn-secondary { background: var(--color-border); color: var(--color-text); }
    .wl-btn-secondary:hover:not(:disabled) { opacity: .8; }
    .wl-btn-sm {
      width: 30px; height: 30px; border-radius: 8px; border: 1.5px solid var(--color-border);
      background: none; color: var(--color-text); cursor: pointer; font-size: 0.85rem;
      display: flex; align-items: center; justify-content: center;
      transition: background 0.12s, border-color 0.12s;
    }
    .wl-btn-sm:hover { background: var(--color-hover, rgba(108,99,255,.08)); border-color: var(--color-accent, #6c63ff); }
    .wl-btn-danger { color: #e55; border-color: #e55; }
    .wl-btn-danger:hover { background: rgba(238,85,85,.1); }

    /* ── Detail / releases ── */
    .wl-card-detail { border-top: 1.5px solid var(--color-border); padding: 16px; }
    .wl-releases-loading { color: var(--color-text-muted); font-size: 0.88rem; }
    .wl-releases-empty { color: var(--color-text-muted); font-size: 0.88rem; }
    .wl-releases-grid { display: flex; flex-direction: column; gap: 8px; }
    .wl-release-item {
      display: flex; align-items: center; gap: 12px; padding: 10px 12px;
      background: var(--color-bg, #f9f9f9); border-radius: 10px;
      border: 1px solid transparent; transition: border-color 0.12s;
    }
    .wl-release-item:hover { border-color: var(--color-border); }
    .wl-release-in-library { opacity: 0.6; }
    .wl-release-cover { width: 44px; height: 44px; border-radius: 6px; overflow: hidden; flex-shrink: 0; }
    .wl-release-cover img { width: 100%; height: 100%; object-fit: cover; }
    .wl-release-cover-ph {
      width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
      color: rgba(255,255,255,.7); font-size: 1.1rem;
    }
    .wl-release-info { flex: 1; min-width: 0; }
    .wl-release-title { font-weight: 600; font-size: 0.92rem; color: var(--color-text);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .wl-release-meta { display: flex; align-items: center; gap: 8px; margin-top: 3px; }
    .wl-release-date { font-size: 0.78rem; color: var(--color-text-muted); }
    .wl-release-status { margin-top: 2px; }
    .wl-release-actions { display: flex; gap: 4px; flex-shrink: 0; }

    /* ── Badges ── */
    .wl-badge { font-size: 0.72rem; font-weight: 700; padding: 1px 7px; border-radius: 999px; }
    .wl-badge-album  { background: rgba(108,99,255,.15); color: var(--color-accent, #6c63ff); }
    .wl-badge-ep     { background: rgba(30,200,120,.15); color: #1ec878; }
    .wl-badge-single { background: rgba(255,180,0,.15);  color: #e6a800; }

    /* ── Status ── */
    .wl-status-dot { font-size: 0.75rem; font-weight: 600; }
    .wl-status-new        { color: var(--color-accent, #6c63ff); }
    .wl-status-downloaded { color: #1ec878; }
    .wl-status-skipped    { color: var(--color-text-muted); }
    .wl-status-library    { color: #1ec878; }

    /* ── Leeg state ── */
    .wl-empty { text-align: center; padding: 60px 20px; color: var(--color-text-muted); }
    .wl-empty-icon { font-size: 3rem; margin-bottom: 16px; }
    .wl-empty p { margin: 4px 0; }

    /* ── Modal ── */
    .wl-modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,.45); z-index: 1000;
      display: flex; align-items: center; justify-content: center; padding: 20px;
    }
    .wl-modal {
      background: var(--color-surface); border-radius: 16px; width: 100%; max-width: 480px;
      max-height: 85vh; overflow-y: auto; box-shadow: 0 16px 48px rgba(0,0,0,.2);
    }
    .wl-modal-header { display: flex; align-items: center; justify-content: space-between;
      padding: 20px 20px 0; }
    .wl-modal-title { font-size: 1.1rem; font-weight: 700; margin: 0; color: var(--color-text); }
    .wl-modal-close { width: 32px; height: 32px; border: none; background: none;
      cursor: pointer; color: var(--color-text-muted); font-size: 1.1rem; border-radius: 8px; }
    .wl-modal-close:hover { background: var(--color-hover, rgba(0,0,0,.06)); }
    .wl-modal-body { padding: 16px 20px; }
    .wl-modal-footer { display: flex; justify-content: flex-end; gap: 8px; padding: 0 20px 20px; }
    .wl-config-section { margin-bottom: 20px; }
    .wl-config-label { font-size: 0.85rem; font-weight: 600; color: var(--color-text-muted);
      margin-bottom: 10px; text-transform: uppercase; letter-spacing: .04em; }
    .wl-config-sublabel { font-size: 0.85rem; color: var(--color-text-muted); }
    .wl-config-row { display: flex; align-items: center; justify-content: space-between;
      margin-top: 10px; }
    .wl-toggles { display: flex; flex-direction: column; gap: 10px; }
    .wl-toggle { display: flex; align-items: center; gap: 10px; cursor: pointer;
      font-size: 0.9rem; color: var(--color-text); user-select: none; }
    .wl-toggle input[type=checkbox] { appearance: none; -webkit-appearance: none;
      width: 36px; height: 20px; border-radius: 999px; background: var(--color-border);
      cursor: pointer; transition: background 0.2s; position: relative; flex-shrink: 0; }
    .wl-toggle input[type=checkbox]::after {
      content: ''; position: absolute; top: 2px; left: 2px;
      width: 16px; height: 16px; border-radius: 50%; background: #fff;
      transition: transform 0.2s; box-shadow: 0 1px 4px rgba(0,0,0,.2);
    }
    .wl-toggle input[type=checkbox]:checked { background: var(--color-accent, #6c63ff); }
    .wl-toggle input[type=checkbox]:checked::after { transform: translateX(16px); }
    .wl-toggle-track { display: none; }
    .wl-select {
      padding: 6px 10px; border-radius: 8px; border: 1.5px solid var(--color-border);
      background: var(--color-surface); color: var(--color-text); font-size: 0.9rem; cursor: pointer;
    }
    .wl-textarea {
      width: 100%; padding: 8px 12px; border-radius: 8px; border: 1.5px solid var(--color-border);
      background: var(--color-surface); color: var(--color-text); font-size: 0.9rem;
      resize: vertical; box-sizing: border-box; font-family: inherit;
    }

    /* ── Toast ── */
    .wl-toast {
      position: fixed; bottom: -60px; left: 50%; transform: translateX(-50%);
      background: var(--color-surface); border: 1.5px solid var(--color-border);
      color: var(--color-text); padding: 10px 20px; border-radius: 999px;
      font-size: 0.88rem; font-weight: 600; z-index: 2000; box-shadow: 0 4px 16px rgba(0,0,0,.15);
      transition: bottom 0.25s; pointer-events: none; white-space: nowrap;
    }
    .wl-toast-visible { bottom: 24px; }
    .wl-toast-error { border-color: #e55; color: #e55; }

    @media (max-width: 600px) {
      .wl-card-header { flex-wrap: wrap; }
      .wl-card-actions { flex-wrap: wrap; }
    }
  `;
  document.head.appendChild(style);
}

// ── HTML skeleton ─────────────────────────────────────────────────────────────
function renderSkeleton() {
  return `
    <div class="wl-view" id="watchlist-view">
      <div class="wl-header">
        <h1 class="wl-title">👁 Watchlist</h1>
        <div class="wl-header-actions">
          <button class="wl-btn wl-btn-secondary" id="wl-btn-scan-all">Scan alles</button>
        </div>
      </div>

      <div id="wl-error" class="wl-error" hidden style="color:#e55;margin-bottom:12px;"></div>

      <div class="wl-search-wrap">
        <input
          type="search"
          id="wl-search-input"
          class="wl-search-input"
          placeholder="Zoek artiest om toe te voegen (Plex + Last.fm)…"
          autocomplete="off"
        >
        <div class="wl-search-dropdown" id="wl-search-dropdown" hidden></div>
      </div>

      <div class="wl-list" id="wl-list">
        <div style="color:var(--color-text-muted);padding:24px;text-align:center">Laden…</div>
      </div>
    </div>`;
}

// ── Entry point ───────────────────────────────────────────────────────────────
export async function loadWatchlistView(container) {
  injectStyles();
  container.innerHTML = renderSkeleton();
  bindEvents();
  await loadWatchlist();
}
