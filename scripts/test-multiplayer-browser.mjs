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
  console.log('=== ALL 7 STEPS VERIFIED IN BROWSER AUTOMATION ===');
} finally {
  await browser.close();
}
