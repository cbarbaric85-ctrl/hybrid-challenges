import {
  STAT_MAX, STAGE_BASE, STAGE_APEX, STAGE_DINO,
  ANIMALS, ALL_ANIMALS, APEX_IDS, DINO_IDS,
} from '../data/animals.js';
import { LEVELS } from '../data/levels.js';
import { QUIZZES } from '../data/quizzes.js';
import { state, quizState, resetQuizState, UNLOCK_QUIZ_SESSION_LEN, clearDefeatAutoReturn, clearLevelCompleteAutoNav } from '../game/state.js';
import {
  getAvailableAnimals, isQuizEligible, unlockGateLinesForAnimal,
  quizUiTierType, canAccessStage,
} from '../game/progression.js';
import {
  hybridName, powerScore, hybridTierClass,
  buildPlayerHybrid, buildEnemyHybrid,
} from '../game/hybrid.js';
import {
  STAT_LABELS, pickUnlockSessionQuestions, shuffleQuestionOpts,
} from '../game/battle.js';
import { sanitizeHybridName, recordQuizAnswers, saveUserProgress, persistGameProgress } from '../persistence/save.js';
import { showScreen } from './screens.js';

function showBuilder() {
  clearDefeatAutoReturn();
  state.selectedAnimals = state.playerHybrid ? [...state.playerHybrid.animals] : [];
  showScreen('builder');
}
function showHub() {
  clearLevelCompleteAutoNav();
  clearDefeatAutoReturn();
  console.log('[flow] hub shown');
  showScreen('hub');
}

function renderBuilder() {
  updateForgeMobileStepClass();
  console.log('[forge] renderBuilder — step class pre-applied', {
    selected: state.selectedAnimals.length,
    hasHybrid: !!state.playerHybrid,
    isMobile: isForgeMobileLayout(),
  });
  const p = state.progress;
  const available = getAvailableAnimals(p);
  const container = document.getElementById('builder-tiers');
  container.innerHTML = '';

  // ── SECTION 1: BASE ROSTER (tier 1 + 2) ──
  const baseIds = available.filter(id => ANIMALS[id].stage === STAGE_BASE);
  if (baseIds.length) {
    const sec = document.createElement('div');
    sec.className = 'tier-section';
    sec.innerHTML = `<div class="tier-hdr"><span class="tier-hdr-nm base">◇ Base Animals</span><div class="tier-hdr-line" style="background:var(--border)"></div></div>`;
    const grid = document.createElement('div');
    grid.className = 'b-animal-grid';
    baseIds.forEach(id => grid.appendChild(makeAnimalCard(id)));
    sec.appendChild(grid);
    container.appendChild(sec);
  }

  // ── SECTION 2: APEX PREDATORS (tier 3) ──
  {
    const sec = document.createElement('div');
    sec.className = 'tier-section';
    sec.innerHTML = `<div class="tier-hdr"><span class="tier-hdr-nm apex">◈ Apex Predators</span><div class="tier-hdr-line" style="background:rgba(176,106,255,.3)"></div></div>`;

    if (p.level < 6) {
      sec.innerHTML += `<div class="tier-locked-notice"><strong>Apex Predators</strong><br>
        <span class="unlock-gate-row"><span class="unlock-gate-no">○</span> Beat Level 5 (you are on level ${p.level})</span><br>
        <span class="unlock-gate-row"><span class="unlock-gate-no">○</span> Pass each Apex quiz in the Forge</span></div>`;
    } else {
      const grid = document.createElement('div');
      grid.className = 'b-animal-grid';
      APEX_IDS.forEach(id => {
        if (available.includes(id)) {
          grid.appendChild(makeAnimalCard(id));
        } else {
          grid.appendChild(makeQuizLockCard(id, 'apex'));
        }
      });
      sec.appendChild(grid);
    }
    container.appendChild(sec);
  }

  // ── SECTION 3: DINOSAUR TIER (tier 4) ──
  {
    const sec = document.createElement('div');
    sec.className = 'tier-section';
    sec.innerHTML = `<div class="tier-hdr"><span class="tier-hdr-nm dino">🦖 Dinosaur Tier</span><div class="tier-hdr-line" style="background:rgba(255,68,0,.3)"></div></div>`;

    if (p.level < 9) {
      const rem = 9 - p.level;
      sec.innerHTML += `<div class="tier-locked-notice"><strong>Dinosaurs</strong><br>
        <span class="unlock-gate-row"><span class="unlock-gate-no">○</span> Beat Level 8 (${rem} level${rem > 1 ? 's' : ''} to go)</span><br>
        <span class="unlock-gate-row"><span class="unlock-gate-no">○</span> Pass each Dino quiz in the Forge</span></div>`;
    } else {
      const grid = document.createElement('div');
      grid.className = 'b-animal-grid';
      DINO_IDS.forEach(id => {
        if (available.includes(id)) {
          grid.appendChild(makeAnimalCard(id));
        } else {
          grid.appendChild(makeQuizLockCard(id, 'dino'));
        }
      });
      sec.appendChild(grid);
    }
    container.appendChild(sec);
  }

  updateSelectionUI();
  renderEnemyPreviewInBuilder();
  if (state.playerHybrid) renderHybridPreview(state.playerHybrid);
  else clearHybridPreview();
  updateForgeNextHint();
}

