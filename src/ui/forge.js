import {
  STAT_MAX, STAGE_BASE, STAGE_APEX, STAGE_DINO, STAGE_LEGENDARY, STAGE_MYTHICAL, STAGE_EGYPTIAN, STAGE_KNIGHTS,
  ANIMALS, ALL_ANIMALS, APEX_IDS, DINO_IDS, LEGENDARY_IDS, MYTHICAL_IDS, EGYPTIAN_IDS, KNIGHT_IDS,
} from '../data/animals.js';
import { LEVELS } from '../data/levels.js';
import { QUIZZES } from '../data/quizzes.js';
import { state, quizState, resetQuizState, UNLOCK_QUIZ_SESSION_LEN, clearDefeatAutoReturn, clearLevelCompleteAutoNav } from '../game/state.js';
import {
  getAvailableAnimals, isQuizEligible, unlockGateLinesForAnimal,
  quizUiTierType, canAccessStage, egyptianTierQuizOpen, knightTierQuizOpen,
} from '../game/progression.js';
import {
  hybridName, powerScore, hybridTierClass,
  buildPlayerHybrid, buildEnemyHybrid,
} from '../game/hybrid.js';
import {
  STAT_LABELS, pickUnlockSessionQuestions, shuffleQuestionOpts,
} from '../game/battle.js';
import { sanitizeHybridName, recordQuizAnswers, saveUserProgress, persistGameProgress } from '../persistence/save.js';
import { syncActiveBoostsView } from '../game/mystery-reward.js';
import { showScreen } from './screens.js';
import { openCreatureIntel } from './creature-intel-ui.js';

