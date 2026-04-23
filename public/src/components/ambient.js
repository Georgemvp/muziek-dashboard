/**
 * Ambient Background Module
 * ═══════════════════════════════════════════════════════════════════
 * Haalt dominante kleur uit album art en past deze toe als
 * subtiele radial gradient glow op de achtergrond (Plexamp-style).
 */

/**
 * Haal de dominante kleur uit een afbeelding.
 * Gebruikt een klein canvas om de gemiddelde kleur te berekenen.
 * @param {string} imgSrc - URL van de afbeelding
 * @returns {Promise<{r: number, g: number, b: number}>}
 */
function extractColor(imgSrc) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Gebruik klein canvas voor snelle berekening
        canvas.width = 8;
        canvas.height = 8;

        // Teken afbeelding op canvas
        ctx.drawImage(img, 0, 0, 8, 8);

        // Haal pixel data
        const data = ctx.getImageData(0, 0, 8, 8).data;

        // Bereken gemiddelde RGB
        let r = 0, g = 0, b = 0, count = 0;
        for (let i = 0; i < data.length; i += 4) {
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          count++;
        }

        resolve({
          r: Math.round(r / count),
          g: Math.round(g / count),
          b: Math.round(b / count)
        });
      } catch (e) {
        console.warn('[Ambient] Canvas error:', e);
        resolve({ r: 30, g: 15, b: 50 }); // fallback donker paars
      }
    };

    img.onerror = () => {
      console.debug('[Ambient] Image load error, using fallback color');
      resolve({ r: 30, g: 15, b: 50 }); // fallback
    };

    img.src = imgSrc;
  });
}

/**
 * Stel de ambient achtergrondkleur in op basis van album art.
 * @param {string} imgSrc - URL van het album art
 */
export async function setAmbientBackground(imgSrc) {
  const mainArea = document.querySelector('.main-area');
  if (!mainArea) return;

  // Geen afbeelding → verwijder effect
  if (!imgSrc) {
    mainArea.classList.remove('has-ambient');
    mainArea.style.removeProperty('--album-color-1');
    mainArea.style.removeProperty('--album-color-2');
    return;
  }

  try {
    const color = await extractColor(imgSrc);

    // Maak twee lichtere varianten voor gradients
    // Color 1: originele kleur met alpha
    const c1 = `rgba(${color.r}, ${color.g}, ${color.b}, 0.5)`;

    // Color 2: iets lichter/saturatie voor diepte
    const lighter = 30;
    const c2 = `rgba(${Math.min(255, color.r + lighter)}, ${Math.min(255, color.g + lighter * 0.7)}, ${Math.min(255, color.b + lighter * 0.5)}, 0.4)`;

    mainArea.style.setProperty('--album-color-1', c1);
    mainArea.style.setProperty('--album-color-2', c2);

    mainArea.classList.add('has-ambient');
    console.debug('[Ambient] Background updated:', { r: color.r, g: color.g, b: color.b });
  } catch (e) {
    console.warn('[Ambient] Failed to set background:', e);
    mainArea.classList.remove('has-ambient');
  }
}

/**
 * Initialiseer ambient background module.
 * Zoekt naar startende album art en stelt achtergrond in.
 */
export function initAmbient() {
  const artEl = document.getElementById('player-art');
  if (artEl && artEl.src) {
    setAmbientBackground(artEl.src);
  }
  console.log('[Ambient] Module initialized');
}
