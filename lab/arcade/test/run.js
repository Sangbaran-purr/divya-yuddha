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
const FILES = { moves: 'core/moves.js', fight: 'core/fight.js', rng: 'core/rng.js', ai: 'core/ai.js', match: 'core/match.js', controls: 'ui/controls.js', scene: 'ui/scene.js' };
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
  const byPath = { './moves.js': 'moves', './fight.js': 'fight', './rng.js': 'rng', '../core/fight.js': 'fight', '../core/moves.js': 'moves' };
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
const RUNG = has('fighters/indra/manifest.json') ? 3 : has('core/ai.js') && has('ui/controls.js') ? 2 : has('core/fight.js') ? 1 : 0;
const BY_RUNG = [
  ['index.html', 'STAMP', 'README.md', '.gitignore', 'LAW_BASE', 'runtime/pixi.min.mjs', 'runtime/COPY.json', 'tools/stamp.js', 'test/run.js', 'test/game_counts.json'],
  ['core/moves.js', 'core/fight.js', 'core/rng.js', 'core/match.js', 'ui/scene.js'],
  ['core/ai.js', 'ui/controls.js', 'ui/app.js', 'ui/app.css'],
  ['tools/make_fighter.py'].concat(...['indra', 'meghnad'].map((h) => ['fighters/' + h + '/manifest.json', 'fighters/' + h + '/hi.webp', 'fighters/' + h + '/lo.webp']))];
