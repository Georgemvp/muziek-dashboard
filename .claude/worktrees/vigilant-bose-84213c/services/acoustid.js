// ── AcoustID Audio Fingerprint Verificatie ────────────────────────────────────
// Gebruikt fpcalc (Chromaprint) om audiobestanden te fingerprinen en vergelijkt
// die via de AcoustID API met de verwachte metadata.
//
// Rate-limit: AcoustID staat 3 req/s toe → queue met 350ms vertraging.
// fpcalc kan ~5s duren per bestand → max 1 tegelijk.
'use strict';

const { execFile }  = require('child_process');
const { promisify } = require('util');
const path          = require('path');
const fs            = require('fs');

const logger = require('../logger').child({ service: 'acoustid' });

const execFileAsync = promisify(execFile);

// ── Levenshtein distance (lichtgewicht, geen dependency) ───────────────────
function levenshtein(a, b) {
  a = String(a || '');
  b = String(b || '');
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = i;
    for (let j = 1; j <= b.length; j++) {
      const val = a[i - 1] === b[j - 1] ? row[j - 1] : Math.min(row[j - 1], row[j], prev) + 1;
      row[j - 1] = prev;
      prev = val;
    }
    row[b.length] = prev;
  }
  return row[b.length];
}

/** Normaliseer tekst voor vergelijking: lowercase, haal leestekens en 'the' weg. */
function normalize(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/^the\s+/i, '')
    .replace(/[''`]/g, "'")
    .replace(/[^\w\s']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Fuzzy match score 0.0–1.0 op basis van Levenshtein.
 * 1.0 = perfecte match, 0.0 = volledig anders.
 */
function fuzzyScore(a, b) {
  const na = normalize(a);
  const nb = normalize(b);
  if (!na || !nb) return 0;
  if (na === nb)  return 1;
  const dist = levenshtein(na, nb);
  const maxLen = Math.max(na.length, nb.length);
  return Math.max(0, 1 - dist / maxLen);
}

// ── AcoustID rate-limiter (max 1 fpcalc tegelijk, 350ms delay per API call) ──
class RateLimitedQueue {
  constructor(delayMs = 350) {
    this._delayMs = delayMs;
    this._chain   = Promise.resolve();
  }

  /** Voer fn na de vorige call uit, met minimale vertraging ertussen. */
  enqueue(fn) {
    const p = this._chain.then(async () => {
      await new Promise(r => setTimeout(r, this._delayMs));
      return fn();
    });
    this._chain = p.catch(() => {});
    return p;
  }
}

// fpcalc: max 1 tegelijk (kan lang duren)
class SingleQueue {
  constructor() {
    this._chain = Promise.resolve();
  }

  enqueue(fn) {
    const p = this._chain.then(() => fn());
    this._chain = p.catch(() => {});
    return p;
  }
}

const fpcalcQueue  = new SingleQueue();
const acoustidRate = new RateLimitedQueue(350);

// ── Versie-keywords die "verkeerde versie" aanduiden ──────────────────────
const VERSION_KEYWORDS = [
  'live', 'remix', 'cover', 'acoustic', 'demo', 'instrumental',
  'radio edit', 'extended', 'remaster', 'remastered', 'reprise',
  'acapella', 'a cappella', 'karaoke', 'medley', 'mix', 'version',
  'edit', 'dub', 'orchestral', 'stripped',
];

// ── AcoustID service ──────────────────────────────────────────────────────────

class AcoustIDService {
  /**
   * @param {object} opts
   * @param {Function} opts.getApiKey  - () => string | null  (laadt uit settings)
   */
  constructor(opts = {}) {
    this._getApiKey = opts.getApiKey || (() => null);
  }

  // ── 1. Fingerprint ───────────────────────────────────────────────────────

  /**
   * Genereer een audio fingerprint met fpcalc.
   * @param {string} filePath - Pad naar het audiobestand
   * @returns {Promise<{ duration: number, fingerprint: string }>}
   */
  async fingerprint(filePath) {
    try {
      await fs.promises.access(filePath, fs.constants.R_OK);
    } catch {
      throw new Error(`Bestand niet toegankelijk: ${filePath}`);
    }

    logger.debug({ filePath }, 'fpcalc gestart');

    const { stdout } = await fpcalcQueue.enqueue(() =>
      execFileAsync('fpcalc', ['-json', filePath], { timeout: 60_000 })
    );

    let parsed;
    try {
      parsed = JSON.parse(stdout);
    } catch {
      throw new Error('fpcalc leverde ongeldige JSON op');
    }

    if (!parsed.fingerprint || !parsed.duration) {
      throw new Error('fpcalc: fingerprint of duration ontbreekt in output');
    }

    logger.debug({ filePath, duration: parsed.duration }, 'Fingerprint gegenereerd');
    return { duration: Math.round(parsed.duration), fingerprint: parsed.fingerprint };
  }

  // ── 2. Identify ──────────────────────────────────────────────────────────

  /**
   * Identificeer een bestand via AcoustID API.
   * @param {string} filePath
   * @returns {Promise<{ recordings: Array, score: number, rawResults: Array }>}
   */
  async identify(filePath) {
    const apiKey = this._getApiKey();
    if (!apiKey) throw new Error('Geen AcoustID API key geconfigureerd (postprocess.acoustid_api_key)');

    const { duration, fingerprint } = await this.fingerprint(filePath);

    const params = new URLSearchParams({
      client:      apiKey,
      duration:    String(duration),
      fingerprint: fingerprint,
      meta:        'recordings+releasegroups',
    });

    logger.debug({ filePath }, 'AcoustID API query');

    const resp = await acoustidRate.enqueue(() =>
      fetch(`https://api.acoustid.org/v2/lookup?${params}`, {
        headers: { 'User-Agent': 'LastfmApp/2.0 (+https://github.com/user/lastfm-app)' },
        signal:  AbortSignal.timeout(15_000),
      })
    );

    if (!resp.ok) throw new Error(`AcoustID API HTTP ${resp.status}`);

    const data = await resp.json();
    if (data.status !== 'ok') throw new Error(`AcoustID status: ${data.status}`);

    const rawResults = data.results || [];

    // Sorteer op score (hoogste eerst)
    rawResults.sort((a, b) => (b.score || 0) - (a.score || 0));

    const recordings = rawResults.flatMap(result => {
      const score = result.score || 0;
      return (result.recordings || []).map(rec => ({
        id:            rec.id,
        title:         rec.title || '',
        score,
        artists:       (rec.artists || []).map(a => a.name || '').filter(Boolean),
        releaseGroups: (rec.releasegroups || []).map(rg => ({
          id:    rg.id,
          title: rg.title || '',
          type:  rg.type  || '',
        })),
      }));
    });

    const topScore = rawResults[0]?.score || 0;
    return { recordings, score: topScore, rawResults };
  }

  // ── 3. Verify ────────────────────────────────────────────────────────────

  /**
   * Verifieer of een audiobestand overeenkomt met de verwachte metadata.
   *
   * @param {string} filePath
   * @param {{ artist: string, title: string, album?: string, mbid?: string }} expectedTrack
   * @returns {Promise<{
   *   verified: boolean,
   *   confidence: number,
   *   matchedRecording: object|null,
   *   mismatchReason: string|null,
   *   score: number,
   *   fingerprint: string,
   *   duration: number
   * }>}
   */
  async verify(filePath, expectedTrack) {
    const { artist = '', title = '', album = '', mbid = '' } = expectedTrack || {};

    let fingerprintData = { duration: 0, fingerprint: '' };
    let identifyResult  = { recordings: [], score: 0 };

    try {
      fingerprintData = await this.fingerprint(filePath);
      identifyResult  = await this.identify(filePath);
    } catch (err) {
      logger.warn({ err: err.message, filePath }, 'AcoustID identify mislukt');
      return {
        verified:         false,
        confidence:       0,
        matchedRecording: null,
        mismatchReason:   `Identificatie mislukt: ${err.message}`,
        score:            0,
        fingerprint:      fingerprintData.fingerprint,
        duration:         fingerprintData.duration,
      };
    }

    const { recordings, score } = identifyResult;

    if (!recordings.length) {
      return {
        verified:         false,
        confidence:       0,
        matchedRecording: null,
        mismatchReason:   'Geen overeenkomsten gevonden in AcoustID database',
        score,
        fingerprint:      fingerprintData.fingerprint,
        duration:         fingerprintData.duration,
      };
    }

    // ── Scoor elke recording tegen verwachte metadata ─────────────────────
    const lExpArtist = normalize(artist);
    const lExpTitle  = normalize(title);

    const scored = recordings.map(rec => {
      let confidence = 0;
      let method     = 'geen match';

      // 1. MBID exacte match
      if (mbid && rec.id === mbid) {
        confidence = 1.0;
        method     = 'mbid';
      } else {
        // 2. Fuzzy titel + artiest match
        const titleScore  = fuzzyScore(title, rec.title);
        const artistScore = rec.artists.length
          ? Math.max(...rec.artists.map(a => fuzzyScore(artist, a)))
          : 0;

        confidence = (titleScore * 0.6) + (artistScore * 0.4);
        method     = 'fuzzy';
      }

      // Weeg de AcoustID score mee (hoe zeker de fingerprint match is)
      confidence = confidence * 0.8 + score * 0.2;

      return { ...rec, confidence, method };
    });

    // Kies de beste match
    scored.sort((a, b) => b.confidence - a.confidence);
    const best = scored[0];

    // ── Detecteer versie-mismatch ─────────────────────────────────────────
    let mismatchReason = null;

    const titleHasVersion  = VERSION_KEYWORDS.some(kw => normalize(title).includes(kw));
    const matchHasVersion  = VERSION_KEYWORDS.some(kw => normalize(best.title).includes(kw));

    if (!titleHasVersion && matchHasVersion) {
      // Verwacht: originele versie, gevonden: speciale versie
      const foundKw = VERSION_KEYWORDS.find(kw => normalize(best.title).includes(kw));
      mismatchReason = `Mogelijk verkeerde versie: gevonden "${best.title}" (${foundKw})`;
    } else if (best.confidence < 0.5) {
      mismatchReason = `Lage confidence (${(best.confidence * 100).toFixed(0)}%): verwacht "${artist} – ${title}", gevonden "${best.artists.join(', ')} – ${best.title}"`;
    }

    const verified = best.confidence >= 0.7 && !mismatchReason;

    logger.info({
      filePath,
      expected:   `${artist} – ${title}`,
      matched:    `${best.artists.join(', ')} – ${best.title}`,
      confidence: best.confidence.toFixed(3),
      verified,
      mismatchReason,
    }, verified ? '✓ Verificatie OK' : '⚠ Verificatie mismatch');

    return {
      verified,
      confidence:       best.confidence,
      matchedRecording: {
        id:      best.id,
        title:   best.title,
        artists: best.artists,
      },
      mismatchReason,
      score,
      fingerprint: fingerprintData.fingerprint,
      duration:    fingerprintData.duration,
    };
  }

  // ── 4. Batch verify ──────────────────────────────────────────────────────

  /**
   * Verifieer alle audiobestanden in een albummap.
   * @param {string} albumPath - Pad naar de albummap
   * @returns {Promise<{ total, verified, mismatched, errors, details: Array }>}
   */
  async batchVerify(albumPath) {
    const AUDIO_EXTS = new Set(['.flac', '.mp3', '.ogg', '.opus', '.m4a', '.aac', '.wav', '.ape', '.wv']);

    let entries;
    try {
      entries = await fs.promises.readdir(albumPath);
    } catch (err) {
      throw new Error(`Kan map niet lezen: ${albumPath} — ${err.message}`);
    }

    const audioFiles = entries
      .filter(f => AUDIO_EXTS.has(path.extname(f).toLowerCase()))
      .map(f => path.join(albumPath, f))
      .sort();

    if (!audioFiles.length) {
      return { total: 0, verified: 0, mismatched: 0, errors: 0, details: [] };
    }

    logger.info({ albumPath, count: audioFiles.length }, 'Batch verificatie gestart');

    const details = [];
    let verified  = 0;
    let mismatched = 0;
    let errors    = 0;

    for (const filePath of audioFiles) {
      try {
        // Probeer metadata te lezen via ffprobe voor expected track info
        const meta = await this._readFileMeta(filePath);
        const result = await this.verify(filePath, meta);

        details.push({ filePath, ...result });
        if (result.verified) verified++;
        else if (result.mismatchReason) mismatched++;
        else errors++;
      } catch (err) {
        logger.warn({ err: err.message, filePath }, 'Batch verify fout voor bestand');
        details.push({ filePath, verified: false, confidence: 0, mismatchReason: err.message, error: true });
        errors++;
      }
    }

    logger.info({ albumPath, total: audioFiles.length, verified, mismatched, errors }, 'Batch verificatie voltooid');

    return { total: audioFiles.length, verified, mismatched, errors, details };
  }

  // ── Intern: lees metadata uit bestand ────────────────────────────────────

  async _readFileMeta(filePath) {
    try {
      const { stdout } = await execFileAsync('ffprobe', [
        '-v', 'quiet', '-print_format', 'json', '-show_format', filePath,
      ], { timeout: 10_000 });
      const data = JSON.parse(stdout);
      const tags = data.format?.tags || {};
      const t    = k => tags[k] || tags[k.toUpperCase()] || tags[k.toLowerCase()] || '';
      return {
        artist: t('artist'),
        title:  t('title'),
        album:  t('album'),
        mbid:   t('musicbrainz_recordingid') || t('MUSICBRAINZ_TRACKID') || '',
      };
    } catch {
      return { artist: '', title: path.basename(filePath, path.extname(filePath)), album: '', mbid: '' };
    }
  }
}

// ── Singleton export ──────────────────────────────────────────────────────────
// De API-key wordt lazy geladen uit settings zodat hij gewijzigd kan worden
// zonder herstart. getSetting moet worden geïnjecteerd vanuit deps.
let _instance = null;

function createAcoustIDService(deps = {}) {
  const { getSetting } = deps;
  _instance = new AcoustIDService({
    getApiKey: () => {
      if (!getSetting) return process.env.ACOUSTID_API_KEY || null;
      return getSetting('postprocess', 'acoustid_api_key') || process.env.ACOUSTID_API_KEY || null;
    },
  });
  return _instance;
}

function getAcoustIDService() {
  return _instance;
}

module.exports = { AcoustIDService, createAcoustIDService, getAcoustIDService, fuzzyScore, normalize };
