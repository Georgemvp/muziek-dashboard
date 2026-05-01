// ── Download Orchestrator ─────────────────────────────────────────────────────
// Unificeert alle download-bronnen (Tidarr, OrpheusDL, …) met automatische
// fallback, bron-prioriteit en event-emitting voor post-download hooks.
'use strict';

const logger = require('../logger').child({ service: 'downloadOrchestrator' });

// ── Quality mapping ───────────────────────────────────────────────────────────
// Map generieke quality (flac / mp3_320 / mp3_128) naar platform-specifieke waarden.
const QUALITY_MAP = {
  // generic → tidarr/tidal
  tidarr: {
    flac:    'lossless',
    mp3_320: 'high',
    mp3_128: 'low',
    // doorsturen als de bron al platform-specifiek is
    atmos: 'atmos', hifi: 'hifi', lossless: 'lossless', high: 'high', low: 'low',
  },
  // generic → orpheus (qobuz, tidal, deezer, etc.)
  orpheus_tidal:      { flac: 'hifi',     mp3_320: 'high',     mp3_128: 'low',   hifi: 'hifi',     lossless: 'lossless', high: 'high', low: 'low', atmos: 'atmos' },
  orpheus_qobuz:      { flac: 'hifi',     mp3_320: 'high',     mp3_128: 'high',  hifi: 'hifi',     lossless: 'lossless', high: 'high' },
  orpheus_deezer:     { flac: 'lossless', mp3_320: 'high',     mp3_128: 'low',   lossless: 'lossless', high: 'high', low: 'low' },
  orpheus_spotify:    { flac: 'high',     mp3_320: 'high',     mp3_128: 'low',   high: 'high', low: 'low' },
  orpheus_soundcloud: { flac: 'high',     mp3_320: 'high',     mp3_128: 'high',  high: 'high' },
  orpheus_applemusic: { flac: 'high',     mp3_320: 'high',     mp3_128: 'high',  high: 'high' },
  orpheus_beatport:   { flac: 'lossless', mp3_320: 'high',     mp3_128: 'low',   lossless: 'lossless', high: 'high', low: 'low' },
  orpheus_beatsource: { flac: 'lossless', mp3_320: 'high',     mp3_128: 'low',   lossless: 'lossless', high: 'high', low: 'low' },
  orpheus_youtube:    { flac: 'lossless', mp3_320: 'high',     mp3_128: 'low',   lossless: 'lossless', high: 'high', low: 'low' },
};

/** Platform-naam uit een orpheus_<platform> bron-id halen. */
function orpheusPlatformFromSource(source) {
  return source.replace(/^orpheus_/, '');
}

/** Map quality naar platform-specifieke waarde. */
function mapQuality(source, quality) {
  const map = QUALITY_MAP[source];
  if (!map) return quality || 'high';
  return map[quality] || map.flac || quality || 'high';
}

// ── OrpheusDL platform → URL prefix ──────────────────────────────────────────
const PLATFORM_SEARCH_URL = {
  tidal:      id => `https://tidal.com/browse/album/${id}`,
  qobuz:      id => `https://open.qobuz.com/album/${id}`,
  deezer:     id => `https://www.deezer.com/album/${id}`,
  spotify:    id => `https://open.spotify.com/album/${id}`,
  soundcloud: id => `https://soundcloud.com/${id}`,
  applemusic: id => `https://music.apple.com/album/${id}`,
  beatport:   id => `https://www.beatport.com/release/${id}`,
  beatsource: id => `https://www.beatsource.com/release/${id}`,
  youtube:    id => `https://www.youtube.com/watch?v=${id}`,
};

// ── Standaard bron-prioriteit ────────────────────────────────────────────────
const DEFAULT_SOURCE_PRIORITY = [
  'tidarr',
  'orpheus_qobuz',
  'orpheus_tidal',
  'orpheus_deezer',
  'orpheus_spotify',
  'orpheus_soundcloud',
  'orpheus_applemusic',
  'orpheus_beatport',
  'orpheus_beatsource',
  'orpheus_youtube',
];

// ── Error-teller voor bron-status ─────────────────────────────────────────────
const _sourceErrors  = new Map(); // source → { count, lastAt }
const _sourceChecked = new Map(); // source → lastCheckTs

class DownloadOrchestrator {
  constructor(deps) {
    this.tidarr  = deps.tidarrService;
    this.orpheus = deps.orpheusService;
    this.db      = deps.db;
    this.events  = deps.events;
  }

  // ── Interne helpers ──────────────────────────────────────────────────────

  /** Haal bron-prioriteitenlijst op uit settings. */
  _getSourcePriority() {
    try {
      const val = this.db.getSetting('download', 'source_priority');
      return Array.isArray(val) && val.length > 0 ? val : DEFAULT_SOURCE_PRIORITY;
    } catch {
      return DEFAULT_SOURCE_PRIORITY;
    }
  }