function showBuilder() {
  clearDefeatAutoReturn();
  state.selectedAnimals = state.playerHybrid ? [...state.playerHybrid.animals] : [];
  showScreen('builder');
}
function showHub() {
  clearLevelCompleteAutoNav();
  clearDefeatAutoReturn();
  document.getElementById('battle-result-overlay')?.classList.add('hidden');
  document.getElementById('battle-countdown-overlay')?.classList.add('hidden');
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

  // ── SECTION 3: DINOSAUR TIER ──
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

  // ── SECTION 4: LEGENDARY BEASTS ──
  {
    const sec = document.createElement('div');
    sec.className = 'tier-section';
    sec.innerHTML = `<div class="tier-hdr"><span class="tier-hdr-nm legendary">🐲 Legendary Beasts</span><div class="tier-hdr-line" style="background:rgba(255,215,0,.3)"></div></div>`;

    if (p.level < 13) {
      const rem = 13 - p.level;
      sec.innerHTML += `<div class="tier-locked-notice"><strong>Legendary Beasts</strong><br>
        <em style="font-size:.55rem;color:var(--legendary)">"Ancient creatures of myth, forged in fire, magic, and legend."</em><br>
        <span class="unlock-gate-row"><span class="unlock-gate-no">○</span> Beat Level 12 (${rem} level${rem > 1 ? 's' : ''} to go)</span><br>
        <span class="unlock-gate-row"><span class="unlock-gate-no">○</span> Pass each Legendary quiz in the Forge</span></div>`;
    } else {
      const grid = document.createElement('div');
      grid.className = 'b-animal-grid';
      LEGENDARY_IDS.forEach(id => {
        if (available.includes(id)) {
          grid.appendChild(makeAnimalCard(id));
        } else {
          grid.appendChild(makeQuizLockCard(id, 'legendary'));
        }
      });
      sec.appendChild(grid);
    }
    container.appendChild(sec);
  }

  // ── SECTION 5: MYTHICAL GODS ──
  {
    const sec = document.createElement('div');
    sec.className = 'tier-section';
    sec.innerHTML = `<div class="tier-hdr"><span class="tier-hdr-nm mythical">⚡ Mythical Gods</span><div class="tier-hdr-line" style="background:rgba(0,200,255,.3)"></div></div>`;

    if (p.level < 17) {
      const rem = 17 - p.level;
      sec.innerHTML += `<div class="tier-locked-notice"><strong>Mythical Gods</strong><br>
        <em style="font-size:.55rem;color:var(--mythical)">"Beyond beasts — these are rulers of realms, masters of power itself."</em><br>
        <span class="unlock-gate-row"><span class="unlock-gate-no">○</span> Beat Level 16 (${rem} level${rem > 1 ? 's' : ''} to go)</span><br>
        <span class="unlock-gate-row"><span class="unlock-gate-no">○</span> Pass each Mythical quiz in the Forge</span></div>`;
    } else {
      const grid = document.createElement('div');
      grid.className = 'b-animal-grid';
      MYTHICAL_IDS.forEach(id => {
        if (available.includes(id)) {
          grid.appendChild(makeAnimalCard(id));
        } else {
          grid.appendChild(makeQuizLockCard(id, 'mythical'));
        }
      });
      sec.appendChild(grid);
    }
    container.appendChild(sec);
  }

  // ── SECTION 6: EGYPTIAN GUARDIANS ──
  {
    const sec = document.createElement('div');
    sec.className = 'tier-section';
    sec.innerHTML = `<div class="tier-hdr"><span class="tier-hdr-nm egyptian">⚱️ Egyptian Guardians</span><div class="tier-hdr-line" style="background:rgba(212,175,55,.35)"></div></div>`;

    if (!egyptianTierQuizOpen(p)) {
      sec.innerHTML += `<div class="tier-locked-notice"><strong>Egyptian Guardians</strong><br>
        <em style="font-size:.55rem;color:var(--egyptian)">"Sacred guardians of the Duat — wisdom of the desert."</em><br>
        <span class="unlock-gate-row"><span class="unlock-gate-no">○</span> Recruit <strong>every Mythical God</strong> (pass all Mythical quizzes)</span><br>
        <span class="unlock-gate-row"><span class="unlock-gate-no">○</span> Desert missions unlock from <strong>Level 21</strong> after the Pantheon falls</span></div>`;
      const gridEg = document.createElement('div');
      gridEg.className = 'b-animal-grid';
      EGYPTIAN_IDS.forEach(id => gridEg.appendChild(makeQuizLockCard(id, 'egyptian')));
      sec.appendChild(gridEg);
    } else {
      const grid = document.createElement('div');
      grid.className = 'b-animal-grid';
      EGYPTIAN_IDS.forEach(id => {
        if (available.includes(id)) {
          grid.appendChild(makeAnimalCard(id));
        } else {
          grid.appendChild(makeQuizLockCard(id, 'egyptian'));
        }
      });
      sec.appendChild(grid);
    }
    container.appendChild(sec);
  }

  // ── SECTION 7: KNIGHTS OF THE REALM ──
  {
    const sec = document.createElement('div');
    sec.className = 'tier-section';
    sec.innerHTML = `<div class="tier-hdr"><span class="tier-hdr-nm knights">🛡️ Knights of the Realm</span><div class="tier-hdr-line" style="background:rgba(140,170,220,.4)"></div></div>`;

    if (!knightTierQuizOpen(p)) {
      sec.innerHTML += `<div class="tier-locked-notice"><strong>Knights of the Realm</strong><br>
        <em style="font-size:.55rem;color:var(--knights)">"Honour-bound warriors who defend, endure, and outlast."</em><br>
        <span class="unlock-gate-row"><span class="unlock-gate-no">○</span> Recruit <strong>every Egyptian Guardian</strong> (pass all Egyptian quizzes)</span><br>
        <span class="unlock-gate-row"><span class="unlock-gate-no">○</span> Castle missions run from <strong>Level 26</strong> to <strong>30</strong></span></div>`;
      const gridK = document.createElement('div');
      gridK.className = 'b-animal-grid';
      KNIGHT_IDS.forEach(id => gridK.appendChild(makeQuizLockCard(id, 'knights')));
      sec.appendChild(gridK);
    } else {
      const grid = document.createElement('div');
      grid.className = 'b-animal-grid';
      KNIGHT_IDS.forEach(id => {
        if (available.includes(id)) {
          grid.appendChild(makeAnimalCard(id));
        } else {
          grid.appendChild(makeQuizLockCard(id, 'knights'));
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

function bacMiniBarsHtml(a) {
  const max = STAT_MAX;
  const pct = k => Math.max(6, Math.round((a[k] / max) * 100));
  const keys = ['spd', 'agi', 'int', 'str'];
  return `<div class="bac-mini-bars">${keys
    .map(
      k =>
        `<div class="bac-mini-pillar"><div class="bac-mini-track"><div class="bac-mini-fill sf-${k}" style="height:${pct(k)}%"></div></div><span class="bac-mini-lbl">${k}</span></div>`
    )
    .join('')}</div>`;
}

function makeAnimalCard(id) {
  const a = ANIMALS[id];
  const card = document.createElement('div');
  const isSelected = state.selectedAnimals.includes(id);
  const stageCls = a.stage === STAGE_KNIGHTS ? ' knights-card'
    : a.stage === STAGE_EGYPTIAN ? ' egyptian-card'
    : a.stage === STAGE_MYTHICAL ? ' mythical-card'
      : a.stage === STAGE_LEGENDARY ? ' legendary-card'
        : a.stage === STAGE_DINO ? ' dino-card'
          : a.stage === STAGE_APEX ? ' apex-card' : '';
  card.id = `bac-${id}`;
  card.className = `bac${stageCls}${isSelected?' sel':''}`;
  card.addEventListener('click', e => {
    if (e.target.closest('.bac-intel-btn')) return;
    toggleAnimalSelect(id);
  });
  const tierMap = {
    [STAGE_KNIGHTS]: ['🛡️ KNIGHT', 't8'],
    [STAGE_EGYPTIAN]: ['⚱️ EGYPTIAN', 't7'],
    [STAGE_MYTHICAL]: ['⚡ MYTHICAL', 't6'],
    [STAGE_LEGENDARY]: ['🐲 LEGENDARY', 't5'],
    [STAGE_DINO]: ['◈◈ DINOSAUR', 't4'],
    [STAGE_APEX]: ['◈ APEX', 't3'],
  };
  const [tierLbl, tierCls] = tierMap[a.stage] || ['BASE', ''];
  card.innerHTML = `<div class="bac-row-top">
    <button type="button" class="bac-intel-btn" aria-label="Creature info">ⓘ</button>
    <div class="bac-em">${a.emoji}</div>
  </div>
    <div class="bac-nm">${a.name}</div>
    <div class="bac-tier-tag ${tierCls}">${tierLbl}</div>
    ${bacMiniBarsHtml(a)}`;
  const intelBtn = card.querySelector('.bac-intel-btn');
  if (intelBtn) {
    intelBtn.addEventListener('click', e => {
      e.stopPropagation();
      openCreatureIntel(id, { returnScreen: 'builder' });
    });
  }
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
  card.innerHTML = `<div class="bac-row-top">
    <button type="button" class="bac-intel-btn" aria-label="Creature info">ⓘ</button>
    <div class="bql-em">${a.emoji}</div>
  </div>
    <div class="bql-nm">${a.name}</div>
    <div class="bql-lbl ${tierType}">🔒 ${eligible ? 'Quiz next' : 'Level first'}</div>
    <div class="bql-stats-preview bac-stats-mini" aria-hidden="true">
      <div class="bac-s">SPD <em>${a.spd}</em></div>
      <div class="bac-s">AGI <em>${a.agi}</em></div>
      <div class="bac-s">INT <em>${a.int}</em></div>
      <div class="bac-s">STR <em>${a.str}</em></div>
    </div>
    ${gateHtml ? `<div class="unlock-gate-list" style="margin-top:4px">${gateHtml}</div>` : ''}`;
  const intelBtn = card.querySelector('.bac-intel-btn');
  if (intelBtn) {
    intelBtn.addEventListener('click', e => {
      e.stopPropagation();
      openCreatureIntel(id, { returnScreen: 'builder' });
    });
  }
  if (eligible) {
    const btn = document.createElement('button');
    const quizBtnCls = {knights:'btn-knights',egyptian:'btn-egyptian',mythical:'btn-mythical',legendary:'btn-legendary',dino:'btn-dino'}[tierType] || 'btn-purple';
    btn.className = `btn btn-sm bac-quiz-btn ${quizBtnCls}`;
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
    const col = forgeCol;
    const top = targetEl.getBoundingClientRect().top - col.getBoundingClientRect().top + col.scrollTop - 8;
    console.log('[forge] fusion section ready — mobile forge column scroll', { top, colScrollH: col.scrollHeight });
    col.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
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
  const emEl = document.getElementById('h-emojis');
  if (emEl && h.animals?.length) {
    emEl.innerHTML = h.animals
      .map(
        aid =>
          `<button type="button" class="h-emoji-btn" data-hybrid-aid="${aid}" aria-label="${ANIMALS[aid]?.name || 'Animal'} info">${ANIMALS[aid]?.emoji || '?'}</button>`
      )
      .join('');
    emEl.querySelectorAll('.h-emoji-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const aid = btn.getAttribute('data-hybrid-aid');
        if (aid) openCreatureIntel(aid, { returnScreen: 'builder' });
      });
    });
  } else if (emEl) {
    emEl.textContent = h.emojis;
  }
  const nameGlowMap = {
    knights: 'knights-glow', egyptian: 'egyptian-glow', mythical: 'mythical-glow', legendary: 'legendary-glow', dino: 'dino-glow', apex: 'apex-glow',
  };
  const nameCls = 'h-name ' + (nameGlowMap[h.tierClass] || 'glow');
  document.getElementById('h-name').className = nameCls;
  document.getElementById('h-name').textContent = h.name;
  document.getElementById('h-sub').textContent = h.composition.toUpperCase();
  const readyMap = {
    knights: 'knights-ready', egyptian: 'egyptian-ready', mythical: 'mythical-ready', legendary: 'legendary-ready', dino: 'dino-ready', apex: 'apex-ready',
  };
  const hcardCls = 'hcard ' + (readyMap[h.tierClass] || 'ready');
  document.getElementById('hcard').className = hcardCls;
  // Power score
  document.getElementById('h-power').classList.remove('hidden');
  document.getElementById('h-power-num').textContent = h.power;
  for (const stat of ['spd','agi','int','str']) {
    const fill = document.getElementById(`hs-${stat}`);
    if (fill) fill.style.height = `${Math.min((h.stats[stat]/STAT_MAX)*100,100)}%`;
    const val = document.getElementById(`hv-${stat}`);
    if (val) val.textContent = h.stats[stat];
  }
  syncHybridNameInput();
}

function clearHybridPreview() {
  const emEl = document.getElementById('h-emojis');
  if (emEl) {
    emEl.innerHTML = '';
    emEl.textContent = '—';
  }
  document.getElementById('h-name').className = 'h-name';
  document.getElementById('h-name').textContent = 'No Animals Selected';
  document.getElementById('h-sub').textContent = 'SELECT 1–3 ANIMALS TO FUSE';
  document.getElementById('hcard').className = 'hcard';
  document.getElementById('h-power').classList.add('hidden');
  for (const stat of ['spd','agi','int','str']) {
    const fill = document.getElementById(`hs-${stat}`);
    if (fill) fill.style.height = '0%';
    const val = document.getElementById(`hv-${stat}`);
    if (val) val.textContent = '—';
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

  const tierBadgeText = {
    knights: '🛡️ KNIGHT OF THE REALM', egyptian: '⚱️ EGYPTIAN GUARDIAN', mythical: '⚡ MYTHICAL GOD', legendary: '🐲 LEGENDARY BEAST', dino: '🦖 DINOSAUR TIER',
  };
  document.getElementById('quiz-tier-badge').innerHTML =
    `<div class="tier-badge-topbar ${tierType}">${tierBadgeText[tierType] || '◈ APEX PREDATOR'}</div>`;

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
      <div class="quiz-animal-sub ${tierType}">${{knights:'🛡️ KNIGHT OF THE REALM',egyptian:'⚱️ EGYPTIAN GUARDIAN',mythical:'⚡ MYTHICAL GOD',legendary:'🐲 LEGENDARY BEAST',dino:'◈◈ DINOSAUR TIER'}[tierType]||'◈ APEX PREDATOR'}</div>
      <div class="quiz-animal-bio">${introText}</div>
    </div>
    <div style="background:var(--surface);border:1px solid var(--border);padding:18px;text-align:center;width:100%">
      <div style="font-family:var(--fm);font-size:.68rem;color:var(--text-dim);letter-spacing:.15em;text-transform:uppercase;margin-bottom:10px">Challenge Rules</div>
      <p style="font-size:.9rem;color:var(--text);margin-bottom:8px">Answer all <strong style="color:var(--${{knights:'knights',egyptian:'egyptian',mythical:'mythical',legendary:'legendary',dino:'dino'}[tierType]||'purple'})">${UNLOCK_QUIZ_SESSION_LEN} questions</strong> correctly to unlock ${a.name}. Each run picks a fresh mix from a bigger fact deck.</p>
      <p style="font-size:.82rem;color:var(--text-dim);margin-bottom:16px">Miss any question and you can try again — the deck shuffles each time.</p>
      <div style="display:flex;gap:10px;justify-content:center">
        <button class="btn ${{knights:'btn-knights',egyptian:'btn-egyptian',mythical:'btn-mythical',legendary:'btn-legendary',dino:'btn-dino'}[tierType]||'btn-purple'}" onclick="startQuizQuestions()">Begin Challenge →</button>
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
  const p = state.progress;
  let isCorrect = optIdx === q.correct;
  let usedGrace = false;
  if (!isCorrect && p && (p.pendingQuizGrace || 0) > 0) {
    p.pendingQuizGrace = Math.max(0, (p.pendingQuizGrace || 0) - 1);
    isCorrect = true;
    usedGrace = true;
    syncActiveBoostsView(p);
  }
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
  const graceHint = usedGrace ? '<div class="qf-grace" style="font-family:var(--fm);font-size:.65rem;color:var(--purple);margin-top:6px">🎁 Mystery boost: that counts as correct!</div>' : '';
  feedback.innerHTML = `
    <div class="quiz-feedback">
      <div class="qf-icon">${isCorrect ? '✅' : '❌'}</div>
      <div class="qf-verdict ${isCorrect ? 'qpass' : 'qfail'}">${isCorrect ? (usedGrace ? 'Counted!' : 'Correct!') : 'Wrong!'}</div>
      <div class="qf-correct-ans">${isCorrect ? (usedGrace ? 'Your quiz boost saved this one — nice!' : 'Great job!') : `Correct answer: <strong>${letters[q.correct]}. ${q.opts[q.correct]}</strong>`}</div>
      ${graceHint}
      <div class="qf-fact"><span class="qf-fact-lbl">💡 Fun Fact</span>${q.fact}</div>
      <button class="btn ${{knights:'btn-knights',egyptian:'btn-egyptian',mythical:'btn-mythical',legendary:'btn-legendary',dino:'btn-dino'}[tierType]||'btn-purple'}" onclick="nextQuizQuestion()">${quizState.currentQ >= sess.length - 1 ? 'See Result →' : 'Next Question →'}</button>
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
  p.pendingQuizGrace = 0;
  syncActiveBoostsView(p);
  saveUserProgress(p).catch(e => console.error('[forge] quiz result save failed', e));

  const body = document.getElementById('quiz-body');
  const fromHub =
    state.quizReturnScreen === 'hub'
    || state.quizReturnScreen === 'animals-levels'
    || state.quizReturnScreen === 'animals-tier';

  if (passed) {
    const hubNextHint = fromHub
      ? `<p class="qr-sub" style="margin-top:10px;max-width:36ch;margin-left:auto;margin-right:auto;line-height:1.5">Head back to the <strong>Hub</strong> to plan your next mission, or open the <strong>Forge</strong> to fuse your new recruit.</p>`
      : '';
    const passActs = fromHub
      ? `<div class="qr-acts">
          <button class="btn btn-primary btn-lg" onclick="returnFromQuizHub()">Return to Hub</button>
          <button class="btn btn-secondary" onclick="returnFromQuiz()">Open Forge</button>
        </div>`
      : `<div class="qr-acts">
          <button class="btn btn-primary btn-lg" onclick="returnFromQuiz()">⚗ Go to Forge</button>
          <button class="btn btn-ghost btn-sm" onclick="returnFromQuizHub()">Hub</button>
        </div>`;
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
        ${hubNextHint}
        ${passActs}
      </div>`;
  } else {
    const correctCount = quizState.correctCount;
    const failActs = fromHub
      ? `<div class="qr-acts">
          <button class="btn btn-secondary" onclick="openQuiz('${animalId}')">↺ Try Again</button>
          <button class="btn btn-primary btn-sm" onclick="returnFromQuizHub()">Return to Hub</button>
          <button class="btn btn-ghost btn-sm" onclick="returnFromQuiz()">Forge</button>
        </div>`
      : `<div class="qr-acts">
          <button class="btn btn-secondary" onclick="openQuiz('${animalId}')">↺ Try Again</button>
          <button class="btn btn-ghost btn-sm" onclick="returnFromQuiz()">Back to Forge</button>
        </div>`;
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
        ${failActs}
      </div>`;
  }
}

function returnFromQuiz() {
  state.selectedAnimals = state.playerHybrid ? [...state.playerHybrid.animals] : [];
  persistGameProgress().catch(e => console.error('[forge] returnFromQuiz save failed', e));
  showScreen('builder');
}
function returnFromQuizHub() {
  clearLevelCompleteAutoNav();
  clearDefeatAutoReturn();
  document.getElementById('battle-result-overlay')?.classList.add('hidden');
  document.getElementById('battle-countdown-overlay')?.classList.add('hidden');
  if (state.quizReturnScreen === 'animals-levels') showScreen('animals-levels');
  else if (state.quizReturnScreen === 'animals-tier') showScreen('animals-tier');
  else showScreen('hub');
}
function exitQuiz() {
  if (state.quizReturnScreen === 'hub') showScreen('hub');
  else if (state.quizReturnScreen === 'animals-levels') showScreen('animals-levels');
  else if (state.quizReturnScreen === 'animals-tier') showScreen('animals-tier');
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