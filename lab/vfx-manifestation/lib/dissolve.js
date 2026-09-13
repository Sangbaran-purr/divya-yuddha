/* lib/dissolve.js — VFX-LAB-4b. THE DISSOLVE EXIT: the maths, pure and card-agnostic (the stage draws; this file computes).
   The reference is the Kling clip's own dissolve (frames 89–120; the sheet is frames/meghnad_tail_contact_sheet.jpg): energy in
   the faction's colour lights up the legs and climbs the figure, the body breaks up from the bottom behind a glowing front, embers
   rise off the front and fade, faint dark smoke hangs behind it.
   THE FIELD. Every point (u, v) of the held cell (v = 0 at the head, 1 at the feet) has an erosion value
       f(u, v) = (1 − v)·(1 − k) + noise(u, v)·k            k = the preset's `noise`
   Low values go first: the feet first, and a ragged front.
   THE SWEEP. Over FIZZLE the threshold t = threshold(p) rises monotonically from below 0 to above 1. A point's alpha is
       keep = clamp((f − t) / soft, 0, 1)
   which can only fall as t rises: once a pixel is gone it never comes back. Just above the front (f − t < edgeWidth) the band
   takes the edge colour, hottest at the front (the core colour); further above (f − t < charge) the noise's veins light up in the
   edge colour — the energy that climbs ahead of the break-up.
   The GPU path (SHADER: a Pixi filter, GLSL for WebGL and WGSL for WebGPU) and the Canvas 2D path (grid + paint: a half-resolution
   mask and glow built from the same noise) share this maths. Embers rise from frontAt(). glowCanvas() and puffCanvas() are the
   only particle images — one soft 64 px disc, one soft 128 px puff — always drawn at or below their own size, so nothing is grainy.
   Everything here is normal-blended.
   Presets: data/factionfx.json, one entry per faction ({ name, portal, exit: "dissolve", dissolve: {…} }); DEFAULTS fill whatever a
   preset leaves out. pick() chooses the faction's entry, or the lab's preview override.
   Browser: window.Dissolve. Node: require. */