const NEEDED = [].concat(...BY_RUNG.slice(0, RUNG + 1));
console.log('  (rung ' + RUNG + ': the suite checks R0' + (RUNG ? '–R' + (RUNG === 3 ? '2 + the R3 clip test' : RUNG) : '') + ')');
const missing = NEEDED.filter((f) => !fs.existsSync(path.join(LAB, f)));
ok('R0.1 · the lab has every file of its rungs so far: the page, its own Pixi copy, the stamp tool and this suite' + (RUNG >= 1 ? ', the core and the scene' : '') + (RUNG >= 2 ? ', the AI, the controls and the app' : '') + (RUNG >= 3 ? ', the fighter tool and both clip-test fighters' : '') + ' (' + NEEDED.length + ' files)', missing.length === 0, missing);
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
const labJs = ['core/moves.js', 'core/fight.js', 'core/rng.js', 'core/ai.js', 'core/match.js', 'ui/controls.js', 'ui/scene.js', 'ui/app.js'].filter(has);
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
  let ai = [KK.ai.createAI(a0, r), KK.ai.createAI(a1, r)], guard = 0;
  while (!m.over && guard++ < 30000) {
    if (m.pending) { KK.match.nextRound(m); ai = [KK.ai.createAI(a0, r), KK.ai.createAI(a1, r)]; }
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
  ['B5 · a NONDETERMINISTIC replay: Math.random in the physics (R1.1 goes red)', { fight: [['g.proj.forEach(function (p) { p.x += p.dir * p.speed; });', 'g.proj.forEach(function (p) { p.x += p.dir * p.speed; }); g.f[0].x += Math.random() < 0.5 ? 1 : 0;']] }, (KK) => determinism(KK).same],
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
ok('R2.5 · THE KEYBOARD: A/D/W/S and the arrows, J light, K heavy, L special, Shift block; both ways at once is neither', CT.keyBits({ KeyA: 1, KeyJ: 1 }) === (B.L | B.LT) &&
  CT.keyBits({ ArrowRight: 1, KeyK: 1, ShiftLeft: 1 }) === (B.R | B.HV | B.BL) && CT.keyBits({ KeyA: 1, KeyD: 1, KeyL: 1 }) === B.SP && CT.keyBits({ KeyW: 1, KeyS: 1 }) === 0);
ok('R2.6 · FOUR touch buttons: Light, Heavy, Special, Block', J(CT.BUTTONS.map((b) => b.label)) === '["Light","Heavy","Special","Block"]' && CT.BUTTONS.every((b) => b.bit));
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
    const ai = seat ? [KK.ai.createAI(y, r), KK.ai.createAI(x, r)] : [KK.ai.createAI(x, r), KK.ai.createAI(y, r)];
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


if (RUNG < 3) return finish();
// ═══ R3 · THE CLIP TEST (owner ruling 2026-11-03): Indra and Meghnad, idle + light, from the owner's four Kling clips ═══
console.log('\n── ARCADE-1 · R3 clip test · the sheets ──');
const HEROS = ['indra', 'meghnad'];
const MAN = {}; HEROS.forEach((h) => { MAN[h] = JSON.parse(rd('fighters/' + h + '/manifest.json')); });
const BUDGET = { hi: { target: 1.2 * 1048576, cap: 1.6 * 1048576, px: 4096 }, lo: { target: 0.5 * 1048576, cap: 0.7 * 1048576, px: 2048 } };
function sheetsOk(man) {
  return ['hi', 'lo'].every((r) => { const R = man.rungs[r], bytes = fs.statSync(path.join(LAB, 'fighters', man.hero, R.sheet)).size;
    return bytes === R.bytes && bytes <= BUDGET[r].cap && R.size[0] <= BUDGET[r].px && R.size[1] <= BUDGET[r].px &&
      R.cells.every((c) => c.x >= 0 && c.y >= 0 && c.x + c.w <= R.size[0] && c.y + c.h <= R.size[1] && c.px >= 0 && c.px <= c.w && c.py >= c.h - 4 && c.py <= c.h + 4); });
}
const mb = (b) => (b / 1048576).toFixed(2) + ' MB';
ok('C1 · BOTH SHEETS PER HERO, INSIDE THE BUDGET (ruling 7): ' + HEROS.map((h) => MAN[h].name + ' hi ' + mb(MAN[h].rungs.hi.bytes) + ' (' + MAN[h].rungs.hi.size.join('×') + '), lo ' + mb(MAN[h].rungs.lo.bytes) + ' (' + MAN[h].rungs.lo.size.join('×') + ')').join(' · ') +
  ' — caps 1.6 / 0.7 MB, 4096 / 2048 px; every cell inside its sheet, its feet pivot inside the cell on its bottom edge', HEROS.every((h) => sheetsOk(MAN[h])));
ok('C2 · ONE STANCE HEIGHT, ONE GROUND LINE: both Heroes are scaled so the stance (feet to head top, from idle f0) is 320 px on the hi sheet and 192 on the lo (' +
  HEROS.map((h) => MAN[h].name + ' ' + MAN[h].stance.sourceHeight + ' px source').join(', ') + '), and every cell is cut on the feet',
  HEROS.every((h) => MAN[h].stance.heightPx.hi === 320 && MAN[h].stance.heightPx.lo === 192));
const CI = (h) => MAN[h].cellIndex;
ok('C3 · THE MOVES: idle = the tightest loop at 12 fps (' + HEROS.map((h) => MAN[h].name + ' ' + MAN[h].moves.idle.loopFrames + ' frames → ' + CI(h).idle.length + ' cells, closing at mean |Δ| ' + MAN[h].moves.idle.loopError).join('; ') +
  '); light = 2 startup + 1 contact + 3 recovery cells for the 5/3/9 phases', HEROS.every((h) => CI(h).idle.length === MAN[h].moves.idle.src.length && CI(h).idle.length >= 20 &&
  MAN[h].moves.idle.loopError < 2.5 && CI(h).light.startup.length === 2 && CI(h).light.active.length === 1 && CI(h).light.recovery.length === 3));
const wob = (h, m) => MAN[h].wobbleSource[m].map((v) => Math.hypot(v[0], v[1]));
ok('C4 · PIVOT WOBBLE: the idle feet hold within 2 px of the Hero\'s pivot (source px: ' + HEROS.map((h) => MAN[h].name + ' ≤' + Math.max(...wob(h, 'idle')).toFixed(1)).join(', ') +
  '); idle and light share one pivot — their stance frames register within 2 px', HEROS.every((h) => Math.max(...wob(h, 'idle')) <= 2 && Math.abs(MAN[h].wobbleSource.light[0][0]) <= 30));
ok('C5 · THE MATTE: no ground-coloured fringe on the weapon tip or the head, no green-tinted edge pixel left, rembg never needed (' +
  HEROS.map((h) => MAN[h].name + ' tinted ' + MAN[h].tintedEdgePixels + ', rembg ' + (MAN[h].rembgFrames.length || 'none')).join(' · ') + ')',
  HEROS.every((h) => MAN[h].tintedEdgePixels === 0 && MAN[h].fringe.weapon.maxShare <= 0.002 && MAN[h].fringe.head.maxShare <= 0.002));
ok('C6 · THE MIRROR TEST: every cell flips about its feet pivot and keeps its feet on the ground row (' + HEROS.map((h) => MAN[h].mirrorTest.feetOnGround + '/' + MAN[h].mirrorTest.of).join(', ') + ')',
  HEROS.every((h) => MAN[h].mirrorTest.pivotFlip && MAN[h].mirrorTest.feetOnGround === MAN[h].mirrorTest.of));
const tracked3 = git(['ls-files', 'lab/arcade']);
ok('C7 · THE CLIP LAW: no clip, frame or still is tracked — only the packed sheets and manifests (' + tracked3.filter((f) => f.includes('/fighters/')).length + ' fighter files)',
  !tracked3.some((f) => /\.(mp4|mov|mkv)$|\/sources\/|\/frames\/|fighter-right-green/.test(f)));

console.log('\n── ARCADE-1 · R3 clip test · in the fight ──');
function sceneArt(KK, hero, opp, steps) {   // play `steps` inputs for side 0, return what is drawn for side 0 on each frame
  const g = KK.fight.newFight({ p0: hero, p1: opp || 'box_surya' }), out = [];
  for (const inp of steps) { KK.fight.step(g, [inp, 0]); const sp = KK.scene.build(g, { fighters: MAN, rung: 'hi' }).shapes.find((x) => x.tag === 'sprite0'); out.push({ st: g.f[0].state, mf: g.f[0].mf, sp }); }
  return out;
}
function lightMapOk(KK, hero) {
  const m = KK.fight.moveOf({ arch: KK.moves.HEROES[hero].arch, move: 'light' }, 'light'), L = CI(hero).light;
  const steps = [KK.fight.BTN.LT].concat(new Array(m.startup + m.active + m.recovery + 2).fill(0));
  const fr = sceneArt(KK, hero, null, steps).filter((x) => x.st === 'attack');
  const want = (mf) => mf < m.startup ? L.startup[Math.floor(mf * 2 / m.startup)] : mf < m.startup + m.active ? L.active[0] : L.recovery[Math.min(2, Math.floor((mf - m.startup - m.active) * 3 / m.recovery))];
  return { ok: fr.length === m.startup + m.active + m.recovery && fr.every((x) => x.sp && x.sp.cell === want(x.mf)) && fr[0].sp.cell === L.startup[0] && fr[fr.length - 1].sp.cell === L.recovery[2],
    frames: fr.length, phases: fr.map((x) => x.sp && x.sp.phase[0]).join('') };
}
const LM = HEROS.map((h) => ({ h, ...lightMapOk(K, h) }));
ok('C8 · THE LIGHT IS STRETCHED ONTO THE GAME\'S OWN PHASES: startup cells on the startup frames, the contact cell exactly on the active frames, the recovery cells across the recovery (' +
  LM.map((x) => x.h + ' ' + x.frames + ' frames: ' + x.phases).join(' · ') + ')', LM.every((x) => x.ok), J(LM));
function idleOk(KK, hero) {
  const fr = sceneArt(KK, hero, null, new Array(150).fill(0)).filter((x) => x.st === 'idle' && x.sp), cells = fr.map((x) => x.sp.cell), n = CI(hero).idle.length;
  const changes = cells.filter((c, i) => i && c !== cells[i - 1]).length;
  return { ok: cells.every((c) => CI(hero).idle.includes(c)) && changes >= 25 && changes <= 32 && new Set(cells).size === Math.min(n, new Set(cells).size), changes };
}
const IL = HEROS.map((h) => ({ h, ...idleOk(K, h) }));
ok('C9 · THE IDLE LOOPS at 12 fps on the fight clock: 150 logic frames (2.5 s) step through ' + IL.map((x) => x.changes).join(' / ') + ' cell changes, all idle cells', IL.every((x) => x.ok));
function flipOk(KK) {
  const g = KK.fight.newFight({ p0: 'indra', p1: 'meghnad' }), sh = KK.scene.build(g, { fighters: MAN, rung: 'hi' }).shapes;
  const a = sh.find((x) => x.tag === 'sprite0'), b = sh.find((x) => x.tag === 'sprite1');
  return a && b && !a.flip && b.flip && Math.abs(a.x - (g.f[0].x / KK.fight.U - KK.scene.cameraX(g))) < 1e-9 && a.y === KK.scene.GROUND_Y && Math.abs(a.scale - 220 / 320) < 1e-9;
}
ok('C10 · FACING: the left Hero is drawn as authored, the right one mirrored; each stands with its feet pivot on its fighter\'s ground point, the stance 220 logical px tall', flipOk(K));
function boxesOk(KK) {
  const BB = KK.fight.BTN, w = sceneArt(KK, 'meghnad', null, [BB.R, BB.R, BB.R]).pop(), h = sceneArt(KK, 'meghnad', null, [BB.HV, 0, 0]).pop();
  const g = KK.fight.newFight({ p0: 'indra', p1: 'meghnad' }), sh = KK.scene.build(g, { rung: 'hi' }).shapes;
  return !w.sp && !h.sp && !sh.some((x) => x.k === 'sprite');
}
ok('C11 · EVERY OTHER MOVE IS STILL A BOX (walk, heavy …), and a fighter whose sheet did not load falls back to its box', boxesOk(K));
function archOk(KK) {
  const A = KK.moves.ARCH, mo = (h, m) => KK.fight.moveOf({ arch: KK.moves.HEROES[h].arch, move: m }, m);
  const fd = activeFrames(KK, 'light', { p0: 'meghnad', p1: 'box_surya' });
  return { ok: J(Object.assign({}, A.allrounder)) === J(Object.assign({}, A.balanced)) && mo('indra', 'light') === MV.light &&
    mo('meghnad', 'light').box.x1 === MV.light.box.x1 + 45 && mo('meghnad', 'heavy').box.x1 === MV.heavy.box.x1 + 45 &&
    mo('meghnad', 'light').recovery === MV.light.recovery + 2 && mo('meghnad', 'heavy').recovery === MV.heavy.recovery + 2 && mo('meghnad', 'special') === MV.special &&
    fd.act[0] === MV.light.startup && fd.back === MV.light.startup + MV.light.active + MV.light.recovery + 2, back: fd.back };
}
const AR = archOk(K);
ok('C12 · THE ARCHETYPES (ruling 4): Indra = all-rounder (the balanced numbers); Meghnad = reach — light and heavy reach 45 px further and recover 2 frames slower (his light is idle again at frame ' + AR.back + ', not 17); his special is unchanged', AR.ok);
const reachL = HEROS.map((h) => { const m = K.fight.moveOf({ arch: K.moves.HEROES[h].arch, move: 'light' }, 'light'); return MAN[h].name + ': the art\'s tip at contact ' + MAN[h].moves.light.tipFromPivotLogical + ' px from the feet, the light hitbox ' + m.box.x1 + ' px'; });
console.log('      (reach, logical px from the fighter\'s centre — ' + reachL.join(' · ') + ')');

console.log('\n── ARCADE-1 · R3 clip test · breakages: each must go red ──');
const BR3 = [
  ['K1 · the light\'s cells one frame early: startup shown off by one (C8 goes red)', { scene: [['if (f.mf < m.startup) return { move: "light", phase: "startup", cell: L.startup[Math.floor(f.mf * L.startup.length / m.startup)] };',
    'if (f.mf < m.startup) return { move: "light", phase: "startup", cell: L.startup[Math.min(1, Math.floor((f.mf + 2) * L.startup.length / m.startup))] };']] }, (KK) => HEROS.every((h) => lightMapOk(KK, h).ok)],
  ['K2 · the right-hand Hero not mirrored (C10 goes red)', { scene: [['flip: f.facing === -1,', 'flip: false,']] }, (KK) => flipOk(KK)],
  ['K3 · the reach archetype ignored (C12 goes red)', { fight: [['if (name === "special" || !(a.reachPx || a.recoveryAdd)) return base;', 'return base;']] }, (KK) => archOk(KK).ok],
  ['K4 · the idle loop driven by the move frame instead of the fight clock — it stops cycling (C9 goes red)', { scene: [['Math.floor(g.frame * man.fpsOut / 60) % n', 'Math.floor(f.mf * man.fpsOut / 60) % n']] }, (KK) => HEROS.every((h) => idleOk(KK, h).ok)]
];
for (const [name, mut, check] of BR3) { let still; try { still = check(load(mut)); } catch (e) { still = false; } red(name, !still); }
const badMan = JSON.parse(JSON.stringify(MAN.indra)); badMan.rungs.hi.cells[3].py -= 40;
red('K5 · a cell cut on the head instead of the feet: its pivot 40 px above the cell\'s bottom (C1 goes red)', !sheetsOk(badMan));

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
