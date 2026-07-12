# GDD_DELTAS — RULINGS R32–R37 (wave-1 implementation batch 2)
# Ruled by Sangbaran 2026-07-12 (batch review, all recommendations accepted).
# Append verbatim to GDD_DELTAS.md. These are card-text authority.
# All six ratify shipped, flag-gated engine behavior from Engine Tasks 4–8.

R32 — USHAS: "≤2 POWER" BOUNDARY
Ushas's aura reads CURRENT stored power at evaluation time, non-recursively:
a unit mutation-buffed above 2 (e.g. by Kamadhenu) exits the aura; a unit
drained to 2 or below enters it; Ushas's own effPower-granted +1 does not
feed back into the eligibility check. (Ratifies the Task-4 implementation.)

R33 — WARDED BLOOD OATH
If Blood Oath's chosen lowest Unit carries a Kishkindha-Oath-class ward, the
ward does its job: the unit survives at 1 power, the ward is consumed, and
the draw still fires. The destroy attempt is the cost; the mantra's benefit
does not require the death. Pure destroyUnit composition — no special-casing.
Sim watches ward-then-Oath lines. (Ratifies the Task-5 implementation.)

R34 — TEMPORARY DEBUFF DURATION MODEL
"This round" debuffs (Mohanastra-class) are current-power reductions with no
scheduled restore. Round-scoping is emergent and canonical: the board clears
to discard at round end, and every revival path sets power = base, so the
dent never outlives the round. This is the duration model for ALL temporary
debuffs, launch and wave. (Ratifies the Task-6 implementation.)

R35 — PERMANENT REDUCTIONS BYPASS DAMAGE RULES
Surpanakha-class permanent cuts are direct base+power mutations (R21
downward). They are NOT damage: they bypass the damageUnit/venomLoss choke
points entirely, so damage-conditional effects (Holika's +1 sharpening,
Ratri Hymn's prevention) do not apply to them. A base reduction is a
different verb from a power loss. (Ratifies the Task-6 implementation.)

R36 — VEDI KEEPER: CANONICAL TEXT REWRITE
Engine verification (Task 7 STEP 0) proved both R25 branches moot: Dharma
Shields are already action-free AND instant in the engine. The only reading
under which the card exists is ruled canonical:
  VEDI KEEPER — "On Play: your Dharma Shield limit is +1 this round."
One additional shield may be designated this round (stacks with Dharma
Kavacha's cap); unconsumed grants expire at round end. This text supersedes
the WAVE1_ROSTER_v0.2 entry and R25, and is the frame text for the eventual
Canva export. (Ratifies the Task-7 implementation; roster delta noted.)

R37 — NEGATED ASTRAS AND CAST-TRIGGERED EFFECTS
A negated Astra (Manasa-class, and Brahmadanda when implemented) was still
CAST: cast-triggered effects fire even though the Astra's own effect does
not resolve. Consequences: Chaos Surge procs for the caster (R12/R24
precedent), and Mayasura's Blueprint still grants its extra action. The
cast happened; the effect did not. Contrast R23: resolution-triggered
effects (Kartikeya) do NOT fire on a negated Astra. Cast-triggers and
resolution-triggers are distinct classes. (Ratifies the Task-8
demonstration.)
