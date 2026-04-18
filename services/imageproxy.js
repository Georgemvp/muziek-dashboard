// ── Image Proxy Service ────────────────────────────────────────────────────
// Haalt externe afbeeldingen op, resizet ze met sharp en cached ze op disk.
// Cache-key: MD5 hash van url + width. Uitvoerformaat: WebP (default) of JPEG.

const fs   = require('fs');
const path = require('path');
const crypto = require('crypto');

const CACHE_DIR = path.join(__dirname, '..', 'data', 'image-cache');
const MAX_WIDTH = 400;

// Zorg dat de cache-map bestaat bij opstarten
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

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
 * Cached het resultaat op disk.
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

  // Serveer vanuit cache als aanwezig
  if (fs.existsSync(cachePath)) {
    return fs.readFileSync(cachePath);
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

  // Sla op in cache (schrijf atomisch via tijdelijk bestand)
  const tmp = cachePath + '.tmp';
  try {
    fs.writeFileSync(tmp, output);
    fs.renameSync(tmp, cachePath);
  } catch (writeErr) {
    try { fs.unlinkSync(tmp); } catch {}
    throw writeErr;
  }

  return output;
}

module.exports = { proxyImage };
