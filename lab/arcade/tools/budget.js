#!/usr/bin/env node
'use strict';
// tools/budget.js — THE GRAPHICS-MEMORY PROJECTION (owner rulings 2026-11-04).   node lab/arcade/tools/budget.js
// Ruling 1 (second set): GPU-compressed textures (KTX2 / Basis) for the fighter pages and the arena, idle at 8 fps, hold cells trimmed,
// a half-size Vajra on lo. Re-run the projection and report each lever's saving; ONLY IF the 15-move projection then fits BOTH caps
// with margin (MARGIN: at most 75% of the cap) may the 24 fps strike frames come back; otherwise 12 fps stays.
//
// The model — every input named, measured where it can be:
//   · INDRA: his full cut, MEASURED (fighters/indra/manifest.json v2): every page's size → GPU bytes. A compressed page costs 1 byte a
//     pixel on the GPU (ASTC 4×4, BC7, ETC2 RGBA and BC3 are all 8 bits a pixel); the WebP fallback 4. The throw borrows (no cells yet).
//   · MEGHNAD: his full cut (2026-11-05), MEASURED like Indra's. (Before it, his placeholder sheets were projected as Indra's cell count ×
//     Meghnad's own bytes per cell; the projection still falls back to that while his manifest is a placeholder — under 100 cells.)
//   · THE ARENA: the docs' four layers (hi: sky 2048×1024, palace 2560×1024, ground and foreground 2560×512; lo: half each side), not
//     built yet — compressed (1 byte a pixel) as ruled.
//   · THE EFFECTS: the Kling effect layer (2026-11-05: effects/fx_<name>/, the four clips packed like a fighter — KTX2, 1 byte a pixel;
//     4 on the WebP fallback). Without it, the old Vajra atlas (WebP, 4 bytes a pixel; lo the half-size copy).
//   · STRIKE FRAMES: 24 fps from 5 frames before the first active frame to 5 after the last, on light / heavy / special: +8 cells.
const fs = require('fs'), path = require('path');
const LAB = path.resolve(__dirname, '..');
const M = require(path.join(LAB, 'core/moves.js'));
const MB = 1048576;
const CAP = { lo: 48, hi: 96 }, MARGIN = 0.75, DL_CAP = { lo: 0.7, hi: 4.25 };   // hi 1.6 → 4.25 MB (owner rulings, the clarity pass)
// THE FIRST-MATCH DOWNLOAD (owner ruling 2 on cb69cdb; it replaces the six-fighter line): a match loads only its two Heroes, the arena and
// the effects those two use (ui/assets.js). Worst case: the two heaviest fighters + their effects + the arena. The arena is not built yet:
// its budget target is used (docs/ARCADE_v1.md: 0.6 MB hi / 0.3 MB lo, cap 0.9). Later matches reuse what is loaded / the browser cache.
const FIRST_MATCH_CAP = { hi: 12, lo: 2.5 }, ARENA_DL = { hi: 0.6, lo: 0.3 }, ARENA_DL_CAP = 0.9;
const AS = require(path.join(LAB, 'ui/assets.js'));
function effectDl(n, rung) {   // MB: KTX2 (the GPU path) and WebP (the fallback) for one effect, or null if not built
  try { const R = JSON.parse(fs.readFileSync(path.join(LAB, 'effects', 'fx_' + n, 'manifest.json'), 'utf8')).rungs[rung];
    return { ktx2: R.pages.reduce((a, p) => a + p.bytes.ktx2, 0) / MB, webp: R.pages.reduce((a, p) => a + p.bytes.webp, 0) / MB }; } catch (e) { return null; }
}
function firstMatch(rung, stats) {   // stats: fighter id → sheetStats; the worst pair = the two heaviest distinct fighters
  const ids = Object.keys(stats).sort((a, b) => stats[b].ktx2 - stats[a].ktx2).slice(0, 2);
  const heroes = Object.keys(M.HEROES).filter((h) => ids.includes(M.HEROES[h].fighter));
  const P = AS.plan(heroes, M.HEROES), fx = P.effects.map((n) => [n, effectDl(n, rung)]);
  const fighters = ids.reduce((a, id) => a + stats[id].ktx2, 0), effects = fx.reduce((a, [, d]) => a + (d ? d.ktx2 : 0), 0);
  const total = fighters + effects + ARENA_DL[rung];
  return { pair: ids, effectsList: P.effects, fighters, effects, arena: ARENA_DL[rung], total, cap: FIRST_MATCH_CAP[rung], fits: total <= FIRST_MATCH_CAP[rung],
    totalArenaAtCap: fighters + effects + ARENA_DL_CAP, perEffect: Object.fromEntries(fx.map(([n, d]) => [n, d])) };
}
const FXN = ['vajra_bolt', 'vajra_impact', 'nagapasha_flight', 'nagapasha_bind'];
function klingStats(rung) {   // the four effect sheets on this rung, or null when they are not built
  try {
    let px = 0, kt = 0, wp = 0;
    for (const n of FXN) { const R = JSON.parse(fs.readFileSync(path.join(LAB, 'effects', 'fx_' + n, 'manifest.json'), 'utf8')).rungs[rung];
      R.pages.forEach((p) => { px += p.size[0] * p.size[1]; kt += p.bytes.ktx2; wp += p.bytes.webp; }); }
    return { gpu: px / MB, rgba: 4 * px / MB, ktx2: kt / MB, webp: wp / MB };
  } catch (e) { return null; }
}
const STRIKE = { before: 5, after: 5 };
const ARENA = { hi: [[2048, 1024], [2560, 1024], [2560, 512], [2560, 512]] };
ARENA.lo = ARENA.hi.map(([w, h]) => [w / 2, h / 2]);
const man = (h) => JSON.parse(fs.readFileSync(path.join(LAB, 'fighters', h, 'manifest.json'), 'utf8'));
// the page's uncompressed fallback (ruling 6, third set), read from ui/app.js so the two never drift: the lo pages resized by `scale`
function fallbackSpec() {
  const m = /const FALLBACK = \{ rung: "(lo|hi)", scale: ([0-9.]+) \};/.exec(fs.readFileSync(path.join(LAB, 'ui/app.js'), 'utf8'));
  return m ? { rung: m[1], scale: +m[2] } : null;
}

