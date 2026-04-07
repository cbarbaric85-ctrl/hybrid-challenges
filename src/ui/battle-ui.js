import {
  STAT_MAX, ANIMALS, ALL_ANIMALS,
  BASE_IDS, APEX_IDS, DINO_IDS, LEGENDARY_IDS, MYTHICAL_IDS,
} from '../data/animals.js';
import { LEVEL_REWARDS, LEVELS } from '../data/levels.js';
import {
  state,
  XP_PER_BATTLE_WIN,
  clearLevelCompleteAutoNav, setLevelCompleteAutoNavTimer,
  clearDefeatAutoReturn, setDefeatReturnToHubTimer,
  defaultProgress,
} from '../game/state.js';
import {
  getActiveBattleBoosts, mergeStatBoosts, sumBoostPoints,
  touchDailyStreakIfNeeded, ensureDailyChallengeRolled,
  dailyChallengeMet, DAILY_CHALLENGE_DEFS,
  countBaseUnlocked, countApexUnlocked, countDinoUnlocked,
  isLevelLocked, getPlayerStageLabel,
  BASE_UNLOCK_LEVEL, getStreakBattleBoost,
  pickDailyChallenge, getProgressionNextLines,
} from '../game/progression.js';
import {
  powerScore, hybridTierClass, buildPlayerHybrid, buildEnemyHybrid,
} from '../game/hybrid.js';
import {
  STAT_WEIGHTS, STAT_LABELS, STAT_LABELS_SIMPLE,
  STAT_TRAIL_ICONS, PRE_BATTLE_STAT_WORDS,
  EMPTY_STAT_BOOST,
  shuffleArray, shuffleQuestionOpts,
  buildPreBattleQuizForAnimals,
  scrollToBattlePreQuiz, scrollToBattleFocus,
  scrollToBattleTrail, scrollToBattleStageArea,
  hybridWithTempBoost, getBattleDisplayPlayerHybrid,
  roll, simulateRound, runFullBattle,
} from '../game/battle.js';
import { saveUserProgress, persistGameProgress, recordQuizAnswers, computeQuizAccuracy } from '../persistence/save.js';
import { syncLeaderboardEntry } from '../persistence/leaderboard.js';
import { showScreen, escapeHtml } from './screens.js';
import { localDateString } from '../game/utils.js';

function startBattle() {
  if (!state.playerHybrid) return;
  clearDefeatAutoReturn();
  state.battleFlowGen = (state.battleFlowGen || 0) + 1;
  const p = state.progress;
  const levelDef = LEVELS[Math.min(p.level - 1, LEVELS.length - 1)];
  state.enemyHybrid = buildEnemyHybrid(levelDef);
  const questions = buildPreBattleQuizForAnimals(state.playerHybrid.animals);
  state.battle = {
    levelDef,
    rounds: [],
    pWins: 0,
    eWins: 0,
    phase: 'pre_quiz',
    quizBoosts: EMPTY_STAT_BOOST(),
    preQuiz: {
      questions,
      idx: 0,
      boosts: EMPTY_STAT_BOOST(),
      answered: false,
      lastCorrect: null,
    },
  };
  renderBattleScreen();
  showScreen('battle');
  setTimeout(() => scrollToBattlePreQuiz(), 120);
}

function renderPreBattleQuizUI() {
  const wrap = document.getElementById('battle-pre-quiz');
  const b = state.battle;
  if (!wrap || !b?.preQuiz) return;
  const pq = b.preQuiz;
  const q = pq.questions[pq.idx];
  if (!q) return;

  const n = pq.questions.length;
  const teamLine = state.playerHybrid?.composition?.replace(/ · /g, ' • ') || 'Your team';
  const qNum = pq.idx + 1;
  const letters = ['A', 'B', 'C', 'D'];
  const optsHtml = q.opts
    .map(
      (opt, i) =>
        `<button type="button" class="pre-q-opt" id="preq-opt-${i}" onclick="answerPreBattleQuestion(${i})">
          <strong>${letters[i]}.</strong> ${escapeHtml(opt)}
        </button>`
    )
    .join('');

  wrap.innerHTML = `
    <div class="pre-quiz-title"><span class="pre-quiz-emoji" aria-hidden="true">⚡</span>Battle Boost Quiz</div>
    <p class="pre-quiz-sub"><strong>${n >= 3 ? 'Answer 3 questions' : n === 2 ? 'Answer 2 questions' : 'Answer 1 question'} to power up your hybrid.</strong><br>Each right answer adds a tiny battle boost. Wrong answers never hurt you.</p>
    <div class="pre-quiz-team" aria-label="Your team"><strong>${escapeHtml(state.playerHybrid?.name || 'Your hybrid')}</strong> · ${escapeHtml(teamLine)}</div>
    <div class="pre-quiz-hdr">Question ${qNum} of ${n} · ${q.emoji} ${escapeHtml(q.name)}</div>
    <div class="pre-qtxt">${escapeHtml(q.q)}</div>
    <div class="pre-q-opts">${optsHtml}</div>`;
}

function answerPreBattleQuestion(optIdx) {
  const b = state.battle;
  if (!b?.preQuiz || b.preQuiz.answered) return;
  const pq = b.preQuiz;
  const q = pq.questions[pq.idx];
  pq.answered = true;
  const ok = optIdx === q.correct;
  pq.lastCorrect = ok;
  if (ok) pq.boosts[q.boostStat]++;
  if (state.progress) {
    recordQuizAnswers(state.progress, 1, ok ? 1 : 0);
    persistGameProgress().catch(e => console.error('[battle] preBattle quiz save failed', e));
  }

  q.opts.forEach((_, i) => {
    const btn = document.getElementById(`preq-opt-${i}`);
    if (!btn) return;
    btn.disabled = true;
    if (i === q.correct) btn.classList.add('qcorrect');
    else if (i === optIdx && !ok) btn.classList.add('qwrong');
  });

  const wrap = document.getElementById('battle-pre-quiz');
  const statWord = PRE_BATTLE_STAT_WORDS[q.boostStat];
  const fb = document.createElement('div');
  fb.className = 'pre-q-feedback';
  fb.style.color = ok ? 'var(--green)' : 'var(--text-dim)';
  fb.innerHTML = ok
    ? `<strong style="display:block;margin-bottom:4px">Boost unlocked!</strong>+1 ${statWord} for this fight.`
    : '<strong style="display:block;margin-bottom:4px">No boost this time</strong>You are still full strength — try the next question!';
  wrap.appendChild(fb);
  if (q.funFact) {
    const fact = document.createElement('div');
    fact.className = 'pre-q-funfact';
    fact.innerHTML = `<strong>Fun fact</strong>${escapeHtml(q.funFact)}`;
    wrap.appendChild(fact);
  }
  const next = document.createElement('div');
  next.style.cssText = 'margin-top:14px;text-align:center';
  next.innerHTML = `<button type="button" class="btn btn-primary" onclick="advancePreBattleQuiz()">${pq.idx >= pq.questions.length - 1 ? 'See boosts →' : 'Next question →'}</button>`;
  wrap.appendChild(next);
}

