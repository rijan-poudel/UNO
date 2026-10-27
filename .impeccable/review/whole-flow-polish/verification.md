# Verification

Passed: npm run lint, npm run check:types, npm run check:game, npm run check:audio, npm run build, npm run check:multiplayer, npm run format:check and git diff --check. The extended supporting UI assertions passed independently after their addition. All three editions completed real network rounds; privacy, friends, timing and lifecycle suites passed.

Browser checks used an independent tab against the production preview at localhost:3004. No original profile, favorite, name, avatar, audio preference or custom profile was changed. Bot challenge and hand sorting were restored to Standard and Color. No local round was created or replaced. Created one disposable online room with five bots, dealt a six-seat No Mercy round and left it normally. No invitations or friend requests were sent.

Verified short-code validation disables Join; desktop and phone entry contain only the room task; 568x320 keeps Join visible at y241.5–292 with no document overflow; a six-seat phone room scrolls while Deal remains fixed; Invite friends opens the matching blue task sheet and Add friends works with Enter; a custom draft accepts changed native selects, then Cancel restores the prior selected game and focus. Local bot options open and update. Six-seat game and menu remain clear in landscape. Production console returned no errors or warnings. Temporary viewport overrides were reset.

All eleven JPEG captures were opened and visually validated in the browser. Dimensions and actual JPEG encoding were checked. File names describe their visible task. No screenshot encodes a changed user preference. Active design hook handled scans; no manual second detector and no suppressions were added.
