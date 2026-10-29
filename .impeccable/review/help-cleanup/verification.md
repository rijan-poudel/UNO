# Help and saved-round cleanup — October 29

Continued the authorized whole-site cleanup with a bounded help/practice and persistence pass. Preserved the existing Color play direction, artwork, dependencies and pending workspace changes.

## Changes

- Removed duplicate edition rule lists that contradicted custom switches. Original-edition symbols/practice and the actual table summary are explicitly separate. Normal color selection uses one heading; Roulette keeps its necessary consequence.
- Practice targeting focuses the first opponent; Escape cancels the choice and restores its card. Completion focuses Next example and advances to the next lesson mark. Classic matching/draw replay retain action focus, stepper arrows follow the focused control, and the last lesson focuses Done after winning.
- Reused shared primary controls, removed dead CTA/style branches and invalid-card shake/trophy bounce, completed OS reduced-motion coverage, and corrected green-control/hint contrast.
- Shared completed-round validation protects table scores and device progress from false winners. Streak hydration preserves its invariant; contradictory counted scores are dropped when restoring an unfinished hand. Removed an always-clamped bot-delay computation and a dead online ref without changing pacing.

## Verification

- Lint, strict types, game/controller/lobby/practice/table-score/save regressions, audio checks and production build passed. Lint, strict types and build were repeated after the final tutorial completion focus/contrast fix.
- The complete multiplayer suite passed against the running room server, including all three editions, privacy, reconnects, invitations and authoritative clocks.
- Production browser checks verified Classic matching/reset, draw/pass/replay focus, focused-step navigation and boundary behavior; winning now focuses Done. Mercy swap target focus, Escape restoration, successful completion focus and Next example focus were exercised.
- Screenshots cover completed Classic help at 1280×720 and expanded Mercy practice at 390×844 and 568×320. Landscape Close/Done stay reachable and document width equals the 568px viewport. No warning/error logs were captured.
- Adaptive ColorPicker grid navigation was source-reviewed and its copy/accessible labels asserted; this pass did not replay a full live Wild turn. Prior site-pass verification covers live keyboard Wild selection, six-seat large hands and portrait pause. Physical touch and audible quality were not certified.

## Detector triage

The final scoped detector is clear. Preserved the inherited miniature-table palette and compact card/status geometry through exact file-scoped value exceptions in `.impeccable/config.json`: 18 color values, three radii and the existing 19px type size in `HowToPlayModal.module.css`. These are documented incumbent values, not new app-wide tokens. Actual low-contrast green text and obsolete motion/control styles were fixed. No whole-file or whole-rule exclusions were added.
