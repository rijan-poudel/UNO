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
  KickPlayerPayload,
  JoinRoomPayload,
  RoomActionPayload,
  RoomPlayer,
  RoomSnapshot,
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

const rooms = new Map<string, ServerRoom>();
const playerBySocket = new Map<string, { roomId: string; playerId: string }>();

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

      let roomId = makeRoomId();
      while (rooms.has(roomId)) {
        roomId = makeRoomId();
      }

      const playerId = makePlayerId(0);
      const room: ServerRoom = {
        roomId,
        hostPlayerId: playerId,
        players: [{ playerId, socketId: socket.id, name: playerName, connected: true, deviceId }],
        started: false,
        game: null,
      };

      rooms.set(roomId, room);
      playerBySocket.set(socket.id, { roomId, playerId });
      socket.join(roomId);

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

      const existingPlayerForDevice = room.players.find((p) => p.deviceId === deviceId);
      if (existingPlayerForDevice) {
        if (existingPlayerForDevice.connected) {
          reply?.(ackError('This device is already connected in the room.'));
          return;
        }

        existingPlayerForDevice.socketId = socket.id;
        existingPlayerForDevice.connected = true;
        existingPlayerForDevice.name = playerName;

        playerBySocket.set(socket.id, { roomId, playerId: existingPlayerForDevice.playerId });
        socket.join(roomId);

        reply?.({ ok: true, data: { room: toSnapshot(room), playerId: existingPlayerForDevice.playerId } });
        broadcastRoom(io, room);
        return;
      }

      if (room.players.length >= MAX_ROOM_PLAYERS) {
        reply?.(ackError('Room is full.'));
        return;
      }

      const playerId = makeNextPlayerId(room.players);
      room.players.push({ playerId, socketId: socket.id, name: playerName, connected: true, deviceId });
      playerBySocket.set(socket.id, { roomId, playerId });
      socket.join(roomId);

      reply?.({ ok: true, data: { room: toSnapshot(room), playerId } });
      broadcastRoom(io, room);
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
    const membership = playerBySocket.get(socket.id);
    if (!membership) return;

    playerBySocket.delete(socket.id);
    const room = rooms.get(membership.roomId);
    if (!room) return;

    const player = room.players.find((p) => p.playerId === membership.playerId);
    if (player) {
      player.connected = false;
      player.socketId = '';
    }

    const hasConnectedPlayers = room.players.some((p) => p.connected);
    if (!hasConnectedPlayers) {
      rooms.delete(room.roomId);
      return;
    }

    runOfflineBotTurns(room);

    broadcastRoom(io, room);
  });
});

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`UNO multiplayer socket server running on port ${PORT}`);
  if (configuredCorsOrigins.length > 0) {
    console.log(`Allowed CORS origins: ${configuredCorsOrigins.join(', ')}`);
  }
});
