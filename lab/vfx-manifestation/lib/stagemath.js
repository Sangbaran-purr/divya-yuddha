/* lib/stagemath.js — VFX-LAB-3. Where an actor stands, how big it is, where it travels and which way it faces. Pure: every
   input is a field-local rectangle, so the same numbers come out in a browser and in a test.
   place(o) — o = { card:{x,y,w,h} (the played card), side:'me'|'opp' (the attacker's half on screen), fieldW, fieldH,
                    band:{x,y,w,h}|null (the ENEMY cards' band), refHeight (the manifest's tallest cell), facing:'left'|'right' }
   → { anchor (the feet), height, scale, travel{x,y} (the ACT's full reach), dirY (-1 up, +1 down), dirX, flipX, shift (px the feet
       gave way below the card's base) }
   THE SAME SIZE ON BOTH SEATS (owner ruling 2026-09-14): height = the card's height × WANT on either seat — scale is fixed per card
   (height ÷ the manifest's tallest cell) and never shrinks for want of room. PLACEMENT GIVES WAY, NEVER SCALE: the feet start at the
   card's base; a figure that would leave the board's top edge moves DOWN by exactly the overflow (it may overlap its own card and
   row); a figure that would touch the enemy cards moves by exactly enough not to. The reach toward the enemy then takes what room
   is left.
   THE A1 GUARD: the actor never reaches the enemy cards — on the bottom half its top stops short of the enemy band at full reach; on
   the top half its feet do. When the board edge and A1 cannot both hold, A1 wins. Nothing is depicted on the target.
   FACING: the actor charges across the board toward the enemy half, leaning toward the open side of the field (a card left
   of centre charges right). A manifest drawn facing left is mirrored when the charge goes right (mirror:true).
   UPRIGHT ALWAYS (owner ruling 2026-09-14): an actor stands upright on both seats; a seat swap mirrors it horizontally only. An action
   that points up its frame (aim:"up" — Indra's bolt) fires up on both seats — on the top seat, up and off the board. The stage's
   contact flash and camera impulse still point at the true target (dirY: toward the enemy half). */
(function (root) {
  'use strict';
  var GAP = 6, WANT = 2.1, REACH = 0.55;
  function place(o) {
    var c = o.card, height = c.h * WANT, reach = c.h * REACH, base = c.y + c.h * 0.94, feet = base, travelY;
    if (o.side === 'me') {
      // the enemy is above: the top stops short of the enemy band; standing still would touch it → give way DOWN by exactly enough
      var limit = o.band ? o.band.y + o.band.h + GAP : GAP;
      if (feet - height < limit) feet = limit + height;
      travelY = -Math.max(0, Math.min(reach, (feet - height) - limit));
    } else {
      // the enemy is below: a figure that would leave the board's top edge gives way DOWN by exactly the overflow; then A1 keeps the
      // feet short of the enemy band (by moving, never shrinking — A1 wins over the board edge)
      var floor = o.band ? o.band.y - GAP : o.fieldH - GAP;
      if (feet - height < 0) feet = height;
      if (feet > floor) feet = floor;
      travelY = Math.max(0, Math.min(reach, floor - feet));
    }
    var anchor = { x: c.x + c.w / 2, y: feet };
    var dirX = anchor.x <= o.fieldW / 2 ? 1 : -1;
    var open = dirX > 0 ? o.fieldW - anchor.x : anchor.x;
    var travelX = dirX * Math.max(0, Math.min(c.w * 0.45, open - c.w * 0.8));
    var flipX = o.facing === 'left' ? dirX > 0 : dirX < 0;
    return { anchor: anchor, height: height, scale: o.refHeight ? height / o.refHeight : 1, travel: { x: travelX, y: travelY }, dirY: o.side === 'me' ? -1 : 1, dirX: dirX, flipX: flipX, shift: feet - base };
  }
  // the actor's vertical extent at a fraction k of its reach (feet at the bottom, top = feet − height)
  function extentAt(pl, k) { var feet = pl.anchor.y + pl.travel.y * k; return { top: feet - pl.height, feet: feet, bottom: feet }; }
  // does the actor, at any point of its reach, touch the band?
  function touchesBand(pl, band) {
    if (!band) return false;
    for (var k = 0; k <= 1.0001; k += 0.05) { var ex = extentAt(pl, k); if (ex.top < band.y + band.h && ex.bottom > band.y) return true; }
    return false;
  }
  var OUT = { place: place, extentAt: extentAt, touchesBand: touchesBand, GAP: GAP };
  root.StageMath = OUT;
  if (typeof module !== 'undefined' && module.exports) module.exports = OUT;
})(typeof window !== 'undefined' ? window : this);
