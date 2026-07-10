// test_story.js — Story Mode predicate unit tests + headless chapter drivers (ch1, ch2).
// The headless driver mirrors the browser story driver exactly, so a headless win ⇒ a browser win.
const E = require('./engine.js');
const { CHAPTERS, STORY_PREDICATES } = require('./chapters.js');
let pass=0, fail=0;
function ok(name, cond){ if(cond) pass++; else { fail++; console.log('  ✗ '+name); } }

/* ---------- (1) PREDICATE UNIT TESTS (synthetic streams) ---------- */
console.log('predicate unit tests (synthetic state):');
ok('ch1_margin5 true @ 16-10',  STORY_PREDICATES.ch1_margin5({ roundHistory:[{t0:16,t1:10,winner:0}] })===true);
ok('ch1_margin5 false @ 14-10 (margin 4)', STORY_PREDICATES.ch1_margin5({ roundHistory:[{t0:14,t1:10,winner:0}] })===false);
ok('ch1_margin5 false when round lost', STORY_PREDICATES.ch1_margin5({ roundHistory:[{t0:5,t1:12,winner:1}] })===false);
ok('ch2_lostR1 true @ R1 to foe', STORY_PREDICATES.ch2_lostR1({ roundHistory:[{winner:1}] })===true);
ok('ch2_lostR1 false @ R1 to you', STORY_PREDICATES.ch2_lostR1({ roundHistory:[{winner:0}] })===false);
ok('ch2_bonus true: R3 win, 2 in hand', STORY_PREDICATES.ch2_bonus_r3_hand2({ roundHistory:[{winner:1},{winner:0},{winner:0}], players:[{hand:[1,2]}], winner:0 })===true);
ok('ch2_bonus false: R3 win, 1 in hand', STORY_PREDICATES.ch2_bonus_r3_hand2({ roundHistory:[{winner:1},{winner:0},{winner:0}], players:[{hand:[1]}], winner:0 })===false);
ok('ch2_bonus false: match ended in 2 rounds', STORY_PREDICATES.ch2_bonus_r3_hand2({ roundHistory:[{winner:1},{winner:1}], players:[{hand:[1,2,3]}], winner:1 })===false);

/* ---------- (2) HEADLESS CHAPTER DRIVER (mirrors the UI driver) ---------- */
function seeded(seed){ let s=seed; return ()=>{ s=(s*1664525+1013904223)>>>0; return s/4294967296; }; }
// storyRng: first draw forces the player (p0) to move first; the rest is a normal seeded sequence (for the AI handoff).
function storyRng(seed){ const base=seeded(seed); let first=true; return ()=>{ if(first){ first=false; return 0.0; } return base(); }; }
function handIndexByName(pl, name){ return pl.hand.findIndex(c=>c.n===name); }
function autoBestOrPass(g){ const pl=g.players[0], opp=g.players[1];
  if(opp.passed && E.totalPower(g,0) > E.totalPower(g,1)){ E.pass(g,0); return; }   // ahead & foe done → hold the last word (banks cards)
  const idxs=E.playableIndices(g,0); const units=idxs.filter(i=>pl.hand[i].t==='unit');
  if(!units.length){ E.pass(g,0); return; }
  const pick=units.reduce((a,b)=> pl.hand[a].p>=pl.hand[b].p?a:b); E.playCard(g,0,pick);
}
function driveChapter(ch, seed){
  const g=E.newGame({ p0:'You', p1:'Foe', p0Faction:ch.playerFaction, p1Faction:ch.opponentFaction, realm:ch.realm||undefined, rng:storyRng(seed), scenario:ch.scenario });
  let bi=0, si=0, guard=0, handoff=false;
  while(!g.over && guard++<400){
    const pi=g.turn;
    if(pi===1){                                                   // opponent: scripted, then AI handoff
      const step = ch.opponentScript[si];
      if(handoff || !step || step.handoff){ handoff=true; E.aiTakeTurn(g,1); }
      else { si++; if(step.action==='pass') E.pass(g,1);
             else { const idx=handIndexByName(g.players[1], step.cardName); if(idx>=0) E.playCard(g,1,idx); else E.pass(g,1); } }
    } else {                                                      // player: consume the current guidance beat (last beat is sticky)
      const beat = ch.guidance[Math.min(bi, ch.guidance.length-1)]; bi++;
      const h = beat.highlight;
      if(h.action==='pass') E.pass(g,0);
      else if(h.auto) autoBestOrPass(g);
      else { const idx=handIndexByName(g.players[0], h.card); if(idx>=0) E.playCard(g,0,idx); else E.pass(g,0); }
    }
  }
  return g;
}

