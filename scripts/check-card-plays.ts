// Multi-card outcomes and atomic UNO declarations, without a test framework.
import assert from 'node:assert/strict';
import { initializeGame } from '../lib/gameSetup';
import { playCard, declareUno, callOutUno } from '../lib/gameActions';
import {
  canDeclareUno,
  getCardPlayChoices,
  getCardPlayBlockReason,
  getCardPlayHint,
} from '../lib/gameRules';
import { getPlayedCards, getMultiPlayDelay } from '../lib/cardMotion';
import { getHandSort, saveHandSort, sortHand } from '../lib/handSorting';
import { getPlayerExpression } from '../lib/playerExpression';
import {
  isAvatarId,
  getPlayerAvatar,
  savePlayerAvatar,
  subscribePlayerAvatar,
} from '../lib/playerAvatars';
import { toGameView, toPresentationGame } from '../lib/gameView';
import type { Card } from '../types/card';
import type { GameState } from '../types/game';

const red8: Card = { id: 'red8', color: 'red', value: '8' };
const blue8: Card = { id: 'blue8', color: 'blue', value: '8' };
const red8b: Card = { ...red8, id: 'red8b' };
const green2: Card = { id: 'green2', color: 'green', value: '2' };
const discard: Card = { id: 'clear-red', color: 'red', value: 'discardAll' };
const base = initializeGame(['You', 'Friend', 'Third'], {
  allowDoublePlaySameNumber: true,
  allowDiscardAll: true,
  allowStartingActionCard: false,
});
function holding(hand: Card[]): GameState {
  return {
    ...base,
    currentPlayerIndex: 0,
    activeColor: 'red',
    discardPile: [{ id: 'top', color: 'red', value: '4' }],
    players: base.players.map((player, i) =>
      i ? player : { ...player, hand, avatarId: 'portrait-3' },
    ),
  };
}
const state = holding([red8, blue8, green2]);
assert.deepEqual(
  getCardPlayChoices(state, 0, red8).map((choice) => choice.remaining),
  [2, 1],
);
assert.ok(
  canDeclareUno(state, 0),
  'A legal pair can pre-call from three cards',
);
const before = JSON.stringify(state);
const paired = playCard(state, 0, red8.id, undefined, {
  secondCardId: blue8.id,
  declareUno: true,
});
assert.equal(
  JSON.stringify(state),
  before,
  'Multi-play leaves its input intact',
);
assert.deepEqual(paired.players[0].hand, [green2]);
assert.equal(paired.players[0].saidUno, true);
assert.equal(paired.currentPlayerIndex, 1);
assert.equal(
  paired.turnCount,
  state.turnCount + 1,
  'A pair advances just one turn',
);
assert.equal(paired.activeColor, 'blue');
assert.equal(paired.discardPile.at(-1)?.id, blue8.id);
assert.equal(
  paired.lastAction.type === 'play' && paired.lastAction.playedCards?.length,
  2,
);
assert.equal(
  paired.lastAction.type === 'play' && paired.lastAction.declaredUno,
  true,
);
assert.equal(
  callOutUno(paired, 1, 0).players[0].hand.length,
  1,
  'A combined UNO play cannot be caught',
);
const uncalled = playCard(state, 0, red8.id, undefined, {
  secondCardId: blue8.id,
});
assert.equal(uncalled.players[0].saidUno, false);
assert.equal(callOutUno(uncalled, 1, 0).players[0].hand.length, 3);
assert.ok(
  playCard(declareUno(state, 0), 0, red8.id, undefined, {
    secondCardId: blue8.id,
  }).players[0].saidUno,
);
assert.equal(
  playCard(holding([red8, blue8]), 0, red8.id, undefined, {
    secondCardId: blue8.id,
  }).winnerId,
  state.players[0].id,
);
for (const [invalid, secondId] of [
  [
    { ...state, rules: { ...state.rules, allowDoublePlaySameNumber: false } },
    blue8.id,
  ],
  [
    {
      ...state,
      rules: { ...state.rules, allowDoublePlayExactMatchOnly: true },
    },
    blue8.id,
  ],
  [{ ...state, currentPlayerIndex: 1 }, blue8.id],
  [{ ...state, pendingDraw: 2, pendingDrawType: 'draw2' }, blue8.id],
  [state, red8.id],
  [state, 'missing'],
  [state, green2.id],
] as [GameState, string][]) {
  assert.throws(() =>
    playCard(invalid, 0, red8.id, undefined, { secondCardId: secondId }),
  );
}
const exact = holding([red8, red8b, green2]);
exact.rules = { ...exact.rules, allowDoublePlayExactMatchOnly: true };
assert.equal(
  playCard(exact, 0, red8.id, undefined, { secondCardId: red8b.id }).players[0]
    .hand.length,
  1,
);
assert.throws(
  () => playCard(state, 0, red8.id, undefined, { declareUno: true }),
  /exactly one/,
);
assert.equal(
  getCardPlayChoices(state, 0, { ...red8, id: 'not-held' }).length,
  0,
);

