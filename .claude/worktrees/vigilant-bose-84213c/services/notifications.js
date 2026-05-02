// ── Notification Service ───────────────────────────────────────────────────────
// Verstuurt notificaties via Discord webhook, Telegram Bot API en Pushbullet.
// Gebruikt Node.js native fetch (Node 18+) — geen extra dependencies.
'use strict';

const logger = require('../logger').child({ service: 'notifications' });

/**
 * Stuur een bericht naar een Discord webhook.
 * @param {string} webhookUrl - Volledige Discord webhook URL
 * @param {string} message    - Tekst van het bericht
 */
async function sendDiscord(webhookUrl, message) {
  if (!webhookUrl) throw new Error('Discord webhook URL ontbreekt');
  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: String(message).slice(0, 2000) }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Discord HTTP ${res.status}: ${body.slice(0, 200)}`);
  }
  logger.debug({ status: res.status }, 'Discord notificatie verzonden');
}

/**
 * Stuur een bericht via de Telegram Bot API.
 * @param {string} botToken - Bot API token (format: 123456:ABC-…)
 * @param {string} chatId   - Chat / channel ID
 * @param {string} message  - Tekst (HTML-opmaak toegestaan)
 */
async function sendTelegram(botToken, chatId, message) {
  if (!botToken || !chatId) throw new Error('Telegram botToken en chatId zijn verplicht');
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: String(message).slice(0, 4096),
      parse_mode: 'HTML',
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Telegram HTTP ${res.status}: ${body.slice(0, 200)}`);
  }
  logger.debug({ status: res.status, chatId }, 'Telegram notificatie verzonden');
}

/**
 * Stuur een push-notificatie via Pushbullet.
 * @param {string} apiKey - Pushbullet Access Token
 * @param {string} title  - Titel van de notificatie
 * @param {string} body   - Tekst van de notificatie
 */
async function sendPushbullet(apiKey, title, body) {
  if (!apiKey) throw new Error('Pushbullet API key ontbreekt');
  const res = await fetch('https://api.pushbullet.com/v2/pushes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Access-Token': apiKey,
    },
    body: JSON.stringify({ type: 'note', title: String(title), body: String(body) }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Pushbullet HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  logger.debug({ status: res.status }, 'Pushbullet notificatie verzonden');
}

module.exports = { sendDiscord, sendTelegram, sendPushbullet };
