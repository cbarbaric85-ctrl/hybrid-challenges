/**
 * Creature intel: derived from ANIMALS stats + stage; optional overrides per id.
 * No duplicate stat numbers — strengths/pairings computed; factions themed narratively.
 */

import {
  ANIMALS, STAT_MAX, STAGE_BASE, STAGE_APEX, STAGE_DINO, STAGE_LEGENDARY, STAGE_MYTHICAL, STAGE_EGYPTIAN, STAGE_KNIGHTS,
} from './animals.js';
import { FACTION_EGYPTIAN, FACTION_VIKING, FACTION_KNIGHTS, FACTIONS } from './factions.js';
import { getAvailableAnimals } from '../game/progression.js';
import { STAT_LABELS_SIMPLE } from '../game/battle.js';

const STAT_KEYS = ['spd', 'agi', 'int', 'str'];

/** @type {Record<string, Partial<{ funFact: string; favouredFactionIds: string[]; huntedFactionIds: string[]; huntedCreatureIds: string[] }>>} */
export const INTEL_OVERRIDES = {};

/**
 * Theme-based faction favour / hunt (not simulation).
 */
function defaultFactionsForStage(stage) {
  switch (stage) {
    case STAGE_BASE:
      return {
        favoured: [FACTION_VIKING],
        hunted: [FACTION_KNIGHTS],
      };
    case STAGE_APEX:
      return {
        favoured: [FACTION_EGYPTIAN],
        hunted: [FACTION_VIKING],
      };
    case STAGE_DINO:
      return {
        favoured: [FACTION_VIKING],
        hunted: [FACTION_KNIGHTS],
      };
    case STAGE_LEGENDARY:
      return {
        favoured: [FACTION_EGYPTIAN],
        hunted: [FACTION_VIKING],
      };
    case STAGE_MYTHICAL:
      return {
        favoured: [FACTION_EGYPTIAN],
        hunted: [FACTION_KNIGHTS],
      };
    case STAGE_EGYPTIAN:
      return {
        favoured: [FACTION_EGYPTIAN],
        hunted: [FACTION_VIKING],
      };
    case STAGE_KNIGHTS:
      return {
        favoured: [FACTION_KNIGHTS],
        hunted: [FACTION_VIKING],
      };
    default:
      return {
        favoured: [FACTION_VIKING],
        hunted: [FACTION_KNIGHTS],
      };
  }
}

function weakestKeys(a, n) {
  return [...STAT_KEYS].sort((x, y) => a[x] - a[y]).slice(0, n);
}

function pairingScore(self, other) {
  const w = weakestKeys(self, 2);
  return w.reduce((sum, k) => sum + other[k], 0);
}

/**
 * Deterministic top pairings: complement low stats.
 * @param {string} id
 * @returns {string[]}
 */
function derivePairingIds(id) {
  const self = ANIMALS[id];
  if (!self) return [];
  const others = Object.keys(ANIMALS)
    .filter(oid => oid !== id)
    .map(oid => ({ oid, score: pairingScore(self, ANIMALS[oid]) }))
    .sort((a, b) => b.score - a.score || a.oid.localeCompare(b.oid));
  return others.slice(0, 3).map(o => o.oid);
}

/** Narrative counter: pick a creature with different dominant stat than self. */
function deriveHuntedCreatureIds(id) {
  const self = ANIMALS[id];
  if (!self) return [];
  const maxK = STAT_KEYS.reduce((m, k) => (self[k] > self[m] ? k : m), 'spd');
  const candidates = Object.keys(ANIMALS)
    .filter(oid => oid !== id)
    .map(oid => {
      const o = ANIMALS[oid];
      const om = STAT_KEYS.reduce((m, k) => (o[k] > o[m] ? k : m), 'spd');
      return { oid, diff: om === maxK ? 0 : 1, str: o.str + o.spd };
    })
    .filter(x => x.diff > 0)
    .sort((a, b) => b.str - a.str || a.oid.localeCompare(b.oid));
  const first = candidates[0]?.oid;
  const second = Object.keys(ANIMALS).find(oid => oid !== id && oid !== first) || null;
  return [first, second].filter(Boolean).slice(0, 2);
}

function oneSentence(bio) {
  if (!bio) return '';
  const t = bio.trim();
  const cut = t.split(/[.!?]/)[0];
  return cut.length > 120 ? `${cut.slice(0, 117)}…` : cut + (t.match(/[.!?]$/) ? '' : '.');
}

/**
 * @param {string} id
 * @param {{ progress: object }} ctx
 */
export function getCreatureIntel(id, ctx) {
  const a = ANIMALS[id];
  const p = ctx?.progress;
  if (!a || !p) {
    return { error: true, name: 'Unknown', emoji: '❓' };
  }

  const available = getAvailableAnimals(p);
  /** True when this animal can be selected in the Forge for fusion. */
  const unlockedForFusion = available.includes(id);
  const ov = INTEL_OVERRIDES[id] || {};

  const stats = { spd: a.spd, agi: a.agi, int: a.int, str: a.str };
  const sorted = [...STAT_KEYS].sort((x, y) => stats[y] - stats[x]);
  const strengths = sorted.slice(0, 2).map(k => ({
    key: k,
    label: STAT_LABELS_SIMPLE[k],
    value: stats[k],
  }));

  const stageDef = defaultFactionsForStage(a.stage);
  const favIds = ov.favouredFactionIds || stageDef.favoured;
  const huntFIds = ov.huntedFactionIds || stageDef.hunted;
  const favouredBy = favIds.map(fid => ({
    id: fid,
    label: FACTIONS[fid]?.name || fid,
    icon: FACTIONS[fid]?.icon || '🏷️',
  }));
  const huntedByFactions = huntFIds.map(fid => ({
    type: 'faction',
    id: fid,
    label: FACTIONS[fid]?.name || fid,
    icon: FACTIONS[fid]?.icon || '🏷️',
  }));

  const huntedCreatures = (ov.huntedCreatureIds || deriveHuntedCreatureIds(id)).map(oid => {
    const o = ANIMALS[oid];
    return o
      ? { type: 'creature', id: oid, name: o.name, emoji: o.emoji, label: `${o.emoji} ${o.name}` }
      : null;
  }).filter(Boolean);

  const huntedBy = [...huntedByFactions, ...huntedCreatures];

  const pairingIds = derivePairingIds(id);
  const pairings = pairingIds.map(oid => {
    const o = ANIMALS[oid];
    return { id: oid, name: o.name, emoji: o.emoji, blurb: `Boosts your ${weakestKeys(a, 2).map(k => STAT_LABELS_SIMPLE[k]).join(' & ')}` };
  });

  const tierLabel =
    a.stage === STAGE_BASE ? 'Base'
      : a.stage === STAGE_APEX ? 'Apex Predator'
        : a.stage === STAGE_DINO ? 'Dinosaur'
          : a.stage === STAGE_LEGENDARY ? 'Legendary Beast'
            : a.stage === STAGE_MYTHICAL ? 'Mythical God'
              : a.stage === STAGE_EGYPTIAN ? 'Egyptian Guardian'
                : a.stage === STAGE_KNIGHTS ? 'Knight' : 'Creature';

  const funFact = ov.funFact || oneSentence(a.bio);

  return {
    id,
    unlockedForFusion,
    name: a.name,
    emoji: a.emoji,
    tierLabel,
    stats,
    statMax: STAT_MAX,
    strengths,
    pairings,
    favouredBy,
    huntedBy,
    funFact,
  };
}
