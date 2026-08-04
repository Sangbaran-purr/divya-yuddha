# DIVYA YUDDHA - FACTION_MECHANICS_v2
# All four signature mechanics, one reference. ALL FOUR ARE NOW
# [PULLED]. Supersedes FACTION_MECHANICS_v1 (which carried Leap
# as VERIFY and two Venom edges open). Basis: T47 (Shield), T48
# (Surge), and the 2026-08-04 read-only pull (Leap full + Venom
# edges). This doc un-gates the Vanaras and Nagas Codex pages
# and is the mechanics authority for HOW_TO_PLAY_v1 (public).

## DEVAS - DHARMA SHIELD [PULLED, T47]
- A shielded Unit is astraProtected: it cannot be TARGETED by
  single-target Astras (drops out of target pools entirely).
- Targeting-prevention, not absorption. Board-wide Astras
  PIERCE. Venom is unaffected by shields. Brahmastra overrides
  all shields and immunities.
- shieldCap 1 by default; Dharma Kavacha raises to 2; Vedi
  Keeper grants an extra instant application this round.
- Shields are sticky per-round designations, reset at round
  end. Deva-only.
- Key cards: Dharma Kavacha, Vedi Keeper, Airavata's Calf
  (enters shielded), Gayatri Mantra (revives with shield),
  Vigil Rakshak (+2 while shielded).

## ASURAS - CHAOS SURGE [PULLED, T48 incl. call sites]
- Asura-only. When it fires, a RANDOM friendly non-ghost Unit
  gains power (g.rng, never chosen).
- Reachable amounts: +3 per surge (Asura Astras resolving,
  Asura Mantras cast, Chandrahas on play); +1 floor surge when
  an Asura play triggers nothing else. +2 is vestigial and
  unreachable.
- Multipliers compose: Chandrahas doubles counts while active;
  Vidyutastra fires twice; together x4 (R44).
- chaosThisRound feeds Kali Asura's +3.
- R37 negation split: Manasa cancels effect AND surge;
  Brahmadanda cancels effect only, surge still fires.

## VANARAS - LEAP [PULLED 2026-08-04]
- LEAP IS A POWER COPY, NOT MOVEMENT. doLeap sets the leaper's
  power to the target's current effective power. The target is
  unchanged. No unit moves, no card is drawn, no reorder.
- FREE ACTION: costs neither the turn nor power. The only
  price is one charge of the per-round leap limit.
- Limit: leapsUsed counter, reset each round. leapLimit equals
  1 plus 1 if Kishkindha Crown plus 1 if Anjana. Crown's text
  "Leap twice per round" means limit 1 to 2. Free leaps
  (Mainda on play, Matanga) do not consume a charge.
- Vanara-only (canLeap hard-gates faction). Any non-ghost
  friendly Vanara Unit may leap. Targets: adjacent Units, plus
  Gandhamadana from anywhere.
- "Leap feeds both" (Crown): on a leap with Crown active, the
  leaper AND the copied target each gain +1 power.
- On-leap listeners: Kumuda +2 base+power if leaper-or-target;
  Rambha +1 base+power from anywhere friendly.
- Downstream reader: Gandiva Arrow destroys a second enemy
  Unit if leapsUsed is nonzero this round.
- NON-INTERACTIONS (proven): Leap does not fire afterAction or
  the Living Bridge line-check, and being power-only it can
  never change the Bridge adjacency run. It does not read or
  write venom. It copies power only, never the target's
  shield; the leaper does not inherit protection.

## NAGAS - VENOM [PULLED complete]
- A Venom Token drains 1 power per tick per token: a Unit with
  N tokens loses N at round end. At 0 power the Unit dies.
- TOKENS ARE STICKY: the drain reduces power, never the token
  count. A token re-drains every tick until removed. Only
  removers: Garuda cleanse (+1 power per token removed),
  Uraga's self-shed, Shankhapala's relocation, Rama's Signet
  negation (Vanara Units, floor 1).
- Sarpa Satra doubles the token drain (2N) while active.
- Modifiers at the loss site: Holika suffers +1; Vanara
  non-negated loss floors at 1; Hiranyakashipu floors at 1.
- Token drain is separate from and additive to the Naga
  faction passive (base -1 plus Patala-round plus Vasuki-R3
  plus Venom Strike). Both fire at round end before scoring;
  Karkotaka ticks early on every enemy turn; Hymn of the
  Depths adds a mid-round token pass.
- APPLIER LIST (complete, 11 plus board-source plus relocator):
  Nagastra (ASURA astra: +1 ALL enemies) - Visha Vayu (+1 all
  enemies) - Naga Sadhu (+1 all enemies) - Naga Archer (+1
  damaged survivor) - Patala Hatchling (+1 random) - Kalakuta
  Vial (+2 one enemy) - Nirmoka on death (+1 highest enemy) -
  Uraga Colossus (2 on itself) - Kulika (transfers all
  friendly venom to random enemies) - Padmavati (+1 strongest
  enemy each round end) - Mrityunjaya (venom 1 on the friendly
  revived Unit, R13 cost) - Shankhapala (moves 1 token enemy
  to enemy, net zero) - Ananta Coil (board-level token on Naga
  death, drains a random enemy per tick).
- NON-NAGA APPLIER EXISTS: Nagastra is defined in the Asura
  roster block. Every other applier is Naga. (Teaching beat
  available: even the Asuras stole the serpents' poison.)

## CROSS-FACTION INTERACTION TABLE (all cells verified)
- Shield vs single-target Astra: BLANKED
- Shield vs AoE Astra: PIERCED
- Shield vs Brahmastra: OVERRIDDEN
- Shield vs Venom: NO PROTECTION
- Venom vs Vanara (Signet up): NEGATED, floor 1
- Venom vs Garuda: CLEANSED into +1 per token
- Surge vs negation: source-dependent per R37
- Leap vs shields: no interaction, power copied without shield
- Leap vs venom: no interaction
- Leap vs hooks: fires onLeap (Kumuda/Rambha) and Crown +1/+1;
  never fires afterAction / the Living Bridge check; sets
  leapsUsed which Gandiva Arrow reads

## TEACHING LAW (for HOW_TO_PLAY_v1 and all Codex pages)
- Leap must never be illustrated or described as movement,
  jumping, or repositioning. No movement arrows in any Leap
  illustration. The taught verb is COPY / MATCH.
- Nothing on any page may exceed the PULLED lines above.
