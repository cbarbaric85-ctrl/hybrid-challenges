function showScreen(name, sub) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(`screen-${name}`);
  if (el) el.classList.add('active');
  if (name === 'auth') window.setupAuth?.(sub || 'login');
  if (name === 'hub') window.renderHub?.();
  if (name === 'profile') window.renderProfile?.();
  if (name === 'animals-levels') window.renderAnimalsLevels?.();
  if (name === 'faction-select') window.renderFactionSelect?.();
  if (name === 'builder') window.renderBuilder?.();
  if (name === 'leaderboard') void window.renderLeaderboard?.();
  requestAnimationFrame(() => {
    window.scrollTo(0, 0);
    if (name === 'hub') {
      const hb = document.querySelector('#screen-hub .hub-scroll');
      if (hb) hb.scrollTop = 0;
    }
    if (name === 'leaderboard') {
      const lb = document.getElementById('leaderboard-body');
      if (lb) lb.scrollTop = 0;
    }
    if (name === 'profile') {
      const pb = document.getElementById('profile-body');
      if (pb) pb.scrollTop = 0;
    }
    if (name === 'animals-levels') {
      const ab = document.getElementById('animals-levels-body');
      if (ab) ab.scrollTop = 0;
    }
    if (name === 'builder') {
      const bl = document.querySelector('#screen-builder .builder-left');
      const br = document.querySelector('#screen-builder .builder-right');
      if (bl) bl.scrollTop = 0;
      if (br) br.scrollTop = 0;
    }
    if (name === 'quiz') {
      const qb = document.getElementById('quiz-body');
      if (qb) qb.scrollTop = 0;
    }
    if (name === 'battle') {
      const bb = document.querySelector('#screen-battle .battle-body');
      if (bb) bb.scrollTop = 0;
    }
    if (name === 'faction-select') {
      const fs = document.getElementById('screen-faction-select');
      if (fs && fs.scrollHeight > fs.clientHeight) fs.scrollTop = 0;
    }
    if (name === 'level-complete' || name === 'defeat' || name === 'game-complete' || name === 'landing' || name === 'auth') {
      const sec = document.getElementById(`screen-${name}`);
      if (sec && sec.scrollHeight > sec.clientHeight) sec.scrollTop = 0;
    }
  });
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export { showScreen, escapeHtml };