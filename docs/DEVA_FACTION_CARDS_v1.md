# DIVYA YUDDHA — DEVA FACTION CARD COMPENDIUM v1 (FINAL — 44/44)
# 44 cards: 22 LAUNCH + 22 WAVE 1 (16 Gupta + 6 Ratna, marked ✦RATNA).
# ABILITY lines: ENGINE-VERBATIM from the 2026-07-16 pull (src/engine.js
# is the sole authority for rules text — the Indra's Net rule).
# LAUNCH FLAVOR: from CardRoster v1.0 Lore (pre-frame draft — the shipped
# frames are final authority if any line was refined at Canva time).
# WAVE FLAVOR: canonical, from docs/DEVA_WAVE_ART_DIRECTION.md (2026-07-16
# grep -A1, 2026-07-16). COMPLETE — 44/44.
# EPITHETS: each card heading's "NAME — EPITHET" mirrors the engine def's
# `sub` field verbatim (T39 verified: Indra→"King of Devas", Agni→"Flame of
# Sacrifice", Varuna→"Lord of Oceans", …). src/engine.js is the single source;
# this doc renders it. The Collection grid reads def.sub live — there is no
# epithet map to keep in sync. (T39 ruling: a planned docs/DEVA_WAVE_EPITHETS_v1.md
# never existed in the repo and is formally dead; all 176 cards already carry
# their epithet in-engine.)
# FLAG FOR RULING: Vayu's engine text ends with the dev annotation
# "(v0.1: swap omitted)" — player-facing text carrying a dev note;
# candidate for a cleanup delta.

═══════════════════════════════════════════
## LAUNCH SET (22)
═══════════════════════════════════════════

INDRA — KING OF DEVAS
Power: 7
Type: Hero
Rarity: Legendary
Ability:
PASSIVE: All Deva Units gain +1 power while Indra is on the board.
Flavor:
"Wielder of Vajra, Protector of the Heavenly Gates"

AGNI — FLAME OF SACRIFICE
Power: 5
Type: Hero
Rarity: Epic
Ability:
TRIGGERED: Whenever any Mantra is played, deal 1 damage to a random enemy Unit.
Flavor:
"In every sacred fire, he listens. In every offering, he rises"

VARUNA — LORD OF OCEANS
Power: 6
Type: Hero
Rarity: Epic
Ability:
PASSIVE: Opponent cannot play more than 1 Astra per round.
Flavor:
"None escape the gaze of the deep"

SURYA DEV — RADIANCE OF DAWN
Power: 6
Type: Unit
Rarity: Epic
Ability:
ON PLAY: All other friendly Units gain +1 power.
Flavor:
"Each dawn he rides, setting light against the darkness"

BRIHASPATI — GURU OF THE GODS
Power: 5
Type: Unit
Rarity: Epic
Ability:
ON PLAY: Copy the effect of the last Mantra played by either player.
Flavor:
"The teacher of gods needs no weapon. Knowledge is enough"

VAYU — THE INVISIBLE FORCE
Power: 5
Type: Unit
Rarity: Rare
Ability:
ON PLAY: The highest power enemy Unit loses 2 power. (v0.1: swap omitted)
Flavor:
"He moves unseen. His touch is the last thing you feel"

VISHWAKARMA — DIVINE ARCHITECT
Power: 4
Type: Unit
Rarity: Rare
Ability:
ON PLAY: Destroy the opponent's Artifact. Gain +2 power for each Artifact destroyed this game.
Flavor:
"He built the weapons of gods. He can unmake them too"

KUBERA — LORD OF WEALTH
Power: 3
Type: Unit
Rarity: Rare
Ability:
ON PLAY: Draw 2 cards. If both are Units they gain +1 power each.
Flavor:
"His treasury holds more than gold. It holds leverage"

URVASHI — THE ETERNAL APSARA
Power: 4
Type: Unit
Rarity: Rare
Ability:
ON PLAY: Opponent discards their highest power card from hand.
Flavor:
"One glance. One curse. One eternity of consequence"

YAMA — LORD OF DHARMA
Power: 6
Type: Unit
Rarity: Epic
Ability:
PASSIVE: Destroyed friendly Units leave a 1-power ghost token behind.
Flavor:
"Death is not his weapon. Justice is"

