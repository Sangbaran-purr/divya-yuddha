#!/usr/bin/env node
'use strict';
// tools/copy_runtime.js — VFX-LAB-1. COPY, never edit: brings the live game's VFX runtime into the lab.
//
//   node lab/vfx-manifestation/tools/copy_runtime.js
//
// Reads the game's index.html READ-ONLY, finds the VFX module by its own first and last lines, and writes:
//   runtime/vfx.js      the module BYTE-FOR-BYTE between VERBATIM markers, wrapped so the names it reads from the game
//                       page are INJECTED instead (LabVFX.create(deps)) — nothing inside the markers changes
//   runtime/COPY.json   where every byte came from: game commit, line range, sha256 of the verbatim body, the page
//                       constants the wrapper defaults to, and each copied file's source, sha256, size and pixel size
//   runtime/assets/...  the Pixi copy + the sheets of ONE existing effect (the GPU Chaos Surge, lo rung: surge_1/surge_2
//                       colour + motion vectors — exactly what the module's own init loads for it)
//   art/...             the card art of every card in data/manifestations.json (its "art" field — LAB-7: read from the
//                       registry, so a new character needs no edit here)
// WHY runtime/ holds both the module and its assets: the module builds sheet URLs relative to the PAGE ('assets/vfx/…')
// but imports Pixi relative to its own FILE ('./assets/vendor/…'). The lab page sets <base href="runtime/">, so both
// resolve inside runtime/ and the copy needs no path rewrite at all.
const fs = require('fs'), path = require('path'), crypto = require('crypto'), cp = require('child_process');
const LAB = path.resolve(__dirname, '..'), GAME = path.resolve(LAB, '..', '..');
const sha256 = (b) => crypto.createHash('sha256').update(b).digest('hex');
const START = 'const VFX = (()=>{', END = '})();';

// the module inside a page's text: its first line, and the first `})();` line after it
function locate(html) {
  const L = html.split('\n');
  const starts = L.map((l, i) => l === START ? i : -1).filter((i) => i >= 0);
  if (starts.length !== 1) throw new Error('expected exactly one "' + START + '" line, found ' + starts.length);
  const s = starts[0], e = L.findIndex((l, i) => i > s && l === END);
  if (e < 0) throw new Error('no closing "' + END + '" after the module start');
  return { start: s + 1, end: e + 1, body: L.slice(s, e + 1).join('\n') };
}
// the names the module reads from the game page (the wrapper injects exactly these), and the page's values for two of them
const PAGE_NAMES = ['$', 'vfxT', 'reducedMotion', 'jankSample', 'CHOREO_SPEED', 'LEGACY_VFX'];
const CLOCK_NAMES = ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'];
function pageConstants(html) {
  const c = /^const CHOREO_SPEED = ([0-9.]+);/m.exec(html), l = /^const LEGACY_VFX = (true|false);/m.exec(html);
  if (!c || !l) throw new Error('could not read CHOREO_SPEED / LEGACY_VFX from index.html');
  return { CHOREO_SPEED: Number(c[1]), LEGACY_VFX: l[1] === 'true' };
}
const BEGIN_MARK = (r) => '/* ===== VERBATIM BEGIN · index.html:' + r.start + '-' + r.end + ' ===== */';
const END_MARK = '/* ===== VERBATIM END ===== */';
function verbatimOf(vfxJs) {   // the body between the markers, exactly
  const L = vfxJs.split('\n'), b = L.findIndex((l) => l.indexOf('/* ===== VERBATIM BEGIN') === 0), e = L.indexOf(END_MARK);
  return (b < 0 || e < b) ? null : L.slice(b + 1, e).join('\n');
}
// pixel size of a PNG or a JPEG (the game's sheets are JPEG bytes in .png names)
function pixelSize(buf) {
  if (buf.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i < buf.length) {
      if (buf[i] !== 0xff) { i++; continue; }
      const m = buf[i + 1], len = buf.readUInt16BE(i + 2);
      if ((m >= 0xc0 && m <= 0xc3) || (m >= 0xc5 && m <= 0xc7) || (m >= 0xc9 && m <= 0xcb) || (m >= 0xcd && m <= 0xcf)) return { w: buf.readUInt16BE(i + 7), h: buf.readUInt16BE(i + 5) };
      i += 2 + len;
    }
  }
  return null;
}
const ASSETS = [
  ['assets/vendor/pixi.min.mjs', 'runtime/assets/vendor/pixi.min.mjs'],
  ['assets/vfx/game/sheets/vfx_surge_1.png', 'runtime/assets/vfx/game/sheets/vfx_surge_1.png'],
  ['assets/vfx/game/sheets/vfx_surge_2.png', 'runtime/assets/vfx/game/sheets/vfx_surge_2.png'],
  ['assets/vfx/game/sheets/mv/vfx_surge_1.png', 'runtime/assets/vfx/game/sheets/mv/vfx_surge_1.png'],
  ['assets/vfx/game/sheets/mv/vfx_surge_2.png', 'runtime/assets/vfx/game/sheets/mv/vfx_surge_2.png'],
].concat(registryArt());
// the card art, one per registry entry, in registry order (LAB-7: the list was typed by hand per card)
function registryArt() {
  const cards = JSON.parse(fs.readFileSync(path.join(LAB, 'data', 'manifestations.json'), 'utf8')).cards;
  return Object.keys(cards).filter((k) => cards[k].art).map((k) => ['assets/cards/' + cards[k].art, 'art/' + cards[k].art]);
}

