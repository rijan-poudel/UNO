// Exercise actual per-recipient packets, including acknowledgements and reconnect.
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { io, type Socket } from 'socket.io-client';
import type { Ack, GameView, RoomSnapshot } from '../types/multiplayer';
import { toPresentationGame } from '../lib/gameView';
import { getBotMove } from '../lib/botSupport';
import type { GameState } from '../types/game';

const url = process.env.UNO_CHECK_SOCKET_URL ?? 'http://localhost:3001';
const sockets: Socket[] = [];
const device = () => randomBytes(12).toString('hex');
async function connect(legacy = false) {
  const socket = io(url, {
    transports: ['websocket'],
    forceNew: true,
    ...(legacy ? {} : { auth: { protocolVersion: 2 } }),
  });
  sockets.push(socket);
  await new Promise<void>((resolve, reject) => {
    socket.once('connect', resolve);
    socket.once('connect_error', reject);
  });
  return socket;
}
async function request(socket: Socket, event: string, payload: unknown) {
  const ack = (await socket.timeout(5000).emitWithAck(event, payload)) as Ack<{
    room: RoomSnapshot;
    playerId: string;
  }>;
  assert.equal(ack.ok, true, ack.ok ? '' : ack.error);
  return ack.data;
}
function privateFor(room: RoomSnapshot, playerId: string) {
  const game = room.game;
  if (!game) return;
  assert.ok(game.roundId);
  assert.ok(game.tableScore);
  assert.deepEqual(room.tableScore, game.tableScore);
  assert.equal(
    Object.values(game.tableScore.wins).reduce((a, b) => a + b, 0),
    game.tableScore.completedRounds,
  );
  assert.equal(
    'drawPile' in game,
    false,
    'Stock identities must never leave the server',
  );
  assert.ok(Number.isInteger(game.drawPileCount));
  for (const player of game.players) {
    assert.equal(
      'hand' in player,
      player.id === playerId,
      'Each packet contains only its recipient’s hand',
    );
    if (player.id === playerId) {
      assert.equal(player.hand?.length, player.handCount);
      assert.ok(
        player.hand?.every((card) => card.color && card.value && card.id),
      );
    }
  }
  if (
    room.pendingColorChoice?.playerId !== playerId &&
    room.pendingColorChoice
  ) {
    assert.deepEqual(
      Object.keys(room.pendingColorChoice),
      ['playerId'],
      'A color-picker preview cannot leak an unplayed wild',
    );
  }
}
async function main() {
  try {
    const host = await connect();
    let guest = await connect();
    const guestDevice = device();
    const created = await request(host, 'room:create', {
      playerName: 'Private host',
      deviceId: device(),
    });
    const roomId = created.room.roomId;
    const joined = await request(guest, 'room:join', {
      roomId,
      playerName: 'Private guest',
      deviceId: guestDevice,
    });
    let packets = 0;
    const watch = (socket: Socket, id: string) =>
      socket.on('room:update', (room: RoomSnapshot) => {
        privateFor(room, id);
        packets++;
      });
    watch(host, created.playerId);
    watch(guest, joined.playerId);
    const started = await request(host, 'room:start', {
      roomId,
      roundId: 'client-forged-id',
      tableScore: {
        completedRounds: 99,
        wins: { player_0: 99 },
        lastRoundId: 'forged',
      },
      rules: { allowStartingActionCard: false, mustDeclareUno: false },
    });
    privateFor(started.room, created.playerId);
    assert.notEqual(started.room.game?.roundId, 'client-forged-id');
    assert.equal(
      started.room.tableScore?.completedRounds,
      0,
      'Clients cannot set their own score',
    );
    const guestTable = await request(guest, 'room:ready', { roomId });
    privateFor(guestTable.room, joined.playerId);
    const guestCard = guestTable.room.game?.players.find(
      (player) => player.id === joined.playerId,
    )?.hand?.[0];
    assert.ok(guestCard);
    const stolenPlay = (await host.timeout(5000).emitWithAck('game:action', {
      roomId,
      action: { type: 'play', cardId: guestCard.id, chosenColor: 'red' },
    })) as Ack<unknown>;
    assert.equal(
      stolenPlay.ok,
      false,
      'Knowing another card ID cannot transfer ownership',
    );
    // Local tampering cannot change the server state.
    assert.ok(started.room.game);
    started.room.game.pendingDraw = 999;
    const unchanged = await request(host, 'room:ready', { roomId });
    assert.equal(unchanged.room.game?.pendingDraw, 0);
    const earlyLobby = (await host
      .timeout(5000)
      .emitWithAck('room:return-to-lobby', { roomId })) as Ack<unknown>;
    assert.equal(
      earlyLobby.ok,
      false,
      'Table editing cannot interrupt an active round',
    );
    // A bounded redeal selects a real hand containing a wild; do not rely on
    // a random full round happening to play one before it ends.
    let opening = unchanged.room;
    for (
      let attempt = 0;
      attempt < 100 &&
      !opening.game?.players[0].hand?.some((card) => card.color === 'wild');
      attempt++
    ) {
      opening = (await request(host, 'room:start', { roomId })).room;
    }
    const wild = opening.game?.players[0].hand?.find(
      (card) => card.color === 'wild',
    );
    assert.ok(wild);
    const prepared = await request(host, 'game:action', {
      roomId,
      action: { type: 'prepareWild', cardId: wild.id },
    });
    privateFor(prepared.room, created.playerId);
    assert.equal(prepared.room.pendingColorChoice?.cardId, wild.id);
    privateFor(
      (await request(guest, 'room:ready', { roomId })).room,
      joined.playerId,
    );
    const cancelled = await request(host, 'game:action', {
      roomId,
      action: { type: 'cancelWildChoice' },
    });
    assert.equal(cancelled.room.pendingColorChoice, null);
    // Drive real rounds from the acting client's private view.
    async function finishRound(initial: GameView | null): Promise<GameView> {
      let game = initial;
      for (let step = 0; step < 2000 && game && !game.winnerId; step++) {
        const actorId = game.players[game.currentPlayerIndex].id;
        const socket = actorId === created.playerId ? host : guest;
        const own = await request(socket, 'room:ready', { roomId });
        privateFor(own.room, actorId);
        const table = toPresentationGame(own.room.game);
        assert.ok(table);
        const move = getBotMove(table, table.currentPlayerIndex);
        if (move.action === 'play') {
          const card = table.players[table.currentPlayerIndex].hand.find(
            (entry) => entry.id === move.cardId,
          );
          if (card?.color === 'wild') {
            const prepared = await request(socket, 'game:action', {
              roomId,
              action: { type: 'prepareWild', cardId: card.id },
            });
            privateFor(prepared.room, actorId);
            assert.equal(prepared.room.pendingColorChoice?.cardId, card.id);
            const observer = await request(
              socket === host ? guest : host,
              'room:ready',
              { roomId },
            );
            privateFor(
              observer.room,
              socket === host ? joined.playerId : created.playerId,
            );
          }
        }
        const action =
          move.action === 'play'
            ? {
                type: 'play',
                cardId: move.cardId,
                chosenColor: move.chosenColor,
              }
            : { type: move.action === 'drawRequired' ? 'draw' : move.action };
        const next = await request(socket, 'game:action', { roomId, action });
        privateFor(next.room, actorId);
        game = next.room.game;
      }
      assert.ok(game?.winnerId, 'Recipient views can drive a full round');
      return game;
    }
    const game = await finishRound(cancelled.room.game);
    assert.equal(game.tableScore?.completedRounds, 1);
    assert.equal(game.tableScore?.wins[game.winnerId ?? ''], 1);
    assert.deepEqual(
      (await request(host, 'room:ready', { roomId })).room.tableScore,
      game.tableScore,
    );
    assert.deepEqual(
      (await request(guest, 'room:ready', { roomId })).room.tableScore,
      game.tableScore,
      'Repeated packets cannot duplicate a win',
    );
    const guestEdit = (await guest
      .timeout(5000)
      .emitWithAck('room:return-to-lobby', { roomId })) as Ack<unknown>;
    assert.equal(guestEdit.ok, false, 'Only the host can bring everyone back');
    const lobby = await request(host, 'room:return-to-lobby', { roomId });
    assert.equal(lobby.room.roomId, roomId);
    assert.equal(lobby.room.game, null);
    assert.deepEqual(
      lobby.room.tableScore,
      game.tableScore,
      'Editing rules keeps wins for the same crew',
    );
    assert.equal(lobby.room.started, false);
    assert.deepEqual(
      lobby.room.players.map((player) => player.playerId),
      [created.playerId, joined.playerId],
    );
    assert.ok(
      lobby.room.players.every((player) => player.connected && !player.ready),
    );
    assert.equal(
      (await request(guest, 'room:ready', { roomId })).room.game,
      null,
    );
    assert.equal(
      (await request(host, 'room:return-to-lobby', { roomId })).room.started,
      false,
      'Retrying lobby return is idempotent',
    );
    const added = await request(host, 'room:add-bot', { roomId });
    assert.equal(
      added.room.tableScore,
      undefined,
      'A changed crew starts a new score',
    );
    const addedBot = added.room.players.find((player) => player.isBot);
    assert.ok(addedBot);
    await request(host, 'room:kick', {
      roomId,
      targetPlayerId: addedBot.playerId,
    });
    const fresh = await request(host, 'room:start', { roomId });
    assert.equal(
      fresh.room.tableScore?.completedRounds,
      0,
      'Reused seats cannot inherit a departed crew’s wins',
    );
    const finishedAgain = await finishRound(fresh.room.game);
    assert.equal(finishedAgain.tableScore?.completedRounds, 1);
    await request(host, 'room:return-to-lobby', { roomId });
    await request(host, 'room:set-rules', {
      roomId,
      rules: { startingHandSize: 5 },
    });
    // Re-dealing from the preserved room uses the edited rules.
    const rematch = await request(host, 'room:start', {
      roomId,
    });
    privateFor(rematch.room, created.playerId);
    assert.deepEqual(
      rematch.room.tableScore,
      finishedAgain.tableScore,
      'Same-crew re-deal retains completed wins',
    );
    assert.notEqual(rematch.room.game?.roundId, finishedAgain.roundId);
    assert.equal(rematch.room.game?.rules.startingHandSize, 5);
    assert.ok(
      rematch.room.game?.players.every((player) => player.handCount === 5),
    );
    const beforeRefresh = await request(guest, 'room:ready', { roomId });
    const hand = beforeRefresh.room.game?.players.find(
      (player) => player.id === joined.playerId,
    )?.hand;
    guest.disconnect();
    guest = await connect();
    const restored = await request(guest, 'room:join', {
      roomId,
      playerName: 'Private guest',
      deviceId: guestDevice,
    });
    privateFor(restored.room, joined.playerId);
    assert.deepEqual(
      restored.room.tableScore,
      finishedAgain.tableScore,
      'Reconnect retains the public score',
    );
    assert.equal(restored.playerId, joined.playerId);
    assert.deepEqual(
      restored.room.game?.players.find(
        (player) => player.id === joined.playerId,
      )?.hand,
      hand,
    );
    // A pre-update frontend can keep playing with anonymous backs in its
    // original packet shape. Choosing that format never grants secret cards.
    const legacy = await connect(true);
    const legacyAck = (await legacy.timeout(5000).emitWithAck('room:join', {
      roomId,
      playerName: 'Private guest',
      deviceId: guestDevice,
    })) as Ack<{ room: Omit<RoomSnapshot, 'game'> & { game: GameState } }>;
    assert.equal(legacyAck.ok, true);
    const legacyGame = legacyAck.data.room.game;
    assert.deepEqual(legacyGame.tableScore, finishedAgain.tableScore);
    assert.deepEqual(
      legacyGame.players.find((player) => player.id === joined.playerId)?.hand,
      hand,
    );
    assert.ok(
      legacyGame.drawPile.every((card) => card.id.startsWith('hidden:stock:')),
    );
    for (const player of legacyGame.players.filter(
      (player) => player.id !== joined.playerId,
    )) {
      assert.ok(
        player.hand.every((card) => card.id.startsWith(`hidden:${player.id}:`)),
      );
    }
    const legacyBroadcast = new Promise<GameState>((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error('No legacy broadcast')),
        5000,
      );
      legacy.once('room:update', (room: { game: GameState }) => {
        clearTimeout(timer);
        resolve(room.game);
      });
    });
    await request(host, 'room:ready', { roomId });
    assert.ok(
      (await legacyBroadcast).drawPile.every((card) =>
        card.id.startsWith('hidden:stock:'),
      ),
    );
    await request(host, 'game:action', { roomId, action: { type: 'draw' } });
    await request(host, 'game:action', { roomId, action: { type: 'pass' } });
    const legacyTurn = (await legacy
      .timeout(5000)
      .emitWithAck('room:ready', { roomId })) as Ack<{
      room: { game: GameState };
    }>;
    assert.equal(legacyTurn.ok, true);
    const legacyMove = getBotMove(
      legacyTurn.data.room.game,
      legacyTurn.data.room.game.currentPlayerIndex,
    );
    const legacyAction =
      legacyMove.action === 'play'
        ? {
            type: 'play',
            cardId: legacyMove.cardId,
            chosenColor: legacyMove.chosenColor,
          }
        : {
            type:
              legacyMove.action === 'drawRequired' ? 'draw' : legacyMove.action,
          };
    const legacyPlayed = (await legacy
      .timeout(5000)
      .emitWithAck('game:action', { roomId, action: legacyAction })) as Ack<{
      room: { game: GameState };
    }>;
    assert.equal(
      legacyPlayed.ok,
      true,
      'Older clients can still take a real turn',
    );
    assert.ok(
      legacyPlayed.data.room.game.players[0].hand.every((card) =>
        card.id.startsWith('hidden:'),
      ),
    );
    const outsider = await connect();
    for (const event of [
      'room:ready',
      'room:set-rules',
      'game:action',
      'room:return-to-lobby',
    ]) {
      const rejected = (await outsider.timeout(5000).emitWithAck(event, {
        roomId,
        rules: {},
        action: { type: 'draw' },
      })) as Ack<unknown>;
      assert.equal(rejected.ok, false);
      assert.equal(
        'data' in rejected,
        false,
        'Outsiders receive no table state',
      );
    }
    assert.ok(
      packets > 10,
      'Privacy was checked on real broadcasts throughout play',
    );
    console.log(
      'Private multiplayer passed: tailored replies/broadcasts, wild previews, ownership, full round, host-only table editing, re-deal, reconnect, legacy privacy and outsider rejection.',
    );
  } finally {
    sockets.forEach((socket) => socket.disconnect());
  }
}
void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
