'use strict';
// ── Discover service v2 ───────────────────────────────────────────────────────
// Secties worden onafhankelijk gecacht; getDiscover() retourneert altijd
// instant vanuit cache. Verlopen secties worden in de achtergrond herbouwd.

const logger = require('../logger');
const { lfm }                                       = require('./lastfm');
const { getSimilarArtists, getDeezerArtistTopTracks } = require('./deezer');
const { getMBZArtist, getMBZAlbums, mbzGet }         = require('./musicbrainz');
const {
  artistInPlex, albumInPlex,
  getPlexArtistNames, getPlexStatus,
}                                                   = require('./plex');
const {
  getEnrichmentData,
  getDiscoverSection, setDiscoverSection, getDiscoverSectionAge,
}                                                   = require('../db');

// ── Cache-sleutels & TTLs ─────────────────────────────────────────────────────
const KEYS = {
  similar:      'discover:v2:similar',
  undiscovered: 'discover:v2:undiscovered',
  newInGenres:  'discover:v2:newInGenres',
  fromLabels:   'discover:v2:fromLabels',
  deepCuts:     'discover:v2:deepCuts',
  hiddenGems:   'discover:v2:hiddenGems',
  history:      'discover:history',
};

const TTL = {
  similar:      86_400_000,
  undiscovered: 86_400_000,
  newInGenres:  12 * 3_600_000,
  fromLabels:   86_400_000,
  deepCuts:     86_400_000,
  hiddenGems:   86_400_000,
};

// Één actieve build-belofte per sectie
const _builds = {};

// ── Hulpfuncties ──────────────────────────────────────────────────────────────

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Haal alle enrichment data op voor één artiest (puur DB-read, geen API). */
function getEnrichedArtist(name) {
  return getEnrichmentData('artist', name);
}

/** Verzamel genre-strings uit alle enrichment bronnen voor één artiest. */
function extractGenres(enrichData) {
  const genres = [];
  if (enrichData.lastfm?.tags)          genres.push(...enrichData.lastfm.tags);
  if (enrichData.deezer?.genres)        genres.push(...enrichData.deezer.genres);
  if (Array.isArray(enrichData.discogs?.genre))  genres.push(...enrichData.discogs.genre);
  if (Array.isArray(enrichData.discogs?.style))  genres.push(...enrichData.discogs.style);
  if (enrichData.spotify?.genres)       genres.push(...enrichData.spotify.genres);
  if (enrichData.musicbrainz?.tags)     genres.push(...enrichData.musicbrainz.tags);
  return genres.map(g => (g || '').toLowerCase().trim()).filter(Boolean);
}

// ── Sectie 1: Similar Artists ─────────────────────────────────────────────────
// Bestaande discover-logica, nu met eigen cache-sleutel.

const SEED_PERIODS = ['1month', '3month', '6month', '12month', 'overall'];

