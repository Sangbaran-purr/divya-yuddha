'use strict';
// GL-1 (GAME-LOG-1) — THE NARRATOR, PROVEN. Run: node src/test_narrator.js
//
//   1 · THE CORPUS    1,600 AI matches, all 16 faction pairings, every action narrated for BOTH seats: every one of the
//                     12 event types narrated by its own sentence, every event exactly one line, no undefined / null /
//                     stray token, grammar fixed, names resolved — and every "unseen card" genuinely hidden.
//   2 · NO RAW UID    every uid shifted by 7,000,000 in both the stream and the resolver: identical lines.
//   3 · PARITY        the same seeded match narrated from the solo engine's stream and from its staked stream (the REAL
//                     web3 publicEvents over a server run under real-looking seat names), both seats: identical lines.
//   4 · THE WALL      the staked lines speak only You / Opponent — no seat name, no address.
//   5 · THE LINE SET  R2's example, the forfeit both ways, the R4 resume, the R1 headers, purity, the grammar copy.
//   6 · UNTOUCHED     the engine, and the page's generated engine block, byte-for-byte (GL-2 wires the page itself).
// Skipped LOUDLY (a counted failure, never green-by-absence) where the web3 checkout is missing.
const fs = require('fs'), path = require('path'), cp = require('child_process');
const GAME = path.resolve(__dirname, '..');
const W3 = process.env.DY_WEB3 || path.resolve(GAME, '..', 'divya-yuddha-web3');
const N = require('./narrator.js');

let pass = 0, fail = 0;
const ok = (name, cond, detail) => { if (cond) { pass++; console.log('  ✓ ' + name); } else { fail++; console.log('  ✖ ' + name + (detail ? '\n      ' + detail : '')); } };

function fresh() { const p = require.resolve('./engine.js'); delete require.cache[p]; return require(p); }   // the uid counter is module-global
function seeded(s) { return function () { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; }; }
const FACS = ['devas', 'asuras', 'vanaras', 'nagas'];

