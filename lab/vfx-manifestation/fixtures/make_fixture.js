#!/usr/bin/env node
'use strict';
// fixtures/make_fixture.js — VFX-LAB-1. The Meghnad-play fixture, produced by the REAL engine (src/engine.js, READ-ONLY).
//
//   node lab/vfx-manifestation/fixtures/make_fixture.js        → writes meghnad_seat0.json and meghnad_seat1.json, indra_seat0.json and indra_seat1.json, bali_seat0.json and bali_seat1.json
//
// The situation (legal, reachable, ruled pilot A3): Realm pinned to Mrityulok (no realm touches Hero power), no mulligan,
// fixed decklists. The Deva seat moves first and plays Indra (a Hero, printed 7); the Asura seat then plays Meghnad
// ("ON PLAY: If an enemy Hero is on the board, deal 2 damage to it directly"). Seat names are the staked road's own
// tokens {p0}/{p1}, so the event text has the shape a real frame receives. Written for BOTH seats — the attacker as seat 0
// and as seat 1 — so the lab can prove the manifestation from either side.
// Each fixture holds the engine's events for that one play IN ENGINE ORDER, the board BEFORE and AFTER, the log lines
// the play wrote, and the board difference. The Hero's −2 is in the board difference and the log — in no event.
// LAB-6: buildIndra(seat) — the second character's fixture. The Deva seat (as seat 0 and as seat 1) moves first on an empty board
// and plays Indra: the Hero enters, and nothing else happens (no damage, no buff — the no-number SETTLE path).
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const LAB = path.resolve(__dirname, '..'), GAME = path.resolve(LAB, '..', '..');
const ENGINE = path.join(GAME, 'src', 'engine.js');
const { boardDiff } = require(path.join(LAB, 'lib', 'boarddiff.js'));

const ASURA_DECK = ['Meghnad', 'Asura Berserker', 'Kali Asura', 'Kalanemi', 'Bana Asura', 'Narakasura', 'Vibhishana', 'Ravana', 'Maricha', 'Tataka', 'Hiranyakashipu', 'Kumbhakarna'];
const DEVA_DECK = ['Indra', 'Narada', 'Chandra Dev', 'Yama', 'Marut', 'Gandharva', 'Deva Soldier', 'Kubera', 'Urvashi', 'Brihaspati', 'Vishwakarma', 'Agni'];
const HAND = (deck) => deck.slice(0, 10);

function freshEngine() { const p = require.resolve(ENGINE); delete require.cache[p]; return require(ENGINE); }   // the uid counter is module-global
function seeded(s) { return function () { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; }; }
const engineSha = () => crypto.createHash('sha256').update(fs.readFileSync(ENGINE)).digest('hex');

function snapshot(E, g) {
  const card = (seat) => (c) => c ? { uid: c.uid, id: c.id, n: c.n, t: c.t, r: c.r, power: c.power, base: c.base, eff: c.ghost ? 1 : E.effPower(g, seat, c), venom: c.venom || 0, bound: !!c.bound, ghost: !!c.ghost } : null;
  return {
    round: g.round, turn: g.turn, over: !!g.over, realm: g.realm,
    seats: g.players.map((pl, seat) => ({
      faction: pl.faction, units: pl.units.map(card(seat)), heroes: pl.heroes.map(card(seat)), artifact: card(seat)(pl.artifact),
      hand: pl.hand.map((c) => ({ uid: c.uid, id: c.id, n: c.n, t: c.t, r: c.r, power: c.power })), discard: pl.discard.map((c) => c.id),
      deckCount: pl.deck.length, shieldUids: pl.shieldUids.slice(), passed: !!pl.passed, roundWins: pl.roundWins,
    })),
  };
}

function build(attackerSeat) {
  const devaSeat = 1 - attackerSeat;
  for (let seed = 1; seed < 1000; seed++) {
    const E = freshEngine();
    const decks = attackerSeat === 0 ? [ASURA_DECK, DEVA_DECK] : [DEVA_DECK, ASURA_DECK];
    const opts = { rng: seeded(seed), p0: '{p0}', p1: '{p1}', realm: 'mrityulok', p0Faction: attackerSeat === 0 ? 'asuras' : 'devas', p1Faction: attackerSeat === 1 ? 'asuras' : 'devas',
                   scenario: { p0Deck: decks[0], p1Deck: decks[1], p0Hand: HAND(decks[0]), p1Hand: HAND(decks[1]), mulligan: 0 } };
    const g = E.newGame(opts);
    if (g.turn !== devaSeat) continue;                                        // the Deva seat must move first, to set Indra down
    const setup = [];
    const ih = g.players[devaSeat].hand.findIndex((c) => c.id === 'indra');
    E.playCard(g, devaSeat, ih); setup.push({ seat: devaSeat, type: 'play', card: 'Indra', handIndex: ih });
    if (g.turn !== attackerSeat) throw new Error('after Indra the turn did not pass to the Asura seat');
    const before = snapshot(E, g), ev0 = g.events.length, log0 = g.log.length;
    const mh = g.players[attackerSeat].hand.findIndex((c) => c.id === 'meghnad');
    E.playCard(g, attackerSeat, mh);
    const after = snapshot(E, g);
    return {
      fixture: 'meghnad_play', ruling: 'VFX_MANIFESTATION_v1 AMENDMENT 2026-09-13 — A1 (the board is the truth), A3 (the pilot)',
      engine: { file: 'src/engine.js', sha256: engineSha() },
      seed, attackerSeat, defenderSeat: devaSeat, realm: 'mrityulok',
      scenario: { p0: opts.p0, p1: opts.p1, p0Faction: opts.p0Faction, p1Faction: opts.p1Faction, p0Deck: decks[0], p1Deck: decks[1], mulligan: 0 },
      setup, action: { seat: attackerSeat, type: 'play', card: 'Meghnad', handIndex: mh, targetUid: null },
      before, events: g.events.slice(ev0), log: g.log.slice(log0).map((l) => l.msg), after,
      diff: boardDiff(before, after),
    };
  }
  throw new Error('no seed in 1..999 gave the Deva seat the first move');
}

