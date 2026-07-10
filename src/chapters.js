/* chapters.js — DIVYA YATRA / Book of Order data (schema per BOOK1_DESIGN §4).
   Prose (Brihaspati lines, plate text) verbatim from the design doc. Deck lists are
   ROLE-resolved against engine DECKS (selections logged in the build report).
   Loaded in the browser (window.CHAPTERS / window.STORY_PREDICATES) and in Node (module.exports). */
(function(root){

// Bonus/win predicates — pure functions of the FINAL game state g (roundHistory / players / winner / events).
// Named so they can be unit-tested against a synthetic stream (BOOK1_DESIGN §4).
const STORY_PREDICATES = {
  // CH1 bonus: win the single round by 5+ total power.
  ch1_margin5: g => { const h=g.roundHistory && g.roundHistory[0]; return !!h && h.winner===0 && (h.t0 - h.t1) >= 5; },
  // CH2 win.extra (structural): the match was won AFTER deliberately losing round 1.
  ch2_lostR1:  g => { const h=g.roundHistory && g.roundHistory[0]; return !!h && h.winner===1; },
  // CH2 bonus: win round 3 with 2+ cards still in hand.
  ch2_bonus_r3_hand2: g => (g.roundHistory||[]).length===3 && g.roundHistory[2].winner===0 && (g.players[0].hand||[]).length >= 2,
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
};

// Chapters 3-7: locked stubs for the Book of Order select screen ("The churning continues soon").
const LOCKED_STUBS = [
  { id:'b1c3', order:3, title:'The Weapons of Heaven' },
  { id:'b1c4', order:4, title:'The Churning Begins' },
  { id:'b1c5', order:5, title:'The Poison Rises' },
  { id:'b1c6', order:6, title:'The Nectar and the Net' },
  { id:'b1c7', order:7, title:'The Betrayal' },
];

const OUT = { CHAPTERS, STORY_PREDICATES, LOCKED_STUBS };
if (typeof module!=='undefined' && module.exports) module.exports = OUT;
else { root.CHAPTERS=CHAPTERS; root.STORY_PREDICATES=STORY_PREDICATES; root.LOCKED_STUBS=LOCKED_STUBS; }

})(typeof window!=='undefined'?window:this);