function makeAnimalCard(id) {
  const a = ANIMALS[id];
  const card = document.createElement('div');
  const isTier3 = a.stage === STAGE_APEX;
  const isTier4 = a.stage === STAGE_DINO;
  const isSelected = state.selectedAnimals.includes(id);
  card.id = `bac-${id}`;
  card.className = `bac${isTier4?' dino-card':isTier3?' apex-card':''}${isSelected?' sel':''}`;
  card.onclick = () => toggleAnimalSelect(id);
  const tierLbl = isTier4 ? '◈◈ DINOSAUR' : isTier3 ? '◈ APEX' : 'BASE';
  const tierCls = isTier4 ? 't4' : isTier3 ? 't3' : '';
  card.innerHTML = `<div class="bac-em">${a.emoji}</div>
    <div class="bac-nm">${a.name}</div>
    <div class="bac-tier-tag ${tierCls}">${tierLbl}</div>
    <div class="bac-stats-mini">
      <div class="bac-s">SPD <em>${a.spd}</em></div>
      <div class="bac-s">AGI <em>${a.agi}</em></div>
      <div class="bac-s">INT <em>${a.int}</em></div>
      <div class="bac-s">STR <em>${a.str}</em></div>
    </div>`;
  return card;
}

function makeQuizLockCard(id, tierType) {
  const a = ANIMALS[id];
  const card = document.createElement('div');
  card.className = `bac-quizlock ${tierType}-quizlock premium-lock-preview`;
  const p = state.progress;
  const eligible = isQuizEligible(id, p);
  const gates = unlockGateLinesForAnimal(id, p) || [];
  const gateHtml = gates
    .map(
      g =>
        `<div class="unlock-gate-row" style="font-size:.52rem"><span class="${g.ok ? 'unlock-gate-ok' : 'unlock-gate-no'}">${g.ok ? '✓' : '○'}</span> ${g.text}</div>`
    )
    .join('');
  card.innerHTML = `<div class="bql-em">${a.emoji}</div>
    <div class="bql-nm">${a.name}</div>
    <div class="bql-lbl ${tierType}">🔒 ${eligible ? 'Quiz next' : 'Level first'}</div>
    <div class="bql-stats-preview bac-stats-mini" aria-hidden="true">
      <div class="bac-s">SPD <em>${a.spd}</em></div>
      <div class="bac-s">AGI <em>${a.agi}</em></div>
      <div class="bac-s">INT <em>${a.int}</em></div>
      <div class="bac-s">STR <em>${a.str}</em></div>
    </div>
    ${gateHtml ? `<div class="unlock-gate-list" style="margin-top:4px">${gateHtml}</div>` : ''}`;
  if (eligible) {
    const btn = document.createElement('button');
    btn.className = `btn btn-sm bac-quiz-btn ${tierType === 'dino' ? 'btn-dino' : 'btn-purple'}`;
    btn.textContent = '📝 quiz';
    btn.style.width = '100%';
    btn.style.marginTop = '3px';
    btn.onclick = () => {
      state.quizReturnScreen = 'builder';
      openQuiz(id);
    };
    card.appendChild(btn);
  }
  return card;
}

function isForgeMobileLayout() {
  return typeof window.matchMedia === 'function' && window.matchMedia('(max-width:720px)').matches;
}

