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
  ['broad-leaf ground cover exists', 'Low broad-leaf ground cover'],
  ['stone scatter uses terrain height', 'Small, non-repeating stones'],
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
  ['movement and HUD controls removed', /data-move|id="explore"|id="reset"|id="motion"|id="cycle"|id="hud"|id="caption"|id="touch-controls"/],
  ['blanket flat-shading override removed', /flatShading\s*=\s*true/],
  ['obsolete interactive controller removed', /function setExplore|KeyW|keys\.has\('sprint'\)/],
]) {
  assert.doesNotMatch(html, pattern, 'Unexpected leftover: ' + label);
}

console.log('Wild Meadow visual-overhaul source checks passed (' + required.length + ' required checks and ' + 4 + ' removal checks).');
