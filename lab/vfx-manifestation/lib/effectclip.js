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
   LAB-20 · THE CHAIN: an effect may be two clips — an INVOCATION on the caster's half centre (the game's own throw origin) handed off to
   a STRIKE on the target, whose impact lands on the contract's bite. The clips decode ONE AFTER THE OTHER (E1): the invocation at the cast,
   released at the handoff, then the strike. The contract generalises: a removal (Sudarshana) keys off a 'passive' event, flies for
   flightMs before its bite, and exits the Hero cleanly (no crack) — Vajra's contract is the same shape with no flight.
   THE IMPACT PIN (LAB-20, retro-applied to Vajra): on the frame the impact beat fires, the impact cell is drawn, whatever the clock says —
   a timed clip at Fast on a 30 Hz device (a cell shorter than a frame) could otherwise skip exactly that cell.
   LAB-20a · FAILS OPEN (see createPlayer): the timeline never waits on a decode.
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
    var member = m.role === 'invoke' || m.role === 'strike';
    if (m.role !== undefined && !member) e.push('role must be "invoke" or "strike"');
    if (m.role === 'invoke') { if (m.impact !== null) e.push('an invocation has no impact cell'); }
    else if (!(Number.isInteger(m.impact) && cells && m.impact >= 0 && m.impact < cells.length)) e.push('impact must name a cell');
    if (!(m.anchor && num(m.anchor.x) && num(m.anchor.y))) e.push('anchor missing');
    else if (m.cellSize && (m.anchor.x < 0 || m.anchor.y < 0 || m.anchor.x > m.cellSize.w || m.anchor.y > m.cellSize.h)) e.push('anchor falls outside the cell');
    var sr = m.scaleRule; if (!(sr && (sr.ringDiameterCell > 0 || sr.spanCell > 0) && sr.cardWidths > 0)) e.push('scaleRule missing');
    if (!member) e = e.concat(contractErrors(m.contract));
    else if (m.contract !== undefined) e.push('a chain member carries no contract (the chain does)');
    if (m.atlasSize && m.atlasSize.w * m.atlasSize.h * 4 > E1.capBytes) e.push('the atlas decodes past the E1 cap');
    return { ok: e.length === 0, errors: e };
  }
  function contractErrors(k) {
    var e = [];
    if (!(k && k.trigger && k.abilityName && k.castSound && (k.impactSound === null || typeof k.impactSound === 'string') && num(k.castHitStopMs) && num(k.castHoldMs) && num(k.crackAfterMs) && num(k.destroyDwellMs))) e.push('contract missing');
    if (k && k.awaited !== false) e.push('the strike is never awaited (the current contract)');
    if (k && k.flightMs !== undefined && !(k.flightMs >= 0)) e.push('flightMs must be 0 or more');
    return e;
  }
  // a chain: its contract, and exactly an invocation then a strike (validated clip manifests)
  function validateChain(chain, clips) {
    var e = [];
    if (!chain || chain.class !== 'effect-chain') e.push('class must be "effect-chain"');
    if (!(chain && typeof chain.cardName === 'string')) e.push('cardName missing (the cast event carries the card name)');
    e = e.concat(contractErrors(chain && chain.contract));
    if (!(Array.isArray(clips) && clips.length === 2 && clips[0].role === 'invoke' && clips[1].role === 'strike')) e.push('a chain is an invocation then a strike');
    (clips || []).forEach(function (m, i) { var v = validate(m); if (!v.ok) e.push('clip ' + i + ': ' + v.errors.join('; ')); if (chain && m.cardId !== chain.cardId) e.push('clip ' + i + ' is another card'); });
    return { ok: e.length === 0, errors: e };
  }
  var contractOf = function (spec) { return spec.class === 'effect-chain' ? spec.chain.contract : spec.contract; };
  var clipsOf = function (spec) { return spec.class === 'effect-chain' ? spec.clips : [spec]; };

  // the cast and the strike this batch carries: the play of the card, and its resolution event (null when the card found no mark)
  function fromBatch(batch, spec) {
    var ev = (batch && batch.events) || [], k = contractOf(spec);
    var name = spec.class === 'effect-chain' ? spec.chain.cardName : null;   // a chain's cast is named by its card (Sudarshana Chakra), its resolution by the ability (Sudarshana)
    var cast = ev[0] && ev[0].type === 'play' && (ev[0].abilityName === k.abilityName || (name && ev[0].abilityName === name)) ? ev[0] : null;
    var strike = ev.filter(function (x) { return x.type === k.trigger && x.abilityName === k.abilityName; })[0] || null;
    return { cast: cast, strike: strike, targetUid: strike && strike.targetUids && strike.targetUids.length ? strike.targetUids[0] : null };
  }

  // the contract's beats at a speed (the game's speedMult: Normal 1, Fast 0.6): the cast beat, then the resolution beat; the impact is its
  // flight after it (Vajra: no flight — the impact IS the destroy beat), the exit its crackAfterMs after the impact, the beat's end its dwell after
  function beats(k, vfxT) {
    var castBeatMs = (k.castHitStopMs + k.castHoldMs) * vfxT, impactAt = castBeatMs + (k.flightMs || 0) * vfxT;
    return { castBeatMs: castBeatMs, destroyAt: castBeatMs, impactAt: impactAt, crackAt: impactAt + k.crackAfterMs * vfxT,
             calloutAt: k.calloutAfterMs != null ? impactAt + (k.crackAfterMs + k.calloutAfterMs) * vfxT : null,
             beatEnd: impactAt + (k.crackAfterMs + k.destroyDwellMs) * vfxT };
  }
  var vfxOf = function (speed, choreo) { return (speed > 0 ? speed : 1) * (choreo > 0 ? choreo : CHOREO_SPEED); };
  // one clip (LAB-19): its impact cell lands on the impact beat
  function timeline(m, speed, choreo) {
    var vfxT = vfxOf(speed, choreo), B = beats(m.contract, vfxT), frameMs = 1000 / m.fps * vfxT, leadMs = m.impact * frameMs, totalMs = m.cells.length * frameMs;
    var clipStart = B.impactAt - leadMs;
    return { vfxT: vfxT, frameMs: frameMs, leadMs: leadMs, totalMs: totalMs, castBeatMs: B.castBeatMs, destroyAt: B.destroyAt, clipStart: clipStart, impactAt: clipStart + m.impact * frameMs,
             crackAt: B.crackAt, beatEnd: B.beatEnd, clipEnd: clipStart + totalMs, waitCostMs: Math.max(0, -clipStart) };
  }
  // the chain (LAB-20): the strike's impact cell on the bite; the invocation ends exactly where the strike begins (the handoff), and starts
  // its own length before — no dead time, no overlap, by construction. The wire-clock cost is whatever the chain would need before the cast
  function chainTimeline(chain, clips, speed, choreo) {
    var vfxT = vfxOf(speed, choreo), B = beats(chain.contract, vfxT), inv = clips[0], str = clips[1];
    var frameMs = 1000 / str.fps * vfxT, invFrameMs = 1000 / inv.fps * vfxT;
    var strikeStart = B.impactAt - str.impact * frameMs, invokeStart = strikeStart - inv.cells.length * invFrameMs;
    return { vfxT: vfxT, frameMs: frameMs, invokeFrameMs: invFrameMs, castBeatMs: B.castBeatMs, beatStart: B.castBeatMs, impactAt: strikeStart + str.impact * frameMs,
             crackAt: B.crackAt, calloutAt: B.calloutAt, beatEnd: B.beatEnd, invokeStart: invokeStart, handoffAt: strikeStart, strikeStart: strikeStart,
             strikeEnd: strikeStart + str.cells.length * frameMs, leadMs: str.impact * frameMs, waitCostMs: Math.max(0, -invokeStart) };
  }

  var SPEED = { full: 1, fast: 0.6, reduced: 1 };
  // spec: a clip manifest (one clip) or { class: 'effect-chain', chain, clips: [invoke, strike] }
  function plan(batch, spec, opts) {
    opts = opts || {};
    var mode = SPEED[opts.mode] != null ? opts.mode : 'full', chained = spec.class === 'effect-chain', k = contractOf(spec), b = fromBatch(batch, spec);
    var T = chained ? chainTimeline(spec.chain, spec.clips, SPEED[mode], opts.choreoSpeed) : timeline(spec, SPEED[mode], opts.choreoSpeed);
    var clip = !!(b.cast && b.strike) && mode !== 'reduced', segments = [], cues = [];
    if (clip && chained) segments.push({ role: 'invoke', clip: 0, start: T.invokeStart, end: T.handoffAt, frameMs: T.invokeFrameMs, place: 'caster-half' },
                                       { role: 'strike', clip: 1, start: T.strikeStart, end: T.strikeEnd, frameMs: T.frameMs, place: 'target', impact: spec.clips[1].impact });
    else if (clip) segments.push({ role: 'strike', clip: 0, start: T.clipStart, end: T.clipEnd, frameMs: T.frameMs, place: 'target', impact: spec.impact });
    if (b.cast) cues.push({ t: 0, cue: 'cast', sound: k.castSound });
    if (b.strike) {
      if (clip && chained) { cues.push({ t: T.invokeStart, cue: 'invoke-start' }); cues.push({ t: T.handoffAt, cue: 'handoff' }); }
      else if (clip) cues.push({ t: T.clipStart, cue: 'clip-start' });
      cues.push({ t: T.impactAt, cue: 'impact', sound: k.impactSound, uid: b.targetUid });
      cues.push({ t: T.crackAt, cue: k.exitKind === 'removal' ? 'removal' : 'crack', uid: b.targetUid, ms: (k.exitKind === 'removal' ? k.exitMs : 520) * T.vfxT });
      if (T.calloutAt != null) cues.push({ t: T.calloutAt, cue: 'callout', uid: b.targetUid, text: chained ? spec.chain.cardName : null });
      cues.push({ t: T.beatEnd, cue: 'settle' });
      if (clip) cues.push({ t: chained ? T.strikeEnd : T.clipEnd, cue: 'clip-end' });
    } else cues.push({ t: T.castBeatMs, cue: 'settle' });
    cues.forEach(function (c) { if (c.sound === null) delete c.sound; });
    cues.sort(function (x, y) { return x.t - y.t; });
    return { mode: mode, chained: chained, clip: clip, strike: !!b.strike, targetUid: b.targetUid, casterSeat: opts.casterSeat != null ? opts.casterSeat : null,
             timeline: T, segments: segments, cues: cues, end: cues[cues.length - 1].t };
  }

  var spanOf = function (m) { return m.scaleRule.spanCell || m.scaleRule.ringDiameterCell; };
  // where a clip draws: its anchor on a point, sized so its scale feature spans cardWidths card widths. mirror = a horizontal mirror
  function place(m, card, mirror) {
    var s = m.scaleRule.cardWidths * card.w / spanOf(m);
    return { scale: s, mirror: !!mirror, x: card.cx - (mirror ? m.cellSize.w - m.anchor.x : m.anchor.x) * s, y: card.cy - m.anchor.y * s, w: m.cellSize.w * s, h: m.cellSize.h * s };
  }
  // the arrival rule (LAB-20): the source's disc arrives from its left; mirror so it arrives from the board's horizontal centre
  function mirrorFor(m, cardCx, fieldCentreX) {
    if (!m.arrival) return false;
    var fromLeft = m.arrival.sourceArrivesFrom === 'left';
    return fromLeft ? cardCx < fieldCentreX : cardCx > fieldCentreX;
  }

  // the cell on screen at time t (ms from the play's start), or null before the clip starts and from its end on
  function frameIndex(m, T, t) {
    if (t < T.clipStart || t >= T.clipEnd) return null;
    return Math.min(m.cells.length - 1, Math.floor((t - T.clipStart) / T.frameMs + 1e-9));
  }
  function segIndex(m, seg, t) {
    if (t < seg.start || t >= seg.end) return null;
    return Math.min(m.cells.length - 1, Math.max(0, Math.floor((t - seg.start) / seg.frameMs + 1e-9)));
  }

  // the game's T72 bakeAlpha, on raw RGBA bytes: alpha = the brightest channel
  function bake(d) { for (var i = 0; i < d.length; i += 4) { var r = d[i], g = d[i + 1], b = d[i + 2]; d[i + 3] = r > g ? (r > b ? r : b) : (g > b ? g : b); } return d; }

  // THE PLAYER. env: now(), canvas, dpr, cardOf(uid) → {cx, cy, w}, halfOf(seat) → {cx, cy}, fieldCentreX(), loadAtlas(m) → atlas or Promise,
  // render(board), crack(uid, ms), removal(uid, ms), callout(uid, text), sound(name), onDone(result), onError(e), diag(step, detail)
  // LAB-20a · FAILS OPEN: the beats are never hostage to a decoration's decode. play() starts the timeline AT ONCE — the board drawn, the
  // cast cue at 0 ms, every beat on schedule — and each clip decodes ALONGSIDE; a clip that is not ready (or failed) simply does not draw.
  // A draw error lands the board on the engine's AFTER, as Skip does. E1 is unchanged: an atlas is accepted only while its segment is
  // current, the invocation is released at the handoff before the strike decodes, and a decode arriving too late is closed on arrival.
  function createPlayer(env) {
    var st = { run: null, loaded: null, loadedRole: null, decodedBytes: 0, peak: 0, loads: 0, releases: 0, peakClips: 0, live: 0, last: null };
    var diag = function (step, detail) { if (env.diag) { try { env.diag(step, detail || null); } catch (e) {} } };
    function release() {
      if (!st.loaded) return;
      try { st.loaded.close(); } catch (e) {}
      diag('release', { role: st.loadedRole });
      st.loaded = null; st.loadedRole = null; st.decodedBytes = 0; st.releases++; st.live = 0;
    }
    function accept(a, role, t0) {
      if (st.loaded) release();                                  // E1: never two effect clips decoded at once
      st.loaded = a; st.loadedRole = role; st.loads++; st.live = 1; st.decodedBytes = a.bytes; st.peak = Math.max(st.peak, a.bytes); st.peakClips = Math.max(st.peakClips, st.live);
      st.decodeMs = Date.now() - t0;
    }
    function clear() { var c = env.canvas; if (!c) return; var g = c.getContext('2d'); if (!g) return; g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, c.width, c.height); }
    // decode segment k's clip alongside the running timeline; accept it only if the run is live and the segment is still current
    function loadSegment(run, k) {
      var sg = run.plan.segments[k], m = run.clips[sg.clip], t0 = Date.now(), tStart = env.now() - run.t0;
      run.current = k; diag('load-start', { role: sg.role, at: Math.round(tStart) });
      var h = sg.role === 'strike' && k > 0 ? run.log.handoff : null;
      var ready = function (x) {
        if (!x) return fail(new Error('the ' + sg.role + ' atlas loader returned nothing'));
        var t = env.now() - run.t0;
        if (run.done || run.current !== k) { try { x.close(); } catch (e) {} run.log.late.push({ role: sg.role, at: t }); diag('load-discarded', { role: sg.role, at: Math.round(t), why: run.done ? 'the play ended' : 'its segment is over' }); return; }
        accept(x, sg.role, t0); run.log.ready[sg.role] = t;
        if (h) { h.readyAt = t; h.decodeMs = Date.now() - t0; h.cellsBeforeReady = Math.max(0, Math.floor((t - sg.start) / sg.frameMs)); }
        diag('load-ready', { role: sg.role, at: Math.round(t), ms: Date.now() - t0, bytes: x.bytes });
      };
      var fail = function (e) { var t = env.now() - run.t0; run.log.loadErrors.push({ role: sg.role, at: t, error: String(e && (e.message || e)) }); diag('load-failed', { role: sg.role, at: Math.round(t), error: String(e && (e.message || e)) }); if (env.onError) env.onError(e); };
      var a;
      try { a = env.loadAtlas(m); } catch (e) { fail(e); return; }
      if (a && typeof a.then === 'function') { run.pending = a; a.then(ready, fail); }
      else ready(a);
    }
    // play: starts the timeline at once (always synchronous); the clips decode alongside
    function play(batch, spec, boards, opts) {
      opts = opts || {};
      if (st.run && !st.run.done) skip();
      var p = plan(batch, spec, opts), clips = clipsOf(spec);
      var target = p.targetUid != null && env.cardOf ? env.cardOf(p.targetUid) : null;
      var places = p.segments.map(function (sg) {
        var m = clips[sg.clip];
        if (sg.place === 'target') return target ? place(m, target, mirrorFor(m, target.cx, env.fieldCentreX ? env.fieldCentreX() : target.cx)) : null;
        var hh = env.halfOf ? env.halfOf(p.casterSeat) : null;
        return hh && target ? place(m, { cx: hh.cx, cy: hh.cy, w: target.w }, false) : null;
      });
      if (st.loaded) release();
      env.render(boards.before);
      var run = { plan: p, spec: spec, clips: clips, boards: boards, target: target, places: places, t0: env.now(), next: 0, done: false, pin: opts.impactPin !== false, pending: null, current: -1,
                  manifest: clips[p.segments.length ? p.segments[p.segments.length - 1].clip : 0],
                  place: places[places.length - 1] || null,
                  log: { cues: [], drawn: [], bySegment: {}, composite: [], impactDrawnAt: null, impactPinned: false, destroyCueAt: null, settledAt: null, crackAt: null, handoff: null, mirror: null,
                         ready: {}, late: [], loadErrors: [], drawError: null } };
      p.segments.forEach(function (sg) { run.log.bySegment[sg.role] = []; });
      run.log.mirror = places.length ? places[places.length - 1] && places[places.length - 1].mirror : null;
      st.run = run; st.last = run;
      diag('play', { mode: p.mode, clip: p.clip, chained: p.chained, strike: p.strike, cues: p.cues.length, end: Math.round(p.end) });
      if (p.clip) loadSegment(run, 0);                             // alongside — the cast cue does not wait for it
      return run;
    }
    function handoff(run, t) {
      release();                                                   // the invocation lets go FIRST — then the strike decodes (E1)
      run.log.handoff = { at: t, releasedAt: t, readyAt: null, decodeMs: null, cellsBeforeReady: null, firstDrawnCell: null };
      diag('handoff', { at: Math.round(t) });
      loadSegment(run, 1);
    }
    function fire(run, c, t) {
      run.log.cues.push({ cue: c.cue, planned: c.t, at: t });
      if (c.sound && env.sound) env.sound(c.sound);
      if (c.cue === 'impact') { run.log.destroyCueAt = t; run.impactFrame = true; }
      if (c.cue === 'handoff') handoff(run, t);
      if (c.cue === 'crack') { run.log.crackAt = t; if (env.crack) env.crack(c.uid, c.ms); }
      if (c.cue === 'removal') { run.log.crackAt = t; if (env.removal) env.removal(c.uid, c.ms); }
      if (c.cue === 'callout' && env.callout) env.callout(c.uid, c.text);
      if (c.cue === 'settle') { run.log.settledAt = t; env.render(run.boards.after); }
      if (c.cue === 'clip-end') { clear(); release(); run.current = -1; }
      if (c.cue === 'cast' || c.cue === 'impact' || c.cue === 'settle') diag('cue', { cue: c.cue, at: Math.round(t) });
    }
    function finish(run, skipped) {
      run.done = true; clear(); release();
      var res = { skipped: !!skipped, plan: run.plan, log: run.log };
      diag('finish', { skipped: !!skipped, drawn: run.log.drawn.length, errors: run.log.loadErrors.length + (run.log.drawError ? 1 : 0) });
      if (env.onDone) env.onDone(res);
    }
    function draw(run, t) {
      var drew = false;
      run.plan.segments.forEach(function (sg, k) {
        if (drew || !st.loaded || st.loadedRole !== sg.role || !run.places[k]) return;
        var m = run.clips[sg.clip], ix = segIndex(m, sg, t);
        if (run.pin && run.impactFrame && sg.impact != null) { if (ix !== sg.impact) run.log.impactPinned = true; ix = sg.impact; }   // THE IMPACT PIN
        if (ix == null) return;
        var c = env.canvas, g = c.getContext('2d'), d = env.dpr || 1, cell = m.cells[ix], r = run.places[k];
        g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, c.width, c.height);
        g.globalCompositeOperation = 'lighter'; g.globalAlpha = 1;
        if (r.mirror) { g.setTransform(-1, 0, 0, 1, (r.x + r.w) * d, 0); g.drawImage(st.loaded.source, cell.x, cell.y, cell.w, cell.h, 0, r.y * d, r.w * d, r.h * d); g.setTransform(1, 0, 0, 1, 0, 0); }
        else g.drawImage(st.loaded.source, cell.x, cell.y, cell.w, cell.h, r.x * d, r.y * d, r.w * d, r.h * d);
        g.globalCompositeOperation = 'source-over';
        var seq = run.log.bySegment[sg.role]; if (!seq.length) { diag('first-draw', { role: sg.role, at: Math.round(t), cell: ix }); if (sg.role === 'strike' && run.log.handoff) run.log.handoff.firstDrawnCell = ix; }   // the TRUE loss at the handoff: cells before the first one drawn
        if (seq[seq.length - 1] !== ix) seq.push(ix);
        if (sg.role === 'strike' && run.log.drawn[run.log.drawn.length - 1] !== ix) run.log.drawn.push(ix);
        run.log.composite.push('lighter'); drew = true;
        if (sg.impact != null && ix === sg.impact && run.log.impactDrawnAt == null) run.log.impactDrawnAt = t;
      });
    }
    function frame(now) {
      var run = st.run; if (!run || run.done) return;
      var t = now - run.t0, cues = run.plan.cues; run.impactFrame = false;
      try { while (run.next < cues.length && cues[run.next].t <= t + 1e-6) { fire(run, cues[run.next], t); run.next++; } }
      catch (e) { if (env.onError) env.onError(e); diag('cue-error', { at: Math.round(t), error: String(e && (e.message || e)) }); env.render(run.boards.after); finish(run, true); return; }
      try { if (run.plan.clip) draw(run, t); }
      catch (e) {
        // a DRAW error costs the decoration, never the beats: the clip is dropped, the timeline plays on to AFTER
        if (!run.log.drawError) { run.log.drawError = { at: t, error: String(e && (e.message || e)) }; diag('draw-error', { at: Math.round(t), error: run.log.drawError.error }); if (env.onError) env.onError(e); }
        release(); run.current = -2;
      }
      if (run.next >= cues.length) finish(run, false);
    }
    function skip() {
      var run = st.run; if (!run || run.done) return;
      env.render(run.boards.after); run.log.settledAt = run.log.settledAt == null ? -1 : run.log.settledAt; finish(run, true);
    }
    return { play: play, frame: frame, skip: skip, release: release,
             stats: function () { return { decodedBytes: st.decodedBytes, peak: st.peak, loads: st.loads, releases: st.releases, peakClips: st.peakClips, loaded: !!st.loaded, loadedRole: st.loadedRole, playing: !!(st.run && !st.run.done), decodeMs: st.decodeMs, last: st.last }; } };
  }

  var OUT = { validate: validate, validateChain: validateChain, fromBatch: fromBatch, beats: beats, timeline: timeline, chainTimeline: chainTimeline, plan: plan, place: place, mirrorFor: mirrorFor, frameIndex: frameIndex, segIndex: segIndex, bake: bake, createPlayer: createPlayer, E1: E1, CHOREO_SPEED: CHOREO_SPEED, SPEED: SPEED };
  root.EffectClip = OUT;
  if (typeof module !== 'undefined' && module.exports) module.exports = OUT;
})(typeof window !== 'undefined' ? window : this);