function advancePreBattleQuiz() {
  const b = state.battle;
  if (!b?.preQuiz) return;
  const pq = b.preQuiz;
  pq.idx++;
  pq.answered = false;
  pq.lastCorrect = null;
  if (pq.idx >= pq.questions.length) {
    b.quizBoosts = { ...pq.boosts };
    b.phase = 'boost_summary';
  }
  renderBattleScreen();
}

function renderBattleBoostSummaryUI() {
  const el = document.getElementById('battle-boost-summary');
  const quizEl = document.getElementById('battle-pre-quiz');
  const b = state.battle;
  if (!el || !b) return;
  el.classList.remove('hidden');
  if (quizEl) quizEl.innerHTML = '';

  const boosts = b.quizBoosts || EMPTY_STAT_BOOST();
  const lines = [];
  for (const k of ['spd', 'agi', 'int', 'str']) {
    const n = boosts[k] || 0;
    if (n > 0) lines.push(`+${n} ${PRE_BATTLE_STAT_WORDS[k]}${n > 1 ? '' : ''} (this battle)`);
  }
  const streakB = state.progress ? getStreakBattleBoost(state.progress) : EMPTY_STAT_BOOST();
  const streakPts = sumBoostPoints(streakB);
  const streakLine =
    streakPts > 0
      ? `<div class="boost-line" style="color:var(--orange)">🔥 +${streakPts} from your daily streak (this battle)</div>`
      : '';
  const list =
    lines.length > 0
      ? lines.map(t => `<div class="boost-line">✓ ${t}</div>`).join('')
      : `<div class="boost-line" style="color:var(--text-dim)">No quiz boosts this time — your base hybrid is ready to fight.</div>`;

  el.innerHTML = `
    <div class="boost-summary-box">
      <div class="boost-summary-title">Boosts for this battle</div>
      ${list}
      ${streakLine}
      <p style="font-family:var(--fm);font-size:.58rem;color:var(--text-dim);margin:12px 0 14px;line-height:1.45">
        Wrong answers do not weaken you — they only skip the extra bonus.
      </p>
      <div style="text-align:center">
        <button type="button" class="btn btn-primary btn-lg" onclick="confirmPreBattleAndStartFight()">⚔ Start fight!</button>
      </div>
    </div>`;
  setTimeout(() => scrollToBattlePreQuiz(), 80);
}

function confirmPreBattleAndStartFight() {
  const b = state.battle;
  if (!b) return;
  b.phase = 'ready';
  const pre = document.getElementById('battle-prephase');
  const boostEl = document.getElementById('battle-boost-summary');
  const stage = document.getElementById('battle-stage');
  const bLog = document.querySelector('#screen-battle .b-log');
  if (pre) pre.classList.add('hidden');
  if (boostEl) boostEl.classList.add('hidden');
  if (stage) stage.classList.remove('pre-quiz-dim');
  if (bLog) bLog.classList.remove('hidden');

  const disp = getBattleDisplayPlayerHybrid();
  document.getElementById('bp-em').textContent = disp.emojis;
  document.getElementById('bp-name').textContent = disp.name;
  document.getElementById('bp-comp').textContent = disp.composition;
  const qPts = sumBoostPoints(state.battle.quizBoosts || EMPTY_STAT_BOOST());
  const sPts = sumBoostPoints(getStreakBattleBoost(state.progress));
  const bonusLbl = [qPts ? `+${qPts} quiz` : '', sPts ? `+${sPts} streak` : ''].filter(Boolean).join(' · ');
  document.getElementById('bp-power').innerHTML =
    bonusLbl
      ? `Power: <strong>${disp.power}</strong> <span style="color:var(--green);font-size:.55rem">(${bonusLbl})</span>`
      : `Power: <strong>${disp.power}</strong>`;
  renderFighterStats('bp-stats', disp.stats);

  beginBattle();
}

function renderBattleScreen() {
  const h = state.playerHybrid;
  const e = state.enemyHybrid;
  const def = state.battle.levelDef;
  const pre = document.getElementById('battle-prephase');
  const boostEl = document.getElementById('battle-boost-summary');
  const stage = document.getElementById('battle-stage');
  const bLog = document.querySelector('#screen-battle .b-log');

  const pill = document.getElementById('battle-level-pill');
  if (pill) pill.textContent = `Level ${def.id} / 10`;
  document.getElementById('b-lvl-tag').textContent = 'Best of 5 rounds · Stat clash';
  document.getElementById('b-title').textContent = def.name.toUpperCase();
  document.getElementById('battle-topbar-info').textContent = `Mission L${def.id} — ${def.name}`;

  const disp = getBattleDisplayPlayerHybrid();
  document.getElementById('bp-em').textContent = disp.emojis;
  document.getElementById('bp-name').textContent = disp.name;
  document.getElementById('bp-comp').textContent = disp.composition;
  const qPts = sumBoostPoints(state.battle.quizBoosts || EMPTY_STAT_BOOST());
  const sPts =
    state.battle.phase !== 'pre_quiz' ? sumBoostPoints(getStreakBattleBoost(state.progress)) : 0;
  const bonusLbl = [qPts ? `+${qPts} quiz` : '', sPts ? `+${sPts} streak` : ''].filter(Boolean).join(' · ');
  document.getElementById('bp-power').innerHTML =
    bonusLbl && state.battle.phase !== 'pre_quiz'
      ? `Power: <strong>${disp.power}</strong> <span style="color:var(--green);font-size:.55rem">(${bonusLbl})</span>`
      : `Power: <strong>${disp.power}</strong>`;
  renderFighterStats('bp-stats', disp.stats);

  document.getElementById('be-em').textContent = e.emojis;
  document.getElementById('be-name').textContent = e.name;
  document.getElementById('be-comp').textContent = e.composition;
  document.getElementById('be-power').innerHTML = `Power: <strong>${e.power}</strong>`;
  renderFighterStats('be-stats', e.stats);

  resetHearts();
  resetRoundPips();
  resetBattleRoundStrip();
  document.getElementById('log-lines').innerHTML = '';
  document.getElementById('clash-box').classList.add('hidden');
  document.getElementById('clash-box').classList.remove('clash-active');
  clearClashStatHighlight();
  resetClashMeters();
  document.getElementById('battle-countdown-overlay')?.classList.add('hidden');
  hideBattleResultOverlay();

  const fp = document.getElementById('fighter-player');
  const fe = document.getElementById('fighter-enemy');
  if (fp) fp.classList.toggle('fighter-champion', !!h);
  if (fe) fe.classList.remove('fighter-champion');

  const phase = state.battle.phase;
  if (phase === 'pre_quiz') {
    if (pre) pre.classList.remove('hidden');
    if (boostEl) boostEl.classList.add('hidden');
    if (stage) stage.classList.add('pre-quiz-dim');
    if (bLog) bLog.classList.add('hidden');
    renderPreBattleQuizUI();
    document.getElementById('b-actions').innerHTML = '';
    return;
  }
  if (phase === 'boost_summary') {
    if (pre) pre.classList.remove('hidden');
    if (stage) stage.classList.add('pre-quiz-dim');
    if (bLog) bLog.classList.add('hidden');
    renderBattleBoostSummaryUI();
    document.getElementById('b-actions').innerHTML = '';
    return;
  }

  if (pre) pre.classList.add('hidden');
  if (boostEl) boostEl.classList.add('hidden');
  if (stage) stage.classList.remove('pre-quiz-dim');
  if (bLog) bLog.classList.remove('hidden');
  document.getElementById('b-actions').innerHTML = `<button class="btn btn-primary btn-lg" onclick="beginBattle()">⚔ Begin Battle</button>`;
}

