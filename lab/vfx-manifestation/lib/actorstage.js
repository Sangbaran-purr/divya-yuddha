/* lib/actorstage.js — VFX-LAB-3. The stage for ACTORS (ruling A4): draws a manifest's cells with real alpha and NORMAL
   (source-over) blending — never additive, never brightness-to-alpha — above the board and its effect canvases, under the
   floating numbers. Card-agnostic: it knows cells, pivots and phases, never a card.
   Three canvases, in layer order: #actorunder (the portal glow and the soft contact shadow) · the actor (Canvas 2D on
   #actorcanvas, or a Pixi sprite on #actorgpu) · #actorover (the ACT's directional flash). The camera impulse moves the
   whole #field for a moment, board and all.
   The clock is injected (lab time): hit-stop freezes the actor's own animation, never the page. clear() is the cleanup
   guarantee — no actor, no effect, no transform survives it. stats() is the performance readout (real frames).
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
    this.dpr = Math.min(2, root.devicePixelRatio || 1);
    this.stat = { frames: 0, drawMsTotal: 0, drawN: 0, liveFrames: 0, liveRealT0: null, liveRealLast: null, fps: 0, cellPx: 0, drawnPx: 0 };
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
    this.app = null; this.base = {};
    if (this.gpuCanvas) { try { var g = this.gpuCanvas.getContext && this.gpuCanvas.getContext('2d'); if (g) g.clearRect(0, 0, this.gpuCanvas.width, this.gpuCanvas.height); } catch (e) {} }
    this.actors.forEach(function (a) { a.sprite = null; });
  };

  // an actor's art: { manifest, image } (the image already decoded)
  P.loadActor = function (cardId, art) { this.assets[cardId] = art; this.stat.cellPx = Math.max.apply(null, art.manifest.cells.map(function (c) { return Math.max(c.w, c.h); })); };

  // spawn = place it (StageMath.place output) at its card, in phase `phase`
  P.spawn = function (cardId, placement, faction) {
    var art = this.assets[cardId]; if (!art) return null;
    var a = { id: this.nextId++, cardId: cardId, art: art, pl: placement, faction: faction, phase: 'emerge', dur: 1, pt: 0, lastT: this.now(), contact: 0.58, pose: null, sprite: null };
    this.actors.push(a);
    if (this.stat.liveRealT0 == null) { this.stat.liveRealT0 = perf(); this.stat.liveFrames = 0; }
    return a;
  };
  P.setPhase = function (a, phase, dur, contactFrac) { if (!a) return; a.phase = phase; a.dur = Math.max(1, dur); a.pt = 0; a.lastT = this.now(); if (contactFrac != null) a.contact = contactFrac; };
  P.remove = function (a) {
    if (!a) return;
    if (a.sprite && a.sprite.parent) { try { a.sprite.parent.removeChild(a.sprite); a.sprite.destroy(); } catch (e) {} }
    this.actors = this.actors.filter(function (x) { return x !== a; });
    if (!this.actors.length) this.closeLiveWindow();
  };
  P.closeLiveWindow = function () {
    var s = this.stat; if (s.liveRealT0 != null && s.liveRealLast != null && s.liveRealLast > s.liveRealT0) s.fps = Math.round(s.liveFrames * 1000 / (s.liveRealLast - s.liveRealT0));
    s.liveRealT0 = null; s.liveRealLast = null;
  };

  P.hitstop = function (ms) { this.frozenUntil = this.now() + ms; };
  P.portal = function (x, y, radius, color, dur) { this.fx.push({ kind: 'portal', x: x, y: y, r: radius, color: color, t0: this.now(), dur: Math.max(1, dur) }); };
  P.flash = function (x, y, radius, dirY, dur) { this.fx.push({ kind: 'flash', x: x, y: y, r: radius, dirY: dirY, t0: this.now(), dur: Math.max(1, dur) }); };
  P.impulse = function (dirY, px, dur) { this.impulseFx = { dirY: dirY, px: px, t0: this.now(), dur: Math.max(1, dur) }; };

  // the pose of one actor at lab time t
  P.poseOf = function (a, t) {
    var dt = t - a.lastT; a.lastT = t; if (t >= this.frozenUntil) a.pt += Math.max(0, dt);
    var p = Math.min(1, a.pt / a.dur), m = a.art.manifest, cells = m.phases[a.phase] || m.phases.act;
    var cell = m.cells[cells[Math.min(cells.length - 1, Math.floor(p * cells.length))]];
    var pl = a.pl, alpha = 1, sc = 1, rise = 0, k = 0;
    if (a.phase === 'emerge') { var e = easeOut(p); alpha = e; sc = 0.72 + 0.28 * e; rise = (1 - e) * pl.height * 0.35; }
    else if (a.phase === 'act') { var c = a.contact; k = p < c ? easeIn(p / c) : 1 - 0.18 * easeOut((p - c) / (1 - c)); }
    else if (a.phase === 'fizzle') { k = 0.82; alpha = 1 - easeIn(p); sc = 1 + 0.06 * p; rise = -10 * p; }
    return { cell: cell, x: pl.anchor.x + pl.travel.x * k, feetY: pl.anchor.y + pl.travel.y * k, y: pl.anchor.y + pl.travel.y * k + rise, scale: pl.scale * sc, alpha: alpha, flipX: pl.flipX };
  };

  P.frame = function (t, realNow) {
    var t0 = perf(), self = this, s = this.stat;
    this.fx = this.fx.filter(function (f) { return t - f.t0 < f.dur; });
    this.actors.forEach(function (a) { a.pose = self.poseOf(a, t); });
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
      u.globalAlpha = q.alpha; u.fillStyle = g; u.beginPath(); u.ellipse(q.x, q.feetY, rx, ry, 0, 0, Math.PI * 2); u.fill(); u.globalAlpha = 1;
    });
    // THE ACTOR — normal blending, real alpha
    if (this.backend === 'pixi' && this.app) this.drawPixi(); else this.drawCanvas();
    // OVER: the directional flash
    if (o) this.fx.forEach(function (f) {
      if (f.kind !== 'flash') return;
      var p = (t - f.t0) / f.dur, cy = f.y + f.dirY * f.r * 0.35;
      var g = o.createRadialGradient(f.x, cy, 0, f.x, cy, f.r); g.addColorStop(0, 'rgba(255,242,220,0.9)'); g.addColorStop(1, 'rgba(255,242,220,0)');
      o.globalAlpha = 0.6 * (1 - p); o.fillStyle = g; o.beginPath(); o.ellipse(f.x, cy, f.r * 0.7, f.r, 0, 0, Math.PI * 2); o.fill(); o.globalAlpha = 1;
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
      g.drawImage(a.art.image, c.x, c.y, c.w, c.h, -c.pivot.x, -c.pivot.y, c.w, c.h); g.restore();
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
    });
    try { app.renderer.render(app.stage); } catch (e) {}
  };

  // THE CLEANUP GUARANTEE — no actor, sprite, effect or camera offset survives this
  P.clear = function () {
    var self = this;
    this.actors.slice().forEach(function (a) { self.remove(a); });
    this.actors = []; this.fx = []; this.impulseFx = null; this.frozenUntil = -1;
    this.field.style.transform = '';
    [this.under, this.canvas, this.over].forEach(function (c) { var g = c && c.getContext('2d'); if (g) { g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, c.width, c.height); } });
    if (this.app) { try { this.app.stage.removeChildren(); this.app.renderer.render(this.app.stage); } catch (e) {} }
    this.closeLiveWindow();
  };
  P.liveActors = function () { return this.actors.length; };                                            // actors on stage (one per manifestation)
  P.liveSprites = function () { return this.app ? this.app.stage.children.length : 0; };                  // GPU sprites still attached (0 once cleared)
  P.stats = function () {
    var s = this.stat;
    return { backend: this.renderer, frames: s.frames, drawMsAvg: s.drawN ? s.drawMsTotal / s.drawN : 0, fps: s.fps, liveFps: (s.liveRealT0 != null && s.liveRealLast > s.liveRealT0) ? Math.round(s.liveFrames * 1000 / (s.liveRealLast - s.liveRealT0)) : null, cellPx: s.cellPx, drawnPx: s.drawnPx };
  };

  root.ActorStage = ActorStage;
})(typeof window !== 'undefined' ? window : this);
