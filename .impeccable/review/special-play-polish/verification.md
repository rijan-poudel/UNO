# Special-play polish — October 25

Implemented the accepted follow-up improvements in the current Color play world:

- Legal number pairs carry a ×2 marker in the exposed left strip of the held face. Discard All carries its removal count and exposes exact remaining-hand / UNO guidance on hover or keyboard focus.
- All public faces in a paired play or color clear travel to the pile. The motion layer caches current rendered hand poses; total stagger is bounded at 120ms, moves never wait, metadata cannot replay a throw, and reduced motion skips travel. Only the latest two pile history faces remain visible at rest.
- UNO and Pass use fixed columns. At 568×320, Pass measured x=106, y=165, width=84, height=44 both with and without an available UNO button.
- Six new original portraits extend the original sheet without changing existing IDs. The picker offers twelve portraits and a neutral icon, with a 96px selected preview; compact landscape measured a 72px preview beside 40px portrait options with 48px button targets.

Browser verification used the real GameBoard and local hook in isolated controlled six-seat rounds at desktop, 568×320 and 844×390, including a twenty-card hand. Confirmed two distinct red/blue flying faces for a pair and all six red faces for Discard All, with hint badges absent from traveling copies and the one-card UNO hand already published. Keyboard focus returned to the remaining card. A temporary fixture override of the reduced-motion media query confirmed zero traveling copies with the same completed move. System preferences were unchanged.

The first inspection exposed occluded pair markers in a crowded fan and a specificity conflict that kept avatar thumbnails too large on short screens. The final left-strip placement and scoped picker rules corrected both. The final screenshots show the resulting layout.

Passed npm run lint, npm run check:types, npm run check:game, npm run check:audio, npm run check:multiplayer against a dedicated socket server, and npm run build. Production includes only the application route and not-found route. Temporary scenarios existed only in the isolated copy, which was removed; dedicated verification servers were stopped. Existing shared servers and unrelated checkout edits were preserved.

The new artwork is public/artwork/player-portraits-extended.webp. Its exact built-in image generator prompt, reference and generation method are recorded in the adjacent .webp.json provenance file. Existing design sidecar drift was not regenerated during this refinement.
