import './check-gesture';
// Framework-free engine smoke check. Run with npm run check:game.
import assert from 'node:assert/strict';
import {
  getPlayerName,
  getSavedPlayerNames,
  savePlayerName,
  subscribePlayerName,
} from '../lib/playerNames';
import { parseRoomCode, isRoomCode } from '../lib/roomCodes';
import { initializeGame } from '../lib/gameSetup';
import {
  playCard,
  drawOneCard,
  drawRequiredCards,
  passTurn,
  declareUno,
  callOutUno,
} from '../lib/gameActions';
import { RULE_PRESETS, matchesPreset } from '../lib/rulePresets';
import { parseProgress, addRoundResult } from '../lib/playerProgress';
import { resolveSocketEndpoint } from '../lib/socketConnection';
import { canPlayCard } from '../lib/gameRules';
import { getBotMove } from '../lib/botSupport';
import type { CardColor } from '../types/card';

for (const extraRules of [
  ...RULE_PRESETS.map((p) => p.rules),
  { allowShuffleCard: true, allowDiscardAll: true, drawUntilPlayable: true },
]) {
  for (let round = 0; round < 15; round++) {
    let game = initializeGame(
      ['One', 'Two', 'Three', 'Four', 'Five', 'Six'],
      { ...extraRules, maxPlayers: 6 },
      Array(6).fill(true),
    );
    const opener = game.discardPile[0];
    assert.notEqual(
      opener.color,
      'wild',
      'Opening discard always establishes a color',
    );
    assert.ok(game.activeColor && game.activeColor !== 'wild');
    if (opener.value === 'draw2') assert.equal(game.pendingDraw, 2);
    if (opener.value === 'skip') assert.equal(game.currentPlayerIndex, 1);
    if (opener.value === 'reverse') assert.equal(game.direction, -1);
    const initialCount =
      game.players.flatMap((p) => p.hand).length +
      game.drawPile.length +
      game.discardPile.length;
    let steps = 0;
    while (!game.winnerId && steps++ < 3000) {
      const before = JSON.stringify(game);
      const oldGame = game;
      const i = game.currentPlayerIndex;
      const move = getBotMove(game, i);
      if (move.action === 'drawRequired') game = drawRequiredCards(game, i);
      else if (move.action === 'play')
        game = playCard(game, i, move.cardId, move.chosenColor);
      else {
        game = drawOneCard(game, i);
        const card = game.players[i].hand.at(-1);
        if (card && canPlayCard(card, game, i))
          game = playCard(
            game,
            i,
            card.id,
            card.color === 'wild' ? 'red' : undefined,
          );
        else game = passTurn(game, i);
      }
      if (game.players[i].hand.length === 1 && !game.winnerId)
        game = declareUno(game, i);
      assert.equal(
        JSON.stringify(oldGame),
        before,
        'Actions must not mutate input',
      );
      const cards = [
        ...game.drawPile,
        ...game.discardPile,
        ...game.players.flatMap((p) => p.hand),
      ];
      assert.equal(
        cards.length,
        initialCount,
        'Every action conserves the deck',
      );
      assert.equal(
        new Set(cards.map((c) => c.id)).size,
        initialCount,
        'No duplicated cards',
      );
      assert.ok(game.currentPlayerIndex >= 0 && game.currentPlayerIndex < 6);
      assert.ok(JSON.parse(JSON.stringify(game)), 'Game stays serializable');
    }
    assert.ok(game.winnerId, 'Every simulated round finishes within the cap');
  }
}
// Isolate color validation from random opening draw penalties.
const initial = initializeGame(
  ['One', 'Two'],
  { allowStartingActionCard: false },
  [false, false],
);
const wild = {
  id: 'validation-wild',
  color: 'wild' as const,
  value: 'wild' as const,
};
const pending = {
  ...initial,
  players: initial.players.map((p, i) =>
    i === initial.currentPlayerIndex ? { ...p, hand: [wild] } : p,
  ),
};
assert.ok(
  canPlayCard(wild, pending, pending.currentPlayerIndex),
  'Color validation fixture must allow the wild to be played',
);
assert.throws(
  () =>
    playCard(
      pending,
      pending.currentPlayerIndex,
      wild.id,
      'invalid' as CardColor,
    ),
  /color/i,
);
const target = {
  ...initial,
  players: initial.players.map((p, i) =>
    i === 1 ? { ...p, hand: p.hand.slice(0, 1), saidUno: false } : p,
  ),
};
assert.equal(callOutUno(target, 0, 1).players[1].hand.length, 3);
console.log(
  'Passed: 60 complete rounds, deck conservation, immutable inputs, serialization, wild validation, and UNO call-out.',
);

