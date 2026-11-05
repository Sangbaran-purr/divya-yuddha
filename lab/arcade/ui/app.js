/* ARCADE-1 · THE LAB PAGE: setup → a best-of-three → result; or the scripted demo bout (?demo=1) and its recorder (?capture=).
   The core decides everything (core/*.js). This file reads input, steps the match at a fixed 60 Hz and draws.
   Pixi (the lab's own copy in runtime/) draws; if it can't start, a Canvas 2D floor draws the same shapes.
   The enhancement test's switches (?fx=0/1, ?cam=wide/tight) live in ui/present.js; every default is the
   R0–R2 baseline. ?perf=1 shows frame timing; ?cpu=N stretches each frame's own work N× (a slower phone, roughly).
   TEXTURES (owner ruling 1, 2026-11-04): fighter pages load as KTX2 / Basis, transcoded in the page to the GPU's own compressed format
   (ASTC, BC7, ETC2 or BC3 — 1 byte a pixel on the GPU instead of 4), wherever WebGL offers one; otherwise — or under the Canvas 2D
   floor, or with ?tex=webp — the WebP pages. ?tex=ktx2 insists (it still falls back if the GPU can't). */
const M = window.ARC_MOVES, F = window.ARC_FIGHT, AI = window.ARC_AI, R = window.ARC_RNG, MA = window.ARC_MATCH, C = window.ARC_CONTROLS, S = window.ARC_SCENE;
const PR = window.ARC_PRESENT, DEMO = window.ARC_DEMO;
const STAMP = document.querySelector('meta[name="lab-stamp"]').content;
const STEP_MS = 1000 / 60, BANNER_START = 90, BANNER_END = 120;
const $ = (id) => document.getElementById(id);
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
const MODES = PR.parseModes(location.search);

// ── a stale page reloads once onto the served stamp (the VFX lab's rule) ──
fetch("STAMP?t=" + Date.now(), { cache: "no-store" }).then((r) => r.ok ? r.text() : "").then((s) => {
  s = s.trim();
  if (s && s !== STAMP && !sessionStorage.getItem("arc_reloaded_" + s)) { sessionStorage.setItem("arc_reloaded_" + s, "1"); location.reload(); }
}).catch(() => {});

// ── the real fighters: the 12 fps sheets (fighters/<hero>/) ──
let RUNG = MODES.raw.rung === "lo" ? "lo" : MODES.raw.rung === "hi" ? "hi" :
  ((window.devicePixelRatio || 1) >= 1.5 || Math.max(innerWidth, innerHeight) >= 1000 ? "hi" : "lo");
