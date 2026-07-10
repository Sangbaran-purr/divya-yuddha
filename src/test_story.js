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

console.log(`\n${fail===0?'✓ ALL':'✗'} ${pass} STORY CHECKS PASS${fail?`, ${fail} FAILED`:''}`);
process.exit(fail===0?0:1);
