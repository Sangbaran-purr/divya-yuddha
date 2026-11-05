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

  // reaction in frames (450 / 183 / 150 ms at 60 Hz); block = chance to guard a seen attack; the rest shape the play.
  // parry = chance a guard is a timed parry instead; throw = chance to throw when close at attack time (×0.35 unless the
  // opponent is visibly blocking); tech = chance to break a throw it has SEEN start; specialFrom = the first round (0-based)
  // it may use its special. THE GENTLER BEGINNER (owner ruling 6, 2026-11-04): reacts in 450 ms, blocks 10%, never chains or
  // cancels, pauses 0.4–0.8 s between attacks, no special in round 1, and never parries, throws or techs (ruling 5).
  // CLOSING IN WHEN OUT-RANGED (owner ruling 2, 2026-11-05; Advanced and Death Match only — the Beginner stays simple): when the
  // opponent's effective reach (its light, from the art) is longer than ours, the AI does not wait outside it. It walks in, guarding
  // what it sees coming at `guard` (instead of `block`), sometimes jumps in over the poke (`jumpIn`, per frame inside the opponent's
  // reach), and steps in to punish a whiff during the opponent's recovery (`punish`, decided once per whiff). No damage number changes.
  var LEVELS = {
    beginner:   { reaction: 27, block: 0.10, duck: 0.05, jumpProj: 0.15, cancel: 0, special: 0.5, attackGap: [24, 48], noise: 0.20, spacing: 0.5, parry: 0, throw: 0, tech: 0, specialFrom: 1 },
    advanced:   { reaction: 11, block: 0.60, duck: 0.25, jumpProj: 0.5, cancel: 0.6, special: 0.8, attackGap: [12, 30], noise: 0.06, spacing: 0.8, parry: 0.15, throw: 0.30, tech: 0.4, specialFrom: 0,
                  closeIn: { guard: 0.85, jumpIn: 0.02, punish: 0.8 } },
    deathmatch: { reaction: 9,  block: 0.68, duck: 0.35, jumpProj: 0.65, cancel: 0.8, special: 0.9, attackGap: [10, 26], noise: 0.0, spacing: 0.9, parry: 0.30, throw: 0.45, tech: 0.7, specialFrom: 0,
                  closeIn: { guard: 0.9, jumpIn: 0.03, punish: 0.95 } }
  };

  // what a player could see on screen — and nothing else
  var PUBLIC = ["x", "y", "facing", "hp", "hpMax", "meter", "state", "move", "mf", "arch", "hero"];   // the Hero is on screen too
  function observe(g, side) {
    function pub(f) { var o = {}; PUBLIC.forEach(function (k) { o[k] = f[k]; }); return o; }
    return { frame: g.frame, timer: g.timer, me: pub(g.f[side]), opp: pub(g.f[1 - side]),
      myConnected: g.f[side].connected,   // its OWN move's contact: it felt the hit land
      proj: g.proj.map(function (p) { return { x: p.x, dir: p.dir, mine: p.owner === side }; }) };
  }

  // opts.round: the round being fought (0-based) — on screen, so the AI may know it
  function createAI(level, rng, opts) {
    var L = typeof level === "object" ? level : LEVELS[level]; if (!L) throw new Error("unknown AI level " + level);   // an object = explicit params (tests)
    return { level: typeof level === "object" ? "custom" : level, L: L, rng: rng, round: (opts && opts.round) | 0, hist: [], guardFor: null, guardChoice: "none",
      parryAt: null, jumpedFor: null, projChoice: "none", techFor: null, techChoice: false, nextAttack: 0, lastPress: 0 };
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
    // grabbed: break the throw only if it has SEEN the throw begin (the reaction delay makes this tight), decided once per throw
    if (me.state === "grabbed") {
      var seenThrow = (op.state === "attack" && op.move === "throw") || op.state === "grab";
      if (seenThrow) { var tid = "t@" + (v.oppFrame - (op.state === "grab" ? 0 : op.mf)); if (ai.techFor === null) { ai.techFor = tid; ai.techChoice = ai.rng() < (L.tech || 0); } if (ai.techChoice) press(B.LT | B.HV); }
      return finish(ai, bits);
    }
    ai.techFor = null;
    if (me.state === "parry") { ai.nextAttack = 0; return finish(ai, 0); }   // a parry: punish as soon as it is free

    // in our own attack: cancel on contact if the level knows how
    if (me.state === "attack") {
      var m = M.MOVES[me.move];
      if (v.myConnected && me.mf >= m.startup && ai.rng() < L.cancel) {
        if (me.move !== "special" && me.meter >= M.MOVES.special.cost && ai.rng() < L.special) press(B.SP);
        else if (me.move === "light") press(B.HV);
      }
      return finish(ai, bits);
    }
    if (me.state === "hitstun" || me.state === "jump" || me.state === "knockdown" || me.state === "getup" || me.state === "parried" ||
      me.state === "grab" || me.state === "throwrec" || me.state === "tech" || me.state === "bound") return finish(ai, 0);

    // a seen threat: the opponent's attack in startup/active and in reach → guard (decided once per attack)
    var threat = op.state === "attack" && op.move && op.move !== "throw" && op.move !== "counter" && op.mf < M.MOVES[op.move].startup + M.MOVES[op.move].active;
    var reach = threat ? (op.move === "special" && M.ARCH[op.arch].special === "rush" ? 260 : F.moveOf({ hero: op.hero, arch: op.arch }, op.move).box.x1 + M.BODY.halfW + 20) : 0;
    if (threat && dist <= reach) {
      var id = op.move + "@" + (v.oppFrame - op.mf);
      if (ai.guardFor !== id) {
        ai.guardFor = id;
        var r = ai.rng(), blockP = L.closeIn && outRanged(me, op) ? L.closeIn.guard : L.block;   // walking in under a longer reach: guard more
        ai.guardChoice = r < blockP ? (op.move === "heavy" && ai.rng() < L.duck ? "duck" : "guard") : "none";
        // a parry: the guard plus a Block tap timed from the move's known startup — only possible if there is still time
        var impact = v.oppFrame - op.mf + M.MOVES[op.move].startup;
        ai.parryAt = ai.guardChoice === "guard" && (L.parry || 0) > 0 && ai.rng() < L.parry && v.frame <= impact - 3 ? impact - 3 : null;
      }
      if (ai.guardChoice === "guard") { if (ai.parryAt !== null && v.frame >= ai.parryAt) { press(B.BL); ai.parryAt = null; } return finish(ai, back | bits); }
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
    var canSpecial = me.meter >= M.MOVES.special.cost && v.frame >= ai.nextAttack && ai.round >= (L.specialFrom || 0);
    var shot = F.isShot(arch);
    if (canSpecial && shot && dist > 220 && ai.rng() < L.special * 0.05) { ai.nextAttack = v.frame + range(ai, L.attackGap[0], L.attackGap[1]); press(B.SP); return finish(ai, bits); }
    // OUT-RANGED (ruling 2): punish a whiff by stepping in during its recovery; inside the opponent's reach keep coming (or jump in)
    var CI = L.closeIn, myLightR = F.moveOf({ hero: me.hero, arch: me.arch }, "light").box.x1;
    if (CI && outRanged(me, op)) {
      var opM = op.state === "attack" && op.move && M.MOVES[op.move] ? F.moveOf({ hero: op.hero, arch: op.arch }, op.move) : null;
      if (opM && op.move !== "counter" && op.mf >= opM.startup + opM.active) {   // it whiffed (or is recovering): the window is open
        var wid = "w:" + op.move + "@" + (v.oppFrame - op.mf);
        if (ai.punishFor !== wid) {
          // only a window it can still use: the opponent's recovery left NOW (what it saw is `reaction` frames old) against the frames
          // needed to walk into reach and land a light
          var H = M.HEROES[me.hero], wk = H && H.walk ? H.walk.walkF : H && H.fighter ? M.REAL_WALK.walkF : M.ARCH[me.arch].walkF;
          var left = opM.startup + opM.active + opM.recovery - op.mf - L.reaction, need = Math.max(0, dist - myLightR - M.BODY.halfW) / wk + M.MOVES.light.startup;
          ai.punishFor = wid; ai.punishGo = need <= left && ai.rng() < CI.punish;
        }
        if (ai.punishGo) {
          if (dist <= myLightR + M.BODY.halfW) { ai.nextAttack = v.frame + range(ai, L.attackGap[0], L.attackGap[1]); press(dist <= heavyReach(me) ? B.HV : B.LT); return finish(ai, bits); }
          return finish(ai, fwd);
        }
      }
      var oppR = F.moveOf({ hero: op.hero, arch: op.arch }, "light").box.x1 + M.BODY.halfW;
      if (dist > myLightR + M.BODY.halfW && dist <= oppR + 60) {   // inside its reach, outside ours: keep coming
        if (ai.rng() < CI.jumpIn && dist >= 150) return finish(ai, B.U | fwd);
        return finish(ai, fwd);
      }
    }
    // spacing: the template's 75 / 90 px, plus however much further this Hero's light reaches (reach from the art, ruling 5)
    var myLight = F.moveOf({ hero: me.hero, arch: me.arch }, "light").box.x1, extra = myLight - M.MOVES.light.box.x1;
    var want = (shot && ai.rng() < L.spacing ? 90 : 75) + extra;
    if (dist > want + 25) return finish(ai, fwd);
    if (v.frame >= ai.nextAttack) {
      ai.nextAttack = v.frame + range(ai, L.attackGap[0], L.attackGap[1]);
      var blocking = op.state === "block" || op.state === "cblock";
      if ((L.throw || 0) > 0 && dist <= M.MOVES.throw.range - 5 && ai.rng() < L.throw * (blocking ? 1 : 0.35)) press(B.LT | B.HV);
      else if (canSpecial && arch.special === "rush" && ai.rng() < L.special * 0.4) press(B.SP);
      else if (dist <= heavyReach(me, extra) && ai.rng() < 0.4) press(B.HV);
      else press(B.LT);
      return finish(ai, bits);
    }
    if (dist < 55 + extra * 0.6 && ai.rng() < L.spacing * 0.3) return finish(ai, back);
    return finish(ai, ai.rng() < 0.5 ? 0 : (ai.rng() < L.spacing ? back : fwd));
  }
  function finish(ai, bits) { ai.lastPress = bits; return bits; }
  // the opponent's light reaches further than ours (both from the art, ruling 5)
  function outRanged(me, op) {
    return F.moveOf({ hero: op.hero, arch: op.arch }, "light").box.x1 > F.moveOf({ hero: me.hero, arch: me.arch }, "light").box.x1 + 10;
  }
  // how far away the heavy is worth starting: 100 + the light's extra reach (as before); a Hero whose heavy LUNGES (Meghnad) from its
  // own short box plus the lunge
  function heavyReach(me, extra) {
    var H = M.HEROES[me.hero];
    if (H && H.heavyLunge) return F.moveOf({ hero: me.hero, arch: me.arch }, "heavy").box.x1 + H.heavyLunge - 10;
    if (extra == null) extra = F.moveOf({ hero: me.hero, arch: me.arch }, "light").box.x1 - M.MOVES.light.box.x1;
    return 100 + extra;
  }

  return { LEVELS: LEVELS, PUBLIC: PUBLIC, observe: observe, createAI: createAI, decide: decide };
});
