'use strict';
// ── Discogs worker ────────────────────────────────────────────────────────────
// API: https://api.discogs.com/database/search
// Rate limit: 25 calls/minuut zonder token, 60/min met user-agent token
// We gebruiken 1 call per 2.5 sec als veilige marge

const DISCOGS_BASE   = 'https://api.discogs.com';
const RATE_INTERVAL  = 2500; // ms

class DiscogsWorker {
  constructor(db, log, { token, userAgent } = {}) {
    this.db        = db;
    this.log       = log.child ? log.child({ worker: 'discogs' }) : log;
    this.token     = token     || null;
    this.userAgent = userAgent || 'LastfmMuziekApp/1.0 +https://github.com/muziek';
    this._lastCall = 0;
  }

  async _rateLimit() {
    const wait = Math.max(0, RATE_INTERVAL - (Date.now() - this._lastCall));
    if (wait > 0) await new Promise(r => setTimeout(r, wait));
    this._lastCall = Date.now();
  }

  _headers() {
    const h = { 'User-Agent': this.userAgent, 'Accept': 'application/json' };
    if (this.token) h['Authorization'] = `Discogs token=${this.token}`;
    return h;
  }

  async _get(url) {
    await this._rateLimit();
    const res = await fetch(url, {
      headers: this._headers(),
      signal:  AbortSignal.timeout(12_000),
    });
    if (res.status === 429) throw new Error('Discogs rate limit hit');
    if (!res.ok) throw new Error(`Discogs HTTP ${res.status} — ${url}`);
    return res.json();
  }

  async process(entity) {
    try {
      const data = await this.search(entity.entity_name, entity.entity_type);
      if (!data) return { ok: false, error: 'No results found' };
      return { ok: true, data };
    } catch (err) {
      this.log.warn({ err: err.message, entity: entity.entity_name }, 'Discogs fetch failed');
      return { ok: false, error: err.message };
    }
  }

  async search(name, entityType = 'artist') {
    const discogsType = entityType === 'artist' ? 'artist'
      : entityType === 'album' ? 'master'
      : 'release';

    const url = `${DISCOGS_BASE}/database/search?${new URLSearchParams({
      q:    name,
      type: discogsType,
      per_page: '5',
    })}`;

    const data = await this._get(url);
    const results = (data.results || []);
    if (!results.length) return null;

    const norm  = s => (s || '').toLowerCase().trim();
    const exact = results.find(r => norm(r.title) === norm(name));
    const best  = exact || results[0];

    if (entityType === 'artist') {
      return await this._enrichArtist(best, name);
    }
    return this._mapRelease(best);
  }

  async _enrichArtist(item, originalName) {
    const base = {
      discogsId:   item.id,
      title:       item.title,
      thumb:       item.thumb || null,
      coverImage:  item.cover_image || null,
      uri:         item.uri || null,
      resourceUrl: item.resource_url || null,
      source:      'discogs',
      fetchedAt:   Date.now(),
    };

    // Probeer artist-detail op te halen voor biografie en labels
    if (item.resource_url) {
      try {
        const detail = await this._get(item.resource_url);
        base.profile  = detail.profile  || null;  // biografie
        base.aliases  = (detail.aliases  || []).map(a => a.name);
        base.members  = (detail.members  || []).map(m => m.name);
        base.urls     = detail.urls || [];
        base.nameVariations = detail.namevariations || [];
      } catch (err) {
        this.log.debug({ err: err.message, name: originalName }, 'Discogs artist detail fetch failed');
      }
    }

    return base;
  }

  _mapRelease(item) {
    return {
      discogsId:   item.id,
      title:       item.title,
      year:        item.year || null,
      label:       (item.label || []).join(', ') || null,
      catno:       item.catno || null,
      format:      (item.format || []).join(', ') || null,
      genre:       item.genre || [],
      style:       item.style || [],
      country:     item.country || null,
      thumb:       item.thumb || null,
      coverImage:  item.cover_image || null,
      uri:         item.uri || null,
      source:      'discogs',
      fetchedAt:   Date.now(),
    };
  }
}

module.exports = { DiscogsWorker };
