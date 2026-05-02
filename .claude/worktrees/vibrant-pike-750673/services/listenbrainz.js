'use strict';
// ── ListenBrainz service ──────────────────────────────────────────────────────
// Open-source scrobbling service met gratis recommendation en playlist APIs.
// Vereist: LISTENBRAINZ_USER (valt terug op LASTFM_USER).
// LISTENBRAINZ_TOKEN is optioneel — de meeste endpoints werken zonder token.

const logger = require('../logger');
const { getCache, setCache, getEnrichmentData } = require('../db');
const { artistInPlex } = require('./plex');

const LB_USER  = process.env.LISTENBRAINZ_USER || process.env.LASTFM_USER || '';
const LB_TOKEN = process.env.LISTENBRAINZ_TOKEN || '';
const LB_OK    = !!LB_USER;

const BASE = 'https://api.listenbrainz.org/1';

// ── TTLs ──────────────────────────────────────────────────────────────────────
const TTL_RECS    = 12 * 3_600_000; // 12 uur
const TTL_PLISTS  =  6 * 3_600_000; //  6 uur
const TTL_SIMILAR = 24 * 3_600_000; // 24 uur

// ── HTTP hulpfunctie ──────────────────────────────────────────────────────────
async function lbGet(path, params = {}) {
  const url = new URL(`${BASE}${path}`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  }

  const headers = { 'Accept': 'application/json' };
  if (LB_TOKEN) headers['Authorization'] = `Token ${LB_TOKEN}`;

  const res = await fetch(url.toString(), {
    headers,
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`ListenBrainz API fout ${res.status} bij ${path}: ${txt.slice(0, 200)}`);
  }
  return res.json();
}

// ── Enrichment hulpfunctie ────────────────────────────────────────────────────
function enrichArtist(name) {
  try {
    const d = getEnrichmentData('artist', name);
    return {
      image:      d.deezer?.image       || d.lastfm?.image  || null,
      genres:     d.lastfm?.tags        || d.deezer?.genres || d.spotify?.genres || [],
      popularity: d.spotify?.popularity || d.deezer?.fans   || null,
    };
  } catch {
    return { image: null, genres: [], popularity: null };
  }
}

// ── 1. Aanbevolen artiesten ───────────────────────────────────────────────────
async function getListenBrainzRecommendations(username = LB_USER) {
  if (!LB_OK) return { enabled: false };

  const cacheKey = `lb:recs:${username}`;
  const cached   = getCache(cacheKey, TTL_RECS);
  if (cached) return cached;

  try {
    const data = await lbGet(`/cf/recommendation/artist/top/${encodeURIComponent(username)}`);
    const raw  = data.payload?.mbids || [];

    const artists = raw.slice(0, 50).map(item => {
      const name    = item.artist_name || item.name || '';
      const inPlex  = artistInPlex(name);
      const enrich  = enrichArtist(name);
      return {
        name,
        mbid:       item.artist_mbid || item.mbid || null,
        score:      item.score       || 0,
        inPlex,
        image:      enrich.image,
        genres:     enrich.genres,
        popularity: enrich.popularity,
      };
    });

    const result = { enabled: true, username, artists, _ts: Date.now() };
    setCache(cacheKey, result);
    return result;
  } catch (err) {
    logger.warn({ err, username }, 'ListenBrainz recommendations fout');
    return { enabled: true, username, artists: [], error: err.message };
  }
}

// ── 2. ListenBrainz-gegenereerde playlists ────────────────────────────────────
// De auto-gegenereerde playlists (Weekly Discovery, Weekly Jams) staan in de
// /playlists/createdfor endpoint. Reguliere user playlists via /user/:u/playlists.

