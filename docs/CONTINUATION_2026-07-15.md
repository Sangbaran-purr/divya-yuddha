# DIVYA YUDDHA — CONTINUATION PROMPT (2026-07-15, post-Deva-wave deploy)
# Paste this as the first message of the new chat. Claude: you are
# resuming mid-project as the same collaborator — designer/QA/auditor.
# Sangbaran rules by one-liners; you recommend confidently, he
# approves or overrules; his taste wins on art, the engine wins on
# facts (Indra's Net rule: card facts from the engine pull, never
# from docs or memory — this failed twice this arc, owned both times).

═══ WHERE EVERYTHING STANDS ═══

ENGINE LANE — CLOSED (pending wave-1.1).
- 88/88 wave cards implemented; R82 ADOPTED the wave baseline
  (Asura +3.8 in-noise, Vanara −5.7 deferred to live telemetry);
  R83 renamed 8 Naga cards (names only, ids unchanged).
- Flag-off launch baseline byte-identical across all ~30 tasks —
  permanent law. Deva–Naga counter 42.7/57.3, held at every
  measurement.
- Wave-1.1 queue (ruled on REAL-PLAYER data, not AI sim): Setu
  Stones redesign · Living Bridge uptime mechanic · Garuda cleanse
  re-theme.
- Post-balance card facts that differ from old docs: Mahishi P5,
  "Round End (once per game): copy strongest friendly power THIS
  ROUND ONLY, gain-only" · Vritra P6 · Blood Oath draw 1 · Bridge
  +2 formation-moment once/round · Mason interior +3 · Runner P4 ·
  Gavaksha P4 · Talon uncapped · Kumuda +2 · Vault move+2
  permanent to unit+new neighbours · Matanga = free immediate leap
  +2 both this round.

META LAYER — SHIPPED (Tasks 30 + 30b, committed 0201c90 + 58e9769).
- Collection with TWO-FLIP reveal: sealed = Meru card back
  (assets/img/card_back.png, live, runtime probe); tap = flip to
  locked preview (dim face + acquisition line + PIN/BUY);
  acquisition ceremony fires exactly once (revealed flag).
  Backs render UPRIGHT ALWAYS (implementation law).
- Schema v6: cards{id:{owned,revealed}} only new field — 88 launch
  grandfathered, 88 wave sealed. Economy REUSED not rebuilt
  (STEP-0 STOP caught double-award: +10/win +20 first-win-of-day
  and Sadhana +10/win shipped in M1 slice 3; retro ledger
  idempotent). SADHANA RULING: PRESERVE — banked progress kept
  across pin-switches ("Progress on other pinned cards is kept."),
  auto-acquire at threshold + unpin, Gupta-only pin.
- Ratna Vault = SHOWCASE (₹199–499 by rarity, ₹1499 set, buy
  disabled with M4 gate stated). NO-BRIDGE law: no coins↔Amsha
  path, grep-proven.
- Art-pending fallback (FI_HIDDEN treatment) covers all unframed
  cards; onerror swaps only the art layer.
- ⚠ PHONE-VERIFY CHECKLIST OUTSTANDING (feel-not-logic, Sangbaran
  to run): flip timing/easing · tap-vs-scroll + hit targets ·
  ceremony flourish (1.5s gold) · back upright everywhere · Vault
  premium feel/disabled affordance · grid at 390px · pin-switch
  copy. First-purchase ceremony = the deliberate moment.

ART LANE — 132/176 FRAMED AND LIVE.
- NAGA 22/22 shipped. DEVA 22/22 shipped. ASURA 0/22, VANARA 0/22.
- Pipeline: engine pull → direction doc (v2 format: per card FILE /
  TXT verbatim / FUNCTION plain-language / FLAVOR canonical — the
  ONLY frame-quotable line / DIRECTION / optional prompt) →
  Sangbaran rolls MJ → Claude audits each frame (VERDICT first,
  TXT/flavor verbatim check, laws) → Canva q92 → Downloads →
  assets/cards/ → make_thumbs.sh → commit.
