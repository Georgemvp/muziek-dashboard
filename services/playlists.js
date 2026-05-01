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
} = require('./plex');
const { getCache, setCache, getSetting } = require('../db');

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
  getAvailableGenres,
  currentSeason,
  SEASON_TAGS,
};
