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

## Notes for the next rungs

### LAB-2: the after-effect lands after the fizzle, from the board difference

The shipped game suppresses floating numbers while a play's animation runs (`index.html:8162–8171`, `spawnFloaters`: "choreography owns floaters while active"). The power tracker then absorbs the change at the next render. For Meghnad's strike, the Hero's −2 is carried by **no event**: the engine changes the Hero's power in place and only logs it.

So the manifestation's outcome must come from the board difference (`lib/boarddiff.js`, `fixture.diff.changed`), and it must land **after the fizzle**. The shipped floater path would drop it silently.

### Facts from STEP-0 the director must honour

- **Events for Meghnad's play, in engine order:** `play`, then (if it's the Asura side's first Chaos Surge of the round) `toast` "Chaos finds a way…" and `buff` +1 on a random own Unit. With Meghnad the only Asura Unit, that Unit is Meghnad.
- **No `lethal` for Heroes.** Hero power floors at 0 and the death sweep checks Units only.
- **No `shielded` for Heroes.** Dharma Shield covers Units only.
- **Ruling A1:** a single actor, nothing depicted on the target. The board shows the outcome.
