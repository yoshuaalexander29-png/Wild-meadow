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
