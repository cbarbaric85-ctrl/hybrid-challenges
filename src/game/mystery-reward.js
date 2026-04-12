import {
  APEX_IDS, DINO_IDS, LEGENDARY_IDS, MYTHICAL_IDS, EGYPTIAN_IDS, KNIGHT_IDS, ANIMALS,
} from '../data/animals.js';
import { isQuizEligible, MAX_LEVEL } from './progression.js';
import { EMPTY_STAT_BOOST, localDateString } from './utils.js';

const STAT_KEYS = ['spd', 'agi', 'int', 'str'];

const ALL_RECRUIT_ORDER = [
  ...APEX_IDS, ...DINO_IDS, ...LEGENDARY_IDS, ...MYTHICAL_IDS, ...EGYPTIAN_IDS, ...KNIGHT_IDS,
];

function collectEligibleRecruitIds(progress) {
  const out = [];
  for (const id of ALL_RECRUIT_ORDER) {
    if (ANIMALS[id] && isQuizEligible(id, progress)) out.push(id);
  }
  return out;
}

function pickRandom(arr, rng) {
  if (!arr.length) return null;
  const i = Math.floor(rng() * arr.length);
  return arr[i];
}

function pickTier(rng) {
  const r = rng();
  if (r < 0.6) return 'common';
  if (r < 0.85) return 'medium';
  if (r < 0.99) return 'rare';
  return 'ultra';
}

function randomStatKey(rng) {
  return STAT_KEYS[Math.floor(rng() * STAT_KEYS.length)];
}

function addStatBoost(boost, key, n) {
  const o = { ...boost };
  o[key] = (o[key] || 0) + n;
  return o;
}

/**
 * Weighted roll for Mystery Reward (3 cups are cosmetic — call once on pick).
 * @returns {{ tier: string, kind: string, displayName: string, isUltraLevel: boolean, ultraMessage: string|null }}
 */
export function rollMysteryReward(progress, rng = Math.random) {
  let tier = pickTier(rng);
  if (tier === 'ultra' && progress.level >= MAX_LEVEL) {
    tier = rng() < 0.5 ? 'rare' : 'medium';
  }

  if (tier === 'ultra') {
    return {
      tier: 'ultra',
      kind: 'level_unlock',
      displayName: 'Next level unlocked!',
      isUltraLevel: true,
      ultraMessage: '🔥 INCREDIBLE! You unlocked the next level!',
    };
  }

  if (tier === 'common') {
    const branch = rng();
    if (branch < 0.65) {
      const k = randomStatKey(rng);
      const names = { spd: 'Speed', agi: 'Agility', int: 'Intellect', str: 'Strength' };
      return {
        tier: 'common',
        kind: 'stat_battle_1',
        displayName: `Battle boost: +1 ${names[k]} (next fight)`,
        isUltraLevel: false,
        ultraMessage: null,
        _statKey: k,
      };
    }
    if (branch < 0.9) {
      return {
        tier: 'common',
        kind: 'coins_small',
        displayName: '+3 Fusion Coins',
        isUltraLevel: false,
        ultraMessage: null,
      };
    }
    return {
      tier: 'common',
      kind: 'commander_xp_small',
      displayName: '+5 Commander XP',
      isUltraLevel: false,
      ultraMessage: null,
    };
  }

  if (tier === 'medium') {
    const branch = rng();
    if (branch < 0.45) {
      const k = randomStatKey(rng);
      const names = { spd: 'Speed', agi: 'Agility', int: 'Intellect', str: 'Strength' };
      return {
        tier: 'medium',
        kind: 'stat_battle_2',
        displayName: `Battle boost: +2 ${names[k]} (next fight)`,
        isUltraLevel: false,
        ultraMessage: null,
        _statKey: k,
      };
    }
    if (branch < 0.78) {
      return {
        tier: 'medium',
        kind: 'quiz_grace',
        displayName: 'Quiz boost: 1 free correct (next quiz)',
        isUltraLevel: false,
        ultraMessage: null,
      };
    }
    return {
      tier: 'medium',
      kind: 'commander_xp_badge',
      displayName: '+12 Commander XP (badge progress)',
      isUltraLevel: false,
      ultraMessage: null,
    };
  }

  // rare
  const eligible = collectEligibleRecruitIds(progress);
  if (eligible.length && rng() < 0.45) {
    const id = pickRandom(eligible, rng);
    const a = ANIMALS[id];
    return {
      tier: 'rare',
      kind: 'creature_unlock',
      displayName: `Creature unlock: ${a?.name || id}`,
      isUltraLevel: false,
      ultraMessage: null,
      _creatureId: id,
    };
  }
  if (rng() < 0.55) {
    return {
      tier: 'rare',
      kind: 'hybrid_battle_all',
      displayName: 'Hybrid boost: +1 all stats (next fight)',
      isUltraLevel: false,
      ultraMessage: null,
    };
  }
  return {
    tier: 'rare',
    kind: 'commander_xp_badge',
    displayName: '+25 Commander XP (badge progress)',
    isUltraLevel: false,
    ultraMessage: null,
  };
}

