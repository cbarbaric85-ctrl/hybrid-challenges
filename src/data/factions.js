/**
 * Player factions — identity, passive battle hooks, and light UI theming.
 * Extend FACTIONS + FACTION_ORDER for new factions; keep ids stable for Firestore.
 */

import { mythicalLevelGateMet } from '../game/progression.js';
import { getFactionVisualThemeSummary } from '../theme/faction-theme.js';

export const FACTION_EGYPTIAN = 'egyptian_guardians';
export const FACTION_VIKING = 'viking_raiders';
export const FACTION_KNIGHTS = 'knights';
export const FACTION_ROMAN = 'roman_empire';
export const FACTION_ANGLO_SAXON = 'anglo_saxons';
export const FACTION_SAMURAI = 'samurai_order';

export const FACTION_ORDER = [
  FACTION_EGYPTIAN, FACTION_VIKING, FACTION_KNIGHTS,
  FACTION_ROMAN, FACTION_ANGLO_SAXON, FACTION_SAMURAI,
];

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
    kidTagline: 'Ancient protectors of pyramids and powerful gods!',
    timePeriod: '📜 Ancient Egypt — over 3,000 years ago',
    gameplayKid: '🧠 Bonus smarts on brain rounds — plus a lucky second chance when a round goes wrong!',
    meetLine: 'Meet: Anubis 🐺 • Ra ☀️ • Horus 🦅',
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
    visualTheme: getFactionVisualThemeSummary(FACTION_VIKING),
    kidTagline: 'Wild sea raiders who never give up!',
    timePeriod: '⚓ Viking Age — long ago in Northern Europe',
    gameplayKid: '🔥 Fight harder after a tough round — and hit stronger in the final rounds!',
    meetLine: 'Meet: Battle Wolf 🐺 • Snow Bear 🐻 • Storm Eagle 🦅',
  },
  [FACTION_KNIGHTS]: {
    id: FACTION_KNIGHTS,
    name: 'Knights of the Realm',
    shortName: 'Knights',
    description: 'Honour-bound warriors who defend, endure, and outlast their enemies.',
    icon: '🏰',
    passiveBonus: {
      enemyTotalShave: 1,
      lateRoundFromIndex: 3,
      lateRoundBonus: 1,
    },
    visualTheme: getFactionVisualThemeSummary(FACTION_KNIGHTS),
    kidTagline: 'Armor, honor, and castle defenders!',
    timePeriod: '🏰 Medieval times — knights and castles',
    gameplayKid: '🛡️ Tougher defense — enemy hits can count for less, and you get stronger in late rounds!',
    meetLine: 'Meet: Shield Knight 🪖 • Templar ✝️ • Paladin ⚔️',
  },
  [FACTION_ROMAN]: {
    id: FACTION_ROMAN,
    name: 'Roman Empire',
    shortName: 'Roman',
    description: 'Legion discipline and divine favor — strike with rhythm when the crowd roars.',
    icon: '🏛️',
    passiveBonus: {
      legionRhythm: true,
    },
    visualTheme: getFactionVisualThemeSummary(FACTION_ROMAN),
    kidTagline: 'Gods, eagles, and arena legends!',
    timePeriod: '🏛️ Ancient Rome — republic and empire',
    gameplayKid: '💪 Extra strength on every other strength round — feel the legion beat!',
    meetLine: 'Meet: Mars Warrior ⚔️ • Imperial Eagle 🦅 • Stone Colossus 🗿',
  },
  [FACTION_ANGLO_SAXON]: {
    id: FACTION_ANGLO_SAXON,
    name: 'Anglo-Saxons',
    shortName: 'Anglo-Saxon',
    description: 'Hearth, wild wood, and moonlit wards — wisdom deepens when the battle runs long.',
    icon: '🌲',
    passiveBonus: {
      hallWisdomFromRound: 3,
    },
    visualTheme: getFactionVisualThemeSummary(FACTION_ANGLO_SAXON),
    kidTagline: 'Forests, halls, and brave spirit heroes!',
    timePeriod: '🌲 Early medieval Britain — halls and heaths',
    gameplayKid: '🧠 Bonus smarts on mind rounds in the late fight — the hall remembers!',
    meetLine: 'Meet: Owl Seer 🦉 • Boar Spirit 🐗 • Hearth Spirit 🔥',
  },
  [FACTION_SAMURAI]: {
    id: FACTION_SAMURAI,
    name: 'Samurai Order',
    shortName: 'Samurai',
    description: 'First-strike spirit — speed and focus flash before the dust settles.',
    icon: '🗾',
    passiveBonus: {
      firstStrikeRound: 0,
    },
    visualTheme: getFactionVisualThemeSummary(FACTION_SAMURAI),
    kidTagline: 'Kami spirits, blades, and cherry-blossom courage!',
    timePeriod: '🗾 Feudal Japan — warriors and honor',
    gameplayKid: '⚡ Bonus agility on the first agility round of each battle — draw first!',
    meetLine: 'Meet: Kitsune 🦊 • Thunder Shogun ⛈️ • Dragon Spirit 🐉',
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

  if (factionId === FACTION_KNIGHTS) {
    const lateFromK = FACTIONS[FACTION_KNIGHTS].passiveBonus.lateRoundFromIndex;
    if (roundIdx >= lateFromK) {
      bonus += 1;
      messages.push('🛡️ Knight endurance — you hold the line!');
    }
  }

  if (factionId === FACTION_ROMAN && stat === 'str' && roundIdx % 2 === 0) {
    bonus += 1;
    messages.push('🏛️ Legion rhythm — strength in formation!');
  }

  if (factionId === FACTION_ANGLO_SAXON && stat === 'int' && roundIdx >= 3) {
    bonus += 1;
    messages.push('🌲 Hall wisdom — the old tales guide you!');
  }

  if (factionId === FACTION_SAMURAI && stat === 'agi' && roundIdx === 0) {
    bonus += 1;
    messages.push('🗾 First cut — samurai focus!');
  }

  return { bonus, messages };
}

