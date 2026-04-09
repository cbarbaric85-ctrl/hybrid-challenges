import {
  auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  setDoc, serverTimestamp,
  userDocRef, getDoc, leaderboardDocRef,
} from '../firebase.js';
import { STARTER_BASE_IDS } from '../data/animals.js';
import { state, defaultProgress, clearDefeatAutoReturn, clearLevelCompleteAutoNav } from '../game/state.js';
import { showScreen } from './screens.js';
import { writeLeaderboardBootstrapDoc } from '../persistence/leaderboard.js';
import { normalizeProgress, docSnapshotExists } from '../persistence/save.js';

let authMode = 'login';

function switchTab(mode) {
  authMode = mode;
  document.getElementById('tab-login').classList.toggle('active', mode === 'login');
  document.getElementById('tab-signup').classList.toggle('active', mode === 'signup');
  document.getElementById('fg-confirm').style.display = mode === 'signup' ? 'block' : 'none';
  document.getElementById('fg-username').style.display = mode === 'signup' ? 'block' : 'none';
  document.getElementById('auth-btn').textContent = mode === 'login' ? 'Sign In' : 'Create Account';
  clearAuthErr();
}
function setupAuth(mode) {
  authMode = mode;
  switchTab(mode);
  document.getElementById('auth-email').value = '';
  document.getElementById('auth-username').value = '';
  document.getElementById('auth-password').value = '';
  document.getElementById('auth-confirm').value = '';
}
function showAuthErr(msg) {
  const el = document.getElementById('auth-err');
  el.textContent = msg;
  el.classList.add('show');
}
function clearAuthErr() { document.getElementById('auth-err').classList.remove('show'); }

function firebaseAuthErrorMessage(err) {
  const code = err?.code || '';
  if (code === 'auth/email-already-in-use') return 'That email is already registered. Try signing in.';
  if (code === 'auth/invalid-email') return 'Enter a valid email address.';
  if (code === 'auth/weak-password') return 'Password should be at least 6 characters.';
  if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
    return 'Invalid email or password.';
  }
  if (code === 'auth/too-many-requests') return 'Too many attempts. Try again later.';
  return err?.message || 'Something went wrong. Please try again.';
}

async function handleAuth() {
  const email = document.getElementById('auth-email').value.trim();
  const username = document.getElementById('auth-username').value.trim();
  const password = document.getElementById('auth-password').value;
  const confirm = document.getElementById('auth-confirm').value;
  clearAuthErr();
  if (!email) { showAuthErr('Email is required.'); return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showAuthErr('Enter a valid email address.'); return; }
  if (!password || password.length < 6) { showAuthErr('Password must be at least 6 characters.'); return; }
  if (authMode === 'signup') {
    if (!username || username.length < 2) { showAuthErr('Callsign must be at least 2 characters.'); return; }
    if (password !== confirm) { showAuthErr('Passwords do not match.'); return; }
  }
  try {
    if (authMode === 'signup') {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      console.log('[auth] signup profile write start', cred.user.uid);
      await setDoc(
        userDocRef(cred.user.uid),
        {
          uid: cred.user.uid,
          username,
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
          stageAccess: { base: true, apex: true, dinosaur: true },
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
      console.log('[auth] signup profile write OK', cred.user.uid);
      const signupLbOk = await writeLeaderboardBootstrapDoc(cred.user.uid, username);
      console.log('[auth] signup leaderboard bootstrap', { uid: cred.user.uid, ok: signupLbOk });
      if (signupLbOk) {
        try {
          const lbVerify = await getDoc(leaderboardDocRef(cred.user.uid));
          const lbExists = docSnapshotExists(lbVerify);
          console.log('[auth] signup leaderboard verify', { uid: cred.user.uid, exists: lbExists });
          if (!lbExists) {
            console.warn('[auth] signup: bootstrap reported success but doc missing — retrying');
            await writeLeaderboardBootstrapDoc(cred.user.uid, username);
          }
        } catch (ve) {
          console.error('[auth] signup leaderboard verify read failed', { code: ve?.code, message: ve?.message });
        }
      } else {
        console.warn('[auth] signup: bootstrap failed — onAuthStateChanged will retry');
      }
    } else {
      await signInWithEmailAndPassword(auth, email, password);
    }
  } catch (e) {
    showAuthErr(firebaseAuthErrorMessage(e));
  }
}

async function logout() {
  clearDefeatAutoReturn();
  clearLevelCompleteAutoNav();
  try {
    await signOut(auth);
  } catch (e) {
    console.error(e);
  }
  state.profile = null;
  state.progress = null;
  state.playerHybrid = null;
  state.selectedAnimals = [];
  showScreen('landing');
}

export {
  switchTab,
  setupAuth,
  showAuthErr,
  clearAuthErr,
  firebaseAuthErrorMessage,
  handleAuth,
  logout,
};