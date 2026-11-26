'use strict';
// RULES-FIX-1 · STAGE 1 — the screen at the end of a round, the card pictures, UNBIND for a Hero.  Run: node src/test_roundend.js
//
//   1 · THE HELD BOARD (1.1)  At a round end the board shows a display copy taken BEFORE the action, moved forward by the round-end
//                             events (engine untouched). Proven against the TRUE scoring board: an in-memory copy of src/engine.js with
//                             one hook after roundEndCardEffects (the repo file is never written) records the board the engine scored.
//                             Every card (place, power, Venom, bind) and both totals must match, over AI matches in every faction pair,
//                             every realm, launch and wave decks; plus the rare effects one by one.
//   2 · THE CARD PICTURES (1.2) The frame's name bakes the PRINTED power: every card in every deck asks for a file that exists, and
//                             so does a card whose live base moved (Nala's half-power copy, a permanent cut, a growth).
//   3 · UNBIND (1.3)           In the shipped page (jsdom): a bound Hero shows UNBIND and is freed by it; with several bound cards the
//                             board target bar picks which; the wire refusal is unchanged.
// The page is the shipped index.html unless DY_RE_HTML points at another copy (the failing-first proof runs it on the pre-change page).
// jsdom is borrowed from the site checkout's tests/node_modules (DY_WEB); absent → SKIPPED LOUDLY, a counted failure.
// THE GATE'S LIGHT SWEEP (GUIDE-1, owner ruling 5, 24 Nov 2026) — the default: E4 (the pace) at Normal only (both cards, both seats,
// 2 repeats) and E8 on the page with ONE play per card (Pashupatastra cast by seat 1 and read by seat 0, Brahmastra cast by seat 0 and
// read by seat 1). Same checks, same count (73), the E4 limit unchanged. DY_RE_FULL=1 runs the full sweep (E4 at all three speeds, E8's
// 8 plays) — REQUIRED on any task that touches the round end or the held play. The first line printed names the sweep that ran.
const fs = require('fs'), path = require('path'), vm = require('vm');
const GAME = path.resolve(__dirname, '..');
const FULL = process.env.DY_RE_FULL === '1';
console.log(FULL ? '· FULL sweep (DY_RE_FULL=1): E4 at Relaxed, Normal and Fast · E8 on the page, 8 plays' : '· LIGHT sweep (the gate default): E4 at Normal only · E8 on the page, one play per card — DY_RE_FULL=1 for the full sweep (required on round-end / held-play tasks)');
const WEB = process.env.DY_WEB || path.resolve(GAME, '..', 'divya-yuddha-web');
let HTML = fs.readFileSync(process.env.DY_RE_HTML || path.join(GAME, 'index.html'), 'utf8');
// DY_RE_BREAK=<name> breaks one guard of PASHU-ORDER-1 in memory (the file is never written), to prove the check that guards it bites
const BREAKS = {
  e1: ['if(f) f.c.power=1; } }   // engine damageUnit', '} }   // engine damageUnit'],
  e5: ['RE=null; reLive=null; return true;\n}', 'return true;\n}'],
  e7: ['return (p && HELD_PLAYS[p.abilityName]) ? p : null;', 'return p || null;'],
  e8: ['function heldCopyAny(g){ if (!g) return null;', 'function heldCopyAny(g){ if (!g) return null; if (g._view) return g;'],
  e9: ["if (heldLive() && ev.type!=='destroy' && clipHoldsBeat(ev)){", "if (false){"],   // WAVE1-CLIPS-1: the held board moves at the start of the beat, not in the impact frame
  e9b: ["'Agneyastra':1, 'Nagastra':1, 'Pavamana':1, 'Tamasa':1, 'Dharma Kavacha':1 };", "'Nagastra':1, 'Tamasa':1 };"],   // WAVE1-CLIPS-1: the three clip cards off the held road (the live board at the play, as before the ruling)
};
if (process.env.DY_RE_BREAK) { const br = BREAKS[process.env.DY_RE_BREAK]; if (!br || HTML.indexOf(br[0]) < 0) { console.log('✖ unknown or stale DY_RE_BREAK ' + process.env.DY_RE_BREAK); process.exit(2); } HTML = HTML.split(br[0]).join(br[1]); console.log('⚠ DY_RE_BREAK=' + process.env.DY_RE_BREAK + ' — one guard broken in memory'); }
let pass = 0, fail = 0;
const ok = (name, cond, detail) => { if (cond) { pass++; console.log('  ✓ ' + name); } else { fail++; console.log('  ✖ ' + name + (detail ? '\n      ' + detail : '')); } };
const J = (x) => JSON.stringify(x);
function mul(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// ═══ 1 · THE HELD BOARD ═══
console.log('── 1 · the held board, against the board the engine scored ──');
{
  const a = HTML.indexOf('function reCopy('), b = HTML.indexOf('function reDrawHeld('), m0 = HTML.indexOf('function mfSnap('), m1 = HTML.indexOf('\nfunction ', m0 + 1);
  ok('the page carries the held-board helpers (reCopy … heldFinish)', a > 0 && b > a);
  let eng = fs.readFileSync(path.join(__dirname, 'engine.js'), 'utf8');
  const HOOK = '  roundEndCardEffects(g);                            // WAVE 1 batch 3';
  ok('the truth hook point exists in the engine (endRound: after the round-end effects, before scoring)', eng.indexOf(HOOK) > 0);
  if (a > 0 && b > a && eng.indexOf(HOOK) > 0) {
    eng = eng.replace(HOOK, '  roundEndCardEffects(g); if (g.__truth) g.__truth(g);  //');   // in memory only
    const ctx = { module: { exports: {} }, Math, JSON, Set, Map, Array, Object, String, Number };
    vm.createContext(ctx);
    vm.runInContext(eng + '\n;var ME=0, OPP=1, G=null; function isViewState(){ return false; } var Q={ effPower:(g,pi,u)=>effPower(g,pi,u) };\n' +
      HTML.slice(a, b) + '\n' + (m0 > 0 ? HTML.slice(m0, m1) : '') + '\n;this.H={ heldCopyOf, heldApply, heldFinish }; this.mk=mkCard; this.CB=CARD_BY_NAME;', ctx);
    const E = ctx.module.exports, H = ctx.H;
    const key = (g) => [0, 1].map((s) => ['units', 'heroes'].map((z) => g.players[s][z].map((c) => (c.ghost ? 'ghost' : c.uid) + ':' + c.power + ':v' + (c.venom || 0) + (c.bound ? ':b' : '')).join(',')).join('/')).join(' || ');
    // advance a held copy through one action's round-end events, exactly as reRun does
    const advance = (held, g, evs) => { const gone = {}; evs.forEach((e, i) => H.heldApply(held, e, gone, g, evs[i + 1])); H.heldFinish(held, true); };
    const F = ['devas', 'asuras', 'vanaras', 'nagas'], R = E.REALMS.map((r) => r.id || r), N = +process.env.DY_RE_N || 400;
    let ends = 0, rowBad = 0, totBad = 0, sample = '', waveEnds = 0;
    for (const wave of [false, true]) for (let k = 0; k < N; k++) {
      const g = E.newGame({ p0Faction: F[k % 4], p1Faction: F[(k >> 2) % 4], rng: mul(5000 + k + (wave ? 77777 : 0)), realm: R[k % R.length], wave1: wave });
      let truth = null; g.__truth = (gg) => { truth = H.heldCopyOf(gg); };
      for (const s of [0, 1]) E.mulligan(g, s, E.aiMulliganPlan(g, s));
      let guard = 0;
      while (!g.over && guard++ < 400) {
        const held = H.heldCopyOf(g); delete held.__truth; const rh = g.roundHistory.length, rb = g.round, e0 = g.events.length;
        E.aiTakeTurn(g, g.turn);
        if (g.roundHistory.length > rh) {
          ends++; if (wave) waveEnds++;
          advance(held, g, g.events.slice(e0).filter((e) => e.round === rb));
          const h = g.roundHistory[g.roundHistory.length - 1];
          if (key(held) !== key(truth)) { rowBad++; if (!sample) sample = 'held ' + key(held) + '\n      true ' + key(truth); }
          if (E.totalPower(held, 0) !== h.t0 || E.totalPower(held, 1) !== h.t1) totBad++;
        }
      }
    }
    ok(`every card on the held board — place, power, Venom, bind, ghosts and tokens — equals the scored board at all ${ends} round ends (${waveEnds} with wave decks; ${N * 2} matches, every faction pair and realm)`, ends > 1000 && rowBad === 0, rowBad + ' differ\n      ' + sample);
    ok(`the held board's totals equal the round's recorded finals at all ${ends} round ends`, totBad === 0, totBad + ' differ');
    // the rare round-end effects, one at a time (several carry no event of their own — the held copy mirrors the engine rule)
    const one = (name, f0, f1, wave, setup) => {
      const g = E.newGame({ p0Faction: f0, p1Faction: f1, rng: mul(7), realm: 'mrityulok', wave1: wave }); g.players[0].hand = []; g.players[1].hand = [];
      const put = (s, n, o) => { const c = Object.assign(ctx.mk(ctx.CB[n]), o || {}); (c.t === 'hero' ? g.players[s].heroes : g.players[s].units).push(c); return c; };
      setup(g, put); g.turn = 1; E.pass(g, 1); g.turn = 0;
      let truth = null; g.__truth = (gg) => { truth = H.heldCopyOf(gg); };
      const held = H.heldCopyOf(g); delete held.__truth; const rb = g.round, e0 = g.events.length;
      E.pass(g, 0); advance(held, g, g.events.slice(e0).filter((e) => e.round === rb));
      ok('  ' + name, !!truth && key(held) === key(truth), 'held ' + key(held) + '\n      true ' + (truth && key(truth)));
    };
    one("Yama's ghost rises from a round-end Venom death (it counts 1)", 'devas', 'nagas', false, (g, put) => { put(0, 'Yama'); put(0, 'Deva Soldier', { power: 1 }); put(1, 'Naga Warrior'); });
    one('Amrita Kalasha revives a Venom death at 1', 'devas', 'nagas', false, (g, put) => { put(0, 'Deva Soldier', { aegis: true, power: 1 }); put(1, 'Naga Warrior'); });
    one('Kishkindha Oath: the warded Unit survives at 1, its witnesses rally +1', 'vanaras', 'nagas', false, (g, put) => { put(0, 'Vanara Scout', { ward: true, power: 1 }); put(0, 'Tara'); put(1, 'Naga Warrior'); });
    one('Uraga Colossus sheds a Venom after the drain (no event of its own)', 'nagas', 'devas', true, (g, put) => { put(0, 'Uraga Colossus', { venom: 2 }); put(1, 'Deva Soldier'); });
    one('Shankhapala moves a Venom (the event names only where it lands)', 'nagas', 'devas', true, (g, put) => { put(0, 'Shankhapala'); put(1, 'Deva Soldier', { venom: 2 }); put(1, 'Yama'); });
    one("Mahishi copies the strongest Unit (the event carries no amount)", 'asuras', 'devas', true, (g, put) => { put(0, 'Mahishi'); put(0, 'Ravana'); put(1, 'Deva Soldier'); });
    one('Kalpavriksha lifts the lowest to the highest', 'devas', 'asuras', true, (g, put) => { g.players[0].artifact = ctx.mk(ctx.CB['Kalpavriksha']); put(0, 'Deva Soldier'); put(0, 'Yama'); put(1, 'Tataka'); });
  }
}

// ═══ 7 · PASHU-ORDER-1 — THE HELD PLAY (E1, and E8's views): Brahmastra and Pashupatastra show the board from before the play, moved
//     one event at a time; after the last event the copy must equal the engine's board (place, power, base, Venom, bind, ward, tokens,
//     ghosts, the artifact). The page's own helpers, the engine as shipped (no hook needed: the truth is the board after the play).
console.log('\n── 7 · the held play: the copy equals the engine\'s board after every Brahmastra, Pashupatastra, Agneyastra and Nagastra (E1, E8) ──');
const W3 = process.env.DY_WEB3 || path.resolve(GAME, '..', 'divya-yuddha-web3'), MS = path.join(W3, 'services', 'match-server');
function extractFn(src, name) { const i = src.indexOf('function ' + name + '('); if (i < 0) throw new Error('cannot find function ' + name);
  let depth = 0; for (let k = src.indexOf('{', i); k < src.length; k++) { if (src[k] === '{') depth++; else if (src[k] === '}') { depth--; if (depth === 0) return src.slice(i, k + 1); } } throw new Error('unbalanced ' + name); }
{
  const a = HTML.indexOf('function reCopy('), b = HTML.indexOf('function reDrawHeld(');
  const helpers = ['heldPlayOf', 'heldCopyAny', 'heldStep', 'heldAlignTokens', 'heldMidFinish', 'heldKey'];
  const hasHelpers = helpers.every((n) => { const i = HTML.indexOf('function ' + n + '('); return i > a && i < b; });
  ok('E1 · the page carries the held-play helpers (' + helpers.join(', ') + ') beside the round-end ones', hasHelpers);
  if (!hasHelpers) { fail++; console.log('  ✖ E1/E8 NOT RUN — this page has no held play (today\'s page, or a broken copy)'); } else {
  const mkCtx = (view) => { const c = { module: { exports: {} }, Math, JSON, Set, Map, Array, Object, String, Number, RegExp }; vm.createContext(c);
    vm.runInContext(fs.readFileSync(path.join(__dirname, 'engine.js'), 'utf8') + '\n;var ME=0, OPP=1, G=null; ' +
      (view ? 'function isViewState(x){ return !!(x && x._view); } var Q={ effPower:(g,pi,u)=>isViewState(g) ? (u ? u.power : 0) : effPower(g,pi,u) };'
            : 'function isViewState(x){ return !!(x && x._view); } var Q={ effPower:(g,pi,u)=>effPower(g,pi,u) };') + '\n' +
      HTML.slice(a, b) + '\n;this.H={ heldCopyOf, heldCopyAny, heldApply, heldStep, heldMidFinish, heldKey, heldPlayOf }; this.mk=mkCard; this.CB=CARD_BY_NAME;', c); return c; };
  const ctx = mkCtx(false), E = ctx.module.exports, H = ctx.H;
  // one held play: the copy before, the engine's play, every event through the copy, then the turn's start
  const runHeld = (g, act) => { const held = H.heldCopyOf(g), e0 = g.events.length; act(); const evs = g.events.slice(e0);
    if (!H.heldPlayOf(evs)) return { skipped: true };
    const gone = {}; evs.forEach((e, i) => H.heldStep(held, e, gone, g, evs[i + 1], true)); H.heldMidFinish(held, g);   // atBeat: the silent plays (WAVE1-CLIPS-1 batch 2) land at their play's beat
    return { ok: H.heldKey(held) === H.heldKey(g), held: H.heldKey(held), live: H.heldKey(g), evs }; };
  // the sweep: full AI matches, every faction pair, every realm, launch and wave decks; at random turns the card goes into the hand and is cast
  const F = ['devas', 'asuras', 'vanaras', 'nagas'], R = E.REALMS.map((r) => r.id || r), NAMES = ['Pashupatastra', 'Brahmastra', 'Agneyastra', 'Nagastra', 'Pavamana', 'Tamasa', 'Dharma Kavacha'];   // WAVE1-CLIPS-1: + Agneyastra and Nagastra (batch 1), Pavamana, Tamasa and Dharma Kavacha (batch 2)
  const casts = {}, bad = {}, seats = [0, 0], shapes = new Set(); NAMES.forEach((n) => { casts[n] = 0; bad[n] = 0; });
  let sample = '', leapsFirst = 0;
  for (let k = 0; NAMES.some((n) => casts[n] < 450) && k < 9000; k++) {
    const wave = k % 2 === 1, rng = mul(91000 + k);
    const g = E.newGame({ p0Faction: F[k % 4], p1Faction: F[(k >> 2) % 4], rng, realm: R[k % R.length], wave1: wave });
    for (const s of [0, 1]) E.mulligan(g, s, E.aiMulliganPlan(g, s));
    let guard = 0;
    while (!g.over && guard++ < 400) {
      const s = g.turn, pl = g.players[s];
      if (!pl.passed && rng() < 0.3) {
        const name = NAMES[(NAMES.reduce((t, n) => t + casts[n], 0) + k) % NAMES.length], c = ctx.mk(ctx.CB[name]);
        pl.hand.unshift(c); pl.mustPlayUnit = false;
        if (E.playableIndices(g, s).indexOf(0) >= 0) {
          const r = runHeld(g, () => { if (pl.faction === 'vanaras' && E.canLeap(g, s) && rng() < 0.5) { const bl = E.bestLeap(g, s); if (bl) { E.doLeap(g, s, bl.leaper, bl.target, false); leapsFirst++; } } E.playCard(g, s, 0); });
          if (!r.skipped) { casts[name]++; seats[s]++; r.evs.forEach((e) => shapes.add(e.type + (e.type === 'block' || e.type === 'passive' || e.type === 'buff' ? ':' + e.abilityName : '')));
            if (!r.ok) { bad[name]++; if (!sample) sample = name + ' seat ' + s + '\n      held ' + r.held + '\n      live ' + r.live; } }
          continue;
        } else pl.hand.shift();
      }
      E.aiTakeTurn(g, s);
    }
  }
  ok(`E1 · THE SWEEP: after ${NAMES.map((n) => casts[n] + ' ' + n).join(', ')} casts in full AI matches (every faction pair and realm, launch and wave decks, both seats: ${seats.join(' / ')}; ${leapsFirst} after a free Leap in the same action), the held copy equals the engine's board every time (${shapes.size} event shapes seen)`,
    NAMES.every((n) => casts[n] >= 400 && bad[n] === 0) && seats[0] > 100 && seats[1] > 100, J(bad) + '\n      ' + sample);
  // the built boards: each shape a strike can produce, one at a time
  const built = (name, card, f0, f1, wave, setup, realm) => {
    const g = E.newGame({ p0Faction: f0, p1Faction: f1, rng: mul(11), realm: realm || 'mrityulok', wave1: wave });
    for (const s of [0, 1]) { const p = g.players[s]; p.hand = []; p.units = []; p.heroes = []; p.artifact = null; p.mulliganed = true; }
    const put = (s, n, o) => { const c = Object.assign(ctx.mk(ctx.CB[n]), o || {}); if (c.t === 'hero') g.players[s].heroes.push(c); else if (c.t === 'artifact') g.players[s].artifact = c; else g.players[s].units.push(c); return c; };
    setup(g, put); g.turn = 0; g.players[0].hand.unshift(ctx.mk(ctx.CB[card]));
    const legal = E.playableIndices(g, 0).indexOf(0) >= 0;
    const r = legal ? runHeld(g, () => E.playCard(g, 0, 0)) : { skipped: true };
    const saw = r.evs ? r.evs.map((e) => e.type + ':' + (e.abilityName || '')).join(' ') : '';
    ok('  E1 · ' + name, legal && !r.skipped && r.ok, 'legal ' + legal + '\n      held ' + r.held + '\n      live ' + r.live + '\n      events ' + saw);
    return saw;
  };
  built('Pashupatastra into Hiranyakashipu: the damage, then "floors at 1"', 'Pashupatastra', 'asuras', 'asuras', false, (g, put) => { put(0, 'Ravana'); put(0, 'Meghnad'); put(1, 'Hiranyakashipu', { power: 2 }); put(1, 'Tataka'); });
  built('Pashupatastra into a Vanara host under Rama’s Signet: "held at 1"', 'Pashupatastra', 'asuras', 'vanaras', false, (g, put) => { put(0, 'Ravana'); put(0, 'Meghnad'); put(1, 'Rama’s Signet'); put(1, 'Vanara Scout'); put(1, 'Tara'); });
  built('Pashupatastra into a Ratri Hymn round (no damage at all)', 'Pashupatastra', 'asuras', 'devas', true, (g, put) => { put(0, 'Ravana'); put(1, 'Deva Soldier'); put(1, 'Marut'); g.players[1].ratriRound = g.round; });
  built('Pashupatastra into Holika (unburnt) beside a Unit that dies', 'Pashupatastra', 'asuras', 'asuras', true, (g, put) => { put(0, 'Ravana'); put(0, 'Meghnad'); put(1, 'Holika'); put(1, 'Asura Berserker', { power: 1 }); });
  built('Pashupatastra into a Dharma-Shielded Unit (the shield does not stop it)', 'Pashupatastra', 'asuras', 'devas', false, (g, put) => { put(0, 'Ravana'); const u = put(1, 'Yama'); put(1, 'Marut', { power: 1 }); g.players[1].shieldUids = [u.uid]; });
  built('Pashupatastra kills an Amrita-blessed Unit: it revives at 1 at the row’s end; an enemy Simhika sees it', 'Pashupatastra', 'asuras', 'devas', true, (g, put) => { put(0, 'Ravana'); put(0, 'Simhika'); put(1, 'Marut', { power: 1, aegis: true }); put(1, 'Yama'); put(1, 'Deva Soldier'); });
  built('Pashupatastra kills a warded Vanara: it survives at 1 and the witnesses rally +1', 'Pashupatastra', 'asuras', 'vanaras', false, (g, put) => { put(0, 'Ravana'); put(1, 'Vanara Scout', { power: 1, ward: true }); put(1, 'Tara'); put(1, 'Nala'); });
  built('Pashupatastra kills beside Yama: his ghost rises (and takes the engine\'s uid)', 'Pashupatastra', 'asuras', 'devas', false, (g, put) => { put(0, 'Ravana'); put(0, 'Meghnad'); put(1, 'Marut', { power: 1 }); put(1, 'Yama'); put(1, 'Deva Soldier'); });
  built('Brahmastra through Yama, an old ghost and a revival: every death, the ghosts, the aegis', 'Brahmastra', 'devas', 'devas', false, (g, put) => { put(0, 'Indra'); put(1, 'Marut', { aegis: true }); put(1, 'Deva Soldier'); put(1, 'Yama'); g.players[1].units.push({ uid: 9001, id: 'ghost', n: 'Ghost of Agni', sub: '', t: 'unit', p: 1, r: 'C', power: 1, base: 1, ghost: true, txt: '' }); put(1, 'Kubera'); });
  built('Brahmastra under Raktabija’s Curse: the first death raises two Rakta tokens', 'Brahmastra', 'devas', 'asuras', true, (g, put) => { put(0, 'Marut'); put(1, 'Tataka'); put(1, 'Maricha'); g.players[1].raktabijaCurse = true; });
  built('Brahmastra into a Naga host under Ananta Coil (a coil per fallen Naga), Nirmoka spitting venom, Vishalakshi feeding', 'Brahmastra', 'nagas', 'nagas', true, (g, put) => { put(0, 'Vishalakshi the Pale'); put(0, 'Coil Sentry' in ctx.CB ? 'Coil Sentry' : 'Naga Dwarapala'); put(1, 'Ananta Coil'); put(1, 'Nirmoka', { venom: 1 }); put(1, 'Naga Warrior', { venom: 2 }); });
  built("Brahmastra into Kartikeya's Vanguard and Kartikeya: the death listeners and the permanent +1", 'Brahmastra', 'devas', 'devas', true, (g, put) => { put(0, 'Marut'); put(1, 'Kartikeya'); put(1, 'Kartikeya’s Vanguard' in ctx.CB ? 'Kartikeya’s Vanguard' : "Kartikeya's Vanguard"); put(1, 'Marut', { aegis: true }); });
  built('Pashupatastra doubled by Chandrahas, Chaos Surge on the caster, Bana and Berserker, Tripura shattered', 'Pashupatastra', 'asuras', 'asuras', false, (g, put) => { put(0, 'Chandrahas'); put(0, 'Bana Asura'); put(0, 'Asura Berserker'); put(1, 'Tripura'); put(1, 'Ravana'); put(1, 'Tataka'); });
  built('Pashupatastra in Patala (+1 to each hit)', 'Pashupatastra', 'asuras', 'devas', false, (g, put) => { put(0, 'Ravana'); put(0, 'Meghnad'); put(1, 'Yama'); put(1, 'Marut'); put(1, 'Deva Soldier'); }, 'patala');
  built('the next turn starts for the struck side: a sleeping Kumbhakarna wakes and sweeps 3, Kalanemi is unmasked (their flags clear on their own sweeps)', 'Pashupatastra', 'asuras', 'asuras', false, (g, put) => { put(0, 'Asura Berserker'); put(1, 'Kumbhakarna', { asleep: true }); put(1, 'Kalanemi', { revealPending: true }); });
  built('the next turn starts for the caster (the other side has passed): Deva Soldier steels +1 under Indra — a log line, no event', 'Brahmastra', 'devas', 'asuras', false, (g, put) => { put(0, 'Indra'); put(0, 'Deva Soldier'); put(0, 'Marut'); put(1, 'Tataka'); g.players[1].passed = true; });
  built('the Living Bridge fires for the struck side when a revival completes its line of four', 'Pashupatastra', 'asuras', 'vanaras', true, (g, put) => { put(0, 'Ravana'); put(1, 'The Living Bridge'); put(1, 'Vanara Scout', { power: 1, aegis: true }); put(1, 'Tara'); put(1, 'Nala'); put(1, 'Kishkindha Runner'); g.players[1].bridgeFiredRound = 0; });
  // WAVE1-CLIPS-1 (owner ruling, 25 Nov 2026): Agneyastra and Nagastra ride the held play too
  built('Agneyastra kills a Unit beside Yama: the 3 damage, the death and his ghost', 'Agneyastra', 'devas', 'devas', true, (g, put) => { put(0, 'Marut'); put(1, 'Marut', { power: 2 }); put(1, 'Yama'); });
  built('Agneyastra into Holika (unburnt: an Astra deals her nothing)', 'Agneyastra', 'devas', 'asuras', true, (g, put) => { put(0, 'Marut'); put(1, 'Holika'); });
  built('Agneyastra in Patala (+1: 4 damage)', 'Agneyastra', 'devas', 'asuras', true, (g, put) => { put(0, 'Marut'); put(1, 'Ravana'); }, 'patala');
  built('Nagastra: a Venom token on every enemy Unit, and the caster\'s Chaos Surge', 'Nagastra', 'asuras', 'devas', false, (g, put) => { put(0, 'Tataka'); put(1, 'Yama'); put(1, 'Marut'); put(1, 'Deva Soldier'); });
  built('Nagastra onto Units already poisoned (the tokens stack)', 'Nagastra', 'asuras', 'nagas', false, (g, put) => { put(0, 'Tataka'); put(1, 'Naga Archer', { venom: 1 }); put(1, 'Naga Warrior', { venom: 2 }); });
  // WAVE1-CLIPS-1 batch 2: the three silent plays — their effect lands on the copy at the play's beat
  built('Pavamana heals a wounded Unit and strips Venom: +1 per effect lifted', 'Pavamana', 'devas', 'nagas', false, (g, put) => { put(0, 'Yama', { power: 3 }); put(0, 'Marut', { venom: 2 }); put(0, 'Deva Soldier'); put(1, 'Naga Archer'); });
  built('Pavamana in the Rishi Mandala (the cast Mantra returns to the hand — the caster is found there)', 'Pavamana', 'devas', 'asuras', false, (g, put) => { put(0, 'Yama', { power: 2 }); put(0, 'Marut', { venom: 1 }); put(1, 'Tataka'); }, 'rishi');
  built('Pavamana with nothing to purify (the copy does not move)', 'Pavamana', 'devas', 'asuras', false, (g, put) => { put(0, 'Yama'); put(1, 'Tataka'); });
  built('Tamasa: the opponent skips their next turn, and the caster\'s Chaos Surge', 'Tamasa', 'asuras', 'devas', false, (g, put) => { put(0, 'Tataka'); put(0, 'Bana Asura'); put(1, 'Yama'); });
  built('Dharma Kavacha takes the artifact slot (a human designates by hand: no shield)', 'Dharma Kavacha', 'devas', 'asuras', false, (g, put) => { put(0, 'Yama'); put(0, 'Marut'); g.players[0].manualShield = true; put(1, 'Tataka'); });
  built('Dharma Kavacha replaces an artifact; the AI raises two shields on their own beats', 'Dharma Kavacha', 'devas', 'asuras', false, (g, put) => { put(0, 'Yama'); put(0, 'Marut'); put(0, 'Deva Soldier'); put(0, 'Amrita Kalasha'); put(1, 'Tataka'); });

  // E8 · THE STAKED ROAD — the server's REAL room and buildView (web3), read by the page's own viewToState; the copy is the OLD view
  let buildView = null, createRoom = null, ES = null;
  try { buildView = require(path.join(MS, 'src', 'redactedview.js')).buildView; createRoom = require(path.join(MS, 'src', 'match.js')).createRoom; ES = require(path.join(MS, 'src', 'engineguard.js')).loadGuardedEngine().engine; } catch (e) { buildView = null; }
  if (!buildView || !createRoom || !ES) { fail++; console.log('  ✖ E8 SKIPPED LOUDLY — the web3 checkout is absent (' + MS + '; set DY_WEB3).'); }
  else {
    const vctx = mkCtx(true), VH = vctx.H;
    const adapterSrc = extractFn(HTML, 'defById') + '\n' + extractFn(HTML, 'viewToState');
    const mkAdapter = (me) => new Function('DECKS', 'CARD_BY_NAME', 'let ME=' + me + ', OPP=' + (1 - me) + ', DEF_BY_ID=null; const isViewState=(x)=>!!(x&&x._view);\n' + adapterSrc + '\nreturn { viewToState };')(E.DECKS, ctx.CB);
    const hall = (v) => { const c = Object.assign({}, v); delete c.myName; delete c.oppName; return c; };
    let vcasts = 0, vbad = 0, inPlace = 0, drift = 0, vsample = '', vseats = [0, 0];
    for (let m = 0; m < 60; m++) {
      const [f0, f1] = [F[m % 4], F[(m >> 2) % 4]];
      const room = createRoom(ES, { seed: (0x5A11 * (m + 7)) >>> 0, seats: [{ address: '0x' + '1'.repeat(40), faction: f0 }, { address: '0x' + '2'.repeat(40), faction: f1 }] });
      const g = room.state, A = [mkAdapter(0), mkAdapter(1)], st = [null, null]; let cur = 0;
      const push = (lm) => { const sl = (g.events || []).slice(cur); cur = (g.events || []).length; for (const s of [0, 1]) st[s] = A[s].viewToState(hall(buildView({ E: ES }, room, 'm-held', s, lm, sl)), st[s]); };
      push(null); for (const s of [0, 1]) { room.apply(s, { type: 'mulligan', indices: [] }); push({ seat: s, type: 'mulligan' }); }
      let guard = 0, rr = mul(4242 + m);
      while (!g.over && guard++ < 300) {
        const s = room.turn, pl = g.players[s];
        if (!pl.passed && rr() < 0.3) {
          const name = NAMES[(vcasts + m) % 2], c = Object.assign({}, ctx.CB[name], { uid: 700000 + guard + m * 1000, power: 0, base: 0, ghost: false, lockedRound: 0, aegis: false, revivedShield: false, asleep: false, revealPending: false, venom: 0, doomed: false, disguisedAs: null, ward: false, bound: false, astraImmuneRound: 0, stolenBy: -1 });
          pl.hand.unshift(c);
          if (room.validate(s, { type: 'play', handIndex: 0, targetIndex: null }).ok) {
            const auraOf = () => { const m = {}; for (const pi of [0, 1]) for (const u of g.players[pi].units.concat(g.players[pi].heroes)) if (!u.ghost) m[u.uid] = ES.effPower(g, pi, u) - u.power; return m; };
            const auraBefore = auraOf();
            const before = [st[0], st[1]], frozen = before.map((x) => JSON.stringify(x)), held = before.map((x) => VH.heldCopyAny(x));
            room.apply(s, { type: 'play', handIndex: 0, targetIndex: null }); push({ seat: s, type: 'play', id: c.id, n: c.n });
            const auraAfter = auraOf();
            for (const me of [0, 1]) { const evs = st[me].events.slice(before[me].events.length); if (!VH.heldPlayOf(evs)) continue;
              const gone = {}; evs.forEach((e, i) => VH.heldStep(held[me], e, gone, st[me], evs[i + 1], true)); VH.heldMidFinish(held[me], st[me]); vcasts++; vseats[me]++;
              if (JSON.stringify(before[me]) !== frozen[me]) inPlace++;
              if (VH.heldKey(held[me]) !== VH.heldKey(st[me])) {
                // a read-time aura (Naga Warrior's count of Venom, Narada…) moves with no event: the view carries only the effective number, so the
                // copy cannot follow it without the server — the live board wins at the end (R8). Counted apart: same cards, same places, every field
                // equal but the power of a card no event of this play named.
                const abs = new Set(); evs.forEach((e) => { if (e.type === 'revive' || e.type === 'ward' || (e.type === 'block' && (e.abilityName === "Rama's Signet" || /floors at 1$/.test(e.text || '')))) (e.targetUids || []).forEach((u) => abs.add(+u)); });   // set to exactly 1 raw power
                const hk = VH.heldKey(held[me]).split(/[,|/]/), lk = VH.heldKey(st[me]).split(/[,|/]/);
                const auraOnly = hk.length === lk.length && hk.every((x, i) => { if (x === lk[i]) return true; const p = x.split(':'), q = lk[i].split(':'), u = +p[0];
                  return p[0] === q[0] && p.length === q.length && p.every((v, j) => j === 2 || v === q[j]) && (+p[2]) - (+q[2]) === (abs.has(u) ? 0 : (auraBefore[u] || 0)) - (auraAfter[u] || 0); });
                if (auraOnly) { drift++; continue; }
                vbad++; if (!vsample) vsample = name + ' read by seat ' + me + '\n      held ' + VH.heldKey(held[me]) + '\n      live ' + VH.heldKey(st[me]); } }
            continue;
          } else pl.hand.shift();
        }
        const d = ES.aiMove(g, s); let a = (d && d.play != null) ? { type: 'play', handIndex: d.play, targetIndex: null } : { type: 'pass' };
        if (a.type === 'play') { const sp = ES.targetSpec(g, s, pl.hand[d.play]); if (sp && sp.options && sp.options.length) a.targetIndex = 0; }
        if (!room.validate(s, a).ok) a = { type: 'pass' };
        const lm = a.type === 'play' ? { seat: s, type: 'play', id: pl.hand[a.handIndex].id, n: pl.hand[a.handIndex].n } : { seat: s, type: a.type };
        room.apply(s, a); push(lm);
      }
    }
    ok(`E8 · THE STAKED ROAD: ${vcasts} held plays read from the server's real views by both seats (${vseats.join(' / ')}) — the old view is copied, never changed in place (${inPlace} changed), and the copy equals the new view after the last event every time except ${drift} where a read-time aura moved with no event — each difference equal, to the point, to that card's aura change in the server's engine (its aura after the play where an event set it to exactly 1) (the view carries the effective number only; the live board wins at the end, R8)`,
      vcasts >= 200 && vseats[0] > 50 && vseats[1] > 50 && inPlace === 0 && vbad === 0, vbad + ' differ\n      ' + vsample);
  }
  }
}

// ═══ 2 · THE CARD PICTURES ═══ (and 3 · UNBIND) — both in the shipped page
let JSDOM = null, VirtualConsole = null, pending = null;
try { ({ JSDOM, VirtualConsole } = require(require.resolve('jsdom', { paths: [path.join(WEB, 'tests')] }))); } catch (e) { JSDOM = null; }
if (!JSDOM) { fail++; console.log('  ✖ SKIPPED LOUDLY — jsdom not found under ' + path.join(WEB, 'tests') + ' (set DY_WEB). Sections 2 and 3 did NOT run.'); }
else {
  function boot(query, o) {
    o = o || {};
    const errs = [], posted = [];
    const vc = new VirtualConsole();
    vc.on('jsdomError', (e) => errs.push(String(e && e.message))); vc.on('error', (...a) => errs.push(a.join(' '))); vc.on('log', (...a) => errs.push('console.log: ' + a.join(' ')));
    const scripts = [];
    const markup = HTML.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/g, (m, attrs, body) => { const src = /\bsrc="([^"?]+)/.exec(attrs); scripts.push(src ? fs.readFileSync(path.join(GAME, src[1]), 'utf8') : body); return ''; });
    const dom = new JSDOM(markup, { url: 'https://game.test/index.html' + query, pretendToBeVisual: true, runScripts: 'outside-only', virtualConsole: vc });
    const w = dom.window;
    w.matchMedia = (q) => ({ matches: o.reduce !== false && /reduce/.test(q), media: q, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
    const ctx2 = new Proxy({}, { get: (t, k) => k === 'measureText' ? () => ({ width: 10 }) : /^create(Linear|Radial)Gradient$|^createPattern$/.test(String(k)) ? () => ({ addColorStop() {} }) : k === 'getImageData' ? () => ({ data: new Uint8ClampedArray(4) }) : () => {} });
    w.HTMLCanvasElement.prototype.getContext = o.packs ? function () { const cv = this; return new Proxy({}, { get: (t, k) => k === 'drawImage' ? (...a) => { if (cv.id === 'effectclip' && a.length === 9) o.draws.push({ t: w.performance.now(), x: a[1], y: a[2] }); } : ctx2[k] }); } : () => ctx2;
    w.HTMLMediaElement.prototype.play = () => Promise.resolve(); w.HTMLMediaElement.prototype.pause = () => {}; w.HTMLMediaElement.prototype.load = () => {};
    w.fetch = () => Promise.resolve({ ok: false, status: 404, arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)), json: () => Promise.resolve({}), text: () => Promise.resolve('') });
    if (o.packs) {   // WAVE1-CLIPS-1 E9: the real effect packs from disk (assets/manifest only), a decoded-bitmap stand-in the atlas's true size, and every cell the clip draws
      const webpWH = (b) => { const t = b.toString('ascii', 12, 16); if (t === 'VP8X') return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)]; if (t === 'VP8L') { const v = b.readUInt32LE(21); return [1 + (v & 0x3fff), 1 + ((v >> 14) & 0x3fff)]; } if (t === 'VP8 ') return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff]; return [0, 0]; };
      w.fetch = (u) => { const pth = decodeURIComponent(new URL(u, 'https://game.test/index.html').pathname).replace(/^\//, ''), f = path.join(GAME, pth);
        if (pth.indexOf('assets/manifest/') !== 0 || !fs.existsSync(f)) return Promise.resolve({ ok: false, status: 404, arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)), json: () => Promise.resolve({}), text: () => Promise.resolve('') });
        const buf = fs.readFileSync(f);
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(buf.toString('utf8'))), text: () => Promise.resolve(buf.toString('utf8')), blob: () => { const bl = new w.Blob([buf]); bl.__wh = webpWH(buf); return Promise.resolve(bl); } }); };
      w.createImageBitmap = (bl) => Promise.resolve({ width: bl.__wh[0], height: bl.__wh[1], close() {} });
      // WAVE1-CLIPS-1 FINAL: a phone's layout (390 px board) — the board-sized plates need the board's frame and its rows (jsdom lays out nothing)
      const R = (l, t, wd, h) => ({ left: l, top: t, width: wd, height: h, right: l + wd, bottom: t + h, x: l, y: t });
      w.Element.prototype.getBoundingClientRect = function () {
        if (this.id === 'field') return R(0, 100, 390, 460);
        const cl = this.classList;
        if (cl && cl.contains('half')) return cl.contains('opp') ? R(0, 100, 390, 229) : R(0, 331, 390, 229);
        if (cl && cl.contains('bc')) { const top = this.closest('#punits') ? 331 : this.closest('#ounits') ? 100 : null; if (top != null) { const i = [...this.parentNode.children].indexOf(this); return R(20 + i * 66, top + 70, 60, 80); } }
        return R(0, 0, 0, 0); };
    }
    w.scrollTo = () => {};
    if (o.core) { w.postMessage = (m) => posted.push(JSON.parse(JSON.stringify(m))); w.eval(o.core); }   // puzzle mode: the parent page's puzzle code, and the frame's words to its parent recorded
    w.eval(scripts.join('\n;\n') + '\n;window.__T = { get G(){ return G; }, get Pz(){ return typeof Pz==="undefined" ? null : Pz; }, get ME(){ return ME; }, get OPP(){ return OPP; }, get RE(){ return RE; }, get reLive(){ return reLive; }, get choreoActive(){ return choreoActive; }, get bannerQ(){ return bannerQ; }, DECKS, CARD_BY_NAME };');
    return { w, T: w.__T, errs, posted };
  }
  const P = boot('');
  const { w, T } = P;
  const $ = (id) => w.document.getElementById(id);
  const onDisk = (src) => fs.existsSync(path.join(GAME, src.split('?')[0]));

  console.log('\n── 2 · the card pictures: the printed power, never a moved base ──');
  {
    const all = []; for (const f in T.DECKS) for (const c of T.DECKS[f]) all.push([f, c]);
    // a card with NO frame of any power on disk is an art gap, not a naming fault — named, and kept out of the naming check
    const files = fs.readdirSync(path.join(GAME, 'assets', 'cards'));
    const stemOf = (src) => src.split('?')[0].split('/').pop().replace(/(_P-?\d+)?_r\w+\.png$/, '');
    const noArt = all.filter(([f, d]) => !files.some((x) => x.replace(/(_P-?\d+)?_r\w+\.png$/, '') === stemOf(w.cardArtSrc(w.mkCard(d), f)))).map(([f, d]) => d.n);
    const missing = all.filter(([f, d]) => noArt.indexOf(d.n) < 0 && !onDisk(w.cardArtSrc(w.mkCard(d), f))).map(([f, d]) => d.n);
    ok(`every card in every deck (${all.length - noArt.length} of ${all.length}) asks for its frame by its printed power, and the file is on disk` + (noArt.length ? ` — no frame of any power yet (art gap): ${noArt.join(', ')}` : ''), all.length >= 176 && missing.length === 0 && noArt.length <= 1, missing.slice(0, 5).join(', '));
    // the moved-base cases, made by the engine itself where a launch card does it (Nala), by the printed rule for the wave cards
    w.startGame('vanaras', 'asuras'); const G = T.G, me = G.players[T.ME];
    me.units = []; me.hand = [w.mkCard(T.CARD_BY_NAME['Nala']), w.mkCard(T.CARD_BY_NAME['Vanara Warrior'])]; G.turn = T.ME; G.players[T.OPP].passed = false;
    w.playCard(G, T.ME, 0);
    const copy = me.units.find((u) => u.id === 'warrior');
    const nalaSrc = copy ? w.cardArtSrc(copy, 'vanaras') : '';
    ok(`Nala's half-power copy of Vanara Warrior (base ${copy && copy.base}) asks for the printed P3 frame, which is on disk (${nalaSrc.split('/').pop()})`, !!copy && copy.base === 2 && /_P3_rCommon\.png/.test(nalaSrc) && onDisk(nalaSrc), nalaSrc);
    const moved = [['Surpanakha', -1, 'a permanent −1 cut'], ['Pisacha Skirmisher', -1, 'the round-end decay'], ['Dawn Sentinel', +1, 'a round-end growth'], ['Vishalakshi the Pale', +2, 'a venom-death feast'], ['Kumuda', +2, 'a Leap swell']];
    for (const [n, d, why] of moved) { const c = w.mkCard(T.CARD_BY_NAME[n]); c.base += d; c.power += d; const src = w.cardArtSrc(c, null);
      ok(`  ${n} after ${why} (base ${c.base}) still asks for its printed P${T.CARD_BY_NAME[n].p} frame, on disk`, src.indexOf('_P' + T.CARD_BY_NAME[n].p + '_') > 0 && onDisk(src), src); }
    const mar = w.mkCard(T.CARD_BY_NAME['Maricha']); const surya = T.CARD_BY_NAME['Yama']; Object.assign(mar, { id: surya.id, n: surya.n, sub: surya.sub, r: surya.r, txt: surya.txt, base: surya.p, power: surya.p });
    const marSrc = w.cardArtSrc(mar, 'asuras');
    ok(`a Maricha copy of Yama still shows Yama's own frame (${marSrc.split('/').pop()})`, /Devas_Unit_Yama_P\d+_r\w+\.png/.test(marSrc) && onDisk(marSrc), marSrc);
  }

  console.log('\n── 3 · UNBIND frees a bound Hero; several bound → the target bar picks ──');
  {
    const fresh = (setup) => { w.resetChoreo(); w.startGame('vanaras', 'nagas'); const G = T.G, me = G.players[T.ME]; G.turn = T.ME; me.passed = false; G.players[T.OPP].passed = false; w.pump = function () {}; setup(G, me); w.render(); return G; };
    const visible = (id) => !$(id).classList.contains('hidden');
    // a bound Hero alone (Takshaka + Nagapasha binds a Hero; the round reset frees Units only)
    let G = fresh((G, me) => { me.units = []; const bali = w.mkCard(T.CARD_BY_NAME['Bali']); bali.bound = true; me.heroes = [bali]; });
    const bali = G.players[T.ME].heroes[0];
    ok('a bound Hero alone: UNBIND shows on your turn', visible('unbindbtn'));
    $('unbindbtn').click();
    ok('  …one tap frees the Hero, and the turn passes (unbinding costs your turn)', bali.bound === false && G.turn === T.OPP, J({ bound: bali.bound, turn: G.turn }));
    // a bound Unit and a bound Hero → the picker
    G = fresh((G, me) => { const u = w.mkCard(T.CARD_BY_NAME['Vanara Warrior']); u.bound = true; const s = w.mkCard(T.CARD_BY_NAME['Tara']); const h = w.mkCard(T.CARD_BY_NAME['Bali']); h.bound = true; me.units = [u, s]; me.heroes = [h]; });
    const [bu, su] = G.players[T.ME].units, bh = G.players[T.ME].heroes[0];
    $('unbindbtn').click();
    const tgt = [...w.document.querySelectorAll('#field .bc.targetable')].map((e) => +e.dataset.uid).sort();
    ok('several bound: the tap opens the target bar and lights exactly the bound cards (the free Unit is not offered)', J(tgt) === J([bu.uid, bh.uid].sort()) && !!w.document.body.textContent.match(/Unbind: tap a glowing target/) && bu.bound && bh.bound, J({ tgt, want: [bu.uid, bh.uid] }));
    w.document.querySelector(`#field .bc[data-uid="${bh.uid}"]`).click();
    ok('  …tapping the bound Hero frees the Hero only; the bound Unit stays bound; the turn passes', bh.bound === false && bu.bound === true && su.bound === false && G.turn === T.OPP, J({ hero: bh.bound, unit: bu.bound, turn: G.turn }));
    // the wire refusal is unchanged (Stage 2 brings the online word)
    const Wp = boot('?wire=1');
    Wp.w.onWireMessage({ origin: Wp.w.location.origin, source: Wp.w.parent, data: { type: 'wire:start', matchId: 'm-rf1-unbind', seat: 0, seed: 4242, p0Faction: 'vanaras', p1Faction: 'nagas' } });
    const WG = Wp.T.G, wme = WG.players[Wp.T.ME]; const wh = Wp.w.mkCard(Wp.T.CARD_BY_NAME['Bali']); wh.bound = true; wme.heroes = [wh]; WG.turn = Wp.T.ME;
    Wp.w.document.getElementById('unbindbtn').click();
    ok('at a wire table UNBIND still refuses (no online word yet) and frees nothing', wh.bound === true && /Unbinding is not available at a wire table yet\./.test(Wp.w.document.body.textContent), J({ bound: wh.bound }));
  }
  console.log('\n── 4 · leaving while a round end shows leaves nothing behind (menu · rematch · a Story chapter) ──');
  pending = (async () => {
    const W = (ms) => new Promise((r) => setTimeout(r, ms));
    const until = async (fn, ms) => { const t = Date.now(); while (!fn()) { if (Date.now() - t > ms) return false; await W(10); } return true; };
    const banner = () => { const b = $('banner'); return b && !b.classList.contains('hidden') ? b.textContent : ''; };
    // a round-ending pass (you 9 · them 4, you lead round 2): the sequence takes the lock and holds the board
    const midSequence = async () => {
      w.resetChoreo(); w.startGame('devas', 'asuras'); const G = T.G, me = G.players[T.ME], op = G.players[T.OPP];
      w.pump = function () {}; G.realm = 'mrityulok'; me.mulliganed = op.mulliganed = true; $('mulligan').classList.add('hidden');
      me.units = [w.mkCard(T.CARD_BY_NAME['Yama']), w.mkCard(T.CARD_BY_NAME['Deva Soldier'])]; op.units = [w.mkCard(T.CARD_BY_NAME['Tataka'])]; me.heroes = []; op.heroes = [];
      op.passed = true; me.passed = false; G.turn = T.ME; w.render(); await W(50);
      $('passbtn').click(); await W(300);
      return { G, held: !!T.RE && !!T.reLive && T.choreoActive, locked: $('choreolayer').classList.contains('locked'), pass: /YOU PASSED/.test(banner()) };
    };
    const leaves = [
      ['the main menu', () => w.showLanding()],
      ['a rematch', () => w.startGame('devas', 'asuras')],
      ['a Story chapter', () => w.startStoryChapter('b1c1')],
    ];
    for (const [name, go] of leaves) {
      const m = await midSequence();
      go();
      const after = { RE: T.RE === null && T.reLive === null, lock: !$('choreolayer').classList.contains('locked') && !T.choreoActive, banner: banner() === '' && T.bannerQ.length === 0 };
      // the old sequence's own clock runs out (its pass 1.5 s, still frame 0.9 s, result 1.8 s): nothing of it may surface
      const seen = []; const iv = setInterval(() => { const b = banner(); if (b && seen.indexOf(b) < 0) seen.push(b); }, 25);
      await W(5200); clearInterval(iv);
      const stray = seen.filter((b) => /PASSED|ROUND 1 —|YOU \d+ · OPPONENT/.test(b));
      ok(`leaving for ${name} mid-sequence: no held board, no lock, no banner — and none of the old round end surfaces later`,
        m.held && m.locked && m.pass && after.RE && after.lock && after.banner && stray.length === 0 && T.RE === null, J({ before: { held: m.held, locked: m.locked, pass: m.pass }, after, stray }));
    }
    ok('the page ran clean in the DOM: no script error, no console.log', P.errs.length === 0, P.errs.slice(0, 3).join(' | '));

    // ═══ 5 · NO NEGATIVE SCORE (Stage 1 follow-up, item 2) — the wide poisoned board (8 poisoned Units a side), motion on ═══
    console.log('\n── 5 · a drained card counts 0 until its death is shown; no total reads below 0 ──');
    {
      const M = boot('', { reduce: false }), mw = M.w, MT = M.T, m$ = (id) => mw.document.getElementById(id);
      mw.resetChoreo(); mw.startGame('devas', 'nagas'); const G = MT.G, me = G.players[MT.ME], op = G.players[MT.OPP];
      mw.pump = function () {}; G.realm = 'mrityulok'; me.mulliganed = op.mulliganed = true; m$('mulligan').classList.add('hidden');
      const mk = (n, x) => Object.assign(mw.mkCard(MT.CARD_BY_NAME[n]), x);
      me.units = Array.from({ length: 8 }, (_, i) => mk(i % 2 ? 'Deva Soldier' : 'Marut', { venom: 2 })); op.units = Array.from({ length: 8 }, (_, i) => mk(i % 2 ? 'Naga Warrior' : 'Naga Archer', { venom: 1 }));
      me.heroes = []; op.heroes = []; me.artifact = op.artifact = null; op.passed = true; me.passed = false; G.turn = MT.ME;
      mw.eval('speedMult=0.05; cDelay=()=>Promise.resolve();');   // the same sequence, quickly (its order and numbers do not depend on the pace)
      mw.render(); await W(50);
      const plaques = [], cards = [], raw = [];
      const sn = mw.snapTo; mw.snapTo = function (a, b) { if (MT.RE) plaques.push([a, b]); return sn.apply(this, arguments); };
      const rd = mw.reDrawHeld; mw.reDrawHeld = function () { const r = rd.apply(this, arguments);
        if (MT.RE) { raw.push([0, 1].map((s) => MT.RE.g.players[s].units.reduce((t, u) => t + (u.ghost || u.bound ? 0 : u.power), 0)));
          for (const e of mw.document.querySelectorAll('#field .bc .medallion')) cards.push(parseInt(e.textContent, 10)); }
        return r; };
      m$('passbtn').click();
      await until(() => !MT.choreoActive && !MT.RE, 60000);
      const h = G.roundHistory[G.roundHistory.length - 1];
      const minPlaque = Math.min(...plaques.flat()), minCard = Math.min(...cards), minRaw = Math.min(...raw.flat());
      ok(`the wide poisoned board drains below 0 on the held board (lowest raw side total ${minRaw}), yet no plaque reads below 0 (lowest ${minPlaque} over ${plaques.length} reads) and no card number below 0 (lowest ${minCard} over ${cards.length})`,
        plaques.length > 10 && cards.length > 50 && minRaw < 0 && minPlaque >= 0 && minCard >= 0, J({ minRaw, minPlaque, minCard }));
      const fin = plaques[plaques.length - 1];
      ok(`the final numbers are unchanged: the plaques settle on the round's recorded finals (${h['t' + MT.ME]}–${h['t' + MT.OPP]})`, !!fin && fin[0] === h['t' + MT.ME] && fin[1] === h['t' + MT.OPP], J({ fin, h }));
      mw.snapTo = sn; mw.reDrawHeld = rd;
      ok('  …and that page ran clean too', M.errs.length === 0, M.errs.slice(0, 3).join(' | '));
    }

    // ═══ 6 · THE DAILY PUZZLE (Stage 1 follow-up, item 1) — the report once the finals settle; a reset under the banner leaves nothing ═══
    console.log('\n── 6 · puzzle mode: the report does not wait for the result banner; a reset while it shows leaves nothing behind ──');
    {
      const CORE = path.join(WEB, 'play', 'daily', 'puzzle-core.js'), LISTP = path.join(WEB, 'play', 'daily', 'puzzles.json');
      if (!fs.existsSync(CORE) || !fs.existsSync(LISTP)) { fail++; console.log('  ✖ SKIPPED LOUDLY — the site\'s puzzle code not found under ' + WEB + ' (set DY_WEB). Section 6 did NOT run.'); }
      else {
        const RAW = JSON.parse(fs.readFileSync(LISTP, 'utf8')), LIST = Array.isArray(RAW) ? RAW : RAW.puzzles;
        for (const reduce of [false, true]) {
          const Z = boot('?puzzle=1', { reduce, core: fs.readFileSync(CORE, 'utf8') }), zw = Z.w, ZT = Z.T, z$ = (id) => zw.document.getElementById(id);
          const say = (d) => zw.onPuzzleMessage({ origin: zw.location.origin, source: zw.parent, data: JSON.parse(JSON.stringify(d)) });
          const zb = () => { const b = z$('banner'); return b && !b.classList.contains('hidden') ? b.textContent : ''; };
          const results = () => Z.posted.filter((m) => m.type === 'puzzle:result');
          const P0 = LIST[0];
          say({ type: 'puzzle:load', puzzle: P0 });
          await until(() => Z.posted.some((m) => m.type === 'puzzle:loaded'), 30000);
          z$('passbtn').click();   // End turn: the opponent has passed, so this ends the round
          await until(() => results().length === 1, 30000);
          const atReport = { held: !!ZT.RE, banner: zb(), q: ZT.bannerQ.length };
          ok(`${reduce ? 'reduced motion' : 'motion on'}: the report is sent while the round end still shows (held board up, the result banner not yet shown or still queued)`,
            results().length === 1 && atReport.held && !/ROUND \d —/.test(atReport.banner), J(atReport));
          await until(() => /ROUND \d —/.test(zb()), 15000);
          const bannerUp = zb();
          say({ type: 'puzzle:reset' });   // a new try while the result banner shows
          await until(() => Z.posted.filter((m) => m.type === 'puzzle:loaded').length >= 2, 30000);
          const after = { RE: ZT.RE === null && ZT.reLive === null, lock: !z$('choreolayer').classList.contains('locked') && !ZT.choreoActive, banner: zb() === '' && ZT.bannerQ.length === 0, round: ZT.G.round === P0.round || ZT.G.roundHistory.length === (ZT.Pz && ZT.Pz.roundsAtLoad), tries: ZT.Pz && ZT.Pz.tries };
          const seen = []; const iv = setInterval(() => { const b = zb(); if (b && seen.indexOf(b) < 0) seen.push(b); }, 25);
          await W(4000); clearInterval(iv);
          const posts = results().length;
          ok(`  …a reset while the banner shows ("${bannerUp.slice(0, 22)}…") leaves nothing behind: no held board, no lock, no banner, no second report — and nothing of the old round end surfaces later`,
            /ROUND \d —/.test(bannerUp) && after.RE && after.lock && after.banner && after.tries === 2 && posts === 1 && seen.length === 0 && !ZT.Pz.reported, J({ after, seen, posts }));
          ok('  …that page ran clean', Z.errs.length === 0, Z.errs.slice(0, 3).join(' | '));
        }
      }
    }

    // ═══ 8 · PASHU-ORDER-1 — THE HELD PLAY ON THE PAGE (E2–E8): motion on, real timers, the shipped page ═══
    console.log('\n── 8 · the held play on the page: nothing moves before its own beat; each death is the real card; the pace is today\'s (E2–E8) ──');
    {
      const M = boot('', { reduce: false }), mw = M.w, MT = M.T, m$ = (id) => mw.document.getElementById(id);
      const notes = []; { const fn = mw.fxNote; mw.fxNote = function (kind, detail) { notes.push(Object.assign({ kind }, detail || {})); return fn.apply(this, arguments); }; }   // the battle log's diagnostics, as they are written
      const CASTER = { Pashupatastra: 'asuras', Brahmastra: 'devas', Agneyastra: 'devas', Nagastra: 'asuras', Pavamana: 'devas', Tamasa: 'asuras', 'Dharma Kavacha': 'devas' }, OWN = { asuras: ['Tataka', 'Maricha'], devas: ['Deva Soldier', 'Marut'] };
      const ROWS = ['oheroes', 'ounits', 'punits', 'pheroes'];
      const sigOf = (el) => [...el.children].filter((c) => c.tagName !== 'IMG').map((c) => c.className + '=' + c.textContent).join(';') + '|' + ['bound', 'warded', 'ghostc', 'stolen'].filter((k) => el.classList.contains(k)).join(',');
      const hudNow = () => [m$('part') ? m$('part').textContent + '|' + m$('part').className : '', m$('oart') ? m$('oart').textContent + '|' + m$('oart').className : '', m$('turnind').textContent];
      const rowsNow = () => ROWS.map((id) => [...m$(id).querySelectorAll('.bc')].map((el) => ({ u: el.classList.contains('held-gap') ? 'gap' : el.dataset.uid, s: sigOf(el), h: el.style.visibility === 'hidden' })));   // a kept space is a slot too
      // a board the way a match would have it, the caster at `seat` (0 = the player, 1 = the opponent), on the solo road or the free wire road
      const lay = (card, seat, board, speed, road) => {
        mw.resetChoreo();
        const cf = CASTER[card], pf = seat === 0 ? cf : 'asuras', of = seat === 0 ? 'asuras' : cf;
        if (road === 'wire') mw.startWireMatch({ seat: 0, matchId: 'm-held', seed: 4242, p0Faction: pf, p1Faction: of }); else mw.startGame(pf, of);
        const G = MT.G, me = G.players[MT.ME], op = G.players[MT.OPP], cast = G.players[seat], struck = G.players[1 - seat];
        mw.pump = function () {}; G.realm = 'mrityulok'; me.mulliganed = op.mulliganed = true; m$('mulligan').classList.add('hidden');
        const mk = (n, x) => Object.assign(mw.mkCard(MT.CARD_BY_NAME[n]), x || {});
        for (const p of [me, op]) { p.units = []; p.heroes = []; p.artifact = null; p.passed = false; p.astrasThisRound = 0; }
        cast.units = OWN[cf].map((n, k) => card === 'Pavamana' ? mk(n, k ? { venom: 2 } : { power: 1 }) : mk(n));   // WAVE1-CLIPS-1 batch 2: Pavamana needs something to purify (a wound, two Venom tokens)
        struck.units = [mk('Kalanemi', { power: 1, base: 1 }), mk('Meghnad', { power: 6 }), mk('Ravana', { power: 7 })];
        if (board === 'five') struck.units.push(mk('Bana Asura'), mk('Kali Asura', { power: 1, aegis: true }));
        cast.hand = [mk(card)]; G.turn = seat; G.over = false;
        mw.setSpeed(speed); mw.render(); return G;
      };
      // one play: every beat (playEvent) and, when asked, the board every 4 ms from the act to the release
      const play = async (G, seat, sample, road) => {
        const beats = [], samples = [], t0 = mw.performance.now(); const pe = mw.playEvent;
        mw.playEvent = function (ev) { const b = { t: mw.performance.now() - t0, ev }; beats.push(b); const r = pe.apply(this, arguments); Promise.resolve(r).then(() => { b.tEnd = mw.performance.now() - t0; }); return r; };   // tEnd: when this beat ended (a silent play's effect lands there)
        const iv = sample ? setInterval(() => samples.push({ t: mw.performance.now() - t0, rows: rowsNow(), hud: hudNow(), clones: [...m$('victimlayer').children].map((n) => n.dataset.uid), boxes: mw.document.querySelectorAll('.dissolve-clone').length, held: !!MT.RE }), 4) : null;
        const pre = rowsNow(), preHud = hudNow();
        if (road === 'wire') mw.runAction(() => mw.wireApply({ seat, type: 'play', handIndex: 0, targetIndex: null }), { actor: seat });
        else mw.runAction(() => mw.playCard(G, seat, 0), { actor: seat });
        await until(() => !MT.choreoActive, 30000); await W(80);
        if (iv) clearInterval(iv); mw.playEvent = pe;
        return { beats, samples, pre, preHud, seat, post: rowsNow(), RE: MT.RE, reLive: MT.reLive };
      };
      // E2 · from the act to each card's own beat: no card leaves, moves, arrives or changes its number, mark or badge
      // WAVE1-CLIPS-1 batch 2: a SILENT play (Pavamana, Tamasa, Dharma Kavacha — no event of its own names a card) lands at the END of its play beat:
      // every card's beat is then that moment at the latest, and the artifact chips and the turn indicator (hudNow) must not change before it either
      const SILENT = { Pavamana: 1, Tamasa: 1, 'Dharma Kavacha': 1 };
      const e2 = (r) => { const bad = []; const sb = r.beats.find((x) => x.ev.type === 'play' && SILENT[x.ev.abilityName]), sEnd = sb ? (sb.tEnd != null ? sb.tEnd : Infinity) : Infinity;
        const tOf = (u) => { const b = r.beats.find((x) => (x.ev.targetUids || []).map(String).indexOf(String(u)) >= 0); return Math.min(b ? b.t : Infinity, sEnd); };
        if (sb && r.preHud) for (const smp of r.samples) { if (!(smp.t < sEnd - 2 && smp.hud)) continue;
          if (smp.hud[0] !== r.preHud[0] || smp.hud[1] !== r.preHud[1]) { bad.push('an artifact chip changed at ' + smp.t.toFixed(0) + ' ms, before the silent beat ended at ' + sEnd.toFixed(0) + ': ' + JSON.stringify(smp.hud)); break; }
          if (sb.ev.abilityName === 'Tamasa' && r.seat === 0 && smp.hud[2] !== 'OPPONENT…') { bad.push('the turn indicator showed the skip ("' + smp.hud[2] + '") at ' + smp.t.toFixed(0) + ' ms, before the slam at ' + sEnd.toFixed(0)); break; } }
        const firstAny = Math.min(...r.beats.filter((b) => (b.ev.targetUids || []).length).map((b) => b.t));
        const preAt = {}; r.pre.forEach((row, ri) => row.forEach((c, ci) => { preAt[c.u] = { ri, ci, s: c.s }; }));
        for (const smp of r.samples) {
          if (smp.t < firstAny - 2 && JSON.stringify(smp.rows.map((row) => row.map((c) => c.u))) !== JSON.stringify(r.pre.map((row) => row.map((c) => c.u)))) { bad.push('rows changed at ' + smp.t.toFixed(0) + ' ms, before the first beat at ' + firstAny.toFixed(0)); break; }
          smp.rows.forEach((row, ri) => row.forEach((c, ci) => { if (c.u === 'gap') return; const p = preAt[c.u];
            if (p && smp.t < tOf(c.u) - 2 && (p.ri !== ri || p.ci !== ci)) bad.push('uid ' + c.u + ' moved from slot ' + p.ci + ' to ' + ci + ' at ' + smp.t.toFixed(0) + ' ms, before its beat at ' + tOf(c.u).toFixed(0));
            if (!p) { if (smp.t < tOf(c.u) - 2) bad.push('uid ' + c.u + ' arrived at ' + smp.t.toFixed(0) + ' before its beat ' + tOf(c.u).toFixed(0)); }
            else if (smp.t < tOf(c.u) - 2 && c.s !== p.s) bad.push('uid ' + c.u + ' changed at ' + smp.t.toFixed(0) + ' ms before its beat at ' + tOf(c.u).toFixed(0) + ' ms'); }));
          if (bad.length > 3) break;
        }
        return bad; };
      // E3 · each death: the real card's clone cracks; no placeholder box; its own cell keeps its place (hidden) until the crack ends
      const e3 = (r) => { const bad = []; const deaths = r.beats.filter((b) => b.ev.type === 'destroy');
        if (r.samples.some((s) => s.boxes > 0)) bad.push('a placeholder box was drawn');
        for (const d of deaths) { const u = String(d.ev.targetUids[0]);
          const during = r.samples.filter((s) => s.t > d.t + 60 && s.clones.indexOf(u) >= 0);
          if (!during.length) { bad.push('no real-card crack for ' + u); continue; }
          for (const s of during) { const row = s.rows.find((rw) => rw.some((c) => c.u === u)); const cell = row && row.find((c) => c.u === u);
            if (!cell || !cell.h) { bad.push('the cracking card ' + u + ' lost its own place at ' + s.t.toFixed(0) + ' ms'); break; } } }
        return { bad, deaths: deaths.length }; };
      const leftovers = () => ({ RE: MT.RE === null && MT.reLive === null, lock: !m$('choreolayer').classList.contains('locked') && !MT.choreoActive, clones: m$('victimlayer').children.length === 0,
        live: JSON.stringify(rowsNow().map((row) => row.filter((c) => c.u !== 'gap').map((c) => c.u))) === JSON.stringify(['heroes', 'units', 'units', 'heroes'].map((z, i) => MT.G.players[i < 2 ? MT.OPP : MT.ME][z].map((c) => String(c.uid)))) });

      // E2 + E3 — both cards, both seats, the owner's board and a five-Unit board (an Amrita revival among them), and a relayed cast on the free wire road
      const runs = [];
      for (const card of ['Pashupatastra', 'Brahmastra', 'Agneyastra', 'Nagastra', 'Pavamana', 'Tamasa', 'Dharma Kavacha']) for (const seat of [0, 1]) for (const board of ['owner', 'five']) {
        const G = lay(card, seat, board, 'normal'); runs.push({ card, seat, board, r: await play(G, seat, true) }); }
      { const G = lay('Pashupatastra', 1, 'five', 'normal', 'wire'); runs.push({ card: 'Pashupatastra', seat: 1, board: 'five, relayed on the free wire road', r: await play(G, 1, true, 'wire') }); }
      const e2bad = runs.map((x) => ({ k: x.card + ' seat ' + x.seat + ' ' + x.board, bad: e2(x.r) })).filter((x) => x.bad.length);
      ok(`E2 · R3: in ${runs.length} plays (all seven held cards — Pashupatastra, Brahmastra, and from WAVE1-CLIPS-1 Agneyastra, Nagastra, Pavamana, Tamasa and Dharma Kavacha — both seats, the owner's board and a five-Unit board, one relayed on the free wire road) no card leaves, moves to another slot or arrives, and no number, mark or badge changes, before its own beat (a fallen card's space is kept while its row still waits) — sampled every 4 ms from the act (through the opponent's showcase) to the release`,
        runs.length === 29 && e2bad.length === 0 && runs.every((x) => x.r.samples.length > 200), J(e2bad.slice(0, 3)));
      const e3r = runs.map((x) => Object.assign({ k: x.card + ' seat ' + x.seat + ' ' + x.board }, e3(x.r)));
      const nDeaths = e3r.reduce((a, x) => a + x.deaths, 0);
      ok(`E3 · the kills: all ${nDeaths} deaths are the real card cracking in its own place — its clone over its own cell, the cell kept (hidden) until the crack ends, no placeholder box ever drawn`,
        nDeaths >= 20 && e3r.every((x) => x.bad.length === 0), J(e3r.filter((x) => x.bad.length).slice(0, 3)));
      ok('  E2/E3 · …and after each play nothing is left: no held board, no lock, no clone, the live board drawn', runs.every((x) => x.r.RE === null && x.r.reLive === null && JSON.stringify(x.r.post.map((row) => row.map((c) => c.u))) !== ''));

      // E4 · the pace: every beat where it falls today, within a frame — at all three speeds, from both seats (held vs the same play with the held road off)
      const pace = [];
      // jsdom has no layout engine: the page's board rescale (sizeBoard) costs ~130 ms here against a few in a browser. For the pace the rescale is made
      // the same small cost in BOTH runs; what is judged is the schedule (the browser's own cost is measured on the real page, in the proof).
      const sizeKeep = mw.sizeBoard; mw.sizeBoard = function () {};

      for (const card of ['Pashupatastra', 'Brahmastra', 'Agneyastra', 'Nagastra', 'Pavamana', 'Tamasa', 'Dharma Kavacha']) for (const seat of [0, 1]) for (const speed of (FULL ? ['relaxed', 'normal', 'fast'] : ['normal'])) {
        const keep = mw.heldPlayOf, A = [], B = [];
        for (let rep = 0; rep < 2; rep++) {   // held and unheld alternate, twice: the timers' own jitter between two runs (±10 ms here) is averaged, never the schedule
          let G = lay(card, seat, 'owner', speed); A.push(await play(G, seat, false));
          mw.heldPlayOf = () => null; G = lay(card, seat, 'owner', speed); B.push(await play(G, seat, false)); mw.heldPlayOf = keep; }
        const n = A[0].beats.length, same = A.concat(B).every((r) => r.beats.length === n && r.beats.every((x, k) => x.ev.type === A[0].beats[k].ev.type));
        const mean = (R, k) => R.reduce((s, r) => s + r.beats[k].t, 0) / R.length;
        const d = same ? Math.max(...A[0].beats.map((x, k) => Math.abs(mean(A, k) - mean(B, k)))) : Infinity;
        const noise = same ? Math.max(...A[0].beats.map((x, k) => Math.max(Math.abs(A[0].beats[k].t - A[1].beats[k].t), Math.abs(B[0].beats[k].t - B[1].beats[k].t)))) : Infinity;   // the same road run twice: the timers' own jitter right now
        pace.push({ card, seat, speed, beats: n, d: +d.toFixed(1), noise: +noise.toFixed(1) }); }
      mw.sizeBoard = sizeKeep;
      const floor = Math.max(...pace.map((p) => p.noise));
      ok(`E4 · the pace: every beat of all seven held cards falls where it falls with the held road off — within a frame, or within the timers' own jitter measured in this run (worst difference ${Math.max(...pace.map((p) => p.d))} ms; the same road run twice differed by up to ${floor} ms; ${pace.length} settings: seven cards × both seats × ${FULL ? 'relaxed, normal, fast' : 'normal (the light sweep)'}; each the mean of two held and two unheld runs, alternated)`,
        pace.length === (FULL ? 42 : 14) && pace.every((p) => p.beats >= (/^(Pashupatastra|Brahmastra)$/.test(p.card) ? 4 : 1) && p.d <= Math.max(17, floor)), J(pace.filter((p) => !(p.d <= Math.max(17, floor)))));

      // E5 · leaving, skipping, the watchdog and a thrown error each leave no held board, lock or clone — the live board shows
      const midPlay = async (card, seat) => { const G = lay(card, seat, 'five', 'normal'); mw.runAction(() => mw.playCard(G, seat, 0), { actor: seat }); await W(seat ? 2900 : 1700); return { G, held: !!MT.RE && MT.RE.mid }; };
      const e5 = [];
      { const m = await midPlay('Pashupatastra', 0); m$('choreolayer').click(); const now = { RE: MT.RE === null, live: leftovers().live };   // the skip: dropped at once
        await until(() => !MT.choreoActive, 15000); await W(100); e5.push(['a skip (tap)', m.held && now.RE && now.live && Object.values(leftovers()).every(Boolean), J({ m: m.held, now, after: leftovers() })]); }
      for (const [name, go] of [['the main menu', () => mw.showLanding()], ['a rematch', () => mw.startGame('devas', 'asuras')], ['a Story chapter', () => mw.startStoryChapter('b1c1')]]) {
        const m = await midPlay('Brahmastra', 1); go(); const at = { RE: MT.RE === null && MT.reLive === null, lock: !m$('choreolayer').classList.contains('locked'), clones: m$('victimlayer').children.length === 0 };
        let back = false; const iv = setInterval(() => { if (MT.RE) back = true; }, 10); await W(5000); clearInterval(iv);
        e5.push(['leaving for ' + name, m.held && at.RE && at.lock && at.clones && !back && MT.RE === null, J({ m: m.held, at, back })]); }
      { const pe0 = mw.playEvent; let hung = 0; mw.playEvent = function (ev) { if (ev.type === 'destroy' && !hung++) return new Promise(() => {}); return pe0.apply(this, arguments); };   // a beat that never ends: the heartbeat stops, the watchdog's 8 s budget runs out
        const m = await midPlay('Brahmastra', 0); await until(() => !MT.RE, 12000); const at = leftovers().live; await until(() => !MT.choreoActive, 3000); await W(400); mw.playEvent = pe0;
        e5.push(['the watchdog (a beat that never ends)', m.held && hung === 1 && at && Object.values(leftovers()).every(Boolean), J({ m: m.held, hung, at, after: leftovers() })]); }
      { const keep = mw.heldStep; let thrown = 0; mw.heldStep = function () { if (!thrown++) throw new Error('test: a broken step'); return keep.apply(this, arguments); };
        const m = await midPlay('Pashupatastra', 0); const at = { RE: MT.RE === null, live: leftovers().live }; await until(() => !MT.choreoActive, 15000); await W(100); mw.heldStep = keep;
        const note = notes.some((d) => d.kind === 'held-dropped' && /broken step/.test(d.why || ''));
        e5.push(['a thrown error inside the held road (a quiet note, no banner)', !m.held && thrown > 0 && at.RE && at.live && note && Object.values(leftovers()).every(Boolean) && m$('banner').classList.contains('hidden'), J({ thrown, at, note, after: leftovers() })]); }
      { const keep = mw.heldMidFinish; mw.heldMidFinish = function (g) { keep.apply(this, arguments); g.players[MT.OPP].units.forEach((u) => { u.power += 5; }); };   // a copy that ends wrong
        const G = lay('Pashupatastra', 0, 'five', 'normal'); const r = await play(G, 0, false); mw.heldMidFinish = keep;
        const note = notes.some((d) => d.kind === 'held-mismatch' && d.card === 'Pashupatastra');
        e5.push(['a copy that does not equal the live board at the end: the live board wins, a quiet note in the diagnostics, no banner', note && Object.values(leftovers()).every(Boolean) && m$('banner').classList.contains('hidden'), J({ note, after: leftovers() })]); }
      for (const [name, pass, d] of e5) ok('E5 · ' + name + ': no held board, no lock, no clone, the live board showing', pass, d);

      // E7 · every other card in the sweep plays as today: it never enters the held road and its first frame is the live board
      const OTHERS = ['Vayu', 'Vajra', 'Shakti Spear', 'Suryastra', 'Tataka', 'Narakasura', 'Rudhira Bali', 'Dhumraksha', 'Mohanastra', 'Surpanakha', 'Vidyutastra', 'Gandiva Arrow', 'Lanka Dahan', "Vinata's Talon", "Jatayu's Last Flight", "Anjaneya's Roar", 'Vasuki', 'Naga Archer', 'Ashvatara', 'Sarpa Satra', 'Hymn of the Depths', "Serpent's Kiss", 'Ajagara'];
      const cdKeep = mw.cDelay; mw.cDelay = () => Promise.resolve();   // E7 judges the road, not the pace: every wait is made instant (restored below)
      const e7 = [];
      for (const n of OTHERS) {
        const d = MT.CARD_BY_NAME[n]; if (!d) { e7.push([n, 'no such card']); continue; }
        mw.resetChoreo(); mw.startGame('devas', 'asuras'); const G = MT.G, me = G.players[MT.ME], op = G.players[MT.OPP]; mw.pump = function () {}; me.mulliganed = op.mulliganed = true; m$('mulligan').classList.add('hidden');
        const mk = (x, o) => Object.assign(mw.mkCard(MT.CARD_BY_NAME[x]), o || {});
        me.units = [mk('Deva Soldier'), mk('Marut'), mk('Yama')]; me.heroes = []; me.discard = [mk('Marut')]; op.units = [mk('Kalanemi', { power: 1, base: 1 }), mk('Meghnad', { power: 4 }), mk('Ravana', { power: 8, base: 8 }), mk('Bana Asura', { venom: 2 }), mk('Kali Asura')]; op.heroes = [mk('Shukracharya')];
        me.faction = (Object.keys(MT.DECKS).find((f) => MT.DECKS[f].some((x) => x.n === n))) || 'devas';
        me.hand = [mk(n)]; G.turn = MT.ME; me.passed = op.passed = false; me.astrasThisRound = 0; me.heroPlayedThisRound = false; mw.render();
        if (mw.playableIndices(G, MT.ME).indexOf(0) < 0) { e7.push([n, 'not legal on this board']); continue; }
        let everHeld = false; const iv = setInterval(() => { if (MT.RE) everHeld = true; }, 2);
        mw.runAction(() => mw.playCard(G, MT.ME, 0), { actor: MT.ME });
        const first = JSON.stringify(rowsNow().map((row) => row.map((c) => c.u))), live = JSON.stringify(['heroes', 'units', 'units', 'heroes'].map((z, i) => G.players[i < 2 ? MT.OPP : MT.ME][z].map((c) => String(c.uid))));
        if (MT.RE) everHeld = true;
        await until(() => !MT.choreoActive, 20000); clearInterval(iv);
        if (everHeld || first !== live) e7.push([n, everHeld ? 'entered the held road' : 'its first frame is not the live board']);
      }
      mw.cDelay = cdKeep;
      ok(`E7 · every other card in the sweep (${OTHERS.length}) plays as today: it never enters the held road, and the first frame after its play is the live board`, e7.length === 0, J(e7));

      // E8 · the staked road on the page: E2 and E3 on a live server view (the old view is the held copy)
      let buildView = null, createRoom = null, ES = null;
      try { buildView = require(path.join(MS, 'src', 'redactedview.js')).buildView; createRoom = require(path.join(MS, 'src', 'match.js')).createRoom; ES = require(path.join(MS, 'src', 'engineguard.js')).loadGuardedEngine().engine; } catch (e) { buildView = null; }
      if (!buildView) { fail++; console.log('  ✖ E8 (page) SKIPPED LOUDLY — the web3 checkout is absent (' + MS + ').'); }
      else {
        const hall = (v) => { const c = Object.assign({}, v); delete c.myName; delete c.oppName; return c; };
        const sr = [];
        for (const card of ['Pashupatastra', 'Brahmastra', 'Agneyastra', 'Nagastra', 'Pavamana', 'Tamasa', 'Dharma Kavacha']) for (const caster of [0, 1]) {
          if (!FULL && caster !== (/^(Pashupatastra|Nagastra|Tamasa)$/.test(card) ? 1 : 0)) continue;   // the light sweep: one play per card
          const cf = CASTER[card], fac = caster === 0 ? [cf, 'asuras'] : ['asuras', cf];
          const room = createRoom(ES, { seed: 77, seats: [{ address: '0x' + '1'.repeat(40), faction: fac[0] }, { address: '0x' + '2'.repeat(40), faction: fac[1] }] });
          const g = room.state; let cur = 0;
          for (const s of [0, 1]) room.apply(s, { type: 'mulligan', indices: [] });
          let uid = 880000; const mk = (n, o) => Object.assign({}, MT.CARD_BY_NAME[n], { uid: uid++, power: MT.CARD_BY_NAME[n].p, base: MT.CARD_BY_NAME[n].p, ghost: false, lockedRound: 0, aegis: false, revivedShield: false, asleep: false, revealPending: false, venom: 0, doomed: false, disguisedAs: null, ward: false, bound: false, astraImmuneRound: 0, stolenBy: -1 }, o || {});
          const C = g.players[caster], S = g.players[1 - caster];
          C.units = OWN[cf].map((n) => mk(n)); S.units = [mk('Kalanemi', { power: 1, base: 1 }), mk('Meghnad', { power: 6 }), mk('Ravana', { power: 7 }), mk('Bana Asura'), mk('Kali Asura', { power: 1, aegis: true })];
          C.heroes = []; S.heroes = []; C.hand.unshift(mk(card)); g.turn = caster; C.passed = S.passed = false; C.astrasThisRound = 0;
          cur = g.events.length; const v0s = [0, 1].map((me) => hall(buildView({ E: ES }, room, 'm-staked', me, null, [])));
          room.apply(caster, { type: 'play', handIndex: 0, targetIndex: null });
          const v1s = [0, 1].map((me) => hall(buildView({ E: ES }, room, 'm-staked', me, { seat: caster, type: 'play', id: MT.CARD_BY_NAME[card].id, n: card }, g.events.slice(cur))));
          for (const me of [0, 1]) {
            if (!FULL && me === caster) continue;   // the light sweep: read by the other seat
            mw.resetChoreo(); mw.startWireMatch({ seat: me, matchId: 'm-staked-' + card + caster + me, view: v0s[me] }); mw.pump = function () {};
            m$('mulligan').classList.add('hidden'); mw.render();
            const beats = [], samples = [], t0 = mw.performance.now(); const pe = mw.playEvent;
            mw.playEvent = function (ev) { beats.push({ t: mw.performance.now() - t0, ev }); return pe.apply(this, arguments); };
            const iv = setInterval(() => samples.push({ t: mw.performance.now() - t0, rows: rowsNow(), clones: [...m$('victimlayer').children].map((n) => n.dataset.uid), boxes: mw.document.querySelectorAll('.dissolve-clone').length }), 4);
            const pre = rowsNow(); mw.applyView(v1s[me]);
            const wasHeld = !!(MT.RE && MT.RE.mid);
            await until(() => !MT.choreoActive, 30000); await W(80); clearInterval(iv); mw.playEvent = pe;
            const r = { beats, samples, pre };
            sr.push({ k: card + ' cast by seat ' + caster + ', read by seat ' + me, wasHeld, e2: e2(r), e3: e3(r), after: Object.values(leftovers()).every(Boolean) });
          }
        }
        ok(`E8 · THE STAKED ROAD on the page: ${sr.length} plays from the server's real views (all seven held cards, cast by either seat, read by both) are held, and E2 and E3 hold on them; nothing left after`,
          sr.length === (FULL ? 28 : 7) && sr.every((x) => x.wasHeld && x.e2.length === 0 && x.e3.bad.length === 0 && (x.e3.deaths >= 1 || /^(Agneyastra|Nagastra|Pavamana|Tamasa|Dharma Kavacha) /.test(x.k)) && x.after), J(sr.filter((x) => !(x.wasHeld && x.e2.length === 0 && x.e3.bad.length === 0 && x.after)).map((x) => ({ k: x.k, h: x.wasHeld, e2: x.e2.slice(0, 2), e3: x.e3.bad.slice(0, 2), after: x.after })).slice(0, 3)));
      }
      ok('  …the held-play page ran clean: no script error, no console.log', M.errs.length === 0, M.errs.slice(0, 3).join(' | '));
    }

    // ═══ 9 · E6 — reduced motion: the held road never runs; the play resolves at once, as today ═══
    console.log('\n── 9 · reduced motion: instant, as today (E6) ──');
    {
      const R6 = boot(''), rw = R6.w, RT = R6.T, r$ = (id) => rw.document.getElementById(id);
      const res = [];
      for (const card of ['Pashupatastra', 'Brahmastra', 'Agneyastra', 'Nagastra', 'Pavamana', 'Tamasa', 'Dharma Kavacha']) {
        rw.resetChoreo(); rw.startGame(/^(Brahmastra|Agneyastra|Pavamana|Dharma Kavacha)$/.test(card) ? 'devas' : 'asuras', 'asuras'); const G = RT.G, me = G.players[RT.ME], op = G.players[RT.OPP]; rw.pump = function () {}; me.mulliganed = op.mulliganed = true; r$('mulligan').classList.add('hidden');
        const mk = (x, o) => Object.assign(rw.mkCard(RT.CARD_BY_NAME[x]), o || {});
        me.units = [mk('Tataka')]; me.heroes = []; op.units = [mk('Kalanemi', { power: 1, base: 1 }), mk('Meghnad', { power: 6 }), mk('Ravana', { power: 7 })]; op.heroes = [];
        me.hand = [mk(card)]; G.turn = RT.ME; me.passed = op.passed = false; me.astrasThisRound = 0; rw.render();
        rw.runAction(() => rw.playCard(G, RT.ME, 0), { actor: RT.ME });
        const rows = JSON.stringify([...r$('ounits').querySelectorAll('.bc')].map((e) => e.dataset.uid)), live = JSON.stringify(op.units.map((u) => String(u.uid)));
        res.push({ card, RE: RT.RE === null, lock: !RT.choreoActive, rows: rows === live, log: r$('loglast').textContent === rw.fixLogGrammar(G.log[G.log.length - 1].msg) });
      }
      ok('E6 · reduced motion: all seven held cards resolve at once — no held board, no lock, the live board and the log line drawn in the same moment, as today', res.every((x) => x.RE && x.lock && x.rows && x.log), J(res));
      ok('  …that page ran clean', R6.errs.length === 0, R6.errs.slice(0, 3).join(' | '));
    }

    // ═══ 10 · E9 — WAVE1-CLIPS-1 (owner ruling, 25 Nov 2026): WITH THE CLIP PLAYING, nothing struck changes before its impact frame is on screen ═══
    console.log('\n── 10 · the clip on the held board: the struck card\'s number, mark and tokens turn in the frame that draws the impact cell (E9) ──');
    {
      const draws = [], M9 = boot('', { reduce: false, packs: true, draws }), nw = M9.w, NT = M9.T, n$ = (id) => nw.document.getElementById(id);
      const notes = []; { const fn = nw.fxNote; nw.fxNote = function (kind, detail) { notes.push(Object.assign({ kind }, detail || {})); return fn.apply(this, arguments); }; }
      const sigOf = (el) => !el ? 'gone' : [...el.children].filter((c) => c.tagName !== 'IMG').map((c) => c.className + '=' + c.textContent).join(';') + '|' + ['bound', 'warded', 'ghostc', 'stolen'].filter((k) => el.classList.contains(k)).join(',');
      const cardSig = (u) => sigOf(nw.document.querySelector(`#field .row .bc[data-uid="${u}"]:not(.held-gap)`));
      // what each card visibly changes: the struck cards (batch 1); the caster's own cards (Pavamana's heal and +1); the turn indicator (Tamasa's skip:
      // until the slam it shows the turn as it would be without the skip); the artifact chip (Kavacha)
      const SPEC = { Agneyastra: ['agneyastra', 'devas', 'damage'], Nagastra: ['nagastra', 'asuras', 'token'], Pavamana: ['pavamana', 'devas', 'own'], Tamasa: ['tamasa', 'asuras', 'turn'], 'Dharma Kavacha': ['kavacha', 'devas', 'chip'] };
      const CLASSIC = {};   // NO-CUT ruling (owner, 2026-11-26 18:04): the regenerated Nagastra and Tamasa are routed again — all five play their clips
      const res = [];
      for (const card of Object.keys(SPEC)) for (const seat of [0, 1]) {
        const [id, cf, trig] = SPEC[card];
        const man = JSON.parse(fs.readFileSync(path.join(GAME, 'assets', 'manifest', 'effects', id, 'manifest.json'), 'utf8')), impSrc = man.cells[man.impact].src;
        const cellOf = (d) => { const c = man.cells.find((x) => x.x === d.x && x.y === d.y); return c ? c.src : -1; };
        nw.resetChoreo(); const pf = seat === 0 ? cf : 'asuras', of = seat === 0 ? 'asuras' : cf; nw.startGame(pf, of);
        const G = NT.G, me = G.players[NT.ME], op = G.players[NT.OPP], cast = G.players[seat], hit = G.players[1 - seat];
        nw.pump = function () {}; G.realm = 'mrityulok'; me.mulliganed = op.mulliganed = true; n$('mulligan').classList.add('hidden');
        const mk = (n, x) => Object.assign(nw.mkCard(NT.CARD_BY_NAME[n]), x || {});
        for (const p of [me, op]) { p.units = []; p.heroes = []; p.artifact = null; p.passed = false; p.astrasThisRound = 0; }
        cast.units = trig === 'own' ? [mk('Yama', { power: 3 }), mk('Marut', { venom: 2 })] : [mk(cf === 'devas' ? 'Marut' : 'Tataka')];
        if (trig === 'chip') cast.manualShield = seat === 0;
        hit.units = [mk('Kalanemi', { power: 1, base: 1 }), mk('Meghnad', { power: 6 }), mk('Ravana', { power: 7 })];
        cast.hand = [mk(card)]; G.turn = seat; G.over = false; nw.setSpeed('normal'); nw.render();
        await nw.fxBoot(); const got = await nw.fxPrefetch(id);
        const ready = Array.isArray(got) && got.length > 0 && got.every((b) => b && b.__wh && b.__wh[0] > 0);   // the atlas bytes in hand: the page's own readiness
        let watch = () => [];
        const frames = [];
        // the screen as painted: a browser paints after the frame's callbacks AND the promise work they set off (the held board moves in that work),
        // so each frame's sample is read once those have run (setTimeout 0, before the next frame) — labelled with the cell that frame drew
        const ft = nw.fxTick; nw.fxTick = function () { const r = ft.apply(this, arguments); const d = draws.length > d0 ? draws[draws.length - 1] : null, cell = d ? cellOf(d) : -1, t = nw.performance.now(), veil = n$('fxveil').style.opacity;
          setTimeout(() => frames.push({ t, cell, sig: watch(), veil }), 0); return r; };
        const d0 = draws.length;
        const ownUids = cast.units.map((u) => String(u.uid)), artId = seat === NT.ME ? 'part' : 'oart';
        if (trig === 'own') watch = () => ownUids.map((u) => cardSig(u));
        else if (trig === 'turn') watch = () => [n$('turnind').textContent];
        else if (trig === 'chip') watch = () => [n$(artId).textContent + '|' + n$(artId).className];
        const pre0 = watch();   // the board before the play
        const playBeat = {}; { const pe = nw.playEvent; nw.playEvent = function (ev) { const r = pe.apply(this, arguments); if (ev.type === 'play' && playBeat.t0 == null) { playBeat.t0 = nw.performance.now(); Promise.resolve(r).then(() => { playBeat.ms = nw.performance.now() - playBeat.t0; }); } return r; }; playBeat.restore = () => { nw.playEvent = pe; }; }   // the play beat's own length, cast to its end
        nw.runAction(() => nw.playCard(G, seat, 0), { actor: seat });
        if (trig === 'damage' || trig === 'token') { const evs = G.events.slice(-12), bev = evs.find((e) => e.type === trig && e.abilityName === card), struck = (bev && bev.targetUids || []).map(String); watch = () => struck.map((u) => cardSig(u)); }
        const pre = watch();   // what shows once the play has begun (the turn has passed): it must hold until the impact frame
        await until(() => !NT.choreoActive, 30000); await W(80);
        { let last = -1, still = 0; await until(() => { const c = draws.length; still = c === last ? still + 1 : 0; last = c; return still >= 30; }, 15000); }   // the whole clip runs past the action: wait until it has drawn its last cell (300 ms with no new draw)
        nw.fxTick = ft; playBeat.restore();
        const mine = draws.slice(d0).map(cellOf), changed = (f) => JSON.stringify(f.sig) !== JSON.stringify(pre);
        const early = frames.filter((f) => f.cell < impSrc && changed(f)), firstTurn = frames.find(changed), post = watch(), nC = man.cells.length, tail = man.audit.fadeTail.length - 1;
        const veilWant = (ix) => ix < 0 ? 0 : +(man.contract.veil * Math.max(0, Math.min(1, (ix + 1) / 4, (nC - 1 - ix) / tail))).toFixed(3), veilBad = frames.filter((f) => Math.abs(+f.veil - veilWant(f.cell)) > 0.0015).length, veilEnd = n$('fxveil').style.opacity;
        const expectChange = true;   // the player's Tamasa: "OPPONENT…" → "YOUR TURN" at the slam; the opponent's: "YOUR TURN" (the turn as it would be without the skip) → "OPPONENT…" at the slam
        res.push({ card, seat, ready, watched: pre.length, drawn: mine.length, impactDrawn: mine.indexOf(impSrc) >= 0, frames: frames.length, early: early.length,
          turnedAtCell: firstTurn ? firstTurn.cell : null, impSrc, expectChange, playMs: playBeat.ms != null ? +playBeat.ms.toFixed(1) : null, wantMs: { Pavamana: 2166.7, Tamasa: 1679.2, 'Dharma Kavacha': 2383.3, Nagastra: 1733.3 }[card] || null, veilWant: man.contract.veil, before: pre0, during: pre, after: post,
          classic: !!CLASSIC[card], changedAfter: JSON.stringify(post) !== JSON.stringify(pre), veilBad, veilPeak: Math.max(0, ...frames.map((f) => +f.veil)), veilEnd, lastCell: mine.length ? mine[mine.length - 1] : null, nC, fell: notes.filter((x) => /fell-back|not-ready|clip-error|impact-wait-cap/.test(x.kind)).length, left: NT.RE === null && !NT.choreoActive });
        notes.length = 0;
      }
      const clipR = res.filter((x) => !x.classic), clsR = res.filter((x) => x.classic);
      ok(`E9 · WITH THE CLIP PLAYING (the real packs, decoded, drawn on the page's own clock — Agneyastra, Pavamana, Dharma Kavacha and, from the NO-CUT ruling (26 Nov 2026), the regenerated Nagastra and Tamasa, both seats; WAVE1-CLIPS-1 FINAL rulings 1 and 4): each plays its whole clip, first frame to last; nothing the card changes on screen — the struck card's number and mark, the caster's own healed numbers, the artifact chip — changes before the frame that draws its beat cell (f003 / f040 / f044 / Nagastra's Venom tokens f032 / Tamasa's turn indicator f031), and it turns in that very frame (${clipR.map((x) => x.card + ' seat ' + x.seat + ': turned at f' + String(x.turnedAtCell).padStart(3, '0') + ', ' + x.drawn + ' frames to f' + String(x.lastCell).padStart(3, '0')).join(', ')}); the veil follows each clip cell by cell — 0 before its first drawn frame, in over cells 0–3, its contract's veil at most (45%; 65% for Nagastra and Tamasa, on the affected half only), out with the fade tail, 0 on the last cell and after (${clipR.reduce((a, x) => a + x.veilBad, 0)} frames off the rule); the play beat runs the whole clip's lead to its beat at Normal — Pavamana 2166.7 ms, Dharma Kavacha 2383.3 ms (the classic 910), Nagastra 1733.3 ms and Tamasa 1679.2 ms (the classic 1001): measured ${clipR.filter((x) => x.wantMs).map((x) => x.card + ' ' + x.playMs).join(', ')} ms (within 40 ms); the clip owned every one, nothing left after. E2 above proves the held order with every play`,
        res.length === 10 && clipR.length === 10 && clipR.every((x) => x.ready && x.watched >= 1 && x.drawn > 60 && x.impactDrawn && x.early === 0 && x.turnedAtCell === x.impSrc && x.lastCell === x.nC - 1 && x.veilBad === 0 && x.veilPeak === x.veilWant && x.veilEnd === '0' && x.fell === 0 && x.left && (!x.wantMs || (x.playMs != null && Math.abs(x.playMs - x.wantMs) <= 40))) &&
        clsR.length === 0 && clsR.every((x) => !x.ready && x.drawn === 0 && x.changedAfter && x.veilPeak === 0 && x.left && x.playMs != null && Math.abs(x.playMs - x.wantMs) <= 40), J(res.filter((x) => x.classic ? !(x.drawn === 0 && x.changedAfter && Math.abs(x.playMs - x.wantMs) <= 40) : !(x.ready && x.early === 0 && x.turnedAtCell === x.impSrc && x.veilBad === 0 && x.fell === 0 && x.left && x.lastCell === x.nC - 1 && Math.abs((x.playMs || 0) - (x.wantMs || x.playMs || 0)) <= 40)).map((x) => Object.assign({}, x, { before: undefined, during: undefined, after: undefined }))));
      ok('  …that page ran clean', M9.errs.length === 0, M9.errs.slice(0, 3).join(' | '));
    }
  })();
}

Promise.resolve(pending).catch((e) => { fail++; console.log('  ✖ section 4 threw: ' + (e && e.stack || e)); }).then(() => {
  console.log('\n' + (fail === 0 ? '✓ ALL ' + pass + ' ROUND-END CHECKS PASS' : '✖ ' + fail + ' FAILURES / ' + pass + ' passed'));
  process.exit(fail === 0 ? 0 : 1);   // the page's own intervals would keep node alive
});