function strikeExtra() {
  let n = 0; const per = {};
  for (const k of ['light', 'heavy', 'special']) {
    const m = M.MOVES[k], w = Math.min(m.startup, STRIKE.before) + m.active + Math.min(m.recovery, STRIKE.after);
    per[k] = Math.round(w * 24 / 60) - Math.round(w * 12 / 60); n += per[k];
  }
  return { n, per };
}
function sheetStats(F, rung) {
  const R = F.rungs[rung], area = R.pages.reduce((a, p) => a + p.size[0] * p.size[1], 0), cells = R.cells.length;
  return { cells, pages: R.pages.length, area, gpu: area / MB, rgba: 4 * area / MB, perCellGpu: area / cells / MB,
    ktx2: R.pages.reduce((a, p) => a + p.bytes.ktx2, 0) / MB, webp: R.pages.reduce((a, p) => a + p.bytes.webp, 0) / MB, enc: R.encoding && R.encoding.chosen };
}
// the cells the two cell-count levers saved (from Indra's own anim lists: a repeated entry is a trimmed hold; the idle at 12 fps would be loopFrames / 2)
function cellLevers(F) {
  const A = F.anim, uniq = (L) => new Set(L).size;
  const idle12 = Math.ceil(F.moves.idle.loopFrames / 2), idleNow = uniq(A.idle.loop), idleSampled = A.idle.loop.length;
  let sampled = 0, kept = 0;
  for (const k of ['jump', 'hitLight', 'hitHeavy', 'knockdown', 'getup', 'parry']) if (A[k]) { sampled += A[k].span.length; kept += uniq(A[k].span); }
  for (const k of ['crouch', 'block', 'win']) if (A[k]) { const fwd = (A[k].hold.length + 2) / 2; sampled += A[k].enter.length + fwd; kept += uniq(A[k].enter.concat(A[k].hold)); }
  if (F.moves.ko) { sampled += A.ko.span.length + F.moves.ko.lie.length; kept += uniq(A.ko.span.concat(A.ko.hold)); }
  return { idle8: { cells12: idle12, cells8: idleSampled, saved: idle12 - idleSampled }, idleTrim: idleSampled - idleNow, holdTrim: { sampled, kept, saved: sampled - kept } };
}
function project(caps) {
  caps = caps || CAP;
  const I = man('indra'), G = man('meghnad'), sx = strikeExtra(), lv = cellLevers(I), out = { strike: sx, levers: {}, rungs: {} };
  const vj = JSON.parse(fs.readFileSync(path.join(LAB, 'effects/vajra/manifest.json'), 'utf8')), vjLo = JSON.parse(fs.readFileSync(path.join(LAB, 'effects/vajra/lo/manifest.json'), 'utf8'));
  for (const rung of ['lo', 'hi']) {
    const i = sheetStats(I, rung), g = sheetStats(G, rung), cap = caps[rung];
    const megFull = G.cellsSrc.length >= 100;
    const megWorst = megFull ? g.gpu : i.cells * g.perCellGpu, megLikeIndra = megFull ? g.gpu : i.gpu;
    const arenaGpu = ARENA[rung].reduce((a, [w, h]) => a + w * h, 0) / MB;
    const kl = klingStats(rung);
    const fx = kl ? kl.gpu : (rung === 'lo' ? vjLo.atlasSize.w * vjLo.atlasSize.h : vj.atlasSize.w * vj.atlasSize.h) * 4 / MB;
    const fxFull = vj.atlasSize.w * vj.atlasSize.h * 4 / MB;
    // THE PAIR: the two fighters on screen. With both measured, the worst case is the HEAVIER one twice (a mirror match) — Indra today
    const pair = megFull ? 2 * Math.max(i.gpu, megWorst) : i.gpu + megWorst;
    const total = pair + arenaGpu + fx, totalLike = i.gpu + megLikeIndra + arenaGpu + fx;
    // once the sheets carry the strike frames (manifest strike24), they are already in the measured cells: count only Meghnad's missing ones
    const strike = I.strike24 ? sx.n * g.perCellGpu * (G.strike24 ? 0 : 1) : sx.n * (i.perCellGpu + g.perCellGpu);
    // THE LEVERS, each one's saving on this rung (2 fighters at the worst-case Meghnad, so each is counted on both)
    const both = i.perCellGpu + g.perCellGpu;
    const lev = {
      compressed: 3 * (pair + arenaGpu),                  // RGBA (4 B/px) → compressed (1 B/px), fighters + arena
      idle8: lv.idle8.saved * both,
      holdTrim: (lv.holdTrim.saved + lv.idleTrim) * both,
      vajraHalf: rung === 'lo' && !kl ? fxFull - fx : 0
    };
    const before = total + lev.compressed + lev.idle8 + lev.holdTrim + lev.vajraHalf;
    out.rungs[rung] = { cap, pair, indra: i, meghnadNow: g, meghnadWorst: megWorst, meghnadLikeIndra: megLikeIndra, arena: arenaGpu, effects: fx, kling: kl, effectsFallback: kl ? kl.rgba : fx,
      total15: total, total15LikeIndra: totalLike, totalWithoutLevers: before, levers: lev, strike, total15Strike: total + strike,
      fits: total <= cap, fitsWithMargin: total <= cap * MARGIN, strikeFitsWithMargin: total + strike <= cap * MARGIN,
      // the WebP fallback (a GPU with no compressed format, or the Canvas 2D floor): fighters at 4 bytes a pixel
      fallbackTotal: 4 * pair + 4 * arenaGpu + (kl ? kl.rgba : fx),
      download: { indraKtx2: i.ktx2, indraWebp: i.webp, meghnadKtx2: g.ktx2, meghnadWebp: g.webp, meghnadMeasured: megFull, capPerFighter: DL_CAP[rung], encoding: i.enc },
      firstMatch: firstMatch(rung, { indra: i, meghnad: g }) };
  }
  out.cellLevers = lv; out.strikeShipped = !!I.strike24;
  // THE FALLBACK (no compressed format): the lo pages at `scale`, 4 bytes a pixel, + the arena at lo as RGBA + the half-size Vajra
  const fb = fallbackSpec(), lo = out.rungs.lo, s2 = fb ? fb.scale * fb.scale : 1;
  // the Kling effects are resized by the same scale on the fallback (ui/app.js); the old Vajra atlas was not
  const fbFx = lo.kling ? lo.effectsFallback * s2 : lo.effectsFallback;
  out.fallback = fb && { spec: fb, fighters: 4 * lo.pair * s2, fightersLikeIndra: 4 * 2 * lo.indra.gpu * s2, arena: 4 * lo.arena, effects: fbFx,
    total: 4 * lo.pair * s2 + 4 * lo.arena + fbFx, cap: caps.lo, unscaled: 4 * lo.pair + 4 * lo.arena + lo.effectsFallback };
  if (out.fallback) out.fallback.fits = out.fallback.total <= caps.lo;
  // THE DECISION (ruling 1): strike frames only if the 15-move projection fits BOTH caps with margin (with the strike frames added)
  out.strike24 = out.rungs.lo.strikeFitsWithMargin && out.rungs.hi.strikeFitsWithMargin;
  return out;
}
module.exports = { project, strikeExtra, CAP, MARGIN, STRIKE };