// Completed rounds count once, survive reload parsing, and only wins extend a streak.
const fresh = parseProgress(null);
const firstWin = addRoundResult(fresh, 'round-a', true);
assert.equal(fresh.rounds, 0, 'Progress updates preserve input');
assert.equal(firstWin.wins, 1);
assert.equal(
  addRoundResult(firstWin, 'round-a', true),
  firstWin,
  'Remounting a result does not count it twice',
);
const secondWin = addRoundResult(firstWin, 'round-b', true);
const loss = addRoundResult(secondWin, 'round-c', false);
assert.equal(loss.streak, 0);
assert.equal(loss.bestStreak, 2);
assert.deepEqual(parseProgress(JSON.stringify(loss)), loss);
assert.equal(parseProgress('{"rounds":1,"wins":9}').rounds, 0);
assert.equal(parseProgress('broken').wins, 0);
for (const preset of RULE_PRESETS) {
  assert.ok(
    matchesPreset(
      { ...preset.rules, startingHandSize: 12, maxPlayers: 6 },
      preset.rules,
    ),
  );
}
console.log('Progress and supported rule presets passed.');

// A public frontend must not silently point at a nonexistent port on its own host.
const publicLocation = {
  protocol: 'https:',
  hostname: 'uno-wheat-ten.vercel.app',
  port: '',
};
assert.equal(resolveSocketEndpoint(undefined, publicLocation), null);
assert.equal(resolveSocketEndpoint('  ', publicLocation), null);
assert.equal(
  resolveSocketEndpoint('https://table.example.com', publicLocation),
  'https://table.example.com/',
);
assert.equal(
  resolveSocketEndpoint('javascript:alert(1)', publicLocation),
  null,
);
assert.equal(resolveSocketEndpoint('invalid-url', publicLocation), null);
assert.equal(
  resolveSocketEndpoint(undefined, {
    protocol: 'http:',
    hostname: 'localhost',
    port: '3000',
  }),
  'http://localhost:3001',
);
assert.equal(
  resolveSocketEndpoint(undefined, {
    protocol: 'http:',
    hostname: '192.168.1.5',
    port: '3000',
  }),
  'http://192.168.1.5:3001',
);
console.log('Public socket configuration and local preview endpoints passed.');

for (const input of [
  'ABCD23',
  ' ab-cd 23 ',
  'https://example.com/?room=ABCD23',
]) {
  assert.equal(parseRoomCode(input), 'ABCD23');
  assert.ok(isRoomCode(parseRoomCode(input)));
}
for (const input of [
  'ABCD',
  'ABCDEFGH',
  'IIIIII',
  'https://example.com/no-room',
]) {
  assert.equal(isRoomCode(parseRoomCode(input)), false);
}

// Profile edits must reach quick play without losing the saved bot crew.
const originalStorage = Object.getOwnPropertyDescriptor(
  globalThis,
  'localStorage',
);
const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
const savedNames = new Map<string, string>();
try {
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => savedNames.get(key) ?? null,
      setItem: (key: string, value: string) => savedNames.set(key, value),
    },
  });
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: new EventTarget(),
  });
  savedNames.set(
    'uno.local.playerNames',
    JSON.stringify(['Old name', 'Cleo', 'Jules']),
  );
  assert.equal(
    getSavedPlayerNames()[0],
    'Old name',
    'Preserve a legacy crew without a profile',
  );
  let notifications = 0;
  const unsubscribe = subscribePlayerName(() => notifications++);
  assert.equal(savePlayerName('  Riya  '), 'Riya');
  assert.deepEqual(getSavedPlayerNames(), ['Riya', 'Cleo', 'Jules']);
  assert.equal(notifications, 1);
  unsubscribe();
  savePlayerName('Sam');
  assert.equal(notifications, 1, 'Unmounted views stop listening');
  savedNames.set('uno.local.playerNames', '{broken');
  assert.deepEqual(getSavedPlayerNames(), ['Sam', 'Cleo', 'Jules']);
  assert.equal(savePlayerName(' '), 'You');
  assert.equal(savePlayerName('x'.repeat(30)).length, 18);
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    get() {
      throw new Error('Storage blocked');
    },
  });
  assert.equal(
    savePlayerName('Riya'),
    'Riya',
    'A blocked store does not prevent play',
  );
  assert.equal(getPlayerName(), 'You');
  assert.equal(getSavedPlayerNames().length, 3);
} finally {
  if (originalStorage)
    Object.defineProperty(globalThis, 'localStorage', originalStorage);
  else Reflect.deleteProperty(globalThis, 'localStorage');
  if (originalWindow)
    Object.defineProperty(globalThis, 'window', originalWindow);
  else Reflect.deleteProperty(globalThis, 'window');
}
console.log(
  'Shared player-name persistence, notifications, invalid data and blocked storage passed.',
);