function updateForgeMobileStepClass() {
  const layout = document.querySelector('#screen-builder .builder-layout');
  if (!layout) return;
  const n = state.selectedAnimals.length;
  const forged = !!state.playerHybrid;
  const step2 = forged || n >= 3;
  const was2 = layout.classList.contains('forge-mobile-step-2');
  layout.classList.toggle('forge-mobile-step-2', step2);
  layout.classList.toggle('forge-mobile-step-1', !step2);
  if (was2 !== step2) {
    console.log('[forge] mobile step transition', { from: was2 ? 'step-2' : 'step-1', to: step2 ? 'step-2' : 'step-1', n, forged });
  }
}

function updateForgeMobilePhaseLabel() {
  const el = document.getElementById('forge-mobile-phase');
  if (!el) return;
  const n = state.selectedAnimals.length;
  const forged = !!state.playerHybrid;
  if (forged) el.textContent = 'Step 3 · Enter battle when ready';
  else if (n >= 3) el.textContent = 'Step 2 · Review below — tap Fuse to forge';
  else el.textContent = 'Step 1 · Tap up to 3 animals in the grid';
}

function scrollForgeColumnToFusionPanel() {
  const forgeCol = document.getElementById('builder-forge-column');
  const panel = document.getElementById('forge-panel');
  const anchor = document.getElementById('forge-fusion-anchor');
  const layout = document.querySelector('#screen-builder .builder-layout');
  if (!forgeCol || !panel) {
    console.warn('[forge] scroll target missing', { forgeCol: !!forgeCol, panel: !!panel });
    return;
  }
  const pad = 16;
  if (isForgeMobileLayout() && layout && layout.classList.contains('forge-mobile-step-2')) {
    const targetEl = anchor || panel;
    const top = targetEl.getBoundingClientRect().top - layout.getBoundingClientRect().top + layout.scrollTop - 8;
    console.log('[forge] fusion section ready — mobile layout scroll', { top, layoutScrollH: layout.scrollHeight });
    layout.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    return;
  }
  const relTop = panel.getBoundingClientRect().top - forgeCol.getBoundingClientRect().top + forgeCol.scrollTop;
  const target = Math.max(0, relTop - pad);
  console.log('[forge] fusion section ready — column scroll', { target, colScrollH: forgeCol.scrollHeight });
  forgeCol.scrollTo({ top: target, behavior: 'smooth' });
}

function scrollToForgeAndHighlight() {
  const forgeCol = document.getElementById('builder-forge-column');
  const panel = document.getElementById('forge-panel');
  const msg = document.getElementById('forge-ready-msg');
  console.log('[forge] 3 animals selected — scheduling fusion scroll');

  updateForgeMobileStepClass();

  const runScroll = (label) => {
    console.log('[forge] forge scroll triggered', { pass: label });
    scrollForgeColumnToFusionPanel();
  };
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      setTimeout(() => runScroll('early'), 80);
      setTimeout(() => runScroll('settle'), 350);
      setTimeout(() => runScroll('final'), 600);
    });
  });

  if (!isForgeMobileLayout() && forgeCol) {
    forgeCol.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }
  if (panel) {
    panel.classList.remove('forge-highlight');
    void panel.offsetWidth;
    panel.classList.add('forge-highlight');
    setTimeout(() => panel.classList.remove('forge-highlight'), 2600);
  }
  if (msg) {
    msg.textContent = 'Team ready — forge your hybrid';
    setTimeout(() => {
      if (msg.textContent === 'Team ready — forge your hybrid') msg.textContent = '';
    }, 4500);
  }
}

function toggleAnimalSelect(id) {
  const idx = state.selectedAnimals.indexOf(id);
  if (idx >= 0) {
    state.selectedAnimals.splice(idx, 1);
  } else {
    if (state.selectedAnimals.length >= 3) return;
    state.selectedAnimals.push(id);
  }
  const card = document.getElementById(`bac-${id}`);
  if (card) card.classList.toggle('sel', state.selectedAnimals.includes(id));
  state.playerHybrid = null;
  updateSelectionUI();
  clearHybridPreview();
  persistGameProgress().catch(e => console.error('[forge] toggle save failed', e));
  console.log('[forge] animal selected', { id, selectedCount: state.selectedAnimals.length, isMobile: isForgeMobileLayout() });
  if (state.selectedAnimals.length === 3) {
    console.log('[forge] 3 animals selected — transitioning to fusion');
    scrollToForgeAndHighlight();
  } else if (state.selectedAnimals.length < 3) {
    console.log('[forge] selection count below 3 — ensuring step-1');
  }
}