const clearing = holding([discard, red8, red8b, green2]);
assert.ok(
  canDeclareUno(clearing, 0),
  'Discard All can pre-call from a large hand',
);
assert.equal(getCardPlayChoices(clearing, 0, discard)[0].remaining, 1);
const cleared = playCard(clearing, 0, discard.id, undefined, {
  declareUno: true,
});
assert.deepEqual(cleared.players[0].hand, [green2]);
assert.equal(cleared.players[0].saidUno, true);
assert.equal(
  cleared.discardPile.at(-1)?.id,
  discard.id,
  'Discard All remains the top card',
);
assert.equal(
  cleared.lastAction.type === 'play' && cleared.lastAction.discardAllCount,
  2,
);
assert.ok(
  playCard(declareUno(clearing, 0), 0, discard.id).players[0].saidUno,
  'Pre-call survives clearing multiple cards',
);
assert.equal(
  playCard(holding([discard, red8, red8b]), 0, discard.id).winnerId,
  state.players[0].id,
);
assert.throws(() =>
  playCard(
    {
      ...holding([discard, red8]),
      rules: { ...base.rules, canFinishWithActionCard: false },
    },
    0,
    discard.id,
  ),
);
assert.throws(
  () =>
    playCard(holding([discard, red8]), 0, discard.id, undefined, {
      declareUno: true,
    }),
  /exactly one/,
);
assert.equal(
  canDeclareUno(holding([red8, red8b, { ...red8, id: 'red8c' }, green2]), 0),
  false,
);
const wire = toGameView(paired, state.players[0].id);
assert.equal(toPresentationGame(wire)?.players[0].avatarId, 'portrait-3');
assert.ok(isAvatarId('initials') && isAvatarId('portrait-3'));
for (const value of ['portrait-12', -1, {}, null, 'random'])
  assert.equal(isAvatarId(value), false);
console.log(
  'Card choices, paired plays, Discard All, atomic UNO and avatar checks passed.',
);

// A blocked storage API still permits changing an avatar for the current session.
{
  const storageDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    'localStorage',
  );
  const windowDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    'window',
  );
  try {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        getItem() {
          throw new Error('blocked');
        },
        setItem() {
          throw new Error('blocked');
        },
      },
    });
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: new EventTarget(),
    });
    let notices = 0;
    const unsubscribe = subscribePlayerAvatar(() => notices++);
    savePlayerAvatar('portrait-1');
    assert.equal(getPlayerAvatar(), 'portrait-1');
    assert.equal(notices, 1);
    unsubscribe();
    savePlayerAvatar('initials');
    assert.equal(notices, 1, 'Unmounted pickers stop receiving updates');
  } finally {
    if (storageDescriptor)
      Object.defineProperty(globalThis, 'localStorage', storageDescriptor);
    else Reflect.deleteProperty(globalThis, 'localStorage');
    if (windowDescriptor)
      Object.defineProperty(globalThis, 'window', windowDescriptor);
    else Reflect.deleteProperty(globalThis, 'window');
  }
}

// Special-move cues describe legal outcomes, and every discarded face travels.
assert.equal(getCardPlayHint(state, 0, red8)?.badge, '×2');
assert.equal(
  getCardPlayHint(state, 0, blue8)?.badge,
  '×2',
  'Either member advertises the valid matching pair',
);
assert.equal(
  getCardPlayHint(
    { ...state, rules: { ...state.rules, allowDoublePlaySameNumber: false } },
    0,
    red8,
  ),
  undefined,
);
assert.equal(
  getCardPlayHint(clearing, 0, discard)?.description,
  '3 out · 1 left · call UNO',
);
assert.match(
  getCardPlayHint(holding([discard, red8]), 0, discard)?.description ?? '',
  /empty hand — you win/,
);
assert.equal(
  getCardPlayHint(
    { ...clearing, pendingDraw: 2, pendingDrawType: 'draw2' },
    0,
    discard,
  ),
  undefined,
);
assert.deepEqual(
  getPlayedCards(paired).map((card) => card.id),
  [red8.id, blue8.id],
);
assert.deepEqual(
  getPlayedCards(cleared).map((card) => card.id),
  [red8.id, red8b.id, discard.id],
);
assert.deepEqual(
  getPlayedCards(declareUno(state, 0)),
  [],
  'Metadata cannot replay an old throw',
);
assert.deepEqual(
  getPlayedCards(
    toPresentationGame(toGameView(cleared, cleared.players[1].id))!,
  ),
  getPlayedCards(cleared),
  'Opponent throws use only public discarded faces',
);
for (const count of [1, 2, 3, 10, 116]) {
  const delays = Array.from({ length: count }, (_, index) =>
    getMultiPlayDelay(index, count),
  );
  assert.equal(delays[0], 0);
  assert.ok(
    delays.every(
      (delay, index) =>
        delay <= 120 && (index === 0 || delay >= delays[index - 1]),
    ),
    'A large clear stays one short throw',
  );
}
for (const avatar of ['portrait-6', 'portrait-10', 'portrait-11'])
  assert.ok(isAvatarId(avatar));
