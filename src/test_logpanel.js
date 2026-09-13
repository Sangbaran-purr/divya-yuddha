'use strict';
// GL-3 (GAME-LOG-1) — THE BATTLE-LOG PANEL, IN A REAL DOM. Run: node src/test_logpanel.js
//
// The SHIPPED page runs in jsdom: index.html's markup, and its four scripts evaluated together as the browser loads
// them (the generated engine, src/chapters.js, src/narrator.js, the battle script). jsdom is borrowed from the site
// checkout's tests/node_modules (DY_WEB) and the server room + redacted views from the web3 checkout (DY_WEB3), the
// way test_wire borrows web3; either absent → SKIPPED LOUDLY, a counted failure, never green-by-absence.
// Canvas, media and fetch are inert stubs; prefers-reduced-motion is on, so every action resolves synchronously.
//
//   1 · THE PANEL IN CODE   no second grammar pass; the .overlay/.modal shell and #logbody's line styles reused
//   2 · VS-AI FACE          a full match through runAction: the button, every recorded line under its round header,
//                           "You pass." shown as recorded (a mutant that re-runs fixLogGrammar goes RED), the quiet
//                           error line only when the count is non-zero, close → the face and its buttons intact
//   3 · STORY               no button (R3)
//   4 · FREE WIRE FACE      a full relayed match (seat 0) and a forfeit (both seats' closing lines)
//   5 · STAKED WIRE FACE    a forfeit; the vanish-and-return path (restored storage → resync view → the gap line)
//   6 · THE WALL            no seat name or address anywhere in the panel
const fs = require('fs'), path = require('path');
const GAME = path.resolve(__dirname, '..');
const WEB = process.env.DY_WEB || path.resolve(GAME, '..', 'divya-yuddha-web');
const W3 = process.env.DY_WEB3 || path.resolve(GAME, '..', 'divya-yuddha-web3');
const MS = path.join(W3, 'services', 'match-server');
const N = require('./narrator.js');
let pass = 0, fail = 0;
const ok = (name, cond, detail) => { if (cond) { pass++; console.log('  ✓ ' + name); } else { fail++; console.log('  ✖ ' + name + (detail ? '\n      ' + detail : '')); } };
const J = (x) => JSON.stringify(x);
const HTML = fs.readFileSync(path.join(GAME, 'index.html'), 'utf8');
function extractFn(src, name) {
  const i = src.indexOf('function ' + name + '(');
  if (i < 0) throw new Error('cannot find function ' + name);
  let d = 0; for (let k = src.indexOf('){', i) + 1; k < src.length; k++) { if (src[k] === '{') d++; else if (src[k] === '}') { d--; if (d === 0) return src.slice(i, k + 1); } }
  throw new Error('unbalanced ' + name);
}
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, ' ').split('\n').map((l) => l.replace(/(^|[\s;,(){}])\/\/.*$/, '$1')).join('\n');

// ═══ 1 · THE PANEL IN CODE ═══
console.log('── 1 · the panel in code ──');
{
  const render = strip(extractFn(HTML, 'renderBattleLog'));
  ok('renderBattleLog shows each line AS RECORDED — it never calls fixLogGrammar (the narrator already did, once)', render.indexOf('fixLogGrammar') < 0 && /textContent = String\(l\.text\)/.test(render));
  ok('the panel is the existing shell: an .overlay holding a .modal (80vh, scrollable), placed right after #gameover',
     /<div id="gameover" class="overlay hidden">|<div class="overlay hidden" id="gameover">/.test(HTML) && /<\/div><\/div>\n<div class="overlay hidden" id="battlelog" role="dialog" aria-modal="true" aria-labelledby="bl-title"><div class="modal">/.test(HTML));
  ok('#logbody\'s line styles and thin scrollbar serve the panel (.me / .foe / .sys share one rule with #bl-body)',
     HTML.indexOf('#logbody .me, #bl-body .me{') >= 0 && HTML.indexOf('#logbody .foe, #bl-body .foe{') >= 0 && HTML.indexOf('#logbody .sys, #bl-body .sys{') >= 0 && HTML.indexOf('#logbody::-webkit-scrollbar, #bl-body::-webkit-scrollbar{') >= 0);
  const code = strip(HTML);
  ok('both result faces add the button: showGameOver (after the Wire and Story exits) and showWireResult (after its .go-btns rewrite)',
     (() => { const go = strip(extractFn(HTML, 'showGameOver')), wr = strip(extractFn(HTML, 'showWireResult'));
       return go.indexOf('syncBattleLogButton()') > go.indexOf('showStoryResult()') && wr.indexOf('syncBattleLogButton()') > wr.indexOf("btns.innerHTML") && code.split("['gameover','battlelog',").length === 4; })());
}

