# ARCADE v1 — the fighting mode (rulings, template, clip card, budget)

Owner's standing ruling (2026-10-29): Arcade mode is a real-time 1v1 fighting game (not turn-based). Pick 3 Heroes, best of three. 24 h recovery per Hero, sped up with free in-game coins. Chakravyuha stays a separate mode. On 3 Nov 2026 the owner asked for it to be built with proper fight animations, approved the ARCADE-1 plan and ruled as below.

This is the one file of the arcade work outside `lab/`. The build lives in `lab/arcade/` under the lab law (its README).

## Rulings (owner, 2026-11-03)

1. **Shape.** v1 is player vs AI, in the browser. v2 is player vs player; the deterministic core is kept rollback-ready for it. **No DYC anywhere.** DYC is never a reward for winning.
2. **Slice.** Meghnad **on foot** vs Indra, in a Swarga / Amaravati arena.
3. **Non-humanoid Heroes are out of the v1 roster** (option c). They get their own archetypes later. The classification of all 21 is below.
4. **Lineup.** Each side picks an ordered lineup of 3 Heroes. Round n is each side's n-th Hero. First to 2 rounds wins.
5. **Recovery.** Every Hero that fought recovers for 24 h. An unused third Hero does not. Skipping costs 2 coins per remaining hour; an arcade match earns 5 coins. All tunable constants.
6. **Landscape only**, with a rotate prompt in portrait. The owner names the reference phone before R7.
7. **The size budget** (below) is accepted.
8. **Stats come from a shared archetype table**, not from card power.
9. **This doc** is the only file outside `lab/`.
10. **The player counter's `'arcade'` finish is added at export only**, not now. It needs a site `count.js` change plus a dy-count change and redeploy; today neither accepts `'arcade'`.
11. **Kling:** only Indra and Meghnad clips for now (about 36). The rest is decided after the R7 device verdict.

### Rulings, second set (owner, 2026-11-03, the clip test)

1. **Stance stills:** the owner's approved v2 stills are the step-0 anchors (record below). They are not committed anywhere outside `lab/`, and not in `lab/` either (the clip law).
2. **Meghnad's weapon: the spear.**
3. **The v1 roster is the 13 humanoid Heroes,** confirmed. Nagas, Garuda, Rahu and Vritra are out of v1. Mahabali needs standing clips.
4. **Archetypes:** Indra = **all-rounder**; Meghnad = **reach** (the longest reach, slightly slower recovery). The others are ruled as their clips arrive.
5. **AI difficulty and round length: no change yet;** the owner plays first. **Open:** Beginner is likely to become gentler; the target round length is 30–45 s (box rounds run about 10 s today).
6. **The draw rule stands as built** (a drawn round is fought again at most twice, then goes to the larger health share).
7. **`src/test_puzzlemode.js`** was fixed separately, outside the lab, in its own commit (TEST-PUZZLEMODE-1): its loading table now follows the live puzzle list.

### The stance stills in use (ruling 1 of the second set)

