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
    cutscenes:{
      intro:[
        { id:'b1c1_i1', text:['THE THRONE BESIEGED', 'Dusk on the gates of Swarga. Shukracharya’s raiders probe the walls where the light runs thin.'] },
        { id:'b1c1_i2', text:['Brihaspati lays a hand on Indra’s shoulder.', '“The churning has not yet begun. But the first blow always comes early, and always for the gate.”'] },
      ],
      victory:[ { id:'b1c1_v1', text:['THE GATE HOLDS', 'The raiders melt back into the dusk. Power answered power, and the greater total kept the field.'] } ],
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
        { id:'b1c2_i1', text:['THE ART OF YIELDING', 'The horde returns — not to probe, but to break. Their numbers darken the ridge.'] },
        { id:'b1c2_i2', text:['Brihaspati alone stands unafraid.', '“Let them take the first field. A battle is three fields, and only two need be ours.”'] },
      ],
      victory:[ { id:'b1c2_v1', text:['THE LONGER WAR', 'They spent their fury on empty ground. When the fields that mattered came, we outnumbered them — and won the war we chose to fight.'] } ],
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