// LAB-7: one builder for every "a Hero enters on an empty board" fixture — the card's seat moves first and plays it; nothing else
// happens (the no-number SETTLE path). Indra's fixture is this builder's output, field for field, as it was.
// LAB-16: a Vanara deck WITHOUT Heroes. VANARA_DECK (LAB-7) holds Bali, Sugriva and Angad together and Bali's byte-pinned fixture
// uses it unsliced, so it stays exactly as it is; a hero entry here names its own Hero and draws only non-Hero Vanaras beside it
const VANARA_UNITS = ['Nala', 'Neela', 'Jambavan', 'Kesari', 'Tara', 'Dwivida', 'Mainda', 'Sharabha', 'Vanara Scout', 'Vanara Warrior', 'Dadhimukha', 'Riksha'];
// LAB-14: the first Naga decks — the twelve launch Nagas that are not Heroes, so a hero entry names its own Hero and nothing else enters
const NAGA_DECK = ['Manasa', 'Karkotaka', 'Surasa', 'Ulupi', 'Naga Sadhu', 'Kaliya', 'Astika', 'Naga Archer', 'Naga Enchantress', 'Naga Warrior', 'Naga Hatchling', 'Ashvatara'];
const VANARA_DECK = ['Bali', 'Sugriva', 'Angad', 'Nala', 'Neela', 'Jambavan', 'Kesari', 'Tara', 'Dwivida', 'Mainda', 'Sharabha', 'Vanara Scout'];
function buildHeroEntry(spec, seat) {
  const other = 1 - seat;
  for (let seed = 1; seed < 1000; seed++) {
    const E = freshEngine();
    const decks = seat === 0 ? [spec.deck, spec.oppDeck] : [spec.oppDeck, spec.deck];
    const opts = { rng: seeded(seed), p0: '{p0}', p1: '{p1}', realm: 'mrityulok', p0Faction: seat === 0 ? spec.faction : spec.oppFaction, p1Faction: seat === 1 ? spec.faction : spec.oppFaction,
                   scenario: { p0Deck: decks[0], p1Deck: decks[1], p0Hand: HAND(decks[0]), p1Hand: HAND(decks[1]), mulligan: 0 } };
    const g = E.newGame(opts);
    if (g.turn !== seat) continue;                                            // the card's seat must move first: it is the opening play
    const before = snapshot(E, g), ev0 = g.events.length, log0 = g.log.length;
    const ih = g.players[seat].hand.findIndex((c) => c.n === spec.card);       // by NAME: an engine id may differ (Bali is id "hanuman")
    E.playCard(g, seat, ih);
    const after = snapshot(E, g);
    return {
      fixture: spec.fixture, ruling: spec.ruling,
      engine: { file: 'src/engine.js', sha256: engineSha() },
      seed, attackerSeat: seat, defenderSeat: other, realm: 'mrityulok',
      scenario: { p0: opts.p0, p1: opts.p1, p0Faction: opts.p0Faction, p1Faction: opts.p1Faction, p0Deck: decks[0], p1Deck: decks[1], mulligan: 0 },
      setup: [], action: { seat, type: 'play', card: spec.card, handIndex: ih, targetUid: null },
      before, events: g.events.slice(ev0), log: g.log.slice(log0).map((l) => l.msg), after,
      diff: boardDiff(before, after),
    };
  }
  throw new Error('no seed in 1..999 gave the ' + spec.faction + ' seat the first move');
}
const HERO_ENTRIES = {
  indra: { card: 'Indra', faction: 'devas', deck: DEVA_DECK, oppFaction: 'asuras', oppDeck: ASURA_DECK, fixture: 'indra_play',
           ruling: 'VFX-LAB-6 — the second character, by the template; A1 (the board is the truth): the Hero enters and nothing else changes' },
  bali:  { card: 'Bali', faction: 'vanaras', deck: VANARA_DECK, oppFaction: 'asuras', oppDeck: ASURA_DECK, fixture: 'bali_play',
           ruling: 'VFX-LAB-7 — the third character, by the template; A1 (the board is the truth): the Hero enters and nothing else changes (Bali is engine id "hanuman"; his passive changes no card on an empty board)' },
  agni: { card: 'Agni', faction: 'devas', deck: ['Agni'].concat(DEVA_DECK.slice(0, 11)), oppFaction: 'asuras', oppDeck: ASURA_DECK, fixture: 'agni_play',
          ruling: 'VFX-LAB-9 — a launch character by the template, native exit; A1 (the board is the truth): the Hero enters and nothing else changes (his trigger waits for a Mantra)' },
  mahabali: { card: 'Mahabali', faction: 'asuras', deck: ['Mahabali'].concat(ASURA_DECK.slice(0, 11)), oppFaction: 'devas', oppDeck: DEVA_DECK, fixture: 'mahabali_play',
          ruling: 'VFX-LAB-9 — a launch character by the template, native exit; A1: the Hero enters and nothing else changes (his passive waits for a voluntary Pass)' },
  shukracharya: { card: 'Shukracharya', faction: 'asuras', deck: ['Shukracharya'].concat(ASURA_DECK.slice(0, 11)), oppFaction: 'devas', oppDeck: DEVA_DECK, fixture: 'shukracharya_play',
          ruling: 'VFX-LAB-9 — a launch character by the template, native exit; the engine id is "shukra" (the registry keys him by it, the folder and fixture stay "shukracharya"); his revive needs a fallen Unit in the discard, so on an empty board the Hero enters and nothing else changes' },
  mahishi: { card: 'Mahishi', faction: 'asuras', deck: ['Mahishi'].concat(ASURA_DECK.slice(0, 11)), oppFaction: 'devas', oppDeck: DEVA_DECK, fixture: 'mahishi_play',
          ruling: 'LAB-11 - a WAVE-1 hero, reached by NAME through the scenario deck: the draft filter hides wave cards from the random pool, but CARD_BY_NAME is built from every deck, so naming her is enough and no shim exists or is needed. A1 (the board is the truth): the Hero enters and nothing else changes (her copy fires at ROUND END, not on play)' },
  vritra: { card: 'Vritra', faction: 'asuras', deck: ['Vritra'].concat(ASURA_DECK.slice(0, 11)), oppFaction: 'devas', oppDeck: DEVA_DECK, fixture: 'vritra_play',
          ruling: 'LAB-11 - a WAVE-1 hero, reached by NAME through the scenario deck, no shim (see Mahishi). A1: the Hero enters and nothing else changes (his bind needs an enemy Unit; on an empty board it finds none)' },
  garuda: { card: 'Garuda', faction: 'devas', deck: ['Garuda'].concat(DEVA_DECK.slice(0, 11)), oppFaction: 'asuras', oppDeck: ASURA_DECK, fixture: 'garuda_play',
          ruling: 'LAB-12 - a WAVE-1 hero, reached by NAME through the scenario deck, no shim (the LAB-11 finding). A1 (the board is the truth): the Hero enters and nothing else changes - his cleanse strips Venom from friendly Units, and on an empty board there are none to strip' },
  kartikeya: { card: 'Kartikeya', faction: 'devas', deck: ['Kartikeya'].concat(DEVA_DECK.slice(0, 11)), oppFaction: 'asuras', oppDeck: ASURA_DECK, fixture: 'kartikeya_play',
          ruling: 'LAB-13 - a WAVE-1 hero, reached by NAME through the scenario deck, no shim (the LAB-11 finding). A1 (the board is the truth): the Hero enters and nothing else changes - his passive waits for an enemy Astra to resolve against his side, and nothing resolves on an empty board' },
  vasuki: { card: 'Vasuki', faction: 'nagas', deck: ['Vasuki'].concat(NAGA_DECK.slice(0, 11)), oppFaction: 'devas', oppDeck: DEVA_DECK, fixture: 'vasuki_play',
          ruling: 'LAB-14 - one of the first NAGA actors. A1 (the board is the truth): the Hero enters and nothing else changes - his ON PLAY takes a power from every enemy Unit, and an empty board has none' },
  takshaka: { card: 'Takshaka', faction: 'nagas', deck: ['Takshaka'].concat(NAGA_DECK.slice(0, 11)), oppFaction: 'devas', oppDeck: DEVA_DECK, fixture: 'takshaka_play',
          ruling: 'LAB-14 - one of the first NAGA actors. A1: the Hero enters and nothing else changes - his passive only strips enemy Hero immunity from Naga Astras, and no Astra resolves here' },
  shesha: { card: 'Shesha', faction: 'nagas', deck: ['Shesha'].concat(NAGA_DECK.slice(0, 11)), oppFaction: 'devas', oppDeck: DEVA_DECK, fixture: 'shesha_play',
          ruling: 'LAB-14 - one of the first NAGA actors. A1: the Hero enters and nothing else changes - his passive waits for a lost round and a Unit in the discard' },
  padmavati: { card: 'Padmavati', faction: 'nagas', deck: ['Padmavati'].concat(NAGA_DECK.slice(0, 11)), oppFaction: 'devas', oppDeck: DEVA_DECK, fixture: 'padmavati_play',
          ruling: 'LAB-15 - a WAVE-1 Naga hero, reached by NAME through the scenario deck, no shim (the LAB-11 finding). A1 (the board is the truth): the Hero enters and nothing else changes - her Venom lands at ROUND END, not on play' },
  kulika: { card: 'Kulika', faction: 'nagas', deck: ['Kulika'].concat(NAGA_DECK.slice(0, 11)), oppFaction: 'devas', oppDeck: DEVA_DECK, fixture: 'kulika_play',
          ruling: 'LAB-15 - a WAVE-1 Naga hero, reached by NAME through the scenario deck, no shim. A1: the Hero enters and nothing else changes - her ON PLAY transfers Venom from friendly Units to enemies, and an empty board has neither' },
  sugriva: { card: 'Sugriva', faction: 'vanaras', deck: ['Sugriva'].concat(VANARA_UNITS.slice(0, 11)), oppFaction: 'asuras', oppDeck: ASURA_DECK, fixture: 'sugriva_play',
          ruling: 'LAB-16 - the first Vanara actor since the pilot wave, and THE FIRST ON-PLAY ABILITY THAT FIRES ON AN EMPTY BOARD. A1 (the board is the truth) holds - the board difference is only the Hero entering - but his draw RUNS: the hand stays at 10 (one played, one drawn) and the deck falls 2 to 1. Neither the event stream nor the board difference shows it, so the guard rail asserts it from the counts' },
  angad: { card: 'Angad', faction: 'vanaras', deck: ['Angad'].concat(VANARA_UNITS.slice(0, 11)), oppFaction: 'asuras', oppDeck: ASURA_DECK, fixture: 'angad_play',
          ruling: 'LAB-16 - the first Vanara actor since the pilot wave. A1: the Hero enters and nothing else changes - his passive waits for the opponent to play an Astra; the hand falls 10 to 9 and the deck is untouched' },
  anjana: { card: 'Anjana', faction: 'vanaras', deck: ['Anjana'].concat(VANARA_UNITS.slice(0, 11)), oppFaction: 'asuras', oppDeck: ASURA_DECK, fixture: 'anjana_play',
          ruling: 'LAB-17 - a WAVE-1 Vanara hero, reached by NAME through the scenario deck, no shim (the LAB-11 finding). A1: the Hero enters and nothing else changes - her passive raises the Leap limit, and no Leap happens here' },
  makardhwaja: { card: 'Makardhwaja', faction: 'vanaras', deck: ['Makardhwaja'].concat(VANARA_UNITS.slice(0, 11)), oppFaction: 'asuras', oppDeck: ASURA_DECK, fixture: 'makardhwaja_play',
          ruling: 'LAB-17 - a WAVE-1 Vanara hero, reached by NAME, no shim. His ON PLAY copies the power of Bali or the strongest friendly Unit; on this empty board there is neither, so his NO-SOURCE branch runs and he enters at his printed power. It changes no state - and leaves its trace only in the log, which the guard rail asserts: the mirror of Sugriva, whose draw changed state and logged nothing' },
  rahu: { card: 'Rahu', faction: 'asuras', deck: ['Rahu'].concat(ASURA_DECK.slice(0, 11)), oppFaction: 'devas', oppDeck: DEVA_DECK, fixture: 'rahu_play',
          ruling: 'LAB-18 - the last card of the roster, a launch Asura hero. A1: the Hero enters and nothing else changes. His PASSIVE discards one random card from the OPPONENT\'s hand at the START OF EACH ROUND (endRound, after the round advances) - never on play - so on this play the opponent\'s hand stays 10 and their discard stays empty: inert by TIMING, which the guard rail asserts from the opponent\'s untouched hand and discard' },
  varuna: { card: 'Varuna', faction: 'devas', deck: ['Varuna', 'Narada', 'Chandra Dev', 'Yama', 'Marut', 'Gandharva', 'Deva Soldier', 'Kubera', 'Urvashi', 'Brihaspati', 'Vishwakarma', 'Agni'], oppFaction: 'asuras', oppDeck: ASURA_DECK, fixture: 'varuna_play',
           ruling: 'VFX-LAB-8 — the fourth character, the first native exit; A1 (the board is the truth): the Hero enters and nothing else changes (his passive limits the opponent\'s Astras; it changes no card on an empty board)' },
};
// LAB-19 · THE FIRST ASTRA FIXTURE — Vajra, the premium effects track's first clip. Not an actor (A2 stands: an Astra plays its effect,
// nothing emerges): its fixture exists so the strike clip is driven by the real engine's own beat. The Asura seat moves first and sets a
// Unit down; the Deva seat then casts Vajra ("Destroy one enemy Unit with power 6+"). With Bana Asura (printed 6, +1 from the Asura's first
// Chaos Surge) the Astra is LEGAL and the engine emits play, then destroy on Bana — the destroy beat the clip's impact lands on. With
// Vibhishana (printed 4, 5 after the surge) there is NO MARK: the Astra is not playable, and a forced cast only logs "Vajra finds no mark."
// — no destroy event, so no strike. Both are built here from one function, so the no-target case is the SAME board with a smaller Unit.
const VAJRA_DECK = ['Vajra'].concat(DEVA_DECK.slice(0, 11));
function buildVajraCast(seat, oppUnit, opts) {
  opts = opts || {};
  const opp = 1 - seat;
  for (let seed = 1; seed < 1000; seed++) {
    const E = freshEngine();
    const decks = seat === 0 ? [VAJRA_DECK, ASURA_DECK] : [ASURA_DECK, VAJRA_DECK];
    const sc = { p0Deck: decks[0], p1Deck: decks[1], p0Hand: HAND(decks[0]), p1Hand: HAND(decks[1]), mulligan: 0 };
    const o = { rng: seeded(seed), p0: '{p0}', p1: '{p1}', realm: 'mrityulok', p0Faction: seat === 0 ? 'devas' : 'asuras', p1Faction: seat === 1 ? 'devas' : 'asuras', scenario: sc };
    const g = E.newGame(o);
    if (g.turn !== opp) continue;                                               // the Asura seat moves first: its Unit is the mark
    const setup = [], uh = g.players[opp].hand.findIndex((c) => c.n === oppUnit);
    E.playCard(g, opp, uh); setup.push({ seat: opp, type: 'play', card: oppUnit, handIndex: uh });
    if (g.turn !== seat) throw new Error('after ' + oppUnit + ' the turn did not pass to the Deva seat');
    const vh = g.players[seat].hand.findIndex((c) => c.id === 'vajra'), legal = E.playableIndices(g, seat).indexOf(vh) >= 0;
    if (opts.probe) return { E, g, seat, vh, legal, seed };
    const before = snapshot(E, g), ev0 = g.events.length, log0 = g.log.length;
    E.playCard(g, seat, vh);
    const after = snapshot(E, g);
    return {
      fixture: 'vajra_play', ruling: 'LAB-19 - the premium effects track opens: an Astra fixture so the Vajra strike clip is driven by the real engine. The Asura seat sets ' + oppUnit + ' down (the first Chaos Surge adds 1); the Deva seat casts Vajra, which is LEGAL (a mark of power 6 or more) - the engine emits play, then destroy on the mark: the destroy beat the clip impact lands on. A2 stands: nothing emerges; the Astra plays its effect',
      engine: { file: 'src/engine.js', sha256: engineSha() },
      seed, attackerSeat: seat, defenderSeat: opp, realm: 'mrityulok',
      scenario: { p0: o.p0, p1: o.p1, p0Faction: o.p0Faction, p1Faction: o.p1Faction, p0Deck: decks[0], p1Deck: decks[1], mulligan: 0 },
      setup, action: { seat, type: 'play', card: 'Vajra', handIndex: vh, targetUid: null, legal },
      before, events: g.events.slice(ev0), log: g.log.slice(log0).map((l) => l.msg), after,
      diff: boardDiff(before, after),
    };
  }
  throw new Error('no seed in 1..999 gave the Asura seat the first move');
}
const buildVajra = (seat) => buildVajraCast(seat, 'Bana Asura');
// LAB-20 · THE FIRST CHAIN'S FIXTURE — Sudarshana Chakra (Mythic). It is a REMOVAL, not a kill: "Remove one enemy Hero for this round. It
// returns next round at half power." The Asura seat moves first and sets a Hero down (Mahabali); the Deva seat casts Sudarshana, which is
// LEGAL (an enemy Hero is on the board), and the engine emits play then passive "Sudarshana" "removed" — the Hero leaves its row for the
// round and does NOT go to the discard. With a Unit instead (Vibhishana — inert to Astras, unlike Bana Asura, whose arms multiply on any
// Astra) there is NO HERO: the Astra is not playable, and a forced cast only logs "Sudarshana finds no Hero." The snapshot format is untouched.
const SUD_DECK = ['Sudarshana Chakra'].concat(DEVA_DECK.slice(0, 11)), SUD_OPP_DECK = ['Mahabali'].concat(ASURA_DECK.slice(0, 11));
function buildSudarshanaCast(seat, oppFirst, opts) {
  opts = opts || {};
  const opp = 1 - seat;
  for (let seed = 1; seed < 1000; seed++) {
    const E = freshEngine();
    const decks = seat === 0 ? [SUD_DECK, SUD_OPP_DECK] : [SUD_OPP_DECK, SUD_DECK];
    const sc = { p0Deck: decks[0], p1Deck: decks[1], p0Hand: HAND(decks[0]), p1Hand: HAND(decks[1]), mulligan: 0 };
    const o = { rng: seeded(seed), p0: '{p0}', p1: '{p1}', realm: 'mrityulok', p0Faction: seat === 0 ? 'devas' : 'asuras', p1Faction: seat === 1 ? 'devas' : 'asuras', scenario: sc };
    const g = E.newGame(o);
    if (g.turn !== opp) continue;                                               // the Asura seat moves first
    const setup = [], uh = g.players[opp].hand.findIndex((c) => c.n === oppFirst);
    E.playCard(g, opp, uh); setup.push({ seat: opp, type: 'play', card: oppFirst, handIndex: uh });
    if (g.turn !== seat) throw new Error('after ' + oppFirst + ' the turn did not pass to the Deva seat');
    const sh = g.players[seat].hand.findIndex((c) => c.id === 'sudarshana'), legal = E.playableIndices(g, seat).indexOf(sh) >= 0;
    if (opts.probe) return { E, g, seat, sh, legal, seed };
    const before = snapshot(E, g), ev0 = g.events.length, log0 = g.log.length;
    E.playCard(g, seat, sh);
    const after = snapshot(E, g);
    return {
      fixture: 'sudarshana_play', ruling: 'LAB-20 - the first chained effect: a real-engine Sudarshana Chakra cast so the invocation and strike clips are driven by the engine. The Asura seat sets ' + oppFirst + ' (a Hero) down; the Deva seat casts Sudarshana, which is LEGAL - the engine emits play, then passive Sudarshana removed on the Hero: a REMOVAL for the round, not a kill (the Hero leaves its row and does not reach the discard). A2 stands: nothing emerges; the Astra plays its effect',
      engine: { file: 'src/engine.js', sha256: engineSha() },
      seed, attackerSeat: seat, defenderSeat: opp, realm: 'mrityulok',
      scenario: { p0: o.p0, p1: o.p1, p0Faction: o.p0Faction, p1Faction: o.p1Faction, p0Deck: decks[0], p1Deck: decks[1], mulligan: 0 },
      setup, action: { seat, type: 'play', card: 'Sudarshana Chakra', handIndex: sh, targetUid: null, legal },
      before, events: g.events.slice(ev0), log: g.log.slice(log0).map((l) => l.msg), after,
      diff: boardDiff(before, after),
    };
  }
  throw new Error('no seed in 1..999 gave the Asura seat the first move');
}
const buildSudarshana = (seat) => buildSudarshanaCast(seat, 'Mahabali');
const forEntry = (key) => (seat) => buildHeroEntry(HERO_ENTRIES[key], seat);   // LAB-9: one builder per registry entry
const buildIndra = forEntry('indra'), buildBali = forEntry('bali'), buildVaruna = forEntry('varuna');

