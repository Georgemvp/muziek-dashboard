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

/**
 * Positieve genre-whitelist voor de Genre Explorer.
 * Alleen tags die in deze set staan worden opgenomen in de genre-map.
 */
const GENRE_WHITELIST = new Set([
  // Rock
  'rock', 'classic rock', 'hard rock', 'indie rock', 'alternative rock',
  'progressive rock', 'psychedelic rock', 'art rock', 'glam rock',
  'garage rock', 'southern rock', 'post-rock', 'krautrock', 'math rock',
  'noise rock', 'space rock',
  // Punk & derivaten
  'punk', 'punk rock', 'post-punk', 'new wave', 'hardcore', 'post-hardcore', 'emo',
  // Grunge & shoegaze
  'grunge', 'shoegaze', 'dream pop',
  // Metal
  'metal', 'heavy metal', 'death metal', 'black metal', 'doom metal',
  'thrash metal', 'power metal', 'folk metal', 'symphonic metal',
  'nu-metal', 'metalcore', 'post-metal', 'stoner rock', 'sludge metal',
  // Pop
  'pop', 'indie pop', 'synth-pop', 'electropop', 'chamber pop',
  'baroque pop', 'art pop', 'sophisti-pop', 'power pop', 'k-pop', 'j-pop',
  // Electronic
  'electronic', 'ambient', 'techno', 'house', 'deep house', 'trance',
  'drum and bass', 'dubstep', 'idm', 'downtempo', 'trip-hop', 'electronica',
  'industrial', 'noise', 'synthwave', 'chillout', 'breakbeat', 'jungle',
  'uk garage', 'minimal techno', 'acid house', 'electro', 'ebm',
  'drone', 'dark ambient',
  // Hip-hop & R&B
  'hip hop', 'hip-hop', 'rap', 'r&b', 'neo soul', 'g-funk', 'trap',
  'conscious hip hop', 'alternative hip hop', 'gangsta rap',
  // Soul & Funk
  'soul', 'funk', 'rhythm and blues',
  // Jazz
  'jazz', 'jazz fusion', 'bebop', 'cool jazz', 'free jazz', 'smooth jazz',
  'hard bop', 'swing', 'bossa nova', 'latin jazz', 'nu jazz',
  // Classical & orkest
  'classical', 'baroque', 'romantic', 'contemporary classical', 'opera',
  'chamber music', 'orchestral', 'minimalism', 'neoclassical', 'modern classical',
  // Folk & country
  'folk', 'indie folk', 'folk rock', 'country', 'country rock', 'americana',
  'bluegrass', 'roots rock', 'singer-songwriter', 'acoustic', 'celtic',
  'traditional folk', 'neofolk', 'anti-folk',
  // Blues
  'blues', 'delta blues', 'chicago blues', 'electric blues', 'blues rock',
  // World
  'reggae', 'ska', 'latin', 'afrobeat', 'world music', 'flamenco', 'salsa',
  'cumbia', 'afropop', 'tropicália',
  // Overig
  'experimental', 'lo-fi', 'new age', 'gospel', 'spiritual',
]);

/**
 * Genre-kleuren voor de Genre Explorer UI.
 * Genres zonder expliciete kleur krijgen DEFAULT_GENRE_COLOR.
 */
