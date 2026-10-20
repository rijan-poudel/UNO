# Centered home asset manifest

## produce

None. The selected source is standalone, full-resolution generated artwork, not a UI mock crop. No regeneration or creative editing was performed.

## direct

- id: card-club
- source_crop: none; selected original at /Users/rizx/.codex/generated_images/01a14826-ce7e-7810-b29f-cc5709f6fe93/exec-d47b6541-78c7-4288-9aca-541b5df23b8b.png
- output_path: public/artwork/card-club.webp
- strategy: faithful full-frame WebP conversion using the existing sharp dependency; quality 86, effort 6, maximum width 1672, without enlargement.
- prompt_used: exact generation prompt at .impeccable/home-art-prompt.txt; byte-for-byte prompt value retained in public/artwork/card-club.webp.json.
- dimensions: 1672 × 941 px. Pass width={1672} height={941} to next/image; do not substitute nominal 16:9 dimensions.
- format: WebP
- transparency: none; opaque RGB
- filesize: 208232 bytes (203.4 KiB), plus 1987-byte provenance sidecar.
- deviations: none from selected source composition. The original's rabbit ears meet the top edge; physical playing cards retain their original generated symbols. No additional objects, UI, borders, rounding, shadows, transforms, or text were added.
- qa_status: accepted. Opened source and output; characters, card placement, lighting, silhouette, and fine texture match. Compression remains crisp at intended component scale.
- provenance: embed-prompt.mjs ran with --prompt-file .impeccable/home-art-prompt.txt. WebP uses the tool's documented JSON sidecar fallback. Exact prompt equality was asserted. Scan result: SCAN: 1 raster, 0 missing.

## semantic

- id: home-title-and-context
- implementation: real h1 and adjacent short text in the existing Outfit font system. Place in the centered page composition with spacing owned by CSS. Keep all title, subtitles, presence counts, scores, progress, and status labels accessible text.
- notes: compose with card-club.webp; do not rasterize text or place essential labels into the scene. Image can use empty alt if the surrounding text conveys the page purpose, or a concise scene description if treated as meaningful illustration.
- qa_status: accepted as build handoff; final layout QA belongs to parent.

- id: home-actions-and-navigation
- implementation: existing semantic button/link components for primary play, online join/create, and secondary navigation; native dialog components for interactive flows. Center actions below or slightly overlapping the illustration's quiet tabletop. CSS owns arrangement, focus/hover/active states, borders, clipping, and responsive layout; lucide-react owns existing utility icons.
- notes: every action and count stays live HTML. Preserve keyboard focus and touch targets. Do not add presentation chrome to the bitmap.
- qa_status: accepted as build handoff; final layout QA belongs to parent.

- id: scene-responsive-presentation
- implementation: next/image using intrinsic 1672 × 941 dimensions, responsive sizes, object-fit: cover, and object-position: 50% 50%. Container sizing, overflow, optional subtle color blending, and the page background remain CSS responsibilities.
- notes: at desktop ~1000 × 380, centered cover shows approximately source y=153–788: all three faces and the played reverse remain visible, while upper ears/lamp and lowest tabletop crop. Prefer a slightly taller scene if the full lamp/ears matter. At phone ~390 × 270, centered cover shows approximately source x=156–1516 and the full source height: all three faces and central card action remain visible, while outer fur/scenery crop. Keep controls below the scene on phones. One asset is sufficient; no phone-specific production duplicate was created.
- qa_status: accepted as build handoff; validate final CSS crop at target viewports.

## execution_order

1. Inspected the selected standalone original and exact prompt.
2. Converted the full frame to the production WebP without changing composition.
3. Stored provenance via the required embed tool and asserted prompt equality.
4. Opened the optimized output for visual comparison and scanned public/artwork.
5. Parent composes scene, title, controls, and counts in semantic UI.

## blockers

None.

## assumptions

- The supplied generated original is the approved selected direction for this asset-only assignment.
- Keep the original outside the repository; public/artwork contains only the consumed WebP and required provenance sidecar.
- Exact source aspect ratio takes priority over the prompt's nominal 16:9 request.
- CSS performs responsive cropping; no regeneration or separate crop is needed.

## Final composition after fresh finish review

Desktop uses the full intrinsic1672:941 frame with object-fit:contain:880px wide at the owner's1166px screen and960px wide at1440px. No desktop silhouette or gesture is intentionally cropped. The menu overlaps only the quiet foreground below the played reverse card. Phones keep cover at280px high (230px on320px screens), preserving the previously reviewed composition. The same optimized WebP is served directly through Next Image unoptimized withpreload, avoiding a second lossy encode. No asset content, source prompt or provenance changed.
