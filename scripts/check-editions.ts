// Edition rules need transition, recovery, and full-round coverage—not just deck totals.
import assert from 'node:assert/strict';
import type { Card, CardValue } from '../types/card';
import type { GameState } from '../types/game';
import { CLASSIC_RULES, NO_MERCY_RULES, ALL_WILD_RULES } from '../types/rules';
import { initializeGame } from '../lib/gameSetup';
import {
  playCard,
  callOutUno,
  chooseRouletteColor,
  drawOneCard,
  passTurn,
  applyMercyRule,
} from '../lib/gameActions';
import { getNextPlayerIndex } from '../lib/turns';
import { playBotStep } from '../lib/botSupport';
import { canPlayCard } from '../lib/gameRules';
import { parseSavedRound } from '../lib/savedRound';
import { toGameView } from '../lib/gameView';
import { recordTableWin, startTableRound } from '../lib/tableScore';

const card = (
  id: string,
  value: CardValue,
  color: Card['color'] = 'wild',
): Card => ({ id, value, color });
const base = initializeGame(['You', 'Bot', 'Other'], NO_MERCY_RULES, [
  false,
  true,
  true,
]);
const situation = (hand: Card[]): GameState => ({
  ...base,
  currentPlayerIndex: 0,
  activeColor: 'red',
  pendingDraw: 0,
  pendingDrawType: null,
  discardPile: [card('top', '8', 'red')],
  players: base.players.map((p, i) => (i === 0 ? { ...p, hand } : p)),
});
const seven = card('seven', '7', 'red');
let state = situation([seven, card('keep', '4', 'blue')]);
assert.throws(() => playCard(state, 0, seven.id), /Choose another/);
assert.throws(
  () =>
    playCard(state, 0, seven.id, undefined, {
      targetPlayerId: state.players[0].id,
    }),
  /Choose another/,
);
const swapped = playCard(state, 0, seven.id, undefined, {
  targetPlayerId: state.players[2].id,
});
assert.deepEqual(swapped.players[0].hand, state.players[2].hand);
assert.deepEqual(swapped.players[2].hand, [card('keep', '4', 'blue')]);

// Custom switches change behavior rather than merely changing their labels.
const pendingTwo = {
  ...state,
  pendingDraw: 2,
  pendingDrawType: 'draw2' as const,
  discardPile: [card('incoming', 'draw2', 'red')],
};
const higherDraw = card('higher', 'wildDraw6');
assert.equal(canPlayCard(higherDraw, pendingTwo, 0), true);
assert.equal(
  canPlayCard(
    higherDraw,
    { ...pendingTwo, rules: { ...pendingTwo.rules, allowWild4OnDraw2: false } },
    0,
  ),
  false,
);
const noUno = {
  ...state,
  rules: { ...state.rules, mustDeclareUno: false },
  players: state.players.map((p, i) =>
    i === 1 ? { ...p, hand: [card('last', '3', 'red')], saidUno: false } : p,
  ),
};
assert.equal(
  callOutUno(noUno, 0, 1),
  noUno,
  'Disabled UNO calls never penalize a player',
);

// With only two survivors, Reverse +4 comes back to its player.
state = situation([
  card('reverse', 'wildReverseDraw4'),
  card('keep', '4', 'blue'),
]);
state.players[1] = { ...state.players[1], eliminated: true, hand: [] };
const reversed = playCard(state, 0, 'reverse', 'blue');
assert.equal(reversed.currentPlayerIndex, 0);
assert.equal(reversed.pendingDraw, 4);
assert.equal(getNextPlayerIndex(state, -1), 2);

// Roulette belongs to the recipient and adds exactly the revealed cards.
state = situation([
  card('roulette', 'wildColorRoulette'),
  card('keep', '4', 'blue'),
]);
state.drawPile = [
  card('after', '5', 'yellow'),
  card('match', '2', 'green'),
  card('miss', 'wildDraw6'),
];
const roulette = playCard(state, 0, 'roulette');
assert.equal(roulette.pendingRoulette?.playerId, state.players[1].id);
assert.throws(() => chooseRouletteColor(roulette, 0, 'green'));
assert.throws(() => drawOneCard(roulette, 1));
const settled = chooseRouletteColor(roulette, 1, 'green');
assert.equal(settled.players[1].hand.length, state.players[1].hand.length + 2);
assert.equal(settled.currentPlayerIndex, 2);
assert.equal(settled.pendingRoulette, undefined);

