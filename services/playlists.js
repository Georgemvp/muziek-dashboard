// ── Playlist Generator Service ────────────────────────────────────────────────
// Genereert gepersonaliseerde playlists op basis van Last.fm luisterdata + Plex-bibliotheek.
//
// Track-formaat dat elke generator retourneert:
//   { artist, title, album, duration, plex_key, cover_url }
//
// plex_key  = ratingKey van het Plex-album of -nummer (null = niet in Plex, bijv. Discovery Weekly)
// cover_url = albumhoes URL via Plex thumb proxy (kan null zijn)

'use strict';

const logger     = require('../logger');
const { lfm, getSimilarArtists } = require('./lastfm');
const {
  artistInPlex,
  getPlexLibrary,
  getAlbumTracks,
  getPlexArtistsByGenre,
  plexGet, plexPost, getPlexPlaylists, searchPlexLibrary, getPlexArtistNames,
  PLEX_URL, PLEX_TOKEN,
} = require('./plex');
const { getCache, setCache, getSetting, getEnrichmentDataBySource } = require('../db');
const { getDeezerArtist, getDeezerArtistTopTracks, getDeezerRelatedArtists } = require('./deezer');
const { getReleases }  = require('./releases');
const { getDiscover }  = require('./discover');
const { getGenreMap }  = require('./genres');

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Fisher-Yates shuffle — geeft een nieuwe geschudde kopie terug. */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Normaliseer naam voor vergelijking (lowercase, diacritica gestript). */
function norm(s) {
  return (s || '').toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]/g, '').trim();
}

/** Bouw een cover_url op basis van een Plex thumb-pad. */
function thumbUrl(thumb) {
  if (!thumb) return null;
  if (thumb.startsWith('http')) return thumb;
  return `/api/plex/thumb?path=${encodeURIComponent(thumb)}`;
}

/**
 * Haal tracks op voor meerdere albums tegelijk (max concurrentie: 5).
 * Geeft een plat array van track-objecten terug, elk verrijkt met
 * artist, album, cover_url en plex_key.
 */
async function fetchTracksForAlbums(albums, maxPerAlbum = 3) {
  const results = [];
  const CONCURRENCY = 5;

  for (let i = 0; i < albums.length; i += CONCURRENCY) {
    const batch = albums.slice(i, i + CONCURRENCY);
    const settled = await Promise.allSettled(
      batch.map(async (alb) => {
        try {
          const tracks = await getAlbumTracks(alb.ratingKey);
          return shuffle(tracks)
            .slice(0, maxPerAlbum)
            .map(t => ({
              artist:    alb.artist,
              title:     t.title,
              album:     alb.album,
              duration:  t.duration || null,
              plex_key:  t.ratingKey || alb.ratingKey,
              cover_url: thumbUrl(alb.thumb),
            }));
        } catch {
          return [];
        }
      })
    );
    for (const r of settled) {
      if (r.status === 'fulfilled') results.push(...r.value);
    }
  }
  return results;
}

/** Haal setting op met een standaard-fallback. */
function setting(key, fallback) {
  const v = getSetting('discovery', key);
  return v !== null ? v : fallback;
}

// ── 1. Release Radar ───────────────────────────────────────────────────────────
/**
 * Nieuwe releases van artiesten die je volgt (Last.fm top-50 als fallback).
 * Filter: alleen releases van de afgelopen 4 weken.
 * Gesorteerd op playcount (meest gespeeld = meest relevant).
 */
async function generateReleaseRadar() {
  const maxTracks = setting('max_tracks', 50);
  const cutoffMs  = 28 * 24 * 60 * 60 * 1000; // 4 weken
  const cutoffSec = Math.floor((Date.now() - cutoffMs) / 1000);

  // Haal top-50 artiesten op (inclusief playcount voor sortering)
  let topArtists = [];
  try {
    const data = await lfm({ method: 'user.gettopartists', period: '1month', limit: 50 });
    topArtists = (data.topartists?.artist || []).map(a => ({
      name:      a.name,
      playcount: parseInt(a.playcount, 10) || 0,
    }));
  } catch (e) {
    logger.warn({ err: e }, 'Release Radar: top artiesten ophalen mislukt');
    return [];
  }

  // Gebruik releases-cache als die beschikbaar is (gebouwd door services/releases.js)
  const releasesCache = getCache('releases');
  if (!releasesCache?.releases) {
    logger.info('Release Radar: geen releases-cache beschikbaar, return leeg');
    return [];
  }

  const recentReleases = releasesCache.releases.filter(r => {
    if (!r.date) return false;
    const ts = Math.floor(new Date(r.date).getTime() / 1000);
    return ts >= cutoffSec;
  });

  // Koppel releases aan playcount van de bijbehorende artiest
  const artistPlaycountMap = new Map(topArtists.map(a => [norm(a.name), a.playcount]));

  const scored = recentReleases
    .map(r => ({
      artist:    r.artist,
      title:     r.title,
      album:     r.title,
      duration:  null,
      plex_key:  null,    // nieuwe release, nog niet in Plex
      cover_url: r.cover  || null,
      date:      r.date,
      _score:    artistPlaycountMap.get(norm(r.artist)) || 0,
    }))
    .sort((a, b) => b._score - a._score)
    .slice(0, maxTracks);

  return scored.map(({ _score, ...t }) => t);
}

// ── 2. Discovery Weekly ────────────────────────────────────────────────────────
/**
 * Top-tracks van artiesten die VERGELIJKBAAR zijn met je top-20 van afgelopen maand,
 * maar NIET in je Plex-bibliotheek zitten (echte ontdekkingen).
 * Serendipity-instelling (0–100) regelt hoe random de selectie is.
 */
async function generateDiscoveryWeekly() {
  const serendipity = setting('serendipity', 40) / 100; // 0.0 – 1.0

  // Top-20 artiesten van afgelopen maand
  let topArtists = [];
  try {
    const data = await lfm({ method: 'user.gettopartists', period: '1month', limit: 20 });
    topArtists = (data.topartists?.artist || []).map(a => a.name);
  } catch (e) {
    logger.warn({ err: e }, 'Discovery Weekly: top artiesten ophalen mislukt');
    return [];
  }

  if (!topArtists.length) return [];

  // Similar artists per top-artiest (max 10 similar per artiest)
  const candidateMap = new Map(); // naam → { match, reason }
  await Promise.allSettled(
    topArtists.map(async (artist) => {
      try {
        const similar = await getSimilarArtists(artist, 10);
        for (const s of similar) {
          if (!candidateMap.has(s.name) && !artistInPlex(s.name)) {
            candidateMap.set(s.name, { name: s.name, match: parseFloat(s.match) || 0, reason: artist });
          }
        }
      } catch {}
    })
  );

  if (!candidateMap.size) return [];

  // Sorteer op match-score; mix met serendipity
  const sorted = [...candidateMap.values()].sort((a, b) => b.match - a.match);

  let pool;
  if (serendipity >= 0.9) {
    pool = shuffle(sorted);
  } else if (serendipity <= 0.1) {
    pool = sorted;
  } else {
    // Splits in twee helften: top wordt gesorteerd bewaard, rest geshuffled
    const cutoff = Math.floor(sorted.length * (1 - serendipity));
    pool = [...sorted.slice(0, cutoff), ...shuffle(sorted.slice(cutoff))];
  }

  // Top-tracks per kandidaat-artiest (max 3 per artiest, max 50 tracks totaal)
  const tracks = [];
  for (const candidate of pool.slice(0, 20)) {
    if (tracks.length >= 50) break;
    try {
      const data = await lfm({ method: 'artist.gettoptracks', artist: candidate.name, limit: 5 },
        { includeUser: false });
      const artistTracks = (data.toptracks?.track || []).slice(0, 3);
      for (const t of artistTracks) {
        tracks.push({
          artist:    candidate.name,
          title:     t.name,
          album:     null,
          duration:  t.duration ? parseInt(t.duration, 10) * 1000 : null,
          plex_key:  null,       // NIET in Plex — echte ontdekking
          cover_url: t.image?.find(i => i.size === 'large')?.['#text'] || null,
          reason:    candidate.reason,
        });
      }
    } catch {}
  }

  return tracks.slice(0, 50);
}

