/**
 * Copies generated SVGs into `public/assets/` (same idea as faction crests — no synthetic placeholders).
 * Run: npm run assets:seed
 *
 * Put your generated creature icons here (filenames must match animal ids in src/data/animals.js):
 *   public/creature-icons/{animalId}.svg
 *   public/creature-icons/locked/{animalId}_locked.svg   (optional)
 *
 * Faction-themed overrides (optional):
 *   public/faction-characters/{slug}/{animalId}.svg
 *
 * If a file is missing for an id, nothing is written — the app falls back to emoji (see asset-utils onerror).
 * You can also commit SVGs directly under public/assets/creatures/; this script only copies when sources exist.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ALL_ANIMALS, TIER_REGISTRY } from '../src/data/animals.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const pub = path.join(root, 'public');
const assetsRoot = path.join(pub, 'assets');

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

/** Copy from `public/{fromRel}` → `public/assets/{toRel}`. Returns true if copied. */
function copyFileIfExists(fromRel, toRel) {
  const from = path.join(pub, fromRel);
  if (!fs.existsSync(from)) return false;
  const to = path.join(assetsRoot, toRel);
  ensureDir(path.dirname(to));
  fs.copyFileSync(from, to);
  return true;
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

/** Remove legacy PNG portraits if any remain. */
function deletePngsUnder(relDir) {
  const dir = path.join(assetsRoot, relDir);
  if (!fs.existsSync(dir)) return;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) {
      for (const n2 of fs.readdirSync(p)) {
        if (n2.endsWith('.png')) fs.unlinkSync(path.join(p, n2));
      }
    } else if (name.endsWith('.png')) {
      fs.unlinkSync(p);
    }
  }
}

deletePngsUnder('creatures');
deletePngsUnder('factions');

let copiedOpen = 0;
let copiedLocked = 0;
let missingOpen = 0;
let missingLocked = 0;

ensureDir(path.join(assetsRoot, 'creatures/locked'));

for (const id of Object.keys(ALL_ANIMALS)) {
  const toOpen = `creatures/${id}.svg`;
  if (copyFileIfExists(`creature-icons/${id}.svg`, toOpen)) copiedOpen++;
  else missingOpen++;

  const toLocked = `creatures/locked/${id}_locked.svg`;
  if (copyFileIfExists(`creature-icons/locked/${id}_locked.svg`, toLocked)) copiedLocked++;
  else missingLocked++;
}

let copiedFaction = 0;
for (const [regKey, slug] of Object.entries(FACTION_TIER_KEY_TO_SLUG)) {
  const tier = TIER_REGISTRY[regKey];
  if (!tier?.animals) continue;
  ensureDir(path.join(assetsRoot, 'factions', slug));
  for (const cid of Object.keys(tier.animals)) {
    const to = `factions/${slug}/${cid}.svg`;
    if (copyFileIfExists(`faction-characters/${slug}/${cid}.svg`, to)) {
      copiedFaction++;
      continue;
    }
    if (copyFileIfExists(`creature-icons/${cid}.svg`, to)) {
      copiedFaction++;
    }
  }
}

for (const [from, to] of TIER_BG_COPY) {
  copyIfExists(from, to);
}
for (const [from, to] of CREST_COPY) {
  copyIfExists(from, to);
}

console.log(
  '[seed] assets →',
  path.relative(root, assetsRoot),
  '| creature-icons copied:',
  copiedOpen,
  '/',
  Object.keys(ALL_ANIMALS).length,
  'open,',
  copiedLocked,
  'locked (optional); faction paths copied:',
  copiedFaction,
  '| no source file:',
  missingOpen,
  'open slots (emoji fallback until you add creature-icons/{id}.svg)'
);
