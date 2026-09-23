'use strict';
// BW1 — THE WIRE, HEADLESS. docs/BATTLE_WIRE_DESIGN_v1.md.
//
//   node src/test_wire.js
//
// Three proofs, in the order they can fail:
//   1 · THE SEAT PIN (static, always runs). The battle screen used to assume the human is seat 0 in ~140 places.
//       No hard-coded seat may survive in index.html's UI outside the resolver. COUNT CODE, NEVER PROSE: comments are
//       stripped before counting, so an explanation can never satisfy (or trip) its own assertion. The named literals
//       that legitimately stay are outside the scanned patterns by construction: the both-seat iterations
//       `for (const pi of [0,1])`, the story predicates in src/chapters.js (not scanned — story's player is seat 0
//       by construction), and the engine block (not scanned — it is sacred and never edited).
//   2 · THE PRNG. The frame's wireSeeded() must be BYTE-IDENTICAL to the match server's rng.js seeded(), or the
//       mirror deals a different game. Pinned over many seeds and many draws each.
//   3 · LOCKSTEP. The match server's own room (web3 match.js createRoom) and a frame mirror built exactly as
//       startWireMatch builds it (match.js:19-23 — no manualShield, no wave deck, no difficulty) are driven through
//       the same moves; the server applies and relays, the mirror applies the relay with the SHIPPED wireApply, and the
//       full game state is compared after EVERY move. Skipped LOUDLY if the web3 checkout is absent.
const fs = require('fs'), path = require('path');
const GAME = path.resolve(__dirname, '..');
const W3 = process.env.DY_WEB3 || path.resolve(GAME, '..', 'divya-yuddha-web3');
const MS = path.join(W3, 'services', 'match-server');
let pass = 0, fail = 0;
const ASYNC_TAIL = [];   // checks that need a real timer (EXPORT-8's ready-anchored waiter); drained before the summary
const ok = (n, c, d) => { if (c) { pass++; console.log('  ✓ ' + n); } else { fail++; console.log('  ✖ ' + n + (d ? '\n      ' + d : '')); } };

const HTML_PATH = process.env.DY_WIRE_HTML || path.join(GAME, 'index.html');   // override = the negative proof (point it at a pre-BW1 copy)
const HTML = fs.readFileSync(HTML_PATH, 'utf8');
const UI = HTML.slice(HTML.indexOf('\n', HTML.indexOf('<!-- ENGINE:END')) + 1);
function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, ' ')
    .split('\n').map((l) => l.replace(/(^|[\s;,(){}])\/\/.*$/, '$1')).join('\n');
}
function extractFn(src, name) {
  const i = src.indexOf('function ' + name + '(');
  if (i < 0) throw new Error('cannot find function ' + name);
  let depth = 0, j = src.indexOf('{', i);
  for (let k = j; k < src.length; k++) { if (src[k] === '{') depth++; else if (src[k] === '}') { depth--; if (depth === 0) return src.slice(i, k + 1); } }
  throw new Error('unbalanced function ' + name);
}

