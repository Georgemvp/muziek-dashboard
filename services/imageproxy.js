// ── Image Proxy Service ────────────────────────────────────────────────────
// Haalt externe afbeeldingen op, resizet ze met sharp en cached ze op disk.
// Cache-key: MD5 hash van url + width. Uitvoerformaat: WebP (default) of JPEG.
// Gebruikt async file operations en een in-memory LRU cache voor prestaties.

const fs   = require('fs');
const path = require('path');
const crypto = require('crypto');

const CACHE_DIR = path.join(__dirname, '..', 'data', 'image-cache');
const MAX_WIDTH = 400;
const MAX_MEMORY_CACHE_SIZE = 200;

/**
 * In-memory LRU (Least Recently Used) cache voor afbeeldingsbuffers
 * Voorkomt dat veelgebruikte afbeeldingen telkens van disk gelezen hoeven te worden
 */
class LRUCache {
  constructor(maxSize) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  get(key) {
    if (!this.cache.has(key)) {
      return null;
    }
    // Verplaats naar einde (meest recent gebruikt)
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    this.cache.set(key, value);

    // Verwijder oudste (minst recent gebruikt) als over capaciteit
    if (this.cache.size > this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }
}

const memoryCache = new LRUCache(MAX_MEMORY_CACHE_SIZE);

// Zorg dat de cache-map bestaat bij opstarten
async function initializeCacheDir() {
  try {
    await fs.promises.access(CACHE_DIR);
  } catch (err) {
    await fs.promises.mkdir(CACHE_DIR, { recursive: true });
  }
}

// Initialiseer bij module load
initializeCacheDir().catch(err => {
  console.error('Fout bij initialisatie van image cache dir:', err);
});

/**
 * Genereer een cache-sleutel (MD5 van url + width).
 * @param {string} url
 * @param {number} width
 * @param {string} format  'webp' | 'jpeg'
 * @returns {string} absoluut pad naar het cache-bestand
 */
function cacheFilePath(url, width, format) {
  const hash = crypto.createHash('md5').update(`${url}:${width}`).digest('hex');
  const ext  = format === 'jpeg' ? 'jpg' : 'webp';
  return path.join(CACHE_DIR, `${hash}.${ext}`);
}

/**
 * Haal een afbeelding op, resize en converteer naar WebP (of JPEG).
 * Cached het resultaat op disk en in-memory (LRU).
 *
 * @param {string} url      De externe afbeelding-URL
 * @param {number} width    Gewenste breedte in px (max MAX_WIDTH)
 * @param {number} height   Gewenste hoogte in px (0 = auto)
 * @param {string} format   'webp' (default) | 'jpeg'
 * @returns {Promise<Buffer>}
 */
async function proxyImage(url, width = 120, height = 0, format = 'webp') {
  // Valideer parameters
  const w = Math.min(Math.max(1, parseInt(width)  || 120), MAX_WIDTH);
  const h = parseInt(height) || 0;
  const fmt = format === 'jpeg' ? 'jpeg' : 'webp';

  const cachePath = cacheFilePath(url, w, fmt);

  // Check in-memory cache eerst (snelste)
  let cachedBuffer = memoryCache.get(cachePath);
  if (cachedBuffer) {
    return cachedBuffer;
  }

  // Serveer vanuit disk cache als aanwezig
  try {
    await fs.promises.access(cachePath);
    const fileBuffer = await fs.promises.readFile(cachePath);
    // Voeg toe aan memory cache voor volgende keer
    memoryCache.set(cachePath, fileBuffer);
    return fileBuffer;
  } catch (err) {
    // Bestand bestaat niet, ga door met fetchen en processing
  }

  // Laad sharp (pas bij eerste gebruik zodat import-fouten vroeg opvallen)
  let sharp;
  try {
    sharp = require('sharp');
  } catch (e) {
    throw new Error('sharp is niet geïnstalleerd: ' + e.message);
  }

  // Haal de afbeelding op
  const response = await fetch(url, {
    signal: AbortSignal.timeout(8_000),
    headers: { 'User-Agent': 'lastfm-app/imageproxy' }
  });
  if (!response.ok) {
    throw new Error(`Upstream ${response.status} voor ${url}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());

  // Verwerk met sharp
  let pipeline = sharp(buffer).resize(
    w,
    h > 0 ? h : null,
    { fit: 'cover', withoutEnlargement: true }
  );

  if (fmt === 'jpeg') {
    pipeline = pipeline.jpeg({ quality: 85, progressive: true });
  } else {
    pipeline = pipeline.webp({ quality: 82, effort: 4 });
  }

  const output = await pipeline.toBuffer();

  // Sla op in cache (schrijf atomisch via tijdelijk bestand, async)
  const tmp = cachePath + '.tmp';
  try {
    await fs.promises.writeFile(tmp, output);
    await fs.promises.rename(tmp, cachePath);
  } catch (writeErr) {
    try { await fs.promises.unlink(tmp); } catch {}
    throw writeErr;
  }

  // Voeg toe aan memory cache
  memoryCache.set(cachePath, output);

  return output;
}

module.exports = { proxyImage };
