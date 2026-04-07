import {
  STAGE_BASE, STAGE_APEX, STAGE_DINO,
  ANIMALS, BASE_IDS, APEX_IDS, DINO_IDS, STARTER_BASE_IDS,
} from '../data/animals.js';
import { LEVEL_REWARDS } from '../data/levels.js';
import { state, MONETIZE_PLACEHOLDER } from './state.js';
import { localDateString, localYesterdayString, EMPTY_STAT_BOOST } from './utils.js';

function canAccessStage(progress, stage) {
  const a = progress.stageAccess || { base: true, apex: true, dinosaur: true };
  if (stage === STAGE_BASE) return a.base !== false && MONETIZE_PLACEHOLDER.fullBaseStageOwned;
  if (stage === STAGE_APEX) return a.apex !== false && MONETIZE_PLACEHOLDER.apexStageOwned;
  if (stage === STAGE_DINO) return a.dinosaur !== false && MONETIZE_PLACEHOLDER.dinosaurStageOwned;
  return true;
}

// ═══════════════════════════════════════════════════════════════════
// ANIMAL AVAILABILITY LOGIC
// ═══════════════════════════════════════════════════════════════════

function isBaseAnimalUnlocked(id, progress) {
  if (!ANIMALS[id] || ANIMALS[id].stage !== STAGE_BASE) return false;
  return STARTER_BASE_IDS.includes(id) || progress.unlockedAnimals.includes(id);
}

function countBaseUnlocked(progress) {
  return BASE_IDS.filter(id => isBaseAnimalUnlocked(id, progress)).length;
}

function countApexUnlocked(progress) {
  return APEX_IDS.filter(id => progress.quizUnlocked.includes(id)).length;
}

function countDinoUnlocked(progress) {
  return DINO_IDS.filter(id => progress.quizUnlocked.includes(id)).length;
}

/** Beat level 5 (campaign level 6+) → apex quizzes open. */
function apexLevelGateMet(progress) {
  return progress.level >= 6;
}

/** Beat level 8 (campaign level 9+) → dinosaur quizzes open. */
function dinoLevelGateMet(progress) {
  return progress.level >= 9;
}

function getPlayerStageLabel(progress) {
  const b = countBaseUnlocked(progress);
  if (b < BASE_IDS.length || !apexLevelGateMet(progress)) return 'Base Animals';
  if (!dinoLevelGateMet(progress)) return 'Apex Predators';
  return 'Dinosaurs';
}

/** Cleared level number that awards each base recruit (inverse of LEVEL_REWARDS). */
const BASE_UNLOCK_LEVEL = {};
for (let L = 1; L <= 10; L++) {
  const rid = LEVEL_REWARDS[L];
  if (rid) BASE_UNLOCK_LEVEL[rid] = L;
}

function getNextBaseAnimalId(progress) {
  return BASE_IDS.find(id => !isBaseAnimalUnlocked(id, progress)) || null;
}

function getNextApexAnimalId(progress) {
  if (!apexLevelGateMet(progress)) return null;
  return APEX_IDS.find(id => !progress.quizUnlocked.includes(id)) || null;
}

function getNextDinoAnimalId(progress) {
  if (!dinoLevelGateMet(progress)) return null;
  return DINO_IDS.find(id => !progress.quizUnlocked.includes(id)) || null;
}

/** One-line hints for hub / battle overlay (short, kid-friendly). */
function getProgressionNextLines(progress) {
  const lines = [];
  const p = progress;
  const curLv = Math.min(p.level, 10);
  const bNext = getNextBaseAnimalId(p);
  if (bNext) {
    const needLv = BASE_UNLOCK_LEVEL[bNext];
    const nm = ANIMALS[bNext].name;
    if (needLv != null && needLv === curLv && p.level <= 10) {
      lines.push(`<strong>Next goal:</strong> Win this mission to recruit ${nm}.`);
    } else if (needLv != null) {
      lines.push(`<strong>Next unlock:</strong> ${nm} — beat Level ${needLv}.`);
    } else lines.push(`<strong>Next:</strong> ${nm}`);
  } else if (!apexLevelGateMet(p)) {
    lines.push(`<strong>Next goal:</strong> Beat Level 5 to open <strong>Apex Predators</strong>, then quiz in the Forge.`);
  } else if (getNextApexAnimalId(p)) {
    const id = getNextApexAnimalId(p);
    lines.push(`<strong>Next goal:</strong> Pass the <strong>${ANIMALS[id].name}</strong> Apex quiz in the Forge.`);
  } else if (!dinoLevelGateMet(p)) {
    lines.push(`<strong>Next goal:</strong> Beat Level 8 to open <strong>Dinosaurs</strong>, then quiz in the Forge.`);
  } else if (getNextDinoAnimalId(p)) {
    const id = getNextDinoAnimalId(p);
    lines.push(`<strong>Next goal:</strong> Pass the <strong>${ANIMALS[id].name}</strong> Dino quiz in the Forge.`);
  } else {
    lines.push(`<strong>You cleared the roster!</strong> Push levels, coins, and leaderboard rank.`);
  }
  return lines;
}

