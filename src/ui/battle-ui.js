import {
  STAT_MAX, ANIMALS, ALL_ANIMALS,
  BASE_IDS, APEX_IDS, DINO_IDS, LEGENDARY_IDS, MYTHICAL_IDS, EGYPTIAN_IDS, KNIGHT_IDS,
} from '../data/animals.js';
import { LEVEL_REWARDS, LEVELS } from '../data/levels.js';
import { getArena } from '../data/arenas.js';
import { rollWeather } from '../data/weather.js';
import { getClashQuestion } from '../data/clash-quiz.js';
import {
  getFactionRoundBonus, trySanctuaryRevive, applyKnightFactionResilience, tryKnightBlockStance,
} from '../data/factions.js';
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
  pickDailyChallenge, getProgressionNextLines, egyptianTierQuizOpen, knightTierQuizOpen,
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
  applyArenaMods, applyWeatherMods, applyBossBoost,
  applyRoyalCommandBoost, hybridAbilityRoundBonus,
  roll, simulateRound, pickRoundStat, resolveRound, runFullBattle,
} from '../game/battle.js';
import { saveUserProgress, persistGameProgress, recordQuizAnswers, computeQuizAccuracy } from '../persistence/save.js';
import { syncActiveBoostsView } from '../game/mystery-reward.js';
import { syncLeaderboardEntry } from '../persistence/leaderboard.js';
import { showScreen, escapeHtml } from './screens.js';
import { localDateString } from '../game/utils.js';

const ARENA_CLASSES = ['arena-ocean','arena-jungle','arena-sky','arena-volcanic','arena-underworld','arena-celestial','arena-desert','arena-castle'];

let _factionHintTimer = null;
function showFactionBattleHints(messages) {
  const el = document.getElementById('battle-faction-hint');
  if (!el || !messages?.length) return;
  if (_factionHintTimer) clearTimeout(_factionHintTimer);
  el.textContent = messages.join(' ');
  el.classList.remove('hidden');
  _factionHintTimer = setTimeout(() => {
    el.classList.add('hidden');
    el.textContent = '';
    _factionHintTimer = null;
  }, 1400);
}

function hideFactionBattleHint() {
  if (_factionHintTimer) clearTimeout(_factionHintTimer);
  _factionHintTimer = null;
  const el = document.getElementById('battle-faction-hint');
  if (el) {
    el.classList.add('hidden');
    el.textContent = '';
  }
}
const WEATHER_CLASSES = ['weather-rain','weather-storm','weather-fog','weather-heatwave','weather-wind'];
const CAP_ANIM_CLASS = { spd: 'cap-anim-spd', agi: 'cap-anim-agi', int: 'cap-anim-int', str: 'cap-anim-str' };
const STAT_RESULT_EMOJI = { spd: '⚡', agi: '✦', int: '🧠', str: '💥' };
const ROUND_ANNOUNCE_STAT_CLASSES = ['round-announce--spd', 'round-announce--agi', 'round-announce--int', 'round-announce--str'];
const BATTLE_ROUND_FLASH_CLASSES = ['battle-round-flash-win', 'battle-round-flash-loss', 'battle-round-flash-tie'];
const CLASH_FEATURED_STATE_CLASSES = ['clash-featured--charge', 'clash-featured--win', 'clash-featured--lose', 'clash-featured--tie'];
const CLASH_LEADER_LABELS = { spd: 'Top speed', agi: 'Top agility', int: 'INT lead', str: 'Top strength' };

/** Catalogue stat leader among hybrid component animals; ties → first in array order. */
function getLeadingAnimalForStat(animalIds, statKey) {
  if (!animalIds?.length || !['spd', 'agi', 'int', 'str'].includes(statKey)) return null;
  let bestId = null;
  let bestVal = -Infinity;
  for (const id of animalIds) {
    const a = ALL_ANIMALS[id];
    if (!a) continue;
    const v = a[statKey];
    if (typeof v !== 'number') continue;
    if (v > bestVal) {
      bestVal = v;
      bestId = id;
    }
  }
  if (bestId == null) return null;
  const a = ALL_ANIMALS[bestId];
  return { id: bestId, emoji: a.emoji, name: a.name };
}

function clearClashFeaturedState() {
  ['clash-featured-p', 'clash-featured-e'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) CLASH_FEATURED_STATE_CLASSES.forEach((c) => el.classList.remove(c));
  });
}

function applyClashFeaturedLeaders(statKey) {
  const pLead = getLeadingAnimalForStat(state.playerHybrid?.animals, statKey);
  const eLead = getLeadingAnimalForStat(state.enemyHybrid?.animals, statKey);
  const pEmoji = document.getElementById('clash-featured-p-emoji');
  const eEmoji = document.getElementById('clash-featured-e-emoji');
  const pEl = document.getElementById('clash-featured-p');
  const eEl = document.getElementById('clash-featured-e');
  const lbl = document.getElementById('clash-leader-lbl');
  if (pEmoji) pEmoji.textContent = pLead?.emoji || '—';
  if (eEmoji) eEmoji.textContent = eLead?.emoji || '—';
  if (pEl) {
    pEl.setAttribute('aria-label', pLead ? `${pLead.name} leads for your team` : 'Your team');
    pEl.title = pLead ? pLead.name : '';
    pEl.removeAttribute('aria-hidden');
  }
  if (eEl) {
    eEl.setAttribute('aria-label', eLead ? `${eLead.name} leads for rival` : 'Rival team');
    eEl.title = eLead ? eLead.name : '';
    eEl.removeAttribute('aria-hidden');
  }
  if (lbl) lbl.textContent = CLASH_LEADER_LABELS[statKey] || 'Stat lead';
}

