#!/usr/bin/env node
'use strict';
// tools/stamp_lab.js — VFX-LAB-4a · THE LAB'S STAMP.   node lab/vfx-manifestation/tools/stamp_lab.js [--check]
//
// Pages caches what it serves; a push must never show a stale lab. So every URL the lab page loads carries ?v=<STAMP>, the way
// the site's sync binds the game frame to game/STAMP. The lab's STAMP is a content hash (sha256, 12 hex) of every file the page
// loads — lab.js, lib/, runtime/ (the copied VFX module, Pixi and the effect sheets), data/, fixtures/, art/ and the packed actors
// (a folder or file whose name starts with "_" or "." is not loaded, so not hashed). index.html and STAMP are not inputs: they
// carry the stamp.
//   write (default): STAMP ← the hash; index.html ← <meta name="lab-stamp"> and ?v= on every <script src>. lab.js reads the
//                    meta and stamps each fetch, image and module URL itself; at boot it reads STAMP with no-store and reloads
//                    the page once onto the served stamp if the page it got was cached.
//   --check:         exit 1 unless STAMP and index.html already carry the current hash (the lab suite runs this).
// Run it after changing any lab file, before committing.
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const LAB = path.resolve(__dirname, '..');
const DIRS = ['lib', 'runtime', 'data', 'fixtures', 'art', 'actors'];
const LOADED = /\.(js|mjs|json|png|webp|jpe?g)$/i;

function walk(rel, out) {
  for (const n of fs.readdirSync(path.join(LAB, rel)).sort()) {
    if (n[0] === '.' || n[0] === '_' || n === '__pycache__') continue;
    const r = rel + '/' + n;
    if (fs.statSync(path.join(LAB, r)).isDirectory()) walk(r, out); else if (LOADED.test(n)) out.push(r);
  }
  return out;
}
function inputs() { const out = ['lab.js']; DIRS.forEach((d) => walk(d, out)); return out; }
function compute() {
  const h = crypto.createHash('sha256');
  for (const r of inputs()) { h.update(r + '\0'); h.update(fs.readFileSync(path.join(LAB, r))); h.update('\0'); }
  return h.digest('hex').slice(0, 12);
}
const SCRIPT = /<script src="(\.\.\/lib\/[a-z]+\.js|vfx\.js|\.\.\/lab\.js)(?:\?v=[0-9a-z]+)?"><\/script>/g;
const META = /<meta name="lab-stamp" content="[^"]*">/;
function stampPage(html, stamp) {
  let out = html.replace(SCRIPT, (m, src) => '<script src="' + src + '?v=' + stamp + '"></script>');
  const meta = '<meta name="lab-stamp" content="' + stamp + '">';
  out = META.test(out) ? out.replace(META, meta) : out.replace(/(<meta name="robots"[^>]*>)/, '$1\n' + meta);
  return out;
}
function status() {
  const stamp = compute(), page = fs.readFileSync(path.join(LAB, 'index.html'), 'utf8');
  const file = fs.existsSync(path.join(LAB, 'STAMP')) ? fs.readFileSync(path.join(LAB, 'STAMP'), 'utf8').trim() : null;
  return { stamp, file, pageCurrent: stampPage(page, stamp) === page, inputs: inputs().length };
}

if (require.main === module) {
  if (process.argv.includes('--check')) {
    const s = status();
    console.log('lab STAMP ' + s.stamp + ' over ' + s.inputs + ' files · STAMP file ' + (s.file || 'missing') + ' · index.html ' + (s.pageCurrent ? 'current' : 'STALE'));
    process.exit(s.file === s.stamp && s.pageCurrent ? 0 : 1);
  }
  const stamp = compute(), pagePath = path.join(LAB, 'index.html');
  fs.writeFileSync(path.join(LAB, 'STAMP'), stamp + '\n');
  fs.writeFileSync(pagePath, stampPage(fs.readFileSync(pagePath, 'utf8'), stamp));
  console.log('stamp_lab: STAMP -> ' + stamp + ' (' + inputs().length + ' files); index.html stamped');
}
module.exports = { compute, inputs, stampPage, status };
