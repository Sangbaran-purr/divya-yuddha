# Arcade lab

The experiment ground for **ARCADE-1**: a real-time 1v1 fighting mode, player vs AI, in the browser. The rulings, the moveset template, the Kling clip card and the size budget are in `docs/ARCADE_v1.md`.

**Status:** R0–R2, the R3 clip test, the enhancement test, and the owner's rulings after it (2026-11-04): fx and the tight camera are the defaults, a 3-frame cross-fade at 12 fps, the 24/48 fps sheets dropped (they live only in git history), the moveset grown to **15** (knockdown + get-up, parry, throw) and a gentler Beginner. Three placeholder box Heroes plus **Indra and Meghnad**, whose idle and light are real art from the owner's Kling clips; every other move is a box, or, with fx, borrows their art.

## The lab law

- Everything lives in `lab/arcade/`. The one file outside it is the ruling doc, `docs/ARCADE_v1.md`.
- Nothing in the live game links to, imports from or loads this lab.
- The game's own suites stay at their exact counts on every lab commit (`test/game_counts.json`).
- Kling sources and matted frames are never committed (`.gitignore`). Only packed sheets are. Report the tracked total on every commit.

## Open it

- **On your machine:** start the repo's `static` server (`.claude/launch.json`, port 4599) and open `http://localhost:4599/lab/arcade/`.
- **Pages, public but unlinked:** `https://sangbaran-purr.github.io/divya-yuddha/lab/arcade/`.
- **The look is fx on + the tight camera by default** (owner ruling 1, 2026-11-04). The switches stay for comparison: **`?fx=0`** turns the feel layer off, **`?cam=wide`** the fixed camera; **`?fx=0&cam=wide`** is the exact R0–R2 picture. **`?demo=1`** plays the scripted Indra-vs-Meghnad bout on a loop. **`?perf=1`** shows the probe (`window.__arcPerf()` in the console), and **`?cpu=4`** stretches each frame's work 4× to stand in for a slow phone. Example: `…/lab/arcade/?demo=1`, or `…/lab/arcade/?demo=1&fx=0&cam=wide` for the old look.
- **Record a mode:** start `arcade-capture` (`.claude/launch.json`, port 4611) and open `http://localhost:4611/lab/arcade/?capture=<name>` (add `&fx=0&cam=wide` for the baseline). It writes `<name>.mp4` and `<name>.gif` to `~/Desktop/DY_arcade_screens/`; the frames go to `captures/`, which is ignored.
- **`?opp=meghnad,indra,box_rakta`** fixes the opponent's lineup (three different Heroes). **`?rung=lo`** or **`?rung=hi`** forces a sheet rung; by default it is hi on a high-density or large screen, else lo.

## Play

| | Keyboard | Touch (landscape) |
|---|---|---|
| Move | A / D or ← → | Left thumb anywhere on the left half: the stick appears under it |
| Jump | W or ↑ | Push the stick up |
| Crouch | S or ↓ | Push the stick down |
| Light | J | Light |
| Heavy | K | Heavy |
| Special (needs a full meter) | L | Special |
| Block | Shift, or hold away from the opponent | Block, or push the stick away |
| Parry | Tap Shift just before a hit lands (a fresh tap, at most once per 40 frames) | Tap Block just before a hit lands |
| Throw (close, beats a block) | J + K together | Light + Heavy together |
| Break a throw | J + K while being grabbed | Light + Heavy while being grabbed |
| Pause | P or Esc | II at the top |
| Show hurtboxes | H | — |

Heavy is a high attack: crouch under it. Light is a mid: block it. The zoner and balanced Heroes' special is a low shot: jump it. The rushdown's special is a charge. A special, a throw, or a heavy that finishes a combo knocks the opponent down; nothing touches a Hero who is down or getting up.

## What's here

| Path | What |
|---|---|
| `index.html` | The page (noindex, landscape, a rotate prompt in portrait). |
| `core/moves.js` | The shared moveset template (frame data, boxes, cancels, meter) and the archetype stat table. |
| `core/fight.js` | The fight core: one round, a fixed 60 Hz step, integer positions, inputs as bitmasks, JSON state (snapshot/restore for v2 rollback). No clock, no `Math.random`, no DOM. |
| `core/ai.js` | The AI: Beginner, Advanced, Death Match. It sees only `observe()` (what's on screen), through a reaction delay, and answers with the same bitmask a player makes. |
| `core/match.js` | The rounds stub: an ordered lineup of 3, round n is each side's n-th Hero, first to 2, a drawn round is fought again (at most twice). |
| `core/rng.js` | The seeded random source (mulberry32). A seed replays a whole match. |
| `ui/controls.js` | Keyboard and touch → bitmask (the floating stick's 8 sectors and dead zone, the four buttons). |
| `ui/scene.js` | Fight state → plain shapes (the boxes, the hitbox on active frames, the camera). |
| `ui/app.js`, `ui/app.css` | The page: setup, the fixed-step loop, the HUD, pause, the result. Pixi draws; a Canvas 2D floor draws if Pixi can't start. |
| `runtime/pixi.min.mjs` | The lab's own copy of the game's Pixi (`runtime/COPY.json` records where from and its sha256). |
| `tools/stamp.js` | The stamp: a hash of every loaded file, on every URL, so Pages never serves a stale lab. |
| `tools/make_fighter.py` | The fighter tool: Kling clips on green → a fighter (matte, feet pivot, one stance height, 12 fps frames, hi/lo sheets, mirror test) and contact sheets to `~/Desktop/DY_arcade_screens/`. Run it with the VFX lab's matting venv: `lab/vfx-manifestation/tools/.venv/bin/python -I lab/arcade/tools/make_fighter.py`. |
| `ui/present.js` | The presentation layer for the switches: sparks, flash, shake, dust, shadows, trail, cross-fade, the Vajra pillar. It only reads the fight, never changes it, and uses no randomness. |
| `ui/demo.js` | The demo bout: Indra vs Meghnad, scripted through inputs only, plus three stated nudges (full meter before each special, Indra's health lowered so it ends on a K.O.). |
| `tools/budget.js` | The graphics-memory projection (owner ruling 2): measured cells × the 15-move set + arena + effects against the caps; it decides whether 24 fps strike frames may ship. `node lab/arcade/tools/budget.js`. |
| `tools/capture_server.js`, `tools/assemble_capture.py` | The recorder: serves the repo, takes the page's frames, writes MP4 + GIF. |
| `effects/vajra/` | The Vajra clip, copied from the VFX lab (`runtime/COPY.json` records the source and its sha256). |
| `fighters/<hero>/` | A fighter: `hi.webp`, `lo.webp` and `manifest.json` (each cell's rect and feet pivot, the move → cell lists, the measurements). |
| `sources/<hero>/` | **Ignored.** The owner's Kling clips (`<hero>_NN_<move>.mp4`). Never committed. |
| `test/run.js` | The lab suite, R0–R2, the 15-move template and the gentler Beginner, the clip test, the enhancement test and the memory projection, with breakages. `--game` also runs the game's suites at their exact counts. |

## Change, stamp, test

```bash
node lab/arcade/tools/stamp.js          # after any change to core/, ui/ or runtime/
node lab/arcade/test/run.js --game      # before every commit
```
