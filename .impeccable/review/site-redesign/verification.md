# Comic-card site redesign verification

## Automated checks

- `npm run lint`: passed, no warnings after retiring the dev-only fixture source to `.tsx.txt`.
- `npm run check:types`: passed.
- `npm run check:game`: passed 60 complete rounds, conservation, immutable state, serialization, wild/UNO validation, gestures, progress and presets, connection configuration, player names and card motion.
- `npm run check:audio`: passed unlock race, fallback, mute, visibility, expiry, no backlog, blocked storage and sample onset.
- `npm run check:multiplayer`: passed against the temporary local Socket.IO service: creation, joins/kicks, six seats, stable IDs, published bot turns, pacing, reconnect, refresh and overlapping handoff.
- `npm run build`: passed after removing one stale generated `.next/dev/types/app/design-preview` entry for the deleted development route. Production routes are `/` and `/_not-found`; no fixture route ships.
- `npm run format`: applied to supported source/document paths.

## Browser evidence

The current 1280 px desktop preview,1440 px desktop,390 px portrait entry,844×390 and 568×320 landscape entry were inspected. Play/Create/Join remain visible. Home at the approved comp's 1586×992 was captured separately. Final hand fixtures contain six seats and 20 real cards in engine-derived synthetic state; they are layout evidence, not a claim of live match outcomes. Result fixture uses standalone RoundSummary/Modal, bypassing progress recording. The dev-only route was removed before the final build and fixture source retained as plain text for reproducibility.

At 844×390 and 568×320, game document dimensions match the viewport; five opponent badges are 47.5 pxhigh and the 20-card hand scrolls. End moves keyboard focus to the twentieth card and reveals it; Menu Close restores focus to Game menu. Four 72 pxwild-color targets and Keep the wild card fit at 568×320. Portrait entry to actual local play shows the pause/rotate gate.

A real private room was created, a bot added and the room left. All four appearance choices changed the root theme, and the original Daylight preference was restored. Original three-seat bot setup was restored after the six-seat check.

A production server on 3212 was started after the final build to check real merged CSS. Artwork loaded, Barlow display lettering and 700 pxmedium-screen action group matched the intended system. A keyboard activation played a real green 9 on first activation, reducing the hand 7→6; Menu Close restored focus; browser console had no errors. The production test server and the agent-started socket server were stopped. The pre-existing development server on 3210 was retained and the final tab returned there.

Reduced-motion source paths remain intact, with non-overshooting shared easing. This session does not claim browser-emulated reduced-motion screenshots, physical-phone touch testing or physical speaker certification.

## Design review and detector

Independent review requested four material fixes. The follow-up verdict scored all four resolved and reported no regressions. That ship disposition covers the listed fixes, not a new exhaustive whole-site audit. See finish-review.md.

One deterministic scan produced 231 findings:131 palette,65 type,29 radius advisories against the prior design canon; five functional pressed-lip false positives; one inherited overshooting ease. The ease was fixed. Only the side-tab rule was narrowly exempted for bottom control lips in globals.css/table.css. All individual findings and decisions are in detector-triage.json. Legacy source advisories remain documented; no second detector was run and no zero-finding claim is made. New documentation describes the actual new world rather than promoting obsolete declarations into tokens.

All five public artwork rasters passed provenance scan (zero missing). New art and drawn marks were generated with built-in imagegen, with exact prompt sidecars and production manifest. Historical artwork remains preserved. Catalog quality-bar references were unavailable after two attempts; the choice and approved comp have full local records.

## Documentation

The shipped design was recorded by the independent documenter in DESIGN.md and the schema2 sidecar, with updated home and arena surface briefs. Canonical source roles replace prior visual guidance; historical source advisories are not promoted into tokens. Architecture visual-boundary notes were refreshed.