async function buildSimilarArtists() {
  const period1 = SEED_PERIODS[Math.floor(Math.random() * SEED_PERIODS.length)];
  const period2 = SEED_PERIODS[Math.floor(Math.random() * SEED_PERIODS.length)];
  logger.info({ period1, period2 }, 'Discover: similar artists bouwen');
  try {
    const historyArray = getDiscoverSection('history') || [];
    const historySet   = new Set(historyArray.map(n => n.toLowerCase()));

    const [data1, data2, lovedData, recentData] = await Promise.all([
      lfm({ method: 'user.gettopartists', period: period1, limit: 30 }),
      lfm({ method: 'user.gettopartists', period: period2, limit: 30 }).catch(() => ({ topartists: { artist: [] } })),
      lfm({ method: 'user.getlovedtracks', limit: 30 }).catch(() => ({ lovedtracks: { track: [] } })),
      lfm({ method: 'user.getrecenttracks', limit: 50 }).catch(() => ({ recenttracks: { track: [] } })),
    ]);

    const names1      = (data1.topartists?.artist    || []).map(a => a.name);
    const names2      = (data2.topartists?.artist    || []).map(a => a.name);
    const lovedNames  = (lovedData.lovedtracks?.track  || []).map(a => a.artist.name);
    const recentNames = (recentData.recenttracks?.track || []).map(a => a.artist['#text']);

    const topArtists = shuffle([...new Set([...names1, ...names2, ...lovedNames, ...recentNames])]).slice(0, 35);

    const candidateMap = new Map();
    const similar = await Promise.all(
      topArtists.map(async artist => {
        try { return { artist, list: await getSimilarArtists(artist, 20) }; }
        catch { return { artist, list: [] }; }
      })
    );
    for (const { artist, list } of similar) {
      for (const s of list) {
        if (!topArtists.includes(s.name) && !candidateMap.has(s.name) && !historySet.has(s.name.toLowerCase())) {
          candidateMap.set(s.name, {
            name:   s.name,
            match:  parseFloat(s.match) || 1,
            reason: artist,
            image:  s.image || null,
            inPlex: artistInPlex(s.name),
          });
        }
      }
    }

    const allCandidates = Array.from(candidateMap.values())
      .sort((a, b) => (b.match * (b.inPlex ? 0.8 : 1.2)) - (a.match * (a.inPlex ? 0.8 : 1.2)));

    const half = Math.ceil(allCandidates.length / 2);
    const pool = [...shuffle(allCandidates.slice(0, half)), ...shuffle(allCandidates.slice(half))].slice(0, 60);

    // Verrijken: mbid + albums via enrichment cache; nieuwe API-calls alleen voor onbekende artiesten
    const enriched = await Promise.all(pool.map(async c => {
      try {
        const enrichData = getEnrichedArtist(c.name);
        const mbid = enrichData.musicbrainz?.mbid || null;
        let albums = [];
        if (mbid) {
          const raw = await getMBZAlbums(mbid).catch(() => []);
          albums = raw.map(a => ({ ...a, inPlex: albumInPlex(c.name, a.title) }));
        }
        return {
          ...c,
          image:        c.image || enrichData.deezer?.artwork_url || null,
          mbid,
          country:      enrichData.musicbrainz?.country || null,
          startYear:    enrichData.musicbrainz?.begin_date?.slice(0, 4) || null,
          tags:         enrichData.lastfm?.tags || enrichData.musicbrainz?.tags || [],
          albums,
          missingCount: albums.filter(a => !a.inPlex).length,
          totalAlbums:  albums.length,
        };
      } catch {
        return { ...c, tags: [], albums: [], missingCount: 0, totalAlbums: 0 };
      }
    }));

    const MAX_PER_GENRE = 8;
    const genreCount    = new Map();
    const diversePool   = [];
    for (const artist of enriched) {
      const primaryGenre = (artist.tags[0] || 'unknown').toLowerCase();
      const count = genreCount.get(primaryGenre) || 0;
      if (count < MAX_PER_GENRE) {
        genreCount.set(primaryGenre, count + 1);
        diversePool.push(artist);
      }
    }

    setDiscoverSection('similar', { artists: diversePool, basedOn: topArtists, builtAt: Date.now(), periods: [period1, period2] }, TTL.similar);

    const newHistory = [...historyArray, ...diversePool.map(a => a.name)].slice(-200);
    setDiscoverSection('history', newHistory, 7 * 86_400_000);

    logger.info({ artists: diversePool.length }, 'Discover: similar artists klaar');
  } catch (e) {
    logger.error({ err: e }, 'Discover: similar artists mislukt');
  }
}

// ── Sectie 2: Undiscovered Albums ─────────────────────────────────────────────
// Top-50 meest-gespeelde artiesten → albums die NIET in Plex staan.

async function buildUndiscoveredAlbums() {
  logger.info('Discover: undiscovered albums bouwen');
  try {
    const data = await lfm({ method: 'user.gettopartists', period: 'overall', limit: 50 });
    const topArtists = (data.topartists?.artist || []).map(a => ({
      name:      a.name,
      playcount: parseInt(a.playcount, 10) || 0,
    }));

    const results = [];

    for (const { name, playcount } of topArtists) {
      const enrichData = getEnrichedArtist(name);
      let mbid = enrichData.musicbrainz?.mbid;
      if (!mbid) {
        // Fallback: enrichment nog niet beschikbaar bij eerste boot — vraag MBZ direct op
        const mbzData = await getMBZArtist(name).catch(() => null);
        mbid = mbzData?.mbid || null;
      }
      if (!mbid) continue;

      const albums = await getMBZAlbums(mbid).catch(() => []);
      for (const album of albums) {
        if (albumInPlex(name, album.title)) continue;
        results.push({
          artist:    name,
          playcount,
          title:     album.title,
          year:      album.year,
          mbid:      album.mbid,
          coverUrl:  album.coverUrl || enrichData.deezer?.artwork_url || null,
          inPlex:    false,
        });
      }
    }

    // Meest gespeelde artiesten eerst, dan nieuwste albums
    results.sort((a, b) => b.playcount - a.playcount || (parseInt(b.year) || 0) - (parseInt(a.year) || 0));

    setDiscoverSection('undiscovered', { albums: results.slice(0, 30), builtAt: Date.now() }, TTL.undiscovered);
    logger.info({ albums: Math.min(results.length, 30) }, 'Discover: undiscovered albums klaar');
  } catch (e) {
    logger.error({ err: e }, 'Discover: undiscovered albums mislukt');
  }
}

