'use strict';
// ── Genius worker ─────────────────────────────────────────────────────────────
// API: https://api.genius.com/search?q=TRACK
// Vereist API key (gratis via genius.com/api-clients)
// Rate limit: 1 call per 2 sec (conservatief)

const GENIUS_BASE   = 'https://api.genius.com';
const RATE_INTERVAL = 2000;

class GeniusWorker {
  constructor(db, log, { apiKey } = {}) {
    this.db      = db;
    this.log     = log.child ? log.child({ worker: 'genius' }) : log;
    this.apiKey  = apiKey || null;
    this._lastCall = 0;
  }

  get isConfigured() {
    return !!this.apiKey;
  }

  async _rateLimit() {
    const wait = Math.max(0, RATE_INTERVAL - (Date.now() - this._lastCall));
    if (wait > 0) await new Promise(r => setTimeout(r, wait));
    this._lastCall = Date.now();
  }

  async _get(path, params = {}) {
    if (!this.apiKey) throw new Error('Genius API key not configured');
    await this._rateLimit();

    const qs  = new URLSearchParams(params).toString();
    const url = `${GENIUS_BASE}${path}${qs ? '?' + qs : ''}`;
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Accept': 'application/json',
        'User-Agent': 'LastfmMuziekApp/1.0',
      },
      signal: AbortSignal.timeout(12_000),
    });

    if (res.status === 401) throw new Error('Genius: invalid API key');
    if (res.status === 429) throw new Error('Genius rate limit hit');
    if (!res.ok)            throw new Error(`Genius HTTP ${res.status}`);

    const json = await res.json();
    if (json.meta?.status !== 200) throw new Error(`Genius API error: ${json.meta?.message}`);
    return json.response;
  }

  async process(entity) {
    if (!this.isConfigured) return { ok: false, error: 'Genius API key not configured' };
    try {
      const data = await this.search(entity.entity_name, entity.entity_type);
      if (!data) return { ok: false, error: 'No results found' };
      return { ok: true, data };
    } catch (err) {
      this.log.warn({ err: err.message, entity: entity.entity_name }, 'Genius fetch failed');
      return { ok: false, error: err.message };
    }
  }

  async search(name, entityType = 'artist') {
    if (entityType === 'artist') {
      return this._searchArtist(name);
    }
    return this._searchTrack(name);
  }

  async _searchArtist(name) {
    const resp    = await this._get('/search', { q: name, per_page: '5' });
    const hits    = (resp.hits || []).filter(h => h.type === 'song');
    if (!hits.length) return null;

    const norm   = s => (s || '').toLowerCase().trim();
    const match  = hits.find(h => norm(h.result?.primary_artist?.name) === norm(name));
    const best   = match || hits[0];
    const artist = best?.result?.primary_artist;
    if (!artist) return null;

    // Haal artiest-detail op
    try {
      const detail = await this._get(`/artists/${artist.id}`);
      const a      = detail.artist || artist;
      return {
        geniusId:        a.id,
        name:            a.name,
        slug:            a.slug,
        url:             a.url,
        headerImageUrl:  a.header_image_url || null,
        imageUrl:        a.image_url || null,
        description:     a.description?.plain || null,
        facebookName:    a.facebook_name || null,
        twitterName:     a.twitter_name || null,
        instagramName:   a.instagram_name || null,
        isVerified:      a.is_verified || false,
        followersCount:  a.followers_count || 0,
        source:          'genius',
        fetchedAt:       Date.now(),
      };
    } catch (err) {
      // Terugvallen op basis-info
      return {
        geniusId:   artist.id,
        name:       artist.name,
        imageUrl:   artist.image_url || null,
        url:        artist.url,
        source:     'genius',
        fetchedAt:  Date.now(),
      };
    }
  }

  async _searchTrack(name) {
    const resp  = await this._get('/search', { q: name, per_page: '5' });
    const hits  = (resp.hits || []).filter(h => h.type === 'song');
    if (!hits.length) return null;

    const norm  = s => (s || '').toLowerCase().trim();
    const exact = hits.find(h => norm(h.result?.title) === norm(name));
    const song  = (exact || hits[0])?.result;
    if (!song) return null;

    return {
      geniusId:       song.id,
      title:          song.title,
      titleWithFeatured: song.title_with_featured,
      artistName:     song.primary_artist?.name || null,
      url:            song.url,
      lyricsUrl:      song.url,
      headerImageUrl: song.header_image_url || null,
      thumbnailUrl:   song.song_art_image_thumbnail_url || null,
      releaseDate:    song.release_date_for_display || null,
      pageViews:      song.stats?.pageviews || null,
      source:         'genius',
      fetchedAt:      Date.now(),
    };
  }
}

module.exports = { GeniusWorker };