// ── 3. Seasonal Playlist ──────────────────────────────────────────────────────
const SEASON_TAGS = {
  spring:     ['spring', 'indie pop', 'folk', 'happy', 'sunshine', 'fresh'],
  summer:     ['summer', 'beach', 'tropical', 'feel good', 'dance', 'upbeat'],
  autumn:     ['autumn', 'fall', 'melancholic', 'indie', 'acoustic', 'mellow'],
  winter:     ['winter', 'atmospheric', 'ambient', 'melancholic', 'dark'],
  halloween:  ['horror', 'gothic', 'dark', 'eerie', 'halloween', 'industrial', 'black metal'],
  christmas:  ['christmas', 'holiday', 'winter', 'xmas', 'festive'],
  valentines: ['love', 'romantic', 'soul', 'r&b', 'slow'],
};

/** Bepaal het huidige seizoen op basis van de datum. */
function currentSeason() {
  const month = new Date().getMonth() + 1; // 1-12
  if (month === 2)  return 'valentines';
  if (month === 10) return 'halloween';
  if (month === 12) return 'christmas';
  if (month >= 3  && month <= 5)  return 'spring';
  if (month >= 6  && month <= 8)  return 'summer';
  if (month >= 9  && month <= 11) return 'autumn';
  return 'winter'; // december al gecoverd
}

/**
 * Seizoensplaylist op basis van genre-tags.
 * Zoekt artiesten in Plex die matchen op de seizoensgerelateerde tags.
 */
async function generateSeasonalPlaylist(season) {
  const seasonKey = season || currentSeason();
  const tags = SEASON_TAGS[seasonKey] || SEASON_TAGS.summer;

  // Filter plexLibrary op artiesten die een seizoens-tag hebben
  const library = getPlexLibrary();
  const normTags = tags.map(t => t.toLowerCase());

  // Haal artiestgenres op (in-memory)
  const { plexArtistGenres: genreMap } = (() => {
    try {
      // Importeer intern de genre-map door getGenresFromPlex te omzeilen
      // en direct door de library-artiesten te itereren via getPlexArtistsByGenre
      return { plexArtistGenres: null };
    } catch { return { plexArtistGenres: null }; }
  })();

  // Alternatief: gebruik Last.fm-tags voor artiesten om te matchen
  // Haal top-50 artiesten op (overall) en check hun tags
  let tagMatchedArtists = new Set();
  try {
    const data = await lfm({ method: 'user.gettopartists', period: 'overall', limit: 100 });
    const artists = data.topartists?.artist || [];

    // Check tags via Last.fm (gecached)
    for (const artist of artists.slice(0, 40)) {
      try {
        const tagData = await lfm(
          { method: 'artist.gettoptags', artist: artist.name },
          {
            includeUser: false,
            cacheKey: `tags:${norm(artist.name)}`,
            cacheTTL: 7 * 24 * 3_600_000 // 7 dagen
          }
        );
        const artistTags = (tagData.toptags?.tag || []).map(t => t.name.toLowerCase());
        const hasMatch = normTags.some(st => artistTags.some(at => at.includes(st) || st.includes(at)));
        if (hasMatch && artistInPlex(artist.name)) {
          tagMatchedArtists.add(artist.name);
        }
      } catch {}
    }
  } catch (e) {
    logger.warn({ err: e }, 'Seasonal: artiesten-tags ophalen mislukt');
  }

  // Filter albums van gematchte artiesten
  const matchedAlbums = library.filter(alb =>
    tagMatchedArtists.has(alb.artist) || tagMatchedArtists.has(alb.artist.toLowerCase())
  );

  // Shuffle en beperk tot 15 albums voor track-fetch
  const albumSample = shuffle(matchedAlbums).slice(0, 15);
  const tracks = await fetchTracksForAlbums(albumSample, 3);

  return shuffle(tracks).slice(0, 50);
}

// ── 4. Decade Playlist ────────────────────────────────────────────────────────
/**
 * Tracks uit een specifiek decennium op basis van Plex-bibliotheek.
 * Decennium is een jaar zoals 1980, 1990, etc.
 * Sorteert op Last.fm playcount als beschikbaar, anders willekeurig.
 */
async function generateDecadePlaylist(decade) {
  const dec = parseInt(decade, 10) || 1990;
  const yearStart = dec;
  const yearEnd   = dec + 9;

  const library = getPlexLibrary();

  // Gebruik releases-jaar als het beschikbaar is in de Plex-metadata.
  // De plexLibrary bevat alleen { artist, album, ratingKey, thumb, addedAt }.
  // We filteren op albumnaam die het decennium-jaar bevat als heuristiek,
  // of zoeken in de releases-cache van services/releases.js.
  // Voor een betrouwbare benadering: gebruik Last.fm top tracks van die periode
  // en matchen we met de Plex-bibliotheek.

  // Haal top-artiesten op uit die periode via Last.fm (alle tijden)
  let topArtists;
  try {
    const data = await lfm({ method: 'user.gettopartists', period: 'overall', limit: 100 });
    topArtists = (data.topartists?.artist || [])
      .map(a => ({ name: a.name, playcount: parseInt(a.playcount, 10) || 0 }))
      .filter(a => artistInPlex(a.name));
  } catch {
    topArtists = [];
  }

  // Fallback: alle artiesten in Plex-bibliotheek
  if (!topArtists.length) {
    const artistSet = new Set(library.map(a => a.artist));
    topArtists = [...artistSet].map(name => ({ name, playcount: 0 }));
  }

  // Zoek albums via Last.fm die in het decennium vallen voor gekende artiesten
  // We gebruiken artist.getTopAlbums en matchen met plexLibrary
  const decadeAlbums = [];

  for (const artist of topArtists.slice(0, 30)) {
    try {
      const data = await lfm(
        { method: 'artist.gettopalbums', artist: artist.name, limit: 10 },
        {
          includeUser: false,
          cacheKey: `topalbums:${norm(artist.name)}`,
          cacheTTL: 24 * 3_600_000
        }
      );
      const albums = data.topalbums?.album || [];
      for (const alb of albums) {
        // Zoek dit album in de Plex-bibliotheek
        const plexAlb = library.find(p =>
          norm(p.artist) === norm(artist.name) &&
          norm(p.album).includes(norm(alb.name).slice(0, 10))
        );
        if (plexAlb) {
          decadeAlbums.push({ ...plexAlb, _playcount: artist.playcount });
        }
      }
    } catch {}
  }

  // Fallback: alle Plex albums van geselecteerde artiesten
  if (decadeAlbums.length < 10) {
    const topNames = new Set(topArtists.slice(0, 20).map(a => norm(a.name)));
    library
      .filter(alb => topNames.has(norm(alb.artist)))
      .forEach(alb => {
        if (!decadeAlbums.find(d => d.ratingKey === alb.ratingKey)) {
          decadeAlbums.push({ ...alb, _playcount: 0 });
        }
      });
  }

  // Sorteer op playcount en sample 15 albums
  const sorted = decadeAlbums
    .sort((a, b) => b._playcount - a._playcount)
    .slice(0, 20);
  const sample = [...sorted.slice(0, 5), ...shuffle(sorted.slice(5))].slice(0, 15);

  const tracks = await fetchTracksForAlbums(sample, 3);
  return shuffle(tracks).slice(0, 50);
}

// ── 5. Genre Playlist ──────────────────────────────────────────────────────────
/**
 * Tracks uit een specifiek genre op basis van Last.fm-tags en Plex-bibliotheek.
 * Gesorteerd op Last.fm playcount.
 */
