// Automatic outcomes share one immutable rule path for local and online play.
import assert from 'node:assert/strict';
import { initializeGame } from '../lib/gameSetup';
import { drawOneCard } from '../lib/gameActions';
import {
  expireTurn,
  hasForcedPenalty,
  withTurnDeadline,
  HUMAN_TURN_MS,
} from '../lib/turnFlow';
import { getTableMood } from '../lib/rulePresets';
import { DEFAULT_TABLE_RULES } from '../lib/rulePreferences';
import type { GameState } from '../types/game';
const base = initializeGame(
  ['You', 'Friend', 'Bot'],
  { ...DEFAULT_TABLE_RULES, allowStartingActionCard: false },
  [false, false, true],
);
const clock = withTurnDeadline(null, base, 1000);
assert.equal(clock.turnDeadlineAt, 1000 + HUMAN_TURN_MS);
const drawn = drawOneCard(clock, 0);
assert.equal(
  withTurnDeadline(clock, drawn, 6000).turnDeadlineAt,
  clock.turnDeadlineAt,
  'Drawing does not buy another turn',
);
assert.equal(
  withTurnDeadline(
    clock,
    { ...clock, lastAction: { type: 'declareUno', playerId: 'player_0' } },
    9000,
  ).turnDeadlineAt,
  clock.turnDeadlineAt,
  'Metadata preserves the deadline',
);
const timedOut = expireTurn(clock);
assert.equal(timedOut.players[0].hand.length, clock.players[0].hand.length + 1);
assert.equal(timedOut.currentPlayerIndex, 1);
assert.equal(
  timedOut.lastAction.type,
  'draw',
  'A timeout still presents the actual draw',
);
assert.equal(
  expireTurn(drawn).players[0].hand.length,
  drawn.players[0].hand.length,
  'An already drawn turn only passes',
);
assert.equal(
  clock.players[0].hand.length,
  base.players[0].hand.length,
  'Automatic outcomes do not mutate input',
);
assert.equal(withTurnDeadline(clock, timedOut, 32_000).turnDeadlineAt, 62_000);
const penalty: GameState = {
  ...clock,
  pendingDraw: 6,
  pendingDrawType: 'draw2',
  players: clock.players.map((player, index) =>
    index === 0
      ? { ...player, hand: [{ id: 'red-seven', color: 'red', value: '7' }] }
      : player,
  ),
};
assert.equal(hasForcedPenalty(penalty), true);
assert.equal(
  expireTurn(penalty).players[0].hand.length,
  7,
  'All six penalty cards arrive together',
);
const stack: GameState = {
  ...penalty,
  players: penalty.players.map((player, index) =>
    index === 0
      ? {
          ...player,
          hand: [
            ...player.hand,
            { id: 'blue-draw2', color: 'blue', value: 'draw2' },
          ],
        }
      : player,
  ),
};
assert.equal(hasForcedPenalty(stack), false, 'A legal stack keeps the choice');
assert.equal(
  hasForcedPenalty({ ...stack, rules: { ...stack.rules, stackDraw2: false } }),
  true,
);
assert.equal(
  withTurnDeadline(clock, { ...clock, currentPlayerIndex: 2 }, 5000)
    .turnDeadlineAt,
  null,
  'Bots have paced actions instead of a pretend countdown',
);
assert.equal(
  withTurnDeadline(clock, { ...clock, winnerId: 'player_0' }, 5000)
    .turnDeadlineAt,
  null,
);
assert.equal(
  withTurnDeadline(clock, { ...base, turnDeadlineAt: undefined }, 8000)
    .turnDeadlineAt,
  38_000,
  'A new deal gets a new deadline',
);
assert.equal(getTableMood({ stackDraw2: true }), 'stack');
assert.equal(getTableMood({ allowJumpIn: true }), 'wild');
assert.equal(getTableMood({}), 'classic');
console.log('Turn flow checks passed');