function wrap(r, consts) {
  return [
    '/* runtime/vfx.js — GENERATED by lab/vfx-manifestation/tools/copy_runtime.js from the game\'s index.html. Do not edit by hand: re-run the tool.',
    '   Between the VERBATIM markers the VFX module is byte-identical to index.html:' + r.start + '-' + r.end + ' (sha256 in COPY.json). The wrapper changes ONLY',
    '   where the module\'s free names come from — the game page\'s globals become injected deps — plus a clock the lab can slow, pause and step. */',
    '(function (root) {',
    '  var PAGE = ' + JSON.stringify(consts) + ';   // the game page\'s values at copy time (index.html)',
    '  function create(deps) {',
    '    deps = deps || {};',
    '    // the page dependencies: ' + PAGE_NAMES.join(', '),
    '    var $ = deps.$, vfxT = deps.vfxT, reducedMotion = deps.reducedMotion, jankSample = deps.jankSample || function () {};',
    '    var CHOREO_SPEED = deps.CHOREO_SPEED != null ? deps.CHOREO_SPEED : PAGE.CHOREO_SPEED;',
    '    var LEGACY_VFX = deps.LEGACY_VFX != null ? deps.LEGACY_VFX : PAGE.LEGACY_VFX;',
    '    // the clock: ' + CLOCK_NAMES.join(', '),
    '    var requestAnimationFrame = deps.requestAnimationFrame || root.requestAnimationFrame.bind(root);',
    '    var cancelAnimationFrame = deps.cancelAnimationFrame || (root.cancelAnimationFrame ? root.cancelAnimationFrame.bind(root) : function () {});',
    '    var performance = deps.performance || root.performance;',
    BEGIN_MARK(r),
    r.body,
    END_MARK,
    '    return VFX;',
    '  }',
    '  root.LabVFX = { create: create, PAGE: PAGE };',
    '})(typeof window !== \'undefined\' ? window : this);',
    '',
  ].join('\n');
}

module.exports = { locate, verbatimOf, pageConstants, pixelSize, PAGE_NAMES, CLOCK_NAMES, ASSETS, START, END };

if (require.main === module) {
  const html = fs.readFileSync(path.join(GAME, 'index.html'), 'utf8');
  const r = locate(html), consts = pageConstants(html);
  fs.mkdirSync(path.join(LAB, 'runtime'), { recursive: true });
  fs.writeFileSync(path.join(LAB, 'runtime', 'vfx.js'), wrap(r, consts));
  const files = ASSETS.map(([from, to]) => {
    const buf = fs.readFileSync(path.join(GAME, from)), dst = path.join(LAB, to);
    fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.writeFileSync(dst, buf);
    return { from, to, bytes: buf.length, sha256: sha256(buf), px: pixelSize(buf) };
  });
  let commit = null; try { commit = cp.execFileSync('git', ['rev-parse', 'HEAD'], { cwd: GAME, encoding: 'utf8' }).trim(); } catch (e) {}
  const copy = {
    what: 'the VFX runtime and one effect\'s assets, copied from the live game into the lab (VFX-LAB-1)',
    source: { file: 'index.html', gameCommit: commit, startLine: r.start, endLine: r.end, lines: r.end - r.start + 1, sha256: sha256(r.body) },
    injected: { page: PAGE_NAMES, clock: CLOCK_NAMES, pageConstants: consts },
    rung: 'lo (pinned by the lab page: VFX.applyQuality(\'lo\') before VFX.init())',
    effect: 'Chaos Surge on the GPU path (sprSurge) — the module\'s own gpuInit→gpuLoadSurge loads exactly these sheets; plus cardLand, procedural (no assets)',
    knownRequests: 'gpuLoadHero also asks for the hero-moment kit (vfx_ring_1, vfx_lightning_1 stills; vfx_smoke_1 sheet + MV). Not carried: those requests 404 and the module catches them (heroReady=false).',
    files,
  };
  fs.writeFileSync(path.join(LAB, 'runtime', 'COPY.json'), JSON.stringify(copy, null, 2) + '\n');
  console.log('copied index.html:' + r.start + '-' + r.end + ' (' + copy.source.lines + ' lines, sha256 ' + copy.source.sha256.slice(0, 12) + '…) + ' + files.length + ' files, ' + (files.reduce((a, f) => a + f.bytes, 0) / 1048576).toFixed(2) + ' MB');
}
