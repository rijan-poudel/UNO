import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';
import { Server } from 'socket.io';
import { initializeGame } from '../lib/gameSetup';
import { validateGameRules } from '../lib/validateGameRules';
import { toGameView, toPresentationGame } from '../lib/gameView';
import { recordTableWin, startTableRound } from '../lib/tableScore';
import { defaultRules, type GameRules } from '../types/rules';
import {
  playCard,
  drawOneCard,
  drawRequiredCards,
  passTurn,
  declareUno,
  callOutUno,
} from '../lib/gameActions';
import { getBotMove } from '../lib/botSupport';
import { canJumpInPlay, canPlayCard } from '../lib/gameRules';
import {
  BOT_TURN_MS,
  FORCED_DRAW_DELAY_MS,
  expireTurn,
  hasForcedPenalty,
  withTurnDeadline,
} from '../lib/turnFlow';
import type { GameState, TableScore } from '../types/game';
import type {
  Ack,
  AddBotPayload,
  CreateRoomPayload,
  DismissFriendInvitePayload,
  FriendPresenceState,
  FriendInvite,
  KickPlayerPayload,
  LeaveRoomPayload,
  JoinRoomPayload,
  PresencePayload,
  RespondFriendInvitePayload,
  RoomActionPayload,
  RoomPlayer,
  RoomSnapshot as PrivateRoomSnapshot,
  SendFriendInvitePayload,
  StartRoomPayload,
  ReadyPayload,
  UpdateRulesPayload,
  PendingColorChoice,
  ReturnToLobbyPayload,
} from '../types/multiplayer';

const PORT = Number(process.env.PORT ?? process.env.UNO_SOCKET_PORT ?? 3001);
const MAX_ROOM_PLAYERS = 6;

// Legacy browsers receive anonymous backs in the old shape, never secret faces.
type RoomSnapshot = Omit<PrivateRoomSnapshot, 'game'> & {
  game: PrivateRoomSnapshot['game'] | GameState;
};

const configuredCorsOrigins = (process.env.UNO_CORS_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);

function isAllowedOrigin(origin: string): boolean {
  const normalized = origin.trim().replace(/\/$/, '');

  const isLocalhostOrigin =
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(normalized);
  const isLanOrigin =
    /^https?:\/\/192\.168\.\d+\.\d+(:\d+)?$/i.test(normalized) ||
    /^https?:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/i.test(normalized) ||
    /^https?:\/\/172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+(:\d+)?$/i.test(normalized);

  return (
    isLocalhostOrigin ||
    isLanOrigin ||
    configuredCorsOrigins.includes(normalized)
  );
}

interface ServerRoomPlayer extends RoomPlayer {
  socketId: string;
  deviceId: string;
}

interface ServerRoom {
  tableScore?: TableScore;
  roomId: string;
  hostPlayerId: string;
  players: ServerRoomPlayer[];
  started: boolean;
  game: GameState | null;
  pendingColorChoice: PendingColorChoice | null;
  rules?: Partial<GameRules>;
}

interface PresenceRecord {
  socketId: string;
  deviceId: string;
  friendCode: string;
  playerName: string;
  lastSeenAt: number;
}

interface PendingInviteRecord extends FriendInvite {
  toFriendCode: string;
}

const rooms = new Map<string, ServerRoom>();
const turnClocks = new Map<
  string,
  {
    game: GameState;
    signature: string;
    timer: ReturnType<typeof setTimeout> | null;
  }
>();
const orphanedRoomTimers = new Map<string, ReturnType<typeof setTimeout>>();
const playerBySocket = new Map<string, { roomId: string; playerId: string }>();
const presenceBySocket = new Map<string, PresenceRecord>();
const presenceByFriendCode = new Map<string, PresenceRecord>();
const pendingInvites = new Map<string, PendingInviteRecord>();

function makeRoomId(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from(
    randomBytes(6),
    (byte) => alphabet[byte % alphabet.length],
  ).join('');
}

function makePlayerId(existingCount: number): string {
  return `player_${existingCount}`;
}

function makeInviteId(): string {
  return `invite_${randomBytes(12).toString('hex')}`;
}

function normalizeFriendCode(value: string): string {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 8);
}

function makeNextPlayerId(players: ServerRoomPlayer[]): string {
  const existingIds = new Set(players.map((player) => player.playerId));
  let cursor = 0;
  while (existingIds.has(`player_${cursor}`)) {
    cursor += 1;
  }
  return `player_${cursor}`;
}

function toSnapshot(
  room: ServerRoom,
  viewerId: string,
  socketId: string,
): RoomSnapshot {
  if (room.game) {
    room.game = recordTableWin(room.game);
    room.tableScore = room.game.tableScore;
  }
  synchronizeRoomTurn(room);
  const view = room.game ? toGameView(room.game, viewerId) : null;
  const privateFormat =
    io.sockets.sockets.get(socketId)?.handshake.auth.protocolVersion === 2;
  return {
    tableScore: room.tableScore,
    roomId: room.roomId,
    hostPlayerId: room.hostPlayerId,
    players: room.players.map((p) => {
      const presence = p.socketId
        ? presenceBySocket.get(p.socketId)
        : undefined;
      return {
        playerId: p.playerId,
        name: p.name,
        connected: p.connected,
        isBot: p.isBot,
        friendCode: presence?.friendCode,
        ready: p.ready,
      };
    }),
    started: room.started,
    game: privateFormat ? view : toPresentationGame(view),
    pendingColorChoice: room.pendingColorChoice
      ? room.pendingColorChoice.playerId === viewerId
        ? room.pendingColorChoice
        : { playerId: room.pendingColorChoice.playerId }
      : null,
    rules: room.rules ?? defaultRules,
  };
}