function setArenaTheme(arenaId) {
  const screen = document.getElementById('screen-battle');
  if (!screen) return;
  ARENA_CLASSES.forEach(c => screen.classList.remove(c));
  const arena = getArena(arenaId);
  screen.classList.add(arena.cssClass);

  const banner = document.getElementById('arena-effect-banner');
  if (banner) {
    banner.textContent = arena.banner;
    banner.classList.remove('hidden');
  }
}

function clearArenaTheme() {
  const screen = document.getElementById('screen-battle');
  if (!screen) return;
  ARENA_CLASSES.forEach(c => screen.classList.remove(c));
  const banner = document.getElementById('arena-effect-banner');
  if (banner) banner.classList.add('hidden');
}

function showRoundAnnounce(roundNum, statKey, statLabel) {
  const el = document.getElementById('round-announce');
  const numEl = document.getElementById('round-announce-num');
  const statEl = document.getElementById('round-announce-stat');
  const iconEl = document.getElementById('round-announce-icon');
  if (!el || !numEl || !statEl) return;
  ROUND_ANNOUNCE_STAT_CLASSES.forEach(c => el.classList.remove(c));
  el.classList.add(`round-announce--${statKey}`);
  if (iconEl) iconEl.textContent = STAT_TRAIL_ICONS[statKey] || STAT_RESULT_EMOJI[statKey] || '◆';
  numEl.textContent = `Round ${roundNum} — ${statLabel} Clash`;
  statEl.textContent = statLabel.toUpperCase();
  statEl.className = `round-announce-stat ${statKey}`;
  el.classList.remove('hidden');
  el.style.animation = 'none';
  void el.offsetWidth;
  el.style.animation = '';
}

function hideRoundAnnounce() {
  const el = document.getElementById('round-announce');
  if (el) {
    el.classList.add('hidden');
    ROUND_ANNOUNCE_STAT_CLASSES.forEach(c => el.classList.remove(c));
  }
}

function showRoundResultFlash(winner, statLabel) {
  const el = document.getElementById('round-result-flash');
  const screen = document.getElementById('screen-battle');
  if (screen) {
    BATTLE_ROUND_FLASH_CLASSES.forEach(c => screen.classList.remove(c));
    if (winner === 'player') screen.classList.add('battle-round-flash-win');
    else if (winner === 'enemy') screen.classList.add('battle-round-flash-loss');
    else screen.classList.add('battle-round-flash-tie');
  }
  if (!el) return;
  const emoji = winner === 'player' ? '💥' : winner === 'enemy' ? '💀' : '⚡';
  const text = winner === 'player' ? `${emoji} ${statLabel} Wins!`
    : winner === 'enemy' ? `${emoji} ${statLabel} Lost!`
    : `${emoji} ${statLabel} — Tie!`;
  const cls = winner === 'player' ? 'win' : winner === 'enemy' ? 'loss' : 'tie';
  el.textContent = text;
  el.className = `round-result-flash ${cls}`;
  el.style.animation = 'none';
  void el.offsetWidth;
  el.style.animation = '';
}

function hideRoundResultFlash() {
  const el = document.getElementById('round-result-flash');
  const screen = document.getElementById('screen-battle');
  if (screen) BATTLE_ROUND_FLASH_CLASSES.forEach(c => screen.classList.remove(c));
  if (el) el.className = 'round-result-flash hidden';
}

function applyCapabilityAnim(stat) {
  const fp = document.getElementById('fighter-player');
  const fe = document.getElementById('fighter-enemy');
  const cls = CAP_ANIM_CLASS[stat];
  if (!cls) return;
  [fp, fe].forEach(el => {
    if (!el) return;
    el.classList.remove(...Object.values(CAP_ANIM_CLASS));
    void el.offsetWidth;
    el.classList.add(cls);
  });
  setTimeout(() => {
    [fp, fe].forEach(el => el?.classList.remove(cls));
  }, 500);
}

// ═══════════════════════════════════════════════════════════════════
// WEATHER OVERLAY
// ═══════════════════════════════════════════════════════════════════

function setWeatherOverlay(weather) {
  const screen = document.getElementById('screen-battle');
  const overlay = document.getElementById('weather-overlay');
  const banner = document.getElementById('weather-effect-banner');
  if (!screen) return;
  WEATHER_CLASSES.forEach(c => screen.classList.remove(c));
  if (!weather) {
    if (overlay) overlay.classList.add('hidden');
    if (banner) banner.classList.add('hidden');
    return;
  }
  screen.classList.add(weather.cssClass);
  if (overlay) overlay.classList.remove('hidden');
  if (banner) {
    banner.textContent = weather.banner;
    banner.classList.remove('hidden');
  }
}

