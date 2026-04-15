import {
  auth, userDocRef, leaderboardDocRef,
  onAuthStateChanged, getDoc, setDoc, serverTimestamp,
} from './firebase.js';
import { STARTER_BASE_IDS } from './data/animals.js';
import { state, clearDefeatAutoReturn, clearLevelCompleteAutoNav } from './game/state.js';
import {
  firestoreDataToProgress,
  docSnapshotExists,
} from './persistence/save.js';
import {
  writeLeaderboardBootstrapDoc, syncLeaderboardEntry,
} from './persistence/leaderboard.js';
import { hybridFromSaved } from './game/hybrid.js';
import { needsFactionSelection } from './data/factions.js';
import { clearFactionThemeVars } from './theme/faction-theme.js';
import { showScreen } from './ui/screens.js';

// BOOT
// ═══════════════════════════════════════════════════════════════════

document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && document.getElementById('screen-auth').classList.contains('active')) {
    window.handleAuth?.();
  }
  if (e.key === 'Enter' && e.target && e.target.id === 'hybrid-name-input') {
    e.preventDefault();
    window.applyHybridDisplayName?.();
  }
});

onAuthStateChanged(auth, async user => {
  if (!user) {
    clearDefeatAutoReturn();
    clearLevelCompleteAutoNav();
    clearFactionThemeVars();
    state.profile = null;
    state.progress = null;
    state.playerHybrid = null;
    state.selectedAnimals = [];
    showScreen('landing');
    return;
  }
  try {
    console.log('[auth] onAuthStateChanged — user detected', { uid: user.uid, email: user.email });
    const ref = userDocRef(user.uid);
    let snap = await getDoc(ref);
    let data = snap.data();
    console.log('[auth] user doc read', { uid: user.uid, hasData: !!data });
    if (!data) {
      const email = user.email || '';
      const derivedName = email.split('@')[0] || 'Commander';
      console.log('[auth] first-login profile creation', user.uid);
      await setDoc(
        ref,
        {
          uid: user.uid,
          username: derivedName,
          email,
          currentLevel: 1,
          highestLevelReached: 0,
          unlockedAnimals: [...STARTER_BASE_IDS],
          unlockedApex: [],
          unlockedDinosaurs: [],
          selectedHybridAnimals: [],
          hybridStats: null,
          totalWins: 0,
          totalLosses: 0,
          streakCount: 0,
          lastPlayedDate: null,
          leaderboardOptIn: true,
          progressSchemaVersion: 1,
          stageAccess: {
            base: true, apex: true, dinosaur: true, legendary: true, mythical: true, egyptian: true, knights: true,
            roman: true, anglo_saxon: true, samurai: true, viking: true,
          },
          coins: 0,
          unlockTokens: 0,
          dailyChallengeDayKey: null,
          dailyWinsToday: 0,
          dailyChallengeRewardClaimed: false,
          totalQuizQuestions: 0,
          totalQuizCorrect: 0,
          commanderXp: 0,
          faction: null,
          factionXP: 0,
          factionUnlocked: [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      const firstLoginLbOk = await writeLeaderboardBootstrapDoc(user.uid, derivedName);
      console.log('[auth] first-login leaderboard bootstrap', { uid: user.uid, derivedName, ok: firstLoginLbOk });
      snap = await getDoc(ref);
      data = snap.data();
    }
    state.profile = {
      uid: user.uid,
      email: user.email || data.email || '',
      username: data.username || 'Commander',
      leaderboardOptIn: data.leaderboardOptIn !== false,
    };
    state.progress = firestoreDataToProgress(data);
    state.selectedAnimals = [...(data.selectedHybridAnimals || [])];
    state.playerHybrid = hybridFromSaved(data.hybridStats);
    console.log('[auth] profile loaded', { uid: user.uid, username: state.profile.username, optIn: state.profile.leaderboardOptIn });

    let lbAuthOk = await syncLeaderboardEntry(state.progress);
    console.log('[lb] post-auth sync result', { uid: user.uid, ok: lbAuthOk });

    if (!lbAuthOk) {
      console.warn('[lb] post-auth sync failed — falling back to bootstrap + retry', user.uid);
      const bOk = await writeLeaderboardBootstrapDoc(user.uid, state.profile.username);
      console.log('[lb] post-auth fallback bootstrap', { uid: user.uid, bOk });
      lbAuthOk = await syncLeaderboardEntry(state.progress);
      console.log('[lb] post-auth retry sync', { uid: user.uid, ok: lbAuthOk });
    }

    if (lbAuthOk) {
      const verifyRef = leaderboardDocRef(user.uid);
      try {
        const verifySnap = await getDoc(verifyRef);
        const exists = docSnapshotExists(verifySnap);
        console.log('[lb] post-auth verify read-back', { uid: user.uid, path: `leaderboardEntries/${user.uid}`, exists });
        if (!exists) {
          console.warn('[lb] post-auth verify: write reported success but doc missing — forcing bootstrap');
          await writeLeaderboardBootstrapDoc(user.uid, state.profile.username);
        }
      } catch (ve) {
        console.error('[lb] post-auth verify read failed', { uid: user.uid, code: ve?.code, message: ve?.message });
      }
    }

    console.log('[auth] session ready', user.uid);
    if (needsFactionSelection(state.progress)) showScreen('faction-select');
    else showScreen('hub');
  } catch (bootErr) {
    console.error('[auth] onAuthStateChanged fatal error — falling back to auth screen', {
      uid: user?.uid,
      code: bootErr?.code,
      message: bootErr?.message,
      err: bootErr,
    });
    showScreen('landing');
  }
});

