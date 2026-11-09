'use strict';
// GROW-COUNT-1 (owner rulings 2026-11-03) — THE PLAYER-COUNTER HOOKS. Run: node src/test_count_hook.js
//
// The site's copy of this game loads the site's counter (play/shared/count.js, window.DY_COUNT) ahead of every game
// script; this game only reports a FINISHED match through three guarded one-liners. Standalone (github.io) DY_COUNT does
// not exist, so nothing is counted there. What must hold, on the SHIPPED index.html:
//   1 · vs-AI      showGameOver reports 'match' once, after recordMatchResult — past the wire/puzzle/story early returns
//   2 · story      showStoryResult reports 'story' once, after its one-shot guard
//   3 · Hall       showWireResult (the Hall's free and staked result face) reports 'hall' once — no wire logic touched
//   4 · nowhere else (the Daily Puzzle's frame is counted by the page around it; no hook in the render loop)
//   6 · share (GROWTH-1 #11, owner ruling 2026-11-06 — the approved FOURTH line): challengeFriend reports 'challenge' once,
//       guarded, and only for a share the player made (never a cancelled one)
//   7 · SHARE-2 (owner rulings 2026-11-09): the share ROW — Facebook (link only) · WhatsApp · X (text + link) count on the tap,
//       Copy link a made copy, More a made share (never a cancelled one); every link goes to /challenge/
//   5 · every hook is GUARDED: no DY_COUNT → nothing; a DY_COUNT that throws → the game carries on
// Each rule has a breakage applied to the source text in memory; every one must turn its check red.
const fs = require('fs'), path = require('path');
const GAME = path.resolve(__dirname, '..');
const HTML = fs.readFileSync(path.join(GAME, 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (name, cond, detail) => { if (cond) { pass++; console.log('  ✓ ' + name); } else { fail++; console.log('  ✖ ' + name + (detail ? '\n      ' + detail : '')); } };

const HOOK = /^  try\{ window\.DY_COUNT && window\.DY_COUNT\.finished\('(match|story|hall)'\); \}catch\(e\)\{\}/;
// a function's body by brace matching from its declaration (the battle script's own top-level functions)
function body(src, name) {
  const i = src.indexOf('\nfunction ' + name + '(');
  if (i < 0) return null;
  let j = src.indexOf('{', i), d = 0;
  for (let k = j; k < src.length; k++) { const c = src[k]; if (c === '{') d++; else if (c === '}' && --d === 0) return src.slice(j + 1, k); }
  return null;
}
const SHARE = /^  try\{ window\.DY_COUNT && window\.DY_COUNT\.shared\('challenge'\); \}catch\(e\)\{\}/;
const hooksIn = (text) => (text || '').split('\n').filter((l) => /DY_COUNT/.test(l));
// → the list of broken rules for a source text (empty = all hold)
function rules(src) {
  const bad = [];
  const go = body(src, 'showGameOver'), st = body(src, 'showStoryResult'), wr = body(src, 'showWireResult');
  if (!go || !st || !wr) return ['a result function is missing'];
  const one = (text, kind, after, label) => {
    const h = hooksIn(text);
    if (h.length !== 1 || !HOOK.test(h[0]) || HOOK.exec(h[0])[1] !== kind) { bad.push(label + ': expected exactly one guarded ' + kind + ' hook'); return; }
    const at = text.indexOf(h[0]);
    after.forEach((a) => { const p = text.indexOf(a); if (p < 0 || p > at) bad.push(label + ': the hook must come after ' + JSON.stringify(a)); });
  };
  one(go, 'match', ['if(Wire){', 'if(PUZZLE_MODE) return;', 'if(Story){', 'recordMatchResult();'], 'showGameOver');
  one(st, 'story', ['Story.resultShown=true;'], 'showStoryResult');
  one(wr, 'hall', ['blogClose(G, r);'], 'showWireResult');
  const ch = body(src, 'challengeFriend');
  if (!ch) bad.push('challengeFriend is missing');
  else {
    const h = hooksIn(ch);
    if (h.length !== 1 || !SHARE.test(h[0])) bad.push('challengeFriend: expected exactly one guarded shared(\'challenge\') line');
    else { const g = ch.indexOf("if(r!=='shared' && r!=='copied') return;"); if (g < 0 || g > ch.indexOf(h[0])) bad.push('challengeFriend: the share must be counted only after a made share (never a cancelled one)'); }
  }
  const all = src.split('\n').filter((l) => /DY_COUNT/.test(l));
  if (all.length !== 4) bad.push('DY_COUNT appears on ' + all.length + ' lines (exactly the three finish hooks and the one share line allowed)');
  return bad;
}
// run one hook line against a stand-in window: → { threw, calls }
function runHook(line, win) {
  const calls = [];
  if (win && win.DY_COUNT === 'recorder') win.DY_COUNT = { finished: (k) => calls.push(k) };
  let threw = false;
  try { new Function('window', line.replace(/\/\/.*$/, ''))(win); } catch (e) { threw = true; }
  return { threw, calls };
}

// 7 · SHARE-2 (owner rulings 2026-11-09): the CHALLENGE A FRIEND row — run the shipped share block against stand-ins
function shareBlock(src) { const a = src.indexOf('const CHALLENGE_TEXT'), b = src.indexOf('\nfunction syncChallengeButton('); return a < 0 || b < 0 ? null : src.slice(a, b); }
function runWay(src, via, o) {
  o = o || {}; const opened = [], counted = [], toasts = [], copied = [];
  const nav = { clipboard: { writeText: (t) => { copied.push(t); return Promise.resolve(); } } };
  if (o.sheet) nav.share = () => o.sheet === 'cancel' ? Promise.reject({ name: 'AbortError' }) : Promise.resolve();
  const win = { open: (u, n, f) => { opened.push([u, n, f]); return null; }, DY_COUNT: { shared: (k) => counted.push(k) }, DY_SHARE: o.helper || null };
  const run = new Function('window', 'navigator', 'toastMute', shareBlock(src) + '\nreturn challengeFriend(' + JSON.stringify(via) + ');');
  run(win, nav, (t) => toasts.push(t));
  return new Promise((r) => setTimeout(() => r({ opened, counted, toasts, copied }), 0));
}
const CT = 'I just won a battle in Divya Yuddha. Think you can beat the AI? Play free:';
const LINK = 'https://divyayuddha.games/challenge/?utm_source=direct&utm_medium=share&utm_campaign=challenge';
async function shareRules(src) {
  const bad = []; if (!shareBlock(src)) return ['the share block is missing'];
  const fb = await runWay(src, 'facebook'), wa = await runWay(src, 'whatsapp'), x = await runWay(src, 'x');
  const cp = await runWay(src, 'copy'), mo = await runWay(src, 'more', { sheet: 'ok' }), mc = await runWay(src, 'more', { sheet: 'cancel' });
  if (!(fb.opened.length === 1 && fb.opened[0][0] === 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(LINK) && fb.opened[0][1] === '_blank')) bad.push('Facebook: the sharer page with the link only, in a new window');
  if (!(wa.opened.length === 1 && wa.opened[0][0] === 'https://wa.me/?text=' + encodeURIComponent(CT + ' ' + LINK))) bad.push('WhatsApp: wa.me with the approved text + the link');
  if (!(x.opened.length === 1 && x.opened[0][0] === 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(CT) + '&url=' + encodeURIComponent(LINK))) bad.push('X: the tweet intent with the approved text and the link');
  if (![fb, wa, x].every((r) => r.counted.join() === 'challenge' && !r.toasts.length)) bad.push('Facebook/WhatsApp/X: one challenge share each, counted on the tap');
  if (!(cp.copied.join() === CT + ' ' + LINK && cp.counted.join() === 'challenge' && cp.toasts.join() === 'Link copied' && !cp.opened.length)) bad.push('Copy link: copies the text + link, one share, "Link copied"');
  if (!(mo.counted.join() === 'challenge' && !mo.opened.length)) bad.push('More: a made share counts once');
  if (!(mc.counted.length === 0 && mc.copied.length === 0)) bad.push('More: a cancelled sheet is not a share');
  return bad;
}

console.log('── GROW-COUNT-1 · the player-counter hooks ──');
const live = rules(HTML);
ok('1–4, 6 · showGameOver → match (after recordMatchResult, past the wire/puzzle/story returns), showStoryResult → story, showWireResult → hall; DY_COUNT on no other line',
  live.length === 0, live.join(' | '));
const lines = HTML.split('\n').filter((l) => HOOK.test(l));
ok('5a · STANDALONE: with no DY_COUNT each hook does nothing and throws nothing', lines.length === 3 && lines.every((l) => { const r = runHook(l, {}); return !r.threw; }));
ok('5b · a DY_COUNT that throws never breaks the result face (the hook swallows it)', lines.every((l) => !runHook(l, { DY_COUNT: { finished() { throw new Error('down'); } } }).threw));
ok('5c · with the site counter present, each hook reports its own kind exactly once (match, story, hall)',
  lines.map((l) => runHook(l, { DY_COUNT: 'recorder' }).calls.join(',')).sort().join('|') === 'hall|match|story');
const SL = HTML.split('\n').filter((l) => SHARE.test(l));
const runShare = (win) => { const calls = []; if (win.DY_COUNT === 'recorder') win.DY_COUNT = { shared: (k) => calls.push(k) }; let threw = false;
  try { new Function('window', SL[0].replace(/\/\/.*$/, ''))(win); } catch (e) { threw = true; } return { threw, calls }; };
ok('6a · the share line: standalone it does nothing and throws nothing; a throwing counter never breaks the share', SL.length === 1 && !runShare({}).threw && !runShare({ DY_COUNT: { shared() { throw new Error('down'); } } }).threw);
ok("6b · with the site counter present it reports 'challenge' exactly once", SL.length === 1 && runShare({ DY_COUNT: 'recorder' }).calls.join(',') === 'challenge');

console.log('\n── breakages: each must go red ──');
const lineOf = (k) => lines.find((l) => l.indexOf("finished('" + k + "')") >= 0);
const M = lineOf('match'), S = lineOf('story'), W = lineOf('hall');
const breaks = [
  ['B1 · the vs-AI hook removed', (s) => s.replace(M + '\n', '')],
  ['B2 · the vs-AI hook moved above the puzzle/story returns (a puzzle frame or a story chapter would count as a match)', (s) => s.replace(M + '\n', '').replace("  if(PUZZLE_MODE) return;", M + "\n  if(PUZZLE_MODE) return;")],
  ['B3 · the story hook removed', (s) => s.replace(S + '\n', '')],
  ['B4 · the Hall hook removed', (s) => s.replace(W + '\n', '')],
  ['B5 · a hook left unguarded (no try/catch)', (s) => s.replace(M, "  window.DY_COUNT && window.DY_COUNT.finished('match');")],
  ['B7 · the share line removed', (s) => s.replace(SL[0] + '\n', '')],
  ['B8 · the share counted before the made-share check (a cancelled share would count)', (s) => s.replace(SL[0] + '\n', '').replace("    if(r!=='shared' && r!=='copied') return;", SL[0] + "\n    if(r!=='shared' && r!=='copied') return;")],
  ['B9 · the share line left unguarded (no try/catch)', (s) => s.replace(SL[0], "  window.DY_COUNT && window.DY_COUNT.shared('challenge');")],
  ['B6 · a fourth hook in the render loop (render runs every frame)', (s) => s.replace('\nfunction render(', "\nfunction render(){ try{ window.DY_COUNT && window.DY_COUNT.finished('match'); }catch(e){} }\nfunction __render_was(")],
];
for (const [name, mut] of breaks) {
  const m = mut(HTML);
  ok(name + ' → red', m !== HTML && rules(m).length > 0, 'the mutation did not apply or was not caught');
}

(async () => {
console.log('\n── SHARE-2 · the CHALLENGE A FRIEND row ──');
const sr = await shareRules(HTML);
ok('7 · Facebook (link only) · WhatsApp (text + link) · X (text + link) count on the tap; Copy link counts a made copy ("Link copied"); More counts a made share, never a cancelled one; every link goes to /challenge/', sr.length === 0, sr.join(' | '));
ok('7b · the row: the heading CHALLENGE A FRIEND, plain-text buttons Facebook · WhatsApp · X · Copy link · More (More only where the phone has a share sheet)',
  HTML.indexOf("h.textContent='CHALLENGE A FRIEND'") > 0 && HTML.indexOf("const CHALLENGE_WAYS = [['facebook','Facebook'], ['whatsapp','WhatsApp'], ['x','X'], ['copy','Copy link'], ['more','More']];") > 0 &&
  HTML.indexOf("if(via==='more' && typeof navigator.share!=='function') return;") > 0);
const sb = [
  ['B10 · Facebook given pre-filled text', (s) => s.replace("'https://www.facebook.com/sharer/sharer.php?u='+u", "'https://www.facebook.com/sharer/sharer.php?u='+u+'&quote='+t")],
  ['B11 · the challenge link back to the home page', (s) => s.replace("https://divyayuddha.games/challenge/?utm_source=direct", "https://divyayuddha.games/?utm_source=direct")],
  ['B12 · a cancelled sheet counted', (s) => s.replace("(e && e.name==='AbortError') ? 'cancelled'", "(e && e.name==='AbortError') ? 'shared'")],
];
for (const [name, mut] of sb) { const m = mut(HTML); ok(name + ' → red', m !== HTML && (await shareRules(m)).length > 0, 'the mutation did not apply or was not caught'); }
console.log('\n' + (fail === 0 ? '✓ ALL ' + pass + ' COUNT-HOOK CHECKS PASS' : '✖ ' + fail + ' FAILURES / ' + pass + ' passed'));
process.exit(fail === 0 ? 0 : 1);
})();
