# DIVYA YUDDHA — WAVE 1 ROSTER v0.2 (CONSOLIDATED — REVIEW COMPLETE)
# 88 cards: 22 per faction = 16 GUPTA + 6 RATNA each. Supersedes v0.1.
# Every card below carries Sangbaran's review ruling (2026-07-11, 88/88) and
# the collision/feasibility audit findings. STATUS: design-locked, PENDING SIM.
#
# CHANGES FROM v0.1: 3 renames (Deva Sainika, Gaja, Dawn's Rebirth) ·
# 3 redesigns (Nahusha, Iron Crucible, Saranyu) · 1 trim (Anjana) ·
# classification policy set (dmgAstra) · all [ENGINE+] flags ruled.
#
# WAVE-WIDE POLICIES (set during review):
# P1 Vanillas stay vanilla — duplicate plain bodies are a consistency choice.
# P2 Situationally-dead tech cards are legitimate pack pulls.
# P3 Bonded pairs are legal when mythology supplies real ones.
# P4 One identity deviation per faction is a feature (sanctioned: Deva/Ushas
#    go-wide · Asura/Simhika dead-tech · Vanara/Sampati information ·
#    Naga/Uraga self-price).
# CLASSIFICATION POLICY: dmgAstra = deal-N only. Destroy-Astras and debuff-
# Astras are NOT damage (Patala does not sharpen them; Ratri Hymn does not
# stop them). Authored per-card, derived into ASTRA_DMG at load (see ENGINE).

═══════════════ DEVAS — "THE VIGIL" ═══════════════
(protection → retribution; sanctioned deviation: Ushas go-wide)
GUPTA:
U Dawn Sentinel      C  P2  Round End: if survived, +1 permanently.
U Vedi Keeper        C  P3  On Play: next Dharma Shield this round free/instant. [R21+: define vs shield economy] [SUPERSEDED BY R36: 'On Play: your Dharma Shield limit is +1 this round.']
U Deva Sainika       C  P3  Vanilla. [RENAMED from Gana Warrior — Naga Warrior anagram]
U Ushas, Dawn Herald U  P3  Passive: other Units ≤2 power get +1.
U Aruna Charioteer   U  P4  On Play: +2 if Round 1.
U Ribhu Craftsman    U  P3  On Play: your Artifact untargetable this round. [trivial]
M Savitur Verse      U  —   One friendly Unit +1 at end of every round.
U Kamadhenu          R  P4  Round End: lowest friendly Unit +1.
U Dhanvantari        R  P4  On Play: restore one Unit to printed power.
U Vigil Rakshak      R  P5  While shielded, +2.
A Agneyastra         R  —   Deal 3 to an enemy Unit. [dmgAstra:true]
M Ratri Hymn         R  —   Prevent all Astra DAMAGE to your Units this round. [dmg boundary — R21+]
U Kartikeya's Vanguard E P5 Friendly Unit destroyed → +2 (once/round).
A Shakti Spear       E  —   Destroy an enemy Unit ≤4 power. [destroy-class]
AR Dawn Banner       E  —   Round start: all friendly +1 this round. [SIM: compounding] [SUPERSEDED BY R43: 'From the next round on, your Units get +1 (outlives the Banner).' — strongest-reading exception, SIM flag hot]
H KARTIKEYA          L  P8  Enemy Astra resolves vs your side → all your Units +1 permanent. [SIM: vs Asura wave; R21+: negated ≠ resolved]
RATNA:
U Airavata's Calf    R  P4  Enters shielded.
U Saranyu, Cloud Mare E P5  On Play: two friendly Units exchange current power. [REDESIGNED — positional cut, invariant preserved]
M Dawn's Rebirth     E  —   Return highest Unit from discard at printed power; cannot be shielded this match. [RENAMED — Ushas homophone]
A Suryastra          L  —   Deal 2 to ALL enemies. [dmgAstra:true; SIM: Patala 3-AoE; text must carry AoE-pierces-shield truth]
H GARUDA             L  P7  On Play: remove all friendly Venom; +1 per token. [accepted-risk name vs Varuna]
AR Kalpavriksha      M  —   Round End: lowest Unit becomes equal to highest. [SIM: + Dawn Banner wide board]

