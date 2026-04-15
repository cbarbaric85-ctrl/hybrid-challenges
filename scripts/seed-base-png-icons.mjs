/**
 * Writes minimal valid PNGs into public/icons/creatures/ so mapped paths always resolve.
 * Replace with real art when ready. Run: npm run icons:base-pngs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const dir = path.join(root, 'public', 'icons', 'creatures');

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGM4ceIEAAS0AlkWLoFAAAAAAElFTkSuQmCC',
  'base64'
);

const FILES = [
  'tiger.png',
  'wolf.png',
  'eagle.png',
  'crocodile.png',
  'shark.png',
  'bear.png',
  'owl.png',
  'snake.png',
  'default.png',
];

fs.mkdirSync(dir, { recursive: true });
for (const f of FILES) {
  fs.writeFileSync(path.join(dir, f), PNG);
}
console.log('[icons:base-pngs] wrote', FILES.length, 'files →', path.relative(root, dir));
