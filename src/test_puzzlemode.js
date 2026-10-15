'use strict';
// MINI-GAMES-1 · DAILY PUZZLE EFFECTS (R1) — THE BATTLE SCREEN IN PUZZLE MODE (?puzzle=1), IN A REAL DOM.
//
//   node src/test_puzzlemode.js              the suite
//   node src/test_puzzlemode.js --mutants    the deliberate breakages: each must turn its named checks RED
//
// The SHIPPED page runs in jsdom (the test_logpanel way: index.html's markup and its scripts evaluated together), with
// the site's own puzzle code (play/daily/puzzle-core.js) and the 14 puzzles (play/daily/puzzles.json) borrowed from the
// site checkout (DY_WEB) — absent → SKIPPED LOUDLY, a counted failure. The site's solver and the game's engine run
// headless here as the referee: for every puzzle, the winning line and wrong lines are played through the frame's real
// choreography road, and the event list the choreography received must equal the headless engine's, event for event.
//
//   1 · IN CODE        the switch is ?puzzle=1 (never on the wire road); every hook outside the block is one of the
//                      named one-line guards
//   2 · THE POSITION   silent setup (no landing pops, no realm sweep, no conch, no mulligan, no intro); speed at Normal
//   3 · THE 14         each winning line and wrong lines: events == headless engine, result == solver, nothing skipped.
//                      The winning lines exist only at run time: the site's solver finds them, and each is checked against
//                      the site's salted fingerprints (tests/fixtures/daily-answers.sha256.json). No answer is written here.
//   0 · NO LEAK        the site's N5 rule, here: no line of these files names a winning card beside a win/answer word,
//                      or beside a puzzle number
//   4 · THE RULES      no tap-to-skip; no AI move; one card per try; nothing after the result; reset = the same position
//   5 · LOADING        only the position's effects: the sheets, clips and actors each puzzle can trigger — no more
//   6 · SOUND          sound effects fetched, battle music never fetched or started
//   7 · REDUCED MOTION mirrors the battle: no choreography, the same events and result
//   8 · ?puzzle ABSENT the battle unchanged
const fs = require('fs'), path = require('path');
const GAME = path.resolve(__dirname, '..');
const WEB = process.env.DY_WEB || path.resolve(GAME, '..', 'divya-yuddha-web');
const HTML_PATH = process.env.DY_PZ_HTML || path.join(GAME, 'index.html');   // override = a mutant copy
const ONLY = process.env.DY_PZ_ONLY ? process.env.DY_PZ_ONLY.split(',') : null;   // run only these groups (the mutant runner)
let pass = 0, fail = 0;
const failed = [];
const ok = (name, cond, detail) => { if (cond) { pass++; console.log('  ✓ ' + name); } else { fail++; failed.push(name); console.log('  ✖ ' + name + (detail ? '\n      ' + detail : '')); } };
const J = (x) => JSON.stringify(x);
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, ' ').split('\n').map((l) => l.replace(/(^|[\s;,(){}])\/\/.*$/, '$1')).join('\n');
const HTML = fs.readFileSync(HTML_PATH, 'utf8');
const group = (g) => !ONLY || ONLY.indexOf(g) >= 0;

