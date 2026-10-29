# Final Production Readiness & Verification Pass — October 29

A coordinated production-readiness pass and regression correction across the complete player journey:
Home → settings/setup → local or online table → playing → results → rematch or return to lobby.

## Summary of Changes

- **Online Reliability & Room Transitions (`hooks/useUnoOnlineGame.ts`, `lib/roomMembership.ts`)**:
  - Extracted pure membership and snapshot reconciliation logic into `lib/roomMembership.ts` (`isNewerRoomSnapshot`, `reconcileRoomUpdate`, `reconcileAcquisitionAck`, `shouldDiscardStaleMembership`).
  - Corrected `isNewerRoomSnapshot`: Replaced the over-restrictive `if (current.started && !incoming.started) return false;` with active (unfinished) game qualification: `const isCurrentActiveGame = Boolean(current.started && current.game && !current.game.winnerId); if (isCurrentActiveGame && !incoming.started) return false;`. This correctly accepts legitimate transitions from a finished online round back to the lobby when the host selects "Edit table" (`started: false`, `game: null`).
  - Integrated pure reconciliation functions directly into `hooks/useUnoOnlineGame.ts`:
    - `reconcileRoomUpdate`: Used in `socket.on('room:update')` setState updater. Rejects late broadcasts when outside a room (`prev.room` is null), room ID mismatches, and stale snapshots.
    - `reconcileAcquisitionAck`: Used in all operation acknowledgment setRoom/setState handlers (`createRoom`, `joinRoom`, `updateRoomRules`, `startOnlineGame`, `kickPlayer`, `addBotToRoom`, `toggleReady`, `returnToLobby`, `sendFriendInvite`, `acceptFriendInvite`, `reconnect`).
    - `shouldDiscardStaleMembership`: Evaluates stale operation revisions on returned acknowledgments and safely emits `room:leave` to the server if a stale room was acknowledged after explicit leave.
  - Preserved React updater purity without introducing artificial external duplicate state machines or separate authoritative stores outside React state.
  - Enforced strict safeguards against stale room reopening: `leaveRoom()` increments `membershipRevision.current++`, clears session keys, emits `room:leave`, and resets state. Navigation back from the join lobby also invokes `leaveRoom()` to invalidate pending in-flight acquisitions.
- **Game & Persistence Correctness (`lib/gameActions.ts`, `lib/gameRules.ts`, `lib/playerProgress.ts`, `lib/savedRound.ts`)**:
  - Corrected `wildReverseDraw4` pending draw type to `'wild4'` for proper stacking responses under No Mercy.
  - Guaranteed Mercy elimination immediately crowns the survivor when opponents are eliminated during targeted plays.
  - Guarded `wildForcedSwap` and `shuffle` against premature empty-hand victory triggers prior to hand transfer.
  - SSR safety on progress storage events and normalized recovery for roulette state.
- **Portability & Supported Test Infrastructure (`scripts/playwright-loader.mjs`, `scripts/test-multiplayer-browser.mjs`, `scripts/test-full-journey.mjs`)**:
  - Removed machine-specific hardcoded Playwright import paths from `scripts/playwright-loader.mjs`. It now relies strictly on standard package resolution and documented environment variables (`PLAYWRIGHT_PATH` or `PLAYWRIGHT_MODULE_PATH`), throwing an informative configuration error when neither is set.
  - Upgraded `scripts/test-multiplayer-browser.mjs` to use `uno.online.playerName`, verify distinct roster identities, assert initial edition and hand size, execute a full custom profile rule-change flow with DOM and deal assertions, and distinguish DOM hand rendering from wire privacy.
  - Added true focus assertion to `scripts/test-full-journey.mjs` verifying `document.activeElement` matches the opener trigger after closing Settings via Escape.

---

## Exact Verification Commands

To reproduce all checks deterministically:

```bash
# 1. Format and code quality
npm run format
npm run lint
npm run check:types

# 2. Pure game logic and audio assertions (no server needed)
npm run check:game
npm run check:audio

# 3. Multiplayer network assertion suites (start socket server on port 3001)
npm run start:socket &
npm run check:multiplayer

# 4. Production build check
npm run build

# 5. Automated Browser Verification (start Next.js on port 3004 and socket server on 3001)
npm run dev:web &
# Run Playwright tests using standard resolution or PLAYWRIGHT_PATH
PLAYWRIGHT_PATH=<path-to-playwright>/index.mjs node scripts/test-full-journey.mjs
PLAYWRIGHT_PATH=<path-to-playwright>/index.mjs node scripts/test-multiplayer-browser.mjs
```

---

## Proving Assertions & Verification Evidence