═══════════════ ASURAS — "THE PRICE" ═══════════════
(explicit bargains + Maya; sanctioned deviation: Simhika dead-tech)
GUPTA:
U Pisacha Skirmisher C  P4  Round End: −1 permanently.
U Maya Shade         C  P2  On Play: copy your lowest other Unit. [Maricha precedent]
U Ash Legionnaire    C  P3  Vanilla. [P1]
U Dhumraksha         U  P4  On Play: deal 1 to one of YOUR Units.
U Simhika            U  P4  Enemy Unit revived → +2. [P2]
A Mohanastra         U  —   Enemy Unit −2 this round. [dmgAstra:false — explicit]
M Blood Oath         U  —   Destroy your lowest Unit: draw 2. [draw exists — flag removed]
U Holika             R  P5  Immune to Astra damage; +1 extra from all else. [dmg boundary]
U Andhaka            R  P6  Untargetable while another friendly Unit on board.
U Shumbha            R  P4  +1 while Nishumbha on board. [P3 pair]
U Nishumbha          R  P4  +1 while Shumbha on board. [P3 pair]
A Vidyutastra        R  —   Deal 2; Chaos Surge triggers twice. [dmgAstra:true; SIM: + Chandrahas] [R44: ×Chandrahas composes to 4 surges — NAMED SIM FLAG, additive-cap fallback prepared]
U Mahishasura        E  P7  Round End: −2 unless an enemy Unit died this round. [SIM: hunger real? tighten to "by YOUR effect" if trivially fed]
M Raktabija's Curse  E  —   Next friendly Unit destroyed this round → spawn two 2-power Rakta tokens. [ENGINE+ spawn — Yama-ghost pattern]
AR Mayasura's Blueprint E — Once/round, an Astra doesn't consume the turn. [R21+: vs 1-Astra/turn, Angad, Varuna]
H VRITRA             L  P8  On Play: bind an enemy Unit (0 contribution) while Vritra remains. [bind precedent]
RATNA:
U Surpanakha         R  P4  On Play: enemy Unit −1 permanently.
U Atikaya            E  P6  Enters −2 if you haven't passed this match; +2 if you have. [pass tracking exists]
A Brahmadanda        E  —   Negate next enemy Astra this round. [pre-ruled: Surge still procs for caster (R12); SIM: mirror warp → soften to "deals no damage"]
M Maya Veil          E  —   Your Units untargetable by Astras this round (AoE pierces). [ch3 shield-boundary rhyme]
H MAHISHI            L  P7  Round End: copies strongest Unit's POWER (Hero row kept, no abilities). [RULED power-only]
AR The Iron Crucible M  —   Round End: your Units that lost power this round regain 1. [RETHEMED — price-tag system dead; SIM: anti-Naga drift]

═══════════════ VANARAS — "THE BRIDGE" ═══════════════
(Setu formation + allies; sanctioned deviation: Sampati information)
GUPTA:
U Setu Mason         C  P2  +1 while adjacent to another Vanara. [SUPERSEDED BY R40: '+1 while adjacent to Vanaras on both sides.']
U Drummer of the Host C P2  On Play: adjacent Units +1 this round.
U Kishkindha Runner  C  P3  Vanilla. [P1]
U Gavaksha           U  P3  On Play: may swap places with a friendly Unit. [trivial]
U Gaja               U  P4  +1 while your board is wider. [RENAMED from Panasa — Manasa one-letter trap]
U Kumuda             U  P3  Leaps or is Leapt to → +1 permanently.
M Song of the Crossing U —  Units in one row +1; +2 if 4+ there. [R21+: define "row" vs board model]
U Sushena the Healer R  P4  Round End: restore 1 to each adjacent damaged Unit.
U Sampati            R  P5  On Play: reveal enemy's highest-power hand card. [trivial — info category opened]
U Vinata's Talon     R  P4  On Play: deal 1 per two friendly Vanaras (max 3).
A Vayavyastra        R  —   Return enemy Unit ≤4 to owner's hand. [bounce ruling: fresh mkCard, printed base]
M Matanga's Blessing R  —   Next Leap grants +2 to both (stacks with Crown).
U Gandhamadana       E  P5  Your Leaps may target this from anywhere.
A Jatayu's Last Flight E —  Destroy an enemy Unit >6 power. [destroy-class]
AR The Setu Stones   E  —   Your Units enter adjacent to any chosen friendly. [moderate — target UI]
H MAKARDHWAJA        L  P7  On Play: Leap from Hanuman if present, else your strongest. [the hero bar: mechanic dramatizes myth]
RATNA:
U Swayamprabha       R  P3  On Play: look at top 3, take one to hand. [trivial — Tara pattern + choice UI]
U Rambha the Bold    E  P5  Any friendly Leap → +1 permanently.
M Vault of the Sky   E  —   Move a friendly Unit anywhere; +2 this round. [trivial]
A Anjaneya's Roar    L  —   All enemies −1 this round; your adjacent pairs +1. [dmgAstra:false; SIM: vs Rama Naam's crown]
H ANJANA             L  P6  Passive: Leap limit +1 per round. [TRIMMED — adjacency-cost rider cut]
AR The Living Bridge M  —   Round End: unbroken adjacent line of 4+ → all of them +1 permanent. [moderate — run predicate; SIM: uptime both ways] [R40: formally SIM-FLAGGED — body-count equivalence acknowledged; haircut fallback prepared]