console.log('headless CH1 (fully scripted, single round, winTarget:1):');
{ const g=driveChapter(CHAPTERS.b1c1, 1);
  ok('CH1 player wins the match', g.winner===0);
  ok('CH1 single round', g.roundHistory.length===1);
  const h=g.roundHistory[0];
  ok(`CH1 margin >=5 (bonus) — was ${h.t0}-${h.t1}`, STORY_PREDICATES.ch1_margin5(g));
}

console.log('headless CH2 (scripted R1 loss → AI handoff R2-3), across seeds:');
{ let wins=0, lostR1all=true, bonusAny=false; const N=12;
  for(let s=1;s<=N;s++){ const g=driveChapter(CHAPTERS.b1c2, s*37+1);
    if(g.winner===0) wins++;
    if(!STORY_PREDICATES.ch2_lostR1(g)) lostR1all=false;
    if(STORY_PREDICATES.ch2_bonus_r3_hand2(g)) bonusAny=true;
  }
  ok(`CH2 lost round 1 by design in every seed`, lostR1all);
  ok(`CH2 player wins the match in every seed (${wins}/${N})`, wins===N);
  ok(`CH2 win.extra predicate (ch2_lostR1) holds on a win`, STORY_PREDICATES.ch2_lostR1(driveChapter(CHAPTERS.b1c2, 5)));
  ok(`CH2 bonus is achievable (win R3 with 2+ in hand, at least one seed)`, bonusAny);
}

/* ---------- (3) CH3–5 (SUGGESTED mode) headless drivers — competent play as the winnability prover ---------- */
// SUGGESTED chapters end their beats in a sticky "play your best / hold when ahead" — competent round-economy play,
// which the engine's own AI embodies. So the player runs on aiTakeTurn(g,0) (the test.js balance-prover pattern):
// if a competent player wins, a GUIDED human — who has strictly more information via the on-card suggestions — wins
// too. The opponent runs its scripted opening, then hands to the AI (mirroring the UI driver's handoff).
function driveSuggested(ch, seed){
  const g=E.newGame({ p0:'You', p1:'Foe', p0Faction:ch.playerFaction, p1Faction:ch.opponentFaction, realm:ch.realm||undefined, rng:storyRng(seed), scenario:ch.scenario });
  let si=0, guard=0, handoff=false;
  while(!g.over && guard++<600){
    if(g.turn===1){
      const step=ch.opponentScript[si];
      if(handoff || !step || step.handoff){ handoff=true; E.aiTakeTurn(g,1); }
      else { si++; if(step.action==='pass') E.pass(g,1);
             else { const idx=g.players[1].hand.findIndex(c=>c.n===step.cardName); if(idx>=0) E.playCard(g,1,idx); else E.pass(g,1); } }
    } else E.aiTakeTurn(g,0);
  }
  return g;
}
function resolveDeck(names){ return names.join(', '); }

