'use strict';
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// tools/roundend_order.js — THE ROUND-END ORDER CHECK, in real headless Chrome. ON DEMAND (not one of the fast suites).
//
// WHAT IT PROVES (RULES-FIX-1, owner ruling D, 12 Nov 2026). Every 25 ms it records what the player sees — both score
// plaques, the board's card count, the banner and its score line, the round number, the result screen, the Story panel —
// across a round-ending action, then judges the recording against ruling D:
//   pass banner → round-end effects on the held board → plaques rest on the round's finals → ONE result banner (with
//   `YOU n · OPPONENT n`, still on the old round) → only then the board clears, the new totals, the round number;
//   last round: pass → finals → result screen.
// The paths: your pass · the AI's pass · poison · reduced motion · reduced motion + poison · tap-to-skip · the last round ·
// a Story chapter (its panel after the result, before round 2) · the free online mirror (the opponent's relayed pass, and
// your own) · a staked table (RECORDED, not judged: Stage 1 leaves it exactly as it was) · a 360-px screen — and:
//   move_200 / move_banner  the free mirror, the opponent's next move delivered 200 ms after the round-ending pass, and in
//                           the middle of the result banner: it must wait for the sequence, then play once on the new board,
//                           and the frame must end equal to the server room's own state (nothing lost, nothing twice);
//   ai_leads               vs AI, the AI wins round 1 and leads round 2: its first move must wait for the sequence;
//   stall                  the worst case for the 8-second stall guard: a wide poisoned board at the Relaxed speed — the
//                           guard must never fire, the order must hold (the closest margin is printed).
//
// HOW TO RUN   node tools/roundend_order.js                    every path, on the working copy's index.html
//              node tools/roundend_order.js poison stall       just those paths
//              node tools/roundend_order.js --page /tmp/x.html another copy of the page (e.g. `git show HEAD:index.html`)
//              node tools/roundend_order.js --regen            rebuild the online fixtures from the web3 match server
// HOW LONG     about 13 minutes for all 16 paths (measured 763 s): ~20–30 s for a vs-AI path, ~100 s for an online one
//              (the relayed match is replayed up to round 1's end), ~85 s for the stall path. Nothing runs in parallel.
// NEEDS        Google Chrome (CHROME=… overrides the macOS path) · the `ws` module borrowed from the site checkout's
//              tests/node_modules (DY_WEB) — the game itself gains no dependency · the online fixtures in
//              tools/roundend_order_fixtures.json (`--regen` needs the web3 checkout, DY_WEB3).
// It serves the game folder itself (a built-in node http server on a free port) and writes timelines + screenshots
// to $TMPDIR/dy_roundend_order. It never edits a file in the repo (except the fixtures, on --regen).
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════
const { spawn } = require('child_process'); const http = require('http'), fs = require('fs'), path = require('path'), os = require('os');
const GAME = path.resolve(__dirname, '..');
const WEB = process.env.DY_WEB || path.resolve(GAME, '..', 'divya-yuddha-web');
const WEB3 = process.env.DY_WEB3 || path.resolve(GAME, '..', 'divya-yuddha-web3');
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const FIX = path.join(__dirname, 'roundend_order_fixtures.json');
const argv = process.argv.slice(2);
const pageArg = argv.indexOf('--page') >= 0 ? path.resolve(argv[argv.indexOf('--page') + 1]) : path.join(GAME, 'index.html');
const only = argv.filter((a, i) => !a.startsWith('--') && argv[i - 1] !== '--page');
const OUT = path.join(os.tmpdir(), 'dy_roundend_order'); fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── --regen: the online fixtures, straight from the web3 server's own room (free: relayed moves; staked: redacted views) ──
if (argv.indexOf('--regen') >= 0) {
  const MS = path.join(WEB3, 'services', 'match-server', 'src');
  const { createRoom } = require(path.join(MS, 'match.js')); const { buildView } = require(path.join(MS, 'redactedview.js'));
  const ES = require(path.join(MS, 'engineguard.js')).loadGuardedEngine().engine;
  const seats = [{ address: '0x' + '1'.repeat(40), faction: 'devas' }, { address: '0x' + '2'.repeat(40), faction: 'nagas' }];
  const aiAct = (sg, s) => { const pl = sg.players[s], d = ES.aiMove(sg, s); let a = (d && d.play != null) ? { type: 'play', handIndex: d.play, targetIndex: null } : { type: 'pass' };
    if (a.type === 'play') { const sp = ES.targetSpec(sg, s, pl.hand[d.play]); if (sp && sp.options && sp.options.length) a.targetIndex = 0; } return a; };
  const snapOf = (sg) => ({ round: sg.round, t: [ES.totalPower(sg, 0), ES.totalPower(sg, 1)], hand: sg.players.map((p) => p.hand.length), units: sg.players.map((p) => p.units.map((u) => u.uid)), deck: sg.players.map((p) => p.deck.length) });
  // free: the first seed whose round 1 is ended by `want`'s pass, then 3 more moves of round 2
  const free = (want) => { for (let seed = 4242; seed < 4342; seed++) {
    const room = createRoom(ES, { seed, seats }), sg = room.state, moves = [], after = [];
    const step = (s, a) => { if (!room.validate(s, a).ok) a = { type: 'pass' }; moves.push(room.apply(s, a)); after.push(snapOf(sg)); };
    step(0, { type: 'mulligan', indices: [] }); step(1, { type: 'mulligan', indices: [] });
    let g = 0, endAt = -1; while (!sg.over && g++ < 200 && endAt < 0) { const s = room.turn; step(s, aiAct(sg, s)); if (sg.roundHistory.length) endAt = moves.length - 1; }
    const last = moves[endAt]; if (endAt < 0 || last.move.seat !== want || last.move.type !== 'pass') continue;
    for (let k = 0; k < 3 && !sg.over; k++) { const s = room.turn; step(s, aiAct(sg, s)); }
    return { seed, mid: 'm-rf1-' + seed, f0: 'devas', f1: 'nagas', moves, after, endAt, rh: sg.roundHistory }; } throw new Error('no seed for ' + want); };
  const staked = () => { const seed = 4242, mid = 'm-rf1-staked', room = createRoom(ES, { seed, seats }), sg = room.state;
    const hall = (v) => { const c = JSON.parse(JSON.stringify(v)); delete c.myName; delete c.oppName; return c; };
    const start = hall(buildView({ E: ES }, room, mid, 0, null, [])); const views = []; let cursor = sg.events.length, endAt = -1;
    const step = (s, a) => { if (!room.validate(s, a).ok) a = { type: 'pass' }; const hc = a.type === 'play' ? sg.players[s].hand[a.handIndex] : null; room.apply(s, a);
      const lm = hc ? { seat: s, type: 'play', id: hc.id, n: hc.n } : { seat: s, type: a.type }; const slice = sg.events.slice(cursor); cursor = sg.events.length; views.push(hall(buildView({ E: ES }, room, mid, 0, lm, slice))); };
    step(0, { type: 'mulligan', indices: [] }); step(1, { type: 'mulligan', indices: [] });
    let g = 0; while (!sg.over && g++ < 200 && !sg.roundHistory.length) { const s = room.turn; step(s, aiAct(sg, s)); if (sg.roundHistory.length) endAt = views.length - 1; }
    return { mid, seed, start, views, endAt, rh: sg.roundHistory }; };
  const F = { wire_opp: free(1), wire_me: free(0), staked: staked() };
  fs.writeFileSync(FIX, JSON.stringify(F));
  console.log('fixtures rebuilt:', Object.entries(F).map(([k, v]) => `${k} seed ${v.seed} round 1 ends at ${v.endAt} ${JSON.stringify(v.rh)}`).join(' · '));
  process.exit(0);
}

