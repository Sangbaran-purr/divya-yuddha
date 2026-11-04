/* ARCADE-1 · CONTROLS (R2): keyboard and touch → the core's input bitmask. Pure functions, no DOM, so the suite tests them.
   Touch: a FLOATING STICK on the left half (it is born where the thumb lands; 8-way; a dead zone in the middle) and four
   buttons on the right (Light, Heavy, Special, Block) + a fifth, GRAB (owner ruling 3, 2026-11-04: = Light + Heavy, the throw).
   Holding back also blocks — the core reads both. The Light + Heavy chord still throws on keyboard and touch.
   UMD: window.ARC_CONTROLS (needs ARC_FIGHT), Node require. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("../core/fight.js"));
  else root.ARC_CONTROLS = factory(root.ARC_FIGHT);
})(this, function (F) {
  "use strict";
  var B = F.BTN;
  var DEADZONE = 18;      // CSS px from the stick's birth point before a direction counts
  var STICK_MAX = 56;     // the knob's travel, CSS px (drawing only)

  // 8 sectors of 45°, centred on the axes. Screen y grows downward, so a thumb pushed UP has dy < 0.
  function stickBits(dx, dy) {
    if (Math.hypot(dx, dy) < DEADZONE) return 0;
    var a = Math.atan2(-dy, dx) * 180 / Math.PI;            // 0 = right, 90 = up
    if (a < 0) a += 360;
    var sector = Math.round(a / 45) % 8;                    // 0 R, 1 UR, 2 U, 3 UL, 4 L, 5 DL, 6 D, 7 DR
    return [B.R, B.R | B.U, B.U, B.U | B.L, B.L, B.L | B.D, B.D, B.D | B.R][sector];
  }

  var KEYS = {
    KeyA: B.L, ArrowLeft: B.L, KeyD: B.R, ArrowRight: B.R, KeyW: B.U, ArrowUp: B.U, KeyS: B.D, ArrowDown: B.D,
    KeyJ: B.LT, KeyK: B.HV, KeyL: B.SP, ShiftLeft: B.BL, ShiftRight: B.BL,
    KeyU: B.LT | B.HV                                          // the dedicated throw key (ruling 3): the same as J + K together
  };
  function keyBits(down) {   // down: a set/object of held key codes
    var bits = 0;
    for (var code in KEYS) if (down[code]) bits |= KEYS[code];
    if ((bits & B.L) && (bits & B.R)) bits &= ~(B.L | B.R);    // both ways at once = neither
    if ((bits & B.U) && (bits & B.D)) bits &= ~(B.U | B.D);
    return bits;
  }

  var BUTTONS = [
    { id: "light", label: "Light", bit: B.LT },
    { id: "heavy", label: "Heavy", bit: B.HV },
    { id: "special", label: "Special", bit: B.SP },
    { id: "block", label: "Block", bit: B.BL },
    { id: "grab", label: "Grab", bit: B.LT | B.HV }           // ruling 3: a fifth button, the throw; never over Light or Heavy (app.css)
  ];

  return { DEADZONE: DEADZONE, STICK_MAX: STICK_MAX, stickBits: stickBits, KEYS: KEYS, keyBits: keyBits, BUTTONS: BUTTONS };
});