const FIGHTERS = {};   // fighter id → { man, imgs (an Image, or { __source } for a compressed page), cells, bytes, decoded, tex }
const EFFECTS = {};    // "vajra" → { man, img, cells }
const LOAD = { bytes: 0, decoded: 0, ms: 0, files: 0, tex: "webp", gpuFormat: null, transcodeMs: 0 };
let PIXI_MOD = null;
// THE UNCOMPRESSED FALLBACK (owner ruling 6, third set): a GPU with no compressed format (or ?tex=webp, or the Canvas 2D floor) loads the
// LO pages, resized as they load, so the RGBA memory stays under the lo cap (tools/budget.js reads these numbers from here)
const FALLBACK = { rung: "lo", scale: 0.75 };
function loadImg(src) { const img = new Image(); img.src = src; return img.decode().then(() => img); }
// the GPU's compressed formats, best first (basis transcoder target ↔ Pixi format)
function detectCompressed() {
  try {
    const c = document.createElement("canvas"), gl = c.getContext("webgl2") || c.getContext("webgl");
    if (!gl) return null;
    const has = (e) => !!gl.getExtension(e);
    const r = has("WEBGL_compressed_texture_astc") ? { basis: 10, pixi: "astc-4x4-unorm", name: "ASTC 4x4" }
      : has("EXT_texture_compression_bptc") ? { basis: 6, pixi: "bc7-rgba-unorm", name: "BC7" }
      : has("WEBGL_compressed_texture_etc") ? { basis: 1, pixi: "etc2-rgba8unorm", name: "ETC2 RGBA" }
      : has("WEBGL_compressed_texture_s3tc") ? { basis: 3, pixi: "bc3-rgba-unorm", name: "BC3" } : null;
    const lose = gl.getExtension("WEBGL_lose_context"); if (lose) lose.loseContext();
    return r;
  } catch (e) { return null; }
}
let BASIS_MOD = null;
async function basisModule() {
  if (BASIS_MOD) return BASIS_MOD;
  await new Promise((ok, bad) => { const sc = document.createElement("script"); sc.src = "runtime/basis/basis_transcoder.js?v=" + STAMP; sc.onload = ok; sc.onerror = bad; document.head.appendChild(sc); });
  BASIS_MOD = await window.BASIS({ locateFile: (f) => "runtime/basis/" + f + "?v=" + STAMP });
  BASIS_MOD.initializeBasis();
  return BASIS_MOD;
}
async function loadKtx2Page(url, target) {   // fetch → transcode to the GPU's format → a Pixi compressed source (premultiplied)
  const buf = new Uint8Array(await (await fetch(url)).arrayBuffer()), B = await basisModule(), t0 = performance.now();
  const k = new B.KTX2File(buf);
  try {
    if (!k.isValid() || !k.startTranscoding()) throw new Error("bad ktx2");
    const w = k.getWidth(), h = k.getHeight(), dst = new Uint8Array(k.getImageTranscodedSizeInBytes(0, 0, 0, target.basis));
    if (!k.transcodeImage(dst, 0, 0, 0, target.basis, 0, -1, -1)) throw new Error("transcode failed");
    LOAD.transcodeMs += performance.now() - t0;
    return { img: { __source: new PIXI_MOD.CompressedSource({ resource: [dst], format: target.pixi, width: w, height: h, alphaMode: "premultiplied-alpha" }) }, gpu: dst.length, bytes: buf.length };
  } finally { k.close(); k.delete(); }
}
async function loadFighters() {
  const t0 = performance.now();
  const target = backend.startsWith("pixi") && MODES.raw.tex !== "webp" ? detectCompressed() : null;
  LOAD.tex = target ? "ktx2" : "webp"; LOAD.gpuFormat = target ? target.name : "RGBA8";
  const fbScale = target ? 1 : FALLBACK.scale;
  if (!target) { RUNG = FALLBACK.rung; LOAD.fallbackScale = FALLBACK.scale; }
  const ids = [...new Set(Object.values(M.HEROES).map((h) => h.fighter).filter(Boolean))];
  await Promise.all(ids.map(async (id) => {
    try {
      // ?fbase=captures/opt/<name>/ loads a fighter from an OPTION build (the clarity pass; captures/ is never committed), else fighters/
      const base = (MODES.raw.fbase && /^captures\/opt\/[A-Za-z0-9_]+\/$/.test(MODES.raw.fbase) && (await fetch(MODES.raw.fbase + id + "/manifest.json", { method: "HEAD" })).ok ? MODES.raw.fbase : "fighters/") + id + "/";
      const man = await (await fetch(base + "manifest.json?v=" + STAMP)).json();
      const Rg = man.rungs[RUNG], pages = Rg.pages;
      let imgs, bytes = 0, decoded = 0, tex = "webp", k = 1, cells = Rg.cells;
      try {
        if (!target) throw new Error("no compressed format");
        const got = await Promise.all(pages.map((p) => loadKtx2Page(base + p.ktx2 + "?v=" + STAMP, target)));
        imgs = got.map((x) => x.img); bytes = got.reduce((a, x) => a + x.bytes, 0); decoded = got.reduce((a, x) => a + x.gpu, 0); tex = "ktx2";
      } catch (e) {   // the WebP fallback: the lo pages, resized as they load (each cell rect and pivot scaled; drawn 1/scale larger)
        const s = target ? 1 : fbScale;
        imgs = await Promise.all(pages.map(async (p) => {
          const img = await loadImg(base + p.webp + "?v=" + STAMP);
          return s === 1 ? img : createImageBitmap(img, { resizeWidth: Math.round(p.size[0] * s), resizeHeight: Math.round(p.size[1] * s), resizeQuality: "high" });
        }));
        bytes = pages.reduce((a, p) => a + p.bytes.webp, 0); decoded = pages.reduce((a, p) => a + Math.round(p.size[0] * s) * Math.round(p.size[1] * s) * 4, 0);
        if (s !== 1) { k = 1 / s; cells = Rg.cells.map((c) => ({ page: c.page, x: c.x * s, y: c.y * s, w: c.w * s, h: c.h * s, px: c.px * s, py: c.py * s })); }
      }
      FIGHTERS[id] = { man, imgs, cells, bytes, decoded, tex, k };
      LOAD.bytes += bytes; LOAD.decoded += decoded; LOAD.files += pages.length;
    } catch (e) { /* a fighter that fails to load stays a box */ }
  }));
  // THE KLING EFFECT LAYER (owner brief 2026-11-05): the four effect clips, packed like a fighter (KTX2 when the GPU takes it, else WebP);
  // their manifests go to the presentation as MODES.fxMan. ?fx=old keeps the in-engine drawn effects for comparison.
  if (MODES.fx && !MODES.fxOld) {
    const man = {};
    await Promise.all(["vajra_bolt", "vajra_impact", "nagapasha_flight", "nagapasha_bind"].map(async (nm) => {
      try {
        const base = "effects/fx_" + nm + "/", m = await (await fetch(base + "manifest.json?v=" + STAMP)).json(), Rg = m.rungs[RUNG];
        let imgs, bytes = 0, decoded = 0, s = 1, cells = Rg.cells;
        try {
          if (!target) throw new Error("no compressed format");
          const got = await Promise.all(Rg.pages.map((p) => loadKtx2Page(base + p.ktx2 + "?v=" + STAMP, target)));
          imgs = got.map((x) => x.img); bytes = got.reduce((a, x) => a + x.bytes, 0); decoded = got.reduce((a, x) => a + x.gpu, 0);
        } catch (e) {   // the WebP fallback: resized like the fighters' (FALLBACK.scale) so the RGBA memory stays under the lo cap
          s = target ? 1 : fbScale;
          imgs = await Promise.all(Rg.pages.map(async (p) => { const img = await loadImg(base + p.webp + "?v=" + STAMP);
            return s === 1 ? img : createImageBitmap(img, { resizeWidth: Math.round(p.size[0] * s), resizeHeight: Math.round(p.size[1] * s), resizeQuality: "high" }); }));
          bytes = Rg.pages.reduce((a, p) => a + p.bytes.webp, 0); decoded = Rg.pages.reduce((a, p) => a + Math.round(p.size[0] * s) * Math.round(p.size[1] * s) * 4, 0);
          if (s !== 1) cells = Rg.cells.map((c) => ({ page: c.page, x: c.x * s, y: c.y * s, w: c.w * s, h: c.h * s, px: c.px * s, py: c.py * s }));
        }
        EFFECTS["fx_" + nm] = { man: m, imgs, cells, k: 1 / s, fx: true };
        man[nm] = { cells: Rg.cells.length, w: Rg.cellSize[0], h: Rg.cellSize[1], fps: m.loop.fps, blend: m.blend };
        LOAD.bytes += bytes; LOAD.decoded += decoded; LOAD.files += Rg.pages.length;
      } catch (e) { /* that effect falls back to the drawn one */ }
    }));
    if (man.vajra_bolt && man.vajra_impact && man.nagapasha_flight && man.nagapasha_bind) MODES.fxMan = man;
  }
  if (MODES.fx && !MODES.fxMan) {   // the old drawn look (?fx=old, or the Kling layer failed to load)
    try {   // the half-size Vajra on lo (ruling 1)
      const dir = "effects/vajra/" + (RUNG === "lo" ? "lo/" : ""), man = await (await fetch(dir + "manifest.json?v=" + STAMP)).json();
      const img = await loadImg(dir + man.atlas + "?v=" + STAMP);
      EFFECTS.vajra = { man, img, cells: man.cells, k: man.rungScale || 1 };
      LOAD.decoded += man.atlasSize.w * man.atlasSize.h * 4; LOAD.files++;
      LOAD.bytes += Number((await fetch(dir + man.atlas + "?v=" + STAMP, { method: "HEAD" })).headers.get("content-length") || 0);
    } catch (e) { /* no pillar; the shot stays a box */ }
  }
  LOAD.transcodeMs = Math.round(LOAD.transcodeMs);
  LOAD.ms = Math.round(performance.now() - t0);
}
const fighterMans = () => { const o = {}; for (const k in FIGHTERS) o[k] = FIGHTERS[k].man; return o; };
function cellOf(s) {   // the cell record and its image for a sprite shape
  if (s.atlas && EFFECTS[s.atlas] && EFFECTS[s.atlas].fx) { const E = EFFECTS[s.atlas], c = E.cells[s.cell]; return c && { c, img: E.imgs[c.page || 0], ax: c.px / c.w, ay: c.py / c.h, k: E.k }; }
  if (s.atlas) { const E = EFFECTS[s.atlas]; if (!E) return null; const c = E.cells[s.cell]; return c && { c, img: E.img, ax: E.man.anchor.x / E.man.cellSize.w, ay: E.man.anchor.y / E.man.cellSize.h, k: E.k }; }
  const Fi = FIGHTERS[s.fighter], c = Fi && Fi.cells[s.cell];
  return c && { c, img: Fi.imgs[c.page || 0], ax: c.px / c.w, ay: c.py / c.h, k: Fi.k };
}

