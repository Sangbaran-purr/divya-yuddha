# DIVYA YATRA — BOOK 1 CUTSCENE PRODUCTION BIBLE v1.0
# Frame-by-frame art + motion design for the Samudra Manthan.
# Companion to BOOK1_DESIGN.md §5. ~28 panels + 4 character sheets.

═══════════════════════════════════════════════════════
## 0. PIPELINE & TECHNICAL SPECS
═══════════════════════════════════════════════════════
- Aspect: --ar 2:3 (portrait, matches boards & phone). No text in image, ever —
  text lives on the plate layer.
- Every panel prompt ends with the STYLE ANCHOR: --sref <canonical card art URLs>
  (pick 2 painterly Deva cards, e.g. a hero + an astra, upload once, reuse the
  same sref for ALL panels — one world, one brush).
- Every panel containing a character adds --cref <that character's sheet> --cw 85.
- KEN BURNS RULE: panels are displayed at minimum scale 1.05 so pans never reveal
  edges. Compose with ~10% safe margin — nothing critical in the outer tenth.
- Delivery: upscale pick → send to Claude → compressed to ~200–280 KB JPEG,
  named b1c{chapter}_{slot}.jpg (slots: i1,i2,i3 intro · m1 mid · v1 victory).
- Lazy-load: only the current chapter's panels fetch. Budget ≈ 7 MB total,
  never more than ~1 MB in flight.
- Sensitivity note: deities render in the established card-art style (the game
  already does this respectfully). Shiva, if shown at all (ch5 option), is a
  silhouette with the blue-throat glow — never a face. Mohini: silhouette only.

═══════════════════════════════════════════════════════
## 1. CHARACTER SHEETS (blocking — generate FIRST)
═══════════════════════════════════════════════════════
Workflow per character: generate the sheet prompt → pick the strongest single
FACE/FIGURE (not a grid collage — --cref wants one clean reference) → upscale →
that image URL becomes the character's --cref for the whole book. Test each
sheet once: generate a random scene with the cref and confirm the face holds.

**BRIHASPATI** (the tutor — appears most; lock him first)
> character portrait, elderly Indian guru sage, long white beard, deep saffron
> robes, rudraksha mala beads, tall staff, gentle face with severe wise eyes,
> golden dusk light, painterly, three-quarter view, plain dark background
> --ar 2:3

**INDRA** (king of Devas)
> character portrait, regal Indian storm god king, golden ornate crown and
> armor, storm-grey eyes, faint lightning motifs on gold, proud bearing, dark
> monsoon sky behind, painterly, three-quarter view --ar 2:3

**SHUKRACHARYA** (the antagonist)
> character portrait, silver-haired Indian sage of the Asuras, one blind
> pale eye, austere white robes with crimson trim, cold brilliant expression,
> holding a curved blade of moonlight, dark red dusk behind, painterly,
> three-quarter view --ar 2:3

