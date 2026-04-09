// Entry point: import modules, wire window globals for inline onclick handlers.
import './boot.js';

import { showScreen } from './ui/screens.js';
import { switchTab, handleAuth, logout, setupAuth } from './ui/auth.js';
import {
  renderHub, hubSpendCoinTune, hubSpendTokenRecruit,
  hubActionTrain, hubActionUnlock, hubActionImprove, hubActionNewFusion,
} from './ui/hub.js';
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
  hubActionTrain,
  hubActionUnlock,
  hubActionImprove,
  hubActionNewFusion,
  toggleAnimalSelect,
  buildMiniStats,
});
