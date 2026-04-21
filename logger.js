'use strict';

const pino = require('pino');

/**
 * Gedeelde logger voor de hele applicatie.
 *
 * Ontwikkeling  (NODE_ENV ≠ 'production'):
 *   Gebruikt pino-pretty met kleuren en leesbare timestamps (HH:MM:ss).
 *
 * Productie (NODE_ENV = 'production'):
 *   Logt JSON-regels naar stdout — geschikt voor log-aggregatie
 *   (Docker log drivers, Loki, Splunk, e.d.).
 *
 * Log level wordt bepaald via de LOG_LEVEL omgevingsvariabele (default: 'info').
 */
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV !== 'production'
    ? {
        target: 'pino-pretty',
        options: {
          colorize:      true,
          translateTime: 'HH:MM:ss',
          ignore:        'pid,hostname'
        }
      }
    : undefined
});

module.exports = logger;
