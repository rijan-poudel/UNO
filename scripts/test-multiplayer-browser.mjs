import assert from 'node:assert/strict';
import { getChromium } from './playwright-loader.mjs';

const baseUrl = process.env.BASE_URL ?? 'http://localhost:3004';

const chromium = await getChromium();
const browser = await chromium.launch({ headless: true });

try {
  console.log(
    '=== Starting 7-Step Isolated Multi-Player Journey Verification ===',
  );

  // Create two isolated browser contexts (isolated player identities & session storages)
  const hostContext = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });
  const guestContext = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });

  const hostPage = await hostContext.newPage();
  const guestPage = await guestContext.newPage();

  // Configure fast round (startingHandSize: 2, all_wild) in host rules so round completes deterministically
  await hostPage.addInitScript(() => {
    window.localStorage.setItem('uno.online.playerName', 'HostAlice');
    window.localStorage.setItem(
      'uno.shared.rules',
      JSON.stringify({
        gameMode: 'all_wild',
        botDifficulty: 'standard',
        startingHandSize: 2,
        stackDraw2: false,
        stackWild4: false,
        allowWild4OnDraw2: false,
        allowDoublePlaySameNumber: false,
        allowDoublePlayExactMatchOnly: false,
        allowJumpIn: false,
        sevenZero: false,
        penalizeFalseCallOut: false,
        reverseActsAsSkipInTwoPlayer: true,
        mustDeclareUno: true,
        drawUntilPlayable: false,
        allowStartingActionCard: false,
        maxPlayers: 6,
        allowDiscardAll: false,
        allowShuffleCard: false,
        canFinishWithActionCard: true,
        missedUnoDrawPenalty: 2,
        eliminationHandLimit: 0,
      }),
    );
    window.localStorage.setItem('uno.shared.rules.version', '3');
  });

  await guestPage.addInitScript(() => {
    window.localStorage.setItem('uno.online.playerName', 'GuestBob');

    const OriginalWebSocket = window.WebSocket;
    window.__unoSocketHarness = {
      holdRoomUpdates: false,
      heldRoomUpdates: [],
      holdJoinAck: false,
      heldJoinAcks: [],
      deliverHeldRoomUpdates() {
        const callbacks = this.heldRoomUpdates.slice();
        this.heldRoomUpdates = [];
        for (const cb of callbacks) cb();
      },
      deliverHeldJoinAcks() {
        const callbacks = this.heldJoinAcks.slice();
        this.heldJoinAcks = [];
        for (const cb of callbacks) cb();
      },
    };

    class InterceptedWebSocket extends OriginalWebSocket {
      #userOnMessage = null;
      get onmessage() {
        return this.#userOnMessage;
      }
      set onmessage(fn) {
        this.#userOnMessage = fn;
        super.onmessage = (event) => {
          this.#handleMessage(event, fn);
        };
      }
      addEventListener(type, listener, options) {
        if (type === 'message' && typeof listener === 'function') {
          const wrapped = (event) => {
            this.#handleMessage(event, listener);
          };
          return super.addEventListener(type, wrapped, options);
        }
        return super.addEventListener(type, listener, options);
      }
      #handleMessage(event, callback) {
        if (typeof event.data === 'string') {
          if (
            window.__unoSocketHarness.holdRoomUpdates &&
            event.data.startsWith('42["room:update"')
          ) {
            window.__unoSocketHarness.heldRoomUpdates.push(() => {
              callback.call(this, event);
            });
            return;
          }
          if (
            window.__unoSocketHarness.holdJoinAck &&
            event.data.startsWith('43') &&
            event.data.includes('"room"')
          ) {
            window.__unoSocketHarness.heldJoinAcks.push(() => {
              callback.call(this, event);
            });
            return;
          }
        }
        callback.call(this, event);
      }
    }
    window.WebSocket = InterceptedWebSocket;
  });

  // ── Step 1: Create and join a room ──────────────────────────────────────────
  console.log('Step 1: Host creates room, Guest joins via room code');
  await hostPage.goto(baseUrl);
  await hostPage.waitForLoadState('networkidle');

  await hostPage
    .getByRole('button', { name: 'Create a room', exact: true })
    .click();
  await hostPage.getByRole('button', { name: 'Create room' }).click();
  await hostPage
    .locator('.room-code-panel strong')
    .waitFor({ state: 'visible' });

  const roomCode =
    (await hostPage.locator('.room-code-panel strong').textContent())?.trim() ??
    '';
  assert.match(
    roomCode,
    /^[A-Z2-9]{6}$/,
    `Valid room code created: ${roomCode}`,
  );

  // Guest joins
  await guestPage.goto(`${baseUrl}/?room=${roomCode}`);
  await guestPage.waitForLoadState('networkidle');
  await guestPage.getByRole('button', { name: 'Join the room' }).click();
  await guestPage
    .locator('.room-code-panel strong')
    .waitFor({ state: 'visible' });

  // Behavioral assertion: both see 2 players in the lobby
  await hostPage.locator('.room-seats-heading').waitFor({ state: 'visible' });
  await guestPage.locator('.room-seats-heading').waitFor({ state: 'visible' });

  assert.equal(
    await hostPage.locator('.room-code-panel strong').textContent(),
    roomCode,
  );
  assert.equal(
    await guestPage.locator('.room-code-panel strong').textContent(),
    roomCode,
  );

  // Assert both players see distinct names in the roster
  const hostRosterText = await hostPage
    .locator('.room-seat-list')
    .textContent();
  const guestRosterText = await guestPage
    .locator('.room-seat-list')
    .textContent();
  assert.match(
    hostRosterText ?? '',
    /HostAlice/,
    'Host roster contains HostAlice',
  );
  assert.match(
    hostRosterText ?? '',
    /GuestBob/,
    'Host roster contains GuestBob',
  );
  assert.match(
    guestRosterText ?? '',
    /HostAlice/,
    'Guest roster contains HostAlice',
  );
  assert.match(
    guestRosterText ?? '',
    /GuestBob/,
    'Guest roster contains GuestBob',
  );

  // Verify the initial room actually has the intended edition and starting-hand size
  const hostLobby = hostPage.locator('.focused-room');
  await hostLobby.waitFor({ state: 'visible' });
  const hostClass = await hostLobby.getAttribute('class');
  assert.match(
    hostClass ?? '',
    /mood-all-wild/,
    'Initial room must use All Wild edition (mood-all-wild)',
  );
  const guestLobby = guestPage.locator('.focused-room');
  await guestLobby.waitFor({ state: 'visible' });
  const guestClass = await guestLobby.getAttribute('class');
  assert.match(
    guestClass ?? '',
    /mood-all-wild/,
    'Guest sees All Wild edition (mood-all-wild)',
  );

  const hostInitialRules = await hostPage
    .locator('.room-rules-link span')
    .textContent();
  assert.match(
    hostInitialRules ?? '',
    /2 cards each/i,
    'Initial room must have 2 cards each starting hand size',
  );
  const guestInitialRules = await guestPage
    .locator('.room-rules-link span')
    .textContent();
  assert.match(
    guestInitialRules ?? '',
    /2 cards each/i,
    'Guest sees 2 cards each starting hand size',
  );

  console.log(
    'Step 1 Passed: Both players successfully in room lobby with verified identities and rules.',
  );

  // ── Step 2: Complete a round ────────────────────────────────────────────────
  console.log('Step 2: Host deals, both enter live table, complete round');
  const dealButton = hostPage.getByRole('button', {
    name: /Deal everyone in/i,
  });
  await dealButton.click();

  await hostPage.locator('.game-page').waitFor({ state: 'visible' });
  await guestPage.locator('.game-page').waitFor({ state: 'visible' });

  // Assert both players have cards rendered in DOM (Note: actual recipient network privacy
  // and absence of opponent card faces is verified at the packet level in check-private-network.ts)
  assert.equal(
    await hostPage.locator('.hand-card').count(),
    2,
    'Host hand renders 2 cards in DOM matching initial startingHandSize: 2',
  );
  assert.equal(
    await guestPage.locator('.hand-card').count(),
    2,
    'Guest hand renders 2 cards in DOM matching initial startingHandSize: 2',
  );

  // Play turns until round finishes
  for (let turn = 0; turn < 15; turn++) {
    const isRoundOver = await hostPage
      .getByRole('button', { name: 'Edit table' })
      .isVisible()
      .catch(() => false);
    if (isRoundOver) break;

    const isHostTurn = await hostPage
      .locator('.hand-section.your-turn')
      .isVisible();
    const isGuestTurn = await guestPage
      .locator('.hand-section.your-turn')
      .isVisible();

    const activePage = isHostTurn ? hostPage : isGuestTurn ? guestPage : null;
    if (activePage) {
      // If UNO button ready, click it
      const unoBtn = activePage.locator('.button.uno-button.uno-ready');
      if (await unoBtn.isVisible({ timeout: 100 }).catch(() => false)) {
        await unoBtn.click().catch(() => {});
      }

      // If legal card exists, click it
      const playable = activePage.locator('button.uno-card.playable');
      if ((await playable.count()) > 0) {
        await playable
          .first()
          .click()
          .catch(() => {});
      }
    }

    await hostPage.waitForTimeout(600);
  }

  const editTableButton = hostPage.getByRole('button', { name: 'Edit table' });
  await editTableButton.waitFor({ state: 'visible', timeout: 15000 });
  assert.equal(
    await editTableButton.isVisible(),
    true,
    'Host sees Edit table button',
  );
  assert.equal(
    await guestPage.getByRole('button', { name: 'Edit table' }).isVisible(),
    false,
    'Guest does not see Edit table button',
  );

  console.log(
    'Step 2 Passed: Round completed, results visible on both screens.',
  );

  // ── Step 3: Host selects Edit table ─────────────────────────────────────────
  console.log('Step 3: Host selects Edit table');
  await editTableButton.click();

  // ── Step 4: Both players actually see the lobby ─────────────────────────────
  console.log(
    'Step 4: Behavioral assertion - BOTH players actually see the lobby',
  );
  await hostPage
    .locator('.room-code-panel strong')
    .waitFor({ state: 'visible' });
  await guestPage
    .locator('.room-code-panel strong')
    .waitFor({ state: 'visible' });

  assert.equal(
    await hostPage.locator('.room-code-panel strong').textContent(),
    roomCode,
    'Host sees lobby room code',
  );
  assert.equal(
    await guestPage.locator('.room-code-panel strong').textContent(),
    roomCode,
    'Guest sees lobby room code',
  );

  console.log(
    'Step 4 Passed: Regression fixed! Both players successfully transitioned back to the lobby.',
  );

  // ── Step 5: Change an allowed table setting ─────────────────────────────────
  console.log('Step 5: Change an allowed table setting');
  // Host opens room rules
  await hostPage.locator('.room-rules-link').click();
  await hostPage.locator('.settings-modal').waitFor({ state: 'visible' });

  // Open / create a named custom profile through the supported interface
  const createProfileBtn = hostPage.locator('.rule-profile-new');
  await createProfileBtn.waitFor({ state: 'visible' });
  await createProfileBtn.click();

  // Assert draft profile modal opened and fill profile name
  const nameInput = hostPage.locator('.profile-name-form input');
  await nameInput.waitFor({ state: 'visible' });
  await nameInput.fill('Five Card Custom');

  // Choose engine-supported rule: startingHandSize
  const handSizeSelect = hostPage.locator(
    'select[aria-label="Starting hand size"]',
  );
  await handSizeSelect.waitFor({ state: 'visible' });

  // Assert its initial value in the draft
  const initialHandSize = await handSizeSelect.inputValue();
  assert.equal(
    initialHandSize,
    '7',
    'Initial starting hand size in custom profile draft must be 7',
  );

  // Change it to 5
  await handSizeSelect.selectOption('5');
  assert.equal(
    await handSizeSelect.inputValue(),
    '5',
    'Starting hand size changed to 5',
  );

  // Save and use the profile
  const saveAndUseBtn = hostPage.getByRole('button', { name: 'Save and use' });
  await saveAndUseBtn.click();
  await hostPage
    .getByRole('dialog', { name: 'Custom profile' })
    .waitFor({ state: 'hidden' });

  // Close the settings modal (Game rules dialog)
  await hostPage.keyboard.press('Escape');
  await hostPage
    .getByRole('dialog', { name: 'Game rules' })
    .waitFor({ state: 'hidden' });

  // Assert the room publishes the changed rule to both host and guest
  const hostPublishedRules = await hostPage
    .locator('.room-rules-link span')
    .textContent();
  const guestPublishedRules = await guestPage
    .locator('.room-rules-link span')
    .textContent();
  assert.match(
    hostPublishedRules ?? '',
    /5 cards each/,
    'Host lobby must publish 5 cards each after saving profile',
  );
  assert.match(
    guestPublishedRules ?? '',
    /5 cards each/,
    'Guest lobby must publish 5 cards each after host changes rules',
  );

  console.log('Step 5 Passed: Table setting changed, saved, and published.');

  // ── Step 6: Deal again ──────────────────────────────────────────────────────
  console.log('Step 6: Deal again');
  const newDealButton = hostPage.getByRole('button', {
    name: /Deal everyone in/i,
  });
  await newDealButton.click();

  // ── Step 7: Both players enter new round with correct rules and private hands
  console.log(
    'Step 7: Both players enter new round with correct rules and private hands',
  );
  await hostPage.locator('.game-page').waitFor({ state: 'visible' });
  await guestPage.locator('.game-page').waitFor({ state: 'visible' });

  const hostCardsNewRound = await hostPage.locator('.hand-card').count();
  const guestCardsNewRound = await guestPage.locator('.hand-card').count();

  // Assert both players have hands of exactly 5 cards matching the changed rule
  assert.equal(
    hostCardsNewRound,
    5,
    'Host received exactly 5 cards as configured in custom profile (DOM rendering verified)',
  );
  assert.equal(
    guestCardsNewRound,
    5,
    'Guest received exactly 5 cards as configured in custom profile (DOM rendering verified)',
  );

  assert.equal(
    await hostPage.getByRole('button', { name: 'Edit table' }).isVisible(),
    false,
    'Results modal cleared on Host',
  );
  assert.equal(
    await guestPage.getByRole('button', { name: 'Edit table' }).isVisible(),
    false,
    'Results modal cleared on Guest',
  );

  console.log(
    'Step 7 Passed: Both players successfully entered new round with private hands.',
  );

  // ── Step 8: Production Hook Regression - Late Broadcast & Delayed Reply Guard
  console.log(
    'Step 8: Production hook regression - Late broadcast and delayed reply handling',
  );

  // Part A: Late room:update broadcast after explicit leave
  // 1. Enable holdRoomUpdates on Guest
  await guestPage.evaluate(() => {
    window.__unoSocketHarness.holdRoomUpdates = true;
  });

  // 2. Active player performs an in-game action (plays a card or draws)
  const isHostTurn = await hostPage
    .locator('.hand-section.your-turn')
    .isVisible();
  const activePage = isHostTurn ? hostPage : guestPage;
  const playable = activePage.locator('button.uno-card.playable');
  if (
    await playable
      .first()
      .isVisible({ timeout: 1000 })
      .catch(() => false)
  ) {
    await playable.first().click();
  } else {
    await activePage.locator('button.draw-pile').click();
  }
  const colorChoice = activePage.locator('.color-choice-dialog button');
  if ((await colorChoice.count()) > 0) {
    await colorChoice
      .first()
      .click()
      .catch(() => {});
  }

  // 3. Verify Guest intercepted and buffered the room:update broadcast
  await guestPage.waitForFunction(
    () => window.__unoSocketHarness.heldRoomUpdates.length > 0,
    { timeout: 5000 },
  );
  const heldUpdatesCount = await guestPage.evaluate(
    () => window.__unoSocketHarness.heldRoomUpdates.length,
  );
  assert.ok(
    heldUpdatesCount > 0,
    `Guest captured ${heldUpdatesCount} late room:update broadcast(s)`,
  );

  // 4. Guest explicitly leaves the game table
  await guestPage.locator('button[aria-label="Leave game"]').click();
  await guestPage.getByRole('button', { name: 'Leave table' }).click();
  await guestPage.locator('.game-page').waitFor({ state: 'hidden' });
  assert.equal(
    await guestPage.locator('.game-page').isVisible(),
    false,
    'Guest is outside the table after leaving',
  );

  // 5. Deliver the held late room:update broadcast
  await guestPage.evaluate(() => {
    window.__unoSocketHarness.deliverHeldRoomUpdates();
  });
  await guestPage.waitForTimeout(400);

  // 6. Assert the application remains outside the room (late broadcast rejected by reconcileRoomUpdate)
  assert.equal(
    await guestPage.locator('.game-page').isVisible(),
    false,
    'Late room:update broadcast did NOT reopen the table after leave',
  );
  assert.equal(
    await guestPage.locator('.focused-room').isVisible(),
    false,
    'Late room:update broadcast did NOT reopen the lobby after leave',
  );
  console.log(
    'Step 8 Part A Passed: Late room:update rejected after explicit leave.',
  );

  // Part B: Delayed acquisition reply arriving after membership invalidated
  // 1. Guest navigates from Home to Join a room
  await guestPage.getByRole('button', { name: 'Join a room' }).click();
  await guestPage.locator('#room-code').waitFor({ state: 'visible' });
  await guestPage.locator('#room-code').fill(roomCode);

  // 2. Enable holdJoinAck on Guest
  await guestPage.evaluate(() => {
    window.__unoSocketHarness.holdRoomUpdates = false;
    window.__unoSocketHarness.holdJoinAck = true;
  });

  // 3. Guest attempts to join the room
  await guestPage.getByRole('button', { name: 'Join the room' }).click();

  // 4. Verify the acquisition acknowledgment is captured and held
  await guestPage.waitForFunction(
    () => window.__unoSocketHarness.heldJoinAcks.length > 0,
    { timeout: 5000 },
  );
  const heldAcksCount = await guestPage.evaluate(
    () => window.__unoSocketHarness.heldJoinAcks.length,
  );
  assert.ok(
    heldAcksCount > 0,
    `Guest captured ${heldAcksCount} join acknowledgment reply`,
  );

  // 5. Invalidate membership by leaving before reply completes
  await guestPage.getByRole('button', { name: 'Back' }).click();
  await guestPage.locator('.launch-screen').waitFor({ state: 'visible' });
  assert.equal(
    await guestPage.locator('.focused-room').isVisible(),
    false,
    'Guest is outside the room after clicking Back',
  );

  // 6. Deliver the held delayed join ack
  await guestPage.evaluate(() => {
    window.__unoSocketHarness.deliverHeldJoinAcks();
  });
  await guestPage.waitForTimeout(400);

  // 7. Assert the application remains outside the room (delayed reply rejected by reconcileAcquisitionAck)
  assert.equal(
    await guestPage.locator('.focused-room').isVisible(),
    false,
    'Delayed acquisition ack did NOT reopen the room after leave',
  );
  assert.equal(
    await guestPage.locator('.game-page').isVisible(),
    false,
    'Delayed acquisition ack did NOT reopen the table after leave',
  );
  assert.equal(
    await guestPage.locator('.launch-screen').isVisible(),
    true,
    'Guest remains on the launch screen after late join ack delivered',
  );
  console.log(
    'Step 8 Part B Passed: Delayed acquisition reply rejected after leave.',
  );

  console.log('=== ALL 8 STEPS VERIFIED IN BROWSER AUTOMATION ===');
} finally {
  await browser.close();
}
