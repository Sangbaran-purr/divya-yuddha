/* ARCADE-1 · the seeded random source (mulberry32). Every random choice in the arcade — the AI's, the AI's lineup — draws
   from one of these, so a seed replays a whole match. UMD: window.ARC_RNG, Node require. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.ARC_RNG = factory();
})(this, function () {
  "use strict";
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  return { rng: rng };
});
