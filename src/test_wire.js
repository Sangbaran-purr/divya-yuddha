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

console.log('\n' + (fail === 0 ? '✓ ALL ' + pass + ' WIRE CHECKS PASS' : '✖ ' + fail + ' FAILURES / ' + pass + ' passed'));
process.exit(fail === 0 ? 0 : 1);