let WS; try { WS = require(require.resolve('ws', { paths: [path.join(WEB, 'tests')] })); } catch (e) { console.log('✖ the `ws` module was not found under ' + path.join(WEB, 'tests') + ' (set DY_WEB)'); process.exit(1); }
const FX = JSON.parse(fs.readFileSync(FIX, 'utf8'));

// ── a tiny static server: the page under test at /index.html, everything else from the game folder ──
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.mp4': 'video/mp4', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const server = http.createServer((q, r) => { let u = decodeURIComponent(q.url.split('?')[0]); if (u === '/' || u === '/index.html') u = null;
  const f = u === null ? pageArg : path.join(GAME, path.normalize(u).replace(/^(\.\.[/\\])+/, ''));
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }); r.end(d); }); });
const get = (u) => new Promise((r, j) => http.get(u, (res) => { let d = ''; res.on('data', (c) => d += c); res.on('end', () => r(JSON.parse(d))); }).on('error', j));
let BASE = '';
async function chrome(reduce, width) {
  const PORT = 9300 + Math.floor(Math.random() * 600);
  const ch = spawn(CHROME, ['--headless=new', '--disable-gpu', '--autoplay-policy=no-user-gesture-required', '--remote-debugging-port=' + PORT, '--user-data-dir=' + path.join(OUT, 'prof' + PORT), 'about:blank'], { stdio: 'ignore' });
  let t; for (let i = 0; i < 60; i++) { try { t = await get(`http://127.0.0.1:${PORT}/json`); break; } catch (e) { await sleep(200); } }
  const ws = new WS(t.find((x) => x.type === 'page').webSocketDebuggerUrl, { perMessageDeflate: false }); await new Promise((r) => ws.on('open', r));
  let id = 0; const P = {}; ws.on('message', (m) => { const d = JSON.parse(m); if (d.id && P[d.id]) { P[d.id](d); delete P[d.id]; } });
  const send = (m, p = {}) => new Promise((r) => { const i = ++id; P[i] = r; ws.send(JSON.stringify({ id: i, method: m, params: p })); });
  const ev = async (e) => { const r = await send('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true }); if (r.result && r.result.exceptionDetails) return 'EXC ' + JSON.stringify(r.result.exceptionDetails.exception && r.result.exceptionDetails.exception.description); return r.result && r.result.result ? r.result.result.value : null; };
  await send('Page.enable'); await send('Emulation.setDeviceMetricsOverride', { width: width || 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await send('Network.enable'); await send('Network.setBlockedURLs', { urls: ['*count.divyayuddha.games*', '*plausible.io*'] });
  if (reduce) await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  return { ws, ch, send, ev, close: () => { try { ws.close(); } catch (e) {} ch.kill('SIGKILL'); try { fs.rmSync(path.join(OUT, 'prof' + PORT), { recursive: true, force: true }); } catch (e) {} } };
}
// the recording: also the next round's plays (np), the relay queue, and the stall guard's clock (gap = now − the last heartbeat)
const SAMPLER = `(()=>{ window.__S=[]; window.__wd=0; const t0=performance.now(), $=id=>document.getElementById(id), vis=e=>e&&!e.classList.contains('hidden')&&getComputedStyle(e).display!=='none';
  const ff=window.fastForwardChoreo; window.fastForwardChoreo=function(){ if(!choreoSkip) __wd++; return ff.apply(this, arguments); };
  const N=G.round; window.__N=N; window.__np0=G.events.filter(e=>e.round>N && e.type==='play').length;
  window.__iv=setInterval(()=>{ const b=$('banner'), t=b&&b.querySelector('.txt'), sub=t&&t.querySelector('.sub');
    const bt = vis(b) ? (t.childNodes[0] ? t.childNodes[0].textContent : t.textContent).trim() : '';
    __S.push({ ms:Math.round(performance.now()-t0), p:$('ptotal').textContent, o:$('ototal').textContent, tiles:document.querySelectorAll('#field .bc').length,
      banner:bt, sub: vis(b)&&sub ? sub.textContent : '', rnum:$('rnum').textContent, over: vis($('gameover')), cut: vis($('cutscene')), choreo: choreoActive ? 1:0,
      np: G.events.filter(e=>e.round>N && e.type==='play').length - __np0, q: typeof Wire!=='undefined' && Wire ? Wire.queue.length : 0,
      seq: typeof reLive!=='undefined' && reLive ? 1 : 0, gap: choreoActive && choreoStartedAt ? Math.round(performance.now()-choreoStartedAt) : 0, budget: choreoBudgetMs }); },25); return 1; })()`;
const BOOT = (f0, f1) => `(async()=>{ const W=ms=>new Promise(r=>setTimeout(r,ms)); const v=document.getElementById('introv'); if(v) v.style.display='none';
  startGame('${f0}','${f1}'); await W(1200); document.getElementById('mullconfirm').click(); await W(600); while(choreoActive) await W(100); await W(2600);
  clearTimeout(aiTimer); aiTimer=null; G.realm='mrityulok'; return 1; })()`;
const mk = (n, o) => `Object.assign(mkCard(CARD_BY_NAME[${JSON.stringify(n)}]), ${JSON.stringify(o || {})})`;
const SETUP = (me, op, extra) => `(async()=>{ const W=ms=>new Promise(r=>setTimeout(r,ms)); clearTimeout(aiTimer); aiTimer=null; let gw=0; while(choreoActive && gw++<200) await W(100); clearTimeout(aiTimer); aiTimer=null;
  const P0=G.players[ME], P1=G.players[OPP]; P0.units=[${me.map((c) => mk(c[0], c[1])).join(',')}]; P1.units=[${op.map((c) => mk(c[0], c[1])).join(',')}]; P0.heroes=[]; P1.heroes=[];
  P0.artifact=null; P1.artifact=null; P1.hand=P1.hand.filter(c=>c.t!=='hero').slice(0,3); ${extra || ''} render(); await W(400); return JSON.stringify({p:Q.totalPower(G,ME), o:Q.totalPower(G,OPP), r:G.round}); })()`;
const say = `const say=d=>onWireMessage({ origin:location.origin, source:window.parent, data:d });`;
const WIRE_BOOT = (key) => { const W = FX[key];
  return `(async()=>{ const Wt=ms=>new Promise(r=>setTimeout(r,ms)); const v=document.getElementById('introv'); if(v) v.style.display='none'; ${say}
    say({ type:'wire:start', matchId:${JSON.stringify(W.mid)}, seat:0, seed:${W.seed}, p0Faction:'${W.f0}', p1Faction:'${W.f1}' }); await Wt(1500);
    const M=${JSON.stringify(W.moves)}; for (let i=0;i<${W.endAt};i++){ say({ type:'wire:move', matchId:${JSON.stringify(W.mid)}, seq:M[i].seq, move:M[i].move }); }
    let g=0, calm=0; while(calm<20 && g++<3000){ calm = (Wire.queue.length || choreoActive) ? 0 : calm+1; await Wt(100); } await Wt(1500);
    window.__W={ mid:${JSON.stringify(W.mid)}, M, end:${W.endAt}, after:${JSON.stringify(W.after)} }; return JSON.stringify({ q:Wire.queue.length, round:G.round, p:Q.totalPower(G,ME), o:Q.totalPower(G,OPP) }); })()`; };
const WIRE_MOVE = (i) => `onWireMessage({ origin:location.origin, source:window.parent, data:{ type:'wire:move', matchId:__W.mid, seq:__W.M[${i}].seq, move:__W.M[${i}].move } })`;
const STAKED_BOOT = () => { const W = FX.staked;
  return `(async()=>{ const Wt=ms=>new Promise(r=>setTimeout(r,ms)); const v=document.getElementById('introv'); if(v) v.style.display='none'; ${say}
    say({ type:'wire:start', matchId:${JSON.stringify(W.mid)}, seat:0, view:${JSON.stringify(W.start)}, p0Faction:'devas', p1Faction:'nagas' }); await Wt(1500);
    const V=${JSON.stringify(W.views)}; for (let i=0;i<${W.endAt};i++) say({ type:'wire:view', matchId:${JSON.stringify(W.mid)}, seq:i+1, view:V[i] });
    let g=0, calm=0; while(calm<20 && g++<3000){ calm = (Wire.queue.length || choreoActive) ? 0 : calm+1; await Wt(100); } await Wt(1500); window.__W={ mid:${JSON.stringify(W.mid)}, seq:${W.endAt + 1}, view:V[${W.endAt}] }; return JSON.stringify({ q:Wire.queue.length, round:G.round }); })()`; };
const STAKED_ACT = `onWireMessage({ origin:location.origin, source:window.parent, data:{ type:'wire:view', matchId:__W.mid, seq:__W.seq, view:__W.view } })`;
const PASS = `document.getElementById('passbtn').click()`;
const POISON = [[['Yama'], ['Deva Soldier', { power: 1 }], ['Deva Soldier', { venom: 1 }]], [['Naga Warrior']]];
const WIDE = [Array.from({ length: 8 }, (_, i) => [i % 2 ? 'Deva Soldier' : 'Marut', { venom: 2 }]), Array.from({ length: 8 }, (_, i) => [i % 2 ? 'Naga Warrior' : 'Naga Archer', { venom: 1 }])];
const S = {
  human_pass: { f: ['devas', 'asuras'], setup: SETUP([['Yama'], ['Deva Soldier']], [['Tataka']], 'P1.passed=true; G.turn=ME;'), act: PASS },
  ai_pass: { f: ['devas', 'asuras'], setup: SETUP([['Yama'], ['Deva Soldier']], [['Tataka']], 'P0.passed=true; P1.hand=[]; G.turn=OPP;'), act: `runAction(()=>aiTakeTurn(G,OPP),{actor:OPP})` },
  poison: { f: ['devas', 'nagas'], setup: SETUP(...POISON, 'P1.passed=true; G.turn=ME;'), act: PASS },
  reduce: { reduce: true, f: ['devas', 'asuras'], setup: SETUP([['Yama'], ['Deva Soldier']], [['Tataka']], 'P1.passed=true; G.turn=ME;'), act: PASS },
  reduce_poison: { reduce: true, f: ['devas', 'nagas'], setup: SETUP(...POISON, 'P1.passed=true; G.turn=ME;'), act: PASS },
  skip: { f: ['devas', 'nagas'], setup: SETUP(...POISON, 'P1.passed=true; G.turn=ME;'), act: PASS, taps: [300, 1200] },
  last: { f: ['devas', 'nagas'], setup: SETUP([['Yama'], ['Deva Soldier', { venom: 1 }]], [['Naga Warrior']], 'P1.passed=true; G.turn=ME; G.round=3; P0.roundWins=1; P1.roundWins=1; G.roundHistory=[{round:1,t0:5,t1:3,winner:0},{round:2,t0:2,t1:6,winner:1}]; lastRoundLen=2;'), act: PASS, last: true },
  story: { boot: `(async()=>{ const W=ms=>new Promise(r=>setTimeout(r,ms)); const v=document.getElementById('introv'); if(v) v.style.display='none'; startStoryChapter('b1c2'); await W(2500); while(choreoActive) await W(100); clearTimeout(aiTimer); aiTimer=null; G.realm='mrityulok'; return 1; })()`,
    setup: SETUP([['Yama'], ['Deva Soldier']], [['Tataka']], 'P1.passed=true; G.turn=ME;'), act: `runAction(()=>pass(G,ME))`, at: [[7500, `(()=>{ const s=document.getElementById('cutsceneskip'); if(s && !document.getElementById('cutscene').classList.contains('hidden')) s.click(); return 1; })()`]] },
  wire_opp: { wire: 'wire_opp', boot: WIRE_BOOT('wire_opp'), setup: '1', act: WIRE_MOVE(FX.wire_opp.endAt) },
  wire_me: { wire: 'wire_me', boot: WIRE_BOOT('wire_me'), setup: '1', act: WIRE_MOVE(FX.wire_me.endAt) },
  staked: { wire: 'staked', staked: true, boot: STAKED_BOOT(), setup: '1', act: STAKED_ACT },
  narrow: { width: 360, f: ['devas', 'asuras'], setup: SETUP([['Yama'], ['Deva Soldier']], [['Tataka']], 'P1.passed=true; G.turn=ME;'), act: PASS },
  // ITEM 1 — the opponent's next move arrives while the round end shows (your pass ended round 1; they lead round 2)
  move_200: { wire: 'wire_me', relay: true, boot: WIRE_BOOT('wire_me'), setup: '1', act: WIRE_MOVE(FX.wire_me.endAt) + `; setTimeout(()=>{ ${WIRE_MOVE(FX.wire_me.endAt + 1)}; window.__sent=performance.now(); }, 200)` },
  move_banner: { wire: 'wire_me', relay: true, boot: WIRE_BOOT('wire_me'), setup: '1',
    act: WIRE_MOVE(FX.wire_me.endAt) + `; const iv=setInterval(()=>{ const b=document.getElementById('banner'); if(b && !b.classList.contains('hidden') && /^ROUND \\d/.test(b.textContent)){ clearInterval(iv); setTimeout(()=>{ ${WIRE_MOVE(FX.wire_me.endAt + 1)}; window.__sent=performance.now(); }, 600); } }, 20)` },
  // ITEM 1 — vs AI, the AI wins round 1 (you pass behind) and leads round 2: its first move waits for the sequence
  ai_leads: { f: ['devas', 'asuras'], aiLeads: true, setup: SETUP([['Deva Soldier']], [['Tataka'], ['Kumbhakarna', { asleep: false }]], 'P1.passed=true; G.turn=ME;'), act: PASS },
  // ITEM 3 — the stall guard's worst case: 8 poisoned Units a side, the Relaxed speed
  stall: { f: ['devas', 'nagas'], stall: true, setup: SETUP(...WIDE, `P1.passed=true; G.turn=ME; speedMult=SPEEDS.relaxed; applyVfxT();`), act: PASS },
};
async function runOne(name) {
  const sc = S[name]; const B = await chrome(sc.reduce, sc.width);
  await B.send('Page.navigate', { url: `${BASE}/index.html?utm_source=cc_test${sc.wire ? '&wire=1' : ''}` }); await sleep(3500);
  const booted = await B.ev(sc.boot || BOOT(sc.f[0], sc.f[1]));
  const pre = await B.ev(sc.setup);
  await B.ev(SAMPLER); await sleep(150);
  await B.ev(`(()=>{ ${sc.act}; return 1; })()`);
  for (const [t, js] of sc.at || []) { setTimeout(() => { B.ev(js); }, t); }
  for (const t of sc.taps || []) { await sleep(t - (sc.taps.indexOf(t) ? sc.taps[sc.taps.indexOf(t) - 1] : 0)); await B.ev(`(()=>{ const l=document.getElementById('choreolayer'); if(l&&l.onclick) l.onclick(); return 1; })()`); }
  { const t0 = Date.now(), got = {}; const total = sc.last ? 9000 : sc.stall ? 75000 : sc.aiLeads || sc.relay ? 16000 : (sc.at ? 14000 : 12000);
    while (Date.now() - t0 < total) { const b = await B.ev(`(()=>{ const b=document.getElementById('banner'); return b && !b.classList.contains('hidden') ? b.textContent : ''; })()`);
      const k = /PASSED/.test(b || '') ? 'pass' : /^ROUND \d/.test(b || '') ? 'result' : (await B.ev(`!document.getElementById('gameover').classList.contains('hidden')`)) ? 'over' : null;
      if (k && !got[k]) { got[k] = 1; await sleep(k === 'over' ? 600 : 250); const sh = await B.send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(path.join(OUT, `${name}_${k}.png`), Buffer.from(sh.result.data, 'base64')); }
      await sleep(80); } }
  const shot = await B.send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(path.join(OUT, `${name}_end.png`), Buffer.from(shot.result.data, 'base64'));
  const R = JSON.parse(await B.ev(`(()=>{ clearInterval(__iv); const h=G.roundHistory[G.roundHistory.length-1], b=document.querySelector('#banner .txt');
    const st = { round:G.round, t:[Q.totalPower(G,0),Q.totalPower(G,1)], hand:G.players.map(p=>p.hand.length), units:G.players.map(p=>p.units.map(u=>u.uid)), deck:G.players.map(p=>p.deck.length) };
    return JSON.stringify({ S:__S, h, rh:G.roundHistory.length, live:[Q.totalPower(G,ME),Q.totalPower(G,OPP)], round:G.round, over:G.over, bannerW: b? b.getBoundingClientRect().width:0, vw: innerWidth,
      wd: window.__wd||0, st, wire: typeof Wire!=='undefined' && Wire ? { q:Wire.queue.length, seq:Wire.seq, refused:(Wire.refused||[]).length } : null, sent: window.__sent||0 }); })()`));
  B.close(); R.pre = pre; R.booted = booted; R.name = name; R.sc = sc; return R;
}
function judge(R) {
  if (!R.h) return ['the round never ended (pre ' + R.pre + ')'];
  const T = R.S, h = R.h, f0 = String(h.t0), f1 = String(h.t1), N = String(h.round), last = !!R.sc.last;   // ME is seat 0 on every path
  const firstIdx = (pred, from = 0) => { for (let i = from; i < T.length; i++) if (pred(T[i])) return i; return -1; };
  const runs = (pred) => { let n = 0, on = false; for (const s of T) { const v = pred(s); if (v && !on) n++; on = v; } return n; };
  const isPass = (s) => /PASSED$/.test(s.banner), isRes = (s) => /^ROUND \d+ — /.test(s.banner);
  const passAt = firstIdx(isPass), resAt = firstIdx(isRes), passRuns = runs(isPass), resRuns = runs(isRes);
  const advAt = firstIdx((s) => s.rnum !== N), overAt = firstIdx((s) => s.over);
  const fails = [];
  if (passRuns !== 1) fails.push(`pass banner shown ${passRuns}× (want 1)`);
  if (!last) {
    if (resRuns !== 1) fails.push(`result banner shown ${resRuns}× (want 1)`);
    if (passAt < 0 || resAt < 0 || !(passAt < resAt)) fails.push(`order: the pass banner (${passAt < 0 ? '-' : T[passAt].ms}ms) must come before the result (${resAt < 0 ? '-' : T[resAt].ms}ms)`);
    if (resAt >= 0) { const s = T[resAt]; if (s.p !== f0 || s.o !== f1) fails.push(`at the result banner the plaques read ${s.p}-${s.o}, not the round's finals ${f0}-${f1}`);
      if (s.rnum !== N) fails.push(`at the result banner the round number already reads ${s.rnum}`);
      if (s.sub !== `YOU ${f0} · OPPONENT ${f1}`) fails.push(`the score line reads "${s.sub}"`);
      const resEnd = firstIdx((x) => !isRes(x), resAt); if (advAt >= 0 && advAt < resEnd) fails.push(`the board cleared to round ${T[advAt].rnum} at ${T[advAt].ms}ms, before the result banner ended (${resEnd < 0 ? '-' : T[resEnd].ms}ms)`);
      if (T.slice(0, resAt).some((x) => x.rnum !== N)) fails.push('the round advanced before the result banner'); }
    if (R.sc.at) { const cutAt = firstIdx((x) => x.cut); if (cutAt < 0) fails.push('the story panel never showed');
      else { if (resAt < 0 || cutAt < resAt) fails.push(`the story panel (${T[cutAt].ms}ms) came before the result banner`); if (T[cutAt].rnum !== N) fails.push(`the story panel showed over round ${T[cutAt].rnum}, after the round had already advanced`); } }
    if (!R.sc.relay && !R.sc.aiLeads) { const end = T[T.length - 1];
      if (end.p !== String(R.live[0]) || end.o !== String(R.live[1])) fails.push(`at rest the plaques read ${end.p}-${end.o}, not round ${R.round}'s true totals ${R.live[0]}-${R.live[1]}`);
      if (end.rnum !== String(R.round)) fails.push(`at rest the round number reads ${end.rnum}, not ${R.round}`); }
    if (passAt >= 0 && T[passAt].tiles === 0 && R.pre && R.pre[0] === '{' && JSON.parse(R.pre).p > 0) fails.push('the board was already empty when the pass banner showed');
  } else {
    if (resRuns !== 0) fails.push(`a round banner showed on the last round (${resRuns}×)`);
    if (overAt < 0) fails.push('the result screen never came');
    if (passAt < 0 || overAt < 0 || !(passAt < overAt)) fails.push(`order: the pass banner (${passAt < 0 ? '-' : T[passAt].ms}ms) must come before the result screen (${overAt < 0 ? '-' : T[overAt].ms}ms)`);
    const fin = firstIdx((s) => s.p === f0 && s.o === f1); if (fin < 0 || (overAt >= 0 && fin > overAt)) fails.push(`the plaques reached the finals ${f0}-${f1} ${fin < 0 ? 'never' : 'at ' + T[fin].ms + 'ms'}, after the result screen (${overAt < 0 ? '-' : T[overAt].ms}ms)`);
    if (overAt >= 0 && passAt >= 0) { const pe = firstIdx((x) => !isPass(x), passAt); if (pe > overAt) fails.push('the result screen came up while the pass banner still showed'); }
  }
  if (R.sc.width && R.bannerW > R.vw) fails.push(`the result banner is ${R.bannerW}px wide on a ${R.vw}px screen`);
  // ITEM 1 — a move that arrives (or an AI turn that falls due) during the sequence waits for it, then plays once on the new board
  if (R.sc.relay || R.sc.aiLeads) {
    const playAt = firstIdx((s) => s.np > 0);
    if (playAt < 0) fails.push('the next round\'s first move never played');
    else { if (resAt < 0 || playAt <= resAt) fails.push(`the next round's first move played at ${T[playAt].ms}ms, before the result banner (${resAt < 0 ? '-' : T[resAt].ms}ms)`);
      if (T[playAt].rnum === N) fails.push(`the next round's first move played at ${T[playAt].ms}ms while the screen still showed round ${N}`);
      const under = T.filter((s) => s.np > 0 && s.seq); if (under.length) fails.push(`the next round's first move played at ${under[0].ms}ms while the round-end sequence still held the screen`); }
    const maxNp = Math.max(...T.map((s) => s.np)); if (maxNp !== 1) fails.push(`the next round shows ${maxNp} plays (want exactly 1)`);
    if (R.sc.relay) { const want = FX[R.sc.wire].after[FX[R.sc.wire].endAt + 1];
      if (JSON.stringify(R.st) !== JSON.stringify(want)) fails.push(`the frame's state after the move differs from the server room's: ${JSON.stringify(R.st)} vs ${JSON.stringify(want)}`);
      if (!R.wire || R.wire.q !== 0 || R.wire.seq !== FX[R.sc.wire].moves[FX[R.sc.wire].endAt + 1].seq || R.wire.refused) fails.push(`the relay did not settle cleanly: ${JSON.stringify(R.wire)}`);
      const qAt = firstIdx((s) => s.q > 0); if (qAt < 0) fails.push('the early move was never seen waiting in the relay queue'); }
  }
  // ITEM 3 — the stall guard never fires on the worst legitimate round end
  if (R.sc.stall) { if (R.wd) fails.push(`the 8-second stall guard fired ${R.wd}×`); }
  return fails;
}
function shape(R) { const out = []; let last = ''; for (const s of R.S) { const k = [s.p + '-' + s.o, 'tiles ' + s.tiles, 'R' + s.rnum, s.banner, s.sub].join(' '); if (k !== last) { out.push(k); last = k; } } return out.join(' → '); }
function timeline(R) { const rows = []; let last = ''; for (const s of R.S) { const k = [s.p, s.o, s.tiles, s.banner, s.sub, s.rnum, s.over ? 'RESULT-SCREEN' : '', s.cut ? 'STORY-PANEL' : '', s.np, s.q].join('|'); if (k !== last) { rows.push(`${String(s.ms).padStart(6)}  ${s.p.padStart(3)}-${s.o.padEnd(3)} tiles ${String(s.tiles).padStart(2)}  R${s.rnum}  ${s.banner}${s.sub ? '  /  ' + s.sub : ''}${s.over ? '  [RESULT SCREEN]' : ''}${s.cut ? '  [STORY PANEL]' : ''}${s.q ? '  [relay queue ' + s.q + ']' : ''}${s.np ? '  [next round: ' + s.np + ' play]' : ''}`); last = k; } } return rows.join('\n'); }
(async () => {
  await new Promise((r) => server.listen(0, '127.0.0.1', r)); BASE = 'http://127.0.0.1:' + server.address().port;
  const names = only.length ? only : Object.keys(S); let bad = 0; const t0 = Date.now();
  for (const n of names) {
    if (!S[n]) { console.log('✖ no such path: ' + n); bad++; continue; }
    const R = await runOne(n); const fails = judge(R);
    let extra = '';
    if (R.sc.stall) { const g = R.S.filter((s) => s.choreo); const worst = g.reduce((a, s) => s.gap > a.gap ? s : a, { gap: 0, budget: 0 }); const margin = Math.min(...g.map((s) => s.budget - s.gap));
      extra = `  · stall guard: longest time between heartbeats ${worst.gap} ms (budget ${worst.budget} ms); closest margin ${margin} ms; fired ${R.wd}×; the sequence held the lock ${g.length * 25} ms in all\n`; }
    if (R.sc.relay || R.sc.aiLeads) { const p = R.S.find((s) => s.np > 0), rel = R.S.find((s, i) => i > 0 && !s.seq && R.S[i - 1].seq);
      extra = `  · the sequence released at ${rel ? rel.ms + ' ms' : '—'}; first next-round play seen at ${p ? p.ms + ' ms' : '—'}; frame state ${JSON.stringify(R.st)}${R.wire ? '; relay ' + JSON.stringify(R.wire) : ''}\n`; }
    const txt = `== ${path.basename(pageArg)} · ${n}  (round ${R.h && R.h.round} finals ${R.h && R.h.t0}-${R.h && R.h.t1}; next live ${R.live.join('-')}, round ${R.round}${R.over ? ', match over' : ''})\n` + timeline(R) + '\n' + extra +
      (R.sc.staked ? '  · the staked road is left as today (not judged): ' + (fails.length ? fails.length + ' departures from ruling D, as before' : 'in order') + '\n  · shape: ' + shape(R) : (fails.length ? fails.map((f) => '  ✖ ' + f).join('\n') : '  ✓ in order')) + '\n';
    fs.writeFileSync(path.join(OUT, `${n}.txt`), txt); console.log(txt); if (fails.length && !R.sc.staked) bad++;
  }
  console.log(`${path.basename(pageArg)}: ${names.length - bad}/${names.length} paths in order · ${Math.round((Date.now() - t0) / 1000)} s · timelines and screenshots in ${OUT}`);
  server.close(); process.exit(bad ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
