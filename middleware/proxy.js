'use strict';

/**
 * Proxy-middleware voor embedded UI's: Tidarr, MediaSage en AudioMuse.
 * Exporteert registerProxies(app) — aanroepen vóór statische bestanden en routes.
 */

const { createProxyMiddleware, responseInterceptor } = require('http-proxy-middleware');
const logger    = require('../logger');
const { escapeHtml } = require('./helpers');

// ── Service base URLs ─────────────────────────────────────────────────────────
const TIDARR_BASE    = (process.env.TIDARR_URL    || 'http://tidarr:8484').replace(/\/$/, '');
const MEDIASAGE_BASE = (process.env.MEDIASAGE_URL || 'http://localhost:5765').replace(/\/$/, '');
const AUDIOMUSE_BASE = (process.env.AUDIOMUSE_URL || 'http://localhost:8000').replace(/\/$/, '');
const CORE_BASE      = (process.env.CORE_URL      || 'http://localhost:5001').replace(/\/$/, '');

/**
 * Maakt een gestandaardiseerde proxy-foutafhandelaar.
 * Logt de fout en stuurt een 502-foutpagina terug met de servicenaam.
 *
 * @param {string} serviceName   - Weergavenaam voor logs en HTML (bv. 'Tidarr')
 * @param {string} targetBase    - Base URL van de service (voor logging)
 * @returns {Function}           - (err, req, res) => void
 */
function createProxyErrorHandler(serviceName, targetBase) {
  return (err, req, res) => {
    logger.error({
      err:    err.message,
      code:   err.code,
      target: targetBase,
      path:   req.path
    }, `${serviceName} proxy error`);

    res.status(502).send(`
      <div style="font-family:sans-serif;padding:40px;color:#ccc;background:#1a1a2e;height:100vh;box-sizing:border-box">
        <h2>⚠️ ${escapeHtml(serviceName)} niet bereikbaar</h2>
        <p>${escapeHtml(serviceName)} is nog niet opgestart of er is een fout opgetreden.</p>
        <p style="color:#888;font-size:13px">Fout: ${escapeHtml(err.message)}</p>
        <button onclick="location.reload()" style="margin-top:16px;padding:8px 20px;background:#4a9eff;color:#fff;border:none;border-radius:6px;cursor:pointer">↻ Opnieuw proberen</button>
      </div>
    `);
  };
}

// ── Proxy-instanties ──────────────────────────────────────────────────────────

/** Tidarr: /tidarr-ui/* → TIDARR_BASE */
function mountTidarr(app) {
  app.use('/tidarr-ui', createProxyMiddleware({
    target:      TIDARR_BASE,
    changeOrigin: true,
    pathRewrite: { '^/tidarr-ui': '' },
    on: {
      proxyRes: (proxyRes) => {
        delete proxyRes.headers['x-frame-options'];
        delete proxyRes.headers['content-security-policy'];
        delete proxyRes.headers['x-content-type-options'];
      },
      error: createProxyErrorHandler('Tidarr', TIDARR_BASE)
    }
  }));
}

