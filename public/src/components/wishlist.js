// ── Verlanglijst ──────────────────────────────────────────────────────────
import { state } from '../state.js';
import { apiFetch } from '../api.js';
import { esc, gradientFor, initials, showLoading, setContent, showError, p } from '../helpers.js';

export async function loadWishlistState() {
  try {
    const items = await apiFetch('/api/wishlist');
    state.wishlistMap.clear();
    for (const item of items)
      state.wishlistMap.set(`${item.type}:${item.name}`, item.id);
    updateWishlistBadge();
  } catch {}
}

export function updateWishlistBadge() {
  const badge = document.getElementById('badge-wishlist');
  if (badge) badge.textContent = state.wishlistMap.size || '0';
}

export async function toggleWishlist(type, name, artist, image) {
  const key = `${type}:${name}`;
  if (state.wishlistMap.has(key)) {
    try { await p(`/api/wishlist/${state.wishlistMap.get(key)}`, { method: 'DELETE' }); } catch (e) { if (e.name !== 'AbortError') throw e; }
    state.wishlistMap.delete(key);
    updateWishlistBadge();
    return false;
  } else {
    const res = await p('/api/wishlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, name, artist, image })
    });
    const data = await res.json();
    state.wishlistMap.set(key, data.id);
    updateWishlistBadge();
    return true;
  }
}

export async function loadWishlist() {
  showLoading();
  await loadWishlistState();
  try {
    const items = await apiFetch('/api/wishlist');
    if (!items.length) {
      setContent('<div class="empty">Je lijst is leeg.<br>Voeg artiesten toe via het 🔖 icoon in Ontdek en Collectiegaten.</div>');
      return;
    }
    let html = `<div class="section-title">${items.length} opgeslagen</div><div class="wishlist-grid">`;
    for (const item of items) {
      const imgHtml = item.image
        ? `<img src="${esc(item.image)}" alt="${esc(item.name)}${item.artist ? ' by '+esc(item.artist) : ''}" loading="lazy"
            onerror="this.onerror=null;this.style.display='none'">`
        : '';
      html += `
        <div class="wish-card">
          <div class="wish-photo" style="background:${gradientFor(item.name)}">
            ${imgHtml}
            <div class="wish-ph">${initials(item.name)}</div>
          </div>
          <div class="wish-body">
            <div class="wish-info">
              <div class="wish-name artist-link" data-artist="${esc(item.name)}">${esc(item.name)}</div>
              ${item.artist ? `<div class="wish-sub">${esc(item.artist)}</div>` : ''}
              <div class="wish-type">${item.type === 'artist' ? 'Artiest' : 'Album'}</div>
            </div>
            <button class="wish-remove" data-wid="${item.id}" title="Verwijder">✕</button>
          </div>
        </div>`;
    }
    setContent(html + '</div>');
  } catch (e) { showError(e.message); }
}
