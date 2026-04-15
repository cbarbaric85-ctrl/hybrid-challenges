import {
  STAT_MAX, STAGE_BASE, STAGE_APEX, STAGE_DINO, STAGE_LEGENDARY, STAGE_MYTHICAL, STAGE_EGYPTIAN, STAGE_KNIGHTS,
  STAGE_ROMAN, STAGE_ANGLO_SAXON, STAGE_SAMURAI, STAGE_VIKING,
  ANIMALS, ALL_ANIMALS, BASE_IDS, APEX_IDS, DINO_IDS, LEGENDARY_IDS, MYTHICAL_IDS, EGYPTIAN_IDS, KNIGHT_IDS,
  ROMAN_IDS, ANGLO_SAXON_IDS, SAMURAI_IDS, VIKING_IDS,
} from '../data/animals.js';
import { LEVELS } from '../data/levels.js';
import {
  state, COIN_TUNING_COST, TOKEN_RECRUIT_COST,
  XP_PER_BATTLE_WIN, COMMANDER_XP_SEGMENT,
} from '../game/state.js';
import {
  countBaseUnlocked, countApexUnlocked, countDinoUnlocked,
  countLegendaryUnlocked, countMythicalUnlocked, countEgyptianUnlocked, countKnightsUnlocked,
  countRomanUnlocked, countAngloSaxonUnlocked, countSamuraiUnlocked, countVikingUnlocked,
  egyptianTierQuizOpen, knightTierQuizOpen, romanTierQuizOpen, angloSaxonTierQuizOpen, samuraiTierQuizOpen, vikingTierQuizOpen,
  apexLevelGateMet, dinoLevelGateMet,
  legendaryLevelGateMet, mythicalLevelGateMet,
  getPlayerStageLabel, getProgressionNextLines,
  isLevelLocked, isQuizEligible,
  ensureDailyChallengeRolled, dailyChallengeMet,
  DAILY_CHALLENGE_DEFS,
  RETENTION_SOFT_MONETISE_COPY, getSoftMonetisationHintLines,
  getRetentionShopTeasers,
  getNextBaseAnimalId, getNextApexAnimalId, getNextDinoAnimalId,
  getNextLegendaryAnimalId, getNextMythicalAnimalId, getNextEgyptianAnimalId, getNextKnightAnimalId,
  getNextRomanAnimalId, getNextAngloSaxonAnimalId, getNextSamuraiAnimalId, getNextVikingAnimalId,
  formatMiniStatPreview,
  getStreakBattleBoost, sumBoostPoints,
  unlockGateLinesForAnimal,
  touchDailyStreakIfNeeded,
  pickDailyChallenge,
  getAvailableAnimals,
  MAX_LEVEL,
} from '../game/progression.js';
import { powerScore, buildEnemyHybrid } from '../game/hybrid.js';
import { STAT_LABELS_SIMPLE } from '../game/battle.js';
import { saveUserProgress, persistGameProgress } from '../persistence/save.js';
import { backfillLeaderboardIfMissing } from '../persistence/leaderboard.js';
import { showScreen, escapeHtml } from './screens.js';
import { showBuilder } from './forge.js';
import { openCreatureIntel } from './creature-intel-ui.js';
import { creaturePortraitImgHtml } from './asset-utils.js';
import { localDateString, localYesterdayString, msUntilLocalMidnight } from '../game/utils.js';
import { needsFactionSelection, getFaction } from '../data/factions.js';
import { applyFactionThemeToRoot, openFactionSelectFromHub } from './faction-ui.js';
import { applyHubTierAtmosphere, clearHubTierAtmosphere } from '../theme/tier-stage-theme.js';
import { canClaimMysteryRewardToday, formatCountdownShort, getMysteryRewardStatus } from '../game/mystery-reward.js';
import { hubActionMysteryReward } from './mystery-reward-ui.js';

/** Which tier roster is shown on `#screen-animals-tier` (UI only, not persisted). */
let _animalsTierRosterKey = null;

const TIER_IDS_MAP = {
  base: BASE_IDS,
  apex: APEX_IDS,
  dino: DINO_IDS,
  legendary: LEGENDARY_IDS,
  mythical: MYTHICAL_IDS,
  egyptian: EGYPTIAN_IDS,
  knights: KNIGHT_IDS,
  roman: ROMAN_IDS,
  anglo_saxon: ANGLO_SAXON_IDS,
  samurai: SAMURAI_IDS,
  viking: VIKING_IDS,
};

const TIER_LABELS = {
  base: 'Base Animals',
  apex: 'Apex Predators',
  dino: 'Dinosaurs',
  legendary: 'Legendary Beasts',
  mythical: 'Mythical Gods',
  egyptian: 'Egyptian Guardians',
  knights: 'Knights of the Realm',
  roman: 'Roman Empire',
  anglo_saxon: 'Anglo-Saxons',
  samurai: 'Samurai Order',
  viking: 'Viking Clans',
};

function getCommanderXpSegment(xp) {
  const x = Math.max(0, xp | 0);
  const seg = COMMANDER_XP_SEGMENT;
  const inSeg = x % seg;
  const tier = Math.floor(x / seg) + 1;
  return { tier, inSeg, seg, pct: Math.min(100, (inSeg / seg) * 100) };
}

function findNextTokenRecruitTarget(p) {
  const baseNext = getNextBaseAnimalId(p);
  if (baseNext) return { id: baseNext, mode: 'base' };
  const na = getNextApexAnimalId(p);
  if (na) return { id: na, mode: 'quiz' };
  const nd = getNextDinoAnimalId(p);
  if (nd) return { id: nd, mode: 'quiz' };
  const ne = getNextEgyptianAnimalId(p);
  if (ne) return { id: ne, mode: 'quiz' };
  const nk = getNextKnightAnimalId(p);
  if (nk) return { id: nk, mode: 'quiz' };
  const nro = getNextRomanAnimalId(p);
  if (nro) return { id: nro, mode: 'quiz' };
  const nan = getNextAngloSaxonAnimalId(p);
  if (nan) return { id: nan, mode: 'quiz' };
  const nsa = getNextSamuraiAnimalId(p);
  if (nsa) return { id: nsa, mode: 'quiz' };
  const nv = getNextVikingAnimalId(p);
  if (nv) return { id: nv, mode: 'quiz' };
  return null;
}

let hubRewardMsgTimer = null;
function flashHubRewardMsg(msg) {
  const el = document.getElementById('hub-reward-msg') || document.getElementById('al-reward-msg');
  if (!el) return;
  el.textContent = msg;
  el.classList.remove('hidden');
  if (hubRewardMsgTimer) clearTimeout(hubRewardMsgTimer);
  hubRewardMsgTimer = setTimeout(() => {
    el.classList.add('hidden');
    hubRewardMsgTimer = null;
  }, 3200);
}

/** Shared coin-tune rules (single source of truth). */
function performCoinTune() {
  const p = state.progress;
  if (!p || (p.coins || 0) < COIN_TUNING_COST) return { ok: false, reason: 'coins' };
  if (!state.playerHybrid) return { ok: false, reason: 'hybrid' };
  p.coins -= COIN_TUNING_COST;
  const h = state.playerHybrid;
  const keys = ['spd', 'agi', 'int', 'str'];
  const stat = keys[Math.floor(Math.random() * keys.length)];
  h.stats[stat] = Math.min(STAT_MAX, (h.stats[stat] || 0) + 1);
  h.power = powerScore(h.stats);
  saveUserProgress(p).catch(e => console.error('[hub] coinTune save failed', e));
  return { ok: true, stat, newVal: h.stats[stat] };
}

