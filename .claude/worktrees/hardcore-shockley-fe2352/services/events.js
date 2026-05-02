// ── Centrale event bus ────────────────────────────────────────────────────────
// Gedeelde EventEmitter voor cross-service communicatie.
// Emit events: download:start, download:complete, download:failed, download:retry
'use strict';

const EventEmitter = require('events');

const bus = new EventEmitter();
bus.setMaxListeners(50);

module.exports = bus;
