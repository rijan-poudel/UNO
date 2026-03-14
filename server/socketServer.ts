import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { initializeGame } from '../lib/gameSetup';
import {
  playCard,
  drawOneCard,
  drawRequiredCards,
  passTurn,
  declareUno,
  callOutUno,
} from '../lib/gameActions';
import { getBotMove } from '../lib/botSupport';
import { canPlayCard } from '../lib/gameRules';
import type { CardColor } from '../types/card';
import type { GameState } from '../types/game';
import type {
  Ack,
  CreateRoomPayload,
  DismissFriendInvitePayload,
  FriendInvite,
  KickPlayerPayload,
  LeaveRoomPayload,
  JoinRoomPayload,
  PresencePayload,
  RespondFriendInvitePayload,
  RoomActionPayload,
  RoomPlayer,
  RoomSnapshot,
  SendFriendInvitePayload,
  StartRoomPayload,
} from '../types/multiplayer';

const PORT = Number(process.env.PORT ?? process.env.UNO_SOCKET_PORT ?? 3001);
const MAX_ROOM_PLAYERS = 4;

const configuredCorsOrigins = (process.env.UNO_CORS_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);

function isAllowedOrigin(origin: string): boolean {
  const normalized = origin.trim().replace(/\/$/, '');

  const isLocalhostOrigin = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(normalized);
  const isLanOrigin = /^https?:\/\/192\.168\.\d+\.\d+(:\d+)?$/i.test(normalized)
    || /^https?:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/i.test(normalized)
    || /^https?:\/\/172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+(:\d+)?$/i.test(normalized);

  return isLocalhostOrigin || isLanOrigin || configuredCorsOrigins.includes(normalized);
}

interface ServerRoomPlayer extends RoomPlayer {
  socketId: string;
  deviceId: string;
}

interface ServerRoom {
  roomId: string;
  hostPlayerId: string;
  players: ServerRoomPlayer[];
  started: boolean;
  game: RoomSnapshot['game'];
}

interface PresenceRecord {
  socketId: string;
  deviceId: string;
  friendCode: string;
  playerName: string;
}

interface PendingInviteRecord extends FriendInvite {
  toFriendCode: string;
}

const rooms = new Map<string, ServerRoom>();
const playerBySocket = new Map<string, { roomId: string; playerId: string }>();
const presenceBySocket = new Map<string, PresenceRecord>();
const presenceByFriendCode = new Map<string, PresenceRecord>();
const pendingInvites = new Map<string, PendingInviteRecord>();

