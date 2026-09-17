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
//                       numbers only at SETTLE, normal blending, the performance readout; LAB-4a: the cells are the clock —
//                       cells drawn per play on every backend's draw path, contact on its cell, no hold, no repeat, no skip;
//                       LAB-4b: the dissolve exit on every backend, a pixel never reappears, the faction presets, no grain
//   R · THE RUNTIME     the lab's VFX module is the game's byte-for-byte; its injected names; it runs on them alone; the subset
//   P · THE PAGE        the structure and every control; nothing loaded from the live game; every URL stamped (LAB-4a)
//   G · THE RULE        no tracked change outside lab/ since the lab began (the ruling doc, A8, excepted); nothing outside
//                       lab/ references it; the site's sync never archives it; Kling sources and frames are ignored
//   D · THE RULING      the doc carries A1–A8
//   GATE (LAB-5)        the acceptance gate, automated: one GATE: PASS/FAIL line listing every check
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
// LAB-6 · the second character, built by the template
const IFX = [0, 1].map((s) => JSON.parse(fs.readFileSync(path.join(LAB, 'fixtures', 'indra_seat' + s + '.json'), 'utf8')));
const IMAN = JSON.parse(fs.readFileSync(path.join(LAB, 'actors', 'indra', 'manifest.json'), 'utf8'));
// LAB-7 · the third character — engine id "hanuman", card name Bali, fixture and actor folder "bali"
const BFX = [0, 1].map((s) => JSON.parse(fs.readFileSync(path.join(LAB, 'fixtures', 'bali_seat' + s + '.json'), 'utf8')));
const BMAN = JSON.parse(fs.readFileSync(path.join(LAB, 'actors', 'bali', 'manifest.json'), 'utf8'));
// LAB-8 · the fourth character, the first native exit
const VFXF = [0, 1].map((s) => JSON.parse(fs.readFileSync(path.join(LAB, 'fixtures', 'varuna_seat' + s + '.json'), 'utf8')));
const VMAN = JSON.parse(fs.readFileSync(path.join(LAB, 'actors', 'varuna', 'manifest.json'), 'utf8'));
// LAB-9 · three launch characters, all native exit (Shukracharya's engine id is "shukra"; his folder and fixture stay "shukracharya")
const NINE = [['agni', 'agni'], ['mahabali', 'mahabali'], ['shukra', 'shukracharya']].map(([key, folder]) => ({
  key, folder, M: JSON.parse(fs.readFileSync(path.join(LAB, 'actors', folder, 'manifest.json'), 'utf8')),
  FX: [0, 1].map((s) => JSON.parse(fs.readFileSync(path.join(LAB, 'fixtures', folder + '_seat' + s + '.json'), 'utf8'))),
}));
const AMAN = NINE[0].M, MMAN = NINE[1].M, SMAN = NINE[2].M;
// LAB-11 · two WAVE-1 heroes, reached by name through the scenario deck (no shim): the folder, fixture and engine id all agree
const ELEVEN = [['mahishi', 'Mahishi', 'asuras', 5], ['vritra', 'Vritra', 'asuras', 6]].map(([key, name, faction, power]) => ({
  key, name, faction, power, folder: key, M: JSON.parse(fs.readFileSync(path.join(LAB, 'actors', key, 'manifest.json'), 'utf8')),
  FX: [0, 1].map((s) => JSON.parse(fs.readFileSync(path.join(LAB, 'fixtures', key + '_seat' + s + '.json'), 'utf8'))),
}));
const MHMAN = ELEVEN[0].M, VRMAN = ELEVEN[1].M;
// LAB-12 · the hoverer: a WAVE-1 Deva hero whose wings leave the frame, so his edge cut is accepted rather than feathered
const GMAN = JSON.parse(fs.readFileSync(path.join(LAB, 'actors', 'garuda', 'manifest.json'), 'utf8'));
const GFX = [0, 1].map((s) => JSON.parse(fs.readFileSync(path.join(LAB, 'fixtures', 'garuda_seat' + s + '.json'), 'utf8')));
// LAB-13 · the first MAGENTA ground: a two-channel key, and the all-frames bottom-feather guard
const KMAN = JSON.parse(fs.readFileSync(path.join(LAB, 'actors', 'kartikeya', 'manifest.json'), 'utf8'));
const KFX = [0, 1].map((s) => JSON.parse(fs.readFileSync(path.join(LAB, 'fixtures', 'kartikeya_seat' + s + '.json'), 'utf8')));
// LAB-14 · the first NAGA actors — three launch Heroes, all on coils, all native exits
const NAGAS = [['vasuki', 'Vasuki', 'L', 8], ['takshaka', 'Takshaka', 'E', 6], ['shesha', 'Shesha', 'L', 7]].map(([key, name, rarity, power]) => ({
  key, name, rarity, power, M: JSON.parse(fs.readFileSync(path.join(LAB, 'actors', key, 'manifest.json'), 'utf8')),
  FX: [0, 1].map((s) => JSON.parse(fs.readFileSync(path.join(LAB, 'fixtures', key + '_seat' + s + '.json'), 'utf8'))),
}));
// LAB-15 · two Wave-1 Nagas — the first card below 384, and a burst that is also an exit
const WAVE15 = [['padmavati', 'Padmavati', 'L', 7], ['kulika', 'Kulika', 'L', 8]].map(([key, name, rarity, power]) => ({
  key, name, rarity, power, M: JSON.parse(fs.readFileSync(path.join(LAB, 'actors', key, 'manifest.json'), 'utf8')),
  FX: [0, 1].map((s) => JSON.parse(fs.readFileSync(path.join(LAB, 'fixtures', key + '_seat' + s + '.json'), 'utf8'))),
}));
// LAB-16 · the first Vanara actors since the pilot wave — and the first on-play ability that fires on an empty board
const VAN16 = [['sugriva', 'Sugriva', 'E', 6], ['angad', 'Angad', 'E', 7]].map(([key, name, rarity, power]) => ({
  key, name, rarity, power, M: JSON.parse(fs.readFileSync(path.join(LAB, 'actors', key, 'manifest.json'), 'utf8')),
  FX: [0, 1].map((s) => JSON.parse(fs.readFileSync(path.join(LAB, 'fixtures', key + '_seat' + s + '.json'), 'utf8'))),
}));
// LAB-17 · two Wave-1 Vanaras — the first card touching no edge, and a ground-impact that needed a window
const VAN17 = [['anjana', 'Anjana', 'L', 6], ['makardhwaja', 'Makardhwaja', 'L', 7]].map(([key, name, rarity, power]) => ({
  key, name, rarity, power, M: JSON.parse(fs.readFileSync(path.join(LAB, 'actors', key, 'manifest.json'), 'utf8')),
  FX: [0, 1].map((s) => JSON.parse(fs.readFileSync(path.join(LAB, 'fixtures', key + '_seat' + s + '.json'), 'utf8'))),
}));
// LAB-18 · RAHU, the last card of the roster — a floating head on the one green key, inert on play by TIMING
const RAHU = { key: 'rahu', name: 'Rahu', rarity: 'E', power: 4, M: JSON.parse(fs.readFileSync(path.join(LAB, 'actors', 'rahu', 'manifest.json'), 'utf8')),
  FX: [0, 1].map((s) => JSON.parse(fs.readFileSync(path.join(LAB, 'fixtures', 'rahu_seat' + s + '.json'), 'utf8'))) };
// LAB-19 · THE PREMIUM EFFECTS TRACK — Vajra's additive strike clip (not an actor) and its real-engine Astra fixture
const VJ = { M: JSON.parse(fs.readFileSync(path.join(LAB, 'effects', 'vajra', 'manifest.json'), 'utf8')),
  FX: [0, 1].map((s) => JSON.parse(fs.readFileSync(path.join(LAB, 'fixtures', 'vajra_seat' + s + '.json'), 'utf8'))) };
const EC = require(path.join(LAB, 'lib', 'effectclip.js'));
// LAB-20 · THE FIRST CHAIN — Sudarshana Chakra: an invocation handed off to a strike, and its real-engine removal fixture
const SU = { I: JSON.parse(fs.readFileSync(path.join(LAB, 'effects', 'sudarshana_invoke', 'manifest.json'), 'utf8')), S: JSON.parse(fs.readFileSync(path.join(LAB, 'effects', 'sudarshana_strike', 'manifest.json'), 'utf8')),
  C: JSON.parse(fs.readFileSync(path.join(LAB, 'effects', 'sudarshana', 'chain.json'), 'utf8')),
  FX: [0, 1].map((s) => JSON.parse(fs.readFileSync(path.join(LAB, 'fixtures', 'sudarshana_seat' + s + '.json'), 'utf8'))) };
SU.spec = { class: 'effect-chain', chain: SU.C, clips: [SU.I, SU.S] };
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
  const { buildIndra } = require(path.join(LAB, 'fixtures', 'make_fixture.js'));
  for (const seat of [0, 1]) {
    ok('F' + (6 + seat) + ' · LAB-6 · the Indra seat-' + seat + ' fixture is what a fresh engine run produces today (every field), on the engine it names',
       J(IFX[seat]) === J(buildIndra(seat)) && IFX[seat].engine.sha256 === liveEngineSha, 'differs from a fresh run');
  }
  ok('F8 · LAB-6 · Indra\'s play, both seats: ONE event (play Indra), and the board difference is Indra entering the Deva seat\'s heroes at 7 — nothing changed, nothing left, no number (the no-damage SETTLE path)',
     IFX.every((f) => J(f.events.map((e) => [e.type, e.abilityName || null, e.text || null])) === J([['play', 'Indra', '{p' + f.attackerSeat + '} plays Indra']]) && f.diff.changed.length === 0 && f.diff.left.length === 0 &&
       f.diff.entered.length === 1 && f.diff.entered[0].id === 'indra' && f.diff.entered[0].seat === f.attackerSeat && f.diff.entered[0].zone === 'heroes' && f.diff.entered[0].eff === 7 && f.events[0].sourceUid === f.diff.entered[0].uid &&
       f.before.seats[f.attackerSeat].faction === 'devas'), J(IFX.map((f) => [f.events, f.diff])));
  const { buildBali } = require(path.join(LAB, 'fixtures', 'make_fixture.js'));
  for (const seat of [0, 1]) {
    ok('F' + (9 + seat) + ' · LAB-7 · the Bali seat-' + seat + ' fixture is what a fresh engine run produces today (every field), on the engine it names',
       J(BFX[seat]) === J(buildBali(seat)) && BFX[seat].engine.sha256 === liveEngineSha, 'differs from a fresh run');
  }
  ok('F11 · LAB-7 · Bali\'s play, both seats: ONE event (play Bali); the board difference is Bali — engine id "hanuman" — entering the Vanara seat\'s heroes at 9; nothing changed, nothing left, no number (his passive, +1 to each Vanara Unit of printed power 4+ played later, changes no card on this board)',
     BFX.every((f) => J(f.events.map((e) => [e.type, e.abilityName || null, e.text || null])) === J([['play', 'Bali', '{p' + f.attackerSeat + '} plays Bali']]) && f.diff.changed.length === 0 && f.diff.left.length === 0 &&
       f.diff.entered.length === 1 && f.diff.entered[0].id === 'hanuman' && f.diff.entered[0].n === 'Bali' && f.diff.entered[0].seat === f.attackerSeat && f.diff.entered[0].zone === 'heroes' && f.diff.entered[0].eff === 9 &&
       f.events[0].sourceUid === f.diff.entered[0].uid && f.before.seats[f.attackerSeat].faction === 'vanaras'), J(BFX.map((f) => [f.events, f.diff])));
  const { buildVaruna } = require(path.join(LAB, 'fixtures', 'make_fixture.js'));
  for (const seat of [0, 1]) {
    ok('F' + (12 + seat) + ' · LAB-8 · the Varuna seat-' + seat + ' fixture is what a fresh engine run produces today (every field), on the engine it names',
       J(VFXF[seat]) === J(buildVaruna(seat)) && VFXF[seat].engine.sha256 === liveEngineSha, 'differs from a fresh run');
  }
  ok('F14 · LAB-8 · Varuna\'s play, both seats: ONE event (play Varuna); the board difference is Varuna — a Deva Epic Hero — entering the Deva seat\'s heroes at 6; nothing changed, nothing left, no number (his passive, the opponent\'s one-Astra-per-round limit, changes no card)',
     VFXF.every((f) => J(f.events.map((e) => [e.type, e.abilityName || null, e.text || null])) === J([['play', 'Varuna', '{p' + f.attackerSeat + '} plays Varuna']]) && f.diff.changed.length === 0 && f.diff.left.length === 0 &&
       f.diff.entered.length === 1 && f.diff.entered[0].id === 'varuna' && f.diff.entered[0].zone === 'heroes' && f.diff.entered[0].eff === 6 && f.diff.entered[0].seat === f.attackerSeat &&
       f.events[0].sourceUid === f.diff.entered[0].uid && f.before.seats[f.attackerSeat].faction === 'devas' && f.scenario['p' + f.attackerSeat + 'Deck'][0] === 'Varuna'), J(VFXF.map((f) => [f.events, f.diff])));
  // LAB-9 · the three launch characters' fixtures, from the same Hero builder
  const { forEntry } = require(path.join(LAB, 'fixtures', 'make_fixture.js'));
  const NINE_F = [['agni', 'Agni', 'agni', 'devas', 5], ['mahabali', 'Mahabali', 'mahabali', 'asuras', 8], ['shukracharya', 'Shukracharya', 'shukra', 'asuras', 5]];
  NINE_F.forEach(([entry, name, id, faction, power], k) => {
    const FXn = NINE[k].FX;
    for (const seat of [0, 1]) {
      ok('F' + (15 + k * 2 + seat) + ' · LAB-9 · the ' + name + ' seat-' + seat + ' fixture is what a fresh engine run produces today (every field), on the engine it names',
         J(FXn[seat]) === J(forEntry(entry)(seat)) && FXn[seat].engine.sha256 === liveEngineSha, 'differs from a fresh run');
    }
  });
  ok('F21 · LAB-9 · each launch character\'s play, both seats: ONE event; the board difference is the Hero entering his own seat\'s heroes row at his printed power — Agni 5 (devas), Mahabali 8 (asuras), Shukracharya 5 (asuras, engine id "shukra"); nothing changed, nothing left, no number (Agni\'s trigger waits for a Mantra, Mahabali\'s passive for a voluntary Pass, Shukracharya\'s revive for a fallen Unit in the discard)',
     NINE_F.every(([entry, name, id, faction, power], k) => NINE[k].FX.every((f) =>
       J(f.events.map((e) => [e.type, e.abilityName || null, e.text || null])) === J([['play', name, '{p' + f.attackerSeat + '} plays ' + name]]) &&
       f.diff.changed.length === 0 && f.diff.left.length === 0 && f.diff.entered.length === 1 && f.diff.entered[0].id === id && f.diff.entered[0].n === name &&
       f.diff.entered[0].zone === 'heroes' && f.diff.entered[0].eff === power && f.diff.entered[0].seat === f.attackerSeat &&
       f.events[0].sourceUid === f.diff.entered[0].uid && f.before.seats[f.attackerSeat].faction === faction && f.scenario['p' + f.attackerSeat + 'Deck'][0] === name)),
     J(NINE.map((n) => n.FX.map((f) => [f.events, f.diff.entered]))));
  // LAB-11 · the two WAVE-1 heroes, and the guard rail that keeps the no-shim finding honest
  ELEVEN.forEach((c, k) => { for (const seat of [0, 1]) {
    ok('F' + (22 + k * 2 + seat) + ' · LAB-11 · the ' + c.name + ' seat-' + seat + ' fixture is what a fresh engine run produces today (every field), on the engine it names',
       J(c.FX[seat]) === J(forEntry(c.key)(seat)) && c.FX[seat].engine.sha256 === liveEngineSha, 'differs from a fresh run');
  } });
  ok('F26 · LAB-11 · THE WAVE-1 GUARD RAIL, both cards, both seats: the fixture reaches a wave-1 card by NAME ALONE and nothing else. The scenario names every card as a string (no id, no wave flag, no options beyond the ones the launch cards already use), NO lab file anywhere passes wave1 to newGame, and the play produces ONE event whose board difference is the Hero entering his own seat heroes row at the ENGINE power the balance ladder left him — Mahishi 5 (R64 P7 to P6, then R76 P6 to P5), Vritra 6 (R65 P8 to P7, then R80 P7 to P6). Nothing changed, nothing left, no number: her copy waits for ROUND END and his bind waits for an enemy Unit',
     ELEVEN.every((c) => c.FX.every((f) => {
       const opt = f.scenario, deck = opt['p' + f.attackerSeat + 'Deck'];
       return deck.every((n) => typeof n === 'string') && deck[0] === c.name && opt.wave1 === undefined && Object.keys(opt).every((k2) => ['p0', 'p1', 'p0Faction', 'p1Faction', 'p0Deck', 'p1Deck', 'mulligan'].indexOf(k2) >= 0) &&
              J(f.events.map((e) => [e.type, e.abilityName || null, e.text || null])) === J([['play', c.name, '{p' + f.attackerSeat + '} plays ' + c.name]]) &&
              f.diff.changed.length === 0 && f.diff.left.length === 0 && f.diff.entered.length === 1 &&
              f.diff.entered[0].id === c.key && f.diff.entered[0].n === c.name && f.diff.entered[0].zone === 'heroes' &&
              f.diff.entered[0].eff === c.power && f.diff.entered[0].seat === f.attackerSeat && f.events[0].sourceUid === f.diff.entered[0].uid &&
              f.before.seats[f.attackerSeat].faction === c.faction;
     })), J(ELEVEN.map((c) => c.FX.map((f) => [f.events, f.diff.entered]))));
  for (const seat of [0, 1]) {
    ok('F' + (28 + seat) + ' · LAB-12 · the Garuda seat-' + seat + ' fixture is what a fresh engine run produces today (every field), on the engine it names',
       J(GFX[seat]) === J(forEntry('garuda')(seat)) && GFX[seat].engine.sha256 === liveEngineSha, 'differs from a fresh run');
  }
  ok('F30 · LAB-12 · GARUDA THROUGH THE SAME WAVE-1 GUARD RAIL, both seats: named as a plain string, no wave flag, no option a launch card would not pass; ONE event; the board difference is the Hero entering his own seat heroes row at his printed P7 — untouched by the balance campaign, unlike Mahishi and Vritra. Nothing changed, nothing left, no number: his cleanse strips Venom from friendly Units and an empty board has none',
     GFX.every((f) => {
       const opt = f.scenario, deck = opt['p' + f.attackerSeat + 'Deck'];
       return deck.every((n2) => typeof n2 === 'string') && deck[0] === 'Garuda' && opt.wave1 === undefined &&
              Object.keys(opt).every((k2) => ['p0', 'p1', 'p0Faction', 'p1Faction', 'p0Deck', 'p1Deck', 'mulligan'].indexOf(k2) >= 0) &&
              J(f.events.map((e) => [e.type, e.abilityName || null, e.text || null])) === J([['play', 'Garuda', '{p' + f.attackerSeat + '} plays Garuda']]) &&
              f.diff.changed.length === 0 && f.diff.left.length === 0 && f.diff.entered.length === 1 &&
              f.diff.entered[0].id === 'garuda' && f.diff.entered[0].n === 'Garuda' && f.diff.entered[0].zone === 'heroes' &&
              f.diff.entered[0].eff === 7 && f.diff.entered[0].seat === f.attackerSeat && f.events[0].sourceUid === f.diff.entered[0].uid &&
              f.before.seats[f.attackerSeat].faction === 'devas';
     }), J(GFX.map((f) => [f.events, f.diff.entered])));
  for (const seat of [0, 1]) {
    ok('F' + (31 + seat) + ' · LAB-13 · the Kartikeya seat-' + seat + ' fixture is what a fresh engine run produces today (every field), on the engine it names',
       J(KFX[seat]) === J(forEntry('kartikeya')(seat)) && KFX[seat].engine.sha256 === liveEngineSha, 'differs from a fresh run');
  }
  ok('F33 · LAB-13 · KARTIKEYA THROUGH THE SAME WAVE-1 GUARD RAIL, both seats: named as a plain string, no wave flag, no option a launch card would not pass; ONE event; the board difference is the Hero entering his own seat heroes row at his printed P8. Nothing changed, nothing left, no number: his passive waits for an enemy Astra to resolve against his side, and nothing resolves on an empty board',
     KFX.every((f) => {
       const opt = f.scenario, deck = opt['p' + f.attackerSeat + 'Deck'];
       return deck.every((n2) => typeof n2 === 'string') && deck[0] === 'Kartikeya' && opt.wave1 === undefined &&
              Object.keys(opt).every((k2) => ['p0', 'p1', 'p0Faction', 'p1Faction', 'p0Deck', 'p1Deck', 'mulligan'].indexOf(k2) >= 0) &&
              J(f.events.map((e) => [e.type, e.abilityName || null, e.text || null])) === J([['play', 'Kartikeya', '{p' + f.attackerSeat + '} plays Kartikeya']]) &&
              f.diff.changed.length === 0 && f.diff.left.length === 0 && f.diff.entered.length === 1 &&
              f.diff.entered[0].id === 'kartikeya' && f.diff.entered[0].n === 'Kartikeya' && f.diff.entered[0].zone === 'heroes' &&
              f.diff.entered[0].eff === 8 && f.diff.entered[0].seat === f.attackerSeat && f.events[0].sourceUid === f.diff.entered[0].uid &&
              f.before.seats[f.attackerSeat].faction === 'devas';
     }), J(KFX.map((f) => [f.events, f.diff.entered])));
  NAGAS.forEach((c, k) => { for (const seat of [0, 1]) {
    ok('F' + (34 + k * 2 + seat) + ' · LAB-14 · the ' + c.name + ' seat-' + seat + ' fixture is what a fresh engine run produces today (every field), on the engine it names',
       J(c.FX[seat]) === J(forEntry(c.key)(seat)) && c.FX[seat].engine.sha256 === liveEngineSha, 'differs from a fresh run');
  } });
  ok('F40 · LAB-14 · THE THREE NAGA HEROES THROUGH THE SAME GUARD RAIL, both seats: each named as a plain string, no wave flag, no option a launch card would not pass; ONE event; the board difference is the Hero entering his own seat heroes row at his printed power — Vasuki 8 (Legendary), Takshaka 6 (Epic), Shesha 7 (Legendary), all LAUNCH cards the balance campaign never renumbered. Nothing changed, nothing left, no number: Vasuki takes a power from every enemy Unit and an empty board has none, Takshaka only strips Hero immunity from Naga Astras, and Shesha waits for a lost round',
     NAGAS.every((c) => c.FX.every((f) => {
       const opt = f.scenario, deck = opt['p' + f.attackerSeat + 'Deck'];
       return deck.every((n2) => typeof n2 === 'string') && deck[0] === c.name && opt.wave1 === undefined &&
              Object.keys(opt).every((k2) => ['p0', 'p1', 'p0Faction', 'p1Faction', 'p0Deck', 'p1Deck', 'mulligan'].indexOf(k2) >= 0) &&
              J(f.events.map((e) => [e.type, e.abilityName || null, e.text || null])) === J([['play', c.name, '{p' + f.attackerSeat + '} plays ' + c.name]]) &&
              f.diff.changed.length === 0 && f.diff.left.length === 0 && f.diff.entered.length === 1 &&
              f.diff.entered[0].id === c.key && f.diff.entered[0].n === c.name && f.diff.entered[0].zone === 'heroes' &&
              f.diff.entered[0].eff === c.power && f.diff.entered[0].seat === f.attackerSeat && f.events[0].sourceUid === f.diff.entered[0].uid &&
              f.before.seats[f.attackerSeat].faction === 'nagas';
     })), J(NAGAS.map((c) => c.FX.map((f) => [f.events, f.diff.entered]))));
  WAVE15.forEach((c, k) => { for (const seat of [0, 1]) {
    ok('F' + (41 + k * 2 + seat) + ' · LAB-15 · the ' + c.name + ' seat-' + seat + ' fixture is what a fresh engine run produces today (every field), on the engine it names',
       J(c.FX[seat]) === J(forEntry(c.key)(seat)) && c.FX[seat].engine.sha256 === liveEngineSha, 'differs from a fresh run');
  } });
  ok('F45 · LAB-15 · THE TWO WAVE-1 NAGAS THROUGH THE SAME GUARD RAIL, both seats: each named as a plain string, no wave flag, no option a launch card would not pass; ONE event; the board difference is the Hero entering her own seat heroes row at her printed P7 / P8, neither renumbered by the balance campaign. Nothing changed, nothing left, no number: Padmavati venoms at ROUND END rather than on play, and Kulika transfers Venom from friendly Units to enemies on a board that has neither',
     WAVE15.every((c) => c.FX.every((f) => {
       const opt = f.scenario, deck = opt['p' + f.attackerSeat + 'Deck'];
       return deck.every((n2) => typeof n2 === 'string') && deck[0] === c.name && opt.wave1 === undefined &&
              Object.keys(opt).every((k2) => ['p0', 'p1', 'p0Faction', 'p1Faction', 'p0Deck', 'p1Deck', 'mulligan'].indexOf(k2) >= 0) &&
              J(f.events.map((e) => [e.type, e.abilityName || null, e.text || null])) === J([['play', c.name, '{p' + f.attackerSeat + '} plays ' + c.name]]) &&
              f.diff.changed.length === 0 && f.diff.left.length === 0 && f.diff.entered.length === 1 &&
              f.diff.entered[0].id === c.key && f.diff.entered[0].n === c.name && f.diff.entered[0].zone === 'heroes' &&
              f.diff.entered[0].eff === c.power && f.diff.entered[0].seat === f.attackerSeat && f.events[0].sourceUid === f.diff.entered[0].uid &&
              f.before.seats[f.attackerSeat].faction === 'nagas';
     })), J(WAVE15.map((c) => c.FX.map((f) => [f.events, f.diff.entered]))));
  VAN16.forEach((c, k) => { for (const seat of [0, 1]) {
    ok('F' + (46 + k * 2 + seat) + ' · LAB-16 · the ' + c.name + ' seat-' + seat + ' fixture is what a fresh engine run produces today (every field), on the engine it names',
       J(c.FX[seat]) === J(forEntry(c.key)(seat)) && c.FX[seat].engine.sha256 === liveEngineSha, 'differs from a fresh run');
  } });
  const handDeck = (f) => { const a = f.attackerSeat; return [f.before.seats[a].hand.length, f.after.seats[a].hand.length, f.before.seats[a].deckCount, f.after.seats[a].deckCount]; };
  ok('F50 · LAB-16 · THE TWO VANARA HEROES THROUGH THE GUARD RAIL, both seats: each named as a plain string, no wave flag, no option a launch card would not pass; ONE event; the board difference is the Hero entering his own seat heroes row at his printed power — Sugriva 6, Angad 7, launch Epics the balance campaign never renumbered. A1 holds for both: nothing changed, nothing left, no number. Angad is inert — his hand falls 10 to 9 and his deck is untouched',
     VAN16.every((c) => c.FX.every((f) => {
       const opt = f.scenario, deck = opt['p' + f.attackerSeat + 'Deck'];
       return deck.every((n2) => typeof n2 === 'string') && deck[0] === c.name && opt.wave1 === undefined && deck.filter((n2) => n2 === c.name).length === 1 &&
              Object.keys(opt).every((k2) => ['p0', 'p1', 'p0Faction', 'p1Faction', 'p0Deck', 'p1Deck', 'mulligan'].indexOf(k2) >= 0) &&
              J(f.events.map((e) => [e.type, e.abilityName || null, e.text || null])) === J([['play', c.name, '{p' + f.attackerSeat + '} plays ' + c.name]]) &&
              f.diff.changed.length === 0 && f.diff.left.length === 0 && f.diff.entered.length === 1 &&
              f.diff.entered[0].id === c.key && f.diff.entered[0].n === c.name && f.diff.entered[0].zone === 'heroes' &&
              f.diff.entered[0].eff === c.power && f.diff.entered[0].seat === f.attackerSeat && f.events[0].sourceUid === f.diff.entered[0].uid &&
              f.before.seats[f.attackerSeat].faction === 'vanaras';
     })) && VAN16[1].FX.every((f) => J(handDeck(f)) === J([10, 9, 2, 2])),
     J(VAN16.map((c) => c.FX.map((f) => [f.events.length, f.diff.entered, handDeck(f)]))));
  ok('F51 · LAB-16 · SUGRIVA\'S DRAW, ASSERTED — THE FIRST ON-PLAY ABILITY THAT FIRES ON AN EMPTY BOARD, both seats. Every Hero before him was inert on an empty board. Sugriva is not: "ON PLAY: Draw 1 extra card" RUNS. His hand stays at 10 — one card played, one drawn — and his deck falls from 2 to 1. That is INVISIBLE to both instruments the guard rail uses: the event stream carries only the play, and the board difference carries only his entry. So a silent pass is not acceptable here, and this check reads the effect off the hand and deck counts instead. Contrast Angad on the same seats: hand 10 to 9, deck untouched. This is the template for any future fixture whose Hero carries an on-play ability: assert the ability from the state it changes, whether or not an event or the board reports it',
     VAN16[0].FX.every((f) => J(handDeck(f)) === J([10, 10, 2, 1]) && f.events.length === 1 && f.diff.changed.length === 0) &&
     VAN16[1].FX.every((f) => J(handDeck(f)) === J([10, 9, 2, 2])),
     J({ sugriva: VAN16[0].FX.map(handDeck), angad: VAN16[1].FX.map(handDeck) }));
  VAN17.forEach((c, k) => { for (const seat of [0, 1]) {
    ok('F' + (52 + k * 2 + seat) + ' · LAB-17 · the ' + c.name + ' seat-' + seat + ' fixture is what a fresh engine run produces today (every field), on the engine it names',
       J(c.FX[seat]) === J(forEntry(c.key)(seat)) && c.FX[seat].engine.sha256 === liveEngineSha, 'differs from a fresh run');
  } });
  const hd17 = (f) => { const a = f.attackerSeat; return [f.before.seats[a].hand.length, f.after.seats[a].hand.length, f.before.seats[a].deckCount, f.after.seats[a].deckCount]; };
  ok('F56 · LAB-17 · THE TWO WAVE-1 VANARAS THROUGH THE GUARD RAIL, both seats: each named as a plain string, no wave flag, no option a launch card would not pass; ONE event; the board difference is the Hero entering his or her own seat heroes row at the printed power — Anjana 6, Makardhwaja 7, neither renumbered. Neither changes state: hand 10 to 9, deck untouched',
     VAN17.every((c) => c.FX.every((f) => {
       const opt = f.scenario, deck = opt['p' + f.attackerSeat + 'Deck'];
       return deck.every((n2) => typeof n2 === 'string') && deck[0] === c.name && opt.wave1 === undefined && deck.filter((n2) => n2 === c.name).length === 1 &&
              Object.keys(opt).every((k2) => ['p0', 'p1', 'p0Faction', 'p1Faction', 'p0Deck', 'p1Deck', 'mulligan'].indexOf(k2) >= 0) &&
              J(f.events.map((e) => [e.type, e.abilityName || null, e.text || null])) === J([['play', c.name, '{p' + f.attackerSeat + '} plays ' + c.name]]) &&
              f.diff.changed.length === 0 && f.diff.left.length === 0 && f.diff.entered.length === 1 &&
              f.diff.entered[0].id === c.key && f.diff.entered[0].n === c.name && f.diff.entered[0].zone === 'heroes' &&
              f.diff.entered[0].eff === c.power && f.diff.entered[0].seat === f.attackerSeat && f.events[0].sourceUid === f.diff.entered[0].uid &&
              f.before.seats[f.attackerSeat].faction === 'vanaras' && J(hd17(f)) === J([10, 9, 2, 2]);
     })), J(VAN17.map((c) => c.FX.map((f) => [f.events.length, f.diff.entered, hd17(f)]))));
  {
    // LAB-17 · the log-only ability, asserted — and proven able to fail
    const NOSRC = 'Makardhwaja finds no strength to borrow — he enters at his printed power.';
    const logAssert = (fx) => fx.every((f) => Array.isArray(f.log) && f.log.filter((l) => l === NOSRC).length === 1 && f.events.length === 1 &&
      !f.events.some((e) => e.type === 'buff') && f.diff.entered[0].eff === 7 && J(hd17(f)) === J([10, 9, 2, 2]));
    const MK = VAN17[1].FX, AJ = VAN17[0].FX;
    const clone = (x) => JSON.parse(J(x));
    const branchGone = MK.map((f) => { const g = clone(f); g.log = g.log.filter((l) => l !== NOSRC); return g; });
    const copied = MK.map((f) => { const g = clone(f); g.log = g.log.map((l) => l === NOSRC ? 'Makardhwaja leaps in Nala\u2019s shadow — his strength becomes 4.' : l);
      g.events.push({ type: 'buff', abilityName: 'Makardhwaja', text: 'copies Nala' }); g.diff.entered[0].eff = 4; return g; });
    const negatives = { 'the no-source branch did not run': logAssert(branchGone), 'a source existed and he copied it': logAssert(copied), 'an inert hero (Anjana) passed as Makardhwaja': logAssert(AJ) };
    ok('F57 · LAB-17 · MAKARDHWAJA\'S ABILITY, ASSERTED FROM THE LOG — F51 extended from state to log. His ON PLAY copies the power of Bali or of the strongest friendly Unit; on the empty fixture board there is neither, so his NO-SOURCE branch runs and he enters at his printed 7. That changes NO state (hand 10 to 9, deck untouched) and emits NO event, so neither the state nor the stream can show it ran — but the fixture\'s log carries it: "' + NOSRC + '". This is the mirror of Sugriva, whose draw CHANGED state and logged nothing. The check is falsifiable, and proven so: it rejects a fixture where the branch did not run, one where a source existed and he copied it (a buff event and a different power), and an inert Hero passed off as him — ' + Object.keys(negatives).map((k) => k + ': ' + (negatives[k] ? 'NOT caught' : 'caught')).join(' · '),
       logAssert(MK) && Object.values(negatives).every((v) => v === false),
       J({ real: logAssert(MK), negatives, log: MK.map((f) => f.log) }));
  }
  for (const seat of [0, 1]) {
    ok('F' + (58 + seat) + ' · LAB-18 · the Rahu seat-' + seat + ' fixture is what a fresh engine run produces today (every field), on the engine it names',
       J(RAHU.FX[seat]) === J(forEntry('rahu')(seat)) && RAHU.FX[seat].engine.sha256 === liveEngineSha, 'differs from a fresh run');
  }
  {
    // LAB-18 · the THIRD ability class: inert by TIMING — asserted from the opponent's untouched hand and discard, and proven able to fail
    const foe = (f) => { const o = 1 - f.attackerSeat; return [f.before.seats[o].hand.length, f.after.seats[o].hand.length, f.before.seats[o].discard.length, f.after.seats[o].discard.length]; };
    const own = (f) => { const a = f.attackerSeat; return [f.before.seats[a].hand.length, f.after.seats[a].hand.length, f.before.seats[a].deckCount, f.after.seats[a].deckCount]; };
    ok('F60 · LAB-18 · RAHU THROUGH THE GUARD RAIL, both seats: named as a plain string off the Asura deck path, no wave flag, no option a launch card would not pass; ONE event; the board difference is the Hero entering his own seat heroes row at his printed 4 (a launch Epic the balance campaign never renumbered); nothing changed, nothing left, no number; his own hand falls 10 to 9, deck untouched',
       RAHU.FX.every((f) => { const opt = f.scenario, deck = opt['p' + f.attackerSeat + 'Deck'];
         return deck.every((n2) => typeof n2 === 'string') && deck[0] === 'Rahu' && opt.wave1 === undefined && deck.filter((n2) => n2 === 'Rahu').length === 1 &&
                Object.keys(opt).every((k2) => ['p0', 'p1', 'p0Faction', 'p1Faction', 'p0Deck', 'p1Deck', 'mulligan'].indexOf(k2) >= 0) &&
                J(f.events.map((e) => [e.type, e.abilityName || null, e.text || null])) === J([['play', 'Rahu', '{p' + f.attackerSeat + '} plays Rahu']]) &&
                f.diff.changed.length === 0 && f.diff.left.length === 0 && f.diff.entered.length === 1 && f.diff.entered[0].id === 'rahu' && f.diff.entered[0].zone === 'heroes' &&
                f.diff.entered[0].eff === 4 && f.diff.entered[0].seat === f.attackerSeat && f.events[0].sourceUid === f.diff.entered[0].uid &&
                f.before.seats[f.attackerSeat].faction === 'asuras' && f.before.seats[1 - f.attackerSeat].faction === 'devas' && J(own(f)) === J([10, 9, 2, 2]); }),
       J(RAHU.FX.map((f) => [f.events.length, f.diff.entered, own(f)])));
    const DEVOUR = /^Rahu devours a card from /;
    const inert = (fx) => fx.every((f) => J(foe(f)) === J([10, 10, 0, 0]) && f.before.round === 1 && f.after.round === 1 && !f.log.some((l) => DEVOUR.test(l)) &&
      f.events.length === 1 && f.diff.entered.length === 1 && f.diff.entered[0].id === 'rahu');
    const clone = (x) => JSON.parse(J(x));
    const onPlay = RAHU.FX.map((f) => { const g = clone(f), o = 1 - g.attackerSeat, d = g.after.seats[o].hand.pop(); g.after.seats[o].discard.push(d.id); g.log.push('Rahu devours a card from {p' + o + '}’s hand (' + d.n + ').'); return g; });
    const roundTurned = RAHU.FX.map((f) => { const g = clone(f); g.after.round = 2; return g; });
    const vritra = [0, 1].map((s2) => JSON.parse(fs.readFileSync(path.join(LAB, 'fixtures', 'vritra_seat' + s2 + '.json'), 'utf8')));
    // the ability is REAL and fires at the round's start: drive the engine itself past the round boundary, with and without Rahu on the board
    const LCG = (x) => () => { x = (x * 1103515245 + 12345) % 2147483648; return x / 2147483648; };
    const cross = (f, playRahu) => { const ENG = path.join(GAME, 'src', 'engine.js'); delete require.cache[require.resolve(ENG)]; const E = require(ENG);
      const sc = f.scenario, a = f.attackerSeat, o = 1 - a;
      const g = E.newGame({ rng: LCG(f.seed), p0: sc.p0, p1: sc.p1, realm: 'mrityulok', p0Faction: sc.p0Faction, p1Faction: sc.p1Faction,
        scenario: { p0Deck: sc.p0Deck, p1Deck: sc.p1Deck, p0Hand: sc.p0Deck.slice(0, 10), p1Hand: sc.p1Deck.slice(0, 10), mulligan: 0 } });
      if (playRahu) E.playCard(g, a, g.players[a].hand.findIndex((c) => c.n === 'Rahu')); else E.pass(g, a);
      const atPlay = [g.players[o].hand.length, g.players[o].discard.length], log0 = g.log.length;
      let guard = 0; while (g.round === 1 && guard++ < 6) E.pass(g, g.turn);
      return { atPlay, round: g.round, discard: g.players[o].discard.length, devoured: g.log.slice(log0).filter((l) => DEVOUR.test(l.msg)).length };
    };
    const live = RAHU.FX.map((f) => ({ withRahu: cross(f, true), withoutRahu: cross(f, false) }));
    const liveOk = live.every((r) => J(r.withRahu.atPlay) === J([10, 0]) && r.withRahu.round === 2 && r.withRahu.discard === 1 && r.withRahu.devoured === 1 &&
                                     r.withoutRahu.round === 2 && r.withoutRahu.discard === 0 && r.withoutRahu.devoured === 0);
    const eng = fs.readFileSync(path.join(GAME, 'src', 'engine.js'), 'utf8'), er = eng.indexOf('function endRound('), erEnd = eng.indexOf('\nfunction ', er + 1);
    const hook = eng.indexOf("heroes.some(h=>h.id==='rahu')"), bump = eng.indexOf('g.round++', er);
    const placed = er >= 0 && hook > bump && bump > er && hook < erEnd && eng.split("h.id==='rahu'").length === 2;
    const negatives = { 'an on-play discard (opponent hand 9, discard 1, the devour line)': inert(onPlay), 'the round turned during the play': inert(roundTurned), 'an inert Asura Hero (Vritra) passed as Rahu': inert(vritra) };
    ok('F61 · LAB-18 · RAHU\'S ABILITY, ASSERTED FROM ITS TIMING — the THIRD ability class, completing the table: Sugriva CHANGES STATE (F51, hand and deck), Makardhwaja leaves a LOG line (F57), Rahu fires at a MOMENT THE FIXTURE NEVER REACHES. His PASSIVE ("at the start of each round, the opponent discards 1 random card") lives in endRound after g.round++, not in playCard, so on his play the opponent\'s hand stays 10 and their discard stays empty. That is asserted, and three things make it more than a silent pass: (1) the engine places the hook exactly there (' + (placed ? 'the only rahu hook, inside endRound after the round advances' : 'NOT where expected') + '); (2) the ability is REAL — driving the engine across the round boundary, the opponent loses one card to the discard with the devour line when Rahu is on the board, and none without him (' + J(live.map((r) => [r.withRahu.discard, r.withoutRahu.discard])) + '); (3) the check is falsifiable and rejects ' + Object.keys(negatives).map((k) => k + ': ' + (negatives[k] ? 'NOT caught' : 'caught')).join(' · '),
       inert(RAHU.FX) && placed && liveOk && Object.values(negatives).every((v) => v === false),
       J({ real: inert(RAHU.FX), foe: RAHU.FX.map(foe), placed, live, negatives }));
  }
  {
    // LAB-19 · THE FIRST ASTRA FIXTURE — Vajra, the kill asserted from the engine, and the no-target case asserted too
    const { buildVajra, buildVajraCast } = require(path.join(LAB, 'fixtures', 'make_fixture.js'));
    for (const seat of [0, 1]) {
      ok('F' + (62 + seat) + ' · LAB-19 · the Vajra seat-' + seat + ' fixture is what a fresh engine run produces today (every field), on the engine it names',
         J(VJ.FX[seat]) === J(buildVajra(seat)) && VJ.FX[seat].engine.sha256 === liveEngineSha, 'differs from a fresh run');
    }
    const kill = (fx) => fx.every((f) => { const a = f.attackerSeat, o = 1 - a, mark = f.before.seats[o].units.find((u) => u.id === 'bana');
      return !!mark && mark.eff >= 6 && f.action.legal === true && f.action.card === 'Vajra' && f.before.seats[a].faction === 'devas' && f.before.seats[o].faction === 'asuras' &&
        J(f.events.map((e) => [e.type, e.abilityName || null])) === J([['play', 'Vajra'], ['destroy', 'Vajra']]) && J(f.events[1].targetUids) === J([mark.uid]) &&
        f.log.indexOf('Vajra falls!') >= 0 && f.log.indexOf('Vajra finds no mark.') < 0 &&
        f.diff.left.length === 1 && f.diff.left[0].uid === mark.uid && f.diff.entered.length === 0 && f.diff.changed.length === 0 &&
        f.after.seats[o].units.length === 0 && f.after.seats[o].discard.indexOf('bana') >= 0 && f.after.seats[a].discard.indexOf('vajra') >= 0; });
    const clone = (x) => JSON.parse(J(x));
    const noDestroy = VJ.FX.map((f) => { const g = clone(f); g.events = g.events.filter((e) => e.type !== 'destroy'); return g; });
    const otherCause = VJ.FX.map((f) => { const g = clone(f); g.events[1].abilityName = 'Gandiva'; return g; });
    const survived = VJ.FX.map((f) => { const g = clone(f), o = 1 - g.attackerSeat; g.after.seats[o].units = clone(g.before.seats[o].units); g.diff.left = []; return g; });
    const negK = { 'the destroy event removed': kill(noDestroy), 'the kill credited to another cause (Gandiva)': kill(otherCause), 'the mark survives on the board': kill(survived) };
    ok('F64 · LAB-19 · VAJRA\'S KILL, ASSERTED FROM THE ENGINE, both seats — the premium track\'s first fixture is an ASTRA. The Asura seat moves first and sets Bana Asura down (printed 6, 7 after the first Chaos Surge); the Deva seat casts Vajra ("Destroy one enemy Unit with power 6+"), which is LEGAL in playableIndices. The engine emits exactly play then destroy, both named Vajra, the destroy on the mark; the log says "Vajra falls!"; the board difference is the mark LEAVING (nothing enters, nothing changes) and both cards reach their discards. That destroy is the beat the strike clip lands on. Falsifiable: ' + Object.keys(negK).map((k) => k + ': ' + (negK[k] ? 'NOT caught' : 'caught')).join(' · '),
       kill(VJ.FX) && Object.values(negK).every((v) => v === false), J({ events: VJ.FX.map((f) => f.events), left: VJ.FX.map((f) => f.diff.left) }));
    // the no-target case: the SAME board with a smaller Unit (Vibhishana, 5 after the surge) — driven live, both seats
    const noMark = (seat) => { const p = buildVajraCast(seat, 'Vibhishana', { probe: true }), g = p.g, o = 1 - seat, ev0 = g.events.length, l0 = g.log.length, units0 = g.players[o].units.map((u) => [u.n, p.E.effPower(g, o, u)]);
      p.E.playCard(g, seat, p.vh);
      const batch = { events: g.events.slice(ev0) };
      return { legal: p.legal, units0, events: batch.events.map((e) => e.type + ':' + e.abilityName), log: g.log.slice(l0).map((l) => l.msg), survives: g.players[o].units.length === 1, plan: EC.plan(batch, VJ.M, { mode: 'full' }) }; };
    const nm = [0, 1].map(noMark);
    const noMarkOk = (r) => r.legal === false && r.units0.length === 1 && r.units0[0][0] === 'Vibhishana' && r.units0[0][1] < 6 && J(r.events) === J(['play:Vajra']) &&
      r.log.indexOf('Vajra finds no mark.') >= 0 && r.log.indexOf('Vajra falls!') < 0 && r.survives && r.plan.strike === false && r.plan.clip === false && J(r.plan.cues.map((c) => c.cue)) === J(['cast', 'settle']);
    const doctored = nm.map((r) => Object.assign({}, r, { legal: true })), doctored2 = nm.map((r) => Object.assign({}, r, { events: r.events.concat(['destroy:Vajra']) }));
    ok('F65 · LAB-19 · THE NO-TARGET CASE, driven live, both seats: the same board with a smaller mark (Vibhishana, ' + nm[0].units0[0][1] + ' after the surge) — Vajra is NOT playable, and a forced cast emits only the play, logs "Vajra finds no mark.", destroys nothing (the Unit survives), and the clip\'s plan has NO strike and NO clip (cast, then settle). The two cases are one builder and one board apart, so the kill in F64 is the mark, not the fixture. Falsifiable: a no-target run claiming legality is ' + (doctored.every(noMarkOk) ? 'NOT caught' : 'caught') + ', one carrying a destroy event is ' + (doctored2.every(noMarkOk) ? 'NOT caught' : 'caught'),
       nm.every(noMarkOk) && !doctored.every(noMarkOk) && !doctored2.every(noMarkOk), J(nm.map((r) => Object.assign({}, r, { plan: r.plan.cues }))));
  }
  {
    // LAB-20 · THE FIRST CHAIN'S FIXTURE — Sudarshana Chakra: a REMOVAL asserted from the engine, and the no-target case
    const { buildSudarshana, buildSudarshanaCast } = require(path.join(LAB, 'fixtures', 'make_fixture.js'));
    for (const seat of [0, 1]) {
      ok('F' + (66 + seat) + ' · LAB-20 · the Sudarshana seat-' + seat + ' fixture is what a fresh engine run produces today (every field), on the engine it names',
         J(SU.FX[seat]) === J(buildSudarshana(seat)) && SU.FX[seat].engine.sha256 === liveEngineSha, 'differs from a fresh run');
    }
    const LINE = 'Sudarshana Chakra removes Mahabali for this round.';
    const removal = (fx) => fx.every((f) => { const a = f.attackerSeat, o = 1 - a, hero = f.before.seats[o].heroes.find((h) => h.id === 'mahabali');
      return !!hero && f.action.legal === true && f.action.card === 'Sudarshana Chakra' && f.before.seats[a].faction === 'devas' && f.before.seats[o].faction === 'asuras' &&
        J(f.events.map((e) => [e.type, e.abilityName || null, e.text || null])) === J([['play', 'Sudarshana Chakra', '{p' + a + '} plays Sudarshana Chakra'], ['passive', 'Sudarshana', 'removed']]) && J(f.events[1].targetUids) === J([hero.uid]) &&
        f.log.filter((l) => l === LINE).length === 1 && f.log.indexOf('Sudarshana finds no Hero.') < 0 &&
        f.after.seats[o].heroes.every((h) => h.uid !== hero.uid) && J(f.after.seats[o].discard) === J(f.before.seats[o].discard) && f.after.seats[o].discard.indexOf('mahabali') < 0 &&
        f.diff.left.length === 1 && f.diff.left[0].uid === hero.uid && f.diff.left[0].zone === 'heroes' && f.diff.entered.length === 0 && f.diff.changed.length === 0 && f.after.seats[a].discard.indexOf('sudarshana') >= 0; });
    const clone = (x) => JSON.parse(J(x));
    const noPassive = SU.FX.map((f) => { const g = clone(f); g.events = g.events.filter((e) => e.type !== 'passive'); return g; });
    const slain = SU.FX.map((f) => { const g = clone(f); g.after.seats[1 - g.attackerSeat].discard.push('mahabali'); return g; });
    const stays = SU.FX.map((f) => { const g = clone(f), o = 1 - g.attackerSeat; g.after.seats[o].heroes = clone(g.before.seats[o].heroes); g.diff.left = []; return g; });
    const other = SU.FX.map((f) => { const g = clone(f); g.log = g.log.map((l) => l === LINE ? 'Sudarshana Chakra destroys Mahabali.' : l); return g; });
    const negR = { 'the removal event gone': removal(noPassive), 'a KILL passed off as a removal (the Hero in the discard)': removal(slain), 'the Hero still on its row': removal(stays), 'the log naming a destroy': removal(other) };
    ok('F68 · LAB-20 · SUDARSHANA\'S REMOVAL, ASSERTED FROM THE ENGINE, both seats — a REMOVAL, not a kill ("Remove one enemy Hero for this round. It returns next round at half power."). The Asura seat sets Mahabali down; the Deva seat casts Sudarshana Chakra, LEGAL in playableIndices. The engine emits exactly play then passive "Sudarshana" "removed" on Mahabali (no destroy event: there is no destroy beat to land on — the strike lands on the bite); the log says "' + LINE + '"; the Hero leaves its row and does NOT reach the discard, which is untouched; nothing enters, nothing changes. The snapshot format is untouched, so the removal is read from the event, the log, the row and the discard. Falsifiable: ' + Object.keys(negR).map((k) => k + ': ' + (negR[k] ? 'NOT caught' : 'caught')).join(' · '),
       removal(SU.FX) && Object.values(negR).every((v) => v === false), J({ events: SU.FX.map((f) => f.events), log: SU.FX.map((f) => f.log), left: SU.FX.map((f) => f.diff.left) }));
    const noHero = (seat) => { const p = buildSudarshanaCast(seat, 'Vibhishana', { probe: true }), g = p.g, o = 1 - seat, ev0 = g.events.length, l0 = g.log.length, units0 = g.players[o].units.map((u) => u.n), heroes0 = g.players[o].heroes.length;
      p.E.playCard(g, seat, p.sh);
      const batch = { events: g.events.slice(ev0) };
      return { legal: p.legal, units0, heroes0, events: batch.events.map((e) => e.type + ':' + e.abilityName), log: g.log.slice(l0).map((l) => l.msg), survives: g.players[o].units.length === 1, plan: EC.plan(batch, SU.spec, { mode: 'full', casterSeat: seat }) }; };
    const nh = [0, 1].map(noHero);
    const noHeroOk = (r) => r.legal === false && r.heroes0 === 0 && J(r.units0) === J(['Vibhishana']) && J(r.events) === J(['play:Sudarshana Chakra']) && r.log.indexOf('Sudarshana finds no Hero.') >= 0 && r.survives &&
      r.plan.strike === false && r.plan.clip === false && r.plan.segments.length === 0 && J(r.plan.cues.map((c) => c.cue)) === J(['cast', 'settle']);
    const dn1 = nh.map((r) => Object.assign({}, r, { legal: true })), dn2 = nh.map((r) => Object.assign({}, r, { events: r.events.concat(['passive:Sudarshana']) })), dn3 = nh.map((r) => Object.assign({}, r, { plan: Object.assign({}, r.plan, { segments: [{ role: 'invoke' }] }) }));
    ok('F69 · LAB-20 · THE NO-TARGET CASE, driven live, both seats: the same builder with a Unit instead of a Hero (Vibhishana — inert to Astras, where Bana Asura would react) — Sudarshana is NOT playable, and a forced cast emits only the play and logs "Sudarshana finds no Hero."; the Unit survives; and the chain\'s plan plays NOTHING, the invocation included (no segment, no clip: cast, then settle). Falsifiable: a run claiming legality is ' + (dn1.every(noHeroOk) ? 'NOT caught' : 'caught') + ', one carrying a removal event is ' + (dn2.every(noHeroOk) ? 'NOT caught' : 'caught') + ', a plan that still plays the invocation is ' + (dn3.every(noHeroOk) ? 'NOT caught' : 'caught'),
       nh.every(noHeroOk) && !dn1.every(noHeroOk) && !dn2.every(noHeroOk) && !dn3.every(noHeroOk), J(nh.map((r) => Object.assign({}, r, { plan: r.plan.cues }))));
  }
  {
    const labFiles = [];
    (function walk(d) { for (const n of fs.readdirSync(d)) { if (n === 'node_modules' || n === '.venv' || n === 'actors' || n === 'sources' || n === 'frames') continue;
      const f = path.join(d, n); const st = fs.statSync(f); if (st.isDirectory()) walk(f); else if (/[.](js|json|html|py)$/.test(n)) labFiles.push(f); } })(LAB);
    const scanned = labFiles.filter((f) => f !== __filename);   // this suite is the scanner: it has to name the flag it forbids
    const offenders = scanned.filter((f) => /wave1/.test(fs.readFileSync(f, 'utf8')));
    ok('F27 · LAB-11 · THE NO-SHIM PIN: no file in lab/ mentions the wave flag at all — not the fixtures, not the registry, not the lab page, not the pack tool (this suite is exempt: it is the scanner, so it must name what it forbids). Wave-1 cards live in the engine behind the draft filter mkPlayer applies to the RANDOM pool; CARD_BY_NAME is built from every deck, so a scenario deck that NAMES one reaches it. The shim was never built because it was never needed (' + scanned.length + ' lab files scanned)',
       offenders.length === 0, offenders.map((f) => rel(f)).join(', '));
  }
}

// ═══ C · THE CONTEXT ═══
console.log('\n── C · the ClashContext adapter ──');
const CTX = FX.map((f) => CC.fromBatch(f)), ICTX = IFX.map((f) => CC.fromBatch(f)), BCTX = BFX.map((f) => CC.fromBatch(f)), VCTX = VFXF.map((f) => CC.fromBatch(f));
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
  const I = IFX.map((f) => CC.fromBatch(f));
  ok('C6 · LAB-6 · Indra\'s context, both seats: a Deva Legendary Hero on the Deva seat, in scope; the board difference is one ENTER at 7 with nothing evented (so SETTLE lands it whole), no rest of batch; ENTRY = SETTLE = FINAL = the engine\'s AFTER',
     I.every((c, s) => { const b = CC.boards(c, IFX[s].before, IFX[s].after);
       return c.cardId === 'indra' && c.cardType === 'hero' && c.rarity === 'L' && c.faction === 'devas' && c.seat === IFX[s].attackerSeat && c.scope === 'manifest' && c.rest.length === 0 &&
              c.boardDiff.length === 1 && c.boardDiff[0].kind === 'enter' && c.boardDiff[0].to === 7 && c.boardDiff[0].evented === 0 && c.boardDiff[0].settleTo === 7 &&
              J(CC.project(b.entry)) === J(CC.project(IFX[s].after)) && J(b.settle) === J(IFX[s].after) && J(b.final) === J(IFX[s].after); }), J(I));
  ok('C7 · LAB-7 · Bali\'s context, both seats: a Vanara Legendary Hero on the Vanara seat, in scope, card id "hanuman" (the registry key) named Bali; one ENTER at 9 with nothing evented, no rest of batch; ENTRY = SETTLE = FINAL = the engine\'s AFTER',
     BCTX.every((c, s) => { const b = CC.boards(c, BFX[s].before, BFX[s].after);
       return c.cardId === 'hanuman' && !!REG[c.cardId] && c.cardName === 'Bali' && c.cardType === 'hero' && c.rarity === 'L' && c.faction === 'vanaras' && c.seat === BFX[s].attackerSeat && c.scope === 'manifest' && c.rest.length === 0 &&
              c.boardDiff.length === 1 && c.boardDiff[0].kind === 'enter' && c.boardDiff[0].to === 9 && c.boardDiff[0].evented === 0 &&
              J(CC.project(b.entry)) === J(CC.project(BFX[s].after)) && J(b.settle) === J(BFX[s].after) && J(b.final) === J(BFX[s].after); }), J(BCTX));
  ok('C8 · LAB-8 · Varuna\'s context, both seats: a Deva Epic Hero on the Deva seat, in scope; one ENTER at 6 with nothing evented, no rest of batch; ENTRY = SETTLE = FINAL = the engine\'s AFTER',
     VCTX.every((c, s) => { const b = CC.boards(c, VFXF[s].before, VFXF[s].after);
       return c.cardId === 'varuna' && !!REG[c.cardId] && c.cardType === 'hero' && c.rarity === 'E' && c.faction === 'devas' && c.seat === VFXF[s].attackerSeat && c.scope === 'manifest' && c.rest.length === 0 &&
              c.boardDiff.length === 1 && c.boardDiff[0].kind === 'enter' && c.boardDiff[0].to === 6 && c.boardDiff[0].evented === 0 &&
              J(CC.project(b.entry)) === J(CC.project(VFXF[s].after)) && J(b.settle) === J(VFXF[s].after) && J(b.final) === J(VFXF[s].after); }), J(VCTX));
  ok('C9 · LAB-9 · the three launch characters\' contexts, both seats: each is a Hero of his own faction and rarity, in scope, keyed by his ENGINE id (Shukracharya is "shukra"); one ENTER with nothing evented, no rest of batch; ENTRY = SETTLE = FINAL = the engine\'s AFTER',
     NINE.every((n, k) => n.FX.map((f) => CC.fromBatch(f)).every((c, s) => { const b = CC.boards(c, n.FX[s].before, n.FX[s].after);
       return c.cardId === n.key && !!REG[c.cardId] && c.cardType === 'hero' && c.rarity === ['E', 'L', 'E'][k] && c.faction === ['devas', 'asuras', 'asuras'][k] && c.scope === 'manifest' && c.rest.length === 0 &&
              c.boardDiff.length === 1 && c.boardDiff[0].kind === 'enter' && c.boardDiff[0].evented === 0 &&
              J(CC.project(b.entry)) === J(CC.project(n.FX[s].after)) && J(b.settle) === J(n.FX[s].after) && J(b.final) === J(n.FX[s].after); })),
     J(NINE.map((n) => n.FX.map((f) => CC.fromBatch(f).cardId))));
  ok('C10 · LAB-11 · the two WAVE-1 heroes contexts, both seats: each is a Legendary Asura Hero, in scope, keyed by his own engine id (here folder, fixture and engine id all agree); one ENTER with nothing evented, at the engine power the balance ladder left him (Mahishi 5, Vritra 6); no rest of batch; ENTRY = SETTLE = FINAL = the engine AFTER',
     ELEVEN.every((n) => n.FX.map((f) => CC.fromBatch(f)).every((c, s) => { const b = CC.boards(c, n.FX[s].before, n.FX[s].after);
       return c.cardId === n.key && !!REG[c.cardId] && c.cardType === 'hero' && c.rarity === 'L' && c.faction === 'asuras' && c.seat === n.FX[s].attackerSeat && c.scope === 'manifest' && c.rest.length === 0 &&
              c.boardDiff.length === 1 && c.boardDiff[0].kind === 'enter' && c.boardDiff[0].to === n.power && c.boardDiff[0].evented === 0 &&
              J(CC.project(b.entry)) === J(CC.project(n.FX[s].after)) && J(b.settle) === J(n.FX[s].after) && J(b.final) === J(n.FX[s].after); })),
     J(ELEVEN.map((n) => n.FX.map((f) => CC.fromBatch(f).cardId))));
  ok('C11 · LAB-12 · Garuda context, both seats: a Legendary Deva Hero, in scope, keyed by his engine id; one ENTER at his printed P7 with nothing evented; no rest of batch; ENTRY = SETTLE = FINAL = the engine AFTER',
     GFX.map((f) => CC.fromBatch(f)).every((c, s2) => { const b = CC.boards(c, GFX[s2].before, GFX[s2].after);
       return c.cardId === 'garuda' && !!REG[c.cardId] && c.cardType === 'hero' && c.rarity === 'L' && c.faction === 'devas' && c.seat === GFX[s2].attackerSeat && c.scope === 'manifest' && c.rest.length === 0 &&
              c.boardDiff.length === 1 && c.boardDiff[0].kind === 'enter' && c.boardDiff[0].to === 7 && c.boardDiff[0].evented === 0 &&
              J(CC.project(b.entry)) === J(CC.project(GFX[s2].after)) && J(b.settle) === J(GFX[s2].after) && J(b.final) === J(GFX[s2].after); }),
     J(GFX.map((f) => CC.fromBatch(f).cardId)));
  ok('C12 · LAB-13 · Kartikeya context, both seats: a Legendary Deva Hero, in scope, keyed by his engine id; one ENTER at his printed P8 with nothing evented; no rest of batch; ENTRY = SETTLE = FINAL = the engine AFTER',
     KFX.map((f) => CC.fromBatch(f)).every((c, s2) => { const b = CC.boards(c, KFX[s2].before, KFX[s2].after);
       return c.cardId === 'kartikeya' && !!REG[c.cardId] && c.cardType === 'hero' && c.rarity === 'L' && c.faction === 'devas' && c.seat === KFX[s2].attackerSeat && c.scope === 'manifest' && c.rest.length === 0 &&
              c.boardDiff.length === 1 && c.boardDiff[0].kind === 'enter' && c.boardDiff[0].to === 8 && c.boardDiff[0].evented === 0 &&
              J(CC.project(b.entry)) === J(CC.project(KFX[s2].after)) && J(b.settle) === J(KFX[s2].after) && J(b.final) === J(KFX[s2].after); }),
     J(KFX.map((f) => CC.fromBatch(f).cardId)));
  ok('C13 · LAB-14 · the three NAGA Heroes contexts, both seats: each a Hero of the NAGA faction — the first the lab has staged — at his own rarity and printed power, in scope, keyed by his engine id; one ENTER with nothing evented; no rest of batch; ENTRY = SETTLE = FINAL = the engine AFTER',
     NAGAS.every((n) => n.FX.map((f) => CC.fromBatch(f)).every((c, s2) => { const b = CC.boards(c, n.FX[s2].before, n.FX[s2].after);
       return c.cardId === n.key && !!REG[c.cardId] && c.cardType === 'hero' && c.rarity === n.rarity && c.faction === 'nagas' && c.seat === n.FX[s2].attackerSeat && c.scope === 'manifest' && c.rest.length === 0 &&
              c.boardDiff.length === 1 && c.boardDiff[0].kind === 'enter' && c.boardDiff[0].to === n.power && c.boardDiff[0].evented === 0 &&
              J(CC.project(b.entry)) === J(CC.project(n.FX[s2].after)) && J(b.settle) === J(n.FX[s2].after) && J(b.final) === J(n.FX[s2].after); })),
     J(NAGAS.map((n) => n.FX.map((f) => CC.fromBatch(f).cardId))));
  ok('C14 · LAB-15 · the two WAVE-1 Naga Heroes contexts, both seats: each a Legendary Naga Hero, in scope, keyed by her engine id; one ENTER at her printed power with nothing evented; no rest of batch; ENTRY = SETTLE = FINAL = the engine AFTER',
     WAVE15.every((n) => n.FX.map((f) => CC.fromBatch(f)).every((c, s2) => { const b = CC.boards(c, n.FX[s2].before, n.FX[s2].after);
       return c.cardId === n.key && !!REG[c.cardId] && c.cardType === 'hero' && c.rarity === n.rarity && c.faction === 'nagas' && c.seat === n.FX[s2].attackerSeat && c.scope === 'manifest' && c.rest.length === 0 &&
              c.boardDiff.length === 1 && c.boardDiff[0].kind === 'enter' && c.boardDiff[0].to === n.power && c.boardDiff[0].evented === 0 &&
              J(CC.project(b.entry)) === J(CC.project(n.FX[s2].after)) && J(b.settle) === J(n.FX[s2].after) && J(b.final) === J(n.FX[s2].after); })),
     J(WAVE15.map((n) => n.FX.map((f) => CC.fromBatch(f).cardId))));
  ok('C15 · LAB-16 · the two Vanara Heroes contexts, both seats: each an Epic Vanara Hero, in scope, keyed by his engine id; one ENTER at his printed power with nothing evented; no rest of batch; ENTRY = SETTLE = FINAL = the engine AFTER',
     VAN16.every((n) => n.FX.map((f) => CC.fromBatch(f)).every((c, s2) => { const b = CC.boards(c, n.FX[s2].before, n.FX[s2].after);
       return c.cardId === n.key && !!REG[c.cardId] && c.cardType === 'hero' && c.rarity === n.rarity && c.faction === 'vanaras' && c.seat === n.FX[s2].attackerSeat && c.scope === 'manifest' && c.rest.length === 0 &&
              c.boardDiff.length === 1 && c.boardDiff[0].kind === 'enter' && c.boardDiff[0].to === n.power && c.boardDiff[0].evented === 0 &&
              J(CC.project(b.entry)) === J(CC.project(n.FX[s2].after)) && J(b.settle) === J(n.FX[s2].after) && J(b.final) === J(n.FX[s2].after); })),
     J(VAN16.map((n) => n.FX.map((f) => CC.fromBatch(f).cardId))));
  ok('C16 · LAB-17 · the two Wave-1 Vanara Heroes contexts, both seats: each a Legendary Vanara Hero, in scope, keyed by the engine id; one ENTER at the printed power with nothing evented; no rest of batch; ENTRY = SETTLE = FINAL = the engine AFTER',
     VAN17.every((n) => n.FX.map((f) => CC.fromBatch(f)).every((c, s2) => { const b = CC.boards(c, n.FX[s2].before, n.FX[s2].after);
       return c.cardId === n.key && !!REG[c.cardId] && c.cardType === 'hero' && c.rarity === n.rarity && c.faction === 'vanaras' && c.seat === n.FX[s2].attackerSeat && c.scope === 'manifest' && c.rest.length === 0 &&
              c.boardDiff.length === 1 && c.boardDiff[0].kind === 'enter' && c.boardDiff[0].to === n.power && c.boardDiff[0].evented === 0 &&
              J(CC.project(b.entry)) === J(CC.project(n.FX[s2].after)) && J(b.settle) === J(n.FX[s2].after) && J(b.final) === J(n.FX[s2].after); })),
     J(VAN17.map((n) => n.FX.map((f) => CC.fromBatch(f).cardId))));
  ok('C17 · LAB-18 · the Rahu context, both seats: an Epic Asura Hero, in scope, keyed by his engine id; one ENTER at his printed 4 with nothing evented; no rest of batch; ENTRY = SETTLE = FINAL = the engine AFTER',
     RAHU.FX.map((f) => CC.fromBatch(f)).every((c, s2) => { const b = CC.boards(c, RAHU.FX[s2].before, RAHU.FX[s2].after);
       return c.cardId === 'rahu' && !!REG[c.cardId] && c.cardType === 'hero' && c.rarity === 'E' && c.faction === 'asuras' && c.seat === RAHU.FX[s2].attackerSeat && c.scope === 'manifest' && c.rest.length === 0 &&
              c.boardDiff.length === 1 && c.boardDiff[0].kind === 'enter' && c.boardDiff[0].to === 4 && c.boardDiff[0].evented === 0 &&
              J(CC.project(b.entry)) === J(CC.project(RAHU.FX[s2].after)) && J(b.settle) === J(RAHU.FX[s2].after) && J(b.final) === J(RAHU.FX[s2].after); }),
     J(RAHU.FX.map((f) => CC.fromBatch(f).cardId)));
  ok('C18 · LAB-19 · A2 STANDS FOR THE ASTRA: the Vajra context, both seats, is a Legendary Deva ASTRA keyed by its id and OUT of the actor scope — the adapter the actors use is unchanged (its scope is still Hero and Unit only); the strike clip never enters the director, and the board difference is the mark leaving to the discard',
     VJ.FX.map((f) => CC.fromBatch(f)).every((c, s2) => c.cardId === 'vajra' && c.cardType === 'astra' && c.rarity === 'L' && c.faction === 'devas' && c.seat === VJ.FX[s2].attackerSeat && c.scope === 'out' &&
       c.boardDiff.length === 1 && c.boardDiff[0].kind === 'left' && c.boardDiff[0].toDiscard === true) && J(Object.keys(CC.SCOPE)) === J(['hero', 'unit']) && !REG.vajra.manifest && !!REG.vajra.effect,
     J(VJ.FX.map((f) => CC.fromBatch(f))));
  ok('C19 · LAB-20 · A2 STANDS FOR THE MYTHIC ASTRA: the Sudarshana context, both seats, is a Mythic Deva ASTRA out of the actor scope; its board difference is the enemy Hero LEAVING its row and NOT to the discard (a removal, not a kill)',
     SU.FX.map((f) => CC.fromBatch(f)).every((c, s2) => c.cardId === 'sudarshana' && c.cardType === 'astra' && c.rarity === 'M' && c.faction === 'devas' && c.seat === SU.FX[s2].attackerSeat && c.scope === 'out' &&
       c.boardDiff.length === 1 && c.boardDiff[0].kind === 'left' && c.boardDiff[0].zone === 'heroes' && c.boardDiff[0].toDiscard === false) && !REG.sudarshana.manifest && !!REG.sudarshana.effect,
     J(SU.FX.map((f) => CC.fromBatch(f))));
}

const LADDER = {};   // (label helper — the plan reports the ladder itself)
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
    const NT = { fps: MANIFEST.fps, emerge: MANIFEST.phases.emerge.length, act: MANIFEST.phases.act.length, contact: MANIFEST.contact, emergeMs: MANIFEST.phaseMs.emerge, actMs: MANIFEST.phaseMs.act };
    const ms = (n, k) => Math.round(n * k);   // LAB-4d: the manifest's own phase lengths at tempo 1
    const RA = NT.act * 1000 / NT.actMs, RE = NT.emerge * 1000 / NT.emergeMs;
    const nat = (s, m) => DIR.plan(CTX[s], { mode: m, ladderExempt: true, timing: NT });
    const okNative = [0, 1].every((s) => ['full', 'fast'].every((m) => {
      const k = m === 'fast' ? 0.5 : 1, p = nat(s, m), [A, E, C, Z, S] = p.phases, c = p.cues.find((x) => x.cue === 'contact'), a = p.cues.find((x) => x.cue === 'actor-phase' && x.phase === 'act');
      return p.timing === 'native' && A.t1 - A.t0 === 400 * k && E.t1 - E.t0 === ms(NT.emergeMs, k) && C.t1 - C.t0 === ms(NT.actMs, k) && Z.t1 - Z.t0 === 600 * k && S.t1 - S.t0 === 400 * k &&
             c.t === C.t0 + Math.ceil(NT.contact * 1000 / (RA / k)) && c.contactCell === NT.contact && Math.floor((c.t - C.t0) * (RA / k) / 1000 + 1e-6) === NT.contact &&
             Math.abs(p.cellFps - RA / k) < 1e-9 && Math.abs(p.cellFpsEmerge - RE / k) < 1e-9 && p.cues.filter((x) => x.cue === 'actor-phase').every((x) => Math.abs(x.cellFps - (x.phase === 'emerge' ? RE : RA) / k) < 1e-9) &&
             Math.abs(a.contactFrac - NT.contact / NT.act) < 1e-9 && p.total === S.t1;
    }));
    const notExempt = DIR.plan(CTX[0], { mode: 'full', ladderExempt: false, timing: NT });
    const full = nat(0, 'full');
    ok('T11 · NATIVE TIMING from the real manifest (' + NT.emerge + ' EMERGE + ' + NT.act + ' ACT cells in ' + NT.emergeMs + ' + ' + NT.actMs + ' ms at tempo 1, contact = ACT cell ' + NT.contact + '): EMERGE ' + (full.phases[1].t1 - full.phases[1].t0) + ' ms · ACT ' + (full.phases[2].t1 - full.phases[2].t0) + ' ms · total ' + full.total + ' ms; the actor phases carry the cells\' rates (count ÷ phase length, EMERGE and ACT each their own; twice in Fast) and the contact cue lands at the first ms the contact cell is on stage (LAB-4a); Fast halves it; both seats; LAB-6: native timing applies to a card that is NOT ladder-exempt too — the plan plays its clip and still reports what the rarity ladder would give',
       okNative && notExempt.timing === 'native' && notExempt.total === full.total && notExempt.ladderMs === 2500 && /^rarity R \(the ladder would give 2500 ms\) · native 24 fps$/.test(notExempt.ladder) && Math.abs(full.total - 3200) <= 60);
  }
  {
    const NT2 = { fps: MANIFEST.fps, emerge: MANIFEST.phases.emerge.length, act: MANIFEST.phases.act.length, contact: MANIFEST.contact };
    const tuned = (seat, m, o) => DIR.plan(CTX[seat], Object.assign({ mode: m, ladderExempt: true, timing: NT2 }, o));
    const len = (p, n) => { const x = p.phases.find((y) => y.name === n); return x.t1 - x.t0; };
    const shown = [];
    const okTempo = [0, 1].every((seat) => [[0.7, null], [0.8, 1200], [1.5, 300], [1, 1500]].every(([tp, fz]) => ['full', 'fast'].every((m) => {
      const k = m === 'fast' ? 0.5 : 1, p = tuned(seat, m, { tempo: tp, fizzleMs: fz }), rate = 24 * tp / k, C = p.phases[2], Z = p.phases[3], S = p.phases[4], c = p.cues.find((x) => x.cue === 'contact');
      const tl = p.timeline, line = DIR.formatPlan(p).split('\n')[2];
      const n = /AWAKEN (\d+) · EMERGE (\d+) · ACT (\d+) · contact \+(\d+) \(at (\d+)\) · FIZZLE (\d+) · SETTLE (\d+) · total (\d+)/.exec(line);
      if (seat === 0 && m === 'full') shown.push(tp + '×, FIZZLE ' + (fz == null ? 600 : fz) + ' → ' + line.replace('Timeline (ms): ', ''));
      return Math.abs(p.cellFps - rate) < 1e-9 && p.cues.filter((x) => x.cue === 'actor-phase').every((x) => Math.abs(x.cellFps - rate) < 1e-9 && x.cellStep === (m === 'fast' ? 2 : 1)) &&
        len(p, 'AWAKEN') === Math.round(400 / tp * k) && len(p, 'EMERGE') === Math.round(NT2.emerge * 1000 / (24 * tp) * k) && len(p, 'ACT') === Math.round(NT2.act * 1000 / (24 * tp) * k) &&
        len(p, 'FIZZLE') === Math.round((fz == null ? 600 : fz) * k) && len(p, 'SETTLE') === Math.round(400 / tp * k) && p.fizzleMs === len(p, 'FIZZLE') &&
        c.contactCell === NT2.contact && Math.floor((c.t - C.t0) * rate / 1000 + 1e-6) === NT2.contact && S.t0 === Z.t1 && p.cues.find((x) => x.cue === 'settle').t === Z.t1 && p.cues.find((x) => x.cue === 'actor-gone').t === Z.t1 &&
        tl.awaken + tl.emerge + tl.act + tl.fizzle + tl.settle === p.total && tl.total === p.total && !!n && +n[1] + +n[2] + +n[3] + +n[6] + +n[7] === +n[8] && +n[8] === p.total && +n[5] === c.t && +n[4] === c.t - C.t0;
    })));
    const LABJS3 = fs.readFileSync(path.join(LAB, 'lab.js'), 'utf8');
    ok('T12 · TEMPO AND FIZZLE (LAB-4c): tempo scales the clip\'s cells (24 × tempo cells/s) and AWAKEN, EMERGE, ACT and SETTLE with them; FIZZLE takes its own length; Fast halves both and may step 2 cells, Full 1; contact still lands on the contact cell and the board settles the moment FIZZLE ends; unset, the plan is today\'s field for field; a grammar plan scales too; the Plan readout\'s Timeline line sums to its total; the lab passes both sliders to every play — ' + shown.join(' | '),
       okTempo && J(tuned(0, 'full', {})) === J(tuned(0, 'full', { tempo: 1, fizzleMs: 600 })) && tuned(0, 'full', {}).total === 400 + Math.round(NT2.emerge * 1000 / 24) + Math.round(NT2.act * 1000 / 24) + 600 + 400 &&
       DIR.plan(CTX[0], { mode: 'full', ladderExempt: true, tempo: 0.5 }).total === 6400 && DIR.plan(CTX[0], { mode: 'full', ladderExempt: true, fizzleMs: 1200 }).total === 3800 && DIR.plan(CTX[0], { mode: 'full', ladderExempt: true }).total === 3200 &&
       /timing, tempo, fizzleMs, exit: exitFor\(reg, mf, ctx\) \}\);/.test(LABJS3) && /el\('tempo'\)\.oninput/.test(LABJS3) && /el\('fizzle-ms'\)\.oninput/.test(LABJS3));
  }
  {
    const REGJ = JSON.parse(fs.readFileSync(path.join(LAB, 'data', 'manifestations.json'), 'utf8')), FFXJ = JSON.parse(fs.readFileSync(path.join(LAB, 'data', 'factionfx.json'), 'utf8')), DS4 = lib('dissolve');
    const NTM = { fps: MANIFEST.fps, emerge: MANIFEST.phases.emerge.length, act: MANIFEST.phases.act.length, contact: MANIFEST.contact, emergeMs: MANIFEST.phaseMs.emerge, actMs: MANIFEST.phaseMs.act };
    const dflt = MAN.defaultsFor({ manifest: MANIFEST, registry: REGJ, preset: DS4.pick(FFXJ, CTX[0].faction, '') });
    const bare = Object.assign({}, MANIFEST); delete bare.tempo;
    const inherit = MAN.defaultsFor({ manifest: bare, registry: REGJ, preset: DS4.pick(FFXJ, 'devas', '') });
    const builtin = MAN.defaultsFor({ manifest: bare, registry: {}, preset: {} });
    const over = MAN.defaultsFor({ manifest: MANIFEST, registry: REGJ, preset: DS4.pick(FFXJ, 'asuras', ''), override: { tempo: 0.9, fizzleMs: 700 } });
    const planD = (m) => DIR.plan(CTX[0], { mode: m, ladderExempt: true, timing: NTM, tempo: dflt.tempo, fizzleMs: dflt.fizzleMs });
    const FULLD = planD('full'), FASTD = planD('fast'), tlOf = (p) => [p.timeline.awaken, p.timeline.emerge, p.timeline.act, p.timeline.fizzle, p.timeline.settle, p.timeline.total];
    const RAD = NTM.act * 1000 / NTM.actMs * dflt.tempo, cD = FULLD.cues.find((x) => x.cue === 'contact'), CD = FULLD.phases[2];
    const LABJS5 = fs.readFileSync(path.join(LAB, 'lab.js'), 'utf8'), PAGE5 = fs.readFileSync(path.join(LAB, 'index.html'), 'utf8');
    ok('T13 · THE OWNER\'S DEFAULTS (LAB-4d, ruling 2026-09-13): Meghnad\'s manifest carries tempo ' + MANIFEST.tempo + ' and the Asura preset fizzle_ms ' + FFXJ.asuras.fizzle_ms + '; data/manifestations.json carries the card-agnostic defaults ' + JSON.stringify(REGJ.defaults) + ' that a card without its own tempo and a preset without its own fizzle_ms inherit (the built-ins 1× / 600 ms only when neither exists); a slider override wins for the session; the lab resolves them through ActorManifest.defaultsFor and its sliders start on them; and the plan they give is the ruling\'s timeline — Full ' + DIR.formatPlan(FULLD).split('\n')[2].replace('Timeline (ms): ', '') + ' · Fast ' + tlOf(FASTD).join(' / ') + ' ms',
       MANIFEST.tempo === 0.6 && FFXJ.asuras.fizzle_ms === 1500 && REGJ.defaults.tempo === 0.6 && REGJ.defaults.fizzle_ms === 1500 &&
       dflt.tempo === 0.6 && dflt.fizzleMs === 1500 && dflt.from.tempo === 'manifest' && dflt.from.fizzleMs === 'preset' &&
       inherit.tempo === 0.6 && inherit.from.tempo === 'defaults' && inherit.fizzleMs === 1500 && inherit.from.fizzleMs === 'defaults' &&
       builtin.tempo === 1 && builtin.fizzleMs === 600 && builtin.from.tempo === 'built-in' && over.tempo === 0.9 && over.fizzleMs === 700 && over.from.tempo === 'slider' && over.base.tempo === 0.6 && over.base.fizzleMs === 1500 &&
       J(tlOf(FULLD)) === J([667, 972, 2013, 1500, 667, 5819]) && J(tlOf(FASTD)) === J([333, 486, 1007, 750, 333, 2909]) &&
       cD.contactCell === NTM.contact && MANIFEST.cells[MANIFEST.phases.act[NTM.contact]].src === MANIFEST.audit.contactSrc && MANIFEST.audit.contactSrc === 69 && Math.floor((cD.t - CD.t0) * RAD / 1000 + 1e-6) === NTM.contact &&
       FULLD.cues.filter((x) => x.cue === 'actor-phase').every((x) => x.cellStep === 1) && FASTD.cues.filter((x) => x.cue === 'actor-phase').every((x) => x.cellStep === 2) &&
       /window\.ActorManifest\.defaultsFor\(/.test(LABJS5) && /REG_DEFAULTS = j\.defaults/.test(LABJS5) && /if \(tempoOverride == null\) el\('tempo'\)\.value = t\.base\.tempo;/.test(LABJS5) && /if \(fizzleOverride == null\) el\('fizzle-ms'\)\.value = t\.base\.fizzleMs;/.test(LABJS5) &&
       /el\('tempo'\)\.oninput = \(e\) => \{ tempoOverride = \+e\.target\.value;/.test(LABJS5) && /el\('fizzle-ms'\)\.oninput = \(e\) => \{ fizzleOverride = \+e\.target\.value;/.test(LABJS5) &&
       /<input id="tempo" type="range" min="0\.5" max="1\.5" step="0\.05" value="0\.6">/.test(PAGE5) && /<input id="fizzle-ms" type="range" min="300" max="1500" step="50" value="1500">/.test(PAGE5),
       J({ dflt, inherit, builtin, over, full: tlOf(FULLD), fast: tlOf(FASTD) }));
  }
  {
    // LAB-10 · Indra and Bali now play their clips' own endings: the same native-exit plan as the launch characters, each keeping its own contact rule
    const REGI = JSON.parse(fs.readFileSync(path.join(LAB, 'data', 'manifestations.json'), 'utf8')), FFXI = JSON.parse(fs.readFileSync(path.join(LAB, 'data', 'factionfx.json'), 'utf8')), DSI = lib('dissolve');
    [['T14', 'indra', IMAN, ICTX], ['T15', 'hanuman', BMAN, BCTX]].forEach(([TN, KEY, M10, C10]) => {
      const NAME = REGI.cards[KEY].name, FAC = C10[0].faction, TO = C10[0].boardDiff[0].to, RULE = (M10.audit.recipe || {}).contact;
      const nt = { fps: M10.fps, emerge: M10.phases.emerge.length, act: M10.phases.act.length, contact: M10.contact, emergeMs: M10.phaseMs.emerge, actMs: M10.phaseMs.act };
      const d10 = MAN.defaultsFor({ manifest: M10, registry: REGI, preset: DSI.pick(FFXI, FAC, '') }), ex = MAN.exitMode({ entry: REGI.cards[KEY], manifest: M10 });
      const plan10 = (seat, m) => DIR.plan(C10[seat], { mode: m, prior: 0, timing: nt, tempo: d10.tempo, fizzleMs: d10.fizzleMs, exit: ex.exit });
      const okN = [0, 1].every((seat) => ['full', 'fast'].every((m) => {
        const k = m === 'fast' ? 0.5 : 1, p = plan10(seat, m), C = p.phases.find((x) => x.name === 'ACT'), S = p.phases.find((x) => x.name === 'SETTLE'), c = p.cues.find((x) => x.cue === 'contact'), st = p.cues.filter((x) => x.cue === 'settle');
        return p.exit === 'native' && p.phases.map((x) => x.name).join(',') === 'AWAKEN,EMERGE,ACT,SETTLE' && p.timeline.fizzle === 0 &&
               !p.cues.some((x) => x.cue === 'exit-fx' || (x.cue === 'actor-phase' && x.phase === 'fizzle')) && c.contactCell === M10.contact && C.t1 === S.t0 &&
               p.cues.find((x) => x.cue === 'actor-gone').t === S.t0 && st.length === 1 && J(st[0].floats) === J([]) && J(st[0].changes.map((x) => [x.kind, x.n, x.to])) === J([['enter', NAME, TO]]) &&
               J([p.timeline.awaken, p.timeline.emerge, p.timeline.act, p.timeline.settle]) === J([Math.round(400 / d10.tempo * k), Math.round(nt.emergeMs / d10.tempo * k), Math.round(nt.actMs / d10.tempo * k), Math.round(400 / d10.tempo * k)]);
      }));
      const full = plan10(0, 'full'), fast = plan10(0, 'fast');
      ok(TN + ' · LAB-10 · ' + NAME.toUpperCase() + '\'S PLAN, both seats, Full and Fast: the clip\'s own ending, so the registry asks for the native exit and the plan carries NO FIZZLE — AWAKEN, EMERGE, ACT, SETTLE (' + nt.emerge + ' EMERGE + ' + nt.act + ' ACT cells in ' + nt.emergeMs + ' + ' + nt.actMs + ' ms at tempo 1); the contact keeps its own rule (' + RULE + ') on ACT cell ' + M10.contact + ' = f' + String(M10.cells[M10.phases.act[M10.contact]].src).padStart(3, '0') + '; tempo ' + d10.tempo + ' inherited; he performs where he stands (travelScale ' + MAN.travelScale(M10) + '); SETTLE lands his entry at ' + TO + ' with no number — Full ' + [full.timeline.awaken, full.timeline.emerge, full.timeline.act, full.timeline.settle].join(' / ') + ' = ' + full.total + ' ms, Fast ' + fast.total + ' ms; the rarity ladder would give ' + full.ladderMs + ' ms',
         okN && ex.exit === 'native' && M10.tempo === undefined && d10.tempo === 0.6 && d10.from.tempo === 'defaults' && MAN.travelScale(M10) === 0 && M10.exit === 'native' && M10.phases.fizzle === undefined && Math.abs(fast.total - full.total / 2) <= 3,
         J({ full: full.timeline, exit: ex, travelScale: MAN.travelScale(M10) }));
    });
  }
  {
    // LAB-8 · the native exit in the director
    const REGV = JSON.parse(fs.readFileSync(path.join(LAB, 'data', 'manifestations.json'), 'utf8')), FFXV = JSON.parse(fs.readFileSync(path.join(LAB, 'data', 'factionfx.json'), 'utf8')), DSV = lib('dissolve');
    const ntV = { fps: VMAN.fps, emerge: VMAN.phases.emerge.length, act: VMAN.phases.act.length, contact: VMAN.contact, emergeMs: VMAN.phaseMs.emerge, actMs: VMAN.phaseMs.act };
    const dV = MAN.defaultsFor({ manifest: VMAN, registry: REGV, preset: DSV.pick(FFXV, VCTX[0].faction, '') }), exV = MAN.exitMode({ entry: REGV.cards.varuna, manifest: VMAN });
    const planV = (seat, m, x) => DIR.plan(VCTX[seat], Object.assign({ mode: m, prior: 0, timing: ntV, tempo: dV.tempo, fizzleMs: dV.fizzleMs, exit: exV.exit }, x || {}));
    const names = (p) => p.phases.map((x) => x.name).join(',');
    const okV = [0, 1].every((seat) => ['full', 'fast'].every((m) => {
      const k = m === 'fast' ? 0.5 : 1, p = planV(seat, m), C = p.phases.find((x) => x.name === 'ACT'), S = p.phases.find((x) => x.name === 'SETTLE'), c = p.cues.find((x) => x.cue === 'contact');
      return p.exit === 'native' && names(p) === 'AWAKEN,EMERGE,ACT,SETTLE' && !p.cues.some((x) => x.cue === 'exit-fx' || (x.cue === 'actor-phase' && x.phase === 'fizzle')) && p.timeline.fizzle === 0 &&
             C.t1 === S.t0 && p.cues.find((x) => x.cue === 'actor-gone').t === S.t0 && c.contactCell === 0 && c.t === C.t0 && /no FIZZLE \(native exit\)/.test(DIR.formatPlan(p)) &&
             J([p.timeline.awaken, p.timeline.emerge, p.timeline.act, p.timeline.settle]) === J([Math.round(400 / dV.tempo * k), Math.round(ntV.emergeMs / dV.tempo * k), Math.round(ntV.actMs / dV.tempo * k), Math.round(400 / dV.tempo * k)]);
    }));
    const grammar = DIR.plan(VCTX[0], { mode: 'full', exit: 'native' }), full = planV(0, 'full'), fast = planV(0, 'fast');
    const iT = { fps: IMAN.fps, emerge: IMAN.phases.emerge.length, act: IMAN.phases.act.length, contact: IMAN.contact, emergeMs: IMAN.phaseMs.emerge, actMs: IMAN.phaseMs.act };
    const same = J(DIR.plan(ICTX[0], { mode: 'full', timing: iT, tempo: 0.6, fizzleMs: 1500 })) === J(DIR.plan(ICTX[0], { mode: 'full', timing: iT, tempo: 0.6, fizzleMs: 1500, exit: 'procedural' }));
    const modes = { varuna: exV, preview: MAN.exitMode({ entry: REGV.cards.varuna, manifest: VMAN, override: 'devas' }), indra: MAN.exitMode({ entry: REGV.cards.indra, manifest: IMAN }), meghnad: MAN.exitMode({ entry: REGV.cards.meghnad, manifest: MANIFEST }), notPacked: MAN.exitMode({ entry: REGV.cards.varuna, manifest: MANIFEST }) };
    ok('T16 · LAB-8 · VARUNA\'S PLAN, THE NATIVE EXIT, both seats, Full and Fast: the registry asks for exit "native" and the manifest is a native-exit pack, so the plan has NO FIZZLE — AWAKEN, EMERGE, ACT, SETTLE; no exit-fx and no fizzle phase cue; the actor goes at SETTLE, holding its last cell until then; contact on ACT cell 0 (f086) the moment ACT starts; tempo ' + dV.tempo + ' inherited — Full ' + [full.timeline.awaken, full.timeline.emerge, full.timeline.act, full.timeline.settle].join(' / ') + ' = ' + full.total + ' ms, Fast ' + fast.total + ' ms. Guards: without native timing the grammar keeps its FIZZLE (' + names(grammar) + '); an Exit preset preview plays the procedural dissolve (' + modes.preview.exit + '); Meghnad, the last procedural card, stays procedural and his plan is identical with or without the exit option (LAB-10 sent Indra native too); a registry that asks for a native exit on a pack that is not one is refused (' + modes.notPacked.exit + ', flagged)',
       okV && full.total >= 7000 && full.total <= 7400 && Math.abs(fast.total - full.total / 2) <= 3 && /FIZZLE/.test(names(grammar)) && grammar.exit === 'procedural' && same &&
       modes.varuna.exit === 'native' && modes.preview.exit === 'procedural' && modes.indra.exit === 'native' && modes.meghnad.exit === 'procedural' && modes.notPacked.exit === 'procedural' && modes.notPacked.error === true,
       J({ full: full.timeline, fast: fast.timeline, modes }));
  }
  {
    // LAB-9 · the three launch characters' plans: the same native exit, each with his own audited contact cell
    const REG9 = JSON.parse(fs.readFileSync(path.join(LAB, 'data', 'manifestations.json'), 'utf8')), FFX9 = JSON.parse(fs.readFileSync(path.join(LAB, 'data', 'factionfx.json'), 'utf8')), DS9 = lib('dissolve');
    NINE.forEach((n, k) => {
      const CTXn = n.FX.map((f) => CC.fromBatch(f)), M9 = n.M;
      const nt = { fps: M9.fps, emerge: M9.phases.emerge.length, act: M9.phases.act.length, contact: M9.contact, emergeMs: M9.phaseMs.emerge, actMs: M9.phaseMs.act };
      const d9 = MAN.defaultsFor({ manifest: M9, registry: REG9, preset: DS9.pick(FFX9, CTXn[0].faction, '') }), ex = MAN.exitMode({ entry: REG9.cards[n.key], manifest: M9 });
      const planN = (seat, m) => DIR.plan(CTXn[seat], { mode: m, prior: 0, timing: nt, tempo: d9.tempo, fizzleMs: d9.fizzleMs, exit: ex.exit });
      const okp = [0, 1].every((seat) => ['full', 'fast'].every((m) => {
        const kk = m === 'fast' ? 0.5 : 1, p = planN(seat, m), C = p.phases.find((x) => x.name === 'ACT'), S = p.phases.find((x) => x.name === 'SETTLE'), c = p.cues.find((x) => x.cue === 'contact');
        return p.exit === 'native' && p.phases.map((x) => x.name).join(',') === 'AWAKEN,EMERGE,ACT,SETTLE' && p.timeline.fizzle === 0 && !p.cues.some((x) => x.cue === 'exit-fx' || (x.cue === 'actor-phase' && x.phase === 'fizzle')) &&
               c.contactCell === M9.contact && C.t1 === S.t0 && p.cues.find((x) => x.cue === 'actor-gone').t === S.t0 &&
               J([p.timeline.awaken, p.timeline.emerge, p.timeline.act, p.timeline.settle]) === J([Math.round(400 / d9.tempo * kk), Math.round(nt.emergeMs / d9.tempo * kk), Math.round(nt.actMs / d9.tempo * kk), Math.round(400 / d9.tempo * kk)]);
      }));
      const full = planN(0, 'full'), fast = planN(0, 'fast'), st = MAN.contactStrength(M9);
      ok('T' + (17 + k) + ' · LAB-9 · ' + REG9.cards[n.key].name.toUpperCase() + '\'S PLAN, both seats, Full and Fast: native timing (' + nt.emerge + ' EMERGE + ' + nt.act + ' ACT cells in ' + nt.emergeMs + ' + ' + nt.actMs + ' ms at tempo 1), tempo ' + d9.tempo + ' and the native exit inherited from the registry — no FIZZLE, no exit cue, the actor gone at SETTLE; contact on ACT cell ' + M9.contact + ' = f' + String(M9.cells[M9.phases.act[M9.contact]].src).padStart(3, '0') + ' with strength ' + J(st) + ' — Full ' + [full.timeline.awaken, full.timeline.emerge, full.timeline.act, full.timeline.settle].join(' / ') + ' = ' + full.total + ' ms, Fast ' + fast.total + ' ms; the ' + (LADDER[M9.cardId] || '') + 'ladder would give ' + full.ladderMs + ' ms',
         okp && ex.exit === 'native' && M9.tempo === undefined && d9.tempo === 0.6 && d9.from.tempo === 'defaults' && Math.abs(fast.total - full.total / 2) <= 3,
         J({ timeline: full.timeline, contact: M9.contact, exit: ex }));
    });
  }
  const txt = DIR.formatPlan(P(0, 'full'));
  ok('T10 · the Plan readout is the timeline as text: the header, every phase, every cue in time order with its numbers', /Meghnad · seat 0 → toward seat 1 · mode full/.test(txt) && /AWAKEN 0–400/.test(txt) && /2800 ms  settle Meghnad enters at 6, Indra 7→5 \(−2\)/.test(txt) && /queue buff · Chaos Surge \+1/.test(txt) && txt.split('\n').length === P(0, 'full').cues.length + 3 && /Timeline \(ms\): AWAKEN 400 · EMERGE 600 · ACT 1200 · contact \+696 \(at 1696\) · FIZZLE 600 · SETTLE 400 · total 3200 · tempo 1\.00×/.test(txt), txt.split('\n').slice(0, 4).join(' | '));
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
     v.ok && !!px && px.w === MANIFEST.atlasSize.w && px.h === MANIFEST.atlasSize.h && px.w <= 4096 && px.h <= 4096 && MANIFEST.cells.length >= 36 && MANIFEST.cells.length <= 60 && MANIFEST.tempo === 0.6 && !!MANIFEST.phaseMs && MANIFEST.phaseMs.emerge === 583 && MANIFEST.phaseMs.act === 1208 && Array.isArray(MANIFEST.audit.duplicatesDropped) &&
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
     J(fs.readdirSync(path.join(LAB, 'actors', 'meghnad')).sort()) === J(['atlas.webp', 'atlas_256.webp', 'manifest.json']));
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
    ['a tempo of 0', (m) => { m.tempo = 0; }, /tempo must be/],
    ['a phase length of 0', (m) => { m.phaseMs = { emerge: 583, act: 0 }; }, /phaseMs must give/],
    ['a rung cell over its size', (m) => { m.rungs[0].cells[0].w = 300; }, /rung 0 cell 0 exceeds 256/],
    ['a rung missing a cell', (m) => { m.rungs[0].cells.pop(); }, /rung 0 must hold every cell/],
  ];
  const results = bad.map(([name, mutate, re]) => { const m = JSON.parse(J(MANIFEST)); mutate(m); const r = MAN.validate(m); return [name, !r.ok && r.errors.some((e) => re.test(e)), r.errors.join('; ')]; });
  ok('M4 · validation refuses, each with its reason: ' + bad.map((b) => b[0]).join(' · '), results.every((x) => x[1]), J(results.filter((x) => !x[1])));
  {
    const R256 = (MANIFEST.rungs || []).find((r) => r.cellMax === 256), f256 = path.join(LAB, 'actors', 'meghnad', 'atlas_256.webp');
    const a256 = fs.existsSync(f256) ? fs.readFileSync(f256) : null, px256 = a256 && webpSize(a256);
    const d512 = MAN.decodedBytes(MANIFEST), m256 = MAN.forRung(MANIFEST, 256), d256 = MAN.decodedBytes(m256);
    const cellsMatch = !!R256 && R256.cells.every((c, i) => c.src === MANIFEST.cells[i].src && Math.max(c.w, c.h) <= 256 && Math.abs(c.w - MANIFEST.cells[i].w / 2) <= 1 && Math.abs(c.h - MANIFEST.cells[i].h / 2) <= 1);
    const A = [512, 256];
    const picks = { gpuRetina: MAN.pickRung({ backend: 'webgpu', dpr: 3, available: A }).rung, gpuRetinaLowMemory: MAN.pickRung({ backend: 'webgl', dpr: 2, deviceMemory: 2, available: A }).rung,
                    gpuDpr1: MAN.pickRung({ backend: 'webgpu', dpr: 1, available: A }).rung, canvas2d: MAN.pickRung({ backend: 'canvas2d', dpr: 3, deviceMemory: 8, available: A }).rung,
                    override512: MAN.pickRung({ backend: 'canvas2d', dpr: 1, override: '512', available: A }).rung, override256: MAN.pickRung({ backend: 'webgpu', dpr: 3, override: 256, available: A }).rung,
                    only512: MAN.pickRung({ backend: 'canvas2d', available: [512] }).rung };
    ok('M5 · THE QUALITY RUNG (LAB-5, A5): the pack tool emits a 256 px atlas beside the 512 — every cell, in order, half size (' + (px256 ? px256.w + '×' + px256.h : '?') + ', ' + (a256 ? (a256.length / 1024).toFixed(0) : '?') + ' KB); decoded ' + (d256 / 1048576).toFixed(1) + ' MB against ' + (d512 / 1048576).toFixed(1) + ' MB (' + (100 * d256 / d512).toFixed(1) + '% — at most a quarter); forRung draws from it with refHeight halved, so the actor keeps its size on the board; the device pick: ' + J(picks),
       MAN.validate(MANIFEST).ok && !!R256 && !!px256 && px256.w === R256.atlasSize.w && px256.h === R256.atlasSize.h && cellsMatch && d256 * 4 <= d512 && m256.cells === R256.cells && m256.refHeight === R256.refHeight && m256.atlas === 'atlas_256.webp' &&
       MAN.forRung(MANIFEST, 512) === MANIFEST && J(MAN.rungsOf(MANIFEST)) === J(A) &&
       J(picks) === J({ gpuRetina: 512, gpuRetinaLowMemory: 256, gpuDpr1: 256, canvas2d: 256, override512: 512, override256: 256, only512: 512 }));
  }
}

// LAB-7: the template's actor check, once per character (M6 Indra, M7 Bali)
const templateActor = (S) => {
  const IMAN = S.M, v = MAN.validate(IMAN), atl = fs.readFileSync(path.join(LAB, 'actors', S.folder, IMAN.atlas)), px = webpSize(atl);
  const a256 = fs.readFileSync(path.join(LAB, 'actors', S.folder, 'atlas_256.webp')), p256 = webpSize(a256), R = (IMAN.rungs || [])[0] || {};
  const au = IMAN.audit || {}, src = IMAN.cells.map((c) => c.src), E = IMAN.phases.emerge.map((i) => src[i]), A = IMAN.phases.act.map((i) => src[i]);
  const per = au.recipe && au.recipe.msPerSourceFrame, d512 = MAN.decodedBytes(IMAN), d256 = MAN.decodedBytes(MAN.forRung(IMAN, 256));
  const pivOk = Array.isArray(au.pivotSrc) && IMAN.cells.every((c) => Array.isArray(c.origin) && Math.abs(c.origin[0] + c.pivot.x / au.scale - au.pivotSrc[0]) <= 1 && Math.abs(c.origin[1] + c.pivot.y / au.scale - au.pivotSrc[1]) <= 1);
  ok(S.label + ': a valid actor from the named Kling clip — ' + IMAN.cells.length + ' cells, every usable frame f' + src[0] + '–f' + src[src.length - 1] + ' in order (EMERGE ' + E.length + ' = f' + E[0] + '–f' + E[E.length - 1] + ', ACT ' + A.length + ' = f' + A[0] + '–f' + A[A.length - 1] + ', true duplicates dropped ' + J(au.duplicatesDropped) + '), the idle head and Kling\'s dissolve dropped; contact f' + A[IMAN.contact] + ' (' + S.contactNote + '); ONE feet pivot for every cell (clip ' + J(au.pivotSrc) + '); facing ' + IMAN.facing + ', aim ' + IMAN.aim + '; phase lengths from the frame ranges at Meghnad\'s tuned pace (' + J(IMAN.phaseMs) + ' ms), NO tempo on the card (inherited); matte "' + (au.recipe && au.recipe.matte) + '" with an ' + (au.recipe && au.recipe.feather) + ' px edge feather; atlases ' + (px ? px.w + '×' + px.h : '?') + ' (' + (atl.length / 1024).toFixed(0) + ' KB, ' + (d512 / 1048576).toFixed(1) + ' MB decoded) and ' + (p256 ? p256.w + '×' + p256.h : '?') + ' (' + (a256.length / 1024).toFixed(0) + ' KB, ' + (d256 / 1048576).toFixed(1) + ' MB — ' + (100 * d256 / d512).toFixed(1) + '%); the folder holds only the two atlases and the manifest',
     v.ok && !!px && px.w === IMAN.atlasSize.w && px.h === IMAN.atlasSize.h && px.w <= 4096 && px.h <= 4096 && !!p256 && p256.w === R.atlasSize.w && p256.h === R.atlasSize.h && d256 * 4 <= d512 * 1.02 &&
     IMAN.placeholder === false && IMAN.source.indexOf('Kling clip ' + S.clip + ' (sha256 ' + S.sha) === 0 && IMAN.source.indexOf(', chroma ' + S.chroma + ')') > 0 && IMAN.cardId === S.cardId && IMAN.fps === 24 && IMAN.timing === 'native' &&
     IMAN.tempo === undefined && (S.aim ? IMAN.aim === S.aim : IMAN.aim == null) && IMAN.facing === S.facing && Math.max(...IMAN.cells.map((c) => Math.max(c.w, c.h))) === (IMAN.cellPx || 512) &&
     src[0] === S.emerge[0] && src[src.length - 1] === S.act[1] && src.every((x, i) => i === 0 || x > src[i - 1]) && J(au.emerge) === J(S.emerge) && J(au.act) === J(S.act) && J(au.droppedTail) === J(S.act[1] === 120 ? null : [S.act[1] + 1, 120]) &&
     E.length + A.length === IMAN.cells.length && E[E.length - 1] < A[0] && A[IMAN.contact] === au.contactSrc && au.contactSrc >= S.contactIn[0] && au.contactSrc <= S.contactIn[1] && (IMAN.exit === 'native' ? IMAN.phases.fizzle === undefined : J(IMAN.phases.fizzle) === J([IMAN.cells.length - 1])) &&
     pivOk && !!per && IMAN.phaseMs.emerge === Math.round((au.emerge[1] - au.emerge[0] + 1) * 583 / 23) && IMAN.phaseMs.act === Math.round((au.act[1] - au.act[0] + 1) * 1208 / 32) &&
     au.recipe.matte === 'bright' && au.recipe.feather === 8 && au.recipe.contact === S.contact && au.recipe.keyChannel === S.keyChannel && au.recipe.pivot === 'feet' && MANIFEST.audit.recipe && MANIFEST.audit.recipe.matte === 'dark-body' &&
     J(fs.readdirSync(path.join(LAB, 'actors', S.folder)).sort()) === J(['atlas.webp', 'atlas_256.webp', 'manifest.json']) && !MAN.validate(Object.assign({}, IMAN, { aim: 'sideways' })).ok, v.errors.join('; '));
};
templateActor({ label: 'M6 · LAB-6 · INDRA BY THE TEMPLATE', M: IMAN, folder: 'indra', cardId: 'indra', clip: 'kling_20260914_VIDEO_Preserve_I_5205_0.mp4', sha: '4c78b5fba361', chroma: 'green',
  emerge: [36, 52], act: [53, 120], contactIn: [53, 60], contact: 'bolt-edge', contactNote: 'the bolt fully out to the frame edge', aim: 'up', facing: 'right', keyChannel: 'G' });
templateActor({ label: 'M7 · LAB-7 · BALI BY THE TEMPLATE (engine id "hanuman", chroma BLUE)', M: BMAN, folder: 'bali', cardId: 'hanuman', clip: 'kling_20260914_VIDEO_Preserve_B_5645_0.mp4', sha: 'e67eec3588e7', chroma: 'blue',
  emerge: [28, 56], act: [57, 109], contactIn: [60, 68], contact: 'ground-impact', contactNote: 'the mace head reaches the ground band clear of the feet', aim: null, facing: 'left', keyChannel: 'B' });
templateActor({ label: 'M9 · LAB-8 · VARUNA BY THE TEMPLATE (engine id "varuna", the first native exit)', M: VMAN, folder: 'varuna', cardId: 'varuna', clip: 'varuna_green.mp4', sha: 'c0a66fb3c2ca', chroma: 'green',
  emerge: [0, 85], act: [86, 120], contactIn: [86, 86], contact: 'nova', contactNote: 'nova: the orb burst begins, the audited frame', aim: null, facing: 'right', keyChannel: 'G' });
{
  const v = MAN.validate(VMAN), n = VMAN.cells.length, ft = (VMAN.audit || {}).fadeTail || [];
  const withFizzle = MAN.validate(Object.assign({}, VMAN, { phases: Object.assign({}, VMAN.phases, { fizzle: [n - 1] }) }));
  const shortAct = MAN.validate(Object.assign({}, VMAN, { phases: Object.assign({}, VMAN.phases, { act: VMAN.phases.act.slice(0, -1) }) }));
  const badRule = MAN.validate(Object.assign({}, VMAN, { contactRule: 'sideways' })), badPx = MAN.validate(Object.assign({}, VMAN, { cellPx: 300 })), procNoFizzle = MAN.validate(Object.assign({}, MANIFEST, { phases: { emerge: MANIFEST.phases.emerge, act: MANIFEST.phases.act } }))   // LAB-10: Meghnad is the procedural card now;
  ok('M10 · LAB-8 · THE NATIVE-EXIT PACK: exit "native" with no fizzle phase and ACT ending on the last cell (the guard refuses a fizzle phase, an ACT that stops short, and a procedural actor without its fizzle phase); contact rule "nova" on ACT cell 0 = f086; the fade tail bakes a linear alpha ramp into the last 10 cells (' + ft.map((x) => 'f' + x[0] + ' ' + Math.round(x[1] * 100) + '%').join(' · ') + '); cellMax stays the A4 ceiling 512 with cellPx ' + VMAN.cellPx + ' recorded (256 rung: cellPx ' + (VMAN.rungs[0] || {}).cellPx + '); atlas lever: ' + J(VMAN.audit.atlasLever) + '; straight alpha, normal blend, no motion vectors, no vignette; Meghnad — the last procedural card after LAB-10 — carries none of the new fields',
     v.ok && VMAN.exit === 'native' && VMAN.phases.fizzle === undefined && VMAN.phases.act[VMAN.phases.act.length - 1] === n - 1 && !withFizzle.ok && !shortAct.ok && !badRule.ok && !badPx.ok && !procNoFizzle.ok &&
     VMAN.contactRule === 'nova' && VMAN.contact === 0 && VMAN.cells[VMAN.phases.act[0]].src === 86 &&
     ft.length === 10 && J(ft.map((x) => x[0])) === J(VMAN.cells.slice(-10).map((c) => c.src)) && ft.every((x, k) => Math.abs(x[1] - (1 - k / 9)) < 1e-4) &&
     VMAN.cellMax === 512 && VMAN.cellPx === Math.max(...VMAN.cells.map((c) => Math.max(c.w, c.h))) && VMAN.audit.atlasLever === 'none' && VMAN.mv === false && VMAN.vignette === false && VMAN.blend === 'normal' && VMAN.alpha === 'straight' &&
     [MANIFEST].every((m) => m.exit === undefined && m.contactRule === undefined && m.cellPx === undefined && Array.isArray(m.phases.fizzle)), J({ errors: v.errors, withFizzle: withFizzle.errors, shortAct: shortAct.errors, lever: VMAN.audit.atlasLever }));
}
templateActor({ label: 'M11 · LAB-9 · AGNI BY THE TEMPLATE (native exit, nova on the burst)', M: AMAN, folder: 'agni', cardId: 'agni', clip: 'agni_green.mp4', sha: '07e0abc7ee58', chroma: 'green',
  emerge: [0, 85], act: [86, 120], contactIn: [98, 98], contact: 'nova', contactNote: 'nova: the engulfing burst begins, the audited frame', aim: null, facing: 'left', keyChannel: 'G' });
templateActor({ label: 'M12 · LAB-9 · MAHABALI BY THE TEMPLATE (the throne is part of the actor)', M: MMAN, folder: 'mahabali', cardId: 'mahabali', clip: 'mahabali_green.mp4', sha: '7968a5d9652c', chroma: 'green',
  emerge: [0, 93], act: [94, 120], contactIn: [96, 96], contact: 'nova', contactNote: 'nova: the flame engulfment, the audited frame', aim: null, facing: 'right', keyChannel: 'G' });
templateActor({ label: 'M13 · LAB-9 · SHUKRACHARYA BY THE TEMPLATE (engine id "shukra", a SELF-CAST)', M: SMAN, folder: 'shukracharya', cardId: 'shukra', clip: 'shukracharya_green.mp4', sha: 'fab80598f0fd', chroma: 'green',
  emerge: [0, 63], act: [64, 120], contactIn: [64, 64], contact: 'nova', contactNote: 'nova: the cast at his hand, the audited frame', aim: null, facing: 'left', keyChannel: 'G' });
templateActor({ label: 'M16 · LAB-11 · MAHISHI BY THE TEMPLATE (a WAVE-1 hero; the idle head dropped, the tail trimmed)', M: MHMAN, folder: 'mahishi', cardId: 'mahishi', clip: 'mahishi_green.mp4', sha: '8196bcfa57cd', chroma: 'green',
  emerge: [33, 55], act: [56, 115], contactIn: [56, 56], contact: 'nova', contactNote: 'nova: the frame the fire arc goes radial, the audited frame', aim: null, facing: 'left', keyChannel: 'G' });
templateActor({ label: 'M17 · LAB-11 · VRITRA BY THE TEMPLATE (a WAVE-1 hero; a coiled serpent, so the feet pivot is his COIL BASE)', M: VRMAN, folder: 'vritra', cardId: 'vritra', clip: 'vritra_green.mp4', sha: 'e6f2a6280074', chroma: 'green',
  emerge: [0, 71], act: [72, 112], contactIn: [72, 72], contact: 'nova', contactNote: 'nova: the top of the rear, where the roar IS the strike', aim: null, facing: 'left', keyChannel: 'G' });
templateActor({ label: 'M19 · LAB-12 · GARUDA BY THE TEMPLATE (a WAVE-1 hero; a permanent HOVERER, so the feet pivot is his TALON TIPS)', M: GMAN, folder: 'garuda', cardId: 'garuda', clip: 'garuda_green.mp4', sha: '856705e3e752', chroma: 'green',
  emerge: [0, 39], act: [40, 116], contactIn: [41, 41], contact: 'nova', contactNote: 'nova: the wing snap, where the burst is born', aim: null, facing: 'left', keyChannel: 'G' });
templateActor({ label: 'M21 · LAB-13 · KARTIKEYA BY THE TEMPLATE (a WAVE-1 hero; the first MAGENTA ground, keyed on the R+B PAIR)', M: KMAN, folder: 'kartikeya', cardId: 'kartikeya', clip: 'kartikeya_magenta.mp4', sha: '77a3e64d4010', chroma: 'magenta',
  emerge: [0, 44], act: [45, 102], contactIn: [50, 50], contact: 'bolt-edge', contactNote: 'the lance reaches the frame edge', aim: null, facing: 'right', keyChannel: 'RB' });
templateActor({ label: 'M26 · LAB-14 · VASUKI BY THE TEMPLATE (the first NAGA actor; a coil, so the feet pivot is his COIL BASE)', M: NAGAS[0].M, folder: 'vasuki', cardId: 'vasuki', clip: 'vasuki_magenta.mp4', sha: '84dd0c075088', chroma: 'magenta',
  emerge: [0, 44], act: [45, 120], contactIn: [45, 45], contact: 'nova', contactNote: 'nova: the ring pulse is born, the audited frame', aim: null, facing: 'right', keyChannel: 'RB' });
templateActor({ label: 'M27 · LAB-14 · TAKSHAKA BY THE TEMPLATE (a coil base pivot and a guarded bottom feather)', M: NAGAS[1].M, folder: 'takshaka', cardId: 'takshaka', clip: 'takshaka_magenta.mp4', sha: 'bfe28171255f', chroma: 'magenta',
  emerge: [0, 54], act: [55, 110], contactIn: [56, 56], contact: 'nova', contactNote: 'nova: the arcs sweep out, the audited frame', aim: null, facing: 'left', keyChannel: 'RB' });
templateActor({ label: 'M28 · LAB-14 · SHESHA BY THE TEMPLATE (a SOFT cast — nothing in his clip strikes)', M: NAGAS[2].M, folder: 'shesha', cardId: 'shesha', clip: 'shesha_magenta.mp4', sha: '055a68ea27d2', chroma: 'magenta',
  emerge: [0, 44], act: [45, 113], contactIn: [78, 78], contact: 'nova', contactNote: 'nova: the radiance at its fullest, the audited frame', aim: null, facing: 'right', keyChannel: 'RB' });
templateActor({ label: 'M31 · LAB-15 · PADMAVATI BY THE TEMPLATE (a SOFT cast, and the first card below 384)', M: WAVE15[0].M, folder: 'padmavati', cardId: 'padmavati', clip: 'padmavati_magenta.mp4', sha: 'b57b63af449a', chroma: 'magenta',
  emerge: [0, 49], act: [50, 110], contactIn: [76, 76], contact: 'nova', contactNote: 'nova: the ring above her palm at its fullest, the audited frame', aim: null, facing: 'right', keyChannel: 'RB' });
templateActor({ label: 'M32 · LAB-15 · KULIKA BY THE TEMPLATE (her burst is also her exit)', M: WAVE15[1].M, folder: 'kulika', cardId: 'kulika', clip: 'kulika_magenta.mp4', sha: '0d86f04cb13e', chroma: 'magenta',
  emerge: [0, 69], act: [70, 104], contactIn: [87, 87], contact: 'nova', contactNote: 'nova: the ignition, the audited frame', aim: null, facing: 'left', keyChannel: 'RB' });
templateActor({ label: 'M35 · LAB-16 · SUGRIVA BY THE TEMPLATE (two strikes; the nova rides the slam)', M: VAN16[0].M, folder: 'sugriva', cardId: 'sugriva', clip: 'sugriva_magenta.mp4', sha: '2b67268cfe4f', chroma: 'magenta',
  emerge: [0, 51], act: [52, 110], contactIn: [56, 56], contact: 'nova', contactNote: 'nova: the staff slam, the audited frame', aim: null, facing: 'right', keyChannel: 'RB' });
templateActor({ label: 'M36 · LAB-16 · ANGAD BY THE TEMPLATE (a shield flash, and no bottom feather is possible)', M: VAN16[1].M, folder: 'angad', cardId: 'angad', clip: 'angad_magenta.mp4', sha: '5d728c28035d', chroma: 'magenta',
  emerge: [0, 47], act: [48, 104], contactIn: [53, 53], contact: 'nova', contactNote: 'nova: the shield flash is born, the audited frame', aim: null, facing: 'left', keyChannel: 'RB' });
templateActor({ label: 'M40 · LAB-17 · ANJANA BY THE TEMPLATE (a SOFT cast, and the first card touching no frame edge)', M: VAN17[0].M, folder: 'anjana', cardId: 'anjana', clip: 'anjana_magenta.mp4', sha: '66501238583a', chroma: 'magenta',
  emerge: [0, 47], act: [48, 105], contactIn: [85, 85], contact: 'nova', contactNote: 'nova: the ribbon at its fullest, before the exit glow', aim: null, facing: 'right', keyChannel: 'RB' });
templateActor({ label: 'M41 · LAB-17 · MAKARDHWAJA BY THE TEMPLATE (the first GROUND-IMPACT card since Bali)', M: VAN17[1].M, folder: 'makardhwaja', cardId: 'makardhwaja', clip: 'makardhwaja_magenta.mp4', sha: '86931632d1a1', chroma: 'magenta',
  emerge: [0, 54], act: [55, 106], contactIn: [59, 59], contact: 'ground-impact', contactNote: 'the landing splash reaches the ground band', aim: null, facing: 'left', keyChannel: 'RB' });
templateActor({ label: 'M45 · LAB-18 · RAHU BY THE TEMPLATE (the last card: a floating head on the one GREEN key, every frame kept)', M: RAHU.M, folder: 'rahu', cardId: 'rahu', clip: 'rahu_green.mp4', sha: '70ea37e47b47', chroma: 'green',
  emerge: [0, 31], act: [32, 92], contactIn: [44, 44], contact: 'nova', contactNote: 'nova: the radiance at its fullest — a soft cast with no ignition', aim: null, facing: 'right', keyChannel: 'G' });
{
  // LAB-18 · every frame kept, the soft nova, the edge never touched, the smoke tether, and the single-channel M34 note
  const RH = RAHU.M, d512 = MAN.decodedBytes(RH), d256 = MAN.decodedBytes(MAN.forRung(RH, 256));
  const tool18 = fs.readFileSync(path.join(LAB, 'tools', 'make_actor_from_clip.py'), 'utf8');
  const keepers = (tool18.match(/"keep_duplicates": True/g) || []).length, rhEntry = tool18.slice(tool18.indexOf('"rahu":'), tool18.indexOf('"rahu":') + 1400);
  const allMans = fs.readdirSync(path.join(LAB, 'actors')).map((d) => [d, JSON.parse(fs.readFileSync(path.join(LAB, 'actors', d, 'manifest.json'), 'utf8'))]);
  const pin = (mans) => mans.every(([, m]) => !(m.audit && m.audit.keepDuplicates) || (Array.isArray(m.audit.duplicatesDropped) && m.audit.duplicatesDropped.length === 0));
  const keptAll = allMans.filter(([, m]) => m.audit && m.audit.keepDuplicates).map(([d]) => d);
  const src = RH.cells.map((c) => c.src), contiguous = src.every((x, i) => x === i);
  const doctored = allMans.map(([d, m]) => [d, d === 'rahu' ? Object.assign({}, m, { audit: Object.assign({}, m.audit, { duplicatesDropped: [1] }) }) : m]);
  ok('M46 · LAB-18 · KEEP_DUPLICATES — THE DUPLICATE RULE\'S PREMISE FAILS FOR THE STILLEST CARD. The pack drops a frame whose picture differs from the last KEPT frame by under 0.6; that is how a true duplicate reads. Rahu\'s shimmer moves below it on 29 GENUINE frames (every odd frame f001–f057): the change inside a dropped pair (0.37–0.54) matches the change between pairs (0.36–0.57), so the rule would have kept every second frame, recorded 29 real frames as "true duplicates", put contact on ACT cell 6 and halved the static head against the dissolve. keep_duplicates is per-card data (default false, the standing rule for every other card); it is set on exactly ' + keepers + ' card, and every manifest that records it records ZERO dropped duplicates (' + J(keptAll) + '; a doctored manifest claiming one is rejected: ' + (pin(doctored) ? 'NOT caught' : 'caught') + '). Rahu keeps ' + RH.cells.length + ' contiguous cells f000–f092 (EMERGE ' + RH.phases.emerge.length + ', ACT ' + RH.phases.act.length + ')',
     keepers === 1 && /"keep_duplicates": True/.test(rhEntry) && pin(allMans) && !pin(doctored) && J(keptAll) === J(['rahu']) && RH.audit.keepDuplicates === true &&
     J(RH.audit.duplicatesDropped) === J([]) && RH.cells.length === 93 && contiguous && RH.phases.emerge.length === 32 && RH.phases.act.length === 61,
     J({ keepers, keptAll, cells: RH.cells.length, dropped: RH.audit.duplicatesDropped }));
  ok('M47 · LAB-18 · RAHU: A SOFT NOVA WITH NO IGNITION, NO EDGE, AND THE SMOKE AS HIS FEET. (1) The most static clip in the lab: picture change under 0.8 across f024–f060, gold within 1% over a flat glow, so no frame strikes; the nova is SOFT (' + J(MAN.contactStrength(RH)) + ') on ACT cell ' + RH.contact + ' = f' + RH.audit.contactSrc + ', the radiance at its fullest — any frame f024–f050 is equivalent and the rule is the tiebreaker. (2) The second card touching NO frame edge, after Anjana: no bottom feather. (3) PIVOT READING FOUR: the ordinary feet rule on f000 lands on his lowest smoke tendril ' + J(RH.audit.pivotSrc) + ', so the smoke tethers him to the ground line and the head hangs above it — no knob, the Garuda precedent. (4) cellPx 384 as ruled: M21 ' + (100 * d256 / d512).toFixed(3) + '%, the low rung ' + (d256 / 1048576).toFixed(1) + ' MB. (5) The BRIGHT matte, on a GREEN SINGLE-channel key; the ruled split, native exit, in place (a nova travels 0 by rule)',
     RH.contactRule === 'nova' && RH.contact === 12 && RH.audit.contactSrc === 44 && RH.cells[RH.phases.act[RH.contact]].src === 44 && J(MAN.contactStrength(RH)) === J({ flash: 0.5, impulse: 0 }) &&
     RH.audit.featherBottom === undefined && J(RH.audit.pivotSrc) === J([926.2, 1053]) && RH.cellPx === 384 && d256 * 4 <= d512 * 1.02 && d256 < 10 * 1048576 &&
     RH.audit.recipe.matte === 'bright' && RH.audit.recipe.keyKind === 'single' && RH.audit.recipe.keyChannel === 'G' && RH.travelScale === undefined && RH.exit === 'native' && RH.phases.fizzle === undefined,
     J({ contact: RH.contact, src: RH.audit.contactSrc, pivot: RH.audit.pivotSrc, cellPx: RH.cellPx, ratio: (100 * d256 / d512).toFixed(3), recipe: RH.audit.recipe }));
  // the M34 method note: the green despill clamps G to max(R, B), so a green-keyed OUTPUT can never be green-dominant — proven over the whole cube
  let greenDominant = 0, reached = 0;
  for (let r = 0; r < 256; r += 5) for (let g = 0; g < 256; g += 5) for (let b = 0; b < 256; b += 5) { const g2 = Math.min(g, Math.max(r, b)); if (g2 > Math.max(r, b)) greenDominant++; if (g2 === Math.max(r, b)) reached++; }
  const ft = RH.audit.fadeTail, last = src[src.length - 1];
  ok('M48 · LAB-18 · THE M34 METHOD NOTE, AND RAHU\'S NEAR-BLACK TAIL. The OUTPUT metric was built for magenta keys (a pink cast). Its green analogue is STRUCTURALLY ZERO on a single-channel green key: the despill sets G to min(G, max(R, B)), so no output pixel can be green-dominant — ' + greenDominant + ' of the sampled RGB cube after despill (it can only tie, ' + reached + ' samples). A green-keyed card is therefore SOURCE-ONLY BY CONSTRUCTION, never to be read as "clean on both". Rahu is that row: his dissolve darkens to near-black (output mean [7,7,4] by f088) and the SOURCE ground share crosses 20% at f090 (29.7%), empty by f098. The ramp f' + ft[0][0] + '–f' + ft[9][0] + ' covers the first degrading frame, ends on the last kept cell, and the trim begins the frame after (' + J(RH.audit.droppedTail) + ')',
     greenDominant === 0 && reached > 0 && ft.length === 10 && ft[0][0] === 83 && ft[0][0] <= 90 && ft[9][0] === last && last === 92 && J(RH.audit.droppedTail) === J([93, 120]) &&
     ft.every((x, k) => Math.abs(x[1] - (1 - k / 9)) < 1e-4) && RH.audit.recipe.keyKind === 'single',
     J({ greenDominant, fade: ft.map((x) => x[0]), dropped: RH.audit.droppedTail }));
}
{
  // LAB-19 · THE ADDITIVE EFFECT CLIP: the pack, the budget, the contract, the placement
  const VM = VJ.M, v = EC.validate(VM), atl = fs.readFileSync(path.join(LAB, 'effects', 'vajra', VM.atlas)), px = webpSize(atl), au = VM.audit;
  const src = VM.cells.map((c) => c.src), bytes = VM.atlasSize.w * VM.atlasSize.h * 4;
  const clipSha = fs.existsSync(path.join(LAB, 'sources', 'vajra', 'vajra_black.mp4')) ? sha256(fs.readFileSync(path.join(LAB, 'sources', 'vajra', 'vajra_black.mp4'))) : null;
  const bad = (patch) => EC.validate(Object.assign({}, VM, patch)).ok;
  ok('M49 · LAB-19 · VAJRA\'S STRIKE CLIP BY THE EFFECT TEMPLATE — an ADDITIVE EFFECT CLIP, not an actor: ' + VM.cells.length + ' cells f' + src[0] + '–f' + src[src.length - 1] + ' (S1, the strike alone; the charge f000–f084 stays in the source), one ' + VM.cellSize.w + 'x' + VM.cellSize.h + ' cell at cellPx ' + VM.cellPx + ', atlas ' + px.w + 'x' + px.h + ' (' + (atl.length / 1024).toFixed(0) + ' KB, ' + (bytes / 1048576).toFixed(2) + ' MB decoded), RGB with a luminance alpha baked at load, blend "add"; the impact is cell ' + VM.impact + ' = f' + src[VM.impact] + ' (the largest picture change in its window, ' + au.impactChange + '), anchored at the impact point; the black ground measured true (corners ' + au.ground.cornersMax + ', more than 300 px from content ' + au.ground.farMax + '). It carries NO actor-class field (no rungs, no phases, no pivot, no matte), and the validator refuses one',
     v.ok && !!px && px.w === VM.atlasSize.w && px.h === VM.atlasSize.h && px.w <= 4096 && px.h <= 4096 && VM.class === 'effect-clip' && VM.blend === 'add' && VM.channels === 'rgb' && VM.alpha === 'luminance' &&
     VM.cardId === 'vajra' && VM.fps === 24 && VM.cellPx === 448 && VM.cells.length === 36 && src.every((x, i) => x === 85 + i) && J(au.range) === J([85, 120]) && J(au.droppedHead) === J([0, 84]) && au.droppedTail === null &&
     VM.impact === 8 && src[VM.impact] === 93 && au.impactSrc === 93 && VM.cells.every((c) => c.w === VM.cellSize.w && c.h === VM.cellSize.h) &&
     VM.source.indexOf('Kling clip vajra_black.mp4 (sha256 ' + (clipSha ? clipSha.slice(0, 12) : '') + '…, 121 frames @ 24 fps, 1916x1080, black ground)') === 0 &&
     au.ground.cornersMax === 0 && au.ground.farMax <= 2 && VM.rungs === undefined && VM.phases === undefined && VM.pivot === undefined && !(VM.audit.recipe) &&
     !bad({ rungs: [] }) && !bad({ phases: {} }) && !bad({ blend: 'normal' }) && !bad({ channels: 'rgba' }) && !bad({ impact: 99 }) &&
     J(fs.readdirSync(path.join(LAB, 'effects', 'vajra')).sort()) === J(['atlas.webp', 'manifest.json']), v.errors.join('; '));
  // E1 — the cap is the effect layer's hi-rung class, read off the game's own Vajra sheet; the worst actor is read off every actor manifest
  // the game's sheets are JPEG bytes under a .png name (the thumbs convention): read the size from whichever it really is
  const imgSize = (p) => { const b = fs.readFileSync(p);
    if (b.readUInt32BE(0) === 0x89504e47) return { w: b.readUInt32BE(16), h: b.readUInt32BE(20), kind: 'png' };
    for (let i = 2; i < b.length - 9;) { if (b[i] !== 0xff) return null; const mk = b[i + 1], len = b.readUInt16BE(i + 2);
      if (mk >= 0xc0 && mk <= 0xc3) return { w: b.readUInt16BE(i + 7), h: b.readUInt16BE(i + 5), kind: 'jpeg' }; i += 2 + len; }
    return null; };
  const hi = imgSize(path.join(GAME, 'assets', 'vfx', 'game', 'sheets', 'hi', 'vfx_vajra.png')), cap = hi.w * hi.h * 4;
  const actorPeaks = fs.readdirSync(path.join(LAB, 'actors')).map((d) => { const m = JSON.parse(fs.readFileSync(path.join(LAB, 'actors', d, 'manifest.json'), 'utf8')); return [d, MAN.decodedBytes(m)]; }).sort((x, y) => y[1] - x[1]);
  const worst = actorPeaks[0], combined = cap + worst[1];
  ok('M50 · LAB-19 · BUDGET LINE E1, beside A5: an effect clip is capped at the effect layer\'s HI-RUNG class — read off the game\'s own Vajra hi-rung sheet (' + hi.kind + ' bytes under its .png name), ' + hi.w + 'x' + hi.h + ' RGBA = ' + (cap / 1048576).toFixed(2) + ' MB decoded — loaded on play, released after, at most ONE effect clip decoded at once, coexisting with at most the one decoded actor A5 allows. Vajra\'s clip decodes to ' + (bytes / 1048576).toFixed(2) + ' MB, under the cap. The COMBINED WORST-CASE PEAK is stated from the data: the cap plus the largest actor at its 512 rung (' + worst[0] + ', ' + (worst[1] / 1048576).toFixed(1) + ' MB) = ' + (combined / 1048576).toFixed(1) + ' MB. The per-clip cap is the E1 line, and the validator refuses a manifest that decodes past it',
     cap === EC.E1.capBytes && EC.E1.oneAtATime === true && bytes <= cap && combined > 70 * 1048576 && combined < 80 * 1048576 && worst[1] > 55 * 1048576 &&
     !bad({ atlasSize: { w: 4096, h: 1200 } }), J({ cap, bytes, worst, combined }));
  ok('M51 · LAB-19 · THE EDGES, THE FEATHERS AND THE FADES. The clip touches the TOP edge in ' + au.edges.top + ' of ' + au.edges.of + ' frames (the weapon, cut) and the BOTTOM in ' + au.edges.bottom + ' (the impact glow and spike, from f093), the sides in ' + au.edges.sides + '. A ' + au.featherTop.px + ' px top band and a ' + au.featherBottom.px + ' px bottom band ramp to black (' + au.featherTop.cellPx + ' cell px each). The bottom band\'s GUARD: it stops above the ring BODY (rows of at least ' + au.featherBottom.ringRow + ' bright pixels off the beam column) on every frame from impact to the fade tail — lowest y ' + au.featherBottom.ringBodyLowest + ' on f' + au.featherBottom.ringBodyLowestAt + ', ' + au.featherBottom.room + ' px of room; the body grows into the band only inside the fade tail (' + au.featherBottom.bodyInBandTail.map((x) => 'f' + x[0] + ' at ' + Math.round(x[1] * 100) + '%').join(', ') + '). A fade-in head over ' + au.fadeIn.length + ' cells (the weapon would pop in) and a MANDATORY fade tail f111–f120 (the ring is still growing on the clip\'s last frame)',
     au.edges.top === 36 && au.edges.bottom === 28 && au.edges.sides === 0 && au.featherTop.px === 64 && au.featherBottom.px === 64 && au.featherBottom.asked === 64 &&
     au.featherBottom.room >= au.featherBottom.px + 2 && J(au.featherBottom.guardFrames) === J([93, 110]) && au.featherBottom.bodyInBandTail.every((x) => x[0] >= 111 && x[1] <= 0.12) &&
     J(au.fadeIn.map((x) => x[0])) === J([85, 86, 87, 88]) && J(au.fadeIn.map((x) => x[1])) === J([0.2, 0.4, 0.6, 0.8]) && au.fadeIn[au.fadeIn.length - 1][0] < 93 &&
     au.fadeTail.length === 10 && au.fadeTail[0][0] === 111 && au.fadeTail[9][0] === 120 && au.fadeTail.every((x, k) => Math.abs(x[1] - (1 - k / 9)) < 1e-4), J(au));
  // the contract, read from the GAME's own source — if the game's Vajra beat changes, this fails
  const G_HTML = fs.readFileSync(path.join(GAME, 'index.html'), 'utf8');
  const gameHold = /let hold=(\d+), hitStop=0;/.exec(G_HTML), gameSpect = /if\(tier==='spectacle'\)\{ hold \+= heroServed \? 1500 : (\d+); hitStop=(\d+);/.exec(G_HTML);
  const destroyBlock = G_HTML.slice(G_HTML.indexOf("if (ev.type==='destroy'){"), G_HTML.indexOf("if (ev.type==='passive' && ev.abilityName==='Sudarshana')"));
  const crackMs = /await cDelay\((\d+)\);\s*\n\s*if\(LEGACY_VFX && dp\)/.exec(destroyBlock), dwellMs = /await cDelay\((\d+)\); return; \}\s*$/.exec(destroyBlock.trim() + ' ');
  const astraSnd = /function astraSfx\(cardId\)\{ playFile\(cardId==='brahmastra'\?'sfx_brahmastra':'sfx_astra', true\); \}/.test(G_HTML), destroySnd = /case 'destroy': return \{file:'sfx_unit_destroy'\};/.test(G_HTML);
  const choreo = /^const CHOREO_SPEED = ([0-9.]+);/m.exec(G_HTML), lTier = /if\(ev\.type==='play' && c && \(c\.r==='L'\|\|c\.r==='M'\)\) return 'spectacle';/.test(G_HTML);
  const k = VM.contract, holdTotal = gameHold && gameSpect ? +gameHold[1] + +gameSpect[1] : null;
  const T1 = EC.timeline(VM, 1), T6 = EC.timeline(VM, 0.6);
  ok('M52 · LAB-19 · THE CONTRACT IS THE GAME\'S, READ FROM ITS SOURCE: a Legendary cast is the spectacle tier (' + lTier + '), sfx_astra at the cast (' + astraSnd + '), then hit-stop ' + (gameSpect && gameSpect[2]) + ' ms + hold ' + holdTotal + ' ms; the destroy beat keyed on abilityName Vajra plays sfx_unit_destroy (' + destroySnd + '), ' + (crackMs && crackMs[1]) + ' ms, the crack, ' + (dwellMs && dwellMs[1]) + ' ms; CHOREO_SPEED ' + (choreo && choreo[1]) + '. The clip STARTS inside the cast beat\'s hold so its impact cell lands ON the destroy beat: at Normal the cast beat is ' + Math.round(T1.castBeatMs) + ' ms, the clip\'s lead ' + Math.round(T1.leadMs) + ' ms, so it starts at ' + Math.round(T1.clipStart) + ' ms and its impact cell is due at ' + Math.round(T1.impactAt) + ' ms = the destroy beat; the crack at ' + Math.round(T1.crackAt) + ', the beat ends at ' + Math.round(T1.beatEnd) + ', the clip at ' + Math.round(T1.clipEnd) + ' (un-awaited). At Fast (0.6) the same, scaled: impact ' + Math.round(T6.impactAt) + ' = destroy ' + Math.round(T6.destroyAt) + '. WIRE-CLOCK COST ' + T1.waitCostMs + ' ms',
     lTier && astraSnd && destroySnd && !!choreo && +choreo[1] === EC.CHOREO_SPEED && holdTotal === k.castHoldMs && +gameSpect[2] === k.castHitStopMs &&
     !!crackMs && +crackMs[1] === k.crackAfterMs && !!dwellMs && +dwellMs[1] === k.destroyDwellMs && /if\(ev\.abilityName==='Vajra' && dp\) VFX\.sprVajra\(dp\.cx, dp\.rect\.top\+dp\.rect\.height\/2, dp\.rect\.width\);/.test(destroyBlock) &&
     k.castSound === 'sfx_astra' && k.impactSound === 'sfx_unit_destroy' && k.trigger === 'destroy' && k.abilityName === 'Vajra' && k.awaited === false &&
     Math.abs(T1.castBeatMs - 1443) < 1e-6 && Math.abs(T1.impactAt - T1.destroyAt) < 1e-6 && Math.abs(T6.impactAt - T6.destroyAt) < 1e-6 && T1.clipStart > 0 && T6.clipStart > 0 && T1.waitCostMs === 0 && T6.waitCostMs === 0 &&
     Math.abs(T1.leadMs - 8 * 1000 / 24 * 1.3) < 1e-6 && Math.abs(T1.clipEnd - T1.clipStart - 36 * 1000 / 24 * 1.3) < 1e-6,
     J({ gameHold: gameHold && gameHold[1], gameSpect: gameSpect && gameSpect.slice(1), crackMs: crackMs && crackMs[1], dwellMs: dwellMs && dwellMs[1], T1, T6 }));
  const card = { cx: 205, cy: 155.5, w: 64 }, P = EC.place(VM, card), ringDrawn = VM.scaleRule.ringDiameterCell * P.scale;
  ok('M53 · LAB-19 · THE PLACEMENT: the impact anchor (' + VM.anchor.x + ', ' + VM.anchor.y + ' in the cell = the source impact point ' + J(au.impactPoint) + ') lands on the TARGET CARD\'S CENTRE, and the ring on f' + VM.scaleRule.ringFrame + ' (' + VM.scaleRule.ringDiameterSrc + ' source px = ' + VM.scaleRule.ringDiameterCell + ' cell px) draws ' + VM.scaleRule.cardWidths + ' card widths across — the current strike\'s size. On a 64 px card the clip draws ' + P.w.toFixed(1) + 'x' + P.h.toFixed(1) + ' px, rising ' + (VM.anchor.y * P.scale).toFixed(1) + ' px above the card\'s centre',
     VM.scaleRule.cardWidths === 2.4 && Math.abs(ringDrawn - 2.4 * card.w) < 1e-6 && Math.abs(P.x + VM.anchor.x * P.scale - card.cx) < 1e-6 && Math.abs(P.y + VM.anchor.y * P.scale - card.cy) < 1e-6 &&
     Math.abs(VM.anchor.x - (au.impactPoint[0] - au.box[0]) * au.scale) < 0.1 && Math.abs(VM.anchor.y - (au.impactPoint[1] - au.box[1]) * au.scale) < 0.1 && VM.contract.anchor === 'target-card-centre',
     J({ anchor: VM.anchor, P, ringDrawn }));
}
{
  // LAB-20 · THE CHAIN: two packs, the chain, the game's removal contract, the placement and the arrival rule
  const I = SU.I, S = SU.S, clipSha = (n) => { const p2 = path.join(LAB, 'sources', 'sudarshana', n); return fs.existsSync(p2) ? sha256(fs.readFileSync(p2)).slice(0, 12) : ''; };
  const bytesOf = (m) => m.atlasSize.w * m.atlasSize.h * 4, pxOf = (d) => webpSize(fs.readFileSync(path.join(LAB, 'effects', d, 'atlas.webp')));
  const vI = EC.validate(I), pI = pxOf('sudarshana_invoke'), srcI = I.cells.map((c) => c.src), auI = I.audit;
  ok('M54 · LAB-20 · THE INVOCATION BY THE EFFECT TEMPLATE (a chain member, role "invoke"): ' + I.cells.length + ' cells f' + srcI[0] + '–f' + srcI[srcI.length - 1] + ' — the last spin revolutions into the tilt-flat throw (from f099 the late phase runs off the left edge) — one ' + I.cellSize.w + 'x' + I.cellSize.h + ' cell at cellPx ' + I.cellPx + ', atlas ' + pI.w + 'x' + pI.h + ', ' + (bytesOf(I) / 1048576).toFixed(2) + ' MB decoded; anchored at the disc\'s core ' + J(auI.anchorPoint) + ' on f' + auI.anchorFrame + ' (it spins in place: the core drifts at most ' + auI.coreDriftMax + ' px); the disc spans ' + I.scaleRule.spanSrc + ' px on f' + I.scaleRule.frame + ', drawn ' + I.scaleRule.cardWidths + ' card widths across; fade-in over 3 cells and fade-OUT over 4 (it hands off, it does not end: ' + J(auI.fades.map((x) => x[1])) + '); feathers bottom ' + auI.feathers.bottom + ' px (the rim touches it in ' + auI.edges.bottom + ' of 16 frames) and sides ' + auI.feathers.left + ' px; no impact and no contract (the chain carries it); the ground true (corners ' + auI.ground.cornersMax + ' — late-phase sparks, far-ground mean at most ' + auI.ground.farMeanMax + ')',
     vI.ok && I.role === 'invoke' && I.impact === null && I.contract === undefined && !!pI && pI.w === I.atlasSize.w && pI.h === I.atlasSize.h && I.cellPx === 448 && I.cells.length === 16 && srcI.every((x, i) => x === 83 + i) &&
     J(auI.droppedHead) === J([0, 82]) && J(auI.droppedTail) === J([99, 120]) && I.source.indexOf('Kling clip sudarshana_invoke_black.mp4 (sha256 ' + clipSha('sudarshana_invoke_black.mp4')) === 0 &&
     auI.coreDriftMax <= 10 && I.scaleRule.feature === 'disc' && I.scaleRule.cardWidths === 2.0 && J(auI.fades.map((x) => x[1])) === J([0.25, 0.5, 0.75, 0.8, 0.6, 0.4, 0.2]) &&
     auI.feathers.bottom === 48 && auI.feathers.left === 32 && auI.feathers.right === 32 && auI.feathers.top === 0 && auI.edges.bottom === 7 && auI.edges.left === 0 && auI.ground.farMeanMax < 0.01 &&
     bytesOf(I) <= EC.E1.capBytes && J(fs.readdirSync(path.join(LAB, 'effects', 'sudarshana_invoke')).sort()) === J(['atlas.webp', 'manifest.json']), vI.errors.join('; '));
  const vS = EC.validate(S), pS = pxOf('sudarshana_strike'), srcS = S.cells.map((c) => c.src), auS = S.audit;
  ok('M55 · LAB-20 · THE STRIKE BY THE EFFECT TEMPLATE (role "strike"): ' + S.cells.length + ' cells f' + srcS[0] + '–f' + srcS[srcS.length - 1] + ' at cellPx ' + S.cellPx + ' (' + S.cellSize.w + 'x' + S.cellSize.h + ', atlas ' + pS.w + 'x' + pS.h + ', ' + (bytesOf(S) / 1048576).toFixed(2) + ' MB — at the ruled scale the crop box draws 312 device px on a DPR-2 phone, so 288 is 92% of native, stated honestly; 320 would pack to 18.5 MB, past E1). The disc NEVER MOVES: its core sits at ' + J(auS.anchorPoint) + ' and drifts at most ' + auS.coreDriftMax + ' px; the trail tells the flight. The impact is cell ' + S.impact + ' = f' + srcS[S.impact] + ', NAMED by the owner\'s ruling — the ring closes around the disc — and the window is recorded as measured: the single largest picture change is ' + auS.largestChangeAt + ' (' + auS.windowChange[auS.largestChangeAt] + '), one frame later (' + J(auS.windowChange) + '). The burst spans ' + S.scaleRule.spanSrc + ' px on f' + S.scaleRule.frame + ' = ' + S.scaleRule.cardWidths + ' card widths. It ENDS at f088: the f090+ red-contour burst is excluded (a sticker contour, not light — a reshoot candidate). Top and bottom 64 px feathers under a DISC-BODY guard (rows ' + J(auS.feathers.guard.bodyRows) + ' on f' + auS.feathers.guard.bodyFrame + ', room ' + auS.feathers.guard.topRoom + '/' + auS.feathers.guard.bottomRoom + ' px); the rays touch top ' + auS.edges.top + ' and bottom ' + auS.edges.bottom + ' of 55 frames, the sides never. A mandatory fade tail f079–f088',
     vS.ok && S.role === 'strike' && S.contract === undefined && !!pS && pS.w === S.atlasSize.w && pS.h === S.atlasSize.h && S.cellPx === 288 && S.cells.length === 55 && srcS.every((x, i) => x === 34 + i) &&
     J(auS.droppedTail) === J([89, 120]) && S.impact === 19 && srcS[S.impact] === 53 && auS.impactSrc === 53 && auS.largestChangeAt === 'f054' && auS.windowChange.f053 < auS.windowChange.f054 &&
     S.source.indexOf('Kling clip sudarshana_strike_black.mp4 (sha256 ' + clipSha('sudarshana_strike_black.mp4')) === 0 && auS.coreDriftMax <= 6 &&
     S.scaleRule.feature === 'burst span' && S.scaleRule.spanSrc === 1370 && S.scaleRule.cardWidths === 2.4 && S.arrival === undefined && S.travel && S.travel.sourceMotion === '+x' &&
     auS.feathers.top === 64 && auS.feathers.bottom === 64 && auS.feathers.guard.topRoom >= 66 && auS.feathers.guard.bottomRoom >= 66 && auS.edges.left === 0 && auS.edges.right === 0 &&
     J(auS.fades.map((x) => x[0])) === J([79, 80, 81, 82, 83, 84, 85, 86, 87, 88]) && auS.fades.every((x, k) => Math.abs(x[1] - (1 - k / 9)) < 1e-4) && auS.ground.farMax <= 2 && bytesOf(S) <= EC.E1.capBytes, vS.errors.join('; '));
  const vc = EC.validateChain(SU.C, [I, S]), swapped = EC.validateChain(SU.C, [S, I]), sum = bytesOf(I) + bytesOf(S);
  ok('M56 · LAB-20 · THE CHAIN AND E1, UNCHANGED: effects/sudarshana/chain.json names the invocation then the strike and carries the contract; a chain in the wrong order is refused. Each clip is under the per-clip cap (' + (bytesOf(I) / 1048576).toFixed(2) + ' and ' + (bytesOf(S) / 1048576).toFixed(2) + ' MB of ' + (EC.E1.capBytes / 1048576).toFixed(2) + '), and the pair would be ' + (sum / 1048576).toFixed(2) + ' MB together — PAST the cap — which is exactly why they decode ONE AFTER THE OTHER: the invocation at the cast, released at the handoff, then the strike. The per-play fallback amendment (both at 256: 16.3 MB) is recorded as available but unused',
     vc.ok && !swapped.ok && SU.C.class === 'effect-chain' && SU.C.cardName === 'Sudarshana Chakra' && J(SU.C.clips.map((c) => c.role)) === J(['invoke', 'strike']) && sum > EC.E1.capBytes &&
     J(fs.readdirSync(path.join(LAB, 'effects')).sort()) === J(['sudarshana', 'sudarshana_invoke', 'sudarshana_strike', 'vajra']) && J(fs.readdirSync(path.join(LAB, 'effects', 'sudarshana'))) === J(['chain.json']), vc.errors.join('; '));
  // the removal contract, read from the game's source
  const G_HTML = fs.readFileSync(path.join(GAME, 'index.html'), 'utf8'), a0 = G_HTML.indexOf("if (ev.type==='passive' && ev.abilityName==='Sudarshana')"), blk = G_HTML.slice(a0, G_HTML.indexOf("if (ev.type==='passive' && ev.abilityName==='Nagapasha')"));
  const pins = { throwFromCasterHalf: /const caster=1-ownerPiOfUid\(u\), ch=document\.querySelector\(halfSel\(caster\)\);/.test(blk), flight380: /VFX\.sprSudarshana\(dp\.cx, dp\.rect\.top\+dp\.rect\.height\/2, dp\.rect\.width, fx, fy, 380\);/.test(blk) && /await cDelay\(380\);/.test(blk),
    bite100: /screenShake\(false\); await cDelay\(100\);/.test(blk), removal: /showcaseVictim\(u, 'removal'\);/.test(blk), dwell300: /await cDelay\(300\);/.test(blk), callout: /calloutAt\(dp, 'Sudarshana Chakra'\);/.test(blk), tail140: /await cDelay\(140\); \}/.test(blk),
    removalFade320: /node\.classList\.add\('victim-removal'\); setTimeout\(\(\)=>node\.remove\(\), 320\*vfxT\(\)\);/.test(G_HTML), silentPassive: !/case 'passive'/.test(G_HTML.slice(G_HTML.indexOf('function resolveSound('), G_HTML.indexOf('function resolveSound(') + 1600)),
    mythicIsSpectacle: /if\(ev\.type==='play' && c && \(c\.r==='L'\|\|c\.r==='M'\)\) return 'spectacle';/.test(G_HTML) };
  const k = SU.C.contract, TN = EC.chainTimeline(SU.C, [I, S], 1), TF = EC.chainTimeline(SU.C, [I, S], 0.6), R = (x) => Math.round(x);
  ok('M57 · LAB-20 · THE REMOVAL CONTRACT IS THE GAME\'S, READ FROM ITS SOURCE: ' + Object.keys(pins).map((x) => x + ' ' + pins[x]).join(', ') + '. Mythic is the same spectacle tier as Legendary. The chain, at Normal / Fast: invocation from ' + R(TN.invokeStart) + ' / ' + R(TF.invokeStart) + ' ms, HANDOFF at ' + R(TN.handoffAt) + ' / ' + R(TF.handoffAt) + ', the strike\'s ring-snap on THE BITE at ' + R(TN.impactAt) + ' / ' + R(TF.impactAt) + ' (the resolution beat at ' + R(TN.beatStart) + ' / ' + R(TF.beatStart) + ' plus the 380 ms flight), the removal exit ' + R(TN.crackAt) + ' / ' + R(TF.crackAt) + ', the callout ' + R(TN.calloutAt) + ' / ' + R(TF.calloutAt) + ', the board on AFTER ' + R(TN.beatEnd) + ' / ' + R(TF.beatEnd) + ', the strike ending un-awaited at ' + R(TN.strikeEnd) + ' / ' + R(TF.strikeEnd) + '. No dead time and no overlap at the handoff, by construction; wire-clock cost ' + TN.waitCostMs + ' / ' + TF.waitCostMs + ' ms. Sound: sfx_astra at the cast, a SILENT bite (the game\'s own)',
     Object.values(pins).every(Boolean) && k.trigger === 'passive' && k.abilityName === 'Sudarshana' && k.castSound === 'sfx_astra' && k.impactSound === null && k.flightMs === 380 && k.crackAfterMs === 100 && k.exitKind === 'removal' && k.exitMs === 320 && k.calloutAfterMs === 300 && k.destroyDwellMs === 440 && k.awaited === false &&
     R(TN.impactAt) === 1937 && R(TF.impactAt) === 1162 && R(TN.handoffAt) === 908 && R(TF.handoffAt) === 545 && R(TN.invokeStart) === 41 && R(TF.invokeStart) === 25 && R(TN.strikeEnd) === 3887 && R(TF.strikeEnd) === 2332 &&
     Math.abs(TN.handoffAt - TN.strikeStart) < 1e-9 && Math.abs(TN.impactAt - (TN.beatStart + 380 * TN.vfxT)) < 1e-6 && Math.abs(TF.impactAt - (TF.beatStart + 380 * TF.vfxT)) < 1e-6 && TN.invokeStart > 0 && TF.invokeStart > 0 && TN.waitCostMs === 0 && TF.waitCostMs === 0,
     J({ pins, TN, TF }));
  // LAB-20b · THE EFFECT ROTATION RULE (supersedes LAB-20's arrive-from-centre mirror) — read from the manifests, measured on the lab board
  const card = { cx: 178, cy: 55, w: 64 }, PS = EC.place(S, card), PI = EC.place(I, { cx: 178, cy: 315, w: card.w }), TV = S.travel;
  const half = { 0: { x: 178, y: 315 }, 1: { x: 178, y: 105 } }, heroY = { 0: 55, 1: 365 };   // the phone board (375 px): caster half centres, the enemy Hero row
  const sixCases = [[0, 106, -105.5], [0, 178, -90], [0, 250, -74.5], [1, 106, 105.5], [1, 178, 90], [1, 250, 74.5]].map(([seat, x, want]) => {
    const deg = EC.travelAngle(half[seat], { x, y: heroY[seat] }) * 180 / Math.PI; return { seat, targetX: x, deg: Math.round(deg * 10) / 10, want, ok: Math.abs(deg - want) <= 0.5 }; });
  const tot = TV.trailLengths.reduce((a2, b2) => a2 + b2, 0); let run2 = 0; const integral = [0].concat(TV.trailLengths.map((v) => (run2 += v) / tot));
  const quadErr = Math.sqrt(TV.table.reduce((a2, p2, k2) => a2 + Math.pow(p2 - EC.easeOutQuad(k2 / (TV.table.length - 1)), 2), 0) / TV.table.length);
  const scaleFromWant = I.scaleRule.cardWidths / (TV.bodyWidthSrc * S.scaleRule.cardWidths / S.scaleRule.spanSrc);
  ok('M58 · LAB-20b · THE EFFECT ROTATION RULE, recorded in the strike manifest: "' + TV.rotation.rule + '" The six measured cases on the phone board, the layer rotation from the caster-to-target vector (the source disc moves +x): ' + sixCases.map((c2) => 'seat ' + c2.seat + ' → x ' + c2.targetX + ': ' + c2.deg + '° (' + c2.want + '°)').join(' · ') + ' — each within ±0.5°. Rotation holds only while travelling and eases back to 0 over the parked cells ' + J(TV.rotation.parkedCells) + ' (f046–f052), zero by cell ' + TV.rotation.zeroBy + ' = f053, the impact. THE PATH: from the caster\'s half centre (the invocation\'s own anchor, so the disc hands off in place) to the target card\'s centre, arriving on cell ' + TV.arriveCell + ' = f0' + TV.arriveSrc + ', the first frame with no trail left. THE CURVE: the trail\'s length per frame ' + J(TV.trailLengths) + ' integrated and normalised is the table ' + J(TV.table) + ' (recomputed here and equal); easeOutQuad is the named fallback (rms ' + quadErr.toFixed(3) + ' off it). THE SCALE: from ' + SU.C.travel.scaleFrom + ' (the invocation disc\'s 2.0 card widths over the strike disc\'s ' + (TV.bodyWidthSrc * S.scaleRule.cardWidths / S.scaleRule.spanSrc).toFixed(3) + ') to 1.0 on the same curve. The LAB-20 mirror is RETIRED (no arrival field, no mirror function); the invocation never travels or rotates; the strike still lands at 2.4 card widths on the target, the invocation at 2.0 on the caster\'s half centre',
     sixCases.every((c2) => c2.ok) && TV.from === 'caster-half-centre' && TV.to === 'target-card-centre' && TV.arriveCell === 12 && TV.arriveSrc === 46 && TV.startCell === 0 &&
     integral.length === TV.table.length && integral.every((v, k2) => Math.abs(v - TV.table[k2]) < 1e-3) && TV.fallbackEase === 'easeOutQuad' && quadErr < 0.05 &&
     J(TV.rotation.parkedCells) === J([12, 18]) && TV.rotation.zeroBy === S.impact && /Actors never rotate/.test(TV.rotation.rule) && /eases back to the clip's authored orientation before its impact frame/.test(TV.rotation.rule) &&
     Math.abs(SU.C.travel.scaleFrom - scaleFromWant) < 1e-3 && SU.C.travel.scaleTo === 1 && S.arrival === undefined && EC.mirrorFor === undefined && I.travel === undefined &&
     Math.abs(S.scaleRule.spanCell * PS.scale - 2.4 * card.w) < 1e-6 && Math.abs(PS.x + S.anchor.x * PS.scale - card.cx) < 1e-6 &&
     Math.abs(I.scaleRule.spanCell * PI.scale - 2.0 * card.w) < 1e-6 && Math.abs(PI.x + I.anchor.x * PI.scale - 178) < 1e-6 && Math.abs(PI.y + I.anchor.y * PI.scale - 315) < 1e-6 && SU.C.contract.invokeAnchor === 'caster-half-centre',
     J({ sixCases, integral, table: TV.table, quadErr, scaleFrom: SU.C.travel.scaleFrom, scaleFromWant }));
}
{
  // LAB-17 · the windowed ground-impact, the in-place trap avoided, the edge that was never touched, and the calibration rows
  const AJ = VAN17[0].M, MK = VAN17[1].M, BA = BMAN;
  const tool17 = fs.readFileSync(path.join(LAB, 'tools', 'make_actor_from_clip.py'), 'utf8');
  const mkEntry = tool17.slice(tool17.indexOf('"makardhwaja":'), tool17.indexOf('"makardhwaja":') + 900);
  const d512 = MAN.decodedBytes(MK), d256 = MAN.decodedBytes(MAN.forRung(MK, 256));
  ok('M42 · LAB-17 · MAKARDHWAJA, THE FIRST GROUND-IMPACT CARD SINCE BALI, AND BOTH OF BALI\'S CONDITIONS. (1) A SEARCH WINDOW. Unwindowed, the ground-impact rule fires at f040 while he is AIRBORNE: his tail sweeps low through the ground band mid-leap, and his wide lunge leaves only one foot within 14 px of the ground line, so the feet exclusion covers just 16% of the width. His window (56, 70) keeps the airborne frames out, and the rule fires on f' + MK.audit.contactSrc + ' where the landing splash first reaches the band — the Kartikeya window precedent. (2) TRAVELSCALE 0, STATED. Ground-impact is not a nova, so the nova zero-travel case does not cover him; the LAB-13a trap (a bolt-edge card that shipped charging) is named and avoided: his manifest carries travelScale ' + MK.travelScale + ', as Bali\'s carries ' + BA.travelScale + '. His core rides the TOP edge for 24 airborne frames, an accepted cut per Garuda, and he never touches the bottom, so he carries no feather. CELLPX ' + MK.cellPx + ', NOT THE 320 RULED: at 320 his 256 rung packed to 25.532% of the 512 rung and failed the M21 quarter-rung invariant by 35,269 B; 288, 352 and 384 all pass, and 352 is the nearest to the ruling, still sub-384 — his low rung is ' + (d256 / 1048576).toFixed(1) + ' MB (' + (100 * d256 / d512).toFixed(2) + '%)',
     /"contact": \("ground-impact", \(56, 70\)\)/.test(mkEntry) && /"travel_scale": 0/.test(mkEntry) &&
     MK.travelScale === 0 && BA.travelScale === 0 && MK.contactRule === undefined && MK.audit.recipe.contact === 'ground-impact' &&
     MK.audit.contactSrc === 59 && MK.contact === 4 && MK.audit.featherBottom === undefined && MK.cellPx === 352 &&
     d256 * 4 <= d512 * 1.02 && d256 < 10 * 1048576 && J(MK.audit.pivotSrc) === J([1069.4, 1047]),
     J({ contactSrc: MK.audit.contactSrc, travelScale: MK.travelScale, cellPx: MK.cellPx, ratio: (100 * d256 / d512).toFixed(3) }));
  ok('M43 · LAB-17 · ANJANA IS THE FIRST CARD THAT TOUCHES NO FRAME EDGE — top, bottom, left and right are clear in every one of her frames, so she carries no feather of any kind; every card before her needed at least the standard band at one edge. She is also a SOFT cast (' + J(MAN.contactStrength(AJ)) + '): her picture change holds at about 4 through the whole ribbon with no percussive frame, so the nova rides the ribbon at its fullest on ACT cell ' + AJ.contact + ' (f085), five frames before the gold glow at her feet ignites at f090 — that glow is her exit, not her act',
     AJ.audit.featherBottom === undefined && AJ.contactRule === 'nova' && AJ.contact === 37 && AJ.cells[AJ.phases.act[AJ.contact]].src === 85 &&
     J(MAN.contactStrength(AJ)) === J({ flash: 0.5, impulse: 0 }) && AJ.cellPx === 384 && AJ.travelScale === undefined,
     J({ contact: AJ.contact, strength: MAN.contactStrength(AJ), featherBottom: AJ.audit.featherBottom === undefined ? 'none' : AJ.audit.featherBottom }));
  const covers17 = (M, firstBad) => { const ft = M.audit.fadeTail, cs = M.cells.map((c) => c.src), last = cs[cs.length - 1];
    return ft[0][0] <= firstBad && ft[9][0] === last && M.audit.droppedTail[0] === last + 1 && ft.every((x, k) => Math.abs(x[1] - (1 - k / 9)) < 1e-4); };
  ok('M44 · LAB-17 · TWO MORE SOURCE-ONLY ROWS FOR THE M34 CALIBRATION. Both tails are the SOURCE class, not tinted dust: Anjana\'s source share crosses 20% at f102 while her output pink cast never exceeds 17%, and Makardhwaja\'s frost-blue dissolve jumps from 11.4 to 19.7% source at f101 with an output pink cast near 0 — frost blue has R < G and carries no pink at all. They join Padmavati on the source-only side; only Sugriva and Angad have needed the output metric. Each ramp covers the first degrading frame and each trim begins on the frame after the last kept cell. Anjana\'s trim has a stated cost: her teal sari fragments at f110-f120 are genuine but read 36-51% ground, so real content is excluded because contamination rides it — the Bali stone-chunk precedent',
     covers17(AJ, 100) && covers17(MK, 101) && J(AJ.audit.droppedTail) === J([106, 120]) && J(MK.audit.droppedTail) === J([107, 120]) &&
     VAN17.every((c) => c.M.exit === 'native' && c.M.phases.fizzle === undefined && c.M.audit.recipe.keyKind === 'pair' && c.M.audit.recipe.pivot === 'feet'),
     J(VAN17.map((c) => [c.name, c.M.audit.fadeTail[0][0], c.M.audit.fadeTail[9][0], c.M.audit.droppedTail])));
}
{
  // LAB-16 · the dual-metric trims, the unguardable edge, and the presets nobody plays
  const SG = VAN16[0].M, AG = VAN16[1].M;
  const cellsOf = (M) => M.cells.map((c) => c.src);
  const covers = (M, firstBad) => { const ft = M.audit.fadeTail, last = cellsOf(M)[cellsOf(M).length - 1];
    return ft[0][0] <= firstBad && ft[9][0] === last && M.audit.droppedTail[0] === last + 1 && ft.every((x, k) => Math.abs(x[1] - (1 - k / 9)) < 1e-4); };
  ok('M37 · LAB-16 · M34 ON BOTH METRICS: tan-gold dust is the source metric\'s blind spot. LAB-13 to LAB-15 set trims on the SOURCE ground-share metric — the share of kept pixels whose source is ground-dominant. On Sugriva and Angad it badly under-reports (Sugriva reads 7.9 percent at f108 while his dissolve is visibly pink), because their dissolve is TAN-GOLD DUST: semi-transparent, so the un-mix leaves a magenta cast in the OUTPUT, yet tan has B < G, so no source pixel is ground-dominant and the despill never touches it. An OUTPUT-side pink-cast metric sees it, and M34 now uses BOTH jointly, each covering the other\'s blind class. Calibrated against shipped cards: Kartikeya breaks on both (his f102 trim sits exactly where the output metric jumps 16.6 to 35.8 percent); Padmavati\'s darker residue shows on the SOURCE metric only; Sugriva and Angad on the OUTPUT metric only. Here the ramp covers each card\'s first degrading frame and the trim begins the frame after the last kept cell — Sugriva\'s pink rim from f105 under a ramp f' + SG.audit.fadeTail[0][0] + '–f' + SG.audit.fadeTail[9][0] + ', Angad\'s from f096 under f' + AG.audit.fadeTail[0][0] + '–f' + AG.audit.fadeTail[9][0] + '. The measurements live in the README; this check pins the structure they produced',
     covers(SG, 105) && covers(AG, 96) && J(SG.audit.droppedTail) === J([111, 120]) && J(AG.audit.droppedTail) === J([105, 120]) &&
     SG.contact === 4 && AG.contact === 5 && SG.contactRule === 'nova' && AG.contactRule === 'nova' &&
     VAN16.every((c) => c.M.exit === 'native' && c.M.phases.fizzle === undefined && c.M.travelScale === undefined && c.M.cellPx === 448 &&
                        c.M.audit.recipe.keyKind === 'pair' && c.M.audit.recipe.pivot === 'feet' &&
                        MAN.decodedBytes(MAN.forRung(c.M, 256)) * 4 <= MAN.decodedBytes(c.M) * 1.02 && MAN.decodedBytes(MAN.forRung(c.M, 256)) < 10 * 1048576),
     J(VAN16.map((c) => [c.name, c.M.audit.fadeTail[0][0], c.M.audit.fadeTail[9][0], c.M.audit.droppedTail, c.M.contact])));
  ok('M38 · LAB-16 · ANGAD CARRIES NO BOTTOM FEATHER, AND NONE IS POSSIBLE — the Garuda precedent. His core touches the bottom edge at f039, mid-EMERGE, during the dust-kick lunge; the LAB-13 all-frames guard measures every EMERGE frame, so no band can ever clear it. He touches that edge in 87 frames, the most in the lab — an accepted cut under the standard 8 px feather. Sugriva, standing upright, takes a guarded ' + SG.audit.featherBottom.px + ' px band against a ' + SG.audit.featherBottom.coreGapMin + ' px core gap across all ' + SG.audit.featherBottom.guardFrames + ' EMERGE frames',
     AG.audit.featherBottom === undefined && AG.audit.recipe.feather === 8 &&
     SG.audit.featherBottom.px === 16 && SG.audit.featherBottom.coreGapMin === 24 && SG.audit.featherBottom.guardScope === 'emerge' && SG.audit.featherBottom.guardFrames === 52,
     J({ angad: AG.audit.featherBottom === undefined ? 'none' : AG.audit.featherBottom, sugriva: SG.audit.featherBottom }));
  const FFX16 = JSON.parse(fs.readFileSync(path.join(LAB, 'data', 'factionfx.json'), 'utf8')), KNOBS = Object.keys(lib('dissolve').ALIAS).concat(['haze']);
  const exitOf = (id) => MAN.exitMode({ entry: REG[id], manifest: JSON.parse(fs.readFileSync(path.join(LAB, 'runtime', REG[id].manifest), 'utf8')) }).exit;
  const byFaction = (fac) => Object.keys(REG).filter((id) => REG[id].manifest && REG[id].faction === fac);
  const procedural = Object.keys(REG).filter((id) => REG[id].manifest && exitOf(id) !== 'native');
  const tuned = (fac) => KNOBS.filter((k) => FFX16[fac].dissolve[k] !== undefined);
  ok('M39 · LAB-16 · THREE FACTION PRESETS NOBODY PLAYS — the M15/M30 note reaches its last faction. The Vanara actors both exit natively, so the Vanara dissolve joins the Naga and Deva ones as a preset held by data rather than exercised by a card: no Deva, Naga or Vanara actor exits procedurally (' + ['devas', 'nagas', 'vanaras'].map((f) => f + ' ' + byFaction(f).length + ' actors, all native').join(', ') + '). They are NOT all untuned, and the record keeps the difference: the Naga and Vanara presets carry none of the tuning knobs, while the DEVA preset still carries the ' + tuned('devas').length + ' it was given in LAB-6a (pinned by M15) — tuned, and still unexercised since LAB-10 sent Indra native. Only the Asura preset is still played, and by one card: ' + procedural.join(', '),
     ['devas', 'nagas', 'vanaras'].every((f) => byFaction(f).length > 0 && byFaction(f).every((id) => exitOf(id) === 'native')) &&
     tuned('nagas').length === 0 && tuned('vanaras').length === 0 && tuned('devas').length === 13 &&
     J(procedural) === J(['meghnad']),
     J({ devas: [byFaction('devas').length, tuned('devas').length], nagas: [byFaction('nagas').length, tuned('nagas').length], vanaras: [byFaction('vanaras').length, tuned('vanaras').length], procedural }));
}
{
  // LAB-15 · the two findings this rung settled
  const PD = WAVE15[0].M, KU = WAVE15[1].M;
  const cells = (M) => M.cells.map((c) => c.src);
  const boxes = (M) => M.cells.map((c) => Math.max(c.w, c.h));
  ok('M33 · LAB-15 · BOX COMPACTNESS DRIVES ATLAS COST, NOT CHARACTER SIZE — and Padmavati is the lab\'s FIRST CARD BELOW 384. Her box is compact: hood-tall but never frame-wide, so the scale that fits her into a cell is LARGER than a sprawling actor\'s and every cell is denser. At 384 she would put 12.3 MB on the 256 rung, the highest figure in the lab; at cellPx ' + PD.cellPx + ' she costs ' + (MAN.decodedBytes(MAN.forRung(PD, 256)) / 1048576).toFixed(1) + ' MB. Kulika is the same lesson inverted: her specks span the whole frame during the burst, so her scale shrinks and she is cheap at cellPx ' + KU.cellPx + ' (' + (MAN.decodedBytes(MAN.forRung(KU, 256)) / 1048576).toFixed(1) + ' MB). Both clear the M21 quarter-rung invariant',
     PD.cellPx === 320 && KU.cellPx === 448 && PD.cellMax === 512 && KU.cellMax === 512 &&
     Math.max.apply(null, boxes(PD)) === PD.cellPx && Math.max.apply(null, boxes(KU)) === KU.cellPx &&
     MAN.decodedBytes(MAN.forRung(PD, 256)) * 4 <= MAN.decodedBytes(PD) * 1.02 &&
     MAN.decodedBytes(MAN.forRung(KU, 256)) * 4 <= MAN.decodedBytes(KU) * 1.02 &&
     MAN.decodedBytes(MAN.forRung(PD, 256)) < 10 * 1048576 && MAN.decodedBytes(MAN.forRung(KU, 256)) < 10 * 1048576,
     J(WAVE15.map((c) => [c.name, c.M.cellPx, c.M.atlasSize, (MAN.decodedBytes(MAN.forRung(c.M, 256)) / 1048576).toFixed(1)])));
  const covers = (M, firstBad) => { const ft = M.audit.fadeTail, lastKept = cells(M)[cells(M).length - 1];
    return ft[0][0] <= firstBad && ft[9][0] === lastKept && M.audit.droppedTail[0] === lastKept + 1; };
  ok('M34 · LAB-15 · THE FADE TAIL COVERS THE DECAY, NEVER THE GOOD FRAMES — the general structure LAB-13, LAB-14 and LAB-15 each instantiate. A magenta clip degrades at its end: a translucent figure un-mixes to pink (Kartikeya, Padmavati) or a burst fades leaving pale ground (Takshaka, Kulika). The ramp is placed so its declining alpha lands ON that degrading window, and everything past the ramp floor is TRIMMED. Padmavati\'s pink creeps in from f106 and her ramp runs f' + PD.audit.fadeTail[0][0] + '–f' + PD.audit.fadeTail[9][0] + ', dropping ' + J(PD.audit.droppedTail) + '; Kulika\'s pale cloud dominates from f099 and her ramp runs f' + KU.audit.fadeTail[0][0] + '–f' + KU.audit.fadeTail[9][0] + ' so the burst plays at full alpha, dropping ' + J(KU.audit.droppedTail) + '. The ramp always ends on the last kept cell and the trim always begins the frame after',
     covers(PD, 106) && covers(KU, 99) &&
     J(PD.audit.droppedTail) === J([111, 120]) && J(KU.audit.droppedTail) === J([105, 120]) &&
     PD.audit.fadeTail.every((x, k) => Math.abs(x[1] - (1 - k / 9)) < 1e-4) && KU.audit.fadeTail.every((x, k) => Math.abs(x[1] - (1 - k / 9)) < 1e-4) &&
     J(MAN.contactStrength(PD)) === J({ flash: 0.5, impulse: 0 }) && J(MAN.contactStrength(KU)) === J({ flash: 1, impulse: 1 }) &&
     PD.contact === 26 && KU.contact === 17 &&
     WAVE15.every((c) => c.M.contactRule === 'nova' && c.M.exit === 'native' && c.M.phases.fizzle === undefined && c.M.travelScale === undefined &&
                         c.M.audit.recipe.keyKind === 'pair' && c.M.audit.recipe.pivot === 'feet' &&
                         c.M.audit.featherBottom.guardScope === 'emerge'),
     J(WAVE15.map((c) => [c.name, c.M.audit.fadeTail[0][0], c.M.audit.fadeTail[9][0], c.M.audit.droppedTail, c.M.audit.featherBottom])));
}
{
  // LAB-14 · what the first Naga rung settled
  const [VS, TK, SH] = NAGAS.map((n) => n.M);
  const soft = MAN.contactStrength(SH), plain = MAN.contactStrength(VS);
  ok('M29 · LAB-14 · THE FIRST NAGA ACTORS: three launch Heroes, three readings. VASUKI keeps his whole clip — nothing is trimmed (' + J(VS.audit.droppedTail) + ') because his closing teal cloud is genuine matter rather than ground residue, but it never empties, so his fade tail does real work like Vritra\'s. TAKSHAKA stops at f' + TK.cells[TK.cells.length - 1].src + ' and drops ' + J(TK.audit.droppedTail) + ': past it his specks are increasingly GROUND, the Kartikeya pink-residue class, and he carries a ' + TK.audit.featherBottom.px + ' px bottom feather guarded by the LAB-13 ALL-FRAMES rule — a ' + TK.audit.featherBottom.coreGapMin + ' px core gap measured across all ' + TK.audit.featherBottom.guardFrames + ' EMERGE frames (scope "' + TK.audit.featherBottom.guardScope + '"), not the settled frame alone. SHESHA is a SOFT cast (' + J(soft) + ', the Shukracharya reading) because nothing in his clip strikes, and his nova rides the radiance at its fullest on ACT cell ' + SH.contact + ' — a late index that is harmless precisely because a nova performs where it stands. All three sit on COILS, so the feet rule resolves to the coil base as it did for Vritra (' + NAGAS.map((n) => n.name + ' ' + J(n.M.audit.pivotSrc)).join(', ') + '), all three are keyed on the MAGENTA PAIR, and all three exit natively',
     J(VS.audit.droppedTail) === J(null) && J(TK.audit.droppedTail) === J([111, 120]) && J(SH.audit.droppedTail) === J([114, 120]) &&
     TK.audit.featherBottom.px === 16 && TK.audit.featherBottom.guardScope === 'emerge' && TK.audit.featherBottom.guardFrames === 54 && TK.audit.featherBottom.coreGapMin === 35 &&
     VS.audit.featherBottom === undefined && SH.audit.featherBottom === undefined &&
     soft.flash === 0.5 && soft.impulse === 0 && plain.flash === 1 && plain.impulse === 1 &&
     SH.contact === 33 && VS.contact === 0 && TK.contact === 1 &&
     NAGAS.every((n) => n.M.contactRule === 'nova' && n.M.exit === 'native' && n.M.phases.fizzle === undefined && n.M.cellPx === 384 &&
                        n.M.travelScale === undefined && n.M.audit.recipe.keyKind === 'pair' && n.M.audit.recipe.keyChannel === 'RB' &&
                        n.M.audit.recipe.pivot === 'feet' && n.M.atlasSize.w <= 4096 && n.M.atlasSize.h <= 4096 &&
                        MAN.decodedBytes(MAN.forRung(n.M, 256)) < 10 * 1048576),
     J(NAGAS.map((n) => [n.name, n.M.audit.droppedTail, n.M.contact, n.M.cellPx, (MAN.decodedBytes(MAN.forRung(n.M, 256)) / 1048576).toFixed(1)])));
  const FFX14 = JSON.parse(fs.readFileSync(path.join(LAB, 'data', 'factionfx.json'), 'utf8')), DS14 = lib('dissolve');
  ok('M30 · LAB-14 · THE NAGA EXIT PRESET IS STILL UNTUNED AND NOW UNEXERCISED — the M15 note, extended. data/factionfx.json carries a Naga dissolve, but all three Naga actors exit NATIVELY, so nothing in the lab plays it: the Naga preset joins the Deva one as a preset pinned by data rather than by a card. It names no tuning knob and sits at its defaults, ready for a future Naga card that wants the procedural exit',
     !!FFX14.nagas && !!FFX14.nagas.dissolve && Object.keys(DS14.ALIAS).concat(['haze']).every((k) => FFX14.nagas.dissolve[k] === undefined) &&
     NAGAS.every((n) => MAN.exitMode({ entry: REG[n.key], manifest: n.M }).exit === 'native'),
     J(FFX14.nagas));
}
{
  // LAB-13 · the two-channel key. The numbers live where they are produced — the classifier is mirrored here and run over the
  // ground colour EVERY manifest records, so this check re-derives the decision from data rather than pinning a copied figure.
  const KA = (K) => { const ord = [0, 1, 2].sort((x, y) => K[y] - K[x]), [hi, mid, lo] = ord.map((c) => K[c]);
    return (hi - mid) < 0.25 * (mid - lo) ? { kind: 'pair', tag: [ord[0], ord[1]].sort().map((c) => 'RGB'[c]).join(''), margin: [hi - mid, 0.25 * (mid - lo)] }
                                          : { kind: 'single', tag: 'RGB'[ord[0]], margin: [hi - mid, 0.25 * (mid - lo)] }; };
  const ALL = Object.keys(REG).filter((id) => REG[id].manifest).map((id) => {
    const m = JSON.parse(fs.readFileSync(path.join(LAB, 'runtime', REG[id].manifest), 'utf8'));
    return { id, K: m.audit.recipe.keyColour, tag: m.audit.recipe.keyChannel, kind: m.audit.recipe.keyKind, got: KA(m.audit.recipe.keyColour) };
  });
  const pairs = ALL.filter((c) => c.got.kind === 'pair'), singles = ALL.filter((c) => c.got.kind === 'single');
  const kart = ALL.find((c) => c.id === 'kartikeya');
  ok('M22 · LAB-13 · THE CHROMA CLASSIFIER, RE-DERIVED FROM EVERY MANIFEST. A chroma ground is keyed by ONE channel (green, blue) or by a PAIR that together oppose the third — magenta is R and B against G. argmax cannot tell them apart: on Kartikeya\'s ' + J(kart.K) + ' it picks R, and "R − max(G,B)" is ' + (kart.K[0] - Math.max(kart.K[1], kart.K[2])) + ', so the ground reads as LESS key-coloured than the figure and the matte comes out INVERTED. Running the classifier over the ground colour each of the ' + ALL.length + ' manifests recorded: ' + singles.length + ' single (' + singles.map((c) => c.id + ' ' + c.tag).join(', ') + ') and ' + pairs.length + ' pair (' + pairs.map((c) => c.id + ' ' + c.tag).join(', ') + '). Every clip clears the boundary with room — the tightest single is ' + singles.map((c) => c.id + ' ' + c.got.margin.map((v) => v.toFixed(1)).join(' vs ')).sort()[0] + ' and Kartikeya sits at ' + kart.got.margin.map((v) => v.toFixed(1)).join(' vs ') + ' — so the ten shipped actors keep the single-channel path untouched (M8 still pins Meghnad\'s atlases byte-for-byte). The ten shipped manifests predate the recorded kind field, so the classifier is checked against the channel tag they DO carry and against Kartikeya\'s full record',
     ALL.every((c) => (c.kind === undefined || c.got.kind === c.kind) && c.got.tag === c.tag) && ALL.length === Object.keys(REG).filter((id) => REG[id].manifest).length &&
     pairs.every((c) => c.tag === 'RB') && singles.every((c) => c.tag.length === 1) && pairs.length >= 1 && singles.length >= 10 &&
     kart.kind === 'pair' && kart.tag === 'RB' && /chroma magenta\)/.test(JSON.parse(fs.readFileSync(path.join(LAB, 'actors', 'kartikeya', 'manifest.json'), 'utf8')).source) &&
     ALL.every((c) => c.got.margin[0] < c.got.margin[1] === (c.got.kind === 'pair')),
     J(ALL.map((c) => [c.id, c.K, c.kind, c.tag, c.got.kind, c.got.tag])));
  {
    // LAB-13a · WHO TRAVELS, read off the registry rather than a hand list
    const TRAVEL = Object.keys(REG).filter((id) => REG[id].manifest).map((id) => {
      const m = JSON.parse(fs.readFileSync(path.join(LAB, 'runtime', REG[id].manifest), 'utf8'));
      return { id, ts: MAN.travelScale(m), nova: m.contactRule === 'nova', eff: m.contactRule === 'nova' ? 0 : MAN.travelScale(m) };
    });
    const movers = TRAVEL.filter((c) => c.eff > 0);
    ok('M25 · LAB-13a · MEGHNAD IS THE ONLY CARD THAT STILL CHARGES. A card performs in place two ways, and they are not the same thing: a "nova" bursts where it stands whatever its data says (the LAB-9a special case, ' + TRAVEL.filter((c) => c.nova).map((c) => c.id).join(', ') + '), and every other in-place card carries travelScale 0 as DATA (' + TRAVEL.filter((c) => !c.nova && c.ts === 0).map((c) => c.id).join(', ') + '). Kartikeya is the case that proved the distinction matters: he is bolt-edge, not nova, so the nova special case never covered him, and LAB-13 simply never set his travelScale — he shipped on the default 1 and charged ' + '31 px at the player seat and 57 px at the top seat' + ' across ACT, which the owner saw as a shift on the contact sound. BOLT-EDGE DOES NOT IMPLY TRAVEL: travel is per-card data, and the omission, not the contact rule, was the cause',
       J(movers.map((c) => c.id)) === J(['meghnad']) && TRAVEL.find((c) => c.id === 'kartikeya').ts === 0 &&
       TRAVEL.length === Object.keys(REG).filter((id) => REG[id].manifest).length &&
       TRAVEL.every((c) => c.id === 'meghnad' || c.nova || c.ts === 0) && TRAVEL.filter((c) => c.nova).length + TRAVEL.filter((c) => !c.nova && c.ts === 0).length === TRAVEL.length - 1,
       J(TRAVEL.map((c) => [c.id, c.ts, c.nova, c.eff])));
  }
  const tool = fs.readFileSync(path.join(LAB, 'tools', 'make_actor_from_clip.py'), 'utf8');
  ok('M23 · LAB-13 · THE PAIR DESPILL AND THE ALL-FRAMES GUARD ARE IN THE TOOL. The magenta despill is the dual of the green rule (G ← min(G, max(R,B))): subtract max(0, min(R,B) − G) from BOTH key channels, so neither can end below the lone other — which is what leaves his gold, his white and the PEACOCK\'s blue-green untouched (measured spill 0.0 on each; see the README). And the bottom-feather guard now measures the core gap across EVERY EMERGE frame instead of the settled frame alone — the latent LAB-12 found on Garuda, whose talons ride the bottom edge for sixteen frames while f000 clears it by 20 px. EMERGE is the scope, not the whole clip: from the action on, what reaches the edge is the fire the band exists to fade',
     /sp = np\.maximum\(0\.0, np\.minimum\(fg\[\.\.\., k1\], fg\[\.\.\., k2\]\) - fg\[\.\.\., o\]\)/.test(tool) &&
     /fg\[\.\.\., k1\] -= sp; fg\[\.\.\., k2\] -= sp/.test(tool) &&
     /gaps = \{i: core_gap\(raw_matte\(i\)\) for i in emerge\}/.test(tool) &&
     /"guardScope": "emerge"/.test(tool) &&
     /fg\[\.\.\., kc\] = np\.minimum\(fg\[\.\.\., kc\], np\.maximum\(fg\[\.\.\., o1\], fg\[\.\.\., o2\]\)\)/.test(tool),
     'the tool no longer carries the pair despill or the all-frames guard');
  const au = KMAN.audit;
  ok('M24 · LAB-13 · HIS TAIL IS THE BALI-BLOB CLASS, AND WORSE: a translucent figure over magenta UN-MIXES to pink ground, so the dissolve cannot be kept (the share of kept pixels whose source was ground-dominant climbs from 8.9% at f098 to 56.4% at f114 — the README carries the table). ACT stops at f' + KMAN.cells[KMAN.cells.length - 1].src + ' and ' + J(au.droppedTail) + ' are dropped. The trade, recorded: the clip\'s own disintegration is lost and he exits on the fade tail instead (f' + au.fadeTail[0][0] + '–f' + au.fadeTail[9][0] + '), the Vritra precedent where the tail does real work. Contact is the bolt-edge frame f' + au.contactSrc + ' on ACT cell ' + KMAN.contact + ', measured in a window that EXCLUDES f028–f034 where his banner grazes the TOP edge — that rule counts top rows as well as right columns. He stands beside the peacock rather than riding it, so the ordinary feet pivot at ' + J(au.pivotSrc) + ' needed no new reading, and LAB-13a gave him travelScale 0 - the Vel throws, the god stands. cellPx ' + KMAN.cellPx + ': 448 was ruled, but at 448 his 256 rung packs to 27.3% of the 512 rung and breaks the A5 quarter-rung invariant this very suite enforces — 384 packs to 25.4% and costs ' + (MAN.decodedBytes(MAN.forRung(KMAN, 256)) / 1048576).toFixed(1) + ' MB on the low rung, the least of any card in the lab',
     J(au.droppedTail) === J([103, 120]) && KMAN.cells[KMAN.cells.length - 1].src === 102 && au.contactSrc === 50 && KMAN.contact === 5 &&
     au.fadeTail.length === 10 && J(au.fadeTail.map((x) => x[0])) === J(KMAN.cells.slice(-10).map((c) => c.src)) &&
     KMAN.exit === 'native' && KMAN.phases.fizzle === undefined && KMAN.cellPx === 384 && KMAN.travelScale === 0 &&
     J(au.pivotSrc) === J([960.9, 1055]) && au.recipe.pivot === 'feet' && au.featherBottom === undefined &&
     KMAN.atlasSize.w <= 4096 && KMAN.atlasSize.h <= 4096 && MAN.decodedBytes(MAN.forRung(KMAN, 256)) < 12 * 1048576,
     J({ dropped: au.droppedTail, contact: [au.contactSrc, KMAN.contact], pivot: au.pivotSrc }));
}
{
  // LAB-12 · the accepted top cut, the hover pivot, and the A5 ruling that chose his cell size
  const au = GMAN.audit, ft = au.fadeTail || [], src = GMAN.cells.map((c) => c.src);
  const contactCell = GMAN.phases.act[GMAN.contact];
  ok('M20 · LAB-12 · THE HOVERER: HIS EDGE CUT IS ACCEPTED, NOT FEATHERED. Garuda carries NO bottom feather and NO top feather — his wings cross the top frame edge in 42 frames and his CORE sits on row 0 in 40 of them, so the guard that protects Agni, Mahabali, Mahishi and Vritra (the character core must never enter the band) CANNOT be satisfied here: a band deep enough to matter would fade the wings mid-stroke. The standard 8 px feather, which ramps from all four edges, is the whole of his edge softening — Kling framed the wings out, and the actor is honest to the clip. His pivot is his TALON TIPS at ' + J(au.pivotSrc) + ', found by the ordinary feet rule on the settled frame f000 — the ONLY safe frame, since his robe sash hangs below the talons from f002 and shed feathers drift below him from about f045; one pivot, one frame, so it cannot drift while he hovers. Contact is ACT cell ' + GMAN.contact + ' = f' + src[contactCell] + ', the wing snap. Only the EMPTY frames ' + J(au.droppedTail) + ' are dropped — his gold-dust tail is clean, no content trim. cellPx ' + GMAN.cellPx + ' by the A5 ruling: ' + (MAN.decodedBytes(MAN.forRung(GMAN, 256)) / 1048576).toFixed(1) + ' MB on the 256 rung, the rung the budget is drawn against',
     GMAN.audit.featherBottom === undefined && GMAN.exit === 'native' && GMAN.phases.fizzle === undefined && GMAN.contactRule === 'nova' &&
     GMAN.contact === 1 && src[contactCell] === 41 && src[GMAN.phases.act[0]] === 40 &&
     J(au.pivotSrc) === J([944, 1063]) && au.recipe.pivot === 'feet' && au.recipe.feather === 8 &&
     J(au.droppedTail) === J([117, 120]) && src[src.length - 1] === 116 &&
     ft.length === 10 && J(ft.map((x) => x[0])) === J(GMAN.cells.slice(-10).map((c) => c.src)) && ft.every((x, k) => Math.abs(x[1] - (1 - k / 9)) < 1e-4) &&
     GMAN.cellPx === 448 && GMAN.travelScale === undefined &&
     MAN.decodedBytes(MAN.forRung(GMAN, 256)) < 12 * 1048576 && MAN.decodedBytes(GMAN) < MAN.decodedBytes(MAN.forRung(GMAN, 256)) * 4.1 &&
     GMAN.atlasSize.w <= 4096 && GMAN.atlasSize.h <= 4096,
     J({ featherBottom: au.featherBottom, pivot: au.pivotSrc, contact: [GMAN.contact, src[contactCell]], dropped: au.droppedTail, lowRungMB: (MAN.decodedBytes(MAN.forRung(GMAN, 256)) / 1048576).toFixed(1) }));
}
{
  // LAB-11 · what the two new cards settled: a trimmed tail on BOTH (the first pair to need it since Bali), the serpent reading of the feet pivot, and a bottom feather guarded on a settled frame that is NOT frame 0
  const mh = MHMAN.audit, vr = VRMAN.audit, ftM = mh.fadeTail || [], ftV = vr.fadeTail || [];
  const lastKept = (M) => M.cells[M.cells.length - 1].src, ramp = (ft) => ft.length === 10 && ft.every((x, k) => Math.abs(x[1] - (1 - k / 9)) < 1e-4);
  ok('M18 · LAB-11 · THE TRIMMED TAILS, THE COIL-BASE PIVOT AND THE GUARDED BOTTOM FEATHERS. Mahishi stops at f' + lastKept(MHMAN) + ' and drops ' + J(mh.droppedTail) + ': past it her red powder is gone and only khaki ground residue is left, the Bali blob class. Vritra stops at f' + lastKept(VRMAN) + ' and drops ' + J(vr.droppedTail) + ': past it his drifting chunks carry pale ground halos. Both fade tails are the full linear ramp over the last ten cells (Mahishi f' + ftM[0][0] + '–f' + ftM[9][0] + ', Vritra f' + ftV[0][0] + '–f' + ftV[9][0] + '), and on Vritra that tail does real work — his last cell still carries matter, he does not end empty. Both are nova, so the stage gives them zero travel and NEITHER carries a travelScale line. ONE pivot per card for every cell: Mahishi on her feet at ' + J(mh.pivotSrc) + ' (settled f' + mh.featherBottom.guardFrame + ', not frame 0 — her clip opens on an idle that is dropped), Vritra on his COIL BASE at ' + J(vr.pivotSrc) + ' — the serpent reading of "feet", the ground line under the coil, measured once on f0 and reused, so it cannot drift through the rear-up. Bottom feathers ' + mh.featherBottom.px + ' px and ' + vr.featherBottom.px + ' px, each guarded: the standing core stops ' + mh.featherBottom.coreGapMin + ' px and ' + vr.featherBottom.coreGapMin + ' px above the edge, clear of its band. Both packed at cellPx 448 — the first rung of the lever ladder and the only one either needed: NEITHER dropped a frame to thin_alternate, unlike Shukracharya who needed both',
     J(mh.droppedTail) === J([116, 120]) && J(vr.droppedTail) === J([113, 120]) && lastKept(MHMAN) === 115 && lastKept(VRMAN) === 112 &&
     ramp(ftM) && ramp(ftV) && J(ftM.map((x) => x[0])) === J(MHMAN.cells.slice(-10).map((c) => c.src)) && J(ftV.map((x) => x[0])) === J(VRMAN.cells.slice(-10).map((c) => c.src)) &&
     MHMAN.travelScale === undefined && VRMAN.travelScale === undefined && MHMAN.contactRule === 'nova' && VRMAN.contactRule === 'nova' && MHMAN.contact === 0 && VRMAN.contact === 0 &&
     J(vr.pivotSrc) === J([962.8, 1057]) && vr.featherBottom.guardFrame === 0 && mh.featherBottom.guardFrame === 36 &&
     mh.featherBottom.px === 12 && mh.featherBottom.px === mh.featherBottom.asked && mh.featherBottom.coreGapMin === 16 && mh.featherBottom.coreGapMin > mh.featherBottom.px &&
     vr.featherBottom.px === 16 && vr.featherBottom.px === vr.featherBottom.asked && vr.featherBottom.coreGapMin === 24 && vr.featherBottom.coreGapMin > vr.featherBottom.px &&
     MHMAN.cellPx === 448 && VRMAN.cellPx === 448 && J(mh.atlasLever) === J(['cells at 448 px']) && J(vr.atlasLever) === J(['cells at 448 px']) &&
     MHMAN.atlasSize.w <= 4096 && MHMAN.atlasSize.h <= 4096 && VRMAN.atlasSize.w <= 4096 && VRMAN.atlasSize.h <= 4096,
     J({ mh: [mh.droppedTail, mh.pivotSrc, mh.featherBottom, mh.atlasLever], vr: [vr.droppedTail, vr.pivotSrc, vr.featherBottom, vr.atlasLever] }));
}
{
  // LAB-9 · the soft contact, the bottom feather and the atlas levers
  const soft = MAN.contactStrength(SMAN), plain = MAN.contactStrength(AMAN);
  const badS = MAN.validate(Object.assign({}, SMAN, { contactStrength: { flash: 0.5 } })), badS2 = MAN.validate(Object.assign({}, SMAN, { contactStrength: { flash: 9, impulse: 0 } }));
  const fb = NINE.map((n) => [n.folder, (n.M.audit || {}).featherBottom || null]);
  const lever = NINE.map((n) => [n.folder, n.M.cellPx, n.M.audit.atlasLever, n.M.atlasSize]);
  ok('M14 · LAB-9 · THE SOFT CONTACT, THE BOTTOM FEATHER AND THE ATLAS LEVERS: Shukracharya\'s self-cast carries contactStrength ' + J(soft) + ' (half flash, no impulse) and every other card inherits ' + J(plain) + ' (validate refuses a partial or out-of-range strength); Agni and Mahabali carry a guarded bottom-edge feather ' + J(fb.map((x) => x[1] && [x[0], x[1].px + ' px', 'core gap ' + x[1].coreGapMin + ' px'])) + ' and Shukracharya none; the levers each pack needed: ' + J(lever),
     soft.flash === 0.5 && soft.impulse === 0 && plain.flash === 1 && plain.impulse === 1 && !badS.ok && !badS2.ok &&
     [AMAN, MMAN].every((m) => { const f = m.audit.featherBottom; return !!f && f.px > 0 && f.px < f.coreGapMin && f.coreGapMin > 0; }) && !(SMAN.audit || {}).featherBottom &&
     NINE.every((n) => n.M.cellPx === Math.max.apply(null, n.M.cells.map((c) => Math.max(c.w, c.h))) && n.M.cellMax === 512 && n.M.atlasSize.w <= 4096 && n.M.atlasSize.h <= 4096 && MAN.validate(n.M).ok && n.M.exit === 'native' && n.M.contactRule === 'nova') &&
     [MANIFEST, IMAN, BMAN, VMAN].every((m) => m.contactStrength === undefined && !(m.audit || {}).featherBottom),
     J({ soft, fb, lever }));
}
{
  const at = (rev, p) => cp.execFileSync('git', ['show', rev + ':lab/vfx-manifestation/' + p], { cwd: GAME, maxBuffer: 64 * 1024 * 1024 });
  const atlases = ['meghnad'].map((c) => [c, ['atlas.webp', 'atlas_256.webp'].every((f) => at('41ea143', 'actors/' + c + '/' + f).equals(fs.readFileSync(path.join(LAB, 'actors', c, f))))]);   // LAB-10: Meghnad alone is the anchor — Indra was re-packed for his own ending
  const strip = (m) => { const x = JSON.parse(J(m)); delete x.audit.recipe.keyColour; delete x.audit.recipe.keyChannel; return J(x); };
  const manifests = [['meghnad', MANIFEST]].map(([c, m]) => [c, strip(m) === J(JSON.parse(at('41ea143', 'actors/' + c + '/manifest.json').toString('utf8')))]);
  const TOOL = fs.readFileSync(path.join(LAB, 'tools', 'make_actor_from_clip.py'), 'utf8');
  ok('M8 · LAB-7 · THE KEY COLOUR, closed for good (the one known template gap): the pack tool reads the key colour from the frame corners (or a per-card "key_colour" entry) and keys on that colour\'s strongest channel — Meghnad and Indra key on G (' + J(MANIFEST.audit.recipe.keyColour) + ', ' + J(IMAN.audit.recipe.keyColour) + '), Bali on B (' + J(BMAN.audit.recipe.keyColour) + '); no green-only channel arithmetic is left in the tool; re-packed after the change, Meghnad\'s atlases (both rungs) are byte-identical to LAB-6a (41ea143) and his manifest differs only by the two recorded recipe fields (LAB-10 re-packed Indra for the clip\'s own ending, so he is no longer an anchor)',
     atlases.every((x) => x[1]) && manifests.every((x) => x[1]) && MANIFEST.audit.recipe.keyChannel === 'G' && IMAN.audit.recipe.keyChannel === 'G' && BMAN.audit.recipe.keyChannel === 'B' && J(BMAN.audit.recipe.keyColour) === J([0, 69, 197]) &&
     /def key_channels\(K\):/.test(TOOL) && /CFG\.get\("key_colour"\)/.test(TOOL) && !/g - np\.maximum\(r, b\)|fg\[\.\.\., 1\] = np\.minimum|chroma green\)/.test(TOOL), J({ atlases, manifests }));
}

{
  // LAB-10 · THE PRESETS, PINNED BY DATA: with Indra native, no card plays the tuned Deva dissolve by default any more, so its numbers are pinned here
  const FFXP = JSON.parse(fs.readFileSync(path.join(LAB, 'data', 'factionfx.json'), 'utf8')), DSP = lib('dissolve');
  const D = FFXP.devas.dissolve, V = FFXP.vanaras.dissolve;
  const devaWant = { edge: '#ffc94a', core: '#fff6d8', front_width: 0.24, front_soft: 0.08, charge: 0.6, chargeAlpha: 1, noise: 0.5, noiseScale: 9,
                     sweep_frac: 0.7, ember_density: 8, mote_color: '#ffe08a', mote_spread: 26, mote_zone: 0.6, canvas_cap: 140, gpu_cap: 700, smoke: false, seed: 23 };
  const devaArr = { mote_size: [0.6, 1.5], mote_life: [1100, 1700], mote_rise: [8, 40] };
  const hazeWant = { color: '#ffd978', alpha: 0.18, rate: 30 };
  const tunedInVanara = Object.keys(DSP.ALIAS).concat(['haze']).filter((k) => V[k] !== undefined);
  const devaOk = Object.keys(devaWant).every((k) => D[k] === devaWant[k]) && Object.keys(devaArr).every((k) => J(D[k]) === J(devaArr[k])) && !!D.haze && Object.keys(hazeWant).every((k) => D.haze[k] === hazeWant[k]);
  ok('M15 · LAB-10 · THE FACTION EXIT PRESETS, PINNED BY DATA: LAB-6a tuned the Deva dissolve against Indra\'s own tail, and LAB-10 sends Indra out natively — so no card plays that preset by default any more and its numbers are pinned here instead (front ' + D.front_width + '/' + D.front_soft + ', charge ' + D.charge + ', sweep ' + D.sweep_frac + ', motes density ' + D.ember_density + ' colour ' + D.mote_color + ' size ' + J(D.mote_size) + ' life ' + J(D.mote_life) + ' rise ' + J(D.mote_rise) + ' spread ' + D.mote_spread + ' zone ' + D.mote_zone + ', haze ' + D.haze.color + ' at ' + D.haze.alpha + ' × ' + D.haze.rate + '/s, caps ' + D.canvas_cap + '/' + D.gpu_cap + ', no smoke, seed ' + D.seed + '); the Vanara preset names NO tuning knob and stays at the defaults for a future Vanara card (edge ' + V.edge + ', core ' + V.core + ', embers ' + V.embers + ', smoke ' + V.smoke + ', seed ' + V.seed + '); the lab\'s Exit preset dropdown still plays either over any card',
     devaOk && V.edge === '#ff9a3c' && V.core === '#fff0d2' && V.embers === 1.1 && V.emberColor === '#ffc070' && V.smoke === true && V.smokeColor === '#261a0e' && V.seed === 41 && tunedInVanara.length === 0,
     J({ deva: D, vanara: V, tunedInVanara }));
}

// ═══ E · THE EFFECT CLIP (LAB-19) ═══
console.log('\n── E · the additive effect clip ──');
{
  const VM = VJ.M;
  // a canvas that records what the player draws, and a lab clock stepped at a frame rate
  function world(o) {
    o = o || {};
    const draws = [], clears = [], rendered = [], sounds = [], cracks = [];
    const g = { _op: 'source-over', setTransform() {}, clearRect() { clears.push(1); }, drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh) { draws.push({ img, sx, sy, sw, sh, dx, dy, dw, dh, op: this.globalCompositeOperation }); },
      set globalCompositeOperation(v) { this._op = v; }, get globalCompositeOperation() { return this._op; }, globalAlpha: 1 };
    const canvas = { width: 710, height: 840, getContext: () => g };
    let now = 0, live = 0, maxLive = 0, loads = 0;
    const env = { now: () => now, canvas, dpr: 2, cardOf: (uid) => ({ cx: 205, cy: 155.5, w: 64, uid }),
      loadAtlas: (m) => { loads++; live++; maxLive = Math.max(maxLive, live); return { source: { __effect: m.cardId }, bytes: m.atlasSize.w * m.atlasSize.h * 4, close() { live--; } }; },
      render: (b) => rendered.push(b), sound: (n) => sounds.push({ n, t: now }), crack: (uid, ms) => cracks.push({ uid, ms, t: now }), onDone: (r) => { world.last = r; } };
    const P = EC.createPlayer(env);
    return { P, env, draws, clears, rendered, sounds, cracks, step: (ms) => { now += ms; P.frame(now); }, get now() { return now; }, get live() { return live; }, get maxLive() { return maxLive; }, get loads() { return loads; } };
  }
  function drive(f, mode, hz, o) {
    o = o || {};
    const W = world(), run = W.P.play(f, VM, { before: f.before, after: f.after }, { mode });
    const dt = 1000 / hz, frames = [];
    let impactFrame = null, destroyFrame = null, n = 0;
    while (!run.done && n++ < 2000) {
      const d0 = W.draws.length, c0 = run.log.cues.length; W.step(dt);
      const newCues = run.log.cues.slice(c0).map((c) => c.cue), drewImpact = W.draws.slice(d0).some((d) => d.sx === VM.cells[VM.impact].x && d.sy === VM.cells[VM.impact].y);
      if (drewImpact && impactFrame == null) impactFrame = n; if (newCues.indexOf('impact') >= 0) destroyFrame = n;
      if (o.skipAt && W.now >= o.skipAt) { W.P.skip(); break; }
    }
    return { W, run, f, impactFrame, destroyFrame, dt, stats: W.P.stats() };
  }
  const seats = [0, 1];
  {
    const full = seats.map((s) => drive(VJ.FX[s], 'full', 60));
    const cellsOf = (r) => r.run.log.drawn;
    const inOrder = (a) => a.every((x, i) => i === 0 || x > a[i - 1]);
    const fullOk = full.every((r) => cellsOf(r).length === 36 && inOrder(cellsOf(r)) && r.impactFrame === r.destroyFrame && r.W.draws.every((d) => d.op === 'lighter') && r.W.draws.length > 0 &&
      r.W.draws.every((d) => d.img.__effect === 'vajra') && r.stats.decodedBytes === 0 && r.stats.loaded === false && r.stats.releases === 1 && r.W.live === 0 && r.W.maxLive === 1 &&
      J(r.W.sounds.map((x) => x.n)) === J(['sfx_astra', 'sfx_unit_destroy']) && r.W.cracks.length === 1 && r.W.cracks[0].uid === r.f.events[1].targetUids[0] &&
      J(r.W.rendered[r.W.rendered.length - 1]) === J(r.run.boards.after) && r.run.log.settledAt >= r.run.plan.timeline.beatEnd - 1e-6 && r.run.log.settledAt < r.run.plan.timeline.beatEnd + r.dt + 1e-6 &&
      Math.abs(r.run.log.destroyCueAt - r.run.plan.timeline.destroyAt) < r.dt + 1e-6);
    // the impact cell's first frame is the destroy beat's frame; and the crack is its own beat after
    ok('E1 · LAB-19 · FULL at 60 Hz, both seats: every one of the 36 cells drawn in order, each with "lighter" (additive), from the one decoded atlas; the IMPACT CELL (f093) is first drawn on the SAME FRAME the destroy beat fires (seat 0 frame ' + full[0].impactFrame + ' = ' + full[0].destroyFrame + ', seat 1 frame ' + full[1].impactFrame + ' = ' + full[1].destroyFrame + '), within one frame of the contract\'s ' + Math.round(full[0].run.plan.timeline.destroyAt) + ' ms; sfx_astra at the cast and sfx_unit_destroy at the beat, nothing else; the crack on the mark; the board lands on the engine\'s AFTER when the beat ends (' + Math.round(full[0].run.plan.timeline.beatEnd) + ' ms), and the aftermath plays on, un-awaited, to ' + Math.round(full[0].run.plan.timeline.clipEnd) + ' ms; then the atlas is released (decoded 0, one decode and one release, never two clips live)',
       fullOk, J(full.map((r) => ({ drawn: cellsOf(r).length, impactFrame: r.impactFrame, destroyFrame: r.destroyFrame, stats: r.stats, sounds: r.W.sounds, cracks: r.W.cracks }))));
    const hz30 = seats.map((s) => drive(VJ.FX[s], 'full', 30)), fast = seats.map((s) => drive(VJ.FX[s], 'fast', 60));
    ok('E2 · LAB-19 · THE SYNC HOLDS at 30 Hz and at Fast: the clip is TIMED, not stepped — a slow frame shows the cell that is due, so the impact still lands on the destroy beat\'s frame (30 Hz: ' + hz30.map((r) => r.impactFrame + '=' + r.destroyFrame).join(', ') + ' · Fast 60 Hz: ' + fast.map((r) => r.impactFrame + '=' + r.destroyFrame).join(', ') + '). At 30 Hz a cell lasts 1.63 frames, so every cell still draws (' + hz30.map((r) => r.run.log.drawn.length).join(', ') + ' of 36, in order) — but a frame longer than a cell (a stall) would skip one rather than drift off the beat; at Fast the whole plan scales by 0.6 and ' + fast.map((r) => r.run.log.drawn.length).join(', ') + ' of 36 draw. Both release afterwards',
       hz30.concat(fast).every((r) => r.impactFrame === r.destroyFrame && inOrder(r.run.log.drawn) && r.run.log.drawn.indexOf(VM.impact) >= 0 && r.stats.decodedBytes === 0 && r.W.live === 0) &&
       hz30.every((r) => r.run.log.drawn.length >= 20) && fast.every((r) => r.run.log.drawn.length >= 30 && Math.abs(r.run.plan.timeline.destroyAt - 0.6 * full[0].run.plan.timeline.destroyAt) < 1e-6),
       J(hz30.concat(fast).map((r) => [r.impactFrame, r.destroyFrame, r.run.log.drawn.length])));
    const reduced = seats.map((s) => drive(VJ.FX[s], 'reduced', 60));
    ok('E3 · LAB-19 · REDUCED MOTION, both seats: no clip — no atlas decoded, nothing drawn — while the contract\'s beats still run (the game keeps audio under reduced motion): sfx_astra, sfx_unit_destroy, the crack, and the board on AFTER',
       reduced.every((r) => r.W.loads === 0 && r.W.draws.length === 0 && r.run.plan.clip === false && J(r.W.sounds.map((x) => x.n)) === J(['sfx_astra', 'sfx_unit_destroy']) && r.W.cracks.length === 1 && J(r.W.rendered[r.W.rendered.length - 1]) === J(r.run.boards.after) && r.stats.peak === 0),
       J(reduced.map((r) => [r.W.loads, r.W.draws.length, r.W.sounds])));
    const skipMid = seats.map((s) => drive(VJ.FX[s], 'full', 60, { skipAt: 1200 }));
    ok('E4 · LAB-19 · SKIP MID-CLIP (at 1200 ms, after the clip started and before the destroy beat), both seats: the board lands on the engine\'s AFTER at once, the atlas is released (decoded 0), the canvas is cleared, and the result says skipped',
       skipMid.every((r) => r.run.done && J(r.W.rendered[r.W.rendered.length - 1]) === J(r.run.boards.after) && r.stats.decodedBytes === 0 && r.W.live === 0 && r.W.clears.length > 0 && world.last && world.last.skipped === true && r.run.log.drawn.length > 0),
       J(skipMid.map((r) => [r.run.log.drawn.length, r.stats])));
    // E1 one at a time: start a second play while the first is live
    const W = world(), f0 = VJ.FX[0];
    W.P.play(f0, VM, { before: f0.before, after: f0.after }, { mode: 'full' }); for (let i = 0; i < 70; i++) W.step(1000 / 60);
    const liveMid = W.live;
    W.P.play(VJ.FX[1], VM, { before: VJ.FX[1].before, after: VJ.FX[1].after }, { mode: 'full' });
    const liveAfterSecond = W.live, st = W.P.stats();
    ok('E5 · LAB-19 · E1, ONE CLIP AT A TIME: a second play started while the first clip is live ends the first (its board lands on AFTER, its atlas released) BEFORE the second decodes — live atlases ' + liveMid + ' → ' + liveAfterSecond + ', never two; peak decoded ' + (st.peak / 1048576).toFixed(2) + ' MB = one clip, under the E1 cap',
       liveMid === 1 && liveAfterSecond === 1 && W.maxLive === 1 && st.loads === 2 && st.releases === 1 && st.peak === VM.atlasSize.w * VM.atlasSize.h * 4 && st.peak <= EC.E1.capBytes, J({ liveMid, liveAfterSecond, st: { loads: st.loads, releases: st.releases, peak: st.peak } }));
    // the bake is the game's
    const G_HTML = fs.readFileSync(path.join(GAME, 'index.html'), 'utf8'), px = new Uint8ClampedArray([0, 0, 0, 255, 200, 40, 10, 255, 30, 90, 60, 255, 2, 1, 0, 255]);
    EC.bake(px);
    ok('E6 · LAB-19 · THE DRAW IS THE GAME\'S EFFECT CONTRACT: the luminance alpha is the game\'s bakeAlpha (alpha = the brightest channel — pure black becomes fully transparent, the ground\'s 2 stays near-invisible) and every cell is drawn "lighter", as the game\'s sheet sprites are; the lab page wires the player into its own layer (#effectclip, z 6, with the effect layer and under the actor), gives an effect entry its Play button, and never sends it through the director',
       J([px[3], px[7], px[11], px[15]]) === J([0, 200, 90, 2]) && /d\[i\+3\]= r>gg \? \(r>b\?r:b\) : \(gg>b\?gg:b\);/.test(G_HTML) && /const blend = s\.smoke \? 'source-over' : 'lighter';/.test(G_HTML) &&
       /#effectclip\{ position:absolute; inset:0; z-index:6;/.test(fs.readFileSync(path.join(LAB, 'index.html'), 'utf8')) && /if \(REG\[currentCard\] && REG\[currentCard\]\.effect\) return playEffect\(\);/.test(fs.readFileSync(path.join(LAB, 'lab.js'), 'utf8')) &&
       fs.readFileSync(path.join(LAB, 'lab.js'), 'utf8').indexOf('return playEffect();') < fs.readFileSync(path.join(LAB, 'lab.js'), 'utf8').indexOf('const ctx = window.ClashContext.fromBatch(F);\n    const boards'),
       J([px[3], px[7], px[11], px[15]]));
  }
}

// ═══ E · THE CHAIN AND THE IMPACT PIN (LAB-20) ═══
console.log('\n── E · the effect chain and the impact pin ──');
{
  function chainWorld(o) {
    o = o || {};
    const draws = [], rendered = [], sounds = [], exits = [], callouts = [], events = [];
    let tf = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
    const g = { _op: 'source-over', setTransform(a, b, c, d, e, f) { tf = { a, b, c, d, e, f }; }, clearRect() {}, drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh) { draws.push({ img, sx, sy, dx, dy, dw, dh, op: this._op, tf: Object.assign({}, tf), rot: Math.atan2(tf.b, tf.a) * 180 / Math.PI }); },
      set globalCompositeOperation(v) { this._op = v; }, get globalCompositeOperation() { return this._op; }, globalAlpha: 1 };
    let now = o.t0 || 0, live = 0, maxLive = 0, loads = [];
    const env = { now: () => now, canvas: { width: 820, height: 840, getContext: () => g }, dpr: 2,
      cardOf: (uid) => ({ cx: o.cardCx != null ? o.cardCx : 205, cy: o.cardCy != null ? o.cardCy : 55, w: 64 }), halfOf: (seat) => ({ cx: o.halfX != null ? o.halfX : 205, cy: seat === 0 ? 315 : 105 }), fieldCentreX: () => 205,
      loadAtlas: (m) => { live++; maxLive = Math.max(maxLive, live); loads.push({ role: m.role || 'single', t: now, liveAfter: live }); events.push('load:' + (m.role || m.cardId)); return { source: { __effect: m.role || m.cardId }, bytes: m.atlasSize.w * m.atlasSize.h * 4, close() { live--; events.push('release:' + (m.role || m.cardId)); } }; },
      render: (b) => rendered.push(b), sound: (n) => sounds.push(n), crack: (uid, ms) => exits.push(['crack', uid, ms]), removal: (uid, ms) => exits.push(['removal', uid, ms]), callout: (uid, t) => callouts.push([uid, t]),
      onDone: (r) => { chainWorld.last = r; } };
    const P = EC.createPlayer(env);
    return { P, draws, rendered, sounds, exits, callouts, events, loads, step: (ms) => { now += ms; P.frame(now); }, get live() { return live; }, get maxLive() { return maxLive; } };
  }
  // drive a play at hz; the phase offset shifts the frame grid against the plan (a real device's frames never align with the beats)
  function driveChain(f, spec, mode, hz, o) {
    o = o || {};
    const W = chainWorld(o), run = W.P.play(f, spec, { before: f.before, after: f.after }, { mode, casterSeat: f.attackerSeat, impactPin: o.pin });
    const dt = 1000 / hz, impactCell = (spec.class === 'effect-chain' ? spec.clips[1] : spec).cells[(spec.class === 'effect-chain' ? spec.clips[1] : spec).impact];
    let biteFrame = null, impactFrame = null, n = 0;
    if (o.phase) W.step(o.phase);
    while (!run.done && n++ < 4000) {
      const d0 = W.draws.length, c0 = run.log.cues.length; W.step(dt);
      if (run.log.cues.slice(c0).some((c) => c.cue === 'impact')) biteFrame = n;
      if (impactFrame == null && W.draws.slice(d0).some((d) => d.img.__effect === (spec.class === 'effect-chain' ? 'strike' : spec.cardId) && d.sx === impactCell.x && d.sy === impactCell.y)) impactFrame = n;
      if (o.skipAt && n * dt + (o.phase || 0) >= o.skipAt) { W.P.skip(); break; }
    }
    return { W, run, biteFrame, impactFrame, stats: W.P.stats() };
  }
  const inOrder = (a) => a.every((x, i) => i === 0 || x > a[i - 1]);
  const full = [0, 1].map((s) => driveChain(SU.FX[s], SU.spec, 'full', 60));
  const hero = (f) => f.events[1].targetUids[0];
  ok('E7 · LAB-20 · THE CHAIN, FULL at 60 Hz, both seats: the INVOCATION draws all 16 cells in order at the caster\'s half centre (seat 0 casts from the lower half, seat 1 from the upper), then at the handoff it is RELEASED and only then the STRIKE decodes (the order of events: ' + full[0].W.events.join(' → ') + '; never two atlases live) and draws all 55 cells in order on the Hero; the strike\'s impact cell is first drawn on the SAME FRAME as the bite (seat 0 frame ' + full[0].impactFrame + ' = ' + full[0].biteFrame + ', seat 1 ' + full[1].impactFrame + ' = ' + full[1].biteFrame + '); every cell "lighter"; one sound — sfx_astra at the cast, the bite silent; the Hero\'s exit is the clean REMOVAL, not a crack; the callout names Sudarshana Chakra; the board lands on AFTER; both atlases released (decoded 0; peak ' + (full[0].stats.peak / 1048576).toFixed(2) + ' MB = the strike alone)',
     full.every((r, s2) => { const inv = r.run.log.bySegment.invoke, st = r.run.log.bySegment.strike, invDraws = r.W.draws.filter((d) => d.img.__effect === 'invoke');
       return inv.length === 16 && inOrder(inv) && st.length === 55 && inOrder(st) && r.impactFrame === r.biteFrame && r.W.maxLive === 1 && J(r.W.events) === J(['load:invoke', 'release:invoke', 'load:strike', 'release:strike']) &&
         r.W.draws.every((d) => d.op === 'lighter') && J(r.W.sounds) === J(['sfx_astra']) && J(r.W.exits.map((x) => [x[0], x[1]])) === J([['removal', hero(SU.FX[s2])]]) && J(r.W.callouts) === J([[hero(SU.FX[s2]), 'Sudarshana Chakra']]) &&
         J(r.W.rendered[r.W.rendered.length - 1]) === J(SU.FX[s2].after) && r.stats.decodedBytes === 0 && r.W.live === 0 && r.stats.peak === SU.S.atlasSize.w * SU.S.atlasSize.h * 4 &&
         invDraws.every((d) => Math.abs((d.dx / 2) + SU.I.anchor.x * (d.dw / 2) / SU.I.cellSize.w - 205) < 0.5 && Math.abs((d.dy / 2) + SU.I.anchor.y * (d.dh / 2) / SU.I.cellSize.h - (SU.FX[s2].attackerSeat === 0 ? 315 : 105)) < 0.5); }),
     J(full.map((r) => ({ inv: r.run.log.bySegment.invoke.length, strike: r.run.log.bySegment.strike.length, frames: [r.impactFrame, r.biteFrame], events: r.W.events, sounds: r.W.sounds, exits: r.W.exits }))));
  const speeds = [['full', 30], ['fast', 60], ['fast', 30]].map(([m, hz]) => [m + ' ' + hz + ' Hz', [0, 1].map((s) => driveChain(SU.FX[s], SU.spec, m, hz))]);
  ok('E8 · LAB-20 · THE CHAIN AT 30 Hz AND AT FAST, both seats: the bite\'s frame always draws the strike\'s impact cell (' + speeds.map((x) => x[0] + ': ' + x[1].map((r) => r.impactFrame + '=' + r.biteFrame).join(', ')).join(' · ') + '); cells stay in order, never two atlases live, both released. The S-prediction held: at Full 30 Hz a cell (54 ms) outlasts a frame, so all 16 + 55 cells draw (' + speeds[0][1].map((r) => r.run.log.bySegment.invoke.length + '+' + r.run.log.bySegment.strike.length).join(', ') + '); at Fast 30 Hz a cell (32.5 ms) is just shorter than a frame, so a few fall between frames (' + speeds[2][1].map((r) => r.run.log.bySegment.invoke.length + '+' + r.run.log.bySegment.strike.length).join(', ') + ')',
     speeds.every((x) => x[1].every((r) => r.impactFrame === r.biteFrame && inOrder(r.run.log.bySegment.invoke) && inOrder(r.run.log.bySegment.strike) && r.W.maxLive === 1 && r.stats.decodedBytes === 0)) &&
     speeds[0][1].every((r) => r.run.log.bySegment.invoke.length === 16 && r.run.log.bySegment.strike.length === 55),
     J(speeds.map((x) => [x[0], x[1].map((r) => [r.impactFrame, r.biteFrame, r.run.log.bySegment.invoke.length, r.run.log.bySegment.strike.length])])));
  // THE IMPACT PIN, retro-applied to Vajra: sweep the frame grid's phase against the plan at Fast on a 30 Hz device, pin off and on
  const sweep = (f, spec, pin) => { let miss = 0, pinned = 0; for (let ph = 0; ph < 33; ph += 1) { const r = driveChain(f, spec, 'fast', 30, { phase: ph + 0.37, pin }); if (r.impactFrame !== r.biteFrame) miss++; if (r.run.log.impactPinned) pinned++; } return { miss, pinned }; };
  const pinRes = { vajraOff: sweep(VJ.FX[0], VJ.M, false), vajraOn: sweep(VJ.FX[0], VJ.M, true), chainOff: sweep(SU.FX[0], SU.spec, false), chainOn: sweep(SU.FX[0], SU.spec, true) };
  ok('E9 · LAB-20 · THE IMPACT PIN, AND THE SELF-AUDIT THAT RETRO-APPLIES IT TO VAJRA: a timed clip draws the cell that is due, so at Fast on a 30 Hz device (a cell of 32.5 ms, a frame of 33.3) a frame can straddle the impact cell and show the next one — exactly on the beat. Sweeping the frame grid\'s phase over a whole frame (33 offsets), with the pin OFF the impact cell is missed on the beat\'s frame for Vajra ' + pinRes.vajraOff.miss + ' times and for the Sudarshana chain ' + pinRes.chainOff.miss + ' times: LAB-19\'s E2 checked Fast only at 60 Hz, so Vajra carried this latent gap. With the pin ON — the beat\'s frame always draws the impact cell — both miss 0 (Vajra pinned on ' + pinRes.vajraOn.pinned + ' offsets, the chain on ' + pinRes.chainOn.pinned + ')',
     pinRes.vajraOff.miss > 0 && pinRes.chainOff.miss > 0 && pinRes.vajraOn.miss === 0 && pinRes.chainOn.miss === 0 && pinRes.vajraOn.pinned === pinRes.vajraOff.miss && pinRes.chainOn.pinned === pinRes.chainOff.miss, J(pinRes));
  const reduced = [0, 1].map((s) => driveChain(SU.FX[s], SU.spec, 'reduced', 60));
  const noTarget = [0, 1].map((s) => { const f = SU.FX[s], batch = { events: [f.events[0]], before: f.before, after: f.before }; return driveChain(batch, SU.spec, 'full', 60); });
  ok('E10 · LAB-20 · REDUCED, and NO TARGET, both seats. Reduced: no atlas decoded and nothing drawn, while the beats run (sfx_astra, the removal, the callout, AFTER). No target (a cast with no removal event): NOTHING plays — no invocation either: no decode, no draw, no removal, no callout; the cast sound and the settle only, the F65 doctrine for a chain',
     reduced.every((r, s2) => r.W.loads.length === 0 && r.W.draws.length === 0 && J(r.W.sounds) === J(['sfx_astra']) && r.W.exits.length === 1 && r.W.exits[0][0] === 'removal' && r.W.callouts.length === 1 && J(r.W.rendered[r.W.rendered.length - 1]) === J(SU.FX[s2].after)) &&
     noTarget.every((r) => r.W.loads.length === 0 && r.W.draws.length === 0 && r.W.exits.length === 0 && r.W.callouts.length === 0 && J(r.W.sounds) === J(['sfx_astra']) && J(r.run.plan.cues.map((c) => c.cue)) === J(['cast', 'settle'])),
     J({ reduced: reduced.map((r) => [r.W.loads.length, r.W.draws.length, r.W.sounds]), noTarget: noTarget.map((r) => [r.W.loads.length, r.W.draws.length, r.run.plan.cues.map((c) => c.cue)]) }));
  const skipInv = [0, 1].map((s) => driveChain(SU.FX[s], SU.spec, 'full', 60, { skipAt: 500 })), skipStr = [0, 1].map((s) => driveChain(SU.FX[s], SU.spec, 'full', 60, { skipAt: 1500 }));
  // LAB-20b: per-draw rotation on the stage, the six measured cases (the phone board: halves at x 178; the enemy Hero row at y 55 / 365)
  const rotCases = [[0, 106, -105.5], [0, 178, -90], [0, 250, -74.5], [1, 106, 105.5], [1, 178, 90], [1, 250, 74.5]].map(([seat, x, want]) => {
    const r = driveChain(SU.FX[seat], SU.spec, 'full', 60, { halfX: 178, cardCx: x, cardCy: seat === 0 ? 55 : 365 }), tv = r.run.log.travelPlan, strikeDraws = r.W.draws.filter((d) => d.img.__effect === 'strike');
    const tDraws = r.run.log.travel.map((e, i2) => Object.assign({}, e, { deg: e.rot * 180 / Math.PI }));
    const flying = tDraws.filter((e) => e.t < tv.arriveAt), parked = tDraws.filter((e) => e.t >= tv.arriveAt && e.t < tv.rotationZeroAt), after = tDraws.filter((e) => e.t >= tv.rotationZeroAt);
    const impactDraw = tDraws.find((e) => e.cell === SU.S.impact);
    return { seat, x, want, flyingOk: flying.length > 0 && flying.every((e) => Math.abs(e.deg - want) <= 0.5), parkedEases: parked.length > 0 && parked.every((e, i2) => i2 === 0 || Math.abs(e.deg) <= Math.abs(parked[i2 - 1].deg) + 1e-9),
      impactUpright: !!impactDraw && Math.abs(impactDraw.deg) <= 0.5, afterUpright: after.every((e) => Math.abs(e.deg) <= 0.5), stageMatches: strikeDraws.length === tDraws.length && strikeDraws.every((d, i2) => Math.abs(d.rot - tDraws[i2].deg) < 1e-6),
      invocationUpright: r.W.draws.filter((d) => d.img.__effect === 'invoke').every((d) => d.tf.b === 0 && d.tf.c === 0), flying: flying.length, parked: parked.length, impactDeg: impactDraw && Math.round(impactDraw.deg * 100) / 100, impactFrame: r.impactFrame, biteFrame: r.biteFrame };
  });
  ok('E11 · LAB-20 / 20b · SKIP DURING THE INVOCATION (500 ms) and DURING THE STRIKE (1500 ms), both seats: the board lands on AFTER at once and whatever atlas is live is released (decoded 0); a skipped invocation never decodes the strike. AND THE ROTATION RULE ON THE STAGE, the six measured cases (both seats × the left, centre and right Hero slots): every strike draw while travelling is rotated to the caster-to-target vector within 0.5° (' + rotCases.map((c2) => c2.want + '°').join(', ') + '); over the parked cells the rotation only shrinks; the impact cell (f053) draws upright (' + rotCases.map((c2) => c2.impactDeg + '°').join(', ') + ') and so does everything after; the stage\'s transforms are the travel log\'s; the invocation never rotates; the bite is still the impact cell\'s frame',
     skipInv.every((r, s2) => r.run.done && r.stats.decodedBytes === 0 && r.W.live === 0 && J(r.W.events) === J(['load:invoke', 'release:invoke']) && J(r.W.rendered[r.W.rendered.length - 1]) === J(SU.FX[s2].after)) &&
     skipStr.every((r, s2) => r.run.done && r.stats.decodedBytes === 0 && r.W.live === 0 && J(r.W.events) === J(['load:invoke', 'release:invoke', 'load:strike', 'release:strike']) && J(r.W.rendered[r.W.rendered.length - 1]) === J(SU.FX[s2].after)) &&
     rotCases.every((c2) => c2.flyingOk && c2.parkedEases && c2.impactUpright && c2.afterUpright && c2.stageMatches && c2.invocationUpright && c2.impactFrame === c2.biteFrame),
     J({ skipInv: skipInv.map((r) => r.W.events), skipStr: skipStr.map((r) => r.W.events), rotCases }));
  // LAB-20b · THE TRAVEL: the layer leaves the anchor on the first drawn strike cell and reaches the target by the trail's death, on the table
  const travelOk = (log, spec) => {
    const tv = log.travelPlan, T = spec.clips[1].travel, e = log.travel; if (!tv || !e.length) return false;
    const near = (a2, b2, tol) => Math.hypot(a2.x - b2.x, a2.y - b2.y) <= tol, span = tv.arriveAt - tv.firstDrawAt, dist = Math.hypot(tv.to.x - tv.from.x, tv.to.y - tv.from.y);
    const first = e[0], arrived = e.find((x) => x.t >= tv.arriveAt);
    const onTable = e.every((x) => { const u = span > 0 ? Math.min(1, Math.max(0, (x.t - tv.firstDrawAt) / span)) : 1, p2 = EC.lut(T.table, u); return Math.abs(x.x - (tv.from.x + (tv.to.x - tv.from.x) * p2)) <= 1 && Math.abs(x.y - (tv.from.y + (tv.to.y - tv.from.y) * p2)) <= 1; });
    const monotonic = e.every((x, i2) => i2 === 0 || Math.hypot(x.x - tv.from.x, x.y - tv.from.y) >= Math.hypot(e[i2 - 1].x - tv.from.x, e[i2 - 1].y - tv.from.y) - 1e-6);
    const scaleOk = Math.abs(first.scale - spec.chain.travel.scaleFrom) <= 0.01 && !!arrived && Math.abs(arrived.scale - 1) <= 0.01;
    return first.t === tv.firstDrawAt && near(first, tv.from, 0.5) && !!arrived && near(arrived, tv.to, 0.5) && onTable && monotonic && scaleOk && dist > 100;
  };
  const clone2 = (x) => JSON.parse(J(x));
  const travelRuns = [['full', 60], ['fast', 60], ['full', 30], ['fast', 30]].map(([m2, hz]) => [0, 1].map((seat) => ({ m2, hz, seat, r: driveChain(SU.FX[seat], SU.spec, m2, hz, { halfX: 178, cardCx: 178, cardCy: seat === 0 ? 55 : 365 }) }))).flat();
  const base = travelRuns[0].r.run.log;
  const parkedLog = clone2(base); parkedLog.travel.forEach((x) => { x.x = parkedLog.travelPlan.to.x; x.y = parkedLog.travelPlan.to.y; });
  const linearLog = clone2(base); { const tv = linearLog.travelPlan, span = tv.arriveAt - tv.firstDrawAt; linearLog.travel.forEach((x) => { const u = Math.min(1, Math.max(0, (x.t - tv.firstDrawAt) / span)); x.x = tv.from.x + (tv.to.x - tv.from.x) * u; x.y = tv.from.y + (tv.to.y - tv.from.y) * u; }); }
  // a lost first cell: the strike's decode is ready 70 ms after its start — the real player departs from the anchor; a player whose flight clock started at the planned start would not
  const jumpLog = (log) => { const j = clone2(log), tv = j.travelPlan, T = SU.S.travel, span = tv.arriveAt - tv.plannedStart; j.travel.forEach((x) => { const u = Math.min(1, Math.max(0, (x.t - tv.plannedStart) / span)), p2 = EC.lut(T.table, u); x.x = tv.from.x + (tv.to.x - tv.from.x) * p2; x.y = tv.from.y + (tv.to.y - tv.from.y) * p2; }); return j; };
  const negT = { parked: travelOk(parkedLog, SU.spec), linear: travelOk(linearLog, SU.spec) };
  ok('E15 · LAB-20b · THE CHAKRA TRAVELS, both seats, Full and Fast, at 60 and 30 Hz (' + travelRuns.length + ' runs): the strike layer is at the CASTER\'S HALF CENTRE on its first drawn cell (the invocation\'s anchor — the disc hands off in place), follows the trail\'s own integral at every drawn frame (±1 px), never backs up, and is at the TARGET\'S CENTRE from the trail\'s death (f046) on (±0.5 px); its scale eases from ' + SU.C.travel.scaleFrom + ' to 1.0 on the same curve; the bite is unchanged (' + travelRuns.map((x) => x.m2 + ' ' + x.hz + ' Hz seat ' + x.seat + ': impact frame ' + x.r.impactFrame + ' = bite ' + x.r.biteFrame).slice(0, 2).join(' · ') + ' …). Falsifiable: a doctored PARKED player (the layer always on the target) is ' + (negT.parked ? 'NOT caught' : 'caught') + '; a LINEAR-eased player is ' + (negT.linear ? 'NOT caught' : 'caught') + '; see E15b for the lost-first-cell jump',
     travelRuns.every((x) => travelOk(x.r.run.log, SU.spec) && x.r.impactFrame === x.r.biteFrame) && negT.parked === false && negT.linear === false,
     J({ runs: travelRuns.map((x) => ({ m: x.m2, hz: x.hz, seat: x.seat, ok: travelOk(x.r.run.log, SU.spec), plan: x.r.run.log.travelPlan, first: x.r.run.log.travel[0] })), negT }));
  // ── LAB-20a · FAILS OPEN: the beats never wait on a decode ──
  // a deferred loader the test resolves or rejects at a chosen moment, synchronously (a real promise would settle only after the loop)
  function driveFail(f, spec, loaderFor, o) {
    o = o || {};
    const draws = [], rendered = [], sounds = [], exits = [], callouts = [], errs = [], closes = [];
    let now = 0, live = 0, maxLive = 0;
    const g = { _op: 'source-over', setTransform() {}, clearRect() {}, drawImage(img) { if (o.drawThrows) throw new Error('drawImage failed (doctored)'); draws.push(img.__effect); }, set globalCompositeOperation(v) { this._op = v; }, get globalCompositeOperation() { return this._op; }, globalAlpha: 1 };
    const mk = (m) => { live++; maxLive = Math.max(maxLive, live); return { source: { __effect: m.role || m.cardId }, bytes: m.atlasSize.w * m.atlasSize.h * 4, close() { live--; closes.push(m.role || m.cardId); } }; };
    const pending = [];
    const env = { now: () => now, canvas: { width: 820, height: 840, getContext: () => g }, dpr: 2, cardOf: () => ({ cx: 205, cy: f.attackerSeat === 1 ? 365 : 55, w: 64 }), halfOf: (seat) => ({ cx: 205, cy: seat === 0 ? 315 : 105 }), fieldCentreX: () => 205,
      loadAtlas: (m) => loaderFor(m, mk, pending), render: (b) => rendered.push(b), sound: (n) => sounds.push({ n, t: now }), crack: (u) => exits.push(['crack', u, now]), removal: (u) => exits.push(['removal', u, now]), callout: (u, t) => callouts.push([u, t, now]),
      onError: (e) => errs.push(String(e && (e.message || e))), onDone: (r) => { env.result = r; } };
    const P = (o.lib || EC).createPlayer(env);
    let run = P.play(f, spec, { before: f.before, after: f.after }, { mode: o.mode || 'full', casterSeat: f.attackerSeat });
    const settleAt = [];
    for (let n = 0; n < 400 && !(run && run.done); n++) {
      now += 1000 / 60;
      pending.filter((d) => !d.settled && d.at != null && now >= d.at).forEach((d) => { d.settled = true; d.fire(); });
      P.frame(now);
      if (rendered.length && J(rendered[rendered.length - 1]) === J(f.after) && !settleAt.length) settleAt.push(now);
    }
    return { run, draws, rendered, sounds, exits, callouts, errs, closes, maxLive, live, settleAt: settleAt[0], P };
  }
  const deferred = (pending, at, mode) => (m, mk) => { const d = { at, then(ok, bad) { d.ok = ok; d.bad = bad; } }; d.fire = () => (mode === 'reject' ? d.bad(new Error('decode failed (doctored)')) : d.ok(mk(m))); pending.push(d); return d; };
  const L = {
    'the loader throws': () => () => { throw new Error('createImageBitmap is not a function (doctored)'); },
    'the decode rejects': (pend) => (m, mk, pending) => { const d = { at: 60, then(ok, bad) { d.bad = bad; } }; d.fire = () => d.bad(new Error('decode failed (doctored)')); pending.push(d); return d; },
    'the decode never settles': () => (m, mk, pending) => ({ then() {} }),
    'every decode arrives 1.2 s late': () => (m, mk, pending) => { const d = { at: 1200, then(ok, bad) { d.ok = ok; } }; d.fire = () => d.ok(mk(m)); pending.push(d); return d; },
    'only the strike fails (at the handoff)': () => (m, mk, pending) => { if (m.role !== 'strike') return mk(m); const d = { at: 950, then(ok, bad) { d.bad = bad; } }; d.fire = () => d.bad(new Error('strike decode failed (doctored)')); pending.push(d); return d; },
  };
  const beatsOk = (r, f, spec) => {
    const chained = spec.class === 'effect-chain', T = r.run.plan.timeline, hero = f.events[1].targetUids[0], dt = 1000 / 60 + 1e-6;
    const cast = r.sounds.find((x) => x.n === 'sfx_astra'), settle = r.run.log.settledAt;
    const beat = chained ? r.exits.length === 1 && r.exits[0][0] === 'removal' && r.exits[0][1] === hero && Math.abs(r.exits[0][2] - T.crackAt) <= dt && r.callouts.length === 1 && r.callouts[0][1] === 'Sudarshana Chakra'
                         : r.exits.length === 1 && r.exits[0][0] === 'crack' && r.sounds.some((x) => x.n === 'sfx_unit_destroy' && Math.abs(x.t - T.destroyAt) <= dt);
    return !!cast && cast.t <= dt && beat && settle != null && Math.abs(settle - T.beatEnd) <= dt && J(r.rendered[r.rendered.length - 1]) === J(f.after) && r.run.done && r.maxLive <= 1 && r.live === 0;
  };
  const matrix = [];
  [['Vajra', VJ.FX, VJ.M], ['Sudarshana', SU.FX, SU.spec]].forEach(([name, FX, spec]) => [0, 1].forEach((seat) => Object.keys(L).forEach((k) => {
    if (name === 'Vajra' && k === 'only the strike fails (at the handoff)') return;
    const r = driveFail(FX[seat], spec, L[k]());
    matrix.push({ name, seat, k, ok: beatsOk(r, FX[seat], spec), drawn: r.draws.length, errs: r.errs.length, late: r.run.log.late.length, ready: r.run.log.ready }); })));
  const drawErr = [[VJ.FX[0], VJ.M], [SU.FX[1], SU.spec]].map(([f, spec]) => { const r = driveFail(f, spec, () => (m, mk) => mk(m), { drawThrows: true }); return { ok: beatsOk(r, f, spec) && !!r.run.log.drawError && r.errs.length === 1 && r.draws.length === 0, err: r.run.log.drawError }; });
  const lateChain = matrix.filter((x) => x.name === 'Sudarshana' && x.k === 'every decode arrives 1.2 s late');
  ok('E12 · LAB-20a · FAILS OPEN — THE BEATS NEVER WAIT ON A DECODE, Vajra and the chain, both seats. play() now starts the timeline at once (the board drawn, the cast cue at 0 ms) and each clip decodes ALONGSIDE; a clip that is not ready, or failed, simply does not draw. Under every doctored failure — ' + Object.keys(L).join(' · ') + ' — sfx_astra still sounds at 0 ms, the impact beat still lands on schedule (Vajra: sfx_unit_destroy and the crack at the destroy beat; the chain: the REMOVAL and the callout "Sudarshana Chakra"), and the board lands on the engine\'s AFTER when the beat ends, never two atlases live, nothing left decoded (' + matrix.filter((x) => x.ok).length + ' of ' + matrix.length + ' runs). A late decode draws from the moment it is ready; the chain\'s invocation, arriving after its segment is over, is CLOSED on arrival (' + lateChain.map((x) => x.late + ' discarded').join(', ') + '). And a DRAW error drops the decoration only: the beats run on to AFTER (' + drawErr.map((x) => x.ok).join(', ') + ')',
     matrix.every((x) => x.ok) && drawErr.every((x) => x.ok) && lateChain.every((x) => x.late === 1),
     J({ failed: matrix.filter((x) => !x.ok), drawErr, lateChain }));
  // LAB-20b · E15b: THE LOST FIRST CELL — a late strike decode shortens the flight, never jumps it
  { const lr = [0, 1].map((seat) => driveFail(SU.FX[seat], SU.spec, (m, mk, pending) => { if (m.role !== 'strike') return mk(m); const d = { at: 908 + 70, then(ok2) { d.ok = ok2; } }; d.fire = () => d.ok(mk(m)); pending.push(d); return d; }));
    const lateRuns = [0, 1].map((seat) => driveFail(SU.FX[seat], SU.spec, L['every decode arrives 1.2 s late']()));
    const departs = (r) => { const tv = r.run.log.travelPlan, e = r.run.log.travel; return !!tv && e.length > 0 && Math.hypot(e[0].x - tv.from.x, e[0].y - tv.from.y) <= 0.5 && e[0].t === tv.firstDrawAt && tv.firstDrawAt > tv.plannedStart && e.some((x) => x.t >= tv.arriveAt && Math.hypot(x.x - tv.to.x, x.y - tv.to.y) <= 0.5); };
    const jumped = lr.map((r) => travelOk(jumpLog(r.run.log), SU.spec));
    ok('E15b · LAB-20b · A LATE STRIKE DECODE SHORTENS THE FLIGHT, NEVER JUMPS IT (E12 extended), both seats: with the strike ready 70 ms after its planned start (its first cell lost) the layer\'s first drawn cell is still ON THE ANCHOR (first drawn at ' + lr.map((r) => Math.round(r.run.log.travelPlan.firstDrawAt) + ' ms against a planned ' + Math.round(r.run.log.travelPlan.plannedStart)).join(', ') + ') and still arrives at the target by f046 (' + lr.map((r) => Math.round(r.run.log.travelPlan.arriveAt)).join(', ') + ' ms); the same holds under E12\'s 1.2 s-late decode (' + lateRuns.map((r) => (departs(r) ? 'departs from the anchor' : 'DOES NOT')).join(', ') + '). Falsifiable: the same run with its flight clock started at the PLANNED start instead of the first draw — the lost-f034 jump — is ' + (jumped.every((x) => x === false) ? 'caught' : 'NOT caught') + ' (the disc would first appear ' + lr.map((r) => { const j = jumpLog(r.run.log), tv = j.travelPlan, e0 = j.travel[0]; return Math.round(Math.hypot(e0.x - tv.from.x, e0.y - tv.from.y)) + ' px'; }).join(', ') + ' along the path)',
       lr.every((r) => departs(r) && travelOk(r.run.log, SU.spec)) && lateRuns.every(departs) && jumped.every((x) => x === false),
       J({ lr: lr.map((r) => ({ plan: r.run.log.travelPlan, first: r.run.log.travel[0] })), jumped })); }
  // THE NEGATIVE: the LAB-20 player (f95e701), under the same failing decode, is a total no-show — the owner's reported defect, reproduced
  const vm = require('vm'), oldSrc = cp.execFileSync('git', ['show', 'f95e701:lab/vfx-manifestation/lib/effectclip.js'], { cwd: GAME, encoding: 'utf8' });
  const oldBox = { module: { exports: {} } }; oldBox.window = undefined; vm.runInNewContext(oldSrc, Object.assign(oldBox, { exports: oldBox.module.exports }));
  const OLD = oldBox.module.exports;
  const oldRuns = [['Vajra', VJ.FX[0], VJ.M], ['Sudarshana', SU.FX[0], SU.spec]].map(([name, f, spec]) => { let threw = null, r = null;
    try { r = driveFail(f, spec, L['the decode never settles'](), { lib: OLD }); } catch (e) { threw = String(e); }
    const rr = (() => { try { return driveFail(f, spec, L['the loader throws'](), { lib: OLD }); } catch (e) { return { threw: String(e) }; } })();
    return { name, hangSounds: r ? r.sounds.length : null, hangAfter: r ? J(r.rendered[r.rendered.length - 1]) === J(f.after) : null, hangCaught: !(r && r.run && r.run.plan && beatsOk(r, f, spec)), throwThrew: !!rr.threw, throwCaught: !!rr.threw || !beatsOk(rr, f, spec) }; });
  ok('E13 · LAB-20a · THE NEGATIVE — the check can fail, and the defect is reproduced: the LAB-20 player (git f95e701), driven through the SAME harness, is a total no-show under a decode that never settles (' + oldRuns.map((x) => x.name + ': ' + x.hangSounds + ' sounds, AFTER ' + x.hangAfter).join(' · ') + ') and throws out of play() when the loader throws (' + oldRuns.map((x) => x.name + ' ' + (x.throwThrew ? 'threw' : 'did not throw')).join(' · ') + '). E12\'s predicate rejects both; the fail-open player passes it',
     oldRuns.every((x) => x.hangCaught && x.throwCaught && x.hangSounds === 0 && x.hangAfter === false), J(oldRuns));
  // THE PAGE: errors seen on a phone, the breadcrumb, the loader fallback, the prefetch, and no await on the decode before the cue
  const LJ = fs.readFileSync(path.join(LAB, 'lab.js'), 'utf8'), PG = fs.readFileSync(path.join(LAB, 'index.html'), 'utf8');
  const pins = { consoleError: /try \{ console\.error\('\[lab\]', e\); \} catch \(x\) \{\}/.test(LJ), banner: /const b = document\.getElementById\('errbanner'\);\s*\n\s*if \(b\) \{ b\.textContent = 'Error: '/.test(LJ) && /<div id="errbanner" role="alert"><\/div>/.test(PG) && /#errbanner\.on\{ opacity:1; \}/.test(PG),
    diag: /const DIAG = new URLSearchParams\(location\.search\)\.get\('diag'\) === '1'/.test(LJ) && /<pre id="diag" hidden/.test(PG) && /diag: diagLog,/.test(LJ),
    imageFallback: /if \(window\.createImageBitmap\) \{ try \{ src = await createImageBitmap\(blob\); \} catch \(e\) \{/.test(LJ) && /const u = URL\.createObjectURL\(blob\), im = new Image\(\);/.test(LJ),
    noContextNamed: /if \(!g\) throw new Error\('no 2D context for the '/.test(LJ),
    prefetchHand: /else if \(REG\[c\.id\] && REG\[c\.id\]\.effect\) prefetchEffect\(c\.id\)\.catch\(report\);/.test(LJ), manifestsAtBoot: /filter\(\(id\) => REG\[id\]\.effect\)\.forEach\(\(id\) => effectManifestFor\(id\)\.catch\(report\)\)/.test(LJ),
    playNotAwaited: /const run = effect\.play\(F, spec,/.test(LJ) && !/await effect\.play\(/.test(LJ), noManifestLandsAfter: /render\(F\.after, \[\]\); return; \}   \/\/ LAB-20a: never a no-show/.test(LJ),
    failedFetchNotCached: /\.catch\(\(e\) => \{ delete effectBlobs\[u\]; throw e; \}\)/.test(LJ),
    // the boot chain still reaches the tick: the statement that loads the registry must schedule it, with no line comment cutting it short
    bootSchedulesTick: (() => { const b0 = LJ.indexOf("fetch(V('../data/factionfx.json'))"), stmt = LJ.slice(b0, LJ.indexOf('\n  // is this page the served one?', b0)); const code = stmt.split('\n').map((ln) => ln.replace(/\s\/\/ .*$/, '')).join('\n'); return /window\.requestAnimationFrame\(tick\)/.test(code) && /\}\)\.catch\(report\);\s*$/.test(code.trim() + '\n'); })() };
  ok('E14 · LAB-20a · THE PAGE FAILS OPEN AND SPEAKS UP: ' + Object.keys(pins).map((x) => x + ' ' + pins[x]).join(', ') + ' — report() logs to the console AND shows a short banner on the board; ?diag=1 prints every effect step with timings on screen (tap, manifest, atlas bytes, decode and via which API, bake, load-ready or load-failed, handoff, first draw, cues, finish); the loader falls back to an Image element when createImageBitmap is missing or fails and names a missing 2D context; effect manifests are fetched at boot and atlas bytes when the card enters the hand; the play is never awaited on a decode, and a missing manifest still lands the board on AFTER',
     Object.values(pins).every(Boolean), J(pins));
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
  const must = ['lab/vfx-manifestation/sources/kling_20260913_VIDEO_Create_a_p_5011_0.mp4', 'lab/vfx-manifestation/sources/meghnad-isolated-kling-source-v1.png', 'lab/vfx-manifestation/frames/meghnad/f072.png', 'lab/vfx-manifestation/frames/meghnad_contact_sheet.jpg', 'lab/vfx-manifestation/tools/.venv/u2net/isnet-general-use.onnx', 'lab/vfx-manifestation/sources/kling_20260914_VIDEO_Preserve_I_5205_0.mp4', 'lab/vfx-manifestation/sources/indra-isolated-kling-source-v1.png', 'lab/vfx-manifestation/frames/indra/f055.png', 'lab/vfx-manifestation/frames/indra_contact_sheet.jpg', 'lab/vfx-manifestation/sources/kling_20260914_VIDEO_Preserve_B_5645_0.mp4', 'lab/vfx-manifestation/sources/bali-isolated-kling-source-v1.png', 'lab/vfx-manifestation/frames/bali/f064.png', 'lab/vfx-manifestation/frames/bali_contact_sheet.jpg', 'lab/vfx-manifestation/frames/bali_tail_contact_sheet.jpg', 'lab/vfx-manifestation/sources/varuna/varuna_green.mp4', 'lab/vfx-manifestation/sources/varuna/varuna-isolated-kling-source-v1.png', 'lab/vfx-manifestation/frames/varuna/f086.png', 'lab/vfx-manifestation/frames/varuna_contact_sheet.jpg', 'lab/vfx-manifestation/sources/agni/agni_green.mp4', 'lab/vfx-manifestation/sources/mahabali/mahabali_green.mp4', 'lab/vfx-manifestation/sources/shukracharya/shukracharya_green.mp4', 'lab/vfx-manifestation/sources/mahishi/mahishi_green.mp4', 'lab/vfx-manifestation/sources/vritra/vritra_green.mp4', 'lab/vfx-manifestation/sources/garuda/garuda_green.mp4', 'lab/vfx-manifestation/sources/kartikeya/kartikeya_magenta.mp4', 'lab/vfx-manifestation/sources/vasuki/vasuki_magenta.mp4', 'lab/vfx-manifestation/sources/takshaka/takshaka_magenta.mp4', 'lab/vfx-manifestation/sources/shesha/shesha_magenta.mp4', 'lab/vfx-manifestation/sources/padmavati/padmavati_magenta.mp4', 'lab/vfx-manifestation/sources/kulika/kulika_magenta.mp4', 'lab/vfx-manifestation/sources/sugriva/sugriva_magenta.mp4', 'lab/vfx-manifestation/sources/angad/angad_magenta.mp4', 'lab/vfx-manifestation/sources/anjana/anjana_magenta.mp4', 'lab/vfx-manifestation/sources/makardhwaja/makardhwaja_magenta.mp4', 'lab/vfx-manifestation/sources/rahu/rahu_green.mp4', 'lab/vfx-manifestation/sources/vajra/vajra_black.mp4', 'lab/vfx-manifestation/sources/sudarshana/sudarshana_invoke_black.mp4', 'lab/vfx-manifestation/sources/sudarshana/sudarshana_strike_black.mp4', 'lab/vfx-manifestation/frames/sudarshana_strike_effect_sheet.jpg', 'lab/vfx-manifestation/frames/vajra_effect_sheet.jpg', 'lab/vfx-manifestation/sources/rahu/rahu-isolated-kling-source-v1.png', 'lab/vfx-manifestation/frames/rahu/f044.png', 'lab/vfx-manifestation/frames/rahu_contact_sheet.jpg'].concat(fs.readdirSync(path.join(LAB, 'sources')).filter((n) => fs.existsSync(path.join(LAB, 'sources', n, n + '-isolated-kling-source-v1.png'))).map((n) => 'lab/vfx-manifestation/sources/' + n + '/' + n + '-isolated-kling-source-v1.png'));   // every identity master staged in sources/
  const present = must.filter((p) => fs.existsSync(path.join(GAME, p)));
  const strayDir = path.join(GAME, 'assets', 'vfx', 'experimental'), stray = [];
  (function walk(d) { if (!fs.existsSync(d)) return; fs.readdirSync(d).forEach((n) => { const q = path.join(d, n); if (fs.statSync(q).isDirectory()) walk(q); else if (/\.(png|jpe?g|webp|mp4|mov)$/i.test(n)) stray.push(rel(q)); }); })(strayDir);
  ok('K3 · sources/ (the Kling clips and stills — Meghnad\'s and, LAB-6 to LAB-8, Indra\'s, Bali\'s and Varuna\'s clips and identity masters, and every identity master staged there for later characters), frames/ (the matted frames and the contact sheets) and the rembg model inside tools/.venv are all git-ignored' + (present.length ? ' — ' + present.length + ' of them present on this machine' : '') + '; and no Kling source is left lying under assets/vfx/experimental/ (' + stray.length + ')',
     must.every(ignored) && stray.length === 0, J({ notIgnored: must.filter((p) => !ignored(p)), stray }));
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
  ok('S2 · ANCHORING, both seats: the feet at the played card\'s base (where the board has room — see S3b for when placement gives way); the reach toward the enemy half (up from the bottom, down from the top); the actor taller than its card; and at ANY point of its reach it never touches the enemy cards (A1 — nothing depicted on the target)',
     [0, 1].every((s) => { const g = geo(s), p = place(s);
       return Math.abs(p.anchor.x - (g.card.x + g.card.w / 2)) < 0.01 && Math.abs(p.anchor.y - (g.card.y + g.card.h * 0.94)) < 0.01 && (s === 0 ? p.travel.y < 0 && p.dirY === -1 : p.travel.y > 0 && p.dirY === 1) &&
              p.height > g.card.h && !SM.touchesBand(p, g.band) && p.scale > 0; }));
  ok('S3 · FACING: a manifest drawn facing left is mirrored when the charge leans right (a card left of or at centre) and not when it leans left, on both seats',
     [0, 1].every((s) => place(s, 60).dirX === 1 && place(s, 60).flipX === true && place(s, 300).dirX === -1 && place(s, 300).flipX === false && place(s, 60).travel.x > 0 && place(s, 300).travel.x < 0));
  const placeI = (seat, cardX, aim, over) => { const g = geo(seat); if (cardX != null) g.card.x = cardX; Object.assign(g, over || {}); return SM.place({ card: g.card, side: g.side, fieldW: FIELD.w, fieldH: FIELD.h, band: g.band, refHeight: IMAN.refHeight, facing: IMAN.facing, aim: aim === undefined ? IMAN.aim : aim }); };
  const STAGE_SRC = ['stagemath', 'actorstage', 'playback'].map((n) => fs.readFileSync(path.join(LAB, 'lib', n + '.js'), 'utf8')).join('\n');
  const H_FIXED = 90 * 2.1, base = (card) => card.y + card.h * 0.94;
  // the page's real cases and three crowded ones: a top-row card at the board's top edge, a top-row card with the enemy band close, the player's seat with the enemy band low
  const topEdge = placeI(1, null, undefined, { card: { x: 163, y: 10, w: 64, h: 90 }, band: { x: 163, y: 320, w: 64, h: 90 } });
  const tight = placeI(1, null, undefined, { card: { x: 163, y: 10, w: 64, h: 90 }, band: { x: 163, y: 170, w: 64, h: 90 } });
  const lowBand = placeI(0, null, undefined, { card: { x: 163, y: 222, w: 64, h: 90 }, band: { x: 163, y: 10, w: 64, h: 150 } });
  ok('S3b · LAB-6 · UPRIGHT, THE SAME SIZE ON BOTH SEATS (owner rulings 2026-09-14), Indra (aim up): on both seats the actor stands upright at the card\'s full fixed height (' + H_FIXED + ' px for a 90 px card, scale ' + placeI(0).scale.toFixed(4) + ' on both seats) — the "room" shrink is gone; PLACEMENT GIVES WAY: a top-row card at the board\'s top edge moves the feet down by exactly the overflow (' + topEdge.shift.toFixed(1) + ' px, top at the edge), a crowded top seat clamps the feet short of the enemy band (A1 wins over the board edge), a crowded player\'s seat moves the feet down instead of shrinking; never touching the enemy cards; a seat swap mirrors horizontally only; the placement is the same with or without aim; the contact flash and the camera impulse point at the true target (dirY); no vertical mirror and no shrink rule remain in the stage',
     [0, 1].every((s) => { const g = geo(s), p = placeI(s), ex = SM.extentAt(p, 1);
       return !('flipY' in p) && p.height === H_FIXED && p.scale === H_FIXED / IMAN.refHeight && p.shift === 0 && Math.abs(p.anchor.y - base(g.card)) < 0.01 && ex.bottom === ex.feet && !SM.touchesBand(p, g.band) &&
              p.dirY === (s === 0 ? -1 : 1) && (s === 0 ? p.travel.y < 0 : p.travel.y > 0) && placeI(s, 60).flipX === false && placeI(s, 300).flipX === true && J(placeI(s, null, null)) === J(p); }) &&
     topEdge.height === H_FIXED && Math.abs(topEdge.shift - (H_FIXED - base({ y: 10, h: 90 }))) < 1e-9 && Math.abs(SM.extentAt(topEdge, 0).top) < 1e-9 && topEdge.travel.y > 0 && !SM.touchesBand(topEdge, { x: 163, y: 320, w: 64, h: 90 }) &&
     tight.height === H_FIXED && tight.anchor.y === 170 - SM.GAP && tight.travel.y === 0 && !SM.touchesBand(tight, { x: 163, y: 170, w: 64, h: 90 }) &&
     lowBand.height === H_FIXED && Math.abs(SM.extentAt(lowBand, 0).top - (10 + 150 + SM.GAP)) < 1e-9 && lowBand.shift > 0 && lowBand.travel.y === 0 && !SM.touchesBand(lowBand, { x: 163, y: 10, w: 64, h: 150 }) &&
     !/flipY/.test(STAGE_SRC) && !/Math\.min\(want|room \* 0\.84|\* 0\.95\)/.test(STAGE_SRC) && /env\.stage\.flash\(q\.x, q\.feetY - h \* 0\.55, h \* 0\.9 \* st\.flash, who\.pl\.dirY, flashMs\)/.test(STAGE_SRC) && /env\.stage\.impulse\(who\.pl\.dirY, px, c\.impulseMs\)/.test(STAGE_SRC),
     J({ seats: [0, 1].map((s) => placeI(s)), topEdge, tight, lowBand }));
  const src = fs.readFileSync(path.join(LAB, 'lib', 'actorstage.js'), 'utf8');
  ok('S4 · NORMAL BLENDING (A4): the actor is drawn source-over from its atlas cells (Canvas 2D) or as a blendMode "normal" sprite (Pixi); no additive, screen or brightness-to-alpha anywhere in the stage',
     /globalCompositeOperation = 'source-over'/.test(src) && /blendMode = 'normal'/.test(src) && /drawImage\(a\.art\.image, c\.x, c\.y, c\.w, c\.h/.test(src) && !/lighter|'add'|'screen'|getImageData/.test(src));

  if (!JSDOM) { fail += 3; console.log('  ✖ S5–S7 SKIPPED LOUDLY — jsdom not found under ' + path.join(WEB, 'tests') + ' (set DY_WEB). The stage runs did NOT happen.'); }
  else {
    // LAB-6: every stage check and the gate run for EACH card the template produced
    // LAB-7: the cards come from the registry — every entry with an actor — so a new character needs no edit here (it was a hand list)
    const FFX0 = JSON.parse(fs.readFileSync(path.join(LAB, 'data', 'factionfx.json'), 'utf8'));
    const CARDS = Object.keys(REG).filter((id) => REG[id].manifest).map((id) => {
      const e = REG[id], FXc = [0, 1].map((s) => JSON.parse(fs.readFileSync(path.join(LAB, 'fixtures', (e.fixture || id) + '_seat' + s + '.json'), 'utf8')));
      const M = JSON.parse(fs.readFileSync(path.join(LAB, 'runtime', e.manifest), 'utf8')), faction = FXc[0].before.seats[FXc[0].attackerSeat].faction, name = e.name || id;
      const settles = (seat) => CC.fromBatch(FXc[seat]).boardDiff.filter((d) => d.kind === 'power' && d.settleDelta);
      return { id, name, tag: '[' + name + '] ', M, FX: FXc, exempt: !!e.ladderExempt, faction, presetName: FFX0[faction].name, exit: MAN.exitMode({ entry: e, manifest: M }).exit,
        expectFloats: (seat) => settles(seat).map((d) => ({ uid: d.uid, delta: d.settleDelta })),
        numbersText: settles(0).length ? 'exactly ' + settles(0).map((d) => d.n + ' ' + (d.settleDelta < 0 ? '−' : '+') + Math.abs(d.settleDelta)).join(', ') + ' from the board difference'
                                       : 'no number at all — ' + name + ' only enters, so SETTLE lands the board with him on it and nothing floats' };
    });
    ok('S4b · LAB-7 · the stage suite and its gate run for EVERY registry card with an actor, built from data/manifestations.json: ' + CARDS.map((c) => c.name + ' (' + c.id + ', ' + c.faction + ', ' + (c.exit === 'native' ? 'the native exit' : 'the ' + c.presetName + ' exit') + (c.exempt ? ', ladder-exempt' : '') + ')').join(' · '),
       J(CARDS.map((c) => c.id)) === J(['meghnad', 'indra', 'hanuman', 'varuna', 'agni', 'mahabali', 'shukra', 'mahishi', 'vritra', 'garuda', 'kartikeya', 'vasuki', 'takshaka', 'shesha', 'padmavati', 'kulika', 'sugriva', 'angad', 'anjana', 'makardhwaja', 'rahu']) && J(CARDS.map((c) => c.exit)) === J(['procedural', 'native', 'native', 'native', 'native', 'native', 'native', 'native', 'native', 'native', 'native', 'native', 'native', 'native', 'native', 'native', 'native', 'native', 'native', 'native', 'native']) && CARDS.every((c) => c.M.cardId === c.id && c.FX.every((f) => f.diff.entered.some((x) => x.id === c.id))) && J(CARDS[0].expectFloats(0)) === J([{ uid: FX[0].before.seats[FX[0].defenderSeat].heroes[0].uid, delta: -2 }]), J(CARDS.map((c) => [c.id, c.faction, c.expectFloats(0)])));
    const ALLGATES = [];
    const stageSuite = (CARD) => {
      const CARD_ST = MAN.contactStrength(CARD.M);   // LAB-9: a self-cast softens its flash and may forbid the camera impulse entirely
      function world(seat, backend, fxFn, wopts) {
        const dom = new JSDOM('<!doctype html><body><div id="field"><canvas id="actorunder"></canvas><canvas id="actorcanvas"></canvas><canvas id="actorgpu"></canvas><canvas id="actorover"></canvas></div></body>', { url: 'https://lab.test/', pretendToBeVisual: true, runScripts: 'outside-only' });
        const w = dom.window, calls = { draw: 0, clear: 0, ops: new Set(), cells: [], masks: [], uniformT: [], glowDraws: [], sounds: [], pulses: [], texDestroyed: 0, bitmapClosed: 0 };
        const ctx = new Proxy({}, { get: (t, k) => k === 'createRadialGradient' ? () => ({ addColorStop() {} }) : k === 'drawImage' ? (img, sx, sy, sw, sh, dx, dy, dw, dh) => { calls.draw++; if (img && img.__atlas && sw > 1 && dw === sw && dh === sh) calls.cells.push(sx + ',' + sy); if (img && (img.__labGlow || img.__labPuff) && dx === undefined) calls.glowDraws.push({ kind: img.__labGlow ? 'glow' : 'puff', size: img.__labGlow || img.__labPuff, dw: sw, dh: sh }); } : k === 'putImageData' ? (img) => { if (img && img.__role === 'mask') { const a = new Uint8Array(img.data.length / 4); for (let i = 0; i < a.length; i++) a[i] = img.data[i * 4 + 3]; calls.masks.push({ cell: img.__cell, a }); } } : k === 'clearRect' ? () => { calls.clear++; } : () => undefined,
                                    set: (t, k, v) => { if (k === 'globalCompositeOperation') calls.ops.add(v); return true; } });
        w.HTMLCanvasElement.prototype.getContext = () => ctx;
        ['boarddiff', 'clashcontext', 'director', 'runner', 'manifest', 'stagemath', 'dissolve', 'actorstage', 'playback'].forEach((n) => w.eval((wopts && wopts.libs && wopts.libs[n]) || fs.readFileSync(path.join(LAB, 'lib', n + '.js'), 'utf8')));
        const planRaw = w.Director.plan; w.Director.plan = (c, o) => planRaw(c, Object.assign({ exit: CARD.exit }, o));   // LAB-8: every plan this world makes carries the card's exit
        let t = 0;
        const stage = new w.ActorStage({ field: w.document.getElementById('field'), under: w.document.getElementById('actorunder'), actorCanvas: w.document.getElementById('actorcanvas'), gpuCanvas: w.document.getElementById('actorgpu'), over: w.document.getElementById('actorover'), now: () => t });
        const installPixi = (backend) => {
          // the stage's Pixi draw path against a recording Pixi: a cell counts as drawn when the renderer renders a sprite showing it
          const children = [], PIXI = {
            Texture: function (o) { this.source = o && o.source; this.frame = o && o.frame; },
            Rectangle: function (x, y) { this.x = x; this.y = y; },
            Sprite: function (tex) { this.texture = tex; this.parent = null; this.anchor = { set() {} }; this.position = { set() {} }; this.scale = { set: (x) => { this.sx = x; } }; this.destroy = () => {}; },
            Filter: function (o) { this.options = o; },
            GlProgram: { from: (o) => ({ gl: o }) }, GpuProgram: { from: (o) => ({ gpu: o }) },
            UniformGroup: function (u) { this.uniforms = {}; for (const k in u) this.uniforms[k] = u[k].value; this.update = () => { calls.uniformT.push(this.uniforms.uParams[0]); }; },
          };
          PIXI.Texture.from = (img) => ({ source: img, destroy: () => { calls.texDestroyed++; } });
          const app = { stage: { children, addChild: (sp) => { sp.parent = app.stage; children.push(sp); }, removeChild: (sp) => { children.splice(children.indexOf(sp), 1); sp.parent = null; }, removeChildren: () => { children.splice(0).forEach((sp) => { sp.parent = null; }); } },
            renderer: { name: backend, resize() {}, render: () => children.forEach((sp) => { const f = sp.texture && sp.texture.frame; if (f && sp.alpha > 0.01) calls.cells.push(f.x + ',' + f.y); else if (!f && sp.sx != null) calls.glowDraws.push({ kind: 'gpu-ember', size: 64, dw: 64 * Math.abs(sp.sx), dh: 64 * Math.abs(sp.sx) }); }) }, destroy() {} };
          stage.pixi = PIXI; stage.app = app; stage.backend = 'pixi'; stage.renderer = backend; stage.base = {};
        };
        if (backend === 'webgl' || backend === 'webgpu') installPixi(backend);
        const MW = (wopts && wopts.manifest) || CARD.M;   // LAB-9a: a world may be driven at either rung
        if (!(wopts && wopts.noLoad)) stage.loadActor(CARD.id, { manifest: MW, image: { __atlas: true, width: MW.atlasSize.w, height: MW.atlasSize.h, close: () => { calls.bitmapClosed++; } } });
        const f = CARD.FX[seat], ctxw = w.ClashContext.fromBatch(f), boards = w.ClashContext.boards(ctxw, f.before, f.after), g = geo(seat);
        const rects = {}, tgt = f.before.seats[f.defenderSeat].heroes[0]; rects[f.events[0].sourceUid] = g.card; if (tgt) rects[tgt.uid] = g.band;
        const renders = [], ember = [], done = [];
        const pb = w.Playback.create({ stage, ctx: ctxw, boards, viewer: 0, field: FIELD, rectOf: (u) => rects[u] || null, clientOf: (u) => rects[u] ? { cx: rects[u].x + 32, cy: rects[u].y + 45, w: 64 } : null,
          bandOf: (s) => s === f.defenderSeat ? g.band : g.card, render: (b, fl) => renders.push({ t, board: JSON.parse(J(b)), floats: fl }), pulse: (u, ms) => calls.pulses.push([u, ms, t]), sound: (n) => calls.sounds.push({ n, t, cell: stage.actors[0] && stage.actors[0].pose ? stage.actors[0].pose.cellIndex : null, phase: stage.actors[0] ? stage.actors[0].phase : null }), actorFor: (id) => id === CARD.id ? { manifest: MW } : null,
          factionFx: fxFn || (() => ({ portal: 'rgba(255,96,48,0.85)', exit: 'embers' })), embers: (x, y) => ember.push([x, y, t]), queueFx: () => {}, onDone: (r) => done.push(r) });
        return { w, stage, calls, pb, ctx: ctxw, boards, renders, ember, done, f, installPixi, clock: { get t() { return t; }, set t(v) { t = v; } } };
      }
      const runWorld = (W, planOpts, stopAt, runOpts) => {
        const plan = W.w.Director.plan(W.ctx, Object.assign({ ladderExempt: CARD.exempt }, planOpts));
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
      const clean = (W) => W.stage.liveActors() === 0 && W.stage.liveSprites() === 0 && W.stage.actors.length === 0 && W.stage.fx.length === 0 && !W.stage.impulseFx && W.stage.liveParticles() === 0 && W.stage.decodedBytes() === 0 && W.w.document.getElementById('field').style.transform === '';
      const results = [0, 1].map((seat) => {
        const A = world(seat), a = runWorld(A, { mode: 'full' });                  // the whole manifestation
        const S = a.plan.phases.find((p) => p.name === 'SETTLE');
        const firstFloat = A.renders.find((x) => x.floats && x.floats.length);
        const B = world(seat), b = runWorld(B, { mode: 'full' }, 1300);           // skipped mid-ACT
        const C = world(seat), cp2 = runWorld(C, { mode: 'full' }, null, (() => { const pl = C.w.Director.plan(C.ctx, { mode: 'full', ladderExempt: CARD.exempt }); const ph = pl.phases.find((p) => p.name === 'ACT'); return { from: ph.t0, to: ph.t1 }; })());
        return {
          seat, full: { settleRender: A.renders.find((x) => x.t >= S.t0), peak: a.peak, clean: clean(A), done: A.done[0], firstFloatT: firstFloat ? firstFloat.t : null, settleT0: S.t0, floats: firstFloat ? firstFloat.floats : null, embers: A.ember.length, draws: A.calls.draw, ops: [...A.calls.ops], stats: A.stage.stats() },
          skip: { peak: b.peak, clean: clean(B), done: B.done[0], lastBoard: B.renders[B.renders.length - 1] },
          phase: { peak: cp2.peak, clean: clean(C), renders: C.renders.length },
        };
      });
      ok(CARD.tag + 'S5 · A FULL MANIFESTATION on the stage, both seats: one live actor (never two; liveActors counts actors, liveSprites counts GPU sprites), the ACT\'s hit-stop and flash fire' + (CARD_ST.impulse > 0 ? ' and so does the camera impulse' : ' and the camera NEVER moves (contactStrength impulse 0 — a self-cast)') + ', the Asura exit throws embers, the actor is drawn from its cells; afterwards nothing survives (no actor, effect or camera offset) and the final board equals the engine\'s AFTER',
         results.every((x) => x.full.peak.actors === 1 && x.full.peak.frozen && x.full.peak.flash && x.full.peak.transform === (CARD_ST.impulse > 0) && x.full.embers >= 3 && x.full.draws > 50 && x.full.clean && x.full.done && x.full.done.equalsFinal && x.full.ops.every((o) => o === 'source-over')), J(results.map((x) => x.full)));
      ok(CARD.tag + 'S6 · NUMBERS ONLY AT SETTLE, both seats: ' + CARD.numbersText,
         results.every((x) => { const e = CARD.expectFloats(x.seat), sr = x.full.settleRender;
           return e.length ? x.full.firstFloatT != null && x.full.firstFloatT >= x.full.settleT0 && J(x.full.floats) === J(e)
                           : x.full.firstFloatT == null && !!sr && sr.t >= x.full.settleT0 && sr.floats.length === 0 && [0, 1].some((s2) => sr.board.seats[s2].heroes.concat(sr.board.seats[s2].units).some((c) => c && c.uid === CARD.FX[x.seat].events[0].sourceUid)); }),
         J(results.map((x) => [x.full.firstFloatT, x.full.settleT0, x.full.floats])));
      ok(CARD.tag + 'S7 · CLEANUP GUARANTEE, both seats: skipped mid-ACT (an actor was live) → no actor, no GPU sprite, no effect, no camera offset, and the board jumps straight to the engine\'s AFTER with no numbers; a single-phase (ACT) replay also ends clean',
         results.every((x) => x.skip.peak.actors === 1 && x.skip.clean && x.skip.done && x.skip.done.equalsFinal && x.skip.lastBoard.floats.length === 0 && x.phase.peak.actors === 1 && x.phase.clean), J(results.map((x) => [x.skip, x.phase])));
      const st = results[0].full.stats;
      ok(CARD.tag + 'S8 · THE PERFORMANCE READOUT: the stage reports its backend, frames, draw ms per frame, fps over the manifestation and the cell size (' + J(st) + '); the page shows it (#ro-actor)',
         st.backend === 'canvas2d' && st.frames > 0 && typeof st.drawMsAvg === 'number' && st.drawMsAvg >= 0 && typeof st.fps === 'number' && st.cellPx === (CARD.M.cellPx || CARD.M.cellMax) && st.drawnPx > 0 &&
         PAGE.indexOf('<dd id="ro-actor">') >= 0 && /stage\.stats\(\)/.test(fs.readFileSync(path.join(LAB, 'lab.js'), 'utf8')));

      // ── LAB-4a · THE CELLS ARE THE CLOCK: what each backend's draw path really draws, per play ──
      const NT = { fps: CARD.M.fps, emerge: CARD.M.phases.emerge.length, act: CARD.M.phases.act.length, contact: CARD.M.contact, emergeMs: CARD.M.phaseMs.emerge, actMs: CARD.M.phaseMs.act };
      const key = CARD.M.cells.map((c) => c.x + ',' + c.y), nameOf = (i) => (CARD.M.cells[i] || {}).name, NCELL = CARD.M.cells.length, RATE_E = NT.emerge * 1000 / NT.emergeMs, RATE_A = NT.act * 1000 / NT.actMs;
      const CONTACT_CELL = nameOf(CARD.M.phases.act[CARD.M.contact]), LAST_ACT = CARD.M.phases.act[CARD.M.phases.act.length - 1];
      const BACKENDS = ['canvas2d', 'webgl', 'webgpu'];
      const playCells = (backend, mode, hz, hitchMs, extra) => {
        const W = world(0, backend);
        let at = -1; const hs = W.stage.hitstop.bind(W.stage); W.stage.hitstop = (ms) => { at = W.calls.cells.length; return hs(ms); };
        const plan = W.w.Director.plan(W.ctx, Object.assign({ mode, ladderExempt: CARD.exempt, timing: NT }, extra)), r = W.w.Runner.create(plan, W.pb.handlers, () => W.clock.t);
        const E = plan.phases.find((p) => p.name === 'EMERGE'), A = plan.phases.find((p) => p.name === 'ACT');
        let hitched = false; r.start({});
        while (!r.done && W.clock.t < 20000) {
          const late = hitchMs && !hitched && W.clock.t >= E.t0 + 120; if (late) hitched = true;
          W.clock.t += late ? hitchMs : 1000 / hz; r.tick(); W.stage.frame(W.clock.t, W.clock.t);
        }
        const ix = W.calls.cells.map((k) => key.indexOf(k)), runs = [];
        ix.forEach((c) => { if (runs.length && runs[runs.length - 1][0] === c) runs[runs.length - 1][1]++; else runs.push([c, 1]); });
        const seen = new Set(); let repeats = 0; runs.forEach(([c]) => { if (seen.has(c)) repeats++; seen.add(c); });
        const inner = runs.filter(([c]) => c !== LAST_ACT).map((x) => x[1]);
        return { backend, mode, hz, drawn: seen.size, total: CARD.M.cells.length, repeats, inOrder: runs.every((x, i) => i === 0 || x[0] > runs[i - 1][0]), longestRun: Math.max(...inner),
                 endsOnLastAct: runs.length > 0 && runs[runs.length - 1][0] === LAST_ACT, unknown: ix.filter((c) => c < 0).length, contact: at >= 0 ? nameOf(ix[at]) : null,
                 readout: W.stage.stats().cellsDrawn, perSecond: seen.size / ((A.t1 - E.t0) / 1000), clean: clean(W) };
      };
      const agrees = (x) => x.readout && x.readout.drawn === x.drawn && x.readout.total === x.total && x.readout.repeats === x.repeats && x.readout.contact === CONTACT_CELL;
      const show = (xs) => xs.map((x) => x.backend + ' ' + x.drawn + '/' + x.total + (x.hitch ? ' (' + x.hitch + ')' : '') + ' · repeats ' + x.repeats + ' · longest hold ' + x.longestRun + ' frames · contact ' + x.contact).join(' | ');
      const full = BACKENDS.map((b) => playCells(b, 'full', 60));
      const t07 = BACKENDS.map((b) => Object.assign(playCells(b, 'full', 60, 0, { tempo: 0.7 }), { hitch: '0.7× tempo' }))
        .concat(BACKENDS.map((b) => Object.assign(playCells(b, 'full', 60, 0, { tempo: 0.6 }), { hitch: '0.6× — the default' })));
      ok(CARD.tag + 'S9 · FULL at 60 Hz, every backend\'s draw path (Canvas 2D drawImage · Pixi WebGL · Pixi WebGPU): all ' + CARD.M.cells.length + ' cells drawn, in clip order, none repeated, none held past its 1/24 s (≤ 3 frames — no hold inside a phase, the hit-stop never freezes the actor), the contact fires on the frame ' + CONTACT_CELL + ' is drawn, FIZZLE holds the last ACT cell, the stage\'s own count (the readout) agrees, and the stage ends clean — ' + show(full) + ' — and at 0.7× and at the default 0.6× tempo (each cell ≤ 5 frames) still every cell, no skip: ' + show(t07),
         full.every((x) => x.drawn === NCELL && x.total === NCELL && x.repeats === 0 && x.inOrder && x.unknown === 0 && x.longestRun <= 3 && x.contact === CONTACT_CELL && x.endsOnLastAct && agrees(x) && x.clean) &&
         t07.every((x) => x.drawn === NCELL && x.repeats === 0 && x.inOrder && x.unknown === 0 && x.longestRun <= 5 && x.contact === CONTACT_CELL && x.endsOnLastAct && agrees(x) && Math.abs(x.readout.cellFps - Math.max(RATE_E, RATE_A) * (x.hitch.indexOf('0.6') === 0 ? 0.6 : 0.7)) < 1e-9 && x.clean), J(full.concat(t07)));
      const fast = BACKENDS.map((b) => playCells(b, 'fast', 60));
      ok(CARD.tag + 'S10 · FAST at 60 Hz (the cells at twice their rate), every backend: at least 22 cells drawn (at least every other cell), in order, none repeated, ≥ 12 cells per second of EMERGE + ACT, contact on ' + CONTACT_CELL + ', the readout agrees — ' + show(fast) + ' · ' + fast.map((x) => x.perSecond.toFixed(1) + '/s').join(', '),
         fast.every((x) => x.drawn >= 22 && x.repeats === 0 && x.inOrder && x.unknown === 0 && x.perSecond >= 12 && x.contact === CONTACT_CELL && x.endsOnLastAct && agrees(x) && x.clean), J(fast));
      const slow = BACKENDS.map((b) => Object.assign(playCells(b, 'full', 30), { hitch: '30 Hz' })).concat(BACKENDS.map((b) => Object.assign(playCells(b, 'full', 60, 250), { hitch: '250 ms stall in EMERGE' })))
        .concat(BACKENDS.map((b) => Object.assign(playCells(b, 'full', 30, 0, { tempo: 0.7 }), { hitch: '0.7× tempo at 30 Hz' })))
        .concat(BACKENDS.map((b) => Object.assign(playCells(b, 'full', 60, 0, { tempo: 1.5 }), { hitch: '1.5× tempo at 60 Hz' })));
      // LAB-8: a native exit has no FIZZLE to absorb a late device's backlog; the actor finishes into SETTLE, but at tempo 1 on a 30 Hz device the
      // play can end before the last fade-tail cells — allowed only for at most 4 cells of the tail at ≤ 34% alpha; at the 0.6× default nothing may be lost
      const FT = (CARD.M.audit && CARD.M.audit.fadeTail) || [], cutTail = (x) => CARD.exit === 'native' && x.hitch === '30 Hz' && x.readout && x.readout.missing.length <= 4 &&
        x.readout.missing.every((nm) => { const e = FT.find((q) => 'f' + String(q[0]).padStart(3, '0') === nm); return !!e && e[1] <= 0.34; });
      if (CARD.exit === 'native') BACKENDS.forEach((b) => slow.push(Object.assign(playCells(b, 'full', 30, 0, { tempo: 0.6 }), { hitch: '0.6× default at 30 Hz' })));
      ok(CARD.tag + 'S11 · A SLOW DEVICE NEVER SKIPS A NATIVE CELL, every backend: Full at 30 Hz, Full at 60 Hz with a 250 ms stall early in EMERGE, and Full at 0.7× tempo (30 Hz) and 1.5× tempo (60 Hz), still draw all ' + CARD.M.cells.length + ' cells in order with none repeated (the stage catches up one cell per frame, and a phase\'s unreached cells play first in the next) — ' + show(slow),
         slow.every((x) => (x.drawn === NCELL || cutTail(x)) && x.repeats === 0 && x.inOrder && x.unknown === 0 && x.contact === CONTACT_CELL && agrees(x) && x.clean) &&
         (CARD.exit !== 'native' || slow.filter((x) => /default at 30 Hz/.test(x.hitch)).every((x) => x.drawn === NCELL && x.endsOnLastAct)), J(slow.map((x) => [x.backend, x.hitch, x.drawn, x.readout && x.readout.missing])));

      // ── LAB-4b · THE DISSOLVE EXIT: the real presets, the real playback, every backend's draw path ──
      const FFXD = JSON.parse(fs.readFileSync(path.join(LAB, 'data', 'factionfx.json'), 'utf8')), DS = lib('dissolve');
      const playExit = (backend, mode, override, extra, libs, table) => {
        const W = world(0, backend, (fac) => DS.pick(table || FFXD, fac, override || ''), libs ? { libs } : undefined);
        const plan = W.w.Director.plan(W.ctx, Object.assign({ mode, ladderExempt: CARD.exempt, timing: NT }, extra)), r = W.w.Runner.create(plan, W.pb.handlers, () => W.clock.t);
        const Z = plan.phases.find((p) => p.name === 'FIZZLE') || (() => { const S0 = plan.phases.find((p) => p.name === 'SETTLE'); return { t0: S0.t0, t1: S0.t0 }; })();   // LAB-8: a native exit has none
        let peakParts = 0, peakSprites = 0, sawFilter = false; r.start({});
        while (!r.done && W.clock.t < 20000) {
          W.clock.t += 1000 / 60; r.tick(); W.stage.frame(W.clock.t, W.clock.t);
          peakParts = Math.max(peakParts, W.stage.liveParticles()); peakSprites = Math.max(peakSprites, W.stage.liveSprites());
          const a = W.stage.actors[0]; if (a && a.sprite && a.sprite.filters && a.sprite.filters.length) sawFilter = true;
        }
        const settle = W.renders.find((x) => x.t >= Z.t1);   // the SETTLE render (with or without a number)
        return { backend, mode, override: override || null, faction: W.ctx.faction, exit: W.stage.stats().exit, fizzleMs: Z.t1 - Z.t0, settleLag: settle ? settle.t - Z.t1 : null,
                 peakParts, peakSprites, sawFilter, masks: W.calls.masks, uniformT: W.calls.uniformT, glowDraws: W.calls.glowDraws, sounds: W.calls.sounds, phases: plan.phases, clean: clean(W), done: W.done[0] };
      };
      const EX = []; BACKENDS.forEach((b) => ['full', 'fast'].forEach((m) => EX.push(playExit(b, m))));
      const exitOk = (x) => !!x.exit && x.exit.name === CARD.presetName && x.exit.key === CARD.faction && x.exit.edge === FFXD[CARD.faction].dissolve.edge && x.exit.path === (x.backend === 'canvas2d' ? 'mask' : 'shader') &&
        x.fizzleMs === (x.mode === 'full' ? 600 : 300) && x.exit.dur === x.fizzleMs && x.exit.embers > 0 && x.exit.monotonic && x.exit.progress >= 0.9 && x.exit.frames >= Math.floor(x.fizzleMs / (1000 / 60)) - 2 &&
        x.peakParts > 0 && x.settleLag != null && x.settleLag >= 0 && x.settleLag < 17 && x.clean && !!x.done && x.done.equalsFinal &&
        (x.backend === 'canvas2d' ? x.masks.length > 0 : x.sawFilter && x.uniformT.length > 0 && x.peakSprites > 2);
      const showX = (xs) => xs.map((x) => x.backend + ' ' + x.mode + ': ' + (x.exit ? x.exit.name + ' · ' + x.exit.path + ' · ' + x.fizzleMs + ' ms · ' + x.exit.frames + ' frames · embers ' + x.exit.embers + ' (peak ' + x.exit.peak + ') · smoke ' + x.exit.smoke + ' · settle +' + (x.settleLag == null ? '?' : Math.round(x.settleLag)) + ' ms' : 'no exit')).join(' | ');
      const cvFull = EX.find((x) => x.backend === 'canvas2d' && x.mode === 'full'), glFull = EX.find((x) => x.backend === 'webgl' && x.mode === 'full');
      const nativeOk = (x) => !x.exit && x.fizzleMs === 0 && !x.phases.some((p) => p.name === 'FIZZLE') && x.peakParts === 0 && !x.sawFilter && x.masks.length === 0 && x.uniformT.length === 0 &&
        x.settleLag != null && x.settleLag >= 0 && x.settleLag < 17 && x.clean && !!x.done && x.done.equalsFinal && x.sounds.every((q) => q.n !== 'exit');
      if (CARD.exit === 'native') ok(CARD.tag + 'S12 · LAB-8 · THE NATIVE EXIT on every backend, Full and Fast: no FIZZLE phase and no procedural dissolve — no mask, no filter, no threshold, no ember, no smoke, no exit sound; the clip\'s own exit (its fade tail) plays out in ACT and the board settles within a frame of ACT\'s end, equal to the engine\'s AFTER; afterwards 0 actors, sprites and particles; and a play starts with no exit recorded, so stats().exit never reports the previous card\'s dissolve — ' + EX.map((x) => x.backend + ' ' + x.mode + ': settle +' + Math.round(x.settleLag) + ' ms').join(' | '),
         EX.every(nativeOk) && /this\.stat\.lastExit = null;/.test(fs.readFileSync(path.join(LAB, 'lib', 'actorstage.js'), 'utf8')), J(EX.map((x) => ({ b: x.backend, m: x.mode, exit: x.exit, fizzleMs: x.fizzleMs, settleLag: x.settleLag, clean: x.clean, peakParts: x.peakParts, masks: x.masks.length, uniforms: x.uniformT.length }))));
      else ok(CARD.tag + 'S12 · THE DISSOLVE EXIT on every backend, Full and Fast: ' + CARD.name + ' (faction "' + EX[0].faction + '") plays the ' + CARD.presetName + ' preset; the held cell erodes over FIZZLE (600 ms Full, 300 ms Fast) — a GPU filter on WebGPU and WebGL, a Canvas 2D mask — with embers off the front (fewer on Canvas 2D)' + (FFXD[CARD.faction].dissolve.smoke === false ? ' and no smoke (the preset sets none)' : ' and smoke behind it') + '; afterwards 0 actors, 0 GPU sprites, 0 particles, no effect, no camera offset, and the board settles within a frame of FIZZLE\'s end, equal to the engine\'s AFTER — ' + showX(EX),
         EX.every(exitOk) && EX[0].faction === CARD.faction && cvFull.exit.embers < glFull.exit.embers,
         J(EX.map((x) => ({ b: x.backend, m: x.mode, exit: x.exit, fizzleMs: x.fizzleMs, settleLag: x.settleLag, clean: x.clean, peakParts: x.peakParts, peakSprites: x.peakSprites, sawFilter: x.sawFilter, masks: x.masks.length, uniforms: x.uniformT.length }))));

      const monoMasks = (masks) => { let pairs = 0, bad = 0; for (let i = 1; i < masks.length; i++) { if (masks[i].cell !== masks[i - 1].cell) continue; pairs++; const A = masks[i - 1].a, B = masks[i].a; for (let j = 0; j < A.length; j++) if (B[j] > A[j]) { bad++; break; } } return { pairs, bad }; };
      const share = (a, test) => { let n = 0; for (let j = 0; j < a.length; j++) if (test(a[j])) n++; return n / a.length; };
      const cm = CARD.exit === 'native' ? [] : EX.filter((x) => x.backend === 'canvas2d').map((x) => Object.assign(monoMasks(x.masks), { mode: x.mode, first: share(x.masks[0].a, (v) => v === 255), last: share(x.masks[x.masks.length - 1].a, (v) => v === 0) }));
      const gpuMono = EX.filter((x) => x.backend !== 'canvas2d').every((x) => x.uniformT.every((v, i) => i === 0 || v >= x.uniformT[i - 1]) && x.uniformT[x.uniformT.length - 1] > x.uniformT[0]);
      const SH = DS.SHADER, R99 = DS.rng(99), PR = DS.resolve(FFXD.asuras);
      const pure = Array.from({ length: 200 }, () => R99()).every((f) => { let prev = 2; for (let i = 0; i <= 50; i++) { const k = DS.keep(f, DS.threshold(i / 50, PR), PR); if (k > prev) return false; prev = k; } return prev === 0; });
      if (CARD.exit === 'native') ok(CARD.tag + 'S13 · LAB-8 · NOTHING TO ERODE: the native exit draws no Canvas 2D mask and sets no GPU threshold on any backend; the dissolve maths itself stays pure (200 random points × 51 steps of the sweep never gain alpha and all end gone)',
         EX.every((x) => x.masks.length === 0 && x.uniformT.length === 0) && pure, J(EX.map((x) => [x.backend, x.mode, x.masks.length, x.uniformT.length])));
      else ok(CARD.tag + 'S13 · A PIXEL NEVER REAPPEARS: every Canvas 2D mask, frame after frame, only loses alpha (' + cm.map((m) => m.mode + ': ' + m.pairs + ' frame pairs, ' + m.bad + ' regressions, first frame ' + Math.round(m.first * 100) + '% whole, last ' + Math.round(m.last * 100) + '% gone').join(' · ') + '); the GPU filter\'s threshold only rises, frame after frame; both shaders erode with keep = clamp((f − t) / soft) over the same field; and the maths itself: 200 random points × 51 steps of the sweep never gain alpha and all end gone',
         cm.every((m) => m.pairs >= 10 && m.bad === 0 && m.first > 0.99 && m.last > 0.99) && gpuMono && pure &&
         /float f = \(1\.0 - vUv\.y\) \* \(1\.0 - uParams2\.y\) \+ nz\.r \* uParams2\.y;/.test(SH.glFragment) && /float keep = clamp\(d \/ uParams\.y, 0\.0, 1\.0\);/.test(SH.glFragment) && /finalColor = vec4\(col, src\.a\) \* keep;/.test(SH.glFragment) &&
         /let f = \(1\.0 - fuv\.y\) \* \(1\.0 - P2\.y\) \+ nz\.r \* P2\.y;/.test(SH.wgsl) && /let keep = clamp\(d \/ P\.y, 0\.0, 1\.0\);/.test(SH.wgsl) && /return vec4<f32>\(col, src\.a\) \* keep;/.test(SH.wgsl), J(cm));

      const FACTIONS = ['asuras', 'devas', 'nagas', 'vanaras', 'default'];
      const presetsOk = FACTIONS.every((k) => FFXD[k] && FFXD[k].exit === 'dissolve' && typeof FFXD[k].name === 'string' && /^#[0-9a-f]{6}$/i.test(DS.resolve(FFXD[k]).edge));
      const PREVIEW = CARD.exit === 'native' ? { exit: 'procedural' } : undefined;   // LAB-8: the Exit preset preview plays the procedural dissolve on a native-exit card too (lab.js exitFor)
      const deva = playExit('canvas2d', 'full', 'devas', PREVIEW), naga = playExit('webgl', 'full', 'nagas', PREVIEW);
      const OPTS = [...PAGE.slice(PAGE.indexOf('<select id="exit-preset">'), PAGE.indexOf('</select>', PAGE.indexOf('<select id="exit-preset">'))).matchAll(/<option value="([a-z]*)"[^>]*>[^<]*<\/option>/g)].map((m) => m[1]), LABJS4 = fs.readFileSync(path.join(LAB, 'lab.js'), 'utf8');
      ok(CARD.tag + 'S14 · THE FACTION PRESETS: data/factionfx.json holds a dissolve exit for all four factions and the default (colour, front width, ember density, smoke on/off; only Asura tuned); Meghnad\'s own faction picks Asura, the lab\'s preview override picks another (' + DS.pick(FFXD, 'asuras', 'nagas').name + '), an unknown override falls back to the card\'s faction and an unknown faction to the default; the page\'s Exit preset dropdown offers the card\'s faction and the four presets and lab.js routes every play\'s exit through it; a play previewed as Deva (Canvas 2D) and as Naga (WebGL) really dissolves in that preset — ' + deva.exit.name + ' ' + deva.exit.edge + ', smoke ' + deva.exit.smoke + ' · ' + naga.exit.name + ' ' + naga.exit.edge + ', smoke ' + naga.exit.smoke,
         presetsOk && DS.pick(FFXD, 'asuras', '').name === 'Asura' && DS.pick(FFXD, 'asuras', 'nagas').name === 'Naga' && DS.pick(FFXD, 'asuras', 'nope').name === 'Asura' && DS.pick(FFXD, 'rishis', '').key === 'default' &&
         J(OPTS) === J(['', 'asuras', 'devas', 'nagas', 'vanaras']) && /factionFx: \(fac\) => window\.Dissolve\.pick\(FFX, fac, exitPreset\)/.test(LABJS4) && /el\('exit-preset'\)\.onchange = \(e\) => \{ exitPreset = e\.target\.value; \}/.test(LABJS4) &&
         deva.exit.name === 'Deva' && deva.exit.edge === FFXD.devas.dissolve.edge && deva.exit.smoke === 0 && naga.exit.name === 'Naga' && naga.exit.edge === FFXD.nagas.dissolve.edge && naga.exit.smoke > 0 && deva.clean && naga.clean,
         J({ deva: deva.exit, naga: naga.exit, OPTS }));

      const DRAWS = EX.concat([deva, naga]).reduce((all, x) => all.concat(x.glowDraws), []);
      const SRC = fs.readFileSync(path.join(LAB, 'lib', 'actorstage.js'), 'utf8') + fs.readFileSync(path.join(LAB, 'lib', 'dissolve.js'), 'utf8');
      ok(CARD.tag + 'S15 · NO GRAIN, NO ADDITIVE: every ember and smoke puff is drawn from one soft high-res image at or below its own size (' + DRAWS.length + ' draws — Canvas 2D embers ≤ ' + DS.GLOW + ' px, puffs ≤ ' + DS.PUFF + ' px, GPU ember sprites at scale ≤ 1: never scaled-up pixels); nothing in the stage or the dissolve blends additively (normal blending; the mask composites destination-in / source-atop on its own offscreen canvas)',
         DRAWS.length > 50 && DRAWS.some((d) => d.kind === 'glow') && DRAWS.some((d) => d.kind === 'puff') && DRAWS.some((d) => d.kind === 'gpu-ember') &&
         DRAWS.every((d) => d.dw > 0 && d.dw <= d.size + 1e-9 && d.dh <= d.size + 1e-9) && !/globalCompositeOperation\s*=\s*'(lighter|screen|plus-lighter)'|blendMode\s*=\s*'(add|screen|lighter)'|BLEND_MODES\.ADD/.test(SRC) && (SRC.match(/blendMode = 'normal'/g) || []).length >= 2,
         J(DRAWS.filter((d) => !(d.dw > 0 && d.dw <= d.size + 1e-9)).slice(0, 5)));

      const LONG = ['full', 'fast'].reduce((all, m) => all.concat(BACKENDS.map((b) => playExit(b, m, '', { fizzleMs: 1500 }))), []);
      const longOk = (x) => !!x.exit && x.fizzleMs === (x.mode === 'full' ? 1500 : 750) && x.exit.dur === x.fizzleMs && x.exit.name === CARD.presetName && x.exit.monotonic && x.exit.progress >= 0.95 &&
        x.exit.frames >= Math.floor(x.fizzleMs / (1000 / 60)) - 2 && x.exit.embers > 0 && x.settleLag != null && x.settleLag >= 0 && x.settleLag < 17 && x.clean && !!x.done && x.done.equalsFinal &&
        (x.backend === 'canvas2d' ? (() => { const m = monoMasks(x.masks); return m.pairs >= 30 && m.bad === 0 && share(x.masks[x.masks.length - 1].a, (v) => v === 0) > 0.99; })()
                                  : x.uniformT.length >= 30 && x.uniformT.every((v, i) => i === 0 || v >= x.uniformT[i - 1]));
      if (CARD.exit === 'native') ok(CARD.tag + 'S16 · LAB-8 · THE FIZZLE LENGTH DOES NOT APPLY: at the inherited 1500 ms FIZZLE, every backend, Full and Fast, the native exit still has no FIZZLE — the play ends when the clip does and settles within a frame, equal to the engine\'s AFTER',
         LONG.every(nativeOk), J(LONG.map((x) => ({ b: x.backend, m: x.mode, exit: x.exit, fizzleMs: x.fizzleMs, settleLag: x.settleLag, clean: x.clean }))));
      else ok(CARD.tag + 'S16 · A LONG FIZZLE (LAB-4d: the ' + CARD.name + ' default, 1500 ms in Full, so 750 ms in Fast), every backend: the sweep stretches to the new length and stays monotonic (no Canvas 2D mask ever regains alpha, the GPU threshold only rises), everything is gone at the end, embers and smoke stretch with it, 0 actors / sprites / particles afterwards, and the board settles within a frame of FIZZLE\'s end, equal to the engine\'s AFTER — ' + showX(LONG),
         LONG.every(longOk), J(LONG.map((x) => ({ b: x.backend, m: x.mode, exit: x.exit, fizzleMs: x.fizzleMs, settleLag: x.settleLag, clean: x.clean }))));

      // ── LAB-6a · THE DEVA EXIT, TUNED — and every other exit exactly as it was ──
      if (CARD.exit === 'native') {
        const WAS7 = JSON.parse(git(['show', 'c03be7f:lab/vfx-manifestation/data/factionfx.json']));
        const prev = BACKENDS.map((b) => playExit(b, 'full', CARD.faction, { exit: 'procedural', tempo: 0.6, fizzleMs: 1500 }));
        ok(CARD.tag + 'S19 · LAB-8 · FALLBACK A STAYS ONE CLICK AWAY: the ' + CARD.presetName + ' preset is byte-identical to LAB-7 (c03be7f) — the native exit tunes nothing — and the Exit preset preview still dissolves ' + CARD.name + ' in it on every backend (1500 ms, monotonic, clean): ' + prev.map((x) => x.backend + ' ' + (x.exit ? x.exit.name + ' ' + x.exit.dur + ' ms' : 'no exit')).join(' | '),
           J(FFXD[CARD.faction]) === J(WAS7[CARD.faction]) && prev.every((x) => !!x.exit && x.exit.name === CARD.presetName && x.exit.dur === 1500 && x.exit.monotonic && x.clean && !!x.done && x.done.equalsFinal), J(prev.map((x) => [x.backend, x.exit])));
      } else if (CARD.faction === 'devas') {
        const pr = DS.resolve(FFXD.devas), asu = DS.resolve(FFXD.asuras), raw = FFXD.devas.dissolve;
        const rate = (x, ms) => x.embers * 150 / Math.max(1, ms / x.lifeRef), lifeAt = (x, ms) => x.emberLife.map((v) => v * ms / x.lifeRef);
        const TUNE = BACKENDS.map((b) => playExit(b, 'full', '', { tempo: 0.6, fizzleMs: 1500 })).concat(BACKENDS.map((b) => playExit(b, 'fast', '', { tempo: 0.6, fizzleMs: 1500 })));
        const asuraSame = playExit('webgl', 'full', 'asuras', { tempo: 0.6, fizzleMs: 1500 });
        const cv = TUNE.find((x) => x.backend === 'canvas2d' && x.mode === 'full'), gl = TUNE.find((x) => x.backend === 'webgl' && x.mode === 'full');
        const tuneOk = (x) => !!x.exit && x.exit.name === 'Deva' && x.exit.monotonic && x.exit.smoke === 0 && x.exit.haze > 0 && x.exit.sweepDoneAt != null && Math.abs(x.exit.sweepDoneAt - x.fizzleMs * pr.sweep) <= 20 &&
          x.exit.afterSweep > 0 && x.exit.peak <= x.exit.cap && x.exit.cap === (x.backend === 'canvas2d' ? pr.canvasCap : pr.gpuCap) && x.clean && !!x.done && x.done.equalsFinal && x.settleLag >= 0 && x.settleLag < 17 &&
          (x.backend === 'canvas2d' ? (() => { const m = monoMasks(x.masks); return m.pairs >= 10 && m.bad === 0; })() : x.uniformT.every((v, i) => i === 0 || v >= x.uniformT[i - 1]));
        ok(CARD.tag + 'S19 · LAB-6a · THE DEVA EXIT, TUNED TO INDRA\'S TAIL: the preset uses the tuning knobs (ember_density ' + raw.ember_density + ' · mote_life ' + J(raw.mote_life) + ' ms · front_width ' + raw.front_width + ' · haze ' + J(raw.haze) + ' · sweep_frac ' + raw.sweep_frac + ' · mote_zone ' + raw.mote_zone + ' · canvas_cap ' + raw.canvas_cap + '); at the inherited 1500 ms FIZZLE its motes spawn ' + (rate(pr, 1500) / rate(asu, 1500)).toFixed(1) + '× Asura\'s rate and live ' + J(lifeAt(pr, 1500)) + ' ms (mean ' + Math.round((lifeAt(pr, 1500)[0] + lifeAt(pr, 1500)[1]) / 2) + ') against Asura\'s ' + J(lifeAt(asu, 1500).map(Math.round)) + ' (mean ' + Math.round((lifeAt(asu, 1500)[0] + lifeAt(asu, 1500)[1]) / 2) + '), still ending by FIZZLE\'s end; the front is wider and softer (' + pr.edgeWidth + ' / ' + pr.soft + ' against ' + asu.edgeWidth + ' / ' + asu.soft + '); motes rise from the whole standing body; no smoke, a light gold haze (alpha ' + pr.haze.alpha + '); on every backend, Full and Fast: the sweep ends at ' + Math.round(pr.sweep * 100) + '% of FIZZLE and stays monotonic, motes outlive it inside FIZZLE, the live motes never pass the cap (Canvas 2D peak ' + cv.exit.peak + ' of ' + pr.canvasCap + ', WebGL ' + gl.exit.peak + ' of ' + pr.gpuCap + '), 0 actors / sprites / particles afterwards, the board settles within a frame, equal to the engine\'s AFTER — ' + TUNE.map((x) => x.backend + ' ' + x.mode + ': motes ' + x.exit.embers + ' (peak ' + x.exit.peak + ', after the sweep ' + x.exit.afterSweep + ') · haze ' + x.exit.haze + ' · sweep done ' + x.exit.sweepDoneAt + ' ms').join(' | '),
           ['ember_density', 'mote_life', 'front_width', 'haze'].every((k) => raw[k] != null) && raw.smoke === false && rate(pr, 1500) >= 3 * rate(asu, 1500) && (lifeAt(pr, 1500)[0] + lifeAt(pr, 1500)[1]) > (lifeAt(asu, 1500)[0] + lifeAt(asu, 1500)[1]) &&
           pr.edgeWidth > asu.edgeWidth && pr.soft > asu.soft && pr.emberZone > 0 && pr.sweep < 1 && pr.haze.alpha <= 0.2 && /^#[0-9a-f]{6}$/i.test(pr.haze.color) &&
           TUNE.every(tuneOk) && gl.exit.embers >= 3 * asuraSame.exit.embers && cv.exit.embers < gl.exit.embers,
           J(TUNE.map((x) => ({ b: x.backend, m: x.mode, exit: x.exit, settleLag: x.settleLag, clean: x.clean }))));
      } else if (CARD.faction === 'asuras') {
        const WAS = JSON.parse(git(['show', 'deacd95:lab/vfx-manifestation/data/factionfx.json']));
        const OLD = { actorstage: git(['show', 'deacd95:lab/vfx-manifestation/lib/actorstage.js']), dissolve: git(['show', 'deacd95:lab/vfx-manifestation/lib/dissolve.js']) };
        const pairs = [];
        BACKENDS.forEach((b) => ['full', 'fast'].forEach((m) => {
          const now = playExit(b, m, '', { tempo: 0.6, fizzleMs: 1500 }), then = playExit(b, m, '', { tempo: 0.6, fizzleMs: 1500 }, OLD, WAS);
          const sig = (x) => J({ exit: x.exit && { embers: x.exit.embers, peak: x.exit.peak, smoke: x.exit.smoke, frames: x.exit.frames, monotonic: x.exit.monotonic, first: x.exit.first, last: x.exit.last },
                                  masks: x.masks.map((q) => sha256(Buffer.from(q.a))).join(','), uniformT: x.uniformT, draws: x.glowDraws, sounds: x.sounds, settleLag: x.settleLag });
          pairs.push({ b, m, same: sig(now) === sig(then), embers: now.exit.embers, smoke: now.exit.smoke, haze: now.exit.haze });
        }));
        const a = DS.resolve(FFXD.asuras);
        ok(CARD.tag + 'S19 · LAB-6a · MEGHNAD\'S ASURA EXIT IS UNCHANGED: the Asura preset entry is byte-identical to LAB-6 (deacd95), it names no tuning knob, it resolves to the neutral defaults (sweep 1, motes off the front, spread 34, no haze, caps never reached); and replayed through LAB-6\'s own actorstage.js and dissolve.js, on every backend in Full and Fast, its exit is the same draw for draw — every mote count, mask, threshold, particle draw and sound — ' + pairs.map((x) => x.b + ' ' + x.m + ': ' + (x.same ? 'identical' : 'DIFFERENT') + ' (embers ' + x.embers + ', smoke ' + x.smoke + ')').join(' | '),
           J(FFXD.asuras) === J(WAS.asuras) && Object.keys(DS.ALIAS).concat(['haze']).every((k) => FFXD.asuras.dissolve[k] === undefined) &&
           a.sweep === 1 && a.emberZone === 0 && a.emberSpread === 34 && a.lifeRef === 600 && a.haze === null && pairs.every((x) => x.same && x.haze === 0), J(pairs));
      } else {
        // LAB-7: a faction whose exit this rung does not tune keeps its preset exactly as LAB-6a left it
        const WAS6a = JSON.parse(git(['show', '41ea143:lab/vfx-manifestation/data/factionfx.json']));
        ok(CARD.tag + 'S19 · LAB-7 · THE ' + CARD.presetName.toUpperCase() + ' EXIT STAYS THE DEFAULT (no tune this rung; the owner rules on Kling\'s earth exit): the ' + CARD.presetName + ' preset entry is byte-identical to LAB-6a (41ea143) and names no tuning knob — ' + J(FFXD[CARD.faction]),
           J(FFXD[CARD.faction]) === J(WAS6a[CARD.faction]) && Object.keys(DS.ALIAS).concat(['haze']).every((k) => FFXD[CARD.faction].dissolve[k] === undefined), J(FFXD[CARD.faction]));
      }

      // ── LAB-9a · NO TELEPORT INSIDE ACT ──
      const poseRun = (seat, rung) => {
        const MR = rung === 512 ? CARD.M : MAN.forRung(CARD.M, 256);
        const W = world(seat, 'canvas2d', undefined, { manifest: MR });
        const plan = W.w.Director.plan(W.ctx, { mode: 'full', ladderExempt: CARD.exempt, timing: NT, tempo: 0.6, fizzleMs: 1500 });
        const r = W.w.Runner.create(plan, W.pb.handlers, () => W.clock.t);
        r.start({});
        let maxAct = 0, atBoundary = 0, prev = null, prevPhase = null;
        while (!r.done && W.clock.t < 30000) {
          W.clock.t += 1000 / 60; r.tick(); W.stage.frame(W.clock.t, W.clock.t);
          const a = W.stage.actors[0], q = a && a.pose;
          if (!q) continue;
          if (prev && a.phase === 'act') { const d = Math.hypot(q.x - prev.x, q.y - prev.y); maxAct = Math.max(maxAct, d); if (prevPhase === 'emerge') atBoundary = Math.max(atBoundary, d); }
          prev = { x: q.x, y: q.y }; prevPhase = a.phase;
        }
        return { seat, rung, maxAct: +maxAct.toFixed(2), atBoundary: +atBoundary.toFixed(2) };
      };
      const POSE = [0, 1].reduce((all, s2) => all.concat([512, 256].map((rg) => poseRun(s2, rg))), []);
      const STAGE9A = fs.readFileSync(path.join(LAB, 'lib', 'actorstage.js'), 'utf8'), PLAY9A = fs.readFileSync(path.join(LAB, 'lib', 'playback.js'), 'utf8');
      ok(CARD.tag + 'S21 · LAB-9a · NO TELEPORT INSIDE ACT, both seats and both rungs: the actor never moves more than 3 px between frames inside ACT and never jumps at the EMERGE→ACT boundary — the charge eases over at least 35% of ACT whatever cell the contact lands on, and a card that performs in place (travelScale 0) never charges at all (under half a pixel — what is left is EMERGE\'s rise easing handing over) (3 px, not 2: the top seat\'s charge travel is 1.85x the player\'s seat\'s — 57.3 px against 31.1 — so the same smooth ease peaks near 2.5 px a frame there; a surge is the 7 px class and a teleport the 31 px class, and both trip this instantly)' + (CARD.M.contactRule === 'nova' ? ', and a "nova" performs where it stands (no travel at all)' : '') + ' — ' + POSE.map((p) => 'seat ' + p.seat + ' @ ' + p.rung + ' px: max ' + p.maxAct + ', boundary ' + p.atBoundary).join(' | '),
         POSE.every((p) => p.maxAct <= 3 && p.atBoundary <= 3) && /var c = Math\.max\(0\.35, a\.contact\);/.test(STAGE9A) &&
         /contactRule === 'nova' \? 0 :/.test(PLAY9A) && /pl\.travel = \{ x: pl\.travel\.x \* ts, y: pl\.travel\.y \* ts \};/.test(PLAY9A) &&
         (MAN.travelScale(CARD.M) > 0 || POSE.every((p) => p.maxAct <= 0.5)), J(POSE));

      // ── LAB-8 · THE NOVA CONTACT RULE ──
      if (CARD.M.contactRule === 'nova') {
        const NOVA = [0, 1].reduce((all, seat) => all.concat(BACKENDS.map((b) => {
          const W = world(seat, b), got = [], f0 = W.stage.flash.bind(W.stage), i0 = W.stage.impulse.bind(W.stage);
          W.stage.flash = (x, y, r, dirY, dur, shape) => { const a = W.stage.actors[0], q = a && a.pose; f0(x, y, r, dirY, dur, shape); got.push({ kind: 'flash', x, y, r: r, dur: dur, h: a && a.pl.height, dirY, shape, cx: q && q.x, cy: q && q.feetY - a.pl.height * 0.5, cell: q && q.cellIndex, radial: W.stage.fx[W.stage.fx.length - 1].radial }); };
          W.stage.impulse = (dirY, px, dur) => { i0(dirY, px, dur); got.push({ kind: 'impulse', dirY }); };
          const R = runWorld(W, { mode: 'full', timing: NT, tempo: 0.6 });
          const cc = R.plan.cues.find((x) => x.cue === 'contact');
          return { seat, b, got, flashMs: cc.flashMs, impulsePx: cc.impulsePx, clean: clean(W) };
        })), []);
        const CI = CARD.M.phases.act[CARD.M.contact];
        const ST = MAN.contactStrength(CARD.M);
        ok(CARD.tag + 'S20 · LAB-8/9 · THE NOVA' + (ST.flash === 1 && ST.impulse === 1 ? '' : ', SOFTENED ' + J(ST)) + ': on both seats and every backend the contact flash is RADIAL (round, no lean) and starts at the ACTOR\'S CENTRE — the pose\'s x and half its height above the feet — on the frame the contact cell (' + nameOf(CI) + ') is drawn, its length and radius scaled by contactStrength.flash (' + ST.flash + '); the camera impulse is scaled by contactStrength.impulse (' + ST.impulse + (ST.impulse === 0 ? ' — a self-cast moves the camera not at all' : ' — it still aims at the true target, up from the player\'s seat and down from the top seat, the A1 clamp untouched') + ')',
           NOVA.every((x) => { const fl = x.got.filter((g) => g.kind === 'flash'), im = x.got.filter((g) => g.kind === 'impulse');
             return fl.length === 1 && fl[0].shape === 'radial' && fl[0].radial === true && fl[0].dirY === 0 && fl[0].x === fl[0].cx && Math.abs(fl[0].y - fl[0].cy) < 1e-9 && fl[0].cell === CI &&
               Math.abs(fl[0].r - fl[0].h * 0.9 * ST.flash) < 1e-9 && fl[0].dur === Math.max(1, Math.round(x.flashMs * ST.flash)) &&
               im.length === (ST.impulse > 0 ? 1 : 0) && (ST.impulse === 0 || (im[0].dirY === (x.seat === 0 ? -1 : 1))) && x.clean; }),
           J(NOVA.map((x) => [x.seat, x.b, x.got])));
      }

      // ── LAB-17 · THE DIRECTIONAL CONTACT — every in-place card that is not a nova ──
      // S20 only ever covered novas, so a ground-impact or bolt-edge card had no check that its flash points at the target. This one
      // gives Bali, Indra, Kartikeya and Makardhwaja that proof: a DIRECTIONAL flash (not radial) on the contact cell, flash and camera
      // impulse both aimed at the true target seat, and the actor still exactly where it spawned when the contact lands.
      if (CARD.M.contactRule !== 'nova' && MAN.travelScale(CARD.M) === 0) {
        const DIRX = [0, 1].reduce((all, seat) => all.concat(BACKENDS.map((b) => {
          const W = world(seat, b), got = [], f0 = W.stage.flash.bind(W.stage), i0 = W.stage.impulse.bind(W.stage), fr0 = W.stage.frame.bind(W.stage);
          let spawn = null;
          W.stage.frame = (t, n) => { const out = fr0(t, n); const a = W.stage.actors[0]; if (a && a.pose && !spawn) spawn = { x: a.pose.x, y: a.pose.feetY }; return out; };
          W.stage.flash = (x, y, r, dirY, dur, shape) => { const a = W.stage.actors[0], q = a && a.pose; f0(x, y, r, dirY, dur, shape);
            got.push({ kind: 'flash', x, y, r, dur, dirY, shape: shape || null, radial: !!(W.stage.fx[W.stage.fx.length - 1] || {}).radial, h: a && a.pl.height,
                       ax: q && q.x, afy: q && q.feetY, cell: q && q.cellIndex }); };
          W.stage.impulse = (dirY, px, dur) => { i0(dirY, px, dur); got.push({ kind: 'impulse', dirY, px }); };
          const R = runWorld(W, { mode: 'full', timing: NT, tempo: 0.6 });
          const cc = R.plan.cues.find((x) => x.cue === 'contact');
          return { seat, b, got, spawn, flashMs: cc.flashMs, impulsePx: cc.impulsePx, clean: clean(W) };
        })), []);
        const CI = CARD.M.phases.act[CARD.M.contact], STD = MAN.contactStrength(CARD.M);
        const summary = DIRX.map((x) => { const fl = x.got.find((g) => g.kind === 'flash'), im = x.got.find((g) => g.kind === 'impulse');
          return 'seat ' + x.seat + ' ' + x.b + ': flash dirY ' + (fl && fl.dirY) + ', impulse dirY ' + (im && im.dirY) + ', actor moved ' + (fl && x.spawn ? Math.hypot(fl.ax - x.spawn.x, fl.afy - x.spawn.y).toFixed(2) : '?') + ' px'; });
        ok(CARD.tag + 'S20b · LAB-17 · THE DIRECTIONAL CONTACT, ' + (CARD.M.audit.recipe.contact || 'non-nova').toUpperCase() + ': on both seats and every backend the contact flash is DIRECTIONAL — not radial — fires on the contact cell, and both it and the camera impulse point at the TRUE target seat (up from the player, down from the top); and the actor\'s distance from where it spawned is REPORTED at the contact. That distance is not what this check guards: its own gate admits only travelScale-0 cards, so a card that charged would be skipped here rather than failed. The charge is guarded by M25 (only Meghnad travels) and by the per-card travelScale pins such as M42, both proven to fail when a card is forced to charge. What THIS check guards is the direction, proven to fail on every one of these cards when the flash is turned around. S20 only ever covered novas; this closes that gap for every in-place card that strikes toward its target — ' + summary.join(' | '),
           DIRX.every((x) => { const fl = x.got.filter((g) => g.kind === 'flash'), im = x.got.filter((g) => g.kind === 'impulse'), want = x.seat === 0 ? -1 : 1;
             return fl.length === 1 && fl[0].shape === null && fl[0].radial === false && fl[0].dirY === want && fl[0].cell === CI &&
               fl[0].x === fl[0].ax && Math.abs(fl[0].y - (fl[0].afy - fl[0].h * 0.55)) < 1e-9 &&
               Math.abs(fl[0].r - fl[0].h * 0.9 * STD.flash) < 1e-9 && fl[0].dur === Math.max(1, Math.round(x.flashMs * STD.flash)) &&
               im.length === (STD.impulse > 0 ? 1 : 0) && (STD.impulse === 0 || im[0].dirY === want) &&
               !!x.spawn && Math.hypot(fl[0].ax - x.spawn.x, fl[0].afy - x.spawn.y) < 0.5 && x.clean; }),
           J(DIRX.map((x) => [x.seat, x.b, x.spawn, x.got])));
      }

      // ── LAB-5 · SOUND ──
      const SND = BACKENDS.map((b) => playExit(b, 'full', '', { tempo: 0.6, fizzleMs: 1500 }));
      const CONTACT_IX = CARD.M.phases.act[CARD.M.contact];
      const sndOk = (x) => { const c = x.sounds.filter((q) => q.n === 'contact'), e = x.sounds.filter((q) => q.n === 'exit'), Z = x.phases.find((p) => p.name === 'FIZZLE');
        if (CARD.exit === 'native') return x.sounds.length === 1 && c.length === 1 && c[0].cell === CONTACT_IX && e.length === 0 && !Z;   // LAB-8: the clip's own exit makes no exit sound
        return x.sounds.length === 2 && c.length === 1 && c[0].cell === CONTACT_IX && e.length === 1 && e[0].phase === 'fizzle' && e[0].t >= Z.t0 && e[0].t - Z.t0 < 17; };
      const LA = lib('labaudio'), LAB_AUDIO = fs.readFileSync(path.join(LAB, 'lib', 'labaudio.js'), 'utf8'), GAME_HTML = fs.readFileSync(path.join(GAME, 'index.html'), 'utf8'), LABJS6 = fs.readFileSync(path.join(LAB, 'lab.js'), 'utf8');
      const store = (o) => ({ getItem: (k) => (k in o ? o[k] : null) });
      const settingsOk = J(LA.settings(store({}))) === J({ sfxOn: true, sfxVol: 0.8 }) && J(LA.settings(store({ dy_sfx: '0' }))) === J({ sfxOn: false, sfxVol: 0.8 }) && LA.settings(store({ dy_sfxvol: '35' })).sfxVol === 0.35 && LA.settings(store({ dy_sfxvol: '0' })).sfxVol === 0.8;
      function FakeCtx() { this.state = 'running'; this.destination = {}; }
      FakeCtx.prototype.createGain = () => ({ gain: { value: 0 }, connect() {} }); FakeCtx.prototype.decodeAudioData = () => new Promise(() => {}); FakeCtx.prototype.createBufferSource = () => ({ connect() {}, start() {} });
      const fakeW = { AudioContext: FakeCtx, fetch: () => new Promise(() => {}) };
      const liveA = LA.create({ window: fakeW, storage: store({}), files: { contact: 'x' } }), mutedA = LA.create({ window: fakeW, storage: store({ dy_sfx: '0' }), files: { contact: 'x' } });
      const beforeGesture = liveA.play('contact'); liveA.unlock(); const afterGesture = liveA.play('contact'); mutedA.unlock(); const whenMuted = mutedA.play('contact');
      const sha = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
      const filesSame = ['sfx_unit_clash.mp3', 'sfx_chaos_surge.mp3'].every((n) => fs.existsSync(path.join(LAB, 'audio', n)) && sha(path.join(LAB, 'audio', n)) === sha(path.join(GAME, 'assets', 'audio', n)));
      ok(CARD.tag + 'S17 · SOUND (LAB-5): on every backend a play at the defaults sounds exactly twice — the strike on the frame the contact cell (' + nameOf(CONTACT_IX) + ') is drawn, the ember exit on FIZZLE\'s first frame; the lab plays them through the game\'s own pattern, copied (a context only after the first gesture, a fresh buffer source per trigger, the game\'s dy_sfx / dy_sfxvol read exactly as the game reads them): before a gesture "' + beforeGesture + '", after it "' + afterGesture + '", with the game muted "' + whenMuted + '"; the two placeholder sounds are byte-identical copies of the game\'s sfx_unit_clash and sfx_chaos_surge',
         SND.every(sndOk) && settingsOk && beforeGesture === 'locked' && afterGesture === 'played' && whenMuted === 'muted' && filesSame &&
         /let sfxOn = localStorage\.getItem\('dy_sfx'\)!=='0';/.test(GAME_HTML) && /let sfxVol=\(parseInt\(localStorage\.getItem\('dy_sfxvol'\)\)\|\|80\)\/100;/.test(GAME_HTML) &&
         /get\('dy_sfx'\) !== '0'/.test(LAB_AUDIO) && /\(parseInt\(get\('dy_sfxvol'\)\) \|\| 80\) \/ 100/.test(LAB_AUDIO) && /var src = ctx\.createBufferSource\(\); src\.buffer = buffers\[name\]; src\.connect\(fileGain\); src\.start\(\);/.test(LAB_AUDIO) &&
         /window\.LabAudio\.create\(/.test(LABJS6) && /sound: \(name\) => audio\.play\(name\)/.test(LABJS6) && /\['pointerdown', 'click', 'touchstart', 'keydown'\]\.forEach\(\(ev\) => window\.addEventListener\(ev, unlockAudioOnce\)\);/.test(LABJS6),
         J(SND.map((x) => x.sounds)));

      // ── LAB-5 · REDUCED MOTION / NO ACTOR ──
      const RED = [];
      [0, 1].forEach((seat) => BACKENDS.forEach((b) => {
        const W = world(seat, b, (fac) => DS.pick(FFXD, fac, ''), { noLoad: true });
        const plan = W.w.Director.plan(W.ctx, { mode: 'reduced', ladderExempt: CARD.exempt, timing: NT, tempo: 0.6, fizzleMs: 1500 }), r = W.w.Runner.create(plan, W.pb.handlers, () => W.clock.t);
        const peak = { actors: 0, particles: 0, decoded: 0, sprites: 0 }; r.start({});
        while (!r.done && W.clock.t < 20000) {
          W.clock.t += 1000 / 60; r.tick(); W.stage.frame(W.clock.t, W.clock.t);
          peak.actors = Math.max(peak.actors, W.stage.liveActors()); peak.particles = Math.max(peak.particles, W.stage.liveParticles()); peak.decoded = Math.max(peak.decoded, W.stage.decodedBytes()); peak.sprites = Math.max(peak.sprites, W.stage.liveSprites());
        }
        const SR = plan.phases.find((p) => p.name === 'SETTLE'), fl = W.renders.find((x) => x.t >= SR.t0);
        RED.push({ seat, b, actorPlan: plan.actor, mode: plan.mode, total: plan.total, peak, pulses: W.calls.pulses.length, sounds: W.calls.sounds.length, cellsDrawn: W.calls.cells.length, floats: fl ? fl.floats : null, done: W.done[0], clean: clean(W) });
      }));
      const LABJS7 = fs.readFileSync(path.join(LAB, 'lab.js'), 'utf8');
      ok(CARD.tag + 'S18 · REDUCED MOTION / NO ACTOR (LAB-5), both seats × every backend: a Reduced play (forced, or asked for by prefers-reduced-motion) shows no actor — no actor, sprite, particle or cell drawn, no sound, no atlas decoded (0 MB throughout) — one card pulse, then SETTLE with ' + CARD.numbersText + ', equal to the engine\'s AFTER (' + RED[0].total + ' ms); the lab switches to Reduced when the device asks and decodes an atlas only for a play that shows its actor',
         RED.every((x) => !x.actorPlan && x.mode === 'reduced' && x.peak.actors === 0 && x.peak.particles === 0 && x.peak.decoded === 0 && x.peak.sprites === 0 && x.pulses === 1 && x.sounds === 0 && x.cellsDrawn === 0 &&
                          !!x.floats && J(x.floats) === J(CARD.expectFloats(x.seat)) && !!x.done && x.done.equalsFinal && x.clean) &&
         /window\.matchMedia\('\(prefers-reduced-motion: reduce\)'\)\.matches/.test(LABJS7) && /const art = lastPlan\.actor && mf \? await actorFor\(ctx\.cardId\) : null;/.test(LABJS7), J(RED));

      // ═══ THE ACCEPTANCE GATE (LAB-5) — every check below also counts in the suite; one line sums it up ═══
      const GATE = [];
      const gate = (name, pass, detail) => { GATE.push({ name, pass: !!pass }); ok(CARD.tag + 'GATE · ' + name, pass, detail); };
      const cardIds = (b) => [0, 1].map((s2) => ['heroes', 'units'].map((z) => b.seats[s2][z].filter((c) => c && !c.ghost).map((c) => c.uid).join(',')).join('|')).join(' / ');
      const ONE_ACTOR = MAN.decodedBytes(CARD.M);
      const gateRun = (seat, backend, mode, how, at) => {
        const W = world(seat, backend, (fac) => DS.pick(FFXD, fac, ''), { noLoad: mode === 'reduced' });
        let spawn = null; const sp0 = W.stage.spawn.bind(W.stage);
        W.stage.spawn = (id, pl, fac) => { if (!spawn) spawn = { id, anchor: { x: pl.anchor.x, y: pl.anchor.y }, dirY: pl.dirY, upright: !('flipY' in pl), height: pl.height, scale: pl.scale, shift: pl.shift, top: pl.anchor.y - pl.height }; return sp0(id, pl, fac); };
        const plan = W.w.Director.plan(W.ctx, { mode, ladderExempt: CARD.exempt, timing: NT, tempo: 0.6, fizzleMs: 1500 }), r = W.w.Runner.create(plan, W.pb.handlers, () => W.clock.t);
        const ph = at ? plan.phases.find((p) => p.name === at) : null, cutT = ph ? Math.round((ph.t0 + ph.t1) / 2) : null, S = plan.phases.find((p) => p.name === 'SETTLE');
        const styles = new Set(); let cut = null; r.start({});
        while (!r.done && W.clock.t < 30000) {
          W.clock.t += 1000 / 60; r.tick(); W.stage.frame(W.clock.t, W.clock.t);
          const st = W.w.document.getElementById('field').style; for (let i = 0; i < st.length; i++) styles.add(st[i]);
          if (cutT != null && !cut && r.t >= cutT) {
            cut = { at, t: Math.round(r.t), actors: W.stage.liveActors(), decoded: W.stage.decodedBytes() };
            r.skip();   // Skip · a hidden page (lab.js: visibilitychange → runner.skip()) · a renderer switch (lab.js backend(): stopRun — a skip — then useBackend)
            if (how === 'switch') { W.stage.teardownGpu(); if (backend === 'canvas2d') W.installPixi('webgl'); else { W.stage.backend = 'canvas2d'; W.stage.renderer = 'canvas2d'; } cut.to = W.stage.renderer; }
          }
        }
        const entry = W.renders[0], settled = W.renders.find((x) => x.t >= S.t0), last = W.renders[W.renders.length - 1];
        return { seat, backend, mode, how: how || 'plain', at: at || null, spawn, cut, done: W.done[0], clean: clean(W), decodedAfter: W.stage.decodedBytes(), peakDecoded: W.stage.stats().peakDecoded,
                 loads: W.stage.stat.loads, unloads: W.stage.stat.unloads, texDestroyed: W.calls.texDestroyed, bitmapClosed: W.calls.bitmapClosed, styles: [...styles],
                 midRenders: how ? null : W.renders.filter((x) => x !== entry && x.t < S.t0).length, sameCards: how ? null : !!(entry && settled && cardIds(entry.board) === cardIds(settled.board)), lastFloats: last ? last.floats.length : null };
      };
      const PLAIN = [], SKIPS = [], SWITCHES = [], HIDES = [];
      [0, 1].forEach((seat) => BACKENDS.forEach((b) => ['full', 'fast', 'reduced'].forEach((m) => PLAIN.push(gateRun(seat, b, m)))));
      BACKENDS.forEach((b) => ['AWAKEN', 'EMERGE', 'ACT', 'FIZZLE', 'SETTLE'].filter((p) => CARD.exit !== 'native' || p !== 'FIZZLE').forEach((at) => SKIPS.push(gateRun(0, b, 'full', 'skip', at))));
      BACKENDS.forEach((b) => ['EMERGE', 'ACT', 'FIZZLE'].filter((p) => CARD.exit !== 'native' || p !== 'FIZZLE').forEach((at) => SWITCHES.push(gateRun(1, b, 'full', 'switch', at))));
      BACKENDS.forEach((b) => ['EMERGE', 'ACT', 'FIZZLE'].filter((p) => CARD.exit !== 'native' || p !== 'FIZZLE').forEach((at) => HIDES.push(gateRun(0, b, 'full', 'hide', at))));
      const actorRuns = PLAIN.filter((x) => x.mode !== 'reduced');
      gate('the right card on the right seat, both sides: every Full and Fast play spawns ' + CARD.name + ' at its own card, reaching toward the other seat, upright and THE SAME SIZE on both seats (height ' + (90 * 2.1) + ' px, scale ' + (90 * 2.1 / CARD.M.refHeight).toFixed(4) + ' — placement gives way, never scale; never above the board\'s top edge here)' + (CARD.M.aim ? ' (aim ' + CARD.M.aim + ': on the top seat the action fires up and off the board)' : '') + ' (' + actorRuns.length + ' plays); a Reduced play spawns nothing',
        actorRuns.every((x) => { const g = geo(x.seat); return x.spawn && x.spawn.id === CARD.id && x.spawn.upright && x.spawn.height === g.card.h * 2.1 && x.spawn.scale === g.card.h * 2.1 / CARD.M.refHeight && x.spawn.shift >= 0 && x.spawn.top >= -1e-9 && Math.abs(x.spawn.anchor.x - (g.card.x + g.card.w / 2)) < 0.01 && Math.abs(x.spawn.anchor.y - (g.card.y + g.card.h * 0.94 + x.spawn.shift)) < 0.01 && x.spawn.dirY === (x.seat === 0 ? -1 : 1) && !SM.touchesBand({ anchor: x.spawn.anchor, height: x.spawn.height, travel: { x: 0, y: 0 } }, g.band); }) &&
        PLAIN.filter((x) => x.mode === 'reduced').every((x) => !x.spawn), J(PLAIN.map((x) => [x.seat, x.backend, x.mode, x.spawn])));
      gate('the outcome equals the engine\'s AFTER on every play: both seats × 3 backends × Full / Fast / Reduced (' + PLAIN.length + ' plays)', PLAIN.every((x) => !!x.done && x.done.equalsFinal), J(PLAIN.map((x) => [x.seat, x.backend, x.mode, x.done])));
      gate('nothing stale after Skip in any phase: AWAKEN / EMERGE / ACT / FIZZLE / SETTLE × 3 backends (' + SKIPS.length + ') — no actor, sprite, particle, effect or camera offset, the board on AFTER with no numbers',
        SKIPS.every((x) => x.cut && x.clean && !!x.done && x.done.equalsFinal && x.lastFloats === 0), J(SKIPS.map((x) => [x.backend, x.at, x.cut, x.clean, x.done])));
      gate('nothing stale after a renderer switch mid-play: EMERGE / ACT / FIZZLE × 3 backends (' + SWITCHES.length + ', seat 1) — the play lands on AFTER, then the renderer changes (' + SWITCHES.map((x) => x.backend + '→' + (x.cut && x.cut.to)).filter((v, i, a2) => a2.indexOf(v) === i).join(', ') + ')',
        SWITCHES.every((x) => x.cut && x.cut.actors === 1 && x.clean && !!x.done && x.done.equalsFinal) && /stopRun\(\);\n    try \{ if \(which === 'canvas'\)/.test(LABJS7) && /function stopRun\(\) \{ if \(runner && !runner\.done\) runner\.skip\(\); runner = null; \}/.test(LABJS7),
        J(SWITCHES.map((x) => [x.backend, x.at, x.cut, x.clean, x.done])));
      gate('nothing stale after the page is hidden mid-play: EMERGE / ACT / FIZZLE × 3 backends (' + HIDES.length + ') — lab.js lands the play on AFTER the moment the page hides',
        HIDES.every((x) => x.cut && x.cut.actors === 1 && x.clean && !!x.done && x.done.equalsFinal) && /document\.addEventListener\('visibilitychange', \(\) => \{ if \(document\.hidden && runner && !runner\.done\) \{ runner\.skip\(\);/.test(LABJS7),
        J(HIDES.map((x) => [x.backend, x.at, x.cut, x.clean])));
      const rulesCss = [...PAGE.matchAll(/([^{}]+)\{([^}]*)\}/g)].map((m) => ({ sel: m[1], body: m[2].replace(/\s+/g, '') }));
      const layers = ['vfxcanvas', 'actorunder', 'actorcanvas', 'actorgpu', 'actorover', 'floatlayer'];
      const absolute = layers.filter((id) => rulesCss.some((r) => new RegExp('#' + id + '(?![\\w-])').test(r.sel) && /position:absolute/.test(r.body)));
      gate('no layout shift of the board in any phase: the board re-renders only as the card enters and at SETTLE (never between), SETTLE keeps every card in its row and order, the only style the play puts on the field is a transform (the camera impulse), and every effect and actor layer is absolutely positioned (' + absolute.length + ' of ' + layers.length + ')',
        PLAIN.every((x) => x.midRenders === 0 && x.sameCards && x.styles.every((k) => k === 'transform')) && absolute.length === layers.length,
        J({ plain: PLAIN.map((x) => [x.seat, x.backend, x.mode, x.midRenders, x.sameCards, x.styles]), absolute }));
      const ALLRUNS = PLAIN.concat(SKIPS, SWITCHES, HIDES);
      gate('memory back to 0 after every path (' + ALLRUNS.length + ' runs): 0 actor MB afterwards, never more than one actor held (' + (ONE_ACTOR / 1048576).toFixed(1) + ' MB at the 512 rung), the bitmap closed and the GPU texture destroyed whenever an atlas was loaded, and a Reduced play never decodes one',
        ALLRUNS.every((x) => x.decodedAfter === 0 && x.peakDecoded <= ONE_ACTOR && (x.mode === 'reduced' ? x.loads === 0 && x.peakDecoded === 0 : x.loads === 1 && x.unloads === 1 && x.bitmapClosed === 1 && (x.backend === 'canvas2d' || x.texDestroyed >= 1))),
        J(ALLRUNS.filter((x) => !(x.decodedAfter === 0)).map((x) => [x.backend, x.mode, x.how, x.at, x.decodedAfter, x.loads, x.unloads, x.bitmapClosed, x.texDestroyed])));
      const STP = require(path.join(LAB, 'tools', 'stamp_lab.js')).status();
      gate('the lab stamp is current (' + STP.stamp + ')', STP.file === STP.stamp && STP.pageCurrent, J(STP));
      console.log('\n    GATE · ' + CARD.name + ': ' + (GATE.every((g) => g.pass) ? 'PASS' : 'FAIL') + ' — ' + GATE.map((g) => (g.pass ? '✓ ' : '✖ ') + g.name.split(':')[0]).join(' · ') + '\n');
      ALLGATES.push({ card: CARD.name, pass: GATE.every((g) => g.pass), checks: GATE.length });
    };
    CARDS.forEach(stageSuite);
    console.log('    GATE: ' + (ALLGATES.every((g) => g.pass) ? 'PASS' : 'FAIL') + ' — ' + ALLGATES.map((g) => (g.pass ? '✓ ' : '✖ ') + g.card + ' (' + g.checks + ' checks)').join(' · ') + '\n');
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
  const ARTS = Object.keys(REG).filter((k) => REG[k].art).map((k) => REG[k].art);
  ok('R4 · the runtime asset subset is exact: the Pixi copy + ONE effect\'s sheets (Chaos Surge, lo rung), and the card art of exactly the registry\'s cards, read from the registry by tools/copy_runtime.js (' + ARTS.join(', ') + ') — each byte-identical to the game\'s',
     J(onDisk) === J(exact.slice().sort()) && COPY.files.length === exact.length + ARTS.length && COPY.files.every(same) && J(fs.readdirSync(path.join(LAB, 'art')).sort()) === J(ARTS.slice().sort()) &&
     J(T.ASSETS.slice(exact.length).map((x) => x[1])) === J(ARTS.map((x) => 'art/' + x)), J(onDisk));
}

// ═══ P · THE PAGE ═══
console.log('\n── P · the page ──');
{
  const ids = ['field', 'divider', 'vfxcanvas', 'vfxflash', 'actorunder', 'actorcanvas', 'actorgpu', 'actorover', 'floatlayer', 'banner', 'card-buttons', 'phase-awaken', 'phase-emerge', 'phase-act', 'phase-fizzle', 'phase-settle',
               'ctl-skip', 'ctl-ff', 'ctl-memory', 'mode-full', 'mode-fast', 'mode-reduced', 'seat-swap', 'be-webgpu', 'be-webgl', 'be-canvas', 'clk-slow', 'clk-pause', 'clk-step',
               'ro-fps', 'ro-time', 'ro-renderer', 'ro-actor', 'ro-effect', 'effectclip', 'ro-rung', 'ro-sprites', 'ro-decode', 'ro-mb', 'ro-errors', 'ro-stamp', 'ro-exit', 'exit-preset', 'tempo', 'fizzle-ms', 'tempo-val', 'fizzle-val', 'quality', 'mock-match', 'ro-quality', 'ro-sound', 'ro-layout', 'ro-mock', 'plan'];
  const missing = ids.filter((id) => PAGE.indexOf('id="' + id + '"') < 0);
  const order = ['../lib/boarddiff.js', '../lib/clashcontext.js', '../lib/director.js', '../lib/runner.js', '../lib/manifest.js', '../lib/stagemath.js', '../lib/dissolve.js', '../lib/labaudio.js', '../lib/actorstage.js', '../lib/playback.js', '../lib/effectclip.js', 'vfx.js', '../lab.js'].map((s) => PAGE.indexOf('<script src="' + s + '?v='));
  const fieldBlock = PAGE.slice(PAGE.indexOf('<div id="field"'), PAGE.indexOf('<div id="hand">'));
  ok('P1 · the page: noindex, <base href="runtime/">, #field holding the effect and actor layers, the scripts in dependency order, every control (Play, the five phase replays, Skip, Fast-forward, match memory, mode, sides, renderer, clock) and every readout including Actor and Plan; the exit readout reads the PLAN (a native exit says so) and never the stage\'s last dissolve',
     /<meta name="robots" content="noindex, nofollow">/.test(PAGE) && /<base href="runtime\/">/.test(PAGE) && missing.length === 0 && order.every((i, k) => i > 0 && (k === 0 || i > order[k - 1])) &&
     ['vfxcanvas', 'effectclip', 'actorunder', 'actorcanvas', 'actorgpu', 'actorover', 'floatlayer'].every((id) => fieldBlock.indexOf('id="' + id + '"') > 0) && !/type="button" disabled/.test(PAGE) && /Object\.keys\(REG\)\.filter\(\(id\) => REG\[id\]\.manifest \|\| REG\[id\]\.effect\)\.forEach/.test(fs.readFileSync(path.join(LAB, 'lab.js'), 'utf8'))
     && /rx\.textContent = \(lastPlan && lastPlan\.exit === 'native'\) \? NATIVE_EXIT_NOTE/.test(fs.readFileSync(path.join(LAB, 'lab.js'), 'utf8')), 'missing: ' + missing.join(', '));
  const code = PAGE + ['lab.js'].concat(fs.readdirSync(path.join(LAB, 'lib')).map((n) => 'lib/' + n)).map((p) => fs.readFileSync(path.join(LAB, p), 'utf8')).join('\n');
  const readme = fs.readFileSync(path.join(LAB, 'README.md'), 'utf8');
  ok('P2 · nothing on the page loads from the live game (no ../../ path, no game asset URL in the page, lab.js or lib/); the README keeps the SETTLE note (index.html:8162–8171) and documents LAB-2+3',
     !/\.\.\/\.\.\//.test(code) && !/sangbaran-purr\.github\.io\/divya-yuddha\/(assets|index)/.test(code) && /index\.html:8162–8171/.test(readme) && /LAB-2\+3/.test(readme));
  const STT = require(path.join(LAB, 'tools', 'stamp_lab.js')), st = STT.status(), LABJS = fs.readFileSync(path.join(LAB, 'lab.js'), 'utf8');
  const scripts = [...PAGE.matchAll(/<script src="([^"]+)"><\/script>/g)].map((m) => m[1]);
  const fetches = [...LABJS.matchAll(/(?<![\w.])fetch\(([^)]*)/g)].map((m) => m[1].trim());   // not prefetch(…)
  ok('P3 · THE STAMP (LAB-4a): STAMP is the content hash of the ' + st.inputs + ' files the page loads (' + st.stamp + '); index.html carries it in <meta name="lab-stamp"> and on all ' + scripts.length + ' of its scripts; lab.js stamps every fetch (' + fetches.length + '), image, module and atlas URL through V(), and at boot reads STAMP with no-store and reloads onto a newer one',
     st.file === st.stamp && st.pageCurrent && PAGE.indexOf('<meta name="lab-stamp" content="' + st.stamp + '">') > 0 && scripts.length === 13 && scripts.every((u) => u.endsWith('?v=' + st.stamp)) &&
     fetches.length >= 6 && fetches.every((f) => /^V\(/.test(f) || f === 'murl' || /^new URL\('\.\.\/STAMP'/.test(f)) && /const murl = new URL\(V\(/.test(LABJS) &&
     /im\.src = V\(/.test(LABJS) && /fetch\(V\(new URL\(window\.ActorManifest\.forRung\(/.test(LABJS) && /pixiUrl: V\(/.test(LABJS) && /cache: 'no-store'/.test(LABJS) && /location\.replace/.test(LABJS),
     J({ st, unstamped: scripts.filter((u) => !u.endsWith('?v=' + st.stamp)), fetches }));
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
