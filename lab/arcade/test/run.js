#!/usr/bin/env node
'use strict';
// ARCADE-1 · THE LAB SUITE.   node lab/arcade/test/run.js [--game]
//   R0  the page, the stamp, the Pixi copy, the lab law
//   R1  the fight core: determinism, frame data, hit-stop, block, crouch vs high, cancels, meter, health, rounds — + breakages
//   R2  the input buffer, the controls, the honest AI, the AI ladder and the mirror — + breakages
//   --game  also runs the game's own suites and checks their exact counts (test/game_counts.json) — run it before every commit.
// A breakage is the real source with one deliberate fault; the check it targets must go red on it.
// RUNG-AWARE: the suite runs the rungs whose files exist (R1 = core/fight.js, R2 = core/ai.js + ui/controls.js), so every rung's commit is green.
const fs = require('fs'), path = require('path'), cp = require('child_process'), crypto = require('crypto');
const LAB = path.resolve(__dirname, '..'), REPO = path.resolve(LAB, '../..');
const rd = (r) => fs.readFileSync(path.join(LAB, r), 'utf8');
let pass = 0, fail = 0;
const ok = (name, cond, detail) => { if (cond) { pass++; console.log('  ✓ ' + name); } else { fail++; console.log('  ✖ ' + name + (detail !== undefined ? '\n      ' + String(detail).slice(0, 400) : '')); } };
const red = (name, cond) => ok(name + ' → red', cond);
const J = JSON.stringify;

// ── a loader that evaluates the core from source, optionally with mutations (the breakages) ──
const FILES = { moves: 'core/moves.js', fight: 'core/fight.js', rng: 'core/rng.js', ai: 'core/ai.js', match: 'core/match.js', controls: 'ui/controls.js', scene: 'ui/scene.js', present: 'ui/present.js', demo: 'ui/demo.js' };
function load(mut) {
  mut = mut || {};
  const src = {};
  for (const k in FILES) {
    if (!fs.existsSync(path.join(LAB, FILES[k]))) continue;
    let s = rd(FILES[k]);
    for (const [a, b] of (mut[k] || [])) { if (!s.includes(a)) throw new Error('mutation anchor missing in ' + k + ': ' + a.slice(0, 60)); s = s.split(a).join(b); }
    src[k] = s;
  }
  const cache = {};
  const byPath = { './moves.js': 'moves', './fight.js': 'fight', './rng.js': 'rng', '../core/fight.js': 'fight', '../core/moves.js': 'moves', './scene.js': 'scene' };
  function req(k) {
    if (cache[k]) return cache[k].exports;
    const module = { exports: {} }; cache[k] = module;
    new Function('module', 'exports', 'require', src[k])(module, module.exports, (p) => { if (!byPath[p]) throw new Error('unexpected require ' + p); return req(byPath[p]); });
    return module.exports;
  }
  const out = {}; for (const k in src) out[k] = req(k);
  return out;
}

// ── fight helpers ──
function run(K, opts, script, frames) {   // script(frame) → [b0, b1]
  const g = K.fight.newFight(opts);
  for (let i = 0; i < frames && !g.over; i++) K.fight.step(g, script(g.frame + 1, g));
  return g;
}
function closeIn(K, g, dist) {   // walk side 0 forward until the gap is `dist` px
  const B = K.fight.BTN;
  for (let i = 0; i < 400; i++) { if ((g.f[1].x - g.f[0].x) / K.fight.U <= dist) break; K.fight.step(g, [B.R, 0]); }
  K.fight.step(g, [0, 0]);
  return g;
}

console.log('── ARCADE-1 · R0 · the page, the stamp, the copy, the lab law ──');
const has = (f) => fs.existsSync(path.join(LAB, f));
const ENH = has('ui/present.js');   // the enhancement test's files (checked as part of rung 3 once they exist)
const RUNG = has('fighters/indra/manifest.json') ? 3 : has('core/ai.js') && has('ui/controls.js') ? 2 : has('core/fight.js') ? 1 : 0;
const BY_RUNG = [
  ['index.html', 'STAMP', 'README.md', '.gitignore', 'LAW_BASE', 'runtime/pixi.min.mjs', 'runtime/COPY.json', 'tools/stamp.js', 'test/run.js', 'test/game_counts.json'],
  ['core/moves.js', 'core/fight.js', 'core/rng.js', 'core/match.js', 'ui/scene.js'],
  ['core/ai.js', 'ui/controls.js', 'ui/app.js', 'ui/app.css'],
  ['tools/make_fighter.py', 'tools/ktx2_decode.js', 'tools/make_effect_lo.py', 'runtime/basis/basis_transcoder.js', 'runtime/basis/basis_transcoder.wasm', 'effects/vajra/lo/manifest.json', 'effects/vajra/lo/atlas.webp']
    .concat(...['indra', 'meghnad'].map((h) => ['fighters/' + h + '/manifest.json', 'fighters/' + h + '/hi_0.webp', 'fighters/' + h + '/hi_0.ktx2', 'fighters/' + h + '/lo_0.webp', 'fighters/' + h + '/lo_0.ktx2']))];
const ENH_FILES = ['ui/present.js', 'ui/demo.js', 'tools/capture_server.js', 'tools/assemble_capture.py', 'tools/budget.js', 'effects/vajra/atlas.webp', 'effects/vajra/manifest.json'];
const NEEDED = [].concat(...BY_RUNG.slice(0, RUNG + 1)).concat(ENH ? ENH_FILES : []);
console.log('  (rung ' + RUNG + ': the suite checks R0' + (RUNG ? '–R' + (RUNG === 3 ? '2 + the R3 clip test' : RUNG) : '') + ')');
const missing = NEEDED.filter((f) => !fs.existsSync(path.join(LAB, f)));
ok('R0.1 · the lab has every file of its rungs so far: the page, its own Pixi copy, the stamp tool and this suite' + (RUNG >= 1 ? ', the core and the scene' : '') + (RUNG >= 2 ? ', the AI, the controls and the app' : '') + (RUNG >= 3 ? ', the fighter tool and both clip-test fighters' : '') + (ENH ? ', the enhancement test (presentation, demo, recorder, Vajra copy, the memory projection)' : '') + ' (' + NEEDED.length + ' files)', missing.length === 0, missing);
const ST = require(path.join(LAB, 'tools/stamp.js')), stamp = ST.compute(), html = rd('index.html');
ok('R0.2 · THE STAMP is current: STAMP = the hash of every loaded file (' + ST.inputs().length + '), and every script, stylesheet and the meta carry it (' + stamp + ')',
  rd('STAMP').trim() === stamp && ST.stampPage(html, stamp) === html && (html.match(/\?v=([0-9a-f]{12})/g) || []).every((m) => m.endsWith(stamp)));
