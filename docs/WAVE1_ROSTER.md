# DIVYA YUDDHA — WAVE 1 ROSTER v0.1 (DESIGN DRAFT)
# 88 cards: 22 per faction = 16 GUPTA (earnable at release) + 6 RATNA
# (purchase-first, rotates earnable next season) per LIVE_GAME_DESIGN.
# STATUS: design draft — NOT final until (1) name-collision check vs engine
# DECKS, (2) harness prototyping (500-sim per matchup vs launch baseline as a
# DELIBERATE new-baseline decision), (3) per-card review. No art until locked.
#
# RULES THIS ROSTER OBEYS
# - Ratna philosophy: build-arounds and sidegrades, never strict upgrades.
#   Money buys time, never permanence.
# - Slot competition: 44-into-22 singleton deck building — every card must
#   compete with a launch card for a slot, pulling the faction a SECOND
#   direction so cuts are real choices.
# - Effects use existing engine vocabulary only (On Play / Passive / Round End /
#   Venom / Leap / Shield / Chaos Surge / revive / discard pile / pass), except
#   where flagged [ENGINE+] (new surface, needs an implementation ruling).
# - [DMG] = damage-dealing Astra → MUST be added to ASTRA_DMG (Patala realm
#   design debt). [ARTX] = artifact removal → MUST extend the Yaksha guard.
# - Type structure per faction (mirrors launch shape): 2 Heroes · 12 Units ·
#   3 Astras · 3 Mantras · 2 Artifacts = 22.
# - Rarity spread per faction: 3 Common · 4 Uncommon · 6 Rare · 5 Epic ·
#   3 Legendary · 1 Mythic.

═══════════════════════════════════════════════════════════
## DEVAS — WAVE THEME: "THE VIGIL" 
Launch identity: protection and endurance. Wave direction: protection matures
into RETRIBUTION — units that reward being shielded, surviving, or standing
watch. Second axis: the dawn line (Ushas/Aruna) — small early units that grow.
═══════════════════════════════════════════════════════════
### GUPTA (16)
U  Dawn Sentinel        · Unit    · Common   · P2 · Round End: if this survived the round, +1 permanently.
U  Vedi Keeper          · Unit    · Common   · P3 · On Play: your next Dharma Shield this round is free/instant. [check vs engine shield economy]
U  Gana Warrior         · Unit    · Common   · P3 · Vanilla.
U  Ushas, Dawn Herald   · Unit    · Uncommon · P3 · Passive: your other Units of power 2 or less get +1.
U  Aruna Charioteer     · Unit    · Uncommon · P4 · On Play: if it is Round 1, +2.
U  Ribhu Craftsman      · Unit    · Uncommon · P3 · On Play: your Artifact (if any) cannot be targeted this round. [ENGINE+ light]
M  Savitur Verse        · Mantra  · Uncommon · —  · One friendly Unit gains +1 at the end of every round this match.
U  Kamadhenu            · Unit    · Rare     · P4 · Round End: your lowest-power Unit +1.
U  Dhanvantari          · Unit    · Rare     · P4 · On Play: fully restore one damaged friendly Unit to printed power.
U  Vigil Rakshak        · Unit    · Rare     · P5 · While shielded by Dharma Shield, +2.
A  Agneyastra           · Astra   · Rare     · —  · Deal 3 to an enemy Unit. [DMG]
M  Ratri Hymn           · Mantra  · Rare     · —  · Prevent all Astra damage to your Units this round. [DMG interacts]
U  Kartikeya's Vanguard · Unit    · Epic     · P5 · When a friendly Unit is destroyed, +2 (any source, once per round).
A  Shakti Spear         · Astra   · Epic     · —  · Destroy an enemy Unit of power 4 or less. 
AR Dawn Banner          · Artifact· Epic     · —  · Round start: all friendly Units +1 this round (temporary).
H  KARTIKEYA            · Hero    · Legendary· P8 · Passive: when an enemy Astra resolves against your side, your Units +1 each (permanent).
### RATNA (6)
U  Airavata's Calf      · Unit    · Rare     · P4 · Enters shielded (one free Dharma Shield on itself).
U  Saranyu, Cloud Mare  · Unit    · Epic     · P5 · On Play: swap positions/power-context of two friendly Units. [ENGINE+ positional]
M  Usha's Rebirth       · Mantra  · Epic     · —  · Return your highest-power Unit from discard at printed power; it cannot be shielded this match.
A  Suryastra            · Astra   · Legendary· —  · Deal 2 to ALL enemy Units. [DMG][first Deva AoE — Dharma Shield does not stop AoE: honest text required]
H  GARUDA               · Hero    · Legendary· P7 · On Play: remove all Venom tokens from your side; +1 per token removed.
AR Kalpavriksha         · Artifact· Mythic   · —  · Round End: draw the wish — your lowest-power Unit becomes equal to your highest. [ENGINE+]