/**
 * Apply a rolled reward to progress (mutates). Call after daily claim is allowed.
 */
export function applyMysteryReward(progress, rolled) {
  const p = progress;
  if (!p) return;

  const ensureBoost = () => {
    if (!p.pendingMysteryBattleBoost) p.pendingMysteryBattleBoost = EMPTY_STAT_BOOST();
  };

  switch (rolled.kind) {
    case 'level_unlock': {
      const before = p.level;
      p.level = Math.min((p.level || 1) + 1, MAX_LEVEL);
      p.highestLevelReached = Math.max(p.highestLevelReached || 0, p.level);
      if (p.level === before) {
        p.commanderXp = (p.commanderXp || 0) + 30;
      }
      break;
    }
    case 'stat_battle_1': {
      ensureBoost();
      const k = rolled._statKey || randomStatKey(Math.random);
      p.pendingMysteryBattleBoost = addStatBoost(p.pendingMysteryBattleBoost, k, 1);
      break;
    }
    case 'stat_battle_2': {
      ensureBoost();
      const k = rolled._statKey || randomStatKey(Math.random);
      p.pendingMysteryBattleBoost = addStatBoost(p.pendingMysteryBattleBoost, k, 2);
      break;
    }
    case 'hybrid_battle_all': {
      ensureBoost();
      let b = p.pendingMysteryBattleBoost;
      for (const key of STAT_KEYS) {
        b = addStatBoost(b, key, 1);
      }
      p.pendingMysteryBattleBoost = b;
      break;
    }
    case 'coins_small':
      p.coins = (p.coins || 0) + 3;
      break;
    case 'commander_xp_small':
      p.commanderXp = (p.commanderXp || 0) + 5;
      break;
    case 'commander_xp_badge':
      p.commanderXp = (p.commanderXp || 0) + (rolled.tier === 'rare' ? 25 : 12);
      break;
    case 'quiz_grace':
      p.pendingQuizGrace = (p.pendingQuizGrace || 0) + 1;
      break;
    case 'creature_unlock': {
      const id = rolled._creatureId;
      if (id && ANIMALS[id]) {
        if (!p.quizUnlocked.includes(id)) p.quizUnlocked.push(id);
        if (!p.unlockedAnimals.includes(id)) p.unlockedAnimals.push(id);
      }
      break;
    }
    default:
      break;
  }

  const rid = `${rolled.kind}_${rolled.tier}_${Date.now()}`;
  if (!Array.isArray(p.unlockedRewards)) p.unlockedRewards = [];
  if (p.unlockedRewards.length < 200) p.unlockedRewards.push(rid);

  syncActiveBoostsView(p);
}

function sumBoostObj(b) {
  if (!b) return 0;
  return STAT_KEYS.reduce((s, k) => s + (b[k] || 0), 0);
}

/** Keep Firestore `activeBoosts` in sync with pending fields (single source). */
export function syncActiveBoostsView(p) {
  const arr = [];
  if (p.pendingMysteryBattleBoost && sumBoostObj(p.pendingMysteryBattleBoost) > 0) {
    arr.push({ type: 'battleStat', boost: { ...p.pendingMysteryBattleBoost } });
  }
  if ((p.pendingQuizGrace || 0) > 0) {
    arr.push({ type: 'quizGrace', count: p.pendingQuizGrace });
  }
  p.activeBoosts = arr;
}

export function canClaimMysteryRewardToday(progress) {
  if (!progress) return false;
  const today = localDateString();
  return progress.lastMysteryRewardDayKey !== today;
}

export function formatCountdownShort(ms) {
  const s = Math.ceil(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return 'soon';
}
