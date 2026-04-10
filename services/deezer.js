// ── Deezer service ───────────────────────────────────────────────────────────

/** Haal een artiestfoto op via de Deezer API. Geeft null terug bij mislukking. */
async function getDeezerImage(name) {
  try {
    const data = await fetch(
      `https://api.deezer.com/search/artist?q=${encodeURIComponent(name)}&limit=3`,
      { signal: AbortSignal.timeout(5_000) }
    ).then(r => r.json());
    const results = data?.data || [];
    const exact   = results.find(a => a.name.toLowerCase() === name.toLowerCase());
    const best    = exact || results[0];
    if (best?.picture_medium && !best.picture_medium.includes('/artist//')) return best.picture_medium;
  } catch { /* stilletjes mislukken */ }
  return null;
}

module.exports = { getDeezerImage };
