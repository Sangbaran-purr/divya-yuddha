/* lab.js — VFX-LAB-2+3 (+ LAB-4a: every URL stamped, the cells-drawn readout · LAB-4b: the dissolve exit and its preset preview · LAB-4c: the tempo and FIZZLE sliders · LAB-4d: they start from the data's defaults · LAB-5: memory ladder, sound, fallbacks, mock match · LAB-6: a second card, Indra, by the template) · the harness page. Loaded after lib/* and runtime/vfx.js.
   The page is glue: the fixture → ClashContext → Director plan → Runner → Playback (stage + board). Every piece of logic lives
   in lib/ and is card-agnostic; the only card-specific data are the registry (data/manifestations.json), the faction energy
   (data/factionfx.json) and the actor manifest. Nothing here loads from the live game.
   The copied VFX module and the actor stage both take their clock from here, so slow-mo, pause and frame-step hold everything. */
(function () {
  'use strict';
  const el = (id) => document.getElementById(id);
  // ── THE STAMP (LAB-4a): every lab URL carries ?v=<STAMP> — tools/stamp_lab.js writes the content hash into index.html and STAMP ──
  const STAMP = (document.querySelector('meta[name="lab-stamp"]') || {}).content || 'unstamped';
  const V = (u) => { const x = new URL(u, document.baseURI); x.searchParams.set('v', STAMP); return x.href; };
  let stampNote = 'checking';
  // LAB-7: a card's art, fixture and Play button all come from its registry entry (data/manifestations.json) — keyed by engine id
  const ART = (id) => (REG[id] && REG[id].art ? '../art/' + REG[id].art : null);
  const FIXTURE = (card, seat) => '../fixtures/' + ((REG[card] && REG[card].fixture) || card) + '_seat' + seat + '.json';
  let currentCard = 'meghnad';   // LAB-6: the card whose play the board shows — one Play button per registry card
  const VIEWER = 0;   // the board is read as seat 0; "swap sides" moves the ATTACKER
  const errors = [];
  function report(e) { errors.push(String(e && (e.message || e))); }
  window.addEventListener('error', (ev) => report(ev.error || ev.message));
  window.addEventListener('unhandledrejection', (ev) => report(ev.reason));

  // ── THE LAB CLOCK ──
  const clock = { t: 0, scale: 1, paused: false, stepQ: 0, cbs: [], nextId: 1, lastReal: null, frames: 0, fpsT0: 0, fps: 0 };
  let readoutAt = null;
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
    if (runner && !runner.done && runner.t > 30) { try { measureLayout(); } catch (e) { report(e); } }
    if (readoutAt == null || real - readoutAt >= 250) { readoutAt = real; readout(); }   // text four times a second: the DOM work stays off the actor's frames
    window.requestAnimationFrame(tick);
  }

  // ── MODE ──
  const MODES = { full: { speed: 1, reduced: false }, fast: { speed: 0.6, reduced: false }, reduced: { speed: 1, reduced: true } };
  let mode = 'full';
  let tempoOverride = null, fizzleOverride = null;   // LAB-4c/4d: a slider moved this session overrides the data's defaults; untouched, the defaults play
  let exitPreset = '';   // LAB-4b: '' = the card's own faction; otherwise preview that faction's exit on this actor

  // ── THE COPIED RUNTIME (existing effects: the Asura embers, the Chaos Surge) ──
  const VFX = window.LabVFX.create({
    $: el, vfxT: () => MODES[mode].speed * window.LabVFX.PAGE.CHOREO_SPEED, reducedMotion: () => MODES[mode].reduced, jankSample: () => {},
    requestAnimationFrame: labRaf, cancelAnimationFrame: labCaf, performance: labPerformance,
  });

  // ── THE ACTOR STAGE ──
  const stage = new window.ActorStage({ field: el('field'), under: el('actorunder'), actorCanvas: el('actorcanvas'), gpuCanvas: el('actorgpu'), over: el('actorover'),
    now: () => clock.t, pixiUrl: V('assets/vendor/pixi.min.mjs') });

  // ── SOUND (LAB-5): the game's audio pattern, copied — unlocked by the first gesture, the game's own sound switch and volume ──
  const audio = window.LabAudio.create({ files: { contact: V('../audio/sfx_unit_clash.mp3'), exit: V('../audio/sfx_chaos_surge.mp3') }, now: () => clock.t });
  let audioUnlocked = false;
  function unlockAudioOnce() { if (audioUnlocked) return; audioUnlocked = true; audio.unlock(); ['pointerdown', 'click', 'touchstart', 'keydown'].forEach((ev) => window.removeEventListener(ev, unlockAudioOnce)); }
  ['pointerdown', 'click', 'touchstart', 'keydown'].forEach((ev) => window.addEventListener(ev, unlockAudioOnce));

  // ── DATA ──
  let REG = {}, REG_DEFAULTS = {}, FFX = {}, copyMeta = null;
  // ── THE ACTORS (LAB-5, ruling A5): a manifest is small JSON, cached. An atlas is fetched COMPRESSED when its card enters a hand (the
  // prefetch — no network stall at the first play), DECODED only when a play shows its actor, and RELEASED after SETTLE ──
  const actors = {}, manifests = {}, prefetched = {};
  let qualityOverride = '', lastDecode = null;
  async function manifestFor(cardId) {
    if (manifests[cardId]) return manifests[cardId];
    const entry = REG[cardId]; if (!entry) return null;
    const murl = new URL(V(entry.manifest));
    const manifest = await fetch(murl).then((r) => r.json());
    const v = window.ActorManifest.validate(manifest);
    if (!v.ok) { report('manifest ' + cardId + ': ' + v.errors.join('; ')); return null; }
    manifest.__url = murl.href;
    return (manifests[cardId] = manifest);
  }
  function backendName() { return stage.backend === 'pixi' && stage.app ? String(stage.renderer).split(' ')[0] : 'canvas2d'; }
  // the quality rung this device plays (512 or 256), or the lab's override
  function rungFor(mf) {
    return window.ActorManifest.pickRung({ backend: backendName(), dpr: window.devicePixelRatio || 1, deviceMemory: navigator.deviceMemory, override: qualityOverride, available: window.ActorManifest.rungsOf(mf) });
  }
  // the compressed atlas of that rung, fetched once and kept as bytes — never decoded here
  async function prefetch(cardId) {
    const mf = await manifestFor(cardId); if (!mf) return null;
    const rung = rungFor(mf).rung, key = cardId + '@' + rung;
    if (!prefetched[key]) {
      const p = fetch(V(new URL(window.ActorManifest.forRung(mf, rung).atlas, mf.__url).href)).then((r) => r.blob()).then((blob) => ({ blob, bytes: blob.size, rung }));
      p.then((v) => { p.done = v; }).catch(report);
      prefetched[key] = p;
    }
    return prefetched[key];
  }
  function prefetchHands() {
    if (!F) return;
    [0, 1].forEach((seat) => F.before.seats[seat].hand.forEach((c) => { if (REG[c.id] && REG[c.id].manifest) prefetch(c.id).catch(report); }));
  }
  function prefetchedBytes() { let n = 0; Object.keys(prefetched).forEach((k) => { if (prefetched[k].done) n += prefetched[k].done.bytes; }); return n; }
  // at play, for a play that shows the actor: decode the prefetched bytes (fetching now only if no hand prefetch happened)
  async function actorFor(cardId) {
    if (actors[cardId]) return actors[cardId];
    const mf = await manifestFor(cardId); if (!mf) return null;
    const pick = rungFor(mf), had = !!prefetched[cardId + '@' + pick.rung];
    const pre = await prefetch(cardId), t0 = performance.now();
    let image;
    if (window.createImageBitmap) image = await createImageBitmap(pre.blob);
    else { image = new Image(); image.decoding = 'async'; const u = URL.createObjectURL(pre.blob); image.src = u; await image.decode(); URL.revokeObjectURL(u); }
    const manifest = window.ActorManifest.forRung(mf, pick.rung);
    lastDecode = { ms: Math.round(performance.now() - t0), rung: pick.rung, source: had ? 'prefetched from the hand' : 'fetched at play' };
    const art = actors[cardId] = { manifest, image, rung: pick.rung, decodeMs: lastDecode.ms };
    // the dissolve's embers start only on the figure: each held cell's silhouette by column, read once from its alpha
    const sil = {};
    art.silhouetteOf = (ci) => {
      if (sil[ci] !== undefined) return sil[ci];
      const c = manifest.cells[ci]; if (!c) return (sil[ci] = null);
      try {
        const cv = document.createElement('canvas'); cv.width = c.w; cv.height = c.h;
        const g = cv.getContext('2d', { willReadFrequently: true }); g.drawImage(image, c.x, c.y, c.w, c.h, 0, 0, c.w, c.h);
        sil[ci] = window.Dissolve.silhouette(g.getImageData(0, 0, c.w, c.h).data, c.w, c.h, 24);
      } catch (e) { sil[ci] = null; }
      return sil[ci];
    };
    (manifest.phases.fizzle || []).forEach((ci) => art.silhouetteOf(ci));
    stage.loadActor(cardId, art);
    return art;
  }
  // after SETTLE: the stage destroys the GPU texture and closes the bitmap; the page lets go of it (the compressed bytes stay cached)
  function release(cardId) { if (stage.unloadActor(cardId)) delete actors[cardId]; }

  // ── THE BOARD ──
  let F = null, attackerSeat = 0, runner = null, playback = null, lastPlan = null, lastDone = null;
  const memory = window.Director.createMemory();
  const sideOf = (seat) => seat === VIEWER ? 'me' : 'opp';
  function cardEl(c) {
    const d = document.createElement('div'); d.className = 'bc'; d.dataset.uid = c.uid;
    if (ART(c.id)) { const im = document.createElement('img'); im.src = V(ART(c.id)); im.alt = c.n; im.decoding = 'async'; d.appendChild(im); }
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
    board.seats[VIEWER].hand.slice(0, 6).forEach((c) => { const s = document.createElement('span'); s.className = 'chip' + (c.id === currentCard ? ' hot' : ''); s.textContent = c.n; hand.appendChild(s); });
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
    const ch = F.diff.changed.map((c) => c.n + ' ' + c.eff.from + ' → ' + c.eff.to).join(', '), en = F.diff.entered.map((c) => c.n + ' enters at ' + c.eff).join(', ');
    el('story-truth').textContent = F.diff.changed.length
      ? 'The board difference: ' + ch + '. No event carried this; the engine only logged "' + (F.log.find((l) => /bolt|strikes/.test(l)) || F.log[F.log.length - 1]) + '". It lands at SETTLE.'
      : 'The board difference: ' + en + ', and nothing else. No power changes, so SETTLE lands no numbers: the card is simply on the board.';
  }
  async function load(seat, card) {
    stopRun();
    if (card) currentCard = card;
    attackerSeat = seat; F = await fetch(V(FIXTURE(currentCard, seat))).then((r) => r.json());
    render(F.before, []); story(); prefetchHands();
    el('seat-swap').textContent = 'Swap sides: ' + F.action.card + ' is ' + (attackerSeat === VIEWER ? 'yours' : 'the opponent\'s');
    el('card-buttons').querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.card === currentCard));
  }
  // LAB-6: a Play button for each card; switching card sets its fixture with the card as YOURS (Swap sides still moves it)
  async function playCard(card) { if (card !== currentCard) await load(VIEWER, card); await play({}); }

  // ── PLAY ──
  function timingOf(mf) {
    return mf && mf.timing === 'native' ? { fps: mf.fps, emerge: mf.phases.emerge.length, act: mf.phases.act.length, contact: mf.contact, emergeMs: mf.phaseMs && mf.phaseMs.emerge, actMs: mf.phaseMs && mf.phaseMs.act } : null;
  }
  // LAB-4d: the tempo and FIZZLE a play starts from — the card's manifest, its exit preset, the registry's defaults — unless a slider moved
  function tuningFor(ctx, mf) {
    return window.ActorManifest.defaultsFor({ manifest: mf, registry: { defaults: REG_DEFAULTS }, preset: window.Dissolve.pick(FFX, ctx.faction, exitPreset), override: { tempo: tempoOverride, fizzleMs: fizzleOverride } });
  }
  // the sliders show what will play: an untouched slider sits on the default and says so
  function syncSliders(t) {
    if (tempoOverride == null) el('tempo').value = t.base.tempo;
    if (fizzleOverride == null) el('fizzle-ms').value = t.base.fizzleMs;
    el('tempo-val').textContent = t.tempo.toFixed(2) + '×' + (t.from.tempo === 'slider' ? ' (default ' + t.base.tempo.toFixed(2) + '×)' : ' · default, from the ' + t.from.tempo);
    el('fizzle-val').textContent = t.fizzleMs + ' ms' + (t.from.fizzleMs === 'slider' ? ' (default ' + t.base.fizzleMs + ')' : ' · default, from the ' + t.from.fizzleMs);
    return t;
  }
  // the plan the next play would run, printed as soon as a slider or the mode moves (a play already running keeps its timeline)
  async function previewPlan() {
    if (!F) return;
    const ctx = window.ClashContext.fromBatch(F), reg = REG[ctx.cardId] || {};
    const mf = (ctx.scope === 'manifest' && reg.manifest) ? await manifestFor(ctx.cardId) : null, { tempo, fizzleMs } = syncSliders(tuningFor(ctx, mf));
    const p = window.Director.plan(ctx, { mode, prior: memory.count(ctx.cardId), ladderExempt: !!reg.ladderExempt, timing: timingOf(mf), tempo, fizzleMs, exit: exitFor(reg, mf, ctx) });
    el('plan').textContent = (runner && !runner.done ? '(the play running now keeps its own timeline — these values apply from the next play)' : '(the next play — press Play ' + F.action.card + ')') + '\n\n' + window.Director.formatPlan(p);
  }
  // LAB-8: the registry's exit ("native" = the clip's own) — the Exit preset dropdown still previews the procedural dissolve on any card
  function exitFor(reg, mf, ctx) { const x = window.ActorManifest.exitMode({ entry: reg, manifest: mf, override: exitPreset }); if (x.error) report(ctx.cardName + ': ' + x.why); return x.exit; }
  function stopRun() { if (runner && !runner.done) runner.skip(); runner = null; }   // LAB-5: an interrupted play lands on AFTER, nothing left behind
  async function play(opts) {
    opts = opts || {};
    stopRun();
    const ctx = window.ClashContext.fromBatch(F);
    const boards = window.ClashContext.boards(ctx, F.before, F.after);
    const reg = REG[ctx.cardId] || {};
    const prior = opts.phase ? 0 : memory.count(ctx.cardId);
    const mf = (ctx.scope === 'manifest' && reg.manifest) ? await manifestFor(ctx.cardId) : null;
    const timing = timingOf(mf), { tempo, fizzleMs } = syncSliders(tuningFor(ctx, mf));
    lastPlan = window.Director.plan(ctx, { mode, prior, ladderExempt: !!reg.ladderExempt, timing, tempo, fizzleMs, exit: exitFor(reg, mf, ctx) });
    const art = lastPlan.actor && mf ? await actorFor(ctx.cardId) : null;   // A5: an atlas is decoded only for a play that shows its actor
    if (!opts.phase) memory.record(ctx.cardId);
    el('memory-note').textContent = 'Match memory: ' + ctx.cardName + ' has manifested ' + memory.count(ctx.cardId) + ' time' + (memory.count(ctx.cardId) === 1 ? '' : 's') + '. The second play in a match runs Fast.';
    lastDone = null;
    const f = fieldRect();
    playback = window.Playback.create({
      stage, ctx, boards, viewer: VIEWER, field: { w: f.width, h: f.height },
      rectOf, clientOf, bandOf, render, fieldClient: () => { const r = fieldRect(); return { x: r.left, y: r.top }; },
      pulse: (uid, ms) => { const n = el('field').querySelector('.bc[data-uid="' + uid + '"]'); if (n) { n.classList.add('pulse'); setTimeout(() => n.classList.remove('pulse'), ms); } },
      actorFor: (id) => actors[id] || null, release, sound: (name) => audio.play(name),
      factionFx: (fac) => window.Dissolve.pick(FFX, fac, exitPreset),
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
    layout = { base: null, maxShift: 0, samples: 0, worst: '' };
    runner.start(ph ? { from: ph.t0, to: ph.t1 } : {});
  }

  // ── LAYOUT SHIFT (LAB-5): every board card's LAYOUT box (offsets — the camera impulse is a transform and does not count), sampled each
  // frame of a play after its card enters, against the play's first sample ──
  let layout = { base: null, maxShift: 0, samples: 0, worst: '' }, layoutPeak = 0;
  function layoutSnap() {
    const out = {};
    el('field').querySelectorAll('.bc').forEach((n) => { out[n.dataset.uid] = [n.offsetLeft, n.offsetTop, n.offsetWidth, n.offsetHeight]; });
    ['field', 'hand'].forEach((id) => { const n = el(id); out['#' + id] = [n.offsetLeft, n.offsetTop, n.offsetWidth, n.offsetHeight]; });
    return out;
  }
  function measureLayout() {
    const now = layoutSnap(); layout.samples++;
    if (!layout.base) { layout.base = now; return; }
    Object.keys(now).forEach((k) => { const b = layout.base[k]; if (!b) return; for (let i = 0; i < 4; i++) { const d = Math.abs(now[k][i] - b[i]); if (d > layout.maxShift) { layout.maxShift = d; layout.worst = k; } } });
    layoutPeak = Math.max(layoutPeak, layout.maxShift);
  }

  // ── A HIDDEN PAGE (LAB-5): a tab switch or a locked phone mid-play lands the play at once — the board on AFTER, nothing left behind ──
  let hiddenSkips = 0;
  document.addEventListener('visibilitychange', () => { if (document.hidden && runner && !runner.done) { runner.skip(); hiddenSkips++; } });

  // ── MOCK MATCH (LAB-5): the manifestation in the rhythm of a match, with the game's own gaps — the owner judges tempo here ──
  const MOCK = {
    thinkMs: Math.round((1200 + 3500) / 2),        // the game's aiThinkTime() clamps to 1200–3500 ms: its midpoint
    showcaseMs: Math.round((1400 + 300) * 1.3),    // showcaseCard(): the card held 1400 ms, then 300 ms out, × CHOREO_SPEED 1.3
    landMs: Math.round(700 * 1.3),                 // the card lands and settles (callout 700 ms × 1.3)
    yourTurnMs: 2000,                              // your own decision time — a nominal pause, not measured
  };
  let mockRunning = false, mockLog = [];
  const labWait = (ms) => new Promise((res) => { const until = clock.t + ms; const step = () => (clock.t >= until ? res() : labRaf(step)); labRaf(step); });
  const runEnd = () => new Promise((res) => { const step = () => (!runner || runner.done ? res() : labRaf(step)); labRaf(step); });
  function oppPlay(k) {
    const def = F.defenderSeat, hand = F.before.seats[def].hand, c = hand[k % hand.length];
    const board = JSON.parse(JSON.stringify(F.after)), card = { uid: 'mock-' + k + '-' + c.uid, id: c.id, n: c.n, eff: c.p != null ? c.p : (c.eff != null ? c.eff : 3) };
    board.seats[def].units.push(card);
    return { board, card };
  }
  async function opponentTurn(k) {
    let t = clock.t; banner('The opponent is thinking…', MOCK.thinkMs); await labWait(MOCK.thinkMs); mark('the opponent thinks (the game: 1.2–3.5 s)', t);
    t = clock.t; const o = oppPlay(k); banner(o.card.n + ' — played', MOCK.showcaseMs); await labWait(MOCK.showcaseMs);
    render(o.board, []); const c = clientOf(o.card.uid); if (c) VFX.cardLand(c.cx, c.cy); await labWait(MOCK.landMs); mark('the opponent plays ' + o.card.n + ' (showcase, then its landing)', t);
  }
  let mockT0 = 0;
  function mark(what, t0) { mockLog.push({ what, from: Math.round(t0 - mockT0), to: Math.round(clock.t - mockT0) }); showMock(false); }
  async function mockMatch() {
    if (mockRunning) return; mockRunning = true;
    if (currentCard !== 'meghnad') await load(VIEWER, 'meghnad');   // the mock match is Meghnad's
    mockLog = []; memory.reset(); stopRun(); mockT0 = clock.t;
    try {
      let t = clock.t; render(F.before, []); await play({}); await runEnd(); mark('Meghnad manifests — ' + lastPlan.mode, t);
      await opponentTurn(0);
      t = clock.t; await labWait(MOCK.yourTurnMs); mark('your turn (a nominal 2 s)', t);
      t = clock.t; render(F.before, []); await play({}); await runEnd(); mark('Meghnad again — ' + lastPlan.mode + ' (the repeat rule)', t);
      await opponentTurn(1);
    } finally { mockRunning = false; showMock(true); }
  }
  function showMock(done) {
    const total = mockLog.length ? mockLog[mockLog.length - 1].to : 0;
    el('plan').textContent = 'MOCK MATCH' + (done ? ' — done' : ' — playing') + ' · the gaps are the game\'s: AI think ' + MOCK.thinkMs + ' ms (midpoint of 1200–3500), showcase ' + MOCK.showcaseMs + ' ms (1400 + 300, × 1.3), landing ' + MOCK.landMs + ' ms; your turn ' + MOCK.yourTurnMs + ' ms (nominal)\n\n' +
      mockLog.map((m) => ('    ' + (m.from / 1000).toFixed(2)).slice(-6) + ' s → ' + (m.to / 1000).toFixed(2) + ' s   ' + ((m.to - m.from) / 1000).toFixed(2) + ' s   ' + m.what).join('\n') + '\n\nmock match total ' + (total / 1000).toFixed(2) + ' s';
    el('ro-mock').textContent = mockLog.length ? mockLog.length + ' steps · ' + (total / 1000).toFixed(2) + ' s' + (done ? '' : ' so far') : '—';
  }

  // ── READOUT ──
  function mb(n) { return (n / 1048576).toFixed(2) + ' MB'; }
  function readout() {
    const g = VFX.gpu, s = stage.stats();
    el('ro-fps').textContent = String(clock.fps);
    el('ro-time').textContent = (clock.paused ? 'paused' : clock.scale + '×') + ' · ' + (clock.t / 1000).toFixed(2) + ' s · ' + mode + (runner && !runner.done ? ' · playing ' + Math.round(runner.t) + ' ms' + (runner.speed !== 1 ? ' at ' + runner.speed + '×' : '') : '');
    el('ro-renderer').textContent = 'effects ' + (g.renderer || 'none') + (g.enabled ? '' : ' (off → Canvas 2D)') + (g.texReady ? ' · surge ready' : '');
    el('ro-actor').textContent = s.backend + ' · ' + s.cellPx + ' px cells · drawn ' + s.drawnPx + ' px · cells drawn ' + (s.cellsDrawn ? s.cellsDrawn.drawn + '/' + s.cellsDrawn.total + (s.cellsDrawn.live ? ' so far' : '') + (s.cellsDrawn.cellFps ? ' at ' + Math.round(s.cellsDrawn.cellFps * 100) / 100 + '/s' : '') + ' · repeats ' + s.cellsDrawn.repeats + (s.cellsDrawn.contact ? ' · contact on ' + s.cellsDrawn.contact : '') : '—') + ' · ' + (s.liveFps != null ? s.liveFps + ' fps now' : (s.fps ? s.fps + ' fps last run' : 'no run yet')) + ' · draw ' + s.drawMsAvg.toFixed(2) + ' ms/frame · live actors ' + stage.liveActors() + ' · GPU sprites ' + stage.liveSprites() + (lastDone ? (lastDone.equalsFinal ? ' · final board = engine AFTER ✓' : ' · final board ≠ AFTER ✖') : '');
    el('ro-rung').textContent = VFX.currentRung();
    el('ro-sprites').textContent = 'Canvas 2D ' + VFX.sprCount() + ' · GPU ' + (g.live != null ? g.live : 0);
    let fetchMs = 0, bytes = 0;
    try { performance.getEntriesByType('resource').forEach((r) => { if (/\/lab\/vfx-manifestation\//.test(r.name)) { fetchMs += r.duration; bytes += (r.transferSize || r.encodedBodySize || 0); } }); } catch (e) {}
    el('ro-decode').textContent = 'fetch ' + Math.round(fetchMs) + ' ms · bake ' + Math.round(VFX.bakeMs()) + ' ms' + (lastDecode ? ' · last actor decode ' + lastDecode.ms + ' ms (' + lastDecode.rung + ' px, ' + lastDecode.source + ')' : '');
    let decoded = 0;
    if (copyMeta && g.texReady) copyMeta.files.filter((f) => /sheets\//.test(f.to) && f.px).forEach((f) => { decoded += f.px.w * f.px.h * 4; });
    el('ro-mb').textContent = 'actor ' + mb(s.decodedBytes) + ' decoded now (' + s.actorsLoaded + ' loaded · peak ' + mb(s.peakDecoded) + ' · ' + s.loads + ' decodes, ' + s.unloads + ' releases) · compressed in cache ' + mb(prefetchedBytes()) + ' · effect sheets ≈ ' + mb(decoded) + ' · transferred ' + mb(bytes);
    const mq = manifests[currentCard], pq = mq ? rungFor(mq) : null, rq = el('ro-quality');
    if (rq) rq.textContent = pq ? pq.rung + ' px · ' + pq.why + ' (DPR ' + (window.devicePixelRatio || 1) + (navigator.deviceMemory ? ' · ' + navigator.deviceMemory + ' GB hint' : ' · no memory hint') + ')' : '—';
    const so = audio.settings(), lg = audio.log[audio.log.length - 1], rso = el('ro-sound');
    if (rso) rso.textContent = (so.sfxOn ? 'game sound on · ' + Math.round(so.sfxVol * 100) + '%' : 'game sound OFF (muted in the game\'s settings)') + ' · ' + audio.state + (lg ? ' · last: ' + lg.name + ' → ' + lg.outcome : '');
    const rl = el('ro-layout');
    if (rl) rl.textContent = (layout.samples ? 'largest board shift ' + layout.maxShift + ' px over ' + layout.samples + ' frames of the last play' + (layout.maxShift ? ' (' + layout.worst + ')' : ' ✓') + ' · worst this session ' + layoutPeak + ' px' : '—') + (hiddenSkips ? ' · page hidden mid-play ' + hiddenSkips + '× → landed on AFTER' : '');
    const e = el('ro-errors'); e.textContent = errors.length ? errors.length + ' — ' + errors[errors.length - 1] : '0'; e.className = errors.length ? 'bad' : '';
    const x = s.exit, rx = el('ro-exit');
    if (rx) rx.textContent = x ? x.name + ' dissolve · ' + (x.path === 'shader' ? 'GPU filter' : 'Canvas 2D mask') + ' · front ' + x.edge + ' · embers ' + x.embers + ' (peak ' + x.peak + ') · smoke ' + x.smoke + ' · ' + x.frames + ' frames, sweep ' + (x.monotonic ? 'monotonic ✓' : 'NOT monotonic ✖') + (x.progress < 1 ? ' · ' + Math.round(x.progress * 100) + '%' : '')
      : lastPlan && lastPlan.exit === 'native' ? 'native — the clip carries its own exit, no FIZZLE (pick an Exit preset to preview the procedural dissolve)' : (exitPreset ? 'preview: ' + ((FFX[exitPreset] || {}).name || exitPreset) + ' — press Play' : '—');
    const rs = el('ro-stamp'); if (rs) { rs.textContent = STAMP + ' · ' + stampNote; rs.className = /STALE|unreadable/.test(stampNote) ? 'bad' : ''; }
  }

  // ── CONTROLS ──
  function setOn(ids, on) { ids.forEach((id) => el(id).classList.toggle('on', id === on)); }
  // LAB-7: one Play button per registry card that has an actor, in registry order (the buttons were typed per card)
  function cardButtons() {
    const box = el('card-buttons'); box.textContent = '';
    Object.keys(REG).filter((id) => REG[id].manifest).forEach((id) => {
      const b = document.createElement('button'); b.className = 'primary'; b.type = 'button'; b.id = 'play-' + id; b.dataset.card = id;
      b.textContent = 'Play ' + (REG[id].label || REG[id].name || id); b.onclick = () => { playCard(id).catch(report); }; box.appendChild(b);
    });
  }
  ['awaken', 'emerge', 'act', 'fizzle', 'settle'].forEach((p) => { el('phase-' + p).onclick = () => { play({ phase: p.toUpperCase() }).catch(report); }; });
  el('ctl-skip').onclick = () => { if (runner && !runner.done) runner.skip(); };
  el('ctl-ff').onclick = () => { if (runner && !runner.done) runner.fastForward(runner.speed === 3 ? 1 : 3); };
  el('ctl-memory').onclick = () => { memory.reset(); el('memory-note').textContent = 'Match memory reset: the next play runs in the chosen mode.'; };
  ['full', 'fast', 'reduced'].forEach((m) => { el('mode-' + m).onclick = () => { mode = m; setOn(['mode-full', 'mode-fast', 'mode-reduced'], 'mode-' + m); previewPlan().catch(report); }; });
  el('seat-swap').onclick = () => { load(1 - attackerSeat).catch(report); };
  el('quality').onchange = (e) => { qualityOverride = e.target.value; prefetchHands(); };
  el('mock-match').onclick = () => { mockMatch().catch(report); };
  el('exit-preset').onchange = (e) => { exitPreset = e.target.value; };
  el('tempo').oninput = (e) => { tempoOverride = +e.target.value; previewPlan().catch(report); };
  el('fizzle-ms').oninput = (e) => { fizzleOverride = +e.target.value; previewPlan().catch(report); };
  el('exit-preset').addEventListener('change', () => { previewPlan().catch(report); });   // another faction's preset may bring its own fizzle_ms
  async function backend(which) {
    setOn(['be-webgpu', 'be-webgl', 'be-canvas'], 'be-' + which);
    stopRun();
    try { if (which === 'canvas') { if (VFX.gpu.enabled) VFX.gpu.toggle(); } else await VFX.gpu.__forceBackend(which); } catch (e) { report(e); }
    try { await stage.useBackend(which); } catch (e) { report(e); }
    prefetchHands();   // the rung may change with the renderer
  }
  el('be-webgpu').onclick = () => backend('webgpu');
  el('be-webgl').onclick = () => backend('webgl');
  el('be-canvas').onclick = () => backend('canvas');
  el('clk-slow').onclick = () => { clock.scale = clock.scale === 1 ? 0.25 : 1; el('clk-slow').classList.toggle('on', clock.scale !== 1); };
  el('clk-pause').onclick = () => { clock.paused = !clock.paused; el('clk-pause').classList.toggle('on', clock.paused); el('clk-pause').textContent = clock.paused ? 'Resume' : 'Pause'; };
  el('clk-step').onclick = () => { if (!clock.paused) { clock.paused = true; el('clk-pause').classList.add('on'); el('clk-pause').textContent = 'Resume'; } clock.stepQ++; };

  // ── BOOT ──
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {   // LAB-5: the device asks for reduced motion → no actor
    mode = 'reduced'; setOn(['mode-full', 'mode-fast', 'mode-reduced'], 'mode-reduced');
    el('memory-note').textContent = 'This device asks for reduced motion: plays run Reduced (a card pulse, then the numbers). Pick Full or Fast to override.';
  }
  VFX.applyQuality('lo');   // the rung whose sheets the lab carries (before init, so the GPU loads lo)
  VFX.init(); VFX.resize();
  window.addEventListener('resize', () => { VFX.resize(); stage.resize(); });
  Promise.all([
    fetch(V('COPY.json')).then((r) => r.json()).then((j) => { copyMeta = j; }),
    fetch(V('../data/manifestations.json')).then((r) => r.json()).then((j) => { REG = j.cards || {}; REG_DEFAULTS = j.defaults || {}; }),
    fetch(V('../data/factionfx.json')).then((r) => r.json()).then((j) => { FFX = j; }),
  ]).then(() => { cardButtons(); return load(0, 'meghnad'); }).then(() => { stage.useBackend('webgpu').then(() => prefetchHands()).catch(report); window.requestAnimationFrame(tick); previewPlan().catch(report); }).catch(report);   // the rung depends on the renderer: prefetch again once it is up
  // is this page the served one? STAMP read past every cache; a cached page reloads itself once onto the served stamp
  fetch(new URL('../STAMP', document.baseURI).href + '?t=' + Date.now(), { cache: 'no-store' }).then((r) => (r.ok ? r.text() : null)).then((served) => {
    served = served && served.trim();
    if (!served) { stampNote = 'served STAMP unreadable'; return; }
    if (served === STAMP) { stampNote = 'current'; return; }
    const here = new URL(location.href);
    if (here.searchParams.get('v') !== served) { here.searchParams.set('v', served); location.replace(here.href); return; }
    stampNote = 'STALE — this page is ' + STAMP + ', the server has ' + served; report('stale lab page: ' + stampNote);
  }).catch(() => { stampNote = 'served STAMP unreadable'; });
  window.__lab = { STAMP, VFX, stage, audio, mockMatch, playCard, get card() { return currentCard; }, release, rungFor, manifests, prefetched, get actors() { return actors; }, get layout() { return layout; }, get mockLog() { return mockLog; }, clock, play, load, memory, errors, get runner() { return runner; }, get plan() { return lastPlan; }, get playback() { return playback; }, get done() { return lastDone; }, get fixture() { return F; } };
})();
