/**
 * Arena definitions: visual themes, stat modifiers, and display metadata.
 * Each arena has a CSS class, a stat boost map, and a banner message.
 */

export const ARENAS = {
  ocean: {
    id: 'ocean',
    name: 'Ocean Arena',
    emoji: '🌊',
    banner: '🌊 Ocean Arena boosts Agility!',
    statMods: { spd: 0, agi: 1, int: 0, str: -1 },
    cssClass: 'arena-ocean',
  },
  jungle: {
    id: 'jungle',
    name: 'Jungle Arena',
    emoji: '🌿',
    banner: '🌿 Jungle Arena boosts Agility & Intelligence!',
    statMods: { spd: 0, agi: 1, int: 1, str: 0 },
    cssClass: 'arena-jungle',
  },
  sky: {
    id: 'sky',
    name: 'Sky Arena',
    emoji: '☁️',
    banner: '☁️ Sky Arena boosts Speed!',
    statMods: { spd: 1, agi: 0, int: 0, str: 0 },
    cssClass: 'arena-sky',
  },
  volcanic: {
    id: 'volcanic',
    name: 'Volcanic Arena',
    emoji: '🌋',
    banner: '🌋 Volcanic Arena boosts Strength!',
    statMods: { spd: 0, agi: 0, int: 0, str: 1 },
    cssClass: 'arena-volcanic',
  },
  underworld: {
    id: 'underworld',
    name: 'Underworld Arena',
    emoji: '💀',
    banner: '💀 Underworld Arena boosts Power!',
    statMods: { spd: 0, agi: 0, int: 0, str: 1 },
    cssClass: 'arena-underworld',
  },
  celestial: {
    id: 'celestial',
    name: 'Celestial Arena',
    emoji: '✨',
    banner: '✨ Celestial Arena boosts Intelligence & Speed!',
    statMods: { spd: 1, agi: 0, int: 1, str: 0 },
    cssClass: 'arena-celestial',
  },
  desert: {
    id: 'desert',
    name: 'Desert Arena',
    emoji: '🏜️',
    banner: '🏜️ Desert heat favors mind & reflexes — speed softens slightly.',
    statMods: { spd: -1, agi: 1, int: 1, str: 0 },
    cssClass: 'arena-desert',
  },
  castle: {
    id: 'castle',
    name: 'Castle Arena',
    emoji: '🏰',
    banner: '🏰 Castle Arena favours strength and defence!',
    statMods: { spd: -1, agi: 0, int: 0, str: 1 },
    cssClass: 'arena-castle',
  },
};

export function getArena(arenaId) {
  return ARENAS[arenaId] || ARENAS.ocean;
}
