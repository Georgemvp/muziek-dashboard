// ── In-memory cache voor API-responses ─────────────────────────────────────
// Voorkomt redundante API-aanroepen bij tab-wissels binnen TTL-window

const _cache = new Map();

/**
 * Haalt data uit cache als deze nog geldig is (niet verlopen)
 * @param {string} key - Cache key
 * @param {number} maxAgeMs - Maximale leeftijd in milliseconden (0 = altijd verlopen)
 * @returns {any|null} - Gecachede data of null als verlopen/niet aanwezig
 */
export function getCached(key, maxAgeMs) {
  // L1: in-memory (snelst)
  const mem = _cache.get(key);
  if (mem && (Date.now() - mem.timestamp <= maxAgeMs)) return mem.data;
  // L2: localStorage (overleeft refresh)
  try {
    const raw = localStorage.getItem('cache:' + key);
    if (raw) {
      const { data, ts } = JSON.parse(raw);
      if (Date.now() - ts <= maxAgeMs) {
        _cache.set(key, { data, timestamp: ts }); // promoveer naar L1
        return data;
      }
      localStorage.removeItem('cache:' + key);
    }
  } catch {}
  return null;
}

/**
 * Sla data op in cache met huidige timestamp
 * @param {string} key - Cache key
 * @param {any} data - Data om op te slaan
 */
export function setCache(key, data) {
  _cache.set(key, { data, timestamp: Date.now() });
  try {
    localStorage.setItem('cache:' + key, JSON.stringify({ data, ts: Date.now() }));
  } catch {} // quota exceeded = negeren
}

/**
 * Verwijder een cache-entry
 * @param {string} key - Cache key om te verwijderen
 */
export function invalidate(key) {
  _cache.delete(key);
  try { localStorage.removeItem('cache:' + key); } catch {}
}

/**
 * Wis alle cache entries
 */
export function clearAllCache() {
  _cache.clear();
  try {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('cache:')) keys.push(k);
    }
    keys.forEach(k => localStorage.removeItem(k));
  } catch {}
}

/**
 * Debug: toon huidige cache-inhoud
 */
export function debugCache() {
  console.log('Cache entries:', Array.from(_cache.entries()).map(([k, v]) => ({
    key: k,
    age: Date.now() - v.timestamp,
    dataType: typeof v.data
  })));
}