═══════════════ NAGAS — "THE DEEP" ═══════════════
(corpse economy + token mastery; sanctioned deviation: Uraga self-price)
GUPTA:
U Patala Hatchling   C  P2  On Play: 1 Venom to a random enemy.
U Coil Sentry        C  P3  Vanilla. [P1 — the ruling's origin card]
U Molting Naga       C  P2  Destroyed → 1 Venom to highest enemy.
U Venom Harvester    U  P3  On Play: +1 per Venom on enemy's strongest (max 3).
U Shankhapala        U  P4  Round End: move 1 Venom between enemy Units.
U Depth Caller       U  P3  On Play: +2 if a friendly Unit is in discard.
M Rite of Shed Skin  U  —   Return friendly Unit to hand; re-enters at printed power. [bounce ruling applies]
U Mahapadma          R  P5  Enemies with Venom cannot receive Dharma Shield. [SIM PRIORITY: the 41/59 counter]
U Grave-Tide Naga    R  P4  On Play: +1 per Unit in EITHER discard (max 4).
U Vishalakshi the Pale R P4 Enemy dies with Venom on it → +2 permanent. [RENAMED from Padma the Pale — three-Padma cluster]
A Kalakuta Vial      R  —   Apply 2 Venom to one enemy. [not damage — no flag]
M Hymn of the Depths R  —   All Venom drains trigger immediately, once. [Karkotaka timing precedent]
U Uraga Colossus     E  P7  Enters with 2 Venom on ITSELF; sheds 1/round. [friendly-venom-drains precedent R13]
A Serpent's Kiss     E  —   Destroy an enemy Unit with 2+ Venom. [destroy-class]
AR The Drowned Altar E  —   Round End: mill top card; your Units +1 this round if a Unit. [ENGINE+ mill trivial; SIM: self-deck-out in Gandharva]
H PADMAVATI          L  P7  Round End: 1 Venom to strongest enemy.
RATNA:
U Silt Strangler     R  P4  On Play: enemy loses power = its Venom count (tokens remain).
U Nahusha, Fallen King E P6 On Play: choose the realm's effect to apply to YOUR side only this round. [RETHEMED — symmetry preserved; moderate; own feasibility look at impl]
A World-Coil Constrictor E — Bind an enemy until it loses a Venom token. [bind precedent]
M The Long Patience  E  —   Apply 1 Venom to EVERY enemy Unit. [impl note: "skip your turn" = normal Mantra turn economy]
H KULIKA             L  P8  On Play: transfer all friendly Venom to enemies (random). [voice/gallery note vs Kaliya]
AR Throne of the Second King M — Venom drains STEAL: strongest friendly gains what Venom takes. [SIM PRIORITY: most-likely-broken card in the wave]

═══════════════ ENGINE-IMPACT REGISTER (post-review) ═══════════════
ENGINE TASK 1 (first of the wave, full gate + baseline): dmgAstra card tag,
derived into ASTRA_DMG at load. Tagged true: Agneyastra, Suryastra,
Vidyutastra. Tagged explicitly false: Mohanastra, Anjaneya's Roar.
Yaksha guard: untouched this wave (no artifact-destroyers — deliberate).
[ENGINE+] SURVIVING (all ruled trivial–moderate): positional line (Vanara-only
— faction invariant), info-reveal, draw, bounce (fresh-mkCard ruling), spawn
(Yama-ghost), mill, power-exchange (Saranyu), copy-power (Mahishi), Venom-steal
(Throne — engine-cheap/sim-expensive), realm-side toggle (Nahusha — needs
impl feasibility look). KILLED: price-tag system, persistent realm override,
Deva positional.
R21+ QUEUE: dmg/destroy/debuff definition · Kartikeya vs negation (negated ≠
resolved) · Vedi Keeper vs shield economy · Blueprint vs Astra limits ·
"row" definition · Nahusha toggle semantics.

═══════════════ VALIDATION PROTOCOL (unchanged, now unblocked) ═══════════════
1. Collision re-check on renamed set (mechanical). 2. Rulings pass → R21+.
3. Harness behind wave1 flag: 500-sim ×10 matchups; new-baseline decision;
no faction ±3 from launch; Deva–Naga stays a designed counter (THE number).
4. Ratna audit: Gupta-only vs Ratna-inclusive ≈ 0 advantage. 5. Then art.
SIM PRIORITY LIST: Deva–Naga counter (Mahapadma/Dhanvantari/Garuda weights
both sides) · Throne of the Second King · Kartikeya vs Asura wave ·
Suryastra-in-Patala · Kalpavriksha+Dawn Banner · Living Bridge uptime ·
Mahishasura hunger · Brahmadanda mirror · Iron Crucible anti-Naga drift ·
Anjaneya's Roar vs Rama Naam.
