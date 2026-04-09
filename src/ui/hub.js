import {
  STAT_MAX, STAGE_BASE, STAGE_APEX, STAGE_DINO, STAGE_LEGENDARY, STAGE_MYTHICAL, STAGE_EGYPTIAN,
  ANIMALS, ALL_ANIMALS, BASE_IDS, APEX_IDS, DINO_IDS, LEGENDARY_IDS, MYTHICAL_IDS, EGYPTIAN_IDS,
} from '../data/animals.js';
import { LEVELS } from '../data/levels.js';
import {
  state, COIN_TUNING_COST, TOKEN_RECRUIT_COST,
  XP_PER_BATTLE_WIN, COMMANDER_XP_SEGMENT,
} from '../game/state.js';
import {
  countBaseUnlocked, countApexUnlocked, countDinoUnlocked,
  countLegendaryUnlocked, countMythicalUnlocked, countEgyptianUnlocked, egyptianTierQuizOpen,
  apexLevelGateMet, dinoLevelGateMet,
  legendaryLevelGateMet, mythicalLevelGateMet,
  getPlayerStageLabel, getProgressionNextLines,
  isLevelLocked, isQuizEligible,
  ensureDailyChallengeRolled, dailyChallengeMet,
  DAILY_CHALLENGE_DEFS,
  RETENTION_SOFT_MONETISE_COPY, getSoftMonetisationHintLines,
  getRetentionShopTeasers,
  getNextBaseAnimalId, getNextApexAnimalId, getNextDinoAnimalId,
  getNextLegendaryAnimalId, getNextMythicalAnimalId, getNextEgyptianAnimalId,
  formatMiniStatPreview,
  getStreakBattleBoost, sumBoostPoints,
  unlockGateLinesForAnimal,
  touchDailyStreakIfNeeded,
  pickDailyChallenge,
  getAvailableAnimals,
  MAX_LEVEL,
} from '../game/progression.js';
import { powerScore, buildPlayerHybrid, buildEnemyHybrid } from '../game/hybrid.js';
import { STAT_LABELS_SIMPLE } from '../game/battle.js';
import { saveUserProgress, persistGameProgress } from '../persistence/save.js';
import { backfillLeaderboardIfMissing } from '../persistence/leaderboard.js';
import { showScreen, escapeHtml } from './screens.js';
import { localDateString, localYesterdayString } from '../game/utils.js';
import { needsFactionSelection, getFaction } from '../data/factions.js';
import { applyFactionThemeToRoot, openFactionSelectFromHub } from './faction-ui.js';


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
  return null;
}

let hubRewardMsgTimer = null;
function flashHubRewardMsg(msg) {
  const el = document.getElementById('hub-reward-msg');
  if (!el) return;
  el.textContent = msg;
  el.classList.remove('hidden');
  if (hubRewardMsgTimer) clearTimeout(hubRewardMsgTimer);
  hubRewardMsgTimer = setTimeout(() => {
    el.classList.add('hidden');
    hubRewardMsgTimer = null;
  }, 3200);
}