let JSDOM = null, VirtualConsole = null;
try { ({ JSDOM, VirtualConsole } = require(require.resolve('jsdom', { paths: [path.join(WEB, 'tests')] }))); } catch (e) { JSDOM = null; }
let createRoom = null, buildView = null, ES = null;
try { createRoom = require(path.join(MS, 'src', 'match.js')).createRoom; buildView = require(path.join(MS, 'src', 'redactedview.js')).buildView; ES = require(path.join(MS, 'src', 'engineguard.js')).loadGuardedEngine().engine; } catch (e) { createRoom = null; }

if (!JSDOM) { fail++; console.log('  ✖ SKIPPED LOUDLY — jsdom not found under ' + path.join(WEB, 'tests') + ' (set DY_WEB). The DOM proofs did NOT run.'); }
else if (!createRoom) { fail++; console.log('  ✖ SKIPPED LOUDLY — the web3 checkout is absent (' + MS + '; set DY_WEB3). The wire-face proofs did NOT run.'); }
else {
  // ── the page, booted ──
  function boot(query) {
    const errs = [], warns = [], posted = [];
    const vc = new VirtualConsole();
    vc.on('jsdomError', (e) => errs.push(String(e && e.message)));
    vc.on('error', (...a) => errs.push(a.join(' '))); vc.on('warn', (...a) => warns.push(a.join(' '))); vc.on('log', (...a) => errs.push('console.log: ' + a.join(' ')));
    const scripts = [];
    const markup = HTML.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/g, (m, attrs, body) => { const src = /\bsrc="([^"?]+)/.exec(attrs); scripts.push(src ? fs.readFileSync(path.join(GAME, src[1]), 'utf8') : body); return ''; });
    const dom = new JSDOM(markup, { url: 'https://game.test/index.html' + query, pretendToBeVisual: true, runScripts: 'outside-only', virtualConsole: vc });
    const w = dom.window;
    w.matchMedia = (q) => ({ matches: /reduce/.test(q), media: q, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
    const ctx = new Proxy({}, { get: (t, k) => k === 'measureText' ? () => ({ width: 10 }) : /^create(Linear|Radial)Gradient$|^createPattern$/.test(String(k)) ? () => ({ addColorStop() {} }) : k === 'getImageData' ? () => ({ data: new Uint8ClampedArray(4) }) : () => undefined, set: () => true });
    w.HTMLCanvasElement.prototype.getContext = () => ctx;
    w.HTMLMediaElement.prototype.play = () => Promise.resolve(); w.HTMLMediaElement.prototype.pause = () => {}; w.HTMLMediaElement.prototype.load = () => {};
    w.fetch = () => Promise.resolve({ ok: false, status: 404, arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)), json: () => Promise.resolve({}), text: () => Promise.resolve('') });
    w.scrollTo = () => {};
    w.postMessage = (m) => posted.push(JSON.parse(JSON.stringify(m)));   // the frame's wirePost → the Hall (window.parent is this window in jsdom)
    w.eval(scripts.join('\n;\n') + '\n;window.__T = { get G(){ return G; }, get BLog(){ return BLog; }, get Wire(){ return Wire; }, get ME(){ return ME; }, get Story(){ return Story; } };');
    const say = (data) => w.onWireMessage({ origin: w.location.origin, source: w.parent, data: JSON.parse(JSON.stringify(data)) });
    return { w, T: w.__T, errs, warns, posted, say };
  }
  const $ = (w, id) => w.document.getElementById(id);
  const hidden = (w, id) => $(w, id).classList.contains('hidden');
  const btnTexts = (w) => [...w.document.querySelectorAll('#gameover .go-btns button')].map((b) => b.textContent);
  const expected = (T) => N.withRoundHeaders(T.BLog.lines).map((l) => [l.kind === 'header' ? 'bl-hdr' : l.kind === 'gap' ? 'bl-gap' : (l.side === 'me' || l.side === 'foe') ? l.side : 'sys', l.text]);
  const shown = (w) => [...$(w, 'bl-body').children].map((d) => [d.className, d.textContent]);
  const underHeaders = (T) => { const H = N.withRoundHeaders(T.BLog.lines); let cur = null, okk = true; const seen = [];
    H.forEach((l) => { if (l.kind === 'header') { if (!/^— Round \d+ —$/.test(l.text)) okk = false; cur = l.round; seen.push(cur); } else if (l.kind !== 'gap' && l.round !== cur) okk = false; });
    return okk && J(seen) === J([...new Set(T.BLog.lines.filter((l) => l.kind !== 'gap').map((l) => l.round))]); };
  const openLog = (w) => { $(w, 'go-log').click(); return !hidden(w, 'battlelog'); };
  const FACS = ['devas', 'asuras', 'vanaras', 'nagas'];

  // ── a server match: the room's relayed moves, and each seat's redacted view after every action ──
  function serverMatch(opts) {
    const mid = opts.mid, room = createRoom(ES, { seed: opts.seed, seats: [{ address: '0x' + '1'.repeat(40), faction: opts.f0 }, { address: '0x' + '2'.repeat(40), faction: opts.f1 }] });
    const sg = room.state, hall = (v) => { const c = JSON.parse(JSON.stringify(v)); delete c.myName; delete c.oppName; return c; };
    const out = { mid, f0: opts.f0, f1: opts.f1, seed: opts.seed, seatNames: [sg.players[0].name, sg.players[1].name], moves: [], views: [[], []], start: [0, 1].map((s) => hall(buildView({ E: ES }, room, mid, s, null, []))), resync: null };
    let cursor = sg.events.length;
    const step = (s, a) => {
      const hc = a.type === 'play' ? sg.players[s].hand[a.handIndex] : null;
      const r = room.apply(s, a); out.moves.push(r);
      const lm = hc ? { seat: s, type: 'play', id: hc.id, n: hc.n } : { seat: s, type: a.type };
      const slice = sg.events.slice(cursor); cursor = sg.events.length;
      for (const v of [0, 1]) out.views[v].push(hall(buildView({ E: ES }, room, mid, v, lm, slice)));
      if (out.moves.length === opts.K) out.resync = [0, 1].map((v) => hall(buildView({ E: ES }, room, mid, v, null, [])));
    };
    step(0, { type: 'mulligan', indices: [0, 1] }); step(1, { type: 'mulligan', indices: [] });
    let guard = 0;
    while (!sg.over && guard++ < 500 && out.moves.length < (opts.limit || 1e9)) {
      const s = room.turn, pl = sg.players[s];
      if (ES.canLeap(sg, s) && guard % 4 === 0) { const bl = ES.bestLeap(sg, s); if (bl) { const a = { type: 'leap', leaperIndex: pl.units.indexOf(bl.leaper), targetIndex: pl.units.indexOf(bl.target) }; if (room.validate(s, a).ok) step(s, a); } }
      const d = ES.aiMove(sg, s);
      let a = (d && d.play != null && guard % 11 !== 5) ? { type: 'play', handIndex: d.play, targetIndex: null } : { type: 'pass' };
      if (a.type === 'play') { const sp = ES.targetSpec(sg, s, pl.hand[d.play]); if (sp && sp.options && sp.options.length) a.targetIndex = 0; }
      if (!room.validate(s, a).ok) a = { type: 'pass' };
      step(s, a);
    }
    out.over = !!sg.over; out.winner = sg.winner; out.roundWins = [sg.players[0].roundWins, sg.players[1].roundWins];
    return out;
  }
  const freeStart = (P, M, seat) => P.say({ type: 'wire:start', matchId: M.mid, seat, seed: M.seed, p0Faction: M.f0, p1Faction: M.f1 });
  const freeMoves = (P, M, upto) => M.moves.slice(0, upto == null ? M.moves.length : upto).forEach((r) => P.say({ type: 'wire:move', matchId: M.mid, seq: r.seq, move: r.move }));
  const stakedViews = (P, M, seat, from, upto) => { let seq = 0; M.views[seat].slice(from, upto).forEach((v) => P.say({ type: 'wire:view', matchId: M.mid, seq: ++seq, view: v })); };
  const SEATISH = /0x[0-9a-fA-F]{4}…[0-9a-fA-F]{4}|\{p[01]\}|0x1{4,}|0x2{4,}/;
  const wallHits = [];

  // ═══ 2 · THE VS-AI FACE ═══
  console.log('\n── 2 · the vs-AI result face: a full match through runAction ──');
  const P = boot('');
  {
    const { w, T } = P;
    w.pump = function () {};   // the harness plays both seats itself: no AI timer, no relay
    w.startGame('vanaras', 'nagas');
    $(w, 'mullconfirm').click();   // KEEP DESTINY — the solo mulligan hook (the AI mulligans too)
    let guard = 0;
    while (!T.G.over && guard++ < 600) { const a = T.G.turn; w.runAction(() => w.aiTakeTurn(T.G, a), { actor: a }); }
    ok('the match reached its result and the vs-AI face is up (' + T.BLog.lines.length + ' recorded lines, recorder errors ' + T.BLog.errors + ')', T.G.over && !hidden(w, 'gameover') && T.BLog.lines.length > 20 && T.BLog.errors === 0);
    ok('VIEW BATTLE LOG sits in #gameover .go-btns beside REMATCH and MAIN MENU', J(btnTexts(w)) === J(['REMATCH ⚔', 'MAIN MENU', 'VIEW BATTLE LOG']), J(btnTexts(w)));
    const before = [...w.document.querySelectorAll('#gameover .go-btns button')];
    ok('opening the log shows the panel above the face, the face still in place beneath it', openLog(w) && !hidden(w, 'gameover'));
    const want = expected(T), got = shown(w);
    ok('EVERY recorded line is rendered, in order, with its side (.me / .foe / .sys), under the narrator\'s "— Round N —" headers (' + got.length + ' rows)', J(got) === J(want) && underHeaders(T) && got.some((r) => r[0] === 'me') && got.some((r) => r[0] === 'foe') && got.some((r) => r[0] === 'bl-hdr'), J(got.find((r, i) => J(r) !== J(want[i]))));
    const risky = T.BLog.lines.filter((l) => N.fixLogGrammar(l.text) !== l.text).map((l) => l.text);
    ok('GRAMMAR NOT DOUBLE-APPLIED: ' + risky.length + ' lines a second pass would corrupt (e.g. "' + (risky[0] || '') + '" → "' + N.fixLogGrammar(risky[0] || '') + '") are shown exactly as recorded',
       risky.length > 0 && risky.includes('You pass.') && risky.every((t) => got.some((r) => r[1] === t)) && !got.some((r) => /\bYou pas\./.test(r[1])));
    {   // the mutant: a panel that runs fixLogGrammar again
      const orig = w.renderBattleLog;
      const mutSrc = extractFn(HTML, 'renderBattleLog').replace('d.textContent = String(l.text);', 'd.textContent = fixLogGrammar(String(l.text));')
        .replace('function renderBattleLog(){', 'function renderBattleLog(){ const BLog = window.__T.BLog, $ = (id) => document.getElementById(id);');
      w.eval(mutSrc); w.openBattleLog(); const mut = shown(w); w.renderBattleLog = orig; w.openBattleLog();
      ok('  MUTANT RED: a panel that re-runs fixLogGrammar shows "You pas." and fails the line check', mutSrc.indexOf('fixLogGrammar(String') > 0 && J(mut) !== J(want) && mut.some((r) => r[1] === 'You pas.') && J(shown(w)) === J(want));
    }
    ok('no quiet error line while the recorder\'s error count is 0', !$(w, 'bl-body').querySelector('.bl-err'));
    T.BLog.errors = 2; w.openBattleLog();
    const rows = [...$(w, 'bl-body').children], last = rows[rows.length - 1];
    ok('error count non-zero → exactly ONE quiet line at the foot, "Some moments could not be recorded.", and every line still shown',
       last.className === 'bl-err' && last.textContent === 'Some moments could not be recorded.' && rows.length === want.length + 1 && $(w, 'bl-body').querySelectorAll('.bl-err').length === 1);
    T.BLog.errors = 0; w.openBattleLog();
    ok('  …and it is gone again when the count is back to 0', !$(w, 'bl-body').querySelector('.bl-err') && shown(w).length === want.length);
    $(w, 'bl-close').click();
    const after = [...w.document.querySelectorAll('#gameover .go-btns button')];
    ok('CLOSE returns to the result face with nothing lost: the panel hidden, the face up, the same heading, the same three buttons',
       hidden(w, 'battlelog') && !hidden(w, 'gameover') && after.length === 3 && after.every((b, i) => b === before[i]) && /VICTORY|DEFEAT|STALEMATE/.test($(w, 'goh').textContent));
    openLog(w); $(w, 'bl-close').click();
    new w.Function(after[0].getAttribute('onclick')).call(after[0]);   // REMATCH — its own inline handler, as the markup ships it (jsdom's outside-only mode does not wire inline attributes)
    ok('  …and the result buttons still work after closing: REMATCH starts a fresh match (face and panel hidden, a new empty log)', hidden(w, 'gameover') && hidden(w, 'battlelog') && !T.G.over && T.BLog && T.BLog.lines.length === 0);
  }

  // ═══ 3 · STORY ═══
  console.log('\n── 3 · story: no button (R3) ──');
  {
    const { w, T } = P;
    const chId = w.CHAPTERS && w.CHAPTERS.b1c1 ? 'b1c1' : Object.keys(w.CHAPTERS || {})[0];
    try { w.startStoryChapter(chId); } catch (e) {}
    ok('a story chapter keeps no battle log (' + chId + ')', T.Story && T.BLog === null);
    let guard = 0;
    try { while (!T.G.over && guard++ < 400) { const a = T.G.turn; w.runAction(() => w.aiTakeTurn(T.G, a), { actor: a }); } } catch (e) {}
    const visibleLogBtn = [...w.document.querySelectorAll('button')].some((b) => b.textContent === 'VIEW BATTLE LOG' && !b.closest('.hidden'));
    ok('the story result carries no VIEW BATTLE LOG: #gameover never shown, no visible button anywhere, and the sync removes a leftover one', T.G.over && hidden(w, 'gameover') && !visibleLogBtn && (w.syncBattleLogButton(), !$(w, 'go-log')));
  }

  // ═══ 4 · THE FREE WIRE FACE ═══
  console.log('\n── 4 · the free wire face ──');
  {
    const M = serverMatch({ mid: 'm-free-gl3', seed: 20260913, f0: 'devas', f1: 'asuras' });
    const F = boot('?wire=1'); const { w, T } = F;
    freeStart(F, M, 0); freeMoves(F, M); F.say({ type: 'wire:result', matchId: M.mid, winner: M.winner, roundWins: M.roundWins, forfeit: false });
    ok('a full relayed match (' + M.moves.length + ' moves) reached the wire result face with no refusal', M.over && T.G.over && !hidden(w, 'gameover') && T.Wire.refused.length === 0, J(T.Wire.refused));
    ok('the wire face rewrote .go-btns and added the button back: RETURN TO THE HALL, VIEW BATTLE LOG', J(btnTexts(w)) === J(['RETURN TO THE HALL', 'VIEW BATTLE LOG']), J(btnTexts(w)));
    openLog(w); const got = shown(w), want = expected(T);
    ok('opening renders every recorded line under its round header, ending in the result (' + got.length + ' rows)', J(got) === J(want) && underHeaders(T) && T.BLog.lines[T.BLog.lines.length - 1].kind === 'result');
    wallHits.push(...got.filter((r) => SEATISH.test(r[1])).map((r) => r[1]));
    $(w, 'bl-close').click(); F.posted.length = 0; $(w, 'wire-leave').click();
    ok('close → the wire face intact, and RETURN TO THE HALL still posts wire:leave', hidden(w, 'battlelog') && !hidden(w, 'gameover') && F.posted.length === 1 && J(F.posted[0]) === J({ type: 'wire:leave', matchId: M.mid }), J(F.posted));
    // the forfeit: the board cannot reach G.over; seat 0 wins, seat 1 left
    const MF = serverMatch({ mid: 'm-free-forfeit', seed: 777001, f0: 'vanaras', f1: 'nagas', limit: 24 });
    const lastLines = [];
    for (const seat of [0, 1]) {
      const X = boot('?wire=1');
      freeStart(X, MF, seat); freeMoves(X, MF); X.say({ type: 'wire:result', matchId: MF.mid, winner: 0, roundWins: [0, 0], forfeit: true });
      const up = !X.T.G.over && !hidden(X.w, 'gameover') && J(btnTexts(X.w)) === J(['RETURN TO THE HALL', 'VIEW BATTLE LOG']) && openLog(X.w);
      const rows = shown(X.w); lastLines.push(up && J(rows) === J(expected(X.T)) ? rows[rows.length - 1][1] : 'face/rows mismatch');
      wallHits.push(...rows.filter((r) => SEATISH.test(r[1])).map((r) => r[1]));
    }
    ok('AFTER A FORFEIT the panel opens on both seats\' faces and closes with the sealed lines: "' + lastLines[0] + '" / "' + lastLines[1] + '"', lastLines[0] === 'Your opponent left the table.' && lastLines[1] === 'You left the table.');
  }

  // ═══ 5 · THE STAKED WIRE FACE ═══
  console.log('\n── 5 · the staked wire face: a forfeit, and the vanish-and-return path ──');
  {
    const K = 18, M = serverMatch({ mid: 'm-staked-gl3', seed: 424243, f0: 'nagas', f1: 'devas', K });
    const key = 'dy_blog:' + M.mid;
    // A — the frame before the vanish: the opening view, then K views
    const A = boot('?wire=1');
    A.say({ type: 'wire:start', matchId: M.mid, seat: 0, view: M.start[0], p0Faction: M.f0, p1Faction: M.f1 });
    stakedViews(A, M, 0, 0, K);
    const kept = A.w.sessionStorage.getItem(key), keptLines = kept ? JSON.parse(kept).lines : [];
    ok('the staked frame kept its log in sessionStorage under dy_blog:<matchId> (' + keptLines.length + ' lines, no gap — it started at the opening)', keptLines.length > 5 && !keptLines.some((l) => l.kind === 'gap') && J(keptLines) === J(A.T.BLog.lines) && A.T.Wire.refused.length === 0, J(A.T.Wire.refused));
    A.say({ type: 'wire:result', matchId: M.mid, winner: 0, roundWins: [0, 0], forfeit: true });
    const aUp = !A.T.G.over && !hidden(A.w, 'gameover') && J(btnTexts(A.w)) === J(['RETURN TO THE HALL', 'VIEW BATTLE LOG']) && openLog(A.w), aRows = shown(A.w);
    ok('staked forfeit: the button on the face, the panel opens, the log closes "Your opponent left the table."', aUp && J(aRows) === J(expected(A.T)) && aRows[aRows.length - 1][1] === 'Your opponent left the table.');
    wallHits.push(...aRows.filter((r) => SEATISH.test(r[1])).map((r) => r[1]));
    // B — the frame after the vanish: the tab's storage survives, the Hall re-posts wire:start with a resync view (events: [])
    const B = boot('?wire=1');
    B.w.sessionStorage.setItem(key, kept);
    B.say({ type: 'wire:start', matchId: M.mid, seat: 0, view: M.resync[0], p0Faction: M.f0, p1Faction: M.f1 });
    stakedViews(B, M, 0, K, M.views[0].length);
    B.say({ type: 'wire:result', matchId: M.mid, winner: M.winner, roundWins: M.roundWins, forfeit: false });
    const bUp = M.over && B.T.G.over && !hidden(B.w, 'gameover') && J(btnTexts(B.w)) === J(['RETURN TO THE HALL', 'VIEW BATTLE LOG']) && B.T.Wire.refused.length === 0;
    ok('VANISH AND RETURN: the resumed staked match reached its result face with the button (' + (M.views[0].length - K) + ' views after the resync)', bUp, J(B.T.Wire.refused));
    openLog(B.w); const bRows = shown(B.w), bLines = B.T.BLog.lines, gapAt = bLines.findIndex((l) => l.kind === 'gap');
    ok('the panel opens on the restored-then-gap log: the kept lines exactly, then "… the match resumed here …", then every later line, all rendered under round headers',
       J(bRows) === J(expected(B.T)) && gapAt === keptLines.length && J(bLines.slice(0, gapAt)) === J(keptLines) && bLines[gapAt].text === '… the match resumed here …' &&
       bRows.filter((r) => r[0] === 'bl-gap').length === 1 && bRows.some((r) => r[0] === 'bl-gap' && r[1] === '… the match resumed here …') && bLines[bLines.length - 1].kind === 'result' && underHeaders(B.T));
    wallHits.push(...bRows.filter((r) => SEATISH.test(r[1])).map((r) => r[1]));
    $(B.w, 'bl-close').click();
    ok('close → the staked face intact (heading, RETURN TO THE HALL)', hidden(B.w, 'battlelog') && !hidden(B.w, 'gameover') && !!$(B.w, 'wire-leave'));
  }

  // ═══ 6 · THE WALL · A CLEAN PAGE ═══
  console.log('\n── 6 · the wall, and a clean page ──');
  ok('THE WALL: no wallet short form, address or {p} token in any rendered panel row (' + wallHits.length + ')', wallHits.length === 0, wallHits.slice(0, 2).join(' | '));
  ok('the vs-AI page ran clean in the DOM: no script error, no console.log', P.errs.length === 0, P.errs.slice(0, 3).join(' | '));
}

console.log('\n' + (fail === 0 ? '✓ ALL ' + pass + ' LOG-PANEL CHECKS PASS' : '✖ ' + fail + ' FAILURES / ' + pass + ' passed'));
process.exit(fail === 0 ? 0 : 1);   // the page's own intervals would keep node alive