  /** Is hybride modus aan (probeer volgende bron bij falen)? */
  _isHybridMode() {
    try {
      const val = this.db.getSetting('download', 'hybrid_mode');
      return val === null ? true : Boolean(val); // standaard aan
    } catch {
      return true;
    }
  }

  /** Is een specifieke bron enabled in de settings? */
  _isSourceEnabled(source) {
    try {
      const val = this.db.getSetting('download', `source_enabled_${source}`);
      return val === null ? true : Boolean(val); // standaard enabled
    } catch {
      return true;
    }
  }

  /** Registreer een fout voor een bron (voor status-tracking). */
  _recordError(source, err) {
    const cur = _sourceErrors.get(source) || { count: 0, lastAt: 0 };
    _sourceErrors.set(source, { count: cur.count + 1, lastAt: Date.now(), lastMsg: err?.message });
  }

  /** Reset foutentellingen als een bron succesvol was. */
  _recordSuccess(source) {
    _sourceErrors.delete(source);
    _sourceChecked.set(source, Date.now());
  }

  // ── Tidarr download ──────────────────────────────────────────────────────

  /**
   * Probeer via Tidarr te downloaden.
   * Zoekt het beste album via findBestAlbum en voegt het toe aan de queue.
   */
  async _downloadViaTidarr(request) {
    const { artist, album, track, type, quality } = request;
    const q = mapQuality('tidarr', quality);

    if (type === 'album' || (!track && album)) {
      // Album download via Tidarr
      const found = await this.tidarr.findBestAlbum(artist, album);
      if (!found) throw new Error(`Tidarr: geen album gevonden voor "${artist} - ${album}"`);

      await this.tidarr.addToQueue(found.url, 'album', found.title, found.artist, found.id, q);
      return { source: 'tidarr', title: found.title, artist: found.artist, url: found.url };
    }

    // Track download (zoek op de titel)
    const searchResults = await this.tidarr.searchTidal([artist, track].filter(Boolean).join(' '));
    const tracks = (searchResults.results || []).filter(r => r.type === 'track');
    if (!tracks.length) throw new Error(`Tidarr: geen track gevonden voor "${artist} - ${track}"`);
    const best = tracks[0];
    await this.tidarr.addToQueue(best.url, 'track', best.title, best.artist, best.id, q);
    return { source: 'tidarr', title: best.title, artist: best.artist, url: best.url };
  }

  // ── OrpheusDL download ───────────────────────────────────────────────────

  /**
   * Probeer via OrpheusDL te downloaden voor een specifiek platform.
   * Zoekt eerst via de search-API en download dan het beste resultaat.
   */
  async _downloadViaOrpheus(request, platform) {
    const { artist, album, track, type, quality } = request;
    const q = mapQuality(`orpheus_${platform}`, quality);

    const searchQuery = type === 'track'
      ? [artist, track].filter(Boolean).join(' ')
      : [artist, album].filter(Boolean).join(' ');

    const searchType = (type === 'track') ? 'track' : 'album';

    const { results, jobId } = await this.orpheus.searchOrpheus(searchQuery, platform, searchType);
    if (!results || results.length === 0) {
      throw new Error(`OrpheusDL (${platform}): geen resultaten voor "${searchQuery}"`);
    }

    // Score resultaten op artiest+titel match
    const scored = results.map(r => {
      const rArtist = (r.artist || '').toLowerCase();
      const rTitle  = (r.title  || '').toLowerCase();
      const wArtist = (artist   || '').toLowerCase();
      const wTitle  = (album || track || '').toLowerCase();
      let score = 0;
      if (rArtist && wArtist) {
        if (rArtist === wArtist) score += 100;
        else if (rArtist.includes(wArtist) || wArtist.includes(rArtist)) score += 60;
      }
      if (rTitle && wTitle) {
        if (rTitle === wTitle) score += 80;
        else if (rTitle.includes(wTitle) || wTitle.includes(rTitle)) score += 40;
      }
      return { ...r, _score: score };
    }).sort((a, b) => b._score - a._score);

    const best = scored[0];

    // Download via URL of search-index
    let dlJobId;
    if (best.url) {
      const dl = await this.orpheus.downloadOrpheus(best.url, q);
      dlJobId = dl.jobId;
    } else if (jobId) {
      const dl = await this.orpheus.downloadFromSearch(jobId, best.index, q);
      dlJobId = dl.jobId;
    } else {
      throw new Error(`OrpheusDL (${platform}): geen URL of jobId voor download`);
    }

    return {
      source:  `orpheus_${platform}`,
      title:   best.title,
      artist:  best.artist,
      url:     best.url || (PLATFORM_SEARCH_URL[platform] ? PLATFORM_SEARCH_URL[platform](best.id) : ''),
      jobId:   dlJobId,
    };
  }