// ── renderer: Pixi first, Canvas 2D floor. Layers, bottom to top: bg · shadow · under (fades, trails) · body · over (hit-flash) · fx · glow (additive) ──
let draw = null, backend = "", canvasEl = null;
async function initRenderer() {
  const host = $("stage");
  try {
    const PIXI = await import("../runtime/pixi.min.mjs?v=" + STAMP); PIXI_MOD = PIXI;
    const app = new PIXI.Application();
    await app.init({ width: S.VIEW_W, height: S.VIEW_H, background: "#120c06", antialias: true, preference: "webgl",
      resolution: MODES.capture ? 1 : Math.min(2, window.devicePixelRatio || 1), autoDensity: true, preserveDrawingBuffer: !!MODES.capture || !!MODES.raw.still });
    host.appendChild(app.canvas); canvasEl = app.canvas;
    const G = { bg: new PIXI.Graphics(), shadow: new PIXI.Graphics(), body: new PIXI.Graphics(), fx: new PIXI.Graphics(), glow: new PIXI.Graphics() };
    const CT = { under: new PIXI.Container(), body: new PIXI.Container(), over: new PIXI.Container(), glow: new PIXI.Container() };
    G.glow.blendMode = "add";
    app.stage.addChild(G.bg, G.shadow, CT.under, G.body, CT.body, CT.over, G.fx, G.glow, CT.glow);
    const white = new PIXI.ColorMatrixFilter(); white.matrix = [0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0];   // a white silhouette
    const tex = new Map();   // img → base texture; "id:cell" → cell texture
    function texOf(key, img, c) {
      if (!tex.has(key)) { if (!tex.has(img)) tex.set(img, img.__source ? new PIXI.Texture({ source: img.__source }) : PIXI.Texture.from(img)); tex.set(key, new PIXI.Texture({ source: tex.get(img).source, frame: new PIXI.Rectangle(c.x, c.y, c.w, c.h) })); }
      return tex.get(key);
    }
    const pools = { under: [], body: [], over: [], glow: [] }, used = {};
    app.ticker.stop();
    draw = (shapes) => {
      for (const k in G) G[k].clear();
      for (const k in pools) { pools[k].forEach((sp) => { sp.visible = false; }); used[k] = 0; }
      for (const s of shapes) {
        if (s.k === "sprite") {
          const L = s.layer === "under" || s.layer === "over" || s.layer === "glow" ? s.layer : "body", co = cellOf(s);
          if (!co) continue;
          let sp = pools[L][used[L]]; if (!sp) { sp = new PIXI.Sprite(); pools[L].push(sp); CT[L].addChild(sp); }
          used[L]++;
          sp.texture = texOf((s.atlas || s.fighter) + ":" + s.cell, co.img, co.c); sp.anchor.set(co.ax, co.ay);
          const sc = s.scale * (co.k || 1), scx = s.scaleX != null ? s.scaleX * (co.k || 1) : sc; sp.position.set(s.x, s.y); sp.scale.set(s.flip ? -scx : scx, sc); sp.rotation = s.rotation || 0;
          sp.alpha = s.alpha == null ? 1 : s.alpha; sp.blendMode = s.blend === "add" ? "add" : "normal"; sp.filters = s.white ? [white] : null; sp.visible = true;
          continue;
        }
        const g = G[s.layer] || G.fx;
        if (s.k === "ellipse") { g.ellipse(s.x, s.y, s.rx, s.ry); g.fill({ color: s.fill, alpha: s.alpha }); continue; }
        g.rect(s.x, s.y, s.w, s.h);
        if (s.fill != null) g.fill({ color: s.fill, alpha: s.alpha });
        if (s.stroke) g.stroke({ width: s.stroke.width, color: s.stroke.color });
      }
      app.renderer.render(app.stage);
    };
    backend = "pixi-" + (app.renderer.name || "webgl");
  } catch (e) {
    const cv = document.createElement("canvas"), dpr = MODES.capture ? 1 : Math.min(2, window.devicePixelRatio || 1);
    cv.width = S.VIEW_W * dpr; cv.height = S.VIEW_H * dpr; host.appendChild(cv); canvasEl = cv;
    const cx = cv.getContext("2d"); cx.scale(dpr, dpr);
    const hex = (c) => "#" + ("00000" + c.toString(16)).slice(-6);
    const ORDER = { bg: 0, shadow: 1, under: 2, body: 3, over: 4, fx: 5, glow: 6 };
    draw = (shapes) => {
      cx.clearRect(0, 0, S.VIEW_W, S.VIEW_H);
      for (const s of shapes.slice().sort((a, b) => ORDER[a.layer || "fx"] - ORDER[b.layer || "fx"])) {
        cx.globalCompositeOperation = s.blend === "add" || s.layer === "glow" ? "lighter" : "source-over";
        cx.globalAlpha = s.alpha == null ? 1 : s.alpha;
        if (s.k === "sprite") {
          const co = cellOf(s); if (!co) continue;
          if (s.white) cx.globalCompositeOperation = "lighter";
          const sc = s.scale * (co.k || 1), scx = s.scaleX != null ? s.scaleX * (co.k || 1) : sc; cx.save(); cx.translate(s.x, s.y); cx.rotate(s.rotation || 0); cx.scale(s.flip ? -scx : scx, sc);
          cx.drawImage(co.img, co.c.x, co.c.y, co.c.w, co.c.h, -co.ax * co.c.w, -co.ay * co.c.h, co.c.w, co.c.h); cx.restore();
          continue;
        }
        if (s.k === "ellipse") { cx.fillStyle = hex(s.fill); cx.beginPath(); cx.ellipse(s.x, s.y, s.rx, s.ry, 0, 0, Math.PI * 2); cx.fill(); continue; }
        if (s.fill != null) { cx.fillStyle = hex(s.fill); cx.fillRect(s.x, s.y, s.w, s.h); }
        if (s.stroke) { cx.globalAlpha = 1; cx.lineWidth = s.stroke.width; cx.strokeStyle = hex(s.stroke.color); cx.strokeRect(s.x, s.y, s.w, s.h); }
      }
      cx.globalAlpha = 1; cx.globalCompositeOperation = "source-over";
    };
    backend = "canvas2d";
  }
  document.documentElement.dataset.backend = backend;
}

