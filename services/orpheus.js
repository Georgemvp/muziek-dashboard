// ── OrpheusDL service ─────────────────────────────────────────────────────────
// Integratie met OrpheusDL WebUI (https://github.com/OrpheusDL/orpheus-webui)
// voor het zoeken en downloaden van muziek via meerdere platforms:
// tidal, qobuz, deezer, spotify, soundcloud, applemusic, beatport, beatsource, youtube.
const fs   = require('fs');
const path = require('path');
const { getCache, setCache } = require('../db');

const ORPHEUS_URL         = (process.env.ORPHEUS_URL || 'http://localhost:5000').replace(/\/$/, '');
const ORPHEUS_CONFIG_PATH = process.env.ORPHEUS_CONFIG_PATH || '/app/orpheusdl/config/settings.json';
const ORPHEUS_DEFAULT_PATH = path.join(path.dirname(ORPHEUS_CONFIG_PATH), 'default_settings.json');

/** Ondersteunde platforms */
const PLATFORMS = ['tidal', 'qobuz', 'deezer', 'spotify', 'soundcloud', 'applemusic', 'beatport', 'beatsource', 'youtube'];

/** Kwaliteitsopties per platform */
const QUALITY_OPTIONS = {
  tidal:      ['atmos', 'hifi', 'lossless', 'high', 'low'],
  qobuz:      ['hifi', 'lossless', 'high'],
  deezer:     ['lossless', 'high', 'low'],
  spotify:    ['high', 'low'],
  soundcloud: ['high'],
  applemusic: ['high'],
  beatport:   ['lossless', 'high', 'low'],
  beatsource: ['lossless', 'high', 'low'],
  youtube:    ['lossless', 'high', 'low'],
};

// ── HTTP-hulpfunctie ──────────────────────────────────────────────────────────

/**
 * Doe een OrpheusDL API-aanroep met timeout.
 * Gooit een fout als de server niet bereikbaar is of een HTTP-fout retourneert.
 */