function makeRoomId(): string {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let id = '';
  for (let i = 0; i < 6; i += 1) {
    id += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return id;
}

function makePlayerId(existingCount: number): string {
  return `player_${existingCount}`;
}

function makeInviteId(): string {
  return `invite_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

function normalizeFriendCode(value: string): string {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
}

function makeNextPlayerId(players: ServerRoomPlayer[]): string {
  const existingIds = new Set(players.map((player) => player.playerId));
  let cursor = 0;
  while (existingIds.has(`player_${cursor}`)) {
    cursor += 1;
  }
  return `player_${cursor}`;
}

function toSnapshot(room: ServerRoom): RoomSnapshot {
  return {
    roomId: room.roomId,
    hostPlayerId: room.hostPlayerId,
    players: room.players.map((p) => ({
      playerId: p.playerId,
      name: p.name,
      connected: p.connected,
    })),
    started: room.started,
    game: room.game,
  };
}

function createRoomForPlayer(socketId: string, playerName: string, deviceId: string): { room: ServerRoom; playerId: string } {
  let roomId = makeRoomId();
  while (rooms.has(roomId)) {
    roomId = makeRoomId();
  }

  const playerId = makePlayerId(0);
  const room: ServerRoom = {
    roomId,
    hostPlayerId: playerId,
    players: [{ playerId, socketId, name: playerName, connected: true, deviceId }],
    started: false,
    game: null,
  };

  rooms.set(roomId, room);
  playerBySocket.set(socketId, { roomId, playerId });
  return { room, playerId };
}

function joinRoomAsPlayer(room: ServerRoom, socketId: string, playerName: string, deviceId: string): string {
  const existingPlayerForDevice = room.players.find((player) => player.deviceId === deviceId);
  if (existingPlayerForDevice) {
    if (existingPlayerForDevice.connected) {
      throw new Error('This device is already connected in the room.');
    }

    existingPlayerForDevice.socketId = socketId;
    existingPlayerForDevice.connected = true;
    existingPlayerForDevice.name = playerName;
    playerBySocket.set(socketId, { roomId: room.roomId, playerId: existingPlayerForDevice.playerId });
    return existingPlayerForDevice.playerId;
  }

  if (room.players.length >= MAX_ROOM_PLAYERS) {
    throw new Error('Room is full.');
  }

  const playerId = makeNextPlayerId(room.players);
  room.players.push({ playerId, socketId, name: playerName, connected: true, deviceId });
  playerBySocket.set(socketId, { roomId: room.roomId, playerId });
  return playerId;
}

function upsertPresence(socketId: string, payload: PresencePayload): string {
  const playerName = payload.playerName?.trim();
  const deviceId = payload.deviceId?.trim();
  const friendCode = normalizeFriendCode(payload.friendCode ?? '');
  if (!playerName || !deviceId || friendCode.length < 4) {
    throw new Error('Player name, device id and friend code are required.');
  }

  const existing = presenceByFriendCode.get(friendCode);
  if (existing && existing.socketId !== socketId && existing.deviceId !== deviceId) {
    throw new Error('Friend code already in use.');
  }

  const previous = presenceBySocket.get(socketId);
  if (previous && previous.friendCode !== friendCode) {
    presenceByFriendCode.delete(previous.friendCode);
  }

  const record: PresenceRecord = { socketId, deviceId, friendCode, playerName };
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
    ioServer.to(targetPresence.socketId).emit('friend:invite:removed', { inviteId });
  }

  const senderMembership = Array.from(playerBySocket.entries()).find(([, membership]) => membership.playerId === invite.fromPlayerId && membership.roomId === invite.roomId);
  if (senderMembership) {
    ioServer.to(senderMembership[0]).emit('friend:invite:removed', { inviteId });
  }
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

  const playerIndex = room.players.findIndex((player) => player.playerId === membership.playerId);
  if (playerIndex === -1) return;

  const player = room.players[playerIndex];
  if (room.started) {
    player.connected = false;
    player.socketId = '';

    if (room.hostPlayerId === player.playerId) {
      const nextHost = room.players.find((p) => p.playerId !== player.playerId && p.connected)
        ?? room.players.find((p) => p.playerId !== player.playerId);
      if (nextHost) {
        room.hostPlayerId = nextHost.playerId;
      }
    }

    runOfflineBotTurns(room);
  } else {
    room.players.splice(playerIndex, 1);
    if (room.hostPlayerId === player.playerId && room.players.length > 0) {
      room.hostPlayerId = room.players[0].playerId;
    }
  }

  const hasConnectedPlayers = room.players.some((p) => p.connected);
  if (!hasConnectedPlayers) {
    removeInvitesForRoom(room.roomId, ioServer);
    rooms.delete(room.roomId);
    return;
  }

  broadcastRoom(ioServer, room);
}

function broadcastRoom(io: Server, room: ServerRoom): void {
  io.to(room.roomId).emit('room:update', toSnapshot(room));
}

function ackError<T>(message: string): Ack<T> {
  return { ok: false, error: message };
}

function ensureActorTurn(room: ServerRoom, socketId: string): { actorIndex: number; actorPlayerId: string } {
  if (!room.game) {
    throw new Error('Game is not started yet.');
  }

  const actor = room.players.find((p) => p.socketId === socketId);
  if (!actor) {
    throw new Error('Player is not part of this room.');
  }

  const actorIndex = room.game.players.findIndex((p) => p.id === actor.playerId);
  if (actorIndex === -1) {
    throw new Error('Player not found in active game state.');
  }

  if (room.game.currentPlayerIndex !== actorIndex) {
    throw new Error('It is not your turn.');
  }

  return { actorIndex, actorPlayerId: actor.playerId };
}

function handleGameAction(room: ServerRoom, socketId: string, payload: RoomActionPayload): RoomSnapshot {
  if (!room.started || !room.game) {
    throw new Error('Game has not started.');
  }

  const { actorIndex } = ensureActorTurn(room, socketId);
  const state = room.game;

  const action = payload.action;

  switch (action.type) {
    case 'play': {
      room.game = playCard(state, actorIndex, action.cardId, action.chosenColor);
      break;
    }
    case 'draw': {
      if (state.pendingDraw > 0) {
        room.game = drawRequiredCards(state, actorIndex);
      } else {
        room.game = drawOneCard(state, actorIndex);
      }
      break;
    }
    case 'pass': {
      room.game = passTurn(state, actorIndex);
      break;
    }
    case 'sayUno': {
      room.game = declareUno(state, actorIndex);
      break;
    }
    case 'callOut': {
      const targetIndex = state.players.findIndex((p) => p.id === action.targetPlayerId);
      if (targetIndex === -1) {
        throw new Error('Target player not found.');
      }
      room.game = callOutUno(state, actorIndex, targetIndex);
      break;
    }
    default: {
      const unreachable: never = action;
      throw new Error(`Unsupported action ${(unreachable as { type?: string }).type ?? 'unknown'}.`);
    }
  }

  return toSnapshot(room);
}

function runOfflineBotTurns(room: ServerRoom): void {
  if (!room.started || !room.game || room.game.winnerId) return;

  let safety = 0;
  while (room.game && !room.game.winnerId && safety < 50) {
    const state: GameState | null = room.game;
    if (!state) break;
    const currentGamePlayer = state.players[state.currentPlayerIndex];
    const roomPlayer = room.players.find((p) => p.playerId === currentGamePlayer.id);

    if (roomPlayer?.connected) {
      break;
    }

    const currentIndex = state.currentPlayerIndex;
    const move = getBotMove(state, currentIndex);
    let nextState: GameState = state;

    if (move.action === 'drawRequired') {
      nextState = drawRequiredCards(state, currentIndex);
    } else if (move.action === 'draw') {
      const afterDraw = drawOneCard(state, currentIndex);
      const updatedHand = afterDraw.players[currentIndex].hand;
      const drawnCard = updatedHand[updatedHand.length - 1];

      if (drawnCard && canPlayCard(drawnCard, afterDraw, currentIndex)) {
        const chosenColor = drawnCard.color === 'wild'
          ? (move as { chosenColor?: CardColor }).chosenColor ?? 'red'
          : undefined;
        nextState = playCard(afterDraw, currentIndex, drawnCard.id, chosenColor);
      } else {
        nextState = passTurn(afterDraw, currentIndex);
      }
    } else {
      nextState = playCard(state, currentIndex, move.cardId, move.chosenColor);
    }

    if (!nextState.winnerId && nextState.players[currentIndex]?.hand.length === 1) {
      nextState = declareUno(nextState, currentIndex);
    }

    room.game = nextState;
    safety += 1;
  }
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

io.on('connection', (socket) => {
  socket.on('presence:update', (payload: PresencePayload, reply?: (ack: Ack<{ friendCode: string }>) => void) => {
    try {
      const friendCode = upsertPresence(socket.id, payload);
      reply?.({ ok: true, data: { friendCode } });
    } catch (error) {
      reply?.(ackError((error as Error).message));
    }
  });

  socket.on('room:create', (payload: CreateRoomPayload, reply?: (ack: Ack<{ room: RoomSnapshot; playerId: string }>) => void) => {
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

      const { room, playerId } = createRoomForPlayer(socket.id, playerName, deviceId);
      socket.join(room.roomId);

      reply?.({ ok: true, data: { room: toSnapshot(room), playerId } });
      broadcastRoom(io, room);
    } catch (error) {
      reply?.(ackError((error as Error).message));
    }
  });

  socket.on('room:join', (payload: JoinRoomPayload, reply?: (ack: Ack<{ room: RoomSnapshot; playerId: string }>) => void) => {
    try {
      const playerName = payload.playerName?.trim();
      const roomId = payload.roomId?.trim().toUpperCase();
      const deviceId = payload.deviceId?.trim();
      if (!playerName || !roomId || !deviceId) {
        reply?.(ackError('Room code, player name and device id are required.'));
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
      if (room.started) {
        reply?.(ackError('Game already started for this room.'));
        return;
      }

      const playerId = joinRoomAsPlayer(room, socket.id, playerName, deviceId);
      socket.join(roomId);

      reply?.({ ok: true, data: { room: toSnapshot(room), playerId } });
      broadcastRoom(io, room);
    } catch (error) {
      reply?.(ackError((error as Error).message));
    }
  });

  socket.on('friend:invite', (payload: SendFriendInvitePayload, reply?: (ack: Ack<{ room: RoomSnapshot; playerId: string; invite: FriendInvite }>) => void) => {
    try {
      const playerName = payload.playerName?.trim();
      const deviceId = payload.deviceId?.trim();
      const targetFriendCode = normalizeFriendCode(payload.targetFriendCode ?? '');
      if (!playerName || !deviceId || targetFriendCode.length < 4) {
        reply?.(ackError('Friend code, player name and device id are required.'));
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

      if (room.players.some((player) => player.deviceId === targetPresence.deviceId)) {
        reply?.(ackError('That friend is already in this room.'));
        return;
      }

      if (room.players.length >= MAX_ROOM_PLAYERS) {
        reply?.(ackError('Room is full.'));
        return;
      }

      const existingInvite = Array.from(pendingInvites.values()).find((invite) => (
        invite.roomId === room.roomId
        && invite.fromPlayerId === playerId
        && invite.toFriendCode === targetFriendCode
      ));

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

      reply?.({ ok: true, data: { room: toSnapshot(room), playerId, invite: inviteRecord } });
    } catch (error) {
      reply?.(ackError((error as Error).message));
    }
  });

  socket.on('friend:invite:accept', (payload: RespondFriendInvitePayload, reply?: (ack: Ack<{ room: RoomSnapshot; playerId: string }>) => void) => {
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
        reply?.(ackError('Leave your current room before accepting another invite.'));
        return;
      }

      const room = rooms.get(invite.roomId);
      if (!room || room.started) {
        removeInvite(invite.inviteId, io);
        reply?.(ackError('That room is no longer available.'));
        return;
      }

      const playerId = membership?.roomId === invite.roomId
        ? membership.playerId
        : joinRoomAsPlayer(room, socket.id, playerName, deviceId);
      socket.join(room.roomId);

      removeInvite(invite.inviteId, io);
      const snapshot = toSnapshot(room);
      broadcastRoom(io, room);
      reply?.({ ok: true, data: { room: snapshot, playerId } });
    } catch (error) {
      reply?.(ackError((error as Error).message));
    }
  });

  socket.on('friend:invite:decline', (payload: DismissFriendInvitePayload, reply?: (ack: Ack<{ inviteId: string }>) => void) => {
    try {
      const invite = pendingInvites.get(payload.inviteId);
      if (!invite) {
        reply?.(ackError('Invite no longer exists.'));
        return;
      }

      const presence = presenceBySocket.get(socket.id);
      if (!presence || presence.friendCode !== invite.toFriendCode) {
        reply?.(ackError('Only the invited friend can decline this request.'));
        return;
      }

      removeInvite(payload.inviteId, io);
      reply?.({ ok: true, data: { inviteId: payload.inviteId } });
    } catch (error) {
      reply?.(ackError((error as Error).message));
    }
  });

  socket.on('room:start', (payload: StartRoomPayload, reply?: (ack: Ack<{ room: RoomSnapshot }>) => void) => {
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

      if (room.players.length < 2) {
        reply?.(ackError('At least 2 players are required to start.'));
        return;
      }

      room.started = true;
      room.game = initializeGame(
        room.players.map((p) => p.name),
        payload.rules,
        room.players.map(() => false),
      );
      removeInvitesForRoom(room.roomId, io);

      runOfflineBotTurns(room);

      const snapshot = toSnapshot(room);
      io.to(roomId).emit('room:update', snapshot);
      reply?.({ ok: true, data: { room: snapshot } });
    } catch (error) {
      reply?.(ackError((error as Error).message));
    }
  });

  socket.on('room:kick', (payload: KickPlayerPayload, reply?: (ack: Ack<{ room: RoomSnapshot }>) => void) => {
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

      const targetIndex = room.players.findIndex((p) => p.playerId === targetPlayerId);
      if (targetIndex === -1) {
        reply?.(ackError('Target player not found.'));
        return;
      }

      const [removed] = room.players.splice(targetIndex, 1);
      if (removed.socketId) {
        const kickedSocket = io.sockets.sockets.get(removed.socketId);
        if (kickedSocket) {
          kickedSocket.leave(roomId);
          kickedSocket.emit('room:kicked', { roomId, message: 'You were removed by the host.' });
        }
        playerBySocket.delete(removed.socketId);
      }

      const snapshot = toSnapshot(room);
      io.to(room.roomId).emit('room:update', snapshot);
      reply?.({ ok: true, data: { room: snapshot } });
    } catch (error) {
      reply?.(ackError((error as Error).message));
    }
  });

  socket.on('room:leave', (payload: LeaveRoomPayload, reply?: (ack: Ack<{ left: true }>) => void) => {
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
  });

  socket.on('game:action', (payload: RoomActionPayload, reply?: (ack: Ack<{ room: RoomSnapshot }>) => void) => {
    try {
      const room = rooms.get(payload.roomId?.trim().toUpperCase());
      if (!room) {
        reply?.(ackError('Room not found.'));
        return;
      }

      handleGameAction(room, socket.id, payload);
      runOfflineBotTurns(room);
      const snapshot = toSnapshot(room);
      io.to(room.roomId).emit('room:update', snapshot);
      reply?.({ ok: true, data: { room: snapshot } });
    } catch (error) {
      reply?.(ackError((error as Error).message));
    }
  });

  socket.on('disconnect', () => {
    const presence = presenceBySocket.get(socket.id);
    if (presence) {
      for (const invite of Array.from(pendingInvites.values())) {
        if (invite.fromFriendCode === presence.friendCode || invite.toFriendCode === presence.friendCode) {
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
