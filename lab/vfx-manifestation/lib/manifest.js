/* lib/manifest.js — VFX-LAB-3. The ACTOR asset class (ruling A4), validated: real alpha (straight), normal blending, no
   vignette, trimmed rectangular cells with pivot data, cells at most 512 px, NO motion vectors. One manifest per card:
   { cardId, class:"actor", atlas, atlasSize{w,h}, alpha:"straight", blend:"normal", mv:false, vignette:false, cellMax:512,
     fps, facing:"left"|"right", mirror:true | variants:{left,right}, refHeight, cells:[{x,y,w,h,pivot{x,y}}],
     phases:{ emerge:[cell…], act:[cell…], fizzle:[cell…] }, contact? (index inside act), timing? "native"|"grammar",
     tempo? (the card's default, 0.25–4 — LAB-4d), phaseMs? { emerge, act } (phase lengths at tempo 1) }
   validate(m) → { ok, errors[] }. defaultsFor({ manifest, registry, preset, override }) → the tempo and FIZZLE length a play starts
   from (LAB-4d). Browser: window.ActorManifest. Node: require. */
(function (root) {
  'use strict';
  var PHASES = ['emerge', 'act', 'fizzle'];
  function validate(m) {
    var e = [];
    var num = function (v) { return typeof v === 'number' && isFinite(v); };
    if (!m || typeof m !== 'object') return { ok: false, errors: ['not an object'] };
    if (typeof m.cardId !== 'string' || !m.cardId) e.push('cardId missing');
    if (m.class !== 'actor') e.push('class must be "actor"');
    if (typeof m.atlas !== 'string' || !m.atlas) e.push('atlas missing');
    if (!m.atlasSize || !num(m.atlasSize.w) || !num(m.atlasSize.h) || m.atlasSize.w <= 0 || m.atlasSize.h <= 0) e.push('atlasSize missing');
    if (m.alpha !== 'straight') e.push('alpha must be "straight" (real alpha — A4; not brightness-to-alpha)');
    if (m.blend !== 'normal') e.push('blend must be "normal" (source-over — A4)');
    if (m.mv !== false) e.push('mv must be false (no motion vectors for actors — A4)');
    if (m.vignette !== false) e.push('vignette must be false (A4)');
    if (m.cellMax !== 512) e.push('cellMax must be 512 (A4)');
    if (!num(m.fps) || m.fps < 1 || m.fps > 60) e.push('fps must be 1–60');
    if (m.facing !== 'left' && m.facing !== 'right') e.push('facing must be "left" or "right"');
    if (m.mirror !== true && !(m.variants && m.variants.left && m.variants.right)) e.push('needs mirror:true or variants {left, right}');
    var cells = Array.isArray(m.cells) ? m.cells : null;
    if (!cells || !cells.length) e.push('cells missing');
    (cells || []).forEach(function (c, i) {
      if (!c || !num(c.x) || !num(c.y) || !num(c.w) || !num(c.h) || c.w <= 0 || c.h <= 0) { e.push('cell ' + i + ' rect invalid'); return; }
      if (c.w > 512 || c.h > 512) e.push('cell ' + i + ' exceeds 512 px (' + c.w + '×' + c.h + ')');
      if (m.atlasSize && (c.x < 0 || c.y < 0 || c.x + c.w > m.atlasSize.w || c.y + c.h > m.atlasSize.h)) e.push('cell ' + i + ' outside the atlas');
      if (!c.pivot || !num(c.pivot.x) || !num(c.pivot.y) || c.pivot.x < 0 || c.pivot.y < 0 || c.pivot.x > c.w || c.pivot.y > c.h) e.push('cell ' + i + ' pivot missing or outside its cell');
    });
    if (!num(m.refHeight) || m.refHeight <= 0) e.push('refHeight missing');
    PHASES.forEach(function (p) {
      var list = m.phases && m.phases[p];
      if (!Array.isArray(list) || !list.length) { e.push('phase ' + p + ' missing'); return; }
      list.forEach(function (ix) { if (!(Number.isInteger(ix) && cells && ix >= 0 && ix < cells.length)) e.push('phase ' + p + ' names cell ' + ix + ', which does not exist'); });
    });
    if (m.timing != null && m.timing !== 'native' && m.timing !== 'grammar') e.push('timing must be "native" or "grammar"');
    if (m.tempo != null && !(num(m.tempo) && m.tempo >= 0.25 && m.tempo <= 4)) e.push('tempo must be a number 0.25–4');
    if (m.phaseMs != null && !(m.phaseMs && num(m.phaseMs.emerge) && num(m.phaseMs.act) && m.phaseMs.emerge > 0 && m.phaseMs.act > 0)) e.push('phaseMs must give emerge and act lengths in ms');
    if (m.contact != null) { var act = m.phases && m.phases.act; if (!(Number.isInteger(m.contact) && Array.isArray(act) && m.contact >= 0 && m.contact < act.length)) e.push('contact must be a cell index inside the act phase'); }
    return { ok: e.length === 0, errors: e };
  }
  // LAB-4d · THE DEFAULTS A PLAY STARTS FROM, card-agnostic: tempo = the card's manifest tempo, else the registry's defaults block
  // (data/manifestations.json), else 1; FIZZLE = the exit preset's fizzle_ms, else the registry's defaults, else 600 ms. A session
  // override (the lab's sliders) wins over both. `base` is the default without the override; `from` says where each value came from.
  function defaultsFor(o) {
    o = o || {};
    var m = o.manifest || {}, d = (o.registry && o.registry.defaults) || {}, pr = o.preset || {}, ov = o.override || {};
    var pos = function (v) { return typeof v === 'number' && isFinite(v) && v > 0; };
    var t = pos(m.tempo) ? [m.tempo, 'manifest'] : pos(d.tempo) ? [d.tempo, 'defaults'] : [1, 'built-in'];
    var z = pos(pr.fizzle_ms) ? [pr.fizzle_ms, 'preset'] : pos(d.fizzle_ms) ? [d.fizzle_ms, 'defaults'] : [600, 'built-in'];
    return { tempo: pos(ov.tempo) ? ov.tempo : t[0], fizzleMs: pos(ov.fizzleMs) ? ov.fizzleMs : z[0], base: { tempo: t[0], fizzleMs: z[0] },
             from: { tempo: pos(ov.tempo) ? 'slider' : t[1], fizzleMs: pos(ov.fizzleMs) ? 'slider' : z[1] } };
  }
  var OUT = { validate: validate, defaultsFor: defaultsFor, PHASES: PHASES };
  root.ActorManifest = OUT;
  if (typeof module !== 'undefined' && module.exports) module.exports = OUT;
})(typeof window !== 'undefined' ? window : this);
