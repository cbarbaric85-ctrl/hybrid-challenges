/**
 * Static mapping for Base Animals PNG icons (no dynamic path building).
 * Paths are resolved with publicUrl for Vite base / subpath deploys.
 */

import { publicUrl } from './assets.js';

/** Relative to `public/` — filenames are fixed. */
const ICON_PATHS = {
  tiger: 'icons/creatures/tiger.png',
  wolf: 'icons/creatures/wolf.png',
  eagle: 'icons/creatures/eagle.png',
  crocodile: 'icons/creatures/crocodile.png',
  croc: 'icons/creatures/crocodile.png',
  shark: 'icons/creatures/shark.png',
  bear: 'icons/creatures/bear.png',
  owl: 'icons/creatures/owl.png',
  snake: 'icons/creatures/snake.png',
};

const DEFAULT_REL = 'icons/creatures/default.png';

export const creatureIcons = Object.fromEntries(
  Object.entries(ICON_PATHS).map(([k, rel]) => [k, publicUrl(rel)])
);

export const defaultCreatureIcon = publicUrl(DEFAULT_REL);

/**
 * @param {string} [nameOrId] Animal id (e.g. wolf, croc) or display name (e.g. Wolf, Crocodile)
 * @returns {string} Absolute URL for PNG under site base
 */
export function getCreatureIcon(nameOrId) {
  const key = String(nameOrId ?? '')
    .toLowerCase()
    .trim();
  return creatureIcons[key] || defaultCreatureIcon;
}