function snapshotForSocket(room: ServerRoom, socketId: string): RoomSnapshot {
  const member = playerBySocket.get(socketId);
  if (
    !member ||
    member.roomId !== room.roomId ||
    !room.players.some(
      (player) =>
        player.playerId === member.playerId && player.socketId === socketId,
    )
  )
    throw new Error('You are not in this room.');
  return toSnapshot(room, member.playerId, socketId);
}

// One authoritative deadline per turn, shared by all clients and reconnects.
function synchronizeRoomTurn(room: ServerRoom): void {
  const previous = turnClocks.get(room.roomId);
  if (
    !room.started ||
    !room.game ||
    room.game.winnerId ||
    !room.players.some((player) => player.connected)
  ) {
    if (previous?.timer) clearTimeout(previous.timer);
    turnClocks.delete(room.roomId);
    return;
  }
  room.game = withTurnDeadline(previous?.game ?? null, room.game);
  const game = room.game;
  const current = game.players[game.currentPlayerIndex];
  const humanConnected = room.players.some(
    (player) =>
      player.playerId === current.id && player.connected && !player.isBot,
  );
  const forced =
    humanConnected && !room.pendingColorChoice && hasForcedPenalty(game);
  const signature = `${game.turnCount}:${current.id}:${game.turnDeadlineAt}:${forced}:${humanConnected}`;
  if (previous?.signature === signature) {
    previous.game = game;
    return;
  }
  if (previous?.timer) clearTimeout(previous.timer);
  const record: {
    game: GameState;
    signature: string;
    timer: ReturnType<typeof setTimeout> | null;
  } = { game, signature, timer: null };
  turnClocks.set(room.roomId, record);
  if (!humanConnected || !game.turnDeadlineAt) return;
  const delay = forced
    ? Math.min(
        FORCED_DRAW_DELAY_MS,
        Math.max(0, game.turnDeadlineAt - Date.now()),
      )
    : Math.max(0, game.turnDeadlineAt - Date.now());
  record.timer = setTimeout(() => {
    if (
      rooms.get(room.roomId) !== room ||
      turnClocks.get(room.roomId) !== record ||
      !room.game ||
      room.game.winnerId
    )
      return;
    const live = room.game;
    if (
      live.currentPlayerIndex !== game.currentPlayerIndex ||
      live.turnCount !== game.turnCount
    )
      return;
    try {
      if (forced && (room.pendingColorChoice || !hasForcedPenalty(live))) {
        turnClocks.delete(room.roomId);
        synchronizeRoomTurn(room);
        return;
      }
      room.pendingColorChoice = null;
      room.game = forced
        ? drawRequiredCards(live, live.currentPlayerIndex)
        : expireTurn(live);
      broadcastRoom(io, room);
      runOfflineBotTurns(room);
    } catch (error) {
      console.error('Could not resolve automatic turn:', error);
    }
  }, delay);
}

function createRoomForPlayer(
  socketId: string,
  playerName: string,
  deviceId: string,
  rules?: Partial<GameRules>,
): { room: ServerRoom; playerId: string } {
  let roomId = makeRoomId();
  while (rooms.has(roomId)) {
    roomId = makeRoomId();
  }

  const playerId = makePlayerId(0);
  const room: ServerRoom = {
    roomId,
    hostPlayerId: playerId,
    players: [
      {
        playerId,
        socketId,
        name: playerName,
        connected: true,
        deviceId,
        isBot: false,
        ready: false,
      },
    ],
    started: false,
    game: null,
    pendingColorChoice: null,
    rules: rules ? validateGameRules(rules) : { ...defaultRules },
  };

  rooms.set(roomId, room);
  playerBySocket.set(socketId, { roomId, playerId });
  return { room, playerId };
}

// Keep a connected human in control. During an empty room's reconnect window,
// retain a human seat so bots can never strand the table's host-only controls.
function ensureHumanHost(room: ServerRoom): void {
  const host = room.players.find(
    (player) => player.playerId === room.hostPlayerId && !player.isBot,
  );
  if (host?.connected) return;
  const nextHost =
    room.players.find((player) => !player.isBot && player.connected) ??
    host ??
    room.players.find((player) => !player.isBot);
  if (nextHost) room.hostPlayerId = nextHost.playerId;
}

function joinRoomAsPlayer(
  room: ServerRoom,
  socketId: string,
  playerName: string,
  deviceId: string,
  io: Server,
): string {
  const existingPlayerForDevice = room.players.find(
    (player) => player.deviceId === deviceId,
  );
  if (existingPlayerForDevice) {
    // A refresh may connect before the old transport closes. Move the known
    // device's seat atomically, revoking the stale socket before notifying it.
    const previousSocketId = existingPlayerForDevice.socketId;
    if (previousSocketId && previousSocketId !== socketId) {
      playerBySocket.delete(previousSocketId);
      io.sockets.sockets.get(previousSocketId)?.leave(room.roomId);
      io.to(previousSocketId).emit('room:kicked', {
        roomId: room.roomId,
        message: 'Your seat moved to another tab. You can keep playing there.',
      });
    }

    const cleanup = orphanedRoomTimers.get(room.roomId);
    if (cleanup) clearTimeout(cleanup);
    orphanedRoomTimers.delete(room.roomId);
    existingPlayerForDevice.socketId = socketId;
    existingPlayerForDevice.connected = true;
    existingPlayerForDevice.ready = false;
    existingPlayerForDevice.name = playerName;
    playerBySocket.set(socketId, {
      roomId: room.roomId,
      playerId: existingPlayerForDevice.playerId,
    });
    ensureHumanHost(room);
    runOfflineBotTurns(room);
    return existingPlayerForDevice.playerId;
  }

  if (room.players.length >= MAX_ROOM_PLAYERS) {
    throw new Error('Room is full.');
  }

  const playerId = makeNextPlayerId(room.players);
  room.tableScore = undefined;
  room.players.push({
    playerId,
    socketId,
    name: playerName,
    connected: true,
    deviceId,
    isBot: false,
    ready: false,
  });
  playerBySocket.set(socketId, { roomId: room.roomId, playerId });
  ensureHumanHost(room);
  runOfflineBotTurns(room);
  return playerId;
}

