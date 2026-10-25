// Bot levels make different legal choices without access to private information.
import assert from 'node:assert/strict';
import { getBotMove, BOT_DIFFICULTY_OPTIONS } from '../lib/botSupport';
import { initializeGame } from '../lib/gameSetup';
import { validateGameRules } from '../lib/validateGameRules';
import { RULE_PRESETS, matchesPreset } from '../lib/rulePresets';
import { toGameView, toPresentationGame } from '../lib/gameView';
import { parseSavedRound } from '../lib/savedRound';
import { canPlayCard } from '../lib/gameRules';
import {
  drawOneCard,
  drawRequiredCards,
  passTurn,
  playCard,
  declareUno,
} from '../lib/gameActions';
import type { Card } from '../types/card';
import type { GameState } from '../types/game';
import type { BotDifficulty } from '../types/rules';

const card = (
  id: string,
  color: Card['color'],
  value: Card['value'],
): Card => ({ id, color, value });
const base = initializeGame(['Bot', 'Next', 'Previous'], {
  allowStartingActionCard: false,
});
function situation(
  hand: Card[],
  difficulty: BotDifficulty = 'tactical',
  nextCount = 7,
): GameState {
  return {
    ...base,
    currentPlayerIndex: 0,
    activeColor: 'red',
    direction: 1,
    pendingDraw: 0,
    pendingDrawType: null,
    drawnThisTurn: false,
    discardPile: [card('top', 'red', '5')],
    rules: {
      ...base.rules,
      botDifficulty: difficulty,
      allowDiscardAll: true,
      allowShuffleCard: true,
    },
    players: base.players.map((player, index) => ({
      ...player,
      hand:
        index === 0
          ? hand
          : Array.from({ length: index === 1 ? nextCount : 7 }, (_, i) =>
              card(`${index}-${i}`, 'blue', '8'),
            ),
    })),
  };
}
const hand = [
  card('low', 'red', '1'),
  card('high', 'red', '9'),
  card('four', 'wild', 'wild4'),
  card('green', 'green', '8'),
];
assert.equal(getBotMove(situation(hand, 'casual'), 0).action, 'play');
assert.deepEqual(getBotMove(situation(hand, 'casual'), 0), {
  action: 'play',
  cardId: 'low',
  chosenColor: undefined,
});
assert.deepEqual(getBotMove(situation(hand, 'standard'), 0), {
  action: 'play',
  cardId: 'four',
  chosenColor: 'red',
});
assert.deepEqual(
  getBotMove(situation(hand), 0),
  { action: 'play', cardId: 'high', chosenColor: undefined },
  'Tactical saves a wild when a normal card works',
);
assert.deepEqual(
  getBotMove(situation(hand, 'tactical', 1), 0),
  { action: 'play', cardId: 'four', chosenColor: 'red' },
  'An imminent opponent changes the tactical decision',
);

const clearing = [
  card('clear', 'red', 'discardAll'),
  card('r1', 'red', '2'),
  card('r2', 'red', '3'),
];
assert.equal(
  (getBotMove(situation(clearing), 0) as { cardId: string }).cardId,
  'clear',
);
const avoidShuffle = [
  card('shuffle', 'wild', 'shuffle'),
  card('number', 'red', '4'),
];
assert.equal(
  (getBotMove(situation(avoidShuffle), 0) as { cardId: string }).cardId,
  'number',
);
const colorRun = [
  card('red', 'red', '9'),
  card('green-five', 'green', '5'),
  card('green-two', 'green', '2'),
  card('green-three', 'green', '3'),
  card('green-four', 'green', '4'),
];
assert.equal(
  (getBotMove(situation(colorRun), 0) as { cardId: string }).cardId,
  'green-five',
);
assert.equal(validateGameRules({}).botDifficulty, 'standard');
for (const invalid of [null, false, 3, 'expert', {}, ['tactical']]) {
  assert.throws(
    () => validateGameRules({ botDifficulty: invalid }),
    /Bot challenge/,
  );
}

for (const { value: difficulty } of BOT_DIFFICULTY_OPTIONS) {
  for (const preset of RULE_PRESETS) {
    assert.ok(
      matchesPreset(
        { ...preset.rules, botDifficulty: difficulty },
        preset.rules,
      ),
    );
    for (let round = 0; round < 3; round++) {
      let game = initializeGame(
        ['One', 'Two', 'Three', 'Four', 'Five', 'Six'],
        { ...preset.rules, botDifficulty: difficulty },
        Array(6).fill(true),
      );
      const saved = parseSavedRound(
        JSON.stringify({
          version: 1,
          game: {
            ...game,
            players: game.players.map((player, i) => ({
              ...player,
              isBot: i !== 0,
            })),
          },
        }),
      );
      assert.equal(
        saved?.rules.botDifficulty,
        difficulty,
        'Resume retains the original challenge',
      );
      const count =
        game.drawPile.length +
        game.discardPile.length +
        game.players.flatMap((player) => player.hand).length;
      for (let step = 0; step < 3000 && !game.winnerId; step++) {
        const index = game.currentPlayerIndex;
        const snapshot = JSON.stringify(game);
        const publicView = toPresentationGame(
          toGameView(game, game.players[index].id),
        );
        assert.ok(publicView);
        const move = getBotMove(game, index);
        assert.deepEqual(
          move,
          getBotMove(publicView, index),
          `${difficulty} cannot inspect secret hands or stock`,
        );
        assert.equal(
          JSON.stringify(game),
          snapshot,
          'Choosing a move does not mutate the table',
        );
        if (move.action === 'play') {
          const choice = game.players[index].hand.find(
            (entry) => entry.id === move.cardId,
          );
          assert.ok(choice && canPlayCard(choice, game, index));
          game = playCard(game, index, move.cardId, move.chosenColor);
        } else if (move.action === 'drawRequired')
          game = drawRequiredCards(game, index);
        else if (move.action === 'pass') game = passTurn(game, index);
        else game = drawOneCard(game, index);
        if (!game.winnerId && game.players[index].hand.length === 1)
          game = declareUno(game, index);
        assert.equal(
          game.drawPile.length +
            game.discardPile.length +
            game.players.flatMap((player) => player.hand).length,
          count,
        );
      }
      assert.ok(game.winnerId, `${difficulty} ${preset.id} completes a round`);
    }
  }
}
console.log(
  'Bot challenge passed: distinct decisions, no hidden-card advantage, validation, presets, saved rounds and 27 completed six-seat rounds.',
);
