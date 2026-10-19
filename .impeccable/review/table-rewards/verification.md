# Earned moments — verification and fixture provenance

## Capture validity
All saved files were opened after capture. Required current evidence:
- pressure-320/390/1440.png: seeded six-seat live board with two one-card opponents, one uncalled/one called, local twelve-card hand, real pendingDraw=8.
- result-320/390/1440.png: seeded six-seat terminal engine result, native dialog at its top, collection collapsed. Keyboard focus may outline the dialog.
- collection-320/390/1440.png: same synthetic result, collection expanded, native dialog scrolled to its bottom (scrollTop verified against maxScroll). These deliberately show lower dialog content, not the header.
- loss-320.png: seeded other-winner result with a long winner name at the dialog top.
- home-390.png: actual existing device history (one round, zero wins), expanded unearned collection.
Viewports320x740,390x844,1440x900. Home full-page capture extends below viewport. Captures check exact DOM viewport sizes; the browser override affects only the latest created tab. Wrong-sized preliminary captures were overwritten with correctly sized evidence.

## Behavior observed
Catch changed Cleo from1 to3cards; its button and last-card marker disappeared. The compact56px-wide Catch control no longer intersects the physical deck at320px. Penalty draw changed local12 to20cards, cleared pendingDraw and the +8 overlay, and advanced to Cleo. The deck retains the full accessible penalty count. No round was ended in the socket fixture.

The first result inspection found lower action clipping and an overlaid last-card stamp. One correction batch moved readiness markers inside opponent-hand, compacted Catch and kept sticky actions fully inside the native dialog. The long-name result's two action rectangles were verified inside dialog bounds at320px. Expanded collection scrolls to its full lower content with both actions visible.

Both all-earned and unearned collections were expanded by their native summary. Milestone derivation assertions cover empty progress, first win, three wins, ten rounds, best-streak retention after loss and capped goal display. Existing idempotent result recording remains unchanged. Reduced-motion behavior is checked from CSS/source (browser has no emulation override). Existing sound is unchanged.

## No synthetic progress writes
The terminal preview renders actual RoundSummary, Modal and the exported pure ProgressCollection with supplied illustrative stats. It never mounts useGamePresentation/recordRound or the storage-reading PlayerProgress wrapper. Existing history remained one round/zero wins before and after preview inspection.

To reproduce locally, copy preview-page.tsx.txt to app/reward-preview/page.tsx (create the folder). It makes a real-engine final play, renders a synthetic ten-round/three-win record, and supports ?loss=1. The example links switch preview modes/return home; they are not the real rematch handler. Delete that temporary route before production build. The committed application uses real GameBoard handlers, unchanged online readiness and device history.

For live table fixtures, stop normal Socket.IO and run npx tsx .impeccable/review/table-rewards/fixture.mjs. Loopback-only, real unique-card engine data. ABC234 is a two-card local hand; DRAW23 is twelve cards/pending8. Supports actual call-out and required draws. Restore normal server afterward; never deploy fixture.

Detector ran once; palette/type/radius findings remain advisory against the prior design record. No suppressions or second scan. Production checks run after removal of the temporary route. Physical speaker balance is outside this batch's evidence.

## Release checks

Final production lint, strict types, sixty-round game/milestone/gesture assertions, audio assertions, build and real multiplayer checks all passed. Format check passed. The production build lists only / and /_not-found; no preview route remains. Removing the temporary preview required deleting its stale generated .next/dev/types/app/reward-preview/page.ts after stopping development; that generated stub is not project source. No changes to dependencies or the game engine.

Fresh full finish review returned ship with no material fixes. Documentation updates follow from the finished source. Eleven final captures are the reviewed packet; preliminary captures were overwritten, and no further polish hunt follows.