Every claim in this report is mapped directly to the automated test assertion that proves it.

### 1. Player Identity & Lobby Roster
- **Claim**: Host and Guest join with distinct identities and are reflected in the lobby.
- **Proving Assertion (`scripts/test-multiplayer-browser.mjs`)**:
  - Local storage key: `uno.online.playerName` (`HostAlice` and `GuestBob`).
  - Distinct roster text:
    `assert.match(hostRosterText, /HostAlice/)`
    `assert.match(hostRosterText, /GuestBob/)`
    `assert.match(guestRosterText, /HostAlice/)`
    `assert.match(guestRosterText, /GuestBob/)`
  - Seat count badge: `assert.equal(await hostPage.locator('.room-seats-heading').isVisible(), true)`

### 2. Initial Room Edition & Starting Hand Size
- **Claim**: The created room actually initializes with the intended edition (All Wild) and hand size (2 cards), not default assumptions.
- **Proving Assertion (`scripts/test-multiplayer-browser.mjs`)**:
  - Edition class verification:
    `assert.match(await hostPage.locator('.focused-room').getAttribute('class'), /mood-all-wild/)`
    `assert.match(await guestPage.locator('.focused-room').getAttribute('class'), /mood-all-wild/)`
  - Hand size text verification:
    `assert.match(await hostPage.locator('.room-rules-link span').textContent(), /2 cards each/)`
    `assert.match(await guestPage.locator('.room-rules-link span').textContent(), /2 cards each/)`
  - Live table deal verification:
    `assert.equal(await hostPage.locator('.hand-card').count(), 2)`
    `assert.equal(await guestPage.locator('.hand-card').count(), 2)`

### 3. Rule Change via Custom Profile
- **Claim**: Changing a rule via custom profile publishes the changed rule to both players and takes effect in the next round.
- **Proving Assertion (`scripts/test-multiplayer-browser.mjs`)**:
  - Control navigation: Opens `.room-rules-link`, clicks `.rule-profile-new`, fills profile name "Five Card Custom".
  - Rule selection: Selects `select[aria-label="Starting hand size"]`.
  - Initial value assertion: `assert.equal(initialHandSize, '7')`.
  - Value change assertion: `assert.equal(await handSizeSelect.inputValue(), '5')`.
  - Save & publish: Clicks "Save and use", closes dialogs, and asserts published label:
    `assert.match(await hostPage.locator('.room-rules-link span').textContent(), /5 cards each/)`
    `assert.match(await guestPage.locator('.room-rules-link span').textContent(), /5 cards each/)`
  - Deal verification: Deals next round and asserts hand card count:
    `assert.equal(await hostPage.locator('.hand-card').count(), 5)`
    `assert.equal(await guestPage.locator('.hand-card').count(), 5)`

### 4. DOM Hand Rendering vs. Wire Network Privacy
- **Claim**: Nonempty hand in the browser proves DOM rendering only. Wire privacy is verified at the network packet level.
- **Proving Assertions**:
  - Browser DOM rendering (`scripts/test-multiplayer-browser.mjs`):
    `assert.equal(hostCardsNewRound, 5, 'Host received exactly 5 cards (DOM rendering verified)')`
  - Network packet privacy (`scripts/check-private-network.ts`):
    - Recipient-only hands: `'hand' in player === (player.id === playerId)` proves each packet contains only its recipient's hand.
    - Stripped opponent hands: Opponents in `room.game.players` have card faces omitted.
    - Server stock isolation: `'drawPile' in game === false` proves stock identities never leave the server.
    - Outsider access rejection: Outsider sockets emitting `room:ready`, `room:set-rules`, `game:action`, `room:return-to-lobby` receive `ok: false` and `'data' in rejected === false` (no state leaked).

### 5. Keyboard Focus Restoration
- **Claim**: Closing Settings with Escape returns focus to the connected trigger element.
- **Proving Assertion (`scripts/test-full-journey.mjs`)**:
  - Dialog closure: `assert.equal(await desktop.locator('.settings-modal').isVisible(), false)`
  - Active element check:
    ```js
    const isTriggerFocused = await desktop.evaluate(() => {
      return document.activeElement === document.querySelector('.profile-menu-trigger');
    });
    assert.equal(isTriggerFocused, true, 'Focus restored to connected .profile-menu-trigger after closing Settings with Escape');
    ```

