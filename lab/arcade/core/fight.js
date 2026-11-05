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

  function isShot(a) { return a.special === "projectile" || a.special === "nagapasha"; }
  function newFighter(side, heroId) {
    var hero = M.HEROES[heroId]; if (!hero) throw new Error("unknown hero " + heroId);
    var a = M.ARCH[hero.arch];
    return { side: side, hero: heroId, arch: hero.arch, x: px(side === 0 ? 520 : 920), y: 0, vx: 0, vy: 0, facing: side === 0 ? 1 : -1,
      hp: a.hp, hpMax: a.hp, meter: 0, state: "idle", move: null, mf: 0, connected: false, hitDone: false, chain: 0,
      stun: 0, prev: 0, buf: { light: -1, heavy: -1, special: -1, up: -1 }, parryWin: -1, parryLock: 0, counterArmed: false, age: 0 };   // age: logic frames in this state (drives the art)
  }

  function newFight(opts) {
    opts = opts || {};
    return { frame: 0, timer: (opts.seconds || M.ROUND_SECONDS) * 60, hitstop: 0, over: false, winner: null, reason: null,
      f: [newFighter(0, opts.p0 || "box_surya"), newFighter(1, opts.p1 || "box_surya")], proj: [], events: [] };
  }

  function arch(f) { return M.ARCH[f.arch]; }
  // a move as THIS fighter performs it: the template, with the Hero's reach from the art (ruling 5) and its archetype's reach and
  // recovery applied to light and heavy. A Hero with no measured reach uses the template's box (the box Heroes, unchanged).
  var MOVE_OF = {};
  function heroReach(h, name) {
    var hero = M.HEROES[h]; if (!hero) return null;
    if (hero.reach && hero.reach[name] != null) return hero.reach[name];
    if (hero.reachFrom) return heroReach(hero.reachFrom, name);
    return null;
  }
  function moveOf(f, name) {
    name = name || f.move;
    var a = arch(f), base = M.MOVES[name], r = (name === "light" || name === "heavy") && f.hero ? heroReach(f.hero, name) : null;
    if ((name !== "light" && name !== "heavy") || !(a.reachPx || a.recoveryAdd || r != null)) return base;   // reach and recovery touch light and heavy only
    var k = (f.hero || "") + ":" + f.arch + ":" + name;
    if (!MOVE_OF[k]) {
      var m = JSON.parse(JSON.stringify(base));
      if (r != null) m.box.x1 = r;
      m.recovery += a.recoveryAdd || 0; if (r == null) m.box.x1 += a.reachPx || 0;   // a Hero whose reach comes from the art takes it as is (ruling 1, 2026-11-05)
      MOVE_OF[k] = m;
    }
    return MOVE_OF[k];
  }
  function grounded(f) { return f.y === 0; }
  function crouching(f) { return f.state === "crouch" || f.state === "cblock"; }
  function actionable(f) { return f.state === "idle" || f.state === "walkf" || f.state === "walkb" || f.state === "crouch" || f.state === "block" || f.state === "cblock"; }
  function moveTotal(m) { return m.startup + m.active + m.recovery; }
  function isActive(f) { if (f.state !== "attack") return false; var m = moveOf(f); return f.mf >= m.startup && f.mf < m.startup + m.active; }
  function fwdBit(f) { return f.facing === 1 ? BTN.R : BTN.L; }
  function backBit(f) { return f.facing === 1 ? BTN.L : BTN.R; }
  function guarding(f, inp) { return !!(inp & BTN.BL) || !!(inp & backBit(f)); }
  // the states nothing can touch: down, rising, or locked in a throw (ruling 5: the wake-up is invulnerable; no OTG in v1)
  var INVUL = { knockdown: 1, getup: 1, grab: 1, grabbed: 1 };
  // the states that count down on f.stun and then free the fighter (knockdown → getup; grab/grabbed end in resolveGrabs)
  var TIMED = { knockdown: 1, getup: 1, parry: 1, parried: 1, grab: 1, grabbed: 1, throwrec: 1, tech: 1, bound: 1 };
  // who a throw can take: on the ground and not stunned, down, rising, in the air, parrying or already in a throw
  var UNTHROWABLE = { hitstun: 1, blockstun: 1, knockdown: 1, getup: 1, grab: 1, grabbed: 1, jump: 1, ko: 1, win: 1, tech: 1, parry: 1, throwrec: 1 };
  function throwable(f) { return grounded(f) && !UNTHROWABLE[f.state]; }
  function inThrowRange(g, f) { var o = g.f[1 - f.side]; return Math.abs(o.x - f.x) <= px(M.MOVES.throw.range); }

  // the 4-frame input buffer: rising edges only, so holding a button never repeats it
  // (during hit-stop a press is recorded but does not age: a cancel pressed in the freeze is still there when it ends)
  function bufferInputs(f, inp, frozen) {
    for (var k in CMD) {
      if ((inp & CMD[k]) && !(f.prev & CMD[k])) f.buf[k] = 0;
      else if (f.buf[k] >= 0 && !frozen) { f.buf[k]++; if (f.buf[k] >= BUFFER) f.buf[k] = -1; }
    }
    // the parry window (ruling 5): a fresh press of Block opens it unless the lockout from the last press is still running
    if (!frozen) { if (f.parryWin >= 0) { f.parryWin++; if (f.parryWin >= M.PARRY.window) f.parryWin = -1; } if (f.parryLock > 0) f.parryLock--; }
    if ((inp & BTN.BL) && !(f.prev & BTN.BL) && f.parryLock <= 0) { f.parryWin = 0; f.parryLock = M.PARRY.lockout; }
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
    var m = moveOf(f);
    return f.connected && f.mf >= m.startup && f.mf < m.startup + m.active + m.cancelAfter;
  }

  function updateFighter(g, f, inp) {
    var a = arch(f);
    if (f.state === "ko" || f.state === "win") { f.vx = 0; return; }
    if (TIMED[f.state]) {
      if (f.stun > 0) f.stun--;
      if (f.stun > 0 || !grounded(f) || f.state === "grab" || f.state === "grabbed") return;   // a throw ends in resolveGrabs
      if (f.state === "parry" && f.counterArmed) { f.counterArmed = false; f.stun = 0; startMove(g, f, "counter"); return; }   // 13b: the deflect flows into the counter
      if (f.state === "knockdown") { f.state = "getup"; f.stun = M.KNOCKDOWN.getup; f.vx = 0; g.events.push({ t: "getup", side: f.side, frame: g.frame }); return; }
      f.state = "idle"; f.stun = 0; f.vx = 0;
      return;
    }
    if (f.state === "hitstun" || f.state === "blockstun") {
      f.stun--; if (f.stun <= 0 && grounded(f)) { f.state = "idle"; f.stun = 0; }
      return;
    }
    if (f.state === "attack") {
      var m = moveOf(f);
      // a light that started at most 2 frames ago becomes a throw when Heavy joins it in range (the press-both leniency)
      if (f.move === "light" && f.mf <= 1 && has(f, "heavy") && inThrowRange(g, f)) { take(f, "heavy"); f.buf.light = -1; startMove(g, f, "throw"); return; }
      if (cancelOpen(f)) {
        var allowed = m.cancel.filter(function (k) { return !(k === "light" && f.chain >= M.CHAIN_MAX); });
        var next = pickBuffered(f, allowed);
        if (next && startMove(g, f, next)) return;
      }
      f.mf++;
      // the heavy's wind-up LUNGE (Meghnad, owner ruling 1 of 2026-11-05): the clip's forward step, spread over the startup frames
      var lunge = f.move === "heavy" && M.HEROES[f.hero] && M.HEROES[f.hero].heavyLunge;
      if (lunge) f.vx = f.mf <= m.startup ? f.facing * px(lunge / m.startup) : 0;
      if (f.move === "special" && a.special === "rush") f.vx = isActive(f) ? f.facing * px(a.rushSpeed) : 0;
      if (f.move === "special" && isShot(a) && f.mf === m.startup) spawnProjectile(g, f);
      if (f.mf >= moveTotal(m)) { f.state = "idle"; f.move = null; f.mf = 0; f.vx = 0; f.chain = 0; }
      return;
    }
    if (f.state === "jump") return;            // no air attacks in v1; landing returns to idle in physics
    // actionable on the ground. Light + Heavy together = the throw (ruling 5)
    if (has(f, "light") && has(f, "heavy")) { f.buf.light = -1; f.buf.heavy = -1; startMove(g, f, "throw"); return; }
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
    var H = M.HEROES[f.hero], hw = H && H.walk ? H.walk : H && H.fighter ? M.REAL_WALK : a;   // a Hero's own walk (Meghnad), else the real-Hero speed, else the archetype
    if (inp & fwdBit(f)) { f.state = "walkf"; f.vx = f.facing * px(hw.walkF); return; }
    if (inp & backBit(f)) { f.state = "walkb"; f.vx = -f.facing * px(hw.walkB); return; }
    f.state = "idle"; f.vx = 0;
  }

  function spawnProjectile(g, f) {
    if (g.proj.some(function (p) { return p.owner === f.side; })) return;   // one at a time
    var hero = M.HEROES[f.hero], sx = hero && hero.projX != null ? hero.projX : M.PROJECTILE.startX;   // Indra's Vajra leaves its tip (ruling 5)
    // a shot that leaves the weapon's TIP (Indra 177, Meghnad 241): with the opponent closer than the tip, it starts ON the opponent —
    // the weapon is already through them (left at the tip it would start behind them and never hit: found 2026-11-05, ruling 1)
    var o = g.f[1 - f.side], gap = (o.x - f.x) * f.facing / U;
    if (hero && hero.projX != null && gap > 0 && gap < sx) sx = gap;
    g.proj.push({ owner: f.side, x: f.x + f.facing * px(sx), dir: f.facing, speed: px(arch(f).projSpeed), dmgMul: arch(f).dmg, kind: arch(f).special === "nagapasha" ? "naga" : "shot" });
    g.events.push({ t: "projectile", side: f.side, frame: g.frame });
  }

  function physics(g) {
    g.f.forEach(function (f) {
      f.x += f.vx;
      if (!grounded(f) || f.vy > 0) {
        f.y += f.vy; f.vy -= G;
        if (f.y <= 0) { f.y = 0; f.vy = 0; if (f.state === "jump") { f.state = "idle"; f.vx = 0; } }
      }
      if (f.state === "hitstun" || f.state === "blockstun" || f.state === "knockdown" || f.state === "parried" || f.state === "tech") f.vx = f.vx > 0 ? Math.max(0, f.vx - FRICTION) : Math.min(0, f.vx + FRICTION);
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
    if (f.move === "special" && isShot(arch(f))) return null;   // the projectile carries the hit
    if (f.move === "throw") return null;                                          // a throw grabs (collide), it never hits
    if (f.move === "counter") return null;                                        // the counter is guaranteed (collide), not boxed
    var b = moveOf(f).box;
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
      if (hb && !INVUL[def.state] && overlap(hb, hurtbox(def))) hits.push({ att: att, def: def, move: moveOf(att), name: att.move, mul: arch(att).dmg, dir: att.facing, wasStun: def.state === "hitstun" });
    });
    g.proj = g.proj.filter(function (p) {
      var def = g.f[1 - p.owner];
      if (def.state === "ko" || INVUL[def.state]) return true;
      if (overlap(projBox(p), hurtbox(def))) { hits.push({ att: g.f[p.owner], def: def, move: p.kind === "naga" ? NAGA_MOVE : M.MOVES.special, name: "special", mul: p.dmgMul, dir: p.dir, proj: true, naga: p.kind === "naga" }); return false; }
      return true;
    });
    // 13b THE AUTOMATIC COUNTER lands on its first active frame on the Hero it parried (still stunned): guaranteed, no box
    g.f.forEach(function (att, i) {
      var def = g.f[1 - i];
      if (att.state === "attack" && att.move === "counter" && isActive(att) && !att.hitDone && def.state === "parried")
        hits.push({ att: att, def: def, move: M.MOVES.counter, name: "counter", mul: arch(att).dmg, dir: def.x > att.x ? 1 : -1 });
    });
    // throws grab on their active frames, unless the thrower is being hit this frame; two grabs on one frame break each other
    var grabs = [];
    g.f.forEach(function (att, i) {
      var def = g.f[1 - i];
      if (att.state === "attack" && att.move === "throw" && isActive(att) && !att.hitDone && grounded(att) && throwable(def) &&
        inThrowRange(g, att) && !hits.some(function (h) { return h.def === att; })) grabs.push({ att: att, def: def });
    });
    if (grabs.length === 2) techBoth(g, grabs[0].att, grabs[0].def);
    else if (grabs.length === 1) {
      var ga = grabs[0].att, gd = grabs[0].def;
      ga.hitDone = true; ga.state = "grab"; ga.stun = M.MOVES.throw.hold; ga.vx = 0;
      gd.state = "grabbed"; gd.stun = M.MOVES.throw.hold; gd.vx = 0; gd.move = null; gd.mf = 0;
      g.events.push({ t: "grab", side: gd.side, by: ga.side, frame: g.frame });
    }
    var stop = 0;
    hits.forEach(function (h) {
      var att = h.att, def = h.def, m = h.move;
      if (!h.proj) { att.hitDone = true; att.connected = true; }
      // THE PARRY (ruling 5): a hit landing inside the defender's parry window does nothing to it; the attacker is pushed back and stunned
      if (grounded(def) && (actionable(def) || def.state === "blockstun") && def.parryWin >= 0) {
        def.parryWin = -1; def.state = "parry"; def.stun = M.PARRY.recovery; def.vx = 0; def.move = null; def.mf = 0; def.counterArmed = !h.proj;
        if (!h.proj) { att.state = "parried"; att.stun = M.PARRY.stunAttacker; att.move = null; att.mf = 0; att.connected = false; att.vx = -h.dir * px(M.PARRY.push); }
        g.events.push({ t: "parry", side: def.side, by: att.side, move: h.name, proj: !!h.proj, frame: g.frame });
        stop = Math.max(stop, M.PARRY.hitstop);
        return;
      }
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
        if (h.naga) {   // 6 NAGAPASHA: the coil binds — no knockdown, the bound Hero can't act (ruling 6)
          def.state = "bound"; def.stun = M.NAGAPASHA.bind; def.move = null; def.mf = 0; def.chain = 0; def.vx = 0;
          att.meter = Math.min(M.METER.max, att.meter + M.METER.onHit); def.meter = Math.min(M.METER.max, def.meter + M.METER.onTaken);
          g.events.push({ t: "hit", side: def.side, by: att.side, move: "special", dmg: dmg, frame: g.frame });
          g.events.push({ t: "bind", side: def.side, by: att.side, frames: M.NAGAPASHA.bind, frame: g.frame });
          stop = Math.max(stop, m.hitstop); return;
        }
        // 10b: a special, or a heavy that finishes a combo (it lands on a defender already in hitstun), knocks down
        var down = h.name === "special" || (h.name === "heavy" && h.wasStun);
        def.state = down ? "knockdown" : "hitstun"; def.stun = down ? M.KNOCKDOWN.fall : m.hitstun; def.move = null; def.mf = 0; def.chain = 0;
        def.vx = h.dir * px(down ? M.KNOCKDOWN.push : m.push);
        att.meter = Math.min(M.METER.max, att.meter + M.METER.onHit);
        def.meter = Math.min(M.METER.max, def.meter + M.METER.onTaken);
        g.events.push({ t: "hit", side: def.side, by: att.side, move: h.name, dmg: dmg, frame: g.frame });
        if (down) g.events.push({ t: "knockdown", side: def.side, by: att.side, move: h.name, frame: g.frame });
      }
      stop = Math.max(stop, m.hitstop);
    });
    g.hitstop = stop;
  }

  var NAGA_MOVE = { dmg: M.NAGAPASHA.dmg, chip: M.NAGAPASHA.chip, hitstun: 0, blockstun: M.MOVES.special.blockstun, hitstop: M.MOVES.special.hitstop, push: 4 };
  function techBoth(g, a, d) {   // a throw broken: both pushed apart, no damage
    var dir = d.x > a.x ? 1 : d.x < a.x ? -1 : a.facing;
    [a, d].forEach(function (f) { f.state = "tech"; f.stun = M.MOVES.throw.techStun; f.move = null; f.mf = 0; f.hitDone = true; });
    a.vx = -dir * px(M.MOVES.throw.techPush); d.vx = dir * px(M.MOVES.throw.techPush);
    g.events.push({ t: "tech", side: d.side, by: a.side, frame: g.frame });
  }
  // the grab's hold: the grabbed side pressing Light + Heavy breaks free; when the hold runs out the throw lands
  function resolveGrabs(g) {
    g.f.forEach(function (att, i) {
      var def = g.f[1 - i];
      if (att.state !== "grab" || def.state !== "grabbed") return;
      if (has(def, "light") && has(def, "heavy")) { def.buf.light = -1; def.buf.heavy = -1; techBoth(g, att, def); return; }
      // 14 MEGHNAD'S SPEAR-HOOK (owner brief 2026-11-05): the hold yanks the caught Hero in to knee distance (hero.throwPull, logical
      // px between the two), spread evenly over the hold's frames; the throw's RANGE is unchanged — the hook's length is visual only
      var pull = M.HEROES[att.hero] && M.HEROES[att.hero].throwPull;
      if (pull && att.stun > 0) {
        var gap = Math.abs(def.x - att.x) - px(pull);
        if (gap > 0) { var step = Math.ceil(gap / att.stun); def.x -= (def.x > att.x ? 1 : -1) * Math.min(gap, step); }
      }
      if (att.stun > 0) return;
      var T = M.MOVES.throw, dmg = Math.floor(T.dmg * arch(att).dmg / 100);
      def.hp = Math.max(0, def.hp - dmg);
      def.state = "knockdown"; def.stun = M.KNOCKDOWN.fall; def.vx = att.facing * px(M.KNOCKDOWN.push);
      att.state = "throwrec"; att.stun = T.after; att.move = null; att.mf = 0;
      att.meter = Math.min(M.METER.max, att.meter + M.METER.onHit);
      def.meter = Math.min(M.METER.max, def.meter + M.METER.onTaken);
      g.events.push({ t: "hit", side: def.side, by: att.side, move: "throw", dmg: dmg, frame: g.frame });
      g.events.push({ t: "knockdown", side: def.side, by: att.side, move: "throw", frame: g.frame });
    });
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
    var frozen = g.hitstop > 0, was = g.f.map(function (f) { return f.state; });
    g.f.forEach(function (f, i) { bufferInputs(f, inputs[i] | 0, frozen); });
    g.frame++;
    if (g.hitstop > 0) { g.hitstop--; return g; }   // hit-stop: both fighters freeze; the buffer still listens
    g.f.forEach(function (f, i) { updateFighter(g, f, inputs[i] | 0); });
    resolveGrabs(g);
    physics(g);
    collide(g, inputs);
    g.f.forEach(function (f, i) { f.age = f.state === was[i] ? f.age + 1 : 0; });   // the art reads it: frames in this state (frozen in hit-stop)
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
    crouching: crouching, actionable: actionable, cancelOpen: cancelOpen, moveOf: moveOf, throwable: throwable, INVUL: INVUL, isShot: isShot, G: G, JUMP_V: JUMP_V };
});
