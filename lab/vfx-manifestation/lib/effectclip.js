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
   LAB-20b · THE CHAKRA TRAVELS, AND THE EFFECT ROTATION RULE. A strike that carries a travel block flies the game's own throw path: its layer
   starts on the invocation's anchor (the caster's half centre) and reaches the target's centre where its trail dies, on the trail's own
   integral curve, starting on the FIRST DRAWN cell (a slow decode shortens the flight, never jumps it), scaled from the invocation disc's
   size to its own. RULE: actors never rotate (the upright law stands); a directional effect may rotate its layer to align its motion feature
   with its board path — from the actual caster-to-target vector, only while in motion, easing back to its authored orientation before its
   impact frame. The LAB-20 arrive-from-centre mirror is retired.
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
    var member = m.role === 'invoke' || m.role === 'strike' || m.role === 'afterglow';   // LAB-25: + the afterglow (a strike-then-afterglow chain's second plate)
    if (m.role !== undefined && !member) e.push('role must be "invoke", "strike" or "afterglow"');
    if (m.moment !== undefined && m.moment !== 'arming' && m.moment !== 'empowered-drain' && m.moment !== 'spell-surge') e.push('moment must be "arming", "empowered-drain" or "spell-surge"');   // LAB-26: + the faction-mechanic track
    if (m.role === 'invoke' || m.role === 'afterglow') { if (m.impact !== null) e.push('an ' + (m.role === 'invoke' ? 'invocation' : 'afterglow') + ' has no impact cell'); }
    else if (m.moment === 'arming') { if (m.impact !== null) e.push('an arming clip has no impact cell'); }   // LAB-24: the cast resolves nothing — no impact, no beat gate
    else if (!(Number.isInteger(m.impact) && cells && m.impact >= 0 && m.impact < cells.length)) e.push('impact must name a cell');
    if (!(m.anchor && num(m.anchor.x) && num(m.anchor.y))) e.push('anchor missing');
    else if (m.cellSize && (m.anchor.x < 0 || m.anchor.y < 0 || m.anchor.x > m.cellSize.w || m.anchor.y > m.cellSize.h)) e.push('anchor falls outside the cell');
    var sr = m.scaleRule; if (!(sr && (sr.ringDiameterCell > 0 || sr.spanCell > 0) && sr.cardWidths > 0)) e.push('scaleRule missing');
    else if (sr.heightFraction != null && sr.halfFraction != null) e.push('a plate is sized by ONE unit: heightFraction or halfFraction, never both');
    else if (sr.heightFraction != null && !(sr.heightFraction > 0 && sr.heightFraction <= 1)) e.push('heightFraction out of range');
    else if (sr.halfFraction != null && !(sr.halfFraction > 0 && sr.halfFraction <= 1.2)) e.push('halfFraction out of range');
    else if (sr.heightCap != null && !(sr.heightCap > 0 && sr.heightCap <= 1)) e.push('heightCap out of range');
    else if (sr.cardFloorOfHalfH != null && !(sr.cardFloorOfHalfH > 0 && sr.cardFloorOfHalfH < 1)) e.push('cardFloorOfHalfH out of range');
    if (!member) e = e.concat(contractErrors(m.contract));
    else if (m.contract !== undefined) e.push('a chain member carries no contract (the chain does)');
    if (m.moment === 'empowered-drain' && !(m.contract && m.contract.castEvent && m.contract.castEvent.type && m.contract.castEvent.abilityName && num(m.contract.minDrain))) e.push('an empowered-drain clip names its cast event and its minimum drain');
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
    if (chain && chain.shape === 'strike-afterglow') {   // LAB-25: a strike then an afterglow, the afterglow a fixed delay after the impact
      if (!(Array.isArray(clips) && clips.length === 2 && clips[0].role === 'strike' && clips[1].role === 'afterglow')) e.push('a strike-afterglow chain is a strike then an afterglow');
      if (!(chain.contract && num(chain.contract.afterglowDelayMs) && chain.contract.afterglowDelayMs >= 0)) e.push('a strike-afterglow chain names its afterglow delay');
    }
    else if (!(Array.isArray(clips) && clips.length === 2 && clips[0].role === 'invoke' && clips[1].role === 'strike')) e.push('a chain is an invocation then a strike');
    (clips || []).forEach(function (m, i) { var v = validate(m); if (!v.ok) e.push('clip ' + i + ': ' + v.errors.join('; ')); if (chain && m.cardId !== chain.cardId) e.push('clip ' + i + ' is another card'); });
    return { ok: e.length === 0, errors: e };
  }
  var contractOf = function (spec) { return spec.class === 'effect-chain' ? spec.chain.contract : spec.contract; };
  var clipsOf = function (spec) { return spec.class === 'effect-chain' ? spec.clips : [spec]; };

  // the cast and the strike this batch carries: the play of the card, and its resolution event (null when the card found no mark)
  // LAB-24 · THE EMPOWERED DRAIN (Vasuki Venom Strike's payoff). The cast of this plan is the round-end Venom TOAST of the striker's OWN drain
  // (the empowered one: amount >= minDrain = base 1 + the strike's +2, naming the drained = enemy player), and its strike is that drain's FIRST
  // `venom` beat on an enemy Unit. The striker is the seat whose venomStrike equalled the round BEFORE the action (the batch records it, captured
  // pre-mutate — endRound wipes the flag). No striker, no empowered toast, or no drained Unit → no clip: an ordinary drain never floods.
  function drainOf(batch, k) {
    var ev = (batch && batch.events) || [], vs = batch && batch.venomStrike, none = { cast: null, strike: null, targetUid: null, drain: null };
    if (!vs || vs.striker == null) return none;
    var drained = 1 - vs.striker, names = batch.scenario ? [batch.scenario.p0, batch.scenario.p1] : null, seatOf = {};
    if (batch.before) batch.before.seats.forEach(function (s, i) { (s.units || []).concat(s.heroes || []).forEach(function (c) { if (c) seatOf[c.uid] = i; }); });
    var amt = function (t) { var mm = /[\u2212-](\d+)/.exec(t || ''); return mm ? +mm[1] : 0; };
    for (var i = 0; i < ev.length; i++) {
      var e = ev[i]; if (e.type !== k.castEvent.type || e.abilityName !== k.castEvent.abilityName) continue;
      if (amt(e.text) < k.minDrain) continue;                                                 // an ordinary (or Karkotaka flat −1) drain is never the empowered one
      if (names && (e.text || '').indexOf(names[drained]) < 0) continue;                      // the striker's OWN drain names the drained player
      for (var j = i + 1; j < ev.length && ev[j].type !== k.castEvent.type; j++) {
        var v = ev[j]; if (v.type === k.trigger && v.abilityName === k.abilityName && v.targetUids && seatOf[v.targetUids[0]] === drained) return { cast: e, strike: v, targetUid: null, drain: { toast: i, firstBeat: j, amount: amt(e.text), drainedSeat: drained } };
      }
      return none;
    }
    return none;
  }
  // LAB-26 · THE SPELL SURGE (Chaos Surge, the Asura faction mechanic — the fourth premium track). The cast of this plan is the Surge's own
  // TOAST (the game holds it 620 ms x speed) and its strike is the FIRST buff of the action whose amount reaches minAmount — the +3 spell
  // surge from an Astra, a Mantra or Chandrahas. The +1 FLOOR surge (the first Unit play of a round) never reaches minAmount, so it plans no
  // clip and keeps the classic presentation (owner ruling 2); a second surge in the same action (the Chandrahas double) is not the first, so
  // it keeps the classic too. The blessed Unit — the buff's own target — is the anchor.
  function surgeOf(batch, k) {
    var ev = (batch && batch.events) || [], none = { cast: null, strike: null, targetUid: null, surge: null };
    var strike = null, si = -1;
    for (var i = 0; i < ev.length; i++) {
      var e = ev[i];
      if (e.type === k.trigger && e.abilityName === k.abilityName && e.amount >= k.minAmount && e.targetUids && e.targetUids.length) { strike = e; si = i; break; }
    }
    if (!strike) return none;
    var cast = null;
    for (var j = si - 1; j >= 0; j--) { var c = ev[j]; if (c.type === k.castEvent.type && c.abilityName === k.castEvent.abilityName) { cast = c; break; } }
    if (!cast) return none;                                                   // the toast IS the cast: no toast, no premium surge
    var total = ev.filter(function (x) { return x.type === k.trigger && x.abilityName === k.abilityName; }).length;
    return { cast: cast, strike: strike, targetUid: strike.targetUids[0], surge: { amount: strike.amount, index: si, surgesInAction: total } };
  }
  function fromBatch(batch, spec) {
    if (spec.class !== 'effect-chain' && spec.moment === 'spell-surge') return surgeOf(batch, contractOf(spec));
    if (spec.class !== 'effect-chain' && spec.moment === 'empowered-drain') return drainOf(batch, contractOf(spec));
    var ev = (batch && batch.events) || [], k = contractOf(spec);
    var name = spec.class === 'effect-chain' ? spec.chain.cardName : null;   // a chain's cast is named by its card (Sudarshana Chakra), its resolution by the ability (Sudarshana)
    var cast = ev[0] && ev[0].type === 'play' && (ev[0].abilityName === k.abilityName || (name && ev[0].abilityName === name)) ? ev[0] : null;
    if (spec.class !== 'effect-chain' && spec.moment === 'arming') return { cast: cast, strike: null, arming: true, targetUid: null };   // LAB-24: the cast is the moment
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
  // LAB-24 · an ARMING clip: it starts AT the cast (S1, positional) and runs its length; the cast beat's own settle is unchanged. No impact.
  function armingTimeline(m, speed, choreo) {
    var vfxT = vfxOf(speed, choreo), k = m.contract, frameMs = 1000 / m.fps * vfxT, totalMs = m.cells.length * frameMs;
    return { vfxT: vfxT, frameMs: frameMs, leadMs: 0, totalMs: totalMs, castBeatMs: (k.castHitStopMs + k.castHoldMs) * vfxT, destroyAt: null, clipStart: 0, impactAt: null,
             crackAt: null, beatEnd: (k.castHitStopMs + k.castHoldMs) * vfxT, clipEnd: totalMs, waitCostMs: 0 };
  }
  // LAB-25 · a STRIKE then an AFTERGLOW: the strike's impact cell on the beat; the afterglow starts afterglowDelayMs x vfxT after the impact (the
  // game's own timer for the second plate), and the strike is released there — it ends there by construction (the pack range makes it so)
  function afterglowTimeline(chain, clips, speed, choreo) {
    var vfxT = vfxOf(speed, choreo), B = beats(chain.contract, vfxT), str = clips[0], aft = clips[1];
    var frameMs = 1000 / str.fps * vfxT, aftFrameMs = 1000 / aft.fps * vfxT, strikeStart = B.impactAt - str.impact * frameMs, handoffAt = B.impactAt + chain.contract.afterglowDelayMs * vfxT;
    return { vfxT: vfxT, frameMs: frameMs, afterglowFrameMs: aftFrameMs, castBeatMs: B.castBeatMs, impactAt: B.impactAt, crackAt: B.crackAt, calloutAt: null, beatEnd: B.beatEnd,
             strikeStart: strikeStart, strikeEnd: strikeStart + str.cells.length * frameMs, handoffAt: handoffAt, afterglowStart: handoffAt, afterglowEnd: handoffAt + aft.cells.length * aftFrameMs,
             leadMs: str.impact * frameMs, waitCostMs: Math.max(0, -strikeStart) };
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
    var mode = SPEED[opts.mode] != null ? opts.mode : 'full', chained = spec.class === 'effect-chain', k = contractOf(spec), b = fromBatch(batch, spec), arming = !!b.arming;
    var glow = chained && spec.chain.shape === 'strike-afterglow';
    var T = glow ? afterglowTimeline(spec.chain, spec.clips, SPEED[mode], opts.choreoSpeed) : chained ? chainTimeline(spec.chain, spec.clips, SPEED[mode], opts.choreoSpeed) : arming ? armingTimeline(spec, SPEED[mode], opts.choreoSpeed) : timeline(spec, SPEED[mode], opts.choreoSpeed);
    var clip = !!(b.cast && (b.strike || arming)) && mode !== 'reduced', segments = [], cues = [];
    var HALF_PLACES = { 'enemy-half-centre': 'enemy-half', 'enemy-half-top': 'enemy-half-top', 'enemy-half-bottom': 'enemy-half-bottom', 'caster-half-bottom': 'caster-half-bottom' };
    if (clip && glow) segments.push({ role: 'strike', clip: 0, start: T.strikeStart, end: Math.min(T.strikeEnd, T.handoffAt), frameMs: T.frameMs, place: k.anchor, impact: spec.clips[0].impact },
                                    { role: 'afterglow', clip: 1, start: T.afterglowStart, end: T.afterglowEnd, frameMs: T.afterglowFrameMs, place: k.afterglowAnchor, impact: null });
    else if (clip && chained) segments.push({ role: 'invoke', clip: 0, start: T.invokeStart, end: T.handoffAt, frameMs: T.invokeFrameMs, place: 'caster-half' },
                                       { role: 'strike', clip: 1, start: T.strikeStart, end: T.strikeEnd, frameMs: T.frameMs, place: 'target', impact: spec.clips[1].impact });
    else if (clip) segments.push({ role: 'strike', clip: 0, start: T.clipStart, end: T.clipEnd, frameMs: T.frameMs, place: HALF_PLACES[k.anchor] || 'target', impact: spec.impact });   // LAB-21: a BOARD-WIDE astra anchors on the caster's enemy half (the game's own row-plate anchor), not on one card
    if (b.cast) cues.push({ t: 0, cue: 'cast', sound: k.castSound });
    if (b.strike) {
      if (clip && glow) { cues.push({ t: T.strikeStart, cue: 'clip-start' }); cues.push({ t: T.handoffAt, cue: 'handoff' }); }
      else if (clip && chained) { cues.push({ t: T.invokeStart, cue: 'invoke-start' }); cues.push({ t: T.handoffAt, cue: 'handoff' }); }
      else if (clip) cues.push({ t: T.clipStart, cue: 'clip-start' });
      cues.push({ t: T.impactAt, cue: 'impact', sound: k.impactSound, uid: b.targetUid });
      if (k.exitKind !== 'none') cues.push({ t: T.crackAt, cue: k.exitKind === 'removal' ? 'removal' : 'crack', uid: b.targetUid, ms: (k.exitKind === 'removal' ? k.exitMs : 520) * T.vfxT });   // LAB-24: a drain cracks no card
      if (T.calloutAt != null) cues.push({ t: T.calloutAt, cue: 'callout', uid: b.targetUid, text: chained ? spec.chain.cardName : null });
      cues.push({ t: T.beatEnd, cue: 'settle' });
      if (clip) cues.push({ t: glow ? T.afterglowEnd : chained ? T.strikeEnd : T.clipEnd, cue: 'clip-end' });
    } else {
      if (clip && arming) { cues.push({ t: T.clipStart, cue: 'clip-start' }); cues.push({ t: T.clipEnd, cue: 'clip-end' }); }   // LAB-24: the rise runs its length past the cast's settle
      cues.push({ t: T.castBeatMs, cue: 'settle' });
    }
    cues.forEach(function (c) { if (c.sound === null) delete c.sound; });
    cues.sort(function (x, y) { return x.t - y.t; });
    return { mode: mode, chained: chained, clip: clip, strike: !!b.strike, arming: arming, drain: b.drain || null, targetUid: b.targetUid, casterSeat: opts.casterSeat != null ? opts.casterSeat : null,
             timeline: T, segments: segments, cues: cues, end: cues[cues.length - 1].t };
  }

  var spanOf = function (m) { return m.scaleRule.spanCell || m.scaleRule.ringDiameterCell; };
  // where a clip draws: its anchor on a point, sized so its scale feature spans cardWidths card widths
  function place(m, card) {
    var sr = m.scaleRule, s;
    if (sr.heightFraction) {
      // LAB-24 (owner ruling A): HEIGHT-FIT — the plate's HEIGHT is heightFraction x its half's HEIGHT; the width follows the clip. Top and bottom cuts sit on the half's own borders
      s = sr.heightFraction * card.halfH / m.cellSize.h;
    } else if (sr.halfFraction) {
      // LAB-22 (owner ruling 3): a plate recorded as a FRACTION OF THE ENEMY HALF is sized off the half's own width;
      // EXPORT-4 (ruling 1) THE FITTED LAW: clamped so the plate is never taller than heightCap x the half (landscape halves are wide and short)
      s = sr.halfFraction * card.halfW / m.cellSize.w;
      if (sr.heightCap && card.halfH > 0 && s * m.cellSize.h > sr.heightCap * card.halfH) s = sr.heightCap * card.halfH / m.cellSize.h;
    } else {
      // every other clip by card widths; EXPORT-4 (ruling 2) THE CARD FLOOR: where the field outgrows the cards (portrait tablets), a card
      // counts as at least cardFloorOfHalfH x the half's height wide — a single-target strike still scales with its target
      var w = card.w; if (sr.cardFloorOfHalfH && card.halfH > 0) w = Math.max(w, sr.cardFloorOfHalfH * card.halfH);
      s = sr.cardWidths * w / spanOf(m);
    }
    return { scale: s, x: card.cx - m.anchor.x * s, y: card.cy - m.anchor.y * s, w: m.cellSize.w * s, h: m.cellSize.h * s };
  }
  // LAB-20b · the travel curve: the manifest's table (the trail's integral) linearly interpolated at u in [0, 1]
  function lut(table, u) {
    if (!(u > 0)) return table[0]; if (u >= 1) return table[table.length - 1];
    var x = u * (table.length - 1), i = Math.floor(x), f = x - i; return table[i] + (table[i + 1] - table[i]) * f;
  }
  var easeOutQuad = function (u) { u = Math.max(0, Math.min(1, u)); return 1 - (1 - u) * (1 - u); };
  // the layer rotation for a travelling effect: the source's motion (+x) turned onto the caster-to-target vector, in radians
  function travelAngle(from, to) { return Math.atan2(to.y - from.y, to.x - from.x); }
  // the strike layer's pose at time t: position, scale factor, rotation — given its travel (t0 = the first drawn cell, or null before it)
  function travelPose(m, tv, t) {
    var t0 = tv.t0 == null ? t : tv.t0, span = tv.arriveT - t0, u = span > 0 ? Math.min(1, Math.max(0, (t - t0) / span)) : 1;
    var p = lut(m.travel.table, u), rot;
    if (t < tv.arriveT) rot = tv.angle;
    else { var v = tv.zeroT > tv.arriveT ? Math.min(1, Math.max(0, (t - tv.arriveT) / (tv.zeroT - tv.arriveT))) : 1; rot = tv.angle * (1 - lut(m.travel.table, v)); }
    return { u: u, p: p, x: tv.from.x + (tv.to.x - tv.from.x) * p, y: tv.from.y + (tv.to.y - tv.from.y) * p, scale: tv.scaleFrom + (1 - tv.scaleFrom) * p, rot: rot };
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

  // THE PLAYER. env: now(), canvas, dpr, cardOf(uid) → {cx, cy, w}, halfOf(seat) → {cx, cy, top, w, h}, fieldCentreX(), loadAtlas(m) → atlas or Promise,
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
      var h = k > 0 ? run.log.handoff : null;   // LAB-25: the second segment of either chain shape
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
      var hE = env.halfOf && p.casterSeat != null ? env.halfOf(1 - p.casterSeat) : null;   // EXPORT-4: the enemy half's height, for the card floor
      var withHalf = function (c, h) { return { cx: c.cx, cy: c.cy, w: c.w, halfW: h && h.w, halfH: h && h.h }; };
      var places = p.segments.map(function (sg) {
        var m = clips[sg.clip];
        if (sg.place === 'target') return target ? place(m, withHalf(target, hE)) : null;
        var seat = (sg.place === 'enemy-half' || sg.place === 'enemy-half-top' || sg.place === 'enemy-half-bottom') ? (p.casterSeat != null ? 1 - p.casterSeat : null) : p.casterSeat;   // LAB-21: the enemy half is the caster's opposite seat
        var hh = seat != null && env.halfOf ? env.halfOf(seat) : null;
        // LAB-25: DIVIDER-FLUSH on a LOGICAL half — the plate's edge nearest the divider sits ON it (its bottom on the upper half, its top on the lower)
        if (sg.place === 'enemy-half-divider' || sg.place === 'caster-half-divider') {
          var hs = sg.place === 'enemy-half-divider' ? (p.casterSeat != null ? 1 - p.casterSeat : null) : p.casterSeat, hd = hs != null && env.halfOf ? env.halfOf(hs) : null, ho = hs != null && env.halfOf ? env.halfOf(1 - hs) : null;
          if (!(hd && ho && hd.top != null && ho.top != null && hd.h > 0 && hd.w > 0)) return null;
          var pd = place(m, { cx: hd.cx, cy: 0, w: 0, halfW: hd.w, halfH: hd.h }), upper = hd.top < ho.top;
          return { scale: pd.scale, x: hd.cx - pd.w / 2, y: upper ? hd.top + hd.h - pd.h : hd.top, w: pd.w, h: pd.h };
        }
        // LAB-24: BOTTOM-FLUSH on a LOGICAL half (the caster's, or its enemy's) — the plate's bottom-centre on the half's bottom edge; no half height, no clip (fail-open)
        if (sg.place === 'enemy-half-bottom' || sg.place === 'caster-half-bottom') return hh && hh.top != null && hh.h > 0 && hh.w > 0 ? place(m, { cx: hh.cx, cy: hh.top + hh.h, w: 0, halfW: hh.w, halfH: hh.h }) : null;
        // LAB-22: TOP-FLUSH — the plate's anchor (its top-centre) on the enemy half's TOP edge; a half that reports no top plays no clip (fail-open)
        // EXPORT-4: a height-capped plate needs the half's height (no height, no clip — it could not be kept inside the half)
        if (sg.place === 'enemy-half-top') return hh && target && hh.top != null && (!m.scaleRule.halfFraction || hh.w > 0) && (!m.scaleRule.heightCap || hh.h > 0) ? place(m, { cx: hh.cx, cy: hh.top, w: target.w, halfW: hh.w, halfH: hh.h }) : null;
        return hh && target ? place(m, { cx: hh.cx, cy: hh.cy, w: target.w, halfW: hh.w, halfH: hh.h }) : null;   // the card width still sets the scale (cardWidths), the half sets the centre
      });
      if (st.loaded) release();
      env.render(boards.before);
      // EXPORT-5 · THE BEAT GATE (opt-in: the live game passes beatGate; the lab plays its plans as before). The plan stays the schedule;
      // the game's REAL beat is the trigger for the impact cell: a beat that has not come by the planned impact holds the clip on the
      // pre-impact cell (the weapon at maximum tension) until it does; past the cap the clip stands down and the classic sprite takes the beat
      var ic = p.cues.filter(function (c) { return c.cue === 'impact'; })[0], isg = p.segments[p.segments.length - 1];
      var gate = opts.beatGate && ic && p.clip ? { impactT: ic.t, deadMs: isg ? isg.frameMs : 0, capMs: opts.beatCapMs || 1500, state: 'wait', shift: 0, holdFrom: null, late: null } : null;
      // EXPORT-6 · THE READY-ANCHORED RISE (owner ruling A, opt-in: the live game passes readyAnchor). An ARMING clip has no beat to keep, so its
      // clock starts when its atlas is DECODED, not at the cast: a slow decode still opens on cell 0 (never a partial play). Bounded by the cast
      // beat's own settle — past it the clip stands down, and env.onArmingLate lets the page fire the classic sprite once
      var ra = opts.readyAnchor && p.arming && p.clip ? { bound: p.timeline.castBeatMs, shift: null, late: null } : null;
      var run = { plan: p, spec: spec, clips: clips, boards: boards, target: target, places: places, t0: env.now(), next: 0, done: false, pin: opts.impactPin !== false, pending: null, current: -1, gate: gate, beatAt: null, ra: ra,
                  manifest: clips[p.segments.length ? p.segments[p.segments.length - 1].clip : 0],
                  place: places[places.length - 1] || null,
                  log: { cues: [], drawn: [], bySegment: {}, composite: [], impactDrawnAt: null, impactPinned: false, destroyCueAt: null, settledAt: null, crackAt: null, handoff: null, mirror: null,
                         ready: {}, late: [], loadErrors: [], drawError: null, travel: [], travelPlan: null, beat: null, beatLateCap: null, clipStartedAt: null, armingLate: null } };
      p.segments.forEach(function (sg) { run.log.bySegment[sg.role] = []; });
      // LAB-20b: a travelling strike flies from the caster's half centre to the target's centre
      var ks = p.segments.map(function (sg) { return sg.role; }).indexOf('strike'), sm = ks >= 0 ? clips[p.segments[ks].clip] : null, hh2 = env.halfOf && p.casterSeat != null ? env.halfOf(p.casterSeat) : null;
      if (sm && sm.travel && target && hh2) {
        var sg2 = p.segments[ks], from = { x: hh2.cx, y: hh2.cy }, to = { x: target.cx, y: target.cy };
        run.travel = { from: from, to: to, angle: travelAngle(from, to), scaleFrom: (spec.chain && spec.chain.travel && spec.chain.travel.scaleFrom) || 1,
                       arriveT: sg2.start + sm.travel.arriveCell * sg2.frameMs, zeroT: sg2.start + sm.impact * sg2.frameMs, t0: null };
        run.log.travelPlan = { from: from, to: to, angleDeg: run.travel.angle * 180 / Math.PI, scaleFrom: run.travel.scaleFrom, plannedStart: sg2.start, arriveAt: run.travel.arriveT, rotationZeroAt: run.travel.zeroT, firstDrawAt: null };
      }
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
    function draw(run, t, tr) {
      var drew = false; if (tr == null) tr = t;   // EXPORT-5: t = the plan clock (cells, pose); tr = the real clock (logs)
      run.plan.segments.forEach(function (sg, k) {
        if (drew || !st.loaded || st.loadedRole !== sg.role || !run.places[k]) return;
        var m = run.clips[sg.clip], ix = segIndex(m, sg, t);
        if (run.pin && run.impactFrame && sg.impact != null) { if (ix !== sg.impact) run.log.impactPinned = true; ix = sg.impact; }   // THE IMPACT PIN
        if (ix == null) return;
        var c = env.canvas, g = c.getContext('2d'), d = env.dpr || 1, cell = m.cells[ix], r = run.places[k];
        g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, c.width, c.height);
        g.globalCompositeOperation = 'lighter'; g.globalAlpha = 1;
        if (sg.role === 'strike' && run.travel) {
          // LAB-20b: the flight — the first DRAWN cell starts it; the pose rides the trail's integral; rotation only while travelling
          var tv = run.travel; if (tv.t0 == null) { tv.t0 = t; run.log.travelPlan.firstDrawAt = tr; diag('travel', { from: tv.from, to: tv.to, angleDeg: Math.round(tv.angle * 1800 / Math.PI) / 10, scaleFrom: tv.scaleFrom, firstDrawAt: Math.round(t), arriveAt: Math.round(tv.arriveT) }); }
          var pose = travelPose(m, tv, t), kk = r.scale * pose.scale * d, cs = Math.cos(pose.rot) * kk, sn = Math.sin(pose.rot) * kk;
          g.setTransform(cs, sn, -sn, cs, pose.x * d, pose.y * d);
          g.drawImage(st.loaded.source, cell.x, cell.y, cell.w, cell.h, -m.anchor.x, -m.anchor.y, cell.w, cell.h);
          g.setTransform(1, 0, 0, 1, 0, 0);
          run.log.travel.push({ t: tr, cell: ix, x: pose.x, y: pose.y, rot: pose.rot, scale: pose.scale, u: pose.u });
        }
        else g.drawImage(st.loaded.source, cell.x, cell.y, cell.w, cell.h, r.x * d, r.y * d, r.w * d, r.h * d);
        g.globalCompositeOperation = 'source-over';
        var seq = run.log.bySegment[sg.role]; if (!seq.length) { diag('first-draw', { role: sg.role, at: Math.round(tr), cell: ix }); if (sg.role === 'strike' && run.log.handoff) run.log.handoff.firstDrawnCell = ix; }   // the TRUE loss at the handoff: cells before the first one drawn
        if (seq[seq.length - 1] !== ix) seq.push(ix);
        if (sg.role === 'strike' && run.log.drawn[run.log.drawn.length - 1] !== ix) run.log.drawn.push(ix);
        run.log.composite.push('lighter'); drew = true;
        if (sg.impact != null && ix === sg.impact && run.log.impactDrawnAt == null) run.log.impactDrawnAt = tr;
      });
    }
    function frame(now) {
      var run = st.run; if (!run || run.done) return;
      var t = now - run.t0, cues = run.plan.cues, tc = t, G = run.gate; run.impactFrame = false;
      if (G) {
        if (G.state === 'wait' && t >= G.impactT - 1e-6) {
          if (run.beatAt != null) G.state = 'go';                                         // the beat is already in: today's schedule, untouched
          else { G.state = 'hold'; G.holdFrom = t; diag('beat-hold', { at: Math.round(t), impactAt: Math.round(G.impactT) }); }
        }
        if (G.state === 'hold' && run.beatAt != null) {
          G.late = run.beatAt - G.impactT; G.shift = G.late > G.deadMs ? G.late : 0; G.state = 'go';   // within one clip frame: the post-impact schedule stays as planned
          run.log.beat = { at: run.beatAt, late: G.late, shift: G.shift, heldFor: t - G.holdFrom }; diag('beat-late', { late: Math.round(G.late), shift: Math.round(G.shift) });
        }
        if (G.state === 'hold' && t - G.impactT > G.capMs) {                               // PAST THE CAP: stand down; the classic sprite takes the beat
          run.log.beatLateCap = t; diag('beat-late-cap', { at: Math.round(t), heldFor: Math.round(t - G.holdFrom) });
          if (env.onBeatLateCap) env.onBeatLateCap(run);
          finish(run, true); return;
        }
        tc = G.state === 'hold' ? G.impactT - 1e-3 : t - G.shift;                           // HOLD: the pre-impact cell (impact − 1), the travel pose at arrival
      }
      var A = run.ra, tcl = tc;
      if (A) {
        var sgA = run.plan.segments[0], rdy = sgA ? run.log.ready[sgA.role] : null;
        if (A.shift == null && A.late == null && rdy != null && rdy <= A.bound + 1e-6) { A.shift = rdy; run.log.clipStartedAt = rdy; diag('arming-start', { at: Math.round(rdy) }); }
        if (A.shift == null && A.late == null && t >= A.bound - 1e-6) {                  // not decoded by the cast beat's settle: stand down
          A.late = t; run.log.armingLate = t; diag('arming-late', { at: Math.round(t), bound: Math.round(A.bound) }); release(); run.current = -2;
          if (env.onArmingLate) env.onArmingLate(run);
        }
        tcl = A.shift != null ? t - A.shift : (A.late != null ? t : -1);                  // the clip's own clock: stopped until it is decoded
      }
      try { while (run.next < cues.length) { var cu = cues[run.next], ct = A && (cu.cue === 'clip-start' || cu.cue === 'clip-end') ? tcl : tc; if (cu.t > ct + 1e-6) break; fire(run, cu, t); run.next++; } }
      catch (e) { if (env.onError) env.onError(e); diag('cue-error', { at: Math.round(t), error: String(e && (e.message || e)) }); env.render(run.boards.after); finish(run, true); return; }
      try { if (run.plan.clip && !(A && A.late != null)) draw(run, A ? tcl : tc, t); }
      catch (e) {
        // a DRAW error costs the decoration, never the beats: the clip is dropped, the timeline plays on to AFTER
        if (!run.log.drawError) { run.log.drawError = { at: t, error: String(e && (e.message || e)) }; diag('draw-error', { at: Math.round(t), error: run.log.drawError.error }); if (env.onError) env.onError(e); }
        release(); run.current = -2;
      }
      if (run.next >= cues.length) finish(run, false);
    }
    // EXPORT-5: the game's real beat for this cast (once). Returns false if there is no live run to hear it (the caller then owns the moment)
    function beat() {
      var run = st.run; if (!run || run.done || run.beatAt != null) return false;
      run.beatAt = env.now() - run.t0; diag('beat', { at: Math.round(run.beatAt) }); return true;
    }
    function skip() {
      var run = st.run; if (!run || run.done) return;
      env.render(run.boards.after); run.log.settledAt = run.log.settledAt == null ? -1 : run.log.settledAt; finish(run, true);
    }
    return { play: play, frame: frame, skip: skip, beat: beat, release: release,
             stats: function () { return { decodedBytes: st.decodedBytes, peak: st.peak, loads: st.loads, releases: st.releases, peakClips: st.peakClips, loaded: !!st.loaded, loadedRole: st.loadedRole, playing: !!(st.run && !st.run.done), decodeMs: st.decodeMs, last: st.last }; } };
  }

  var OUT = { validate: validate, validateChain: validateChain, fromBatch: fromBatch, beats: beats, timeline: timeline, chainTimeline: chainTimeline, plan: plan, place: place, lut: lut, easeOutQuad: easeOutQuad, travelAngle: travelAngle, travelPose: travelPose, frameIndex: frameIndex, segIndex: segIndex, bake: bake, createPlayer: createPlayer, E1: E1, CHOREO_SPEED: CHOREO_SPEED, SPEED: SPEED };
  root.EffectClip = OUT;
  if (typeof module !== 'undefined' && module.exports) module.exports = OUT;
})(typeof window !== 'undefined' ? window : this);
