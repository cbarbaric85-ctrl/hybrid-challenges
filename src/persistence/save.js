import {
  userDocRef,
  setDoc, serverTimestamp,
} from '../firebase.js';
import {
  ANIMALS, APEX_IDS, DINO_IDS, STARTER_BASE_IDS,
} from '../data/animals.js';
import { state, defaultProgress } from '../game/state.js';

// Forward-declare: set by persistence/leaderboard.js to avoid circular dep
let _syncLeaderboardEntry = async () => { console.warn('syncLeaderboardEntry not wired yet'); return false; };
export function _setSyncLeaderboardEntry(fn) { _syncLeaderboardEntry = fn; }

function normalizeProgress(p) {
  if (!p.quizUnlocked) p.quizUnlocked = [];
  if (p.highestLevelReached == null) p.highestLevelReached = 0;
  if (p.streakCount == null) p.streakCount = 0;
  if (!p.stageAccess) p.stageAccess = { base: true, apex: true, dinosaur: true, legendary: true, mythical: true, egyptian: true };
  else {
    if (p.stageAccess.legendary == null) p.stageAccess.legendary = true;
    if (p.stageAccess.mythical == null) p.stageAccess.mythical = true;
    if (p.stageAccess.egyptian == null) p.stageAccess.egyptian = true;
  }
  if (p.progressSchemaVersion == null) p.progressSchemaVersion = 0;
  if (p.coins == null) p.coins = 0;
  if (p.unlockTokens == null) p.unlockTokens = 0;
  if (p.dailyWinsToday == null) p.dailyWinsToday = 0;
  if (p.dailyChallengeRewardClaimed == null) p.dailyChallengeRewardClaimed = false;
  if (p.totalQuizQuestions == null) p.totalQuizQuestions = 0;
  if (p.totalQuizCorrect == null) p.totalQuizCorrect = 0;
  if (p.commanderXp == null) p.commanderXp = 0;
  if (p.factionXP == null) p.factionXP = 0;
  if (!Array.isArray(p.factionUnlocked)) p.factionUnlocked = [];
  if (p.faction != null && typeof p.faction !== 'string') p.faction = null;
  return p;
}

/** Kid-safe display name for hybrid; falls back to generated code-name. */
function sanitizeHybridName(raw, fallback) {
  const fb = (fallback || 'HYBRID').slice(0, 24);
  if (raw == null || typeof raw !== 'string') return fb;
  let s = raw.replace(/[\u0000-\u001F<>]/g, '').trim().slice(0, 24);
  if (!s) return fb;
  return s;
}

function computeQuizAccuracy(progress) {
  const t = progress?.totalQuizQuestions ?? 0;
  if (t <= 0) return null;
  const c = Math.min(progress.totalQuizCorrect ?? 0, t);
  return Math.round((100 * c) / t);
}

function recordQuizAnswers(progress, questionsAnswered, correctCount) {
  if (!progress || questionsAnswered <= 0) return;
  const q = Math.max(0, Math.floor(questionsAnswered));
  const ok = Math.max(0, Math.min(Math.floor(correctCount), q));
  progress.totalQuizQuestions = (progress.totalQuizQuestions || 0) + q;
  progress.totalQuizCorrect = (progress.totalQuizCorrect || 0) + ok;
}

/** Safe migration for saves from before 3-stage roster (implicit free tier-1, apex string, etc.). */
function applyProgressMigration(p) {
  if (p.progressSchemaVersion >= 1) return;
  const played =
    p.level > 1 ||
    p.totalWins + p.totalLosses > 0 ||
    (p.unlockedAnimals && p.unlockedAnimals.length > 0) ||
    p.highestLevelReached > 0 ||
    (p.quizUnlocked && p.quizUnlocked.length > 0);
  const legacyFreeBase = ['wolf', 'bear', 'eagle', 'lion', 'cheetah', 'gorilla', 'dolphin', 'croc'];
  if (played) {
    for (const id of legacyFreeBase) {
      if (!p.unlockedAnimals.includes(id)) p.unlockedAnimals.push(id);
    }
  } else if (!p.unlockedAnimals.length) {
    p.unlockedAnimals = [...STARTER_BASE_IDS];
  }
  p.unlockedAnimals = [...new Set(p.unlockedAnimals)].filter(id => id !== 'apex' && ANIMALS[id]);
  p.progressSchemaVersion = 1;
}

