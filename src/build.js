#!/usr/bin/env node
/* Inlines the canonical rules engine (src/engine.js) into index.html between the
   <!-- ENGINE:START --> / <!-- ENGINE:END --> markers. Run after every engine change:
     node src/build.js
   The engine's Node-only `module.exports` guard is harmless in the browser. */
const fs = require('fs');
const path = require('path');

const root   = path.join(__dirname, '..');
const engine = fs.readFileSync(path.join(__dirname, 'engine.js'), 'utf8').replace(/\s+$/, '');
const htmlPath = path.join(root, 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

const START = '<!-- ENGINE:START';
const END   = '<!-- ENGINE:END -->';
const sIdx = html.indexOf(START);
const eIdx = html.indexOf(END);
if (sIdx < 0 || eIdx < 0) { console.error('build: ENGINE markers not found in index.html'); process.exit(1); }

const sEnd = html.indexOf('-->', sIdx) + 3;                 // end of the START comment
const block = `\n<script>\n${engine}\n</script>\n`;
html = html.slice(0, sEnd) + block + html.slice(eIdx);
fs.writeFileSync(htmlPath, html);

console.log(`build: inlined ${engine.split('\n').length} lines of engine.js into index.html`);
