/** Hub stat/action tooltips — one at a time, tap outside to close. */

const TIPS = {
  streak: 'Days in a row you’ve played.',
  coins: 'Spend Fusion Coins in Rewards to power up your hybrid.',
  tokens: 'Spend Unlock Tokens to fast-unlock the next creature on your path.',
  power: 'Your hybrid’s battle strength.',
  xp: 'Win battles to level up your Spark and fill this bar.',
  reward: 'Pick 1 of 3 cups — you can open up to 3 mystery rewards each day (same great prizes).',
  train: 'Answer questions to earn boosts.',
  unlock: 'Spend tokens to fast-unlock the next recruit on your path.',
  battle: 'Fight the current level in the arena. Forge a hybrid first if you need a new one.',
};

let openId = null;

function ensureBackdrop() {
  let el = document.getElementById('hub-tip-backdrop');
  if (!el) {
    el = document.createElement('div');
    el.id = 'hub-tip-backdrop';
    el.className = 'hub-tip-backdrop hidden';
    el.setAttribute('aria-hidden', 'true');
    document.body.appendChild(el);
    el.addEventListener('click', () => closeHubTooltip());
  }
  return el;
}

function ensureBubble() {
  let el = document.getElementById('hub-tooltip-bubble');
  if (!el) {
    el = document.createElement('div');
    el.id = 'hub-tooltip-bubble';
    el.className = 'hub-tooltip-bubble hidden';
    el.setAttribute('role', 'tooltip');
    document.body.appendChild(el);
  }
  return el;
}

export function showHubTooltip(tipId, anchorEl) {
  const text = TIPS[tipId];
  if (!text || !anchorEl) return;
  closeHubTooltip();

  openId = tipId;
  const bubble = ensureBubble();
  bubble.textContent = text;
  bubble.classList.remove('hidden');
  void bubble.offsetWidth;

  requestAnimationFrame(() => {
    const rect = anchorEl.getBoundingClientRect();
    const pad = 8;
    const maxW = Math.min(240, window.innerWidth - pad * 2);
    bubble.style.maxWidth = `${maxW}px`;
    bubble.style.width = 'auto';
    let left = rect.left + rect.width / 2 - bubble.offsetWidth / 2;
    left = Math.max(pad, Math.min(left, window.innerWidth - bubble.offsetWidth - pad));
    bubble.style.left = `${left}px`;
    const top = rect.top - bubble.offsetHeight - 10;
    bubble.style.top = `${Math.max(pad, top)}px`;
  });

  ensureBackdrop().classList.remove('hidden');
}

export function closeHubTooltip() {
  openId = null;
  document.getElementById('hub-tooltip-bubble')?.classList.add('hidden');
  document.getElementById('hub-tip-backdrop')?.classList.add('hidden');
}

export function initHubTooltips() {
  document.addEventListener(
    'click',
    e => {
      const btn = e.target.closest?.('.hub-tip-btn');
      if (btn) {
        e.preventDefault();
        e.stopPropagation();
        const id = btn.getAttribute('data-tip');
        if (!id) return;
        if (id === openId) {
          closeHubTooltip();
          return;
        }
        showHubTooltip(id, btn);
        return;
      }
      if (e.target.closest?.('#hub-tooltip-bubble')) return;
      closeHubTooltip();
    },
    true
  );
}
