# Asset integration and scene cleanup

## Current runtime

- The scene uses Three.js `0.183.0`, `GLTFLoader`, the procedural meadow, and one active Quaternius warrior GLB.
- The inactive forest-wanderer character and separate sword prop are not loaded.
- Obsolete second-character staging exclusions and sword response tracking were removed from the active scene/capture code.
- The procedural environment remains separate from the imported warrior model.
- The raw-WebGL prototype is preserved as `index-procedural-backup.html` for recovery.

## Validation

- `tests/asset-integration-smoke.cjs` asserts that the active scene and manifest do not reference the removed character or sword.
- `tests/threejs-adaptation-smoke.cjs` checks the renderer, active warrior, terrain, grass, and visual-only scene constraints.
- A prior successful Chromium/SwiftShader capture is tied to commit `1eb0b9ef3ac19e19d53640fa29ee7d5e89f34c6a`; it is historical evidence, not proof of the current cleanup.
- Physical iPhone Safari and performance verification are not claimed.

## Remaining visual work

The cleanup removes stale character/prop remnants; it does not by itself solve the broader art-quality problem. The largest remaining opportunities are authored environment assets, more natural foliage silhouettes, improved material/lighting coherence, and deliberate cinematic framing. Any next visual pass must be judged against fresh screenshots from its exact source commit.
