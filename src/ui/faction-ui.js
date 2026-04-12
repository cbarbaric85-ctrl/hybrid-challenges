import {
  FACTION_ORDER, FACTIONS, getFaction, defaultFactionUnlockedList, needsFactionSelection,
} from '../data/factions.js';
import { state } from '../game/state.js';
import { saveUserProgress } from '../persistence/save.js';
import { showScreen, escapeHtml } from './screens.js';

const ROOT_ATTR = 'data-player-faction';

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
    document.documentElement.setAttribute(ROOT_ATTR, id);
  } else {
    document.documentElement.removeAttribute(ROOT_ATTR);
  }
}

function cardHtml(id) {
  const f = FACTIONS[id];
  if (!f) return '';
  const desc = escapeHtml(f.description);
  return `
    <button type="button" class="faction-card faction-card--${id}" data-faction-id="${escapeHtml(id)}" onclick="pickFactionAndContinue('${escapeHtml(id)}')">
      <span class="faction-card-icon" aria-hidden="true">${f.icon}</span>
      <span class="faction-card-name">${escapeHtml(f.name)}</span>
      <span class="faction-card-desc">${desc}</span>
    </button>`;
}

export function renderFactionSelect() {
  const wrap = document.getElementById('faction-select-cards');
  if (!wrap) return;
  const p = state.progress;
  if (p) ensureFactionUnlockedList(p);
  const allowed = new Set(p?.factionUnlocked?.length ? p.factionUnlocked : FACTION_ORDER);
  const order = FACTION_ORDER.filter(id => allowed.has(id));
  wrap.innerHTML = order.map(cardHtml).join('');
  const sub = document.getElementById('faction-select-sub');
  if (sub) {
    sub.textContent = needsFactionSelection(state.progress)
      ? 'The Mythical path is open — pledge your banner to gain faction bonuses in battle.'
      : 'Pick another faction any time. Your progress is kept.';
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
