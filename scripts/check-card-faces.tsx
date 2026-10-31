// Every engine value renders safely in shared faces, with unique SVG references.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import type UnoCardComponent from '../components/UnoCard';
import { ACTION_VALUES, NUMBER_VALUES, type Card } from '../types/card';

const require = createRequire(import.meta.url);
const originalCSS = require.extensions['.css'];
require.extensions['.css'] = () => {};
const UnoCard: typeof UnoCardComponent =
  require('../components/UnoCard').default;
if (originalCSS) require.extensions['.css'] = originalCSS;
else delete require.extensions['.css'];
const cards: Card[] = [...NUMBER_VALUES, ...ACTION_VALUES].map((value, i) => ({
  id: `face-${i}`,
  value,
  color: value.startsWith('wild') || value === 'shuffle' ? 'wild' : 'red',
}));
const markup = renderToStaticMarkup(
  <>
    {cards.map((card) => (
      <UnoCard key={card.id} card={card} onClick={() => {}} />
    ))}
  </>,
);
assert.equal((markup.match(/<button /g) ?? []).length, cards.length);
assert.equal(
  (markup.match(/data-face="(?:number|action)"/g) ?? []).length,
  cards.length,
);
assert.ok(!markup.includes('NaN') && !markup.includes('Infinity'));
for (const amount of ['+2', '+4', '+6', '+10'])
  assert.ok(markup.includes(amount));
const ids = [...markup.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
assert.equal(
  ids.length,
  new Set(ids).size,
  'Repeated cards need unique SVG masks/filters',
);
for (const match of markup.matchAll(/url\(#([^)]+)\)/g))
  assert.ok(ids.includes(match[1]), `Missing SVG definition ${match[1]}`);
for (const match of markup.matchAll(/href="(\/artwork\/cards\/[^\"]+)"/g))
  assert.ok(existsSync(`public${match[1]}`));
for (const card of cards.filter((card) => ACTION_VALUES.includes(card.value))) {
  const face = renderToStaticMarkup(<UnoCard card={card} />);
  assert.ok(face.includes('<svg'), `${card.value} needs an action graphic`);
  assert.ok(
    !face.includes('>?<'),
    'Roulette must not regress to a question mark',
  );
}
const roulette = readFileSync('public/artwork/cards/color-roulette.webp');
assert.equal(roulette.toString('ascii', 0, 4), 'RIFF');
assert.equal(roulette.toString('ascii', 8, 12), 'WEBP');
assert.ok(
  roulette.length < 1_789_066,
  'Roulette delivery should remain smaller than its source PNG',
);
assert.equal(
  JSON.parse(
    readFileSync('public/artwork/cards/color-roulette.webp.json', 'utf8'),
  ).prompt,
  readFileSync(
    'public/artwork/cards/color-roulette-recolor-prompt.txt',
    'utf8',
  ),
  'Lossless delivery retains the exact artwork provenance',
);
const back = renderToStaticMarkup(<UnoCard card={cards[0]} faceDown />);
assert.ok(back.includes('Face-down card'));
assert.ok(!back.includes('Play red 0'));
const disabled = renderToStaticMarkup(
  <UnoCard card={cards[0]} disabled onClick={() => {}} />,
);
assert.ok(disabled.includes('aria-disabled="true"'));
console.log(
  'Card faces passed: every engine value, accessible backs/buttons, draw amounts, unique SVG references and shipped artwork.',
);