function updateForgeNextHint() {
  const el = document.getElementById('forge-next-hint');
  if (el) {
    const n = state.selectedAnimals.length;
    const forged = !!state.playerHybrid;
    if (!forged) {
      if (n === 0) el.textContent = 'Next: choose 1–3 animals from the grid.';
      else if (n < 3) el.textContent = `Next: add up to ${3 - n} more, or tap Fuse with your current picks.`;
      else el.textContent = 'Next: tap Fuse to roll your hybrid’s stats.';
    } else {
      el.textContent = 'Next: Enter Battle — boost quiz, then the fight!';
    }
  }
  updateForgeMobilePhaseLabel();
}

function updateSelectionUI() {
  const n = state.selectedAnimals.length;
  ['sp1','sp2','sp3'].forEach((id, i) => document.getElementById(id).classList.toggle('on', i < n));
  document.getElementById('sel-count-txt').textContent = `${n} / 3 selected`;
  document.getElementById('btn-forge').disabled = n === 0;
  document.getElementById('btn-reroll').disabled = n === 0 || !state.playerHybrid;
  document.getElementById('btn-fight').disabled = !state.playerHybrid;
  updateForgeNextHint();
  updateForgeMobileStepClass();
}

function forgeHybrid() {
  if (!state.selectedAnimals.length) return;
  state.playerHybrid = buildPlayerHybrid(state.selectedAnimals);
  renderHybridPreview(state.playerHybrid);
  syncHybridNameInput();
  document.getElementById('btn-reroll').disabled = false;
  document.getElementById('btn-fight').disabled = false;
  updateForgeNextHint();
  persistGameProgress().catch(e => console.error('[forge] forgeHybrid save failed', e));
}

function syncHybridNameInput() {
  const panel = document.getElementById('hybrid-name-panel');
  const inp = document.getElementById('hybrid-name-input');
  if (!panel || !inp) return;
  if (state.playerHybrid) {
    panel.classList.remove('hidden');
    inp.value = state.playerHybrid.name;
  } else {
    panel.classList.add('hidden');
    inp.value = '';
  }
}

function applyHybridDisplayName() {
  if (!state.playerHybrid) return;
  const inp = document.getElementById('hybrid-name-input');
  const raw = inp ? inp.value : '';
  const auto = hybridName(state.playerHybrid.animals);
  state.playerHybrid.name = sanitizeHybridName(raw, auto);
  if (inp) inp.value = state.playerHybrid.name;
  renderHybridPreview(state.playerHybrid);
  persistGameProgress().catch(e => console.error('[forge] rename save failed', e));
}

function renderHybridPreview(h) {
  document.getElementById('h-emojis').textContent = h.emojis;
  const nameCls = h.tierClass === 'dino' ? 'h-name dino-glow' : h.tierClass === 'apex' ? 'h-name apex-glow' : 'h-name glow';
  document.getElementById('h-name').className = nameCls;
  document.getElementById('h-name').textContent = h.name;
  document.getElementById('h-sub').textContent = h.composition.toUpperCase();
  const hcardCls = h.tierClass === 'dino' ? 'hcard dino-ready' : h.tierClass === 'apex' ? 'hcard apex-ready' : 'hcard ready';
  document.getElementById('hcard').className = hcardCls;
  // Power score
  document.getElementById('h-power').classList.remove('hidden');
  document.getElementById('h-power-num').textContent = h.power;
  // Stats
  for (const stat of ['spd','agi','int','str']) {
    document.getElementById(`hs-${stat}`).style.width = `${Math.min((h.stats[stat]/STAT_MAX)*100,100)}%`;
    document.getElementById(`hv-${stat}`).textContent = h.stats[stat];
  }
  syncHybridNameInput();
}

function clearHybridPreview() {
  document.getElementById('h-emojis').textContent = '—';
  document.getElementById('h-name').className = 'h-name';
  document.getElementById('h-name').textContent = 'No Animals Selected';
  document.getElementById('h-sub').textContent = 'SELECT 1–3 ANIMALS TO FUSE';
  document.getElementById('hcard').className = 'hcard';
  document.getElementById('h-power').classList.add('hidden');
  for (const stat of ['spd','agi','int','str']) {
    document.getElementById(`hs-${stat}`).style.width = '0%';
    document.getElementById(`hv-${stat}`).textContent = '—';
  }
  syncHybridNameInput();
}