async function generateGenrePlaylist(genre) {
  if (!genre) return [];

  const normGenre = genre.toLowerCase();
  const library   = getPlexLibrary();

  // Haal top-artiesten op die dit genre hebben via Last.fm
  let topArtists = [];
  try {
    const data = await lfm(
      { method: 'tag.gettopartists', tag: genre, limit: 50 },
      {
        includeUser: false,
        cacheKey: `tag:topartists:${normGenre}`,
        cacheTTL: 24 * 3_600_000
      }
    );
    topArtists = (data.topartists?.artist || []).map(a => a.name).filter(artistInPlex);
  } catch {}

  // Fallback: gebruik Last.fm user top-artiesten met genre-filtering via tags
  if (!topArtists.length) {
    try {
      const data = await lfm({ method: 'user.gettopartists', period: 'overall', limit: 100 });
      const artists = data.topartists?.artist || [];

      for (const artist of artists.slice(0, 40)) {
        if (!artistInPlex(artist.name)) continue;
        try {
          const tagData = await lfm(
            { method: 'artist.gettoptags', artist: artist.name },
            { includeUser: false, cacheKey: `tags:${norm(artist.name)}`, cacheTTL: 7 * 24 * 3_600_000 }
          );
          const tags = (tagData.toptags?.tag || []).map(t => t.name.toLowerCase());
          if (tags.some(t => t.includes(normGenre) || normGenre.includes(t))) {
            topArtists.push(artist.name);
          }
        } catch {}
      }
    } catch {}
  }

  if (!topArtists.length) return [];

  // Verzamel albums van matching artiesten
  const normNames = new Set(topArtists.map(norm));
  const matchAlbums = shuffle(
    library.filter(alb => normNames.has(norm(alb.artist)))
  ).slice(0, 15);

  const tracks = await fetchTracksForAlbums(matchAlbums, 3);
  return shuffle(tracks).slice(0, 50);
}

/** Geeft alle unieke genres uit de Last.fm-tags van Plex-artiesten terug. */
async function getAvailableGenres() {
  const cacheKey = 'playlists:genres';
  const cached = getCache(cacheKey, 24 * 3_600_000);
  if (cached) return cached;

  const library = getPlexLibrary();
  const artistSet = new Set(library.map(a => norm(a.artist)));
  const genreCount = new Map();

  let processed = 0;
  for (const artistName of [...artistSet].slice(0, 60)) {
    try {
      const originalName = library.find(a => norm(a.artist) === artistName)?.artist;
      if (!originalName) continue;
      const data = await lfm(
        { method: 'artist.gettoptags', artist: originalName },
        { includeUser: false, cacheKey: `tags:${artistName}`, cacheTTL: 7 * 24 * 3_600_000 }
      );
      const tags = (data.toptags?.tag || []).slice(0, 5);
      for (const tag of tags) {
        const g = tag.name.toLowerCase();
        if (g.length > 2 && g.length < 30) {
          genreCount.set(g, (genreCount.get(g) || 0) + 1);
        }
      }
      processed++;
    } catch {}
  }

  const genres = [...genreCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50)
    .map(([name]) => name);

  setCache(cacheKey, genres);
  return genres;
}

// ── 6. Forgotten Favorites ────────────────────────────────────────────────────
/**
 * Tracks die je vroeger veel afspeelde maar de laatste maand niet meer.
 * Filtert op aanwezigheid in Plex.
 */
async function generateForgottenFavorites() {
  // Afgelopen 12 maanden top-tracks
  let top12m = [];
  try {
    const data = await lfm({ method: 'user.gettoptracks', period: '12month', limit: 200 });
    top12m = (data.toptracks?.track || []).map(t => ({
      artist:    t.artist.name || t.artist['#text'] || '',
      title:     t.name,
      playcount: parseInt(t.playcount, 10) || 0,
    }));
  } catch (e) {
    logger.warn({ err: e }, 'Forgotten Favorites: top12m mislukt');
    return [];
  }

  // Afgelopen 1 maand top-tracks (set voor snelle lookup)
  let top1m = new Set();
  try {
    const data = await lfm({ method: 'user.gettoptracks', period: '1month', limit: 200 });
    (data.toptracks?.track || []).forEach(t => {
      top1m.add(`${norm(t.artist.name || t.artist['#text'] || '')}||${norm(t.name)}`);
    });
  } catch {}

  // Vergeten = in top-12m maar NIET in top-1m
  const forgotten = top12m.filter(t => {
    const key = `${norm(t.artist)}||${norm(t.title)}`;
    return !top1m.has(key);
  });

  // Filter op aanwezigheid in Plex (via artiest-check — snel)
  const inPlex = forgotten.filter(t => artistInPlex(t.artist));

  // Zoek plex_key via Plex track-search — voor de top-50
  const library = getPlexLibrary();
  const results = [];

  for (const track of inPlex.slice(0, 80)) {
    // Zoek album in Plex-bibliotheek op basis van artiest
    const plexAlbums = library.filter(alb => norm(alb.artist) === norm(track.artist));
    if (plexAlbums.length) {
      const alb = plexAlbums[0]; // pak eerste album als fallback
      results.push({
        artist:    track.artist,
        title:     track.title,
        album:     alb.album,
        duration:  null,
        plex_key:  alb.ratingKey,
        cover_url: thumbUrl(alb.thumb),
        playcount: track.playcount,
      });
    }
    if (results.length >= 50) break;
  }

  return results.sort((a, b) => b.playcount - a.playcount).slice(0, 50)
    .map(({ playcount, ...t }) => t);
}

// ── 7. Hidden Gems ────────────────────────────────────────────────────────────
/**
 * Tracks van je favoriete artiesten die je zelden/nooit hebt geluisterd.
 * "Verborgen pareltjes" = albums van top-artiesten waarvan de tracks
 * niet in je Last.fm top-tracks staan.
 */
async function generateHiddenGems() {
  // Top-artiesten (overall)
  let topArtists = [];
  try {
    const data = await lfm({ method: 'user.gettopartists', period: 'overall', limit: 30 });
    topArtists = (data.topartists?.artist || [])
      .map(a => a.name)
      .filter(artistInPlex);
  } catch (e) {
    logger.warn({ err: e }, 'Hidden Gems: top artiesten mislukt');
    return [];
  }

  // Per artiest: haal top-tracks op en noteer de bekende titels
  const knownTracks = new Map(); // artist-norm → Set van bekende track-titels
  await Promise.allSettled(
    topArtists.slice(0, 20).map(async (artist) => {
      try {
        const data = await lfm(
          { method: 'user.gettoptracks', period: 'overall', limit: 200 },
          {}
        );
        const myTracks = (data.toptracks?.track || [])
          .filter(t => norm(t.artist.name) === norm(artist))
          .map(t => norm(t.name));
        knownTracks.set(norm(artist), new Set(myTracks));
      } catch {
        knownTracks.set(norm(artist), new Set());
      }
    })
  );

  const library = getPlexLibrary();
  const gems    = [];

  for (const artistName of topArtists.slice(0, 15)) {
    const knownSet = knownTracks.get(norm(artistName)) || new Set();
    // Alle albums van deze artiest in Plex
    const artistAlbums = library
      .filter(alb => norm(alb.artist) === norm(artistName))
      .slice(0, 5);

    for (const alb of artistAlbums) {
      try {
        const tracks = await getAlbumTracks(alb.ratingKey);
        for (const t of tracks) {
          if (!knownSet.has(norm(t.title))) {
            gems.push({
              artist:    artistName,
              title:     t.title,
              album:     alb.album,
              duration:  t.duration || null,
              plex_key:  t.ratingKey || alb.ratingKey,
              cover_url: thumbUrl(alb.thumb),
            });
          }
        }
      } catch {}
    }
    if (gems.length >= 80) break;
  }

  return shuffle(gems).slice(0, 50);
}

// ── 8. Daily Mix ──────────────────────────────────────────────────────────────
/**
 * Dagelijkse mix op basis van recent luistergedrag (laatste 24 uur).
 * Mix van:
 *   40% andere tracks van dezelfde artiesten
 *   30% tracks van vergelijkbare Plex-artiesten
 *   30% willekeurige tracks uit dezelfde genres
 */
