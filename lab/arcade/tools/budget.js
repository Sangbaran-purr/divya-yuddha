#!/usr/bin/env node
'use strict';
// tools/budget.js — THE GRAPHICS-MEMORY PROJECTION (owner ruling 2, 2026-11-04).   node lab/arcade/tools/budget.js
// Ruling 2: 24 fps strike frames (real frames only) for light / heavy / special — their active frames and the frames around
// them — ONLY IF the full-moveset projection stays within the caps (2 fighters + arena + effects: lo ≤ 48 MB, hi ≤ 96 MB).
// If it does not fit on lo, lo stays 12 fps everywhere.
//
// The model, every input named:
//   · decoded memory per cell, per rung = (sheet page area × 4 bytes) / cells, MEASURED from fighters/<hero>/manifest.json
//     (the packing waste is included because a page is uploaded whole);
//   · cells per move: idle and light MEASURED (the real idle loop is 28–29 cells, not the template's 8); every other move from
//     the template (core/moves.js CELLS); walk back = 0 (walk forward reversed, the clip card's first choice);
//   · the 15-move set adds 10b knockdown + get-up, 13 parry and 14 throw (CELLS, ruling 5);
//   · strike frames: the window from STRIKE.before frames before the first active frame to STRIKE.after frames after the last,
//     at 24 instead of 12 fps → the extra cells per move;
//   · the arena: the docs' four layers (hi: sky 2048×1024, palace 2560×1024, ground and foreground 2560×512; lo: half each side);
//   · the effects: the Vajra atlas as shipped (effects/vajra/manifest.json), loaded at either rung today.
const fs = require('fs'), path = require('path');
const LAB = path.resolve(__dirname, '..');
const M = require(path.join(LAB, 'core/moves.js'));
const MB = 1048576;
const CAP = { lo: 48, hi: 96 };
const STRIKE = { before: 5, after: 5 };
const ARENA = { hi: [[2048, 1024], [2560, 1024], [2560, 512], [2560, 512]] };
ARENA.lo = ARENA.hi.map(([w, h]) => [w / 2, h / 2]);
const NEW_MOVES = ['knockdown', 'parry', 'throw'];

function strikeExtra() {   // extra cells per fighter for 24 fps on the strike windows of light, heavy, special
  let n = 0; const per = {};
  for (const k of ['light', 'heavy', 'special']) {
    const m = M.MOVES[k], w = Math.min(m.startup, STRIKE.before) + m.active + Math.min(m.recovery, STRIKE.after);
    per[k] = Math.round(w * 24 / 60) - Math.round(w * 12 / 60); n += per[k];
  }
  return { n, per };
}
function fighter(hero, rung) {
  const man = JSON.parse(fs.readFileSync(path.join(LAB, 'fighters', hero, 'manifest.json'), 'utf8')), R = man.rungs[rung];
  const pages = R.pages || [{ size: R.size }], area = pages.reduce((a, p) => a + p.size[0] * p.size[1], 0);
  const perCell = area * 4 / R.cells.length;
  const idle = man.cellIndex.idle.length, L = man.cellIndex.light, light = L.startup.length + L.active.length + L.recovery.length;
  const rest = Object.keys(M.CELLS).filter((k) => k !== 'idle' && k !== 'light' && k !== 'walkBack' && !NEW_MOVES.includes(k)).reduce((a, k) => a + M.CELLS[k], 0);
  const n12 = idle + light + rest, n15 = n12 + NEW_MOVES.reduce((a, k) => a + M.CELLS[k], 0);
  return { hero, rung, perCellMB: perCell / MB, idle, n12, n15, mem12: n12 * perCell / MB, mem15: n15 * perCell / MB };
}
function project(caps) {   // caps: { lo, hi } MB, default CAP (the suite's breakage passes others)
  caps = caps || CAP;
  const sx = strikeExtra(), out = { strike: sx, rungs: {} };
  const vj = JSON.parse(fs.readFileSync(path.join(LAB, 'effects/vajra/manifest.json'), 'utf8')), effects = vj.atlasSize.w * vj.atlasSize.h * 4 / MB;
  for (const rung of ['lo', 'hi']) {
    const f = ['indra', 'meghnad'].map((h) => fighter(h, rung));
    const arena = ARENA[rung].reduce((a, [w, h]) => a + w * h * 4, 0) / MB;
    const fighters12 = f[0].mem12 + f[1].mem12, fighters15 = f[0].mem15 + f[1].mem15, strike = sx.n * (f[0].perCellMB + f[1].perCellMB);
    const base15 = fighters15 + arena + effects, with24 = base15 + strike;
    // two levers, for the report: Meghnad's reshoot (spear upright) packing like Indra, and a half-size Vajra atlas on lo
    const lever = 2 * f[0].mem15 + arena + (rung === 'lo' ? effects / 4 : effects);
    const cap = caps[rung];
    out.rungs[rung] = { cap: cap, fighters: f, arena, effects, fighters12, fighters15, strike,
      total12: fighters12 + arena + effects, total15: base15, total15strike: with24,
      fits12: fighters12 + arena + effects <= cap, fits15: base15 <= cap, strikeFits: with24 <= cap,
      withLevers: lever, withLeversStrike: lever + sx.n * 2 * f[0].perCellMB };
  }
  out.strike24 = { lo: out.rungs.lo.strikeFits, hi: out.rungs.hi.strikeFits };   // THE DECISION (ruling 2)
  return out;
}
module.exports = { project, strikeExtra, CAP, STRIKE };

if (require.main === module) {
  const P = project(), f = (x) => x.toFixed(1);
  process.stdout.write('strike frames at 24 fps: +' + P.strike.n + ' cells per fighter (' + Object.entries(P.strike.per).map(([k, v]) => k + ' +' + v).join(', ') + ')\n');
  for (const r of ['lo', 'hi']) {
    const R = P.rungs[r];
    process.stdout.write('\n' + r + ' (cap ' + R.cap + ' MB):\n' + R.fighters.map((x) => '  ' + x.hero + ': ' + x.perCellMB.toFixed(3) + ' MB/cell, idle ' + x.idle + ' cells, 12 moves ' + x.n12 + ' cells = ' + f(x.mem12) + ' MB, 15 moves ' + x.n15 + ' = ' + f(x.mem15) + ' MB').join('\n') +
      '\n  arena ' + f(R.arena) + ' MB · effects (Vajra) ' + f(R.effects) + ' MB' +
      '\n  total, 12 moves at 12 fps: ' + f(R.total12) + (R.fits12 ? ' fits' : ' OVER') +
      '\n  total, 15 moves at 12 fps: ' + f(R.total15) + (R.fits15 ? ' fits' : ' OVER') +
      '\n  total, 15 moves + 24 fps strike frames: ' + f(R.total15strike) + (R.strikeFits ? ' fits' : ' OVER') +
      '\n  with both levers (Meghnad packs like Indra' + (r === 'lo' ? ', half-size Vajra atlas' : '') + '): ' + f(R.withLevers) + ' · + strike frames ' + f(R.withLeversStrike) + '\n');
  }
  process.stdout.write('\nTHE DECISION (ruling 2): 24 fps strike frames on lo ' + (P.strike24.lo ? 'YES' : 'NO — lo stays 12 fps everywhere') + ' · on hi ' + (P.strike24.hi ? 'YES' : 'NO — hi stays 12 fps everywhere') + '\n');
}
