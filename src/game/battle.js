import { ANIMALS, STAT_MAX } from '../data/animals.js';
import { QUIZZES, PRE_BATTLE_QUESTIONS } from '../data/quizzes.js';
import { getArena } from '../data/arenas.js';
import { getWeather } from '../data/weather.js';
import { state, UNLOCK_QUIZ_SESSION_LEN } from './state.js';
import { powerScore } from './hybrid.js';
import { getActiveBattleBoosts } from './progression.js';
import { EMPTY_STAT_BOOST } from './utils.js';

const STAT_WEIGHTS = ['spd','spd','agi','agi','int','str','str','str'];
const STAT_LABELS = {spd:'SPEED',agi:'AGILITY',int:'INTELLIGENCE',str:'STRENGTH'};
const STAT_LABELS_SIMPLE = {spd:'Speed',agi:'Agility',int:'Intelligence',str:'Strength'};
const STAT_TRAIL_ICONS = { spd: '⚡', agi: '✦', int: '◇', str: '💪' };
const PRE_BATTLE_STAT_WORDS = { spd: 'speed', agi: 'agility', int: 'intelligence', str: 'strength' };

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}


function shuffleQuestionOpts(q) {
  const labels = [...q.opts];
  const correctLabel = labels[q.correct];
  const shuffled = shuffleArray(labels);
  return {
    ...q,
    opts: shuffled,
    correct: shuffled.indexOf(correctLabel),
  };
}

function preBattleQuestionSig(q) {
  return String(q.q || '')
    .slice(0, 120)
    .replace(/\s+/g, ' ');
}

/** Avoid the exact same question twice in a row per animal (sessionStorage). */
function pickPreBattleQuestionFromBank(animalId, bank) {
  const fallback = {
    q: `Which sounds like a real survival trick for a ${ANIMALS[animalId].name}?`,
    opts: ['Train enemies with jokes', 'Use senses + timing to catch food', 'Only sleep all day', 'Ignore danger'],
    correct: 1,
    boostStat: 'int',
    funFact: `${ANIMALS[animalId].name}s in the wild are tuned for sneak, speed, or power — never underestimate them.`,
  };
  if (!bank?.length) return { ...fallback };
  const key = `hw_pbq_${animalId}`;
  let lastSig = '';
  try {
    lastSig = sessionStorage.getItem(key) || '';
  } catch (_) {
    /* private mode */
  }
  const candidates = bank.filter(q => preBattleQuestionSig(q) !== lastSig);
  const pool = candidates.length ? candidates : bank;
  const pick = pool[Math.floor(Math.random() * pool.length)];
  try {
    sessionStorage.setItem(key, preBattleQuestionSig(pick));
  } catch (_) {
    /* ignore */
  }
  return { ...pick };
}

/** Unlock quiz: `questions` is the full bank; we draw UNLOCK_QUIZ_SESSION_LEN per attempt. */
function getUnlockQuizBank(animalId) {
  const quiz = QUIZZES[animalId];
  if (!quiz) return null;
  return quiz.questionPool || quiz.questions;
}

/**
 * Pick UNLOCK_QUIZ_SESSION_LEN distinct questions; avoid repeating the same index triple
 * as the last attempt when the pool is big enough.
 */
function pickUnlockSessionQuestions(animalId) {
  const pool = getUnlockQuizBank(animalId);
  if (!pool?.length) return [];
  const n = Math.min(UNLOCK_QUIZ_SESSION_LEN, pool.length);
  const key = `hw_uq_${animalId}`;
  let lastKey = '';
  try {
    lastKey = sessionStorage.getItem(key) || '';
  } catch (_) {
    /* ignore */
  }
  for (let attempt = 0; attempt < 14; attempt++) {
    const idxs = shuffleArray(pool.map((_, i) => i)).slice(0, n);
    idxs.sort((a, b) => a - b);
    const sig = idxs.join(',');
    if (pool.length <= n || sig !== lastKey || attempt > 10) {
      try {
        sessionStorage.setItem(key, sig);
      } catch (_) {
        /* ignore */
      }
      return idxs.map(i => shuffleQuestionOpts({ ...pool[i] }));
    }
  }
  return shuffleArray(pool.map((_, i) => i))
    .slice(0, n)
    .sort((a, b) => a - b)
    .map(i => shuffleQuestionOpts({ ...pool[i] }));
}

