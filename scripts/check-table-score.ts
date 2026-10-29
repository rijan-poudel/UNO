// Wins belong to completed round identities, not renders, packets or card IDs.
import assert from 'node:assert/strict';
import { initializeGame } from '../lib/gameSetup';
import {
  parseTableScore,
  recordTableWin,
  startTableRound,
} from '../lib/tableScore';
import { parseSavedRound } from '../lib/savedRound';
import { toGameView, toPresentationGame } from '../lib/gameView';
import {
  recordRound,
  readProgressSnapshot,
  parseProgress,
} from '../lib/playerProgress';
import { getBotMove } from '../lib/botSupport';
import {
  drawOneCard,
  drawRequiredCards,
  passTurn,
  playCard,
} from '../lib/gameActions';
import type { GameState } from '../types/game';

const deal = () =>
  initializeGame(['You', 'Cleo', 'Jules'], { allowStartingActionCard: false }, [
    false,
    true,
    true,
  ]);
const first = startTableRound(deal(), 'round-one');
assert.deepEqual(first.tableScore, {
  completedRounds: 0,
  wins: { player_0: 0, player_1: 0, player_2: 0 },
  lastRoundId: null,
});
assert.equal(recordTableWin(first), first, 'An active round is not a result');
assert.equal(
  recordTableWin({ ...first, winnerId: 'player_0' }).tableScore
    ?.completedRounds,
  0,
  'A winner with cards left is not a completed result',
);

function finish(initial: GameState): GameState {
  let game = initial;
  for (let step = 0; step < 3000 && !game.winnerId; step++) {
    const before = JSON.stringify(game);
    const index = game.currentPlayerIndex;
    const move = getBotMove(game, index);
    let next: GameState;
    if (move.action === 'play')
      next = playCard(game, index, move.cardId, move.chosenColor);
    else if (move.action === 'drawRequired')
      next = drawRequiredCards(game, index);
    else if (move.action === 'pass') next = passTurn(game, index);
    else next = drawOneCard(game, index);
    assert.equal(JSON.stringify(game), before);
    game = recordTableWin(next);
    assert.equal(
      game.roundId,
      initial.roundId,
      'Engine transitions retain identity',
    );
  }
  assert.ok(game.winnerId);
  return game;
}
const terminal = finish(first);
assert.equal(terminal.tableScore?.completedRounds, 1);
assert.equal(terminal.tableScore?.wins[terminal.winnerId ?? ''], 1);
assert.equal(
  recordTableWin(terminal),
  terminal,
  'Repeat publication is idempotent',
);
assert.equal(
  recordTableWin({ ...terminal, turnDeadlineAt: null }).tableScore
    ?.completedRounds,
  1,
);
assert.equal(
  first.tableScore?.completedRounds,
  0,
  'Old snapshots remain immutable',
);

const second = startTableRound(deal(), 'round-two', terminal.tableScore);
assert.deepEqual(second.tableScore, terminal.tableScore);
const resumed = parseSavedRound(JSON.stringify({ version: 1, game: second }));
assert.ok(resumed);
assert.equal(resumed.roundId, 'round-two');
assert.deepEqual(resumed.tableScore, terminal.tableScore);
const secondTerminal = finish(resumed);
assert.equal(secondTerminal.tableScore?.completedRounds, 2);
assert.equal(
  Object.values(secondTerminal.tableScore?.wins ?? {}).reduce(
    (a, b) => a + b,
    0,
  ),
  2,
);
const third = finish(
  startTableRound(deal(), 'round-three', secondTerminal.tableScore),
);
assert.equal(third.tableScore?.completedRounds, 3);

