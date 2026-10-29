// Entry accepts shared link formats and never misidentifies unmatched custom rules.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { renderToStaticMarkup } from 'react-dom/server';
import type HomeScreenComponent from '../components/home/HomeScreen';
import { defaultRules, NO_MERCY_RULES } from '../types/rules';
import { parseRoomCode, isRoomCode } from '../lib/roomCodes';

for (const input of [
  'ab-cd23',
  ' https://cards.example/?room=abcd23 ',
  '/?room=abcd23',
  '?room=abcd23',
  'cards.example/?room=abcd23',
  '//cards.example/?room=abcd23',
]) {
  assert.equal(parseRoomCode(input), 'ABCD23');
  assert.ok(isRoomCode(parseRoomCode(input)));
}
for (const input of [
  'ABCD234',
  'ABC',
  '/?player=ABCD23',
  'cards.example/',
  'https://cards.example/?room=ABCD234',
]) {
  assert.equal(
    isRoomCode(parseRoomCode(input)),
    false,
    'Invalid input must never be silently truncated into another room',
  );
}
const require = createRequire(import.meta.url);
const cssLoader = require.extensions['.css'];
require.extensions['.css'] = () => {};
const HomeScreen: typeof HomeScreenComponent =
  require('../components/home/HomeScreen').default;
if (cssLoader) require.extensions['.css'] = cssLoader;
else delete require.extensions['.css'];
const homeProps = {
  controls: null,
  onQuickPlay() {},
  onJoin() {},
  onCreateRoom() {},
};
const classic = renderToStaticMarkup(
  <HomeScreen {...homeProps} rules={defaultRules} />,
);
assert.equal((classic.match(/aria-pressed="true"/g) ?? []).length, 1);
assert.match(classic, /aria-label="About Classic UNO"/);
for (const rules of [defaultRules, NO_MERCY_RULES]) {
  const custom = renderToStaticMarkup(
    <HomeScreen {...homeProps} rules={{ ...rules, startingHandSize: 9 }} />,
  );
  assert.doesNotMatch(
    custom,
    /aria-pressed="true"/,
    'An unmatched custom table must not select the first favorite',
  );
  assert.match(custom, /aria-label="About Custom rules"/);
}
console.log(
  'Entry passed: complete, relative and scheme-free room links; invalid-code preservation; truthful favorite selection for custom tables.',
);