/** One fact question per team animal; +1 boostStat for this battle if correct. */
function buildPreBattleQuizForAnimals(animalIds) {
  return animalIds.map(animalId => {
    const bank = PRE_BATTLE_QUESTIONS[animalId];
    const pick = pickPreBattleQuestionFromBank(animalId, bank);
    const raw = {
      ...pick,
      animalId,
      emoji: ANIMALS[animalId].emoji,
      name: ANIMALS[animalId].name,
    };
    return shuffleQuestionOpts(raw);
  });
}

function scrollToBattlePreQuiz() {
  requestAnimationFrame(() => {
    document.getElementById('battle-prephase')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

/** Main clash / meters — primary focus during the fight */
function scrollToBattleFocus() {
  requestAnimationFrame(() => {
    document.getElementById('battle-zone-focus')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}

function scrollToBattleTrail() {
  requestAnimationFrame(() => {
    document.getElementById('battle-zone-trail')?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  });
}

function scrollToBattleStageArea() {
  scrollToBattleFocus();
}

function hybridWithTempBoost(player, boosts) {
  if (!player || !boosts) return player;
  const stats = { ...player.stats };
  for (const k of ['spd', 'agi', 'int', 'str']) stats[k] += boosts[k] || 0;
  return { ...player, stats, power: powerScore(stats) };
}

/** Player side shown in arena: base stats during pre-quiz; boosted after quiz. */
function getBattleDisplayPlayerHybrid() {
  const b = state.battle;
  const h = state.playerHybrid;
  if (!h) return null;
  if (!b || b.phase === 'pre_quiz') return h;
  return hybridWithTempBoost(h, getActiveBattleBoosts());
}

function roll(sides) { return Math.ceil(Math.random() * sides); }

function simulateRound(player, enemy) {
  const stat = STAT_WEIGHTS[Math.floor(Math.random() * STAT_WEIGHTS.length)];
  const pBase = player.stats[stat];
  const eBase = enemy.stats[stat];
  const pRoll = roll(6);
  const eRoll = roll(6) + (enemy.diceBonus || 0);
  const pTotal = pBase + pRoll;
  const eTotal = eBase + eRoll;
  return {
    stat, statLabel:STAT_LABELS[stat],
    pBase,pRoll,pTotal, eBase,eRoll,eTotal,
    winner: pTotal > eTotal ? 'player' : pTotal < eTotal ? 'enemy' : 'tie',
  };
}

function applyArenaMods(hybrid, arenaId) {
  if (!arenaId) return hybrid;
  const arena = getArena(arenaId);
  if (!arena?.statMods) return hybrid;
  const stats = { ...hybrid.stats };
  for (const k of ['spd', 'agi', 'int', 'str']) {
    stats[k] = Math.max(1, stats[k] + (arena.statMods[k] || 0));
  }
  return { ...hybrid, stats, power: powerScore(stats) };
}

function applyWeatherMods(hybrid, weatherId) {
  if (!weatherId) return hybrid;
  const w = getWeather(weatherId);
  if (!w?.statMods) return hybrid;
  const stats = { ...hybrid.stats };
  for (const k of ['spd', 'agi', 'int', 'str']) {
    stats[k] = Math.max(1, stats[k] + (w.statMods[k] || 0));
  }
  return { ...hybrid, stats, power: powerScore(stats) };
}

function applyBossBoost(hybrid, bossAbility) {
  if (!bossAbility) return hybrid;
  const stats = { ...hybrid.stats };
  const k = bossAbility.stat;
  if (k && stats[k] != null) {
    stats[k] += bossAbility.bonus || 0;
  }
  return { ...hybrid, stats, power: powerScore(stats) };
}

/** Pharaoh King (+1 all stats, capped) when forged into the team. */
function applyRoyalCommandBoost(fighter, hybrid) {
  if (!fighter?.stats || !hybrid?.animals?.length) return fighter;
  const hasRoyal = hybrid.animals.some(id => ANIMALS[id]?.battleAbility?.type === 'royal_command');
  if (!hasRoyal) return fighter;
  const stats = { ...fighter.stats };
  for (const k of ['spd', 'agi', 'int', 'str']) {
    stats[k] = Math.min(STAT_MAX, stats[k] + 1);
  }
  return { ...fighter, stats, power: powerScore(stats) };
}

/**
 * Per-round bonuses from tier battleAbility hooks.
 * @param {object} [battleCtx] roundIdx (0-based), interactiveEWins / interactivePWins for last_stand.
 */
function hybridAbilityRoundBonus(hybrid, stat, playerLostLastRound, battleCtx = {}) {
  const { roundIdx = 0, interactiveEWins = 0, interactivePWins = 0 } = battleCtx;
  let bonus = 0;
  const messages = [];
  if (!hybrid?.animals) return { bonus, messages };
  for (const id of hybrid.animals) {
    const ba = ANIMALS[id]?.battleAbility;
    if (!ba || ba.type === 'royal_command') continue;
    if (ba.type === 'stat_bonus' && ba.stat === stat) {
      bonus += ba.amount || 0;
      if (ba.flash) messages.push(ba.flash);
    } else if (ba.type === 'stat_pair_bonus' && ba.stats?.includes(stat)) {
      bonus += ba.amount || 0;
      if (ba.flash) messages.push(ba.flash);
    } else if (ba.type === 'bonus_after_loss' && playerLostLastRound) {
      bonus += ba.amount || 0;
      if (ba.flash) messages.push(ba.flash);
    } else if (ba.type === 'inspire_round' && roundIdx === ba.roundIndex) {
      bonus += ba.amount || 0;
      if (ba.flash) messages.push(ba.flash);
    } else if (
      ba.type === 'last_stand' &&
      stat === ba.stat &&
      interactiveEWins >= (ba.minEnemyWins ?? 2)
    ) {
      bonus += ba.amount || 0;
      if (ba.flash) messages.push(ba.flash);
    }
  }
  return { bonus, messages };
}

/** Pick the stat category for a single round using weighted distribution. */
function pickRoundStat() {
  return STAT_WEIGHTS[Math.floor(Math.random() * STAT_WEIGHTS.length)];
}

/** Resolve one round with a known stat and optional player bonus (e.g. +2 from quiz). */
function resolveRound(player, enemy, stat, playerBonus) {
  const pBase = player.stats[stat];
  const eBase = enemy.stats[stat];
  const pRoll = roll(6);
  const eRoll = roll(6) + (enemy.diceBonus || 0);
  const pTotal = pBase + (playerBonus || 0) + pRoll;
  const eTotal = eBase + eRoll;
  return {
    stat, statLabel: STAT_LABELS[stat],
    pBase, pBonus: playerBonus || 0, pRoll, pTotal,
    eBase, eRoll, eTotal,
    winner: pTotal > eTotal ? 'player' : pTotal < eTotal ? 'enemy' : 'tie',
  };
}

/**
 * Pipeline: Arena → Weather → Boss → Abilities → Rounds
 * bossAbility only applies to the enemy.
 */
function runFullBattle(player, enemy, quizBoosts, arenaId, weatherId, bossAbility) {
  let pFighter = quizBoosts && Object.values(quizBoosts).some(n => n > 0)
    ? hybridWithTempBoost(player, quizBoosts)
    : player;
  pFighter = applyArenaMods(pFighter, arenaId);
  pFighter = applyWeatherMods(pFighter, weatherId);
  let eFighter = applyArenaMods(enemy, arenaId);
  eFighter = applyWeatherMods(eFighter, weatherId);
  eFighter = applyBossBoost(eFighter, bossAbility);
  const rounds = [];
  for (let i = 0; i < 5; i++) rounds.push(simulateRound(pFighter, eFighter));
  const pWins = rounds.filter(r => r.winner === 'player').length;
  const eWins = rounds.filter(r => r.winner === 'enemy').length;
  return { rounds, pWins, eWins, winner: pWins >= 3 ? 'player' : 'enemy' };
}

export {
  STAT_WEIGHTS,
  STAT_LABELS,
  STAT_LABELS_SIMPLE,
  STAT_TRAIL_ICONS,
  PRE_BATTLE_STAT_WORDS,
  EMPTY_STAT_BOOST,
  shuffleArray,
  shuffleQuestionOpts,
  preBattleQuestionSig,
  pickPreBattleQuestionFromBank,
  getUnlockQuizBank,
  pickUnlockSessionQuestions,
  buildPreBattleQuizForAnimals,
  scrollToBattlePreQuiz,
  scrollToBattleFocus,
  scrollToBattleTrail,
  scrollToBattleStageArea,
  hybridWithTempBoost,
  getBattleDisplayPlayerHybrid,
  applyArenaMods,
  applyWeatherMods,
  applyBossBoost,
  applyRoyalCommandBoost,
  hybridAbilityRoundBonus,
  roll,
  simulateRound,
  pickRoundStat,
  resolveRound,
  runFullBattle,
};