const rosterChanged = deal();
rosterChanged.players[0] = { ...rosterChanged.players[0], id: 'new-seat' };
assert.equal(
  startTableRound(rosterChanged, 'fresh-crew', third.tableScore).tableScore
    ?.completedRounds,
  0,
);
assert.equal(
  startTableRound(deal(), 'fresh-table').tableScore?.completedRounds,
  0,
);
assert.throws(() => startTableRound(deal(), ''), /round identity/);
for (const invalid of [
  null,
  {},
  [],
  { ...terminal.tableScore, completedRounds: -1 },
  { ...terminal.tableScore, completedRounds: '1' },
  { ...terminal.tableScore, wins: { player_0: 9 } },
  { ...terminal.tableScore, lastRoundId: null },
]) {
  assert.equal(parseTableScore(invalid, first.players), undefined);
}
const damaged = parseSavedRound(
  JSON.stringify({
    version: 1,
    game: {
      ...second,
      tableScore: { ...second.tableScore, completedRounds: 999 },
    },
  }),
);
assert.ok(damaged, 'A damaged score must not destroy a valid saved hand');
assert.equal(damaged.tableScore, undefined);
const prematurelyCounted = parseSavedRound(
  JSON.stringify({
    version: 1,
    game: {
      ...second,
      tableScore: { ...second.tableScore, lastRoundId: second.roundId },
    },
  }),
);
assert.ok(
  prematurelyCounted,
  'A contradictory score must not destroy the saved hand',
);
assert.equal(
  prematurelyCounted.tableScore,
  undefined,
  'The unfinished round cannot already be a recorded win',
);
const view = toPresentationGame(toGameView(second, 'player_0'));
assert.equal(view?.roundId, second.roundId);
assert.deepEqual(
  view?.tableScore,
  second.tableScore,
  'Public score does not depend on private hands',
);

const storageBefore = Object.getOwnPropertyDescriptor(
  globalThis,
  'localStorage',
);
const windowBefore = Object.getOwnPropertyDescriptor(globalThis, 'window');
const data = new Map<string, string>();
try {
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => data.set(key, value),
    },
  });
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { dispatchEvent() {} },
  });
  for (const unfinished of [
    { ...first, winnerId: first.players[0].id },
    { ...first, winnerId: 'missing-player' },
  ])
    recordRound(unfinished, 'player_0');
  assert.equal(
    parseProgress(readProgressSnapshot()).rounds,
    0,
    'Unfinished or invalid winners never enter device progress',
  );
  const survival = {
    ...first,
    roundId: 'survival-result',
    winnerId: first.players[0].id,
    players: first.players.map((player, index) =>
      index === 0 ? player : { ...player, eliminated: true, hand: [] },
    ),
  };
  recordRound(survival, 'player_0');
  assert.equal(
    parseProgress(readProgressSnapshot()).wins,
    1,
    'A last-survivor result counts even with cards remaining',
  );
  data.clear();
  assert.equal(
    parseProgress(
      JSON.stringify({
        rounds: 4,
        wins: 3,
        streak: 3,
        bestStreak: 1,
        recent: [],
      }),
    ).bestStreak,
    3,
    'A current streak cannot exceed the recovered best streak',
  );
  recordRound(terminal, 'player_0');
  recordRound(
    {
      ...terminal,
      players: terminal.players.map((player) => ({
        ...player,
        name: `${player.name}!`,
      })),
    },
    'player_0',
  );
  assert.equal(parseProgress(readProgressSnapshot()).rounds, 1);
  recordRound(
    { ...terminal, roundId: 'different-round-same-cards' },
    'player_0',
  );
  assert.equal(
    parseProgress(readProgressSnapshot()).rounds,
    2,
    'Different rounds cannot collide when card IDs restart',
  );
} finally {
  if (storageBefore)
    Object.defineProperty(globalThis, 'localStorage', storageBefore);
  else Reflect.deleteProperty(globalThis, 'localStorage');
  if (windowBefore) Object.defineProperty(globalThis, 'window', windowBefore);
  else Reflect.deleteProperty(globalThis, 'window');
}
console.log(
  'Table scores passed: completed wins, rematches, private views, saved recovery, crew reset, immutable state and idempotent device progress.',
);
