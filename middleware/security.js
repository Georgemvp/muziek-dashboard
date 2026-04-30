'use strict';

/**
 * Rate-limiting en API-key authenticatie middleware.
 * Exporteert registerSecurity(app) — aanroepen ná statische bestanden, vóór routes.
 */

const rateLimit = require('express-rate-limit');
const logger    = require('../logger');

const rateLimitHandler = (req, res) => {
  logger.warn({ ip: req.ip, path: req.path, method: req.method }, 'Rate limit exceeded');
  res.status(429).json({ error: 'Te veel verzoeken, probeer het over een minuut opnieuw', retryAfter: 60 });
};

/**
 * Monteert:
 * - Globale rate limiter (300 req/min)
 * - API rate limiter (120 req/min op /api/*)
 * - API-key authenticatie (als API_KEY env-var is ingesteld)
 *
 * @param {import('express').Application} app
 */
function registerSecurity(app) {
  logger.info({ window: '60s', maxRequests: 300 }, 'Global rate limiter configured');
  app.use(rateLimit({ windowMs: 60_000, max: 300, standardHeaders: true, legacyHeaders: false, handler: rateLimitHandler }));

  logger.info({ window: '60s', maxRequests: 120 }, 'API rate limiter configured');
  app.use('/api', rateLimit({ windowMs: 60_000, max: 120, standardHeaders: true, legacyHeaders: false, handler: rateLimitHandler }));

  // API-key check: vrije routes zijn /plex/webhook, /plex/thumb en /health
  const API_KEY = process.env.API_KEY || '';
  if (!API_KEY) {
    logger.warn('API_KEY niet ingesteld — API is onbeveiligd. Stel API_KEY in voor productie.');
  }
  app.use('/api', (req, res, next) => {
    if (req.path.startsWith('/plex/webhook') || req.path.startsWith('/plex/thumb') || req.path === '/health') return next();
    if (!API_KEY) return next();
    const provided = req.headers['x-api-key'] || req.query.api_key;
    if (!provided || provided !== API_KEY) return res.status(401).json({ error: 'Ontbrekende of ongeldige API-sleutel' });
    next();
  });
}

module.exports = { registerSecurity };
