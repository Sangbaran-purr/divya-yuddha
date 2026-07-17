// ============================================================================
// tools/sim_campaign.js — WAVE-1 (and future-wave) BALANCE CAMPAIGN. KEEPER.
// A MEASUREMENT tool: it never edits the engine. Runs AI-vs-AI matches with the
// wave pool ON, aggregates per matchup, audits Ratna advantage, and probes the
// named campaign sim flags (frequency + magnitude + verdict). Seasonal waves reuse it.
//   node tools/sim_campaign.js            (full: RUN1 + RUN2 + RUN3)
//   node tools/sim_campaign.js run1        run2        run3
// ============================================================================
const E = require('../src/engine.js');
function seeded(seed){ let s=seed>>>0; return ()=>{ s=(s*1664525+1013904223)>>>0; return s/4294967296; }; }
function shuffleNames(arr, rng){ const a=arr.slice(); for (let i=a.length-1;i>0;i--){ const j=Math.floor(rng()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
const FAC=['devas','asuras','vanaras','nagas'];
const FSHORT={devas:'Deva',asuras:'Asura',vanaras:'Vanara',nagas:'Naga'};
const RATNA={devas:['airavatacalf','saranyu','dawnsrebirth','suryastra','garuda','kalpavriksha'],
  asuras:['surpanakha','atikaya','brahmadanda','mayaveil','mahishi','ironcrucible'],
  vanaras:['swayamprabha','rambha','vault','anjaneyaroar','anjana','livingbridge'],
  nagas:['siltstrangler','nahusha','worldcoil','longpatience','kulika','secondthrone']};
// launch decided-win% for the f0 side of each matchup (from CLAUDE.md LAUNCH BASELINE, mrityulok, flag-off)
const MATCHUPS=[
  {key:'Deva mirror',   f0:'devas',  f1:'devas',  launch:49.8},
  {key:'Asura mirror',  f0:'asuras', f1:'asuras', launch:53.6},
  {key:'Vanara mirror', f0:'vanaras',f1:'vanaras',launch:52.8},
  {key:'Naga mirror',   f0:'nagas',  f1:'nagas',  launch:51.4},
  {key:'Deva vs Asura', f0:'devas',  f1:'asuras', launch:47.7},
  {key:'Deva vs Vanara',f0:'devas',  f1:'vanaras',launch:45.1},
  {key:'Asura vs Vanara',f0:'asuras',f1:'vanaras',launch:42.3},
  {key:'Deva vs Naga',  f0:'devas',  f1:'nagas',  launch:40.9},
  {key:'Asura vs Naga', f0:'asuras', f1:'nagas',  launch:49.0},
  {key:'Vanara vs Naga',f0:'vanaras',f1:'nagas',  launch:57.3},
];
const LAUNCH_FACTION={Deva:44.6, Asura:47.9, Vanara:56.6, Naga:50.9};   // avg cross-matchup win%

function playGame(opts){ const g=E.newGame(opts); let guard=0; while(!g.over && guard++<800) E.aiTakeTurn(g,g.turn); return g; }
const num=(s,re)=>{ const m=s.match(re); return m?+m[1]:0; };
const all=(s,re)=>{ let n=0,m; const r=new RegExp(re,'g'); while((m=r.exec(s)))n++; return n; };
const sum=(s,re)=>{ let t=0,m; const r=new RegExp(re,'g'); while((m=r.exec(s)))t+=+m[1]; return t; };

// ---------- FLAG PROBES (scan g.log; frequency = games with ≥1, magnitude = totals) ----------
function newFlags(){ return {}; }
function bump(F,k,games,mag){ if(!F[k])F[k]={games:0,events:0,mag:0}; if(games)F[k].games++; F[k].events+=games; F[k].mag+=(mag||0); }
function scan(g, F, mkey){
  const L=g.log.map(l=>l.msg).join('\n'); const has=(x)=>L.includes(x);
  const naga = g.players[0].faction==='nagas'||g.players[1].faction==='nagas';
  // 1 Second King
  const steals=all(L,'drinks the stolen venom'); const stealMag=sum(L,'drinks the stolen venom \\(\\+(\\d+)\\)');
  bump(F,'secondking', steals>0?1:0, stealMag); if(steals>0){ F.secondking.stealEvents=(F.secondking.stealEvents||0)+steals; }
  if(has('Throne of the Second King') && has('Hymn of the Depths rises')) bump(F,'sk_hymn',1,0);
  if(has('Throne of the Second King') && has('Vasuki')) bump(F,'sk_vasuki',1,0);
  // 2 Kalakuta -> Serpent's Kiss (both in the same game)
  if(has('Kalakuta Vial shatters') && has("Serpent's Kiss sinks home")) bump(F,'kalakuta_kiss',1,0);
  if(has("Serpent's Kiss sinks home")) bump(F,'serpentkiss',1,0);
  // 3 Hymn
  const hymns=all(L,'Hymn of the Depths rises'); bump(F,'hymn', hymns>0?1:0, hymns);
  // 4 Mahishi
  const mah=all(L,'Mahishi takes the shape'); bump(F,'mahishi', mah>0?1:0, mah);
  // 5 Mahapadma (presence proxy: a poisoned-enemy shield-block is silent; count games it was drawn/played)
  if(inPlay(g,'mahapadma')) bump(F,'mahapadma',1,0);
  // 6 Vidyutastra x Chandrahas (4-surge): Vidyutastra cast under Chandrahas
  if(has('Vidyutastra cracks') && has('Chandrahas doubles Vidyutastra')) bump(F,'vidyut_chandra',1,0);
  // 7 Mohanastra doubled (Chandrahas doubles Mohanastra)
  if(has('Chandrahas doubles Mohanastra')) bump(F,'mohanastra_double',1,0);
  // 8 Dawn Banner
  if(has('Dawn Banner is raised')) bump(F,'dawnbanner',1,0);
  // 9 Kalpavriksha + Dawn Banner composed
  if(has('Kalpavriksha grants') && has('Dawn Banner is raised')) bump(F,'kalpa_banner',1,0);
  if(has('Kalpavriksha grants')) bump(F,'kalpavriksha',1,0);
  // 10 Living Bridge
  const lb=all(L,'The Living Bridge spans'); bump(F,'livingbridge', lb>0?1:0, sum(L,'spans — the (\\d+)'));
  // 11 Suryastra (in Patala handled by the realm=patala batch)
  const sury=all(L,'Suryastra blazes'); bump(F,'suryastra', sury>0?1:0, sury);
  // 12 Kartikeya answers (astra self-punishment)
  const kart=all(L,'Kartikeya answers the Astra'); bump(F,'kartikeya', kart>0?1:0, kart);
  // 13 Iron Crucible regain totals
  const ic=all(L,'The Iron Crucible reforges'); bump(F,'ironcrucible', ic>0?1:0, sum(L,'reforges (\\d+) Unit'));
  // 14 Anjaneya's Roar vs Rama Naam
  if(has("Anjaneya's Roar shakes") && has('Rama Naam resounds')) bump(F,'roar_ramanaam',1,0);
  if(has("Anjaneya's Roar shakes")) bump(F,'anjaneyaroar',1,0);
  // 15 Mahishasura hunger (unfed = decayed)
  const unfed=all(L,'hunger goes unfed'); if(inPlay(g,'mahishasura')){ bump(F,'mahishasura', 1, unfed); F.mahishasura.unfedEvents=(F.mahishasura.unfedEvents||0)+unfed; }
  // 16 Brahmadanda in the Asura mirror
  if(mkey==='Asura mirror' && has('Brahmadanda strikes')) bump(F,'brahmadanda_mirror',1,0);
  // 17 Garuda cleanse (esp. Deva-Naga)
  const gar=all(L,'Garuda devours'); const garMag=sum(L,'Garuda devours (\\d+) Venom');
  bump(F,'garuda', gar>0?1:0, garMag); if(mkey==='Deva vs Naga' && gar>0) bump(F,'garuda_devanaga',1,garMag);
  if(mkey==='Deva vs Naga' && inPlay(g,'dhanvantari')) bump(F,'dhanvantari_devanaga',1,0);
  if(mkey==='Deva vs Naga' && inPlay(g,'mahapadma')) bump(F,'mahapadma_devanaga',1,0);
}
function inPlay(g,id){ for(const s of[0,1]){ const p=g.players[s]; if(p.artifact&&p.artifact.id===id)return true; for(const z of[p.units,p.heroes,p.discard]) if(z.some(c=>c.id===id))return true; } return false; }

// ---------- RUN 1: core table 500x10, wave ON, mrityulok ----------
function run1(N){
  const F=newFlags(); const rows=[]; const facWins={devas:{w:0,d:0},asuras:{w:0,d:0},vanaras:{w:0,d:0},nagas:{w:0,d:0}};
  for(const mu of MATCHUPS){ let p0=0,p1=0,draw=0;
    for(let k=0;k<N;k++){ const g=playGame({rng:seeded(1000+k),p0Faction:mu.f0,p1Faction:mu.f1,realm:'mrityulok',wave1:true});
      if(g.winner===0)p0++; else if(g.winner===1)p1++; else draw++; scan(g,F,mu.key); }
    const dec=p0+p1, wr=dec?100*p0/dec:0; rows.push({mu,p0,p1,draw,wr});
  }
  // faction cross-aggregates (F's win% in each cross it appears)
  const cross=rows.filter(r=>r.mu.f0!==r.mu.f1);
  const facAgg={}; for(const f of FAC){ let tot=0,n=0; for(const r of cross){ if(r.mu.f0===f){tot+=r.wr;n++;} else if(r.mu.f1===f){tot+=(100-r.wr);n++;} } facAgg[FSHORT[f]]=tot/n; }
  return {rows,F,facAgg};
}

// ---------- RUN 2: Ratna audit ----------
function run2(N){
  const out={};
  for(const f of FAC){ const names=E.DECKS[f].map(c=>c.n); const ratnaNames=new Set(RATNA[f].map(id=>E.DECKS[f].find(c=>c.id===id).n));
    let incW=0,incDec=0,gupW=0,gupDec=0;
    for(const opp of FAC){ const oppNames=E.DECKS[opp].map(c=>c.n);
      for(let k=0;k<N;k++){ const dr=seeded(5000+k*7); const shuf=shuffleNames(names,dr); const oppDeck=shuffleNames(oppNames,seeded(9000+k*11));
        const gInc=playGame({rng:seeded(1000+k),p0Faction:f,p1Faction:opp,realm:'mrityulok',wave1:true,scenario:{p0Deck:shuf,p1Deck:oppDeck}});
        if(gInc.winner===0)incW++; if(gInc.winner!=null)incDec++;
        const gup=shuf.filter(n=>!ratnaNames.has(n));
        const gGup=playGame({rng:seeded(1000+k),p0Faction:f,p1Faction:opp,realm:'mrityulok',wave1:true,scenario:{p0Deck:gup,p1Deck:oppDeck}});
        if(gGup.winner===0)gupW++; if(gGup.winner!=null)gupDec++;
      }
    }
    out[FSHORT[f]]={inc:100*incW/incDec, gup:100*gupW/gupDec, delta:100*incW/incDec-100*gupW/gupDec};
  }
  return out;
}

// ---------- RUN 3 extra: Suryastra-in-Patala targeted batch ----------
function run3patala(N){
  const F=newFlags();
  for(let k=0;k<N;k++){ const g=playGame({rng:seeded(2000+k),p0Faction:'devas',p1Faction:'nagas',realm:'patala',wave1:true});
    const L=g.log.map(l=>l.msg).join('\n'); if(L.includes('Suryastra blazes')) bump(F,'suryastra_patala',1,all(L,'Suryastra blazes')); }
  return F.suryastra_patala||{games:0,events:0};
}

// ============================================================================
// TASK 21b — ATTRIBUTION PROBES (measurement only). Split the breaches into
// card-intrinsic power vs AI-capability artifact.
// ============================================================================
function inPlaySide(g,s,id){ const p=g.players[s]; if(p.artifact&&p.artifact.id===id)return true; for(const z of[p.units,p.heroes,p.discard]) if(z.some(c=>c.id===id))return true; return false; }

// STEP 0(a) — per-card win-attribution in the breach matchup (Asura-vs-Vanara)
function attribution(N){
  const won={0:{},1:{}}, lost={0:{},1:{}};
  for(let k=0;k<N;k++){ const g=playGame({rng:seeded(1000+k),p0Faction:'asuras',p1Faction:'vanaras',realm:'mrityulok',wave1:true});
    if(g.winner==null) continue;
    for(const s of[0,1]){ const fac=g.players[s].faction; const wl=(g.winner===s)?won[s]:lost[s];
      for(const c of E.DECKS[fac]) if(c.wave && inPlaySide(g,s,c.id)) wl[c.id]=(wl[c.id]||0)+1; }
  }
  function rank(s){ const ids=new Set([...Object.keys(won[s]),...Object.keys(lost[s])]);
    return [...ids].map(id=>{ const w=won[s][id]||0,l=lost[s][id]||0,t=w+l; const nm=E.DECKS[s===0?'asuras':'vanaras'].find(c=>c.id===id).n;
      return {id,nm,t,wr:t?100*w/t:0}; }).filter(x=>x.t>=30).sort((a,b)=>b.wr-a.wr); }
  return {asura:rank(0), vanara:rank(1)};
}

// STEP 0(b) — Garuda plays vs fires
function garudaVal(N){
  let plays=0, fires=0, fireMag=0, gamesWithGaruda=0;
  for(const [f0,f1] of [['devas','nagas'],['devas','asuras'],['devas','vanaras'],['devas','devas']]){
    for(let k=0;k<N;k++){ const g=playGame({rng:seeded(1000+k),p0Faction:f0,p1Faction:f1,realm:'mrityulok',wave1:true});
      const L=g.log.map(l=>l.msg).join('\n');
      const d=all(L,'Garuda devours'), sp=all(L,'Garuda spreads his wings');
      if(d+sp>0)gamesWithGaruda++; plays+=d+sp; fires+=d; fireMag+=sum(L,'Garuda devours (\\d+) Venom');
    }
  }
  return {plays,fires,fireMag,gamesWithGaruda,totalGames:N*4};
}

// PROBE 1 — ablation ladder (scenario-injected decks, matched seeds)
function ablation(N){
  const aN=E.DECKS.asuras.map(c=>c.n), vN=E.DECKS.vanaras.map(c=>c.n);
  function measure(rmA, rmV){ let w=0,dec=0;
    for(let k=0;k<N;k++){ const a=shuffleNames(aN,seeded(6000+k*7)).filter(n=>n!==rmA); const v=shuffleNames(vN,seeded(8000+k*11)).filter(n=>n!==rmV);
      const g=playGame({rng:seeded(1000+k),p0Faction:'asuras',p1Faction:'vanaras',realm:'mrityulok',wave1:true,scenario:{p0Deck:a,p1Deck:v}});
      if(g.winner===0)w++; if(g.winner!=null)dec++; }
    return 100*w/dec; }
  const control=measure(null,null);
  const asuraSusp=['Mahishasura','Holika','Andhaka','Atikaya','Vritra','Mahishi','The Iron Crucible'];
  const vanaraSusp=['The Living Bridge','Setu Mason',"Anjaneya's Roar",'Rambha the Bold','Anjana'];
  const aRes=asuraSusp.map(nm=>({nm, wr:measure(nm,null)}));            // asura(p0) win% with that Asura card removed
  const vRes=vanaraSusp.map(nm=>({nm, wr:100-measure(null,nm)}));       // vanara(p1) win% with that Vanara card removed
  return {control, controlVanara:100-control, aRes, vRes};
}

// PROBE 2 — AI-sensitivity split (shipped difficulty opts; Death Match excluded)
function aisens(N){
  function cell(d0,d1){ let w=0,dec=0;
    for(let k=0;k<N;k++){ const g=playGame({rng:seeded(1000+k),p0Faction:'asuras',p1Faction:'vanaras',realm:'mrityulok',wave1:true,p0Difficulty:d0,p1Difficulty:d1});
      if(g.winner===0)w++; if(g.winner!=null)dec++; }
    return 100*w/dec; }
  return { c1:cell('advanced','advanced'), c2:cell('beginner','advanced'), c3:cell('advanced','beginner') };
}

// PROBE 3 — Vanara execution-gap audit (turn-by-turn snapshots, Asura-vs-Vanara, Vanara=p1)
function vanaraExec(N){
  let leaps=0, vault=0, stones=0, riksha=0, bridgeOn=0, bridgeFire=0;
  let peakSum=0, peakGe4=0, handAtPeakSum=0, ceilGe4=0, games=0;
  for(let k=0;k<N;k++){ games++;
    const g=E.newGame({rng:seeded(1000+k),p0Faction:'asuras',p1Faction:'vanaras',realm:'mrityulok',wave1:true});
    let guard=0, peak=0, handAtPeak=0;
    while(!g.over && guard++<800){ E.aiTakeTurn(g,g.turn);
      const v=g.players[1]; const w=v.units.filter(u=>!u.ghost).length;
      if(w>peak){ peak=w; handAtPeak=v.hand.filter(c=>c.t==='unit').length; } }
    const L=g.log.map(l=>l.msg).join('\n');
    leaps+=all(L,'Leap!'); vault+=all(L,'Vault of the Sky lifts'); stones+=all(L,'enter adjacent'); riksha+=all(L,'Riksha');
    if(inPlaySide(g,1,'livingbridge')){ bridgeOn++; if(L.includes('The Living Bridge spans')) bridgeFire++; }
    peakSum+=peak; if(peak>=4)peakGe4++; handAtPeakSum+=handAtPeak; if(peak+handAtPeak>=4)ceilGe4++;
  }
  return { games, leapsPerGame:leaps/games, vaultPerGame:vault/games, stonesPer:stones/games, rikshaPer:riksha/games,
    bridgeOn, bridgeFire, bridgeFireRate: bridgeOn?100*bridgeFire/bridgeOn:0,
    peakWidth:peakSum/games, peakGe4Rate:100*peakGe4/games, handAtPeak:handAtPeakSum/games, ceilGe4Rate:100*ceilGe4/games };
}

// ============================================================================
// TASK 22 — pre/post capability metrics (same seeds as 21b). Run under both the
// pre-22 (git stash) and post-22 engine to get the three deltas.
// ============================================================================
function probe22(N){
  // Stones anchor + Bridge fire-rate: Asura(p0) vs Vanara(p1), turn-by-turn
  let stonesOpp=0, bridgePlayed=0, bridgeFire=0, bridgeOnEnd=0, bridgeFireEnd=0;
  for(let k=0;k<N;k++){ const g=E.newGame({rng:seeded(1000+k),p0Faction:'asuras',p1Faction:'vanaras',realm:'mrityulok',wave1:true});
    let guard=0;
    while(!g.over && guard++<800){ const pi=g.turn; const v=g.players[1];
      const before = pi===1 ? v.units.filter(u=>!u.ghost).length : -1;
      const hadStones = pi===1 && v.artifact && v.artifact.id==='setustones';
      E.aiTakeTurn(g,pi);
      if (hadStones && v.units.filter(u=>!u.ghost).length>before) stonesOpp++;   // a Unit entered while Setu Stones was active (an anchor OPPORTUNITY; post-22 sets the anchor on each — proven behaviorally)
    }
    const L=g.log.map(l=>l.msg).join('\n');
    if (L.includes('plays The Living Bridge')){ bridgePlayed++; if (L.includes('The Living Bridge spans')) bridgeFire++; }
    if (inPlaySide(g,1,'livingbridge')){ bridgeOnEnd++; if (L.includes('The Living Bridge spans')) bridgeFireEnd++; }   // 21b method (end-state), for apples-to-apples delta vs 29.3%
  }
  // Garuda plays/fires over Deva games
  let gPlays=0, gFires=0;
  for(const [f0,f1] of [['devas','nagas'],['devas','asuras'],['devas','vanaras'],['devas','devas']]){
    for(let k=0;k<N;k++){ const g=playGame({rng:seeded(1000+k),p0Faction:f0,p1Faction:f1,realm:'mrityulok',wave1:true});
      const L=g.log.map(l=>l.msg).join('\n'); gPlays+=all(L,'Garuda devours')+all(L,'Garuda spreads his wings'); gFires+=all(L,'Garuda devours'); }
  }
  return { N, stonesOpp, stonesPerGame:stonesOpp/N,
    bridgePlayed, bridgeFire, bridgeFireRatePlayed: bridgePlayed?100*bridgeFire/bridgePlayed:0,
    bridgeOnEnd, bridgeFireEnd, bridgeFireRateEnd: bridgeOnEnd?100*bridgeFireEnd/bridgeOnEnd:0,
    gPlays, gFires };
}

// ============================================================================
// TASK 24a — DESIGN-ROUND DATA PULL (measurement only). Per-card evidence table
// for the Asura/Vanara design round. Every metric names its source.
// ============================================================================
// Trigger fire-log keys — VERIFIED against src/engine.js source (the Bridge-scanner lesson: a
// renamed string silently zeroes a metric). Apostrophe-free substrings to dodge curly/straight-quote drift.
// Cards absent here are passive/read-time (Holika/Shumbha/Nishumbha/Andhaka/Setu Mason/Gaja/Anjana/Gandhamadana)
// or vanilla (Bhasma Sainika/Kishkindha Runner/Setu Stones — no dedicated fire log): fire count = N/A.
const FIRE_KEYS={
  mahishasura:'hunger goes unfed', pisacha:'Pisacha Skirmisher burns lower', ironcrucible:'Iron Crucible reforges',
  mahishi:'Mahishi takes the shape', vritra:'Vritra the Withholder binds', simhika:'Simhika seizes',
  raktabija:'blood rises as two Rakta', vidyutastra:'Vidyutastra cracks like thunder', brahmadanda:'Brahmadanda strikes',
  blueprint:'the Astra costs no turn', mohanastra:'Mohanastra clouds', surpanakha:'spite shrinks',
  mayashade:'Maya Shade takes the form', mayaveil:'Maya Veil shrouds', dhumraksha:'smoke gnaws',
  atikaya:'Atikaya rises', bloodoath:'is offered to the pyre',
  kumuda:'Kumuda swells with the Leap', rambha:'Rambha the Bold rises', sushena:'Sushena the Healer mends',
  livingbridge:'The Living Bridge spans', anjaneyaroar:'Anjaneya', makardhwaja:'Makardhwaja leaps in',
  vault:'Vault of the Sky lifts', matanga:'Blessing empowers the Leap', songcrossing:'Song of the Crossing lifts',
  vinatastalon:'Talon rakes', vayavyastra:'Vayavyastra hurls', jatayu:'last dive strikes true',
  swayamprabha:'Swayamprabha searches', gavaksha:'Gavaksha trades places', drummer:'Drummer of the Host rouses',
  sampati:'sight reveals',
};
function drawnBy(g,s,id){ const p=g.players[s]; if(p.artifact&&p.artifact.id===id)return true; for(const z of[p.hand,p.units,p.heroes,p.discard]) if(z.some(c=>c.id===id))return true; return false; }
function playedBy(g,s,id){ const p=g.players[s]; if(p.artifact&&p.artifact.id===id)return true; for(const z of[p.units,p.heroes,p.discard]) if(z.some(c=>c.id===id))return true; return false; }
// crosses where a faction appears + which side it is
const CROSSES={ asuras:[['devas','asuras',1],['asuras','vanaras',0],['asuras','nagas',0]],
                vanaras:[['devas','vanaras',1],['asuras','vanaras',1],['vanaras','nagas',0]] };
function cardTable(fac, matchups, N){
  const cards=E.DECKS[fac].filter(c=>c.wave);
  const stat={}; for(const c of cards) stat[c.id]={drawn:0,played:0,won:0,fires:0};
  let facDecided=0, facWon=0;
  for(const [f0,f1,side] of matchups){
    for(let k=0;k<N;k++){ const g=playGame({rng:seeded(1000+k),p0Faction:f0,p1Faction:f1,realm:'mrityulok',wave1:true});
      const decided=g.winner!=null; if(decided){ facDecided++; if(g.winner===side)facWon++; }
      const L=g.log.map(l=>l.msg).join('\n');
      for(const c of cards){ const st=stat[c.id];
        if(drawnBy(g,side,c.id)) st.drawn++;
        if(playedBy(g,side,c.id)){ st.played++; if(g.winner===side)st.won++; }
        if(FIRE_KEYS[c.id]) st.fires+=all(L, FIRE_KEYS[c.id].replace(/[.*+?^${}()|[\]\\]/g,'\\$&')); }
    }
  }
  const base=facDecided? 100*facWon/facDecided : 0;
  const rows=cards.map(c=>{ const st=stat[c.id]; const wr=st.played? 100*st.won/st.played : null;
    return { id:c.id, n:c.n, t:c.t, p:c.p, drawn:st.drawn, played:st.played,
      playRate: st.drawn? 100*st.played/st.drawn : 0, wr, delta: wr!=null? wr-base : null,
      fires: FIRE_KEYS[c.id]!=null? st.fires : null, lowN: st.played<100 }; });
  rows.sort((a,b)=> (a.wr==null?999:a.wr) - (b.wr==null?999:b.wr));
  return { base, rows, facDecided };
}
// tempo profile: turn-by-turn, avg round played + board-power delta the turn it lands (Asura side, Asura-vs-Vanara)
function tempoProfile(ids, N){
  const acc={}; for(const id of ids) acc[id]={n:0,roundSum:0,deltaSum:0};
  const nameToId={}; for(const c of E.DECKS.asuras) nameToId[c.n]=c.id;
  for(let k=0;k<N;k++){ const g=E.newGame({rng:seeded(1000+k),p0Faction:'asuras',p1Faction:'vanaras',realm:'mrityulok',wave1:true});
    let guard=0;
    while(!g.over && guard++<800){ const pi=g.turn;
      if(pi!==0){ E.aiTakeTurn(g,pi); continue; }
      const before=E.totalPower(g,0); const logLen=g.log.length; const rd=g.round;
      E.aiTakeTurn(g,0);
      const after=E.totalPower(g,0);
      const newLines=g.log.slice(logLen).map(l=>l.msg);
      const play=newLines.find(m=>/^You plays /.test(m)); if(!play) continue;
      const nm=play.replace(/^You plays /,'').replace(/ — .*$/,'').replace(/\.$/,'');
      const id=nameToId[nm]; if(id && acc[id]){ acc[id].n++; acc[id].roundSum+=rd; acc[id].deltaSum+=(after-before); }
    }
  }
  return ids.map(id=>({ id, ...acc[id], avgRound: acc[id].n? acc[id].roundSum/acc[id].n:0, avgDelta: acc[id].n? acc[id].deltaSum/acc[id].n:0 }));
}
// leap profile: leaps/game overall vs leaps/game in games where the suite card was played (Vanara side, Vanara crosses)
function leapProfile(ids, N){
  const nameOK={}; for(const id of ids) nameOK[id]=true;
  let totGames=0, totLeaps=0; const per={}; for(const id of ids) per[id]={games:0,leaps:0};
  for(const [f0,f1,side] of CROSSES.vanaras){
    for(let k=0;k<N;k++){ const g=playGame({rng:seeded(1000+k),p0Faction:f0,p1Faction:f1,realm:'mrityulok',wave1:true});
      const L=g.log.map(l=>l.msg).join('\n'); const leaps=all(L,'Leap!');
      totGames++; totLeaps+=leaps;
      for(const id of ids){ if(playedBy(g,side,id)){ per[id].games++; per[id].leaps+=leaps; } }
    }
  }
  return { base: totLeaps/totGames, per: ids.map(id=>({id, games:per[id].games, avg: per[id].games? per[id].leaps/per[id].games:0})) };
}

module.exports={run1,run2,run3patala,attribution,garudaVal,ablation,aisens,vanaraExec,probe22,cardTable,tempoProfile,leapProfile,CROSSES,MATCHUPS,LAUNCH_FACTION,seeded,playGame};

// ---------- CLI ----------
if(require.main===module){
  const mode=process.argv[2]||'all'; const t0=Date.now();
  const pct=x=>x.toFixed(1);
  if(mode==='all'||mode==='run1'){ const N=+process.argv[3]||500;
    console.log(`\n===== RUN 1 — CORE TABLE (${N} games x 10, wave ON, mrityulok) =====`);
    const {rows,F,facAgg}=run1(N);
    console.log('matchup            waveWR  launch  delta   verdict');
    for(const r of rows){ const d=r.wr-r.mu.launch; console.log(`${r.mu.key.padEnd(18)} ${pct(r.wr).padStart(5)}  ${pct(r.mu.launch).padStart(5)}  ${(d>=0?'+':'')+pct(d)}`.padEnd(52)+` p0${r.p0}/p1${r.p1}/dr${r.draw}`); }
    console.log('\nFACTION CROSS-AGGREGATE (TARGET A: move ≤±3):');
    for(const f of Object.keys(LAUNCH_FACTION)){ const d=facAgg[f]-LAUNCH_FACTION[f]; console.log(`  ${f.padEnd(7)} wave ${pct(facAgg[f])}  launch ${pct(LAUNCH_FACTION[f])}  delta ${(d>=0?'+':'')+pct(d)}  ${Math.abs(d)<=3?'PASS':'BREACH'}`); }
    console.log('\nFLAG PROBES (frequency games / magnitude):');
    const g10=N*10;
    for(const k of Object.keys(F).sort()){ const v=F[k]; console.log(`  ${k.padEnd(22)} games=${v.games}/${g10} (${pct(100*v.games/g10)}%)  events=${v.events}  mag=${v.mag}${v.stealEvents?` stealEvents=${v.stealEvents}`:''}${v.unfedEvents!=null?` unfed=${v.unfedEvents}`:''}`); }
    const sp=run3patala(N); console.log(`  suryastra_patala       games=${sp.games} events=${sp.events}  (Deva-vs-Naga, realm=Patala targeted batch)`);
  }
  if(mode==='all'||mode==='run2'){ const N=+process.argv[3]||300;
    console.log(`\n===== RUN 2 — RATNA AUDIT (${N} games/opponent x4 opp, matched seeds; target ≈0) =====`);
    const r=run2(N);
    for(const f of Object.keys(r)){ const v=r[f]; console.log(`  ${f.padEnd(7)} Ratna-incl ${pct(v.inc)}  Gupta-only ${pct(v.gup)}  advantage ${(v.delta>=0?'+':'')+pct(v.delta)}  ${Math.abs(v.delta)<=3?'≈0 (build-around)':'NON-TRIVIAL'}`); }
  }
  if(mode==='21b'){ const N=+process.argv[3]||500; const pct=x=>x.toFixed(1);
    console.log(`\n===== TASK 21b — ATTRIBUTION PROBES (${N} games/cell) =====`);
    console.log('\nSTEP 0(a) — per-card win-attribution, Asura-vs-Vanara (winrate when the card was in play):');
    const at=attribution(N);
    console.log('  TOP-10 ASURA winrate-LIFTERS:');
    at.asura.slice(0,10).forEach(x=>console.log(`    ${x.nm.padEnd(24)} wr ${pct(x.wr)}% (n=${x.t})`));
    console.log('  BOTTOM-10 VANARA (lowest winrate when present):');
    at.vanara.slice(-10).reverse().forEach(x=>console.log(`    ${x.nm.padEnd(24)} wr ${pct(x.wr)}% (n=${x.t})`));
    console.log('\nSTEP 0(b) — GARUDA scanner validation (log strings: FIRES="Garuda devours N Venom", PLAYED-NO-VENOM="Garuda spreads his wings"):');
    const gv=garudaVal(N);
    console.log(`    Garuda PLAYS=${gv.plays}  FIRES(cleansed)=${gv.fires}  fireMag=${gv.fireMag} venom  gamesTouched=${gv.gamesWithGaruda}/${gv.totalGames}`);
    console.log(`    -> RUN-3 line keyed on "Garuda devours" = FIRES only. PLAYS is the honest play-rate; the 0.04% was FIRES, ${gv.plays>gv.fires*3?'and PLAYS is much higher (scanner under-reported FREQUENCY of play)':'and PLAYS is similar (Garuda simply rarely drafted/played)'}.`);
    console.log('\nPROBE 1 — ABLATION LADDER (Asura-vs-Vanara, scenario-matched seeds):');
    const ab=ablation(N);
    console.log(`  CONTROL (full pools): Asura ${pct(ab.control)}% / Vanara ${pct(ab.controlVanara)}%`);
    console.log('  ASURA ablations (remove 1 Asura card; Asura win% + delta vs control):');
    ab.aRes.map(x=>({...x,d:x.wr-ab.control})).sort((a,b)=>a.d-b.d).forEach(x=>console.log(`    -${x.nm.padEnd(18)} Asura ${pct(x.wr)}%  delta ${(x.d>=0?'+':'')+pct(x.d)}`));
    console.log('  VANARA ablations (remove 1 Vanara payoff; Vanara win% + delta vs control):');
    ab.vRes.map(x=>({...x,d:x.wr-ab.controlVanara})).sort((a,b)=>a.d-b.d).forEach(x=>console.log(`    -${x.nm.padEnd(18)} Vanara ${pct(x.wr)}%  delta ${(x.d>=0?'+':'')+pct(x.d)}`));
    console.log('\nPROBE 2 — AI-SENSITIVITY SPLIT (Asura=p0, Vanara=p1; Death Match excluded):');
    const ai=aisens(N);
    console.log(`  cell1 Asura advanced vs Vanara advanced (control): Asura ${pct(ai.c1)}%`);
    console.log(`  cell2 Asura BEGINNER vs Vanara advanced:            Asura ${pct(ai.c2)}%  (degrading Asura AI: delta ${(ai.c2-ai.c1>=0?'+':'')+pct(ai.c2-ai.c1)})`);
    console.log(`  cell3 Asura advanced vs Vanara BEGINNER:            Asura ${pct(ai.c3)}%  (degrading Vanara AI: delta ${(ai.c3-ai.c1>=0?'+':'')+pct(ai.c3-ai.c1)})`);
    console.log('\nPROBE 3 — VANARA EXECUTION-GAP AUDIT (Vanara=p1, turn-by-turn):');
    const ve=vanaraExec(N);
    console.log(`  Leaps/game=${ve.leapsPerGame.toFixed(2)} (AI takes every gain>=3 leap greedily — near-optimal, not a skip-gap)`);
    console.log(`  Formation peak width/game=${ve.peakWidth.toFixed(2)}  line-of-4 rate=${pct(ve.peakGe4Rate)}%  | CEILING (peak+unplayed-units-in-hand): line-of-4 reachable=${pct(ve.ceilGe4Rate)}%  unplayed-units-at-peak/game=${ve.handAtPeak.toFixed(2)}`);
    console.log(`  Living Bridge: on-board ${ve.bridgeOn} games, fired(line-of-4) ${ve.bridgeFire} -> fire-rate ${pct(ve.bridgeFireRate)}% when on board`);
    console.log(`  movePosition channel: Vault/game=${ve.vaultPerGame.toFixed(3)}  Stones-adjacent-entry/game=${ve.stonesPer.toFixed(3)}  Riksha/game=${ve.rikshaPer.toFixed(3)}`);
  }
  if(mode==='probe22'){ const N=+process.argv[3]||500; const p=probe22(N);
    console.log(`PROBE22 (${N} games/cell) tag=${process.argv[4]||''}`);
    console.log(`  STONES anchor opportunities/game = ${p.stonesPerGame.toFixed(3)} (post-22 sets the anchor on each; pre-22 sets none — anchor code absent)`);
    console.log(`  BRIDGE fire-rate (played denom) = ${p.bridgeFireRatePlayed.toFixed(1)}%  (${p.bridgeFire}/${p.bridgePlayed})`);
    console.log(`  BRIDGE fire-rate (21b end-state denom) = ${p.bridgeFireRateEnd.toFixed(1)}%  (${p.bridgeFireEnd}/${p.bridgeOnEnd})`);
    console.log(`  GARUDA plays=${p.gPlays}  fires=${p.gFires}`);
  }
  if(mode==='24a'){ const N=+process.argv[3]||500;
    // Task-24a POOLED Δbase per card (id → 24a Δbase), for the "who moved" comparison column. Δbase is a faction-relative
    // measure (win% − faction base), so an UNCHANGED card ≈ 0 movement despite the base shift; a CHANGED card (R66–R75) shows real movement.
    const BASE_24A={ mayashade:-33.3, blueprint:-12.7, shumbha:-8.4, ashlegion:-8.1, pisacha:-7.8, raktabija:-7.2, surpanakha:-7.2, ironcrucible:-6.6, simhika:-5.7, mayaveil:-4.6, nishumbha:-4.6, brahmadanda:-4.5, dhumraksha:-3.4, andhaka:-3.3, mohanastra:-3.2, holika:-2.8, mahishasura:-2.4, atikaya:-0.9, vidyutastra:-0.0, vritra:4.1, bloodoath:4.9, mahishi:10.0,
      setustones:-14.4, kishrunner:-10.0, livingbridge:-9.9, matanga:-9.4, vayavyastra:-7.4, kumuda:-7.4, gavaksha:-7.3, setumason:-7.2, vault:-6.9, drummer:-5.0, vinatastalon:-5.0, anjaneyaroar:-3.5, songcrossing:-1.8, sushena:-1.5, gaja:-1.5, jatayu:-0.5, sampati:1.9, rambha:2.1, gandhamadana:3.3, anjana:4.7, swayamprabha:5.1, makardhwaja:6.9 };
    const CHANGED=new Set(['mahishi','bloodoath','setumason','drummer','vault','matanga','kishrunner','vinatastalon','kumuda']);   // cards touched by R66–R75 (flag the movers)
    function printTable(title, T, cmp){
      console.log(`\n${title}  (faction base win% over this population = ${T.base.toFixed(1)}%, n=${T.facDecided} decided games)`);
      console.log('  card'.padEnd(26)+'type'.padEnd(9)+'P'.padEnd(4)+'drawn'.padEnd(7)+'played'.padEnd(8)+'play%'.padEnd(7)+'win%pl'.padEnd(8)+'Δbase'.padEnd(8)+'fires'.padEnd(7)+(cmp?'vs24a':''));
      for(const r of T.rows){ const wr=r.wr==null?'—':r.wr.toFixed(1); const d=r.delta==null?'—':(r.delta>=0?'+':'')+r.delta.toFixed(1);
        let mv='';
        if(cmp && r.delta!=null && BASE_24A[r.id]!=null){ const m=r.delta-BASE_24A[r.id]; mv=(m>=0?'+':'')+m.toFixed(1)+(CHANGED.has(r.id)?'*':''); }
        console.log('  '+r.n.padEnd(24)+r.t.padEnd(9)+('P'+r.p).padEnd(4)+String(r.drawn).padEnd(7)+String(r.played).padEnd(8)+r.playRate.toFixed(0).padEnd(7)+(wr+(r.lowN?'^':'')).padEnd(8)+d.padEnd(7)+String(r.fires==null?'—':r.fires).padEnd(7)+mv); }
    }
    console.log(`===== TASK 24a — DESIGN-ROUND PER-CARD PULL (${N} games/matchup, wave ON, post-R63/R64/R65) =====`);
    console.log('POPULATION: each faction table pools its 3 CROSS matchups (the population that defines the faction base win%); mirror excluded so Δbase is comparable. Sorted by win%-when-played ASC (worst first). ^ = LOW-N (played <100 → win% unstable). vs24a = Δbase-now minus Δbase-at-24a (who moved; * = card CHANGED by R66–R75). Δbase is faction-relative so unchanged cards ≈ 0 ± noise.');
    printTable('ASURA WAVE (22)', cardTable('asuras', CROSSES.asuras, N), true);
    printTable('VANARA WAVE (22)', cardTable('vanaras', CROSSES.vanaras, N), true);
    console.log('\n----- SECONDARY CUT A: EPICENTER Asura-vs-Vanara ONLY -----');
    printTable('ASURA wave @ Asura-vs-Vanara', cardTable('asuras', [['asuras','vanaras',0]], N));
    printTable('VANARA wave @ Asura-vs-Vanara', cardTable('vanaras', [['asuras','vanaras',1]], N));
    console.log('\n----- SECONDARY CUT B: ASURA TEMPO SUITE (Asura-vs-Vanara, turn-by-turn) -----');
    console.log('  (Kalanemi is NOT a wave card — excluded. avgRound = mean round played; avgΔboard = mean Asura board-power change the turn it lands)');
    const tempo=tempoProfile(['bloodoath','nishumbha','vidyutastra','atikaya','andhaka','mahishasura'], N);
    console.log('  card'.padEnd(16)+'plays'.padEnd(8)+'avgRound'.padEnd(10)+'avgΔboard');
    for(const r of tempo) console.log('  '+r.id.padEnd(16)+String(r.n).padEnd(8)+r.avgRound.toFixed(2).padEnd(10)+r.avgDelta.toFixed(2));
    console.log('\n----- SECONDARY CUT C: VANARA LEAP SUITE (Vanara crosses) -----');
    const lp=leapProfile(['anjana','gandhamadana','songcrossing','matanga','anjaneyaroar'], N);
    console.log(`  base leaps/game (all Vanara-cross games) = ${lp.base.toFixed(2)}   [21b reported 1.49 @ Asura-vs-Vanara]`);
    console.log('  NOTE: Saranyu is a DEVA card (Saranyu Cloud Mare), NOT Vanara — excluded from this Vanara suite.');
    console.log('  card'.padEnd(16)+'games-played'.padEnd(14)+'leaps/game-when-played');
    for(const r of lp.per) console.log('  '+r.id.padEnd(16)+String(r.games).padEnd(14)+r.avg.toFixed(2));
  }
  console.log(`\nTOTAL RUNTIME: ${((Date.now()-t0)/1000).toFixed(1)}s`);
}