SARASWATI — VOICE OF CREATION
Power: 4
Type: Unit
Rarity: Rare
Ability:
ON PLAY: Look at opponent's hand. Lock one card — it cannot be played this round.
Flavor:
"She does not fight. She simply removes the possibility of your victory"

ASHWINI KUMARS — TWIN HEALERS
Power: 3
Type: Unit
Rarity: Uncommon
Ability:
ON PLAY: Restore 2 power to the most wounded friendly Unit.
Flavor:
"Where they walk, wounds close and the fallen rise"

MARUT — STORM SOLDIER
Power: 3
Type: Unit
Rarity: Common
Ability:
ON PLAY: If Vayu is on your board, gain +3 power.
Flavor:
"Children of the wind, soldiers of the storm"

GANDHARVA — CELESTIAL WARRIOR
Power: 2
Type: Unit
Rarity: Common
Ability:
ON PLAY: If 3+ friendly Units are on the board, gain +2 power.
Flavor:
"He fights not for glory but because harmony demands it"

DEVA SOLDIER — KEEPER OF ORDER
Power: 2
Type: Unit
Rarity: Common
Ability:
PASSIVE: While Indra is on the board, gains +1 power at the start of each of your turns.
Flavor:
"Ten thousand soldiers hold Swarga's gates. Each one is unbreakable"

VAJRA — THUNDERBOLT OF INDRA
Power: N/A
Type: Astra
Rarity: Legendary
Ability:
Destroy one enemy Unit with power 6+. If Indra is on your board: destroy ANY enemy Unit.
Flavor:
"The thunderbolt that split mountains and silenced kings. It does not miss"

BRAHMASTRA — THE ULTIMATE WEAPON
Power: N/A
Type: Astra
Rarity: Mythic
Ability:
Destroy ALL enemy Units. Overrides all shields and immunities.
Flavor:
"When Brahmastra is invoked, the earth itself remembers it and trembles"

SUDARSHANA CHAKRA — DISC OF VISHNU
Power: N/A
Type: Astra
Rarity: Mythic
Ability:
Remove one enemy Hero for this round. It returns next round at half power.
Flavor:
"It always returns to Vishnu's finger. Always"

GAYATRI MANTRA — LIGHT OF ALL WORLDS
Power: N/A
Type: Mantra
Rarity: Rare
Ability:
Revive the lowest power friendly Unit from your discard pile at full power, with Dharma Shield.
Flavor:
"The oldest prayer in creation. It does not ask for victory. It asks for clarity. Clarity is enough"

PAVAMANA — THE PURIFYING CHANT
Power: N/A
Type: Mantra
Rarity: Uncommon
Ability:
Heal all wounded friendly Units to full. Each healed unit gains +1 power.
Flavor:
"What fire cannot purify, the sacred word can. What the sacred word touches becomes untouchable"

AMRITA KALASHA — VESSEL OF IMMORTALITY
Power: N/A
Type: Artifact
Rarity: Mythic
Ability:
ON PLAY: Your lowest power Unit gains +2. If that unit is destroyed this round, it revives at 1 power (once).
Flavor:
"The nectar of immortality was churned from poison and darkness. What survives the churning cannot be broken"

DHARMA KAVACHA — SHIELD OF SACRED LAW
Power: N/A
Type: Artifact
Rarity: Rare
Ability:
PASSIVE: Dharma Shield protects TWO Units instead of one.
Flavor:
"Dharma does not merely protect the righteous. It strengthens them with every test they endure"

═══════════════════════════════════════════
## WAVE 1 — "THE VIGIL" (22)
Wave flavor: canonical — complete
═══════════════════════════════════════════

DEVA SAINIKA
Power: 3
Type: Unit
Rarity: Common
Ability:
A steadfast soldier of the celestial line.
Flavor:
"The line holds because someone is the line."

DAWN SENTINEL
Power: 2
Type: Unit
Rarity: Common
Ability:
ROUND END: If it survived the round, gain +1 power permanently.
Flavor:
"Outlast the night. Grow by the morning."

VEDI KEEPER
Power: 3
Type: Unit
Rarity: Common
Ability:
ON PLAY: Your next Dharma Shield this round is applied instantly (one extra shield this round).
Flavor:
"The altar fire is never allowed to gutter."