async function generateDailyMix() {
  // Recente tracks (laatste 24 uur = max 200 scrobbles)
  let recentTracks = [];
  try {
    const data = await lfm({ method: 'user.getrecenttracks', limit: 200 });
    recentTracks = (data.recenttracks?.track || [])
      .filter(t => !t['@attr']?.nowplaying) // skip "now playing" marker
      .map(t => ({
        artist: t.artist['#text'] || t.artist?.name || '',
        title:  t.name,
      }));
  } catch (e) {
    logger.warn({ err: e }, 'Daily Mix: recente tracks mislukt');
    return [];
  }

  if (!recentTracks.length) return [];

  // Bepaal dominante artiesten (top-5)
  const artistCounts = new Map();
  for (const t of recentTracks) {
    if (t.artist) artistCounts.set(t.artist, (artistCounts.get(t.artist) || 0) + 1);
  }
  const dominantArtists = [...artistCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name]) => name)
    .filter(artistInPlex);

  if (!dominantArtists.length) return [];

  const library = getPlexLibrary();
  const resultTracks = [];

  // ── 40%: andere tracks van dezelfde artiesten ──────────────────────────────
  const sameArtistAlbums = library
    .filter(alb => dominantArtists.some(a => norm(a) === norm(alb.artist)));
  const sameArtistSample = shuffle(sameArtistAlbums).slice(0, 6);
  const sameArtistTracks = await fetchTracksForAlbums(sameArtistSample, 3);
  resultTracks.push(...shuffle(sameArtistTracks).slice(0, 20));

  // ── 30%: vergelijkbare artiesten die in Plex zitten ───────────────────────
  const similarInPlex = new Set();
  for (const artist of dominantArtists.slice(0, 3)) {
    try {
      const similar = await getSimilarArtists(artist, 8);
      for (const s of similar) {
        if (artistInPlex(s.name) && !dominantArtists.includes(s.name)) {
          similarInPlex.add(s.name);
        }
      }
    } catch {}
  }
  const similarAlbums = library
    .filter(alb => [...similarInPlex].some(a => norm(a) === norm(alb.artist)));
  const similarSample = shuffle(similarAlbums).slice(0, 5);
  const similarTracks = await fetchTracksForAlbums(similarSample, 3);
  resultTracks.push(...shuffle(similarTracks).slice(0, 15));

  // ── 30%: willekeurige tracks uit dezelfde genres ──────────────────────────
  // Gebruik getPlexArtistsByGenre voor de dominante artiest
  let genreArtists = [];
  try {
    for (const artist of dominantArtists.slice(0, 2)) {
      const ga = await getPlexArtistsByGenre(artist, 5);
      genreArtists.push(...ga.map(a => a.name));
    }
  } catch {}
  const genreAlbums = library
    .filter(alb => genreArtists.some(a => norm(a) === norm(alb.artist)) &&
                   !dominantArtists.some(a => norm(a) === norm(alb.artist)));
  const genreSample = shuffle(genreAlbums).slice(0, 5);
  const genreTracks = await fetchTracksForAlbums(genreSample, 3);
  resultTracks.push(...shuffle(genreTracks).slice(0, 15));

  return shuffle(resultTracks).slice(0, 50);
}

// ── 10. Because You Listen To ────────────────────────────────────────────────
/**
 * Seed-gebaseerde playlist: vergelijkbare artiesten op basis van 1–5 seeds.
 * Seeds worden gewogen gecombineerd: artiesten die door meerdere seeds worden
 * aanbevolen krijgen een hogere score.
 */
async function generateBecauseYouListenTo(seedArtists) {
  if (!Array.isArray(seedArtists) || !seedArtists.length) return [];
  const seeds = seedArtists.slice(0, 5);

  const allSimilar = new Map(); // name → { name, count, totalMatch }
  await Promise.allSettled(
    seeds.map(async (seed) => {
      try {
        const similar = await getSimilarArtists(seed, 20);
        for (const s of similar) {
          const key = norm(s.name);
          const existing = allSimilar.get(key) || { name: s.name, count: 0, totalMatch: 0 };
          existing.count++;
          existing.totalMatch += parseFloat(s.match || 0);
          allSimilar.set(key, existing);
        }
      } catch {}
    })
  );

  if (!allSimilar.size) return [];

  // Sorteer: count × gemiddelde match (meeste seeds + hoogste gelijkenis bovenaan)
  const sorted = [...allSimilar.values()]
    .map(e => ({ ...e, score: e.count * (e.totalMatch / e.count) }))
    .sort((a, b) => b.score - a.score)
    .filter(c => artistInPlex(c.name));

  if (!sorted.length) return [];

  const library = getPlexLibrary();
  const resultTracks = [];

  for (const candidate of sorted.slice(0, 20)) {
    const artistAlbums = library.filter(alb => norm(alb.artist) === norm(candidate.name));
    if (!artistAlbums.length) continue;
    const alb = artistAlbums[Math.floor(Math.random() * artistAlbums.length)];
    try {
      const tracks = await getAlbumTracks(alb.ratingKey);
      const sample  = shuffle(tracks).slice(0, 3);
      for (const t of sample) {
        resultTracks.push({
          artist:    candidate.name,
          title:     t.title,
          album:     alb.album,
          duration:  t.duration || null,
          plex_key:  t.ratingKey || alb.ratingKey,
          cover_url: thumbUrl(alb.thumb),
          reason:    `Vergelijkbaar met: ${seeds.slice(0, 2).join(', ')}`,
        });
      }
    } catch {}
    if (resultTracks.length >= 50) break;
  }

  return shuffle(resultTracks).slice(0, 50);
}

// ── 11. Daily Genre Mixes ─────────────────────────────────────────────────────
/**
 * Meerdere mixen per genre: analyseert top-5 genres van de gebruiker op basis
 * van Last.fm data en genereert per genre 30 tracks uit Plex.
 * Retourneert array van mixen: [{ genre, tracks }]
 */
async function generateDailyGenreMixes() {
  // Haal top-artiesten op en bepaal genres via Last.fm tags
  let topArtists = [];
  try {
    const data = await lfm({ method: 'user.gettopartists', period: '1month', limit: 50 });
    topArtists = (data.topartists?.artist || []).map(a => a.name).filter(artistInPlex);
  } catch (e) {
    logger.warn({ err: e }, 'DailyGenreMixes: top artiesten mislukt');
    return [];
  }

  if (!topArtists.length) return [];

  // Bouw genre-teller op via Last.fm tags
  const genreCount = new Map();
  await Promise.allSettled(
    topArtists.slice(0, 30).map(async (artistName) => {
      try {
        const tagData = await lfm(
          { method: 'artist.gettoptags', artist: artistName },
          { includeUser: false, cacheKey: `tags:${norm(artistName)}`, cacheTTL: 7 * 24 * 3_600_000 }
        );
        const tags = (tagData.toptags?.tag || []).slice(0, 5);
        for (const tag of tags) {
          const g = tag.name.toLowerCase();
          if (g.length > 2 && g.length < 30) {
            genreCount.set(g, (genreCount.get(g) || 0) + 1);
          }
        }
      } catch {}
    })
  );

  // Top 5 genres
  const topGenres = [...genreCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([genre]) => genre);

  if (!topGenres.length) return [];

  const library = getPlexLibrary();
  const mixes   = [];

  for (const genre of topGenres) {
    // Artiesten die dit genre hebben in hun tags
    let genreArtists = [];
    try {
      const data = await lfm(
        { method: 'tag.gettopartists', tag: genre, limit: 30 },
        { includeUser: false, cacheKey: `tag:topartists:${genre}`, cacheTTL: 24 * 3_600_000 }
      );
      genreArtists = (data.topartists?.artist || []).map(a => a.name).filter(artistInPlex);
    } catch {}

    // Fallback: gebruik Plex-artiesten die dit genre-tag hebben
    if (!genreArtists.length) {
      genreArtists = topArtists.filter(a => {
        const cached = /* niet opnieuw ophalen */ true;
        return cached;
      });
    }

    if (!genreArtists.length) continue;

    const normNames  = new Set(genreArtists.map(norm));
    const albums     = shuffle(library.filter(alb => normNames.has(norm(alb.artist)))).slice(0, 10);
    const tracks     = await fetchTracksForAlbums(albums, 3);
    const genreTracks = shuffle(tracks).slice(0, 30);

    if (genreTracks.length) {
      mixes.push({ genre: capitalizeFirst(genre), tracks: genreTracks });
    }
  }

  return mixes;
}

