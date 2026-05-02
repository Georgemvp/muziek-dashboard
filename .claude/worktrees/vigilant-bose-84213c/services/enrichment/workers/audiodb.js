'use strict';
// ── AudioDB worker ────────────────────────────────────────────────────────────
// API: https://theaudiodb.com/api/v1/json/2/search.php?s=ARTIST
// Gratis tier — geen API key nodig voor publieke endpoints
// Rate limit: conservatief 1 call per 3 sec

const AUDIODB_BASE  = 'https://theaudiodb.com/api/v1/json/2';
const RATE_INTERVAL = 3000;

class AudioDBWorker {
  constructor(db, log) {
    this.db  = db;
    this.log = log.child ? log.child({ worker: 'audiodb' }) : log;
    this._lastCall = 0;
  }

  async _rateLimit() {
    const wait = Math.max(0, RATE_INTERVAL - (Date.now() - this._lastCall));
    if (wait > 0) await new Promise(r => setTimeout(r, wait));
    this._lastCall = Date.now();
  }

  async _get(url) {
    await this._rateLimit();
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'LastfmMuziekApp/1.0' },
      signal:  AbortSignal.timeout(12_000),
    });
    if (!res.ok) throw new Error(`AudioDB HTTP ${res.status}`);
    return res.json();
  }

  async process(entity) {
    try {
      const data = await this.search(entity.entity_name, entity.entity_type);
      if (!data) return { ok: false, error: 'No results found' };
      return { ok: true, data };
    } catch (err) {
      this.log.warn({ err: err.message, entity: entity.entity_name }, 'AudioDB fetch failed');
      return { ok: false, error: err.message };
    }
  }

  async search(name, entityType = 'artist') {
    if (entityType === 'artist') {
      return this._searchArtist(name);
    } else if (entityType === 'album') {
      return this._searchAlbum(name);
    }
    return null;
  }

  async _searchArtist(name) {
    const encoded = encodeURIComponent(name);
    const data    = await this._get(`${AUDIODB_BASE}/search.php?s=${encoded}`);
    const artists = data.artists || [];
    if (!artists.length) return null;

    const norm  = s => (s || '').toLowerCase().trim();
    const exact = artists.find(a => norm(a.strArtist) === norm(name));
    const a     = exact || artists[0];

    return {
      audiodbId:     a.idArtist,
      name:          a.strArtist,
      formedYear:    a.intFormedYear || null,
      bornYear:      a.intBornYear || null,
      disbandedYear: a.intDisbandYear || null,
      gender:        a.strGender || null,
      members:       a.intMembers || null,
      country:       a.strCountry || null,
      countryCode:   a.strCountryCode || null,
      genre:         a.strGenre || null,
      style:         a.strStyle || null,
      mood:          a.strMood || null,
      theme:         a.strTheme || null,
      website:       a.strWebsite || null,
      facebook:      a.strFacebook || null,
      twitter:       a.strTwitter || null,
      biography: {
        en: a.strBiographyEN || null,
        nl: a.strBiographyNL || null,
        de: a.strBiographyDE || null,
        fr: a.strBiographyFR || null,
      },
      logo:          a.strArtistLogo || null,
      thumb:         a.strArtistThumb || null,
      banner:        a.strArtistBanner || null,
      fanart:        a.strArtistFanart || a.strArtistFanart2 || null,
      musicbrainzId: a.strMusicBrainzID || null,
      lastfmChart:   a.strLastFMChart || null,
      source:        'audiodb',
      fetchedAt:     Date.now(),
    };
  }

  async _searchAlbum(name) {
    const encoded = encodeURIComponent(name);
    const data    = await this._get(`${AUDIODB_BASE}/searchalbum.php?s=all&a=${encoded}`);
    const albums  = data.album || [];
    if (!albums.length) return null;

    const norm  = s => (s || '').toLowerCase().trim();
    const exact = albums.find(a => norm(a.strAlbum) === norm(name));
    const al    = exact || albums[0];

    return {
      audiodbId:     al.idAlbum,
      name:          al.strAlbum,
      artistName:    al.strArtist,
      year:          al.intYearReleased || null,
      genre:         al.strGenre || null,
      style:         al.strStyle || null,
      mood:          al.strMood || null,
      theme:         al.strTheme || null,
      speed:         al.strSpeed || null,
      description: {
        en: al.strDescriptionEN || null,
        nl: al.strDescriptionNL || null,
      },
      thumbUrl:      al.strAlbumThumb || null,
      thumbBackUrl:  al.strAlbumThumbBack || null,
      cdArtUrl:      al.strAlbumCDart || null,
      spine:         al.strAlbumSpine || null,
      label:         al.strLabel || null,
      score:         al.intScore || null,
      loved:         al.intLoved || null,
      musicbrainzId: al.strMusicBrainzID || null,
      source:        'audiodb',
      fetchedAt:     Date.now(),
    };
  }
}

module.exports = { AudioDBWorker };
