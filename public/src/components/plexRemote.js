// ── Plex Remote Control ───────────────────────────────────────────────────
// Zone picker (client/player selectie) en playback-commando's voor Plex.
import { playWebStream, pauseWebPlayer } from './player.js';

const ZONE_KEY = 'plexSelectedZone'; // localStorage key

// ── Zone beheer ───────────────────────────────────────────────────────────

/** Haal de geselecteerde Plex zone op uit localStorage. */
export function getSelectedZone() {
  try {
    const raw = localStorage.getItem(ZONE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

/** Controleer of de geselecteerde zone de lokale web-player is. */
export function isLocalWebZone() {
  const zone = getSelectedZone();
  return zone?.machineId === '__web__';
}

/** Sla een zone op in localStorage en werk de header-UI bij. */
function setSelectedZone(zone) {
  localStorage.setItem(ZONE_KEY, JSON.stringify(zone));
  _updateZoneUI();
}

/** Werk de zone-naam in de header bij. */
function _updateZoneUI() {
  const zone   = getSelectedZone();
  const nameEl = document.getElementById('plex-zone-name');
  if (nameEl) nameEl.textContent = zone ? zone.name : '—';
  const btn = document.getElementById('plex-zone-btn');
  if (btn) btn.classList.toggle('has-zone', !!zone);
}

// ── Clients ophalen ───────────────────────────────────────────────────────

async function _loadClients() {
  try {
    // ?t= om browser-cache te omzeilen bij elke keer openen van de picker
    const data = await fetch(`/api/plex/clients?t=${Date.now()}`).then(r => r.json());
    return data.clients || [];
  } catch { return []; }
}

// ── Zone picker dropdown ──────────────────────────────────────────────────

let _pickerOpen = false;

/** Verberg de zone-dropdown. */
export function closeZonePicker() {
  const dropdown = document.getElementById('plex-zone-dropdown');
  if (dropdown) dropdown.style.display = 'none';
  _pickerOpen = false;
}

/**
 * Toon/verberg de zone picker dropdown.
 * Geeft een Promise terug die resolvet zodra de gebruiker een zone kiest
 * (of meteen als de picker sluit zonder keuze).
 */
export async function toggleZonePicker() {
  const dropdown = document.getElementById('plex-zone-dropdown');
  if (!dropdown) return;

  if (_pickerOpen) {
    closeZonePicker();
    return;
  }

  _pickerOpen = true;
  dropdown.style.display = '';
  dropdown.innerHTML = '<div class="plex-zone-loading">Laden…</div>';

  const clients  = await _loadClients();
  const selected = getSelectedZone();

  const webZone = {
    machineId: '__web__',
    name:      'Web (deze browser)',
    product:   'Web',
  };
  const isPlexWeb = c => (c.product || '').toLowerCase().includes('web');

  const zones = [webZone, ...clients];
  dropdown.innerHTML = zones.map(c => {
    const isLocalWeb = c.machineId === '__web__';
    return `
    <button class="plex-zone-item${selected?.machineId === c.machineId ? ' active' : ''}${isPlexWeb(c) ? ' plex-web-zone' : ''}"
      data-machine-id="${c.machineId}"
      data-name="${c.name}"
      data-product="${c.product}">
      <span class="plex-zone-icon">${isPlexWeb(c) || isLocalWeb ? '🌐' : '🔊'}</span>
      <span class="plex-zone-label">
        <span class="plex-zone-item-name">${c.name}</span>
        <small class="plex-zone-item-product">${isLocalWeb ? 'Speelt af in deze browser' : `${c.product}${isPlexWeb(c) ? ' · ⚠ beperkt' : ''}`}</small>
      </span>
      ${selected?.machineId === c.machineId ? '<span class="plex-zone-check">✓</span>' : ''}
    </button>
  `;
  }).join('') +
  (clients.some(isPlexWeb)
    ? `<div class="plex-zone-webwarning">⚠ Plex Web ondersteunt geen afstandsbediening via de API. Gebruik <strong>Plexamp</strong> voor volledige besturing.</div>`
    : '');

  dropdown.querySelectorAll('.plex-zone-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const product = btn.dataset.product || '';
      setSelectedZone({
        machineId: btn.dataset.machineId,
        name:      btn.dataset.name,
        product,
      });
      closeZonePicker();
      // Toon extra waarschuwing als Plex Web geselecteerd
      if (btn.dataset.machineId !== '__web__' && product.toLowerCase().includes('web')) {
        _showError('Plex Web ondersteunt geen afstandsbediening. Gebruik Plexamp voor play/pause/skip.');
      }
    });
  });
}

