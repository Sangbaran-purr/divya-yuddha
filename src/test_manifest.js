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
  effectPlayer: 'ad4f573c2e2f23bac1be225a42da34290f0de7b216861dba72e29f62c5bee8c7',   // EXPORT-7 (the LAB-25 player, verbatim): the afterglow role, the strike-afterglow chain and its timeline, the second-segment handoff, divider-flush halves; EXPORT-6 3b6efc548057…: the arming and empowered-drain moments, height-fit, bottom-flush halves, the ready-anchored rise; EXPORT-5 5d3ba4b04935…: the beat gate (hold · cap · beat()); EXPORT-4 0be2d7225a54…: the fitted law + the card floor; EXPORT-3 shipped 3a780fe5ec52…, EXPORT-1 30219bcb370e…
  wireTypes: ['leap', 'mulligan', 'pass', 'play', 'shield'],
  // EXPORT-2: the nine actor modules and the faction effects, as certified in the manifestation lab when the export was built
  // (recorded here, never read from the lab: nothing outside the lab may name it — its own rule G2)
  actorModules: {"boarddiff": "879fe41a315d53122fd1d9b03d7f47a5643f2e1c59e7a14bb7f9973d57957ede", "clashcontext": "eb87c50dc6cee9726445fa066aafc0a47ad3ca382cad20ba5c8cca185e6f6d94", "director": "7027e197441e3cc3b8cb9df104585eeb51300f761263b434a3403252961b51c0", "runner": "7a0b80b824ed294493d53360c2c1a93997068897394fd7b400bb5faa151ebc35", "manifest": "077314c6a55483546f06b08e83a453c174d5636366bb5079d981a2c8b3396408", "stagemath": "6deed7f01db143d210133a95b856981094e647b67d3cd9467f70506fa00b4979", "dissolve": "8e4efc39f2714ca917c8b8da5095d50c58b2237280c137b05ca63ffd53a59e59", "actorstage": "dec202561478b1046cfeebcf552d8d885912d6a4f1e74b112c3d14faad1f7241", "playback": "ba7fce765c96f70d9eda895dce27172f340fc9bcf1969ea3fdcf449325d55d5f"},
  factionFx: '7254d128bcec6c2d433281f4daa027d81b74b022dbe13fe81ba2be3efbf310dc',
  // EXPORT-5 · THE DESIGN FREEZE: one digest over every certified file in assets/manifest (73 files — every atlas, manifest, chain, the
  // registry and the faction effects), recorded at 03b1e45. Nothing a resilience rung does may move it
  certifiedAssets: 'e0e131e84c6bc96a95e9661983e376fbd8d2a96daa3dc5044b5ddaa6d6844f60',
  // EXPORT-6 · THE CERTIFIED SET EXTENDS 73 → 77 (owner ruling "Export Vasuki Venom in live game."): the four Vasuki Venom Strike pack files,
  // byte-identical to the LAB-24 certified packs (hashes recorded here, never read from the lab — G2); the original 73 stay proven by the digest above
  certifiedAssets77: '0458d8c9a47fbff23d9c705da4765de983135f15aa1a3308dc6fca2deb0e8e9e',
  vasukiPacks: { 'effects/venomstrike_rise/atlas.webp': '785162af06d4bcd84de61660ac8a14141db6ef074d063decd582f162597fc447', 'effects/venomstrike_rise/manifest.json': '4e6cd20451e4cfbd6febb284a38b35ce8753c47ec9840b8c00a57d1b9e5e127c',
                 'effects/venomstrike_flood/atlas.webp': '79f13107684a03a0c5154138ba2798c0e8ef875ff9ee8ed425fd999bf7502cac', 'effects/venomstrike_flood/manifest.json': 'e54b298bc8d0c0c75d140551302c606f73bb4e216006c5535848550b8de71928' },
  // EXPORT-7 · THE CERTIFIED SET EXTENDS 77 → 82 (owner rulings "Export." then "Go."): Lanka Dahan's chain and its two packs, byte-identical to the
  // LAB-25 certified packs (hashes recorded here, never read from the lab — G2); the 77 and the 73 stay proven by the digests above
  certifiedAssets82: '61464fbc935158c3261856fb62a185105fa82a32044f95b943b7c86a702d5cca',
  lankaPacks: { 'effects/lankadahan/chain.json': '3b5008108ab3dfb82998d330e5cf23b3830ad11c960faae21895cb978abf2a09',
                'effects/lankadahan_fire/manifest.json': '9b4f186f112e72fa9afd9466c935a525bfade4b7e225c2e1389f9f356219d267', 'effects/lankadahan_fire/atlas.webp': 'dbf204d87c2241b139943474f06ed5307849196a9a3a0e6242c3b3ddf1875f21',
                'effects/lankadahan_gold/manifest.json': 'dc843358b241d8cdb0c7ef0252cdd81c30a228040024f08d9ba9561bf0684c70', 'effects/lankadahan_gold/atlas.webp': '06a0a8e0cfc618142e096851e3fb1df935f44625cf8461dc26b618789ca1525a' },
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
  ok('R1 · exactly six routes — Vajra, Sudarshana Chakra, Pashupatastra, (EXPORT-3) Brahmastra, (EXPORT-6) Vasuki Venom Strike and (EXPORT-7) Lanka Dahan (' + J(Object.keys(routes).sort()) + ')', J(Object.keys(routes).sort()) === J(ROUTED.concat(['venomstrike', 'lankadahan']).sort()));
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
  ok('A4 · assets/manifest/effects holds exactly the two chains and the nine clips (' + fxFiles.length + ' files, ' + (rows.reduce((a, r) => a + r.file, 0) / 1048576).toFixed(2) + ' MB of atlas) — the actors (EXPORT-2) are inventoried in H3',
     J(fxFiles) === J(['effects/brahmastra/atlas.webp', 'effects/brahmastra/manifest.json', 'effects/lankadahan/chain.json', 'effects/lankadahan_fire/atlas.webp', 'effects/lankadahan_fire/manifest.json', 'effects/lankadahan_gold/atlas.webp', 'effects/lankadahan_gold/manifest.json', 'effects/pashupata/atlas.webp', 'effects/pashupata/manifest.json', 'effects/sudarshana/chain.json', 'effects/sudarshana_invoke/atlas.webp', 'effects/sudarshana_invoke/manifest.json',
                       'effects/sudarshana_strike/atlas.webp', 'effects/sudarshana_strike/manifest.json', 'effects/vajra/atlas.webp', 'effects/vajra/manifest.json',
                       'effects/venomstrike_flood/atlas.webp', 'effects/venomstrike_flood/manifest.json', 'effects/venomstrike_rise/atlas.webp', 'effects/venomstrike_rise/manifest.json']), J(fxFiles));   /* EXPORT-6: + Vasuki Venom Strike's rise and flood; EXPORT-7: + Lanka Dahan's chain, fire and gold */
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
  let now = 1000; const logs = [], warns = [], files = {}, fetched = [];
  const rect = { left: 0, top: 0, width: 355, height: 420, right: 355, bottom: 420 };
  const el = { getBoundingClientRect: () => rect, width: 0, height: 0, getContext: () => ({ setTransform() {}, clearRect() {}, drawImage() {}, globalCompositeOperation: 'source-over', globalAlpha: 1, getImageData: (x, y, w, h) => ({ data: new Uint8ClampedArray(4) }), putImageData() {} }) };
  const abs = (u) => new URL(u, 'https://game.test/index.html');
  const read = (u) => { const rel = decodeURIComponent(abs(u).pathname).replace(/^\//, ''); const p = path.join(GAME, rel); return fs.existsSync(p) ? p : null; };
  const ctx = {
    console: { log: (...a) => logs.push(a.join(' ')), warn: (...a) => warns.push(a.join(' ')), error: (...a) => warns.push(a.join(' ')) },
    location: { href: 'https://game.test/index.html' }, URL, Blob, Promise, Math, JSON, Object, Array, Date, String, Number, Error, setTimeout,
    performance: { now: () => now }, requestAnimationFrame: () => 1, devicePixelRatio: 2,
    fetch: (u) => { const rel0 = decodeURIComponent(abs(u).pathname).replace(/^\//, ''); fetched.push([rel0, now]);
      if (o.fetch404 || (o.fetchFail && o.fetchFail(rel0))) return Promise.resolve({ ok: false, status: 404 });
      const rel = abs(u).pathname; if (o.hold && o.hold(rel)) return new Promise(() => {});
      const p = read(u); if (!p) return Promise.resolve({ ok: false, status: 404 });
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(fs.readFileSync(p, 'utf8'))), blob: () => Promise.resolve(new Blob([fs.readFileSync(p)])) }); },
    createImageBitmap: (b) => (o.decodeFails === true || (typeof o.decodeFails === 'function' && o.decodeFails())) ? Promise.reject(new Error('decode refused')) : (o.decodeGate ? o.decodeGate.then(() => ({ width: 64, height: 32, close() {} })) : Promise.resolve({ width: 64, height: 32, close() {} })),
    Image: function () { const im = this; setTimeout(() => { if (im.onerror) im.onerror(); }, 0); },
    document: { createElement: () => el, querySelector: (sel) => o.halves && o.halves[sel] ? Object.assign({}, el, { getBoundingClientRect: () => o.halves[sel] }) : o.halfRect ? Object.assign({}, el, { getBoundingClientRect: () => o.halfRect }) : el },
    $: () => el, EffectClip: EC, G: { players: [{ hand: [] }, { hand: [] }] }, BLog: { fx: null },
    posOf: () => ({ cx: 120, top: 60, rect: { top: 40, height: 90, width: 64, left: 88 } }), halfSel: (s) => s ? '.half.opp' : '.half.me',
    ownerPiOfUid: (u) => (o.ownerPi ? o.ownerPi(u) : 0), reducedMotion: () => !!o.reduced, vfxT: () => 1.3, choreoSkip: false,
  };
  ctx.window = ctx; ctx.URL.createObjectURL = ctx.URL.createObjectURL || (() => 'blob:x'); ctx.URL.revokeObjectURL = ctx.URL.revokeObjectURL || (() => {});
  vm.createContext(ctx);
  vm.runInContext(GLUE + '\n;globalThis.__fx = { FX, fxBoot, fxPrefetch, fxPrefetchHands, fxReady, fxCast, fxOwnsMoment, fxOnError, fxSkip, fxClips, fxAtlasUrl, fxBeatFrom, fxLoadAtlas, ASSET_RETRY, fxRoute, VS, vsNoteCasts, vsStriker, vsDrainPick, fxVenomDrain, fxCastDrain, fxGlow, fxSeatFromTarget, fxChainLive, fxLankaBurn };', ctx);
  return { ctx, fx: ctx.__fx, logs, warns, fetched, advance: (ms) => { now += ms; }, get now() { return now; }, tick: (ms) => { now += ms; if (ctx.__fx.FX.player && ctx.__fx.FX.run) ctx.__fx.FX.player.frame(now); } };
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
       /return \{ cx:r\.left-f\.left\+r\.width\/2, cy:r\.top-f\.top\+r\.height\/2, top:r\.top-f\.top, w:r\.width, h:r\.height \}; \}/.test(GLUE) &&
       (r2 === null || !r2.places || r2.places[0] === null), J({ pl, place: seg && seg.place, r2: r2 && r2.places })); }
  // F11 · EXPORT-4: on a LANDSCAPE half (wide and short) both row weapons are fitted inside it, through the game's own halfOf — Pashupatastra now top-flush too
  { const S = sandbox({ halfRect: { left: 0, top: 0, width: 998, height: 230, right: 998, bottom: 230 } }); await S.fx.fxBoot();
    const got = {};
    for (const id of ['brahmastra', 'pashupata']) { await S.fx.fxPrefetch(id); await flush(); const r = S.fx.fxCast(card(id), castEv(id)[0], castEv(id), {}); const pl = r && r.places && r.places[0]; got[id] = pl ? { w: +pl.w.toFixed(1), h: +pl.h.toFixed(1), y: +pl.y.toFixed(2), place: r.plan.segments[0].place } : null; S.fx.fxSkip(); }
    const B = got.brahmastra, P = got.pashupata;
    ok('F11 · THE FITTED LAW ON A LANDSCAPE HALF (EXPORT-4 rulings 1 and 3): on the 998×230 half of a 1280×800 laptop the width fractions alone would hang Brahmastra 928 px wide and 522 px tall and Pashupatastra 1045×588 — both far taller than the half; fitted, each is exactly as tall as the half and inside it (Brahmastra ' + (B && B.w + '×' + B.h) + ', Pashupatastra ' + (P && P.w + '×' + P.h) + '), and BOTH hang top-flush ("' + (P && P.place) + '", top at ' + (P && P.y) + ' px) — the token top band\'s hard cut hides at the half boundary',
       !!B && !!P && Math.abs(B.h - 230) < 0.05 && Math.abs(P.h - 230) < 0.05 && B.w < 998 && P.w < 998 && Math.abs(B.y) < 0.01 && Math.abs(P.y) < 0.01 && P.place === 'enemy-half-top' && B.place === 'enemy-half-top', J(got)); }
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
  ok('H1 · THE ROUTING TABLE NAMES EXACTLY THE TWENTY HEROES — every Hero the engine has (launch and wave), each carrying both rungs [512, 256] (EXPORT-4) with a native exit, none an effect route, the rung rule 512 above 420 device px; Meghnad (a Unit) is not among them (' + Object.keys(ACT).length + ' actors)',
     J(Object.keys(ACT).sort()) === J(HEROES) && HEROES.length === 20 && REG.actorRungRule && REG.actorRungRule.drawnPxOver === 420 && HEROES.every((id) => J(ACT[id].rungs) === J([512, 256]) && ACT[id].exit === 'native' && ACT[id].manifest === 'actors/' + id + '/manifest.json' && !(REG.routes || {})[id]) &&
     !ACT.meghnad && DEFS.find((c) => c.id === 'meghnad').t === 'unit', J(Object.keys(ACT)));
  const modBad = MODS.filter((n) => { const src = modSrc(n); return !src || sha(src) !== PIN.actorModules[n]; });
  ok('H2 · THE NINE ACTOR MODULES ARE THE LAB\'S, VERBATIM — each inlined block is byte-identical to the certified module (sha256 recorded at export) (' + MODS.join(', ') + ')', modBad.length === 0, 'differ: ' + J(modBad));

  // the page's own modules and glue, in a sandbox with a fake clock and a stub DOM
  const WD = between('const CHOREO_WATCHDOG_MS=', '// choreoForce: finishers');
  const WD_TICK = (() => { const i = HTML.indexOf('setInterval(()=>{ if(choreoActive && choreoStartedAt'); return i < 0 ? null : HTML.slice(i, HTML.indexOf('}, 1500);', i) + 9); })();
  function actorSandbox(o) {
    o = o || {};
    let now = 1000; const warns = [], logs = [], floats = [], sfx = [], fetched = [], blobFile = new WeakMap(), decodes = [];   // fetched: every URL asked for (EXPORT-5 counts retries)
    const g2d = () => new Proxy({}, { get: (t, k) => (k in t ? t[k] : (k === 'getImageData' || k === 'createImageData') ? (x, y, w, h) => ({ data: new Uint8ClampedArray(Math.max(1, (w | 0) * (h | 0)) * 4), width: w, height: h })
      : k === 'measureText' ? () => ({ width: 0 }) : (k === 'createRadialGradient' || k === 'createLinearGradient') ? () => ({ addColorStop() {} }) : k === 'canvas' ? {} : () => {}), set: (t, k, v) => { t[k] = v; return true; } });
    const canvas = () => { const c = { width: 1, height: 1, style: {}, getContext: () => (c.__g = c.__g || g2d()), getBoundingClientRect: () => ({ left: 0, top: 0, width: 355, height: 420, right: 355, bottom: 420 }) }; return c; };
    const CH = o.cardH || 80, cellRect = (seat, i) => ({ left: 20 + i * 62, top: seat === 0 ? 270 : 70, width: 56, height: CH, right: 76 + i * 62, bottom: (seat === 0 ? 270 : 70) + CH });
    const cellsOf = (seat) => { const pl = ctx.G.players[seat]; return (pl.units || []).concat(pl.heroes || []).map((c, i) => ({ uid: c.uid, getBoundingClientRect: () => cellRect(seat, i) })); };
    const field = Object.assign(canvas(), { clientWidth: 355, clientHeight: 420, querySelector: (sel) => { const m = /data-uid="([^"]+)"/.exec(sel); if (!m) return null; for (const s of [0, 1]) { const c = cellsOf(s).find((x) => String(x.uid) === m[1]); if (c) return c; } return null; } });
    const els = { field, actorunder: canvas(), actorcanvas: canvas(), actorgpu: canvas(), actorover: canvas(), effectclip: canvas() };
    const abs = (u) => new URL(u, 'https://game.test/index.html');
    const ctx = {
      console: { log: (...a) => logs.push(a.join(' ')), warn: (...a) => warns.push(a.join(' ')), error: (...a) => warns.push(a.join(' ')) },
      location: { href: 'https://game.test/index.html' }, URL, Blob, Promise, Math, JSON, Object, Array, Date, String, Number, Error, Map, Set, WeakMap, Uint8ClampedArray, Float32Array, Int32Array, Uint8Array, Uint16Array, Symbol, Proxy, Reflect, isFinite, isNaN, parseInt, parseFloat, setTimeout, clearTimeout,
      performance: { now: () => now }, devicePixelRatio: o.dpr || 2,
      requestAnimationFrame: (f) => { setImmediate(() => { now += 16; f(now); }); return 1; }, cancelAnimationFrame: () => {},
      fetch: (u) => { const rel = decodeURIComponent(abs(u).pathname).replace(/^\//, ''); fetched.push(rel);
        if (o.noActors && /registry\.json$/.test(rel)) { const j = JSON.parse(fs.readFileSync(path.join(GAME, rel), 'utf8')); delete j.actors; return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(j) }); }
        if (o.missing && o.missing(rel)) return Promise.resolve({ ok: false, status: 404 });
        const p = path.join(GAME, rel); if (!fs.existsSync(p)) return Promise.resolve({ ok: false, status: 404 });
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(fs.readFileSync(p, 'utf8'))), blob: () => { const b = new Blob([fs.readFileSync(p)]); blobFile.set(b, p); return Promise.resolve(b); } }); },
      createImageBitmap: (b) => { decodes.push(now); if (o.decodeFails === true || (typeof o.decodeFails === 'function' && o.decodeFails())) return Promise.reject(new Error('decode refused')); if (o.decodeHangs) return new Promise(() => {});
        const px = webpSize(fs.readFileSync(blobFile.get(b))); return Promise.resolve({ width: px.w, height: px.h, close() {} }); },
      Image: function () { const im = this; setTimeout(() => { if (im.onerror) im.onerror(); }, 0); },
      document: { createElement: () => canvas(), querySelector: (sel) => { if (/\.bc/.test(sel)) { const c = cellsOf(0).concat(cellsOf(1)); return c[0] || null; } const seat = /opp/.test(sel) ? 1 : 0; return { querySelectorAll: () => cellsOf(seat) }; } },
      $: (id) => els[id] || null, EffectClip: EC, BLog: { fx: null }, Q: { effPower: E.effPower }, ME: 0,
      G: { players: [{ hand: [] }, { hand: [] }] }, choreoForce: [],
      posOf: () => null, halfSel: (s) => s ? '.half.opp' : '.half.me', ownerPiOfUid: () => 0, reducedMotion: () => !!o.reduced, vfxT: () => o.vfxT || 1.3,
      floatText: (n, d) => floats.push({ uid: n.uid, delta: d, at: now }), Audio2: { sfx: (k) => sfx.push({ k, at: now }) }, VFX: { cardLand() {} },
    };
    ctx.window = ctx; vm.createContext(ctx);
    for (const n of MODS) vm.runInContext(modSrc(n), ctx, { filename: n + '.js' });
    vm.runInContext(WD + '\n', ctx);
    vm.runInContext(GLUE + '\n;globalThis.__mf = { MF, mfBoot, mfManifest, mfPrefetch, mfPrefetchHands, mfReady, mfRouted, mfSnap, mfStage, mfWantRung, mfPickRung, mfDrawnPx, MF_RUNG_PX, mfDecode, ASSET_RETRY, get budget(){ return choreoBudgetMs; } };', ctx);
    return { ctx, mf: ctx.__mf, warns, logs, floats, sfx, fetched, decodes, advance: (ms) => { now += ms; }, get now() { return now; } };
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
      for (const rung of [512, 256]) {
        const r = AM.forRung(m, rung), ap = path.join(dir, r.atlas), px = fs.existsSync(ap) ? webpSize(fs.readFileSync(ap)) : null;
        if ((r.rung || r.cellMax) !== rung || !px || px.w !== r.atlasSize.w || px.h !== r.atlasSize.h) bad.push(id + ': rung-' + rung + ' atlas ' + J(px) + ' vs ' + J(r.atlasSize));
        rows.push({ id, rung, bytes: fs.existsSync(ap) ? fs.statSync(ap).size : 0, decoded: AM.decodedBytes(r) });
      }
      if (J(files) !== J(['atlas.webp', 'atlas_256.webp', 'manifest.json'])) bad.push(id + ': files ' + J(files));
    }
    const ffx = JSON.parse(fs.readFileSync(path.join(MAN, REG.factionFx), 'utf8'));
    const extra = ALLFILES.filter((f) => !/^effects\//.test(f) && !/^actors\/[a-z]+\/(manifest\.json|atlas_256\.webp|atlas\.webp)$/.test(f) && f !== 'registry.json' && f !== REG.factionFx);
    const at = (rg) => rows.filter((x) => x.rung === rg), mb = (rg) => at(rg).reduce((a, x) => a + x.bytes, 0) / 1048576, peak = (rg) => Math.max(...at(rg).map((x) => x.decoded)) / 1048576;
    ok('H3 · EVERY ACTOR SHIPS BOTH RUNGS (EXPORT-4) — each folder holds exactly its manifest, atlas.webp (512) and atlas_256.webp, each manifest validates under the page\'s ActorManifest and BOTH atlases decode to the sizes their rungs record; factionfx.json is the certified one (sha256 pinned); nothing else in assets/manifest (' + at(512).length + ' actors: 512 = ' + mb(512).toFixed(2) + ' MB compressed, the largest decoding to ' + peak(512).toFixed(2) + ' MB; 256 = ' + mb(256).toFixed(2) + ' MB, the largest ' + peak(256).toFixed(2) + ' MB)',
       bad.length === 0 && at(512).length === 20 && at(256).length === 20 && extra.length === 0 && sha(fs.readFileSync(path.join(MAN, REG.factionFx))) === PIN.factionFx && ['devas', 'asuras', 'vanaras', 'nagas'].every((f) => JSON.stringify(ffx).indexOf(f) >= 0), J({ bad, extra }));
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

  // ═══ H20–H21 · EXPORT-4: THE DEVICE MATRIX ═══
  {
    const DM = JSON.parse(fs.readFileSync(path.join(GAME, 'src', 'device_matrix.json'), 'utf8'));
    const S0 = actorSandbox(), want = (h, dpr) => S0.mf.mfWantRung(h * 2.1 * Math.min(2, dpr));
    const table = DM.viewports.map((v) => ({ vp: v.vw + 'x' + v.vh, tier: v.tier, px2: Math.round(v.card.h * 2.1 * 2), d1: want(v.card.h, 1), d2: want(v.card.h, 2), d3: want(v.card.h, 3) }));
    const at512 = table.filter((x) => x.d2 === 512).map((x) => x.vp);
    const run = async (cardH, dpr, rungs) => {
      const S2 = actorSandbox({ cardH, dpr }), P = heroPlay('mahabali'); S2.ctx.G = P.g; await S2.mf.mfBoot();
      for (const rg of rungs) await S2.mf.mfPrefetch('mahabali', rg);
      const R = await manifest(S2, 'mahabali', { play: P, noPrefetch: true }), L = S2.mf.MF.last;
      return { ok: R.r, rung: L && L.card === 'mahabali' ? L.rung : null, px: L && L.drawnPx, peakMB: S2.mf.MF.stage ? +(S2.mf.MF.stage.stat.peakDecoded / 1048576).toFixed(2) : 0, diag: S2.mf.MF.diag.map((d) => d.kind) };
    };
    const a = await run(94.8, 2, [256]), f = await run(94.8, 3, [512, 256]), b = await run(151.4, 2, [512, 256]), c = await run(151.4, 1, [256]), d = await run(151.4, 2, [256]), e = await run(151.4, 2, []);
    ok('H20 · EXPORT-4 · THE RUNG BY DRAWN SIZE (ruling 4): an actor takes 512 when card height × 2.1 × min(DPR, 2) exceeds ' + S0.mf.MF_RUNG_PX + ' device px. On the ' + DM.viewports.length + ' measured screens EVERY PHONE draws 256 at DPR 1, 2 and 3 (the most any phone draws is ' + Math.max(...table.filter((x) => x.tier === 'phone').map((x) => x.px2)) + ' px), every DPR-1 screen draws 256, and at DPR 2 the 512 rung goes to ' + at512.join(', ') + '. Driven through the glue on Mahabali: a 375 px phone card at DPR 2 draws ' + a.px + ' px on ' + a.rung + ', and at DPR 3 — with BOTH rungs in hand — still ' + f.px + ' px on ' + f.rung + ' (the stage caps DPR at 2); a laptop card at DPR 2 draws ' + b.px + ' px on ' + b.rung + ' (the stage\'s peak ' + b.peakMB + ' MB — one actor); the same card at DPR 1 draws ' + c.px + ' px on ' + c.rung + '; with only the 256 bytes in hand the 512 play FALLS BACK to ' + d.rung + ' and still manifests (' + d.diag.join('+') + '); with neither it hands the Hero to the classic path (' + e.ok + ', ' + e.diag.join('+') + ')',
       table.filter((x) => x.tier === 'phone').every((x) => x.d1 === 256 && x.d2 === 256 && x.d3 === 256) && table.every((x) => x.d1 === 256) &&
       J(at512) === J(['1024x1366', '1194x834', '1366x1024', '1440x900', '1680x1050', '1920x1080']) &&
       a.ok === true && a.rung === 256 && f.ok === true && f.rung === 256 && f.px === a.px && b.ok === true && b.rung === 512 && b.peakMB > 50 && c.rung === 256 && d.ok === true && d.rung === 256 && d.diag.indexOf('rung-fell-back') >= 0 &&
       e.ok === false && e.diag.indexOf('not-ready-at-play') >= 0, J({ table, a, f, b, c, d, e }));
    // H21 · every plate on every measured screen, through the game's own inlined player
    const L = (id) => JSON.parse(fs.readFileSync(path.join(MAN, 'effects', id, 'manifest.json'), 'utf8'));
    const MB = L('brahmastra'), MP = L('pashupata'), MV = L('vajra'), SI = L('sudarshana_invoke'), SS = L('sudarshana_strike');
    const law = (m, w) => m.scaleRule.cardWidths * w / (m.scaleRule.spanCell || m.scaleRule.ringDiameterCell) * m.cellSize.w;   // the pre-EXPORT-4 card-width law
    const rows = DM.viewports.map((v) => { const H = { cx: 0, cy: 0, halfW: v.half.w, halfH: v.half.h }, pl = (m, w) => EC.place(m, Object.assign({ w }, H));
      return { v, b: pl(MB, v.card.w), pa: pl(MP, v.card.w), va: pl(MV, v.card.w), si: pl(SI, v.hero.w), ss: pl(SS, v.hero.w), floor: 0.294 * v.half.h > Math.min(v.card.w, v.hero.w) }; });
    const p375 = rows.find((x) => x.v.vw === 375), phones = rows.filter((x) => x.v.tier === 'phone');
    const dz = (x, y) => Math.abs(x - y);
    ok('H21 · EXPORT-4 · EVERY SCREEN GETS ITS TRUE SIZE, through the game\'s own player on all ' + rows.length + ' measured screens. THE 375 PHONE IS UNCHANGED: Brahmastra ' + p375.b.w.toFixed(1) + ' (0.93 of the half, unclamped), Vajra ' + p375.va.w.toFixed(1) + ', the Sudarshana invocation ' + p375.si.w.toFixed(1) + ' and strike ' + p375.ss.w.toFixed(1) + ' — each exactly the card-width law, the floor idle — and Pashupatastra ' + p375.pa.w.toFixed(1) + ' against its certified 390.6. On EVERY phone the height clamp never engages (ruling 1) and the floor is idle through 390 px; on EVERY screen both row weapons sit inside the half (landscape laptops: Brahmastra ' + rows.filter((x) => x.v.tier === 'laptop').map((x) => x.b.w.toFixed(0) + '×' + x.b.h.toFixed(0)).join(', ') + '); where the floor engages (' + rows.filter((x) => x.floor).map((x) => x.v.vw + 'x' + x.v.vh).join(', ') + ') Vajra\'s height sits at ' + rows.filter((x) => x.floor).map((x) => (x.va.h / x.v.half.h).toFixed(2)).join(' / ') + ' of the half',
       dz(p375.b.w, 0.93 * p375.v.half.w) < 1e-9 && dz(p375.va.w, law(MV, p375.v.card.w)) < 1e-9 && dz(p375.si.w, law(SI, p375.v.hero.w)) < 1e-9 && dz(p375.ss.w, law(SS, p375.v.hero.w)) < 1e-9 && dz(p375.pa.w, 390.6) < 0.1 &&
       phones.every((x) => x.b.h < x.v.half.h && x.pa.h < x.v.half.h && dz(x.b.w, 0.93 * x.v.half.w) < 1e-9) &&
       rows.filter((x) => x.v.vw <= 390).every((x) => !x.floor && dz(x.va.w, law(MV, x.v.card.w)) < 1e-9 && dz(x.si.w, law(SI, x.v.hero.w)) < 1e-9 && dz(x.ss.w, law(SS, x.v.hero.w)) < 1e-9) &&
       rows.every((x) => x.b.h <= x.v.half.h + 1e-6 && x.pa.h <= x.v.half.h + 1e-6) &&
       rows.filter((x) => x.floor).every((x) => x.va.h / x.v.half.h >= 0.8 && x.va.h / x.v.half.h <= 0.99),
       J(rows.map((x) => ({ vp: x.v.vw + 'x' + x.v.vh, b: [+x.b.w.toFixed(1), +x.b.h.toFixed(1)], pa: [+x.pa.w.toFixed(1), +x.pa.h.toFixed(1)], va: +x.va.w.toFixed(1), floor: x.floor }))));
  }

  // ═══ X · EXPORT-5: RESILIENCE — beats and clips keep each other honest ═══
  console.log('\n── X · resilience: the beat gate and the retry (EXPORT-5) ──');
  {
    // X1 · THE DESIGN FREEZE
    const all = []; (function walk(d) { fs.readdirSync(d).forEach((n) => { const q = path.join(d, n); if (fs.statSync(q).isDirectory()) walk(q); else all.push(q); }); })(MAN); all.sort();
    const digest = sha(all.map((f) => path.relative(MAN, f) + ' ' + sha(fs.readFileSync(f))).join('\n'));
    // EXPORT-7: the 77 reproduce their digest (the five Lanka files out, the registry without its one new route), and the ORIGINAL 73 theirs
    const esc = (t) => t.replace(/[\u007f-\uffff]/g, (c) => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
    const regWithout = (drop) => { const r = JSON.parse(fs.readFileSync(path.join(MAN, 'registry.json'), 'utf8')); drop.forEach((k) => delete r.routes[k]); return esc(JSON.stringify(r, null, 2)) + '\n'; };
    const digestOf = (out, drop) => sha(all.filter((f) => out.indexOf(path.relative(MAN, f)) < 0).map((f) => path.relative(MAN, f) + ' ' + (path.relative(MAN, f) === 'registry.json' ? sha(regWithout(drop)) : sha(fs.readFileSync(f)))).join('\n'));
    const NEW7 = Object.keys(PIN.lankaPacks), NEW6 = Object.keys(PIN.vasukiPacks);
    const digest77 = digestOf(NEW7, ['lankadahan']), digest73 = digestOf(NEW7.concat(NEW6), ['lankadahan', 'venomstrike']);
    ok('X1 · THE DESIGN FREEZE (owner, binding): every certified file in assets/manifest — ' + all.length + ' atlases, manifests, the chains, the registry and the faction effects — is byte-identical to the certified set (digest ' + digest.slice(0, 12) + '…); EXPORT-7 extends it 77 → 82 with Lanka Dahan\'s chain and its two packs, the 77 still reproduce their digest (' + digest77.slice(0, 12) + '…, the registry without its one new route) and the ORIGINAL 73 theirs (' + digest73.slice(0, 12) + '…)',
       digest === PIN.certifiedAssets82 && all.length === 82 && digest77 === PIN.certifiedAssets77 && digest73 === PIN.certifiedAssets, J({ digest, digest77, digest73 }));

    // the player on a fake clock: every drawn cell with its time, and the cues as they fired
    const RATE = 1000 / 60;
    function drive(id, vfxT, gate, beatAt, capMs) {
      const spec = SPECS[id], clips = clipsOf(spec), cellIx = (sx, sy) => { for (let c = 0; c < clips.length; c++) { const k2 = clips[c].cells.findIndex((q) => q.x === sx && q.y === sy); if (k2 >= 0) return c + ':' + k2; } return '?'; };
      let now = 0, caps = 0; const draws = [];
      const g = { _op: 'source-over', setTransform() {}, clearRect() {}, drawImage(img, sx, sy) { draws.push([Math.round(now * 1000) / 1000, cellIx(sx, sy)]); }, set globalCompositeOperation(v) { this._op = v; }, get globalCompositeOperation() { return this._op; }, globalAlpha: 1 };
      const env = { now: () => now, canvas: { width: 710, height: 840, getContext: () => g }, dpr: 2, cardOf: (uid) => ({ cx: 120, cy: 60, w: 64, uid }), halfOf: (st) => ({ cx: 177.5, cy: st ? 104.5 : 314.5, top: st ? 0 : 210, w: 355, h: 209 }),
        loadAtlas: (m) => ({ source: {}, bytes: m.atlasSize.w * m.atlasSize.h * 4, close() {} }), render() {}, sound() {}, crack() {}, removal() {}, callout() {}, onDone() {}, onBeatLateCap: () => { caps++; } };
      const P = EC.createPlayer(env), run = P.play({ events: BATCH[id].events }, spec, { before: null, after: null }, { mode: 'full', choreoSpeed: vfxT, casterSeat: 0, beatGate: gate, beatCapMs: capMs });
      const impactT = run.plan.cues.find((c) => c.cue === 'impact').t; let beaten = beatAt == null, n = 0;
      while (!run.done && n++ < 6000) { const next = now + RATE; if (!beaten && next >= beatAt) { now = beatAt; P.beat(); beaten = true; } now = next; P.frame(now); }
      if (!beaten && gate) { now = beatAt; P.beat(); }
      return { run, draws, impactT, caps, impactDrawnAt: run.log.impactDrawnAt, cues: run.log.cues.map((c) => [c.cue, Math.round(c.at * 1000) / 1000]), travel: run.log.travel.map((q) => [Math.round(q.t), +q.x.toFixed(3), +q.y.toFixed(3), +q.rot.toFixed(5)]) };
    }
    const IDS = ['brahmastra', 'pashupata', 'sudarshana', 'vajra'], SPEEDS2 = [['normal', 1.3], ['fast', 0.78]];
    const impactCell = (id) => { const sp = SPECS[id]; return (sp.class === 'effect-chain' ? 1 : 0) + ':' + clipsOf(sp)[clipsOf(sp).length - 1].impact; };
    const preCell = (id) => { const sp = SPECS[id]; return (sp.class === 'effect-chain' ? 1 : 0) + ':' + (clipsOf(sp)[clipsOf(sp).length - 1].impact - 1); };

    // X2 · on time = byte-identical (the beat at the planned impact, or before it)
    const same = []; for (const id of IDS) for (const [sp, v] of SPEEDS2) {
      const base = drive(id, v, false, null), onT = drive(id, v, true, base.impactT), just = drive(id, v, true, base.impactT - 1);
      const key = (x) => J({ d: x.draws, c: x.cues, i: x.impactDrawnAt, t: x.travel });
      same.push({ id, sp, onTime: key(onT) === key(base), justBefore: key(just) === key(base), impactAt: Math.round(base.impactDrawnAt), cells: base.draws.length });
    }
    ok('X2 · ON-TIME BEATS ARE BYTE-IDENTICAL, all four effects at Normal AND Fast: with the beat arriving at the planned impact (or a millisecond before it) every drawn cell, every draw time, every cue, the impact instant and the chain\'s travel samples equal the ungated player\'s exactly — ' + same.map((x) => x.id + ' ' + x.sp + ' ' + x.cells + ' draws, impact ' + x.impactAt + ' ms').join(' · '),
       same.every((x) => x.onTime && x.justBefore), J(same));

    // X3 · a beat 1000 ms late: the pre-impact cell holds, the impact lands ON the beat, nothing is skipped, everything after shifts
    const late = IDS.map((id) => { const base = drive(id, 1.3, false, null), L = drive(id, 1.3, true, base.impactT + 1000);
      const inHold = L.draws.filter((d) => d[0] > base.impactT && d[0] < base.impactT + 1000);
      const post = (x, from) => x.draws.filter((d) => d[0] >= from).map((d) => d[1]).filter((c, i, a) => i === 0 || c !== a[i - 1]);
      const settle = (x) => (x.cues.find((c) => c[0] === 'settle') || [0, NaN])[1];
      return { id, beat: Math.round(base.impactT + 1000), impactDrawnAt: Math.round(L.impactDrawnAt), heldCells: [...new Set(inHold.map((d) => d[1]))], wantHeld: preCell(id), held: inHold.length,
               postSame: J(post(L, L.impactDrawnAt)) === J(post(base, base.impactDrawnAt)), settleShift: Math.round(settle(L) - settle(base)), shift: L.run.log.beat && Math.round(L.run.log.beat.shift) }; });
    ok('X3 · A BEAT 1000 ms LATE: each clip FREEZES on its pre-impact cell (the weapon at maximum tension) for the whole wait, lands its impact ON the beat, skips nothing, and runs its after-impact cells shifted by exactly the lateness — ' + late.map((x) => x.id + ': held ' + J(x.heldCells) + ' ×' + x.held + ', impact at ' + x.impactDrawnAt + ' for a beat at ' + x.beat + ', settle +' + x.settleShift).join(' · '),
       late.every((x) => J(x.heldCells) === J([x.wantHeld]) && x.held > 30 && x.impactDrawnAt >= x.beat && x.impactDrawnAt - x.beat <= RATE + 1 && x.postSame && Math.abs(x.settleShift - 1000) <= 1 && Math.abs(x.shift - 1000) <= 1), J(late));

    // X4 · THE NEGATIVE: the same late beat with the gate OFF lands the impact 1000 ms early — X3 can fail
    const early = IDS.map((id) => { const base = drive(id, 1.3, false, null), off = drive(id, 1.3, false, base.impactT + 1000); return { id, impactDrawnAt: Math.round(off.impactDrawnAt), beat: Math.round(base.impactT + 1000) }; });
    ok('X4 · THE NEGATIVE (falsifiable): with the hold disabled the same 1000 ms-late beat finds each impact already drawn ~1000 ms EARLY (' + early.map((x) => x.id + ' ' + x.impactDrawnAt + ' vs ' + x.beat).join(' · ') + ') — exactly the defect X3 catches',
       early.every((x) => x.beat - x.impactDrawnAt > 950));

    // X5 · the cap: no beat within 1500 ms → the clip stands down, no impact drawn; X7 · an early beat is today's behaviour
    const capped = IDS.map((id) => { const base = drive(id, 1.3, false, null), C = drive(id, 1.3, true, base.impactT + 5000); return { id, done: C.run.done, capAt: C.run.log.beatLateCap && Math.round(C.run.log.beatLateCap - base.impactT), impact: C.impactDrawnAt, caps: C.caps }; });
    const earlyBeat = IDS.map((id) => { const base = drive(id, 1.3, false, null), E = drive(id, 1.3, true, base.impactT - 300); const key = (x) => J({ d: x.draws, c: x.cues }); return { id, same: key(E) === key(base) }; });
    ok('X5 · THE CAP: a beat that has not come 1500 ms after the planned impact stands the clip down — cleared and released, its impact NEVER drawn, the glue told once (' + capped.map((x) => x.id + ' at +' + x.capAt + ' ms').join(' · ') + '); and X7 · an EARLY beat is today\'s behaviour exactly (' + earlyBeat.map((x) => x.id + ' ' + (x.same ? 'identical' : 'DIFFERS')).join(' · ') + ')',
       capped.every((x) => x.done && x.capAt >= 1500 && x.capAt <= 1500 + RATE + 1 && x.impact == null && x.caps === 1) && earlyBeat.every((x) => x.same), J({ capped, earlyBeat }));

    // X6 · Sudarshana's bite 800 ms late: the strike impact lands on the bite; the travel pose is frozen at its arrival through the hold
    { const base = drive('sudarshana', 1.3, false, null), L = drive('sudarshana', 1.3, true, base.impactT + 800);
      const held = L.travel.filter((q) => q[0] > base.impactT && q[0] < base.impactT + 800), poses = [...new Set(held.map((q) => q.slice(1).join(',')))];
      ok('X6 · SUDARSHANA\'S BITE 800 ms LATE: the strike\'s impact lands on the bite (' + Math.round(L.impactDrawnAt) + ' for a bite at ' + Math.round(base.impactT + 800) + ') and through the whole hold the disc keeps ONE pose — its arrival point (' + (poses[0] || '?') + ', ' + held.length + ' frames)',
         L.impactDrawnAt >= base.impactT + 800 && L.impactDrawnAt - (base.impactT + 800) <= RATE + 1 && poses.length === 1 && held.length > 30, J({ poses, n: held.length })); }

    // X8 · the glue: the classic sprite takes a beat that comes past the cap; an on-time beat is heard by the clip
    { const run2 = async (id, beatLate) => { const S = sandbox(); await S.fx.fxBoot(); await S.fx.fxPrefetch(id); await flush();
        const r = S.fx.fxCast(card(id), castEv(id)[0], castEv(id), {}); let fired = 0; const owns = id === 'vajra' ? null : S.fx.fxOwnsMoment(id, () => { fired++; });   // the play-moment route is asked at the cast; Vajra is asked at its destroy beat
        await flush(); const t0 = S.now, impactT = r.plan.cues.find((c) => c.cue === 'impact').t;
        const stepTo = (ms) => { while (S.now - t0 < ms) S.tick(16); };
        stepTo(beatLate ? impactT + 1600 : impactT - 5);
        const ownsAtBeat = id === 'vajra' ? S.fx.fxOwnsMoment('vajra') : null;
        const beatEv = castEv(id).find((e) => e.type === (id === 'pashupata' ? 'damage' : 'destroy'));
        S.fx.fxBeatFrom(beatEv); stepTo((beatLate ? impactT + 1600 : impactT) + 200);
        return { id, owns, fired, ownsAtBeat, capped: !!r.log.beatLateCap, impact: r.log.impactDrawnAt != null, diag: S.fx.FX.diag.map((d) => d.kind) }; };
      const B = await run2('brahmastra', true), V = await run2('vajra', true), OT = await run2('brahmastra', false);
      ok('X8 · THE CLASSIC PATH TAKES A BEAT PAST THE CAP, through the live glue: Brahmastra (its sprite held since the cast) fires its classic sprite ONCE, on the late beat (' + B.fired + '); Vajra\'s destroy-moment ownership test fails once the clip has stood down (' + V.ownsAtBeat + '), so its classic sprite fires as yesterday; beat-late-cap is a diagnostic, never narrated; and an ON-TIME beat is heard by the clip, which lands its impact (' + OT.impact + ', sprite ' + OT.fired + ')',
         B.capped && B.fired === 1 && !B.impact && B.diag.indexOf('beat-late-cap') >= 0 && V.capped && V.ownsAtBeat === false && OT.impact && OT.fired === 0 && !OT.capped, J({ B, V, OT })); }

    // X9 · THE RETRY (effects): a 404 once is retried after the backoff; a permanent 404 costs exactly 1 + 3 fetches however often the hand
    // renders; bad bytes are evicted and refetched, and the next cast plays
    { const u = 'assets/manifest/effects/vajra/atlas.webp', countOf = (S) => S.fetched.filter((f) => f[0] === u).length;
      let once = true; const S1 = sandbox({ fetchFail: (rel) => { if (rel === u && once) { once = false; return true; } return false; } }); await S1.fx.fxBoot();
      await S1.fx.fxPrefetch('vajra'); await flush(); const afterFail = { ready: S1.fx.fxReady('vajra'), n: countOf(S1) };
      await S1.fx.fxPrefetch('vajra'); await flush(); const tooSoon = countOf(S1);
      S1.advance(2001); await S1.fx.fxPrefetch('vajra'); await flush(); const retried = { ready: S1.fx.fxReady('vajra'), n: countOf(S1) };
      const S2 = sandbox({ fetchFail: (rel) => rel === u }); await S2.fx.fxBoot(); S2.ctx.G = { players: [{ hand: [card('vajra')] }, { hand: [] }] };
      for (let k = 0; k < 300; k++) { S2.fx.fxPrefetchHands(); await flush(); S2.advance(250); }   // 300 renders over 75 s
      const permanent = { n: countOf(S2), gaveUp: !!(S2.fx.ASSET_RETRY.s[Object.keys(S2.fx.ASSET_RETRY.s).find((k2) => /vajra\/atlas/.test(k2))] || {}).gaveUp };
      let bad = true; const S3 = sandbox({ decodeFails: () => { if (bad) { bad = false; return true; } return false; } }); await S3.fx.fxBoot();
      await S3.fx.fxPrefetch('vajra'); await flush();
      const r1 = S3.fx.fxCast(card('vajra'), castEv('vajra')[0], castEv('vajra'), {}); await flush(); await flush(); S3.tick(16);
      const evicted = { ready: S3.fx.fxReady('vajra'), errors: r1 && r1.log.loadErrors.length };
      await S3.fx.fxPrefetch('vajra'); await flush(); const soon = S3.fx.fxReady('vajra');
      S3.advance(2001); await S3.fx.fxPrefetch('vajra'); await flush(); const refetched = S3.fx.fxReady('vajra');
      const r2 = S3.fx.fxCast(card('vajra'), castEv('vajra')[0], castEv('vajra'), {}); await flush(); await flush(); S3.tick(16);
      const plays = !!r2 && r2.log.loadErrors.length === 0 && r2.log.ready.strike != null;
      ok('X9 · THE RETRY, effects (owner ruling 3): a 404 once leaves Vajra not ready (' + J(afterFail) + '), asking again inside the backoff fetches nothing (' + tooSoon + '), and after 2 s the retry lands it (' + J(retried) + '); a PERMANENT 404 costs exactly ' + permanent.n + ' fetches across 300 hand renders in 75 s (1 + 3 retries at 2/8/30 s) and then gives up (' + permanent.gaveUp + ') — never a fetch per render; BAD BYTES are evicted at the failed decode (ready ' + evicted.ready + '), not refetched inside the backoff (' + soon + '), refetched after it (' + refetched + '), and the next cast plays its clip (' + plays + ')',
         afterFail.ready === false && afterFail.n === 1 && tooSoon === 1 && retried.ready === true && retried.n === 2 && permanent.n === 4 && permanent.gaveUp &&
         evicted.ready === false && evicted.errors === 1 && soon === false && refetched === true && plays, J({ afterFail, tooSoon, retried, permanent, evicted, soon, refetched, plays })); }

    // X10 · THE RETRY (actors): the EXPORT-4 per-render retry is bounded; bad actor bytes are evicted and refetched
    { const u = 'assets/manifest/actors/hanuman/atlas_256.webp';
      const S = actorSandbox({ missing: (rel) => rel === u }); await S.mf.mfBoot(); const P = heroPlay('hanuman'); S.ctx.G = P.g;
      for (let k = 0; k < 300; k++) { S.mf.mfPrefetchHands(); await flush(); S.advance(250); }
      const n = S.fetched.filter((f) => f === u).length;
      let bad = true; const S2 = actorSandbox({ decodeFails: () => { if (bad) { bad = false; return true; } return false; } }); await S2.mf.mfBoot();
      const P2 = heroPlay('hanuman'); S2.ctx.G = P2.g; await S2.mf.mfPrefetch('hanuman', 256); await flush();
      let threw = false; try { await S2.mf.mfDecode('hanuman', 256); } catch (e) { threw = true; }
      const evicted = !S2.mf.mfReady('hanuman', 256);
      S2.advance(2001); await S2.mf.mfPrefetch('hanuman', 256); await flush(); const back = S2.mf.mfReady('hanuman', 256);
      let decoded = false; try { await S2.mf.mfDecode('hanuman', 256); decoded = true; } catch (e) {}
      ok('X10 · THE RETRY, actors (owner ruling 4 — the EXPORT-4 per-render retry fixed): a permanently missing actor atlas costs exactly ' + n + ' fetches across 300 hand renders in 75 s, never one per render; a refused decode evicts the actor\'s bytes (' + evicted + '), the refetch after the backoff restores them (' + back + ') and they decode (' + decoded + ')',
         n === 4 && threw && evicted && back && decoded, J({ n, threw, evicted, back, decoded })); }
  }

  // ═══ Y · EXPORT-6: VASUKI VENOM STRIKE — the rise at the cast, the flood at the empowered drain ═══
  console.log('\n── Y · Vasuki Venom Strike in the live game (EXPORT-6) ──');
  {
    const VSR = loadSpec(REG.routes.venomstrike.spec), VSF = loadSpec(REG.routes.venomstrike.drain.spec);
    const shaOf = (rel) => sha(fs.readFileSync(path.join(MAN, rel)));
    // Y1 · the packs are the certified lab packs (recorded here, never read from the lab — G2), registered as one route with a nested drain
    const packs = Object.keys(PIN.vasukiPacks).map((rel) => ({ rel, ok: shaOf(rel) === PIN.vasukiPacks[rel] }));
    const rt = REG.routes.venomstrike;
    const sizes = [VSR, VSF].map((m) => { const b = fs.readFileSync(path.join(path.dirname(m.__file), m.atlas)), px = webpSize(b); return { px, want: m.atlasSize, bytes: b.length, dec: m.atlasSize.w * m.atlasSize.h * 4 }; });
    ok('Y1 · THE TWO VASUKI PACKS ARE THE CERTIFIED LAB PACKS: all four files match the hashes recorded from the LAB-24 certification (' + packs.map((x) => x.rel.split('/')[1] + '/' + x.rel.split('/')[2] + (x.ok ? ' ✓' : ' ✗')).join(', ') + '), both validate under the page\'s own player — the RISE an arming clip (no impact), the FLOOD an empowered-drain clip (impact cell ' + VSF.impact + ' = f' + String(VSF.cells[VSF.impact].src).padStart(3, '0') + '), each sized as a HEIGHT fraction of its half (' + VSR.scaleRule.heightFraction + ') — and they are registered as ONE route: venomstrike → ' + rt.replaces + ' at the ' + rt.moment + ', its nested drain → ' + rt.drain.replaces + ' at the ' + rt.drain.moment + '. Atlases ' + sizes.map((z) => (z.bytes / 1024).toFixed(0) + ' KB, ' + (z.dec / 1048576).toFixed(2) + ' MB decoded').join(' · ') + ', each under the E1 cap',
       packs.length === 4 && packs.every((x) => x.ok) && EC.validate(VSR).ok && EC.validate(VSF).ok && VSR.moment === 'arming' && VSR.impact === null && VSF.moment === 'empowered-drain' && VSF.impact === 14 && VSF.cells[14].src === 77 &&
       VSR.scaleRule.heightFraction === 1 && VSF.scaleRule.heightFraction === 1 && VSR.scaleRule.halfFraction == null && rt.spec === 'effects/venomstrike_rise/manifest.json' && rt.replaces === 'sprVenomSurge' && rt.moment === 'play' &&
       rt.drain && rt.drain.spec === 'effects/venomstrike_flood/manifest.json' && rt.drain.replaces === 'sprVenomDrain' && rt.drain.moment === 'drain' && sizes.every((z) => z.px && z.px.w === z.want.w && z.px.h === z.want.h && z.dec <= EC.E1.capBytes), J({ packs, sizes }));

    // the engine's own Venom Strike boards (a small builder — the lab's fixtures are not read from here, G2)
    function vsBuild(seat, o) {
      o = o || {};
      const deva = 1 - seat, nagaUnits = ['Naga Warrior', 'Naga Sadhu', 'Naga Archer', 'Naga Enchantress', 'Kaliya', 'Ulupi', 'Naga Hatchling', 'Ashvatara'];
      const nd = (o.noStrike ? [] : ['Vasuki Venom Strike']).concat(o.twoStrikes ? ['Vasuki Venom Strike'] : [], o.karkotaka ? ['Karkotaka'] : [], nagaUnits).slice(0, 12);
      const dd = ['Marut', 'Gandharva', 'Chandra Dev', 'Deva Soldier', 'Kubera', 'Narada', 'Urvashi', 'Brihaspati', 'Vishwakarma', 'Agni', 'Yama', 'Indra'];
      for (let seed = 1; seed < 2000; seed++) {
        let x = seed; const rng = () => { x = (x * 1103515245 + 12345) % 2147483648; return x / 2147483648; };
        const decks = seat === 0 ? [nd, dd] : [dd, nd], sc = { p0Deck: decks[0], p1Deck: decks[1], p0Hand: decks[0].slice(0, 10), p1Hand: decks[1].slice(0, 10), mulligan: 0 };
        if (o.deciding) sc.winTarget = 1;
        const g = E.newGame({ rng, p0: 'You', p1: 'Opponent', realm: 'mrityulok', p0Faction: seat === 0 ? 'nagas' : 'devas', p1Faction: seat === 1 ? 'nagas' : 'devas', scenario: sc });
        if (g.turn !== deva) continue;
        let good = true; const act = (who, name) => { if (!good || g.turn !== who) { good = false; return; } if (name === 'pass') { E.pass(g, who); return; } const h = g.players[who].hand.findIndex((c) => c.n === name); if (h < 0 || E.playableIndices(g, who).indexOf(h) < 0) { good = false; return; } E.playCard(g, who, h); };
        const out = { seat, casts: [] };
        const dl = o.noEnemyUnits ? [] : ['Marut', 'Gandharva', 'Chandra Dev'], nl = (o.karkotaka ? ['Karkotaka'] : ['Naga Warrior']).concat(o.noStrike ? ['Naga Sadhu'] : ['Vasuki Venom Strike'], o.twoStrikes ? ['Vasuki Venom Strike'] : []);
        if (o.noEnemyUnits) act(deva, 'pass');
        for (let i = 0; i < Math.max(dl.length, nl.length) && good; i++) {
          if (i < dl.length && g.turn === deva) act(deva, dl[i]);
          if (i < nl.length && good) { const e0 = g.events.length; act(seat, nl[i]); if (nl[i] === 'Vasuki Venom Strike') out.casts.push(g.events.slice(e0)); }
        }
        if (!good) continue;
        const rec = () => ({ round: g.round, striker: g.players[seat].venomStrike === g.round ? seat : (g.players[deva].venomStrike === g.round ? deva : -1), e0: g.events.length });
        if (!g.players[1 - g.turn].passed) { const r = rec(); act(g.turn, 'pass'); if (!good) continue; out.firstPass = { events: g.events.slice(r.e0), striker: r.striker }; }
        if (g.round !== 1 || g.over) continue;
        const r = rec(); act(g.turn, 'pass'); if (!good || (g.round === 1 && !g.over)) continue;
        out.drain = { events: g.events.slice(r.e0), striker: r.striker, over: !!g.over };
        out.names = [g.players[0].name, g.players[1].name];
        return out;
      }
      return null;
    }
    const VSB = [0, 1].map((s) => vsBuild(s));
    const HALVES = { '.half.me': { left: 0, top: 322, width: 373, height: 229, right: 373, bottom: 551 }, '.half.opp': { left: 0, top: 91, width: 373, height: 229, right: 373, bottom: 320 } };
    const gFor = (names, round, flags) => ({ round: round || 1, players: [0, 1].map((i) => ({ name: names[i], venomStrike: flags ? flags[i] : 0, units: [], heroes: [], discard: [], hand: [] })) });

    // Y2 · the rise through the live glue, both seats: ready → the clip owns the cast (the classic surge held); not ready → the classic surge
    const Y2 = [];
    for (const seat of [0, 1]) {
      const ev = VSB[seat].casts[0], S = sandbox({ halves: HALVES, ownerPi: () => seat }); await S.fx.fxBoot(); await S.fx.fxPrefetch('venomstrike'); await flush();
      const r = S.fx.fxCast({ id: 'venomstrike', n: 'Vasuki Venom Strike', t: 'astra' }, ev[0], ev, {}); let fired = 0; const owns = S.fx.fxOwnsMoment('venomstrike', () => { fired++; });
      const pl = r && r.places[0], half = seat === 0 ? HALVES['.half.me'] : HALVES['.half.opp'];
      const Sn = sandbox({ halves: HALVES, ownerPi: () => seat }); await Sn.fx.fxBoot();
      const rn = Sn.fx.fxCast({ id: 'venomstrike', n: 'Vasuki Venom Strike', t: 'astra' }, ev[0], ev, {}); let firedN = 0; const ownsN = Sn.fx.fxOwnsMoment('venomstrike', () => { firedN++; }); if (!ownsN) firedN++;
      Y2.push({ seat, clip: !!(r && r.plan.clip), arming: !!(r && r.plan.arming), impactCues: r ? r.plan.cues.filter((c) => c.cue === 'impact').length : -1, place: r && r.plan.segments[0].place, owns, fired,
                onCasterHalf: !!pl && Math.abs(pl.h - half.height) < 1e-6 && Math.abs(pl.y - half.top) < 1e-6 && Math.abs(pl.y + pl.h - half.bottom) < 1e-6, beatWant: S.fx.FX.beatWant, notReady: rn === null && !ownsN && firedN === 1 });
    }
    ok('Y2 · THE RISE, through the live glue, both seats: Venom Strike\'s cast starts an ARMING clip (no impact cue, no beat to wait for) on the CASTER\'s half — height-fit, top and bottom on the half\'s borders — and the clip owns the cast, so the classic sprVenomSurge is held (fired ' + Y2.map((x) => x.fired).join(' / ') + '); a cast whose bytes never arrived (a staked opponent\'s first cast: no hand to prefetch from) returns null and the classic surge fires, exactly as yesterday',
       Y2.every((x) => x.clip && x.arming && x.impactCues === 0 && x.place === 'caster-half-bottom' && x.owns === true && x.fired === 0 && x.onCasterHalf && x.beatWant === null && x.notReady), J(Y2));

    // Y3 · the ready-anchored rise (ruling A): a slow decode still opens on cell 0; past the cast beat's settle the classic surge fires once
    const riseWith = async (seat, decodeAtMs) => {
      let release = null; const gate = new Promise((res) => { release = res; });
      const S = sandbox({ halves: HALVES, ownerPi: () => seat, decodeGate: gate }); await S.fx.fxBoot(); await S.fx.fxPrefetch('venomstrike'); await flush();
      const ev = VSB[seat].casts[0], r = S.fx.fxCast({ id: 'venomstrike', n: 'Vasuki Venom Strike', t: 'astra' }, ev[0], ev, {});
      let fired = 0; S.fx.fxOwnsMoment('venomstrike', () => { fired++; });
      const t0 = S.now; let n = 0;
      while (r && !r.done && n++ < 400) { if (decodeAtMs != null && release && S.now - t0 >= decodeAtMs) { release(); release = null; await flush(); await flush(); } S.tick(1000 / 60); }
      return { r, first: r && r.log.drawn[0], cells: r && new Set(r.log.drawn).size, started: r && r.log.clipStartedAt, late: r && r.log.armingLate, fired, bound: r && r.plan.timeline.castBeatMs };
    };
    const y3 = [await riseWith(0, 300), await riseWith(1, 700)], y3late = [await riseWith(0, null), await riseWith(1, null)];
    ok('Y3 · THE RISE IS NEVER PARTIAL (ruling A): with the decode landing ' + [300, 700].join(' / ') + ' ms after the cast, the rise still opens on CELL ' + y3.map((x) => x.first).join(' / ') + ' and plays all ' + VSR.cells.length + ' cells, its clock started at the decode (' + y3.map((x) => Math.round(x.started)).join(' / ') + ' ms) — and with no decode by the cast beat\'s settle (' + Math.round(y3late[0].bound) + ' ms) the rise stands down, never drawing a cell, and the classic sprVenomSurge fires ONCE (' + y3late.map((x) => x.fired).join(' / ') + ')',
       y3.every((x) => x.first === 0 && x.cells === 55 && x.started >= 300 - 1 && x.late == null && x.fired === 0) && y3late.every((x) => x.r && x.r.log.drawn.length === 0 && x.late != null && x.fired === 1), J(y3.concat(y3late).map((x) => [x.first, x.cells, x.started && Math.round(x.started), x.late && Math.round(x.late), x.fired])));

    // Y4 · the flood through the live glue: armed at the empowered toast, its eruption heard on the FIRST venom event (the EXPORT-5 gate)
    const flood = async (seat, beatDelay) => {
      const d = VSB[seat].drain, S = sandbox({ halves: HALVES, ownerPi: (u) => (VSB[seat].names && d.events.some((e) => e.type === 'venom' && e.targetUids.indexOf(u) >= 0)) ? 1 - seat : seat });
      S.ctx.G = gFor(VSB[seat].names); await S.fx.fxBoot(); await S.fx.fxPrefetch('venomstrike:drain'); await flush();
      const toast = d.events.find((e) => e.type === 'toast'); let fired = 0;
      const picked = S.fx.vsDrainPick(toast, d.events, d.striker), owned = picked && S.fx.fxVenomDrain(toast, d.events, d.striker, {}, () => { fired++; });
      const r = S.fx.FX.run; if (!r) return { picked, owned, fired, r: null };
      const impactT = r.plan.cues.find((c) => c.cue === 'impact').t, t0 = S.now, firstVenom = d.events.find((e) => e.type === 'venom');
      let beaten = beatDelay == null, n = 0;
      while (!r.done && n++ < 600) { if (!beaten && S.now - t0 >= impactT + beatDelay) { S.fx.fxBeatFrom(firstVenom); beaten = true; } await flush(); S.tick(1000 / 60); }
      if (!beaten) S.fx.fxBeatFrom(firstVenom);
      const held = [...new Set((r.log.bySegment.strike || []).filter((c, i, a) => true))];
      return { picked, owned, fired, r, impactT, impactAt: r.log.impactDrawnAt, beat: r.log.beat, cap: r.log.beatLateCap, place: r.plan.segments[0].place, seq: r.log.bySegment.strike || [] };
    };
    const onT = [await flood(0, -1000 / 60), await flood(1, -1000 / 60)], lateF = await flood(0, 1000), capF = await flood(1, 5000);
    const heldCell = (x) => x.seq && x.seq.indexOf(14) > 0 ? x.seq[x.seq.indexOf(14) - 1] : null;
    ok('Y4 · THE FLOOD, through the live glue: the empowered drain\'s toast is picked, the flood is armed on the ENEMY half (' + onT.map((x) => x.place).join(' / ') + ') and holds the classic plate; its eruption (cell 14 = f077) lands on the drain\'s FIRST venom beat — on time at ' + onT.map((x) => Math.round(x.impactAt)).join(' / ') + ' ms for a planned ' + Math.round(onT[0].impactT) + ' (no hold); a beat 1000 ms late holds the pre-impact cell (cell ' + heldCell(lateF) + ' = f076) and erupts on it (' + Math.round(lateF.impactAt) + ' ms); past the 1500 ms cap the flood stands down and the classic sprVenomDrain fires ONCE, on the late beat (' + capF.fired + ')',
       onT.concat([lateF, capF]).every((x) => !!x.r) && onT.every((x) => x.picked && x.owned && x.fired === 0 && x.place === 'enemy-half-bottom' && x.beat === null && Math.abs(x.impactAt - x.impactT) <= 1000 / 60 + 1) &&
       lateF.beat && Math.abs(lateF.beat.late - 1000) < 1000 / 60 + 1 && heldCell(lateF) === 13 && lateF.impactAt >= lateF.impactT + 1000 - 1 && lateF.fired === 0 && capF.cap != null && capF.impactAt == null && capF.fired === 1,
       J({ onT: onT.map((x) => [x.impactAt, x.beat]), late: [lateF.beat, heldCell(lateF), lateF.impactAt], cap: [capF.cap, capF.fired] }));

    // Y5–Y7 · THE TRUTH TABLE, from the engine: which drains flood (the pick), once per drain
    const rows = [];
    for (const seat of [0, 1]) for (const [k, o] of [['empowered', {}], ['twoStrikes', { twoStrikes: true }], ['deciding', { deciding: true }], ['ordinary', { noStrike: true }], ['karkotaka', { karkotaka: true }], ['noEnemyUnits', { noEnemyUnits: true }]]) {
      const b = vsBuild(seat, o); if (!b) { rows.push({ seat, k, built: false }); continue; }
      const S = sandbox({ halves: HALVES }); S.ctx.G = gFor(b.names);
      const pickIn = (x) => x ? x.events.filter((e) => S.fx.vsDrainPick(e, x.events, x.striker)).length : 0;
      rows.push({ seat, k, built: true, drainPicks: pickIn(b.drain), firstPassPicks: pickIn(b.firstPass), toasts: b.drain.events.filter((e) => e.type === 'toast').map((e) => e.text), venoms: b.drain.events.filter((e) => e.type === 'venom').length, striker: b.drain.striker, over: b.drain.over, casts: b.casts.length });
    }
    const R = (s, k) => rows.find((x) => x.seat === s && x.k === k);
    ok('Y5 · THE FLOOD PLAYS where the engine empowers the drain (both seats): the empowered round-end drain (toast "' + R(0, 'empowered').toasts[0] + '", ' + R(0, 'empowered').venoms + ' Units drained) — picked ONCE; two Venom Strikes in one round (one flag, one drain) — once; the round that ends the match (the drain precedes the match check) — once',
       [0, 1].every((s) => ['empowered', 'twoStrikes', 'deciding'].every((k) => R(s, k).built && R(s, k).drainPicks === 1 && R(s, k).striker === s)) && [0, 1].every((s) => R(s, 'twoStrikes').casts === 2 && R(s, 'deciding').over), J(rows));
    ok('Y6 · NO FLOOD where the engine does not empower the drain (both seats): an ORDINARY drain (toast −1, no striker), a KARKOTAKA round (the round-end drain is skipped; only the flat −1 early tick fires, on the first pass) and NO enemy Units (no drain, no toast) — the pick never fires, so neither the flood nor the classic plate plays',
       [0, 1].every((s) => R(s, 'ordinary').built && R(s, 'ordinary').drainPicks === 0 && R(s, 'ordinary').striker === -1 && R(s, 'karkotaka').drainPicks === 0 && R(s, 'karkotaka').firstPassPicks === 0 && R(s, 'karkotaka').toasts.length === 0 && R(s, 'noEnemyUnits').drainPicks === 0 && R(s, 'noEnemyUnits').toasts.length === 0), J(rows.filter((x) => ['ordinary', 'karkotaka', 'noEnemyUnits'].indexOf(x.k) >= 0)));
    const one = onT.map((x, i) => ({ venoms: VSB[i].drain.events.filter((e) => e.type === 'venom').length, impacts: x.r ? x.r.plan.cues.filter((c) => c.cue === 'impact').length : 0, starts: x.r ? x.r.plan.cues.filter((c) => c.cue === 'clip-start').length : 0 }));
    { const S = sandbox({ halves: HALVES, ownerPi: () => 1 }); S.ctx.G = gFor(VSB[0].names); await S.fx.fxBoot(); await S.fx.fxPrefetch('venomstrike:drain'); await flush();
      const d = VSB[0].drain, toast = d.events.find((e) => e.type === 'toast'); S.fx.fxVenomDrain(toast, d.events, 0, {}, () => {});
      const wants = []; for (const e of d.events.filter((x) => x.type === 'venom')) { wants.push(!!S.fx.FX.beatWant); S.fx.fxBeatFrom(e); }
      ok('Y7 · ONE FLOOD PER DRAIN: the empowered drain hits ' + one.map((x) => x.venoms).join(' / ') + ' Units, one venom beat each, and the flood is ONE half-plate — one clip-start, one impact cue — and it hears only the FIRST venom beat (listening before each: ' + J(wants) + ')',
         one.every((x) => x.venoms === 3 && x.impacts === 1 && x.starts === 1) && J(wants) === J([true, false, false]), J({ one, wants })); }

    // Y8 · THE SIDE CHECK (ruling B): the striker's OWN drain names the drained player; a −3 toast naming the striker's own side is never picked
    const y8 = [0, 1].map((seat) => { const d = VSB[seat].drain, S = sandbox(); S.ctx.G = gFor(VSB[seat].names);
      const decoy = { type: 'toast', abilityName: 'Venom', text: 'Venom drains ' + VSB[seat].names[seat] + '’s Units −3' }, real = d.events.find((e) => e.type === 'toast'), evs = [decoy].concat(d.events);
      return { seat, decoy: S.fx.vsDrainPick(decoy, evs, seat), real: S.fx.vsDrainPick(real, evs, seat) }; });
    const site = between("if(ev.abilityName==='Venom'){", "factionToast(ev.abilityName, ev.text); await cDelay(620); return; }") || '';
    ok('Y8 · THE DRAIN SIDE-CHECK (ruling B — it also corrects the classic plate in Naga mirrors): a −3 Venom toast that drains the STRIKER\'s own side (placed first) is not picked (' + y8.map((x) => x.decoy).join(' / ') + '), the real one is (' + y8.map((x) => x.real).join(' / ') + '); the drain site asks vsDrainPick and hands the moment to fxVenomDrain — sprVenomDrain is called only as that function\'s classic fallback, and sprVenomSurge only behind the rise\'s ownership test',
       y8.every((x) => x.decoy === false && x.real === true) && /if\(vsDrainPick\(ev, evs, np\)\)\{/.test(site) && /fxVenomDrain\(ev, evs, np, snap, \(\)=>VFX\.sprVenomDrain\(/.test(site) &&
       (HTML.match(/VFX\.sprVenomDrain\(/g) || []).length === 1 && (HTML.match(/VFX\.sprVenomSurge\(/g) || []).length === 1 && /fire=\(\)=>VFX\.sprVenomSurge\([^;]+\); if\(!fxOwnsMoment\('venomstrike', fire\)\) fire\(\);/.test(HTML), J(y8));

    // Y9 · THE STAKED ROAD (ruling C): the striker from the cast's own play event, by ABSOLUTE seat
    const y9 = (() => { const S = sandbox(); const ev = VSB[1].casts[0];
      S.ctx.G = gFor(['You', 'Opponent'], 1); S.fx.vsNoteCasts(ev, 1); const fromEvent = S.fx.vsStriker();
      S.ctx.G.round = 2; const stale = S.fx.vsStriker();
      S.ctx.G = gFor(['You', 'Opponent'], 1, [1, 0]); const fromFlag = S.fx.vsStriker();
      return { fromEvent, stale, fromFlag, cast: S.fx.VS.cast }; })();
    const vsSrc = fnBody('vsStriker') || '', runA = HTML.slice(HTML.indexOf('function runAction(mutate, opts={}){'), HTML.indexOf('function runAction(mutate, opts={}){') + 3000);   // (fnBody stops at the opts={} default)
    ok('Y9 · THE STAKED ROAD (ruling C): the staked view carries no venomStrike flag, so the cast\'s own play event is recorded (seat ' + (y9.cast && y9.cast.seat) + ', round ' + (y9.cast && y9.cast.round) + ') and names the striker (' + y9.fromEvent + '); a record from another round names no one (' + y9.stale + '); on the engine roads the flag answers (' + y9.fromFlag + '). The striker is an ABSOLUTE seat (vsStriker never reads ME/OPP — the old capture\'s relative seat is gone), captured before the mutate, the casts noted after it, and a new match forgets the last one\'s cast',
       y9.fromEvent === 1 && y9.stale === -1 && y9.fromFlag === 0 && !/\bME\b|\bOPP\b/.test(vsSrc) && /venomStrikeNpAtAction = vsStriker\(\);/.test(runA) && /vsNoteCasts\(evs, opts\.actor\)/.test(runA) &&
       runA.indexOf('venomStrikeNpAtAction = vsStriker()') < runA.indexOf('mutate();') && runA.indexOf('vsNoteCasts(evs') > runA.indexOf('mutate();') && /function resetChoreo\(\)\{[^\n]*VS\.cast=null;/.test(HTML), J(y9));

    // Y10 · THE PREFETCH (ruling A: hand entry only): both packs' bytes arrive with the card; a failed drain fetch rides the shared retry, and fails open
    const y10 = await (async () => { const S = sandbox(); S.ctx.G = { round: 1, players: [{ name: 'You', hand: [{ id: 'venomstrike' }] }, { name: 'Opponent', hand: [] }] }; await S.fx.fxBoot();
      S.fx.fxPrefetchHands(); await flush(); await flush(); await flush();
      const got = S.fetched.map((f) => f[0]), both = ['assets/manifest/effects/venomstrike_rise/atlas.webp', 'assets/manifest/effects/venomstrike_flood/atlas.webp'].every((u) => got.indexOf(u) >= 0);
      const u = 'assets/manifest/effects/venomstrike_flood/atlas.webp', S2 = sandbox({ fetchFail: (rel) => rel === u, halves: HALVES }); S2.ctx.G = gFor(VSB[0].names); S2.ctx.G.players[0].hand = [{ id: 'venomstrike' }];
      await S2.fx.fxBoot(); S2.fx.fxPrefetchHands(); await flush(); await flush(); await flush();
      const rec = S2.fx.ASSET_RETRY.s[Object.keys(S2.fx.ASSET_RETRY.s).find((k) => /venomstrike_flood\/atlas/.test(k))] || null;
      const d = VSB[0].drain, toast = d.events.find((e) => e.type === 'toast'); let fired = 0; const owned = S2.fx.fxVenomDrain(toast, d.events, 0, {}, () => { fired++; });
      return { both, ready: [S.fx.fxReady('venomstrike'), S.fx.fxReady('venomstrike:drain')], retry: rec && { attempts: rec.attempts, inMs: Math.round(rec.nextAt - S2.now) }, owned, fired, riseReady: S2.fx.fxReady('venomstrike') }; })();
    ok('Y10 · THE PREFETCH (ruling A — hand entry only, no match-start prefetch): Venom Strike entering a visible hand fetches BOTH packs\' bytes (rise and flood — decoded only at their own moments; ready ' + J(y10.ready) + '); a drain atlas that fails rides the shared retry (attempt ' + (y10.retry && y10.retry.attempts) + ', again in ' + (y10.retry && y10.retry.inMs) + ' ms), and a drain met without its bytes fails open — the classic sprVenomDrain fires (' + y10.fired + ') while the rise, fetched fine, stays ready',
       y10.both && J(y10.ready) === J([true, true]) && y10.retry && y10.retry.attempts === 1 && y10.retry.inMs === 2000 && y10.owned === false && y10.fired === 1 && y10.riseReady === true && !/matchStart|startGame[^\n]*fxPrefetch/.test(fnBody('fxPrefetchHands') || ''), J(y10));

    // Y11 · THE DEVICE MATRIX: both plates height-fit on all 16 measured screens; the side feather inside the portrait overhang
    const DM = JSON.parse(fs.readFileSync(path.join(GAME, 'src', 'device_matrix.json'), 'utf8')).viewports, fitRows = [];
    DM.forEach((v) => [VSR, VSF].forEach((m) => { const H = v.half, p = EC.place(m, { cx: 0, cy: H.h, w: 0, halfW: H.w, halfH: H.h }), over = (p.w - H.w) / 2, fz = m.audit.vignette.left.px * p.w / m.audit.box[2];
      fitRows.push({ vp: v.vw + 'x' + v.vh, m: m.moment, h: p.h, halfH: H.h, top: p.y, bottom: p.y + p.h, over: +over.toFixed(2), clear: +(over - fz).toFixed(2), layout: v.layout }); }));
    const portrait = fitRows.filter((x) => x.over > 0);
    ok('Y11 · THE DEVICE MATRIX: both plates placed on all ' + DM.length + ' measured screens (' + fitRows.length + ' placements) — each plate\'s height IS its half\'s height, its top and bottom on the half\'s borders; on the ' + (portrait.length / 2) + ' portrait screens it overhangs the half and its 54 px side feather lies wholly in that overhang (tightest clearance ' + Math.min(...portrait.map((x) => x.clear)).toFixed(2) + ' CSS px, the 360 px phone); on the ' + (fitRows.filter((x) => x.over <= 0).length / 2) + ' landscape screens it fits inside the half',
       fitRows.length === 32 && fitRows.every((x) => Math.abs(x.h - x.halfH) < 1e-9 && Math.abs(x.top) < 1e-9 && Math.abs(x.bottom - x.halfH) < 1e-9) && portrait.length === 14 && portrait.every((x) => x.layout === 'portrait' && x.clear >= 0) &&
       fitRows.filter((x) => x.over <= 0).every((x) => x.layout === 'landscape'), J(fitRows.filter((x) => x.clear < 0)));
  }

  // ═══ Z · EXPORT-7: LANKA DAHAN — the fire at the first damage beat, released, then the gold on the classic wash timer ═══
  console.log('\n── Z · Lanka Dahan in the live game (EXPORT-7) ──');
  {
    const LK = loadSpec(REG.routes.lankadahan.spec), LF = LK.clips[0], LG = LK.clips[1], rt = REG.routes.lankadahan, K = LK.chain.contract;
    const lkCard = { id: 'lankadahan', n: 'Lanka Dahan', t: 'astra' };
    const LK_NONE = { done: true, places: [null, null], plan: { clip: false, casterSeat: null, segments: [{}, {}], cues: [] }, log: { bySegment: {}, cues: [], ready: {}, loadErrors: [], drawn: [], impactDrawnAt: null, beat: null, beatLateCap: null } };
    // the engine's own Lanka Dahan boards (a small builder — the lab's fixtures are not read from here, G2)
    function lkBuild(seat, o) {
      o = o || {};
      const V = ['Lanka Dahan', 'Nala', 'Neela', 'Angad', 'Sugriva', 'Tara', 'Jambavan', 'Vanara Warrior', 'Vanara Scout', 'Riksha', 'Mainda', 'Kesari'];
      const A = ['Ravana', 'Kalanemi', 'Narakasura', 'Tataka', 'Maricha', 'Kumbhakarna', 'Meghnad', 'Asura Berserker', 'Kali Asura', 'Mahabali', 'Bana Asura', 'Vibhishana'];
      let x = 7; const rng = () => { x = (x * 1103515245 + 12345) % 2147483648; return x / 2147483648; };
      const decks = seat === 0 ? [V, A] : [A, V];
      const g = E.newGame({ rng, p0: 'You', p1: 'Opponent', realm: 'mrityulok', p0Faction: seat === 0 ? 'vanaras' : 'asuras', p1Faction: seat === 1 ? 'vanaras' : 'asuras',
        scenario: { p0Deck: decks[0], p1Deck: decks[1], p0Hand: decks[0].slice(0, 10), p1Hand: decks[1].slice(0, 10), mulligan: 0 } });
      const put = (pl, names, pw) => names.forEach((n) => { const i = pl.hand.findIndex((c) => c.n === n); const c = pl.hand.splice(i, 1)[0]; if (pw != null) { c.power = pw; c.base = pw; } pl.units.push(c); });
      put(g.players[1 - seat], o.foes || ['Ravana', 'Kalanemi', 'Narakasura'], o.foePw); put(g.players[seat], o.friends || ['Nala', 'Neela']);
      g.turn = seat; const e0 = g.events.length, h = g.players[seat].hand.findIndex((c) => c.id === 'lankadahan'), legal = E.playableIndices(g, seat).indexOf(h) >= 0;
      if (legal) E.playCard(g, seat, h);
      const own = {}; g.players.forEach((pl, pi) => pl.units.concat(pl.heroes, pl.discard).forEach((c) => { if (c && c.uid != null) own[c.uid] = pi; }));
      return { seat, legal, events: g.events.slice(e0), own };
    }
    const LKB = [0, 1].map((s) => lkBuild(s));
    const HL = { '.half.me': { left: 0, top: 322, width: 373, height: 229, right: 373, bottom: 551 }, '.half.opp': { left: 0, top: 91, width: 373, height: 229, right: 373, bottom: 320 } };
    const halfOfSeat = (s) => (s ? HL['.half.opp'] : HL['.half.me']);
    const firstDmg = (b) => b.events.find((e) => e.type === 'damage' && e.abilityName === 'Lanka Dahan');
    const timersOn = (S) => { const q = []; S.ctx.setTimeout = (fn, ms) => { q.push({ fn, ms }); return q.length; }; return { q, run: () => { while (q.length) q.shift().fn(); } }; };
    // one Lanka cast through the live glue on a fake clock. The engine's own beat reaches fxBeatFrom at the planned impact + beatDelay
    async function lkRun(seat, o) {
      o = o || {};
      const b = o.b || LKB[seat], decodes = [];
      const S = sandbox(Object.assign({ halves: HL, ownerPi: o.ownerPi || ((u) => (b.own[u] != null ? b.own[u] : 0)) }, o.sb || {}));
      if (o.vfxT) S.ctx.vfxT = () => o.vfxT;
      await S.fx.fxBoot(); await S.fx.fxPrefetch('lankadahan'); await flush();
      const cib = S.ctx.createImageBitmap; S.ctx.createImageBitmap = (x) => { decodes.push(S.fx.FX.player ? S.fx.FX.player.stats().loadedRole : null); return cib(x); };
      const r = S.fx.fxCast(lkCard, b.events[0], b.events, {});
      if (!r) return { S, r: LK_NONE, decodes, frames: [], impactT: NaN, t0: S.now };   // not cast: a dead run that fails every check honestly (never a throw)
      const impactT = r.plan.cues.find((c) => c.cue === 'impact').t, t0 = S.now, fd = firstDmg(b), frames = [];
      let beaten = o.beatDelay === undefined ? false : false, n = 0;
      const delay = o.beatDelay == null ? -1000 / 60 : o.beatDelay;
      while (!r.done && n++ < (o.maxTicks || 700)) {
        if (!beaten && S.now - t0 >= impactT + delay) { S.fx.fxBeatFrom(fd); beaten = true; }
        const a = (r.log.bySegment.strike || []).length, g0 = (r.log.bySegment.afterglow || []).length;
        await flush(); S.tick(1000 / 60);
        frames.push([((r.log.bySegment.strike || []).length > a) ? 1 : 0, ((r.log.bySegment.afterglow || []).length > g0) ? 1 : 0]);
        if (o.stopAt && S.now - t0 >= o.stopAt) break;
      }
      return { S, r, b, impactT, t0, decodes, frames };
    }

    // Z1 · the packs are the certified lab packs, registered as ONE route with its nested wash
    const packs = Object.keys(PIN.lankaPacks).map((rel) => ({ rel, ok: sha(fs.readFileSync(path.join(MAN, rel))) === PIN.lankaPacks[rel] }));
    const sizes = [LF, LG].map((m) => { const b2 = fs.readFileSync(path.join(path.dirname(m.__file), m.atlas)), px = webpSize(b2); return { px, want: m.atlasSize, bytes: b2.length, dec: m.atlasSize.w * m.atlasSize.h * 4 }; });
    ok('Z1 · LANKA DAHAN\'S CHAIN AND TWO PACKS ARE THE CERTIFIED LAB FILES: all five match the hashes recorded from the LAB-25 certification (' + packs.map((x) => x.rel.split('/').slice(1).join('/') + (x.ok ? ' ✓' : ' ✗')).join(', ') + '); the chain validates under the page\'s own player — shape strike-afterglow, the FIRE (impact cell ' + LF.impact + ' = f' + String(LF.cells[LF.impact].src).padStart(3, '0') + ') then the GOLD (no impact, f000–f' + String(LG.cells[LG.cells.length - 1].src).padStart(3, '0') + '), each a WIDTH fraction of its half; registered as one route: lankadahan → ' + rt.replaces + ' at the ' + rt.moment + ', its nested wash → ' + rt.wash.replaces + '. Atlases ' + sizes.map((z) => (z.bytes / 1024).toFixed(0) + ' KB, ' + (z.dec / 1048576).toFixed(2) + ' MB decoded').join(' · ') + ' — each under E1, together past it (one at a time)',
       packs.length === 5 && packs.every((x) => x.ok) && EC.validateChain(LK.chain, LK.clips).ok && LK.chain.shape === 'strike-afterglow' && LF.role === 'strike' && LF.impact === 26 && LF.cells[26].src === 88 && LG.role === 'afterglow' && LG.impact === null &&
       LG.cells[LG.cells.length - 1].src === 109 && LF.scaleRule.halfFraction === 1 && LG.scaleRule.halfFraction === 1 && rt.spec === 'effects/lankadahan/chain.json' && rt.replaces === 'sprLankaFire' && rt.moment === 'damage' &&
       rt.wash && rt.wash.spec === 'effects/lankadahan_gold/manifest.json' && rt.wash.replaces === 'sprLankaWash' && sizes.every((z) => z.px && z.px.w === z.want.w && z.px.h === z.want.h && z.dec <= EC.E1.capBytes) && sizes[0].dec + sizes[1].dec > EC.E1.capBytes, J({ packs, sizes }));

    // Z2 · the page's player is the LAB-25 player, verbatim, and knows the new shape
    const sw = JSON.parse(JSON.stringify(LK.chain));
    ok('Z2 · THE PAGE\'S PLAYER IS THE LAB-25 PLAYER, VERBATIM (sha256 ' + sha(PLAYER_SRC || '').slice(0, 12) + '…): it knows the strike-afterglow shape — the Lanka chain validates, the same clips in the wrong order are refused, a chain without its afterglow delay is refused — and the Sudarshana invoke→strike chain still validates',
       sha(PLAYER_SRC || '') === PIN.effectPlayer && EC.validateChain(LK.chain, LK.clips).ok && !EC.validateChain(sw, [LG, LF]).ok && (() => { const c = JSON.parse(JSON.stringify(LK.chain)); delete c.contract.afterglowDelayMs; return !EC.validateChain(c, LK.clips).ok; })() &&
       (() => { const su = loadSpec(REG.routes.sudarshana.spec); return EC.validateChain(su.chain, su.clips).ok; })());

    // Z3 · registration only
    ok('Z3 · REGISTRATION ONLY: the registry gains exactly one route (lankadahan) and nothing else moves — with it taken out, the registry is byte-identical to the certified 77 (X1 proves the digest); the route names the chain, the beat it owns (the damage) and the classic pair it replaces',
       J(Object.keys(REG.routes)) === J(['vajra', 'sudarshana', 'pashupata', 'brahmastra', 'venomstrike', 'lankadahan']) && J(Object.keys(rt).sort()) === J(['anchor', 'moment', 'replaces', 'spec', 'wash']) && J(Object.keys(rt.wash).sort()) === J(['anchor', 'moment', 'replaces', 'spec']));

    // Z4 · the fire's impact on the FIRST damage beat through the EXPORT-5 gate; past the cap the gold never decodes and the classic pair fires once each
    const onT = [await lkRun(0), await lkRun(1)], lateR = await lkRun(0, { beatDelay: 1000 }), capR = await lkRun(1, { beatDelay: 5000, maxTicks: 260 });
    const held = (x) => { const q = x.r.log.bySegment.strike || [], i = q.indexOf(26); return i > 0 ? q[i - 1] : null; };
    const capPair = (() => { const T = timersOn(capR.S); let fire = 0, wash = 0, fl = 0; capR.S.fx.fxBeatFrom(firstDmg(LKB[1])); capR.S.fx.fxLankaBurn(() => fire++, () => wash++, () => fl++); T.run(); return { fire, wash, fl }; })();
    ok('Z4 · THE FIRE ON THE FIRST DAMAGE BEAT (the EXPORT-5 gate): on time its impact cell f088 is drawn within a frame of the planned impact (' + onT.map((x) => Math.round(x.r.log.impactDrawnAt) + ' for ' + Math.round(x.impactT)).join(' / ') + ' ms), no hold; a beat 1000 ms LATE holds cell ' + held(lateR) + ' (f087) and lands f088 on the beat; past the 1500 ms cap the fire stands down — f088 never drawn, the GOLD NEVER DECODED (' + capR.decodes.length + ' decode) — and at the late beat the classic pair fires once each (fire ' + capPair.fire + ', wash ' + capPair.wash + ', floaters ' + capPair.fl + ')',
       onT.every((x) => x.r && x.r.plan.clip && x.r.log.beat === null && Math.abs(x.r.log.impactDrawnAt - x.impactT) <= 1000 / 60 + 1) && held(lateR) === 25 && lateR.r.log.beat && Math.abs(lateR.r.log.beat.late - 1000) <= 1000 / 60 + 1 &&
       lateR.r.log.impactDrawnAt >= lateR.impactT + 1000 - 1 && capR.r.log.beatLateCap != null && capR.r.log.impactDrawnAt == null && capR.decodes.length === 1 && capR.r.log.ready.afterglow == null &&
       capPair.fire === 1 && capPair.wash === 1 && capPair.fl === 1, J({ onT: onT.map((x) => [x.r.log.impactDrawnAt, x.impactT]), held: held(lateR), cap: [capR.r.log.beatLateCap, capR.decodes], capPair }));

    // Z5 · the gold on the classic wash timer, positional, released-before-decode, never two, never both in one frame
    const fastR = await lkRun(0, { vfxT: 0.78 });
    const hand = (x) => { const h = x.r.log.cues.find((c) => c.cue === 'handoff'), i = x.r.log.cues.find((c) => c.cue === 'impact'); return h && i ? h.planned - i.planned : null; };
    const lateGold = (() => { const h = lateR.r.log.cues.find((c) => c.cue === 'handoff'); return h && lateR.r.log.beat ? h.at - lateR.r.log.beat.at : null; })();   // the handoff after the REAL (late) beat
    const burnSrc = fnBody('fxLankaBurn') || '';
    ok('Z5 · THE GOLD ON THE GAME\'S OWN WASH TIMER: it starts the burn + ' + [hand(onT[0]), hand(fastR)].map((v) => v && v.toFixed(1)).join(' / ') + ' ms (Normal / Fast = (18/16) x vfxT x 1000 — the page\'s own timer, the same one the classic wash rides), POSITIONAL: behind a late beat it follows the REAL burn (handoff ' + (lateGold != null ? lateGold.toFixed(0) : '?') + ' ms after it); the fire is RELEASED before the gold decodes (the player\'s loaded atlas at each decode: ' + J(onT[0].decodes) + '), never two decoded, and no frame draws both plates (' + onT[0].frames.filter((f) => f[0] && f[1]).length + ' frames)',
       [0, 1].every((i) => Math.abs(hand(onT[i]) - 1462.5) < 1e-6) && Math.abs(hand(fastR) - 877.5) < 1e-6 && lateGold != null && Math.abs(lateGold - 1462.5) <= 1000 / 60 + 1 &&
       K.afterglowDelayMs === 18 / 16 * 1000 && /\(18\/16\)\*vfxT\(\)\*1000/.test(burnSrc) && onT.every((x) => J(x.decodes) === J([null, null]) && !x.frames.some((f) => f[0] && f[1]) && (x.r.log.bySegment.afterglow || [])[0] === 0) &&
       onT.every((x) => x.r.plan.segments[1].impact === null && x.r.plan.cues.filter((c) => c.cue === 'impact').length === 1), J({ n: [hand(onT[0]), hand(fastR)], lateGold, decodes: onT.map((x) => x.decodes) }));

    // Z6 · the damage beat: the chain owns the burn when its FIRE is decoded (the gold decodes later); the floaters always; never both, never neither
    const owned = await (async () => { const x = await lkRun(0, { stopAt: 1500 }), T = timersOn(x.S); let fire = 0, wash = 0, fl = 0; const f = () => fire++, w = () => wash++;
      x.S.fx.fxLankaBurn(f, w, () => fl++); const pendAfterBeat = x.S.fx.FX.pendingFire === f; T.run(); return { fire, wash, fl, pendAfterBeat, pendWash: x.S.fx.FX.pendingFire === w, gold: x.r.log.ready.afterglow }; })();
    const notDecoded = await (async () => { const S = sandbox({ halves: HL, ownerPi: (u) => (LKB[0].own[u] != null ? LKB[0].own[u] : 0), decodeGate: new Promise(() => {}) }); await S.fx.fxBoot(); await S.fx.fxPrefetch('lankadahan'); await flush();
      S.fx.fxCast(lkCard, LKB[0].events[0], LKB[0].events, {}); S.tick(16); const T = timersOn(S); let fire = 0, wash = 0, fl = 0; S.fx.fxLankaBurn(() => fire++, () => wash++, () => fl++); T.run(); return { fire, wash, fl, run: S.fx.FX.run }; })();
    const goldFails = await (async () => { let k = 0; const x = await lkRun(0, { stopAt: 1500, sb: { decodeFails: () => ++k === 2 } }), T = timersOn(x.S); let fire = 0, wash = 0, fl = 0;
      x.S.fx.fxLankaBurn(() => fire++, () => wash++, () => fl++); T.run(); for (let i = 0; i < 120 && !x.r.done; i++) { await flush(); x.S.tick(1000 / 60); } return { fire, wash, fl, errs: x.r.log.loadErrors.length }; })();
    ok('Z6 · THE BURN BEAT IS OWNED BY THE FIRE: with the fire decoded the chain owns the moment even though its GOLD is not (' + owned.gold + ') — the classic burn and wash stay silent (' + owned.fire + ' / ' + owned.wash + '), each held as the late fallback, and the +1 floaters still ride the classic timer (' + owned.fl + '); the fire NOT decoded by the beat → the classic pair, once each (' + notDecoded.fire + ' / ' + notDecoded.wash + ', floaters ' + notDecoded.fl + '), the chain stood down; a GOLD that fails to decode after the fire owned the burn fires the classic wash late, once (' + goldFails.wash + ', the burn ' + goldFails.fire + ')',
       owned.fire === 0 && owned.wash === 0 && owned.fl === 1 && owned.pendAfterBeat && owned.pendWash && owned.gold == null && notDecoded.fire === 1 && notDecoded.wash === 1 && notDecoded.fl === 1 && notDecoded.run === null &&
       goldFails.errs === 1 && goldFails.wash === 1 && goldFails.fire === 0 && goldFails.fl === 1, J({ owned, notDecoded, goldFails }));

    // Z7 · the caster seat from the FIRST damage target (both seats, and a staked-shaped view whose spent Astra has no uid)
    const z7 = [];
    for (const seat of [0, 1]) for (const staked of [false, true]) {
      const b = LKB[seat], src = b.events[0].sourceUid, S = sandbox({ halves: HL, ownerPi: (u) => (staked && u === src ? 0 : (b.own[u] != null ? b.own[u] : 0)) });
      await S.fx.fxBoot(); await S.fx.fxPrefetch('lankadahan'); await flush();
      const r = S.fx.fxCast(lkCard, b.events[0], b.events, {}), e = halfOfSeat(1 - seat), c = halfOfSeat(seat), pf = r && r.places[0], pg = r && r.places[1];
      const flush2 = (p, h, upper) => !!p && Math.abs(p.w - Math.min(h.width, p.w)) < 1e-6 && (upper ? Math.abs(p.y + p.h - h.bottom) < 1e-6 : Math.abs(p.y - h.top) < 1e-6);
      z7.push({ seat, staked, caster: r && r.plan.casterSeat, fireOnEnemy: flush2(pf, e, 1 - seat === 1), goldOnCaster: flush2(pg, c, seat === 1) });
    }
    ok('Z7 · THE CASTER SEAT FROM THE FIRST DAMAGE TARGET (ruling): both seats, the engine\'s own events, and a STAKED-shaped view whose spent Astra carries no uid (the lookup would answer seat 0): the caster is ' + z7.map((x) => x.caster).join(' / ') + ' — the FIRE sits divider-flush on the ENEMY half and the GOLD on the CASTER\'s, every time',
       z7.every((x) => x.caster === x.seat && x.fireOnEnemy && x.goldOnCaster), J(z7));

    // Z8 · the engine's edge cases
    const allDie = lkBuild(0, { foes: ['Ravana', 'Kalanemi'], foePw: 2 }), emptyMine = lkBuild(0, { friends: [] }), noFoes = lkBuild(0, { foes: [] });
    const z8 = await (async () => { const S = sandbox({ halves: HL, ownerPi: (u) => (allDie.own[u] != null ? allDie.own[u] : 0) }); await S.fx.fxBoot(); await S.fx.fxPrefetch('lankadahan'); await flush();
      const r = S.fx.fxCast(lkCard, allDie.events[0], allDie.events, {}), wants = []; for (const e of allDie.events.filter((x) => x.type === 'damage' || x.type === 'destroy')) { wants.push([e.type, !!S.fx.FX.beatWant]); S.fx.fxBeatFrom(e); }
      const S2 = sandbox({ halves: HL, ownerPi: (u) => (emptyMine.own[u] != null ? emptyMine.own[u] : 0) }); await S2.fx.fxBoot(); await S2.fx.fxPrefetch('lankadahan'); await flush();
      const r2 = S2.fx.fxCast(lkCard, emptyMine.events[0], emptyMine.events, {});
      const S3 = sandbox({ halves: HL }); await S3.fx.fxBoot(); await S3.fx.fxPrefetch('lankadahan'); await flush();
      const r3 = S3.fx.fxCast(lkCard, { type: 'play', abilityName: 'Lanka Dahan', sourceUid: 1 }, [{ type: 'play', abilityName: 'Lanka Dahan', sourceUid: 1 }], {});
      return { types: allDie.events.map((e) => e.type).join(','), clip: !!(r && r.plan.clip), wants, empty: { clip: !!(r2 && r2.plan.clip), gold: !!(r2 && r2.places[1]) }, zero: r3 }; })();
    const branch = between("else if (ev.type==='damage' && ev.abilityName==='Lanka Dahan')", "ft=ev.text||String(ev.amount); fk='down heavy'; }") || '';
    ok('Z8 · THE ENGINE\'S EDGE CASES: every enemy dies (' + z8.types + ') — the gate hears ONLY the first damage (listening before each: ' + J(z8.wants) + '); the caster\'s board EMPTY — the chain still plays and the gold washes the empty half, as the classic wash does (ruling); NO enemy Unit — the engine refuses the cast (' + noFoes.legal + '); a ZERO-damage cast (every hit prevented: only the play event) plans no clip and the burn branch never runs — nothing plays, as classic (ruling)',
       z8.clip && J(z8.wants) === J([['damage', true], ['destroy', false], ['damage', false], ['destroy', false]]) && z8.empty.clip && z8.empty.gold && noFoes.legal === false && z8.zero === null &&
       /if\(ev===evs\.find\(e=>e\.type==='damage'&&e\.abilityName==='Lanka Dahan'\)\)\{/.test(branch) && /fxLankaBurn\(fire, wash, floats\);/.test(branch) && (HTML.match(/fxLankaBurn\(fire, wash, floats\);/g) || []).length === 1 &&
       (HTML.match(/VFX\.sprLankaFire\(/g) || []).length === 1 && (HTML.match(/VFX\.sprLankaWash\(/g) || []).length === 1, J(z8));

    // Z9 · the prefetch: both packs with the card; both-ready rule; fails open to the classic pair
    const z9 = await (async () => { const S = sandbox(); S.ctx.G = { round: 1, players: [{ name: 'You', hand: [{ id: 'lankadahan' }] }, { name: 'Opponent', hand: [] }] }; await S.fx.fxBoot();
      S.fx.fxPrefetchHands(); await flush(); await flush(); await flush();
      const got = S.fetched.map((f) => f[0]), both = ['assets/manifest/effects/lankadahan_fire/atlas.webp', 'assets/manifest/effects/lankadahan_gold/atlas.webp'].every((u) => got.indexOf(u) >= 0);
      const u = 'assets/manifest/effects/lankadahan_gold/atlas.webp', S2 = sandbox({ fetchFail: (rel) => rel === u, halves: HL, ownerPi: (x) => (LKB[0].own[x] != null ? LKB[0].own[x] : 0) });
      S2.ctx.G = { round: 1, players: [{ name: 'You', hand: [{ id: 'lankadahan' }] }, { name: 'Opponent', hand: [] }] }; await S2.fx.fxBoot(); S2.fx.fxPrefetchHands(); await flush(); await flush(); await flush();
      const rec = S2.fx.ASSET_RETRY.s[Object.keys(S2.fx.ASSET_RETRY.s).find((k) => /lankadahan_gold\/atlas/.test(k))] || null;
      const r = S2.fx.fxCast(lkCard, LKB[0].events[0], LKB[0].events, {}), T = timersOn(S2); let fire = 0, wash = 0; S2.fx.fxLankaBurn(() => fire++, () => wash++, () => {}); T.run();
      return { both, ready: S.fx.fxReady('lankadahan'), fireOnly: S2.fx.fxReady('lankadahan'), retry: rec && { attempts: rec.attempts, inMs: Math.round(rec.nextAt - S2.now) }, cast: r, fire, wash }; })();
    ok('Z9 · THE PREFETCH (hand entry): Lanka Dahan entering a visible hand fetches BOTH packs\' bytes (ready ' + z9.ready + '); with the gold\'s bytes missing the chain is NOT ready (' + z9.fireOnly + ') — a failed atlas rides the shared retry (attempt ' + (z9.retry && z9.retry.attempts) + ', again in ' + (z9.retry && z9.retry.inMs) + ' ms) — the cast plans nothing and the classic pair plays, once each (' + z9.fire + ' / ' + z9.wash + '): a page whose fetches all fail sees today\'s game',
       z9.both && z9.ready === true && z9.fireOnly === false && z9.retry && z9.retry.attempts === 1 && z9.retry.inMs === 2000 && z9.cast === null && z9.fire === 1 && z9.wash === 1, J(z9));

    // Z10 · the device matrix, through the page's own player
    const DM = JSON.parse(fs.readFileSync(path.join(GAME, 'src', 'device_matrix.json'), 'utf8')).viewports, fit = [];
    DM.forEach((v) => [0, 1].forEach((seat) => {
      const up = { cx: v.vw / 2, cy: 60 + v.half.h / 2, top: 60, w: v.half.w, h: v.half.h }, lo = { cx: v.vw / 2, cy: 60 + 1.5 * v.half.h, top: 60 + v.half.h, w: v.half.w, h: v.half.h }, H = { 1: up, 0: lo };
      const P = EC.createPlayer({ now: () => 0, canvas: null, dpr: 2, halfOf: (s) => H[s], loadAtlas: () => ({ source: {}, bytes: 0, close() {} }), render() {}, sound() {} });
      const run = P.play({ events: LKB[seat].events }, LK, { before: null, after: null }, { mode: 'full', casterSeat: seat });
      run.places.forEach((p, k) => { const hs = k === 0 ? 1 - seat : seat, h = H[hs], m = k === 0 ? LF : LG, wFit = h.w * m.cellSize.h / m.cellSize.w <= h.h;
        fit.push({ vp: v.vw + 'x' + v.vh, layout: v.layout, cover: p.w / h.w, ok: p.w <= h.w + 1e-6 && p.h <= h.h + 1e-6 && (hs === 1 ? Math.abs(p.y + p.h - (h.top + h.h)) < 1e-6 : Math.abs(p.y - h.top) < 1e-6) && Math.abs(p.x + p.w / 2 - h.cx) < 1e-6 && (wFit ? Math.abs(p.w - h.w) < 1e-6 : Math.abs(p.h - h.h) < 1e-6) }); });
      P.skip();
    }));
    const port = fit.filter((x) => x.layout === 'portrait'), capped = [...new Set(fit.filter((x) => x.cover < 0.999).map((x) => x.vp))];
    ok('Z10 · THE DEVICE MATRIX, through the page\'s own player: all ' + DM.length + ' measured screens × both seats × both plates (' + fit.length + ' placements) — divider-flush (the edge nearest the divider on it), centred, inside the half, the full width of the half unless that would be taller than the half and then exactly its height; portrait coverage ' + (Math.min(...port.map((x) => x.cover)) * 100).toFixed(0) + '% of the width; the height cap engages only on ' + capped.join(', '),
       fit.length === DM.length * 4 && fit.every((x) => x.ok) && port.length > 0 && port.every((x) => Math.abs(x.cover - 1) < 1e-9), J(fit.filter((x) => !x.ok).slice(0, 4)));

    // Z11 · a skipped action ends the chain and leaves no wash behind
    const z11 = await (async () => { const x = await lkRun(0, { stopAt: 3300 }), T = timersOn(x.S); let fire = 0, wash = 0, fl = 0; x.S.fx.fxLankaBurn(() => fire++, () => wash++, () => fl++);
      const goldDrawn = (x.r.log.bySegment.afterglow || []).length; x.S.fx.fxSkip(); x.S.ctx.choreoSkip = true; T.run(); const after = (x.r.log.bySegment.afterglow || []).length; x.S.tick(1000 / 60);
      return { goldDrawn, done: x.r.done, run: x.S.fx.FX.run, fire, wash, fl, grew: (x.r.log.bySegment.afterglow || []).length - after }; })();
    ok('Z11 · SKIP: a skipped action mid-gold (' + z11.goldDrawn + ' gold cells drawn) ends the chain — the run is done and released, nothing draws after — and the classic wash timer, finding the skip, fires nothing (wash ' + z11.wash + ', floaters ' + z11.fl + '); skipChoreo (through fastForwardChoreo) and resetChoreo both stand the clip down',
       z11.goldDrawn > 0 && z11.done && z11.run === null && z11.wash === 0 && z11.fl === 0 && z11.grew === 0 && /fastForwardChoreo\(\)/.test(fnBody('skipChoreo') || '') && /fxSkip\(\)/.test(fnBody('fastForwardChoreo') || '') && /fxSkip\(\)/.test(fnBody('resetChoreo') || '') && /if\(choreoSkip\) return;/.test(burnSrc), J(z11));

    // Z12 · reduced motion: the classic path
    const z12 = await (async () => { const S = sandbox({ halves: HL, reduced: true, ownerPi: (u) => (LKB[0].own[u] != null ? LKB[0].own[u] : 0) }); await S.fx.fxBoot(); await S.fx.fxPrefetch('lankadahan'); await flush();
      const r = S.fx.fxCast(lkCard, LKB[0].events[0], LKB[0].events, {}), T = timersOn(S); let fire = 0, wash = 0; S.fx.fxLankaBurn(() => fire++, () => wash++, () => {}); T.run(); return { r, fire, wash }; })();
    ok('Z12 · REDUCED MOTION keeps the classic path: no clip is cast (' + z12.r + '), the classic pair is asked for once each (' + z12.fire + ' / ' + z12.wash + ') and each sprite itself stands down under reduced motion, exactly as before',
       z12.r === null && z12.fire === 1 && z12.wash === 1 && /function sprLankaFire\(cxp,cyp,boardW\)\{ if\(reducedMotion\(\)\|\|!ready\) return false;/.test(HTML) && /function sprLankaWash\(cxp,cyp,boardW\)\{ if\(reducedMotion\(\)\|\|!ready\) return false;/.test(HTML), J(z12));
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