function capitalizeFirst(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

// ── 12. Popular Picks ─────────────────────────────────────────────────────────
/**
 * Tracks uit Plex met hoge Last.fm globale playcount die de gebruiker de
 * afgelopen 30 dagen NIET heeft geluisterd.
 */
async function generatePopularPicks() {
  // Haal top-artiesten op (overall) voor scoreberekening
  let topArtists = [];
  try {
    const data = await lfm({ method: 'user.gettopartists', period: 'overall', limit: 50 });
    topArtists = (data.topartists?.artist || []).filter(a => artistInPlex(a.name));
  } catch (e) {
    logger.warn({ err: e }, 'PopularPicks: top artiesten mislukt');
    return [];
  }

  // Wat heeft de gebruiker de afgelopen 30 dagen geluisterd?
  let recentSet = new Set();
  try {
    const data = await lfm({ method: 'user.getrecenttracks', limit: 200 });
    (data.recenttracks?.track || []).forEach(t => {
      recentSet.add(`${norm(t.artist['#text'] || '')}||${norm(t.name)}`);
    });
  } catch {}

  const library = getPlexLibrary();
  const candidates = [];

  for (const artist of topArtists.slice(0, 30)) {
    try {
      const data = await lfm(
        { method: 'artist.gettoptracks', artist: artist.name, limit: 20 },
        { includeUser: false, cacheKey: `toptracks:global:${norm(artist.name)}`, cacheTTL: 7 * 24 * 3_600_000 }
      );
      const tracks = data.toptracks?.track || [];
      for (const t of tracks) {
        const key = `${norm(artist.name)}||${norm(t.name)}`;
        if (recentSet.has(key)) continue; // recent geluisterd — overslaan

        // Zoek album in Plex
        const plexAlbs = library.filter(alb => norm(alb.artist) === norm(artist.name));
        if (!plexAlbs.length) continue;
        const alb = plexAlbs[0];

        candidates.push({
          artist:    artist.name,
          title:     t.name,
          album:     alb.album,
          duration:  t.duration ? parseInt(t.duration, 10) * 1000 : null,
          plex_key:  alb.ratingKey,
          cover_url: thumbUrl(alb.thumb),
          _playcount: parseInt(t.playcount, 10) || 0,
        });
      }
    } catch {}
  }

  // Sorteer op globale playcount (meest populair bovenaan)
  return candidates
    .sort((a, b) => b._playcount - a._playcount)
    .slice(0, 50)
    .map(({ _playcount, ...t }) => t);
}

// ── 13. Discovery Shuffle ─────────────────────────────────────────────────────
/**
 * Random tracks van artiesten in Plex die NIET in de top-50 van de gebruiker
 * voorkomen. Gericht op het herontdekken van vergeten bibliotheek-artiesten.
 */
async function generateDiscoveryShuffle() {
  // Top-50 artiesten van de gebruiker (overall)
  let topNames = new Set();
  try {
    const data = await lfm({ method: 'user.gettopartists', period: 'overall', limit: 50 });
    (data.topartists?.artist || []).forEach(a => topNames.add(norm(a.name)));
  } catch (e) {
    logger.warn({ err: e }, 'DiscoveryShuffle: top artiesten mislukt');
  }

  const library = getPlexLibrary();

  // Filter alle Plex-artiesten die NIET in de top-50 zitten
  const allArtists = [...new Set(library.map(a => a.artist))];
  const forgotten  = allArtists.filter(a => !topNames.has(norm(a)));

  if (!forgotten.length) return [];

  // Pak random albums van vergeten artiesten
  const shuffledArtists = shuffle(forgotten).slice(0, 25);
  const normForgotten   = new Set(shuffledArtists.map(norm));
  const albums = shuffle(library.filter(alb => normForgotten.has(norm(alb.artist)))).slice(0, 15);

  const tracks = await fetchTracksForAlbums(albums, 3);
  return shuffle(tracks).slice(0, 50);
}

// ── 14. Familiar Favorites ────────────────────────────────────────────────────
/**
 * Meest gespeelde tracks (Last.fm user playcount), slim geroteerd.
 * Roteert 20% van de tracks bij elke verversing.
 * @param {object} params - { rotation_seed: number }
 */
async function generateFamiliarFavorites(params = {}) {
  // Top-tracks over alle tijden (hoge user playcount)
  let allTop = [];
  try {
    const data = await lfm({ method: 'user.gettoptracks', period: 'overall', limit: 200 });
    allTop = (data.toptracks?.track || []).map(t => ({
      artist:    t.artist.name || t.artist['#text'] || '',
      title:     t.name,
      playcount: parseInt(t.playcount, 10) || 0,
    }));
  } catch (e) {
    logger.warn({ err: e }, 'FamiliarFavorites: top tracks mislukt');
    return [];
  }

  // Filter op aanwezigheid in Plex
  const library = getPlexLibrary();
  const inPlex  = allTop.filter(t => artistInPlex(t.artist));

  if (!inPlex.length) return [];

  // 80% vaste kern (top gespeelde), 20% rotatie (willekeurig uit de staart)
  const coreSize     = Math.floor(inPlex.length * 0.8);
  const core         = inPlex.slice(0, coreSize);
  const rotation     = shuffle(inPlex.slice(coreSize));
  const rotationSize = Math.max(10, Math.floor(50 * 0.2)); // 20% van max 50

  const combined = [
    ...core.slice(0, 50 - rotationSize),
    ...rotation.slice(0, rotationSize),
  ];

  // Shuffle de gecombineerde lijst voor afwisseling
  const result = shuffle(combined);

  // Verrijk met Plex metadata
  return result.slice(0, 50).map(t => {
    const plexAlbs = library.filter(alb => norm(alb.artist) === norm(t.artist));
    const alb      = plexAlbs[0];
    return {
      artist:    t.artist,
      title:     t.title,
      album:     alb?.album || null,
      duration:  null,
      plex_key:  alb?.ratingKey || null,
      cover_url: thumbUrl(alb?.thumb),
    };
  }).filter(t => t.plex_key);
}

// ── 15. Custom Playlist Builder (uitgebreid) ──────────────────────────────────
/**
 * Uitgebreide versie van generateCustomPlaylist met diversiteitsinstelling.
 * @param {object} params - { seeds, trackCount, diversityFactor, includeSeeds }
 *   diversityFactor: 0.0 = dicht bij seeds, 1.0 = maximale diversiteit
 */
async function generateCustomPlaylistBuilder(params = {}) {
  const {
    seeds          = [],
    trackCount     = 50,
    diversityFactor = 0.5,
    includeSeeds   = true,
  } = params;

  if (!seeds.length) return [];

  const maxTracks = Math.min(Math.max(parseInt(trackCount, 10) || 50, 30), 100);
  const diversity = Math.min(Math.max(parseFloat(diversityFactor) || 0.5, 0), 1);

  // Similar artists per seed (meer similar bij hogere diversity)
  const similarLimit = Math.round(10 + diversity * 20); // 10–30
  const candidateMap = new Map();

  await Promise.allSettled(
    seeds.slice(0, 5).map(async (seed) => {
      try {
        const similar = await getSimilarArtists(seed, similarLimit);
        for (const s of similar) {
          const key = norm(s.name);
          const existing = candidateMap.get(key) || { name: s.name, match: 0, seedCount: 0 };
          existing.seedCount++;
          existing.match = Math.max(existing.match, parseFloat(s.match || 0));
          candidateMap.set(key, existing);
        }
      } catch {}
    })
  );

  // Seeds zelf toevoegen als includeSeeds
  if (includeSeeds) {
    for (const seed of seeds.slice(0, 5)) {
      if (artistInPlex(seed)) {
        const key = norm(seed);
        if (!candidateMap.has(key)) {
          candidateMap.set(key, { name: seed, match: 1.0, seedCount: seeds.length });
        }
      }
    }
  }

  // Sorteer: bij lage diversity → naaste seeds; bij hoge diversity → meer variatie
  const scored = [...candidateMap.values()]
    .filter(c => artistInPlex(c.name))
    .map(c => ({
      ...c,
      score: (1 - diversity) * c.match + diversity * (Math.random() * 0.5 + c.seedCount * 0.1),
    }))
    .sort((a, b) => b.score - a.score);

  if (!scored.length) return [];

  const library      = getPlexLibrary();
  const resultTracks = [];
  const tracksPerArtist = Math.max(2, Math.round(maxTracks / Math.min(scored.length, 25)));

  for (const candidate of scored.slice(0, 25)) {
    const artistAlbums = library.filter(alb => norm(alb.artist) === norm(candidate.name));
    if (!artistAlbums.length) continue;

    const alb = artistAlbums[Math.floor(Math.random() * artistAlbums.length)];
    try {
      const tracks = await getAlbumTracks(alb.ratingKey);
      const sample  = shuffle(tracks).slice(0, tracksPerArtist);
      for (const t of sample) {
        resultTracks.push({
          artist:    candidate.name,
          title:     t.title,
          album:     alb.album,
          duration:  t.duration || null,
          plex_key:  t.ratingKey || alb.ratingKey,
          cover_url: thumbUrl(alb.thumb),
        });
      }
    } catch {}
    if (resultTracks.length >= maxTracks) break;
  }

  return shuffle(resultTracks).slice(0, maxTracks);
}

// ── 9. Custom Playlist ────────────────────────────────────────────────────────
/**
 * Custom playlist op basis van 1-5 seed-artiesten.
 * Haalt similar artists op, filtert op Plex, en pakt 2-3 tracks per artiest.
 */
async function generateCustomPlaylist(seedArtists) {
  if (!Array.isArray(seedArtists) || !seedArtists.length) return [];
  const seeds = seedArtists.slice(0, 5);

  // Similar artists per seed
  const candidateMap = new Map();
  await Promise.allSettled(
    seeds.map(async (artist) => {
      try {
        const similar = await getSimilarArtists(artist, 10);
        for (const s of similar) {
          if (!candidateMap.has(s.name)) {
            candidateMap.set(s.name, { name: s.name, match: parseFloat(s.match) || 0 });
          }
        }
      } catch {}
    })
  );

  // Voeg de seeds zelf toe als ze in Plex zitten
  for (const seed of seeds) {
    if (artistInPlex(seed) && !candidateMap.has(seed)) {
      candidateMap.set(seed, { name: seed, match: 1.0 });
    }
  }

  // Filter op Plex en sorteer
  const inPlex = [...candidateMap.values()]
    .filter(c => artistInPlex(c.name))
    .sort((a, b) => b.match - a.match);

  if (!inPlex.length) return [];

  const library = getPlexLibrary();
  const resultTracks = [];

  for (const candidate of inPlex.slice(0, 20)) {
    const artistAlbums = library
      .filter(alb => norm(alb.artist) === norm(candidate.name));
    if (!artistAlbums.length) continue;

    const alb = artistAlbums[Math.floor(Math.random() * artistAlbums.length)];
    try {
      const tracks = await getAlbumTracks(alb.ratingKey);
      const sample  = shuffle(tracks).slice(0, 2);
      for (const t of sample) {
        resultTracks.push({
          artist:    candidate.name,
          title:     t.title,
          album:     alb.album,
          duration:  t.duration || null,
          plex_key:  t.ratingKey || alb.ratingKey,
          cover_url: thumbUrl(alb.thumb),
        });
      }
    } catch {}

    if (resultTracks.length >= 50) break;
  }

  return shuffle(resultTracks).slice(0, 50);
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── SoulSync-stijl Playlist Engine ────────────────────────────────────────────
// 6 persoonlijke playlisttypen met Deezer-tracks, SQLite-cache en Plex-sync.
// ═══════════════════════════════════════════════════════════════════════════════

// ── Cache helpers ──────────────────────────────────────────────────────────────

const SS_TTL = {
  discovery_weekly:    7 * 24 * 60 * 60 * 1000,
  release_radar:           24 * 60 * 60 * 1000,
  forgotten_favorites: 7 * 24 * 60 * 60 * 1000,
  deep_cuts:           7 * 24 * 60 * 60 * 1000,
  decade:              7 * 24 * 60 * 60 * 1000,
  genre_mix:           7 * 24 * 60 * 60 * 1000,
};

// In-progress guards
const _ssBuilding = {};

function _ssCacheKey(type, params) {
  return params ? `ss_playlist:v1:${type}:${JSON.stringify(params)}` : `ss_playlist:v1:${type}`;
}

function _ssSave(type, name, tracks, params = null) {
  const ttl = SS_TTL[type] || 24 * 60 * 60 * 1000;
  const now = Date.now();
  setCache(_ssCacheKey(type, params), { type, name, tracks, params, builtAt: now, expiresAt: now + ttl });
}

function _ssRead(type, params = null) {
  const data = getCache(_ssCacheKey(type, params), Infinity);
  if (!data) return null;
  if (data.expiresAt && data.expiresAt < Date.now()) return null;
  return data;
}

// ── Deezer helper ──────────────────────────────────────────────────────────────

async function _deezerTracks(artistName, limit = 2) {
  try {
    const artist = await getDeezerArtist(artistName);
    if (!artist?.id) return [];
    const tracks = await getDeezerArtistTopTracks(artist.id);
    return (tracks || []).slice(0, limit).map(t => ({
      title: t.title, artist: artistName,
      album: t.album?.title || '', source: 'deezer', deezerTrackId: t.id,
    }));
  } catch { return []; }
}

// Verwerkt items met beperkte gelijktijdigheid; fn(item) → Array van tracks
async function _withLimit(items, fn, concurrency = 3) {
  const out = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const settled = await Promise.allSettled(items.slice(i, i + concurrency).map(fn));
    for (const r of settled) {
      if (r.status === 'fulfilled' && Array.isArray(r.value)) out.push(...r.value);
    }
  }
  return out;
}

// ── Plex-playlist sync ─────────────────────────────────────────────────────────

let _ssMachineId = null;

async function _ssMachineIdGet() {
  if (_ssMachineId) return _ssMachineId;
  try {
    const data = await plexGet('/identity');
    _ssMachineId = data?.MediaContainer?.machineIdentifier || null;
  } catch (e) { logger.warn({ err: e.message }, 'Playlists: machineId ophalen mislukt'); }
  return _ssMachineId;
}

async function _ssPlexDelete(path) {
  if (!PLEX_TOKEN || !PLEX_URL) return;
  const sep = path.includes('?') ? '&' : '?';
  try {
    await fetch(`${PLEX_URL}${path}${sep}X-Plex-Token=${PLEX_TOKEN}`, {
      method: 'DELETE', headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10_000),
    });
  } catch (e) { logger.warn({ err: e.message }, 'Playlists: Plex DELETE mislukt'); }
}

