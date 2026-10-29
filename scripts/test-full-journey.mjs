import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getChromium } from './playwright-loader.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(
  __dirname,
  '../.impeccable/review/final-verification',
);
const baseUrl = process.env.BASE_URL ?? 'http://localhost:3004';

const chromium = await getChromium();
const browser = await chromium.launch({ headless: true });

try {
  console.log('--- 1. Desktop 1280x720: Home -> Settings -> Play -> Hand ---');
  const desktop = await browser.newPage({
    viewport: { width: 1280, height: 720 },
  });
  await desktop.goto(baseUrl);
  await desktop.waitForLoadState('networkidle');

  // Assert home screen elements
  const playButton = desktop
    .getByRole('button', { name: 'Play', exact: true })
    .or(desktop.getByRole('button', { name: /Resume/i }));
  await assert.doesNotReject(
    playButton.first().waitFor({ state: 'visible' }),
    'Home Play button should be visible',
  );
  await desktop.screenshot({ path: path.join(outDir, 'home-desktop.png') });

  // Open settings modal
  await desktop.locator('.profile-menu-trigger').click();
  await desktop.getByRole('button', { name: /Edit profile/i }).click();
  await desktop.locator('.settings-modal').waitFor({ state: 'visible' });
  assert.equal(
    await desktop.locator('.settings-modal').isVisible(),
    true,
    'Settings modal is visible',
  );
  await desktop.screenshot({ path: path.join(outDir, 'settings-desktop.png') });

  // Close with Escape and assert focus recovery
  await desktop.keyboard.press('Escape');
  await desktop.locator('.settings-modal').waitFor({ state: 'hidden' });
  assert.equal(
    await desktop.locator('.settings-modal').isVisible(),
    false,
    'Settings modal closed on Escape',
  );
  const isTriggerFocused = await desktop.evaluate(() => {
    return (
      document.activeElement === document.querySelector('.profile-menu-trigger')
    );
  });
  assert.equal(
    isTriggerFocused,
    true,
    'Focus restored to connected .profile-menu-trigger after closing Settings with Escape',
  );

  // Start local game
  await playButton.first().click();
  await desktop.locator('.game-page').waitFor({ state: 'visible' });
  assert.equal(
    await desktop.locator('.game-page').isVisible(),
    true,
    'Game table is visible',
  );

  // Assert held hand is present
  const handCards = desktop.locator('.hand-card');
  const cardCount = await handCards.count();
  assert.ok(cardCount > 0, `Player has cards in hand (found ${cardCount})`);
  await desktop.screenshot({
    path: path.join(outDir, 'game-desktop-6seats.png'),
  });
  await desktop.close();

  console.log('--- 2. Short Landscape 568x320: Viewport Document Bounds ---');
  const shortPhone = await browser.newPage({
    viewport: { width: 568, height: 320 },
  });
  await shortPhone.goto(baseUrl);
  await shortPhone.waitForLoadState('networkidle');

  // Assert no document horizontal overflow on Home
  let docW = await shortPhone.evaluate(
    () => document.documentElement.scrollWidth,
  );
  let clientW = await shortPhone.evaluate(
    () => document.documentElement.clientWidth,
  );
  assert.equal(docW, clientW, 'No document overflow on Home 568x320');

  // Play
  const shortPlay = shortPhone
    .getByRole('button', { name: 'Play', exact: true })
    .or(shortPhone.getByRole('button', { name: /Resume/i }));
  await shortPlay.first().click();
  await shortPhone.locator('.game-page').waitFor({ state: 'visible' });

  // Assert no document horizontal overflow on Table
  docW = await shortPhone.evaluate(() => document.documentElement.scrollWidth);
  clientW = await shortPhone.evaluate(
    () => document.documentElement.clientWidth,
  );
  assert.equal(docW, clientW, 'No document overflow on Table 568x320');
  await shortPhone.screenshot({
    path: path.join(outDir, 'game-short-landscape-568.png'),
  });
  await shortPhone.close();

  console.log('--- 3. Wide Landscape 844x390: Viewport Document Bounds ---');
  const widePhone = await browser.newPage({
    viewport: { width: 844, height: 390 },
  });
  await widePhone.goto(baseUrl);
  await widePhone.waitForLoadState('networkidle');

  const widePlay = widePhone
    .getByRole('button', { name: 'Play', exact: true })
    .or(widePhone.getByRole('button', { name: /Resume/i }));
  await widePlay.first().click();
  await widePhone.locator('.game-page').waitFor({ state: 'visible' });

  docW = await widePhone.evaluate(() => document.documentElement.scrollWidth);
  clientW = await widePhone.evaluate(
    () => document.documentElement.clientWidth,
  );
  assert.equal(docW, clientW, 'No document overflow on Table 844x390');
  await widePhone.screenshot({
    path: path.join(outDir, 'game-wide-landscape-844.png'),
  });
  await widePhone.close();

  console.log('--- 4. Portrait Phone 390x844: Orientation Guidance Gate ---');
  const portraitPhone = await browser.newPage({
    viewport: { width: 390, height: 844 },
  });
  await portraitPhone.goto(baseUrl);
  await portraitPhone.waitForLoadState('networkidle');
  await portraitPhone.screenshot({
    path: path.join(outDir, 'home-phone-portrait.png'),
  });

  const portPlay = portraitPhone
    .getByRole('button', { name: 'Play', exact: true })
    .or(portraitPhone.getByRole('button', { name: /Resume/i }));
  await portPlay.first().click();
  await portraitPhone.locator('.rotate-phone').waitFor({ state: 'visible' });
  assert.equal(
    await portraitPhone.locator('.rotate-phone').isVisible(),
    true,
    'Orientation gate is visible in portrait',
  );
  await portraitPhone.screenshot({
    path: path.join(outDir, 'phone-orientation-gate.png'),
  });
  await portraitPhone.close();

  console.log(
    'Completed test-full-journey.mjs: All behavioral assertions and screenshots verified successfully.',
  );
} finally {
  await browser.close();
}
