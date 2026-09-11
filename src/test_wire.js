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
  // BW3b — THE QUERY FACADE: every one of the screen's engine questions goes through Q (29 sites); a bare call survives
  //   only inside the facade itself, by name. Count code, never prose.
  const fStart = code.indexOf('const Q = {'), fEnd = code.indexOf('};', fStart) + 2;
  const outside = code.slice(0, fStart) + code.slice(fEnd);
  const bare = outside.match(/(?<![\w.])(effPower|totalPower|isShielded|playableIndices|targetSpec|canLeap|adjacentUnits|shieldCap)\(/g) || [];
  const viaQ = (outside.match(/\bQ\.(effPower|totalPower|isShielded|playableIndices|targetSpec|canLeap|adjacentUnits|shieldCap)\(/g) || []).length;
  ok('BW3b facade: 0 bare engine queries outside Q (' + bare.length + '), the 29 sites routed through Q (' + viaQ + ')', fStart > 0 && bare.length === 0 && viaQ === 29, bare.join(' '));
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

console.log('\n' + (fail === 0 ? '✓ ALL ' + pass + ' WIRE CHECKS PASS' : '✖ ' + fail + ' FAILURES / ' + pass + ' passed'));
process.exit(fail === 0 ? 0 : 1);
