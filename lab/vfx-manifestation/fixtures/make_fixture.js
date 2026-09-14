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
};
const buildIndra = (seat) => buildHeroEntry(HERO_ENTRIES.indra, seat), buildBali = (seat) => buildHeroEntry(HERO_ENTRIES.bali, seat);

module.exports = { build, buildIndra, buildBali, buildHeroEntry, HERO_ENTRIES, snapshot, ASURA_DECK, DEVA_DECK, VANARA_DECK };

if (require.main === module) {
  for (const [name, make] of [['meghnad', build], ['indra', buildIndra], ['bali', buildBali]]) for (const seat of [0, 1]) {
    const f = make(seat), out = path.join(__dirname, name + '_seat' + seat + '.json');
    fs.writeFileSync(out, JSON.stringify(f, null, 2) + '\n');
    console.log('wrote ' + path.relative(GAME, out) + ' — seed ' + f.seed + ', ' + f.events.length + ' events (' + f.events.map((e) => e.type).join(', ') + '), changed: ' +
      f.diff.changed.map((c) => c.n + ' ' + (c.eff ? c.eff.from + '→' + c.eff.to : '')).join('; ') + ' · entered: ' + f.diff.entered.map((c) => c.n + ' ' + c.eff).join('; '));
  }
}