// ── Sectie 3: New In Your Genres ──────────────────────────────────────────────
// Top-5 genres uit enrichment cache → recente MBZ-releases (laatste 60 dagen).

const SKIP_SECONDARY = new Set(['compilation', 'live', 'soundtrack', 'interview', 'spokenword', 'audiobook']);

async function buildNewInGenres() {
  logger.info('Discover: new in genres bouwen');
  try {
    const plexMap = getPlexArtistNames();
    const artistNames = plexMap ? [...plexMap.values()] : [];
    const genreFreq   = new Map();

    for (const name of artistNames) {
      for (const g of extractGenres(getEnrichedArtist(name))) {
        genreFreq.set(g, (genreFreq.get(g) || 0) + 1);
      }
    }

    const topGenres = [...genreFreq.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([g]) => g);

    if (!topGenres.length) {
      setDiscoverSection('newInGenres', { releases: [], genres: [], builtAt: Date.now() }, TTL.newInGenres);
      return;
    }

    const cutoff = new Date(Date.now() - 60 * 86_400_000).toISOString().slice(0, 10);
    const seen    = new Set();
    const results = [];

    for (const genre of topGenres) {
      const q    = encodeURIComponent(`tag:"${genre}" AND firstreleasedate:[${cutoff} TO *]`);
      const data = await mbzGet(`/release-group?query=${q}&limit=20&fmt=json`).catch(() => null);
      if (!data) continue;

      for (const rg of (data['release-groups'] || [])) {
        if (seen.has(rg.id)) continue;
        seen.add(rg.id);

        const primaryType = (rg['primary-type'] || '').toLowerCase();
        if (primaryType !== 'album' && primaryType !== 'ep') continue;

        const secondaryTypes = (rg['secondary-types'] || []).map(t => t.toLowerCase());
        if (secondaryTypes.some(t => SKIP_SECONDARY.has(t))) continue;

        const releaseDate = rg['first-release-date'] || null;
        if (!releaseDate || releaseDate < cutoff) continue;

        const artistName = rg['artist-credit']?.[0]?.artist?.name || rg['artist-credit']?.[0]?.name || '';
        results.push({
          mbid:        rg.id,
          title:       rg.title,
          artist:      artistName,
          releaseDate,
          primaryType: rg['primary-type'] || null,
          inPlex:      albumInPlex(artistName, rg.title),
          coverUrl:    `https://coverartarchive.org/release-group/${rg.id}/front-250`,
          genre,
        });
      }
    }

    results.sort((a, b) => b.releaseDate.localeCompare(a.releaseDate));

    setDiscoverSection('newInGenres', { releases: results, genres: topGenres, builtAt: Date.now() }, TTL.newInGenres);
    logger.info({ releases: results.length, genres: topGenres }, 'Discover: new in genres klaar');
  } catch (e) {
    logger.error({ err: e }, 'Discover: new in genres mislukt');
  }
}

// ── Sectie 4: From Your Labels ────────────────────────────────────────────────
// Top-10 labels van Plex-artiesten (via Discogs enrichment) → recente MBZ-releases.