/** MediaSage: /mediasage/* → MEDIASAGE_BASE */
function mountMediaSage(app) {
  // SSE-endpoints: direct doorsturen zonder responseInterceptor-buffering
  const sseProxy = createProxyMiddleware({
    target:      MEDIASAGE_BASE,
    changeOrigin: true,
  });
  app.use('/mediasage', (req, res, next) => {
    if (req.path === '/api/generate/stream' || req.path === '/api/recommend/generate') {
      return sseProxy(req, res, next);
    }
    next();
  });

  // Alle overige /mediasage-verzoeken: herschrijf absolute paden in HTML
  app.use('/mediasage', createProxyMiddleware({
    target:             MEDIASAGE_BASE,
    changeOrigin:       true,
    pathRewrite:        { '^/mediasage': '' },
    selfHandleResponse: true,
    on: {
      proxyRes: responseInterceptor(async (buffer, proxyRes) => {
        delete proxyRes.headers['x-frame-options'];
        delete proxyRes.headers['content-security-policy'];
        delete proxyRes.headers['x-content-type-options'];

        const ct = proxyRes.headers['content-type'] || '';
        if (ct.includes('text/html')) {
          return buffer.toString('utf8')
            .replace(/(['"\s(])\/static\//g, '$1/mediasage/static/');
        }
        return buffer;
      }),
      error: createProxyErrorHandler('MediaSage', MEDIASAGE_BASE)
    }
  }));
}

/** AudioMuse: /audiomuse/* → AUDIOMUSE_BASE */
function mountAudioMuse(app) {
  // SSE/streaming-endpoints: direct doorsturen zonder buffering
  const sseProxy = createProxyMiddleware({
    target:      AUDIOMUSE_BASE,
    changeOrigin: true,
  });
  app.use('/audiomuse', (req, res, next) => {
    if (req.path.startsWith('/api/') && req.headers.accept === 'text/event-stream') {
      return sseProxy(req, res, next);
    }
    next();
  });

  // Alle overige /audiomuse-verzoeken: herschrijf absolute paden in HTML/JSON
  app.use('/audiomuse', createProxyMiddleware({
    target:             AUDIOMUSE_BASE,
    changeOrigin:       true,
    pathRewrite:        { '^/audiomuse': '' },
    ws:                 true,
    selfHandleResponse: true,
    on: {
      proxyRes: responseInterceptor(async (buffer, proxyRes, req, res) => {
        // Herschrijf redirect Location headers
        if (proxyRes.headers.location) {
          const loc = proxyRes.headers.location;
          if (loc.startsWith('/') && !loc.startsWith('/audiomuse')) {
            const newLoc = '/audiomuse' + loc;
            proxyRes.headers.location = newLoc;
            res.setHeader('location', newLoc);
          }
        }

        delete proxyRes.headers['x-frame-options'];
        delete proxyRes.headers['content-security-policy'];
        delete proxyRes.headers['x-content-type-options'];

        const ct = proxyRes.headers['content-type'] || '';

        if (ct.includes('text/html')) {
          return buffer.toString('utf8')
            .replace(/action="\/(?!audiomuse\/)/g,       'action="/audiomuse/')
            .replace(/href="\/(?!audiomuse\/)/g,         'href="/audiomuse/')
            .replace(/(["'\s(])\/(?!audiomuse\/)static\//g, '$1/audiomuse/static/')
            .replace(/(["'])\/(?!audiomuse\/)api\//g,    '$1/audiomuse/api/')
            .replace(/url=\/(?!audiomuse\/)/g,           'url=/audiomuse/');
        }

        if (ct.includes('application/json')) {
          const text = buffer.toString('utf8');
          if (text.includes('"redirect"') || text.includes('"url"')) {
            return text.replace(/"(redirect|url)":\s*"\/((?!audiomuse\/)[^"]*)"/g,
              '"$1": "/audiomuse/$2"');
          }
        }

        return buffer;
      }),
      error: createProxyErrorHandler('AudioMuse', AUDIOMUSE_BASE)
    }
  }));
}

/** Core Flask backend: /api/core/* → CORE_BASE */
function mountCore(app) {
  app.use('/api/core', createProxyMiddleware({
    target:      CORE_BASE,
    changeOrigin: true,
    on: {
      error: createProxyErrorHandler('Core', CORE_BASE)
    }
  }));
}

/**
 * Registreert alle proxy-middleware op de Express-app.
 * Aanroepen vóór statische bestanden en API-routes.
 *
 * @param {import('express').Application} app
 */
function registerProxies(app) {
  logger.info({ tidarrUrl: TIDARR_BASE },    'Tidarr proxy configured');
  logger.info({ mediasageUrl: MEDIASAGE_BASE }, 'MediaSage proxy configured');
  logger.info({ audiomuseUrl: AUDIOMUSE_BASE }, 'AudioMuse proxy configured');
  logger.info({ coreUrl: CORE_BASE },          'Core proxy configured');

  mountTidarr(app);
  mountMediaSage(app);
  mountAudioMuse(app);
  mountCore(app);
}

module.exports = { registerProxies };
