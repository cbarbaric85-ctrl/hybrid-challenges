/**
 * Generates placeholder PNGs and copies tier/crest SVGs into `public/assets/`.
 * Run: npm run assets:seed
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ALL_ANIMALS, TIER_REGISTRY } from '../src/data/animals.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const pub = path.join(root, 'public');
const assetsRoot = path.join(pub, 'assets');

const PNG_1x1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

const FACTION_TIER_KEY_TO_SLUG = {
  egyptian: 'egyptians',
  knights: 'knights',
  roman_empire: 'romans',
  anglo_saxons: 'anglo_saxons',
  samurai_order: 'samurai',
  viking_clans: 'vikings',
};

const TIER_BG_COPY = [
  ['tier-themes/base/bg.svg', 'tiers/base_animals_bg.svg'],
  ['tier-themes/apex/bg.svg', 'tiers/apex_predators_bg.svg'],
  ['tier-themes/dinosaur/bg.svg', 'tiers/dinosaurs_bg.svg'],
  ['tier-themes/legendary/bg.svg', 'tiers/legendary_bg.svg'],
  ['tier-themes/mythical/bg.svg', 'tiers/mythical_bg.svg'],
];

const CREST_COPY = [
  ['faction-crests/egyptian_guardians.svg', 'faction_crests/egyptians.svg'],
  ['faction-crests/viking_raiders.svg', 'faction_crests/vikings.svg'],
  ['faction-crests/roman_empire.svg', 'faction_crests/romans.svg'],
  ['faction-crests/anglo_saxons.svg', 'faction_crests/anglo_saxons.svg'],
  ['faction-crests/samurai_order.svg', 'faction_crests/samurai.svg'],
  ['faction-crests/knights.svg', 'faction_crests/knights.svg'],
];

function ensureDir(d) {
  fs.mkdirSync(d, { recursive: true });
}

function writePng(relPath) {
  const full = path.join(assetsRoot, relPath);
  ensureDir(path.dirname(full));
  fs.writeFileSync(full, PNG_1x1);
}

function copyIfExists(fromRel, toRel) {
  const from = path.join(pub, fromRel);
  const to = path.join(assetsRoot, toRel);
  if (!fs.existsSync(from)) {
    console.warn('[seed] skip missing:', fromRel);
    return;
  }
  ensureDir(path.dirname(to));
  fs.copyFileSync(from, to);
}

ensureDir(path.join(assetsRoot, 'creatures/locked'));

for (const id of Object.keys(ALL_ANIMALS)) {
  writePng(`creatures/${id}.png`);
  writePng(`creatures/locked/${id}_locked.png`);
}

for (const [regKey, slug] of Object.entries(FACTION_TIER_KEY_TO_SLUG)) {
  const tier = TIER_REGISTRY[regKey];
  if (!tier?.animals) continue;
  for (const cid of Object.keys(tier.animals)) {
    writePng(`factions/${slug}/${cid}.png`);
  }
}

for (const [from, to] of TIER_BG_COPY) {
  copyIfExists(from, to);
}
for (const [from, to] of CREST_COPY) {
  copyIfExists(from, to);
}

console.log('[seed] assets placeholders OK →', path.relative(root, assetsRoot));
