'use strict';

/**
 * logStream.js — Live log ring buffer + WebSocket broadcast
 *
 * Pino schrijft JSON-regels naar de destination stream die hier wordt aangemaakt.
 * Elke regel wordt geparsed, in een ring buffer (max 1000 entries) opgeslagen,
 * en naar alle verbonden WebSocket clients gebroadcast.
 *
 * API:
 *   createPinoStream()  – Writable stream voor Pino als destination
 *   addClient(ws)       – Voeg WS-client toe; stuurt 100 recente entries
 *   removeClient(ws)    – Verwijder WS-client
 *   getRecent(lvl, n)   – Haal laatste N entries op (optioneel gefilterd op level)
 */

const { Writable } = require('stream');

// ── Pino level mappings ────────────────────────────────────────────────────
const LEVEL_NUMS = {
  trace: 10, debug: 20, info: 30, warn: 40, error: 50, fatal: 60,
};

const LEVEL_NAMES = {
  10: 'TRACE', 20: 'DEBUG', 30: 'INFO', 40: 'WARN', 50: 'ERROR', 60: 'FATAL',
};

const MAX_BUFFER = 1000;

// ── Ring buffer + WS client set ────────────────────────────────────────────
const _buffer  = [];
const _clients = new Set();

// ── Internal helpers ───────────────────────────────────────────────────────

function _addEntry(entry) {
  _buffer.push(entry);
  if (_buffer.length > MAX_BUFFER) _buffer.shift();
  _broadcast(entry);
}

function _broadcast(entry) {
  if (_clients.size === 0) return;
  const json = JSON.stringify(entry);
  for (const ws of _clients) {
    if (ws.readyState === 1 /* OPEN */) {
      try { ws.send(json); } catch { /* ignore closed sockets */ }
    }
  }
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Voeg een WebSocket-client toe.
 * Stuurt direct de laatste 100 gebufferde entries als bulk-bericht.
 * @param {import('ws').WebSocket} ws
 */
function addClient(ws) {
  _clients.add(ws);
  const recent = _buffer.slice(-100);
  if (recent.length > 0) {
    try {
      ws.send(JSON.stringify({ _bulk: true, entries: recent }));
    } catch { /* ignore */ }
  }
}

/**
 * Verwijder een WebSocket-client.
 * @param {import('ws').WebSocket} ws
 */
function removeClient(ws) {
  _clients.delete(ws);
}

/**
 * Geef de laatste N log entries terug, optioneel gefilterd op minimaal level.
 * @param {string} level - 'trace'|'debug'|'info'|'warn'|'error'|'fatal'|'all'
 * @param {number} limit - Max aantal entries (max 1000)
 * @returns {object[]}
 */
function getRecent(level = 'trace', limit = 100) {
  const minNum = LEVEL_NUMS[level] ?? 0;
  const entries = minNum > 0
    ? _buffer.filter(e => (e.level || 30) >= minNum)
    : _buffer;
  return entries.slice(-Math.min(limit, MAX_BUFFER));
}

/**
 * Maak een Pino-compatibele Writable stream.
 * Pino schrijft één JSON-object per log entry, gevolgd door een newline.
 * Deze stream parsert de regels en voegt ze toe aan de ring buffer.
 * @returns {import('stream').Writable}
 */
function createPinoStream() {
  return new Writable({
    write(chunk, _enc, done) {
      try {
        const lines = chunk.toString().split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const entry = JSON.parse(trimmed);
            _addEntry(entry);
          } catch {
            // Niet-JSON regel (bijv. pino-pretty output) — sla over
          }
        }
      } catch {
        // Ignore all parse errors — never crash the app
      }
      done();
    },
  });
}

module.exports = { addClient, removeClient, getRecent, createPinoStream, LEVEL_NUMS, LEVEL_NAMES };
