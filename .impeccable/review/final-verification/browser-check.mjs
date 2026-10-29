import { chromium } from '/Users/rizx/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import path from 'node:path';

const outDir = '/Users/rizx/projects/UNO/.impeccable/review/final-verification';
const browser = await chromium.launch({ headless: true });

try {
  console.log('--- 1. Desktop 1280x720 ---');
  const desktop = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await desktop.goto('http://localhost:3004');
  await desktop.waitForLoadState('networkidle');
  await desktop.screenshot({ path: path.join(outDir, 'home-desktop.png') });

  // Open settings
  await desktop.locator('.profile-menu-trigger').click();
  await desktop.getByRole('button', { name: /Edit profile/i }).click();
  await desktop.locator('.settings-modal').waitFor({ state: 'visible' });
  await desktop.screenshot({ path: path.join(outDir, 'settings-desktop.png') });
  await desktop.keyboard.press('Escape');
  await desktop.locator('.settings-modal').waitFor({ state: 'hidden' });

  // Start match
  await desktop.getByRole('button', { name: 'Play', exact: true }).click();
  await desktop.locator('.game-page').waitFor({ state: 'visible' });
  await desktop.screenshot({ path: path.join(outDir, 'game-desktop-6seats.png') });
  await desktop.close();

  console.log('--- 2. Short Landscape 568x320 ---');
  const shortPhone = await browser.newPage({ viewport: { width: 568, height: 320 } });
  await shortPhone.goto('http://localhost:3004');
  await shortPhone.waitForLoadState('networkidle');

  // Verify document bounds
  let docW = await shortPhone.evaluate(() => document.documentElement.scrollWidth);
  let clientW = await shortPhone.evaluate(() => document.documentElement.clientWidth);
  assert.equal(docW, clientW, 'No document overflow on Home 568x320');

  // Play
  const shortPlay = shortPhone.getByRole('button', { name: 'Play', exact: true }).or(shortPhone.getByRole('button', { name: /Resume/i }));
  await shortPlay.first().click();
  await shortPhone.locator('.game-page').waitFor({ state: 'visible' });

  docW = await shortPhone.evaluate(() => document.documentElement.scrollWidth);
  clientW = await shortPhone.evaluate(() => document.documentElement.clientWidth);
  assert.equal(docW, clientW, 'No document overflow on Table 568x320');
  await shortPhone.screenshot({ path: path.join(outDir, 'game-short-landscape-568.png') });
  await shortPhone.close();

  console.log('--- 3. Wide Landscape 844x390 ---');
  const widePhone = await browser.newPage({ viewport: { width: 844, height: 390 } });
  await widePhone.goto('http://localhost:3004');
  await widePhone.waitForLoadState('networkidle');

  const widePlay = widePhone.getByRole('button', { name: 'Play', exact: true }).or(widePhone.getByRole('button', { name: /Resume/i }));
  await widePlay.first().click();
  await widePhone.locator('.game-page').waitFor({ state: 'visible' });

  docW = await widePhone.evaluate(() => document.documentElement.scrollWidth);
  clientW = await widePhone.evaluate(() => document.documentElement.clientWidth);
  assert.equal(docW, clientW, 'No document overflow on Table 844x390');
  await widePhone.screenshot({ path: path.join(outDir, 'game-wide-landscape-844.png') });
  await widePhone.close();

  console.log('--- 4. Portrait Phone 390x844 ---');
  const portraitPhone = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await portraitPhone.goto('http://localhost:3004');
  await portraitPhone.waitForLoadState('networkidle');
  await portraitPhone.screenshot({ path: path.join(outDir, 'home-phone-portrait.png') });

  const portPlay = portraitPhone.getByRole('button', { name: 'Play', exact: true }).or(portraitPhone.getByRole('button', { name: /Resume/i }));
  await portPlay.first().click();
  await portraitPhone.locator('.rotate-phone').waitFor({ state: 'visible' });
  await portraitPhone.screenshot({ path: path.join(outDir, 'phone-orientation-gate.png') });
  await portraitPhone.close();

  console.log('All screenshots captured and viewport bounds asserted!');
} finally {
  await browser.close();
}
