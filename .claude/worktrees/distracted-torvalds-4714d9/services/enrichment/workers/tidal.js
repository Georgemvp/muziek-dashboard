'use strict';
// ── Tidal worker ──────────────────────────────────────────────────────────────
// Hergebruikt de bestaande Tidarr-connectie om Tidal-metadata op te halen.
// Geen directe Tidal API-calls — gaat via de lokale Tidarr instantie.

const RATE_INTERVAL = 3000; // 20/min max

class TidalWorker {
  constructor(db, log, { tidarrUrl, tidarrApiKey } = {}) {
    this.db         = db;
    this.log        = log.child ? log.child({ worker: 'tidal' }) : log;
    this.tidarrUrl  = tidarrUrl  || process.env.TIDARR_URL || 'http://localhost:8484';
    this.apiKey     = tidarrApiKey || process.env.TIDARR_API_KEY || null;
    this._lastCall  = 0;
  }

  get isConfigured() {
    return !!this.tidarrUrl;
  }

  async _rateLimit() {
    const wait = Math.max(0, RATE_INTERVAL - (Date.now() - this._lastCall));
    if (wait > 0) await new Promise(r => setTimeout(r, wait));
    this._lastCall = Date.now();
  }

  _headers() {
    const h = { 'Accept': 'application/json', 'Content-Type': 'application/json' };
    if (this.apiKey) h['X-Api-Key'] = this.apiKey;
    return h;
  }

  async _get(path) {
    await this._rateLimit();
    const res = await fetch(`${this.tidarrUrl}${path}`, {
      headers: this._headers(),
      signal:  AbortSignal.timeout(10_000),
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Tidarr HTTP ${res.status}`);
    return res.json();
  }

  async process(entity) {
    if (!this.isConfigured) return { ok: false, error: 'Tidarr URL not configured' };
    try {
      const data = await this.search(entity.entity_name, entity.entity_type);
      if (!data) return { ok: false, error: 'No results found' };
      return { ok: true, data };
    } catch (err) {
      this.log.warn({ err: err.message, entity: entity.entity_name }, 'Tidal/Tidarr fetch failed');
      return { ok: false, error: err.message };
    }
  }

  async search(name, entityType = 'artist') {
    try {
      // Tidarr search endpoint
      const encoded = encodeURIComponent(name);
      const type    = entityType === 'album' ? 'albums' : entityType === 'track' ? 'tracks' : 'artists';
      const data    = await this._get(`/api/search?query=${encoded}&type=${type}`);
      if (!data || !data.items?.length) return null;

      const norm  = s => (s || '').toLowerCase().trim();
      const exact = data.items.find(i =>
        norm(i.name || i.title || i.artistName) === norm(name)
      );
      const best = exact || data.items[0];

      return this._mapItem(best, entityType);
    } catch (err) {
      // Tidarr is optioneel — geef null terug bij connectieproblemen
      if (err.message.includes('fetch') || err.message.includes('ECONNREFUSED')) {
        this.log.debug({ name }, 'Tidarr not reachable, skipping Tidal enrichment');
        return null;
      }
      throw err;
    }
  }

  _mapItem(item, entityType) {
    if (entityType === 'artist') {
      return {
        tidalId:      item.id || null,
        name:         item.name || null,
        popularity:   item.popularity || null,
        picture:      item.picture || null,
        url:          item.url || null,
        source:       'tidal',
        fetchedAt:    Date.now(),
      };
    } else if (entityType === 'album') {
      return {
        tidalId:      item.id || null,
        title:        item.title || null,
        artistName:   item.artist?.name || null,
        releaseDate:  item.releaseDate || null,
        duration:     item.duration || null,
        numberOfTracks: item.numberOfTracks || null,
        audioQuality: item.audioQuality || null,
        cover:        item.cover || null,
        explicitLyrics: item.explicitLyrics || false,
        url:          item.url || null,
        source:       'tidal',
        fetchedAt:    Date.now(),
      };
    }
    return {
      tidalId:      item.id || null,
      title:        item.title || null,
      artistName:   item.artist?.name || null,
      albumTitle:   item.album?.title || null,
      duration:     item.duration || null,
      trackNumber:  item.trackNumber || null,
      audioQuality: item.audioQuality || null,
      isrc:         item.isrc || null,
      url:          item.url || null,
      source:       'tidal',
      fetchedAt:    Date.now(),
    };
  }
}

module.exports = { TidalWorker };
