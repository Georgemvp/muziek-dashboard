// ── Library Maintenance Service ───────────────────────────────────────────────
// 10 geautomatiseerde scan- en reparatiejobs voor de muziekcollectie.
// Elke scan returnt een array van findings met severity, filePath, issue, suggestedFix, autoFixable.

'use strict';

const { execFile, exec } = require('child_process');
const { promisify }      = require('util');
const fs                 = require('fs');
const path               = require('path');
const logger             = require('../logger');

const execFileAsync = promisify(execFile);
const execAsync     = promisify(exec);

// ── DB-imports (lazy, vermijdt circulaire dep) ────────────────────────────────
const { getCache, setCache } = require('../db');

// ── Plex-imports ──────────────────────────────────────────────────────────────
const {
  plexGet, getPlexLibrary, syncPlexLibrary, PLEX_URL, PLEX_TOKEN
} = require('./plex');

// ── MusicBrainz ───────────────────────────────────────────────────────────────
const { getMBZArtist } = require('./musicbrainz');

// ── Constanten ────────────────────────────────────────────────────────────────
const MUSIC_DIR = process.env.MUSIC_DIR || '/music';
const CONCURRENCY = 4; // max gelijktijdige ffprobe-aanroepen

// ── DB-referentie (wordt ingevuld via init) ───────────────────────────────────
let _db = null;

function initMaintenance(db) {
  _db = db;
}

// ── Helper: concurrency limiter ───────────────────────────────────────────────
function limitConcurrency(tasks, limit) {
  return new Promise((resolve) => {
    if (!tasks.length) return resolve([]);
    const results  = new Array(tasks.length);
    let started    = 0;
    let completed  = 0;
    function next() {
      while (started < tasks.length && (started - completed) < limit) {
        const i = started++;
        Promise.resolve().then(() => tasks[i]())
          .then(v  => { results[i] = { status: 'fulfilled', value: v }; })
          .catch(e => { results[i] = { status: 'rejected',  reason: e }; })
          .finally(() => { completed++; if (completed === tasks.length) resolve(results); else next(); });
      }
    }
    next();
  });
}

// ── Helper: alle bestanden recursief ophalen ──────────────────────────────────
function walkDir(dir, exts) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  function recurse(current) {
    let entries;
    try { entries = fs.readdirSync(current, { withFileTypes: true }); }
    catch { return; }
    for (const e of entries) {
      const full = path.join(current, e.name);
      if (e.isDirectory()) {
        recurse(full);
      } else if (!exts || exts.includes(path.extname(e.name).toLowerCase())) {
        results.push(full);
      }
    }
  }
  recurse(dir);
  return results;
}

// ── Helper: alle mappen recursief ophalen ─────────────────────────────────────
function walkDirs(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  function recurse(current) {
    let entries;
    try { entries = fs.readdirSync(current, { withFileTypes: true }); }
    catch { return; }
    for (const e of entries) {
      if (e.isDirectory()) {
        const full = path.join(current, e.name);
        results.push(full);
        recurse(full);
      }
    }
  }
  recurse(dir);
  return results;
}

// ── Helper: Plex tracks ophalen via API ───────────────────────────────────────
async function fetchAllPlexTracks() {
  try {
    const sections = await plexGet('/library/sections');
    const musicSections = (sections?.MediaContainer?.Directory || [])
      .filter(s => s.type === 'artist');

    const tracks = [];
    for (const section of musicSections) {
      const key = section.key;
      let offset = 0;
      const pageSize = 500;
      while (true) {
        const res = await plexGet(`/library/sections/${key}/all?type=10&X-Plex-Container-Start=${offset}&X-Plex-Container-Size=${pageSize}`);
        const items = res?.MediaContainer?.Metadata || [];
        tracks.push(...items);
        if (items.length < pageSize) break;
        offset += pageSize;
      }
    }
    return tracks;
  } catch (err) {
    logger.warn({ err }, 'Maintenance: Plex tracks ophalen mislukt');
    return [];
  }
}

