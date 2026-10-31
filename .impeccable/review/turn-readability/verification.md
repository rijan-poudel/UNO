# Quiet focus and readable turns

The owner rejected oversized yellow focus rings, covering action feedback and a flat circle of arrows. Preserve the existing amber turn/target prompt and Swiss Minimal cards.

## Shipped behavior

- Keyboard focus is a thin cream mark. Held-card focus is inset, without growth; it still lifts enough to expose the whole face. Targetable identities use a quiet charcoal surface and a contained muted edge, without yellow rings.
- The amber turn cue remains in its existing toolbar slot. Your turn includes a short legal next step; reconnecting does not claim it is your turn. No Mercy drawn cards never offer Pass.
- The latest action stays below the cue instead of flashing a large symbol across the table. It reuses the existing action description and accessible activity announcements.
- Shared local/server bot pacing is 1700ms; forced human draws use 1400ms. Play/draw flights take 360–450ms and preserve exact pickup/contact geometry. Audio and motion never gate manual actions.
- Two curved ribbons travel on a tilted plane beneath the piles. Real stacking occludes them; a subdued far side, thin edge and soft cast shadow establish depth. Reverse changes playback direction without resetting its position. Hidden tabs and OS/saved reduced motion pause the loop.

## Evidence

- Inspected 1280 × 720 and 844 × 390 layouts with six seats. Desktop opponent fans remain clear; the existing short-screen policy keeps names/counts visible in place of fans.
- Observed a 16-card scrolling hand on the phone and checked End-key access and full-face focus. `phone-focus.png` captures the later seven-card keyboard-focus state after a bot hand swap.
- `desktop.png`: your-turn hierarchy, persistent action receipt and thin held-card focus.
- `desktop-target.png`, `phone-target.png`: final target surfaces, original amber prompt and ribbon occlusion.
- Played Reverse locally and verified the published direction became −1 and the live table flow changed. No browser errors were reported.
- Passed formatting, lint, TypeScript, game assertions, audio assertions, the complete automated multiplayer suite and production build. The unavoidable-penalty network check now uses the shared delay instead of its previous hardcoded wait.
- No manual multiplayer session, new dependency or test framework. Local preview preferences and viewport were restored.

The reduced-motion and hidden-tab branches were reviewed in source; these captures do not certify OS preference changes, physical touch or frame-rate measurements. No independent finish-review claim is made.
