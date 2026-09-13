# VFX manifestation lab

The experiment ground for **VFX_MANIFESTATION_v1** (`docs/VFX_MANIFESTATION_v1.md`, amended 2026-09-13).

**Status:** LAB-4. The real Meghnad actor, from the Kling clip, plays on the director and the stage. The placeholder tool stays as the pattern for cards that have no clip yet.

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
| `lib/clashcontext.js` | **LAB-2.** The ClashContext adapter: a play's batch plus the board before and after → honest fields only, and the board difference split into what the batch's events carry and what they don't. |
| `lib/director.js` | **LAB-2.** Context → a deterministic timed plan (AWAKEN → EMERGE → ACT → FIZZLE → SETTLE, then the queue). Also the rarity ladder, the repeat rule, Reduced mode, and the text readout of the plan. |
| `lib/runner.js` | **LAB-2.** Plays a plan against the clock: cues in order, skip, a single-phase replay, fast-forward. Cleanup runs exactly once. |
| `lib/manifest.js` | **LAB-3.** Validates the actor asset class (A4). |
| `lib/stagemath.js` | **LAB-3.** Where an actor stands, how big it is, where it reaches and which way it faces. It never touches the enemy cards (A1). |
| `lib/actorstage.js` | **LAB-3.** The actor stage: portal, contact shadow, the actor drawn with normal blending (Canvas 2D or Pixi), hit-stop, directional flash, camera impulse, the cleanup guarantee, and the performance readout. |
| `lib/playback.js` | **LAB-3.** Card-agnostic wiring from a plan's cues to the stage and the board. |
| `data/manifestations.json` | The card registry: which cards manifest, and which (the pilot alone) are exempt from the ladder. |
| `data/factionfx.json` | Faction energy for the portal and the exit. The Asura exit reuses the copied runtime's own ember recipe. |
| `actors/meghnad/` | **LAB-4.** The Meghnad actor from the Kling clip: `atlas.webp` and `manifest.json`. |
| `tools/make_placeholder_actor.py` | Traces a placeholder actor from card art. Kept as the pattern for a card with no clip yet; it writes to `actors/_placeholder/<card>/`, never over a real actor. |
| `tools/make_actor_from_clip.py` | **LAB-4.** A Kling clip on chroma green → an actor: key, despill, isolate, frame selection, one ground pivot, packed atlas and manifest, plus a contact sheet in `frames/`. Run with the lab venv. |
| `tools/.venv/` | **Ignored.** The matting venv (A6): rembg with a pinned onnxruntime that loads on macOS 13.0, and its model in `tools/.venv/u2net/`. |
| `sources/` · `frames/` | **Ignored (A7).** The Kling clip and the Kling source stills; the matted frames, matte stats and contact sheet. Never committed. |
| `test/run.js` | The lab's own proofs, all rungs: `node lab/vfx-manifestation/test/run.js`. |

**Why `<base href="runtime/">`:** the module builds sheet URLs relative to the page (`assets/vfx/…`) but imports Pixi relative to its own file (`./assets/vendor/…`). With the base set, both resolve inside `runtime/`, so the copy needs no path rewrite.

**Known requests:** the module's GPU init also asks for the hero-moment kit (`vfx_ring_1` and `vfx_lightning_1` stills, `vfx_smoke_1` sheet and motion vectors). The lab doesn't carry those. The requests 404 and the module catches them (`heroReady` stays false), exactly as the game would if they were missing.

**The Canvas floor and Chaos Surge:** on the Canvas 2D path the shipped module draws Chaos Surge only from a sheet the game never loads (`LEGACY_VFX` is false). Forcing Canvas therefore shows the procedural `cardLand` embers but no surge. That is the shipped behaviour, not a lab fault.

## Re-copy, regenerate, test

```bash
node lab/vfx-manifestation/tools/copy_runtime.js
node lab/vfx-manifestation/fixtures/make_fixture.js
lab/vfx-manifestation/tools/.venv/bin/python lab/vfx-manifestation/tools/make_actor_from_clip.py   # needs sources/ and the venv
node lab/vfx-manifestation/test/run.js
```

If the runtime-drift check goes red, the game's VFX module has changed since the copy. Decide whether to re-copy; don't hand-edit `runtime/vfx.js`.

## LAB-2+3: the director and the stage

**The machinery is card-agnostic, with Meghnad as the first data entry.** No code path names a card. A card manifests when it is a Hero or Unit (A2) and has a registry entry. Its look comes from its actor manifest, and its energy from its faction's entry.

### The plan

**The grammar.** A single actor, nothing depicted on the target (A1), then the queue:

| Phase | What happens |
|---|---|
| AWAKEN | The portal opens at the card and the faction's embers rise. |
| EMERGE | The actor rises from the card. |
| ACT | The actor charges toward the enemy half and stops short of the enemy cards. At contact: a 60 ms hit-stop, a directional flash and a 5 px camera impulse toward the enemy side. |
| FIZZLE | The actor fades out and throws the Asura exit embers. |
| SETTLE | The un-evented board changes land, with their floating numbers. |

After SETTLE, the rest of the batch plays in engine order: here the Chaos Surge toast, then its +1 buff.

**Timings.**

