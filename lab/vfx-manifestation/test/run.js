#!/usr/bin/env node
'use strict';
// VFX-LAB-1 — the harness's own proofs.   node lab/vfx-manifestation/test/run.js
//
//   F · THE FIXTURE     it is what the real engine does, today: events in engine order, the Hero's −2 in the board
//                       difference and the log only, both seats
//   R · THE RUNTIME     the lab's module is the game's module byte-for-byte (drift is reported, line by line), its injected
//                       names are the page dependencies, it runs headless on those alone, the asset subset is exact
//   P · THE PAGE        noindex, the #field/#vfxcanvas structure, every control
//   G · THE RULE        no tracked change outside lab/ since the lab began (except the ruling doc, A8), nothing outside
//                       lab/ references it, the site's sync never archives it, Kling sources and matted frames are ignored
//   D · THE RULING      the doc carries the amendment, A1–A8
// The game's own suites are not run here; they run beside this on every lab commit.
const fs = require('fs'), path = require('path'), crypto = require('crypto'), cp = require('child_process');
const LAB = path.resolve(__dirname, '..'), GAME = path.resolve(LAB, '..', '..');
const WEB = process.env.DY_WEB || path.resolve(GAME, '..', 'divya-yuddha-web');
const LAB_BASE = 'e2f4c19';   // GL-3 — the game commit the lab began from; every tracked change since must live in lab/ (A8: the doc, this once)
const DOC = 'docs/VFX_MANIFESTATION_v1.md';
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  ✓ ' + n); } else { fail++; console.log('  ✖ ' + n + (d ? '\n      ' + d : '')); } };
const J = (x) => JSON.stringify(x);
const sha256 = (b) => crypto.createHash('sha256').update(b).digest('hex');
const rel = (p) => path.relative(GAME, p);
const git = (args) => cp.execFileSync('git', args, { cwd: GAME, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

// ═══ F · THE FIXTURE ═══
console.log('── F · the fixture: the real engine, both seats ──');
{
  const { build } = require(path.join(LAB, 'fixtures', 'make_fixture.js'));
  const liveEngineSha = sha256(fs.readFileSync(path.join(GAME, 'src', 'engine.js')));
  for (const seat of [0, 1]) {
    const file = path.join(LAB, 'fixtures', 'meghnad_seat' + seat + '.json');
    const saved = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;
    const fresh = build(seat);
    ok('F' + (seat + 1) + ' · the seat-' + seat + ' fixture is what a fresh engine run produces today (every field), on the engine it names (sha ' + liveEngineSha.slice(0, 12) + '…)',
       !!saved && J(saved) === J(fresh) && saved.engine.sha256 === liveEngineSha, saved ? 'differs from a fresh run' : 'missing ' + rel(file));
  }
  const F = [0, 1].map((s) => JSON.parse(fs.readFileSync(path.join(LAB, 'fixtures', 'meghnad_seat' + s + '.json'), 'utf8')));
  const shape = (f) => f.events.map((e) => [e.type, e.abilityName || null, e.text || null, e.amount == null ? null : e.amount]);
  ok('F3 · the events, in engine order, both seats: play Meghnad → toast "Chaos finds a way…" → buff +1 (Chaos Surge) on Meghnad',
     F.every((f) => {
       const m = f.diff.entered.find((c) => c.id === 'meghnad');
       return !!m && J(shape(f)) === J([['play', 'Meghnad', '{p' + f.attackerSeat + '} plays Meghnad', null], ['toast', 'Chaos Surge', 'Chaos finds a way…', null], ['buff', 'Chaos Surge', '+1', 1]]) &&
              f.events[0].sourceUid === m.uid && J(f.events[2].targetUids) === J([m.uid]);
     }), J(F.map(shape)));
  ok('F4 · the strike is in NO event: no event sources or targets the Hero, and only the engine\'s log carries "Meghnad’s bolt strikes Indra for 2 → 5."',
     F.every((f) => {
       const indra = f.before.seats[f.defenderSeat].heroes.find((c) => c.id === 'indra');
       return !!indra && f.events.every((e) => e.sourceUid !== indra.uid && !(e.targetUids || []).includes(indra.uid) && !/Indra/.test(e.text || '')) &&
              f.log.includes('Meghnad’s bolt strikes Indra for 2 → 5.');
     }));
  ok('F5 · the board difference, both seats: exactly ONE changed card — the defender\'s Indra, a Hero, 7 → 5 (−2); Meghnad entered on the attacker\'s units at 7 (printed 6, +1 from the buff event); nothing left',
     F.every((f) => {
       const d = f.diff, c = d.changed[0], e = d.entered[0];
       return d.changed.length === 1 && c.id === 'indra' && c.seat === f.defenderSeat && c.zone === 'heroes' && J(c.eff) === J({ from: 7, to: 5, delta: -2 }) && J(c.power) === J({ from: 7, to: 5, delta: -2 }) &&
              d.entered.length === 1 && e.id === 'meghnad' && e.seat === f.attackerSeat && e.zone === 'units' && e.eff === 7 && d.left.length === 0;
     }), J(F.map((f) => f.diff)));
}

// ═══ R · THE RUNTIME ═══
console.log('\n── R · the runtime copy ──');
const T = require(path.join(LAB, 'tools', 'copy_runtime.js'));
const VFXJS = fs.readFileSync(path.join(LAB, 'runtime', 'vfx.js'), 'utf8');
const COPY = JSON.parse(fs.readFileSync(path.join(LAB, 'runtime', 'COPY.json'), 'utf8'));
{
  const html = fs.readFileSync(path.join(GAME, 'index.html'), 'utf8');
  const live = T.locate(html), mine = T.verbatimOf(VFXJS);
  const a = live.body.split('\n'), b = (mine || '').split('\n');
  const drift = []; for (let i = 0; i < Math.max(a.length, b.length); i++) if (a[i] !== b[i]) drift.push(i);
  console.log('    DRIFT REPORT · live index.html:' + live.start + '-' + live.end + ' (' + a.length + ' lines, sha ' + sha256(live.body).slice(0, 12) + '…) vs lab runtime/vfx.js (' + b.length + ' lines, copied from ' + COPY.source.startLine + '-' + COPY.source.endLine + ' @ ' + String(COPY.source.gameCommit).slice(0, 7) + ') · lines differing: ' + drift.length +
    (drift.length ? ' · first: ' + drift.slice(0, 5).map((i) => 'module line ' + (i + 1) + ' (index.html:' + (live.start + i) + ')').join(', ') : ''));
  ok('R1 · the lab\'s module is the game\'s VFX module BYTE-FOR-BYTE (0 lines of drift against index.html:' + live.start + '-' + live.end + '), and COPY.json names that exact range and sha256',
     mine !== null && drift.length === 0 && COPY.source.sha256 === sha256(live.body) && COPY.source.startLine === live.start && COPY.source.endLine === live.end, drift.length + ' lines differ');
  const consts = T.pageConstants(html);
  const outside = VFXJS.split(T.verbatimOf(VFXJS)).join('');   // the wrapper alone
  const declared = [...outside.matchAll(/var\s+([^;]+);/g)].flatMap((m) => [...m[1].matchAll(/(?:^|,)\s*([A-Za-z_$][\w$]*)\s*=/g)].map((x) => x[1]));
  ok('R2 · the wrapper injects exactly the module\'s page dependencies (' + T.PAGE_NAMES.join(', ') + ') and the clock (' + T.CLOCK_NAMES.join(', ') + '), defaulting to the page\'s own constants (CHOREO_SPEED ' + consts.CHOREO_SPEED + ', LEGACY_VFX ' + consts.LEGACY_VFX + ')',
     J(declared.filter((n) => n !== 'deps' && n !== 'PAGE').sort()) === J(T.PAGE_NAMES.concat(T.CLOCK_NAMES).sort()) && J(COPY.injected.pageConstants) === J(consts) && VFXJS.indexOf('var PAGE = ' + J(consts) + ';') >= 0, J(declared));
}
{
  let JSDOM = null; try { ({ JSDOM } = require(require.resolve('jsdom', { paths: [path.join(WEB, 'tests')] }))); } catch (e) { JSDOM = null; }
  if (!JSDOM) { fail++; console.log('  ✖ R3 SKIPPED LOUDLY — jsdom not found under ' + path.join(WEB, 'tests') + ' (set DY_WEB). The headless run did NOT happen.'); }
  else {
    const dom = new JSDOM('<!doctype html><body><div id="field" style="width:390px;height:360px"><canvas id="vfxcanvas"></canvas><div id="vfxflash"></div></div></body>', { url: 'https://lab.test/lab/vfx-manifestation/', pretendToBeVisual: true, runScripts: 'outside-only' });
    const w = dom.window, errs = [];
    const ctx = new Proxy({}, { get: (t, k) => k === 'measureText' ? () => ({ width: 10 }) : /^create(Linear|Radial)Gradient$|^createPattern$/.test(String(k)) ? () => ({ addColorStop() {} }) : k === 'getImageData' ? (x, y, ww, hh) => ({ data: new Uint8ClampedArray(Math.max(4, (ww || 1) * (hh || 1) * 4)) }) : () => undefined, set: () => true });
    w.HTMLCanvasElement.prototype.getContext = () => ctx;
    w.HTMLCanvasElement.prototype.toDataURL = () => 'data:,';
    let api = null, frames = 0;
    const clock = { t: 0, cbs: [] };
    try {
      w.eval(VFXJS);
      const VFX = w.LabVFX.create({ $: (id) => w.document.getElementById(id), vfxT: () => 1.3, reducedMotion: () => false, jankSample: () => {},
        requestAnimationFrame: (cb) => { clock.cbs.push(cb); return clock.cbs.length; }, cancelAnimationFrame: () => {}, performance: { now: () => clock.t } });
      api = VFX;
      const rung = VFX.applyQuality('lo'); VFX.init(); VFX.resize();
      VFX.cardLand(120, 200); VFX.sprSurge(120, 200, 64);
      for (let i = 0; i < 90; i++) { clock.t += 1000 / 60; const run = clock.cbs; clock.cbs = []; run.forEach((cb) => { cb(clock.t); frames++; }); }
      VFX.__advance2D(1 / 60);
      if (rung !== 'lo') errs.push('rung ' + rung);
    } catch (e) { errs.push(String(e && e.stack || e).split('\n').slice(0, 2).join(' | ')); }
    const need = ['init', 'resize', 'cardLand', 'sprSurge', 'applyQuality', 'currentRung', 'sprCount', 'bakeMs', 'gpu'];
    ok('R3 · the copied module runs headless on the injected names ALONE (no game page present): init, the lo rung, cardLand and sprSurge, ' + frames + ' frames through the injected clock — no ReferenceError, the public API intact',
       errs.length === 0 && !!api && need.every((k) => k in api) && frames > 0 && api.currentRung() === 'lo', errs.join(' ; '));
  }
}
{
  const files = COPY.files;
  const exact = ['runtime/assets/vendor/pixi.min.mjs', 'runtime/assets/vfx/game/sheets/vfx_surge_1.png', 'runtime/assets/vfx/game/sheets/vfx_surge_2.png', 'runtime/assets/vfx/game/sheets/mv/vfx_surge_1.png', 'runtime/assets/vfx/game/sheets/mv/vfx_surge_2.png'];
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((x) => x.isDirectory() ? walk(path.join(d, x.name)) : [path.join(d, x.name)]);
  const onDisk = walk(path.join(LAB, 'runtime', 'assets')).map((p) => path.relative(LAB, p)).sort();
  const same = (f) => { const a = fs.readFileSync(path.join(GAME, f.from)), b = fs.readFileSync(path.join(LAB, f.to)); return a.equals(b) && sha256(b) === f.sha256; };
  const total = files.reduce((a, f) => a + f.bytes, 0);
  ok('R4 · the asset subset is exact: runtime/assets holds only the Pixi copy + ONE effect\'s sheets (Chaos Surge, lo rung, colour + MV), the art only Meghnad and Indra — every file byte-identical to the game\'s (' + (total / 1048576).toFixed(2) + ' MB)',
     J(onDisk) === J(exact.slice().sort()) && files.length === 7 && files.every(same) &&
     J(fs.readdirSync(path.join(LAB, 'art')).sort()) === J(['Asuras_Unit_Meghnad_P6_rRare.png', 'Devas_Hero_Indra_P7_rLegendary.png']), J(onDisk));
}

// ═══ P · THE PAGE ═══
console.log('\n── P · the page ──');
{
  const page = fs.readFileSync(path.join(LAB, 'index.html'), 'utf8');
  const ids = ['field', 'vfxcanvas', 'vfxflash', 'replay-all', 'phase-awaken', 'phase-emerge', 'phase-act', 'phase-outcome', 'phase-fizzle', 'mode-full', 'mode-fast', 'mode-reduced', 'seat-swap', 'be-webgpu', 'be-webgl', 'be-canvas', 'clk-slow', 'clk-pause', 'clk-step', 'ro-fps', 'ro-time', 'ro-renderer', 'ro-rung', 'ro-sprites', 'ro-decode', 'ro-mb', 'ro-errors'];
  const missing = ids.filter((id) => page.indexOf('id="' + id + '"') < 0);
  const fieldBlock = page.slice(page.indexOf('<div id="field"'), page.indexOf('<div id="hand">'));
  ok('P1 · the page: noindex, <base href="runtime/">, #field holding #vfxcanvas + #vfxflash, the scripts in order (boarddiff → runtime → lab), every control and readout present, the phase controls disabled stubs',
     /<meta name="robots" content="noindex, nofollow">/.test(page) && /<base href="runtime\/">/.test(page) && missing.length === 0 &&
     fieldBlock.indexOf('id="vfxcanvas"') > 0 && fieldBlock.indexOf('id="vfxflash"') > 0 &&
     page.indexOf('<script src="../lib/boarddiff.js">') < page.indexOf('<script src="vfx.js">') && page.indexOf('<script src="vfx.js">') < page.indexOf('<script src="../lab.js">') &&
     ['awaken', 'emerge', 'act', 'outcome', 'fizzle'].every((p) => new RegExp('id="phase-' + p + '" type="button" disabled').test(page)), 'missing: ' + missing.join(', '));
  const labjs = fs.readFileSync(path.join(LAB, 'lab.js'), 'utf8'), readme = fs.readFileSync(path.join(LAB, 'README.md'), 'utf8');
  ok('P2 · the page loads nothing from the live game (no ../../ path, no game asset URL), and the README carries the LAB-2 note: floaters are suppressed during a play\'s animation (index.html:8162–8171) — the after-effect lands AFTER the fizzle, from the board difference',
     !/\.\.\/\.\.\//.test(page + labjs) && !/sangbaran-purr\.github\.io\/divya-yuddha\/(assets|index)/.test(page + labjs) &&
     /index\.html:8162–8171/.test(readme) && /after the fizzle/i.test(readme) && /board difference/.test(readme));
}

// ═══ G · THE RULE ═══
console.log('\n── G · the experiment rule ──');
{
  const changed = git(['diff', '--name-only', LAB_BASE, '--']).split('\n').filter(Boolean);
  const staged = git(['diff', '--cached', '--name-only']).split('\n').filter(Boolean);
  const outside = [...new Set(changed.concat(staged))].filter((p) => p.indexOf('lab/') !== 0 && p !== DOC);
  ok('G1 · no tracked change outside lab/ since the lab began (' + LAB_BASE + ') — committed, staged or in the working tree — except the ruling doc (A8)', outside.length === 0, outside.join(', '));
  const code = git(['ls-files']).split('\n').filter((p) => p && p.indexOf('lab/') !== 0 && /\.(html|js|mjs|cjs|json|sh|py|css)$/.test(p));
  const refs = code.filter((p) => { try { return /vfx-manifestation|lab\/vfx/.test(fs.readFileSync(path.join(GAME, p), 'utf8')); } catch (e) { return false; } });
  ok('G2 · nothing outside lab/ references the lab: ' + code.length + ' tracked code files (html/js/json/sh/py/css) scanned, 0 mention it', refs.length === 0, refs.join(', '));
  const sync = path.join(WEB, 'scripts', 'sync_game.sh');
  if (!fs.existsSync(sync)) { fail++; console.log('  ✖ G3 SKIPPED LOUDLY — the site checkout is absent (' + sync + '; set DY_WEB)'); }
  else {
    const m = /^ARCHIVE_PATHS="([^"]*)"/m.exec(fs.readFileSync(sync, 'utf8'));
    ok('G3 · the site\'s sync never archives the lab: ARCHIVE_PATHS = "' + (m ? m[1] : '?') + '"', !!m && m[1].split(/\s+/).every((p) => p.indexOf('lab') !== 0));
  }
  const ignored = (p) => { try { cp.execFileSync('git', ['check-ignore', '-q', p], { cwd: GAME }); return true; } catch (e) { return false; } };
  const mustIgnore = ['lab/vfx-manifestation/sources/meghnad_charge.mp4', 'lab/vfx-manifestation/clips/x.mov', 'lab/vfx-manifestation/frames/f_0001.png', 'lab/vfx-manifestation/matted/f_0001.png', 'lab/vfx-manifestation/tools/.venv/bin/python', 'lab/vfx-manifestation/x.mp4'];
  const mustKeep = ['lab/vfx-manifestation/runtime/assets/vfx/game/sheets/vfx_surge_1.png', 'lab/vfx-manifestation/index.html'];
  ok('G4 · A7: Kling sources, clips, frames, matted frames and the matting venv are git-ignored; the lab\'s committed files are not',
     mustIgnore.every(ignored) && !mustKeep.some(ignored), J(mustIgnore.filter((p) => !ignored(p)).concat(mustKeep.filter(ignored))));
}

