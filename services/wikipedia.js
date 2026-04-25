// ── Wikipedia service: fetch artist extracts met fallback NL → EN ─────────────
const { getCache, setCache } = require('../db.js');
const logger = require('../logger');

const WIKI_NL = 'https://nl.wikipedia.org/api/rest_v1/page/summary/';
const WIKI_EN = 'https://en.wikipedia.org/api/rest_v1/page/summary/';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 dagen

/**
 * Haal een Wikipedia-extract op voor een artiest.
 * Probeert eerst Nederlands → fallback Engels.
 * Cacheert 7 dagen.
 *
 * @param {string} artistName - Artiestennaam
 * @returns {Promise<{extract, url, thumbnail, title, lang} | null>}
 */
async function getWikipediaExtract(artistName) {
  if (!artistName || typeof artistName !== 'string') {
    logger.warn({ artistName }, 'Invalid artist name for Wikipedia lookup');
    return null;
  }

  const cacheKey = `wiki:${artistName.toLowerCase()}`;

  // ── Check cache eerst (TTL: 7 dagen) ────────────────────────────────────
  const cached = getCache(cacheKey, CACHE_TTL);
  if (cached) {
    logger.trace({ artistName, cacheKey }, 'Wikipedia cache hit');
    return cached;
  }

  try {
    // ── Probeer Nederlands Wikipedia ────────────────────────────────────────
    let result = await fetchWikipediaPage(artistName, WIKI_NL, 'nl');

    // ── Fallback naar Engels Wikipedia als niet gevonden ──────────────────
    if (!result && artistName) {
      result = await fetchWikipediaPage(artistName, WIKI_EN, 'en');
    }

    // ── Cache het resultaat (ook als null) ───────────────────────────────
    if (result) {
      setCache(cacheKey, result);
      logger.debug({ artistName, lang: result.lang }, 'Wikipedia extract cached');
    } else {
      // Cache null-resultaat voor 7 dagen om herhaalde requests te vermijden
      setCache(cacheKey, null);
      logger.debug({ artistName }, 'Wikipedia extract not found, cached null');
    }

    return result;
  } catch (err) {
    logger.warn({ artistName, err: err.message }, 'Wikipedia lookup failed');
    return null;
  }
}

/**
 * Haal een Wikipedia-pagina op van een specifieke taal.
 * @private
 */
async function fetchWikipediaPage(artistName, baseUrl, lang) {
  try {
    const url = baseUrl + encodeURIComponent(artistName);

    const res = await fetch(url, {
      signal: AbortSignal.timeout(5000),
      headers: { 'User-Agent': 'LastFM-Music-Dashboard' }
    });

    if (!res.ok) {
      logger.trace({ artistName, lang, status: res.status }, 'Wikipedia page not found');
      return null;
    }

    const data = await res.json();

    // Check of het resultaat een werkelijke pagina is (en geen redirect/error)
    if (!data.extract || data.type === 'not-found') {
      logger.trace({ artistName, lang }, 'Wikipedia page has no extract');
      return null;
    }

    // Extraheer het thumbnail (kan null zijn)
    const thumbnail = data.thumbnail?.source || null;

    // Retourneer gecleaned-up resultaat
    return {
      extract: cleanExtract(data.extract),
      url: data.content_urls?.desktop?.page || null,
      thumbnail,
      title: data.title || artistName,
      lang
    };
  } catch (err) {
    // Timeout, network error, etc.
    if (err.name === 'AbortError') {
      logger.trace({ artistName, lang }, 'Wikipedia fetch timeout');
    } else {
      logger.trace({ artistName, lang, err: err.message }, 'Wikipedia fetch error');
    }
    return null;
  }
}

/**
 * Clean up Wikipedia extract:
 * - Verwijder markdown-achtige links
 * - Trunceer naar ~300 karakters als te lang
 */
function cleanExtract(extract) {
  if (!extract) return null;

  // Verwijder links in formaat [text](url) → text
  let cleaned = extract.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');

  // Verwijder HTML entities
  cleaned = cleaned
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"');

  // Trunceer naar ~300 karakters + voeg ... toe als langer
  if (cleaned.length > 300) {
    cleaned = cleaned.substring(0, 300).trim() + '…';
  }

  return cleaned.trim();
}

module.exports = { getWikipediaExtract };
