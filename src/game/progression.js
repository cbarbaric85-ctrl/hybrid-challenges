import {
  STAGE_BASE, STAGE_APEX, STAGE_DINO, STAGE_LEGENDARY, STAGE_MYTHICAL, STAGE_EGYPTIAN, STAGE_KNIGHTS,
  ANIMALS, BASE_IDS, APEX_IDS, DINO_IDS, LEGENDARY_IDS, MYTHICAL_IDS, EGYPTIAN_IDS, KNIGHT_IDS, STARTER_BASE_IDS,
} from '../data/animals.js';
import { LEVEL_REWARDS } from '../data/levels.js';
import { state, MONETIZE_PLACEHOLDER } from './state.js';
import { localDateString, localYesterdayString, EMPTY_STAT_BOOST } from './utils.js';

function canAccessStage(progress, stage) {
  const a = progress.stageAccess || { base: true, apex: true, dinosaur: true, legendary: true, mythical: true, egyptian: true, knights: true };
  if (stage === STAGE_BASE) return a.base !== false && MONETIZE_PLACEHOLDER.fullBaseStageOwned;
  if (stage === STAGE_APEX) return a.apex !== false && MONETIZE_PLACEHOLDER.apexStageOwned;
  if (stage === STAGE_DINO) return a.dinosaur !== false && MONETIZE_PLACEHOLDER.dinosaurStageOwned;
  if (stage === STAGE_LEGENDARY) return a.legendary !== false && MONETIZE_PLACEHOLDER.legendaryStageOwned;
  if (stage === STAGE_MYTHICAL) return a.mythical !== false && MONETIZE_PLACEHOLDER.mythicalStageOwned;
  if (stage === STAGE_EGYPTIAN) return a.egyptian !== false && MONETIZE_PLACEHOLDER.egyptianStageOwned;
  if (stage === STAGE_KNIGHTS) return a.knights !== false && MONETIZE_PLACEHOLDER.knightsStageOwned;
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

function countLegendaryUnlocked(progress) {
  return LEGENDARY_IDS.filter(id => progress.quizUnlocked.includes(id)).length;
}

function countMythicalUnlocked(progress) {
  return MYTHICAL_IDS.filter(id => progress.quizUnlocked.includes(id)).length;
}

function countEgyptianUnlocked(progress) {
  return EGYPTIAN_IDS.filter(id => progress.quizUnlocked.includes(id)).length;
}

function countKnightsUnlocked(progress) {
  return KNIGHT_IDS.filter(id => progress.quizUnlocked.includes(id)).length;
}

/** All Mythical God quizzes cleared — Egyptian Guardian quizzes open. */
function egyptianTierQuizOpen(progress) {
  return countMythicalUnlocked(progress) >= MYTHICAL_IDS.length;
}

/** All Egyptian Guardian quizzes cleared — Knights of the Realm quizzes open. */
function knightTierQuizOpen(progress) {
  return countEgyptianUnlocked(progress) >= EGYPTIAN_IDS.length;
}

/** Beat level 5 (campaign level 6+) → apex quizzes open. */
function apexLevelGateMet(progress) {
  return progress.level >= 6;
}

/** Beat level 8 (campaign level 9+) → dinosaur quizzes open. */
function dinoLevelGateMet(progress) {
  return progress.level >= 9;
}

/** Beat level 12 (campaign level 13+) → legendary quizzes open. */
function legendaryLevelGateMet(progress) {
  return progress.level >= 13;
}

/** Beat level 16 (campaign level 17+) → mythical quizzes open. */
function mythicalLevelGateMet(progress) {
  return progress.level >= 17;
}

function getPlayerStageLabel(progress) {
  if (knightTierQuizOpen(progress) && countKnightsUnlocked(progress) > 0) return 'Knights of the Realm';
  if (egyptianTierQuizOpen(progress) && countEgyptianUnlocked(progress) > 0) return 'Egyptian Guardians';
  if (mythicalLevelGateMet(progress) && countMythicalUnlocked(progress) > 0) return 'Mythical Gods';
  if (legendaryLevelGateMet(progress) && countLegendaryUnlocked(progress) > 0) return 'Legendary Beasts';
  const b = countBaseUnlocked(progress);
  if (b < BASE_IDS.length || !apexLevelGateMet(progress)) return 'Base Animals';
  if (!dinoLevelGateMet(progress)) return 'Apex Predators';
  if (!legendaryLevelGateMet(progress)) return 'Dinosaurs';
  return 'Legendary Beasts';
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

function getNextLegendaryAnimalId(progress) {
  if (!legendaryLevelGateMet(progress)) return null;
  return LEGENDARY_IDS.find(id => !progress.quizUnlocked.includes(id)) || null;
}

function getNextMythicalAnimalId(progress) {
  if (!mythicalLevelGateMet(progress)) return null;
  return MYTHICAL_IDS.find(id => !progress.quizUnlocked.includes(id)) || null;
}

function getNextEgyptianAnimalId(progress) {
  if (!egyptianTierQuizOpen(progress)) return null;
  return EGYPTIAN_IDS.find(id => !progress.quizUnlocked.includes(id)) || null;
}

function getNextKnightAnimalId(progress) {
  if (!knightTierQuizOpen(progress)) return null;
  return KNIGHT_IDS.find(id => !progress.quizUnlocked.includes(id)) || null;
}

const MAX_LEVEL = 30;

/** One-line hints for hub / battle overlay (short, kid-friendly). */
function getProgressionNextLines(progress) {
  const lines = [];
  const p = progress;
  const curLv = Math.min(p.level, MAX_LEVEL);
  const bNext = getNextBaseAnimalId(p);
  if (bNext) {
    const needLv = BASE_UNLOCK_LEVEL[bNext];
    const nm = ANIMALS[bNext].name;
    if (needLv != null && needLv === curLv && p.level <= MAX_LEVEL) {
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
  } else if (!legendaryLevelGateMet(p)) {
    lines.push(`<strong>Next goal:</strong> Beat Level 12 to open <strong>Legendary Beasts</strong>, then quiz in the Forge.`);
  } else if (getNextLegendaryAnimalId(p)) {
    const id = getNextLegendaryAnimalId(p);
    lines.push(`<strong>Next goal:</strong> Pass the <strong>${ANIMALS[id].name}</strong> Legendary quiz in the Forge.`);
  } else if (!mythicalLevelGateMet(p)) {
    lines.push(`<strong>Next goal:</strong> Beat Level 16 to open <strong>Mythical Gods</strong>, then quiz in the Forge.`);
  } else if (getNextMythicalAnimalId(p)) {
    const id = getNextMythicalAnimalId(p);
    lines.push(`<strong>Next goal:</strong> Pass the <strong>${ANIMALS[id].name}</strong> Mythical quiz in the Forge.`);
  } else if (!egyptianTierQuizOpen(p)) {
    lines.push(`<strong>⚱️ Almost there:</strong> Recruit every <strong>Mythical God</strong> to unlock <strong>Egyptian Guardians</strong>.`);
  } else if (getNextEgyptianAnimalId(p)) {
    const id = getNextEgyptianAnimalId(p);
    lines.push(`<strong>⚱️ Egyptian Guardians Unlocked!</strong> Pass the <strong>${ANIMALS[id].name}</strong> quiz in the Forge.`);
  } else if (!knightTierQuizOpen(p)) {
    lines.push(`<strong>🛡️ Almost there:</strong> Recruit every <strong>Egyptian Guardian</strong> to unlock <strong>Knights of the Realm</strong>.`);
  } else if (getNextKnightAnimalId(p)) {
    const id = getNextKnightAnimalId(p);
    lines.push(`<strong>🛡️ Knights of the Realm Unlocked!</strong> Pass the <strong>${ANIMALS[id].name}</strong> quiz in the Forge.`);
  } else {
    lines.push(`<strong>You cleared the full roster!</strong> Push levels, coins, and leaderboard rank.`);
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
      return canAccessStage(progress, STAGE_APEX) && apexLevelGateMet(progress) && progress.quizUnlocked.includes(id);
    }
    if (a.stage === STAGE_DINO) {
      return canAccessStage(progress, STAGE_DINO) && dinoLevelGateMet(progress) && progress.quizUnlocked.includes(id);
    }
    if (a.stage === STAGE_LEGENDARY) {
      return canAccessStage(progress, STAGE_LEGENDARY) && legendaryLevelGateMet(progress) && progress.quizUnlocked.includes(id);
    }
    if (a.stage === STAGE_MYTHICAL) {
      return canAccessStage(progress, STAGE_MYTHICAL) && mythicalLevelGateMet(progress) && progress.quizUnlocked.includes(id);
    }
    if (a.stage === STAGE_EGYPTIAN) {
      return canAccessStage(progress, STAGE_EGYPTIAN) && egyptianTierQuizOpen(progress) && progress.quizUnlocked.includes(id);
    }
    if (a.stage === STAGE_KNIGHTS) {
      return canAccessStage(progress, STAGE_KNIGHTS) && knightTierQuizOpen(progress) && progress.quizUnlocked.includes(id);
    }
    return false;
  });
}

function isQuizEligible(id, progress) {
  const a = ANIMALS[id];
  if (!a || a.stage === STAGE_BASE) return false;
  if (progress.quizUnlocked.includes(id)) return false;
  if (a.stage === STAGE_APEX) return canAccessStage(progress, STAGE_APEX) && apexLevelGateMet(progress);
  if (a.stage === STAGE_DINO) return canAccessStage(progress, STAGE_DINO) && dinoLevelGateMet(progress);
  if (a.stage === STAGE_LEGENDARY) return canAccessStage(progress, STAGE_LEGENDARY) && legendaryLevelGateMet(progress);
  if (a.stage === STAGE_MYTHICAL) return canAccessStage(progress, STAGE_MYTHICAL) && mythicalLevelGateMet(progress);
  if (a.stage === STAGE_EGYPTIAN) return canAccessStage(progress, STAGE_EGYPTIAN) && egyptianTierQuizOpen(progress);
  if (a.stage === STAGE_KNIGHTS) return canAccessStage(progress, STAGE_KNIGHTS) && knightTierQuizOpen(progress);
  return false;
}

function isLevelLocked(id, progress) {
  const a = ANIMALS[id];
  if (a.stage === STAGE_APEX) return progress.level < 6;
  if (a.stage === STAGE_DINO) return progress.level < 9;
  if (a.stage === STAGE_LEGENDARY) return progress.level < 13;
  if (a.stage === STAGE_MYTHICAL) return progress.level < 17;
  if (a.stage === STAGE_EGYPTIAN) return !egyptianTierQuizOpen(progress);
  if (a.stage === STAGE_KNIGHTS) return !knightTierQuizOpen(progress);
  return false;
}

function unlockGateLinesForAnimal(id, progress) {
  const a = ANIMALS[id];
  if (a.stage === STAGE_BASE && !isBaseAnimalUnlocked(id, progress)) {
    const needLv = BASE_UNLOCK_LEVEL[id];
    if (needLv == null) return [{ ok: false, text: 'Play levels to recruit' }];
    return [{ ok: progress.level > needLv, text: `Beat Level ${needLv}` }];
  }
  if (a.stage === STAGE_APEX) {
    return [
      { ok: apexLevelGateMet(progress), text: 'Beat Level 5' },
      { ok: progress.quizUnlocked.includes(id), text: 'Pass Apex quiz' },
    ];
  }
  if (a.stage === STAGE_DINO) {
    return [
      { ok: dinoLevelGateMet(progress), text: 'Beat Level 8' },
      { ok: progress.quizUnlocked.includes(id), text: 'Pass Dino quiz' },
    ];
  }
  if (a.stage === STAGE_LEGENDARY) {
    return [
      { ok: legendaryLevelGateMet(progress), text: 'Beat Level 12' },
      { ok: progress.quizUnlocked.includes(id), text: 'Pass Legendary quiz' },
    ];
  }
  if (a.stage === STAGE_MYTHICAL) {
    return [
      { ok: mythicalLevelGateMet(progress), text: 'Beat Level 16' },
      { ok: progress.quizUnlocked.includes(id), text: 'Pass Mythical quiz' },
    ];
  }
  if (a.stage === STAGE_EGYPTIAN) {
    return [
      { ok: egyptianTierQuizOpen(progress), text: 'Recruit every Mythical God (quizzes)' },
      { ok: progress.quizUnlocked.includes(id), text: 'Pass Egyptian quiz' },
    ];
  }
  if (a.stage === STAGE_KNIGHTS) {
    return [
      { ok: knightTierQuizOpen(progress), text: 'Recruit every Egyptian Guardian (quizzes)' },
      { ok: progress.quizUnlocked.includes(id), text: 'Pass Knight quiz' },
    ];
  }
  return null;
}

function quizUiTierType(animalId) {
  const stage = ANIMALS[animalId]?.stage;
  if (stage === STAGE_KNIGHTS) return 'knights';
  if (stage === STAGE_EGYPTIAN) return 'egyptian';
  if (stage === STAGE_MYTHICAL) return 'mythical';
  if (stage === STAGE_LEGENDARY) return 'legendary';
  if (stage === STAGE_DINO) return 'dino';
  return 'apex';
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
  if (!MONETIZE_PLACEHOLDER.legendaryStageOwned && legendaryLevelGateMet(progress) && countLegendaryUnlocked(progress) < LEGENDARY_IDS.length) {
    lines.push('<span class="soft-gate-pill">Unlock Legendary</span> Or earn each beast with <strong>Legendary quizzes</strong>.');
  }
  if (!MONETIZE_PLACEHOLDER.mythicalStageOwned && mythicalLevelGateMet(progress) && countMythicalUnlocked(progress) < MYTHICAL_IDS.length) {
    lines.push('<span class="soft-gate-pill">Unlock Mythical</span> Or earn each god with <strong>Mythical quizzes</strong>.');
  }
  if (!MONETIZE_PLACEHOLDER.egyptianStageOwned && egyptianTierQuizOpen(progress) && countEgyptianUnlocked(progress) < EGYPTIAN_IDS.length) {
    lines.push('<span class="soft-gate-pill">Unlock Egyptian</span> Or earn each guardian with <strong>Egyptian quizzes</strong>.');
  }
  if (!MONETIZE_PLACEHOLDER.knightsStageOwned && knightTierQuizOpen(progress) && countKnightsUnlocked(progress) < KNIGHT_IDS.length) {
    lines.push('<span class="soft-gate-pill">Unlock Knights</span> Or earn each knight with <strong>Knights quizzes</strong>.');
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
  countLegendaryUnlocked,
  countMythicalUnlocked,
  countEgyptianUnlocked,
  countKnightsUnlocked,
  egyptianTierQuizOpen,
  knightTierQuizOpen,
  apexLevelGateMet,
  dinoLevelGateMet,
  legendaryLevelGateMet,
  mythicalLevelGateMet,
  getPlayerStageLabel,
  BASE_UNLOCK_LEVEL,
  MAX_LEVEL,
  getNextBaseAnimalId,
  getNextApexAnimalId,
  getNextDinoAnimalId,
  getNextLegendaryAnimalId,
  getNextMythicalAnimalId,
  getNextEgyptianAnimalId,
  getNextKnightAnimalId,
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