// ── setup screen ──
const HERO_IDS = Object.keys(M.HEROES);
let lineup = [], level = "advanced";
function renderSetup() {
  const box = $("lineup"); box.innerHTML = "";
  for (const id of HERO_IDS) {
    const h = M.HEROES[id], b = document.createElement("button"); b.type = "button"; b.className = "chip" + (lineup.includes(id) ? " on" : "");
    const sw = document.createElement("span"); sw.className = "sw"; sw.style.background = "#" + ("00000" + h.color.toString(16)).slice(-6);
    b.append(sw, document.createTextNode(h.name));
    const a = document.createElement("span"); a.className = "arch"; a.textContent = h.arch; b.append(a);
    if (lineup.includes(id)) { const o = document.createElement("span"); o.className = "ord"; o.textContent = lineup.indexOf(id) + 1; b.append(o); }
    b.onclick = () => { lineup = lineup.includes(id) ? lineup.filter((x) => x !== id) : lineup.length < MA.ROUNDS ? lineup.concat(id) : lineup; renderSetup(); };
    box.append(b);
  }
  const lv = $("levels"); lv.innerHTML = "";
  for (const [id, label] of [["beginner", "Beginner"], ["advanced", "Advanced"], ["deathmatch", "Death Match"]]) {
    const b = document.createElement("button"); b.type = "button"; b.className = "chip" + (level === id ? " on" : ""); b.textContent = label;
    b.onclick = () => { level = id; renderSetup(); }; lv.append(b);
  }
  $("go").disabled = lineup.length !== MA.ROUNDS;
  $("modes").textContent = modeLabel();
}
function modeLabel() { return "fx " + (MODES.fx ? "on" : "off") + " · " + MODES.fps + " fps · camera " + MODES.cam + " · " + RUNG + " sheets · " + LOAD.tex + (LOAD.tex === "ktx2" ? " → " + LOAD.gpuFormat : ""); }