function _ssNorm(s) { return (s || '').toLowerCase().replace(/[^\w\s]/g, '').trim(); }

async function _findPlexTrack(title, artist) {
  try {
    const res = await searchPlexLibrary(title, 10);
    const t = _ssNorm(title);
    const a0 = _ssNorm(artist).split(' ')[0];
    return (
      (res.tracks || []).find(tr => _ssNorm(tr.title) === t && _ssNorm(tr.artist).includes(a0)) ||
      (res.tracks || []).find(tr => _ssNorm(tr.title) === t)
    )?.ratingKey || null;
  } catch { return null; }
}

async function _ssPlexSync(name, tracks) {
  if (!PLEX_TOKEN || !PLEX_URL) return { ok: false, reason: 'Plex niet geconfigureerd' };
  const machineId = await _ssMachineIdGet();
  if (!machineId) return { ok: false, reason: 'Machine ID niet beschikbaar' };

  const ratingKeys = [];
  for (const track of tracks) {
    const rk = await _findPlexTrack(track.title, track.artist);
    if (rk) ratingKeys.push(rk);
  }
  if (!ratingKeys.length) return { ok: false, reason: 'Geen tracks gevonden in Plex' };

  const existing = (await getPlexPlaylists()).find(p => p.title === name);
  if (existing) await _ssPlexDelete(`/playlists/${existing.ratingKey}`);

  const uri = `server://${machineId}/com.plexapp.plugins.library/library/metadata/${ratingKeys.join(',')}`;
  const url = `/playlists?type=audio&title=${encodeURIComponent(name)}&smart=0&uri=${encodeURIComponent(uri)}`;
  const result = await plexPost(url);
  const created = result?.MediaContainer?.Metadata?.[0];
  logger.info({ name, found: ratingKeys.length, total: tracks.length }, 'Playlists: Plex sync klaar');
  return { ok: true, playlistId: created?.ratingKey, tracksAdded: ratingKeys.length, totalTracks: tracks.length };
}