  // ── Publieke API ─────────────────────────────────────────────────────────

  /**
   * Start een download via de orchestrator.
   *
   * @param {object} request
   * @param {string} request.artist
   * @param {string} [request.album]
   * @param {string} [request.track]
   * @param {string} [request.type]         - 'album' | 'track'
   * @param {string} [request.quality]      - 'flac' | 'mp3_320' | 'mp3_128'
   * @param {string} [request.source]       - 'auto' | 'tidarr' | 'orpheus_tidal' | ...
   * @returns {Promise<{ id, status, source, result }>}
   */
  async download(request) {
    const {
      artist,
      album   = '',
      track   = '',
      type    = album ? 'album' : 'track',
      quality = 'flac',
      source  = 'auto',
    } = request;

    // Maak job record aan in de DB
    const jobId = this.db.createDownloadJob({ artist, album, track, type, quality, source_requested: source });
    this.db.updateDownloadJob(jobId, { status: 'running', attempts: 1 });

    this.events.emit('download:start', { id: jobId, artist, album: album || track, source });
    logger.info({ jobId, artist, album: album || track, source, quality }, 'Download gestart');

    // Bepaal welke bronnen we proberen
    const priority = this._getSourcePriority();
    const hybrid   = this._isHybridMode();

    let sourcesToTry = [];
    if (source === 'auto') {
      sourcesToTry = priority.filter(s => this._isSourceEnabled(s));
    } else {
      sourcesToTry = [source];
    }

    if (sourcesToTry.length === 0) {
      const err = 'Geen download-bronnen geconfigureerd of enabled';
      this.db.updateDownloadJob(jobId, { status: 'failed', error_log: err });
      this.events.emit('download:failed', { id: jobId, artist, album: album || track, source: 'none', error: err });
      return { id: jobId, status: 'failed', source: 'none', error: err };
    }

    let lastError = null;
    let attempts  = 0;

    for (const src of sourcesToTry) {
      attempts++;
      const startMs = Date.now();
      try {
        logger.debug({ jobId, src, attempts }, `Probeer bron: ${src}`);

        let result;
        if (src === 'tidarr') {
          result = await this._downloadViaTidarr({ artist, album, track, type, quality });
        } else if (src.startsWith('orpheus_')) {
          const platform = orpheusPlatformFromSource(src);
          result = await this._downloadViaOrpheus({ artist, album, track, type, quality }, platform);
        } else {
          throw new Error(`Onbekende bron: ${src}`);
        }

        const durationMs = Date.now() - startMs;
        this._recordSuccess(src);

        this.db.updateDownloadJob(jobId, {
          status:     'completed',
          source_used: src,
          attempts,
          error_log:  null,
        });

        // Sla ook op in de legacy downloads tabel voor achterwaartse compatibiliteit
        try {
          this.db.addDownload({
            tidal_id: result.url || '',
            artist:   result.artist || artist,
            title:    result.title  || album || track,
            url:      result.url    || '',
            quality:  mapQuality(src, quality),
            source:   src,
            platform: src.startsWith('orpheus_') ? orpheusPlatformFromSource(src) : 'tidal',
          });
        } catch (e) {
          logger.warn({ e }, 'Kon niet opslaan in legacy downloads tabel');
        }

        logger.info({ jobId, src, durationMs, artist, result }, '✓ Download succesvol');
        this.events.emit('download:complete', {
          id:       jobId,
          artist,
          album:    album || track,
          source:   src,
          filePath: result.filePath || null,
          quality:  mapQuality(src, quality),
        });

        return { id: jobId, status: 'completed', source: src, result };

      } catch (err) {
        lastError = err;
        const durationMs = Date.now() - startMs;
        this._recordError(src, err);
        logger.warn({ jobId, src, attempts, durationMs, err: err.message }, `✗ Bron ${src} mislukt`);

        // Update attempts in DB
        this.db.updateDownloadJob(jobId, {
          status:   'running',
          attempts,
          error_log: err.message,
        });

        // Als niet hybride: stop direct
        if (!hybrid) break;
      }
    }

    // Alle bronnen mislukt → voeg toe aan wishlist voor retry
    const errorMsg = lastError?.message || 'Alle download-bronnen mislukt';
    this.db.updateDownloadJob(jobId, {
      status:   'failed',
      attempts,
      error_log: errorMsg,
    });

    // Voeg toe aan wishlist zodat gebruiker kan zien wat niet gedownload is
    try {
      this.db.addToWishlist(type, album || track, artist, null);
    } catch { /* wishlist item bestaat al of fout */ }

    logger.error({ jobId, artist, album: album || track, attempts, err: errorMsg }, '✗ Download volledig mislukt');
    this.events.emit('download:failed', { id: jobId, artist, album: album || track, source: 'all', error: errorMsg });

    return { id: jobId, status: 'failed', error: errorMsg };
  }