function clearWeatherOverlay() {
  setWeatherOverlay(null);
}

// ═══════════════════════════════════════════════════════════════════
// BOSS SYSTEM
// ═══════════════════════════════════════════════════════════════════

function setBossMode(isBoss) {
  const screen = document.getElementById('screen-battle');
  const banner = document.getElementById('boss-effect-banner');
  if (!screen) return;
  if (isBoss) {
    screen.classList.add('boss-active');
    if (banner) {
      banner.textContent = '👑 Boss Battle!';
      banner.classList.remove('hidden');
    }
  } else {
    screen.classList.remove('boss-active');
    if (banner) banner.classList.add('hidden');
  }
}

function clearBossMode() {
  const screen = document.getElementById('screen-battle');
  if (screen) screen.classList.remove('boss-active');
  const banner = document.getElementById('boss-effect-banner');
  if (banner) banner.classList.add('hidden');
  hideBossAbilityFlash();
}

function runBossIntro(levelDef, done) {
  const overlay = document.getElementById('boss-intro-overlay');
  const titleEl = document.getElementById('boss-intro-title');
  const tagEl = document.getElementById('boss-intro-tagline');
  if (!overlay || !levelDef.bossTitle) { done(); return; }

  titleEl.textContent = levelDef.bossTitle;
  tagEl.textContent = levelDef.bossTagline || '';
  overlay.classList.remove('hidden', 'boss-shake');
  overlay.style.animation = 'none';
  void overlay.offsetWidth;
  overlay.style.animation = '';

  const screen = document.getElementById('screen-battle');
  setTimeout(() => {
    overlay.classList.add('boss-shake');
    screen?.classList.add('boss-screen-shake');
  }, 1200);
  setTimeout(() => {
    screen?.classList.remove('boss-screen-shake');
  }, 1650);

  setTimeout(() => {
    overlay.classList.add('hidden');
    done();
  }, 2400);
}

function showBossAbilityFlash(bossAbility) {
  const el = document.getElementById('boss-ability-flash');
  if (!el || !bossAbility) return;
  el.textContent = `${bossAbility.emoji} ${state.enemyHybrid?.name || 'Boss'} unleashes ${bossAbility.name}!`;
  el.classList.remove('hidden');
  el.style.animation = 'none';
  void el.offsetWidth;
  el.style.animation = '';
}

function hideBossAbilityFlash() {
  const el = document.getElementById('boss-ability-flash');
  if (el) el.classList.add('hidden');
}

// ═══════════════════════════════════════════════════════════════════
// CLASH QUIZ — "Truth vs Lie" mid-round quiz
// ═══════════════════════════════════════════════════════════════════

const CLASH_STAT_ICONS = { spd: '⚡', agi: '🏃', int: '🧠', str: '💪' };
let _cqCallback = null;
let _cqTimer = null;
let _cqCountdownInterval = null;
let _cqCorrectIdx = -1;
let _cqAnswered = false;
let _cqStat = null;

function showClashQuiz(stat, callback) {
  _cqCallback = callback;
  _cqAnswered = false;
  _cqStat = stat;

  const q = getClashQuestion(stat);
  if (!q) { callback(false); return; }

  const truthFirst = Math.random() < 0.5;
  _cqCorrectIdx = truthFirst ? 0 : 1;

  const el = document.getElementById('clash-quiz');
  const iconEl = document.getElementById('cq-stat-icon');
  const opt0 = document.getElementById('cq-opt-0');
  const opt1 = document.getElementById('cq-opt-1');
  const timerFill = document.getElementById('cq-timer-fill');
  const fb = document.getElementById('cq-feedback');
  if (!el) { callback(false); return; }

  if (iconEl) iconEl.textContent = CLASH_STAT_ICONS[stat] || '⚔';
  if (opt0) { opt0.textContent = truthFirst ? q.truth : q.lie; opt0.disabled = false; opt0.className = 'cq-opt'; }
  if (opt1) { opt1.textContent = truthFirst ? q.lie : q.truth; opt1.disabled = false; opt1.className = 'cq-opt'; }
  if (fb) fb.className = 'cq-feedback hidden';

  const countdownEl = document.getElementById('cq-countdown');
  if (timerFill) {
    timerFill.style.transition = 'none';
    timerFill.style.width = '100%';
    timerFill.classList.remove('cq-urgent');
    void timerFill.offsetWidth;
    timerFill.style.transition = 'width 15s linear';
    timerFill.style.width = '0%';
  }
  if (countdownEl) {
    countdownEl.textContent = '15';
    countdownEl.style.fontSize = '1.1rem';
    countdownEl.classList.remove('cq-urgent');
  }

  let _secsLeft = 15;
  _cqCountdownInterval = setInterval(() => {
    _secsLeft--;
    if (_secsLeft < 0) _secsLeft = 0;
    if (countdownEl) {
      countdownEl.textContent = String(_secsLeft);
      const scale = 0.55 + (_secsLeft / 15) * 0.55;
      countdownEl.style.fontSize = `${scale.toFixed(2)}rem`;
      if (_secsLeft <= 5) {
        countdownEl.classList.add('cq-urgent');
        timerFill?.classList.add('cq-urgent');
      }
    }
  }, 1000);

  el.classList.remove('hidden');
  el.style.animation = 'none';
  void el.offsetWidth;
  el.style.animation = '';

  _cqTimer = setTimeout(() => {
    if (!_cqAnswered) answerClashQuiz(-1);
  }, 15000);
}

