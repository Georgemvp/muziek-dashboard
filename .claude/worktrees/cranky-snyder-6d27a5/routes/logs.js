'use strict';

/**
 * routes/logs.js — Live log viewer endpoints + WebSocket server
 *
 * REST:
 *   GET /api/logs/recent?level=info&limit=100
 *
 * WebSocket:
 *   ws://<host>/logs   – Streamt live Pino log entries naar de browser
 */

const logStream = require('../services/logStream');

// ── REST routes ────────────────────────────────────────────────────────────
module.exports = function logsRoutes(app) {
  /**
   * GET /api/logs/recent
   * Query params:
   *   level  – minimaal log level (trace|debug|info|warn|error|fatal), default 'trace'
   *   limit  – max aantal entries (1–1000), default 100
   */
  app.get('/api/logs/recent', (req, res) => {
    const level = req.query.level || 'trace';
    const limit = Math.max(1, Math.min(parseInt(req.query.limit, 10) || 100, 1000));
    const entries = logStream.getRecent(level, limit);
    res.setHeader('Cache-Control', 'no-store');
    res.json({ entries, count: entries.length });
  });
};

// ── WebSocket server ───────────────────────────────────────────────────────

/**
 * Koppel een WebSocket server aan de bestaande HTTP server.
 * WebSocket verbindingen op pad '/logs' worden afgehandeld.
 *
 * @param {import('http').Server} httpServer
 */
module.exports.attachWebSocket = function attachWebSocket(httpServer) {
  const { WebSocketServer } = require('ws');
  const logger = require('../logger');

  const wss = new WebSocketServer({ noServer: true });

  // Intercept HTTP upgrade requests
  httpServer.on('upgrade', (request, socket, head) => {
    let pathname;
    try {
      pathname = new URL(request.url, `http://${request.headers.host || 'localhost'}`).pathname;
    } catch {
      pathname = request.url;
    }

    if (pathname !== '/logs') {
      // Niet ons pad — laat andere handlers het afhandelen
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  });

  wss.on('connection', (ws, req) => {
    const ip = req.socket?.remoteAddress || 'unknown';
    logger.debug({ ip }, 'Log viewer WebSocket client verbonden');

    logStream.addClient(ws);

    ws.on('close', () => {
      logStream.removeClient(ws);
      logger.debug({ ip }, 'Log viewer WebSocket client verbroken');
    });

    ws.on('error', (err) => {
      logStream.removeClient(ws);
      logger.debug({ err: err.message, ip }, 'Log viewer WebSocket fout');
    });

    // Client kan een level-filter insturen (toekomstige functie)
    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
        }
      } catch { /* negeer ongeldige berichten */ }
    });
  });

  logger.info('✓ Log viewer WebSocket server actief op ws://<host>/logs');
};
