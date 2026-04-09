import {
  STAGE_RANK,
  ANIMALS, ALL_ANIMALS, SYLLABLES,
} from '../data/animals.js';

function sanitizeHybridName(raw, fallback) {
  if (!raw || typeof raw !== 'string') return fallback || 'UNKNOWN';
  const s = raw.replace(/[^a-zA-Z0-9 \-']/g, '').trim().slice(0, 30);
  return s || fallback || 'UNKNOWN';
}

function hybridName(animalIds) {
  if (!animalIds || !animalIds.length) return 'UNKNOWN';
  return animalIds.map(id => SYLLABLES[id] || id.slice(0,3).toUpperCase()).join('') + '-X';
}

function powerScore(stats) {
  return stats.spd + stats.agi + stats.int + stats.str;
}

function hybridTierClass(selectedIds) {
  const ranks = selectedIds.map(id => STAGE_RANK[ANIMALS[id]?.stage] || 1);
  const maxR = Math.max(...ranks, 1);
  if (maxR >= 7) return 'knights';
  if (maxR >= 6) return 'egyptian';
  if (maxR >= 5) return 'mythical';
  if (maxR >= 4) return 'legendary';
  if (maxR >= 3) return 'dino';
  if (maxR >= 2) return 'apex';
  return 'base';
}

function hybridFromSaved(h) {
  if (!h || !h.animals?.length) return null;
  const auto = hybridName(h.animals);
  const nm = h.name != null && String(h.name).trim() ? String(h.name).trim() : auto;
  return {
    animals: h.animals,
    stats: h.stats,
    sources: h.sources || {},
    power: h.power,
    tierClass: h.tierClass || hybridTierClass(h.animals),
    name: sanitizeHybridName(nm, auto),
    emojis: h.emojis,
    composition: h.composition,
  };
}

function buildPlayerHybrid(selectedIds) {
  const animals = selectedIds.map(id => ALL_ANIMALS[id]);
  const stats = {};
  const sources = {};
  for (const stat of ['spd','agi','int','str']) {
    const src = animals[Math.floor(Math.random() * animals.length)];
    stats[stat] = src[stat];
    sources[stat] = src.name;
  }
  return {
    animals: selectedIds,
    stats,
    sources,
    power: powerScore(stats),
    tierClass: hybridTierClass(selectedIds),
    name: sanitizeHybridName(hybridName(selectedIds), hybridName(selectedIds)),
    emojis: selectedIds.map(id => ALL_ANIMALS[id].emoji).join(''),
    composition: selectedIds.map(id => ALL_ANIMALS[id].name).join(' · '),
  };
}

function buildEnemyHybrid(levelDef) {
  const components = levelDef.animals.map(id => ALL_ANIMALS[id]).filter(Boolean);
  const stats = {};
  for (const stat of ['spd','agi','int','str']) {
    const vals = components.map(a => a[stat]);
    stats[stat] = levelDef.useMax ? Math.max(...vals) : Math.round(vals.reduce((a,b)=>a+b,0)/vals.length);
  }
  return {
    animals: levelDef.animals,
    stats,
    power: powerScore(stats),
    name: levelDef.name.toUpperCase(),
    emojis: components.map(a => a.emoji).join(''),
    composition: components.map(a => a.name).join(' · '),
    diceBonus: levelDef.diceBonus || 0,
  };
}

export {
  hybridName,
  powerScore,
  hybridTierClass,
  hybridFromSaved,
  buildPlayerHybrid,
  buildEnemyHybrid,
};