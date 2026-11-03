#!/usr/bin/env node
'use strict';
// tools/stamp.js — THE ARCADE LAB'S STAMP (the VFX lab's rule).   node lab/arcade/tools/stamp.js [--check]
// Pages caches what it serves, so every URL the page loads carries ?v=<STAMP>: a content hash (sha256, 12 hex) of every file
// the page loads — core/, ui/, runtime/. index.html and STAMP carry the stamp, so they are not inputs.
//   write (default): STAMP ← the hash; index.html ← the lab-stamp meta and ?v= on every script and stylesheet.
//   --check:         exit 1 unless STAMP and index.html already carry the current hash (the suite runs this).
// Run it after changing any lab file, before committing.
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const LAB = path.resolve(__dirname, '..');
const DIRS = ['core', 'ui', 'runtime'];
const LOADED = /\.(js|mjs|json|css|png|webp|jpe?g|mp3)$/i;

function walk(rel, out) {
  for (const n of fs.readdirSync(path.join(LAB, rel)).sort()) {
    if (n[0] === '.' || n[0] === '_') continue;
    const r = rel + '/' + n;
    if (fs.statSync(path.join(LAB, r)).isDirectory()) walk(r, out); else if (LOADED.test(n)) out.push(r);
  }
  return out;
}
function inputs() { const out = []; DIRS.forEach((d) => walk(d, out)); return out; }
function compute() {
  const h = crypto.createHash('sha256');
  for (const r of inputs()) { h.update(r + '\0'); h.update(fs.readFileSync(path.join(LAB, r))); h.update('\0'); }
  return h.digest('hex').slice(0, 12);
}
function stampPage(html, stamp) {
  return html.replace(/(<meta name="lab-stamp" content=")[0-9a-f]*(">)/, '$1' + stamp + '$2')
    .replace(/((?:src|href)="(?:core|ui)\/[a-z]+\.(?:js|css))\?v=[0-9a-f]+"/g, '$1?v=' + stamp + '"');
}
module.exports = { compute, stampPage, inputs };

if (require.main === module) {
  const stamp = compute(), page = path.join(LAB, 'index.html'), file = path.join(LAB, 'STAMP');
  const html = fs.readFileSync(page, 'utf8'), want = stampPage(html, stamp);
  const cur = fs.existsSync(file) ? fs.readFileSync(file, 'utf8').trim() : '';
  if (process.argv.includes('--check')) {
    const ok = cur === stamp && html === want;
    console.log(ok ? 'stamp current: ' + stamp : 'STALE: STAMP ' + (cur || '(none)') + ', current ' + stamp + ' — run node lab/arcade/tools/stamp.js');
    process.exit(ok ? 0 : 1);
  }
  fs.writeFileSync(file, stamp + '\n'); fs.writeFileSync(page, want);
  console.log('stamped ' + stamp + ' (' + inputs().length + ' files)');
}
