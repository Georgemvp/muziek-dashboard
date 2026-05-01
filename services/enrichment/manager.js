'use strict';
// ── Enrichment Manager ────────────────────────────────────────────────────────
// Orchestreert alle enrichment workers als achtergrondprocessen.

const logger = require('../../logger');

const { iTunesWorker }  = require('./workers/itunes');
const { DiscogsWorker } = require('./workers/discogs');
const { AudioDBWorker } = require('./workers/audiodb');
const { GeniusWorker }  = require('./workers/genius');
const { TidalWorker }   = require('./workers/tidal');
const { QobuzWorker }   = require('./workers/qobuz');

const {
  enqueueEnrichment,
  getPendingEnrichmentItems,
  updateEnrichmentItem,
  resetStuckEnrichmentItems,
  getEnrichmentQueueStats,
  saveEnrichmentData,
  getGenreWhitelist,
  getSetting,
} = require('../../db');

const MAX_ATTEMPTS    = 3;
const POLL_INTERVAL   = 10_000; // 10 sec

class EnrichmentManager {
  constructor() {
    this._workers    = {};   // source → { worker, status, timer, stats }
    this._paused     = new Set();
    this._pausedAll  = false;
    this._initialized = false;
    this._plexArtistsFn = null; // injecteerbaar via init()
    this._genreWhitelistEnabled = false;
    this._genreSet   = null;   // Set van enabled genres (null = niet geladen)
    this.log = logger.child ? logger.child({ service: 'enrichment' }) : logger;
  }

  /**
   * Initialiseer de manager en start alle ingeschakelde workers.
   * @param {object} deps - Gedeelde dependencies (getPlexArtistNames, getSetting, …)
   */
  init(deps = {}) {
    if (this._initialized) return;
    this._initialized = true;

    if (deps.getPlexArtistNames) {
      this._plexArtistsFn = deps.getPlexArtistNames;
    }

    // Lees settings uit DB
    const tidarrUrl    = process.env.TIDARR_URL  || 'http://localhost:8484';
    const tidarrKey    = process.env.TIDARR_API_KEY || null;
    const orpheusUrl   = process.env.ORPHEUS_URL || 'http://localhost:5000';
    const geniusKey    = getSetting('enrichment', 'genius_api_key') || process.env.GENIUS_API_KEY || null;
    const discogsToken = getSetting('enrichment', 'discogs_token')  || process.env.DISCOGS_TOKEN  || null;
    const discogsUA    = getSetting('enrichment', 'discogs_user_agent') || 'LastfmMuziekApp/1.0';

    const dbRef  = require('../../db');
    const logRef = this.log;

    // Definieer alle workers
    const workerDefs = [
      {
        source:  'itunes',
        label:   'iTunes/Apple Music',
        worker:  new iTunesWorker(dbRef, logRef),
        enabled: true,
      },
      {
        source:  'discogs',
        label:   'Discogs',
        worker:  new DiscogsWorker(dbRef, logRef, { token: discogsToken, userAgent: discogsUA }),
        enabled: true,
      },
      {
        source:  'audiodb',
        label:   'TheAudioDB',
        worker:  new AudioDBWorker(dbRef, logRef),
        enabled: true,
      },
      {
        source:  'genius',
        label:   'Genius',
        worker:  new GeniusWorker(dbRef, logRef, { apiKey: geniusKey }),
        enabled: !!geniusKey,
      },
      {
        source:  'tidal',
        label:   'Tidal (via Tidarr)',
        worker:  new TidalWorker(dbRef, logRef, { tidarrUrl, tidarrApiKey: tidarrKey }),
        enabled: !!tidarrUrl,
      },
      {
        source:  'qobuz',
        label:   'Qobuz (via OrpheusDL)',
        worker:  new QobuzWorker(dbRef, logRef, { orpheusUrl }),
        enabled: !!orpheusUrl,
      },
    ];

    for (const def of workerDefs) {
      // Controleer of worker handmatig is uitgeschakeld via settings
      const settingKey = `worker_${def.source}_enabled`;
      const settingVal = getSetting('enrichment', settingKey);
      const enabled    = settingVal !== null ? settingVal !== false && settingVal !== 'false' : def.enabled;

      this._workers[def.source] = {
        label:       def.label,
        worker:      def.worker,
        enabled,
        timer:       null,
        stats: {
          processed:   0,
          errors:      0,
          skipped:     0,
          lastSuccess: null,
          lastError:   null,
        },
      };

      if (enabled) {
        this._scheduleWorker(def.source);
        this.log.info({ source: def.source }, `✓ Enrichment worker gestart: ${def.label}`);
      } else {
        this.log.debug({ source: def.source }, `⏸ Enrichment worker uitgeschakeld: ${def.label}`);
      }
    }

    this.log.info({ workers: Object.keys(this._workers).length }, 'Enrichment manager geïnitialiseerd');
  }

