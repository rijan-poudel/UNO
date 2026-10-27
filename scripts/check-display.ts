import assert from 'node:assert/strict';
import {
  getReducedMotionSetting,
  setReducedMotionSetting,
  subscribeDisplaySettings,
  REDUCED_MOTION_KEY,
} from '../lib/displaySettings';
const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
const originalStorage = Object.getOwnPropertyDescriptor(
  globalThis,
  'localStorage',
);
const stored = new Map<string, string>();
try {
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: new EventTarget(),
  });
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => stored.get(key) ?? null,
      setItem: (key: string, value: string) => stored.set(key, value),
    },
  });
  let changes = 0;
  const stop = subscribeDisplaySettings(() => changes++);
  assert.equal(getReducedMotionSetting(), false);
  setReducedMotionSetting(true);
  assert.equal(getReducedMotionSetting(), true);
  assert.equal(changes, 1);
  stored.set(REDUCED_MOTION_KEY, '{broken');
  assert.equal(getReducedMotionSetting(), false);
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    get() {
      throw new Error('Blocked');
    },
  });
  setReducedMotionSetting(true);
  assert.equal(getReducedMotionSetting(), true);
  assert.equal(changes, 2);
  stop();
  setReducedMotionSetting(false);
} finally {
  if (originalWindow)
    Object.defineProperty(globalThis, 'window', originalWindow);
  else Reflect.deleteProperty(globalThis, 'window');
  if (originalStorage)
    Object.defineProperty(globalThis, 'localStorage', originalStorage);
  else Reflect.deleteProperty(globalThis, 'localStorage');
}
console.log(
  'Display preferences passed: motion, persistence, malformed values and blocked storage.',
);