// ═══ 1 · THE SEAT PIN ═══
console.log('\n── 1 · the seat pin (index.html UI, comments stripped) ──');
{
  const code = stripComments(UI);
  const PATTERNS = [
    ['players[0|1]',                 /G\.players\[[01]\]/g],
    ['(G, 0|1 …)',                   /\(\s*G\s*,\s*[01]\s*[,)]/g],
    ['turn/winner === 0|1',          /\b[gGh]\.(turn|winner)\s*===?\s*[01]\b/g],
    ['actor : / === / !== 1',        /\bactor\s*(:|===|!==)\s*[01]\b/g],
    ["=== 1 ? '.half.opp'",          /===\s*1\s*\?\s*'\.half\.(opp|me)'/g],
    ['h.t0 / h.t1',                  /\bh\.t[01]\b/g],
    ['pi === 0|1',                   /\bpi\s*===?\s*[01]\b/g],
    ['fillRow(…, 0|1, …)',           /fillRow\([^,]+,[^,]+,\s*[01]\s*,/g],
    ['boardCard(…, 0|1, …)',         /boardCard\([^,]+,\s*[01]\s*,/g],
    ['openInspect(…, 0|1, …)',       /openInspect\([^,]+,\s*[01]\s*[,)]/g],
    ['stolenBy === 0|1',             /\bstolenBy\s*===?\s*[01]\b/g],   // G-SEAT-FIX-1: the blind spot the pin missed (was index.html:7958)
  ];
  let total = 0;
  for (const [label, re] of PATTERNS) {
    const hits = code.match(re) || [];
    total += hits.length;
    ok('no hard-coded seat: ' + label, hits.length === 0, hits.slice(0, 4).join(' | '));
  }
  console.log('    seat literals outside the resolver: ' + total);
  const iters = (code.match(/for\s*\(\s*const\s+pi\s+of\s+\[0,\s*1\]\s*\)/g) || []).length;
  ok('the both-seat iterations stay literal, as named (' + iters + ')', iters === 5);
  ok('the resolver exists: ME/OPP, setSeats, halfSel',
     /let ME = 0, OPP = 1;/.test(UI) && /function setSeats\(me\)/.test(UI) && /function halfSel\(pi\)/.test(UI));
  ok('vs-AI and Story set ME=0 at their entries',
     /function startGame\([^)]*\)\{[\s\S]{0,160}setSeats\(0\)/.test(UI) && /function startStoryChapter\(id\)\{[\s\S]{0,160}setSeats\(0\)/.test(UI));
  // BW3b — THE QUERY FACADE: every one of the screen's engine questions goes through Q (30 sites — EXPORT-2's board snapshot for a Hero manifestation, mfSnap, is the 30th); a bare call survives
  //   only inside the facade itself, by name. Count code, never prose.
  const fStart = code.indexOf('const Q = {'), fEnd = code.indexOf('};', fStart) + 2;
  const outside = code.slice(0, fStart) + code.slice(fEnd);
  const bare = outside.match(/(?<![\w.])(effPower|totalPower|isShielded|playableIndices|targetSpec|canLeap|adjacentUnits|shieldCap)\(/g) || [];
  const viaQ = (outside.match(/\bQ\.(effPower|totalPower|isShielded|playableIndices|targetSpec|canLeap|adjacentUnits|shieldCap)\(/g) || []).length;
  ok('BW3b facade: 0 bare engine queries outside Q (' + bare.length + '), the 30 sites routed through Q (' + viaQ + ')', fStart > 0 && bare.length === 0 && viaQ === 30, bare.join(' '));
  // THE WALL — this repo, asserted
  const all = HTML;
  const wall = { WebSocket: (all.match(/WebSocket/g) || []).length, ethers: (all.match(/ethers/gi) || []).length,
                 'window.ethereum': (all.match(/window\.ethereum/g) || []).length, 'match-server': (all.match(/match-server|onrender/gi) || []).length };
  ok('THE WALL: WebSocket / ethers / window.ethereum / match-server all 0 in index.html', Object.values(wall).every((n) => n === 0), JSON.stringify(wall));
  // the frame never sends money: every wirePost() carries only type / matchId / action
  const posts = (code.match(/wirePost\(\{[^}]*\}/g) || []).join(' ');
  ok('the frame SENDS no key / address / stake / escrow id', posts.length > 0 && !/address|stake|escrow|key|signature|wallet/i.test(posts), posts);
  // no AI function is reachable on the wire: the pump seam returns into the relay before the AI branch
  const pump = extractFn(code, 'pump');
  ok('the pump seam enters the relay BEFORE any AI call', pump.indexOf('if (Wire){ wireDrain(); return; }') >= 0 &&
     pump.indexOf('if (Wire){ wireDrain(); return; }') < pump.indexOf('aiTakeTurn'));
  ok('rewards OFF: showGameOver routes a wire match to showWireResult BEFORE recordMatchResult',
     /function showGameOver\(\)\{\s*if\(Wire\)\{ showWireResult\(\); return; \}/.test(code));
  ok('the wire result face calls neither recordMatchResult nor questsOnMatchEnd',
     !/recordMatchResult|questsOnMatchEnd/.test(extractFn(code, 'showWireResult')));
}

// ═══ 2 · THE PRNG ═══
console.log('\n── 2 · wireSeeded() vs the match server\'s rng.js ──');
const wireSeeded = new Function(extractFn(UI, 'wireSeeded') + '\nreturn wireSeeded;')();
let serverRng = null;
try { serverRng = require(path.join(MS, 'src', 'rng.js')); } catch (e) { serverRng = null; }
if (!serverRng) {
  console.log('  ⚠ SKIP — the web3 checkout is absent (' + MS + '). Set DY_WEB3 or clone it beside this repo.');
} else {
  let mismatch = null;
  outer: for (let k = 0; k < 500; k++) {
    const seed = (k * 2654435761) >>> 0;
    const a = wireSeeded(seed), b = serverRng.seeded(seed);
    for (let d = 0; d < 200; d++) { const x = a(), y = b(); if (x !== y) { mismatch = { seed, draw: d, x, y }; break outer; } }
  }
  ok('byte-identical over 500 seeds × 200 draws (100,000 values)', mismatch === null, JSON.stringify(mismatch));
}

// ═══ 3 · LOCKSTEP ═══
console.log('\n── 3 · lockstep: the server\'s room vs the frame\'s mirror, every move ──');
let createRoom = null;
try { createRoom = require(path.join(MS, 'src', 'match.js')).createRoom; } catch (e) { createRoom = null; }
if (!createRoom) {
  console.log('  ⚠ SKIP — the web3 checkout is absent (' + MS + '). The static pin above still ran.');
} else {
  const E = require(path.join(GAME, 'src', 'engine.js'));              // the game's engine: the mirror's
  const ES = require(path.join(MS, 'src', 'engineguard.js')).loadGuardedEngine().engine;   // the server's, sha-guarded (MS/engine.js)
  const crypto = require('crypto');
  const sha = (f) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
  ok('the two engines are byte-identical (the game copy vs the server\'s pin)',
     sha(path.join(GAME, 'src', 'engine.js')) === fs.readFileSync(path.join(MS, 'engine.sha256'), 'utf8').trim().split(/\s+/)[0]);
  // the SHIPPED wireApply, bound to the mirror's G and the engine's public API
  const wireApplyFactory = new Function('E', 'getG',
    'const mulligan=E.mulligan, targetSpec=E.targetSpec, playCard=E.playCard, pass=E.pass, designateShield=E.designateShield, doLeap=E.doLeap;\n' +
    'const Q = { targetSpec: E.targetSpec };   /* BW3b — on the free road the facade IS the engine */\n' +
    'return function(mv){ const G=getG(); return (' + extractFn(UI, 'wireApply').replace('function wireApply(mv){', 'function(mv){') + ')(mv); };');

  // a state fingerprint that ignores per-instance uids and the seat names (log text only)
  const cardSig = (c) => c ? [c.id, c.power, c.base, c.venom || 0, !!c.bound, !!c.ghost, !!c.ward, c.lockedRound || 0].join(':') : '-';
  function fingerprint(g) {
    return JSON.stringify({
      round: g.round, turn: g.turn, over: g.over, winner: g.winner, realm: g.realm,
      rh: (g.roundHistory || []).map((h) => [h.winner, h.t0, h.t1]),
      p: g.players.map((pl) => ({ f: pl.faction, passed: !!pl.passed, rw: pl.roundWins,
        hand: pl.hand.map(cardSig), units: pl.units.map(cardSig), heroes: pl.heroes.map(cardSig),
        discard: pl.discard.map(cardSig), deck: pl.deck.map((c) => c.id), art: pl.artifact ? pl.artifact.id : null,
        shields: (pl.shieldUids || []).length })),
    });
  }

  const PAIRS = [['vanaras', 'nagas'], ['devas', 'asuras'], ['nagas', 'vanaras'], ['asuras', 'devas'], ['vanaras', 'vanaras']];
  let matches = 0, moves = 0, firstDiverge = null, placed = 0, leaps = 0, shields = 0, shieldsLanded = 0, targeted = 0, autoPasses = 0, seat1First = 0;
  for (let m = 0; m < 40 && !firstDiverge; m++) {
    const [f0, f1] = PAIRS[m % PAIRS.length];
    const seed = (0x9E3779B1 * (m + 1)) >>> 0;
    const room = createRoom(ES, { seed: seed, seats: [{ address: '0x' + '1'.repeat(40), faction: f0 }, { address: '0x' + '2'.repeat(40), faction: f1 }] });
    const sg = room.state;
    let G = null; const getG = () => G;
    // the frame's mirror, EXACTLY as startWireMatch builds it
    G = E.newGame({ p0: 'You', p1: 'Opponent', p0Faction: f0, p1Faction: f1, rng: wireSeeded(seed) });
    const apply = wireApplyFactory(E, getG);
    if (fingerprint(sg) !== fingerprint(G)) { firstDiverge = { m, at: 'the deal' }; break; }
    // the server decides nothing; a seat's DECISION comes from the engine's own AI reading the server's state, then
    // travels as the wire's index-based action — exactly what a player's act looks like on the wire.
    function decide(seat) {
      if (room.phase === 'mulligan') return { type: 'mulligan', indices: sg.players[seat].hand.map((_, i) => i).filter((i) => (seed + i + seat) % 5 === 0).slice(0, 3) };
      const pl = sg.players[seat];
      if (moves % 11 === 3) return { type: 'pass', auto: true };                                   // a clock auto-pass
      const d = ES.aiMove(sg, seat);
      if (d && d.play != null) {
        const card = pl.hand[d.play], sp = ES.targetSpec(sg, seat, card);
        const a = { type: 'play', handIndex: d.play, targetIndex: (sp && sp.options && sp.options.length) ? 0 : null };
        if (card && card.t === 'unit' && pl.faction === 'vanaras' && pl.units.some((u) => !u.ghost)) a.position = (moves % (pl.units.length + 1));
        return a;
      }
      return { type: 'pass' };
    }
    let guard = 0;
    while (!sg.over && guard++ < 600) {
      // the mulligan order alternates by match — the server relays in ARRIVAL order, and mulligan redraws consume rng
      const firstM = m % 2, seat = room.phase === 'mulligan' ? (room.mulliganedFor(firstM) ? 1 - firstM : firstM) : sg.turn;
      if (room.phase === 'mulligan' && firstM === 1 && !room.mulliganedFor(1)) seat1First++;
      // an occasional free act first (shield / leap), then the turn's act
      if (room.phase === 'play') {
        const pl = sg.players[seat];
        if (moves % 7 === 2 && ES.canLeap(sg, seat)) {
          const bl = ES.bestLeap(sg, seat);
          if (bl) { const a = { type: 'leap', leaperIndex: pl.units.indexOf(bl.leaper), targetIndex: pl.units.indexOf(bl.target) };
            if (room.validate(seat, a).ok) { const r = room.apply(seat, a); apply(r.move); moves++; leaps++;
              if (fingerprint(sg) !== fingerprint(G)) { firstDiverge = { m, move: r.move }; break; } } }
        }
        const live = pl.units.findIndex((u) => !u.ghost);
        if (moves % 9 === 4 && live >= 0) {
          const a = { type: 'shield', unitIndex: live };
          if (room.validate(seat, a).ok) { const before = pl.shieldUids.length; const r = room.apply(seat, a); apply(r.move); moves++; shields++; if (pl.shieldUids.length > before) shieldsLanded++;
            if (fingerprint(sg) !== fingerprint(G)) { firstDiverge = { m, move: r.move }; break; } }
        }
      }
      let a = decide(seat);
      if (a.type === 'pass' && a.auto) { autoPasses++; delete a.auto; }
      if (!room.validate(seat, a).ok) a = room.phase === 'mulligan' ? { type: 'mulligan', indices: [] } : { type: 'pass' };
      const v = room.validate(seat, a);
      if (!v.ok) { firstDiverge = { m, reason: 'no legal action: ' + v.reason }; break; }
      if (a.position != null) placed++;
      if (a.targetIndex != null) targeted++;
      const r = room.apply(seat, a);                 // the SERVER applies and produces the relayed descriptor …
      apply(r.move);                                 // … the FRAME applies the relay with the shipped wireApply
      moves++;
      if (fingerprint(sg) !== fingerprint(G)) { firstDiverge = { m, move: r.move, seat }; break; }
    }
    if (!firstDiverge) matches++;
  }
  ok('LOCKSTEP: the frame mirror matched the server room after EVERY move (' + matches + ' matches, ' + moves + ' moves)',
     firstDiverge === null && matches === 40, JSON.stringify(firstDiverge));
  ok('exercised: Vanara placement (' + placed + '), leaps (' + leaps + '), shield acts (' + shields + ', ' + shieldsLanded + ' landed), targeted plays (' + targeted + '), clock auto-passes (' + autoPasses + '), seat-1-first mulligans (' + seat1First + ')',
     placed > 0 && leaps > 0 && shields > 0 && targeted > 0 && autoPasses > 0 && seat1First > 0);
  // the two drift traps (R3), demonstrated: each one alone breaks lockstep
  {
    const seed = 424242, f0 = 'devas', f1 = 'vanaras';
    const room = createRoom(ES, { seed, seats: [{ address: '0x' + '1'.repeat(40), faction: f0 }, { address: '0x' + '2'.repeat(40), faction: f1 }] });
    const trap = E.newGame({ p0: 'You', p1: 'Opponent', p0Faction: f0, p1Faction: f1, rng: wireSeeded(seed) });
    trap.players[0].manualShield = true;             // what startGame does — and what the wire entry must NOT do
    let G = trap; const apply = wireApplyFactory(E, () => G);
    for (const s of [0, 1]) { const a = { type: 'mulligan', indices: [] }; room.apply(s, a); apply({ type: 'mulligan', seat: s, indices: [] }); }
    let diverged = false;
    for (let i = 0; i < 40 && !room.state.over && !diverged; i++) {
      const seat = room.state.turn, d = ES.aiMove(room.state, seat);
      const a = (d && d.play != null) ? { type: 'play', handIndex: d.play, targetIndex: null } : { type: 'pass' };
      if (!room.validate(seat, a).ok) { a.type = 'pass'; delete a.handIndex; }
      const r = room.apply(seat, a); apply(r.move);
      diverged = fingerprint(room.state) !== fingerprint(G);
    }
    ok('R3 drift trap demonstrated: a mirror with manualShield=true (engine.js:450) DIVERGES from the server', diverged);
  }
}

// ═══ 4 · THE STAKED ROAD: the view adapter vs the engine's public projection ═══
// The server's REAL room and its REAL buildView (web3 redactedview.js) produce each seat's view after every action; the
// frame's viewToState reads it; an independent projection of the engine state (the oracle) must equal it. The adapter
// is compiled with the card DATA only in scope — an engine call inside it would throw, so "no engine on the staked
// road" is structural here. Run twice: views AS SHIPPED (web3 aed5424 - W3-VIEW-2 carries passed, the BOARD flags and
// myHandLocked) and the same views STRIPPED of those three fields (an older server: passed derived from lastMove, printed
// power, no badges, no lock). G-LOCK-READ-1 retired the engine-synthesized stand-in for the fields.
console.log('\n── 4 · the staked road: viewToState vs the engine\'s public projection, every action, both seats ──');
let buildView = null;
try { buildView = require(path.join(MS, 'src', 'redactedview.js')).buildView; } catch (e) { buildView = null; }
if (!buildView || !createRoom) {
  console.log('  ⚠ SKIP — the web3 checkout is absent (' + MS + '). The static facade pin above still ran.');
} else {
  const E = require(path.join(GAME, 'src', 'engine.js'));
  const ES = require(path.join(MS, 'src', 'engineguard.js')).loadGuardedEngine().engine;
  const adapterSrc = extractFn(UI, 'defById') + '\n' + extractFn(UI, 'viewToState') + '\n' + extractFn(UI, 'viewTargetSpec');
  const mkAdapter = (me, src) => new Function('DECKS', 'CARD_BY_NAME',
    'let ME=' + me + ', OPP=' + (1 - me) + ', DEF_BY_ID=null; const isViewState=(x)=>!!(x&&x._view);\n' + (src || adapterSrc) +
    '\nreturn { viewToState, viewTargetSpec };')(E.DECKS, CARD_BY_NAME_OF(E));
  function CARD_BY_NAME_OF(E) { const m = {}; for (const f in E.DECKS) for (const d of E.DECKS[f]) if (!m[d.n]) m[d.n] = d; return m; }
  const hall = (v) => { const c = Object.assign({}, v); delete c.myName; delete c.oppName; return c; };   // what the Hall posts (R2)
  const strip = (v) => { const c = Object.assign({}, v); delete c.passed; delete c.flags; delete c.myHandLocked; return c; };   // an older server
  // the ORACLE: what seat s may see, straight from the engine state — written independently of redactedview.js
  function oracle(room, s, lock) {
    const g = room.state, o = 1 - s;
    const u = (pi) => (x) => ({ uid: x.uid, id: x.id, power: x.ghost ? 1 : ES.effPower(g, pi, x), venom: x.venom || 0, bound: !!x.bound, ghost: !!x.ghost });
    const side = (pi) => { const pl = g.players[pi]; return { units: pl.units.map(u(pi)), heroes: pl.heroes.map(u(pi)), art: pl.artifact ? pl.artifact.id : null,
      discard: pl.discard.map(c => c.id), deck: pl.deck.length, rw: pl.roundWins, shielded: pl.units.filter(x => !x.ghost && ES.isShielded(g, pi, x)).map(x => x.uid).sort(), mull: room.mulliganedFor(pi) }; };
    return { round: g.round, turn: room.turn, over: g.over, winner: g.over ? g.winner : null, realm: g.realm, rh: g.roundHistory.map(h => [h.round, h.t0, h.t1, h.winner]),
      totals: [ES.totalPower(g, 0), ES.totalPower(g, 1)], me: side(s), opp: side(o),
      hand: g.players[s].hand.map(c => lock ? [c.uid, c.id, c.lockedRound === g.round] : [c.uid, c.id]), oppCount: g.players[o].hand.length, passed: [!!g.players[0].passed, !!g.players[1].passed] };
  }
  function projectAdapter(G, s, lock) {
    const o = 1 - s;
    const u = (x) => ({ uid: x.uid, id: x.id, power: x.power, venom: x.venom || 0, bound: !!x.bound, ghost: !!x.ghost });
    const side = (pi) => { const pl = G.players[pi]; return { units: pl.units.map(u), heroes: pl.heroes.map(u), art: pl.artifact ? pl.artifact.id : null,
      discard: pl.discard.map(c => c.id), deck: pl.deck.length, rw: pl.roundWins, shielded: pl.shieldUids.slice().sort(), mull: pl.mulliganed }; };
    return { round: G.round, turn: G.turn, over: G.over, winner: G.winner, realm: G.realm, rh: G.roundHistory.map(h => [h.round, h.t0, h.t1, h.winner]),
      totals: G.totals, me: side(s), opp: side(o), hand: G.players[s].hand.map(c => lock ? [c.uid, c.id, c.lockedRound === G.round] : [c.uid, c.id]), oppCount: G.players[o].hand.length,
      passed: [G.players[0].passed, G.players[1].passed] };
  }
  const PAIRS = [['vanaras', 'nagas'], ['devas', 'asuras'], ['nagas', 'vanaras'], ['asuras', 'devas'], ['devas', 'nagas']];
  for (const carried of [false, true]) {
    let matches = 0, checks = 0, first = null, flagChecks = 0, passedFlips = 0, events = 0, ghostsSeen = 0, discardUids = 0, discardTotal = 0, lockViews = 0;
    for (let m = 0; m < 40 && !first; m++) {
      const [f0, f1] = PAIRS[m % PAIRS.length], seed = (0x51ED27 * (m + 3)) >>> 0;
      const room = createRoom(ES, { seed, seats: [{ address: '0x' + '1'.repeat(40), faction: f0 }, { address: '0x' + '2'.repeat(40), faction: f1 }] });
      const g = room.state, A = [mkAdapter(0), mkAdapter(1)], st = [null, null];
      let cursor = 0;
      const push = (lastMove) => {
        const slice = (g.events || []).slice(cursor); cursor = (g.events || []).length; events += slice.length;
        for (const s of [0, 1]) {
          let v = hall(buildView({ E: ES }, room, 'm-parity', s, lastMove, slice)); if (!carried) v = strip(v);
          st[s] = A[s].viewToState(v, st[s]);
          const want = oracle(room, s, carried), got = projectAdapter(st[s], s, carried);
          if (JSON.stringify(want) !== JSON.stringify(got)) { first = { m, seat: s, carried, lastMove, diff: Object.keys(want).filter(k => JSON.stringify(want[k]) !== JSON.stringify(got[k])) }; return false; }
          checks++; if (carried && g.players[s].hand.some(c => c.lockedRound === g.round)) lockViews++;
          st[s].players.forEach(pl => { ghostsSeen += pl.units.filter(x => x.ghost).length; discardTotal += pl.discard.length; discardUids += pl.discard.filter(x => x.uid != null).length; });
          if (carried) {   // present-when-carried: the flags row reaches the cards
            const ok2 = g.players.every((pl, pi) => pl.units.concat(pl.heroes).every(x => { const c = st[s].players[pi].units.concat(st[s].players[pi].heroes).find(y => y.uid === x.uid); return c && c.base === x.base && c.stolenBy === x.stolenBy && !!c.ward === !!x.ward && !!c.asleep === !!x.asleep; }));
            if (!ok2) { first = { m, seat: s, carried, why: 'flags not applied' }; return false; } flagChecks++;
          } else {         // degraded-when-absent: printed power as base, no badges
            const ok3 = st[s].players.every(pl => pl.units.concat(pl.heroes).every(c => c.ghost || (c.ward === false && c.asleep === false && c.stolenBy === -1)));
            if (!ok3) { first = { m, seat: s, carried, why: 'a badge without its field' }; return false; }
          }
        }
        return true;
      };
      if (!push(null)) break;
      for (const s of [0, 1]) { room.apply(s, { type: 'mulligan', indices: [] }); if (!push({ seat: s, type: 'mulligan' })) break; }
      let guard = 0;
      while (!g.over && !first && guard++ < 400) {
        const s = room.turn, d = ES.aiMove(g, s), pl = g.players[s];
        if (pl.faction === 'vanaras' && ES.canLeap(g, s) && guard % 5 === 0) {
          const bl = ES.bestLeap(g, s); if (bl) { const a = { type: 'leap', leaperIndex: pl.units.indexOf(bl.leaper), targetIndex: pl.units.indexOf(bl.target) };
            if (room.validate(s, a).ok) { room.apply(s, a); if (!push({ seat: s, type: 'leap' })) break; } }
        }
        let a = (d && d.play != null && guard % 9 !== 4) ? { type: 'play', handIndex: d.play, targetIndex: null } : { type: 'pass' };
        if (a.type === 'play') { const sp = ES.targetSpec(g, s, pl.hand[d.play]); if (sp && sp.options && sp.options.length) a.targetIndex = 0; }
        if (!room.validate(s, a).ok) a = { type: 'pass' };
        const lm = a.type === 'play' ? { seat: s, type: 'play', id: pl.hand[a.handIndex].id, n: pl.hand[a.handIndex].n } : { seat: s, type: a.type };
        const wasPassed = pl.passed; room.apply(s, a); if (a.type === 'pass' && !wasPassed) passedFlips++;
        if (!push(lm)) break;
      }
      if (!first) matches++;
    }
    ok('ADAPTER PARITY (' + (carried ? 'views AS SHIPPED — passed, board flags, myHandLocked (web3 aed5424)' : 'views STRIPPED of the three fields — an older server, degraded') + '): ' + matches + ' matches, ' + checks + ' seat-checks after every action — equal to the engine\'s public projection',
       first === null && matches === 40, JSON.stringify(first));
    if (carried) ok('  present-when-carried: the board flags row (base · ward · asleep · stolenBy) reaches every board card (' + flagChecks + ' views); the own-hand lock equal to the engine in every view (' + lockViews + ' with a live Narada lock)', flagChecks > 0 && lockViews > 0 && first === null);
    else ok('  degraded-when-absent: no badge without its field; passed derived from lastMove matched the engine through ' + passedFlips + ' passes; ' + events + ' events, ' + ghostsSeen + ' ghost cells, discard uids inherited ' + discardUids + '/' + discardTotal, first === null && passedFlips > 0);
  }
  // GHOST CELLS, placed on purpose (the AI rarely makes one): Yama + two units down, one destroyed by the engine's own
  //   destroyUnit (TEST-ONLY state construction) → the ghost appends; another unit played after it → the ghost is mid-row.
  {
    const Es = Object.assign(Object.create(ES), { newGame: (o) => ES.newGame(Object.assign({}, o, { scenario: { p0Deck: ['Yama', 'Deva Soldier', 'Marut', 'Kubera', 'Urvashi', 'Indra', 'Agni', 'Vayu', 'Gandharva', 'Chandra Dev', 'Vajra', 'Pavamana'], p1Deck: ['Naga Archer', 'Naga Warrior', 'Kaliya', 'Astika', 'Ulupi', 'Manasa', 'Surasa', 'Naga Sadhu', 'Ashvatara', 'Karkotaka', 'Nagapasha', 'Sarpa Satra'], mulligan: 0 } })) });
    const room = createRoom(Es, { seed: 7, seats: [{ address: '0x' + '1'.repeat(40), faction: 'devas' }, { address: '0x' + '2'.repeat(40), faction: 'nagas' }] });
    const g = room.state, A = mkAdapter(0); let st = null, cur = 0, ok4 = true, sawMid = false;
    const view = (lm) => { const sl = (g.events || []).slice(cur); cur = (g.events || []).length; st = A.viewToState(hall(buildView({ E: ES }, room, 'm', 0, lm, sl)), st);
      const w = oracle(room, 0), gt = projectAdapter(st, 0); if (JSON.stringify(w.me.units) !== JSON.stringify(gt.me.units)) ok4 = false;
      const gi = st.players[0].units.findIndex(u => u.ghost); if (gi >= 0 && gi < st.players[0].units.length - 1) sawMid = true; };
    room.apply(0, { type: 'mulligan', indices: [] }); room.apply(1, { type: 'mulligan', indices: [] }); view(null);
    const playId = (id) => { const i = g.players[0].hand.findIndex(c => c.id === id); if (g.turn !== 0) { room.apply(1, { type: 'pass' }); } room.apply(0, { type: 'play', handIndex: i, targetIndex: null }); view({ seat: 0, type: 'play', id }); };
    playId('yama'); playId('soldier'); playId('marut');
    ES.destroyUnit(g, 0, g.players[0].units.find(u => u.id === 'soldier'), 'test');   // TEST-ONLY: the engine's own destroy, with Yama on the board
    view(null); const ghostAt = g.players[0].units.findIndex(u => u.ghost);
    playId('kubera');
    ok('GHOST CELLS: a real Yama ghost re-inserted at its row position (index ' + ghostAt + ', then mid-row after a later play) — equal to the engine, every step', ok4 && ghostAt >= 0 && sawMid);
  }
  // the seat law holds on the staked road: the same view read with ME=0 and ME=1 draws each seat as "You" exactly once
  {
    const room = createRoom(ES, { seed: 99, seats: [{ address: '0x' + '1'.repeat(40), faction: 'devas' }, { address: '0x' + '2'.repeat(40), faction: 'nagas' }] });
    const v0 = hall(buildView({ E: ES }, room, 'm', 0, null, [])), v1 = hall(buildView({ E: ES }, room, 'm', 1, null, []));
    const G0 = mkAdapter(0).viewToState(v0, null), G1 = mkAdapter(1).viewToState(v1, null);
    ok('the seat law on the staked road: ME=0 and ME=1 each read their OWN hand in full and the other as a count; names are You / Opponent by ME',
       G0.players[0].name === 'You' && G0.players[1].name === 'Opponent' && G1.players[1].name === 'You' && G1.players[0].name === 'Opponent' &&
       G0.players[0].hand.every(c => c.uid != null && c.id) && G0.players[1].hand.every(c => c.hidden) && G1.players[1].hand.every(c => c.uid != null) && G1.players[0].hand.every(c => c.hidden));
  }
  // G-LOCK-READ-1 — THE LOCK, placed on purpose: seat 0's Narada locks seat 1's hand[0]. For its OWNER the card renders
  //   🔒 (the hand row's own predicate, c.lockedRound === G.round) and is unplayable (the facade's staked answer,
  //   G._legal.playable); the OPPONENT's adapter carries no lock for it anywhere. Two mutants must turn it red: an
  //   adapter that ignores myHandLocked, and a view that hands seat 0 the other seat's lock bits.
  {
    const SC = { p0Deck: ['Narada', 'Chandra Dev', 'Yama', 'Marut', 'Gandharva', 'Deva Soldier', 'Kubera', 'Urvashi', 'Brihaspati', 'Vishwakarma', 'Indra', 'Agni'],
                 p1Deck: ['Asura Berserker', 'Kali Asura', 'Kalanemi', 'Bana Asura', 'Narakasura', 'Meghnad', 'Vibhishana', 'Ravana', 'Maricha', 'Tataka', 'Hiranyakashipu', 'Kumbhakarna'], mulligan: 0 };
    const Es = Object.assign(Object.create(ES), { newGame: (o) => ES.newGame(Object.assign({}, o, { scenario: SC })) });
    const room = createRoom(Es, { seed: 11, seats: [{ address: '0x' + '1'.repeat(40), faction: 'devas' }, { address: '0x' + '2'.repeat(40), faction: 'asuras' }] });
    const g = room.state, go = (s, a) => { const vd = room.validate(s, a); if (!vd.ok) throw new Error('LOCK scenario refused: ' + vd.reason); room.apply(s, a); };
    go(0, { type: 'mulligan', indices: [] }); go(1, { type: 'mulligan', indices: [] });
    if (room.turn !== 0) go(1, { type: 'play', handIndex: g.players[1].hand.findIndex(c => c.t === 'unit' && c.id !== 'maricha'), targetIndex: null });
    const nar = g.players[0].hand.findIndex(c => c.id === 'saraswati'), lockedUid = g.players[1].hand[0].uid;
    go(0, { type: 'play', handIndex: nar, targetIndex: 0 });   // Narada's targets are seat 1's hand; index 0 = hand[0]
    const v0 = hall(buildView({ E: ES }, room, 'm', 0, null, [])), v1 = hall(buildView({ E: ES }, room, 'm', 1, null, []));
    const own = (G) => G.players[1].hand.find(c => c.uid === lockedUid);
    const G1 = mkAdapter(1).viewToState(v1, null), G0 = mkAdapter(0).viewToState(v0, null);
    const lockIcon = (G, c) => !!c && c.lockedRound === G.round;                                   // index.html's hand row: c.lockedRound===G.round → 🔒
    const unplayable = (G, c) => !!G._legal && G.players[1].hand.indexOf(c) >= 0 && !G._legal.playable.some(p => p.i === G.players[1].hand.indexOf(c)) && G._legal.playable.length > 0;
    const oppClean = (G) => G.players[1].hand.every(c => !c.lockedRound) && G.players[0].hand.every(c => !c.lockedRound) && !JSON.stringify(G.players[1].hand).includes('lockedRound":' + G.round);
    const realOK = g.players[1].hand[0].lockedRound === g.round && room.turn === 1 && lockIcon(G1, own(G1)) && unplayable(G1, own(G1)) && oppClean(G0);
    // mutant A — the adapter as it read before this rung (no myHandLocked): the owner's 🔒 must vanish
    const srcA = adapterSrc.replace("lockedRound: (v.myHandLocked && v.myHandLocked[k]) ? v.round : 0", 'lockedRound: 0');
    const mutA = srcA !== adapterSrc && !lockIcon(G1, own(mkAdapter(1, srcA).viewToState(v1, null)));
    // mutant B — seat 0 handed seat 1's lock bits as its own: seat 0's adapter now shows a lock → the clean check goes red
    const vB = Object.assign({}, v0, { myHandLocked: g.players[1].hand.map(c => c.lockedRound === g.round) });
    const mutB = !oppClean(mkAdapter(0).viewToState(vB, null));
    ok('THE LOCK (G-LOCK-READ-1): a Narada-locked hand card renders 🔒 and is unplayable for its OWNER (seat 1); the opponent\'s adapter carries no lock for it — mutants red: an adapter blind to myHandLocked (' + (mutA ? 'RED' : 'green?!') + '), the other seat\'s bits in seat 0\'s view (' + (mutB ? 'RED' : 'green?!') + ')',
       realOK && mutA && mutB, JSON.stringify({ realOK, mutA, mutB, turn: room.turn, phase: room.phase }));
  }
}

// ═══ 5 · THE BRIDGE AUDIT, headless, on web3's coverage decks (all 12 event types, no earned-sight card) ═══
console.log('\n── 5 · the bridge audit: every staked view, after the Hall\'s strip, against the other seat\'s hidden cards ──');
let COV = null; try { COV = require(path.join(MS, 'test', 'viewcoverage.fixture.js')); } catch (e) { COV = null; }
if (!COV || !buildView || !createRoom) {
  console.log('  ⚠ SKIP — the web3 coverage fixture is absent (' + MS + ').');
} else {
  const ES = require(path.join(MS, 'src', 'engineguard.js')).loadGuardedEngine().engine;
  const Es = Object.assign(Object.create(ES), { newGame: (o) => ES.newGame(Object.assign({}, o, { scenario: { p0Deck: COV.P0_DECK, p1Deck: COV.P1_DECK } })) });
  const room = createRoom(Es, { seed: COV.SEED, seats: [{ address: '0x' + 'a'.repeat(40), faction: 'devas' }, { address: '0x' + 'b'.repeat(40), faction: 'nagas' }] });
  const g = room.state, rx = [[], []]; let cursor = 0;
  const push = (lm) => { const sl = (g.events || []).slice(cursor); cursor = (g.events || []).length;
    for (const s of [0, 1]) { const v = buildView({ E: ES }, room, 'm-cov', s, lm, sl); delete v.myName; delete v.oppName; rx[s].push(JSON.stringify({ type: 'wire:view', matchId: 'm-cov', seq: rx[s].length + 1, view: v })); } };
  push(null);
  for (const [s, a] of COV.ACTS) { if (!room.validate(s, a).ok) break; const lm = a.type === 'play' ? { seat: s, type: 'play', id: g.players[s].hand[a.handIndex].id, n: g.players[s].hand[a.handIndex].n } : { seat: s, type: a.type }; room.apply(s, a); push(lm); }
  const types = new Set(); rx[0].forEach(l => JSON.parse(l).view.events.forEach(e => types.add(e.type)));
  const played = new Set((g.events || []).filter(e => e.type === 'play').map(e => e.sourceUid));
  const uidsIn = (lines) => { const out = []; lines.forEach(l => { (function w(v, k, path) { if (Array.isArray(v)) return v.forEach((x, i) => w(x, k, path + '[' + i + ']'));
    if (v && typeof v === 'object') return Object.keys(v).forEach(kk => w(v[kk], kk === 'mine' || kk === 'opp' ? k : kk, path + '.' + kk));
    if (typeof v === 'number' && k && (/uid/i.test(k) || k === 'shielded')) out.push({ uid: v, path }); })(JSON.parse(l), null, ''); }); return out; };
  let leaks = 0, names = 0;
  for (const s of [0, 1]) {
    const o = 1 - s, hid = g.players[o].hand.concat(g.players[o].deck).filter(c => !played.has(c.uid)), log = rx[s].join('\n');
    const hidU = new Set(hid.map(c => c.uid));
    leaks += hid.filter(c => log.indexOf('"' + c.id + '"') >= 0).length + uidsIn(rx[s]).filter(x => hidU.has(x.uid) && !/\.legal\.playable\[\d+\]\.targets\[\d+\]\.uid$/.test(x.path) && !/\.oppHand/.test(x.path)).length;
    if (/"seed"/.test(log)) leaks++;
    names += (log.match(/"(myName|oppName)"/g) || []).length + (log.match(/0x[0-9a-fA-F]{4}…[0-9a-fA-F]{4}/g) || []).length;
  }
  ok('BRIDGE AUDIT: ' + (rx[0].length + rx[1].length) + ' staked views over all ' + types.size + ' event types — ZERO hidden ids / uids / seed of the other seat, ZERO seat names or wallet short forms', leaks === 0 && names === 0 && types.size === 12, 'leaks ' + leaks + ', names ' + names);
}

// ═══ 6 · GL-2 — THE BATTLE-LOG RECORDER ═══
// The SHIPPED recorder (index.html blogStart · blogCapture · blogRecord · blogClose · passedInAction, compiled here with
// the SHIPPED src/narrator.js) is driven exactly as runAction drives it — capture, mutate, slice, record — on the free
// mirror (the shipped wireApply), on the staked adapter (the shipped viewToState over the REAL buildView) and on the solo
// road (the local engine + the mulligan hook), for both seats. Each is compared line for line with an ORACLE narrated
// independently from the SERVER's own room: its own events, its own public zones, the wallet short forms it really
// holds as seat names, and pass lines taken from the ACTIONS (a pass act is a pass) — not from state transitions, so a
// dropped round-ending pass cannot hide behind the recorder's own rule.
console.log('\n── 6 · GL-2 the recorder: free mirror · staked adapter · solo, both seats, against the server\'s own narration ──');
{
  const NARR = require(path.join(GAME, 'src', 'narrator.js'));
  const code = stripComments(UI);
  // ── the hook points, pinned in code (comments stripped) ──
  // runAction(mutate, opts={}) — the default {} is not the body: read from the brace that follows the signature
  const raAt = code.indexOf('function runAction(');
  const ra = (() => { let d = 0; const j = code.indexOf('){', raAt) + 1; for (let q = j; q < code.length; q++) { if (code[q] === '{') d++; else if (code[q] === '}') { d--; if (d === 0) return code.slice(raAt, q + 1); } } return ''; })();
  const iCap = ra.indexOf('const blogBefore=blogCapture(G);'), iMut = ra.indexOf('mutate();'), iSlice = ra.indexOf('const evs = G.events.slice(evStart);'), iRec = ra.indexOf('blogRecord(G, blogBefore, evs, opts.actor);');
  ok('the hook: runAction captures the names BEFORE its mutate and records the batch on the line right after the slice, before any choreography',
     iCap > 0 && iCap < iMut && iMut < iSlice && iRec > iSlice && ra.slice(iSlice, iRec).split('\n').length === 2 && iRec < ra.indexOf('choreoActive=true'));
  const mull = code.slice(code.indexOf("$('mullconfirm').onclick="), code.indexOf('function applyFactionTheme'));
  ok('the solo mulligan (resolved outside runAction) is captured before and recorded after, the same way',
     mull.indexOf('blogCapture(G)') > 0 && mull.indexOf('blogCapture(G)') < mull.indexOf('mulligan(G,ME') && mull.indexOf('blogRecord(G, blogBefore, evs, ME)') > mull.indexOf('G.events.slice(evStart)'));
  ok('reset at the three match starts (where seenLog resets): vs-AI → solo, the wire → its road + matchId, Story → off (R3)',
     /seenLog=0; blogStart\('solo', null, G\)/.test(extractFn(code, 'startGame')) && /seenLog = 0;\s*blogStart\(Wire\.road, Wire\.matchId, G\)/.test(extractFn(code, 'startWireMatch')) && /seenLog=0; blogStart\('story', null, G\)/.test(extractFn(code, 'startStoryChapter')));
  ok('the wire result face writes the closing line (a forfeit never reaches G.over)', /blogClose\(G, r\)/.test(extractFn(code, 'showWireResult')));
  ok('the pass BANNER now announces the round-ending pass too, read by ABSOLUTE seat (the [ME, OPP] snapshot misread seat 1)',
     /passedInAction\(G, pi, passedBefore, roundCountAtActionStart, actor\)/.test(extractFn(code, 'announcePassIfAny')) && ra.indexOf('const passedBefore=G.players.map(p=>!!p.passed);') >= 0 && (ra.match(/announcePassIfAny\(passedBefore, opts\.actor\)/g) || []).length === 2);
  const tagN = HTML.indexOf('<script src="src/narrator.js'), tagMain = HTML.indexOf('let G=null');
  ok('the page loads src/narrator.js (after chapters.js, before the battle script)', tagN > 0 && tagN < tagMain && HTML.indexOf('<script src="src/chapters.js') < tagN);

  let createRoom6 = null, buildView6 = null, ES6 = null;
  try { createRoom6 = require(path.join(MS, 'src', 'match.js')).createRoom; buildView6 = require(path.join(MS, 'src', 'redactedview.js')).buildView; ES6 = require(path.join(MS, 'src', 'engineguard.js')).loadGuardedEngine().engine; } catch (e) { createRoom6 = null; }
  if (!createRoom6 || !buildView6) {
    fail++; console.log('  ✖ SKIPPED LOUDLY — the web3 checkout is absent (' + MS + '). The recorder\'s road parity is NOT proven.');
  } else {
    const E = require(path.join(GAME, 'src', 'engine.js'));
    // ── the shipped recorder, compiled with a spy on the narrator's inputs (THE WALL counters) ──
    const REC_FNS = ['blogStart', 'blogPersist', 'blogNames', 'blogCapture', 'passedInAction', 'blogRecord', 'blogClose'];
    const recSrc = REC_FNS.map(n => extractFn(UI, n)).join('\n');
    const prefix = (UI.match(/const BLOG_PREFIX = '[^']*';/) || [''])[0];
    const SPY = { players: [], texts: [] };
    const spyNarr = Object.assign({}, NARR, { narrate: (recs, names) => { SPY.players.push(names && names.players); recs.forEach(r => { if (typeof r.text === 'string') SPY.texts.push(r.text); }); return NARR.narrate(recs, names); } });
    const mkStore = (from) => { const m = new Map(from ? from.m : []); return { m, getItem: k => m.has(k) ? m.get(k) : null, setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) }; };
    const mkRec = (me, store, src) => new Function('NARRATOR', 'sessionStorage',
      'let ME=' + me + ', OPP=' + (1 - me) + ', BLog=null; ' + prefix + '\n' + (src || recSrc) + '\nreturn { blogStart, blogCapture, blogRecord, blogClose, get: () => BLog };')(spyNarr, store);
    // ── the shipped wireApply and viewToState, as sections 3 and 4 compile them ──
    const wireApplyFactory = new Function('E', 'getG',
      'const mulligan=E.mulligan, targetSpec=E.targetSpec, playCard=E.playCard, pass=E.pass, designateShield=E.designateShield, doLeap=E.doLeap;\n' +
      'const Q = { targetSpec: E.targetSpec };\n' +
      'return function(mv){ const G=getG(); return (' + extractFn(UI, 'wireApply').replace('function wireApply(mv){', 'function(mv){') + ')(mv); };');
    const CBN = {}; for (const f in E.DECKS) for (const d of E.DECKS[f]) if (!CBN[d.n]) CBN[d.n] = d;
    const adapterSrc = extractFn(UI, 'defById') + '\n' + extractFn(UI, 'viewToState');
    const mkAdapter = (me) => new Function('DECKS', 'CARD_BY_NAME', 'let ME=' + me + ', OPP=' + (1 - me) + ', DEF_BY_ID=null;\n' + adapterSrc + '\nreturn viewToState;')(E.DECKS, CBN);
    const hall = (v) => { const c = Object.assign({}, v); delete c.myName; delete c.oppName; return c; };
    // ── the ORACLE's own public zones (the server's state; the viewer's own hand, never the other hand or a deck) ──
    const pubMap = (g, me) => { const m = {}; g.players.forEach((pl, seat) => { const z = [pl.units, pl.heroes, pl.discard, pl.removedHeroes || [], pl.artifact ? [pl.artifact] : []]; if (seat === me) z.push(pl.hand);
      z.forEach(a => (a || []).forEach(c => { if (c && !c.ghost && c.uid != null) m[c.uid] = { n: c.n, seat: seat }; })); }); return m; };
    const J = (x) => JSON.stringify(x);
    const lines = (R) => (R.get() ? R.get().lines : null);
    const FACS = ['devas', 'asuras', 'vanaras', 'nagas'];
    const GAP = (round) => NARR.resume([], { round })[0];
    const tot = { matches: 0, actions: 0, oracleLines: 0, passes: 0, roundEnders: 0, freeBad: [], stakedBad: [], resyncBad: [], restoreBad: [], storeBad: [], errors: 0, forfeits: 0, forfeitBad: [], mulliganToasts: 0, stakedGapAtStart: 0 };
    let replay0 = null;
    for (let m = 0; m < 16; m++) {
      const f0 = FACS[m % 4], f1 = FACS[Math.floor(m / 4) % 4], seed = (0x2545F491 * (m + 7)) >>> 0, mid = 'm-gl2-' + m;
      const room = createRoom6(ES6, { seed, seats: [{ address: '0x' + '1'.repeat(40), faction: f0 }, { address: '0x' + '2'.repeat(40), faction: f1 }] });
      const sg = room.state, SEATN = [sg.players[0].name, sg.players[1].name];
      const OR = [[], []], orPlayed = {};
      // the frames: free mirror + staked adapter, per seat; the resync frames join mid-match
      const frames = [];
      for (const me of [0, 1]) {
        const G = E.newGame({ p0: me === 0 ? 'You' : 'Opponent', p1: me === 1 ? 'You' : 'Opponent', p0Faction: f0, p1Faction: f1, rng: wireSeeded(seed) });
        const fr = { kind: 'free', me, g: G, store: mkStore(), R: null }; fr.R = mkRec(me, fr.store); fr.R.blogStart('free', mid, fr.g); fr.apply = wireApplyFactory(E, () => fr.g); frames.push(fr);
        const st = { kind: 'staked', me, A: mkAdapter(me), store: mkStore(), R: null };
        st.g = st.A(hall(buildView6({ E: ES6 }, room, mid, me, null, [])), null); st.R = mkRec(me, st.store); st.R.blogStart('staked', mid, st.g);
        if (lines(st.R).length) tot.stakedGapAtStart++;
        frames.push(st);
      }
      let cursor = sg.events.length, k = 0;
      const K = 14 + (m % 5), FORFEIT = (m % 4 === 3) ? 26 + m : -1, cuts = [];
      const moves = [];
      const step = (seat, a) => {
        const pre = [pubMap(sg, 0), pubMap(sg, 1)], preRh = sg.roundHistory.length, preOver = !!sg.over, preRound = sg.round, ev0 = sg.events.length;
        const handCard = a.type === 'play' ? sg.players[seat].hand[a.handIndex] : null;
        const r = room.apply(seat, a); moves.push(r.move);
        const evs = sg.events.slice(ev0);
        if (handCard) { const pe = evs.find(e => e.type === 'play'); if (pe && !orPlayed[pe.sourceUid]) orPlayed[pe.sourceUid] = { n: handCard.n, seat }; }
        tot.mulliganToasts += evs.filter(e => e.type === 'toast' && e.abilityName === 'Mulligan').length;
        const post = [pubMap(sg, 0), pubMap(sg, 1)];
        const ended = sg.roundHistory.length > preRh;
        if (a.type === 'pass') { tot.passes++; if (ended) tot.roundEnders++; }
        const recs = NARR.assemble({ passes: a.type === 'pass' ? [{ round: preRound, seat }] : [], events: evs, roundEnds: sg.roundHistory.slice(preRh), result: (sg.over && !preOver) ? { round: sg.round, winner: sg.winner } : null });
        for (const me of [0, 1]) OR[me].push(...NARR.narrate(recs, { me, players: SEATN, card: u => post[me][u] || pre[me][u] || orPlayed[u] || null }));
        const lm = handCard ? { seat, type: 'play', id: handCard.id, n: handCard.n } : { seat, type: a.type };
        const slice = sg.events.slice(cursor); cursor = sg.events.length;
        for (const fr of frames) {
          const before = fr.R.blogCapture(fr.g);
          if (fr.kind === 'free') { const e0 = fr.g.events.length; fr.apply(r.move); fr.R.blogRecord(fr.g, before, fr.g.events.slice(e0), r.move.seat); }
          else { const e0 = fr.g.events.length; fr.g = fr.A(hall(buildView6({ E: ES6 }, room, mid, fr.me, lm, slice)), fr.g); fr.R.blogRecord(fr.g, before, fr.g.events.slice(e0), lm.seat); }
        }
        k++; tot.actions++;
        if (k === K) {   // THE STAKED RESYNC: a fresh frame from a view with events: [] — once with empty storage, once with the storage the tab kept
          cuts.push([OR[0].length, OR[1].length]);
          for (const me of [0, 1]) {
            const kept = frames.find(f => f.kind === 'staked' && f.me === me);
            for (const restored of [false, true]) {
              const fr = { kind: 'staked', me, A: mkAdapter(me), store: restored ? mkStore(kept.store) : mkStore(), resync: restored ? 'restored' : 'empty', round: sg.round };
              fr.g = fr.A(hall(buildView6({ E: ES6 }, room, mid, me, null, [])), null); fr.R = mkRec(me, fr.store); fr.R.blogStart('staked', mid, fr.g);
              frames.push(fr);
            }
          }
        }
      };
      for (const s of [m % 2, 1 - m % 2]) step(s, { type: 'mulligan', indices: sg.players[s].hand.map((_, i) => i).filter(i => (seed + i + s) % 4 === 0).slice(0, 3) });
      let guard = 0;
      while (!sg.over && guard++ < 500 && k !== FORFEIT) {
        const s = room.turn, pl = sg.players[s];
        if (ES6.canLeap(sg, s) && guard % 4 === 0) { const bl = ES6.bestLeap(sg, s); if (bl) { const a = { type: 'leap', leaperIndex: pl.units.indexOf(bl.leaper), targetIndex: pl.units.indexOf(bl.target) }; if (room.validate(s, a).ok) step(s, a); } }
        const live = pl.units.findIndex(u => !u.ghost);
        if (guard % 6 === 2 && live >= 0) { const a = { type: 'shield', unitIndex: live }; if (room.validate(s, a).ok) step(s, a); }
        const d = ES6.aiMove(sg, s);
        let a = (d && d.play != null && guard % 13 !== 6) ? { type: 'play', handIndex: d.play, targetIndex: null } : { type: 'pass' };
        if (a.type === 'play') { const sp = ES6.targetSpec(sg, s, pl.hand[d.play]); if (sp && sp.options && sp.options.length) a.targetIndex = 0; }
        if (!room.validate(s, a).ok) a = { type: 'pass' };
        step(s, a);
      }
      if (m === 0) replay0 = { f0, f1, seed, moves: moves.slice(), oracle: [OR[0].slice(), OR[1].slice()] };
      // ── the forfeit: the board cannot reach G.over, showWireResult closes the log (winner = seat 0; seat 1 left) ──
      if (FORFEIT >= 0 && !sg.over) {
        tot.forfeits++;
        for (const fr of frames) {
          const before = lines(fr.R).length;
          fr.R.blogClose(fr.g, { winner: 0, forfeit: true, roundWins: [0, 0] }); fr.R.blogClose(fr.g, { winner: 0, forfeit: true, roundWins: [0, 0] });
          fr.R.blogRecord(fr.g, fr.R.blogCapture(fr.g) || { names: {}, passed: [false, false], rh: 0, round: 1, over: false }, [], 0);
          const L = lines(fr.R), want = fr.me === 0 ? 'Your opponent left the table.' : 'You left the table.';
          if (L.length !== before + 1 || L[L.length - 1].text !== want || L[L.length - 1].kind !== 'forfeit') tot.forfeitBad.push(mid + ' ' + fr.kind + ' seat' + fr.me + ': ' + (L[L.length - 1] || {}).text);
        }
        const close = { round: sg.round, kind: 'forfeit' };
        for (const me of [0, 1]) OR[me].push(...NARR.narrate([Object.assign(close, { winner: 0 })], { me }));
      }
      // ── compare every frame with the oracle ──
      for (const fr of frames) {
        const L = lines(fr.R), b = fr.R.get();
        tot.errors += b.errors;
        let want = OR[fr.me];
        if (fr.resync) {
          const cut = cuts[0][fr.me], gap = GAP(fr.round);
          want = fr.resync === 'empty' ? [gap].concat(OR[fr.me].slice(cut)) : OR[fr.me].slice(0, cut).concat([gap], OR[fr.me].slice(cut));
        }
        if (J(L) !== J(want)) {
          const i = want.findIndex((x, j) => J(x) !== J(L[j]));
          const bucket = fr.resync === 'empty' ? tot.resyncBad : fr.resync === 'restored' ? tot.restoreBad : fr.kind === 'free' ? tot.freeBad : tot.stakedBad;
          bucket.push(mid + ' seat' + fr.me + ' line ' + i + ': want "' + (want[i] || {}).text + '" got "' + (L[i] || {}).text + '" (' + L.length + '/' + want.length + ')');
        }
        if (fr.kind === 'staked') { const raw = fr.store.getItem('dy_blog:' + mid); if (!raw || J(JSON.parse(raw).lines) !== J(L) || fr.store.m.size !== 1) tot.storeBad.push(mid + ' seat' + fr.me + (fr.resync ? ' ' + fr.resync : '')); }
        else if (fr.store.m.size !== 0) tot.storeBad.push(mid + ' free seat' + fr.me + ' wrote storage');
      }
      tot.oracleLines += OR[0].length + OR[1].length; tot.matches++;
    }
    console.log('    ' + tot.matches + ' matches (all 16 pairings), ' + tot.actions + ' server actions, ' + tot.oracleLines + ' oracle lines (both seats), ' + tot.passes + ' passes of which ' + tot.roundEnders + ' ended a round, ' + tot.mulliganToasts + ' mulligan redraws, ' + tot.forfeits + ' forfeits');
    ok('FREE ROAD: the recorder on the shipped mirror equals the server\'s own narration, line for line, both seats (16 matches)', tot.freeBad.length === 0, tot.freeBad.slice(0, 2).join(' | '));
    ok('STAKED ROAD: the recorder on the shipped adapter (real buildView, the adapter\'s card lookup) equals it too, both seats', tot.stakedBad.length === 0 && tot.stakedGapAtStart === 0, tot.stakedBad.slice(0, 2).join(' | ') + ' gapAtStart ' + tot.stakedGapAtStart);
    ok('EVERY PASS is in the log — ' + tot.passes + ' pass acts, ' + tot.roundEnders + ' of them ROUND-ENDING, each a line on both roads (the oracle takes passes from the acts, the recorder from the state)', tot.roundEnders > 0 && tot.freeBad.length === 0 && tot.stakedBad.length === 0);
    ok('STAKED RESYNC, storage empty (a view with events: [] past the opening): the gap line "' + NARR.GAP_TEXT + '" first, then every later line exactly', tot.resyncBad.length === 0, tot.resyncBad.slice(0, 2).join(' | '));
    ok('STAKED RESYNC, storage restored: the kept lines, THEN the gap (continuity unproven: the view has no move counter), then every later line', tot.restoreBad.length === 0, tot.restoreBad.slice(0, 2).join(' | '));
    ok('R4 persistence: the staked log lives in sessionStorage under dy_blog:<matchId> and equals the lines after every action; the free road writes nothing', tot.storeBad.length === 0, tot.storeBad.slice(0, 3).join(' | '));
    ok('FORFEIT: the winner\'s log closes "Your opponent left the table.", the leaver\'s "You left the table." — once, on both roads (' + tot.forfeits + ' matches); nothing records after it', tot.forfeits > 0 && tot.forfeitBad.length === 0, tot.forfeitBad.slice(0, 2).join(' | '));
    ok('the recorder never threw (errors 0 across every frame)', tot.errors === 0, 'errors ' + tot.errors);
    // ── the round-ending pass, proven RED without its rule: the old announcement's transition-only reading ──
    {
      const mut = recSrc.replace(extractFn(UI, 'passedInAction'), 'function passedInAction(g, pi, before){ return !!before && !before[pi] && !!g.players[pi].passed; }');
      const G = E.newGame({ p0: 'You', p1: 'Opponent', p0Faction: replay0.f0, p1Faction: replay0.f1, rng: wireSeeded(replay0.seed) });
      const R = mkRec(0, mkStore(), mut), apply = wireApplyFactory(E, () => G); R.blogStart('free', 'm-mut', G);
      replay0.moves.forEach(mv => { const b = R.blogCapture(G), e0 = G.events.length; apply(mv); R.blogRecord(G, b, G.events.slice(e0), mv.seat); });
      const got = lines(R).filter(l => l.kind === 'pass').length, want = replay0.oracle[0].filter(l => l.kind === 'pass').length;
      ok('MUTANT RED: a recorder reading only the false→true transition (the old banner rule) drops the round-enders — ' + got + ' pass lines vs ' + want, mut !== recSrc && got < want);
    }
    // ── the solo road: the local engine, the mulligan hook, the AI's own turns ──
    {
      let bad = [], passBad = [], n = 0;
      for (let m = 0; m < 16; m++) {
        const f0 = FACS[m % 4], f1 = FACS[Math.floor(m / 4) % 4];
        const G = E.newGame({ p0: 'You', p1: 'Opponent', p0Faction: f0, p1Faction: f1, rng: wireSeeded(777 + m) });
        const R = mkRec(0, mkStore()); R.blogStart('solo', null, G);
        const OS = []; const played = {};
        const oracleAct = (pre, preRh, preOver, preRound, ev0, passer) => {
          const evs = G.events.slice(ev0), post = pubMap(G, 0);
          evs.forEach(e => { if (e.type === 'play' && !played[e.sourceUid]) played[e.sourceUid] = { n: e.abilityName, seat: /^You plays /.test(e.text) ? 0 : 1 }; });
          const recs = NARR.assemble({ passes: passer != null ? [{ round: preRound, seat: passer }] : [], events: evs, roundEnds: G.roundHistory.slice(preRh), result: (G.over && !preOver) ? { round: G.round, winner: G.winner } : null });
          OS.push(...NARR.narrate(recs, { me: 0, players: ['You', 'Opponent'], card: u => post[u] || pre[u] || played[u] || null }));
        };
        { const b = R.blogCapture(G), pre = pubMap(G, 0), e0 = G.events.length;   // the mullconfirm shape: both mulligans, then one record
          E.mulligan(G, 0, G.players[0].hand.slice(0, 2).map(c => c.uid)); E.mulligan(G, 1, E.aiMulliganPlan(G, 1));
          R.blogRecord(G, b, G.events.slice(e0), 0); oracleAct(pre, 0, false, 1, e0, null); }
        let guard = 0;
        while (!G.over && guard++ < 600) {
          const actor = G.turn, b = R.blogCapture(G), pre = pubMap(G, 0), preRh = G.roundHistory.length, preOver = !!G.over, preRound = G.round, e0 = G.events.length;
          const d = E.aiMove(G, actor), willPass = !(d && d.play != null) && !G.players[actor].passed && !(d && d.unbind);
          E.aiTakeTurn(G, actor);
          R.blogRecord(G, b, G.events.slice(e0), actor);
          const passedNow = !!G.players[actor].passed && !b.passed[actor] || (G.roundHistory.length > preRh && !b.passed[actor]);
          oracleAct(pre, preRh, preOver, preRound, e0, passedNow ? actor : null);
        }
        const L = lines(R); n += L.length;
        if (J(L) !== J(OS)) { const i = OS.findIndex((x, j) => J(x) !== J(L[j])); bad.push(f0 + '-' + f1 + ' line ' + i + ': "' + (OS[i] || {}).text + '" vs "' + (L[i] || {}).text + '"'); }
        if (L.filter(l => l.kind === 'pass').length !== 2 * G.roundHistory.length || L[L.length - 1].kind !== 'result') passBad.push(f0 + '-' + f1);
        if (R.get().errors) bad.push('errors ' + R.get().errors);
      }
      ok('SOLO ROAD: 16 AI matches with the mulligan hook — the recorder\'s lines equal an independent narration, both passes of every round present, the result last (' + n + ' lines)', bad.length === 0 && passBad.length === 0, bad.slice(0, 2).concat(passBad.slice(0, 2)).join(' | '));
    }
    // ── THE WALL: what the recorder handed the narrator, and what it kept ──
    {
      const seatish = /0x[0-9a-fA-F]{4}…[0-9a-fA-F]{4}|\{p[01]\}/;   // a wallet short form or a {p} token (the engine's own … ellipsis is not one)
      const namesSeen = SPY.players.filter(p => p && p.some(x => x !== 'You' && x !== 'Opponent')).length;
      const textsSeen = SPY.texts.filter(t => seatish.test(t)).length;
      ok('THE WALL: every seat name the recorder handed the narrator was You / Opponent (' + SPY.players.length + ' calls, ' + namesSeen + ' otherwise); no event text it read carried an address or {p} token (' + textsSeen + ')', SPY.players.length > 0 && namesSeen === 0 && textsSeen === 0);
      ok('story: the recorder is OFF (R3) — blogStart(\'story\') keeps no log', (() => { const R = mkRec(0, mkStore()); R.blogStart('story', null, E.newGame({ p0: 'You', p1: 'Opponent', p0Faction: 'devas', p1Faction: 'asuras' })); return R.get() === null; })());
    }
  }
}


// ══ EXPORT-8 — THE PREMIUM EFFECTS REACH THE OPPONENT'S CLIENT ════════════════════════════════════════════════
// The fault MP-FIX-1 STEP-0 measured: on the STAKED road the opponent's hand is a COUNT behind the wall
// (viewToState builds it {uid:null,id:null,hidden:true}), so fxPrefetchHands / mfPrefetchHands — which walk HANDS —
// can never see a single routed card of the caster's. The receiver requested only its OWN atlas, the remote cast
// found no bytes, and the effect stood down to classic on the one client that did not cast it. The seat's FACTION
// is public, so the pool that seat can ever cast is knowable without breaching the wall. These checks pin that.
{
  const E = require(path.join(GAME, 'src', 'engine.js'));   // the game's own decks: faction -> its printed pool
  // extractFn takes the first `{` AFTER the signature, which for `runAction(mutate, opts={})` is the DEFAULT
  // PARAMETER — it returns the signature alone (34 chars). Latent until EXPORT-8 became the first check to
  // extract such a function; no earlier check was weakened (runAction is the only extracted one with a default).
  // This reads the body by the next top-level `function` instead, which is enough for a source assertion.
  const bodyOf = (name) => { const i = UI.indexOf('function ' + name + '('); if (i < 0) return ''; const j = UI.indexOf('\nfunction ', i + 1); return UI.slice(i, j < 0 ? UI.length : j); };
  const poolFn = extractFn(UI, 'prefetchFactionPool');
  ok('EXPORT-8: prefetchFactionPool exists on the frame', !!poolFn && poolFn.length > 0);
  const startFn = stripComments(extractFn(UI, 'startWireMatch'));
  // the staked branch is the one that owns a view; the free branch builds an engine from a seed
  const stakedHalf = startFn.slice(startFn.indexOf('viewToState(st.view, null)'));
  ok('EXPORT-8: it is called at the STAKED start — the first moment the receiver knows the opponent\'s faction',
     /prefetchFactionPool\(G\.players\[OPP\]\.faction\)/.test(stakedHalf));
  ok('EXPORT-8: the FREE road is untouched — no pool call on the seed branch (hands are visible there; the existing hand prefetch already reaches the caster)',
     (startFn.match(/prefetchFactionPool\(/g) || []).length === 1);
  ok('EXPORT-8: the call cannot stop a match start — it is wrapped, and its result is never awaited',
     /try\s*\{\s*prefetchFactionPool\([^)]*\);\s*\}\s*catch/.test(stakedHalf) && !/await\s+prefetchFactionPool/.test(stakedHalf));

  // ── BEHAVIOUR: drive the REAL extracted function against recording stubs ──
  function drive(faction, opts) {
    opts = opts || {};
    const fxAsked = [], mfAsked = [], notes = [];
    const sandbox = {
      DECKS: E.DECKS,
      FX: { routes: opts.routes || { pashupata: {}, venomstrike: { drain: true } }, boot: null, specs: {}, blobs: {} },
      MF: { reg: opts.reg || { mahabali: {}, shukra: {}, rahu: {}, vritra: {}, mahishi: {}, vasuki: {} }, boot: null, specs: {}, blobs: {}, diag: [] },
      fxBoot: () => null, mfBoot: () => null,
      fxReady: (id) => !!(opts.ready || {})[id],
      mfReady: (id) => !!(opts.ready || {})[id],
      fxPrefetch: (id) => fxAsked.push(id),
      mfPrefetch: (id, rung) => mfAsked.push(id + '@' + rung),
      mfLayoutRung: () => opts.rung || 256,
      mfNote: (k, d) => notes.push(Object.assign({ kind: k }, d)),
    };
    const keys = Object.keys(sandbox);
    const fn = new Function(...keys, poolFn + '; return prefetchFactionPool(' + JSON.stringify(faction) + ');');
    const ret = fn(...keys.map((k) => sandbox[k]));
    return { fxAsked, mfAsked, notes, ret };
  }
  const asu = drive('asuras');
  const asuraHeroes = E.DECKS.asuras.map((c) => c.id).filter((id) => ['mahabali', 'shukra', 'rahu', 'vritra', 'mahishi'].indexOf(id) >= 0);
  ok('EXPORT-8: the OPPONENT faction\'s routed HERO actors are enqueued at the device rung (' + asu.mfAsked.join(',') + ')',
     asuraHeroes.length > 0 && asuraHeroes.every((id) => asu.mfAsked.indexOf(id + '@256') >= 0), asu.mfAsked.join(','));
  ok('EXPORT-8: and that faction\'s routed CLIPS are enqueued too (Pashupatastra is the Asura clip)',
     asu.fxAsked.indexOf('pashupata') >= 0, asu.fxAsked.join(','));
  ok('EXPORT-8: a card of ANOTHER faction is never pulled in — the pool is exactly the seat\'s own printed pool',
     asu.mfAsked.indexOf('vasuki@256') < 0 && asu.mfAsked.indexOf('indra@256') < 0, asu.mfAsked.join(','));
  const nag = drive('nagas');
  ok('EXPORT-8: a routed card that declares a DRAIN clip enqueues the drain with it (Venom Strike\'s flood, EXPORT-6)',
     nag.fxAsked.indexOf('venomstrike') >= 0 && nag.fxAsked.indexOf('venomstrike:drain') >= 0, nag.fxAsked.join(','));
  const ready = {}; E.DECKS.asuras.forEach((c) => { ready[c.id] = true; });
  const again = drive('asuras', { ready });
  ok('EXPORT-8: nothing already in hand is refetched — a resync through the same start costs zero requests',
     again.mfAsked.length === 0 && again.fxAsked.length === 0, again.mfAsked.concat(again.fxAsked).join(','));
  ok('EXPORT-8: the rung follows the device law — a big-card layout asks for 512, a phone for 256',
     drive('asuras', { rung: 512 }).mfAsked.every((x) => /@512$/.test(x)) && asu.mfAsked.every((x) => /@256$/.test(x)));

  // ── MUTANT: the pre-EXPORT-8 frame (the call removed) asks for nothing of the caster's ──
  {
    const mutant = stakedHalf.replace(/try\s*\{\s*prefetchFactionPool\([^)]*\);\s*\}\s*catch\s*\(e\)\s*\{\}/, '');
    ok('EXPORT-8 MUTANT RED: strip the call and the staked start enqueues nothing for the opponent\'s faction — the STEP-0 fault, reproduced',
       mutant !== stakedHalf && !/prefetchFactionPool\(/.test(mutant));
  }
  // ── EXPORT-8 ruling 1a: the EARLIEST prefetch, on BOTH roads ──
  ok('EXPORT-8: the FREE road prefetches both hands\' routed cards the instant newGame has dealt — not when the board first renders',
     /newGame\(\{[\s\S]*?\}\);\s*(?:\/\/[^\n]*\n\s*)*try\s*\{\s*fxPrefetchHands\(\);\s*mfPrefetchHands\(\);\s*\}\s*catch/.test(startFn));
  ok('EXPORT-8: exactly ONE early call per road — the free seed branch prefetches hands, the staked view branch prefetches the faction pool',
     (startFn.match(/fxPrefetchHands\(\);\s*mfPrefetchHands\(\)/g) || []).length === 1 &&
     (startFn.match(/prefetchFactionPool\(/g) || []).length === 1);
  ok('EXPORT-8: hand-entry prefetch SURVIVES as the incremental path for later draws (render still calls it)',
     /try\{\s*fxPrefetchHands\(\);\s*\}catch\(e\)\{\}\s*try\{\s*mfPrefetchHands\(\);\s*\}catch\(e\)\{\}/.test(stripComments(extractFn(UI, 'render'))));

  // ── EXPORT-8 ruling 1b: the READY-ANCHORED START, driven for real ──
  // (async: the waiter is a real timer, so these run in the async tail below and the summary waits for them)
  ASYNC_TAIL.push(async () => {
    const waitFn = extractFn(UI, 'mfReadyWait');
    ok('EXPORT-8: mfReadyWait exists, and the window is the EXPORT-6 Vasuki-rise precedent through the same vfxT (1110 x 1.3 = 1443 ms Normal, x 0.78 = 866 ms Fast)',
       !!waitFn && /MF_READY_WINDOW_BASE\s*=\s*1110/.test(UI) && /MF_READY_WINDOW_BASE \* vfxT\(\)/.test(UI));
    // drive the REAL waiter: bytes that land INSIDE the window, and bytes that land after it
    function runWaiter(landAtMs, windowMs) {
      let ready = landAtMs === 0, polls = 0, settled = 0;   // 0 = already decoded BEFORE the cast (the warm case)
      const timer = ready ? null : setTimeout(() => { ready = true; }, landAtMs);
      const sandbox = {
        mfReady: () => { polls++; return ready; },
        mfPickRung: () => (ready ? 256 : null),
        performance: { now: () => Date.now() },
      };
      const keys = Object.keys(sandbox);
      const fn = new Function(...keys, waitFn + '; return mfReadyWait("x", 256, ' + windowMs + ');');
      return fn(...keys.map((k) => sandbox[k])).then((v) => { settled++; if (timer) clearTimeout(timer); return { v, polls, settled, pollsAtSettle: polls }; })
        .then((r) => new Promise((res) => setTimeout(() => res(Object.assign(r, { pollsAfter: polls })), 300)));
    }
    const inWin = await runWaiter(200, 900);
    ok('EXPORT-8: COLD remote cast — bytes landing INSIDE the window resolve the waiter true, so the actor runs (this is the measured race, and today\'s red)',
       inWin.v === true, JSON.stringify(inWin));
    ok('EXPORT-8: and the waiter STOPS polling once it has settled — it never fires twice and leaves no retry storm behind',
       inWin.pollsAfter === inWin.pollsAtSettle, 'polls at settle ' + inWin.pollsAtSettle + ' -> after ' + inWin.pollsAfter);
    const lateWin = await runWaiter(5000, 250);
    ok('EXPORT-8: bytes landing AFTER the window resolve FALSE — absent for a Hero, classic for an Astra, exactly as today; no throw',
       lateWin.v === false, JSON.stringify(lateWin));
    ok('EXPORT-8: and a late waiter also stops polling at the window — bounded, never an open-ended spin',
       lateWin.pollsAfter === lateWin.pollsAtSettle, 'polls at settle ' + lateWin.pollsAtSettle + ' -> after ' + lateWin.pollsAfter);
    const warm = await runWaiter(0, 900);
    ok('EXPORT-8: a WARM cast never waits — the waiter short-circuits before any timer, so a ready cast is byte-identical to today',
       warm.v === true && warm.pollsAtSettle === 0, JSON.stringify(warm));
    // the gate itself: REMOTE only, and today's note kept for local
    const mani = stripComments(extractFn(UI, 'mfManifest'));
    ok('EXPORT-8: the wait is for REMOTE casts ONLY — a local cast keeps today\'s immediate not-ready-at-play stand-down',
       /const remoteCast = \(typeof actionActorSeat!=='undefined' && actionActorSeat!=null && typeof ME!=='undefined' && actionActorSeat!==ME\)/.test(mani) &&
       /if\(remoteCast\)\{/.test(mani) && /not-ready-at-play/.test(mani) && /not-ready-in-window/.test(mani));
    ok('EXPORT-8: and an UNBOUND seat reads as local — a standalone evaluation (src/test_manifest.js sandboxes mfManifest) can never inherit the remote wait',
       /typeof actionActorSeat!=='undefined'/.test(mani) && /typeof ME!=='undefined'/.test(mani));
    ok('EXPORT-8: actionActorSeat is captured per action by runAction, so the gate knows remote from local',
       /actionActorSeat = \(opts && opts\.actor!=null\)/.test(stripComments(bodyOf('runAction'))));
  });
  // ── W1: the wire itself is untouched by any of this ──
  ok('EXPORT-8: W1 holds — no wire MESSAGE type, field or send path changed; decoration is downstream of runAction and adds 0 ms to the wire clock',
     !/wirePost\(|wireSend\(/.test(stripComments(extractFn(UI, 'mfManifest'))) &&
     !/wirePost\(|wireSend\(/.test(stripComments(extractFn(UI, 'prefetchFactionPool'))) &&
     !/wirePost\(|wireSend\(/.test(stripComments(extractFn(UI, 'mfReadyWait'))));

  // ── the beat gate on the receiving side (measured 4763ms for a 3-event slice; here the structural pin) ──
  ok('EXPORT-8: a staked view is applied THROUGH runAction, so a remote slice choreographs beat by beat (measured: a 3-event slice held the lock 4763ms — a real lead before impact, not one flat frame)',
     /runAction\(\s*\(\)\s*=>\s*\{\s*G\s*=\s*viewToState\(v, G\);\s*\}/.test(stripComments(extractFn(UI, 'applyView'))));
}

(async () => {
  for (const t of ASYNC_TAIL) { try { await t(); } catch (e) { fail++; console.log('  ✖ async check threw: ' + (e && e.message)); } }
  console.log('\n' + (fail === 0 ? '✓ ALL ' + pass + ' WIRE CHECKS PASS' : '✖ ' + fail + ' FAILURES / ' + pass + ' passed'));
  process.exit(fail === 0 ? 0 : 1);
})();
