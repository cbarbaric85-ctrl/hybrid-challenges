// Entry point: import modules, wire window globals for inline onclick handlers.
import './boot.js';

import { showScreen } from './ui/screens.js';
import { state } from './game/state.js';
import { getAvailableAnimals } from './game/progression.js';
import { openCreatureIntel, closeCreatureIntel, getLastCreatureIntelReturnScreen } from './ui/creature-intel-ui.js';
import { switchTab, handleAuth, logout, setupAuth } from './ui/auth.js';
import {
  renderHub, hubSpendCoinTune, hubSpendTokenRecruit,
  renderProfile, renderAnimalsLevels, showProfile, showAnimalsLevels,
  hubActionAllegiance, hubActionBattle, hubActionTrain, hubActionUnlock, hubActionMysteryReward, hubActionNewFusion,
  hubActionCurrentHybrid,   hubActionTuneHybrid, closeHubTuneOverlay, hubTuneOverlayApply, clearAnimalsLevelsTierFilter,
  renderAnimalsTierRoster, showAnimalsLevelsFromTier,
} from './ui/hub.js';
import { initMysteryRewardUi } from './ui/mystery-reward-ui.js';
import { initHubTooltips } from './ui/hub-tooltips.js';
import {
  renderFactionSelect, pickFactionAndContinue, openFactionSelectFromHub,
} from './ui/faction-ui.js';
import {
  showBuilder, showHub, forgeHybrid,
  applyHybridDisplayName, renderBuilder,
  openForgeHybridModal, closeForgeHybridModal, forgeChooseDifferentAnimals,
  startQuizQuestions, answerQuestion, nextQuizQuestion,
  returnFromQuiz, returnFromQuizHub, openQuiz, exitQuiz,
  toggleAnimalSelect,
} from './ui/forge.js';

function creatureIntelUseInHybrid(id) {
  closeCreatureIntel();
  const p = state.progress;
  showScreen('builder');
  if (!p || !getAvailableAnimals(p).includes(id)) return;
  toggleAnimalSelect(id);
}

function creatureIntelReturnToAnimals() {
  closeCreatureIntel();
  if (getLastCreatureIntelReturnScreen() === 'animals-tier') {
    showScreen('animals-tier');
  } else {
    showAnimalsLevels();
  }
}
import {
  startBattle, beginBattle,
  answerPreBattleQuestion, advancePreBattleQuiz,
  confirmPreBattleAndStartFight,
  chooseOpeningStat,
  applyBattleRewardChoice,
  answerClashQuiz,
  goNextLevel, retryLevel, showGameComplete, newGame,
  buildMiniStats,
} from './ui/battle-ui.js';

/** Lazy-loaded — leaderboard UI + table fetch only when the player opens that screen. */
function showLeaderboard() {
  void import('./ui/leaderboard-ui.js').then(m => m.showLeaderboard());
}
async function renderLeaderboard() {
  const m = await import('./ui/leaderboard-ui.js');
  return m.renderLeaderboard();
}

Object.assign(window, {
  showScreen,
  switchTab,
  setupAuth,
  handleAuth,
  logout,
  renderHub,
  renderProfile,
  renderAnimalsLevels,
  showProfile,
  showAnimalsLevels,
  renderFactionSelect,
  pickFactionAndContinue,
  openFactionSelectFromHub,
  renderBuilder,
  renderLeaderboard,
  showBuilder,
  showHub,
  showLeaderboard,
  forgeHybrid,
  openForgeHybridModal,
  closeForgeHybridModal,
  forgeChooseDifferentAnimals,
  startBattle,
  beginBattle,
  exitQuiz,
  goNextLevel,
  retryLevel,
  newGame,
  startQuizQuestions,
  answerQuestion,
  nextQuizQuestion,
  returnFromQuiz,
  returnFromQuizHub,
  openQuiz,
  showGameComplete,
  answerPreBattleQuestion,
  advancePreBattleQuiz,
  confirmPreBattleAndStartFight,
  chooseOpeningStat,
  applyBattleRewardChoice,
  answerClashQuiz,
  applyHybridDisplayName,
  hubSpendCoinTune,
  hubSpendTokenRecruit,
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
  toggleAnimalSelect,
  buildMiniStats,
  openCreatureIntel,
  closeCreatureIntel,
  creatureIntelUseInHybrid,
  creatureIntelReturnToAnimals,
  renderAnimalsTierRoster,
  showAnimalsLevelsFromTier,
});

initMysteryRewardUi();
initHubTooltips();
