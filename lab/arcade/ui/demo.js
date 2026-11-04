/* ARCADE-1 · THE DEMO BOUT (enhancement test): Indra (side 0) vs Meghnad (side 1), both scripted, deterministic — the same bout
   in every mode, so the owner compares like with like and a capture of it is reproducible. It drives the real fight core
   through inputs only, plus three stated nudges for the camera's sake: a full meter before each special, and Indra's health
   lowered before the last exchange so the bout ends on a K.O. (?demo=1 plays it on a loop; ?capture=<name> records it.)
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
    { name: "Meghnad charges", nudge: function (g) { g.f[1].meter = 100; }, until: function (g, d) { return d <= 180; }, input: [0, B.L] },
    { name: "the charge", press: [0, B.SP], settle: 50 },
    { name: "last exchange", nudge: function (g) { g.f[0].hp = Math.min(g.f[0].hp, 40); }, until: function (g, d) { return d <= 165; }, input: [0, B.L] },
    { name: "the K.O.", press: [0, B.LT], settle: 200 }
  ];
  function create() { return { step: 0, t: 0, pressed: false, nudged: false }; }
  function free(f) { return f.state === "idle" || f.state === "walkf" || f.state === "walkb"; }
  // the inputs for this logic frame (call once per tick, before stepping)
  function inputs(D, g) {
    var s = STEPS[D.step]; if (!s || g.over) return [0, 0];
    var d = Math.abs(g.f[1].x - g.f[0].x) / F.U, both = free(g.f[0]) && free(g.f[1]);
    if (!D.nudged && s.nudge && both) { s.nudge(g); D.nudged = true; }
    var out = [0, 0], done = false;
    if (s.frames != null) { done = D.t >= s.frames; }
    else if (s.until) { if (both) out = s.until(g, d) ? [0, 0] : s.input.slice(); done = both && s.until(g, d) || (s.max && D.t >= s.max); }
    else if (s.press) {
      if (!D.pressed) { if (both) { out = s.press.slice(); D.pressed = true; D.t = 0; } }
      else { if (s.then && D.t === s.then.at) out = s.then.input.slice(); done = D.t >= s.settle; }
    }
    D.t++;
    if (done) { D.step++; D.t = 0; D.pressed = false; D.nudged = false; }
    return out;
  }
  return { LINEUPS: LINEUPS, STEPS: STEPS, create: create, inputs: inputs };
});
