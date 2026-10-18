# WILD MEADOW — asset-backed WebGL build

The main `index.html` now loads two existing CC0 GLB character assets and a CC0 sword model rather than presenting the previous hand-assembled primitive meshes as hero characters. The environment remains original procedural scenery. The source assets are attributed in `ASSET_MANIFEST.md`.

## Run

Serve this directory over HTTP/HTTPS, then open `index.html`:

```sh
python3 -m http.server 8080
```

Open `http://localhost:8080/`. The scene uses Three.js 0.183.0 and GLTFLoader from jsDelivr, with GLB character/weapon assets from the Cinevva CDN. A working network connection is required. It is not an offline build.

On iPhone, host over HTTPS and open in Safari. Physical iPhone 14 verification has not been completed.

## Controls

- Drag the scene to orbit the camera.
- **Next shot** cycles manual camera views.
- **Restart** restarts the 20-second sequence.
- **Pause / Resume** pauses/resumes the timeline.

## Asset caveat

The imported models are complete pre-existing GLB assets, not custom-built mesh assemblies. They are not exact matches for the original brief: `Characters_Lis.glb` is a human character, not a deer-centaur forest spirit; `Knight_Male.glb` is a fantasy knight, not a silver-haired barbarian. This iteration removes the procedural stand-ins, but still needs better archetype-matched licensed assets. The sword is loaded as a separate prop; precise attachment to the warrior's hand has not been verified.

## Verification

`node tests/asset-integration-smoke.cjs` checks the HTML module wiring, expected upstream asset references, GLTFLoader usage, visible failure handling, and that the previous procedural version is retained as `index-procedural-backup.html`. This is static/source verification only. It does not prove successful CDN fetches, GLB render output, shader correctness, frame rate, or iPhone compatibility.

The prior raw-WebGL prototype is preserved at `index-procedural-backup.html` for comparison and recovery.