function answerClashQuiz(optIdx) {
  if (_cqAnswered || !_cqCallback) return;
  _cqAnswered = true;
  clearTimeout(_cqTimer);
  clearInterval(_cqCountdownInterval);

  const correct = optIdx === _cqCorrectIdx;
  const timedOut = optIdx === -1;
  const opt0 = document.getElementById('cq-opt-0');
  const opt1 = document.getElementById('cq-opt-1');
  const fb = document.getElementById('cq-feedback');
  const timerFill = document.getElementById('cq-timer-fill');

  if (timerFill) {
    const w = timerFill.getBoundingClientRect().width;
    const pw = timerFill.parentElement?.getBoundingClientRect().width || 1;
    timerFill.style.transition = 'none';
    timerFill.style.width = pw > 0 ? `${(w / pw) * 100}%` : '0%';
  }

  if (opt0) opt0.disabled = true;
  if (opt1) opt1.disabled = true;
  if (_cqCorrectIdx === 0) opt0?.classList.add('cq-correct');
  else opt1?.classList.add('cq-correct');
  if (!timedOut && !correct) {
    if (optIdx === 0) opt0?.classList.add('cq-wrong');
    else opt1?.classList.add('cq-wrong');
  }

  const icon = CLASH_STAT_ICONS[_cqStat] || '⚔';
  const statWord = STAT_LABELS_SIMPLE[_cqStat] || '';
  if (fb) {
    fb.classList.remove('hidden', 'cq-fb-correct', 'cq-fb-wrong');
    if (correct) {
      fb.textContent = `Correct! ${icon} +2 ${statWord}!`;
      fb.classList.add('cq-fb-correct');
    } else if (timedOut) {
      fb.textContent = "Time's up!";
      fb.classList.add('cq-fb-wrong');
    } else {
      fb.textContent = 'Not quite!';
      fb.classList.add('cq-fb-wrong');
    }
    fb.style.animation = 'none';
    void fb.offsetWidth;
    fb.style.animation = '';
  }

  if (state.progress) {
    recordQuizAnswers(state.progress, 1, correct ? 1 : 0);
  }

  const cb = _cqCallback;
  _cqCallback = null;
  setTimeout(() => {
    hideClashQuiz();
    cb(correct);
  }, 600);
}

function hideClashQuiz() {
  clearTimeout(_cqTimer);
  clearInterval(_cqCountdownInterval);
  const el = document.getElementById('clash-quiz');
  if (el) el.classList.add('hidden');
}

// ═══════════════════════════════════════════════════════════════════
// INTERACTIVE ROUND SYSTEM
// ═══════════════════════════════════════════════════════════════════

function playInteractiveRound(roundIdx) {
  const b = state.battle;
  if (!b) return;

  if (roundIdx >= 5) {
    const result = {
      rounds: b.roundResults,
      pWins: b.interactivePWins,
      eWins: b.interactiveEWins,
      winner: b.interactivePWins >= 3 ? 'player' : 'enemy',
    };
    b.result = result;
    document.getElementById('final-round-banner')?.classList.add('hidden');
    document.getElementById('battle-zone-focus')?.classList.remove('battle-final-round');
    hideRoundAnnounce();
    hideRoundResultFlash();
    hideBossAbilityFlash();
    hideClashQuiz();
    setTimeout(() => finishBattle(result), 720);
    return;
  }

  const stat = pickRoundStat();
  const statWord = STAT_LABELS_SIMPLE[stat];
  const roundNum = roundIdx + 1;
  const bzf = document.getElementById('battle-zone-focus');
  const frb = document.getElementById('final-round-banner');
  const fpRow = document.getElementById('fighter-player');
  if (roundIdx === 4) {
    frb?.classList.remove('hidden');
    bzf?.classList.add('battle-final-round');
  } else {
    frb?.classList.add('hidden');
    bzf?.classList.remove('battle-final-round');
  }
  if (fpRow) fpRow.classList.toggle('fighter-momentum', roundIdx > 0 && !b.playerLostLastRound);

  if (b.isBoss && b.bossAbility && roundIdx === 2 && !b.bossAbilityFired) {
    b.bossAbilityFired = true;
    showBossAbilityFlash(b.bossAbility);
    setTimeout(() => hideBossAbilityFlash(), 1000);
  }

  hideRoundResultFlash();
  showRoundAnnounce(roundNum, stat, statWord);
  applyCapabilityAnim(stat);
  scrollToBattleFocus();
  setBattleRoundStripProgress(roundIdx);

  setTimeout(() => {
    showClashQuiz(stat, (correct) => {
      const fid = state.progress?.faction || null;
      const quizPts = correct ? 2 : 0;
      const { bonus: fBonus, messages: fMsgs } = getFactionRoundBonus({
        factionId: fid,
        stat,
        roundIdx,
        playerLostLastRound: !!b.playerLostLastRound,
      });
      const hyb = hybridAbilityRoundBonus(state.playerHybrid, stat, !!b.playerLostLastRound, {
        roundIdx,
        interactiveEWins: b.interactiveEWins,
        interactivePWins: b.interactivePWins,
      });
      let round = resolveRound(b.pFighter, b.eFighter, stat, quizPts + fBonus + hyb.bonus);
      round.factionMessages = [...fMsgs, ...hyb.messages];
      round = applyKnightFactionResilience(round, fid, b, state.playerHybrid?.animals || []);
      round = trySanctuaryRevive(round, b, {
        factionId: fid,
        animalIds: state.playerHybrid?.animals || [],
      });
      round = tryKnightBlockStance(round, b, state.playerHybrid?.animals || []);
      b.roundResults.push(round);
      if (round.winner === 'player') b.interactivePWins++;
      else if (round.winner === 'enemy') b.interactiveEWins++;
      b.playerLostLastRound = round.winner === 'enemy';
      showFactionBattleHints(round.factionMessages || []);

      animateRoundResult(round, roundIdx, () => {
        playInteractiveRound(roundIdx + 1);
      });
    });
  }, 600);
}