async function getListenBrainzPlaylists(username = LB_USER) {
  if (!LB_OK) return { enabled: false };

  const cacheKey = `lb:playlists:${username}`;
  const cached   = getCache(cacheKey, TTL_PLISTS);
  if (cached) return cached;

  try {
    // Beide endpoints parallel ophalen
    const [userPl, createdFor] = await Promise.allSettled([
      lbGet(`/user/${encodeURIComponent(username)}/playlists`),
      lbGet(`/user/${encodeURIComponent(username)}/playlists/createdfor`),
    ]);

    const allRaw = [
      ...(userPl.status === 'fulfilled'     ? userPl.value?.playlists     || [] : []),
      ...(createdFor.status === 'fulfilled' ? createdFor.value?.playlists || [] : []),
    ];

    const playlists = allRaw.map(pl => {
      const jspf    = pl.playlist || {};
      const tracks  = (jspf.track || []).map(t => {
        const artist  = t.creator || '';
        const title   = t.title   || '';
        const inPlex  = artistInPlex(artist);
        return { title, artist, mbid: t.identifier || null, inPlex };
      });

      const inPlexCount = tracks.filter(t => t.inPlex).length;

      return {
        id:          pl.playlist?.identifier || null,
        title:       jspf.title       || '',
        description: jspf.annotation  || '',
        date:        jspf.date        || null,
        trackCount:  tracks.length,
        inPlexCount,
        tracks,
      };
    });

    const result = { enabled: true, username, playlists, _ts: Date.now() };
    setCache(cacheKey, result);
    return result;
  } catch (err) {
    logger.warn({ err, username }, 'ListenBrainz playlists fout');
    return { enabled: true, username, playlists: [], error: err.message };
  }
}

// ── 3. Vergelijkbare gebruikers + hun unieke artiesten ────────────────────────
async function getListenBrainzSimilarUsers(username = LB_USER) {
  if (!LB_OK) return { enabled: false };

  const cacheKey = `lb:similar:${username}`;
  const cached   = getCache(cacheKey, TTL_SIMILAR);
  if (cached) return cached;

  try {
    const data  = await lbGet(`/user/${encodeURIComponent(username)}/similar-users`);
    const users = (data.payload || []).slice(0, 10);

    // Haal voor de top-5 meest gelijkende gebruikers hun top-artiesten op
    const TOP_N = 5;
    const withArtists = await Promise.all(
      users.slice(0, TOP_N).map(async u => {
        try {
          const ta = await lbGet(`/stats/user/${encodeURIComponent(u.user_name)}/artists`, {
            count: 50,
            range: 'all_time',
          });
          const artists = (ta.payload?.artists || []).map(a => {
            const name   = a.artist_name || '';
            const inPlex = artistInPlex(name);
            const enrich = enrichArtist(name);
            return {
              name,
              mbid:       a.artist_mbid  || null,
              listenCount: a.listen_count || 0,
              inPlex,
              image:      enrich.image,
              genres:     enrich.genres,
            };
          });
          // Filter op artiesten die de eigenaar zelf NIET heeft
          const newArtists = artists.filter(a => !artistInPlex(a.name) && !a.inPlex);
          return { ...u, artists, newArtists };
        } catch {
          return { ...u, artists: [], newArtists: [] };
        }
      })
    );

    // Resterende gebruikers zonder artiesten
    const rest = users.slice(TOP_N).map(u => ({ ...u, artists: [], newArtists: [] }));

    const result = {
      enabled: true,
      username,
      similarUsers: [...withArtists, ...rest],
      _ts: Date.now(),
    };
    setCache(cacheKey, result);
    return result;
  } catch (err) {
    logger.warn({ err, username }, 'ListenBrainz similar-users fout');
    return { enabled: true, username, similarUsers: [], error: err.message };
  }
}

// ── 4. Status ─────────────────────────────────────────────────────────────────
async function getListenBrainzStatus() {
  if (!LB_OK) return { enabled: false, user: null, tokenConfigured: false };

  try {
    const data = await lbGet(`/user/${encodeURIComponent(LB_USER)}/listen-count`);
    return {
      enabled:         true,
      user:            LB_USER,
      tokenConfigured: !!LB_TOKEN,
      listenCount:     data.payload?.count ?? null,
      ok:              true,
    };
  } catch (err) {
    logger.warn({ err }, 'ListenBrainz status check mislukt');
    return {
      enabled:         true,
      user:            LB_USER,
      tokenConfigured: !!LB_TOKEN,
      ok:              false,
      error:           err.message,
    };
  }
}

// ── Init ──────────────────────────────────────────────────────────────────────
function initListenBrainz() {
  if (!LB_OK) {
    logger.info('ListenBrainz: LISTENBRAINZ_USER niet geconfigureerd — service uitgeschakeld');
    return;
  }
  logger.info({ user: LB_USER, tokenConfigured: !!LB_TOKEN }, 'ListenBrainz: geïnitialiseerd');
}

module.exports = {
  getListenBrainzRecommendations,
  getListenBrainzPlaylists,
  getListenBrainzSimilarUsers,
  getListenBrainzStatus,
  initListenBrainz,
  LB_OK,
  LB_USER,
};
