// Exercises real Socket.IO acknowledgements and timed broadcasts. Start the socket server first.
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { io, type Socket } from 'socket.io-client';
import {
  readRoomSession,
  resolveSocketEndpoint,
} from '../lib/socketConnection';
import {
  isNewerRoomSnapshot,
  reconcileRoomUpdate,
  reconcileAcquisitionAck,
  shouldDiscardStaleMembership,
} from '../lib/roomMembership';
import type { Ack, RoomSnapshot } from '../types/multiplayer';

// ── Regression Coverage: Snapshot Ordering & Transitions ──────────
function createMockSnapshot(
  overrides: Partial<RoomSnapshot> = {},
): RoomSnapshot {
  return {
    roomId: 'MOCK01',
    hostPlayerId: 'player-host',
    started: false,
    game: null,
    pendingColorChoice: null,
    players: [
      {
        playerId: 'player-host',
        name: 'Host',
        connected: true,
        ready: false,
        isBot: false,
        avatarId: 'red',
      },
      {
        playerId: 'player-guest',
        name: 'Guest',
        connected: true,
        ready: false,
        isBot: false,
        avatarId: 'blue',
      },
    ],
    rules: {
      startingHandSize: 7,
    },
    ...overrides,
  };
}

// 1. Finished round -> lobby: accepted (Edit table transition)
const finishedRoundSnapshot = createMockSnapshot({
  started: true,
  game: {
    roundId: 'round-1',
    turnCount: 24,
    winnerId: 'player-host',
    players: [],
    deckCount: 40,
    discardPile: [],
    currentColor: 'red',
    currentValue: '5',
    currentPlayerIndex: 0,
    direction: 1,
    drawnThisTurn: false,
  } as unknown as RoomSnapshot['game'],
  tableScore: {
    completedRounds: 1,
    wins: { 'player-host': 1, 'player-guest': 0 },
    lastRoundId: 'round-1',
  },
});

const lobbySnapshot = createMockSnapshot({
  started: false,
  game: null,
  tableScore: {
    completedRounds: 1,
    wins: { 'player-host': 1, 'player-guest': 0 },
    lastRoundId: 'round-1',
  },
});

assert.equal(
  isNewerRoomSnapshot(finishedRoundSnapshot, lobbySnapshot),
  true,
  'Regression check: Finished round -> lobby must be accepted (Edit table transition)',
);

// 2. Lobby -> newly dealt round: accepted
const newlyDealtSnapshot = createMockSnapshot({
  started: true,
  game: {
    roundId: 'round-2',
    turnCount: 0,
    winnerId: null,
    players: [],
    deckCount: 70,
    discardPile: [],
    currentColor: 'blue',
    currentValue: '3',
    currentPlayerIndex: 0,
    direction: 1,
    drawnThisTurn: false,
  } as unknown as RoomSnapshot['game'],
  tableScore: {
    completedRounds: 1,
    wins: { 'player-host': 1, 'player-guest': 0 },
    lastRoundId: 'round-1',
  },
});

assert.equal(
  isNewerRoomSnapshot(lobbySnapshot, newlyDealtSnapshot),
  true,
  'Regression check: Lobby -> newly dealt round must be accepted',
);

// 3. Results -> rematch: accepted
assert.equal(
  isNewerRoomSnapshot(finishedRoundSnapshot, newlyDealtSnapshot),
  true,
  'Regression check: Results -> rematch must be accepted',
);

// 4. Readiness acknowledgment arriving after a new round: cannot restore old results
assert.equal(
  isNewerRoomSnapshot(newlyDealtSnapshot, finishedRoundSnapshot),
  false,
  'Regression check: Readiness acknowledgment from completed round cannot overwrite a new round with old results',
);

// Active game in progress must reject stale lobby snapshots
const inProgressRound = createMockSnapshot({
  started: true,
  game: {
    roundId: 'round-1',
    turnCount: 10,
    winnerId: null,
    players: [],
    deckCount: 50,
    discardPile: [],
    currentColor: 'green',
    currentValue: '2',
    currentPlayerIndex: 1,
    direction: 1,
    drawnThisTurn: false,
  } as unknown as RoomSnapshot['game'],
});
assert.equal(
  isNewerRoomSnapshot(inProgressRound, lobbySnapshot),
  false,
  'Active game in progress must reject stale lobby snapshots',
);