function animateRoundResult(round, roundIdx, done) {
  const roundNum = roundIdx + 1;
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
    clearClashFeaturedState();
  };

  hideRoundAnnounce();
  clearClashRevealUI();
  const box = document.getElementById('clash-box');
  if (box) {
    box.classList.remove('hidden');
    box.classList.add('clash-active', 'clash-peak');
    setTimeout(() => box.classList.remove('clash-peak'), 500);
  }
  setClashStatHighlight(round.stat);
  const tag = document.querySelector('#clash-box .clash-tagline');
  if (tag) tag.textContent = `Category · ${statWord}`;
  const nm = document.getElementById('clash-stat-nm');
  if (nm) {
    nm.textContent = statWord.toUpperCase();
    nm.className = `clash-stat-nm ${round.stat}`;
  }
  applyClashFeaturedLeaders(round.stat);
  const pval = document.getElementById('clash-pval');
  const eval_ = document.getElementById('clash-eval');
  if (pval) pval.textContent = '?';
  if (eval_) eval_.textContent = '?';
  resetClashMeters();
  scrollToBattleFocus();

  const scheduleClashReveal = () => {
  // T+400: Player bar fills, value revealed
  setTimeout(() => {
    if (pval) {
      pval.textContent = round.pTotal;
      pval.classList.add('pop');
      setTimeout(() => pval.classList.remove('pop'), 500);
    }
    const featP = document.getElementById('clash-featured-p');
    featP?.classList.add('clash-featured--charge');
    setTimeout(() => featP?.classList.remove('clash-featured--charge'), 450);
    setClashMetersPlayerPortion(round.pTotal, round.eTotal);
  }, 400);

  // T+900: Rival bar fills, value revealed + clash moment
  setTimeout(() => {
    if (box) {
      box.classList.add('clash-clash-moment');
      setTimeout(() => box.classList.remove('clash-clash-moment'), 400);
    }
    const stage = document.getElementById('battle-zone-focus');
    if (stage) {
      stage.classList.add('clash-screen-shake');
      setTimeout(() => stage.classList.remove('clash-screen-shake'), 300);
    }
    if (eval_) {
      eval_.textContent = round.eTotal;
      eval_.classList.add('pop');
      setTimeout(() => eval_.classList.remove('pop'), 500);
    }
    document.getElementById('clash-featured-p')?.classList.remove('clash-featured--charge');
    const featE = document.getElementById('clash-featured-e');
    featE?.classList.add('clash-featured--charge');
    setTimeout(() => featE?.classList.remove('clash-featured--charge'), 450);
    setClashMetersEnemyPortion(round.pTotal, round.eTotal);
  }, 900);

  // T+1500: Verdict
  setTimeout(() => {
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
      }, 600);
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
      }, 600);
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

    showRoundResultFlash(round.winner, statWord);
    addLog(
      `<div class="round-trail-row ${rowCls}"><span class="rt-icon">${statIcon}</span><span class="rt-cat">${statWord}</span><span class="rt-badge ${badgeCls}">${badgeTxt}</span></div>`,
      0,
      { scrollFocus: true }
    );
    document.getElementById('r-counter').textContent = `${roundNum} / 5`;

    const lossStage = document.getElementById('battle-zone-focus');
    if (round.winner === 'enemy' && lossStage) {
      lossStage.classList.add('battle-zone-loss-shake');
      setTimeout(() => lossStage.classList.remove('battle-zone-loss-shake'), 520);
    }

    const clashFp = document.getElementById('clash-featured-p');
    const clashFe = document.getElementById('clash-featured-e');
    clashFp?.classList.remove('clash-featured--charge');
    clashFe?.classList.remove('clash-featured--charge');
    if (round.winner === 'player') {
      clashFp?.classList.add('clash-featured--win');
      clashFe?.classList.add('clash-featured--lose');
    } else if (round.winner === 'enemy') {
      clashFe?.classList.add('clash-featured--win');
      clashFp?.classList.add('clash-featured--lose');
    } else {
      clashFp?.classList.add('clash-featured--tie');
      clashFe?.classList.add('clash-featured--tie');
    }
  }, 1500);

  // T+2600: Cleanup → next
  setTimeout(() => {
    if (box) { box.classList.add('hidden'); box.classList.remove('clash-active'); }
    clearClashStatHighlight();
    clearClashFeaturedState();
    resetClashMeters();
    fp?.classList.remove('f-side-win', 'f-side-lose');
    fe?.classList.remove('f-side-win', 'f-side-lose');
    done();
  }, 2600);
  };
  requestAnimationFrame(() => requestAnimationFrame(scheduleClashReveal));
}