// ch3's astra-death bonus is earned by the DEFENSIVE line — shield the champion and hold the 2nd big Unit through the
// round-1 Vajra, so the single-target strike finds no unshielded 6+ mark and fizzles. aiTakeTurn plays greedily
// (exposes a 2nd big Unit → Vajra kills it), so it proves WINNABILITY but not the bonus; the 'guided' mode proves the
// bonus is EARNABLE and 'careless' proves it's FAILABLE.
function driveCh3(seed, mode){ const ch=CHAPTERS.b1c3;
  const g=E.newGame({ p0:'You', p1:'Foe', p0Faction:'devas', p1Faction:'asuras', realm:'swarga', rng:storyRng(seed), scenario:ch.scenario });
  g.players[0].manualShield=true;
  let si=0, guard=0, handoff=false, shielded=false;
  while(!g.over && guard++<400){
    if(g.turn===1){ const st=ch.opponentScript[si];
      if(handoff||!st||st.handoff){ handoff=true; E.aiTakeTurn(g,1); }
      else { si++; if(st.action==='pass') E.pass(g,1); else { const idx=g.players[1].hand.findIndex(c=>c.n===st.cardName); if(idx>=0) E.playCard(g,1,idx); else E.pass(g,1); } } }
    else if(mode==='ai') E.aiTakeTurn(g,0);
    else if(mode==='careless'){ const pl=g.players[0]; const ui=E.playableIndices(g,0).filter(i=>pl.hand[i].t==='unit').sort((a,b)=>pl.hand[b].p-pl.hand[a].p); if(ui.length) E.playCard(g,0,ui[0]); else E.pass(g,0); }   // dump big Units, never shield
    else { const pl=g.players[0];   // 'guided': defensive round 1 (shield champion, play only small Units), then play to win
      if(g.round===1 && !handoff){ if(!shielded){ const s=pl.units.find(u=>u.id==='surya'); if(s){ E.designateShield(g,0,s.uid); shielded=true; } }
        const lows=['Surya Dev','Marut','Ashwini Kumars','Gandharva']; let pd=false;
        for(const n of lows){ const i=pl.hand.findIndex(c=>c.n===n); if(i>=0){ E.playCard(g,0,i); pd=true; break; } } if(!pd) E.pass(g,0); }
      else E.aiTakeTurn(g,0);
    }
  }
  return g;
}

for(const cid of ['b1c3','b1c4','b1c5']){
  const ch=CHAPTERS[cid];
  console.log(`\nheadless ${cid.toUpperCase()} — ${ch.title} (SUGGESTED, realm ${ch.realm}, vs ${ch.opponentFaction}):`);
  console.log(`  p0Deck: ${resolveDeck(ch.scenario.p0Deck)}`);
  console.log(`  p1Deck: ${resolveDeck(ch.scenario.p1Deck)}`);
  let wins=0, bonus=0; const N=12;
  for(let s=1;s<=N;s++){ const g=driveSuggested(ch, s*53+9);
    if(g.winner===0) wins++;
    // ch3's bonus is earned by the DEFENSIVE guided line, not greedy aiTakeTurn — prove achievable with the guided driver
    const bg = cid==='b1c3' ? driveCh3(s*53+9, 'guided') : g;
    if(STORY_PREDICATES[ch.bonus.predicateId](bg)) bonus++;
  }
  ok(`${cid} player wins the match in every seed (${wins}/${N})`, wins===N);
  ok(`${cid} bonus "${ch.bonus.label}" achievable (${bonus}/${N} seeds)`, bonus>=1);
}

