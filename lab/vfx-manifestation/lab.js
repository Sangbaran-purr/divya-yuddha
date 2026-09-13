/* lab.js — VFX-LAB-2+3 · the harness page. Loaded after lib/* and runtime/vfx.js.
   The page is glue: the fixture → ClashContext → Director plan → Runner → Playback (stage + board). Every piece of logic lives
   in lib/ and is card-agnostic; the only card-specific data are the registry (data/manifestations.json), the faction energy
   (data/factionfx.json) and the actor manifest. Nothing here loads from the live game.
   The copied VFX module and the actor stage both take their clock from here, so slow-mo, pause and frame-step hold everything. */
(function () {
  'use strict';
  const el = (id) => document.getElementById(id);
  const ART = { meghnad: '../art/Asuras_Unit_Meghnad_P6_rRare.png', indra: '../art/Devas_Hero_Indra_P7_rLegendary.png' };
  const FIXTURE = (seat) => '../fixtures/meghnad_seat' + seat + '.json';
  const VIEWER = 0;   // the board is read as seat 0; "swap sides" moves the ATTACKER
  const errors = [];
  function report(e) { errors.push(String(e && (e.message || e))); }
  window.addEventListener('error', (ev) => report(ev.error || ev.message));
  window.addEventListener('unhandledrejection', (ev) => report(ev.reason));

  // ── THE LAB CLOCK ──
  const clock = { t: 0, scale: 1, paused: false, stepQ: 0, cbs: [], nextId: 1, lastReal: null, frames: 0, fpsT0: 0, fps: 0 };
  const labPerformance = { now: () => clock.t };
  function labRaf(cb) { const id = clock.nextId++; clock.cbs.push({ id, cb }); return id; }
  function labCaf(id) { clock.cbs = clock.cbs.filter((x) => x.id !== id); }
  function tick(real) {
    if (clock.lastReal == null) { clock.lastReal = real; clock.fpsT0 = real; }
    const dt = Math.min(100, real - clock.lastReal); clock.lastReal = real;
    clock.frames++;
    if (real - clock.fpsT0 >= 500) { clock.fps = Math.round(clock.frames * 1000 / (real - clock.fpsT0)); clock.frames = 0; clock.fpsT0 = real; }
    let adv = 0;
    if (!clock.paused) adv = dt * clock.scale;
    else if (clock.stepQ > 0) { adv = 1000 / 60; clock.stepQ--; }
    if (adv > 0) {
      clock.t += adv;
      const run = clock.cbs; clock.cbs = [];
      for (const x of run) { try { x.cb(clock.t); } catch (e) { report(e); } }
      if (runner) { try { runner.tick(); } catch (e) { report(e); } }
    }
    try { stage.frame(clock.t, real); } catch (e) { report(e); }
    readout();
    window.requestAnimationFrame(tick);
  }

  // ── MODE ──
  const MODES = { full: { speed: 1, reduced: false }, fast: { speed: 0.6, reduced: false }, reduced: { speed: 1, reduced: true } };
  let mode = 'full';

  // ── THE COPIED RUNTIME (existing effects: the Asura embers, the Chaos Surge) ──
  const VFX = window.LabVFX.create({
    $: el, vfxT: () => MODES[mode].speed * window.LabVFX.PAGE.CHOREO_SPEED, reducedMotion: () => MODES[mode].reduced, jankSample: () => {},
    requestAnimationFrame: labRaf, cancelAnimationFrame: labCaf, performance: labPerformance,
  });

  // ── THE ACTOR STAGE ──
  const stage = new window.ActorStage({ field: el('field'), under: el('actorunder'), actorCanvas: el('actorcanvas'), gpuCanvas: el('actorgpu'), over: el('actorover'),
    now: () => clock.t, pixiUrl: new URL('assets/vendor/pixi.min.mjs', document.baseURI).href });

  // ── DATA ──
  let REG = {}, FFX = {}, copyMeta = null;
  const actors = {};
  async function actorFor(cardId) {
    if (actors[cardId]) return actors[cardId];
    const entry = REG[cardId]; if (!entry) return null;
    const murl = new URL(entry.manifest, document.baseURI);
    const manifest = await fetch(murl).then((r) => r.json());
    const v = window.ActorManifest.validate(manifest);
    if (!v.ok) { report('manifest ' + cardId + ': ' + v.errors.join('; ')); return null; }
    const image = new Image(); image.decoding = 'async';
    const t0 = performance.now(); image.src = new URL(manifest.atlas, murl).href; await image.decode();
    actors[cardId] = { manifest, image, decodeMs: performance.now() - t0, url: image.src };
    stage.loadActor(cardId, actors[cardId]);
    return actors[cardId];
  }

  // ── THE BOARD ──
  let F = null, attackerSeat = 0, runner = null, playback = null, lastPlan = null, lastDone = null;
  const memory = window.Director.createMemory();
  const sideOf = (seat) => seat === VIEWER ? 'me' : 'opp';
  function cardEl(c) {
    const d = document.createElement('div'); d.className = 'bc'; d.dataset.uid = c.uid;
    if (ART[c.id]) { const im = document.createElement('img'); im.src = ART[c.id]; im.alt = c.n; im.decoding = 'async'; d.appendChild(im); }
    else { d.classList.add('noart'); d.textContent = c.n; }
    const p = document.createElement('span'); p.className = 'pw'; p.textContent = c.eff; p.setAttribute('aria-label', c.n + ' power ' + c.eff); d.appendChild(p);
    return d;
  }
  function render(board, floats) {
    for (const seat of [0, 1]) {
      const half = document.querySelector('.half.' + sideOf(seat)), st = board.seats[seat];
      for (const zone of ['heroes', 'units']) {
        const row = half.querySelector('.row.' + zone); row.textContent = '';
        const cards = st[zone].filter((c) => c && !c.ghost);
        if (!cards.length) { const e = document.createElement('span'); e.className = 'empty'; e.textContent = zone === 'heroes' ? 'no hero' : 'no units'; row.appendChild(e); }
        cards.forEach((c) => row.appendChild(cardEl(c)));
      }
      el('tag-' + sideOf(seat)).textContent = (seat === VIEWER ? 'You' : 'Opponent') + ' · ' + st.faction;
    }
    const hand = el('hand'); hand.textContent = '';
    const lab = document.createElement('span'); lab.className = 'label'; lab.textContent = 'Your hand'; hand.appendChild(lab);
    board.seats[VIEWER].hand.slice(0, 6).forEach((c) => { const s = document.createElement('span'); s.className = 'chip' + (c.id === 'meghnad' ? ' hot' : ''); s.textContent = c.n; hand.appendChild(s); });
    (floats || []).forEach((f) => {
      const r = rectOf(f.uid); if (!r) return;
      const d = document.createElement('div'); d.className = 'float ' + (f.delta < 0 ? 'down' : 'up'); d.textContent = (f.delta > 0 ? '+' : '−') + Math.abs(f.delta);
      d.style.left = (r.x + r.w / 2) + 'px'; d.style.top = (r.y + 4) + 'px'; el('floatlayer').appendChild(d); setTimeout(() => d.remove(), 1300);
    });
  }
  function fieldRect() { return el('field').getBoundingClientRect(); }
  function rectOf(uid) {
    const n = el('field').querySelector('.bc[data-uid="' + uid + '"]'); if (!n) return null;
    const r = n.getBoundingClientRect(), f = fieldRect(); return { x: r.left - f.left, y: r.top - f.top, w: r.width, h: r.height };
  }
  function clientOf(uid) { const n = el('field').querySelector('.bc[data-uid="' + uid + '"]'); if (!n) return null; const r = n.getBoundingClientRect(); return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, w: r.width }; }
  function bandOf(seat) {
    const half = document.querySelector('.half.' + sideOf(seat)), f = fieldRect();
    const rs = [...half.querySelectorAll('.bc')].map((n) => n.getBoundingClientRect());
    if (!rs.length) return null;
    const x0 = Math.min(...rs.map((r) => r.left)), y0 = Math.min(...rs.map((r) => r.top)), x1 = Math.max(...rs.map((r) => r.right)), y1 = Math.max(...rs.map((r) => r.bottom));
    return { x: x0 - f.left, y: y0 - f.top, w: x1 - x0, h: y1 - y0 };
  }
  let bannerT = null;
  function banner(text, ms) { const b = el('banner'); b.textContent = text; b.classList.add('on'); clearTimeout(bannerT); bannerT = setTimeout(() => b.classList.remove('on'), ms || 900); }
  function story(stage2) {
    const ol = el('story-events'); ol.textContent = '';
    F.events.forEach((e) => { const li = document.createElement('li'); li.textContent = e.type + (e.abilityName ? ' · ' + e.abilityName : '') + (e.text ? ' · "' + e.text + '"' : '') + (e.amount != null ? ' · ' + e.amount : ''); ol.appendChild(li); });
    const ch = F.diff.changed.map((c) => c.n + ' ' + c.eff.from + ' → ' + c.eff.to).join(', ');
    el('story-truth').textContent = 'The board difference: ' + ch + '. No event carried this; the engine only logged "' + F.log.find((l) => /bolt/.test(l)) + '". It lands at SETTLE.';
  }
  async function load(seat) {
    stopRun();
    attackerSeat = seat; F = await fetch(FIXTURE(seat)).then((r) => r.json());
    render(F.before, []); story();
    el('seat-swap').textContent = 'Swap sides: Meghnad is ' + (attackerSeat === VIEWER ? 'yours' : 'the opponent\'s');
  }

  // ── PLAY ──
  function stopRun() { if (runner && !runner.done) runner.finish(); runner = null; }
  async function play(opts) {
    opts = opts || {};
    stopRun();
    const ctx = window.ClashContext.fromBatch(F);
    const boards = window.ClashContext.boards(ctx, F.before, F.after);
    const reg = REG[ctx.cardId] || {};
    const prior = opts.phase ? 0 : memory.count(ctx.cardId);
    const art = (ctx.scope === 'manifest' && reg.manifest) ? await actorFor(ctx.cardId) : null;
    const mf = art && art.manifest;
    const timing = mf && mf.timing === 'native' ? { fps: mf.fps, emerge: mf.phases.emerge.length, act: mf.phases.act.length, contact: mf.contact } : null;
    lastPlan = window.Director.plan(ctx, { mode, prior, ladderExempt: !!reg.ladderExempt, timing });
    if (!opts.phase) memory.record(ctx.cardId);
    el('memory-note').textContent = 'Match memory: ' + ctx.cardName + ' has manifested ' + memory.count(ctx.cardId) + ' time' + (memory.count(ctx.cardId) === 1 ? '' : 's') + '. The second play in a match runs Fast.';
    lastDone = null;
    const f = fieldRect();
    playback = window.Playback.create({
      stage, ctx, boards, viewer: VIEWER, field: { w: f.width, h: f.height },
      rectOf, clientOf, bandOf, render, fieldClient: () => { const r = fieldRect(); return { x: r.left, y: r.top }; },
      pulse: (uid, ms) => { const n = el('field').querySelector('.bc[data-uid="' + uid + '"]'); if (n) { n.classList.add('pulse'); setTimeout(() => n.classList.remove('pulse'), ms); } },
      actorFor: (id) => actors[id] || null,
      factionFx: (fac) => FFX[fac] || FFX.default,
      embers: (x, y) => VFX.cardLand(x, y),
      queueFx: (ev, board, skipped) => {
        if (skipped) return;
        if (ev.type === 'toast') banner(ev.text || ev.abilityName, 900);
        if (ev.type === 'buff') (ev.targetUids || []).forEach((u) => { const c = clientOf(u); if (c) VFX.sprSurge(c.cx, c.cy, c.w); });
      },
      onDone: (res) => { lastDone = res; if (!res.equalsFinal) report('the board after the batch does not equal the engine\'s AFTER snapshot'); },
      onError: report,
    });
    el('plan').textContent = window.Director.formatPlan(lastPlan);
    runner = window.Runner.create(lastPlan, playback.handlers, () => clock.t);
    const ph = opts.phase ? lastPlan.phases.find((p) => p.name === opts.phase) : null;
    if (opts.phase && !ph) { el('plan').textContent = window.Director.formatPlan(lastPlan) + '\n\n(' + opts.phase + ' is not in a ' + lastPlan.mode + ' plan)'; return; }
    runner.start(ph ? { from: ph.t0, to: ph.t1 } : {});
  }

  // ── READOUT ──
  function mb(n) { return (n / 1048576).toFixed(2) + ' MB'; }
  function readout() {
    const g = VFX.gpu, s = stage.stats(), a = actors.meghnad;
    el('ro-fps').textContent = String(clock.fps);
    el('ro-time').textContent = (clock.paused ? 'paused' : clock.scale + '×') + ' · ' + (clock.t / 1000).toFixed(2) + ' s · ' + mode + (runner && !runner.done ? ' · playing ' + Math.round(runner.t) + ' ms' + (runner.speed !== 1 ? ' at ' + runner.speed + '×' : '') : '');
    el('ro-renderer').textContent = 'effects ' + (g.renderer || 'none') + (g.enabled ? '' : ' (off → Canvas 2D)') + (g.texReady ? ' · surge ready' : '');
    el('ro-actor').textContent = s.backend + ' · ' + s.cellPx + ' px cells · drawn ' + s.drawnPx + ' px · ' + (s.liveFps != null ? s.liveFps + ' fps now' : (s.fps ? s.fps + ' fps last run' : 'no run yet')) + ' · draw ' + s.drawMsAvg.toFixed(2) + ' ms/frame · live actors ' + stage.liveActors() + ' · GPU sprites ' + stage.liveSprites() + (lastDone ? (lastDone.equalsFinal ? ' · final board = engine AFTER ✓' : ' · final board ≠ AFTER ✖') : '');
    el('ro-rung').textContent = VFX.currentRung();
    el('ro-sprites').textContent = 'Canvas 2D ' + VFX.sprCount() + ' · GPU ' + (g.live != null ? g.live : 0);
    let fetchMs = 0, bytes = 0;
    try { performance.getEntriesByType('resource').forEach((r) => { if (/\/lab\/vfx-manifestation\//.test(r.name)) { fetchMs += r.duration; bytes += (r.transferSize || r.encodedBodySize || 0); } }); } catch (e) {}
    el('ro-decode').textContent = 'fetch ' + Math.round(fetchMs) + ' ms · bake ' + Math.round(VFX.bakeMs()) + ' ms' + (a ? ' · actor atlas decode ' + Math.round(a.decodeMs) + ' ms' : '');
    let decoded = 0;
    if (copyMeta && g.texReady) copyMeta.files.filter((f) => /sheets\//.test(f.to) && f.px).forEach((f) => { decoded += f.px.w * f.px.h * 4; });
    const actorDecoded = a ? a.manifest.atlasSize.w * a.manifest.atlasSize.h * 4 : 0;
    el('ro-mb').textContent = 'transferred ' + mb(bytes) + ' · effect sheets ≈ ' + mb(decoded) + ' · actor atlas ≈ ' + mb(actorDecoded) + ' decoded';
    const e = el('ro-errors'); e.textContent = errors.length ? errors.length + ' — ' + errors[errors.length - 1] : '0'; e.className = errors.length ? 'bad' : '';
  }

  // ── CONTROLS ──
  function setOn(ids, on) { ids.forEach((id) => el(id).classList.toggle('on', id === on)); }
  el('replay-all').onclick = () => { play({}).catch(report); };
  ['awaken', 'emerge', 'act', 'fizzle', 'settle'].forEach((p) => { el('phase-' + p).onclick = () => { play({ phase: p.toUpperCase() }).catch(report); }; });
  el('ctl-skip').onclick = () => { if (runner && !runner.done) runner.skip(); };
  el('ctl-ff').onclick = () => { if (runner && !runner.done) runner.fastForward(runner.speed === 3 ? 1 : 3); };
  el('ctl-memory').onclick = () => { memory.reset(); el('memory-note').textContent = 'Match memory reset: the next play runs in the chosen mode.'; };
  ['full', 'fast', 'reduced'].forEach((m) => { el('mode-' + m).onclick = () => { mode = m; setOn(['mode-full', 'mode-fast', 'mode-reduced'], 'mode-' + m); }; });
  el('seat-swap').onclick = () => { load(1 - attackerSeat).catch(report); };
  async function backend(which) {
    setOn(['be-webgpu', 'be-webgl', 'be-canvas'], 'be-' + which);
    stopRun();
    try { if (which === 'canvas') { if (VFX.gpu.enabled) VFX.gpu.toggle(); } else await VFX.gpu.__forceBackend(which); } catch (e) { report(e); }
    try { await stage.useBackend(which); } catch (e) { report(e); }
  }
  el('be-webgpu').onclick = () => backend('webgpu');
  el('be-webgl').onclick = () => backend('webgl');
  el('be-canvas').onclick = () => backend('canvas');
  el('clk-slow').onclick = () => { clock.scale = clock.scale === 1 ? 0.25 : 1; el('clk-slow').classList.toggle('on', clock.scale !== 1); };
  el('clk-pause').onclick = () => { clock.paused = !clock.paused; el('clk-pause').classList.toggle('on', clock.paused); el('clk-pause').textContent = clock.paused ? 'Resume' : 'Pause'; };
  el('clk-step').onclick = () => { if (!clock.paused) { clock.paused = true; el('clk-pause').classList.add('on'); el('clk-pause').textContent = 'Resume'; } clock.stepQ++; };

  // ── BOOT ──
  VFX.applyQuality('lo');   // the rung whose sheets the lab carries (before init, so the GPU loads lo)
  VFX.init(); VFX.resize();
  window.addEventListener('resize', () => { VFX.resize(); stage.resize(); });
  Promise.all([
    fetch('COPY.json').then((r) => r.json()).then((j) => { copyMeta = j; }),
    fetch('../data/manifestations.json').then((r) => r.json()).then((j) => { REG = j.cards || {}; }),
    fetch('../data/factionfx.json').then((r) => r.json()).then((j) => { FFX = j; }),
  ]).then(() => load(0)).then(() => { stage.useBackend('webgpu').catch(report); window.requestAnimationFrame(tick); }).catch(report);
  window.__lab = { VFX, stage, clock, play, load, memory, errors, get runner() { return runner; }, get plan() { return lastPlan; }, get playback() { return playback; }, get done() { return lastDone; }, get fixture() { return F; } };
})();
