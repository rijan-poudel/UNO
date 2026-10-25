// Exercises real Socket.IO acknowledgements and timed broadcasts. Start the socket server first.
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { io, type Socket } from 'socket.io-client';
import type { Ack, RoomSnapshot } from '../types/multiplayer';
const url = process.env.UNO_CHECK_SOCKET_URL ?? 'http://localhost:3001';
const sockets: Socket[] = [];
async function connect() {
  const socket = io(url, { transports: ['websocket'], forceNew: true });
  sockets.push(socket);
  await new Promise<void>((resolve, reject) => {
    socket.once('connect', resolve);
    socket.once('connect_error', reject);
  });
  return socket;
}
async function request<T>(
  socket: Socket,
  event: string,
  payload: unknown,
): Promise<T> {
  const ack = (await socket
    .timeout(5000)
    .emitWithAck(event, payload)) as Ack<T>;
  assert.equal(ack.ok, true, ack.ok ? '' : ack.error);

  return ack.data;
}
async function main() {
  try {
    const host = await connect();
    const guest = await connect();
    const hostDevice = randomBytes(12).toString('hex');
    const guestDevice = randomBytes(12).toString('hex');
    const created = await request<{ room: RoomSnapshot; playerId: string }>(
      host,
      'room:create',
      { playerName: 'Smoke host', deviceId: hostDevice },
    );
    const roomId = created.room.roomId;
    assert.match(
      roomId,
      /^[A-Z2-9]{6}$/,
      'Room codes survive UI normalization',
    );
    const joined = await request<{ room: RoomSnapshot; playerId: string }>(
      guest,
      'room:join',
      { roomId, playerName: 'Smoke guest', deviceId: guestDevice },
    );
    assert.equal(joined.room.players.length, 2);
    const roomRules = {
      startingHandSize: 5,
      stackDraw2: true,
      mustDeclareUno: false,
    };
    await request(host, 'room:set-rules', { roomId, rules: roomRules });
    const published = await request<{ room: RoomSnapshot }>(
      guest,
      'room:ready',
      { roomId },
    );
    assert.equal(published.room.rules?.startingHandSize, 5);
    assert.equal(published.room.rules?.mustDeclareUno, false);
    assert.equal(published.room.rules?.stackDraw2, true);
    const guestEdit = (await guest.timeout(5000).emitWithAck('room:set-rules', {
      roomId,
      rules: { startingHandSize: 9 },
    })) as Ack<unknown>;
    assert.equal(
      guestEdit.ok,
      false,
      'Only the host can change published room rules',
    );
    for (const rules of [
      { startingHandSize: 1e100 },
      { stackDraw2: 'false' },
      { maxPlayers: 100 },
    ]) {
      const rejected = (await host
        .timeout(5000)
        .emitWithAck('room:start', { roomId, rules })) as Ack<unknown>;
      assert.equal(rejected.ok, false, 'Invalid rule payloads are rejected');
    }
    const unchanged = await request<{ room: RoomSnapshot }>(
      guest,
      'room:ready',
      { roomId },
    );
    assert.equal(
      unchanged.room.started,
      false,
      'Rejected starts leave the lobby intact',
    );
    assert.equal(unchanged.room.game, null);

    await request(host, 'room:add-bot', { roomId });
    // Remove a seat, then add a new one: room/game identifiers must still agree.
    await request(host, 'room:kick', {
      roomId,
      targetPlayerId: joined.playerId,
    });
    const rejoined = await request<{ room: RoomSnapshot; playerId: string }>(
      guest,
      'room:join',
      { roomId, playerName: 'Smoke guest', deviceId: guestDevice },
    );
    for (let i = 0; i < 3; i++) await request(host, 'room:add-bot', { roomId });
    const full = (await host
      .timeout(5000)
      .emitWithAck('room:add-bot', { roomId })) as Ack<unknown>;
    assert.equal(full.ok, false, 'Six-seat limit is enforced');
    // The live socket process must use the same opener semantics as the pure engine.
    for (let deal = 0; deal < 24; deal++) {
      const opened = await request<{ room: RoomSnapshot }>(host, 'room:start', {
        roomId,
        rules: { maxPlayers: 6, allowStartingActionCard: true },
      });
      const game = opened.room.game;
      assert.ok(game);
      const opener = game.discardPile[0];
      assert.notEqual(opener.color, 'wild');
      assert.equal(
        game.pendingDraw,
        opener.value === 'draw2' ? 2 : 0,
        'Online opening penalties match the engine',
      );
      assert.equal(game.direction, opener.value === 'reverse' ? -1 : 1);
      if (opener.value === 'skip') assert.equal(game.currentPlayerIndex, 1);
    }
    const updates: Array<{ at: number; room: RoomSnapshot }> = [];
    host.on('room:update', (room: RoomSnapshot) =>
      updates.push({ at: Date.now(), room }),
    );
    const started = await request<{ room: RoomSnapshot }>(host, 'room:start', {
      roomId,
      rules: { maxPlayers: 6, allowStartingActionCard: false },
    });
    assert.deepEqual(
      started.room.game?.players.map((p) => p.id),
      started.room.players.map((p) => p.playerId),
    );
    assert.equal(
      started.room.game?.turnCount,
      0,
      'Initial deal is broadcast before bot actions',
    );
    const before = started.room.game;
    assert.ok(before);
    const currentId = before.players[before.currentPlayerIndex].id;
    const actor = currentId === rejoined.playerId ? guest : host;
    const prematurePass = (await actor
      .timeout(5000)
      .emitWithAck('game:action', {
        roomId,
        action: { type: 'pass' },
      })) as Ack<unknown>;
    assert.equal(
      prematurePass.ok,
      false,
      'Clients cannot pass without drawing',
    );
    const drawn = await request<{ room: RoomSnapshot }>(actor, 'game:action', {
      roomId,
      action: { type: 'draw' },
    });
    assert.ok(
      before.turnDeadlineAt && before.turnDeadlineAt > Date.now(),
      'Server publishes a human-turn deadline',
    );
    assert.equal(
      drawn.room.game?.turnDeadlineAt,
      before.turnDeadlineAt,
      'Online draw preserves the original deadline',
    );
    const repeatedDraw = (await actor.timeout(5000).emitWithAck('game:action', {
      roomId,
      action: { type: 'draw' },
    })) as Ack<unknown>;
    assert.equal(
      repeatedDraw.ok,
      false,
      'Clients cannot draw twice on one turn',
    );

    assert.equal(
      drawn.room.game?.lastAction.type,
      'draw',
      'Human action is not swallowed by a bot loop',
    );
    await request(actor, 'game:action', { roomId, action: { type: 'pass' } });
    await new Promise((resolve) => setTimeout(resolve, 3300));
    const turns = updates.filter(
      (entry, i) =>
        i > 0 &&
        entry.room.game?.turnCount !== updates[i - 1].room.game?.turnCount,
    );
    assert.ok(turns.length >= 1);
    for (let i = 1; i < turns.length; i++)
      assert.ok(
        turns[i].at - turns[i - 1].at >= 650,
        'Each automated turn is paced',
      );
    guest.disconnect();
    const replacement = await connect();
    const resumed = await request<{ room: RoomSnapshot; playerId: string }>(
      replacement,
      'room:join',
      { roomId, playerName: 'Smoke guest', deviceId: guestDevice },
    );
    assert.equal(
      resumed.playerId,
      rejoined.playerId,
      'Reconnect keeps the player identity',
    );
    assert.equal(
      resumed.room.players.length,
      6,
      'Reconnect does not add a seat',
    );
    const solo = await connect();
    const soloDevice = randomBytes(12).toString('hex');
    const soloRoom = await request<{ room: RoomSnapshot; playerId: string }>(
      solo,
      'room:create',
      { playerName: 'Solo host', deviceId: soloDevice },
    );
    await request(solo, 'room:add-bot', { roomId: soloRoom.room.roomId });
    await request(solo, 'room:start', {
      roomId: soloRoom.room.roomId,
      rules: { allowStartingActionCard: false },
    });
    solo.disconnect();
    const soloReturn = await connect();
    const restoredSolo = await request<{
      room: RoomSnapshot;
      playerId: string;
    }>(soloReturn, 'room:join', {
      roomId: soloRoom.room.roomId,
      playerName: 'Solo host',
      deviceId: soloDevice,
    });
    assert.equal(
      restoredSolo.playerId,
      soloRoom.playerId,
      'The last human can refresh without losing the room',
    );
    await new Promise((resolve) => setTimeout(resolve, 900));
    const afterReconnect = await request<{ room: RoomSnapshot }>(
      soloReturn,
      'room:ready',
      { roomId: soloRoom.room.roomId },
    );
    assert.equal(
      afterReconnect.room.game?.turnCount,
      restoredSolo.room.game?.turnCount,
      'A pending bot timer cannot move for a reconnected human',
    );
    // Remote refresh can arrive while the previous transport still looks live.
    const overlap = await connect();
    const superseded = new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error('Old connection was not notified')),
        3000,
      );
      soloReturn.once('room:kicked', () => {
        clearTimeout(timeout);
        resolve();
      });
    });
    const transferred = await request<{ room: RoomSnapshot; playerId: string }>(
      overlap,
      'room:join',
      {
        roomId: soloRoom.room.roomId,
        playerName: 'Solo host',
        deviceId: soloDevice,
      },
    );
    await superseded;
    assert.equal(
      transferred.playerId,
      restoredSolo.playerId,
      'Overlapping refresh keeps the seat',
    );
    assert.equal(
      transferred.room.players.length,
      2,
      'Overlapping refresh does not add a player',
    );
    const staleAction = (await soloReturn
      .timeout(5000)
      .emitWithAck('game:action', {
        roomId: soloRoom.room.roomId,
        action: { type: 'draw' },
      })) as Ack<unknown>;
    assert.equal(
      staleAction.ok,
      false,
      'Superseded transport cannot play for the seat',
    );
    soloReturn.disconnect();
    const afterOldDisconnect = await request<{ room: RoomSnapshot }>(
      overlap,
      'room:ready',
      { roomId: soloRoom.room.roomId },
    );
    assert.equal(
      afterOldDisconnect.room.players.find(
        (p) => p.playerId === transferred.playerId,
      )?.connected,
      true,
      'Late old disconnect cannot evict the new connection',
    );
    console.log(
      'Passed: create/join/kick, six seats, stable IDs, separate bot broadcasts, turn pacing, reconnect, last-human refresh, and overlapping connection handoff.',
    );
  } finally {
    sockets.forEach((socket) => socket.disconnect());
  }
}
void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
