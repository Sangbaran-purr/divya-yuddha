/* ARCADE-1 · THE LAB PAGE (R0–R2): setup → a best-of-three on box fighters → result.
   The core decides everything (core/*.js). This file only reads input, steps the match at a fixed 60 Hz, and draws.
   Pixi (the lab's own copy in runtime/) draws the scene; if it can't start, a Canvas 2D floor draws the same shapes. */
const M = window.ARC_MOVES, F = window.ARC_FIGHT, AI = window.ARC_AI, R = window.ARC_RNG, MA = window.ARC_MATCH, C = window.ARC_CONTROLS, S = window.ARC_SCENE;
const STAMP = document.querySelector('meta[name="lab-stamp"]').content;
const STEP_MS = 1000 / 60, BANNER_START = 90, BANNER_END = 120;
const $ = (id) => document.getElementById(id);
const reduced = matchMedia("(prefers-reduced-motion: reduce)");

// ── a stale page reloads once onto the served stamp (the VFX lab's rule) ──
fetch("STAMP?t=" + Date.now(), { cache: "no-store" }).then((r) => r.ok ? r.text() : "").then((s) => {
  s = s.trim();
  if (s && s !== STAMP && !sessionStorage.getItem("arc_reloaded_" + s)) { sessionStorage.setItem("arc_reloaded_" + s, "1"); location.reload(); }
}).catch(() => {});

