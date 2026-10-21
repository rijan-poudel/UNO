# Illustrated room asset manifest

Packaging scope: the selected original room painting, supplied as a standalone implementation asset. This is artwork packaging; it does not assert an approved UI comp or user approval of this specific painting.

## produce

None. No generation, editing, cleanup, crop or redesign was required.

## direct

- **id:** game-room-evening
- **source_crop:** none; complete standalone source PNG at `/Users/rizx/.codex/generated_images/01a14826-ce7e-7810-b29f-cc5709f6fe93/exec-fe44a26b-52b9-409d-b35c-01516e56d594.png`
- **output_path:** `public/artwork/game-room-evening.webp`
- **strategy:** full-image conversion with cwebp, quality 82, method 6; no resize or crop
- **prompt_used:** no new generation prompt; exact final edit prompt retained in `public/artwork/game-room-evening.webp.json` under `prompt` and `finalEdit.prompt`; original generation prompt under `originalGeneration.prompt`. The prescribed embed-prompt.mjs helper was run with `--prompt-file .impeccable/review/illustrated-room/art-edit-prompt.txt` and uses its JSON sidecar fallback for WebP.
- **dimensions:** 1672 × 941 px, matching the source; no upscale
- **format:** opaque, nonanimated lossy VP8 WebP, verified from actual raster bytes by file and webpinfo
- **weight:** 63,838 bytes (62.3 KiB), below the 350 KiB target
- **transparency:** false
- **deviations:** conversion preserves the selected source. The generation prompts requested 1920 × 1080; the tool supplied 1672 × 941. Source tabletop far edge is approximately 28% down at center, rather than the edit prompt's requested 24%; no corrective artwork edit was requested. Responsive crop acceptance remains parent review.
- **qa_status:** accepted for packaging. Source and final image were both opened and visually compared; furniture, warm/cool palette, whole-image composition, and clear tabletop are preserved. No painted cards, UI, lettering, card frames or new objects were added.
- **provenance:** JSON sidecar includes exact original and final prompts, original edit input and final tool output paths, built-in image tool name, source dimensions, conversion parameters and SHA-256 hashes for both source images and final WebP. Tool originals remain in generated_images.

## semantic

- **id:** live-game-layer
- **implementation:** CSS owns the room image's responsive cover sizing and position within the existing arena stage. Existing UnoCard/HandCard components render live cards; existing player components render seats/avatars; existing controls and native Modal render menus/dialogs above the background. Preserve independent z-index/pointer layers and accessible live turn status. Use the same single background raster at desktop and phone sizes; parent checks six-seat phone layout, scrolling held hand, keyboard focus and reduced motion.
- **notes:** Do not bake runtime cards, players, buttons, labels, shadows, interface chrome or responsive layout into artwork. Runtime card piles overlay the blank tabletop. No implementation files changed by this packaging task.
- **qa_status:** needs_parent_review for live desktop/phone composition; handoff only

## execution_order

1. Inspect the supplied standalone source and exact prompt files.
2. Convert the entire source at native resolution with cwebp q82/m6.
3. Run embed-prompt.mjs using the exact final edit prompt file; extend the resulting sidecar with original/edit provenance and hashes.
4. Verify actual WebP media, dimensions, alpha/animation flags and byte size, then compare source and shipping images visually.
5. Parent checks responsive CSS crops and live-game overlays.

## blockers

None for packaging.

## assumptions

- This selected standalone original painting ships by direct conversion; it is not a crop from a UI mock.
- Lossy WebP at native dimensions is the requested delivery format; one responsive-cover asset is sufficient.
- The helper's WebP JSON sidecar fallback is the prescribed prompt-retention mechanism; source PNGs are not modified.