/* ---------- (4) FLAGGED EVENT-STREAM VALIDATIONS against REAL streams (reported, then unit-tested) ---------- */
console.log('\nevent-stream validations (real streams):');
{ // CH3 — astra-death bonus: the strike is Vajra (single-target, RESPECTS Dharma Shield). Shielding the champion (and
  // holding the 2nd big Unit) fizzles it → EARNED; careless play (no shield, dump big Units) → Vajra kills → FAILED.
  const earned=driveCh3(62,'guided'), failed=driveCh3(62,'careless');
  const ASTRA=['Vajra','Brahmastra','Pashupatastra','Gandiva Arrow','Lanka Dahan'];
  const astraDeath=g=>{ const s0=new Set(['units','discard','hand','deck','heroes'].flatMap(k=>(g.players[0][k]||[]).map(c=>c.uid)));
    return (g.events||[]).find(e=>e.type==='destroy' && ASTRA.includes(e.abilityName) && (e.targetUids||[]).some(u=>s0.has(u))); };
  const ed=astraDeath(earned), fd=astraDeath(failed);
  console.log(`  CH3 astra-bonus: shielded (guided)→ ${ed?'DEATH '+ed.abilityName:'no astra death — Vajra fizzled'} (winner ${earned.winner}); careless→ ${fd?'DEATH '+fd.abilityName+'→'+fd.targetUids:'no death'}`);
  console.log(`  CH3 NOTE: Vajra is single-target and RESPECTS the shield — the shield lesson is now mechanically real & failable. (AoE Pashupatastra ignores shields and killed a Unit in 12/12 games → that bonus was unearnable; Asuras have no other single-target Astra, so Vajra is used per BOOK1_DESIGN §3 "the Asuras unveil a true Astra".)`);
  ok('CH3 real stream: shield the champion → Vajra fizzles → bonus EARNED (and match won)', STORY_PREDICATES.ch3_no_astra_death(earned) && earned.winner===0);
  ok('CH3 real stream: careless (no shield) → Vajra kills a Unit → bonus FAILED', !STORY_PREDICATES.ch3_no_astra_death(failed));
}
{ // CH4 — revive detection (Gayatri emits no 'revive' event)
  let found=null; for(let s=1;s<=12 && !found;s++){ const g=driveSuggested(CHAPTERS.b1c4, s*53+9);
    if((g.events||[]).some(e=>e.type==='play'&&e.abilityName==='Gayatri Mantra')) found=g; }
  const g=found||driveSuggested(CHAPTERS.b1c4, 62);
  const gayatriPlays=(g.events||[]).filter(e=>e.type==='play'&&e.abilityName==='Gayatri Mantra').length;
  const gayatriReviveEvents=(g.events||[]).filter(e=>e.type==='revive'&&e.abilityName==='Gayatri Mantra').length;
  console.log(`  CH4 revive: Gayatri 'play' events=${gayatriPlays}; Gayatri 'revive' events=${gayatriReviveEvents} → predicate=${STORY_PREDICATES.ch4_revived(g)}`);
  console.log(`  CH4 NOTE: Gayatri emits NO 'revive' event (only Amrita Kalasha does). Predicate detects the side-0 Gayatri 'play' + a prior side-0 death.`);
  ok('CH4 real stream: Gayatri emits a play event but no revive event (validated)', gayatriReviveEvents===0);
}
{ // CH5 — venom-death cause label. In the real matchup venom rarely KILLS a Deva Unit (they clear between rounds and
  // out-buff the −1/−token drain — venom's pressure is power/round-loss, so the bonus is near-always earned; REPORTED).
  // To validate the flagged cause label + the predicate's FALSE path against a REAL engine stream, force a minimal
  // death: a lone base-2 Deva Unit vs a Naga Sadhu (1 token) → round-end tick (passive −1 + token −1 = −2) kills it.
  const g=E.newGame({ p0:'You', p1:'Foe', p0Faction:'devas', p1Faction:'nagas', realm:'mrityulok', rng:storyRng(3),
    scenario:{ p0Deck:['Deva Soldier','Yama'], p0Hand:['Deva Soldier'], p1Deck:['Naga Sadhu','Naga Warrior'], p1Hand:['Naga Sadhu'], handSize:1, winTarget:1, mulligan:0 } });
  E.playCard(g,0,0);                 // player: Deva Soldier (power 2)
  E.playCard(g,1,0);                 // Naga: Naga Sadhu → Venom Token on all enemy Units
  E.pass(g,0); E.pass(g,1);          // both pass → round-end venom tick fires
  const s0=new Set(['units','discard','hand','deck','heroes'].flatMap(k=>(g.players[0][k]||[]).map(c=>c.uid)));
  const venomed=new Set(); (g.events||[]).forEach(e=>{ if(e.type==='venom')(e.targetUids||[]).forEach(u=>venomed.add(u)); });
  const vd=(g.events||[]).find(e=>e.type==='destroy' && (e.targetUids||[]).some(u=>s0.has(u)&&venomed.has(u)));
  console.log(`  CH5 venom-death (forced minimal real stream): a venomed base-2 Deva Unit died via 'destroy' abilityName='${vd?vd.abilityName:'(none)'}' — the GENERIC sweepDeaths cause (shared with any power-to-0 reduction, hence the venom-event cross-check in the predicate).`);
  console.log(`  CH5 NOTE: in the actual ch5 matchup venom rarely KILLS (units clear each round, Deva boards out-buff the drain) — the bonus is near-always earned; it rewards not IGNORING the poison.`);
  ok('CH5 real stream: venom death carries cause reduced to 0 (validated)', !!vd && vd.abilityName==='reduced to 0');
  ok('CH5 predicate returns FALSE on a real venom death', STORY_PREDICATES.ch5_no_venom_death(g)===false);
}