### 6. Room Membership Race Guard & Delayed Replies (Unit & Integration)
- **Claim**: Leaving a room while an operation is pending prevents delayed replies or late updates from reopening the table.
- **Helper-Level Unit Assertions (`scripts/check-multiplayer.ts`)**:
  - Exercises the pure production reconciliation functions directly:
    - Late broadcast rejection: `reconcileRoomUpdate(null, roundActiveRoom) === null`
    - Legitimate broadcast acceptance: `reconcileRoomUpdate(roundActiveRoom, roundActiveRoom) !== null`
    - Delayed ack rejection: `reconcileAcquisitionAck(staleRev, currentRev, ackRoom, null) === null`
    - Stale membership cleanup: `shouldDiscardStaleMembership(staleRev, currentRev, ackRoom, onLeave)` calls `onLeave(roomId)` and returns `true`.
- **Hook & Browser Integration Regression (`scripts/test-multiplayer-browser.mjs` Step 8)**:
  - Exact command:
    ```bash
    PLAYWRIGHT_PATH=<path-to-playwright>/index.mjs node scripts/test-multiplayer-browser.mjs
    ```
  - **Step 8 Part A (Late `room:update` broadcast after explicit leave)**:
    - Intercepts and holds live WebSocket message `42["room:update", ...]` on Guest.
    - Guest leaves the table via `brand-button` / "Leave table".
    - Dispatches held `room:update` to Guest's Socket.IO connection.
    - Asserts `reconcileRoomUpdate(prev.room, incomingRoom)` rejects the update; Guest remains on `.launch-screen` and neither `.game-page` nor `.focused-room` reopens.
  - **Step 8 Part B (Delayed acquisition reply after cancellation)**:
    - Guest enters room code and clicks "Join the room".
    - Intercepts and holds WebSocket acknowledgment packet `43...{"room": ...}` on Guest.
    - Guest clicks "Back", calling `leaveRoom()` and incrementing `membershipRevision.current++`.
    - Dispatches held join acknowledgment.
    - Asserts `reconcileAcquisitionAck` rejects the reply due to stale operation revision; Guest remains on `.launch-screen` without reopening the lobby.
  - Result: Step 8 Part A and Part B PASSED (exit code 0).
- **Mutation Verification (Defect Detection Proof)**:
  - Temporarily removed the production guard `if (!currentRoom) return null;` in `lib/roomMembership.ts` line 58.
  - Checked `npx tsx scripts/check-multiplayer.ts`: FAILED with `AssertionError [ERR_ASSERTION]: Late room:update broadcast must be rejected by reconcileRoomUpdate when outside the room`.
  - Checked `node scripts/test-multiplayer-browser.mjs`: FAILED at Step 8 Part A with `AssertionError [ERR_ASSERTION]: Late room:update broadcast did NOT reopen the table after leave: true !== false`.
  - Restored production guard: Both `scripts/check-multiplayer.ts` and `scripts/test-multiplayer-browser.mjs` PASSED with exit code 0.

### 7. Layout & Viewport Geometry
- **Claim**: 0 horizontal overflow across compact landscape phones and desktops.
- **Proving Assertion (`scripts/test-full-journey.mjs`)**:
  - 568×320 short landscape: `assert.equal(homeScrollWidth, homeClientWidth)` and `assert.equal(tableScrollWidth, tableClientWidth)`
  - 844×390 wide landscape: `assert.equal(tableScrollWidth, tableClientWidth)`
  - 390×844 phone portrait: `assert.equal(await portrait.locator('.rotate-phone').isVisible(), true)`

---

## Screenshot Artifacts Captured

Stored under `.impeccable/review/final-verification/`:
- `home-desktop.png`: 1280×720 desktop landing view.
- `settings-desktop.png`: 1280×720 modal dialog and focus presentation.
- `game-desktop-6seats.png`: 1280×720 tabletop with held hand and turn cues.
- `game-short-landscape-568.png`: 568×320 compact landscape tabletop without document scrollbars.
- `game-wide-landscape-844.png`: 844×390 modern phone landscape tabletop.
- `home-phone-portrait.png`: 390×844 phone portrait home view.
- `phone-orientation-gate.png`: 390×844 phone portrait guidance gate requesting landscape rotation.

---

## Hardware Limitations (Marked as Unverified)

In accordance with verification integrity guidelines, software assertions cannot replace physical hardware:
- **Physical Touchscreen Feel (UNVERIFIED)**: Touch-flick velocity, multi-touch friction, and physical finger ergonomics on physical touch digitizers cannot be verified in headless Chromium. Verified only via software pointer event streams and release threshold predicates (`lib/cardGestures.ts`).
- **Acoustic Speaker Fidelity & Hardware Mute (UNVERIFIED)**: Physical audio transducer frequency response, clipping, output volume, and physical device mute toggle switches cannot be verified in software. Verified only via Web Audio API context unlock states, audio graph node routing, and muted tab lifecycle checks (`scripts/check-audio.ts`).
