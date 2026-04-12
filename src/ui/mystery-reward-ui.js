import { state } from '../game/state.js';
import { saveUserProgress } from '../persistence/save.js';
import { localDateString } from '../game/utils.js';
import { getFaction } from '../data/factions.js';
import {
  rollMysteryReward,
  applyMysteryReward,
  canClaimMysteryRewardToday,
  normalizeMysteryClaimsForDay,
  getMysteryRewardStatus,
} from '../game/mystery-reward.js';

let hintCupIndex = -1;
let picked = false;
let shuffleEndTimer = null;
let settleTimer = null;
let flashInterval = null;
const FLASH_EMOJIS = ['🦎', '🦁', '🦅', '🐺', '🦈', '🐉', '⚡', '✨'];

function $(id) {
  return document.getElementById(id);
}

function clearMysteryTimers() {
  if (shuffleEndTimer) {
    clearTimeout(shuffleEndTimer);
    shuffleEndTimer = null;
  }
  if (settleTimer) {
    clearTimeout(settleTimer);
    settleTimer = null;
  }
  if (flashInterval) {
    clearInterval(flashInterval);
    flashInterval = null;
  }
}

function applyMysteryPanelTheme(p) {
  const panel = $('mr-panel');
  if (!panel || !p) return;
  const themeClasses = [
    'mr-theme--early',
    'mr-theme--apex',
    'mr-theme--dino',
    'mr-theme--myth',
    'mr-theme--faction-egyptian_guardians',
    'mr-theme--faction-viking_raiders',
    'mr-theme--faction-knights',
  ];
  panel.classList.remove(...themeClasses);
  const lv = p.level || 1;
  if (lv <= 5) panel.classList.add('mr-theme--early');
  else if (lv <= 8) panel.classList.add('mr-theme--apex');
  else if (lv <= 15) panel.classList.add('mr-theme--dino');
  else panel.classList.add('mr-theme--myth');
  if (p.faction && getFaction(p.faction)) {
    panel.classList.add(`mr-theme--faction-${p.faction}`);
  }
}

function startFlashStrip() {
  const strip = $('mr-flash-strip');
  if (!strip) return;
  strip.classList.remove('hidden');
  let i = 0;
  for (let j = 0; j < 3; j++) {
    const el = $(`mr-flash-${j}`);
    if (el) {
      el.textContent = FLASH_EMOJIS[(j + i) % FLASH_EMOJIS.length];
      el.classList.remove('mr-flash-cell--on');
    }
  }
  flashInterval = setInterval(() => {
    i += 1;
    for (let j = 0; j < 3; j++) {
      const el = $(`mr-flash-${j}`);
      if (el) {
        el.textContent = FLASH_EMOJIS[(i + j * 2) % FLASH_EMOJIS.length];
        el.classList.toggle('mr-flash-cell--on', j === i % 3);
      }
    }
  }, 140);
}

function stopFlashStrip() {
  if (flashInterval) {
    clearInterval(flashInterval);
    flashInterval = null;
  }
  const strip = $('mr-flash-strip');
  if (strip) strip.classList.add('hidden');
  for (let j = 0; j < 3; j++) {
    $(`mr-flash-${j}`)?.classList.remove('mr-flash-cell--on');
  }
}