// ── the match (or the demo bout) ──
let match = null, ais = null, rng = null, seed = 0, banner = 0, bannerText = "", paused = false, debug = false, finished = false;
let PS = null, demo = null, ring = [], slowmo = null, cam = null, lastFight = null, overT = 0;   // overT: frames since the fight ended (the K.O. / win art)
function shuffle(a, r) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function newAIs() { ais = [MODES.aivs ? AI.createAI("advanced", rng, { round: match ? match.round : 0 }) : null, AI.createAI(level, rng, { round: match ? match.round : 0 })]; }   // the round is on screen: the Beginner holds its special in round 1
function startMatch() {
  seed = MODES.raw.seed ? (+MODES.raw.seed >>> 0) : (Date.now() ^ (Math.random() * 1e9)) >>> 0;     // a UI choice (?seed= fixes it); the match itself replays from this seed
  rng = R.rng(seed);
  // ?opp=meghnad,indra,box_rakta fixes the opponent's lineup (a lab convenience); otherwise 3 of the Heroes at random
  const opp = (MODES.raw.opp || "").split(",").filter((id) => M.HEROES[id]);
  // ?aivs=1: Indra vs Meghnad, both played by the Advanced AI, every round (the lab's AI-fight recording; ?seed= replays it)
  if (MODES.aivs) level = "advanced";
  match = MA.createMatch(MODES.aivs ? { lineup0: ["indra", "indra", "indra"], lineup1: ["meghnad", "meghnad", "meghnad"], repeat: true }
    : MODES.demo ? { lineup0: DEMO.LINEUPS[0], lineup1: DEMO.LINEUPS[1], seconds: 99 }
    : { lineup0: lineup, lineup1: opp.length === MA.ROUNDS && new Set(opp).size === MA.ROUNDS ? opp : shuffle(HERO_IDS, rng).slice(0, MA.ROUNDS) });
  demo = MODES.demo ? DEMO.create(MODES.demoName) : null; overT = 0;
  newAIs(); finished = false; paused = false; slowmo = null; ring = []; PS = PR.create(MODES); cam = null; lastFight = match.fight;
  showBanner("ROUND 1", MODES.demo ? 45 : BANNER_START);
  $("setup").hidden = true; $("result").hidden = true; $("pause").hidden = true; $("game").hidden = false;
  const touch = !MODES.demo && (matchMedia("(pointer: coarse)").matches || "ontouchstart" in window);
  $("touch").hidden = !touch;
  last = performance.now(); acc = 0;
}
function showBanner(text, frames) { bannerText = text; banner = frames; $("banner").textContent = text; $("banner").hidden = false; }