═══════════════════════════════════════════════════════════
## ASURAS — WAVE THEME: "THE PRICE" 
Launch identity: aggression and bargains. Wave direction: MAYA (illusion,
copies, deception) + prices made explicit — power now, cost written on the card.
═══════════════════════════════════════════════════════════
### GUPTA (16)
U  Pisacha Skirmisher   · Unit    · Common   · P4 · Round End: −1 permanently (burns bright).
U  Maya Shade           · Unit    · Common   · P2 · On Play: becomes a copy of your lowest-power other Unit. [copy exists via Maricha precedent]
U  Ash Legionnaire      · Unit    · Common   · P3 · Vanilla.
U  Dhumraksha           · Unit    · Uncommon · P4 · On Play: deal 1 to one of YOUR other Units (the price).
U  Simhika              · Unit    · Uncommon · P4 · When an enemy Unit is revived, +2.
A  Mohanastra           · Astra   · Uncommon · —  · An enemy Unit gets −2 this round (temporary).
M  Blood Oath           · Mantra  · Uncommon · —  · Destroy your lowest Unit: draw 2 cards. [draw effects exist? verify vs engine — else +3 to a Unit]
U  Holika               · Unit    · Rare     · P5 · Immune to Astra damage; takes +1 extra from everything else. [DMG interacts]
U  Andhaka              · Unit    · Rare     · P6 · Cannot be targeted while any other friendly Unit is on board.
U  Shumbha              · Unit    · Rare     · P4 · Passive: +1 while Nishumbha is on your board (and vice versa).
U  Nishumbha            · Unit    · Rare     · P4 · Passive: +1 while Shumbha is on your board (and vice versa).
A  Vidyutastra          · Astra   · Rare     · —  · Deal 2 to an enemy Unit; Chaos Surge triggers twice on this card. [DMG]
U  Mahishasura          · Unit    · Epic     · P7 · Round End: −2 unless an enemy Unit was destroyed this round.
M  Raktabija's Curse    · Mantra  · Epic     · —  · When your next Unit is destroyed this round, spawn two 2-power Rakta tokens. [token spawn: Venom-token pipeline precedent]
AR Mayasura's Blueprint · Artifact· Epic     · —  · Your Astras cost no turn (play one extra card the turn you play an Astra), once per round. [ENGINE+ tempo]
H  VRITRA               · Hero    · Legendary· P8 · On Play: an enemy Unit is bound (contributes 0) while Vritra remains. [Takshaka/Nagapasha bind precedent]
### RATNA (6)
U  Surpanakha           · Unit    · Rare     · P4 · On Play: an enemy Unit gets −1 permanently.
U  Atikaya              · Unit    · Epic     · P6 · Enters with −2 if you have not passed this match; +2 if you have. [pass mechanics: Mahabali precedent]
A  Brahmadanda          · Astra   · Epic     · —  · Negate the next enemy Astra this round. [counter — weakest reading per engine rule]
M  Maya Veil            · Mantra  · Epic     · —  · Your Units cannot be targeted by Astras this round (AoE still hits). [DMG interacts]
H  MAHISHI              · Hero    · Legendary· P7 · Round End: becomes a copy of the strongest Unit on the board (keeps Hero status). [ENGINE+]
AR The Iron Crucible    · Artifact· Mythic   · —  · Your Units' "price" effects (self-damage/decay) are halved, rounded down. [ENGINE+ tag system]

