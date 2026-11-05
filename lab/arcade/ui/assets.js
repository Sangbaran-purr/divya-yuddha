/* ARCADE-1 · WHAT A MATCH LOADS (owner ruling 2 on cb69cdb, 2026-11-05): only the Heroes in the match, the arena, and the effects THOSE
   Heroes use — the Vajra's only if Indra fights, the Nagapasha's only if Meghnad does. Nothing for an unselected Hero is downloaded; a
   later match reuses what is already loaded (and the browser's cache). The page (ui/app.js) and the budget (tools/budget.js) both read
   this one table, so the budget's first-match download is exactly what the page fetches.
   UMD: window.ARC_ASSETS, Node require. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.ARC_ASSETS = factory();
})(this, function () {
  "use strict";
  // each real Hero's sheets (fighters/<id>/) and the Kling effects only it uses (effects/fx_<name>/)
  var FX_OF = { indra: ["vajra_bolt", "vajra_impact"], meghnad: ["nagapasha_flight", "nagapasha_bind"] };
  // heroes: the hero ids in the match (both lineups); HEROES: core/moves.js HEROES → { fighters: [ids], effects: [names] }
  function plan(heroes, HEROES) {
    var fighters = [], effects = [];
    heroes.forEach(function (id) {
      var h = HEROES[id], f = h && h.fighter;
      if (!f || fighters.indexOf(f) >= 0) return;
      fighters.push(f);
      (FX_OF[f] || []).forEach(function (n) { if (effects.indexOf(n) < 0) effects.push(n); });
    });
    return { fighters: fighters, effects: effects };
  }
  return { FX_OF: FX_OF, plan: plan };
});
