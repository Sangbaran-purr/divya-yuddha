/* ARCADE-1 · the shared moveset template and the archetype stat table (docs/ARCADE_v1.md §2, ruling 8).
   Every Hero is built from this one template. Gameplay runs on these logic frames (60 Hz); the art is stretched onto the
   phases, so fight timing never depends on what a Kling clip produced. Geometry is in logical px (stage height 540, the
   fighter's standing hurtbox 220 tall), measured from the fighter's centre along its facing and up from the ground.
   UMD: browser window.ARC_MOVES, Node require. Pure data — nothing here changes at run time. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.ARC_MOVES = factory();
})(this, function () {
  "use strict";

  // The body. Standing and crouching hurtboxes; heavy (a "high") whiffs over a crouch because its hitbox starts above 120.
  var BODY = { halfW: 30, standH: 220, crouchH: 120 };

  // The template. startup / active / recovery in logic frames; mf counts from 0 at the move's first frame, so the active
  // frames are mf = startup … startup + active − 1. height: "mid" must be blocked, "high" can also be ducked.
  // cancel: what this move may cancel into, once it has connected (hit or block), from its first active frame through
  // cancelAfter frames of recovery.
  var MOVES = {
    light: { startup: 5, active: 3, recovery: 9, dmg: 50, chip: 0, hitstun: 14, blockstun: 10, hitstop: 6, push: 3,
      height: "mid", box: { x0: 25, x1: 95, y0: 100, y1: 160 }, cancel: ["light", "heavy", "special"], cancelAfter: 4, cells: 6 },
    heavy: { startup: 12, active: 4, recovery: 18, dmg: 110, chip: 0, hitstun: 22, blockstun: 16, hitstop: 8, push: 6,
      height: "high", box: { x0: 25, x1: 110, y0: 140, y1: 210 }, cancel: ["special"], cancelAfter: 4, cells: 9 },
    special: { startup: 16, active: 8, recovery: 26, dmg: 200, chip: 40, hitstun: 30, blockstun: 20, hitstop: 8, push: 8,
      height: "mid", box: { x0: 20, x1: 90, y0: 60, y1: 180 }, cancel: [], cancelAfter: 0, cells: 14, cost: 100 },
    // 14 THE THROW (owner ruling 5, 2026-11-04; frame data proposed). Light + Heavy together (a light started at most 2 frames
    // earlier still converts, when in range). Close range only, unblockable: it beats a blocking or crouching opponent. On the
    // first active frame it grabs a grounded opponent who is standing, walking, crouching, blocking, parried or in an attack
    // (never one in hit/blockstun, knocked down, getting up, in the air, parrying or already in a throw). The grab holds HOLD
    // frames: the TECH WINDOW — the grabbed side pressing Light + Heavy during the hold breaks free (both pushed apart, no
    // damage); pressing too early starts its own throw, which is grabbed in its startup. Otherwise the throw lands: dmg, a
    // knockdown, the thrower recovers AFTER frames. A whiffed throw recovers `recovery` frames — the risk. Two throws grabbing
    // on the same frame break each other.
    throw: { startup: 5, active: 2, recovery: 20, dmg: 120, chip: 0, hitstop: 0, push: 0, height: "throw", range: 90,
      hold: 7, after: 16, techPush: 4, techStun: 14, cancel: [], cancelAfter: 0, cells: 10 }
  };
  // 10b KNOCKDOWN + GET-UP (owner ruling 5; frame data proposed). A special that hits, a throw, and a heavy that FINISHES a
  // combo (it hits a defender already in hitstun: the light→heavy cancel) knock down instead of the usual hitstun.
  // fall frames on the ground (sliding back at push, with friction), then getup frames rising; INVULNERABLE throughout —
  // no hit, shot or throw touches a fighter who is down or rising (no off-the-ground combos in v1). Actionable after.
  var KNOCKDOWN = { fall: 36, getup: 20, push: 6, cells: { fall: 8, getup: 6 } };
  // 13 THE PARRY (owner ruling 5; frame data proposed). A press of Block (a fresh press, not a hold) opens a WINDOW of 6
  // frames; a hit that lands inside it is parried: no damage and no chip, PARRY.hitstop on both, the attacker is pushed back
  // and stunned stunAttacker frames, the parrier recovers in `recovery` — a +18 window, long enough to walk in and land even a
  // heavy (a guaranteed punish). Not spammable: every press starts a LOCKOUT, and no new window opens until it has run out,
  // so mashing Block parries at most one press in 40 frames. A parried shot is simply gone. A throw cannot be parried.
  var PARRY = { window: 6, lockout: 40, hitstop: 10, stunAttacker: 30, recovery: 6, push: 3, cells: 5 };
  var CHAIN_MAX = 1;          // light may cancel into light once
  var METER = { max: 100, onHit: 8, onTaken: 5, onBlock: 2 };
  var JUMP = { v0: 12, g: 0.6, fwd: 4 };    // a 40-frame arc, peak 120 px (v0²/2g); horizontal 4 px/frame if a direction is held
  var PROJECTILE = { y0: 30, y1: 80, halfW: 20, startX: 60 };   // low enough that a jump at its peak clears it
  var FRICTION = 0.5;         // px/frame² on knockback while stunned
  var ROUND_SECONDS = 60;

  // The animation cells per move (12 fps art), for the clip card and the size budget. Not used by the logic.
  // 15 moves per Hero (ruling 5 of 2026-11-04: the 12 + 10b knockdown/get-up + 13 parry + 14 throw; a thrown Hero plays 10b).
  var CELLS = { idle: 8, walkForward: 8, walkBack: 8, jump: 9, crouch: 4, light: 6, heavy: 9, special: 14, block: 3, hit: 4, knockdown: 14, ko: 10, win: 10, parry: 5, throw: 10 };
  var CLIPS = ["01_idle", "02_walkforward", "03_walkback", "04_jump", "05_crouch", "06_light", "07_heavy", "08_special", "09_block", "10_hit", "10b_knockdown", "11_ko", "12_win", "13_parry", "14_throw"];

  // The archetype stat table (ruling 8: archetypes, not card power). dmg is a percentage applied to the template's damage.
  // reachPx lengthens the light and heavy hitboxes' far edge; recoveryAdd lengthens their recovery (logic frames).
  var ARCH = {
    allrounder: { hp: 1000, walkF: 4, walkB: 3, dmg: 100, special: "projectile", projSpeed: 9 },                      // Indra (owner ruling 4, 2026-11-03)
    reach:      { hp: 1000, walkF: 4, walkB: 3, dmg: 100, special: "rush", rushSpeed: 10, reachPx: 45, recoveryAdd: 2 }, // Meghnad: longest reach, slightly slower recovery
    balanced: { hp: 1000, walkF: 4, walkB: 3, dmg: 100, special: "projectile", projSpeed: 9 },
    rushdown: { hp: 900,  walkF: 5, walkB: 4, dmg: 108, special: "rush", rushSpeed: 10 },
    zoner:    { hp: 950,  walkF: 3, walkB: 3, dmg: 95,  special: "projectile", projSpeed: 11 },
    tank:     { hp: 1150, walkF: 3, walkB: 2, dmg: 100, special: "rush", rushSpeed: 8 }
  };

  // The roster: three placeholder box Heroes, and the slice's two real Heroes as their clips arrive.
  var HEROES = {
    box_surya: { id: "box_surya", name: "Box · Surya", arch: "balanced", color: 0xe8c874 },
    box_rakta: { id: "box_rakta", name: "Box · Rakta", arch: "rushdown", color: 0xd8574a },
    box_varna: { id: "box_varna", name: "Box · Varna", arch: "zoner", color: 0x5aa7d8 },
    // the clip test: real art for idle and light (fighters/<id>/); every other move still draws as a box
    indra:   { id: "indra", name: "Indra", arch: "allrounder", color: 0xe8c874, fighter: "indra" },
    meghnad: { id: "meghnad", name: "Meghnad", arch: "reach", color: 0x9b4fd1, fighter: "meghnad" }
  };

  return { BODY: BODY, MOVES: MOVES, KNOCKDOWN: KNOCKDOWN, PARRY: PARRY, CLIPS: CLIPS, CHAIN_MAX: CHAIN_MAX, METER: METER, JUMP: JUMP, PROJECTILE: PROJECTILE, FRICTION: FRICTION,
    ROUND_SECONDS: ROUND_SECONDS, CELLS: CELLS, ARCH: ARCH, HEROES: HEROES };
});
