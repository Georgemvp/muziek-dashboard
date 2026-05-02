// ── Scrobbler Service ─────────────────────────────────────────────────────────
// Stuurt scrobbles naar Last.fm en/of ListenBrainz vanuit Plex webhooks.
//
// Last.fm API signing:
//   Alle params (behalve 'format') worden alfabetisch gesorteerd, samengevoegd
//   als "key=value...", dan api_secret eraan gehangen, dan MD5 gehashed.
//
// ListenBrainz:
//   POST https://api.listenbrainz.org/1/submit-listens
//   Header: Authorization: Token <user_token>
//
// Scrobble regel (Last.fm-compatible):
//   Een track mag gescrobbeld worden als hij minstens 30 seconden lang is EN
//   de gebruiker hem minstens 50% of 4 minuten heeft beluisterd.
'use strict';

const crypto = require('crypto');
const logger = require('../logger');

const LASTFM_API_BASE  = 'https://ws.audioscrobbler.com/2.0/';
const LB_API_BASE      = 'https://api.listenbrainz.org/1';
const LASTFM_AUTH_BASE = 'https://www.last.fm/api/auth/';

// Retry-interval voor mislukte scrobbles (5 minuten)
const RETRY_INTERVAL_MS = 5 * 60 * 1000;

class Scrobbler {
  /**
   * @param {object} opts
   * @param {object} opts.db            - db-functies uit db.js
   * @param {Function} opts.getSetting  - getSetting(category, key)
   * @param {Function} opts.setSetting  - setSetting(category, key, value)
   */
  constructor({ db, getSetting, setSetting }) {
    this.db         = db;
    this.getSetting = getSetting;
    this.setSetting = setSetting;
    this._retryTimer = null;
    this._startRetryLoop();
  }

  // ── Configuratie helpers ──────────────────────────────────────────────────

  _cfg(key) { return this.getSetting('scrobbler', key); }

  get lastfmEnabled()    { return !!this._cfg('lastfm_enabled'); }
  get lastfmApiKey()     { return process.env.LASTFM_API_KEY || ''; }
  get lastfmApiSecret()  { return process.env.LASTFM_API_SECRET || ''; }
  get lastfmSessionKey() { return this._cfg('lastfm_session_key') || ''; }

  get lbEnabled()        { return !!this._cfg('lb_enabled'); }
  get lbToken()          { return this._cfg('lb_token') || ''; }
  get lbUsername()       { return this._cfg('lb_username') || ''; }

  // ── Publieke API ──────────────────────────────────────────────────────────

  /**
   * Scrobble een track naar Last.fm en/of ListenBrainz (afhankelijk van config).
   * Slaat het resultaat op in scrobble_log.
   *
   * @param {object} trackData
   * @param {string} trackData.artist
   * @param {string} trackData.track
   * @param {string} [trackData.album]
   * @param {number} [trackData.timestamp]   - Unix epoch (seconds). Defaults to now.
   * @param {number} [trackData.duration_ms] - Duur in ms (voor scrobble-rule check)
   * @param {number} [trackData.viewOffset]  - Afgespeeld ms (voor scrobble-rule check)
   * @param {string} [trackData.source]
   */
  async scrobble(trackData) {
    const {
      artist,
      track,
      album        = null,
      timestamp    = Math.floor(Date.now() / 1000),
      duration_ms  = null,
      viewOffset   = null,
      source       = 'plex',
    } = trackData;

    if (!artist || !track) {
      logger.warn({ trackData }, 'Scrobble: artiest of tracknaam ontbreekt, overgeslagen');
      return;
    }

    // Scrobble-regel: minstens 50% of 4 min afgespeeld, minimaal 30 sec lang
    if (duration_ms && viewOffset !== null) {
      const minMs = Math.min(duration_ms * 0.5, 4 * 60 * 1000);
      if (duration_ms < 30_000) {
        logger.debug({ artist, track, duration_ms }, 'Scrobble: track te kort (<30s), overgeslagen');
        return;
      }
      if (viewOffset < minMs) {
        logger.debug({ artist, track, viewOffset, minMs }, 'Scrobble: onvoldoende afgespeeld, overgeslagen');
        return;
      }
    }

    // Opslaan in DB (met deduplicatie)
    let id;
    try {
      id = this.db.insertScrobble({ artist, track, album, timestamp, duration_ms, source });
      if (id === null) return; // duplicaat
    } catch (err) {
      logger.error({ err, artist, track }, 'Scrobble: DB insert mislukt');
      return;
    }

    // Verstuur naar beide targets
    await Promise.all([
      this._sendLastfm(id, { artist, track, album, timestamp }),
      this._sendListenBrainz(id, { artist, track, album, timestamp }),
    ]);
  }