console.log(
  'Special-play cues, public multi-card flight faces, bounded stagger and extended avatars passed.',
);

assert.equal(
  getCardPlayHint(declareUno(clearing, 0), 0, discard)?.description,
  '3 out · 1 left',
  'A preview does not ask for an UNO call already made',
);

// Either activation resolves to a legal lead, without allowing an illegal single.
const fromBlue = getCardPlayChoices(state, 0, blue8);
assert.equal(fromBlue.length, 1);
assert.deepEqual(
  fromBlue[0].cards.map((card) => card.id),
  [red8.id, blue8.id],
);
assert.equal(fromBlue[0].secondCardId, blue8.id);
assert.equal(getCardPlayBlockReason(state, 0, blue8), undefined);
assert.deepEqual(
  playCard(state, 0, fromBlue[0].cards[0].id, undefined, {
    secondCardId: fromBlue[0].secondCardId,
    declareUno: true,
  }),
  paired,
);
assert.throws(() => playCard(state, 0, blue8.id), /cannot be played/);
assert.throws(() =>
  playCard(state, 0, blue8.id, undefined, { secondCardId: blue8.id }),
);
assert.equal(
  getCardPlayChoices({ ...state, currentPlayerIndex: 1 }, 0, blue8).length,
  0,
);
assert.equal(
  getCardPlayChoices(
    { ...state, pendingDraw: 2, pendingDrawType: 'draw2' },
    0,
    blue8,
  ).length,
  0,
);
const pairsOff = {
  ...state,
  rules: { ...state.rules, allowDoublePlaySameNumber: false },
};
assert.equal(getCardPlayChoices(pairsOff, 0, blue8).length, 0);
assert.match(getCardPlayBlockReason(pairsOff, 0, blue8) ?? '', /Pairs are off/);
assert.equal(getCardPlayBlockReason(pairsOff, 0, red8), undefined);
const exactOnly = {
  ...state,
  rules: { ...state.rules, allowDoublePlayExactMatchOnly: true },
};
assert.match(getCardPlayBlockReason(exactOnly, 0, blue8) ?? '', /same color/);
assert.match(
  getCardPlayBlockReason(
    {
      ...holding([{ id: 'last-skip', color: 'red', value: 'skip' }]),
      rules: { ...base.rules, canFinishWithActionCard: false },
    },
    0,
    { id: 'last-skip', color: 'red', value: 'skip' },
  ) ?? '',
  /Finish with a number/,
);
assert.match(
  getCardPlayBlockReason(
    { ...pairsOff, pendingDraw: 6, pendingDrawType: 'draw2' },
    0,
    blue8,
  ) ?? '',
  /Stacking is off/,
);
assert.match(
  getCardPlayBlockReason({ ...pairsOff, currentPlayerIndex: 1 }, 0, blue8) ??
    '',
  /Jump-ins are off/,
);
assert.equal(
  getPlayerExpression(paired, paired.players[0].id),
  'uno',
  'Atomic UNO has its own reaction',
);

const order = [blue8, red8, green2];
const unchangedOrder = JSON.stringify(order);
assert.deepEqual(
  sortHand(order, 'color').map((card) => card.id),
  [red8.id, green2.id, blue8.id],
);
assert.deepEqual(
  sortHand(order, 'number').map((card) => card.id),
  [green2.id, red8.id, blue8.id],
);
assert.deepEqual(sortHand(order, 'original'), order);
assert.equal(
  JSON.stringify(order),
  unchangedOrder,
  'Sorting does not mutate the authoritative hand',
);
{
  const descriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    'localStorage',
  );
  const values = new Map<string, string>();
  try {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        getItem(key: string) {
          return values.get(key) ?? null;
        },
        setItem(key: string, value: string) {
          values.set(key, value);
        },
      },
    });
    assert.equal(getHandSort(), 'color');
    for (const mode of ['number', 'original', 'color'] as const) {
      saveHandSort(mode);
      assert.equal(getHandSort(), mode);
    }
    values.set('uno.hand.sort', 'invalid');
    assert.equal(getHandSort(), 'color');
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('blocked');
      },
    });
    assert.equal(getHandSort(), 'color');
    assert.doesNotThrow(() => saveHandSort('number'));
  } finally {
    if (descriptor)
      Object.defineProperty(globalThis, 'localStorage', descriptor);
    else Reflect.deleteProperty(globalThis, 'localStorage');
  }
}
console.log(
  'Either-card pairing, exact-match restrictions, blocked-move explanations, saved immutable sorting and UNO reactions passed.',
);
