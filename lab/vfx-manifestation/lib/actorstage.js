/* lib/actorstage.js — VFX-LAB-3. The stage for ACTORS (ruling A4): draws a manifest's cells with real alpha and NORMAL
   (source-over) blending — never additive, never brightness-to-alpha — above the board and its effect canvases, under the
   floating numbers. Card-agnostic: it knows cells, pivots and phases, never a card.
   Three canvases, in layer order: #actorunder (the portal glow and the soft contact shadow) · the actor (Canvas 2D on
   #actorcanvas, or a Pixi sprite on #actorgpu) · #actorover (the ACT's directional flash). The camera impulse moves the
   whole #field for a moment, board and all.
   The clock is injected (lab time): hit-stop freezes the actor's own animation, never the page. clear() is the cleanup
   guarantee — no actor, no effect, no transform survives it. stats() is the performance readout (real frames).
   NATIVE CELLS (LAB-4a): when a phase arrives with cellFps (a native-timing actor), the CELLS are the clock — one cell per
   1/cellFps s of lab time straight through the phase's list, no easing between cells, no hold inside a phase (the hit-stop never
   freezes a native actor: the clip carries its own contact). A late frame never skips a cell at native rate (the stage catches up
   one cell per frame, and cells a phase ended before reaching play first in the next — EMERGE → ACT → FIZZLE is one clip); at
   twice native rate (Fast) it may skip one cell at a time, never two. The director says which: cellStep (LAB-4c) — 1 in Full at any
   tempo, 2 in Fast. onCell() fires a cue on the frame a
   given cell is drawn (the contact). Every cell drawn is counted per play: stats().cellsDrawn. warm() uploads an atlas before
   its first play, so the first frames of a manifestation are not lost to a texture upload.
   THE DISSOLVE (LAB-4b): dissolve(actor, fx) turns FIZZLE into the faction's dissolve exit (lib/dissolve.js holds the maths and the
   presets' defaults). The held cell erodes bottom-up behind a glowing front: a Pixi filter on the actor sprite (noise texture +
   threshold + edge glow) on WebGPU and WebGL, a per-frame noise mask (destination-in) and glow on Canvas 2D. Embers rise off the
   front: pooled sprites of one 64 px glow texture on the GPU, soft discs on #actorover on Canvas 2D (fewer). Faint smoke hangs
   behind the front on #actorunder. All of it is normal-blended, every particle ends by FIZZLE's end, and remove()/clear() drop them.
   A FIZZLE longer than 600 ms (LAB-4c's slider) time-stretches the embers and smoke with the sweep: life ×, speed and spawn rate ÷.
   LAB-6a: a preset may end the erosion early (sweep_frac) so its motes and haze hang in the rest of FIZZLE, raise its motes from the
   whole standing body (mote_zone), cap the motes alive (canvas_cap / gpu_cap), and add a soft bright haze (puffs, normal blend).
   MEMORY (LAB-5, ruling A5): an actor's decoded atlas lives only for its play. loadActor() at play counts its RGBA bytes;
   unloadActor() after SETTLE destroys the GPU texture, closes the decoded bitmap and drops the mask kits — never under a live actor.
   decodedBytes() is the live figure (0 between plays); stats().peakDecoded is the most ever held at once.
   Browser: window.ActorStage. */
