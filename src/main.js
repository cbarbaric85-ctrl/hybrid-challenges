// Entry point: import modules, wire window globals for inline onclick handlers.
import './boot.js';

import { showScreen } from './ui/screens.js';
import { state } from './game/state.js';
import { getAvailableAnimals } from './game/progression.js';
import { openCreatureIntel, closeCreatureIntel } from './ui/creature-intel-ui.js';
import { switchTab, handleAuth, logout, setupAuth } from './ui/auth.js';
import {
  renderHub, hubSpendCoinTune, hubSpendTokenRecruit,
  renderProfile, renderAnimalsLevels, showProfile, showAnimalsLevels,
  hubActionAllegiance, hubActionBattle, hubActionTrain, hubActionUnlock, hubActionMysteryReward, hubActionNewFusion,
  hubActionCurrentHybrid, hubActionTuneHybrid, closeHubTuneOverlay, hubTuneOverlayApply, clearAnimalsLevelsTierFilter,
} from './ui/hub.js';
import { initMysteryRewardUi } from './ui/mystery-reward-ui.js';
import { initHubTooltips } from './ui/hub-tooltips.js';
import {
  renderFactionSelect, pickFactionAndContinue, openFactionSelectFromHub,
} from './ui/faction-ui.js';
import {
  showBuilder, showHub, forgeHybrid,
  applyHybridDisplayName, renderBuilder,
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
import { showLeaderboard, renderLeaderboard } from './ui/leaderboard-ui.js';
import {
  startBattle, beginBattle,
  answerPreBattleQuestion, advancePreBattleQuiz,
  confirmPreBattleAndStartFight,
  answerClashQuiz,
  goNextLevel, retryLevel, showGameComplete, newGame,
  buildMiniStats,
} from './ui/battle-ui.js';

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
});

initMysteryRewardUi();
initHubTooltips();
