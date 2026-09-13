/* lib/clashcontext.js — VFX-LAB-2. The ClashContext adapter: one play's event batch + the board before and after → the
   honest facts a manifestation may use. Pure, no DOM, no engine.
   HONEST FIELDS ONLY (STEP-0): who played what, from which seat, and what the board did. There is no "action" (the engine
   emits no attack), no "lethal" for Heroes (Hero power floors at 0; the death sweep reads Units only), no "shielded" (Dharma
   Shield covers Units only, and emits nothing when it prevents). A1: the board is the truth.
   THE SPLIT that keeps the board honest and the queue un-swallowed: every board change is split into the part the batch's own
   later events already carry (buff / damage / venom amounts on their targets) and the part no event carries. The SETTLE
   lands only the un-evented part; the queued events land theirs after it. For Meghnad: Indra −2 has no event → it lands at
   SETTLE; Meghnad's +1 is the Chaos Surge buff event → it lands when that queued event plays. The final board equals the
   engine's AFTER snapshot exactly.
   Browser: window.ClashContext (needs window.BoardDiff). Node: require. */
(function (root) {
  'use strict';
  var BD = (typeof module !== 'undefined' && module.exports) ? require('./boarddiff.js') : root.BoardDiff;
  var SCOPE = { hero: true, unit: true };                     // A2 — Hero and Unit plays manifest; everything else keeps its effect VFX
  var EVENTED = { buff: true, damage: true, venom: true };    // events that carry a power delta (amount) on their targets
  var clone = function (x) { return JSON.parse(JSON.stringify(x)); };

  function locate(snap, uid) {
    if (!snap) return null;
    for (var s = 0; s < snap.seats.length; s++) {
      var st = snap.seats[s], zones = ['units', 'heroes', 'hand'];
      for (var z = 0; z < zones.length; z++) { var row = st[zones[z]] || [];
        for (var i = 0; i < row.length; i++) if (row[i] && row[i].uid === uid) return { seat: s, zone: zones[z], index: i, card: row[i] }; }
      if (st.artifact && st.artifact.uid === uid) return { seat: s, zone: 'artifact', index: 0, card: st.artifact };
    }
    return null;
  }

  function fromBatch(batch) {
    var events = (batch && batch.events) || [], before = batch && batch.before, after = batch && batch.after;
    var play = events[0] && events[0].type === 'play' ? events[0] : null;
    if (!play || !before || !after) return null;
    var hit = locate(after, play.sourceUid) || locate(before, play.sourceUid);
    if (!hit) return null;
    var rest = events.slice(1), evented = {};
    rest.forEach(function (e) { if (EVENTED[e.type] && e.amount != null) (e.targetUids || []).forEach(function (u) { evented[u] = (evented[u] || 0) + Number(e.amount); }); });
    var d = BD.boardDiff(before, after), diff = [];
    d.entered.forEach(function (x) { var ev = evented[x.uid] || 0;
      diff.push({ kind: 'enter', uid: x.uid, id: x.id, n: x.n, seat: x.seat, zone: x.zone, to: x.eff, evented: ev, settleTo: x.eff - ev }); });
    d.changed.forEach(function (x) {
      var ev = evented[x.uid] || 0;
      if (x.eff) diff.push({ kind: 'power', uid: x.uid, id: x.id, n: x.n, seat: x.seat, zone: x.zone, from: x.eff.from, to: x.eff.to, delta: x.eff.delta, evented: ev, settleDelta: x.eff.delta - ev });
      var status = {}; var any = false;
      ['venom', 'bound', 'moved'].forEach(function (k) { if (x[k]) { status[k] = x[k]; any = true; } });
      if (any) diff.push({ kind: 'status', uid: x.uid, id: x.id, n: x.n, seat: x.seat, zone: x.zone, status: status });
    });
    d.left.forEach(function (x) {
      var grew = (after.seats[x.seat].discard || []).filter(function (id) { return id === x.id; }).length > (before.seats[x.seat].discard || []).filter(function (id) { return id === x.id; }).length;
      diff.push({ kind: 'left', uid: x.uid, id: x.id, n: x.n, seat: x.seat, zone: x.zone, from: x.eff, toDiscard: grew });
    });
    var c = hit.card;
    return {
      sourceUid: play.sourceUid, cardId: c.id, cardName: c.n, cardType: c.t, rarity: c.r || null,
      faction: after.seats[hit.seat].faction, seat: hit.seat, scope: SCOPE[c.t] ? 'manifest' : 'out',
      boardDiff: diff, rest: rest,
    };
  }

  // the three boards a manifestation shows: ENTRY (the card is down, nothing has happened), SETTLE (the un-evented changes
  // landed), FINAL (the engine's AFTER). Each is a snapshot of the same shape as before/after.
  function boards(ctx, before, after) {
    var settle = clone(after);
    ctx.boardDiff.forEach(function (e) {
      if ((e.kind === 'enter' || e.kind === 'power') && e.evented) { var h = locate(settle, e.uid); if (h) { h.card.eff -= e.evented; h.card.power -= e.evented; } }
    });
    var entry = clone(settle);
    ctx.boardDiff.forEach(function (e) {
      if (e.kind === 'power' && e.settleDelta) { var h = locate(entry, e.uid); if (h) { h.card.eff -= e.settleDelta; h.card.power -= e.settleDelta; } }
      if (e.kind === 'left') { var b = locate(before, e.uid); if (b && entry.seats[b.seat][b.zone]) entry.seats[b.seat][b.zone].splice(Math.min(b.index, entry.seats[b.seat][b.zone].length), 0, clone(b.card)); }
    });
    return { entry: entry, settle: settle, final: clone(after) };
  }

  // apply one queued event's evented power to a working board (the same arithmetic the split subtracted)
  function applyEvent(board, ev) {
    if (!EVENTED[ev.type] || ev.amount == null) return [];
    var floats = [];
    (ev.targetUids || []).forEach(function (u) { var h = locate(board, u); if (h) { h.card.eff += Number(ev.amount); h.card.power += Number(ev.amount); floats.push({ uid: u, delta: Number(ev.amount) }); } });
    return floats;
  }

  // the board as the eye reads it: per seat, the cards on the board with their power
  function project(board) {
    return board.seats.map(function (st) { return ['heroes', 'units'].map(function (z) { return (st[z] || []).filter(function (c) { return c && !c.ghost; }).map(function (c) { return [c.uid, c.id, c.eff]; }); }); });
  }

  var OUT = { fromBatch: fromBatch, boards: boards, applyEvent: applyEvent, project: project, locate: locate, SCOPE: SCOPE };
  root.ClashContext = OUT;
  if (typeof module !== 'undefined' && module.exports) module.exports = OUT;
})(typeof window !== 'undefined' ? window : this);
