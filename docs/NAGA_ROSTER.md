# NAGA ROSTER — extracted verbatim from GDD v2.0 Section 8 (design authority)
# FINAL FACTION — completes the 88-card launch roster.

Faction mechanic — VENOM: At the end of each round all surviving enemy Units lose -1 power.
(Per existing engine ruling: the tick applies at round end BEFORE scoring; R1 death-at-0 applies.)
Enhanced by Patala Throne (escalates), Karkotaka (timing change), Vasuki Venom Strike (triples).

ENGINE NOTE: the generic status-token system (built for Nagastra) is the substrate. The faction
passive is a global end-of-round drain on enemy units; Venom TOKENS are the per-unit stacking form.
Keep the two concepts distinct in code and card text.

## ⚠ PRE-FLAGGED DESIGN BUGS / AMBIGUITIES (ask owner before implementing)
A. **Karkotaka's "Venom at START of round"** is dead as written — boards are empty at round start
   (units clear), so a start-of-round tick hits nothing. Candidate ruling: while Karkotaka is on
   board, the Venom drain ticks at the start of EACH OPPONENT TURN during the round instead of
   once at round end (continuous attrition; enables mid-round Venom kills). Ask owner.
B. **Patala Throne "escalates each round it remains"** is dead as written — Artifacts clear each
   round, so it can never "remain." But the GDD's own table (R1=-2, R2=-3, R3=-4) implies the
   intent: escalation keys off the CURRENT ROUND NUMBER. Candidate ruling: while Patala Throne is
   active, Venom drain = -(1 + current round number). Ask owner.
C. **Surasa's text is garbled in the GDD** ("If Unit absorb 2 of its power. If Astra negate it.")
   Candidate ruling: While Surasa's trap is armed (her on-play, opponent's next card): if it's a
   Unit, that Unit enters with -2 power and Surasa gains +2; if it's an Astra, the Astra is
   negated (per §9: Chaos Surge still triggers if Asura played it). Trap expires after one card.
   Ask owner.
D. **Mrityunjaya gives YOUR revived unit a Venom Token** — does a Venom Token drain its bearer
   even on the Naga player's own side? Candidate ruling: yes — tokens drain their bearer at the
   tick regardless of side (the corruption cost is real). Ask owner.
E. **Ananta Coil's "permanent" Venom Token on the board** — candidate ruling: the token persists
   for the rest of the MATCH (like Heroes do), draining 1 power from a random enemy Unit at each
   Venom tick. Ask owner.
F. **Shesha's revival** — "revived at full power for the next round": candidate ruling: at the
   start of the next round, one random friendly Unit from the discard pile is placed directly
   onto the board at full power. Ask owner.

## HEROES (3)
- **Vasuki — The Cosmic Serpent** · P8 · Legendary
  PASSIVE: Venom damage increases to -2 per surviving enemy Unit in Round 3 only.
  TRIGGERED: When played, all enemy Units on the Yuddha Row immediately lose 1 power.
- **Takshaka — The Inevitable** · P6 · Epic
  PASSIVE: Enemy Heroes are NOT immune to Naga Astra cards while Takshaka is on the board.
  Breaks the standard Hero protection rule — Nagas only. (§9 explicit path.)
- **Shesha — The Infinite Serpent** · P7 · Legendary
  PASSIVE: At the end of every round, if the Naga player LOST that round, one random friendly
  Unit is revived at full power for the next round. (See flag F.)

## UNITS (12)
- **Manasa — Goddess of Serpents** · P5 · Epic
  ON PLAY: Cancel the last Astra played by opponent this round (if any) and gain +1 power for
  each Naga Unit currently on the board.
  (§9: cancelling an Asura Astra ALSO cancels its Chaos Surge — contrast with Surasa.)
- **Karkotaka — The Venomous King** · P6 · Epic
  PASSIVE: While Karkotaka is on the board, Venom damage applies at the START of each round
  instead of the end. (See flag A — dead as written; ruling required.)
- **Surasa — Mother of Nagas** · P5 · Epic
  ON PLAY: Force opponent to play their next card directly into this unit first. If Unit absorb
  2 of its power. If Astra negate it. (See flag C — garbled; ruling required.)
- **Ulupi — The River Naga Princess** · P4 · Rare
  ON PLAY: Revive one destroyed friendly Naga Unit from discard pile at full power. That unit
  cannot be targeted by Astras this round.
- **Naga Sadhu — The Poison Ascetic** · P3 · Rare
  ON PLAY: Apply Venom to ALL enemy Units currently on the board simultaneously — instant
  faction-wide drain trigger.
  NOTE: interpret as applying a Venom TOKEN to each enemy Unit (stacks with the passive drain).
- **Kaliya — The Multi-Headed Terror** · P6 · Epic
  PASSIVE: Gains +1 power permanently for each round survived. Round 1 base. Round 2 +1. Round 3 +2.
  NOTE: Units clear between rounds — interpret as keyed to current round number when played?
  OR as intended for a unit that gets revived/replayed? Candidate: Kaliya enters with
  +(current round - 1) power. Ask owner (flag G).
