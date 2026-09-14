/* lib/labaudio.js — VFX-LAB-5. The manifestation's two sounds, through the GAME'S OWN AUDIO PATTERN, copied into the lab (the game's
   Audio2 in index.html is read, never modified):
     · one AudioContext, created on the first user gesture and never before (a suspended pre-gesture context is what the game avoids)
     · pre-normalized files fetched and decoded into buffers once; a missing file gives up silently, never retries
     · a FRESH BufferSource per trigger, into a file-SFX gain straight to the output (no limiter, no per-sound gain compensation),
       so back-to-back strikes overlap and are never cut off
     · the game's own sound switch and volume, read at every trigger from the same storage keys: dy_sfx ('0' = sound off) and
       dy_sfxvol (0–100, default 80 — parsed exactly as the game parses it)
   The lab plays: 'contact' on the contact cell, 'exit' as FIZZLE starts. Placeholders from the game's assets (see audio/ and README).
   Browser: window.LabAudio. Node: require (settings and create take injected storage/window). */
(function (root) {
  'use strict';
  // the game: let sfxOn = localStorage.getItem('dy_sfx')!=='0'; let sfxVol=(parseInt(localStorage.getItem('dy_sfxvol'))||80)/100;
  function settings(store) {
    var get = function (k) { try { return store ? store.getItem(k) : null; } catch (e) { return null; } };
    return { sfxOn: get('dy_sfx') !== '0', sfxVol: (parseInt(get('dy_sfxvol')) || 80) / 100 };
  }
  function create(o) {
    o = o || {};
    var W = o.window || root, store = o.storage || (W && W.localStorage), files = o.files || {};
    var ctx = null, fileGain = null, buffers = {}, loading = null, loaded = false, log = [];
    function ensure() {
      if (ctx) return;
      var AC = W && (W.AudioContext || W.webkitAudioContext); if (!AC) return;
      try { ctx = new AC(); } catch (e) { ctx = null; return; }
      fileGain = ctx.createGain(); fileGain.gain.value = settings(store).sfxVol; fileGain.connect(ctx.destination);
    }
    function load() {
      if (loading) return loading; if (!ctx) return Promise.resolve();
      loading = Promise.all(Object.keys(files).map(function (k) {
        return W.fetch(files[k]).then(function (r) { return r.arrayBuffer(); }).then(function (a) { return ctx.decodeAudioData(a); }).then(function (b) { buffers[k] = b; }).catch(function () {});
      })).then(function () { loaded = true; });
      return loading;
    }
    function unlock() { ensure(); if (!ctx) return; if (ctx.state === 'suspended' && ctx.resume) ctx.resume(); load(); }
    function start(name) {
      var st = settings(store);
      if (!st.sfxOn || !ctx) return;
      if (!buffers[name]) { if (loaded) return; load().then(function () { start(name); }); return; }   // decoded but absent → give up silently
      fileGain.gain.value = st.sfxVol;
      var src = ctx.createBufferSource(); src.buffer = buffers[name]; src.connect(fileGain); src.start();
    }
    // what a trigger did: 'muted' (the game's sound is off) · 'locked' (no gesture yet — the game is silent then too) · 'played'
    function play(name) {
      var st = settings(store), outcome = !st.sfxOn ? 'muted' : !ctx ? 'locked' : 'played';
      log.push({ name: name, outcome: outcome, t: o.now ? o.now() : Date.now() });
      if (outcome === 'played') start(name);
      return outcome;
    }
    return { unlock: unlock, play: play, log: log, settings: function () { return settings(store); },
             get state() { return ctx ? ctx.state : 'no context (waiting for a gesture)'; }, get buffered() { return Object.keys(buffers); } };
  }
  var OUT = { settings: settings, create: create };
  root.LabAudio = OUT;
  if (typeof module !== 'undefined' && module.exports) module.exports = OUT;
})(typeof window !== 'undefined' ? window : this);