function startBattle() {
  if (!state.playerHybrid) return;
  clearDefeatAutoReturn();
  state.battleFlowGen = (state.battleFlowGen || 0) + 1;
  const p = state.progress;
  const levelDef = LEVELS[Math.min(p.level - 1, LEVELS.length - 1)];
  state.enemyHybrid = buildEnemyHybrid(levelDef);
  const questions = buildPreBattleQuizForAnimals(state.playerHybrid.animals);
  const isBoss = !!levelDef.isBoss;
  const weather = rollWeather(isBoss);
  state.battle = {
    levelDef,
    arenaId: levelDef.arena || 'ocean',
    isBoss,
    weatherId: weather?.id || null,
    weather,
    bossAbility: levelDef.bossAbility || null,
    bossAbilityFired: false,
    rounds: [],
    pWins: 0,
    eWins: 0,
    phase: 'pre_quiz',
    quizBoosts: EMPTY_STAT_BOOST(),
    quizBoostsPreMystery: null,
    mysteryBoostSnapshot: null,
    preQuiz: {
      questions,
      idx: 0,
      boosts: EMPTY_STAT_BOOST(),
      answered: false,
      lastCorrect: null,
    },
  };
  setArenaTheme(state.battle.arenaId);
  setWeatherOverlay(weather);
  setBossMode(isBoss);
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
    const pqBoosts = { ...pq.boosts };
    b.quizBoostsPreMystery = { ...pqBoosts };
    b.mysteryBoostSnapshot = null;
    let merged = { ...pqBoosts };
    const pending = state.progress?.pendingMysteryBattleBoost;
    if (pending && ['spd', 'agi', 'int', 'str'].some(k => (pending[k] || 0) > 0)) {
      b.mysteryBoostSnapshot = { spd: pending.spd || 0, agi: pending.agi || 0, int: pending.int || 0, str: pending.str || 0 };
      merged = mergeStatBoosts(merged, pending);
      state.progress.pendingMysteryBattleBoost = null;
      syncActiveBoostsView(state.progress);
    }
    b.quizBoosts = merged;
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

  const quizOnly = b.quizBoostsPreMystery || EMPTY_STAT_BOOST();
  const lines = [];
  for (const k of ['spd', 'agi', 'int', 'str']) {
    const n = quizOnly[k] || 0;
    if (n > 0) lines.push(`+${n} ${PRE_BATTLE_STAT_WORDS[k]}${n > 1 ? '' : ''} (this battle)`);
  }
  const mysterySnap = b.mysteryBoostSnapshot;
  const mysteryLines = [];
  if (mysterySnap) {
    for (const k of ['spd', 'agi', 'int', 'str']) {
      const n = mysterySnap[k] || 0;
      if (n > 0) mysteryLines.push(`+${n} ${PRE_BATTLE_STAT_WORDS[k]} (🎁 Mystery gift)`);
    }
  }
  const streakB = state.progress ? getStreakBattleBoost(state.progress) : EMPTY_STAT_BOOST();
  const streakPts = sumBoostPoints(streakB);
  const streakLine =
    streakPts > 0
      ? `<div class="boost-line" style="color:var(--orange)">🔥 +${streakPts} from your daily streak (this battle)</div>`
      : '';
  const quizList =
    lines.length > 0
      ? lines.map(t => `<div class="boost-line">✓ ${t}</div>`).join('')
      : `<div class="boost-line" style="color:var(--text-dim)">No quiz boosts this time — your base hybrid is ready to fight.</div>`;
  const mysteryBlock =
    mysteryLines.length > 0
      ? `<div class="boost-line" style="color:var(--purple);margin-top:8px">${mysteryLines.map(t => `<div>✓ ${t}</div>`).join('')}</div>`
      : '';
  const list = `${quizList}${mysteryBlock}`;

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
  const em = document.getElementById('bp-em');
  const nm = document.getElementById('bp-name');
  const comp = document.getElementById('bp-comp');
  const pw = document.getElementById('bp-power');
  if (em) em.textContent = disp.emojis;
  if (nm) nm.textContent = disp.name;
  if (comp) comp.textContent = disp.composition;
  const qPts = sumBoostPoints(state.battle.quizBoosts || EMPTY_STAT_BOOST());
  const sPts = sumBoostPoints(getStreakBattleBoost(state.progress));
  const bonusLbl = [qPts ? `+${qPts} quiz` : '', sPts ? `+${sPts} streak` : ''].filter(Boolean).join(' · ');
  if (pw) pw.innerHTML =
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
  if (pill) pill.textContent = `Level ${def.id} / ${LEVELS.length}`;
  document.getElementById('b-lvl-tag').textContent = 'Best of 5 rounds · Stat clash';
  document.getElementById('b-title').textContent = def.name.toUpperCase();
  document.getElementById('battle-topbar-info').textContent = `Mission L${def.id} — ${def.name}`;
  hideRoundAnnounce();
  hideRoundResultFlash();
  hideBossAbilityFlash();
  hideClashQuiz();
  hideFactionBattleHint();

  const disp = getBattleDisplayPlayerHybrid();
  const bpEm = document.getElementById('bp-em');
  const bpName = document.getElementById('bp-name');
  const bpComp = document.getElementById('bp-comp');
  if (bpEm) bpEm.textContent = disp.emojis;
  if (bpName) bpName.textContent = disp.name;
  if (bpComp) bpComp.textContent = disp.composition;
  const qPts = sumBoostPoints(state.battle.quizBoosts || EMPTY_STAT_BOOST());
  const sPts =
    state.battle.phase !== 'pre_quiz' ? sumBoostPoints(getStreakBattleBoost(state.progress)) : 0;
  const bonusLbl = [qPts ? `+${qPts} quiz` : '', sPts ? `+${sPts} streak` : ''].filter(Boolean).join(' · ');
  const bpPower = document.getElementById('bp-power');
  if (bpPower) bpPower.innerHTML =
    bonusLbl && state.battle.phase !== 'pre_quiz'
      ? `Power: <strong>${disp.power}</strong> <span style="color:var(--green);font-size:.55rem">(${bonusLbl})</span>`
      : `Power: <strong>${disp.power}</strong>`;
  renderFighterStats('bp-stats', disp.stats);

  const beEm = document.getElementById('be-em');
  const beName = document.getElementById('be-name');
  const beComp = document.getElementById('be-comp');
  const bePower = document.getElementById('be-power');
  if (beEm) beEm.textContent = e.emojis;
  if (beName) beName.textContent = e.name;
  if (beComp) beComp.textContent = e.composition;
  if (bePower) bePower.innerHTML = `Power: <strong>${e.power}</strong>`;
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
  el.innerHTML = ['spd', 'agi', 'int', 'str']
    .map(
      s =>
        `<div class="stat-pillar battle-stat-pillar" data-stat="${s}">
          <div class="sp-val">${stats[s]}</div>
          <div class="sp-track"><div class="sp-fill sf-${s}" style="height:${Math.min((stats[s] / STAT_MAX) * 100, 100)}%"></div></div>
          <div class="sp-lbl-row"><span class="sp-lbl">${s.toUpperCase()}</span><span class="sp-info" data-stat="${s}">i</span></div>
        </div>`
    )
    .join('');
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
  document.querySelectorAll('#round-pips .r-pip').forEach(p => p.classList.remove('current'));
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
  document.querySelectorAll('#round-pips .r-pip').forEach((pip, i) => {
    pip.classList.toggle('current', i === roundIdx);
  });
}

