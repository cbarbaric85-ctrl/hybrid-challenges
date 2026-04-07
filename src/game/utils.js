/** Local calendar date YYYY-MM-DD — daily streak, challenges, and rollover. */
export function localDateString(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function localYesterdayString() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return localDateString(d);
}

export const EMPTY_STAT_BOOST = () => ({ spd: 0, agi: 0, int: 0, str: 0 });
