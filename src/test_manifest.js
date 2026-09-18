#!/usr/bin/env node
'use strict';
// src/test_manifest.js — EXPORT-1: the premium effects in the live game (Vajra, Sudarshana Chakra, Pashupatastra).
//
//   node src/test_manifest.js
//
// What it proves, from the SHIPPED files (index.html, assets/manifest/, src/engine.js) — never a copy of them:
//   R · ROUTING       registry.json routes exactly the three effects; Brahmastra and Meghnad are absent and pinned
//   A · ASSETS        every routed manifest validates under the page's own player, atlases match their manifests, E1 holds
//   T · TIMING        the clip's impact lands on the game's OWN resolution cue at every speed, read from the beat code's
//                     own constants; no wire-clock cost
//   F · FAIL-OPEN     the shipped glue, run on a fake clock: the beats never wait, a clip that is not ready or fails at its
//                     moment hands the moment back to the classic sprite, a registry that cannot load plays every sprite
//   W · THE WIRE      no new wire message types
//   P · PINS          src/engine.js and the inlined engine unchanged; Brahmastra's sprite path and the Unit landing path
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
  brahmastraCall: '25c906ac0758cee2cc0f5bf852bcaa25e52e3d19eea0807288a788f3f9d9846b',
  sprBrahmastra: 'ca7898c5da25a7ec39b5beb28fb5196e14f111a5d69b3b812f03b41bca80166a',
  unitLanding: 'cd4ed62d5f7b67d61599a5f7d6e67c0ab9606adea88bc08d3bf5a6636e813011',
  effectPlayer: '30219bcb370e74dcf75dfeb01b0ac2932376a91c7d4c69fc127bb650b5b27f6c',
  wireTypes: ['leap', 'mulligan', 'pass', 'play', 'shield'],
};
const ROUTED = ['pashupata', 'sudarshana', 'vajra'];
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
  ok('R1 · exactly three routes — Vajra, Sudarshana Chakra, Pashupatastra (' + J(Object.keys(routes).sort()) + ')', J(Object.keys(routes).sort()) === J(ROUTED));
  ok('R2 · each route names the classic sprite it replaces and the beat it owns: vajra → sprVajra at the destroy, sudarshana → sprSudarshana at the passive (the bite), pashupata → sprPashupatastra at the play (the cast)',
     routes.vajra && routes.vajra.replaces === 'sprVajra' && routes.vajra.moment === 'destroy' && routes.sudarshana && routes.sudarshana.replaces === 'sprSudarshana' && routes.sudarshana.moment === 'passive' &&
     routes.pashupata && routes.pashupata.replaces === 'sprPashupatastra' && routes.pashupata.moment === 'play', J(routes));
  ok('R3 · BRAHMASTRA AND MEGHNAD ARE NOT ROUTED — both are listed as pinned, and neither has an effect folder shipped',
     !routes.brahmastra && !routes.meghnad && REG.pinned && REG.pinned.brahmastra && REG.pinned.meghnad &&
     !fs.existsSync(path.join(MAN, 'effects', 'brahmastra')) && !fs.existsSync(path.join(MAN, 'effects', 'meghnad')));
  const castHook = "    if(isAstra && c) fxCast(c, ev, evs, snap);", bLine = lineOf("if(isAstra && c && c.id==='brahmastra')");
  const lines = HTML.split('\n'), hi = lines.findIndex((l) => l.indexOf(castHook) === 0);
  ok('R4 · the cast hook starts a routed clip on the Astra\'s play beat, on the line immediately above the untouched Brahmastra line',
     hi >= 0 && lines[hi + 1] === bLine && sha(bLine) === PIN.brahmastraCall);
  const gates = { pashupata: /if\(!fxOwnsMoment\('pashupata', fire\)\) fire\(\);/.test(HTML), vajra: /if\(ev\.abilityName==='Vajra' && dp && !fxOwnsMoment\('vajra'\)\) VFX\.sprVajra\(/.test(HTML),
                  sudarshana: /if\(!fxOwnsMoment\('sudarshana'\)\) VFX\.sprSudarshana\(/.test(HTML) };
  const bare = { vajra: (HTML.match(/VFX\.sprVajra\(/g) || []).length, sudarshana: (HTML.match(/VFX\.sprSudarshana\(/g) || []).length };
  ok('R5 · each routed card\'s classic sprite is still called at its own moment, behind the clip\'s ownership test — and only there (sprVajra ' + bare.vajra + ' call site, sprSudarshana ' + bare.sudarshana + ')',
     Object.values(gates).every(Boolean) && bare.vajra === 1 && bare.sudarshana === 1, J({ gates, bare }));
  ok('R6 · skipping the choreography (tap, backgrounding, the watchdog) and starting a new match both stand the clip down',
     /revealAllMaterializingHeroes\(\); \}catch\(e\)\{\} try\{ fxSkip\(\); \}catch\(e\)\{\} \}/.test(HTML) && /function resetChoreo\(\)\{ try\{ fxSkip\(\); \}catch\(e\)\{\}/.test(HTML));
  ok('R7 · the effect-clip canvas sits in the field at z6 with the flash moved to z7 (the GPU layer #vfxgpu shares z6; all below the choreography lock at z64)',
     /<canvas id="vfxcanvas"><\/canvas>\n    <canvas id="effectclip"><\/canvas>/.test(HTML) && /#effectclip\{ position:absolute; inset:0; z-index:6; pointer-events:none;/.test(HTML) && /#vfxflash\{ position:absolute; inset:0; z-index:7;/.test(HTML));
}

// ═══ A · ASSETS ═══
console.log('\n── A · the shipped assets validate under the page\'s own player ──');
const SPECS = {};
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
     rows.length === 4 && rows.every((r) => r.exists && r.px && r.px.w === r.want.w && r.px.h === r.want.h), J(rows));
  ok('A3 · E1: each clip decodes under the effect layer\'s cap of ' + (EC.E1.capBytes / 1048576).toFixed(2) + ' MB (' + rows.map((r) => r.clip + ' ' + (r.bytes / 1048576).toFixed(2)).join(', ') + ' MB) and the player holds one clip decoded at a time',
     rows.every((r) => r.bytes <= EC.E1.capBytes) && EC.E1.oneAtATime === true);
  const all = [], walk = (d) => fs.readdirSync(d).forEach((n) => { const q = path.join(d, n); if (fs.statSync(q).isDirectory()) walk(q); else all.push(path.relative(MAN, q)); });
  walk(MAN);
  ok('A4 · assets/manifest holds exactly the registry, the chain and the four clips (' + all.length + ' files, ' + (rows.reduce((a, r) => a + r.file, 0) / 1048576).toFixed(2) + ' MB of atlas)',
     J(all.sort()) === J(['effects/pashupata/atlas.webp', 'effects/pashupata/manifest.json', 'effects/sudarshana/chain.json', 'effects/sudarshana_invoke/atlas.webp', 'effects/sudarshana_invoke/manifest.json',
                          'effects/sudarshana_strike/atlas.webp', 'effects/sudarshana_strike/manifest.json', 'effects/vajra/atlas.webp', 'effects/vajra/manifest.json', 'registry.json']), J(all));
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
    const S2 = sandbox(); await S2.fx.fxBoot(); const r2 = S2.fx.fxCast(card('brahmastra'), castEv('vajra')[0], castEv('vajra'), {}), r3 = S2.fx.fxCast(card('meghnad'), castEv('vajra')[0], castEv('vajra'), {});
    ok('F7 · REDUCED MOTION plays no clip (the page\'s reduced path skips playEvent entirely; the glue refuses too), and an UNROUTED card — Brahmastra, Meghnad — returns at once with nothing noted: its presentation is exactly the old one',
       r1 === null && r2 === null && r3 === null && S2.fx.FX.diag.length === 0 && S.logs.length + S2.logs.length === 0); }
  // F8 · the diagnostics never narrate and never console.log
  const NARR = /BLog\.lines\.push/.test(GLUE), LOGS = /console\.log\(/.test(GLUE);
  ok('F8 · THE DIAGNOSTICS ARE QUIET: the glue writes the console (warn, never log) and the battle log\'s BLog.fx field — never a narrated line, never a banner', !NARR && !LOGS && /BLog\.fx=BLog\.fx\|\|\[\]/.test(GLUE));

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
  ok('P2 · BRAHMASTRA PINNED: its call site and sprBrahmastra itself are byte-identical to the pre-export game', sha(lineOf("if(isAstra && c && c.id==='brahmastra')")) === PIN.brahmastraCall && sha(fnBody('sprBrahmastra')) === PIN.sprBrahmastra);
  ok('P3 · MEGHNAD PINNED: his presentation is the Unit landing path, byte-identical to the pre-export game, and nothing in the export names him', sha(lineOf('} else VFX.sprLanding(fac,')) === PIN.unitLanding && !/meghnad/i.test(GLUE));
  ok('P4 · the inlined effect player is the exported module, verbatim (sha256 ' + PIN.effectPlayer.slice(0, 12) + '…)', PLAYER_SRC && sha(PLAYER_SRC) === PIN.effectPlayer);
  ok('P5 · the page carries no console.log', !/console\.log\(/.test(HTML));

  console.log('\n' + (fail === 0 ? '✓ ALL ' + pass + ' EFFECT-EXPORT CHECKS PASS' : '✖ ' + fail + ' FAILURES / ' + pass + ' passed'));
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.log('✖ THE SUITE THREW: ' + (e && e.stack || e)); process.exit(1); });