function hubSpendCoinTune() {
  const p = state.progress;
  if (!p || (p.coins || 0) < COIN_TUNING_COST) {
    flashHubRewardMsg('You need more Fusion Coins — win battles!');
    return;
  }
  if (!state.playerHybrid) {
    flashHubRewardMsg('Forge a hybrid in the Forge, then tune stats here.');
    return;
  }
  p.coins -= COIN_TUNING_COST;
  const h = state.playerHybrid;
  const keys = ['spd', 'agi', 'int', 'str'];
  const stat = keys[Math.floor(Math.random() * keys.length)];
  h.stats[stat] = Math.min(STAT_MAX, (h.stats[stat] || 0) + 1);
  h.power = powerScore(h.stats);
  saveUserProgress(p).catch(e => console.error('[hub] coinTune save failed', e));
  flashHubRewardMsg(`+1 ${STAT_LABELS_SIMPLE[stat]} — your hybrid grows stronger!`);
  renderHub();
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

function renderHubProgressionPanel() {
  const el = document.getElementById('hub-progress-panel');
  if (!el || !state.progress) return;
  const p = state.progress;
  const bU = countBaseUnlocked(p);
  const aU = countApexUnlocked(p);
  const dU = countDinoUnlocked(p);
  const lU = countLegendaryUnlocked(p);
  const mU = countMythicalUnlocked(p);
  const eU = countEgyptianUnlocked(p);
  const stage = getPlayerStageLabel(p);
  const apexOpen = apexLevelGateMet(p);
  const dinoOpen = dinoLevelGateMet(p);
  const legendOpen = legendaryLevelGateMet(p);
  const mythOpen = mythicalLevelGateMet(p);
  const egyptOpen = egyptianTierQuizOpen(p);
  const apexLine = apexOpen ? `${aU} / ${APEX_IDS.length} unlocked` : 'Locked — beat Level 5 first';
  const dinoLine = dinoOpen ? `${dU} / ${DINO_IDS.length} unlocked` : 'Locked — beat Level 8 first';
  const legendLine = legendOpen ? `${lU} / ${LEGENDARY_IDS.length} unlocked` : 'Locked — beat Level 12 first';
  const mythLine = mythOpen ? `${mU} / ${MYTHICAL_IDS.length} unlocked` : 'Locked — beat Level 16 first';
  const egyptLine = egyptOpen ? `${eU} / ${EGYPTIAN_IDS.length} unlocked` : 'Locked — recruit all Mythical Gods first';
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
    </ul>
    <div class="hub-progress-gates">
      <div class="hpg-row"><span class="${apexOpen ? 'hpg-ok' : 'hpg-no'}">${apexOpen ? '✓' : '○'}</span> Apex level gate (Level 6+)</div>
      <div class="hpg-row"><span class="${dinoOpen ? 'hpg-ok' : 'hpg-no'}">${dinoOpen ? '✓' : '○'}</span> Dino level gate (Level 9+)</div>
      <div class="hpg-row"><span class="${legendOpen ? 'hpg-ok' : 'hpg-no'}">${legendOpen ? '✓' : '○'}</span> Legendary level gate (Level 13+)</div>
      <div class="hpg-row"><span class="${mythOpen ? 'hpg-ok' : 'hpg-no'}">${mythOpen ? '✓' : '○'}</span> Mythical level gate (Level 17+)</div>
      <div class="hpg-row"><span class="${egyptOpen ? 'hpg-ok' : 'hpg-no'}">${egyptOpen ? '✓' : '○'}</span> Egyptian tier (all Mythical quizzes)</div>
    </div>
    <div class="hub-progress-next">${nextLines.join('<br>')}</div>
    ${
      sumBoostPoints(getStreakBattleBoost(p)) > 0
        ? `<div class="hub-streak-bonus">🔥 Streak power: +${sumBoostPoints(getStreakBattleBoost(p))} bonus stats in your next battle.</div>`
        : ''
    }
    <div class="hub-soft-gates">${[...getRetentionShopTeasers(), ...getSoftMonetisationHintLines(p)].map(s => `<div class="soft-gate-line">${s}</div>`).join('')}</div>`;
}

function renderHubDailyChallenge() {
  const el = document.getElementById('hub-daily-challenge');
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

function renderHub() {
  const p = state.progress;
  if (!p) return;
  if (needsFactionSelection(p)) {
    showScreen('faction-select');
    return;
  }
  applyFactionThemeToRoot();
  if (touchDailyStreakIfNeeded(p)) persistGameProgress().catch(e => console.error('[hub] streak save failed', e));
  backfillLeaderboardIfMissing().catch(e => console.error('[hub] lb backfill failed', e));
  const levelIdx = Math.min(p.level - 1, LEVELS.length - 1);
  const level = LEVELS[levelIdx];

  document.getElementById('hub-username').textContent = state.profile?.username || '—';
  const facBadge = document.getElementById('hub-faction-badge');
  const facBtn = document.getElementById('hub-btn-faction');
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
  if (facBtn) facBtn.classList.toggle('hidden', !fac || !mythicalLevelGateMet(p));
  document.getElementById('hub-wins').textContent = p.totalWins;
  document.getElementById('hub-losses').textContent = p.totalLosses;
  const streakEl = document.getElementById('hub-streak');
  if (streakEl) {
    const n = p.streakCount || 0;
    streakEl.textContent = `🔥 ${n} day streak`;
  }
  const coinsEl = document.getElementById('hsb-coins');
  if (coinsEl) coinsEl.textContent = String(p.coins ?? 0);
  const tokEl = document.getElementById('hsb-tokens');
  if (tokEl) tokEl.textContent = String(p.unlockTokens ?? 0);

  // Status bar
  document.getElementById('hsb-level').textContent = p.level > MAX_LEVEL ? 'Complete!' : `${p.level} / ${MAX_LEVEL}`;

  const apexCount = APEX_IDS.filter(id => p.quizUnlocked.includes(id)).length;
  const dinoCount = DINO_IDS.filter(id => p.quizUnlocked.includes(id)).length;
  const legCount = LEGENDARY_IDS.filter(id => p.quizUnlocked.includes(id)).length;
  const mythCount = MYTHICAL_IDS.filter(id => p.quizUnlocked.includes(id)).length;
  const egyptCount = EGYPTIAN_IDS.filter(id => p.quizUnlocked.includes(id)).length;
  const baseU = countBaseUnlocked(p);
  let tierTxt = `B ${baseU}/10`;
  if (apexLevelGateMet(p)) tierTxt += ` · A ${apexCount}/10`;
  if (dinoLevelGateMet(p)) tierTxt += ` · D ${dinoCount}/10`;
  if (legendaryLevelGateMet(p)) tierTxt += ` · L ${legCount}/10`;
  if (mythicalLevelGateMet(p)) tierTxt += ` · M ${mythCount}/10`;
  if (egyptianTierQuizOpen(p)) tierTxt += ` · Eg ${egyptCount}/10`;
  document.getElementById('hsb-tiers').textContent = tierTxt;
  const tierColor = egyptCount > 0 ? 'egyptian' : mythCount > 0 ? 'mythical' : legCount > 0 ? 'legendary' : dinoCount > 0 ? 'dino' : apexCount > 0 ? 'purple' : '';
  document.getElementById('hsb-tiers').className = 'hsb-val ' + tierColor;

  // Current hybrid
  if (state.playerHybrid) {
    const h = state.playerHybrid;
    document.getElementById('hsb-hybrid').textContent = `${h.emojis} ${h.name}`;
    document.getElementById('hsb-power').textContent = `${h.power} ⚡`;
  } else {
    document.getElementById('hsb-hybrid').textContent = '—';
    document.getElementById('hsb-power').textContent = '—';
  }

  const xpUi = getCommanderXpSegment(p.commanderXp || 0);
  const xpFill = document.getElementById('hub-xp-bar-fill');
  const xpMeta = document.getElementById('hub-xp-meta');
  const xpSegLbl = document.getElementById('hub-xp-seg-lbl');
  const xpTrack = document.getElementById('hub-xp-bar-track');
  if (xpFill) xpFill.style.width = `${xpUi.pct}%`;
  if (xpSegLbl) xpSegLbl.textContent = `Spark ${xpUi.tier}`;
  if (xpTrack) xpTrack.setAttribute('aria-valuenow', String(Math.round(xpUi.pct)));
  if (xpMeta) {
    xpMeta.textContent = `Commander XP · ${xpUi.inSeg} / ${xpUi.seg} points in this spark (wins fill the bar)`;
  }

  const coinBtn = document.getElementById('hub-btn-coin-tune');
  const tokBtn = document.getElementById('hub-btn-token-recruit');
  const coinCan = (p.coins || 0) >= COIN_TUNING_COST && !!state.playerHybrid;
  const tokTgt = findNextTokenRecruitTarget(p);
  const tokCan = (p.unlockTokens || 0) >= TOKEN_RECRUIT_COST && !!tokTgt;
  if (coinBtn) coinBtn.disabled = !coinCan;
  if (tokBtn) tokBtn.disabled = !tokCan;

  // Level banner
  document.getElementById('hub-level-name').textContent = p.level > MAX_LEVEL ? 'Game Complete!' : `Level ${p.level} — ${level.name}`;
  document.getElementById('hub-level-desc').textContent = p.level > MAX_LEVEL ? 'You conquered all levels.' : level.desc;

  // Badges
  const ba = document.getElementById('hub-badge-area');
  ba.innerHTML = '';
  if (level && level.isFinal) ba.innerHTML += '<span class="lv-badge badge-final">⚠ FINAL BOSS</span>';
  else if (level && level.isBoss) ba.innerHTML += '<span class="lv-badge badge-final">⚠ BOSS BATTLE</span>';
  else if (level && level.isHard) ba.innerHTML += '<span class="lv-badge badge-hard">DANGER ZONE</span>';
  if (p.level > MAX_LEVEL) ba.innerHTML += '<span class="lv-badge badge-egyptian">⚱️ DUAT CONQUEROR</span>';
  else if (egyptCount > 0) ba.innerHTML += '<span class="lv-badge badge-egyptian">⚱️ EGYPTIAN ACTIVE</span>';
  else if (mythCount > 0) ba.innerHTML += '<span class="lv-badge badge-mythical">⚡ MYTHICAL ACTIVE</span>';
  else if (legCount > 0) ba.innerHTML += '<span class="lv-badge badge-legendary">🐲 LEGENDARY ACTIVE</span>';
  else if (dinoCount > 0) ba.innerHTML += '<span class="lv-badge badge-dino">🦖 DINO ACTIVE</span>';
  else if (apexCount > 0) ba.innerHTML += '<span class="lv-badge badge-apex">◈ APEX UNLOCKED</span>';

  // Progress pips
  const pips = document.getElementById('lv-progress-pips');
  pips.innerHTML = '';
  for (let i = 1; i <= MAX_LEVEL; i++) {
    const pip = document.createElement('div');
    pip.className = 'lv-pip' + (i < p.level ? ' done' : i === p.level ? ' current' : '');
    pips.appendChild(pip);
  }

  // Enemy preview
  if (level) {
    const comps = level.animals.map(id => ALL_ANIMALS[id]).filter(Boolean);
    document.getElementById('hub-enemy-preview').innerHTML =
      `Enemy: <span>${comps.map(a => a.emoji + ' ' + a.name).join(' + ')}</span>`;
  }

  // Hybrid display card
  const hd = document.getElementById('hub-hybrid-display');
  if (state.playerHybrid) {
    const h = state.playerHybrid;
    hd.innerHTML = `
      <div style="font-size:1.9rem;margin-bottom:4px">${h.emojis}</div>
      <div style="font-family:var(--fd);font-size:1rem;font-weight:700;color:var(--text-bright);margin-bottom:2px">${h.name}</div>
      <div style="font-size:.6rem;font-family:var(--fm);color:var(--text-dim);margin-bottom:8px">${h.composition}</div>
      <div class="hub-power-row" style="justify-content:center;gap:16px">
        <div style="text-align:center">
          <div class="hub-power-score">${h.power}</div>
          <div class="hub-power-lbl">Power Score</div>
        </div>
      </div>`;
  } else {
    hd.innerHTML = `<div style="padding:8px 0;color:var(--text-dim);font-size:.72rem">No hybrid forged yet.<br>Go to the Forge to build one.</div>`;
  }

  const rosterHint = document.getElementById('hub-roster-hint');
  if (rosterHint) {
    rosterHint.innerHTML =
      '<strong>Base</strong> — win levels to recruit the full roster (3 starters, then 7 more).<br>' +
      '<strong>Apex</strong> — beat Level 5, then pass each Apex quiz.<br>' +
      '<strong>Dinos</strong> — beat Level 8, then pass each Dino quiz.<br>' +
      '<strong>Legendary</strong> — beat Level 12 to unlock Legendary Beast quizzes.<br>' +
      '<strong>Mythical</strong> — beat Level 16 to unlock Mythical God quizzes.<br>' +
      '<strong>Egyptian Guardians</strong> — recruit every Mythical God, then quiz; desert missions Levels 21–25.'; //
      '<strong>Dinos</strong> — beat Level 8, then pass each Dino quiz. Locked rows show ✓/○ for what’s done.';
  }

  const hintEl = document.getElementById('hub-primary-hint');
  if (hintEl) {
    const lines = getProgressionNextLines(p);
    let t = '';
    if (lines.length) {
      const tmp = document.createElement('div');
      tmp.innerHTML = lines[0];
      t = (tmp.textContent || tmp.innerText || '').replace(/\s+/g, ' ').trim();
    }
    hintEl.textContent =
      t ||
      (p.level > MAX_LEVEL
        ? 'Campaign clear — climb the leaderboard or experiment in the Forge.'
        : 'Forge a hybrid below, then fight this level.');
  }

  renderHubProgressionPanel();
  renderHubDailyChallenge();
  renderActionPanel();
  renderHubAnimalGrid();
}

function renderHubAnimalGrid() {
  const p = state.progress;
  const available = getAvailableAnimals(p);
  const grid = document.getElementById('hub-animal-grid');
  grid.innerHTML = '';

  for (const id of Object.keys(ANIMALS)) {
    const a = ANIMALS[id];
    const isAvail = available.includes(id);
    const isQL = isQuizEligible(id, p);
    const isLL = isLevelLocked(id, p);

    const chip = document.createElement('div');
    const stageChipMap = {
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
      [STAGE_EGYPTIAN]: 'EGYPT',
      [STAGE_MYTHICAL]: 'MYTHICAL',
      [STAGE_LEGENDARY]: 'LEGEND',
      [STAGE_DINO]: 'DINO',
      [STAGE_APEX]: 'APEX',
    };
    const tierClsMap = {
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
    chip.innerHTML = `<span class="a-chip-em">${a.emoji}</span>
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

    if (isQL) {
      chip.title = `Unlock ${a.name}: level done ✓ — tap to try the quiz.`;
      chip.onclick = () => {
        state.quizReturnScreen = 'hub';
        window.openQuiz(id);
      };
    } else if (isLL && gates) {
      chip.title = gates.map(g => `${g.ok ? 'Done' : 'Todo'}: ${g.text}`).join('\n');
    }

    grid.appendChild(chip);
  }
}