  /**
   * Zoek over alle enabled bronnen (parallel).
   *
   * @param {object} params
   * @param {string} params.query
   * @param {string} [params.type] - 'album' | 'track' | 'artist'
   * @returns {Promise<{ results: Array }>}
   */
  async search({ query, type = 'album' }) {
    const q = (query || '').trim();
    if (q.length < 2) return { results: [] };

    const priority = this._getSourcePriority();
    const enabled  = priority.filter(s => this._isSourceEnabled(s));

    const searches = enabled.map(async src => {
      try {
        if (src === 'tidarr') {
          const d = await this.tidarr.searchTidal(q);
          return (d.results || []).map(r => ({ ...r, source: 'tidarr', sourceName: 'Tidal (Tidarr)' }));
        } else if (src.startsWith('orpheus_')) {
          const platform = orpheusPlatformFromSource(src);
          const d = await this.orpheus.searchOrpheus(q, platform, type);
          return (d.results || []).map(r => ({
            ...r,
            source:     src,
            sourceName: platformLabel(platform),
            platform:   platform,
          }));
        }
      } catch (err) {
        logger.debug({ src, err: err.message }, 'Zoekbron mislukt, overgeslagen');
        return [];
      }
      return [];
    });

    const settled = await Promise.allSettled(searches);
    const results = settled.flatMap(s => s.status === 'fulfilled' ? s.value : []);

    return { results };
  }

  /**
   * Geeft de status van elke bron terug.
   * @returns {Promise<{ sources: Array }>}
   */
  async getSourceStatus() {
    const priority = this._getSourcePriority();
    const allSources = DEFAULT_SOURCE_PRIORITY.slice();

    // Voeg eventuele extra bronnen uit priority toe die niet in de default staan
    for (const s of priority) {
      if (!allSources.includes(s)) allSources.push(s);
    }

    const statuses = await Promise.all(allSources.map(async src => {
      const enabled = this._isSourceEnabled(src);
      const errors  = _sourceErrors.get(src) || { count: 0, lastAt: 0 };
      const lastCheck = _sourceChecked.get(src) || 0;
      let available = null;

      // Doe een echte status-check als de bron enabled is
      if (enabled) {
        try {
          if (src === 'tidarr') {
            const s = await this.tidarr.getTidarrStatus();
            available = s.connected;
          } else if (src.startsWith('orpheus_')) {
            const s = await this.orpheus.getOrpheusStatus();
            available = s.connected;
          }
        } catch {
          available = false;
        }
      }

      _sourceChecked.set(src, Date.now());

      return {
        name:       src,
        label:      src === 'tidarr' ? 'Tidal (Tidarr)' : platformLabel(orpheusPlatformFromSource(src)),
        enabled,
        available:  enabled ? available : null,
        errorCount: errors.count,
        lastError:  errors.lastMsg || null,
        lastCheck:  Date.now(),
        priority:   priority.indexOf(src),
      };
    }));

    return { sources: statuses };
  }

  /**
   * Retry alle gefaalde jobs.
   * @returns {Promise<{ retried: number }>}
   */
  async retryFailed() {
    const failed = this.db.getPendingDownloadJobs();
    if (!failed.length) return { retried: 0 };

    logger.info({ count: failed.length }, 'Retry van alle gefaalde downloads');
    let retried = 0;

    for (const job of failed) {
      this.events.emit('download:retry', { id: job.id, attempt: (job.attempts || 0) + 1 });
      try {
        await this.download({
          artist:  job.artist,
          album:   job.album,
          track:   job.track,
          type:    job.type,
          quality: job.quality,
          source:  job.source_requested || 'auto',
        });
        retried++;
      } catch (err) {
        logger.warn({ jobId: job.id, err: err.message }, 'Retry mislukt');
      }
    }

    return { retried };
  }
}

// ── Helper ────────────────────────────────────────────────────────────────────
function platformLabel(platform) {
  const LABELS = {
    tidal: 'Tidal', qobuz: 'Qobuz', deezer: 'Deezer',
    spotify: 'Spotify', soundcloud: 'SoundCloud', applemusic: 'Apple Music',
    beatport: 'Beatport', beatsource: 'Beatsource', youtube: 'YouTube',
  };
  return LABELS[platform] || platform;
}

module.exports = { DownloadOrchestrator, DEFAULT_SOURCE_PRIORITY };
