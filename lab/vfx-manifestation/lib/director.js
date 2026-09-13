/* lib/director.js — VFX-LAB-2. The Manifestation Director: a ClashContext → a DETERMINISTIC timed plan. Pure, card-agnostic.
   GRAMMAR (A1 — single actor, nothing depicted on the target): AWAKEN → EMERGE → ACT → FIZZLE → SETTLE, then the rest of the
   batch, queued. SETTLE is where floating numbers land from the board difference — no cue before it carries a number.
   DURATION: the rarity ladder (C 1.8 s · U/R 2.5 s · E/L 3.5 s · M 4.5 s) for every card; a card the registry marks
   ladderExempt (ruling A3: the pilot, Meghnad) plays the full grammar in 3.2 s. Fast = half of Full. Reduced = no actor:
   a card pulse, then SETTLE.
   THE REPEAT RULE: a card's second and later manifestations in a match play Fast (Reduced stays Reduced). The caller passes
   how many times this card has already manifested (createMemory() keeps that count per match).
   A2: a play outside Hero/Unit gets no actor phases — SETTLE and the queue only (its existing effect VFX is not the lab's).
   Browser: window.Director. Node: require. */
(function (root) {
  'use strict';
  var GRAMMAR = [['AWAKEN', 400], ['EMERGE', 600], ['ACT', 1200], ['FIZZLE', 600], ['SETTLE', 400]];   // the pilot's 3.2 s, in proportion
  var PILOT_MS = 3200;
  var LADDER_MS = { C: 1800, U: 2500, R: 2500, E: 3500, L: 3500, M: 4500 };
  var FAST = 0.5;
  var CONTACT = 0.58;                                                                            // contact lands 58% into ACT
  var HIT = { full: { hitstopMs: 60, flashMs: 90, impulseMs: 180, impulsePx: 5 }, fast: { hitstopMs: 50, flashMs: 70, impulseMs: 140, impulsePx: 4 } };
  var REDUCED = [['PULSE', 300], ['SETTLE', 300]];
  var EFFECT_ONLY = [['SETTLE', 300]];
  var QUEUE_GAP = { full: 450, fast: 250, reduced: 200, effect: 250 };

  function phasesOf(spec, total) {
    var sum = spec.reduce(function (a, p) { return a + p[1]; }, 0), t = 0, out = [];
    spec.forEach(function (p, i) { var d = i === spec.length - 1 ? total - t : Math.round(p[1] * total / sum); out.push({ name: p[0], t0: t, t1: t + d }); t += d; });
    return out;
  }
  function settleOf(ctx) {
    var changes = [], floats = [];
    ctx.boardDiff.forEach(function (e) {
      if (e.kind === 'enter') changes.push({ kind: 'enter', uid: e.uid, n: e.n, to: e.settleTo });
      else if (e.kind === 'power' && e.settleDelta) { changes.push({ kind: 'power', uid: e.uid, n: e.n, from: e.from, to: e.from + e.settleDelta, delta: e.settleDelta }); floats.push({ uid: e.uid, delta: e.settleDelta }); }
      else if (e.kind === 'left') changes.push({ kind: 'left', uid: e.uid, n: e.n, toDiscard: e.toDiscard });
      else if (e.kind === 'status') changes.push({ kind: 'status', uid: e.uid, n: e.n, status: e.status });
    });
    return { changes: changes, floats: floats };
  }

  function plan(ctx, opts) {
    if (!ctx) return null;
    opts = opts || {};
    var requested = opts.mode === 'fast' || opts.mode === 'reduced' ? opts.mode : 'full';
    var inScope = ctx.scope === 'manifest';
    var prior = Math.max(0, opts.prior | 0);
    var mode, repeat = false;
    if (!inScope) mode = requested === 'reduced' ? 'reduced' : 'effect';
    else if (requested === 'reduced') mode = 'reduced';
    else { repeat = prior >= 1; mode = repeat ? 'fast' : requested; }
    var actor = inScope && (mode === 'full' || mode === 'fast');
    var ladder = opts.ladderExempt ? 'exempt (A3 pilot)' : 'rarity ' + (ctx.rarity || '?');
    var full = opts.ladderExempt ? PILOT_MS : (LADDER_MS[ctx.rarity] || LADDER_MS.R);
    var phases, total;
    if (mode === 'full' || mode === 'fast') { total = Math.round(mode === 'fast' ? full * FAST : full); phases = phasesOf(GRAMMAR, total); }
    else if (mode === 'reduced') { total = 600; phases = phasesOf(REDUCED, total); }
    else { total = 300; phases = phasesOf(EFFECT_ONLY, total); }
    var at = function (name) { return phases.filter(function (p) { return p.name === name; })[0]; };
    var cues = [], seq = 0;
    var cue = function (t, name, o) { var c = { t: t, cue: name, seq: seq++ }; for (var k in (o || {})) c[k] = o[k]; cues.push(c); };
    var towardSeat = 1 - ctx.seat;
    cue(0, 'board-entry', { state: true });
    if (actor) {
      var A = at('AWAKEN'), E = at('EMERGE'), C = at('ACT'), Z = at('FIZZLE'), S = at('SETTLE'), hit = HIT[mode];
      cue(A.t0, 'portal-open', { faction: ctx.faction, dur: A.t1 - A.t0 + (E.t1 - E.t0) });
      cue(E.t0, 'actor-phase', { phase: 'emerge', dur: E.t1 - E.t0 });
      cue(C.t0, 'actor-phase', { phase: 'act', dur: C.t1 - C.t0, contactFrac: CONTACT, towardSeat: towardSeat });
      cue(C.t0 + Math.round((C.t1 - C.t0) * CONTACT), 'contact', { towardSeat: towardSeat, hitstopMs: hit.hitstopMs, flashMs: hit.flashMs, impulseMs: hit.impulseMs, impulsePx: hit.impulsePx });
      cue(Z.t0, 'actor-phase', { phase: 'fizzle', dur: Z.t1 - Z.t0 });
      cue(Z.t0, 'exit-fx', { faction: ctx.faction });
      cue(S.t0, 'actor-gone', { state: true });
      var st = settleOf(ctx); cue(S.t0, 'settle', { state: true, changes: st.changes, floats: st.floats });
    } else if (mode === 'reduced' && inScope) {
      var Pp = at('PULSE'), Sr = at('SETTLE');
      cue(Pp.t0, 'card-pulse', { dur: Pp.t1 - Pp.t0 });
      var sr = settleOf(ctx); cue(Sr.t0, 'settle', { state: true, changes: sr.changes, floats: sr.floats });
    } else {
      var se = settleOf(ctx); cue(at('SETTLE').t0, 'settle', { state: true, changes: se.changes, floats: se.floats });
    }
    var gap = QUEUE_GAP[mode];
    ctx.rest.forEach(function (ev, i) { cue(total + i * gap, 'queue', { state: true, index: i, event: ev }); });
    var end = total + ctx.rest.length * gap;
    cue(end, 'done', { state: true });
    cues.sort(function (a, b) { return (a.t - b.t) || (a.seq - b.seq); });
    return { version: 1, cardId: ctx.cardId, cardName: ctx.cardName, seat: ctx.seat, towardSeat: towardSeat, faction: ctx.faction,
             requestedMode: requested, mode: mode, repeat: repeat, prior: prior, actor: actor, ladder: ladder, total: total, end: end, phases: phases, cues: cues };
  }

  function formatPlan(p) {
    if (!p) return '(no plan)';
    var head = p.cardName + ' · seat ' + p.seat + ' → toward seat ' + p.towardSeat + ' · mode ' + p.mode + (p.repeat ? ' (repeat rule: ' + p.prior + ' earlier)' : '') +
      (p.requestedMode !== p.mode ? ' · asked ' + p.requestedMode : '') + ' · ' + (p.actor ? 'actor' : 'no actor') + ' · ladder ' + p.ladder + ' · manifestation ' + p.total + ' ms · batch ends ' + p.end + ' ms';
    var ph = p.phases.map(function (x) { return x.name + ' ' + x.t0 + '–' + x.t1; }).join('  ·  ');
    var lines = p.cues.map(function (c) {
      var extra = c.cue === 'settle' ? ' ' + c.changes.map(function (x) { return x.kind === 'power' ? x.n + ' ' + x.from + '→' + x.to + ' (' + (x.delta > 0 ? '+' : '−') + Math.abs(x.delta) + ')' : x.kind === 'enter' ? x.n + ' enters at ' + x.to : x.kind + ' ' + x.n; }).join(', ')
        : c.cue === 'queue' ? ' ' + c.event.type + (c.event.abilityName ? ' · ' + c.event.abilityName : '') + (c.event.amount != null ? ' ' + (c.event.amount > 0 ? '+' : '') + c.event.amount : '') + (c.event.text ? ' "' + c.event.text + '"' : '')
        : c.cue === 'actor-phase' ? ' ' + c.phase + ' (' + c.dur + ' ms)' : c.cue === 'contact' ? ' hit-stop ' + c.hitstopMs + ' ms · flash ' + c.flashMs + ' ms · impulse ' + c.impulsePx + ' px toward seat ' + c.towardSeat
        : c.cue === 'portal-open' || c.cue === 'exit-fx' ? ' ' + c.faction : c.cue === 'card-pulse' ? ' ' + c.dur + ' ms' : '';
      return ('     ' + c.t).slice(-5) + ' ms  ' + c.cue + extra;
    });
    return [head, ph].concat(lines).join('\n');
  }

  function createMemory() {
    var seen = {};
    return { count: function (id) { return seen[id] || 0; }, record: function (id) { seen[id] = (seen[id] || 0) + 1; return seen[id]; }, reset: function () { seen = {}; } };
  }

  var OUT = { plan: plan, formatPlan: formatPlan, createMemory: createMemory, GRAMMAR: GRAMMAR, PILOT_MS: PILOT_MS, LADDER_MS: LADDER_MS, FAST: FAST, CONTACT: CONTACT };
  root.Director = OUT;
  if (typeof module !== 'undefined' && module.exports) module.exports = OUT;
})(typeof window !== 'undefined' ? window : this);