export function openMysteryRewardModal() {
  const p = state.progress;
  if (!state.profile?.uid) return;
  if (!canClaimMysteryRewardToday(p)) return;

  const overlay = $('mystery-reward-overlay');
  if (!overlay) return;

  clearMysteryTimers();
  picked = false;
  hintCupIndex = Math.floor(Math.random() * 3);

  overlay.classList.remove('hidden');
  overlay.setAttribute('aria-hidden', 'false');

  applyMysteryPanelTheme(p);

  $('mr-result')?.classList.add('hidden');
  $('mr-result')?.classList.remove('mr-result--ultra');
  const title = $('mr-title');
  const sub = $('mr-sub');
  if (title) title.textContent = 'Mystery Reward';
  if (sub) sub.textContent = 'Pick 1 of 3';

  const cupsEl = $('mr-cups');
  for (let i = 0; i < 3; i++) {
    const cup = $(`mr-cup-${i}`);
    if (!cup) continue;
    cup.disabled = true;
    cup.classList.remove('mr-cup--picked', 'mr-cup--hint', 'mr-cup--fade', 'mr-cup--lift');
  }
  if (cupsEl) {
    cupsEl.classList.remove('mr-phase--settle');
    cupsEl.classList.add('mr-phase--shuffling');
  }

  startFlashStrip();

  const shuffleMs = 1450;
  shuffleEndTimer = setTimeout(() => {
    shuffleEndTimer = null;
    stopFlashStrip();
    if (cupsEl) {
      cupsEl.classList.remove('mr-phase--shuffling');
      cupsEl.classList.add('mr-phase--settle');
    }
    settleTimer = setTimeout(() => {
      settleTimer = null;
      if (cupsEl) cupsEl.classList.remove('mr-phase--settle');
      for (let i = 0; i < 3; i++) {
        const cup = $(`mr-cup-${i}`);
        if (!cup) continue;
        cup.disabled = false;
        if (i === hintCupIndex) cup.classList.add('mr-cup--hint');
      }
    }, 420);
  }, shuffleMs);
}

export function closeMysteryRewardModal() {
  clearMysteryTimers();
  stopFlashStrip();
  const overlay = $('mystery-reward-overlay');
  if (overlay) {
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
  }
  const cupsEl = $('mr-cups');
  if (cupsEl) {
    cupsEl.classList.remove('mr-phase--shuffling', 'mr-phase--settle');
  }
  picked = false;
}

function onCupClick(cupIndex) {
  if (picked) return;
  const cupsEl = $('mr-cups');
  if (cupsEl?.classList.contains('mr-phase--shuffling')) return;

  const p = state.progress;
  if (!p || !state.profile?.uid) return;
  if (!canClaimMysteryRewardToday(p)) return;

  picked = true;
  const rolled = rollMysteryReward(p);

  for (let i = 0; i < 3; i++) {
    const cup = $(`mr-cup-${i}`);
    if (!cup) continue;
    cup.disabled = true;
    if (i === cupIndex) {
      cup.classList.add('mr-cup--picked', 'mr-cup--lift');
    } else {
      cup.classList.add('mr-cup--fade');
    }
    cup.classList.remove('mr-cup--hint');
  }

  applyMysteryReward(p, rolled);
  normalizeMysteryClaimsForDay(p);
  p.mysteryRewardClaimsCount = (p.mysteryRewardClaimsCount || 0) + 1;
  p.mysteryRewardClaimsDayKey = localDateString();
  p.lastMysteryRewardDayKey = localDateString();

  saveUserProgress(p, { mysteryClaim: true }).catch(e => console.error('[mystery] save failed', e));

  const resultEl = $('mr-result');
  const msgEl = $('mr-result-msg');
  if (resultEl && msgEl) {
    resultEl.classList.remove('hidden');
    const statusAfter = getMysteryRewardStatus(p);
    const moreLine = `<div class="mr-more-line">${statusAfter.line}</div>`;
    if (rolled.isUltraLevel) {
      resultEl.classList.add('mr-result--ultra');
      msgEl.innerHTML = `<span class="mr-ultra-txt">${rolled.ultraMessage || '🔥 Incredible!'}</span>${moreLine}`;
    } else {
      resultEl.classList.remove('mr-result--ultra');
      msgEl.innerHTML = `🎉 <strong>You got: ${rolled.displayName}!</strong>${moreLine}`;
    }
  }

  window.renderHub?.();
}

export function hubActionMysteryReward() {
  const p = state.progress;
  if (!state.profile?.uid) {
    return;
  }
  if (!canClaimMysteryRewardToday(p)) {
    return;
  }
  openMysteryRewardModal();
}

export function initMysteryRewardUi() {
  for (let i = 0; i < 3; i++) {
    const cup = $(`mr-cup-${i}`);
    if (cup) {
      cup.addEventListener('click', () => onCupClick(i));
    }
  }
  $('mr-close')?.addEventListener('click', () => closeMysteryRewardModal());
  $('mystery-reward-overlay')?.addEventListener('click', e => {
    if (e.target?.id === 'mystery-reward-overlay') closeMysteryRewardModal();
  });
}
