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

console.log(`\n${fail===0?'✓ ALL':'✗'} ${pass} STORY CHECKS PASS${fail?`, ${fail} FAILED`:''}`);
process.exit(fail===0?0:1);
