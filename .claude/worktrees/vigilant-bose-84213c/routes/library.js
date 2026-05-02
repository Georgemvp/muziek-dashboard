'use strict';
// ── Enhanced Library Manager Routes ──────────────────────────────────────────
// Endpoints voor de Enhanced Library Manager:
//   GET  /api/library/artists              – Alle artiesten + enrichment coverage
//   GET  /api/library/artist/:name         – Artiest detail + per-bron data
//   GET  /api/library/artist/:name/albums  – Albums met per-bron metadata
//   GET  /api/library/album/:id/tracks     – Tracks van een album
//   POST /api/library/artist/:name/edit    – Handmatige override opslaan
//   POST /api/library/album/:id/edit       – Album metadata opslaan
//   POST /api/library/track/:id/edit       – Track metadata opslaan
//   POST /api/library/track/:id/retag      – Tags schrijven naar Plex
//   POST /api/library/album/:id/retag      – Album tags schrijven naar Plex
//   GET  /api/library/tag-preview/:id      – Diff huidig vs. voorgesteld
//   GET  /api/library/settings             – Multi-artist instellingen ophalen
//   POST /api/library/settings             – Multi-artist instellingen opslaan

const logger = require('../logger');
const db     = require('../db');

const KNOWN_SOURCES = [
  'lastfm', 'musicbrainz', 'spotify', 'deezer',
  'audiodb', 'discogs', 'itunes', 'tidal', 'qobuz', 'genius',
];
const SOURCE_LABELS = {
  lastfm:      'Last.fm',
  musicbrainz: 'MusicBrainz',
  spotify:     'Spotify',
  deezer:      'Deezer',
  audiodb:     'AudioDB',
  discogs:     'Discogs',
  itunes:      'iTunes',
  tidal:       'Tidal',
  qobuz:       'Qobuz',
  genius:      'Genius',
};

