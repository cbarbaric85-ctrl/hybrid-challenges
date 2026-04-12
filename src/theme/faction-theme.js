/**
 * Central faction visual tokens for CSS variables (single source of truth).
 * Playable ids match src/data/factions.js; presets may exist for future factions.
 */

/** @typedef {'sand'|'banner'|'snow'|'none'} FactionEffect */

/** Keys we set on document.documentElement.style — cleared on logout / no faction */
export const FACTION_CSS_VAR_KEYS = [
  '--faction-primary',
  '--faction-secondary',
  '--faction-accent',
  '--faction-glow',
  '--faction-arena-bg',
  '--faction-body-overlay',
  '--faction-transition',
  '--faction-flash-win',
  '--faction-flash-loss',
  '--faction-flash-tie',
];

const TRANSITION = '0.45s ease';

/**
 * @type {Record<string, {
 *   primary: string;
 *   secondary: string;
 *   accent: string;
 *   glow: string;
 *   arenaBg: string;
 *   bodyOverlay: string;
 *   flashWin: string;
 *   flashLoss: string;
 *   flashTie: string;
 *   effect: FactionEffect;
 * }>}
 */
export const FACTION_THEMES = {
  egyptian_guardians: {
    primary: '#d4af37',
    secondary: '#c4a574',
    accent: '#2dd4bf',
    glow: 'rgba(212, 175, 55, 0.38)',
    arenaBg: [
      'linear-gradient(165deg, rgba(5, 12, 22, 0.97) 0%, rgba(18, 28, 42, 0.98) 45%, rgba(8, 14, 24, 1) 100%)',
      'radial-gradient(ellipse 90% 55% at 50% 18%, rgba(212, 175, 55, 0.14) 0%, transparent 58%)',
      'radial-gradient(ellipse 70% 40% at 80% 85%, rgba(45, 212, 191, 0.08) 0%, transparent 55%)',
    ].join(', '),
    bodyOverlay: [
      'radial-gradient(ellipse 120% 80% at 50% -10%, rgba(212, 175, 55, 0.09) 0%, transparent 45%)',
      'radial-gradient(ellipse 80% 50% at 100% 50%, rgba(45, 212, 191, 0.05) 0%, transparent 50%)',
    ].join(', '),
    flashWin: 'rgba(45, 212, 191, 0.22)',
    flashLoss: 'rgba(212, 175, 55, 0.12)',
    flashTie: 'rgba(212, 175, 55, 0.16)',
    effect: 'sand',
  },
  viking_raiders: {
    primary: '#7ec8ff',
    secondary: '#2a3a4a',
    accent: '#ff8c32',
    glow: 'rgba(120, 200, 255, 0.35)',
    arenaBg: [
      'linear-gradient(175deg, rgba(4, 10, 22, 0.98) 0%, rgba(12, 22, 38, 0.99) 50%, rgba(6, 14, 28, 1) 100%)',
      'radial-gradient(ellipse 85% 50% at 50% 12%, rgba(120, 200, 255, 0.12) 0%, transparent 55%)',
      'radial-gradient(ellipse 60% 45% at 15% 90%, rgba(255, 140, 50, 0.07) 0%, transparent 50%)',
    ].join(', '),
    bodyOverlay: [
      'radial-gradient(ellipse 100% 60% at 50% 0%, rgba(120, 200, 255, 0.08) 0%, transparent 50%)',
      'radial-gradient(ellipse 50% 40% at 0% 100%, rgba(255, 100, 40, 0.05) 0%, transparent 55%)',
    ].join(', '),
    flashWin: 'rgba(120, 200, 255, 0.2)',
    flashLoss: 'rgba(255, 100, 60, 0.14)',
    flashTie: 'rgba(255, 200, 120, 0.14)',
    effect: 'snow',
  },
  knights: {
    primary: '#8cb4e8',
    secondary: '#3a4450',
    accent: '#c83c3c',
    glow: 'rgba(140, 180, 230, 0.36)',
    arenaBg: [
      'linear-gradient(180deg, rgba(8, 12, 20, 0.98) 0%, rgba(18, 24, 34, 0.99) 55%, rgba(6, 10, 18, 1) 100%)',
      'radial-gradient(ellipse 100% 45% at 50% 0%, rgba(140, 180, 230, 0.1) 0%, transparent 52%)',
      'linear-gradient(90deg, rgba(60, 80, 110, 0.06) 0%, transparent 15%, transparent 85%, rgba(60, 80, 110, 0.06) 100%)',
    ].join(', '),
    bodyOverlay: [
      'radial-gradient(ellipse 90% 50% at 50% 0%, rgba(140, 180, 230, 0.07) 0%, transparent 48%)',
      'linear-gradient(180deg, rgba(200, 60, 60, 0.04) 0%, transparent 35%)',
    ].join(', '),
    flashWin: 'rgba(100, 160, 230, 0.2)',
    flashLoss: 'rgba(200, 70, 70, 0.14)',
    flashTie: 'rgba(180, 190, 210, 0.14)',
    effect: 'banner',
  },
};

