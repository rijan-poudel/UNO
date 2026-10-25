// Private transport preserves local decisions without leaking the other hands.
import assert from 'node:assert/strict';
import { initializeGame } from '../lib/gameSetup';
import { toGameView, toPresentationGame } from '../lib/gameView';
import { getPlayableCards } from '../lib/gameRules';
import { hasCardLayoutChanged } from '../lib/cardMotion';
import { getBotMove } from '../lib/botSupport';
import {
  drawOneCard,
  drawRequiredCards,
  passTurn,
  playCard,
} from '../lib/gameActions';

for (let round = 0; round < 12; round++) {
  let game = initializeGame(['You', 'Cleo', 'Jo', 'Alex', 'Lou', 'Sam'], {
    allowStartingActionCard: false,
    allowDiscardAll: true,
    allowShuffleCard: true,
    stackDraw2: true,
    stackWild4: true,
    allowJumpIn: true,
  });
  for (let step = 0; step < 1000 && !game.winnerId; step++) {
    const index = game.currentPlayerIndex;
    const actor = game.players[index];
    const before = JSON.stringify(game);
    const wire = JSON.parse(JSON.stringify(toGameView(game, actor.id)));
    assert.equal('drawPile' in wire, false);
    assert.equal(wire.drawPileCount, game.drawPile.length);
    for (const player of wire.players) {
      assert.equal(
        player.handCount,
        game.players.find((entry) => entry.id === player.id)?.hand.length,
      );
      assert.equal('hand' in player, player.id === actor.id);
    }
    const table = toPresentationGame(wire);
    assert.ok(table);
    assert.deepEqual(table.players[index].hand, actor.hand);
    assert.deepEqual(
      getPlayableCards(actor.hand, table, index),
      getPlayableCards(actor.hand, game, index),
    );
    const repeated = toPresentationGame(toGameView(game, actor.id));
    assert.ok(repeated);
    assert.equal(
      hasCardLayoutChanged(table, repeated),
      false,
      'Identical views must not interrupt motion',
    );
    assert.equal(JSON.stringify(game), before);
    const move = getBotMove(table, index);
    if (move.action === 'drawRequired') game = drawRequiredCards(game, index);
    else if (move.action === 'draw') game = drawOneCard(game, index);
    else if (move.action === 'pass') game = passTurn(game, index);
    else game = playCard(game, index, move.cardId, move.chosenColor);
  }
  const stranger = toGameView(game, 'not-a-player');
  assert.ok(stranger.players.every((player) => !('hand' in player)));
  assert.equal(
    toPresentationGame(game),
    game,
    'Frontend tolerates legacy servers during deployment',
  );
}
assert.equal(toPresentationGame(null), null);
console.log(
  'Private game views passed: only your hand, no stock faces, engine parity, stable motion and legacy deployment compatibility.',
);
