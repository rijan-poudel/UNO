// Real server clock: connected humans expire without a client sending an action.
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { io, type Socket } from 'socket.io-client';
import type { Ack, RoomSnapshot } from '../types/multiplayer';
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
    let penaltyGame: RoomSnapshot['game'] = null;
    for (let attempt = 0; attempt < 200 && !penaltyGame; attempt++) {
      const deal = await request(host, 'room:start', {
        roomId,
        rules: {
          allowStartingActionCard: true,
          stackDraw2: false,
          allowWild4OnDraw2: false,
        },
      });
      if (deal.room.game?.pendingDraw === 2) penaltyGame = deal.room.game;
    }
    assert.ok(penaltyGame, 'Exercise a real draw-two opener');
    await new Promise((resolve) => setTimeout(resolve, 1250));
    const paid = updates.find(
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
    const expired = updates.find(
      (room) => room.game && room.game.turnCount > before.turnCount,
    )?.game;
    assert.ok(
      expired,
      'An idle connected human expires without a client action',
    );
    assert.equal(expired.currentPlayerIndex, 1);
    assert.equal(expired.players[0].handCount, before.players[0].handCount + 1);
    assert.equal(expired.lastAction.type, 'draw');
    assert.ok(
      expired.turnDeadlineAt && expired.turnDeadlineAt > before.turnDeadlineAt,
    );
    console.log(
      'Server countdown passed: 30-second expiry, automatic draw/pass, metadata continuity and next-player deadline.',
    );
  } finally {
    sockets.forEach((socket) => socket.disconnect());
  }
}
void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