// Eliminated hands are conserved, recycled on stock exhaustion, and hidden online.
state = situation([card('keep', '4', 'blue')]);
state.players[0].hand = Array.from({ length: 25 }, (_, i) =>
  card(`out${i}`, '1', 'blue'),
);
const out = applyMercyRule(state);
assert.equal(out.players[0].eliminated, true);
assert.equal(out.outOfPlayPile?.length, 25);
assert.equal(out.currentPlayerIndex, 1);
assert.equal(toGameView(out, state.players[1].id).players[0].eliminated, true);
assert.ok(!('outOfPlayPile' in toGameView(out, state.players[1].id)));
const recycled = drawOneCard(
  { ...out, drawPile: [], rules: { ...out.rules, drawUntilPlayable: false } },
  1,
);
assert.equal(recycled.players[1].hand.length, out.players[1].hand.length + 1);
assert.equal(recycled.outOfPlayPile?.length, 0);

// No Mercy cannot pass a playable drawn card; All Wild cannot play an older one.
const mercyDraw = {
  ...situation([card('keep', '3', 'green')]),
  drawPile: [card('drawn', '2', 'red')],
};
assert.throws(() => passTurn(drawOneCard(mercyDraw, 0), 0), /Play the card/);
const wild = initializeGame(['You', 'Bot'], ALL_WILD_RULES, [false, true]);
const wildDraw = drawOneCard(wild, 0);
assert.equal(canPlayCard(wildDraw.players[0].hand[0], wildDraw, 0), false);
assert.equal(canPlayCard(wildDraw.players[0].hand.at(-1)!, wildDraw, 0), true);

// Targeted draw keeps the victim's turn; a swap must honor the chosen opponent.
const targeted = card('targeted', 'wildTargetDraw2');
const targetState = {
  ...wild,
  players: wild.players.map((p, i) =>
    i === 0 ? { ...p, hand: [targeted, card('spare', 'wild')] } : p,
  ),
};
const hit = playCard(targetState, 0, targeted.id, undefined, {
  targetPlayerId: wild.players[1].id,
});
assert.equal(hit.currentPlayerIndex, 1);
assert.equal(hit.players[1].hand.length, wild.players[1].hand.length + 2);

// Playing wildForcedSwap as the last card transfers the empty hand to the target.
const swapOut = card('swap-out', 'wildForcedSwap');
const swapOutState = {
  ...wild,
  players: wild.players.map((p, i) =>
    i === 0 ? { ...p, hand: [swapOut] } : p,
  ),
};
const swappedOut = playCard(swapOutState, 0, swapOut.id, undefined, {
  targetPlayerId: wild.players[1].id,
});
assert.equal(
  swappedOut.winnerId,
  wild.players[1].id,
  'Swap recipient gets empty hand and wins',
);
assert.equal(swappedOut.players[0].hand.length, wild.players[1].hand.length);
assert.equal(swappedOut.players[1].hand.length, 0);

// Targeted draw two cannot be played to stack on a draw pool penalty.
const draw2Penalty: GameState = {
  ...wild,
  pendingDraw: 2,
  pendingDrawType: 'draw2',
  discardPile: [card('top-draw2', 'draw2')],
  players: wild.players.map((p, i) =>
    i === 0 ? { ...p, hand: [targeted, card('valid-draw2', 'draw2')] } : p,
  ),
};
assert.equal(
  canPlayCard(targeted, draw2Penalty, 0),
  false,
  'Targeted draw two cannot stack',
);

// In No Mercy, draw4 sets pendingDrawType to wild4; a draw2 cannot stack on draw4.
const draw4Card = card('color-draw4', 'draw4', 'red');
const draw2Card = card('color-draw2', 'draw2', 'red');
const noMercyState: GameState = {
  ...base,
  activeColor: 'red',
  discardPile: [card('top-number', '5', 'red')],
  players: base.players.map((p, i) =>
    i === 0
      ? { ...p, hand: [draw4Card, card('extra', '1', 'red')] }
      : i === 1
        ? { ...p, hand: [draw2Card] }
        : p,
  ),
};
const afterDraw4 = playCard(noMercyState, 0, draw4Card.id);
assert.equal(afterDraw4.pendingDraw, 4);
assert.equal(afterDraw4.pendingDrawType, 'wild4');
assert.equal(
  canPlayCard(draw2Card, afterDraw4, 1),
  false,
  'Draw 2 cannot stack on Draw 4 in No Mercy',
);