function nextBotName(room: ServerRoom): string {
  const botCount = room.players.filter((player) => player.isBot).length;
  return `Bot ${botCount + 1}`;
}

function addBotSeat(room: ServerRoom): void {
  room.tableScore = undefined;
  const playerId = makeNextPlayerId(room.players);
  room.players.push({
    playerId,
    socketId: '',
    deviceId: `bot:${room.roomId}:${playerId}`,
    name: nextBotName(room),
    connected: false,
    isBot: true,
    ready: true,
  });
}

function upsertPresence(socketId: string, payload: PresencePayload): string {
  const playerName = payload.playerName?.trim();
  const deviceId = payload.deviceId?.trim();
  const friendCode = normalizeFriendCode(payload.friendCode ?? '');
  if (!playerName || !deviceId || friendCode.length < 4) {
    throw new Error('Player name, device id and friend code are required.');
  }

  const existing = presenceByFriendCode.get(friendCode);
  if (
    existing &&
    existing.socketId !== socketId &&
    existing.deviceId !== deviceId
  ) {
    throw new Error('Friend code already in use.');
  }

  const previous = presenceBySocket.get(socketId);
  if (previous && previous.friendCode !== friendCode) {
    presenceByFriendCode.delete(previous.friendCode);
  }

  const record: PresenceRecord = {
    socketId,
    deviceId,
    friendCode,
    playerName,
    lastSeenAt: Date.now(),
  };
  presenceBySocket.set(socketId, record);
  presenceByFriendCode.set(friendCode, record);
  return friendCode;
}

function removePresence(socketId: string): void {
  const previous = presenceBySocket.get(socketId);
  if (!previous) return;
  presenceBySocket.delete(socketId);
  const existing = presenceByFriendCode.get(previous.friendCode);
  if (existing?.socketId === socketId) {
    presenceByFriendCode.delete(previous.friendCode);
  }
}

function removeInvite(inviteId: string, ioServer: Server): void {
  const invite = pendingInvites.get(inviteId);
  if (!invite) return;
  pendingInvites.delete(inviteId);

  const targetPresence = presenceByFriendCode.get(invite.toFriendCode);
  if (targetPresence) {
    ioServer
      .to(targetPresence.socketId)
      .emit('friend:invite:removed', { inviteId });
  }

  const senderMembership = Array.from(playerBySocket.entries()).find(
    ([, membership]) =>
      membership.playerId === invite.fromPlayerId &&
      membership.roomId === invite.roomId,
  );
  if (senderMembership) {
    ioServer
      .to(senderMembership[0])
      .emit('friend:invite:removed', { inviteId });
  }
}

function findSenderSocketIdForInvite(
  invite: PendingInviteRecord,
): string | null {
  const senderMembership = Array.from(playerBySocket.entries()).find(
    ([, membership]) =>
      membership.playerId === invite.fromPlayerId &&
      membership.roomId === invite.roomId,
  );
  return senderMembership ? senderMembership[0] : null;
}

function removeInvitesForRoom(roomId: string, ioServer: Server): void {
  for (const invite of pendingInvites.values()) {
    if (invite.roomId === roomId) {
      removeInvite(invite.inviteId, ioServer);
    }
  }
}

function leaveRoomForSocket(socketId: string, ioServer: Server): void {
  const membership = playerBySocket.get(socketId);
  if (!membership) return;

  playerBySocket.delete(socketId);
  const room = rooms.get(membership.roomId);
  if (!room) return;

  const playerIndex = room.players.findIndex(
    (player) => player.playerId === membership.playerId,
  );
  if (playerIndex === -1) return;

  const player = room.players[playerIndex];
  if (room.started) {
    player.connected = false;
    player.socketId = '';
    player.ready = true;

    runOfflineBotTurns(room);
  } else {
    room.players.splice(playerIndex, 1);
    room.tableScore = undefined;
  }
  ensureHumanHost(room);

  const hasConnectedPlayers = room.players.some((p) => p.connected);
  if (!hasConnectedPlayers) {
    const clock = turnClocks.get(room.roomId);
    if (clock?.timer) clearTimeout(clock.timer);
    turnClocks.delete(room.roomId);
    const timer = botTimers.get(room.roomId);
    if (timer) clearTimeout(timer);
    botTimers.delete(room.roomId);
    // Keep a short reconnect window when the final human refreshes their page.
    if (!orphanedRoomTimers.has(room.roomId)) {
      orphanedRoomTimers.set(
        room.roomId,
        setTimeout(() => {
          orphanedRoomTimers.delete(room.roomId);
          if (
            rooms.get(room.roomId) !== room ||
            room.players.some((p) => p.connected)
          )
            return;
          removeInvitesForRoom(room.roomId, ioServer);
          const clock = turnClocks.get(room.roomId);
          if (clock?.timer) clearTimeout(clock.timer);
          turnClocks.delete(room.roomId);
          rooms.delete(room.roomId);
        }, 45_000),
      );
    }
    return;
  }

  broadcastRoom(ioServer, room);
}

function broadcastRoom(io: Server, room: ServerRoom): void {
  for (const player of room.players) {
    if (player.connected && !player.isBot && player.socketId) {
      io.to(player.socketId).emit(
        'room:update',
        toSnapshot(room, player.playerId, player.socketId),
      );
    }
  }
}

function ackError<T>(message: string): Ack<T> {
  return { ok: false, error: message };
}

