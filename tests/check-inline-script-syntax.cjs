const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const assert = require('node:assert/strict');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const match = html.match(/<script type="module">([\\s\\S]*?)<\\/script>/);
assert.ok(match, 'Could not find the main JavaScript module script in index.html');
const temp = path.join(os.tmpdir(), 'wild-meadow-inline-check.mjs');
fs.writeFileSync(temp, match[1]);
const result = spawnSync(process.execPath, ['--check', temp], { encoding: 'utf8' });
fs.rmSync(temp, { force: true });
if (result.status !== 0) {
  process.stderr.write(result.stdout || '');
  process.stderr.write(result.stderr || '');
  process.exit(result.status || 1);
}
console.log('Wild Meadow inline module syntax check passed.');