/* ---------- (5) predicate unit tests for the new bonuses (synthetic streams) ---------- */
console.log('\nch3–5 predicate unit tests (synthetic state):');
const _mkg=(evs, p0)=>({ events:evs, players:[p0||{}, {}] });
ok('ch3_no_astra_death true: side-0 death by a non-Astra cause', STORY_PREDICATES.ch3_no_astra_death(_mkg([{type:'destroy',abilityName:'Kumbhakarna',targetUids:[5]}], {discard:[{uid:5}]}))===true);
ok('ch3_no_astra_death false: Vajra destroys a side-0 Unit',     STORY_PREDICATES.ch3_no_astra_death(_mkg([{type:'destroy',abilityName:'Vajra',targetUids:[5]}], {discard:[{uid:5}]}))===false);
ok('ch3_no_astra_death true: Vajra destroys an ENEMY (side-1) Unit', STORY_PREDICATES.ch3_no_astra_death(_mkg([{type:'destroy',abilityName:'Vajra',targetUids:[9]}], {units:[{uid:5}]}))===true);
ok('ch4_revived true: gayatri play + a death', STORY_PREDICATES.ch4_revived(_mkg([{type:'play',abilityName:'Gayatri Mantra'},{type:'destroy',targetUids:[5]}], {discard:[{uid:5}]}))===true);
ok('ch4_revived false: no gayatri play',       STORY_PREDICATES.ch4_revived(_mkg([{type:'destroy',targetUids:[5]}], {discard:[{uid:5}]}))===false);
ok('ch4_revived false: gayatri but no death',  STORY_PREDICATES.ch4_revived(_mkg([{type:'play',abilityName:'Gayatri Mantra'}], {units:[{uid:5}]}))===false);
ok('ch5_no_venom_death false: venomed uid dies', STORY_PREDICATES.ch5_no_venom_death(_mkg([{type:'venom',targetUids:[5]},{type:'destroy',abilityName:'reduced to 0',targetUids:[5]}], {discard:[{uid:5}]}))===false);
ok('ch5_no_venom_death true: sweep death but not venomed', STORY_PREDICATES.ch5_no_venom_death(_mkg([{type:'destroy',abilityName:'reduced to 0',targetUids:[5]}], {discard:[{uid:5}]}))===true);
ok('ch5_no_venom_death true: venomed but survives', STORY_PREDICATES.ch5_no_venom_death(_mkg([{type:'venom',targetUids:[5]}], {units:[{uid:5}]}))===true);