// ── 1. Discovery Weekly ────────────────────────────────────────────────────────

async function _buildDiscoveryWeekly() {
  logger.info('Playlists: Discovery Weekly bouwen...');
  const topRes = await lfm({ method: 'user.getTopArtists', period: '1month', limit: '10' });
  const topArtists = (topRes?.topartists?.artist || []).map(a => a.name);
  if (!topArtists.length) return [];

  const plexNames = new Set((await getPlexArtistNames()).map(n => n.toLowerCase()));
  const seen = new Set(topArtists.map(n => n.toLowerCase()));
  const candidates = [];

  for (const name of topArtists) {
    try {
      const da = await getDeezerArtist(name);
      if (!da?.id) continue;
      const related = await getDeezerRelatedArtists(da.id);
      const eligible = (related || [])
        .filter(a => !plexNames.has(a.name.toLowerCase()) && !seen.has(a.name.toLowerCase()))
        .slice(0, 5);
      for (const sim of eligible) {
        seen.add(sim.name.toLowerCase());
        const tracks = await getDeezerArtistTopTracks(sim.id);
        candidates.push(
          ...(tracks || []).slice(0, 2).map(t => ({
            title: t.title, artist: sim.name, album: t.album?.title || '',
            source: 'deezer', deezerTrackId: t.id,
          }))
        );
      }
    } catch (e) { logger.warn({ artist: name, err: e.message }, 'Discovery Weekly: artiest overgeslagen'); }
  }

  // Serendipity: 10 willekeurige artiesten uit top-3 genres die niet in Plex staan
  const genreData = getGenreMap();
  if (genreData?.genres?.length) {
    const pool = [];
    for (const g of genreData.genres.slice(0, 3)) {
      for (const a of (g.artists || [])) {
        if (!plexNames.has(a.name.toLowerCase()) && !seen.has(a.name.toLowerCase())) pool.push(a.name);
      }
    }
    for (const n of shuffle(pool).slice(0, 10)) candidates.push(...await _deezerTracks(n, 1));
  }

  const result = shuffle(candidates).slice(0, 50);
  logger.info({ tracks: result.length }, 'Playlists: Discovery Weekly klaar');
  return result;
}

// ── 2. Release Radar ───────────────────────────────────────────────────────────

async function _buildReleaseRadar() {
  logger.info('Playlists: Release Radar bouwen...');
  const data = getReleases();
  if (data.status !== 'ok') return [];

  const cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;
  const recent = (data.releases || []).filter(r => {
    const d = r.releaseDate ? new Date(r.releaseDate).getTime() : 0;
    return d >= cutoff;
  });

  const tracks = [];
  for (const release of recent.slice(0, 30)) {
    try {
      const artist = await getDeezerArtist(release.artist);
      if (!artist?.id) continue;
      const topTracks = await getDeezerArtistTopTracks(artist.id);
      tracks.push(
        ...(topTracks || []).slice(0, 3).map(t => ({
          title: t.title, artist: release.artist, album: release.album || '',
          source: 'deezer', deezerTrackId: t.id,
          artistPlaycount: release.artistPlaycount || 0,
        }))
      );
    } catch (e) { logger.warn({ artist: release.artist, err: e.message }, 'Release Radar: overgeslagen'); }
  }

  tracks.sort((a, b) => (b.artistPlaycount || 0) - (a.artistPlaycount || 0));
  logger.info({ tracks: tracks.length }, 'Playlists: Release Radar klaar');
  return tracks;
}

// ── 3. Forgotten Favorites ─────────────────────────────────────────────────────

async function _buildForgottenFavorites() {
  logger.info('Playlists: Forgotten Favorites bouwen...');
  const [overallRes, recentRes] = await Promise.all([
    lfm({ method: 'user.getTopArtists', limit: '100' }),
    lfm({ method: 'user.getTopArtists', period: '3month', limit: '50' }),
  ]);
  const overall = (overallRes?.topartists?.artist || []).map(a => a.name);
  const recentSet = new Set((recentRes?.topartists?.artist || []).map(a => a.name.toLowerCase()));
  const forgotten = overall.filter(n => !recentSet.has(n.toLowerCase()));

  const tracks = await _withLimit(forgotten.slice(0, 20), artist => _deezerTracks(artist, 3), 4);
  const result = shuffle(tracks).slice(0, 40);
  logger.info({ tracks: result.length }, 'Playlists: Forgotten Favorites klaar');
  return result;
}

// ── 4. Decade Playlists ────────────────────────────────────────────────────────

const SS_DECADE_NAMES = {
  1960: 'Hits van de 60s', 1970: 'Hits van de 70s', 1980: 'Hits van de 80s',
  1990: 'Hits van de 90s', 2000: 'Hits van de 00s', 2010: 'Hits van de 10s',
  2020: 'Hits van de 20s',
};

async function _buildDecadePlaylists() {
  logger.info('Playlists: Decade Playlists bouwen...');
  const topRes = await lfm({ method: 'user.getTopArtists', limit: '200' });
  const playcountMap = new Map(
    (topRes?.topartists?.artist || []).map(a => [a.name.toLowerCase(), parseInt(a.playcount) || 0])
  );

  const allArtists = await getPlexArtistNames();
  const byDecade = new Map();

  for (const name of allArtists) {
    const mbz = getEnrichmentDataBySource('artist', name, 'musicbrainz');
    if (!mbz?.begin_date) continue;
    const year = parseInt(mbz.begin_date.slice(0, 4));
    if (!year || year < 1960) continue;
    const decade = Math.floor(year / 10) * 10;
    if (!SS_DECADE_NAMES[decade]) continue;
    if (!byDecade.has(decade)) byDecade.set(decade, []);
    byDecade.get(decade).push({ name, playcount: playcountMap.get(name.toLowerCase()) || 0 });
  }

  const built = [];
  for (const [decade, artists] of byDecade) {
    const top5 = artists.sort((a, b) => b.playcount - a.playcount).slice(0, 5);
    const tracks = await _withLimit(top5, a => _deezerTracks(a.name, 4), 3);
    if (!tracks.length) continue;
    const name = SS_DECADE_NAMES[decade];
    _ssSave('decade', name, tracks, { decade });
    built.push({ decade, name, trackCount: tracks.length });
    logger.info({ decade, tracks: tracks.length }, `Playlists: ${name} klaar`);
  }
  return built;
}

// ── 5. Genre Mixes ─────────────────────────────────────────────────────────────

