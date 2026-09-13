#!/usr/bin/env node
'use strict';
// VFX-LAB — the lab's own proofs.   node lab/vfx-manifestation/test/run.js
//
//   F · THE FIXTURE     what the real engine does today: events in engine order, the Hero's −2 in the board difference only
//   C · THE CONTEXT     honest fields only; the board difference split into what the batch's events carry and what they don't
//   T · THE DIRECTOR    the timed plan: both seats, every mode, the repeat rule, the ladder, SETTLE, the queue, determinism
//   U · THE RUNNER      cues in order, skip, a single-phase replay, fast-forward — cleanup exactly once on every road
//   M · THE MANIFEST    the actor asset class (A4), and everything it must refuse — for the real Meghnad actor from the Kling clip
//   K · THE SOURCES     A7: no clip and no raw frame is ever tracked; sources/ frames/ and the matting venv stay ignored
//   S · THE STAGE       layer order, anchoring on both seats (never onto the enemy cards — A1), facing, cleanup after skip,
//                       numbers only at SETTLE, normal blending, the performance readout
//   R · THE RUNTIME     the lab's VFX module is the game's byte-for-byte; its injected names; it runs on them alone; the subset
//   P · THE PAGE        the structure and every control; nothing loaded from the live game
//   G · THE RULE        no tracked change outside lab/ since the lab began (the ruling doc, A8, excepted); nothing outside
//                       lab/ references it; the site's sync never archives it; Kling sources and frames are ignored
//   D · THE RULING      the doc carries A1–A8
// The game's own suites are not run here; they run beside this on every lab commit.
const fs = require('fs'), path = require('path'), crypto = require('crypto'), cp = require('child_process');
const LAB = path.resolve(__dirname, '..'), GAME = path.resolve(LAB, '..', '..');
const WEB = process.env.DY_WEB || path.resolve(GAME, '..', 'divya-yuddha-web');
const LAB_BASE = 'e2f4c19';   // GL-3 — the game commit the lab began from
const DOC = 'docs/VFX_MANIFESTATION_v1.md';
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  ✓ ' + n); } else { fail++; console.log('  ✖ ' + n + (d ? '\n      ' + d : '')); } };
const J = (x) => JSON.stringify(x);
const sha256 = (b) => crypto.createHash('sha256').update(b).digest('hex');
const rel = (p) => path.relative(GAME, p);
const git = (args) => cp.execFileSync('git', args, { cwd: GAME, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const lib = (n) => require(path.join(LAB, 'lib', n + '.js'));
const CC = lib('clashcontext'), DIR = lib('director'), RUN = lib('runner'), MAN = lib('manifest'), SM = lib('stagemath');
const FX = [0, 1].map((s) => JSON.parse(fs.readFileSync(path.join(LAB, 'fixtures', 'meghnad_seat' + s + '.json'), 'utf8')));
const REG = JSON.parse(fs.readFileSync(path.join(LAB, 'data', 'manifestations.json'), 'utf8')).cards;
const MANIFEST = JSON.parse(fs.readFileSync(path.join(LAB, 'actors', 'meghnad', 'manifest.json'), 'utf8'));
let JSDOM = null; try { ({ JSDOM } = require(require.resolve('jsdom', { paths: [path.join(WEB, 'tests')] }))); } catch (e) { JSDOM = null; }

// ═══ F · THE FIXTURE ═══
console.log('── F · the fixture: the real engine, both seats ──');
{
  const { build } = require(path.join(LAB, 'fixtures', 'make_fixture.js'));
  const liveEngineSha = sha256(fs.readFileSync(path.join(GAME, 'src', 'engine.js')));
  for (const seat of [0, 1]) {
    const fresh = build(seat);
    ok('F' + (seat + 1) + ' · the seat-' + seat + ' fixture is what a fresh engine run produces today (every field), on the engine it names (sha ' + liveEngineSha.slice(0, 12) + '…)',
       J(FX[seat]) === J(fresh) && FX[seat].engine.sha256 === liveEngineSha, 'differs from a fresh run');
  }
  const shape = (f) => f.events.map((e) => [e.type, e.abilityName || null, e.text || null, e.amount == null ? null : e.amount]);
  ok('F3 · the events, in engine order, both seats: play Meghnad → toast "Chaos finds a way…" → buff +1 (Chaos Surge) on Meghnad',
     FX.every((f) => { const m = f.diff.entered.find((c) => c.id === 'meghnad');
       return !!m && J(shape(f)) === J([['play', 'Meghnad', '{p' + f.attackerSeat + '} plays Meghnad', null], ['toast', 'Chaos Surge', 'Chaos finds a way…', null], ['buff', 'Chaos Surge', '+1', 1]]) && f.events[0].sourceUid === m.uid && J(f.events[2].targetUids) === J([m.uid]); }), J(FX.map(shape)));
  ok('F4 · the strike is in NO event: no event sources or targets the Hero; only the engine\'s log carries "Meghnad’s bolt strikes Indra for 2 → 5."',
     FX.every((f) => { const indra = f.before.seats[f.defenderSeat].heroes.find((c) => c.id === 'indra');
       return !!indra && f.events.every((e) => e.sourceUid !== indra.uid && !(e.targetUids || []).includes(indra.uid) && !/Indra/.test(e.text || '')) && f.log.includes('Meghnad’s bolt strikes Indra for 2 → 5.'); }));
  ok('F5 · the board difference, both seats: ONE changed card — the defender\'s Indra 7 → 5 (−2); Meghnad entered at 7; nothing left',
     FX.every((f) => { const d = f.diff, c = d.changed[0], e = d.entered[0];
       return d.changed.length === 1 && c.id === 'indra' && c.seat === f.defenderSeat && J(c.eff) === J({ from: 7, to: 5, delta: -2 }) && d.entered.length === 1 && e.id === 'meghnad' && e.seat === f.attackerSeat && e.eff === 7 && d.left.length === 0; }));
}

// ═══ C · THE CONTEXT ═══
console.log('\n── C · the ClashContext adapter ──');
const CTX = FX.map((f) => CC.fromBatch(f));
{
  ok('C1 · honest fields only, both seats: sourceUid, cardId, cardName, cardType, rarity, faction, seat, scope, boardDiff, rest — no "action", no "lethal", no "shielded"',
     CTX.every((c, s) => J(Object.keys(c).sort()) === J(['boardDiff', 'cardId', 'cardName', 'cardType', 'faction', 'rarity', 'rest', 'scope', 'seat', 'sourceUid']) &&
       c.cardId === 'meghnad' && c.cardType === 'unit' && c.rarity === 'R' && c.faction === 'asuras' && c.seat === FX[s].attackerSeat && c.scope === 'manifest' && c.sourceUid === FX[s].events[0].sourceUid &&
       !/"(action|lethal|shielded)"/.test(J(c))));
  ok('C2 · the board difference, split: Meghnad ENTERS at 7 = 6 un-evented (lands at SETTLE) + 1 evented (the Chaos Surge buff); Indra POWER 7 → 5, −2 un-evented, 0 evented; nothing else',
     CTX.every((c) => { const byKind = (k) => c.boardDiff.filter((e) => e.kind === k);
       const en = byKind('enter'), pw = byKind('power');
       return c.boardDiff.length === 2 && en.length === 1 && en[0].id === 'meghnad' && en[0].to === 7 && en[0].evented === 1 && en[0].settleTo === 6 &&
              pw.length === 1 && pw[0].id === 'indra' && pw[0].from === 7 && pw[0].to === 5 && pw[0].delta === -2 && pw[0].evented === 0 && pw[0].settleDelta === -2; }), J(CTX.map((c) => c.boardDiff)));
  ok('C3 · the rest of the batch is kept, in engine order, for the queue: toast then buff (the play itself is the manifestation)',
     CTX.every((c) => J(c.rest.map((e) => e.type)) === J(['toast', 'buff'])));
  const eff = (board, id) => { for (const st of board.seats) for (const z of ['heroes', 'units']) for (const c of st[z]) if (c.id === id) return c.eff; return null; };
  const inHand = (board, uid) => board.seats.some((st) => st.hand.some((c) => c.uid === uid));
  ok('C4 · the three boards, both seats: ENTRY Indra 7 · Meghnad 6 (out of the hand, on the board); SETTLE Indra 5 · Meghnad 6; SETTLE + the queued events = FINAL = the engine\'s AFTER',
     FX.every((f, s) => { const b = CC.boards(CTX[s], f.before, f.after), w = JSON.parse(J(b.settle));
       CTX[s].rest.forEach((e) => CC.applyEvent(w, e));
       return eff(b.entry, 'indra') === 7 && eff(b.entry, 'meghnad') === 6 && !inHand(b.entry, CTX[s].sourceUid) && eff(b.settle, 'indra') === 5 && eff(b.settle, 'meghnad') === 6 &&
              J(CC.project(w)) === J(CC.project(f.after)) && J(b.final) === J(f.after); }));
  const astra = JSON.parse(J(FX[0])); const au = astra.events[0].sourceUid;
  astra.after.seats[0].units = astra.after.seats[0].units.filter((c) => c.uid !== au); astra.before.seats[0].hand.forEach((c) => { if (c.uid === au) { c.t = 'astra'; c.id = 'vajra'; c.n = 'Vajra'; } });
  const actx = CC.fromBatch(astra);
  ok('C5 · A2 scope: an Astra play is out of scope (scope "out") — it keeps its existing effect; only Heroes and Units manifest', !!actx && actx.scope === 'out' && actx.cardType === 'astra');
  global.__astraCtx = actx;
}

// ═══ T · THE DIRECTOR ═══
console.log('\n── T · the Director ──');
{
  const exempt = { ladderExempt: !!REG.meghnad.ladderExempt };
  const P = (seat, mode, prior) => DIR.plan(CTX[seat], Object.assign({ mode, prior: prior || 0 }, exempt));
  const bounds = (p) => p.phases.map((x) => [x.name, x.t0, x.t1]);
  ok('T1 · FULL without native timing, both seats (the grammar table): the pilot is ladder-exempt (A3) — AWAKEN 0–400 · EMERGE 400–1000 · ACT 1000–2200 · FIZZLE 2200–2800 · SETTLE 2800–3200, one actor, acting toward the other seat',
     [0, 1].every((s) => { const p = P(s, 'full');
       return p.total === 3200 && p.actor && p.mode === 'full' && p.towardSeat === 1 - s && p.ladder === 'exempt (A3 pilot)' &&
              J(bounds(p)) === J([['AWAKEN', 0, 400], ['EMERGE', 400, 1000], ['ACT', 1000, 2200], ['FIZZLE', 2200, 2800], ['SETTLE', 2800, 3200]]); }));
  ok('T2 · FAST, both seats: the same grammar in half the time (1600 ms), contact at 58% of ACT, hit-stop 50 ms',
     [0, 1].every((s) => { const p = P(s, 'fast'), act = p.phases[2], c = p.cues.find((x) => x.cue === 'contact');
       return p.total === 1600 && p.actor && J(p.phases.map((x) => x.name)) === J(['AWAKEN', 'EMERGE', 'ACT', 'FIZZLE', 'SETTLE']) && c.t === act.t0 + Math.round((act.t1 - act.t0) * 0.58) && c.hitstopMs === 50; }));
  const visual = ['portal-open', 'actor-phase', 'contact', 'exit-fx', 'actor-gone'];
  ok('T3 · REDUCED, both seats: no actor phase and no actor cue — a card pulse, then SETTLE (600 ms)',
     [0, 1].every((s) => { const p = P(s, 'reduced');
       return !p.actor && p.total === 600 && J(p.phases.map((x) => x.name)) === J(['PULSE', 'SETTLE']) && p.cues.every((c) => visual.indexOf(c.cue) < 0) && p.cues.some((c) => c.cue === 'card-pulse'); }));
  ok('T4 · THE REPEAT RULE: the 2nd+ manifestation of a card in a match plays Fast (asked Full → Fast; asked Fast → Fast; Reduced stays Reduced); the 1st plays as asked',
     [0, 1].every((s) => P(s, 'full', 0).mode === 'full' && !P(s, 'full', 0).repeat && P(s, 'full', 1).mode === 'fast' && P(s, 'full', 1).repeat && P(s, 'full', 3).mode === 'fast' && P(s, 'fast', 2).mode === 'fast' && P(s, 'reduced', 2).mode === 'reduced') &&
     (() => { const m = DIR.createMemory(); const a = DIR.plan(CTX[0], { mode: 'full', prior: m.count('meghnad'), ladderExempt: true }); m.record('meghnad');
       const b = DIR.plan(CTX[0], { mode: 'full', prior: m.count('meghnad'), ladderExempt: true }); m.reset(); const c = DIR.plan(CTX[0], { mode: 'full', prior: m.count('meghnad'), ladderExempt: true });
       return a.mode === 'full' && b.mode === 'fast' && c.mode === 'full'; })());
  ok('T5 · DETERMINISM: the same context and options give the same plan, every field, every time (all modes, both seats)',
     [0, 1].every((s) => ['full', 'fast', 'reduced'].every((m) => J(P(s, m)) === J(P(s, m)) && J(DIR.plan(CC.fromBatch(FX[s]), Object.assign({ mode: m }, exempt))) === J(P(s, m)))));
  ok('T6 · SETTLE carries the numbers — exactly Indra −2 (7 → 5) and Meghnad entering at 6 — and NO cue before SETTLE carries a number (all modes, both seats)',
     [0, 1].every((s) => ['full', 'fast', 'reduced'].every((m) => {
       const p = P(s, m), S = p.phases.find((x) => x.name === 'SETTLE'), st = p.cues.filter((c) => c.cue === 'settle');
       const indra = FX[s].before.seats[FX[s].defenderSeat].heroes[0].uid;
       return st.length === 1 && st[0].t === S.t0 && J(st[0].floats) === J([{ uid: indra, delta: -2 }]) &&
              J(st[0].changes.map((c) => [c.kind, c.n, c.to])) === J([['enter', 'Meghnad', 6], ['power', 'Indra', 5]]) &&
              p.cues.filter((c) => c.t < S.t0).every((c) => !c.floats && c.cue !== 'queue');
     })));
  ok('T7 · THE QUEUE: the rest of the batch plays AFTER SETTLE, in engine order (toast, then the +1 buff), then "done" last — never swallowed (all modes, both seats)',
     [0, 1].every((s) => ['full', 'fast', 'reduced'].every((m) => {
       const p = P(s, m), q = p.cues.filter((c) => c.cue === 'queue'), last = p.cues[p.cues.length - 1];
       return q.length === 2 && q[0].event.type === 'toast' && q[1].event.type === 'buff' && q[1].event.amount === 1 && q[0].t >= p.total && q[1].t > q[0].t && last.cue === 'done' && last.t === p.end && p.end > q[1].t;
     })));
  const syn = (r) => Object.assign({}, CTX[0], { rarity: r });
  ok('T8 · THE LADDER for every card that is not exempt: Common 1.8 s · Uncommon/Rare 2.5 s · Epic/Legendary 3.5 s · Mythic 4.5 s (Fast halves them); the pilot alone is exempt at 3.2 s',
     J(['C', 'U', 'R', 'E', 'L', 'M'].map((r) => DIR.plan(syn(r), { mode: 'full' }).total)) === J([1800, 2500, 2500, 3500, 3500, 4500]) && DIR.plan(syn('M'), { mode: 'fast' }).total === 2250 &&
     DIR.plan(syn('C'), { mode: 'full', ladderExempt: true }).total === 3200 && Object.keys(REG).filter((k) => REG[k].ladderExempt).join() === 'meghnad');
  const ap = DIR.plan(global.__astraCtx, { mode: 'full' });
  ok('T9 · A2: an out-of-scope play gets no actor — SETTLE and the queue only', !ap.actor && J(ap.phases.map((x) => x.name)) === J(['SETTLE']) && ap.cues.every((c) => visual.indexOf(c.cue) < 0));
  {
    const NT = { fps: MANIFEST.fps, emerge: MANIFEST.phases.emerge.length, act: MANIFEST.phases.act.length, contact: MANIFEST.contact };
    const ms = (n, k) => Math.round(n * 1000 / NT.fps * k);
    const nat = (s, m) => DIR.plan(CTX[s], { mode: m, ladderExempt: true, timing: NT });
    const okNative = [0, 1].every((s) => ['full', 'fast'].every((m) => {
      const k = m === 'fast' ? 0.5 : 1, p = nat(s, m), [A, E, C, Z, S] = p.phases, c = p.cues.find((x) => x.cue === 'contact'), a = p.cues.find((x) => x.cue === 'actor-phase' && x.phase === 'act');
      return p.timing === 'native' && A.t1 - A.t0 === 400 * k && E.t1 - E.t0 === ms(NT.emerge, k) && C.t1 - C.t0 === ms(NT.act, k) && Z.t1 - Z.t0 === 600 * k && S.t1 - S.t0 === 400 * k &&
             c.t === C.t0 + Math.round((C.t1 - C.t0) * NT.contact / NT.act) && Math.abs(a.contactFrac - NT.contact / NT.act) < 1e-9 && p.total === S.t1;
    }));
    const notExempt = DIR.plan(CTX[0], { mode: 'full', ladderExempt: false, timing: NT });
    const full = nat(0, 'full');
    ok('T11 · NATIVE TIMING from the real manifest (' + NT.emerge + ' EMERGE + ' + NT.act + ' ACT cells @ ' + NT.fps + ' fps, contact = ACT cell ' + NT.contact + '): EMERGE ' + (full.phases[1].t1 - full.phases[1].t0) + ' ms · ACT ' + (full.phases[2].t1 - full.phases[2].t0) + ' ms · contact on the contact cell · total ' + full.total + ' ms; Fast halves it; both seats; a card NOT ladder-exempt ignores native timing (the ladder applies)',
       okNative && notExempt.timing === 'grammar' && notExempt.total === 2500 && Math.abs(full.total - 3200) <= 60);
  }
  const txt = DIR.formatPlan(P(0, 'full'));
  ok('T10 · the Plan readout is the timeline as text: the header, every phase, every cue in time order with its numbers', /Meghnad · seat 0 → toward seat 1 · mode full/.test(txt) && /AWAKEN 0–400/.test(txt) && /2800 ms  settle Meghnad enters at 6, Indra 7→5 \(−2\)/.test(txt) && /queue buff · Chaos Surge \+1/.test(txt) && txt.split('\n').length === P(0, 'full').cues.length + 2, txt.split('\n').slice(0, 4).join(' | '));
}

// ═══ U · THE RUNNER ═══
console.log('\n── U · the Runner ──');
{
  const plan = DIR.plan(CTX[0], { mode: 'full', ladderExempt: true });
  const drive = (startOpts, until, onT) => {
    let t = 0, cleanups = 0; const seen = [];
    const r = RUN.create(plan, { cue: (c, i) => seen.push([c.cue, c.t, i.skipped, t]), cleanup: () => { cleanups++; } }, () => t);
    r.start(startOpts);
    while (!r.done && t < 20000) { t += 16; r.tick(); if (onT && onT(t, r)) break; }
    return { r, seen, cleanups: () => cleanups };
  };
  const a = drive({});
  ok('U1 · a full run dispatches every cue exactly once, in plan order, never early, then cleans up exactly once', a.r.done && a.cleanups() === 1 && J(a.seen.map((x) => x[0])) === J(plan.cues.map((c) => c.cue)) && a.seen.every((x) => x[3] >= x[1] && !x[2]));
  const b = drive({}, null, (t, r) => { if (t >= 1300) { r.skip(); return true; } });
  const after = b.seen.filter((x) => x[3] >= 1300);
  ok('U2 · SKIP mid-ACT applies every remaining STATE cue at once, in order (actor-gone → settle → queue → queue → done), plays no further visual, and cleans up exactly once',
     b.r.done && b.cleanups() === 1 && J(after.map((x) => x[0])) === J(['actor-gone', 'settle', 'queue', 'queue', 'done']) && after.every((x) => x[2] === true));
  const act = plan.phases.find((p) => p.name === 'ACT');
  const c = drive({ from: act.t0, to: act.t1 });
  ok('U3 · a single-phase replay (ACT): earlier STATE cues applied instantly, only ACT\'s cues played, it stops at ACT\'s end and cleans up once — no settle, no queue',
     c.r.done && c.cleanups() === 1 && c.seen[0][0] === 'board-entry' && c.seen[0][2] === true && c.seen.filter((x) => !x[2]).every((x) => x[1] >= act.t0 && x[1] <= act.t1) &&
     J(c.seen.filter((x) => !x[2]).map((x) => x[0])) === J(['actor-phase', 'contact']) && !c.seen.some((x) => x[0] === 'settle' || x[0] === 'queue'));
  let t = 0; const ff = RUN.create(plan, { cue: () => {}, cleanup: () => {} }, () => t); ff.start(); ff.fastForward(3);
  while (!ff.done && t < 20000) { t += 16; ff.tick(); }
  ok('U4 · FAST-FORWARD 3× ends the whole batch in about a third of its time (' + t + ' ms of clock for ' + plan.end + ' ms of plan)', ff.done && t <= Math.ceil(plan.end / 3) + 32);
}

// ═══ M · THE MANIFEST ═══
console.log('\n── M · the actor manifest (A4) ──');
function webpSize(buf) {
  if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WEBP') return null;
  const kind = buf.toString('ascii', 12, 16);
  if (kind === 'VP8X') return { w: 1 + buf.readUIntLE(24, 3), h: 1 + buf.readUIntLE(27, 3) };
  if (kind === 'VP8L') { const b = buf.readUInt32LE(21); return { w: 1 + (b & 0x3fff), h: 1 + ((b >> 14) & 0x3fff) }; }
  if (kind === 'VP8 ') return { w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff };
  return null;
}
{
  const v = MAN.validate(MANIFEST), atlas = fs.readFileSync(path.join(LAB, 'actors', 'meghnad', MANIFEST.atlas)), px = webpSize(atlas);
  const wide = MANIFEST.cells.filter((c) => c.w > c.h).length, one = (k) => MANIFEST.cells.every((c) => c[k] === MANIFEST.cells[0][k]);
  const pivSrc = MANIFEST.audit && MANIFEST.audit.pivotSrc, scale = MANIFEST.audit && MANIFEST.audit.scale;
  ok('M1 · the Meghnad manifest is a valid ACTOR asset: straight alpha, normal blend, no vignette, no motion vectors, native ' + MANIFEST.fps + ' fps, ' + MANIFEST.cells.length + ' trimmed cells ≤ 512 px (' + wide + ' wider than tall — the horse\'s aspect, not square) with pivots; the atlas really is ' + (px ? px.w + '×' + px.h : '?') + ' (' + (atlas.length / 1024).toFixed(0) + ' KB), within the 4096 px texture ceiling',
     v.ok && !!px && px.w === MANIFEST.atlasSize.w && px.h === MANIFEST.atlasSize.h && px.w <= 4096 && px.h <= 4096 && MANIFEST.cells.length >= 36 && MANIFEST.cells.length <= 48 &&
     Math.max(...MANIFEST.cells.map((c) => Math.max(c.w, c.h))) === 512 && wide > MANIFEST.cells.length / 2 && MANIFEST.fps === 24 && MANIFEST.timing === 'native', v.errors.join('; '));
  const cellsSrc = MANIFEST.cells.map((c) => c.src), E = MANIFEST.phases.emerge.map((i) => cellsSrc[i]), A = MANIFEST.phases.act.map((i) => cellsSrc[i]);
  const au = MANIFEST.audit || {};
  ok('M2 · the frames follow the audit: the idle head trimmed (the first kept frame is f' + cellsSrc[0] + '), EMERGE = the rear (f' + E[0] + '–f' + E[E.length - 1] + ', ' + E.length + ' cells), ACT = flare → thrust → settle (f' + A[0] + '–f' + A[A.length - 1] + ', ' + A.length + ' cells), contact = f' + A[MANIFEST.contact] + ' (the spear fully extended), Kling\'s dissolve dropped (nothing after f' + cellsSrc[cellsSrc.length - 1] + '); frames in order, no repeats; the fizzle holds the last settled cell',
     cellsSrc[0] >= 29 && cellsSrc[cellsSrc.length - 1] <= 95 && cellsSrc.every((x, i) => i === 0 || x > cellsSrc[i - 1]) && E.every((x) => x <= A[0]) && E[0] >= au.emerge[0] && E[E.length - 1] <= au.emerge[1] && A[0] >= au.act[0] && A[A.length - 1] <= au.act[1] &&
     A[MANIFEST.contact] === au.contactSrc && J(MANIFEST.phases.fizzle) === J([MANIFEST.cells.length - 1]) && MANIFEST.phases.emerge.length + MANIFEST.phases.act.length === MANIFEST.cells.length);
  // origin (the cell's crop corner in the clip) + pivot ÷ scale must land on the one ground point, for every cell (≤ 1 clip px)
  const pivOk = Array.isArray(pivSrc) && typeof scale === 'number' && MANIFEST.cells.every((c) => Array.isArray(c.origin) &&
    Math.abs(c.origin[0] + c.pivot.x / scale - pivSrc[0]) <= 1 && Math.abs(c.origin[1] + c.pivot.y / scale - pivSrc[1]) <= 1);
  ok('M3 · ONE ground pivot for every cell (the front hooves\' ground contact, f' + (pivSrc ? pivSrc.join(',') : '?') + ' in the clip): every cell\'s pivot maps back to the same clip point; the source is the named Kling clip, not the placeholder; the actor folder holds only the packed atlas and its manifest (A7)',
     pivOk && MANIFEST.placeholder === false && /Kling clip kling_20260913_VIDEO_Create_a_p_5011_0\.mp4 \(sha256 1be6e5994111/.test(MANIFEST.source) &&
     J(fs.readdirSync(path.join(LAB, 'actors', 'meghnad')).sort()) === J(['atlas.webp', 'manifest.json']));
  const bad = [
    ['motion vectors', (m) => { m.mv = true; }, /mv must be false/],
    ['additive blend', (m) => { m.blend = 'add'; }, /blend must be "normal"/],
    ['brightness-to-alpha', (m) => { m.alpha = 'luminance'; }, /alpha must be "straight"/],
    ['a vignette', (m) => { m.vignette = true; }, /vignette must be false/],
    ['a 600 px cell', (m) => { m.cells[0].w = 600; }, /exceeds 512/],
    ['a pivot outside its cell', (m) => { m.cells[1].pivot.y = m.cells[1].h + 4; }, /pivot missing or outside/],
    ['a phase naming a missing cell', (m) => { m.phases.act = [0, 99]; }, /names cell 99/],
    ['no act phase', (m) => { delete m.phases.act; }, /phase act missing/],
    ['fps 0', (m) => { m.fps = 0; }, /fps must be/],
    ['facing "up"', (m) => { m.facing = 'up'; }, /facing must be/],
    ['no mirror and no variants', (m) => { delete m.mirror; }, /mirror:true or variants/],
    ['a cell outside the atlas', (m) => { m.cells[0].x = m.atlasSize.w; }, /outside the atlas/],
    ['a contact outside ACT', (m) => { m.contact = m.phases.act.length; }, /contact must be a cell index inside the act phase/],
    ['an unknown timing', (m) => { m.timing = 'stretched'; }, /timing must be/],
  ];
  const results = bad.map(([name, mutate, re]) => { const m = JSON.parse(J(MANIFEST)); mutate(m); const r = MAN.validate(m); return [name, !r.ok && r.errors.some((e) => re.test(e)), r.errors.join('; ')]; });
  ok('M4 · validation refuses, each with its reason: ' + bad.map((b) => b[0]).join(' · '), results.every((x) => x[1]), J(results.filter((x) => !x[1])));
}

// ═══ K · THE SOURCES (A7) ═══
console.log('\n── K · the sources rule (A7) ──');
{
  const tracked = git(['ls-files']).split('\n').filter(Boolean);
  const GAME_MP4 = ['assets/video/intro_trailer.mp4'].concat(['aura_1', 'aura_2', 'smoke_1', 'smoke_2', 'surge_1', 'surge_2', 'venom_1', 'venom_2'].map((k) => 'assets/vfx/clips/vfx_' + k + '_clip.mp4')).sort();
  const mp4Lab = tracked.filter((p) => p.indexOf('lab/') === 0 && /\.(mp4|mov|mkv|webm)$/i.test(p));
  const mp4Assets = tracked.filter((p) => p.indexOf('assets/') === 0 && /\.(mp4|mov|mkv|webm)$/i.test(p)).sort();
  ok('K1 · no video clip is tracked under lab/ (' + mp4Lab.length + '); under assets/ exactly the game\'s ' + GAME_MP4.length + ' pre-lab clips are tracked (8 effect clips + the intro trailer) and nothing new',
     mp4Lab.length === 0 && J(mp4Assets) === J(GAME_MP4), J({ mp4Lab, extra: mp4Assets.filter((p) => GAME_MP4.indexOf(p) < 0), missing: GAME_MP4.filter((p) => mp4Assets.indexOf(p) < 0) }));
  const raw = tracked.filter((p) => (p.indexOf('lab/') === 0 || p.indexOf('assets/') === 0) && (/(^|\/)(frames|matted|sources|clips_raw)\//.test(p) || /(^|\/)frame_\d+\.(png|jpe?g|webp)$/i.test(p) || /(^|\/)f\d{3}\.png$/.test(p)));
  ok('K2 · no raw or matted frame, and nothing from sources/, is tracked anywhere under lab/ or assets/ (' + raw.length + ')', raw.length === 0, raw.slice(0, 5).join(', '));
  const ignored = (p) => { try { cp.execFileSync('git', ['check-ignore', '-q', p], { cwd: GAME }); return true; } catch (e) { return false; } };
  const must = ['lab/vfx-manifestation/sources/kling_20260913_VIDEO_Create_a_p_5011_0.mp4', 'lab/vfx-manifestation/sources/meghnad-isolated-kling-source-v1.png', 'lab/vfx-manifestation/frames/meghnad/f072.png', 'lab/vfx-manifestation/frames/meghnad_contact_sheet.jpg', 'lab/vfx-manifestation/tools/.venv/u2net/isnet-general-use.onnx'];
  const present = must.filter((p) => fs.existsSync(path.join(GAME, p)));
  ok('K3 · sources/ (the clip and the Kling stills), frames/ (the matted frames and the contact sheet) and the rembg model inside tools/.venv are all git-ignored' + (present.length ? ' — ' + present.length + ' of them present on this machine' : ''), must.every(ignored), J(must.filter((p) => !ignored(p))));
}

// ═══ S · THE STAGE ═══
console.log('\n── S · the stage ──');
const PAGE = fs.readFileSync(path.join(LAB, 'index.html'), 'utf8');
{
  const z = (sel) => { const m = new RegExp(sel.replace(/[.#]/g, (c) => '\\' + c) + '\\{[^}]*z-index:(\\d+)').exec(PAGE); return m ? Number(m[1]) : null; };
  const vfxGpuZ = /gc\.style\.cssText='position:absolute;inset:0;z-index:(\d+);/.exec(fs.readFileSync(path.join(LAB, 'runtime', 'vfx.js'), 'utf8'));
  const order = [['board rows .half', z('.half')], ['#vfxcanvas', z('#vfxcanvas')], ['#vfxgpu (module)', vfxGpuZ ? Number(vfxGpuZ[1]) : null], ['#vfxflash', z('#vfxflash')],
                 ['#actorunder', z('#actorunder')], ['#actorcanvas', z('#actorcanvas')], ['#actorover', z('#actorover')], ['#floatlayer (numbers)', z('#floatlayer')], ['#banner', z('#banner')]];
  ok('S1 · LAYER ORDER, bottom to top: ' + order.map((o) => o[0] + ' ' + o[1]).join(' < ') + ' — the actor above the board and its effects, under the numbers; #actorgpu shares the actor\'s layer',
     order.every((o, i) => o[1] != null && (i === 0 || o[1] > order[i - 1][1])) && z('#actorgpu') === z('#actorcanvas'));
  const FIELD = { w: 390, h: 420 };
  const geo = (seat) => seat === 0
    ? { card: { x: 163, y: 222, w: 64, h: 90 }, side: 'me', band: { x: 163, y: 10, w: 64, h: 90 } }      // attacker bottom (units row by the divider), Indra at the top
    : { card: { x: 163, y: 108, w: 64, h: 90 }, side: 'opp', band: { x: 163, y: 320, w: 64, h: 90 } };  // attacker top, Indra at the bottom
  const place = (seat, cardX) => { const g = geo(seat); if (cardX != null) g.card.x = cardX; return SM.place({ card: g.card, side: g.side, fieldW: FIELD.w, fieldH: FIELD.h, band: g.band, refHeight: MANIFEST.refHeight, facing: MANIFEST.facing }); };
  ok('S2 · ANCHORING, both seats: the feet at the played card\'s base; the reach toward the enemy half (up from the bottom, down from the top); the actor taller than its card; and at ANY point of its reach it never touches the enemy cards (A1 — nothing depicted on the target)',
     [0, 1].every((s) => { const g = geo(s), p = place(s);
       return Math.abs(p.anchor.x - (g.card.x + g.card.w / 2)) < 0.01 && Math.abs(p.anchor.y - (g.card.y + g.card.h * 0.94)) < 0.01 && (s === 0 ? p.travel.y < 0 && p.dirY === -1 : p.travel.y > 0 && p.dirY === 1) &&
              p.height > g.card.h && !SM.touchesBand(p, g.band) && p.scale > 0; }));
  ok('S3 · FACING: a manifest drawn facing left is mirrored when the charge leans right (a card left of or at centre) and not when it leans left, on both seats',
     [0, 1].every((s) => place(s, 60).dirX === 1 && place(s, 60).flipX === true && place(s, 300).dirX === -1 && place(s, 300).flipX === false && place(s, 60).travel.x > 0 && place(s, 300).travel.x < 0));
  const src = fs.readFileSync(path.join(LAB, 'lib', 'actorstage.js'), 'utf8');
  ok('S4 · NORMAL BLENDING (A4): the actor is drawn source-over from its atlas cells (Canvas 2D) or as a blendMode "normal" sprite (Pixi); no additive, screen or brightness-to-alpha anywhere in the stage',
     /globalCompositeOperation = 'source-over'/.test(src) && /blendMode = 'normal'/.test(src) && /drawImage\(a\.art\.image, c\.x, c\.y, c\.w, c\.h/.test(src) && !/lighter|'add'|'screen'|getImageData/.test(src));

  if (!JSDOM) { fail += 3; console.log('  ✖ S5–S7 SKIPPED LOUDLY — jsdom not found under ' + path.join(WEB, 'tests') + ' (set DY_WEB). The stage runs did NOT happen.'); }
  else {
    function world(seat) {
      const dom = new JSDOM('<!doctype html><body><div id="field"><canvas id="actorunder"></canvas><canvas id="actorcanvas"></canvas><canvas id="actorgpu"></canvas><canvas id="actorover"></canvas></div></body>', { url: 'https://lab.test/', pretendToBeVisual: true, runScripts: 'outside-only' });
      const w = dom.window, calls = { draw: 0, clear: 0, ops: new Set() };
      const ctx = new Proxy({}, { get: (t, k) => k === 'createRadialGradient' ? () => ({ addColorStop() {} }) : k === 'drawImage' ? () => { calls.draw++; } : k === 'clearRect' ? () => { calls.clear++; } : () => undefined,
                                  set: (t, k, v) => { if (k === 'globalCompositeOperation') calls.ops.add(v); return true; } });
      w.HTMLCanvasElement.prototype.getContext = () => ctx;
      ['boarddiff', 'clashcontext', 'director', 'runner', 'manifest', 'stagemath', 'actorstage', 'playback'].forEach((n) => w.eval(fs.readFileSync(path.join(LAB, 'lib', n + '.js'), 'utf8')));
      let t = 0;
      const stage = new w.ActorStage({ field: w.document.getElementById('field'), under: w.document.getElementById('actorunder'), actorCanvas: w.document.getElementById('actorcanvas'), gpuCanvas: w.document.getElementById('actorgpu'), over: w.document.getElementById('actorover'), now: () => t });
      stage.loadActor('meghnad', { manifest: MANIFEST, image: { width: MANIFEST.atlasSize.w, height: MANIFEST.atlasSize.h } });
      const f = FX[seat], ctxw = w.ClashContext.fromBatch(f), boards = w.ClashContext.boards(ctxw, f.before, f.after), g = geo(seat);
      const rects = {}; rects[f.events[0].sourceUid] = g.card; rects[f.before.seats[f.defenderSeat].heroes[0].uid] = g.band;
      const renders = [], ember = [], done = [];
      const pb = w.Playback.create({ stage, ctx: ctxw, boards, viewer: 0, field: FIELD, rectOf: (u) => rects[u] || null, clientOf: (u) => rects[u] ? { cx: rects[u].x + 32, cy: rects[u].y + 45, w: 64 } : null,
        bandOf: (s) => s === f.defenderSeat ? g.band : g.card, render: (b, fl) => renders.push({ t, board: JSON.parse(J(b)), floats: fl }), pulse: () => {}, actorFor: (id) => id === 'meghnad' ? { manifest: MANIFEST } : null,
        factionFx: () => ({ portal: 'rgba(255,96,48,0.85)', exit: 'embers' }), embers: (x, y) => ember.push([x, y, t]), queueFx: () => {}, onDone: (r) => done.push(r) });
      return { w, stage, calls, pb, ctx: ctxw, boards, renders, ember, done, f, clock: { get t() { return t; }, set t(v) { t = v; } } };
    }
    const runWorld = (W, planOpts, stopAt, runOpts) => {
      const plan = W.w.Director.plan(W.ctx, Object.assign({ ladderExempt: true }, planOpts));
      const r = W.w.Runner.create(plan, W.pb.handlers, () => W.clock.t);
      r.start(runOpts || {}); const peak = { actors: 0, transform: false, flash: false, frozen: false };
      while (!r.done && W.clock.t < 20000) {
        W.clock.t += 16; r.tick(); W.stage.frame(W.clock.t, W.clock.t);
        peak.actors = Math.max(peak.actors, W.stage.liveActors()); if (W.w.document.getElementById('field').style.transform) peak.transform = true;
        if (W.stage.fx.some((x) => x.kind === 'flash')) peak.flash = true; if (W.stage.frozenUntil > 0) peak.frozen = true;
        if (stopAt && W.clock.t >= stopAt) { r.skip(); break; }
      }
      return { plan, r, peak };
    };
    const clean = (W) => W.stage.liveActors() === 0 && W.stage.liveSprites() === 0 && W.stage.actors.length === 0 && W.stage.fx.length === 0 && !W.stage.impulseFx && W.w.document.getElementById('field').style.transform === '';
    const results = [0, 1].map((seat) => {
      const A = world(seat), a = runWorld(A, { mode: 'full' });                  // the whole manifestation
      const S = a.plan.phases.find((p) => p.name === 'SETTLE');
      const firstFloat = A.renders.find((x) => x.floats && x.floats.length);
      const B = world(seat), b = runWorld(B, { mode: 'full' }, 1300);           // skipped mid-ACT
      const C = world(seat), cp2 = runWorld(C, { mode: 'full' }, null, (() => { const pl = C.w.Director.plan(C.ctx, { mode: 'full', ladderExempt: true }); const ph = pl.phases.find((p) => p.name === 'ACT'); return { from: ph.t0, to: ph.t1 }; })());
      return {
        seat, full: { peak: a.peak, clean: clean(A), done: A.done[0], firstFloatT: firstFloat ? firstFloat.t : null, settleT0: S.t0, floats: firstFloat ? firstFloat.floats : null, embers: A.ember.length, draws: A.calls.draw, ops: [...A.calls.ops], stats: A.stage.stats() },
        skip: { peak: b.peak, clean: clean(B), done: B.done[0], lastBoard: B.renders[B.renders.length - 1] },
        phase: { peak: cp2.peak, clean: clean(C), renders: C.renders.length },
      };
    });
    ok('S5 · A FULL MANIFESTATION on the stage, both seats: one live actor (never two; liveActors counts actors, liveSprites counts GPU sprites), the ACT\'s hit-stop, flash and camera impulse fire, the Asura exit throws embers, the actor is drawn from its cells; afterwards nothing survives (no actor, effect or camera offset) and the final board equals the engine\'s AFTER',
       results.every((x) => x.full.peak.actors === 1 && x.full.peak.frozen && x.full.peak.flash && x.full.peak.transform && x.full.embers >= 3 && x.full.draws > 50 && x.full.clean && x.full.done && x.full.done.equalsFinal && x.full.ops.every((o) => o === 'source-over')), J(results.map((x) => x.full)));
    ok('S6 · NUMBERS ONLY AT SETTLE, both seats: the first floating number appears at SETTLE (never earlier) and it is exactly Indra −2 from the board difference',
       results.every((x) => x.full.firstFloatT != null && x.full.firstFloatT >= x.full.settleT0 && x.full.floats.length === 1 && x.full.floats[0].delta === -2 && x.full.floats[0].uid === x.seat === false || (x.full.firstFloatT >= x.full.settleT0 && x.full.floats.length === 1 && x.full.floats[0].delta === -2 && x.full.floats[0].uid === FX[x.seat].before.seats[FX[x.seat].defenderSeat].heroes[0].uid)), J(results.map((x) => [x.full.firstFloatT, x.full.settleT0, x.full.floats])));
    ok('S7 · CLEANUP GUARANTEE, both seats: skipped mid-ACT (an actor was live) → no actor, no GPU sprite, no effect, no camera offset, and the board jumps straight to the engine\'s AFTER with no numbers; a single-phase (ACT) replay also ends clean',
       results.every((x) => x.skip.peak.actors === 1 && x.skip.clean && x.skip.done && x.skip.done.equalsFinal && x.skip.lastBoard.floats.length === 0 && x.phase.peak.actors === 1 && x.phase.clean), J(results.map((x) => [x.skip, x.phase])));
    const st = results[0].full.stats;
    ok('S8 · THE PERFORMANCE READOUT: the stage reports its backend, frames, draw ms per frame, fps over the manifestation and the cell size (' + J(st) + '); the page shows it (#ro-actor)',
       st.backend === 'canvas2d' && st.frames > 0 && typeof st.drawMsAvg === 'number' && st.drawMsAvg >= 0 && typeof st.fps === 'number' && st.cellPx === 512 && st.drawnPx > 0 &&
       PAGE.indexOf('<dd id="ro-actor">') >= 0 && /stage\.stats\(\)/.test(fs.readFileSync(path.join(LAB, 'lab.js'), 'utf8')));
  }
}

// ═══ R · THE RUNTIME ═══
console.log('\n── R · the runtime copy ──');
const T = require(path.join(LAB, 'tools', 'copy_runtime.js'));
const VFXJS = fs.readFileSync(path.join(LAB, 'runtime', 'vfx.js'), 'utf8');
const COPY = JSON.parse(fs.readFileSync(path.join(LAB, 'runtime', 'COPY.json'), 'utf8'));
{
  const html = fs.readFileSync(path.join(GAME, 'index.html'), 'utf8');
  const live = T.locate(html), mine = T.verbatimOf(VFXJS);
  const a = live.body.split('\n'), b = (mine || '').split('\n');
  const drift = []; for (let i = 0; i < Math.max(a.length, b.length); i++) if (a[i] !== b[i]) drift.push(i);
  console.log('    DRIFT REPORT · live index.html:' + live.start + '-' + live.end + ' (' + a.length + ' lines) vs lab runtime/vfx.js (' + b.length + ' lines, copied from ' + COPY.source.startLine + '-' + COPY.source.endLine + ' @ ' + String(COPY.source.gameCommit).slice(0, 7) + ') · lines differing: ' + drift.length);
  ok('R1 · the lab\'s module is the game\'s VFX module BYTE-FOR-BYTE (0 lines of drift against index.html:' + live.start + '-' + live.end + '), and COPY.json names that exact range and sha256',
     mine !== null && drift.length === 0 && COPY.source.sha256 === sha256(live.body) && COPY.source.startLine === live.start && COPY.source.endLine === live.end, drift.length + ' lines differ');
  const consts = T.pageConstants(html);
  const outside = VFXJS.split(T.verbatimOf(VFXJS)).join('');
  const declared = [...outside.matchAll(/var\s+([^;]+);/g)].flatMap((m) => [...m[1].matchAll(/(?:^|,)\s*([A-Za-z_$][\w$]*)\s*=/g)].map((x) => x[1]));
  ok('R2 · the wrapper injects exactly the module\'s page dependencies (' + T.PAGE_NAMES.join(', ') + ') and the clock (' + T.CLOCK_NAMES.join(', ') + '), defaulting to the page\'s own constants',
     J(declared.filter((n) => n !== 'deps' && n !== 'PAGE').sort()) === J(T.PAGE_NAMES.concat(T.CLOCK_NAMES).sort()) && J(COPY.injected.pageConstants) === J(consts), J(declared));
}
{
  if (!JSDOM) { fail++; console.log('  ✖ R3 SKIPPED LOUDLY — jsdom not found (set DY_WEB).'); }
  else {
    const dom = new JSDOM('<!doctype html><body><div id="field" style="width:390px;height:360px"><canvas id="vfxcanvas"></canvas><div id="vfxflash"></div></div></body>', { url: 'https://lab.test/lab/vfx-manifestation/', pretendToBeVisual: true, runScripts: 'outside-only' });
    const w = dom.window, errs = [];
    const ctx = new Proxy({}, { get: (t, k) => k === 'measureText' ? () => ({ width: 10 }) : /^create(Linear|Radial)Gradient$|^createPattern$/.test(String(k)) ? () => ({ addColorStop() {} }) : k === 'getImageData' ? (x, y, ww, hh) => ({ data: new Uint8ClampedArray(Math.max(4, (ww || 1) * (hh || 1) * 4)) }) : () => undefined, set: () => true });
    w.HTMLCanvasElement.prototype.getContext = () => ctx; w.HTMLCanvasElement.prototype.toDataURL = () => 'data:,';
    let api = null, frames = 0; const clock = { t: 0, cbs: [] };
    try {
      w.eval(VFXJS);
      const VFX = w.LabVFX.create({ $: (id) => w.document.getElementById(id), vfxT: () => 1.3, reducedMotion: () => false, jankSample: () => {},
        requestAnimationFrame: (cb) => { clock.cbs.push(cb); return clock.cbs.length; }, cancelAnimationFrame: () => {}, performance: { now: () => clock.t } });
      api = VFX; VFX.applyQuality('lo'); VFX.init(); VFX.resize(); VFX.cardLand(120, 200); VFX.sprSurge(120, 200, 64);
      for (let i = 0; i < 90; i++) { clock.t += 1000 / 60; const run = clock.cbs; clock.cbs = []; run.forEach((cb) => { cb(clock.t); frames++; }); }
      VFX.__advance2D(1 / 60);
    } catch (e) { errs.push(String(e && e.stack || e).split('\n').slice(0, 2).join(' | ')); }
    ok('R3 · the copied module runs headless on the injected names ALONE: init, the lo rung, cardLand and sprSurge, ' + frames + ' frames through the injected clock — no ReferenceError',
       errs.length === 0 && !!api && ['init', 'resize', 'cardLand', 'sprSurge', 'applyQuality', 'currentRung', 'sprCount', 'bakeMs', 'gpu'].every((k) => k in api) && frames > 0 && api.currentRung() === 'lo', errs.join(' ; '));
  }
}
{
  const exact = ['runtime/assets/vendor/pixi.min.mjs', 'runtime/assets/vfx/game/sheets/vfx_surge_1.png', 'runtime/assets/vfx/game/sheets/vfx_surge_2.png', 'runtime/assets/vfx/game/sheets/mv/vfx_surge_1.png', 'runtime/assets/vfx/game/sheets/mv/vfx_surge_2.png'];
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((x) => x.isDirectory() ? walk(path.join(d, x.name)) : [path.join(d, x.name)]);
  const onDisk = walk(path.join(LAB, 'runtime', 'assets')).map((p) => path.relative(LAB, p)).sort();
  const same = (f) => { const a = fs.readFileSync(path.join(GAME, f.from)), b = fs.readFileSync(path.join(LAB, f.to)); return a.equals(b) && sha256(b) === f.sha256; };
  ok('R4 · the runtime asset subset is exact: the Pixi copy + ONE effect\'s sheets (Chaos Surge, lo rung), the art only Meghnad and Indra — each byte-identical to the game\'s',
     J(onDisk) === J(exact.slice().sort()) && COPY.files.length === 7 && COPY.files.every(same) && J(fs.readdirSync(path.join(LAB, 'art')).sort()) === J(['Asuras_Unit_Meghnad_P6_rRare.png', 'Devas_Hero_Indra_P7_rLegendary.png']), J(onDisk));
}

// ═══ P · THE PAGE ═══
console.log('\n── P · the page ──');
{
  const ids = ['field', 'divider', 'vfxcanvas', 'vfxflash', 'actorunder', 'actorcanvas', 'actorgpu', 'actorover', 'floatlayer', 'banner', 'replay-all', 'phase-awaken', 'phase-emerge', 'phase-act', 'phase-fizzle', 'phase-settle',
               'ctl-skip', 'ctl-ff', 'ctl-memory', 'mode-full', 'mode-fast', 'mode-reduced', 'seat-swap', 'be-webgpu', 'be-webgl', 'be-canvas', 'clk-slow', 'clk-pause', 'clk-step',
               'ro-fps', 'ro-time', 'ro-renderer', 'ro-actor', 'ro-rung', 'ro-sprites', 'ro-decode', 'ro-mb', 'ro-errors', 'plan'];
  const missing = ids.filter((id) => PAGE.indexOf('id="' + id + '"') < 0);
  const order = ['../lib/boarddiff.js', '../lib/clashcontext.js', '../lib/director.js', '../lib/runner.js', '../lib/manifest.js', '../lib/stagemath.js', '../lib/actorstage.js', '../lib/playback.js', 'vfx.js', '../lab.js'].map((s) => PAGE.indexOf('<script src="' + s + '">'));
  const fieldBlock = PAGE.slice(PAGE.indexOf('<div id="field"'), PAGE.indexOf('<div id="hand">'));
  ok('P1 · the page: noindex, <base href="runtime/">, #field holding the effect and actor layers, the scripts in dependency order, every control (Play, the five phase replays, Skip, Fast-forward, match memory, mode, sides, renderer, clock) and every readout including Actor and Plan',
     /<meta name="robots" content="noindex, nofollow">/.test(PAGE) && /<base href="runtime\/">/.test(PAGE) && missing.length === 0 && order.every((i, k) => i > 0 && (k === 0 || i > order[k - 1])) &&
     ['vfxcanvas', 'actorunder', 'actorcanvas', 'actorgpu', 'actorover', 'floatlayer'].every((id) => fieldBlock.indexOf('id="' + id + '"') > 0) && !/type="button" disabled/.test(PAGE), 'missing: ' + missing.join(', '));
  const code = PAGE + ['lab.js'].concat(fs.readdirSync(path.join(LAB, 'lib')).map((n) => 'lib/' + n)).map((p) => fs.readFileSync(path.join(LAB, p), 'utf8')).join('\n');
  const readme = fs.readFileSync(path.join(LAB, 'README.md'), 'utf8');
  ok('P2 · nothing on the page loads from the live game (no ../../ path, no game asset URL in the page, lab.js or lib/); the README keeps the SETTLE note (index.html:8162–8171) and documents LAB-2+3',
     !/\.\.\/\.\.\//.test(code) && !/sangbaran-purr\.github\.io\/divya-yuddha\/(assets|index)/.test(code) && /index\.html:8162–8171/.test(readme) && /LAB-2\+3/.test(readme));
}

// ═══ G · THE RULE ═══
console.log('\n── G · the experiment rule ──');
{
  const changed = git(['diff', '--name-only', LAB_BASE, '--']).split('\n').filter(Boolean);
  const staged = git(['diff', '--cached', '--name-only']).split('\n').filter(Boolean);
  const untracked = git(['ls-files', '--others', '--exclude-standard', '--', 'docs', 'src', 'index.html', 'scripts', 'tools', 'test']).split('\n').filter(Boolean);
  const outside = [...new Set(changed.concat(staged))].filter((p) => p.indexOf('lab/') !== 0 && p !== DOC);
  ok('G1 · no tracked change outside lab/ since the lab began (' + LAB_BASE + ') — committed, staged or in the working tree — except the ruling doc (A8)', outside.length === 0, outside.join(', '));
  const codeFiles = git(['ls-files']).split('\n').filter((p) => p && p.indexOf('lab/') !== 0 && /\.(html|js|mjs|cjs|json|sh|py|css)$/.test(p));
  const refs = codeFiles.filter((p) => { try { return /vfx-manifestation|lab\/vfx/.test(fs.readFileSync(path.join(GAME, p), 'utf8')); } catch (e) { return false; } });
  ok('G2 · nothing outside lab/ references the lab: ' + codeFiles.length + ' tracked code files scanned, 0 mention it', refs.length === 0, refs.join(', '));
  const sync = path.join(WEB, 'scripts', 'sync_game.sh');
  if (!fs.existsSync(sync)) { fail++; console.log('  ✖ G3 SKIPPED LOUDLY — the site checkout is absent (' + sync + ')'); }
  else { const m = /^ARCHIVE_PATHS="([^"]*)"/m.exec(fs.readFileSync(sync, 'utf8'));
    ok('G3 · the site\'s sync never archives the lab: ARCHIVE_PATHS = "' + (m ? m[1] : '?') + '"', !!m && m[1].split(/\s+/).every((p) => p.indexOf('lab') !== 0)); }
  const ignored = (p) => { try { cp.execFileSync('git', ['check-ignore', '-q', p], { cwd: GAME }); return true; } catch (e) { return false; } };
  const mustIgnore = ['lab/vfx-manifestation/sources/meghnad_charge.mp4', 'lab/vfx-manifestation/clips/x.mov', 'lab/vfx-manifestation/frames/f_0001.png', 'lab/vfx-manifestation/matted/f_0001.png', 'lab/vfx-manifestation/tools/.venv/bin/python', 'lab/vfx-manifestation/x.mp4'];
  const mustKeep = ['lab/vfx-manifestation/runtime/assets/vfx/game/sheets/vfx_surge_1.png', 'lab/vfx-manifestation/actors/meghnad/atlas.webp', 'lab/vfx-manifestation/index.html'];
  ok('G4 · A7: Kling sources, clips, frames, matted frames and the matting venv are git-ignored; the lab\'s committed files (the packed actor atlas included) are not',
     mustIgnore.every(ignored) && !mustKeep.some(ignored), J(mustIgnore.filter((p) => !ignored(p)).concat(mustKeep.filter(ignored))));
  if (untracked.length) console.log('    (untracked files outside lab/ under docs/src/scripts/tools/test, not a lab change: ' + untracked.join(', ') + ')');
}

// ═══ D · THE RULING ═══
console.log('\n── D · the ruling doc ──');
{
  const doc = fs.readFileSync(path.join(GAME, DOC), 'utf8'), at = doc.indexOf('## AMENDMENT 2026-09-13'), tail = at >= 0 ? doc.slice(at) : '';
  ok('D1 · ' + DOC + ' carries the "AMENDMENT 2026-09-13" section with A1–A8, in order',
     at > 0 && ['A1. SINGLE-ACTOR MANIFESTATION.', 'A2. SCOPE.', 'A3. PILOT = Meghnad on play', 'A4. ACTORS ARE A SECOND ASSET CLASS', 'A5. BUDGET:', 'A6. MATTING:', 'A7. THE LAB IS PUBLIC ON PAGES, UNLINKED', 'A8. THE DOC:']
       .every((s, i, all) => tail.indexOf(s) > 0 && (i === 0 || tail.indexOf(s) > tail.indexOf(all[i - 1]))));
}

{
  const files = git(['ls-files', '-z']).split('\0').filter(Boolean);
  let total = 0, lab = 0; for (const f of files) { try { const s = fs.statSync(path.join(GAME, f)).size; total += s; if (f.indexOf('lab/') === 0) lab += s; } catch (e) {} }
  console.log('\n    PAGES WATCH (A7) · tracked total ' + (total / 1048576).toFixed(1) + ' MB (of which lab/ ' + (lab / 1048576).toFixed(2) + ' MB) of ~1 GB');
}
console.log('\n' + (fail === 0 ? '✓ ALL ' + pass + ' LAB CHECKS PASS' : '✖ ' + fail + ' FAILURES / ' + pass + ' passed'));
process.exit(fail === 0 ? 0 : 1);
