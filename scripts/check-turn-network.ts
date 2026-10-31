// Real server clock: connected humans expire without a client sending an action.
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { io, type Socket } from 'socket.io-client';
import type { Ack, RoomSnapshot } from '../types/multiplayer';
import { toPresentationGame } from '../lib/gameView';
import { getBotMove } from '../lib/botSupport';
import {
  AUTO_PLAY_TURN_MS,
  FORCED_DRAW_DELAY_MS,
  HUMAN_TURN_MS,
} from '../lib/turnFlow';
const url = process.env.UNO_CHECK_SOCKET_URL ?? 'http://localhost:3001';
const sockets: Socket[] = [];
async function connect() {
  const socket = io(url, {
    transports: ['websocket'],
    forceNew: true,
    auth: { protocolVersion: 2 },
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
async function main() {
  try {
    const host = await connect();
    const guest = await connect();
    const created = await request(host, 'room:create', {
      playerName: 'Clock host',
      deviceId: randomBytes(12).toString('hex'),
    });
    const roomId = created.room.roomId;
    await request(guest, 'room:join', {
      roomId,
      playerName: 'Clock guest',
      deviceId: randomBytes(12).toString('hex'),
    });
    const updates: RoomSnapshot[] = [];
    host.on('room:update', (room: RoomSnapshot) => updates.push(room));
    const waitForGame = (
      predicate: (game: NonNullable<RoomSnapshot['game']>) => boolean,
      timeout = 5000,
    ) =>
      new Promise<NonNullable<RoomSnapshot['game']>>((resolve, reject) => {
        const existing = updates.find(
          (room) => room.game && predicate(room.game),
        )?.game;
        if (existing) {
          resolve(existing);
          return;
        }
        const timer = setTimeout(() => {
          host.off('room:update', onUpdate);
          reject(new Error('Timed out waiting for an automatic game update'));
        }, timeout);
        const onUpdate = (room: RoomSnapshot) => {
          if (!room.game || !predicate(room.game)) return;
          clearTimeout(timer);
          host.off('room:update', onUpdate);
          resolve(room.game);
        };
        host.on('room:update', onUpdate);
      });
    const yieldGuestTurn = async (game: NonNullable<RoomSnapshot['game']>) => {
      if (game.currentPlayerIndex === 0) return game;
      let reply = await request(guest, 'game:action', {
        roomId,
        action: { type: 'draw' },
      });
      if (reply.room.game?.currentPlayerIndex === 1) {
        reply = await request(guest, 'game:action', {
          roomId,
          action: { type: 'pass' },
        });
      }
      assert.ok(reply.room.game);
      assert.equal(reply.room.game.currentPlayerIndex, 0);
      return reply.room.game;
    };
    const penaltyHost = await connect();
    const penaltyUpdates: RoomSnapshot[] = [];
    penaltyHost.on('room:update', (room: RoomSnapshot) =>
      penaltyUpdates.push(room),
    );
    let penaltyGame: RoomSnapshot['game'] = null;
    let penaltyRoomId = '';
    for (let attempt = 0; attempt < 200 && !penaltyGame; attempt++) {
      penaltyUpdates.length = 0;
      const fresh = await request(penaltyHost, 'room:create', {
        playerName: 'Penalty host',
        deviceId: randomBytes(12).toString('hex'),
      });
      penaltyRoomId = fresh.room.roomId;
      await request(penaltyHost, 'room:add-bot', { roomId: penaltyRoomId });
      const deal = await request(penaltyHost, 'room:start', {
        roomId: penaltyRoomId,
        rules: {
          allowStartingActionCard: true,
          stackDraw2: false,
          allowWild4OnDraw2: false,
        },
      });
      if (deal.room.game?.pendingDraw === 2) penaltyGame = deal.room.game;
      else await request(penaltyHost, 'room:leave', { roomId: penaltyRoomId });
    }
    assert.ok(penaltyGame, 'Exercise a real draw-two opener');
    await new Promise((resolve) =>
      setTimeout(resolve, FORCED_DRAW_DELAY_MS + 250),
    );
    const paid = penaltyUpdates.find(
      (room) =>
        room.game?.lastAction.type === 'draw' &&
        room.game.lastAction.count === 2,
    )?.game;
    assert.ok(
      paid,
      'The server resolves an unavoidable penalty without a client pressing Draw',
    );
    assert.equal(
      paid.players[0].handCount,
      penaltyGame.players[0].handCount + 2,
    );
    await request(penaltyHost, 'room:leave', { roomId: penaltyRoomId });
    updates.length = 0;
    const started = await request(host, 'room:start', {
      roomId,
      rules: { allowStartingActionCard: false },
    });
    const before = started.room.game;
    assert.ok(before?.turnDeadlineAt);
    const deadline = before.turnDeadlineAt;
    const metadata = await request(host, 'room:ready', { roomId });
    assert.equal(metadata.room.game?.turnDeadlineAt, before.turnDeadlineAt);
    await new Promise((resolve) =>
      setTimeout(resolve, Math.max(0, deadline - Date.now()) + 300),
    );
    const expired = await waitForGame(
      (game) => !!game.autoPlayPlayerIds?.includes(created.playerId),
    );
    const privateGame = toPresentationGame(before);
    assert.ok(privateGame);
    const expected = getBotMove(privateGame, 0);
    assert.equal(
      expired.lastAction.type,
      expected.action === 'drawRequired' ? 'draw' : expected.action,
      'The missed turn uses the real bot recommendation',
    );
    if (expected.action === 'play') {
      assert.equal(
        expired.lastAction.type === 'play' && expired.lastAction.card.id,
        expected.cardId,
      );
      assert.equal(
        expired.players[0].handCount,
        before.players[0].handCount - 1,
      );
    }
    assert.equal(expired.players[0].isBot, false);
    const finished = await waitForGame(
      (game) => game.turnCount > before.turnCount,
    );
    const nextTurn = await yieldGuestTurn(finished);
    assert.ok(nextTurn.turnDeadlineAt);
    assert.ok(
      Math.abs(nextTurn.turnDeadlineAt - Date.now() - AUTO_PLAY_TURN_MS) < 500,
      'The next unattended turn has ten seconds',
    );

    // A different socket cannot claim this seat by supplying its player ID.
    const spoofed = await request(guest, 'game:action', {
      roomId,
      action: { type: 'resumeControl', playerId: created.playerId },
    });
    assert.ok(spoofed.room.game?.autoPlayPlayerIds?.includes(created.playerId));
    assert.equal(spoofed.room.game?.turnDeadlineAt, nextTurn.turnDeadlineAt);
    const rejected = (await host.timeout(5000).emitWithAck('game:action', {
      roomId,
      action: { type: 'play', cardId: 'missing-card' },
    })) as Ack<unknown>;
    assert.equal(
      rejected.ok,
      false,
      'Invalid actions cannot reclaim the clock',
    );

    const repeated = await waitForGame(
      (game) =>
        game.turnCount > nextTurn.turnCount ||
        (game.turnCount === nextTurn.turnCount && game.drawnThisTurn),
      AUTO_PLAY_TURN_MS + 5000,
    );
    assert.ok(repeated.autoPlayPlayerIds?.includes(created.playerId));
    const finishedAgain = await waitForGame(
      (game) => game.turnCount > nextTurn.turnCount,
    );
    const beforeReturn = await yieldGuestTurn(finishedAgain);
    const reclaimed = await request(host, 'game:action', {
      roomId,
      action: { type: 'resumeControl' },
    });
    const returned = reclaimed.room.game;
    assert.ok(returned?.turnDeadlineAt);
    assert.deepEqual(returned.autoPlayPlayerIds, []);
    assert.ok(
      Math.abs(returned.turnDeadlineAt - Date.now() - HUMAN_TURN_MS) < 500,
    );
    assert.equal(returned.turnCount, beforeReturn.turnCount);
    assert.deepEqual(
      returned.players.map((player) => player.handCount),
      beforeReturn.players.map((player) => player.handCount),
    );
    const activityAgain = await request(host, 'game:action', {
      roomId,
      action: { type: 'resumeControl' },
    });
    assert.equal(
      activityAgain.room.game?.turnDeadlineAt,
      returned.turnDeadlineAt,
      'Further activity cannot keep extending the clock',
    );
    console.log(
      'Server countdown passed: 30-second bot takeover, repeated 10-second turns, authenticated return, fresh human deadline and automatic penalties.',
    );
  } finally {
    sockets.forEach((socket) => socket.disconnect());
  }
}
void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
