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
| `lib/effectclip.js` | **LAB-19.** The additive effect clip: its validator, its plan against the game's own beat, its placement, and its player (budget E1). Not an actor. |
| `effects/vajra/` | **LAB-19.** Vajra's strike clip: `atlas.webp` (RGB, no matte) and `manifest.json`. |
| `effects/sudarshana/`, `effects/sudarshana_invoke/`, `effects/sudarshana_strike/` | **LAB-20.** Sudarshana Chakra's chain: `chain.json` (the two clips, in order, and the game's removal contract), and each clip's atlas and manifest. |
| `tools/make_effect_from_clip.py` | **LAB-19.** A black-ground Kling clip → an additive effect clip: crop, scale, fade-in head, fade tail, guarded feathers. Run with the lab venv. |
| `audio/` | Byte-identical copies of the game's `sfx_unit_clash` and `sfx_chaos_surge` (LAB-5), and `sfx_astra` and `sfx_unit_destroy` (LAB-19, the Vajra contract's own). |
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

## LAB-4a: the actor plays at its native frame rate, and every lab URL is stamped

**The defect.** On Pages the manifestation read as a few stills, not the clip's 24 fps motion. Measured on the stage (the lab's `lib/` run with fixed frame intervals, all three draw paths alike), before the fix:

| Frame rate | Full | Fast |
|---|---|---|
| 120 Hz | 43/43 | 42/43 |
| 60 Hz | 43/43 | 39/43 |
| 30 Hz | 41/43 | 26/43 |
| 15 Hz | 27/43 | 14/43 |
| 10 Hz | 18/43 | 9/43 |

The stage already stepped one cell per 1/24 s. What broke the motion:
- A slow frame skipped every cell it jumped over, so a device drawing slowly showed a handful of cells.
- Contact landed one cell early (f068, not f069), and the 60 ms hit-stop froze the actor on that cell inside ACT. Every later ACT cell then ran late, and the end of ACT was cut.
- The first play on a GPU backend lost its opening cells to the atlas upload.

**The cells are the clock.** A native plan's actor phases carry `cellFps`: 24 cells/s in Full, 48 in Fast. The stage steps through the phase's cell list on that clock, not on the phase length:
- No easing between cells, and no hold inside a phase. The hit-stop never freezes a native actor, because the clip carries its own contact. The flash and the camera impulse still fire.
- Full never skips a cell. After a late frame the stage catches up one cell per frame. Fast may skip one cell at a time, never two, so it always shows at least every other cell.
- Contact fires on the frame the contact cell (f069) is drawn.
- FIZZLE holds the last ACT cell under the ember exit.
- `warm()` uploads the atlas before the first play.

**The readout.** The Actor row shows cells drawn per play, repeats and the cell the contact landed on. `stats().cellsDrawn` carries the same numbers.

**The stamp.** `tools/stamp_lab.js` hashes every file the page loads (lab.js, lib/, runtime/, data/, fixtures/, art/, actors/) into `STAMP` and stamps `index.html`: a `lab-stamp` meta tag and `?v=` on every script. `lab.js` puts `?v=` on every fetch, image and module URL. At boot the page reads `STAMP` past the cache and reloads itself once onto the served stamp if the page it got was stale. The Stamp row shows it. Run the tool after changing any lab file; the suite fails if the stamp is out of date.

The copied VFX module must stay byte-identical to the game, so its own URLs are not the lab's to stamp: its effect sheets keep the game's `?v=t104`, and its own Pixi import (`./assets/vendor/pixi.min.mjs`) is unstamped. The stage imports Pixi through a stamped URL.

## LAB-4b: the dissolve exit (faction presets)

The ember exit read grainy. FIZZLE is now a procedural dissolve matched to the Kling clip's own dissolve. The clip's tail frames 89–120 are dropped from the actor, but their contact sheet is in `frames/meghnad_tail_contact_sheet.jpg`. What the clip does:
- magenta energy veins light up the legs and belly, then climb the figure
- the body breaks up from the bottom into faint smoke and pink sparks
- by about 0.75 s only a dark smoke streak is left

**The maths (`lib/dissolve.js`).** Every point of the held cell gets an erosion value: its height from the feet, roughened by noise. Over FIZZLE a threshold sweeps from the feet to the head, and a pixel keeps `clamp((f − t) / soft)` of its alpha. That can only fall as the threshold rises, so a pixel never comes back. Just above the front the pixels take the faction's edge colour, hottest at the front itself. Further above, the noise's veins light up: the energy climbing ahead of the break-up.

**Two draw paths, one field.**

| Backend | The erosion | The embers |
|---|---|---|
| WebGPU, WebGL | A Pixi filter on the actor sprite (GLSL and WGSL): noise texture, threshold, edge glow | Pooled sprites of one 64 px glow texture, 150/s |
| Canvas 2D | A half-resolution noise mask each frame (destination-in), the glow over what is left (source-atop), on an offscreen canvas | Soft discs on `#actorover`, 60/s |

Faint dark smoke puffs hang behind the front on `#actorunder`. Embers and puffs are always drawn at or below their image's size, so there are no scaled-up pixels, and all blending is normal. Every particle ends by the end of FIZZLE: 600 ms in Full, 300 ms in Fast. Then the actor is removed and the board settles.

The copied runtime's own particle pool sits on its own canvas beneath the actor and draws additive sheet sprites. It must stay byte-identical to the game, so the embers use the stage's own pool instead.

**Presets.** `data/factionfx.json` holds one exit per faction: `name`, `portal`, `exit: "dissolve"`, and `dissolve: { edge, core, edgeWidth, charge, chargeAlpha, noise, noiseScale, embers, emberColor, emberSize, emberRise, smoke, smokeColor, smokeAlpha, seed }`. Every key is optional. Asura is tuned against the clip: front #e76dba, core #ffd9ee, pink embers, dark smoke. Deva (gold, no smoke), Naga (teal) and Vanara (orange) are defaults. The **Exit preset** dropdown previews any of them on Meghnad, and the **Exit** readout row shows the preset, the path, embers, smoke and whether the sweep stayed monotonic.

## LAB-4c: tempo and FIZZLE tuning

The manifestation plays a little fast. Rather than guess a value, the lab now has two sliders in the Mode panel. They shape every play from the moment they move; a play already running keeps its own timeline.

| Slider | Range | Default | What it changes |
|---|---|---|---|
| Tempo | 0.5× – 1.5× | 1.00× | The clip's cells play at 24 × tempo cells/s, and AWAKEN, EMERGE, ACT and SETTLE stretch with them. At 0.8× the clip runs at 19.2 cells/s. |
| Fizzle | 300 – 1500 ms | 600 ms | FIZZLE's length on its own. The dissolve's sweep, embers and smoke stretch to match: embers live longer and move and spawn more slowly. The sweep stays monotonic. |

Fast keeps its 2× relation to whatever Full is set to.

**No skipped cells at any tempo.** The director tells the stage how far it may step per frame (`cellStep`): 1 in Full, so every cell is drawn; 2 in Fast.

**Reading the numbers.** The Plan panel prints the next play's timeline as soon as a slider or the mode moves:

`Timeline (ms): AWAKEN 400 · EMERGE 583 · ACT 1208 · contact +459 (at 1442) · FIZZLE 600 · SETTLE 400 · total 3191 · tempo 1.00× · 24 cells/s`

The board still settles the moment FIZZLE ends and still matches the engine's AFTER snapshot. The next rung writes the chosen tempo into Meghnad's manifest and the FIZZLE length into the Asura preset, as their defaults.

## LAB-4d: the owner's tempo and FIZZLE, locked as defaults; the 55-frame repack

**The ruling (2026-09-13).** Meghnad plays at tempo 0.6× with a 1500 ms FIZZLE, and those become the defaults every character inherits. The sliders stay.

**Where the defaults live.** `ActorManifest.defaultsFor` resolves them the same way for any card:

| Value | First | Then | Last |
|---|---|---|---|
| Tempo | the card's manifest (`actors/meghnad/manifest.json` → `tempo: 0.6`) | `data/manifestations.json` → `defaults.tempo` (0.6) | 1× |
| FIZZLE | the faction's exit preset (`data/factionfx.json` → Asura `fizzle_ms: 1500`) | `defaults.fizzle_ms` (1500) | 600 ms |

The lab's sliders start on these values and label them as defaults. Moving one overrides it for the session only, and the Plan readout shows the next play's timeline as soon as the page loads.

**The repack.** At the slower tempo, 43 cells stepped visibly. `tools/make_actor_from_clip.py` now keeps every usable source frame in the window (f34–f88) and drops only true duplicates. The phases keep the lengths they had when the tempo was tuned: EMERGE 583 ms and ACT 1208 ms at tempo 1, written into the manifest as `phaseMs`. So the extra cells play in the same time, and EMERGE and ACT each get their own cell rate (count ÷ length × tempo). The clip's `fps: 24` stays as its source rate. Contact is still the frame where the spear is fully extended (f069), at its new index inside ACT.

**The timeline at the defaults.** Full: AWAKEN 667 · EMERGE 972 · ACT 2013 · FIZZLE 1500 · SETTLE 667 · total 5819 ms. Fast: 333 · 486 · 1007 · 750 · 333 · total 2909 ms.

## LAB-5: certification — the memory ladder, sound, fallbacks, the gate

LAB-5 checks that Meghnad's manifestation is safe and complete enough to be the template for every Hero and Unit. Exporting it to the live game is a separate, later ruling.

### Memory (A5)

An actor's atlas is decoded only for the play that shows it, and released after SETTLE:

1. **In the hand.** When a card with a manifestation enters a hand, the page fetches its manifest (small JSON) and the **compressed** atlas for its rung, and keeps the bytes. Nothing is decoded, so there is no network stall at the first play.
2. **At play.** Only a play that shows the actor decodes the atlas (`createImageBitmap`). A Reduced play never does.
3. **After SETTLE.** The stage destroys the GPU texture, closes the decoded bitmap and drops its mask canvases. The page lets go of the bitmap and keeps the compressed bytes. Between plays the decoded actor memory is 0.

**The quality ladder.** The pack tool now writes a 256 px atlas beside the 512, resized from the same source crops:

| Rung | Atlas | On disk | Decoded |
|---|---|---|---|
| 512 px | 4087×3032 | 2.22 MB | 47.3 MB |
| 256 px | 1974×1523 | 0.80 MB | 11.5 MB (24.3% of the 512) |

The page picks by device (`ActorManifest.pickRung`):
- **512** only for a GPU renderer on a screen with devicePixelRatio 2 or more and no memory hint under 4 GB.
- **256** otherwise. On a DPR-1 screen the actor is drawn about 175 px tall, which 256 px cells already cover.
- **Canvas 2D** gets 256 until a phone shows 512 holding 30 fps or more.

The **Actor quality** dropdown overrides the pick. The Memory, Quality and Decode rows show decoded MB right now, the peak, decodes and releases, the compressed cache, the rung and why it was picked, and whether the decode came from the hand.

**A5 watch.** One actor at the 256 rung is 11.5 MB decoded, about the ~10 MB per-match budget. The 512 rung's 47.3 MB is held only for the ~6 s of a play, never more than one actor at a time. Whether that is acceptable is the export ruling's call.

**E1 — the effect-clip budget line (owner ruling, LAB-19), beside A5.** An additive effect clip is capped at the effect layer's **hi-rung class, ~18 MB decoded** (the game's own hi-rung Vajra sheet: 3072×1536 RGBA = 18.00 MB). It is loaded on play and released after, and **at most one effect clip is decoded at once**, coexisting with at most the one decoded actor A5 allows. **The combined worst-case peak is ~18 + ~56 MB = 74.1 MB**: the E1 cap plus the largest actor at its 512 rung (Mahabali, 56.1 MB). Vajra's strike clip decodes to 17.65 MB. **A chain (LAB-20) keeps E1 unchanged:** its two clips decode one after the other, the invocation released before the strike decodes, so the peak is the larger clip (Sudarshana's strike, 13.98 MB), never the pair (21.89 MB). A per-play fallback amendment (cap the whole play at ~18 MB, both clips decoded at the cast at 256 px cells: 16.3 MB) is recorded as **available but unused**.

### Sound

Two sounds play through the game's own audio pattern, copied into `lib/labaudio.js`. The game's `Audio2` is only read, never changed:
- one AudioContext, created on the first gesture
- files decoded once
- a fresh buffer source per trigger
- the game's own sound switch and volume (`dy_sfx`, `dy_sfxvol`), read on every play, exactly as the game reads them

On the same origin as the game, muting sound in the game's settings mutes the lab too.

