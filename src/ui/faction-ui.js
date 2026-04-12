import {
  FACTION_ORDER, FACTIONS, getFaction, defaultFactionUnlockedList, needsFactionSelection,
} from '../data/factions.js';
import { state } from '../game/state.js';
import { saveUserProgress } from '../persistence/save.js';
import { applyFactionThemeVars, clearFactionThemeVars } from '../theme/faction-theme.js';
import { showScreen, escapeHtml } from './screens.js';

function ensureFactionUnlockedList(p) {
  const defs = defaultFactionUnlockedList();
  if (!Array.isArray(p.factionUnlocked)) p.factionUnlocked = [];
  for (const id of defs) {
    if (!p.factionUnlocked.includes(id)) p.factionUnlocked.push(id);
  }
}

export function applyFactionThemeToRoot() {
  const p = state.progress;
  const id = p?.faction || '';
  if (id && FACTIONS[id]) {
    applyFactionThemeVars(id);
  } else {
    clearFactionThemeVars();
  }
}

function cardHtml(id, selectedId) {
  const f = FACTIONS[id];
  if (!f) return '';
  const kid = f.kidTagline ? escapeHtml(f.kidTagline) : escapeHtml(f.description);
  const timeL = f.timePeriod ? escapeHtml(f.timePeriod) : '';
  const benefit = f.gameplayKid ? escapeHtml(f.gameplayKid) : '';
  const meet = f.meetLine ? escapeHtml(f.meetLine) : '';
  const isSel = selectedId === id;
  const selClass = isSel ? ' faction-card--selected' : '';
  return `
    <button type="button" class="faction-card faction-card--${id}${selClass}" data-faction-id="${escapeHtml(id)}" onclick="pickFactionAndContinue('${escapeHtml(id)}')" aria-pressed="${isSel}">
      <div class="faction-card-head"><span class="faction-card-icon" aria-hidden="true">${f.icon}</span><span class="faction-card-name">${escapeHtml(f.name)}</span></div>
      <span class="faction-card-kid">${kid}</span>
      ${timeL ? `<span class="faction-card-time">${timeL}</span>` : ''}
      ${benefit ? `<span class="faction-card-benefit">${benefit}</span>` : ''}
      ${meet ? `<span class="faction-card-meet">${meet}</span>` : ''}
      ${isSel ? '<span class="faction-card-pill">Selected</span>' : ''}
    </button>`;
}

export function renderFactionSelect() {
  const wrap = document.getElementById('faction-select-cards');
  if (!wrap) return;
  const p = state.progress;
  if (p) ensureFactionUnlockedList(p);
  const allowed = new Set(p?.factionUnlocked?.length ? p.factionUnlocked : FACTION_ORDER);
  const order = FACTION_ORDER.filter(id => allowed.has(id));
  const selectedId = p?.faction || null;
  wrap.innerHTML = order.map(id => cardHtml(id, selectedId)).join('');
  const sub = document.getElementById('faction-select-sub');
  if (sub) {
    sub.textContent = needsFactionSelection(state.progress)
      ? 'Pick one — you can switch later and keep all your progress!'
      : 'Tap a card to switch. Your levels and animals stay safe.';
  }
}

export function pickFactionAndContinue(factionId) {
  const p = state.progress;
  if (!p || !state.profile?.uid) return;
  if (!FACTIONS[factionId]) return;
  ensureFactionUnlockedList(p);
  if (!p.factionUnlocked.includes(factionId)) p.factionUnlocked.push(factionId);
  p.faction = factionId;
  saveUserProgress(p).catch(e => console.error('[faction] save failed', e));
  applyFactionThemeToRoot();
  showScreen('hub');
}

export function openFactionSelectFromHub() {
  showScreen('faction-select');
}
