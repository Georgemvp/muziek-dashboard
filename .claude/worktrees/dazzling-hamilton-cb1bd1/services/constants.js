// ── Gedeelde constanten voor services en routes ────────────────────────────

/**
 * Genre-stopwords: tags die geen echte genres zijn (persoonlijke labels,
 * nationaliteiten, vage kwalificaties). Worden gefilterd uit MusicBrainz-tags
 * in /api/top/artists, /api/recs en /api/stats.
 */
const GENRE_STOPWORDS = new Set([
  'seen live', 'listened', 'favourite', 'favorites', 'love', 'loved',
  'awesome', 'cool', 'good', 'great', 'american', 'british', 'german',
  'swedish', 'norwegian', 'dutch', 'canadian', 'australian',
]);

module.exports = { GENRE_STOPWORDS };
