/**
 * Progression tier visuals — backgrounds + badges under /public/tier-themes/.
 * Panel backgrounds also registered in src/config/assets.js (`tierAssets`).
 * Complements faction-theme.js (does not replace --faction-* vars).
 */

import { tierAssets } from '../config/assets.js';

const ROOT = '/tier-themes';

/** @typedef {{ id: string; label: string; background: string; badge: string }} TierTheme */

/** @type {Record<string, TierTheme>} */
const THEMES = {
  base: {
    id: 'base',
    label: 'Base Animals',
    background: tierAssets.base,
    badge: `${ROOT}/base/badge.svg`,
  },
  apex: {
    id: 'apex',
    label: 'Apex Predators',
    background: tierAssets.apex,
    badge: `${ROOT}/apex/badge.svg`,
  },
  dinosaur: {
    id: 'dinosaur',
    label: 'Dinosaur Tier',
    background: tierAssets.dinosaur,
    badge: `${ROOT}/dinosaur/badge.svg`,
  },
  legendary: {
    id: 'legendary',
    label: 'Legendary Beasts',
    background: tierAssets.legendary,
    badge: `${ROOT}/legendary/badge.svg`,
  },
  mythical: {
    id: 'mythical',
    label: 'Mythical Gods',
    background: tierAssets.mythical,
    badge: `${ROOT}/mythical/badge.svg`,
  },
  factions: {
    id: 'factions',
    label: 'Factions',
    background: `${ROOT}/factions/bg.svg`,
    badge: `${ROOT}/factions/badge.svg`,
  },
};

/** Forge `tier-hdr-nm` class suffix → theme id */
const FORGE_SECTION_TO_THEME = {
  base: 'base',
  apex: 'apex',
  dino: 'dinosaur',
  legendary: 'legendary',
  mythical: 'mythical',
  egyptian: 'factions',
  knights: 'factions',
  roman: 'factions',
  anglo: 'factions',
  samurai: 'factions',
  viking: 'factions',
};

/**
 * @param {keyof typeof THEMES | string} themeId
 * @returns {TierTheme}
 */
export function getTierTheme(themeId) {
  return THEMES[themeId] || THEMES.factions;
}

/**
 * @param {keyof typeof FORGE_SECTION_TO_THEME | string} forgeHdrClass
 * @returns {TierTheme}
 */
export function getTierThemeForForgeSection(forgeHdrClass) {
  const id = FORGE_SECTION_TO_THEME[forgeHdrClass] || 'factions';
  return getTierTheme(id);
}

/**
 * Apply panel classes + data-tier-theme for CSS backgrounds.
 * @param {HTMLElement} sectionEl
 * @param {keyof typeof FORGE_SECTION_TO_THEME | string} forgeHdrClass
 */
export function applyTierThemeToForgeSection(sectionEl, forgeHdrClass) {
  const t = getTierThemeForForgeSection(forgeHdrClass);
  sectionEl.classList.add('tier-theme-panel');
  sectionEl.setAttribute('data-tier-theme', t.id);
  sectionEl.style.setProperty('--tier-theme-bg', `url('${t.background}')`);
}

/** Hub atmosphere by mission level (matches forge gates). */
export function getHubTierThemeIdFromLevel(level) {
  const lv = level | 0;
  if (lv < 6) return 'base';
  if (lv < 9) return 'apex';
  if (lv < 13) return 'dinosaur';
  if (lv < 17) return 'legendary';
  if (lv < 21) return 'mythical';
  return 'factions';
}

/**
 * Sets --hub-tier-bg on :root for optional Hub styling.
 * @param {number} level
 */
export function applyHubTierAtmosphere(level) {
  const t = getTierTheme(getHubTierThemeIdFromLevel(level));
  document.documentElement.style.setProperty('--hub-tier-bg', `url('${t.background}')`);
}

export function clearHubTierAtmosphere() {
  document.documentElement.style.removeProperty('--hub-tier-bg');
}

/** Badge img HTML for tier headers (28px). */
export function tierBadgeImgHtml(forgeHdrClass) {
  const t = getTierThemeForForgeSection(forgeHdrClass);
  return `<img class="tier-theme-badge" src="${t.badge}" width="28" height="28" alt="" aria-hidden="true"/>`;
}
