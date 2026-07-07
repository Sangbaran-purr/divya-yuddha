# VANARA ROSTER — extracted verbatim from GDD v2.0 Section 7 (design authority)

Faction mechanic — LEAP: Once per round one Vanara Unit may copy the current power value of an
adjacent Unit on the Yuddha Row. Kishkindha Crown → limit becomes twice per round. Mainda provides
a bonus Leap without consuming the limit.

ENGINE PREREQUISITE: Leap requires BOARD POSITIONING (adjacency on the Yuddha Row). Units must
occupy ordered slots; the player chooses placement position when playing a Unit. This is new
infrastructure — build it faction-agnostically (Devas/Asuras simply ignore position).
NOTE for owner: does "adjacent" include Heroes on the Yuddha Row, or Units only? Ask before implementing.

## HEROES (3)
- **Hanuman — Devotion Incarnate** · P9 · Legendary
  PASSIVE: Whenever the Vanara player plays any Unit card, that Unit gains +1 additional power on entry.
  With Jambavan on board this becomes +2.
- **Sugriva — King of the Vanaras** · P6 · Epic
  TRIGGERED: When played, draw 1 extra card from the deck immediately.
- **Angad — The Unyielding Messenger** · P7 · Epic
  PASSIVE: Cannot be targeted by any opponent Mantra card. Opponent Astra cards cost an additional
  action this round.
  NOTE: "cost an additional action" is undefined in our 1-card-per-turn model. Propose an
  interpretation and ask owner (candidate: opponent Astras can only be played if it's their
  second+ card play of the round? Or: playing an Astra forfeits their NEXT turn?).

## UNITS (12)
- **Nala — The Bridge Builder** · P5 · Epic
  ON PLAY: Place one additional copy of the lowest power Vanara Unit in your hand directly onto the
  board at half power.
- **Neela — Commander of the Vanguard** · P5 · Rare
  ON PLAY: All Vanara Units currently on the board gain +1 power. If Sugriva is on the board gain +2 instead.
- **Jambavan — The Ancient Bear King** · P6 · Epic
  PASSIVE: While Jambavan is on the board, Hanuman's passive grants +2 power per Unit played instead of +1.
- **Kesari — Father of Hanuman** · P5 · Rare
  ON PLAY: If Hanuman is on the board this Unit immediately gains power equal to Hanuman's current power value.
- **Tara — Queen of the Vanaras** · P4 · Rare
  ON PLAY: Look at the top 3 cards of your deck. Keep one, return the other two in any order.
- **Dwivida — The Rogue Vanara** · P5 · Rare
  ON PLAY: Destroy one random card in opponent's hand without revealing it.
- **Mainda — The Swift Striker** · P4 · Uncommon
  ON PLAY: Use the LEAP mechanic immediately on any adjacent Unit without spending the faction's
  one Leap per round.
- **Sharabha — The Forest Sentinel** · P3 · Uncommon
  PASSIVE: While this Unit is on the board, opponent cannot target any Vanara Unit with power 3 or
  less with Astras.
- **Vanara Scout — Eyes of the Jungle** · P2 · Common
  ON PLAY: Reveal opponent's full hand for one turn. Gain +1 power for each Vanara Unit already on the board.
- **Vanara Warrior — Loyal to the Last** · P3 · Common
  PASSIVE: Gains +1 power for each other Vanara Unit on the board. Maximum +4.
- **Dadhimukha — Guardian of Madhuvana** · P3 · Uncommon
  ON PLAY: If Sugriva is on the board, draw 1 card AND give all friendly Vanara Units +1 power.
  Without Sugriva, draw 1 card only.
- **Riksha — Son of the Wind** · P4 · Rare
  ON PLAY: Move to any position on the Yuddha Row. If placed adjacent to Hanuman gain +3 power.

## ASTRAS (3)
- **Gandiva Arrow — Blessed Shaft** · Rare
  Destroy one enemy Unit of your choice regardless of power value. If a Vanara Unit used Leap this
  round, destroy one additional enemy Unit.
- **Lanka Dahan — Fire of Hanuman** · Legendary
  Deal 2 damage to ALL enemy Units simultaneously. All friendly Vanara Units gain +1 power as the
  fire inspires them.
- **Sanjeevani Call — Mountain of Life** · Uncommon
  Revive the last destroyed friendly Unit at full power. That unit immediately gains Hanuman's
  passive bonus if he is on board.

## MANTRAS (2)
- **Rama Naam — The Name Above All** · Rare
  All friendly Vanara Units gain +2 power instantly. If Hanuman is on the board this becomes +3.
  Cannot be countered by any Naga effect this round.
- **Kishkindha Oath — Bond of Warriors** · Uncommon
  Choose one friendly Vanara Unit about to be destroyed. It survives with 1 power. All other
  friendly Vanara Units gain +1 power from witnessing the sacrifice.
  NOTE: "about to be destroyed" implies a reaction window our strictly-alternating turn model
  doesn't have. Propose an interpretation and ask owner (candidate: play proactively on a unit —
  the next time it would be destroyed this round, it survives at 1 instead).

## ARTIFACTS (2)
- **Rama's Signet — Seal of Trust** · Rare
  PASSIVE: All friendly Vanara Units cannot have their power reduced below 1 by any effect.
  Venom Tokens on friendly units are negated while active.
  NOTE: interacts with ruling R1 (death at 0) — Signet units floor at 1 and cannot die to power
  reduction, only to explicit destroy effects.
- **Kishkindha Crown — Throne of Unity** · Mythic
  PASSIVE: Whenever a Vanara Unit uses LEAP, that unit and the unit it copied both gain +2 power.
  LEAP limit increases to twice per round while active.

## Cross-faction rulings involving Vanaras (GDD Section 9 — explicit code paths)
- Leap vs Dharma Shield → copying a shielded unit's power does NOT inherit the shield. Power only.
- Venom vs Leap → Venom applies to all surviving enemy units including those that used Leap.
- Rama's Signet vs Venom → Signet negates all Venom Tokens on friendly Vanara units while active.
- Rama Naam → cannot be countered by any Naga effect this round (pre-wire the hook; Nagas not built).

## Implementation order suggestion
1. Board positioning infrastructure (ordered slots, placement choice, adjacency helper) — all factions
2. Leap mechanic + per-round limit + Crown/Mainda modifiers
3. The 22 cards
4. UI: placement picker when playing a Unit (tap a slot), Leap button/gesture, position rendering
5. Balance harness: add Vanara mirror + Vanara-vs-Deva + Vanara-vs-Asura (500 each)
