/**
 * Fills `public/assets/` for creatures & factions:
 * 1) Copy from public/creature-icons/ and public/faction-characters/ when present (your real art wins).
 * 2) For any missing .svg, write a small generated icon using that animal's emoji from animals.js.
 *
 * Run: npm run assets:seed
 *
 * Sources (optional):
 *   public/creature-icons/{animalId}.svg
 *   public/creature-icons/locked/{animalId}_locked.svg
 *   public/faction-characters/{slug}/{animalId}.svg
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

const EMOJI_FONT =
  'system-ui, "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif';

function ensureDir(d) {
  fs.mkdirSync(d, { recursive: true });
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function safeSvgId(s) {
  return String(s).replace(/[^a-zA-Z0-9_-]/g, '_');
}

/**
 * Generated “icon” for missing art: emoji on a soft tile (renders like a real icon in <img>).
 */
function generatedEmojiSvg(animalId, emoji, locked) {
  const gid = safeSvgId(animalId);
  const em = emoji && String(emoji).trim() ? emoji : '?';
  const lockLayer = locked
    ? `
  <rect width="64" height="64" rx="10" fill="rgba(0,0,0,.45)"/>
  <g transform="translate(32,34)" fill="none" stroke="rgba(255,255,255,.7)" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <path d="M -6 -6 V -11 A 5 5 0 0 1 6 -11 V -6"/>
    <rect x="-10" y="-6" width="20" height="16" rx="2" fill="rgba(255,255,255,.1)" stroke="rgba(255,255,255,.7)"/>
  </g>`
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-hidden="true">
  <defs>
    <linearGradient id="eg-${gid}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1a2834"/>
      <stop offset="100%" stop-color="#0c1018"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="10" fill="url(#eg-${gid})" stroke="rgba(255,255,255,.08)" stroke-width="1"/>
  <text x="32" y="40" text-anchor="middle" font-size="34" font-family="${EMOJI_FONT}">${escapeXml(em)}</text>${lockLayer}
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
let genOpen = 0;
let copiedLocked = 0;
let genLocked = 0;
let keptOpen = 0;
let keptLocked = 0;

ensureDir(path.join(assetsRoot, 'creatures/locked'));

for (const id of Object.keys(ALL_ANIMALS)) {
  const a = ALL_ANIMALS[id];
  const emoji = a?.emoji ?? '?';
  const toOpen = `creatures/${id}.svg`;
  const openPath = path.join(assetsRoot, toOpen);

  if (copyFileIfExists(`creature-icons/${id}.svg`, toOpen)) {
    copiedOpen++;
  } else if (fs.existsSync(openPath)) {
    keptOpen++;
  } else {
    writeSvg(toOpen, generatedEmojiSvg(id, emoji, false));
    genOpen++;
  }

  const toLocked = `creatures/locked/${id}_locked.svg`;
  const lockedPath = path.join(assetsRoot, toLocked);

  if (copyFileIfExists(`creature-icons/locked/${id}_locked.svg`, toLocked)) {
    copiedLocked++;
  } else if (fs.existsSync(lockedPath)) {
    keptLocked++;
  } else {
    writeSvg(toLocked, generatedEmojiSvg(id, emoji, true));
    genLocked++;
  }
}

let copiedFaction = 0;
let genFaction = 0;
let keptFaction = 0;

for (const [regKey, slug] of Object.entries(FACTION_TIER_KEY_TO_SLUG)) {
  const tier = TIER_REGISTRY[regKey];
  if (!tier?.animals) continue;
  ensureDir(path.join(assetsRoot, 'factions', slug));
  for (const cid of Object.keys(tier.animals)) {
    const to = `factions/${slug}/${cid}.svg`;
    const destPath = path.join(assetsRoot, to);

    if (copyFileIfExists(`faction-characters/${slug}/${cid}.svg`, to)) {
      copiedFaction++;
      continue;
    }
    if (copyFileIfExists(`creature-icons/${cid}.svg`, to)) {
      copiedFaction++;
      continue;
    }
    const baseCreature = path.join(assetsRoot, 'creatures', `${cid}.svg`);
    if (fs.existsSync(baseCreature)) {
      ensureDir(path.dirname(destPath));
      fs.copyFileSync(baseCreature, destPath);
      copiedFaction++;
      continue;
    }
    if (fs.existsSync(destPath)) {
      keptFaction++;
      continue;
    }
    const em = ALL_ANIMALS[cid]?.emoji ?? '?';
    writeSvg(to, generatedEmojiSvg(cid, em, false));
    genFaction++;
  }
}

for (const [from, to] of TIER_BG_COPY) {
  copyIfExists(from, to);
}
for (const [from, to] of CREST_COPY) {
  copyIfExists(from, to);
}

const n = Object.keys(ALL_ANIMALS).length;
console.log(
  '[seed] assets →',
  path.relative(root, assetsRoot),
  `| creatures: ${copiedOpen} copied from creature-icons, ${genOpen} generated, ${keptOpen} already present | locked: ${copiedLocked} copied, ${genLocked} generated, ${keptLocked} kept | factions: ${copiedFaction} copied, ${genFaction} generated, ${keptFaction} kept | total animals: ${n}`
);
