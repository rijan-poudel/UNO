// Fresh-browser regression against the loopback fixture; no production state injection.
import { chromium } from '/Users/rizx/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const out = path.dirname(fileURLToPath(import.meta.url));
const baseline = process.argv.includes('--baseline');
const cases = baseline ? [['before-844', 844, 390, false]] : [
  ['desktop-1440', 1440, 900, false], ['user-848', 848, 765, false],
  ['phone-844', 844, 390, false], ['phone-568', 568, 320, false], ['reduced-844', 844, 390, true],
];
(async () => {
  const browser = await chromium.launch({ headless: true });
  const results = [];
  try {
    for (const [name, width, height, reduced] of cases) {
      const context = await browser.newContext({ viewport: { width, height }, isMobile: height < 460, hasTouch: height < 460, reducedMotion: reduced ? 'reduce' : 'no-preference' });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto('http://localhost:3010', { waitUntil: 'domcontentloaded' });
      await page.getByRole('button', { name: 'Join a room', exact: true }).click();
      await page.getByLabel('Your name', { exact: true }).fill('Preview');
      await page.getByLabel('Room code', { exact: true }).fill('ABC234');
      await page.getByRole('button', { name: 'Join the table', exact: true }).click();
      await page.locator('.game-page').waitFor();
      await page.evaluate(async () => {
        await document.fonts.ready;
        const image = new Image(); image.src = '/artwork/game-room-evening.webp'; await image.decode();
      });
      await page.waitForTimeout(650);
      await page.mouse.move(5, 5);
      await page.screenshot({ path: path.join(out, `${name}-rest.png`) });
      await page.evaluate(() => {
        window.motionProof = { flights: [], seats: [...document.querySelectorAll('[data-seat]')].filter(seat => seat.querySelector('.player-avatar')).map(seat => {
          const identity = seat.querySelector('.player-avatar');
          const avatar = identity.getBoundingClientRect();
          const card = seat.querySelector('.opponent-hand .uno-card');
          return { id: seat.dataset.seat, avatar: { x: avatar.x + avatar.width/2, y: avatar.y + avatar.height/2, width: identity.offsetWidth }, fanWidth: card?.offsetWidth || 0 };
        }) };
        window.motionObserver = new MutationObserver(records => records.forEach(record => record.addedNodes.forEach(node => {
          if (!(node instanceof HTMLElement) || !node.hasAttribute('data-presentation-card')) return;
          const animation = node.getAnimations()[0];
          window.motionProof.flights.push({ value: node.querySelector('.card-value')?.textContent || 'back', width: node.offsetWidth, height: node.offsetHeight, left: parseFloat(node.style.left), top: parseFloat(node.style.top), frames: animation?.effect.getKeyframes(), duration: animation?.effect.getTiming().duration, at: performance.now() });
        })));
        window.motionObserver.observe(document.body, { childList: true });
      });
      await page.getByRole('button', { name: 'Play green 2', exact: true }).click();
      if (!baseline && !reduced && height < 460) {
        await page.waitForFunction(() => [...document.querySelectorAll('[data-presentation-card]')].some(card => card.querySelector('.card-value')?.textContent === '4'));
        await page.evaluate(() => {
          const card = [...document.querySelectorAll('[data-presentation-card]')].find(card => card.querySelector('.card-value')?.textContent === '4');
          for (const animation of [...card.getAnimations(), ...document.querySelector('[data-discard-pile] .uno-card').getAnimations()]) { animation.pause(); animation.currentTime = Number(animation.effect.getTiming().duration) * .45; }
          window.motionProof.capture = { opacity: getComputedStyle(document.querySelector('[data-discard-pile] .uno-card')).opacity, animations: document.querySelector('[data-discard-pile] .uno-card').getAnimations().map(a => ({state: a.playState, frames: a.effect.getKeyframes()})) };
        });
        await page.screenshot({ path: path.join(out, `${name}-play.png`) });
        await page.waitForFunction(() => [...document.querySelectorAll('[data-presentation-card]')].some(card => card.querySelector('.card-back-mark')));
        await page.evaluate(() => {
          const card = [...document.querySelectorAll('[data-presentation-card]')].find(card => card.querySelector('.card-back-mark'));
          const animation = card.getAnimations()[0]; animation.pause(); animation.currentTime = Number(animation.effect.getTiming().duration) * .45;
        });
        await page.screenshot({ path: path.join(out, `${name}-draw.png`) });
      }
      await page.waitForTimeout(2000);
      const proof = await page.evaluate(() => {
        window.motionObserver.disconnect();
        return { ...window.motionProof, hand: document.querySelectorAll('[data-hand-card]').length, ghostsRemaining: document.querySelectorAll('[data-presentation-card]').length, viewport: [innerWidth, innerHeight], document: [document.documentElement.scrollWidth, document.documentElement.scrollHeight], discard: document.querySelector('[data-discard-pile] .card-value')?.textContent };
      });
      assert.equal(proof.hand, 2); assert.equal(proof.discard, '4'); assert.equal(proof.ghostsRemaining, 0); assert.deepEqual(proof.document, proof.viewport); assert.deepEqual(errors, []);
      const opponentPlay = proof.flights.find(f => f.value === '4');
      const opponentDraw = proof.flights.find(f => f.value === 'back');
      if (baseline || reduced) { assert.equal(opponentPlay, undefined); assert.equal(opponentDraw, undefined); }
      else {
        assert.ok(opponentPlay, `${name} opponent play visible`); assert.ok(opponentDraw, `${name} opponent draw visible`);
        for (const flight of [opponentPlay, opponentDraw]) assert.ok(flight.duration >= 190 && flight.duration <= 262);
        if (height < 460) {
          assert.ok(proof.seats.every(s => s.fanWidth === 0));
          const target = proof.seats[1].avatar;
          assert.ok(Math.abs(opponentDraw.left + opponentDraw.width/2 - target.x) <= 1);
          assert.ok(Math.abs(opponentDraw.top + opponentDraw.height/2 - target.y) <= 1);
          assert.ok(Math.abs(opponentDraw.width - target.width) <= 1);
          const matrix = /^translate\(([-.\d]+)px, ([-.\d]+)px\)/.exec(opponentPlay.frames[0].transform);
          assert.ok(Math.abs(opponentPlay.left + opponentPlay.width/2 + Number(matrix[1]) - proof.seats[0].avatar.x) <= 1);
          assert.ok(Math.abs(opponentPlay.top + opponentPlay.height/2 + Number(matrix[2]) - proof.seats[0].avatar.y) <= 1);
        }
      }
      results.push({ name, ...proof });
      await page.mouse.move(5, 5);
      await page.screenshot({ path: path.join(out, `${name}-after.png`) });
      await context.close();
      console.log(`${name}: ${proof.flights.map(f => f.value).join(', ') || 'no flights'}, cleanup and viewport passed`);
    }
    fs.writeFileSync(path.join(out, baseline ? 'before.json' : 'after.json'), JSON.stringify(results, null, 2) + '\n');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