  /**
   * Stel de "Now Playing" status in op Last.fm (geen scrobble, geen DB-entry).
   */
  async updateNowPlaying({ artist, track, album = null, duration_ms = null }) {
    if (!this.lastfmEnabled || !this.lastfmSessionKey) return;
    try {
      const params = {
        method:  'track.updateNowPlaying',
        artist,
        track,
        api_key: this.lastfmApiKey,
        sk:      this.lastfmSessionKey,
      };
      if (album)       params.album    = album;
      if (duration_ms) params.duration = Math.floor(duration_ms / 1000);

      params.api_sig = this._lastfmSign(params);
      params.format  = 'json';

      await this._lfmPost(params);
      logger.debug({ artist, track }, 'Last.fm Now Playing bijgewerkt');
    } catch (err) {
      logger.warn({ err, artist, track }, 'Last.fm Now Playing mislukt (niet-kritiek)');
    }
  }

  // ── Last.fm OAuth helpers ─────────────────────────────────────────────────

  /** Geeft de redirect-URL terug voor de Last.fm OAuth flow. */
  getLastfmAuthUrl(callbackUrl) {
    const params = new URLSearchParams({
      api_key:  this.lastfmApiKey,
      cb:       callbackUrl,
    });
    return `${LASTFM_AUTH_BASE}?${params.toString()}`;
  }

  /**
   * Wissel een Last.fm token voor een sessiesleutel.
   * @param {string} token - De 'token' query-param uit de OAuth callback
   * @returns {Promise<string>} session key
   */
  async exchangeLastfmToken(token) {
    const params = {
      method:  'auth.getSession',
      api_key: this.lastfmApiKey,
      token,
    };
    params.api_sig = this._lastfmSign(params);
    params.format  = 'json';

    const url = `${LASTFM_API_BASE}?${new URLSearchParams(params).toString()}`;
    const res  = await fetch(url);
    const body = await res.json();

    if (body.error) {
      throw new Error(`Last.fm auth fout ${body.error}: ${body.message}`);
    }
    const sk = body.session?.key;
    if (!sk) throw new Error('Last.fm gaf geen sessiesleutel terug');

    this.setSetting('scrobbler', 'lastfm_session_key', sk);
    logger.info('Last.fm sessiesleutel opgeslagen');
    return sk;
  }

  // ── Retry loop ────────────────────────────────────────────────────────────

  _startRetryLoop() {
    this._retryTimer = setInterval(() => this._retryPending(), RETRY_INTERVAL_MS);
    if (this._retryTimer.unref) this._retryTimer.unref(); // laat Node afsluiten
  }

  async _retryPending() {
    let pending;
    try {
      pending = this.db.getPendingScrobbles();
    } catch { return; }

    if (pending.length === 0) return;
    logger.debug({ count: pending.length }, 'Scrobbler: pending scrobbles opnieuw proberen');

    for (const row of pending) {
      if (row.lastfm_status !== 'ok') {
        await this._sendLastfm(row.id, {
          artist:    row.artist,
          track:     row.track,
          album:     row.album,
          timestamp: row.timestamp,
        });
      }
      if (row.listenbrainz_status !== 'ok') {
        await this._sendListenBrainz(row.id, {
          artist:    row.artist,
          track:     row.track,
          album:     row.album,
          timestamp: row.timestamp,
        });
      }
    }
  }

  // ── Last.fm internals ─────────────────────────────────────────────────────