(function (root) {
  'use strict';
  var easeOut = function (p) { return 1 - (1 - p) * (1 - p); };
  var easeIn = function (p) { return p * p; };
  var perf = function () { return (root.performance && root.performance.now) ? root.performance.now() : Date.now(); };

  function ActorStage(o) {
    this.o = o; this.field = o.field; this.under = o.under; this.canvas = o.actorCanvas; this.gpuCanvas = o.gpuCanvas; this.over = o.over;
    this.now = o.now || function () { return Date.now(); };
    this.backend = 'canvas2d'; this.renderer = 'canvas2d'; this.pixi = null; this.app = null;
    this.assets = {}; this.actors = []; this.fx = []; this.frozenUntil = -1; this.impulseFx = null; this.nextId = 1;
    this.parts = []; this.pool = []; this.dz = null; this.cz = {}; this.tex = {}; this.nz = null;      // dissolve: particles, GPU sprite pool, GPU kit, mask kits, images, noise
    this.dpr = Math.min(2, root.devicePixelRatio || 1);
    this.stat = { frames: 0, drawMsTotal: 0, drawN: 0, liveFrames: 0, liveRealT0: null, liveRealLast: null, fps: 0, cellPx: 0, drawnPx: 0, lastPlay: null, lastExit: null, warmed: 0, peakDecoded: 0, loads: 0, unloads: 0 };
    this.resize();
  }
  var P = ActorStage.prototype;

  P.resize = function () {
    var r = this.field.getBoundingClientRect ? this.field.getBoundingClientRect() : { width: 0, height: 0 };
    this.w = r.width || this.field.clientWidth || 0; this.h = r.height || this.field.clientHeight || 0;
    var self = this;
    [this.under, this.canvas, this.over].forEach(function (c) { if (c) { c.width = Math.max(1, Math.round(self.w * self.dpr)); c.height = Math.max(1, Math.round(self.h * self.dpr)); } });
    if (this.app) { try { this.app.renderer.resize(this.w, this.h); } catch (e) {} }
  };

  // the actor's renderer: 'canvas' → Canvas 2D; 'webgpu' | 'webgl' → a Pixi app on its own canvas (Canvas 2D if that fails)
  P.useBackend = async function (pref) {
    var r = await this.pickBackend(pref), self = this;
    Object.keys(this.assets).forEach(function (id) { self.warm(id); });
    return r;
  };
  P.pickBackend = async function (pref) {
    this.teardownGpu();
    if (pref === 'canvas') { this.backend = 'canvas2d'; this.renderer = 'canvas2d'; return this.renderer; }
    try {
      var PIXI = this.pixi || await import(this.o.pixiUrl); this.pixi = PIXI;
      var fresh = document.createElement('canvas'); fresh.id = this.gpuCanvas.id; fresh.className = this.gpuCanvas.className;
      this.gpuCanvas.parentNode.replaceChild(fresh, this.gpuCanvas); this.gpuCanvas = fresh;   // a canvas keeps its first context type: every backend gets a fresh one
      var app = new PIXI.Application();
      await app.init({ canvas: fresh, backgroundAlpha: 0, antialias: true, autoStart: false, resolution: this.dpr, autoDensity: true, width: this.w, height: this.h, preference: pref });
      this.app = app; this.backend = 'pixi'; this.renderer = (app.renderer && app.renderer.name) || pref; this.base = {};
      this.actors.forEach(function (a) { a.sprite = null; });
      return this.renderer;
    } catch (e) { this.teardownGpu(); this.backend = 'canvas2d'; this.renderer = 'canvas2d (' + pref + ' unavailable)'; return this.renderer; }
  };
  P.teardownGpu = function () {
    if (this.app) { try { this.app.destroy({ removeView: false }, { children: true, texture: false }); } catch (e) {} }
    this.app = null; this.base = {}; this.dz = null; this.pool = []; this.parts.forEach(function (pt) { pt.sprite = null; });
    if (this.gpuCanvas) { try { var g = this.gpuCanvas.getContext && this.gpuCanvas.getContext('2d'); if (g) g.clearRect(0, 0, this.gpuCanvas.width, this.gpuCanvas.height); } catch (e) {} }
    this.actors.forEach(function (a) { a.sprite = null; });
  };

  // an actor's art: { manifest, image } (the image already decoded)
  P.loadActor = function (cardId, art) {
    this.assets[cardId] = art; art.bytes = art.manifest.atlasSize ? art.manifest.atlasSize.w * art.manifest.atlasSize.h * 4 : 0;
    this.stat.cellPx = Math.max.apply(null, art.manifest.cells.map(function (c) { return Math.max(c.w, c.h); }));
    this.stat.loads++; this.stat.peakDecoded = Math.max(this.stat.peakDecoded, this.decodedBytes());
    this.warm(cardId);
  };
  // after SETTLE: the GPU texture destroyed, the decoded bitmap closed, the mask kits dropped (refused while an actor of the card is live)
  P.unloadActor = function (cardId) {
    var art = this.assets[cardId]; if (!art) return false;
    if (this.actors.some(function (a) { return a.cardId === cardId; })) return false;
    var base = this.base && this.base[cardId];
    if (base) { try { base.destroy(true); } catch (e) {} delete this.base[cardId]; }
    if (art.image && typeof art.image.close === 'function') { try { art.image.close(); } catch (e) {} }
    var cz = this.cz; Object.keys(cz).forEach(function (k) { if (k.indexOf(cardId + '#') === 0) delete cz[k]; });
    delete this.assets[cardId]; this.stat.unloads++;
    return true;
  };
  P.decodedBytes = function () { var n = 0, A = this.assets; Object.keys(A).forEach(function (k) { n += A[k].bytes || 0; }); return n; };
  // put the atlas on the GPU (or through the 2D rasteriser) once, invisibly, before any play needs it
  P.warm = function (cardId) {
    var art = this.assets[cardId]; if (!art || !art.image) return;
    try {
      if (this.backend === 'pixi' && this.app) {
        var PIXI = this.pixi, base = this.base[cardId] || (this.base[cardId] = PIXI.Texture.from(art.image)), sp = new PIXI.Sprite(base);
        sp.alpha = 0.001; sp.scale.set(1 / Math.max(1, art.image.width || 1)); sp.position.set(0, 0);
        this.app.stage.addChild(sp); this.app.renderer.render(this.app.stage); this.app.stage.removeChild(sp); sp.destroy(); this.app.renderer.render(this.app.stage);
      } else {
        var g = this.canvas && this.canvas.getContext('2d');
        if (g) { g.save(); g.globalAlpha = 0.001; g.drawImage(art.image, 0, 0, 1, 1, 0, 0, 1, 1); g.restore(); g.clearRect(0, 0, 1, 1); }
      }
      this.stat.warmed = (this.stat.warmed || 0) + 1;
    } catch (e) {}
  };

  // spawn = place it (StageMath.place output) at its card, in phase `phase`
  P.spawn = function (cardId, placement, faction) {
    var art = this.assets[cardId]; if (!art) return null;
    var a = { id: this.nextId++, cardId: cardId, art: art, pl: placement, faction: faction, phase: 'emerge', dur: 1, pt: 0, lastT: this.now(), contact: 0.58, pose: null, sprite: null,
             cellFps: null, cellIx: -1, backlog: [], rate: null, drawn: [], lastDrawn: -1, watch: null, contactCell: null };
    this.actors.push(a);
    if (this.stat.liveRealT0 == null) { this.stat.liveRealT0 = perf(); this.stat.liveFrames = 0; }
    return a;
  };
  P.setPhase = function (a, phase, dur, contactFrac, cellFps, cellStep) {
    if (!a) return;
    if (a.watch && a.watch.phase !== phase) this.fireWatch(a);          // the phase ended before its cell was drawn (a very slow frame): the cue still lands
    if (a.cellFps) a.backlog = a.backlog.concat((a.art.manifest.phases[a.phase] || []).slice(a.cellIx + 1));   // the clip's cells this phase never reached
    a.phase = phase; a.dur = Math.max(1, dur); a.pt = 0; a.lastT = this.now(); a.cellIx = -1;
    a.cellFps = cellFps > 0 ? cellFps : null; a.cellStep = cellStep > 0 ? cellStep : null; if (a.cellFps) a.rate = Math.max(a.rate || 0, a.cellFps);
    if (contactFrac != null) a.contact = contactFrac;
  };
  // fire fn on the frame the actor draws cell `index` of `phase` (at once if it already has)
  P.onCell = function (a, phase, index, fn) {
    if (!a) return; a.watch = { phase: phase, index: index, fn: fn };
    if (a.pose && a.phase === phase && a.pose.phase === phase && a.pose.phaseIx >= index) this.fireWatch(a);   // LAB-8: never on a pose left over from the previous phase
  };
  P.fireWatch = function (a) { var w = a.watch; a.watch = null; if (!w) return; a.contactCell = a.pose ? a.pose.cellIndex : null; w.fn(); };
  P.noteCell = function (a, q) { if (!(q.alpha > 0.01)) return; if (q.cellIndex !== a.lastDrawn) {   // a cell counts only when it is visibly drawn
 a.drawn.push(q.cellIndex); a.lastDrawn = q.cellIndex; } };
  // one play's cell count: distinct cells drawn of the manifest's total, cells drawn again after another cell (a repeat —
  // holding a cell across display frames is not one, and neither is the FIZZLE hold of the last ACT cell), cells never drawn
  P.playOf = function (a, live) {
    var m = a.art.manifest, seen = {}, repeats = 0, n = 0;
    a.drawn.forEach(function (ci) { if (seen[ci]) repeats++; else { seen[ci] = true; n++; } });
    var missing = []; m.cells.forEach(function (c, i) { if (!seen[i]) missing.push(c.name || String(i)); });
    return { drawn: n, total: m.cells.length, repeats: repeats, missing: missing, contact: a.contactCell != null && m.cells[a.contactCell] ? (m.cells[a.contactCell].name || String(a.contactCell)) : null, cellFps: a.rate, live: !!live };
  };
  P.remove = function (a) {
    if (!a) return;
    if (this.actors.indexOf(a) >= 0) this.stat.lastPlay = this.playOf(a, false);
    if (a.dz && this.actors.indexOf(a) >= 0) this.stat.lastExit = this.exitOf(a);
    var stage = this; this.parts = this.parts.filter(function (pt) { if (pt.owner !== a) return true; stage.dropPart(pt); return false; });
    if (a.sprite && a.sprite.parent) { try { a.sprite.parent.removeChild(a.sprite); a.sprite.destroy(); } catch (e) {} }
    this.actors = this.actors.filter(function (x) { return x !== a; });
    if (!this.actors.length) this.closeLiveWindow();
  };
  // LAB-8 · THE NATIVE EXIT ON A SLOW DEVICE: with no FIZZLE after ACT, cells a late device has not reached would be lost at SETTLE (the
  // fade tail with them). finish(a) keeps such an actor drawing its unreached cells into SETTLE, one per frame — the rule every other
  // phase already follows — and removes it on the frame after its last cell is drawn. An actor that is not behind, or not native, goes now.
  P.finish = function (a) {
    if (!a || !a.cellFps || a.phase === 'fizzle') return false;
    var list = a.art.manifest.phases[a.phase] || [];
    if (!a.backlog.length && a.cellIx >= list.length - 1 && a.lastDrawn === list[list.length - 1]) return false;
    a.finishing = true; a.cellStep = 1; return true;
  };
  P.closeLiveWindow = function () {
    var s = this.stat; if (s.liveRealT0 != null && s.liveRealLast != null && s.liveRealLast > s.liveRealT0) s.fps = Math.round(s.liveFrames * 1000 / (s.liveRealLast - s.liveRealT0));
    s.liveRealT0 = null; s.liveRealLast = null;
  };

  P.hitstop = function (ms) { this.frozenUntil = this.now() + ms; };
  P.portal = function (x, y, radius, color, dur) { this.fx.push({ kind: 'portal', x: x, y: y, r: radius, color: color, t0: this.now(), dur: Math.max(1, dur) }); };
  P.flash = function (x, y, radius, dirY, dur, shape) { this.fx.push({ kind: 'flash', x: x, y: y, r: radius, dirY: dirY, radial: shape === 'radial', t0: this.now(), dur: Math.max(1, dur) }); };   // LAB-8: shape 'radial' = the nova
  P.impulse = function (dirY, px, dur) { this.impulseFx = { dirY: dirY, px: px, t0: this.now(), dur: Math.max(1, dur) }; };

  // the pose of one actor at lab time t
  P.poseOf = function (a, t) {
    var dt = Math.max(0, t - a.lastT), m = a.art.manifest, cells = m.phases[a.phase] || m.phases.act, ix, ci = null; a.lastT = t;
    if (a.cellFps) {
      // NATIVE: the cells are the clock (no hit-stop hold); catch up one cell per frame, or two at twice native rate — never skip more
      a.pt += dt;
      var step = a.cellStep || (a.cellFps > m.fps ? 2 : 1);
      if (a.backlog.length) { ci = a.backlog.splice(0, Math.min(step, a.backlog.length)).pop(); ix = -1; }       // the previous phase's unreached cells first, in order
      else {
        var target = Math.min(cells.length - 1, Math.floor(a.pt * a.cellFps / 1000 + 1e-6));
        ix = a.cellIx < 0 ? 0 : Math.max(a.cellIx, Math.min(target, a.cellIx + step));
        a.cellIx = ix;
      }
    } else {
      if (t >= this.frozenUntil) a.pt += dt;
      ix = Math.min(cells.length - 1, Math.floor(Math.min(1, a.pt / a.dur) * cells.length));
    }
    if (ci == null) ci = cells[ix];
    var p = Math.min(1, a.pt / a.dur), cell = m.cells[ci];
    var pl = a.pl, alpha = 1, sc = 1, rise = 0, k = 0;
    if (a.phase === 'emerge') { var e = easeOut(Math.max(p, 0.5 / cells.length));   /* LAB-4d: never fully transparent — the first cell is really drawn */ alpha = e; sc = 0.72 + 0.28 * e; rise = (1 - e) * pl.height * 0.35; }
    else if (a.phase === 'act') { var c = a.contact; k = p < c ? easeIn(p / c) : 1 - 0.18 * easeOut((p - c) / (1 - c)); }
    else if (a.phase === 'fizzle') { k = 0.82; if (!a.dz) { alpha = 1 - easeIn(p); sc = 1 + 0.06 * p; rise = -10 * p; } }   // a dissolving actor holds still: the erosion is the exit
    return { cell: cell, cellIndex: ci, phaseIx: ix, phase: a.phase, x: pl.anchor.x + pl.travel.x * k, feetY: pl.anchor.y + pl.travel.y * k, y: pl.anchor.y + pl.travel.y * k + rise, scale: pl.scale * sc, alpha: alpha, flipX: pl.flipX };
  };

  P.frame = function (t, realNow) {
    var t0 = perf(), self = this, s = this.stat;
    this.fx = this.fx.filter(function (f) { return t - f.t0 < f.dur; });
    this.actors.filter(function (a) { var l = a.finishing && a.art.manifest.phases[a.phase]; return l && !a.backlog.length && a.cellIx >= l.length - 1 && a.lastDrawn === l[l.length - 1]; }).forEach(function (a) { self.remove(a); });   // LAB-8: finished
    this.actors.forEach(function (a) { if (a.finishing) { var l = a.art.manifest.phases[a.phase] || []; a.pt = Math.max(a.pt, (Math.min(l.length - 1, a.cellIx + 1)) * 1000 / a.cellFps); } a.pose = self.poseOf(a, t); });
    this.actors.forEach(function (a) { if (a.watch && a.pose && a.phase === a.watch.phase && a.pose.phase === a.watch.phase && a.pose.phaseIx >= a.watch.index) self.fireWatch(a); });
    this.actors.forEach(function (a) { if (a.dz && a.pose) self.stepDissolve(a, t); });
    var u = this.under && this.under.getContext('2d'), o = this.over && this.over.getContext('2d');
    [u, o].forEach(function (g) { if (g) { g.setTransform(self.dpr, 0, 0, self.dpr, 0, 0); g.clearRect(0, 0, self.w, self.h); } });
    // UNDER: the portal glow, then each actor's soft contact shadow
    if (u) this.fx.forEach(function (f) {
      if (f.kind !== 'portal') return;
      var p = (t - f.t0) / f.dur, env = p < 0.3 ? p / 0.3 : 1 - (p - 0.3) / 0.7;
      var g = u.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r); g.addColorStop(0, f.color); g.addColorStop(1, 'rgba(0,0,0,0)');
      u.globalAlpha = 0.85 * Math.max(0, env); u.fillStyle = g; u.beginPath(); u.ellipse(f.x, f.y, f.r, f.r * 0.55, 0, 0, Math.PI * 2); u.fill(); u.globalAlpha = 1;
    });
    if (u) this.actors.forEach(function (a) {
      var q = a.pose; if (!q) return;
      var rx = q.cell.w * q.scale * 0.26, ry = Math.max(3, rx * 0.16);
      var g = u.createRadialGradient(q.x, q.feetY, 0, q.x, q.feetY, rx); g.addColorStop(0, 'rgba(0,0,0,0.55)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      u.globalAlpha = q.alpha * (a.dz ? 1 - (a.dz.p || 0) : 1); u.fillStyle = g; u.beginPath(); u.ellipse(q.x, q.feetY, rx, ry, 0, 0, Math.PI * 2); u.fill(); u.globalAlpha = 1;
    });
    // the dissolve's smoke, behind the actor
    if (u) this.parts.forEach(function (pt) {
      if (pt.kind !== 'smoke' && pt.kind !== 'haze') return;
      var k01 = Math.min(1, (t - pt.t0) / pt.life), sz = Math.min(128, pt.r * 2 * (1 + 0.5 * k01));   // never above the puff image's own size
      u.globalAlpha = pt.alpha * Math.min(1, k01 / 0.3) * (1 - k01); u.drawImage(self.imageOf('puff', pt.color), pt.x - sz / 2, pt.y - sz / 2, sz, sz); u.globalAlpha = 1;
    });
    // THE ACTOR — normal blending, real alpha
    if (this.backend === 'pixi' && this.app) this.drawPixi(); else this.drawCanvas();
    // OVER: the directional flash
    if (o) this.fx.forEach(function (f) {
      if (f.kind !== 'flash') return;
      var p = (t - f.t0) / f.dur, cy = f.y + f.dirY * f.r * 0.35;
      var g = o.createRadialGradient(f.x, cy, 0, f.x, cy, f.r); g.addColorStop(0, 'rgba(255,242,220,0.9)'); g.addColorStop(1, 'rgba(255,242,220,0)');
      o.globalAlpha = 0.6 * (1 - p); o.fillStyle = g; o.beginPath(); o.ellipse(f.x, cy, f.radial ? f.r : f.r * 0.7, f.r, 0, 0, Math.PI * 2); o.fill(); o.globalAlpha = 1;
    });
    // the dissolve's embers on Canvas 2D (on the GPU they are sprites)
    if (o) this.parts.forEach(function (pt) {
      if (pt.kind !== 'ember' || pt.sprite) return;
      var k01 = Math.min(1, (t - pt.t0) / pt.life), sz = pt.r * 6;
      o.globalAlpha = Math.min(1, k01 / 0.15) * Math.pow(1 - k01, 1.4); o.drawImage(self.imageOf('glow', pt.color), pt.x - sz / 2, pt.y - sz / 2, sz, sz); o.globalAlpha = 1;
    });
    // the camera impulse
    if (this.impulseFx) {
      var I = this.impulseFx, ip = (t - I.t0) / I.dur;
      if (ip >= 1) { this.field.style.transform = ''; this.impulseFx = null; }
      else this.field.style.transform = 'translate3d(0,' + (I.dirY * I.px * Math.sin(Math.PI * Math.max(0, ip))).toFixed(2) + 'px,0)';
    }
    var ms = perf() - t0; s.frames++; if (this.actors.length) { s.drawMsTotal += ms; s.drawN++; s.liveFrames++; s.liveRealLast = realNow != null ? realNow : perf(); if (s.liveRealT0 == null) s.liveRealT0 = s.liveRealLast; s.drawnPx = Math.round(Math.max.apply(null, this.actors.map(function (a) { return a.pose ? a.pose.cell.h * a.pose.scale : 0; }))); }
  };
  P.drawCanvas = function () {
    var g = this.canvas && this.canvas.getContext('2d'), self = this; if (!g) return;
    g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); g.clearRect(0, 0, this.w, this.h);
    g.globalCompositeOperation = 'source-over';
    this.actors.forEach(function (a) {
      var q = a.pose; if (!q) return; var c = q.cell;
      g.save(); g.globalAlpha = Math.max(0, Math.min(1, q.alpha)); g.translate(q.x, q.y); g.scale((q.flipX ? -1 : 1) * q.scale, q.scale);
      var off = a.dz && a.dz.path === 'mask' ? self.maskedCell(a, q) : null;
      if (off) g.drawImage(off, 0, 0, c.w, c.h, -c.pivot.x, -c.pivot.y, c.w, c.h);
      else g.drawImage(a.art.image, c.x, c.y, c.w, c.h, -c.pivot.x, -c.pivot.y, c.w, c.h);
      g.restore(); self.noteCell(a, q);
    });
  };
  P.drawPixi = function () {
    var PIXI = this.pixi, app = this.app, self = this;
    var g = this.canvas && this.canvas.getContext('2d'); if (g) { g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, this.canvas.width, this.canvas.height); }
    this.actors.forEach(function (a) {
      var q = a.pose; if (!q) return; var c = q.cell;
      var base = self.base[a.cardId] || (self.base[a.cardId] = PIXI.Texture.from(a.art.image));
      a.frames = a.frames || {};
      var key = c.x + ',' + c.y;
      var tex = a.frames[key] || (a.frames[key] = new PIXI.Texture({ source: base.source, frame: new PIXI.Rectangle(c.x, c.y, c.w, c.h) }));
      if (!a.sprite) { a.sprite = new PIXI.Sprite(tex); a.sprite.blendMode = 'normal'; app.stage.addChild(a.sprite); }
      a.sprite.texture = tex; a.sprite.anchor.set(c.pivot.x / c.w, c.pivot.y / c.h);
      a.sprite.position.set(q.x, q.y); a.sprite.scale.set((q.flipX ? -1 : 1) * q.scale, q.scale); a.sprite.alpha = Math.max(0, Math.min(1, q.alpha));
      if (a.dz && a.dz.path === 'shader') self.applyDissolve(a);
    });
    try { app.renderer.render(app.stage); this.actors.forEach(function (a) { if (a.pose && a.sprite) self.noteCell(a, a.pose); }); } catch (e) {}
  };

  // ── THE DISSOLVE ──
  P.dissolve = function (a, fx) {
    var D = root.Dissolve; if (!a || !D) return false;
    var pr = D.resolve(fx), nzKey = pr.seed + ':' + Math.max(2, Math.round(pr.noiseScale));
    if (!this.nz || this.nz.key !== nzKey) this.nz = D.noise(pr);
    a.dz = { pr: pr, nz: this.nz, key: (fx && fx.key) || null, t0: this.now(), dur: Math.max(1, a.dur), r: D.rng((pr.seed * 7919 + a.id) >>> 0),
             emberAcc: 0, smokeAcc: 0, hazeAcc: 0, spawned: 0, peak: 0, puffs: 0, hazes: 0, liveE: 0, capped: 0, sweepDoneT: null, afterSweep: 0, sweep: [], p: 0, ps: 0, th: D.threshold(0, pr), lastT: null,
             path: this.backend === 'pixi' && this.app ? 'shader' : 'mask' };
    return true;
  };
  P.exitOf = function (a) {
    var z = a.dz, s = z.sweep, mono = true;
    for (var i = 1; i < s.length; i++) if (s[i] < s[i - 1]) { mono = false; break; }
    return { name: z.pr.name, key: z.key, kind: 'dissolve', path: z.path, edge: z.pr.edge, dur: z.dur, embers: z.spawned, peak: z.peak, smoke: z.puffs,
             haze: z.hazes, cap: z.path === 'shader' ? z.pr.gpuCap : z.pr.canvasCap, capped: z.capped, sweepFrac: z.pr.sweep, sweepDoneAt: z.sweepDoneT == null ? null : Math.round(z.sweepDoneT - z.t0), afterSweep: z.afterSweep,
             frames: s.length, monotonic: mono, first: s[0], last: s[s.length - 1], progress: z.p };
  };
  // one frame of the dissolve: the sweep, embers and smoke off the front, the particles' motion, the GPU ember sprites
  P.stepDissolve = function (a, t) {
    var D = root.Dissolve, z = a.dz, pr = z.pr, q = a.pose, c = q.cell, self = this;
    var p = Math.min(1, Math.max(0, (t - z.t0) / z.dur)), dt = z.lastT == null ? 0 : Math.max(0, t - z.lastT) / 1000; z.lastT = t;
    var ps = Math.min(1, p / Math.max(0.05, pr.sweep));                 // the erosion's own progress: done at sweep_frac of FIZZLE
    z.p = p; z.ps = ps; z.th = D.threshold(ps, pr); if (z.sweep.length < 2000) z.sweep.push(z.th);
    if (ps >= 1 && z.sweepDoneT == null) z.sweepDoneT = t;
    var left = z.t0 + z.dur - t, gpu = z.path === 'shader', sil = a.art.silhouetteOf ? a.art.silhouetteOf(q.cellIndex) : null, flip = q.flipX ? -1 : 1, lifeK = z.dur / 600, slow = Math.max(1, lifeK);
    var lifeE = z.dur / (pr.lifeRef || 600), slowE = Math.max(1, lifeE), cap = gpu ? pr.gpuCap : pr.canvasCap;
    var at = function (u, v) { return { x: q.x + flip * (u * c.w - c.pivot.x) * q.scale, y: q.y + (v * c.h - c.pivot.y) * q.scale }; };
    var onFigure = function (u, v) {
      if (!(v >= 0 && v <= 1)) return false; if (!sil) return true;
      var i = Math.min(sil.cols - 1, Math.floor(u * sil.cols)); return sil.top[i] >= 0 && v >= sil.top[i] && v <= sil.bottom[i];
    };
    var spawn = function (kind, lift) {
      for (var tries = 0; tries < 5; tries++) {
        var R = z.r, u = R(), v = D.frontAt(z.nz, pr, u, z.th) + lift();
        if (!onFigure(u, v)) continue;
        var s = at(u, v);
        if (kind === 'ember') self.parts.push({ kind: kind, owner: a, x: s.x, y: s.y, vx: (R() - 0.5) * pr.emberSpread / slowE, vy: -(pr.emberRise[0] + R() * (pr.emberRise[1] - pr.emberRise[0])) / slowE,
          r: pr.emberSize[0] + R() * (pr.emberSize[1] - pr.emberSize[0]), t0: t, life: Math.min((pr.emberLife[0] + R() * (pr.emberLife[1] - pr.emberLife[0])) * lifeE, left),
          ph: R() * 6.283, color: pr.emberColor, tint: D.tint(pr.emberColor), slow: slowE, sprite: null });
        else if (kind === 'haze') { var hz = pr.haze; self.parts.push({ kind: kind, owner: a, x: s.x, y: s.y, vx: (R() - 0.5) * 10 / slowE, vy: -(hz.rise[0] + R() * (hz.rise[1] - hz.rise[0])) / slowE,
          r: (hz.size[0] + R() * (hz.size[1] - hz.size[0])) * c.h * q.scale, t0: t, life: Math.min((hz.life[0] + R() * (hz.life[1] - hz.life[0])) * (z.dur / 1500), left), ph: R() * 6.283, color: hz.color, alpha: hz.alpha, slow: slowE, sprite: null }); }
        else self.parts.push({ kind: kind, owner: a, x: s.x, y: s.y, vx: (R() - 0.5) * 14 / slow, vy: -(8 + R() * 16) / slow, r: (0.05 + R() * 0.06) * c.h * q.scale,
          t0: t, life: Math.min((520 + R() * 280) * lifeK, left), ph: R() * 6.283, color: pr.smokeColor, alpha: pr.smokeAlpha, slow: slow, sprite: null });
        return true;
      }
      return false;
    };
    if (ps < 1 && left > 40) {
      z.emberAcc += dt * (gpu ? 150 : 60) * pr.embers / slowE;
      var liftE = pr.emberZone > 0 ? function () { return -z.r() * pr.emberZone; } : function () { return -z.r() * pr.edgeWidth * 0.8; };
      while (z.emberAcc >= 1) { z.emberAcc -= 1; if (z.liveE >= cap) { z.capped++; continue; } if (spawn('ember', liftE)) { z.spawned++; z.liveE++; } }
      if (pr.haze) { z.hazeAcc += dt * pr.haze.rate / slowE; while (z.hazeAcc >= 1) { z.hazeAcc -= 1; if (spawn('haze', function () { return -z.r() * Math.max(pr.emberZone, pr.edgeWidth); })) z.hazes++; } }
      if (pr.smoke) { z.smokeAcc += dt * 14 / slow; while (z.smokeAcc >= 1) { z.smokeAcc -= 1; if (spawn('smoke', function () { return 0.03 + z.r() * 0.1; })) z.puffs++; } }
    }
    var live = 0;
    this.parts = this.parts.filter(function (pt) {
      if (pt.owner !== a) return true;
      var age = t - pt.t0; if (age >= pt.life) { self.dropPart(pt); return false; }
      pt.x += (pt.vx + Math.sin(pt.ph + age / (95 * pt.slow)) * (pt.kind === 'ember' ? 10 : 4) / pt.slow) * dt; pt.y += pt.vy * dt;
      if (pt.kind === 'ember') { pt.vy *= Math.pow(0.6, dt / pt.slow); live++; }
      return true;
    });
    z.peak = Math.max(z.peak, live); z.liveE = live; if (z.sweepDoneT != null && t > z.sweepDoneT) z.afterSweep = Math.max(z.afterSweep, live);
    if (gpu && this.app) {
      var kit = this.gpuKit(z), PIXI = this.pixi, app = this.app;
      this.parts.forEach(function (pt) {
        if (pt.owner !== a || pt.kind !== 'ember') return;
        var sp = pt.sprite;
        if (!sp) { sp = self.pool.pop() || new PIXI.Sprite(kit.glow); sp.anchor.set(0.5); sp.blendMode = 'normal'; pt.sprite = sp; }
        if (!sp.parent) app.stage.addChild(sp);
        var k01 = Math.min(1, (t - pt.t0) / pt.life);
        sp.tint = pt.tint; sp.alpha = Math.min(1, k01 / 0.15) * Math.pow(1 - k01, 1.4); sp.position.set(pt.x, pt.y); sp.scale.set(pt.r * 6 / 64);
      });
    }
  };
  P.dropPart = function (pt) { var sp = pt.sprite; if (sp) { if (sp.parent) sp.parent.removeChild(sp); this.pool.push(sp); pt.sprite = null; } };
  P.docOf = function () { return (this.canvas && this.canvas.ownerDocument) || root.document; };
  P.imageOf = function (kind, color) { var id = kind + '|' + color, D = root.Dissolve; return this.tex[id] || (this.tex[id] = kind === 'glow' ? D.glowCanvas(this.docOf(), color) : D.puffCanvas(this.docOf(), color)); };
  // the GPU kit: one glow texture for the ember pool, the uniforms, and the filter (rebuilt only when the noise changes)
  P.gpuKit = function (z) {
    var PIXI = this.pixi, D = root.Dissolve;
    if (!this.dz) {
      var v4 = function (a) { return { value: new Float32Array(a), type: 'vec4<f32>' }; };
      this.dz = { glow: PIXI.Texture.from(D.glowCanvas(this.docOf(), '#ffffff')), noiseKey: null, filter: null,
                  ug: new PIXI.UniformGroup({ uEdge: v4([1, 0.4, 0.8, 1]), uCore: v4([1, 1, 1, 1]), uParams: v4([0, 0.02, 0.06, 0.24]), uParams2: v4([0.6, 0.4, 0, 0]) }) };
    }
    var k = this.dz;
    if (k.noiseKey !== z.nz.key) {
      var tex = PIXI.Texture.from(D.noiseCanvas(this.docOf(), z.nz)), S = D.SHADER;
      k.noise = tex; k.noiseKey = z.nz.key;
      k.filter = new PIXI.Filter({
        glProgram: PIXI.GlProgram.from({ vertex: S.glVertex, fragment: S.glFragment, name: 'lab-dissolve' }),
        gpuProgram: PIXI.GpuProgram.from({ vertex: { source: S.wgsl, entryPoint: 'mainVertex' }, fragment: { source: S.wgsl, entryPoint: 'mainFragment' } }),
        resources: { dissolveUniforms: k.ug, uNoise: tex.source, uNoiseSampler: tex.source && tex.source.style },
        padding: 0, resolution: this.dpr,
      });
    }
    return k;
  };
  P.applyDissolve = function (a) {
    var D = root.Dissolve, z = a.dz, pr = z.pr, k = this.gpuKit(z), U = k.ug.uniforms, e = D.rgb(pr.edge), c = D.rgb(pr.core);
    U.uEdge[0] = e[0]; U.uEdge[1] = e[1]; U.uEdge[2] = e[2]; U.uCore[0] = c[0]; U.uCore[1] = c[1]; U.uCore[2] = c[2];
    U.uParams[0] = z.th; U.uParams[1] = pr.soft; U.uParams[2] = pr.edgeWidth; U.uParams[3] = pr.charge; U.uParams2[0] = pr.chargeAlpha; U.uParams2[1] = pr.noise;
    if (k.ug.update) k.ug.update();
    if (!a.sprite.filters || a.sprite.filters[0] !== k.filter) a.sprite.filters = [k.filter];
  };
  // the Canvas 2D path: the held cell, masked by this frame's erosion (destination-in), the front's glow over what is left (source-atop)
  P.maskedCell = function (a, q) {
    var D = root.Dissolve, z = a.dz, c = q.cell, id = a.cardId + '#' + q.cellIndex + '|' + z.nz.key + '|' + z.pr.noise, k = this.cz[id], doc = this.docOf();
    if (!k) {
      var mk = function (w, h) { var cv = doc.createElement('canvas'); cv.width = w; cv.height = h; return cv; };
      var w2 = Math.max(1, Math.ceil(c.w / 2)), h2 = Math.max(1, Math.ceil(c.h / 2)), off = mk(c.w, c.h), mc = mk(w2, h2), gc = mk(w2, h2), mctx = mc.getContext('2d'), gctx = gc.getContext('2d');
      var img = function (g2) { var im = g2 && g2.createImageData ? g2.createImageData(w2, h2) : null; return im && im.data ? im : { data: new Uint8ClampedArray(w2 * h2 * 4), width: w2, height: h2 }; };
      k = this.cz[id] = { off: off, octx: off.getContext('2d'), mc: mc, gc: gc, mctx: mctx, gctx: gctx, w2: w2, h2: h2, grid: D.grid(z.nz, z.pr, w2, h2), mimg: img(mctx), gimg: img(gctx) };
    }
    D.paint(k.grid, z.th, z.pr, k.mimg.data, k.gimg.data);
    k.mimg.__role = 'mask'; k.mimg.__cell = q.cellIndex; k.gimg.__role = 'glow';
    k.mctx.putImageData(k.mimg, 0, 0); k.gctx.putImageData(k.gimg, 0, 0);
    var o = k.octx; o.setTransform(1, 0, 0, 1, 0, 0);
    o.globalCompositeOperation = 'source-over'; o.clearRect(0, 0, c.w, c.h); o.drawImage(a.art.image, c.x, c.y, c.w, c.h, 0, 0, c.w, c.h);
    o.globalCompositeOperation = 'destination-in'; o.drawImage(k.mc, 0, 0, k.w2, k.h2, 0, 0, c.w, c.h);
    o.globalCompositeOperation = 'source-atop'; o.drawImage(k.gc, 0, 0, k.w2, k.h2, 0, 0, c.w, c.h);
    o.globalCompositeOperation = 'source-over';
    return k.off;
  };

  // THE CLEANUP GUARANTEE — no actor, sprite, effect or camera offset survives this
  P.clear = function () {
    var self = this;
    this.actors.slice().forEach(function (a) { self.remove(a); });
    this.parts.forEach(function (pt) { self.dropPart(pt); }); this.parts = [];
    this.actors = []; this.fx = []; this.impulseFx = null; this.frozenUntil = -1;
    this.field.style.transform = '';
    [this.under, this.canvas, this.over].forEach(function (c) { var g = c && c.getContext('2d'); if (g) { g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, c.width, c.height); } });
    if (this.app) { try { this.app.stage.removeChildren(); this.app.renderer.render(this.app.stage); } catch (e) {} }
    this.closeLiveWindow();
  };
  P.liveActors = function () { return this.actors.length; };                                            // actors on stage (one per manifestation)
  P.liveParticles = function () { return this.parts.length; };                                          // dissolve embers and smoke still alive
  P.liveSprites = function () { return this.app ? this.app.stage.children.length : 0; };                  // GPU sprites still attached (0 once cleared)
  P.stats = function () {
    var s = this.stat;
    return { backend: this.renderer, frames: s.frames, drawMsAvg: s.drawN ? s.drawMsTotal / s.drawN : 0, fps: s.fps, liveFps: (s.liveRealT0 != null && s.liveRealLast > s.liveRealT0) ? Math.round(s.liveFrames * 1000 / (s.liveRealLast - s.liveRealT0)) : null, cellPx: s.cellPx, drawnPx: s.drawnPx,
             cellsDrawn: this.actors.length ? this.playOf(this.actors[0], true) : s.lastPlay,
             exit: this.actors.length && this.actors[0].dz ? this.exitOf(this.actors[0]) : s.lastExit,
             decodedBytes: this.decodedBytes(), actorsLoaded: Object.keys(this.assets).length, peakDecoded: s.peakDecoded, loads: s.loads, unloads: s.unloads };
  };

  root.ActorStage = ActorStage;
})(typeof window !== 'undefined' ? window : this);
