// Bots publish remembered UNO calls and leave genuine, difficulty-based misses catchable.
import assert from 'node:assert/strict';
import { initializeGame } from '../lib/gameSetup';
import { playBotStep } from '../lib/botSupport';
import { callOutUno } from '../lib/gameActions';
import type { Card } from '../types/card';
import type { GameState } from '../types/game';
import type { BotDifficulty } from '../types/rules';

const base = initializeGame(
  ['Bot', 'Human', 'Other'],
  {
    mustDeclareUno: true,
    allowStartingActionCard: false,
    penalizeFalseCallOut: false,
  },
  [true, false, true],
);
let pool = [
  ...base.drawPile,
  ...base.discardPile,
  ...base.players.flatMap((player) => player.hand),
];
function take(color: Card['color'], value: Card['value']): Card {
  const found = pool.find(
    (card) => card.color === color && card.value === value,
  );
  assert.ok(found);
  pool = pool.filter((card) => card.id !== found.id);
  return found;
}
const hands = [
  [take('red', '5'), take('blue', '9')],
  [take('yellow', '2'), take('yellow', '4')],
  [take('green', '2'), take('green', '4')],
];
const top = take('red', '1');
const position = (difficulty: BotDifficulty, turnCount: number): GameState => ({
  ...base,
  rules: { ...base.rules, botDifficulty: difficulty },
  turnCount,
  currentPlayerIndex: 0,
  activeColor: 'red',
  direction: 1,
  players: base.players.map((player, i) => ({
    ...player,
    hand: hands[i],
    saidUno: false,
  })),
  drawPile: pool,
  discardPile: [top],
});
const misses: Record<BotDifficulty, number> = {
  casual: 0,
  standard: 0,
  tactical: 0,
};
let missed: GameState | undefined;
for (let turn = 0; turn < 200; turn++) {
  const results = (['casual', 'standard', 'tactical'] as const).map(
    (difficulty) => {
      const input = position(difficulty, turn);
      const original = JSON.stringify(input);
      const next = playBotStep(input);
      assert.equal(
        JSON.stringify(input),
        original,
        'Bot UNO behavior stays immutable',
      );
      assert.deepEqual(
        playBotStep(input),
        next,
        'Same published state produces the same UNO choice',
      );
      assert.equal(next.players[0].hand.length, 1);
      assert.equal(next.lastAction.type, 'play');
      assert.equal(
        next.lastAction.type === 'play' && next.lastAction.declaredUno === true,
        next.players[0].saidUno,
        'Published play carries the actual declaration for voice, effects and activity',
      );
      if (!next.players[0].saidUno) {
        misses[difficulty]++;
        missed = next;
      }
      return next.players[0].saidUno;
    },
  );
  assert.ok(!results[0] || results[1]);
  assert.ok(!results[1] || results[2]);
}
assert.ok(
  misses.casual > misses.standard &&
    misses.standard > misses.tactical &&
    misses.tactical > 0,
);
assert.ok(misses.casual < 200);
assert.ok(missed);
const missedGame = missed;
const caught = callOutUno(missedGame, 2, 0); // Third seat is not the active player.
assert.equal(caught.players[0].hand.length, 3);
assert.equal(caught.currentPlayerIndex, missedGame.currentPlayerIndex);
assert.equal(caught.turnCount, missedGame.turnCount);
assert.equal(caught.lastAction.type, 'callOut');
assert.throws(
  () =>
    callOutUno(
      {
        ...missedGame,
        players: missedGame.players.map((p, i) =>
          i === 2 ? { ...p, eliminated: true } : p,
        ),
      },
      2,
      0,
    ),
  /Knocked-out/,
);
const noUno = position('casual', 0);
noUno.rules = { ...noUno.rules, mustDeclareUno: false };
assert.equal(playBotStep(noUno).players[0].saidUno, false);
for (let turn = 0; turn < 20; turn++) {
  const unattended = position('casual', turn);
  unattended.players = unattended.players.map((p, i) =>
    i === 0 ? { ...p, isBot: false } : p,
  );
  assert.equal(
    playBotStep(unattended).players[0].saidUno,
    true,
    'Human takeover keeps reliable declaration',
  );
}
console.log(
  `Bot UNO passed: published audible calls, catchable misses by difficulty (${JSON.stringify(misses)}), immutable decisions, penalties and safe human takeover.`,
);