/* ---------- (6) CH6–7 (FREE mode) headless validation — competent unguided driver ---------- */
// The competent graduating player: unmake the enemy Artifact with Vishwakarma (the diegetic answer to Chandrahas),
// remove the biggest threat with Vajra, else aiMove. amrita: 'auto' → aiMove decides (used for win-rate);
// 'keep' → HOLD Amrita (never dump it early) until the DECIDING round, then play it so it PERSISTS into g.over (bonus
// earned — endRound returns at match-over BEFORE the artifact-clearing reset); 'never' → never play it (bonus failed).
function driveFree(ch, seed, amrita){
  const g=E.newGame({ p0:'You', p1:'Foe', p0Faction:ch.playerFaction, p1Faction:ch.opponentFaction, realm:ch.realm||undefined, rng:storyRng(seed), scenario:ch.scenario });
  let si=0, guard=0, handoff=false;
  while(!g.over && guard++<600){
    if(g.turn===1){ const st=ch.opponentScript[si];
      if(handoff||!st||st.handoff){ handoff=true; E.aiTakeTurn(g,1); }
      else { si++; if(st.action==='pass') E.pass(g,1); else { const idx=g.players[1].hand.findIndex(c=>c.n===st.cardName); if(idx>=0) E.playCard(g,1,idx); else E.pass(g,1); } } }
    else { const pl=g.players[0], opp=g.players[1], idxs=E.playableIndices(g,0);
      const wi=idxs.find(i=>pl.hand[i].id==='vishwakarma'); if(wi!=null && opp.artifact){ E.playCard(g,0,wi); continue; }
      const vi=idxs.find(i=>pl.hand[i].id==='vajra'); if(vi!=null){ const foes=opp.units.filter(u=>!u.ghost); const th=foes.filter(u=>u.id==='kumbha'||u.id==='ravana'||E.effPower(g,1,u)>=6); if(th.length){ const t=th.reduce((a,b)=>E.effPower(g,1,a)>=E.effPower(g,1,b)?a:b); E.playCard(g,0,vi,t.uid); continue; } }
      const deciding = pl.roundWins === (g.winTarget-1);           // winning this round clinches the match
      const ai=idxs.find(i=>pl.hand[i].id==='amrita');
      if(amrita==='keep' && deciding && ai!=null){ E.playCard(g,0,ai); continue; }   // play the engine in the deciding round → kept
      const d=E.aiMove(g,0);
      if(d && d.play!=null && pl.hand[d.play] && pl.hand[d.play].id==='amrita' && amrita!=='auto' && !(amrita==='keep'&&deciding)){
        // HOLD Amrita: play the best non-artifact card instead; if there is none, PASS (never dump the engine early)
        const alt=idxs.filter(i=>i!==d.play && pl.hand[i].t!=='artifact');
        if(alt.length){ const pk=alt.reduce((a,b)=>(pl.hand[a].t==='unit'?pl.hand[a].p:-1)>=(pl.hand[b].t==='unit'?pl.hand[b].p:-1)?a:b); E.playCard(g,0,pk); continue; }
        E.pass(g,0); continue; }
      if(d && d.play!=null){ E.playCard(g,0,d.play,d.target,d.position); continue; }
      E.pass(g,0);
    }
  }
  return g;
}
console.log('\nCH6–7 (FREE mode) headless validation:');
{ // CH6 — win ≥9/12 + artifact bonus earnable/failable
  const N=24; let wins=0, keptEarn=0, keptNever=0;
  for(let s=1;s<=N;s++){ if(driveFree(CHAPTERS.b1c6, s*31+3, 'auto').winner===0) wins++;
    if(STORY_PREDICATES.ch6_artifact_kept(driveFree(CHAPTERS.b1c6, s*31+3, 'keep'))) keptEarn++;
    if(STORY_PREDICATES.ch6_artifact_kept(driveFree(CHAPTERS.b1c6, s*31+3, 'never'))) keptNever++; }
  console.log(`  CH6: competent wins ${(wins/N*12).toFixed(1)}/12 (${wins}/${N}); artifact-kept EARN(play Amrita in the deciding round) ${keptEarn}/${N}, NEVER-play ${keptNever}/${N}`);
  ok(`CH6 competent driver wins ≥9/12 (${(wins/N*12).toFixed(1)})`, wins/N*12 >= 9);
  ok('CH6 artifact bonus EARNABLE (kept in ≥1 keep-game)', keptEarn>=1);
  ok('CH6 artifact bonus FAILABLE (never-play keeps 0)', keptNever===0);
}
{ // CH7 — BOSS band 6–10/12 + ch7_unmake bonus (REPLACES ch7_sweep, which was unearnable) + validation items
  const N=48; let wins=0, unmakeEarn=0, chaos=0, sig=null;
  for(let s=1;s<=N;s++){ const g=driveFree(CHAPTERS.b1c7, s*31+3, 'auto'); if(g.winner===0){ wins++; if(STORY_PREDICATES.ch7_unmake(g)) unmakeEarn++;
      if(!sig && (g.players[0].artifactsDestroyedByMe||0)>0) sig={ destroyed:g.players[0].artifactsDestroyedByMe, bossArtifact:g.players[1].artifact, revive:(g.events||[]).some(e=>e.type==='destroy'&&e.abilityName==='Chandrahas') }; }
    chaos += (g.log||[]).filter(l=>/Chaos Surge/.test(l.msg)).length; }
  const per12 = wins/N*12;
  console.log(`  CH7 BOSS: competent wins ${per12.toFixed(1)}/12 (${wins}/${N}); ch7_unmake EARNED ${unmakeEarn}/${N}; Chaos Surge avg ${(chaos/N).toFixed(1)}/game`);
  console.log(`  CH7 signature (real stream): enemy-Artifact destruction is STATE-ONLY (no 'destroy' event: ${sig?sig.revive:'?'}) — on an unmake-win players[0].artifactsDestroyedByMe=${sig?sig.destroyed:'?'} AND the boss Artifact=${sig?(sig.bossArtifact?sig.bossArtifact.n:'null (Chandrahas unmade)'):'?'}.`);
  console.log(`  CH7 NOTES: (a) Mahabali works across the script→AI handoff (no misbehavior) but an 8-power Hero pushes the boss to 0% → EXCLUDED. (b) Chaos Surge ~5/game (Chandrahas doubles) but does NOT swing the band (stable across 4×96-seed samples). (c) ch7 bonus REPLACED sweep→unmake: sweep was unearnable vs an in-band boss (round-1 dominance forces 2–1, R1won=0). Unmake IS the taught graduation play — and note a NO-Vishwakarma line wins 0/96 (you MUST unmake Chandrahas to survive the doubled Pashupatastra), so the bonus is earned on almost every win; it FAILS only when the removal whiffs — the Yaksha realm ("Artifacts cannot be destroyed").`);
  ok(`CH7 boss band 6–10/12 (${per12.toFixed(1)})`, per12>=6 && per12<=10);
  ok('CH7 ch7_unmake EARNABLE (removal line unmakes Chandrahas on a win)', unmakeEarn>=1);
  ok('CH7 unmake signature: destroyed a boss Artifact + boss Artifact now null', !!sig && sig.destroyed>0 && !sig.bossArtifact);
}
{ // CH7 unmake FAILABLE — the Yaksha realm shields the boss's Chandrahas → Vishwakarma whiffs, the win earns NOTHING
  function driveYaksha(seed){ const ch=CHAPTERS.b1c7;
    const g=E.newGame({ p0:'You', p1:'Foe', p0Faction:'devas', p1Faction:'asuras', realm:'yaksha', rng:storyRng(seed), scenario:ch.scenario });
    let si=0, guard=0, handoff=false;
    while(!g.over && guard++<600){ if(g.turn===1){ const st=ch.opponentScript[si]; if(handoff||!st||st.handoff){handoff=true;E.aiTakeTurn(g,1);}else{si++;const idx=g.players[1].hand.findIndex(c=>c.n===st.cardName);if(idx>=0)E.playCard(g,1,idx);else E.pass(g,1);} }
      else { const pl=g.players[0],opp=g.players[1],idxs=E.playableIndices(g,0);
        const wi=idxs.find(i=>pl.hand[i].id==='vishwakarma'); if(wi!=null&&opp.artifact){ E.playCard(g,0,wi); continue; }   // played, but Yaksha blocks the destruction
        const d=E.aiMove(g,0); if(d&&d.play!=null)E.playCard(g,0,d.play,d.target,d.position); else E.pass(g,0);
      } }
    return g; }
  let yWins=0, yEarn=0, sample=null;
  for(let s=1;s<=24;s++){ const g=driveYaksha(s*31+3); if(g.winner===0){ yWins++; if(STORY_PREDICATES.ch7_unmake(g)) yEarn++; if(!sample) sample=g; } }
  console.log(`  CH7 unmake FAILABLE (Yaksha realm): wins ${yWins}/24, unmake-earned ${yEarn}/24 → Vishwakarma whiffs, the bonus is MISSED on a win.`);
  ok('CH7 unmake FAILABLE (a Yaksha win does not earn it)', !!sample && STORY_PREDICATES.ch7_unmake(sample)===false && yEarn===0);
}

