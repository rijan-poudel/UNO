// Activity copy must describe public game actions without internal card values.
import assert from 'node:assert/strict';
import { describeGameAction } from '../lib/gameActivity';
import type { LastAction } from '../types/game';

const players = [
  { id: 'a', name: 'You' },
  { id: 'b', name: 'Cleo' },
];
const describe = (lastAction: LastAction) =>
  describeGameAction({ players, lastAction });
assert.equal(
  describe({ type: 'mercyElimination', playerId: 'b' }),
  'Cleo was knocked out by the Mercy Rule.',
);
assert.equal(
  describe({
    type: 'play',
    playerId: 'a',
    card: { id: 'swap', color: 'wild', value: 'wildForcedSwap' },
    targetId: 'b',
  }),
  'You played Wild forced swap · swapped with Cleo',
);
const pair = describe({
  type: 'play',
  playerId: 'a',
  card: { id: 'blue', color: 'blue', value: '5' },
  playedCards: [
    { id: 'red', color: 'red', value: '5' },
    { id: 'blue', color: 'blue', value: '5' },
  ],
  declaredUno: true,
});
assert.equal(pair, 'You called UNO and played red 5 and blue 5');
assert.equal(
  describe({ type: 'callOut', callerId: 'a', targetId: 'b', penalty: 1 }),
  'You caught Cleo · +1 card',
);
assert.equal(
  describe({ type: 'draw', playerId: 'missing', count: 2 }),
  'A player drew 2 cards',
);
console.log('Readable shared game activity passed.');
