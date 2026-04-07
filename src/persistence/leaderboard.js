import {
  db, leaderboardDocRef,
  getDoc, setDoc, serverTimestamp,
  collection, query, where, orderBy, limit, getDocs,
} from '../firebase.js';
import { state } from '../game/state.js';
import {
  isLeaderboardOptIn, hybridPowerForLeaderboard,
  docSnapshotExists, sanitizeHybridName, computeQuizAccuracy,
  _setSyncLeaderboardEntry,
} from './save.js';
import { hybridName } from '../game/hybrid.js';

async function writeLeaderboardBootstrapDoc(uid, username) {
  if (!uid) return false;
  try {
    const payload = {
      uid,
      username: String(username || 'Commander').slice(0, 40),
      hybridName: '',
      highestLevelReached: 0,
      currentCampaignLevel: 1,
      totalWins: 0,
      hybridPowerScore: 0,
      commanderXp: 0,
      totalQuizQuestions: 0,
      totalQuizCorrect: 0,
      quizAccuracy: null,
      leaderboardOptIn: true,
      updatedAt: serverTimestamp(),
    };
    console.log('[lb] bootstrap public row payload', { uid, keys: Object.keys(payload) });
    await setDoc(leaderboardDocRef(uid), payload, { merge: true });
    console.log('[lb] bootstrap public row write success', { uid });
    return true;
  } catch (e) {
    console.error('[lb] bootstrap public row write failed', {
      uid,
      code: e?.code,
      message: e?.message,
      err: e,
    });
    return false;
  }
}

/** Deterministic public doc at leaderboardEntries/{uid} — never stores email. @returns {Promise<boolean>} */
async function syncLeaderboardEntry(progress) {
  const uid = state.profile?.uid;
  if (!uid || !progress) {
    console.log('[lb] public row sync skip — no uid or progress');
    return false;
  }
  const ref = leaderboardDocRef(uid);
  try {
    if (!isLeaderboardOptIn()) {
      console.log('[lb] public row sync start (opt-out stub)', { uid });
      const payload = {
        uid,
        leaderboardOptIn: false,
        updatedAt: serverTimestamp(),
      };
      await setDoc(ref, payload, { merge: true });
      console.log('[lb] public row write success (opt-out stub)', { uid });
      return true;
    }
    const acc = computeQuizAccuracy(progress);
    const pubName = sanitizeHybridName(
      state.playerHybrid?.name,
      state.playerHybrid ? hybridName(state.playerHybrid.animals) : ''
    );
    const hl = Math.max(0, Math.floor(Number(progress.highestLevelReached) || 0));
    const payload = {
      uid,
      username: String(state.profile.username || 'Commander').slice(0, 40),
      hybridName: pubName || '',
      highestLevelReached: hl,
      currentCampaignLevel: Math.max(1, Math.floor(Number(progress.level) || 1)),
      totalWins: Math.max(0, Math.floor(Number(progress.totalWins) || 0)),
      hybridPowerScore: Math.max(0, Math.floor(Number(hybridPowerForLeaderboard()) || 0)),
      commanderXp: Math.max(0, Math.floor(Number(progress.commanderXp) || 0)),
      totalQuizQuestions: Math.max(0, Math.floor(Number(progress.totalQuizQuestions) || 0)),
      totalQuizCorrect: Math.max(0, Math.floor(Number(progress.totalQuizCorrect) || 0)),
      quizAccuracy: acc != null ? acc : null,
      leaderboardOptIn: true,
      updatedAt: serverTimestamp(),
    };
    console.log('[lb] public row sync start (opt-in)', { uid });
    console.log('[lb] public row payload (timestamps omitted in logs)', {
      ...payload,
      updatedAt: '[serverTimestamp]',
    });
    await setDoc(ref, payload, { merge: true });
    console.log('[lb] public row write success (opt-in)', { uid });
    return true;
  } catch (e) {
    console.error('[lb] public row write failed', {
      uid,
      code: e?.code,
      message: e?.message,
      err: e,
    });
    return false;
  }
}

/**
 * Publish then read leaderboardEntries/{uid}. Retries if the row is missing (failed write, cold start, rules delay).
 * @returns {{ snap: object|null, myPublic: object|null }}
 */
async function ensureMyPublicLeaderboardDocLoaded() {
  const uid = state.profile?.uid;
  const progress = state.progress;
  if (!uid || !progress) {
    console.log('[lb] ensure public row skip — no uid or progress');
    return { snap: null, myPublic: null };
  }
  try {
    const ref = leaderboardDocRef(uid);
    const readOnce = async label => {
      const snap = await getDoc(ref);
      const ex = docSnapshotExists(snap);
      console.log('[lb] public row fetch', { label, uid, path: `leaderboardEntries/${uid}`, exists: ex });
      return snap;
    };

    let snap = await readOnce('before-ensure');

    const finalize = () => {
      if (!docSnapshotExists(snap)) return { snap, myPublic: null };
      const raw = snap.data();
      const myPublic = raw && typeof raw === 'object' ? { ...raw } : null;
      if (myPublic && myPublic.leaderboardOptIn !== true && myPublic.leaderboardOptIn !== false) {
        myPublic.leaderboardOptIn = true;
      }
      if (myPublic && (myPublic.highestLevelReached == null || myPublic.highestLevelReached === '')) {
        myPublic.highestLevelReached = 0;
      }
      if (myPublic && (myPublic.hybridPowerScore == null || myPublic.hybridPowerScore === '')) {
        myPublic.hybridPowerScore = 0;
      }
      if (myPublic && (myPublic.totalWins == null || myPublic.totalWins === '')) {
        myPublic.totalWins = 0;
      }
      return { snap, myPublic };
    };

    if (docSnapshotExists(snap)) return finalize();

    if (!isLeaderboardOptIn()) {
      await syncLeaderboardEntry(progress);
      snap = await readOnce('after opt-out publish');
      return finalize();
    }

    console.log('[lb] ensure public row — missing doc, publishing pipeline', { uid });
    let ok = await syncLeaderboardEntry(progress);
    console.log('[lb] ensure publish pass 1', { ok });
    snap = await readOnce('after publish 1');
    if (docSnapshotExists(snap)) return finalize();

    ok = await writeLeaderboardBootstrapDoc(uid, state.profile.username);
    console.log('[lb] ensure bootstrap', { ok });
    ok = await syncLeaderboardEntry(progress);
    console.log('[lb] ensure publish pass 2', { ok });
    snap = await readOnce('after publish 2');
    if (docSnapshotExists(snap)) return finalize();

    await new Promise(r => setTimeout(r, 500));
    snap = await readOnce('after cooldown');
    return finalize();
  } catch (e) {
    console.error('[lb] ensureMyPublicLeaderboardDocLoaded failed', { uid, code: e?.code, message: e?.message });
    return { snap: null, myPublic: null };
  }
}

