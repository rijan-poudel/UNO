// Avatar recipes remain bounded, portable, and safe at the socket boundary.
import assert from 'node:assert/strict';
import {
  AVATAR_OPTIONS,
  DEFAULT_CUSTOM_AVATAR,
  customAvatarId,
  parseCustomAvatar,
  type AvatarFeature,
  type AvatarColor,
} from '../lib/avatarCustomization';
import {
  getPlayerAvatar,
  isAvatarId,
  savePlayerAvatar,
  subscribePlayerAvatar,
} from '../lib/playerAvatars';
const id = customAvatarId(DEFAULT_CUSTOM_AVATAR);
assert.deepEqual(parseCustomAvatar(id), DEFAULT_CUSTOM_AVATAR);
assert.ok(isAvatarId(id));
for (const key of Object.keys(AVATAR_OPTIONS) as AvatarFeature[]) {
  for (let value = 0; value < AVATAR_OPTIONS[key].length; value++) {
    const config = { ...DEFAULT_CUSTOM_AVATAR, [key]: value };
    assert.deepEqual(parseCustomAvatar(customAvatarId(config)), config);
  }
  assert.throws(() =>
    customAvatarId({
      ...DEFAULT_CUSTOM_AVATAR,
      [key]: AVATAR_OPTIONS[key].length,
    }),
  );
}
for (const key of [
  'skin',
  'hairColor',
  'eyeColor',
  'shirt',
  'background',
  'accessory',
] as AvatarColor[]) {
  assert.equal(
    parseCustomAvatar(
      customAvatarId({ ...DEFAULT_CUSTOM_AVATAR, [key]: '#012abc' }),
    )?.[key],
    '#012abc',
  );
  assert.throws(() =>
    customAvatarId({ ...DEFAULT_CUSTOM_AVATAR, [key]: 'url(x)' }),
  );
}
for (const value of [
  null,
  {},
  id + '-extra',
  id.replace('v1', 'v2'),
  id.replace('dca078', 'DCA078'),
  'custom-v1-' + '1'.repeat(200),
  id.replace('custom-v1-0', 'custom-v1--1'),
]) {
  assert.equal(parseCustomAvatar(value), null);
  assert.equal(isAvatarId(value), false);
}
assert.ok(isAvatarId('portrait-11'));
assert.ok(isAvatarId('initials'));
assert.doesNotThrow(() => savePlayerAvatar('initials'));
assert.doesNotThrow(() => {
  const unsubscribe = subscribePlayerAvatar(() => {});
  unsubscribe();
});
const originalStorage = Object.getOwnPropertyDescriptor(
  globalThis,
  'localStorage',
);
try {
  for (const [stored, expected] of [
    [id, 'initials'],
    ['portrait-11', 'portrait-11'],
    ['invalid', 'initials'],
  ]) {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: { getItem: () => stored },
    });
    assert.equal(
      getPlayerAvatar(),
      expected,
      'Profiles expose ready-made choices while legacy recipes remain valid',
    );
  }
} finally {
  if (originalStorage)
    Object.defineProperty(globalThis, 'localStorage', originalStorage);
  else Reflect.deleteProperty(globalThis, 'localStorage');
}
console.log(
  'Custom avatars passed: every feature, exact colors, bounded recipes, legacy portraits and malformed network input.',
);