function renderFighterStats(containerId, stats) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = `<div class="stat-pillars">${['spd', 'agi', 'int', 'str']
    .map(
      s =>
        `<div class="stat-pillar battle-stat-pillar" data-stat="${s}">
          <div class="sp-val">${stats[s]}</div>
          <div class="sp-track"><div class="sp-fill sf-${s}" style="height:${Math.min((stats[s] / STAT_MAX) * 100, 100)}%"></div></div>
          <div class="sp-lbl-row"><span class="sp-lbl">${s.toUpperCase()}</span><span class="sp-info" data-stat="${s}">i</span></div>
        </div>`
    )
    .join('')}</div>`;
}

function resetHearts() {
  ['bp-hearts','be-hearts'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = '';
    for (let i = 0; i < 5; i++) el.innerHTML += `<span class="hrt" id="${id.split('-')[0]}-h-${i}">♥</span>`;
  });
}
function resetRoundPips() {
  const pips = document.getElementById('round-pips');
  if (!pips) return;
  pips.innerHTML = '';
  for (let i = 0; i < 5; i++) pips.innerHTML += `<div class="r-pip" id="rpip-${i}"></div>`;
  const counter = document.getElementById('r-counter');
  if (counter) counter.textContent = '0 / 5';
}

function resetBattleRoundStrip() {
  const strip = document.getElementById('battle-round-strip');
  const dots = document.getElementById('brs-dots');
  const label = document.getElementById('brs-label');
  if (!strip || !dots || !label) return;
  strip.classList.add('hidden');
  dots.innerHTML = '';
  for (let i = 0; i < 5; i++) dots.innerHTML += '<span class="brs-dot up" aria-hidden="true"></span>';
  label.textContent = 'Round 1 of 5';
}

function showBattleRoundStrip() {
  document.getElementById('battle-round-strip')?.classList.remove('hidden');
}

function setBattleRoundStripProgress(roundIdx) {
  const label = document.getElementById('brs-label');
  const dots = document.querySelectorAll('#brs-dots .brs-dot');
  if (label) label.textContent = `Round ${roundIdx + 1} of 5`;
  dots.forEach((d, i) => {
    d.classList.remove('done', 'current', 'up');
    if (i < roundIdx) d.classList.add('done');
    else if (i === roundIdx) d.classList.add('current');
    else d.classList.add('up');
  });
}

function finalizeBattleRoundStrip() {
  document.querySelectorAll('#brs-dots .brs-dot').forEach(d => {
    d.classList.remove('current', 'up');
    d.classList.add('done');
  });
  const label = document.getElementById('brs-label');
  if (label) label.textContent = 'Round 5 of 5';
}

// ═══════════════════════════════════════════════════════════════════
// BATTLE EXECUTION (animated)
// ═══════════════════════════════════════════════════════════════════

function runBattleCountdown(done) {
  const overlay = document.getElementById('battle-countdown-overlay');
  if (!overlay) { done(); return; }
  const steps = ['3', '2', '1', 'CLASH!'];
  let i = 0;
  overlay.classList.remove('hidden');
  overlay.setAttribute('aria-hidden', 'false');
  function step() {
    if (i >= steps.length) {
      overlay.classList.add('hidden');
      overlay.textContent = '';
      overlay.setAttribute('aria-hidden', 'true');
      done();
      return;
    }
    if (steps[i] === 'CLASH!') scrollToBattleFocus();
    overlay.textContent = steps[i];
    overlay.classList.remove('cd-pop');
    void overlay.offsetWidth;
    overlay.classList.add('cd-pop');
    const ms = i === 3 ? 620 : 820;
    i++;
    setTimeout(step, ms);
  }
  step();
}

function clearClashStatHighlight() {
  document.querySelectorAll('.battle-stat-pillar').forEach(el => {
    el.classList.remove('clash-stat-active', 'sp-anim-active', 'sp-anim-spd', 'sp-anim-agi', 'sp-anim-int', 'sp-anim-str', 'sp-clash-win', 'sp-clash-lose');
  });
}

function setClashStatHighlight(stat) {
  clearClashStatHighlight();
  document.querySelectorAll(`.battle-stat-pillar[data-stat="${stat}"]`).forEach(el => {
    el.classList.add('clash-stat-active', 'sp-anim-active', `sp-anim-${stat}`);
  });
}

/** Player bar only (rival bar still 0) — staggered reveal */
function setClashMetersPlayerPortion(pTotal, eTotal) {
  const pm = document.getElementById('clash-pmeter');
  const em = document.getElementById('clash-emeter');
  if (!pm || !em) return;
  const sum = Math.max(1, pTotal + eTotal);
  const pw = Math.round((pTotal / sum) * 100);
  pm.style.transition = 'width .45s cubic-bezier(.35,.85,.4,1)';
  em.style.transition = 'width .35s ease';
  em.style.width = '0%';
  pm.style.width = `${pw}%`;
}

