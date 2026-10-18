const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

const required = [
  ['Three.js WebGL renderer remains in use', 'new THREE.WebGLRenderer'],
  ['Three.js toon material remains available for stylized environment props', 'new THREE.MeshToonMaterial'],
  ['quantized gradient ramp uses nearest filtering', 'toonRamp.magFilter=THREE.NearestFilter'],
  ['Three.js OutlinePass remains integrated', 'new OutlinePass'],
  ['single surviving warrior asset', 'Knight_Male.glb'],
  ['original GLTF mesh materials are preserved', 'function fitModel(root,targetHeight)'],
  ['terrain uses vertex-colour variation', "groundGeo.setAttribute('color',new THREE.Float32BufferAttribute(groundColors,3))"],
  ['coherent broad terrain noise', 'function valueNoise(x,z)'],
  ['ground-cover placement uses terrain height', 'meadowGroundHeight(x,z)'],
  ['broad-leaf ground cover exists', 'Broad-leaf ground cover provides'],
  ['stone scatter uses terrain height', 'stone.position.set(x,meadowGroundHeight(x,z)+.025,z)'],
  ['mobile pixel ratio is capped', 'innerWidth<700?1:1.25'],
  ['existing animation loop updates grass', 'grassSystem.update(delta)'],
  ['camera runs an automatic cinematic sequence', 'cameraAt(t%22)'],
  ['asset failures are logged without a permanent overlay', "console.error('Wild Meadow asset load failed:'"],
];

for (const [label, needle] of required) {
  assert.ok(html.includes(needle), 'Missing visual-overhaul integration: ' + label);
}
for (const [label, pattern] of [
  ['forest character removed', /Characters_Lis\.glb|promiseForest|Forest wanderer/],
  ['blanket flat-shading override removed', /flatShading\s*=\s*true/],
]) {
  assert.doesNotMatch(html, pattern, 'Unexpected leftover: ' + label);
}
for (const [label, needle] of [
  ['Explore toggle exists', 'id="explore-toggle"'],
  ['player world position feeds grass wake', 'active:exploreMode'],
  ['keyboard movement remains available', "KeyW:'forward'"],
  ['touch movement controls exist', 'data-move="forward"'],
  ['jump is supported', "keys.has('jump')&&grounded"],
]) {
  assert.ok(html.includes(needle), 'Missing interactive grass integration: ' + label);
}

console.log('Wild Meadow scene and interactive grass source checks passed (' + required.length + ' required checks, ' + 2 + ' removal checks, and ' + 5 + ' interactive checks).');
