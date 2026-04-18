// ── Spotify service ──────────────────────────────────────────────────────────
// Vereist: SPOTIFY_CLIENT_ID en SPOTIFY_CLIENT_SECRET in process.env
// Gebruikt Client Credentials flow (geen gebruikerslogin nodig).

const CLIENT_ID     = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const SPOTIFY_OK    = !!(CLIENT_ID && CLIENT_SECRET);

// ── Token cache ──────────────────────────────────────────────────────────────
let _token    = null;
let _tokenExp = 0; // Unix ms timestamp waarop het token verloopt

async function getToken() {
  // Ververs 5 minuten voor expiry
  if (_token && Date.now() < _tokenExp - 5 * 60 * 1000) return _token;

  const creds  = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  const res    = await fetch('https://accounts.spotify.com/api/token', {
    method:  'POST',
    headers: {
      Authorization:  `Basic ${creds}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body:   'grant_type=client_credentials',
    signal: AbortSignal.timeout(8_000)
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Spotify token fout ${res.status}: ${txt}`);
  }

  const data  = await res.json();
  _token      = data.access_token;
  _tokenExp   = Date.now() + data.expires_in * 1000;
  return _token;
}

async function spotifyGet(path, params = {}) {
  const token = await getToken();
  const url   = new URL(`https://api.spotify.com${path}`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    signal:  AbortSignal.timeout(8_000)
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Spotify API fout ${res.status} bij ${path}: ${txt.slice(0, 200)}`);
  }
  return res.json();
}

// ── Moods ─────────────────────────────────────────────────────────────────────
const MOODS = {
  energiek:      { target_energy: 0.8,  target_valence: 0.7, target_tempo: 130 },
  chill:         { target_energy: 0.3,  target_valence: 0.5, target_acousticness: 0.6 },
  melancholisch: { target_energy: 0.3,  target_valence: 0.2, target_acousticness: 0.5 },
  experimenteel: { target_popularity: 25, target_instrumentalness: 0.4 },
  feest:         { target_energy: 0.9,  target_danceability: 0.8, target_valence: 0.8 }
};

// ── searchArtistId ────────────────────────────────────────────────────────────
// Zoekt een artiest op naam en geeft zijn Spotify-ID terug, of null.
async function searchArtistId(name) {
  try {
    const data = await spotifyGet('/v1/search', {
      q:     name,
      type:  'artist',
      limit: 5
    });
    const artists = data.artists?.items || [];
    if (!artists.length) return null;
    // Exacte match op naam (case-insensitief) → anders de eerste
    const exact = artists.find(a => a.name.toLowerCase() === name.toLowerCase());
    return (exact || artists[0]).id;
  } catch {
    return null;
  }
}

// ── getRecommendations ────────────────────────────────────────────────────────
// Geeft aanbevolen tracks terug op basis van seed-artiest-IDs en audio-features.
// seedArtistIds: string[] (max 5)
// audioFeatures: { target_energy, target_valence, … }
async function getRecommendations(seedArtistIds, audioFeatures = {}) {
  const ids   = seedArtistIds.slice(0, 5);
  if (!ids.length) return [];

  const params = {
    seed_artists: ids.join(','),
    limit:        20,
    ...audioFeatures
  };

  const data = await spotifyGet('/v1/recommendations', params);
  return data.tracks || [];
}

// ── getTrackPreview ───────────────────────────────────────────────────────────
// Zoekt een track en geeft de preview_url terug (of null).
async function getTrackPreview(artistName, trackName) {
  try {
    const q    = `artist:${artistName} track:${trackName}`;
    const data = await spotifyGet('/v1/search', { q, type: 'track', limit: 3 });
    const hit  = (data.tracks?.items || []).find(t => t.preview_url) || null;
    return hit ? hit.preview_url : null;
  } catch {
    return null;
  }
}

module.exports = { SPOTIFY_OK, MOODS, searchArtistId, getRecommendations, getTrackPreview };
