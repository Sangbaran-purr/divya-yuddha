/* lib/manifest.js — VFX-LAB-3. The ACTOR asset class (ruling A4), validated: real alpha (straight), normal blending, no
   vignette, trimmed rectangular cells with pivot data, cells at most 512 px, NO motion vectors. One manifest per card:
   { cardId, class:"actor", atlas, atlasSize{w,h}, alpha:"straight", blend:"normal", mv:false, vignette:false, cellMax:512,
     fps, facing:"left"|"right", mirror:true | variants:{left,right}, refHeight, cells:[{x,y,w,h,pivot{x,y}}],
     phases:{ emerge:[cell…], act:[cell…], fizzle:[cell…] } }
   validate(m) → { ok, errors[] }. Browser: window.ActorManifest. Node: require. */
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
    return { ok: e.length === 0, errors: e };
  }
  var OUT = { validate: validate, PHASES: PHASES };
  root.ActorManifest = OUT;
  if (typeof module !== 'undefined' && module.exports) module.exports = OUT;
})(typeof window !== 'undefined' ? window : this);
