/* lib/playback.js — VFX-LAB-3. The wiring from a Director plan's cues to the stage and the board. Card-agnostic: everything
   about the page arrives through `env`, so the same wiring runs in the lab page and in a test.
   env = { stage (ActorStage), ctx (ClashContext), boards {entry, settle, final}, viewer,
           rectOf(uid) → field-local {x,y,w,h} | null, clientOf(uid) → client {cx,cy,w} | null, field {w,h}, bandOf(seat) → rect | null,
           render(board, floats), pulse(uid, ms), actorFor(cardId) → {manifest,image} | null, factionFx(faction) → {name, portal, exit, dissolve},
           embers(clientX, clientY) (the existing ember recipe), queueFx(event, board, skipped), onDone(result),
           sound?(name) — 'contact' on the contact cell, 'exit' as FIZZLE starts (LAB-5), release?(cardId) — after SETTLE (LAB-5) }
   A1 on every cue: the actor acts toward the enemy side and never reaches the enemy cards (StageMath); nothing is drawn on the
   target; the numbers land at SETTLE from the board difference, and the queued events land theirs after.
   Browser: window.Playback. Node: require (with a stub env). */
(function (root) {
  'use strict';
  var CC = (typeof module !== 'undefined' && module.exports) ? require('./clashcontext.js') : root.ClashContext;
  var SM = (typeof module !== 'undefined' && module.exports) ? require('./stagemath.js') : root.StageMath;
  var clone = function (x) { return JSON.parse(JSON.stringify(x)); };

  function create(env) {
    var ctx = env.ctx, actor = null, working = null, log = [];
    var side = ctx.seat === env.viewer ? 'me' : 'opp';
    var fx = env.factionFx(ctx.faction) || {};
    function placement() {
      var art = env.actorFor(ctx.cardId), card = env.rectOf(ctx.sourceUid);
      if (!art || !card) return null;
      var pl = SM.place({ card: card, side: side, fieldW: env.field.w, fieldH: env.field.h, band: env.bandOf(1 - ctx.seat), refHeight: art.manifest.refHeight, facing: art.manifest.facing });
      // LAB-10: the card says how far it charges (travelScale, default 1); LAB-9a: a nova bursts where it stands whatever it says
      var ts = art.manifest.contactRule === 'nova' ? 0 : (root.ActorManifest || require('./manifest.js')).travelScale(art.manifest);
      if (ts !== 1) pl.travel = { x: pl.travel.x * ts, y: pl.travel.y * ts };
      return pl;
    }
    function ensureActor() {
      if (actor) return actor;
      var pl = placement(); if (!pl) return null;
      actor = env.stage.spawn(ctx.cardId, pl, ctx.faction);
      return actor;
    }
    var handlers = {
      cue: function (c, info) {
        log.push(c.cue + (info.skipped ? '·skipped' : ''));
        switch (c.cue) {
          case 'board-entry': working = clone(env.boards.entry); env.render(working, []); break;
          case 'portal-open': {
            if (info.skipped) break;
            var r = env.rectOf(ctx.sourceUid), cl = env.clientOf(ctx.sourceUid); if (!r) break;
            env.stage.portal(r.x + r.w / 2, r.y + r.h * 0.6, r.w * 1.1, fx.portal || 'rgba(255,220,160,0.8)', c.dur);
            if (fx.exit === 'embers' && cl) env.embers(cl.cx, cl.cy);
            break;
          }
          case 'actor-phase': { if (info.skipped) break; var a = ensureActor(); if (a) env.stage.setPhase(a, c.phase, c.dur, c.contactFrac, c.cellFps, c.cellStep); break; }
          case 'contact': {
            if (info.skipped || !actor) break;
            var who = actor;
            var hit = function () {
              if (!who.pose) return;
              var q = who.pose, h = who.pl.height, mf = who.art && who.art.manifest;
              // LAB-9: the card's contact strength scales the flash (its length and its radius) and the camera impulse; a self-cast may set impulse 0
              var st = (root.ActorManifest || require('./manifest.js')).contactStrength(mf), flashMs = Math.max(1, Math.round(c.flashMs * st.flash)), px = c.impulsePx * st.impulse;
              env.stage.hitstop(c.hitstopMs);
              if (env.sound) env.sound('contact');   // LAB-5: the strike, on the frame the contact cell is drawn
              // LAB-8 · contact rule "nova": a radial flash from the actor's centre; every other rule: the directional flash toward the target
              if (mf && mf.contactRule === 'nova') env.stage.flash(q.x, q.feetY - h * 0.5, h * 0.9 * st.flash, 0, flashMs, 'radial');
              else env.stage.flash(q.x, q.feetY - h * 0.55, h * 0.9 * st.flash, who.pl.dirY, flashMs);   // the flash and the impulse point at the true target (dirY), whatever way the action is drawn
              if (px > 0) env.stage.impulse(who.pl.dirY, px, c.impulseMs);   // LAB-9: impulse 0 = no camera move at all
            };
            // LAB-4a: a native actor's contact lands on its contact CELL — the stage fires it on the frame that cell is drawn
            if (c.contactCell != null && env.stage.onCell) env.stage.onCell(who, 'act', c.contactCell, hit); else hit();
            break;
          }
          case 'exit-fx': {
            if (info.skipped || !actor) break;
            // LAB-4b: the faction's dissolve — the stage erodes the held cell over FIZZLE (the actor-phase cue just set its length)
            if (fx.exit === 'dissolve' && env.stage.dissolve) { env.stage.dissolve(actor, fx); if (env.sound) env.sound('exit'); break; }   // LAB-5: the ember exit's sound as FIZZLE starts
            if (!actor.pose) break;
            if (fx.exit === 'embers' && env.sound) env.sound('exit');
            if (fx.exit === 'embers') { var p = actor.pose, fr = env.fieldClient ? env.fieldClient() : { x: 0, y: 0 }; env.embers(fr.x + p.x, fr.y + p.feetY - actor.pl.height * 0.4); env.embers(fr.x + p.x, fr.y + p.feetY - actor.pl.height * 0.8); }
            break;
          }
          case 'actor-gone': if (actor) { if (!(env.stage.finish && env.stage.finish(actor))) env.stage.remove(actor); actor = null; } break;   // LAB-8: a native-exit actor that is behind finishes its cells first
          case 'card-pulse': if (!info.skipped) env.pulse(ctx.sourceUid, c.dur); break;
          case 'settle': working = clone(env.boards.settle); env.render(working, info.skipped ? [] : c.floats); break;
          case 'queue': {
            if (!working) working = clone(env.boards.settle);
            var floats = CC.applyEvent(working, c.event);
            env.render(working, info.skipped ? [] : floats);
            env.queueFx(c.event, working, info.skipped);
            break;
          }
          case 'done': {
            var ok = JSON.stringify(CC.project(working)) === JSON.stringify(CC.project(env.boards.final));
            env.onDone({ equalsFinal: ok });
            break;
          }
        }
      },
      cleanup: function () {
        env.stage.clear(); actor = null;
        // LAB-5 (A5): after SETTLE the actor's decoded atlas goes — the page drops its bitmap too; between plays 0 actor MB
        if (env.release) env.release(ctx.cardId); else if (env.stage.unloadActor) env.stage.unloadActor(ctx.cardId);
      },
      error: function (e) { if (env.onError) env.onError(e); },
    };
    return { handlers: handlers, log: log, get actor() { return actor; }, get board() { return working; }, placement: placement };
  }
  var OUT = { create: create };
  root.Playback = OUT;
  if (typeof module !== 'undefined' && module.exports) module.exports = OUT;
})(typeof window !== 'undefined' ? window : this);
