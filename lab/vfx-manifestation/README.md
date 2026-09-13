# VFX manifestation lab

The experiment ground for **VFX_MANIFESTATION_v1** (`docs/VFX_MANIFESTATION_v1.md`, amended 2026-09-13).

**Status:** LAB-1, the harness. The director, the stage and the actor assets come in later rungs (LAB-2 to LAB-5).

## The experiment rule

- Everything for the manifestation work lives in `lab/vfx-manifestation/`: its own page, its own copies of any runtime pieces, and its own assets.
- No file outside `lab/` is modified by a VFX-LAB task. The one exception was the ruling doc, committed once in LAB-1 (ruling A8).
- Nothing in the live game links to, imports from, or loads the lab. The site's `sync_game.sh` never archives it.
- The game's suites stay green at their exact counts on every lab commit.
- **Ruling A7:** Kling sources and matted frames are gitignored (see `.gitignore`). Only packed atlases are ever committed. Report the tracked total on every lab commit, because Pages capacity is a standing watch item.

## Open it

- **On your machine:** start the repo's `static` server (from `.claude/launch.json`: python http.server on port 4599), then open `http://localhost:4599/lab/vfx-manifestation/`.
- **On your phone, same Wi-Fi:** `http://<the Mac's LAN address>:4599/lab/vfx-manifestation/`. Plain http off localhost is not a secure context, so the phone gets WebGL or Canvas only.
- **Pages, public but unlinked (A7):** `https://sangbaran-purr.github.io/divya-yuddha/lab/vfx-manifestation/`. Give the WebGPU verdict here.

## What's here

| Path | What |
|---|---|
| `index.html` | The harness page (noindex). A mock board at 390px with the real Meghnad and Indra art, the `#field` / `#vfxcanvas` structure, and the controls. It sets `<base href="runtime/">`. |
| `lab.js` | The page logic: fixture loading, board rendering, replay, the lab clock (slow-mo, pause, frame-step), backend forcing, and the readout. |
| `runtime/vfx.js` | The game's VFX module, copied **byte-for-byte** from `index.html` between VERBATIM markers. The wrapper injects the page names it reads (`$`, `vfxT`, `reducedMotion`, `jankSample`, `CHOREO_SPEED`, `LEGACY_VFX`) and the clock (`requestAnimationFrame`, `cancelAnimationFrame`, `performance`). Generated; never hand-edited. |
| `runtime/COPY.json` | Where every copied byte came from: game commit, line range, sha256s, sizes, pixel sizes. |
| `runtime/assets/` | The Pixi copy, plus the sheets of **one** existing effect: the GPU Chaos Surge at the lo rung (surge_1/surge_2, colour and motion vectors). The page pins the lo rung. |
| `art/` | Card art copies (Meghnad, Indra). |
| `lib/boarddiff.js` | The board difference: entered / left / changed cards between two snapshots. Pure. |
| `fixtures/` | `make_fixture.js` runs `src/engine.js` read-only and writes the Meghnad-play fixture for both seats: the events in engine order, the board before and after, the log, and the diff. |
| `tools/copy_runtime.js` | Re-copies the runtime and the asset subset from the game. |
| `test/run.js` | The lab's own proofs: `node lab/vfx-manifestation/test/run.js`. |

**Why `<base href="runtime/">`:** the module builds sheet URLs relative to the page (`assets/vfx/…`) but imports Pixi relative to its own file (`./assets/vendor/…`). With the base set, both resolve inside `runtime/`, so the copy needs no path rewrite.

**Known requests:** the module's GPU init also asks for the hero-moment kit (`vfx_ring_1` and `vfx_lightning_1` stills, `vfx_smoke_1` sheet and motion vectors). The lab doesn't carry those. The requests 404 and the module catches them (`heroReady` stays false), exactly as the game would if they were missing.

**The Canvas floor and Chaos Surge:** on the Canvas 2D path the shipped module draws Chaos Surge only from a sheet the game never loads (`LEGACY_VFX` is false). Forcing Canvas therefore shows the procedural `cardLand` embers but no surge. That is the shipped behaviour, not a lab fault.

## Re-copy, regenerate, test

```bash
node lab/vfx-manifestation/tools/copy_runtime.js
node lab/vfx-manifestation/fixtures/make_fixture.js
node lab/vfx-manifestation/test/run.js
```

If the runtime-drift check goes red, the game's VFX module has changed since the copy. Decide whether to re-copy; don't hand-edit `runtime/vfx.js`.

## Notes for the next rungs

### LAB-2: the after-effect lands after the fizzle, from the board difference

The shipped game suppresses floating numbers while a play's animation runs (`index.html:8162–8171`, `spawnFloaters`: "choreography owns floaters while active"). The power tracker then absorbs the change at the next render. For Meghnad's strike, the Hero's −2 is carried by **no event**: the engine changes the Hero's power in place and only logs it.

So the manifestation's outcome must come from the board difference (`lib/boarddiff.js`, `fixture.diff.changed`), and it must land **after the fizzle**. The shipped floater path would drop it silently.

### Facts from STEP-0 the director must honour

- **Events for Meghnad's play, in engine order:** `play`, then (if it's the Asura side's first Chaos Surge of the round) `toast` "Chaos finds a way…" and `buff` +1 on a random own Unit. With Meghnad the only Asura Unit, that Unit is Meghnad.
- **No `lethal` for Heroes.** Hero power floors at 0 and the death sweep checks Units only.
- **No `shielded` for Heroes.** Dharma Shield covers Units only.
- **Ruling A1:** a single actor, nothing depicted on the target. The board shows the outcome.
