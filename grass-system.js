// SPDX-License-Identifier: MIT
// WebGL-compatible adaptation of field-grass techniques.
// Upstream reference: https://github.com/matthew-kissinger/threejs-field-grass
// Upstream license: MIT, Copyright (c) 2026 Matthew Kissinger.
// This file is a focused original port for Three.js 0.183.0/WebGLRenderer;
// it does not import the upstream TSL/WebGPU modules or generated demo data.

const QUALITY_COUNTS = Object.freeze({ low: 850, medium: 2400, high: 4200 });
const PALETTE = ['#496f3e', '#5f8246', '#73944d', '#86a354', '#a0ad60'];

function mulberry32(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function smooth01(value) {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
}

function buildTuftGeometry(THREE) {
  const positions = [];
  const indices = [];
  const bladeCount = 7;
  const rows = [0, 0.32, 0.63, 0.86, 1];
  const height = 0.72;

  for (let blade = 0; blade < bladeCount; blade++) {
    const angle = blade / bladeCount * Math.PI * 2 + (blade % 2) * 0.23;
    const rootRadius = 0.055 + (blade % 3) * 0.026;
    const rootX = Math.cos(angle) * rootRadius;
    const rootZ = Math.sin(angle) * rootRadius;
    const lean = 0.12 + (blade % 4) * 0.045;
    const base = positions.length / 3;

    for (const t of rows) {
      const y = height * t * (1 - 0.12 * t * t) * (0.84 + (blade % 3) * 0.07);
      const reach = lean * height * Math.pow(t, 1.55);
      const halfWidth = 0.052 * (1 - t) ** 0.82 + 0.0015;
      const cx = rootX + Math.cos(angle) * reach;
      const cz = rootZ + Math.sin(angle) * reach;
      positions.push(cx - Math.sin(angle) * halfWidth, y, cz + Math.cos(angle) * halfWidth);
      positions.push(cx + Math.sin(angle) * halfWidth, y, cz - Math.cos(angle) * halfWidth);
    }

    for (let row = 0; row < rows.length - 1; row++) {
      const a = base + row * 2;
      const b = a + 1;
      const c = a + 2;
      const d = a + 3;
      indices.push(a, c, b, b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Build one instanced grass layer using the game's existing THREE namespace.
 * getGroundHeight must return world-space y for the same terrain used by the
 * scene. isExcluded can reject paths, props, water, or other non-grass areas.
 */
export function createGrassSystem({
  THREE,
  scene,
  getGroundHeight,
  getPlayerState = () => null,
  isExcluded = () => false,
  quality = 'medium',
}) {
  if (!THREE || !scene || typeof getGroundHeight !== 'function') {
    throw new TypeError('createGrassSystem requires THREE, scene, and getGroundHeight');
  }

  const isMobile = typeof window !== 'undefined'
    && (window.matchMedia?.('(max-width: 700px)').matches
      || (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 1));
  const requestedQuality = QUALITY_COUNTS[quality] ? quality : 'medium';
  const effectiveQuality = isMobile && requestedQuality === 'high' ? 'medium'
    : isMobile && requestedQuality === 'medium' ? 'low'
      : requestedQuality;
  const count = QUALITY_COUNTS[effectiveQuality];
  const geometry = buildTuftGeometry(THREE);
  const material = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    roughness: 1,
    metalness: 0,
    side: THREE.DoubleSide,
    vertexColors: true,
  });

  const uniforms = {
    uGrassTime: { value: 0 },
    uPlayer: { value: new THREE.Vector3(0, 0, 0) }, // x, z, active
    uPlayerHeading: { value: 0 },
    uWake: { value: Array.from({ length: 10 }, () => new THREE.Vector4()) },
  };

  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      `#include <common>
uniform float uGrassTime;
uniform vec3 uPlayer;
uniform float uPlayerHeading;
uniform vec4 uWake[10];`,
    );
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
vec3 wmRoot = (instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
float wmTip = pow(clamp(position.y / 0.72, 0.0, 1.0), 1.65);
float wmBroad = sin(dot(wmRoot.xz, vec2(0.76, 0.65)) * 0.16 - uGrassTime * 0.72);
float wmMiddle = sin(dot(wmRoot.xz, vec2(-0.36, 0.93)) * 0.34 + uGrassTime * 1.13);
float wmFine = sin(uGrassTime * 4.4 + wmRoot.x * 4.7 + wmRoot.z * 3.9);
float wmWind = wmBroad * 0.58 + wmMiddle * 0.30 + wmFine * 0.12;
vec2 wmWorldWind = vec2(wmWind * 0.17, wmWind * 0.13);
float wmInstanceScaleSq = max(dot(instanceMatrix[0].xz, instanceMatrix[0].xz), 0.0001);
vec2 wmLocalWind = vec2(
  instanceMatrix[0][0] * wmWorldWind.x - instanceMatrix[2][0] * wmWorldWind.y,
 -instanceMatrix[0][2] * wmWorldWind.x + instanceMatrix[2][2] * wmWorldWind.y
) / wmInstanceScaleSq;
transformed.x += wmTip * wmLocalWind.x;
transformed.z += wmTip * wmLocalWind.y;
vec2 wmPlayerDelta = wmRoot.xz - uPlayer.xy;
float wmPlayerDistance = length(wmPlayerDelta);
float wmPlayerInfluence = (1.0 - smoothstep(0.22, 1.65, wmPlayerDistance)) * uPlayer.z;
vec2 wmPlayerForward = vec2(sin(uPlayerHeading), -cos(uPlayerHeading));
vec2 wmPlayerPush = normalize(wmPlayerDelta + wmPlayerForward * 0.24);
vec2 wmBend = wmPlayerPush * wmPlayerInfluence * 0.66;
for (int wmI = 0; wmI < 10; wmI++) {
  float wmWakeStrength = uWake[wmI].w;
  if (wmWakeStrength > 0.001) {
    vec2 wmWakeDelta = wmRoot.xz - uWake[wmI].xy;
    float wmWakeDistance = length(wmWakeDelta);
    float wmWakeInfluence = (1.0 - smoothstep(0.18, 1.55, wmWakeDistance)) * wmWakeStrength;
    vec2 wmWakeForward = vec2(sin(uWake[wmI].z), -cos(uWake[wmI].z));
    vec2 wmWakePush = normalize(wmWakeDelta + wmWakeForward * 0.24);
    wmBend += wmWakePush * wmWakeInfluence * 0.52;
  }
}
vec2 wmLocalBend = vec2(
  instanceMatrix[0][0] * wmBend.x - instanceMatrix[2][0] * wmBend.y,
 -instanceMatrix[0][2] * wmBend.x + instanceMatrix[2][2] * wmBend.y
) / wmInstanceScaleSq;
transformed.x += wmLocalBend.x * wmTip;
transformed.z += wmLocalBend.y * wmTip;`,
    );
    material.userData.grassShader = shader;
  };
  material.customProgramCacheKey = () => 'wild-meadow-grass-webgl-v1';

  const mesh = new THREE.InstancedMesh(geometry, material, count);
  mesh.name = 'wild-meadow-reactive-grass';
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  mesh.frustumCulled = false;
  const rng = mulberry32(0x57494c44);
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();

  let placed = 0;
  let attempts = 0;
  const maxAttempts = count * 14;
  while (placed < count && attempts < maxAttempts) {
    attempts++;
    const x = -16 + rng() * 32;
    const z = -28 + rng() * 33;
    if (isExcluded(x, z)) continue;

    const y = getGroundHeight(x, z);
    if (!Number.isFinite(y)) continue;
    const scale = 0.68 + rng() * 0.68;
    dummy.position.set(x, y - 0.035, z);
    dummy.rotation.set(0, rng() * Math.PI * 2, 0);
    dummy.scale.set(scale, scale, scale);
    dummy.updateMatrix();
    mesh.setMatrixAt(placed, dummy.matrix);

    color.set(PALETTE[Math.floor(rng() * PALETTE.length)]);
    color.multiplyScalar(0.86 + rng() * 0.28);
    mesh.setColorAt(placed, color);
    placed++;
  }

  if (placed < count) {
    geometry.dispose();
    material.dispose();
    throw new Error(`Grass scatter placed only ${placed}/${count} tufts; check exclusions and terrain sampler`);
  }

  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.computeBoundingSphere();
  scene.add(mesh);

  const wake = [];
  const wakeLife = effectiveQuality === 'low' ? 0.68 : 0.92;
  const sampleDistance = effectiveQuality === 'low' ? 0.72 : 0.48;
  let lastSample = null;
  let elapsed = 0;
  let disposed = false;

  function update(deltaSeconds) {
    if (disposed) return;
    const dt = Math.max(0, Math.min(Number(deltaSeconds) || 0, 0.05));
    elapsed += dt;
    uniforms.uGrassTime.value = elapsed;

    const player = getPlayerState?.();
    const active = player && player.active !== false
      && Number.isFinite(player.x) && Number.isFinite(player.z);
    if (active) {
      uniforms.uPlayer.value.set(player.x, player.z, 1);
      uniforms.uPlayerHeading.value = Number.isFinite(player.heading) ? player.heading : 0;
      if (!lastSample || Math.hypot(player.x - lastSample.x, player.z - lastSample.z) >= sampleDistance) {
        wake.push({ x: player.x, z: player.z, heading: uniforms.uPlayerHeading.value, age: 0 });
        lastSample = { x: player.x, z: player.z };
      }
    } else {
      uniforms.uPlayer.value.z = 0;
      lastSample = null;
    }

    for (let i = wake.length - 1; i >= 0; i--) {
      wake[i].age += dt;
      if (wake[i].age >= wakeLife) wake.splice(i, 1);
    }
    while (wake.length > 10) wake.shift();

    for (let i = 0; i < 10; i++) {
      const target = uniforms.uWake.value[i];
      const sample = wake[i];
      if (!sample) {
        target.set(0, 0, 0, 0);
        continue;
      }
      const age01 = sample.age / wakeLife;
      const fadeOut = 1 - smooth01(age01);
      const fadeIn = smooth01(sample.age / 0.12);
      target.set(sample.x, sample.z, sample.heading, fadeOut * fadeIn);
    }
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    mesh.removeFromParent();
    geometry.dispose();
    material.dispose();
    wake.length = 0;
    lastSample = null;
  }

  return {
    mesh,
    material,
    quality: effectiveQuality,
    tuftCount: count,
    update,
    dispose,
  };
}
