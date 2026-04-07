import { STARTER_BASE_IDS } from '../data/animals.js';

let state = {
  profile: null, // { uid, email, username, leaderboardOptIn }
  progress: null,
  playerHybrid: null,
  enemyHybrid: null,
  battle: null,
  selectedAnimals: [],
  quizReturnScreen: 'builder', // where to go after quiz
  /** Bumped on each startBattle(); stale finishBattle timers ignore transitions. */
  battleFlowGen: 0,
};

const UNLOCK_QUIZ_SESSION_LEN = 3;

const quizState = {
  animalId: null,
  currentQ: 0,
  correctCount: 0,
  answered: false,
  /** Shuffled subset of the bank for this attempt (length UNLOCK_QUIZ_SESSION_LEN). */
  sessionQuestions: null,
};

export function resetQuizState(data) {
  Object.assign(quizState, {
    animalId: null, currentQ: 0, correctCount: 0, answered: false, sessionQuestions: null,
    ...data,
  });
}

const COIN_TUNING_COST = 12;
const TOKEN_RECRUIT_COST = 5;
const XP_PER_BATTLE_WIN = 28;

const COMMANDER_XP_SEGMENT = 50;

let levelCompleteAutoNavTimer = null;
let defeatReturnToHubTimer = null;

function clearLevelCompleteAutoNav() {
  if (levelCompleteAutoNavTimer) {
    clearTimeout(levelCompleteAutoNavTimer);
    levelCompleteAutoNavTimer = null;
  }
}
export function setLevelCompleteAutoNavTimer(v) { levelCompleteAutoNavTimer = v; }

function clearDefeatAutoReturn() {
  if (defeatReturnToHubTimer) {
    clearTimeout(defeatReturnToHubTimer);
    defeatReturnToHubTimer = null;
  }
}
export function setDefeatReturnToHubTimer(v) { defeatReturnToHubTimer = v; }

function defaultProgress() {
  return {
    level: 1,
    unlockedAnimals: [...STARTER_BASE_IDS],
    quizUnlocked: [],
    totalWins: 0,
    totalLosses: 0,
    highestLevelReached: 0,
    streakCount: 0,
    lastPlayedDate: null,
    progressSchemaVersion: 1,
    stageAccess: { base: true, apex: true, dinosaur: true, legendary: true, mythical: true },
    coins: 0,
    unlockTokens: 0,
    dailyChallengeDayKey: null,
    dailyWinsToday: 0,
    dailyChallengeRewardClaimed: false,
    totalQuizQuestions: 0,
    totalQuizCorrect: 0,
    /** Meta XP — wins only; drives Hub progress bar (not campaign level). */
    commanderXp: 0,
  };
}

const MONETIZE_PLACEHOLDER = {
  fullBaseStageOwned: true,
  apexStageOwned: true,
  dinosaurStageOwned: true,
  legendaryStageOwned: true,
  mythicalStageOwned: true,
};

export {
  state,
  quizState,
  defaultProgress,
  UNLOCK_QUIZ_SESSION_LEN,
  COIN_TUNING_COST,
  TOKEN_RECRUIT_COST,
  XP_PER_BATTLE_WIN,
  COMMANDER_XP_SEGMENT,
  MONETIZE_PLACEHOLDER,
  clearLevelCompleteAutoNav,
  clearDefeatAutoReturn,
};