async function orpheusFetch(urlPath, options = {}) {
  const headers = {
    'Accept':       'application/json',
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const res = await fetch(`${ORPHEUS_URL}${urlPath}`, {
    ...options,
    headers,
    signal: AbortSignal.timeout(options.timeout || 20_000)
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`OrpheusDL HTTP ${res.status}${body ? ` - ${body.slice(0, 200)}` : ''}`);
  }

  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json') ? res.json() : res.text();
}

// ── Job-poller ────────────────────────────────────────────────────────────────

/**
 * Poll een job totdat deze klaar is (status 'done', 'error' of 'stopped').
 * Retourneert het volledige job-object: { status, log, progress }.
 *
 * @param {string}  jobId         - UUID van de job
 * @param {object}  [opts]
 * @param {number}  [opts.interval=1000]  - Pollinginterval in ms
 * @param {number}  [opts.maxWait=120000] - Maximale wachttijd in ms
 */
async function pollJob(jobId, { interval = 1_000, maxWait = 120_000 } = {}) {
  const deadline = Date.now() + maxWait;

  while (Date.now() < deadline) {
    const job = await orpheusFetch(`/api/job/${jobId}`, { timeout: 10_000 });
    const status = job?.status;

    if (status === 'done' || status === 'error' || status === 'stopped') {
      return job;
    }

    // Wacht interval voordat we opnieuw pollen
    await new Promise(r => setTimeout(r, interval));
  }

  throw new Error(`OrpheusDL job ${jobId} timed out na ${maxWait / 1000}s`);
}

// ── Log-parser voor zoekresultaten ────────────────────────────────────────────

/**
 * Parse OrpheusDL job-logregels naar genormaliseerde zoekresultaten.
 *
 * OrpheusDL-webui plaatst per resultaat een blok getagde regels in de log:
 *   1. Artiest - Titel (Jaar)
 *   |ID|12345|
 *   |PLATFORM|qobuz|
 *   |TYPE|album|
 *   |ARTIST|Artiest Naam|
 *   |TITLE|Album Titel|
 *   |YEAR|2023|
 *   |IMAGE|https://...|
 *   |URL|https://open.qobuz.com/album/12345|
 *
 * Retourneert array van genormaliseerde resultaten:
 *   [{ type, id, title, artist, image, url, year, platform, index }]
 */
function parseSearchLog(logLines) {
  if (!Array.isArray(logLines) || logLines.length === 0) return [];

  const results = [];
  let current   = null;
  let index     = 0;

  const tag = (line, name) => {
    const re = new RegExp(`\\|${name}\\|([^|]+)\\|`, 'i');
    const m  = (line || '').match(re);
    return m ? m[1].trim() : null;
  };

  for (const rawLine of logLines) {
    const line = typeof rawLine === 'string' ? rawLine : (rawLine?.message || rawLine?.text || String(rawLine || ''));

    // Nummerlijn → begin van een nieuw resultaat  (bijv. "1. Artist - Title")
    if (/^\d+\.\s/.test(line.trim())) {
      if (current && current.id) results.push(current);
      index++;
      current = { index };
      continue;
    }

    if (!current) continue;

    // Getagde velden
    const id       = tag(line, 'ID');
    const platform = tag(line, 'PLATFORM');
    const type     = tag(line, 'TYPE');
    const artist   = tag(line, 'ARTIST');
    const title    = tag(line, 'TITLE');
    const year     = tag(line, 'YEAR');
    const image    = tag(line, 'IMAGE');
    const url      = tag(line, 'URL');

    if (id)       current.id       = id;
    if (platform) current.platform = platform.toLowerCase();
    if (type)     current.type     = type.toLowerCase();
    if (artist)   current.artist   = artist;
    if (title)    current.title    = title;
    if (year)     current.year     = year;
    if (image)    current.image    = image;
    if (url)      current.url      = url;
  }

  // Laatste blok toevoegen
  if (current && current.id) results.push(current);

  // Vul ontbrekende velden op met lege standaardwaarden
  return results.map(r => ({
    index:    r.index    ?? 0,
    type:     r.type     || 'unknown',
    id:       r.id       || '',
    title:    r.title    || '',
    artist:   r.artist   || '',
    image:    r.image    || null,
    url:      r.url      || '',
    year:     r.year     || null,
    platform: r.platform || null,
  }));
}

// ── Publieke functies ─────────────────────────────────────────────────────────

/**
 * Voer één zoekopdracht uit voor een specifiek type en retourneer genormaliseerde resultaten.
 * Interne hulpfunctie gebruikt door searchOrpheus.
 *
 * @param {string} q        - Zoekterm (al getrimd)
 * @param {string} platform - Platform (of "all")
 * @param {string} type     - Specifiek type: "track" | "album" | "artist" | "playlist"
 * @returns {Promise<{ results: Array, jobId: string, status: string }>}
 */
async function searchOrpheusSingle(q, platform, type) {
  const { job_id: jobId } = await orpheusFetch('/api/search', {
    method: 'POST',
    body:   JSON.stringify({ platform, type, query: q })
  });

  if (!jobId) throw new Error(`OrpheusDL retourneerde geen job_id voor zoekopdracht (type=${type})`);

  const job = await pollJob(jobId, { interval: 800, maxWait: 60_000 });
  const results = parseSearchLog(job.log || []);
  return { results, jobId, status: job.status };
}

/**
 * Start een zoekopdracht via OrpheusDL, wacht tot de job klaar is en
 * retourneert genormaliseerde resultaten.
 *
 * @param {string} query    - Zoekterm
 * @param {string} platform - Platform (of "all" voor alle tegelijk)
 * @param {string} type     - "all" | "track" | "album" | "artist" | "playlist"
 *                            "all" voert parallelle zoekopdrachten uit voor elk type
 *                            en voegt de resultaten samen.
 * @returns {Promise<{ results: Array, jobId: string|null }>}
 */
async function searchOrpheus(query, platform = 'all', type = 'track') {
  const q = (query || '').trim();
  if (q.length < 2) return { results: [], jobId: null };

  const cacheKey = `orpheus:search:${platform}:${type}:${q.toLowerCase()}`;
  const cached   = getCache(cacheKey, 300_000); // 5 min
  if (cached) return cached;

  // type=all → parallelle zoekopdrachten per type, resultaten samenvoegen
  if (type === 'all') {
    const types   = ['track', 'album', 'artist', 'playlist'];
    const settled = await Promise.allSettled(
      types.map(t => searchOrpheusSingle(q, platform, t))
    );

    const allResults = [];
    let   lastJobId  = null;

    for (let i = 0; i < settled.length; i++) {
      const { status, value } = settled[i];
      if (status === 'fulfilled' && value.results.length > 0) {
        allResults.push(...value.results);
        lastJobId = value.jobId;
      }
    }

    const payload = { results: allResults, jobId: lastJobId, status: 'done' };

    if (allResults.length > 0) {
      setCache(cacheKey, payload);
    }

    return payload;
  }

  // Enkel type → één zoekopdracht
  const { results, jobId, status } = await searchOrpheusSingle(q, platform, type);
  const payload = { results, jobId, status };

  // Alleen cachen als de job succesvol was
  if (status === 'done' && results.length > 0) {
    setCache(cacheKey, payload);
  }

  return payload;
}

/**
 * Start een download-job voor een URL van een willekeurig ondersteund platform.
 * De URL bepaalt automatisch welk platform wordt gebruikt door OrpheusDL.
 *
 * @param {string} url      - Directe URL naar track/album/playlist
 * @param {string} quality  - Kwaliteitsoptie (platform-afhankelijk)
 * @returns {Promise<{ jobId: string }>}
 */
async function downloadOrpheus(url, quality = 'hifi') {
  if (!url) throw new Error('URL is verplicht voor downloadOrpheus');

  const { job_id: jobId } = await orpheusFetch('/api/download', {
    method: 'POST',
    body:   JSON.stringify({ url, quality })
  });

  if (!jobId) throw new Error('OrpheusDL retourneerde geen job_id voor download');
  return { jobId };
}

/**
 * Download een zoekresultaat op basis van zijn index in een eerdere search-job.
 *
 * @param {string} searchJobId - job_id van de zoekresultaten
 * @param {number} index       - 1-gebaseerde index van het resultaat
 * @param {string} quality     - Kwaliteitsoptie
 * @returns {Promise<{ jobId: string }>}
 */
async function downloadFromSearch(searchJobId, index, quality = 'hifi') {
  if (!searchJobId) throw new Error('searchJobId is verplicht');
  if (index == null) throw new Error('index is verplicht');

  const { job_id: jobId } = await orpheusFetch('/api/search/download', {
    method: 'POST',
    body:   JSON.stringify({ search_job_id: searchJobId, index, quality })
  });

  if (!jobId) throw new Error('OrpheusDL retourneerde geen job_id voor search/download');
  return { jobId };
}

/**
 * Haal de huidige status van een job op.
 *
 * @param {string} jobId
 * @returns {Promise<{ jobId: string, status: string, progress: number, log: Array }>}
 */
async function getOrpheusJobStatus(jobId) {
  if (!jobId) throw new Error('jobId is verplicht');

  const job = await orpheusFetch(`/api/job/${jobId}`, { timeout: 10_000 });
  return {
    jobId,
    status:   job.status   || 'unknown',
    progress: job.progress ?? 0,
    log:      job.log      || [],
  };
}

/**
 * Stop een actieve job.
 *
 * @param {string} jobId
 * @returns {Promise<object>}
 */
async function stopOrpheusJob(jobId) {
  if (!jobId) throw new Error('jobId is verplicht');

  return orpheusFetch(`/api/job/stop/${jobId}`, {
    method: 'POST',
    body:   JSON.stringify({})
  });
}

/**
 * Health-check: controleer of OrpheusDL bereikbaar is en welke platforms
 * geconfigureerd zijn (door te kijken naar aanwezige module-settings).
 *
 * @returns {Promise<{ connected: boolean, platforms: string[], quality: string|null }>}
 */
async function getOrpheusStatus() {
  try {
    const settings = await orpheusFetch('/api/settings', { timeout: 8_000 });

    // Detecteer geconfigureerde platforms op basis van aanwezige module-keys
    const modules = settings?.modules || settings?.module_settings || settings || {};
    const configured = PLATFORMS.filter(p =>
      modules[p] !== undefined ||
      modules[p.toLowerCase()] !== undefined
    );

    // Bepaal standaard kwaliteit (eerste niet-lege instelling)
    let quality = null;
    for (const p of configured) {
      const mod = modules[p] || modules[p.toLowerCase()] || {};
      if (mod.quality) { quality = mod.quality; break; }
    }

    return {
      connected: true,
      url:       ORPHEUS_URL,
      platforms: configured.length > 0 ? configured : PLATFORMS,
      quality,
    };
  } catch (e) {
    return {
      connected: false,
      url:       ORPHEUS_URL,
      platforms: [],
      quality:   null,
      reason:    e.message,
    };
  }
}

/**
 * Laad de standaard instellingen (uit default_settings.json of ingebouwde fallback).
 * @returns {object}
 */
function loadDefaultSettings() {
  try {
    if (fs.existsSync(ORPHEUS_DEFAULT_PATH)) {
      return JSON.parse(fs.readFileSync(ORPHEUS_DEFAULT_PATH, 'utf8'));
    }
  } catch { /* negeer leesfouten */ }
  // Minimale ingebouwde fallback
  return {
    global: {
      general:    { download_path: '/music', download_quality: 'hifi', search_limit: 20 },
      formatting: { album_format: '{artist}/{name}{explicit}', track_filename_format: '{track_number}. {name}' },
      covers:     { embed_cover: true, main_resolution: 1400 },
      lyrics:     { embed_lyrics: true, save_synced_lyrics: true },
    },
    module_settings: {}
  };
}

/**
 * Haal de volledige OrpheusDL-configuratie op.
 * Leest eerst het lokale settings.json; als dat niet bestaat wordt de default
 * aangemaakt. Valt terug op de OrpheusDL WebUI-API als het bestand niet
 * beschikbaar is (bijv. in dev-omgeving zonder volume).
 *
 * @returns {Promise<object>}
 */
async function getOrpheusSettings() {
  // Probeer bestand direct te lezen (snel, geen OrpheusDL vereist)
  try {
    if (fs.existsSync(ORPHEUS_CONFIG_PATH)) {
      const raw = fs.readFileSync(ORPHEUS_CONFIG_PATH, 'utf8');
      return JSON.parse(raw);
    }
    // Bestand bestaat niet → schrijf defaults en geef terug
    const defaults = loadDefaultSettings();
    fs.mkdirSync(path.dirname(ORPHEUS_CONFIG_PATH), { recursive: true });
    fs.writeFileSync(ORPHEUS_CONFIG_PATH, JSON.stringify(defaults, null, 2), 'utf8');
    return defaults;
  } catch (fileErr) {
    // Bestandstoegang mislukt (bijv. dev zonder volume) → probeer WebUI
    try {
      return await orpheusFetch('/api/settings', { timeout: 10_000 });
    } catch {
      // Retourneer defaults als alles mislukt
      return loadDefaultSettings();
    }
  }
}

/**
 * Bewaar OrpheusDL-configuratie.
 * Schrijft direct naar settings.json zodat OrpheusDL de wijzigingen oppikt bij
 * de volgende download. Probeert ook de WebUI te notificeren als die actief is.
 *
 * @param {object} data - Volledige of gedeeltelijke configuratie
 * @returns {Promise<object>}
 */
async function saveOrpheusSettings(data) {
  if (!data || typeof data !== 'object') throw new Error('data moet een object zijn');

  // Schrijf naar bestand (diep mergen zodat bestaande keys bewaard blijven)
  try {
    let existing = {};
    if (fs.existsSync(ORPHEUS_CONFIG_PATH)) {
      existing = JSON.parse(fs.readFileSync(ORPHEUS_CONFIG_PATH, 'utf8'));
    }
    // Deep merge: top-level secties worden samengevoegd, niet overschreven
    const merged = deepMerge(existing, data);
    fs.mkdirSync(path.dirname(ORPHEUS_CONFIG_PATH), { recursive: true });
    fs.writeFileSync(ORPHEUS_CONFIG_PATH, JSON.stringify(merged, null, 2), 'utf8');
  } catch (fileErr) {
    throw new Error(`Kan settings.json niet schrijven: ${fileErr.message}`);
  }

  // Probeer ook WebUI te notificeren (niet kritiek, negeer fouten)
  orpheusFetch('/api/settings', {
    method: 'POST', body: JSON.stringify(data), timeout: 5_000
  }).catch(() => {});

  return { ok: true };
}

/**
 * Recursieve deep-merge van twee objecten.
 * Arrays worden vervangen (niet samengevoegd).
 */
function deepMerge(target, source) {
  const out = Object.assign({}, target);
  for (const [k, v] of Object.entries(source)) {
    if (v && typeof v === 'object' && !Array.isArray(v) &&
        target[k] && typeof target[k] === 'object' && !Array.isArray(target[k])) {
      out[k] = deepMerge(target[k], v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

// ── Exports ───────────────────────────────────────────────────────────────────

module.exports = {
  // Zoeken & downloaden
  searchOrpheus,
  downloadOrpheus,
  downloadFromSearch,

  // Job-beheer
  getOrpheusJobStatus,
  stopOrpheusJob,
  pollJob,

  // Status & configuratie
  getOrpheusStatus,
  getOrpheusSettings,
  saveOrpheusSettings,

  // Constanten (handig voor frontend / routes)
  ORPHEUS_URL,
  PLATFORMS,
  QUALITY_OPTIONS,
};
