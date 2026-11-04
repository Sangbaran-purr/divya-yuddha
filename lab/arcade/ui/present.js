/* ARCADE-1 · THE PRESENTATION LAYER (enhancement test). Everything here is LOOK, never logic: it reads the fight after each
   logic tick and adds shapes; the fight core, its 60 Hz step and its frame data are untouched. Deterministic (no Math.random —
   a capture of the same bout is the same video). UMD: window.ARC_PRESENT (needs ARC_FIGHT, ARC_SCENE), Node require.

   The owner's switches (?fx / ?cam), all defaulting to the R0–R2 baseline:
     fx=1    the feel layer: hit-flash, sparks, shake + punch-zoom on heavy/special, knockback dust, landing dust, ground shadows,
             a motion trail on strike frames, slow-mo + zoom on a K.O. (in the page), the Vajra pillar on Indra's special, and
             borrowed art for moves that have no clip yet (scene.artCell fallback)
     cam=tight  the dynamic camera (scene.cameraTarget) */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("../core/fight.js"), require("./scene.js"));
  else root.ARC_PRESENT = factory(root.ARC_FIGHT, root.ARC_SCENE);
})(this, function (F, S) {
  "use strict";
  var SPARK = { indra: 0xffd66b, meghnad: 0x8a1020, other: 0xffffff };   // gold for the Vajra, dark red for the spear
  var FADE = 3;                // logic frames a move change cross-fades over (fps ≥ 24)
  var TRAIL = 2;               // ghosts behind a strike
  var VAJRA = { loop: [10, 20], burst: [21, 35], anchor: { x: 223, y: 242.1 }, height: 1.25 };   // cells of the copied clip; pillar = 1.25 stances tall

  function parseModes(search) {
    var q = {}; String(search || "").replace(/^\?/, "").split("&").forEach(function (kv) { if (!kv) return; var p = kv.split("="); q[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || ""); });
    return { fx: q.fx === "1", fps: 12, cam: q.cam === "tight" ? "tight" : "wide", demo: q.demo === "1" || !!q.capture, capture: q.capture || null,
      perf: q.perf === "1", cpu: Math.max(1, Math.min(10, parseFloat(q.cpu) || 1)), raw: q };
  }

  function create(modes) {
    return { modes: modes, ev: 0, parts: [], shake: 0, shakeAmp: 0, punch: 0, flash: [0, 0], fade: [null, null], last: [null, null],
      trail: [[], []], prevState: [null, null], proj: {}, bursts: [], tick: 0 };
  }

  // hit point: the defender's front edge, at the attacker's hitbox mid-height (the event carries no position)
  function hitPoint(g, def, att) {
    var dir = att.x < def.x ? -1 : 1;
    return { x: def.x / F.U + dir * 26, h: def.y / F.U + 150 };
  }
  function spawn(P, n, base, o) {
    for (var i = 0; i < n; i++) {
      var a = (o.a0 || 0) + (o.spread || Math.PI * 2) * ((i + 0.5) / n) + Math.sin((P.tick + i) * 12.9898) * 0.25;
      var sp = (o.speed || 6) * (0.6 + 0.4 * Math.abs(Math.sin((P.tick * 7 + i) * 3.17)));
      P.parts.push({ x: base.x, h: base.h, vx: Math.cos(a) * sp, vh: Math.sin(a) * sp, life: o.life || 14, max: o.life || 14,
        r: o.r || 3, color: o.color, glow: !!o.glow, g: o.g == null ? 0.4 : o.g });
    }
  }

  // ONE logic tick of presentation: new events → effects; particles and timers advance
  function tick(P, g, built, mans) {
    P.tick++;
    var evs = g.events.slice(P.ev); P.ev = g.events.length;
    var fx = P.modes.fx;
    evs.forEach(function (e) {
      if (!fx) return;
      if (e.t === "hit" || e.t === "block") {
        var def = g.f[e.side], att = g.f[e.by], heroA = att.hero, pt = hitPoint(g, def, att);
        var col = e.t === "block" ? 0x9fe8ff : (SPARK[heroA] || SPARK.other);
        spawn(P, e.t === "block" ? 8 : 14, pt, { color: col, speed: e.t === "block" ? 4 : 7, life: 16, r: 2.6, glow: true, g: 0.25 });
        if (e.t === "hit") {
          P.flash[e.side] = 7;
          if (e.move === "heavy" || e.move === "special") { P.shake = 12; P.shakeAmp = 7; P.punch = 0.07; }
          else { P.shake = Math.max(P.shake, 5); P.shakeAmp = Math.max(P.shakeAmp, 3); }
        }
      }
    });
    if (fx) g.f.forEach(function (f, i) {
      var prev = P.prevState[i];
      if (prev === "jump" && f.state !== "jump" && f.y === 0) spawn(P, 10, { x: f.x / F.U, h: 2 }, { color: 0xb59a6a, speed: 3, life: 18, r: 5, a0: 0, spread: Math.PI, g: -0.05 });
      if ((f.state === "hitstun" || f.state === "blockstun") && Math.abs(f.vx) > 2 * F.U && P.tick % 3 === 0)
        spawn(P, 2, { x: f.x / F.U - Math.sign(f.vx) * 20, h: 2 }, { color: 0xa88f63, speed: 1.5, life: 16, r: 6, a0: Math.PI * 0.1, spread: Math.PI * 0.8, g: -0.04 });
      P.prevState[i] = f.state;
    });
    // projectiles → the Vajra pillar while alive, a burst where it ends
    var alive = {};
    g.proj.forEach(function (p) { alive[p.owner] = p; });
    [0, 1].forEach(function (o) {
      var was = P.proj[o];
      if (was && !alive[o] && fx && g.f[o].hero === "indra") P.bursts.push({ x: was.x, cell: VAJRA.burst[0] });
      P.proj[o] = alive[o] ? { x: alive[o].x / F.U, dir: alive[o].dir } : null;
    });
    P.bursts = P.bursts.filter(function (b) { b.cell += 0.4; return b.cell <= VAJRA.burst[1]; });   // 24 fps clip on a 60 Hz tick
    P.parts = P.parts.filter(function (p) { p.x += p.vx; p.h += p.vh; p.vh -= p.g; p.life--; return p.life > 0; });
    if (P.shake > 0) P.shake--; else P.shakeAmp = 0;
    P.punch *= 0.86; if (P.punch < 0.002) P.punch = 0;
    for (var i = 0; i < 2; i++) if (P.flash[i] > 0) P.flash[i]--;
    // cross-fade + trail bookkeeping from what was drawn
    if (built) built.shapes.filter(function (s) { return s.k === "sprite"; }).forEach(function (s) {
      var i = s.side, L = P.last[i];
      if (P.modes.fps >= 24 && L && L.move !== s.move && L.fighter === s.fighter) P.fade[i] = { cell: L.cell, fighter: L.fighter, t: FADE };
      else if (P.fade[i]) { P.fade[i].t--; if (P.fade[i].t <= 0) P.fade[i] = null; }
      var striking = fx && s.phase && s.phase !== "recovery";
      if (striking) { if (!L || L.cell !== s.cell) { P.trail[i].unshift(L ? L.cell : s.cell); P.trail[i].length = Math.min(P.trail[i].length, TRAIL); } }
      else P.trail[i] = [];
      P.last[i] = { move: s.move, cell: s.cell, fighter: s.fighter };
    });
  }

  // the camera this frame: the scene's target, eased; plus shake and punch
  function camera(P, g, prev, dt) {
    var tgt = S.cameraTarget(g, P.modes.cam);
    var cam = S.easeCamera(prev, tgt, dt);
    if (P.modes.cam === "wide") cam = { x: tgt.x, zoom: 1 };   // the fixed camera does not ease
    return cam;
  }
  function shaken(P, cam) {
    if (!P.modes.fx) return cam;
    var amp = P.shake > 0 ? P.shakeAmp * (P.shake / 12) : 0;
    return { x: cam.x + Math.sin(P.tick * 2.3) * amp, zoom: cam.zoom * (1 + P.punch) };
  }

  // the extra shapes for this frame, in screen space (built = scene.build's result with the same camera)
  function shapes(P, g, built) {
    var out = [], z = built.zoom || 1, cam = built.cam, cx = S.VIEW_W / 2, GY = S.GROUND_Y, fx = P.modes.fx;
    function sx(wx) { return ((wx - cam) - cx) * z + cx; }
    function sy(h) { return GY - h * z; }
    var sprites = built.shapes.filter(function (s) { return s.k === "sprite"; });
    if (fx) g.f.forEach(function (f) {   // soft ground shadows (smaller and fainter in the air)
      var air = Math.min(1, f.y / F.U / 120);
      out.push({ k: "ellipse", layer: "shadow", x: sx(f.x / F.U), y: GY + 2, rx: 54 * z * (1 - 0.35 * air), ry: 10 * z * (1 - 0.35 * air), fill: 0x000000, alpha: 0.38 * (1 - 0.5 * air), tag: "shadow" + f.side });
    });
    sprites.forEach(function (s) {
      var i = s.side, fd = P.fade[i];
      if (fd && fd.fighter === s.fighter) out.push(Object.assign({}, s, { cell: fd.cell, alpha: fd.t / (FADE + 1), layer: "under", tag: "fade" + i }));
      if (fx) P.trail[i].forEach(function (c, k) {   // ghosts of the previous strike cells, a little behind the striker
        var behind = (s.flip ? 1 : -1) * (10 + 14 * k) * z;
        out.push(Object.assign({}, s, { cell: c, x: s.x + behind, alpha: k === 0 ? 0.33 : 0.16, layer: "under", tag: "trail" + i + "_" + k }));
      });
      if (fx && P.flash[i] > 0) out.push(Object.assign({}, s, { white: true, alpha: Math.min(0.85, P.flash[i] / 7), layer: "over", tag: "flash" + i }));
      if (fx && s.ko) { s.rotation = (s.flip ? 1 : -1) * 0.5; s.alpha = 0.75; }
    });
    if (fx) {
      [0, 1].forEach(function (o) {
        var p = P.proj[o];
        if (!p || g.f[o].hero !== "indra") return;
        var span = VAJRA.loop[1] - VAJRA.loop[0] + 1, cell = VAJRA.loop[0] + Math.floor(P.tick * 0.4) % span;
        out.push({ k: "sprite", layer: "glow", atlas: "vajra", cell: cell, x: sx(p.x), y: sy(0), scale: 220 * VAJRA.height / VAJRA.anchor.y * z, flip: false, alpha: 1, blend: "add", tag: "vajra" + o });
      });
      P.bursts.forEach(function (b, k) {
        out.push({ k: "sprite", layer: "glow", atlas: "vajra", cell: Math.floor(b.cell), x: sx(b.x), y: sy(0), scale: 220 * VAJRA.height / VAJRA.anchor.y * z, flip: false, alpha: 1, blend: "add", tag: "vajraburst" + k });
      });
      P.parts.forEach(function (p, k) {
        var a = Math.max(0, p.life / p.max);
        out.push({ k: "ellipse", layer: p.glow ? "glow" : "fx", x: sx(p.x), y: sy(p.h), rx: p.r * z * (p.glow ? 1 : 1 + (1 - a)), ry: p.r * z * (p.glow ? 1 : 1 + (1 - a)), fill: p.color, alpha: p.glow ? a : a * 0.45, tag: "part" });
      });
    }
    return out;
  }

  return { parseModes: parseModes, create: create, tick: tick, camera: camera, shaken: shaken, shapes: shapes, SPARK: SPARK, FADE: FADE, VAJRA: VAJRA };
});
