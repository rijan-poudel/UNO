# Shared table artwork asset manifest

## Produce

None. The approved generated source is a standalone production image.

## Direct

- **id:** card-night-flat
- **source_crop:** /Users/rizx/.codex/generated_images/01a14826-ce7e-7810-b29f-cc5709f6fe93/exec-0ce5d709-530c-4833-a588-2bbac034f513.png (approved standalone generation; no crop)
- **output_path:** public/artwork/card-night-flat.webp
- **strategy:** Sharp WebP conversion, quality 90, alphaQuality 100, effort 6. Original image dimensions and full composition retained.
- **prompt_used:** Exact generation prompt preserved in public/artwork/card-night-flat.webp.json using embed-prompt.mjs --prompt-file .impeccable/review/shared-table/art-prompt.txt; equality verified against that source file.
- **dimensions:** 1729 × 910 pixels
- **format:** WebP, 220786 bytes (215.6 KiB)
- **transparency:** True RGBA; decoded alpha exactly matches the source at every pixel. 671298 fully transparent pixels, 898739 partially transparent pixels, 3353 opaque pixels; zero changed alpha values.
- **deviations:** RGB uses high-quality lossy compression to reach the requested size budget; alpha is lossless. No crop, resize, redrawing, or creative edits.
- **qa_status:** accepted. Source and output inspected; silhouettes, composition, palette, and content retained. Dimensions and full alpha plane checked programmatically.

## Semantic

- **id:** illustration-presentation
- **implementation:** Parent composes the artwork through an img or Next Image with intrinsic width 1729 and height 910, responsive width and height auto, object-fit contain. CSS owns placement, surface color, scaling, and any clipping or presentation treatment; the raster retains only its approved illustrated scene.
- **notes:** No UI changes were made by this asset task. Avoid object-fit cover if the complete approved silhouette should remain visible.
- **qa_status:** accepted

## Execution order

1. Convert approved standalone PNG with Sharp.
2. Preserve and verify original dimensions and alpha.
3. Attach exact prompt provenance and verify equality.
4. Visually compare source and output; deliver manifest.

## Blockers

None.

## Assumptions

The supplied standalone built-in generation is approved for shipping. Original 1729 × 910 dimensions meet the component requirements. WebP quality 90 with lossless alpha is preferred over the 835330-byte lossless RGB alternative to satisfy the 250 KiB target.