/** Controleer of de huidige geselecteerde zone een Plex Web client is. */
export function isWebZone() {
  const zone = getSelectedZone();
  return zone ? (zone.product || '').toLowerCase().includes('web') : false;
}

// ── Playback commando's ───────────────────────────────────────────────────

/**
 * Speel een item af op de geselecteerde zone.
 * Als er geen zone geselecteerd is, open dan de zone picker.
 * @param {string|number} ratingKey - Plex ratingKey van het album/track
 * @param {string} [type]           - mediatype ('music')
 * @returns {Promise<boolean>} true als afspelen gestart is
 */
export async function playOnZone(ratingKey, type = 'music') {
  const zone = getSelectedZone();
  if (!zone) {
    await toggleZonePicker();
    return false;
  }

  try {
    const res  = await fetch('/api/plex/play', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ machineId: zone.machineId, ratingKey: String(ratingKey), type }),
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || 'Afspelen mislukt');

    // Web player playback - gebruik HTML audio element
    if (data.webStream) {
      try {
        await playWebStream(data.webStream);
        _showPlayFeedback(`${zone.name} (Browser)`);
      } catch (e) {
        console.error('[Plex Remote] web stream fout:', e);
        _showError(`Afspelen in browser mislukt: ${e.message}`);
        return false;
      }
    } else {
      // Normale remote playback
      _showPlayFeedback(zone.name);
    }
    return true;
  } catch (e) {
    console.error('[Plex Remote] play fout:', e);
    _showError(`Afspelen mislukt: ${e.message}`);
    return false;
  }
}

/** Pauzeer/hervat afspelen op de geselecteerde zone. */
export async function pauseZone() {
  const zone = getSelectedZone();
  if (!zone) return;

  // Web player pauzeren
  if (zone.machineId === '__web__') {
    pauseWebPlayer();
    return;
  }

  await fetch('/api/plex/pause', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ machineId: zone.machineId }),
  }).catch(e => console.warn('[Plex Remote] pause fout:', e));
}

/** Sla over naar volgend/vorig nummer op de geselecteerde zone. */
export async function skipZone(direction = 'next') {
  const zone = getSelectedZone();
  if (!zone) return;
  if (zone.machineId === '__web__') return; // Web player kan niet op afstand bestuurd worden
  await fetch('/api/plex/skip', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ machineId: zone.machineId, direction }),
  }).catch(e => console.warn('[Plex Remote] skip fout:', e));
}

// ── Feedback toasts ───────────────────────────────────────────────────────

function _showPlayFeedback(zoneName) {
  _toast(`▶ Afspelen op ${zoneName}`, '#1db954');
}

function _showError(msg) {
  _toast(`⚠ ${msg}`, '#e05a2b');
}

function _toast(msg, bg = '#333') {
  const existing = document.getElementById('plex-remote-toast');
  if (existing) existing.remove();
  const el = document.createElement('div');
  el.id = 'plex-remote-toast';
  Object.assign(el.style, {
    position:     'fixed',
    bottom:       '80px',
    left:         '50%',
    transform:    'translateX(-50%)',
    background:   bg,
    color:        '#fff',
    padding:      '10px 20px',
    borderRadius: '8px',
    zIndex:       '9998',
    fontSize:     '13px',
    fontFamily:   'sans-serif',
    boxShadow:    '0 4px 16px rgba(0,0,0,0.35)',
    pointerEvents:'none',
    whiteSpace:   'nowrap',
  });
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

// ── Initialisatie ─────────────────────────────────────────────────────────

/**
 * Initialiseer de zone picker in de header.
 * Roep aan vanuit main.js na DOMContentLoaded.
 */
export function initZonePicker() {
  _updateZoneUI();

  document.getElementById('plex-zone-btn')?.addEventListener('click', e => {
    e.stopPropagation();
    toggleZonePicker();
  });

  // Sluit dropdown bij klik buiten de zone-wrap
  document.addEventListener('click', e => {
    const wrap = document.getElementById('plex-zone-wrap');
    if (wrap && !wrap.contains(e.target)) {
      closeZonePicker();
    }
  });
}