function hubSpendCoinTune() {
  const r = performCoinTune();
  if (!r.ok) {
    if (r.reason === 'coins') flashHubRewardMsg('You need more Fusion Coins — win battles!');
    else flashHubRewardMsg('Forge a hybrid in the Forge, then tune stats here.');
    return;
  }
  flashHubRewardMsg(`+1 ${STAT_LABELS_SIMPLE[r.stat]} — your hybrid grows stronger!`);
  renderHub();
}

function clearHubTuneBarBoost() {
  for (const k of ['spd', 'agi', 'int', 'str']) {
    document.getElementById(`hub-tune-bar-${k}`)?.classList.remove('hub-tune-bar--boost');
  }
}

function syncHubTuneIdentity() {
  const emEl = document.getElementById('hub-tune-emojis');
  const nmEl = document.getElementById('hub-tune-hybrid-name');
  const h = state.playerHybrid;
  if (!emEl || !nmEl) return;
  if (!h) {
    emEl.textContent = '—';
    nmEl.textContent = '—';
    return;
  }
  if (h.animals?.length) {
    emEl.innerHTML = h.animals
      .map(aid =>
        creaturePortraitImgHtml(aid, ANIMALS[aid]?.emoji, { className: 'hub-tune-em-img', size: 32, loading: 'eager' })
      )
      .join('');
  } else {
    emEl.textContent = h.emojis || '';
  }
  nmEl.textContent = h.name || 'Hybrid';
}

function syncHubTuneBarsFromHybrid() {
  const h = state.playerHybrid;
  const keys = ['spd', 'agi', 'int', 'str'];
  for (const k of keys) {
    const el = document.getElementById(`hub-tune-bar-${k}`);
    if (el) {
      const v = h?.stats?.[k] ?? 0;
      el.style.width = `${Math.min(100, (v / STAT_MAX) * 100)}%`;
    }
  }
}

function openHubTuneOverlay() {
  const o = document.getElementById('hub-tune-overlay');
  if (!o) return;
  const p = state.progress;
  clearHubTuneBarBoost();
  syncHubTuneIdentity();
  syncHubTuneBarsFromHybrid();
  const line = document.getElementById('hub-tune-coins-line');
  if (line) line.textContent = p ? `Fusion Coins: ${p.coins ?? 0} · ${COIN_TUNING_COST} each tune` : '';
  const btn = document.getElementById('hub-tune-apply');
  if (btn) {
    btn.disabled = !state.playerHybrid || (p?.coins || 0) < COIN_TUNING_COST;
  }
  o.classList.remove('hidden');
  o.setAttribute('aria-hidden', 'false');
}

function closeHubTuneOverlay() {
  const o = document.getElementById('hub-tune-overlay');
  if (!o) return;
  o.classList.add('hidden');
  o.setAttribute('aria-hidden', 'true');
}

function hubTuneOverlayApply() {
  const r = performCoinTune();
  if (!r.ok) {
    if (r.reason === 'coins') flashHubRewardMsg('You need more Fusion Coins — win battles!');
    else flashHubRewardMsg('Forge a hybrid first.');
    closeHubTuneOverlay();
    return;
  }
  clearHubTuneBarBoost();
  syncHubTuneBarsFromHybrid();
  syncHubTuneIdentity();
  if (r.stat) {
    const bar = document.getElementById(`hub-tune-bar-${r.stat}`);
    bar?.classList.add('hub-tune-bar--boost');
    setTimeout(() => bar?.classList.remove('hub-tune-bar--boost'), 1400);
  }
  const line = document.getElementById('hub-tune-coins-line');
  if (line && state.progress) line.textContent = `Fusion Coins: ${state.progress.coins ?? 0} · ${COIN_TUNING_COST} each tune`;
  const btn = document.getElementById('hub-tune-apply');
  if (btn) btn.disabled = (state.progress?.coins || 0) < COIN_TUNING_COST;
  flashHubRewardMsg(`+1 ${STAT_LABELS_SIMPLE[r.stat]} — your hybrid grows stronger!`);
  renderHub();
  renderAnimalsLevels();
}

function hubActionCurrentHybrid() {
  showBuilder();
}

function hubActionTuneHybrid() {
  if (!state.playerHybrid) {
    flashHubRewardMsg('Forge a hybrid first — then tune!');
    showBuilder();
    return;
  }
  if ((state.progress?.coins || 0) < COIN_TUNING_COST) {
    flashHubRewardMsg('You need more Fusion Coins — win battles!');
    return;
  }
  openHubTuneOverlay();
}

function clearAnimalsLevelsTierFilter() {
  /* Legacy no-op: old Animals & Levels roster filter removed. */
}

function openAnimalsTierScreen(tierKey) {
  if (!TIER_IDS_MAP[tierKey]) return;
  _animalsTierRosterKey = tierKey;
  showScreen('animals-tier');
}

function showAnimalsLevelsFromTier() {
  _animalsTierRosterKey = null;
  showScreen('animals-levels');
}

/**
 * Icon-first grid for one tier; mirrors `renderHubAnimalGrid` unlock/quiz rules.
 */
function renderAnimalsTierRoster() {
  const grid = document.getElementById('al-tier-roster-grid');
  const titleEl = document.getElementById('al-tier-roster-title');
  const p = state.progress;
  if (!grid || !p || !_animalsTierRosterKey) return;
  const key = _animalsTierRosterKey;
  const ids = TIER_IDS_MAP[key];
  if (!ids?.length || !titleEl) return;
  titleEl.textContent = TIER_LABELS[key] || 'Roster';
  grid.innerHTML = '';
  const available = getAvailableAnimals(p);
  for (const id of ids) {
    const a = ANIMALS[id];
    if (!a) continue;
    const isAvail = available.includes(id);
    const isQL = isQuizEligible(id, p);
    const cell = document.createElement('div');
    cell.className = 'al-troster-cell';
    if (isAvail) cell.classList.add('al-troster-cell--unlocked');
    else if (isQL) cell.classList.add('al-troster-cell--quiz');
    else cell.classList.add('al-troster-cell--locked');
    const intelBtn = document.createElement('button');
    intelBtn.type = 'button';
    intelBtn.className = 'al-troster-intel';
    intelBtn.setAttribute('aria-label', 'Creature info');
    intelBtn.textContent = 'ⓘ';
    intelBtn.addEventListener('click', e => {
      e.stopPropagation();
      openCreatureIntel(id, { returnScreen: 'animals-tier' });
    });
    const em = document.createElement('span');
    em.className = 'al-troster-em';
    em.innerHTML = creaturePortraitImgHtml(id, a.emoji, { className: 'al-troster-em-img', size: 28, loading: 'lazy' });
    em.setAttribute('aria-hidden', 'true');
    cell.appendChild(intelBtn);
    cell.appendChild(em);
    cell.addEventListener('click', e => {
      if (e.target.closest('.al-troster-intel')) return;
      if (isQL) {
        state.quizReturnScreen = 'animals-tier';
        window.openQuiz(id);
      } else {
        openCreatureIntel(id, { returnScreen: 'animals-tier' });
      }
    });
    grid.appendChild(cell);
  }
}

