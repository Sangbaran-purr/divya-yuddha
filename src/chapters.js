/* chapters.js — DIVYA YATRA / Book of Order data (schema per BOOK1_DESIGN §4).
   Prose (Brihaspati lines, plate text) verbatim from the design doc. Deck lists are
   ROLE-resolved against engine DECKS (selections logged in the build report).
   Loaded in the browser (window.CHAPTERS / window.STORY_PREDICATES) and in Node (module.exports). */
(function(root){

// Bonus/win predicates — pure functions of the FINAL game state g (roundHistory / players / winner / events).
// Named so they can be unit-tested against a synthetic stream (BOOK1_DESIGN §4).
// g.events accumulates across the WHOLE match (never cleared) — event-stream predicates see everything.
function _uidsIn(g, side, keys){ const p=(g.players&&g.players[side])||{}; const s=new Set();
  keys.forEach(k=>(p[k]||[]).forEach(c=>{ if(c) s.add(c.uid); })); return s; }
function _side0Uids(g){ return _uidsIn(g,0,['units','discard','hand','deck','heroes','removedHeroes']); }
function _side0HeroUids(g){ const s=_uidsIn(g,0,['heroes','removedHeroes']);
  ((g.players&&g.players[0]&&g.players[0].discard)||[]).forEach(c=>{ if(c&&c.t==='hero') s.add(c.uid); }); return s; }
// Astra names that emit a `destroy` event carrying the astra as the CAUSE (direct-kill / damage astras). Venom astras
// (Nagastra) kill via sweepDeaths→'reduced to 0', and Sudarshana REMOVES a Hero (no destroy) — so neither is here.
const ASTRA_DESTROY_CAUSES = new Set(['Vajra','Brahmastra','Pashupatastra','Gandiva Arrow','Lanka Dahan']);

const STORY_PREDICATES = {
  // CH1 bonus: win the single round by 5+ total power.
  ch1_margin5: g => { const h=g.roundHistory && g.roundHistory[0]; return !!h && h.winner===0 && (h.t0 - h.t1) >= 5; },
  // CH2 win.extra (structural): the match was won AFTER deliberately losing round 1.
  ch2_lostR1:  g => { const h=g.roundHistory && g.roundHistory[0]; return !!h && h.winner===1; },
  // CH2 bonus: win round 3 with 2+ cards still in hand.
  ch2_bonus_r3_hand2: g => (g.roundHistory||[]).length===3 && g.roundHistory[2].winner===0 && (g.players[0].hand||[]).length >= 2,
  // CH3 bonus: win with no friendly Unit destroyed by an enemy Astra — i.e. the shield lesson worked. VALIDATED
  // against real streams (see test_story): the ch3 opponent's telegraphed strike is Vajra (single-target, and unlike
  // AoE Pashupatastra it RESPECTS Dharma Shield). Shielding the champion (and not over-exposing a second big Unit to
  // the round-1 strike) fizzles Vajra → no astra death → EARNED; careless play (no shield) → Vajra kills → FAILED.
  ch3_no_astra_death: g => { const evs=g.events||[], s0=_side0Uids(g);
    return !evs.some(e=> e.type==='destroy' && ASTRA_DESTROY_CAUSES.has(e.abilityName) && (e.targetUids||[]).some(u=>s0.has(u))); },
  // CH4 bonus: revive at least one Unit with the revival Mantra. VALIDATED: Gayatri emits NO 'revive' event
  // (only Amrita Kalasha does) — so we detect the side-0 'play' of Gayatri Mantra (a Deva-only card, so any such
  // play event is the player's) AND that a side-0 Unit had actually fallen (a discard target existed).
  ch4_revived: g => { const evs=g.events||[], s0=_side0Uids(g);
    const playedGayatri = evs.some(e=> e.type==='play' && e.abilityName==='Gayatri Mantra');
    const anyDeath = evs.some(e=> e.type==='destroy' && (e.targetUids||[]).some(u=>s0.has(u)));
    return playedGayatri && anyDeath; },
  // CH5 bonus: no friendly Unit destroyed BY VENOM. VALIDATED: venom drains via venomLoss (emits a 'venom' event),
  // and the kill fires in sweepDeaths → destroyUnit(..., 'reduced to 0') — a GENERIC cause shared with any other
  // power-to-0 reduction. So we require a side-0 'destroy' with cause 'reduced to 0' on a uid that ALSO carried a
  // 'venom' event (the poison brought it down), not just any sweep death.
  ch5_no_venom_death: g => { const evs=g.events||[], s0=_side0Uids(g);
    const venomed=new Set(); evs.forEach(e=>{ if(e.type==='venom') (e.targetUids||[]).forEach(u=>venomed.add(u)); });
    return !evs.some(e=> e.type==='destroy' && e.abilityName==='reduced to 0' && (e.targetUids||[]).some(u=> s0.has(u) && venomed.has(u))); },
  // CH6 bonus: win with your Artifact on the board at match end. VALIDATED: endRound RETURNS at match-over BEFORE the
  // per-round board reset that clears artifacts — so the FINAL round's artifact persists into g.over. NO Asura card
  // removes an enemy Artifact (only Deva Vishwakarma can), so this fails only by CHOICE (never playing Amrita in the
  // deciding round). Star text must not imply protection.
  ch6_artifact_kept: g => g.winner===0 && !!(g.players && g.players[0] && g.players[0].artifact),
  // CH7 bonus: win with the boss's Chandrahas UNMADE — the taught graduation play (Vishwakarma unmakes the stolen
  // blade). VALIDATED: enemy-artifact destruction is STATE-ONLY (no event) — Vishwakarma sets opp.artifact=null and
  // increments the DESTROYER's counter players[0].artifactsDestroyedByMe (Yaksha Lok is the one realm that blocks it).
  // So: won AND the player destroyed ≥1 enemy Artifact (the boss's only Artifact is Chandrahas).
  ch7_unmake: g => g.winner===0 && !!g.players && (g.players[0].artifactsDestroyedByMe||0) > 0,
};

const CHAPTERS = {
  b1c1: {
    id:'b1c1', book:1, title:'The Throne Besieged', order:1,
    realm:'mrityulok', playerFaction:'devas', opponentFaction:'asuras',
    mode:'LOCKED',
    scenario:{
      p0Deck:['Yama','Surya Dev','Marut','Ashwini Kumars','Deva Soldier','Gandharva'],
      p0Hand:['Yama','Marut','Ashwini Kumars','Surya Dev','Deva Soldier'],
      p1Deck:['Vibhishana','Kali Asura','Asura Berserker','Maricha','Narakasura','Tataka'],
      winTarget:1, handSize:5, mulligan:0
    },
    // opponent: fully scripted, plays three weak Units then yields (BOOK1_DESIGN §3 CH1)
    opponentScript:[ {action:'play', cardName:'Vibhishana'}, {action:'play', cardName:'Kali Asura'}, {action:'play', cardName:'Asura Berserker'}, {action:'pass'} ],
    guidance:[
      { highlight:{card:'Yama'},           line:'The gate holds only if someone stands at it. Send the guard.' },
      { highlight:{card:'Marut'},          line:'See their number rise? Power against power — the greater total holds the field.' },
      { highlight:{card:'Ashwini Kumars'}, line:'Again. The wall is built one warrior at a time.' },
      { highlight:{card:'Surya Dev'},      line:'They yield the field. One more — make the count beyond dispute — then rest your hand.' },
      { highlight:{action:'pass'},         line:'Rest your hand. Strength held in reserve is still strength.' },
    ],
    // panels: { id, speaker?, plate, ambience? } — plate/speaker VERBATIM from BOOK1_CUTSCENE_BIBLE §3; ambience is a STUB slot
    cutscenes:{
      intro:[
        { id:'b1c1_i1', plate:'Swarga. The high seat of the gods — and tonight, a city holding its breath.', ambience:null },
        { id:'b1c1_i2', plate:"Shukracharya's raiders test the borders. Not an army — a question.", ambience:null },
        { id:'b1c1_i3', speaker:'Brihaspati', plate:'The gate holds only if someone stands at it, Indra. Come. I will show you how walls are made.', ambience:null },
      ],
      victory:[ { id:'b1c1_v1', plate:'The question was asked. The answer was a wall of the living.', ambience:null } ],
      defeat:[],
    },
    win:{ type:'matchWin' },
    bonus:{ predicateId:'ch1_margin5', label:'Win the round by 5 or more power', rewardId:'wave1-stub-b1c1' },
    rewards:{ xp:null, coins:null },
    unlocks:'b1c2',
  },

  b1c2: {
    id:'b1c2', book:1, title:'The Art of Yielding', order:2,
    realm:'mrityulok', playerFaction:'devas', opponentFaction:'asuras',
    mode:'LOCKED',
    scenario:{
      p0Deck:['Deva Soldier','Surya Dev','Yama','Vayu','Kubera','Urvashi','Marut','Ashwini Kumars','Gandharva','Vishwakarma'],
      p0Hand:['Deva Soldier','Surya Dev','Yama','Vayu','Kubera','Urvashi','Marut','Ashwini Kumars'],
      p1Deck:['Kumbhakarna','Ravana','Hiranyakashipu','Meghnad','Bana Asura','Vibhishana','Tataka','Maricha','Kali Asura','Asura Berserker'],
      winTarget:2, handSize:8, mulligan:0
    },
    // opponent overcommits round 1 (five Units), then hands off to the default AI for rounds 2-3
    opponentScript:[
      {action:'play', cardName:'Kumbhakarna'}, {action:'play', cardName:'Ravana'}, {action:'play', cardName:'Hiranyakashipu'},
      {action:'play', cardName:'Meghnad'}, {action:'play', cardName:'Bana Asura'}, {action:'pass'},
      {handoff:'ai'}
    ],
    guidance:[
      { highlight:{card:'Deva Soldier'}, line:'The raiders return in force. Do not meet fury with fury — send one soldier, no more.' },
      { highlight:{action:'pass'},       line:'Now yield the field. Every card they burn on an empty gate is a card they will not have when it matters.' },
      // sticky beat — rounds 2 & 3, guided by superior hand count (auto-highlight best; pass when ahead & thin)
      { highlight:{auto:'bestOrPass'},   line:'Six against three. Now the mathematics of patience — spend your advantage, and hold the last word.' },
    ],
    cutscenes:{
      intro:[
        { id:'b1c2_i1', plate:'They came back. All of them.', ambience:null },
        { id:'b1c2_i2', speaker:'Brihaspati', plate:'Fury spends itself fastest on an empty field. Let them have the morning.', ambience:null },
      ],
      // mid-match: b1c2_i3 fires ONCE after round 1 resolves (the scripted loss), before round 2 — PULL-OUT per the motion manifest
      mid:[ { afterRound:1, panels:[ { id:'b1c2_i3', plate:'We do not lose the morning. We lend it.', ambience:null } ] } ],
      victory:[ { id:'b1c2_v1', plate:'They spent everything to win a field we never wanted. The afternoon belonged to arithmetic.', ambience:null } ],
      defeat:[],
    },
    win:{ type:'matchWin', extra:'ch2_lostR1' },
    bonus:{ predicateId:'ch2_bonus_r3_hand2', label:'Win round 3 with 2+ cards in hand', rewardId:'wave1-stub-b1c2' },
    rewards:{ xp:null, coins:null },
    unlocks:'b1c3',
  },

  // ============================ CH.3 — THE WEAPONS OF HEAVEN ============================
  // SUGGESTED mode debuts. Teaches Astras (yours + theirs), Dharma Shield, the realm chip.
  b1c3: {
    id:'b1c3', book:1, title:'The Weapons of Heaven', order:3,
    realm:'swarga', playerFaction:'devas', opponentFaction:'asuras',
    mode:'SUGGESTED',
    // p0: Indra + 2 big Units (Surya/Yama, the "champions") + Vayu + low Units + Vajra (the answer) + Sudarshana.
    // p1: the telegraphed strike is VAJRA (single-target, and unlike AoE Pashupatastra it RESPECTS Dharma Shield —
    // this is what makes the shield lesson mechanically real; see the ch3 bonus). handSize 9 applies to BOTH (p1
    // draws 9 of 10); Vajra sits in p1's opening hand. BOOK1_DESIGN §3: "The Asuras unveil a true Astra."
    scenario:{
      p0Deck:['Indra','Surya Dev','Yama','Vayu','Marut','Ashwini Kumars','Gandharva','Vajra','Sudarshana Chakra'],
      p1Deck:['Ravana','Bana Asura','Meghnad','Vajra','Narakasura','Kali Asura','Asura Berserker','Vibhishana','Shukracharya','Tamasa'],
      handSize:9, mulligan:0
    },
    // T1–T3 Units, [MID PANEL before T4], T4 = Vajra at the player's strongest 6+ Unit — DEFLECTED if that Unit is
    // Dharma-Shielded (it then finds no mark and fizzles), then AI.
    opponentScript:[ {action:'play', cardName:'Ravana'}, {action:'play', cardName:'Bana Asura'}, {action:'play', cardName:'Meghnad'}, {action:'play', cardName:'Vajra'}, {handoff:'ai'} ],
    introLine:'The realm itself takes sides evenly — read the sky before you read your hand.',
    // Beats steer the winning DEFENSIVE line: play the champion, SHIELD it before the strike, develop small Units
    // (hold your other great Unit back so the blade finds no second mark), survive Vajra, then answer + deploy.
    guidance:[
      { highlight:{card:'Surya Dev'},                    line:'Send your radiance first — the champion the blade will seek.' },
      { highlight:{shield:'strongest'},                  line:'The blade seeks your champion. Shield first; strike after.' },
      { highlight:{card:'Marut'},                        line:'Hold your greater warriors in reserve — give the blade no second mark.' },
      { highlight:{card:'Vajra', target:'largestEnemy'}, line:'The strike is spent. Now answer — Heaven’s weapons answer only when heaven is ready.' },
      { highlight:{auto:'bestOrPass'},                   line:'The sky is yours. Bring your host to bear.' },
    ],
    // b1c3_i1 exists in assets/story; b1c3_i3 REUSES the swarga board image (zero new art); b1c3_v1 art pending → text plate.
    cutscenes:{
      intro:[
        { id:'b1c3_i1', plate:'Shukracharya no longer asks questions.', ambience:null },
        { id:'b1c3_i3', img:'assets/img/board_swarga.jpg', m:{ from:'scale(1.18)', to:'scale(1.06)', origin:'50% 50%', dur:8, ease:'ease-out', vfx:'none' }, plate:'Swarga itself takes the field. Read the sky before you read your hand.', ambience:null },
      ],
      // MID: after the opponent's 3rd turn resolves, before the Astra turn (VAJRA). Two panels over the blade image
      // (b1c3_i1): the softened telegraph, then a Brihaspati aside making the Asuras' BORROWED Vajra diegetic — both
      // play before the strike resolves (the whole mid cutscene runs, then pump() → the player's turn → the Astra turn).
      mid:[ { afterTurn:{ side:1, count:3 }, panels:[
        { id:'b1c3_i1', m:{ from:'scale(1.05)', to:'scale(1.12)', origin:'50% 40%', dur:4, ease:'ease-out', vfx:'none' }, dim:true, plate:'His stolen weapon seeks your champion.', ambience:null },
        { id:'b1c3_i1', m:{ from:'scale(1.12)', to:'scale(1.17)', origin:'50% 40%', dur:5, ease:'ease-out', vfx:'none' }, dim:true, speaker:'Brihaspati', plate:'That light is not his. He wields a stolen spark of heaven — as he will steal greater things before this ends.', ambience:null },
      ] } ],
      victory:[ { id:'b1c3_v1', plate:'Heaven’s weapons answer only when heaven is ready.', ambience:null } ],
      defeat:[],
    },
    win:{ type:'matchWin' },
    bonus:{ predicateId:'ch3_no_astra_death', label:'Win with no Unit lost to an enemy Astra', rewardId:'wave1-stub-b1c3' },
    rewards:{ xp:null, coins:null },
    unlocks:'b1c4',
  },

  // ============================ CH.4 — THE CHURNING BEGINS ============================
  // Teaches Mantras (revival) + the MULLIGAN (first time in story). Gandharva realm (Mantra plane).
  b1c4: {
    id:'b1c4', book:1, title:'The Churning Begins', order:4,
    realm:'gandharva', playerFaction:'devas', opponentFaction:'asuras',
    mode:'SUGGESTED',
    // p0Deck 12 (10 Units + Gayatri revival Mantra + Pavamana cleanse Mantra) — DELIBERATELY >handSize so the
    // mulligan can draw NEW cards (a 10-card deck fully drawn leaves an empty deck → mulligan is a no-op) and so
    // rounds 2–3 have draws. p1Deck 12 with Pashupatastra ordered into the opening hand (the guaranteed casualty).
    // Indra is included (a Hero) — the pack's "8 Units + 2 Mantras" (no Hero) loses every headless seed even with
    // competent play; ch4 teaches Mantras and carries NO removal Astra, so it needs the Indra aura AND a de-fanged
    // opponent (Ravana / Kumbhakarna / Hiranyakashipu excluded) to be winnable. Both deviations reported to the owner.
    scenario:{
      p0Deck:['Indra','Surya Dev','Yama','Vayu','Marut','Ashwini Kumars','Gandharva','Deva Soldier','Kubera','Urvashi','Gayatri Mantra','Pavamana'],
      p1Deck:['Bana Asura','Meghnad','Narakasura','Pashupatastra','Kali Asura','Asura Berserker','Vibhishana','Tataka','Maricha','Kalanemi','Tamasa'],
      handSize:10, mulligan:3
    },
    mulliganLine:'Three of your ten may return to the deck. A wise hand is chosen twice.',
    opponentScript:[ {action:'play', cardName:'Bana Asura'}, {action:'play', cardName:'Meghnad'}, {action:'play', cardName:'Narakasura'}, {action:'play', cardName:'Pashupatastra'}, {handoff:'ai'} ],
    guidance:[
      { highlight:{card:'Surya Dev'},   line:'The churning has begun. Build your line — the sea gives to the steady.' },
      { highlight:{card:'Yama'},        line:'Another. What the ocean raises, it can also take.' },
      { highlight:{card:'Gayatri Mantra'}, line:'What the churning takes, the sacred word returns.' },
      { highlight:{auto:'bestOrPass'},  line:'Now play the tide — spend when you lead, hold when you must.' },
    ],
    cutscenes:{
      intro:[
        { id:'b1c4_i1', plate:'A truce, of a kind. The ocean of milk holds treasures neither side can raise alone.', ambience:null },
        { id:'b1c4_i2', plate:'Deva and Asura, hand over hand. The world holds its breath.', ambience:null },
        { id:'b1c4_i3', plate:'And the deep began to give.', ambience:null },
      ],
      victory:[ { id:'b1c4_v1', plate:'What the churning takes, the sacred word returns.', ambience:null } ],
      defeat:[],
    },
    win:{ type:'matchWin' },
    bonus:{ predicateId:'ch4_revived', label:'Revive at least one Unit', rewardId:'wave1-stub-b1c4' },
    rewards:{ xp:null, coins:null },
    unlocks:'b1c5',
  },

  // ============================ CH.5 — THE POISON RISES ============================
  // First fight vs NAGAS. Teaches Venom from the receiving end + cleansing. Patala realm (boosts Astra dmg, NOT venom).
  b1c5: {
    id:'b1c5', book:1, title:'The Poison Rises', order:5,
    realm:'patala', playerFaction:'devas', opponentFaction:'nagas',
    mode:'SUGGESTED',
    // p0Deck = ch4's list; p0Hand guarantees Pavamana (the cleanse) in the opening hand (handSize 10 of 12 could
    // otherwise leave it in the deck). p1Deck 12 Naga with on-entry Venom appliers foregrounded (Naga Sadhu venoms
    // ALL, Naga Archer venoms one). Karkotaka intentionally EXCLUDED so ticks stay at round-end (cleaner lesson).
    // Indra included (same rationale as ch4 — no-Hero loses every seed; ch5 also has no removal Astra, only the
    // cleanse). p1 is a LIGHT Naga list (Vasuki / Kaliya / Ashvatara excluded) so the poison is a lesson, not a rout:
    // with these the player wins 12/12 AND the cleanse holds venom deaths to zero (bonus achievable). Reported.
    scenario:{
      p0Deck:['Indra','Surya Dev','Yama','Vayu','Marut','Ashwini Kumars','Gandharva','Deva Soldier','Kubera','Urvashi','Gayatri Mantra','Pavamana'],
      p0Hand:['Indra','Surya Dev','Yama','Vayu','Marut','Ashwini Kumars','Gandharva','Deva Soldier','Kubera','Pavamana'],
      p1Deck:['Naga Sadhu','Nagastra','Naga Archer','Naga Warrior','Naga Hatchling','Astika','Ulupi','Naga Warrior','Naga Hatchling','Naga Enchantress','Astika','Naga Enchantress'],
      handSize:10, mulligan:3
    },
    introLine:'Their kingdom sharpens blades, not fangs. Small mercies.',
    round2Line:'A short battle starves a slow poison — end rounds quickly.',
    // Naga Sadhu venoms ALL, Nagastra venoms ALL again (2 tokens board-wide), Naga Archer stacks one more — the player
    // FEELS the drain (tokens visible, power bleeding), but Deva boards clear between rounds so venom rarely KILLS
    // (reported): the bonus reflects power-pressure, earned by cleansing, not a routine unit-death gate.
    opponentScript:[ {action:'play', cardName:'Naga Sadhu'}, {action:'play', cardName:'Nagastra'}, {action:'play', cardName:'Naga Archer'}, {handoff:'ai'} ],
    guidance:[
      { highlight:{card:'Surya Dev'},  line:'They open with poison, not steel. Stand your line and watch the marks.' },
      { highlight:{card:'Yama'},       line:'Hold. Poison does not duel — it waits.' },
      { highlight:{card:'Pavamana'},   line:'What fire cannot purify, the sacred word can.' },
      { highlight:{auto:'bestOrPass'}, line:'End it quickly. A short battle starves a slow poison.' },
    ],
    cutscenes:{
      intro:[
        { id:'b1c5_i1', plate:'Before the nectar — the price. The ocean’s first gift was Halahala.', ambience:null },
        { id:'b1c5_i2', plate:'It did not attack. It simply was — and everything near it lessened.', ambience:null },
        { id:'b1c5_i3', plate:'The Nagas drank what spilled. And remembered whose churning spilled it.', ambience:null },
      ],
      // MID: on the FIRST Venom tick against the player — b1c5_i2 reused (RISE, faster 5s). The Brihaspati venom
      // line BECOMES the plate (suppress the duplicate dialogue bubble — handled by the driver via ctx 'mid').
      mid:[ { afterEvent:{ type:'venom', side:0 }, panels:[ { id:'b1c5_i2', m:{ from:'scale(1.12) translateY(5%)', to:'scale(1.12) translateY(-5%)', origin:'50% 50%', dur:5, ease:'linear', vfx:'smoke-heavy-green' }, plate:'Poison does not duel. It waits.', ambience:null } ] } ],
      victory:[ { id:'b1c5_v1', plate:'Poison does not duel. But it can be answered.', ambience:null } ],
      defeat:[],
    },
    win:{ type:'matchWin' },
    bonus:{ predicateId:'ch5_no_venom_death', label:'Lose no Unit to Venom', rewardId:'wave1-stub-b1c5' },
    rewards:{ xp:null, coins:null },
    unlocks:'b1c6',
  },

  // ============================ CH.6 — THE NECTAR AND THE NET ============================
  // FREE mode debuts (no guidance mask/glow). Teaches Artifacts (Amrita Kalasha) + RANDOM realm. First fully honest match.
  b1c6: {
    id:'b1c6', book:1, title:'The Nectar and the Net', order:6,
    realm:null, playerFaction:'devas', opponentFaction:'asuras',   // realm null → RANDOM (first unforced realm in story)
    mode:'FREE',
    // NEAR-REAL Deva graduation deck. NOTE (reported): the pack's "8 Units + Amrita + Gayatri + Pavamana" (no removal)
    // cannot hit the acceptance bands — an honest heavy-Asura match is a hard cliff (0% vs 100%). Two removals are added
    // so the deck can ANSWER the opponent's threats (and the ch7 boss's Chandrahas): VAJRA (unit removal) + VISHWAKARMA
    // (the "Divine Architect" — unmakes the enemy Artifact, the diegetic answer to the stolen moon-blade). p1 = de-fanged
    // Asura tier, NO Kumbhakarna/Ravana (either makes the go-wide Deva board un-winnable) → the honest match is ~9-12/12.
    scenario:{
      p0Deck:['Indra','Surya Dev','Yama','Vayu','Vishwakarma','Brihaspati','Marut','Ashwini Kumars','Kubera','Amrita Kalasha','Vajra','Pavamana'],
      p1Deck:['Bana Asura','Meghnad','Narakasura','Kali Asura','Asura Berserker','Vibhishana','Tataka','Maricha','Kalanemi','Kali Asura','Pashupatastra','Tamasa'],
      handSize:10, mulligan:3
    },
    opponentScript:[ {handoff:'ai'} ],   // FREE: the default AI plays from turn 1 — no script
    introLine:'Some treasures do not strike. They simply refuse to stop giving.',   // Artifact line, once at match start (a pointer, not a beat)
    artifactShimmer:'Amrita Kalasha',    // the Artifact card gets a one-time shimmer highlight in hand
    cutscenes:{
      intro:[
        { id:'b1c6_i1', plate:'Last of all, carried in a vessel of gold — Amrita. The undying draught.', ambience:null },
        { id:'b1c6_i2', plate:'Everything with a claim converged. Truces are mortal too.', ambience:null },
      ],
      victory:[ { id:'b1c6_v1', plate:'Some treasures do not strike. They simply refuse to stop giving.', ambience:null } ],
      defeat:[],   // shared b1_defeat (DEFEAT_PANELS) played by the driver
    },
    win:{ type:'matchWin' },
    // No Asura card removes an enemy Artifact (only Deva Vishwakarma) → this fails only by CHOICE (play Amrita in the
    // deciding round). Star text avoids any protection claim.
    bonus:{ predicateId:'ch6_artifact_kept', label:'The Kalasha never left the field', rewardId:'wave1-stub-b1c6' },
    rewards:{ xp:null, coins:null },
    unlocks:'b1c7',
  },

  // ============================ CH.7 — THE BETRAYAL (BOSS) ============================
  // Graduation: FULL rules, real opponent, no guidance. Boss plate on the VS screen; Brihaspati silent except on loss.
  b1c7: {
    id:'b1c7', book:1, title:'The Betrayal', order:7,
    realm:null, playerFaction:'devas', opponentFaction:'asuras',   // RANDOM realm
    mode:'FREE', boss:true, bossName:'Shukracharya', bossEpithet:'Master of Mritasanjivani',
    // p0 = the ch6 graduation deck UNCHANGED (familiarity is the point). p1 = BOSS list TUNED to the 6–10 band: ONE heavy
    // (Kumbhakarna) + Chandrahas + Pashupatastra. Adding a second heavy (Ravana/Hiranyakashipu) OR the Mahabali Hero
    // pushes it to 0% — so they are EXCLUDED (reported; Mahabali works across the handoff, he is just too strong). p1Hand
    // GUARANTEES Chandrahas + the two scripted opener Units. Measured ≈6.6/12 (49–59% over 4×96-seed samples) — in band.
    scenario:{
      p0Deck:['Indra','Surya Dev','Yama','Vayu','Vishwakarma','Brihaspati','Marut','Ashwini Kumars','Kubera','Amrita Kalasha','Vajra','Pavamana'],
      p1Deck:['Kumbhakarna','Bana Asura','Chandrahas','Meghnad','Narakasura','Kalanemi','Maricha','Kali Asura','Pashupatastra','Tamasa','Asura Berserker','Vibhishana'],
      p1Hand:['Kumbhakarna','Bana Asura','Chandrahas','Meghnad','Narakasura','Kalanemi','Pashupatastra','Tamasa','Kali Asura','Maricha'],
      handSize:10, mulligan:3
    },
    // LIVE_GAME_DESIGN boss pattern: two Units, then Chandrahas online by T3 (amplified Astra threat), then default AI.
    opponentScript:[ {action:'play', cardName:'Kumbhakarna'}, {action:'play', cardName:'Bana Asura'}, {action:'play', cardName:'Chandrahas'}, {handoff:'ai'} ],
    cutscenes:{
      intro:[
        { id:'b1c7_i1', plate:'The truce died where it stood.', ambience:null },
        { id:'b1c7_i2', plate:'And the last battle of the churning began.', ambience:null },
      ],
      // MID at boss T3 (Chandrahas resolves): b1c7_i2 reused, fast PULL-OUT + THE LIGHTNING FLASH (book's single use) +
      // dim. The BOSS speaks (his one line of the chapter), plate-style.
      mid:[ { afterTurn:{ side:1, count:3 }, panels:[ { id:'b1c7_i2', m:{ from:'scale(1.16)', to:'scale(1.08)', origin:'50% 55%', dur:4, ease:'ease-out', vfx:'none' }, dim:true, flash:true, speaker:'Shukracharya', plate:'The moon-blade is drawn. Everything he has, at once.', ambience:null } ] } ],
      // VICTORY: the two-phase MOHINI DRIFT (keyframed) — RISE to the vessel, hold, then a slow lateral drift toward the
      // right-edge silhouette (the Book 2 hook, delivered by the camera).
      victory:[ { id:'b1c7_v1', mohini:true, plate:'The Amrita came home. As for how it STAYED home — that is another book.', ambience:null } ],
      defeat:[],
    },
    win:{ type:'matchWin' },
    bonus:{ predicateId:'ch7_unmake', label:'The stolen blade, unmade', rewardId:'wave1-stub-b1c7' },
    rewards:{ xp:null, coins:null },
    unlocks:null,
  },
};

// Shared DEFEAT cutscene (bible §3 b1_defeat) — the driver plays it on a loss for ALL seven chapters, replacing the
// text-only defeat plate, before the retry panel. Motion: very-slow PUSH-IN on Brihaspati's face (spec §ch6–7 pack).
const DEFEAT_PANELS = [ { id:'b1_defeat', m:{ from:'scale(1.04)', to:'scale(1.10)', origin:'50% 38%', dur:9, ease:'linear', vfx:'none' }, speaker:'Brihaspati', plate:'Defeat is a teacher with poor manners. Sit with the lesson; then stand.', ambience:null } ];

// Book 1 has no more locked chapters (ch6–7 shipped).
const LOCKED_STUBS = [];

const OUT = { CHAPTERS, STORY_PREDICATES, LOCKED_STUBS, DEFEAT_PANELS };
if (typeof module!=='undefined' && module.exports) module.exports = OUT;
else { root.CHAPTERS=CHAPTERS; root.STORY_PREDICATES=STORY_PREDICATES; root.LOCKED_STUBS=LOCKED_STUBS; root.DEFEAT_PANELS=DEFEAT_PANELS; }

})(typeof window!=='undefined'?window:this);