/**
 * Knights faction: shave enemy effective total each round (extra once if Paladin in hybrid).
 * Recompute winner; message when resilience flips an enemy win.
 */
export function applyKnightFactionResilience(round, factionId, battleState, animalIds = []) {
  if (factionId !== FACTION_KNIGHTS || !round) return round;
  const shaveBase = FACTIONS[FACTION_KNIGHTS].passiveBonus.enemyTotalShave || 1;
  let shave = shaveBase;
  if (animalIds.includes('paladin_guardian') && battleState && !battleState.knightPaladinShaveUsed) {
    shave += 1;
    battleState.knightPaladinShaveUsed = true;
  }
  const origWinner = round.winner;
  const eTotalAdj = Math.max(round.eBase, round.eTotal - shave);
  const eRollAdj = eTotalAdj - round.eBase;
  let newWinner = origWinner;
  if (round.pTotal > eTotalAdj) newWinner = 'player';
  else if (round.pTotal < eTotalAdj) newWinner = 'enemy';
  else newWinner = 'tie';

  const messages = [...(round.factionMessages || [])];
  if (origWinner === 'enemy' && newWinner !== 'enemy') {
    messages.push('🛡️ Knight resilience reduces damage!');
  }

  return {
    ...round,
    eTotal: eTotalAdj,
    eRoll: eRollAdj,
    winner: newWinner,
    factionMessages: messages,
  };
}

/** Shield Knight: once per battle, turn one enemy round win into a tie. */
export function tryKnightBlockStance(round, battleState, animalIds = []) {
  if (round.winner !== 'enemy') return round;
  if (!animalIds.includes('shield_knight')) return round;
  if (battleState.knightBlockStanceUsed) return round;
  battleState.knightBlockStanceUsed = true;
  return {
    ...round,
    winner: 'tie',
    pTotal: round.eTotal,
    factionMessages: [...(round.factionMessages || []), '🪖 Block Stance — shield turns the blow!'],
  };
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