function renderAnimalsLevelsTierCards(containerId) {
  const el = document.getElementById(containerId);
  if (!el || !state.progress) return;
  const p = state.progress;
  const bU = countBaseUnlocked(p);
  const aU = countApexUnlocked(p);
  const dU = countDinoUnlocked(p);
  const lU = countLegendaryUnlocked(p);
  const mU = countMythicalUnlocked(p);
  const eU = countEgyptianUnlocked(p);
  const kU = countKnightsUnlocked(p);
  const roU = countRomanUnlocked(p);
  const anU = countAngloSaxonUnlocked(p);
  const saU = countSamuraiUnlocked(p);
  const viU = countVikingUnlocked(p);
  const apexOpen = apexLevelGateMet(p);
  const dinoOpen = dinoLevelGateMet(p);
  const legendOpen = legendaryLevelGateMet(p);
  const mythOpen = mythicalLevelGateMet(p);
  const egyptOpen = egyptianTierQuizOpen(p);
  const knightOpen = knightTierQuizOpen(p);
  const romanOpen = romanTierQuizOpen(p);
  const angloOpen = angloSaxonTierQuizOpen(p);
  const samuraiOpen = samuraiTierQuizOpen(p);
  const vikingOpen = vikingTierQuizOpen(p);

  const peek = ids =>
    ids
      .slice(0, 3)
      .map(id =>
        creaturePortraitImgHtml(id, ANIMALS[id]?.emoji, { className: 'al-tier-peek-img', size: 22, loading: 'lazy' })
      )
      .join('');

  function tierCard(key, name, ids, unlocked, gate, lockLine) {
    const total = ids.length;
    const locked = !gate;
    const pct = locked ? 0 : Math.min(100, Math.round((unlocked / total) * 100));
    const complete = !locked && unlocked >= total;
    const fillCls = locked ? 'al-tier-fill al-tier-fill--locked' : complete ? 'al-tier-fill al-tier-fill--complete' : 'al-tier-fill al-tier-fill--partial';
    const cardCls = locked ? 'al-tier-card al-tier--locked' : 'al-tier-card';
    const dataAttr = ` data-al-tier="${key}"`;
    return `
      <div class="${cardCls}"${dataAttr} role="button" tabindex="0" aria-label="${escapeHtml(name)}">
        <div class="al-tier-hdr">
          <span class="al-tier-name">${escapeHtml(name)}</span>
          <span class="al-tier-peek" aria-hidden="true">${peek(ids)}</span>
        </div>
        <div class="al-tier-bar"><div class="${fillCls}" style="width:${pct}%"></div></div>
        ${lockLine ? `<div class="al-tier-lock">${escapeHtml(lockLine)}</div>` : ''}
      </div>`;
  }

  const tiersHtml = [
    tierCard('base', TIER_LABELS.base, BASE_IDS, bU, true, null),
    tierCard('apex', TIER_LABELS.apex, APEX_IDS, aU, apexOpen, apexOpen ? null : 'Unlock after Level 5'),
    tierCard('dino', TIER_LABELS.dino, DINO_IDS, dU, dinoOpen, dinoOpen ? null : 'Unlock after Level 8'),
    tierCard('legendary', TIER_LABELS.legendary, LEGENDARY_IDS, lU, legendOpen, legendOpen ? null : 'Unlock after Level 12'),
    tierCard('mythical', TIER_LABELS.mythical, MYTHICAL_IDS, mU, mythOpen, mythOpen ? null : 'Unlock after Level 16'),
    tierCard('egyptian', TIER_LABELS.egyptian, EGYPTIAN_IDS, eU, egyptOpen, egyptOpen ? null : 'Recruit all Mythical Gods first'),
    tierCard('knights', TIER_LABELS.knights, KNIGHT_IDS, kU, knightOpen, knightOpen ? null : 'Recruit all Egyptian Guardians first'),
    tierCard('roman', TIER_LABELS.roman, ROMAN_IDS, roU, romanOpen, romanOpen ? null : 'Recruit all Knights of the Realm first'),
    tierCard('anglo_saxon', TIER_LABELS.anglo_saxon, ANGLO_SAXON_IDS, anU, angloOpen, angloOpen ? null : 'Recruit all Roman Empire spirits first'),
    tierCard('samurai', TIER_LABELS.samurai, SAMURAI_IDS, saU, samuraiOpen, samuraiOpen ? null : 'Recruit all Anglo-Saxon spirits first'),
    tierCard('viking', TIER_LABELS.viking, VIKING_IDS, viU, vikingOpen, vikingOpen ? null : 'Recruit all Samurai Order spirits first'),
  ].join('');

  el.innerHTML = `
    <div class="hub-progress-hdr">Tier progress</div>
    <p class="al-progress-kicker">Level <strong>${p.level > MAX_LEVEL ? '✓' : p.level}</strong> · ${escapeHtml(getPlayerStageLabel(p))}</p>
    <div class="al-tier-grid">${tiersHtml}</div>`;

  el.querySelectorAll('.al-tier-card[data-al-tier]').forEach(card => {
    const go = () => {
      const k = card.getAttribute('data-al-tier');
      if (k) openAnimalsTierScreen(k);
    };
    card.addEventListener('click', go);
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        go();
      }
    });
  });
}

function hubSpendTokenRecruit() {
  const p = state.progress;
  if (!p || (p.unlockTokens || 0) < TOKEN_RECRUIT_COST) {
    flashHubRewardMsg('You need more Unlock Tokens — clear levels and daily goals.');
    return;
  }
  const t = findNextTokenRecruitTarget(p);
  if (!t) {
    flashHubRewardMsg('Every animal is unlocked. Use tokens in future updates!');
    return;
  }
  p.unlockTokens -= TOKEN_RECRUIT_COST;
  if (t.mode === 'base') {
    if (!p.unlockedAnimals.includes(t.id)) p.unlockedAnimals.push(t.id);
    flashHubRewardMsg(`${ANIMALS[t.id].name} joined your roster!`);
  } else {
    if (!p.quizUnlocked.includes(t.id)) p.quizUnlocked.push(t.id);
    flashHubRewardMsg(`${ANIMALS[t.id].name} is unlocked — find them in the Forge!`);
  }
  saveUserProgress(p).catch(e => console.error('[hub] tokenRecruit save failed', e));
  renderHub();
}

