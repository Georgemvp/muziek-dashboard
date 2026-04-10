// ── MusicBrainz service (rate-limited: 1 req/1.25s) ─────────────────────────
const { getCache, setCache } = require('../db');

const MBZ_BASE = 'https://musicbrainz.org/ws/2';
const MBZ_UA   = 'LastfmPlexDiscovery/2.0 (muziek-ontdekkingen)';

let mbzChain       = Promise.resolve();
let mbzLastCall    = 0;

/** Zet een MBZ-aanroep in de wachtrij zodat de rate-limit wordt gerespecteerd. */
function mbzEnqueue(fn) {
  const p = mbzChain.then(async () => {
    const wait = Math.max(0, 1250 - (Date.now() - mbzLastCall));
    if (wait > 0) await new Promise(r => setTimeout(r, wait));
    mbzLastCall = Date.now();
    return fn();
  });
  mbzChain = p.catch(() => {});
  return p;
}

/**
 * Doe een MBZ-aanroep. Controleert eerst SQLite-cache (24u TTL).
 * Slaat resultaat op na succesvolle aanroep.
 */
async function mbzGet(urlPath) {
  const cacheKey = 'mbz:' + urlPath;
  const cached   = getCache(cacheKey, 86_400_000);
  if (cached) return cached;

  return mbzEnqueue(async () => {
    const res = await fetch(`${MBZ_BASE}${urlPath}`, {
      headers: { 'User-Agent': MBZ_UA, 'Accept': 'application/json' },
      signal: AbortSignal.timeout(12_000)
    });
    if (!res.ok) throw new Error(`MBZ ${res.status} — ${urlPath}`);
    const data = await res.json();
    setCache(cacheKey, data);
    return data;
  });
}

/** Zoek een artiest op bij MusicBrainz en geef metagegevens terug. */
async function getMBZArtist(name) {
  const q    = encodeURIComponent(`artist:"${name.replace(/"/g, '')}"`);
  const data = await mbzGet(`/artist?query=${q}&limit=4&fmt=json`);
  const list  = data.artists || [];
  const exact = list.find(a => a.name.toLowerCase() === name.toLowerCase());
  const best  = exact || list[0];
  if (!best) return null;
  return {
    mbid:           best.id,
    name:           best.name,
    country:        best.country || null,
    startYear:      best['life-span']?.begin?.slice(0, 4) || null,
    tags:           (best.tags || []).sort((a, b) => b.count - a.count).slice(0, 6).map(t => t.name),
    disambiguation: best.disambiguation || null
  };
}

/** Haal studio-albums op voor een artiest-MBID. */
async function getMBZAlbums(mbid) {
  if (!mbid) return [];
  const data = await mbzGet(`/release-group?artist=${mbid}&type=album&limit=25&fmt=json`);
  return (data['release-groups'] || [])
    .filter(rg => rg['primary-type'] === 'Album')
    .map(rg => ({
      mbid:     rg.id,
      title:    rg.title,
      year:     rg['first-release-date']?.slice(0, 4) || null,
      coverUrl: `https://coverartarchive.org/release-group/${rg.id}/front-250`
    }))
    .sort((a, b) => (parseInt(b.year) || 0) - (parseInt(a.year) || 0));
}

module.exports = { mbzGet, getMBZArtist, getMBZAlbums };
