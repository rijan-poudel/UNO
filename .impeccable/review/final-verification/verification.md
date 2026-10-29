# Final Production Readiness & Verification Pass — October 29

A coordinated production-readiness pass and regression correction across the complete player journey:
Home → settings/setup → local or online table → playing → results → rematch or return to lobby.

## Summary of Changes

- **Online Reliability & Room Transitions (`hooks/useUnoOnlineGame.ts`)**:
  - Corrected `isNewerRoomSnapshot`: Replaced the over-restrictive `if (current.started && !incoming.started) return false;` with active (unfinished) game qualification: `const isCurrentActiveGame = Boolean(current.started && current.game && !current.game.winnerId); if (isCurrentActiveGame && !incoming.started) return false;`. This correctly accepts legitimate transitions from a finished online round back to the lobby when the host selects "Edit table" (`started: false`, `game: null`).
  - Hardened state reconciliation in `returnToLobby` and `toggleReady` by applying acknowledgment snapshots guarded by `isNewerRoomSnapshot`, ensuring late broadcasts or delayed replies cannot overwrite newer authoritative rounds or restore old results.
  - Retained strict safeguards against stale room reopening after leaving via `discardStaleMembership` and `membershipRevision` invalidation.
- **Game & Persistence Correctness (`lib/gameActions.ts`, `lib/gameRules.ts`, `lib/playerProgress.ts`, `lib/savedRound.ts`)**:
  - Corrected `wildReverseDraw4` pending draw type to `'wild4'` for proper stacking responses under No Mercy.
  - Guaranteed Mercy elimination immediately crowns the survivor when opponents are eliminated during targeted plays.
  - Guarded `wildForcedSwap` and `shuffle` against premature empty-hand victory triggers prior to hand transfer.
  - SSR safety on progress storage events and normalized recovery for roulette state.
- **Supported Browser Test Infrastructure (`scripts/playwright-loader.mjs`)**:
  - Replaced machine-specific hardcoded Playwright import paths with standard dynamic resolution and environment fallbacks (`process.env.PLAYWRIGHT_PATH`).
  - Added runnable automated browser journey (`scripts/test-full-journey.mjs`) and 2-player multiplayer journey (`scripts/test-multiplayer-browser.mjs`).

## Exact Verification Commands

To run all checks deterministically:

```bash
# 1. Format and code quality
npm run format:check
npm run lint
npm run check:types

# 2. Local game logic and audio assertions
npm run check:game
npm run check:audio

# 3. Multiplayer network assertion suites (requires socket server on port 3001)
npm run start:socket &
npm run check:multiplayer

# 4. Production build check
npm run build

# 5. Automated Browser Verification (requires dev server on port 3004 and socket server on 3001)
npm run dev:web &
node scripts/test-full-journey.mjs
node scripts/test-multiplayer-browser.mjs
```

## Behavioral Assertions vs. Screenshot Capture

### Behavioral Assertions (Deterministic Pass/Fail)
1. **Single-Player / Responsive Layout (`scripts/test-full-journey.mjs`)**:
   - Desktop 1280×720: Verified Home screen controls, profile menu trigger, Settings dialog opening and Escape key focus return, Play transition to table, and hand card rendering.
   - Short Landscape 568×320: Verified document scroll width equals client width (`scrollWidth === clientWidth`) on both Home screen and active Game table (0 horizontal overflow).
   - Wide Landscape 844×390: Verified 0 horizontal document overflow on Game table.
   - Portrait Phone 390×844: Verified orientation guidance gate (`.rotate-phone`) appears when entering game in portrait mode.
2. **Online Multiplayer Journey (`scripts/test-multiplayer-browser.mjs`)**:
   - 2 isolated browser contexts (Host & Guest) with separate storage/sessions.
   - Step 1: Host creates room, Guest joins via room code. Both verify 2 seated players in `.room-seats-heading`.
   - Step 2: Host deals, both enter live table, play cards until round completes, and both verify "Round over" modal.
   - Step 3: Host selects "Edit table" (`returnToLobby`).
   - Step 4: Behavioral assertion: BOTH Host and Guest actually transition back to the lobby (`started: false`, `game: null`, room code panel visible).
   - Step 5: Host opens settings and updates an allowed table rule.
   - Step 6: Host deals again.
   - Step 7: Behavioral assertion: Both players enter the new round with private hands dealt and round results reset.
3. **Multiplayer State Transitions (`scripts/check-multiplayer.ts`)**:
   - Finished round (`started: true`, `game.winnerId: 'p1'`) → Lobby (`started: false`, `game: null`): accepted.
   - Lobby (`started: false`, `game: null`) → Newly dealt round (`started: true`, `turnCount: 0`): accepted.
   - Results → Rematch: accepted.
   - Readiness acknowledgment arriving after a new round: cannot restore old results.
   - In-progress active round (`started: true`, `winnerId: null`) receiving late lobby snapshot: rejected.
   - Leaving while an operation is pending: late updates cannot reopen the room.

### Screenshot Artifacts Captured
Stored in `.impeccable/review/final-verification/`:
- `home-desktop.png`: 1280×720 desktop landing view.
- `settings-desktop.png`: 1280×720 modal dialog and focus presentation.
- `game-desktop-6seats.png`: 1280×720 tabletop with held hand and turn cues.
- `game-short-landscape-568.png`: 568×320 compact landscape tabletop without document scrollbars.
- `game-wide-landscape-844.png`: 844×390 modern phone landscape tabletop.
- `home-phone-portrait.png`: 390×844 phone portrait home view.
- `phone-orientation-gate.png`: 390×844 phone portrait guidance gate requesting landscape rotation.

## Remaining Physical Limitations
- Real physical touchscreen touch-flick velocity and hardware multi-touch gesture feel cannot be fully simulated via headless Chromium synthetic pointer events; verified via programmatic pointer gesture calculations and release predicates.
- Physical audio hardware output levels and analog speaker fidelity require device-level listening; verified via Web Audio API context mock unlock, state transitions, muted tab events, and audio preparation scripts.