  /** Start de poll-loop voor één worker. */
  _scheduleWorker(source) {
    const entry = this._workers[source];
    if (!entry || entry.timer) return;

    // Reset eventueel vastgelopen items
    resetStuckEnrichmentItems(source);

    const tick = async () => {
      if (this._pausedAll || this._paused.has(source) || !entry.enabled) {
        entry.timer = setTimeout(tick, POLL_INTERVAL);
        return;
      }

      try {
        await this._processBatch(source);
      } catch (err) {
        this.log.error({ err: err.message, source }, 'Enrichment worker crash');
        entry.stats.lastError = { err: err.message, at: Date.now() };
        entry.stats.errors++;
      }

      entry.timer = setTimeout(tick, POLL_INTERVAL);
    };

    // Kleine vertraging bij opstarten zodat DB/Plex al klaar zijn
    entry.timer = setTimeout(tick, 5000 + Math.random() * 5000);
  }

  /** Verwerk één batch items voor een bron. */
  async _processBatch(source) {
    const entry = this._workers[source];
    if (!entry) return;

    const items = getPendingEnrichmentItems(source, 5);
    if (!items.length) return;

    for (const item of items) {
      // Check pogingen
      if (item.attempts >= MAX_ATTEMPTS) {
        updateEnrichmentItem(item.id, 'skipped', `Max pogingen bereikt (${MAX_ATTEMPTS})`);
        entry.stats.skipped++;
        continue;
      }

      // Markeer als bezig
      updateEnrichmentItem(item.id, 'processing', null);

      const result = await entry.worker.process(item);

      if (result.ok && result.data) {
        // Sla data op
        const enrichData = this._applyGenreFilter(result.data);
        saveEnrichmentData(item.entity_type, item.entity_name, source, enrichData);
        updateEnrichmentItem(item.id, 'done', null);
        entry.stats.processed++;
        entry.stats.lastSuccess = Date.now();

        this.log.debug({
          source,
          entity:      item.entity_name,
          entityType:  item.entity_type,
        }, 'Enrichment item verwerkt');
      } else {
        const errMsg = result.error || 'Unknown error';
        const newAttempts = (item.attempts || 0) + 1;
        const newStatus   = newAttempts >= MAX_ATTEMPTS ? 'error' : 'pending';
        updateEnrichmentItem(item.id, newStatus, errMsg);
        entry.stats.errors++;
        entry.stats.lastError = { err: errMsg, at: Date.now() };

        this.log.debug({ source, entity: item.entity_name, err: errMsg, attempt: newAttempts }, 'Enrichment item mislukt');
      }
    }
  }

