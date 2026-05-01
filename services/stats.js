'use strict';
// ── Stats Service ─────────────────────────────────────────────────────────────
// Combineert Last.fm + Plex data voor het statistieken-dashboard.
// Alle zware bewerkingen worden gecached via db.js.

const logger = require('../logger');

// ── Genre junk-filter: gooi vage en te brede tags weg ────────────────────────
const GENRE_JUNK = new Set([
  'seen live', 'favorites', 'favourite', 'awesome', 'great', 'love',
  'beautiful', 'chill', 'sad', 'happy', 'workout', 'study', 'sleep',
  'background', 'lounge', 'relax', 'relaxing', 'instrumental',
  'male vocalist', 'female vocalist', 'vocalist', 'singer', 'american',
  'british', 'german', 'swedish', 'dutch', 'norwegian', 'french', 'italian',
  'canadian', 'australian', '80s', '90s', '00s', '2000s', '1980s', '1990s',
  'albums i own', 'collection', 'all', 'music', 'good', 'best',
]);

/**
 * Filter slechte genres. Gooi weg:
 *  - te korte labels (< 2 chars)
 *  - junk-woorden uit GENRE_JUNK
 *  - tags die eindigen op artiestennaam (heuristic)
 * @param {string} tag
 * @param {string[]} artistNames - lowercase artiestennamen om te filteren
 */
function isValidGenre(tag, artistNames = []) {
  const t = (tag || '').trim().toLowerCase();
  if (t.length < 2) return false;
  if (GENRE_JUNK.has(t)) return false;
  // Filter artiestennamen als genre
  for (const name of artistNames) {
    if (name && t === name.toLowerCase()) return false;
  }
  return true;
}

/**
 * Aggregeer genre-verdeling uit Last.fm top artists data.
 * Gewogen op playcount per artiest.
 *
 * @param {Array} topArtists - [{name, playcount, tags:[{name}]}]
 * @returns {{ labels: string[], values: number[] }}
 */
function aggregateGenres(topArtists) {
  const artistNames = topArtists.map(a => (a.name || '').toLowerCase());
  const genreMap = new Map();

  for (const artist of topArtists) {
    const plays = parseInt(artist.playcount) || 1;
    const tags  = artist.tags?.tag || [];

    for (const tag of tags) {
      const name = (tag.name || tag || '').trim();
      if (!isValidGenre(name, artistNames)) continue;

      const key = name.toLowerCase();
      // Kapitaliseer eerste letter
      const label = name.charAt(0).toUpperCase() + name.slice(1);
      genreMap.set(key, {
        label,
        count: (genreMap.get(key)?.count || 0) + plays,
      });
    }
  }

  // Sorteer op count, neem top 12
  const sorted = [...genreMap.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  return {
    labels: sorted.map(g => g.label),
    values: sorted.map(g => g.count),
  };
}

/**
 * Bereken listening-uren op basis van play count.
 * Gemiddelde track-duur: 3.5 minuten.
 */
function estimateListeningHours(totalPlays) {
  return Math.round((totalPlays * 3.5) / 60);
}

/**
 * Tel unieke artiesten/tracks in de speelgeschiedenis.
 */
function countUniques(history) {
  const artists = new Set();
  const tracks  = new Set();
  for (const item of history) {
    if (item.grandparentTitle) artists.add(item.grandparentTitle.toLowerCase());
    if (item.title)            tracks.add(`${(item.grandparentTitle||'').toLowerCase()}||${item.title.toLowerCase()}`);
  }
  return { uniqueArtists: artists.size, uniqueTracks: tracks.size };
}

/**
 * Aggregeer plays per dag (voor timeline chart).
 * Retourneert labels + values voor Chart.js.
 * @param {object[]} dailyPlays - [{date:'2026-04-01', count:23}]
 * @param {string}   period     - '7day'|'30day'|'12month'|'overall'
 */
function buildTimeline(dailyPlays, period) {
  if (!dailyPlays?.length) return { labels: [], values: [] };

  // Groepeer per maand als 12month of overall
  if (period === '12month' || period === 'overall') {
    const monthly = new Map();
    for (const d of dailyPlays) {
      const month = d.date.substring(0, 7); // 'YYYY-MM'
      monthly.set(month, (monthly.get(month) || 0) + d.count);
    }
    const sorted = [...monthly.entries()].sort(([a], [b]) => a.localeCompare(b));
    return {
      labels: sorted.map(([m]) => {
        const [year, mon] = m.split('-');
        const d = new Date(+year, +mon - 1);
        return d.toLocaleDateString('nl-NL', { month: 'short', year: '2-digit' });
      }),
      values: sorted.map(([, v]) => v),
    };
  }

  // Dag-voor-dag voor 7day / 30day / 1month
  const sorted = [...dailyPlays].sort((a, b) => a.date.localeCompare(b.date));
  return {
    labels: sorted.map(d => {
      const dt = new Date(d.date);
      return dt.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
    }),
    values: sorted.map(d => d.count),
  };
}

module.exports = {
  aggregateGenres,
  estimateListeningHours,
  countUniques,
  buildTimeline,
  isValidGenre,
};