═══════════════════════════════════════════════════════════
## VANARAS — WAVE THEME: "THE BRIDGE" 
Launch identity: swarm and momentum. Wave direction: SETU (formation) — 
adjacency and board-position payoffs (Leap adjacency already exists in engine),
plus the allies of the host: birds, bears, sages.
═══════════════════════════════════════════════════════════
### GUPTA (16)
U  Setu Mason           · Unit    · Common   · P2 · Passive: +1 while adjacent to another Vanara. [Leap adjacency surface]
U  Drummer of the Host  · Unit    · Common   · P2 · On Play: adjacent Units +1 this round.
U  Kishkindha Runner    · Unit    · Common   · P3 · Vanilla.
U  Gavaksha             · Unit    · Uncommon · P3 · On Play: may swap places with another friendly Unit. [ENGINE+ positional]
U  Panasa               · Unit    · Uncommon · P4 · +1 while your board is wider than the enemy's (more Units).
U  Kumuda               · Unit    · Uncommon · P3 · When this Leaps or is Leapt to, +1 permanently.
M  Song of the Crossing · Mantra  · Uncommon · —  · All friendly Units in one row +1; +2 instead if 4 or more Units there.
U  Sushena the Healer   · Unit    · Rare     · P4 · Round End: restore 1 power to each adjacent damaged Unit.
U  Sampati              · Unit    · Rare     · P5 · On Play: reveal the enemy's highest-power card in hand. [ENGINE+ info — else: +2 if enemy hand larger than yours]
U  Vinata's Talon       · Unit    · Rare     · P4 · On Play: deal 1 to an enemy Unit per two friendly Vanaras on board (max 3).
A  Vayavyastra          · Astra   · Rare     · —  · Return an enemy Unit of power 4 or less to its owner's hand. [ENGINE+ bounce — else: −3 this round]
M  Matanga's Blessing   · Mantra  · Rare     · —  · Your next Leap this round grants +2 to both Units (stacks with Crown).
U  Gandhamadana         · Unit    · Epic     · P5 · Passive: your Leaps may target this Unit from anywhere (ignores adjacency).
A  Jatayu's Last Flight · Astra   · Epic     · —  · Destroy an enemy Unit with power greater than 6 (only the mighty). 
AR The Setu Stones      · Artifact· Epic     · —  · Your Units enter adjacent to any friendly Unit you choose (formation control). [ENGINE+ positional]
H  MAKARDHWAJA          · Hero    · Legendary· P7 · On Play: Leap (copy strength per engine rule) from Hanuman if he is on board; otherwise from your strongest Unit.
### RATNA (6)
U  Swayamprabha         · Unit    · Rare     · P3 · On Play: look at the top 3 cards of your deck; put one in hand. [draw surface — verify]
U  Rambha the Bold      · Unit    · Epic     · P5 · When any friendly Unit Leaps, Rambha +1 permanently.
M  Vault of the Sky     · Mantra  · Epic     · —  · Move a friendly Unit anywhere on your side; it gains +2 this round. [ENGINE+ positional]
A  Anjaneya's Roar      · Astra   · Legendary· —  · All enemy Units −1 this round; your adjacent pairs +1 each.
H  ANJANA               · Hero    · Legendary· P6 · Passive: your Leap limit per round is increased by 1; Leaps to adjacent Units cost nothing extra. [engine Leap economy check]
AR The Living Bridge    · Artifact· Mythic   · —  · Round End: if your Units form one unbroken adjacent line of 4+, all of them +1 permanently. [ENGINE+ positional]