| Hero | File (owner's Downloads) | Size | sha256 (first 16) | Clips shot from it |
|---|---|---|---|---|
| Indra | `indra-fighter-right-green-1920x1080-v2.png` | 1920×1080 | `ad70b7c1228e2309` | `indra_01_idle`, `indra_06_light` |
| Meghnad | `meghnad-fighter-right-green-1920x1080-v2.png` | 1920×1080 | `a1dafedcfd6e489c` | `meghnad_01_idle`, `meghnad_06_light` |

They replace the earlier neutral identity masters in `assets/arcade/identity-masters/` as the anchors. Both show a fighting stance with the weapon in hand, true side profile, facing right, on green.

## The 21 Hero actors, classified (ruling 3)

Checked against each actor pack in `lab/vfx-manifestation/actors/`. A v1 fighter must be able to stand, walk, crouch and jump in side profile.

| Hero | Faction | Body in the actor pack | v1 roster |
|---|---|---|---|
| Agni | Deva | Humanoid, on foot (staff, fire) | In |
| Angad | Vanara | Humanoid Vanara, on foot | In |
| Anjana | Vanara | Humanoid Vanara, on foot | In |
| Bali | Vanara | Humanoid Vanara, on foot (mace) | In |
| Indra | Deva | Humanoid, on foot (Vajra) | **In: the slice** |
| Kartikeya | Deva | Humanoid, on foot; the peacock stands beside him (it is not ridden) | In (peacock dropped from the fighter) |
| Mahabali | Asura | Humanoid, but **seated on a throne** in the pack | In, needs a standing form (new clips anyway) |
| Mahishi | Asura | Humanoid, on foot | In |
| Makardhwaja | Vanara | Humanoid Vanara, acrobatic | In |
| Meghnad | Asura | Humanoid, **mounted on a horse** in the pack | **In, on foot (ruling 2): the slice** |
| Shukracharya | Asura | Humanoid, on foot (staff) | In |
| Sugriva | Vanara | Humanoid Vanara, on foot (staff) | In |
| Varuna | Deva | Humanoid, on foot, in a water swirl | In |
| Garuda | Deva | **Winged**, hovering | Out: winged archetype later |
| Rahu | Asura | **A disembodied head** | Out: head archetype later |
| Vritra | Asura | **A coiled dragon / serpent beast** | Out: beast archetype later |
| Kulika | Naga | **Serpent-bodied** (upper body on coils) | Out: serpent archetype later |
| Padmavati | Naga | **Serpent-bodied** | Out: serpent archetype later |
| Shesha | Naga | **Serpent-bodied** | Out: serpent archetype later |
| Takshaka | Naga | **Serpent-bodied** | Out: serpent archetype later |
| Vasuki | Naga | **Serpent-bodied**, coiled, facing the camera | Out: serpent archetype later |

**13 in, 8 out.**

**Consequence:** v1 has **no Naga fighter at all**, because every Naga Hero is serpent-bodied. Faction coverage is Deva 4, Asura 4, Vanara 5.

## The moveset template (every Hero is built the same way)

Gameplay runs on fixed 60 Hz logic frames and the art is stretched onto those phases, so fight timing never depends on what a clip produced. Animation plays at 12 fps. The source of truth is `lab/arcade/core/moves.js`.

**15 moves per Hero** (owner ruling 5, 2026-11-04): the original 12, plus **10b** knockdown + get-up, **13** parry and **14** throw. A Hero being thrown plays its own 10b. The frame data for the three new moves is my proposal, for your ruling.

| Move | Cells | Startup / active / recovery (frames) | Damage, effect |
|---|---|---|---|
| Idle | 8, loop | — | |
| Walk forward | 8, loop | — | Root motion removed; the speed comes from the archetype |
| Walk back | 0 or 8 | — | Walk forward played in reverse first; its own clip only if that reads wrong |
| Jump | 9 | A 40-frame arc, peak 120 px | No air attacks in v1 |
| Crouch | 3 + 1 hold | Instant | Ducks a high |
| Light | 6 | 5 / 3 / 9 | 50, **mid** (must be blocked), hitstun 14, blockstun 10, hit-stop 6 |
| Heavy | 9 | 12 / 4 / 18 | 110, **high** (can be ducked), hitstun 22, blockstun 16, hit-stop 8 |
| Special (divine weapon) | 14 | 16 / 8 / 26 | 200, chip 40 through a block, costs a full meter. A low projectile (balanced, zoner) or a charge (rushdown, tank) |
| Block | 3 | Instant | Hold away from the opponent, or the Block button; no chip on light or heavy |
| Hit reaction | 4 | — | Light plays 2 cells, heavy all 4 |
| **10b** Knockdown + get-up | 7 + 5 | Down 36, rising **40** (ruling 2026-11-04, was 20; after the hit's hit-stop) | Caused by any special that hits, any throw, and a heavy that **finishes a combo** (it lands on a Hero already in hitstun: light → heavy). A raw heavy only staggers. **Invulnerable** while down and rising: no hit, shot or throw lands (no off-the-ground combos) |
| KO | 10 | — | Then the dissolve |
| Win | 10 | — | |
| **13** Parry → counter | 5 + 6 | Window 6, lockout 40; deflect 6, then the counter 6 / 2 / 14 (90 damage, guaranteed); attacker stunned 30 | A **fresh tap of Block** opens a 6-frame window; a hit landing in it does nothing (no damage, no chip), hit-stop 10, the attacker is pushed back ~10 px and stunned. The parrier is free well before the attacker, so even a heavy (12-frame startup) is a guaranteed punish. Every tap starts a 40-frame lockout, so mashing parries at most one tap in 40 frames. A parried shot simply vanishes. Throws can't be parried |
| **14** Throw | 10 | 5 / 2 / 20 on a whiff; on a grab: hold 7, then thrower recovers 16 | **Light + Heavy together** (a light at most 2 frames old converts, in range). Range 90 px from the centre. **Unblockable:** it takes a Hero standing, walking, crouching, blocking, parried or mid-attack; never one in hit/blockstun, down, rising, in the air, parrying or already in a throw. 120 damage × the archetype, then a knockdown. **Throw-tech:** Light + Heavy during the 7-frame hold breaks it, both pushed apart, no damage. Pressing too early starts your own throw, which is grabbed in its startup. Two throws grabbing on one frame break each other |

**Combat rules:**
- **Cancels**, only on contact (hit or block), from the first active frame through 4 frames of recovery:
  - light → light, once;
  - light → heavy;
  - light or heavy → special.
- **One hit per attack.** No air combos.
- **Divine meter (0–100):** +8 to the hitter, +5 to the one hit, +2 to a blocker.
- **Health:** 1000 × the archetype's figure. **Round timer:** 60 s.
- **Time-out:** the larger share of health left wins. Equal is a draw, and a drawn round is fought again with the same Heroes at most twice, then goes to the larger health share (side 0 on a perfect tie).
- **Input buffer:** 4 frames. A press can be used on its own frame and the next 3. During hit-stop it is recorded but does not age.
- **Boxes:** hurtboxes are 1–3 per cell, hitboxes are drawn only on active cells, all relative to the feet pivot in units of stance height. Mirroring a Hero flips the x sign.

### The archetype table (ruling 8)

| Archetype | Health | Walk forward / back (px/frame) | Damage | Special |
|---|---|---|---|---|
| All-rounder (Indra) | 1000 | 4 / 3 (**real Heroes: 2.8 / 2.1**, below) | 100% | Projectile, 9 px/frame (the balanced numbers) |
| Reach (Meghnad) | 1000 | 4 / 3 | 100% | **Nagapasha** (ruling 6): a serpent-coil shot, 10 px/frame, that **binds** on hit (50 frames, 80 damage, no knockdown) and is blockable for 40 chip. Light and heavy reach **Indra's + 45 px**, recovery **+2 frames** |
| Balanced | 1000 | 4 / 3 | 100% | Projectile, 9 px/frame |
| Rushdown | 900 | 5 / 4 | 108% | Charge, 10 px/frame |
| Zoner | 950 | 3 / 3 | 95% | Projectile, 11 px/frame |
| Tank | 1150 | 3 / 2 | 100% | Charge, 8 px/frame |

Indra and Meghnad are ruled. The other 11 are ruled as their clips arrive.

**Reach from the art (ruling 5, 2026-11-04).** A real Hero's light and heavy hitboxes end where the weapon's tip is at contact, measured by the fighter tool on the clips. Indra: light 198, heavy 210 logical px from the feet; his Vajra shot leaves the tip at 177. Meghnad's are Indra's + 45 until his reshoot is measured. The box Heroes keep the template boxes.

**Difficulty (ruling 4): no change now.** Open: consider a middle level between Beginner and Advanced once real art is in.

## The AI (honest-AI rule)

- **What it sees:** only `observe()`, the screen: positions, facing, health, meter, each fighter's state and current move frame, the shots and the clock.
- **What it never sees:** the player's input, buffered presses or contact flag.
- **Reaction delay:** it sees the opponent as they were a reaction time ago (Beginner 27 frames = 450 ms, Advanced 11 ≈ 183 ms, Death Match 9 = 150 ms).
- **Output:** the same input bitmask a player makes, through the same buffer.
- **No stat advantage at any level.** Death Match is a sharper player: it blocks, ducks and cancels more and attacks sooner.
- **The new moves, honestly:**
  - **Parry:** it may choose a timed parry instead of a guard. It times the tap from the move's known startup, counted from the frame it saw the move start, so it can only parry what it saw in time: heavies and specials, never a light.
  - **Throw:** at attack time, when close; much more likely when it sees the opponent blocking.
  - **Tech:** it can break a throw only if it has *seen* the throw begin, through its reaction delay. That is tight: Advanced barely makes it, Death Match does.
  - Levels: Advanced parries 15%, throws 30%, techs 40%; Death Match 30%, 45%, 70%.
- **The gentler Beginner (ruling 6):** reacts in 450 ms, blocks 10%, never cancels or chains, waits 0.4–0.8 s between attacks, uses no special in round 1, and **never parries, throws or techs** (ruling 5). The round is on screen, so it may know it.

## The Kling clip card (one Hero; Indra shown, Meghnad the same)

**Step 0: the stance still** (an image tool, not Kling). It anchors every clip.
- Start from the Hero's identity master.
  - **Present for both slice Heroes** in `assets/arcade/identity-masters/`: side profile facing right, on green, 1024×1536.
  - They show a **neutral standing pose with no weapon**, so step 0 still has to be made from them.
- The still: **fighting stance**, weight forward, weapon in hand (Indra: the Vajra; Meghnad: the spear **upright over the shoulder, nothing past the front knee** — ruling 5), **true side profile facing right**.
- Background chroma green (RGB 0, 185, 62). Use magenta for a Hero dressed in green or teal.
- Canvas **1920×1080**. The Hero about 640 px tall, feet on y = 1000, body centred near x = 700, leaving room in front for strikes.
- No particles, no weapon glow.
- I check it before any clip is made: scale, ground line, profile angle.

**Step 1: the clips.** Image-to-video, 1080p, 16:9, 5 s, the stance still as the **first frame**, and as the **last frame** where your Kling version offers it.

Every prompt starts: *"Static locked camera, side view, no camera movement, no zoom, full body always in frame, plain green background, no environment, no effects beyond the weapon, one action."*

Every action line below ends with *"no lightning, no glow, no light or energy effects"* (ruling 8, 2026-11-04): Kling baked a lightning bolt into Indra's special and a floating shaft into his parry. The game draws its own effects.

| # | Clip | Action line | Last frame = stance? |
|---|---|---|---|
| 1 | Idle | breathes and shifts weight in place, ready — no lightning, no glow, no light or energy effects | Yes (loop) |
| 2 | Walk forward | steps forward in place, two steps, stays centred — no lightning, no glow, no light or energy effects | Yes (loop) |
| 3 | Walk back | steps backward in place, guard up — no lightning, no glow, no light or energy effects | **Not shot by default.** Walk back = walk forward reversed, for every Hero (owner approved on Indra). Shoot 03 only if a Hero's reverse looks wrong |
| 4 | Jump | a small low hop, head always inside the frame, lands in stance — no lightning, no glow, no light or energy effects (the engine supplies the height) | Yes |
| 5 | Crouch | drops low into a one-knee guard and holds — no lightning, no glow, no light or energy effects | No |
| 6 | Light | one quick jab forward, returns to stance — no lightning, no glow, no light or energy effects | Yes |
| 7 | Heavy | one powerful overhead strike with the weapon, **a clear held impact pose**, returns to stance — no lightning, no glow, no light or energy effects | Yes |
| 8 | Special | raises the weapon, drives it forward into **a clear held impact pose**, returns to stance — no lightning, no glow, no light or energy effects | Yes |
| 9 | Block | raises both arms to guard and holds — no lightning, no glow, no light or energy effects | No |
| 10 | Hit reaction | flinches back from a blow to the chest, recovers to stance — no lightning, no glow, no light or energy effects | Yes |
| 10b | Knockdown + get-up | is struck hard and thrown back off the feet, lands flat on the back, lies a beat, then pushes up off the ground and rises back into the fighting stance — no lightning, no glow, no light or energy effects | Yes |
| 11 | KO | staggers and falls to the ground, lies still — no lightning, no glow, no light or energy effects | No |
| 12 | Win | raises the weapon in triumph, holds — no lightning, no glow, no light or energy effects | No |
| 13 | Parry | snaps the weapon across the body to deflect a blow coming from the front, a sharp short recoil, returns to stance — no lightning, no glow, no light or energy effects | Yes |
| 14 | Throw | steps in, seizes an unseen opponent at chest height with the free hand and hurls them over the shoulder to the ground behind, mimed with no second figure, returns to stance — no lightning, no glow, no light or energy effects | Yes |

**Shoot order:** the original 12 first (1–12, in the order above, skipping 03), then **10b, 13, 14**. The fight core already plays all three as boxes (and, with fx, borrowed art), so they can arrive in any order without blocking anything.

**Meghnad's reshoot (ruling 5):**
- **New stance still:** the spear **upright over the shoulder**, nothing past the front knee. Today it is held out front, so even in idle it passes about 190 px into the opponent.
- **Idle and light are reshot from that stance.** The light's action line: *"from the stance, one fast thrust of the spear forward, about one and a half body lengths, returns to stance — no lightning, no glow, no light or energy effects"*.
- **His special (Nagapasha, ruling 6):** the clip shows only *"a spear thrust forward into a held casting pose, returns to stance"*. The serpent coil is the engine's own projectile, so no serpent appears in the clip.
- **When the reshoots land:** his hitboxes are set from the art, keeping his archetype relative to Indra (reach +45, recovery +2 frames).

**Step 2: curate.** Reject a clip for any of these:
- the camera drifts or zooms;
- the face, crown or costume drifts from the identity;
- limbs blur into each other;
- the feet leave the ground line when they shouldn't.

Expect about 1.5 takes per clip.

**Step 3: drop.** Put the clips in `lab/arcade/sources/<hero>/` (gitignored), named `<hero>_01_idle.mp4` … `<hero>_12_win.mp4` (Indra's are `indra_02_walk_forward`, `indra_10_hit_reaction`, `indra_13_counter_parry` — the tool reads its own list), and `<hero>_10b_knockdown.mp4`, `<hero>_13_parry.mp4`, `<hero>_14_throw.mp4`.

From there the fighter tool (R3) does the rest, and the owner reviews a contact sheet:
- matte the clips;
- track the pivot and remove the clip's own sideways travel;
- pick frames at 12 fps;
- pack the high and low sheets;
- author the boxes.

**Mirroring:** everything is authored facing right and mirrored at runtime for the other side. A weapon hand flips; accepted.

## The clip test (Indra and Meghnad: idle + light), 2026-11-03

The tool is `lab/arcade/tools/make_fighter.py`, run with the matting venv. Contact sheets go to the owner's `~/Desktop/DY_arcade_screens/`.

| | Indra | Meghnad |
|---|---|---|
| Clips | 121 frames, 24 fps, 1920×1080, ground RGB (24, 255, 12) | same |
| Stance (idle f0) | ground row 969, feet x 636, stance 671 px | ground row 983, feet x 625, stance 681 px |
| Idle loop | 55 frames (2.3 s), closing at mean \|Δ\| 1.7 on the figure → **28 cells** | 57 frames (2.4 s), \|Δ\| 0.7 → **29 cells** |
| Light | wind-up f13, 40% f18, **contact f26**, hold to f41, back by f49 → cells f13 f18 · **f26** · f43 f45 f47 | wind-up f27, 40% f30, **contact f38**, hold to f49, back by f55 → f27 f30 · **f38** · f50 f52 f54 |
| Pivot wobble (source px) | idle ≤ 1.3; light x −4.6…+12.1 (the lunge's foot) | idle ≤ 0.9; light x −4.6…+27.2 (the front foot steps) |
| Idle ↔ light registration | 1.5 px | 1.8 px |
| Sheets | hi 3984×978, 0.56 MB · lo 2022×594, 0.26 MB | hi 4009×1307, 0.59 MB · lo 1910×986, 0.28 MB |
| Matte | 0 green-tinted edge pixels left (148,801 before the edge despill); no fringe on the Vajra or the crown; rembg never needed | 0 (39,853 before); spear tip and plume clean; rembg never needed |
| Mirror | 34/34 cells flip about the feet, feet on the ground row | 35/35 |

**What the tool does that the plan didn't spell out:**
- **Edge despill.** Kling's green leaves a yellow-olive rim on skin and gold, especially on motion smear. Semi-transparent pixels, and the outermost 2 px of the figure, may not carry green above the mean of red and blue (+6). Opaque gold inside the rim is untouched.
- **Contact = the sharpest frame early in the hold.** Kling's fast strikes smear their first frames; Indra's frame 19 is a one-frame overshoot, and at frame 20 the Vajra vanishes in the blur.
- **The idle loop is measured on the figure, not the frame.** The green ground would otherwise make any near-still figure look looped.

**The finding that needs a ruling: the art reaches much further than the template's hitboxes.**

| | The weapon tip at contact, from the feet | The light hitbox's far edge |
|---|---|---|
| Indra | 199 logical px | 95 |
| Meghnad | 370 logical px | 140 (with reach +45) |

Even standing in idle, Meghnad's spear is held about 190 px forward, so at fighting distance it passes through the opponent.

## The enhancement test (2026-11-04): does it feel better?

Three switches on the lab page, each defaulting to the R0–R2 baseline, and a scripted bout so every mode shows the same fight. The fight core, its 60 Hz step and its frame data are unchanged; everything below is presentation (`ui/present.js`).

| Switch | What it turns on |
|---|---|
| `fx=1` | Hit-flash, sparks (gold for Indra, dark red for Meghnad, blue on block), shake and punch-zoom on heavy and special, knockback and landing dust, ground shadows, a 2-ghost trail on strike frames, K.O. slow-mo (¼ speed, zoom 1.45), the Vajra pillar on Indra's special (the copied VFX-lab clip, `effects/vajra/`), and borrowed art for moves with no clip yet (any attack plays the light's cells, everything else loops the idle). |
| `fps=24` / `fps=48` | The HD sheets (`fighters/<hero>/f24`, `f48`, stance 512 hi / 320 lo), with a 3-frame cross-fade when the art changes move. |
| `cam=tight` | The dynamic camera: it follows the midpoint and zooms with distance, zoom = 960 / (gap + 420), clamped to 0.8–1.25, eased (k = 1 − e^(−6·dt)), never past the stage ends. |
| `demo=1` | The demo bout on a loop. `capture=<name>` records it (with `tools/capture_server.js`). `perf=1` shows the probe; `cpu=N` stretches each frame's work N times. |

**Recordings** (on the owner's Desktop, `DY_arcade_screens/`): `arcade_1_baseline`, `arcade_2_fx_tight_12fps`, `arcade_3_fx_tight_24fps`, `arcade_4_fx_tight_48fps` (MP4 + GIF each), frame strips for 1 and 4, and `indra_interp_artefacts.jpg` / `meghnad_interp_artefacts.jpg`.

### The in-betweens (48 fps)

The source clips are 24 fps, so 24 fps needs no invented frame. 48 fps needs one between every pair: made offline with OpenCV DIS optical flow both ways and premultiplied warp and blend. Each method was audited by re-making a real frame from its two neighbours.

- **Idle: clean.** Error on the weapon at most 7.3/255 (Indra) and 14.6/255 (Meghnad). It reads as smoother breathing.
- **The light: not usable.** On the fast strike the weapon error reaches 98/255: a doubled Vajra, a smeared hand, a green halo at the tip. So the tool takes the light's nearest real frame, and the light is never interpolated at any fps. A fast strike at 48 fps is therefore no smoother than at 24.

### Measured (two fighters: Indra + Meghnad, idle + light only)

Throttled browser runs, the demo bout, `cpu=4`, 960×540, Pixi WebGL. Frame work stayed under 1.2 ms on average at every setting. The worst single frame was the sheet upload: 566 ms at 48 fps hi, 150–200 ms at the others.

| | Download (2 fighters) | Decoded graphics memory (2 fighters) | Sheet pages | fps at cpu 4 |
|---|---|---|---|---|
| 12 fps hi (baseline) | 1.20 MB | 36.5 MB | 1 each | 120 |
| 12 fps lo | 0.56 MB | 12.3 MB | 1 each | 120 |
| 24 fps hi | 3.82 MB | 155 MB | 1 + 2 | 120 |
| 24 fps lo | 1.99 MB | 59 MB | 2 + 3 | 120 |
| 48 fps hi | 7.93 MB | 301 MB | 2 + 4 | 112 |
| 48 fps lo | 4.06 MB | 119 MB | 3 + 5 | 120 |
| + `fx=1` | + 0.33 MB (Vajra atlas) | + 18.5 MB | 1 | no change |

Projected to the full moveset (about 90 cells per fighter at 12 fps), a match of 6 fighters, and 2 in memory at once:

| | One match download | Graphics memory (2 fighters) | vs the budget (4–6 MB low / 8.5–11 MB high; ≤48 / ≤96 MB) |
|---|---|---|---|
| 12 fps hi | 9.4 MB | 95 MB | Fits, at the edge |
| 12 fps lo | 4.4 MB | 32 MB | Fits |
| 24 fps lo | 17 MB | 169 MB | Over: 3.5× the memory |
| 24 fps hi | 33 MB | 443 MB | Far over |
| 48 fps (either) | 35–68 MB | 341–861 MB | Far over |

The CPU is not the limit; graphics memory is. These numbers are for two moves only, and the HD sheets bust the cap already.

### Recommendation

**`fx=1` + `cam=tight` on the 12 fps sheets.** That is where the feel comes from (hit-flash, sparks, shake, the camera closing in, the K.O. slow-mo, the Vajra pillar), and it costs 0.33 MB and 18.5 MB of memory. 24 fps looks smoother in idle but cannot be afforded as the full set. 48 fps buys nothing on strikes, because the in-betweens ghost.

Worth a ruling:
1. Allow the cross-fade at 12 fps (today it is on only at ≥ 24).
2. If smoothness is wanted, use 24 fps on the strike frames only (a handful of cells per move), not across the whole set.
3. **Still open:** up close the art overlaps the opponent (Meghnad's spear passes through), because the hitboxes and push boxes are template-sized. The camera makes this more visible. This is the reach/spacing ruling from the clip test.

## Rulings after the enhancement test (owner, 2026-11-04)

| # | Ruling | Outcome |
|---|---|---|
| 1 | fx on and the tight camera become the defaults; the switches stay; 12 fps | Done. `?fx=0` and `?cam=wide` turn them off; `?fx=0&cam=wide` is the exact R0–R2 picture |
| 2 | 24 fps strike frames for light/heavy/special, only if the full-moveset projection fits the caps | **Not shipped: neither rung fits, even at 12 fps.** See the projection below |
| 3 | The 3-frame cross-fade at 12 fps too | Done, as part of fx (so `?fx=0` stays the baseline) |
| 4 | Drop the 48 fps and full-set 24 fps sheets; remove the switches | Done in its own commit (74a6940); `?fps=` is ignored. The tracked lab total fell from 20.11 MB to about 3 MB |
| 5 | 15 moves: knockdown + get-up, parry, throw, with frame data and AI | Done, as placeholders until the clips arrive. Frame data proposed in the template table above |
| 6 | A gentler Beginner; re-run the ladder | Done (the AI section). Ladder: Advanced beats Beginner 99.5%, Death Match beats Advanced 77.4%, Death Match beats Beginner 99.8%; mirror 53.7% (side 0 47.4%). A new-player stand-in (400 ms reaction, blocks 25%, rarely cancels) wins **98.5%** of rounds against the Beginner and 13.6% against Advanced |
| 7 | Meghnad's new stance, idle and light are being reshot (spear upright over the shoulder) | His current sheets stay as placeholders |
| 8 | The clip card gets 10b, 13, 14 and the shoot order | Done (the clip card above) |

### The memory projection (ruling 2), `lab/arcade/tools/budget.js`

The model, every input named:
- **Memory per cell:** decoded memory per cell, measured from the shipped sheets: whole page area × 4 bytes ÷ cells, so packing waste counts.
- **Idle and light:** measured. The real idle loops are 28–29 cells, not the template's 8.
- **Every other move:** from the template. Walk back is 0 (walk forward reversed).
- **Strike frames:** 24 fps from 5 frames before the first active frame to 5 frames after the last. That adds +8 cells per fighter: light +2, heavy +3, special +3.
- **Arena:** the four layers below. Lo is half the size on each side.
- **Effects:** the Vajra atlas as shipped, loaded at either rung today.

Two fighters (Indra + Meghnad), arena and effects:

| | lo (cap 48 MB) | hi (cap 96 MB) |
|---|---|---|
| Memory per cell, Indra / Meghnad | 0.135 / 0.205 MB | 0.437 / 0.571 MB |
| Fighters, 12 moves | 35.9 MB | 106.4 MB |
| Fighters, 15 moves | 45.8 MB | 135.7 MB |
| Arena + Vajra | 7.0 + 17.7 MB | 28.0 + 17.7 MB |
| **Total, 15 moves at 12 fps** | **70.4 MB: over** | **181.3 MB: over** |
| Total, + 24 fps strike frames | 73.1 MB: over | 189.4 MB: over |
| With two levers: Meghnad packs like Indra, a half-size Vajra atlas on lo | 47.5 MB (49.7 with strike frames: over) | 162.8 MB |

**Decision:** no strike frames. Both rungs stay at 12 fps everywhere, and the suite pins it (M1).

**Finding that needs a ruling:** the moveset itself is over both caps at 12 fps. It was over at 12 moves too: lo 60.6 MB, hi 152.1 MB. The enhancement test's "12 fps hi fits, at the edge" counted fighters only, assumed about 90 cells, and left out the arena and effects. Levers, roughly in order of effect:
1. **Compressed GPU textures** (KTX2 / Basis → ASTC or ETC2 on the phone): about 4× less memory per sheet, so hi becomes about 45 MB. It needs a transcoder in the page.
2. **Meghnad's reshoot** (spear upright) should pack like Indra: about −10 MB lo, −19 MB hi.
3. **A lo Vajra atlas** at half size: about −13 MB lo.
4. **A shorter idle loop:** 28 cells → 12 saves about 12% of every fighter.
5. **A smaller hi stance:** 320 → 256 px saves about 36% at hi.

Lo fits with levers 2 + 3, and only just (47.5 of 48). Hi fits only with lever 1, or with several of 2–5 together.

## Indra's full moveset cut + the memory fix (owner rulings of 2026-11-04, second set)

### The rulings and what was done

| # | Ruling | Outcome |
|---|---|---|
| 1 | GPU-compressed textures (KTX2 / Basis) for the fighter pages and the arena, with a WebP fallback; idle at 8 fps; hold cells trimmed; a half-size lo Vajra; the strike frames back only if the 15-move projection fits both caps with margin | **Done. The projection now fits with margin, so the 24 fps strike frames ship.** The levers and their savings are in the tables below |
| 2 | Frame data for knockdown, parry and throw approved | Unchanged |
| 3 | Throw: keyboard Light + Heavy or U; touch a fifth Grab button, same size, never over Light or Heavy | Done. Grab sits on the top row (Grab · Special · Block over Light · Heavy). In the browser at 640×360 and 568×320: no overlaps, all in view, clear of the stick's half of the screen. The chord still throws on touch |
| 4 | Difficulty: no change; a middle level is open | Noted (the archetype section) |
| 5 | Reach from the art | **Indra:** light 198, heavy 210, the Vajra leaves at 177 (measured: 198.4 / 209.5 / 177.1). **Meghnad:** Indra's + 45 until his reshoot is measured. The AI spaces itself by its own reach |
| 6 | Meghnad's special = Nagapasha | **A shot that binds:** 50 frames, 80 damage, no knockdown, so a follow-up lands; blockable for 40 chip. The coil is drawn as a teal serpent placeholder, and a bound Hero gets coil rings |
| 7 | The strong edge despill as the tool's default, with a before/after | Done. **0 olive edge pixels** on every cell of both fighters (the clip-test rule left 1,106 on Indra's sample of 13 cells and 222 on Meghnad's). Solid gold is untouched. Before/after on the Desktop |
| 8 | Clip card: held impact pose; no lightning, glow or energy; the jump as a low hop; Meghnad's stance and thrust; walk back = reversed | Done (the clip card) |
| — | New 11 KO and 04 jump (owner messages during the work) | Both cut. KO: stagger tightened, fall, lie; the lying body lifted 12 px onto the ground; the speck dropped by isolation. Jump: 8 sharp cells from take-off to touch-down, the crown 34 px from the top at most |

### Cells per move (Indra)

| Move | Clip frames used | Cells | How it plays |
|---|---|---|---|
| Idle | f0–f55 loop | 17 | 8 fps loop; 19 steps, 2 near-duplicates merged |
| Walk | f25–f88 cycle | 32 | 12 fps loop. Walk back = the walk reversed |
| Jump | f43–f84 | 8 | Across the 40-frame airtime, each cell standing on its own lowest point |
| Crouch | enter f27, f41 · hold f72–f96 | 6 | Entry, then a 1 s hold played forward and back (4 cells) |
| Light | f12–f44 | 7 | The game's 5/3/9 phases, strike frames at 24 fps |
| Heavy | f37–f93 (f50–58 skipped) | 11 | 12/4/18, strike frames at 24 fps |
| Special | f23–f94 | 16 | 16/8/26, strike frames at 24 fps; the baked lightning cut beyond the Vajra's tip |
| Block | enter f11, f27 · hold f29–f53 | 8 | Entry, then the hold; blockstun shows the guard |
| Hit, light / heavy | f31–f40 / f31–f55 | 3 / 4 | Light = the first flinch; heavy = the full stagger, also used when parried, grabbed or bound |
| Knockdown / get-up | f11–f57 / f81–f101 | 7 / 4 | The 36-frame fall, then the 20-frame rise |
| K.O. | f23–f91, lie f118 | 11 | Over 60 frames after the fight ends, then the still frame holds |
| Win | enter f23–f63 · hold f96–f120 | 10 | Raise, then the hold |
| Parry | f31–f41 | 3 | The deflect only. The clip's lunge (f58–66) isn't used: the parry's punish is the player's own move |
| Throw | — | 0 | Borrows the light until clip 14 arrives |
| **Total** | | **147** | |

### Sheets and encoding (measured)

**Encoding choice** (ruling 1: "UASTC for hi, ETC1S for lo, or the measured best"). The tool takes the best PSNR whose download fits a fighter's cap. Indra's full cut:

| Rung | Cap | UASTC | UASTC + RDO λ4 | ETC1S | Chosen |
|---|---|---|---|---|---|
| hi | 1.6 MB | 4.9 MB, 35.8 dB | 4.2 MB, 31.8 dB | 1.46 MB, 27.3 dB | ETC1S |
| lo | 0.7 MB | 1.9 MB, 33.5 dB | 1.7 MB, 30.8 dB | 0.68 MB, 25.5 dB | ETC1S |

- UASTC looks better but costs 3× the download. Indra's hi alone would be 4.9 MB, and six fighters about 30 MB against a match's 11.
- ETC1S shows slight blockiness on cloth at 2× zoom and reads close to WebP at game size. **Your call if you want UASTC on hi.**

**Sheets:**

| | hi | lo |
|---|---|---|
| Indra pages | 1 page, 4096×3548 | 2 pages: 2048×1892 + 1972×632 |
| Indra KTX2 / WebP | 1.46 / 2.33 MB | 0.70 / 1.11 MB |
| Indra GPU memory, compressed / as RGBA | 13.9 / 55.4 MB | 4.9 / 19.5 MB |
| Meghnad (placeholder, 22 cells) KTX2 | 0.27 MB | 0.14 MB |

**In the browser** (Chrome on the owner's Mac): KTX2 → ASTC 4×4, Indra 14.5 MB on the GPU, transcoding 129 ms for both fighters. `?tex=webp` loads the fallback (92 MB in all, hi).

### The projection (`tools/budget.js`): 2 fighters + arena + effects, 15 moves, strike frames included

| | lo (cap 48, margin 36) | hi (cap 96, margin 72) |
|---|---|---|
| Indra, measured | 4.9 MB | 13.9 MB |
| Meghnad, full set at today's spear-out density / packing like Indra | 9.8 / 4.9 MB | 24.9 / 13.9 MB |
| Arena (compressed) + Vajra | 1.8 + 4.4 MB (the half-size copy) | 7.0 + 17.7 MB |
| **Total** | **20.8 MB** (15.9 if the reshoot packs like Indra) | **63.4 MB** (52.4) |
| Without the levers | 86.3 MB | 208.4 MB |
| Saved by compressed textures | −49.2 MB | −137.1 MB |
| Saved by idle at 8 fps (19 cells instead of 28) | −0.9 MB | −2.4 MB |
| Saved by the hold trim (21 cells) | −2.1 MB | −5.5 MB |
| Saved by the half-size Vajra | −13.2 MB | — |
| The WebP fallback (no compressed format) | 70.1 MB: over | 200.5 MB: over |
| Download: Indra / 6 fighters | 0.70 / 4.2 MB (caps 0.7 / 6) | 1.46 / 8.7 MB (caps 1.6 / 11) |

**Decision:** the strike frames ship (light +1, heavy +3, special +6 cells for Indra). The suite pins it (M1).

**Open: the fallback is over the cap.** A device with no compressed format at all is rare on WebGL (ETC2 is in every WebGL 2 phone, ASTC in most). For those devices, the fix would be the lo WebP pages plus fewer cells.

### What in the clips doesn't work in play

- **The walk is not a steady cycle.** The take goes from the wide stance (f25–33) into an upright stride (f41–79) and back to the stance. Its best loop (63 frames) closes at |Δ| 10.0, against the idle's 1.6. In play the stance-to-stride change reads as a pulse every 2.6 s, and the feet slide a little where the torso alignment removes the clip's 140 px of travel. **Reshoot as a steady stride that starts and ends mid-step,** or rule to cut only f41–79.
- **The special is clean.** The baked lightning was cut beyond the tip (20–70 k pixels a frame), with no green halo left: semi-transparent pixels are no more than the clean frame's. No reshoot is needed for the matte. The bolt cost the drive's motion blur nothing.
- **The knockdown falls forward,** to hands and knees toward the opponent, while the engine slides the Hero backward. It reads as a stumble, not being blown away. A take that falls backward would match.
- **The K.O. turns toward the camera** mid-stagger (f36–60) before falling. Acceptable for a K.O.
- **The crouch, K.O. and win clips started 17–19 px right of the stance.** Each is registered back by its own frame 0, so no visible jump.
- **The win steps forward of the stance.** Its cells' feet sit up to 6 px (lo) left of the figure's foot. Harmless.
- **Throw (14) is not supplied.** It borrows the light, and the thrown Hero plays the heavy stagger, then 10b.
- **The parry's built-in lunge** (f58–66) is unused. If you want an automatic counter-strike, that is a rules change.
- **Meghnad** is still today's sheets (idle + light). Every other move borrows, and his special is the Nagapasha shot over a borrowed light thrust.

## Rulings on the Indra report + the throw clip (owner, 2026-11-04, third set)

| # | Ruling | Outcome |
|---|---|---|
| 1 | Encoding: ETC1S on both rungs, UASTC off | The tool encodes ETC1S only. Indra hi 1.52 MB (27.4 dB), lo 0.69 MB (25.6 dB), both inside a fighter's cap |
| 2 | Walk: interim = frames 41–79 only; the reshoot (a steady low-stance stride) replaces it | Cut: 19 cells (was 32). f41 and f79 are not the same point of the stride, so the seam is visible (|Δ| 39); the reshoot fixes it. Walk back = walk forward reversed |
| 3 | Knockdown: interim = 11 K.O.'s backward fall (~60–90) into 10b's rise | Cut: fall f59–f91 (7 cells, shared with the K.O.'s, so they cost no extra memory), rise 10b f81–f101. The rise starts on hands and knees, so it pops from lying to kneeling until 10b is reshot backward |
| 4 | The K.O.'s turn to camera | Accepted |
| 5 | The parry becomes an automatic counter | **Done.** A parried blow (not a shot) flows from the deflect into the clip's lunge, 6 / 2 / 14 frames, cut from f43, f57, f61 (impact), f67–f79. It lands 22 frames after the parry (hit-stop 10 + deflect 6 + startup 6), while the attacker is still stunned (30), so it is guaranteed. **Proposed: 90 damage** (× the archetype), hitstun 20, meter +8 / +5 like a landed hit. The 6-frame window and 40-frame lockout are unchanged. Advanced and Death Match use it (200 fights: 2 and 1 counters); the Beginner never parries, so never counters |
| 6 | The uncompressed fallback stays under the lo cap | **Done.** No compressed format (or `?tex=webp`, or the Canvas 2D floor) → the lo WebP pages, resized ×0.75 as they load (stance 144 px). Projection: 44.7 MB of 48 (70.7 unscaled). In the browser: 18.9 MB in all, with no seams between cells |
| 7 | Nagapasha 50 / 80 / 40 | Approved, unchanged |
| 8 | Throw clip 14 | **Cut:** reach + grab f41–f48 on the throw's startup and active frames (a whiff plays the reach's own cells back to stance), the pull-in f55–f73 over the grab's 7-frame hold (the tech window), then the knee's impact (f83, the sharpest of 78–86) the moment the engine applies the throw, back to stance by f100. The opponent's reaction and knockdown are the engine's. The tech escape shows the block art. Specks cut by isolation |

**Indra now:** 148 cells.

| Move | Cells | Move | Cells |
|---|---|---|---|
| Idle | 17 | Hit light / heavy | 3 / 4 |
| Walk | 19 | Knockdown / get-up | 7 / 4 |
| Jump | 8 | K.O. | 8 (its fall is shared with the knockdown) |
| Crouch | 6 | Win | 10 |
| Block | 8 | Parry | 3 |
| Light | 7 | Counter | 6 |
| Heavy | 11 | Throw / grab / knee | 4 / 3 / 4 |
| Special | 16 | | |

**Sheets:**

| | hi | lo |
|---|---|---|
| KTX2 (WebP) | 1.52 MB (2.33) | 0.69 MB (1.11) |
| GPU memory | 13.9 MB | 5.0 MB |

**The projection** (2 fighters + arena + effects, strike frames in):

| | lo | hi |
|---|---|---|
| Total | 21.0 / 48 MB | 63.5 / 96 MB |
| If Meghnad's reshoot packs like Indra | 16.1 MB | 52.4 MB |
| Without the levers | 86.9 MB | 209.1 MB |
| 6 fighters' download | 4.2 / 6 MB | 9.1 / 11 MB |

## Indra's reshoots: walk + knockdown (owner, 2026-11-04)

- **02 walk forward (reshoot):** the low guarded stance. One clean stride cycle, f25–f92.
  - The forward travel (271 px) is removed by tracking the feet: a straight line between the planted feet at f25 and f92. (The feet's mean jumps whenever a foot lifts, so it can't be fitted mid-stride.) The loop closes in place, seam |Δ| 19 (the interim cut was 39).
  - 23 cells: every 3rd source frame, played at 12 fps, so the stride runs 1.5× faster than shot.
  - Walk back = this reversed. Replaces the interim f41–79 cut.
- **10b knockdown (reshoot):**
  - **Knockdown:** f8–f47, 7 cells: hit, thrown back, onto his back.
  - **Get-up:** f49, 55, 61, 71, 83, 5 cells: the backward roll and the rise through a crouch.
  - The clip's leftward travel (about 400 source px) is removed by the body's centroid; the engine slides him itself.
  - From the landing (f30) on, his lowest point sits on the ground line: lifted 2–12 px, the roll included.
  - Replaces the interim K.O.-fall + old-rise combo, so the pop from lying to kneeling is gone.

**For a ruling:**
- **The get-up runs about 5× faster than shot.** The roll and rise are 40 source frames (1.7 s), squeezed into the approved 20-frame get-up (0.33 s). A get-up of about 40 frames would let it breathe. That is a frame-data ruling: the wake-up stays invulnerable throughout.
- **The walk skates.** The clip strides about 33 logical px/s; the game walks 240 (4 px a frame), about 7× faster. Playing the stride at 1.5× narrows that to about 5×. A slower walk speed for real Heroes, or a faster stride, would close it.

**To stay within the lo download cap** (0.7 MB a fighter), four cuts recover 8 cells:
- the K.O. fall 7 cells, not 10;
- the light flinch shares the heavy stagger's first three cells;
- the win's entry 4 cells, not 6;
- the counter's recovery 2 cells, not 3.

**Indra now:** 148 cells.

| | hi | lo |
|---|---|---|
| KTX2 (cap) | 1.55 MB (1.6) | 0.69 MB (0.7) |
| GPU memory | 13.9 MB | 5.0 MB |
| Projection, 2 fighters + arena + effects (cap) | 63.6 MB (96) | 21.0 MB (48) |
| WebP fallback, lo ×0.75 | | 44.8 MB (48) |

## Rulings on the walk + knockdown reshoot (owner, 2026-11-04)

| # | Ruling | Outcome |
|---|---|---|
| 1 | Get-up 40 frames (was 20) | Done. The five get-up cells (the roll f49, 55, 61 and the rise f71, 83) are now spread across 40 frames, 8 each. Untouchable throughout (`INVUL`, checked by N3) |
| 2a | The walk cycle at 20 fps (was 12) | Done: the same 23 cells. Walk back is the cycle reversed at the same rate |
| 2b | Real Heroes walk 170 px/s (was 240) | Done. Every Hero with real art (Indra, Meghnad, the later roster) walks **2.8 px a frame = 168 px/s**, the engine's nearest to 170; back is scaled the same, 2.1 = 126 px/s. The box Heroes keep their archetypes' speeds, so the AI ladder is unaffected. No AI spacing constant assumed a speed (they are all distances). Indra vs Meghnad AI, first contact: Beginner 40 → 50 frames, Advanced 30 → 37, Death Match 28 → 35; no time-outs in 360 fights; rounds about 10% longer (the longer get-up included) |
| 3 | The budget recoveries | Approved |
| 4 | Strike frames at 24 fps | Unchanged |

**The walk ratio:**
- **Stride:** the cycle covers 271 source px = 88.8 game px. Played at 20 fps, its 23 cells take 1.15 s (2.43× the shot), so the feet cover **77.2 px/s**.
- **Game ÷ stride: 2.18 forward (168 ÷ 77.2), 1.63 back.** The target was 2.5 or lower. It was 7.6 before both changes.

The every-move and walk-only recordings are on the Desktop (`arcade_indra_every_move`, `arcade_indra_walk`).

## Meghnad's full cut (owner brief, 2026-11-05)

All 14 of Meghnad's clips cut with Indra's pipeline (strong edge despill, ETC1S KTX2 + WebP fallback, idle 8 fps, trimmed holds, 24 fps strike frames). The six earlier clips (idle, walk, jump, light, heavy, special) came with no frame notes: their cuts were chosen from the clip strips. The other eight follow the owner's notes.

| Move | Source frames used | Notes |
|---|---|---|
| Idle | auto loop 0–19, 8 fps | 5 cells |
| Walk | f25–92, every 3rd frame, 20 fps, feet-linear, each cell on its planted foot | The clip steps out, shuffles, steps back in: no repeating stride. The tightest loop (f46–64) barely moved the legs, so the full pass is used. **Skate 3.95×** (168 game px/s vs 42.6 px/s of stride): over the 2.5 target |
| Jump | 29, 36, 38, 40, 42, 44, 50, 54 | Kling smears the take-off and the drop: the cells sit on the sharpest frames |
| Crouch | down 19–34, hold 35–59 (one cell after the hold trim) | Owner notes |
| Light | auto (the reach curve) | |
| Heavy | raise 15–32, the downward spear drive 45–47, back by 93; 72–90 skipped | ~450 px forward-and-back travel removed (body centroid) |
| Special (Nagapasha cast) | draw 15–34, thrust 45–52, held 60–74, back 83–97 | |
| Block | raise 31–46, hold 45–60 ping-pong | Owner notes |
| Hit | 37, 41, 45 (the light flinch, shared), 58, 75, 83, 91 | Starts at f35 (the stray spear f29–32 never shown); ~250 px backward travel removed |
| Knockdown | 16, 20, 23, 30, 36, 41, 46 | f25–29 smear the spear into a streak isolation would cut: skipped, so the spear never blinks out; leftward travel removed |
| Get-up | 51, 63, 71, 79, 89 on the 40 frames | Untouchable throughout |
| K.O. | 23, 30, 35 → 67, 77, 91, 101; holds f112 | f36–58 skipped (joined by the cross-fade); all travel removed |
| Win | rise 15–91, hold 90–108 | ~250 px forward step removed |
| Parry / counter | deflect 14–23; counter startup 23–27, hit 31, recovery 40–75 at 24 fps | ~400 px lunge removed |
| Throw (spear-hook) | wind-up 22–28, hook 41; yank 47–55 over the hold; knee 68 (sharpest of 62–68), back 75–91 | The hold pulls the caught Hero in to **64 px** (knee distance, `throwPull`); the range stays 90 |

**Strays:** Kling's flying pieces are cut by isolation; the knockdown's spear (f76–86) is kept by a wider reach (61 px), and the hit (f26–34), knockdown (f10–15) and K.O. (f12–18) stray frames keep only the body. One piece is cut from a played cell: heavy f15, a 975 px smear by his hand. Smeared Kling frames that remain: the heavy's raised legs (f26–32), the counter's lunge (f23–27).

**Sheets:** 136 cells. hi one page 4088×3024, KTX2 1.13 MB (WebP 1.81) of the 1.6 MB cap; lo two pages, KTX2 0.53 MB (WebP 0.85) of 0.7. GPU 11.8 MB hi / 4.1 MB lo. No trims were needed.

**Reach against the art** (logical px from the feet; the engine keeps Indra's reach + 45 for his light and heavy):

| Move | The spear in the art | The engine | |
|---|---|---|---|
| Light | 218 | 243 | the box reaches 25 past the spear |
| Heavy | 80 (a downward drive, spear upright in front of him) | 255 | **does not match** |
| Special | thrust tip 241 | the coil starts at 60 | the coil appears inside the spear |
| Counter | 186 | lands at any distance (by rule) | |
| Throw | the hook reaches 229 | range 90 | visual only, as ruled |

The memory projection now measures Meghnad and takes the heavier fighter twice (a mirror): lo 16.1 MB of 48, hi 52.5 of 96, the uncompressed fallback 33.8 of 48.


## Rulings on the Meghnad cut (owner, 2026-11-05)

**1 · Hitboxes follow the visible spear.** Meghnad keeps the "reach" archetype (recovery +2, the Nagapasha) but the art sets the numbers; the archetype's +45 no longer applies to a Hero with measured reach.

| Meghnad | Old | New | The art |
|---|---|---|---|
| Light (hitbox far edge) | 243 | **218** | 217.7 |
| Heavy (hitbox far edge) | 255 | **80**, after a **137 px** forward lunge over the 12 startup frames | 79.8 from where he stands at impact; the clip's body travels 448 source px by impact = 137 game px |
| Special (the coil's start) | 60 | **241**, or on the opponent if they are closer | 240.8 |
| Counter | lands at any distance (by rule) | unchanged | spear at 186 |
| Throw range | 90 | unchanged (ruled) | the hook reaches 229 |

Indra, checked the same way: light 198 / heavy 210 / Vajra 177 match his art (198.4 / 209.5 / 177.1). His counter lands at any distance (art 202). His throw range is 90 while his hand reaches 149 in the clip: visual only, like Meghnad's hook.

**Found and fixed:** a shot that leaves the weapon's tip (Indra 177, Meghnad 241) started behind an opponent standing closer than the tip and never hit. It now starts on the opponent. For Meghnad, the coil now binds almost at once, inside his own 34-frame recovery, so a follow-up heavy lands inside the 50-frame bind only when the coil is cast from about 230 px or closer (it did from 260 before).

**2 · The AI closes in when out-ranged** (Advanced and Death Match; the Beginner unchanged; no damage number changed): `closeIn` in `core/ai.js`. Inside the opponent's reach and outside its own, it keeps walking in (guarding a seen attack at 85% / 90% instead of 60% / 68%), jumps in at 2% / 3% a frame, and steps in to punish a whiff only when the opponent's remaining recovery (minus its reaction delay) leaves time to walk into reach and land a light. Measured on Indra vs Meghnad, Advanced: without it Meghnad wins 69.3%; with it 63.3%. The punish is worth about 3.5 points, the higher guard about 2; the jump-in costs Indra about 4 (Meghnad's heavy is a high and catches him in the air; without jump-ins Meghnad would win 59.1%).

**3 · Meghnad's walk:** 120 px/s forward, 90 back (was 168 / 126), the stride still at 20 fps. Skate **2.82×** forward, **2.11×** back (was 3.95×). Indra unchanged (2.18 / 1.63).

**4 · The balance check** (Indra vs Meghnad, both AIs, 200 rounds each, sides alternating, test C17): Meghnad wins **63.3% at Advanced**, **61.9% at Death Match**, no time-outs. Inside the 40–65 target.


## The size budget (ruling 7)

| | Target | Cap |
|---|---|---|
| One fighter, high (cells 320 px tall, about 90 cells, one 4096×2048 sheet) | 1.2 MB | 1.6 MB |
| One fighter, low (192 px, one 2048×2048 sheet) | 0.5 MB | 0.7 MB |
| Arena (4 layers) | 0.6 MB high / 0.3 MB low | 0.9 MB |
| One match (6 fighters + arena; audio reused from the game) | 4 MB low / 8.5 MB high | 6 MB / 11 MB |
| Graphics memory at once (2 fighters + arena + effects) | ≤48 MB low / ≤96 MB high | — (projected over at both rungs today: see the memory projection above) |
| Repo, all 13 v1 fighters | about 22 MB | Pages watch item |

Only the two fighters in the current round stay in graphics memory; the next pair loads during the round-end banner.

## The arena (the slice)

**Swarga's Amaravati gates.** Still images, not Kling.

| Layer | Size | Scroll speed |
|---|---|---|
| Sky | 2048×1024, opaque | Static |
| Palace | 2560×1024, with alpha | 0.3 |
| Ground | 2560×512, ground line at 470 of the 540 logical height | 1.0 |
| Foreground pillars and foliage | 2560×512, with alpha | 1.2, sparse, never over the fighters |

The view is 960×540 logical, on a 1440-px-wide stage.

## The build rungs (lab law on every one)

| Rung | What | Status |
|---|---|---|
| R0 | Page, own Pixi copy, stamp, test runner, lab-law check | Built |
| R1 | The deterministic fight core + box fighters, keyboard play, the frame data above, cancels, hit-stop, block, crouch vs high, meter, health; the rounds stub | Built |
| R2 | Touch controls, the 4-frame buffer, the three AI levels under the honest-AI rule, the headless ladder and mirror | Built |
| R3 | Indra as a real fighter: the fighter tool, the hitbox editor | **Indra fully animated** (13 clips; the throw borrows until clip 14), GPU-compressed pages, reach from the art, Nagapasha; **Meghnad fully animated** (14 clips, 2026-11-05); the hitbox editor follows |
| R4 | Meghnad on foot + the arena + the specials (the Vajra effect reused) + sound | |
| R5 | The 3-Hero lineup, best of three, HUD, timer, pause, reduced motion (a third real Hero or a box stand-in) | |
| R6 | Recovery + coins on a fake clock (ruling 5) | |
| R7 | The device verdict on the owner's reference phone | |