// ═══ D · THE RULING ═══
console.log('\n── D · the ruling doc ──');
{
  const doc = fs.readFileSync(path.join(GAME, DOC), 'utf8'), at = doc.indexOf('## AMENDMENT 2026-09-13');
  const tail = at >= 0 ? doc.slice(at) : '';
  ok('D1 · ' + DOC + ' carries the "AMENDMENT 2026-09-13" section with A1–A8, in order, after the original plan',
     at > 0 && ['A1. SINGLE-ACTOR MANIFESTATION.', 'A2. SCOPE.', 'A3. PILOT = Meghnad on play', 'A4. ACTORS ARE A SECOND ASSET CLASS', 'A5. BUDGET:', 'A6. MATTING:', 'A7. THE LAB IS PUBLIC ON PAGES, UNLINKED', 'A8. THE DOC:']
       .every((s, i, all) => tail.indexOf(s) > 0 && (i === 0 || tail.indexOf(s) > tail.indexOf(all[i - 1]))));
}

// the watch item (A7): the tracked total Pages would publish
{
  const files = git(['ls-files', '-z']).split('\0').filter(Boolean);
  let total = 0, lab = 0; for (const f of files) { try { const s = fs.statSync(path.join(GAME, f)).size; total += s; if (f.indexOf('lab/') === 0) lab += s; } catch (e) {} }
  console.log('\n    PAGES WATCH (A7) · tracked total ' + (total / 1048576).toFixed(1) + ' MB (of which lab/ ' + (lab / 1048576).toFixed(2) + ' MB) of ~1 GB');
}

console.log('\n' + (fail === 0 ? '✓ ALL ' + pass + ' LAB CHECKS PASS' : '✖ ' + fail + ' FAILURES / ' + pass + ' passed'));
process.exit(fail === 0 ? 0 : 1);