function renderEnemyPreviewInBuilder() {
  const p = state.progress;
  const level = LEVELS[Math.min(p.level - 1, LEVELS.length - 1)];
  const comps = level.animals.map(id => ALL_ANIMALS[id]).filter(Boolean);
  const enemyHybrid = buildEnemyHybrid(level);
  const el = document.getElementById('builder-enemy-preview');
  el.innerHTML = `<div style="font-size:1.5rem;margin-bottom:5px">${comps.map(a=>a.emoji).join('')}</div>
    <div style="font-family:var(--fd);font-size:.85rem;font-weight:700;color:var(--red);margin-bottom:2px">${level.name.toUpperCase()}</div>
    <div style="font-family:var(--fm);font-size:.6rem;color:var(--text-dim);margin-bottom:5px">${comps.map(a=>a.name).join(' + ')}</div>
    <div style="font-family:var(--fm);font-size:.65rem;color:var(--orange)">Enemy Power: ${enemyHybrid.power}</div>
    ${level.isHard?'<div style="margin-top:4px;font-family:var(--fm);font-size:.58rem;color:var(--red)">⚠ HARD — Use apex animals!</div>':''}`;
}

// ═══════════════════════════════════════════════════════════════════
// QUIZ SYSTEM
// ═══════════════════════════════════════════════════════════════════

function openQuiz(animalId) {
  const a = ANIMALS[animalId];
  const quiz = QUIZZES[animalId];
  if (!quiz) {
    alert(`Quiz not found for ${a.name}. Please try again later.`);
    return;
  }

  resetQuizState({ animalId });
  const tierType = quizUiTierType(animalId);

  // Topbar badge
  document.getElementById('quiz-tier-badge').innerHTML =
    `<div class="tier-badge-topbar ${tierType}">${tierType === 'dino' ? '🦖 DINOSAUR TIER' : '◈ APEX PREDATOR'}</div>`;

  // Render intro (questions drawn when player taps Begin)
  renderQuizIntro(animalId, tierType, quiz.intro);
  showScreen('quiz');
}

function renderQuizIntro(animalId, tierType, introText) {
  const a = ANIMALS[animalId];
  const quiz = QUIZZES[animalId];
  const body = document.getElementById('quiz-body');

  body.innerHTML = `
    <div class="quiz-animal-hdr">
      <span class="quiz-animal-em">${a.emoji}</span>
      <div class="quiz-animal-nm ${tierType}">${a.name}</div>
      <div class="quiz-animal-sub ${tierType}">${tierType === 'dino' ? '◈◈ DINOSAUR TIER' : '◈ APEX PREDATOR'}</div>
      <div class="quiz-animal-bio">${introText}</div>
    </div>
    <div style="background:var(--surface);border:1px solid var(--border);padding:18px;text-align:center;width:100%">
      <div style="font-family:var(--fm);font-size:.68rem;color:var(--text-dim);letter-spacing:.15em;text-transform:uppercase;margin-bottom:10px">Challenge Rules</div>
      <p style="font-size:.9rem;color:var(--text);margin-bottom:8px">Answer all <strong style="color:${tierType==='dino'?'var(--dino)':'var(--purple)'}">${UNLOCK_QUIZ_SESSION_LEN} questions</strong> correctly to unlock ${a.name}. Each run picks a fresh mix from a bigger fact deck.</p>
      <p style="font-size:.82rem;color:var(--text-dim);margin-bottom:16px">Miss any question and you can try again — the deck shuffles each time.</p>
      <div style="display:flex;gap:10px;justify-content:center">
        <button class="btn ${tierType === 'dino' ? 'btn-dino' : 'btn-purple'}" onclick="startQuizQuestions()">Begin Challenge →</button>
        <button class="btn btn-ghost btn-sm" onclick="exitQuiz()">Back</button>
      </div>
    </div>`;
}

function startQuizQuestions() {
  const id = quizState.animalId;
  quizState.sessionQuestions = pickUnlockSessionQuestions(id);
  if (!quizState.sessionQuestions.length) {
    alert('Could not load quiz questions. Please go back and try again.');
    return;
  }
  quizState.currentQ = 0;
  quizState.correctCount = 0;
  quizState.answered = false;
  renderQuizQuestion();
}

