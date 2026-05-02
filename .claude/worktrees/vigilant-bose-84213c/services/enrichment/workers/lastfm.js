'use strict';
// ── Last.fm enrichment worker ─────────────────────────────────────────────────
// API: https://ws.audioscrobbler.com/2.0/
// Hergebruikt de bestaande lfm() helper uit services/lastfm.js
// (ingebouwde throttle ≤4 req/sec en SQLite-caching zijn al ingebakken)
// Vereist: LASTFM_API_KEY in process.env

const { lfm } = require('../../lastfm');

// ── HTML-link cleaner ─────────────────────────────────────────────────────────
// Last.fm bio's bevatten <a href="...">tekst</a> links; strip die neer.
function _stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<a\b[^>]*>(.*?)<\/a>/gi, '$1') // bewaar anchor-tekst
    .replace(/<[^>]+>/g, '')                   // verwijder overige tags
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&apos;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

class LastfmWorker {
  constructor(db, log) {
    this.db  = db;
    this.log = log.child ? log.child({ worker: 'lastfm' }) : log;
  }

  // ── Hoofdverwerker ────────────────────────────────────────────────────────

  async process(entity) {
    try {
      const type = entity.entity_type;
      let data;

      if (type === 'artist') {
        data = await this._processArtist(entity.entity_name);
      } else if (type === 'album') {
        data = await this._processAlbum(entity.entity_name);
      } else if (type === 'track') {
        data = await this._processTrack(entity.entity_name);
      } else {
        return { ok: false, error: `Onbekend entity_type: ${type}` };
      }

      if (!data) return { ok: false, error: 'Geen Last.fm resultaat' };
      return { ok: true, data };
    } catch (err) {
      // Negeer "artist not found" stille fouten
      if (err.message?.includes('not found') || err.message?.includes('6')) {
        return { ok: false, error: 'Niet gevonden op Last.fm' };
      }
      this.log.warn({ err: err.message, entity: entity.entity_name }, 'Last.fm worker mislukt');
      return { ok: false, error: err.message };
    }
  }

  // ── Artiest ───────────────────────────────────────────────────────────────

  async _processArtist(name) {
    const cacheKey = `enrichment:lfm:artist:${name.toLowerCase()}`;
    const cacheTTL = 7 * 86_400_000; // 7 dagen

    const data = await lfm(
      { method: 'artist.getInfo', artist: name, autocorrect: 1 },
      { includeUser: false, cacheKey, cacheTTL }
    );

    const a = data.artist;
    if (!a) return null;

    const tags     = (a.tags?.tag || []).map(t => t.name).filter(Boolean).slice(0, 10);
    const similar  = (a.similar?.artist || []).slice(0, 10).map(s => ({
      name:      s.name,
      image_url: (s.image?.find(i => i.size === 'medium') || s.image?.[0] || {})['#text'] || null,
    }));

    // Kies best beschikbaar artiestfoto (large of extralarge)
    const images     = a.image || [];
    const artworkUrl = (
      images.find(i => i.size === 'extralarge') ||
      images.find(i => i.size === 'large') ||
      images[images.length - 1] ||
      {}
    )['#text'] || null;

    return {
      listeners:       parseInt(a.stats?.listeners, 10)  || 0,
      playcount:       parseInt(a.stats?.playcount, 10)  || 0,
      tags,
      similar_artists: similar,
      bio:             _stripHtml(a.bio?.summary) || null,
      bio_content:     _stripHtml(a.bio?.content) || null,
      published:       a.bio?.published || null,
      artwork_url:     artworkUrl,
      lastfm_url:      a.url || null,
      mbid:            a.mbid || null,
      on_tour:         a.ontour === '1',
      source:          'lastfm',
      fetchedAt:       Date.now(),
    };
  }

  // ── Album ─────────────────────────────────────────────────────────────────

  async _processAlbum(name) {
    // Zonder artist-naam kan Last.fm album.getInfo niet betrouwbaar opzoeken.
    // We gebruiken album.search als fallback.
    const cacheKey = `enrichment:lfm:album:${name.toLowerCase()}`;
    const cacheTTL = 7 * 86_400_000;

    // Probeer eerst album.search
    const searchData = await lfm(
      { method: 'album.search', album: name, limit: 1 },
      { includeUser: false, cacheKey: `${cacheKey}:search`, cacheTTL }
    );

    const matches = searchData.results?.albummatches?.album || [];
    if (!matches.length) return null;
    const match = matches[0];

    // Haal volledige info op
    let fullData;
    try {
      fullData = await lfm(
        { method: 'album.getInfo', album: match.name, artist: match.artist, autocorrect: 1 },
        { includeUser: false, cacheKey, cacheTTL }
      );
    } catch {
      // Gebruik search-resultaat als fallback
      fullData = null;
    }

    const al = fullData?.album || match;
    const tags = (al.tags?.tag || []).map(t => t.name).filter(Boolean).slice(0, 10);
    const images = al.image || match.image || [];
    const artworkUrl = (
      images.find(i => i.size === 'extralarge') ||
      images.find(i => i.size === 'large') ||
      images[images.length - 1] ||
      {}
    )['#text'] || null;

    return {
      listeners:   parseInt(al.listeners, 10) || 0,
      playcount:   parseInt(al.playcount,  10) || 0,
      tags,
      wiki:        _stripHtml(al.wiki?.summary) || null,
      artwork_url: artworkUrl,
      lastfm_url:  al.url || null,
      mbid:        al.mbid || null,
      source:      'lastfm',
      fetchedAt:   Date.now(),
    };
  }

  // ── Track ─────────────────────────────────────────────────────────────────

  async _processTrack(name) {
    const cacheKey = `enrichment:lfm:track:${name.toLowerCase()}`;
    const cacheTTL = 7 * 86_400_000;

    // Zoek eerst via track.search
    const searchData = await lfm(
      { method: 'track.search', track: name, limit: 1 },
      { includeUser: false, cacheKey: `${cacheKey}:search`, cacheTTL }
    );

    const matches = searchData.results?.trackmatches?.track || [];
    if (!matches.length) return null;
    const match = matches[0];

    // Haal volledige info op
    let fullData;
    try {
      fullData = await lfm(
        { method: 'track.getInfo', track: match.name, artist: match.artist, autocorrect: 1 },
        { includeUser: false, cacheKey, cacheTTL }
      );
    } catch {
      fullData = null;
    }

    const tr   = fullData?.track || match;
    const tags = (tr.toptags?.tag || []).map(t => t.name).filter(Boolean).slice(0, 10);

    return {
      listeners:   parseInt(tr.listeners, 10)  || 0,
      playcount:   parseInt(tr.playcount,  10)  || 0,
      duration_ms: parseInt(tr.duration,   10)  || null,
      tags,
      wiki:        _stripHtml(tr.wiki?.summary) || null,
      lastfm_url:  tr.url || null,
      mbid:        tr.mbid || null,
      source:      'lastfm',
      fetchedAt:   Date.now(),
    };
  }
}

module.exports = { LastfmWorker };