/** Finish split: animate rival bar to its share */
function setClashMetersEnemyPortion(pTotal, eTotal) {
  const pm = document.getElementById('clash-pmeter');
  const em = document.getElementById('clash-emeter');
  if (!pm || !em) return;
  const sum = Math.max(1, pTotal + eTotal);
  const ew = Math.round((eTotal / sum) * 100);
  em.style.transition = 'width .45s cubic-bezier(.35,.85,.4,1)';
  em.style.width = `${ew}%`;
}

function clearClashMeterWinHighlight() {
  document.getElementById('clash-meter-row-p')?.classList.remove('clash-meter-win');
  document.getElementById('clash-meter-row-e')?.classList.remove('clash-meter-win');
}

function setClashMeterWinHighlight(winner) {
  clearClashMeterWinHighlight();
  if (winner === 'player') document.getElementById('clash-meter-row-p')?.classList.add('clash-meter-win');
  else if (winner === 'enemy') document.getElementById('clash-meter-row-e')?.classList.add('clash-meter-win');
}

function resetClashMeters() {
  const pm = document.getElementById('clash-pmeter');
  const em = document.getElementById('clash-emeter');
  if (!pm || !em) return;
  clearClashMeterWinHighlight();
  pm.style.transition = 'none';
  em.style.transition = 'none';
  pm.style.width = '0%';
  em.style.width = '0%';
}

function statRoundCounts(result) {
  const won = { spd: 0, agi: 0, int: 0, str: 0 };
  const lost = { spd: 0, agi: 0, int: 0, str: 0 };
  for (const r of result.rounds) {
    if (r.winner === 'player') won[r.stat]++;
    else if (r.winner === 'enemy') lost[r.stat]++;
  }
  return { won, lost };
}

function getBattleVerdict(result) {
  const won = result.winner === 'player';
  const d = result.pWins - result.eWins;
  if (won) {
    if (d >= 3) {
      return {
        brClass: 'br-dom-win',
        title: 'VICTORY 🏆',
        emoji: '🏆',
        tag: 'You crushed it — round after round.',
      };
    }
    if (d === 1) {
      return {
        brClass: 'br-close-win',
        title: 'VICTORY 🏆',
        emoji: '🏆',
        tag: 'That was razor-close — you earned this win.',
      };
    }
    return {
      brClass: 'br-solid-win',
      title: 'VICTORY 🏆',
      emoji: '🏆',
      tag: 'Solid fight — your hybrid delivered.',
    };
  }
  if (d <= -3) {
    return {
      brClass: 'br-dom-loss',
      title: 'DEFEAT 💀',
      emoji: '💀',
      tag: 'They had the edge in most rounds.',
    };
  }
  if (d === -1) {
    return {
      brClass: 'br-close-loss',
      title: 'DEFEAT 💀',
      emoji: '💀',
      tag: 'So close — one more good round could flip it.',
    };
  }
  return {
    brClass: 'br-solid-loss',
    title: 'DEFEAT 💀',
    emoji: '💀',
    tag: 'Rebuild and try a different mix.',
  };
}

function buildBattleSummaryLine(result, won) {
  const { won: wC, lost: lC } = statRoundCounts(result);
  const winStats = Object.entries(wC)
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([k]) => PRE_BATTLE_STAT_WORDS[k]);
  const lossStats = Object.entries(lC)
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([k]) => PRE_BATTLE_STAT_WORDS[k]);
  const margin = Math.abs(result.pWins - result.eWins);
  const pp = getBattleDisplayPlayerHybrid()?.power ?? state.playerHybrid?.power ?? 0;
  const ep = state.enemyHybrid?.power ?? 0;

  if (won) {
    if (winStats.length >= 2) {
      return `Your hybrid won with strong ${winStats[0]} and ${winStats[1]}.`;
    }
    if (winStats.length === 1) {
      return margin <= 1
        ? `A close clash — ${winStats[0]} made the difference.`
        : `Your hybrid’s ${winStats[0]} helped seal the win.`;
    }
    return 'Your hybrid pulled ahead when it mattered.';
  }

  if (lossStats.length >= 2) {
    return `The other team edged ahead on ${lossStats[0]} and ${lossStats[1]}.`;
  }
  if (lossStats.length === 1) {
    return margin <= 1
      ? `A tight fight — they sneaked ahead on ${lossStats[0]}.`
      : `They had the edge in ${lossStats[0]} this time.`;
  }
  if (ep > pp) {
    return 'The opponent had a bit more total power on the board.';
  }
  return 'The rolls did not go your way — try again with a new fusion.';
}

function showBattleResultOverlay(result, opts) {
  const o = opts || {};
  const won = result.winner === 'player';
  const v = getBattleVerdict(result);
  const summary = buildBattleSummaryLine(result, won);
  const overlay = document.getElementById('battle-result-overlay');
  const card = document.getElementById('battle-result-card');
  const emojiEl = document.getElementById('battle-result-emoji');
  const lootEl = document.getElementById('battle-result-loot');
  card.className = `battle-result-card ${v.brClass} br-moment`;
  if (emojiEl) emojiEl.textContent = '';
  document.getElementById('battle-result-title').textContent = v.title;
  document.getElementById('battle-result-score').textContent = `Final score · ${result.pWins} – ${result.eWins}`;
  if (lootEl) {
    lootEl.classList.remove('br-loot-pop');
    const xg = o.xpGained | 0;
    const cg = o.coinsGained | 0;
    const tg = o.tokensGained | 0;
    if (won && (xg || cg || tg)) {
      lootEl.classList.remove('hidden');
      lootEl.innerHTML = `
        <div class="br-loot-title">You earned</div>
        <div class="br-loot-pills">
          ${xg ? `<span class="br-pill br-pill-xp">+${xg} Commander XP</span>` : ''}
          ${cg ? `<span class="br-pill br-pill-coin">+${cg} Fusion Coins</span>` : ''}
          ${tg ? `<span class="br-pill br-pill-token">+${tg} Unlock Token</span>` : ''}
        </div>`;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => lootEl.classList.add('br-loot-pop'));
      });
    } else {
      lootEl.classList.add('hidden');
      lootEl.innerHTML = '';
    }
  }
  const hy = state.playerHybrid;
  const nameLine =
    hy && hy.name
      ? `<div class="brt-hybrid-id"><span class="brt-hybrid-emoji">${hy.emojis}</span> <strong>${escapeHtml(hy.name)}</strong></div>`
      : '';
  let sumHtml = `${nameLine}<span class="brt-tag">${v.tag}</span><span class="brt-detail">${summary}</span>`;
  if (o.rewardFlash) sumHtml += `<div class="brt-reward-flash">${o.rewardFlash}</div>`;
  document.getElementById('battle-result-summary').innerHTML = sumHtml;
  const nextEl = document.getElementById('battle-result-next');
  if (nextEl && state.progress) {
    const hints = [...getProgressionNextLines(state.progress)];
    if (o.dailyHint) hints.push(o.dailyHint);
    const hint = hints.join(' ');
    nextEl.innerHTML = hint
      ? `<div class="brt-next-lbl">What happens next</div><div class="brt-next-txt">${hint}</div>`
      : '';
  } else if (nextEl) nextEl.innerHTML = '';
  overlay.classList.remove('hidden');
}