const GENRE_COLORS = {
  // Rock familie → rood/oranje
  'rock': '#e74c3c',
  'classic rock': '#c0392b',
  'hard rock': '#e74c3c',
  'indie rock': '#e67e22',
  'alternative rock': '#d35400',
  'progressive rock': '#8e44ad',
  'psychedelic rock': '#9b59b6',
  'art rock': '#7d3c98',
  'glam rock': '#e91e63',
  'garage rock': '#e74c3c',
  'southern rock': '#b7950b',
  'post-rock': '#546e7a',
  'krautrock': '#78909c',
  'math rock': '#455a64',
  'noise rock': '#757575',
  'space rock': '#1565c0',
  'stoner rock': '#6d4c41',
  // Punk
  'punk': '#c0392b',
  'punk rock': '#c0392b',
  'post-punk': '#7f8c8d',
  'new wave': '#2980b9',
  'hardcore': '#d32f2f',
  'post-hardcore': '#c62828',
  'emo': '#7986cb',
  // Grunge/shoegaze
  'grunge': '#6c3483',
  'shoegaze': '#8e44ad',
  'dream pop': '#ba68c8',
  // Metal → donkerrood
  'metal': '#922b21',
  'heavy metal': '#7b241c',
  'death metal': '#512e5f',
  'black metal': '#212121',
  'doom metal': '#4a235a',
  'thrash metal': '#7d6608',
  'power metal': '#b7950b',
  'folk metal': '#4e342e',
  'symphonic metal': '#6a1b9a',
  'nu-metal': '#784212',
  'metalcore': '#6d4c41',
  'post-metal': '#37474f',
  'sludge metal': '#3e2723',
  // Pop → roze/paars
  'pop': '#e91e63',
  'indie pop': '#f06292',
  'synth-pop': '#ab47bc',
  'electropop': '#9c27b0',
  'chamber pop': '#ad1457',
  'baroque pop': '#c2185b',
  'art pop': '#7b1fa2',
  'sophisti-pop': '#880e4f',
  'power pop': '#d81b60',
  'k-pop': '#e91e63',
  'j-pop': '#f48fb1',
  // Electronic → blauw/cyaan
  'electronic': '#2196f3',
  'ambient': '#00bcd4',
  'techno': '#1565c0',
  'house': '#0288d1',
  'deep house': '#01579b',
  'trance': '#7e57c2',
  'drum and bass': '#283593',
  'dubstep': '#4527a0',
  'idm': '#00838f',
  'downtempo': '#00695c',
  'trip-hop': '#4a148c',
  'electronica': '#1976d2',
  'industrial': '#37474f',
  'noise': '#616161',
  'synthwave': '#6a1b9a',
  'chillout': '#26c6da',
  'breakbeat': '#283593',
  'jungle': '#1b5e20',
  'uk garage': '#0d47a1',
  'minimal techno': '#1a237e',
  'acid house': '#311b92',
  'electro': '#1565c0',
  'ebm': '#263238',
  'drone': '#546e7a',
  'dark ambient': '#212121',
  // Hip-hop → oranje
  'hip hop': '#ff5722',
  'hip-hop': '#ff5722',
  'rap': '#e64a19',
  'r&b': '#ff7043',
  'g-funk': '#ef6c00',
  'trap': '#bf360c',
  'conscious hip hop': '#e65100',
  'alternative hip hop': '#f4511e',
  'gangsta rap': '#d84315',
  // Soul/Funk → amber/goud
  'soul': '#ffc107',
  'neo soul': '#ff8f00',
  'funk': '#ffb300',
  'rhythm and blues': '#ff6f00',
  // Jazz → goud
  'jazz': '#f39c12',
  'jazz fusion': '#e67e22',
  'bebop': '#d4ac0d',
  'cool jazz': '#d4ac0d',
  'free jazz': '#b7950b',
  'smooth jazz': '#f0b27a',
  'hard bop': '#d68910',
  'swing': '#d68910',
  'bossa nova': '#ca6f1e',
  'latin jazz': '#b9770e',
  'nu jazz': '#f39c12',
  // Klassiek → paars
  'classical': '#9b59b6',
  'baroque': '#76448a',
  'romantic': '#7d3c98',
  'contemporary classical': '#6c3483',
  'opera': '#8e44ad',
  'chamber music': '#9b59b6',
  'orchestral': '#7d3c98',
  'minimalism': '#a29bfe',
  'neoclassical': '#6c3483',
  'modern classical': '#8e44ad',
  // Folk/Country → bruin/groen
  'folk': '#795548',
  'indie folk': '#6d4c41',
  'folk rock': '#4e342e',
  'country': '#8d6e63',
  'country rock': '#6d4c41',
  'americana': '#5d4037',
  'bluegrass': '#558b2f',
  'roots rock': '#827717',
  'singer-songwriter': '#827717',
  'acoustic': '#8bc34a',
  'celtic': '#2e7d32',
  'traditional folk': '#4e342e',
  'neofolk': '#37474f',
  'anti-folk': '#6d4c41',
  // Blues → indigo
  'blues': '#3f51b5',
  'delta blues': '#283593',
  'chicago blues': '#1a237e',
  'electric blues': '#303f9f',
  'blues rock': '#303f9f',
  // World → groen/teal
  'reggae': '#4caf50',
  'ska': '#66bb6a',
  'latin': '#26a69a',
  'afrobeat': '#00897b',
  'world music': '#009688',
  'flamenco': '#e53935',
  'salsa': '#e64a19',
  'cumbia': '#ff7043',
  'afropop': '#43a047',
  'tropicália': '#00897b',
  // Overig
  'experimental': '#607d8b',
  'lo-fi': '#a1887f',
  'new age': '#80cbc4',
  'gospel': '#f9a825',
  'spiritual': '#f9a825',
};

const DEFAULT_GENRE_COLOR = '#607d8b';

module.exports = { GENRE_STOPWORDS, GENRE_WHITELIST, GENRE_COLORS, DEFAULT_GENRE_COLOR };
