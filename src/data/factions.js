/**
 * Player factions — identity, passive battle hooks, and light UI theming.
 * Extend FACTIONS + FACTION_ORDER for new factions; keep ids stable for Firestore.
 */

import { mythicalLevelGateMet } from '../game/progression.js';

export const FACTION_EGYPTIAN = 'egyptian_guardians';
export const FACTION_VIKING = 'viking_raiders';

export const FACTION_ORDER = [FACTION_EGYPTIAN, FACTION_VIKING];

export const FACTIONS = {
  [FACTION_EGYPTIAN]: {
    id: FACTION_EGYPTIAN,
    name: 'Egyptian Guardians',
    shortName: 'Egyptian',
    description: 'Ancient wisdom sharpens every mind clash. The sands may grant one second wind when all seems lost.',
    icon: '🐫',
    passiveBonus: {
      intPerIntRound: 1,
      reviveChance: 0.12,
      reviveOncePerBattle: true,
    },
    visualTheme: {
      accent: 'gold-blue',
      glow: 'rgba(212, 175, 55, 0.25)',
      accent2: 'rgba(61, 158, 255, 0.35)',
    },
  },
  [FACTION_VIKING]: {
    id: FACTION_VIKING,
    name: 'Viking Raiders',
    shortName: 'Viking',
    description: 'Each setback fuels the next strike. In the late rounds, the longship\'s momentum shows.',
    icon: '🛡️',
    passiveBonus: {
      strAfterLoss: 1,
      lateRoundBonus: 1,
      lateRoundFromIndex: 3,
    },
    visualTheme: {
      accent: 'red-ice',
      glow: 'rgba(255, 60, 60, 0.22)',
      accent2: 'rgba(120, 200, 255, 0.3)',
    },
  },
};

export function getFaction(id) {
  if (!id) return null;
  return FACTIONS[id] || null;
}

export function defaultFactionUnlockedList() {
  return [...FACTION_ORDER];
}

/**
 * Extra player bonus for resolveRound (stacked with quiz +2).
 * @param {object} ctx
 * @param {string|null} ctx.factionId
 * @param {string} ctx.stat
 * @param {number} ctx.roundIdx 0-based
 * @param {boolean} ctx.playerLostLastRound
 */
export function getFactionRoundBonus(ctx) {
  const { factionId, stat, roundIdx, playerLostLastRound } = ctx;
  const messages = [];
  let bonus = 0;
  if (!factionId) return { bonus, messages };

  if (factionId === FACTION_EGYPTIAN && stat === 'int') {
    bonus += 1;
    messages.push('🐫 Egyptian wisdom boosts intelligence!');
  }

  if (factionId === FACTION_VIKING) {
    if (playerLostLastRound && stat === 'str') {
      bonus += 1;
      messages.push('⚔️ Viking fury adds strength!');
    }
    const lateFrom = FACTIONS[FACTION_VIKING].passiveBonus.lateRoundFromIndex;
    if (roundIdx >= lateFrom) {
      bonus += 1;
      messages.push('🌊 Viking tide — stronger in the late rounds!');
    }
  }

  return { bonus, messages };
}

/**
 * If the round was an enemy win, Egyptian revive may convert to a tie (once per battle).
 */
/** Mythical tier gate open and no allegiance chosen yet — show picker. */
export function needsFactionSelection(progress) {
  if (!progress) return false;
  if (progress.faction) return false;
  return mythicalLevelGateMet(progress);
}

/**
 * One revive-to-tie per battle: Egyptian faction and/or Anubis Guardian in hybrid stack chances (capped).
 */
export function trySanctuaryRevive(round, battleState, opts) {
  const { factionId, animalIds = [] } = opts || {};
  if (round.winner !== 'enemy' || battleState.sanctuaryReviveUsed) return round;
  let chance = 0;
  if (factionId === FACTION_EGYPTIAN) chance += FACTIONS[FACTION_EGYPTIAN].passiveBonus.reviveChance;
  if (animalIds.includes('anubis_guardian')) chance += 0.11;
  chance = Math.min(0.26, chance);
  if (chance <= 0 || Math.random() >= chance) return round;
  battleState.sanctuaryReviveUsed = true;
  const msg = animalIds.includes('anubis_guardian')
    ? '⚱️ Soul Guard — the jackal denies defeat!'
    : '🏺 Guardian spirit — second wind! Round ties!';
  return {
    ...round,
    winner: 'tie',
    pTotal: round.eTotal,
    sanctuaryRevive: true,
    factionMessages: [...(round.factionMessages || []), msg],
  };
}
