# WILD MEADOW — asset-backed WebGL build

The main `index.html` loads two existing CC0 GLB character assets and a CC0 sword model. The environment remains original procedural scenery. The source assets are attributed in `ASSET_MANIFEST.md`.

## Run

Serve this directory over HTTP/HTTPS, then open `index.html`:

```sh
python3 -m http.server 8080
```

Open `http://localhost:8080/`. The scene uses Three.js 0.183.0 and GLTFLoader from jsDelivr, with GLB character/weapon assets from the Cinevva CDN. A working network connection is required; this is not an offline build.

On iPhone, host over HTTPS and open in Safari. Physical iPhone 14 verification has not been completed.

## Controls

- **Explore / Cinematic** toggles between third-person exploration and the existing cinematic camera sequence.
- **WASD / arrow keys** move in exploration mode; **Shift** sprints; **Space** jumps.
- **Drag the scene** to orbit the cinematic view or steer the exploration camera.
- On touchscreens, use the on-screen directional pad and Jump button while exploring.
- **Next shot** cycles manual cinematic camera views.
- **Restart** returns to the cinematic sequence.
- **Pause / Resume** pauses/resumes the timeline.

## Adapted source research

This build adapts techniques and ideas from actual browser-native Three.js source code rather than importing a Unity workflow:

- [hh-hang/three-player-controller](https://github.com/hh-hang/three-player-controller) — informed the third-person-follow camera, movement/sprint/jump inputs, ground-state handling and obstacle-response design. Wild Meadow uses a compact local controller and tree-trunk avoidance appropriate to this small procedural scene; it does **not** import that controller package or claim its full capsule/BVH collision system.
- [ZaneAtega/Three-js-Anime-Shader](https://github.com/ZaneAtega/Three-js-Anime-Shader) — informed the restrained Fresnel-style rim-light treatment added through Three.js `onBeforeCompile` to compatible imported standard materials. This is an adaptation, not a copy of the project's complete GLSL shader.
- [Three.js MeshToonMaterial documentation](https://threejs.org/docs/pages/MeshToonMaterial.html) — informed a quantized `DataTexture` gradient ramp used by the procedural environment materials.
- [Three.js OutlinePass example](https://threejs.org/examples/webgl_postprocessing_outline.html) — informed the subtle selected-character outline pass. The post-processing pass is disabled on narrow/mobile viewports to reduce GPU cost.

The reference implementations were inspected during this change. Their code was not copied wholesale; the techniques above were adapted to the existing single-file Three.js scene and its CDN-loaded GLB assets.

## Asset caveat

The imported models are complete pre-existing GLB assets, not custom-built mesh assemblies. They are not exact matches for the original brief: `Characters_Lis.glb` is a human character, not a deer-centaur forest spirit; `Knight_Male.glb` is a fantasy knight, not a silver-haired barbarian. The sword remains a separate prop; precise attachment to the warrior's hand has not been verified.

## Verification status

This change has source-level integration only. It has **not yet been verified by a successful desktop/mobile browser render or physical iPhone test**. Runtime shader compilation, camera behaviour, touch input, performance, and visual quality still require inspection against genuine screenshots. The current environment also retains known limitations: simple procedural tree avoidance rather than BVH mesh collision, no confirmed walk/run animation mapping, and character grounding against a flat baseline rather than sampled terrain height.

The prior raw-WebGL prototype is preserved at `index-procedural-backup.html` for comparison and recovery.


## Reactive grass integration

The experimental grass integration is isolated in `grass-system.js` and keeps the existing Three.js `0.183.0` `WebGLRenderer`. It adapts ideas from [matthew-kissinger/threejs-field-grass](https://github.com/matthew-kissinger/threejs-field-grass) without importing its Three.js 0.185.x TSL/WebGPU material.

- Instanced, curved seven-blade clumps with deterministic placement and per-instance colour variation.
- Vertex-shader wind combines broad, middle, and fine motion; the roots stay planted while the blade tips move.
- The shader reads the controlled character's world-space X/Z position and heading. Movement samples fade out to create a short-lived directional wake.
- Grass placement uses the same height formula as the displaced ground mesh and excludes the central staging/path area and tree trunks.
- Quality tiers are defined in `grass-system.js`; mobile devices reduce a requested quality level to bound draw cost.
- `grassSystem.update(delta)` runs in the existing frame loop; `dispose()` removes the grass mesh and disposes its geometry/material.

This is a first implementation pass, **not yet browser-verified**. The smoke test exercises module construction and shader-source injection with test doubles; it does not prove GPU shader compilation, visual quality, mobile performance, or actual recovery appearance. See `THIRD_PARTY_NOTICES.md` for provenance and the MIT notice.


## Cinematic meadow with optional exploration

The scene keeps the latest terrain, vertex-colour variation, flowers, broad-leaf ground cover, small stones, and terrain-aligned trees. The camera remains cinematic by default; **Explore** is an optional mode rather than replacing the presentation scene. In Explore mode, the surviving warrior can move with WASD/arrow keys, sprint with Shift, jump with Space, or use the on-screen touch pad and Jump button. Dragging the scene steers the follow camera.

Grass remains isolated in `grass-system.js`, a WebGL-compatible port for Three.js 0.183.0. Its instanced curved multi-blade tufts use the same terrain-height function as the ground, animate multi-scale wind in the vertex shader, and receive the active character's world-space position and heading while Explore mode is enabled. The character's path leaves a short directional wake that fades over time. No WebGPU/TSL imports or renderer upgrade are used.

## Verification and screenshots

- `node tests/grass-system-smoke.cjs` exercises the module API, deterministic scatter, shader-source injection, update/wake behavior, and disposal using test doubles.
- `node tests/threejs-adaptation-smoke.cjs` checks scene, renderer, terrain, controls, and grass integration.
- The GitHub Actions `browser-preview` job launches Chromium with software WebGL, loads the local page and external GLB asset, checks the grass module response, tests Explore and keyboard input, and captures desktop cinematic, desktop Explore, and mobile Explore screenshots as a workflow artifact.
- Browser captures are evidence of the exact commit tested, not a promise that every device/GPU behaves identically. Physical iPhone Safari and performance benchmarking still require separate verification.
- The original main branch and GitHub Pages deployment remain unchanged until the draft PR is reviewed and merged.

See `THIRD_PARTY_NOTICES.md` for the upstream grass repository, adaptation scope, and MIT license notice.