/** Future faction ids — not wired to FACTIONS until product adds them */
export const FACTION_THEME_PRESETS = {
  samurai_order: {
    primary: '#b91c1c',
    secondary: '#1a1a1a',
    accent: '#f5f5f5',
    glow: 'rgba(185, 28, 28, 0.3)',
    arenaBg: 'linear-gradient(180deg, #0a0a0a 0%, #1a1010 100%)',
    bodyOverlay: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(185, 28, 28, 0.08) 0%, transparent 50%)',
    flashWin: 'rgba(185, 28, 28, 0.18)',
    flashLoss: 'rgba(80, 80, 80, 0.14)',
    flashTie: 'rgba(200, 200, 200, 0.12)',
    effect: 'none',
  },
  mythical_gods: {
    primary: '#b06aff',
    secondary: '#ffd700',
    accent: '#38bdf8',
    glow: 'rgba(176, 106, 255, 0.35)',
    arenaBg: 'linear-gradient(180deg, #0a0618 0%, #120a28 50%, #080410 100%)',
    bodyOverlay: 'radial-gradient(ellipse 100% 60% at 50% 20%, rgba(176, 106, 255, 0.12) 0%, transparent 55%)',
    flashWin: 'rgba(176, 106, 255, 0.22)',
    flashLoss: 'rgba(56, 189, 248, 0.12)',
    flashTie: 'rgba(255, 215, 0, 0.14)',
    effect: 'none',
  },
};

/** @type {Record<string, string>} */
const ACCENT_LABELS = {
  egyptian_guardians: 'gold-blue',
  viking_raiders: 'red-ice',
  knights: 'silver-blue',
};

/**
 * Legacy shape for FACTIONS[].visualTheme — keeps ids in sync with FACTION_THEMES.
 * @param {string} factionId
 */
export function getFactionVisualThemeSummary(factionId) {
  const t = FACTION_THEMES[factionId];
  if (!t) return null;
  return {
    accent: ACCENT_LABELS[factionId] || 'theme',
    glow: t.glow,
    accent2: t.accent,
  };
}

/**
 * @param {string} factionId
 */
export function applyFactionThemeVars(factionId) {
  const t = FACTION_THEMES[factionId];
  if (!t) {
    clearFactionThemeVars();
    return;
  }
  const root = document.documentElement;
  root.style.setProperty('--faction-primary', t.primary);
  root.style.setProperty('--faction-secondary', t.secondary);
  root.style.setProperty('--faction-accent', t.accent);
  root.style.setProperty('--faction-glow', t.glow);
  root.style.setProperty('--faction-arena-bg', t.arenaBg);
  root.style.setProperty('--faction-body-overlay', t.bodyOverlay);
  root.style.setProperty('--faction-transition', TRANSITION);
  root.style.setProperty('--faction-flash-win', t.flashWin);
  root.style.setProperty('--faction-flash-loss', t.flashLoss);
  root.style.setProperty('--faction-flash-tie', t.flashTie);
  root.setAttribute('data-player-faction', factionId);
  if (t.effect && t.effect !== 'none') {
    root.setAttribute('data-faction-effect', t.effect);
  } else {
    root.removeAttribute('data-faction-effect');
  }
}

export function clearFactionThemeVars() {
  const root = document.documentElement;
  root.removeAttribute('data-player-faction');
  root.removeAttribute('data-faction-effect');
  for (const k of FACTION_CSS_VAR_KEYS) {
    root.style.removeProperty(k);
  }
}
