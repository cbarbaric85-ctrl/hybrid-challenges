/**
 * Fills `public/assets/` — same pattern as faction crests: copy optional SVG sources from `public/`, else write a neutral vector placeholder.
 * Run: npm run assets:seed
 *
 * Source layout (optional — add files as you create art):
 *   public/creature-icons/{animalId}.svg
 *   public/creature-icons/locked/{animalId}_locked.svg
 *   public/faction-characters/{slug}/{animalId}.svg   (faction-themed override; else copies creature-icons/{id}.svg or placeholder)
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

function safeSvgId(s) {
  return String(s).replace(/[^a-zA-Z0-9_-]/g, '_');
}

/**
 * Neutral creature placeholder: soft card + filled silhouette (no hollow “picture frame”).
 * Vignette + two blobs read as a vague bust; locked adds dimmer + padlock.
 */
function placeholderCreatureSvg(animalId, locked) {
  const gid = safeSvgId(animalId);
  const lockLayer = locked
    ? `
  <rect width="64" height="64" rx="10" fill="rgba(0,0,0,.42)"/>
  <g transform="translate(32,34)" fill="none" stroke="rgba(255,255,255,.62)" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <path d="M -6 -6 V -11 A 5 5 0 0 1 6 -11 V -6"/>
    <rect x="-10" y="-6" width="20" height="16" rx="2" fill="rgba(255,255,255,.1)" stroke="rgba(255,255,255,.62)"/>
  </g>`
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-hidden="true">
  <defs>
    <linearGradient id="cp-${gid}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1a2a3a"/>
      <stop offset="100%" stop-color="#0c121c"/>
    </linearGradient>
    <radialGradient id="cp-${gid}-v" cx="50%" cy="38%" r="58%">
      <stop offset="0%" stop-color="rgba(120,180,230,.14)"/>
      <stop offset="50%" stop-color="rgba(255,255,255,.05)"/>
      <stop offset="100%" stop-color="transparent"/>
    </radialGradient>
  </defs>
  <rect width="64" height="64" rx="10" fill="url(#cp-${gid})" stroke="rgba(255,255,255,.06)" stroke-width="1"/>
  <rect width="64" height="64" rx="10" fill="url(#cp-${gid}-v)"/>
  <ellipse cx="32" cy="26" rx="12" ry="10" fill="rgba(255,255,255,.1)"/>
  <ellipse cx="32" cy="41" rx="18" ry="14" fill="rgba(255,255,255,.07)"/>${lockLayer}
</svg>
`;
}

function writeSvg(relPath, content) {
  const full = path.join(assetsRoot, relPath);
  ensureDir(path.dirname(full));
  fs.writeFileSync(full, content, 'utf8');
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

/** Remove legacy PNG creature/faction portraits after migration to SVG. */
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

ensureDir(path.join(assetsRoot, 'creatures/locked'));

for (const id of Object.keys(ALL_ANIMALS)) {
  const toOpen = `creatures/${id}.svg`;
  if (!copyFileIfExists(`creature-icons/${id}.svg`, toOpen)) {
    writeSvg(toOpen, placeholderCreatureSvg(id, false));
  }
  const toLocked = `creatures/locked/${id}_locked.svg`;
  if (!copyFileIfExists(`creature-icons/locked/${id}_locked.svg`, toLocked)) {
    writeSvg(toLocked, placeholderCreatureSvg(id, true));
  }
}

for (const [regKey, slug] of Object.entries(FACTION_TIER_KEY_TO_SLUG)) {
  const tier = TIER_REGISTRY[regKey];
  if (!tier?.animals) continue;
  ensureDir(path.join(assetsRoot, 'factions', slug));
  for (const cid of Object.keys(tier.animals)) {
    const to = `factions/${slug}/${cid}.svg`;
    if (copyFileIfExists(`faction-characters/${slug}/${cid}.svg`, to)) continue;
    if (copyFileIfExists(`creature-icons/${cid}.svg`, to)) continue;
    writeSvg(to, placeholderCreatureSvg(cid, false));
  }
}

for (const [from, to] of TIER_BG_COPY) {
  copyIfExists(from, to);
}
for (const [from, to] of CREST_COPY) {
  copyIfExists(from, to);
}

console.log('[seed] assets OK →', path.relative(root, assetsRoot));
