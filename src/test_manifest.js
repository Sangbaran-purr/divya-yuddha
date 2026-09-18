#!/usr/bin/env node
'use strict';
// src/test_manifest.js — EXPORT-1/3: the premium effects in the live game (Vajra, Sudarshana Chakra, Pashupatastra; Brahmastra from EXPORT-3).
//
//   node src/test_manifest.js
//
// What it proves, from the SHIPPED files (index.html, assets/manifest/, src/engine.js) — never a copy of them:
//   R · ROUTING       registry.json routes exactly the four effects (Brahmastra joined in EXPORT-3); Meghnad is absent and pinned
//   A · ASSETS        every routed manifest validates under the page's own player, atlases match their manifests, E1 holds
//   T · TIMING        the clip's impact lands on the game's OWN resolution cue at every speed, read from the beat code's
//                     own constants; no wire-clock cost
//   F · FAIL-OPEN     the shipped glue, run on a fake clock: the beats never wait, a clip that is not ready or fails at its
//                     moment hands the moment back to the classic sprite, a registry that cannot load plays every sprite
//   W · THE WIRE      no new wire message types
//   P · PINS          src/engine.js and the inlined engine unchanged; Brahmastra's sprite (now its fallback) and the Unit landing path
//                     byte-identical to the pre-export game; the inlined effect player is the exported module, verbatim
const fs = require('fs'), path = require('path'), vm = require('vm'), crypto = require('crypto');
const GAME = path.resolve(__dirname, '..'), MAN = path.join(GAME, 'assets', 'manifest');
const HTML = fs.readFileSync(path.join(GAME, 'index.html'), 'utf8');
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const J = JSON.stringify;
let pass = 0, fail = 0;
const ok = (name, cond, detail) => { if (cond) { pass++; console.log('  ✓ ' + name); } else { fail++; console.log('  ✖ ' + name + (detail ? '\n      ' + detail : '')); } };

// ── the pre-export game (c0b57ee), recorded when the export was built: these lines must never move ──
const PIN = {
  engineJs: '3613706f3b736b3e367bfc063575902037b9b05e02ed1de9422bad7ee46520b9',
  inlinedEngine: 'd70e94b34248bf85c9a3bf00724a724e0997580fdadb16f3d8bfa753d79d8791',
  sprBrahmastra: 'ca7898c5da25a7ec39b5beb28fb5196e14f111a5d69b3b812f03b41bca80166a',
  unitLanding: 'cd4ed62d5f7b67d61599a5f7d6e67c0ab9606adea88bc08d3bf5a6636e813011',
  effectPlayer: '3a780fe5ec52754c60b69268a6923fc5b80185e3ad549923641e7ef7ddd1141c',   // EXPORT-3: the LAB-22 player (enemy-half-top, halfFraction); EXPORT-1 shipped 30219bcb370e…
  wireTypes: ['leap', 'mulligan', 'pass', 'play', 'shield'],
  // EXPORT-2: the nine actor modules and the faction effects, as certified in the manifestation lab when the export was built
  // (recorded here, never read from the lab: nothing outside the lab may name it — its own rule G2)
  actorModules: {"boarddiff": "879fe41a315d53122fd1d9b03d7f47a5643f2e1c59e7a14bb7f9973d57957ede", "clashcontext": "eb87c50dc6cee9726445fa066aafc0a47ad3ca382cad20ba5c8cca185e6f6d94", "director": "7027e197441e3cc3b8cb9df104585eeb51300f761263b434a3403252961b51c0", "runner": "7a0b80b824ed294493d53360c2c1a93997068897394fd7b400bb5faa151ebc35", "manifest": "077314c6a55483546f06b08e83a453c174d5636366bb5079d981a2c8b3396408", "stagemath": "6deed7f01db143d210133a95b856981094e647b67d3cd9467f70506fa00b4979", "dissolve": "8e4efc39f2714ca917c8b8da5095d50c58b2237280c137b05ca63ffd53a59e59", "actorstage": "dec202561478b1046cfeebcf552d8d885912d6a4f1e74b112c3d14faad1f7241", "playback": "ba7fce765c96f70d9eda895dce27172f340fc9bcf1969ea3fdcf449325d55d5f"},
  factionFx: '7254d128bcec6c2d433281f4daa027d81b74b022dbe13fe81ba2be3efbf310dc',
};
const ROUTED = ['brahmastra', 'pashupata', 'sudarshana', 'vajra'];
const lineOf = (needle) => HTML.split('\n').find((l) => l.indexOf(needle) >= 0) || null;
function fnBody(name) { const i = HTML.indexOf('function ' + name + '('); if (i < 0) return null; let d = 0; for (let k = HTML.indexOf('{', i); k < HTML.length; k++) { if (HTML[k] === '{') d++; else if (HTML[k] === '}' && !--d) return HTML.slice(i, k + 1); } return null; }
function between(a, b) { const i = HTML.indexOf(a), j = HTML.indexOf(b, i + 1); return i >= 0 && j > i ? HTML.slice(i, j) : null; }

// the page's own effect player, exactly as it ships inside index.html
const PLAYER_SRC = (() => { const s = between('/* ===== EFFECTCLIP VERBATIM BEGIN', '/* ===== EFFECTCLIP VERBATIM END ===== */'); return s ? s.slice(s.indexOf('\n') + 1) : null; })();
const EC = (() => { const m = { exports: {} }; vm.runInNewContext(PLAYER_SRC || '', { module: m, exports: m.exports, window: {}, Math, JSON, Object, Array, Promise, String, Number }); return m.exports; })();
const E = require('./engine.js');
const REG = JSON.parse(fs.readFileSync(path.join(MAN, 'registry.json'), 'utf8'));
function loadSpec(rel) {
  const p = path.join(MAN, rel), m = JSON.parse(fs.readFileSync(p, 'utf8'));
  if (m.class !== 'effect-chain') { m.__file = p; return m; }
  const clips = m.clips.map((c) => { const cp = path.join(path.dirname(p), c.manifest), cm = JSON.parse(fs.readFileSync(cp, 'utf8')); cm.__file = cp; return cm; });
  return { class: 'effect-chain', chain: m, clips, cardId: m.cardId, __file: p };
}
const clipsOf = (s) => (s.class === 'effect-chain' ? s.clips : [s]);
function webpSize(b) {
  if (b.toString('ascii', 0, 4) !== 'RIFF' || b.toString('ascii', 8, 12) !== 'WEBP') return null;
  const k = b.toString('ascii', 12, 16);
  if (k === 'VP8X') return { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) };
  if (k === 'VP8L') { const v = b.readUInt32LE(21); return { w: 1 + (v & 0x3fff), h: 1 + ((v >> 14) & 0x3fff) }; }
  if (k === 'VP8 ') return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
  return null;
}

