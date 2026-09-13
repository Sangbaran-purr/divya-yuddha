/* lab.js — VFX-LAB-1 · the harness page's logic. Loaded after lib/boarddiff.js and runtime/vfx.js.
   The page never loads anything from the live game: the runtime, the sheets, the art and the fixtures are the lab's own copies.
   The copied module takes its clock from here (requestAnimationFrame + performance.now), so the lab can slow, pause and
   step every effect without touching the module. LAB-1 replays Meghnad's fixture with two EXISTING recipes: the procedural
   cardLand (Canvas 2D) where Meghnad lands, and the GPU Chaos Surge where the engine's buff event lands; then the board
   settles to the AFTER snapshot, with the deltas taken from the board difference (ruling A1: the board is the truth). */
(function () {
  'use strict';
  const el = (id) => document.getElementById(id);
  const ART = { meghnad: '../art/Asuras_Unit_Meghnad_P6_rRare.png', indra: '../art/Devas_Hero_Indra_P7_rLegendary.png' };
  const FIXTURE = (seat) => '../fixtures/meghnad_seat' + seat + '.json';
  const VIEWER = 0;   // the board is read as seat 0 (the vs-AI and free-wire default); "swap sides" moves the ATTACKER
  const errors = [];
  function report(e) { errors.push(String(e && (e.message || e))); }
  window.addEventListener('error', (ev) => report(ev.error || ev.message));
  window.addEventListener('unhandledrejection', (ev) => report(ev.reason));

  // ── THE LAB CLOCK ──
  const clock = { t: 0, scale: 1, paused: false, stepQ: 0, cbs: [], nextId: 1, lastReal: null, frames: 0, fpsT0: 0, fps: 0 };
  const labPerformance = { now: () => clock.t };
  function labRaf(cb) { const id = clock.nextId++; clock.cbs.push({ id, cb }); return id; }
  function labCaf(id) { clock.cbs = clock.cbs.filter((x) => x.id !== id); }
  let timeline = [];
  function at(ms, fn) { timeline.push({ t: clock.t + ms, fn }); }
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
      const due = timeline.filter((x) => x.t <= clock.t).sort((a, b) => a.t - b.t);
      timeline = timeline.filter((x) => x.t > clock.t);
      for (const x of due) { try { x.fn(); } catch (e) { report(e); } }
    }
    readout();
    window.requestAnimationFrame(tick);
  }

  // ── MODE ──
  const MODES = { full: { speed: 1, reduced: false }, fast: { speed: 0.6, reduced: false }, reduced: { speed: 1, reduced: true } };
  let mode = 'full';

  // ── THE COPIED RUNTIME, with its page dependencies injected ──
  const VFX = window.LabVFX.create({
    $: el,
    vfxT: () => MODES[mode].speed * window.LabVFX.PAGE.CHOREO_SPEED,
    reducedMotion: () => MODES[mode].reduced,
    jankSample: () => {},
    requestAnimationFrame: labRaf, cancelAnimationFrame: labCaf, performance: labPerformance,
  });

  // ── THE BOARD ──
  let F = null, attackerSeat = 0, copyMeta = null;
  const sideOf = (seat) => seat === VIEWER ? 'me' : 'opp';
  function cardEl(c, delta) {
    const d = document.createElement('div');
    d.className = 'bc'; d.dataset.uid = c.uid;
    if (ART[c.id]) { const im = document.createElement('img'); im.src = ART[c.id]; im.alt = c.n; im.decoding = 'async'; d.appendChild(im); }
    else { d.classList.add('noart'); d.textContent = c.n; }
    const p = document.createElement('span'); p.className = 'pw'; p.textContent = c.eff; p.setAttribute('aria-label', c.n + ' power ' + c.eff); d.appendChild(p);
    if (delta) { const s = document.createElement('span'); s.className = 'delta ' + (delta < 0 ? 'down' : 'up'); s.textContent = (delta > 0 ? '+' : '−') + Math.abs(delta); d.appendChild(s); }
    return d;
  }
  function render(snap, deltas) {
    deltas = deltas || {};
    for (const seat of [0, 1]) {
      const half = document.querySelector('.half.' + sideOf(seat)), st = snap.seats[seat];
      for (const zone of ['heroes', 'units']) {
        const row = half.querySelector('.row.' + zone); row.textContent = '';
        const cards = st[zone].filter((c) => c && !c.ghost);
        if (!cards.length) { const e = document.createElement('span'); e.className = 'empty'; e.textContent = zone === 'heroes' ? 'no hero' : 'no units'; row.appendChild(e); }
        cards.forEach((c) => row.appendChild(cardEl(c, deltas[c.uid])));
      }
      el('tag-' + sideOf(seat)).textContent = (seat === VIEWER ? 'You' : 'Opponent') + ' · ' + st.faction;
    }
    const hand = el('hand'); hand.textContent = '';
    const lab = document.createElement('span'); lab.className = 'label'; lab.textContent = 'Your hand'; hand.appendChild(lab);
    snap.seats[VIEWER].hand.slice(0, 6).forEach((c) => { const s = document.createElement('span'); s.className = 'chip' + (c.id === 'meghnad' ? ' hot' : ''); s.textContent = c.n; hand.appendChild(s); });
  }
  function rectOf(uid) {
    const n = el('field').querySelector('.bc[data-uid="' + uid + '"]'); if (!n) return null;
    const r = n.getBoundingClientRect(); return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, w: r.width };
  }
  function story(stage) {
    const ol = el('story-events'); ol.textContent = '';
    F.events.forEach((e, i) => {
      const li = document.createElement('li');
      li.textContent = e.type + (e.abilityName ? ' · ' + e.abilityName : '') + (e.text ? ' · "' + e.text + '"' : '') + (e.amount != null ? ' · ' + e.amount : '');
      if (stage > i) li.style.color = 'var(--gold)';
      ol.appendChild(li);
    });
    const ch = F.diff.changed.map((c) => c.n + ' ' + c.eff.from + ' → ' + c.eff.to + ' (' + (c.eff.delta < 0 ? '−' : '+') + Math.abs(c.eff.delta) + ')').join(', ');
    el('story-truth').textContent = stage >= F.events.length + 1
      ? 'The board difference: ' + ch + '. No event carried this. The engine only logged it: "' + F.log.find((l) => /bolt/.test(l)) + '"'
      : 'The board settles after the effects, from the board difference.';
  }
  async function load(seat) {
    attackerSeat = seat; F = await fetch(FIXTURE(seat)).then((r) => r.json());
    timeline = []; render(F.before); story(0);
    el('seat-swap').textContent = 'Swap sides: Meghnad is ' + (attackerSeat === VIEWER ? 'yours' : 'the opponent\'s');
  }

  // ── REPLAY: the fixture's batch through two existing recipes, then the board settles ──
  function replay() {
    if (!F) return;
    timeline = []; render(F.before); story(0);
    const k = MODES[mode].reduced ? 0 : MODES[mode].speed;
    const entered = F.diff.entered[0];
    const mid = JSON.parse(JSON.stringify(F.before));
    const handCard = mid.seats[entered.seat].hand.find((c) => c.uid === entered.uid);
    mid.seats[entered.seat].hand = mid.seats[entered.seat].hand.filter((c) => c.uid !== entered.uid);
    mid.seats[entered.seat][entered.zone].push({ uid: entered.uid, id: entered.id, n: entered.n, t: 'unit', power: handCard ? handCard.power : entered.power, eff: handCard ? handCard.power : entered.eff });
    at(250 * k, () => { render(mid); story(1); const r = rectOf(entered.uid); if (r) VFX.cardLand(r.cx, r.cy); });
    const buff = F.events.find((e) => e.type === 'buff');
    if (buff) at(900 * k, () => {
      story(3);
      const t = mid.seats[entered.seat][entered.zone].find((c) => c.uid === buff.targetUids[0]); if (t) { t.eff += buff.amount; t.power += buff.amount; }
      render(mid, { [buff.targetUids[0]]: buff.amount });
      const r = rectOf(buff.targetUids[0]); if (r) VFX.sprSurge(r.cx, r.cy, r.w);
    });
    at(2400 * k, () => {
      const deltas = {}; F.diff.changed.forEach((c) => { if (c.eff) deltas[c.uid] = c.eff.delta; });
      render(F.after, deltas); story(F.events.length + 1);
    });
  }

  // ── READOUT ──
  function mb(n) { return (n / 1048576).toFixed(2) + ' MB'; }
  function readout() {
    const g = VFX.gpu;
    el('ro-fps').textContent = String(clock.fps);
    el('ro-time').textContent = (clock.paused ? 'paused' : clock.scale + '×') + ' · ' + (clock.t / 1000).toFixed(2) + ' s · ' + mode;
    el('ro-renderer').textContent = (g.renderer || 'none') + (g.enabled ? '' : (g.disabled ? ' (failed → Canvas 2D)' : ' (off → Canvas 2D)')) + (g.texReady ? ' · surge sheets ready' : '');
    el('ro-rung').textContent = VFX.currentRung();
    el('ro-sprites').textContent = 'Canvas 2D ' + VFX.sprCount() + ' · GPU ' + (g.live != null ? g.live : 0);
    let fetchMs = 0, bytes = 0;
    try { performance.getEntriesByType('resource').forEach((r) => { if (/\/lab\/vfx-manifestation\//.test(r.name) || /runtime\//.test(r.name)) { fetchMs += r.duration; bytes += (r.transferSize || r.encodedBodySize || 0); } }); } catch (e) {}
    el('ro-decode').textContent = 'fetch ' + Math.round(fetchMs) + ' ms · bake ' + Math.round(VFX.bakeMs()) + ' ms';
    let decoded = 0;
    if (copyMeta && g.texReady) copyMeta.files.filter((f) => /sheets\//.test(f.to) && f.px).forEach((f) => { decoded += f.px.w * f.px.h * 4; });
    el('ro-mb').textContent = 'transferred ' + mb(bytes) + ' · sheets decoded ≈ ' + mb(decoded);
    const e = el('ro-errors'); e.textContent = errors.length ? errors.length + ' — ' + errors[errors.length - 1] : '0'; e.className = errors.length ? 'bad' : '';
  }

  // ── CONTROLS ──
  function setOn(ids, on) { ids.forEach((id) => el(id).classList.toggle('on', id === on)); }
  el('replay-all').onclick = replay;
  ['full', 'fast', 'reduced'].forEach((m) => { el('mode-' + m).onclick = () => { mode = m; setOn(['mode-full', 'mode-fast', 'mode-reduced'], 'mode-' + m); }; });
  el('seat-swap').onclick = () => { load(1 - attackerSeat); };
  el('be-webgpu').onclick = async () => { setOn(['be-webgpu', 'be-webgl', 'be-canvas'], 'be-webgpu'); try { await VFX.gpu.__forceBackend('webgpu'); } catch (e) { report(e); } };
  el('be-webgl').onclick = async () => { setOn(['be-webgpu', 'be-webgl', 'be-canvas'], 'be-webgl'); try { await VFX.gpu.__forceBackend('webgl'); } catch (e) { report(e); } };
  el('be-canvas').onclick = () => { setOn(['be-webgpu', 'be-webgl', 'be-canvas'], 'be-canvas'); if (VFX.gpu.enabled) VFX.gpu.toggle(); };
  el('clk-slow').onclick = () => { clock.scale = clock.scale === 1 ? 0.25 : 1; el('clk-slow').classList.toggle('on', clock.scale !== 1); };
  el('clk-pause').onclick = () => { clock.paused = !clock.paused; el('clk-pause').classList.toggle('on', clock.paused); el('clk-pause').textContent = clock.paused ? 'Resume' : 'Pause'; };
  el('clk-step').onclick = () => { if (!clock.paused) { clock.paused = true; el('clk-pause').classList.add('on'); el('clk-pause').textContent = 'Resume'; } clock.stepQ++; };

  // ── BOOT ──
  VFX.applyQuality('lo');   // pin the rung whose sheets the lab carries (before init, so the GPU loads lo)
  VFX.init(); VFX.resize();
  window.addEventListener('resize', () => VFX.resize());
  fetch('COPY.json').then((r) => r.json()).then((j) => { copyMeta = j; }).catch(report);
  load(0).then(() => window.requestAnimationFrame(tick)).catch(report);
  window.__lab = { VFX, clock, replay, load, errors, get fixture() { return F; } };   // for the harness's own proofs
})();