- LAWS ON RECORD: script veto everywhere (glyphs=reject) ·
  presence portraits win (mechanics live in play animations) ·
  reverence gate ("would a devotee's grandmother nod") ·
  prabha-mandala permitted on deities, generic halos banned ·
  NO CHARIOTS (MJ can't build them — mounted riders instead;
  applies to remaining waves at doc stage) · gems/frames: art
  darker than frame gold · Downloads "(1)" trap: ls -lt before
  every mv · zsh: no inline # comments · commands must be fully
  executable (no placeholders — that failed twice today).
- NAGA laws: blue-black abyss world + venom ALWAYS green; exactly
  three lights (Vishalakshi, Padmavati, Rite of Shed Skin —
  "queens walk in light" + "rebirth happens in light").
- DEVA laws: dusk-gold, sun never in frame (Suryastra sole
  exception, sunset-red, as a weapon) · "THE TREE KEEPS ITS OWN
  WEATHER" (Kalpavriksha bright exception) · "THE DARK BELONGS TO
  THE WATCH" (mandatory dark: Dawn Sentinel, Deva Sainika, Vedi
  Keeper, Vigil Rakshak, Ratri Hymn, Dawn Banner — all shipped
  compliant) · grace/rebirth/feminine-divine may be bright · the
  VEL canon = Shakti Spear's leaf-blade frame.
- OUTSTANDING ART TODOS: (1) Canva TEMPLATE SCRIM behind the
  rarity label — washed out ~11 times against bright skies; fix
  once in template. (2) Punctuation batch when files next open:
  VISHALAKSHI THE PALE (no hyphen) · NAHUSHA, FALLEN KING (comma).
  (3) card_back licensing note: generated under MJ account
  u8129477894 (not the usual u9436674583) — confirm it's
  Sangbaran's second seat.

TRAILER LANE — PARKED, INTACT.
- Accepted plates: S2, S4b, S5(cond.), S6, S7, S8b, S10, S4a.
- Open: S1 via MJ Edit-reframe of landing_bg (Route A — decides
  MJ vs Resolve for bookends; blocks S13) · six v2 re-roll prompts
  queued in chat history (S3 shadow surgery, S9 kalasha+raw sref,
  S8a silver contrast, montage a/d/f, b gopuram fix) · then Kling
  motion passes. Raw pre-Canva art only as sref, never framed PNGs.

ROADMAP: M1 largely live (quests/rank-choices already shipped
earlier; wallet+collection now) → M2 = Story Mode + wave
match-legality + deck builder (44-into-22 singleton) → M3 Nakama
multiplayer → M4 IAP (Vault buys go live) → M5 seasonal waves.

═══ CC TASK DISCIPLINE (unchanged) ═══
Rulings doc on disk BEFORE the task (mv pattern with $(ls -t ...)).
Tasks: STEP 0 diagnosis first · STOP-AND-REPORT on any
ruling-vs-shipped-fact contradiction · measurement vs change tasks
kept separate · do NOT commit — Claude audits (VERDICT first,
recompute aggregates, bounce unverified claims) then issues the
commit block · CC reports pasted as plain text · full parity
ceremony whenever index.html or engine is touched (flag-off
byte-identical, 40.9/59.1 anchor, ASTRA_DMG set, suites: scenario
50 / venom 38 / story 48, zero console.log) · scanner keys move
with any renamed log string (Bridge-scanner lesson).

═══ IMMEDIATE NEXT ACTIONS (in order) ═══
1. Sangbaran: the PHONE SESSION on the live deploy (checklist
   above). Feel fixes → small CC follow-up if needed.
2. Next lane on his word: "ASURA" → run this pull in repo root and
   paste output; the doc comes back in one reply (theme "THE
   PRICE" — Maya illusion + explicit bargains; Ratna six:
   Surpanakha, Atikaya, Brahmadanda, Maya Veil, Mahishi, Iron
   Crucible; post-balance texts apply; no-chariots inherited;
   rename review included):
   node -e "const E=require('./src/engine.js'); E.DECKS.asuras.filter(c=>c.wave).forEach(c=>console.log([c.t,c.n,'P'+(c.p||'-'),c.r,c.txt].join(' | ')))"
   …or "TRAILER" → S1 reframe verdict first, then the six v2
   re-rolls.
3. After Asura: Vanara doc (same pattern), then the trailer close,
   then M2.
