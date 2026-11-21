/* lib/stagemath.js — VFX-LAB-3. Where an actor stands, how big it is, where it travels and which way it faces. Pure: every
   input is a field-local rectangle, so the same numbers come out in a browser and in a test.
   place(o) — o = { card:{x,y,w,h} (the played card), side:'me'|'opp' (the attacker's half on screen), fieldW, fieldH,
                    band:{x,y,w,h}|null (the ENEMY cards' band), refHeight (the manifest's tallest cell), facing:'left'|'right',
                    extent?:{up,down,left,right} (the manifest's drawn reach around the pivot, in manifest px, over every cell — extentOf()),
                    emergeExtent?:{…} (the same over the EMERGE cells only — extentOf(m, ['emerge'])),
                    exitExtent?:{…} (the same over the cells a procedural exit grows: FIZZLE's, or ACT's when it has none),
                    travelScale?:0–1 (LAB-10, default 1), exitGrows?:boolean (default true — a NATIVE exit plays the clip's own cells and
                    never grows or lifts the figure, so it needs no room for that; the procedural fade grows it 1.06 and lifts it 10 px) }
   → { anchor (the feet), height, scale, travel{x,y} (the ACT's full reach), dirY (-1 up, +1 down), dirX, flipX, shift (px the feet
       gave way below the card's base), fit (height ÷ the full 2.1 card heights), floorY (the lowest y any part may reach — the emerge
       rise stops there), below (the manifest's reach below the feet), riseFromX (where the rise starts: the card's own centre when the
       rise pose fits there, else the anchor), slideX (anchor.x − the card's centre) }
   HERO-FIT-1 (owner rulings 2026-11-21, amending the 14 Sep ruling in one case only): A HERO IS ALWAYS SHOWN WHOLE — no part of the
   figure leaves the field on any edge, on any frame, in any phase (the rise, the action at full reach, the exit's growth and lift).
   FULL SIZE, 2.1 card heights, wherever the whole figure fits — there the 14 Sep rulings hold exactly (the same size on both seats,
   upright, the feet at the card's base when there is room). WHERE IT DOES NOT FIT: MOVE FIRST, inside the ROOM between the enemy
   cards' band and the field's edges. A8: CLEARANCE GIVES WAY BEFORE SIZE — against the field's edges the 6 px clearance is a
   preference and may go down to 0 before the figure is drawn smaller; against the enemy cards the 6 px always stays. ONLY IF MOVING IS
   NOT ENOUGH, draw it smaller by just enough to fit, never below 1.4 card heights. Below 1.4, only the never-touch-the-enemy-cards
   guard (A1) gives way — the room grows to the field's own edges; THE FIELD'S EDGE NEVER GIVES WAY. A7: TOO SMALL TO SHOW — where even
   that room cannot hold the whole figure at 1.4 card heights, place() DECLINES ({ declined:true }) and no figure is shown: the play
   takes the classic presentation, exactly as when a figure is not ready, and nothing waits (the caller asks before it plans). The
   reach toward the enemy takes what room is left. Nothing is depicted on the target.
   A SIDEWAYS SLIDE (owner note 2026-11-21, condition a — smooth, no frame-to-frame jump): when the figure must move sideways and its RISE
   pose fits on its own card, it rises there and drifts to the slid position as it grows (the stage eases x from riseFromX to anchor.x over
   EMERGE, the same easing as its fade and grow-in); otherwise it is slid from the start. Both ends of the drift fit, so every frame does.
   FACING: the actor charges across the board toward the enemy half, leaning toward the open side of the field (a card left
   of centre charges right). A manifest drawn facing left is mirrored when the charge goes right (mirror:true).
   UPRIGHT ALWAYS (owner ruling 2026-09-14): an actor stands upright on both seats; a seat swap mirrors it horizontally only. An action
   that points up its frame (aim:"up" — Indra's bolt) fires up on both seats — on the top seat, up and off the board. The stage's
   contact flash and camera impulse still point at the true target (dirY: toward the enemy half). */
