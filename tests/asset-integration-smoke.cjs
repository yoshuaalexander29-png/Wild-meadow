const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const manifest = fs.readFileSync(path.join(root, 'ASSET_MANIFEST.md'), 'utf8');

for (const [label, needle] of [
  ['GLTFLoader import is present', "from 'three/addons/loaders/GLTFLoader.js'"],
  ['warrior GLB URL is configured', 'Knight_Male.glb?download=1'],
  ['optional sword GLB URL is configured', 'Sword_Gold.glb?download=1'],
  ['GLTF loading uses the existing loader', 'loader.load(ASSETS.sword'],
  ['character loading remains centralized', 'function loadCharacter(url,label,x,z,targetHeight'],
  ['character animation mixer is retained', 'new THREE.AnimationMixer(root)'],
  ['character follows actual terrain height', 'meadowGroundHeight(root.position.x,root.position.z)'],
  ['toon outline integration remains', 'outlinePass.selectedObjects=[root]'],
]) assert.ok(html.includes(needle), 'Missing asset integration: ' + label);

for (const [label, needle] of [
  ['active warrior attribution', 'Knight_Male.glb'],
  ['active sword attribution', 'Sword_Gold.glb'],
  ['CC0 license provenance', 'CC0 1.0 Universal'],
  ['retained forest character explicitly marked inactive', 'not loaded by the current experimental cinematic scene'],
]) assert.ok(manifest.includes(needle), 'Missing asset provenance: ' + label);

assert.doesNotMatch(html, /Characters_Lis\.glb/, 'The inactive forest-wanderer asset must not be requested by this scene');
console.log('Wild Meadow asset integration and provenance checks passed.');