function renderHubProgressionPanel(containerId = 'hub-progress-panel') {
  const el = document.getElementById(containerId);
  if (!el || !state.progress) return;
  const p = state.progress;
  const bU = countBaseUnlocked(p);
  const aU = countApexUnlocked(p);
  const dU = countDinoUnlocked(p);
  const lU = countLegendaryUnlocked(p);
  const mU = countMythicalUnlocked(p);
  const eU = countEgyptianUnlocked(p);
  const kU = countKnightsUnlocked(p);
  const stage = getPlayerStageLabel(p);
  const apexOpen = apexLevelGateMet(p);
  const dinoOpen = dinoLevelGateMet(p);
  const legendOpen = legendaryLevelGateMet(p);
  const mythOpen = mythicalLevelGateMet(p);
  const egyptOpen = egyptianTierQuizOpen(p);
  const knightOpen = knightTierQuizOpen(p);
  const apexLine = apexOpen ? `${aU} / ${APEX_IDS.length} unlocked` : 'Locked — beat Level 5 first';
  const dinoLine = dinoOpen ? `${dU} / ${DINO_IDS.length} unlocked` : 'Locked — beat Level 8 first';
  const legendLine = legendOpen ? `${lU} / ${LEGENDARY_IDS.length} unlocked` : 'Locked — beat Level 12 first';
  const mythLine = mythOpen ? `${mU} / ${MYTHICAL_IDS.length} unlocked` : 'Locked — beat Level 16 first';
  const egyptLine = egyptOpen ? `${eU} / ${EGYPTIAN_IDS.length} unlocked` : 'Locked — recruit all Mythical Gods first';
  const knightLine = knightOpen ? `${kU} / ${KNIGHT_IDS.length} unlocked` : 'Locked — recruit all Egyptian Guardians first';
  const nextLines = getProgressionNextLines(p);
  el.innerHTML = `
    <div class="hub-progress-hdr">Progression</div>
    <div class="hub-progress-meta">
      <span><em>Level</em> <strong>${p.level > MAX_LEVEL ? '✓' : p.level}</strong></span>
      <span><em>Stage</em> <strong>${stage}</strong></span>
    </div>
    <ul class="hub-progress-stages">
      <li><span class="hps-emoji">◇</span> <span class="hps-name">Base Animals</span> <span class="hps-count">${bU} / ${BASE_IDS.length}</span></li>
      <li><span class="hps-emoji">◈</span> <span class="hps-name">Apex Predators</span> <span class="hps-count">${apexLine}</span></li>
      <li><span class="hps-emoji">🦖</span> <span class="hps-name">Dinosaurs</span> <span class="hps-count">${dinoLine}</span></li>
      <li><span class="hps-emoji">🐲</span> <span class="hps-name">Legendary Beasts</span> <span class="hps-count">${legendLine}</span></li>
      <li><span class="hps-emoji">⚡</span> <span class="hps-name">Mythical Gods</span> <span class="hps-count">${mythLine}</span></li>
      <li><span class="hps-emoji">⚱️</span> <span class="hps-name">Egyptian Guardians</span> <span class="hps-count">${egyptLine}</span></li>
      <li><span class="hps-emoji">🛡️</span> <span class="hps-name">Knights of the Realm</span> <span class="hps-count">${knightLine}</span></li>
    </ul>
    <div class="hub-progress-gates">
      <div class="hpg-row"><span class="${apexOpen ? 'hpg-ok' : 'hpg-no'}">${apexOpen ? '✓' : '○'}</span> Apex level gate (Level 6+)</div>
      <div class="hpg-row"><span class="${dinoOpen ? 'hpg-ok' : 'hpg-no'}">${dinoOpen ? '✓' : '○'}</span> Dino level gate (Level 9+)</div>
      <div class="hpg-row"><span class="${legendOpen ? 'hpg-ok' : 'hpg-no'}">${legendOpen ? '✓' : '○'}</span> Legendary level gate (Level 13+)</div>
      <div class="hpg-row"><span class="${mythOpen ? 'hpg-ok' : 'hpg-no'}">${mythOpen ? '✓' : '○'}</span> Mythical level gate (Level 17+)</div>
      <div class="hpg-row"><span class="${egyptOpen ? 'hpg-ok' : 'hpg-no'}">${egyptOpen ? '✓' : '○'}</span> Egyptian tier (all Mythical quizzes)</div>
      <div class="hpg-row"><span class="${knightOpen ? 'hpg-ok' : 'hpg-no'}">${knightOpen ? '✓' : '○'}</span> Knights tier (all Egyptian quizzes)</div>
    </div>
    <div class="hub-progress-next">${nextLines.join('<br>')}</div>
    ${
      sumBoostPoints(getStreakBattleBoost(p)) > 0
        ? `<div class="hub-streak-bonus">🔥 Streak power: +${sumBoostPoints(getStreakBattleBoost(p))} bonus stats in your next battle.</div>`
        : ''
    }
    <div class="hub-soft-gates">${[...getRetentionShopTeasers(), ...getSoftMonetisationHintLines(p)].map(s => `<div class="soft-gate-line">${s}</div>`).join('')}</div>`;
}

function renderHubDailyChallenge(containerId = 'hub-daily-challenge') {
  const el = document.getElementById(containerId);
  if (!el || !state.progress) return;
  const p = state.progress;
  ensureDailyChallengeRolled(p);
  const ch = pickDailyChallenge(localDateString());
  const done = p.dailyChallengeRewardClaimed;
  const wins = p.dailyWinsToday || 0;
  let sub = done ? '✓ Reward claimed today — new challenge tomorrow!' : `${wins} mission win${wins === 1 ? '' : 's'} today`;
  if (!done && ch.id === 'double' && wins < 2) sub += ' · need 2 wins today';
  el.innerHTML = `
    <div class="hub-dc-hdr">🎯 Daily Challenge</div>
    <div class="hub-dc-title">${ch.title}</div>
    <div class="hub-dc-desc">${ch.desc}</div>
    <div class="hub-dc-status">${sub}</div>`;
}