function ensureActor(
  room: ServerRoom,
  socketId: string,
): { actorIndex: number; actorPlayerId: string } {
  if (!room.game) {
    throw new Error('Game is not started yet.');
  }

  const actor = room.players.find((p) => p.socketId === socketId);
  if (!actor) {
    throw new Error('Player is not part of this room.');
  }

  const actorIndex = room.game.players.findIndex(
    (p) => p.id === actor.playerId,
  );
  if (actorIndex === -1) {
    throw new Error('Player not found in active game state.');
  }

  return { actorIndex, actorPlayerId: actor.playerId };
}

function handleGameAction(
  room: ServerRoom,
  socketId: string,
  payload: RoomActionPayload,
  ioServer: Server,
): void {
  if (!room.started || !room.game) {
    throw new Error('Game has not started.');
  }

  const { actorIndex } = ensureActor(room, socketId);
  const state = room.game;
  const activeChoice = room.pendingColorChoice;
  const actorPlayerId = state.players[actorIndex]?.id;
  const isActorTurn = state.currentPlayerIndex === actorIndex;
  const requireTurn = () => {
    if (!isActorTurn) {
      throw new Error('It is not your turn.');
    }
  };

  const action = payload.action;

  if (activeChoice && activeChoice.playerId !== actorPlayerId) {
    throw new Error('Waiting for active player to choose a color.');
  }

  if (
    activeChoice &&
    action.type !== 'play' &&
    action.type !== 'cancelWildChoice'
  ) {
    throw new Error('Choose a color for the selected wild card first.');
  }

  switch (action.type) {
    case 'prepareWild': {
      const card = state.players[actorIndex]?.hand.find(
        (entry) => entry.id === action.cardId,
      );
      if (!card) {
        throw new Error('Selected card is not in your hand.');
      }
      if (card.color !== 'wild') {
        throw new Error('Only wild-style cards can open color picker.');
      }
      if (!canPlayCard(card, state, actorIndex)) {
        throw new Error('That card cannot be played right now.');
      }

      room.pendingColorChoice = {
        playerId: state.players[actorIndex].id,
        cardId: card.id,
        cardValue: card.value,
      };

      // Auto-cancel if no color chosen within 30 seconds
      const pendingChoice = room.pendingColorChoice;
      setTimeout(() => {
        if (
          rooms.get(room.roomId) === room &&
          room.pendingColorChoice === pendingChoice
        ) {
          room.pendingColorChoice = null;
          broadcastRoom(ioServer, room);
          runOfflineBotTurns(room);
        }
      }, 30_000);

      break;
    }
    case 'cancelWildChoice': {
      if (!activeChoice) {
        break;
      }
      if (activeChoice.playerId !== actorPlayerId) {
        throw new Error('Only the active player can cancel color selection.');
      }
      room.pendingColorChoice = null;
      break;
    }
    case 'play': {
      if (!isActorTurn) {
        const jumpInCard = state.players[actorIndex]?.hand.find(
          (entry) => entry.id === action.cardId,
        );
        if (!jumpInCard || !canJumpInPlay(jumpInCard, state)) {
          throw new Error(
            'Only exact-match jump-in plays are allowed out of turn.',
          );
        }
      }
      if (activeChoice) {
        if (action.cardId !== activeChoice.cardId) {
          throw new Error('You must finish the selected wild card first.');
        }
        if (!action.chosenColor || action.chosenColor === 'wild') {
          throw new Error('Choose a color before playing this card.');
        }
      }
      room.game = playCard(
        state,
        actorIndex,
        action.cardId,
        action.chosenColor,
      );
      room.pendingColorChoice = null;
      break;
    }
    case 'draw': {
      requireTurn();
      if (state.pendingDraw > 0) {
        room.game = drawRequiredCards(state, actorIndex);
      } else {
        room.game = drawOneCard(state, actorIndex);
      }
      room.pendingColorChoice = null;
      break;
    }
    case 'pass': {
      requireTurn();
      room.game = passTurn(state, actorIndex);
      room.pendingColorChoice = null;
      break;
    }
    case 'sayUno': {
      room.game = declareUno(state, actorIndex);
      break;
    }
    case 'callOut': {
      requireTurn();
      const targetIndex = state.players.findIndex(
        (p) => p.id === action.targetPlayerId,
      );
      if (targetIndex === -1) {
        throw new Error('Target player not found.');
      }
      room.game = callOutUno(state, actorIndex, targetIndex);
      break;
    }
    default: {
      const unreachable: never = action;
      throw new Error(
        `Unsupported action ${(unreachable as { type?: string }).type ?? 'unknown'}.`,
      );
    }
  }
}

const botTimers = new Map<string, ReturnType<typeof setTimeout>>();
const BOT_TURN_DELAY_MS = BOT_TURN_MS;

