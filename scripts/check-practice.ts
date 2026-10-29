// Practice uses legal conserved edition decks and the same immutable actions as real play.
import assert from 'node:assert/strict';
import { createPracticeRound, PRACTICE_LESSONS } from '../lib/practiceRounds';
import { canPlayCard, getStackResponseLabel } from '../lib/gameRules';
import { playCard, chooseRouletteColor } from '../lib/gameActions';
import type { GameState } from '../types/game';

function conservation(game: GameState) {
  const cards = [
    ...game.drawPile,
    ...game.discardPile,
    ...game.players.flatMap((p) => p.hand),
    ...(game.outOfPlayPile ?? []),
  ];
  assert.equal(cards.length, game.rules.gameMode === 'no_mercy' ? 168 : 112);
  assert.equal(new Set(cards.map((c) => c.id)).size, cards.length);
}
for (const mode of ['no_mercy', 'all_wild'] as const) {
  for (const { kind } of PRACTICE_LESSONS[mode]) {
    const game = createPracticeRound(mode, kind);
    const before = JSON.stringify(game);
    conservation(game);
    assert.equal(game.turnDeadlineAt, null);
    if (kind === 'stack') {
      assert.equal(game.pendingDraw, 10);
      assert.equal(
        getStackResponseLabel(game),
        '+6 or higher',
        'The last card, not total penalty, controls the minimum',
      );
      assert.equal(canPlayCard(game.players[0].hand[0], game, 0), false);
      for (const card of game.players[0].hand.slice(1)) {
        const next = playCard(game, 0, card.id, 'red');
        assert.equal(next.pendingDraw, card.value === 'wildDraw6' ? 16 : 20);
        assert.equal(
          getStackResponseLabel(next),
          card.value === 'wildDraw6' ? '+6 or higher' : '+10',
        );
        conservation(next);
      }
      assert.equal(
        getStackResponseLabel({
          ...game,
          rules: { ...game.rules, stackWild4: false },
        }),
        null,
      );
    } else if (kind === 'roulette') {
      for (const [color, count] of [
        ['red', 1],
        ['blue', 3],
        ['green', 4],
        ['yellow', 5],
      ] as const) {
        const next = chooseRouletteColor(game, 0, color);
        assert.equal(
          next.players[0].hand.length - game.players[0].hand.length,
          count,
        );
        assert.equal(next.currentPlayerIndex, 1);
        assert.equal(next.pendingRoulette, undefined);
        conservation(next);
      }
    } else {
      const card = game.players[0].hand[0];
      const next = playCard(game, 0, card.id, undefined, {
        targetPlayerId: game.players[1].id,
      });
      if (kind === 'swap') {
        assert.deepEqual(next.players[0].hand, game.players[1].hand);
        assert.deepEqual(next.players[1].hand, game.players[0].hand.slice(1));
      } else if (kind === 'target') {
        assert.equal(next.players[1].hand.length, 4);
        assert.equal(
          next.currentPlayerIndex,
          1,
          'Targeted draws do not skip that player',
        );
      } else
        assert.equal(
          next.currentPlayerIndex,
          0,
          'Skip Two returns to you with three seats',
        );
      conservation(next);
    }
    assert.equal(
      JSON.stringify(game),
      before,
      'Examples never mutate their starting state',
    );
  }
}
console.log(
  'Practice passed: six real-engine examples, stack minimum vs total, targeted turns, hand ownership, roulette draws and conserved immutable decks.',
);
