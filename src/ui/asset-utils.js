/**
 * Helpers for `/assets` registry — images with emoji fallback (see `registerAssetImageFallback` in boot).
 */

import { ALL_ANIMALS, BASE_IDS } from '../data/animals.js';
import { getCreaturePortraitUrl, getFactionCrestUrl } from '../config/assets.js';
import { getCreatureIcon } from '../config/creatureIcons.js';
import { escapeHtml } from './screens.js';

export function registerAssetImageFallback() {
  if (typeof window === 'undefined') return;
  window.__assetImgFallback = img => {
    img.onerror = null;
    const span = document.createElement('span');
    span.className = `${img.className || ''} asset-emoji-fallback`.trim();
    span.setAttribute('aria-hidden', 'true');
    span.textContent = img.dataset.fallback != null ? img.dataset.fallback : '?';
    img.replaceWith(span);
  };
}

/**
 * @param {string} id Animal id
 * @param {string} [emoji] Fallback emoji
 * @param {{ className?: string; size?: number; loading?: string; locked?: boolean }} [opts]
 */
export function creaturePortraitImgHtml(id, emoji, opts = {}) {
  const {
    className = 'asset-creature',
    size = 32,
    loading = 'lazy',
    locked = false,
  } = opts;
  const em = emoji ?? ALL_ANIMALS[id]?.emoji ?? '?';
  const name = ALL_ANIMALS[id]?.name;

  if (BASE_IDS.includes(id)) {
    const url = getCreatureIcon(name || id);
    const load = loading === 'eager' ? 'eager' : 'lazy';
    const alt = escapeHtml(name || id);
    const lockedCls = locked ? ' asset-creature--base-locked' : '';
    return `<img class="${escapeHtml(className)}${lockedCls}" src="${escapeHtml(url)}" alt="${alt}" width="${size}" height="${size}" loading="${load}" decoding="async" data-fallback="${escapeHtml(em)}" data-asset-id="${escapeHtml(id)}" data-base-png="1" onerror="window.__assetImgFallback&&window.__assetImgFallback(this)"/>`;
  }

  const url = getCreaturePortraitUrl(id, { locked });
  if (!url) {
    console.warn(`[assets] missing creature portrait mapping: ${id}`);
    return `<span class="asset-emoji-fallback ${escapeHtml(className)}" aria-hidden="true">${escapeHtml(em)}</span>`;
  }
  const load = loading === 'eager' ? 'eager' : 'lazy';
  return `<img class="${escapeHtml(className)}" src="${escapeHtml(url)}" alt="" width="${size}" height="${size}" loading="${load}" decoding="async" data-fallback="${escapeHtml(em)}" data-asset-id="${escapeHtml(id)}" onerror="window.__assetImgFallback&&window.__assetImgFallback(this)"/>`;
}

/**
 * @param {string} factionId e.g. `samurai_order`
 * @param {string} emojiFallback
 * @param {{ className?: string; size?: number }} [opts]
 */
export function factionCrestImgHtml(factionId, emojiFallback, opts = {}) {
  const { className = 'faction-crest-asset', size = 40 } = opts;
  const url = getFactionCrestUrl(factionId);
  if (!url) {
    console.warn(`[assets] missing faction crest mapping: ${factionId}`);
    return `<span class="asset-emoji-fallback ${escapeHtml(className)}" aria-hidden="true">${escapeHtml(emojiFallback)}</span>`;
  }
  return `<img class="${escapeHtml(className)}" src="${escapeHtml(url)}" width="${size}" height="${size}" alt="" loading="lazy" decoding="async" data-fallback="${escapeHtml(emojiFallback)}" onerror="window.__assetImgFallback&&window.__assetImgFallback(this)"/>`;
}