// Knocking out the last opponent with wildTargetDraw2 crowns the survivor without advancing turn.
const mercyTarget = card('mercy-targeted', 'wildTargetDraw2');
const targetKnockoutState: GameState = {
  ...wild,
  rules: { ...wild.rules, eliminationHandLimit: 25 },
  players: wild.players.map((p, i) =>
    i === 0
      ? { ...p, hand: [mercyTarget, card('spare', 'wild')] }
      : {
          ...p,
          hand: Array.from({ length: 24 }, (_, j) =>
            card(`victim-${j}`, 'wild'),
          ),
        },
  ),
};
const knockoutHit = playCard(
  targetKnockoutState,
  0,
  mercyTarget.id,
  undefined,
  {
    targetPlayerId: wild.players[1].id,
  },
);
assert.equal(
  knockoutHit.winnerId,
  wild.players[0].id,
  'Knocking out the opponent crowns the survivor',
);
assert.equal(knockoutHit.players[1].eliminated, true);

// Playing shuffle hands as last card re-deals instead of winning before the shuffle.
const shuffleCard = card('last-shuffle', 'shuffle', 'wild');
const shuffleState: GameState = {
  ...base,
  rules: { ...base.rules, allowShuffleCard: true },
  activeColor: 'red',
  discardPile: [card('top-red', '5', 'red')],
  players: base.players.map((p, i) =>
    i === 0
      ? { ...p, hand: [shuffleCard] }
      : {
          ...p,
          hand: [
            card(`opp-${i}-a`, '5', 'red'),
            card(`opp-${i}-b`, '6', 'blue'),
          ],
        },
  ),
};
const afterShuffle = playCard(shuffleState, 0, shuffleCard.id, 'blue');
assert.equal(
  afterShuffle.winnerId,
  null,
  'Playing shuffle hands as last card re-deals instead of winning',
);
assert.ok(
  afterShuffle.players[0].hand.length > 0,
  'Player receives cards from shuffled pool',
);
const knockout = applyMercyRule({
  ...state,
  players: state.players.map((p, i) =>
    i === 2
      ? p
      : {
          ...p,
          hand: Array.from({ length: 25 }, (_, j) =>
            card(`${i}-${j}`, '1', 'red'),
          ),
        },
  ),
});
const scored = recordTableWin(startTableRound(knockout, 'mercy-finish'));
assert.equal(scored.tableScore?.wins[knockout.winnerId!], 1);

// Every actual edition completes rounds without losing cards or rejecting its saves.
for (const rules of [CLASSIC_RULES, NO_MERCY_RULES, ALL_WILD_RULES]) {
  for (let round = 0; round < 18; round++) {
    let game = initializeGame(
      ['You', 'Bot1', 'Bot2', 'Bot3', 'Bot4', 'Bot5'],
      rules,
      [false, true, true, true, true, true],
    );
    const deckSize =
      rules.gameMode === 'classic'
        ? 108
        : rules.gameMode === 'no_mercy'
          ? 168
          : 112;
    for (let step = 0; step < 2500 && !game.winnerId; step++) {
      const before = JSON.stringify(game);
      const next = playBotStep(game);
      assert.equal(JSON.stringify(game), before, 'Immutable input');
      game = next;
      const cards = [
        ...game.drawPile,
        ...game.discardPile,
        ...(game.outOfPlayPile ?? []),
        ...game.players.flatMap((p) => p.hand),
      ];
      assert.equal(
        cards.length,
        deckSize,
        `${rules.gameMode} deck conservation`,
      );
      assert.equal(new Set(cards.map((c) => c.id)).size, deckSize);
      if (!game.winnerId) {
        assert.ok(
          !game.players[game.currentPlayerIndex].eliminated,
          'Turn belongs to an active seat',
        );
        assert.ok(
          parseSavedRound(JSON.stringify({ version: 1, game })),
          `${rules.gameMode} recovery at step ${step}`,
        );
      }
    }
    assert.ok(game.winnerId, `${rules.gameMode} round completes`);
  }
}
console.log(
  'Editions passed: 54 full six-seat rounds, roulette ownership, target choices, knockouts, card conservation and saved recovery.',
);
