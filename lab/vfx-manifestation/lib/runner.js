/* lib/runner.js — VFX-LAB-2. Plays a Director plan against a clock: dispatches cues in order, and guarantees cleanup.
   Pure (the clock and the handlers are injected). Cues marked state:true change what the board shows (board-entry, settle,
   queue, actor-gone, done); the rest are visuals.
     start({ from, to })  from > 0 applies every earlier STATE cue instantly (skipped:true), visuals before it never play;
                          to ends the run at that time (a single-phase replay; a cue AT `to` belongs to the next phase)
     tick()               advance by the clock × speed and dispatch what is due
     skip()               apply every remaining STATE cue instantly (skipped:true), never a visual, then clean up
     fastForward(k)       play the rest at k×
     finish()             end now and clean up — once, whatever path got here
   Browser: window.Runner. Node: require. */
(function (root) {
  'use strict';
  function create(plan, handlers, now) {
    var cues = plan.cues, r = { t: 0, speed: 1, i: 0, last: 0, running: false, done: false, to: null, dispatched: [] };
    function dispatch(c, skipped) { r.dispatched.push({ cue: c.cue, t: c.t, skipped: !!skipped }); try { handlers.cue(c, { skipped: !!skipped }); } catch (e) { if (handlers.error) handlers.error(e, c); } }
    r.start = function (o) {
      o = o || {}; var from = Math.max(0, o.from || 0);
      r.to = o.to != null ? o.to : null; r.t = from; r.i = 0; r.done = false;
      while (r.i < cues.length && cues[r.i].t < from) { var c = cues[r.i++]; if (c.state) dispatch(c, true); }
      r.last = now(); r.running = true; return r;
    };
    r.tick = function () {
      if (!r.running || r.done) return;
      var n = now(); r.t += (n - r.last) * r.speed; r.last = n;
      // a cue at exactly a replay's end belongs to the NEXT phase: a single-phase replay stops just short of it
      while (r.i < cues.length && cues[r.i].t <= r.t && (r.to == null || cues[r.i].t < r.to) && !r.done) dispatch(cues[r.i++], false);
      if (r.to != null && r.t >= r.to) { r.finish(); return; }
      if (r.i >= cues.length) r.finish();
    };
    r.skip = function () { if (r.done) return; while (r.i < cues.length) { var c = cues[r.i++]; if (c.state) dispatch(c, true); } r.finish(); };
    r.fastForward = function (k) { r.speed = Math.max(0.05, +k || 1); };
    r.finish = function () { if (r.done) return; r.done = true; r.running = false; if (handlers.cleanup) { try { handlers.cleanup(); } catch (e) { if (handlers.error) handlers.error(e, null); } } };
    return r;
  }
  var OUT = { create: create };
  root.Runner = OUT;
  if (typeof module !== 'undefined' && module.exports) module.exports = OUT;
})(typeof window !== 'undefined' ? window : this);