function runOfflineBotTurns(room: ServerRoom): void {
  if (
    botTimers.has(room.roomId) ||
    !room.started ||
    !room.game ||
    room.game.winnerId ||
    room.pendingColorChoice
  )
    return;
  if (!room.players.some((player) => player.connected)) return;
  const expectedGame = room.game;
  const current = expectedGame.players[expectedGame.currentPlayerIndex];
  if (room.players.find((player) => player.playerId === current.id)?.connected)
    return;
  botTimers.set(
    room.roomId,
    setTimeout(() => {
      botTimers.delete(room.roomId);
      if (rooms.get(room.roomId) !== room || !room.game || room.game.winnerId)
        return;
      if (room.game !== expectedGame) {
        runOfflineBotTurns(room);
        return;
      }
      const state = room.game;
      if (room.pendingColorChoice) return;
      if (
        room.players.find(
          (player) =>
            player.playerId === state.players[state.currentPlayerIndex].id,
        )?.connected
      )
        return;
      try {
        room.pendingColorChoice = null;

        const currentIndex = state.currentPlayerIndex;
        let botState: GameState = state;
        const callOutTargetIndex = botState.players.findIndex(
          (player, idx) =>
            idx !== currentIndex && player.hand.length === 1 && !player.saidUno,
        );

        if (callOutTargetIndex >= 0) {
          botState = callOutUno(botState, currentIndex, callOutTargetIndex);
        }

        const move = getBotMove(botState, currentIndex);
        let nextState: GameState = botState;

        if (move.action === 'drawRequired') {
          nextState = drawRequiredCards(botState, currentIndex);
        } else if (move.action === 'pass') {
          nextState = passTurn(botState, currentIndex);
        } else if (move.action === 'draw') {
          nextState = drawOneCard(botState, currentIndex);
        } else {
          nextState = playCard(
            botState,
            currentIndex,
            move.cardId,
            move.chosenColor,
          );
        }

        if (
          !nextState.winnerId &&
          nextState.players[currentIndex]?.hand.length === 1
        ) {
          nextState = {
            ...declareUno(nextState, currentIndex),
            lastAction: nextState.lastAction,
          };
        }

        room.game = nextState;

        broadcastRoom(io, room);
        runOfflineBotTurns(room);
      } catch (error) {
        console.error('Could not advance bot turn:', error);
      }
    }, BOT_TURN_DELAY_MS),
  );
}

const httpServer = createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  res.writeHead(200, { 'content-type': 'text/plain' });
  res.end('UNO socket server running');
});
const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      callback(null, isAllowedOrigin(origin));
    },
    methods: ['GET', 'POST'],
  },
});

// ── Periodic cleanup ──────────────────────────────────────────────────────
const CLEANUP_INTERVAL_MS = 60_000;
const PRESENCE_TTL_MS = 5 * 60_000;
const INVITE_TTL_MS = 2 * 60_000;

setInterval(() => {
  const now = Date.now();

  // Prune stale presence records
  for (const [socketId, record] of presenceBySocket) {
    if (now - record.lastSeenAt > PRESENCE_TTL_MS) {
      presenceBySocket.delete(socketId);
      const current = presenceByFriendCode.get(record.friendCode);
      if (current?.socketId === socketId) {
        presenceByFriendCode.delete(record.friendCode);
      }
    }
  }

  // Prune expired invites
  for (const [inviteId, invite] of pendingInvites) {
    if (now - invite.createdAt > INVITE_TTL_MS) {
      pendingInvites.delete(inviteId);
    }
  }

  // Prune orphaned playerBySocket entries
  for (const [socketId] of playerBySocket) {
    if (!io.sockets.sockets.has(socketId)) {
      playerBySocket.delete(socketId);
    }
  }
}, CLEANUP_INTERVAL_MS);

