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

## Notes for the next rungs

### LAB-2: the after-effect lands after the fizzle, from the board difference

The shipped game suppresses floating numbers while a play's animation runs (`index.html:8162–8171`, `spawnFloaters`: "choreography owns floaters while active"). The power tracker then absorbs the change at the next render. For Meghnad's strike, the Hero's −2 is carried by **no event**: the engine changes the Hero's power in place and only logs it.

So the manifestation's outcome must come from the board difference (`lib/boarddiff.js`, `fixture.diff.changed`), and it must land **after the fizzle**. The shipped floater path would drop it silently.

### Facts from STEP-0 the director must honour

- **Events for Meghnad's play, in engine order:** `play`, then (if it's the Asura side's first Chaos Surge of the round) `toast` "Chaos finds a way…" and `buff` +1 on a random own Unit. With Meghnad the only Asura Unit, that Unit is Meghnad.
- **No `lethal` for Heroes.** Hero power floors at 0 and the death sweep checks Units only.
- **No `shielded` for Heroes.** Dharma Shield covers Units only.
- **Ruling A1:** a single actor, nothing depicted on the target. The board shows the outcome.