USHAS, DAWN HERALD
Power: 3
Type: Unit
Rarity: Uncommon
Ability:
PASSIVE: Your other Units with 2 or less power gain +1.
Flavor:
"She wakes the small ones first."

ARUNA CHARIOTEER
Power: 4
Type: Unit
Rarity: Uncommon
Ability:
ON PLAY: If it is Round 1, gain +2 power.
Flavor:
"He arrives before the light does."

RIBHU CRAFTSMAN
Power: 3
Type: Unit
Rarity: Uncommon
Ability:
ON PLAY: Your Artifact cannot be targeted or destroyed this round.
Flavor:
"What the Ribhus make, the Ribhus keep."

SAVITUR VERSE
Power: N/A
Type: Mantra
Rarity: Uncommon
Ability:
Choose a friendly Unit: it gains +1 at the end of every round, while it lives.
Flavor:
"Sung once at dusk, answered every dawn."

KAMADHENU
Power: 4
Type: Unit
Rarity: Rare
Ability:
ROUND END: Your lowest-power Unit gains +1.
Flavor:
"She gives to whoever has least. That is the whole of her law."

DHANVANTARI
Power: 4
Type: Unit
Rarity: Rare
Ability:
ON PLAY: Restore one friendly Unit to its printed power.
Flavor:
"There is no wound older than his medicine."

VIGIL RAKSHAK
Power: 5
Type: Unit
Rarity: Rare
Ability:
PASSIVE: While shielded, +2 power.
Flavor:
"Guard the guard, and nothing falls."

AGNEYASTRA
Power: N/A
Type: Astra
Rarity: Rare
Ability:
Deal 3 damage to an enemy Unit.
Flavor:
"Agni takes his tribute in one breath."

RATRI HYMN
Power: N/A
Type: Mantra
Rarity: Rare
Ability:
This round, prevent all Astra damage to your Units.
Flavor:
"Night is also a goddess. Ask her for cover."

KARTIKEYA'S VANGUARD
Power: 5
Type: Unit
Rarity: Epic
Ability:
PASSIVE: The first time a friendly Unit is destroyed each round, this gains +2 power.
Flavor:
"The first to fall is never unanswered."

SHAKTI SPEAR
Power: N/A
Type: Astra
Rarity: Epic
Ability:
Destroy an enemy Unit with 4 or less power.
Flavor:
"Thrown once, at a mountain. The mountain moved."

DAWN BANNER
Power: N/A
Type: Artifact
Rarity: Epic
Ability:
PASSIVE: From the next round on, your Units have +1 power each round.
Flavor:
"Plant it at dusk. It pays at dawn."

KARTIKEYA
Power: 8
Type: Hero
Rarity: Legendary
Ability:
PASSIVE: When an enemy Astra resolves against your side, all your Units gain +1 power permanently.
Flavor:
"Every weapon they spend teaches his army the answer."

AIRAVATA'S CALF   ✦RATNA
Power: 4
Type: Unit
Rarity: Rare
Ability:
Enters with a Dharma Shield (respects your shield limit).
Flavor:
"Born under the king's own shadow."

SARANYU, CLOUD MARE   ✦RATNA
Power: 5
Type: Unit
Rarity: Epic
Ability:
ON PLAY: Two friendly Units exchange current power.
Flavor:
"She traded shapes with her own shadow once. Power is easier."

DAWN'S REBIRTH   ✦RATNA
Power: N/A
Type: Mantra
Rarity: Epic
Ability:
Return your highest-power Unit from the discard at its printed power. It cannot be shielded for the rest of the match.
Flavor:
"Some return too bright for any shield to hold."

SURYASTRA   ✦RATNA
Power: N/A
Type: Astra
Rarity: Legendary
Ability:
Deal 2 damage to ALL enemy Units.
Flavor:
"The sun does not choose."

GARUDA   ✦RATNA
Power: 7
Type: Hero
Rarity: Legendary
Ability:
ON PLAY: Remove all Venom from your Units; each gains +1 power per token removed.
Flavor:
"The serpents remember his shadow. That is why they look up."

KALPAVRIKSHA   ✦RATNA
Power: N/A
Type: Artifact
Rarity: Mythic
Ability:
ROUND END: your lowest-power Unit becomes equal to your highest-power Unit.
Flavor:
"Beneath its branches, no one is least."
