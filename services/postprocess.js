// ── Post-Download Processing Pipeline ────────────────────────────────────────
// Luistert op download:complete events en verwerkt audiobestanden automatisch
// via een configureerbare 9-staps pipeline. Max 2 ffmpeg processen tegelijk.
'use strict';

const { execFile }  = require('child_process');
const { promisify } = require('util');
const path          = require('path');
const fs            = require('fs');
const fsP           = require('fs').promises;
const https         = require('https');
const http          = require('http');

const logger = require('../logger').child({ service: 'postprocess' });

const { mbzGet }                           = require('./musicbrainz');
const { getDeezerArtist }                  = require('./deezer');
const { logPostprocessStep, getPostprocessLog, getPostprocessLogByJob } = require('../db');

const execFileAsync = promisify(execFile);

// ── ffmpeg queue: max 2 gelijktijdige processen ────────────────────────────
class FfmpegQueue {
  constructor(concurrency = 2) {
    this._max     = concurrency;
    this._running = 0;
    this._queue   = [];
  }

  /** Voer fn uit zodra er een slot vrij is. */
  run(fn) {
    return new Promise((resolve, reject) => {
      this._queue.push({ fn, resolve, reject });
      this._drain();
    });
  }

  _drain() {
    while (this._running < this._max && this._queue.length > 0) {
      const { fn, resolve, reject } = this._queue.shift();
      this._running++;
      fn()
        .then(resolve, reject)
        .finally(() => { this._running--; this._drain(); });
    }
  }

  get active()  { return this._running; }
  get queued()  { return this._queue.length; }
}

const ffmpegQueue = new FfmpegQueue(2);

// ── Interne helpers ───────────────────────────────────────────────────────────

/** Voer ffprobe uit en geef geparsede JSON terug. */
async function ffprobeJson(filePath) {
  const { stdout } = await execFileAsync('ffprobe', [
    '-v', 'quiet',
    '-print_format', 'json',
    '-show_format',
    '-show_streams',
    filePath,
  ]);
  return JSON.parse(stdout);
}

/**
 * Download een URL naar een lokaal bestand.
 * Volgt automatisch HTTP-redirects (max 5).
 */