(function (root) {
  'use strict';
  var DEFAULTS = {
    edge: '#ff6ec7', core: '#fff0f8',       // the front's colour, and the hottest line at it
    edgeWidth: 0.06, soft: 0.02,            // the band above the front, and the erosion's own softness (units of f)
    charge: 0.24, chargeAlpha: 0.6,         // how far above the front the veins light up, and how strongly
    noise: 0.4, noiseScale: 6,              // how ragged the front is, and how many noise cells cross the figure
    embers: 1, emberColor: '#ff9ad8',       // ember density (× the path's base rate) and colour
    emberSize: [1.1, 2.4], emberRise: [36, 80], emberLife: [380, 640],   // px radius · px/s upward · ms (clamped to FIZZLE's end)
    smoke: true, smokeColor: '#1c1a1e', smokeAlpha: 0.18,                // faint dark puffs behind the front
    seed: 7,
  };
  var N = 128, GLOW = 64, PUFF = 128;

  function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function rng(seed) {
    var s = seed >>> 0;
    return function () { s = (s + 0x6D2B79F5) >>> 0; var t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function rgb(c) {
    var m = /^#([0-9a-f]{6})$/i.exec(String(c || '').trim());
    if (m) { var n = parseInt(m[1], 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; }
    m = /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i.exec(String(c || ''));
    return m ? [+m[1] / 255, +m[2] / 255, +m[3] / 255] : [1, 1, 1];
  }
  function tint(c) { var v = rgb(c); return (Math.round(v[0] * 255) << 16) | (Math.round(v[1] * 255) << 8) | Math.round(v[2] * 255); }
  function resolve(fx) {
    var src = (fx && fx.dissolve) || {}, d = {};
    for (var k in DEFAULTS) d[k] = src[k] != null ? src[k] : DEFAULTS[k];
    d.name = (fx && fx.name) || 'Default'; d.key = (fx && fx.key) || null;
    return d;
  }
  // the faction's entry, or the preview override when it names one; always carries its key
  function pick(table, faction, override) {
    table = table || {};
    var key = override && table[override] ? override : table[faction] ? faction : 'default', fx = table[key] || {}, out = { key: key };
    for (var k in fx) out[k] = fx[k];
    return out;
  }

  // value noise on a seeded lattice, smooth interpolation; R = two octaves (the erosion), G = ridged (the veins)
  function lattice(g, r) { var a = new Float32Array((g + 1) * (g + 1)); for (var i = 0; i < a.length; i++) a[i] = r(); return a; }
  function vnoise(a, g, u, v) {
    var x = u * g, y = v * g, xi = Math.min(g - 1, Math.floor(x)), yi = Math.min(g - 1, Math.floor(y)), fx = x - xi, fy = y - yi, w = g + 1;
    fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
    var p = a[yi * w + xi], q = a[yi * w + xi + 1], s = a[(yi + 1) * w + xi], t = a[(yi + 1) * w + xi + 1];
    return (p + (q - p) * fx) * (1 - fy) + (s + (t - s) * fx) * fy;
  }
  function noise(pr) {
    var r = rng(pr.seed), g = Math.max(2, Math.round(pr.noiseScale)), A = lattice(g, r), B = lattice(g * 3, r), C = lattice(g * 2, r), E = lattice(g * 5, r);
    var R = new Float32Array(N * N), G = new Float32Array(N * N);
    for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
      var u = (x + 0.5) / N, v = (y + 0.5) / N, i = y * N + x, w = vnoise(C, g * 2, u, v) * 0.6 + vnoise(E, g * 5, u, v) * 0.4;
      R[i] = clamp01(vnoise(A, g, u, v) * 0.72 + vnoise(B, g * 3, u, v) * 0.28);
      G[i] = clamp01(1 - Math.abs(w * 2 - 1) * 2.4);
    }
    return { size: N, r: R, g: G, key: pr.seed + ':' + g };
  }
  function sample(arr, u, v) {
    var x = clamp01(u) * N - 0.5, y = clamp01(v) * N - 0.5, x0 = Math.max(0, Math.min(N - 1, Math.floor(x))), y0 = Math.max(0, Math.min(N - 1, Math.floor(y)));
    var x1 = Math.min(N - 1, x0 + 1), y1 = Math.min(N - 1, y0 + 1), fx = clamp01(x - x0), fy = clamp01(y - y0);
    return (arr[y0 * N + x0] * (1 - fx) + arr[y0 * N + x1] * fx) * (1 - fy) + (arr[y1 * N + x0] * (1 - fx) + arr[y1 * N + x1] * fx) * fy;
  }
  function field(nz, pr, u, v) { return (1 - v) * (1 - pr.noise) + sample(nz.r, u, v) * pr.noise; }
  // p ∈ [0, 1] over FIZZLE → t, strictly rising: nothing gone at p = 0 (t below every f), everything gone at p = 1 (t above every f)
  function threshold(p, pr) { p = clamp01(p); var e = p * 0.65 + p * p * (3 - 2 * p) * 0.35; return -(pr.edgeWidth + pr.soft) + e * (1 + pr.edgeWidth + 2 * pr.soft); }
  function keep(f, t, pr) { return clamp01((f - t) / pr.soft); }
  // where the front crosses column u (v, from the head), a few fixed-point steps on the field
  function frontAt(nz, pr, u, t) { var k = pr.noise, v = 1 - t / (1 - k); for (var i = 0; i < 3; i++) v = 1 - (t - sample(nz.r, u, clamp01(v)) * k) / (1 - k); return v; }

  // THE CANVAS 2D PATH — the field and the veins at the mask's resolution (once per cell), then each frame's mask and glow
  function grid(nz, pr, w, h) {
    var F = new Float32Array(w * h), V = new Float32Array(w * h);
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) { var u = (x + 0.5) / w, v = (y + 0.5) / h, i = y * w + x, g = sample(nz.g, u, v); F[i] = field(nz, pr, u, v); V[i] = g * g * g; }
    return { w: w, h: h, f: F, vein: V };
  }
  function paint(gr, t, pr, mask, glow) {
    var e = rgb(pr.edge), c = rgb(pr.core), soft = pr.soft, bw = pr.edgeWidth, ch = pr.charge, ca = pr.chargeAlpha, n = gr.w * gr.h, j = 0;
    for (var i = 0; i < n; i++, j += 4) {
      var d = gr.f[i] - t, k = d <= 0 ? 0 : d >= soft ? 1 : d / soft;
      mask[j] = 255; mask[j + 1] = 255; mask[j + 2] = 255; mask[j + 3] = Math.round(k * 255);
      var band = d > 0 && d < bw ? 1 - d / bw : 0, chg = d > 0 && d < ch ? Math.min(1, (1 - d / ch) * gr.vein[i] * ca) : 0, hot = band * band;
      glow[j] = 255 * (e[0] + (c[0] - e[0]) * hot); glow[j + 1] = 255 * (e[1] + (c[1] - e[1]) * hot); glow[j + 2] = 255 * (e[2] + (c[2] - e[2]) * hot);
      glow[j + 3] = 255 * (band > chg ? band : chg);
    }
  }
  // a cell's silhouette by column (from its alpha): embers only start where the figure is
  function silhouette(rgba, w, h, cols) {
    cols = cols || 24; var top = new Float32Array(cols), bottom = new Float32Array(cols);
    for (var c = 0; c < cols; c++) {
      var x0 = Math.floor(c * w / cols), x1 = Math.max(x0 + 1, Math.floor((c + 1) * w / cols)), t = -1, b = -1;
      for (var y = 0; y < h; y++) { var on = false; for (var x = x0; x < x1 && !on; x++) if (rgba[(y * w + x) * 4 + 3] > 96) on = true; if (on) { if (t < 0) t = y; b = y; } }
      top[c] = t < 0 ? -1 : t / h; bottom[c] = b < 0 ? -1 : (b + 1) / h;
    }
    return { cols: cols, top: top, bottom: bottom };
  }

  // the only particle images, and the noise texture for the filter
  function canvas(doc, size) { var cv = doc.createElement('canvas'); cv.width = cv.height = size; return cv; }
  function softDisc(doc, size, color, stops) {
    var cv = canvas(doc, size), g = cv.getContext('2d'), c = rgb(color), h = size / 2;
    var col = function (a) { return 'rgba(' + Math.round(c[0] * 255) + ',' + Math.round(c[1] * 255) + ',' + Math.round(c[2] * 255) + ',' + a + ')'; };
    if (g && g.createRadialGradient) { var gr = g.createRadialGradient(h, h, 0, h, h, h); stops(gr, col); g.fillStyle = gr; g.fillRect(0, 0, size, size); }
    return cv;
  }
  function glowCanvas(doc, color) {
    var cv = softDisc(doc, GLOW, color, function (gr, col) { gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.18, col(0.95)); gr.addColorStop(0.5, col(0.32)); gr.addColorStop(1, col(0)); });
    cv.__labGlow = GLOW; return cv;
  }
  function puffCanvas(doc, color) {
    var cv = softDisc(doc, PUFF, color, function (gr, col) { gr.addColorStop(0, col(0.9)); gr.addColorStop(0.45, col(0.45)); gr.addColorStop(1, col(0)); });
    cv.__labPuff = PUFF; return cv;
  }
  function noiseCanvas(doc, nz) {
    var cv = canvas(doc, N), g = cv.getContext('2d'), img = g && g.createImageData ? g.createImageData(N, N) : null;
    if (!img || !img.data) img = { data: new Uint8ClampedArray(N * N * 4), width: N, height: N };
    for (var i = 0, j = 0; i < N * N; i++, j += 4) { img.data[j] = nz.r[i] * 255; img.data[j + 1] = nz.g[i] * 255; img.data[j + 2] = 0; img.data[j + 3] = 255; }
    if (g && g.putImageData) g.putImageData(img, 0, 0);
    return cv;
  }

  // THE GPU PATH — a Pixi v8 filter on the actor sprite. vUv spans the sprite's bounds (the held cell): v = 0 at the head.
  // uParams = (t, soft, edgeWidth, charge) · uParams2 = (chargeAlpha, noise, –, –) · uNoise: R = erosion noise, G = veins
  var SHADER = {
    glVertex: [
      'in vec2 aPosition;', 'out vec2 vTextureCoord;', 'out vec2 vUv;',
      'uniform vec4 uInputSize;', 'uniform vec4 uOutputFrame;', 'uniform vec4 uOutputTexture;',
      'vec4 filterVertexPosition(void)', '{',
      '    vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;',
      '    position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;',
      '    position.y = position.y * (2.0 * uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;',
      '    return vec4(position, 0.0, 1.0);', '}',
      'void main(void)', '{', '    gl_Position = filterVertexPosition();', '    vTextureCoord = aPosition * (uOutputFrame.zw * uInputSize.zw);', '    vUv = aPosition;', '}',
    ].join('\n'),
    glFragment: [
      'in vec2 vTextureCoord;', 'in vec2 vUv;', 'out vec4 finalColor;',
      'uniform sampler2D uTexture;', 'uniform sampler2D uNoise;',
      'uniform vec4 uEdge;', 'uniform vec4 uCore;', 'uniform vec4 uParams;', 'uniform vec4 uParams2;',
      'void main(void)', '{',
      '    vec4 src = texture(uTexture, vTextureCoord);',
      '    vec4 nz = texture(uNoise, vUv);',
      '    float f = (1.0 - vUv.y) * (1.0 - uParams2.y) + nz.r * uParams2.y;',
      '    float d = f - uParams.x;',
      '    float keep = clamp(d / uParams.y, 0.0, 1.0);',
      '    float band = (1.0 - clamp(d / uParams.z, 0.0, 1.0)) * step(0.0, d);',
      '    float charge = clamp((1.0 - clamp(d / uParams.w, 0.0, 1.0)) * nz.g * nz.g * nz.g * uParams2.x, 0.0, 1.0) * step(0.0, d);',
      '    vec3 col = mix(src.rgb, uEdge.rgb * src.a, charge);',
      '    col = mix(col, mix(uEdge.rgb, uCore.rgb, band * band) * src.a, band);',
      '    finalColor = vec4(col, src.a) * keep;', '}',
    ].join('\n'),
    wgsl: [
      'struct GlobalFilterUniforms { uInputSize: vec4<f32>, uInputPixel: vec4<f32>, uInputClamp: vec4<f32>, uOutputFrame: vec4<f32>, uGlobalFrame: vec4<f32>, uOutputTexture: vec4<f32>, };',
      'struct DissolveUniforms { uEdge: vec4<f32>, uCore: vec4<f32>, uParams: vec4<f32>, uParams2: vec4<f32>, };',
      '@group(0) @binding(0) var<uniform> gfu: GlobalFilterUniforms;',
      '@group(0) @binding(1) var uTexture: texture_2d<f32>;',
      '@group(0) @binding(2) var uSampler: sampler;',
      '@group(1) @binding(0) var<uniform> dissolveUniforms: DissolveUniforms;',
      '@group(1) @binding(1) var uNoise: texture_2d<f32>;',
      '@group(1) @binding(2) var uNoiseSampler: sampler;',
      'struct VSOutput { @builtin(position) position: vec4<f32>, @location(0) uv: vec2<f32>, @location(1) fuv: vec2<f32>, };',
      'fn filterVertexPosition(aPosition: vec2<f32>) -> vec4<f32> {',
      '  var position = aPosition * gfu.uOutputFrame.zw + gfu.uOutputFrame.xy;',
      '  position.x = position.x * (2.0 / gfu.uOutputTexture.x) - 1.0;',
      '  position.y = position.y * (2.0 * gfu.uOutputTexture.z / gfu.uOutputTexture.y) - gfu.uOutputTexture.z;',
      '  return vec4<f32>(position, 0.0, 1.0);',
      '}',
      '@vertex fn mainVertex(@location(0) aPosition: vec2<f32>) -> VSOutput {',
      '  return VSOutput(filterVertexPosition(aPosition), aPosition * (gfu.uOutputFrame.zw * gfu.uInputSize.zw), aPosition);',
      '}',
      '@fragment fn mainFragment(@location(0) uv: vec2<f32>, @location(1) fuv: vec2<f32>) -> @location(0) vec4<f32> {',
      '  let src = textureSample(uTexture, uSampler, uv);',
      '  let nz = textureSample(uNoise, uNoiseSampler, fuv);',
      '  let P = dissolveUniforms.uParams;',
      '  let P2 = dissolveUniforms.uParams2;',
      '  let f = (1.0 - fuv.y) * (1.0 - P2.y) + nz.r * P2.y;',
      '  let d = f - P.x;',
      '  let keep = clamp(d / P.y, 0.0, 1.0);',
      '  let band = (1.0 - clamp(d / P.z, 0.0, 1.0)) * step(0.0, d);',
      '  let charge = clamp((1.0 - clamp(d / P.w, 0.0, 1.0)) * nz.g * nz.g * nz.g * P2.x, 0.0, 1.0) * step(0.0, d);',
      '  var col = mix(src.rgb, dissolveUniforms.uEdge.rgb * src.a, vec3<f32>(charge));',
      '  col = mix(col, mix(dissolveUniforms.uEdge.rgb, dissolveUniforms.uCore.rgb, vec3<f32>(band * band)) * src.a, vec3<f32>(band));',
      '  return vec4<f32>(col, src.a) * keep;',
      '}',
    ].join('\n'),
  };

  var OUT = { DEFAULTS: DEFAULTS, N: N, GLOW: GLOW, PUFF: PUFF, rng: rng, rgb: rgb, tint: tint, resolve: resolve, pick: pick, noise: noise, sample: sample, field: field,
              threshold: threshold, keep: keep, frontAt: frontAt, grid: grid, paint: paint, silhouette: silhouette, glowCanvas: glowCanvas, puffCanvas: puffCanvas,
              noiseCanvas: noiseCanvas, SHADER: SHADER };
  root.Dissolve = OUT;
  if (typeof module !== 'undefined' && module.exports) module.exports = OUT;
})(typeof window !== 'undefined' ? window : this);
