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
const STEP = /^  try\{ window\.DY_COUNT && window\.DY_COUNT\.step && window\.DY_COUNT\.step\('(fsel_seen|battle_start)'\); \}catch\(e\)\{\}/;
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
  // ONBOARD-1 (owner ruling 2026-11-10): the faction screen → battle funnel — fsel_seen when the screen opens, battle_start when
  // BEGIN BATTLE is tapped WITH a faction chosen (after the gate, before startGame); both guarded, once per browser in the counter
  const fs = body(src, 'showFactionSelect'), bi = src.indexOf("$('fselstart').onclick=()=>{"), bb = bi < 0 ? '' : src.slice(bi, src.indexOf('\n};', bi));
  if (!fs || !bb) bad.push('showFactionSelect or the BEGIN BATTLE handler is missing');
  else {
    const f = hooksIn(fs), b = hooksIn(bb);
    if (f.length !== 1 || !STEP.test(f[0]) || STEP.exec(f[0])[1] !== 'fsel_seen') bad.push('showFactionSelect: expected exactly one guarded step(\'fsel_seen\') line');
    if (b.length !== 1 || !STEP.test(b[0]) || STEP.exec(b[0])[1] !== 'battle_start') bad.push('BEGIN BATTLE: expected exactly one guarded step(\'battle_start\') line');
    else { const g = bb.indexOf('if(!fselChoice.p0) return;'), at = bb.indexOf(b[0]), sg = bb.indexOf('startGame('); if (g < 0 || g > at || sg < at) bad.push('BEGIN BATTLE: the start must be counted after the faction gate and before the match starts'); }
  }
  const all = src.split('\n').filter((l) => /DY_COUNT/.test(l));
  if (all.length !== 6) bad.push('DY_COUNT appears on ' + all.length + ' lines (exactly the three finish hooks, the one share line and the two faction-screen steps allowed)');
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
  const run = new Function('window', 'navigator', 'toastMute', shareBlock(src) + '\nreturn challengeFriend(' + JSON.stringify(via) + ', ' + JSON.stringify(SCORE) + ');');
  run(win, nav, (t) => toasts.push(t));
  return new Promise((r) => setTimeout(() => r({ opened, counted, toasts, copied }), 0));
}
const SCORE = '2–1', CT = 'I beat the AI 2–1 in Divya Yuddha. Can you? Play free:';   // SHARE-3: the approved text, the score from the result
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
// SHARE-3 (owner rulings 2026-11-09): Option B — the official logos, no names beside them, Messenger out, the score in the heading
const LOGO_FILES = ['assets/img/brand/facebook_logo_primary.png', 'assets/img/brand/whatsapp_glyph_green.svg', 'assets/img/brand/x_logo_white.svg'];
function rowRules(src) {
  const bad = [], sync = body(src, 'syncChallengeButton') || '';
  if (src.indexOf('const CHALLENGE_HEADING = "You won {score}! Dare a friend to beat it.";') < 0) bad.push('the approved heading');
  if (src.indexOf('const CHALLENGE_CAPTION = "Your friend will see this";') < 0) bad.push('the approved caption');
  if (src.indexOf("const CHALLENGE_WAYS = [['facebook','Facebook'], ['whatsapp','WhatsApp'], ['x','X'], ['copy','Copy link'], ['more','More']];") < 0) bad.push('the five ways (no Messenger)');
  if (/messenger/i.test(shareBlock(src) || '')) bad.push('Messenger is out for now');
  if (src.indexOf("const CHALLENGE_LOGOS = { facebook:'" + LOGO_FILES[0] + "', whatsapp:'" + LOGO_FILES[1] + "', x:'" + LOGO_FILES[2] + "' };") < 0) bad.push('the three official logo files');
  if (/k\.textContent\s*=|k\.append\(label|createTextNode\(label/.test(sync) || sync.indexOf("k.setAttribute('aria-label', label)") < 0) bad.push('no visible names beside the logos (screen-reader labels only)');
  if (sync.indexOf("if(via==='more' && typeof navigator.share!=='function') return;") < 0) bad.push('More only where the phone has a share sheet');
  if (sync.indexOf("G.players[ME].roundWins+'–'+G.players[OPP].roundWins") < 0) bad.push('the score from the match result');
  if (!/\.go-share-net\.glow\{[^}]*animation:goShareGlow[^}]*1s 1;/.test(src) || !/@media \(prefers-reduced-motion:reduce\)\{ \.go-share-net\.glow\{ animation:none; \} \}/.test(src)) bad.push('one glow on the whole row, none for reduced motion');
  if (/\[data-via="whatsapp"\][^{]*\{[^}]*animation/.test(src)) bad.push('never a glow on the WhatsApp logo alone');
  return bad;
}
const rr = rowRules(HTML);
ok('7b · the SHARE-3 panel: the approved heading (with the score) and caption, the three official logos (no names beside them, labels for screen readers), Copy link and More (More only with a share sheet), no Messenger, one row glow (none for reduced motion); the logo files are in the repo',
  rr.length === 0 && LOGO_FILES.every((f) => fs.existsSync(path.join(__dirname, '..', f))), rr.join(' | '));
const sb = [
  ['B10 · Facebook given pre-filled text', (s) => s.replace("'https://www.facebook.com/sharer/sharer.php?u='+u", "'https://www.facebook.com/sharer/sharer.php?u='+u+'&quote='+t")],
  ['B11 · the challenge link back to the home page', (s) => s.replace("https://divyayuddha.games/challenge/?utm_source=direct", "https://divyayuddha.games/?utm_source=direct")],
  ['B12 · a cancelled sheet counted', (s) => s.replace("(e && e.name==='AbortError') ? 'cancelled'", "(e && e.name==='AbortError') ? 'shared'")],
];
for (const [name, mut] of sb) { const m = mut(HTML); ok(name + ' → red', m !== HTML && (await shareRules(m)).length > 0, 'the mutation did not apply or was not caught'); }
const rb = [
  ['B13 · a name shown beside a logo', (s) => s.replace("k.setAttribute('aria-label', label);", "k.setAttribute('aria-label', label); k.append(label);")],
  ['B14 · Messenger brought back', (s) => s.replace("['x','X'], ['copy','Copy link']", "['x','X'], ['messenger','Messenger'], ['copy','Copy link']")],
  ['B15 · the glow moved onto the WhatsApp logo alone', (s) => s.replace('.go-share-net.glow{ animation:', '#gameover .go-share-net button[data-via="whatsapp"]{ animation:goShareGlow 1.6s ease-out 1s 1; }\n.go-share-net.glowx{ animation:')],
];
for (const [name, mut] of rb) { const m = mut(HTML); ok(name + ' → red', m !== HTML && rowRules(m).length > 0, 'the mutation did not apply or was not caught'); }

console.log('\n── ONBOARD-1 · the faction screen → battle steps ──');
const STEPS = HTML.split('\n').filter((l) => STEP.test(l));
const runStep = (line, win) => { const calls = []; if (win.DY_COUNT === 'recorder') win.DY_COUNT = { step: (k) => calls.push(k) }; let threw = false;
  try { new Function('window', line.replace(/\/\/.*$/, ''))(win); } catch (e) { threw = true; } return { threw, calls }; };
ok("8 · the two steps: standalone (no counter), an old counter without step(), or a throwing one — nothing happens and nothing throws; the site's counter gets fsel_seen and battle_start once each",
  STEPS.length === 2 && STEPS.every((l) => !runStep(l, {}).threw && !runStep(l, { DY_COUNT: { finished() {} } }).threw && !runStep(l, { DY_COUNT: { step() { throw new Error('down'); } } }).threw)
    && STEPS.map((l) => runStep(l, { DY_COUNT: 'recorder' }).calls.join(',')).sort().join('|') === 'battle_start|fsel_seen');
const sb2 = [
  ['B16 · the faction-screen step removed', (s) => s.replace(STEPS.find((l) => l.indexOf('fsel_seen') >= 0) + '\n', '')],
  ['B17 · the battle counted before the faction gate (a tap with no army chosen would count)', (s) => { const b = STEPS.find((l) => l.indexOf('battle_start') >= 0); return s.replace(b + '\n', '').replace("  if(!fselChoice.p0) return;", b + "\n  if(!fselChoice.p0) return;"); }],
];
for (const [name, mut] of sb2) { const m = mut(HTML); ok(name + ' → red', m !== HTML && rules(m).length > 0, 'the mutation did not apply or was not caught'); }
console.log('\n' + (fail === 0 ? '✓ ALL ' + pass + ' COUNT-HOOK CHECKS PASS' : '✖ ' + fail + ' FAILURES / ' + pass + ' passed'));
process.exit(fail === 0 ? 0 : 1);
})();