/* ── Action Panel: "Choose Your Next Move" ── */

function getFirstQuizEligibleId(p) {
  for (const id of [...APEX_IDS, ...DINO_IDS, ...LEGENDARY_IDS, ...MYTHICAL_IDS, ...EGYPTIAN_IDS]) {
    if (isQuizEligible(id, p)) return id;
  }
  return null;
}

function getRecommendedAction(p) {
  const unlockTarget = getFirstQuizEligibleId(p);
  const hasHybrid = !!state.playerHybrid;

  if (state.lastBattleResult === 'loss') {
    if (unlockTarget) return 'UNLOCK';
    if (hasHybrid) return 'IMPROVE';
    return 'FIGHT';
  }

  if (unlockTarget) return 'UNLOCK';

  if (state.playerHybrid && state.enemyHybrid) {
    if (state.playerHybrid.power < state.enemyHybrid.power) return 'IMPROVE';
  } else if (state.playerHybrid) {
    const levelIdx = Math.min(p.level - 1, LEVELS.length - 1);
    const eDef = LEVELS[levelIdx];
    if (eDef) {
      const eH = buildEnemyHybrid(eDef);
      if (state.playerHybrid.power < eH.power) return 'IMPROVE';
    }
  }

  return 'FIGHT';
}

function renderActionPanel() {
  const panel = document.getElementById('hub-action-panel');
  if (!panel || !state.progress) return;
  const p = state.progress;

  if (p.level > MAX_LEVEL) {
    panel.classList.add('hidden');
    return;
  }
  panel.classList.remove('hidden');

  const rec = getRecommendedAction(p);

  const allegianceBtn = document.getElementById('hap-allegiance');
  const unlockBtn = document.getElementById('hap-unlock');
  const improveBtn = document.getElementById('hap-improve');
  const fusionBtn = document.getElementById('hap-fusion');

  const hasHybrid = !!state.playerHybrid;
  const unlockTarget = getFirstQuizEligibleId(p);

  if (allegianceBtn) allegianceBtn.disabled = false;

  // Unlock — available if a quiz-eligible creature exists
  const unlockLabel = document.getElementById('hap-unlock-label');
  const unlockSub = document.getElementById('hap-unlock-sub');
  if (unlockTarget) {
    const a = ANIMALS[unlockTarget];
    const tierMap = {
      [STAGE_APEX]: 'Apex',
      [STAGE_DINO]: 'Dinosaur',
      [STAGE_LEGENDARY]: 'Legendary',
      [STAGE_MYTHICAL]: 'Mythical',
      [STAGE_EGYPTIAN]: 'Egyptian',
    };
    const tier = tierMap[a?.stage] || 'New';
    if (unlockLabel) unlockLabel.textContent = `Unlock ${tier} Creature`;
    if (unlockSub) unlockSub.textContent = `${a?.emoji || ''} ${a?.name || 'Unknown'} — take the quiz`;
    unlockBtn.disabled = false;
  } else {
    if (unlockLabel) unlockLabel.textContent = 'Unlock New Creature';
    const nextGate = !apexLevelGateMet(p) ? 'Beat Level 5 first'
      : !dinoLevelGateMet(p) ? 'Beat Level 8 first'
      : !legendaryLevelGateMet(p) ? 'Beat Level 12 first'
      : !mythicalLevelGateMet(p) ? 'Beat Level 16 first'
      : 'All creatures unlocked!';
    if (unlockSub) unlockSub.textContent = nextGate;
    unlockBtn.disabled = true;
  }

  // Improve — available if hybrid exists
  improveBtn.disabled = !hasHybrid;
  const improveSub = document.getElementById('hap-improve-sub');
  if (improveSub) improveSub.textContent = hasHybrid
    ? 'Shuffle hybrid stats' : 'Forge a hybrid first';

  // Fusion — always available
  fusionBtn.disabled = false;

  // Recommended highlight
  const btnMap = { UNLOCK: unlockBtn, IMPROVE: improveBtn, FIGHT: null };
  const recMap = { UNLOCK: 'hap-rec-unlock', IMPROVE: 'hap-rec-improve', FUSION: 'hap-rec-fusion' };
  [allegianceBtn, unlockBtn, improveBtn, fusionBtn].forEach(b => b?.classList.remove('hap-recommended'));
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
}

function hubActionAllegiance() {
  openFactionSelectFromHub();
}

function hubActionUnlock() {
  const p = state.progress;
  if (!p) return;
  const target = getFirstQuizEligibleId(p);
  if (!target) return;
  state.quizReturnScreen = 'hub';
  window.openQuiz(target);
}

function hubActionImprove() {
  if (!state.playerHybrid || !state.selectedAnimals.length) {
    flashHubRewardMsg('Forge a hybrid first, then re-roll here.');
    return;
  }
  state.playerHybrid = buildPlayerHybrid(state.selectedAnimals);
  persistGameProgress().catch(e => console.error('[hub] reroll save failed', e));
  flashHubRewardMsg(`Stats re-rolled! New power: ${state.playerHybrid.power} ⚡`);
  renderHub();
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
  getRecommendedAction,
  renderActionPanel,
  hubActionAllegiance,
  hubActionUnlock,
  hubActionImprove,
  hubActionNewFusion,
};