# Card choices, UNO and avatars — October 25

Preserved the current Color play visual direction. Matching-number play remains an optional house rule, now exposed in Rules. Ordinary legal cards still play on activation; multi-card moves explain their outcomes in the shared native dialog. UNO and Pass share the same action lane with a 44px target floor. Humans choose a portrait or use the neutral icon; bots keep deterministic portraits.

Verified the real board and hooks with controlled six-seat rounds at 1280×720, 568×320 and 844×390. Checked paired-card selection, the second card's color, an atomic UNO call, a six-card Discard All leaving one, the adjacent UNO/Pass controls, a 20-card hand, keyboard navigation, focus return after paired play, profile selection and the 390×844 orientation gate. The short dialog initially clipped its cancel control; reduced spacing now keeps it visible. Screenshots capture the shipped components in those controlled rounds. The temporary scenario route and isolated preview copy were removed.

Passed: npm run lint, npm run check:types, npm run check:game, npm run check:audio, npm run build, and npm run check:multiplayer against a dedicated local socket server. Network coverage includes real paired plays, already-declared one-card snapshots, completed wins, duplicate-ID rejection, fixed-list avatar validation and live profile changes preserving the deadline. No test framework or dependencies added.

Existing design-system sidecar drift was reported by the design hook before these changes. The sidecar was not regenerated during this focused refinement. DESIGN.md records the changed interaction and portrait guidance.

Unrelated changes already present or made concurrently in this checkout were preserved. The normal development and socket servers were not restarted; only the dedicated verification processes were stopped.