| Moment | Sound | Placeholder |
|---|---|---|
| The contact cell is drawn (f069) | the strike | `audio/sfx_unit_clash.mp3` (the game's placement clash) |
| FIZZLE starts | the ember exit | `audio/sfx_chaos_surge.mp3` (the game's Asura surge) |

Both are byte-identical copies of the game's files. **A bespoke strike sound (spear impact) and dissolve sound would suit this better when the actor ships.**

**Bespoke-sound wishlist (added LAB-20):** a **bite cue for Sudarshana Chakra's removal**. The game's own removal is silent at the bite (screen shake and a hit-stop only), and the lab keeps that contract, so the moment the disc seizes the Hero has no sound of its own.

### Reduced motion, no GPU

If the device asks for reduced motion, or Reduced is picked, a play shows no actor: a card pulse, then SETTLE with the numbers. No sprite, particle or sound, and 0 MB decoded. The Canvas 2D actor path runs on a phone through the same readout (fps, draw ms per frame).

### The mock match

**Mock match** plays Meghnad (Full), an opponent play (its existing effect only), Meghnad again (Fast, by the repeat rule), then another opponent play. The gaps are the game's own:

| Gap | Length | Source |
|---|---|---|
| AI think | 2.35 s | midpoint of `aiThinkTime()`'s 1.2–3.5 s |
| Opponent showcase | 2.21 s | `showcaseCard()`: 1.4 s + 0.3 s out, × 1.3 |
| Landing | 0.91 s | 0.7 s × 1.3 |
| Your turn | 2 s | nominal, not measured |

The board is reset to the fixture before each Meghnad play, so tempo can be judged without a real second batch. Measured in the lab: Meghnad Full 6.89 s including its queued Chaos Surge, Fast 3.55 s, **23.4 s for the whole sequence**. The Plan panel prints the timeline.

### A finding for the export ruling: the wire's thinking clock

- **The clock is the server's.** The Hall draws the thinking clock from **server** deadlines (LOBBY_DESIGN §8b; `mp/matchclient.js` receives `clock { deadline, thinkMs, warnMs }` and only draws it). The Hall's config gives 120 s, warning at 90 s.
- **Moves wait for animation.** In the frame, `wireDrain()` applies relayed moves one at a time, and only while no animation is running (`if (!Wire || choreoActive || …) return`).
- **Both screens see it.** Both seats play the manifestation in lockstep (BATTLE_WIRE_DESIGN §3).

So when a Full manifestation plays (5.8 s, about 6.9 s with its queued events):
- The next move waits behind it on both screens. A move that comes back from the server during it applies only after SETTLE.
- If the server starts the next mover's deadline when it relays the move, **roughly 6–7 s of that player's 120 s passes while they watch** (about 3.5 s at Fast). That's a few percent of the clock, but it's taken from the defender on every Full manifestation.
- The server code isn't in these repositories. The clock start is inferred from the client and the design docs, and should be confirmed against the server's match code.

**Options for the ruling:**
- the server adds an allowance per manifestation to the deadline
- the clock starts on the client's acknowledgment that the animation has finished
- manifestations run at Fast on the wire
- accept the cost

No change now.

### The acceptance gate

The lab suite ends with one `GATE: PASS/FAIL` line listing:
- the right card on the right seat, both sides
- the outcome equal to the engine's AFTER on every play (both seats × three renderers × Full / Fast / Reduced)
- nothing stale after Skip in any phase, a renderer switch mid-play, or the page hiding mid-play (the lab now lands an interrupted play on AFTER)
- no board layout shift in any phase
- memory back to 0 after every path
- the stamp current

The browser adds a live layout readout (layout offsets sampled every frame, so the camera shake, a transform, doesn't count).

### Only a phone can measure these (owner device)

- Canvas 2D fps and draw ms at 512 and at 256 (Quality override). This decides whether Canvas 2D can keep 256 as its default.
- WebGPU / WebGL fps at 512 on a mid-range phone, and the rung the auto-pick chooses there (DPR and `deviceMemory` hint).
- Decode time at play (the Decode row), from the hand-prefetched bytes.
- The sounds' mix against the game's music on the phone speaker.
- The mock match tempo, judged by eye.
- Memory pressure on low-end devices (does the page stay alive through repeated plays?).

## LAB-6: Indra, the second character, built by the template

LAB-6 tests whether the recipe (identity master → one Kling clip → pack tool → manifest entry) makes a second character without new code. It didn't quite: every code change it needed is listed below as a **template gap**. Each is card-agnostic, so a third character should need only data.

### The clip and the frames

`sources/kling_20260914_VIDEO_Preserve_I_5205_0.mp4`: 121 frames at 24 fps, 1916×1080, chroma green, git-ignored. Contact sheets are in `frames/indra_*.jpg`.

| Range | Frames | Kept |
|---|---|---|
| Idle | f0–f35 | dropped |
| EMERGE: stance, lightning charging in the raised hand | f36–f52 | 17 cells |
| ACT: the Vajra bolt fires off the top-right of the frame and holds | f53–f97 | 45 cells |
| Kling's dissolve | f98–f120 | dropped (the stage's Deva preset does the exit) |

- **Cells:** all 62 usable frames are kept. There are no true duplicates; the smallest neighbour difference is 1.32 against the 0.6 cut-off.
- **Contact:** **f055**. The bolt first reaches the frame edge with a quarter or more of its full edge contact at f054, so f055 is the frame after, when the beam has filled.
- **Pivot:** the centre between the two feet at clip (1102, 1061). All cells share one scale, 0.313.

**Keeping the bolt.** The "bright" matte is a strict green key, so green-tinted sparkle keys out. Next to solid matter, each pixel also keeps the alpha its colour un-mixes to, so the thin yellow-white bolt edges and the hand glow survive. Then decontam and despill. Flecks under 150 px that touch nothing large are cut, and the bolt's cut edge at the frame border fades over 8 px. Faint cyan glints stay near the hand at f054–f055; they are lightning sparks, not green. rembg was not needed.

### The atlases (A5)

| Rung | Atlas | On disk | Decoded |
|---|---|---|---|
| 512 px | 4011×2003 | 1.64 MB | 30.6 MB |
| 256 px | 2020×1010 | 0.59 MB | 7.8 MB (25.4%) |

### The manifest and the data (no new values)

`actors/indra/manifest.json`:
- `facing: "right"`, `aim: "up"`
- **No `tempo`:** Indra inherits the registry's 0.6×.
- **Phase lengths** from the frame ranges at the pace Meghnad was tuned at (seconds per source frame): EMERGE 431 ms, ACT 1699 ms at tempo 1.

`data/manifestations.json` names Indra (Hero, Legendary, Deva, exit = its faction's preset). The Deva preset sets no `fizzle_ms`, so FIZZLE inherits the registry's 1500 ms: a gold dissolve with no smoke.

**The fixture.** `fixtures/indra_seat0.json` and `indra_seat1.json`, from the real engine: the Deva seat moves first on an empty board and plays Indra. One event (`play`); the board difference is Indra entering at 7 and nothing else. SETTLE lands no number.

**The page.** **Play Indra** sits beside Play Meghnad and loads Indra's fixture with Indra as your card. Swap sides still moves it; the mock match stays Meghnad's.

### The timeline, and the rarity ladder (for the owner's ruling)

At the inherited defaults Indra plays: **Full** AWAKEN 667 · EMERGE 718 · ACT 2832 · FIZZLE 1500 · SETTLE 667 = **6384 ms**; **Fast** 3191 ms.

The Legendary rung of the duration ladder (A3) would give **3500 ms**. Native timing now plays the clip for any card, and the plan reports what the ladder would have given. Whether the ladder should govern native actors from the expansion onward is the owner's ruling.

### Owner ruling 2026-09-14: actors are always upright

Every actor stands upright on both seats, and a seat swap mirrors horizontally only. The vertical-mirror code path was removed, not disabled. On the top seat an up-aimed action like Indra's bolt fires up and off the board. The contact flash and camera impulse still point at the true target, because they read the seat's direction toward the enemy, not the drawing. A downward clip per seat stays a possible later art-only option.

### Owner ruling 2026-09-14: the same size on both seats

The actor is the same size on both seats: card height × 2.1, so each card's scale is fixed. Placement gives way; scale never does. The "room above" shrink on the top seat is removed, and so is the matching shrink on the player's seat.

- **The top seat.** The feet start at the card's base. If the figure would leave the board's top edge, it moves down by exactly the overflow, into the free middle band; it may overlap its own card and row. The A1 clamp then keeps the feet short of the enemy cards by moving him. If the board edge and A1 cannot both hold, A1 wins.
- **The player's seat.** If the enemy row is too close, the figure moves down instead of shrinking.
- **The reach toward the enemy** takes whatever room is left.
- **Fast** places the same way.

### Template gaps (code the second character needed)

1. **The pack tool was Meghnad-only.** Clip, frame ranges, key, contact rule, pivot rule, facing and phase lengths were constants. They are now one `CARDS` entry per card, and phase lengths derive from the frame ranges at the tuned pace. Meghnad's atlases re-pack **byte-identical**; its manifest gains only `audit.recipe`.
2. **One matte for one kind of figure.** The "dark-body" matte cuts bright light off a dark figure, which would have cut away Indra's white-and-gold body and his bolt. Added the "bright" matte (above) and an edge feather for action that leaves the frame.
3. **Contact and pivot rules.** Added "bolt-edge" beside "spear-tip", and "feet" (the centre between both feet) beside "front-left" (the hooves).
4. **Native timing only for the ladder-exempt pilot.** A non-exempt card's clip would have played on the ladder's grammar, with contact at 58% instead of its contact cell. Native timing now applies to any card whose manifest supplies it (`lib/director.js`).
5. **An action that points up.** Indra's bolt fires up the frame. The manifest records it as `aim: "up"` (validated in `lib/manifest.js`); the stage does not act on it. A vertical mirror for the top seat was built and then removed by the owner's ruling below.
6. **The fixture builder, the page and the tests** were written around one card. `buildIndra`, the Play buttons, the story text, the hand chip and the readouts now follow the current card. The suite runs every stage check and the gate for each card, with a GATE line per card and one for both.

## LAB-6a: the Deva exit, tuned to Indra's own tail

On Pages, Indra "vanished" instead of fizzling: the Deva preset was untuned. It is now tuned against his clip's own tail, f98–f120 (`frames/indra_tail_contact_sheet.jpg`, git-ignored). Measured there as gold-dust pixels:
- from f098 the figure breaks into **dense bright gold dust over the whole body**, peaking at f106–f108 (about 0.35 s in)
- the column hangs, then drifts up as a plume and thins
- nearly gone by f118 (about 0.85 s)
- no dark smoke

**The tuning knobs (a template gap).** The dissolve had only one emitter at the front, a sweep that always took all of FIZZLE, and no cap or haze. These optional preset fields let any faction tune the same way. Each default reproduces the exit as it was, so a preset that doesn't name them is unchanged:

| Field | What it does |
|---|---|
| `ember_density` | motes per second, × the path's base rate |
| `mote_life` | [min, max] ms a mote lives, written for a 1500 ms FIZZLE and scaled with the real one; still ends by FIZZLE's end |
| `mote_size` · `mote_rise` · `mote_spread` · `mote_color` | radius px · upward px/s · sideways px/s · colour |
| `mote_zone` | 0 = motes rise off the front; above 0 = from the whole body still standing, up to that far above the front |
| `front_width` · `front_soft` | the glow band above the front · the erosion's own softness |
| `sweep_frac` | the share of FIZZLE the erosion takes; after it the motes and haze hang and fade |
| `haze` | `{ color, alpha, rate, life, size, rise }`: soft bright puffs behind the figure, normal blend, or null |
| `canvas_cap` · `gpu_cap` | the most motes alive at once on the Canvas 2D path / the GPU path |

**The Deva preset** (`data/factionfx.json`):
- front width 0.24 and softness 0.08, against Asura's 0.06 and 0.02
- gold veins lit across the standing body at full strength (charge 0.6)
- the erosion over 70% of FIZZLE
- motes at density 8 (20× Asura's rate at 1500 ms), small bright gold (#ffe08a, 0.6–1.5 px), from the whole standing body, living 1100–1700 ms, rising 8–40 px/s with 26 px/s spread
- a light gold haze (#ffd978, alpha 0.18, 30 puffs/s)
- no smoke; caps 140 on Canvas 2D and 700 on the GPU
- FIZZLE stays the inherited 1500 ms

**What it does at 390 px** (headless Chrome, Full):
- **Sweep:** ends at 1067 ms. At 40% of FIZZLE the upper body glows gold while the lower half has broken into dense dust; by 80% the body is gone and a bright gold column hangs and drifts up.
- **Motes:** they keep rising and fading through the last 433 ms.
- **WebGPU:** 402 motes alive at 40% and 506 at 80%, under its cap of 700.
- **Canvas 2D:** holds at its cap of 140 (232 further spawns refused), so the path stays measurable.
- A first, lighter tuning (density 3.2, erosion over 55%) still read as a vanish: by 40% the body was gone under a sparse sprinkle.
- **After:** 0 actors, sprites and particles.

**Meghnad's Asura exit is unchanged.** Its preset entry is byte-identical, and the suite replays it through LAB-6's own `actorstage.js` and `dissolve.js`. On every renderer, in Full and Fast, it matches draw for draw.

## LAB-7: Bali, the third character, by the template

LAB-7 tests whether the template is now code-free. It is not quite: the code changes it needed are listed at the end as **template gaps**. The known one, the key colour, is closed for good.

### The clip and the frames

`sources/kling_20260914_VIDEO_Preserve_B_5645_0.mp4`: 121 frames at 24 fps, 1916×1080, chroma **blue** (corners RGB 0, 69, 197), git-ignored. The identity master `bali-isolated-kling-source-v1.png`, found under `assets/vfx/experimental/bali/`, was moved into `sources/` as Indra's was. Contact sheets are in `frames/bali_*.jpg`.

| Range | Frames | Kept |
|---|---|---|
| Idle | f0–f27 | dropped |
| EMERGE: the wind-up, mace hoisted overhead in a body turn | f28–f56 | 29 cells |
| ACT: the slam, ground burst, shockwave ring, crouched hold | f57–f93 | 37 cells |
| Kling's dissolve | f94–f120 | dropped (the tail also drifts green) |

- **Cells:** all 66 usable frames are kept; no true duplicates (smallest neighbour difference 2.60).
- **Contact:** **f064**, by the new "ground-impact" rule: the first frame with 2000 px or more of matter in the 60 px ground band, outside the standing feet's columns. The band reads 0–808 px through f063 (the falling mace's edge) and 35,909 px at f064, when the mace lands and the burst starts.
- **Pivot:** the centre between the two feet on the standing frame f028, clip (970, 1053). All cells share one scale, 0.267.
- **Facing:** left. No aim.

**The matte, by measurement.** Bali's fur and cloth are mid-tone and sit far from the blue, and the ring and mace glow are bright, so the "bright" matte applies, keyed on blue. The mace head leaves the top edge at f52–f62, feathered over 8 px. The brightest core of the ground burst stays in the matte as pale plumes with a faint lavender tint (blue left in thin smoke); the thinner dust keys out. At f091–f093 Bali's head already flares white: Kling's dissolve starts inside the audited ACT. Both are for the owner's eye; trimming ACT to f090 would be a one-number change in the pack tool's entry.

### The atlases (A5)

| Rung | Atlas | On disk | Decoded |
|---|---|---|---|
| 512 px | 4068×1614 | 1.44 MB | 25.0 MB |
| 256 px | 2031×812 | 0.50 MB | 6.3 MB (25.1%) |

### The manifest, the data and the fixture (no new values)

- `actors/bali/manifest.json`: `cardId: "hanuman"`, facing left, no `tempo` (inherits 0.6×), phase lengths at the tuned seconds per source frame: EMERGE 735 ms, ACT 1397 ms at tempo 1.
- `data/manifestations.json`: `hanuman` = Bali, Hero, Legendary (from the engine), Vanara, exit = the faction's preset. The Vanara preset sets no `fizzle_ms`, so FIZZLE inherits 1500 ms.
- **What Bali does on play.** The engine's Bali is id `hanuman` (the card was renamed, its id was not): a P9 Legendary Hero with a passive, "Each Vanara Unit of printed power 4+ you play gains +1 on entry". `fixtures/bali_seat0.json` and `bali_seat1.json`: the Vanara seat plays Bali first on an empty board. One event (`play`); the board difference is Bali entering the heroes row at 9 and nothing else, because the passive only touches Units played later. SETTLE lands no number.
- **The page.** Play Bali sits beside the others; the hand chip, story text and readouts follow.

At the defaults Bali plays **Full** AWAKEN 667 · EMERGE 1225 · ACT 2328 (contact at 441) · FIZZLE 1500 · SETTLE 667 = **6387 ms**; **Fast** 3193 ms. The Legendary ladder would give 3500 ms.

### The Vanara exit (for the owner's ruling; no tune this rung)

Kling's own tail, f094–f120 (`frames/bali_tail_contact_sheet.jpg`, git-ignored), is an **earth** exit, not orange wind: the body turns to a pale gold dust silhouette (f094–f105), then collapses into falling stone chunks with a dust plume low to the ground (f106–f120). The mace breaks up with the body. From f104 a green drift enters bottom right, so the tail can't be matted as-is. The Vanara preset stays default, byte-identical to LAB-6a (suite check S19).

### Template gaps (code the third character needed)

1. **The key colour (closed for good).** The pack tool detected the ground colour from the corners but did its key arithmetic on the green channel. It now keys on the detected colour's strongest channel, or on a per-card `key_colour`, and the manifest's source line names the real colour. Meghnad's and Indra's atlases re-pack byte-identical; their manifests gain only `keyColour` and `keyChannel` in `audit.recipe`.
2. **A contact rule for a weapon that lands.** Neither "spear-tip" nor "bolt-edge" fits a mace slam, so "ground-impact" was added.
3. **Engine id ≠ card name.** Bali's engine id is `hanuman`. The pack tool gained `engine_id` (the manifest's `cardId`), and the registry is keyed by engine id.
4. **The page's per-card code.** The Play buttons, the art map and the fixture names were written per card. `lab.js` now builds them from the registry (`fixture`, `art`, `name`).
5. **The art copy.** `tools/copy_runtime.js` had a hand list of card art; it now reads each registry entry's `art`.
6. **The fixture builder.** It was Indra-only; a hero's fixture is now one `HERO_ENTRIES` entry (still a line of data in a `.js` file).
7. **The tests.** The stage suite's card list now comes from the registry. The per-card fixture, context, plan and actor checks (F, C, T, M) are still written per card, as parameterised checks.

With these closed, a fourth character with a chroma clip and an existing contact rule needs: a pack-tool `CARDS` entry, a registry entry, a `HERO_ENTRIES` entry and its F/C/T/M check lines.

## LAB-8: Varuna, the fourth character and the first native exit

Varuna's clip ends in its own exit: the orb bursts over his body, he turns to water and the mist drifts away. LAB-8 plays that exit instead of the procedural dissolve.

**This is an owner trial of ruling B.** Fallback A, if the trial fails: re-pack ACT as f000–f085, keep the nova contact, and play the procedural Deva dissolve. The lab can show fallback A now: pick **Deva** in the Exit preset dropdown and Varuna dissolves procedurally.

### The clip and the frames

`sources/varuna/varuna_green.mp4`: 121 frames at 24 fps, 5.04 s, 1916×1080 (not 1920), chroma green, git-ignored. The key colour comes from frame 0 only (corners RGB 0, 180, 66). Late corners carry mist: f120 bottom-right reads (68, 190, 115). The identity master `varuna-isolated-kling-source-v1.png`, and seventeen more masters for later characters that arrived during the build (Agni, Angad, Anjana, Garuda, Kartikeya, Kulika, Mahabali, Mahishi, Makardhwaja, Padmavati, Rahu, Shesha, Shukracharya, Sugriva, Takshaka, Vasuki, Vritra), were moved from `assets/vfx/experimental/` into `sources/<name>/` (A7). K3 now checks every master in `sources/` is ignored, whatever its name.

| Range | Frames | Kept |
|---|---|---|
| EMERGE: the orb gathers in his raised hand, the water ring spins up around him | f000–f085 | 86 cells |
| ACT: the orb bursts over his body, he turns to water, the mist drifts and thins | f086–f120 | 35 cells |

- **Cells:** all 121 frames; no true duplicates (smallest neighbour difference 1.67), nothing trimmed.
- **Contact:** **f086**, ACT cell 0, by the new "nova" rule. The audit names the frame the burst begins; nothing is measured.
- **Pivot:** the centre between the feet on the standing frame f000, clip (959, 1055). One scale for every cell, 0.267 (the widest frame, the full-width ring, sets it).
- **Facing:** right (the orb is raised in his right-of-frame hand). No aim.
- **Matte:** "bright", by measurement. His skin is pale teal and his robe white; the ring, orb and mist are bright cyan-white. 8 px edge feather.

### The atlases (A5)

| Rung | Atlas | On disk | Decoded |
|---|---|---|---|
| 512 px | 4095×3194 | 3.64 MB | 49.9 MB |
| 256 px | 2043×1614 | 1.27 MB | 12.6 MB (25.2%) |

**Atlas lever: none.** The first pack with the real matte fitted the 4096 px ceiling, so no frames were dropped in f100–f120 and the cells stay at 512 px. The manifest keeps `cellMax: 512` as the A4 ceiling and records Varuna's real size: **`cellPx: 512`** (256 rung: 256). Decoded, Varuna is the heaviest actor so far (Meghnad 47.3 MB); the gate still holds one actor at a time and 0 MB between plays.

### The native exit

- **Registry:** `"exit": "native"` on Varuna's entry. Any other value (`"faction"`, absent) keeps the procedural faction dissolve, so Meghnad, Indra and Bali are unchanged.
- **Guard:** a play takes the native exit only when the registry asks for it and the manifest is a valid native-exit pack: `exit: "native"`, no fizzle phase, ACT ending on the last cell (`ActorManifest.exitMode`, `validate`). Otherwise the lab flags it and plays the procedural dissolve.
- **The plan:** AWAKEN → EMERGE → ACT → SETTLE. No FIZZLE, no exit cue, no exit sound; the actor holds its last cell until SETTLE.
- **The fade tail:** the pack tool bakes a linear alpha ramp into the last 10 cells, f111 100% → f120 0%, so the mist dissipates instead of popping off.
- **The nova:** at contact the flash is radial and starts at the actor's centre (half his height above the feet). The camera impulse still aims at the true target, so the A1 clamp and the upright law are untouched.

**Runtime at the inherited 0.6× (standard template pace):** **Full** AWAKEN 667 · EMERGE 3633 · ACT 2202 (contact at its first frame) · SETTLE 667 = **7169 ms**, native exit, no FIZZLE. **Fast** 3584 ms. The Epic ladder would give 3500 ms.

**The fixture.** `fixtures/varuna_seat0.json` and `varuna_seat1.json`, from the real engine. Varuna is a Hero (P6 Epic, passive: the opponent cannot play more than one Astra per round), so the Hero builder makes his fixture from a Varuna deck in his `HERO_ENTRIES` entry. One event (`play`); the board difference is Varuna entering the heroes row at 6 and nothing else. The Meghnad, Indra and Bali fixtures are byte-identical. The page's button reads **Play Varuna (Deva Hero, Epic)**, from the registry's new `label`.

### Known defects (for the owner's trial)

1. **Mist crosses the left and right frame edges** (46 frames touch an edge, most from f055; after about f105 the drifting mist is cut by the frame). The 8 px feather softens it, but hard cut lines may show at the sides of the cloud.
2. **The clip does not end empty.** Mist is still on screen at f120; the fade tail makes it vanish.
3. **The width is 1916, not 1920.**
4. **A faint lilac rim** on the thinnest mist (the green despill leaves magenta in near-transparent white), most visible f100–f115.

### Template gaps (code the fourth character needed)

1. **The native exit** (as ruled): the registry field, the manifest guard, the director dropping FIZZLE, the fade tail in the pack tool, and suite branches for a play with no FIZZLE.
2. **The nova contact rule** (as ruled): a named contact frame in the pack tool; a radial flash in the playback and the stage.
3. **A real cell size below the ceiling** (as ruled): `cell_px` and `thin_alternate` levers in the pack tool, `cellPx` in the manifest, and S8 checking the declared size. Not needed for Varuna.
4. **A pivot on the edge of its box.** At f040 and f059 the feet were the lowest matter in the frame, so rounding put the pivot 0.1 px outside the cell. The 512 cells now clamp their pivot as the 256 rung already did; Meghnad, Indra and Bali re-pack byte-identical.
5. **The button label:** an optional registry `label` for the Play button.
6. **Contact on ACT's first cell.** A contact cue on ACT cell 0 arrives the same tick ACT starts, so the stage matched it against the last EMERGE pose and fired one cell early (f085). The stage now fires a contact only on a pose drawn in the watched phase. Meghnad, Indra and Bali contact later in ACT and are unchanged.
7. **A slow device with no FIZZLE.** On a device that falls behind (30 Hz at tempo 1), the unreached cells used to play out in FIZZLE; with a native exit they would be cut at SETTLE, fade tail and all (105 of 121 drawn). A native-exit actor that is behind now finishes its remaining cells into SETTLE, one per frame, and goes on the frame after its last cell; the play's end still clears everything. **Owner ruling (2026-09-15): keep as built.** The actor finishes its remaining cells one per frame into SETTLE, with no skip-stepping. The bounded loss is accepted: at tempo 1 on a 30 Hz device SETTLE is too short to finish, and the play ends before f117–f120 (the last four fade-tail cells, at 33% alpha or less), so the thinnest mist cuts off. At the locked 0.6× default a 30 Hz device is not behind and draws all 121 cells. Suite check S11 allows exactly that loss and no more.

## LAB-9: Agni, Mahabali and Shukracharya — three launch characters, all native exit

Three more characters by the template, all on the native exit ruling B confirmed in LAB-8. Only two things needed code: a bottom-edge feather (with a guard) and a per-card contact strength. Everything else was data.

### The clips and the audit

| Card | Engine id | Card | Clip | EMERGE | ACT | Contact (nova) | Cells kept |
|---|---|---|---|---|---|---|---|
| Agni | `agni` | Deva Hero, Epic (P5) | `sources/agni/agni_green.mp4` | f000–f085 | f086–f120 | **f098**, ACT cell 12 — the engulfing burst begins | 121 of 121, no duplicates |
| Mahabali | `mahabali` | Asura Hero, Legendary (P8) | `sources/mahabali/mahabali_green.mp4` | f000–f093 | f094–f120 | **f096**, ACT cell 2 — the flame engulfment | 112 of 121; 9 true duplicates dropped from his very still idle (f001, f017, f019, f021, f023, f025, f027, f029, f031) |
| Shukracharya | **`shukra`** | Asura Hero, Epic (P5) | `sources/shukracharya/shukracharya_green.mp4` | f000–f063 | f064–f120 | **f064**, ACT cell 0 — the cast at his hand | 111 of 121 after the tail thinning |

All three: 121 frames at 24 fps, 1916×1080, chroma green keyed from frame 0's corners, the bright matte, an 8 px side feather, a feet pivot, native exit with no FIZZLE, and a 10-cell fade tail. Shukracharya's engine id is `shukra` (the Bali case): the registry keys him by it, while his folder and fixture stay `shukracharya`. Mahabali's throne is part of the actor, so his pivot is the throne's base.

### The atlases and the levers (A5)

| Card | cellPx | Lever | 512 rung | On disk | Decoded | 256 rung |
|---|---|---|---|---|---|---|
| Agni | **384** | cells below the ceiling | 4047x3215 | 3.56 MB | 49.6 MB | 2042x1618, 1.26 MB, 12.6 MB |
| Mahabali | **512** | none | 4088x3595 | 4.30 MB | 56.1 MB | 2048x1821, 1.28 MB, 14.2 MB |
| Shukracharya | **448** | alternate frames dropped in f100–f120, then cells below the ceiling | 4078x3571 | 4.36 MB | 55.6 MB | 2016x1796, 1.50 MB, 13.8 MB |

Agni is the widest performance (the fire ring spans the frame), so 512 px cells would have packed about 5984 rows against the 4096 ceiling; 448 was still over, and 384 fits. Shukracharya needed the thinning lever first, as ruled, and then 448. Mahabali fits at 512 because his idle is still enough that nine frames dedupe away.

### The bottom-edge feather (new)

Agni's and Mahabali's fire pools sit on the clip's own bottom edge, so the frame cuts them with a hard line. A per-card `feather_bottom` fades that edge, the same mechanism as the side feather. **The guard:** the band may never reach the character's core, measured on the standing frame (f000) with the matte read *before* the side feather.

| Card | Band | The standing core stops | The clip's fire reaches the edge from |
|---|---|---|---|
| Agni | **22 px** (asked 24) | 24 px above the edge | f096 |
| Mahabali | **24 px** (asked 24) | 26 px above the edge | f083 |

Shukracharya has no bottom feather: his mist never pools on the edge.

**A bug this found.** The first guard measured the matte *after* the 8 px side feather, whose own ramp fades the bottom rows — so it read the character's edge as 7 px from the frame and narrowed both bands to 5 px, about 1 px at cell scale. Reading the unfeathered standing frame gives the real gaps above.

### The soft contact (new)

A self-cast is not a strike. A manifest may now carry `contactStrength { flash, impulse }`, which scales the contact flash's length and radius and the camera impulse; an absent field means 1 and 1, so every earlier card is untouched. Shukracharya carries **{"flash": 0.5, "impulse": 0}**: half the flash, and no camera move at all (playback skips the impulse entirely at 0). The nova rule itself is unchanged.

### The timelines, at the inherited 0.6x

| Card | AWAKEN | EMERGE | ACT | SETTLE | Full | Fast | The ladder would give |
|---|---|---|---|---|---|---|---|
| Agni | 667 | 3633 | 2202 | 667 | **7169 ms** | 3584 ms | 3500 ms |
| Mahabali | 667 | 3972 | 1698 | 667 | **7004 ms** | 3501 ms | 3500 ms |
| Shukracharya | 667 | 2703 | 3587 | 667 | **7624 ms** | 3811 ms | 3500 ms |

No FIZZLE on any of them: the clip carries its own exit, and the fade tail carries the last 10 cells to nothing.

### Agni's split, and the slow-device bound (owner ruling, 2026-09-16)

Agni's first split (ACT from f098) lost **nine** cells on a 30 Hz device at tempo 1, where the LAB-8 bound allows four, all at 33% alpha or less. EMERGE cells run at 39.4/s and ACT cells at 26.5/s, both fixed by the template's pace, so moving one frame from EMERGE to ACT buys about 12 ms — it takes a dozen moved frames to win back a single cell. Measured with the suite's own loop: ACT from f090 still loses 6, from f092 loses 7; only **ACT from f086** meets the bound.

The owner ruled the split to f086 — where the ring is already collapsing, its brightness falling from 55k at f084 toward its 29k minimum at f091 — with contact unchanged at f098, now ACT cell 12. The bound itself was not widened and there is no skip-stepping.

**Verified:** at 30 Hz and tempo 1 exactly four cells are lost (f117, f118, f119, f120 — at 33.3%, 22.2%, 11.1% and 0% alpha, all inside the fade tail); at the locked 0.6x default all 121 cells draw, at 30 Hz and at 60 Hz alike.

### Known defects (accepted by the owner)

1. **Mahabali's magenta smoke rim.** The green despill leaves magenta in the thinnest smoke, along its top edge, from about f100. The same artifact as Varuna's lilac rim.
2. **Mahabali's floating crown fragments.** After the body is gone, a few gold crown pieces survive the matte above the fire (f105 onward) and drift alone.
3. **Agni's plume takes a yellow-green cast** from about f104: despill cannot separate yellow fire from a green key, so the thinning column reads chartreuse.
4. **Agni's and Mahabali's fire pools** are cut by the clip's bottom edge; the feather softens the cut but cannot invent what the frame never filmed.
5. **Shukracharya's mist column arrives late** (f093 onward), so his ACT is a long, quiet dissolution after the cast at f064 — by design for a self-cast, but it is the slowest of the three.

### Template gaps (code these three needed)

1. **The bottom-edge feather and its guard** (as ruled), plus the guard bug above.
2. **`contactStrength`** (as ruled): validated in `lib/manifest.js`, applied in `lib/playback.js`, written by the pack tool, and checked by the suite.
3. **The exit readout read the stage, not the plan.** `stage.stats().exit` keeps the last dissolve it recorded, so a native-exit play that followed a procedural one (Bali, then Varuna or these three) showed that card's dissolve in the readout — "Vanara dissolve · GPU filter" over a play that ran no dissolve at all. The readout now reads the plan first: a native exit says so. The plan, the phases and the stage were always correct; only the lab page's readout lied. `stage.stats().exit` was stale in the same way — it kept the last dissolve it had recorded — so a play now clears it as it spawns, and that field agrees with the readout.
4. Nothing else. The three cards are otherwise three `CARDS` entries, three registry entries and three `HERO_ENTRIES` lines — data only.

## LAB-9a: the ACT teleport, fixed

**The symptom**, on the live page: all three LAB-9 actors appeared, then jerked sideways exactly as the strike sounded.

**The cause** was in `poseOf`'s ACT branch, not in any atlas. The actor eases across its charge travel and arrives at contact: `k = p < c ? easeIn(p / c) : 1 - 0.18 * easeOut(...)`, where `c` is the contact cell's fraction of ACT. A card whose contact is **ACT cell 0** has `c = 0`, so `p < c` is never true and `k` starts at 1 — the entire travel landed on the first ACT frame, the same frame as the contact cue and its sound.

**Measured before the fix** (board px moved in one frame, the player's seat): Varuna **31.05** and Shukracharya **31.05** (contact on cell 0); Mahabali **7.09** and Indra **7.08** (contact on cell 2, the whole travel crushed into ~126 ms); Agni 1.35 — his LAB-9 re-split had moved contact to cell 12 and incidentally cured him. The pivots were never involved: their world drift is at most 0.36 source px across every card and both rungs, with no cell-to-cell jump, and the camera impulse never fired in the replays.

**The two fixes — lib only, no card repacked** (the atlases and pivots were correct):

1. **An ease floor.** The charge now eases over at least 35% of ACT whatever cell the contact lands on (`Math.max(0.35, a.contact)` in `lib/actorstage.js`).
2. **A nova performs where it stands.** `lib/playback.js` gives a `contactRule: "nova"` card zero travel — a radial burst has nothing to charge at. Legacy charging cards keep their travel.

**After, worst frame-to-frame motion inside ACT:**

| Card | Rule | Boundary jump | Seat 0 | Seat 1 |
|---|---|---|---|---|
| Meghnad | legacy | 0.03 | 1.35 | 2.48 |
| Indra | legacy | 0.04 | 1.03 | 1.89 |
| Bali | legacy | 0.03 | 1.23 | 2.28 |
| Varuna · Agni · Mahabali · Shukracharya | nova | **0** | **0** | **0** |

**The suite pins it** (S21, both seats, both rungs): no frame moves an actor more than **3 px** inside ACT. Three and not two because the top seat's charge travel is **1.85× longer** than the player's seat — 57.3 px against 31.1 — so the same smooth ease peaks near 2.5 px a frame there. A surge is the 7 px class and a teleport the 31 px class; the bar catches either instantly.

## LAB-10: Indra and Bali — in place, native exits

The owner extended ruling B to the two legacy characters: both now play their clip's own ending instead of the procedural faction dissolve, and neither charges across the board any more.

### The restored endings

| | Before | Now | Contact | Cells | Fade tail |
|---|---|---|---|---|---|
| Indra | ACT f053–f097, Deva dissolve | **ACT f053–f120**, native | f055, bolt-edge, ACT cell 2 | 62 → **85** | f111–f120 |
| Bali | ACT f057–f093, Vanara dissolve | **ACT f057–f109**, native | f064, ground-impact, ACT cell 7 | 66 → **82** | f100–f109 |

Both contacts keep their own rule and their own frame; every restored frame falls after contact, so the cell indices never moved.

**Indra's tail** is his own gold-dust dissolution: the body breaks up from f102, thins through f113 and is nearly empty by f119. No green survives the despill anywhere in it.

**Bali's tail** is the earth exit: gold dust from f094, then stone chunks falling through dust. It stops at **f109** — from about f110 the clip carries a teal-green blob at the bottom right (green content, not a key failure: the corners stay blue to f120), so f110–f120 stay out. The dust-to-chunks read survives intact.

### The atlases (A5) — no lever needed

| Card | 512 rung | On disk | Decoded | 256 rung |
|---|---|---|---|---|
| Indra | 4035x2624 | 2.13 MB | 40.4 MB | 2032x1322, 0.76 MB, 10.2 MB |
| Bali | 4068x1830 | 1.74 MB | 28.4 MB | 2031x921, 0.60 MB, 7.1 MB |

### In place: `travelScale`

Zero travel was keyed to `contactRule: "nova"` in LAB-9a, but Indra and Bali keep their directional rules. A manifest **`travelScale`** (0–1, **absent = 1**) now scales the charge, validated beside `contactStrength` and applied in `lib/playback.js`. Indra and Bali carry **0**; a nova is still forced to 0 whatever it says; **Meghnad names nothing, so he keeps his charge** — the grandfathered pilot is untouched.

### The timelines, at the inherited 0.6x

| Card | AWAKEN | EMERGE | ACT | SETTLE | Full | Fast | The ladder would give |
|---|---|---|---|---|---|---|---|
| Indra | 667 | 718 | 4278 | 667 | **6330 ms** | 3164 ms | 3500 ms |
| Bali | 667 | 1225 | 3335 | 667 | **5894 ms** | 2947 ms | 3500 ms |

### Accepted defects

1. **Indra's dust takes a chartreuse cast** from about f108 — the same yellow-against-a-green-key artifact as Agni's plume.
2. **Indra's dhoti survives as a pale ribbon** to about f116, after the body itself has gone.
3. **Bali's tail is cut at f109** to exclude the clip's green blob; his ending therefore stops while a little dust and a few chunks are still falling, and the fade tail carries them out.

### Two consequences, recorded

- **M8 narrows to Meghnad.** He is now the only card whose atlases are pinned byte-identical to LAB-6a; Indra's changed by design this rung.
- **The Deva preset lost its live exerciser**, since Indra was the card that played it by default. Its LAB-6a numbers are now pinned by data in **M15**, together with the fact that the **Vanara preset names no tuning knob at all** and stays at its defaults for a future Vanara card.
- **Open ruling 2 (the Vanara earth-exit tuning) is closed as moot**: Bali exits natively with the clip's own earth ending, so the preset never needed tuning for him.

## LAB-11: Mahishi and Vritra — two Wave-1 heroes, and no shim needed

Two Asura Legendaries, both native exits, both nova. The rung was proposed as a Wave-1 *shim* task; the shim was never built, because STEP-0 found there was nothing to bridge.

### The finding: Wave-1 cards need no shim

Wave-1 card definitions live in `src/engine.js` alongside every launch card, carrying `wave:1`. The flag is read in exactly one place — `mkPlayer` filters the **random draft pool**:

```js
const src = wave1 ? rawSrc : rawSrc.filter(c => !c.wave);
```

But `CARD_BY_NAME` is built from **every** deck, wave cards included, and `opts.scenario` deck injection resolves cards **by name** through that index. So a scenario that names `'Mahishi'` reaches her without any flag: the draft filter never runs on an injected deck. Both heroes were probed live before the rung — one `play` event each, no throw, inert on an empty board.

The lab therefore passes **no wave flag anywhere**, and **F27** pins that: it walks every `.js`/`.json`/`.html`/`.py` file under `lab/` and fails if any of them mentions the flag (the suite itself is exempt — it has to name what it forbids). **F26** is the companion guard rail: the fixtures name every card as a plain string, pass no option a launch card would not, and produce one `play` event whose board difference is the Hero entering at engine power.

**Engine powers, corrected against the balance ladder** (the frames on disk already match): **Mahishi P5** — R64 took her P7→P6, R76 P6→P5. **Vritra P6** — R65 took him P8→P7, R80 P7→P6.

### The two packs

| | Mahishi | Vritra |
|---|---|---|
| EMERGE | f033–f055 (23 cells) | f000–f071 (71 cells) |
| ACT | f056–f115 (59 cells) | f072–f112 (41 cells) |
| Contact | f056, ACT cell 0, **nova** | f072, ACT cell 0, **nova** |
| Exit | native, fade tail f106–f115 | native, fade tail f103–f112 |
| Tail dropped | f116–f120 | f113–f120 |
| Pivot | feet, settled f036 → (941.7, 1065) | **coil base**, settled f000 → (962.8, 1057) |
| Bottom feather | 12 px (core gap 16 px) | 16 px (core gap 24 px) |
| Atlas | 4067×3184, 2.59 MB, 49.4 MB decoded | 4044×3175, 3.17 MB, 49.0 MB decoded |
| Full / Fast | 6081 / 3040 ms | 6956 / 3477 ms |

**Mahishi's idle is dropped** (f000–f032) under the no-idle-padding law: AWAKEN already supplies the anticipation beat, so the clip's static head is dead weight in the atlas. Her ACT opens on **f056 — the frame the fire arc goes radial**, where the bounding box leaps 300 px left in a single frame. It is not her brightest frame (that is f059) but it is where the ring is *born*, and a nova flash wants the birth, not the peak.

**Vritra's ACT opens on the top of the rear (f072)**, where his head reaches its highest point before settling back. The roar *is* the strike, so the nova is the shockwave; the fire that erupts at his coil base from f090 is his **exit**, not his attack.

### The serpent reading of "feet"

A coiled serpent has no feet. `pivot: "feet"` resolves for Vritra to the **coil base** — the ground line under the coil's horizontal span — measured once on the settled frame f000 at source **(962.8, 1057)**. This joins Mahabali's throne base as a precedent for the rule: whatever carries the figure's weight on the ground is its "feet".

The pivot **cannot drift through the rear-up**, and not by luck: the pack measures one pivot on one settled frame and reuses it for every cell (the camera is locked, so that world point is fixed). Had it been measured per frame it *would* have drifted — the feet rule gives x 962.8 (f000) → 986.0 (f060) → 938.7 (f070) → 829.1 (f080) as the coil shifts under him. One pivot, one frame, no drift. **M18** pins it.

### Both tails needed trimming — the first pair since Bali

STEP-0 first reported both tails as clean. That was wrong: the measurement read a raw-frame mask rather than the packed matte. On the real matte both carry surviving ground, and both needed a trim frame.

- **Mahishi stops at f115.** Her red powder dominates through f115; from f116 the red drains and what survives is **khaki crumbs** — source-green pixels rescued by the un-mix and despilled to olive (source-green share of kept pixels runs 13.9% → 21.6% → 30.7% → 53.5% → 83.6% across f115→f119). The Bali-blob class.
- **Vritra stops at f112**, and his tail does **real work** — he does not end empty. Past f112 the drift carries two defects: every chunk keeps a **pale ground halo ring** (pale-grey share of kept pixels climbs 13% → 25% across f113–f120), and Kling's grey smoke **despills to magenta** (grey over green → G clamped to max(R,B) → pink), peaking 3.2% at f109. Ending at f112 drops the halo drift outright and leaves the magenta window (f107–f110) sitting in the **back half of the fade ramp**, at alpha 0.55 → 0.25, which plays it down. No new matte knob was needed.

### Accepted defects

- **Mahishi:** the khaki residue class beyond f115 is dropped, not fixed; if a later rung wants those frames it needs a despill that can tell olive smoke from olive powder.
- **Vritra:** the chunk halos and the magenta smoke window are handled by the trim and the fade ramp, not removed at the source. His **tail reaches the right frame edge from f062** (26 frames) — a hard vertical cut that the standard 8 px side feather fades; he is a serpent whose tail leaves frame, so the cut reads as intended rather than as damage.

### What the rung did not need

Neither card carries a `travelScale` line: both are nova, and the LAB-9a nova special case already gives a nova zero travel. Both packed at **cellPx 448** — the first rung of the lever ladder, and the only one either needed; unlike Shukracharya, **neither dropped a frame to `thin_alternate`**.

S11 holds with room on both (their EMERGE cell counts predict zero lost cells at 30 Hz / tempo 1, against the LAB-8 bound of four). S21 holds: no frame moves either actor more than 3 px inside ACT, both seats, both rungs. A5 holds: one actor decoded at a time, 0 MB between plays.

## LAB-12: Garuda — the hoverer, and an edge cut we chose not to feather

The ninth actor and the third Wave-1 hero, by the template. He was expected to be the atlas stress case: his wingspan fills the frame, his wings cross the top edge repeatedly, and he hovers for the whole clip. Two of those three turned out to matter, and not the one we expected.

### The pack

| | |
|---|---|
| EMERGE | f000–f039 (40 cells) — the hover and the wind-up |
| ACT | f040–f116 (77 cells) |
| Contact | **f041, ACT cell 1 — nova** |
| Exit | native, fade tail f107–f116 |
| Dropped | f117–f120 — **empty frames only**, no content trim |
| Pivot | **talon tips**, settled f000 → (944, 1063) |
| Atlas | 4049×2757, 3282 KB, **42.6 MB** decoded · 256 rung 2034×1388, 1147 KB, **10.8 MB** |
| Full / Fast | 7869 / 3934 ms |

**The flap is the attack, and it is radial.** His wings snap explosively outward at f040–f042, shedding feathers up, left, right and down together — the feather spread stays 940–970 px on *both* sides of his centre through the whole stroke. Nothing in the clip drives toward an opponent, so a directed gust rule would have misread it; **nova** is right. Contact sits on **f041**, the single largest picture change in the clip (Δ 25.61 against 23.63 at f040 and 22.90 at f042) — the burst's birth, not its brightness peak at f062, following the Mahishi and Varuna precedent.

**His tail is clean.** Matter runs 14.4k at f110 → 598 at f115 → 38 at f116 → 0. There is no Bali-blob class here and no content trim: the only dropped frames are the four empty ones.

### The top edge: accepted, because the guard cannot be satisfied

**42 of 121 frames put matter on row 0**, in three runs — f025–f042, f056–f070, f087–f095. At worst, more than half his span is cut:

| f030 | f031 | f032 | f029 | f028 |
|---|---|---|---|---|
| 58.2% | 55.2% | 54.1% | 52.2% | 51.8% |

The bottom-feather mechanism that protects Agni, Mahabali, Mahishi and Vritra requires the character **core** never to enter the band. Measured against the top edge on every frame, **Garuda's core sits on row 0 in 40 frames** — those are his wings, connected to his body, not stray feathers. A band deep enough to matter would fade the wings mid-stroke, in a third of the clip, exactly when they are the subject. **So the cut is accepted.** It is Kling's framing, not ours: the wings genuinely leave frame in the source, and the actor is honest to the clip. The standard 8 px feather, whose ramp is built from **all four edges**, remains his entire edge softening.

**The same is true at the bottom, and it exposes a guard limitation worth recording.** His core touches the *bottom* edge in **48 frames** (f004–f020, f039–f051 and others) — so he carries no bottom feather either. But the tool's bottom guard measures `core_gap` on the **settled frame alone**, and f000 happens to be one of the frames where his core clears the edge by 20 px. Had a bottom feather been asked for, that single-frame guard would have **passed** and then faded his robe in 48 other frames. The guard is sound for a standing figure whose stance does not change; it is single-frame, and a card that moves through the edge can defeat it. Not fixed here — recorded.

### The hover pivot

**"Feet" resolves to his talon tips, and the existing rule finds them unmodified** — no new mechanism. On the settled frame f000 it returns **(944, 1063)**, which sits exactly on his claw tips, centred between both feet. His talons therefore land on the card's ground line like any other hero's feet.

**f000 is the only safe settled frame**, and the reasoning matters more than the number:

- from **f002** his robe sash hangs *below* the talons (lowest matter y1075 against their 1063), so the rule would anchor to cloth;
- from about **f045** shed feathers drift below him — at f060 the lowest matter spans 1060 px of loose feathers, and a late settled frame would pin his pivot to something floating.

**No `hoverLift` knob was added.** The hover reads from the clip's own motion: his talon line rises 1063 → 991 (f080) → 963 (f090), about 100 source px ≈ 23 board px at cellPx 448. He visibly lifts off during the play, so buying an offset would have paid for something the animation already gives. And as with Vritra, one pivot measured on one frame and reused cannot drift while he hovers.

### The atlas was never the problem — memory was

The premise going in was that his wingspan would break the 4096 ceiling. It does the opposite: a very wide trimmed box (1916 px) forces the *scale* down, which keeps cell area small. He fits at every rung, 512 included (16.3 Mpx estimated, ~3979 rows).

The binding constraint is **A5**, whose budget line is drawn against the **256 rung** (~10 MB per match; the pilot sits at 11.5 MB). At cellPx 512 he would put **15.5 MB** on that rung — about 50% over. **cellPx 448** was ruled, and the real pack came in better than the estimate: **10.8 MB** on the 256 rung, the lowest figure of any card in the lab, under the pilot's own, while the 512 rung holds 42.6 MB for the ~8 s of a play.

**The duration lever exists and is deliberately unused.** At 77 ACT cells he runs **7.87 s Full**, longer than Varuna's 7.2 s and Vritra's 6.96 s. Thinning alternate frames across the hover hold f072–f095 would bring him to 7.11 s and 10.5 MB, but that stretch is a live wing-beat (Δ 7–12 per frame), not a still hold, so thinning would show. 7.87 s is accepted for a Legendary.

### Accepted defects

- **The top-edge cut** (42 frames, worst f030 at 58.2% of his span) — unfeatherable, see above.
- **The bottom-edge cut** (48 frames) — same reason, and the single-frame guard that would have hidden it is recorded above.
- **He is symmetric** (mirror IoU 0.76–0.85 about his own centre), so his `facing: left` is cosmetic: mirroring him for the far seat is visually neutral. Recorded so nobody later reads the value as a claim about which way he looks.

S11 predicted zero lost cells for a 40-cell EMERGE and the suite confirms it: all 117 cells draw in order, none repeated, at 30 Hz and under a 250 ms stall. S21 holds at 3 px. A5 returns to 0 MB between plays.

## LAB-13: Kartikeya — the magenta pair key, and the guard that was only ever checking one frame

The tenth actor and the fourth Wave-1 hero. Two things made this rung: a ground colour the tool could not key at all, and a latent bug LAB-12 found in the bottom-feather guard.

### Magenta is a two-channel key, and the old rule inverted him

His ground is **(243, 6, 240)** — R and B both high and nearly equal, G near zero. `key_channels` took `argmax` → R, so the keyness metric read `R − max(G, B) = 243 − 240 = **3**`. The second key channel sits right under the first, and the signal collapses.

It did not merely weaken. **It inverted.** Separation between ground and figure was **−31.98**: by that metric the *figure* was more key-coloured than the screen, so the matte kept the magenta and cut the man out as a silhouette, holding 85–100% of the frame.

| metric | ground | figure | separation | frame kept |
|---|---|---|---|---|
| `R − max(G,B)` (the old rule) | 2.92 | 34.91 | **−31.98** | 85–100% |
| `(R+B)/2 − G` | 235.24 | −6.45 | +241.69 | ~19–22% |
| **`min(R,B) − G`** (shipped) | 233.74 | −48.92 | **+282.65** | ~19–22% |

`min(R,B) − G` was chosen over the mean because it is the structural dual of the rule already there — "the key level, less the **best** non-key level" — and it separates 17% harder.

**The classifier.** `key_axes(K)` sorts the ground and calls it a pair when the top two are close and the third is far below (`hi − mid < 0.25 × (mid − lo)`). Every clip in the lab clears the boundary with room: nine green, Bali's blue at 128 against a 17 threshold, Kartikeya at 3 against 58. So the ten shipped actors keep the single-channel path untouched — proven, not assumed: **Meghnad repacks to byte-identical atlases** (his manifest gains only the new `keyKind` field; a `424.0` → `424` float-format drift in it is **pre-existing**, reproduced by the unmodified tool).

**The despill is what made him paintable.** He rides in beside a **peacock**, and blue-green plumage is exactly what a careless magenta despill destroys. The dual of the green rule (`G ← min(G, max(R,B))`) is: subtract `max(0, min(R,B) − G)` from **both** key channels, so neither can end below the lone other. Measured inside the real matte, every material passes through untouched:

| material | px | mean RGB | spill | after despill |
|---|---|---|---|---|
| peacock blue/teal | 33,323 | `[18 65 99]` | 0.0 | `[18 65 99]` |
| peacock green | 12,685 | `[56 85 50]` | 0.0 | `[56 85 50]` |
| gold armour | 293,858 | `[147 111 61]` | 0.0 | `[147 111 61]` |
| white robe | 36,374 | `[223 213 197]` | 0.1 | `[222 213 197]` |

Figure-wide spill is mean 0.1, with 0.3% of pixels above 10. The manifest now records the pair truthfully — `keyChannel: "RB"`, `keyKind: "pair"`, `chroma magenta` — where the old label would have written the false `"R"` and `"red"`. The dark-body matte (Meghnad's, single-channel by construction) now refuses a pair ground rather than keying it wrongly.

### The pack

| | |
|---|---|
| EMERGE | f000–f044 (45 cells) — **idle kept** |
| ACT | f045–f102 (58 cells) |
| Contact | **f050, ACT cell 5 — bolt-edge** |
| Exit | native, fade tail f093–f102 |
| Dropped | f103–f120 |
| Pivot | standard **feet**, settled f000 → (960.9, 1055) |
| Atlas | 4048×2033, 2216 KB, **31.4 MB** · 256 rung 2036×1025, 787 KB, **8.0 MB** |
| Full / Fast | 6886 / 3442 ms |

**His idle is kept, and the distinction is worth recording.** Mahishi's f000–f032 was dropped as *static*; Kartikeya's f000–f044 is *live* — cloth and hair moving at Δ 3.9–5.0 per frame. The no-idle-padding law is about frames that do not change, not about frames where nothing dramatic happens. A live idle is performance; a static one is padding.

**He throws, so `bolt-edge` — not `nova` and not `spear-tip`.** His wings-equivalent is a hurled Vel: a lance of energy that flies right and leaves frame. `spear-tip` is hardcoded to the **leftmost** tip (written for Meghnad, who faces left) and would have found the wrong end; `bolt-edge` is edge-based and fits unchanged. His lance peaks at 558 px on the right edge at f049 and the rule's own quarter-peak guard correctly rejects the f047 grazing tip at 37 px, giving contact **f050**. One constraint recorded in the card: the search window is **(44, 64)**, excluding f028–f034 where his banner grazes the **top** edge, which that rule also counts.

**cellPx 384, not the 448 first ruled.** At 448 his 256 rung packs to **27.3%** of the 512 rung and breaks the A5 quarter-rung invariant this suite enforces. 448 is the outlier, not a trend — 512 packs to 25.3% and 384 to 25.4%. 384 costs **8.0 MB** on the low rung, the least of any card in the lab, at a scale of 0.248 that sits between Garuda's 0.234 and Vritra's 0.249.

### The tail: the Bali-blob class, and worse

A translucent figure over magenta **un-mixes to pink ground**. The share of kept pixels whose source was ground-dominant:

| f098 | f102 | f104 | f106 | f108 | f112 | f114 |
|---|---|---|---|---|---|---|
| 8.9% | 12.6% | 17.5% | 27.4% | 35.9% | 52.8% | 56.4% |

Through f102 he is gold and coherent; from f103 he becomes pink blotches with green specks (an un-mix artifact at low alpha, not a despill inversion — the despill cannot push a channel below G by construction). **The trade, stated plainly:** we lose the clip's own disintegration and he exits on the fade tail instead, the Vritra precedent. Keeping it would mean ACT to f107, 12.2 MB on the low rung, and visible pink and green — the numbers are here in case the phone pass wants it back.

**Accepted edge cuts:** the lance leaves the frame's **right** edge f049–f055 — the attack reading correctly, not damage — and his banner grazes the **top** at f028–f034. The 8 px feather softens both.

### The bottom-feather guard was only ever checking one frame

LAB-12 found this latent on Garuda and this rung fixes it. The guard existed to keep the band clear of the character's core; its own comment said "on every frame", but the code measured **the settled frame alone**. A settled frame is one pose. A character who *moves* through the band defeats it — Garuda's talons ride the bottom edge for sixteen EMERGE frames while f000 happens to clear it by 20 px, so a band asked for there would have **passed** and then faded his robe.

**EMERGE is the right scope, and it is not the whole clip.** From the action onward, what reaches the bottom edge is the fire the band exists to fade: Agni's core "touches" the edge at f097 only because the fire has merged into the largest connected component. Measured to contact instead of to the end of EMERGE, Agni reads a false 0 px.

Re-measured against the four shipped bands:

| card | asked | EMERGE-min gap | at | shipped band | under the all-frames guard |
|---|---|---|---|---|---|
| Agni | 24 | 22 px | f071 (his bare feet) | 22 px | **20 px** |
| Mahabali | 24 | **4 px** | f087 (his throne base) | 24 px | **2 px** |
| Mahishi | 12 | 12 px | f055 (her hem) | 12 px | **10 px** |
| Vritra | 16 | 22 px | f017 | 16 px | unchanged |

All four are genuine character-in-band cases, verified by eye — not fire artifacts. **Mahabali's is the one that matters:** his throne base sits 4 px above the edge, so his shipped 24 px band is fading roughly 20 px into the throne's lowest step. That is a real shipped defect, not bookkeeping.

**The three shipped bands are ACCEPTED AS SHIPPED — no repacks**, ruled on three grounds.

- **They are proven invisible at viewing size.** All three passed the owner's device pass at these bands. The guard measures source pixels; what reaches a phone is the actor drawn at ~190 px, and a 2 px overage on a 1080 px frame does not survive that reduction.
- **Mahabali's is structurally unfixable, not merely tolerated.** His fire and his throne base occupy the *same bottom rows*: any band wide enough to fade the fire fades the step, and the compliant 2 px band would simply resurrect the hard cut the feather exists to hide. There is no band that satisfies both. Fixing it would need the fire and the throne separated in the matte, which the largest-connected-component core cannot do once they touch.
- **Agni and Mahishi are 2 px overages** — 22 against 20, and 12 against 10.

**The all-frames EMERGE-scoped guard governs every future pack.** The three bands above are grandfathered by measurement, not by exception: their numbers are recorded here so that a later repack of any of them is a deliberate act with the figures already on the table.

## LAB-13a: Kartikeya in place — bolt-edge does not imply travel

The owner saw Kartikeya shift position on the contact sound. He did, and the cause was an omission rather than a mechanism.

**What was measured.** Max actor movement between frames inside ACT, both seats, both rungs:

| card | before | after |
|---|---|---|
| **Kartikeya** | **0.80 px** (seat 0) · **1.47 px** (seat 1) | **0.01 px** |
| Meghnad (the traveller) | 1.35 · 2.48 | unchanged |
| Indra, Bali (travelScale 0) | 0.04, 0.03 | unchanged |
| the seven nova cards | 0 | unchanged |

Per-frame is the gentle end of it: the displacement he actually walked across ACT was **31 px at the player's seat and 57 px at the top seat** — the same charge distance S21 quotes — which is plainly visible on a board.

**Why the existing protections missed him.** There are two ways a card performs in place, and they are not the same thing:

- a **nova** bursts where it stands whatever its data says — the LAB-9a special case in `playback.js`, which covers Varuna, Agni, Mahabali, Shukracharya, Mahishi, Vritra and Garuda;
- every other in-place card carries **`travelScale: 0` as data** — the LAB-10 mechanism, Indra and Bali.

Kartikeya is **bolt-edge**, not nova, so the first never applied; and the LAB-13 greenlight never set the second. He shipped on the default `travelScale` of 1 and charged. **The contact rule was not the cause — the missing data line was.** `bolt-edge` says where the contact lands, not whether the actor moves; travel is per-card data and has to be stated. Indra is the proof in the other direction: also bolt-edge, and in place since LAB-10 because his card says so.

**The fix** is one data line — `travel_scale: 0` on his card, emitted as `travelScale: 0` in the manifest by the LAB-10 mechanism. The repack is data-only: **both atlases are byte-identical** and the manifest gains exactly one line. Contact stays ACT cell 5 → f050 and the cue timing is unchanged.

**The lasting guard is M25**, which reads *who travels* off the registry rather than a hand list: it re-derives every card's effective travel each run and requires that exactly one card still charges. Meghnad remains the only travelling card in the lab — as he has been since LAB-10, and now provably so rather than by assumption.

## LAB-14: Takshaka, Vasuki and Shesha — the first Naga actors, and an identity gate that earned its keep

Three launch Naga Heroes, all on coils, all native exits. The rung's first act was not packing anything.

### The identity gate caught a three-way rotation

Ten new clips were staged, each beside an identity master PNG generated with it. Before any pack, every clip's first character-bearing frame was compared against every master by silhouette IoU. Seven matched their own name. Three did not — and they did not form the *swap* the audit suspected, but a **cycle**:

| clip file, as staged | actually contained | IoU to that master | IoU to its own name |
|---|---|---|---|
| `takshaka_magenta.mp4` | **Vasuki** | 0.994 | 0.762 |
| `vasuki_magenta.mp4` | **Kulika** | 0.988 | 0.757 |
| `kulika_magenta.mp4` | **Takshaka** | 0.995 | 0.705 |

No two-way rename could have fixed it. Two things corroborated the finding independently: the audit's *action* descriptions travelled with the **files** (the teal ring pulse really is in the file named `takshaka`), and the master-based mapping suits the card text better — a board-wide ring pulse belongs to Vasuki, whose ON PLAY takes a power from every enemy Unit.

**The ruling that came out of it: the master is the provenance parent, and the filename is not authority.** A master is generated alongside its clip and names it; a filename is a label applied afterwards and can rotate. The owner re-staged, and the gate was re-run before the build: all ten now match their own master at **0.929–0.997**, with the three corrected clips at 0.988–0.995 against runner-ups of 0.705–0.770.

This check costs one pass over ten first frames. The previous batch shipped four mislabels without it.

### The three packs

| | Vasuki (P8 L) | Takshaka (P6 E) | Shesha (P7 L) |
|---|---|---|---|
| EMERGE | f000–f044 (44) | f000–f054 (54) | f000–f044 (45) |
| ACT | f045–f120 (76) | f055–f110 (56) | f045–f113 (69) |
| Contact | f045, cell 0 | f056, cell 1 | **f078, cell 33** |
| Rule | nova | nova | **nova, softened** |
| Trim | **none** | f111–f120 | f114–f120 |
| Fade tail | f111–f120 | f101–f110 | f104–f113 |
| Bottom feather | none | **16 px, guarded** | none |
| Pivot (coil base) | (967.3, 1069) | (1004.8, 1045) | (997.8, 1063) |
| Atlas | 4055×2256 · 34.9 MB | 4087×2141 · 33.4 MB | 4066×2138 · 33.2 MB |
| 256 rung | 8.9 MB (25.4%) | 8.4 MB (25.2%) | 8.3 MB (25.1%) |
| Full / Fast | 8018 / 4008 ms | 7180 / 3590 ms | 7578 / 3788 ms |

**Vasuki keeps his whole clip.** His ring pulse is born at f045 — brightness inflects there (10.9k → 17.6k) before running to its 110.5k peak at f060 — and the nova rides the birth, per the Mahishi and Varuna precedent. Nothing is trimmed, because his closing teal cloud is *genuine matter*, not ground: despilled mean `[120,165,197]`, and the ground-dominant share holds 5.9–13.4% and never climbs. But the clip does not end empty — 362k px still stand at f120 — so his fade tail does real work, the Vritra case.

**Takshaka is the Kartikeya class.** He conjures the orb at f040 and the arcs sweep out; the nova sits on f056, the largest picture change in the clip (Δ 17.56). He stops at f110 because past it his specks are increasingly *ground* rather than debris — 19.4% at f110 climbing to **65% at f120**, with the despilled mean going near-black. His bottom feather is the first band measured under the LAB-13 all-frames guard: **16 px against a 35 px core gap, measured across all 54 EMERGE frames** rather than the settled frame alone.

**Shesha is a soft cast, and the measurement is what says so.** Nothing in his clip strikes. His picture change holds flat at 3.5–3.9 through the entire build, and his brightness climbs gently to 21.7k and then *plateaus and declines*. There is no percussive moment anywhere to put a flash on. So the nova rides the radiance at its fullest — f078, 38.2k — rather than an arbitrary point on the ramp or the f094 dissolve flash, which is his exit rather than his act, and `contactStrength {flash: 0.5, impulse: 0}` softens it exactly as Shukracharya's self-cast does. That puts contact on **ACT cell 33**, much later than any other card, which is harmless precisely because a nova performs where it stands: there is no charge for a late contact to compress.

### Accepted defects

- **Vasuki:** his clip never empties, so the last thing on screen is a fade rather than a finish. The cloud is real matter, so this is a property of the performance, not a matting fault.
- **Takshaka:** the dropped f111–f120 are his final specks; anything genuinely his that lived there is lost with the ground that dominated them.
- **Shesha:** he is near-self-finishing, and only the spent frames are dropped — 7k px and 34% ground at f114, empty from f116.
- **All three:** their corners go dirty by f120 (98.4, 58.0, 35.8) as the dissolves spread. The key is unaffected — `ground_colour` reads f000, which is clean at 1.0–1.4 on every one.
- **Facing is near-cosmetic** on all three. They are frontal seated figures with mild asymmetry (mirror IoU 0.63–0.73), so the value chosen follows each one's dominant gesture rather than a direction they look.

### The Naga exit preset: untuned, and now unexercised

`data/factionfx.json` has carried a Naga dissolve since the presets were written, and no card has ever played it. These three do not change that — **they all exit natively**, so the Naga preset joins the Deva one as a preset held by data rather than by a live card. **M30** pins it: the preset exists, names no tuning knob, sits at its defaults, and every Naga actor in the lab resolves to a native exit. This extends the LAB-10 M15 note, which now covers both presets.

## LAB-15: Padmavati and Kulika — two Wave-1 Nagas, and two rules that generalise

The identity gate ran first, as it now always does. Both clips matched their own master decisively — Padmavati **0.993** against a runner-up of 0.748, Kulika **0.988** against 0.757 — and Kulika's is the clip that was rotated in at LAB-14, now sitting correctly. The action priors were re-derived from the files rather than carried over from the earlier audit table, and both held.

| | Padmavati (P7 L) | Kulika (P8 L) |
|---|---|---|
| EMERGE | f000–f049 (50) | f000–f069 (70) |
| ACT | f050–f110 (61) | f070–f104 (35) |
| Contact | f076, cell 26, **nova SOFT** | f087, cell 17, nova |
| Fade tail | f101–f110 | f095–f104 |
| Trim | f111–f120 | f105–f120 |
| Bottom feather | 12 px (gap 14 @ f036) | 8 px (gap 10 @ f066) |
| Pivot (coil base) | (1051.9, 1065) | (965.4, 1065) |
| cellPx | **320** | 448 |
| Atlas | 4078×2078 · 32.3 MB | 4075×2021 · 31.4 MB |
| 256 rung | 8.1 MB (24.9%) | 7.9 MB (25.3%) |
| Full / Fast | 7284 / 3641 ms | 6493 / 3245 ms |

**Padmavati is a soft cast**, on the same evidence that settled Shesha: her picture change never exceeds **2.9** across the entire performance, and her brightness peaks at 8.9k — an order below Shesha's 38k. Nothing strikes. She lets a green droplet fall from her palm, then turns it up and an orb forms with a flat ring spinning around it. The nova rides that ring at its fullest (f076) with `{flash: 0.5, impulse: 0}`.

**Kulika's burst is also her exit.** She conjures a green orb, it collapses to a wisp, and her coil ignites into black specks and green fire. ACT therefore opens at f070 — where the orb begins to resolve — and the nova lands mid-ACT on **f087**, which a fine scan pinned: green runs 7.7k (f085) → 11.4k (f086) → **27.6k (f087)**, a 2.4× jump carrying the largest picture change in the clip to that point.

### Box compactness drives atlas cost, not character size

Padmavati is **the lab's first card below 384**, and the reason is counter-intuitive enough to record.

Her bounding box is *compact* — hood-tall at 1080, but never frame-wide (1324 at its widest). A small box means the scale that fits her into a cell is **larger**, so every cell is denser. At 384 she would put **12.3 MB** on the 256 rung: the highest figure in the lab, above even the pilot's 11.5 MB. At **320** she costs **8.1 MB**.

Kulika is the same lesson inverted. Her specks span the entire frame width (1916) during the burst, so her scale shrinks and her cells are sparse — she is cheap at **448** (7.9 MB) and would even have fitted at 512. A visually smaller actor can cost more than a sprawling one; what the atlas charges for is how tightly the content packs into its box, not how big the character looks.

Both clear the M21 quarter-rung invariant at 24.9% and 25.3%.

### The fade tail covers the decay, never the good frames

This is now the standing structure, and LAB-13, LAB-14 and LAB-15 are each an instance of it.

A magenta clip degrades at its end, in one of two ways: a translucent figure **un-mixes to pink** (Kartikeya, Padmavati), or a burst fades and leaves **pale ground** behind (Takshaka, Kulika). Either way the last frames stop being the actor and start being the screen.

The rule: **place the ramp so its declining alpha lands on the degrading window, and trim everything past the ramp floor.** The ten-cell tail is not decoration to be appended wherever the clip stops — it is the instrument that disposes of the decay, so it must be aimed at it.

- Padmavati's pink creeps into her dissolving torso from **f106**; her ramp runs **f101–f110**, so that window plays at alpha 0.44 → 0.0, and f111–f120 (51–65% ground) is dropped.
- Kulika's pale cloud dominates from **f099** as the green dies; her ramp runs **f095–f104**, so the burst f087–f094 plays at **full alpha** and the decay is what fades, with f105–f120 dropped.

The ramp always ends on the last kept cell and the trim always begins the frame after. **M34** pins both halves.

### Accepted defects

- **Padmavati:** the dropped f111–f120 are her final specks; whatever was genuinely hers there goes with the ground that dominated them. Her bottom feather is 12 px against a 14 px core gap — the tightest margin in the lab, measured across all 50 EMERGE frames by the all-frames guard.
- **Kulika:** her top edge is touched for 26 frames from f023 (hood and raised hand) and her sides for 2–3 frames at f103+; all accepted under the standard 8 px feather.
- **Both:** corners go dirty by f120 as the dissolves spread (37.3 and 25.5). The key is unaffected — `ground_colour` reads f000, clean at 1.4 and 1.7.

## LAB-16: Sugriva and Angad — the first Vanaras since the pilot, a blind spot in the method, and an ability that fires

Identity first: Sugriva **0.985** against a runner-up of 0.611, Angad **0.973** against 0.597. Their action priors were re-derived from the files, and each needed one correction. The audit missed Sugriva's **second strike** (a vertical slam, larger than the sweep it did record), and Angad's shield **doesn't spin** — he raises it and it throws a radial flash.

| | Sugriva (P6 E) | Angad (P7 E) |
|---|---|---|
| EMERGE | f000–f051 (52) | f000–f047 (48) |
| ACT | f052–f110 (59) | f048–f104 (57) |
| Contact | f056, cell 4, nova — **the slam** | f053, cell 5, nova — **the shield flash** |
| Fade tail | f101–f110 | f095–f104 |
| Trim | f111–f120 | f105–f120 |
| Bottom feather | 16 px (gap 24 @ f000) | **none — unguardable** |
| Pivot (feet) | (857.4, 1057) | (934.2, 1029), a 579 px crouch |
| cellPx | 448 | 448 |
| Atlas | 4079×2042 · 31.8 MB | 4002×2381 · 36.3 MB |
| 256 rung | 8.0 MB (25.2%) | 9.2 MB (25.3%) |
| Full / Fast | 7243 / 3620 ms | 6949 / 3473 ms |

**Sugriva strikes twice, and the nova rides the slam.** He sweeps his staff and flings dark fragments rightward, then drives it down into a burst at his feet. The slam is his largest event: brightness jumps 29.6k → **47.9k at f056**, carrying the biggest picture change in his act. The sweep climbs smoothly (7.9k → 31.4k over f044–f052) with no clean onset to put a contact on.

**Angad is the busiest clip in the lab.** His picture change runs 8–16 for most of the clip, with brightness spikes for the dust kick, the shield flash, a second shield motion and a blown-out golden transformation (487k). The flash is born on **f053** (32.3k → 70.4k, a 2.2× jump, rising to the clip's largest change at f055). A defensive ward suits a card whose opponent forfeits a turn for playing an Astra.

### The first on-play ability that fires on an empty board

Every Hero before Sugriva was inert on the empty board a fixture plays onto. **Sugriva is not.** "ON PLAY: Draw 1 extra card" runs: his hand stays at **10** (one card played, one drawn) and his deck falls **2 → 1**.

**Neither instrument the guard rail uses can see it.** The event stream carries only the play, and the board difference carries only his entry. So "one event, nothing changed" passes him by the letter while hiding that his ability ran. A1 is unaffected, because a draw isn't on the board, but a silent pass is not acceptable.

**F51** asserts the draw from the state it changes: hand 10 → 10 and deck 2 → 1, on both seats, against Angad's inert 10 → 9 and 2 → 2. It was checked against three doctored fixtures before being trusted: a draw that didn't fire, a draw of two, and an inert Hero fed in as Sugriva. It rejects all three.

**This is the template for any future fixture whose Hero carries an on-play ability:** assert the ability from the state it changes, whether or not an event or the board reports it.

### M34 now uses both metrics — tan-gold dust was the blind spot

LAB-13 to LAB-15 set trims with the **source** metric: the share of kept pixels whose *source* is ground-dominant. On these two cards it badly under-reports. Sugriva reads **7.9% at f108**, while his dissolve is already visibly pink.

Putting source beside matte shows why. Kling's dissolve here is **tan-gold dust** with only a faint pink haze in it. The dust is semi-transparent, so the un-mix leaves a magenta cast in the *output*. But tan has **B < G**, so no source pixel is ground-dominant, and the despill (which only acts where both R and B exceed G) never touches it.

An **output-side** metric — pink cast among the despilled result — does see it. Its breakpoints agreed with the eye on both cards. Calibrated against the cards already shipped:

| card | source ground-share | output pink cast | what it shows |
|---|---|---|---|
| **Kartikeya** | catches it | catches it — **16.6% → 35.8%** at f104 | his shipped f102 trim sits exactly on the output break |
| **Padmavati** | catches it | barely registers (≤15%) | darker, purple residue — source-only |
| **Sugriva** | under-reports (7.9% at f108) | **catches it** — 14% → 20.0% (f108) → 28.5% (f110) | tinted dust — output-only |
| **Angad** | under-reports | **catches it** — 19.2% (f102) → **37.3% (f104)** | tinted dust — output-only |

**Neither metric is sufficient alone, and M34's evidence basis is now both, jointly.** Each covers the other's blind class. Tan-gold dust (B < G) is the documented blind spot of the source metric; darker residue is the output metric's.

Both trims follow the law: Sugriva's pink rim begins ~f105 under a ramp f101–f110, and Angad's rim begins f096 under a ramp f095–f104 that ends exactly at his break into fragments. **M37** pins the structure the measurements produced.

### Angad's bottom edge cannot be feathered

His core **touches the bottom edge at f039**, mid-EMERGE, during the dust-kick lunge. The all-frames guard measures every EMERGE frame, so no band can ever clear it. He touches that edge in **87 frames**, the most in the lab. It's an accepted cut under the standard 8 px feather, following the Garuda precedent. **M38** pins it.

### The presets nobody plays — and the difference the record keeps

Both Vanara actors exit natively, so the **Vanara dissolve preset is now unexercised**, and the M15/M30 note reaches its last faction. **No Deva, Naga or Vanara actor exits procedurally.** Only the Asura preset is still played, by a single card: Meghnad.

They are **not all untuned**, though, and **M39** keeps that difference on the record. The Naga and Vanara presets carry none of the tuning knobs. The **Deva preset still carries the 13 it was given in LAB-6a** (pinned by M15): tuned, but unexercised since LAB-10 sent Indra native.

### A new deck, and one that stayed put

`VANARA_DECK` (LAB-7) holds Bali, Sugriva and Angad together, and Bali's byte-pinned fixture uses it unsliced. Reusing it would have put Sugriva in his own deck twice with both other Heroes beside him. So it is **untouched**, and a new `VANARA_UNITS` — twelve launch Vanaras, no Heroes — backs these two fixtures, as `NAGA_DECK` did for LAB-14. All 32 pre-existing fixtures are byte-identical, Bali's included.

### Accepted defects

- **Sugriva:** his edges are touched often — top 57 frames from f014 (the staff tip), bottom 63 from f044, right 12 from f051 (flying fragments). All are accepted cuts, with the bottom band guarded.
- **Angad:** besides the unguardable bottom edge, top 43 frames from f020 and left 8 from f039 (the dust kick widening), all accepted.
- **Both:** the dropped tails are tinted dust. Whatever was genuinely theirs in those frames goes with the magenta cast that dominated them.

### OPEN: Sugriva's first live play

**Status: open.** Not labelled an artifact and not labelled a defect.

**The observation.** On the very first play in a newly opened browser pane, Sugriva's readout showed a **295 px board shift** on `#field`, and its "final board = engine AFTER ✓" was **missing**. Angad, played immediately after in the same pane, was clean.

**The evidence against a pattern.** It happened **once**. Sugriva then played **clean eight times**, 0 px shift and final board ✓ every time: three replays in that tab, one on seat 1, one second on a fresh reload, one with no wait after load, and one sampled at both 9 s and 14 s in a reopened pane. Angad played *first* on a fresh page was clean as well, and the suite's GATE layout check passes for Sugriva.

**The cause is unproven.** Both candidate explanations are environmental, and neither was confirmed:

- **Cold-start latency.** First fetch and decode pushed the play past the 9-second sampling window, so the readout was read mid-play. The one test of this found the play already done by 9 s.
- **First GPU initialisation.** Layout was still settling during the first play of a new pane.

The lab could not recreate a truly cold start: reopening the pane reused the browser process, so its asset cache stayed warm. Nothing observed points at Sugriva specifically, but a single cold start is too little to rule that out.

**Closing condition.** The owner's device pass runs the decisive experiment: **a cold app launch with Sugriva played first.** A clean result closes it as environmental; a repeat of the shift reopens it as a defect against his card.

## LAB-17: Anjana and Makardhwaja — the first card that touches no edge, and ground-impact's return

Identity first. Anjana: **0.987**, runner-up 0.633. Makardhwaja: **0.929**, the lowest in the batch — but his margin over the runner-up is **0.441**, the *widest of any card*, because his lunge silhouette is unlike anyone else's. A low self-score here reflects pose drift between f000 and his still, not an ambiguous match.

| | Anjana (P6 L) | Makardhwaja (P7 L) |
|---|---|---|
| EMERGE | f000–f047 (48) | f000–f054 (55) |
| ACT | f048–f105 (58) | f055–f106 (52) |
| Contact | f085, cell 37, **nova SOFT** | f059, cell 4, **ground-impact** |
| travelScale | nova → 0 | **0, stated** |
| Fade tail | f096–f105 | f097–f106 |
| Trim | f106–f120 | f107–f120 |
| Feathers | **none — no edge touched** | none |
| Pivot (feet) | (878.5, 1051) | (1069.4, 1047), a 791 px lunge |
| cellPx | 384 | **352** |
| Atlas | 4052×1749 · 27.0 MB | 4058×2109 · 32.6 MB |
| 256 rung | 6.9 MB (25.42%) | 8.3 MB (25.39%) |
| Full / Fast | 7012 / 3505 ms | 6929 / 3464 ms |

### The engine is authoritative over the roster

The roster describes Makardhwaja's ability as *"Leap from Hanuman if present, else your strongest."* The engine says **"ON PLAY: Copy the power of Bali if he is on the board, otherwise of your strongest Unit."** Two differences, both deliberate: Bali's engine id is `hanuman`, so "Hanuman" is the id and "Bali" the name; and batch 17 implemented the ability as a **direct power copy**, not a Leap, because Heroes live outside `pl.units`. Everything in this rung tests the engine's behaviour.

### Sugriva and Makardhwaja are a mirror-image pair

LAB-16 found that Sugriva's on-play draw **changes state** on the empty fixture board (hand 10 → 10, deck 2 → 1) yet **logs nothing**, so F51 asserts it from the state.

Makardhwaja is the exact reverse. On the empty board there is no Bali and no friendly Unit, so his **no-source branch** runs and he enters at his printed 7. That **changes no state** (hand 10 → 9, deck untouched) and **emits no event** — but it leaves one line in the fixture's log: *"Makardhwaja finds no strength to borrow — he enters at his printed power."*

**F57** asserts his ability from that log line, extending F51's principle from state to log: **assert an ability from whatever it actually changes.** It cannot throw on the empty board either — the branch's `units.reduce` would throw on an empty array, but it sits behind `units.length ? … : null`.

F57 was proven falsifiable before being trusted, against three doctored fixtures: one where the branch didn't run, one where a source existed and he copied it (a `buff` event and a different power), and an inert Hero passed off as him. It rejects all three.

### Ground-impact returns, and needs both of Bali's conditions

Makardhwaja is the first ground-impact card since Bali, and he needs both of the things Bali has.

**A search window.** Unwindowed, the ground-impact rule fires at **f040** — while he is **airborne**. What crosses the ground band there is his **tail sweeping low mid-leap**, not a landing. Two things combine: the airborne frames sit inside the default window, and his wide lunge leaves only **one foot** within 14 px of the ground line, so the "standing feet" exclusion covers just **16%** of the frame width. Windowed to **(56, 70)**, the rule fires on **f059**, where the landing splash first reaches the band (582 at f058 → 2,172 at f059 → 10,167 at f060, the clip's largest picture change). This is the Kartikeya window precedent; no tool change.

**`travelScale: 0`, stated.** Ground-impact is not a nova, so the nova zero-travel case does not cover it. That is precisely the LAB-13a trap — a bolt-edge card shipped charging because nobody set the line. Makardhwaja's manifest carries `travelScale: 0`, as Bali's does.

His core rides the **top edge for 24 airborne frames** (f039–f062) — an accepted cut per Garuda, since a top band would fade him mid-leap. He never touches the bottom, so he carries no feather.

### S20 never covered a directional contact — now it does

S20 checked only novas. So Bali, Indra and Kartikeya — every in-place card that strikes *toward* its target — had **no check that their flash points at the target**. **S20b** closes that gap for all four in-place non-nova cards: the flash is directional, not radial; it fires on the contact cell; and both the flash and the camera impulse aim at the true target seat (up from the player, down from the top). It passes for Indra, Bali, Kartikeya and Makardhwaja on every backend.

Both of its guarantees were tested by breaking them, and one test changed what the check claims:

- **The direction is S20b's own guarantee.** With the flash direction flipped in `playback.js`, **S20b fails on all four cards.**
- **The 0 px is not.** S20b reports the actor's distance from where it spawned (0.00 px on all four), but its gate admits only `travelScale: 0` cards — so a card that *charged* would be **skipped** there, not failed. Forcing Makardhwaja's `travelScale` to 1 confirmed it: S20b didn't run. The charge is guarded instead by **M25** (only Meghnad travels) and **M42** (his `travelScale` is 0), **both of which failed** under that same negative. S20b's label says exactly this, so the check does not over-claim.

### Cell sizes: a second sub-384 card, and a second packing accident

**Makardhwaja is the second card below 384**, following Padmavati. His box is compact even airborne (widest 1564), which forces a dense scale; and his heavy motion blur through the leap means lower resolution costs little.

He was ruled at **320**, but **320 failed M21**: his 256 rung packed to **25.532%** of the 512 rung, over the bound by 35,269 bytes. It was an isolated accident — 288 (25.145%), 352 (25.387%) and 384 (25.264%) all pass. Per the resolution order ratified in LAB-13, the invariant outranks the per-card ruling, so he packs at **352**: the nearest passing size to the ruling, still sub-384, at 8.3 MB.

### Anjana: the first card that touches no frame edge

Every card before her needed at least one feather band. Anjana's frames are clear of **top, bottom, left and right** in every frame, so she carries **no feather at all**.

She is also a **soft cast**, like Shesha and Padmavati. Her picture change holds at about 4 through the whole ribbon with no percussive frame, so the nova rides the ribbon **at its fullest (f085, 79.3k)** with `{flash: 0.5, impulse: 0}`. The gold glow at her feet ignites at **f090** (2k → 12.4k, a 6× jump) — that is her exit, not her act, and the contact lands five frames before it.

### M34 calibration: two more source-only rows

| card | source ground-share | output pink cast | class |
|---|---|---|---|
| Kartikeya | catches | catches | both |
| Padmavati | catches | ≤ 15% | source-only |
| Sugriva | under-reports | catches | output-only |
| Angad | under-reports | catches | output-only |
| **Anjana** | crosses 20% at f102 | ≤ 17% | **source-only** |
| **Makardhwaja** | 11.4% → 19.7% at f101 | ≈ 0% | **source-only** |

Makardhwaja's frost-blue dissolve has R < G, so it carries no pink cast at all. Only the two tan-gold dust cards have needed the output metric so far.

### Accepted defects

- **Anjana:** her trim excludes her **teal sari fragments** scattering at f110–f120. They are genuine, but thin and translucent enough to read **36–51% ground**, so real content is excluded because contamination rides it — the Bali stone-chunk precedent.
- **Makardhwaja:** his head leaves the frame for 24 airborne frames; the dropped f107–f120 are residue and empty frames.

## LAB-18: Rahu — the roster complete

The last card and the strangest: a **severed floating head**, black smoke matter, on the batch's **one green key**. Identity first: **0.974**, runner-up anjana 0.601, margin **0.373**. The classifier picks **green, single-channel** (margin 122 against a threshold of 15) after nine pair keys, and his corners stay clean through f120 (max 8.7), unlike every recent magenta card.

| | Rahu (P4 E, launch Asura Hero) |
|---|---|
| EMERGE | f000–f031 (32) |
| ACT | f032–f092 (61) |
| Contact | f044, ACT cell 12, **nova SOFT** `{flash: 0.5, impulse: 0}` |
| travelScale | nova → 0 |
| Fade tail | f083–f092 |
| Trim | f093–f120 |
| Feathers | **none — no edge touched** |
| Pivot (feet) | (926.2, 1053), his lowest smoke tendril |
| Cells | **93, every frame kept** (`keep_duplicates`) |
| cellPx | 384 |
| Atlas | 4065×2295 · 35.6 MB |
| 256 rung | 2027×1155 · 8.9 MB (25.095%) |
| Full / Fast | 6524 / 3261 ms, contact at 2775 / 1387 ms |

### The matte: the hardest keying case, resolved on the standard path

Near-black translucent smoke on green is the case every earlier card avoided, with three named risks. Both mattes were rendered on six frames over a warm dark board and measured:

| risk | source | bright output | dark-body output |
|---|---|---|---|
| (a) green cast in translucent smoke | climbs +1.5 → +14.8 as he goes translucent | −1.1 to +1.2 | −1.9 to +0.2 |
| (b) despill crushing near-black | — | neutral, no magenta shift | neutral |
| (c) corona hue (G/R) | 0.85–0.93 | 0.83–0.91 | 0.81–0.91 |
| fringe share | — | 0.000% | 0.000% |

The numbers tie, so **the frames decide: the bright matte.** The dark-body path's isolate step cuts bright light too far from the dark body, which **breaks the corona into a gapped ring at f076** and leaves a reddish fringe on the smoke. **rembg is unused.** The dark-body matte stays available — Meghnad still uses it — but it was not exercised here.

A few thousand **yellow-green rim pixels** in the corona are identical under both mattes, so they are Kling's, not the key's; on the dark board the rim reads faintly lime. Accepted as a source property.

### Pivot reading four: the smoke is his feet

The pivot rule is measured once, on f000, and reused for every cell. It has now been read four ways, each the thing that meets the ground:

| card | what the feet rule lands on |
|---|---|
| every standing card | the feet |
| Mahabali | the throne's base |
| Vasuki, Takshaka, Shesha, Vritra | the coil's base |
| Garuda | the talon tips (a permanent hoverer) |
| **Rahu** | **the lowest smoke tendril** |

The ordinary rule, with no knob, puts his **smoke tendrils on the card's ground line and the head above it**: the smoke is about 38% of his height, a real tether, so he reads as an apparition rising from the card rather than a sticker on it. His dissolve completes the reading — he fades **bottom-up**, the tether dissipates first (f060–f075), and the head floats free before it vanishes. The pivot's x is within 10 px of his horizontal centre. The alternatives were measured and rejected: the bounding-box centre lands on his **nose** (half the head below the ground line), and a "chin" heuristic landed inside the neck smoke, which is as solid as the face.

### keep_duplicates: the duplicate rule's premise fails for the stillest card

The pack drops a frame whose picture differs from the last *kept* frame by under **0.6** — that is how a true duplicate reads. Rahu is the most static clip in the lab, and on first pack the rule dropped **29 frames, every odd frame f001–f057**. They are not duplicates:

| | change to the next frame | pixels moving by more than 24 levels |
|---|---|---|
| inside a dropped pair | 0.37–0.54 | 3,841–8,753 |
| between pairs | 0.36–0.57 | 5,112–11,670 |

The two rows match: these are genuine frames of his glow shimmer and smoke drift, moving below the threshold. The rule compares with the last kept frame, so it kept every second one. Recording them as **"true duplicates" would have made the manifest false**, and because a phase plays its cells at one even rate, it would have **compressed the static head (981 → 624 ms) and stretched the dissolve (1321 → 1679 ms)**, landing the flash on ACT cell 6 at 288 ms instead of cell 12 at 453 ms.

**Ruling:** `keep_duplicates` is a per-card pack-tool setting (default false), per-card data like `travelScale`, `contactStrength` and `cellPx`. The standing rule is unchanged for every other card. Rahu carries it: **93 cells, `duplicatesDropped: []`, `audit.keepDuplicates: true`**. The cost is honest and within budget — 64 cells would have been 6.0 MB at the low rung, 93 cells are 8.9 MB — and both pass M21. **M46** pins that the setting is on exactly one card, that every manifest recording it records zero dropped duplicates (a doctored one is rejected), and that Rahu has 93 contiguous cells.

The default path was proven untouched: Mahabali (9 duplicates dropped) repacked with the committed tool and with this rung's tool comes out **byte-identical** in both atlases and the manifest. Both differ from Mahabali's committed pack by a few 1-px cell boxes — older environment drift, the LAB-13 Meghnad precedent — so the committed pack was restored.

### A soft nova with no ignition

The audit described his eyes igniting and the corona flaring. **Nothing ignites**: eyes, corona and molten cracks are all lit at f000. Across f024–f060 his picture change never exceeds **0.8**, brightness holds at 31.5–32.8k and gold at 62–65k. That makes him the clearest **soft cast** in the lab, after Shesha, Padmavati and Anjana.

**The contact frame is close to arbitrary, and the rule is the tiebreaker.** Gold peaks at **f044 (64,821)**, under 1% above a flat glow; any frame from f024 to f050 is effectively equivalent. The contact sits at **f044, ACT cell 12**, by the radiance-at-its-fullest rule.

He is also the **second card that touches no frame edge**, after Anjana — no feather of any kind.

### The third ability class: inert by timing

Rahu's text is a **PASSIVE**: *"At the start of each round, the opponent discards 1 random card from their hand."* In the engine it lives in **`endRound`, after `g.round++`**, guarded by `foe.hand.length` — never in `playCard`. So on his play the opponent's hand stays **10** and their discard stays **empty**. The three Heroes whose abilities hide from the event stream and the board difference now form a complete table:

| card | class | what the guard rail reads |
|---|---|---|
| Sugriva | changes state | his hand and deck counts (F51) |
| Makardhwaja | log only | the no-source log line (F57) |
| **Rahu** | **fires at a moment the fixture never reaches** | **the opponent's untouched hand and discard (F61)** |

**F61** asserts opponent hand 10 → 10 and discard 0 → 0, and makes it more than a silent pass three ways: it pins that the engine's only Rahu hook sits inside `endRound` after the round advances; it **drives the engine across the round boundary** — with Rahu on the board the opponent loses one card to the discard with the *"Rahu devours…"* line, without him none; and it rejects three doctored fixtures — an on-play discard (hand 9, discard 1), a play where the round turned, and an inert Asura Hero (Vritra) passed off as him.

### The M34 method note: green keys are source-only by construction

The output metric was built for magenta keys, where a translucent dissolve leaves a pink cast. On a **single-channel green key** its analogue — output green cast — reads **0.0% on every frame**, and that is structural, not a measurement: the despill sets `G ← min(G, max(R, B))`, so no output pixel can be green-dominant. **A green-keyed card is source-only by construction and must never be read as "clean on both."** **M48** proves it over the sampled RGB cube (0 green-dominant after despill).

Rahu's tail is the near-black class: output mean `[70,58,31]` → `[25,22,16]` at f080 → `[7,7,4]` at f088. The source ground share crosses 20% at **f090 (29.7%)**, 41.3% at f092, 77.6% at f094, empty by f098. The ramp f083–f092 covers the first degrading frame and ends on the last kept cell; the trim begins at f093.

| card | source ground-share | output cast | class |
|---|---|---|---|
| Kartikeya | catches | catches | both |
| Padmavati | catches | ≤ 15% | source-only |
| Sugriva | under-reports | catches | output-only |
| Angad | under-reports | catches | output-only |
| Anjana | crosses 20% at f102 | ≤ 17% | source-only |
| Makardhwaja | 11.4% → 19.7% at f101 | ≈ 0% | source-only |
| **Rahu** | **crosses 20% at f090** | **0 by construction (green key)** | **source-only** |

### Registry, fixture, and the roster

Registry key `rahu`, button **"Rahu (Asura Hero, Epic)"**, fixture off the Asura deck path (`['Rahu'].concat(ASURA_DECK.slice(0, 11))` against the Deva deck). All 40 existing fixtures regenerate byte-identical. With him the lab holds **21 actors: Meghnad and twenty Heroes** — the roster is complete.

### Accepted defects

- **Rahu:** the faint lime rim on his corona is Kling's (identical under both mattes). The dropped f093–f120 are near-black specks and empty frames.

## LAB-19: the Vajra strike clip — the premium effects track opens

The first clip that is not a character. Vajra (Deva Astra, Legendary) plays a black-ground Kling strike **additively**, slotted into the live game's existing Vajra contract. It is not an actor, and it touches none of the 21 actors, their laws, or the live game's Vajra effect: the lab plays the clip version alongside, and export stays a separate ruling.

### Owner amendments, recorded here (not in docs/)

1. **The premium track admits additive effect clips.** Mythic and Legendary Astras, Mantras and Artifacts may play **black-background emissive Kling footage additively**, alongside procedural work. The "no Kling" line is narrowed to **"no actor-class assets"**: no mattes, no rungs, no per-actor memory ladder.
2. **The v4a carve-out: an Astra's effect may depict the Astra's own weapon — the weapon is the spell.** The v4a "no objects" law stays in force everywhere else.

### The premium ruling (owner ruling, 2026-09-16) — its first authoritative recording

The owner gave this ruling in chat on 2026-09-16; until now it had not landed in the repo. This section is its first authoritative recording, dated, in full. The export rung's docs/ consolidation carries this text forward.

1. **Actors are Heroes-only by default.** A Hero card's play may manifest as an actor.
2. **Meghnad is grandfathered as the pilot.** He stays an actor although he is a Unit.
3. **Unit actors are reserved as a future paid-cosmetic tier.** No other Unit gets an actor under the default rules.
4. **Mythic and Legendary Astras, Mantras and Artifacts get the premium effects track.**
5. **Lower rarities, and all other Units, keep their existing VFX.**

Both LAB-19 amendments above are scoped by this ruling: they apply to the premium effects track, and so to Mythic and Legendary Astras, Mantras and Artifacts only. Vajra is a Legendary Astra.

**Standing note: docs/ consolidation of all lab amendments happens at the EXPORT rung.** The experiment rule stays absolute — no docs/ exception for this rung.

### The contract it slots into (the game's index.html, read, never modified)

| beat | what the game does | × speed × CHOREO_SPEED 1.3 |
|---|---|---|
| cast (`play` event) | `sfx_astra`; Legendary → spectacle tier: 110 ms hit-stop + 1000 ms hold | **1443 ms** at Normal |
| strike (`destroy`, abilityName `Vajra`) | `sfx_unit_destroy`; `sprVajra` on the target card's centre; 40 ms; the card cracks; 600 ms dwell | 52 + 780 ms |
| draw | the sheet's alpha baked to its brightest channel, drawn `lighter` | — |
| no target | no destroy event, so no strike | — |

**M52** reads every one of those numbers from the game's source, so a change to the game's Vajra beat fails the suite. The cast-time screen shake (spectacle tier, at the cast, ~433 ms before this clip's impact) is **noted, not changed**.

### The portion and the timing (ruling 1)

**S1, the strike alone: f085–f120, 36 cells.** The charge phase (f000–f084, the mandala) stays in the source, unused — a possible future cast cinematic, not built.

The clip **starts inside the cast beat's hold**, exactly its lead before the destroy beat, so its **impact cell (f093, the largest picture change in its window, 11.95) lands on the destroy beat**. Its aftermath is un-awaited, as today's sprite is.

| | Normal | Fast |
|---|---|---|
| cast beat | 1443 ms | 866 ms |
| clip starts | 1010 ms | 606 ms |
| **impact cell = destroy beat** | **1443 ms** | **866 ms** |
| crack | 1495 ms | 897 ms |
| board on AFTER | 2275 ms | 1365 ms |
| clip ends (un-awaited) | 2960 ms | 1776 ms |
| **wire-clock cost** | **0 ms** | **0 ms** |

### Anchor and scale (ruling 2)

The impact point — the brightest blurred point on f093, **(959, 923)** in the source — is the anchor, placed on **the target card's centre**. The ring on f112 (**910 source px**) draws **2.4 card widths** across, the current strike's size. On a 64 px card the clip draws 288×182 px and rises 156 px above the card's centre. The edge-slot spark overrun (~63 px of additive glow past the field) is accepted.

### The pack (ruling 3) and budget E1

`tools/make_effect_from_clip.py` (not the actor tool): crop to the union of content (luma > 4) over the kept frames, **1708×1080**; one scale; **448×283 cells**; RGB WebP. No matte, no rungs, no pivot, no phases.

| | |
|---|---|
| atlas | 4052×1142 · 328 KB |
| decoded | **17.65 MB** |
| E1 cap | 18.00 MB (the game's own hi-rung Vajra sheet, 3072×1536 RGBA) |

**E1 is recorded beside A5** (see *Memory (A5)*).

### Edges, feathers, fades (ruling 4)

The black ground is true: corners 0 in every channel on every frame; more than 300 px from content, at most 2.

| edge | frames touched (of 36) | treatment |
|---|---|---|
| top | 36 — the weapon is cut | 64 px feather (16.8 cell px) |
| bottom | 28 — the impact glow and spike, from f093 | 64 px feather, **guarded** |
| sides | 0 | none |

**The bottom band's guard** stops above the ring **body**: rows holding at least 20 bright (> 150) pixels off the beam column, on every frame from the impact to the fade tail (f093–f110). The body's lowest row is y 998 (f094), leaving 81 px of room. Sparse sparks are not the body. The first guard read every bright pixel and fell to 0 px, because sparks reach the edge on the last tail frames. The body itself enters the band only inside the tail: f119 at 11%, f120 at 0%.

**Ratified (owner ruling, LAB-19): the guard protects the ring body, not the sparks the feather exists to fade.** This is the LAB-13 precedent applied to an effect. There, the bottom-feather guard was scoped to the EMERGE frames, because EMERGE is the character before the action: from the action on, what reaches the edge is the fire the band exists to fade. Here the same distinction is drawn inside the frame instead of across time. The ring body is what the clip must keep whole, so the guard measures it on every frame from the impact to the tail start. The sparse sparks and the spike running off the bottom edge are exactly what the band exists to fade. A guard that counted them would forbid the feather wherever it is needed, which is how the first version read 0 px.

**Fade-in head** over f085–f088 (20/40/60/80%) — the weapon would otherwise pop in. **Fade tail f111–f120, mandatory**: the ring is still growing on the clip's last frame, so the clip never exits on its own.

Sounds unchanged: `sfx_astra` at the cast, `sfx_unit_destroy` and the card crack at the destroy beat. Both are byte-identical copies from `assets/audio/`, like LAB-5's two.

### The fixture: the first Astra fixture

`fixtures/vajra_seat0.json` / `_seat1.json`, from the real engine: the Asura seat moves first and sets **Bana Asura** down (printed 6, 7 after the first Chaos Surge); the Deva seat casts Vajra, which is **legal**. The engine emits exactly **play, destroy** (both named Vajra, the destroy on Bana), logs "Vajra falls!", and the board difference is Bana **leaving**.

- **F64** asserts the kill, and rejects three doctored fixtures: the destroy removed, the kill credited to Gandiva, the mark surviving.
- **F65** drives **the no-target case** live from the same builder with a smaller mark (Vibhishana, 5): Vajra is **not playable**, a forced cast only logs "Vajra finds no mark.", nothing is destroyed, and the clip's plan has **no strike and no clip**. Rejects a doctored run claiming legality, and one carrying a destroy.
- **C18:** A2 stands — the Astra is out of the actor scope, and the clip never enters the director.

### The stage (`lib/effectclip.js`)

Its own player on its own layer (`#effectclip`, z 6, with the effect layer, under the actor), wired by `lab.js` for any registry entry carrying `effect` (Vajra's carries no `manifest`, so every actor loop skips it). **E1–E6** drive it on a stepped clock:

- **Full, 60 Hz:** all 36 cells in order, all `lighter`; the impact cell's first frame **is** the destroy beat's frame.
- **30 Hz and Fast:** still exact.
- **Reduced:** no decode, no draw, the beats and sounds still run.
- **Skip mid-clip:** AFTER at once, released.
- **One clip at a time:** a second play ends the first before decoding.
- **The bake is the game's `bakeAlpha`.**

**Falsifiable:** with the clip's start moved one cell late, E1, E2 and M52 fail.

The clip is **timed, not stepped**: a stalled frame shows the cell that is due, so it can skip a cell but never drifts off the beat. Live in the browser, one cell was skipped on a frame that stalled past 54 ms right after the 17.7 MB bake. Every other play drew 36/36, with the impact on the destroy beat's frame.

### Registry

Key `vajra`: `"effect": "../effects/vajra/manifest.json"`, fixture `vajra`, button **"Vajra (Deva Astra, Legendary — strike clip)"**. All 42 existing fixtures regenerate byte-identical.

## LAB-20: Sudarshana Chakra — the first two-clip effect chain

Sudarshana Chakra (Deva Astra, **Mythic**) extends the LAB-19 template: the same E1 budget line and the same additive stage, plus the first **chained** effect. An invocation clip at the cast hands off to a strike clip timed to the Hero's bite. None of the 21 actors or the live game's Sudarshana effect is touched.

### What the engine and the game actually do (the STEP-0 corrections)

- **Sudarshana is a removal, not a kill.** "Remove one enemy Hero for this round. It returns next round at half power." The engine emits `play`, then `passive` "Sudarshana" "removed" on the Hero; the Hero leaves its row and **does not reach the discard**. There is no destroy beat to land on.
- **The impact is the bite.** The game's removal beat throws a disc **from the caster's half centre**, flies 380 ms, **bites** (screen shake plus a 100 ms hit-stop), lifts the Hero away cleanly (320 ms fade, no crack), then names the deed at the empty slot. **The bite is silent.**
- **An Astra has no cast callout**: it is never on the board. The only cast-time anchor is the throw origin, the caster's half centre.
- **Mythic uses exactly Legendary's beats** (the spectacle tier: 110 ms hit-stop plus 1000 ms hold).

**M57** reads every one of those numbers and code paths from the game's source.

### The rulings

1. **The strike's impact is f053, the ring-snap: the ring-snap IS the bite.** A removal seizes, and the burst is aftermath. It lands exactly on the bite at both speeds, and the chain costs 0 ms of wire clock. **Recorded honestly:** f053 is the first frame where the ring closes as a full band around the disc. The window's single largest picture change is one frame later, on **f054** (13.58 against 13.05). The frame is therefore *named* by the ruling rather than measured, and the manifest records the window as measured.
2. **Strike portion f034–f088.** The **f090+ red-contour phase is excluded: a reshoot candidate.** Rendered through the game's bake and `lighter` blend over the real board, the burst from f090 carries a hard, saturated red contour with a thin dark inner line and a nearly flat-filled interior. It reads as a **sticker contour, not light**. The trail's thinner red rim reads as a flame edge, and the rays around f080 read correctly. The portion extends if the owner regenerates the ending.
3. **Invocation f083–f098 at 448**: the last spin revolutions into the tilt-flat throw (from f099 the late phase runs off the left edge).
   - **Anchor:** the caster's half centre, the game's own throw origin.
   - **Scale:** disc ≈ 2.0 card widths.
   - **Fades:** in over 3 cells, out over 4 (it hands off; it doesn't end).
   - **Feathers:** bottom 48 px (the rim touches it in 7 of 16 frames), sides 32 px.
   - **Speed:** plays at both speeds.
4. **E1 unchanged, sequential.** The invocation decodes at the cast and is released at the 908 ms handoff; then the strike (288 px cells, 13.98 MB) decodes. The per-play fallback amendment is recorded as available but unused. **The strike is at 92% of native:** at the ruled scale its crop box draws 312 device px wide on a DPR-2 phone, and 320 px cells would pack to 18.5 MB, past the cap.
5. **No target: nothing plays**, the invocation included. This matches the game (no sprite without a removal event) and the F65 doctrine.
6. **The arrival rule and the impact pin.**
   - **Arrival:** the source disc arrives from its left. The rule is a **horizontal mirror only** (no rotation, the actors-upright analogue), so the disc always arrives from the board's horizontal centre.
   - **Impact pin:** the bite's frame always draws the impact cell. It applies to both effects and is **retro-applied to Vajra** (see the self-audit below).
7. **Sound: the contract is kept.** `sfx_astra` plays at the cast, and the bite is silent (the game's own removal has no bite sound). The bite cue joins the bespoke-sound wishlist (LAB-5's Sound section).
8. **The fixture's bystander is Vibhishana**, not Bana Asura, whose arms multiply on any Astra. The removal is asserted from the passive event, the log line, the untouched discard and the Hero row. The snapshot format is untouched and all 42 earlier fixtures are byte-identical.

### The chain's timing (the game's beats × speed × CHOREO_SPEED 1.3)

| | Normal | Fast |
|---|---|---|
| cast (`sfx_astra`) | 0 | 0 |
| invocation starts | 41 ms | 25 ms |
| **handoff**: invocation released, strike decodes and starts | **908 ms** | **545 ms** |
| resolution beat starts (the game's throw) | 1443 ms | 866 ms |
| **strike ring-snap f053 = the bite** | **1937 ms** | **1162 ms** |
| the Hero's removal exit | 2067 ms | 1240 ms |
| callout "Sudarshana Chakra" | 2457 ms | 1474 ms |
| board on AFTER | 2639 ms | 1583 ms |
| strike ends, not awaited | 3887 ms | 2332 ms |
| **wire-clock cost** | **0 ms** | **0 ms** |

There is no dead time and no overlap at the handoff, by construction: the invocation's last cell ends exactly where the strike's first begins.

### The packs

| clip | cells | cellPx | cell | atlas | decoded |
|---|---|---|---|---|---|
| invocation f083–f098 | 16 | 448 | 448×253 | 4052×512 · 217 KB | **7.91 MB** |
| strike f034–f088 | 55 | 288 | 288×223 | 4062×902 · 659 KB | **13.98 MB** |

- **The strike disc never moves**: its core stays at (989, 518) within 5.4 px. The trail tells the flight.
- **Strike feathers:** top and bottom 64 px under a **disc-body guard** (the disc's rows 265–828, measured on f050 where it stands alone): 265 px of room above, 251 px below. The rays touch the top in 11 and the bottom in 12 of 55 frames; the sides never.
- **Strike fade tail:** f079–f088, mandatory.

### The handoff, measured

- **Desktop, decode and bake alone** (5 runs on an 18 MB atlas): 51–60 ms, with the longest frame gap 22–28 ms.
- **Live chain in the lab** (7 runs): the strike became ready **41–60 ms after its planned start**, with decode taking **60–101 ms** of wall time. That is about one Normal cell (54 ms). **In 5 of 7 runs the strike's first cell (f034, the first frame of the long trail) was not drawn.** The bite was never affected.
- **Phone:** the handoff check joins the owner's device backlog.

### The impact pin — and the self-audit that retro-applies it to Vajra

A timed clip draws the cell that is due. At Fast on a 30 Hz device a cell (32.5 ms) is shorter than a frame (33.3 ms), so a frame can straddle the impact cell and show the next one, exactly on the beat. **LAB-19's E2 checked Fast only at 60 Hz, so Vajra carried this latent gap.**

**E9** sweeps the frame grid's phase over a whole frame (33 offsets) at Fast, 30 Hz:

| | pin off | pin on |
|---|---|---|
| Vajra | missed on **1** offset | **0** |
| Sudarshana chain | missed on **1** offset | **0** |

The pin draws the impact cell on the beat's frame whatever the clock says.

### The fixture

`fixtures/sudarshana_seat0.json` / `_seat1.json`: the Asura seat sets Mahabali down, and the Deva seat casts Sudarshana Chakra, which is legal.

- **F68** asserts the removal. Falsifiable: it rejects the removal event gone, a **kill passed off as a removal** (the Hero in the discard), the Hero still on its row, and a log naming a destroy.
- **F69** drives the no-target case live (Vibhishana): not playable, "Sudarshana finds no Hero.", the Unit survives, and the chain's plan plays nothing. It rejects a run claiming legality, one carrying a removal event, and a plan that still plays the invocation.

### Registry

Key `sudarshana`: `"effect": "../effects/sudarshana/chain.json"`, button **"Sudarshana Chakra (Deva Astra, Mythic — invoke + strike chain)"**.

## LAB-20a: the effect chain fails open — beats never wait on a decode

**The defect.** On the owner's phone, on the live Pages page, Play Sudarshana did nothing at all: no `sfx_astra`, no clip, and Mahabali never left the row.

**The diagnosis.**
- **Pages was clean:** every file 200 and byte-identical to f95e701, and the stamp current.
- **Reduced mode was not the cause:** it isn't device-chosen, and it never gated the beats.
- **Chrome's phone emulation on the live URL played both effects fully**, with no errors.
- **The mechanism proven in the code:** the effect player fetched and decoded the first clip **before its cast cue and before drawing the board**. Any failure or stall there meant exactly the reported no-show, and the error went only to the readout's Errors row, far below the board on a phone.

The phone's own root cause is still unconfirmed. The `?diag=1` breadcrumb exists to name it.

### The fix (owner ruling: all six parts)

1. **Fail open.** `play()` starts the timeline at once: the board is drawn and the cast cue fires at 0 ms, and every beat runs on schedule. Each clip decodes alongside. A clip that isn't ready, or failed, simply doesn't draw; a decode arriving after its segment is over is closed on arrival. This also removes the cold-start silence: **tap to cast sound is now 8–23 ms** (it was about 1.4 s). E1 is unchanged.
2. **A draw error.**
   - The ruling said the draw-error handler lands the board on AFTER, as Skip does. **Reading applied:** a *draw* error drops only the decoration, and the beats run on to AFTER on schedule, so the removal and callout still happen.
   - A *beat* that throws gets the literal Skip behaviour (AFTER at once).
   - Before the fix, a draw error ended the play without landing AFTER at all.
3. **Errors are seen on a device.** `report()` logs to the console **and** shows a short banner on the board.
4. **Loader fallback.** An `Image` element is used when `createImageBitmap` is missing or fails, ported from the actor path. A missing 2D context is named in the error.
5. **`?diag=1`** prints every effect step on screen with timings: tap, prefetch, the play's plan, atlas fetch and bytes, decode (and through which API), bake, load ready or failed, handoff, first draw, the cues, finish.
6. **Prefetch.** Effect manifests are fetched at boot, and atlas bytes when the card enters the hand (the actor pattern). A failed fetch is not cached.

### Proven

- **E12, the fail-open matrix, Vajra and the chain, both seats:** the loader throws, the decode rejects, the decode never settles, every decode arrives 1.2 s late, and (chain only) the strike fails at the handoff.
  - **Result:** 18 of 18 runs still play `sfx_astra` at 0 ms, land the impact beat on schedule (Vajra: `sfx_unit_destroy` and the crack; the chain: the removal and the callout) and reach AFTER when the beat ends.
  - **Invariants:** never two atlases live. The late invocation is closed on arrival, and a draw error keeps the beats.
- **E13, the negative:** the f95e701 player, driven through the same harness, is a **total no-show** under a decode that never settles (0 sounds, no AFTER) and throws out of `play()` when the loader throws. E12's predicate rejects both. This reproduces the defect.
- **E14, the page pins:** console logging and the banner, `?diag=1`, the `Image` fallback, the named missing context, prefetch at hand and boot, the play never awaited on a decode, a missing manifest still landing AFTER, a failed fetch not cached, and **the boot chain still scheduling the tick** (below).
- **Live (localhost, before commit):**
  - **Forced total failure** (both `createImageBitmap` and the `Image` fallback refuse): cast sound at 23 ms; bite 1,942 ms, removal 2,074, callout 2,458, board on AFTER 2,642. The banner showed the error, and the breadcrumb named `createImageBitmap-failed` then `load-failed` for both clips.
  - **Normal runs:** Vajra impact on the destroy beat (1,451 ms Normal, 875 ms Fast); the chain's ring-snap on the bite (1,941–1,942 ms Normal, 1,166 ms Fast).

### Found by live verification, before commit

Adding the boot-time manifest fetch, a `//` comment was written into the middle of the single-line boot chain. It commented out the step that starts the lab clock, so **nothing on the page would have animated at all**. The syntax check and the whole suite passed; only the live browser run caught it. It is fixed, and **E14 now pins that the boot chain schedules the tick**: the pin fails on the broken line and passes on the fixed one.

### The handoff, measured truthfully

The earlier handoff counter measured when the strike's decode *resolved*, and the first draw lands a frame later. The log now records `firstDrawnCell`. Live, the chain's strike first draws **cell 1: f034, the first frame of the trail, is lost at the handoff**. The bite is unaffected.

### Standing process fix (owner ruling)

**From this rung on, live verification runs against the public Pages URL** (`https://sangbaran-purr.github.io/divya-yuddha/lab/vfx-manifestation/`), not localhost. Pages serves a commit only after it is pushed. So a rung is checked locally before its commit, and the Pages verification runs right after the push and is reported then.

## LAB-20b: the chakra travels — the effect rotation rule

**The owner's ruling on the shipped chain:** the flight was missing. The disc invoked at the caster's half centre and then *appeared* at the target, while its trail implied motion the board never showed. The strike layer now travels the game's own throw path during the clip's trail.

### The rule (recorded in the strike manifest)

> **Actors never rotate (the upright law stands). A directional effect may rotate its layer to align its motion feature with its board path: the rotation is taken from the actual caster-to-target vector, applies only while the feature is in motion, and eases back to the clip's authored orientation before its impact frame. An effect's authored orientation is kept at its impact.**

**Why the rotation eases back rather than holds:** the disc is a perspective ellipse (axis ratio 0.78, major axis at 8°), and so are its ring-snap and burst. Held at ±90°, they would read as tall, narrow ellipses, and the rotated burst would lose about 23 px to the board edge (6 px upright). **LAB-20's arrive-from-centre mirror is retired.**

### The path, the curve, the scale

- **Path:** from the caster's half centre (the invocation's own anchor, so the disc hands off in place) to the target card's centre, **arriving at f046**, the first frame with no trail left.
- **Curve:** the trail's length per frame (f034–f045: 167, 150, 133, 117, 98, 80, 63, 46, 33, 22, 8, 2 px) *is* the disc's speed. Integrated and normalised, it is the manifest's travel table, linearly interpolated. **easeOutQuad** is the named fallback (rms 0.041 off the table).
- **Starts on the first drawn strike cell:** a slow decode shortens the flight and never jumps it. Arrival is fixed at f046.
- **Scale:** eases from **1.6522** (the invocation disc's 2.0 card widths over the strike disc's 1.211) to 1.0 on the same curve, so the disc recedes as it flies.
- **Rotation:** set from the vector while travelling, then eased back to 0 on the same curve over the parked cells f046–f052, **upright on the impact cell f053**.

| | Normal | Fast |
|---|---|---|
| planned flight (f034 → f046) | 908 → 1,558 ms (650 ms) | 545 → 935 ms (390 ms) |
| the game sprite's own flight (380 ms × speed) | 494 ms | 296 ms |
| **bite (ring-snap f053)** | **1,937 ms, unchanged** | **1,162 ms, unchanged** |

### The six measured cases (phone board, 375 px)

| caster | target slot | vector | rotation |
|---|---|---|---|
| seat 0 (lower half, 178,315) | left (106,55) | (−72, −260) | **−105.5°** |
| seat 0 | centre (178,55) | (0, −260) | **−90°** |
| seat 0 | right (250,55) | (72, −260) | **−74.5°** |
| seat 1 (upper half, 178,105) | left (106,365) | (−72, 260) | **+105.5°** |
| seat 1 | centre (178,365) | (0, 260) | **+90°** |
| seat 1 | right (250,365) | (72, 260) | **+74.5°** |

The shortest path is the centre slot, 260 px; no enemy Hero sits closer to the caster's half centre.

### Proven

- **M58, rewritten:** the rule text, all six angles within ±0.5°, the table recomputed from the recorded trail lengths, arrival at f046, the parked cells, the scale ratio, and the mirror retired.
- **E11, rewritten:** per-draw rotation on the stage for all six cases. Travelling draws follow the vector, parked draws only shrink, and the impact cell and everything after it draw upright. The invocation never rotates.
- **E15:** 8 runs (both seats, Full and Fast, 60 and 30 Hz). The layer sits on the anchor at its first drawn cell, on the table (±1 px) and never backing up, at the target from f046 (±0.5 px), with scale 1.6522 → 1.0. The impact frame is the bite.
  - **Falsifiable:** it catches a doctored parked player and a linear ease.
- **E15b:** a strike decode 70 ms late still departs from the anchor and arrives by f046, and so does E12's 1.2 s-late decode.
  - **Falsifiable:** a flight clock started at the planned start (the lost-f034 jump) is caught; the disc would first appear 64 px along the path.
- **E7, E8 and E9 pass unchanged.**

### Live (localhost, phone viewport; Pages after the push)

| run | first drawn cell | at the anchor | arrives | flight | impact / bite | impact rotation |
|---|---|---|---|---|---|---|
| seat 0 Full | f035 at 983 ms | (177.5, 314.8), −90°, ×1.652 | (177.5, 55) at 1,558, ×1.0 | 575 ms | 1,941 / 1,941 | 0° |
| seat 0 Fast | f036 at 617 ms | (177.5, 314.8), −90°, ×1.652 | (177.5, 55) at 935, ×1.0 | 317 ms | 1,167 / 1,167 | 0° |
| seat 1 Full | f035 at 968 ms | (177.5, 105.3), +90°, ×1.652 | (177.5, 365) at 1,558, ×1.0 | 590 ms | 1,942 / 1,942 | 0° |
| seat 1 Fast | f036 at 615 ms | (177.5, 105.3), +90°, ×1.652 | (177.5, 365) at 935, ×1.0 | 319 ms | 1,166 / 1,166 | 0° |

- **Parked ease-back** (seat 1): 89.7° → 60.8 → 37.6 → 20.3 → 9.1 → 2.6 → 0.2°.
- **Shortened flights:** the strike's first cell or two are lost at the handoff, so each flight is shorter than planned. It still starts on the anchor, as the rule intends.

### The Pages verification (the standing process fix, run against the public URL)

Pages served the LAB-20b stamp `030cdb11322e` about 280 s after the push. The check ran on
`https://sangbaran-purr.github.io/divya-yuddha/lab/vfx-manifestation/` at a 375 px phone viewport, four combinations:

| | seat 0 Full | seat 0 Fast | seat 1 Full | seat 1 Fast |
|---|---|---|---|---|
| departs (caster half centre) | 178,315 | 178,315 | 178,105 | 178,105 |
| arrives (target card centre) | 178,55 | 178,55 | 178,365 | 178,365 |
| vector angle | −90.0° | −90.0° | +90.0° | +90.0° |
| first drawn cell / scale | 0 · ×1.652 | 1 · ×1.652 | 0 · ×1.652 | 2 · ×1.652 |
| arrival cell / scale | 12 (f046) · ×1.000 | 12 · ×1.000 | 12 · ×1.000 | 12 · ×1.000 |
| arrival at (planned) | 1559 (1558) | 942 (935) | 1558 (1558) | 942 (935) |
| rotation at impact cell 19 (f053) | 0.0° | 0.0° | 0.0° | 0.0° |
| bite: impact drawn / destroy cue | 1941 / 1941 | 1167 / 1167 | 1941 / 1941 | 1167 / 1167 |

Every ruling reads true on the phone: the layer leaves the caster's half centre on its first drawn cell at ×1.652, flies the
260 px path on the caster→target vector, is at the target centre at ×1.0 by f046, eases its rotation back to the authored
orientation by `rotationZeroAt` (1937 / 1162 ms) — ahead of the bite — and the impact cell draws on the bite's own frame.

**`impactPinned: false` in all four.** The cell landed on the beat unaided; the pin stayed a safety net.

Two honest flags. **Fast loses leading strike cells at the handoff** — seat 0 drew 54 of 55 (first drawn cell 1), seat 1 drew 53
(first drawn cell 2), decode 63–86 ms against a 545–551 ms handoff; Full lost none. The flight is whole either way, because
travel starts on the first *drawn* cell; what is lost is a frame or two of the disc's longest trail. And **one page 404 that is
not ours and not new:** `runtime/assets/vfx/game/vfx_ring_1.png`, the copied game runtime's GPU init asking for the hero-moment
kit the lab deliberately does not carry — already documented above as a known caught request.

## LAB-21: Brahmastra and Pashupatastra — the Mythic shelf closes

Two single-strike clips of a new class, and the first premium effect off the Deva shelf. Both are 1916×1080, 24 fps, 121 frames
of black-ground Kling footage whose content **fills the frame and crosses every edge in every frame** — no internal build, no
ending. That one property drives everything below.

### What each card actually is (read from the engine, not assumed)

| | **Brahmastra** | **Pashupatastra** |
|---|---|---|
| id / faction | `brahmastra` / Deva | `pashupata` / **Asura** |
| class | **destroy**, not `dmgAstra` | **damage**, `dmgAstra:true` |
| resolution | `destroyUnit` per enemy Unit | `max(1, floor(your board power / enemy Units))` to each |
| Hiranyakashipu | **dies** — excepted by name | **survives, floors at 1** with a `block` event |
| Patala realm | no effect | +1 per Unit |
| extra | — | Chaos Surge fires for the caster |
| cast sound | **`sfx_brahmastra`** — the game's only bespoke impact file | `sfx_astra` (+ coalesced `sfx_debuff`) |

**The anchor is the enemy half, not a card.** Both shipped game sprites (`sprBrahmastra`, `sprPashupatastra`) are BOARD-EFFECT
row plates anchored on the **caster's enemy half centre** at `half.width × 1.04`. The clips keep that anchor, which needed a
third placement in the player beside the chain's `caster-half` and the strike's `target-card`: `enemy-half`, resolved as
`halfOf(1 − casterSeat)`. The card width still sets the scale; the half only sets the centre.

**Neither has a flight**, so the contract's `flightMs` is 0 and the impact falls exactly at the end of the cast hold —
`110 + 1000` scaled — which is the instant the first resolution beat opens. That is the cue each clip's impact cell is pinned to.

### The fringe check, taken first

Rendered through the shipping math — `lighter` over a baked source is `dst + rgb·max(rgb)/255` — over the real board.

**Brahmastra's red arm contour PASSES.** It is real (0.44% of frame early, 2.39% at f066) and it is in the clip, but it fails
every limb of the LAB-20 sticker test: it sits on the **bright** side of the gradient (luma ~46 under the red, ~85 six px
inward, dark-gap share only 2.3–8.1%, so **no thin dark inner line**), the interior is richly structured rather than flat, and
the band is 1.9–4.7 px median native against a **5.18× downscale**. This is LAB-20's accepted "flame edge", not its rejected
"sticker contour". Two corrections to the STEP-0 brief: the red is worst **mid-clip (f042–f078), not early**, and it never
fully clears.

**Both late phases FAIL, and both are reshoot candidates.**

- Brahmastra: what looked like yellow-green is **vivid pure yellow** (~60°) in hard-edged posterized blocks along ragged black
  tears — absent until f077, then 630 px at f084, 3,956 px with 3 blocks ≥200 px at f090, 53,556 px (2.59% of frame) with 51
  blocks at f120, with tear voids rising to 0.65% and grain from its 2.41 minimum at f078. **Onset f093, clean to f088.**
  The portion ends at f090. **The lost second of plate life returns only with a regenerated ending:** the shipped sprite lives
  3.25 s at Normal and this clip lives 2.17 s, and the gap is exactly the defective frames.
- Pashupatastra: the columns break into **beaded dark voids with dark rims** — 0.03% at f072, 0.15% and 6 blobs at f078, 0.72%
  and 29 blobs at f119, grain 4.3 → 8.1, violet edge fringing 1,762 px at f120. **Onset f079**; the portion is bounded at f076
  and ends at f059.

Its orange spark accents pass (≈0.1% of content; most of the warmth in a composite is the board's own lamps). The milky-veil
index — mid-alpha, low-chroma — is near zero for both (0.01% / 0.09% mean, saturation 0.62–0.73), which is *why* the numeric
veil test alone would have missed these: both failures are structural (voids, posterized blocks), not translucency.

### The two clips as packed

| | Brahmastra | Pashupatastra |
|---|---|---|
| portion | f051–f090, 40 cells | f000–f059, 60 cells |
| impact | cell 24 = f075, the **biggest escalation step** (steepest 3-frame rise in added light, +13.1) | cell 24 = f024, **positional** (S1: the clip starts at the beat) |
| fade-in head / tail | 4 cells / 10 (f081–f090) | 4 cells / 10 (f050–f059) |
| cellPx | 416 | **352** — the ruled number; the pre-authorized 320 was not needed |
| atlas | 3764×1182, 871 KB webp, **16.97 MB** decoded | 3896×1202, 893 KB webp, **17.86 MB** decoded |
| E1 | 18.00 MB cap — both inside; the packer refuses any pack past it | |

**Pashupatastra is not a continuous escalation.** Its added light is flat (33.2 → 43.1 peak → 35.6; steepest 3-frame rise only
+2.5), so there is no escalation step to pin and the manifest says `"rule": "positional"` in as many words. The pin's job on
this card is alignment, not drama — the columns are already landed when the beat arrives.

### The all-edge vignette, and its guard

Content crosses all four edges on every kept frame (Brahmastra 40/40 on each edge; Pashupatastra 37/60/43/39), so all four
bands are real — not the Vajra class's top-and-bottom. The guard is the LAB-19 law, re-aimed at each clip's **core body**:

| | top | bottom | left | right | guarded on | grows into the band on |
|---|---|---|---|---|---|---|
| Brahmastra | 48 | 64 | 96 | 96 | the mandala ring, read off the beams | **left: f087–f090** |
| Pashupatastra | 12 | 96 | 96 | 128 | the vortex body | **top: f056–f059 · left: f051** |

Every named frame lies inside the fade tail (from f081 and f050), and the packer **refuses** a pack whose band reaches the body
outside the tail. Clear margins: Brahmastra 59/84/0/142 px, Pashupatastra 0/432/0/153 px.

**Pashupatastra's 12 px top band is a token, and it is a positional dependency.** The vortex rim runs within 16 px of the top
edge at f026 — mid-portion, beside the impact — so a real top band would scissor it. It is accepted *only* because at this
scale the plate's top edge sits flush with the half boundary, where the hard cut is hidden by the board's own edge. **If the
anchor or the scale ever changes, this must be re-ruled.**

### The scale: 2.4 card widths is a default, not a law

Owner ruling LAB-21/3. The scale is per-clip **measured legibility** over the real board, and the two clips land in different
places because they add different amounts of light. Measured on the real vignetted atlases at the impact frame, over the
enemy half (bare median luma 68):

| plate | blown out (≥235) | half median luma |
|---|---|---|
| Brahmastra at the game's own 1.04 × half (369 px) | 40.8% | 217 |
| Brahmastra at 2.4 cw (330×186) | 31.6% | **170** |
| Brahmastra at **2.0 cw (275×155)** — shipped | 22.8% | **106** |
| Pashupatastra at **4.1 cw (352×198)** — shipped, ≈ the full half | **6.0%** | 89 |

**Brahmastra ships on the pre-authorized 2.0 cw fallback, and the reason is worth recording, because it was my error.** The
STEP-0 scale table priced the plate at 277 px and labelled it "2.4 cw" using a ring span of 1080 px — a measurement
contaminated by the clip's vertical beam. The packer's off-beam measure gives the ring **891 px**, under which 277 px *is*
2.0 cw. So the plate the ruling approved on the evidence and the number the ruling named had come apart; the evidence wins,
per ruling 3, and both figures are recorded in the manifest.

Pashupatastra goes the other way, to **4.1 cw = the full half width**, and earns it: its vortex is a dark-ground swirl, so at
full width it blows out 6.0% of the half where Brahmastra blows 31.6%.

### The ground, and a method note

The frame-filling class leaves **no region more than 300 px from any content**, so the Vajra-class reading ("the brightest
pixel far from content") is structurally unavailable and the manifests say so rather than reporting a hollow zero. The ground
is stated on the game's own bake metric instead: every kept frame keeps a true transparent floor (exact-zero share ≥ 7.10% and
≥ 30.11%) and the 1–4 pedestal a lifted veil would live in never exceeds 4.21% / 2.68%.

### The fixtures: the Hiranyakashipu mirror pair

One unit, one board truth, two opposite answers — both out of `isAstraImmune`:
`unit.id==='hiranya' && ASTRA_KILL.has(cause) && cause!=='Brahmastra'`.

- **Brahmastra** (Deva vs Asura): the Asura seat lays Hiranyakashipu(8), Ravana(12) and Vibhishana(4) down while the Deva seat
  builds Yama(6) and Marut(3); Brahmastra destroys **all three**, Hiranyakashipu included, all three to the discard, and both
  Deva Units stand at the same power.
- **Pashupatastra** (an **Asura mirror** — the only board where he can stand opposite an Asura caster): 17 board power against
  2 enemy Units splits to **8 each**; Vibhishana dies and Hiranyakashipu **survives at power 1** with
  `block/Pashupatastra "Hiranyakashipu floors at 1"`. Chaos Surge's toast and buff ride the same action.

"Overrides all shields" is asserted **structurally** rather than staged: Brahmastra's legality gate asks only whether an enemy
Unit exists and its resolution iterates `opp.units` directly, so `astraProtected` appears in neither — while Gandiva's gate
right beside it does filter on it. A Dharma Shield is the Deva passive and cannot sit on the Asura row this fixture needs.

**The no-target negatives** (F65/F69 doctrine): on an empty enemy row neither Astra is playable, and a forced cast emits only
the play, so the plan raises no segment and no clip. One honest asymmetry surfaced: Pashupatastra logs "Pashupatastra finds no
target." while **Brahmastra's branch logs unconditionally** — a forced cast on an empty row still announces "BRAHMASTRA. The
earth remembers, and trembles." and destroys nothing. The plan plays nothing either way.

### Timings, verified

| | clip start | impact = first resolution cue | clip end | one beat ends | wire-clock cost |
|---|---|---|---|---|---|
| Brahmastra Full | 143 ms | **1443 ms** (first destroy) | 2310 ms | 2275 ms | **0** |
| Brahmastra Fast | 86 ms | **866 ms** | 1386 ms | 1365 ms | **0** |
| Pashupatastra Full | 143 ms | **1443 ms** (first damage) | 3393 ms | 2275 ms | **0** |
| Pashupatastra Fast | 86 ms | **866 ms** | 2036 ms | 1365 ms | **0** |

Because the lead and the beat both scale with `vfxT`, **one design satisfies both speeds** — which is exactly why the impact
index had to be 24 or under. At index 34 the clip would have to start 399 ms before the cast, and the wire would wait.

At a 30 Hz clock: **Full draws every cell at every phase**; **Fast drops one** (frame 32.5 ms against a 33.3 ms sample), and at
**5 of 200 clock phases (2.5%)** the dropped cell is the impact one — which is what the impact pin is for. Driven at 30 Hz Fast
on both seats, both cards draw the impact cell on the cue.

### What is still open

- **Both endings are reshoot candidates.** Brahmastra's f091–f120 (vivid-yellow posterized blocks on ragged tears) and
  Pashupatastra's f079+ (beaded dark voids with dark rims, violet fringing). Brahmastra's would also return the second of plate
  life the trim costs.
- **Pashupatastra's token top band** stands on the plate being flush with the half boundary — re-rule it if the anchor or scale
  moves.

## EXPORT-1: the premium effects enter the live game — the lab's side

The three certified effects (Vajra, Sudarshana Chakra's travelling chain, Pashupatastra) were **copied** into the live game — the
player module inlined verbatim into `index.html`, the atlases and manifests into `assets/manifest/effects/`, routing as data in
`assets/manifest/registry.json`. Nothing moved out of the lab, and the lab still plays all of them. Brahmastra's LAB-21 clip stays
here, unexported; Meghnad stays the lab's pilot and reference (the grandfather clause is scoped to the lab, docs X2).

Four lab anchors moved with the export, none of them hand-edited around a failure:

- **G1** re-anchors to each ruled export commit (owner ruling 6, no allowlist): the experiment rule now reads "no change outside
  `lab/` since the last `EXPORT-<n>:` commit". Before that commit exists it still reads from `e2f4c19`, and reports exactly the
  export's own out-of-lab file.
- **R1**: `tools/copy_runtime.js` re-run. The game's VFX module moved to `index.html:9211–9946` (lines inserted above it) with its
  body **byte-identical** (sha256 `96ab5284…` unchanged) — 0 lines of drift.
- **STAMP** regenerated.
- **M52** — not in the ruling's list, reported: it pins the game's exact Vajra destroy-beat line, and the export's ruled sprite gate
  (`&& !fxOwnsMoment('vajra')`, ruling 7) changed that line. Its pin moved to the gated form; every contract number it reads from the
  game's source (hit-stop 110, hold 700 + 300, crack 40, dwell 600, CHOREO_SPEED 1.3) is unchanged and still read.

The live game carries its own suite for the export, `src/test_manifest.js` (30 checks), which never references this lab.

## LAB-22: Brahmastra rebuilt — the descent and the bloom

The owner's regenerated clip (`sources/brahmastra/brahmastra_v2_black.mp4`, sha256 `1b7b192c2158…`, 1916×1080, 24 fps, 121 frames,
true black: exact-zero share ≥ 29.6% of every frame, the 1–4 pedestal ≤ 2.03%) replaces the LAB-21 reject. The v1 source stays on disk
and the v1 pack stays in git at `c0b57ee`; the packer keeps its recipe on record as `brahmastra_v1`.

### The arc, measured (and where the brief's estimates moved)

| phase | frames | how it was read |
|---|---|---|
| the fall | f000–f014 | the orb is already mid-fall at f000 (the cone enters from the top edge) and drops a steady ~10.5 px/frame |
| **the landing** | **f029–f031** | the steepest 2-frame rise of the ground band's blow-out is **f030**; the orb merges into the disc at f027–f028 |
| the ground flash | peak f040 | 27.8% of the ground band blown out — there is **no** frame-wide white-out near f048 |
| the bloom | f058–f065 | the added-light rise is a **plateau**, not a step (f062 +5.88, f059 +5.80) |
| the aftermath | f069–f120 | the cloud keeps churning (mean frame change 6.44, the same as during the bloom) |

### v1's failure beside v2's pass — the test this rebuild existed for

The posterization measure was first **calibrated on v1**, where LAB-21 found the defect: vivid pure yellow (hue 50–70°, saturation and
value > 0.8) and its connected blocks ≥ 200 px. It reproduces LAB-21's record, then reads v2 the same way.

| frame | **v1** (LAB-21 reject) | LAB-21 recorded | **v2** |
|---|---|---|---|
| f084 | 320 px | 630 px | 215 px, 0 blocks |
| f090 | 3,754 px, 2 blocks | 3,956 px, 3 blocks | 225 px, 0 blocks |
| f102 | 22,400 px, 35 blocks | — | 203 px, 0 blocks |
| f120 | **52,301 px, 52 blocks** | **53,556 px, 51 blocks** | **628 px, 0 blocks** |

Across f060–f120 v2 never forms a block. At native resolution the late cloud is continuous volumetric fire; composited additively over
the real board it reads as fire, not blocks. The one late blemish, a hard-edged tear in the top-right corner at f120, lies after the portion.

### The fringe, per range

- **Red contours — PASS (LAB-20's flame edge).** The disc rim early (3.1% of the frame at f000) and the fire-skirt edge late (2.7–3.2% from
  f078): red on the darker side of the edge (luma ~62–74 under it, ~88–107 six px inward), dark-gap 0.2–1.1%, band 1.9–3.8 px native —
  about one device pixel at game scale. On the board it reads as a faint warm edge.
- **The disc-centre tears — handled by the portion.** Black voids with flat, saturated red lips inside the ring: **17,475 px at f000,
  1,595 by f014**, ~600 px of residue under the flash from f016. The portion starts at f004 (the timing forces it anyway), so the worst
  frames are gone and the rest fall inside the 4-cell fade-in and the cast hold, where they read as a small crater slit.
- **The yellow-green speck — out of the portion.** Posterized speckle along the tears' upper edge: 3,293 px at **f000 only** (130 px at
  f001, then under 300 px of near-white tint). The portion starts after it.

### The pack

| | v1 (LAB-21, reject) | **v2 (LAB-22)** |
|---|---|---|
| portion | f051–f090, 40 cells | **f004–f084, 81 cells** |
| impact | cell 24 = f075, escalation step | **cell 26 = f030, the LANDING** |
| cellPx / atlas | 416 · 3764×1182 · 16.97 MB | **288 · 4062×986 · 15.28 MB** (858 KB webp) |
| vignette (top/bottom/left/right) | 48 / 64 / 96 / 96 on the ring | **0 / 64 / 128 / 128 on the column** |
| anchor | core point on the enemy half's centre | **top-flush on the enemy half** |
| scale | ring = 2.0 card widths | **0.93 of the enemy half** |

**The impact is the landing (owner ruling 1).** The units die as the orb meets the disc; the bloom is their absence — the Sudarshana
precedent, where the seizure is the kill and the spectacle is aftermath. The detonation could not be the impact: the index budget is 26
cells (the cast hold divided by the native frame time, at every speed), and the bloom sits 58 frames in, so pinning it would start the clip
1.7 s *before* the play. The impact rule is new (`landing`) and measured in the packer, which refuses a disagreement with the ruled frame.

**cellPx 288 (ruling 2).** The full aftermath outranks sharpness: volumetric fire forgives softness, and the churn is the rebuild's payoff.

**Timings (verified in the lab page):** clip starts 35 ms after the play, impact on the first destroy at **1443 ms** Full / **866 ms**
Fast, the bloom at 2.96–3.34 s, clip end 4422 ms Full / 2653 ms Fast. **Wire-clock cost 0** at both speeds.

### The vignette, and the top-flush dependency

The core is the beam, the column, the cap and ground zero (ruling 5); the **fire skirt is fringe** and fades into the bands. The packer's
new `column` guard reads two bodies per frame — the upper body (rows 0–760 ≥ 150, closed, nearest the centre) and ground zero (rows
700–1080 ≥ 235) — and no band reaches either, anywhere in the portion: clear margins bottom 76 px, left 142, right 251.

**The top band is 0, and that is a positional dependency (ruling 4).** The beam, then the cloud's crown, touches the top edge on **all 81**
kept frames, so the LAB-19 law allows no top band. The cut is hidden by placement instead: the plate's **top sits flush with the enemy
half's top edge**, horizontally centred, so the beam falls in from beyond the field. No sky-fade (it would dim the crown). A new player
placement, `enemy-half-top`, does this; a half that reports no top edge plays no clip (fail-open). **If the anchor or the scale ever
changes, this must be re-ruled** — the same standing note as Pashupatastra's token top band.

### The scale is a fraction of the enemy half — the units lesson

STEP-0 priced this plate as "2.4 cw" and the ruling approved it on the measured legibility — but the multiplier was read off LAB-21's
table, where "cw" measured the **ring** in card widths, not the plate. Built literally, "2.4 cw" of plate width is 173 px at the game's
72 px cards: half the footprint of the classic 1.04 × half sprite, and not the plate the evidence was measured on. **Owner ruling
LAB-22/3 (permanent): effect scale is recorded as a FRACTION OF THE ENEMY HALF; card widths are derived commentary only.** The player sizes
a `halfFraction` plate off the half's own width, so the plate stays 0.93 of the half on any layout.

Measured by the LAB-21 method — the game's board (`board_bg`, cover, no overlay), the real vignetted atlas — at the game's own 375 px
proportions (enemy half 373×229, 72 px cards, bare median 66). The method re-measures LAB-21's own v1 pack at 22.9%/106 and 31.6%/168
against its recorded 22.8%/106 and 31.6%/170.

| v2 at 0.93 of the half (347×195) | blown out | median |
|---|---|---|
| **f030, the impact** (LAB-21's measuring frame) | **14.2%** | **83** — inside LAB-21's accepted 22.8% / 106 |
| f062, the bloom | 24.9% | 95 |
| f069, the worst frame | 26.0% | 112 — under LAB-21's rejected 31.6% / 170 |
| f075, the fade tail begins | 24.1% | 118 |

The scales already on the shelf, re-expressed in the same terms (commentary only — no repacks). Card-width plates change their fraction
with the layout's card-to-half ratio; a half-fraction plate does not:

| plate | recorded as | LAB-21 frame (card 64, half 355) | game at 375 px (card 72, half 373) |
|---|---|---|---|
| Brahmastra v1 (LAB-21) | ring = 2.0 cw | 275 px = **0.78** of the half | 309 px = **0.83** |
| Pashupatastra | vortex span = 4.1 cw | 351 px = **0.99** | 395 px = **1.06** |
| **Brahmastra v2** | **0.93 of the half** | 330 px = **0.93** | 347 px = **0.93** |
| the classic `sprBrahmastra` | 1.04 × the half | 369 px | 388 px |

### The fixtures re-run

The LAB-21 Brahmastra fixtures carry over unchanged and pass against the v2 pack: F70 (the row wipe, both seats), F71/F77 (Hiranyakashipu
dies to Brahmastra by name), F72 (the caster untouched), F73 ("overrides all shields", structurally) and the no-target negatives (an empty
enemy row plays no segment and no clip). Re-pointed to v2: **M59** (the pack), **M61** (the column guard), **M62** (the ground — v2's early
corners make the Vajra-class reading available again, and it reads **max 1**, true black; the re-point also caught LAB-21's packer writing "structurally unavailable" unconditionally — Pashupatastra's manifest carries that stale note beside a measured 0, and is not repacked because EXPORT-1 ships it byte-identical), **M63** (the scale law), **E16/E19** (the
26-cell budget) and **E17** (81 cells, `enemy-half-top`, 0.93 of the half, top flush on both seats).

## EXPORT-4: the device matrix — the lab's side

The effect player (`lib/effectclip.js`) carries two new sizing laws, recorded in the manifests by the packer and replayed by **M64**
over the game's measured matrix (`src/device_matrix.json`, 16 screens):

- **The fitted law** (`scaleRule.heightCap`): a plate recorded as a fraction of the enemy half keeps that fraction of the half's
  WIDTH but is never taller than `heightCap` x the half's HEIGHT. Landscape halves are wide and short (998x230 on a 1280x800 laptop),
  so the width-only law hung Brahmastra 928x522 over a 230 px half; fitted, it is 408x230. No phone ever engages the clamp.
- **The card floor** (`scaleRule.cardFloorOfHalfH`, 0.294): a card-width clip treats its card as at least 0.294 x the half's height
  wide. Idle on the 360/375/390 phones (the value sits just under the narrowest card ratio there, the 390 px Hero card); it engages
  where the field outgrows the cards and lands Vajra's height near 0.84 of the half.

**Pashupatastra converts** to the fitted law at 1.047 of the half's width (its certified 375 px plate, 390.6 on the measured 373 px
half — the LAB-22 table's 1.06 came from a rounded 72 px card; the measured card is 71.1) and **hangs top-flush** like Brahmastra. Its
12 px token top band — the LAB-21 positional dependency, which held only while the centred plate happened to sit flush on a phone —
is **resolved by anchor**: the hard cut now hides at the half boundary on every screen.

All five effect atlases repack byte-identical; every impact cell is unchanged. The lab page's `halfOf` reports the half's height too.

## EXPORT-5: resilience — the lab's side

The effect player (`lib/effectclip.js`) gains an optional **beat gate** (`opts.beatGate`, `opts.beatCapMs`, default 1500) and one new
call, `beat()`. With the gate on, a clip that reaches its impact before the game's beat freezes on its pre-impact cell until `beat()`
is called, fires the impact then, and shifts the rest of its schedule by the lateness. Past the cap it finishes without drawing the
impact and calls `env.onBeatLateCap`. `draw()` now takes the plan clock (cells, pose) apart from the real clock (logs), so a held
clip logs honest times. Gate off, which is how the lab page plays, nothing changes: all 749 lab checks still pass, and every atlas
and manifest is byte-identical under the design freeze.

## LAB-24: Vasuki Venom Strike — one clip, two plates (height-fit)

**Owner rulings, verbatim.** 2026-09-19: "Proceed with Vasuki venom, lanka dahan goes for reshoot." Then, after the STEP-0 stop on the
all-edge vignette: "Let's try A; if it doesn't work, we go for a reshoot." Shape (c) is ruled (two plates from one clip), the spectral serpent
is admitted under the v4a carve-out (the serpent is the Astra's own weapon-source; its dark scale body reading see-through under additive is a
ghost serpent), and ruling A is HEIGHT-FIT. Lanka Dahan is out of this rung (reshoot). This rung ends at the owner's device pass, not a commit.

**The card, from the engine.** Vasuki Venom Strike (Naga, Legendary Astra) is flag-only: the cast sets `venomStrike = round` and emits `play`
and nothing else. Its payoff is the round-end Venom drain (`endRound` → `venomRoundEnd` → `venomPassive`): one `toast` ("Venom drains
<enemy>'s Units −N") then one `venom` event per drained Unit. The game holds 620 ms (× speed) after the toast before the first Unit drains.

- **The rise** — f000–f054, 55 cells at 288 (10.20 MB decoded, 706 KB). It ends the frame before the MEASURED strike onset f055 (the head
  turns, the jaws open; the drops leave their orbit from f060). An ARMING visual: it starts AT the cast on the CASTER's half, with no impact
  and no beat gate (S1, positional); the cast beat keeps its own settle. Sound unchanged: `sfx_astra`.
- **The flood** — f063–f120, 58 cells at 288 (12.74 MB, 883 KB). Its eruption f077 (cell 14, the steepest rise of the ground band's added
  light) is pinned to the empowered drain's FIRST `venom` beat, on the ENEMY half. The toast is the identifier: the striker's own drain
  (captured before the round-ending action — `endRound` wipes the flag), naming the enemy player, reading at least −3 (base 1 + the strike's
  +2). Fourteen lead cells start the clip 48 ms after the toast (fifteen would start it 6.5 ms before it): wire-clock cost 0. One flood per
  drain, whatever the Unit count. The head's wind-up f055–f062 is in neither plate. Sound unchanged: the game's own synth drain tick.
- **The truth table**, every row from the real engine (both seats): the flood plays on the empowered drain, on two Venom Strikes in one round
  (one flag, one drain), and on the round that ends the match (the drain precedes the match check); it does NOT play on an ordinary −1
  drain, on a Karkotaka round (the round-end drain is skipped there; only the flat −1 early tick fires, on the first pass), or with no enemy
  Units (no drain, no toast).
- **Height-fit (ruling A).** Each plate is authored as a HEIGHT FRACTION of its half — `scaleRule.heightFraction: 1.0`, `halfFraction`
  absent, the unit written out in the manifest (the LAB-22 near-miss). Bottom-flush, so the top and bottom cuts sit on the half's own borders
  on all 16 measured viewports: no top band and no bottom band — the serpent's head and eye-flare stay at full brightness, and the core-body
  guard holds by geometry, exactly as written.
- **The side fringe (LAB-22/5 precedent), its scope recorded:** on the 7 portrait viewports the plate is wider than its half and the overhang
  is drawn (the player draws on the field-wide layer and never clips to the half; on a phone part of the overhang passes the screen's own
  edge). The overhang's outer edges carry a 54 px side feather, declared ONLY for the sideways spill beyond the half's width (rise: empty
  dark margin; flood: the sideways venom splash). 54 source px is the narrowest overhang in the matrix (the 360 px phone, 54.64), so the
  feather's inner boundary lies outside the half on every portrait viewport; the serpent's body and head and the flood's central mass are
  never inside a feather zone. On the 9 landscape viewports the plate fits inside the half.
- **Budget.** 288 px cells draw at 2.6× (phones) to 5.3× (portrait tablets) and 6.3× (the 12.9-inch iPad Pro portrait). E1 holds: one
  plate decoded at a time (the rise is released before the flood decodes), beside the one A5 actor. A7: the two atlases, manifests and
  fixtures plus the card art add 2.03 MB.

The lab page carries both plates: **venomstrike** (the rise, from the cast fixture) and **venomstrike_flood** (the flood, from the
round-ending pass). The rise prefetches the flood's bytes when the card enters a hand; each decodes only at its own moment. Checks V1–V13,
each proven against a mutant.

## Notes for the next rungs

### LAB-2: the after-effect lands after the fizzle, from the board difference

The shipped game suppresses floating numbers while a play's animation runs (`index.html:8162–8171`, `spawnFloaters`: "choreography owns floaters while active"). The power tracker then absorbs the change at the next render. For Meghnad's strike, the Hero's −2 is carried by **no event**: the engine changes the Hero's power in place and only logs it.

So the manifestation's outcome must come from the board difference (`lib/boarddiff.js`, `fixture.diff.changed`), and it must land **after the fizzle**. The shipped floater path would drop it silently.

### Facts from STEP-0 the director must honour

- **Events for Meghnad's play, in engine order:** `play`, then (if it's the Asura side's first Chaos Surge of the round) `toast` "Chaos finds a way…" and `buff` +1 on a random own Unit. With Meghnad the only Asura Unit, that Unit is Meghnad.
- **No `lethal` for Heroes.** Hero power floors at 0 and the death sweep checks Units only.
- **No `shielded` for Heroes.** Dharma Shield covers Units only.
- **Ruling A1:** a single actor, nothing depicted on the target. The board shows the outcome.
