# RULING R88 — DEVA WAVE SUB ADOPTION
# Ruled by Sangbaran 2026-07-18. Display epithets (def `sub:`) only —
# no mechanic, power, rarity, name, or id changes. 18 deltas.
# Authority for the implementing task (T40b). Engine is authority for
# rules text; this file is the sub table of record.

## THE TABLE (id | engine sub → new sub)
| id           | engine sub                  | new sub                       |
|--------------|-----------------------------|-------------------------------|
| devasainika  | Soldier of Heaven           | Soldier of the Vigil          |
| aruna        | Herald of the Dawn          | He Who Rides Before the Sun   |
| agneyastra   | Weapon of Fire              | Dart of the Devouring Flame   |
| dawnsentinel | Watcher of First Light      | The Watch Before Dawn         |
| kamadhenu    | The Wish-Granting Cow       | Mother of All Plenty          |
| savitur      | Hymn of the Sun             | The Verse That Quickens       |
| ushas        | Herald of First Light       | Herald of the Dawn            |
| vigilrakshak | Warden of the Shield        | Shield Within the Shield      |
| dawnsrebirth | The Undimmed Return         | The Light That Returns        |
| vedikeeper   | Tender of the Altar         | Tender of the Holy Altar      |
| ribhu        | The Divine Smith            | Artisan of the Immortals      |
| airavatacalf | Scion of the White Elephant | Child of the White Elephant   |
| ratri        | Song of the Night           | Song of the Sheltering Night  |
| vanguard     | Shield of the War-God       | First Spear of the War-God    |
| shaktispear  | Lance of Kartikeya          | The Unerring Vel              |
| dawnbanner   | Standard of the Sun         | Standard of the Rising Light  |
| suryastra    | The Sun Weapon              | The Sun Made Weapon           |
| saranyu      | Mare of the Dawn            | The Cloud Mare                |

## NO ACTION (recorded for completeness — 22 Deva wave cards total)
- dhanvantari ("Physician of the Gods"), kalpavriksha ("The Wish-
  Granting Tree") — exact matches, unchanged.
- kartikeya ("Commander of the Deva Host"), garuda ("King of All
  Birds") — already landed under R87 (commit b664711).

## VANGUARD — THE CONDITIONAL (0b evidence, ADOPT branch fired)
Kartikeya's Vanguard (engine id `vanguard`) is a DEATH-TRIGGER, not a
protective card: onUnitDeath (engine.js ~676) — the first time a
friendly Unit is destroyed each round, an on-board `vanguard` gains
+2 power (once/round, re-armed at round reset; its own death cannot
trigger it). It shields, wards, or prevents NOTHING. So the old sub
"Shield of the War-God" was a mechanical MISNOMER — the branch
adopts the doc line ("First Spear of the War-God"), making 18 deltas.

## RATIONALE (four-precedent + herald-collision kill)
- FOUR-PRECEDENT: the launch 22 already carry authored epithets in a
  consistent register (Indra "King of Devas", Yama "Lord of Dharma");
  R83 (Naga rename), R84 (Asura rename), R87 (Kartikeya/Garuda) set
  the precedent that display epithets are curated, not left at the
  first-draft `sub`. R88 brings the Deva wave to that bar.
- HERALD-COLLISION KILL: pre-R88 aruna="Herald of the Dawn" and
  ushas="Herald of First Light" — two near-identical "Herald" epithets
  one row apart in the gallery. R88 moves aruna to "He Who Rides
  Before the Sun" and lets ushas ADOPT the cleaner "Herald of the
  Dawn". Both deltas land ATOMICALLY in one commit, so the transient
  state where both read "Herald of the Dawn" never exists on main.

## INVARIANTS
ids unchanged · display-only (`sub` is never read by rules) · flag-off
launch baseline byte-identical (wave cards are flag-gated) · the entire
test.js output is BYTE-IDENTICAL pre/post · ASTRA_DMG unchanged · the
adopted R82 wave baseline is display-name-independent and stands.


R88 NAME-TRIM ADDENDUM (E3 comma-split; ruled amendment 2026-07-18):
Two def.n names lose their trailing epithet (now carried by sub):
  ushas    n: "Ushas, Dawn Herald" → "Ushas"
  saranyu  n: "Saranyu, Cloud Mare" → "Saranyu"
Rationale: the epithet already lives in sub after R88, so the comma-
appended epithet in def.n is redundant on every name surface. The batch
is thus 20 ruled def-field strings (18 subs + 2 names).
CONSUMER GREP (both full names, whole repo, BEFORE editing): ZERO
string-keyed consumers. All hits were (a) the def itself, (b) code
COMMENTS (engine.js:433 Ushas — left as-is, non-player-facing), (c) 3
Saranyu player-facing DISPLAY strings (2 log labels + 1 log template +
1 emit abilityName), and (d) an id-keyed RATNA list + a descriptive
console.log NOTE in sim_campaign (neither keys on the NAME). abilityName
IS keyed elsewhere but only on 'Leap'/'Chaos Surge'/'Pavamana' — never
Saranyu — so the Saranyu abilityName is display-only.
LOG/CALLOUT TRIM (traced to the saranyu name delta): the 3 Saranyu
display strings were trimmed "Saranyu, Cloud Mare" → "Saranyu" so the
card's own effect feedback matches its trimmed name. These fire only
under wave1 (Saranyu is wave-gated), so test.js stays BYTE-IDENTICAL.
Engine diff: 21 lines = 16 sub-only defs + 2 defs carrying name+sub
(ushas/saranyu) + 3 Saranyu display strings; zero untraced.
