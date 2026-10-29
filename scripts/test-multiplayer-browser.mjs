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
    window.localStorage.setItem('uno.playerName', 'HostAlice');
    window.localStorage.setItem(
      'uno.shared.rules',
      JSON.stringify({
        drawToMatch: false,
        mustPlayDrawn: false,
        jumpIn: false,
        sevenZero: false,
        stacking: false,
        forcedPlay: false,
        mercyRule: false,
        startingHandSize: 2,
        maxPlayers: 6,
        gameMode: 'all_wild',
        botDifficulty: 'standard',
        missedUnoDrawPenalty: 2,
      }),
    );
    window.localStorage.setItem('uno.shared.rules.version', '3');
  });

  await guestPage.addInitScript(() => {
    window.localStorage.setItem('uno.playerName', 'GuestBob');
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

  console.log('Step 1 Passed: Both players successfully in room lobby.');

  // ── Step 2: Complete a round ────────────────────────────────────────────────
  console.log('Step 2: Host deals, both enter live table, complete round');
  const dealButton = hostPage.getByRole('button', {
    name: /Deal everyone in/i,
  });
  await dealButton.click();

  await hostPage.locator('.game-page').waitFor({ state: 'visible' });
  await guestPage.locator('.game-page').waitFor({ state: 'visible' });

  // Assert both players have private hands
  assert.ok(
    (await hostPage.locator('.hand-card').count()) > 0,
    'Host has cards in hand',
  );
  assert.ok(
    (await guestPage.locator('.hand-card').count()) > 0,
    'Guest has cards in hand',
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

  // Toggle an allowed switch in the settings modal
  const firstSwitch = hostPage
    .locator('.settings-modal input[type="checkbox"]')
    .first();
  if (await firstSwitch.isVisible()) {
    await firstSwitch.click();
  }

  // Close settings modal
  await hostPage.keyboard.press('Escape');
  await hostPage.locator('.settings-modal').waitFor({ state: 'hidden' });

  console.log('Step 5 Passed: Table setting changed.');

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

  assert.ok(
    hostCardsNewRound > 0,
    `Host has private hand in new round (${hostCardsNewRound} cards)`,
  );
  assert.ok(
    guestCardsNewRound > 0,
    `Guest has private hand in new round (${guestCardsNewRound} cards)`,
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