async function buildFromYourLabels() {
  logger.info('Discover: from your labels bouwen');
  try {
    const plexMap = getPlexArtistNames();
    const artistNames = plexMap ? [...plexMap.values()] : [];
    const labelFreq   = new Map();

    for (const name of artistNames) {
      const enrichData = getEnrichedArtist(name);
      // Discogs label is opgeslagen als komma-gescheiden string
      const labelStr = enrichData.discogs?.label || '';
      for (const l of labelStr.split(',').map(s => s.trim()).filter(s => s.length > 2)) {
        labelFreq.set(l, (labelFreq.get(l) || 0) + 1);
      }
    }

    const topLabels = [...labelFreq.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([l]) => l);

    if (!topLabels.length) {
      setDiscoverSection('fromLabels', { releases: [], labels: [], builtAt: Date.now() }, TTL.fromLabels);
      return;
    }

    const cutoff = new Date(Date.now() - 365 * 86_400_000).toISOString().slice(0, 10);
    const seen    = new Set();
    const results = [];

    for (const label of topLabels) {
      const q    = encodeURIComponent(`label:"${label.replace(/"/g, '')}" AND firstreleasedate:[${cutoff} TO *]`);
      const data = await mbzGet(`/release-group?query=${q}&limit=10&fmt=json`).catch(() => null);
      if (!data) continue;

      for (const rg of (data['release-groups'] || [])) {
        if (seen.has(rg.id)) continue;
        seen.add(rg.id);

        const artistName = rg['artist-credit']?.[0]?.artist?.name || rg['artist-credit']?.[0]?.name || '';
        results.push({
          mbid:        rg.id,
          title:       rg.title,
          artist:      artistName,
          label,
          releaseDate: rg['first-release-date'] || null,
          inPlex:      artistInPlex(artistName),
          coverUrl:    `https://coverartarchive.org/release-group/${rg.id}/front-250`,
        });
      }
    }

    // Artiesten die je nog NIET hebt krijgen voorrang
    results.sort((a, b) => Number(a.inPlex) - Number(b.inPlex));

    setDiscoverSection('fromLabels', { releases: results, labels: topLabels, builtAt: Date.now() }, TTL.fromLabels);
    logger.info({ releases: results.length, labels: topLabels.length }, 'Discover: from labels klaar');
  } catch (e) {
    logger.error({ err: e }, 'Discover: from labels mislukt');
  }
}

// ── Sectie 5: Deep Cuts ───────────────────────────────────────────────────────
// Plex-artiesten met lage Spotify popularity (<30) → onbekende tracks via Deezer.

async function buildDeepCuts() {
  logger.info('Discover: deep cuts bouwen');
  try {
    const plexMap = getPlexArtistNames();
    const artistNames = plexMap ? [...plexMap.values()] : [];
    const candidates  = [];

    for (const name of artistNames) {
      const enrichData = getEnrichedArtist(name);
      const popularity = enrichData.spotify?.popularity;
      const deezerId   = enrichData.deezer?.deezer_id;
      if (popularity == null || popularity >= 30 || !deezerId) continue;
      candidates.push({ name, popularity, deezerId, enrichData });
    }

    const results = [];
    for (const { name, popularity, deezerId, enrichData } of shuffle(candidates).slice(0, 40)) {
      const tracks     = await getDeezerArtistTopTracks(deezerId).catch(() => []);
      const deepTracks = tracks.filter(t => t.rank > 0 && t.rank < 50_000);
      if (!deepTracks.length) continue;

      results.push({
        artist:     name,
        popularity,
        image:      enrichData.deezer?.artwork_url || null,
        tags:       (enrichData.lastfm?.tags || []).slice(0, 3),
        tracks:     deepTracks.slice(0, 3),
      });

      if (results.length >= 20) break;
    }

    setDiscoverSection('deepCuts', { artists: shuffle(results), builtAt: Date.now() }, TTL.deepCuts);
    logger.info({ artists: results.length }, 'Discover: deep cuts klaar');
  } catch (e) {
    logger.error({ err: e }, 'Discover: deep cuts mislukt');
  }
}

// ── Sectie 6: Hidden Gems (Forgotten Favorites) ───────────────────────────────
// Artiesten die overall hoog staan maar in de afgelopen 3 maanden niet gespeeld zijn.

