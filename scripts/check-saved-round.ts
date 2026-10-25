// Saved rounds recover engine state without accepting damaged device data.
import assert from 'node:assert/strict';
import { initializeGame } from '../lib/gameSetup';
import { getBotMove } from '../lib/botSupport';
import {
  drawOneCard,
  drawRequiredCards,
  passTurn,
  playCard,
} from '../lib/gameActions';
import {
  parseSavedRound,
  readSavedRound,
  resumeRound,
  saveRound,
  SAVED_ROUND_KEY,
} from '../lib/savedRound';
import { HUMAN_TURN_MS } from '../lib/turnFlow';
import type { GameState } from '../types/game';

const encode = (game: GameState) => JSON.stringify({ version: 1, game });
const initial = initializeGame(
  ['You', 'Cleo', 'Alex'],
  { allowStartingActionCard: false },
  [false, true, true],
);
const restored = parseSavedRound(encode(initial));
assert.ok(restored);
assert.deepEqual(restored, initial);
const drawn = drawOneCard(initial, initial.currentPlayerIndex);
const afterDraw = parseSavedRound(encode(drawn));
assert.ok(afterDraw);
assert.equal(
  afterDraw.drawnThisTurn,
  true,
  'A refresh cannot grant a second voluntary draw',
);
const resumed = resumeRound(afterDraw, 1000);
assert.equal(resumed.turnDeadlineAt, 1000 + HUMAN_TURN_MS);
assert.equal(
  afterDraw.turnDeadlineAt,
  undefined,
  'Resume must not mutate saved data',
);
assert.equal(resumed.turnCount, drawn.turnCount);
assert.deepEqual(resumed.players, drawn.players);
assert.deepEqual(resumed.drawPile, drawn.drawPile);
assert.equal(
  resumeRound({ ...initial, currentPlayerIndex: 1 }, 1000).turnDeadlineAt,
  null,
);

for (const raw of [
  null,
  '',
  '{',
  'null',
  '{}',
  '[]',
  JSON.stringify({ version: 2, game: initial }),
  'x'.repeat(64_001),
]) {
  assert.equal(parseSavedRound(raw), null);
}
for (const broken of [
  { ...initial, currentPlayerIndex: -1 },
  { ...initial, currentPlayerIndex: 99 },
  { ...initial, winnerId: initial.players[0].id },
  { ...initial, pendingDraw: 2, pendingDrawType: null },
  { ...initial, direction: 0 },
  { ...initial, activeColor: 'wild' },
  { ...initial, players: null },
  { ...initial, players: [null, null] },
  {
    ...initial,
    players: initial.players.map((player) => ({ ...player, isBot: true })),
  },
  { ...initial, discardPile: [] },
  { ...initial, drawPile: initial.drawPile.slice(1) },
  { ...initial, drawPile: initial.drawPile.map(() => initial.drawPile[0]) },
  { ...initial, rules: { stackDraw2: 'true' } },
])
  assert.equal(
    parseSavedRound(JSON.stringify({ version: 1, game: broken })),
    null,
  );

// Exercise saves across real transitions, special decks, recycling and bot draws.
for (let round = 0; round < 12; round++) {
  let game = initializeGame(
    ['You', 'Cleo', 'Alex', 'Sam', 'Jo', 'Taylor'],
    {
      allowDiscardAll: true,
      allowShuffleCard: true,
      stackDraw2: true,
      stackWild4: true,
      allowJumpIn: true,
    },
    [false, true, true, true, true, true],
  );
  for (let step = 0; step < 2000 && !game.winnerId; step++) {
    const copy = parseSavedRound(encode(game));
    assert.ok(copy, `Valid snapshot rejected on round ${round}, step ${step}`);
    assert.deepEqual(copy.players, game.players);
    assert.deepEqual(copy.rules, game.rules);
    const index = game.currentPlayerIndex;
    const move = getBotMove(copy, index);
    if (move.action === 'drawRequired') game = drawRequiredCards(copy, index);
    else if (move.action === 'draw') game = drawOneCard(copy, index);
    else if (move.action === 'pass') game = passTurn(copy, index);
    else game = playCard(copy, index, move.cardId, move.chosenColor);
  }
}

const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
const data = new Map<string, string>();
try {
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => data.set(key, value),
      removeItem: (key: string) => data.delete(key),
    },
  });
  saveRound(initial);
  assert.deepEqual(readSavedRound(), initial);
  saveRound({ ...initial, winnerId: initial.players[0].id });
  assert.equal(
    data.has(SAVED_ROUND_KEY),
    false,
    'Finished rounds must not be offered again',
  );
  saveRound(initial);
  saveRound(null);
  assert.equal(readSavedRound(), null, 'Explicitly leaving clears recovery');
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    get() {
      throw new Error('Blocked');
    },
  });
  assert.doesNotThrow(() => saveRound(initial));
  assert.doesNotThrow(() => saveRound(null));
  assert.equal(readSavedRound(), null);
} finally {
  if (original) Object.defineProperty(globalThis, 'localStorage', original);
  else Reflect.deleteProperty(globalThis, 'localStorage');
}
console.log(
  'Saved-round checks passed: round-trip state, drawn turns, fresh deadlines, damaged saves, special decks and blocked storage.',
);