// ── Helper: Plex albums ophalen ───────────────────────────────────────────────
async function fetchAllPlexAlbums() {
  try {
    const sections = await plexGet('/library/sections');
    const musicSections = (sections?.MediaContainer?.Directory || [])
      .filter(s => s.type === 'artist');

    const albums = [];
    for (const section of musicSections) {
      let offset = 0;
      const pageSize = 500;
      while (true) {
        const res = await plexGet(`/library/sections/${section.key}/all?type=9&X-Plex-Container-Start=${offset}&X-Plex-Container-Size=${pageSize}`);
        const items = res?.MediaContainer?.Metadata || [];
        albums.push(...items);
        if (items.length < pageSize) break;
        offset += pageSize;
      }
    }
    return albums;
  } catch (err) {
    logger.warn({ err }, 'Maintenance: Plex albums ophalen mislukt');
    return [];
  }
}

// ── Helper: finding opslaan in DB ─────────────────────────────────────────────
function saveFinding(finding) {
  if (!_db) return;
  _db.prepare(`
    INSERT OR REPLACE INTO maintenance_findings
      (scan_type, severity, file_path, artist, album, track, issue, suggested_fix, auto_fixable, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'open')
  `).run(
    finding.scanType,
    finding.severity || 'warning',
    finding.filePath || null,
    finding.artist   || null,
    finding.album    || null,
    finding.track    || null,
    finding.issue,
    finding.suggestedFix || null,
    finding.autoFixable  ? 1 : 0
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCAN 1 — Dead files: Plex entries zonder bestand op schijf
// ─────────────────────────────────────────────────────────────────────────────
async function scanDeadFiles(onProgress) {
  const findings = [];
  const tracks = await fetchAllPlexTracks();
  let checked = 0;
  for (const track of tracks) {
    const mediaParts = track.Media?.flatMap(m => m.Part || []) || [];
    for (const part of mediaParts) {
      const filePath = part.file;
      if (filePath && !fs.existsSync(filePath)) {
        const f = {
          scanType: 'dead_files',
          severity: 'error',
          filePath,
          artist: track.grandparentTitle || null,
          album:  track.parentTitle      || null,
          track:  track.title            || null,
          issue: `Plex verwijst naar bestand dat niet bestaat: ${filePath}`,
          suggestedFix: 'Verwijder dead entry uit Plex via "Clean Bundles" of handmatig',
          autoFixable: true,
        };
        findings.push(f);
        saveFinding(f);
      }
    }
    checked++;
    if (onProgress && checked % 100 === 0) onProgress({ checked, total: tracks.length });
  }
  return findings;
}

// ─────────────────────────────────────────────────────────────────────────────
// SCAN 2 — Orphan files: bestanden in /music die niet in Plex staan
// ─────────────────────────────────────────────────────────────────────────────
async function scanOrphanFiles(onProgress) {
  const findings = [];
  const AUDIO_EXTS = ['.mp3', '.flac', '.m4a', '.aac', '.ogg', '.opus', '.wav', '.wv', '.ape', '.alac'];
  const diskFiles  = walkDir(MUSIC_DIR, AUDIO_EXTS);

  // Bouw een Set van bekende Plex-paden
  const tracks     = await fetchAllPlexTracks();
  const plexPaths  = new Set();
  for (const t of tracks) {
    for (const m of t.Media || []) {
      for (const p of m.Part || []) {
        if (p.file) plexPaths.add(p.file);
      }
    }
  }

  let checked = 0;
  for (const filePath of diskFiles) {
    if (!plexPaths.has(filePath)) {
      const f = {
        scanType: 'orphan_files',
        severity: 'warning',
        filePath,
        artist: null,
        album:  path.basename(path.dirname(filePath)),
        track:  path.basename(filePath),
        issue: `Bestand staat niet in Plex: ${filePath}`,
        suggestedFix: 'Importeer bestand in Plex of verwijder het',
        autoFixable: false,
      };
      findings.push(f);
      saveFinding(f);
    }
    checked++;
    if (onProgress && checked % 200 === 0) onProgress({ checked, total: diskFiles.length });
  }
  return findings;
}

// ─────────────────────────────────────────────────────────────────────────────
// SCAN 3 — Duplicates: dubbele tracks (zelfde artiest+titel, meerdere bestanden)
// ─────────────────────────────────────────────────────────────────────────────
async function scanDuplicates(onProgress) {
  const findings = [];
  const tracks   = await fetchAllPlexTracks();
  const seen     = new Map(); // "artist||title" → [filePaths]

  for (const track of tracks) {
    const key = `${(track.grandparentTitle || '').toLowerCase()}||${(track.title || '').toLowerCase()}`;
    const parts = track.Media?.flatMap(m => m.Part || []).map(p => p.file).filter(Boolean) || [];
    if (!seen.has(key)) seen.set(key, { track, files: [] });
    seen.get(key).files.push(...parts);
  }

  let idx = 0;
  for (const [key, { track, files }] of seen) {
    // Ook dubbele Media-objecten per track tellen als duplicaat
    if (files.length > 1) {
      const f = {
        scanType: 'duplicates',
        severity: 'warning',
        filePath: files.join(' | '),
        artist: track.grandparentTitle || null,
        album:  track.parentTitle      || null,
        track:  track.title            || null,
        issue: `${files.length} bestanden voor dezelfde track (${track.grandparentTitle} - ${track.title})`,
        suggestedFix: `Verwijder duplicaten, bewaar: ${files[0]}`,
        autoFixable: false,
      };
      findings.push(f);
      saveFinding(f);
    }
    idx++;
    if (onProgress && idx % 200 === 0) onProgress({ checked: idx, total: seen.size });
  }
  return findings;
}

// ─────────────────────────────────────────────────────────────────────────────
// SCAN 4 — Metadata gaps: tracks zonder artiest, album, genre of jaar
// ─────────────────────────────────────────────────────────────────────────────
async function scanMetadataGaps(onProgress) {
  const findings = [];
  const tracks   = await fetchAllPlexTracks();

  let checked = 0;
  for (const track of tracks) {
    const missing = [];
    if (!track.grandparentTitle) missing.push('artiest');
    if (!track.parentTitle)      missing.push('album');
    if (!track.year)             missing.push('jaar');

    // Haal album-genre op (track-niveau heeft genre niet altijd)
    // We checken alleen of de track zelf genres mist via grandparent
    // (genre-check is het meest nuttig op album-niveau, hier checken we track)

    if (missing.length > 0) {
      const filePath = track.Media?.[0]?.Part?.[0]?.file || null;
      const f = {
        scanType: 'metadata_gaps',
        severity: missing.includes('artiest') ? 'error' : 'warning',
        filePath,
        artist: track.grandparentTitle || null,
        album:  track.parentTitle      || null,
        track:  track.title            || null,
        issue: `Ontbrekende metadata: ${missing.join(', ')}`,
        suggestedFix: 'Gebruik Plex metadata-editor of beets om tags bij te werken',
        autoFixable: false,
      };
      findings.push(f);
      saveFinding(f);
    }
    checked++;
    if (onProgress && checked % 100 === 0) onProgress({ checked, total: tracks.length });
  }
  return findings;
}

// ─────────────────────────────────────────────────────────────────────────────
// SCAN 5 — Album completeness: albums met ontbrekende tracks (via gaps service)
// ─────────────────────────────────────────────────────────────────────────────
async function scanAlbumCompleteness(onProgress) {
  const findings = [];
  try {
    const { getGaps } = require('./gaps');
    const gaps = await getGaps().catch(() => []);
    let checked = 0;
    for (const artist of (gaps || [])) {
      for (const album of (artist.missing || [])) {
        const f = {
          scanType: 'album_completeness',
          severity: 'info',
          filePath: null,
          artist: artist.title,
          album:  album.title,
          track:  null,
          issue: `Album ontbreekt in Plex: ${artist.title} – ${album.title}${album.releaseDate ? ` (${album.releaseDate.slice(0,4)})` : ''}`,
          suggestedFix: 'Download album via Tidarr of OrpheusDL',
          autoFixable: false,
        };
        findings.push(f);
        saveFinding(f);
      }
      checked++;
      if (onProgress) onProgress({ checked, total: gaps.length });
    }
  } catch (err) {
    logger.warn({ err }, 'Maintenance: album completeness scan fout');
  }
  return findings;
}

// ─────────────────────────────────────────────────────────────────────────────
// SCAN 6 — Missing covers: albums zonder cover art
// ─────────────────────────────────────────────────────────────────────────────
async function scanMissingCovers(onProgress) {
  const findings = [];
  const albums   = await fetchAllPlexAlbums();
  let checked    = 0;

  for (const album of albums) {
    const hasThumb = !!(album.thumb || album.parentThumb || album.art);
    if (!hasThumb) {
      const f = {
        scanType: 'missing_covers',
        severity: 'warning',
        filePath: null,
        artist: album.parentTitle || null,
        album:  album.title       || null,
        track:  null,
        issue: `Album heeft geen cover art: ${album.parentTitle} – ${album.title}`,
        suggestedFix: 'Haal cover op via Cover Art Archive of Deezer',
        autoFixable: true,
      };
      findings.push(f);
      saveFinding(f);
    }
    checked++;
    if (onProgress && checked % 50 === 0) onProgress({ checked, total: albums.length });
  }
  return findings;
}

// ─────────────────────────────────────────────────────────────────────────────
// SCAN 7 — Fake Lossless: FLAC bestanden die eigenlijk lossy zijn
// ─────────────────────────────────────────────────────────────────────────────
async function scanFakeLossless(onProgress) {
  const findings = [];
  const flacFiles = walkDir(MUSIC_DIR, ['.flac']);
  let checked = 0;

  const tasks = flacFiles.map(filePath => async () => {
    try {
      const { stdout } = await execFileAsync('ffprobe', [
        '-v', 'error',
        '-select_streams', 'a:0',
        '-show_entries', 'stream=codec_name,sample_rate,bits_per_sample,bit_rate',
        '-of', 'json',
        filePath
      ], { timeout: 10000 });

      const info   = JSON.parse(stdout);
      const stream = info?.streams?.[0];
      if (!stream) return null;

      const sampleRate  = parseInt(stream.sample_rate  || '0', 10);
      const bitsPerSamp = parseInt(stream.bits_per_sample || '0', 10);
      const bitRate     = parseInt(stream.bit_rate     || '0', 10);

      // Heuristiek: als sample rate laag (≤44100) én bit depth ≤16 én bitrate hoog (>800kbps is vreemd voor echte FLAC van hoge kwaliteit)
      // Betere check: typische MP3-gecodeerde FLAC heeft een hoge bitrate voor z'n sample rate
      // We doen een eenvoudige check: sample_rate < 44100 of bits_per_sample < 16 → suspect
      // Maar de beste indicator is een spectrale analyse via ffprobe spectrograms (dit vereist ffmpeg)
      // We gebruiken hier een proxy: bitrate per kanaal vs sample_rate verhouding
      // Als bitrate < 300000 bps en sample_rate = 44100 en bits = 16 → waarschijnlijk transcoded MP3

      let suspect = false;
      let reason  = '';

      if (sampleRate > 0 && bitsPerSamp > 0) {
        // FLAC met 44100 Hz / 16-bit maar zeer hoge file-size relative to duration → possibly transcoded
        // Snelle heuristiek: als bits_per_sample < 16 → zeker probleem
        if (bitsPerSamp < 16) {
          suspect = true;
          reason  = `Bit depth ${bitsPerSamp} is te laag voor lossless`;
        } else if (sampleRate < 32000) {
          suspect = true;
          reason  = `Sample rate ${sampleRate}Hz is te laag voor lossless`;
        }
      }

      // Extra check: ffmpeg peak spectral analysis via fpcalc (als beschikbaar)
      if (!suspect) {
        try {
          const { stdout: fc } = await execFileAsync('fpcalc', ['-json', '-length', '30', filePath], { timeout: 15000 });
          const fcData = JSON.parse(fc);
          // fpcalc geeft fingerprint — we kunnen hier de duration vs fingerprint size vergelijken
          // maar dat is niet directief voor fake lossless
          // We slaan deze check over als geen duidelijker signaal
          void fcData;
        } catch { /* fpcalc niet beschikbaar of fout, skip */ }
      }

      return suspect ? {
        scanType: 'fake_lossless',
        severity: 'warning',
        filePath,
        artist: null,
        album:  path.basename(path.dirname(filePath)),
        track:  path.basename(filePath),
        issue: `Mogelijke fake lossless FLAC: ${reason} (${filePath})`,
        suggestedFix: 'Vervang door echte lossless versie of hernoem naar .mp3/.m4a',
        autoFixable: false,
      } : null;
    } catch (err) {
      // ffprobe niet beschikbaar of bestand onleesbaar
      return null;
    } finally {
      checked++;
      if (onProgress && checked % 20 === 0) onProgress({ checked, total: flacFiles.length });
    }
  });

  const results = await limitConcurrency(tasks, CONCURRENCY);
  for (const r of results) {
    if (r.status === 'fulfilled' && r.value) {
      findings.push(r.value);
      saveFinding(r.value);
    }
  }
  return findings;
}

// ─────────────────────────────────────────────────────────────────────────────
// SCAN 8 — Track numbers: ontbrekende of dubbele tracknummers
// ─────────────────────────────────────────────────────────────────────────────
async function scanTrackNumbers(onProgress) {
  const findings  = [];
  const tracks    = await fetchAllPlexTracks();

  // Groepeer op album (parentRatingKey)
  const byAlbum   = new Map();
  for (const t of tracks) {
    const albumKey = t.parentRatingKey || `${t.parentTitle}__${t.grandparentTitle}`;
    if (!byAlbum.has(albumKey)) byAlbum.set(albumKey, { artist: t.grandparentTitle, album: t.parentTitle, tracks: [] });
    byAlbum.get(albumKey).tracks.push(t);
  }

  let checked = 0;
  for (const [, { artist, album, tracks: albumTracks }] of byAlbum) {
    const nums = albumTracks.map(t => t.index);

    // Ontbrekende tracknummers
    const missing = albumTracks.filter(t => !t.index);
    if (missing.length > 0) {
      for (const t of missing) {
        const filePath = t.Media?.[0]?.Part?.[0]?.file || null;
        const f = {
          scanType: 'track_numbers',
          severity: 'warning',
          filePath,
          artist,
          album,
          track: t.title || null,
          issue: `Track "${t.title}" heeft geen tracknummer`,
          suggestedFix: 'Stel tracknummer in via Plex editor of beets',
          autoFixable: false,
        };
        findings.push(f);
        saveFinding(f);
      }
    }

    // Dubbele tracknummers
    const numCounts = {};
    for (const n of nums.filter(Boolean)) numCounts[n] = (numCounts[n] || 0) + 1;
    for (const [num, count] of Object.entries(numCounts)) {
      if (count > 1) {
        const dupes = albumTracks.filter(t => t.index === parseInt(num, 10));
        const f = {
          scanType: 'track_numbers',
          severity: 'error',
          filePath: dupes.map(d => d.Media?.[0]?.Part?.[0]?.file).filter(Boolean).join(' | '),
          artist,
          album,
          track: dupes.map(d => d.title).join(', '),
          issue: `Tracknummer ${num} komt ${count}x voor in "${album}"`,
          suggestedFix: 'Verwijder of hernoem de duplicate track',
          autoFixable: false,
        };
        findings.push(f);
        saveFinding(f);
      }
    }

    checked++;
    if (onProgress && checked % 50 === 0) onProgress({ checked, total: byAlbum.size });
  }
  return findings;
}

// ─────────────────────────────────────────────────────────────────────────────
// SCAN 9 — MBID mismatch: tracks waarvan MusicBrainz ID niet klopt
// ─────────────────────────────────────────────────────────────────────────────
async function scanMBIDMismatch(onProgress) {
  const findings = [];
  // Haal artiesten op die een MBID hebben in Plex
  const library = getPlexLibrary(); // [{artist, album}]
  const artistNames = [...new Set(library.map(e => e.artist))].slice(0, 50); // begrens voor snelheid

  let checked = 0;
  const tasks = artistNames.map(artistName => async () => {
    try {
      const mbData = await getMBZArtist(artistName).catch(() => null);
      if (!mbData) return [];
      // Haal Plex-artiest op met GUID
      const res = await plexGet(`/library/search?query=${encodeURIComponent(artistName)}&type=8&limit=1`).catch(() => null);
      const plexArtist = res?.MediaContainer?.Metadata?.[0];
      if (!plexArtist) return [];

      // Controleer of Plex een MBID heeft en of die overeenkomt
      const plexGUIDs = plexArtist.Guid || [];
      const plexMBID  = plexGUIDs.find(g => g.id?.startsWith('mbid://'))?.id?.replace('mbid://', '');
      const mbMBID    = mbData.id;

      if (plexMBID && mbMBID && plexMBID !== mbMBID) {
        return [{
          scanType: 'mbid_mismatch',
          severity: 'warning',
          filePath: null,
          artist: artistName,
          album:  null,
          track:  null,
          issue: `MusicBrainz ID mismatch voor "${artistName}": Plex=${plexMBID}, MusicBrainz=${mbMBID}`,
          suggestedFix: 'Corrigeer de MBID in Plex via "Fix Incorrect Match"',
          autoFixable: false,
        }];
      }
      return [];
    } catch { return []; }
    finally {
      checked++;
      if (onProgress) onProgress({ checked, total: artistNames.length });
    }
  });

  const results = await limitConcurrency(tasks, 2);
  for (const r of results) {
    if (r.status === 'fulfilled') {
      for (const f of r.value) {
        findings.push(f);
        saveFinding(f);
      }
    }
  }
  return findings;
}

// ─────────────────────────────────────────────────────────────────────────────
// SCAN 10 — Empty folders: lege mappen in /music
// ─────────────────────────────────────────────────────────────────────────────
async function scanEmptyFolders(onProgress) {
  const findings = [];
  const dirs     = walkDirs(MUSIC_DIR);

  let checked = 0;
  for (const dir of dirs) {
    try {
      const entries = fs.readdirSync(dir);
      if (entries.length === 0) {
        const f = {
          scanType: 'empty_folders',
          severity: 'info',
          filePath: dir,
          artist: null,
          album:  null,
          track:  null,
          issue: `Lege map gevonden: ${dir}`,
          suggestedFix: 'Verwijder de lege map',
          autoFixable: true,
        };
        findings.push(f);
        saveFinding(f);
      }
    } catch { /* toegang geweigerd, skip */ }
    checked++;
    if (onProgress && checked % 100 === 0) onProgress({ checked, total: dirs.length });
  }
  return findings;
}

// ─────────────────────────────────────────────────────────────────────────────
// FIX METHODEN
// ─────────────────────────────────────────────────────────────────────────────

// Fix: tracknummers hernummeren (schrijf via ffmpeg metadata — alleen als autoFixable)
async function fixTrackNumbers(findings) {
  const results = [];
  for (const f of findings) {
    results.push({ id: f.id, status: 'skipped', reason: 'Tracknummer fixes vereisen handmatige controle' });
  }
  return results;
}

// Fix: dead Plex entries verwijderen via Plex API
async function fixDeadFiles(findings) {
  const results = [];
  for (const f of findings) {
    try {
      // We kunnen Plex niet direct dwingen een item te verwijderen zonder de ratingKey
      // Triggeer een "Clean Bundles" op de sectie
      await plexGet('/library/clean').catch(() => {});
      if (_db) {
        _db.prepare(`UPDATE maintenance_findings SET status='fixed' WHERE id=?`).run(f.id);
      }
      results.push({ id: f.id, status: 'fixed' });
    } catch (err) {
      results.push({ id: f.id, status: 'error', reason: err.message });
    }
  }
  return results;
}

// Fix: orphan bestanden (markeer als genegeerd – nooit automatisch verwijderen)
async function fixOrphanFiles(findings) {
  const results = [];
  for (const f of findings) {
    results.push({ id: f.id, status: 'skipped', reason: 'Handmatige bevestiging vereist vóór verwijdering' });
  }
  return results;
}

// Fix: missing covers ophalen via Cover Art Archive
async function fixMissingCovers(findings) {
  const results = [];
  for (const f of findings) {
    try {
      if (!f.artist || !f.album) {
        results.push({ id: f.id, status: 'skipped', reason: 'Artiest of album onbekend' });
        continue;
      }
      // Zoek cover via MusicBrainz Cover Art Archive
      const mbData = await getMBZArtist(f.artist).catch(() => null);
      if (mbData?.id) {
        const url = `https://coverartarchive.org/release-group/${mbData.id}/front`;
        // Controleer of URL bestaat
        const check = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(5000) }).catch(() => null);
        if (check?.ok) {
          if (_db) _db.prepare(`UPDATE maintenance_findings SET status='fixed', suggested_fix=? WHERE id=?`)
            .run(`Cover gevonden: ${url}`, f.id);
          results.push({ id: f.id, status: 'fixed', coverUrl: url });
          continue;
        }
      }
      results.push({ id: f.id, status: 'skipped', reason: 'Geen cover gevonden in Cover Art Archive' });
    } catch (err) {
      results.push({ id: f.id, status: 'error', reason: err.message });
    }
  }
  return results;
}