async function _buildGenreMixes() {
  logger.info('Playlists: Genre Mixes bouwen...');
  const genreData = getGenreMap();
  if (genreData.status !== 'ok' || !genreData.genres?.length) return [];

  const built = [];
  for (const entry of genreData.genres.slice(0, 5)) {
    try {
      const artists = (entry.artists || []).slice(0, 10);
      const tracks  = shuffle(await _withLimit(artists, a => _deezerTracks(a.name, 3), 4));
      const name    = `${capitalizeFirst(entry.genre)} Mix`;
      _ssSave('genre_mix', name, tracks, { genre: entry.genre });
      built.push({ genre: entry.genre, name, trackCount: tracks.length });
      logger.info({ genre: entry.genre, tracks: tracks.length }, `Playlists: ${name} klaar`);
    } catch (e) { logger.warn({ genre: entry.genre, err: e.message }, 'Genre Mix: overgeslagen'); }
  }
  return built;
}

// ── 6. Deep Cuts ───────────────────────────────────────────────────────────────

async function _buildDeepCuts() {
  logger.info('Playlists: Deep Cuts bouwen...');
  const discover = getDiscover();
  const deepCutsArtists = discover?.deepCuts || [];
  if (!deepCutsArtists.length) return [];

  const tracks = [];
  for (const item of deepCutsArtists.slice(0, 30)) {
    try {
      if (item.track?.title) {
        tracks.push({ title: item.track.title, artist: item.name, album: '',
          source: 'deezer', deezerTrackId: item.track.id || null });
      } else {
        tracks.push(...await _deezerTracks(item.name, 1));
      }
    } catch (e) { logger.warn({ artist: item.name, err: e.message }, 'Deep Cuts: overgeslagen'); }
  }

  const result = shuffle(tracks).slice(0, 30);
  logger.info({ tracks: result.length }, 'Playlists: Deep Cuts klaar');
  return result;
}

// ── Build orchestratie ─────────────────────────────────────────────────────────

const SS_SIMPLE_DEFS = [
  { type: 'discovery_weekly',    name: 'Discovery Weekly',    build: _buildDiscoveryWeekly },
  { type: 'release_radar',       name: 'Release Radar',       build: _buildReleaseRadar },
  { type: 'forgotten_favorites', name: 'Forgotten Favorites', build: _buildForgottenFavorites },
  { type: 'deep_cuts',           name: 'Deep Cuts',           build: _buildDeepCuts },
];

function _ssRunSimple(type, name, buildFn) {
  const key = _ssCacheKey(type);
  if (_ssBuilding[key]) return;
  _ssBuilding[key] = true;
  buildFn()
    .then(tracks => { if (tracks.length) _ssSave(type, name, tracks); })
    .catch(e => logger.error({ type, err: e.message }, 'Playlists: build gefaald'))
    .finally(() => { delete _ssBuilding[key]; });
}

function _ssRunDecades() {
  if (_ssBuilding['decade:all']) return;
  _ssBuilding['decade:all'] = true;
  _buildDecadePlaylists()
    .catch(e => logger.error({ err: e.message }, 'Playlists: decade build gefaald'))
    .finally(() => { delete _ssBuilding['decade:all']; });
}

function _ssRunGenreMixes() {
  if (_ssBuilding['genre_mix:all']) return;
  _ssBuilding['genre_mix:all'] = true;
  _buildGenreMixes()
    .catch(e => logger.error({ err: e.message }, 'Playlists: genre mix build gefaald'))
    .finally(() => { delete _ssBuilding['genre_mix:all']; });
}

// ── Publieke SoulSync API ──────────────────────────────────────────────────────

/** Geeft metadata van alle gegenereerde playlists terug (zonder tracks). */
function getPlaylists() {
  const result = [];

  for (const def of SS_SIMPLE_DEFS) {
    const data = _ssRead(def.type);
    result.push({
      type: def.type, name: def.name,
      trackCount: data?.tracks?.length || 0,
      builtAt: data?.builtAt || null, expiresAt: data?.expiresAt || null,
      ready: !!data, building: !!_ssBuilding[_ssCacheKey(def.type)],
    });
  }

  for (const [decadeStr, name] of Object.entries(SS_DECADE_NAMES)) {
    const decade = parseInt(decadeStr);
    const data   = _ssRead('decade', { decade });
    result.push({
      type: 'decade', name, params: { decade },
      trackCount: data?.tracks?.length || 0,
      builtAt: data?.builtAt || null, expiresAt: data?.expiresAt || null,
      ready: !!data, building: !!_ssBuilding['decade:all'],
    });
  }

  const genreData = getGenreMap();
  for (const entry of (genreData?.genres || []).slice(0, 5)) {
    const data = _ssRead('genre_mix', { genre: entry.genre });
    result.push({
      type: 'genre_mix', name: `${capitalizeFirst(entry.genre)} Mix`, params: { genre: entry.genre },
      trackCount: data?.tracks?.length || 0,
      builtAt: data?.builtAt || null, expiresAt: data?.expiresAt || null,
      ready: !!data, building: !!_ssBuilding['genre_mix:all'],
    });
  }

  return result;
}

/**
 * Geeft tracks van een specifieke playlist terug, of null als niet beschikbaar.
 * @param {string} type
 * @param {object} [params]  – bijv. { decade: 1980 } of { genre: 'rock' }
 */
function getPlaylistTracks(type, params = null) {
  const data = _ssRead(type, params);
  return data ? { name: data.name, tracks: data.tracks, builtAt: data.builtAt } : null;
}

/** Forceert rebuild van de opgegeven playlist. */
function refreshPlaylist(type, params = null) {
  const def = SS_SIMPLE_DEFS.find(d => d.type === type);
  if (def) { _ssRunSimple(def.type, def.name, def.build); return { ok: true, building: true }; }
  if (type === 'decade') { _ssRunDecades(); return { ok: true, building: true }; }
  if (type === 'genre_mix') { _ssRunGenreMixes(); return { ok: true, building: true }; }
  return { ok: false, reason: 'Onbekend playlist type' };
}

/** Synchroniseert een gegenereerde playlist naar Plex als afspeellijst. */
async function syncPlaylistToPlex(type, params = null) {
  const data = _ssRead(type, params);
  if (!data) return { ok: false, reason: 'Playlist niet beschikbaar – eerst bouwen' };
  return _ssPlexSync(data.name, data.tracks);
}

/**
 * Controleert welke playlists verlopen zijn en start rebuilds in de achtergrond.
 * Wordt 60 seconden na serverstart aangeroepen via startup.js.
 */
function initPlaylists() {
  setTimeout(async () => {
    logger.info('Playlists: initialisatie gestart');
    for (const def of SS_SIMPLE_DEFS) {
      if (!_ssRead(def.type)) {
        logger.info({ type: def.type }, 'Playlists: verlopen, bouwen gestart');
        _ssRunSimple(def.type, def.name, def.build);
        await new Promise(r => setTimeout(r, 3_000));
      }
    }
    if (Object.keys(SS_DECADE_NAMES).some(d => !_ssRead('decade', { decade: parseInt(d) }))) {
      logger.info('Playlists: decade playlists verlopen, bouwen gestart');
      _ssRunDecades();
    }
    const genreData = getGenreMap();
    const anyGenreExpired = (genreData?.genres || []).slice(0, 5).some(g => !_ssRead('genre_mix', { genre: g.genre }));
    if (anyGenreExpired) {
      logger.info('Playlists: genre mixes verlopen, bouwen gestart');
      _ssRunGenreMixes();
    }
  }, 60_000);
}

// ── Publieke API ──────────────────────────────────────────────────────────────
module.exports = {
  generateReleaseRadar,
  generateDiscoveryWeekly,
  generateSeasonalPlaylist,
  generateDecadePlaylist,
  generateGenrePlaylist,
  generateForgottenFavorites,
  generateHiddenGems,
  generateDailyMix,
  generateCustomPlaylist,
  // Nieuwe generators
  generateBecauseYouListenTo,
  generateDailyGenreMixes,
  generatePopularPicks,
  generateDiscoveryShuffle,
  generateFamiliarFavorites,
  generateCustomPlaylistBuilder,
  getAvailableGenres,
  currentSeason,
  SEASON_TAGS,
  // SoulSync Playlist Engine
  getPlaylists,
  getPlaylistTracks,
  refreshPlaylist,
  syncPlaylistToPlex,
  initPlaylists,
};
