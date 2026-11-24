'use strict';
// GUIDE-1 (owner rulings, 24 Nov 2026) — THE FIRST-BATTLE HAND GUIDE. Run: node src/test_guide.js
//
// On the SHIPPED index.html, in jsdom (borrowed from the site checkout's tests/node_modules — DY_WEB; absent → SKIPPED LOUDLY):
//   1 · the words      every line is the owner's ruled text, verbatim, and the Settings row reads as ruled
//   2 · the layer      takes no taps (pointer-events:none) except "Skip guide"; above the score column; hooks guarded
//   3 · the art        the three frames (WebP + PNG), the one config value (guide.json): each fingertip inside the hand's box
//   4 · the first battle, played: each step shows ONCE, in order — army · begin · keep · wait · card (+ the Play face) ·
//       total · special · pass · round — and the local step log is written; the match ends → the guide is done
//   5 · the round's three endings each get their own ruled line
//   6 · Skip ends it at once and for good · a second visit shows nothing · a player with a finished match sees nothing
//   7 · Replay ("Show the beginner guide again") brings it back
//   8 · never on the Hall's wire, the Daily Puzzle, a Story chapter or the staked view
//   9 · reduced motion = a still hand (no tap swap, no pulse)
//  10 · the same-task fixes: no Nagas for a first-timer's random enemy · plain "PLAY" · the header fits a phone · the site's
//       corner star clears the turn indicator
//  11 · the engine is untouched (3613706f…)
//  12 · breakages, in memory: each must turn its check red
// The tap-through and on-screen placement are proven on a real browser (headless Chrome, real layout) by the GUIDE-1
// screenshot run; jsdom has no layout engine.
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const GAME = path.resolve(__dirname, '..');
const WEB = process.env.DY_WEB || path.resolve(GAME, '..', 'divya-yuddha-web');
const HTML0 = fs.readFileSync(path.join(GAME, 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (name, cond, detail) => { if (cond) { pass++; console.log('  ✓ ' + name); } else { fail++; console.log('  ✖ ' + name + (detail ? '\n      ' + detail : '')); } };
const J = (x) => JSON.stringify(x);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rec = () => {};   // the first-battle flow keeps its own sampler; elsewhere there is nothing to sample

const RULED = {
  story: 'New here? Start with Story — it teaches you as you play.',
  army: 'Pick your army. Devas are the easiest to start with.',
  begin: 'Now tap Begin Battle.',
  keep: 'These are your 10 starting cards. You can swap up to 3. For your first battle, just tap Keep Destiny.',
  wait: 'Your opponent goes first. Wait for your turn.',
  card: 'Tap a card with a number. The number is its power.',
  play: 'Now tap Play to send it into battle.',
  total: "This is your total power. Beat your opponent's total to win the round.",
  special: 'Cards without a number are special powers. Tap one to read what it does.',
  pass: 'Ahead? Tap Pass Round to save your cards for later. Your opponent can still play.',
  won: 'Round won. One more and the battle is yours.',
  lost: 'Round lost. You have more cards — win the next two.',
  drawn: 'Round drawn. Win two rounds to take the battle.',
  skip: 'Skip guide',
};
const REPLAY = 'Show the beginner guide again';

let JSDOM = null, VirtualConsole = null;
try { ({ JSDOM, VirtualConsole } = require(require.resolve('jsdom', { paths: [path.join(WEB, 'tests')] }))); } catch (e) { JSDOM = null; }

function boot(HTML, query, o) {
  o = o || {};
  const errs = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', (e) => errs.push(String(e && e.message))); vc.on('error', (...a) => errs.push(a.join(' ')));
  const scripts = [];
  const markup = HTML.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/g, (m, attrs, body) => { const src = /\bsrc="([^"?]+)/.exec(attrs); scripts.push(src ? fs.readFileSync(path.join(GAME, src[1]), 'utf8') : body); return ''; });
  const dom = new JSDOM(markup, { url: 'https://game.test/index.html' + query, pretendToBeVisual: true, runScripts: 'outside-only', virtualConsole: vc });
  const w = dom.window;
  for (const [k, v] of Object.entries(o.store || {})) w.localStorage.setItem(k, v);
  w.matchMedia = (q) => ({ matches: !!o.reduce && /reduce/.test(q), media: q, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
  const ctx2 = new Proxy({}, { get: (t, k) => k === 'measureText' ? () => ({ width: 10 }) : /^create(Linear|Radial)Gradient$|^createPattern$/.test(String(k)) ? () => ({ addColorStop() {} }) : k === 'getImageData' ? () => ({ data: new Uint8ClampedArray(4) }) : () => {} });
  w.HTMLCanvasElement.prototype.getContext = () => ctx2;
  w.HTMLMediaElement.prototype.play = () => Promise.resolve(); w.HTMLMediaElement.prototype.pause = () => {}; w.HTMLMediaElement.prototype.load = () => {};
  const conf = fs.readFileSync(path.join(GAME, 'assets/guide/guide.json'), 'utf8');
  w.fetch = (u) => /guide\/guide\.json/.test(String(u)) ? Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(conf)) })
    : Promise.resolve({ ok: false, status: 404, arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)), json: () => Promise.resolve({}), text: () => Promise.resolve('') });
  w.scrollTo = () => {};
  w.eval(scripts.join('\n;\n') + '\n;window.__T = { get G(){ return G; }, get ME(){ return ME; }, get OPP(){ return OPP; }, get GD(){ return GD; }, get CARD_BY_NAME(){ return CARD_BY_NAME; }, get fselChoice(){ return fselChoice; }, set fselChoice(v){ fselChoice=v; }, get fselFirst(){ return fselFirst; }, get Story(){ return Story; }, get choreoActive(){ return choreoActive; } };');
  w.aiThinkTime = () => 700;   // the AI's human pause, shortened but long enough for the 250 ms guide tick to show "wait"
  return { w, T: w.__T, errs, $: (id) => w.document.getElementById(id) };
}
const vis = (P, id) => { const e = P.$(id); return !!e && !e.classList.contains('hidden'); };
async function until(fn, ms, label) { const t0 = Date.now(); while (Date.now() - t0 < (ms || 15000)) { let v = false; try { v = fn(); } catch (e) {} if (v) return true; await sleep(25); } throw new Error('timeout: ' + label); }