// ── input ──
const held = {};
let touchBits = 0, stickBitsNow = 0;
addEventListener("keydown", (e) => {
  if (e.code === "KeyP" || e.code === "Escape") { if (!$("game").hidden && !finished) setPaused(!paused); return; }
  if (e.code === "KeyH") { debug = !debug; return; }
  if (C.KEYS[e.code]) { held[e.code] = true; e.preventDefault(); }
});
addEventListener("keyup", (e) => { delete held[e.code]; });
addEventListener("blur", () => { for (const k in held) delete held[k]; touchBits = 0; stickBitsNow = 0; });

function setupTouch() {
  const zone = $("stickzone"), stick = $("stick"), knob = $("knob");
  let sid = null, ox = 0, oy = 0;
  zone.addEventListener("pointerdown", (e) => {
    if (sid !== null) return; sid = e.pointerId; try { zone.setPointerCapture(sid); } catch (err) {}   // a failed capture must not lose the thumb
    const r = zone.getBoundingClientRect(); ox = e.clientX; oy = e.clientY;
    stick.style.left = (e.clientX - r.left) + "px"; stick.style.top = (e.clientY - r.top) + "px"; stick.hidden = false; knob.style.transform = "";
    stickBitsNow = 0;
  });
  zone.addEventListener("pointermove", (e) => {
    if (e.pointerId !== sid) return;
    const dx = e.clientX - ox, dy = e.clientY - oy, d = Math.hypot(dx, dy), k = d > C.STICK_MAX ? C.STICK_MAX / d : 1;
    knob.style.transform = "translate(" + dx * k + "px," + dy * k + "px)";
    stickBitsNow = C.stickBits(dx, dy);
  });
  const end = (e) => { if (e.pointerId !== sid) return; sid = null; stick.hidden = true; stickBitsNow = 0; };
  zone.addEventListener("pointerup", end); zone.addEventListener("pointercancel", end);
  const box = $("buttons");
  for (const b of C.BUTTONS) {
    const el = document.createElement("button"); el.type = "button"; el.textContent = b.label; el.dataset.id = b.id;
    const on = (e) => { e.preventDefault(); try { el.setPointerCapture(e.pointerId); } catch (err) {} touchBits |= b.bit; el.classList.add("down"); };
    const off = () => { touchBits &= ~b.bit; el.classList.remove("down"); };
    el.addEventListener("pointerdown", on); el.addEventListener("pointerup", off); el.addEventListener("pointercancel", off); el.addEventListener("lostpointercapture", off);
    box.append(el);
  }
}

// ── pause: the button, P/Esc, a hidden tab, or a phone turned to portrait ──
function setPaused(p) { paused = p; $("pause").hidden = !p; if (!p) { last = performance.now(); acc = 0; } }
document.addEventListener("visibilitychange", () => { if (document.hidden && match && !finished && !$("game").hidden && !MODES.capture) setPaused(true); });
const portrait = matchMedia("(orientation: portrait) and (max-width: 900px)");
portrait.addEventListener("change", () => { if (portrait.matches && match && !finished && !$("game").hidden) setPaused(true); });