| Mode | Duration |
|---|---|
| Full | The rarity ladder (C 1.8 s · U/R 2.5 s · E/L 3.5 s · M 4.5 s). The pilot is exempt (A3) at 3.2 s. |
| Fast | Half of Full. |
| Reduced | No actor: a card pulse, then SETTLE (0.6 s). |

**The repeat rule.** A card's second and later manifestations in a match play Fast. On the page, "Reset match memory" starts a new match.

**The split that keeps the board honest.** The board difference, minus what the batch's own events carry, lands at SETTLE: Indra 7 → 5. What the events carry lands when each queued event plays: Meghnad's Chaos Surge +1. So nothing is double-counted or swallowed, and the final board equals the engine's AFTER snapshot. The readout confirms this after every play.

### The stage

**The placeholder actor.** Five posed cells traced from the card art, each with real alpha and a feet pivot. It is not a Kling performance; LAB-4 replaces it.

**The actor.** It stands on its card's base. Its reach and size are clamped so that at no point of the ACT does it touch the enemy cards. It faces the open side of the field, and a left-facing manifest is mirrored when the charge leans right.

**Layers, bottom to top:** board rows (3) · VFX canvas (5) · VFX GPU (6) · VFX flash (7) · actor under, the portal and shadow (8) · the actor (9) · actor over, the directional flash (10) · floating numbers (12) · banner (13).

**Renderer.** The renderer control drives both the copied effects and the actor. WebGPU and WebGL draw the actor with Pixi; Canvas 2D draws it on `#actorcanvas`. The Actor readout shows the backend, cell size, drawn size, fps over the last manifestation, and draw ms per frame.

**Cleanup.** Skip, a single-phase replay, a new play, a side swap or a backend switch always ends in `stage.clear()`. No actor, effect or camera offset survives it.

## LAB-4: the Meghnad actor from the Kling clip

**The source.** `sources/kling_20260913_VIDEO_Create_a_p_5011_0.mp4` (ignored): 121 frames at 24 fps, 1916×1080, on a flat chroma green (RGB 0, 185, 62). The four Kling source stills from `assets/vfx/experimental/meghnad/` sit beside it.

**Rebuild the actor** (needs the clip in `sources/` and the venv):

```bash
lab/vfx-manifestation/tools/.venv/bin/python lab/vfx-manifestation/tools/make_actor_from_clip.py
```

**The matte: green first.**
1. **Key.** Alpha from green dominance, G − max(R, B), with a soft ramp.
2. **Decontaminate.** Edge colours are un-mixed from the ground, then despilled so no pixel is greener than its strongest other channel.
3. **Isolate.** The figure is the dark solid body (rider, horse, cape, spear shaft). Anything, even opaque light, more than 28 px from it is cut. That removes Kling's crossing lightning bolt and keeps the glow at the spear tip.
4. **Clean up with rembg only on fringe.** rembg trims an edge band only if the band still holds near-pure ground pixels kept mostly opaque. On this clip it was needed on 0 of 43 frames. An independent check also found 0 green-dominant edge pixels on the audited frames.

**The frames.** Evenly spaced, so the motion keeps its true pace at native fps:

| Part | Frames | Kept |
|---|---|---|
| Idle head | f0–f33 | Dropped |
| EMERGE: the rear | f34–f56 | 14 cells |
| ACT: flare → thrust → settle | f57–f88 | 29 cells |
| Contact: the spear fully extended | f69 | ACT cell 11 |
| Kling's dissolve (pink energy from f90, smoke from f96) | f89–f120 | Dropped |

The stage does the fizzle, with the Asura ember exit.

**The cells (A4).**
- Trimmed rectangles, most wider than tall (the horse's aspect), at most 512 px, with one scale for all.
- One pivot for all: the front hooves' ground contact, at clip point (678.2, 1073.0).
- WebP with real alpha, normal blending, no motion vectors.
- The atlas is 4004×2168, inside the 4096 px phone texture ceiling.

**Native timing.** The manifest says `"timing": "native"` at 24 fps. The director, for a ladder-exempt card whose manifest supplies native timing, makes EMERGE and ACT exactly as long as their cells at that rate: 583 ms and 1208 ms. Contact lands on the contact cell, and the full manifestation totals 3191 ms. Fast halves it. A card that is not ladder-exempt keeps the ladder.

## Notes for the next rungs

### LAB-2: the after-effect lands after the fizzle, from the board difference

The shipped game suppresses floating numbers while a play's animation runs (`index.html:8162–8171`, `spawnFloaters`: "choreography owns floaters while active"). The power tracker then absorbs the change at the next render. For Meghnad's strike, the Hero's −2 is carried by **no event**: the engine changes the Hero's power in place and only logs it.

So the manifestation's outcome must come from the board difference (`lib/boarddiff.js`, `fixture.diff.changed`), and it must land **after the fizzle**. The shipped floater path would drop it silently.

### Facts from STEP-0 the director must honour

- **Events for Meghnad's play, in engine order:** `play`, then (if it's the Asura side's first Chaos Surge of the round) `toast` "Chaos finds a way…" and `buff` +1 on a random own Unit. With Meghnad the only Asura Unit, that Unit is Meghnad.
- **No `lethal` for Heroes.** Hero power floors at 0 and the death sweep checks Units only.
- **No `shielded` for Heroes.** Dharma Shield covers Units only.
- **Ruling A1:** a single actor, nothing depicted on the target. The board shows the outcome.
