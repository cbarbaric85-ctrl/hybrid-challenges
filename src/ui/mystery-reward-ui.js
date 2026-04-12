import { state } from '../game/state.js';
import { saveUserProgress } from '../persistence/save.js';
import { localDateString } from '../game/utils.js';
import {
  rollMysteryReward,
  applyMysteryReward,
  canClaimMysteryRewardToday,
} from '../game/mystery-reward.js';

let hintCupIndex = -1;
let picked = false;

function $(id) {
  return document.getElementById(id);
}

export function openMysteryRewardModal() {
  const p = state.progress;
  if (!state.profile?.uid) return;
  if (!canClaimMysteryRewardToday(p)) return;

  const overlay = $('mystery-reward-overlay');
  if (!overlay) return;

  picked = false;
  hintCupIndex = Math.floor(Math.random() * 3);

  overlay.classList.remove('hidden');
  overlay.setAttribute('aria-hidden', 'false');

  $('mr-result')?.classList.add('hidden');
  $('mr-result')?.classList.remove('mr-result--ultra');
  const title = $('mr-title');
  const sub = $('mr-sub');
  if (title) title.textContent = '🎁 Mystery Reward';
  if (sub) sub.textContent = 'Pick 1 of 3 to reveal your reward';

  for (let i = 0; i < 3; i++) {
    const cup = $(`mr-cup-${i}`);
    if (!cup) continue;
    cup.disabled = false;
    cup.classList.remove('mr-cup--picked', 'mr-cup--hint', 'mr-cup--fade', 'mr-cup--lift');
    if (i === hintCupIndex) cup.classList.add('mr-cup--hint');
  }
}

export function closeMysteryRewardModal() {
  const overlay = $('mystery-reward-overlay');
  if (overlay) {
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
  }
  picked = false;
}

function onCupClick(cupIndex) {
  if (picked) return;
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
  p.lastMysteryRewardDayKey = localDateString();

  saveUserProgress(p, { mysteryClaim: true }).catch(e => console.error('[mystery] save failed', e));

  const resultEl = $('mr-result');
  const msgEl = $('mr-result-msg');
  if (resultEl && msgEl) {
    resultEl.classList.remove('hidden');
    if (rolled.isUltraLevel) {
      resultEl.classList.add('mr-result--ultra');
      msgEl.innerHTML = `<span class="mr-ultra-txt">${rolled.ultraMessage || '🔥 Incredible!'}</span>`;
    } else {
      resultEl.classList.remove('mr-result--ultra');
      msgEl.innerHTML = `🎉 <strong>You got: ${rolled.displayName}!</strong>`;
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
