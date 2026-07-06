/* ============================================================
   DIVYA YUDDHA — Rules Engine v0.1 (Deva mirror match)
   Headless, UI-agnostic. Runs in browser and Node.
   ============================================================ */
const RARITY_COLOR = { L:'#C9A84C', M:'#E74C3C', E:'#9B59B6', R:'#3498DB', U:'#27AE60', C:'#888888' };
const RARITY_NAME  = { L:'Legendary', M:'Mythic', E:'Epic', R:'Rare', U:'Uncommon', C:'Common' };

const DEVA_DECK_DEF = [
  // ---- HEROES (3) ----
  { id:'indra',   n:'Indra',          sub:'King of Devas',        t:'hero', p:7, r:'L', txt:'PASSIVE: All Deva Units gain +1 power while Indra is on the board.' },
  { id:'agni',    n:'Agni',           sub:'Flame of Sacrifice',   t:'hero', p:5, r:'E', txt:'TRIGGERED: Whenever any Mantra is played, deal 1 damage to a random enemy Unit.' },
  { id:'varuna',  n:'Varuna',         sub:'Lord of Oceans',       t:'hero', p:6, r:'E', txt:'PASSIVE: Opponent cannot play more than 1 Astra per round.' },
  // ---- UNITS (12) ----
  { id:'surya',   n:'Surya Dev',      sub:'Radiance of the Dawn', t:'unit', p:6, r:'E', txt:'ON PLAY: All other friendly Units gain +1 power.' },
  { id:'brihaspati',n:'Brihaspati',   sub:'Guru of the Gods',     t:'unit', p:5, r:'E', txt:'ON PLAY: Copy the effect of the last Mantra played by either player.' },
  { id:'vayu',    n:'Vayu',           sub:'The Invisible Force',  t:'unit', p:5, r:'R', txt:'ON PLAY: The highest power enemy Unit loses 2 power. (v0.1: swap omitted)' },
  { id:'vishwakarma',n:'Vishwakarma', sub:'Divine Architect',     t:'unit', p:4, r:'R', txt:'ON PLAY: Destroy the opponent\u2019s Artifact. Gain +2 power for each Artifact destroyed this game.' },
  { id:'kubera',  n:'Kubera',         sub:'Lord of Wealth',       t:'unit', p:3, r:'R', txt:'ON PLAY: Draw 2 cards. If both are Units they gain +1 power each.' },
  { id:'urvashi', n:'Urvashi',        sub:'The Eternal Apsara',   t:'unit', p:4, r:'R', txt:'ON PLAY: Opponent discards their highest power card from hand.' },
  { id:'yama',    n:'Yama',           sub:'Lord of Dharma',       t:'unit', p:6, r:'E', txt:'PASSIVE: Destroyed friendly Units leave a 1-power ghost token behind.' },
  { id:'saraswati',n:'Saraswati',     sub:'Voice of Creation',    t:'unit', p:4, r:'R', txt:'ON PLAY: Look at opponent\u2019s hand. Lock one card \u2014 it cannot be played this round.' },
  { id:'ashwini', n:'Ashwini Kumars', sub:'Twin Healers',         t:'unit', p:3, r:'U', txt:'ON PLAY: Restore 2 power to the most wounded friendly Unit.' },
  { id:'marut',   n:'Marut',          sub:'Storm Soldier',        t:'unit', p:3, r:'C', txt:'ON PLAY: If Vayu is on your board, gain +3 power.' },
  { id:'gandharva',n:'Gandharva',     sub:'Celestial Warrior',    t:'unit', p:2, r:'C', txt:'ON PLAY: If 3+ friendly Units are on the board, gain +2 power.' },
  { id:'soldier', n:'Deva Soldier',   sub:'Keeper of Order',      t:'unit', p:2, r:'C', txt:'PASSIVE: With Indra on board, +1 power at the start of each round. (design flag: see notes)' },
  // ---- ASTRAS (3) ----
  { id:'vajra',   n:'Vajra',          sub:'Thunderbolt of Indra', t:'astra', p:0, r:'L', txt:'Destroy one enemy Unit with power 6+. If Indra is on your board: destroy ANY enemy Unit.' },
  { id:'brahmastra',n:'Brahmastra',   sub:'The Ultimate Weapon',  t:'astra', p:0, r:'M', txt:'Destroy ALL enemy Units. Overrides all shields and immunities.' },
  { id:'sudarshana',n:'Sudarshana Chakra',sub:'Disc of Vishnu',   t:'astra', p:0, r:'M', txt:'Remove one enemy Hero for this round. It returns next round at half power.' },
  // ---- MANTRAS (2) ----
  { id:'gayatri', n:'Gayatri Mantra', sub:'Light of All Worlds',  t:'mantra', p:0, r:'R', txt:'Revive the lowest power friendly Unit from your discard pile at full power, with Dharma Shield.' },
  { id:'pavamana',n:'Pavamana',       sub:'The Purifying Chant',  t:'mantra', p:0, r:'U', txt:'Heal all wounded friendly Units to full. Each healed unit gains +1 power.' },
  // ---- ARTIFACTS (2) ----
  { id:'amrita',  n:'Amrita Kalasha', sub:'Vessel of Immortality',t:'artifact', p:0, r:'M', txt:'ON PLAY: Lowest friendly Unit gains +2 power. If it is destroyed this round it revives at 1 power. (v0.1 rework)' },
  { id:'kavacha', n:'Dharma Kavacha', sub:'Shield of Sacred Law', t:'artifact', p:0, r:'R', txt:'PASSIVE: Dharma Shield protects TWO Units instead of one.' },
];