io.on('connection', (socket) => {
  socket.on(
    'friend:status',
    (
      payload: { friendCodes?: string[] },
      reply?: (
        ack: Ack<{ statuses: Record<string, FriendPresenceState> }>,
      ) => void,
    ) => {
      try {
        const codes = Array.isArray(payload.friendCodes)
          ? payload.friendCodes
          : [];

        const statuses: Record<string, FriendPresenceState> = {};
        for (const code of codes) {
          const normalized = normalizeFriendCode(code ?? '');
          if (!normalized) continue;

          const presence = presenceByFriendCode.get(normalized);
          if (!presence) {
            statuses[normalized] = 'offline';
            continue;
          }

          statuses[normalized] = playerBySocket.has(presence.socketId)
            ? 'playing'
            : 'online';
        }

        reply?.({ ok: true, data: { statuses } });
      } catch (error) {
        reply?.(ackError((error as Error).message));
      }
    },
  );

  socket.on(
    'presence:update',
    (
      payload: PresencePayload,
      reply?: (ack: Ack<{ friendCode: string }>) => void,
    ) => {
      try {
        const friendCode = upsertPresence(socket.id, payload);
        reply?.({ ok: true, data: { friendCode } });
      } catch (error) {
        reply?.(ackError((error as Error).message));
      }
    },
  );

  socket.on(
    'room:create',
    (
      payload: CreateRoomPayload,
      reply?: (ack: Ack<{ room: RoomSnapshot; playerId: string }>) => void,
    ) => {
      try {
        const playerName = payload.playerName?.trim();
        const deviceId = payload.deviceId?.trim();
        if (!playerName || !deviceId) {
          reply?.(ackError('Player name and device id are required.'));
          return;
        }

        if (playerBySocket.has(socket.id)) {
          reply?.(ackError('You are already in a room.'));
          return;
        }

        const { room, playerId } = createRoomForPlayer(
          socket.id,
          playerName,
          deviceId,
          payload.rules,
        );
        socket.join(room.roomId);

        reply?.({
          ok: true,
          data: { room: snapshotForSocket(room, socket.id), playerId },
        });
        broadcastRoom(io, room);
      } catch (error) {
        reply?.(ackError((error as Error).message));
      }
    },
  );

  socket.on(
    'room:join',
    (
      payload: JoinRoomPayload,
      reply?: (ack: Ack<{ room: RoomSnapshot; playerId: string }>) => void,
    ) => {
      try {
        const playerName = payload.playerName?.trim();
        const roomId = payload.roomId?.trim().toUpperCase();
        const deviceId = payload.deviceId?.trim();
        if (!playerName || !roomId || !deviceId) {
          reply?.(
            ackError('Room code, player name and device id are required.'),
          );
          return;
        }

        if (playerBySocket.has(socket.id)) {
          reply?.(ackError('You are already in a room.'));
          return;
        }

        const room = rooms.get(roomId);
        if (!room) {
          reply?.(ackError('Room not found.'));
          return;
        }
        if (
          room.started &&
          !room.players.some((player) => player.deviceId === deviceId)
        ) {
          reply?.(ackError('Game already started for this room.'));
          return;
        }

        const playerId = joinRoomAsPlayer(
          room,
          socket.id,
          playerName,
          deviceId,
          io,
        );
        socket.join(roomId);

        reply?.({
          ok: true,
          data: { room: snapshotForSocket(room, socket.id), playerId },
        });
        broadcastRoom(io, room);
      } catch (error) {
        reply?.(ackError((error as Error).message));
      }
    },
  );

  socket.on(
    'friend:invite',
    (
      payload: SendFriendInvitePayload,
      reply?: (
        ack: Ack<{
          room: RoomSnapshot;
          playerId: string;
          invite: FriendInvite;
        }>,
      ) => void,
    ) => {
      try {
        const playerName = payload.playerName?.trim();
        const deviceId = payload.deviceId?.trim();
        const targetFriendCode = normalizeFriendCode(
          payload.targetFriendCode ?? '',
        );
        if (!playerName || !deviceId || targetFriendCode.length < 4) {
          reply?.(
            ackError('Friend code, player name and device id are required.'),
          );
          return;
        }

        const senderFriendCode = upsertPresence(socket.id, {
          playerName,
          deviceId,
          friendCode: payload.friendCode,
        });

        if (senderFriendCode === targetFriendCode) {
          reply?.(ackError('You cannot invite yourself.'));
          return;
        }

        const targetPresence = presenceByFriendCode.get(targetFriendCode);
        if (!targetPresence) {
          reply?.(ackError('That friend is not online right now.'));
          return;
        }

        const membership = playerBySocket.get(socket.id);
        let room: ServerRoom;
        let playerId: string;

        if (!membership) {
          const created = createRoomForPlayer(socket.id, playerName, deviceId);
          room = created.room;
          playerId = created.playerId;
          socket.join(room.roomId);
        } else {
          room = rooms.get(membership.roomId)!;
          if (!room) {
            reply?.(ackError('Current room was not found.'));
            return;
          }
          if (room.started) {
            reply?.(ackError('Cannot send invites after the game starts.'));
            return;
          }
          playerId = membership.playerId;
        }

        if (
          room.players.some(
            (player) => player.deviceId === targetPresence.deviceId,
          )
        ) {
          reply?.(ackError('That friend is already in this room.'));
          return;
        }

        if (room.players.length >= MAX_ROOM_PLAYERS) {
          reply?.(ackError('Room is full.'));
          return;
        }

        const existingInvite = Array.from(pendingInvites.values()).find(
          (invite) =>
            invite.roomId === room.roomId &&
            invite.fromPlayerId === playerId &&
            invite.toFriendCode === targetFriendCode,
        );

        const inviteRecord: PendingInviteRecord = existingInvite ?? {
          inviteId: makeInviteId(),
          roomId: room.roomId,
          fromPlayerId: playerId,
          fromName: playerName,
          fromFriendCode: senderFriendCode,
          toFriendCode: targetFriendCode,
          createdAt: Date.now(),
        };

        pendingInvites.set(inviteRecord.inviteId, inviteRecord);
        io.to(targetPresence.socketId).emit('friend:invite', inviteRecord);

        if (!membership) {
          broadcastRoom(io, room);
        }

        reply?.({
          ok: true,
          data: {
            room: snapshotForSocket(room, socket.id),
            playerId,
            invite: inviteRecord,
          },
        });
      } catch (error) {
        reply?.(ackError((error as Error).message));
      }
    },
  );

  socket.on(
    'friend:invite:accept',
    (
      payload: RespondFriendInvitePayload,
      reply?: (ack: Ack<{ room: RoomSnapshot; playerId: string }>) => void,
    ) => {
      try {
        const invite = pendingInvites.get(payload.inviteId);
        if (!invite) {
          reply?.(ackError('Invite no longer exists.'));
          return;
        }

        const playerName = payload.playerName?.trim();
        const deviceId = payload.deviceId?.trim();
        if (!playerName || !deviceId) {
          reply?.(ackError('Player name and device id are required.'));
          return;
        }

        const friendCode = upsertPresence(socket.id, {
          playerName,
          deviceId,
          friendCode: payload.friendCode,
        });
        if (invite.toFriendCode !== friendCode) {
          reply?.(ackError('This invite was not sent to your friend code.'));
          return;
        }

        const membership = playerBySocket.get(socket.id);
        if (membership && membership.roomId !== invite.roomId) {
          reply?.(
            ackError(
              'Leave your current room before accepting another invite.',
            ),
          );
          return;
        }

        const room = rooms.get(invite.roomId);
        if (!room || room.started) {
          removeInvite(invite.inviteId, io);
          reply?.(ackError('That room is no longer available.'));
          return;
        }

        const playerId =
          membership?.roomId === invite.roomId
            ? membership.playerId
            : joinRoomAsPlayer(room, socket.id, playerName, deviceId, io);
        socket.join(room.roomId);

        const senderSocketId = findSenderSocketIdForInvite(invite);
        removeInvite(invite.inviteId, io);
        if (senderSocketId) {
          io.to(senderSocketId).emit('friend:invite:accepted', {
            inviteId: invite.inviteId,
            roomId: invite.roomId,
            targetFriendCode: invite.toFriendCode,
            targetName: playerName,
          });
        }
        const snapshot = snapshotForSocket(room, socket.id);
        broadcastRoom(io, room);
        reply?.({ ok: true, data: { room: snapshot, playerId } });
      } catch (error) {
        reply?.(ackError((error as Error).message));
      }
    },
  );

  socket.on(
    'friend:invite:decline',
    (
      payload: DismissFriendInvitePayload,
      reply?: (ack: Ack<{ inviteId: string }>) => void,
    ) => {
      try {
        const invite = pendingInvites.get(payload.inviteId);
        if (!invite) {
          reply?.(ackError('Invite no longer exists.'));
          return;
        }

        const presence = presenceBySocket.get(socket.id);
        if (!presence || presence.friendCode !== invite.toFriendCode) {
          reply?.(
            ackError('Only the invited friend can decline this request.'),
          );
          return;
        }

        const senderSocketId = findSenderSocketIdForInvite(invite);
        removeInvite(payload.inviteId, io);
        if (senderSocketId) {
          io.to(senderSocketId).emit('friend:invite:declined', {
            inviteId: invite.inviteId,
            roomId: invite.roomId,
            targetFriendCode: invite.toFriendCode,
          });
        }
        reply?.({ ok: true, data: { inviteId: payload.inviteId } });
      } catch (error) {
        reply?.(ackError((error as Error).message));
      }
    },
  );

  socket.on(
    'room:start',
    (
      payload: StartRoomPayload,
      reply?: (ack: Ack<{ room: RoomSnapshot }>) => void,
    ) => {
      try {
        const roomId = payload.roomId?.trim().toUpperCase();
        if (!roomId) {
          reply?.(ackError('Room code is required.'));
          return;
        }

        const room = rooms.get(roomId);
        if (!room) {
          reply?.(ackError('Room not found.'));
          return;
        }

        const actor = room.players.find((p) => p.socketId === socket.id);
        if (!actor || actor.playerId !== room.hostPlayerId) {
          reply?.(ackError('Only the host can start the game.'));
          return;
        }

        if (room.started && !room.game?.winnerId) {
          reply?.(ackError('Finish the current round before dealing again.'));
          return;
        }

        if (room.players.length < 2) {
          reply?.(ackError('At least 2 players are required to start.'));
          return;
        }

        // Validate and deal before changing the live room. A rejected configuration
        // must leave its lobby or current round intact.
        const effectiveRules = payload.rules
          ? validateGameRules({
              ...(room.rules ?? defaultRules),
              ...payload.rules,
            })
          : (room.rules ?? defaultRules);
        const newGame = initializeGame(
          room.players.map((p) => p.name),
          effectiveRules,
          room.players.map((p) => p.isBot),
        );
        room.rules = effectiveRules;
        // Preserve room identities when a lobby seat has been removed or replaced.
        room.game = startTableRound(
          {
            ...newGame,
            players: newGame.players.map((player, index) => ({
              ...player,
              id: room.players[index].playerId,
            })),
          },
          randomBytes(16).toString('hex'),
          room.tableScore,
        );
        room.started = true;
        room.pendingColorChoice = null;
        const timer = botTimers.get(room.roomId);
        if (timer) clearTimeout(timer);
        botTimers.delete(room.roomId);
        removeInvitesForRoom(room.roomId, io);

        // Reset ready status for all players
        for (const p of room.players) {
          p.ready = false;
        }

        runOfflineBotTurns(room);

        const snapshot = snapshotForSocket(room, socket.id);
        broadcastRoom(io, room);
        reply?.({ ok: true, data: { room: snapshot } });
      } catch (error) {
        reply?.(ackError((error as Error).message));
      }
    },
  );

  socket.on(
    'room:set-rules',
    (
      payload: UpdateRulesPayload,
      reply?: (ack: Ack<{ room: RoomSnapshot }>) => void,
    ) => {
      try {
        const roomId = payload.roomId?.trim().toUpperCase();
        if (!roomId) {
          reply?.(ackError('Room code is required.'));
          return;
        }

        const room = rooms.get(roomId);
        if (!room) {
          reply?.(ackError('Room not found.'));
          return;
        }

        const actor = room.players.find((p) => p.socketId === socket.id);
        if (!actor || actor.playerId !== room.hostPlayerId) {
          reply?.(ackError('Only the host can change table rules.'));
          return;
        }

        const merged = validateGameRules({
          ...(room.rules ?? defaultRules),
          ...payload.rules,
        });
        room.rules = merged;

        const snapshot = snapshotForSocket(room, socket.id);
        broadcastRoom(io, room);
        reply?.({ ok: true, data: { room: snapshot } });
      } catch (error) {
        reply?.(ackError((error as Error).message));
      }
    },
  );

  socket.on(
    'room:add-bot',
    (
      payload: AddBotPayload,
      reply?: (ack: Ack<{ room: RoomSnapshot }>) => void,
    ) => {
      try {
        const roomId = payload.roomId?.trim().toUpperCase();
        if (!roomId) {
          reply?.(ackError('Room code is required.'));
          return;
        }

        const room = rooms.get(roomId);
        if (!room) {
          reply?.(ackError('Room not found.'));
          return;
        }

        const actor = room.players.find((p) => p.socketId === socket.id);
        if (!actor || actor.playerId !== room.hostPlayerId) {
          reply?.(ackError('Only the host can add bots.'));
          return;
        }

        if (room.started) {
          reply?.(ackError('Cannot add bots after the game starts.'));
          return;
        }

        if (room.players.length >= MAX_ROOM_PLAYERS) {
          reply?.(ackError('Room is full.'));
          return;
        }

        addBotSeat(room);
        const snapshot = snapshotForSocket(room, socket.id);
        broadcastRoom(io, room);
        reply?.({ ok: true, data: { room: snapshot } });
      } catch (error) {
        reply?.(ackError((error as Error).message));
      }
    },
  );

  socket.on(
    'room:kick',
    (
      payload: KickPlayerPayload,
      reply?: (ack: Ack<{ room: RoomSnapshot }>) => void,
    ) => {
      try {
        const roomId = payload.roomId?.trim().toUpperCase();
        const targetPlayerId = payload.targetPlayerId?.trim();
        if (!roomId || !targetPlayerId) {
          reply?.(ackError('Room code and target player are required.'));
          return;
        }

        const room = rooms.get(roomId);
        if (!room) {
          reply?.(ackError('Room not found.'));
          return;
        }

        const actor = room.players.find((p) => p.socketId === socket.id);
        if (!actor || actor.playerId !== room.hostPlayerId) {
          reply?.(ackError('Only the host can remove players.'));
          return;
        }

        if (room.started) {
          reply?.(ackError('Cannot remove players after the game starts.'));
          return;
        }

        if (targetPlayerId === room.hostPlayerId) {
          reply?.(ackError('Host cannot remove themselves.'));
          return;
        }

        const targetIndex = room.players.findIndex(
          (p) => p.playerId === targetPlayerId,
        );
        if (targetIndex === -1) {
          reply?.(ackError('Target player not found.'));
          return;
        }

        const [removed] = room.players.splice(targetIndex, 1);
        room.tableScore = undefined;
        if (removed.socketId) {
          const kickedSocket = io.sockets.sockets.get(removed.socketId);
          if (kickedSocket) {
            kickedSocket.leave(roomId);
            kickedSocket.emit('room:kicked', {
              roomId,
              message: 'You were removed by the host.',
            });
          }
          playerBySocket.delete(removed.socketId);
        }

        const snapshot = snapshotForSocket(room, socket.id);
        broadcastRoom(io, room);
        reply?.({ ok: true, data: { room: snapshot } });
      } catch (error) {
        reply?.(ackError((error as Error).message));
      }
    },
  );

  socket.on(
    'room:leave',
    (payload: LeaveRoomPayload, reply?: (ack: Ack<{ left: true }>) => void) => {
      try {
        const roomId = payload.roomId?.trim().toUpperCase();
        const membership = playerBySocket.get(socket.id);
        if (!roomId || !membership || membership.roomId !== roomId) {
          reply?.(ackError('You are not in that room.'));
          return;
        }

        socket.leave(roomId);
        leaveRoomForSocket(socket.id, io);
        reply?.({ ok: true, data: { left: true } });
      } catch (error) {
        reply?.(ackError((error as Error).message));
      }
    },
  );

  socket.on(
    'room:ready',
    (
      payload: ReadyPayload,
      reply?: (ack: Ack<{ room: RoomSnapshot }>) => void,
    ) => {
      try {
        const roomId = payload.roomId?.trim().toUpperCase();
        if (!roomId) {
          reply?.(ackError('Room code is required.'));
          return;
        }

        const room = rooms.get(roomId);
        if (!room) {
          reply?.(ackError('Room not found.'));
          return;
        }

        const player = room.players.find((p) => p.socketId === socket.id);
        if (!player) {
          reply?.(ackError('You are not in this room.'));
          return;
        }

        // Toggle ready status (but bots are always ready)
        if (!player.isBot) {
          player.ready = !player.ready;
        }

        const snapshot = snapshotForSocket(room, socket.id);
        broadcastRoom(io, room);
        reply?.({ ok: true, data: { room: snapshot } });
      } catch (error) {
        reply?.(ackError((error as Error).message));
      }
    },
  );

  socket.on(
    'room:return-to-lobby',
    (
      payload: ReturnToLobbyPayload,
      reply?: (ack: Ack<{ room: RoomSnapshot }>) => void,
    ) => {
      try {
        const room = rooms.get(payload.roomId?.trim().toUpperCase());
        if (!room) throw new Error('Room not found.');
        const member = playerBySocket.get(socket.id);
        if (
          member?.roomId !== room.roomId ||
          member.playerId !== room.hostPlayerId
        ) {
          throw new Error('Only the host can return everyone to the room.');
        }
        if (room.started && !room.game?.winnerId) {
          throw new Error(
            'Finish the current round before changing the table.',
          );
        }
        const timer = botTimers.get(room.roomId);
        if (timer) clearTimeout(timer);
        botTimers.delete(room.roomId);
        room.started = false;
        room.game = null;
        room.pendingColorChoice = null;
        for (const player of room.players) player.ready = player.isBot;
        const snapshot = snapshotForSocket(room, socket.id);
        broadcastRoom(io, room);
        reply?.({ ok: true, data: { room: snapshot } });
      } catch (error) {
        reply?.(ackError((error as Error).message));
      }
    },
  );

  socket.on(
    'game:action',
    (
      payload: RoomActionPayload,
      reply?: (ack: Ack<{ room: RoomSnapshot }>) => void,
    ) => {
      try {
        const room = rooms.get(payload.roomId?.trim().toUpperCase());
        if (!room) {
          reply?.(ackError('Room not found.'));
          return;
        }

        handleGameAction(room, socket.id, payload, io);
        runOfflineBotTurns(room);
        const snapshot = snapshotForSocket(room, socket.id);
        broadcastRoom(io, room);
        reply?.({ ok: true, data: { room: snapshot } });
      } catch (error) {
        reply?.(ackError((error as Error).message));
      }
    },
  );

  socket.on('disconnect', () => {
    const presence = presenceBySocket.get(socket.id);
    if (presence) {
      for (const invite of Array.from(pendingInvites.values())) {
        if (
          invite.fromFriendCode === presence.friendCode ||
          invite.toFriendCode === presence.friendCode
        ) {
          removeInvite(invite.inviteId, io);
        }
      }
    }
    removePresence(socket.id);

    leaveRoomForSocket(socket.id, io);
  });
});

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`UNO multiplayer socket server running on port ${PORT}`);
  if (configuredCorsOrigins.length > 0) {
    console.log(`Allowed CORS origins: ${configuredCorsOrigins.join(', ')}`);
  }
});
