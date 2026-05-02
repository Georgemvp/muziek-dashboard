// ── Startup validatie ─────────────────────────────────────────────────────────
const logger = require('./logger');

logger.info({
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
  port:     process.env.PORT || 80
}, '═══ LastFM App Starting ═══');

if (!process.env.LASTFM_API_KEY || !process.env.LASTFM_USER) {
  logger.fatal('LASTFM_API_KEY en LASTFM_USER zijn verplicht. Controleer je .env bestand.');
  process.exit(1);
}
logger.info('Required environment variables validated');

// ── Imports ───────────────────────────────────────────────────────────────────
const express    = require('express');
const compression = require('compression');
const path       = require('path');
const fs         = require('fs');

const { registerProxies }          = require('./middleware/proxy');
const { registerSecurity }         = require('./middleware/security');
const { runStartup }               = require('./middleware/startup');
const { requestLoggingMiddleware } = require('./logger');
const deps                         = require('./middleware/deps');

// ── App configuratie ──────────────────────────────────────────────────────────
const app  = express();
const PORT = process.env.PORT || 80;

app.use(compression());
registerProxies(app);
app.use((req, res, next) => { res.setHeader('X-Content-Type-Options', 'nosniff'); next(); });

app.use(express.static(path.join(__dirname, 'public'), {
  etag: true,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) { res.setHeader('Cache-Control', 'no-cache'); return; }
    if (filePath.includes(`${path.sep}chunks${path.sep}`)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); return;
    }
    if (/\.(?:css|js|mjs|png|jpg|jpeg|gif|webp|svg|ico|woff2?)$/i.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=86400');
    }
  }
}));
app.use(express.json({ limit: '100kb' }));
app.use(requestLoggingMiddleware);
registerSecurity(app);

// ── Route-registratie ─────────────────────────────────────────────────────────
// lastfm.js als eerste: geeft status-functies terug die misc.js (health) nodig heeft.
const lastfmFuncs    = require('./routes/lastfm')(app, deps);
deps.lastFmDown      = lastfmFuncs.lastFmDown;
deps.lastFmDownSince = lastfmFuncs.lastFmDownSince;

// Auto-discover overige routes (alfabetisch, lastfm.js overgeslagen).
// Alleen bestanden die een functie exporteren worden als route geladen
// (zodat helpers zoals routes/helpers.js worden overgeslagen).
fs.readdirSync(path.join(__dirname, 'routes'))
  .filter(f => f.endsWith('.js') && f !== 'lastfm.js')
  .forEach(f => {
    const mod = require(`./routes/${f}`);
    if (typeof mod === 'function') mod(app, deps);
  });

// ── Server start ──────────────────────────────────────────────────────────────
if (require.main === module) {
  const server = app.listen(PORT, () => {
    logger.info({ port: PORT, address: server.address() }, '✓ Express server listening');
  });

  // Koppel WebSocket server voor live log viewer op ws://<host>/logs
  require('./routes/logs').attachWebSocket(server);

  runStartup(server, deps);
}

module.exports = app;
