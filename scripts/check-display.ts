import assert from 'node:assert/strict';
import {
  getReducedMotionSetting,
  setReducedMotionSetting,
  subscribeDisplaySettings,
  REDUCED_MOTION_KEY,
  CARD_STYLE_KEY,
  getCardStyleSetting,
  setCardStyleSetting,
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
  const notifyStorage = (key: string | null) => {
    const event = new Event('storage');
    Object.defineProperty(event, 'key', { value: key });
    window.dispatchEvent(event);
  };
  assert.equal(getReducedMotionSetting(), false);
  assert.equal(getCardStyleSetting(), 'swiss');
  setReducedMotionSetting(true);
  assert.equal(getReducedMotionSetting(), true);
  assert.equal(changes, 1);
  stored.set(REDUCED_MOTION_KEY, '{broken');
  assert.equal(getReducedMotionSetting(), false);
  setCardStyleSetting('nordic');
  assert.equal(stored.get(CARD_STYLE_KEY), 'nordic');
  assert.equal(getCardStyleSetting(), 'nordic');
  assert.equal(changes, 2);
  stored.set(CARD_STYLE_KEY, '{broken');
  assert.equal(getCardStyleSetting(), 'swiss');
  stored.set(CARD_STYLE_KEY, 'nordic');
  notifyStorage(CARD_STYLE_KEY);
  assert.equal(getCardStyleSetting(), 'nordic');
  assert.equal(changes, 3);
  notifyStorage('unrelated');
  assert.equal(changes, 3);
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    get() {
      throw new Error('Blocked');
    },
  });
  assert.equal(getCardStyleSetting(), 'swiss');
  setReducedMotionSetting(true);
  assert.equal(getReducedMotionSetting(), true);
  assert.equal(changes, 4);
  setCardStyleSetting('nordic');
  assert.equal(getCardStyleSetting(), 'nordic');
  assert.equal(changes, 5);
  notifyStorage(REDUCED_MOTION_KEY);
  assert.equal(getCardStyleSetting(), 'nordic');
  assert.equal(changes, 6);
  notifyStorage(null);
  assert.equal(getCardStyleSetting(), 'swiss');
  assert.equal(getReducedMotionSetting(), false);
  assert.equal(changes, 7);
  stop();
  setReducedMotionSetting(false);
  setCardStyleSetting('swiss');
  notifyStorage(CARD_STYLE_KEY);
  assert.equal(changes, 7);
} finally {
  if (originalWindow)
    Object.defineProperty(globalThis, 'window', originalWindow);
  else Reflect.deleteProperty(globalThis, 'window');
  if (originalStorage)
    Object.defineProperty(globalThis, 'localStorage', originalStorage);
  else Reflect.deleteProperty(globalThis, 'localStorage');
}
console.log(
  'Display preferences passed: motion, card styles, persistence, malformed values, blocked storage and subscriptions.',
);