/** Mission + roster detail block (Animals & Levels page). */
function fillMissionDetail(p, ids) {
  const levelIdx = Math.min(p.level - 1, LEVELS.length - 1);
  const level = LEVELS[levelIdx];
  const apexCount = APEX_IDS.filter(id => p.quizUnlocked.includes(id)).length;
  const dinoCount = DINO_IDS.filter(id => p.quizUnlocked.includes(id)).length;
  const legCount = LEGENDARY_IDS.filter(id => p.quizUnlocked.includes(id)).length;
  const mythCount = MYTHICAL_IDS.filter(id => p.quizUnlocked.includes(id)).length;
  const egyptCount = EGYPTIAN_IDS.filter(id => p.quizUnlocked.includes(id)).length;
  const knightCount = KNIGHT_IDS.filter(id => p.quizUnlocked.includes(id)).length;
  const romanCount = ROMAN_IDS.filter(id => p.quizUnlocked.includes(id)).length;
  const angloCount = ANGLO_SAXON_IDS.filter(id => p.quizUnlocked.includes(id)).length;
  const samuraiCount = SAMURAI_IDS.filter(id => p.quizUnlocked.includes(id)).length;
  const vikingCount = VIKING_IDS.filter(id => p.quizUnlocked.includes(id)).length;
  const baseU = countBaseUnlocked(p);
  let tierTxt = `B ${baseU}/10`;
  if (apexLevelGateMet(p)) tierTxt += ` · A ${apexCount}/10`;
  if (dinoLevelGateMet(p)) tierTxt += ` · D ${dinoCount}/10`;
  if (legendaryLevelGateMet(p)) tierTxt += ` · L ${legCount}/10`;
  if (mythicalLevelGateMet(p)) tierTxt += ` · M ${mythCount}/10`;
  if (egyptianTierQuizOpen(p)) tierTxt += ` · Eg ${egyptCount}/10`;
  if (knightTierQuizOpen(p)) tierTxt += ` · K ${knightCount}/10`;
  if (romanTierQuizOpen(p)) tierTxt += ` · Ro ${romanCount}/10`;
  if (angloSaxonTierQuizOpen(p)) tierTxt += ` · As ${angloCount}/10`;
  if (samuraiTierQuizOpen(p)) tierTxt += ` · Sa ${samuraiCount}/10`;
  if (vikingTierQuizOpen(p)) tierTxt += ` · Vi ${vikingCount}/10`;

  const nameEl = document.getElementById(ids.levelName);
  const descEl = document.getElementById(ids.levelDesc);
  if (nameEl) nameEl.textContent = p.level > MAX_LEVEL ? 'Game Complete!' : `Level ${p.level} — ${level.name}`;
  if (descEl) descEl.textContent = p.level > MAX_LEVEL ? 'You conquered all levels.' : level.desc;

  const ba = document.getElementById(ids.badgeArea);
  if (ba) {
    ba.innerHTML = '';
    if (level && level.isFinal) ba.innerHTML += '<span class="lv-badge badge-final">⚠ FINAL BOSS</span>';
    else if (level && level.isBoss) ba.innerHTML += '<span class="lv-badge badge-final">⚠ BOSS BATTLE</span>';
    else if (level && level.isHard) ba.innerHTML += '<span class="lv-badge badge-hard">DANGER ZONE</span>';
    if (p.level > MAX_LEVEL) ba.innerHTML += '<span class="lv-badge badge-knights">🛡️ REALM CONQUEROR</span>';
    else if (vikingCount > 0) ba.innerHTML += '<span class="lv-badge badge-viking">⚓ VIKING ACTIVE</span>';
    else if (samuraiCount > 0) ba.innerHTML += '<span class="lv-badge badge-samurai">🗾 SAMURAI ACTIVE</span>';
    else if (angloCount > 0) ba.innerHTML += '<span class="lv-badge badge-anglo">🌲 ANGLO-SAXON ACTIVE</span>';
    else if (romanCount > 0) ba.innerHTML += '<span class="lv-badge badge-roman">🏛️ ROMAN ACTIVE</span>';
    else if (knightCount > 0) ba.innerHTML += '<span class="lv-badge badge-knights">🛡️ KNIGHTS ACTIVE</span>';
    else if (egyptCount > 0) ba.innerHTML += '<span class="lv-badge badge-egyptian">⚱️ EGYPTIAN ACTIVE</span>';
    else if (mythCount > 0) ba.innerHTML += '<span class="lv-badge badge-mythical">⚡ MYTHICAL ACTIVE</span>';
    else if (legCount > 0) ba.innerHTML += '<span class="lv-badge badge-legendary">🐲 LEGENDARY ACTIVE</span>';
    else if (dinoCount > 0) ba.innerHTML += '<span class="lv-badge badge-dino">🦖 DINO ACTIVE</span>';
    else if (apexCount > 0) ba.innerHTML += '<span class="lv-badge badge-apex">◈ APEX UNLOCKED</span>';
  }

  const pips = document.getElementById(ids.pips);
  if (pips) {
    pips.innerHTML = '';
    for (let i = 1; i <= MAX_LEVEL; i++) {
      const pip = document.createElement('div');
      pip.className = 'lv-pip' + (i < p.level ? ' done' : i === p.level ? ' current' : '');
      pips.appendChild(pip);
    }
  }

  if (level) {
    const comps = level.animals.map(id => ALL_ANIMALS[id]).filter(Boolean);
    const ep = document.getElementById(ids.enemyPreview);
    if (ep) {
      ep.innerHTML = `Enemy: <span class="hub-enemy-line">${comps.map(a => `${creaturePortraitImgHtml(a.id, a.emoji, { className: 'hub-enemy-ico', size: 22, loading: 'lazy' })} ${escapeHtml(a.name)}`).join(' + ')}</span>`;
    }
  }

  const tierSummaryEl = document.getElementById(ids.tierSummary);
  if (tierSummaryEl) {
    tierSummaryEl.textContent = `Roster progress: ${tierTxt}`;
    const tierColor =
      vikingCount > 0
        ? 'viking'
        : samuraiCount > 0
        ? 'samurai'
        : angloCount > 0
          ? 'anglo'
          : romanCount > 0
            ? 'roman'
            : knightCount > 0
              ? 'knights'
              : egyptCount > 0
                ? 'egyptian'
                : mythCount > 0
                  ? 'mythical'
                  : legCount > 0
                    ? 'legendary'
                    : dinoCount > 0
                      ? 'dino'
                      : apexCount > 0
                        ? 'purple'
                        : '';
    tierSummaryEl.className = 'hub-mission-tier-summary' + (tierColor ? ` hub-tier-${tierColor}` : '');
  }

  const hd = document.getElementById(ids.hybridDisplay);
  if (hd) {
    if (state.playerHybrid) {
      const h = state.playerHybrid;
      const emojiRow = (h.animals || [])
        .map(
          aid =>
            `<button type="button" class="h-emoji-btn hub-mission-hybrid-emoji" data-mission-aid="${aid}" aria-label="${ANIMALS[aid]?.name || 'Animal'} info">${creaturePortraitImgHtml(aid, ANIMALS[aid]?.emoji, { className: 'hub-mission-hybrid-img', size: 40, loading: 'eager' })}</button>`
        )
        .join('');
      hd.innerHTML = `
      <div class="hub-mission-hybrid-row" style="display:flex;justify-content:center;align-items:center;gap:4px;margin-bottom:4px">${emojiRow}</div>
      <div style="font-family:var(--fd);font-size:1rem;font-weight:700;color:var(--text-bright);margin-bottom:2px">${h.name}</div>
      <div style="font-size:.6rem;font-family:var(--fm);color:var(--text-dim);margin-bottom:8px">${h.composition}</div>
      <div class="hub-power-row" style="justify-content:center;gap:16px">
        <div style="text-align:center">
          <div class="hub-power-score">${h.power}</div>
          <div class="hub-power-lbl">Power Score</div>
        </div>
      </div>`;
      hd.querySelectorAll('.hub-mission-hybrid-emoji').forEach(btn => {
        btn.addEventListener('click', e => {
          e.stopPropagation();
          const aid = btn.getAttribute('data-mission-aid');
          if (aid) openCreatureIntel(aid, { returnScreen: 'animals-levels' });
        });
      });
    } else {
      hd.innerHTML = `<div style="padding:8px 0;color:var(--text-dim);font-size:.72rem">No hybrid forged yet.<br>Go to the Forge to build one.</div>`;
    }
  }

  const rosterHint = document.getElementById(ids.rosterHint);
  if (rosterHint) {
    rosterHint.textContent = 'Tap a tier above to filter. 📝 = quiz ready · 🔒 = locked.';
  }
}

const ANIMALS_LEVEL_IDS = {
  levelName: 'al-level-name',
  levelDesc: 'al-level-desc',
  badgeArea: 'al-badge-area',
  pips: 'al-lv-progress-pips',
  enemyPreview: 'al-enemy-preview',
  tierSummary: 'al-mission-tier-summary',
  hybridDisplay: 'al-hybrid-display',
  rosterHint: 'al-roster-hint',
};

