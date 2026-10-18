const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { pathToFileURL } = require('node:url');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const grassSource = fs.readFileSync(path.join(root, 'grass-system.js'), 'utf8');
const license = fs.readFileSync(path.join(root, 'THIRD_PARTY_NOTICES.md'), 'utf8');

for (const [label, needle] of [
  ['grass module imported by game', "from './grass-system.js'"],
  ['instanced grass geometry', 'new THREE.InstancedMesh(geometry, material, count)'],
  ['vertex shader wind animation', 'float wmBroad = sin'],
  ['player interaction shader', 'float wmPlayerInfluence'],
  ['fading movement wake', 'const fadeOut = 1 - smooth01(age01)'],
  ['quality tiers', 'const QUALITY_COUNTS'],
  ['explicit resource disposal', 'geometry.dispose();\n    material.dispose();'],
  ['instanced grass uses per-instance colours', 'vertexColors: true'],
]) {
  assert.ok((label === 'grass module imported by game' ? html : grassSource).includes(needle),
    'Missing integration: ' + label);
}
for (const [label, needle] of [
  ['shared terrain height function', 'function meadowGroundHeight(x,z)'],
  ['grass uses terrain height', 'getGroundHeight:meadowGroundHeight'],
  ['grass interaction disabled for visual-only showcase', 'getPlayerState:()=>null'],
  ['grass updates in existing frame loop', 'grassSystem.update(delta)'],
  ['instance colors are enabled in the material', 'vertexColors: true'],
]) {
  assert.ok(html.includes(needle), 'Missing game integration: ' + label);
}

assert.doesNotMatch(grassSource, /from ['"]three\/(?:webgpu|tsl)['"]/, 'The WebGL port must not import the upstream TSL/WebGPU path');
assert.match(grassSource, /SPDX-License-Identifier: MIT/);
assert.match(license, /Copyright \(c\) 2026 Matthew Kissinger/);
assert.match(license, /threejs-field-grass/);

// Exercise the real ES module with minimal Three.js-compatible test doubles.
// This validates API construction, shader injection, update, and disposal without
// pretending to validate actual GPU compilation or visual browser output.
const smoke = `
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
const { createGrassSystem } = await import(process.argv[1]);
class Vector3 { constructor(){this.x=0;this.y=0;this.z=0} set(x,y,z){this.x=x;this.y=y;this.z=z;return this} }
class Vector4 { constructor(){this.x=0;this.y=0;this.z=0;this.w=0} set(x,y,z,w){this.x=x;this.y=y;this.z=z;this.w=w;return this} }
class Color { set(value){this.value=value;return this} multiplyScalar(value){this.multiplier=value;return this} }
class Float32BufferAttribute { constructor(array,itemSize){this.array=array;this.itemSize=itemSize} }
class BufferGeometry { setAttribute(k,v){this[k]=v} setIndex(v){this.index=v} computeVertexNormals(){} dispose(){this.disposed=true} }
class MeshStandardMaterial { constructor(options){Object.assign(this,options);this.userData={}} dispose(){this.disposed=true} }
class Object3D { constructor(){this.position={set(){}};this.rotation={set(){}};this.scale={set(){}};this.matrix={};} updateMatrix(){} }
class InstancedMesh { constructor(geometry,material,count){this.geometry=geometry;this.material=material;this.count=count;this.instanceMatrix={};this.instanceColor=null;this.userData={};} setMatrixAt(){} setColorAt(i,c){this.instanceColor ||= {needsUpdate:false};} computeBoundingSphere(){} removeFromParent(){this.removed=true} }
const THREE={Vector3,Vector4,Color,Float32BufferAttribute,BufferGeometry,MeshStandardMaterial,Object3D,InstancedMesh,DoubleSide:2};
const scene={children:[],add(x){this.children.push(x)},};
let player={x:0,z:0,heading:0,active:true};
const grass=createGrassSystem({THREE,scene,getGroundHeight:(x,z)=>Math.sin(x*.1+z*.2)*.1,getPlayerState:()=>player,isExcluded:()=>false,quality:'low'});
assert.equal(scene.children.length,1);
assert.ok(grass.tuftCount>0);
const shader={uniforms:{},vertexShader:'#include <common>\\n#include <begin_vertex>',fragmentShader:''};
grass.material.onBeforeCompile(shader);
assert.match(shader.vertexShader,/wmBroad/);
assert.match(shader.vertexShader,/wmPlayerInfluence/);
grass.update(1/60);
assert.ok(shader.uniforms.uGrassTime.value>0);
assert.ok(shader.uniforms.uWake.value.some(v=>v.w>0));
player={x:2,z:1,heading:1,active:false};
grass.update(1/60);
grass.dispose();
assert.equal(scene.children.length,1); // test scene double does not emulate removeFromParent
assert.equal(grass.mesh.removed,true);
assert.equal(grass.material.disposed,true);
assert.throws(()=>createGrassSystem({THREE,scene}),/requires THREE, scene, and getGroundHeight/);
console.log('Grass module runtime smoke passed: construct, scatter, shader injection, update, wake, disposal.');
`;
const child = spawnSync(process.execPath, ['--experimental-default-type=module', '--input-type=module', '-e', smoke, pathToFileURL(path.join(root,'grass-system.js')).href], { cwd: root, encoding: 'utf8' });
if (child.error) throw child.error;
if (child.status !== 0) {
  process.stderr.write(child.stdout || '');
  process.stderr.write(child.stderr || '');
  process.exit(child.status || 1);
}
process.stdout.write(child.stdout);
console.log('Wild Meadow grass integration checks passed.');