if (require.main === module) {
  const P = project(), f = (x) => x.toFixed(1);
  const L = P.cellLevers;
  process.stdout.write('cell levers (Indra, measured): idle at 8 fps ' + L.idle8.cells8 + ' cells instead of ' + L.idle8.cells12 + ' (−' + L.idle8.saved + '); hold trim ' + L.holdTrim.sampled + ' sampled → ' + L.holdTrim.kept + ' kept (−' + L.holdTrim.saved + ', idle −' + L.idleTrim + ')\n');
  process.stdout.write('strike frames at 24 fps: +' + P.strike.n + ' cells per fighter (' + Object.entries(P.strike.per).map(([k, v]) => k + ' +' + v).join(', ') + ')\n');
  for (const r of ['lo', 'hi']) {
    const R = P.rungs[r];
    process.stdout.write('\n' + r + ' (cap ' + R.cap + ' MB, margin ≤ ' + f(R.cap * MARGIN) + '):' +
      '\n  Indra, full cut: ' + R.indra.cells + ' cells, ' + R.indra.pages + ' page(s), GPU ' + f(R.indra.gpu) + ' MB compressed (' + f(R.indra.rgba) + ' as RGBA)' +
      (R.download.meghnadMeasured ? '\n  Meghnad, full cut: ' + R.meghnadNow.cells + ' cells, ' + R.meghnadNow.pages + ' page(s), GPU ' + f(R.meghnadNow.gpu) + ' MB compressed (' + f(R.meghnadNow.rgba) + ' as RGBA)'
        : '\n  Meghnad, full set projected: ' + f(R.meghnadWorst) + ' MB (today\'s spear-out density) · ' + f(R.meghnadLikeIndra) + ' MB (reshoot packs like Indra)') +
      '\n  arena ' + f(R.arena) + ' MB compressed · ' + (R.kling ? 'effects (the four Kling clips) ' + f(R.effects) + ' MB compressed, download ' + f(R.kling.ktx2 * 1024) + ' KB KTX2 (WebP ' + f(R.kling.webp * 1024) + ' KB)' : 'Vajra ' + f(R.effects) + ' MB') +
      '\n  TOTAL, 15 moves at 12 fps (2 fighters: ' + (R.download.meghnadMeasured ? 'the heavier twice, a mirror' : 'Indra + Meghnad') + ', + arena + effects): ' + f(R.total15) + ' MB' + (R.download.meghnadMeasured ? '' : ' (' + f(R.total15LikeIndra) + ' if Meghnad packs like Indra)') + ' — ' + (R.fitsWithMargin ? 'fits with margin' : R.fits ? 'fits, no margin' : 'OVER') +
      '\n  without the levers it would be ' + f(R.totalWithoutLevers) + ' MB; savings: compressed textures −' + f(R.levers.compressed) + ', idle 8 fps −' + f(R.levers.idle8) + ', hold trim −' + f(R.levers.holdTrim) + ', half-size Vajra −' + f(R.levers.vajraHalf) +
      '\n  + 24 fps strike frames: ' + f(R.total15Strike) + ' MB — ' + (R.strikeFitsWithMargin ? 'fits with margin' : 'no') +
      '\n  the WebP fallback (no compressed format): ' + f(R.fallbackTotal) + ' MB' +
      '\n  download: Indra ' + R.download.encoding + ' ' + f(R.download.indraKtx2 * 1024) + ' KB (WebP ' + f(R.download.indraWebp * 1024) + ' KB), Meghnad ' + f(R.download.meghnadKtx2 * 1024) + ' KB (WebP ' + f(R.download.meghnadWebp * 1024) + ' KB) vs ' + f(R.download.capPerFighter * 1024) + ' KB a fighter' +
      '\n  FIRST MATCH (worst: ' + R.firstMatch.pair.join(' + ') + ', their effects, the arena): fighters ' + f(R.firstMatch.fighters) + ' + effects ' + f(R.firstMatch.effects) + ' + arena ' + f(R.firstMatch.arena) + ' (its target) = ' + f(R.firstMatch.total) + ' MB of ' + R.firstMatch.cap + ' — ' + (R.firstMatch.fits ? 'fits' : 'OVER') + ' (with the arena at its 0.9 cap: ' + f(R.firstMatch.totalArenaAtCap) + ')\n');
  }
  if (P.fallback) process.stdout.write('\nTHE FALLBACK (no compressed format, ruling 6): the ' + P.fallback.spec.rung + ' pages at ×' + P.fallback.spec.scale + ' (stance ' + Math.round(192 * P.fallback.spec.scale) + ' px) → fighters ' + f(P.fallback.fighters) + ' MB (the heavier fighter twice) + arena ' + f(P.fallback.arena) + ' + effects ' + f(P.fallback.effects) + ' = ' + f(P.fallback.total) + ' MB of the lo cap ' + P.fallback.cap + ' — ' + (P.fallback.fits ? 'fits' : 'OVER') + ' (unscaled it would be ' + f(P.fallback.unscaled) + ')\n');
  process.stdout.write('\nTHE DECISION (ruling 1): 24 fps strike frames ' + (P.strike24 ? 'YES — the 15-move projection fits both caps with margin' : 'NO — 12 fps stays') + (P.strikeShipped ? ' (the sheets carry them: measured above)' : '') + '\n');
}