function firestoreDataToProgress(data) {
  if (!data) return normalizeProgress(defaultProgress());
  const apex = data.unlockedApex || [];
  const dinos = data.unlockedDinosaurs || [];
  const quizUnlocked = [...new Set([...apex, ...dinos])].filter(id => ANIMALS[id]);
  const rawUnlocked = data.unlockedAnimals ? [...data.unlockedAnimals] : [];
  const p = {
    level: data.currentLevel ?? 1,
    unlockedAnimals: rawUnlocked.filter(id => id !== 'apex' && ANIMALS[id]),
    quizUnlocked,
    totalWins: data.totalWins ?? 0,
    totalLosses: data.totalLosses ?? 0,
    highestLevelReached: data.highestLevelReached ?? 0,
    streakCount: data.streakCount ?? 0,
    lastPlayedDate: data.lastPlayedDate ?? null,
    progressSchemaVersion: data.progressSchemaVersion ?? 0,
    coins: data.coins ?? data.fusionCoins ?? 0,
    unlockTokens: data.unlockTokens ?? 0,
    dailyChallengeDayKey: data.dailyChallengeDayKey ?? null,
    dailyWinsToday: data.dailyWinsToday ?? 0,
    dailyChallengeRewardClaimed: data.dailyChallengeRewardClaimed === true,
    totalQuizQuestions: data.totalQuizQuestions ?? 0,
    totalQuizCorrect: data.totalQuizCorrect ?? 0,
    commanderXp: data.commanderXp ?? 0,
    faction: typeof data.faction === 'string' ? data.faction : null,
    factionXP: data.factionXP ?? 0,
    factionUnlocked: Array.isArray(data.factionUnlocked) ? [...data.factionUnlocked] : [],
    stageAccess: {
      base: data.stageAccess?.base !== false,
      apex: data.stageAccess?.apex !== false,
      dinosaur: data.stageAccess?.dinosaur !== false,
      legendary: data.stageAccess?.legendary !== false,
      mythical: data.stageAccess?.mythical !== false,
      egyptian: data.stageAccess?.egyptian !== false,
    },
  };
  normalizeProgress(p);
  applyProgressMigration(p);
  return p;
}

function serializeHybrid(h) {
  if (!h) return null;
  return {
    animals: [...h.animals],
    stats: { ...h.stats },
    sources: { ...h.sources },
    power: h.power,
    tierClass: h.tierClass,
    name: h.name,
    emojis: h.emojis,
    composition: h.composition,
  };
}

/** Default true; future settings toggle can set false on users/{uid} only. */
function isLeaderboardOptIn() {
  return state.profile?.leaderboardOptIn !== false;
}

function hybridPowerForLeaderboard() {
  return state.playerHybrid?.power ?? 0;
}

function docSnapshotExists(snap) {
  if (!snap) return false;
  return typeof snap.exists === 'function' ? snap.exists() : !!snap.exists;
}

/** True if public doc should be shown as on the board (legacy rows may omit the field). */
function publicDocShowsAsOptedIn(d) {
  if (!d || d.leaderboardOptIn === false) return false;
  return true;
}

async function saveUserProgress(progress) {
  const uid = state.profile?.uid;
  if (!uid || !progress) return;
  const p = progress;
  const apex = (p.quizUnlocked || []).filter(id => APEX_IDS.includes(id));
  const dinos = (p.quizUnlocked || []).filter(id => DINO_IDS.includes(id));
  const optIn = isLeaderboardOptIn();
  await setDoc(
    userDocRef(uid),
    {
      uid,
      username: state.profile.username,
      email: state.profile.email,
      currentLevel: p.level,
      highestLevelReached: p.highestLevelReached ?? 0,
      unlockedAnimals: [...(p.unlockedAnimals || [])],
      unlockedApex: apex,
      unlockedDinosaurs: dinos,
      selectedHybridAnimals: [...(state.selectedAnimals || [])],
      hybridStats: serializeHybrid(state.playerHybrid),
      totalWins: p.totalWins ?? 0,
      totalLosses: p.totalLosses ?? 0,
      streakCount: p.streakCount ?? 0,
      lastPlayedDate: p.lastPlayedDate ?? null,
      leaderboardOptIn: optIn,
      progressSchemaVersion: p.progressSchemaVersion ?? 1,
      coins: p.coins ?? 0,
      unlockTokens: p.unlockTokens ?? 0,
      dailyChallengeDayKey: p.dailyChallengeDayKey ?? null,
      dailyWinsToday: p.dailyWinsToday ?? 0,
      dailyChallengeRewardClaimed: p.dailyChallengeRewardClaimed === true,
      totalQuizQuestions: p.totalQuizQuestions ?? 0,
      totalQuizCorrect: p.totalQuizCorrect ?? 0,
      commanderXp: p.commanderXp ?? 0,
      faction: p.faction ?? null,
      factionXP: p.factionXP ?? 0,
      factionUnlocked: [...(p.factionUnlocked || [])],
      stageAccess: { ...(p.stageAccess || { base: true, apex: true, dinosaur: true }) },
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
  const lbOk = await _syncLeaderboardEntry(p);
  if (!lbOk) console.warn('[lb] saveUserProgress: public row publish failed', { uid });
}

function persistGameProgress() {
  if (!state.profile?.uid || !state.progress) return;
  return saveUserProgress(state.progress);
}

export {
  normalizeProgress,
  sanitizeHybridName,
  computeQuizAccuracy,
  recordQuizAnswers,
  applyProgressMigration,
  firestoreDataToProgress,
  serializeHybrid,
  isLeaderboardOptIn,
  hybridPowerForLeaderboard,
  docSnapshotExists,
  publicDocShowsAsOptedIn,
  saveUserProgress,
  persistGameProgress,
};