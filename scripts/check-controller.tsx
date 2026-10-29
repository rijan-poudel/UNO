// Exercise the real local hook through React render-phase updates, without a DOM or test framework.
import assert from 'node:assert/strict';
import { useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { useUnoGame } from '../hooks/useUnoGame';
import { initializeGame } from '../lib/gameSetup';
import { SAVED_ROUND_KEY, parseSavedRound } from '../lib/savedRound';
import type { Card } from '../types/card';
import type { GameState } from '../types/game';

const base = initializeGame(['You', 'Bot'], { startingHandSize: 2 }, [
  false,
  true,
]);
let pool = [
  ...base.drawPile,
  ...base.discardPile,
  ...base.players.flatMap((p) => p.hand),
];
function take(predicate: (card: Card) => boolean): Card {
  const card = pool.find(predicate);
  assert.ok(card);
  pool = pool.filter((entry) => entry.id !== card.id);
  return card;
}
const wild = take((card) => card.value === 'wild');
const top = take((card) => card.color === 'red' && card.value === '5');
const players = base.players.map((player, index) => ({
  ...player,
  hand:
    index === 0
      ? [wild, take((card) => card.value === 'wild')]
      : [take(() => true), take(() => true)],
}));
const fixture: GameState = {
  ...base,
  players,
  drawPile: pool,
  discardPile: [top],
  activeColor: 'red',
  currentPlayerIndex: 0,
  direction: 1,
  pendingDraw: 0,
  pendingDrawType: null,
};
const encoded = JSON.stringify({ version: 1, game: fixture });
assert.ok(
  parseSavedRound(encoded),
  'The controller fixture is a valid conserved saved round',
);

const originalStorage = Object.getOwnPropertyDescriptor(
  globalThis,
  'localStorage',
);
function Scenario({ cancel }: { cancel: boolean }) {
  const api = useUnoGame();
  const [step, setStep] = useState(0);
  const commands = cancel
    ? ['resume', 'selectUno', 'cancel', 'selectPlain', 'confirm']
    : ['resume', 'selectUno', 'confirm'];
  const command = commands[step];
  if (command) {
    if (command === 'resume') assert.equal(api.resumeGame(), true);
    else if (command === 'selectUno') {
      const options = { declareUno: true };
      api.selectCard(wild, options);
      options.declareUno = false;
    } else if (command === 'cancel') api.cancelWild();
    else if (command === 'selectPlain') api.selectCard(wild);
    else api.confirmWildColor('blue');
    setStep(step + 1);
    return null;
  }
  return (
    <output>{Buffer.from(JSON.stringify(api.game)).toString('base64')}</output>
  );
}
try {
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => (key === SAVED_ROUND_KEY ? encoded : null),
    },
  });
  for (const cancel of [false, true]) {
    const markup = renderToStaticMarkup(<Scenario cancel={cancel} />);
    const encodedResult = markup.match(
      /<output>([A-Za-z0-9+/=]+)<\/output>/,
    )?.[1];
    assert.ok(encodedResult);
    const final = JSON.parse(
      Buffer.from(encodedResult, 'base64').toString(),
    ) as GameState | null;
    assert.ok(final);
    assert.equal(final.players[0].hand.length, 1);
    assert.equal(final.activeColor, 'blue');
    assert.equal(
      final.players[0].saidUno,
      !cancel,
      'Wild color confirmation preserves only the selected play’s UNO option',
    );
    assert.equal(final.lastAction.type, 'play');
    if (final.lastAction.type === 'play')
      assert.equal(final.lastAction.declaredUno, cancel ? undefined : true);
  }
} finally {
  if (originalStorage)
    Object.defineProperty(globalThis, 'localStorage', originalStorage);
  else Reflect.deleteProperty(globalThis, 'localStorage');
}
console.log(
  'Local controller passed: real hook Wild color confirmation, copied UNO options and cancelled-play isolation.',
);
