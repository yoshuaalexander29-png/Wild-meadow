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


## Visual-only fantasy meadow pass (experimental branch)

This branch now changes the scene from a HUD-led two-character prototype into a visual-only cinematic: the left-side `Characters_Lis.glb` character and gameplay controls are removed, while the warrior and optional sword remain. The automatic camera runs without user input.

The ground mesh now uses deterministic broad noise for restrained rolling terrain and per-vertex colour variation instead of a single solid green material. Grass remains in a separate `grass-system.js` WebGL-compatible instanced module; the desktop medium tier uses 3,200 multi-blade clumps and the mobile tier is reduced. Flower patches, broad-leaf ground cover and small stones use the same terrain-height function. Procedural tree bases are also placed at that terrain height. Imported warrior mesh materials are no longer forced to flat shading or have roughness overwritten.

**Verification status:** source checks and browser capture are being updated for this new visual-only branch. Existing screenshots documented in `VISUAL_REVIEW.md` are baseline captures of an earlier build and must not be represented as screenshots of this branch. Do not merge based on static checks alone; inspect the new desktop/mobile captures and actual shader/console output first. The original main branch and GitHub Pages deployment remain unchanged until this PR is merged.