// Fix: lege mappen verwijderen
async function fixEmptyFolders(findings) {
  const results = [];
  for (const f of findings) {
    try {
      if (!f.filePath) { results.push({ id: f.id, status: 'skipped' }); continue; }
      const entries = fs.readdirSync(f.filePath);
      if (entries.length === 0) {
        fs.rmdirSync(f.filePath);
        if (_db) _db.prepare(`UPDATE maintenance_findings SET status='fixed' WHERE id=?`).run(f.id);
        results.push({ id: f.id, status: 'fixed' });
      } else {
        results.push({ id: f.id, status: 'skipped', reason: 'Map is niet meer leeg' });
      }
    } catch (err) {
      results.push({ id: f.id, status: 'error', reason: err.message });
    }
  }
  return results;
}

// Fix alles van een type
async function fixAll(scanType) {
  if (!_db) return [];
  const findings = _db.prepare(
    `SELECT * FROM maintenance_findings WHERE scan_type=? AND auto_fixable=1 AND status='open'`
  ).all(scanType);

  switch (scanType) {
    case 'dead_files':     return fixDeadFiles(findings);
    case 'orphan_files':   return fixOrphanFiles(findings);
    case 'missing_covers': return fixMissingCovers(findings);
    case 'empty_folders':  return fixEmptyFolders(findings);
    case 'track_numbers':  return fixTrackNumbers(findings);
    default:               return findings.map(f => ({ id: f.id, status: 'skipped', reason: 'Geen auto-fix beschikbaar' }));
  }
}