// 5. Leaving while an operation is pending: late updates cannot reopen the room
{
  let currentRoom: RoomSnapshot | null = createMockSnapshot();
  let membershipRevision = 1;
  const pendingOpRevision = membershipRevision;

  // Player leaves room: membership revision advances and current room is reset to null
  membershipRevision++;
  currentRoom = null;

  // Delayed acquisition reply arrives: discarded by shouldDiscardStaleMembership
  let leaveEmittedFor: string | null = null;
  const isStale = shouldDiscardStaleMembership(
    pendingOpRevision,
    membershipRevision,
    newlyDealtSnapshot,
    (roomId) => {
      leaveEmittedFor = roomId;
    },
  );
  assert.equal(
    isStale,
    true,
    'Delayed operation ack must detect stale membership revision',
  );
  assert.equal(
    leaveEmittedFor,
    newlyDealtSnapshot.roomId,
    'Delayed ack must trigger server-side leave cleanup if server joined room',
  );

  // Reconcile acquisition ack helper verifies rejection
  const ackResult = reconcileAcquisitionAck(
    pendingOpRevision,
    membershipRevision,
    newlyDealtSnapshot,
    currentRoom,
  );
  assert.equal(
    ackResult,
    null,
    'Delayed acquisition ack must be rejected by reconcileAcquisitionAck after leave',
  );

  // Late room:update broadcast arrives: rejected by reconcileRoomUpdate because currentRoom is null
  const updateResult = reconcileRoomUpdate(currentRoom, newlyDealtSnapshot);
  assert.equal(
    updateResult,
    null,
    'Late room:update broadcast must be rejected by reconcileRoomUpdate when outside the room',
  );
}
const cachedSession = { roomId: 'ABC234', playerName: 'Cached name' };
const unavailableStorage = () => {
  throw new Error('Blocked session storage');
};
assert.equal(
  readRoomSession(unavailableStorage, cachedSession),
  cachedSession,
  'Reconnect retains the live room when browser storage is blocked',
);
assert.equal(readRoomSession(unavailableStorage), null);
let storedReads = 0;
assert.equal(
  readRoomSession(() => {
    storedReads++;
    return JSON.stringify(cachedSession);
  }, null),
  null,
  'Explicitly leaving suppresses a stale stored room even if removal failed',
);
assert.equal(storedReads, 0);
assert.deepEqual(
  readRoomSession(() => JSON.stringify(cachedSession)),
  cachedSession,
);
for (const raw of ['{', 'null', JSON.stringify({ roomId: 'invalid' })])
  assert.equal(
    readRoomSession(() => raw),
    null,
  );
