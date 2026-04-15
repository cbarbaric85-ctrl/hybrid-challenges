/**
 * Central asset registry — paths under `public/assets/` (served from site root as `assets/...`).
 * Naming: lowercase, underscores. Placeholders: `npm run assets:seed`.
 * URLs respect Vite `base` / `import.meta.env.BASE_URL` so assets work when not hosted at `/`.
 */

import { ALL_ANIMALS, TIER_REGISTRY } from '../data/animals.js';

/**
 * @param {string} relativePath No leading slash, e.g. `assets/creatures/wolf.svg`
 * @returns {string}
 */
export function publicUrl(relativePath) {
  const p = relativePath.replace(/^\/+/, '');
  const base = import.meta.env.BASE_URL || '/';
  const normalized = base.endsWith('/') ? base : `${base}/`;
  return `${normalized}${p}`;
}

/** Game faction id → slug (folder under `factions/` and filename in `faction_crests/`) */
export const FACTION_ID_TO_SLUG = {
  egyptian_guardians: 'egyptians',
  viking_raiders: 'vikings',
  roman_empire: 'romans',
  anglo_saxons: 'anglo_saxons',
  samurai_order: 'samurai',
  knights: 'knights',
};

/** `TIER_REGISTRY` key → same slug as `FACTION_ID_TO_SLUG` values */
const FACTION_TIER_KEY_TO_SLUG = {
  egyptian: 'egyptians',
  knights: 'knights',
  roman_empire: 'romans',
  anglo_saxons: 'anglo_saxons',
  samurai_order: 'samurai',
  viking_clans: 'vikings',
};

function buildCreatureMap() {
  return Object.fromEntries(
    Object.keys(ALL_ANIMALS).map(id => [id, publicUrl(`assets/creatures/${id}.svg`)])
  );
}

function buildLockedMap() {
  return Object.fromEntries(
    Object.keys(ALL_ANIMALS).map(id => [id, publicUrl(`assets/creatures/locked/${id}_locked.svg`)])
  );
}

/** Backgrounds for core progression tiers (vector .svg; swap for .png without API changes). */
export const tierAssets = {
  base: publicUrl('assets/tiers/base_animals_bg.svg'),
  apex: publicUrl('assets/tiers/apex_predators_bg.svg'),
  dinosaur: publicUrl('assets/tiers/dinosaurs_bg.svg'),
  legendary: publicUrl('assets/tiers/legendary_bg.svg'),
  mythical: publicUrl('assets/tiers/mythical_bg.svg'),
};

function buildFactionsNested() {
  /** @type {Record<string, { crest: string; characters: Record<string, string> }>} */
  const out = {};
  for (const [regKey, slug] of Object.entries(FACTION_TIER_KEY_TO_SLUG)) {
    const tier = TIER_REGISTRY[regKey];
    if (!tier?.animals) continue;
    const characters = Object.fromEntries(
      Object.keys(tier.animals).map(cid => [cid, publicUrl(`assets/factions/${slug}/${cid}.svg`)])
    );
    out[slug] = {
      crest: publicUrl(`assets/faction_crests/${slug}.svg`),
      characters,
    };
  }
  return out;
}

export const assets = {
  creatures: buildCreatureMap(),
  creaturesLocked: buildLockedMap(),
  /** @example assets.factions.samurai.characters.kitsune */
  factions: buildFactionsNested(),
  tiers: { ...tierAssets },
};

/**
 * @param {string} factionId e.g. `samurai_order`
 * @returns {string | null}
 */
export function getFactionCrestUrl(factionId) {
  const slug = FACTION_ID_TO_SLUG[factionId];
  if (!slug) return null;
  return publicUrl(`assets/faction_crests/${slug}.svg`);
}

/**
 * Faction-themed character path (may match `creatures[id]` until unique art exists).
 * @param {string} animalId
 * @returns {string | null}
 */
export function getFactionCharacterUrl(animalId) {
  const a = ALL_ANIMALS[animalId];
  if (!a) return null;
  const regKey = Object.keys(FACTION_TIER_KEY_TO_SLUG).find(k => {
    const t = TIER_REGISTRY[k];
    return t?.animals && t.animals[animalId];
  });
  if (!regKey) return null;
  const slug = FACTION_TIER_KEY_TO_SLUG[regKey];
  return slug ? publicUrl(`assets/factions/${slug}/${animalId}.svg`) : null;
}

/**
 * Canonical portrait URL (`assets/creatures/...` under `publicUrl`, or locked variant).
 * @param {string} animalId
 * @param {{ locked?: boolean }} [opts]
 * @returns {string | null}
 */
export function getCreaturePortraitUrl(animalId, opts = {}) {
  const locked = opts.locked === true;
  const map = locked ? assets.creaturesLocked : assets.creatures;
  return map[animalId] || null;
}