// ── the loop: logic at a fixed 60 Hz, drawing once per display frame ──
let last = 0, acc = 0;
const buildOpts = (c) => ({ debug, reducedMotion: reduced.matches, fighters: fighterMans(), rung: RUNG, cam: c, fallback: MODES.fx, after: overT });
function tick() {
  if (!match || finished) return;
  if (match.fight && match.fight.over && !slowmo) { overT++; PR.tick(PS, match.fight, S.build(match.fight, buildOpts(cam || undefined))); }   // the flash, trail and dust keep fading under the K.O. banner
  if (slowmo) {   // the K.O. replayed at quarter speed from the last logic frames, the camera closing on the loser
    slowmo.t += 0.25;
    if (Math.floor(slowmo.t) !== Math.floor(slowmo.t - 0.25)) PR.tick(PS, slowmo.frames[Math.min(slowmo.frames.length - 1, Math.floor(slowmo.t))], null);
    if (slowmo.t >= slowmo.frames.length - 1) { slowmo = null; showBanner("K.O.", BANNER_END); }
    return;
  }
  if (banner > 0) {
    banner--;
    if (banner === 0) {
      $("banner").hidden = true;
      if (MODES.demo && match.fight.over) { if (MODES.capture) { finished = true; return; } startMatch(); return; }
      if (match.over) { finished = true; showResult(); return; }
      if (match.pending) { MA.nextRound(match); newAIs(); showBanner(match.rounds.length && match.rounds[match.rounds.length - 1].replay ? "DRAW — AGAIN" : "ROUND " + (match.round + 1), BANNER_START); }
    }
    if (banner > 0) return;   // a banner holds the fighters still
  }
  const g = match.fight;
  if (demo && MODES.capture && demo.step >= demo.steps.length) { finished = true; return; }   // a script with no K.O. (?demo=walk) ends the recording when it runs out
  if (g !== lastFight) { lastFight = g; PS = PR.create(MODES); ring = []; overT = 0; }
  const inp = demo ? DEMO.inputs(demo, g) : [ais[0] ? AI.decide(ais[0], AI.observe(g, 0)) : C.keyBits(held) | stickBitsNow | touchBits, AI.decide(ais[1], AI.observe(g, 1))];
  MA.step(match, inp);
  if (MODES.fx) { ring.push(F.snapshot(g)); if (ring.length > 40) ring.shift(); }
  PR.tick(PS, g, S.build(g, buildOpts(cam || undefined)));
  if (g.over) {
    if (MODES.fx && g.reason === "ko" && ring.length > 8) slowmo = { frames: ring.slice(-36), t: 0, loser: g.winner === null ? 0 : 1 - g.winner };
    else showBanner(g.reason === "time" ? "TIME" : g.winner === null ? "DOUBLE KO" : "K.O.", BANNER_END);
  }
}
const PERF = { intervals: [], work: [], lastT: 0 };
window.__arcPerf = () => {
  const iv = PERF.intervals.slice(-300), wk = PERF.work.slice(-300), q = (a, p) => a.slice().sort((x, y) => x - y)[Math.floor((a.length - 1) * p)] || 0;
  const mean = (a) => a.reduce((x, y) => x + y, 0) / Math.max(1, a.length);
  return { modes: modeLabel(), backend, cpu: MODES.cpu, frames: iv.length, fps: iv.length ? Math.round(1000 / mean(iv) * 10) / 10 : 0,
    p95FrameMs: Math.round(q(iv, 0.95) * 10) / 10, worstFrameMs: Math.round(Math.max(0, ...PERF.intervals) * 10) / 10, worstWorkMs: Math.round(Math.max(0, ...PERF.work) * 10) / 10, workMsMean: Math.round(mean(wk) * 100) / 100, workMsP95: Math.round(q(wk, 0.95) * 100) / 100,
    load: Object.assign({}, LOAD), fighters: Object.fromEntries(Object.entries(FIGHTERS).map(([k, v]) => [k, { tex: v.tex, bytes: v.bytes, decoded: v.decoded, pages: v.imgs.length, cells: v.cells.length }])) };
};
function frame(now) {
  requestAnimationFrame(frame);
  if (PERF.lastT) PERF.intervals.push(now - PERF.lastT); PERF.lastT = now; if (PERF.intervals.length > 600) PERF.intervals.shift();
  if (!match || $("game").hidden) return;
  const t0 = performance.now();
  if (paused || portrait.matches) { last = now; render((now - last) / 1000); return; }
  const dt = Math.min(250, now - last); acc += dt; last = now;
  let n = 0; while (acc >= STEP_MS && n < 6) { tick(); acc -= STEP_MS; n++; }
  if (n === 6) acc = 0;     // never spiral after a long stall
  render(dt / 1000);
  const work = performance.now() - t0; PERF.work.push(work); if (PERF.work.length > 600) PERF.work.shift();
  if (MODES.cpu > 1) { const until = performance.now() + work * (MODES.cpu - 1); while (performance.now() < until) { /* a slower phone, roughly */ } }
  if (MODES.perf && PERF.work.length % 30 === 0) { const p = window.__arcPerf(); $("perf").textContent = p.fps + " fps · work " + p.workMsMean + " ms (p95 " + p.workMsP95 + ") · cpu ×" + MODES.cpu; }
}
// the shot's placeholder box is hidden where the presentation draws the shot itself (the Vajra, the Nagapasha)
function noShotBoxes(g, shapes) {
  if (!MODES.fx) return shapes;
  return shapes.filter((s) => !(/^proj/.test(s.tag) && (((EFFECTS.vajra || MODES.fxMan) && g.f[+s.tag.slice(4)].hero === "indra") || M.ARCH[g.f[+s.tag.slice(4)].arch].special === "nagapasha")));
}
function viewFight() { return slowmo ? slowmo.frames[Math.min(slowmo.frames.length - 1, Math.floor(slowmo.t))] : match.fight; }
function render(dtSec) {
  if (!match || !draw) return;
  const g = viewFight();
  if (slowmo) {
    const lf = g.f[slowmo.loser], half = S.VIEW_W / 2 / 1.45;
    cam = S.easeCamera(cam, { x: Math.max(half, Math.min(F.STAGE_W - half, lf.x / F.U)), zoom: 1.45 }, dtSec);
  } else cam = PR.camera(PS, g, cam, dtSec || 1 / 60);
  const built = S.build(g, buildOpts(PR.shaken(PS, cam)));
  let shapes = built.shapes;
  shapes = noShotBoxes(g, shapes);
  draw(shapes.concat(PR.shapes(PS, g, built)));
  const mf = match.fight;
  mf.f.forEach((f, i) => {
    $("n" + i).textContent = M.HEROES[f.hero].name + (i === 1 && !MODES.demo ? " · " + ({ beginner: "Beginner", advanced: "Advanced", deathmatch: "Death Match" })[level] : "");
    $("hp" + i).style.width = (100 * f.hp / f.hpMax) + "%";
    $("m" + i).style.width = f.meter + "%";
    $("m" + i).parentElement.classList.toggle("full", f.meter >= M.MOVES.special.cost);
    $("w" + i).textContent = "●".repeat(match.wins[i]) + "○".repeat(MA.WINS - match.wins[i]);
  });
  $("timer").textContent = Math.ceil(mf.timer / 60);
}
function showResult() {
  const won = match.winner === 0;
  $("res-title").textContent = won ? "Victory" : "Defeat";
  $("res-rounds").innerHTML = "";
  match.rounds.forEach((r) => {
    const p = document.createElement("div");
    p.textContent = "Round " + (r.round + 1) + ": " + (r.replay ? "draw, fought again" : (r.winner === 0 ? "you won" : "you lost") + " (" + M.HEROES[r.heroes[0]].name + " vs " + M.HEROES[r.heroes[1]].name + ", " + (r.reason === "time" ? "time" : "K.O.") + ")");
    $("res-rounds").append(p);
  });
  const s = document.createElement("div"); s.textContent = "Seed " + seed; s.style.opacity = ".6"; $("res-rounds").append(s);
  $("result").hidden = false;
}

