#!/usr/bin/env node
'use strict';
// tools/ktx2_decode.js — decode a KTX2 (Basis ETC1S / UASTC) page with the LAB'S OWN transcoder copy (runtime/basis/, the same
// one the page uses), to RGBA, so the fighter tool can measure what a phone will actually show.
//   node lab/arcade/tools/ktx2_decode.js <in.ktx2> <out.rgba> [format]   → prints "<w> <h> <uastc 0|1>"
//   format: rgba (default, 13) — or astc (10), bc7 (6), etc2 (1) to check that those targets transcode (output is then the block data)
const fs = require('fs'), path = require('path'), vm = require('vm');
const DIR = path.resolve(__dirname, '..', 'runtime', 'basis');
function loadBasis() {   // the transcoder is a classic script that defines BASIS (or module.exports); evaluate it as CommonJS
  const code = fs.readFileSync(path.join(DIR, 'basis_transcoder.js'), 'utf8'), module = { exports: {} };
  vm.runInNewContext(code, { module, exports: module.exports, require, console, process, __dirname: DIR, __filename: path.join(DIR, 'basis_transcoder.js'),
    WebAssembly, TextDecoder, setTimeout, clearTimeout, Promise, URL, performance: { now: () => Date.now() } });
  return module.exports;
}
async function decode(file, fmtName) {
  const FMT = { rgba: 13, astc: 10, bc7: 6, etc2: 1 }, fmt = FMT[fmtName || 'rgba'];
  const M = await loadBasis()({ wasmBinary: fs.readFileSync(path.join(DIR, 'basis_transcoder.wasm')) });
  M.initializeBasis();
  const k = new M.KTX2File(new Uint8Array(fs.readFileSync(file)));
  if (!k.isValid()) throw new Error('invalid ktx2 ' + file);
  const w = k.getWidth(), h = k.getHeight(), u = k.isUASTC() ? 1 : 0;
  if (!k.startTranscoding()) throw new Error('startTranscoding failed');
  const dst = new Uint8Array(k.getImageTranscodedSizeInBytes(0, 0, 0, fmt));
  if (!k.transcodeImage(dst, 0, 0, 0, fmt, 0, -1, -1)) throw new Error('transcode failed');
  k.close(); k.delete();
  return { w, h, uastc: u, data: dst };
}
module.exports = { decode };
if (require.main === module) {
  decode(process.argv[2], process.argv[4]).then((r) => { if (process.argv[3]) fs.writeFileSync(process.argv[3], r.data); process.stdout.write(r.w + ' ' + r.h + ' ' + r.uastc + '\n'); })
    .catch((e) => { process.stderr.write(String(e && e.message || e) + '\n'); process.exit(1); });
}