(function (root) {
  'use strict';
  var GAP = 6, WANT = 2.1, FLOOR = 1.4, REACH = 0.55;
  // the stage's own pose envelope (lib/actorstage.js): the exit grows the figure to 1.06 about its feet and lifts it 10 px
  var EXIT_GROW = 1.06, EXIT_LIFT = 10;
  // the drawn reach of a manifest around its pivot, over every cell (manifest px): up = above the feet, down = below, left/right unmirrored
  function extentOf(m, phases) {
    var e = { up: 0, down: 0, left: 0, right: 0 }, only = null;
    if (phases && m && m.phases) { only = {}; phases.forEach(function (ph) { (m.phases[ph] || []).forEach(function (ci) { only[ci] = 1; }); }); }
    (m && m.cells || []).forEach(function (c, ci) {
      if (only && !only[ci]) return;
      if (!c || !c.pivot) return;
      e.up = Math.max(e.up, c.pivot.y); e.down = Math.max(e.down, c.h - c.pivot.y);
      e.left = Math.max(e.left, c.pivot.x); e.right = Math.max(e.right, c.w - c.pivot.x);
    });
    return e;
  }
  function place(o) {
    var c = o.card, ref = o.refHeight || 1, ts = o.travelScale == null ? 1 : o.travelScale, G = o.exitGrows === false ? 1 : EXIT_GROW, LIFT = o.exitGrows === false ? 0 : EXIT_LIFT;
    // without an extent (an old caller), the figure is taken as refHeight tall above its feet and as wide as it is tall, centred
    var ex = o.extent || { up: ref, down: 0, left: ref / 2, right: ref / 2 };
    // the cells a procedural exit grows and lifts (FIZZLE's own cells, or ACT's when it has none); without it, every cell (an old caller)
    var fx = o.exitExtent || ex;
    var full = c.h * WANT, minH = c.h * FLOOR, base = c.y + c.h * 0.94, me = o.side === 'me';
    var dirX = (c.x + c.w / 2) <= o.fieldW / 2 ? 1 : -1, flipX = o.facing === 'left' ? dirX > 0 : dirX < 0;
    var L = flipX ? ex.right : ex.left, R = flipX ? ex.left : ex.right, LF = flipX ? fx.right : fx.left, RF = flipX ? fx.left : fx.right;
    // the room: between the enemy cards' band (6 px, always) and the field's edges (gap: 6 px preferred, down to 0 — A8)
    function room(guard, gap) {
      var top = gap, bottom = o.fieldH - gap;
      if (guard && o.band) { if (me) top = Math.max(top, o.band.y + o.band.h + GAP); else bottom = Math.min(bottom, o.band.y - GAP); }
      return { top: top, bottom: bottom, left: gap, right: o.fieldW - gap };
    }
    // the span the whole play needs at scale s, around the feet: EVERY cell at full scale (a late device draws an unreached rise cell
    // at full size in ACT), and a procedural exit's own cells grown 1.06 about the feet and lifted 10 px
    function upAt(s) { return Math.max(ex.up * s, fx.up * s * G + LIFT); }
    function downAt(s) { return Math.max(ex.down * s, fx.down * s * G - LIFT); }
    function leftAt(s) { return Math.max(L * s, LF * s * G); }
    function rightAt(s) { return Math.max(R * s, RF * s * G); }
    function wideAt(s) { return leftAt(s) + rightAt(s); }
    function fits(h, rm) { var sc = h / ref; return upAt(sc) + downAt(sc) <= rm.bottom - rm.top + 1e-9 && wideAt(sc) <= rm.right - rm.left + 1e-9; }
    // the largest height (≤ full) whose whole play fits a room, standing still (reach takes what is left afterwards) — exact: the
    // fit is monotonic in the height, so a bisection to well under a hundredth of a pixel finds just what the room truly holds
    function fitH(rm) {
      if (fits(full, rm)) return full;
      var lo = 0, hi = full;
      for (var i = 0; i < 40; i++) { var mid = (lo + hi) / 2; if (fits(mid, rm)) lo = mid; else hi = mid; }
      return lo;
    }
    // A8: the size is judged against the room with the field-edge clearance at 0 (the enemy cards keep their 6 px)
    var guarded = true, H = room(true, 0), height = full;
    if (!fits(full, H)) {
      height = fitH(H);
      // below the floor: only the never-touch guard gives way — the room becomes the field's own
      if (height < minH) {
        guarded = false; H = room(false, 0); height = fitH(H);
        // A7: too small to show even there — decline; the caller plays the classic presentation and nothing waits
        if (height < minH - 1e-9) return { declined: true, reason: 'too-small', fit: height / full, floor: FLOOR / WANT, dirY: me ? -1 : 1 };
      }
    }
    var P = room(guarded, GAP);
    // the bounds the figure keeps to: the preferred 6 px from the field's edges, given way (evenly, by just enough) toward 0 — A8
    function keep(pLo, pHi, hLo, hHi, need) {
      var d = need - (pHi - pLo); if (d <= 0) return [pLo, pHi];
      var sLo = pLo - hLo, sHi = hHi - pHi, S = sLo + sHi, k = S > 0 ? Math.min(1, d / S) : 1;
      return [pLo - sLo * k, pHi + sHi * k];
    }
    var s = height / ref, up = upAt(s), down = downAt(s), vb = keep(P.top, P.bottom, H.top, H.bottom, up + down);
    // MOVE: the feet at the card's base, moved by exactly enough to keep the whole figure inside the room
    var feet = Math.min(Math.max(base, vb[0] + up), vb[1] - down);
    // the reach toward the enemy takes what room is left
    var reach = c.h * REACH * ts, travelY = me ? -Math.max(0, Math.min(reach, (feet - up) - vb[0])) : Math.max(0, Math.min(reach, vb[1] - (feet + down)));
    // horizontally: the charge leans to the open side; the figure (and its reach) stays inside the room, moved first, the charge cut
    // second; the edge clearance gives way only for the figure itself, never for its charge
    var x = c.x + c.w / 2, open = dirX > 0 ? o.fieldW - x : x;
    var travelX = dirX * Math.max(0, Math.min(c.w * 0.45, open - c.w * 0.8)) * ts;
    var lx = leftAt(s), rx = rightAt(s), hb = keep(P.left, P.right, H.left, H.right, lx + rx), span = hb[1] - hb[0];
    if (lx + rx + Math.abs(travelX) > span) travelX = dirX * Math.max(0, span - lx - rx);
    var minX = Math.min(x, x + travelX) - lx, maxX = Math.max(x, x + travelX) + rx;
    var cx = x;
    if (minX < hb[0]) x += hb[0] - minX; else if (maxX > hb[1]) x -= maxX - hb[1];
    // the rise starts on the card when the rise pose (its own cells, at most full scale) fits there, else at the slid anchor
    var ee = o.emergeExtent, eL = ee ? (flipX ? ee.right : ee.left) * s : lx, eR = ee ? (flipX ? ee.left : ee.right) * s : rx;
    var riseFromX = (cx - eL >= hb[0] - 1e-9 && cx + eR <= hb[1] + 1e-9) ? cx : x;
    var r = { top: vb[0], bottom: vb[1], left: hb[0], right: hb[1] };
    return { anchor: { x: x, y: feet }, height: height, scale: s, travel: { x: travelX, y: travelY }, dirY: me ? -1 : 1, dirX: dirX, flipX: flipX,
             shift: feet - base, fit: height / full, guarded: guarded, floorY: r.bottom, room: r, below: ex.down, riseFromX: riseFromX, slideX: x - cx };
  }
  // the actor's vertical extent at a fraction k of its reach (feet at the bottom, top = feet − height)
  function extentAt(pl, k) { var feet = pl.anchor.y + pl.travel.y * k; return { top: feet - pl.height, feet: feet, bottom: feet }; }
  // does the actor, at any point of its reach, touch the band?
  function touchesBand(pl, band) {
    if (!band) return false;
    for (var k = 0; k <= 1.0001; k += 0.05) { var ex = extentAt(pl, k); if (ex.top < band.y + band.h && ex.bottom > band.y) return true; }
    return false;
  }
  var OUT = { place: place, extentOf: extentOf, extentAt: extentAt, touchesBand: touchesBand, GAP: GAP, WANT: WANT, FLOOR: FLOOR, EXIT_GROW: EXIT_GROW, EXIT_LIFT: EXIT_LIFT };
  root.StageMath = OUT;
  if (typeof module !== 'undefined' && module.exports) module.exports = OUT;
})(typeof window !== 'undefined' ? window : this);