  /**
   * Filter genre-velden in enrichment-data via de whitelist (als ingeschakeld).
   * @param {object} data
   * @returns {object}
   */
  _applyGenreFilter(data) {
    if (!this._genreWhitelistEnabled) return data;

    // Laad whitelist als nog niet gedaan
    if (!this._genreSet) {
      const rows = getGenreWhitelist();
      this._genreSet = new Set(
        rows.filter(r => r.enabled).map(r => r.genre.toLowerCase())
      );
    }

    const filtered = { ...data };
    const isValid  = g => this._genreSet.has((g || '').toLowerCase().trim());

    if (Array.isArray(filtered.genres)) {
      filtered.genres = filtered.genres.filter(isValid);
    }
    if (Array.isArray(filtered.genre)) {
      filtered.genre = filtered.genre.filter(isValid);
    }
    if (typeof filtered.primaryGenre === 'string' && !isValid(filtered.primaryGenre)) {
      filtered.primaryGenre = null;
    }
    if (typeof filtered.genre === 'string' && !isValid(filtered.genre)) {
      filtered.genre = null;
    }
    if (Array.isArray(filtered.style)) {
      filtered.style = filtered.style.filter(isValid);
    }

    return filtered;
  }

  /** Invalideer de genre-cache zodat hij opnieuw ingeladen wordt. */
  refreshGenreCache() {
    this._genreSet = null;
  }

  // ── Publieke API ───────────────────────────────────────────────────────────

  /** Pause één worker. */
  pause(source) {
    this._paused.add(source);
    this.log.info({ source }, 'Enrichment worker gepauzeerd');
  }

  /** Resume één worker. */
  resume(source) {
    this._paused.delete(source);
    this.log.info({ source }, 'Enrichment worker hervat');
  }

  /** Pause alle workers. */
  pauseAll() {
    this._pausedAll = true;
    this.log.info('Alle enrichment workers gepauzeerd');
  }

  /** Resume alle workers. */
  resumeAll() {
    this._pausedAll = false;
    this.log.info('Alle enrichment workers hervat');
  }

  /** Zet genre whitelist filter aan/uit. */
  setGenreFilterEnabled(enabled) {
    this._genreWhitelistEnabled = !!enabled;
    this._genreSet = null;  // reset cache
    this.log.info({ enabled: this._genreWhitelistEnabled }, 'Genre whitelist filter bijgewerkt');
  }

  /**
   * Geeft de status terug van alle workers + queue-stats.
   */
  getStatus() {
    const queueStats = getEnrichmentQueueStats();
    const result = {};

    for (const [source, entry] of Object.entries(this._workers)) {
      const q = queueStats[source] || {};
      result[source] = {
        label:      entry.label,
        enabled:    entry.enabled,
        paused:     this._pausedAll || this._paused.has(source),
        queue: {
          pending:    q.pending    || 0,
          processing: q.processing || 0,
          done:       q.done       || 0,
          error:      q.error      || 0,
          skipped:    q.skipped    || 0,
        },
        stats: {
          processed:   entry.stats.processed,
          errors:      entry.stats.errors,
          skipped:     entry.stats.skipped,
          lastSuccess: entry.stats.lastSuccess,
          lastError:   entry.stats.lastError,
        },
        genreFilterEnabled: this._genreWhitelistEnabled,
      };
    }
    return result;
  }

  /**
   * Voeg een artiest toe aan de queue voor alle ingeschakelde bronnen.
   * @param {string} name
   * @param {string} [entityId]
   */
  queueArtist(name, entityId = null) {
    if (!name) return 0;
    let added = 0;
    for (const source of Object.keys(this._workers)) {
      if (this._workers[source].enabled) {
        const ok = enqueueEnrichment('artist', name, source, entityId);
        if (ok) added++;
      }
    }
    return added;
  }

  /**
   * Queue alle artiesten uit de Plex-bibliotheek.
   * @returns {Promise<{ queued: number, artists: number }>}
   */
  async queueAll() {
    if (!this._plexArtistsFn) {
      this.log.warn('queueAll: geen getPlexArtistNames functie beschikbaar');
      return { queued: 0, artists: 0 };
    }

    const names  = this._plexArtistsFn() || [];
    let   queued = 0;

    for (const name of names) {
      queued += this.queueArtist(name);
    }

    this.log.info({ artists: names.length, queued }, 'Alle Plex artiesten toegevoegd aan enrichment queue');
    return { queued, artists: names.length };
  }
}

// Singleton
const enrichmentManager = new EnrichmentManager();

module.exports = enrichmentManager;