// what a viewer can see: both boards, both hero rows, both discards, removed heroes, artifacts — and only its OWN hand
function publicMap(g, me) {
  const m = new Map();
  [0, 1].forEach(seat => {
    const pl = g.players[seat];
    const zones = [pl.units, pl.heroes, pl.discard, pl.removedHeroes || [], pl.artifact ? [pl.artifact] : []];
    if (seat === me) zones.push(pl.hand);
    zones.forEach(z => (z || []).forEach(c => { if (c && !c.ghost && c.uid != null) m.set(c.uid, { n: c.n, seat }); }));
  });
  return m;
}
function hiddenSet(g, me) {
  const s = new Set();
  [0, 1].forEach(seat => { const pl = g.players[seat]; (pl.deck || []).forEach(c => s.add(c.uid)); if (seat !== me) (pl.hand || []).forEach(c => s.add(c.uid)); });
  return s;
}
// one match, action by action: the records GL-2 will assemble, and each seat's resolver at that moment
function play(E, seedN, f0, f1, n0, n1, onAction) {
  const g = E.newGame({ rng: seeded(seedN), p0: n0, p1: n1, p0Faction: f0, p1Faction: f1 });
  let guard = 0;
  while (!g.over && guard++ < 900) {
    const actor = g.turn, s0 = g.events.length, rh0 = g.roundHistory.length, passedBefore = !!g.players[actor].passed, r0 = g.round;
    const pre = [publicMap(g, 0), publicMap(g, 1)], hidPre = [hiddenSet(g, 0), hiddenSet(g, 1)];
    E.aiTakeTurn(g, actor);
    const roundEnds = g.roundHistory.slice(rh0);
    // a pass that ENDS the round sets `passed` and endRound resets it inside the same action — the round-end is its proof
    const passed = !passedBefore && (!!g.players[actor].passed || roundEnds.length > 0);
    const events = g.events.slice(s0);
    const recs = N.assemble({ passes: passed ? [{ round: r0, seat: actor }] : [], events, roundEnds, result: g.over ? { round: g.round, winner: g.winner } : null });
    const post = [publicMap(g, 0), publicMap(g, 1)], hidPost = [hiddenSet(g, 0), hiddenSet(g, 1)];
    onAction({ g, recs, events, pre, post, hidPre, hidPost });
  }
  return g;
}
const resolver = (ctx, me) => uid => ctx.post[me].get(uid) || ctx.pre[me].get(uid) || null;
const BAD = /undefined|\bnull\b|NaN|\[object|\{p[01]\}/;
const THIRD_PERSON_YOU = /(^|⚔ )You (plays|passes|wins|WINS|takes|gains|loses|receives|suffers|is|lefts)\b/;
const sig = evs => evs.map(e => [e.round, e.type, e.sourceUid, e.targetUids.join(','), e.amount, e.abilityName].join('|')).join('~');

// ═══════════════════════════════ 1 · THE CORPUS ═══════════════════════════════
console.log('── 1 · THE CORPUS · 1,600 matches, all 16 pairings, narrated for both seats ──');
{
  const E = fresh();
  const perType = {}, ownLine = {}, pairings = new Set();
  let events = 0, lines = 0, fallbacks = 0, unseen = 0, batchBad = 0, sample = null;
  const notOne = [], bad = [], grammar = [], poss = [], unseenNotHidden = [], passBad = [], roundBad = [], resultBad = [], headerBad = [], mirrorBad = [];
  for (let i = 0; i < 1600; i++) {
    const f0 = FACS[i % 4], f1 = FACS[Math.floor(i / 4) % 4]; pairings.add(f0 + '-' + f1);
    const all = [[], []];
    const g = play(E, 7000 + i, f0, f1, 'You', 'Opponent', ctx => {
      for (const e of ctx.events) perType[e.type] = (perType[e.type] || 0) + 1;
      events += ctx.events.length;
      for (const me of [0, 1]) {
        const names = { me, players: ['You', 'Opponent'], card: resolver(ctx, me) };
        const per = [];
        for (const rec of ctx.recs) {
          const ls = N.narrate([rec], names);
          if (rec.type) {
            if (ls.length !== 1 || ls[0].kind !== rec.type) notOne.push(rec.type + ' → ' + ls.length);
            if (me === 0 && ls[0] && !ls[0].fallback) ownLine[rec.type] = (ownLine[rec.type] || 0) + 1;
          }
          for (const l of ls) {
            lines++;
            if (l.fallback) fallbacks++;
            if (BAD.test(l.text)) bad.push(l.text);
            if (THIRD_PERSON_YOU.test(l.text)) grammar.push(l.text);
            if (/You[’']s\b/.test(l.text)) poss.push(l.text);
            if (l.unseen) {
              unseen++;
              const uids = [rec.sourceUid].concat(rec.targetUids || []).filter(u => u != null && !names.card(u));
              if (!uids.length || !uids.every(u => ctx.hidPre[me].has(u) || ctx.hidPost[me].has(u))) unseenNotHidden.push(rec.type + ': ' + l.text + ' ' + JSON.stringify(uids));
            }
          }
          per.push(...ls);
        }
        if (JSON.stringify(N.narrate(ctx.recs, names)) !== JSON.stringify(per)) batchBad++;   // one-at-a-time == whole batch
        all[me].push(...per);
      }
    });
    const rounds = g.roundHistory.length;
    for (const me of [0, 1]) {
      const L = all[me];
      const passes = L.filter(l => l.kind === 'pass').length;
      if (passes !== 2 * rounds) passBad.push(`${f0}-${f1}#${i} seat${me}: ${passes} passes for ${rounds} rounds`);
      if (L.filter(l => l.kind === 'roundEnd').length !== 2 * rounds) roundBad.push(`${f0}-${f1}#${i} seat${me}`);
      if (L.filter(l => l.kind === 'result').length !== 1 || L[L.length - 1].kind !== 'result') resultBad.push(`${f0}-${f1}#${i} seat${me}`);
      const H = N.withRoundHeaders(L), hs = H.filter(l => l.kind === 'header').map(l => l.round);
      const distinct = [...new Set(L.map(l => l.round))];
      let under = true, cur = null;
      H.forEach(l => { if (l.kind === 'header') cur = l.round; else if (l.round !== cur) under = false; });
      if (hs.join() !== distinct.join() || hs.some((r, k) => k && r <= hs[k - 1]) || !under) headerBad.push(`${f0}-${f1}#${i} seat${me}`);
    }
    // the two seats narrate mirror images of the same match
    const pick = L => L.filter(l => l.kind === 'play' || l.kind === 'pass').map(l => l.text);
    const flip = s => s.startsWith('You play ') ? 'Opponent plays ' + s.slice(9) : s.startsWith('Opponent plays ') ? 'You play ' + s.slice(15)
                    : s === 'You pass.' ? 'Opponent passes.' : s === 'Opponent passes.' ? 'You pass.' : '?' + s;
    const p0 = pick(all[0]), p1 = pick(all[1]);
    if (p0.length !== p1.length || p0.some((t, k) => flip(t) !== p1[k])) mirrorBad.push(`${f0}-${f1}#${i}`);
    if (!sample && f0 === 'vanaras' && f1 === 'nagas') sample = all[0];
  }
  console.log('     matches 1,600 · pairings ' + pairings.size + ' · events ' + events.toLocaleString('en-US') + ' · lines narrated (both seats) ' + lines.toLocaleString('en-US'));
  console.log('     per type: ' + N.EVENT_TYPES.map(t => t + ' ' + (perType[t] || 0)).join(' · '));
  ok('all 16 faction pairings played', pairings.size === 16);
  ok('EVERY ONE of the 12 event types occurred AND was narrated by its own sentence', N.EVENT_TYPES.every(t => perType[t] > 0 && ownLine[t] === perType[t]),
     N.EVENT_TYPES.filter(t => !(perType[t] > 0 && ownLine[t] === perType[t])).join(', '));
  ok('no event type outside the 12 appeared, and the unknown-type fallback never fired', Object.keys(perType).every(t => N.EVENT_TYPES.includes(t)) && fallbacks === 0, 'fallbacks ' + fallbacks + ' types ' + Object.keys(perType));
  ok('every event became EXACTLY ONE line of its own kind — none dropped, none doubled', notOne.length === 0, notOne.slice(0, 3).join(' | '));
  ok('no line carries undefined / null / NaN / [object] / a stray {p0}{p1} token', bad.length === 0, bad.slice(0, 3).join(' | '));
  ok('grammar: no line reads "You plays / passes / wins …" (every text went through fixLogGrammar)', grammar.length === 0, grammar.slice(0, 3).join(' | '));
  ok('no "You’s" — the engine\'s possessive becomes "your"', poss.length === 0, poss.slice(0, 3).join(' | '));
  ok('names resolved: every "an unseen card" names a card genuinely HIDDEN from that viewer (a deck, or the other hand)', unseenNotHidden.length === 0,
     unseenNotHidden.length + ' not hidden: ' + unseenNotHidden.slice(0, 3).join(' | '));
  console.log('     "an unseen card" lines: ' + unseen);
  ok('a pass line for both passes of every round, both seats — including the round-ENDING pass', passBad.length === 0, passBad.slice(0, 3).join(' | '));
  ok('every round that ended narrated as its score line and its winner line', roundBad.length === 0, roundBad.slice(0, 3).join(' | '));
  ok('exactly one result line, and it is the last line', resultBad.length === 0, resultBad.slice(0, 3).join(' | '));
  ok('R1: "— Round N —" headers strictly increasing, one per round, every line under its own round', headerBad.length === 0, headerBad.slice(0, 3).join(' | '));
  ok('the two seats narrate MIRROR IMAGES of the same match (You play ⇔ Opponent plays, pass for pass)', mirrorBad.length === 0, mirrorBad.slice(0, 3).join(' | '));
  ok('one record at a time and the whole batch at once produce the same lines', batchBad === 0, batchBad + ' actions differ');
  global.__SAMPLE = sample;
}

// ═══════════════════════════════ 2 · NO RAW UID ═══════════════════════════════
console.log('\n── 2 · NO RAW UID · every uid shifted by 7,000,000 in stream and resolver ──');
{
  const E = fresh(); const SHIFT = 7000000; let actions = 0; const differ = [];
  for (let i = 0; i < 160; i++) {
    const f0 = FACS[i % 4], f1 = FACS[Math.floor(i / 4) % 4];
    play(E, 11000 + i, f0, f1, 'You', 'Opponent', ctx => {
      actions++;
      const moved = ctx.recs.map(r => Object.assign({}, r, r.sourceUid != null ? { sourceUid: r.sourceUid + SHIFT } : {}, r.targetUids ? { targetUids: r.targetUids.map(u => u + SHIFT) } : {}));
      for (const me of [0, 1]) {
        const card = resolver(ctx, me);
        const a = N.narrate(ctx.recs, { me, players: ['You', 'Opponent'], card }).map(l => l.text);
        const b = N.narrate(moved, { me, players: ['You', 'Opponent'], card: u => card(u - SHIFT) }).map(l => l.text);
        if (a.join('\n') !== b.join('\n')) differ.push(a.find((x, k) => x !== b[k]));
      }
    });
  }
  ok('no line changes when every uid changes — no uid ever reaches the text (' + actions.toLocaleString('en-US') + ' actions, both seats)', differ.length === 0, differ.slice(0, 2).join(' | '));
}

// ═══════════════════════ 3 · PARITY  +  4 · THE WALL ═══════════════════════
console.log('\n── 3 · PARITY · solo engine stream vs its staked stream (the real web3 publicEvents), both seats ──');
const RV = path.join(W3, 'services', 'match-server', 'src', 'redactedview.js');
let parityLine = 'NOT RUN';
if (!fs.existsSync(RV)) {
  fail++; console.log('  ✖ SKIPPED LOUDLY — the web3 checkout is not at ' + W3 + ' (set DY_WEB3). Parity and the wall are NOT proven.');
} else {
  const { publicEvents } = require(RV);
  const SEATS = ['0x70997970…79C8', 'Arjun_the_Bold'];   // what a server knows (a wallet short form, a chosen name); what a page must never say
  let matches = 0, structBad = 0, totalLines = 0, identical = 0;
  const lineBad = [], wallRecs = [], wallLines = [];
  for (let i = 0; i < 64; i++) {
    const f0 = FACS[i % 4], f1 = FACS[Math.floor(i / 4) % 4], seed = 9000 + i;
    const soloActs = [], servActs = [];
    play(fresh(), seed, f0, f1, 'You', 'Opponent', ctx => soloActs.push({ recs: ctx.recs, card: [resolver(ctx, 0), resolver(ctx, 1)], sig: sig(ctx.events) }));
    play(fresh(), seed, f0, f1, SEATS[0], SEATS[1], ctx => {
      const pub = publicEvents(ctx.g, ctx.events);
      servActs.push({
        recs: N.assemble({ passes: ctx.recs.filter(r => r.kind === 'pass'), events: pub, roundEnds: ctx.recs.filter(r => r.kind === 'roundEnd'), result: ctx.recs.find(r => r.kind === 'result') || null }),
        pub, card: [resolver(ctx, 0), resolver(ctx, 1)], sig: sig(ctx.events)
      });
    });
    matches++;
    if (soloActs.length !== servActs.length || soloActs.some((a, k) => a.sig !== servActs[k].sig)) { structBad++; continue; }
    for (const me of [0, 1]) {
      const solo = [], staked = [];
      soloActs.forEach(a => solo.push(...N.narrate(a.recs, { me, players: ['You', 'Opponent'], card: a.card[me] })));
      servActs.forEach(a => staked.push(...N.narrate(a.recs, { me, players: null, card: a.card[me] })));
      totalLines += staked.length;
      if (JSON.stringify(solo) === JSON.stringify(staked)) identical++;
      else { const k = solo.findIndex((l, j) => JSON.stringify(l) !== JSON.stringify(staked[j])); lineBad.push(`${f0}-${f1} seat${me} line ${k}: "${solo[k] && solo[k].text}" vs "${staked[k] && staked[k].text}"`); }
      staked.forEach(l => { if (SEATS.some(s => l.text.includes(s)) || /0x[0-9a-fA-F]{4}|Arjun|\{p[01]\}/.test(l.text)) wallLines.push(l.text); });
    }
    servActs.forEach(a => a.pub.forEach(e => { if (SEATS.some(s => String(e.text).includes(s))) wallRecs.push(e.text); }));
  }
  parityLine = identical + ' of ' + (2 * matches) + ' seat-narrations identical, ' + totalLines.toLocaleString('en-US') + ' staked lines';
  ok('precondition: the two runs are the same match (names never touch the game) — ' + matches + ' seeded matches, all 16 pairings', structBad === 0, structBad + ' diverged');
  ok('PARITY: every line identical — text, kind, side, round — solo stream vs staked stream, BOTH seats (' + parityLine + ')', lineBad.length === 0, lineBad.slice(0, 2).join(' | '));
  console.log('\n── 4 · THE WALL ──');
  ok('the staked stream the narrator is handed carries no seat name (publicEvents did its job)', wallRecs.length === 0, wallRecs.slice(0, 2).join(' | '));
  ok('THE WALL: the staked lines speak only You / Opponent — no seat name, no 0x address, no {p} token', wallLines.length === 0, wallLines.slice(0, 2).join(' | '));
  ok('THE WALL: the narrator is never handed a seat name on the staked road (names.players is null)', true);
}

// ═══════════════════════════════ 5 · THE LINE SET ═══════════════════════════════
console.log('\n── 5 · THE LINE SET ──');
{
  const card = u => ({ 1: { n: 'Gandiva Arrow', seat: 0 }, 2: { n: 'Karkotaka', seat: 1 } })[u] || null;
  const recs = [
    { round: 1, seq: 7, type: 'play', sourceUid: 1, targetUids: [], amount: null, abilityName: 'Gandiva Arrow', text: 'You plays Gandiva Arrow' },
    { round: 1, seq: 8, type: 'destroy', sourceUid: null, targetUids: [2], amount: null, abilityName: 'Gandiva', text: 'Karkotaka destroyed' },
  ];
  const l = N.narrate(recs, { me: 0, players: ['You', 'Opponent'], card }).map(x => x.text);
  ok('R2 — the owner\'s example, the owner named: "You play Gandiva Arrow." / "Opponent’s Karkotaka is destroyed (Gandiva)."',
     l[0] === 'You play Gandiva Arrow.' && l[1] === 'Opponent’s Karkotaka is destroyed (Gandiva).', JSON.stringify(l));
  const u = N.narrate([recs[1]], { me: 0, players: ['You', 'Opponent'], card: () => null }).map(x => x.text);
  ok('R2 — when the viewer cannot tell whose it is, R2\'s exact shape: "Karkotaka is destroyed (Gandiva)."', u[0] === 'Karkotaka is destroyed (Gandiva).', JSON.stringify(u));
  ok('R2 — the word "attack" appears in no line the narrator can write', !/attack/i.test(fs.readFileSync(path.join(__dirname, 'narrator.js'), 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '')));

  const fw = N.narrate(N.assemble({ forfeit: { round: 2, winner: 0 } }), { me: 0 }).map(x => x.text);
  const fl = N.narrate(N.assemble({ forfeit: { round: 2, winner: 0 } }), { me: 1 }).map(x => x.text);
  ok('forfeit, the winner\'s seat: "Your opponent left the table." — word for word', fw.length === 1 && fw[0] === 'Your opponent left the table.' && N.FORFEIT_WON === fw[0], JSON.stringify(fw));
  ok('forfeit, the leaver\'s seat: "You left the table."', fl.length === 1 && fl[0] === 'You left the table.', JSON.stringify(fl));

  const gap = '… the match resumed here …';
  const R = [{ round: 1, kind: 'play', side: 'me', text: 'You play Bali.' }];
  ok('R4 — the gap line is exactly "… the match resumed here …"', N.GAP_TEXT === gap);
  ok('R4 — storage empty on resume → the gap line alone', JSON.stringify(N.resume([], { round: 2 }).map(x => x.text)) === JSON.stringify([gap]) && N.resume(null)[0].kind === 'gap');
  ok('R4 — restored AND proven continuous → the restored lines exactly, no gap', JSON.stringify(N.resume(R, { continuous: true })) === JSON.stringify(R));
  ok('R4 — restored but continuity NOT proven → the restored lines THEN the gap: never a silent hole', (() => { const x = N.resume(R, { round: 2 }); return x.length === 2 && x[0].text === 'You play Bali.' && x[1].text === gap; })());

  const H = N.withRoundHeaders([{ round: 1, kind: 'pass', text: 'You pass.' }, { round: null, kind: 'gap', text: gap }, { round: 2, kind: 'pass', text: 'Opponent passes.' }]).map(x => x.text);
  ok('R1 — headers are "— Round N —" exactly, and the gap line takes no header of its own', JSON.stringify(H) === JSON.stringify(['— Round 1 —', 'You pass.', gap, '— Round 2 —', 'Opponent passes.']), JSON.stringify(H));

  const re = N.narrate([{ kind: 'roundEnd', round: 1, t0: 21, t1: 11, winner: 0 }, { kind: 'roundEnd', round: 2, t0: 9, t1: 9, winner: null }], { me: 1 }).map(x => x.text);
  ok('round ends read from the viewer\'s side, a draw named as one', JSON.stringify(re) === JSON.stringify(['Round 1 ends — You 11 vs Opponent 21.', 'Opponent wins Round 1.', 'Round 2 ends — You 9 vs Opponent 9.', 'Round 2 is a draw.']), JSON.stringify(re));
  const rs = N.narrate([{ kind: 'result', round: 3, winner: 1 }, { kind: 'result', round: 3, winner: null }], { me: 1 }).map(x => x.text);
  ok('the result through fixLogGrammar ("⚔ You WIN THE MATCH"), and a stalemate', rs[0] === '⚔ You WIN THE MATCH' && rs[1] === 'The match is a stalemate.', JSON.stringify(rs));

  const deepFreeze = o => { Object.values(o).forEach(v => { if (v && typeof v === 'object') deepFreeze(v); }); return Object.freeze(o); };
  const frozen = deepFreeze(JSON.parse(JSON.stringify(recs)));
  let pure = true; try { pure = JSON.stringify(N.narrate(frozen, { me: 0, card })) === JSON.stringify(N.narrate(frozen, { me: 0, card })); } catch (e) { pure = false; }
  ok('PURE — frozen input, two runs, no throw, no mutation, the same lines', pure);

  const grab = (src, head) => { const L = src.split('\n'), i = L.findIndex(x => x.startsWith(head)), j = L.findIndex((x, k) => k > i && x === '}'); return i < 0 ? '' : L.slice(i, j + 1).join('\n'); };
  const html = fs.readFileSync(path.join(GAME, 'index.html'), 'utf8'), nar = fs.readFileSync(path.join(__dirname, 'narrator.js'), 'utf8');
  ok('fixLogGrammar + _baseVerb in narrator.js are BYTE-IDENTICAL to index.html\'s', ['function _baseVerb(v){', 'function fixLogGrammar(msg){'].every(h => grab(html, h).length > 40 && grab(html, h) === grab(nar, h)));
}

// ═══════════════════════════════ 6 · UNTOUCHED ═══════════════════════════════
console.log('\n── 6 · UNTOUCHED ──');
{
  let clean = false; try { cp.execFileSync('git', ['diff', '--quiet', 'HEAD', '--', 'src/engine.js'], { cwd: GAME }); clean = true; } catch (e) { clean = false; }
  const block = (h) => { const a = h.indexOf('<!-- ENGINE:START'), b = h.indexOf('<!-- ENGINE:END -->'); return a >= 0 && b > a ? h.slice(a, b) : null; };
  let headBlock = null; try { headBlock = block(cp.execFileSync('git', ['show', 'HEAD:index.html'], { cwd: GAME, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })); } catch (e) { headBlock = null; }
  const pageBlock = block(fs.readFileSync(path.join(GAME, 'index.html'), 'utf8'));
  ok('ENGINE SACRED: src/engine.js and index.html\'s ENGINE block are byte-identical to HEAD (0 lines)', clean && headBlock !== null && headBlock === pageBlock);
}

if (global.__SAMPLE) {
  console.log('\n── a sample (informational): a Vanara-vs-Naga match, seat 0, the first 30 lines under their headers ──');
  N.withRoundHeaders(global.__SAMPLE).slice(0, 30).forEach(l => console.log('     ' + (l.kind === 'header' ? '' : '  ') + l.text));
}
console.log('\nPARITY: ' + parityLine);
console.log('\n' + (fail === 0 ? '✓ ALL ' + pass + ' NARRATOR CHECKS PASS' : '✖ ' + fail + ' FAILURES / ' + pass + ' passed'));
process.exit(fail === 0 ? 0 : 1);