let UID = 1;
function mkCard(def){ return { ...def, uid: UID++, power: def.p, base: def.p, ghost:false, lockedRound:0, aegis:false, revivedShield:false }; }
function shuffle(a, rng){ for (let i=a.length-1;i>0;i--){ const j=Math.floor(rng()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }

function mkPlayer(name, rng){
  const deck = shuffle(DEVA_DECK_DEF.map(mkCard), rng);
  const hand = deck.splice(0,10);
  return { name, deck, hand, discard:[],
    units:[], heroes:[], artifact:null,
    passed:false, roundWins:0,
    heroPlayedThisRound:false, astrasThisRound:0,
    artifactsDestroyedByMe:0, removedHeroes:[] };
}

function newGame(opts={}){
  const rng = opts.rng || Math.random;
  const g = {
    rng, round:1, over:false, winner:null,
    players:[ mkPlayer(opts.p0||'You', rng), mkPlayer(opts.p1||'Opponent', rng) ],
    turn: rng()<0.5?0:1, lastMantra:null, log:[],
    roundHistory:[],
  };
  g.firstThisRound = g.turn;
  { const nm=g.players[g.turn].name; log(g, `Coin flip \u2014 ${nm} ${nm==='You'?'play':'plays'} first.`); }
  return g;
}

function log(g, msg){ g.log.push({ round:g.round, msg }); }

/* ---------- power & shields ---------- */
function indraOnBoard(pl){ return pl.heroes.some(h=>h.id==='indra'); }
function effPower(g, pi, c){
  if (c.t==='hero') return c.power;
  let p = c.power;
  if (!c.ghost && indraOnBoard(g.players[pi])) p += 1;   // Indra aura
  return p;
}
function shieldedSet(g, pi){
  // v0.1 auto-shield: highest effective-power unit(s) hold Dharma Shield.
  const pl = g.players[pi];
  const n = pl.artifact && pl.artifact.id==='kavacha' ? 2 : 1;
  const real = pl.units.filter(u=>!u.ghost);
  const sorted = [...real].sort((a,b)=>effPower(g,pi,b)-effPower(g,pi,a));
  const set = new Set(sorted.slice(0,n).map(u=>u.uid));
  for (const u of real) if (u.revivedShield) set.add(u.uid); // Gayatri revival shield
  return set;
}
function isShielded(g, pi, c){ return shieldedSet(g, pi).has(c.uid); }
function totalPower(g, pi){
  const pl = g.players[pi];
  let t = 0;
  for (const h of pl.heroes) t += effPower(g, pi, h);
  for (const u of pl.units)  t += effPower(g, pi, u);
  return t;
}

/* ---------- destruction / damage ---------- */
function destroyUnit(g, pi, unit, cause){
  const pl = g.players[pi];
  const ix = pl.units.indexOf(unit); if (ix<0) return;
  pl.units.splice(ix,1);
  log(g, `${unit.n} is destroyed (${cause}).`);
  if (unit.aegis && !unit.ghost){
    unit.aegis=false; unit.power=1;
    pl.units.push(unit);
    log(g, `Amrita Kalasha revives ${unit.n} at 1 power!`);
    return;
  }
  if (!unit.ghost){
    pl.discard.push(unit);
    if (pl.units.some(u=>u.id==='yama')){
      pl.units.push({ uid:UID++, id:'ghost', n:`Ghost of ${unit.n}`, sub:'Yama\u2019s token', t:'unit', p:1, r:'C', power:1, base:1, ghost:true, txt:'' });
      log(g, `Yama binds a 1-power ghost of ${unit.n} to the row.`);
    }
  }
}
function damageUnit(g, pi, unit, amt, cause){
  unit.power -= amt;
  log(g, `${unit.n} takes ${amt} damage (${cause}) \u2192 ${Math.max(unit.power,0)}.`);
  if (unit.power<=0) destroyUnit(g, pi, unit, cause);
}

/* ---------- mantra effects (shared for Brihaspati copy) ---------- */
function castMantra(g, pi, id){
  const pl=g.players[pi];
  if (id==='gayatri'){
    const units = pl.discard.filter(c=>c.t==='unit');
    if (!units.length){ log(g,'Gayatri Mantra: no fallen Unit to revive.'); return; }
    const lowest = units.reduce((a,b)=>a.base<=b.base?a:b);
    pl.discard.splice(pl.discard.indexOf(lowest),1);
    lowest.power = lowest.base; lowest.revivedShield = true;
    pl.units.push(lowest);
    log(g, `Gayatri Mantra revives ${lowest.n} at full power, shielded.`);
  } else if (id==='pavamana'){
    let healed=0;
    for (const u of pl.units){ if (!u.ghost && u.power<u.base){ u.power=u.base+1; healed++; } }
    log(g, healed?`Pavamana purifies ${healed} unit(s): healed +1.`:'Pavamana: nothing to purify.');
  }
  // Agni trigger — any mantra, either player
  for (let s=0;s<2;s++){
    if (g.players[s].heroes.some(h=>h.id==='agni')){
      const foes = g.players[1-s].units.filter(u=>!u.ghost);
      if (foes.length){
        const t = foes[Math.floor(g.rng()*foes.length)];
        log(g, `Agni (${g.players[s].name}) flares at the mantra!`);
        damageUnit(g, 1-s, t, 1, 'Agni');
      }
    }
  }
  g.lastMantra = id;
}

/* ---------- legality ---------- */
function playableIndices(g, pi){
  const pl=g.players[pi], opp=g.players[1-pi], res=[];
  pl.hand.forEach((c,i)=>{
    if (c.lockedRound===g.round) return;
    if (c.t==='hero' && pl.heroPlayedThisRound) return;
    if (c.t==='astra'){
      if (opp.heroes.some(h=>h.id==='varuna') && pl.astrasThisRound>=1) return;
      if (c.id==='vajra'){
        const indra = indraOnBoard(pl);
        const targets = opp.units.filter(u=>!u.ghost && !isShielded(g,1-pi,u) && (indra || effPower(g,1-pi,u)>=6));
        if (!targets.length) return;
      }
      if (c.id==='sudarshana' && !opp.heroes.length) return;
      if (c.id==='brahmastra' && !opp.units.some(u=>!u.ghost)) return;
    }
    if (c.t==='mantra' && c.id==='gayatri' && !pl.discard.some(x=>x.t==='unit')) return;
    res.push(i);
  });
  return res;
}

/* Targets a card needs (for UI): returns {kind, options} or null */
function targetSpec(g, pi, card){
  const opp=g.players[1-pi];
  if (card.id==='vajra'){
    const indra = indraOnBoard(g.players[pi]);
    return { kind:'enemyUnit', options: opp.units.filter(u=>!u.ghost && !isShielded(g,1-pi,u) && (indra||effPower(g,1-pi,u)>=6)) };
  }
  if (card.id==='sudarshana') return { kind:'enemyHero', options:[...opp.heroes] };
  if (card.id==='saraswati' && opp.hand.length) return { kind:'oppHandCard', options:[...opp.hand] };
  return null;
}

/* ---------- play a card ---------- */
function playCard(g, pi, handIndex, targetUid=null){
  const pl=g.players[pi], opp=g.players[1-pi];
  const c = pl.hand[handIndex];
  if (!c) throw new Error('bad hand index');
  pl.hand.splice(handIndex,1);
  log(g, `${pl.name} plays ${c.n}${c.sub?' \u2014 '+c.sub:''}.`);

  if (c.t==='hero'){
    pl.heroes.push(c); pl.heroPlayedThisRound=true;
  }
  else if (c.t==='unit'){
    pl.units.push(c);
    switch(c.id){
      case 'surya': for (const u of pl.units) if (u!==c && !u.ghost) u.power+=1;
        log(g,'Surya Dev: all other friendly Units +1.'); break;
      case 'vayu': {
        const foes=opp.units.filter(u=>!u.ghost);
        if (foes.length){ const t=foes.reduce((a,b)=>effPower(g,1-pi,a)>=effPower(g,1-pi,b)?a:b); damageUnit(g,1-pi,t,2,'Vayu'); }
        break; }
      case 'vishwakarma':
        if (opp.artifact){ log(g,`Vishwakarma unmakes ${opp.artifact.n}.`); opp.discard.push(opp.artifact); opp.artifact=null; pl.artifactsDestroyedByMe++; }
        if (pl.artifactsDestroyedByMe>0){ c.power += 2*pl.artifactsDestroyedByMe; log(g,`Vishwakarma stands at ${c.power}.`); }
        break;
      case 'kubera': {
        const drawn = pl.deck.splice(0,2); pl.hand.push(...drawn);
        log(g, `Kubera draws ${drawn.length} card(s).`);
        if (drawn.length===2 && drawn.every(d=>d.t==='unit')){ drawn.forEach(d=>d.power+=1); log(g,'Both were Units \u2014 each gains +1.'); }
        break; }
      case 'urvashi': {
        const withP = opp.hand.filter(h=>h.p>0);
        if (withP.length){ const t=withP.reduce((a,b)=>a.p>=b.p?a:b); opp.hand.splice(opp.hand.indexOf(t),1); opp.discard.push(t);
          log(g,`Urvashi\u2019s glance \u2014 ${opp.name} discards ${t.n}.`); }
        break; }
      case 'saraswati': {
        let t = targetUid!=null ? opp.hand.find(h=>h.uid===targetUid) : null;
        if (!t && opp.hand.length) t = opp.hand.reduce((a,b)=>a.p>=b.p?a:b);
        if (t){ t.lockedRound=g.round; log(g,`Saraswati locks ${t.n} for this round.`); }
        break; }
      case 'ashwini': {
        const wounded = pl.units.filter(u=>!u.ghost && u.power<u.base);
        if (wounded.length){ const t=wounded.reduce((a,b)=>(a.base-a.power)>=(b.base-b.power)?a:b);
          t.power=Math.min(t.base, t.power+2); log(g,`Ashwini Kumars heal ${t.n} \u2192 ${t.power}.`); }
        else log(g,'Ashwini Kumars: no wounds to heal.');
        break; }
      case 'marut': if (pl.units.some(u=>u.id==='vayu')){ c.power+=3; log(g,'Marut rides Vayu\u2019s wind: +3.'); } break;
      case 'gandharva': if (pl.units.filter(u=>!u.ghost).length>=4){ c.power+=2; log(g,'Gandharva\u2019s harmony: +2.'); } break; // itself + 3 others
      case 'brihaspati':
        if (g.lastMantra){ log(g,`Brihaspati repeats ${g.lastMantra==='gayatri'?'Gayatri Mantra':'Pavamana'}.`); castMantra(g, pi, g.lastMantra); }
        else log(g,'Brihaspati: no Mantra has been spoken yet.');
        break;
    }
  }
  else if (c.t==='astra'){
    pl.astrasThisRound++;
    if (c.id==='vajra'){
      const spec = targetSpec(g, pi, c);
      let t = targetUid!=null ? spec.options.find(u=>u.uid===targetUid) : null;
      if (!t) t = spec.options.reduce((a,b)=>effPower(g,1-pi,a)>=effPower(g,1-pi,b)?a:b);
      log(g,'Vajra falls!'); destroyUnit(g, 1-pi, t, 'Vajra');
    } else if (c.id==='brahmastra'){
      log(g,'BRAHMASTRA. The earth remembers, and trembles.');
      for (const u of [...opp.units]) destroyUnit(g, 1-pi, u, 'Brahmastra');
    } else if (c.id==='sudarshana'){
      let t = targetUid!=null ? opp.heroes.find(h=>h.uid===targetUid) : null;
      if (!t) t = opp.heroes.reduce((a,b)=>a.power>=b.power?a:b);
      opp.heroes.splice(opp.heroes.indexOf(t),1);
      opp.removedHeroes.push(t);
      log(g,`Sudarshana Chakra removes ${t.n} for this round.`);
    }
    pl.discard.push(c);
  }
  else if (c.t==='mantra'){ castMantra(g, pi, c.id); pl.discard.push(c); }
  else if (c.t==='artifact'){
    if (pl.artifact){ pl.discard.push(pl.artifact); log(g,`${pl.artifact.n} is replaced.`); }
    pl.artifact = c;
    if (c.id==='amrita'){
      const real=pl.units.filter(u=>!u.ghost);
      if (real.length){ const t=real.reduce((a,b)=>effPower(g,pi,a)<=effPower(g,pi,b)?a:b);
        t.power+=2; t.aegis=true; log(g,`Amrita Kalasha blesses ${t.n}: +2, revives once if destroyed.`); }
    } else log(g,'Dharma Kavacha raised \u2014 two Units now shielded.');
  }
  afterAction(g, pi);
}

function pass(g, pi){
  const pl=g.players[pi];
  pl.passed=true;
  log(g, `${pl.name} passes.`);
  afterAction(g, pi);
}

function afterAction(g, pi){
  const a=g.players[0], b=g.players[1];
  if (a.passed && b.passed){ endRound(g); return; }
  const other = 1-pi;
  g.turn = g.players[other].passed ? pi : other;
}

/* ---------- round / match resolution ---------- */
function endRound(g){
  const t0=totalPower(g,0), t1=totalPower(g,1);
  log(g, `Round ${g.round} ends \u2014 ${g.players[0].name} ${t0} vs ${g.players[1].name} ${t1}.`);
  let winner=null;
  if (t0>t1) winner=0; else if (t1>t0) winner=1;
  if (winner!=null){ g.players[winner].roundWins++; log(g, `${g.players[winner].name} wins Round ${g.round}!`); }
  else log(g, 'The round is a draw \u2014 both sides bleed.');
  g.roundHistory.push({ round:g.round, t0, t1, winner });

  if (g.players[0].roundWins>=2 || g.players[1].roundWins>=2 || g.round>=3){
    g.over=true;
    if (g.players[0].roundWins>g.players[1].roundWins) g.winner=0;
    else if (g.players[1].roundWins>g.players[0].roundWins) g.winner=1;
    else g.winner=null;
    log(g, g.winner==null ? 'The match ends in a cosmic stalemate.' : `\u2694 ${g.players[g.winner].name} WINS THE MATCH ${g.players[g.winner].roundWins}\u2013${g.players[1-(g.winner)].roundWins}!`);
    return;
  }

  // board reset
  for (let s=0;s<2;s++){
    const pl=g.players[s];
    for (const u of pl.units) if (!u.ghost){ u.revivedShield=false; u.aegis=false; u.power=u.base===u.power?u.power:u.power; pl.discard.push(u); }
    pl.units=[];
    if (pl.artifact){ pl.discard.push(pl.artifact); pl.artifact=null; }
    // removed heroes return at half power
    for (const h of pl.removedHeroes){ h.power=Math.max(1, Math.ceil(h.power/2)); pl.heroes.push(h); log(g,`${h.n} returns at ${h.power} power.`); }
    pl.removedHeroes=[];
    pl.passed=false; pl.heroPlayedThisRound=false; pl.astrasThisRound=0;
    const drawn = pl.deck.splice(0,2); pl.hand.push(...drawn);
    for (const c of pl.hand) c.lockedRound=0;
  }
  g.round++;
  const prev = g.roundHistory[g.roundHistory.length-1];
  g.turn = prev.winner!=null ? prev.winner : g.firstThisRound;  // round winner leads (design note)
  g.firstThisRound = g.turn;
  log(g, `\u2014\u2014 Round ${g.round} begins. Each side draws 2. ${g.players[g.turn].name} leads. \u2014\u2014`);
}

/* ---------- AI ---------- */
function aiScoreCard(g, pi, c){
  const pl=g.players[pi], opp=g.players[1-pi];
  let s = c.p;
  switch(c.id){
    case 'indra': s += Math.min(pl.units.filter(u=>!u.ghost).length, 5) + 2; break;
    case 'varuna': s += 2; break;
    case 'agni': s += 1; break;
    case 'surya': s += pl.units.filter(u=>!u.ghost).length; break;
    case 'marut': if (pl.units.some(u=>u.id==='vayu')) s += 3; break;
    case 'gandharva': if (pl.units.filter(u=>!u.ghost).length>=3) s += 2; break;
    case 'kubera': s += 2.5; break;
    case 'urvashi': s += 2; break;
    case 'saraswati': s += opp.hand.length? 2:0; break;
    case 'vayu': s += opp.units.some(u=>!u.ghost)? 2:0; break;
    case 'vishwakarma': s += opp.artifact? 3:0; break;
    case 'yama': s += 1.5; break;
    case 'brihaspati': s += g.lastMantra? 2:0; break;
    case 'vajra': { const spec=targetSpec(g,pi,c); s = spec.options.length? 1+Math.max(...spec.options.map(u=>effPower(g,1-pi,u))) : -99; break; }
    case 'brahmastra': s = opp.units.filter(u=>!u.ghost).reduce((k,u)=>k+effPower(g,1-pi,u),0); break;
    case 'sudarshana': s = opp.heroes.length? 2+Math.max(...opp.heroes.map(h=>h.power))/2 : -99; break;
    case 'gayatri': { const u=pl.discard.filter(x=>x.t==='unit'); s = u.length? 1+Math.min(...u.map(x=>x.base))+2 : -99; break; }
    case 'pavamana': s = pl.units.filter(u=>!u.ghost&&u.power<u.base).length*2 - 1; break;
    case 'amrita': s = pl.units.some(u=>!u.ghost)? 2.5 : -1; break;
    case 'kavacha': s = pl.units.filter(u=>!u.ghost).length>=2? 2 : 0; break;
  }
  return s;
}

function aiMove(g, pi){
  const pl=g.players[pi], opp=g.players[1-pi];
  const idxs = playableIndices(g, pi);
  const my=totalPower(g,pi), their=totalPower(g,1-pi);
  const lead = my-their;
  const mustWin = opp.roundWins===1;               // losing this round loses the match
  const wantWin = pl.roundWins===1;                // winning this round wins the match

  if (!idxs.length) return { pass:true };

  if (opp.passed){
    if (lead>0) return { pass:true };
    // find cheapest single play that flips the round
    let best=null;
    for (const i of idxs){
      const c=pl.hand[i];
      const gain = c.t==='unit'||c.t==='hero' ? c.p + (indraOnBoard(pl)&&c.t==='unit'?1:0) : aiScoreCard(g,pi,c)-c.p;
      if (gain > -lead){ if (!best || pl.hand[best].p>c.p) best=i; }
    }
    if (best!=null) return { play:best };
    // can't flip with one card: fight on if the match is at stake, else concede the round
    if (mustWin){ const i = idxs.reduce((a,b)=> aiScoreCard(g,pi,pl.hand[a])>=aiScoreCard(g,pi,pl.hand[b])?a:b); return { play:i }; }
    return { pass:true };
  }

  // opponent still active
  if (!mustWin && !wantWin && g.round===1 && lead>=10 && pl.hand.length<=opp.hand.length-1) return { pass:true }; // card-advantage bluff
  if (!mustWin && lead<=-14 && g.round<3) return { pass:true };  // concede a lost round, preserve cards

  const i = idxs.reduce((a,b)=> aiScoreCard(g,pi,pl.hand[a])>=aiScoreCard(g,pi,pl.hand[b])?a:b);
  return { play:i };
}

function aiTakeTurn(g, pi){
  const mv = aiMove(g, pi);
  if (mv.pass) pass(g, pi); else playCard(g, pi, mv.play, null);
}

/* ---------- Node export & simulation harness ---------- */
if (typeof module!=='undefined'){
  module.exports = { newGame, playCard, pass, aiMove, aiTakeTurn, totalPower, playableIndices, targetSpec, effPower, isShielded, DEVA_DECK_DEF, RARITY_COLOR, RARITY_NAME };
}