console.log('\nch6–7 predicate unit tests (synthetic state):');
ok('ch6_artifact_kept true: won with artifact', STORY_PREDICATES.ch6_artifact_kept({ winner:0, players:[{artifact:{n:'Amrita Kalasha'}},{}] })===true);
ok('ch6_artifact_kept false: won, no artifact', STORY_PREDICATES.ch6_artifact_kept({ winner:0, players:[{artifact:null},{}] })===false);
ok('ch6_artifact_kept false: artifact but lost', STORY_PREDICATES.ch6_artifact_kept({ winner:1, players:[{artifact:{n:'Amrita Kalasha'}},{}] })===false);
ok('ch7_unmake true: won + destroyed an enemy Artifact', STORY_PREDICATES.ch7_unmake({ winner:0, players:[{artifactsDestroyedByMe:1},{}] })===true);
ok('ch7_unmake false: won but destroyed none', STORY_PREDICATES.ch7_unmake({ winner:0, players:[{artifactsDestroyedByMe:0},{}] })===false);
ok('ch7_unmake false: destroyed one but lost', STORY_PREDICATES.ch7_unmake({ winner:1, players:[{artifactsDestroyedByMe:1},{}] })===false);

console.log(`\n${fail===0?'✓ ALL':'✗'} ${pass} STORY CHECKS PASS${fail?`, ${fail} FAILED`:''}`);
process.exit(fail===0?0:1);