function renderProfile() {
  const p = state.progress;
  if (!p || !document.getElementById('profile-streak')) return;
  applyFactionThemeToRoot();

  const streakEl = document.getElementById('profile-streak');
  if (streakEl) streakEl.textContent = `🔥 ${p.streakCount || 0}d`;
  const coinsEl = document.getElementById('profile-coins');
  if (coinsEl) coinsEl.textContent = String(p.coins ?? 0);
  const tokEl = document.getElementById('profile-tokens');
  if (tokEl) tokEl.textContent = String(p.unlockTokens ?? 0);
  const powEl = document.getElementById('profile-power');
  if (powEl) {
    powEl.textContent = state.playerHybrid ? `${state.playerHybrid.power} ⚡` : '—';
  }
  document.getElementById('profile-wins').textContent = p.totalWins;
  document.getElementById('profile-losses').textContent = p.totalLosses;

  const fac = getFaction(p.faction);
  const facLine = document.getElementById('profile-faction-line');
  if (facLine) {
    facLine.textContent = fac ? `${fac.icon} ${fac.name} · ${p.factionXP | 0} FXP` : 'No faction yet';
  }

  const xpUi = getCommanderXpSegment(p.commanderXp || 0);
  const xpFill = document.getElementById('profile-xp-bar-fill');
  const xpMeta = document.getElementById('profile-xp-meta');
  const xpSegLbl = document.getElementById('profile-xp-seg-lbl');
  const xpMainLbl = document.getElementById('profile-xp-main-lbl');
  const xpSparkHint = document.getElementById('profile-xp-spark-hint');
  const xpTrack = document.getElementById('profile-xp-bar-track');
  if (xpFill) xpFill.style.width = `${xpUi.pct}%`;
  if (xpSegLbl) xpSegLbl.textContent = `Spark ${xpUi.tier}`;
  if (xpMainLbl) xpMainLbl.textContent = `Level Progress: ${xpUi.inSeg} / ${xpUi.seg} XP`;
  if (xpTrack) xpTrack.setAttribute('aria-valuenow', String(Math.round(xpUi.pct)));
  if (xpMeta) xpMeta.textContent = 'Wins fill the bar. When it fills, you move up a Spark level.';
  if (xpSparkHint) xpSparkHint.textContent = `Spark ${xpUi.tier} — keep winning to level up your commander.`;
}

function renderAnimalsLevels() {
  const p = state.progress;
  if (!p || !document.getElementById('screen-animals-levels')?.classList.contains('active')) return;
  applyFactionThemeToRoot();
  renderAnimalsLevelsTierCards('al-progress-panel');
}

function showProfile() {
  showScreen('profile');
}

function showAnimalsLevels() {
  showScreen('animals-levels');
}

function renderHub() {
  const p = state.progress;
  if (!p) return;
  if (needsFactionSelection(p)) {
    clearHubTierAtmosphere();
    showScreen('faction-select');
    return;
  }
  applyFactionThemeToRoot();
  applyHubTierAtmosphere(p.level);
  if (touchDailyStreakIfNeeded(p)) persistGameProgress().catch(e => console.error('[hub] streak save failed', e));
  backfillLeaderboardIfMissing().catch(e => console.error('[hub] lb backfill failed', e));
  const levelIdx = Math.min(p.level - 1, LEVELS.length - 1);
  const level = LEVELS[levelIdx];

  document.getElementById('hub-username').textContent = state.profile?.username || '—';
  const facBadge = document.getElementById('hub-faction-badge');
  const fac = getFaction(p.faction);
  if (facBadge) {
    if (fac) {
      facBadge.textContent = `${fac.icon} ${fac.name} · ${p.factionXP | 0} FXP`;
      facBadge.classList.remove('hidden');
    } else {
      facBadge.textContent = '';
      facBadge.classList.add('hidden');
    }
  }
  const fcChange = document.getElementById('hub-faction-change');
  const fcChangeName = document.getElementById('hub-faction-change-name');
  if (fcChange) {
    const showFcChange = !!fac && mythicalLevelGateMet(p);
    fcChange.classList.toggle('hidden', !showFcChange);
    if (fcChangeName) fcChangeName.textContent = fac ? fac.name : '';
  }

  const quick = document.getElementById('hub-quick-line');
  if (quick && level) {
    quick.innerHTML =
      p.level > MAX_LEVEL
        ? `<span class="hub-quick-mission-txt">You finished the campaign — keep battling for fun!</span>`
        : `<span class="hub-quick-mission-txt">Now playing: Level ${p.level} — ${level.name}</span>`;
  }

  const hintEl = document.getElementById('hub-primary-hint');
  if (hintEl) {
    hintEl.textContent =
      p.level > MAX_LEVEL
        ? 'Tip: try the leaderboard or forge a new hybrid.'
        : 'Tip: tap Battle with a forged hybrid, or Train when a quiz is ready.';
  }

  renderActionPanel();
  renderProfile();
}

function renderHubAnimalGrid(gridId = 'hub-animal-grid', quizReturnTarget = 'hub', tierKey = null) {
  const p = state.progress;
  const available = getAvailableAnimals(p);
  const grid = document.getElementById(gridId);
  if (!grid) return;
  grid.innerHTML = '';

  const idList = tierKey && TIER_IDS_MAP[tierKey] ? [...TIER_IDS_MAP[tierKey]] : Object.keys(ANIMALS);

  for (const id of idList) {
    const a = ANIMALS[id];
    if (!a) continue;
    const isAvail = available.includes(id);
    const isQL = isQuizEligible(id, p);
    const isLL = isLevelLocked(id, p);

    const chip = document.createElement('div');
    const stageChipMap = {
      [STAGE_VIKING]: 'viking-chip',
      [STAGE_SAMURAI]: 'samurai-chip',
      [STAGE_ANGLO_SAXON]: 'anglo-chip',
      [STAGE_ROMAN]: 'roman-chip',
      [STAGE_KNIGHTS]: 'knights-chip',
      [STAGE_EGYPTIAN]: 'egyptian-chip',
      [STAGE_MYTHICAL]: 'mythical-chip',
      [STAGE_LEGENDARY]: 'legendary-chip',
      [STAGE_DINO]: 'dino-chip',
      [STAGE_APEX]: 'apex-chip',
    };
    const tierCls = stageChipMap[a.stage] || '';
    let cls = 'a-chip ' + tierCls;
    if (isAvail) cls += ' available';
    else if (isQL) cls += ' quiz-locked';
    else if (isLL) cls += ' locked';
    chip.className = cls;

    const tierLblMap = {
      [STAGE_VIKING]: 'VIK',
      [STAGE_SAMURAI]: 'SAM',
      [STAGE_ANGLO_SAXON]: 'ANGLO',
      [STAGE_ROMAN]: 'ROME',
      [STAGE_KNIGHTS]: 'KNIGHT',
      [STAGE_EGYPTIAN]: 'EGYPT',
      [STAGE_MYTHICAL]: 'MYTHICAL',
      [STAGE_LEGENDARY]: 'LEGEND',
      [STAGE_DINO]: 'DINO',
      [STAGE_APEX]: 'APEX',
    };
    const tierClsMap = {
      [STAGE_VIKING]: 't12',
      [STAGE_SAMURAI]: 't11',
      [STAGE_ANGLO_SAXON]: 't10',
      [STAGE_ROMAN]: 't9',
      [STAGE_KNIGHTS]: 't8',
      [STAGE_EGYPTIAN]: 't7',
      [STAGE_MYTHICAL]: 't6',
      [STAGE_LEGENDARY]: 't5',
      [STAGE_DINO]: 't4',
      [STAGE_APEX]: 't3',
    };
    const tierLbl = tierLblMap[a.stage] || 'BASE';
    const tierClass = tierClsMap[a.stage] || '';
    const isPremium = a.stage !== STAGE_BASE;
    const premiumPreview =
      !isAvail && !isQL && isPremium
        ? `<div class="a-chip-stats-preview" aria-hidden="true">${formatMiniStatPreview(a)}</div>`
        : '';
    if (premiumPreview) chip.classList.add('premium-preview');
    const intelReturn = gridId === 'al-animal-grid' ? 'animals-levels' : 'hub';
    chip.innerHTML = `<button type="button" class="a-chip-intel" aria-label="Creature info">ⓘ</button>
      <span class="a-chip-em">${creaturePortraitImgHtml(id, a.emoji, { className: 'a-chip-em-img', size: 32, loading: 'lazy' })}</span>
      <span class="a-chip-nm">${a.name}</span>
      <span class="a-chip-tier ${tierClass}">${isLL ? '🔒' : isQL ? '📝' : tierLbl}</span>${premiumPreview}`;

    const gates = unlockGateLinesForAnimal(id, p);
    if (gates && !isAvail) {
      const gateHtml = gates
        .map(
          g =>
            `<div class="unlock-gate-row"><span class="${g.ok ? 'unlock-gate-ok' : 'unlock-gate-no'}">${g.ok ? '✓' : '○'}</span> ${g.text}</div>`
        )
        .join('');
      chip.innerHTML += `<div class="unlock-gate-list">${gateHtml}</div>`;
    }

    chip.addEventListener('click', e => {
      if (e.target.closest('.a-chip-intel')) {
        e.stopPropagation();
        openCreatureIntel(id, { returnScreen: intelReturn });
        return;
      }
      if (isQL) {
        state.quizReturnScreen = quizReturnTarget;
        window.openQuiz(id);
      }
    });

    if (isQL) {
      chip.title = `Unlock ${a.name}: level done ✓ — tap to try the quiz. · ⓘ Creature intel`;
    } else if (isLL && gates) {
      chip.title = gates.map(g => `${g.ok ? 'Done' : 'Todo'}: ${g.text}`).join('\n');
    } else {
      chip.title = `${a.name} — ⓘ Creature intel`;
    }

    grid.appendChild(chip);
  }
}