**VASUKI** (the serpent — match the card art's serpent design language)
> colossal celestial king cobra, iridescent teal-black scales, ornate golden
> hood ornament, ancient patient eyes, coiled around a stone mountain peak,
> painterly, dramatic scale --ar 2:3

Environment plates (no cref needed): SWARGA GATES (ivory-gold), THE OCEAN OF
MILK (moonlit silver-blue sea, Mount Mandara as churning rod), THE BLACKENED
OCEAN (ch5 variant). Generate once, reuse across chapters for continuity.

═══════════════════════════════════════════════════════
## 2. MOTION VOCABULARY (the "slight movement" grammar)
═══════════════════════════════════════════════════════
Five moves, each with a fixed emotional meaning — used consistently, the
audience learns the grammar without knowing it:

- PUSH-IN  (scale 1.05→1.18, toward a face/object) = tension, focus, threat
- PULL-OUT (1.18→1.05, revealing the whole)        = awe, scale, revelation
- DRIFT-L / DRIFT-R (lateral pan, scale ~1.10)     = journey, passage, armies
- RISE     (pan upward)                             = hope, emergence, divinity
- SINK     (pan downward)                           = dread, descent, poison

Durations: 6–9s per panel (tap to advance any time). Easing: ease-out for
push/pull, linear for drifts. Crossfade between panels: 0.8s.
VFX overlays (existing module): embers (battle/dusk), smoke (poison/aftermath),
lightning flash (betrayal only — spend it once so it lands).
Each panel below is specced: MOTION · VFX · AMBIENCE/SFX · PLATE (the text).

═══════════════════════════════════════════════════════
## 3. FRAME BY FRAME
═══════════════════════════════════════════════════════

── CH.1 — THE THRONE BESIEGED ──────────────────────────
**b1c1_i1 — The Gates at Dusk**
> the golden gates of Swarga at dusk, vast ivory walls and gold spires, long
> shadows, empty ramparts, ominous calm, painterly --ar 2:3 --sref …
MOTION: SINK (from spires down to the shut gate). VFX: none. AMBIENCE: swarga
wind bed (future). PLATE: "Swarga. The high seat of the gods — and tonight,
a city holding its breath."

**b1c1_i2 — Raiders on the Ridge**
> silhouettes of demon raiders on a dark ridge at dusk, crimson banners,
> spearpoints against a burning horizon, distance and menace, painterly
MOTION: DRIFT-R along the silhouette line. VFX: sparse embers. PLATE:
"Shukracharya's raiders test the borders. Not an army — a question."

**b1c1_i3 — The Guru and the King**  (cref: Brihaspati + Indra)
> an elderly saffron-robed guru placing a steadying hand on a golden-armored
> storm king's shoulder, torchlit palace interior, quiet resolve, painterly
MOTION: PUSH-IN on the two faces. VFX: none. PLATE: Brihaspati — "The gate
holds only if someone stands at it, Indra. Come. I will show you how walls
are made."

**b1c1_v1 — Victory: The Line Held**
> deva warriors standing on lit ramparts at night, banners upright, the ridge
> beyond empty, calm after threat, painterly
MOTION: PULL-OUT. VFX: sparse embers fading. PLATE: "The question was asked.
The answer was a wall of the living."

── CH.2 — THE ART OF YIELDING ──────────────────────────
**b1c2_i1 — The Horde**
> a vast demon army filling a valley at dawn, endless crimson banners, dust
> and iron, overwhelming numbers, seen from the walls above, painterly
MOTION: DRIFT-L across the mass (scale of the problem). VFX: dust-tinted
smoke, low. PLATE: "They came back. All of them."

**b1c2_i2 — The Unafraid**  (cref: Brihaspati)
> an elderly saffron-robed guru standing calmly alone on a wall while soldiers
> panic behind him, wind in his robes, serene against dawn, painterly
MOTION: PUSH-IN slow on his stillness. PLATE: Brihaspati — "Fury spends
itself fastest on an empty field. Let them have the morning."

**b1c2_i3 — The Yielded Field**
> an abandoned battlefield position at dawn, planted banners left standing in
> empty ground, the army withdrawn to a far ridge in good order, painterly
MOTION: PULL-OUT from a single banner to the empty field. PLATE: "We do not
lose the morning. We lend it."

**b1c2_v1 — Victory: The Mathematics of Patience**
> deva forces sweeping down at midday onto an exhausted scattered demon army,
> golden light breaking through dust, momentum reversed, painterly
MOTION: DRIFT-R with the charge. VFX: embers. PLATE: "They spent everything
to win a field we never wanted. The afternoon belonged to arithmetic."

── CH.3 — THE WEAPONS OF HEAVEN ────────────────────────
**b1c3_i1 / m1 — The Blade Raised**  (cref: Shukracharya — DOUBLE DUTY:
intro panel AND the mid-match telegraph before his Astra turn)
> a silver-haired one-eyed sage raising a curved blade of moonlight overhead,
> cold white fire along its edge, crimson dusk sky, terrible and beautiful,
> painterly
MOTION: intro = PUSH-IN on the blade; mid-match reuse = the same panel, faster
push (4s) + screen dim. VFX: none intro / astra-glow flash on the mid reuse.
PLATE (intro): "Shukracharya no longer asks questions." PLATE (mid): "The
blade seeks your champion."

**b1c3_i2 — The Shield Ignites**
> a translucent golden mandala shield igniting around a deva warrior, sacred
> geometry of light, calm inside the storm, painterly
MOTION: RISE (shield blooms upward). VFX: none (the shield IS the effect).
PLATE: Brihaspati — "Shield first. Strike after."

**b1c3_i3 — The Arena of Heaven**  (REUSE: this is board_swarga.jpg itself,
re-motioned — zero new art)
MOTION: PULL-OUT from the lotus mandala to the whole arena. PLATE: "Swarga
itself takes the field. Read the sky before you read your hand."

**b1c3_v1 — Victory: Answered in Kind**
> a golden astra of light mid-flight over a battlefield, demons recoiling,
> divine retaliation, painterly
MOTION: DRIFT-R with the astra. VFX: embers + brief glow. PLATE: "Heaven's
weapons answer only when heaven is ready."

── CH.4 — THE CHURNING BEGINS ──────────────────────────
**b1c4_i1 — The Serpent and the Mountain**  (cref: Vasuki)
> a colossal teal-black celestial serpent coiled around a stone mountain
> rising from a moonlit silver ocean, gods on one shore demons on the other,
> mythic scale, painterly
MOTION: PULL-OUT (the full impossible scale). PLATE: "A truce, of a kind.
The ocean of milk holds treasures neither side can raise alone."

**b1c4_i2 — Pulling as One**
> two lines of figures hauling a great serpent-rope in opposite rhythm, gods
> golden on one side, demons crimson on the other, spray and strain, painterly
MOTION: DRIFT-L then DRIFT-R is not possible — use slow DRIFT-L (the rhythm).
PLATE: "Deva and Asura, hand over hand. The world holds its breath."

**b1c4_i3 — The Ocean Wakes**
> a moonlit ocean beginning to glow from below, silver water turning gold at
> the churn point, first treasures as lights beneath the surface, painterly
MOTION: RISE from the depths glow to the surface. PLATE: "And the deep
began to give."

**b1c4_v1 — Victory: What the Word Returns**
> a fallen deva warrior rising renewed inside a column of soft golden light,
> comrades turning in wonder, painterly
MOTION: RISE with him. PLATE: "What the churning takes, the sacred word
returns."

── CH.5 — THE POISON RISES ─────────────────────────────
**b1c5_i1 — The Water Blackens**  (environment reuse: ocean plate, darkened
variant — generate as its own image)
> the moonlit ocean turning black-green from its center outward, dying light,
> wrongness spreading across silver water, painterly
MOTION: SINK (the spread downward-outward). VFX: low smoke. PLATE: "Before
the nectar — the price. The ocean's first gift was Halahala."

**b1c5_i2 — Halahala**
> a towering column of black-green poison smoke rising from a dark ocean,
> shapes almost forming inside it, gods and demons shielding their faces,
> painterly
MOTION: RISE with the column (dread inverted — rising IS the threat here;
the one deliberate grammar break in the book). VFX: heavy smoke overlay.
PLATE: "It did not attack. It simply was — and everything near it lessened."
(OPTIONAL third beat, taste call: a blue-throated silhouette drinking the
column down — Shiva, silhouette only. If skipped, the plate carries it:
"One drank it, so the worlds would not.")

**b1c5_i3 — The Serpents Turn**
> many pairs of serpent eyes opening in poisoned dark water, teal glints in
> blackness, patient hunger, painterly
MOTION: PUSH-IN into the dark between two eyes. PLATE: "The Nagas drank what
spilled. And remembered whose churning spilled it."

**b1c5_v1 — Victory: Cleansed**
> black poison mist burning away off deva armor in threads of white-gold
> light, warriors breathing again, dawn returning to the water, painterly
MOTION: RISE, slow. VFX: smoke dissipating (reverse density). PLATE: "Poison
does not duel. But it can be answered."

── CH.6 — THE NECTAR AND THE NET ───────────────────────
**b1c6_i1 — The Kalasha Rises**
> an ornate golden vessel breaking the surface of a glowing ocean, radiant
> but contained light, water sheeting off gold, the single most beautiful
> object in the world, painterly
MOTION: RISE with the vessel. PLATE: "Last of all, carried in a vessel of
gold — Amrita. The undying draught."

**b1c6_i2 — Every Hand**
> a ring of hands, godly golden and demon crimson, all reaching toward a
> radiant golden vessel at center, tension in every tendon, painterly
MOTION: PUSH-IN on the vessel between the hands. PLATE: "Everything with a
claim converged. Truces are mortal too."

**b1c6_v1 — Victory: The Quiet Engine**
> the golden vessel resting on a deva altar, pouring soft light without
> diminishing, guards at ease around it, painterly
MOTION: PULL-OUT, gentle. PLATE: "Some treasures do not strike. They simply
refuse to stop giving."

── CH.7 — THE BETRAYAL (BOSS) ──────────────────────────
**b1c7_i1 — The Theft**  (cref: Shukracharya)
> a silver-haired one-eyed sage mid-stride seizing a radiant golden vessel,
> robes whipping, triumph and cold fire in his face, chaos erupting behind,
> painterly
MOTION: PUSH-IN hard (5s — faster than the book's norm). PLATE: "The truce
died where it stood."

**b1c7_i2 / m1 — The Sky Breaks**  (DOUBLE DUTY: intro + the boss's
Chandrahas turn) 
> two armies wheeling to face each other under a splitting storm sky, gold
> against crimson, the moment before the first blow, painterly
MOTION: PULL-OUT to the full field. VFX: THE LIGHTNING FLASH — the book's
single use. SFX: sfx_brahmastra rumble under the flash. PLATE (intro): "And
the last battle of the churning began." PLATE (mid): "The moon-blade is
drawn. Everything he has, at once."

**b1c7_v1 — Victory: Reclaimed**
> the golden vessel held aloft by deva hands under a clearing sky, crimson
> banners falling in the distance — and in the far corner, a slender feminine
> silhouette watching, unremarked, painterly
MOTION: RISE to the vessel, then a 1s hold where the DRIFT-L nudges toward
the silhouette (the Book 2 hook, delivered by the camera, not the text).
VFX: embers settling. PLATE: "The Amrita came home. As for how it STAYED
home — that is another book."

── SHARED ─────────────────────────────────────────────
**b1_defeat** (one panel serves all chapters)
> an elderly saffron-robed guru seated by a low fire at night, unhurried,
> a place left open beside him, painterly  (cref: Brihaspati)
MOTION: PUSH-IN very slow. PLATE: "Defeat is a teacher with poor manners.
Sit with the lesson; then stand."

═══════════════════════════════════════════════════════
## 4. PANEL ECONOMY
═══════════════════════════════════════════════════════
New images: 24 (3 reuses: swarga board as c3_i3; c3_i1 and c7_i2 double as
mid-match panels). Plus 4 character sheets + 2–3 environment plates that fold
into panels above. Victory/defeat panels are the cut list if sessions run
long — chapters play fine with intro panels + text-plate victories.

═══════════════════════════════════════════════════════
## 5. SESSION ORDER & PER-PANEL CHECKLIST
═══════════════════════════════════════════════════════
Session 1: the 4 character sheets + cref hold-test. NOTHING else until these lock.
Session 2: CH1 + CH2 (7 panels) — the shipped vertical slice gets art first.
Session 3: CH3 + CH4 (7). Session 4: CH5 + CH6 (6). Session 5: CH7 + defeat (4).

Per-panel picks, in veto order:
1. Character on-model? (face vs the cref sheet — the only unfixable failure)
2. No text/glyphs anywhere?
3. Composition survives the planned motion? (subject not in the outer 10%)
4. Palette on the chapter's arc? (dusk-gold → ivory → ocean-silver → poison
   black-green → radiant gold → storm steel: the book's color story)
Send picks in chapter batches → compression, naming, and the manifest entries
come back ready for the repo.
