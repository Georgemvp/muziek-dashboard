// ── Advanced Matching Engine ──────────────────────────────────────────────────
// Herbruikbare utility voor track/album matching met fuzzy logic.
// Werkt in Node.js (CommonJS) én in de browser (via bundler/ESM).
// Geen externe dependencies; pure JavaScript.
//
// Exporteert:
//   normalize(str)                → string
//   levenshtein(a, b)             → number
//   detectVersion(title)          → string[]
//   normalizeAlbum(title)         → string
//   matchTrack(query, candidate)  → { match, confidence, reasons }
//   matchAlbum(query, candidate)  → { match, confidence, reasons }
//   bestMatch(query, candidates, threshold?) → candidate | null
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

// ── Unicode transliteratie-tabel ──────────────────────────────────────────────
// Handmatige mapping voor tekens die NFD+combining-strip niet oplost.
const TRANSLITERATION_MAP = {
  // Cyrillic (bijv. KoЯn)
  'А': 'a', 'Б': 'b', 'В': 'v', 'Г': 'g', 'Д': 'd', 'Е': 'e', 'Ё': 'yo',
  'Ж': 'zh', 'З': 'z', 'И': 'i', 'Й': 'j', 'К': 'k', 'Л': 'l', 'М': 'm',
  'Н': 'n', 'О': 'o', 'П': 'p', 'Р': 'r', 'С': 's', 'Т': 't', 'У': 'u',
  'Ф': 'f', 'Х': 'kh', 'Ц': 'ts', 'Ч': 'ch', 'Ш': 'sh', 'Щ': 'sch',
  // Я → 'r' ipv 'ya' want in bandnamen (KoЯn) is het een visuele R-spiegel
  'Ъ': '', 'Ы': 'y', 'Ь': '', 'Э': 'e', 'Ю': 'yu', 'Я': 'r',
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
  'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'j', 'к': 'k', 'л': 'l', 'м': 'm',
  'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
  'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
  'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'r',
  // Mirrored/stylistic (bijv. ℝ, ℤ)
  'ℝ': 'r', 'ℤ': 'z', 'ℕ': 'n', 'ℂ': 'c', 'ℚ': 'q', 'ℙ': 'p',
  // Ligatures
  'æ': 'ae', 'Æ': 'ae', 'œ': 'oe', 'Œ': 'oe', 'ß': 'ss',
  // Typografische tekens
  '’': '', '‘': '', '“': '', '”': '',
  '–': ' ', '—': ' ', '‒': ' ',
  '·': ' ', '•': ' ',
};

// ── Version indicators ────────────────────────────────────────────────────────
const VERSION_PATTERNS = [
  { key: 'live',         re: /\blive\b/i },
  { key: 'remix',        re: /\bremix\b|\brmx\b/i },
  { key: 'acoustic',     re: /\bacoustic\b/i },
  { key: 'demo',         re: /\bdemo\b/i },
  { key: 'remastered',   re: /\bremaster(?:ed)?\b/i },
  { key: 'deluxe',       re: /\bdeluxe\b/i },
  { key: 'radio edit',   re: /\bradio\s+edit\b/i },
  { key: 'instrumental', re: /\binstrumental\b/i },
  { key: 'extended',     re: /\bextended\b|\bclub mix\b/i },
  { key: 'cover',        re: /\bcover\b/i },
  { key: 'reprise',      re: /\breprise\b/i },
  { key: 'interlude',    re: /\binterlude\b/i },
  { key: 'skit',         re: /\bskit\b/i },
];

// ── Album edition patterns ────────────────────────────────────────────────────
const ALBUM_EDITION_RE = [
  /\s*[\(\[]\s*(?:deluxe|deluxe edition|deluxe version|expanded edition|bonus track[s]? version|remastered|remaster|anniversary edition|special edition|limited edition|collector[''s]* edition|super deluxe|platinum edition|gold edition|diamond edition)\s*[\)\]]/gi,
  /\s*-?\s*(?:deluxe|deluxe edition|expanded edition|remastered|anniversary edition|special edition)$/gi,
  /\s*[\(\[]\s*Taylor[''s]* Version\s*[\)\]]/gi,
  /\s*\((?:disc|cd|disk)\s*\d+\)/gi,
  /\s*\[\s*(?:disc|cd|disk)\s*\d+\s*\]/gi,
];

// ── Core: normalize ───────────────────────────────────────────────────────────

/**
 * Normaliseer een string voor vergelijking.
 * - Strip diacritics (Björk → bjork)
 * - Translitereer Unicode (KoЯn → korn)
 * - Strip special chars (A$AP Rocky → asap rocky)
 * - Strip "the " prefix
 * - Collapse whitespace
 *
 * @param {string} str
 * @returns {string}
 */
