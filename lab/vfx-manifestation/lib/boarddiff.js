/* lib/boarddiff.js — VFX-LAB-1. The board difference: what changed between two board snapshots. Pure, no DOM, no engine.
   Ruling A1: the animation is the statement, the BOARD is the truth. Meghnad's strike on a Hero emits no event
   (src/engine.js — the on-play case changes the Hero's power and logs; nothing is emitted), so the outcome a
   manifestation hands back to the board must come from here, not from the event stream.
   A snapshot is { seats: [{ units:[card], heroes:[card], artifact:card|null, ... }, …] }, a card { uid, id, n, power, eff, venom, bound, ghost }.
   boardDiff(before, after) → { entered:[…], left:[…], changed:[…] } over cards ON THE BOARD (units, heroes, artifact);
   ghosts are left out (a ghost is a cell, not a card). Loaded in the browser as window.BoardDiff, in node via require. */
(function (root) {
  'use strict';
  var ZONES = ['units', 'heroes'];
  function index(snap) {
    var m = {};
    (snap.seats || []).forEach(function (st, seat) {
      ZONES.forEach(function (zone) { (st[zone] || []).forEach(function (c, i) { if (c && !c.ghost && c.uid != null) m[c.uid] = { seat: seat, zone: zone, slot: i, card: c }; }); });
      if (st.artifact && st.artifact.uid != null) m[st.artifact.uid] = { seat: seat, zone: 'artifact', slot: 0, card: st.artifact };
    });
    return m;
  }
  function brief(x) { return { uid: x.card.uid, id: x.card.id, n: x.card.n, seat: x.seat, zone: x.zone, power: x.card.power, eff: x.card.eff }; }
  function boardDiff(before, after) {
    var A = index(before), B = index(after), out = { entered: [], left: [], changed: [] };
    Object.keys(B).forEach(function (u) { if (!A[u]) out.entered.push(brief(B[u])); });
    Object.keys(A).forEach(function (u) { if (!B[u]) out.left.push(brief(A[u])); });
    Object.keys(B).forEach(function (u) {
      var a = A[u], b = B[u]; if (!a) return;
      var ch = { uid: b.card.uid, id: b.card.id, n: b.card.n, seat: b.seat, zone: b.zone };
      var any = false;
      ['power', 'eff', 'venom'].forEach(function (k) { if (a.card[k] !== b.card[k]) { ch[k] = { from: a.card[k], to: b.card[k], delta: b.card[k] - a.card[k] }; any = true; } });
      if (!!a.card.bound !== !!b.card.bound) { ch.bound = { from: !!a.card.bound, to: !!b.card.bound }; any = true; }
      if (a.seat !== b.seat || a.zone !== b.zone) { ch.moved = { from: [a.seat, a.zone], to: [b.seat, b.zone] }; any = true; }
      if (any) out.changed.push(ch);
    });
    var bySlot = function (x, y) { return (x.seat - y.seat) || String(x.zone).localeCompare(String(y.zone)) || (x.uid - y.uid); };
    out.entered.sort(bySlot); out.left.sort(bySlot); out.changed.sort(bySlot);
    return out;
  }
  var OUT = { boardDiff: boardDiff };
  root.BoardDiff = OUT;
  if (typeof module !== 'undefined' && module.exports) module.exports = OUT;
})(typeof window !== 'undefined' ? window : this);