(async () => {
  // ═══ 1 · THE WORDS ═══
  console.log('── 1 · the words: the owner\'s ruled lines, verbatim ──');
  const m = /const GUIDE_TEXT = \{([\s\S]*?)\n\};/.exec(HTML0);
  let GT = null; try { GT = m ? Function('return {' + m[1] + '};')() : null; } catch (e) { GT = null; }
  ok('the guide\'s 14 lines are exactly the ruled lines (no more, no fewer, every character)', !!GT && J(GT) === J(RULED), J(GT));
  ok('the Settings row reads "' + REPLAY + '"', HTML0.includes('<button id="guide-replay" class="tgl">' + REPLAY + '</button>'));

  // ═══ 2 · THE LAYER ═══
  console.log('\n── 2 · the layer: no taps but Skip, above the score column, guarded hooks ──');
  const cssRule = (sel) => { const r = new RegExp('(^|\\n)' + sel.replace(/[#.()]/g, '\\$&') + '\\{([^}]*)\\}'); const x = r.exec(HTML0.replace(/ \{/g, '{')); return x ? x[2] : ''; };
  const layer = cssRule('#guide'), skip = cssRule('#guide-skip');
  const zGuide = +(/z-index:(\d+)/.exec(layer) || [])[1], zHud = +(/#hudwrap\{[^}]*?z-index:\s*(\d+)/.exec(HTML0.replace(/ \{/g, '{')) || /#hudwrap[^{]*\{[^}]*?z-index:\s*(\d+)/.exec(HTML0) || [])[1];
  ok('the layer takes no taps (pointer-events:none) and only "Skip guide" takes one (pointer-events:auto)', /pointer-events:none/.test(layer) && /pointer-events:auto/.test(skip) && (HTML0.match(/#guide[^{]*\{[^}]*pointer-events:auto/g) || []).length === 1, J({ layer, skip }));
  ok(`the layer sits above the score column (z ${zGuide} > ${zHud || 95})`, zGuide > (zHud || 95));
  const g0 = HTML0.indexOf('const GUIDE_TEXT = {'), g1 = HTML0.indexOf('\nfunction guideBoot('), g2 = HTML0.indexOf('\n}', g1) + 2;
  const outside = (HTML0.slice(0, g0) + HTML0.slice(g2)).split('\n').filter((l) => /\bguide[A-Z]\w*\(/.test(l));
  const guarded = outside.filter((l) => /try\{ guide(Act|ActPass|Tick|MatchStart|MatchEnd)\(\); \}catch\(e\)\{\}/.test(l));
  const bootLine = outside.filter((l) => l.includes('  try{ guideBoot(); }catch(e){}   // GUIDE-1: the guide boots on the vs-AI road only'));
  ok(`outside the guide's own block the game calls it only through guarded one-liners (${guarded.length}: doPlay · pass · the card zoom open and close · startGame · showGameOver) and the boot`, guarded.length === 6 && bootLine.length === 1 && outside.length === guarded.length + bootLine.length, outside.join('\n'));
  ok('the guide boots on the vs-AI road only: inside playIntro, which only the boot line\'s last branch reaches (never with ?wire=1 or ?puzzle=1); the boot line itself is unchanged', HTML0.includes('if (WIRE_MODE) wireBoot(); else if (PUZZLE_MODE) puzzleBoot(); else playIntro(showLanding);') && /function playIntro\(done\)\{\n  try\{ guideBoot\(\); \}catch\(e\)\{\}/.test(HTML0) && (HTML0.match(/playIntro\(/g) || []).length === 2);

  // ═══ 3 · THE ART ═══
  console.log('\n── 3 · the art: three frames, one config value ──');
  const files = ['hand_256', 'hand_pressed_256', 'glow_256'].flatMap((n) => ['webp', 'png'].map((e) => 'assets/guide/' + n + '.' + e));
  ok('the three frames ship as WebP with a PNG fallback: ' + files.map((f) => f.split('/').pop() + ' ' + (fs.existsSync(path.join(GAME, f)) ? Math.round(fs.statSync(path.join(GAME, f)).size / 1024) + ' KB' : 'MISSING')).join(' · '), files.every((f) => fs.existsSync(path.join(GAME, f))));
  let C = null; try { C = JSON.parse(fs.readFileSync(path.join(GAME, 'assets/guide/guide.json'), 'utf8')); } catch (e) {}
  const inBox = (p) => C && p[0] >= C.box[0] && p[0] <= C.box[2] && p[1] >= C.box[1] && p[1] <= C.box[3];
  ok('guide.json is the one value: each frame\'s fingertip and the hand\'s box, in the original frame\'s pixels (the owner\'s 1254px art: fingertips (232, 230) and (222, 293)) — both inside the box ' + J(C), !!C && C.frame === 1254 && J(C.hand) === '[232,230]' && J(C.pressed) === '[222,293]' && inBox(C.hand) && inBox(C.pressed));
  ok('guide.json gives each step its approach: from the lower right by default, from ABOVE for a target in the bottom 30% (then the fallbacks), with the arm\'s strip and the finger\'s angle measured from the art', !!C && Number.isFinite(C.finger) && Array.isArray(C.arm) && C.arm.length === 3 && C.approach && C.approach.default === 'lowerRight' && C.approach.bottom === 'above' && C.approach.bottomBand === 0.3 && Array.isArray(C.approach.fallback) && C.approach.fallback[0] === 'above');
  const ign = fs.readFileSync(path.join(GAME, '.gitignore'), 'utf8');
  ok('the owner\'s 1254px originals stay out of git and the build (.gitignore names all three; only the 256px copies ship)', ['hand', 'hand_pressed', 'glow'].every((n) => ign.split('\n').includes('assets/guide/' + n + '.png')));

  if (!JSDOM) { fail++; console.log('\n  ✖ SKIPPED LOUDLY — jsdom not found under ' + path.join(WEB, 'tests') + ' (set DY_WEB). Sections 4–10 did NOT run.'); return finish(); }

  // ═══ 4 · THE FIRST BATTLE, PLAYED ═══
  console.log('\n── 4 · the first battle, played: each step once, in order; the step log; the end ──');
  const flow = async (HTML, label) => {
    const P = boot(HTML, '?play=free', { reduce: true }), { w, T, $ } = P;
    const seq = []; let lastText = {};
    const rec = () => { const c = T.GD.cur; const t = vis(P, 'guide') ? (c === 'keep' ? $('mull-story').textContent : $('guide-line').textContent) : null; if (c && t) { if (seq[seq.length - 1] !== c) seq.push(c); lastText[c + (c === 'card' && vis(P, 'inspect') ? ':zoom' : '')] = t; } };
    const iv = setInterval(rec, 15);
    await until(() => T.GD.art, 3000, 'guide.json');
    await until(() => T.GD.cur === 'army', 4000, 'army'); rec();
    w.document.querySelector('#fsel-army .ftile[data-f="devas"]').click();
    await until(() => T.GD.cur === 'begin', 4000, 'begin'); rec();
    $('fselstart').click();
    for (let k = 0; k < 40 && T.G.firstThisRound !== T.OPP; k++) w.startGame('devas', T.G.players[1].faction);
    await until(() => T.GD.cur === 'keep', 4000, 'keep'); rec();
    const mullShown = vis(P, 'mull-story') && $('mull-story').textContent === RULED.keep;
    // a fixed hand so every step can come: the opponent holds nothing (it passes); you hold a strong Unit and a card without power
    const G = T.G, me = G.players[T.ME], op = G.players[T.OPP];
    const mk = (n) => w.mkCard(T.CARD_BY_NAME[n]);
    me.hand = [mk('Chandra Dev'), mk('Marut'), mk('Amrita Kalasha')]; op.hand = []; op.deck = [];
    $('mullconfirm').click();
    await until(() => T.GD.cur === 'wait' || T.G.turn === T.ME, 8000, 'wait or my turn');
    const sawWait = T.GD.cur === 'wait' || seq.includes('wait');
    await until(() => T.GD.cur === 'card' && !vis(P, 'inspect'), 8000, 'card');
    w.document.querySelector(`#hand .hc[data-uid="${me.hand[0].uid}"]`).click();
    await until(() => T.GD.cur === 'card' && vis(P, 'inspect'), 4000, 'play face');
    const playTarget = T.GD.target && T.GD.target.classList.contains('ibtn-play'); await sleep(40); rec();
    $('inspectFooter').querySelector('.ibtn-play').click();
    await until(() => T.GD.cur === 'total', 8000, 'total'); rec();
    const totalTarget = T.GD.target === $('hud-p');
    await until(() => T.GD.cur === 'special', 9000, 'special (after the 5 s of the total)'); rec();
    const specialTarget = T.GD.target && T.GD.target.dataset.uid == me.hand.find((c) => c.n === 'Amrita Kalasha').uid;
    T.GD.target.click(); await sleep(400); w.closeInspect();
    await until(() => T.GD.cur === 'pass', 8000, 'pass'); rec();
    const passTarget = T.GD.target === $('passbtn');
    $('passbtn').click();
    await until(() => T.GD.cur === 'round', 10000, 'round'); rec();
    const roundText = $('guide-line').textContent;
    // the rest of the match: pass to the end → the guide is done
    for (let k = 0; k < 40 && !T.G.over; k++) { await until(() => T.G.over || (T.G.turn === T.ME && !T.choreoActive && !T.G.players[T.ME].passed), 10000, 'turn'); if (!T.G.over) $('passbtn').click(); await sleep(30); }
    await until(() => T.G.over, 10000, 'over');
    await until(() => vis(P, 'gameover'), 15000, 'the result face').catch(() => {});
    await sleep(400); clearInterval(iv); rec();
    const dbg = { over: T.G.over, matchArmed: T.GD.matchArmed, prof: w.localStorage.getItem('dy_profile'), go: vis(P, 'gameover') };
    const store = JSON.parse(w.localStorage.getItem('dy_guide') || '{}');
    return { dbg, P, seq, lastText, mullShown, sawWait, playTarget, totalTarget, specialTarget, passTarget, roundText, store, errs: P.errs };
  };
  let F = null; try { F = await flow(HTML0); } catch (e) { ok('the first battle plays through with the guide', false, e.message); }
  if (F) {
    const ORDER = ['army', 'begin', 'keep', 'wait', 'card', 'total', 'special', 'pass', 'round'];
    ok('each step shows ONCE, in order: ' + F.seq.join(' → '), J(F.seq) === J(ORDER), J(F.seq));
    ok('each step says its ruled line', ['army', 'begin', 'keep', 'wait', 'card', 'total', 'special', 'pass'].every((k) => F.lastText[k] === RULED[k]) && F.lastText['card:zoom'] === RULED.play, J(F.lastText));
    ok('the Divine Choice\'s line goes in its own slot (#mull-story), the plate carries only "Skip guide"', F.mullShown);
    ok('the opponent opened (the coin flip) → "wait" showed', F.sawWait);
    ok('the pointers point at the ruled targets: Play in the card zoom · your total · the card without a number · Pass Round', F.playTarget && F.totalTarget && F.specialTarget && F.passTarget, J({ play: F.playTarget, total: F.totalTarget, special: F.specialTarget, pass: F.passTarget }));
    ok('round 1 won (the opponent held nothing) → "' + F.roundText + '"', F.roundText === RULED.won);
    ok('the match ended → the guide is done, and the local step log holds every stop: ' + J(F.store.steps), F.store.done === true && !F.store.skipped && ['arrived', 'army', 'kept', 'firstCard', 'round1', 'matchEnd'].every((k) => /^\d{4}-\d\d-\d\d$/.test(F.store.steps[k] || '')) && F.P.$('guide').classList.contains('hidden'), J(F.dbg));
    ok('the page ran clean (no script errors)', F.errs.filter((e) => !/Not implemented|navigation/.test(e)).length === 0, J(F.errs.slice(0, 3)));
  }

  // ═══ 5 · THE ROUND'S THREE ENDINGS ═══
  console.log('\n── 5 · the three endings of round 1 ──');
  {
    const P = boot(HTML0, '?play=free', { reduce: true }), { w, T, $ } = P;
    w.startGame('devas', 'asuras'); w.document.getElementById('mulligan').classList.add('hidden'); T.G.players[0].mulliganed = true;
    const got = {};
    for (const [k, v] of [['won', T.ME], ['lost', T.OPP], ['drawn', null]]) {
      const d = JSON.parse(w.localStorage.getItem('dy_guide') || '{}'); d.seen = { army: 1, begin: 1, keep: 1, wait: 1, card: 1, total: 1, special: 1, pass: 1 }; w.localStorage.setItem('dy_guide', JSON.stringify(d)); T.GD.data = null;   // the page holds dy_guide in memory: drop it so the edited record is read
      T.G.roundHistory = [{ round: 1, winner: v, totals: [5, 5] }]; T.G.round = 2; w.guideTick(); got[k] = T.GD.cur === 'round' ? $('guide-line').textContent : null; w.guideHide();
    }
    ok('won / lost / drawn each say their ruled line', got.won === RULED.won && got.lost === RULED.lost && got.drawn === RULED.drawn, J(got));
  }

  // ═══ 6 · SKIP · A SECOND VISIT · A RETURNING PLAYER ═══
  console.log('\n── 6 · Skip, a second visit, a returning player ──');
  const skipRun = async (HTML) => {
    const P = boot(HTML, '?play=free', { reduce: true }), { w, T, $ } = P;
    await until(() => T.GD.cur === 'army', 4000, 'army'); rec();
    const label = $('guide-skip').textContent;
    $('guide-skip').click(); await sleep(300);
    const d = JSON.parse(w.localStorage.getItem('dy_guide') || '{}');
    w.document.querySelector('#fsel-army .ftile[data-f="devas"]').click(); await sleep(300);
    return { label, done: d.done === true && d.skipped === true, hidden: $('guide').classList.contains('hidden') && T.GD.cur === null, stopped: !T.GD.iv, store: w.localStorage.getItem('dy_guide') };
  };
  let S = null; try { S = await skipRun(HTML0); } catch (e) { ok('Skip', false, e.message); }
  if (S) {
    ok('"Skip guide" is on the guide and ends it at once and for good (done + skipped, the layer hidden, nothing after)', S.label === RULED.skip && S.done && S.hidden && S.stopped, J(S));
    const P2 = boot(HTML0, '?play=free', { reduce: true, store: { dy_guide: S.store } }); await sleep(600);
    ok('a second visit after the guide is done shows nothing', P2.T.GD.cur === null && P2.$('guide').classList.contains('hidden') && !P2.T.GD.iv);
  }
  const returning = async (HTML) => { const P = boot(HTML, '?play=free', { reduce: true, store: { dy_profile: JSON.stringify({ name: 'Warrior', matches: 3, wins: 1 }) } }); await sleep(600); P.w.startGame('devas', 'asuras'); await sleep(400); return { none: P.T.GD.cur === null && P.$('guide').classList.contains('hidden') }; };
  const R = await returning(HTML0);
  ok('a player who has finished a match vs AI never sees it (the faction screen, the Divine Choice)', R.none);

  // ═══ 7 · REPLAY ═══
  console.log('\n── 7 · Replay ──');
  {
    const P = boot(HTML0, '?play=free', { reduce: true, store: { dy_profile: JSON.stringify({ name: 'Warrior', matches: 3, wins: 1 }), dy_guide: JSON.stringify({ v: 1, done: true, skipped: true, seen: { army: 1 }, steps: { arrived: '2026-11-24' } }) } }), { w, T, $ } = P;
    await sleep(300);
    w.syncSettingsUI(); $('settings').classList.remove('hidden'); $('guide-replay').click(); await sleep(100);
    const d = JSON.parse(w.localStorage.getItem('dy_guide'));
    w.startGame('devas', 'asuras'); await until(() => T.GD.cur === 'keep', 4000, 'keep after replay').catch(() => {}); rec();
    ok('"' + REPLAY + '" re-arms the guide (even for a returning player), closes Settings, keeps the step log, and the next battle shows its steps', d.replay === true && !d.done && J(d.seen) === '{}' && d.steps.arrived === '2026-11-24' && $('settings').classList.contains('hidden') && T.GD.cur === 'keep', J({ d, cur: T.GD.cur }));
  }

  // ═══ 8 · NEVER ON ANOTHER ROAD ═══
  console.log('\n── 8 · never on the wire, the puzzle, a Story chapter or the staked view ──');
  {
    const Pw = boot(HTML0, '?wire=1', { reduce: true }); await sleep(500);
    ok('the Hall\'s wire (?wire=1): the guide never boots', !Pw.T.GD.iv && Pw.T.GD.cur === null);
    const Pp = boot(HTML0, '?puzzle=1', { reduce: true }); await sleep(500);
    ok('the Daily Puzzle (?puzzle=1): the guide never boots', !Pp.T.GD.iv && Pp.T.GD.cur === null);
    const Ps = boot(HTML0, '?play=free', { reduce: true }); await sleep(400);
    let storyOk = false; try { Ps.w.startStoryChapter('b1c1'); await sleep(500); storyOk = !!Ps.T.Story && Ps.T.GD.cur === null && Ps.w.guidePick() === null; } catch (e) { storyOk = false; }
    ok('a Story chapter: nothing shows (Story has its own guidance)', storyOk);
    const Pv = boot(HTML0, '?play=free', { reduce: true }); await sleep(300); Pv.w.startGame('devas', 'asuras'); Pv.T.G._view = true;
    ok('the staked view (a view state): nothing shows', Pv.w.guidePick() === null && Pv.w.guideRoad() === false);
  }

  // ═══ 9 · REDUCED MOTION ═══
  console.log('\n── 9 · reduced motion: a still hand ──');
  {
    const Pr = boot(HTML0, '?play=free', { reduce: true }); await until(() => Pr.T.GD.cur === 'army', 4000, 'army').catch(() => {});
    const Pm = boot(HTML0, '?play=free', { reduce: false }); await until(() => Pm.T.GD.cur === 'army', 4000, 'army').catch(() => {});
    ok('reduced motion: the layer is still (no tap swap, no pulse) — with motion it is not', Pr.$('guide').classList.contains('still') && !Pm.$('guide').classList.contains('still'));
    ok('the stylesheet stops the tap swap and the pulse for reduced motion on its own too', /@media \(prefers-reduced-motion: reduce\)\{ #guide-glow, #guide-hand img\{ animation:none !important; \} #guide-pressimg\{ opacity:0 !important; \}/.test(HTML0));
  }

  // ═══ 9b · WHERE THE HAND GOES ═══
  console.log('\n── 9b · where the hand goes (the placement rule; real layout is proven in the screenshot run) ──');
  {
    const P = boot(HTML0, '?play=free', { reduce: true }), { w, T } = P; await until(() => T.GD.art, 3000, 'art').catch(() => {});
    const A = T.GD.art, W = 390, H = 844, k = A ? (A.frame * (80 / (A.box[3] - A.box[1]))) / A.frame : 0, el = w.document.getElementById('passbtn');
    const rect = (l, t, wd, ht) => ({ left: l, top: t, right: l + wd, bottom: t + ht, width: wd, height: ht });
    const low = A && w.guideFit(A, k, rect(216, 790, 161, 47), W, H, el, []), mid = A && w.guideFit(A, k, rect(140, 300, 109, 150), W, H, el, []);
    const wristUp = low && low.poly.every((p) => p[1] <= low.y + 1);
    // a control right above the bottom target: "above" now touches it, so the next approach without a touch is taken
    const blocked = A && (() => { const o = rect(150, 600, 240, 185); const keep = w.guideObstacles; w.guideObstacles = () => [o]; const f = w.guideFit(A, k, rect(216, 790, 161, 47), W, H, el, []); w.guideObstacles = keep; return f; })();
    ok('a target in the bottom 30% is approached from ABOVE (finger pointing down, the wrist straight up and away); one mid-screen from the lower right — the fingertip inside the target both times',
      !!low && low.name === 'above' && low.ang === 90 && wristUp && low.score === 0 && !!mid && mid.name === 'lowerRight' && mid.score === 0 && low.x >= 216 && low.x <= 377 && low.y >= 790 && low.y <= 837, J({ low: low && { n: low.name, a: low.ang, s: low.score }, mid: mid && { n: mid.name, s: mid.score } }));
    ok('when the configured approach would lie over another control, the next approach that touches none is taken (here: ' + (blocked && blocked.name) + ')', !!blocked && blocked.name !== 'above' && blocked.score === 0, J(blocked && { n: blocked.name, s: blocked.score }));
  }

  // ═══ 10 · THE SAME-TASK FIXES ═══
  console.log('\n── 10 · the same-task fixes ──');
  {
    const P = boot(HTML0, '?play=free', { reduce: true }), { w, T } = P; await sleep(300);
    const seen = new Set(); let rnd = 0; const R0 = w.Math.random;
    for (let k = 0; k < 200; k++) { w.Math.random = () => (k % 50) / 50; T.fselChoice = { p0: ['devas', 'asuras', 'vanaras'][k % 3], p1: null }; w.fselFirstSync(); seen.add(T.fselChoice.p1); }
    w.Math.random = R0;
    ok('a first-timer\'s random enemy is never the Nagas (200 draws: ' + [...seen].join(', ') + ')', !seen.has('nagas') && seen.size >= 2);
    let started = []; const sg = w.startGame; w.startGame = (a, b) => started.push(b);
    for (let k = 0; k < 40; k++) { w.Math.random = () => (k % 4) / 4 + 0.01; T.fselChoice = { p0: 'devas', p1: 'random' }; w.document.getElementById('fselstart').onclick(); }
    w.Math.random = R0; w.startGame = sg;
    ok('the RANDOM enemy tile, for a first-timer, never resolves to the Nagas (' + [...new Set(started)].join(', ') + ')', started.length === 40 && !started.includes('nagas'));
    ok('the card zoom\'s button reads plain "PLAY" (the ⚔ rendered as × in the font)', HTML0.includes('<button class="ibtn-play">PLAY</button>') && !HTML0.includes('PLAY ⚔'));
    ok('the battle header fits a phone: under 430px the realm chip gives way (ellipsis) so the ⚙ and the round stay on screen', /@media \(max-width:430px\)\{[\s\S]{0,400}#realmchip\{ flex:0 1 auto; min-width:0; overflow:hidden; text-overflow:ellipsis;/.test(HTML0));
    ok('the site\'s corner star clears the turn indicator on phones (#controls moves right only where the star exists)', HTML0.includes('@media (max-width:600px){ body:has(#dyw-gate-return) #controls{ padding-left:52px; } }'));
  }

  // ═══ 11 · THE ENGINE ═══
  console.log('\n── 11 · the engine ──');
  const sha = crypto.createHash('sha256').update(fs.readFileSync(path.join(GAME, 'src/engine.js'))).digest('hex');
  ok('src/engine.js is untouched (sha256 ' + sha.slice(0, 8) + '…)', sha.startsWith('3613706f'));

  // ═══ 12 · BREAKAGES ═══
  console.log('\n── 12 · breakages, in memory: each must turn its check red ──');
  {
    const b1 = HTML0.replace('#guide{ position:fixed; inset:0; z-index:97; pointer-events:none; }', '#guide{ position:fixed; inset:0; z-index:97; }');
    ok('B1 · the layer takes taps → red', b1 !== HTML0 && !/#guide\{ position:fixed; inset:0; z-index:97; pointer-events:none; \}/.test(b1));
    const b2 = HTML0.replace("if(d.replay) return true; return !((loadProfile().matches|0) > 0);", 'return true;');
    let R2 = null; try { R2 = await returning(b2); } catch (e) {}
    ok('B2 · the guide ignores a finished match → a returning player sees it → red', b2 !== HTML0 && R2 && !R2.none);
    const b3 = HTML0.replace("function guideSkip(e){ if(e){ e.preventDefault(); e.stopPropagation(); } guideFinish(true); }", 'function guideSkip(e){ guideHide(); }');
    let S3 = null; try { S3 = await skipRun(b3); } catch (e) {}
    ok('B3 · Skip only hides for a moment → red', b3 !== HTML0 && S3 && !(S3.done && S3.stopped));
    const b4 = HTML0.replace("    if(s.screen!==scr || seen[s.id]) continue;", '    if(s.screen!==scr) continue;');
    let F4 = null; try { F4 = await flow(b4); } catch (e) { F4 = { seq: ['(the flow broke: ' + e.message + ')'] }; }
    ok('B4 · a step shown again after it was seen → the once-in-order check is red (' + (F4 && F4.seq.join(' → ')) + ')', b4 !== HTML0 && F4 && J(F4.seq) !== J(['army', 'begin', 'keep', 'wait', 'card', 'total', 'special', 'pass', 'round']));
  }
  finish();
})().catch((e) => { fail++; console.log('  ✖ the suite crashed: ' + (e && e.stack || e)); finish(); });

function finish() {
  console.log('\n' + (fail === 0 ? '✓ ALL ' + pass + ' GUIDE CHECKS PASS' : '✖ ' + fail + ' FAILURES / ' + pass + ' passed'));
  process.exit(fail === 0 ? 0 : 1);
}
