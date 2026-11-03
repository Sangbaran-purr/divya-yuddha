/* ARCADE-1 · THE FIGHT CORE (R1). One round between two fighters.
   - Deterministic: a fixed 60 Hz step, integer positions (U sub-units per logical px), no Math.random, no clock, no DOM.
     The same inputs give the same fight, byte for byte — the replay, rollback (v2) and headless-sim foundation.
   - Inputs are data: one bitmask per side per frame (BTN). The AI makes the same bitmasks a player does.
   - State is plain JSON: snapshot() / restore() is a deep copy, so a v2 rollback can rewind and resimulate.
   UMD: browser window.ARC_FIGHT (needs ARC_MOVES first), Node require. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./moves.js"));
  else root.ARC_FIGHT = factory(root.ARC_MOVES);
})(this, function (M) {
  "use strict";

  var U = 10;                                   // sub-units per logical px: every position and speed is an integer of these
  var STAGE_W = 1440, WALL = 40, PUSH = 60;     // px
  var BUFFER = 4;                               // a press can be used on its own frame and the next 3
  var BTN = { L: 1, R: 2, U: 4, D: 8, LT: 16, HV: 32, SP: 64, BL: 128 };
  var CMD = { light: BTN.LT, heavy: BTN.HV, special: BTN.SP, up: BTN.U };

  function px(v) { return Math.round(v * U); }
  var G = px(M.JUMP.g), JUMP_V = px(M.JUMP.v0), FRICTION = px(M.FRICTION);

  function newFighter(side, heroId) {
    var hero = M.HEROES[heroId]; if (!hero) throw new Error("unknown hero " + heroId);
    var a = M.ARCH[hero.arch];
    return { side: side, hero: heroId, arch: hero.arch, x: px(side === 0 ? 520 : 920), y: 0, vx: 0, vy: 0, facing: side === 0 ? 1 : -1,
      hp: a.hp, hpMax: a.hp, meter: 0, state: "idle", move: null, mf: 0, connected: false, hitDone: false, chain: 0,
      stun: 0, prev: 0, buf: { light: -1, heavy: -1, special: -1, up: -1 } };
  }

  function newFight(opts) {
    opts = opts || {};
    return { frame: 0, timer: (opts.seconds || M.ROUND_SECONDS) * 60, hitstop: 0, over: false, winner: null, reason: null,
      f: [newFighter(0, opts.p0 || "box_surya"), newFighter(1, opts.p1 || "box_surya")], proj: [], events: [] };
  }

  function arch(f) { return M.ARCH[f.arch]; }
  function grounded(f) { return f.y === 0; }
  function crouching(f) { return f.state === "crouch" || f.state === "cblock"; }
  function actionable(f) { return f.state === "idle" || f.state === "walkf" || f.state === "walkb" || f.state === "crouch" || f.state === "block" || f.state === "cblock"; }
  function moveTotal(m) { return m.startup + m.active + m.recovery; }
  function isActive(f) { if (f.state !== "attack") return false; var m = M.MOVES[f.move]; return f.mf >= m.startup && f.mf < m.startup + m.active; }
  function fwdBit(f) { return f.facing === 1 ? BTN.R : BTN.L; }
  function backBit(f) { return f.facing === 1 ? BTN.L : BTN.R; }
  function guarding(f, inp) { return !!(inp & BTN.BL) || !!(inp & backBit(f)); }

  // the 4-frame input buffer: rising edges only, so holding a button never repeats it
  // (during hit-stop a press is recorded but does not age: a cancel pressed in the freeze is still there when it ends)
  function bufferInputs(f, inp, frozen) {
    for (var k in CMD) {
      if ((inp & CMD[k]) && !(f.prev & CMD[k])) f.buf[k] = 0;
      else if (f.buf[k] >= 0 && !frozen) { f.buf[k]++; if (f.buf[k] >= BUFFER) f.buf[k] = -1; }
    }
    f.prev = inp;
  }
  function take(f, k) { if (f.buf[k] >= 0) { f.buf[k] = -1; return true; } return false; }
  function has(f, k) { return f.buf[k] >= 0; }

  function startMove(g, f, name) {
    if (name === "special") { if (f.meter < M.MOVES.special.cost) return false; f.meter -= M.MOVES.special.cost; }
    if (f.state === "attack" && f.move === "light" && name === "light") f.chain++; else if (f.state !== "attack") f.chain = 0;
    f.buf[name] = -1;
    f.state = "attack"; f.move = name; f.mf = 0; f.connected = false; f.hitDone = false; f.vx = 0;
    g.events.push({ t: "move", side: f.side, move: name, frame: g.frame });
    return true;
  }

  // the attack choice from the buffer: special (if the meter is full) > heavy > light
  function pickBuffered(f, allowed) {
    var order = ["special", "heavy", "light"];
    for (var i = 0; i < order.length; i++) {
      var k = order[i]; if (allowed.indexOf(k) < 0 || !has(f, k)) continue;
      if (k === "special" && f.meter < M.MOVES.special.cost) continue;
      return k;
    }
    return null;
  }

  function cancelOpen(f) {
    var m = M.MOVES[f.move];
    return f.connected && f.mf >= m.startup && f.mf < m.startup + m.active + m.cancelAfter;
  }

  function updateFighter(g, f, inp) {
    var a = arch(f);
    if (f.state === "ko" || f.state === "win") { f.vx = 0; return; }
    if (f.state === "hitstun" || f.state === "blockstun") {
      f.stun--; if (f.stun <= 0 && grounded(f)) { f.state = "idle"; f.stun = 0; }
      return;
    }
    if (f.state === "attack") {
      var m = M.MOVES[f.move];
      if (cancelOpen(f)) {
        var allowed = m.cancel.filter(function (k) { return !(k === "light" && f.chain >= M.CHAIN_MAX); });
        var next = pickBuffered(f, allowed);
        if (next && startMove(g, f, next)) return;
      }
      f.mf++;
      if (f.move === "special" && a.special === "rush") f.vx = isActive(f) ? f.facing * px(a.rushSpeed) : 0;
      if (f.move === "special" && a.special === "projectile" && f.mf === m.startup) spawnProjectile(g, f);
      if (f.mf >= moveTotal(m)) { f.state = "idle"; f.move = null; f.mf = 0; f.vx = 0; f.chain = 0; }
      return;
    }
    if (f.state === "jump") return;            // no air attacks in v1; landing returns to idle in physics
    // actionable on the ground
    var atk = pickBuffered(f, ["special", "heavy", "light"]);
    if (atk && startMove(g, f, atk)) return;
    if (inp & BTN.U) {
      take(f, "up");
      f.state = "jump"; f.vy = JUMP_V;
      f.vx = (inp & fwdBit(f)) ? f.facing * px(M.JUMP.fwd) : (inp & backBit(f)) ? -f.facing * px(M.JUMP.fwd) : 0;
      g.events.push({ t: "jump", side: f.side, frame: g.frame });
      return;
    }
    if (inp & BTN.D) { f.state = (inp & BTN.BL) || (inp & backBit(f)) ? "cblock" : "crouch"; f.vx = 0; return; }
    if (inp & BTN.BL) { f.state = "block"; f.vx = 0; return; }
    if (inp & fwdBit(f)) { f.state = "walkf"; f.vx = f.facing * px(a.walkF); return; }
    if (inp & backBit(f)) { f.state = "walkb"; f.vx = -f.facing * px(a.walkB); return; }
    f.state = "idle"; f.vx = 0;
  }

  function spawnProjectile(g, f) {
    if (g.proj.some(function (p) { return p.owner === f.side; })) return;   // one at a time
    g.proj.push({ owner: f.side, x: f.x + f.facing * px(M.PROJECTILE.startX), dir: f.facing, speed: px(arch(f).projSpeed), dmgMul: arch(f).dmg });
    g.events.push({ t: "projectile", side: f.side, frame: g.frame });
  }

  function physics(g) {
    g.f.forEach(function (f) {
      f.x += f.vx;
      if (!grounded(f) || f.vy > 0) {
        f.y += f.vy; f.vy -= G;
        if (f.y <= 0) { f.y = 0; f.vy = 0; if (f.state === "jump") { f.state = "idle"; f.vx = 0; } }
      }
      if (f.state === "hitstun" || f.state === "blockstun") f.vx = f.vx > 0 ? Math.max(0, f.vx - FRICTION) : Math.min(0, f.vx + FRICTION);
    });
    // walls
    g.f.forEach(function (f) { f.x = Math.max(px(WALL), Math.min(px(STAGE_W - WALL), f.x)); });
    // push boxes: fighters never overlap while both near the ground
    var A = g.f[0], B = g.f[1];
    if (Math.abs(A.y - B.y) < px(150)) {
      var dx = B.x - A.x, need = px(PUSH);
      if (Math.abs(dx) < need) {
        var dir = dx > 0 ? 1 : dx < 0 ? -1 : (A.facing === 1 ? 1 : -1);
        var over = need - Math.abs(dx), half = Math.floor(over / 2);
        A.x -= dir * half; B.x += dir * (over - half);
        var lo = px(WALL), hi = px(STAGE_W - WALL);
        if (A.x < lo) { B.x += lo - A.x; A.x = lo; } if (A.x > hi) { B.x -= A.x - hi; A.x = hi; }
        if (B.x < lo) { A.x += lo - B.x; B.x = lo; } if (B.x > hi) { A.x -= B.x - hi; B.x = hi; }
      }
    }
    // facing: turn toward the opponent whenever free to on the ground
    g.f.forEach(function (f, i) {
      var o = g.f[1 - i];
      if (grounded(f) && actionable(f) && o.x !== f.x) f.facing = o.x > f.x ? 1 : -1;
    });
    // projectiles fly; two opposing ones cancel
    g.proj.forEach(function (p) { p.x += p.dir * p.speed; });
    if (g.proj.length === 2 && Math.abs(g.proj[0].x - g.proj[1].x) <= px(2 * M.PROJECTILE.halfW)) { g.events.push({ t: "clash", frame: g.frame }); g.proj = []; }
    g.proj = g.proj.filter(function (p) { return p.x > 0 && p.x < px(STAGE_W); });
  }

  // world boxes, in sub-units
  function hurtbox(f) {
    var h = crouching(f) ? M.BODY.crouchH : M.BODY.standH;
    return { x0: f.x - px(M.BODY.halfW), x1: f.x + px(M.BODY.halfW), y0: f.y, y1: f.y + px(h) };
  }
  function hitbox(f) {
    if (!isActive(f) || f.hitDone) return null;
    if (f.move === "special" && arch(f).special === "projectile") return null;   // the projectile carries the hit
    var b = M.MOVES[f.move].box;
    var xa = f.x + f.facing * px(b.x0), xb = f.x + f.facing * px(b.x1);
    return { x0: Math.min(xa, xb), x1: Math.max(xa, xb), y0: f.y + px(b.y0), y1: f.y + px(b.y1) };
  }
  function projBox(p) { return { x0: p.x - px(M.PROJECTILE.halfW), x1: p.x + px(M.PROJECTILE.halfW), y0: px(M.PROJECTILE.y0), y1: px(M.PROJECTILE.y1) }; }
  function overlap(a, b) { return a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1; }

  // every hit this frame is found first, then applied together, so two simultaneous hits trade
  function collide(g, inputs) {
    var hits = [];
    g.f.forEach(function (att, i) {
      var def = g.f[1 - i], hb = hitbox(att);
      if (hb && overlap(hb, hurtbox(def))) hits.push({ att: att, def: def, move: M.MOVES[att.move], mul: arch(att).dmg, dir: att.facing });
    });
    g.proj = g.proj.filter(function (p) {
      var def = g.f[1 - p.owner];
      if (def.state === "ko") return true;
      if (overlap(projBox(p), hurtbox(def))) { hits.push({ att: g.f[p.owner], def: def, move: M.MOVES.special, mul: p.dmgMul, dir: p.dir, proj: true }); return false; }
      return true;
    });
    var stop = 0;
    hits.forEach(function (h) {
      var att = h.att, def = h.def, m = h.move;
      if (!h.proj) { att.hitDone = true; att.connected = true; }
      var canGuard = grounded(def) && (actionable(def) || def.state === "blockstun") && guarding(def, inputs[def.side]);
      if (canGuard) {
        var chip = Math.floor(m.chip * h.mul / 100);
        def.hp = Math.max(0, def.hp - chip);
        def.state = "blockstun"; def.stun = m.blockstun; def.move = null; def.mf = 0;
        def.vx = h.dir * px(Math.max(1, Math.floor(m.push / 2)));
        def.meter = Math.min(M.METER.max, def.meter + M.METER.onBlock);
        g.events.push({ t: "block", side: def.side, by: att.side, move: att.move || "special", chip: chip, frame: g.frame });
      } else {
        var dmg = Math.floor(m.dmg * h.mul / 100);
        def.hp = Math.max(0, def.hp - dmg);
        def.state = "hitstun"; def.stun = m.hitstun; def.move = null; def.mf = 0; def.chain = 0;
        def.vx = h.dir * px(m.push);
        att.meter = Math.min(M.METER.max, att.meter + M.METER.onHit);
        def.meter = Math.min(M.METER.max, def.meter + M.METER.onTaken);
        g.events.push({ t: "hit", side: def.side, by: att.side, move: h.proj ? "special" : att.move, dmg: dmg, frame: g.frame });
      }
      stop = Math.max(stop, m.hitstop);
    });
    g.hitstop = stop;
  }

  function finish(g, winner, reason) {
    g.over = true; g.winner = winner; g.reason = reason;
    g.f.forEach(function (f, i) { f.vx = 0; f.state = winner === null ? f.state : (i === winner ? "win" : "ko"); f.move = null; });
    g.proj = [];
    g.events.push({ t: "end", winner: winner, reason: reason, frame: g.frame });
  }

  // ONE logic frame. inputs = [bits for side 0, bits for side 1].
  function step(g, inputs) {
    if (g.over) return g;
    inputs = inputs || [0, 0];
    var frozen = g.hitstop > 0;
    g.f.forEach(function (f, i) { bufferInputs(f, inputs[i] | 0, frozen); });
    g.frame++;
    if (g.hitstop > 0) { g.hitstop--; return g; }   // hit-stop: both fighters freeze; the buffer still listens
    g.f.forEach(function (f, i) { updateFighter(g, f, inputs[i] | 0); });
    physics(g);
    collide(g, inputs);
    var dead = g.f.map(function (f) { return f.hp <= 0; });
    if (dead[0] || dead[1]) return finish(g, dead[0] && dead[1] ? null : dead[0] ? 1 : 0, "ko"), g;
    g.timer--;
    if (g.timer <= 0) {
      var r0 = g.f[0].hp * g.f[1].hpMax, r1 = g.f[1].hp * g.f[0].hpMax;   // health share, compared without division
      finish(g, r0 === r1 ? null : r0 > r1 ? 0 : 1, "time");
    }
    return g;
  }

  function snapshot(g) { return JSON.parse(JSON.stringify(g)); }
  function restore(s) { return JSON.parse(JSON.stringify(s)); }
  function hash(g) {   // FNV-1a over the state, for replay and rollback checks
    var s = JSON.stringify(g), h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return ("00000000" + h.toString(16)).slice(-8);
  }

  return { U: U, STAGE_W: STAGE_W, WALL: WALL, PUSH: PUSH, BUFFER: BUFFER, BTN: BTN, newFight: newFight, step: step,
    snapshot: snapshot, restore: restore, hash: hash, hurtbox: hurtbox, hitbox: hitbox, projBox: projBox, isActive: isActive,
    crouching: crouching, actionable: actionable, cancelOpen: cancelOpen };
});
