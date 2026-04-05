import { initializeApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyAeM7rViQyB_D6KO38w1S0BksHw0RfypJI',
  authDomain: 'hybrids-unite.firebaseapp.com',
  projectId: 'hybrids-unite',
  storageBucket: 'hybrids-unite.firebasestorage.app',
  messagingSenderId: '1021735845979',
  appId: '1:1021735845979:web:c2a6e516c57abd9e47ff7e',
  measurementId: 'G-C0GV1BGSR3',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export function userDocRef(uid) {
  return doc(db, 'users', uid);
}

/** Public leaderboard row — safe to expose; not the private users/{uid} doc. */
export function leaderboardDocRef(uid) {
  return doc(db, 'leaderboardEntries', uid);
}

export {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  getDoc,
  setDoc,
  serverTimestamp,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
};
