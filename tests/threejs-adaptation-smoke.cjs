const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

const required = [
  ['Three.js toon material', 'new THREE.MeshToonMaterial'],
  ['quantized gradient ramp', 'new THREE.DataTexture'],
  ['custom Fresnel rim hook', 'wmRimStrength'],
  ['Three.js OutlinePass', 'new OutlinePass'],
  ['exploration mode toggle', 'function setExplore'],
  ['keyboard movement mapping', 'KeyW'],
  ['sprint input', "keys.has('sprint')"],
  ['jump input and grounded gate', "keys.has('jump')&&grounded"],
  ['tree obstacle response', 'treeCollision'],
  ['touch movement controls', 'data-move'],
  ['mobile post-processing guard', 'innerWidth>=700'],
];

for (const [label, needle] of required) {
  assert.ok(html.includes(needle), 'Missing integration: ' + label);
}

console.log('Wild Meadow source integration checks passed (' + required.length + ' checks).');
