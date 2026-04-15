/**
 * Writes public/icon-gallery.html — static grid of all creature, locked, and faction character SVGs.
 * Run: npm run icons:gallery
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ALL_ANIMALS, TIER_REGISTRY } from '../src/data/animals.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const outPath = path.join(root, 'public', 'icon-gallery.html');

const FACTION_TIER_KEY_TO_SLUG = {
  egyptian: 'egyptians',
  knights: 'knights',
  roman_empire: 'romans',
  anglo_saxons: 'anglo_saxons',
  samurai_order: 'samurai',
  viking_clans: 'vikings',
};

const FACTION_ID_TO_SLUG = {
  egyptian_guardians: 'egyptians',
  viking_raiders: 'vikings',
  roman_empire: 'romans',
  anglo_saxons: 'anglo_saxons',
  samurai_order: 'samurai',
  knights: 'knights',
};

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function cell(src, label) {
  return `<div class="cell"><img src="${escapeHtml(src)}" width="64" height="64" alt="" loading="lazy" decoding="async"/><span class="lbl">${escapeHtml(label)}</span></div>`;
}

const ids = Object.keys(ALL_ANIMALS).sort();

const creatureCells = ids.map(id => cell(`/assets/creatures/${id}.svg`, id)).join('\n');
const lockedCells = ids.map(id => cell(`/assets/creatures/locked/${id}_locked.svg`, `${id} (locked)`)).join('\n');

const factionRows = [];
for (const [regKey, slug] of Object.entries(FACTION_TIER_KEY_TO_SLUG)) {
  const tier = TIER_REGISTRY[regKey];
  if (!tier?.animals) continue;
  const cids = Object.keys(tier.animals).sort();
  const cells = cids.map(cid => cell(`/assets/factions/${slug}/${cid}.svg`, `${slug}/${cid}`)).join('\n');
  factionRows.push(`<h2>Faction characters — ${escapeHtml(slug)}</h2><div class="grid">${cells}</div>`);
}

const crestCells = Object.entries(FACTION_ID_TO_SLUG)
  .map(([fid, slug]) => cell(`/assets/faction_crests/${slug}.svg`, `crest ${slug}`))
  .join('\n');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Hybrid Unite — icon gallery</title>
<style>
  *{box-sizing:border-box}
  body{font-family:system-ui,sans-serif;background:#0a1018;color:#c8dff5;padding:16px 20px 40px;max-width:1200px;margin:0 auto}
  h1{font-size:1.25rem;margin:0 0 8px}
  p.note{font-size:.85rem;color:#7a9ab8;margin:0 0 20px;line-height:1.45}
  h2{font-size:1rem;margin:28px 0 12px;color:#8ec8ff;border-bottom:1px solid #1c3a5c;padding-bottom:6px}
  .grid{display:flex;flex-wrap:wrap;gap:12px}
  .cell{display:flex;flex-direction:column;align-items:center;gap:4px;width:88px;text-align:center}
  .cell img{border-radius:6px;background:rgba(255,255,255,.06);object-fit:contain}
  .lbl{font-size:.62rem;word-break:break-word;line-height:1.2;color:#9ec0d8}
</style>
</head>
<body>
<h1>Icon gallery (creatures, locked, factions, crests)</h1>
<p class="note">Served from <code>/assets/...</code>. Open via dev server (<code>npm run dev</code>) at <code>/icon-gallery.html</code> or your production URL. Broken images mean the file is missing for that path.</p>
<h2>Creatures (unlocked)</h2>
<div class="grid">
${creatureCells}
</div>
<h2>Creatures (locked)</h2>
<div class="grid">
${lockedCells}
</div>
${factionRows.join('\n')}
<h2>Faction crests</h2>
<div class="grid">
${crestCells}
</div>
</body>
</html>
`;

fs.writeFileSync(outPath, html, 'utf8');
console.log('[icons:gallery] wrote', path.relative(root, outPath));