function hideBattleResultOverlay() {
  document.getElementById('battle-result-overlay').classList.add('hidden');
  const loot = document.getElementById('battle-result-loot');
  if (loot) {
    loot.classList.add('hidden');
    loot.classList.remove('br-loot-pop');
    loot.innerHTML = '';
  }
}

function beginBattle() {
  const b = state.battle;
  if (!b || b.phase !== 'ready') return;
  b.phase = 'fighting';
  document.getElementById('b-actions').innerHTML = '';
  const boosts = mergeStatBoosts(b.quizBoosts || EMPTY_STAT_BOOST(), getStreakBattleBoost(state.progress));
  runBattleCountdown(() => {
    scrollToBattleFocus();
    showBattleRoundStrip();
    const result = runFullBattle(state.playerHybrid, state.enemyHybrid, boosts);
    state.battle.result = result;
    animateBattle(result, 0);
  });
}

function addLog(html, delay, opts) {
  const o = opts || {};
  setTimeout(() => {
    const log = document.getElementById('log-lines');
    if (!log) return;
    const div = document.createElement('div');
    div.className = 'll';
    div.innerHTML = html;
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
    if (o.scrollTrail) scrollToBattleTrail();
    if (o.scrollFocus) scrollToBattleFocus();
  }, delay);
}

function animateBattle(result, roundIdx) {
  if (roundIdx >= result.rounds.length) {
    setTimeout(() => finishBattle(result), 720);
    return;
  }
  const round = result.rounds[roundIdx];
  const roundNum = roundIdx + 1;
  const roundSpan = 4200;
  const baseDelay = roundIdx * roundSpan;
  const statWord = STAT_LABELS_SIMPLE[round.stat];
  const statIcon = STAT_TRAIL_ICONS[round.stat] || '◆';
  const fp = document.getElementById('fighter-player');
  const fe = document.getElementById('fighter-enemy');
  fp?.classList.remove('f-side-win', 'f-side-lose');
  fe?.classList.remove('f-side-win', 'f-side-lose');

  const clearClashRevealUI = () => {
    const inner = document.querySelector('#clash-box .clash-inner');
    inner?.classList.remove('clash-reveal-p', 'clash-reveal-e');
    document.getElementById('clash-pval')?.classList.remove('clash-winner-n');
    document.getElementById('clash-eval')?.classList.remove('clash-winner-n');
    document.getElementById('clash-box')?.classList.remove('clash-clash-moment');
  };

  setTimeout(() => {
    scrollToBattleFocus();
    setBattleRoundStripProgress(roundIdx);
    const box = document.getElementById('clash-box');
    clearClashRevealUI();
    if (box) {
      box.classList.remove('hidden');
      box.classList.add('clash-active', 'clash-peak');
      setTimeout(() => box.classList.remove('clash-peak'), 880);
    }
    setClashStatHighlight(round.stat);
    const tag = document.querySelector('#clash-box .clash-tagline');
    if (tag) tag.textContent = `Category · ${statWord}`;
    const nm = document.getElementById('clash-stat-nm');
    if (nm) {
      nm.textContent = statWord.toUpperCase();
      nm.className = `clash-stat-nm ${round.stat}`;
    }
    const pval = document.getElementById('clash-pval');
    const eval_ = document.getElementById('clash-eval');
    if (pval) pval.textContent = '?';
    if (eval_) eval_.textContent = '?';
    resetClashMeters();
  }, baseDelay + 380);

  setTimeout(() => {
    const pv = document.getElementById('clash-pval');
    if (pv) {
      pv.textContent = round.pTotal;
      pv.classList.add('pop');
      setTimeout(() => pv.classList.remove('pop'), 500);
    }
    setClashMetersPlayerPortion(round.pTotal, round.eTotal);
  }, baseDelay + 1180);

  setTimeout(() => {
    const box = document.getElementById('clash-box');
    if (box) {
      box.classList.add('clash-clash-moment');
      setTimeout(() => box.classList.remove('clash-clash-moment'), 580);
    }
    const ev = document.getElementById('clash-eval');
    if (ev) {
      ev.textContent = round.eTotal;
      ev.classList.add('pop');
      setTimeout(() => ev.classList.remove('pop'), 500);
    }
    setClashMetersEnemyPortion(round.pTotal, round.eTotal);
  }, baseDelay + 1980);

  setTimeout(() => {
    document.getElementById('clash-stat-nm')?.classList.add('clash-suspense');
  }, baseDelay + 2420);

  setTimeout(() => {
    const nm = document.getElementById('clash-stat-nm');
    nm?.classList.remove('clash-suspense');
    const pip = document.getElementById(`rpip-${roundIdx}`);
    let rowCls = 'rt-tie';
    let badgeCls = 'tie';
    let badgeTxt = 'T';
    if (round.winner === 'player') {
      if (pip) pip.className = 'r-pip pw';
      fp?.classList.add('f-side-win', 'flash-win');
      fe?.classList.add('f-side-lose', 'flash-lose');
      setTimeout(() => {
        fp?.classList.remove('flash-win');
        fe?.classList.remove('flash-lose');
        const heartEl = document.getElementById(`be-h-${roundIdx}`);
        if (heartEl) heartEl.classList.add('lost');
      }, 900);
      rowCls = 'rt-win';
      badgeCls = 'win';
      badgeTxt = 'W';
    } else if (round.winner === 'enemy') {
      if (pip) pip.className = 'r-pip ew';
      fe?.classList.add('f-side-win', 'flash-win');
      fp?.classList.add('f-side-lose', 'flash-lose');
      setTimeout(() => {
        fe?.classList.remove('flash-win');
        fp?.classList.remove('flash-lose');
        const heartEl = document.getElementById(`bp-h-${roundIdx}`);
        if (heartEl) heartEl.classList.add('lost');
      }, 900);
      rowCls = 'rt-loss';
      badgeCls = 'loss';
      badgeTxt = 'L';
    } else {
      if (pip) pip.className = 'r-pip tie';
    }

    const inner = document.querySelector('#clash-box .clash-inner');
    if (round.winner === 'player') {
      inner?.classList.add('clash-reveal-p');
      document.getElementById('clash-pval')?.classList.add('clash-winner-n');
    } else if (round.winner === 'enemy') {
      inner?.classList.add('clash-reveal-e');
      document.getElementById('clash-eval')?.classList.add('clash-winner-n');
    }
    if (round.winner === 'player') setClashMeterWinHighlight('player');
    else if (round.winner === 'enemy') setClashMeterWinHighlight('enemy');
    else clearClashMeterWinHighlight();

    const pPillar = document.querySelector(`#bp-stats .battle-stat-pillar[data-stat="${round.stat}"]`);
    const ePillar = document.querySelector(`#be-stats .battle-stat-pillar[data-stat="${round.stat}"]`);
    if (round.winner === 'player') {
      pPillar?.classList.add('sp-clash-win');
      ePillar?.classList.add('sp-clash-lose');
    } else if (round.winner === 'enemy') {
      ePillar?.classList.add('sp-clash-win');
      pPillar?.classList.add('sp-clash-lose');
    }

    addLog(
      `<div class="round-trail-row ${rowCls}"><span class="rt-icon">${statIcon}</span><span class="rt-cat">${statWord}</span><span class="rt-badge ${badgeCls}">${badgeTxt}</span></div>`,
      0,
      { scrollFocus: true }
    );
    document.getElementById('r-counter').textContent = `${roundNum} / 5`;
  }, baseDelay + 3040);

  setTimeout(() => {
    const box = document.getElementById('clash-box');
    box.classList.add('hidden');
    box.classList.remove('clash-active');
    clearClashStatHighlight();
    resetClashMeters();
    fp.classList.remove('f-side-win', 'f-side-lose');
    fe.classList.remove('f-side-win', 'f-side-lose');
    animateBattle(result, roundIdx + 1);
  }, baseDelay + 3980);
}