/* ── Action Panel: "Choose Your Next Move" ── */

function getFirstQuizEligibleId(p) {
  for (const id of [...APEX_IDS, ...DINO_IDS, ...LEGENDARY_IDS, ...MYTHICAL_IDS, ...EGYPTIAN_IDS, ...KNIGHT_IDS, ...ROMAN_IDS, ...ANGLO_SAXON_IDS, ...SAMURAI_IDS, ...VIKING_IDS]) {
    if (isQuizEligible(id, p)) return id;
  }
  return null;
}

function getRecommendedAction(p) {
  const unlockTarget = getFirstQuizEligibleId(p);
  const hasHybrid = !!state.playerHybrid;
  const mysteryOk = state.profile?.uid && canClaimMysteryRewardToday(p);
  const tokTgt = findNextTokenRecruitTarget(p);
  const tokCan = (p.unlockTokens || 0) >= TOKEN_RECRUIT_COST && !!tokTgt;

  if (state.lastBattleResult === 'loss') {
    if (unlockTarget) return 'TRAIN';
    if (tokCan) return 'TOKEN_UNLOCK';
    if (hasHybrid && mysteryOk) return 'MYSTERY';
    return 'BATTLE';
  }

  if (unlockTarget) return 'TRAIN';

  if (mysteryOk && state.playerHybrid && state.enemyHybrid) {
    if (state.playerHybrid.power < state.enemyHybrid.power) return 'MYSTERY';
  } else if (mysteryOk && state.playerHybrid) {
    const levelIdx = Math.min(p.level - 1, LEVELS.length - 1);
    const eDef = LEVELS[levelIdx];
    if (eDef) {
      const eH = buildEnemyHybrid(eDef);
      if (state.playerHybrid.power < eH.power) return 'MYSTERY';
    }
  }

  if (tokCan && !unlockTarget) return 'TOKEN_UNLOCK';

  return 'BATTLE';
}

