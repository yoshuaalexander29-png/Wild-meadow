# Highest-impact visual work — current state

The current experimental scene is a Three.js cinematic meadow with one imported warrior, procedural terrain, trees, flowers, stones, and instanced animated grass. The former second character and separate sword prop are not active scene assets.

## Priorities (in order)

1. **Get trustworthy fresh screenshots.** Run the repository browser-preview workflow against the exact current commit; inspect the actual PNGs and browser report before claiming visual improvement.
2. **Replace repetitive procedural environment silhouettes.** Prefer one coherent, licensed stylized-nature asset set for tree canopies, rocks, and selected foreground plants. Keep procedural grass for coverage, not as a substitute for authored landmarks.
3. **Improve scene composition and depth.** Use a clear foreground frame, readable warrior silhouette, distinct middle-ground forms, and quieter atmospheric background. Avoid adding random detail to every open area.
4. **Refine material/light response only after inspecting captures.** Check toon bands, shadows, exposure, and contrast together; do not compensate for bad materials with arbitrary brightness.
5. **Measure mobile cost separately.** A mobile-sized Chromium screenshot is not an iPhone Safari test.

## Asset integration gates

- Preserve source URLs and the original licence notice.
- Validate actual downloaded files, textures, animation clips, and rig before integrating them.
- Replace an existing element rather than layering duplicate geometry over it.
- Do not add a second character or sword unless explicitly requested and correctly staged.
- Capture and inspect genuine browser output after each coherent visual change.

## Current limitation

The latest code cleanup is not itself a visual overhaul. The scene still uses procedurally generated trees and ground cover, and the active warrior model does not exactly match the intended character archetype. No improvement should be claimed until the latest revision is rendered and visually inspected.