// LAB-21 · THE MYTHIC SHELF'S FIXTURES — the HIRANYAKASHIPU MIRROR PAIR. One unit, one board truth, two opposite answers, both read
// straight out of isAstraImmune (engine ~669): `unit.id==='hiranya' && ASTRA_KILL.has(cause) && cause!=='Brahmastra'`. So Brahmastra
// DESTROYS him — the by-name exception — and Pashupatastra CANNOT: its damage takes him to 0 or less and the immunity floors him at 1
// with a `block` event. Both fixtures put him on the enemy board and let the real engine settle it.
//
// Brahmastra (DESTROY class, not dmgAstra): the Asura seat sets three Units down (Hiranyakashipu among them) while the Deva seat builds
// its OWN two, then Brahmastra destroys ALL THREE enemy Units and leaves both Deva Units standing. There is no astraProtected filter on
// either its legality gate or its resolution — it iterates opp.units directly — which is how "overrides all shields" is true in code.
const BRAHMA_DECK = ['Brahmastra'].concat(DEVA_DECK.slice(0, 11));
const BRAHMA_OPP_DECK = ['Hiranyakashipu', 'Ravana', 'Vibhishana'].concat(ASURA_DECK.filter((n) => n !== 'Hiranyakashipu' && n !== 'Ravana' && n !== 'Vibhishana').slice(0, 9));
function buildBrahmastraCast(seat, opts) {
  opts = opts || {};
  const opp = 1 - seat;
  const oppPlays = opts.oppPlays || ['Hiranyakashipu', 'Ravana', 'Vibhishana'], myPlays = opts.myPlays || ['Yama', 'Marut'];
  for (let seed = 1; seed < 2000; seed++) {
    const E = freshEngine();
    const decks = seat === 0 ? [BRAHMA_DECK, BRAHMA_OPP_DECK] : [BRAHMA_OPP_DECK, BRAHMA_DECK];
    const sc = { p0Deck: decks[0], p1Deck: decks[1], p0Hand: HAND(decks[0]), p1Hand: HAND(decks[1]), mulligan: 0 };
    const o = { rng: seeded(seed), p0: '{p0}', p1: '{p1}', realm: 'mrityulok', p0Faction: seat === 0 ? 'devas' : 'asuras', p1Faction: seat === 1 ? 'devas' : 'asuras', scenario: sc };
    const g = E.newGame(o);
    // with no setup at all (the no-target negative) the CASTER must be the one on turn, facing an empty row; otherwise the mark lays first
    if (g.turn !== (oppPlays.length === 0 && myPlays.length === 0 ? seat : opp)) continue;
    const setup = [];
    const lay = (who, name) => { const h = g.players[who].hand.findIndex((c) => c.n === name); if (h < 0) return false;
      if (g.turn !== who) return false; E.playCard(g, who, h); setup.push({ seat: who, type: 'play', card: name, handIndex: h }); return true; };
    let ok = true;
    for (let i = 0; i < oppPlays.length && ok; i++) { ok = lay(opp, oppPlays[i]); if (ok && i < myPlays.length) ok = lay(seat, myPlays[i]); }
    if (!ok || g.turn !== seat) continue;
    const bh = g.players[seat].hand.findIndex((c) => c.id === 'brahmastra'), legal = E.playableIndices(g, seat).indexOf(bh) >= 0;
    const foes = g.players[opp].units.filter((u) => !u.ghost).length, mine = g.players[seat].units.filter((u) => !u.ghost).length;
    if (opts.probe) return { E, g, seat, bh, legal, seed, foes, mine };          // the probe returns BEFORE the legality gate — the no-target negative needs the illegal board
    if (!legal) continue;
    if (foes < 3 || mine < 2) continue;                                          // "ALL enemy Units" needs a row to wipe; our own two prove the caster is untouched
    const before = snapshot(E, g), ev0 = g.events.length, log0 = g.log.length;
    E.playCard(g, seat, bh);
    const after = snapshot(E, g);
    return {
      fixture: 'brahmastra_play',
      ruling: 'LAB-21 - the Mythic shelf closes (1 of 2). The DESTROY half of the Hiranyakashipu mirror pair. The Asura seat lays ' + foes + ' Units down, Hiranyakashipu among them, while the Deva seat builds its own ' + mine + '; the Deva seat then casts Brahmastra, which is LEGAL (an enemy Unit is on the board) and destroys ALL ' + foes + ' - Hiranyakashipu included, because isAstraImmune excepts Brahmastra BY NAME - while both Deva Units stand untouched. The engine emits play, then one destroy per enemy Unit: the first destroy is the cue the clip impact lands on. Neither the legality gate nor the resolution consults astraProtected, which is how "overrides all shields and immunities" is true in code',
      engine: { file: 'src/engine.js', sha256: engineSha() },
      seed, attackerSeat: seat, defenderSeat: opp, realm: 'mrityulok',
      scenario: { p0: o.p0, p1: o.p1, p0Faction: o.p0Faction, p1Faction: o.p1Faction, p0Deck: decks[0], p1Deck: decks[1], mulligan: 0 },
      setup, action: { seat, type: 'play', card: 'Brahmastra', handIndex: bh, targetUid: null, legal },
      before, events: g.events.slice(ev0), log: g.log.slice(log0).map((l) => l.msg), after,
      diff: boardDiff(before, after),
    };
  }
  throw new Error('no seed in 1..1999 produced the Brahmastra board');
}
const buildBrahmastra = (seat) => buildBrahmastraCast(seat);

