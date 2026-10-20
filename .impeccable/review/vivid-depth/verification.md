# Vivid-depth evidence

Owner steering: “game feeling3d effects…not pastel…vibrant”. This amplifies existing physical cards and the shared table; it does not replace the approved geometry or reintroduce portrait phone gameplay. Baseline is6b762c3 and the shared-table screenshot packet. No new raster imagery or dependency. The loopback fixture reuses .impeccable/review/shared-table/fixture.mjs on3011, preview3010.

## Required captures

All files in this folder were opened, validated and inspected:
- home-user.jpg845×765 full page; home-phone.jpg390×844. Centered controls remain; yellow primary, blue Create and crimson Join have a physical press edge.
- game-user.jpg845×765; game-hover.jpg845×765; game-focus.jpg845×765; game-desktop.jpg1440×900. Richer material/ink, laminated face edge, directional shadow and clear lifted face.
- game-landscape.jpg844×390. Landscape geometry unchanged.
- game-six-twenty-landscape.jpg844×390 and game-six-twenty-small.jpg568×320. Six seats,20cards, keyboard End reveals final Wild+4.
- portrait-gate.jpg390×844. Landscape-only guidance retained.
- wild-picker.jpg844×390. Saturated native color choices. The earlier capture caught a transition and was replaced by a settled capture before review.

## Observed interaction/geometry

At845×765, hovered green discard-all has an actual non-identity matrix3d corresponding to rotateX5/rotateY−5 and perspective650; bounds y493.68–656.62 stay inside hand scrollport y477–713. elementFromPoint at the lifted face top hits that face. Focus ring remains visible. CSS owns the effect without pointer tracking or a render loop; contact is immediate and settles transform before the source pose.

Native upward drag at844×390: green discard-all7→6cards, discard updated and next turn published;0leftover body card ghosts. One-tap Wild+4 opens the native picker. Penalty draw12→20 still acknowledges once. At568×320, document is exactly568×320, final focused Wild+4 x486–550,y164–259 inside scrollport y150–286, horizontal scrollLeft417. No vertical page scroll or hand clipping observed. The first review found a hidden draw counter at568×320; the correction and measurements are recorded below. Native dialog focus and Leave remain usable.

## Verification

Lint zero warnings; strict types; game60rounds/conservation/gestures/progress/presets/flight; audio unlock/fallback/mute/lifecycle; multiplayer protocol/reconnect/bots/sixseats; production build all passed. Contrast assertion check-contrast.mjs passes small card indices at both laminate-gradient extremes, and home/color-choice control inks. Dark green/yellow index inks preserve4.5:1 at small card multipliers; central numerals remain large. Wild+4 uses four full-color small cards, replacing the faint pastel patch motif.

One detector run in hookless worktree:59advisory findings (new authorized saturation, material depth and component module),0warnings. No suppressions. Existing artwork/texture provenance scan:3rasters,0missing. Contract marker survives built HTML. Reduced motion excludes tilt/sheen sweep through the media query and removes their transitions; touch/coarse pointers get static depth rather than hover requirements. These are source guards, not an OS reduced-motion or physical-phone emulation result.

Limits: screenshot/browser checks establish rendering and native mouse/keyboard interactions, not real phone hardware performance or subjective speaker balance. Audio and turn timing unchanged. Primary checkout's unrelated globals.css/table.css/GameFeedback.tsx edits are preserved.

## Review correction

The fresh review found the smallest-landscape middle badge over the pile tops/draw chip. Only max-height360px/min-width541px changes:28pxone-lineidentityplates, avatarhidden, countinlinewithcardsicon; pilelabels become visuallyhidden but accessible, reducing pile group height; countertop4px andcuebottom15%. At568×320 all badges endy80, both cardfaces starty83.64 anddrawchip starts86.64. Measured rectangle intersections with every badge are empty for both faces and chip. Hand vertical space is unchanged. Root overflow is clip to forbid ancestor horizontal scrolling when focus reveals a wide hand; the hand remains its own native scrollport. Rebuilt and recaptured568and844 for the reviewer’s scored verdict. No second detector.