function updateStreakOnLevelComplete(p) {
  touchDailyStreakIfNeeded(p);
}

function scrollDefeatIntoView() {
  const root = document.getElementById('screen-defeat');
  const box = root?.querySelector('.def-box');
  console.log('[flow] defeat scroll triggered', { hasScreen: !!root, hasBox: !!box });
  if (!root || !box) return;
  root.scrollTop = 0;
  box.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
}

async function finishBattle(result) {
  const flowGen = state.battleFlowGen;
  const won = result.winner === 'player';
  try {
  const box = document.getElementById('clash-box');
  if (box) { box.classList.add('hidden'); box.classList.remove('clash-active'); }
  clearClashStatHighlight();
  resetClashMeters();
  document.getElementById('fighter-player')?.classList.remove('f-side-win', 'f-side-lose');
  document.getElementById('fighter-enemy')?.classList.remove('f-side-win', 'f-side-lose');
  console.log('[battle] resolved', { won, score: `${result.pWins}-${result.eWins}`, flowGen });
  const p = state.progress;
  ensureDailyChallengeRolled(p);
  if (won) touchDailyStreakIfNeeded(p);

  let rewardFlash = '';
  let dailyHint = '';
  let xpGained = 0;
  let coinsGained = 0;
  let tokensGained = 0;
  if (won) {
    xpGained = XP_PER_BATTLE_WIN;
    p.commanderXp = (p.commanderXp || 0) + xpGained;
    p.totalWins++;
    p.dailyWinsToday = (p.dailyWinsToday || 0) + 1;
    coinsGained = 5;
    p.coins = (p.coins || 0) + 5;
    const ch = pickDailyChallenge(localDateString());
    if (!p.dailyChallengeRewardClaimed && dailyChallengeMet(ch, p, state.playerHybrid, true)) {
      p.dailyChallengeRewardClaimed = true;
      p.coins += 8;
      p.unlockTokens = (p.unlockTokens || 0) + 1;
      coinsGained += 8;
      tokensGained += 1;
      rewardFlash =
        '🎯 Daily challenge complete! +8 Fusion Coins · +1 <strong>Unlock token</strong> (save for future rewards).';
    } else if (!p.dailyChallengeRewardClaimed && ch.id === 'double' && (p.dailyWinsToday || 0) < 2) {
      dailyHint = `<strong>Daily:</strong> Win <strong>one more mission today</strong> to finish “${ch.title}”.`;
    } else if (!p.dailyChallengeRewardClaimed) {
      dailyHint = `<strong>Daily:</strong> “${ch.title}” — ${ch.desc}.`;
    }
  } else {
    p.totalLosses++;
    const ch = pickDailyChallenge(localDateString());
    if (!p.dailyChallengeRewardClaimed) {
      dailyHint = `<strong>Daily:</strong> “${ch.title}” — ${ch.desc}. You’ve got this!`;
    }
  }

  finalizeBattleRoundStrip();
  const finCls = won ? 'win' : 'loss';
  const finTxt = won ? `Victory ${result.pWins}–${result.eWins}` : `Defeat ${result.pWins}–${result.eWins}`;
  addLog(`<div class="round-trail-final ${finCls}">${finTxt}</div>`, 0, { scrollTrail: true });
  requestAnimationFrame(() => scrollToBattleTrail());

  try {
    await saveUserProgress(p);
    if (flowGen !== state.battleFlowGen) return;
    console.log('[battle] save complete (post-battle outcome)');
  } catch (e) {
    console.warn('[battle] save failed after outcome', e);
  }
  if (flowGen !== state.battleFlowGen) {
    console.log('[battle] stale flow after save — skip overlay / transition');
    return;
  }

  setTimeout(() => {
    if (flowGen !== state.battleFlowGen) return;
    showBattleResultOverlay(result, { rewardFlash, dailyHint, xpGained, coinsGained, tokensGained });
    console.log('[battle] result overlay shown', { won });
  }, 520);

  if (won) {
    setTimeout(() => {
      if (flowGen !== state.battleFlowGen) return;
      hideBattleResultOverlay();
      state.battle = null;
      console.log('[battle] return to victory / level-complete flow');
      showLevelComplete().catch(e => console.error('[battle] showLevelComplete failed', e));
    }, 3800);
  } else {
    setTimeout(() => {
      if (flowGen !== state.battleFlowGen) return;
      clearDefeatAutoReturn();
      hideBattleResultOverlay();
      state.battle = null;
      document.getElementById('def-sub').textContent =
        `You lost ${result.pWins}–${result.eWins}. Rebuild in the Forge and jump back in.`;
      const defHint = document.getElementById('def-auto-hint');
      if (defHint) {
        defHint.textContent =
          'You will return to your Hub automatically in a few seconds — or tap a button when you are ready.';
      }
      console.log('[battle] defeat resolved — defeat screen next');
      showScreen('defeat');
      console.log('[flow] defeat screen shown');
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scrollDefeatIntoView();
        });
      });
      setDefeatReturnToHubTimer(setTimeout(() => {
        setDefeatReturnToHubTimer(null);
        const d = document.getElementById('screen-defeat');
        if (d && d.classList.contains('active')) {
          console.log('[flow] defeat return to hub');
          window.showHub();
        }
      }, 9000));
    }, 3800);
  }
  } catch (fatalErr) {
    console.error('[battle] finishBattle crashed — forcing transition', fatalErr);
    hideBattleResultOverlay();
    state.battle = null;
    if (won) {
      showLevelComplete().catch(e => {
        console.error('[battle] fallback showLevelComplete also failed', e);
        showScreen('hub');
      });
    } else {
      showScreen('defeat');
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
// LEVEL COMPLETE
// ═══════════════════════════════════════════════════════════════════

async function showLevelComplete() {
  const p = state.progress;
  const currentLevel = p.level;
  const isApexUnlock = currentLevel === 5;
  const isDinoUnlock = currentLevel === 8;
  const isLegendaryUnlock = currentLevel === 12;
  const isMythicalUnlock = currentLevel === 16;
  const isFinalLevel = currentLevel === LEVELS.length;
  const isBossLevel = LEVELS[currentLevel - 1]?.isBoss;
  const reward = LEVEL_REWARDS[currentLevel];

  updateStreakOnLevelComplete(p);

  p.highestLevelReached = Math.max(p.highestLevelReached || 0, currentLevel);

  if (currentLevel <= LEVELS.length) {
    p.level++;
    if (reward && ANIMALS[reward] && !p.unlockedAnimals.includes(reward)) p.unlockedAnimals.push(reward);
  }
  try {
    await saveUserProgress(p);
    console.log('[battle] save complete (level advanced)');
  } catch (e) {
    console.warn('[battle] save failed after level advance', e);
  }

  document.getElementById('lc-sub').textContent = `LEVEL ${currentLevel} CLEARED`;
  document.getElementById('lc-icon').textContent = isFinalLevel ? '👑' : isBossLevel ? '⚔️' : '🏆';

  // Animal unlock box
  const ub = document.getElementById('unlock-box');
  if (reward && ANIMALS[reward]) {
    const a = ANIMALS[reward];
    ub.innerHTML = `
      <div class="unlock-lbl">🔓 New Animal Unlocked!</div>
      <div class="unlock-animal">
        <span class="unlock-em">${a.emoji}</span>
        <div class="unlock-info">
          <h3>${a.name}</h3>
          <p>${a.bio}</p>
          ${buildMiniStats(a)}
        </div>
      </div>`;
    ub.style.display = 'block';
  } else {
    ub.style.display = 'none';
  }

  // Apex unlock notification
  const ab = document.getElementById('apex-box');
  if (isApexUnlock) {
    ab.classList.remove('hidden');
    ab.innerHTML = `
      <div class="apex-bonus-title">◈ Apex Predators Now Available!</div>
      <p style="font-size:.82rem;color:var(--text-dim);margin-bottom:10px">You've earned the right to challenge apex predators.<br>Each unlock uses 3 random questions from a larger fact deck.</p>
      <div class="apex-chips">
        ${APEX_IDS.map(id => {
          const a = ANIMALS[id];
          return `<div class="apex-chip"><span>${a.emoji}</span><span>${a.name}</span></div>`;
        }).join('')}
      </div>
      <p style="font-size:.7rem;color:var(--text-dim);margin-top:10px;font-family:var(--fm)">Find them in the Forge → Apex Predators section.</p>`;
  } else {
    ab.classList.add('hidden');
  }

  // Dino unlock notification
  const db = document.getElementById('dino-box');
  if (isDinoUnlock) {
    db.classList.remove('hidden');
    db.innerHTML = `
      <div class="dino-bonus-title">🦖 Dinosaur Tier Now Available!</div>
      <p style="font-size:.82rem;color:var(--text-dim);margin-bottom:10px">Dinosaurs have stats far beyond anything you've faced.<br>Each unlock uses 3 random questions from a bigger dinosaur deck.</p>
      <div class="apex-chips" style="gap:14px">
        ${DINO_IDS.map(id => {
          const a = ANIMALS[id];
          return `<div class="apex-chip"><span>${a.emoji}</span><span style="color:var(--dino)">${a.name}</span></div>`;
        }).join('')}
      </div>
      <p style="font-size:.7rem;color:var(--text-dim);margin-top:10px;font-family:var(--fm)">Find them in the Forge → Dinosaur Tier section.</p>`;
  } else {
    db.classList.add('hidden');
  }

  // Legendary unlock notification
  const lb = document.getElementById('legendary-box');
  if (lb) {
    if (isLegendaryUnlock) {
      lb.classList.remove('hidden');
      lb.innerHTML = `
        <div class="legendary-bonus-title">🐲 Legendary Beasts Now Available!</div>
        <p style="font-size:.82rem;color:var(--text-dim);margin-bottom:10px"><em>Ancient creatures of myth, forged in fire, magic, and legend.</em><br>Each unlock uses 3 random questions from a mythological fact deck.</p>
        <div class="apex-chips" style="gap:14px">
          ${LEGENDARY_IDS.map(id => {
            const a = ANIMALS[id];
            return `<div class="apex-chip"><span>${a.emoji}</span><span style="color:var(--legendary)">${a.name}</span></div>`;
          }).join('')}
        </div>
        <p style="font-size:.7rem;color:var(--text-dim);margin-top:10px;font-family:var(--fm)">Find them in the Forge → Legendary Beasts section.</p>`;
    } else {
      lb.classList.add('hidden');
    }
  }

  // Mythical unlock notification
  const mb = document.getElementById('mythical-box');
  if (mb) {
    if (isMythicalUnlock) {
      mb.classList.remove('hidden');
      mb.innerHTML = `
        <div class="mythical-bonus-title">⚡ Mythical Gods Now Available!</div>
        <p style="font-size:.82rem;color:var(--text-dim);margin-bottom:10px"><em>Beyond beasts — these are rulers of realms, masters of power itself.</em><br>Each unlock uses 3 random questions from a divine knowledge deck.</p>
        <div class="apex-chips" style="gap:14px">
          ${MYTHICAL_IDS.map(id => {
            const a = ANIMALS[id];
            return `<div class="apex-chip"><span>${a.emoji}</span><span style="color:var(--mythical)">${a.name}</span></div>`;
          }).join('')}
        </div>
        <p style="font-size:.7rem;color:var(--text-dim);margin-top:10px;font-family:var(--fm)">Find them in the Forge → Mythical Gods section.</p>`;
    } else {
      mb.classList.add('hidden');
    }
  }

  // Actions
  const acts = document.getElementById('lc-actions');
  if (isFinalLevel) {
    acts.innerHTML = `<button class="btn btn-orange btn-lg" onclick="showGameComplete()">👑 Claim Victory</button>`;
  } else {
    acts.innerHTML = `<p class="lc-next-hint" style="width:100%;font-family:var(--fm);font-size:.68rem;color:var(--text-dim);margin-bottom:10px;line-height:1.45">Your progress is saved. Forge when you are ready, or head to the Hub for the big picture.</p>
      <button class="btn btn-primary btn-lg" onclick="goNextLevel()">⚗ Forge next hybrid</button>
      <button class="btn btn-secondary btn-sm" type="button" onclick="showHub()">Hub — missions &amp; roster</button>`;
  }

  const autoHint = document.getElementById('lc-auto-hint');
  if (isFinalLevel) {
    if (autoHint) autoHint.textContent = '';
    clearLevelCompleteAutoNav();
  } else {
    if (autoHint) {
      autoHint.textContent =
        'You will return to the Hub automatically in a few seconds — or tap a button when you are ready.';
    }
    clearLevelCompleteAutoNav();
    setLevelCompleteAutoNavTimer(setTimeout(() => {
      setLevelCompleteAutoNavTimer(null);
      const lc = document.getElementById('screen-level-complete');
      if (lc && lc.classList.contains('active')) window.showHub();
    }, 9000));
  }

  showScreen('level-complete');
  console.log('[flow] level complete screen shown');
}

function buildMiniStats(a) {
  const bars = [['spd','sf-spd','SPD'],['agi','sf-agi','AGI'],['int','sf-int','INT'],['str','sf-str','STR']];
  return `<div style="margin-top:8px">${bars.map(([s,cls,lbl]) =>
    `<div class="stat-row"><div class="stat-lbl">${lbl}</div>
    <div class="stat-track"><div class="stat-fill ${cls}" style="width:${Math.min((a[s]/STAT_MAX)*100,100)}%"></div></div>
    <div class="stat-val">${a[s]}</div></div>`).join('')}</div>`;
}

function goNextLevel() {
  clearLevelCompleteAutoNav();
  clearDefeatAutoReturn();
  hideBattleResultOverlay();
  state.battle = null;
  state.playerHybrid = null;
  state.selectedAnimals = [];
  persistGameProgress().catch(e => console.error('[battle] goNextLevel save failed', e));
  showScreen('builder');
}
function retryLevel() {
  clearLevelCompleteAutoNav();
  clearDefeatAutoReturn();
  hideBattleResultOverlay();
  state.battle = null;
  state.playerHybrid = null;
  state.selectedAnimals = [];
  persistGameProgress().catch(e => console.error('[battle] retryLevel save failed', e));
  showScreen('builder');
}

// ═══════════════════════════════════════════════════════════════════
// GAME COMPLETE
// ═══════════════════════════════════════════════════════════════════

function showGameComplete() {
  clearLevelCompleteAutoNav();
  clearDefeatAutoReturn();
  const p = state.progress;
  p.level = 11;
  saveUserProgress(p).catch(e => console.error('[battle] gameComplete save failed', e));
  const totalPlayable = BASE_IDS.length + APEX_IDS.length + DINO_IDS.length;
  const unlockedPlayable = countBaseUnlocked(p) + countApexUnlocked(p) + countDinoUnlocked(p);
  const quizCount = p.quizUnlocked.length;
  const sb = document.getElementById('gc-stats-box');
  const brain = computeQuizAccuracy(p);
  const brainTxt =
    brain != null ? `${brain}% fun-fact power` : 'Keep playing quizzes to grow your brain score!';
  sb.innerHTML = `<h3>Final Record</h3>
    <div class="gc-stat-row"><span>Total Victories</span><strong>${p.totalWins}</strong></div>
    <div class="gc-stat-row"><span>Total Defeats</span><strong>${p.totalLosses}</strong></div>
    <div class="gc-stat-row"><span>Win Rate</span><strong>${p.totalWins+p.totalLosses>0?Math.round(p.totalWins/(p.totalWins+p.totalLosses)*100):0}%</strong></div>
    <div class="gc-stat-row"><span>Animals Unlocked</span><strong>${unlockedPlayable} / ${totalPlayable}</strong></div>
    <div class="gc-stat-row"><span>Quiz Challenges Passed</span><strong>${quizCount}</strong></div>
    <div class="gc-stat-row"><span>Brain score (quizzes)</span><strong>${brainTxt}</strong></div>`;
  showScreen('game-complete');
}

function newGame() {
  clearLevelCompleteAutoNav();
  clearDefeatAutoReturn();
  const fresh = defaultProgress();
  state.progress = fresh;
  saveUserProgress(fresh).catch(e => console.error('[battle] newGame save failed', e));
  state.playerHybrid = null;
  state.selectedAnimals = [];
  showScreen('hub');
}

export {
  startBattle,
  renderPreBattleQuizUI,
  answerPreBattleQuestion,
  advancePreBattleQuiz,
  renderBattleBoostSummaryUI,
  confirmPreBattleAndStartFight,
  renderBattleScreen,
  renderFighterStats,
  resetHearts,
  resetRoundPips,
  resetBattleRoundStrip,
  showBattleRoundStrip,
  setBattleRoundStripProgress,
  finalizeBattleRoundStrip,
  runBattleCountdown,
  clearClashStatHighlight,
  setClashStatHighlight,
  setClashMetersPlayerPortion,
  setClashMetersEnemyPortion,
  clearClashMeterWinHighlight,
  setClashMeterWinHighlight,
  resetClashMeters,
  statRoundCounts,
  getBattleVerdict,
  buildBattleSummaryLine,
  showBattleResultOverlay,
  hideBattleResultOverlay,
  beginBattle,
  addLog,
  animateBattle,
  updateStreakOnLevelComplete,
  scrollDefeatIntoView,
  finishBattle,
  showLevelComplete,
  buildMiniStats,
  goNextLevel,
  retryLevel,
  showGameComplete,
  newGame,
};