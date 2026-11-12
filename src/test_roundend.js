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
const fs = require('fs'), path = require('path'), vm = require('vm');
const GAME = path.resolve(__dirname, '..');
const WEB = process.env.DY_WEB || path.resolve(GAME, '..', 'divya-yuddha-web');
const HTML = fs.readFileSync(process.env.DY_RE_HTML || path.join(GAME, 'index.html'), 'utf8');
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

// ═══ 2 · THE CARD PICTURES ═══ (and 3 · UNBIND) — both in the shipped page
let JSDOM = null, VirtualConsole = null, pending = null;
try { ({ JSDOM, VirtualConsole } = require(require.resolve('jsdom', { paths: [path.join(WEB, 'tests')] }))); } catch (e) { JSDOM = null; }
if (!JSDOM) { fail++; console.log('  ✖ SKIPPED LOUDLY — jsdom not found under ' + path.join(WEB, 'tests') + ' (set DY_WEB). Sections 2 and 3 did NOT run.'); }
else {
  function boot(query) {
    const errs = [];
    const vc = new VirtualConsole();
    vc.on('jsdomError', (e) => errs.push(String(e && e.message))); vc.on('error', (...a) => errs.push(a.join(' '))); vc.on('log', (...a) => errs.push('console.log: ' + a.join(' ')));
    const scripts = [];
    const markup = HTML.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/g, (m, attrs, body) => { const src = /\bsrc="([^"?]+)/.exec(attrs); scripts.push(src ? fs.readFileSync(path.join(GAME, src[1]), 'utf8') : body); return ''; });
    const dom = new JSDOM(markup, { url: 'https://game.test/index.html' + query, pretendToBeVisual: true, runScripts: 'outside-only', virtualConsole: vc });
    const w = dom.window;
    w.matchMedia = (q) => ({ matches: /reduce/.test(q), media: q, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
    const ctx2 = new Proxy({}, { get: (t, k) => k === 'measureText' ? () => ({ width: 10 }) : /^create(Linear|Radial)Gradient$|^createPattern$/.test(String(k)) ? () => ({ addColorStop() {} }) : k === 'getImageData' ? () => ({ data: new Uint8ClampedArray(4) }) : () => {} });
    w.HTMLCanvasElement.prototype.getContext = () => ctx2;
    w.HTMLMediaElement.prototype.play = () => Promise.resolve(); w.HTMLMediaElement.prototype.pause = () => {}; w.HTMLMediaElement.prototype.load = () => {};
    w.fetch = () => Promise.resolve({ ok: false, status: 404, arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)), json: () => Promise.resolve({}), text: () => Promise.resolve('') });
    w.scrollTo = () => {};
    w.eval(scripts.join('\n;\n') + '\n;window.__T = { get G(){ return G; }, get ME(){ return ME; }, get OPP(){ return OPP; }, get RE(){ return RE; }, get reLive(){ return reLive; }, get choreoActive(){ return choreoActive; }, get bannerQ(){ return bannerQ; }, DECKS, CARD_BY_NAME };');
    return { w, T: w.__T, errs };
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
  })();
}

Promise.resolve(pending).catch((e) => { fail++; console.log('  ✖ section 4 threw: ' + (e && e.stack || e)); }).then(() => {
  console.log('\n' + (fail === 0 ? '✓ ALL ' + pass + ' ROUND-END CHECKS PASS' : '✖ ' + fail + ' FAILURES / ' + pass + ' passed'));
  process.exit(fail === 0 ? 0 : 1);   // the page's own intervals would keep node alive
});
