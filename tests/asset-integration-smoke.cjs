const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const manifest = fs.readFileSync(path.join(root, 'ASSET_MANIFEST.md'), 'utf8');

for (const [label, needle] of [
  ['GLTFLoader import is present', "from 'three/addons/loaders/GLTFLoader.js'"],
  ['single active warrior GLB is configured', 'Knight_Male.glb?download=1'],
  ['character loading remains centralized', 'function loadCharacter(url,label,x,z,targetHeight'],
  ['character animation mixer is retained', 'new THREE.AnimationMixer(root)'],
  ['character follows actual terrain height', 'meadowGroundHeight(root.position.x,root.position.z)'],
  ['toon outline integration remains', 'outlinePass.selectedObjects=[root]'],
]) assert.ok(html.includes(needle), 'Missing asset integration: ' + label);

assert.match(html, /const ASSETS=\{warrior:/, 'Only the active warrior asset should be configured');
assert.doesNotMatch(html, /ASSETS\.(sword|forest|centaur)|Sword_Gold\.glb|zombie-apocalypse-kit|Characters_Lis\.glb/i,
  'Removed prop/character assets must not remain in the active scene');
assert.match(manifest, /Knight_Male\.glb/, 'Active warrior provenance must be documented');
assert.doesNotMatch(manifest, /Sword_Gold\.glb|Characters_Lis\.glb|zombie-apocalypse-kit|forest wanderer/i,
  'Removed character/prop assets must not remain in the active manifest');
assert.match(manifest, /CC0 1\.0 Universal/, 'Active asset licence provenance must be retained');

console.log('Wild Meadow single-character asset integration and provenance checks passed.');