/**
 * Backfill: read leaderboardEntries/{uid}; if missing, bootstrap + sync.
 * Safe to call repeatedly (merge writes are idempotent).
 * @returns {Promise<boolean>} true if a doc exists (or was just created)
 */
async function backfillLeaderboardIfMissing() {
  const uid = state.profile?.uid;
  const progress = state.progress;
  if (!uid || !progress) {
    console.log('[lb-backfill] skip — no uid or progress');
    return false;
  }
  try {
    const ref = leaderboardDocRef(uid);
    const snap = await getDoc(ref);
    const exists = docSnapshotExists(snap);
    console.log('[lb-backfill] check', { uid, path: `leaderboardEntries/${uid}`, exists });
    if (exists) return true;

    console.log('[lb-backfill] public row MISSING — creating now', { uid });
    const bOk = await writeLeaderboardBootstrapDoc(uid, state.profile.username);
    console.log('[lb-backfill] bootstrap result', { bOk });
    const sOk = await syncLeaderboardEntry(progress);
    console.log('[lb-backfill] sync result', { sOk });

    const verify = await getDoc(ref);
    const created = docSnapshotExists(verify);
    console.log('[lb-backfill] verify after create', { uid, created });
    return created;
  } catch (e) {
    console.error('[lb-backfill] error', { uid, code: e?.code, message: e?.message });
    return false;
  }
}


function normalizeLeaderboardQueryRow(d) {
  const x = d.data();
  return {
    ...x,
    _id: d.id,
    highestLevelReached: Math.max(0, Math.floor(Number(x.highestLevelReached) || 0)),
    hybridPowerScore: Math.max(0, Math.floor(Number(x.hybridPowerScore) || 0)),
    totalWins: Math.max(0, Math.floor(Number(x.totalWins) || 0)),
  };
}

function sortLeaderboardRows(rows) {
  return [...rows].sort((a, b) => {
    const hl = (b.highestLevelReached || 0) - (a.highestLevelReached || 0);
    if (hl !== 0) return hl;
    const hp = (b.hybridPowerScore || 0) - (a.hybridPowerScore || 0);
    if (hp !== 0) return hp;
    return (b.totalWins || 0) - (a.totalWins || 0);
  });
}

/** Top 100 for rank lookup; UI shows first 25. */
async function fetchLeaderboardTop25() {
  try {
    const q = query(
      collection(db, 'leaderboardEntries'),
      where('leaderboardOptIn', '==', true),
      orderBy('highestLevelReached', 'desc'),
      limit(100)
    );
    const snap = await getDocs(q);
    const rows = sortLeaderboardRows(snap.docs.map(normalizeLeaderboardQueryRow));
    return rows.slice(0, 25);
  } catch (e) {
    console.error('[lb] fetchLeaderboardTop25 failed', { code: e?.code, message: e?.message });
    return [];
  }
}

async function fetchLeaderboardWithRank() {
  try {
    const q = query(
      collection(db, 'leaderboardEntries'),
      where('leaderboardOptIn', '==', true),
      orderBy('highestLevelReached', 'desc'),
      limit(100)
    );
    const snap = await getDocs(q);
    const rows = sortLeaderboardRows(snap.docs.map(normalizeLeaderboardQueryRow));
    console.log('[lb] leaderboard query results', { rawDocs: snap.docs.length, sorted: rows.length });
    const myUid = state.profile?.uid;
    let myRank = null;
    if (myUid) {
      const idx = rows.findIndex(r => r.uid === myUid);
      if (idx >= 0) myRank = idx + 1;
    }
    return { rows: rows.slice(0, 25), myRank, scanned: rows.length };
  } catch (e) {
    console.error('[lb] fetchLeaderboardWithRank failed', { code: e?.code, message: e?.message });
    return { rows: [], myRank: null, scanned: 0 };
  }
}

// Wire up the forward-declared sync function in save.js
_setSyncLeaderboardEntry(syncLeaderboardEntry);

export {
  writeLeaderboardBootstrapDoc,
  syncLeaderboardEntry,
  ensureMyPublicLeaderboardDocLoaded,
  backfillLeaderboardIfMissing,
  normalizeLeaderboardQueryRow,
  sortLeaderboardRows,
  fetchLeaderboardTop25,
  fetchLeaderboardWithRank,
};