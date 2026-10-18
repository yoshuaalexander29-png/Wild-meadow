const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const grass = fs.readFileSync(path.join(__dirname, '..', 'grass-system.js'), 'utf8');

for (const [label, needle] of [
  ['Three.js WebGL renderer retained', 'new THREE.WebGLRenderer'],
  ['Three.js version pinned to 0.183.0', 'three@0.183.0/build/three.module.js'],
  ['GLTFLoader retained', "from 'three/addons/loaders/GLTFLoader.js'"],
  ['composer and outline pipeline retained', 'new OutlinePass'],
  ['single warrior model retained', 'Knight_Male.glb'],
  ['grass module integrated', "from './grass-system.js'"],
  ['terrain height function retained', 'function meadowGroundHeight(x,z)'],
  ['terrain vertex colours used', "groundGeo.setAttribute('color',new THREE.Float32BufferAttribute(groundColors,3))"],
  ['grass updated in one animation loop', 'grassSystem.update(delta)'],
  ['deterministic shot query supported', 'testQuery.has(\'shot\')'],
  ['browser diagnostics exposed in test mode', 'window.__wildMeadowDiagnostics'],
  ['browser reports loaded character asset', 'diagnostics.loadedAssets.push(label)'],
  ['camera animation remains automatic', 'cameraAt(t%22)'],
]) assert.ok(html.includes(needle), 'Missing visual integration: ' + label);

for (const [label, pattern] of [
  ['forest character is not loaded', /Characters_Lis\.glb|promiseForest|Forest wanderer/],
  ['prototype HUD is absent', /explore-ui|explore-toggle|explore-reset/],
  ['touch and movement UI are absent', /touch-controls|data-move=|KeyW:'forward'/],
  ['pointer drag camera handler is absent', /pointermove.*exploreMode/s],
  ['blanket flat-shading override is absent', /flatShading\s*=\s*true/],
  ['player wake is disabled in visual-only mode', /active:exploreMode/],
]) assert.doesNotMatch(html, pattern, 'Unexpected visual-only regression: ' + label);

assert.match(grass, /new THREE\.InstancedMesh/);
assert.match(grass, /float wmBroad = sin/);
assert.match(grass, /geometry\.dispose\(\)/);
console.log('Wild Meadow visual-only integration checks passed.');
