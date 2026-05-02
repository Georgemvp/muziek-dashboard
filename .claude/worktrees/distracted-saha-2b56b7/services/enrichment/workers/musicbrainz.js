'use strict';
// ── MusicBrainz enrichment worker ─────────────────────────────────────────────
// API: https://musicbrainz.org/ws/2  — geen API key nodig
// Rate limit: strikt 1 req/sec (MusicBrainz-beleid)
// User-Agent: verplicht in formaat 'AppName/Version (contact@email)'
// Hergebruikt de rate-limit queue uit services/musicbrainz.js via mbzGet

const { mbzGet } = require('../../musicbrainz');

const MBZ_APP_UA = 'LastfmMuziekApp/2.0 (muziek-dashboard)';

// ── Fuzzy helper ──────────────────────────────────────────────────────────────
function _fuzzyScore(a, b) {
  a = (a || '').toLowerCase().trim();
  b = (b || '').toLowerCase().trim();
  if (a === b) return 1.0;
  if (a.length < 2 || b.length < 2) return 0.0;
  const bigrams = (s) => {
    const m = new Map();
    for (let i = 0; i < s.length - 1; i++) {
      const bg = s.slice(i, i + 2);
      m.set(bg, (m.get(bg) || 0) + 1);
    }
    return m;
  };
  const aMap = bigrams(a);
  const bMap = bigrams(b);
  let intersection = 0;
  for (const [bg, cnt] of aMap) {
    intersection += Math.min(cnt, bMap.get(bg) || 0);
  }
  const total = a.length + b.length - 2;
  return total > 0 ? (2 * intersection) / total : 0;
}

class MusicBrainzWorker {
  constructor(db, log) {
    this.db  = db;
    this.log = log.child ? log.child({ worker: 'musicbrainz' }) : log;
  }

  // ── Hoofdverwerker ────────────────────────────────────────────────────────

  async process(entity) {
    try {
      const type = entity.entity_type;
      let data;

      if (type === 'artist') {
        data = await this._processArtist(entity.entity_name);
      } else if (type === 'album') {
        data = await this._processAlbum(entity.entity_name);
      } else if (type === 'track') {
        data = await this._processTrack(entity.entity_name);
      } else {
        return { ok: false, error: `Onbekend entity_type: ${type}` };
      }

      if (!data) return { ok: false, error: 'Geen MBZ-resultaat gevonden' };
      return { ok: true, data };
    } catch (err) {
      this.log.warn({ err: err.message, entity: entity.entity_name }, 'MusicBrainz worker mislukt');
      return { ok: false, error: err.message };
    }
  }

  // ── Artiest ───────────────────────────────────────────────────────────────

  async _processArtist(name) {
    const q    = encodeURIComponent(`artist:"${name.replace(/"/g, '')}"`);;
    const data = await mbzGet(`/artist?query=${q}&limit=5&fmt=json`);
    const list = data.artists || [];
    if (!list.length) return null;

    const norm  = s => (s || '').toLowerCase().trim();
    const exact = list.find(a => norm(a.name) === norm(name));
    let best    = exact;
    if (!best) {
      best = list.reduce((b, a) => {
        const score = _fuzzyScore(a.name, name);
        return score > _fuzzyScore(b.name, name) ? a : b;
      }, list[0]);
    }
    if (!best) return null;

    return {
      mbid:           best.id,
      entity_type:    'artist',
      name:           best.name,
      sort_name:      best['sort-name'] || null,
      disambiguation: best.disambiguation || null,
      country:        best.country || null,
      area:           best.area?.name || null,
      type:           best.type || null,
      gender:         best.gender || null,
      begin_date:     best['life-span']?.begin || null,
      end_date:       best['life-span']?.end || null,
      ended:          best['life-span']?.ended || false,
      tags:           (best.tags || [])
                        .sort((a, b) => b.count - a.count)
                        .slice(0, 10)
                        .map(t => t.name),
      isni_list:      (best.isnis || []).slice(0, 3),
      source:         'musicbrainz',
      fetchedAt:      Date.now(),
    };
  }

  // ── Album (release-group) ─────────────────────────────────────────────────

  async _processAlbum(name) {
    const q    = encodeURIComponent(`releasegroup:"${name.replace(/"/g, '')}"`);
    const data = await mbzGet(`/release-group?query=${q}&limit=5&fmt=json`);
    const list = data['release-groups'] || [];
    if (!list.length) return null;

    const norm  = s => (s || '').toLowerCase().trim();
    const exact = list.find(rg => norm(rg.title) === norm(name));
    const best  = exact || list[0];
    if (!best) return null;

    return {
      mbid:           best.id,
      entity_type:    'release',
      title:          best.title,
      disambiguation: best.disambiguation || null,
      primary_type:   best['primary-type'] || null,
      secondary_types: (best['secondary-types'] || []),
      first_release_date: best['first-release-date'] || null,
      artist_credit:  (best['artist-credit'] || []).map(ac => ac.artist?.name).filter(Boolean),
      tags:           (best.tags || [])
                        .sort((a, b) => b.count - a.count)
                        .slice(0, 8)
                        .map(t => t.name),
      source:         'musicbrainz',
      fetchedAt:      Date.now(),
    };
  }

  // ── Track (recording) ─────────────────────────────────────────────────────

  async _processTrack(name) {
    const q    = encodeURIComponent(`recording:"${name.replace(/"/g, '')}"`);
    const data = await mbzGet(`/recording?query=${q}&limit=5&fmt=json`);
    const list = data.recordings || [];
    if (!list.length) return null;

    const norm  = s => (s || '').toLowerCase().trim();
    const exact = list.find(r => norm(r.title) === norm(name));
    const best  = exact || list[0];
    if (!best) return null;

    return {
      mbid:           best.id,
      entity_type:    'recording',
      title:          best.title,
      disambiguation: best.disambiguation || null,
      length:         best.length ?? null,
      artist_credit:  (best['artist-credit'] || []).map(ac => ac.artist?.name).filter(Boolean),
      isrcs:          (best.isrcs || []).slice(0, 3),
      tags:           (best.tags || [])
                        .sort((a, b) => b.count - a.count)
                        .slice(0, 8)
                        .map(t => t.name),
      releases:       (best.releases || []).slice(0, 3).map(r => ({
        mbid:  r.id,
        title: r.title,
        date:  r.date || null,
      })),
      source:         'musicbrainz',
      fetchedAt:      Date.now(),
    };
  }
}

module.exports = { MusicBrainzWorker };