function getAvailableAnimals(progress) {
  return Object.keys(ANIMALS).filter(id => {
    const a = ANIMALS[id];
    if (a.stage === STAGE_BASE) {
      return canAccessStage(progress, STAGE_BASE) && isBaseAnimalUnlocked(id, progress);
    }
    if (a.stage === STAGE_APEX) {
      return (
        canAccessStage(progress, STAGE_APEX) &&
        apexLevelGateMet(progress) &&
        progress.quizUnlocked.includes(id)
      );
    }
    if (a.stage === STAGE_DINO) {
      return (
        canAccessStage(progress, STAGE_DINO) &&
        dinoLevelGateMet(progress) &&
        progress.quizUnlocked.includes(id)
      );
    }
    return false;
  });
}

function isQuizEligible(id, progress) {
  const a = ANIMALS[id];
  if (!a || a.stage === STAGE_BASE) return false;
  if (progress.quizUnlocked.includes(id)) return false;
  if (a.stage === STAGE_APEX) {
    return canAccessStage(progress, STAGE_APEX) && apexLevelGateMet(progress);
  }
  if (a.stage === STAGE_DINO) {
    return canAccessStage(progress, STAGE_DINO) && dinoLevelGateMet(progress);
  }
  return false;
}

function isLevelLocked(id, progress) {
  const a = ANIMALS[id];
  if (a.stage === STAGE_APEX) return progress.level < 6;
  if (a.stage === STAGE_DINO) return progress.level < 9;
  return false;
}

/** Checklist for hub / roster (base level gates + apex & dinosaurs). */
function unlockGateLinesForAnimal(id, progress) {
  const a = ANIMALS[id];
  if (a.stage === STAGE_BASE && !isBaseAnimalUnlocked(id, progress)) {
    const needLv = BASE_UNLOCK_LEVEL[id];
    if (needLv == null) return [{ ok: false, text: 'Play levels to recruit' }];
    return [{ ok: progress.level > needLv, text: `Beat Level ${needLv}` }];
  }
  if (a.stage === STAGE_APEX) {
    const levelOk = apexLevelGateMet(progress);
    const quizOk = progress.quizUnlocked.includes(id);
    return [
      { ok: levelOk, text: 'Beat Level 5' },
      { ok: quizOk, text: 'Pass Apex quiz' },
    ];
  }
  if (a.stage === STAGE_DINO) {
    const levelOk = dinoLevelGateMet(progress);
    const quizOk = progress.quizUnlocked.includes(id);
    return [
      { ok: levelOk, text: 'Beat Level 8' },
      { ok: quizOk, text: 'Pass Dino quiz' },
    ];
  }
  return null;
}

function quizUiTierType(animalId) {
  return ANIMALS[animalId]?.stage === STAGE_DINO ? 'dino' : 'apex';
}

function mergeStatBoosts(a, b) {
  const o = EMPTY_STAT_BOOST();
  for (const k of ['spd', 'agi', 'int', 'str']) o[k] = (a[k] || 0) + (b[k] || 0);
  return o;
}

function sumBoostPoints(boost) {
  return ['spd', 'agi', 'int', 'str'].reduce((s, k) => s + (boost[k] || 0), 0);
}

/** Small in-battle stat bonus from consecutive-day streak (stacks with quiz boosts). */
function getStreakBattleBoost(progress) {
  const n = progress?.streakCount || 0;
  const o = EMPTY_STAT_BOOST();
  if (n >= 7) {
    o.spd = 1;
    o.agi = 1;
    o.int = 1;
  } else if (n >= 3) {
    o.spd = 1;
  }
  return o;
}

function getActiveBattleBoosts() {
  const b = state.battle;
  const q = b?.quizBoosts || EMPTY_STAT_BOOST();
  const s = state.progress ? getStreakBattleBoost(state.progress) : EMPTY_STAT_BOOST();
  return mergeStatBoosts(q, s);
}

/** First visit each calendar day: extend or reset streak; +2 coins when continuing a streak. */
function touchDailyStreakIfNeeded(progress) {
  const today = localDateString();
  if (progress.lastPlayedDate === today) return false;
  const yesterday = localYesterdayString();
  if (progress.lastPlayedDate === yesterday) {
    progress.streakCount = (progress.streakCount || 0) + 1;
    progress.coins = (progress.coins || 0) + 2;
  } else {
    progress.streakCount = 1;
  }
  progress.lastPlayedDate = today;
  return true;
}