  async _sendLastfm(id, { artist, track, album, timestamp }) {
    if (!this.lastfmEnabled || !this.lastfmApiKey || !this.lastfmSessionKey) {
      this.db.updateScrobbleLastfm(id, 'skipped');
      return;
    }

    const params = {
      method:    'track.scrobble',
      artist,
      track,
      timestamp: String(timestamp),
      api_key:   this.lastfmApiKey,
      sk:        this.lastfmSessionKey,
    };
    if (album) params.album = album;
    params.api_sig = this._lastfmSign(params);
    params.format  = 'json';

    try {
      const body = await this._lfmPost(params);
      if (body.error) {
        const msg = `Last.fm fout ${body.error}: ${body.message}`;
        logger.warn({ artist, track, error: body.error, msg }, 'Last.fm scrobble mislukt');
        this.db.updateScrobbleLastfm(id, 'error', msg);
      } else {
        const accepted = body.scrobbles?.['@attr']?.accepted;
        if (accepted === 0) {
          const ignored = body.scrobbles?.scrobble?.ignoredMessage?.['#text'] || 'onbekend';
          logger.warn({ artist, track, ignored }, 'Last.fm scrobble genegeerd');
          this.db.updateScrobbleLastfm(id, 'ignored', ignored);
        } else {
          logger.info({ artist, track }, 'Last.fm scrobble verzonden ✓');
          this.db.updateScrobbleLastfm(id, 'ok');
        }
      }
    } catch (err) {
      logger.error({ err, artist, track }, 'Last.fm scrobble netwerkfout');
      this.db.updateScrobbleLastfm(id, 'error', err.message);
    }
  }

  /** Bereken de Last.fm API handtekening (MD5 over gesorteerde params + secret). */
  _lastfmSign(params) {
    // Sluit 'format' en 'api_sig' zelf uit
    const sorted = Object.entries(params)
      .filter(([k]) => k !== 'format' && k !== 'api_sig')
      .sort(([a], [b]) => a.localeCompare(b));

    const str = sorted.map(([k, v]) => `${k}${v}`).join('') + this.lastfmApiSecret;
    return crypto.createHash('md5').update(str, 'utf8').digest('hex');
  }

  async _lfmPost(params) {
    const body = new URLSearchParams(params);
    const res  = await fetch(LASTFM_API_BASE, {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    body.toString(),
    });
    return res.json();
  }

  // ── ListenBrainz internals ────────────────────────────────────────────────

  async _sendListenBrainz(id, { artist, track, album, timestamp }) {
    if (!this.lbEnabled || !this.lbToken) {
      this.db.updateScrobbleLB(id, 'skipped');
      return;
    }

    const payload = {
      listen_type: 'single',
      payload: [{
        listened_at:    timestamp,
        track_metadata: {
          artist_name:  artist,
          track_name:   track,
          ...(album ? { release_name: album } : {}),
        },
      }],
    };

    try {
      const res = await fetch(`${LB_API_BASE}/submit-listens`, {
        method:  'POST',
        headers: {
          'Authorization': `Token ${this.lbToken}`,
          'Content-Type':  'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        logger.info({ artist, track }, 'ListenBrainz scrobble verzonden ✓');
        this.db.updateScrobbleLB(id, 'ok');
      } else {
        const text = await res.text().catch(() => '');
        logger.warn({ artist, track, status: res.status, text }, 'ListenBrainz scrobble mislukt');
        this.db.updateScrobbleLB(id, 'error', `HTTP ${res.status}: ${text.slice(0, 200)}`);
      }
    } catch (err) {
      logger.error({ err, artist, track }, 'ListenBrainz scrobble netwerkfout');
      this.db.updateScrobbleLB(id, 'error', err.message);
    }
  }

  /**
   * Haal ListenBrainz aanbevelingen op voor de geconfigureerde gebruiker.
   * @returns {Promise<Array>} lijst van aanbevolen playlists/tracks
   */
  async getLBRecommendations() {
    const username = this.lbUsername;
    if (!username || !this.lbToken) {
      throw new Error('ListenBrainz gebruikersnaam en token zijn vereist');
    }

    const res = await fetch(
      `${LB_API_BASE}/user/${encodeURIComponent(username)}/recommendation-playlists`,
      {
        headers: {
          'Authorization': `Token ${this.lbToken}`,
        },
      }
    );

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`ListenBrainz API fout ${res.status}: ${text.slice(0, 200)}`);
    }

    const data = await res.json();
    return data.playlists || [];
  }
}

module.exports = { Scrobbler };