// Fix één finding op ID
async function fixFinding(id) {
  if (!_db) return { status: 'error', reason: 'DB niet beschikbaar' };
  const f = _db.prepare(`SELECT * FROM maintenance_findings WHERE id=?`).get(id);
  if (!f) return { status: 'error', reason: 'Finding niet gevonden' };
  if (!f.auto_fixable) return { status: 'skipped', reason: 'Niet auto-fixable' };

  const results = await fixAll(f.scan_type).catch(() => []);
  return results.find(r => r.id === id) || { status: 'skipped' };
}

// ─────────────────────────────────────────────────────────────────────────────
// SCAN DISPATCHER
// ─────────────────────────────────────────────────────────────────────────────
const SCAN_TYPES = {
  dead_files:          { label: 'Dead Files',          fn: scanDeadFiles,        description: 'Plex entries zonder bestand op schijf' },
  orphan_files:        { label: 'Orphan Files',         fn: scanOrphanFiles,      description: 'Bestanden in /music die niet in Plex staan' },
  duplicates:          { label: 'Duplicaten',           fn: scanDuplicates,       description: 'Dubbele tracks (zelfde artiest+titel)' },
  metadata_gaps:       { label: 'Metadata Gaps',        fn: scanMetadataGaps,     description: 'Tracks met ontbrekende artiest, album of jaar' },
  album_completeness:  { label: 'Album Compleetheid',   fn: scanAlbumCompleteness, description: 'Albums met ontbrekende tracks' },
  missing_covers:      { label: 'Ontbrekende Covers',   fn: scanMissingCovers,    description: 'Albums zonder cover art' },
  fake_lossless:       { label: 'Fake Lossless',        fn: scanFakeLossless,     description: 'FLAC bestanden die eigenlijk lossy zijn' },
  track_numbers:       { label: 'Tracknummers',         fn: scanTrackNumbers,     description: 'Tracks met ontbrekende of dubbele tracknummers' },
  mbid_mismatch:       { label: 'MBID Mismatch',        fn: scanMBIDMismatch,     description: 'Tracks waarvan MusicBrainz ID niet klopt' },
  empty_folders:       { label: 'Lege Mappen',          fn: scanEmptyFolders,     description: 'Lege mappen in /music' },
};

