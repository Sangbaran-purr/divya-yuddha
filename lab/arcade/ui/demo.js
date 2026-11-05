/* ARCADE-1 · THE DEMO BOUT (enhancement test): Indra (side 0) vs Meghnad (side 1), both scripted, deterministic — the same bout
   in every mode, so the owner compares like with like and a capture of it is reproducible. It drives the real fight core
   through inputs only, plus three stated nudges for the camera's sake: a full meter before each special, and Indra's health
   lowered before the last exchange so the bout ends on a K.O. (?demo=1 plays it on a loop; ?capture=<name> records it.)
   Two more scripts for the full-moveset cut (2026-11-04): ?demo=moves — Indra through EVERY move (walk, walk back, crouch, jump, light,
   heavy, his block, a light and a heavy taken, a parry, a throw, a knockdown and get-up, the Vajra, Meghnad's Nagapasha binding him,
   and the win); ?demo=ko — Indra's K.O. Nudges are stated in each step (a full meter, health lowered for the finish).
   UMD: window.ARC_DEMO (needs ARC_FIGHT), Node require. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("../core/fight.js"));
  else root.ARC_DEMO = factory(root.ARC_FIGHT);
})(this, function (F) {
  "use strict";
  var B = F.BTN;
  var LINEUPS = [["indra", "box_surya", "box_varna"], ["meghnad", "box_rakta", "box_varna"]];
  // each step: who acts, what it does, when it is done. "free" = that side is idle (able to act).
  var STEPS = [
    { name: "standoff", frames: 40 },
    { name: "close in", until: function (g, d) { return d <= 165; }, input: [B.R, B.L] },
    { name: "Meghnad's spear", press: [0, B.LT], settle: 24 },
    { name: "Indra closes", until: function (g, d) { return d <= 100; }, input: [B.R, 0] },
    { name: "Indra light → heavy", press: [B.LT, 0], then: { at: 7, input: [B.HV, 0] }, settle: 40 },
    { name: "Indra backs off", nudge: function (g) { g.f[0].meter = 100; }, until: function (g, d) { return d >= 300; }, input: [B.L, 0], max: 90 },
    { name: "Indra's Vajra", press: [B.SP, 0], settle: 70 },
    { name: "Meghnad closes", nudge: function (g) { g.f[1].meter = 100; }, until: function (g, d) { return d <= 220; }, input: [0, B.L] },
    { name: "the Nagapasha", press: [0, B.SP], settle: 70 },
    { name: "last exchange", nudge: function (g) { g.f[0].hp = Math.min(g.f[0].hp, 40); }, until: function (g, d) { return d <= 165; }, input: [0, B.L] },
    { name: "the K.O.", press: [0, B.LT], settle: 200 }
  ];
  var MOVES = [
    { name: "standoff", frames: 30 },
    { name: "walk forward", frames: 50, input: [B.R, 0] },
    { name: "walk back", frames: 40, input: [B.L, 0] },
    { name: "crouch", frames: 45, input: [B.D, 0] },
    { name: "rise", frames: 10 },
    { name: "jump", press: [B.U, 0], settle: 50 },
    { name: "close in", until: function (g, d) { return d <= 190; }, input: [B.R, 0] },
    { name: "light", press: [B.LT, 0], settle: 30 },
    { name: "heavy", press: [B.HV, 0], settle: 50 },
    { name: "Meghnad closes", until: function (g, d) { return d <= 200; }, input: [0, B.L], max: 120 },   // his light now ends at the spear (218)
    { name: "Meghnad's light, blocked", press: [B.BL, 0], hold: [B.BL, 0], then: { at: 12, input: [B.BL, B.LT] }, settle: 46 },   // the guard is up before the poke: a block, not a parry
    { name: "Meghnad closes", until: function (g, d) { return d <= 200; }, input: [0, B.L], max: 120 },
    { name: "a light taken", press: [0, B.LT], settle: 34 },
    { name: "Meghnad closes", until: function (g, d) { return d <= 200; }, input: [0, B.L], max: 120 },
    { name: "a heavy taken", press: [0, B.HV], settle: 50 },
    { name: "Meghnad closes", until: function (g, d) { return d <= 200; }, input: [0, B.L], max: 120 },
    { name: "the parry", press: [0, B.HV], then: { at: 9, input: [B.BL, 0] }, settle: 46 },
    { name: "close for the throw", until: function (g, d) { return d <= 80; }, input: [B.R, 0], max: 120 },
    { name: "the throw", press: [B.LT | B.HV, 0], settle: 80 },
    { name: "Meghnad closes", until: function (g, d) { return d <= 200; }, input: [0, B.L], max: 120 },
    { name: "knocked down (Meghnad's light → heavy)", press: [0, B.LT], then: { at: 7, input: [0, B.HV] }, settle: 90 },
    { name: "back off", nudge: function (g) { g.f[0].meter = 100; }, until: function (g, d) { return d >= 320; }, input: [B.L, 0], max: 120 },
    { name: "the Vajra", press: [B.SP, 0], settle: 75 },
    { name: "Meghnad closes", nudge: function (g) { g.f[1].meter = 100; }, until: function (g, d) { return d <= 260; }, input: [0, B.L], max: 120 },
    { name: "the Nagapasha binds Indra", press: [0, B.SP], settle: 80 },
    { name: "the last exchange", nudge: function (g) { g.f[1].hp = Math.min(g.f[1].hp, 40); }, until: function (g, d) { return d <= 190; }, input: [B.R, 0], max: 120 },
    { name: "Indra's win", press: [B.LT, 0], settle: 240 }
  ];
  var KO = [
    { name: "standoff", frames: 30 },
    { name: "close in", until: function (g, d) { return d <= 230; }, input: [B.R, B.L] },
    { name: "the K.O.", nudge: function (g) { g.f[0].hp = Math.min(g.f[0].hp, 40); }, press: [0, B.HV], settle: 240 }
  ];
  var WALK = [   // ?demo=walk: the walk alone — 2 s forward, 2 s back (the owner's skate check)
    { name: "standoff", frames: 20 },
    { name: "walk forward 2 s", frames: 120, input: [B.R, 0] },
    { name: "walk back 2 s", frames: 120, input: [B.L, 0] },
    { name: "hold", frames: 30 }
  ];
  // ?demo=meghnad (the full cut, 2026-11-05): MEGHNAD (side 1, facing left) through every move — Indra is his partner
  var MEGHNAD = [
    { name: "standoff", frames: 30 },
    { name: "walk forward", frames: 50, input: [0, B.L] },
    { name: "walk back", frames: 40, input: [0, B.R] },
    { name: "crouch", frames: 45, input: [0, B.D] },
    { name: "rise", frames: 10 },
    { name: "jump", press: [0, B.U], settle: 50 },
    { name: "close in", until: function (g, d) { return d <= 230; }, input: [0, B.L] },
    { name: "light", press: [0, B.LT], settle: 34 },
    { name: "heavy", press: [0, B.HV], settle: 54 },
    { name: "Indra's light, blocked", press: [B.LT, B.R], hold: [0, B.R], settle: 34 },
    { name: "Indra closes", until: function (g, d) { return d <= 180; }, input: [B.R, 0], max: 120 },
    { name: "a light taken", press: [B.LT, 0], settle: 34 },
    { name: "Indra closes", until: function (g, d) { return d <= 180; }, input: [B.R, 0], max: 120 },
    { name: "a heavy taken", press: [B.HV, 0], settle: 50 },
    { name: "Indra closes", until: function (g, d) { return d <= 180; }, input: [B.R, 0], max: 120 },
    { name: "the parry, then the automatic counter", press: [B.HV, 0], then: { at: 9, input: [0, B.BL] }, settle: 60 },
    { name: "close for the throw", until: function (g, d) { return d <= 80; }, input: [0, B.L], max: 120 },
    { name: "the spear-hook throw", press: [0, B.LT | B.HV], settle: 90 },
    { name: "Indra closes", until: function (g, d) { return d <= 180; }, input: [B.R, 0], max: 120 },
    { name: "knocked down (Indra's light → heavy), the get-up", press: [B.LT, 0], then: { at: 7, input: [B.HV, 0] }, settle: 100 },
    { name: "back off", nudge: function (g) { g.f[1].meter = 100; }, until: function (g, d) { return d >= 300; }, input: [0, B.R], max: 120 },
    { name: "the Nagapasha binds Indra", press: [0, B.SP], settle: 80 },
    { name: "the last exchange", nudge: function (g) { g.f[0].hp = Math.min(g.f[0].hp, 40); }, until: function (g, d) { return d <= 230; }, input: [0, B.L], max: 120 },
    { name: "Meghnad's win", press: [0, B.HV], settle: 240 }
  ];
  var MWALK = [   // ?demo=mwalk: Meghnad's walk alone (side 1, facing left) — 2 s forward, 2 s back at his own 120 / 90 px/s
    { name: "standoff", frames: 20 },
    { name: "walk forward 2 s", frames: 120, input: [0, B.L] },
    { name: "walk back 2 s", frames: 120, input: [0, B.R] },
    { name: "hold", frames: 30 }
  ];
  // the Kling effect layer (2026-11-05): ?demo=fxvajra — Indra's Vajra on a hit, then on a block; ?demo=fxnaga — the Nagapasha on a hit
  // (the full bind and its fade), then on a block. Nudges: a full meter before each special.
  var FXVAJRA = [
    { name: "standoff", frames: 20 },
    { name: "the Vajra, a hit", nudge: function (g) { g.f[0].meter = 100; }, press: [B.SP, 0], settle: 90 },
    { name: "the Vajra, blocked", nudge: function (g) { g.f[0].meter = 100; }, press: [B.SP, B.R], hold: [0, B.R], settle: 90 },
    { name: "hold", frames: 30 }
  ];
  var FXNAGA = [
    { name: "standoff", frames: 20 },
    { name: "the Nagapasha, a hit and the full bind", nudge: function (g) { g.f[1].meter = 100; }, press: [0, B.SP], settle: 110 },
    { name: "the Nagapasha, blocked", nudge: function (g) { g.f[1].meter = 100; }, press: [B.L, B.SP], hold: [B.L, 0], settle: 80 },
    { name: "hold", frames: 30 }
  ];
  var SCRIPTS = { bout: STEPS, moves: MOVES, ko: KO, walk: WALK, meghnad: MEGHNAD, mwalk: MWALK, fxvajra: FXVAJRA, fxnaga: FXNAGA };
  function create(name) { return { step: 0, t: 0, pressed: false, nudged: false, steps: SCRIPTS[name] || STEPS }; }
  function free(f) { return f.state === "idle" || f.state === "walkf" || f.state === "walkb"; }
  // the inputs for this logic frame (call once per tick, before stepping)
  function inputs(D, g) {
    var s = (D.steps || STEPS)[D.step]; if (!s || g.over) return [0, 0];
    var d = Math.abs(g.f[1].x - g.f[0].x) / F.U, both = free(g.f[0]) && free(g.f[1]);
    if (!D.nudged && s.nudge && both) { s.nudge(g); D.nudged = true; }
    var out = [0, 0], done = false;
    if (s.frames != null) { if (s.input) out = s.input.slice(); done = D.t >= s.frames; }
    else if (s.until) { if (both) out = s.until(g, d) ? [0, 0] : s.input.slice(); done = both && s.until(g, d) || (s.max && D.t >= s.max); }
    else if (s.press) {
      if (!D.pressed) { if (both) { out = s.press.slice(); D.pressed = true; D.t = 0; } }
      else { if (s.hold) out = s.hold.slice(); if (s.then && D.t === s.then.at) out = s.then.input.slice(); done = D.t >= s.settle; }
    }
    D.t++;
    if (done) { D.step++; D.t = 0; D.pressed = false; D.nudged = false; }
    return out;
  }
  return { LINEUPS: LINEUPS, STEPS: STEPS, SCRIPTS: SCRIPTS, create: create, inputs: inputs };
});
