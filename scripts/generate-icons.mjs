/**
 * Genera los PNG de marca (íconos de app y portada para compartir).
 *
 * Se corre a mano cuando cambia la identidad visual; los PNG quedan versionados
 * porque el build de Docker no debe depender de fuentes del sistema.
 *
 *   node scripts/generate-icons.mjs
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const VOID = "#03040c";
const CYAN = "#22d3ee";
const VIOLET = "#a855f7";

/**
 * El monograma se dibuja con trazos y no con texto: así el resultado es idéntico
 * en cualquier máquina, sin depender de qué fuentes haya instaladas.
 *
 * @param {number} scale tamaño del lienzo cuadrado
 * @param {number} inset cuánto encoger el dibujo (los íconos "maskable" se
 *   recortan en círculo, así que necesitan más aire alrededor)
 */
function monogram(scale, inset = 1) {
  const glow = `
    <radialGradient id="glow" cx="50%" cy="42%" r="58%">
      <stop offset="0%" stop-color="${CYAN}" stop-opacity="0.38" />
      <stop offset="55%" stop-color="${VIOLET}" stop-opacity="0.16" />
      <stop offset="100%" stop-color="${VOID}" stop-opacity="0" />
    </radialGradient>`;

  // userSpaceOnUse es obligatorio: el trazo vertical del "I" tiene una caja de
  // ancho cero y con el degradado relativo por defecto no se dibujaría.
  const stroke = `
    <linearGradient id="mark" gradientUnits="userSpaceOnUse" x1="130" y1="150" x2="400" y2="360">
      <stop offset="0%" stop-color="#67e8f9" />
      <stop offset="45%" stop-color="${CYAN}" />
      <stop offset="100%" stop-color="${VIOLET}" />
    </linearGradient>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${scale}" height="${scale}" viewBox="0 0 512 512">
  <defs>${glow}${stroke}</defs>
  <rect width="512" height="512" fill="${VOID}" />
  <rect width="512" height="512" fill="url(#glow)" />
  <g transform="translate(256 256) scale(${inset}) translate(-256 -256)">
    <g transform="translate(61 0) skewX(-10)" stroke="url(#mark)" stroke-width="38" stroke-linecap="round" fill="none">
      <line x1="150" y1="170" x2="272" y2="342" />
      <line x1="272" y1="170" x2="150" y2="342" />
      <line x1="336" y1="170" x2="336" y2="342" />
    </g>
  </g>
</svg>`;
}

function cover() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="halo" cx="50%" cy="38%" r="62%">
      <stop offset="0%" stop-color="${CYAN}" stop-opacity="0.30" />
      <stop offset="55%" stop-color="${VIOLET}" stop-opacity="0.14" />
      <stop offset="100%" stop-color="${VOID}" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="xi" gradientUnits="userSpaceOnUse" x1="-84" y1="37" x2="68" y2="146">
      <stop offset="0%" stop-color="#67e8f9" />
      <stop offset="45%" stop-color="${CYAN}" />
      <stop offset="100%" stop-color="${VIOLET}" />
    </linearGradient>
    <linearGradient id="rule" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${CYAN}" stop-opacity="0" />
      <stop offset="35%" stop-color="${CYAN}" stop-opacity="0.9" />
      <stop offset="65%" stop-color="${VIOLET}" stop-opacity="0.9" />
      <stop offset="100%" stop-color="${VIOLET}" stop-opacity="0" />
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="${VOID}" />
  <rect width="1200" height="630" fill="url(#halo)" />
  <!-- Ojo: los degradados en userSpaceOnUse se resuelven en el espacio de este
       grupo, así que sus coordenadas van relativas a este translate. -->
  <g transform="translate(600 232)" text-anchor="middle" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-style="italic" font-weight="700">
    <text y="0" font-size="118" fill="#f8fafc" letter-spacing="-2">BATTLE</text>
    <text y="146" font-size="152" fill="url(#xi)" letter-spacing="-6">XI</text>
  </g>
  <rect x="300" y="432" width="600" height="4" rx="2" fill="url(#rule)" />
  <text x="600" y="512" text-anchor="middle" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="34" fill="#94a3b8">
    Escaneá tus figuritas. Convertilas en cartas. Batallá.
  </text>
</svg>`;
}

async function png(svg, out, width) {
  const file = path.join(root, out);
  await mkdir(path.dirname(file), { recursive: true });
  const buffer = await sharp(Buffer.from(svg), { density: 384 })
    .resize(width)
    .png()
    .toBuffer();
  await writeFile(file, buffer);
  console.log(`${out} (${(buffer.length / 1024).toFixed(1)} kB)`);
}

await png(monogram(512), "public/icons/icon-192.png", 192);
await png(monogram(512), "public/icons/icon-512.png", 512);
await png(monogram(512, 0.72), "public/icons/maskable-512.png", 512);
await png(monogram(512), "src/app/apple-icon.png", 180);
await png(cover(), "src/app/opengraph-image.png", 1200);
await writeFile(path.join(root, "src/app/icon.svg"), monogram(512));
console.log("src/app/icon.svg");
