# Joining and learning flow verification

October 25, 2026. Existing board/quarter-hand work retained.

- Passed: `npm run format`, lint, check:types, check:game, check:audio, build, and check:multiplayer against the isolated current-source socket server on port3014.
- Regression assertions cover semantic setup footer/form association, available offline bot action without an error, published-only guest rules, undefined partial defaults, conditional pair-color control, actual-rule help and native named help dialog.
- Real app browser check used separate localhost/127.0.0.1 origins on port3004. Enter created a room; a guest joined; host rule updates reached the guest; help showed12cards and pair settings. No real invitations sent.
- Stopped the isolated socket server to exercise real connection failure; Play with bots opened local setup. Browser captures cover1280×800,390×844 and568×320. Setup remains portrait-capable; phone gameplay remains landscape-only.
- Help keyboard activation reached step5. Static viewport checks do not establish touch/physical-hinge behavior or OS reduced-motion behavior.
- Temporary QA checkout used cached Outfit/Barlow Latin fonts to avoid font-network dependence and allowed127.0.0.1 as a development origin. Main config/font sources remain unchanged.
- One static detector run recorded in detector.json. Existing tutorial motion/pressed-lip warnings and palette/type advisories passed to the independent reviewer; no second detector run.

Guest desktop evidence was replaced after review requested an unclipped first viewport. The corrected capture uses a fresh real guest join at1280×800, with the scroll body returned to its top using keyboard focus.

Final fresh review: ship, no material fixes. DESIGN.md and its sidecar merged after review. Temporary browser tabs, viewport overrides, preview checkout and owned servers were cleaned up.
