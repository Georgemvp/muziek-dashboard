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
  const entry = _cache.get(key);
  if (!entry) return null;

  const age = Date.now() - entry.timestamp;
  if (age > maxAgeMs) {
    _cache.delete(key);
    return null;
  }

  return entry.data;
}

/**
 * Sla data op in cache met huidige timestamp
 * @param {string} key - Cache key
 * @param {any} data - Data om op te slaan
 */
export function setCache(key, data) {
  _cache.set(key, {
    data,
    timestamp: Date.now()
  });
}

/**
 * Verwijder een cache-entry
 * @param {string} key - Cache key om te verwijderen
 */
export function invalidate(key) {
  _cache.delete(key);
}

/**
 * Wis alle cache entries
 */
export function clearAllCache() {
  _cache.clear();
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
