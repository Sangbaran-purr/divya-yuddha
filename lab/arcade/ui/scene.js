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

  // THE CLIP TEST: which cell of a real fighter's sheet shows now — or null, and the box is drawn instead.
  //   idle  loops at the sheet's own 12 fps on the fight clock;
  //   light is stretched onto the game's own phases: the startup cells across the startup frames, the contact cell across the
  //         active frames, the recovery cells across the recovery (the archetype's own length — Meghnad's is 2 frames longer).
  // Every other state has no art yet (ruling: other moves stay boxes).
  // fallback (the enhancement test's ?fx=1 only): a state with no clip yet borrows art — any attack plays the light's cells on
  // its own phases, a KO holds the stance cell (the presentation tilts and fades it), everything else loops the idle.
  function artCell(g, f, man, fallback) {
    if (!man) return null;
    var ci = man.cellIndex;
    if (f.state === "idle") { var n = ci.idle.length; return { move: "idle", cell: ci.idle[Math.floor(g.frame * man.fpsOut / 60) % n] }; }
    if (f.state === "attack" && (f.move === "light" || fallback)) {
      var m = F.moveOf(f), L = ci.light;
      if (f.mf < m.startup) return { move: "light", phase: "startup", cell: L.startup[Math.floor(f.mf * L.startup.length / m.startup)] };
      if (f.mf < m.startup + m.active) return { move: "light", phase: "active", cell: L.active[Math.floor((f.mf - m.startup) * L.active.length / m.active)] };
      var r = f.mf - m.startup - m.active;
      return { move: "light", phase: "recovery", cell: L.recovery[Math.min(L.recovery.length - 1, Math.floor(r * L.recovery.length / m.recovery))] };
    }
    if (!fallback) return null;
    if (f.state === "ko") return { move: "ko", cell: ci.idle[0], borrowed: true };
    if (f.state === "knockdown") return { move: "knockdown", cell: ci.idle[0], borrowed: true };   // 10b: the stance laid down (the presentation tilts it)
    var k = ci.idle.length; return { move: "idle", cell: ci.idle[Math.floor(g.frame * man.fpsOut / 60) % k], borrowed: true };
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
      var man = hero.fighter && opts.fighters ? opts.fighters[hero.fighter] : null, art = artCell(g, f, man, opts.fallback);
      layer = "body";
      if (art) {
        // a real fighter: the cell, its feet pivot on the fighter's ground point, its stance scaled to the hurtbox's height
        var rung = opts.rung || "hi";
        out.push({ k: "sprite", layer: "body", tag: "sprite" + f.side, side: f.side, fighter: hero.fighter, rung: rung, cell: art.cell, move: art.move, phase: art.phase || null, ko: art.move === "ko" || art.move === "knockdown",
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
