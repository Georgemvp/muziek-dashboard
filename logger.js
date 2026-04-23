'use strict';

const pino = require('pino');
const { v4: uuidv4 } = require('crypto').randomUUID ?
  { v4: () => require('crypto').randomUUID() } :
  { v4: () => Math.random().toString(36).substr(2, 9) };

/**
 * Gedeelde logger voor de hele applicatie.
 *
 * Features:
 * - Request ID tracking voor distributed tracing
 * - Gestructureerde logs met context
 * - Pino-pretty in development (gekleurd, leesbaar)
 * - JSON logs in production (log-aggregatie ready)
 * - Log level configureerbaar via LOG_LEVEL env var
 *
 * Ontwikkeling  (NODE_ENV ≠ 'production'):
 *   Gebruikt pino-pretty met kleuren en leesbare timestamps (HH:MM:ss.mmm).
 *
 * Productie (NODE_ENV = 'production'):
 *   Logt JSON-regels naar stdout — geschikt voor log-aggregatie
 *   (Docker log drivers, Loki, Splunk, e.d.).
 */
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  base: {
    service: 'lastfm-app',
    environment: process.env.NODE_ENV || 'development'
  },
  timestamp: process.env.NODE_ENV !== 'production'
    ? pino.stdTimeFunctions.isoTime
    : pino.stdTimeFunctions.unixTime,
  transport: process.env.NODE_ENV !== 'production'
    ? {
        target: 'pino-pretty',
        options: {
          colorize:      true,
          translateTime: 'HH:MM:ss.mmm',
          ignore:        'pid,hostname',
          singleLine:    false,
          messageFormat: '[{levelLabel}] {msg}',
          hideObject:    false
        }
      }
    : undefined
});

/**
 * Child logger factory voor request-tracking.
 * Genereert een unieke request ID en bindt deze aan alle logs in die request.
 */
function getRequestLogger(req) {
  const requestId = req.id || req.headers['x-request-id'] || generateRequestId();
  return logger.child({
    requestId,
    method: req.method,
    path: req.path,
    userAgent: req.get('user-agent')
  });
}

/**
 * Genereer een korte, leesbare request ID.
 */
function generateRequestId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 5)}`.toUpperCase();
}

/**
 * Child logger voor service operations met context.
 */
function getServiceLogger(serviceName, context = {}) {
  return logger.child({
    service: serviceName,
    ...context
  });
}

/**
 * Middleware voor Express: voegt request ID toe en loggt requests.
 */
function requestLoggingMiddleware(req, res, next) {
  const SKIP_PATHS = ['/health', '/healthz'];
  const SKIP_PREFIXES = ['/tidarr-ui'];

  // Skip health checks en tidarr-ui proxy
  if (SKIP_PATHS.includes(req.path) || SKIP_PREFIXES.some(p => req.path.startsWith(p))) {
    return next();
  }

  const requestId = generateRequestId();
  req.id = requestId;
  req.logger = logger.child({
    requestId,
    method: req.method,
    path: req.path,
    query: Object.keys(req.query).length > 0 ? req.query : undefined
  });

  const t0 = Date.now();

  res.on('finish', () => {
    const ms = Date.now() - t0;
    const logLevel = res.statusCode >= 500 ? 'error'
                  : res.statusCode >= 400 ? 'warn'
                  : 'info';

    req.logger[logLevel]({
      statusCode: res.statusCode,
      contentLength: res.get('content-length'),
      durationMs: ms
    }, `${req.method} ${req.path}`);
  });

  next();
}

module.exports = logger;
module.exports.getRequestLogger = getRequestLogger;
module.exports.getServiceLogger = getServiceLogger;
module.exports.requestLoggingMiddleware = requestLoggingMiddleware;
module.exports.generateRequestId = generateRequestId;