async function downloadToFile(url, dest, redirectsLeft = 5) {
  return new Promise((resolve, reject) => {
    if (redirectsLeft <= 0) { reject(new Error('Te veel redirects')); return; }
    const proto = url.startsWith('https') ? https : http;
    proto.get(url, { headers: { 'User-Agent': 'LastfmApp-PostProcessor/1.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307) {
        downloadToFile(res.headers.location, dest, redirectsLeft - 1).then(resolve, reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} voor ${url}`));
        return;
      }
      const stream = fs.createWriteStream(dest);
      res.pipe(stream);
      stream.on('finish', resolve);
      stream.on('error', reject);
    }).on('error', reject);
  });
}

/** Sanitiseer één onderdeel van een bestandspad (verwijdert gevaarlijke tekens). */
function sanitize(str) {
  return (str || 'Onbekend')
    .replace(/[/\\:*?"<>|]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);
}

/** Interpoleer template-variabelen in een folder-template string. */
function interpolateTemplate(template, meta) {
  const vars = {
    '$albumartist': sanitize(meta.album_artist || meta.artist || 'Onbekend'),
    '$artist':      sanitize(meta.artist       || 'Onbekend'),
    '$album':       sanitize(meta.album        || 'Onbekend album'),
    '$year':        sanitize((meta.date        || '').slice(0, 4) || 'Onbekend jaar'),
    '$genre':       sanitize(meta.genre        || 'Onbekend genre'),
    '$track':       String(meta.track_number   || '').replace(/\/.*/, '').padStart(2, '0'),
    '$title':       sanitize(meta.title        || 'Onbekend'),
    '$disc':        String(meta.disc_number    || '1').replace(/\/.*/, ''),
  };
  let result = template;
  for (const [k, v] of Object.entries(vars)) result = result.replaceAll(k, v);
  return result;
}

// ── PostProcessor klasse ──────────────────────────────────────────────────────

class PostProcessor {
  constructor(deps) {
    this._db     = deps.db;            // { getSetting, updateDownloadJob, getDownloadJob, logPostprocessStep, getPostprocessLog }
    this._events = deps.events;

    // In-memory recente log (voor status-endpoint zonder DB-query)
    this._recentLog = [];

    this._setupListeners();
    logger.info('PostProcessor geïnitialiseerd');
  }

  // ── Initialisatie ───────────────────────────────────────────────────────

  _setupListeners() {
    this._events.on('download:complete', (data) => {
      // Alleen verwerken als er een filePath is
      if (!data.filePath) {
        logger.debug({ downloadId: data.id }, 'download:complete zonder filePath → postprocessing overgeslagen');
        return;
      }
      this.process(data).catch(err =>
        logger.error({ err: err.message, downloadId: data.id }, 'PostProcessor onverwachte fout in process()')
      );
    });
  }

  // ── Settings helper ─────────────────────────────────────────────────────

  _get(key, fallback = null) {
    try {
      const val = this._db.getSetting('postprocess', key);
      return val !== null && val !== undefined ? val : fallback;
    } catch {
      return fallback;
    }
  }

  // ── Stap-logging ─────────────────────────────────────────────────────────

  _log(downloadId, step, status, details = {}) {
    try {
      logPostprocessStep({
        download_id:  downloadId,
        step,
        status,
        input_path:   details.inputPath  || null,
        output_path:  details.outputPath || null,
        details:      JSON.stringify(details),
        started_at:   details.startedAt  || Date.now(),
        completed_at: Date.now(),
      });
    } catch (dbErr) {
      logger.warn({ dbErr: dbErr.message, step }, 'Kon stap niet in DB loggen');
    }
    this._recentLog.unshift({ downloadId, step, status, ...details, ts: Date.now() });
    if (this._recentLog.length > 200) this._recentLog.length = 200;
  }

  // ── Hoofd-pipeline ────────────────────────────────────────────────────────

  /**
   * Verwerk een gedownload bestand door alle ingeschakelde stappen.
   * Elke stap is onafhankelijk — bij een fout gaat de pipeline door.
   *
   * @param {object} data - download:complete event payload
   * @param {number} data.id
   * @param {string} data.artist
   * @param {string} [data.album]
   * @param {string} [data.track]
   * @param {string} [data.source]
   * @param {string} data.filePath
   * @param {string} [data.quality]
   */
  async process(data) {
    const { id: downloadId, artist, album, track, filePath } = data;

    // Bestandscontrole
    try {
      await fsP.access(filePath, fs.constants.R_OK | fs.constants.W_OK);
    } catch {
      logger.warn({ downloadId, filePath }, 'Bestand niet toegankelijk → postprocessing overgeslagen');
      return;
    }

    const albumOrTrack = album || track || '';
    const steps = this._enabledSteps();

    if (steps.length === 0) {
      logger.debug({ downloadId }, 'Geen postprocess-stappen ingeschakeld');
      return;
    }

    this._events.emit('postprocess:start', { downloadId, steps });
    logger.info({ downloadId, artist, album: albumOrTrack, filePath, steps }, '▶ PostProcessor gestart');

    let currentPath = filePath;
    let mbid        = null;

    // ── 1. MusicBrainz Album Consistency ─────────────────────────────────
    if (steps.includes('consistency')) {
      const t0 = Date.now();
      this._events.emit('postprocess:step', { downloadId, step: 'consistency', status: 'running' });
      try {
        mbid = await this._stepConsistency(downloadId, artist, albumOrTrack);
        this._log(downloadId, 'consistency', 'ok', { mbid, startedAt: t0 });
        this._events.emit('postprocess:step', { downloadId, step: 'consistency', status: 'ok' });
      } catch (err) {
        logger.warn({ err: err.message, downloadId }, 'Stap consistency mislukt → doorgaan');
        this._log(downloadId, 'consistency', 'error', { error: err.message, startedAt: t0 });
        this._events.emit('postprocess:step', { downloadId, step: 'consistency', status: 'error', error: err.message });
      }
    }

    // ── 2. Tag Embedding ─────────────────────────────────────────────────
    if (steps.includes('tags')) {
      const t0 = Date.now();
      this._events.emit('postprocess:step', { downloadId, step: 'tags', status: 'running' });
      try {
        currentPath = await this._stepTags(downloadId, currentPath, { artist, album: albumOrTrack });
        this._log(downloadId, 'tags', 'ok', { outputPath: currentPath, startedAt: t0 });
        this._events.emit('postprocess:step', { downloadId, step: 'tags', status: 'ok' });
      } catch (err) {
        logger.warn({ err: err.message, downloadId }, 'Stap tags mislukt → doorgaan');
        this._log(downloadId, 'tags', 'error', { error: err.message, startedAt: t0 });
        this._events.emit('postprocess:step', { downloadId, step: 'tags', status: 'error', error: err.message });
      }
    }

    // ── 3. Album Art Embedding ───────────────────────────────────────────
    if (steps.includes('art')) {
      const t0 = Date.now();
      this._events.emit('postprocess:step', { downloadId, step: 'art', status: 'running' });
      try {
        currentPath = await this._stepArt(downloadId, currentPath, { artist, album: albumOrTrack, mbid });
        this._log(downloadId, 'art', 'ok', { outputPath: currentPath, startedAt: t0 });
        this._events.emit('postprocess:step', { downloadId, step: 'art', status: 'ok' });
      } catch (err) {
        logger.warn({ err: err.message, downloadId }, 'Stap art mislukt → doorgaan');
        this._log(downloadId, 'art', 'error', { error: err.message, startedAt: t0 });
        this._events.emit('postprocess:step', { downloadId, step: 'art', status: 'error', error: err.message });
      }
    }

    // ── 4. ReplayGain ────────────────────────────────────────────────────
    if (steps.includes('replaygain')) {
      const t0 = Date.now();
      this._events.emit('postprocess:step', { downloadId, step: 'replaygain', status: 'running' });
      try {
        currentPath = await this._stepReplayGain(downloadId, currentPath);
        this._log(downloadId, 'replaygain', 'ok', { outputPath: currentPath, startedAt: t0 });
        this._events.emit('postprocess:step', { downloadId, step: 'replaygain', status: 'ok' });
      } catch (err) {
        logger.warn({ err: err.message, downloadId }, 'Stap replaygain mislukt → doorgaan');
        this._log(downloadId, 'replaygain', 'error', { error: err.message, startedAt: t0 });
        this._events.emit('postprocess:step', { downloadId, step: 'replaygain', status: 'error', error: err.message });
      }
    }

    // ── 5. Lyrics ────────────────────────────────────────────────────────
    if (steps.includes('lyrics')) {
      const t0 = Date.now();
      this._events.emit('postprocess:step', { downloadId, step: 'lyrics', status: 'running' });
      try {
        await this._stepLyrics(downloadId, currentPath, { artist, title: track || albumOrTrack });
        this._log(downloadId, 'lyrics', 'ok', { startedAt: t0 });
        this._events.emit('postprocess:step', { downloadId, step: 'lyrics', status: 'ok' });
      } catch (err) {
        logger.warn({ err: err.message, downloadId }, 'Stap lyrics mislukt → doorgaan');
        this._log(downloadId, 'lyrics', 'error', { error: err.message, startedAt: t0 });
        this._events.emit('postprocess:step', { downloadId, step: 'lyrics', status: 'error', error: err.message });
      }
    }

    // ── 6. Hi-Res Downsampling ───────────────────────────────────────────
    if (steps.includes('downsample')) {
      const t0 = Date.now();
      this._events.emit('postprocess:step', { downloadId, step: 'downsample', status: 'running' });
      try {
        currentPath = await this._stepDownsample(downloadId, currentPath);
        this._log(downloadId, 'downsample', 'ok', { outputPath: currentPath, startedAt: t0 });
        this._events.emit('postprocess:step', { downloadId, step: 'downsample', status: 'ok' });
      } catch (err) {
        logger.warn({ err: err.message, downloadId }, 'Stap downsample mislukt → doorgaan');
        this._log(downloadId, 'downsample', 'error', { error: err.message, startedAt: t0 });
        this._events.emit('postprocess:step', { downloadId, step: 'downsample', status: 'error', error: err.message });
      }
    }

    // ── 7 & 8. Lossy Copy + Blasphemy ────────────────────────────────────
    if (steps.includes('lossy')) {
      const t0 = Date.now();
      this._events.emit('postprocess:step', { downloadId, step: 'lossy', status: 'running' });
      try {
        const lossyPath = await this._stepLossy(downloadId, currentPath);
        this._log(downloadId, 'lossy', 'ok', { outputPath: lossyPath, startedAt: t0 });
        this._events.emit('postprocess:step', { downloadId, step: 'lossy', status: 'ok' });

        // Blasphemy: verwijder origineel FLAC na succesvolle lossy conversie
        if (steps.includes('blasphemy') && lossyPath) {
          const bT0 = Date.now();
          try {
            await fsP.unlink(currentPath);
            logger.info({ downloadId, deleted: currentPath }, '🔥 Blasphemy: origineel verwijderd');
            this._log(downloadId, 'blasphemy', 'ok', { deletedPath: currentPath, startedAt: bT0 });
            this._events.emit('postprocess:step', { downloadId, step: 'blasphemy', status: 'ok' });
            currentPath = lossyPath;
          } catch (bErr) {
            logger.warn({ err: bErr.message, downloadId }, 'Blasphemy: verwijderen mislukt');
            this._log(downloadId, 'blasphemy', 'error', { error: bErr.message, startedAt: bT0 });
            this._events.emit('postprocess:step', { downloadId, step: 'blasphemy', status: 'error', error: bErr.message });
          }
        }
      } catch (err) {
        logger.warn({ err: err.message, downloadId }, 'Stap lossy mislukt → doorgaan');
        this._log(downloadId, 'lossy', 'error', { error: err.message, startedAt: t0 });
        this._events.emit('postprocess:step', { downloadId, step: 'lossy', status: 'error', error: err.message });
      }
    }

    // ── 9. File Organization ─────────────────────────────────────────────
    if (steps.includes('organize')) {
      const t0 = Date.now();
      this._events.emit('postprocess:step', { downloadId, step: 'organize', status: 'running' });
      try {
        const organized = await this._stepOrganize(downloadId, currentPath);
        this._log(downloadId, 'organize', 'ok', { inputPath: currentPath, outputPath: organized, startedAt: t0 });
        this._events.emit('postprocess:step', { downloadId, step: 'organize', status: 'ok' });
        currentPath = organized;
      } catch (err) {
        logger.warn({ err: err.message, downloadId }, 'Stap organize mislukt → doorgaan');
        this._log(downloadId, 'organize', 'error', { error: err.message, startedAt: t0 });
        this._events.emit('postprocess:step', { downloadId, step: 'organize', status: 'error', error: err.message });
      }
    }

    // Update file_path in download_jobs naar het uiteindelijke pad
    try {
      this._db.updateDownloadJob(downloadId, { file_path: currentPath });
    } catch { /* niet fataal */ }

    this._events.emit('postprocess:complete', {
      downloadId,
      results: this._recentLog.filter(l => l.downloadId === downloadId).slice(0, steps.length),
    });
    logger.info({ downloadId, finalPath: currentPath }, '✓ PostProcessor pipeline voltooid');
  }

  // ── Stap-implementaties ───────────────────────────────────────────────────

  /**
   * Geef array van ingeschakelde stap-namen terug.
   * Volgorde is de pipeline-volgorde.
   */
  _enabledSteps() {
    const map = [
      ['album_consistency', 'consistency'],
      ['tag_embedding',     'tags'],
      ['embed_art',         'art'],
      ['replaygain',        'replaygain'],
      ['lyrics',            'lyrics'],
      ['downsample',        'downsample'],
      ['lossy_copy',        'lossy'],
      ['blasphemy_mode',    'blasphemy'],
      ['organize',          'organize'],
    ];
    // blasphemy is alleen actief als lossy ook aan staat
    const enabled = map
      .filter(([key]) => this._get(key, false))
      .map(([, name]) => name);
    if (enabled.includes('blasphemy') && !enabled.includes('lossy')) {
      return enabled.filter(s => s !== 'blasphemy');
    }
    return enabled;
  }

  // ── Stap 1: MusicBrainz Album Consistency ────────────────────────────────

  async _stepConsistency(downloadId, artist, album) {
    const q    = `release:"${album.replace(/"/g, '')}" AND artist:"${artist.replace(/"/g, '')}"`;
    const data = await mbzGet(`/release?query=${encodeURIComponent(q)}&limit=5&fmt=json`);
    const releases = data.releases || [];
    if (!releases.length) throw new Error(`Geen MBZ release gevonden voor "${artist} – ${album}"`);

    // Exacte match op titel + artiest → anders eerste resultaat
    const lAlbum  = album.toLowerCase();
    const lArtist = artist.toLowerCase();
    const best = releases.find(r =>
      r.title.toLowerCase() === lAlbum &&
      (r['artist-credit'] || []).some(ac => ac.artist?.name?.toLowerCase() === lArtist)
    ) || releases[0];

    const mbid = best.id;
    logger.debug({ downloadId, mbid, title: best.title }, 'MBZ release gevonden');
    return mbid;
  }

  // ── Stap 2: Tag Embedding ─────────────────────────────────────────────────

  async _stepTags(downloadId, filePath, { artist, album }) {
    const probe = await ffprobeJson(filePath);
    const tags  = probe.format?.tags || {};

    // Normaliseer tag-sleutels naar lowercase voor vergelijking
    const normTags = Object.fromEntries(Object.entries(tags).map(([k, v]) => [k.toLowerCase(), v]));

    const updates = {};
    if (!normTags.artist && artist) updates.artist = artist;
    if (!normTags.album  && album)  updates.album  = album;

    if (Object.keys(updates).length === 0) {
      logger.debug({ downloadId }, 'Tags al aanwezig, geen embedding nodig');
      return filePath;
    }

    const ext    = path.extname(filePath);
    const tmpOut = filePath.replace(ext, `._tagged${ext}`);

    const args = ['-i', filePath, '-c', 'copy'];
    for (const [k, v] of Object.entries(updates)) args.push('-metadata', `${k}=${v}`);
    args.push('-y', tmpOut);

    await ffmpegQueue.run(() => execFileAsync('ffmpeg', args));
    await fsP.rename(tmpOut, filePath);
    logger.debug({ downloadId, updates }, 'Tags embedded');
    return filePath;
  }

  // ── Stap 3: Album Art Embedding ───────────────────────────────────────────

  async _stepArt(downloadId, filePath, { artist, album, mbid }) {
    const probe  = await ffprobeJson(filePath);
    const hasArt = (probe.streams || []).some(s => s.codec_type === 'video');

    if (hasArt) {
      logger.debug({ downloadId }, 'Album art al aanwezig in bestand');
      return filePath;
    }

    const albumDir  = path.dirname(filePath);
    const coverPath = path.join(albumDir, 'cover.jpg');
    let   coverUrl  = null;

    // 1. Cover Art Archive via MBID
    if (mbid) {
      coverUrl = `https://coverartarchive.org/release/${mbid}/front`;
    }

    // 2. Fallback: Deezer artiest-foto
    if (!coverUrl) {
      const dz = await getDeezerArtist(artist).catch(() => null);
      if (dz?.picture_xl) coverUrl = dz.picture_xl;
    }

    if (!coverUrl) throw new Error('Geen cover art gevonden (Cover Art Archive + Deezer geprobeerd)');

    // Download cover naar albummap
    await downloadToFile(coverUrl, coverPath);
    logger.debug({ downloadId, coverPath }, 'Cover art gedownload');

    // Embed in audiobestand
    const ext    = path.extname(filePath);
    const tmpOut = filePath.replace(ext, `._art${ext}`);

    await ffmpegQueue.run(() => execFileAsync('ffmpeg', [
      '-i', filePath,
      '-i', coverPath,
      '-map', '0:a',
      '-map', '1:v',
      '-c:a', 'copy',
      '-c:v', 'mjpeg',
      '-disposition:v', 'attached_pic',
      '-id3v2_version', '3',
      '-y', tmpOut,
    ]));
    await fsP.rename(tmpOut, filePath);
    logger.debug({ downloadId }, 'Album art embedded');
    return filePath;
  }

  // ── Stap 4: ReplayGain ────────────────────────────────────────────────────

  async _stepReplayGain(downloadId, filePath) {
    // ffmpeg schrijft ReplayGain-info naar stderr, ook bij "succes"
    // Het commando eindigt met exit-code 1; we vangen dat op.
    let stderr = '';
    try {
      await ffmpegQueue.run(() => execFileAsync('ffmpeg', [
        '-i', filePath,
        '-af', 'replaygain',
        '-f', 'null', '-',
      ]));
    } catch (err) {
      // Verwacht: ffmpeg geeft code 1 terug voor -f null
      stderr = err.stderr || '';
      if (!stderr.includes('track_gain')) throw err;
    }

    const gainMatch = stderr.match(/track_gain\s*=\s*([+-]?\d+\.?\d*)\s*dB/i);
    const peakMatch = stderr.match(/track_peak\s*=\s*(\d+\.?\d*)/i);
    if (!gainMatch) throw new Error('ReplayGain analyse mislukt: geen track_gain in ffmpeg output');

    const trackGain = `${gainMatch[1]} dB`;
    const trackPeak = peakMatch?.[1] || '1.000000';
    logger.debug({ downloadId, trackGain, trackPeak }, 'ReplayGain geanalyseerd');

    // Schrijf tags naar bestand
    const ext    = path.extname(filePath);
    const tmpOut = filePath.replace(ext, `._rg${ext}`);
    await ffmpegQueue.run(() => execFileAsync('ffmpeg', [
      '-i', filePath,
      '-c', 'copy',
      '-metadata', `REPLAYGAIN_TRACK_GAIN=${trackGain}`,
      '-metadata', `REPLAYGAIN_TRACK_PEAK=${trackPeak}`,
      '-y', tmpOut,
    ]));
    await fsP.rename(tmpOut, filePath);
    return filePath;
  }

  // ── Stap 5: Synchronized Lyrics ───────────────────────────────────────────

  async _stepLyrics(downloadId, filePath, { artist, title }) {
    if (!title) throw new Error('Geen track-titel beschikbaar voor lyrics-zoekactie');

    // Bestandsduur opvragen voor nauwkeurigere LRClib-query
    const probe    = await ffprobeJson(filePath);
    const duration = Math.round(parseFloat(probe.format?.duration || '0'));

    const params = new URLSearchParams({ artist_name: artist, track_name: title });
    if (duration > 0) params.set('duration', String(duration));
    const url = `https://lrclib.net/api/search?${params}`;

    const resp = await fetch(url, {
      headers: { 'User-Agent': 'LastfmApp-PostProcessor/1.0' },
      signal:  AbortSignal.timeout(12_000),
    });
    if (!resp.ok) throw new Error(`LRClib HTTP ${resp.status}`);

    const results = await resp.json();
    const best    = (Array.isArray(results) ? results : [])
      .find(r => r.syncedLyrics) || results?.[0];

    if (!best?.syncedLyrics) throw new Error('Geen gesynchroniseerde lyrics gevonden op LRClib');

    // Sla .lrc op naast het audiobestand
    const lrcPath = filePath.replace(/\.\w+$/, '.lrc');
    await fsP.writeFile(lrcPath, best.syncedLyrics, 'utf8');
    logger.debug({ downloadId, lrcPath }, 'LRC bestand opgeslagen');

    // Embed lyrics als tag (alleen FLAC)
    if (path.extname(filePath).toLowerCase() === '.flac') {
      const tmpOut = filePath.replace(/\.flac$/i, '._lyr.flac');
      await ffmpegQueue.run(() => execFileAsync('ffmpeg', [
        '-i', filePath,
        '-c', 'copy',
        '-metadata', `LYRICS=${best.syncedLyrics}`,
        '-y', tmpOut,
      ]));
      await fsP.rename(tmpOut, filePath);
      logger.debug({ downloadId }, 'Lyrics tag embedded in FLAC');
    }
  }

  // ── Stap 6: Hi-Res Downsampling ───────────────────────────────────────────

  async _stepDownsample(downloadId, filePath) {
    const probe  = await ffprobeJson(filePath);
    const stream = (probe.streams || []).find(s => s.codec_type === 'audio');
    if (!stream) throw new Error('Geen audiostream gevonden');

    const sampleRate = parseInt(stream.sample_rate || '44100', 10);
    const bits       = parseInt(
      stream.bits_per_raw_sample || stream.bits_per_coded_sample || '16',
      10
    );

    if (bits <= 16 && sampleRate <= 44100) {
      logger.debug({ downloadId, bits, sampleRate }, 'Al 16-bit/44.1kHz, geen downsampling nodig');
      return filePath;
    }

    logger.info({ downloadId, bits, sampleRate }, 'Hi-Res → downsampling naar 16-bit/44.1kHz');
    const ext    = path.extname(filePath);
    const tmpOut = filePath.replace(ext, `._ds${ext}`);

    await ffmpegQueue.run(() => execFileAsync('ffmpeg', [
      '-i', filePath,
      '-sample_fmt', 's16',
      '-ar', '44100',
      '-y', tmpOut,
    ]));
    await fsP.rename(tmpOut, filePath);
    return filePath;
  }

  // ── Stap 7: Lossy Copy ────────────────────────────────────────────────────

  async _stepLossy(downloadId, filePath) {
    const format  = this._get('lossy_format',  'mp3');
    const bitrate = this._get('lossy_bitrate', '320');
    const lossyBase = this._get('lossy_path',  '/music/lossy');

    // Bepaal relatief pad t.o.v. configureerbare bronmap
    const sourceBase = this._get('source_base_path', '/music');
    const relative   = filePath.startsWith(sourceBase)
      ? filePath.slice(sourceBase.length + (filePath[sourceBase.length] === '/' ? 1 : 0))
      : path.basename(filePath);

    const codecMap = { mp3: 'libmp3lame', opus: 'libopus', aac: 'aac' };
    const extMap   = { mp3: '.mp3',       opus: '.opus',   aac: '.m4a' };
    const codec    = codecMap[format] || 'libmp3lame';
    const outExt   = extMap[format]   || '.mp3';

    const outPath = path.join(lossyBase, relative.replace(/\.[^.]+$/, outExt));
    await fsP.mkdir(path.dirname(outPath), { recursive: true });

    await ffmpegQueue.run(() => execFileAsync('ffmpeg', [
      '-i', filePath,
      '-codec:a', codec,
      '-b:a', `${bitrate}k`,
      '-y', outPath,
    ]));

    logger.info({ downloadId, format, bitrate, outPath }, 'Lossy kopie aangemaakt');
    return outPath;
  }

  // ── Stap 9: File Organization ─────────────────────────────────────────────

  async _stepOrganize(downloadId, filePath) {
    const template = this._get('folder_template',    '$albumartist/$album ($year)/$track - $title');
    const baseDir  = this._get('organize_base_path', '/music');

    const probe = await ffprobeJson(filePath);
    const tags  = probe.format?.tags || {};

    // MusicBrainz en andere taggers schrijven soms hoofdletter-varianten
    const t = (key) => tags[key] || tags[key.toUpperCase()] || tags[key.toLowerCase()] || '';

    const meta = {
      album_artist: t('ALBUMARTIST') || t('album_artist') || t('artist'),
      artist:       t('ARTIST')      || t('artist'),
      album:        t('ALBUM')       || t('album'),
      date:         t('DATE')        || t('date') || t('year') || t('YEAR'),
      genre:        t('GENRE')       || t('genre'),
      track_number: (t('TRACK') || t('track')).split('/')[0],
      disc_number:  (t('DISC')  || t('disc')  || '1').split('/')[0],
      title:        t('TITLE')  || t('title')  || path.basename(filePath, path.extname(filePath)),
    };

    const relativePath = interpolateTemplate(template, meta);
    const ext           = path.extname(filePath);
    const destPath      = path.join(baseDir, relativePath + ext);

    if (path.resolve(destPath) === path.resolve(filePath)) {
      logger.debug({ downloadId }, 'Bestand staat al op de juiste plek');
      return filePath;
    }

    await fsP.mkdir(path.dirname(destPath), { recursive: true });
    await fsP.rename(filePath, destPath);
    logger.info({ downloadId, from: filePath, to: destPath }, 'Bestand georganiseerd');
    return destPath;
  }

  // ── Publieke API ──────────────────────────────────────────────────────────

  /** Status van de queue en recente log-items. */
  getStatus() {
    return {
      ffmpegActive: ffmpegQueue.active,
      ffmpegQueued: ffmpegQueue.queued,
      recentLog:    this._recentLog.slice(0, 50),
    };
  }

  /**
   * Herverwerk een bestaande download-job.
   * Leest de job uit de DB en start de pipeline opnieuw.
   */
  async reprocess(downloadId) {
    const job = this._db.getDownloadJob(downloadId);
    if (!job)           throw new Error(`Download-job ${downloadId} niet gevonden`);
    if (!job.file_path) throw new Error(`Job ${downloadId} heeft geen file_path opgeslagen`);

    logger.info({ downloadId, filePath: job.file_path }, '♻ Herverwerking gestart');
    await this.process({
      id:       downloadId,
      artist:   job.artist   || '',
      album:    job.album    || '',
      track:    job.track    || '',
      source:   job.source_used || 'reprocess',
      filePath: job.file_path,
      quality:  job.quality  || '',
    });
  }
}

module.exports = { PostProcessor };
