// ── MediaSage API client ───────────────────────────────────────────────────
// Thin wrapper rond de MediaSage FastAPI backend (poort 5765).
// Alle requests lopen via de reverse proxy op /mediasage/*, zodat de browser
// geen cross-origin issues heeft. Paden worden door de proxy herschreven:
//   /mediasage/api/...  →  /api/...  (op de FastAPI backend)
import { apiFetch } from '../api.js';

const BASE = '/mediasage/api';

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * POST-verzoek naar MediaSage met een JSON-body.
 * @param {string} path  - Relatief pad (bijv. '/generate')
 * @param {object} body  - Te serialiseren body
 * @returns {Promise<any>}
 */
async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`MediaSage fout ${res.status}: ${res.statusText}`);
  return res.json();
}

/**
 * DELETE-verzoek naar MediaSage.
 * @param {string} path - Relatief pad
 * @returns {Promise<any>}
 */
async function del(path) {
  const res = await fetch(`${BASE}${path}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`MediaSage fout ${res.status}: ${res.statusText}`);
  return res.json();
}

// ── Library ────────────────────────────────────────────────────────────────

/** Statistieken van de gesynchroniseerde bibliotheek. */
export async function getLibraryStats() {
  return apiFetch(`${BASE}/library/stats`);
}

/** Huidige synchronisatiestatus van de bibliotheek. */
export async function getLibraryStatus() {
  return apiFetch(`${BASE}/library/status`);
}

/** Start een volledige bibliotheeksynchronisatie met Plex. */
export async function syncLibrary() {
  return post('/library/sync', {});
}

/**
 * Zoek door de gesynchroniseerde bibliotheek.
 * @param {string} query - Zoekterm
 */
export async function searchLibrary(query) {
  return apiFetch(`${BASE}/library/search?q=${encodeURIComponent(query)}`);
}

// ── Playlist generatie ─────────────────────────────────────────────────────

/**
 * Analyseer een vrije tekstprompt voor playlist-aanmaken.
 * @param {string} prompt   - Gebruikersprompt
 * @param {object} [filters] - Optionele extra filters
 */
export async function analyzePrompt(prompt, filters = {}) {
  return post('/analyze/prompt', { prompt, ...filters });
}

/**
 * Analyseer één track voor stijlherkenning.
 * @param {object} trackData - Track-metadata object
 */
export async function analyzeTrack(trackData) {
  return post('/analyze/track', trackData);
}

/**
 * Geef een preview van het aantal tracks dat voldoet aan de filters.
 * @param {object} filters - Filterobject
 */
export async function filterPreview(filters) {
  return post('/filter/preview', filters);
}

/**
 * Genereer een playlist op basis van een configuratie.
 * @param {object} config - Playlist-configuratie
 */
export async function generatePlaylist(config) {
  return post('/generate', config);
}

/**
 * Sla een gegenereerde playlist op in de database.
 * @param {object} playlistData
 */
export async function savePlaylist(playlistData) {
  return post('/playlist', playlistData);
}

/**
 * Werk een bestaande opgeslagen playlist bij.
 * @param {object} playlistData
 */
export async function updatePlaylist(playlistData) {
  return post('/playlist/update', playlistData);
}

// ── Album aanbevelingen ────────────────────────────────────────────────────

/**
 * Analyseer een aanbevelingsprompt.
 * @param {string} prompt
 */
export async function recommendAnalyzePrompt(prompt) {
  return post('/recommend/analyze-prompt', { prompt });
}

/**
 * Genereer verfijningsvragen voor album-aanbevelingen.
 * @param {object} config
 */
export async function recommendQuestions(config) {
  return post('/recommend/questions', config);
}

/**
 * Genereer definitieve album-aanbevelingen.
 * @param {object} config
 */
export async function recommendGenerate(config) {
  return post('/recommend/generate', config);
}

/**
 * Wissel tussen aanbevelingsmodi (bijv. 'discover' / 'library').
 * @param {string} mode
 */
export async function recommendSwitchMode(mode) {
  return post('/recommend/switch-mode', { mode });
}

/**
 * Geef een preview van aanbevolen albums op basis van filters.
 * @param {object} filters - Filterobject (wordt als query-params meegegeven)
 */
export async function recommendAlbumPreview(filters = {}) {
  const params = new URLSearchParams(
    Object.entries(filters).filter(([, v]) => v !== undefined && v !== null)
  ).toString();
  const qs = params ? `?${params}` : '';
  return apiFetch(`${BASE}/recommend/albums/preview${qs}`);
}

// ── Plex / Playback ────────────────────────────────────────────────────────

/** Haal beschikbare Plex-clients (players) op. */
export async function getPlexClients() {
  return apiFetch(`${BASE}/plex/clients`);
}

/** Haal Plex-playlists op. */
export async function getPlexPlaylists() {
  return apiFetch(`${BASE}/plex/playlists`);
}

/**
 * Zet een reeks tracks in de Plex-afspeelwachtrij.
 * @param {string[]} ratingKeys - Plex ratingKey-waarden
 * @param {string}   clientId   - Doel-Plex-client
 */
export async function playQueue(ratingKeys, clientId) {
  return post('/play-queue', { rating_keys: ratingKeys, client_id: clientId });
}

// ── Overig ─────────────────────────────────────────────────────────────────

/**
 * Retourneer de URL voor albumhoes van een Plex-item (geen fetch nodig).
 * @param {string|number} ratingKey
 * @returns {string}
 */
export function getAlbumArt(ratingKey) {
  return `${BASE}/art/${ratingKey}`;
}

/** Huidige MediaSage-configuratie. */
export async function getConfig() {
  return apiFetch(`${BASE}/config`);
}

/** Health-check. */
export async function getHealth() {
  return apiFetch(`${BASE}/health`);
}

/** Haal alle opgeslagen resultaten op. */
export async function getResults() {
  return apiFetch(`${BASE}/results`);
}

/**
 * Haal één opgeslagen resultaat op.
 * @param {string|number} id
 */
export async function getResult(id) {
  return apiFetch(`${BASE}/results/${id}`);
}

/**
 * Verwijder een opgeslagen resultaat.
 * @param {string|number} id
 */
export async function deleteResult(id) {
  return del(`/results/${id}`);
}

// ── SSE streaming ──────────────────────────────────────────────────────────

/**
 * Stream playlist-generatie via Server-Sent Events.
 *
 * Voorbeeld:
 *   const abort = streamPlaylist(config, track => console.log(track),
 *                                result => console.log('Klaar', result),
 *                                err   => console.error(err));
 *   // Annuleren:
 *   abort.abort();
 *
 * @param {object}   config           - Playlist-configuratie (zelfde als generatePlaylist)
 * @param {Function} onTrack          - Wordt aangeroepen per binnenkomend track-event
 * @param {Function} onDone           - Wordt aangeroepen met eindresultaat bij 'done'
 * @param {Function} onError          - Wordt aangeroepen bij netwerk- of parseerfouten
 * @returns {AbortController}         - Roep .abort() aan om de stream te stoppen
 */
export function streamPlaylist(config, onTrack, onDone, onError) {
  const controller = new AbortController();
  const { signal } = controller;

  (async () => {
    let res;
    try {
      res = await fetch(`${BASE}/generate/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
        signal,
      });
    } catch (err) {
      if (err.name !== 'AbortError') onError(err);
      return;
    }

    if (!res.ok) {
      onError(new Error(`MediaSage stream fout ${res.status}: ${res.statusText}`));
      return;
    }

    const reader  = res.body.getReader();
    const decoder = new TextDecoder();
    let   buffer  = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // SSE-berichten worden gescheiden door dubbele newlines
        const parts = buffer.split(/\n\n/);
        // Bewaar het laatste (mogelijk onvolledige) stuk
        buffer = parts.pop();

        for (const part of parts) {
          // Haal 'data: ...' regels op uit het SSE-blok
          const dataLines = part
            .split('\n')
            .filter(line => line.startsWith('data:'))
            .map(line => line.slice(5).trim());

          if (!dataLines.length) continue;

          const raw = dataLines.join('\n');
          let parsed;
          try {
            parsed = JSON.parse(raw);
          } catch {
            // Geen geldige JSON — sla over
            continue;
          }

          if (parsed.event === 'done' || parsed.done === true) {
            onDone(parsed);
          } else {
            onTrack(parsed);
          }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') onError(err);
    } finally {
      reader.releaseLock();
    }
  })();

  return controller;
}
