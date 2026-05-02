'use strict';
// ── iTunes/Apple Music worker ─────────────────────────────────────────────────
// API: https://itunes.apple.com/search  — geen API key nodig
// Rate limit: max 20 calls/minuut (conservatief: 1 call per 4 sec)

const ITUNES_BASE    = 'https://itunes.apple.com';
const RATE_INTERVAL  = 4000; // ms tussen calls

class iTunesWorker {
  constructor(db, log) {
    this.db  = db;
    this.log = log.child ? log.child({ worker: 'itunes' }) : log;
    this._lastCall = 0;
  }

  /** Wacht totdat de rate-limit voorbij is. */
  async _rateLimit() {
    const wait = Math.max(0, RATE_INTERVAL - (Date.now() - this._lastCall));
    if (wait > 0) await new Promise(r => setTimeout(r, wait));
    this._lastCall = Date.now();
  }

  /**
   * Verwerk één queue-item.
   * @param {{ entity_type, entity_name, entity_id }} entity
   * @returns {{ ok: boolean, data?: object, error?: string }}
   */
  async process(entity) {
    try {
      const data = await this.search(entity.entity_name, entity.entity_type);
      if (!data) return { ok: false, error: 'No results found' };
      return { ok: true, data };
    } catch (err) {
      this.log.warn({ err: err.message, entity: entity.entity_name }, 'iTunes fetch failed');
      return { ok: false, error: err.message };
    }
  }

  /**
   * Zoek een artiest/album/track op bij iTunes.
   * @param {string} name
   * @param {'artist'|'album'|'track'} entityType
   */
  async search(name, entityType = 'artist') {
    await this._rateLimit();

    const itunesEntity = entityType === 'artist'
      ? 'musicArtist'
      : entityType === 'album'
        ? 'album'
        : 'musicTrack';

    const url = `${ITUNES_BASE}/search?${new URLSearchParams({
      term:   name,
      entity: itunesEntity,
      limit:  '5',
      media:  'music',
    })}`;

    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal:  AbortSignal.timeout(10_000),
    });

    if (!res.ok) throw new Error(`iTunes HTTP ${res.status}`);

    const json = await res.json();
    const results = json.results || [];
    if (!results.length) return null;

    // Zoek naar exacte match
    const norm  = s => (s || '').toLowerCase().trim();
    const exact = results.find(r =>
      norm(r.artistName || r.collectionName || r.trackName) === norm(name)
    );
    const best = exact || results[0];

    if (entityType === 'artist') {
      return this._mapArtist(best, results);
    } else if (entityType === 'album') {
      return this._mapAlbum(best);
    }
    return this._mapTrack(best);
  }

  _mapArtist(item, allResults) {
    return {
      artistId:     item.artistId,
      artistName:   item.artistName,
      artistType:   item.artistType,
      primaryGenre: item.primaryGenreName,
      genres:       [...new Set(allResults.map(r => r.primaryGenreName).filter(Boolean))],
      artistLinkUrl: item.artistLinkUrl,
      artworkUrl:   item.artworkUrl100 || null,
      source:       'itunes',
      fetchedAt:    Date.now(),
    };
  }

  _mapAlbum(item) {
    return {
      collectionId:   item.collectionId,
      collectionName: item.collectionName,
      artistName:     item.artistName,
      artworkUrl:     (item.artworkUrl100 || '').replace('100x100', '600x600'),
      releaseDate:    item.releaseDate,
      trackCount:     item.trackCount,
      primaryGenre:   item.primaryGenreName,
      collectionPrice: item.collectionPrice,
      currency:       item.currency,
      country:        item.country,
      source:         'itunes',
      fetchedAt:      Date.now(),
    };
  }

  _mapTrack(item) {
    return {
      trackId:        item.trackId,
      trackName:      item.trackName,
      artistName:     item.artistName,
      collectionName: item.collectionName,
      previewUrl:     item.previewUrl,
      artworkUrl:     (item.artworkUrl100 || '').replace('100x100', '600x600'),
      trackPrice:     item.trackPrice,
      releaseDate:    item.releaseDate,
      primaryGenre:   item.primaryGenreName,
      trackTimeMillis: item.trackTimeMillis,
      source:         'itunes',
      fetchedAt:      Date.now(),
    };
  }
}

module.exports = { iTunesWorker };
