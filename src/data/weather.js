/**
 * Dynamic weather system.
 * Weather is an optional overlay that stacks on top of arenas.
 * ~30% chance of weather per non-boss battle; bosses never get weather.
 */

export const WEATHER_TYPES = {
  rain: {
    id: 'rain',
    name: 'Rain',
    emoji: '🌧',
    banner: '🌧 Rain reduces strength but boosts agility!',
    statMods: { spd: 0, agi: 1, int: 0, str: -1 },
    cssClass: 'weather-rain',
  },
  storm: {
    id: 'storm',
    name: 'Storm',
    emoji: '⛈',
    banner: '⛈ Storm surges boost speed — expect surprises!',
    statMods: { spd: 1, agi: 0, int: 0, str: 0 },
    cssClass: 'weather-storm',
    roundSwingChance: 0.15,
  },
  fog: {
    id: 'fog',
    name: 'Fog',
    emoji: '🌫',
    banner: '🌫 Fog rolls in — intelligence rises, clarity fades!',
    statMods: { spd: 0, agi: 0, int: 1, str: 0 },
    cssClass: 'weather-fog',
  },
  heatwave: {
    id: 'heatwave',
    name: 'Heatwave',
    emoji: '🔥',
    banner: '🔥 Heatwave! Strength surges but agility drops!',
    statMods: { spd: 0, agi: -1, int: 0, str: 1 },
    cssClass: 'weather-heatwave',
  },
  wind: {
    id: 'wind',
    name: 'Wind',
    emoji: '💨',
    banner: '💨 Strong winds boost speed and agility!',
    statMods: { spd: 1, agi: 1, int: 0, str: 0 },
    cssClass: 'weather-wind',
  },
};

const WEATHER_POOL = Object.keys(WEATHER_TYPES);
const WEATHER_CHANCE = 0.30;

export function rollWeather(isBoss) {
  if (isBoss) return null;
  if (Math.random() > WEATHER_CHANCE) return null;
  const id = WEATHER_POOL[Math.floor(Math.random() * WEATHER_POOL.length)];
  return WEATHER_TYPES[id];
}

export function getWeather(weatherId) {
  return WEATHER_TYPES[weatherId] || null;
}
