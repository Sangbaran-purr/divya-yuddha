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
  const all = src.split('\n').filter((l) => /DY_COUNT/.test(l));
  if (all.length !== 3) bad.push('DY_COUNT appears on ' + all.length + ' lines (exactly the three hooks allowed)');
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

console.log('── GROW-COUNT-1 · the player-counter hooks ──');
const live = rules(HTML);
ok('1–4 · showGameOver → match (after recordMatchResult, past the wire/puzzle/story returns), showStoryResult → story, showWireResult → hall; DY_COUNT on no other line',
  live.length === 0, live.join(' | '));
const lines = HTML.split('\n').filter((l) => HOOK.test(l));
ok('5a · STANDALONE: with no DY_COUNT each hook does nothing and throws nothing', lines.length === 3 && lines.every((l) => { const r = runHook(l, {}); return !r.threw; }));
ok('5b · a DY_COUNT that throws never breaks the result face (the hook swallows it)', lines.every((l) => !runHook(l, { DY_COUNT: { finished() { throw new Error('down'); } } }).threw));
ok('5c · with the site counter present, each hook reports its own kind exactly once (match, story, hall)',
  lines.map((l) => runHook(l, { DY_COUNT: 'recorder' }).calls.join(',')).sort().join('|') === 'hall|match|story');

console.log('\n── breakages: each must go red ──');
const lineOf = (k) => lines.find((l) => l.indexOf("finished('" + k + "')") >= 0);
const M = lineOf('match'), S = lineOf('story'), W = lineOf('hall');
const breaks = [
  ['B1 · the vs-AI hook removed', (s) => s.replace(M + '\n', '')],
  ['B2 · the vs-AI hook moved above the puzzle/story returns (a puzzle frame or a story chapter would count as a match)', (s) => s.replace(M + '\n', '').replace("  if(PUZZLE_MODE) return;", M + "\n  if(PUZZLE_MODE) return;")],
  ['B3 · the story hook removed', (s) => s.replace(S + '\n', '')],
  ['B4 · the Hall hook removed', (s) => s.replace(W + '\n', '')],
  ['B5 · a hook left unguarded (no try/catch)', (s) => s.replace(M, "  window.DY_COUNT && window.DY_COUNT.finished('match');")],
  ['B6 · a fourth hook in the render loop (render runs every frame)', (s) => s.replace('\nfunction render(', "\nfunction render(){ try{ window.DY_COUNT && window.DY_COUNT.finished('match'); }catch(e){} }\nfunction __render_was(")],
];
for (const [name, mut] of breaks) {
  const m = mut(HTML);
  ok(name + ' → red', m !== HTML && rules(m).length > 0, 'the mutation did not apply or was not caught');
}

console.log('\n' + (fail === 0 ? '✓ ALL ' + pass + ' COUNT-HOOK CHECKS PASS' : '✖ ' + fail + ' FAILURES / ' + pass + ' passed'));
process.exit(fail === 0 ? 0 : 1);
