'use strict';

/**
 * Startup- en shutdownlogica: initialiseert achtergrondservices en
 * registreert graceful-shutdown- en exception-handlers.
 *
 * Gebruik in server.js (alleen als require.main === module):
 *   const { runStartup } = require('./middleware/startup');
 *   runStartup(server, deps);
 */

const logger = require('../logger');

/**
 * Initialiseert Plex + discovery services in parallel en start de
 * achtergrond-sync. Registreert ook SIGTERM/SIGINT en uncaught-exception
 * handlers voor graceful shutdown.
 *
 * @param {import('http').Server} server   - De luisterende HTTP-server
 * @param {object}                deps     - Gedeeld dependency-object
 */
function runStartup(server, deps) {
  const { syncPlexLibrary, initDiscover, initGaps, initReleases, automationService } = deps;

  // Automation Engine initialiseren (vóór alles, want het registreert alleen DB + listeners)
  try {
    automationService.init(deps);
  } catch (err) {
    logger.error({ err: err.message }, '⚠ Automation Engine initialisatie mislukt');
  }

  // Enrichment Manager initialiseren
  try {
    const enrichmentManager = require('../services/enrichment/manager');
    enrichmentManager.init(deps);
    logger.info('✓ Enrichment Manager geïnitialiseerd');
  } catch (err) {
    logger.error({ err: err.message }, '⚠ Enrichment Manager initialisatie mislukt');
  }

  logger.info('🔄 Initializing Plex library and discovery services in parallel...');
  Promise.allSettled([syncPlexLibrary(true), initDiscover(), initGaps(), initReleases()])
    .then(([plexResult, discoverResult, gapsResult, releasesResult]) => {
      if (plexResult.status === 'fulfilled') {
        logger.info({ status: 'ready' }, '✓ Plex library initialized');
      } else {
        logger.warn({ err: plexResult.reason, message: plexResult.reason?.message },
          '⚠ Plex library initialization failed (will retry on first request)');
      }

      const failed = [
        discoverResult.status === 'rejected' && 'Discover',
        gapsResult.status     === 'rejected' && 'Gaps',
        releasesResult.status === 'rejected' && 'Releases',
      ].filter(Boolean);

      if (failed.length) {
        logger.warn({ services: failed }, `⚠ ${failed.join(', ')} service(s) initialization failed`);
      } else {
        logger.info('✓ All discovery services initialized');
      }
      logger.info('✓ All initialization tasks completed - app fully operational');
    });

  // Achtergrond-sync Plex elke 30 minuten
  logger.debug('Starting background Plex sync (every 30 minutes)');
  setInterval(() => {
    logger.debug('🔄 Running background Plex sync...');
    syncPlexLibrary(true)
      .then(() => logger.debug('✓ Background Plex sync completed'))
      .catch(e => logger.warn({ err: e, message: e.message }, '⚠ Background Plex sync failed'));
  }, 30 * 60 * 1_000);

  // Graceful shutdown
  const graceful = (sig) => () => {
    logger.warn(`${sig} received - gracefully shutting down`);
    server.close(() => { logger.info('Server closed'); process.exit(0); });
  };
  process.on('SIGTERM', graceful('SIGTERM'));
  process.on('SIGINT',  graceful('SIGINT'));

  process.on('uncaughtException', (err) => {
    logger.fatal({ err, message: err.message, stack: err.stack }, '💥 Uncaught exception - crashing');
    process.exit(1);
  });
  process.on('unhandledRejection', (reason, promise) => {
    logger.error({ reason, promise }, '💥 Unhandled rejection');
  });
}

module.exports = { runStartup };
