/* lib/effectclip.js — LAB-19. THE ADDITIVE EFFECT CLIP: the premium effects track's first stage (owner amendment, LAB-19).
   An effect clip is NOT an actor: no matte, no rungs, no pivot, no phases, no per-actor memory ladder, no director grammar. It is black-ground
   emissive footage played ADDITIVELY on top of the board, slotted into the live game's existing effect contract for its card:
     VAJRA (index.html playEvent): the cast ('play') plays sfx_astra, then the spectacle tier holds 110 ms of hit-stop + 1000 ms; the strike
     is keyed off the RESOLUTION event ('destroy', abilityName 'Vajra') — sfx_unit_destroy, the target-anchored strike on the card's centre,
     40 ms, the card cracks, 600 ms dwell. Every beat × vfxT (speed × CHOREO_SPEED 1.3). The strike sprite is never awaited.
   So the clip STARTS inside the cast beat's hold, exactly its lead before the destroy beat, and its impact cell lands ON the destroy beat.
   Its aftermath outlives the beat, un-awaited, as the current sprite does: the wire-clock cost is max(0, lead − cast beat) = 0.
   DRAWING (the game's T72 contract): the RGB atlas gets a luminance alpha at load (alpha = max(R, G, B), the game's bakeAlpha — the black
   ground becomes fully transparent), and every cell is drawn with 'lighter'.
   BUDGET E1 (owner ruling, LAB-19, beside A5): an effect clip is capped at the effect layer's hi-rung class (~18 MB decoded); loaded on
   play, released after; at most ONE effect clip decoded at once, coexisting with at most the one decoded actor A5 allows.
   Browser: window.EffectClip. Node: require. */