function renderQuizQuestion() {
  const a = ANIMALS[quizState.animalId];
  const sess = quizState.sessionQuestions;
  if (!sess?.length) return;
  const q = sess[quizState.currentQ];
  const tierType = quizUiTierType(quizState.animalId);
  const body = document.getElementById('quiz-body');
  const letters = ['A', 'B', 'C', 'D'];

  // Progress pips HTML
  const pipsHtml = sess.map((_, i) => {
    let cls = 'quiz-pip';
    if (i < quizState.currentQ) cls += ' done';
    else if (i === quizState.currentQ) cls += ` current ${tierType}`;
    return `<div class="${cls}"></div>`;
  }).join('');

  const optsHtml = q.opts.map((opt, i) =>
    `<button class="quiz-opt ${tierType}-opt" id="qopt-${i}" onclick="answerQuestion(${i})">
      <span class="qopt-letter">${letters[i]}</span>
      <span>${opt}</span>
    </button>`
  ).join('');

  body.innerHTML = `
    <div class="quiz-animal-hdr" style="display:flex;align-items:center;gap:12px;text-align:left">
      <span style="font-size:3rem">${a.emoji}</span>
      <div>
        <div class="quiz-animal-nm ${tierType}" style="font-size:1.2rem">${a.name}</div>
        <div class="quiz-animal-sub ${tierType}">UNLOCK CHALLENGE</div>
      </div>
    </div>
    <div class="quiz-prog" style="width:100%">
      ${pipsHtml}
      <span class="quiz-pip-lbl">Q${quizState.currentQ+1} of ${sess.length}</span>
    </div>
    <div class="quiz-qcard ${tierType}" style="width:100%">
      <div class="quiz-qnum">Question ${quizState.currentQ + 1}</div>
      <div class="quiz-qtxt">${q.q}</div>
      <div class="quiz-opts" id="quiz-opts-container">${optsHtml}</div>
      <div id="quiz-feedback-area"></div>
    </div>`;
}

function answerQuestion(optIdx) {
  if (quizState.answered) return;
  quizState.answered = true;

  const a = ANIMALS[quizState.animalId];
  const sess = quizState.sessionQuestions;
  const q = sess[quizState.currentQ];
  const tierType = quizUiTierType(quizState.animalId);
  const isCorrect = optIdx === q.correct;
  const letters = ['A','B','C','D'];

  if (isCorrect) quizState.correctCount++;

  // Style the option buttons
  document.querySelectorAll('.quiz-opt').forEach((btn, i) => {
    btn.classList.add('qdisabled');
    if (i === q.correct) btn.classList.add('qcorrect');
    else if (i === optIdx && !isCorrect) btn.classList.add('qwrong');
  });

  // Show feedback
  const feedback = document.getElementById('quiz-feedback-area');
  feedback.innerHTML = `
    <div class="quiz-feedback">
      <div class="qf-icon">${isCorrect ? '✅' : '❌'}</div>
      <div class="qf-verdict ${isCorrect ? 'qpass' : 'qfail'}">${isCorrect ? 'Correct!' : 'Wrong!'}</div>
      <div class="qf-correct-ans">${isCorrect ? 'Great job!' : `Correct answer: <strong>${letters[q.correct]}. ${q.opts[q.correct]}</strong>`}</div>
      <div class="qf-fact"><span class="qf-fact-lbl">💡 Fun Fact</span>${q.fact}</div>
      <button class="btn ${tierType === 'dino' ? 'btn-dino' : 'btn-purple'}" onclick="nextQuizQuestion()">${quizState.currentQ >= sess.length - 1 ? 'See Result →' : 'Next Question →'}</button>
    </div>`;

  // Scroll to feedback
  feedback.scrollIntoView({behavior:'smooth', block:'nearest'});
}

function nextQuizQuestion() {
  const sess = quizState.sessionQuestions;
  const n = sess?.length || 0;
  quizState.currentQ++;
  quizState.answered = false;

  if (quizState.currentQ >= n) {
    const passed = quizState.correctCount === n;
    showQuizResult(passed);
  } else {
    renderQuizQuestion();
    // Scroll back to top of quiz body
    document.getElementById('quiz-body').scrollTo({top:0, behavior:'smooth'});
  }
}