// ═══ R · ROUTING ═══
console.log('── R · the routing table (assets/manifest/registry.json) ──');
{
  const routes = REG.routes || {};
  ok('R1 · exactly four routes — Vajra, Sudarshana Chakra, Pashupatastra, and (EXPORT-3) Brahmastra (' + J(Object.keys(routes).sort()) + ')', J(Object.keys(routes).sort()) === J(ROUTED));
  ok('R2 · each route names the classic sprite it replaces and the beat it owns: vajra → sprVajra at the destroy, sudarshana → sprSudarshana at the passive (the bite), pashupata → sprPashupatastra and brahmastra → sprBrahmastra at the play (the cast)',
     routes.vajra && routes.vajra.replaces === 'sprVajra' && routes.vajra.moment === 'destroy' && routes.sudarshana && routes.sudarshana.replaces === 'sprSudarshana' && routes.sudarshana.moment === 'passive' &&
     routes.pashupata && routes.pashupata.replaces === 'sprPashupatastra' && routes.pashupata.moment === 'play' && routes.brahmastra && routes.brahmastra.replaces === 'sprBrahmastra' && routes.brahmastra.moment === 'play', J(routes));
  ok('R3 · MEGHNAD IS NOT ROUTED — he is the only pinned entry and has no effect folder; BRAHMASTRA IS ROUTED (EXPORT-3: its pin is reversed now that the rebuilt LAB-22 clip re-ran the template) and ships its effect folder',
     !routes.meghnad && REG.pinned && REG.pinned.meghnad && !REG.pinned.brahmastra && J(Object.keys(REG.pinned)) === J(['meghnad']) &&
     !fs.existsSync(path.join(MAN, 'effects', 'meghnad')) && fs.existsSync(path.join(MAN, 'effects', 'brahmastra', 'manifest.json')));
  const castHook = "    if(isAstra && c) fxCast(c, ev, evs, snap);", bLine = lineOf("if(isAstra && c && c.id==='brahmastra')");
  const lines = HTML.split('\n'), hi = lines.findIndex((l) => l.indexOf(castHook) === 0);
  ok('R4 · the cast hook starts a routed clip on the Astra\'s play beat, on the line immediately above Brahmastra\'s (now gated) line',
     hi >= 0 && lines[hi + 1] === bLine && /if\(!fxOwnsMoment\('brahmastra', fire\)\) fire\(\);/.test(bLine));
  const gates = { pashupata: /if\(!fxOwnsMoment\('pashupata', fire\)\) fire\(\);/.test(HTML), vajra: /if\(ev\.abilityName==='Vajra' && dp && !fxOwnsMoment\('vajra'\)\) VFX\.sprVajra\(/.test(HTML),
                  sudarshana: /if\(!fxOwnsMoment\('sudarshana'\)\) VFX\.sprSudarshana\(/.test(HTML),
                  brahmastra: /fire=\(\)=>VFX\.sprBrahmastra\(r\.left\+r\.width\/2, r\.top\+r\.height\*0\.5, r\.width\*1\.04\); if\(!fxOwnsMoment\('brahmastra', fire\)\) fire\(\);/.test(HTML) };
  const bare = { vajra: (HTML.match(/VFX\.sprVajra\(/g) || []).length, sudarshana: (HTML.match(/VFX\.sprSudarshana\(/g) || []).length, brahmastra: (HTML.match(/VFX\.sprBrahmastra\(/g) || []).length };
  ok('R5 · each routed card\'s classic sprite is still called at its own moment, behind the clip\'s ownership test — and only there (sprVajra ' + bare.vajra + ' call site, sprSudarshana ' + bare.sudarshana + ', sprBrahmastra ' + bare.brahmastra + ')',
     Object.values(gates).every(Boolean) && bare.vajra === 1 && bare.sudarshana === 1 && bare.brahmastra === 1, J({ gates, bare }));
  ok('R6 · skipping the choreography (tap, backgrounding, the watchdog) and starting a new match both stand the clip down',
     /revealAllMaterializingHeroes\(\); \}catch\(e\)\{\} try\{ fxSkip\(\); \}catch\(e\)\{\} \}/.test(HTML) && /function resetChoreo\(\)\{ try\{ fxSkip\(\); \}catch\(e\)\{\}/.test(HTML));
  ok('R7 · the effect-clip canvas sits in the field at z6 with the flash moved to z7 (the GPU layer #vfxgpu shares z6; all below the choreography lock at z64)',
     /<canvas id="vfxcanvas"><\/canvas>\n    <canvas id="effectclip"><\/canvas>/.test(HTML) && /#effectclip\{ position:absolute; inset:0; z-index:6; pointer-events:none;/.test(HTML) && /#vfxflash\{ position:absolute; inset:0; z-index:7;/.test(HTML));
}

// ═══ A · ASSETS ═══
console.log('\n── A · the shipped assets validate under the page\'s own player ──');
const SPECS = {}, ALLFILES = [];
{
  const bad = [];
  for (const id of ROUTED) {
    try { const s = loadSpec(REG.routes[id].spec); SPECS[id] = s;
      const v = s.class === 'effect-chain' ? EC.validateChain(s.chain, s.clips) : EC.validate(s);
      if (!v.ok) bad.push(id + ': ' + v.errors.join('; ')); } catch (e) { bad.push(id + ': ' + e.message); }
  }
  ok('A1 · every routed spec loads and validates (' + ROUTED.map((id) => id + (SPECS[id] && SPECS[id].class === 'effect-chain' ? ' — a chain of ' + SPECS[id].clips.length : '')).join(', ') + ')', bad.length === 0, bad.join(' | '));
  const rows = [];
  for (const id of ROUTED) for (const m of clipsOf(SPECS[id] || { class: '', clips: [] })) {
    const ap = path.join(path.dirname(m.__file), m.atlas), exists = fs.existsSync(ap), px = exists ? webpSize(fs.readFileSync(ap)) : null;
    rows.push({ clip: path.basename(path.dirname(m.__file)), exists, px, want: m.atlasSize, bytes: m.atlasSize.w * m.atlasSize.h * 4, file: exists ? fs.statSync(ap).size : 0 });
  }
  ok('A2 · every atlas is present and decodes to exactly the size its manifest records (' + rows.map((r) => r.clip + ' ' + (r.px ? r.px.w + '×' + r.px.h : '?')).join(', ') + ')',
     rows.length === 5 && rows.every((r) => r.exists && r.px && r.px.w === r.want.w && r.px.h === r.want.h), J(rows));
  ok('A3 · E1: each clip decodes under the effect layer\'s cap of ' + (EC.E1.capBytes / 1048576).toFixed(2) + ' MB (' + rows.map((r) => r.clip + ' ' + (r.bytes / 1048576).toFixed(2)).join(', ') + ' MB) and the player holds one clip decoded at a time',
     rows.every((r) => r.bytes <= EC.E1.capBytes) && EC.E1.oneAtATime === true);
  const all = [], walk = (d) => fs.readdirSync(d).forEach((n) => { const q = path.join(d, n); if (fs.statSync(q).isDirectory()) walk(q); else all.push(path.relative(MAN, q)); });
  walk(MAN);
  const fxFiles = all.filter((f) => f.indexOf('effects/') === 0).sort();
  ok('A4 · assets/manifest/effects holds exactly the chain and the five clips (' + fxFiles.length + ' files, ' + (rows.reduce((a, r) => a + r.file, 0) / 1048576).toFixed(2) + ' MB of atlas) — the actors (EXPORT-2) are inventoried in H3',
     J(fxFiles) === J(['effects/brahmastra/atlas.webp', 'effects/brahmastra/manifest.json', 'effects/pashupata/atlas.webp', 'effects/pashupata/manifest.json', 'effects/sudarshana/chain.json', 'effects/sudarshana_invoke/atlas.webp', 'effects/sudarshana_invoke/manifest.json',
                       'effects/sudarshana_strike/atlas.webp', 'effects/sudarshana_strike/manifest.json', 'effects/vajra/atlas.webp', 'effects/vajra/manifest.json']), J(fxFiles));
  ALLFILES.push(...all);
}

// ═══ T · TIMING — the impact lands on the game's own cue ═══
console.log('\n── T · the impact lands on the game\'s own resolution cue, at every speed ──');
// the beat code's own numbers, read from the page
const BEAT = (() => {
  const hold0 = +(/let hold=(\d+), hitStop=0;/.exec(HTML) || [])[1];
  const spec = /if\(tier==='spectacle'\)\{ hold \+= heroServed \? (\d+) : (\d+); hitStop=(\d+);/.exec(HTML) || [];
  const legacy = /const LEGACY_VFX = (true|false);/.exec(HTML), choreo = +(/const CHOREO_SPEED = ([\d.]+);/.exec(HTML) || [])[1];
  const speeds = (/const SPEEDS=\{ relaxed:([\d.]+), normal:([\d.]+), fast:([\d.]+) \};/.exec(HTML) || []).slice(1).map(Number);
  const flight = +(/VFX\.sprSudarshana\(dp\.cx, dp\.rect\.top\+dp\.rect\.height\/2, dp\.rect\.width, fx, fy, (\d+)\);[^\n]*\n\s*await cDelay\((\d+)\);/.exec(HTML) || [])[2];
  const heroServed = legacy && legacy[1] === 'true';   // the GPU hero moment only runs behind LEGACY_VFX
  return { hitStop: +spec[3], hold: hold0 + (heroServed ? +spec[1] : +spec[2]), choreo, speeds: { relaxed: speeds[0], normal: speeds[1], fast: speeds[2] }, flight, legacy: legacy && legacy[1] };
})();
ok('T1 · the game\'s beat constants read from the page: a spectacle cast is a ' + BEAT.hitStop + ' ms hit-stop + a ' + BEAT.hold + ' ms hold (LEGACY_VFX ' + BEAT.legacy + ' → no GPU hero moment), the disc flies ' + BEAT.flight + ' ms, CHOREO_SPEED ' + BEAT.choreo + ', speeds ' + J(BEAT.speeds) + ' — and every routed contract carries exactly those numbers',
   BEAT.hitStop === 110 && BEAT.hold === 1000 && BEAT.flight === 380 && BEAT.choreo === 1.3 &&
   ROUTED.every((id) => { const k = SPECS[id].class === 'effect-chain' ? SPECS[id].chain.contract : SPECS[id].contract; return k.castHitStopMs === BEAT.hitStop && k.castHoldMs === BEAT.hold && (id === 'sudarshana' ? k.flightMs === BEAT.flight : !k.flightMs); }), J(BEAT));
// a real cast of each, through the engine
function cast(which) {
  const deva = ['Yama', 'Marut', 'Chandra Dev', 'Gandharva', 'Deva Soldier', 'Kubera', 'Urvashi', 'Brihaspati', 'Narada', 'Vishwakarma', 'Indra'];
  const asura = ['Kumbhakarna', 'Mahabali', 'Ravana', 'Vibhishana', 'Kalanemi', 'Narakasura', 'Bana Asura', 'Maricha', 'Tataka', 'Hiranyakashipu', 'Meghnad'];
  const setups = {
    vajra: { mine: ['Vajra'].concat(deva), theirs: asura, fac: ['devas', 'asuras'], lay: [[1, 'Kumbhakarna']], card: 'Vajra' },
    sudarshana: { mine: ['Sudarshana Chakra'].concat(deva), theirs: asura, fac: ['devas', 'asuras'], lay: [[1, 'Mahabali']], card: 'Sudarshana Chakra' },
    pashupata: { mine: ['Pashupatastra'].concat(asura), theirs: deva, fac: ['asuras', 'devas'], lay: [[1, 'Yama'], [0, 'Kumbhakarna'], [1, 'Marut']], card: 'Pashupatastra' },
    brahmastra: { mine: ['Brahmastra'].concat(deva), theirs: asura, fac: ['devas', 'asuras'], lay: [[1, 'Kumbhakarna'], [0, 'Yama'], [1, 'Ravana']], card: 'Brahmastra' },
  }, S = setups[which];
  for (let seed = 1; seed < 500; seed++) {
    let x = seed; const rng = () => { x = (x * 1103515245 + 12345) % 2147483648; return x / 2147483648; };
    const g = E.newGame({ rng, realm: 'mrityulok', p0Faction: S.fac[0], p1Faction: S.fac[1], scenario: { p0Deck: S.mine.slice(0, 12), p1Deck: S.theirs.slice(0, 12), p0Hand: S.mine.slice(0, 10), p1Hand: S.theirs.slice(0, 10), mulligan: 0 } });
    if (g.turn !== S.lay[0][0]) continue;
    let okLay = true; for (const [s, n] of S.lay) { if (g.turn !== s) { okLay = false; break; } const i = g.players[s].hand.findIndex((c) => c.n === n); if (i < 0) { okLay = false; break; } E.playCard(g, s, i); }
    if (!okLay || g.turn !== 0) continue;
    const h = g.players[0].hand.findIndex((c) => c.n === S.card); if (E.playableIndices(g, 0).indexOf(h) < 0) continue;
    const e0 = g.events.length; E.playCard(g, 0, h); return { events: g.events.slice(e0), casterSeat: 0 };
  }
  return null;
}
const BATCH = {}; for (const id of ROUTED) BATCH[id] = cast(id);
ok('T2 · a real cast of each, through the engine: ' + ROUTED.map((id) => id + ' → ' + (BATCH[id] ? BATCH[id].events.map((e) => e.type).join('+') : 'NO BOARD')).join(' · '), ROUTED.every((id) => BATCH[id] && BATCH[id].events[0].type === 'play'));
const T = [];
for (const id of ROUTED) for (const sp of ['relaxed', 'normal', 'fast']) {
  const vfxT = BEAT.speeds[sp] * BEAT.choreo, p = EC.plan(BATCH[id], SPECS[id], { mode: 'full', choreoSpeed: vfxT, casterSeat: 0 });
  const gameCue = (BEAT.hitStop + BEAT.hold + (id === 'sudarshana' ? BEAT.flight : 0)) * vfxT;   // the moment the destroy / damage / bite beat fires
  T.push({ id, sp, clip: p.clip, impact: +p.timeline.impactAt.toFixed(2), gameCue: +gameCue.toFixed(2), cost: p.timeline.waitCostMs, start: +(p.timeline.clipStart != null ? p.timeline.clipStart : p.timeline.invokeStart).toFixed(1) });
}
ok('T3 · THE IMPACT IS THE GAME\'S CUE: at Relaxed, Normal and Fast the clip\'s planned impact equals the moment the game\'s own beat fires — ' + T.filter((x) => x.sp === 'normal').map((x) => x.id + ' ' + x.impact + ' ms').join(', ') + ' at Normal; ' + T.filter((x) => x.sp === 'fast').map((x) => x.id + ' ' + x.impact).join(', ') + ' at Fast',
   T.every((x) => x.clip && Math.abs(x.impact - x.gameCue) < 0.01), J(T));
ok('T4 · 0 ms OF WIRE CLOCK: every clip starts after the cast (' + T.filter((x) => x.sp === 'fast').map((x) => x.id + ' ' + x.start + ' ms').join(', ') + ' at Fast), so no beat ever waits on it',
   T.every((x) => x.cost === 0 && x.start >= 0), J(T.map((x) => [x.id, x.sp, x.start, x.cost])));

// ═══ F · FAIL-OPEN — the shipped glue on a fake clock ═══
console.log('\n── F · fail-open falls back to yesterday\'s game, never to absence ──');
const GLUE = between('/* ══ EXPORT-1 — THE PREMIUM EFFECTS', 'function runAction(mutate, opts={}){');
function sandbox(o) {
  o = o || {};
  let now = 1000; const logs = [], warns = [], files = {};
  const rect = { left: 0, top: 0, width: 355, height: 420, right: 355, bottom: 420 };
  const el = { getBoundingClientRect: () => rect, width: 0, height: 0, getContext: () => ({ setTransform() {}, clearRect() {}, drawImage() {}, globalCompositeOperation: 'source-over', globalAlpha: 1, getImageData: (x, y, w, h) => ({ data: new Uint8ClampedArray(4) }), putImageData() {} }) };
  const abs = (u) => new URL(u, 'https://game.test/index.html');
  const read = (u) => { const rel = decodeURIComponent(abs(u).pathname).replace(/^\//, ''); const p = path.join(GAME, rel); return fs.existsSync(p) ? p : null; };
  const ctx = {
    console: { log: (...a) => logs.push(a.join(' ')), warn: (...a) => warns.push(a.join(' ')), error: (...a) => warns.push(a.join(' ')) },
    location: { href: 'https://game.test/index.html' }, URL, Blob, Promise, Math, JSON, Object, Array, Date, String, Number, Error, setTimeout,
    performance: { now: () => now }, requestAnimationFrame: () => 1, devicePixelRatio: 2,
    fetch: (u) => { if (o.fetch404) return Promise.resolve({ ok: false, status: 404 });
      const rel = abs(u).pathname; if (o.hold && o.hold(rel)) return new Promise(() => {});
      const p = read(u); if (!p) return Promise.resolve({ ok: false, status: 404 });
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(fs.readFileSync(p, 'utf8'))), blob: () => Promise.resolve(new Blob([fs.readFileSync(p)])) }); },
    createImageBitmap: (b) => o.decodeFails ? Promise.reject(new Error('decode refused')) : Promise.resolve({ width: 64, height: 32, close() {} }),
    Image: function () { const im = this; setTimeout(() => { if (im.onerror) im.onerror(); }, 0); },
    document: { createElement: () => el, querySelector: () => el },
    $: () => el, EffectClip: EC, G: { players: [{ hand: [] }, { hand: [] }] }, BLog: { fx: null },
    posOf: () => ({ cx: 120, top: 60, rect: { top: 40, height: 90, width: 64, left: 88 } }), halfSel: (s) => s ? '.half.opp' : '.half.me',
    ownerPiOfUid: () => 0, reducedMotion: () => !!o.reduced, vfxT: () => 1.3,
  };
  ctx.window = ctx; ctx.URL.createObjectURL = ctx.URL.createObjectURL || (() => 'blob:x'); ctx.URL.revokeObjectURL = ctx.URL.revokeObjectURL || (() => {});
  vm.createContext(ctx);
  vm.runInContext(GLUE + '\n;globalThis.__fx = { FX, fxBoot, fxPrefetch, fxReady, fxCast, fxOwnsMoment, fxOnError, fxSkip, fxClips, fxAtlasUrl };', ctx);
  return { ctx, fx: ctx.__fx, logs, warns, tick: (ms) => { now += ms; if (ctx.__fx.FX.player && ctx.__fx.FX.run) ctx.__fx.FX.player.frame(now); } };
}
const flush = () => new Promise((r) => setTimeout(r, 5));
// a hang is a failure, loudly: the whole suite must finish (a manifestation that waits forever would otherwise just never end)
setTimeout(() => { console.log('✖ THE SUITE HUNG past 180 s — something awaited forever (' + pass + ' passed so far, ' + fail + ' failed)'); process.exit(1); }, 180000).unref();
const castEv = (id) => BATCH[id].events;
const card = (id) => ({ id, n: id, t: 'astra' });
(async () => {
  // F1 · no registry → every card plays its sprite
  { const S = sandbox({ fetch404: true }); const r = await S.fx.fxBoot(); await flush();
    const runs = ROUTED.map((id) => S.fx.fxCast(card(id), castEv(id)[0], castEv(id), {}));
    ok('F1 · NO REGISTRY (a 404, an offline copy, a page not given the assets): the routes stay empty, every cast returns null and every card plays its classic sprite — and a missing registry is silent (0 warnings, 0 console.log)',
       r === null && S.fx.FX.routes === null && runs.every((x) => x === null) && S.warns.length === 0 && S.logs.length === 0, J({ r, warns: S.warns, logs: S.logs })); }
  // F2 · not ready at the cast
  { const S = sandbox(); await S.fx.fxBoot();
    const r = S.fx.fxCast(card('vajra'), castEv('vajra')[0], castEv('vajra'), {});
    ok('F2 · NOT READY AT THE CAST (the atlas bytes never arrived): the cast returns null — the classic sprVajra keeps its moment — and the fall-back is noted to the console and the battle log\'s diagnostics, not narrated',
       r === null && S.fx.FX.diag.some((d) => d.kind === 'not-ready-at-cast') && S.ctx.BLog.fx && S.ctx.BLog.fx.some((d) => d.kind === 'not-ready-at-cast') && S.warns.length === 1 && S.logs.length === 0, J({ diag: S.fx.FX.diag, warns: S.warns })); }
  // F3 · ready: the clip owns its moment, and the cast never waited on the decode
  { const S = sandbox(); await S.fx.fxBoot(); await S.fx.fxPrefetch('vajra'); await flush();
    const ready = S.fx.fxReady('vajra'), r = S.fx.fxCast(card('vajra'), castEv('vajra')[0], castEv('vajra'), {});
    const decodedAtCast = r && r.log.ready.strike != null;
    await flush(); S.tick(16);
    const owns = S.fx.fxOwnsMoment('vajra');
    ok('F3 · READY: the cast starts the clip at once — the decode still in flight when fxCast returns (the beat does not wait) — the atlas decodes alongside, and at the destroy beat the clip OWNS the moment, so sprVajra stands down',
       ready && !!r && r.plan.clip && !decodedAtCast && r.log.ready.strike != null && owns === true, J({ ready, clip: r && r.plan.clip, decodedAtCast, readyAfter: r && r.log.ready, owns })); }
  // F4 · the decode fails before the moment → the sprite takes it back
  { const S = sandbox({ decodeFails: true }); await S.fx.fxBoot(); await S.fx.fxPrefetch('vajra'); await flush();
    const r = S.fx.fxCast(card('vajra'), castEv('vajra')[0], castEv('vajra'), {}); await flush(); await flush(); S.tick(16);
    const owns = S.fx.fxOwnsMoment('vajra');
    ok('F4 · THE CLIP FAILS BEFORE ITS MOMENT (the atlas will not decode): at the destroy beat the clip does NOT own the moment — sprVajra fires, as yesterday — and the clip is stood down, nothing left running',
       !!r && r.log.loadErrors.length === 1 && owns === false && S.fx.FX.run === null && S.fx.FX.diag.some((d) => d.kind === 'fell-back'), J({ errs: r && r.log.loadErrors, owns, diag: S.fx.FX.diag.map((d) => d.kind) })); }
  // F5 · still decoding at the moment → the sprite takes it
  { const S = sandbox({ hold: () => false }); await S.fx.fxBoot(); await S.fx.fxPrefetch('vajra'); await flush();
    S.ctx.createImageBitmap = () => new Promise(() => {});   // a decode that never settles
    const r = S.fx.fxCast(card('vajra'), castEv('vajra')[0], castEv('vajra'), {}); S.tick(16);
    const owns = S.fx.fxOwnsMoment('vajra');
    ok('F5 · STILL DECODING AT ITS MOMENT (the decode never settles): the clip does not own the destroy beat — sprVajra fires — and the clip is stood down so a late decode can never draw over it',
       !!r && owns === false && S.fx.FX.run === null && S.fx.FX.diag.some((d) => d.kind === 'fell-back' && /not decoded/.test(d.why)), J({ owns, diag: S.fx.FX.diag })); }
  // F6 · Pashupatastra: its moment IS the cast — a failure after it fires the sprite late
  { const S = sandbox({ decodeFails: true }); await S.fx.fxBoot(); await S.fx.fxPrefetch('pashupata'); await flush();
    const r = S.fx.fxCast(card('pashupata'), castEv('pashupata')[0], castEv('pashupata'), {});
    let fired = 0; const owns = S.fx.fxOwnsMoment('pashupata', () => { fired++; });
    const firedAtCast = fired; await flush(); await flush(); S.tick(16);
    ok('F6 · A MOMENT THAT IS THE CAST (Pashupatastra): the clip holds the cast provisionally (the decode is in flight), and when the decode then fails the classic sprPashupatastra FIRES LATE, once — never absent',
       !!r && owns === true && firedAtCast === 0 && fired === 1 && S.fx.FX.diag.some((d) => d.kind === 'fell-back' && /fired late/.test(d.why)), J({ owns, firedAtCast, fired, diag: S.fx.FX.diag.map((d) => d.kind) })); }
  // F7 · reduced motion and unrouted cards
  { const S = sandbox({ reduced: true }); await S.fx.fxBoot(); await S.fx.fxPrefetch('vajra'); await flush();
    const r1 = S.fx.fxCast(card('vajra'), castEv('vajra')[0], castEv('vajra'), {});
    const S2 = sandbox(); await S2.fx.fxBoot(); const r2 = S2.fx.fxCast(card('gandiva'), castEv('vajra')[0], castEv('vajra'), {}), r3 = S2.fx.fxCast(card('meghnad'), castEv('vajra')[0], castEv('vajra'), {});
    ok('F7 · REDUCED MOTION plays no clip (the page\'s reduced path skips playEvent entirely; the glue refuses too), and an UNROUTED card — Gandiva Arrow, Meghnad — returns at once with nothing noted: its presentation is exactly the old one',
       r1 === null && r2 === null && r3 === null && S2.fx.FX.diag.length === 0 && S.logs.length + S2.logs.length === 0); }
  // F9 · EXPORT-3: Brahmastra's moment IS the cast (like Pashupatastra) — a failure after it fires the classic sprite late, once
  { const S = sandbox({ decodeFails: true }); await S.fx.fxBoot(); await S.fx.fxPrefetch('brahmastra'); await flush();
    const r = S.fx.fxCast(card('brahmastra'), castEv('brahmastra')[0], castEv('brahmastra'), {});
    let fired = 0; const owns = S.fx.fxOwnsMoment('brahmastra', () => { fired++; });
    const firedAtCast = fired; await flush(); await flush(); S.tick(16);
    const S2 = sandbox(); await S2.fx.fxBoot(); const r2 = S2.fx.fxCast(card('brahmastra'), castEv('brahmastra')[0], castEv('brahmastra'), {});
    let fired2 = 0; const owns2 = S2.fx.fxOwnsMoment('brahmastra', () => { fired2++; });
    ok('F9 · BRAHMASTRA FAILS OPEN (EXPORT-3): its clip holds the cast provisionally, and when the decode then fails the classic sprBrahmastra FIRES LATE, once — never absent; and a clip that is NOT READY at the cast never starts, so the sprite fires on the cast exactly as before',
       !!r && owns === true && firedAtCast === 0 && fired === 1 && S.fx.FX.diag.some((d) => d.kind === 'fell-back' && /fired late/.test(d.why)) &&
       r2 === null && owns2 === false && fired2 === 0, J({ owns, firedAtCast, fired, r2: r2 === null, owns2 })); }
  // F10 · EXPORT-3: the rebuilt plate hangs TOP-FLUSH on the enemy half at 0.93 of its width, through the game's own halfOf
  { const S = sandbox(); await S.fx.fxBoot(); await S.fx.fxPrefetch('brahmastra'); await flush();
    const r = S.fx.fxCast(card('brahmastra'), castEv('brahmastra')[0], castEv('brahmastra'), {});
    const pl = r && r.places && r.places[0], seg = r && r.plan.segments[0];
    const S2 = sandbox(); await S2.fx.fxBoot(); await S2.fx.fxPrefetch('brahmastra'); await flush();
    S2.ctx.document.querySelector = () => null;   // a board with no enemy half to hang on
    const r2 = S2.fx.fxCast(card('brahmastra'), castEv('brahmastra')[0], castEv('brahmastra'), {});
    ok('F10 · THE REBUILT PLATE HANGS TOP-FLUSH (EXPORT-3, LAB-22 ruling 4): the segment places "enemy-half-top" and the game\'s halfOf now reports the half\'s top and width, so the plate\'s top sits on the half\'s top edge (' + (pl && pl.y.toFixed(1)) + ' px), horizontally centred, ' + (pl && (pl.w / 355).toFixed(3)) + ' of the half\'s width (the ruled 0.93); with no half to hang on the player plays no plate (' + J(r2 && r2.places) + ') and the classic sprite keeps the moment',
       !!pl && seg.place === 'enemy-half-top' && Math.abs(pl.y) < 0.01 && Math.abs(pl.x + pl.w / 2 - 177.5) < 0.01 && Math.abs(pl.w / 355 - 0.93) < 0.001 &&
       /return \{ cx:r\.left-f\.left\+r\.width\/2, cy:r\.top-f\.top\+r\.height\/2, top:r\.top-f\.top, w:r\.width \}; \}/.test(GLUE) &&
       (r2 === null || !r2.places || r2.places[0] === null), J({ pl, place: seg && seg.place, r2: r2 && r2.places })); }
  // F8 · the diagnostics never narrate and never console.log
  const NARR = /BLog\.lines\.push/.test(GLUE), LOGS = /console\.log\(/.test(GLUE);
  ok('F8 · THE DIAGNOSTICS ARE QUIET: the glue writes the console (warn, never log) and the battle log\'s BLog.fx field — never a narrated line, never a banner', !NARR && !LOGS && /BLog\.fx=BLog\.fx\|\|\[\]/.test(GLUE));

  // ═══ H · THE HEROES (EXPORT-2) ═══
  console.log('\n── H · twenty Heroes manifest in the live game (EXPORT-2) ──');
  const MODS = ['boarddiff', 'clashcontext', 'director', 'runner', 'manifest', 'stagemath', 'dissolve', 'actorstage', 'playback'];
  const modSrc = (n) => { const s = between('/* ===== ACTOR MODULE VERBATIM BEGIN · ' + n + ' ===== */', '/* ===== ACTOR MODULE VERBATIM END · ' + n + ' ===== */'); return s ? s.slice(s.indexOf('\n') + 1) : null; };
  const DEFS = []; for (const f of Object.keys(E.DECKS)) for (const c of E.DECKS[f]) DEFS.push(Object.assign({ fac: f }, c));
  const HEROES = DEFS.filter((c) => c.t === 'hero').map((c) => c.id).sort();
  const ACT = REG.actors || {};
  ok('H1 · THE ROUTING TABLE NAMES EXACTLY THE TWENTY HEROES — every Hero the engine has (launch and wave), each at rung 256 with a native exit, none an effect route; Meghnad (a Unit) is not among them (' + Object.keys(ACT).length + ' actors)',
     J(Object.keys(ACT).sort()) === J(HEROES) && HEROES.length === 20 && HEROES.every((id) => ACT[id].rung === 256 && ACT[id].exit === 'native' && ACT[id].manifest === 'actors/' + id + '/manifest.json' && !(REG.routes || {})[id]) &&
     !ACT.meghnad && DEFS.find((c) => c.id === 'meghnad').t === 'unit', J(Object.keys(ACT)));
  const modBad = MODS.filter((n) => { const src = modSrc(n); return !src || sha(src) !== PIN.actorModules[n]; });
  ok('H2 · THE NINE ACTOR MODULES ARE THE LAB\'S, VERBATIM — each inlined block is byte-identical to the certified module (sha256 recorded at export) (' + MODS.join(', ') + ')', modBad.length === 0, 'differ: ' + J(modBad));

  // the page's own modules and glue, in a sandbox with a fake clock and a stub DOM
  const WD = between('const CHOREO_WATCHDOG_MS=', '// choreoForce: finishers');
  const WD_TICK = (() => { const i = HTML.indexOf('setInterval(()=>{ if(choreoActive && choreoStartedAt'); return i < 0 ? null : HTML.slice(i, HTML.indexOf('}, 1500);', i) + 9); })();
  function actorSandbox(o) {
    o = o || {};
    let now = 1000; const warns = [], logs = [], floats = [], sfx = [], fetched = [], blobFile = new WeakMap(), decodes = [];
    const g2d = () => new Proxy({}, { get: (t, k) => (k in t ? t[k] : (k === 'getImageData' || k === 'createImageData') ? (x, y, w, h) => ({ data: new Uint8ClampedArray(Math.max(1, (w | 0) * (h | 0)) * 4), width: w, height: h })
      : k === 'measureText' ? () => ({ width: 0 }) : (k === 'createRadialGradient' || k === 'createLinearGradient') ? () => ({ addColorStop() {} }) : k === 'canvas' ? {} : () => {}), set: (t, k, v) => { t[k] = v; return true; } });
    const canvas = () => { const c = { width: 1, height: 1, style: {}, getContext: () => (c.__g = c.__g || g2d()), getBoundingClientRect: () => ({ left: 0, top: 0, width: 355, height: 420, right: 355, bottom: 420 }) }; return c; };
    const cellRect = (seat, i) => ({ left: 20 + i * 62, top: seat === 0 ? 270 : 70, width: 56, height: 80, right: 76 + i * 62, bottom: (seat === 0 ? 270 : 70) + 80 });
    const cellsOf = (seat) => { const pl = ctx.G.players[seat]; return (pl.units || []).concat(pl.heroes || []).map((c, i) => ({ uid: c.uid, getBoundingClientRect: () => cellRect(seat, i) })); };
    const field = Object.assign(canvas(), { clientWidth: 355, clientHeight: 420, querySelector: (sel) => { const m = /data-uid="([^"]+)"/.exec(sel); if (!m) return null; for (const s of [0, 1]) { const c = cellsOf(s).find((x) => String(x.uid) === m[1]); if (c) return c; } return null; } });
    const els = { field, actorunder: canvas(), actorcanvas: canvas(), actorgpu: canvas(), actorover: canvas(), effectclip: canvas() };
    const abs = (u) => new URL(u, 'https://game.test/index.html');
    const ctx = {
      console: { log: (...a) => logs.push(a.join(' ')), warn: (...a) => warns.push(a.join(' ')), error: (...a) => warns.push(a.join(' ')) },
      location: { href: 'https://game.test/index.html' }, URL, Blob, Promise, Math, JSON, Object, Array, Date, String, Number, Error, Map, Set, WeakMap, Uint8ClampedArray, Float32Array, Int32Array, Uint8Array, Uint16Array, Symbol, Proxy, Reflect, isFinite, isNaN, parseInt, parseFloat, setTimeout, clearTimeout,
      performance: { now: () => now }, devicePixelRatio: 2,
      requestAnimationFrame: (f) => { setImmediate(() => { now += 16; f(now); }); return 1; }, cancelAnimationFrame: () => {},
      fetch: (u) => { const rel = decodeURIComponent(abs(u).pathname).replace(/^\//, ''); fetched.push(rel);
        if (o.noActors && /registry\.json$/.test(rel)) { const j = JSON.parse(fs.readFileSync(path.join(GAME, rel), 'utf8')); delete j.actors; return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(j) }); }
        if (o.missing && o.missing(rel)) return Promise.resolve({ ok: false, status: 404 });
        const p = path.join(GAME, rel); if (!fs.existsSync(p)) return Promise.resolve({ ok: false, status: 404 });
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(fs.readFileSync(p, 'utf8'))), blob: () => { const b = new Blob([fs.readFileSync(p)]); blobFile.set(b, p); return Promise.resolve(b); } }); },
      createImageBitmap: (b) => { decodes.push(now); if (o.decodeFails) return Promise.reject(new Error('decode refused')); if (o.decodeHangs) return new Promise(() => {});
        const px = webpSize(fs.readFileSync(blobFile.get(b))); return Promise.resolve({ width: px.w, height: px.h, close() {} }); },
      Image: function () { const im = this; setTimeout(() => { if (im.onerror) im.onerror(); }, 0); },
      document: { createElement: () => canvas(), querySelector: (sel) => { const seat = /opp/.test(sel) ? 1 : 0; return { querySelectorAll: () => cellsOf(seat) }; } },
      $: (id) => els[id] || null, EffectClip: EC, BLog: { fx: null }, Q: { effPower: E.effPower }, ME: 0,
      G: { players: [{ hand: [] }, { hand: [] }] }, choreoForce: [],
      posOf: () => null, halfSel: (s) => s ? '.half.opp' : '.half.me', ownerPiOfUid: () => 0, reducedMotion: () => !!o.reduced, vfxT: () => o.vfxT || 1.3,
      floatText: (n, d) => floats.push({ uid: n.uid, delta: d, at: now }), Audio2: { sfx: (k) => sfx.push({ k, at: now }) }, VFX: { cardLand() {} },
    };
    ctx.window = ctx; vm.createContext(ctx);
    for (const n of MODS) vm.runInContext(modSrc(n), ctx, { filename: n + '.js' });
    vm.runInContext(WD + '\n', ctx);
    vm.runInContext(GLUE + '\n;globalThis.__mf = { MF, mfBoot, mfManifest, mfPrefetch, mfPrefetchHands, mfReady, mfRouted, mfSnap, mfStage, get budget(){ return choreoBudgetMs; } };', ctx);
    return { ctx, mf: ctx.__mf, warns, logs, floats, sfx, fetched, decodes, get now() { return now; } };
  }
  // a real play of each Hero through the engine: two friendly Units down, then the Hero
  function heroPlay(id) {
    const d = DEFS.find((c) => c.id === id), opp = d.fac === 'asuras' ? 'devas' : 'asuras';
    const units = (f) => E.DECKS[f].filter((c) => c.t === 'unit' && !c.wave).slice(0, 9).map((c) => c.n);
    for (let seed = 1; seed < 400; seed++) {
      let x = seed; const rng = () => { x = (x * 1103515245 + 12345) % 2147483648; return x / 2147483648; };
      const mine = [d.n].concat(units(d.fac)), theirs = units(opp).concat([E.DECKS[opp].find((c) => c.t === 'unit' && !c.wave && units(opp).indexOf(c.n) < 0).n]);
      const g = E.newGame({ rng, realm: 'mrityulok', wave1: true, p0Faction: d.fac, p1Faction: opp, scenario: { p0Deck: mine, p1Deck: theirs, p0Hand: mine, p1Hand: theirs, mulligan: 0 } });
      let guard = 0;
      while (!g.over && guard++ < 12 && !(g.turn === 0 && g.players[0].units.length >= 2)) {
        const s = g.turn, pl = g.players[s], pi = E.playableIndices(g, s).filter((i) => pl.hand[i].t === 'unit'); if (!pi.length) break; E.playCard(g, s, pi[0]);
      }
      if (g.turn !== 0 || g.players[0].units.length < 2) continue;
      const h = g.players[0].hand.findIndex((c) => c.id === id); if (E.playableIndices(g, 0).indexOf(h) < 0) continue;
      return { g, h, rarity: d.r };
    }
    return null;
  }
  async function manifest(S, id, opt) {
    opt = opt || {};
    const P = opt.play || heroPlay(id); if (!P) return { err: 'no board' };
    const { g, h } = P; S.ctx.G = g;
    await S.mf.mfBoot(); if (!opt.noPrefetch) { await S.mf.mfPrefetch(id); }
    S.mf.MF.before = S.mf.mfSnap(g);
    const e0 = g.events.length; E.playCard(g, 0, h); const evs = g.events.slice(e0), ev = evs[0];
    const c = g.players[0].heroes.find((x) => x.uid === ev.sourceUid);
    const tier = opt.tier || ((P.rarity === 'L' || P.rarity === 'M') ? 'spectacle' : 'combat');
    const f0 = S.floats.length, s0 = S.sfx.length, t0 = S.now;
    const r = await S.mf.mfManifest(c, ev, evs, tier);
    const L = S.mf.MF.last, plan = L && L.card === id ? L.plan : null, before = S.mf.MF.before, after = S.mf.mfSnap(g);
    return { r, plan, before, after, ms: L && L.ms, t0: L && L.t0, evs, tier, floats: S.floats.slice(f0), sfx: S.sfx.slice(s0), decoded: S.mf.mfStage && S.mf.MF.stage ? S.mf.MF.stage.decodedBytes() : 0, budget: S.mf.budget, g, c, ranFrom: t0 };
  }

  // H3 · assets
  {
    const S = actorSandbox(); const AM = S.ctx.ActorManifest, rows = [], bad = [];
    for (const id of HEROES) {
      const dir = path.join(MAN, 'actors', id), files = fs.existsSync(dir) ? fs.readdirSync(dir).sort() : [];
      let m = null; try { m = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8')); } catch (e) { bad.push(id + ': no manifest'); continue; }
      const v = AM.validate(m); if (!v.ok) bad.push(id + ': ' + v.errors.join('; '));
      const r = AM.forRung(m, 256), ap = path.join(dir, r.atlas), px = fs.existsSync(ap) ? webpSize(fs.readFileSync(ap)) : null;
      if (J(files) !== J(['atlas_256.webp', 'manifest.json'])) bad.push(id + ': files ' + J(files));
      if (r.rung !== 256 || !px || px.w !== r.atlasSize.w || px.h !== r.atlasSize.h) bad.push(id + ': rung-256 atlas ' + J(px) + ' vs ' + J(r.atlasSize));
      rows.push({ id, bytes: fs.existsSync(ap) ? fs.statSync(ap).size : 0, decoded: AM.decodedBytes(r) });
    }
    const ffx = JSON.parse(fs.readFileSync(path.join(MAN, REG.factionFx), 'utf8'));
    const extra = ALLFILES.filter((f) => !/^effects\//.test(f) && !/^actors\/[a-z]+\/(manifest\.json|atlas_256\.webp)$/.test(f) && f !== 'registry.json' && f !== REG.factionFx);
    const mb = rows.reduce((a, r) => a + r.bytes, 0) / 1048576, peak = Math.max(...rows.map((r) => r.decoded)) / 1048576;
    ok('H3 · EVERY ACTOR SHIPS AT THE 256 RUNG ONLY — each folder holds exactly its manifest and atlas_256.webp (no 512 atlas), each manifest validates under the page\'s ActorManifest and its 256 atlas decodes to the size the rung records; factionfx.json is the certified one (sha256 pinned); nothing else in assets/manifest (' + rows.length + ' actors, ' + mb.toFixed(2) + ' MB compressed, the largest decodes to ' + peak.toFixed(2) + ' MB)',
       bad.length === 0 && rows.length === 20 && extra.length === 0 && sha(fs.readFileSync(path.join(MAN, REG.factionFx))) === PIN.factionFx && ['devas', 'asuras', 'vanaras', 'nagas'].every((f) => JSON.stringify(ffx).indexOf(f) >= 0), J({ bad, extra }));
  }

  // H4–H9 · every Hero, manifested through the shipped glue on the fake clock
  const S = actorSandbox(), RUN = {};
  for (const id of HEROES) RUN[id] = await manifest(S, id);
  const MFS = (id) => S.mf.MF.specs[id];
  const noPlay = HEROES.filter((id) => RUN[id].err);
  ok('H4 · A REAL PLAY OF EACH OF THE TWENTY, through the engine and the shipped glue: every one manifests (mfManifest resolves true) and runs its plan\'s length on the page clock — ' + HEROES.map((id) => id + ' ' + (RUN[id].plan ? Math.round(RUN[id].plan.total) : '?')).join(', ') + ' ms',
     noPlay.length === 0 && HEROES.every((id) => RUN[id].r === true && RUN[id].plan && Math.abs(RUN[id].ms - RUN[id].plan.total) <= 48), J(HEROES.map((id) => [id, RUN[id].err || RUN[id].r, RUN[id].plan && RUN[id].plan.total, RUN[id].ms])) + ' ' + J(S.mf.MF.diag));
  const cdiag = HEROES.map((id) => { const p = RUN[id].plan, cc = p && p.cues.find((c) => c.cue === 'contact'), m = MFS(id); return { id, cell: cc && cc.contactCell, want: m && m.contact, at: cc && cc.t, mode: p && p.mode }; });
  ok('H5 · THE CONTACT LANDS ON EACH ACTOR\'S CONTACT CELL: every plan\'s contact cue carries the manifest\'s own contact cell, and the plan is the Full one (mode full, prior 0 — AWAKEN, EMERGE, ACT, SETTLE, a native exit)',
     cdiag.every((d) => d.cell != null && d.cell === d.want) && HEROES.every((id) => { const p = RUN[id].plan, ph = p.cues.filter((c) => c.cue === 'actor-phase').map((c) => c.phase); return ph.indexOf('emerge') >= 0 && ph.indexOf('act') >= 0 && !p.cues.some((c) => c.cue === 'queue'); }), J(cdiag));
  const snd = HEROES.map((id) => { const R = RUN[id], cc = R.plan.cues.find((c) => c.cue === 'contact'); return { id, tier: R.tier, booms: R.sfx.filter((x) => x.k === 'boom').map((x) => Math.round(x.at - R.t0 - cc.t)), other: R.sfx.filter((x) => x.k !== 'boom').length }; });
  ok('H6 · SOUNDS (ruling 5): a Legendary Hero\'s spectacle boom fires ONCE, on the frame its contact cell is drawn (' + snd.filter((x) => x.tier === 'spectacle').map((x) => x.id + ' +' + x.booms[0]).join(', ') + ' ms after the contact cue); an Epic Hero\'s manifestation makes no sound; native exits are silent',
     snd.every((x) => x.other === 0 && (x.tier === 'spectacle' ? x.booms.length === 1 && x.booms[0] >= 0 && x.booms[0] <= 48 : x.booms.length === 0)) && snd.filter((x) => x.tier === 'spectacle').length >= 10, J(snd));
  const mem = HEROES.map((id) => RUN[id].decoded), peakAll = S.mf.MF.stage.stats ? S.mf.MF.stage.stats().peakDecoded : S.mf.MF.stage.stat.peakDecoded;
  const bigOne = Math.max(...HEROES.map((id) => S.ctx.ActorManifest.decodedBytes(S.ctx.ActorManifest.forRung(MFS(id), 256))));
  ok('H7 · ONE ACTOR DECODED AT A TIME (A5): after each manifestation the stage holds 0 bytes, and across all twenty the most ever held at once is one actor (' + (peakAll / 1048576).toFixed(2) + ' MB peak = the largest single actor)',
     mem.every((b) => b === 0) && peakAll === bigOne && Object.keys(S.mf.MF.art).length === 0, J({ mem, peakAll, bigOne }));
  // GL-4 · Indra's aura: +1 on every friendly Unit, carried by no event, floats at SETTLE
  {
    // the split, per Unit: what the SETTLE float lands + what the batch's later events carry = the Unit's whole change of power
    const effOf = (snap, uid) => { for (const st of snap.seats) for (const u of st.units.concat(st.heroes)) if (u && String(u.uid) === String(uid)) return u.eff; return null; };
    const split = (Rr) => { const rows = [], all = new Set(); Rr.after.seats.forEach((st) => st.units.forEach((u) => all.add(String(u.uid))));
      for (const uid of all) { const b0 = effOf(Rr.before, uid), a0 = effOf(Rr.after, uid); if (b0 == null || a0 == null) continue;
        const evs = Rr.evs.slice(1).filter((e) => (e.targetUids || []).some((t) => String(t) === uid)), odd = evs.some((e) => e.type !== 'damage' && e.type !== 'buff'); if (odd) continue;
        const carried = evs.reduce((a, e) => a + (e.type === 'damage' ? -Math.abs(e.amount || 0) : Math.abs(e.amount || 0)), 0), fl = Rr.floats.filter((f) => String(f.uid) === uid).reduce((a, f) => a + f.delta, 0);
        rows.push({ uid, net: a0 - b0, carried, floated: fl, ok: fl + carried === a0 - b0 }); } return rows; };
    const R = RUN.indra, g = R.g, units = g.players[0].units.filter((u) => !u.ghost).map((u) => String(u.uid)), settle = R.plan.cues.find((c) => c.cue === 'settle');
    const sp = split(R), fl = R.floats.map((f) => [String(f.uid), f.delta, Math.round(f.at - R.t0)]);
    ok('H8 · GL-4 — INDRA\'S AURA FLOATS, on a real board: his play carries no event for the +1 his aura gives each friendly Unit, so at SETTLE (' + Math.round(settle.t) + ' ms) the board difference lands +1 on each (' + fl.map((x) => '+' + x[1]).join(' ') + ') and nothing on Indra; the batch\'s later events (here Kumbhakarna waking: ' + sp.map((x) => x.carried).join(', ') + ') are left to the game\'s own loop — float + carried = each Unit\'s whole change (' + sp.map((x) => x.floated + '+(' + x.carried + ')=' + x.net).join(', ') + ')',
       units.length >= 2 && units.every((u) => fl.some((x) => x[0] === u && x[1] === 1)) && fl.every((x) => x[2] >= Math.round(settle.t) - 1) && !fl.some((x) => x[0] === String(R.c.uid)) && sp.length >= 2 && sp.every((x) => x.ok), J({ fl, sp, evs: R.evs.map((e) => [e.type, e.targetUids, e.amount, e.abilityName]) }));
    const law = HEROES.map((id) => ({ id, rows: split(RUN[id]) })), broken = law.filter((x) => x.rows.some((r) => !r.ok));
    ok('H9 · THE LAW OVER ALL TWENTY: for every Unit a play changes, the SETTLE float plus what the batch\'s later events carry equals its whole change of power — nothing landed twice, nothing lost (' + law.reduce((a, x) => a + x.rows.length, 0) + ' Units checked, ' + law.reduce((a, x) => a + x.rows.filter((r) => r.floated).length, 0) + ' floated)',
       broken.length === 0 && law.reduce((a, x) => a + x.rows.length, 0) >= 20, J(broken));
  }
  // ONE SPEED EVERYWHERE — the player's speed does not reach an actor
  {
    const body = fnBody('mfManifest');
    const Sf = actorSandbox({ vfxT: 0.6 * 1.3 }), Sr = actorSandbox({ vfxT: 1.5 * 1.3 });
    const a = await manifest(Sf, 'vasuki'), b = await manifest(Sr, 'vasuki');
    ok('H10 · ONE SPEED EVERYWHERE (ruling 1 as amended): the manifestation asks the Director for mode \'full\' with prior 0 and never reads the speed setting (no vfxT, speedMult or cDelay in mfManifest) — Vasuki runs ' + Math.round(a.plan.total) + ' ms at Fast and ' + Math.round(b.plan.total) + ' ms at Relaxed',
       /mode:'full', prior:0/.test(body) && !/vfxT|speedMult|cDelay|CHOREO_SPEED/.test(body) && a.r && b.r && a.plan.total === b.plan.total && a.plan.total === RUN.vasuki.plan.total);
  }
  // THE WATCHDOG — plan-aware, falsifiably
  {
    const vas = RUN.vasuki.plan.total;
    const trial = (src, budgetOf, elapsed) => { let ff = 0; const c = { performance: { now: () => 1000 + elapsed }, fastForwardChoreo: () => { ff++; }, setTimeout: () => {}, render() {}, pump() {}, $: () => null, Math, Number };
      let tick = null; c.setInterval = (f) => { tick = f; }; vm.createContext(c);
      vm.runInContext(WD + '\n' + src + '\n;var choreoActive=true, choreoStartedAt=1000; choreoBudgetMs=(' + budgetOf + ')(choreoBudgetFor);', c); tick(); return ff; };
    const flat = WD_TICK.replace('>choreoBudgetMs)', '>CHOREO_WATCHDOG_MS)');
    const r = { shipped: trial(WD_TICK, 'f=>f(' + vas + ')', vas + 50), doctored: trial(flat, 'f=>f(' + vas + ')', vas + 50),
                stuckActor: trial(WD_TICK, 'f=>f(' + vas + ')', vas + 2100), stuckStep: trial(WD_TICK, 'f=>' + 8000, 8100), liveStep: trial(WD_TICK, 'f=>8000', 7000) };
    ok('H11 · THE PLAN-AWARE WATCHDOG (built first): Vasuki\'s Full plan is ' + Math.round(vas) + ' ms — past the old flat 8,000 ms cap — and the shipped watchdog gives his step ' + (Math.round(vas) + 2000) + ' ms, so at ' + (Math.round(vas) + 50) + ' ms it lets him finish; the SAME tick doctored to the flat cap trips on him (falsifiable); a manifestation stuck past plan + margin, and an ordinary step stuck past 8 s, still trip',
       vas > 8000 && RUN.vasuki.budget === Math.max(8000, Math.ceil(vas) + 2000) && r.shipped === 0 && r.doctored === 1 && r.stuckActor === 1 && r.stuckStep === 1 && r.liveStep === 0 && flat !== WD_TICK, J(r));
    ok('H12 · the budget belongs to ONE step: runAction\'s loop, both choreography starts and resetChoreo put it back to 8,000 ms, and only mfManifest raises it (to its own plan)',
       /for \(const ev of evs\)\{ if\(choreoSkip\) break; choreoStartedAt=performance\.now\(\); choreoBudgetMs=CHOREO_WATCHDOG_MS;/.test(HTML) && (HTML.match(/choreoActive=true; choreoSkip=false; choreoStartedAt=performance\.now\(\); choreoBudgetMs=CHOREO_WATCHDOG_MS;/g) || []).length === 2 &&
       /function resetChoreo\(\)\{[^\n]*choreoBudgetMs=CHOREO_WATCHDOG_MS;/.test(HTML) && (HTML.match(/choreoBudgetMs = choreoBudgetFor\(/g) || []).length === 1 && /choreoBudgetMs = choreoBudgetFor\(plan\.total\)/.test(fnBody('mfManifest')));
  }
  // FAIL-OPEN — every failure hands the Hero back to today's path
  {
    const hook = "    if(isBody && src && c && c.t==='hero' && mfRouted(c.id)){ if(await mfManifest(c, ev, evs, tier)) return; }";
    const lines = HTML.split('\n'), hi = lines.findIndex((l) => l.indexOf(hook) === 0);
    ok('H13 · THE HOOK: a routed Hero\'s play beat asks for its manifestation and RETURNS only when it played; on false the very next lines are today\'s path (the painted-sprite landing, the tier hit-stop/hold), untouched',
       hi > 0 && /^    \/\/ T67 painted sprite layer/.test(lines[hi + 1]) && (HTML.match(/await mfManifest\(/g) || []).length === 1);
    const within = (p) => Promise.race([p, new Promise((r) => setTimeout(() => r({ hung: true }), 4000))]);   // a hand-back that waits forever is a failure, not a hang
    const S1 = actorSandbox(); const a = await within(manifest(S1, 'garuda', { noPrefetch: true }));
    const S2 = actorSandbox({ decodeFails: true }); const b = await within(manifest(S2, 'rahu'));
    const S3 = actorSandbox({ decodeHangs: true }); const c = await within(manifest(S3, 'indra'));
    const S4 = actorSandbox({ noActors: true }); await S4.mf.mfBoot(); const d = await within(manifest(S4, 'indra'));
    const S5 = actorSandbox({ reduced: true }); const e = await within(manifest(S5, 'indra'));
    const S6 = actorSandbox({ missing: (rel) => /actors\/vasuki\/manifest\.json$/.test(rel) }); const f = await within(manifest(S6, 'vasuki'));
    const kinds = (Sx) => Sx.mf.MF.diag.map((q) => q.kind);
    ok('H14 · FAIL-OPEN = TODAY\'S PATH (ruling 7): NOT READY at the play (bytes never prefetched) → false at once, noted not-ready-at-play; the atlas REFUSES to decode → false after EMERGE (decode-failed, fell-back), nothing left decoded; a decode that NEVER SETTLES → false at EMERGE, the beat never waits on it; NO ACTORS in the registry, REDUCED MOTION, or a MISSING manifest → false — every one hands the Hero back to the classic landing',
       a.r === false && kinds(S1).indexOf('not-ready-at-play') >= 0 && S1.decodes.length === 0 &&
       b.r === false && kinds(S2).indexOf('decode-failed') >= 0 && kinds(S2).indexOf('fell-back') >= 0 && (S2.mf.MF.stage ? S2.mf.MF.stage.decodedBytes() : 0) === 0 &&
       !c.hung && c.r === false && kinds(S3).indexOf('fell-back') >= 0 &&
       d.r === false && S4.mf.MF.reg === null && S4.mf.mfRouted('indra') === false && S4.mf.MF.diag.length === 0 &&
       e.r === false && S5.decodes.length === 0 && f.r === false && kinds(S6).indexOf('spec-failed') >= 0,
       J([a, b, c, d, e, f].map((x) => x.hung ? 'HUNG' : x.r)));
    ok('H15 · the actor diagnostics are quiet: console.warn and BLog.fx (layer \'actor\') only — no console.log, no narrated line, no banner — across every sandbox above',
       [S, S1, S2, S3, S4, S5, S6].every((Sx) => Sx.logs.length === 0) && S2.ctx.BLog.fx && S2.ctx.BLog.fx.every((q) => q.layer === 'actor') && !/BLog\.lines\.push|console\.log\(/.test(between('/* ══ EXPORT-2 — THE HERO MANIFESTATIONS', 'function runAction(')));
  }
  // EVERY OTHER CARD IS UNTOUCHED, and the prefetch takes compressed bytes only
  {
    const notRouted = DEFS.filter((c) => c.t !== 'hero').map((c) => c.id).filter((id) => S.mf.mfRouted(id));
    ok('H16 · ONLY HEROES ROUTE: of the ' + DEFS.length + ' cards the engine has, mfRouted is true for exactly the twenty Heroes — every Unit (Meghnad included), Astra, Mantra and Artifact plays today\'s path (' + notRouted.length + ' non-Heroes routed)',
       notRouted.length === 0 && HEROES.every((id) => S.mf.mfRouted(id)));
    const Sp = actorSandbox(); await Sp.mf.mfBoot(); const P = heroPlay('hanuman'); Sp.ctx.G = P.g; Sp.fetched.length = 0;
    Sp.mf.mfPrefetchHands(); await flush(); await flush(); await flush();
    const got = Sp.fetched.filter((f) => /^assets\/manifest\/actors\//.test(f));
    ok('H17 · HAND-ENTRY PREFETCH: a routed Hero in a hand fetches its manifest and its 256 atlas as COMPRESSED BYTES — no decode until the play (' + J(got) + ', ' + Sp.decodes.length + ' decodes)',
       J(got) === J(['assets/manifest/actors/hanuman/manifest.json', 'assets/manifest/actors/hanuman/atlas_256.webp']) && Sp.decodes.length === 0 && Sp.mf.mfReady('hanuman'));
    ok('H18 · THE STAGE: three canvases in the field at z8–10 (below the choreography lock at z64, above the effect clip at z6 and the flash at z7), Canvas 2D — the stage never asks for a second GPU context (no useBackend in the glue)',
       /<canvas id="effectclip"><\/canvas>\n    <canvas id="actorunder"><\/canvas>\n    <canvas id="actorcanvas"><\/canvas>\n    <canvas id="actorgpu"><\/canvas>\n    <canvas id="actorover"><\/canvas>/.test(HTML) &&
       /#actorunder\{ position:absolute; inset:0; z-index:8;/.test(HTML) && /#actorcanvas, #actorgpu\{ position:absolute; inset:0; z-index:9;/.test(HTML) && /#actorover\{ position:absolute; inset:0; z-index:10;/.test(HTML) &&
       !/useBackend|pickBackend/.test(between('/* ══ EXPORT-2 — THE HERO MANIFESTATIONS', 'function runAction(')) && S.mf.MF.stage.backend === 'canvas2d');
    ok('H19 · A SKIP LANDS IT: resetChoreo and the choreography fast-forward stand a running manifestation down (mfSkip, and its runner.skip in choreoForce)',
       /function resetChoreo\(\)\{ try\{ fxSkip\(\); \}catch\(e\)\{\} try\{ mfSkip\(\); \}catch\(e\)\{\}/.test(HTML) && /choreoForce\.push\(\(\)=>\{ if\(!runner\.done\) runner\.skip\(\); \}\);/.test(fnBody('mfManifest')));
  }

  // ═══ W · THE WIRE ═══
  console.log('\n── W · the wire ──');
  const types = [...new Set([...HTML.matchAll(/wireSend\(\{\s*type:\s*'([a-z_]+)'/g)].map((m) => m[1]))].sort();
  ok('W1 · NO NEW WIRE MESSAGE: the page still sends exactly ' + J(types) + ' — an effect is local presentation on both frames, the server never learns of it', J(types) === J(PIN.wireTypes));
  ok('W2 · the glue sends nothing and reads no seat but the cast\'s own (no wireSend, no Wire state in the effect code)', !/wireSend|Wire\./.test(GLUE));

  // ═══ P · PINS ═══
  console.log('\n── P · the pins ──');
  const engInline = between('<!-- ENGINE:START', '<!-- ENGINE:END');
  ok('P1 · src/engine.js is byte-identical to the pre-export game (sha256 ' + PIN.engineJs.slice(0, 12) + '…), and so is the engine inlined in index.html',
     sha(fs.readFileSync(path.join(GAME, 'src', 'engine.js'))) === PIN.engineJs && engInline && sha(engInline) === PIN.inlinedEngine);
  ok('P2 · BRAHMASTRA\'S CLASSIC SPRITE IS ITS FALLBACK (EXPORT-3 reverses the pin): sprBrahmastra itself is byte-identical to the pre-export game, and its one call site is the gated line R5 checks', sha(fnBody('sprBrahmastra')) === PIN.sprBrahmastra && (HTML.match(/VFX\.sprBrahmastra\(/g) || []).length === 1);
  ok('P3 · MEGHNAD PINNED: his presentation is the Unit landing path, byte-identical to the pre-export game, and nothing in the export names him', sha(lineOf('} else VFX.sprLanding(fac,')) === PIN.unitLanding && !/meghnad/i.test(GLUE));
  ok('P4 · the inlined effect player is the exported module, verbatim (sha256 ' + PIN.effectPlayer.slice(0, 12) + '…)', PLAYER_SRC && sha(PLAYER_SRC) === PIN.effectPlayer);
  ok('P5 · the page carries no console.log', !/console\.log\(/.test(HTML));

  console.log('\n' + (fail === 0 ? '✓ ALL ' + pass + ' EFFECT-EXPORT CHECKS PASS' : '✖ ' + fail + ' FAILURES / ' + pass + ' passed'));
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.log('✖ THE SUITE THREW: ' + (e && e.stack || e)); process.exit(1); });