// ── the recorder (?capture=<name>, with tools/capture_server.js): the demo bout, stepped offline 2 logic frames per video
//    frame (30 fps), each frame posted as a JPEG; the server assembles the video. Deterministic: the same bout every time. ──
async function capture(name) {
  const post = (path, body) => fetch("/__capture/" + encodeURIComponent(name) + path, { method: "POST", body });
  startMatch(); let i = 0;
  while (!finished && i < (MODES.aivs ? 6000 : 1200)) {
    tick(); tick(); render(1 / 30);
    const blob = await new Promise((res) => canvasEl.toBlob(res, "image/jpeg", 0.92));
    await post("/" + i++, blob);
  }
  await post("/done?label=" + encodeURIComponent(modeLabel()) + "&frames=" + i, "");
  document.documentElement.dataset.captured = String(i);
}

$("go").onclick = () => startMatch();
$("pausebtn").onclick = () => setPaused(true);
$("resume").onclick = () => setPaused(false);
$("quit").onclick = () => { setPaused(false); match = null; $("game").hidden = true; $("setup").hidden = false; };
$("again").onclick = () => startMatch();
$("change").onclick = () => { $("result").hidden = true; $("game").hidden = true; $("setup").hidden = false; match = null; };

renderSetup(); setupTouch();
await initRenderer();   // first: the loader needs to know whether the GPU path (Pixi) can take compressed pages
await loadFighters();
document.documentElement.dataset.fighters = Object.keys(FIGHTERS).join(",") + "@" + RUNG;
$("perf").hidden = !MODES.perf;
// ── THE CLARITY STILLS (?still=1, a lab tool): window.__arcStill(o) sets up a fight, steps it (o.steps: [[inputs, frames], …]) through
//    the real tick (fight + presentation), draws ONE frame with a fixed camera {x, zoom} at the page's own device resolution, and posts
//    it as a PNG to the capture server (~/Desktop/DY_arcade_screens/clarity/<o.name>.png). o.noFade drops the cross-fade shapes. ──
if (MODES.raw.still) window.__arcStill = async (o) => {
  match = MA.createMatch({ lineup0: [o.p0, "box_surya", "box_varna"], lineup1: [o.p1, "box_rakta", "box_varna"], seconds: 99 });
  const g = match.fight; finished = false; banner = 0; $("banner").hidden = true; PS = PR.create(MODES); lastFight = g; overT = 0;
  g.f[0].x = Math.round(o.x0 * F.U); g.f[1].x = Math.round(o.x1 * F.U); g.frame = o.frame || 0; if (o.meter) g.f.forEach((f) => { f.meter = 100; });
  for (const [inp, n] of o.steps || []) for (let i = 0; i < n; i++) { MA.step(match, inp); PR.tick(PS, g, S.build(g, buildOpts(cam || undefined))); }
  $("game").hidden = true;   // freeze the loop: the frame below is the only one drawn
  cam = { x: o.camX != null ? o.camX : (g.f[0].x + g.f[1].x) / 2 / F.U, zoom: o.zoom };
  const built = S.build(g, buildOpts(cam)); let sh = noShotBoxes(g, built.shapes).concat(PR.shapes(PS, g, built));
  if (o.noFade) sh = sh.filter((s) => !/^fade/.test(s.tag));
  draw(sh);
  const blob = await new Promise((res) => canvasEl.toBlob(res, "image/png"));
  await fetch("/__still/" + encodeURIComponent(o.name), { method: "POST", body: blob });
  return { w: canvasEl.width, h: canvasEl.height, cam, fades: sh.filter((s) => /^fade/.test(s.tag)).length, state: g.f.map((f) => f.state + ":" + (f.move || "") + ":" + f.mf) };
};
if (MODES.capture) capture(MODES.capture);
else { if (MODES.demo || MODES.aivs) startMatch(); requestAnimationFrame(frame); }