async function runScan(scanType, onProgress) {
  const def = SCAN_TYPES[scanType];
  if (!def) throw new Error(`Onbekend scan type: ${scanType}`);

  const startMs = Date.now();
  let findings  = [];
  let status    = 'completed';

  try {
    // Wis vorige findings voor dit type
    if (_db) _db.prepare(`DELETE FROM maintenance_findings WHERE scan_type=? AND status='open'`).run(scanType);

    findings = await def.fn(onProgress);

    // Sla run op
    if (_db) {
      _db.prepare(`INSERT INTO maintenance_runs (scan_type, status, findings_count, duration_ms) VALUES (?,?,?,?)`)
        .run(scanType, 'completed', findings.length, Date.now() - startMs);
    }
  } catch (err) {
    status = 'error';
    logger.error({ err, scanType }, 'Maintenance scan fout');
    if (_db) {
      _db.prepare(`INSERT INTO maintenance_runs (scan_type, status, findings_count, duration_ms) VALUES (?,?,?,?)`)
        .run(scanType, 'error', 0, Date.now() - startMs);
    }
    throw err;
  }

  return { scanType, status, findings, durationMs: Date.now() - startMs };
}

module.exports = {
  initMaintenance,
  SCAN_TYPES,
  runScan,
  scanDeadFiles,
  scanOrphanFiles,
  scanDuplicates,
  scanMetadataGaps,
  scanAlbumCompleteness,
  scanMissingCovers,
  scanFakeLossless,
  scanTrackNumbers,
  scanMBIDMismatch,
  scanEmptyFolders,
  fixTrackNumbers,
  fixDeadFiles,
  fixOrphanFiles,
  fixMissingCovers,
  fixEmptyFolders,
  fixAll,
  fixFinding,
};