const secureLocation = {
  protocol: 'https:',
  hostname: 'uno.example.com',
  port: '',
};
assert.equal(
  resolveSocketEndpoint('http://rooms.example.com', secureLocation),
  null,
);
assert.equal(
  resolveSocketEndpoint('ws://rooms.example.com', secureLocation),
  null,
);
assert.equal(
  resolveSocketEndpoint('wss://rooms.example.com', secureLocation),
  'wss://rooms.example.com/',
);

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
      botDifficulty: 'tactical',
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
    assert.equal(published.room.rules?.botDifficulty, 'tactical');
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
      { botDifficulty: 'impossible' },
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
    // Sample fresh tables; an active round must never be replaced to get a new opener.
    const openerHost = await connect();
    for (let deal = 0; deal < 24; deal++) {
      const fresh = await request<{ room: RoomSnapshot }>(
        openerHost,
        'room:create',
        {
          playerName: 'Opener host',
          deviceId: randomBytes(12).toString('hex'),
        },
      );
      const openerRoomId = fresh.room.roomId;
      await request(openerHost, 'room:add-bot', { roomId: openerRoomId });
      const opened = await request<{ room: RoomSnapshot }>(
        openerHost,
        'room:start',
        {
          roomId: openerRoomId,
          rules: { maxPlayers: 6, allowStartingActionCard: true },
        },
      );
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
      await request(openerHost, 'room:leave', { roomId: openerRoomId });
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
    assert.equal(started.room.game?.rules.botDifficulty, 'tactical');
    const repeatedDeals = await Promise.all(
      [host, host, guest].map(
        (socket) =>
          socket.timeout(5000).emitWithAck('room:start', {
            roomId,
            rules: { startingHandSize: 9 },
          }) as Promise<Ack<unknown>>,
      ),
    );
    assert.ok(
      repeatedDeals.every((ack) => !ack.ok),
      'Duplicate or guest deals cannot replace an active round',
    );
    const intact = await request<{ room: RoomSnapshot }>(host, 'room:ready', {
      roomId,
    });
    assert.deepEqual(
      intact.room.game,
      started.room.game,
      'Rejected deals preserve cards, clock, round identity and score',
    );
    assert.deepEqual(
      intact.room.rules,
      started.room.rules,
      'Rejected deals cannot change the next table rules',
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
      { roomId, playerName: 'Renamed guest', deviceId: guestDevice },
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
    assert.equal(
      resumed.room.players.find(
        (player) => player.playerId === resumed.playerId,
      )?.name,
      'Renamed guest',
    );
    assert.equal(
      resumed.room.game?.players.find(
        (player) => player.id === resumed.playerId,
      )?.name,
      'Renamed guest',
      'Rejoining with an updated profile keeps lobby and live-game names in sync',
    );
    await request(host, 'room:leave', { roomId });
    const promoted = await request<{ room: RoomSnapshot }>(
      replacement,
      'room:ready',
      { roomId },
    );
    assert.equal(
      promoted.room.hostPlayerId,
      rejoined.playerId,
      'Leaving passes hosting to a connected human',
    );
    const oldHost = await request<{ room: RoomSnapshot; playerId: string }>(
      host,
      'room:join',
      {
        roomId,
        playerName: 'Smoke host',
        deviceId: hostDevice,
      },
    );
    assert.equal(oldHost.playerId, created.playerId);
    assert.equal(
      oldHost.room.hostPlayerId,
      rejoined.playerId,
      'A returning former host does not take over from the current human host',
    );
    await request(replacement, 'room:leave', { roomId });
    await request(host, 'room:leave', { roomId });
    const firstBack = await request<{ room: RoomSnapshot; playerId: string }>(
      replacement,
      'room:join',
      {
        roomId,
        playerName: 'Smoke guest',
        deviceId: guestDevice,
      },
    );
    assert.equal(
      firstBack.room.hostPlayerId,
      rejoined.playerId,
      'The first human back can host even when earlier seats are bots',
    );
    const formerHostRequest = (await host
      .timeout(5000)
      .emitWithAck('room:start', { roomId })) as Ack<unknown>;
    assert.equal(
      formerHostRequest.ok,
      false,
      'A departed socket cannot control the table',
    );
    const absentRoom = await request<{ room: RoomSnapshot; playerId: string }>(
      openerHost,
      'room:create',
      { playerName: 'Absent host', deviceId: randomBytes(12).toString('hex') },
    );
    const waitingDevice = randomBytes(12).toString('hex');
    const waiting = await request<{ room: RoomSnapshot; playerId: string }>(
      host,
      'room:join',
      {
        roomId: absentRoom.room.roomId,
        playerName: 'Returning guest',
        deviceId: waitingDevice,
      },
    );
    await request(openerHost, 'room:start', {
      roomId: absentRoom.room.roomId,
      rules: { allowStartingActionCard: false },
    });
    await request(openerHost, 'room:leave', { roomId: absentRoom.room.roomId });
    await request(host, 'room:leave', { roomId: absentRoom.room.roomId });
    const continued = new Promise<RoomSnapshot>((resolve, reject) => {
      const timer = setTimeout(() => {
        host.off('room:update', onUpdate);
        reject(
          new Error('An absent player’s turn did not resume after reconnect'),
        );
      }, 4000);
      const onUpdate = (room: RoomSnapshot) => {
        if (
          room.roomId === absentRoom.room.roomId &&
          room.game &&
          room.game.lastAction.type !== 'init'
        ) {
          clearTimeout(timer);
          host.off('room:update', onUpdate);
          resolve(room);
        }
      };
      host.on('room:update', onUpdate);
    });
    const returningGuest = await request<{
      room: RoomSnapshot;
      playerId: string;
    }>(host, 'room:join', {
      roomId: absentRoom.room.roomId,
      playerName: 'Returning guest',
      deviceId: waitingDevice,
    });
    assert.equal(returningGuest.room.hostPlayerId, waiting.playerId);
    assert.equal(
      returningGuest.room.game?.players[
        returningGuest.room.game.currentPlayerIndex
      ].id,
      absentRoom.playerId,
    );
    const resumedTurn = await continued;
    assert.equal(
      resumedTurn.game?.roundId,
      returningGuest.room.game?.roundId,
      'Resuming bots continues the same round',
    );
    assert.ok(
      resumedTurn.game?.players
        .filter((player) => player.id !== waiting.playerId)
        .every((player) => !player.hand),
      'Reconnecting cannot expose absent players’ hands',
    );
    await request(host, 'room:leave', { roomId: absentRoom.room.roomId });

    const waitingRoom = await request<{ room: RoomSnapshot }>(
      openerHost,
      'room:create',
      {
        playerName: 'Waiting host',
        deviceId: randomBytes(12).toString('hex'),
      },
    );
    await request(openerHost, 'room:add-bot', {
      roomId: waitingRoom.room.roomId,
    });
    await request(openerHost, 'room:leave', {
      roomId: waitingRoom.room.roomId,
    });
    const lateArrival = await request<{ room: RoomSnapshot; playerId: string }>(
      host,
      'room:join',
      {
        roomId: waitingRoom.room.roomId,
        playerName: 'New host',
        deviceId: randomBytes(12).toString('hex'),
      },
    );
    assert.equal(
      lateArrival.room.hostPlayerId,
      lateArrival.playerId,
      'A new human can host a lobby left with only bots',
    );
    await request(host, 'room:set-rules', {
      roomId: waitingRoom.room.roomId,
      rules: { startingHandSize: 5 },
    });
    await request(host, 'room:leave', { roomId: waitingRoom.room.roomId });
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
    assert.equal(
      restoredSolo.room.hostPlayerId,
      restoredSolo.playerId,
      'The last human returns as host rather than leaving control with a bot',
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
    assert.equal(
      afterOldDisconnect.room.hostPlayerId,
      transferred.playerId,
      'An overlapping refresh preserves hosting',
    );
    console.log(
      'Passed: create/join/kick, six seats, stable IDs, protected active rounds, human host succession, resumed absent-player turns, separate bot broadcasts, turn pacing, reconnect, last-human refresh, and overlapping connection handoff.',
    );
  } finally {
    sockets.forEach((socket) => socket.disconnect());
  }
}
void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
