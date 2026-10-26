// Large hands must scroll without shrinking faces or losing exposed tap strips.
import assert from 'node:assert/strict';
import {
  getHandOverlap,
  getHandCropMargin,
  getHandFan,
} from '../lib/handLayout';
import { isPhonePortraitPanel } from '../hooks/usePhonePortrait';
for (const width of [64, 77, 110, 127]) {
  for (const count of [1, 2, 7, 20, 30, 100]) {
    for (const available of [280, 420, 740, 1200]) {
      const overlap = getHandOverlap(available, count, width);
      const exposed = width + overlap;
      const needed = width + (count - 1) * exposed;
      assert.ok(Number.isFinite(overlap));
      assert.ok(exposed >= Math.min(width, Math.max(44, width * 0.4)) - 0.1);
      if (width + (count - 1) * Math.max(44, width * 0.4) <= available) {
        assert.ok(needed <= available + count * 0.1);
      }
      if (count >= 20 && available === 280)
        assert.ok(
          needed > available,
          'An unreadable hand must scroll instead of shrinking',
        );
    }
  }
}
assert.equal(getHandOverlap(500, 1, 100), 0);
assert.equal(getHandOverlap(Number.NaN, 7, 100), 0);
assert.equal(isPhonePortraitPanel(390, 844), true);
assert.equal(isPhonePortraitPanel(844, 390), false);
assert.equal(
  isPhonePortraitPanel(540, 720),
  true,
  'A portrait Duo panel keeps the rotate gate',
);
assert.equal(
  isPhonePortraitPanel(720, 540),
  false,
  'A landscape panel can play',
);
assert.equal(
  isPhonePortraitPanel(768, 1024),
  false,
  'A full-size upright tablet remains usable',
);
console.log(
  'Hand layout passed: readable strips, bounded overlap, large-hand scrolling and phone/foldable orientation.',
);

assert.deepEqual(getHandFan(0, 1), { angle: 0, drop: 0 });
assert.equal(getHandFan(0, 7).angle, -getHandFan(6, 7).angle);
assert.equal(getHandFan(0, 7).drop, getHandFan(6, 7).drop);
assert.equal(getHandCropMargin(1, 82, 122, 0.45, 0.5), 56.5);
assert.equal(getHandCropMargin(7, 82, 122, 0, 0), 56.5);
assert.ok(
  getHandCropMargin(7, 82, 122, 0.45, 0.5) < 56.5,
  'The fan corners must be accounted for before cropping',
);
assert.equal(getHandCropMargin(0, 82, 122, 0.45, 0.5), 0);
assert.equal(getHandCropMargin(7, Number.NaN, 122, 0.45, 0.5), 0);
console.log(
  'Quarter-crop checks passed: shared fan, symmetric corners, bounded crop and invalid dimensions.',
);
