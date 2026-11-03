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
| KO | 10 | — | Then the dissolve |
| Win | 10 | — | |

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
| All-rounder (Indra) | 1000 | 4 / 3 | 100% | Projectile, 9 px/frame (the balanced numbers) |
| Reach (Meghnad) | 1000 | 4 / 3 | 100% | Charge, 10 px/frame; light and heavy reach **+45 px**, recovery **+2 frames** |
| Balanced | 1000 | 4 / 3 | 100% | Projectile, 9 px/frame |
| Rushdown | 900 | 5 / 4 | 108% | Charge, 10 px/frame |
| Zoner | 950 | 3 / 3 | 95% | Projectile, 11 px/frame |
| Tank | 1150 | 3 / 2 | 100% | Charge, 8 px/frame |

Indra and Meghnad are ruled. The other 11 are ruled as their clips arrive. Meghnad's special as a charge (a spear lunge) is my placeholder, still open.

## The AI (honest-AI rule)

- **What it sees:** only `observe()`, the screen: positions, facing, health, meter, each fighter's state and current move frame, the shots and the clock.
- **What it never sees:** the player's input, buffered presses or contact flag.
- **Reaction delay:** it sees the opponent as they were a reaction time ago (Beginner 18 frames ≈ 300 ms, Advanced 11 ≈ 183 ms, Death Match 9 ≈ 150 ms).
- **Output:** the same input bitmask a player makes, through the same buffer.
- **No stat advantage at any level.** Death Match is a sharper player: it blocks, ducks and cancels more and attacks sooner.

## The Kling clip card (one Hero; Indra shown, Meghnad the same)

**Step 0: the stance still** (an image tool, not Kling). It anchors every clip.
- Start from the Hero's identity master.
  - **Present for both slice Heroes** in `assets/arcade/identity-masters/`: side profile facing right, on green, 1024×1536.
  - They show a **neutral standing pose with no weapon**, so step 0 still has to be made from them.
- The still: **fighting stance**, weight forward, weapon in hand (Indra: the Vajra; Meghnad: his bow or sword, your call), **true side profile facing right**.
- Background chroma green (RGB 0, 185, 62). Use magenta for a Hero dressed in green or teal.
- Canvas **1920×1080**. The Hero about 640 px tall, feet on y = 1000, body centred near x = 700, leaving room in front for strikes.
- No particles, no weapon glow.
- I check it before any clip is made: scale, ground line, profile angle.

**Step 1: the clips.** Image-to-video, 1080p, 16:9, 5 s, the stance still as the **first frame**, and as the **last frame** where your Kling version offers it.

Every prompt starts: *"Static locked camera, side view, no camera movement, no zoom, full body always in frame, plain green background, no environment, no effects beyond the weapon, one action."*

| # | Clip | Action line | Last frame = stance? |
|---|---|---|---|
| 1 | Idle | breathes and shifts weight in place, ready | Yes (loop) |
| 2 | Walk forward | steps forward in place, two steps, stays centred | Yes (loop) |
| 3 | Walk back | steps backward in place, guard up | Yes (only if reversing walk forward fails) |
| 4 | Jump | crouches, leaps straight up, lands in stance | Yes |
| 5 | Crouch | drops low into a guard and holds | No |
| 6 | Light | one quick jab forward, returns to stance | Yes |
| 7 | Heavy | one powerful overhead strike with the weapon, returns to stance | Yes |
| 8 | Special | raises the weapon, divine energy gathers, hurls or unleashes it forward, returns to stance | Yes |
| 9 | Block | raises both arms to guard and holds | No |
| 10 | Hit reaction | flinches back from a blow to the chest, recovers to stance | Yes |
| 11 | KO | staggers and falls to the ground, lies still | No |
| 12 | Win | raises the weapon in triumph, holds | No |

**Step 2: curate.** Reject a clip for any of these:
- the camera drifts or zooms;
- the face, crown or costume drifts from the identity;
- limbs blur into each other;
- the feet leave the ground line when they shouldn't.

Expect about 1.5 takes per clip.

**Step 3: drop.** Put the clips in `lab/arcade/sources/<hero>/` (gitignored), named `<hero>_01_idle.mp4` … `<hero>_12_win.mp4`.

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

## The size budget (ruling 7)

| | Target | Cap |
|---|---|---|
| One fighter, high (cells 320 px tall, about 90 cells, one 4096×2048 sheet) | 1.2 MB | 1.6 MB |
| One fighter, low (192 px, one 2048×2048 sheet) | 0.5 MB | 0.7 MB |
| Arena (4 layers) | 0.6 MB high / 0.3 MB low | 0.9 MB |
| One match (6 fighters + arena; audio reused from the game) | 4 MB low / 8.5 MB high | 6 MB / 11 MB |
| Graphics memory at once (2 fighters + arena + effects) | ≤48 MB low / ≤96 MB high | — |
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
| R3 | Indra as a real fighter: the fighter tool, the hitbox editor | Clip test done (idle + light for Indra and Meghnad); the full 12-clip set and the hitbox editor follow |
| R4 | Meghnad on foot + the arena + the specials (the Vajra effect reused) + sound | |
| R5 | The 3-Hero lineup, best of three, HUD, timer, pause, reduced motion (a third real Hero or a box stand-in) | |
| R6 | Recovery + coins on a fake clock (ruling 5) | |
| R7 | The device verdict on the owner's reference phone | |
