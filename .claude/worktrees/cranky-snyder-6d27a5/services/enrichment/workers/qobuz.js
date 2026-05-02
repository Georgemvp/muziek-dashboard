'use strict';
// ── Qobuz worker ──────────────────────────────────────────────────────────────
// Gaat via OrpheusDL's Qobuz-module (lokale proxy).
// OrpheusDL endpoint: GET /api/search?query=NAME&platform=qobuz&type=artists
// Rate limit: 1 call per 3 sec (conservatief)

const RATE_INTERVAL = 3000;

class QobuzWorker {
  constructor(db, log, { orpheusUrl } = {}) {
    this.db         = db;
    this.log        = log.child ? log.child({ worker: 'qobuz' }) : log;
    this.orpheusUrl = orpheusUrl || process.env.ORPHEUS_URL || 'http://localhost:5000';
    this._lastCall  = 0;
  }

  get isConfigured() {
    return !!this.orpheusUrl;
  }

  async _rateLimit() {
    const wait = Math.max(0, RATE_INTERVAL - (Date.now() - this._lastCall));
    if (wait > 0) await new Promise(r => setTimeout(r, wait));
    this._lastCall = Date.now();
  }

  async _get(path) {
    await this._rateLimit();
    const res = await fetch(`${this.orpheusUrl}${path}`, {
      headers: { 'Accept': 'application/json' },
      signal:  AbortSignal.timeout(12_000),
    });
    if (res.status === 404) return null;
    if (res.status === 401 || res.status === 403) {
      throw new Error('Qobuz: niet geauthenticeerd via OrpheusDL');
    }
    if (!res.ok) throw new Error(`OrpheusDL/Qobuz HTTP ${res.status}`);
    return res.json();
  }

  async process(entity) {
    if (!this.isConfigured) return { ok: false, error: 'OrpheusDL URL not configured' };
    try {
      const data = await this.search(entity.entity_name, entity.entity_type);
      if (!data) return { ok: false, error: 'No results found' };
      return { ok: true, data };
    } catch (err) {
      this.log.warn({ err: err.message, entity: entity.entity_name }, 'Qobuz/OrpheusDL fetch failed');
      return { ok: false, error: err.message };
    }
  }

  async search(name, entityType = 'artist') {
    try {
      const encoded = encodeURIComponent(name);
      const type    = entityType === 'album' ? 'albums' : entityType === 'track' ? 'tracks' : 'artists';
      const data    = await this._get(`/api/search?query=${encoded}&platform=qobuz&type=${type}`);

      if (!data || !data.results?.length) return null;

      const norm  = s => (s || '').toLowerCase().trim();
      const exact = data.results.find(r =>
        norm(r.name || r.title) === norm(name)
      );
      const best = exact || data.results[0];

      return this._mapItem(best, entityType);
    } catch (err) {
      if (err.message.includes('fetch') || err.message.includes('ECONNREFUSED')) {
        this.log.debug({ name }, 'OrpheusDL not reachable, skipping Qobuz enrichment');
        return null;
      }
      throw err;
    }
  }

  _mapItem(item, entityType) {
    if (entityType === 'artist') {
      return {
        qobuzId:      item.id || null,
        name:         item.name || null,
        imageUrl:     item.image?.large || item.image?.small || null,
        popularity:   item.popularity || null,
        albumCount:   item.albums_count || null,
        biography:    item.biography?.content || null,
        genres:       (item.genres_list || []),
        source:       'qobuz',
        fetchedAt:    Date.now(),
      };
    } else if (entityType === 'album') {
      return {
        qobuzId:      item.id || null,
        title:        item.title || null,
        artistName:   item.artist?.name || null,
        releaseDate:  item.release_date_original || item.released_at || null,
        duration:     item.duration || null,
        trackCount:   item.tracks_count || null,
        label:        item.label?.name || null,
        genre:        item.genre?.name || null,
        maxSampleRate: item.maximum_sampling_rate || null,
        maxBitDepth:  item.maximum_bit_depth || null,
        imageUrl:     item.image?.large || null,
        isHiRes:      !!(item.hires || item.hires_streamable),
        upc:          item.upc || null,
        source:       'qobuz',
        fetchedAt:    Date.now(),
      };
    }
    return {
      qobuzId:      item.id || null,
      title:        item.title || null,
      artistName:   item.performer?.name || null,
      albumTitle:   item.album?.title || null,
      duration:     item.duration || null,
      trackNumber:  item.track_number || null,
      isrc:         item.isrc || null,
      maxSampleRate: item.maximum_sampling_rate || null,
      maxBitDepth:  item.maximum_bit_depth || null,
      isHiRes:      !!(item.hires || item.hires_streamable),
      source:       'qobuz',
      fetchedAt:    Date.now(),
    };
  }
}

module.exports = { QobuzWorker };