(function (root) {
  'use strict';
  var CHOREO_SPEED = 1.3;
  var E1 = { capClass: 'the effect layer hi rung (the game sheet vfx_vajra hi: 3072x1536 RGBA)', capBytes: 3072 * 1536 * 4, oneAtATime: true };
  var num = function (x) { return typeof x === 'number' && isFinite(x); };

  function validate(m) {
    var e = [];
    if (!m || typeof m !== 'object') return { ok: false, errors: ['not an object'] };
    if (m.class !== 'effect-clip') e.push('class must be "effect-clip"');
    if (m.blend !== 'add') e.push('blend must be "add"');
    if (m.alpha !== 'luminance') e.push('alpha must be "luminance" (baked at load)');
    if (m.channels !== 'rgb') e.push('channels must be "rgb" (no matte)');
    if (!(m.fps > 0)) e.push('fps missing');
    ['rungs', 'phases', 'pivot', 'refHeight', 'mirror', 'contactRule'].forEach(function (k) { if (m[k] !== undefined) e.push('an effect clip carries no actor-class field "' + k + '"'); });
    var cells = m.cells;
    if (!Array.isArray(cells) || !cells.length) e.push('cells missing');
    else cells.forEach(function (c, i) {
      if (!(num(c.x) && num(c.y) && c.w > 0 && c.h > 0)) e.push('cell ' + i + ' has no rectangle');
      else if (m.atlasSize && (c.x + c.w > m.atlasSize.w || c.y + c.h > m.atlasSize.h)) e.push('cell ' + i + ' falls outside the atlas');
    });
    if (!(Number.isInteger(m.impact) && cells && m.impact >= 0 && m.impact < cells.length)) e.push('impact must name a cell');
    if (!(m.anchor && num(m.anchor.x) && num(m.anchor.y))) e.push('anchor missing');
    else if (m.cellSize && (m.anchor.x < 0 || m.anchor.y < 0 || m.anchor.x > m.cellSize.w || m.anchor.y > m.cellSize.h)) e.push('anchor falls outside the cell');
    var sr = m.scaleRule; if (!(sr && sr.ringDiameterCell > 0 && sr.cardWidths > 0)) e.push('scaleRule missing');
    var k = m.contract;
    if (!(k && k.trigger && k.abilityName && k.castSound && k.impactSound && num(k.castHitStopMs) && num(k.castHoldMs) && num(k.crackAfterMs) && num(k.destroyDwellMs))) e.push('contract missing');
    if (k && k.awaited !== false) e.push('the strike is never awaited (the current contract)');
    if (m.atlasSize && m.atlasSize.w * m.atlasSize.h * 4 > E1.capBytes) e.push('the atlas decodes past the E1 cap');
    return { ok: e.length === 0, errors: e };
  }

  // the cast and the strike this batch carries: the play of the card, and its resolution event (null when the card found no mark)
  function fromBatch(batch, m) {
    var ev = (batch && batch.events) || [], k = m.contract;
    var cast = ev[0] && ev[0].type === 'play' && ev[0].abilityName === k.abilityName ? ev[0] : null;
    var strike = ev.filter(function (x) { return x.type === k.trigger && x.abilityName === k.abilityName; })[0] || null;
    return { cast: cast, strike: strike, targetUid: strike && strike.targetUids && strike.targetUids.length ? strike.targetUids[0] : null };
  }

  // the timeline, from the contract's beats and the clip's own frames, at a speed (the game's speedMult: Normal 1, Fast 0.6)
  function timeline(m, speed, choreo) {
    var vfxT = (speed > 0 ? speed : 1) * (choreo > 0 ? choreo : CHOREO_SPEED), k = m.contract;
    var frameMs = 1000 / m.fps * vfxT, leadMs = m.impact * frameMs, totalMs = m.cells.length * frameMs;
    var castBeatMs = (k.castHitStopMs + k.castHoldMs) * vfxT, destroyAt = castBeatMs;
    return { vfxT: vfxT, frameMs: frameMs, leadMs: leadMs, totalMs: totalMs, castBeatMs: castBeatMs, destroyAt: destroyAt,
             clipStart: destroyAt - leadMs, impactAt: destroyAt - leadMs + m.impact * frameMs, crackAt: destroyAt + k.crackAfterMs * vfxT,
             beatEnd: destroyAt + (k.crackAfterMs + k.destroyDwellMs) * vfxT, clipEnd: destroyAt - leadMs + totalMs,
             waitCostMs: Math.max(0, leadMs - castBeatMs) };
  }

  var SPEED = { full: 1, fast: 0.6, reduced: 1 };
  function plan(batch, m, opts) {
    opts = opts || {};
    var mode = SPEED[opts.mode] != null ? opts.mode : 'full', b = fromBatch(batch, m), T = timeline(m, SPEED[mode], opts.choreoSpeed), k = m.contract;
    var clip = !!(b.cast && b.strike) && mode !== 'reduced';
    var cues = [];
    if (b.cast) cues.push({ t: 0, cue: 'cast', sound: k.castSound });
    if (b.strike) {
      if (clip) cues.push({ t: T.clipStart, cue: 'clip-start' });
      cues.push({ t: T.destroyAt, cue: 'impact', sound: k.impactSound, uid: b.targetUid });
      cues.push({ t: T.crackAt, cue: 'crack', uid: b.targetUid, ms: 520 * T.vfxT });
      cues.push({ t: T.beatEnd, cue: 'settle' });
      if (clip) cues.push({ t: T.clipEnd, cue: 'clip-end' });
    } else cues.push({ t: T.castBeatMs, cue: 'settle' });
    cues.sort(function (x, y) { return x.t - y.t; });
    return { mode: mode, clip: clip, strike: !!b.strike, targetUid: b.targetUid, timeline: T, cues: cues, end: cues[cues.length - 1].t };
  }

  // where the clip draws: its impact anchor on the target card's centre, sized so the ring's diameter is cardWidths card widths
  function place(m, card) {
    var s = m.scaleRule.cardWidths * card.w / m.scaleRule.ringDiameterCell;
    return { scale: s, x: card.cx - m.anchor.x * s, y: card.cy - m.anchor.y * s, w: m.cellSize.w * s, h: m.cellSize.h * s };
  }

  // the cell on screen at time t (ms from the play's start), or null before the clip starts and from its end on
  function frameIndex(m, T, t) {
    if (t < T.clipStart || t >= T.clipEnd) return null;
    return Math.min(m.cells.length - 1, Math.floor((t - T.clipStart) / T.frameMs + 1e-9));
  }

  // the game's T72 bakeAlpha, on raw RGBA bytes: alpha = the brightest channel
  function bake(d) { for (var i = 0; i < d.length; i += 4) { var r = d[i], g = d[i + 1], b = d[i + 2]; d[i + 3] = r > g ? (r > b ? r : b) : (g > b ? g : b); } return d; }

  // THE PLAYER. env: now(), canvas, dpr, cardOf(uid) → {cx, cy, w} in the canvas's CSS space, loadAtlas(m) → Promise<{source, bytes, close()}>,
  // render(board), crack(uid, ms), sound(name), onDone(result), onError(e)
  function createPlayer(env) {
    var st = { run: null, loaded: null, decodedBytes: 0, peak: 0, loads: 0, releases: 0, peakClips: 0, last: null };
    function release() {
      if (!st.loaded) return;
      try { st.loaded.close(); } catch (e) {}
      st.loaded = null; st.decodedBytes = 0; st.releases++;
    }
    function clear() { var c = env.canvas; if (!c) return; var g = c.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, c.width, c.height); }
    // play: synchronous when the atlas loader is (a test world), a promise when it is not (the page fetches and decodes)
    function play(batch, m, boards, opts) {
      if (st.run && !st.run.done) skip();                      // E1: one clip decoded at once — a new play ends the one before
      var p = plan(batch, m, opts);
      var target = p.targetUid != null && env.cardOf ? env.cardOf(p.targetUid) : null;
      function start(a, t0) {
        if (a) { st.loaded = a; st.loads++; st.decodedBytes = a.bytes; st.peak = Math.max(st.peak, a.bytes); st.peakClips = Math.max(st.peakClips, 1); st.decodeMs = Date.now() - t0; }
        env.render(boards.before);
        var run = { plan: p, manifest: m, boards: boards, target: target, place: target && p.clip ? place(m, target) : null, t0: env.now(), next: 0, done: false,
                    log: { cues: [], drawn: [], composite: [], impactDrawnAt: null, destroyCueAt: null, settledAt: null, crackAt: null } };
        st.run = run; st.last = run;
        return run;
      }
      if (!p.clip) return start(null, 0);
      if (st.loaded) release();
      var t0 = Date.now(), a = env.loadAtlas(m);
      return a && typeof a.then === 'function' ? a.then(function (x) { return start(x, t0); }) : start(a, t0);
    }
    function fire(run, c, t) {
      run.log.cues.push({ cue: c.cue, planned: c.t, at: t });
      if (c.sound && env.sound) env.sound(c.sound);
      if (c.cue === 'impact') run.log.destroyCueAt = t;
      if (c.cue === 'crack') { run.log.crackAt = t; if (env.crack) env.crack(c.uid, c.ms); }
      if (c.cue === 'settle') { run.log.settledAt = t; env.render(run.boards.after); }
      if (c.cue === 'clip-end') { clear(); release(); }
    }
    function finish(run, skipped) {
      run.done = true; clear(); release();
      var res = { skipped: !!skipped, plan: run.plan, log: run.log };
      if (env.onDone) env.onDone(res);
    }
    function frame(now) {
      var run = st.run; if (!run || run.done) return;
      try {
        var t = now - run.t0, cues = run.plan.cues;
        while (run.next < cues.length && cues[run.next].t <= t + 1e-6) { fire(run, cues[run.next], t); run.next++; }
        var ix = run.plan.clip && st.loaded ? frameIndex(run.manifest, run.plan.timeline, t) : null;
        if (ix != null && run.place) {
          var c = env.canvas, g = c.getContext('2d'), d = env.dpr || 1, cell = run.manifest.cells[ix], r = run.place;
          g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, c.width, c.height);
          g.globalCompositeOperation = 'lighter'; g.globalAlpha = 1;
          g.drawImage(st.loaded.source, cell.x, cell.y, cell.w, cell.h, r.x * d, r.y * d, r.w * d, r.h * d);
          g.globalCompositeOperation = 'source-over';
          if (run.log.drawn[run.log.drawn.length - 1] !== ix) run.log.drawn.push(ix);
          run.log.composite.push('lighter');
          if (ix === run.manifest.impact && run.log.impactDrawnAt == null) run.log.impactDrawnAt = t;
        }
        if (run.next >= cues.length) finish(run, false);
      } catch (e) { if (env.onError) env.onError(e); finish(run, true); }
    }
    function skip() {
      var run = st.run; if (!run || run.done) return;
      env.render(run.boards.after); run.log.settledAt = run.log.settledAt == null ? -1 : run.log.settledAt; finish(run, true);
    }
    return { play: play, frame: frame, skip: skip, release: release,
             stats: function () { return { decodedBytes: st.decodedBytes, peak: st.peak, loads: st.loads, releases: st.releases, peakClips: st.peakClips, loaded: !!st.loaded, playing: !!(st.run && !st.run.done), decodeMs: st.decodeMs, last: st.last }; } };
  }

  var OUT = { validate: validate, fromBatch: fromBatch, timeline: timeline, plan: plan, place: place, frameIndex: frameIndex, bake: bake, createPlayer: createPlayer, E1: E1, CHOREO_SPEED: CHOREO_SPEED, SPEED: SPEED };
  root.EffectClip = OUT;
  if (typeof module !== 'undefined' && module.exports) module.exports = OUT;
})(typeof window !== 'undefined' ? window : this);