function finalizeBattleRoundStrip() {
  document.querySelectorAll('#brs-dots .brs-dot').forEach(d => {
    d.classList.remove('current', 'up');
    d.classList.add('done');
  });
  document.querySelectorAll('#round-pips .r-pip').forEach(p => p.classList.remove('current'));
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
  pm.style.transition = 'width .52s cubic-bezier(.22,.85,.28,1)';
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
  em.style.transition = 'width .52s cubic-bezier(.22,.85,.28,1)';
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
  overlay.classList.toggle('battle-result-overlay--confetti', won);
}

function hideBattleResultOverlay() {
  const overlay = document.getElementById('battle-result-overlay');
  if (!overlay) return;
  overlay.classList.add('hidden');
  overlay.classList.remove('battle-result-overlay--confetti');
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

  let pFighter = boosts && Object.values(boosts).some(n => n > 0)
    ? hybridWithTempBoost(state.playerHybrid, boosts)
    : state.playerHybrid;
  pFighter = applyArenaMods(pFighter, b.arenaId);
  pFighter = applyWeatherMods(pFighter, b.weatherId);
  let eFighter = applyArenaMods(state.enemyHybrid, b.arenaId);
  eFighter = applyWeatherMods(eFighter, b.weatherId);
  eFighter = applyBossBoost(eFighter, b.bossAbility);
  pFighter = applyRoyalCommandBoost(pFighter, state.playerHybrid);

  b.pFighter = pFighter;
  b.eFighter = eFighter;
  b.roundResults = [];
  b.interactivePWins = 0;
  b.interactiveEWins = 0;
  b.sanctuaryReviveUsed = false;
  b.knightPaladinShaveUsed = false;
  b.knightBlockStanceUsed = false;
  b.playerLostLastRound = false;

  const doCountdownAndFight = () => {
    runBattleCountdown(() => {
      scrollToBattleFocus();
      showBattleRoundStrip();
      playInteractiveRound(0);
    });
  };

  if (b.isBoss && b.levelDef) {
    runBossIntro(b.levelDef, doCountdownAndFight);
  } else {
    doCountdownAndFight();
  }
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

/** @deprecated — kept as fallback; interactive rounds use playInteractiveRound */
function animateBattle(result, roundIdx) {
  if (roundIdx >= result.rounds.length) {
    hideRoundAnnounce();
    hideRoundResultFlash();
    hideBossAbilityFlash();
    setTimeout(() => finishBattle(result), 720);
    return;
  }
  playInteractiveRound(roundIdx);
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
  state.lastBattleResult = won ? 'win' : 'loss';
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
    if (p.faction) p.factionXP = (p.factionXP || 0) + 2;
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
      cleanupBattleVisuals();
      state.battle = null;
      console.log('[battle] return to victory / level-complete flow');
      showLevelComplete().catch(e => console.error('[battle] showLevelComplete failed', e));
    }, 2200);
  } else {
    setTimeout(() => {
      if (flowGen !== state.battleFlowGen) return;
      clearDefeatAutoReturn();
      cleanupBattleVisuals();
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
      }, 6000));
    }, 2200);
  }
  } catch (fatalErr) {
    console.error('[battle] finishBattle crashed — forcing transition', fatalErr);
    hideBattleResultOverlay();
    cleanupBattleVisuals();
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
  const isEgyptianArcHint = currentLevel === 20;
  const isKnightsArcHint = currentLevel === 25;
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

  const egyptBox = document.getElementById('egyptian-box');
  if (egyptBox) {
    if (isEgyptianArcHint) {
      egyptBox.classList.remove('hidden');
      const gate = egyptianTierQuizOpen(p);
      egyptBox.innerHTML = `
        <div class="egyptian-bonus-title">⚱️ The Duat Opens — Egyptian Guardians!</div>
        <p style="font-size:.82rem;color:var(--text-dim);margin-bottom:10px">
          ${gate
            ? '<strong>All Mythical Gods recruited!</strong> Egyptian Guardian quizzes are live in the Forge — desert missions run from <strong>Level 21</strong> to <strong>25</strong>.'
            : 'You pierced the Pantheon! Finish recruiting <strong>every Mythical God</strong> in the Forge to unlock <strong>Egyptian Guardians</strong>, then take on Levels <strong>21–25</strong> in the sands.'}
        </p>
        <div class="apex-chips" style="gap:14px">
          ${EGYPTIAN_IDS.map(id => {
            const a = ANIMALS[id];
            return `<div class="apex-chip"><span>${a.emoji}</span><span style="color:var(--egyptian)">${a.name}</span></div>`;
          }).join('')}
        </div>
        <p style="font-size:.7rem;color:var(--text-dim);margin-top:10px;font-family:var(--fm)">Forge → ⚱️ Egyptian Guardians · Arena: Desert · Boss: Duat Overlord</p>`;
    } else {
      egyptBox.classList.add('hidden');
    }
  }

  const knightBox = document.getElementById('knight-box');
  if (knightBox) {
    if (isKnightsArcHint) {
      knightBox.classList.remove('hidden');
      const gate = knightTierQuizOpen(p);
      knightBox.innerHTML = `
        <div class="knights-bonus-title">🛡️ Knights of the Realm Unlocked!</div>
        <p style="font-size:.82rem;color:var(--text-dim);margin-bottom:10px">
          ${gate
            ? '<strong>All Egyptian Guardians recruited!</strong> Knight quizzes are live in the Forge — castle missions run from <strong>Level 26</strong> to <strong>30</strong>.'
            : 'You cleared the Duat arc! Finish recruiting <strong>every Egyptian Guardian</strong> in the Forge to unlock <strong>Knights of the Realm</strong>, then march through Levels <strong>26–30</strong>.'}
        </p>
        <div class="apex-chips" style="gap:14px">
          ${KNIGHT_IDS.map(id => {
            const a = ANIMALS[id];
            return `<div class="apex-chip"><span>${a.emoji}</span><span style="color:var(--knights)">${a.name}</span></div>`;
          }).join('')}
        </div>
        <p style="font-size:.7rem;color:var(--text-dim);margin-top:10px;font-family:var(--fm)">Forge → 🛡️ Knights / Medieval Order · Arena: Castle · Boss: King’s Champion</p>`;
    } else {
      knightBox.classList.add('hidden');
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
    }, 4500));
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

function cleanupBattleVisuals() {
  clearArenaTheme();
  clearWeatherOverlay();
  clearBossMode();
  hideClashQuiz();
  hideFactionBattleHint();
  clearClashFeaturedState();
  const screen = document.getElementById('screen-battle');
  if (screen) {
    screen.classList.remove('boss-screen-shake', ...BATTLE_ROUND_FLASH_CLASSES);
  }
  document.getElementById('battle-zone-focus')?.classList.remove('battle-final-round', 'clash-screen-shake', 'battle-zone-loss-shake');
  document.getElementById('final-round-banner')?.classList.add('hidden');
  document.getElementById('fighter-player')?.classList.remove('fighter-momentum');
}

function goNextLevel() {
  clearLevelCompleteAutoNav();
  clearDefeatAutoReturn();
  hideBattleResultOverlay();
  cleanupBattleVisuals();
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
  cleanupBattleVisuals();
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
  answerClashQuiz,
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