async function buildHiddenGems() {
  logger.info('Discover: hidden gems bouwen');
  try {
    const [overallData, recentData] = await Promise.all([
      lfm({ method: 'user.gettopartists', period: 'overall', limit: 100 }),
      lfm({ method: 'user.gettopartists', period: '3month',  limit: 50 }).catch(() => ({ topartists: { artist: [] } })),
    ]);

    const overallArtists = (overallData.topartists?.artist || []).map(a => a.name);
    const recentSet      = new Set((recentData.topartists?.artist || []).map(a => a.name.toLowerCase()));

    const forgotten = overallArtists.filter(
      n => !recentSet.has(n.toLowerCase()) && artistInPlex(n)
    );

    const results = [];
    for (const name of forgotten.slice(0, 25)) {
      const enrichData = getEnrichedArtist(name);
      results.push({
        name,
        image:     enrichData.deezer?.artwork_url || null,
        tags:      (enrichData.lastfm?.tags || []).slice(0, 3),
        lastfmUrl: enrichData.lastfm?.lastfm_url || null,
      });
    }

    setDiscoverSection('hiddenGems', { artists: results, builtAt: Date.now() }, TTL.hiddenGems);
    logger.info({ artists: results.length }, 'Discover: hidden gems klaar');
  } catch (e) {
    logger.error({ err: e }, 'Discover: hidden gems mislukt');
  }
}

// ── Build-dispatcher ──────────────────────────────────────────────────────────

const BUILDERS = {
  similar:      buildSimilarArtists,
  undiscovered: buildUndiscoveredAlbums,
  newInGenres:  buildNewInGenres,
  fromLabels:   buildFromYourLabels,
  deepCuts:     buildDeepCuts,
  hiddenGems:   buildHiddenGems,
};

function triggerBuild(section) {
  if (_builds[section]) return;
  _builds[section] = BUILDERS[section]().finally(() => { delete _builds[section]; });
}

function checkAndTrigger(section, ttl) {
  if (getDiscoverSectionAge(section) > ttl) triggerBuild(section);
}

// ── Publieke API ──────────────────────────────────────────────────────────────

/**
 * Retourneert alle discover-secties instant vanuit cache.
 * Verlopen secties worden in de achtergrond herbouwd.
 */
function getDiscover() {
  for (const [section, ttl] of Object.entries(TTL)) {
    checkAndTrigger(section, ttl);
  }

  const similar      = getDiscoverSection('similar');
  const undiscovered = getDiscoverSection('undiscovered');
  const newInGenres  = getDiscoverSection('newInGenres');
  const fromLabels   = getDiscoverSection('fromLabels');
  const deepCuts     = getDiscoverSection('deepCuts');
  const hiddenGems   = getDiscoverSection('hiddenGems');

  if (!similar && !undiscovered && !newInGenres && !fromLabels && !deepCuts && !hiddenGems) {
    return { status: 'building', message: 'Muziekontdekkingen worden geanalyseerd (ca. 30 sec)...' };
  }

  return {
    status: 'ok',
    // Backward compat: frontend verwacht `artists`
    artists:            similar?.artists            || [],
    similarArtists:     similar?.artists            || [],
    undiscoveredAlbums: undiscovered?.albums        || [],
    newInGenres:        newInGenres?.releases       || [],
    fromYourLabels:     fromLabels?.releases        || [],
    deepCuts:           deepCuts?.artists           || [],
    hiddenGems:         hiddenGems?.artists         || [],
    basedOn:            similar?.basedOn            || [],
    builtAt:            similar?.builtAt            || null,
    building: {
      similar:      !!_builds.similar,
      undiscovered: !!_builds.undiscovered,
      newInGenres:  !!_builds.newInGenres,
      fromLabels:   !!_builds.fromLabels,
      deepCuts:     !!_builds.deepCuts,
      hiddenGems:   !!_builds.hiddenGems,
    },
    plexConnected: getPlexStatus().ok,
  };
}

/** Forceer een volledige rebuild van alle secties. */
function refreshDiscover() {
  for (const section of Object.keys(BUILDERS)) triggerBuild(section);
  return { ok: true, building: true };
}

/** Retourneert per sectie of er gecachede data aanwezig is en of er een build loopt. */
function getDiscoverStatus() {
  const status = {};
  for (const section of Object.keys(BUILDERS)) {
    status[section] = {
      ready:    getDiscoverSectionAge(section) < Infinity,
      building: !!_builds[section],
    };
  }
  return status;
}

/** Start achtergrond-builds bij opstarten (na 8 sec zodat Plex eerst kan synchroniseren). */
function initDiscover() {
  setTimeout(() => {
    for (const [section, ttl] of Object.entries(TTL)) {
      checkAndTrigger(section, ttl);
    }
  }, 8_000);
}

module.exports = { getDiscover, refreshDiscover, initDiscover, getDiscoverStatus };