// ═══ MUTANTS ═══
if (process.argv.indexOf('--mutants') >= 0) {
  const { spawnSync } = require('child_process');
  const os = require('os');
  const SRC = fs.readFileSync(path.join(GAME, 'index.html'), 'utf8');
  const M = [
    ['allow tap-to-skip', 'layer.onclick=PUZZLE_MODE ? null : skipChoreo;', 'layer.onclick=skipChoreo;', 'rules', /no tap-to-skip/],
    ['let the AI move', "if (PUZZLE_MODE){ pzPump(); return; }", "if (PUZZLE_MODE){ pzPump(); }", 'rules', /no AI move/],
    ['animate the setup', "knownUids = boardUidSet(); lastPowers = {}; lastRoundLen = G.roundHistory.length;", "knownUids = new Set(); lastPowers = {}; lastRoundLen = 0;", 'position', /silent/],
    ['load effects the position cannot trigger', 'VFX.loadSheets(sheets);', 'VFX.loadMatchSheets(currentFactions.p0, currentFactions.p1);', 'loading', /only the position's sheets/],
    ['play music', ".filter(([k])=>!(PUZZLE_MODE && (k==='menu'||k==='battle')))", '', 'sound', /music/],
  ];
  let caught = 0;
  for (const [name, from, to, grp, want] of M) {
    if (SRC.indexOf(from) < 0) { console.log('  ✖ mutant "' + name + '": its anchor is gone from index.html'); continue; }
    const f = path.join(os.tmpdir(), 'dy_pz_mutant_' + process.pid + '.html');
    fs.writeFileSync(f, SRC.split(from).join(to));
    const r = spawnSync(process.execPath, [__filename], { env: Object.assign({}, process.env, { DY_PZ_HTML: f, DY_PZ_ONLY: grp }), encoding: 'utf8', timeout: 900000 });
    fs.unlinkSync(f);
    const red = (r.stdout || '').split('\n').filter((l) => /^\s*✖/.test(l));
    const hit = red.some((l) => want.test(l));
    if (hit) caught++;
    console.log((hit ? '  ✓ CAUGHT ' : '  ✖ MISSED ') + 'mutant "' + name + '" → ' + (red.length ? red.length + ' red: ' + red.slice(0, 3).map((l) => l.trim().slice(2, 90)).join(' | ') : 'nothing turned red'));
  }
  console.log('\n' + (caught === M.length ? '✓ ALL ' + M.length + ' MUTANTS CAUGHT' : '✖ ' + (M.length - caught) + ' MUTANT(S) MISSED'));
  process.exit(caught === M.length ? 0 : 1);
}

// ═══ 1 · IN CODE ═══
if (group('code')) {
  console.log('── 1 · in code ──');
  const code = strip(HTML);
  ok('the switch: PUZZLE_MODE is ?puzzle=1, and never on the wire road',
     /const PUZZLE_MODE = \/\[\?&\]puzzle=1\(&\|\$\)\/\.test\(location\.search\) && !WIRE_MODE;/.test(code));
  ok('the boot line: wire → wireBoot, puzzle → puzzleBoot, else the intro and the landing as before',
     /if \(WIRE_MODE\) wireBoot\(\); else if \(PUZZLE_MODE\) puzzleBoot\(\); else playIntro\(showLanding\);/.test(code));
  const bStart = code.indexOf('const PUZZLE_MODE ='), bEnd = code.indexOf('\nfunction pump(){');
  const outside = (code.slice(0, bStart) + code.slice(bEnd)).split('\n').filter((l) => /PUZZLE_MODE|pzActionStart|pzMay\(|pzPump\(|loadSheets|body\.puzzle/.test(l)).map((l) => l.trim());
  const HOOKS = [
    "body.puzzle #gearbtn, body.puzzle #unbindbtn, body.puzzle #shieldbtn{ display:none !important; }",
    "loading=Promise.all(Object.entries(AUDIO_SRC).filter(([k])=>!(PUZZLE_MODE && (k==='menu'||k==='battle'))).map(async ([k,url])=>{",
    "preloadSprites, loadMatchSheets, loadSheets:(keys)=>(keys||[]).forEach(loadSheet)",
    "if (PUZZLE_MODE) pzActionStart(evStart);",
    "const layer=$('choreolayer'); layer.classList.add('locked'); layer.onclick=PUZZLE_MODE ? null : skipChoreo;",
    "if (PUZZLE_MODE && !pzMay('card')) return;",
    "if (PUZZLE_MODE){ pzPump(); return; }",
    "if(PUZZLE_MODE) return;",
    "if (WIRE_MODE) wireBoot(); else if (PUZZLE_MODE) puzzleBoot(); else playIntro(showLanding);",
  ];
  const unmatched = outside.filter((l) => !HOOKS.some((h) => l.indexOf(h) === 0 || l.startsWith(h.slice(0, 60))));
  ok('outside the block, puzzle mode touches the page only through the ' + HOOKS.length + ' named one-line guards (' + outside.length + ' lines)',
     outside.length === HOOKS.length && unmatched.length === 0, J(unmatched.concat(outside.length !== HOOKS.length ? ['count ' + outside.length] : [])));
  ok('the AI seam: pump enters puzzle mode BEFORE the match-over return, the conch and any AI call',
     (() => { const i = code.indexOf('function pump(){'), body = code.slice(i, code.indexOf('\n}', i));
       const p = body.indexOf('if (PUZZLE_MODE){ pzPump(); return; }'); return p > 0 && p < body.indexOf('if (G.over) return;') && p < body.indexOf('fireConch') && p < body.indexOf('aiTakeTurn'); })());
  ok('rewards OFF: showGameOver leaves a puzzle right after the wire exit, BEFORE recordMatchResult',
     /function showGameOver\(\)\{\s*if\(Wire\)\{ showWireResult\(\); return; \}\s*if\(PUZZLE_MODE\) return;/.test(code) &&
     (() => { const i = code.indexOf('function showGameOver(){'), b = code.slice(i, i + 600); return b.indexOf('if(PUZZLE_MODE) return;') < b.indexOf('recordMatchResult()'); })());
  ok('the block sends only puzzle words to the parent, same origin, never "*"',
     (() => { const blk = code.slice(bStart, bEnd); return /window\.parent\.postMessage\(msg, location\.origin\)/.test(blk) && !/postMessage\([^)]*'\*'/.test(blk) && /ev\.origin === location\.origin && ev\.source === window\.parent/.test(blk); })());
}

// ═══ the DOM harness ═══
let JSDOM = null, VirtualConsole = null;
try { ({ JSDOM, VirtualConsole } = require(require.resolve('jsdom', { paths: [path.join(WEB, 'tests')] }))); } catch (e) { JSDOM = null; }
const CORE_PATH = path.join(WEB, 'play', 'daily', 'puzzle-core.js'), LIST_PATH = path.join(WEB, 'play', 'daily', 'puzzles.json');
const domGroups = ['position', 'fourteen', 'rules', 'loading', 'sound', 'reduced', 'absent'].filter(group);
if ((!JSDOM || !fs.existsSync(CORE_PATH) || !fs.existsSync(LIST_PATH))) {
  fail++; failed.push('SKIPPED');
  console.log('  ✖ SKIPPED LOUDLY — jsdom / the site\'s puzzle code not found under ' + WEB + ' (set DY_WEB). The DOM proofs did NOT run.');
  finish();
} else main().then(finish, (e) => { fail++; console.log('  ✖ THE SUITE THREW: ' + (e && e.stack || e)); finish(); });

function finish() {
  console.log('\n' + (fail === 0 ? '✓ ALL ' + pass + ' PUZZLE-MODE CHECKS PASS' : '✖ ' + fail + ' FAILURES / ' + pass + ' passed'));
  process.exit(fail === 0 ? 0 : 1);
}

async function main() {
  const E = require(path.join(GAME, 'src', 'engine.js'));
  const PZ = require(CORE_PATH);
  const RAW = JSON.parse(fs.readFileSync(LIST_PATH, 'utf8'));
  const LIST = Array.isArray(RAW) ? RAW : RAW.puzzles;
  const CORE = fs.readFileSync(CORE_PATH, 'utf8');
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // ── boot the shipped page; query decides the road ──
  function boot(query, o) {
    o = o || {};
    const errs = [], posted = [], fetched = [], images = [], spies = { ai: 0, playTrack: [], played: [], showGameOver: 0 };
    const vc = new VirtualConsole();
    vc.on('jsdomError', (e) => errs.push(String(e && e.message)));
    vc.on('error', (...a) => errs.push(a.join(' '))); vc.on('log', (...a) => errs.push('console.log: ' + a.join(' ')));
    const scripts = [];
    const markup = HTML.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/g, (m, attrs, body) => { const src = /\bsrc="([^"?]+)/.exec(attrs); scripts.push(src ? fs.readFileSync(path.join(GAME, src[1]), 'utf8') : body); return ''; });
    const dom = new JSDOM(markup, { url: 'https://game.test/game/index.html' + query, pretendToBeVisual: true, runScripts: 'outside-only', virtualConsole: vc });
    const w = dom.window;
    if (o.speed) w.localStorage.setItem('dy_speed', o.speed);
    w.matchMedia = (q) => ({ matches: !!o.reduce && /reduce/.test(q), media: q, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
    const ctx = new Proxy({}, { get: (t, k) => k === 'measureText' ? () => ({ width: 10 }) : /^create(Linear|Radial)Gradient$|^createPattern$/.test(String(k)) ? () => ({ addColorStop() {} }) : k === 'getImageData' ? () => ({ data: new Uint8ClampedArray(4) }) : () => undefined, set: () => true });
    w.HTMLCanvasElement.prototype.getContext = () => ctx;
    w.HTMLMediaElement.prototype.play = () => Promise.resolve(); w.HTMLMediaElement.prototype.pause = () => {}; w.HTMLMediaElement.prototype.load = () => {};
    // fetch serves the real files of this checkout (the clip registry, the clip specs, the sounds) and records every URL
    w.fetch = (u) => {
      const url = new URL(String(u), w.location.href); fetched.push(url.pathname);
      const rel = decodeURIComponent(url.pathname).replace(/^\/game\//, '').replace(/^\//, ''), p = path.join(GAME, rel);
      if (!fs.existsSync(p) || !fs.statSync(p).isFile()) return Promise.resolve({ ok: false, status: 404, arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)), json: () => Promise.reject(new Error('404')), text: () => Promise.resolve(''), blob: () => Promise.resolve(new w.Blob([])) });
      const buf = fs.readFileSync(p);
      return Promise.resolve({ ok: true, status: 200, arrayBuffer: () => Promise.resolve(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length)), json: () => Promise.resolve(JSON.parse(buf.toString('utf8'))), text: () => Promise.resolve(buf.toString('utf8')), blob: () => Promise.resolve(new w.Blob([buf])) });
    };
    // every image the page asks for is recorded (the effect sheets among them); none ever finishes loading
    const NativeImage = w.Image;
    w.Image = function () { const im = new NativeImage(); const d = Object.getOwnPropertyDescriptor(w.HTMLImageElement.prototype, 'src');
      Object.defineProperty(im, 'src', { get() { return d.get.call(im); }, set(v) { images.push(String(v)); } }); return im; };
    if (o.audio) {   // a minimal Web Audio, so the real loadAudio runs on the first gesture
      const node = () => new Proxy({ gain: { value: 1, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {}, cancelScheduledValues() {} }, threshold: {}, knee: {}, ratio: {}, attack: {}, release: {}, frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, Q: {} },
        { get: (t, k) => k in t ? t[k] : (k === 'connect' || k === 'disconnect' || k === 'start' || k === 'stop') ? () => {} : undefined, set: (t, k, v) => { t[k] = v; return true; } });
      w.AudioContext = function () { return { state: 'running', currentTime: 0, sampleRate: 44100, destination: {}, resume() {}, createGain: node, createDynamicsCompressor: node, createBufferSource: node, createOscillator: node, createBiquadFilter: node,
        createBuffer: () => ({ getChannelData: () => new Float32Array(8) }), decodeAudioData: () => Promise.resolve({ duration: 1 }) }; };
    }
    w.scrollTo = () => {};
    w.postMessage = (m) => posted.push(JSON.parse(JSON.stringify(m)));   // the frame → its parent (in jsdom the parent is this window)
    if (o.core !== false) w.eval(CORE);   // the parent page has the puzzle code; the frame finds window.DY_PUZZLE
    w.eval(scripts.join('\n;\n') + '\n;window.__T = { get G(){ return G; }, get Pz(){ return Pz; }, get speedMult(){ return speedMult; }, get conchPending(){ return conchPending; }, get choreoActive(){ return choreoActive; }, get choreoSkip(){ return choreoSkip; }, get aiTimer(){ return aiTimer; }, get ME(){ return ME; }, get Story(){ return Story; }, get Wire(){ return Wire; }, get Audio2(){ return Audio2; }, get Q(){ return Q; } };');
    w.cDelay = () => Promise.resolve();   // the choreography's waits resolve at once (timing is measured in a real browser, not here)
    w.aiThinkTime = () => 0;              // a wrongly reached AI would move at once
    const ai = w.aiTakeTurn; w.aiTakeTurn = function () { spies.ai++; return ai.apply(this, arguments); };
    const pe = w.playEvent; w.playEvent = function (ev) { spies.played.push(JSON.parse(JSON.stringify(ev))); return pe.apply(this, arguments); };
    const A2 = w.__T.Audio2, pt = A2.playTrack; A2.playTrack = function (n) { spies.playTrack.push(n); return pt.apply(this, arguments); };
    const say = (data) => w.onPuzzleMessage({ origin: w.location.origin, source: w.parent, data: JSON.parse(JSON.stringify(data)) });
    return { w, T: w.__T, errs, posted, fetched, images, spies, say };
  }
  const $ = (w, id) => w.document.getElementById(id);
  const last = (F, type) => { for (let i = F.posted.length - 1; i >= 0; i--) if (F.posted[i].type === type) return F.posted[i]; return null; };
  async function until(fn, ms) { const t = Date.now(); while (!fn()) { if (Date.now() - t > (ms || 60000)) return false; await sleep(5); } return true; }
  async function result(F, n) { await until(() => F.posted.filter((p) => p.type === 'puzzle:result').length >= n, 90000); return last(F, 'puzzle:result'); }
  async function load(F, P, kind) { const from = F.posted.length; F.say(kind === 'reset' ? { type: 'puzzle:reset' } : { type: 'puzzle:load', puzzle: P });
    const mine = () => F.posted.slice(from).filter((m) => m.type === 'puzzle:loaded' && m.id === P.id).pop();
    await until(() => !!mine(), 30000); return mine() || null; }

  // uid → offset from the game's first card, so two engines' events compare event for event
  function uidBase(g) { let m = Infinity; (function walk(x, d) { if (!x || typeof x !== 'object' || d > 3) return; if (typeof x.uid === 'number' && x.uid < m) m = x.uid; for (const k in x) walk(x[k], d + 1); })(g.players, 0); return m; }
  function norm(evs, base) { return evs.map((e) => { const c = JSON.parse(JSON.stringify(e)); if (typeof c.sourceUid === 'number') c.sourceUid -= base; if (Array.isArray(c.targetUids)) c.targetUids = c.targetUids.map((u) => typeof u === 'number' ? u - base : u); return c; }); }
  // the headless referee: the site's run() over the game's engine — the same line, from the same position
  function headless(P, line) {
    const g0 = PZ.load(P, E), n0 = g0.events.length;
    const cand = line.play ? { play: line.play, target: line.target == null ? null : line.target, pos: line.pos == null ? null : line.pos } : { pass: true };
    const r = PZ.run(P, E, PZ.SEEDS[0], cand, line.before || [], line.after || []);
    return { events: norm(r.g.events.slice(n0), uidBase(r.g)), win: r.win, you: r.you, them: r.them };
  }

  const SOLVED = LIST.map((P) => { const s = PZ.solve(P, E); return { P, s, win: s.winners[0] }; });

  // ═══ 0 · NO LEAK ═══ (always, whatever the group: the winners are computed here, never read from a list)
  {
    console.log('\n── 0 · no answer in plain text (the game repo is public) ──');
    const FX_PATH = path.join(WEB, 'tests', 'fixtures', 'daily-answers.sha256.json'), DG_PATH = path.join(WEB, 'scripts', 'puzzle-answer-digest.js');
    const FIX = JSON.parse(fs.readFileSync(FX_PATH, 'utf8')), { answerDigest } = require(DG_PATH);
    const bad = SOLVED.filter(({ P, s, win }) => !(s.ok && s.winners.length === 1 && FIX.digests[P.id] === answerDigest(FIX.salt, P.id, win.play, win.target)));
    ok('the winning plays come from the site\'s solver at run time, and each matches the site\'s salted fingerprint (' + SOLVED.length + ')', bad.length === 0 && SOLVED.length === Object.keys(FIX.digests).length, bad.map((x) => x.P.id).join(' '));
    const wnames = [...new Set(SOLVED.flatMap(({ win }) => [win.play, win.target && win.target.replace(/#\d+$/, '')].filter(Boolean)))];
    const allDefs = Object.values(E.DECKS).flat(), wids = [...new Set(SOLVED.map(({ win }) => (allDefs.find((d) => d.n === win.play) || {}).id).filter(Boolean))];
    const WORD = /\b(win|wins|won|winning|winner|answer|solution|solves|correct)\b/i;
    const full = fs.readFileSync(path.join(GAME, 'index.html'), 'utf8');
    const blkLines = full.slice(full.indexOf('const PUZZLE_MODE ='), full.indexOf('\nfunction pump(){')).split('\n');
    const hookLines = full.split('\n').filter((l) => /PUZZLE_MODE|pzActionStart|pzMay\(|pzPump\(|loadSheets|body\.puzzle/.test(l));
    const sources = [['src/test_puzzlemode.js', fs.readFileSync(__filename, 'utf8').split('\n')], ['index.html (puzzle block + hooks)', blkLines.concat(hookLines)],
                     ['CLAUDE.md (puzzle lines)', fs.readFileSync(path.join(GAME, 'CLAUDE.md'), 'utf8').split('\n').filter((l) => /puzzle/i.test(l))]];
    const leaks = [];
    for (const [f, lines] of sources) lines.forEach((l, i) => { const low = l.toLowerCase();
      const named = wnames.some((n) => low.indexOf(n.toLowerCase()) >= 0) || wids.some((id) => l.indexOf("'" + id + "'") >= 0);
      if (named && WORD.test(l)) leaks.push(f + ':' + (i + 1) + ' (win word)');
      if (wnames.some((n) => l.indexOf(n) >= 0) && /#\d/.test(l)) leaks.push(f + ':' + (i + 1) + ' (puzzle number)'); });
    ok('N5 here: no line names a winning card (' + wnames.length + ' names, ' + wids.length + ' ids) beside a win/answer word or a puzzle number', leaks.length === 0, leaks.join(' '));
  }

  // ═══ 2 · THE POSITION ═══
  if (group('position')) {
    console.log('\n── 2 · the position, shown silently ──');
    const F = boot('?puzzle=1', { speed: 'fast' });
    const { w, T } = F;
    ok('boot: puzzle:ready to the parent, no intro, no landing, the End turn button', F.posted.length === 1 && F.posted[0].type === 'puzzle:ready' &&
       $(w, 'landing').classList.contains('hidden') && $(w, 'introv').classList.contains('hidden') && w.document.body.classList.contains('puzzle') && $(w, 'passbtn').textContent === 'END TURN');
    const P = LIST[2];   // a Vanara position with a Hero on the board and one in hand
    const ld = await load(F, P);
    const fp = (g) => PZ.fingerprint(E, g);
    ok('the position is the site\'s: the frame\'s board is PZ.load\'s board (fingerprint)', !!T.G && fp(T.G) === fp(PZ.load(P, E)));
    ok('silent: no landing pop on any board card, no banner, no round banner from the setup, the log starts empty',
       w.document.querySelectorAll('#field .bc').length > 0 && w.document.querySelectorAll('#field .bc.landing').length === 0 &&
       $(w, 'banner').classList.contains('hidden') && $(w, 'logbody').children.length === 0, 'landing=' + w.document.querySelectorAll('#field .bc.landing').length);
    ok('silent: no conch armed, no mulligan, no realm sweep — the realm chip shows the realm', T.conchPending === false && $(w, 'mulligan').classList.contains('hidden') &&
       !$(w, 'realmchip').classList.contains('hidden') && $(w, 'realmname').textContent === E.REALM_INFO[P.realm].name);
    ok('speed fixed at Normal even when the player chose Fast (and the player\'s setting is left as it was)', T.speedMult === 1 && w.localStorage.getItem('dy_speed') === 'fast');
    ok('the settings, shield and unbind buttons are hidden in a puzzle (CSS on body.puzzle)', /body\.puzzle #gearbtn, body\.puzzle #unbindbtn, body\.puzzle #shieldbtn\{ display:none !important; \}/.test(HTML));
    ok('loaded: the parent is told the id and what loads', ld && ld.id === P.id && Array.isArray(ld.sheets) && Array.isArray(ld.clips) && Array.isArray(ld.actors));
    ok('no rewards: the page never records a puzzle as a match (matchRecorded is set, no result face)', $(w, 'gameover').classList.contains('hidden') && F.errs.length === 0, J(F.errs.slice(0, 3)));
  }

  // ═══ 3 · THE 14 ═══
  if (group('fourteen')) {
    console.log('\n── 3 · the 14 puzzles: the choreography receives exactly the engine\'s events ──');
    const F = boot('?puzzle=1');
    const { w, T } = F;
    let nres = 0, wrongN = 0;
    const rowsWin = [], rowsWrong = [];
    for (const { P, s, win } of SOLVED) {
      // the winning line (the reveal road): the solver's own line
      await load(F, P);
      const line = { play: win.play, target: win.target, pos: win.line.pos, before: win.line.before, after: win.line.after };
      const p0 = F.spies.played.length;
      F.say({ type: 'puzzle:perform', line });
      const r = await result(F, ++nres);
      const H = headless(P, line), base = uidBase(T.G);
      const got = norm(r.events, base), chor = norm(F.spies.played.slice(p0), base);
      rowsWin.push({ id: P.id, same: J(got) === J(H.events) && J(chor) === J(H.events), result: r.win === true && r.you === win.you && r.them === win.them && H.win, n: H.events.length, r: r.you + '–' + r.them, solver: win.you + '–' + win.them, cut: r.cut });
      // wrong lines: Pass, and the first losing card play
      const wrongs = s.plays.filter((p) => !p.win);
      const picks = [wrongs.find((p) => p.pass), wrongs.find((p) => !p.pass)].filter(Boolean);
      for (const wp of picks) {
        const wl = wp.pass ? { before: [], after: [] } : { play: wp.play, target: wp.target, pos: null, before: [], after: [] };
        const q0 = F.spies.played.length;
        F.say({ type: 'puzzle:perform', line: wl });   // a reported try → the frame reloads the position first
        const rr = await result(F, ++nres);
        const HW = headless(P, wl), b2 = uidBase(T.G);
        const g2 = norm(rr.events, b2), c2 = norm(F.spies.played.slice(q0), b2);
        wrongN++;
        rowsWrong.push({ id: P.id, key: wp.key, same: J(g2) === J(HW.events) && J(c2) === J(HW.events), result: rr.win === HW.win && rr.win === false && rr.you === HW.you && rr.them === HW.them, n: HW.events.length });
      }
    }
    for (const x of rowsWin) ok('#' + (rowsWin.indexOf(x) + 1) + ' ' + x.id + ' WIN ' + x.r + ': ' + x.n + ' events — the choreography received the engine\'s, every one; the result is the solver\'s (' + x.solver + ')', x.same && x.result && !x.cut, J(x));
    ok(wrongN + ' wrong lines (Pass and a losing play, every puzzle): the choreography received the engine\'s events; the result is the engine\'s loss',
       rowsWrong.every((x) => x.same && x.result), J(rowsWrong.filter((x) => !(x.same && x.result)).slice(0, 3)));
    ok('the frame never reached the result face or recorded a match, and threw nothing', $(w, 'gameover').classList.contains('hidden') && F.errs.length === 0, J(F.errs.slice(0, 3)));
  }

  // ═══ 4 · THE RULES ═══
  if (group('rules')) {
    console.log('\n── 4 · the rules of a try ──');
    const F = boot('?puzzle=1');
    const { w, T } = F;
    // a wrong try first: the opponent wins the round, so round 2 would be THEIRS to lead — the AI must still never move
    const { P, s } = SOLVED[0];
    await load(F, P);
    const card = s.plays.find((p) => !p.win && !p.pass && !p.target);
    F.say({ type: 'puzzle:perform', line: { play: card.play, before: [], after: [] } });
    let sawLock = false, layerTap = null;
    await until(() => { if (T.choreoActive) { sawLock = true; const L = $(w, 'choreolayer'); layerTap = L.onclick; if (L.onclick) L.onclick(); else L.click(); } return F.posted.some((p) => p.type === 'puzzle:result'); }, 60000);
    const r1 = last(F, 'puzzle:result');
    ok('no tap-to-skip: while the choreography runs the layer takes no tap, and a tap skips nothing', sawLock && layerTap === null && T.choreoSkip === false && r1 && !r1.cut, J({ sawLock, layerTap: String(layerTap), skip: T.choreoSkip }));
    ok('every event of the try was played by the choreography (nothing skipped)', r1 && F.spies.played.length === r1.events.length, (r1 && r1.events.length) + ' vs ' + F.spies.played.length);
    await sleep(300);
    ok('no AI move: the opponent won the round and leads the next, yet the AI is never entered and no AI timer is set',
       r1 && r1.win === false && T.G.turn !== T.ME && F.spies.ai === 0 && T.aiTimer === null, J({ win: r1 && r1.win, turn: T.G.turn, ai: F.spies.ai }));
    // the player's own road: one card through startPlay, a second card refused, End turn
    await load(F, P, 'reset');
    const me = T.G.players[T.ME];
    const free = (name) => me.hand.findIndex((c) => c.n === name);
    const plays = s.plays.filter((p) => !p.pass && !p.target).map((p) => p.play);
    const h0 = me.hand.length;
    w.startPlay(free(plays[0]), null);
    await until(() => !T.choreoActive, 30000);
    const h1 = me.hand.length;
    w.startPlay(free(plays[1]), null);
    await until(() => !T.choreoActive, 30000);
    ok('one card per try: the first card plays, a second is refused with a plain line', h1 === h0 - 1 && me.hand.length === h1 && /One play only/.test(w.document.body.textContent), J({ h0, h1, now: me.hand.length }));
    $(w, 'passbtn').click();
    const r2 = await result(F, 2);
    ok('End turn scores the round and reports it: the result, the score, the events and the timings', r2 && typeof r2.win === 'boolean' && Number.isInteger(r2.you) && Number.isInteger(r2.them) &&
       Array.isArray(r2.events) && r2.steps.length === 2 && r2.steps[0].kind === 'play' && r2.steps[1].kind === 'end' && r2.steps.every((x) => x.ms >= 0) && r2.wallMs >= 0, J(r2 && r2.steps));
    const hAfter = me.hand.length, posts = F.posted.length;
    w.startPlay(0, null); $(w, 'passbtn').click(); $(w, 'leapbtn').click();
    await sleep(100);
    ok('after the result nothing more can be done: no play, no End turn, no Leap', T.G.players[T.ME].hand.length === hAfter && F.posted.length === posts && !T.choreoActive && F.spies.ai === 0);
    const ld3 = await load(F, P, 'reset');
    ok('reset: the same position again, and the try is counted', PZ.fingerprint(E, T.G) === PZ.fingerprint(E, PZ.load(P, E)) && ld3.tries === 3 && T.Pz.cardPlayed === false && !T.Pz.reported);
    ok('a message from another origin is ignored', (() => { const n = F.posted.length; w.onPuzzleMessage({ origin: 'https://evil.test', source: w.parent, data: { type: 'puzzle:perform', line: { before: [], after: [] } } }); return F.posted.length === n && !T.choreoActive; })());
    ok('the rules ran clean: no script error, no console.log', F.errs.length === 0, J(F.errs.slice(0, 3)));
  }

  // ═══ 5 · LOADING ═══
  if (group('loading')) {
    console.log('\n── 5 · loading: only what the position can trigger ──');
    // the referee's own table (read from the battle's effect code, not from the frame): shared status quartet + per puzzle
    const SHARED = ['damage', 'buff', 'shield', 'venom'];
    const EXPECT = {
      'dp-2026-10-15': { sheets: ['c1a_deva'], clips: [] },
      'dp-2026-10-16': { sheets: ['landing_naga'], clips: [] },
      'dp-2026-10-17': { sheets: ['landing_vanara', 'ramanaam', 'kishkindhaoath_fire'], clips: [] },
      'dp-2026-10-18': { sheets: ['landing_asura', 'chaos_wash', 'chaos_mark', 'tamasa'], clips: [] },
      'dp-2026-10-19': { sheets: ['landing_vanara', 'gandiva', 'lankadahan_fire', 'lankadahan_wash', 'kishkindhaoath_fire'], clips: ['lankadahan'] },
      'dp-2026-10-20': { sheets: ['c1a_deva', 'vajra', 'pavamana'], clips: ['vajra'] },
      'dp-2026-10-21': { sheets: ['chaos_wash', 'chaos_mark', 'pashupatastra', 'nagastra', 'ahamkara'], clips: ['pashupata'] },
      'dp-2026-10-22': { sheets: ['c1a_deva', 'sudarshana', 'vajra'], clips: ['sudarshana', 'vajra'] },
      'dp-2026-10-23': { sheets: ['landing_asura', 'chaos_wash', 'chaos_mark'], clips: [] },
      'dp-2026-10-24': { sheets: ['landing_naga', 'mohini', 'nagapasha'], clips: [] },
      'dp-2026-10-25': { sheets: ['landing_vanara', 'lankadahan_fire', 'lankadahan_wash', 'gandiva', 'ramanaam', 'kishkindhaoath_fire'], clips: ['lankadahan'] },
      'dp-2026-10-26': { sheets: ['c1a_deva', 'ahamkara'], clips: [] },
      'dp-2026-10-27': { sheets: ['landing_naga', 'patala'], clips: [] },
      'dp-2026-10-28': { sheets: ['c1a_deva', 'amrita_bless', 'amrita_revive', 'pavamana'], clips: [] },
    };
    const CLIP_DIR = (d) => /^lankadahan/.test(d) ? 'lankadahan' : /^sudarshana/.test(d) ? 'sudarshana' : /^venomstrike/.test(d) ? 'venomstrike' : d;
    const sort = (a) => [...new Set(a)].sort();
    const rows = [];
    for (const { P } of SOLVED) {
      const F = boot('?puzzle=1');
      const ld = await load(F, P);
      await sleep(50);
      const sheets = sort(F.images.filter((u) => /assets\/vfx\/game\//.test(u)).map((u) => /vfx_([a-z0-9_]+)\.png/.exec(u)[1]));
      const clips = sort(F.fetched.filter((u) => /\/assets\/manifest\/effects\//.test(u)).map((u) => CLIP_DIR(u.split('/assets/manifest/effects/')[1].split('/')[0])));
      const actors = sort(F.fetched.filter((u) => /\/assets\/manifest\/actors\/[^/]+\//.test(u)).map((u) => u.split('/assets/manifest/actors/')[1].split('/')[0]));
      const want = EXPECT[P.id];
      rows.push({ id: P.id, sheets, want: sort(SHARED.concat(want.sheets)), clips, wantClips: sort(want.clips), actors, said: sort(ld.sheets), saidClips: sort(ld.clips), saidActors: ld.actors });
    }
    ok('only the position\'s sheets: every puzzle fetches exactly the sheets its plays and board can trigger (the referee\'s table), no faction set',
       rows.every((x) => J(x.sheets) === J(x.want) && J(x.said) === J(x.want)), J(rows.filter((x) => J(x.sheets) !== J(x.want) || J(x.said) !== J(x.want)).map((x) => [x.id, x.sheets, x.want]).slice(0, 3)));
    ok('only the position\'s premium clips: each puzzle fetches the clips of its own legal plays and nothing else — none for the opponent\'s passed hand',
       rows.every((x) => J(x.clips) === J(x.wantClips) && J(x.saidClips) === J(x.wantClips)), J(rows.filter((x) => J(x.clips) !== J(x.wantClips) || J(x.saidClips) !== J(x.wantClips)).map((x) => [x.id, x.clips, x.wantClips]).slice(0, 3)));
    ok('no Hero actor anywhere: no batch-1 puzzle has a legal Hero play (a Hero held in hand but not playable is not fetched)',
       rows.every((x) => x.actors.length === 0 && x.saidActors.length === 0), J(rows.filter((x) => x.actors.length).map((x) => [x.id, x.actors])));
    // coverage: every sheet the battle can draw is either loaded by puzzle mode when its trigger is present, or never drawn
    const code = strip(HTML), names = /const SHEET_NAMES=\[([^\]]+)\]/.exec(code)[1].match(/'([a-z0-9_]+)'/g).map((x) => x.slice(1, -1));
    const blk = code.slice(code.indexOf('const PUZZLE_MODE ='), code.indexOf('\nfunction pump(){'));
    const LEGACY_ONLY = ['aura_1', 'aura_2', 'smoke_1', 'smoke_2', 'surge_1', 'surge_2', 'venom_1', 'venom_2'];
    const HERO_ENTRY = ['deva_hero_entry', 'indra_hero_entry', 'agni_hero_entry', 'varuna_hero_entry'];
    const uncovered = names.filter((k) => LEGACY_ONLY.indexOf(k) < 0 && blk.indexOf("'" + k + "'") < 0 && HERO_ENTRY.indexOf(k) < 0);
    ok('coverage: every sheet in the battle\'s catalog (' + names.length + ') is named by puzzle mode, or is legacy-only, or is a hero entry behind DEVA_HERO_ENTRY_ON', uncovered.length === 0 && /const DEVA_HERO_ENTRY_ON = false;/.test(code), J(uncovered));
    ok('the loader\'s landing map is the battle\'s own LANDING_SHEET', /const LANDING_SHEET=\{ devas:'c1a_deva', asuras:'landing_asura', vanaras:'landing_vanara', nagas:'landing_naga' \}/.test(code) &&
       /const PZ_LANDING = \{ devas:'c1a_deva', asuras:'landing_asura', vanaras:'landing_vanara', nagas:'landing_naga' \}/.test(code));
  }

  // ═══ 6 · SOUND ═══
  if (group('sound')) {
    console.log('\n── 6 · sound: effects on, battle music off ──');
    const F = boot('?puzzle=1', { audio: true });
    const { w } = F;
    await load(F, LIST[5]);
    w.document.body.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));   // the first gesture unlocks audio
    await sleep(100);
    const audio = F.fetched.filter((u) => /\/assets\/audio\//.test(u));
    ok('the first gesture fetches the sound effects (' + audio.filter((u) => /sfx_/.test(u)).length + ' files)', audio.filter((u) => /sfx_/.test(u)).length === 18, J(audio));
    ok('battle music is never fetched (no music file) and never started (no playTrack)', !audio.some((u) => /music_/.test(u)) && F.spies.playTrack.length === 0, J({ music: audio.filter((u) => /music_/.test(u)), playTrack: F.spies.playTrack }));
  }

  // ═══ 7 · REDUCED MOTION ═══
  if (group('reduced')) {
    console.log('\n── 7 · reduced motion mirrors the battle ──');
    const F = boot('?puzzle=1', { reduce: true });
    const { T, w } = F;
    let n = 0, allSame = true, noChoreo = true;
    for (const i of [0, 6, 10]) {
      const { P, win } = SOLVED[i];
      await load(F, P); n++;
      const line = { play: win.play, target: win.target, pos: win.line.pos, before: win.line.before, after: win.line.after };
      F.say({ type: 'puzzle:perform', line });
      const r = await result(F, n);
      const H = headless(P, line);
      if (J(norm(r.events, uidBase(T.G))) !== J(H.events) || !r.win || r.you !== win.you || !r.reducedMotion) allSame = false;
    }
    if (F.spies.played.length !== 0 || $(w, 'choreolayer').classList.contains('locked')) noChoreo = false;
    ok('reduced motion: no choreography step runs and the layer never locks — as in the battle', noChoreo, 'played ' + F.spies.played.length);
    ok('reduced motion: the same events, the same result and score, reported (3 puzzles)', allSame);
  }

  // ═══ 8 · ?puzzle ABSENT ═══
  if (group('absent')) {
    console.log('\n── 8 · ?puzzle absent: the battle unchanged ──');
    const F = boot('', { audio: true, core: false });
    const { w, T } = F;
    ok('no puzzle words, no puzzle class, PASS ROUND, the intro gates the launch as before', F.posted.length === 0 && !w.document.body.classList.contains('puzzle') &&
       $(w, 'passbtn').textContent === 'PASS ROUND' && !$(w, 'introv').classList.contains('hidden'));
    w.startGame();
    ok('a vs-AI match keeps the both-hands prefetch and the faction sheets (fxPrefetchHands / mfPrefetchHands are the battle\'s own)',
       /for\(const pl of G\.players\)/.test(String(w.fxPrefetchHands)) && /for\(const pl of G\.players\)/.test(String(w.mfPrefetchHands)) &&
       F.images.some((u) => /vfx_c1a_deva\.png/.test(u)));
    w.document.body.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
    await sleep(100);
    ok('battle music is fetched and started as before', F.fetched.some((u) => /music_battle\.mp3/.test(u)) && F.spies.playTrack.indexOf('battle') >= 0, J(F.spies.playTrack));
    $(w, 'mullconfirm').click();
    await until(() => T.G.turn === T.ME && !T.choreoActive && T.aiTimer === null, 60000);
    const Q = T.Q, me = T.G.players[T.ME], legal = Q.playableIndices(T.G, T.ME), i = legal.find((k) => { const c = me.hand[k]; const sp = Q.targetSpec(T.G, T.ME, c); return !(sp && sp.options && sp.options.length) && c.t === 'unit'; });
    let tap = 'none';
    if (i != null) { w.doPlay(i, null, null); tap = $(w, 'choreolayer').onclick; }
    ok('tap-to-skip is the battle\'s: the choreography layer takes skipChoreo', tap === w.skipChoreo, String(tap).slice(0, 40));
  }
}