const COPY = JSON.parse(rd('runtime/COPY.json')).files[0];
const sha = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const pixiLab = sha(path.join(LAB, 'runtime/pixi.min.mjs')), pixiGame = sha(path.join(REPO, COPY.from));
ok('R0.3 · THE PIXI COPY is the game\'s, byte for byte (sha256 ' + pixiLab.slice(0, 12) + '…, v' + COPY.version + '), and the game\'s has not drifted since the copy', pixiLab === COPY.sha256 && pixiGame === COPY.sha256);
const refs = (html.match(/(?:src|href)="([^"]+)"/g) || []).map((m) => m.replace(/^(?:src|href)="|"$/g, ''));
const appSrc = has('ui/app.js') ? rd('ui/app.js') : '';
ok('R0.4 · the page is noindex and loads only from lab/arcade/: no http(s), no "../" in the page; the app imports nothing but ../runtime/ (' + refs.length + ' refs)',
  /<meta name="robots" content="noindex, nofollow">/.test(html) && refs.every((r) => !/^(https?:)?\/\//.test(r) && !r.startsWith('../') && !r.startsWith('/')) &&
  (appSrc.match(/import\(\s*"([^"]+)"/g) || []).every((m) => m.includes('../runtime/')));
const BASE = rd('LAW_BASE').trim();
const ALLOWED = (p) => p.startsWith('lab/arcade/') || p === 'docs/ARCADE_v1.md';
function lawViolations(paths) { return paths.filter((p) => p && !ALLOWED(p)); }
const git = (a) => cp.execFileSync('git', a, { cwd: REPO, encoding: 'utf8' }).split('\n').filter(Boolean);
// the law binds the LAB's commits (subject "ARCADE-1 …") and whatever is staged; a separately ruled commit outside the lab
// (e.g. TEST-PUZZLEMODE-1, ARCADE-1 ruling 7) is its own commit with its own subject, and is listed, not judged, here
const labCommits = git(['log', '--format=%H %s', BASE + '..HEAD']).map((l) => ({ h: l.slice(0, 40), s: l.slice(41) }));
const changed = [...new Set(labCommits.filter((c) => c.s.startsWith('ARCADE-1')).flatMap((c) => git(['show', '--name-only', '--format=', c.h])).concat(git(['diff', '--name-only', '--cached'])))];
const others = labCommits.filter((c) => !c.s.startsWith('ARCADE-1')).map((c) => c.s.split(':')[0]);
ok('R0.5 · THE LAB LAW: since ' + BASE.slice(0, 7) + ', every ARCADE-1 commit and every staged change is inside lab/arcade/ or is docs/ARCADE_v1.md (' + changed.length + ' paths' + (others.length ? '; ruled commits outside the lab: ' + others.join(', ') : '') + ')', lawViolations(changed).length === 0, lawViolations(changed));
red('R0.5b · BREAKAGE: a change to the live game\'s index.html among the paths (R0.5 goes red)', lawViolations(changed.concat(['index.html'])).length === 1);
const live = ['index.html'].concat(fs.readdirSync(path.join(REPO, 'src')).map((f) => 'src/' + f)).concat(fs.readdirSync(path.join(REPO, 'scripts')).map((f) => 'scripts/' + f))
  .filter((f) => fs.statSync(path.join(REPO, f)).isFile());
const leaks = live.filter((f) => /lab\/arcade/.test(fs.readFileSync(path.join(REPO, f), 'utf8')));
ok('R0.6 · nothing in the live game names lab/arcade (' + live.length + ' files: index.html, src/, scripts/)', leaks.length === 0, leaks);
const labJs = ['core/moves.js', 'core/fight.js', 'core/rng.js', 'core/ai.js', 'core/match.js', 'ui/controls.js', 'ui/scene.js', 'ui/app.js', 'ui/present.js', 'ui/demo.js'].filter(has);
ok('R0.7 · no console.log in the page\'s code (' + labJs.length + ' files)', labJs.every((f) => !/console\.log/.test(rd(f))));
const gi = rd('.gitignore');
ok('R0.8 · the clip law is in place before any clip exists: sources/, frames/, matted/ and video files are ignored', ['sources/', 'frames/', 'matted/', '*.mp4', '*.mov'].every((p) => gi.includes(p)));

if (RUNG < 1) return finish();
console.log('\n── ARCADE-1 · R1 · the fight core ──');
const K = load();
const B = K.fight.BTN, U = K.fight.U, MV = K.moves.MOVES;
// a fixed pseudo-random input script, for the determinism checks
function scriptOf(seed) { const r = K.rng.rng(seed); const keys = [0, B.L, B.R, B.U, B.D, B.LT, B.HV, B.SP, B.BL, B.R | B.LT, B.L | B.BL]; return () => [keys[Math.floor(r() * keys.length)], keys[Math.floor(r() * keys.length)]]; }
function determinism(KK) {
  const a = run(KK, { p0: 'box_rakta', p1: 'box_varna' }, scriptOf(5), 3000), b = run(KK, { p0: 'box_rakta', p1: 'box_varna' }, scriptOf(5), 3000);
  // rollback: run 400 frames, snapshot, run 600 more; restore the snapshot and run the same 600 again
  const s1 = scriptOf(9), frames = []; for (let i = 0; i < 1000; i++) frames.push(s1());
  const g = KK.fight.newFight({ p0: 'box_surya', p1: 'box_rakta' });
  for (let i = 0; i < 400; i++) KK.fight.step(g, frames[i]);
  const snap = KK.fight.snapshot(g);
  for (let i = 400; i < 1000; i++) KK.fight.step(g, frames[i]);
  const h1 = KK.fight.hash(g), g2 = KK.fight.restore(snap);
  for (let i = 400; i < 1000; i++) KK.fight.step(g2, frames[i]);
  return { same: KK.fight.hash(a) === KK.fight.hash(b), rollback: h1 === KK.fight.hash(g2), events: a.events.length };
}
const det = determinism(K);
ok('R1.1 · DETERMINISTIC: the same inputs give the same fight, hash for hash (3000 frames, ' + det.events + ' events)', det.same);
ok('R1.2 · ROLLBACK-READY: snapshot at frame 400, play 600 more, restore and replay the same 600 → the identical state', det.rollback);
const stripComments = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:"'])\/\/.*$/gm, '$1');
const coreSrc = ['core/moves.js', 'core/fight.js', 'core/rng.js', 'core/ai.js', 'core/match.js'].filter(has).map((f) => stripComments(rd(f))).join('\n');
ok('R1.3 · the core never reads a clock, Math.random or the page: no Date, performance, Math.random, window, document', !/Math\.random|Date\.|performance\.|\bdocument\.|\bwindow\./.test(coreSrc));

// frame data: press once, record the frames the hitbox exists (no opponent in reach, so nothing connects)
function activeFrames(KK, move, opts) {
  const BB = KK.fight.BTN, bit = { light: BB.LT, heavy: BB.HV, special: BB.SP }[move];
  const g = KK.fight.newFight(opts || { p0: 'box_rakta', p1: 'box_surya' });
  if (move === 'special') g.f[0].meter = 100;
  const act = [], st = [];
  for (let i = 0; i < 80; i++) { KK.fight.step(g, [i === 0 ? bit : 0, 0]); if (KK.fight.hitbox(g.f[0]) || (KK.fight.isActive(g.f[0]))) act.push(i); st.push(g.f[0].state); }
  const back = st.indexOf('idle');
  return { act, back };
}
const FD = ['light', 'heavy', 'special'].map((m) => ({ m, ...activeFrames(K, m), want: MV[m] }));
ok('R1.4 · FRAME DATA honoured: light 5/3/9, heavy 12/4/18, special 16/8/26 — active on exactly the frames after startup, idle again after the whole move (' +
  FD.map((x) => x.m + ' active ' + x.act[0] + '–' + x.act[x.act.length - 1] + ', idle at ' + x.back).join(' · ') + ')',
  FD.every((x) => x.act.length === x.want.active && x.act[0] === x.want.startup && x.back === x.want.startup + x.want.active + x.want.recovery));

// one clean hit, measured
function oneHit(KK, move, opts) {
  const BB = KK.fight.BTN, g = closeIn(KK, KK.fight.newFight(opts || { p0: 'box_surya', p1: 'box_surya' }), 60);
  if (move === 'special') g.f[0].meter = 100;
  const hp0 = g.f[1].hp, bit = { light: BB.LT, heavy: BB.HV, special: BB.SP }[move];
  let hitAt = -1, stopFrames = 0, frozen = true, x0 = null;
  for (let i = 0; i < 60; i++) {
    KK.fight.step(g, [i === 0 ? bit : 0, 0]);
    if (hitAt < 0 && g.events.some((e) => e.t === 'hit')) { hitAt = i; x0 = [g.f[0].x, g.f[1].x, g.f[0].mf, g.timer]; }
    else if (hitAt >= 0 && g.hitstop > 0) { stopFrames++; if (g.f[0].x !== x0[0] || g.f[1].x !== x0[1] || g.f[0].mf !== x0[2] || g.timer !== x0[3]) frozen = false; }
  }
  return { dmg: hp0 - g.f[1].hp, g, hitAt, stopFrames: hitAt >= 0 ? stopFrames + 1 : 0, frozen };
}
const L1 = oneHit(K, 'light'), H1 = oneHit(K, 'heavy');
ok('R1.5 · DAMAGE from the template × the archetype: light 50, heavy 110 for a balanced Hero; a rushdown (108%) lands light ' + oneHit(K, 'light', { p0: 'box_rakta', p1: 'box_surya' }).dmg,
  L1.dmg === 50 && H1.dmg === 110 && oneHit(K, 'light', { p0: 'box_rakta', p1: 'box_surya' }).dmg === 54);
function hitstopOk(KK) { const h = oneHit(KK, 'light'), hh = oneHit(KK, 'heavy'); return { ok: h.stopFrames === MV.light.hitstop && hh.stopFrames === MV.heavy.hitstop && h.frozen && hh.frozen, h: h.stopFrames, hh: hh.stopFrames }; }
const HS = hitstopOk(K);
ok('R1.6 · HIT-STOP: a hit freezes both fighters, their move frames and the clock for exactly 6 (light) / 8 (heavy) frames (measured ' + HS.h + ' / ' + HS.hh + ')', HS.ok);

function blockCase(KK, move, guardBits) {
  const BB = KK.fight.BTN, g = closeIn(KK, KK.fight.newFight({ p0: 'box_surya', p1: 'box_surya' }), 60);
  if (move === 'special') g.f[0].meter = 100;
  const hp0 = g.f[1].hp, m0 = g.f[1].meter, bit = { light: BB.LT, heavy: BB.HV, special: BB.SP }[move];
  for (let i = 0; i < 60; i++) KK.fight.step(g, [i === 0 ? bit : 0, guardBits]);
  return { dmg: hp0 - g.f[1].hp, blocked: g.events.some((e) => e.t === 'block'), meter: g.f[1].meter - m0 };
}
function blockOk(KK) {
  const BB = KK.fight.BTN;
  const back = blockCase(KK, 'light', BB.R), btn = blockCase(KK, 'heavy', BB.BL), sp = blockCase(KK, 'special', BB.R);
  return { ok: back.blocked && back.dmg === 0 && btn.blocked && btn.dmg === 0 && sp.blocked && sp.dmg === 40 && back.meter === 2, back, btn, sp };
}
const BL = blockOk(K);
ok('R1.7 · BLOCK: holding back blocks a light (0 damage, +2 meter to the blocker), the Block button blocks a heavy (0), a special chips 40 through a block', BL.ok, J(BL));
function crouchOk(KK) {
  const BB = KK.fight.BTN;
  const mk = () => { const g = KK.fight.newFight({ p0: 'box_surya', p1: 'box_surya' }); for (let i = 0; i < 300; i++) { if ((g.f[1].x - g.f[0].x) / KK.fight.U <= 60) break; KK.fight.step(g, [BB.R, BB.D]); } return g; };
  const a = mk(), hpA = a.f[1].hp; for (let i = 0; i < 60; i++) KK.fight.step(a, [i === 0 ? BB.HV : 0, BB.D]);
  const b = mk(), hpB = b.f[1].hp; for (let i = 0; i < 60; i++) KK.fight.step(b, [i === 0 ? BB.LT : 0, BB.D]);
  return { heavyWhiffs: a.f[1].hp === hpA, lightHits: hpB - b.f[1].hp === 50 };
}
const CR = crouchOk(K);
ok('R1.8 · CROUCH vs HIGH: a crouching Hero ducks a heavy (a high — no damage); a light (a mid) still hits the crouch', CR.heavyWhiffs && CR.lightHits, J(CR));

// cancels: light then a second button pressed `delay` frames after the light, against a passive dummy (or out of reach)
function cancelCase(KK, first, second, delay, dist) {
  const BB = KK.fight.BTN, bit = { light: BB.LT, heavy: BB.HV, special: BB.SP };
  const g = closeIn(KK, KK.fight.newFight({ p0: 'box_surya', p1: 'box_surya' }), dist || 60);
  g.f[0].meter = 100;
  for (let i = 0; i < 90; i++) KK.fight.step(g, [i === 0 ? bit[first] : i === delay ? bit[second] : 0, 0]);
  const moves = g.events.filter((e) => e.t === 'move' && e.side === 0).map((e) => e.move);
  return moves;
}
function cancelsOk(KK) {
  const r = {
    lightHeavy: cancelCase(KK, 'light', 'heavy', 8), heavySpecial: cancelCase(KK, 'heavy', 'special', 18),
    late: cancelCase(KK, 'light', 'heavy', 19),     // the light hits at its mf 5, freezes 6 frames, so i = 19 is mf 13: past the window (mf < 12), still inside the light
    whiff: cancelCase(KK, 'light', 'heavy', 8, 200), heavyLight: cancelCase(KK, 'heavy', 'light', 18)
  };
  return { r, ok: J(r.lightHeavy) === '["light","heavy"]' && J(r.heavySpecial) === '["heavy","special"]' && J(r.late) === '["light"]' &&
    J(r.whiff) === '["light"]' && J(r.heavyLight) === '["heavy"]' };
}
const CN = cancelsOk(K);
ok('R1.9 · CANCELS: light→heavy and heavy→special on contact inside the window; NOT after it, NOT on a whiff, NOT heavy→light', CN.ok, J(CN.r));
function chainOk(KK) {   // light→light chains once, never twice
  const BB = KK.fight.BTN, g = closeIn(KK, KK.fight.newFight({ p0: 'box_surya', p1: 'box_surya' }), 55);
  for (let i = 0; i < 90; i++) KK.fight.step(g, [i % 3 === 0 ? BB.LT : 0, 0]);   // mashing light every 3 frames: a fresh press is always in the buffer
  const seq = g.events.filter((e) => e.t === 'move' && e.side === 0).map((e) => e.frame);
  return { n: seq.length, gaps: seq.slice(1).map((f, i) => f - seq[i]) };
}
const CH = chainOk(K);
const LTOT = MV.light.startup + MV.light.active + MV.light.recovery;
ok('R1.10 · light→light chains ONCE: mashing light cancels the first into the second early, but the third waits for the second to finish (move gaps ' + J(CH.gaps) + ' frames; a whole light is ' + LTOT + ' + its hit-stop)',
  CH.gaps.length >= 2 && CH.gaps[0] < LTOT && CH.gaps[1] >= LTOT, J(CH));

function meterOk(KK) {
  const h = oneHit(KK, 'light');
  const BB = KK.fight.BTN, g = KK.fight.newFight({ p0: 'box_surya', p1: 'box_surya' }); g.f[0].meter = 99;
  for (let i = 0; i < 30; i++) KK.fight.step(g, [i === 0 ? BB.SP : 0, 0]);
  const noSpecial = !g.events.some((e) => e.t === 'move' && e.move === 'special');
  const g2 = KK.fight.newFight({ p0: 'box_surya', p1: 'box_surya' }); g2.f[0].meter = 100;
  for (let i = 0; i < 30; i++) KK.fight.step(g2, [i === 0 ? BB.SP : 0, 0]);
  const spent = g2.events.some((e) => e.t === 'move' && e.move === 'special') && g2.f[0].meter === 0;
  return { ok: h.g.f[0].meter === 8 && h.g.f[1].meter === 5 && noSpecial && spent, att: h.g.f[0].meter, def: h.g.f[1].meter, noSpecial, spent };
}
const MT = meterOk(K);
ok('R1.11 · DIVINE METER: +8 to the hitter, +5 to the hit; a special needs a full 100 (at 99 nothing happens) and spends it all', MT.ok, J(MT));

function endsOk(KK) {
  const g = KK.fight.newFight({ p0: 'box_surya', p1: 'box_surya' }); g.f[1].hp = 40; closeIn(KK, g, 60);
  for (let i = 0; i < 40 && !g.over; i++) KK.fight.step(g, [i === 0 ? KK.fight.BTN.LT : 0, 0]);
  const t = KK.fight.newFight({ p0: 'box_surya', p1: 'box_varna', seconds: 2 }); t.f[0].hp = 500; t.f[1].hp = 500;   // 50% vs 52.6%
  for (let i = 0; i < 200 && !t.over; i++) KK.fight.step(t, [0, 0]);
  const d = KK.fight.newFight({ p0: 'box_surya', p1: 'box_surya', seconds: 1 }); for (let i = 0; i < 100 && !d.over; i++) KK.fight.step(d, [0, 0]);
  return { ko: g.over && g.winner === 0 && g.reason === 'ko' && g.f[1].state === 'ko', time: t.over && t.reason === 'time' && t.winner === 1, draw: d.over && d.winner === null };
}
const EN = endsOk(K);
ok('R1.12 · HEALTH and the round\'s end: 0 health is a K.O. for the other side; at time-out the larger SHARE of health wins (500/1000 loses to 500/950); equal is a draw', EN.ko && EN.time && EN.draw, J(EN));

function pushOk(KK) {
  const BB = KK.fight.BTN, g = KK.fight.newFight({ p0: 'box_surya', p1: 'box_surya' });
  let min = 1e9; for (let i = 0; i < 300; i++) { KK.fight.step(g, [BB.R, BB.L]); min = Math.min(min, Math.abs(g.f[1].x - g.f[0].x)); }
  const w = KK.fight.newFight({ p0: 'box_surya', p1: 'box_surya' }); for (let i = 0; i < 400; i++) KK.fight.step(w, [BB.L, 0]);
  return { ok: min >= KK.fight.PUSH * KK.fight.U && w.f[0].x === KK.fight.WALL * KK.fight.U, min: min / KK.fight.U };
}
const PU = pushOk(K);
ok('R1.13 · BODIES: two Heroes walking into each other never come closer than 60 px (closest ' + PU.min + '); the stage wall stops a Hero', PU.ok);

function projectileOk(KK) {
  const BB = KK.fight.BTN;
  const stay = KK.fight.newFight({ p0: 'box_surya', p1: 'box_surya' }); stay.f[0].meter = 100;
  for (let i = 0; i < 90; i++) KK.fight.step(stay, [i === 0 ? BB.SP : 0, 0]);
  const jump = KK.fight.newFight({ p0: 'box_surya', p1: 'box_surya' }); jump.f[0].meter = 100;
  let minGap = 1e9;
  for (let i = 0; i < 90; i++) {   // side 1 jumps just as the shot arrives
    const p = jump.proj[0], gap = p ? Math.abs(p.x - jump.f[1].x) / KK.fight.U : 1e9; minGap = Math.min(minGap, gap);
    KK.fight.step(jump, [i === 0 ? BB.SP : 0, p && gap < 160 && gap > 100 ? BB.U : 0]);
  }
  const one = KK.fight.newFight({ p0: 'box_surya', p1: 'box_surya' }); one.f[0].meter = 100; one.f[1].meter = 100;
  let maxOwn = 0, clash = false;
  for (let i = 0; i < 120; i++) { KK.fight.step(one, [i === 0 || i === 40 ? BB.SP : 0, i === 0 ? BB.SP : 0]); maxOwn = Math.max(maxOwn, one.proj.filter((p) => p.owner === 0).length); }
  clash = one.events.some((e) => e.t === 'clash');
  return { grounded: stay.events.some((e) => e.t === 'hit' && e.move === 'special'), jumped: !jump.events.some((e) => e.t === 'hit') && jump.events.some((e) => e.t === 'jump'), maxOwn, clash };
}
const PJ = projectileOk(K);
ok('R1.14 · THE DIVINE WEAPON as a projectile: it hits a standing Hero, a jump clears it, one of yours at a time, two opposing shots cancel', PJ.grounded && PJ.jumped && PJ.maxOwn === 1 && PJ.clash, J(PJ));
function rushOk(KK) { const BB = KK.fight.BTN, g = closeIn(KK, KK.fight.newFight({ p0: 'box_rakta', p1: 'box_surya' }), 160); g.f[0].meter = 100; const x0 = g.f[0].x; for (let i = 0; i < 40; i++) KK.fight.step(g, [i === 0 ? BB.SP : 0, 0]); return { hit: g.events.some((e) => e.t === 'hit' && e.move === 'special'), travel: (g.f[0].x - x0) / KK.fight.U }; }
const RU = rushOk(K);
ok('R1.15 · THE DIVINE WEAPON as a rush (rushdown, tank): from 160 px out — beyond any normal\'s reach — the Hero charges ' + RU.travel + ' px and lands it', RU.hit && RU.travel >= 60, J(RU));

console.log('\n── ARCADE-1 · R1 · the rounds stub (ruling 4) ──');
function playMatch(KK, l0, l1, a0, a1, seed) {
  const r = KK.rng.rng(seed), m = KK.match.createMatch({ lineup0: l0, lineup1: l1 });
  let ai = [KK.ai.createAI(a0, r, { round: 0 }), KK.ai.createAI(a1, r, { round: 0 })], guard = 0;
  while (!m.over && guard++ < 30000) {
    if (m.pending) { KK.match.nextRound(m); ai = [KK.ai.createAI(a0, r, { round: m.round }), KK.ai.createAI(a1, r, { round: m.round })]; }
    MAstep(KK, m, ai);
  }
  return m;
}
function MAstep(KK, m, ai) { const g = m.fight; KK.match.step(m, [KK.ai.decide(ai[0], KK.ai.observe(g, 0)), KK.ai.decide(ai[1], KK.ai.observe(g, 1))]); }
const LU = ['box_rakta', 'box_varna', 'box_surya'], LU2 = ['box_surya', 'box_rakta', 'box_varna'];
// a scripted match (no AI needed): in each round the chosen side walks in and mashes light; the other stands still
function scriptedMatch(KK, winners) {
  const BB = KK.fight.BTN, m = KK.match.createMatch({ lineup0: LU, lineup1: LU2 });
  for (let i = 0; i < 20000 && !m.over; i++) {
    if (m.pending) KK.match.nextRound(m);
    const w = winners[m.round], g = m.fight, near = Math.abs(g.f[1].x - g.f[0].x) / KK.fight.U <= 70;
    const bully = near ? (g.frame % 3 === 0 ? BB.LT : 0) : (w === 0 ? BB.R : BB.L);   // walk in, then mash light
    KK.match.step(m, w === 0 ? [bully, 0] : [0, bully]);
  }
  return m;
}
const PM = scriptedMatch(K, [0, 1, 0]), twoNil = scriptedMatch(K, [1, 1, 1]);
const decided = PM.rounds.filter((r) => !r.replay);
ok('R1.16 · AN ORDERED LINEUP: round n is each side\'s n-th Hero (' + decided.map((r) => r.heroes.join(' v ')).join(' · ') + ')', decided.every((r, i) => r.heroes[0] === LU[i] && r.heroes[1] === LU2[i]));
ok('R1.17 · FIRST TO 2: a 1–1 goes to a third round, and the match ends the moment a side has 2 (' + J(PM.wins) + ' after ' + decided.length + ' rounds; a 2–0 ends after 2: ' + J(twoNil.wins) + ')', PM.over && PM.winner === 0 && J(PM.wins) === '[2,1]' && decided.length === 3 && twoNil.over && J(twoNil.wins) === '[0,2]' && twoNil.rounds.length === 2);
ok('R1.18 · WHO FOUGHT is recorded (what R6 recovery reads): after a 2–0 the third Hero of each lineup never fought', twoNil && twoNil.fought[0].length === 2 && !twoNil.fought[0].includes(LU[2]) && !twoNil.fought[1].includes(LU2[2]));
function drawReplay(KK) {
  const m = KK.match.createMatch({ lineup0: LU, lineup1: LU2, seconds: 1 });
  const seen = [];
  for (let i = 0; i < 2000 && !m.over; i++) { if (m.pending) { seen.push(m.pending + ':' + m.round); KK.match.nextRound(m); } KK.match.step(m, [0, 0]); }
  return { seen, rounds: m.rounds.map((r) => (r.replay ? 'draw' : 'w' + r.winner)), over: m.over };
}
const DR = drawReplay(K);
ok('R1.19 · A DRAWN ROUND is fought again with the same two Heroes, at most twice, then goes to the larger health share (side 0 on a perfect tie) — ' + DR.rounds.join(' '),
  DR.seen.slice(0, 2).every((s) => s === 'replay:0') && DR.rounds.slice(0, 3).join(' ') === 'draw draw w0');
let threw = 0; for (const bad of [['box_rakta', 'box_varna'], ['box_rakta', 'box_rakta', 'box_varna'], ['box_rakta', 'box_varna', 'nobody']]) { try { K.match.createMatch({ lineup0: bad, lineup1: LU2 }); } catch (e) { threw++; } }
ok('R1.20 · a lineup is exactly 3 different, known Heroes — anything else is refused', threw === 3);

console.log('\n── ARCADE-1 · R1 · what is drawn ──');
function sceneOk(KK) {
  const g = KK.fight.newFight({ p0: 'box_surya', p1: 'box_surya' }), BB = KK.fight.BTN, frames = [];
  for (let i = 0; i < 20; i++) { KK.fight.step(g, [i === 0 ? BB.LT : 0, BB.D]); frames.push(KK.scene.build(g).shapes.some((s) => s.tag === 'hitbox0')); }
  const crouch = KK.scene.build(g).shapes.find((s) => s.tag === 'body1');
  const far = KK.fight.newFight({ p0: 'box_surya', p1: 'box_surya' }); far.f[0].x = 0; far.f[1].x = 0;
  const camL = KK.scene.cameraX(far); far.f[0].x = far.f[1].x = KK.fight.STAGE_W * KK.fight.U; const camR = KK.scene.cameraX(far);
  return { active: frames.map((b, i) => (b ? i : -1)).filter((i) => i >= 0), crouchH: crouch.h, camL, camR };
}
const SC = sceneOk(K);
ok('R1.21 · THE SCENE: the red hitbox is drawn on the active frames only (' + J(SC.active) + '), a crouching body is drawn 120 tall, the camera never shows past the stage ends (' + SC.camL + '…' + SC.camR + ')',
  J(SC.active) === J([5, 6, 7]) && SC.crouchH === 120 && SC.camL === 0 && SC.camR === K.fight.STAGE_W - K.scene.VIEW_W, J(SC));

console.log('\n── ARCADE-1 · R1 · breakages: each must go red ──');
const BR1 = [
  ['B1 · the hitbox active one frame LATE (R1.4 goes red)', { fight: [['return f.mf >= m.startup && f.mf < m.startup + m.active;', 'return f.mf >= m.startup + 1 && f.mf < m.startup + m.active + 1;']] },
    (KK) => { const fd = ['light', 'heavy', 'special'].map((m) => ({ ...activeFrames(KK, m), want: MV[m] })); return fd.every((x) => x.act.length === x.want.active && x.act[0] === x.want.startup); }],
  ['B2 · a block that does NOT stop damage (R1.7 goes red)', { fight: [['var chip = Math.floor(m.chip * h.mul / 100);', 'var chip = Math.floor(m.dmg * h.mul / 100);']] }, (KK) => blockOk(KK).ok],
  ['B3 · hit-stop removed (R1.6 goes red)', { fight: [['    g.hitstop = stop;', '    g.hitstop = 0;']] }, (KK) => hitstopOk(KK).ok],
  ['B4 · the cancel window widened by 10 frames (R1.9 goes red)', { moves: [['cancelAfter: 4, cells: 6', 'cancelAfter: 14, cells: 6']] }, (KK) => cancelsOk(KK).ok],
  ['B5 · a NONDETERMINISTIC replay: Math.random in the physics (R1.1 goes red)', { fight: [['g.proj.forEach(function (p) { p.x += p.dir * p.speed; });', 'g.proj.forEach(function (p) { p.x += p.dir * p.speed; }); g.noise = Math.random();']] }, (KK) => determinism(KK).same],
  ['B6 · crouch no longer ducks a high: the crouch hurtbox full height (R1.8 goes red)', { moves: [['crouchH: 120', 'crouchH: 220']] }, (KK) => crouchOk(KK).heavyWhiffs],
  ['B7 · the meter not charged by hits (R1.11 goes red)', { moves: [['onHit: 8', 'onHit: 0']] }, (KK) => meterOk(KK).ok],
  ['B8 · a special without a full meter (R1.11 goes red)', { fight: [['if (name === "special") { if (f.meter < M.MOVES.special.cost) return false; f.meter -= M.MOVES.special.cost; }', ''],
    ['if (k === "special" && f.meter < M.MOVES.special.cost) continue;', '']] }, (KK) => meterOk(KK).ok],
  ['B9 · push boxes off: bodies pass through each other (R1.13 goes red)', { fight: [['if (Math.abs(dx) < need) {', 'if (false) {']] }, (KK) => pushOk(KK).ok],
  ['B10 · a draw goes to side 0 at once instead of a replay (R1.19 goes red)', { match: [['if (m.replays < DRAW_REPLAYS)', 'if (false)']] }, (KK) => { const d = drawReplay(KK); return d.rounds.slice(0, 3).join(' ') === 'draw draw w0'; }]
];
for (const [name, mut, check] of BR1) { let still; try { still = check(load(mut)); } catch (e) { still = false; } red(name, !still); }

if (RUNG < 2) return finish();
console.log('\n── ARCADE-1 · R2 · the input buffer ──');
// the first frame a whiffed light is over and the Hero can act again
function bufferCase(KK, before) {
  const BB = KK.fight.BTN, g = KK.fight.newFight({ p0: 'box_surya', p1: 'box_surya' });
  const probe = KK.fight.newFight({ p0: 'box_surya', p1: 'box_surya' });   // the first frame the whiffed light leaves the Hero free
  let free = -1; for (let i = 1; i < 60 && free < 0; i++) { KK.fight.step(probe, [i === 1 ? BB.LT : 0, 0]); if (i > 1 && probe.f[0].state === 'idle') free = i + 1; }
  const pressAt = free - before;
  for (let i = 1; i <= free + 10; i++) KK.fight.step(g, [i === 1 ? BB.LT : i === pressAt ? BB.HV : 0, 0]);
  const heavy = g.events.find((e) => e.t === 'move' && e.move === 'heavy');
  return heavy ? heavy.frame - free : null;
}
function bufferOk(KK) { return { in3: bufferCase(KK, 3), in4: bufferCase(KK, 4), in5: bufferCase(KK, 5) }; }
const BF = bufferOk(K);
ok('R2.1 · THE 4-FRAME BUFFER: a heavy pressed 3 frames before the Hero is free comes out on its very first free frame; pressed 4 or 5 frames before, it has expired (' + J(BF) + ')',
  BF.in3 === 0 && BF.in4 === null && BF.in5 === null);
function holdOk(KK) { const g = KK.fight.newFight({ p0: 'box_surya', p1: 'box_surya' }); for (let i = 0; i < 120; i++) KK.fight.step(g, [KK.fight.BTN.LT, 0]); return g.events.filter((e) => e.t === 'move').length; }
ok('R2.2 · HOLDING a button presses it once: 120 frames held = ' + holdOk(K) + ' light', holdOk(K) === 1);
ok('R2.3 · a cancel pressed during hit-stop is still there when the freeze ends (light→heavy pressed on the hit frame)', J(cancelCase(K, 'light', 'heavy', 5)) === '["light","heavy"]');

console.log('\n── ARCADE-1 · R2 · the controls ──');
const CT = K.controls;
const dirs = [[60, 0, B.R], [42, -42, B.R | B.U], [0, -60, B.U], [-42, -42, B.U | B.L], [-60, 0, B.L], [-42, 42, B.L | B.D], [0, 60, B.D], [42, 42, B.D | B.R]];
ok('R2.4 · THE FLOATING STICK: 8 directions (screen up = jump), a ' + CT.DEADZONE + ' px dead zone in the middle (10 px → nothing, 20 px → a direction)',
  dirs.every(([x, y, b]) => CT.stickBits(x, y) === b) && CT.stickBits(10, 0) === 0 && CT.stickBits(-6, 8) === 0 && CT.stickBits(20, 0) === B.R);
ok('R2.5 · THE KEYBOARD: A/D/W/S and the arrows, J light, K heavy, L special, Shift block, U the throw (= J + K, ruling 3); both ways at once is neither', CT.keyBits({ KeyU: 1 }) === (B.LT | B.HV) && CT.keyBits({ KeyA: 1, KeyJ: 1 }) === (B.L | B.LT) &&
  CT.keyBits({ ArrowRight: 1, KeyK: 1, ShiftLeft: 1 }) === (B.R | B.HV | B.BL) && CT.keyBits({ KeyA: 1, KeyD: 1, KeyL: 1 }) === B.SP && CT.keyBits({ KeyW: 1, KeyS: 1 }) === 0);
ok('R2.6 · FIVE touch buttons (ruling 3): Light, Heavy, Special, Block and GRAB (= Light + Heavy, the throw); the grid puts Grab on the top row, never over Light or Heavy (the browser check at 640×360 is in the report)', J(CT.BUTTONS.map((b) => b.label)) === '["Light","Heavy","Special","Block","Grab"]' && CT.BUTTONS.every((b) => b.bit) &&
  CT.BUTTONS.find((b) => b.id === 'grab').bit === (B.LT | B.HV) && /grid-template-areas: "grab special block" ". light heavy"/.test(rd('ui/app.css')));
const css = rd('ui/app.css');
ok('R2.7 · LANDSCAPE ONLY (ruling 6): a portrait phone gets the rotate prompt over everything, and the match pauses when the phone turns',
  /@media \(orientation: portrait\)[^{]*\{\s*#rotate \{ display: flex; \}/.test(css) && /portrait\.addEventListener\("change"/.test(appSrc) && /Turn your phone sideways/.test(html));

console.log('\n── ARCADE-1 · R2 · the honest AI ──');
const OBS_KEYS = ['frame', 'timer', 'me', 'opp', 'myConnected', 'proj'];
function obsOk(KK) {
  const g = KK.fight.newFight({ p0: 'box_surya', p1: 'box_rakta' }); g.f[0].buf.heavy = 1; g.f[0].prev = 32;
  const o = KK.ai.observe(g, 1), flat = J(o);
  return { ok: J(Object.keys(o).sort()) === J(OBS_KEYS.slice().sort()) && J(Object.keys(o.opp).sort()) === J(KK.ai.PUBLIC.slice().sort()) && !/"buf"|"prev"|"input"|"hitDone"|"connected"/.test(flat), keys: Object.keys(o.opp) };
}
const OB = obsOk(K);
ok('R2.8 · THE AI SEES ONLY THE SCREEN: its picture is position, facing, health, meter, state and move frame of each fighter, the shots and the clock — never an input, a buffered press or the opponent\'s contact flag', OB.ok, J(OB.keys));
// behavioural: two fights identical on screen but with different hidden inputs for the human → the AI does the same thing
function blindOk(KK) {
  // one real fight; two AIs with the same seed. B is shown a copy whose HIDDEN fields (the player's buffered presses, last input,
  // contact flag) are different. If the AI sees only the screen, A and B decide the same thing on every frame.
  const BB = KK.fight.BTN, g = KK.fight.newFight({ p0: 'box_surya', p1: 'box_rakta' });
  const a = KK.ai.createAI('deathmatch', KK.rng.rng(3)), b = KK.ai.createAI('deathmatch', KK.rng.rng(3)), sr = KK.rng.rng(77);
  let same = true;
  for (let i = 0; i < 600 && !g.over; i++) {
    const twin = KK.fight.snapshot(g); twin.f[0].buf = { light: 1, heavy: 0, special: 2, up: -1 }; twin.f[0].prev = BB.HV | BB.SP; twin.f[0].connected = !g.f[0].connected;
    const da = KK.ai.decide(a, KK.ai.observe(g, 1)), db = KK.ai.decide(b, KK.ai.observe(twin, 1));
    if (da !== db) { same = false; break; }
    const keys = [0, BB.R, BB.L, BB.LT, BB.HV, BB.BL]; KK.fight.step(g, [keys[Math.floor(sr() * keys.length)], da]);
  }
  return same;
}
ok('R2.9 · …and it behaves the same when the player\'s hidden state differs: 600 frames of Death Match decisions, identical whether or not it is shown a different buffer, last input and contact flag', blindOk(K));
// reaction: an AI that always guards may not guard before its reaction time has passed
function reactionOk(KK, level) {
  const L = Object.assign({}, KK.ai.LEVELS[level], { block: 1, duck: 0, noise: 0 });
  const g = closeIn(KK, KK.fight.newFight({ p0: 'box_surya', p1: 'box_surya' }), 60), ai = KK.ai.createAI(L, KK.rng.rng(1));
  ai.nextAttack = 1e9;   // it never starts an attack of its own here: only its guard is measured
  const BB = KK.fight.BTN; let start = -1, guard = -1;
  for (let i = 0; i < 40; i++) {
    const b = KK.ai.decide(ai, KK.ai.observe(g, 1));
    if (start >= 0 && guard < 0 && ai.guardFor !== null && ai.guardChoice === 'guard' && (b & BB.R)) guard = g.frame;   // the frame it decides to guard THIS attack
    KK.fight.step(g, [i === 2 ? BB.HV : 0, b]);
    if (start < 0 && g.events.some((e) => e.t === 'move' && e.side === 0)) start = g.frame;
  }
  return { start, guard, delay: guard - start, want: L.reaction };
}
// passes when every level guards no sooner than its reaction time — and a level slower than the heavy's startup can't react at all
const reactionPass = (rx) => rx.every((x) => x.guard > 0 ? x.delay >= x.want : x.want >= MV.heavy.startup) && rx.some((x) => x.guard > 0);
const RX = ['beginner', 'advanced', 'deathmatch'].map((l) => ({ l, ...reactionOk(K, l) }));
ok('R2.10 · A HUMAN REACTION: a level decides to guard a heavy no sooner than its reaction time after the heavy starts (' +
  RX.map((x) => x.l + (x.guard > 0 ? ' ' + x.delay + ' ≥ ' + x.want : ' never in time: reacts in ' + x.want + ', the heavy lands in ' + MV.heavy.startup)).join(' · ') + ' frames)', reactionPass(RX), J(RX));
ok('R2.11 · NO STAT ADVANTAGE: the levels change how the AI plays, never health, damage or meter (no such key in any level)',
  Object.values(K.ai.LEVELS).every((L) => !Object.keys(L).some((k) => /hp|dmg|damage|meter|health|power/i.test(k))));
function seedOk(KK) { const a = playMatch(KK, LU, LU2, 'advanced', 'deathmatch', 42), b = playMatch(KK, LU, LU2, 'advanced', 'deathmatch', 42), c = playMatch(KK, LU, LU2, 'advanced', 'deathmatch', 43); return KK.fight.hash(a) === KK.fight.hash(b) && KK.fight.hash(a) !== KK.fight.hash(c); }
ok('R2.12 · A SEED REPLAYS A WHOLE MATCH: AI vs AI best-of-three, same seed → the same match; another seed → another', seedOk(K));

console.log('\n── ARCADE-1 · R2 · the AI ladder and the mirror (headless) ──');
const HEROES = ['box_surya', 'box_rakta', 'box_varna'];
function roundsWon(KK, x, y, n) {   // round-level win share of level x over y; seats alternate; Heroes rotate (always a mirror Hero)
  let wx = 0, wy = 0, draws = 0, seat0 = 0, decidedN = 0;
  for (let s = 0; s < n; s++) {
    const h = HEROES[s % 3], seat = s % 2, r = KK.rng.rng(1000 + s);
    const o = { round: s % 3 };   // rounds 1–3 in turn (the Beginner holds its special in round 1)
    const ai = seat ? [KK.ai.createAI(y, r, o), KK.ai.createAI(x, r, o)] : [KK.ai.createAI(x, r, o), KK.ai.createAI(y, r, o)];
    const g = KK.fight.newFight({ p0: h, p1: h });
    while (!g.over) KK.fight.step(g, [KK.ai.decide(ai[0], KK.ai.observe(g, 0)), KK.ai.decide(ai[1], KK.ai.observe(g, 1))]);
    if (g.winner === null) { draws++; continue; }
    decidedN++; if (g.winner === 0) seat0++;
    if ((g.winner === 0) !== !!seat) wx++; else wy++;
  }
  return { pct: 100 * wx / (wx + wy), wx, wy, draws, seat0: 100 * seat0 / decidedN };
}
const N = 400, t0 = Date.now();
function ladder(KK) {
  return { advBeg: roundsWon(KK, 'advanced', 'beginner', N), dmAdv: roundsWon(KK, 'deathmatch', 'advanced', N), dmBeg: roundsWon(KK, 'deathmatch', 'beginner', N), mirror: roundsWon(KK, 'advanced', 'advanced', N) };
}
const LD = ladder(K);
const f1 = (x) => x.toFixed(1) + '%';
ok('R2.13 · THE LADDER is in order (' + N + ' rounds each, seats alternated): Advanced beats Beginner ' + f1(LD.advBeg.pct) + ' (≥70), Death Match beats Advanced ' + f1(LD.dmAdv.pct) +
  ' (≥60), Death Match beats Beginner ' + f1(LD.dmBeg.pct) + ' (≥80)', LD.advBeg.pct >= 70 && LD.dmAdv.pct >= 60 && LD.dmBeg.pct >= 80);
ok('R2.14 · THE MIRROR is fair: Advanced vs Advanced ' + f1(LD.mirror.pct) + ' (45–55), and neither seat is favoured (side 0 wins ' + f1(LD.mirror.seat0) + ', 44–56)',
  LD.mirror.pct >= 45 && LD.mirror.pct <= 55 && LD.mirror.seat0 >= 44 && LD.mirror.seat0 <= 56);
console.log('      (ladder ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s · draws ' + [LD.advBeg, LD.dmAdv, LD.dmBeg, LD.mirror].map((x) => x.draws).join('/') + ')');

console.log('\n── ARCADE-1 · R2 · breakages: each must go red ──');
const BR2 = [
  ['H1 · the AI handed the player\'s buffered presses — and using them (R2.8 and R2.9 go red)', { ai: [['var PUBLIC = ["x", "y", "facing", "hp", "hpMax", "meter", "state", "move", "mf", "arch"];', 'var PUBLIC = ["x", "y", "facing", "hp", "hpMax", "meter", "state", "move", "mf", "arch", "buf"];'],
    ['if (me.state === "ko" || me.state === "win") return finish(ai, 0);', 'if (me.state === "ko" || me.state === "win") return finish(ai, 0); if (obs.opp.buf && obs.opp.buf.heavy >= 0) return finish(ai, back);']] },
    (KK) => obsOk(KK).ok && blindOk(KK)],
  ['H2 · the reaction delay removed: the AI reacts on the frame the attack starts (R2.10 goes red)', { ai: [['if (ai.hist.length > ai.L.reaction + 1) ai.hist.shift();', 'while (ai.hist.length > 1) ai.hist.shift();']] },
    (KK) => reactionPass(['beginner', 'advanced', 'deathmatch'].map((l) => reactionOk(KK, l)))],
  ['H3 · the 4-frame buffer gone: a press counts only on its own frame (R2.1 goes red)', { fight: [['var BUFFER = 4;', 'var BUFFER = 1;']] }, (KK) => bufferOk(KK).in3 === 0],
  ['H4 · Beginner and Death Match swapped (R2.13 goes red)', { ai: [['beginner:   {', 'deathmatchX: {'], ['deathmatch: {', 'beginner:   {'], ['deathmatchX: {', 'deathmatch: {']] },
    (KK) => { const a = roundsWon(KK, 'advanced', 'beginner', 120), b = roundsWon(KK, 'deathmatch', 'advanced', 120); return a.pct >= 70 && b.pct >= 60; }],
  ['H5 · a seat advantage: side 0 deals double damage (R2.14 goes red)', { fight: [['var dmg = Math.floor(m.dmg * h.mul / 100);', 'var dmg = Math.floor(m.dmg * h.mul / 100) * (att.side === 0 ? 2 : 1);']] },
    (KK) => { const m = roundsWon(KK, 'advanced', 'advanced', 160); return m.seat0 >= 44 && m.seat0 <= 56; }],
  ['H6 · the stick dead zone removed: a resting thumb walks (R2.4 goes red)', { controls: [['var DEADZONE = 18;', 'var DEADZONE = 0;']] }, (KK) => KK.controls.stickBits(10, 0) === 0 && KK.controls.stickBits(-6, 8) === 0],
  ['H7 · a stat advantage for Death Match (R2.11 goes red)', { ai: [['deathmatch: { reaction: 9,', 'deathmatch: { hpBonus: 200, reaction: 9,']] }, (KK) => Object.values(KK.ai.LEVELS).every((L) => !Object.keys(L).some((k) => /hp|dmg|damage|meter|health|power/i.test(k)))]
];
for (const [name, mut, check] of BR2) { let still; try { still = check(load(mut)); } catch (e) { still = false; } red(name, !still); }

// ═══ RULINGS 5 + 6 (owner, 2026-11-04): the 15-move template (10b knockdown + get-up, 13 parry, 14 throw) and the gentler Beginner ═══
console.log('\n── ARCADE-1 · ruling 5 · the 15-move template: knockdown + get-up, parry, throw ──');
const ev = (g, t) => g.events.filter((e) => e.t === t);
function tmplOk(KK) {
  const C = KK.moves.CELLS, T = KK.moves.MOVES.throw, KD = KK.moves.KNOCKDOWN, PA = KK.moves.PARRY;
  return Object.keys(C).length === 15 && KK.moves.CLIPS.length === 15 && ['10b_knockdown', '13_parry', '14_throw'].every((c) => KK.moves.CLIPS.includes(c)) &&
    ['knockdown', 'parry', 'throw'].every((k) => C[k] > 0) && !!(T && T.hold && T.range && KD && KD.fall && KD.getup && PA && PA.window && PA.lockout);
}
const T5 = K.moves.MOVES.throw, KD5 = K.moves.KNOCKDOWN, PA5 = K.moves.PARRY;
ok('N1 · THE TEMPLATE HAS 15 MOVES (' + K.moves.CLIPS.join(' ') + '), with proposed frame data: throw ' + T5.startup + '/' + T5.active + '/' + T5.recovery + ' (whiff), range ' + T5.range + ' px, hold ' + T5.hold + ' (the tech window), ' + T5.dmg + ' dmg; knockdown ' + KD5.fall + ' + get-up ' + KD5.getup + ' frames, invulnerable; parry window ' + PA5.window + ', lockout ' + PA5.lockout + ', attacker stunned ' + PA5.stunAttacker + ', parrier recovers ' + PA5.recovery, tmplOk(K));

function knockdownOk(KK) {
  const BB = KK.fight.BTN, KD = KK.moves.KNOCKDOWN, out = {};
  const combo = closeIn(KK, KK.fight.newFight({ p0: 'box_surya', p1: 'box_surya' }), 60);
  let idleAt = -1;
  for (let i = 0; i < 120; i++) { KK.fight.step(combo, [i === 0 ? BB.LT : i === 8 ? BB.HV : 0, 0]); if (idleAt < 0 && ev(combo, 'getup').length && combo.f[1].state === 'idle') idleAt = combo.frame; }
  const kd = ev(combo, 'knockdown')[0], up = ev(combo, 'getup')[0];
  out.combo = !!kd && kd.move === 'heavy';
  out.fall = kd && up ? up.frame - kd.frame : null;          // the heavy's hit-stop, then the fall
  out.getup = up ? idleAt - up.frame : null;
  const raw = closeIn(KK, KK.fight.newFight({ p0: 'box_surya', p1: 'box_surya' }), 60);
  for (let i = 0; i < 60; i++) KK.fight.step(raw, [i === 0 ? BB.HV : 0, 0]);
  out.rawHeavy = ev(raw, 'hit').length === 1 && ev(raw, 'knockdown').length === 0;
  out.special = ['box_surya', 'box_rakta'].every((h) => { const g = closeIn(KK, KK.fight.newFight({ p0: h, p1: 'box_surya' }), 150); g.f[0].meter = 100; for (let i = 0; i < 90; i++) KK.fight.step(g, [i === 0 ? BB.SP : 0, 0]); return ev(g, 'knockdown').some((e) => e.move === 'special'); });
  out.ok = out.combo && out.fall === KK.moves.MOVES.heavy.hitstop + KD.fall && out.getup === KD.getup && out.rawHeavy && out.special;
  return out;
}
const KDO = knockdownOk(K);
ok('N2 · 10b KNOCKDOWN: a heavy that finishes a light→heavy combo knocks down, a raw heavy does not; a special (shot or charge) knocks down; down ' + KDO.fall + ' frames (hit-stop + ' + KD5.fall + '), rising ' + KDO.getup + ', then free', KDO.ok, J(KDO));
function invulOk(KK) {
  const BB = KK.fight.BTN, g = closeIn(KK, KK.fight.newFight({ p0: 'box_surya', p1: 'box_surya' }), 60);
  for (let i = 0; i < 20; i++) KK.fight.step(g, [i === 0 ? BB.LT : i === 8 ? BB.HV : 0, 0]);
  let duringHits = 0, duringGrabs = 0, afterHits = 0, wasDown = false;
  for (let i = 0; i < 160; i++) {
    const down = !!KK.fight.INVUL[g.f[1].state] && g.f[1].state !== 'grabbed'; if (down) wasDown = true;
    const n = g.events.length, d = Math.abs(g.f[1].x - g.f[0].x) / KK.fight.U;
    KK.fight.step(g, [d > 70 ? BB.R : (i % 4 === 0 ? BB.LT : i % 4 === 2 ? BB.LT | BB.HV : 0), 0]);   // walk in, then light and throw attempts
    const fresh = g.events.slice(n);
    if (down) { duringHits += fresh.filter((e) => e.t === 'hit').length; duringGrabs += fresh.filter((e) => e.t === 'grab').length; }
    else if (wasDown) afterHits += fresh.filter((e) => e.t === 'hit' || e.t === 'grab').length;
  }
  return { ok: wasDown && duringHits === 0 && duringGrabs === 0 && afterHits > 0, duringHits, duringGrabs, afterHits };
}
const INV = invulOk(K);
ok('N3 · THE WAKE-UP IS INVULNERABLE: while down and rising nothing lands — 0 hits, 0 grabs from an opponent pressing light and throw over it — and the first attack after the get-up lands (' + INV.afterHits + ')', INV.ok, J(INV));
function parryWindow(KK) {   // a heavy from side 0 at i = 0; side 1 taps Block at i = at → which taps parry?
  const BB = KK.fight.BTN, hit = [];
  for (let at = 0; at < 16; at++) {
    const g = closeIn(KK, KK.fight.newFight({ p0: 'box_surya', p1: 'box_surya' }), 60);
    for (let i = 0; i < 40; i++) KK.fight.step(g, [i === 0 ? BB.HV : 0, i === at ? BB.BL : 0]);
    if (ev(g, 'parry').length) hit.push(at);
  }
  return hit;
}
function parryOk(KK) {
  const BB = KK.fight.BTN, win = parryWindow(KK), impact = KK.moves.MOVES.heavy.startup;
  const g = closeIn(KK, KK.fight.newFight({ p0: 'box_surya', p1: 'box_surya' }), 60), hp0 = g.f[1].hp;
  let parried = -1, free1 = -1, free0 = -1, punish = null;
  for (let i = 0; i < 90; i++) {
    const st1 = g.f[1].state, st0 = g.f[0].state;
    KK.fight.step(g, [i === 0 ? BB.HV : (st0 !== 'parried' && parried >= 0 ? BB.L : 0), i === impact - 2 ? BB.BL : (parried >= 0 && st1 !== 'parry' && !punish ? BB.HV : 0)]);   // side 0 tries to back off the moment it can; side 1 punishes with a heavy
    if (parried < 0 && ev(g, 'parry').length) parried = g.frame;
    if (parried >= 0 && free1 < 0 && KK.fight.actionable(g.f[1])) free1 = g.frame;
    if (parried >= 0 && free0 < 0 && KK.fight.actionable(g.f[0])) free0 = g.frame;
    if (!punish) punish = g.events.find((e) => e.t === 'hit' && e.side === 0) || null;
  }
  return { win, contiguous: win.length === KK.moves.PARRY.window && win[win.length - 1] - win[0] === win.length - 1 && win[win.length - 1] === impact,
    noDamage: g.f[1].hp - hp0 >= 0 && ev(g, 'parry')[0].proj === false, advantage: free0 - free1, punish: punish && punish.move,
    ok: false };
}
const PAR = parryOk(K); PAR.ok = PAR.contiguous && PAR.noDamage && PAR.advantage >= 0 && PAR.punish === 'counter';   // ruling 5, third set: the punish IS the automatic counter
function KK_heavyStartup() { return K.moves.MOVES.heavy.startup; }
ok('N4 · 13 THE PARRY: a fresh Block tap parries only inside its window — taps ' + PAR.win.length + ' frames before impact through the impact frame (' + J(PAR.win) + ', the heavy lands at ' + MV.heavy.startup + '); no damage; the punish is the automatic counter (the first hit on the attacker is \'' + PAR.punish + '\', though it backs off at once), and the parrier is still free ' + PAR.advantage + ' frames before the attacker after it', PAR.ok, J(PAR));
function counterOk(KK, hero) {   // 13b: a parried blow is answered by the automatic counter — guaranteed, a landed hit's damage and meter
  const BB = KK.fight.BTN, C = KK.moves.MOVES.counter, h = hero || 'box_surya';
  const g = closeIn(KK, KK.fight.newFight({ p0: 'box_surya', p1: h }), 60), m0 = [g.f[0].meter, g.f[1].meter], hp0 = g.f[0].hp;
  let stunnedAtHit = null;
  for (let i = 0; i < 90; i++) { KK.fight.step(g, [i === 0 ? BB.HV : (g.f[0].state === 'parried' ? 0 : BB.L), i === 10 ? BB.BL : 0]); const hit = g.events.find((e) => e.t === 'hit' && e.move === 'counter'); if (hit && stunnedAtHit === null) stunnedAtHit = hit.frame; }
  const hit = g.events.find((e) => e.t === 'hit' && e.move === 'counter'), parry = g.events.find((e) => e.t === 'parry');
  const shot = KK.fight.newFight({ p0: 'box_surya', p1: h }); shot.f[0].meter = 100;
  for (let i = 0; i < 90; i++) { const p = shot.proj[0], gap = p ? Math.abs(p.x - shot.f[1].x) / KK.fight.U : 1e9; KK.fight.step(shot, [i === 0 ? BB.SP : 0, p && gap < 60 && gap > 40 ? BB.BL : 0]); }
  return { ok: !!parry && !!hit && hp0 - g.f[0].hp === Math.floor(C.dmg * KK.moves.ARCH[KK.moves.HEROES[h].arch].dmg / 100) && g.f[1].meter - m0[1] === KK.moves.METER.onHit && g.f[0].meter - m0[0] === KK.moves.METER.onTaken &&
    hit.frame - parry.frame === KK.moves.PARRY.hitstop + KK.moves.PARRY.recovery + C.startup && shot.events.some((e) => e.t === 'parry') && !shot.events.some((e) => e.t === 'move' && e.move === 'counter'),
    dmg: hp0 - g.f[0].hp, after: hit && parry ? hit.frame - parry.frame : null, shotParried: shot.events.some((e) => e.t === 'parry') };
}
const CO = counterOk(K);
ok('N4b · 13b THE AUTOMATIC COUNTER (ruling 5, third set): a parried blow is answered, ' + CO.after + ' frames after the parry (hit-stop ' + PA5.hitstop + ' + deflect ' + PA5.recovery + ' + startup ' + K.moves.MOVES.counter.startup + '), by a guaranteed lunge — ' + CO.dmg + ' damage, meter +8 / +5 like a landed hit — even though the attacker tries to back away; a parried SHOT gets no counter',
  CO.ok, J(CO));
function spamOk(KK) {
  const BB = KK.fight.BTN, g = KK.fight.newFight({ p0: 'box_surya', p1: 'box_surya' });
  let windows = 0, presses = 0;
  for (let i = 0; i < 240; i++) { const b = i % 2 === 0 ? BB.BL : 0; if (b) presses++; const w0 = g.f[1].parryWin; KK.fight.step(g, [0, b]); if (g.f[1].parryWin === 0 && w0 !== 0) windows++; }
  // and in a fight: side 1 mashes Block against a stream of heavies — at most a few are parried
  const f = closeIn(KK, KK.fight.newFight({ p0: 'box_surya', p1: 'box_surya' }), 60); let heavies = 0;
  for (let i = 0; i < 600; i++) { if (f.f[0].state === 'idle' && i % 7 === 0) heavies++; KK.fight.step(f, [f.f[0].state === 'idle' && i % 7 === 0 ? BB.HV : 0, i % 2 === 0 ? BB.BL : 0]); }
  return { windows, presses, cap: Math.ceil(240 / KK.moves.PARRY.lockout), parried: ev(f, 'parry').length, heavies: ev(f, 'move').filter((e) => e.side === 0).length, ok: windows <= Math.ceil(240 / KK.moves.PARRY.lockout) };
}
const SPM = spamOk(K);
ok('N5 · THE PARRY CAN\'T BE SPAMMED: mashing Block (' + SPM.presses + ' presses in 4 s) opens only ' + SPM.windows + ' windows (≤ ' + SPM.cap + ': one per ' + PA5.lockout + '-frame lockout); against a stream of ' + SPM.heavies + ' heavies a masher parries ' + SPM.parried, SPM.ok && SPM.parried < SPM.heavies / 2, J(SPM));
function throwCase(KK, p0, guard, dist, jump) {
  const BB = KK.fight.BTN, g = closeIn(KK, KK.fight.newFight({ p0: p0 || 'box_surya', p1: 'box_surya' }), dist || 70), hp0 = g.f[1].hp;
  let backAt = -1;
  for (let i = 0; i < 70; i++) { KK.fight.step(g, [i === 0 ? BB.LT | BB.HV : 0, jump && i === 0 ? BB.U : guard]); if (backAt < 0 && i > 0 && g.f[0].state === 'idle') backAt = i; }
  return { dmg: hp0 - g.f[1].hp, grab: ev(g, 'grab').length, down: ev(g, 'knockdown').some((e) => e.move === 'throw'), backAt };
}
function throwOk(KK) {
  const BB = KK.fight.BTN, T = KK.moves.MOVES.throw;
  const r = { block: throwCase(KK, null, BB.BL), back: throwCase(KK, null, BB.R), crouch: throwCase(KK, null, BB.D | BB.R), stand: throwCase(KK, null, 0),
    far: throwCase(KK, null, 0, 160), jump: throwCase(KK, null, 0, 70, true), rush: throwCase(KK, 'box_rakta', BB.BL) };
  r.ok = ['block', 'back', 'crouch', 'stand'].every((k) => r[k].dmg === T.dmg && r[k].down) && r.far.grab === 0 && r.far.backAt === T.startup + T.active + T.recovery &&
    r.jump.grab === 0 && r.rush.dmg === Math.floor(T.dmg * 1.08);
  return r;
}
const THR = throwOk(K);
ok('N6 · 14 THE THROW: unblockable — it takes an opponent holding Block, holding back, or crouch-blocking (' + T5.dmg + ' each, then a knockdown); out of range it whiffs and the thrower is stuck ' + THR.far.backAt + ' frames; a jump escapes it; the archetype\'s damage applies (rushdown ' + THR.rush.dmg + ')', THR.ok, J(THR));
function techWindow(KK) {
  const BB = KK.fight.BTN, out = [];
  let grabAt = -1;
  for (let at = 0; at < 20; at++) {
    const g = closeIn(KK, KK.fight.newFight({ p0: 'box_surya', p1: 'box_surya' }), 70);
    for (let i = 0; i < 50; i++) { KK.fight.step(g, [i === 0 ? BB.LT | BB.HV : 0, i === at ? BB.LT | BB.HV : 0]); if (at === 19 && grabAt < 0 && ev(g, 'grab').length) grabAt = i; }
    if (ev(g, 'tech').length && !ev(g, 'hit').length && ev(g, 'grab').length) out.push(at);
  }
  return { win: out, grabAt };
}
const TW = techWindow(K);
ok('N7 · THE THROW-TECH: Light + Heavy during the ' + T5.hold + '-frame hold breaks the throw (no damage, both pushed apart): presses at ' + J(TW.win) + ' after the throw input (the grab lands at ' + TW.grabAt + ', so: the ' + TW.win.length + ' frames after it) — a tight window; earlier, the press starts a throw of its own and is taken in its startup; later, the throw has landed',
  TW.win.length === T5.hold && TW.win[0] === TW.grabAt + 1 && TW.win[TW.win.length - 1] - TW.win[0] === T5.hold - 1, J(TW));

console.log('\n── ARCADE-1 · rulings 5 + 6 · the AI with the new moves, the gentler Beginner ──');
function aiMoves(KK, x, y, n) {   // what each level does with the new moves over n fights (Heroes rotate, seats alternate, rounds 1–3 in turn)
  const st = { x: { parry: 0, throw: 0, tech: 0, special0: 0, gaps: [] }, y: { parry: 0, throw: 0, tech: 0, special0: 0, gaps: [] } };
  for (let s = 0; s < n; s++) {
    const h = HEROES[s % 3], seat = s % 2, r = KK.rng.rng(5000 + s), o = { round: s % 3 };
    const ai = seat ? [KK.ai.createAI(y, r, o), KK.ai.createAI(x, r, o)] : [KK.ai.createAI(x, r, o), KK.ai.createAI(y, r, o)];
    const g = KK.fight.newFight({ p0: h, p1: h });
    while (!g.over) KK.fight.step(g, [KK.ai.decide(ai[0], KK.ai.observe(g, 0)), KK.ai.decide(ai[1], KK.ai.observe(g, 1))]);
    const sx = seat ? 1 : 0, who = (side) => (side === sx ? st.x : st.y), last = {};
    for (const e of g.events) {
      if (e.t === 'parry') who(e.side).parry++;
      if (e.t === 'tech') who(e.side).tech++;
      if (e.t === 'move' && e.move === 'throw') who(e.side).throw++;
      if (e.t === 'move' && e.move === 'counter') who(e.side).counter = (who(e.side).counter || 0) + 1;
      if (e.t === 'move' && e.move === 'special' && o.round === 0) who(e.side).special0++;
      if (e.t === 'move') { if (last[e.side] != null) who(e.side).gaps.push(e.frame - last[e.side]); last[e.side] = e.frame; }
    }
  }
  return st;
}
const AB = aiMoves(K, 'beginner', 'advanced', 120), AD = aiMoves(K, 'beginner', 'deathmatch', 120), AA = aiMoves(K, 'advanced', 'deathmatch', 200);
const sumB = (k) => AB.x[k] + AD.x[k];
ok('N8 · THE BEGINNER NEVER PARRIES (so never counters), THROWS OR TECHS (240 fights against Advanced and Death Match: ' + sumB('parry') + ' / ' + sumB('throw') + ' / ' + sumB('tech') + ', counters ' + ((AB.x.counter || 0) + (AD.x.counter || 0)) + '), while the others use the new moves against each other (200 fights: Advanced ' + AA.x.parry + ' parries → ' + (AA.x.counter || 0) + ' counters, ' + AA.x.throw + ' throws, ' + AA.x.tech + ' techs; Death Match ' + AA.y.parry + ' → ' + (AA.y.counter || 0) + ' / ' + AA.y.throw + ' / ' + AA.y.tech + ')',
  sumB('parry') === 0 && sumB('throw') === 0 && sumB('tech') === 0 && !(AB.x.counter || AD.x.counter) && AA.x.counter > 0 && AA.y.counter > 0 && AA.x.parry > 0 && AA.x.throw > 0 && AA.y.parry > 0 && AA.y.throw > 0 && AA.x.tech + AA.y.tech > 0);
function gentleOk(KK) {
  const L = KK.ai.LEVELS.beginner, st = aiMoves(KK, 'beginner', 'advanced', 120).x;
  const minGap = Math.min(...st.gaps);
  return { ok: L.reaction === 27 && L.block === 0.10 && L.cancel === 0 && J(L.attackGap) === '[24,48]' && L.specialFrom === 1 && L.parry === 0 && L.throw === 0 && L.tech === 0 &&
    st.special0 === 0 && minGap >= 24, special0: st.special0, minGap };
}
const GEN = gentleOk(K);
ok('N9 · THE GENTLER BEGINNER (ruling 6): reacts in 27 frames (450 ms), blocks 10%, never cancels or chains, waits 24–48 frames (0.4–0.8 s) between attacks — the shortest gap between its moves in 120 fights is ' + GEN.minGap + ' frames — and uses no special in round 1 (' + GEN.special0 + ' in the round-1 fights)', GEN.ok, J(GEN));
// a stand-in for a new player: slow (400 ms), blocks a quarter of the time, rarely cancels, never parries or throws on purpose
const NOVICE = { reaction: 24, block: 0.25, duck: 0.05, jumpProj: 0.2, cancel: 0.1, special: 0.4, attackGap: [18, 40], noise: 0.25, spacing: 0.4, parry: 0, throw: 0, tech: 0, specialFrom: 0 };
const NV = roundsWon(K, NOVICE, 'beginner', N), NVA = roundsWon(K, NOVICE, 'advanced', 200);
ok('N10 · NEW PLAYERS WIN MOST ROUNDS against the Beginner: a new-player stand-in (reaction 400 ms, blocks 25%, rarely cancels, no parry or throw) wins ' + f1(NV.pct) + ' of ' + N + ' rounds (target > 50) — and only ' + f1(NVA.pct) + ' against Advanced, so the stand-in is not simply strong', NV.pct > 50 && NVA.pct < 50, J({ NV, NVA }));

console.log('\n── ARCADE-1 · rulings 5 + 6 · breakages: each must go red ──');
const BR5 = [
  ['Y1 · the wake-up NOT invulnerable (N3 goes red)', { fight: [['var INVUL = { knockdown: 1, getup: 1, grab: 1, grabbed: 1 };', 'var INVUL = { grab: 1, grabbed: 1 };']] }, (KK) => invulOk(KK).ok],
  ['Y2 · the parry window doubled to 12 frames (N4 goes red)', { moves: [['var PARRY = { window: 6,', 'var PARRY = { window: 12,']] }, (KK) => { const w = parryWindow(KK); return w.length === 6; }],
  ['Y3 · the parry lockout removed: mashing parries everything (N5 goes red)', { fight: [['if ((inp & BTN.BL) && !(f.prev & BTN.BL) && f.parryLock <= 0)', 'if ((inp & BTN.BL) && !(f.prev & BTN.BL))']] }, (KK) => { const s = spamOk(KK); return s.ok && s.parried < s.heavies / 2; }],
  ['Y4 · the throw blockable: a blocking opponent cannot be thrown (N6 goes red)', { fight: [['var UNTHROWABLE = { hitstun: 1,', 'var UNTHROWABLE = { block: 1, cblock: 1, hitstun: 1,']] }, (KK) => throwOk(KK).ok],
  ['Y5 · the throw-tech removed (N7 goes red)', { fight: [['if (has(def, "light") && has(def, "heavy")) { def.buf.light = -1; def.buf.heavy = -1; techBoth(g, att, def); return; }', '']] }, (KK) => techWindow(KK).win.length === K.moves.MOVES.throw.hold],
  ['Y6 · a Beginner that throws and parries (N8 goes red)', { ai: [['parry: 0, throw: 0, tech: 0, specialFrom: 1', 'parry: 0.3, throw: 0.4, tech: 0, specialFrom: 1']] }, (KK) => { const s = aiMoves(KK, 'beginner', 'advanced', 60).x; return s.parry === 0 && s.throw === 0; }],
  ['Y7 · the Beginner\'s special allowed in round 1 (N9 goes red)', { ai: [['tech: 0, specialFrom: 1 }', 'tech: 0, specialFrom: 0 }']] }, (KK) => gentleOk(KK).ok],
  ['Y8 · the old Beginner back (reaction 18, blocks 40%, cancels, short gaps) (N9 goes red)', { ai: [['beginner:   { reaction: 27, block: 0.10, duck: 0.05, jumpProj: 0.15, cancel: 0, special: 0.5, attackGap: [24, 48]', 'beginner:   { reaction: 18, block: 0.40, duck: 0.10, jumpProj: 0.25, cancel: 0.15, special: 0.5, attackGap: [16, 40]']] }, (KK) => gentleOk(KK).ok],
  ['Y10 · the counter never armed: a parry with no answer (N4b goes red)', { fight: [['def.counterArmed = !h.proj;', 'def.counterArmed = false;']] }, (KK) => counterOk(KK).ok],
  ['Y11 · the counter armed after a parried shot too (N4b goes red)', { fight: [['def.counterArmed = !h.proj;', 'def.counterArmed = true;']] }, (KK) => counterOk(KK).ok],
  ['Y12 · the counter boxed like an ordinary move: no guarantee (N4b goes red)', { fight: [['if (att.state === "attack" && att.move === "counter" && isActive(att) && !att.hitDone && def.state === "parried")', 'if (false)']] }, (KK) => counterOk(KK).ok],
  ['Y9 · a heavy that never knocks down, even as a combo finisher (N2 goes red)', { fight: [['(h.name === "heavy" && h.wasStun)', 'false']] }, (KK) => knockdownOk(KK).ok]
];
for (const [name, mut, check] of BR5) { let still; try { still = check(load(mut)); } catch (e) { still = false; } red(name, !still); }


if (RUNG < 3) return finish();
// ═══ R3 · THE FIGHTERS (2026-11-04): Indra's full moveset cut from his 13 Kling clips; Meghnad's idle + light as placeholders ═══
console.log('\n── ARCADE-1 · R3 · the fighters: pages, KTX2, the cut ──');
const HEROS = ['indra', 'meghnad'];
const MAN = {}; HEROS.forEach((h) => { MAN[h] = JSON.parse(rd('fighters/' + h + '/manifest.json')); });
const DLCAP = { hi: 1.6 * 1048576, lo: 0.7 * 1048576 }, SIDE = { hi: 4096, lo: 2048 };
function sheetsOk(man) {   // every page inside its rung, sides a multiple of 4 (a compressed block), WebP and KTX2 on disk at their recorded size; every cell inside its page, its feet pivot on its bottom edge and within a quarter-width of the cell (the win steps forward of the stance)
  const errs = [];
  for (const r of ['hi', 'lo']) {
    const R = man.rungs[r];
    R.pages.forEach((p, n) => {
      if (p.size[0] > SIDE[r] || p.size[1] > SIDE[r] || p.size[0] % 4 || p.size[1] % 4) errs.push(r + ' page ' + n + ' size');
      for (const k of ['webp', 'ktx2']) { const f = path.join(LAB, 'fighters', man.hero, p[k]); if (!fs.existsSync(f) || fs.statSync(f).size !== p.bytes[k]) errs.push(r + ' ' + p[k]); }
    });
    R.cells.forEach((c, i) => { const p = R.pages[c.page]; if (!p || c.x < 0 || c.y < 0 || c.x + c.w > p.size[0] || c.y + c.h > p.size[1] || c.px < -0.25 * c.w || c.px > 1.25 * c.w || c.py < c.h - 4 || (c.py > c.h + 4 && man.cellsMove[i] !== 'knockdown')) errs.push(r + ' cell ' + i); });   // the knockdown's flight is airborne: its pivot (the ground) sits below the cell
  }
  return errs;
}
const mb = (b) => (b / 1048576).toFixed(2) + ' MB';
const ktx = (h, r) => MAN[h].rungs[r].pages.reduce((a, p) => a + p.bytes.ktx2, 0);
const SE = HEROS.map((h) => ({ h, e: sheetsOk(MAN[h]) }));
ok('C1 · THE PAGES (ruling 1): each fighter\'s cells on pages inside the rung (hi ≤ 4096², lo ≤ 2048²), sides a multiple of 4, each page as WebP (the fallback) and KTX2 — ' +
  HEROS.map((h) => MAN[h].name + ' hi ' + MAN[h].rungs.hi.pages.length + ' page(s) ' + MAN[h].rungs.hi.encoding.chosen + ' ' + mb(ktx(h, 'hi')) + ' (WebP ' + mb(MAN[h].rungs.hi.pages.reduce((a, p) => a + p.bytes.webp, 0)) + '), lo ' + MAN[h].rungs.lo.pages.length + ' ' + MAN[h].rungs.lo.encoding.chosen + ' ' + mb(ktx(h, 'lo'))).join(' · '),
  SE.every((x) => !x.e.length), J(SE.filter((x) => x.e.length)));
const ENCH = MAN.indra.rungs;
ok('C1b · THE ENCODING (owner ruling 1, third set): ETC1S on both rungs, UASTC off — every fighter\'s pages ETC1S, and Indra\'s full cut inside each fighter\'s download cap (hi ' + mb(ktx('indra', 'hi')) + ' of 1.6 MB at ' + ENCH.hi.encoding.candidates[0].psnr + ' dB, lo ' + mb(ktx('indra', 'lo')) + ' of 0.7 MB at ' + ENCH.lo.encoding.candidates[0].psnr + ' dB)',
  HEROS.every((h) => ['hi', 'lo'].every((r) => MAN[h].rungs[r].encoding.chosen === 'etc1s')) && ['hi', 'lo'].every((r) => ktx('indra', r) <= DLCAP[r]));
function decodeOk(h) {   // every KTX2 page decodes with the LAB'S transcoder copy to its recorded size, and transcodes to ASTC, BC7 and ETC2
  const out = [];
  for (const r of ['hi', 'lo']) for (const p of MAN[h].rungs[r].pages) for (const fmt of ['rgba', 'astc', 'bc7', 'etc2']) {
    let o = ''; try { o = cp.execFileSync('node', [path.join(LAB, 'tools/ktx2_decode.js'), path.join(LAB, 'fighters', h, p.ktx2), '', fmt], { encoding: 'utf8' }).trim(); } catch (e) { o = 'ERR'; }
    if (o.split(' ').slice(0, 2).join('x') !== p.size.join('x')) out.push(h + ' ' + p.ktx2 + ' ' + fmt + ': ' + o);
  }
  return out;
}
const DEC = HEROS.flatMap(decodeOk);
ok('C1c · EVERY KTX2 PAGE DECODES with the lab\'s own transcoder (runtime/basis/, the page\'s copy) and transcodes to ASTC 4×4, BC7 and ETC2 RGBA — the formats phones and desktops take', DEC.length === 0, DEC);
const COPYB = JSON.parse(rd('runtime/COPY.json')).files.find((f) => f.to === 'runtime/basis/');
ok('C1d · THE TRANSCODER COPY is recorded: runtime/basis/ matches the sha256 in runtime/COPY.json (copied from the owner\'s purr-brawl three.js r146, owner-approved)',
  !!COPYB && ['basis_transcoder.js', 'basis_transcoder.wasm'].every((f) => sha(path.join(LAB, 'runtime/basis', f)) === COPYB.sha256[f]));
ok('C2 · ONE STANCE HEIGHT, ONE GROUND LINE: both Heroes\' stance 320 px hi / 192 lo (' + HEROS.map((h) => MAN[h].name + ' ' + MAN[h].stance.sourceHeight + ' px source').join(', ') + '); each of Indra\'s clips registered to the stance by its own frame 0 (' +
  Object.entries(MAN.indra.sources).filter(([, s]) => Math.abs(s.registration[0]) > 1.5).map(([k, s]) => k + ' ' + s.registration[0] + ' px').join(', ') + ' shifted back)', HEROS.every((h) => MAN[h].stance.heightPx.hi === 320 && MAN[h].stance.heightPx.lo === 192));
const A = MAN.indra.anim, NCELL = MAN.indra.rungs.hi.cells.length;
const ANIM_KEYS = ['idle', 'walk', 'jump', 'crouch', 'light', 'heavy', 'special', 'block', 'hitLight', 'hitHeavy', 'knockdown', 'getup', 'ko', 'win', 'parry', 'counter', 'throw', 'throwGrab', 'throwHit'];
const animCells = (a) => [].concat(a.loop || [], a.span || [], a.enter || [], a.hold || [], ...(a.phases ? Object.values(a.phases).map((L) => L.map((x) => x[0])) : []));
const perMove = Object.fromEntries(ANIM_KEYS.map((k) => [k, A[k] ? new Set(animCells(A[k])).size : 0]));
ok('C3 · INDRA, THE FULL CUT: every animated move has art (' + Object.entries(perMove).map(([k, n]) => k + ' ' + n).join(', ') + ' cells; ' + NCELL + ' in all; walk back = the walk reversed), every cell index valid',
  ANIM_KEYS.every((k) => A[k] && animCells(A[k]).length && animCells(A[k]).every((c) => c >= 0 && c < NCELL)));
const cellSrc = (k) => MAN.indra.cellsSrc[k], srcIn = (L, clip, a, b) => L.every((k) => { const m = /^(\w+) f(\d+)$/.exec(cellSrc(k)); return m && m[1] === clip && +m[2] >= a && +m[2] <= b; });
const WK = MAN.indra.moves.walk;
ok('C3d · THE RESHOOTS (2026-11-04): the walk is one clean stride cycle f25–f92 (' + new Set(A.walk.loop).size + ' cells, every 3rd frame, played at ' + A.walk.fps + ' fps), its ' + WK.rootTravelSource + ' px of forward travel removed by the planted feet at both ends (the loop closes in place, |Δ| ' + WK.loopError + '); the knockdown is the new 10b — hit, thrown back, onto his back (f8–f47) — and the get-up its backward roll and rise (f49–f83), the clip\'s leftward travel removed, on the ground line from the landing; the throw is clip 14 — reach f40–48, the pull-in, the knee\'s impact (f' + MAN.indra.moves.throwHit.impact + '), back to stance',
  srcIn(A.walk.loop, 'walk', 25, 92) && WK.root === 'feet-linear' && WK.rootTravelSource > 200 && WK.loopError < 25 && srcIn(A.knockdown.span, 'knockdown', 7, 48) && srcIn(A.getup.span, 'knockdown', 48, 84) &&
  srcIn(A.throwHit.span.slice(0, 1), 'throw', 78, 86) && srcIn(A.throw.phases.startup.map((x) => x[0]), 'throw', 38, 47) && srcIn(A.counter.phases.active.map((x) => x[0]), 'parry', 58, 66));
ok('C3b · IDLE AT 8 FPS (ruling 1): ' + MAN.indra.moves.idle.loopFrames + '-frame loop → ' + A.idle.loop.length + ' steps, ' + new Set(A.idle.loop).size + ' cells (at 12 fps it was ' + Math.ceil(MAN.indra.moves.idle.loopFrames / 2) + '); Meghnad\'s too (' + new Set(MAN.meghnad.anim.idle.loop).size + ')',
  A.idle.fps === 8 && MAN.meghnad.anim.idle.fps === 8 && A.idle.loop.length === Math.ceil(MAN.indra.moves.idle.loopFrames / 3));
const holdsTrim = ['crouch', 'block', 'win'].map((k) => ({ k, steps: A[k].hold.length, cells: new Set(A[k].hold).size }));
ok('C3c · HOLDS TRIMMED (ruling 1): a held pose keeps its sharpest cell longer instead of near-duplicates — ' + holdsTrim.map((x) => x.k + ' ' + x.steps + ' steps on ' + x.cells + ' cells').join(', ') + '; the K.O. holds one still frame',
  holdsTrim.every((x) => x.cells < x.steps) && A.ko.hold.length === 1);
const AUD = MAN.indra.audit;
ok('C4 · THE EDGE DESPILL (ruling 7, the default): no olive edge pixel left on any cell (Indra ' + AUD.oliveEdgePixels + ', Meghnad ' + MAN.meghnad.audit.oliveEdgePixels + '); the sample\'s olive pixels fell from ' + AUD.despillSample.old + ' to ' + AUD.despillSample.new + ' (before/after sheet on the Desktop)',
  AUD.oliveEdgePixels === 0 && MAN.meghnad.audit.oliveEdgePixels === 0 && AUD.despillSample.old > AUD.despillSample.new);
ok('C5 · THE CLEAN-UPS: the special\'s baked lightning cut beyond the Vajra\'s tip (x ' + AUD.specialHalo.tipX + '; up to ' + Math.max(...Object.values(AUD.specialHalo.pixelsCut)) + ' px a frame) with no halo left (semi-transparent pixels ' + Math.max(...Object.values(AUD.specialHalo.cutFramesSemi)) + ' ≤ the clean frame\'s ' + AUD.specialHalo.refSemi +
  '); the crouch\'s ground shadow cut; the win\'s raised Vajra ' + AUD.winTopRowMin + ' px from the top (not clipped); the jump\'s crown ≥ 32 px from the top (' + AUD.jumpTopRowMin + ')',
  Math.max(...Object.values(AUD.specialHalo.cutFramesSemi)) <= AUD.specialHalo.refSemi && AUD.winTopRowMin > 0 && AUD.jumpTopRowMin >= 32 && Object.values(AUD.crouchShadowCut).every((n) => n >= 0));
const koLift = AUD.groundAligned.filter((x) => x.move === 'ko');
ok('C5b · NOTHING BELOW THE GROUND: the lying K.O. body (' + koLift.map((x) => x.src + ' +' + x.liftPx).join(', ') + ' px) and the knockdown\'s hands-and-knees are lifted onto the ground line',
  koLift.length > 0 && koLift.some((x) => x.liftPx >= 10) && AUD.groundAligned.every((x) => x.liftPx > 0));
ok('C6 · THE MIRROR TEST: every flipped cell keeps its feet on the ground row (' + HEROS.map((h) => MAN[h].mirrorTest.feetOnGround + '/' + MAN[h].mirrorTest.of).join(', ') + '; the jump\'s airborne cells stand on their lowest point)',
  HEROS.every((h) => MAN[h].mirrorTest.of - MAN[h].mirrorTest.feetOnGround <= (MAN[h].anim.jump ? new Set(MAN[h].anim.jump.span).size : 0)));
const tracked3 = git(['ls-files', 'lab/arcade']);
ok('C7 · THE CLIP LAW: no clip, frame or still is tracked — only the packed pages and manifests (' + tracked3.filter((f) => f.includes('/fighters/')).length + ' fighter files)',
  !tracked3.some((f) => /\.(mp4|mov|mkv)$|\/sources\/|\/frames\/|fighter-right-green/.test(f)));

console.log('\n── ARCADE-1 · R3 · in the fight ──');
function artAt(KK, hero, steps, opts) {   // play side 0's inputs; what is drawn for side 0 on each frame
  const g = KK.fight.newFight({ p0: hero, p1: 'box_surya' }), out = [];
  for (const inp of steps) { KK.fight.step(g, [inp, 0]); const sp = KK.scene.build(g, Object.assign({ fighters: MAN, rung: 'hi' }, opts || {})).shapes.find((x) => x.tag === 'sprite0'); out.push({ st: g.f[0].state, mf: g.f[0].mf, sp }); }
  return out;
}
function phasesOk(KK, hero, move) {   // the attack's cells across the game's own phases: each phase's cells in order, the last cell of a phase at its end
  const m = KK.fight.moveOf({ hero, arch: KK.moves.HEROES[hero].arch }, move), P = MAN[hero].anim[move].phases, BB = KK.fight.BTN;
  const g = KK.fight.newFight({ p0: hero, p1: 'box_surya' }); if (move === 'special') g.f[0].meter = 100;
  const seen = [];
  let lastMf = -1;
  for (let i = 0; i < m.startup + m.active + m.recovery + 20; i++) { KK.fight.step(g, [i === 0 ? { light: BB.LT, heavy: BB.HV, special: BB.SP }[move] : 0, 0]); if (g.f[0].state !== 'attack' || g.f[0].mf === lastMf) continue; lastMf = g.f[0].mf;   // one sample a move frame (a hit-stop repeats one)
    const sp = KK.scene.build(g, { fighters: MAN, rung: 'hi' }).shapes.find((x) => x.tag === 'sprite0'); seen.push([sp && sp.phase, sp && sp.cell]); }
  const want = (ph) => P[ph].map((x) => x[0]);
  const got = (ph) => seen.filter((x) => x[0] === ph).map((x) => x[1]).filter((c, i, a) => i === 0 || c !== a[i - 1]);
  return { ok: seen.length === m.startup + m.active + m.recovery && ['startup', 'active', 'recovery'].every((ph) => J(got(ph)) === J(want(ph).filter((c, i, a) => i === 0 || c !== a[i - 1]))), seen: seen.length };
}
const PH = [['indra', 'light'], ['indra', 'heavy'], ['indra', 'special'], ['meghnad', 'light']].map(([h, m]) => ({ h, m, ...phasesOk(K, h, m) }));
ok('C8 · THE ATTACKS ARE STRETCHED ONTO THE GAME\'S OWN PHASES: every startup / active / recovery cell plays, in order, inside its phase (' + PH.map((x) => x.h + ' ' + x.m + ' ' + x.seen + ' frames').join(' · ') + '; Meghnad\'s recovery is his archetype\'s, 2 frames longer)', PH.every((x) => x.ok), J(PH));
function idleOk(KK, hero) {
  const fr = artAt(KK, hero, new Array(150).fill(0)).filter((x) => x.st === 'idle' && x.sp), cells = fr.map((x) => x.sp.cell);
  const changes = cells.filter((c, i) => i && c !== cells[i - 1]).length;
  return { ok: cells.every((c) => MAN[hero].anim.idle.loop.includes(c)) && changes >= 14 && changes <= 20, changes };
}
const IL = HEROS.map((h) => ({ h, ...idleOk(K, h) }));
ok('C9 · THE IDLE LOOPS at 8 fps on the fight clock: 150 logic frames (2.5 s) step through ' + IL.map((x) => x.changes).join(' / ') + ' cell changes (20 steps at 8 fps, fewer where a hold repeats a cell)', IL.every((x) => x.ok), J(IL));
function flipOk(KK) {
  const g = KK.fight.newFight({ p0: 'indra', p1: 'meghnad' }), sh = KK.scene.build(g, { fighters: MAN, rung: 'hi' }).shapes;
  const a = sh.find((x) => x.tag === 'sprite0'), b = sh.find((x) => x.tag === 'sprite1');
  return a && b && !a.flip && b.flip && Math.abs(a.x - (g.f[0].x / KK.fight.U - KK.scene.cameraX(g))) < 1e-9 && a.y === KK.scene.GROUND_Y && Math.abs(a.scale - 220 / 320) < 1e-9;
}
ok('C10 · FACING: the left Hero is drawn as authored, the right one mirrored; each stands with its feet pivot on its fighter\'s ground point, the stance 220 logical px tall', flipOk(K));
// every state Indra can be in → the move whose art shows (fallback off: so nothing is borrowed except the throw, which has no clip yet)
function statesOk(KK) {
  const BB = KK.fight.BTN, S = KK.scene, seen = {}, want = { idle: 'idle', walkf: 'walk', walkb: 'walkBack', crouch: 'crouch', block: 'block', blockstun: 'block', jump: 'jump',
    hitstun: ['hitLight', 'hitHeavy'], knockdown: 'knockdown', getup: 'getup', parry: 'parry', bound: 'hitHeavy', grab: 'throwGrab', throwrec: 'throwHit', 'attack:counter': 'counter', 'attack:throw': 'throw' };
  const g = KK.fight.newFight({ p0: 'indra', p1: 'meghnad', seconds: 99 }), D = KK.demo.create('moves');
  for (let i = 0; i < 4000 && !g.over; i++) {
    KK.fight.step(g, KK.demo.inputs(D, g));
    const f = g.f[0], sp = S.build(g, { fighters: MAN, rung: 'hi', fallback: true }).shapes.find((x) => x.tag === 'sprite0');
    const k = f.state === 'attack' ? 'attack:' + f.move : f.state; (seen[k] = seen[k] || new Set()).add(sp ? sp.move + (sp.borrowed ? '*' : '') : 'BOX');
  }
  const bad = Object.entries(want).filter(([st, mv]) => !seen[st] || [...seen[st]].some((x) => !(Array.isArray(mv) ? mv : [mv]).some((m) => x === m || x === m + '*')));
  const atk = ['light', 'heavy', 'special'].filter((m) => !seen['attack:' + m] || [...seen['attack:' + m]].some((x) => x !== m));
  const after = g.f[0].state === 'win' && S.build(g, { fighters: MAN, rung: 'hi', after: 200 }).shapes.find((x) => x.tag === 'sprite0').move === 'win';
  return { ok: bad.length === 0 && atk.length === 0 && after, bad, atk, seen: Object.fromEntries(Object.entries(seen).map(([k, v]) => [k, [...v]])) };
}
const STO = statesOk(K);
ok('C11 · EVERY STATE INDRA CAN BE IN SHOWS ITS OWN ART through the every-move demo (' + Object.keys(STO.seen).length + ' states: ' + Object.entries(STO.seen).map(([k, v]) => k + '→' + v.join('/')).join(', ') + '); nothing borrowed', STO.ok, J({ bad: STO.bad, atk: STO.atk }));
function koOk(KK) {   // the K.O. plays over the frames after the fight ends, then holds its last still frame
  const g = KK.fight.newFight({ p0: 'indra', p1: 'meghnad' }); g.f[0].hp = 0; g.f[0].state = 'ko'; g.over = true;
  const at = (t) => KK.scene.build(g, { fighters: MAN, rung: 'hi', after: t }).shapes.find((x) => x.tag === 'sprite0');
  const seq = []; for (let t = 0; t <= MAN.indra.anim.ko.frames + 30; t += 3) seq.push(at(t).cell);
  return { ok: at(0).cell === MAN.indra.anim.ko.span[0] && at(500).cell === MAN.indra.anim.ko.hold[0] && new Set(seq).size >= 6 && !at(500).ko, distinct: new Set(seq).size };
}
const KO = koOk(K);
ok('C11b · THE K.O. (clip 11): staggers and falls over ' + MAN.indra.anim.ko.frames + ' frames after the fight ends (' + KO.distinct + ' cells), then holds the last still frame (never tilted: it is real art)', KO.ok, J(KO));
function archOk(KK) {
  const mo = (h, m) => KK.fight.moveOf({ hero: h, arch: KK.moves.HEROES[h].arch }, m);
  const T = MAN.indra.tipsLogical, H = KK.moves.HEROES.indra, TM = MAN.meghnad.tipsLogical, G = KK.moves.HEROES.meghnad;
  // Meghnad's heavy lunge, measured in the engine: how far he travels from the first frame to the first active frame (no opponent near)
  const lg = KK.fight.newFight({ p0: 'meghnad', p1: 'box_surya' }); lg.f[1].x = lg.f[0].x + Math.round(600 * KK.fight.U); const lx0 = lg.f[0].x;
  for (let i = 0; i < 1 + KK.moves.MOVES.heavy.startup; i++) KK.fight.step(lg, [i === 0 ? KK.fight.BTN.HV : 0, 0]);
  const lunge = Math.abs(lg.f[0].x - lx0) / KK.fight.U;
  return { ok: Math.abs(H.reach.light - T.light) <= 1 && Math.abs(H.reach.heavy - T.heavy) <= 1 && Math.abs(H.projX - T.special) <= 1 &&
    mo('indra', 'light').box.x1 === H.reach.light && mo('indra', 'heavy').box.x1 === H.reach.heavy && mo('meghnad', 'light').box.x1 === G.reach.light && mo('meghnad', 'heavy').box.x1 === G.reach.heavy &&
    Math.abs(G.reach.light - TM.light) <= 1 && Math.abs(G.reach.heavy - TM.heavy) <= 1 && Math.abs(G.projX - TM.special) <= 1 && Math.abs(lunge - G.heavyLunge) <= 1 &&
    mo('meghnad', 'light').recovery === MV.light.recovery + 2 && mo('box_surya', 'light') === MV.light, T, TM, lunge };
}
const AR = archOk(K);
ok('C12 · REACH FROM THE ART (ruling 5): Indra\'s hitboxes end at his weapon\'s tip at contact as measured on his clips (light ' + AR.T.light + ' → ' + K.moves.HEROES.indra.reach.light + ', heavy ' + AR.T.heavy + ' → ' + K.moves.HEROES.indra.reach.heavy + ', the Vajra leaves at ' + AR.T.special + ' → ' + K.moves.HEROES.indra.projX +
  ' logical px); MEGHNAD\'S TOO (owner ruling 1, 2026-11-05): light ' + AR.TM.light + ' → ' + K.moves.HEROES.meghnad.reach.light + ', heavy ' + AR.TM.heavy + ' → ' + K.moves.HEROES.meghnad.reach.heavy + ' after a ' + AR.lunge + ' px wind-up lunge (the clip\'s step), the coil leaves the spear at ' + AR.TM.special + ' → ' + K.moves.HEROES.meghnad.projX + ' (his archetype keeps recovery +2); the box Heroes keep the template', AR.ok, J({ T: AR.T, TM: AR.TM, lunge: AR.lunge }));
function nagaOk(KK) {   // 6 THE NAGAPASHA: binds on hit for exactly its bind frames (no knockdown), blockable with chip, and a follow-up lands while bound
  const BB = KK.fight.BTN, NP = KK.moves.NAGAPASHA;
  const pure = closeIn(KK, KK.fight.newFight({ p0: 'meghnad', p1: 'box_surya' }), 260), hp0 = pure.f[1].hp; pure.f[0].meter = 100;
  let boundFor = 0;
  for (let i = 0; i < 140; i++) { KK.fight.step(pure, [i === 0 ? BB.SP : 0, 0]); if (pure.f[1].state === 'bound' && pure.hitstop === 0) boundFor++; }   // the bind's own frames (hit-stop excluded)
  // the follow-up from 220 (owner ruling 1, 2026-11-05: the coil now leaves the spear's tip and binds at once, inside his own recovery —
  // cast from beyond ~230 the heavy no longer lands inside the bind)
  const fu = closeIn(KK, KK.fight.newFight({ p0: 'meghnad', p1: 'box_surya' }), 220); fu.f[0].meter = 100;
  const reach = KK.fight.moveOf(fu.f[0], 'heavy').box.x1 + (KK.moves.HEROES.meghnad.heavyLunge || 0) + KK.moves.BODY.halfW - 10;   // his heavy's own reach, its lunge included: attack from where it lands
  let follow = false;
  for (let i = 0; i < 140; i++) { const near = Math.abs(fu.f[1].x - fu.f[0].x) / KK.fight.U; KK.fight.step(fu, [i === 0 ? BB.SP : fu.f[1].state === 'bound' ? (near > reach ? BB.R : (i % 4 === 0 ? BB.HV : 0)) : 0, 0]);
    if (fu.events.some((e) => e.t === 'hit' && e.move === 'heavy') && !follow) follow = fu.events.filter((e) => e.t === 'hit' && e.move === 'heavy').length > 0 && fu.f[1].state !== 'bound' && fu.events.some((e) => e.t === 'bind'); }
  const heavyAt = (fu.events.find((e) => e.t === 'hit' && e.move === 'heavy') || {}).frame, bindAt = (fu.events.find((e) => e.t === 'bind') || {}).frame;
  const inTime = heavyAt != null && bindAt != null && heavyAt - bindAt < NP.bind + KK.moves.MOVES.special.hitstop;
  const bl = closeIn(KK, KK.fight.newFight({ p0: 'meghnad', p1: 'box_surya' }), 260), hb = bl.f[1].hp; bl.f[0].meter = 100;
  for (let i = 0; i < 90; i++) KK.fight.step(bl, [i === 0 ? BB.SP : 0, BB.R]);
  // point blank (closer than the tip): the coil starts on the opponent and still binds
  const pb = closeIn(KK, KK.fight.newFight({ p0: 'meghnad', p1: 'box_surya' }), 120); pb.f[0].meter = 100;
  for (let i = 0; i < 60; i++) KK.fight.step(pb, [i === 0 ? BB.SP : 0, 0]);
  const pointBlank = pb.events.some((e) => e.t === 'bind');
  return { ok: pointBlank && pure.events.some((e) => e.t === 'bind') && !pure.events.some((e) => e.t === 'knockdown') && boundFor === NP.bind && hp0 - pure.f[1].hp === NP.dmg && inTime &&
    bl.events.some((e) => e.t === 'block') && hb - bl.f[1].hp === NP.chip && !bl.events.some((e) => e.t === 'bind'), boundFor, follow: inTime, followAfter: heavyAt - bindAt, chip: hb - bl.f[1].hp, pointBlank };
}
const NG = nagaOk(K);
ok('C13 · MEGHNAD\'S NAGAPASHA (ruling 6): the coil is a shot that BINDS on hit (exactly ' + NG.boundFor + ' frames, no knockdown, ' + K.moves.NAGAPASHA.dmg + ' damage) so a follow-up heavy (cast from 220, his lunge included) lands while bound (' + NG.followAfter + ' frames after the bind, hit-stop included); point blank (120, closer than the spear tip) it still binds; held back, it is blocked for ' + NG.chip + ' chip', NG.ok, J(NG));

function walkOk(KK) {   // the walk skate (owner ruling 2026-11-04): real Heroes walk 170 → 168 px/s forward; the stride played at 20 fps; game ÷ stride ≤ 2.5
  const sp = (h, bit) => { const g = KK.fight.newFight({ p0: h, p1: 'box_surya' }), x0 = g.f[0].x; for (let i = 0; i < 60; i++) KK.fight.step(g, [bit, 0]); return Math.abs(g.f[0].x - x0) / KK.fight.U; };
  const W = MAN.indra.moves.walk, travel = W.rootTravelSource * 220 / MAN.indra.stance.sourceHeight, play = MAN.indra.anim.walk.loop.length / MAN.indra.anim.walk.fps, stride = travel / play;
  const r = { indraF: sp('indra', KK.fight.BTN.R), indraB: sp('indra', KK.fight.BTN.L), meghnadF: sp('meghnad', KK.fight.BTN.R), meghnadB: sp('meghnad', KK.fight.BTN.L), boxF: sp('box_surya', KK.fight.BTN.R), fps: MAN.indra.anim.walk.fps, stride: +stride.toFixed(1) };
  r.ratio = +(r.indraF / stride).toFixed(2); r.ratioBack = +(r.indraB / stride).toFixed(2);
  const WM = MAN.meghnad.moves.walk, sM = (WM.rootTravelSource * 220 / MAN.meghnad.stance.sourceHeight) / (MAN.meghnad.anim.walk.loop.length / MAN.meghnad.anim.walk.fps);
  r.meghnadStride = +sM.toFixed(1); r.meghnadRatio = +(r.meghnadF / sM).toFixed(2); r.meghnadRatioBack = +(r.meghnadB / sM).toFixed(2); r.meghnadFps = MAN.meghnad.anim.walk.fps;
  r.ok = r.indraF === 168 && r.indraB === 126 && r.meghnadF === 120 && r.meghnadB === 90 && r.boxF === 240 && r.fps === 20 && r.ratio <= 2.5 && r.meghnadFps === 20 && r.meghnadRatio <= 3.0 && KK.moves.KNOCKDOWN.getup === 40;
  return r;
}
const WO = walkOk(K);
ok('C14 · THE WALK SKATE (owner ruling, after the reshoot): the real Heroes walk ' + WO.indraF + ' px/s forward (170 asked; the engine\'s nearest) and ' + WO.indraB + ' back, the box Heroes still ' + WO.boxF + '; the stride plays at ' + WO.fps + ' fps, so the feet cover ' + WO.stride + ' px/s — game ÷ stride ' + WO.ratio + ' forward, ' + WO.ratioBack + ' back (target ≤ 2.5); Meghnad\'s stride ' + WO.meghnadStride + ' px/s at ' + WO.meghnadFps + ' fps against his own walk ' + WO.meghnadF + ' / ' + WO.meghnadB + ' px/s (owner ruling 3, 2026-11-05) → ' + WO.meghnadRatio + ' forward, ' + WO.meghnadRatioBack + ' back (over 2.5: his clip takes short steps; reported, pinned ≤ 3); and the get-up is ' + K.moves.KNOCKDOWN.getup + ' frames (was 20), untouchable throughout', WO.ok, J(WO));

// THE MEGHNAD CUT (owner brief 2026-11-05): every move his own, the cells inside the owner's frame notes, no visible cell missing a piece
function meghnadCutOk(man) {
  const cellsOf = (A) => A.phases ? Object.values(A.phases).flatMap((L) => L.map((x) => x[0])) : ['span', 'loop', 'enter', 'hold'].flatMap((k) => A[k] || []);   // phases hold [cell, fraction]
  const used = (mv) => [...new Set(cellsOf(man.anim[mv]).map((k) => man.cellsSrc[k]))];
  const fr = (mv) => used(mv).map((x) => +x.split(' f')[1]);
  const MOVES = Object.keys(MAN.indra.anim).filter((k) => k !== 'counter' || MAN.indra.anim.counter);
  const errs = [];
  MOVES.forEach((m) => { if (!man.anim[m]) errs.push('missing ' + m); });
  const inR = (mv, a, b, skip) => fr(mv).forEach((f) => { if (f < a || f > b || (skip && f >= skip[0] && f <= skip[1])) errs.push(mv + ' f' + f); });
  inR('crouch', 19, 120); inR('block', 29, 61); inR('hitLight', 35, 91); inR('hitHeavy', 35, 91);   // ±1: the sharpest frame next to a note
  inR('knockdown', 16, 47); inR('getup', 48, 89); inR('ko', 20, 120, [36, 58]); inR('win', 14, 120); inR('parry', 14, 25); inR('counter', 22, 89);
  inR('throw', 20, 90); inR('throwGrab', 45, 57); inR('throwHit', 58, 91);
  const strays = (man.audit.strayPiecesDropped || []).filter((x) => x.move !== 'heavy' || x.src !== 'heavy f15');
  strays.forEach((x) => errs.push('stray cut from ' + x.src + ' (' + x.droppedPx + ' px)'));
  return { ok: errs.length === 0, errs, cells: man.cellsSrc.length };
}
const MC = meghnadCutOk(MAN.meghnad);
ok('C15 · MEGHNAD\'S FULL CUT (owner brief 2026-11-05): every one of Indra\'s ' + Object.keys(MAN.indra.anim).length + ' animations his own (' + MC.cells + ' cells); each cell inside the owner\'s frame notes (hit from f35, the K.O. skips f36–58, the knockdown from f16, the block before f60…); no piece dropped from a cell he plays (only heavy f15\'s smear, a hand\'s width of blur, see the report)', MC.ok, J(MC.errs));
const MCbad = JSON.parse(JSON.stringify(MAN.meghnad)); MCbad.cellsSrc[MCbad.anim.hitHeavy.span[0]] = 'hit f30';
red('C15b · BREAKAGE: a hit cell from the stray-spear frames (f30) (C15 goes red)', !meghnadCutOk(MCbad).ok);
function pullOk(KK) {   // Meghnad's spear-hook: caught at the throw range (90), the hold pulls the Hero in to 64 by the time the throw lands
  const g = KK.fight.newFight({ p0: 'meghnad', p1: 'box_surya' }), B = KK.fight.BTN; g.f[1].x = g.f[0].x + Math.round(88 * KK.fight.U);
  let caught = -1, landed = -1, gapAtLand = null;
  for (let i = 0; i < 40; i++) {
    KK.fight.step(g, [i === 0 ? B.LT | B.HV : 0, 0]);
    if (caught < 0 && g.events.some((e) => e.t === 'grab')) caught = i;
    if (g.f[1].state === 'grabbed') gapAtLand = Math.abs(g.f[1].x - g.f[0].x) / KK.fight.U;   // the last frame of the hold: the knee lands here
    if (landed < 0 && g.events.some((e) => e.t === 'knockdown' && e.move === 'throw')) landed = i;
  }
  const ind = KK.fight.newFight({ p0: 'indra', p1: 'box_surya' }); ind.f[1].x = ind.f[0].x + Math.round(88 * KK.fight.U); let gi = null;
  for (let i = 0; i < 40; i++) { KK.fight.step(ind, [i === 0 ? B.LT | B.HV : 0, 0]); if (gi == null && ind.events.some((e) => e.t === 'knockdown')) gi = Math.abs(ind.f[1].x - ind.f[0].x) / KK.fight.U; }
  return { ok: caught >= 0 && landed > caught && Math.abs(gapAtLand - KK.moves.HEROES.meghnad.throwPull) <= 3 && gi >= 85 && KK.moves.MOVES.throw.range === 90, caught, landed, gapAtLand, indraGap: gi };
}
const PL = pullOk(K);
ok('C16 · MEGHNAD\'S SPEAR-HOOK THROW (owner brief): caught at 88 px (the range stays ' + K.moves.MOVES.throw.range + '), the hold yanks the Hero in to ' + PL.gapAtLand + ' px — knee distance — by its last frame, when the knee lands; Indra\'s hand grab does not pull (' + PL.indraGap + ' px)', PL.ok, J(PL));

// CLOSING IN WHEN OUT-RANGED (owner ruling 2, 2026-11-05) and THE BALANCE CHECK (ruling 4): Indra vs Meghnad, both AIs, sides alternating
function balance(KK, level, n) {
  let mw = 0, iw = 0, outside = 0, neutral = 0, to = 0;
  for (let s = 1; s <= n; s++) {
    const mSide = s % 2, g = KK.fight.newFight({ p0: mSide ? 'indra' : 'meghnad', p1: mSide ? 'meghnad' : 'indra' }), rng = KK.rng.rng(s * 7919);
    const ais = [KK.ai.createAI(level, rng, { round: 0 }), KK.ai.createAI(level, rng, { round: 0 })];
    const mReach = KK.fight.moveOf({ hero: 'meghnad', arch: 'reach' }, 'light').box.x1 + KK.moves.BODY.halfW, iReach = KK.fight.moveOf({ hero: 'indra', arch: 'allrounder' }, 'light').box.x1 + KK.moves.BODY.halfW;
    for (let f = 0; f < 20000 && !g.over; f++) {
      KK.fight.step(g, [KK.ai.decide(ais[0], KK.ai.observe(g, 0)), KK.ai.decide(ais[1], KK.ai.observe(g, 1))]);
      const I = g.f[1 - mSide], d = Math.abs(g.f[1].x - g.f[0].x) / KK.fight.U;
      if ((I.state === 'idle' || I.state === 'walkf' || I.state === 'walkb') && d > iReach && d <= mReach + 60) { neutral++; if (I.state !== 'walkf') outside++; }   // inside the spear, outside his own reach: Indra NOT advancing
    }
    if (g.reason === 'time') to++;
    if (g.winner === mSide) mw++; else if (g.winner === 1 - mSide) iw++;
  }
  return { level, meghnadPct: +(100 * mw / (mw + iw)).toFixed(1), meghnad: mw, indra: iw, timeouts: to, indraOutside: +(100 * outside / Math.max(1, neutral)).toFixed(1) };
}
const BAL = ['advanced', 'deathmatch'].map((l) => balance(K, l, 200));
// in band at Advanced (40–65), no time-out, and the ruling-2 AI does help the out-ranged side (Meghnad wins less than without it)
const c17 = (B, ref) => B[0].meghnadPct >= 40 && B[0].meghnadPct <= 65 && B.every((b) => b.timeouts === 0) && B[0].meghnadPct < ref.meghnadPct;
const noCI = (() => { const KK = load({ ai: [['closeIn: { guard: 0.85, punish: 0.8 } },', '},']] }); return balance(KK, 'advanced', 200); })();
ok('C17 · THE BALANCE CHECK (owner rulings 1–4, 2026-11-05): Indra vs Meghnad, both AIs, 200 rounds each, sides alternating — Meghnad wins ' + BAL.map((b) => b.meghnadPct + '% at ' + b.level).join(', ') + ' (target 40–65 at Advanced; no time-outs: ' + BAL.map((b) => b.timeouts).join('/') +
  '; without the ruling-2 AI ' + noCI.meghnadPct + '% at Advanced); out-ranged, the Advanced Indra closes in — inside the spear\'s reach but outside his own he holds or backs off ' + BAL[0].indraOutside + '% of his free frames (' + noCI.indraOutside + '% without it); the Beginner keeps none of it',
  c17(BAL, noCI) && !K.ai.LEVELS.beginner.closeIn && !!K.ai.LEVELS.deathmatch.closeIn, J({ BAL, noCI }));
red('C17b · BREAKAGE: the ruling-2 AI taken off Advanced — Meghnad back to ' + noCI.meghnadPct + '% (C17 goes red)', !c17([noCI, BAL[1]], noCI));

console.log('\n── ARCADE-1 · R3 · breakages: each must go red ──');
const BR3 = [
  ['K1 · the startup art held 3 frames into the active frames (C8 goes red)', { scene: [['if (f.mf < m.startup) { ph = "startup"; fr = f.mf / m.startup; }', 'if (f.mf < m.startup + 3) { ph = "startup"; fr = Math.min(0.99, f.mf / m.startup); }']] }, (KK) => PH.every((x) => phasesOk(KK, x.h, x.m).ok)],
  ['K2 · the right-hand Hero not mirrored (C10 goes red)', { scene: [['flip: f.facing === -1,', 'flip: false,']] }, (KK) => flipOk(KK)],
  ['K3 · reach back to the template box (C12 goes red)', { fight: [['if (r != null) m.box.x1 = r;', '']] }, (KK) => archOk(KK).ok],
  ['K4 · the idle loop driven by the move frame instead of the fight clock — it stops cycling (C9 goes red)', { scene: [['if (st === "idle") return idle(false);', 'if (st === "idle") return { move: "idle", cell: loopAt(A.idle.loop, f.mf, A.idle.fps) };']] }, (KK) => HEROS.every((h) => idleOk(KK, h).ok)],
  ['K6 · the knockdown shown as the idle (C11 goes red)', { scene: [['if (st === "knockdown") return A.knockdown ?', 'if (st === "knockdown") return idle(false); if (false) return A.knockdown ?']] }, (KK) => statesOk(KK).ok],
  ['K7 · the K.O. played on the fight clock, which has stopped — it never falls (C11b goes red)', { scene: [['var t = after || 0;', 'var t = 0;']] }, (KK) => koOk(KK).ok],
  ['K10 · the real Heroes back at 240 px/s: the feet skate 3.1× (C14 goes red)', { moves: [['var REAL_WALK = { walkF: 2.8, walkB: 2.1 };', 'var REAL_WALK = { walkF: 4, walkB: 3 };']] }, (KK) => walkOk(KK).ok],
  ['K11 · the get-up back at 20 frames (C14 goes red)', { moves: [['var KNOCKDOWN = { fall: 36, getup: 40,', 'var KNOCKDOWN = { fall: 36, getup: 20,']] }, (KK) => walkOk(KK).ok],
  ['K15 · the shot left at the tip even with the opponent closer: point blank it starts behind them and misses (C13 goes red)', { fight: [['if (hero && hero.projX != null && gap > 0 && gap < sx) sx = gap;', '']] }, (KK) => nagaOk(KK).ok],
  ['K13 · Meghnad\'s heavy without its lunge (C12 goes red)', { fight: [['if (lunge) f.vx = f.mf <= m.startup ? f.facing * px(lunge / m.startup) : 0;', '']] }, (KK) => archOk(KK).ok],
  ['K14 · Meghnad back at the real-Hero walk (C14 goes red)', { moves: [['walk: { walkF: 2, walkB: 1.5 }, ', '']] }, (KK) => walkOk(KK).ok],
  ['K12 · Meghnad\'s hook pulls nothing (C16 goes red)', { moves: [['fighter: "meghnad", reachFrom: "indra", throwPull: 64 }', 'fighter: "meghnad", reachFrom: "indra" }']] }, (KK) => pullOk(KK).ok],
  ['K8 · the Nagapasha knocking down instead of binding (C13 goes red)', { fight: [['if (h.naga) {', 'if (false) {']] }, (KK) => nagaOk(KK).ok]
];
for (const [name, mut, check] of BR3) { let still; try { still = check(load(mut)); } catch (e) { still = false; } red(name, !still); }
const badMan = JSON.parse(J(MAN.indra)); badMan.rungs.hi.cells[3].py -= 40;
red('K5 · a cell cut on the head instead of the feet: its pivot 40 px above the cell\'s bottom (C1 goes red)', sheetsOk(badMan).length > 0);
const badMan2 = JSON.parse(J(MAN.indra)); badMan2.rungs.lo.pages[0].size[0] += 2;
red('K9 · a page side not a multiple of 4 — no compressed block fits (C1 goes red)', sheetsOk(badMan2).length > 0);


if (ENH) {
console.log('\n── ARCADE-1 · enhancement test · the switches, the camera, the HD sheets, the demo ──');
const PR = K.present, DM = K.demo, SC = K.scene;
function modesOk(KK) {
  const d = KK.present.parseModes(''), j = KK.present.parseModes('?fx=0&fps=24&cam=wide'), bad = KK.present.parseModes('?fx=2&fps=30&cam=zoom&cpu=99');
  return d.fx === true && d.fps === 12 && d.cam === 'tight' && !d.demo && !d.capture && d.cpu === 1 &&
    j.fx === false && j.fps === 12 && j.cam === 'wide' && KK.present.parseModes('?fps=48').fps === 12 && KK.present.parseModes('?capture=x').demo &&
    bad.fx === true && bad.fps === 12 && bad.cam === 'tight' && bad.cpu === 10;
}
ok('E1 · THE DEFAULTS (ruling 1 of 2026-11-04): no query = fx on and the tight camera, no demo; ?fx=0&cam=wide is the R0–R2 baseline for comparison; the 12 fps sheets always (the fps switch is gone, ruling 4: ?fps=24|48 is ignored); anything else falls back to the defaults', modesOk(K));
function camAt(KK, gap, mode) {
  const g = KK.fight.newFight({ p0: 'box_surya', p1: 'box_rakta' }), U = KK.fight.U, mid = KK.fight.STAGE_W / 2;
  g.f[0].x = Math.round((mid - gap / 2) * U); g.f[1].x = Math.round((mid + gap / 2) * U);
  return KK.scene.cameraTarget(g, mode);
}
function camOk(KK) {
  const near = camAt(KK, 100, 'tight'), mid = camAt(KK, 400, 'tight'), far = camAt(KK, 900, 'tight'), wide = camAt(KK, 100, 'wide');
  const eased = KK.scene.easeCamera({ x: 0, zoom: 1 }, { x: 100, zoom: 1.2 }, 1 / 60), first = KK.scene.easeCamera(null, near, 1 / 60);
  return { ok: near.zoom === KK.scene.ZOOM_MAX && far.zoom === KK.scene.ZOOM_MIN && mid.zoom < near.zoom && mid.zoom > far.zoom && wide.zoom === 1 &&
    eased.x > 0 && eased.x < 100 && eased.zoom > 1 && eased.zoom < 1.2 && first.x === near.x && first.zoom === near.zoom &&
    near.x - KK.scene.VIEW_W / 2 / near.zoom >= 0 && far.x + KK.scene.VIEW_W / 2 / far.zoom <= KK.fight.STAGE_W + 1e-9,
    z: [near.zoom, mid.zoom, far.zoom].map((v) => v.toFixed(2)).join(' → ') };
}
const CAM = camOk(K);
ok('E2 · THE DYNAMIC CAMERA (cam=tight): zooms in close, out far, clamped to [' + SC.ZOOM_MIN + ', ' + SC.ZOOM_MAX + '] (gap 100 / 400 / 900 px → zoom ' + CAM.z + '), eases (one 60 Hz frame moves part-way), never shows past the stage ends; cam=wide stays at zoom 1', CAM.ok);
function sameWide(KK) {   // the baseline scene is untouched: no opts.cam = the R0–R2 picture, shape for shape
  const g = KK.fight.newFight({ p0: 'indra', p1: 'meghnad' }); for (let i = 0; i < 90; i++) KK.fight.step(g, [KK.fight.BTN.R, 0]);
  const a = KK.scene.build(g, { fighters: MAN, rung: 'hi' }), b = KK.scene.build(g, { fighters: MAN, rung: 'hi', cam: KK.scene.cameraTarget(g, 'wide') });
  return J(a.shapes) === J(b.shapes) && a.zoom === 1;
}
ok('E3 · the wide camera through the new path draws exactly the R0–R2 picture', sameWide(K));
const HD_GONE = ['indra', 'meghnad'].flatMap((h) => ['f24', 'f48'].map((f) => 'fighters/' + h + '/' + f)).concat(['tools/make_fighter_hd.py']).filter(has);
ok('E4 · THE HD SHEETS ARE GONE (ruling 4 of 2026-11-04): no fighters/<hero>/f24 or f48, no HD tool — the 12 fps sheets are the only ones the page can load (they stay in git history)', HD_GONE.length === 0, HD_GONE);
function demoRun(KK) {
  const g = KK.fight.newFight({ p0: KK.demo.LINEUPS[0][0], p1: KK.demo.LINEUPS[1][0] }), D = KK.demo.create(), ev = [];
  for (let i = 0; i < 3000 && !g.over; i++) KK.fight.step(g, KK.demo.inputs(D, g));
  return { over: g.over, frame: g.frame, winner: g.winner, ko: g.f.some((f) => f.state === 'ko'), hits: g.events.filter((e) => e.t === 'hit').length, ev: J(g.events) };
}
const DA = demoRun(K), DB = demoRun(load());
ok('E6 · THE DEMO BOUT is deterministic and ends in a K.O.: Indra vs Meghnad, ' + DA.hits + ' hits, K.O. at frame ' + DA.frame + ', the same event stream on a second run', DA.over && DA.ko && DA.hits >= 4 && DA.ev === DB.ev && DA.frame === DB.frame);
function switchesOk(KK, man) {   // cross-fade only at fps ≥ 24; borrowed art only with fx; no presentation shape without fx
  const g = KK.fight.newFight({ p0: 'indra', p1: 'meghnad' }), B2 = KK.fight.BTN;
  const runP = (modes, fallback) => { const P = KK.present.create(modes), gg = KK.fight.newFight({ p0: 'meghnad', p1: 'indra' }); let fades = 0, extra = 0, borrowed = 0;
    for (let i = 0; i < 60; i++) { KK.fight.step(gg, [i === 5 ? B2.LT : i === 30 ? B2.HV : 0, 0]); const b = KK.scene.build(gg, { fighters: man, rung: 'lo', fallback: fallback, cam: KK.present.camera(P, gg, null, 1 / 60) });
      KK.present.tick(P, gg, b); const sh = KK.present.shapes(P, gg, b); fades += sh.filter((x) => /^fade/.test(x.tag)).length; extra += sh.length; if (gg.f[0].state === 'attack' && gg.f[0].move === 'heavy') borrowed += b.shapes.filter((x) => x.k === 'sprite' && x.side === 0 && x.borrowed).length; }
    return { fades, extra, borrowed }; };
  const base = runP(KK.present.parseModes('?fx=0&cam=wide'), false), fx = runP(KK.present.parseModes(''), true);
  return { ok: base.fades === 0 && base.extra === 0 && base.borrowed === 0 && fx.borrowed > 0 && fx.extra > 0 && fx.fades > 0, base, fx };
}
const MAN_NOHEAVY = JSON.parse(JSON.stringify(MAN)); delete MAN_NOHEAVY.meghnad.anim.heavy;   // both real Heroes now have every move: borrowing is tested on a copy missing one
const SW = switchesOk(K, MAN_NOHEAVY), SWfull = switchesOk(K, MAN); SW.ok = SW.ok && SWfull.fx.borrowed === 0; SW.fullBorrowed = SWfull.fx.borrowed;
ok('E7 · EACH LOOK ONLY WITH ITS SWITCH: ?fx=0 adds no shape, no cross-fade, no borrowed art; the default (fx on) borrows art for a move with no cells (Meghnad\'s heavy removed from a copy: ' + SW.fx.borrowed + ' frames; with his full cut nothing borrows: ' + SW.fullBorrowed + '), adds its shadows/sparks (' + SW.fx.extra + ' shapes) and cross-fades a move change on the 12 fps sheets (ruling 3: ' + SW.fx.fades + ' fade shapes)', SW.ok, J(SW));
const code = (f) => rd(f).replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
const NOR = ['ui/present.js', 'ui/demo.js'].filter((f) => /Math\.random|Date\.now|performance\.now/.test(code(f)));
ok('E8 · the presentation and the demo are deterministic: no Math.random, no clock (a capture of the same bout is the same video)', NOR.length === 0, NOR);
const BU = require(path.join(LAB, 'tools/budget.js')), BP = BU.project();
const shipped24 = () => HEROS.every((h) => MAN[h].strike24 === true);
const budgetOk = (P) => P.strike24 === shipped24();
const bf = (x) => x.toFixed(1);
ok('M1 · RULING 1, THE PROJECTION DECIDES: with compressed textures, idle at 8 fps, trimmed holds and the half-size lo Vajra, the 15-move projection is lo ' + bf(BP.rungs.lo.total15Strike) + ' MB of ' + BP.rungs.lo.cap + ', hi ' + bf(BP.rungs.hi.total15Strike) + ' MB of ' + BP.rungs.hi.cap +
  ' (2 fighters + arena + effects, strike frames included; margin = at most ' + (BU.MARGIN * 100) + '% of the cap) → the 24 fps strike frames ' + (BP.strike24 ? 'ship' : 'stay out') + ', and the sheets agree', budgetOk(BP) && BP.rungs.lo.fitsWithMargin && BP.rungs.hi.fitsWithMargin);
red('M2 · BREAKAGE: caps too small for the margin (lo 16 / hi 60) but the strike frames shipped (M1 goes red)', !budgetOk(BU.project({ lo: 16, hi: 60 })));
const FB = BP.fallback;
ok('M3 · THE UNCOMPRESSED FALLBACK (ruling 6, third set): with no compressed format (or ?tex=webp) the page loads the ' + FB.spec.rung + ' pages resized ×' + FB.spec.scale + ' → ' + bf(FB.total) + ' MB of the lo cap ' + FB.cap + ' (fighters ' + bf(FB.fighters) + ', arena ' + bf(FB.arena) + ', Vajra ' + bf(FB.effects) + '; unscaled it would be ' + bf(FB.unscaled) + ')',
  FB.spec.rung === 'lo' && FB.fits && FB.unscaled > FB.cap);
const appF = rd('ui/app.js');
ok('M3b · …and the page does it: no compressed format → RUNG lo and each WebP page resized as it loads (createImageBitmap), every cell rect and pivot scaled, drawn 1 / scale larger',
  /if \(!target\) \{ RUNG = FALLBACK\.rung;/.test(appF) && /createImageBitmap\(img, \{ resizeWidth: Math\.round\(p\.size\[0\] \* s\)/.test(appF) && /k = 1 \/ s; cells = Rg\.cells\.map/.test(appF));
red('M4 · BREAKAGE: the fallback at full size (scale 1) is over the lo cap (M3 goes red)', (() => { const t = 4 * BP.rungs.lo.pair + 4 * BP.rungs.lo.arena + BP.rungs.lo.effects; return !(t <= FB.cap); })());
const trackedE = git(['ls-files', 'lab/arcade']).concat(git(['diff', '--name-only', '--cached']));
ok('E9 · the recorder\'s output is never tracked: captures/ is ignored and no capture frame or video is staged or committed', gi.includes('captures/') && !trackedE.some((f) => /\/captures\/|\.(mp4|gif)$/.test(f)));

console.log('\n── ARCADE-1 · enhancement test · breakages: each must go red ──');
const BRE = [
  ['X1 · the camera zoom unclamped (E2 goes red)', { scene: [['var zoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, VIEW_W / (dist + ZOOM_MARGIN)));', 'var zoom = VIEW_W / (dist + ZOOM_MARGIN);']] }, (KK) => camOk(KK).ok],
  ['X2 · the camera snapping instead of easing (E2 goes red)', { scene: [['var k = 1 - Math.exp(-dt * 6);', 'var k = 1;']] }, (KK) => camOk(KK).ok],
  ['X3 · fx OFF by default again (E1 goes red)', { present: [['fx: q.fx !== "0"', 'fx: q.fx === "1"']] }, (KK) => modesOk(KK)],
  ['X3b · the wide camera by default again (E1 goes red)', { present: [['cam: q.cam === "wide" ? "wide" : "tight"', 'cam: q.cam === "tight" ? "tight" : "wide"']] }, (KK) => modesOk(KK)],
  ['X4 · the cross-fade without fx: ?fx=0 no longer the R0–R2 picture (E7 goes red)', { present: [['if (P.modes.fx && L', 'if (L']] }, (KK) => switchesOk(KK, MAN).ok],
  ['X4b · the cross-fade gone at 12 fps (E7 goes red)', { present: [['if (P.modes.fx && L', 'if (false && L']] }, (KK) => switchesOk(KK, MAN).ok],
  ['X5 · the demo\'s stated nudges dropped — a different bout, no K.O. on schedule (E6 goes red)', { demo: [['if (!D.nudged && s.nudge && both)', 'if (false)']] }, (KK) => { const r = demoRun(KK); return r.over && r.ko && r.ev === DA.ev; }]
];
for (const [name, mut, check] of BRE) { let still; try { still = check(load(mut)); } catch (e) { still = false; } red(name, !still); }
}

finish();

function finish() {
// ── the game's own suites, at their exact counts ──
const coreTotal = pass + fail;
if (process.argv.includes('--game')) {
  console.log('\n── the game\'s suites, at their exact counts (the lab law) ──');
  const want = JSON.parse(rd('test/game_counts.json'));
  for (const s of want.suites) {
    let out = '';
    try { out = cp.execFileSync('node', ['src/' + s.file], { cwd: REPO, encoding: 'utf8', env: Object.assign({}, process.env, s.env ? { DY_WEB: path.resolve(REPO, '../divya-yuddha-web') } : {}), stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 << 20 }); }
    catch (e) { out = String(e.stdout || '') + String(e.stderr || ''); }
    const m = s.expect.match ? out.includes(s.expect.match) : null;
    const allPass = new RegExp('ALL ' + s.expect.pass + ' ').test(out);
    const known = s.expect.knownFail ? out.includes('✖ ' + s.expect.knownFail.fail + ' FAILURES / ' + s.expect.knownFail.pass + ' passed') : false;
    const good = s.expect.match ? m : s.expect.knownFail ? known : allPass;
    ok('G · ' + s.file + ' — ' + (s.expect.match ? '"' + s.expect.match + '"' : s.expect.knownFail ? s.expect.knownFail.pass + ' passed + the ' + s.expect.knownFail.fail + ' known pre-existing failure (' + s.expect.knownFail.why + ')' : s.expect.pass + ' checks'), good,
      out.split('\n').filter((l) => /✖|ALL|PASS|FAIL/.test(l)).slice(-3).join(' | '));
  }
}

let tracked = 0;
try { tracked = git(['ls-files', 'lab/arcade']).reduce((a, f) => a + (fs.existsSync(path.join(REPO, f)) ? fs.statSync(path.join(REPO, f)).size : 0), 0); } catch (e) {}
console.log('\nlab suite: ' + coreTotal + ' checks · tracked lab/arcade total ' + (tracked / 1048576).toFixed(2) + ' MB');
console.log(fail ? '✖ ' + fail + ' FAILED of ' + (pass + fail) : 'ALL GREEN — ' + pass + '/' + pass);
process.exit(fail ? 1 : 0);
}
