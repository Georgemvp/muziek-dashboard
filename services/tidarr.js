// ── Tidarr service ───────────────────────────────────────────────────────────
// Integratie met Tidarr (https://github.com/cstaelen/tidarr) voor het zoeken
// en downloaden van muziek via Tidal.
const { getCache, setCache } = require('../db');

const TIDARR_URL     = (process.env.TIDARR_URL || 'http://tidarr:8484').replace(/\/$/, '');
const TIDARR_API_KEY = process.env.TIDARR_API_KEY || '';

/** Doe een Tidarr-API-aanroep met timeout en optionele X-API-KEY header. */
async function tidarrFetch(urlPath, options = {}) {
  const headers = {
    'Accept':       'application/json',
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  if (TIDARR_API_KEY) headers['X-API-KEY'] = TIDARR_API_KEY;

  const res = await fetch(`${TIDARR_URL}${urlPath}`, {
    ...options,
    headers,
    signal: AbortSignal.timeout(options.timeout || 15_000)
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Tidarr HTTP ${res.status}${body ? ` - ${body.slice(0, 120)}` : ''}`);
  }
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json') ? res.json() : res.text();
}

/**
 * Zoek op Tidal via Tidarr. Retourneert een array van resultaten met
 * { type, id, title, artist, image, url }.
 */
async function searchTidal(query) {
  const q = (query || '').trim();
  if (q.length < 2) return { results: [] };

  const cacheKey = `tidarr:search:${q.toLowerCase()}`;
  const cached   = getCache(cacheKey, 300_000); // 5 min
  if (cached) return cached;

  try {
    const data = await tidarrFetch(`/api/tidal/search?query=${encodeURIComponent(q)}`);
    // Normaliseer: Tidarr kan albums en tracks terug geven.
    const albums = (data?.albums?.items || data?.albums || []).map(a => ({
      type:     'album',
      id:       a.id,
      title:    a.title,
      artist:   (a.artist?.name) || (a.artists?.[0]?.name) || '',
      image:    a.cover ? `https://resources.tidal.com/images/${String(a.cover).replace(/-/g, '/')}/320x320.jpg` : null,
      url:      a.url || `https://tidal.com/browse/album/${a.id}`,
      year:     a.releaseDate ? String(a.releaseDate).slice(0, 4) : null,
      tracks:   a.numberOfTracks || null
    }));
    const tracks = (data?.tracks?.items || data?.tracks || []).map(t => ({
      type:     'track',
      id:       t.id,
      title:    t.title,
      artist:   (t.artist?.name) || (t.artists?.[0]?.name) || '',
      album:    t.album?.title || '',
      image:    t.album?.cover ? `https://resources.tidal.com/images/${String(t.album.cover).replace(/-/g, '/')}/320x320.jpg` : null,
      url:      t.url || `https://tidal.com/browse/track/${t.id}`,
      duration: t.duration || null
    }));

    const result = { results: [...albums, ...tracks] };
    setCache(cacheKey, result);
    return result;
  } catch (e) {
    return { error: e.message, results: [] };
  }
}

/**
 * Voeg een Tidal-URL toe aan de download-queue. De URL wijst naar een
 * album- of track-pagina op tidal.com.
 */
async function addToQueue(url) {
  if (!url) throw new Error('URL is verplicht');
  return tidarrFetch('/api/processing/add', {
    method: 'POST',
    body:   JSON.stringify({ url })
  });
}

/** Geeft de huidige download-queue terug. */
async function getQueue() {
  try {
    const data = await tidarrFetch('/api/processing/list');
    const items = (data?.items || data || []).map(it => ({
      id:       it.id,
      title:    it.title || it.name || '',
      artist:   it.artist || '',
      status:   it.status || 'queued',
      progress: typeof it.progress === 'number' ? it.progress : null,
      url:      it.url || null,
      addedAt:  it.addedAt || it.created_at || null
    }));
    return { items };
  } catch (e) {
    return { error: e.message, items: [] };
  }
}

/** Geeft de download-historie terug (afgeronde downloads). */
async function getHistory() {
  try {
    const data = await tidarrFetch('/api/processing/history');
    const items = (data?.items || data || []).map(it => ({
      id:           it.id,
      title:        it.title || it.name || '',
      artist:       it.artist || '',
      status:       it.status || 'completed',
      completedAt:  it.completedAt || it.finished_at || it.updated_at || null,
      url:          it.url || null
    }));
    return { items };
  } catch (e) {
    return { error: e.message, items: [] };
  }
}

/** Verwijder een item uit de queue op basis van id. */
async function removeFromQueue(id) {
  if (!id) throw new Error('id is verplicht');
  return tidarrFetch(`/api/processing/delete/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

/** Status / health-check tegen Tidarr. */
async function getTidarrStatus() {
  try {
    const data = await tidarrFetch('/api/config', { timeout: 5_000 });
    return {
      connected:   true,
      url:         TIDARR_URL,
      version:     data?.version || null,
      quality:     data?.quality || data?.tidal_quality || null
    };
  } catch (e) {
    return { connected: false, url: TIDARR_URL, reason: e.message };
  }
}

module.exports = {
  searchTidal,
  addToQueue,
  getQueue,
  getHistory,
  removeFromQueue,
  getTidarrStatus,
  TIDARR_URL
};
