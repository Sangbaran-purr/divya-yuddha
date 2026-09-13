/* lib/stagemath.js — VFX-LAB-3. Where an actor stands, how big it is, where it travels and which way it faces. Pure: every
   input is a field-local rectangle, so the same numbers come out in a browser and in a test.
   place(o) — o = { card:{x,y,w,h} (the played card), side:'me'|'opp' (the attacker's half on screen), fieldW, fieldH,
                    band:{x,y,w,h}|null (the ENEMY cards' band), refHeight (the manifest's tallest cell), facing:'left'|'right' }
   → { anchor (the feet, at the card's base), height, scale, travel{x,y} (the ACT's full reach), dirY (-1 up, +1 down),
       dirX, flipX }
   THE A1 GUARD: the actor never reaches the enemy cards — on the bottom half its top stops short of the enemy band at full
   reach; on the top half its feet do. Nothing is depicted on the target.
   FACING: the actor charges across the board toward the enemy half, leaning toward the open side of the field (a card left
   of centre charges right). A manifest drawn facing left is mirrored when the charge goes right (mirror:true). */
(function (root) {
  'use strict';
  var GAP = 6, WANT = 2.1, REACH = 0.55;
  function place(o) {
    var c = o.card, anchor = { x: c.x + c.w / 2, y: c.y + c.h * 0.94 }, want = c.h * WANT, height, travelY;
    if (o.side === 'me') {
      var limit = o.band ? o.band.y + o.band.h + GAP : GAP;
      var room = Math.max(0, anchor.y - limit);
      height = Math.min(want, room * 0.84);
      travelY = -Math.max(0, Math.min(room - height, c.h * REACH));
    } else {
      var floor = o.band ? o.band.y - GAP : o.fieldH - GAP;
      height = Math.min(want, Math.max(0, anchor.y - GAP) * 0.95);
      travelY = Math.max(0, Math.min(floor - anchor.y, c.h * REACH));
    }
    var dirX = anchor.x <= o.fieldW / 2 ? 1 : -1;
    var open = dirX > 0 ? o.fieldW - anchor.x : anchor.x;
    var travelX = dirX * Math.max(0, Math.min(c.w * 0.45, open - c.w * 0.8));
    var flipX = o.facing === 'left' ? dirX > 0 : dirX < 0;
    return { anchor: anchor, height: height, scale: o.refHeight ? height / o.refHeight : 1, travel: { x: travelX, y: travelY }, dirY: o.side === 'me' ? -1 : 1, dirX: dirX, flipX: flipX };
  }
  // the actor's vertical extent at a fraction k of its reach (feet at the bottom, top = feet − height)
  function extentAt(pl, k) { var feet = pl.anchor.y + pl.travel.y * k; return { top: feet - pl.height, feet: feet }; }
  // does the actor, at any point of its reach, touch the band?
  function touchesBand(pl, band) {
    if (!band) return false;
    for (var k = 0; k <= 1.0001; k += 0.05) { var ex = extentAt(pl, k); if (ex.top < band.y + band.h && ex.feet > band.y) return true; }
    return false;
  }
  var OUT = { place: place, extentAt: extentAt, touchesBand: touchesBand, GAP: GAP };
  root.StageMath = OUT;
  if (typeof module !== 'undefined' && module.exports) module.exports = OUT;
})(typeof window !== 'undefined' ? window : this);
