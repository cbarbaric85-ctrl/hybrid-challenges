import { getCreatureIntel } from '../data/creature-intel.js';
import { state } from '../game/state.js';
import { escapeHtml } from './screens.js';
import { creaturePortraitImgHtml, factionCrestImgHtml } from './asset-utils.js';

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

  if (data.error) {
    title.textContent = 'Creature intel';
    body.innerHTML = '<p class="ci-teaser">Creature data not found.</p>';
    return;
  }

  title.textContent = data.name;

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
        <span class="ci-pair-em">${creaturePortraitImgHtml(pr.id, pr.emoji, { className: 'ci-pair-em-img', size: 28, loading: 'lazy' })}</span>
        <span class="ci-pair-txt"><strong>${escapeHtml(pr.name)}</strong><span class="ci-pair-blurb">${escapeHtml(pr.blurb)}</span></span>
      </button>`
    )
    .join('');

  const fav = data.favouredBy
    .map(
      f =>
        `<span class="ci-fav">🟢 ${factionCrestImgHtml(f.id, f.icon, { className: 'ci-fav-crest', size: 22 })} <span class="ci-fav-lbl">${escapeHtml(f.label)}</span></span>`
    )
    .join('<br>');
  const hunt = data.huntedBy
    .map(h => {
      if (h.type === 'faction') {
        return `<span class="ci-hunt">🔴 ${factionCrestImgHtml(h.id, h.icon || '⚔️', { className: 'ci-hunt-crest', size: 22 })} <span class="ci-hunt-lbl">${escapeHtml(h.label)}</span></span>`;
      }
      if (h.type === 'creature' && h.id) {
        return `<span class="ci-hunt">🔴 ${creaturePortraitImgHtml(h.id, h.emoji, { className: 'ci-hunt-em', size: 22, loading: 'lazy' })} <span class="ci-hunt-lbl">${escapeHtml(h.name)}</span></span>`;
      }
      return `<span class="ci-hunt">🔴 ${escapeHtml(h.label)}</span>`;
    })
    .join('<br>');

  const fusionNote = data.unlockedForFusion
    ? ''
    : '<p class="ci-fusion-note">Not unlocked for fusion yet — you can still browse full intel below.</p>';

  const useFusionDisabled = data.unlockedForFusion ? '' : ' disabled';

  body.innerHTML = `
    <div class="ci-header">
      <span class="ci-emoji" aria-hidden="true">${creaturePortraitImgHtml(id, data.emoji, { className: 'ci-header-portrait', size: 52, loading: 'eager' })}</span>
      <div>
        <div class="ci-name">${escapeHtml(data.name)}</div>
        <div class="ci-tier">${escapeHtml(data.tierLabel)}</div>
      </div>
    </div>
    ${fusionNote}
    <div class="ci-stats-block">${statRows}</div>
    <div class="ci-section"><div class="ci-sec-hdr">Strong areas</div><div class="ci-pill-row">${strengths}</div></div>
    <div class="ci-section"><div class="ci-sec-hdr">Best pairings</div><div class="ci-pair-list">${pairings}</div></div>
    <div class="ci-section"><div class="ci-sec-hdr">Favoured by</div><div class="ci-fav-hunt">${fav}</div></div>
    <div class="ci-section"><div class="ci-sec-hdr">Hunted by</div><div class="ci-fav-hunt">${hunt}</div></div>
    <div class="ci-section ci-fun"><div class="ci-sec-hdr">Fun fact</div><p>${escapeHtml(data.funFact)}</p></div>
    <div class="ci-actions-row">
      <button type="button" class="btn btn-secondary btn-sm ci-use-fusion-btn"${useFusionDisabled}>Use in fusion</button>
      <button type="button" class="btn btn-secondary btn-sm ci-return-animals-btn">Return to animals</button>
    </div>`;

  body.querySelectorAll('[data-intel-pair-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      const oid = btn.getAttribute('data-intel-pair-id');
      if (oid) openCreatureIntel(oid, { returnScreen: _returnScreen });
    });
  });

  const useFusionBtn = body.querySelector('.ci-use-fusion-btn');
  if (useFusionBtn && data.unlockedForFusion) {
    useFusionBtn.addEventListener('click', () => {
      if (typeof window.creatureIntelUseInHybrid === 'function') window.creatureIntelUseInHybrid(id);
    });
  }

  const retBtn = body.querySelector('.ci-return-animals-btn');
  if (retBtn) {
    retBtn.addEventListener('click', () => {
      if (typeof window.creatureIntelReturnToAnimals === 'function') window.creatureIntelReturnToAnimals();
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

export function getLastCreatureIntelReturnScreen() {
  return _returnScreen;
}
