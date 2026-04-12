import { getCreatureIntel } from '../data/creature-intel.js';
import { state } from '../game/state.js';
import { escapeHtml } from './screens.js';

let _returnScreen = 'hub';

function barPct(val, max) {
  return Math.min(100, Math.round((val / max) * 100));
}

function renderCreatureIntel(id) {
  const p = state.progress;
  const data = getCreatureIntel(id, { progress: p });
  const body = document.getElementById('creature-intel-body');
  const title = document.getElementById('creature-intel-title');
  if (!body || !title) return;

  title.textContent = data.locked ? 'Creature intel' : data.name;

  if (data.error) {
    body.innerHTML = '<p class="ci-teaser">Creature data not found.</p>';
    return;
  }

  if (data.locked) {
    body.innerHTML = `
      <div class="ci-locked-hdr">
        <span class="ci-emoji ci-emoji--dim" aria-hidden="true">${data.emoji}</span>
        <div>
          <div class="ci-name">${escapeHtml(data.name)}</div>
          <div class="ci-tier">${escapeHtml(data.tierLabel)}</div>
        </div>
      </div>
      <p class="ci-teaser">${escapeHtml(data.teaser)}</p>`;
    return;
  }

  const statRows = ['spd', 'agi', 'int', 'str']
    .map(k => {
      const v = data.stats[k];
      const pct = barPct(v, data.statMax);
      const cls = `sf-${k}`;
      return `<div class="ci-stat-row">
        <span class="ci-stat-lbl">${k.toUpperCase()}</span>
        <div class="ci-stat-track"><div class="ci-stat-fill ${cls}" style="width:${pct}%"></div></div>
        <span class="ci-stat-val">${v}</span>
      </div>`;
    })
    .join('');

  const strengths = data.strengths
    .map(s => `<span class="ci-pill ci-pill--str">★ ${escapeHtml(s.label)} (${s.value})</span>`)
    .join(' ');

  const pairings = data.pairings
    .map(
      pr => `<button type="button" class="ci-pair-row" data-intel-pair-id="${escapeHtml(pr.id)}">
        <span class="ci-pair-em">${pr.emoji}</span>
        <span class="ci-pair-txt"><strong>${escapeHtml(pr.name)}</strong><span class="ci-pair-blurb">${escapeHtml(pr.blurb)}</span></span>
      </button>`
    )
    .join('');

  const fav = data.favouredBy.map(f => `<span class="ci-fav">🟢 ${f.icon} ${escapeHtml(f.label)}</span>`).join('<br>');
  const hunt = data.huntedBy
    .map(h =>
      h.type === 'faction'
        ? `<span class="ci-hunt">🔴 ${h.icon || '⚔️'} ${escapeHtml(h.label)}</span>`
        : `<span class="ci-hunt">🔴 ${escapeHtml(h.label)}</span>`
    )
    .join('<br>');

  body.innerHTML = `
    <div class="ci-header">
      <span class="ci-emoji" aria-hidden="true">${data.emoji}</span>
      <div>
        <div class="ci-name">${escapeHtml(data.name)}</div>
        <div class="ci-tier">${escapeHtml(data.tierLabel)}</div>
      </div>
    </div>
    <div class="ci-stats-block">${statRows}</div>
    <div class="ci-section"><div class="ci-sec-hdr">Strong areas</div><div class="ci-pill-row">${strengths}</div></div>
    <div class="ci-section"><div class="ci-sec-hdr">Best pairings</div><div class="ci-pair-list">${pairings}</div></div>
    <div class="ci-section"><div class="ci-sec-hdr">Favoured by</div><div class="ci-fav-hunt">${fav}</div></div>
    <div class="ci-section"><div class="ci-sec-hdr">Hunted by</div><div class="ci-fav-hunt">${hunt}</div></div>
    <div class="ci-section ci-fun"><div class="ci-sec-hdr">Fun fact</div><p>${escapeHtml(data.funFact)}</p></div>
    <div class="ci-actions">
      <button type="button" class="btn btn-secondary btn-sm ci-use-hybrid-btn">Use in Hybrid</button>
    </div>`;

  body.querySelectorAll('[data-intel-pair-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      const oid = btn.getAttribute('data-intel-pair-id');
      if (oid) openCreatureIntel(oid, { returnScreen: _returnScreen });
    });
  });
  const useBtn = body.querySelector('.ci-use-hybrid-btn');
  if (useBtn) {
    useBtn.addEventListener('click', () => {
      if (typeof window.creatureIntelUseInHybrid === 'function') window.creatureIntelUseInHybrid(id);
    });
  }
}

export function openCreatureIntel(id, opts = {}) {
  _returnScreen = opts.returnScreen || 'hub';
  const o = document.getElementById('creature-intel-overlay');
  if (!o) return;
  renderCreatureIntel(id);
  o.classList.remove('hidden');
  o.setAttribute('aria-hidden', 'false');
}

export function closeCreatureIntel() {
  const o = document.getElementById('creature-intel-overlay');
  if (!o) return;
  o.classList.add('hidden');
  o.setAttribute('aria-hidden', 'true');
}
