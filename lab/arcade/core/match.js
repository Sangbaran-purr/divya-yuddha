/* ARCADE-1 · THE ROUNDS STUB (ruling 4): each side brings an ORDERED lineup of 3 Heroes; round n is each side's n-th Hero;
   first to 2 rounds wins. A drawn round (a double KO, or equal health at time-out) is fought again with the same two
   Heroes — at most DRAW_REPLAYS times, then it goes to the side with more health left (side 0 on a perfect tie).
   Recovery and coins are R6; this stub records which Heroes fought, which is what recovery will read.
   UMD: window.ARC_MATCH (needs ARC_MOVES, ARC_FIGHT), Node require. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./moves.js"), require("./fight.js"));
  else root.ARC_MATCH = factory(root.ARC_MOVES, root.ARC_FIGHT);
})(this, function (M, F) {
  "use strict";
  var WINS = 2, ROUNDS = 3, DRAW_REPLAYS = 2;

  function checkLineup(l) {
    if (!Array.isArray(l) || l.length !== ROUNDS) throw new Error("a lineup is exactly " + ROUNDS + " Heroes");
    if (new Set(l).size !== ROUNDS && !repeatOk) throw new Error("a lineup has no repeats");
    l.forEach(function (id) { if (!M.HEROES[id]) throw new Error("unknown hero " + id); });
  }

  var repeatOk = false;
  function createMatch(opts) {
    repeatOk = !!opts.repeat;   // the lab's ?aivs=1 recording: the same two real Heroes every round (a lab convenience; play keeps the rule)
    checkLineup(opts.lineup0); checkLineup(opts.lineup1); repeatOk = false;
    var m = { lineups: [opts.lineup0.slice(), opts.lineup1.slice()], seconds: opts.seconds || M.ROUND_SECONDS,
      round: 0, wins: [0, 0], replays: 0, rounds: [], fought: [[], []], over: false, winner: null, fight: null };
    startRound(m);
    return m;
  }
  function startRound(m) {
    var p0 = m.lineups[0][m.round], p1 = m.lineups[1][m.round];
    m.fight = F.newFight({ p0: p0, p1: p1, seconds: m.seconds });
    [p0, p1].forEach(function (id, s) { if (m.fought[s].indexOf(id) < 0) m.fought[s].push(id); });
  }

  // steps the current round; when it ends, scores it. The caller starts the next round (after its banner) with nextRound().
  function step(m, inputs) {
    if (m.over || !m.fight || m.fight.over) return m;
    F.step(m.fight, inputs);
    if (!m.fight.over) return m;
    var g = m.fight, w = g.winner;
    if (w === null) {
      if (m.replays < DRAW_REPLAYS) { m.rounds.push({ round: m.round, winner: null, reason: g.reason, replay: true }); m.replays++; m.pending = "replay"; return m; }
      w = g.f[0].hp * g.f[1].hpMax >= g.f[1].hp * g.f[0].hpMax ? 0 : 1;
    }
    m.wins[w]++; m.replays = 0;
    m.rounds.push({ round: m.round, winner: w, reason: g.reason, heroes: [g.f[0].hero, g.f[1].hero], hp: [g.f[0].hp, g.f[1].hp] });
    if (m.wins[w] >= WINS) { m.over = true; m.winner = w; m.pending = null; }
    else m.pending = "next";
    return m;
  }
  function nextRound(m) {
    if (m.over || !m.pending) return m;
    if (m.pending === "next") m.round++;
    m.pending = null;
    startRound(m);
    return m;
  }
  return { WINS: WINS, ROUNDS: ROUNDS, DRAW_REPLAYS: DRAW_REPLAYS, createMatch: createMatch, step: step, nextRound: nextRound };
});
