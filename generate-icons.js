#!/usr/bin/env node

/**
 * Icon Generator voor Muziek Dashboard PWA
 * Genereert 192x192 en 512x512 PNG icons met een muzieknoot symbool
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const colors = {
  background: '#1a1a2e',  // Donkerblauw
  musicNote: '#00d4ff',   // Helder cyaan
  accent: '#ff006e'       // Roze accent
};

/**
 * Genereert een SVG met een muzieknoot design
 */
function generateMusicNoteSVG(size) {
  const padding = size * 0.1;
  const noteSize = size * 0.5;
  const noteX = size * 0.3;
  const noteY = size * 0.2;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Achtergrond -->
  <rect width="${size}" height="${size}" fill="${colors.background}"/>

  <!-- Decoratieve cirkel -->
  <circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.45}" fill="none" stroke="${colors.accent}" stroke-width="${size * 0.02}" opacity="0.3"/>

  <!-- Eerste muzieknoot -->
  <g transform="translate(${noteX}, ${noteY})">
    <!-- Noot-kop (cirkel) -->
    <circle cx="0" cy="${noteSize * 0.6}" r="${noteSize * 0.15}" fill="${colors.musicNote}"/>
    <!-- Noot-steel (lijn) -->
    <line x1="${noteSize * 0.15}" y1="${noteSize * 0.6}" x2="${noteSize * 0.15}" y2="-${noteSize * 0.2}"
          stroke="${colors.musicNote}" stroke-width="${noteSize * 0.08}" stroke-linecap="round"/>
    <!-- Noot-vlag (golf) -->
    <path d="M ${noteSize * 0.18} -${noteSize * 0.15} Q ${noteSize * 0.35} -${noteSize * 0.25} ${noteSize * 0.5} -${noteSize * 0.15}"
          stroke="${colors.musicNote}" stroke-width="${noteSize * 0.08}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </g>

  <!-- Tweede muzieknoot -->
  <g transform="translate(${noteX + noteSize * 0.5}, ${noteY + noteSize * 0.3})">
    <!-- Noot-kop (cirkel) -->
    <circle cx="0" cy="${noteSize * 0.6}" r="${noteSize * 0.15}" fill="${colors.musicNote}"/>
    <!-- Noot-steel (lijn) -->
    <line x1="${noteSize * 0.15}" y1="${noteSize * 0.6}" x2="${noteSize * 0.15}" y2="-${noteSize * 0.35}"
          stroke="${colors.musicNote}" stroke-width="${noteSize * 0.08}" stroke-linecap="round"/>
    <!-- Noot-vlag (golf) -->
    <path d="M ${noteSize * 0.18} -${noteSize * 0.3} Q ${noteSize * 0.35} -${noteSize * 0.4} ${noteSize * 0.5} -${noteSize * 0.3}"
          stroke="${colors.musicNote}" stroke-width="${noteSize * 0.08}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </g>

  <!-- Verbindingsbalk tussen noten -->
  <line x1="${noteX + noteSize * 0.15}" y1="${-noteSize * 0.15}"
        x2="${noteX + noteSize * 0.65}" y2="${-noteSize * 0.3}"
        stroke="${colors.musicNote}" stroke-width="${noteSize * 0.06}" opacity="0.6" stroke-linecap="round"/>
</svg>`;
}

/**
 * Genereert een icon van gegeven grootte
 */
async function generateIcon(size, outputPath) {
  const svgBuffer = Buffer.from(generateMusicNoteSVG(size));

  try {
    await sharp(svgBuffer)
      .png()
      .toFile(outputPath);
    console.log(`✓ Icon gegenereerd: ${outputPath} (${size}x${size})`);
  } catch (error) {
    console.error(`✗ Fout bij genereren icon ${size}x${size}:`, error.message);
    process.exit(1);
  }
}

/**
 * Hauptfunctie
 */
async function main() {
  const publicDir = path.join(__dirname, 'public');

  console.log('🎵 Muziek Dashboard PWA Icons genereren...\n');

  // Genereer 192x192 icon
  await generateIcon(192, path.join(publicDir, 'icon-192.png'));

  // Genereer 512x512 icon
  await generateIcon(512, path.join(publicDir, 'icon-512.png'));

  console.log('\n✓ Alle icons succesvol gegenereerd!');
}

main().catch(error => {
  console.error('Fatale fout:', error);
  process.exit(1);
});