module.exports = function(app, deps) {
  const {
    getPlexLibrary, getPlexArtistNames,
    plexGet, plexPut,
    getAlbumTracks,
  } = deps;

  // ── GET /api/library/artists ───────────────────────────────────────────────
  // Geeft alle Plex-artiesten terug met enrichment coverage % en genre-tags.
  app.get('/api/library/artists', (req, res) => {
    try {
      const artistMap = getPlexArtistNames(); // Map<lowercase, origineel>
      const library   = getPlexLibrary();     // [{artist, album, ratingKey, thumb, addedAt}]

      // ── Bulk enrichment coverage (één SQL-query) ──────────────────────────
      const rawDb = db.getDb();
      const coverageRows = rawDb.prepare(`
        SELECT lower(entity_name) AS nl, COUNT(DISTINCT source) AS cnt
        FROM   enrichment_data
        WHERE  entity_type = 'artist'
        GROUP  BY lower(entity_name)
      `).all();
      const coverageMap = new Map(coverageRows.map(r => [r.nl, r.cnt]));

      // ── Genres bulk (lastfm > deezer > musicbrainz) ───────────────────────
      const genreRows = rawDb.prepare(`
        SELECT lower(entity_name) AS nl, source, data_json
        FROM   enrichment_data
        WHERE  entity_type = 'artist' AND source IN ('lastfm','deezer','musicbrainz')
      `).all();
      const genreMap = new Map();
      for (const prio of ['lastfm', 'deezer', 'musicbrainz']) {
        for (const row of genreRows) {
          if (row.source !== prio || genreMap.has(row.nl)) continue;
          try {
            const d = JSON.parse(row.data_json);
            const raw = Array.isArray(d.genres) ? d.genres
              : Array.isArray(d.tags) ? d.tags
              : [];
            const genres = raw
              .map(t => (typeof t === 'string' ? t : t.name || t.tag || ''))
              .filter(Boolean);
            if (genres.length) genreMap.set(row.nl, genres.slice(0, 4));
          } catch {}
        }
      }

      // ── Album count + thumbnail per artiest ───────────────────────────────
      const albumMap = new Map();
      for (const entry of library) {
        const key = entry.artist.toLowerCase();
        if (!albumMap.has(key)) albumMap.set(key, { count: 0, thumb: null });
        const x = albumMap.get(key);
        x.count++;
        if (!x.thumb && entry.thumb) x.thumb = entry.thumb;
      }

      // ── Bouw resultatenlijst ──────────────────────────────────────────────
      const artists = [];
      for (const [lower, original] of artistMap) {
        const info = albumMap.get(lower) || { count: 0, thumb: null };
        artists.push({
          name:               original,
          albumCount:         info.count,
          genres:             genreMap.get(lower) || [],
          enrichmentCoverage: coverageMap.get(lower) || 0,
          enrichmentTotal:    KNOWN_SOURCES.length,
          thumb:              info.thumb,
        });
      }
      artists.sort((a, b) => a.name.localeCompare(b.name, 'nl', { sensitivity: 'base' }));

      res.set('Cache-Control', 'private, max-age=60');
      res.json({ artists, sources: KNOWN_SOURCES, sourceLabels: SOURCE_LABELS });
    } catch (err) {
      logger.error({ err: err.message }, '/api/library/artists fout');
      res.status(500).json({ error: err.message });
    }
  });

  // ── GET /api/library/artist/:name ─────────────────────────────────────────
  app.get('/api/library/artist/:name', (req, res) => {
    try {
      const name    = decodeURIComponent(req.params.name);
      const library = getPlexLibrary();
      const albums  = library
        .filter(e => e.artist.toLowerCase() === name.toLowerCase())
        .map(e => ({ album: e.album, ratingKey: e.ratingKey, thumb: e.thumb, addedAt: e.addedAt }));
      const enrichmentData = db.getEnrichmentData('artist', name);

      res.set('Cache-Control', 'private, max-age=60');
      res.json({ name, albums, enrichmentData, sources: KNOWN_SOURCES, sourceLabels: SOURCE_LABELS });
    } catch (err) {
      logger.error({ err: err.message, name: req.params.name }, 'Artist detail fout');
      res.status(500).json({ error: err.message });
    }
  });

  // ── GET /api/library/artist/:name/albums ──────────────────────────────────
  app.get('/api/library/artist/:name/albums', (req, res) => {
    try {
      const name    = decodeURIComponent(req.params.name);
      const library = getPlexLibrary();
      const albums  = library
        .filter(e => e.artist.toLowerCase() === name.toLowerCase())
        .map(e => ({
          ...e,
          enrichmentData: db.getEnrichmentData('album', `${e.artist}||${e.album}`),
        }));

      res.set('Cache-Control', 'private, max-age=60');
      res.json({ albums, sources: KNOWN_SOURCES, sourceLabels: SOURCE_LABELS });
    } catch (err) {
      logger.error({ err: err.message, name: req.params.name }, 'Artist albums fout');
      res.status(500).json({ error: err.message });
    }
  });

  // ── GET /api/library/album/:id/tracks ─────────────────────────────────────
  app.get('/api/library/album/:id/tracks', async (req, res) => {
    try {
      const tracks = await getAlbumTracks(req.params.id);
      res.set('Cache-Control', 'private, max-age=300');
      res.json({ tracks });
    } catch (err) {
      logger.error({ err: err.message, id: req.params.id }, 'Album tracks fout');
      res.status(500).json({ error: err.message });
    }
  });

  // ── POST /api/library/artist/:name/edit ───────────────────────────────────
  // Sla handmatige override op als 'manual' enrichment-bron.
  app.post('/api/library/artist/:name/edit', (req, res) => {
    try {
      const name     = decodeURIComponent(req.params.name);
      const existing = db.getEnrichmentDataBySource('artist', name, 'manual') || {};
      const updated  = { ...existing, ...req.body, _updatedAt: Date.now() };
      db.saveEnrichmentData('artist', name, 'manual', updated);
      logger.info({ name }, 'Artiest handmatig bijgewerkt');
      res.json({ ok: true, data: updated });
    } catch (err) {
      logger.error({ err: err.message, name: req.params.name }, 'Artist edit fout');
      res.status(500).json({ error: err.message });
    }
  });

  // ── POST /api/library/album/:id/edit ──────────────────────────────────────
  app.post('/api/library/album/:id/edit', (req, res) => {
    try {
      const { artistName, albumName, ...fields } = req.body || {};
      const key      = artistName && albumName ? `${artistName}||${albumName}` : req.params.id;
      const existing = db.getEnrichmentDataBySource('album', key, 'manual') || {};
      const updated  = { ...existing, ...fields, _updatedAt: Date.now() };
      db.saveEnrichmentData('album', key, 'manual', updated);
      res.json({ ok: true, data: updated });
    } catch (err) {
      logger.error({ err: err.message, id: req.params.id }, 'Album edit fout');
      res.status(500).json({ error: err.message });
    }
  });

  // ── POST /api/library/track/:id/edit ──────────────────────────────────────
  app.post('/api/library/track/:id/edit', (req, res) => {
    try {
      const ratingKey = req.params.id;
      const existing  = db.getEnrichmentDataBySource('track', ratingKey, 'manual') || {};
      const updated   = { ...existing, ...req.body, _updatedAt: Date.now() };
      db.saveEnrichmentData('track', ratingKey, 'manual', updated);
      res.json({ ok: true, data: updated });
    } catch (err) {
      logger.error({ err: err.message, id: req.params.id }, 'Track edit fout');
      res.status(500).json({ error: err.message });
    }
  });

  // ── GET /api/library/tag-preview/:id ──────────────────────────────────────
  // Haal diff op tussen huidige Plex-metadata en beste enrichment-bron.
  app.get('/api/library/tag-preview/:id', async (req, res) => {
    try {
      const ratingKey = req.params.id;

      const plexData = await plexGet(`/library/metadata/${ratingKey}`);
      const meta     = plexData?.MediaContainer?.Metadata?.[0];
      if (!meta) return res.status(404).json({ error: 'Niet gevonden in Plex' });

      const current = {
        title:         meta.title          || '',
        originalTitle: meta.originalTitle  || '',
        year:          meta.year           || '',
        studio:        meta.studio         || '',
        summary:       meta.summary        || '',
        genres:        (meta.Genre || []).map(g => g.tag || g).filter(Boolean).join(', '),
        rating:        meta.rating         || '',
        contentRating: meta.contentRating  || '',
      };

      // Zoek beste enrichment-bron voor deze artiest
      const artistName = meta.grandparentTitle || meta.parentTitle || '';
      const enrichment = artistName ? db.getEnrichmentData('artist', artistName) : {};

      let proposed = { ...current };
      let proposedSource = null;
      for (const src of ['musicbrainz', 'discogs', 'itunes', 'audiodb', 'lastfm', 'deezer']) {
        const d = enrichment[src];
        if (!d) continue;
        proposedSource = src;
        if (d.genres?.length)  proposed.genres  = (Array.isArray(d.genres) ? d.genres : [d.genres]).join(', ');
        if (d.summary)         proposed.summary = d.summary;
        if (d.biography)       proposed.summary = proposed.summary || d.biography;
        if (d.year || d.formed) proposed.year   = proposed.year   || d.year || d.formed;
        if (d.studio || d.label) proposed.studio = proposed.studio || d.studio || d.label;
        break;
      }

      const FIELD_LABELS = {
        title:         'Titel',
        originalTitle: 'Originele Titel',
        year:          'Jaar',
        studio:        'Label/Studio',
        summary:       'Beschrijving',
        genres:        'Genres',
        rating:        'Beoordeling',
        contentRating: 'Inhoudsbeoordeling',
      };

      const diff = Object.entries(FIELD_LABELS).map(([field, label]) => ({
        field,
        label,
        current:  String(current[field]  || ''),
        proposed: String(proposed[field] || ''),
        changed:  String(current[field] || '') !== String(proposed[field] || ''),
      }));

      res.set('Cache-Control', 'private, no-cache');
      res.json({ ratingKey, current, proposed, diff, proposedSource });
    } catch (err) {
      logger.error({ err: err.message, id: req.params.id }, 'Tag preview fout');
      res.status(500).json({ error: err.message });
    }
  });

  // ── POST /api/library/track/:id/retag ─────────────────────────────────────
  // Schrijf metadata-velden naar Plex voor een track (type=10).
  app.post('/api/library/track/:id/retag', async (req, res) => {
    try {
      const ratingKey = req.params.id;
      const fields    = req.body?.fields || req.body || {};
      const params    = _buildPlexParams('10', ratingKey, fields);
      if (!params) return res.status(400).json({ error: 'Geen velden om te schrijven' });
      await plexPut(`/library/metadata/${ratingKey}?${params}`);
      logger.info({ ratingKey, fields: Object.keys(fields) }, 'Track tags geschreven');
      res.json({ ok: true, ratingKey });
    } catch (err) {
      logger.error({ err: err.message, id: req.params.id }, 'Track retag fout');
      res.status(500).json({ error: err.message });
    }
  });

  // ── POST /api/library/album/:id/retag ─────────────────────────────────────
  app.post('/api/library/album/:id/retag', async (req, res) => {
    try {
      const ratingKey = req.params.id;
      const fields    = req.body?.fields || req.body || {};
      const params    = _buildPlexParams('9', ratingKey, fields);
      if (!params) return res.status(400).json({ error: 'Geen velden om te schrijven' });
      await plexPut(`/library/metadata/${ratingKey}?${params}`);
      logger.info({ ratingKey, fields: Object.keys(fields) }, 'Album tags geschreven');
      res.json({ ok: true, ratingKey });
    } catch (err) {
      logger.error({ err: err.message, id: req.params.id }, 'Album retag fout');
      res.status(500).json({ error: err.message });
    }
  });

  // ── GET /api/library/settings ─────────────────────────────────────────────
  app.get('/api/library/settings', (req, res) => {
    res.set('Cache-Control', 'private, max-age=300');
    res.json({
      artist_separator: db.getSetting('library', 'artist_separator') || ', ',
      feat_to_title:    db.getSetting('library', 'feat_to_title') === 'true',
    });
  });

  // ── POST /api/library/settings ────────────────────────────────────────────
  app.post('/api/library/settings', (req, res) => {
    try {
      const { artist_separator, feat_to_title } = req.body || {};
      if (artist_separator !== undefined) db.setSetting('library', 'artist_separator', artist_separator);
      if (feat_to_title    !== undefined) db.setSetting('library', 'feat_to_title',    String(feat_to_title));
      res.json({ ok: true });
    } catch (err) {
      logger.error({ err: err.message }, 'Library settings opslaan fout');
      res.status(500).json({ error: err.message });
    }
  });

  logger.info('Library Manager routes geladen (/api/library/*)');
};

// ── Helper: bouw URLSearchParams voor Plex metadata PUT ───────────────────────
function _buildPlexParams(type, ratingKey, fields) {
  const p = new URLSearchParams({ type, id: ratingKey });
  const WRITABLE = ['title', 'originalTitle', 'year', 'studio', 'summary', 'rating', 'contentRating'];
  let hasChanges = false;

  for (const key of WRITABLE) {
    if (fields[key] !== undefined && fields[key] !== null) {
      p.set(`${key}.value`, fields[key]);
      p.set(`${key}.locked`, '1');
      hasChanges = true;
    }
  }

  if (fields.genres) {
    const genres = Array.isArray(fields.genres)
      ? fields.genres
      : String(fields.genres).split(',').map(g => g.trim()).filter(Boolean);
    genres.forEach((g, i) => p.set(`genre[${i}].tag.tag`, g));
    hasChanges = true;
  }

  return hasChanges ? p.toString() : null;
}
