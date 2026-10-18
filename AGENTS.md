# Wild Meadow — Engineering and Visual Quality Contract

Applies to every coding agent working in this repository. The objective is a polished, playable stylized fantasy environment, not merely code that compiles.

## Start from repository truth
- Work on the existing branch unless instructed otherwise. Primary working branch: `feat/threejs-controller-toon-rendering`.
- Before editing, inspect current branch/ref, recent commits, relevant source, tests, asset attribution, rendering notes, and recent Actions runs. Re-fetch files immediately before writes to avoid stale overwrites.
- Preserve architecture and authored assets. Do not casually upgrade Three.js, replace the renderer, recreate GLB characters from primitives, invent asset provenance, or add dependencies without a demonstrated need.
- Make focused changes, inspect diffs, preserve unrelated work, and never merge/deploy to main without authorization.

## Execute, do not substitute plans
- Default to implementing the requested change directly in the repository.
- Trace defects to their source. Prefer minimal durable fixes over visual workarounds, compensating geometry, arbitrary brightness increases, or broad refactors.
- Preserve the established warrior-focused composition. No unrelated characters, HUDs, or gameplay systems.
- Never claim an asset is attached to a rig/bone unless the attachment is verified.

## Mandatory validation ladder
1. Inspect the diff and verify the intended change.
2. Run relevant existing syntax, smoke, integration, asset and attribution tests.
3. Run the actual browser rendering path with real WebGL via the established Playwright/Chromium workflow. Mocks and navigation-only checks do not qualify.
4. Capture genuine establishing, alternate camera, character close-up and mobile viewport screenshots. Record exact source SHA, viewport/shot, asset HTTP statuses, console/page errors, shader/WebGL errors, failed requests and diagnostics.
5. Open and inspect the actual PNGs. If the tools cannot expose them for inspection, explicitly state visual inspection is blocked; do not claim the scene looks better.
6. Publish genuine PNGs and diagnostics as artifacts and, where configured, commit them to the working branch. Verify exact paths and source SHA before linking.
7. Compare with the last verified capture. Rank the three largest visual defects and fix the highest-impact issue first, one coherent visual concern per iteration.

A passing smoke test proves only the assertion it checks. An Actions success, canvas existence, frame counter or screenshot file alone does not prove visual quality.

## Art direction
- Rich, layered meadow vegetation with varied, natural silhouettes; avoid repetitive spikes and uniform noisy density.
- Readable foreground, middle ground, background, rolling terrain and intentional landmarks.
- Clearly readable warrior, deliberate framing, original authored textures/materials.
- Cohesive toon shading, warm directional sun, readable shadowing and controlled colour management.
- Atmospheric depth without muddy fog, crushed darks, washed highlights or oversaturation.
- Clean cinematic presentation and sensible desktop/mobile performance.
- Evaluate the whole frame, not one object. When addressing darkness, inspect exposure, tone mapping, light direction, material response, shadows, toon bands and background contrast together. Avoid decorative ground-disc shadows and fake contact shadows.

## Browser/device truth
- Report desktop Chromium and mobile-sized Chromium separately.
- A mobile viewport is not real iPhone Safari. Claim iOS Safari verification only when actually tested on Safari/iOS.
- Report FPS/frame time only when measured reproducibly.
- If capture stalls/fails, inspect the exact failing step and logs, diagnose, then make a targeted fix; do not blindly rerun the same broken workflow.

## Screenshot pipeline
- Tie screenshots to the exact tested source commit; old captures are historical only.
- Preserve diagnostic reports even on failure. Upload artifacts with `if: always()` so failure evidence survives.
- Prevent evidence-commit loops. Check permissions, branch protection, filenames and artifact contents if publishing fails.
- Link individual PNGs only after verifying committed paths; an artifact ZIP is not an individual screenshot.

## Final reporting
State files changed, why, approach/relevant code, tests actually run/results, commit SHA/link, genuine screenshots and observed content, remaining defects, and desktop/mobile/iPhone Safari verification separately. Distinguish **implemented**, **tested**, **captured**, and **visually inspected**. Never fabricate screenshots, metrics, test results or claim completion merely because code compiles.
