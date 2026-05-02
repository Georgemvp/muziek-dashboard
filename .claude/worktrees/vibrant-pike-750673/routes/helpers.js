// ── Route helpers ──────────────────────────────────────────────────────────────

/**
 * Stuur een gestandaardiseerde foutrespons: { ok: false, error: message }.
 * Gebruik dit in routes die het { ok, error } formaat hanteren (Tidarr, OrpheusDL).
 *
 * Plex-routes die { connected: false, reason } gebruiken worden hier voorlopig
 * NIET mee uitgerust — zie TODO-comments in routes/plex.js.
 *
 * @param {import('express').Response} res
 * @param {number} status  HTTP-statuscode
 * @param {string} message Foutomschrijving
 */
function sendError(res, status, message) {
  return res.status(status).json({ ok: false, error: message });
}

module.exports = { sendError };
