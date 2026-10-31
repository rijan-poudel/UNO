import './check-bot-uno';
import './check-card-element';
import './check-card-faces';
import './check-avatar';
import './check-hand-layout';
import './check-card-plays';
import './check-gesture';
import './check-turn-flow';
import './check-saved-round';
import './check-game-view';
import './check-bot-difficulty';
import './check-table-score';
import './check-turn-cue';
import './check-lobby';
import './check-entry';
import './check-controller';
import './check-game-activity';
import './check-practice';
import {
  getCardFlight,
  getDealDelay,
  hasCardLayoutChanged,
} from '../lib/cardMotion';
// Framework-free engine smoke check. Run with npm run check:game.
import assert from 'node:assert/strict';
import { defaultRules } from '../types/rules';
import {
  DEFAULT_TABLE_RULES,
  parseRulePreferences,
  RULES_VERSION,
} from '../lib/rulePreferences';
import { validateGameRules } from '../lib/validateGameRules';
import type { Card } from '../types/card';
import type { GameState } from '../types/game';

// Regressions: shared defaults, cross-color stacking, and every action path.
{
  assert.equal(DEFAULT_TABLE_RULES.stackDraw2, false);
  assert.equal(DEFAULT_TABLE_RULES.stackWild4, false);
  assert.equal(DEFAULT_TABLE_RULES.allowWild4OnDraw2, false);
  assert.equal(matchesPreset(DEFAULT_TABLE_RULES, RULE_PRESETS[0].rules), true);
  assert.equal(parseRulePreferences(null, null).stackDraw2, false);
  assert.equal(
    parseRulePreferences(JSON.stringify(defaultRules), null).stackDraw2,
    false,
  );
  assert.equal(
    parseRulePreferences(
      JSON.stringify({ ...defaultRules, stackDraw2: true, stackWild4: true }),
      '2',
    ).stackDraw2,
    false,
  );
  assert.equal(
    parseRulePreferences(JSON.stringify(defaultRules), RULES_VERSION)
      .stackDraw2,
    false,
    'Explicit Classic persists',
  );
  for (const raw of [
    'null',
    '[]',
    'broken',
    '{"stackDraw2":"false"}',
    '{"startingHandSize":1e100}',
  ]) {
    assert.deepEqual(
      parseRulePreferences(raw, RULES_VERSION),
      DEFAULT_TABLE_RULES,
    );
  }
  for (const input of [
    null,
    [],
    { stackDraw2: 'false' },
    { startingHandSize: Infinity },
    { startingHandSize: -2 },
    { startingHandSize: 1.5 },
    { maxPlayers: 100 },
  ]) {
    assert.throws(() => validateGameRules(input));
  }
  assert.throws(
    () => initializeGame(Array(10).fill('Player'), { startingHandSize: 20 }),
    /[Nn]ot enough cards/,
  );
  const base = initializeGame(['You', 'Cleo', 'Jules'], {
    ...DEFAULT_TABLE_RULES,
    stackDraw2: true,
    stackWild4: true,
    allowStartingActionCard: false,
  });
  const draw2: Card = { id: 'blue-two', color: 'blue', value: 'draw2' };
  const wild4: Card = { id: 'wild-four', color: 'wild', value: 'wild4' };
  const number: Card = { id: 'red-seven', color: 'red', value: '7' };
  const penalty: GameState = {
    ...base,
    currentPlayerIndex: 0,
    activeColor: 'green',
    pendingDraw: 2,
    pendingDrawType: 'draw2',
    discardPile: [{ id: 'green-two', color: 'green', value: 'draw2' }],
    players: base.players.map((player, index) =>
      index === 0 ? { ...player, hand: [draw2, number] } : player,
    ),
  };
  assert.ok(canPlayCard(draw2, penalty, 0), 'A blue +2 stacks on a green +2');
  const stacked = playCard(penalty, 0, draw2.id);
  assert.equal(stacked.pendingDraw, 4);
  assert.equal(stacked.currentPlayerIndex, 1);
  assert.equal(penalty.pendingDraw, 2, 'Stacking leaves its input intact');
  assert.equal(
    canPlayCard(wild4, penalty, 0),
    false,
    'Mixed stacks remain an explicit house rule',
  );
  const fourPenalty: GameState = {
    ...penalty,
    pendingDraw: 4,
    pendingDrawType: 'wild4',
    players: penalty.players.map((player, index) =>
      index === 0 ? { ...player, hand: [wild4, number] } : player,
    ),
  };
  assert.equal(playCard(fourPenalty, 0, wild4.id, 'blue').pendingDraw, 8);
  const classic = {
    ...penalty,
    rules: { ...penalty.rules, stackDraw2: false },
  };
  assert.equal(canPlayCard(draw2, classic, 0), false);
  assert.equal(drawRequiredCards(classic, 0).players[0].hand.length, 4);
  for (const card of [draw2, wild4]) {
    const lastAction: GameState = {
      ...penalty,
      pendingDraw: card.value === 'draw2' ? 2 : 4,
      pendingDrawType: card.value === 'draw2' ? 'draw2' : 'wild4',
      rules: { ...penalty.rules, canFinishWithActionCard: false },
      players: penalty.players.map((player, index) =>
        index === 0 ? { ...player, hand: [card] } : player,
      ),
    };
    assert.equal(
      canPlayCard(card, lastAction, 0),
      false,
      'Final action restriction applies to stacks',
    );
    assert.throws(
      () => playCard(lastAction, 0, card.id, 'blue'),
      /cannot be played/,
    );
  }
  const jumpWild: Card = { id: 'jump-wild', color: 'wild', value: 'wild' };
  const jump: GameState = {
    ...base,
    currentPlayerIndex: 1,
    activeColor: 'red',
    discardPile: [{ ...jumpWild, id: 'prior-wild' }],
    rules: { ...base.rules, allowJumpIn: true },
    players: base.players.map((player, index) =>
      index === 0 ? { ...player, hand: [jumpWild, number] } : player,
    ),
  };
  assert.ok(canPlayCard(jumpWild, jump, 0));
  assert.equal(
    playCard(jump, 0, jumpWild.id, 'green').activeColor,
    'green',
    'Wild jump-in uses the jumping player',
  );
  const lastJump: GameState = {
    ...jump,
    rules: { ...jump.rules, canFinishWithActionCard: false },
    players: jump.players.map((player, index) =>
      index === 0 ? { ...player, hand: [jumpWild] } : player,
    ),
  };
  assert.equal(
    canPlayCard(jumpWild, lastJump, 0),
    false,
    'Final action restriction also applies out of turn',
  );
  const discard: Card = {
    id: 'discard-all',
    color: 'red',
    value: 'discardAll',
  };
  const discardFinish: GameState = {
    ...base,
    currentPlayerIndex: 0,
    activeColor: 'red',
    rules: {
      ...base.rules,
      allowDiscardAll: true,
      canFinishWithActionCard: false,
    },
    players: base.players.map((player, index) =>
      index === 0 ? { ...player, hand: [discard, number] } : player,
    ),
  };
  assert.equal(
    canPlayCard(discard, discardFinish, 0),
    false,
    'Discard All cannot bypass the finish restriction',
  );
  const turn: GameState = {
    ...base,
    currentPlayerIndex: 0,
    pendingDraw: 0,
    pendingDrawType: null,
  };
  assert.throws(() => passTurn(turn, 0), /Draw before passing/);
  const afterDraw = drawOneCard(turn, 0);
  assert.ok(afterDraw.drawnThisTurn);
  assert.throws(() => drawOneCard(afterDraw, 0), /already drawn/);
  const afterMeta = declareUno(
    {
      ...afterDraw,
      players: afterDraw.players.map((player, index) =>
        index === 0 ? { ...player, hand: player.hand.slice(0, 2) } : player,
      ),
    },
    0,
  );
  assert.equal(
    passTurn(afterMeta, 0).drawnThisTurn,
    false,
    'UNO metadata does not lose draw sequencing',
  );
  const declared = {
    ...turn,
    players: turn.players.map((player, index) =>
      index === 0 ? { ...player, saidUno: true } : player,
    ),
  };
  assert.equal(
    drawOneCard(declared, 0).players[0].saidUno,
    false,
    'Drawing resets a previous UNO declaration',
  );
  const disconnectedDraw = {
    ...afterDraw,
    activeColor: 'green' as const,
    discardPile: [
      { id: 'green-five', color: 'green' as const, value: '5' as const },
    ],
    players: afterDraw.players.map((player, index) =>
      index === 0 ? { ...player, hand: [number] } : player,
    ),
  };
  assert.equal(
    getBotMove(disconnectedDraw, 0).action,
    'pass',
    'Offline bots finish an already-drawn turn instead of drawing again',
  );
  const drawnWild: GameState = {
    ...turn,
    rules: {
      ...turn.rules,
      canFinishWithActionCard: false,
      drawUntilPlayable: true,
    },
    players: turn.players.map((player, index) =>
      index === 0 ? { ...player, hand: [number] } : player,
    ),
    drawPile: [wild4, jumpWild],
  };
  assert.equal(drawOneCard(drawnWild, 0).lastAction.type, 'draw');
  assert.equal(
    drawOneCard(drawnWild, 0).players[0].hand.length,
    2,
    'Drawing a wild is playable with the resulting two-card hand',
  );

  const empty = { ...turn, drawPile: [], discardPile: [turn.discardPile[0]] };
  assert.notEqual(
    drawOneCard(empty, 0).currentPlayerIndex,
    0,
    'An exhausted deck advances once',
  );
  const won = { ...turn, winnerId: turn.players[1].id };
  assert.equal(canPlayCard(number, won, 0), false);
  assert.throws(() => declareUno(won, 0), /already over/);
  assert.throws(() => callOutUno(turn, 0, 0), /yourself/);
  console.log(
    'Rule migration, same-type stacking, finish restrictions, jump-ins and draw sequencing passed.',
  );
}

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
import { matchesPreset } from '../lib/rulePresets';
import { RULE_SCENARIOS as RULE_PRESETS } from './ruleScenarios';
import {
  parseProgress,
  addRoundResult,
  getProgressMilestones,
} from '../lib/playerProgress';
import { resolveSocketEndpoint } from '../lib/socketConnection';
import { canPlayCard } from '../lib/gameRules';
import { getBotMove } from '../lib/botSupport';
import type { CardColor } from '../types/card';
import { getPlayerExpression } from '../lib/playerExpression';

