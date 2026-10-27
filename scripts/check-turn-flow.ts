// Automatic outcomes share one immutable rule path for local and online play.
import assert from 'node:assert/strict';
import { initializeGame } from '../lib/gameSetup';
import { drawOneCard } from '../lib/gameActions';
import {
  expireTurn,
  hasForcedPenalty,
  withTurnDeadline,
  HUMAN_TURN_MS,
  AUTO_PLAY_TURN_MS,
  BOT_TURN_MS,
  resumePlayerControl,
} from '../lib/turnFlow';
import { getTableMood } from '../lib/rulePresets';
import { DEFAULT_TABLE_RULES } from '../lib/rulePreferences';
import type { GameState } from '../types/game';
const dealt = initializeGame(
  ['You', 'Friend', 'Bot'],
  { ...DEFAULT_TABLE_RULES, allowStartingActionCard: false },
  [false, false, true],
);
const base: GameState = {
  ...dealt,
  activeColor: 'red',
  discardPile: [{ id: 'red-five', color: 'red', value: '5' }],
  drawPile: [{ id: 'blue-nine', color: 'blue', value: '9' }],
  players: dealt.players.map((player, index) =>
    index === 0
      ? {
          ...player,
          hand: [
            { id: 'red-seven', color: 'red', value: '7' },
            { id: 'blue-eight', color: 'blue', value: '8' },
          ],
        }
      : player,
  ),
};
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
const original = JSON.stringify(clock);
const timedOut = expireTurn(clock, 31_000);
assert.equal(timedOut.players[0].hand.length, clock.players[0].hand.length - 1);
assert.equal(timedOut.currentPlayerIndex, 1);
assert.equal(
  timedOut.lastAction.type,
  'play',
  'A missed deadline plays a legal card instead of imposing a draw',
);
assert.equal(timedOut.players[0].saidUno, true, 'The substitute calls UNO');
assert.equal(timedOut.players[0].isBot, false, 'The human keeps their seat');
assert.deepEqual(timedOut.autoPlayPlayerIds, ['player_0']);
assert.equal(JSON.stringify(clock), original, 'Timeouts never mutate input');
assert.equal(
  expireTurn(drawn).players[0].hand.length,
  drawn.players[0].hand.length,
  'After drawing an unplayable card, the substitute passes instead of playing an older card',
);
assert.equal(
  clock.players[0].hand.length,
  base.players[0].hand.length,
  'Automatic outcomes do not mutate input',
);
assert.equal(withTurnDeadline(clock, timedOut, 32_000).turnDeadlineAt, 62_000);
const unattended = withTurnDeadline(
  timedOut,
  {
    ...timedOut,
    currentPlayerIndex: 0,
    turnCount: timedOut.turnCount + 1,
  },
  40_000,
);
assert.equal(unattended.turnDeadlineAt, 40_000 + AUTO_PLAY_TURN_MS);
assert.equal(
  withTurnDeadline(
    unattended,
    { ...unattended, lastAction: { type: 'declareUno', playerId: 'player_1' } },
    41_000,
  ).turnDeadlineAt,
  unattended.turnDeadlineAt,
  'Room metadata cannot restart the shorter clock',
);
const returned = resumePlayerControl(unattended, 'player_0', 45_000);
assert.deepEqual(returned.autoPlayPlayerIds, []);
assert.equal(returned.turnDeadlineAt, 45_000 + HUMAN_TURN_MS);
assert.deepEqual(returned.players, unattended.players);
assert.equal(
  resumePlayerControl(returned, 'player_0', 46_000),
  returned,
  'Further activity cannot extend a human deadline',
);
assert.equal(
  resumePlayerControl(timedOut, 'player_0', 45_000).turnDeadlineAt,
  timedOut.turnDeadlineAt,
  'Returning never extends another seat’s turn',
);
assert.deepEqual(
  resumePlayerControl(
    { ...unattended, autoPlayPlayerIds: ['player_0', 'player_1'] },
    'player_1',
  ).autoPlayPlayerIds,
  ['player_0'],
  'Each unattended seat is tracked independently',
);

const blocked: GameState = {
  ...clock,
  players: clock.players.map((player, index) =>
    index === 0
      ? {
          ...player,
          hand: [
            { id: 'blue-seven', color: 'blue', value: '7' },
            { id: 'green-eight', color: 'green', value: '8' },
          ],
        }
      : player,
  ),
};
const autoDraw = expireTurn(blocked, 31_000);
assert.equal(autoDraw.lastAction.type, 'draw');
assert.equal(autoDraw.turnCount, blocked.turnCount);
assert.equal(autoDraw.turnDeadlineAt, 31_000 + BOT_TURN_MS);
assert.equal(
  withTurnDeadline(blocked, autoDraw, 31_000).turnDeadlineAt,
  autoDraw.turnDeadlineAt,
);
const autoPass = expireTurn(autoDraw, 31_000 + BOT_TURN_MS);
assert.equal(autoPass.lastAction.type, 'pass');
assert.equal(
  autoPass.currentPlayerIndex,
  1,
  'An unplayable draw finishes after normal bot pacing',
);
const playableDraw = expireTurn(
  { ...blocked, drawPile: [{ id: 'red-nine', color: 'red', value: '9' }] },
  31_000,
);
const autoPlayDraw = expireTurn(playableDraw, 31_000 + BOT_TURN_MS);
assert.equal(autoPlayDraw.lastAction.type, 'play');
assert.equal(
  autoPlayDraw.currentPlayerIndex,
  1,
  'The substitute plays a playable draw',
);
const wild = expireTurn({
  ...blocked,
  players: blocked.players.map((player, index) =>
    index === 0
      ? {
          ...player,
          hand: [...player.hand, { id: 'wild', color: 'wild', value: 'wild' }],
        }
      : player,
  ),
});
assert.equal(wild.lastAction.type, 'play');
assert.equal(
  wild.activeColor,
  'green',
  'Wild choices use the bot’s preferred color',
);
const penalty: GameState = {
  ...clock,
  drawPile: dealt.drawPile,
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
  rules: { ...penalty.rules, stackDraw2: true },
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
  expireTurn(stack).pendingDraw,
  8,
  'The substitute stacks a legal draw card',
);
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
