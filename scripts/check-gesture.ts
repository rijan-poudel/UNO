// Keep tap/scroll/drag thresholds honest without a browser or test framework.
import assert from 'node:assert/strict';
import { canReleaseCard } from '../lib/cardGesture';
assert.equal(canReleaseCard(8, -90), true);
assert.equal(canReleaseCard(2, -66), true);
assert.equal(canReleaseCard(0, -65), false);
assert.equal(canReleaseCard(0, -20), false);
assert.equal(canReleaseCard(110, -70), false);
assert.equal(canReleaseCard(0, 90), false);
assert.equal(canReleaseCard(0, -45), false);
assert.equal(canReleaseCard(NaN, -90), false);
console.log(
  'Gesture checks passed: upward release, scrolling, small lifts and invalid input.',
);