- **Astika — The Peacemaker** · P4 · Uncommon
  ON PLAY: Pause all active Venom effects for one full turn. Friendly units recover 1 power
  during this pause.
- **Naga Archer — Poison Arrow** · P3 · Uncommon
  ON PLAY: Deal 1 damage to target enemy Unit. If that unit survives, apply a Venom Token to it.
- **Naga Enchantress — The Luring Mist** · P3 · Uncommon
  ON PLAY: Opponent's next card play this round must be a Unit card. They cannot play Astras or
  Mantras on their next turn.
- **Naga Warrior — Scales of Darkness** · P3 · Common
  PASSIVE: Gains +1 power for each Venom Token active on the board.
- **Naga Hatchling — Born of Venom** · P2 · Common
  ON PLAY: If any enemy Unit has a Venom Token, this Unit gains +2 power immediately.
- **Ashvatara — The Naga Prince** · P5 · Rare
  ON PLAY: Choose one enemy Unit. That unit loses power equal to rounds completed.
  Round 1 = -1. Round 2 = -2. Round 3 = -3.
  NOTE: "rounds completed" during Round 1 is zero — but the GDD's own table says Round 1 = -1,
  so interpret as: loses power equal to the CURRENT round number. (Consistent with flag B logic.)

## ASTRAS (3)
- **Nagapasha — Serpent Noose** · Rare
  Bind one enemy Unit — it cannot contribute its power to the round total until opponent uses
  their next turn to unbind it. Opponent wastes a turn to free it. (If never unbound, it
  contributes 0 at scoring.)
- **Vasuki Venom Strike — Cosmic Poison** · Legendary
  Triple Venom damage this round only: enemy Units lose -3 power at round end instead of -1.
  If Vasuki is on board this becomes -4.
- **Mohini Trap — The Illusion Snare** · Rare
  Choose one enemy Unit. It switches sides and fights for you until end of round; its power
  counts toward your total. (§9: Venom does not apply to it while on your side.)

## MANTRAS (2)
- **Mrityunjaya — Conquest of Death** · Rare
  Revive ANY destroyed Unit from either discard pile — friendly OR enemy — at full power on
  your side. That unit immediately receives a Venom Token. (See flag D.)
- **Sarpa Satra — The Serpent Sacrifice** · Uncommon
  Sacrifice one friendly Naga Unit voluntarily. All enemy Units lose power equal to the
  sacrificed unit's current power value. Venom Tokens on enemies double their damage this round.

## ARTIFACTS (2)
- **Patala Throne — Seat of Serpent Kings** · Mythic
  PASSIVE: Venom damage increases by +1 for every round this Artifact remains on the board.
  Round 1 = -2. Round 2 = -3. Round 3 = -4. (See flag B — ruling required.)
- **Ananta Coil — The Endless Serpent** · Rare
  PASSIVE: Whenever a Naga Unit is destroyed it leaves a permanent Venom Token on the board.
  That token drains 1 power from a random enemy Unit each round. (See flag E.)

## Cross-faction rulings involving Nagas (GDD Section 9 — explicit code paths)
- Dharma Shield vs Venom → shield blocks Astras only; Venom drains unshielded AND shielded units.
- Chaos Surge vs Manasa → Manasa cancels the Astra AND its Chaos Surge.
- Surasa vs Astra → Astra negated, but Chaos Surge STILL triggers (the asymmetry with Manasa).
- Venom vs Leap → Venom applies to all surviving enemy units including Leapers.
- Rahu vs Manasa → Rahu's round-start discard resolves before Manasa's effects.
- Mohini Trap + Venom → stolen unit is exempt from your Venom while on your side.
- Pavamana vs Venom → removes ALL Venom Tokens from friendly units (the Deva counter, finally live).
- Rama's Signet vs Venom → negates Venom Tokens on friendly Vanara units; floor-at-1 blocks the drain.
- Patala Throne + Karkotaka → both modifiers stack (escalated amount at the changed timing).
- Takshaka vs Hero Protection → Naga Astras can target/destroy enemy Heroes while he's on board.
- Rama Naam → cannot be countered by any Naga effect this round (the pre-wired hook goes live).

## Implementation order suggestion
1. Owner rulings on flags A–G first — Venom timing/stacking is the foundation of everything here
2. Venom pipeline: passive drain + tokens + modifiers (Vasuki R3, Strike, Throne, Karkotaka,
   Astika pause, Sarpa Satra doubling, Signet/Pavamana counters) as ONE ordered system with tests
3. The 22 cards
4. UI: Venom token badges with stack counts, drain animations at tick time, bind state (Nagapasha),
   side-switch rendering (Mohini), teal Naga theme (#1F6B62 frame, venom-green accents)
5. Balance harness → ALL 10 matchups (4 mirrors + 6 crosses), 500 sims each
