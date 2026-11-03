/* ARCADE-1 · THE SCENE (R1): a fight state → a list of plain shapes in the 960×540 logical view. Pure, so the suite can
   check what is drawn (a hitbox only on active frames, the crouch box, the camera) and either backend — Pixi or the
   Canvas 2D floor — just draws the list. Box fighters until R3 brings real ones.
   UMD: window.ARC_SCENE (needs ARC_MOVES, ARC_FIGHT), Node require. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("../core/moves.js"), require("../core/fight.js"));
  else root.ARC_SCENE = factory(root.ARC_MOVES, root.ARC_FIGHT);
})(this, function (M, F) {
  "use strict";
  var VIEW_W = 960, VIEW_H = 540, GROUND_Y = 470;

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
    var cam = cameraX(g), out = [];
    function rect(r, fill, alpha, tag, stroke) { out.push({ k: "rect", x: r.x, y: r.y, w: r.w, h: r.h, fill: fill, alpha: alpha == null ? 1 : alpha, stroke: stroke || null, tag: tag || "" }); }
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
      var color = flash ? 0xffffff : f.state === "ko" ? 0x555555 : hero.color;
      rect(hb, color, f.state === "ko" ? 0.5 : 0.9, "body" + f.side, f.state === "blockstun" || f.state === "block" || f.state === "cblock" ? { width: 3, color: 0x7fe0ff } : null);
      // a side marker over the head (gold = you, red = the opponent), so a mirror match reads
      rect({ x: hb.x + hb.w / 2 - 14, y: hb.y - 14, w: 28, h: 6 }, f.side === 0 ? 0xe8c874 : 0xd8574a, 0.95, "marker" + f.side);
      // a "face" on the front edge, so facing reads
      var faceX = f.facing === 1 ? hb.x + hb.w - 10 : hb.x;
      rect({ x: faceX, y: hb.y + 14, w: 10, h: 18 }, 0x120c05, 0.9, "face" + f.side);
      // the move in progress: startup shows a thin wind-up bar, active shows the real hitbox
      var box = F.hitbox(f);
      if (box) rect(toView(box, cam), 0xff4030, 0.55, "hitbox" + f.side);
      else if (f.state === "attack" && !F.isActive(f) && f.mf < M.MOVES[f.move].startup) {
        var w = 8 + 40 * f.mf / M.MOVES[f.move].startup;
        rect({ x: f.facing === 1 ? hb.x + hb.w : hb.x - w, y: hb.y + 60, w: w, h: 6 }, 0xffb060, 0.7, "windup" + f.side);
      }
      if (opts.debug) out.push({ k: "rect", x: hb.x, y: hb.y, w: hb.w, h: hb.h, fill: null, alpha: 1, stroke: { width: 1, color: 0x60ff90 }, tag: "hurt" + f.side });
    });
    g.proj.forEach(function (p) { rect(toView(F.projBox(p), cam), 0xffd76a, 0.95, "proj" + p.owner); });
    return { cam: cam, shapes: out };
  }

  return { VIEW_W: VIEW_W, VIEW_H: VIEW_H, GROUND_Y: GROUND_Y, cameraX: cameraX, build: build };
});