// Pashupatastra (DAMAGE class, dmgAstra:true): an ASURA MIRROR, the only board on which Hiranyakashipu can stand opposite an Asura caster.
// per = max(1, floor(your total board power / enemy Units)) - so the caster needs enough board that per reaches 7 and the immunity branch
// actually fires. Mahabali (hero 8) + Kumbhakarna (8) against two foes gives per 8: Vibhishana DIES, Hiranyakashipu FLOORS AT 1 with a
// block event. The opponent's third play is Chandrahas, an ARTIFACT, so the enemy Unit count stays 2 (its own Chaos Surge is left to happen).
const PASHU_DECK = ['Pashupatastra', 'Mahabali', 'Kumbhakarna'].concat(ASURA_DECK.filter((n) => n !== 'Kumbhakarna').slice(0, 9));
const PASHU_OPP_DECK = ['Hiranyakashipu', 'Vibhishana', 'Chandrahas'].concat(ASURA_DECK.filter((n) => n !== 'Hiranyakashipu' && n !== 'Vibhishana').slice(0, 9));
function buildPashupataCast(seat, opts) {
  opts = opts || {};
  const opp = 1 - seat;
  const oppPlays = opts.oppPlays || ['Hiranyakashipu', 'Vibhishana', 'Chandrahas'], myPlays = opts.myPlays || ['Mahabali', 'Kumbhakarna'];
  for (let seed = 1; seed < 2000; seed++) {
    const E = freshEngine();
    const decks = seat === 0 ? [PASHU_DECK, PASHU_OPP_DECK] : [PASHU_OPP_DECK, PASHU_DECK];
    const sc = { p0Deck: decks[0], p1Deck: decks[1], p0Hand: HAND(decks[0]), p1Hand: HAND(decks[1]), mulligan: 0 };
    const o = { rng: seeded(seed), p0: '{p0}', p1: '{p1}', realm: 'mrityulok', p0Faction: 'asuras', p1Faction: 'asuras', scenario: sc };
    const g = E.newGame(o);
    if (g.turn !== (oppPlays.length === 0 && myPlays.length === 0 ? seat : opp)) continue;   // the no-target negative needs the caster on turn against an empty row
    const setup = [];
    const lay = (who, name) => { const h = g.players[who].hand.findIndex((c) => c.n === name); if (h < 0) return false;
      if (g.turn !== who) return false; E.playCard(g, who, h); setup.push({ seat: who, type: 'play', card: name, handIndex: h }); return true; };
    let ok = true;
    for (let i = 0; i < oppPlays.length && ok; i++) { ok = lay(opp, oppPlays[i]); if (ok && i < myPlays.length) ok = lay(seat, myPlays[i]); }
    if (!ok || g.turn !== seat) continue;
    const ph = g.players[seat].hand.findIndex((c) => c.id === 'pashupata'), legal = E.playableIndices(g, seat).indexOf(ph) >= 0;
    const foes = g.players[opp].units.filter((u) => !u.ghost);
    const total = E.totalPower(g, seat), per = foes.length ? Math.max(1, Math.floor(total / foes.length)) : 0;
    const hir = foes.find((u) => u.id === 'hiranya');
    if (opts.probe) return { E, g, seat, ph, legal, seed, foes: foes.length, total, per, hir };   // the probe returns BEFORE the legality gate — the no-target negative needs the illegal board
    if (!legal) continue;
    if (foes.length < 2 || !hir || per < hir.power) continue;                   // the immunity branch only fires when the split reaches him
    const before = snapshot(E, g), ev0 = g.events.length, log0 = g.log.length;
    E.playCard(g, seat, ph);
    const after = snapshot(E, g);
    return {
      fixture: 'pashupata_play',
      ruling: 'LAB-21 - the Mythic shelf closes (2 of 2), and the first premium effect off the Deva shelf. The DAMAGE half of the Hiranyakashipu mirror pair, on an ASURA MIRROR - the only board where he can stand opposite an Asura caster. The caster holds ' + total + ' board power against ' + foes.length + ' enemy Units, so the engine splits it evenly: ' + per + ' each, at least 1. Hiranyakashipu (power ' + hir.power + ') is taken to 0 or less and SURVIVES, floored at 1 with a block event, because isAstraImmune covers every ASTRA_KILL cause except Brahmastra by name; the other Unit simply dies. Chaos Surge fires for the Asura caster on the same action. The engine emits play, then one damage per enemy Unit: the first damage is the cue the clip impact lands on. Patala would deepen each hit by 1 (dmgAstra:true); Mrityulok is pinned here',
      engine: { file: 'src/engine.js', sha256: engineSha() },
      seed, attackerSeat: seat, defenderSeat: opp, realm: 'mrityulok',
      scenario: { p0: o.p0, p1: o.p1, p0Faction: o.p0Faction, p1Faction: o.p1Faction, p0Deck: decks[0], p1Deck: decks[1], mulligan: 0 },
      setup, action: { seat, type: 'play', card: 'Pashupatastra', handIndex: ph, targetUid: null, legal },
      split: { casterTotalPower: total, enemyUnits: foes.length, perUnit: per },
      before, events: g.events.slice(ev0), log: g.log.slice(log0).map((l) => l.msg), after,
      diff: boardDiff(before, after),
    };
  }
  throw new Error('no seed in 1..1999 produced the Pashupatastra board');
}
const buildPashupata = (seat) => buildPashupataCast(seat);

