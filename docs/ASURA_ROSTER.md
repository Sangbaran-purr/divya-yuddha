# ASURA ROSTER — extracted verbatim from GDD v2.0 Section 6 (design authority)

Faction mechanic — CHAOS SURGE: When any Astra is played by the Asura player, one random
friendly Unit gains +2 power immediately. Chandrahas Artifact → Chaos Surge triggers TWICE per Astra.

## HEROES (3)
- **Mahabali — The Eternal Emperor** · P8 · Legendary
  PASSIVE: On the turn immediately after the Asura player Passes voluntarily, their next Unit card is
  played for free. Forced Pass via Tamasa does NOT trigger this.
  NOTE: "played for free" needs interpretation in our 1-card-per-turn model — a free extra play that turn? Ask owner.
- **Shukracharya — Master of Mritasanjivani** · P5 · Epic
  TRIGGERED: Once per game revive one destroyed friendly Unit from discard pile at half its original power.
- **Rahu — The Shadow That Devours** · P4 · Epic
  PASSIVE: At the start of each round the opponent must discard 1 random card from their hand.

## UNITS (12)
- **Hiranyakashipu — The Immortal Tyrant** · P7 · Epic
  PASSIVE: Cannot be destroyed by any Astra. Can only be removed by a Mantra specifically. Brahmastra overrides this immunity.
- **Ravana — The Ten Headed King** · P7 · Epic
  ON PLAY: Gains +1 power for each card in opponent's hand. Maximum +5.
- **Kumbhakarna — The Sleeping Giant** · P8 · Epic
  ON PLAY: Cannot act for 1 turn after being played (sleeps). When it wakes, deal 3 damage to all enemy Units.
  NOTE: "cannot act" for a vanilla unit = its power doesn't count while asleep? Ask owner. Wake timing = start of owner's next turn.
- **Meghnad — Son of Thunder** · P6 · Rare
  ON PLAY: If an enemy Hero is on the board deal 2 damage to it directly. Bypasses Hero immunity once.
- **Kalanemi — The False Saint** · P5 · Rare
  ON PLAY: Disguise this card as a random card in opponent's hand until your next turn. When revealed deal 2 damage to all enemy Units.
- **Bana Asura — The Thousand Armed** · P6 · Epic
  PASSIVE: For each Astra played this round this Unit gains +1 power permanently. No upper limit.
- **Maricha — The Deceptive Demon** · P3 · Rare
  ON PLAY: Transform into a copy of any Unit currently on the board, inheriting its power value.
- **Vibhishana — The Righteous Asura** · P4 · Uncommon
  ON PLAY: Reveal all cards in opponent's hand to yourself for this round.
- **Tataka — The Forest Terror** · P4 · Uncommon
  ON PLAY: Destroy the lowest power Unit on the board — friendly or enemy.
- **Kali Asura — Embodiment of Discord** · P3 · Common
  ON PLAY: If Chaos Surge triggered this round gain +3 power immediately.
- **Asura Berserker — Chaos Foot Soldier** · P3 · Common
  PASSIVE: Gains +1 power each time any Astra is played this round by either player.
- **Narakasura — Lord of Darkness** · P5 · Rare
  ON PLAY: Steal 1 power from every enemy Unit on the board and add it to this Unit's power.

## ASTRAS (3)
- **Pashupatastra — Shiva's Wrath** · Mythic
  Deal damage equal to your current total board power to ALL enemy Units, equally distributed. Minimum 1 per unit. Triggers Chaos Surge.
- **Nagastra — Serpent Weapon** · Rare
  Apply Venom Token to ALL enemy Units regardless of faction mechanic.
  NOTE: requires Venom Token system (Naga infra) — implement tokens generically now.
- **Tamasa — The Darkness Weapon** · Rare
  Opponent cannot play any card on their next turn — they must Pass involuntarily. Forced Pass does NOT
  trigger Mahabali passive and does NOT lock them out of the round (single-turn skip). Chaos Surge still triggers.

## MANTRAS (2)
- **Sanjivani Corruption — Dark Revival** · Rare
  Steal the last Unit destroyed by opponent this round. Place it on your board at its original power. Fights for Asuras until round end.
- **Ahamkara — The Ego Weapon** · Uncommon
  Choose one friendly Unit. Double its current power until end of round. At round end that unit is destroyed regardless.

## ARTIFACTS (2)
- **Tripura — The Three Demon Cities** · Mythic
  PASSIVE: All Asura Units gain +1 power at the start of every turn. Ends immediately if any Astra is played by either player.
- **Chandrahas — Ravana's Moon Blade** · Rare
  PASSIVE: First Astra played each round by Asura player deals double its effect. Chaos Surge triggers twice while active.

## Cross-faction rulings involving Asuras (GDD Section 9 — implement as explicit code paths)
- Brahmastra vs Hiranyakashipu → Hiranyakashipu IS destroyed.
- Chaos Surge vs Manasa → if Manasa cancels the Astra, Chaos Surge is ALSO cancelled.
- Tamasa vs Mahabali → forced Pass does NOT trigger Mahabali.
- Chandrahas + Bana Asura → doubled Astra, Chaos Surge x2, Bana +2.
- Surasa vs Astra → Astra negated but Chaos Surge STILL triggers (contrast with Manasa!).
- Ahamkara + Kumbhakarna → 16 power, dies at round end anyway.