function showQuizResult(passed) {
  const animalId = quizState.animalId;
  const a = ANIMALS[animalId];
  const tierType = quizUiTierType(animalId);
  const p = state.progress;

  const nAsked = quizState.sessionQuestions?.length || UNLOCK_QUIZ_SESSION_LEN;
  recordQuizAnswers(p, nAsked, quizState.correctCount);
  if (passed) {
    if (!p.quizUnlocked.includes(animalId)) p.quizUnlocked.push(animalId);
  }
  saveUserProgress(p).catch(e => console.error('[forge] quiz result save failed', e));

  const body = document.getElementById('quiz-body');

  if (passed) {
    body.innerHTML = `
      <div class="quiz-result">
        <span class="qr-icon">🔓</span>
        <div class="qr-title qr-pass">${a.name} Unlocked!</div>
        <p class="qr-sub">${nAsked} / ${nAsked} correct — You know your stuff, Commander.</p>
        <div class="unlock-showcase ${tierType}-showcase">
          <span class="us-em">${a.emoji}</span>
          <div class="us-nm ${tierType}">${a.name}</div>
          <div class="us-bio">${a.bio}</div>
          ${window.buildMiniStats(a)}
          <div style="margin-top:12px;font-family:var(--fm);font-size:.62rem;color:var(--text-dim)">Now available in the Hybrid Forge.</div>
        </div>
        <div class="qr-acts">
          <button class="btn btn-primary btn-lg" onclick="returnFromQuiz()">⚗ Go to Forge</button>
          <button class="btn btn-ghost btn-sm" onclick="returnFromQuizHub()">Hub</button>
        </div>
      </div>`;
  } else {
    const correctCount = quizState.correctCount;
    body.innerHTML = `
      <div class="quiz-result">
        <span class="qr-icon">😞</span>
        <div class="qr-title qr-fail">Not Quite!</div>
        <p class="qr-sub">You got ${correctCount} / ${nAsked} correct. You need every question right to unlock ${a.name}.</p>
        <div style="background:var(--surface);border:1px solid rgba(255,34,68,.3);padding:20px;margin-bottom:18px;text-align:center">
          <div style="font-size:2.5rem;margin-bottom:8px">${a.emoji}</div>
          <div style="font-family:var(--fd);font-size:1rem;color:var(--text-dim);margin-bottom:6px">${a.name} remains locked.</div>
          <div style="font-family:var(--fm);font-size:.7rem;color:var(--text-dim)">You can attempt the quiz again any time from the Forge or Hub.</div>
        </div>
        <div class="qr-acts">
          <button class="btn btn-secondary" onclick="openQuiz('${animalId}')">↺ Try Again</button>
          <button class="btn btn-ghost btn-sm" onclick="returnFromQuiz()">Back to Forge</button>
        </div>
      </div>`;
  }
}

function returnFromQuiz() {
  state.selectedAnimals = state.playerHybrid ? [...state.playerHybrid.animals] : [];
  persistGameProgress().catch(e => console.error('[forge] returnFromQuiz save failed', e));
  showScreen('builder');
}
function returnFromQuizHub() {
  showHub();
}
function exitQuiz() {
  if (state.quizReturnScreen === 'hub') showScreen('hub');
  else {
    state.selectedAnimals = state.playerHybrid ? [...state.playerHybrid.animals] : [];
    showScreen('builder');
  }
}

export {
  showBuilder,
  showHub,
  renderBuilder,
  makeAnimalCard,
  makeQuizLockCard,
  isForgeMobileLayout,
  updateForgeMobileStepClass,
  updateForgeMobilePhaseLabel,
  scrollForgeColumnToFusionPanel,
  scrollToForgeAndHighlight,
  toggleAnimalSelect,
  updateForgeNextHint,
  updateSelectionUI,
  forgeHybrid,
  syncHybridNameInput,
  applyHybridDisplayName,
  renderHybridPreview,
  clearHybridPreview,
  renderEnemyPreviewInBuilder,
  openQuiz,
  renderQuizIntro,
  startQuizQuestions,
  renderQuizQuestion,
  answerQuestion,
  nextQuizQuestion,
  showQuizResult,
  returnFromQuiz,
  returnFromQuizHub,
  exitQuiz,
};