═══════════════════════════════════════════════════════════
## NAGAS — WAVE THEME: "THE DEEP" 
Launch identity: attrition and inevitability. Wave direction: the CORPSE
ECONOMY — the discard pile as a resource — and token mastery (moving, doubling,
harvesting Venom).
═══════════════════════════════════════════════════════════
### GUPTA (16)
U  Patala Hatchling     · Unit    · Common   · P2 · On Play: apply 1 Venom to a random enemy Unit.
U  Coil Sentry          · Unit    · Common   · P3 · Vanilla.
U  Molting Naga         · Unit    · Common   · P2 · When destroyed, apply 1 Venom to the Unit that has the highest enemy power.
U  Venom Harvester      · Unit    · Uncommon · P3 · On Play: +1 per Venom token on the enemy's strongest Unit (max +3).
U  Shankhapala          · Unit    · Uncommon · P4 · Round End: move 1 Venom token from one enemy Unit to another (your choice).
U  Depth Caller         · Unit    · Uncommon · P3 · On Play: if any friendly Unit is in the discard pile, +2.
M  Rite of Shed Skin    · Mantra  · Uncommon · —  · Return a friendly Unit to hand; it re-enters this match at printed power. [ENGINE+ bounce-self]
U  Mahapadma            · Unit    · Rare     · P5 · Passive: enemy Units with Venom cannot receive Dharma Shield. [cross-faction check]
U  Grave-Tide Naga      · Unit    · Rare     · P4 · On Play: +1 per Unit in EITHER discard pile (max +4).
U  Padma the Pale       · Unit    · Rare     · P4 · When an enemy Unit dies with Venom on it, Padma +2 permanently.
A  Kalakuta Vial        · Astra   · Rare     · —  · Apply 2 Venom tokens to one enemy Unit.
M  Hymn of the Depths   · Mantra  · Rare     · —  · All Venom drains trigger immediately, once, right now. [Karkotaka timing precedent]
U  Uraga Colossus       · Unit    · Epic     · P7 · Enters with 2 Venom on ITSELF (the price); sheds 1 per round.
A  Serpent's Kiss       · Astra   · Epic     · —  · Destroy an enemy Unit that has 2 or more Venom tokens.
AR The Drowned Altar    · Artifact· Epic     · —  · Round End: put the top card of your deck into your discard; your Units +1 if it was a Unit. [ENGINE+ mill]
H  PADMAVATI            · Hero    · Legendary· P7 · Round End: apply 1 Venom to the strongest enemy Unit.
### RATNA (6)
U  Silt Strangler       · Unit    · Rare     · P4 · On Play: an enemy Unit loses power equal to its Venom tokens (then tokens remain).
U  Nahusha, Fallen King · Unit    · Epic     · P6 · Enters as an enemy realm: while on board, YOUR realm effect applies twice, the enemy's not at all. [ENGINE+ heavy — flag for redesign if too invasive]
A  World-Coil Constrictor· Astra  · Epic     · —  · Bind an enemy Unit (contributes 0) until it loses a Venom token. [bind precedent]
M  The Long Patience    · Mantra  · Epic     · —  · Skip your turn: apply 1 Venom to EVERY enemy Unit. [pass-adjacent; verify turn economy]
H  KULIKA               · Hero    · Legendary· P8 · On Play: transfer all Venom tokens from friendly Units to enemy Units (random spread).
AR Throne of the Second King · Artifact · Mythic · — · Your Venom drains steal the power instead of destroying it: the strongest friendly Unit gains what Venom takes. [ENGINE+ — the wave's crown jewel; sim hard]

═══════════════════════════════════════════════════════════
## ENGINE-IMPACT REGISTER (implementation gates)
═══════════════════════════════════════════════════════════
[DMG] additions to ASTRA_DMG (Patala realm +1): Agneyastra, Suryastra,
Vidyutastra — and REVIEW: does "deal N" as a class need a general tag now
instead of a hardcoded set? Recommend yes at implementation.
[ARTX]: none in wave 1 by design (Yaksha guard untouched) — deliberate: the
second artifact-destroyer waits for wave 2 so Vishwakarma keeps its identity.
[ENGINE+] surfaces needing rulings before lock (each is optional — every
flagged card has a fallback simplification noted or derivable):
positional (Saranyu, Gavaksha, Setu Stones, Vault of the Sky, Living Bridge) —
one shared "move/place" primitive serves all five; info-reveal (Sampati);
draw (Blood Oath, Swayamprabha); bounce (Vayavyastra, Rite of Shed Skin);
copy-hero (Mahishi); price-tag system (Iron Crucible); realm override
(Nahusha — flag for possible redesign); mill (Drowned Altar); Venom-steal
(Throne of the Second King).

## VALIDATION PROTOCOL (before any art)
1. Collision check: every name vs engine DECKS (this draft avoided all known
   launch names; the engine is the authority).
2. Rulings pass: each effect rewritten to weakest-defensible reading; new
   rulings logged R21+ in GDD_DELTAS.
3. Harness: prototype in engine behind a wave1 flag; 500-sim all 10 matchups
   with wave-1 pools; this is a DELIBERATE new-baseline decision — target: no
   faction crosses ±3 from launch win rates; the Deva–Naga designed counter
   stays a counter.
4. Ratna audit: sim Gupta-only decks vs Ratna-inclusive decks per faction;
   Ratna advantage must be ≈0 (different, not better).
5. Only then: art briefs (88 MJ sessions, existing pipeline + naming convention).