// ── renderer: Pixi first, Canvas 2D floor ──
let draw = null, backend = "";
async function initRenderer() {
  const host = $("stage");
  try {
    const PIXI = await import("../runtime/pixi.min.mjs?v=" + STAMP);
    const app = new PIXI.Application();
    await app.init({ width: S.VIEW_W, height: S.VIEW_H, background: "#120c06", antialias: true, preference: "webgl", resolution: Math.min(2, window.devicePixelRatio || 1), autoDensity: true });
    host.appendChild(app.canvas);
    const gfx = new PIXI.Graphics(); app.stage.addChild(gfx);
    app.ticker.stop();
    draw = (shapes) => {
      gfx.clear();
      for (const s of shapes) {
        gfx.rect(s.x, s.y, s.w, s.h);
        if (s.fill != null) gfx.fill({ color: s.fill, alpha: s.alpha });
        if (s.stroke) gfx.stroke({ width: s.stroke.width, color: s.stroke.color });
      }
      app.renderer.render(app.stage);
    };
    backend = "pixi-" + (app.renderer.name || "webgl");
  } catch (e) {
    const cv = document.createElement("canvas"), dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = S.VIEW_W * dpr; cv.height = S.VIEW_H * dpr; host.appendChild(cv);
    const cx = cv.getContext("2d"); cx.scale(dpr, dpr);
    const hex = (c) => "#" + ("00000" + c.toString(16)).slice(-6);
    draw = (shapes) => {
      cx.clearRect(0, 0, S.VIEW_W, S.VIEW_H);
      for (const s of shapes) {
        if (s.fill != null) { cx.globalAlpha = s.alpha; cx.fillStyle = hex(s.fill); cx.fillRect(s.x, s.y, s.w, s.h); }
        if (s.stroke) { cx.globalAlpha = 1; cx.lineWidth = s.stroke.width; cx.strokeStyle = hex(s.stroke.color); cx.strokeRect(s.x, s.y, s.w, s.h); }
      }
      cx.globalAlpha = 1;
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
    b.onclick = () => { lineup = lineup.includes(id) ? lineup.filter((x) => x !== id) : lineup.concat(id); renderSetup(); };
    box.append(b);
  }
  const lv = $("levels"); lv.innerHTML = "";
  for (const [id, label] of [["beginner", "Beginner"], ["advanced", "Advanced"], ["deathmatch", "Death Match"]]) {
    const b = document.createElement("button"); b.type = "button"; b.className = "chip" + (level === id ? " on" : ""); b.textContent = label;
    b.onclick = () => { level = id; renderSetup(); }; lv.append(b);
  }
  $("go").disabled = lineup.length !== MA.ROUNDS;
}

// ── the match ──
let match = null, ais = null, rng = null, seed = 0, banner = 0, bannerText = "", paused = false, debug = false, finished = false;
function shuffle(a, r) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function newAIs() { ais = [null, AI.createAI(level, rng)]; }
function startMatch() {
  seed = (Date.now() ^ (Math.random() * 1e9)) >>> 0;     // a UI choice; the match itself replays from this seed
  rng = R.rng(seed);
  match = MA.createMatch({ lineup0: lineup, lineup1: shuffle(HERO_IDS, rng) });
  newAIs(); finished = false; paused = false;
  showBanner("ROUND 1", BANNER_START);
  $("setup").hidden = true; $("result").hidden = true; $("pause").hidden = true; $("game").hidden = false;
  const touch = matchMedia("(pointer: coarse)").matches || "ontouchstart" in window;
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
document.addEventListener("visibilitychange", () => { if (document.hidden && match && !finished && !$("game").hidden) setPaused(true); });
const portrait = matchMedia("(orientation: portrait) and (max-width: 900px)");
portrait.addEventListener("change", () => { if (portrait.matches && match && !finished && !$("game").hidden) setPaused(true); });

// ── the loop: logic at a fixed 60 Hz, drawing once per display frame ──
let last = 0, acc = 0;
function tick() {
  if (!match || finished) return;
  if (banner > 0) {
    banner--;
    if (banner === 0) {
      $("banner").hidden = true;
      if (match.over) { finished = true; showResult(); return; }
      if (match.pending) { MA.nextRound(match); newAIs(); showBanner(match.rounds.length && match.rounds[match.rounds.length - 1].replay ? "DRAW — AGAIN" : "ROUND " + (match.round + 1), BANNER_START); }
    }
    if (banner > 0) return;   // a banner holds the fighters still
  }
  const g = match.fight;
  const p0 = C.keyBits(held) | stickBitsNow | touchBits;
  const p1 = AI.decide(ais[1], AI.observe(g, 1));
  MA.step(match, [p0, p1]);
  if (g.over) showBanner(g.reason === "time" ? "TIME" : g.winner === null ? "DOUBLE KO" : "K.O.", BANNER_END);
}
function frame(now) {
  requestAnimationFrame(frame);
  if (!match || $("game").hidden) return;
  if (paused || portrait.matches) { last = now; render(); return; }
  acc += Math.min(250, now - last); last = now;
  let n = 0; while (acc >= STEP_MS && n < 6) { tick(); acc -= STEP_MS; n++; }
  if (n === 6) acc = 0;     // never spiral after a long stall
  render();
}
function render() {
  if (!match || !draw) return;
  const g = match.fight;
  draw(S.build(g, { debug: debug, reducedMotion: reduced.matches }).shapes);
  g.f.forEach((f, i) => {
    $("n" + i).textContent = M.HEROES[f.hero].name + (i === 1 ? " · " + ({ beginner: "Beginner", advanced: "Advanced", deathmatch: "Death Match" })[level] : "");
    $("hp" + i).style.width = (100 * f.hp / f.hpMax) + "%";
    $("m" + i).style.width = f.meter + "%";
    $("m" + i).parentElement.classList.toggle("full", f.meter >= M.MOVES.special.cost);
    $("w" + i).textContent = "●".repeat(match.wins[i]) + "○".repeat(MA.WINS - match.wins[i]);
  });
  $("timer").textContent = Math.ceil(g.timer / 60);
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

$("go").onclick = () => startMatch();
$("pausebtn").onclick = () => setPaused(true);
$("resume").onclick = () => setPaused(false);
$("quit").onclick = () => { setPaused(false); match = null; $("game").hidden = true; $("setup").hidden = false; };
$("again").onclick = () => startMatch();
$("change").onclick = () => { $("result").hidden = true; $("game").hidden = true; $("setup").hidden = false; match = null; };

renderSetup(); setupTouch();
await initRenderer();
requestAnimationFrame(frame);