module.exports = { build, buildIndra, buildBali, buildVaruna, forEntry, buildHeroEntry, HERO_ENTRIES, snapshot, ASURA_DECK, DEVA_DECK, VANARA_DECK, buildVajra, buildVajraCast, VAJRA_DECK, buildSudarshana, buildSudarshanaCast, SUD_DECK, SUD_OPP_DECK, buildBrahmastra, buildBrahmastraCast, BRAHMA_DECK, BRAHMA_OPP_DECK, buildPashupata, buildPashupataCast, PASHU_DECK, PASHU_OPP_DECK };

if (require.main === module) {
  for (const [name, make] of [['meghnad', build]].concat(Object.keys(HERO_ENTRIES).map((k) => [HERO_ENTRIES[k].fixture.replace('_play', ''), forEntry(k)]), [['vajra', buildVajra], ['sudarshana', buildSudarshana], ['brahmastra', buildBrahmastra], ['pashupata', buildPashupata]])) for (const seat of [0, 1]) {
    const f = make(seat), out = path.join(__dirname, name + '_seat' + seat + '.json');
    fs.writeFileSync(out, JSON.stringify(f, null, 2) + '\n');
    console.log('wrote ' + path.relative(GAME, out) + ' — seed ' + f.seed + ', ' + f.events.length + ' events (' + f.events.map((e) => e.type).join(', ') + '), changed: ' +
      f.diff.changed.map((c) => c.n + ' ' + (c.eff ? c.eff.from + '→' + c.eff.to : '')).join('; ') + ' · entered: ' + f.diff.entered.map((c) => c.n + ' ' + c.eff).join('; '));
  }
}
