import { state } from '../game/state.js';
import { showScreen, escapeHtml } from './screens.js';
import {
  ensureMyPublicLeaderboardDocLoaded,
  fetchLeaderboardWithRank,
} from '../persistence/leaderboard.js';
import { isLeaderboardOptIn, publicDocShowsAsOptedIn } from '../persistence/save.js';

// Imported from hub.js — but to avoid circular deps, we inline it
import { COMMANDER_XP_SEGMENT } from '../game/state.js';
function getCommanderXpSegment(xp) {
  const x = Math.max(0, xp | 0);
  const seg = COMMANDER_XP_SEGMENT;
  const inSeg = x % seg;
  const tier = Math.floor(x / seg) + 1;
  return { tier, inSeg, seg, pct: Math.min(100, (inSeg / seg) * 100) };
}

function showLeaderboard() {
  showScreen('leaderboard');
}

async function renderLeaderboard() {
  const body = document.getElementById('leaderboard-body');
  if (!body) return;
  body.innerHTML = '<p class="lb-loading">Loading rankings…</p>';
  try {
    const myUid = state.profile?.uid;
    const optedIn = isLeaderboardOptIn();
    const { myPublic } = await ensureMyPublicLeaderboardDocLoaded();
    console.log('[lb] render after ensure', {
      uid: myUid,
      hasPublicRow: !!myPublic,
      publicOptIn: myPublic?.leaderboardOptIn,
    });

    const { rows, myRank, scanned } = await fetchLeaderboardWithRank();
    console.log('[lb] render table snapshot', { tableRows: rows.length, myRank, scanned });

    let rankBanner = '';
    if (!optedIn) {
      rankBanner =
        '<p class="lb-rank-banner lb-rank-muted">You are browsing as opted out — your row stays private. Opt in from your profile when that toggle ships to earn a rank here.</p>';
    } else if (myPublic && myPublic.leaderboardOptIn === false) {
      rankBanner =
        '<p class="lb-rank-banner lb-rank-muted">Your account is set to stay off the public board.</p>';
    } else if (myRank != null) {
      rankBanner = `<p class="lb-rank-banner lb-rank-you">You are ranked <strong>#${myRank}</strong> among the top ${scanned} commanders we loaded (then we show the top 25).</p>`;
    } else if (publicDocShowsAsOptedIn(myPublic)) {
      rankBanner = `<p class="lb-rank-banner lb-rank-muted">You are not in the <strong>top 25</strong> on screen — we load the top <strong>100</strong> by best level first, then sort. Your live stats are always shown in <strong>Your entry</strong> below.</p>`;
    } else {
      rankBanner = `<p class="lb-rank-banner lb-rank-muted">We could not load your public row after publishing. Check the browser console for logs starting with <strong>[lb]</strong> — often a Firestore security rules issue on the <strong>leaderboardEntries</strong> collection — or try again in a moment.</p>`;
    }

    let yourCard = '';
    if (optedIn && publicDocShowsAsOptedIn(myPublic)) {
      const hn = (myPublic.hybridName && String(myPublic.hybridName).trim()) || '';
      const hybridLine = hn ? `<div class="lb-ye-hybrid">🐾 ${escapeHtml(hn)}</div>` : '';
      const tq = myPublic.totalQuizQuestions ?? 0;
      const tc = Math.min(myPublic.totalQuizCorrect ?? 0, tq);
      const accPct =
        tq > 0
          ? myPublic.quizAccuracy != null
            ? myPublic.quizAccuracy
            : Math.round((100 * tc) / tq)
          : null;
      const brain = accPct != null ? `${accPct}%` : '—';
      yourCard = `<div class="lb-your-entry">
        <div class="lb-ye-title">Your entry <span class="lb-ye-tag">synced</span></div>
        <div class="lb-ye-grid">
          <div><em>Commander</em><strong>${escapeHtml(myPublic.username || 'Commander')}</strong>${hybridLine}</div>
          <div><em>Best level</em><strong>${myPublic.highestLevelReached ?? 0}</strong></div>
          <div><em>Power</em><strong>${myPublic.hybridPowerScore ?? 0}</strong></div>
          <div><em>Wins</em><strong>${myPublic.totalWins ?? 0}</strong></div>
          <div><em>Brain</em><strong>${brain}</strong></div>
        </div>
      </div>`;
    }

    const tableRows = rows
      .map((r, i) => {
        const rank = i + 1;
        const isMe = r.uid === myUid;
        const hn = (r.hybridName && String(r.hybridName).trim()) || '';
        const hybridSub = hn
          ? `<div class="lb-hybrid-sub">🐾 ${escapeHtml(hn)}</div>`
          : '';
        const tq = r.totalQuizQuestions ?? 0;
        const tc = Math.min(r.totalQuizCorrect ?? 0, tq);
        const accPct =
          tq > 0
            ? r.quizAccuracy != null
              ? r.quizAccuracy
              : Math.round((100 * tc) / tq)
            : null;
        const brain = accPct != null ? `${accPct}%` : '—';
        return `<tr class="${isMe ? 'lb-row-me' : ''}">
          <td class="lb-rank">${rank}</td>
          <td class="lb-name">${escapeHtml(r.username || 'Commander')}${hybridSub}</td>
          <td class="lb-num">${r.highestLevelReached ?? 0}</td>
          <td class="lb-num">${r.hybridPowerScore ?? 0}</td>
          <td class="lb-num">${r.totalWins ?? 0}</td>
          <td class="lb-brain" title="Fun fact power — from unlock & battle boost quizzes">${brain}</td>
        </tr>`;
      })
      .join('');

    const tableBlock =
      rows.length > 0
        ? `<div class="lb-table-wrap">
        <table class="lb-table">
          <thead><tr>
            <th>#</th><th>Commander</th><th>Best Lv</th><th>Power</th><th>Wins</th><th>Brain</th>
          </tr></thead>
          <tbody>${tableRows}</tbody>
        </table>
      </div>`
        : '<p class="lb-empty">No other commanders matched the live query yet — new players start at level 0 and climb into the top 100 as they play.</p>';

    body.innerHTML = `
      ${rankBanner}
      ${yourCard}
      <p class="lb-note">Top 25 · Sorted by best level, then power, then wins. <strong>Brain</strong> = your quiz hit rate (the more you play, the cooler it gets).</p>
      ${tableBlock}`;
    console.log('[lb] render complete');
  } catch (e) {
    console.error('[lb] render failed', e);
    body.innerHTML =
      '<p class="lb-err">Could not load the leaderboard. Check your connection or Firestore index (leaderboardOptIn + highestLevelReached).</p>';
  }
}

export { showLeaderboard, renderLeaderboard };