/* ARCADE-1 · THE SCENE (R1): a fight state → a list of plain shapes in the 960×540 logical view. Pure, so the suite can
   check what is drawn (a hitbox only on active frames, the crouch box, the camera) and either backend — Pixi or the
   Canvas 2D floor — just draws the list. Box fighters until R3 brings real ones.
   UMD: window.ARC_SCENE (needs ARC_MOVES, ARC_FIGHT), Node require. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("../core/moves.js"), require("../core/fight.js"));
  else root.ARC_SCENE = factory(root.ARC_MOVES, root.ARC_FIGHT);
})(this, function (M, F) {
  "use strict";
  var VIEW_W = 960, VIEW_H = 540, GROUND_Y = 470, STANCE_LOGICAL = 220;   // a fighter's stance is as tall as its standing hurtbox

  // WHICH CELL SHOWS NOW (the full moveset, manifest v2 `anim`). Every state is mapped onto the game's own clock:
  //   loops (idle 8 fps, walk 12 fps — walk back plays the walk reversed, the owner's default) run on the fight clock;
  //   enter + hold (crouch, block, win) play the entry at 12 fps from the state's start (f.age), then loop the hold;
  //   attacks put each phase's cells across that phase's own frames (the archetype's — Meghnad's recovery is longer);
  //   spans (jump, hit, knockdown, get-up, parry, K.O.) stretch their cells across the state's length.
  // A Hero without art for a state BORROWS (opts.fallback, i.e. fx on): an attack plays its light, a throw the light, a K.O. or
  // knockdown with no clip the stance tilted (the presentation does the tilt), everything else the idle. Without fallback: null → box.
  // after = frames since the fight ended (the K.O. and win animations run on after the core has stopped).
  var KD_FALL = M.KNOCKDOWN.fall, KD_UP = M.KNOCKDOWN.getup, AIR = Math.round(2 * M.JUMP.v0 / M.JUMP.g);
  function loopAt(L, t, fps) { return L[Math.floor(t * fps / 60) % L.length]; }
  function spanAt(L, fr) { return L[Math.max(0, Math.min(L.length - 1, Math.floor(fr * L.length)))]; }
  function enterHold(A, age) {
    var n = A.enter.length, t = age * A.fps / 60;
    if (t < n) return A.enter[Math.floor(t)];
    return A.hold[Math.floor((age - n * 60 / A.fps) * A.holdFps / 60) % A.hold.length];
  }
  function phaseAt(A, f, m) {
    var ph, fr;
    if (f.mf < m.startup) { ph = "startup"; fr = f.mf / m.startup; }
    else if (f.mf < m.startup + m.active) { ph = "active"; fr = (f.mf - m.startup) / m.active; }
    else { ph = "recovery"; fr = Math.min(0.9999, (f.mf - m.startup - m.active) / m.recovery); }
    var L = A.phases[ph], c = L[0][0];
    for (var i = 0; i < L.length; i++) if (L[i][1] <= fr + 1e-3) c = L[i][0];   // fractions are stored to 4 places
    return { phase: ph, cell: c };
  }
  function artCell(g, f, man, fallback, after) {
    if (!man) return null;
    var A = man.anim || {}, B = !!fallback, st = f.state, age = f.age || 0;
    function idle(borrowed) { return { move: "idle", cell: loopAt(A.idle.loop, g.frame, A.idle.fps), borrowed: borrowed || undefined }; }
    if (st === "idle") return idle(false);
    if (st === "walkf" || st === "walkb") {
      if (A.walk) { var W = st === "walkf" ? A.walk.loop : A.walk.loop.slice().reverse(); return { move: st === "walkf" ? "walk" : "walkBack", cell: loopAt(W, g.frame, A.walk.fps) }; }
      return B ? idle(true) : null;
    }
    if (st === "attack") {
      var mv = f.move, m = F.moveOf(f), own = !!A[mv];   // the throw and the counter have their own art once their clips are cut
      if (!own && !B) return null;
      var r = phaseAt(own ? A[mv] : A.light, f, m);
      return { move: own ? mv : mv, phase: r.phase, cell: r.cell, borrowed: own ? undefined : true };
    }
    if (st === "jump") {
      if (!A.jump) return B ? idle(true) : null;
      var air = (F.JUMP_V - f.vy) / F.G;   // frames since take-off, from the body's own vertical speed
      return { move: "jump", cell: spanAt(A.jump.span, air / AIR) };
    }
    if (st === "crouch" || st === "cblock") return A.crouch ? { move: "crouch", cell: enterHold(A.crouch, age) } : B ? idle(true) : null;
    if (st === "block") return A.block ? { move: "block", cell: enterHold(A.block, age) } : B ? idle(true) : null;
    if (st === "blockstun" || st === "tech") return A.block ? { move: "block", cell: A.block.hold[0] } : B ? idle(true) : null;
    if (st === "hitstun" || st === "parried" || st === "grabbed" || st === "bound") {
      var total = age + (f.stun || 0), heavy = st !== "hitstun" || total > 16, H = heavy ? A.hitHeavy : A.hitLight;
      if (!H) return B ? idle(true) : null;
      var fr = st === "bound" ? 0.4 : st === "grabbed" ? 0 : age / Math.max(1, total);   // bound: the stagger held, struggling
      return { move: heavy ? "hitHeavy" : "hitLight", cell: spanAt(H.span, fr) };
    }
    if (st === "knockdown") return A.knockdown ? { move: "knockdown", cell: spanAt(A.knockdown.span, age / KD_FALL) } : B ? { move: "knockdown", cell: A.idle.loop[0], borrowed: true } : null;
    if (st === "getup") return A.getup ? { move: "getup", cell: spanAt(A.getup.span, age / KD_UP) } : B ? idle(true) : null;
    if (st === "parry") return A.parry ? { move: "parry", cell: spanAt(A.parry.span, age / M.PARRY.recovery) } : B ? idle(true) : null;
    // 14: the grab's hold plays the pull-in over the tech window; the throw's landing plays the knee strike, then back to stance
    if (st === "grab") return A.throwGrab ? { move: "throwGrab", cell: spanAt(A.throwGrab.span, age / M.MOVES.throw.hold) } : A.light ? { move: "throw", cell: A.light.phases.active[0][0], borrowed: true } : null;
    if (st === "throwrec") {
      if (A.throwHit) return { move: "throwHit", cell: spanAt(A.throwHit.span, age / M.MOVES.throw.after) };
      var T = A.light.phases.recovery; return { move: "throw", cell: spanAt(T.map(function (x) { return x[0]; }), age / M.MOVES.throw.after), borrowed: true };
    }
    if (st === "ko") {
      var t = after || 0;
      if (A.ko) return { move: "ko", cell: t < A.ko.frames ? spanAt(A.ko.span, t / A.ko.frames) : A.ko.hold[0] };
      if (A.knockdown) return { move: "ko", cell: spanAt(A.knockdown.span, Math.min(1, t / KD_FALL)) };   // 10b's fall held on its last down frame
      return B ? { move: "ko", cell: A.idle.loop[0], borrowed: true } : null;
    }
    if (st === "win") return A.win ? { move: "win", cell: enterHold(A.win, after || 0) } : B ? idle(true) : null;
    return B ? idle(true) : null;
  }

  // THE DYNAMIC CAMERA (?cam=tight): it follows the midpoint and zooms with the fighters' distance — tight when close (a stance
  // is then about half the screen's height), wider as they part, never past the stage ends. "wide" is the fixed R0–R2 camera.
  var ZOOM_MAX = 1.25, ZOOM_MIN = 0.8, ZOOM_MARGIN = 420;
  function cameraTarget(g, mode) {
    var mid = (g.f[0].x + g.f[1].x) / 2 / F.U;
    if (mode !== "tight") return { x: cameraX(g) + VIEW_W / 2, zoom: 1 };
    var dist = Math.abs(g.f[1].x - g.f[0].x) / F.U;
    var zoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, VIEW_W / (dist + ZOOM_MARGIN)));
    var half = VIEW_W / 2 / zoom;
    return { x: Math.max(half, Math.min(F.STAGE_W - half, mid)), zoom: zoom };
  }
  // exponential easing toward the target; dt in seconds
  function easeCamera(cam, target, dt) {
    if (!cam) return { x: target.x, zoom: target.zoom };
    var k = 1 - Math.exp(-dt * 6);
    return { x: cam.x + (target.x - cam.x) * k, zoom: cam.zoom + (target.zoom - cam.zoom) * k };
  }

  // the camera follows the midpoint of the two fighters and never shows past the stage ends
  function cameraX(g) {
    var mid = (g.f[0].x + g.f[1].x) / 2 / F.U;
    return Math.max(0, Math.min(F.STAGE_W - VIEW_W, Math.round(mid - VIEW_W / 2)));
  }
  function toView(box, cam) {   // a world box in sub-units → a view rect in px
    var x0 = box.x0 / F.U - cam, x1 = box.x1 / F.U - cam;
    return { x: x0, y: GROUND_Y - box.y1 / F.U, w: x1 - x0, h: (box.y1 - box.y0) / F.U };
  }

  function build(g, opts) {
    opts = opts || {};
    // opts.cam = {x, zoom}: the view is centred on x and scaled about the ground line; absent, the fixed camera as before
    var cam = opts.cam ? opts.cam.x - VIEW_W / 2 : cameraX(g), out = [];
    var layer = "bg";
    function rect(r, fill, alpha, tag, stroke) { out.push({ k: "rect", layer: layer, x: r.x, y: r.y, w: r.w, h: r.h, fill: fill, alpha: alpha == null ? 1 : alpha, stroke: stroke || null, tag: tag || "" }); }
    // the placeholder arena: sky, a far band that scrolls slowly (so movement reads), the ground
    rect({ x: 0, y: 0, w: VIEW_W, h: 300 }, 0x2a1d10, 1, "sky");
    rect({ x: 0, y: 300, w: VIEW_W, h: GROUND_Y - 300 }, 0x3a2914, 1, "far");
    for (var t = 0; t <= F.STAGE_W; t += 240) {
      var px = t * 0.5 - cam * 0.5;                         // far pillars at half speed
      if (px > -40 && px < VIEW_W + 40) rect({ x: px - 12, y: 250, w: 24, h: GROUND_Y - 250 }, 0x4d3719, 1, "pillar");
    }
    rect({ x: 0, y: GROUND_Y, w: VIEW_W, h: VIEW_H - GROUND_Y }, 0x1c140a, 1, "ground");
    rect({ x: 0, y: GROUND_Y - 1, w: VIEW_W, h: 2 }, 0xe8c874, 0.6, "groundline");
    for (var s = 0; s <= F.STAGE_W; s += 120) { var sx = s - cam; if (sx >= 0 && sx <= VIEW_W) rect({ x: sx - 1, y: GROUND_Y + 4, w: 2, h: 10 }, 0xe8c874, 0.25, "tick"); }

    g.f.forEach(function (f) {
      var hero = M.HEROES[f.hero], hb = toView(F.hurtbox(f), cam);
      var flash = !opts.reducedMotion && g.hitstop > 0 && f.state === "hitstun";
      var man = hero.fighter && opts.fighters ? opts.fighters[hero.fighter] : null, art = artCell(g, f, man, opts.fallback, opts.after);
      layer = "body";
      if (art) {
        // a real fighter: the cell, its feet pivot on the fighter's ground point, its stance scaled to the hurtbox's height
        var rung = opts.rung || "hi";
        out.push({ k: "sprite", layer: "body", tag: "sprite" + f.side, side: f.side, fighter: hero.fighter, rung: rung, cell: art.cell, move: art.move, phase: art.phase || null, ko: !!art.borrowed && (art.move === "ko" || art.move === "knockdown"), borrowed: !!art.borrowed,
          x: f.x / F.U - cam, y: GROUND_Y - f.y / F.U, scale: STANCE_LOGICAL / man.stance.heightPx[rung], flip: f.facing === -1, alpha: 1 });
      } else {
        var color = flash ? 0xffffff : f.state === "ko" ? 0x555555 : hero.color;
        // 10b: a knocked-down box lies flat, a rising one is half height (both untouchable: drawn faint)
        if (f.state === "knockdown" || f.state === "getup") { var lh = f.state === "knockdown" ? 44 : 120, lw = f.state === "knockdown" ? 150 : 70; hb = { x: hb.x + hb.w / 2 - lw / 2, y: hb.y + hb.h - lh, w: lw, h: lh }; }
        var outline = f.state === "blockstun" || f.state === "block" || f.state === "cblock" ? { width: 3, color: 0x7fe0ff } : f.state === "parry" ? { width: 4, color: 0xffffff } :
          f.state === "grab" || f.state === "grabbed" ? { width: 3, color: 0xffa040 } : null;
        rect(hb, color, f.state === "ko" ? 0.5 : f.state === "knockdown" || f.state === "getup" ? 0.55 : 0.9, "body" + f.side, outline);
        // a "face" on the front edge, so facing reads
        var faceX = f.facing === 1 ? hb.x + hb.w - 10 : hb.x;
        rect({ x: faceX, y: hb.y + 14, w: 10, h: 18 }, 0x120c05, 0.9, "face" + f.side);
      }
      layer = "fx";
      // a side marker over the head (gold = you, red = the opponent), so a mirror match reads
      rect({ x: hb.x + hb.w / 2 - 14, y: hb.y - 14, w: 28, h: 6 }, f.side === 0 ? 0xe8c874 : 0xd8574a, 0.95, "marker" + f.side);
      // the move in progress: startup shows a thin wind-up bar, active shows the real hitbox (over real art: only with H)
      var box = F.hitbox(f);
      if (box && (!art || opts.debug)) rect(toView(box, cam), 0xff4030, art ? 0.4 : 0.55, "hitbox" + f.side);
      else if (!art && f.state === "attack" && !F.isActive(f) && f.mf < F.moveOf(f).startup) {
        var w = 8 + 40 * f.mf / F.moveOf(f).startup;
        rect({ x: f.facing === 1 ? hb.x + hb.w : hb.x - w, y: hb.y + 60, w: w, h: 6 }, 0xffb060, 0.7, "windup" + f.side);
      }
      if (opts.debug) out.push({ k: "rect", layer: "fx", x: hb.x, y: hb.y, w: hb.w, h: hb.h, fill: null, alpha: 1, stroke: { width: 1, color: 0x60ff90 }, tag: "hurt" + f.side });
    });
    layer = "fx";
    g.proj.forEach(function (p) { rect(toView(F.projBox(p), cam), 0xffd76a, 0.95, "proj" + p.owner); });
    if (opts.cam && opts.cam.zoom !== 1) {   // the zoom: about the screen's centre column and the ground line
      var z = opts.cam.zoom, cx = VIEW_W / 2;
      out.forEach(function (s) {
        if (s.tag === "sky" || s.tag === "far" || s.tag === "ground" || s.tag === "groundline") return;
        s.x = (s.x - cx) * z + cx; s.y = GROUND_Y - (GROUND_Y - s.y) * z;
        if (s.k === "sprite") s.scale *= z; else { s.w *= z; s.h *= z; }
      });
    }
    return { cam: cam, zoom: opts.cam ? opts.cam.zoom : 1, shapes: out };
  }

  return { VIEW_W: VIEW_W, VIEW_H: VIEW_H, GROUND_Y: GROUND_Y, STANCE_LOGICAL: STANCE_LOGICAL, cameraX: cameraX, artCell: artCell, build: build,
    cameraTarget: cameraTarget, easeCamera: easeCamera, ZOOM_MAX: ZOOM_MAX, ZOOM_MIN: ZOOM_MIN };
});