const DAILY_CHALLENGE_DEFS = [
  { id: 'speed', title: 'Speed squad', desc: 'Win using only animals with Speed 8+' },
  { id: 'light', title: 'Light hitters', desc: 'Win with no animal at Strength 10+' },
  { id: 'double', title: 'Double down', desc: 'Win 2 missions today' },
];

function pickDailyChallenge(dateKey) {
  let h = 2166136261;
  for (let i = 0; i < dateKey.length; i++) h = Math.imul(h ^ dateKey.charCodeAt(i), 16777619);
  const idx = Math.abs(h) % DAILY_CHALLENGE_DEFS.length;
  return DAILY_CHALLENGE_DEFS[idx];
}

function ensureDailyChallengeRolled(progress) {
  const t = localDateString();
  if (progress.dailyChallengeDayKey !== t) {
    progress.dailyChallengeDayKey = t;
    progress.dailyWinsToday = 0;
    progress.dailyChallengeRewardClaimed = false;
  }
}

function dailyChallengeMet(def, progress, hybrid, won) {
  if (!won || progress.dailyChallengeRewardClaimed) return false;
  const ids = hybrid?.animals || [];
  if (!ids.length) return false;
  if (def.id === 'speed') return ids.every(id => (ANIMALS[id]?.spd ?? 0) >= 8);
  if (def.id === 'light') return ids.every(id => (ANIMALS[id]?.str ?? 0) < 10);
  if (def.id === 'double') return (progress.dailyWinsToday || 0) >= 2;
  return false;
}

/** Show friendly “shop later” copy without blocking (hard gates use MONETIZE_PLACEHOLDER + canAccessStage). */
const RETENTION_SOFT_MONETISE_COPY = true;

function getRetentionShopTeasers() {
  if (!RETENTION_SOFT_MONETISE_COPY) return [];
  return [
    '<span class="soft-gate-pill">Shop soon</span> Optional packs will <strong>speed up</strong> unlocks — the whole game stays playable free.',
  ];
}

function getSoftMonetisationHintLines(progress) {
  if (!RETENTION_SOFT_MONETISE_COPY || !progress) return [];
  const lines = [];
  const bFull = countBaseUnlocked(progress) >= BASE_IDS.length;
  if (!MONETIZE_PLACEHOLDER.fullBaseStageOwned && bFull) {
    lines.push('<span class="soft-gate-pill">Unlock full set</span> Continue with every base animal — <strong>instant unlock</strong> when payments go live.');
  }
  if (!MONETIZE_PLACEHOLDER.apexStageOwned && apexLevelGateMet(progress) && countApexUnlocked(progress) < APEX_IDS.length) {
    lines.push('<span class="soft-gate-pill">Unlock Apex</span> Or keep clearing <strong>Apex quizzes</strong> for free — your choice.');
  }
  if (!MONETIZE_PLACEHOLDER.dinosaurStageOwned && dinoLevelGateMet(progress) && countDinoUnlocked(progress) < DINO_IDS.length) {
    lines.push('<span class="soft-gate-pill">Unlock Dinosaurs</span> Or earn each beast with <strong>Dino quizzes</strong>.');
  }
  return lines;
}

function formatMiniStatPreview(a) {
  return `<span class="a-stat-preview">${a.spd}/${a.agi}/${a.int}/${a.str}</span>`;
}

export {
  canAccessStage,
  isBaseAnimalUnlocked,
  countBaseUnlocked,
  countApexUnlocked,
  countDinoUnlocked,
  apexLevelGateMet,
  dinoLevelGateMet,
  getPlayerStageLabel,
  BASE_UNLOCK_LEVEL,
  getNextBaseAnimalId,
  getNextApexAnimalId,
  getNextDinoAnimalId,
  getProgressionNextLines,
  getAvailableAnimals,
  isQuizEligible,
  isLevelLocked,
  unlockGateLinesForAnimal,
  quizUiTierType,
  mergeStatBoosts,
  sumBoostPoints,
  getStreakBattleBoost,
  getActiveBattleBoosts,
  touchDailyStreakIfNeeded,
  DAILY_CHALLENGE_DEFS,
  pickDailyChallenge,
  ensureDailyChallengeRolled,
  dailyChallengeMet,
  RETENTION_SOFT_MONETISE_COPY,
  getRetentionShopTeasers,
  getSoftMonetisationHintLines,
  formatMiniStatPreview,
};