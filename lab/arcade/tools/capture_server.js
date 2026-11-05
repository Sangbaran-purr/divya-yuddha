#!/usr/bin/env node
'use strict';
// tools/capture_server.js — THE ARCADE LAB'S RECORDER SERVER (enhancement test).   node lab/arcade/tools/capture_server.js [port]
// Serves the repo read-only (like the static server) and takes the page's frames:
//   POST /__capture/<name>/<i>      a JPEG frame → lab/arcade/captures/<name>/f00000.jpg   (captures/ is gitignored)
//   POST /__capture/<name>/done     → tools/assemble_capture.py writes <name>.mp4 and <name>.gif to ~/Desktop/DY_arcade_screens/
// Open http://localhost:<port>/lab/arcade/?capture=<name>&fx=…&cam=…  — the page plays the demo bout and posts each frame.
const http = require('http'), fs = require('fs'), path = require('path'), cp = require('child_process');
const REPO = path.resolve(__dirname, '../../..'), OUT = path.join(__dirname, '..', 'captures');
const PORT = +process.argv[2] || 4611;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.mp3': 'audio/mpeg' };
const PY = path.join(REPO, 'lab/vfx-manifestation/tools/.venv/bin/python');
http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  const st = /^\/__still\/([A-Za-z0-9_-]+)$/.exec(u.pathname);   // a clarity still (PNG) → ~/Desktop/DY_arcade_screens/clarity/<name>.png
  if (req.method === 'POST' && st) {
    const chunks = []; req.on('data', (c) => chunks.push(c));
    req.on('end', () => { const d = path.join(require('os').homedir(), 'Desktop', 'DY_arcade_screens', 'clarity'); fs.mkdirSync(d, { recursive: true }); fs.writeFileSync(path.join(d, st[1] + '.png'), Buffer.concat(chunks)); res.end('ok'); });
    return;
  }
  const m = /^\/__capture\/([A-Za-z0-9_-]+)\/(done|\d+)$/.exec(u.pathname);
  if (req.method === 'POST' && m) {
    const chunks = []; req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      const dir = path.join(OUT, m[1]);
      if (m[2] === 'done') {
        const r = cp.spawnSync(PY, ['-I', path.join(__dirname, 'assemble_capture.py'), dir, m[1], u.searchParams.get('label') || ''], { encoding: 'utf8' });
        process.stdout.write('assembled ' + m[1] + ': ' + (r.stdout || '') + (r.stderr || ''));
        res.end(r.stdout || 'done'); return;
      }
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'f' + m[2].padStart(5, '0') + '.jpg'), Buffer.concat(chunks));
      res.end('ok');
    });
    return;
  }
  let p = decodeURIComponent(u.pathname); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(REPO, p);
  if (!f.startsWith(REPO) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.statusCode = 404; res.end('not found'); return; }
  res.setHeader('content-type', TYPES[path.extname(f)] || 'application/octet-stream'); res.setHeader('cache-control', 'no-store');
  fs.createReadStream(f).pipe(res);
}).listen(PORT, () => console.log('capture server on :' + PORT));