function normalize(str) {
  if (!str) return '';
  let s = String(str);

  // Stap 1: translitereer bekende Unicode tekens
  s = s.replace(/[^\x00-\x7F]/g, ch => {
    if (TRANSLITERATION_MAP[ch] !== undefined) return TRANSLITERATION_MAP[ch];
    return ch; // wordt later gestript als het geen ASCII is
  });

  // Stap 2: NFD decomposition + strip combining diacritical marks (U+0300–U+036F)
  s = s.normalize('NFD').replace(/[̀-ͯ]/g, '');

  // Stap 3: lowercase
  s = s.toLowerCase();

  // Stap 4: verwijder aanhalingstekens/apostrofs die betekenis beïnvloeden
  s = s.replace(/[''`´]/g, '');

  // Stap 5: strip alle niet-alfanumerieke tekens behalve spaties.
  // Tekens _tussen_ alfanumerieke chars (bijv. $ in A$AP) worden verwijderd zonder spatie;
  // tekens aan het begin/einde of naast een spatie worden een spatie.
  s = s.replace(/(?<=[a-z0-9])[^a-z0-9 ](?=[a-z0-9])/g, '')  // A$AP → AAP
       .replace(/[^a-z0-9 ]/g, ' ');                            // overige → spatie

  // Stap 6: verwijder "the " prefix
  s = s.replace(/^the\s+/, '');

  // Stap 7: collapse whitespace
  s = s.replace(/\s+/g, ' ').trim();

  return s;
}

// ── Core: levenshtein ─────────────────────────────────────────────────────────

/**
 * Bereken de Levenshtein-afstand tussen twee strings.
 * Gebruikt één rij voor O(min(|a|,|b|)) geheugengebruik.
 *
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a) return b.length;
  if (!b) return a.length;

  // Zorg dat b de kortste is (optimaliseert geheugen)
  if (a.length < b.length) { const tmp = a; a = b; b = tmp; }

  const bLen = b.length;
  let prev = Array.from({ length: bLen + 1 }, (_, i) => i);

  for (let i = 1; i <= a.length; i++) {
    const curr = [i];
    for (let j = 1; j <= bLen; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        curr[j - 1] + 1,          // insert
        prev[j] + 1,              // delete
        prev[j - 1] + cost,       // substitute
      );
    }
    prev = curr;
  }

  return prev[bLen];
}

// ── Version detection ─────────────────────────────────────────────────────────

/**
 * Detecteer versie-indicatoren in een titeltekst.
 *
 * @param {string} title
 * @returns {string[]}  bijv. ['live', 'remastered']
 */
function detectVersion(title) {
  if (!title) return [];
  const found = [];
  for (const { key, re } of VERSION_PATTERNS) {
    if (re.test(title)) found.push(key);
  }
  return found;
}

// ── Album normalization ───────────────────────────────────────────────────────

/**
 * Normaliseer een albumnaam voor vergelijking.
 * Strip edition-achtervoegsels, disc-indicatoren, en dan volledige normalize().
 *
 * @param {string} title
 * @returns {string}
 */
function normalizeAlbum(title) {
  if (!title) return '';
  let s = String(title);

  // Strip bekende edition-patronen
  for (const re of ALBUM_EDITION_RE) {
    s = s.replace(re, '');
  }

  return normalize(s);
}

// ── Matching helpers ──────────────────────────────────────────────────────────

/**
 * Bereken een title-match-score (0–1) op basis van genormaliseerde strings.
 * Houdt rekening met Levenshtein, substring, en korte-titel-bescherming.
 *
 * @param {string} normQuery
 * @param {string} normCandidate
 * @param {string} rawQuery  - originele query (voor korte-titel-check)
 * @returns {{ score: number, reason: string }}
 */
function _titleScore(normQuery, normCandidate, rawQuery) {
  if (!normQuery || !normCandidate) {
    return { score: 0, reason: 'lege titel' };
  }

  // Korte titel bescherming: < 4 tekens vereist exact match
  const rawQ = (rawQuery || normQuery).trim();
  if (rawQ.length < 4) {
    return normQuery === normCandidate
      ? { score: 1.0, reason: 'exact (korte titel)' }
      : { score: 0.0, reason: 'geen exact match (korte titel vereist exact)' };
  }

  if (normQuery === normCandidate) {
    return { score: 1.0, reason: 'exact match' };
  }

  const dist = levenshtein(normQuery, normCandidate);
  if (dist <= 2) return { score: 0.9, reason: `levenshtein ${dist}` };
  if (dist <= 4) return { score: 0.7, reason: `levenshtein ${dist}` };

  if (normCandidate.includes(normQuery) || normQuery.includes(normCandidate)) {
    return { score: 0.6, reason: 'substring match' };
  }

  // Woord-overlap als fallback
  const qWords = normQuery.split(' ').filter(w => w.length > 2);
  const cWords = new Set(normCandidate.split(' ').filter(w => w.length > 2));
  if (qWords.length > 0) {
    const hits = qWords.filter(w => cWords.has(w)).length;
    if (hits > 0) {
      const ratio = hits / qWords.length;
      return { score: 0.3 + ratio * 0.25, reason: `woordoverlap ${hits}/${qWords.length}` };
    }
  }

  return { score: 0, reason: 'geen match' };
}

/**
 * Artiest-match-score (0–1).
 *
 * @param {string} normQuery
 * @param {string} normCandidate
 * @returns {{ score: number, reason: string }}
 */
function _artistScore(normQuery, normCandidate) {
  if (!normQuery || !normCandidate) {
    return { score: 0.5, reason: 'onbekende artiest (neutraal)' };
  }

  if (normQuery === normCandidate) {
    return { score: 1.0, reason: 'exact match' };
  }

  // Feat-variaties: "artist feat. other" bevat "artist"
  if (normCandidate.includes(normQuery) || normQuery.includes(normCandidate)) {
    return { score: 0.8, reason: 'bevat (feat. variatie)' };
  }

  const dist = levenshtein(normQuery, normCandidate);
  if (dist <= 3) return { score: 0.7, reason: `levenshtein ${dist}` };

  // Woord-overlap
  const qWords = normQuery.split(' ').filter(w => w.length > 1);
  const cWords = new Set(normCandidate.split(' ').filter(w => w.length > 1));
  if (qWords.length > 0) {
    const hits = qWords.filter(w => cWords.has(w)).length;
    if (hits === qWords.length) return { score: 0.6, reason: 'alle artiest-woorden matchen' };
    if (hits > 0) return { score: 0.35 + (hits / qWords.length) * 0.2, reason: `artiest woordoverlap ${hits}/${qWords.length}` };
  }

  return { score: 0, reason: 'geen artiest match' };
}

/**
 * Duur-match-score (0–1).
 *
 * @param {number|null} queryDuration   - seconden
 * @param {number|null} candidateDuration
 * @returns {{ score: number, reason: string }}
 */
function _durationScore(queryDuration, candidateDuration) {
  if (queryDuration == null || candidateDuration == null ||
      isNaN(queryDuration) || isNaN(candidateDuration)) {
    return { score: 0.8, reason: 'duur onbekend (neutraal)' };
  }

  const diff = Math.abs(queryDuration - candidateDuration);
  if (diff <= 3)  return { score: 1.0, reason: `duurverschil ${diff}s` };
  if (diff <= 10) return { score: 0.8, reason: `duurverschil ${diff}s` };
  if (diff <= 30) return { score: 0.5, reason: `duurverschil ${diff}s` };
  return { score: 0.0, reason: `duurverschil ${diff}s (te groot)` };
}

// ── matchTrack ────────────────────────────────────────────────────────────────

/**
 * Vergelijk query-track met een kandidaat-track.
 *
 * Gewichten:
 *   title    → 0.50
 *   artist   → 0.35
 *   duration → 0.15
 *
 * Versie-straf:
 *   - Kandidaat heeft versie-indicator die query NIET heeft → × 0.3
 *   - Beide hebben dezelfde versie → geen straf
 *   - Query heeft 'remastered' → accepteer ook origineel
 *
 * @param {{ artist: string, title: string, album?: string, duration?: number }} query
 * @param {{ artist: string, title: string, album?: string, duration?: number }} candidate
 * @returns {{ match: boolean, confidence: number, reasons: string[] }}
 */
function matchTrack(query, candidate) {
  const reasons = [];

  // Normaliseer
  const nqTitle     = normalize(query.title   || '');
  const ncTitle     = normalize(candidate.title || '');
  const nqArtist    = normalize(query.artist  || '');
  const ncArtist    = normalize(candidate.artist || '');

  // Scores per dimensie
  const titleResult    = _titleScore(nqTitle, ncTitle, query.title);
  const artistResult   = _artistScore(nqArtist, ncArtist);
  const durationResult = _durationScore(query.duration, candidate.duration);

  reasons.push(`titel: ${titleResult.reason} (${titleResult.score.toFixed(2)})`);
  reasons.push(`artiest: ${artistResult.reason} (${artistResult.score.toFixed(2)})`);
  reasons.push(`duur: ${durationResult.reason} (${durationResult.score.toFixed(2)})`);

  // Gewogen som
  let confidence =
    titleResult.score    * 0.50 +
    artistResult.score   * 0.35 +
    durationResult.score * 0.15;

  // ── Versie-detectie ────────────────────────────────────────────────────
  const qVersions = detectVersion(query.title   || '');
  const cVersions = detectVersion(candidate.title || '');

  if (qVersions.length === 0 && cVersions.length > 0) {
    // Query heeft geen versie-indicator, kandidaat wél → zwaar afstraffen
    confidence *= 0.3;
    reasons.push(`versie-straf: kandidaat heeft [${cVersions.join(', ')}] maar query niet`);
  } else if (qVersions.length > 0 && cVersions.length === 0 && !qVersions.includes('remastered')) {
    // Query vraagt om specifieke versie maar kandidaat is origineel
    confidence *= 0.6;
    reasons.push(`versie-straf: query wil [${qVersions.join(', ')}] maar kandidaat is origineel`);
  } else if (qVersions.length > 0 && cVersions.length > 0) {
    const shared = qVersions.filter(v => cVersions.includes(v));
    if (shared.length === 0) {
      confidence *= 0.5;
      reasons.push(`versie-mismatch: query [${qVersions}] vs kandidaat [${cVersions}]`);
    } else {
      reasons.push(`versie match: [${shared.join(', ')}]`);
    }
  }

  // Afronden op 4 decimalen
  confidence = Math.round(confidence * 10000) / 10000;

  return {
    match:      confidence >= 0.7,
    confidence,
    reasons,
  };
}

// ── matchAlbum ────────────────────────────────────────────────────────────────

/**
 * Vergelijk query-album met een kandidaat-album.
 * Gebruikt normalizeAlbum (strip editions/discs) + artiest-matching.
 *
 * @param {{ artist: string, album: string }} query
 * @param {{ artist: string, album: string }} candidate
 * @returns {{ match: boolean, confidence: number, reasons: string[] }}
 */
function matchAlbum(query, candidate) {
  const reasons = [];

  const nqAlbum  = normalizeAlbum(query.album  || '');
  const ncAlbum  = normalizeAlbum(candidate.album || '');
  const nqArtist = normalize(query.artist  || '');
  const ncArtist = normalize(candidate.artist || '');

  const albumResult  = _titleScore(nqAlbum, ncAlbum, query.album);
  const artistResult = _artistScore(nqArtist, ncArtist);

  reasons.push(`album: ${albumResult.reason} (${albumResult.score.toFixed(2)})`);
  reasons.push(`artiest: ${artistResult.reason} (${artistResult.score.toFixed(2)})`);

  // Album: 60% gewicht, artiest: 40%
  const confidence = Math.round(
    (albumResult.score * 0.60 + artistResult.score * 0.40) * 10000
  ) / 10000;

  return {
    match:      confidence >= 0.7,
    confidence,
    reasons,
  };
}

// ── bestMatch ─────────────────────────────────────────────────────────────────

/**
 * Vind de beste kandidaat in een lijst boven de opgegeven drempelwaarde.
 *
 * @param {{ artist: string, title?: string, album?: string, duration?: number }} query
 * @param {Array<object>} candidates
 * @param {number} [threshold=0.7]
 * @param {'track'|'album'} [mode='track']
 * @returns {object|null}  De beste kandidaat (met extra veld `_confidence`), of null
 */
function bestMatch(query, candidates, threshold = 0.7, mode = 'track') {
  if (!candidates || candidates.length === 0) return null;

  const fn = mode === 'album' ? matchAlbum : matchTrack;

  let best     = null;
  let bestConf = -1;

  for (const candidate of candidates) {
    const result = fn(query, candidate);
    if (result.confidence > bestConf) {
      bestConf = result.confidence;
      best     = candidate;
    }
  }

  if (bestConf < threshold) return null;

  return { ...best, _confidence: bestConf };
}

// ── Exports ───────────────────────────────────────────────────────────────────

if (typeof module !== 'undefined' && module.exports) {
  // CommonJS (Node.js)
  module.exports = {
    normalize,
    levenshtein,
    detectVersion,
    normalizeAlbum,
    matchTrack,
    matchAlbum,
    bestMatch,
    // interne helpers ook exporteren voor tests
    _titleScore,
    _artistScore,
    _durationScore,
  };
} else if (typeof window !== 'undefined') {
  // Browser globals (fallback voor niet-bundled gebruik)
  window.matching = {
    normalize,
    levenshtein,
    detectVersion,
    normalizeAlbum,
    matchTrack,
    matchAlbum,
    bestMatch,
  };
}