{
  const game = initializeGame(['You', 'Cleo', 'Jules'], {
    allowStartingActionCard: false,
  });
  const [you, cleo, jules] = game.players;
  const original = JSON.stringify(game);
  const state = { ...game, currentPlayerIndex: 0 };
  assert.equal(getPlayerExpression(state, you.id), 'thinking');
  assert.equal(
    getPlayerExpression({ ...state, pendingDraw: 4 }, you.id),
    'surprised',
  );
  assert.equal(
    getPlayerExpression(
      { ...state, lastAction: { type: 'draw', playerId: cleo.id, count: 4 } },
      cleo.id,
    ),
    'surprised',
  );
  assert.equal(
    getPlayerExpression(
      { ...state, lastAction: { type: 'draw', playerId: cleo.id, count: 1 } },
      cleo.id,
    ),
    'neutral',
  );
  assert.equal(
    getPlayerExpression(
      {
        ...state,
        lastAction: {
          type: 'callOut',
          callerId: you.id,
          targetId: cleo.id,
          penalty: 2,
        },
      },
      cleo.id,
    ),
    'surprised',
  );
  assert.equal(
    getPlayerExpression(
      {
        ...state,
        lastAction: { type: 'play', playerId: cleo.id, card: cleo.hand[0] },
      },
      cleo.id,
    ),
    'happy',
  );
  assert.equal(
    getPlayerExpression(
      { ...state, lastAction: { type: 'declareUno', playerId: jules.id } },
      jules.id,
    ),
    'uno',
  );
  assert.equal(
    getPlayerExpression({ ...state, winnerId: cleo.id }, cleo.id),
    'celebrate',
  );
  assert.equal(
    getPlayerExpression({ ...state, winnerId: cleo.id }, you.id),
    'neutral',
  );
  assert.equal(
    JSON.stringify(game),
    original,
    'Presentation leaves the engine untouched',
  );
}

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
      else if (move.action === 'pass') game = passTurn(game, i);
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
assert.equal(
  getProgressMilestones(fresh).some((m) => m.earned),
  false,
);
assert.equal(
  getProgressMilestones(firstWin).find((m) => m.id === 'first-win')?.earned,
  true,
);
const thirdWin = addRoundResult(secondWin, 'round-d', true);
const afterStreak = addRoundResult(thirdWin, 'round-e', false);
assert.equal(
  getProgressMilestones(afterStreak).find((m) => m.id === 'three-streak')
    ?.earned,
  true,
  'best streak remains collected after a loss',
);
assert.equal(
  getProgressMilestones({ ...afterStreak, rounds: 10 }).find(
    (m) => m.id === 'ten-rounds',
  )?.earned,
  true,
);
assert.equal(
  getProgressMilestones({ ...afterStreak, wins: 20 }).find(
    (m) => m.id === 'three-wins',
  )?.current,
  3,
  'display progress stops at the real goal',
);
for (const preset of RULE_PRESETS) {
  assert.equal(
    matchesPreset(
      { ...preset.rules, startingHandSize: 12, maxPlayers: 6 },
      preset.rules,
    ),
    false,
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
for (const hostname of [
  'localhost',
  'api.localhost',
  '127.0.0.1',
  '[::1]',
  '0.0.0.0',
  '192.168.1.5',
  '10.0.0.5',
  '172.16.0.5',
  'server.local',
]) {
  assert.equal(
    resolveSocketEndpoint(`http://${hostname}:3001`, publicLocation),
    null,
    'a public game must not connect to a visitor-local server',
  );
}
assert.equal(
  resolveSocketEndpoint('http://localhost:3001', {
    protocol: 'http:',
    hostname: 'localhost',
    port: '3000',
  }),
  'http://localhost:3001/',
);
assert.equal(
  resolveSocketEndpoint(undefined, { ...publicLocation, port: '3000' }),
  null,
  'a public hostname is not a local preview merely because of its port',
);
assert.equal(
  resolveSocketEndpoint('https://localhost.example.com', publicLocation),
  'https://localhost.example.com/',
  'public hostnames are not confused with loopback names',
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
  assert.equal(getPlayerName(), 'Riya');
  let fallbackNotifications = 0;
  const stopFallback = subscribePlayerName(() => fallbackNotifications++);
  savePlayerName('Nora');
  assert.equal(
    fallbackNotifications,
    1,
    'Blocked storage still notifies every profile consumer',
  );
  assert.equal(getSavedPlayerNames()[0], 'Nora');
  stopFallback();
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

// Physical flight starts at the release pose and lands at the real pile rotation.
const flight = getCardFlight(
  { x: 100, y: 600, width: 120, angle: -16 },
  { x: 200, y: 200, width: 80, angle: 7 },
);
assert.equal(
  flight.keyframes[0].transform,
  'translate(-100px, 400px) rotate(-16deg) scale(1.5)',
);
assert.equal(
  flight.keyframes.at(-1)?.transform,
  'translate(0px, 0px) rotate(7deg) scale(1)',
);
assert.ok(flight.duration >= 360 && flight.duration <= 450);
const middle = flight.keyframes[2];
assert.ok(middle.transform.startsWith('translate(-50px, 176px)'));
assert.equal(middle.offset, 0.5);
assert.equal(
  getCardFlight(
    { x: 0, y: 0, width: 80, angle: 0 },
    { x: 0, y: 0, width: 80, angle: 0 },
  ).duration,
  360,
);
assert.equal(
  getCardFlight(
    { x: 10000, y: 10000, width: 80, angle: 0 },
    { x: 0, y: 0, width: 80, angle: 0 },
  ).duration,
  450,
);
for (const kind of ['deal', 'draw', 'return'] as const) {
  const motion = getCardFlight(
    { x: 100, y: 600, width: 120, angle: -16 },
    { x: 200, y: 200, width: 80, angle: 7 },
    kind,
  );
  assert.equal(motion.keyframes[0].transform, flight.keyframes[0].transform);
  assert.equal(
    motion.keyframes.at(-1)?.transform,
    flight.keyframes.at(-1)?.transform,
  );
  assert.ok(
    motion.duration <= (kind === 'deal' ? 390 : kind === 'return' ? 270 : 450),
  );
}
assert.equal(getDealDelay(0), 0);
assert.ok(getDealDelay(1) > getDealDelay(0, 5));
assert.ok(getDealDelay(99, 5) <= 320);
console.log(
  'Card arcs, exact pickup/contact, bounded timing and round-robin deal passed.',
);

// Network metadata preserves presentation; actual card changes interrupt it.
{
  const state = initializeGame(['You', 'Cleo'], {
    allowStartingActionCard: false,
  });
  assert.equal(
    hasCardLayoutChanged(state, JSON.parse(JSON.stringify(state))),
    false,
  );
  const metadata = {
    ...state,
    players: state.players.map((player, index) =>
      index === 0 ? { ...player, saidUno: true } : player,
    ),
    lastAction: { type: 'declareUno' as const, playerId: state.players[0].id },
  };
  assert.equal(
    hasCardLayoutChanged(state, metadata),
    false,
    'UNO metadata preserves the current flight',
  );
  assert.equal(
    hasCardLayoutChanged(state, drawOneCard(state, state.currentPlayerIndex)),
    true,
  );
  const reordered = {
    ...state,
    players: state.players.map((player, index) =>
      index === 0 ? { ...player, hand: [...player.hand].reverse() } : player,
    ),
  };
  assert.equal(
    hasCardLayoutChanged(state, reordered),
    true,
    'Changed hand ordering needs a new pose',
  );
  const horizontal = flight.keyframes.map((frame) =>
    Number(/translate\(([-\d.]+)px/.exec(frame.transform)?.[1]),
  );
  assert.ok(
    horizontal.every((x, i) => i === 0 || x >= horizontal[i - 1]),
    'The arc approaches contact without horizontal overshoot',
  );
  console.log(
    'Motion continuity passed: metadata, cloned snapshots, real card changes and no overshoot.',
  );
}
import './check-friends';
import './check-display';
import './check-rule-profiles';
import './check-editions';
