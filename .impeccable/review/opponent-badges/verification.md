# Opponent identities — production-browser verification

The user rejected the Cleo name/avatar/count assembly at 845×765. This replacement keeps the illustrated lounge and seat positions. `OpponentSeat` now owns a protruding native card character, compact opaque name backing and separate exact-count tile; the prior Layers/count metadata row and duplicate fan UNO stamp are removed.

## Evidence and interaction

`browser-check.mjs` joins rooms through the real lobby against the loopback-only shared-table fixture. There is no production state injection or extra shipping route. `BADGE6` supplies three players with six-card opponents; `CNT234` supplies six seats with12/24-card opponents. Existing fixture rooms retain their meanings.

Nine production-build cases passed in `metrics.json`: 1440×900 and845×765 ordinary play; six seats at845×765,844×390 and568×320; long names, Offline, UNO and Catch at both landscape phone sizes; an active opponent at845×765; and active reduced-motion play at568×320. Each full viewport capture was opened by the builder. The counter uses actual hand length, with singular/plural accessible text. All identity surfaces fit the viewport, remain at least44px high and do not overlap each other. Game document dimensions equal the viewport. Special captions fit their own columns; long names deliberately ellipsize while retaining full DOM text and title.

Catch is still the eligible player's native button. One Enter activation applies the actual call-out and changes the counter from1 to3. Active styling emphasizes the card character and counter, with accessible Current turn text. Reduced motion removes counter transitions. Existing `.opponent-hand`, `.opponent-label .player-avatar` and `data-seat` anchors are preserved for card-flight ownership; no motion or audio engine is changed.

The small initial detail capture cropped an element wider than its parent. It was an evidence-crop defect, not live overflow; the final detail uses a padded viewport clip. A bounded confirmation checks ordinary owner size plus keyboard focus/Catch on both phones; see `confirmation-metrics.json`. Keyboard modality precedes focus so the capture actually exercises `:focus-visible`.

## Required checks

- Production build, ESLint and strict types passed.
- Game assertions passed60 complete rounds plus conservation, immutable inputs, serialization, wild validation, UNO call-out, gesture and card-motion checks.
- Audio assertions passed unlock/fallback/mute/hidden/expiry/no-backlog and sample-onset cases.
- Multiplayer assertions passed against an owned local socket server on3012: six seats, stable IDs, broadcasts, turn pacing, reconnect and overlapping handoff.
- Formatting check passed. A later documentation-only refresh receives its own formatting check.
- One detector run produced seven palette/type advisories. These are local badge material and density choices, not blockers, generic tokens or broad exemptions. No second detector run is needed.
- Asset provenance scan: four rasters, zero missing. This change adds no raster.

These are browser and assertion checks, not a physical-phone or speaker certification. Finish verdict and the post-correction DESIGN/sidecar refresh complete the scoped handoff. Unrelated primary-checkout background experiments are excluded.
