/* ARCADE-1 · THE AI (R2). Beginner / Advanced / Death Match.
   THE HONEST-AI RULE: the AI decides only from observe(fight, side) — what is on screen: positions, facing, health, meter,
   each fighter's state and current move frame (its visible animation), the projectiles and the clock. It never sees the
   opponent's input, its buffered presses, or the fight object itself. It sees the opponent through a REACTION DELAY: the
   opponent part of the picture is the one from `reaction` frames ago (its own part is current — it knows its own body).
   It answers with the same input bitmask a player makes, through the same buffer. Death Match is a sharper player, not a
   stronger fighter: no extra health, damage or meter.
   All randomness comes from the seeded rng passed in (core/rng.js). UMD: window.ARC_AI, Node require. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./moves.js"), require("./fight.js"));
  else root.ARC_AI = factory(root.ARC_MOVES, root.ARC_FIGHT);
})(this, function (M, F) {
  "use strict";
  var B = F.BTN;

  // reaction in frames (300 / 183 / 133 ms at 60 Hz); block = chance to guard a seen attack; the rest shape the play
  var LEVELS = {
    beginner:   { reaction: 18, block: 0.40, duck: 0.10, jumpProj: 0.25, cancel: 0.15, special: 0.5, attackGap: [16, 40], noise: 0.20, spacing: 0.5 },
    advanced:   { reaction: 11, block: 0.60, duck: 0.25, jumpProj: 0.5, cancel: 0.6, special: 0.8, attackGap: [12, 30], noise: 0.06, spacing: 0.8 },
    deathmatch: { reaction: 9,  block: 0.68, duck: 0.35, jumpProj: 0.65, cancel: 0.8, special: 0.9, attackGap: [10, 26], noise: 0.0, spacing: 0.9 }
  };

  // what a player could see on screen — and nothing else
  var PUBLIC = ["x", "y", "facing", "hp", "hpMax", "meter", "state", "move", "mf", "arch"];
  function observe(g, side) {
    function pub(f) { var o = {}; PUBLIC.forEach(function (k) { o[k] = f[k]; }); return o; }
    return { frame: g.frame, timer: g.timer, me: pub(g.f[side]), opp: pub(g.f[1 - side]),
      myConnected: g.f[side].connected,   // its OWN move's contact: it felt the hit land
      proj: g.proj.map(function (p) { return { x: p.x, dir: p.dir, mine: p.owner === side }; }) };
  }

  function createAI(level, rng) {
    var L = typeof level === "object" ? level : LEVELS[level]; if (!L) throw new Error("unknown AI level " + level);   // an object = explicit params (tests)
    return { level: typeof level === "object" ? "custom" : level, L: L, rng: rng, hist: [], guardFor: null, guardChoice: "none", jumpedFor: null, projChoice: "none", nextAttack: 0, lastPress: 0 };
  }

  function seen(ai, obs) {
    ai.hist.push({ opp: obs.opp, proj: obs.proj, frame: obs.frame });
    if (ai.hist.length > ai.L.reaction + 1) ai.hist.shift();
    var old = ai.hist[0];
    return { me: obs.me, myConnected: obs.myConnected, opp: old.opp, proj: old.proj, oppFrame: old.frame, frame: obs.frame };
  }
  function range(ai, lo, hi) { return lo + Math.floor(ai.rng() * (hi - lo + 1)); }

  // one decision per logic frame → an input bitmask
  function decide(ai, obs) {
    var L = ai.L, v = seen(ai, obs), me = v.me, op = v.opp, U = F.U;
    var dx = (op.x - me.x) / U, dist = Math.abs(dx);
    var fwd = dx >= 0 ? B.R : B.L, back = dx >= 0 ? B.L : B.R;
    var bits = 0;
    function press(b) { if (!(ai.lastPress & b)) bits |= b; }   // a press is an edge: release first if it was held

    if (me.state === "ko" || me.state === "win") return finish(ai, 0);

    // in our own attack: cancel on contact if the level knows how
    if (me.state === "attack") {
      var m = M.MOVES[me.move];
      if (v.myConnected && me.mf >= m.startup && ai.rng() < L.cancel) {
        if (me.move !== "special" && me.meter >= M.MOVES.special.cost && ai.rng() < L.special) press(B.SP);
        else if (me.move === "light") press(B.HV);
      }
      return finish(ai, bits);
    }
    if (me.state === "hitstun" || me.state === "jump") return finish(ai, 0);

    // a seen threat: the opponent's attack in startup/active and in reach → guard (decided once per attack)
    var threat = op.state === "attack" && op.move && op.mf < M.MOVES[op.move].startup + M.MOVES[op.move].active;
    var reach = threat ? (op.move === "special" && M.ARCH[op.arch].special === "rush" ? 260 : M.MOVES[op.move].box.x1 + M.BODY.halfW + 20) : 0;
    if (threat && dist <= reach) {
      var id = op.move + "@" + (v.oppFrame - op.mf);
      if (ai.guardFor !== id) {
        ai.guardFor = id;
        var r = ai.rng();
        ai.guardChoice = r < L.block ? (op.move === "heavy" && ai.rng() < L.duck ? "duck" : "guard") : "none";
      }
      if (ai.guardChoice === "guard") return finish(ai, back);
      if (ai.guardChoice === "duck") return finish(ai, B.D);
    }
    if (me.state === "blockstun") return finish(ai, back);

    // an incoming projectile: jump it or guard it
    var incoming = v.proj.filter(function (p) { return !p.mine && ((p.dir === 1 && p.x < me.x) || (p.dir === -1 && p.x > me.x)) && Math.abs(p.x - me.x) / U < 220; });
    if (incoming.length) {
      var pid = "p@" + incoming[0].dir + ":" + Math.round(incoming[0].x / U / 50);
      if (ai.jumpedFor !== pid) { ai.jumpedFor = pid; ai.projChoice = ai.rng() < L.jumpProj ? "jump" : ai.rng() < L.block ? "guard" : "none"; }
      if (ai.projChoice === "jump" && Math.abs(incoming[0].x - me.x) / U < 130) return finish(ai, B.U | fwd);
      if (ai.projChoice === "guard") return finish(ai, back);
    }

    // noise: a beginner sometimes just does something
    if (ai.rng() < L.noise * 0.1) { var opts = [0, B.L, B.R, B.U, B.D]; return finish(ai, opts[Math.floor(ai.rng() * opts.length)]); }

    // neutral game
    var arch = M.ARCH[me.arch];
    var canSpecial = me.meter >= M.MOVES.special.cost && v.frame >= ai.nextAttack;
    if (canSpecial && arch.special === "projectile" && dist > 220 && ai.rng() < L.special * 0.05) { ai.nextAttack = v.frame + range(ai, L.attackGap[0], L.attackGap[1]); press(B.SP); return finish(ai, bits); }
    var want = arch.special === "projectile" && ai.rng() < L.spacing ? 90 : 75;
    if (dist > want + 25) return finish(ai, fwd);
    if (v.frame >= ai.nextAttack) {
      ai.nextAttack = v.frame + range(ai, L.attackGap[0], L.attackGap[1]);
      if (canSpecial && arch.special === "rush" && ai.rng() < L.special * 0.4) press(B.SP);
      else if (dist <= 100 && ai.rng() < 0.4) press(B.HV);
      else press(B.LT);
      return finish(ai, bits);
    }
    if (dist < 55 && ai.rng() < L.spacing * 0.3) return finish(ai, back);
    return finish(ai, ai.rng() < 0.5 ? 0 : (ai.rng() < L.spacing ? back : fwd));
  }
  function finish(ai, bits) { ai.lastPress = bits; return bits; }

  return { LEVELS: LEVELS, PUBLIC: PUBLIC, observe: observe, createAI: createAI, decide: decide };
});