function renderActionPanel() {
  const panel = document.getElementById('hub-action-panel');
  const actionCol = document.getElementById('hub-action-col');
  if (!panel || !state.progress) return;
  const p = state.progress;

  if (p.level > MAX_LEVEL) {
    panel.classList.add('hidden');
    if (actionCol) actionCol.classList.add('hidden');
    return;
  }
  panel.classList.remove('hidden');
  if (actionCol) actionCol.classList.remove('hidden');

  const rec = getRecommendedAction(p);

  const battleBtn = document.getElementById('hap-battle');
  const trainBtn = document.getElementById('hap-train');
  const tokenBtn = document.getElementById('hap-token');
  const mysteryBtn = document.getElementById('hap-mystery');
  const trainCell = document.getElementById('hap-cell-train');

  const unlockTarget = getFirstQuizEligibleId(p);
  const tokTgt = findNextTokenRecruitTarget(p);
  const tokCan = (p.unlockTokens || 0) >= TOKEN_RECRUIT_COST && !!tokTgt;

  if (battleBtn) battleBtn.disabled = false;
  const battleSub = document.getElementById('hap-battle-sub');
  if (battleSub) {
    battleSub.textContent = state.playerHybrid ? 'Enter the arena' : 'Forge a hybrid first';
  }

  const trainLabel = document.getElementById('hap-train-label');
  const trainSub = document.getElementById('hap-train-sub');
  if (unlockTarget) {
    const a = ANIMALS[unlockTarget];
    const tierMap = {
      [STAGE_APEX]: 'Apex',
      [STAGE_DINO]: 'Dinosaur',
      [STAGE_LEGENDARY]: 'Legendary',
      [STAGE_MYTHICAL]: 'Mythical',
      [STAGE_EGYPTIAN]: 'Egyptian',
      [STAGE_KNIGHTS]: 'Knight',
      [STAGE_ROMAN]: 'Roman',
      [STAGE_ANGLO_SAXON]: 'Anglo-Saxon',
      [STAGE_SAMURAI]: 'Samurai',
      [STAGE_VIKING]: 'Viking Clans',
    };
    const tier = tierMap[a?.stage] || 'New';
    if (trainLabel) trainLabel.textContent = `Train (${tier})`;
    if (trainSub) trainSub.textContent = `${a?.emoji || ''} ${a?.name || 'Unknown'} — quiz to recruit`;
    if (trainBtn) trainBtn.disabled = false;
  } else {
    if (trainLabel) trainLabel.textContent = 'Train';
    const nextGate = !apexLevelGateMet(p) ? 'Beat Level 5 first'
      : !dinoLevelGateMet(p) ? 'Beat Level 8 first'
      : !legendaryLevelGateMet(p) ? 'Beat Level 12 first'
      : !mythicalLevelGateMet(p) ? 'Beat Level 16 first'
      : !egyptianTierQuizOpen(p) ? 'Recruit all Mythical Gods first'
      : countEgyptianUnlocked(p) < EGYPTIAN_IDS.length ? 'Finish Egyptian quizzes'
      : !knightTierQuizOpen(p) ? 'Recruit all Egyptian Guardians first'
      : countKnightsUnlocked(p) < KNIGHT_IDS.length ? 'Finish Knight quizzes'
      : !romanTierQuizOpen(p) ? 'Recruit all Knights first'
      : countRomanUnlocked(p) < ROMAN_IDS.length ? 'Finish Roman quizzes'
      : !angloSaxonTierQuizOpen(p) ? 'Recruit all Roman spirits first'
      : countAngloSaxonUnlocked(p) < ANGLO_SAXON_IDS.length ? 'Finish Anglo-Saxon quizzes'
      : !samuraiTierQuizOpen(p) ? 'Recruit all Anglo-Saxon spirits first'
      : countSamuraiUnlocked(p) < SAMURAI_IDS.length ? 'Finish Samurai quizzes'
      : !vikingTierQuizOpen(p) ? 'Recruit all Samurai spirits first'
      : countVikingUnlocked(p) < VIKING_IDS.length ? 'Finish Viking Clans quizzes'
      : 'All creatures unlocked!';
    if (trainSub) trainSub.textContent = nextGate;
    if (trainBtn) trainBtn.disabled = true;
  }

  const tokenLabel = document.getElementById('hap-token-label');
  const tokenSub = document.getElementById('hap-token-sub');
  if (tokTgt && ANIMALS[tokTgt.id]) {
    const a = ANIMALS[tokTgt.id];
    if (tokenLabel) tokenLabel.textContent = 'Unlock';
    if (tokenSub) {
      tokenSub.textContent = `${a.emoji} ${a.name} · ${TOKEN_RECRUIT_COST} tokens`;
    }
    if (tokenBtn) tokenBtn.disabled = !tokCan;
  } else {
    if (tokenLabel) tokenLabel.textContent = 'Unlock';
    const allDone =
      countKnightsUnlocked(p) >= KNIGHT_IDS.length
      && countRomanUnlocked(p) >= ROMAN_IDS.length
      && countAngloSaxonUnlocked(p) >= ANGLO_SAXON_IDS.length
      && countSamuraiUnlocked(p) >= SAMURAI_IDS.length
      && countVikingUnlocked(p) >= VIKING_IDS.length;
    if (tokenSub) {
      tokenSub.textContent = allDone ? 'All creatures unlocked 🎉' : 'More creatures coming soon…';
    }
    if (tokenBtn) tokenBtn.disabled = true;
  }

  const canMystery = !!state.profile?.uid && canClaimMysteryRewardToday(p);
  const mysteryStatus = state.profile?.uid ? getMysteryRewardStatus(p) : null;
  if (mysteryBtn) mysteryBtn.disabled = !canMystery;
  mysteryBtn?.classList.toggle('hap-mystery--waiting', !canMystery && !!state.profile?.uid);
  const mysterySub = document.getElementById('hap-mystery-sub');
  if (mysterySub) {
    if (!state.profile?.uid) mysterySub.textContent = 'Sign in to play';
    else if (canMystery) mysterySub.textContent = mysteryStatus?.line || '3 rewards available today';
    else {
      const ms = msUntilLocalMidnight();
      mysterySub.textContent = `${mysteryStatus?.line || '⏳ All rewards claimed — come back tomorrow!'} (${formatCountdownShort(ms)} left)`;
    }
  }

  const hybridBtn = document.getElementById('hap-hybrid');
  const hybridSub = document.getElementById('hap-hybrid-sub');
  if (hybridSub) hybridSub.textContent = state.playerHybrid ? 'Open builder' : 'Forge a hybrid';
  if (hybridBtn) hybridBtn.disabled = false;

  const tuneBtn = document.getElementById('hap-tune');
  const tuneSub = document.getElementById('hap-tune-sub');
  const tuneCan = !!state.playerHybrid && (p.coins || 0) >= COIN_TUNING_COST;
  if (tuneBtn) tuneBtn.disabled = !tuneCan;
  if (tuneSub) {
    if (!state.playerHybrid) tuneSub.textContent = 'Forge first';
    else if ((p.coins || 0) < COIN_TUNING_COST) tuneSub.textContent = `Need ${COIN_TUNING_COST} coins`;
    else tuneSub.textContent = `${COIN_TUNING_COST} coins / tune`;
  }

  const btnMap = {
    BATTLE: battleBtn,
    TRAIN: trainBtn,
    TOKEN_UNLOCK: tokenBtn,
    MYSTERY: mysteryBtn,
  };
  const recMap = {
    BATTLE: 'hap-rec-battle',
    TRAIN: 'hap-rec-train',
    TOKEN_UNLOCK: 'hap-rec-token',
    MYSTERY: 'hap-rec-mystery',
  };
  [battleBtn, trainBtn, tokenBtn, mysteryBtn].forEach(b => b?.classList.remove('hap-recommended'));
  if (trainCell) trainCell.classList.remove('hap-cell--train-rec');
  for (const id of Object.values(recMap)) {
    document.getElementById(id)?.classList.add('hidden');
  }

  const recBtn = btnMap[rec];
  const recTagId = recMap[rec];
  if (recBtn && !recBtn.disabled) {
    recBtn.classList.add('hap-recommended');
    const tag = document.getElementById(recTagId);
    if (tag) tag.classList.remove('hidden');
  }
  if (rec === 'TRAIN' && trainBtn && !trainBtn.disabled && trainCell) {
    trainCell.classList.add('hap-cell--train-rec');
  }
}

function hubActionAllegiance() {
  openFactionSelectFromHub();
}

function hubActionBattle() {
  if (!state.playerHybrid) {
    flashHubRewardMsg('Forge a hybrid first — then tap Battle!');
    showScreen('builder');
    return;
  }
  window.startBattle();
}

function hubActionTrain() {
  const p = state.progress;
  if (!p) return;
  const target = getFirstQuizEligibleId(p);
  if (!target) return;
  state.quizReturnScreen = 'hub';
  window.openQuiz(target);
}

/** @deprecated Use hubActionTrain — kept for inline handlers / older links */
function hubActionUnlock() {
  hubActionTrain();
}

function hubActionNewFusion() {
  state.selectedAnimals = [];
  state.playerHybrid = null;
  showScreen('builder');
}

export {
  getCommanderXpSegment,
  findNextTokenRecruitTarget,
  flashHubRewardMsg,
  hubSpendCoinTune,
  hubSpendTokenRecruit,
  renderHubProgressionPanel,
  renderHubDailyChallenge,
  renderHub,
  renderHubAnimalGrid,
  renderProfile,
  renderAnimalsLevels,
  showProfile,
  showAnimalsLevels,
  getRecommendedAction,
  renderActionPanel,
  hubActionAllegiance,
  hubActionBattle,
  hubActionTrain,
  hubActionUnlock,
  hubActionMysteryReward,
  hubActionNewFusion,
  hubActionCurrentHybrid,
  hubActionTuneHybrid,
  closeHubTuneOverlay,
  hubTuneOverlayApply,
  clearAnimalsLevelsTierFilter,
  renderAnimalsTierRoster,
  showAnimalsLevelsFromTier,
  openAnimalsTierScreen,
};