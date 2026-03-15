'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import type { GameState } from '../types/game';
import type { Card, CardColor } from '../types/card';
import type { GameRules } from '../types/rules';
import type { Ack, FriendInvite, MultiplayerAction, RoomSnapshot } from '../types/multiplayer';
import { getPlayableCards } from '../lib/gameRules';
import { getBotMove, getBotPreferredColor } from '../lib/botSupport';

const HUMAN_IDLE_TIMEOUT_MS = 12000;
const HUMAN_IDLE_AFTER_DRAW_TIMEOUT_MS = 4500;
const HUMAN_IDLE_WILD_PICK_TIMEOUT_MS = 3500;
const ONLINE_DEVICE_ID_KEY = 'uno.online.deviceId';
const ONLINE_FRIEND_CODE_KEY = 'uno.online.friendCode';
const ONLINE_RECENT_ROOMS_KEY = 'uno.online.recentRooms';
const MAX_RECENT_ROOMS = 8;

interface RecentRoomEntry {
  roomId: string;
  label: string;
  lastVisitedAt: number;
  lastPlayerName: string;
}

function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return 'server-device';

  try {
    const existing = window.localStorage.getItem(ONLINE_DEVICE_ID_KEY);
    if (existing && existing.trim()) return existing.trim();

    const generated = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `device-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem(ONLINE_DEVICE_ID_KEY, generated);
    return generated;
  } catch {
    return `device-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

function getOrCreateFriendCode(): string {
  if (typeof window === 'undefined') return 'UNO0001';

  try {
    const existing = window.localStorage.getItem(ONLINE_FRIEND_CODE_KEY);
    if (existing && existing.trim()) {
      return existing.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
    }

    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let nextCode = '';
    for (let i = 0; i < 8; i += 1) {
      nextCode += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    window.localStorage.setItem(ONLINE_FRIEND_CODE_KEY, nextCode);
    return nextCode;
  } catch {
    return `UNO${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  }
}

function loadRecentRooms(): RecentRoomEntry[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(ONLINE_RECENT_ROOMS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item): item is RecentRoomEntry => {
        if (typeof item !== 'object' || item === null) return false;
        const candidate = item as Partial<RecentRoomEntry>;
        return typeof candidate.roomId === 'string'
          && typeof candidate.label === 'string'
          && typeof candidate.lastVisitedAt === 'number'
          && typeof candidate.lastPlayerName === 'string';
      })
      .map((item) => ({
        roomId: item.roomId.trim().toUpperCase().slice(0, 6),
        label: item.label.trim(),
        lastVisitedAt: item.lastVisitedAt,
        lastPlayerName: item.lastPlayerName.trim(),
      }))
      .filter((item) => Boolean(item.roomId))
      .sort((a, b) => b.lastVisitedAt - a.lastVisitedAt)
      .slice(0, MAX_RECENT_ROOMS);
  } catch {
    return [];
  }
}

function saveRecentRooms(entries: RecentRoomEntry[]) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(
      ONLINE_RECENT_ROOMS_KEY,
      JSON.stringify(entries.slice(0, MAX_RECENT_ROOMS)),
    );
  } catch {
    // Ignore storage errors.
  }
}

function rememberStartedRoom(room: RoomSnapshot, playerId: string | null) {
  if (typeof window === 'undefined') return;
  if (!room.roomId || !room.started || !room.game || !playerId) return;

  const localPlayer = room.players.find((player) => player.playerId === playerId);
  const playerName = localPlayer?.name?.trim() || 'Player';
  const now = Date.now();
  const prev = loadRecentRooms();
  const existing = prev.find((entry) => entry.roomId === room.roomId);

  const nextEntries = [
    {
      roomId: room.roomId,
      label: existing?.label ?? '',
      lastVisitedAt: now,
      lastPlayerName: playerName,
    },
    ...prev.filter((entry) => entry.roomId !== room.roomId),
  ].slice(0, MAX_RECENT_ROOMS);

  saveRecentRooms(nextEntries);
}

interface FeedState {
  room: RoomSnapshot | null;
  game: GameState | null;
  playerId: string | null;
  friendCode: string;
  incomingInvites: FriendInvite[];
  pendingWild: Card | null;
  drawnThisTurn: boolean;
  log: string[];
  error: string | null;
  connected: boolean;
}

function describeAction(game: GameState): string {
  const action = game.lastAction;
  const name = (id: string) => game.players.find((p) => p.id === id)?.name ?? id;

  switch (action.type) {
    case 'play':
      return `${name(action.playerId)} played ${action.card.color} ${action.card.value}${
        action.chosenColor ? ` -> chose ${action.chosenColor}` : ''
      }`;
    case 'draw':
      return `${name(action.playerId)} drew ${action.count} card${action.count !== 1 ? 's' : ''}`;
    case 'pass':
      return `${name(action.playerId)} passed`;
    case 'declareUno':
      return `${name(action.playerId)} said UNO`;
    case 'callOut':
      return `${name(action.callerId)} called out ${name(action.targetId)}`;
    default:
      return 'Game started';
  }
}

export function useUnoOnlineGame() {
  const socketRef = useRef<Socket | null>(null);
  const [deviceId] = useState<string>(getOrCreateDeviceId);
  const [friendCode, setFriendCode] = useState<string>(getOrCreateFriendCode);
  const startedRoomHistoryRef = useRef<Set<string>>(new Set());
  const [state, setState] = useState<FeedState>({
    room: null,
    game: null,
    playerId: null,
    friendCode,
    incomingInvites: [],
    pendingWild: null,
    drawnThisTurn: false,
    log: [],
    error: null,
    connected: false,
  });

  const previousTurnRef = useRef<number | null>(null);

  useEffect(() => {
    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL
      ?? `${window.location.protocol}//${window.location.hostname}:3001`;

    const socket = io(socketUrl, {
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setState((prev) => ({ ...prev, connected: true, error: null }));
    });

    socket.on('disconnect', () => {
      setState((prev) => ({ ...prev, connected: false }));
    });

    socket.on('room:update', (room: RoomSnapshot) => {
      setState((prev) => {
        let nextLog = prev.log;
        if (room.game) {
          const actionLine = describeAction(room.game);
          nextLog = [actionLine, ...prev.log.filter((entry) => entry !== actionLine)].slice(0, 30);
        }

        let drawnThisTurn = prev.drawnThisTurn;
        if (room.game) {
          const turn = room.game.turnCount;
          if (previousTurnRef.current !== null && previousTurnRef.current !== turn) {
            drawnThisTurn = false;
          }

          const localIndex = prev.playerId
            ? room.game.players.findIndex((p) => p.id === prev.playerId)
            : -1;
          if (
            localIndex >= 0 &&
            room.game.lastAction.type === 'draw' &&
            room.game.lastAction.playerId === prev.playerId &&
            room.game.pendingDraw === 0 &&
            room.game.currentPlayerIndex === localIndex
          ) {
            drawnThisTurn = true;
          }

          if (room.game.lastAction.type === 'play' || room.game.lastAction.type === 'pass') {
            drawnThisTurn = false;
          }

          previousTurnRef.current = turn;
        }

        return {
          ...prev,
          room,
          game: room.game,
          log: nextLog,
          drawnThisTurn,
          error: null,
        };
      });
    });

    socket.on('room:kicked', (payload?: { message?: string }) => {
      setState((prev) => ({
        ...prev,
        room: null,
        game: null,
        playerId: null,
        pendingWild: null,
        drawnThisTurn: false,
        log: [],
        error: payload?.message ?? 'You were removed from the room.',
      }));
    });

    socket.on('friend:invite', (invite: FriendInvite) => {
      setState((prev) => ({
        ...prev,
        incomingInvites: [invite, ...prev.incomingInvites.filter((entry) => entry.inviteId !== invite.inviteId)]
          .sort((a, b) => b.createdAt - a.createdAt)
          .slice(0, 10),
      }));
    });

    socket.on('friend:invite:removed', (payload?: { inviteId?: string }) => {
      if (!payload?.inviteId) return;
      setState((prev) => ({
        ...prev,
        incomingInvites: prev.incomingInvites.filter((invite) => invite.inviteId !== payload.inviteId),
      }));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!state.room?.roomId || !state.room.started || !state.room.game || !state.playerId) return;
    if (startedRoomHistoryRef.current.has(state.room.roomId)) return;

    rememberStartedRoom(state.room, state.playerId);
    startedRoomHistoryRef.current.add(state.room.roomId);
  }, [state.room, state.playerId]);

  const callAck = useCallback(<T,>(event: string, payload: object): Promise<Ack<T>> => {
    const socket = socketRef.current;
    if (!socket) return Promise.resolve({ ok: false, error: 'Socket not connected.' });

    return new Promise((resolve) => {
      socket.emit(event, payload, (ack: Ack<T>) => resolve(ack));
    });
  }, []);

  const syncPresence = useCallback(async (playerName: string) => {
    const trimmedName = playerName.trim();
    if (!trimmedName) return false;

    const ack = await callAck<{ friendCode: string }>('presence:update', {
      playerName: trimmedName,
      deviceId,
      friendCode,
    });
    if (!ack.ok) {
      setState((prev) => ({ ...prev, error: ack.error }));
      return false;
    }

    if (ack.data.friendCode !== friendCode) {
      setFriendCode(ack.data.friendCode);
      try {
        window.localStorage.setItem(ONLINE_FRIEND_CODE_KEY, ack.data.friendCode);
      } catch {
        // Ignore storage errors.
      }
    }

    setState((prev) => ({ ...prev, error: null, friendCode: ack.data.friendCode }));
    return true;
  }, [callAck, deviceId, friendCode]);

  const createRoom = useCallback(async (playerName: string) => {
    const ack = await callAck<{ room: RoomSnapshot; playerId: string }>('room:create', { playerName, deviceId });
    if (!ack.ok) {
      setState((prev) => ({ ...prev, error: ack.error }));
      return false;
    }

    setState((prev) => ({
      ...prev,
      room: ack.data.room,
      game: ack.data.room.game,
      playerId: ack.data.playerId,
      error: null,
      log: ['Room created'],
    }));
    return true;
  }, [callAck, deviceId]);

  const joinRoom = useCallback(async (roomId: string, playerName: string) => {
    const ack = await callAck<{ room: RoomSnapshot; playerId: string }>('room:join', { roomId, playerName, deviceId });
    if (!ack.ok) {
      setState((prev) => ({ ...prev, error: ack.error }));
      return false;
    }

    setState((prev) => ({
      ...prev,
      room: ack.data.room,
      game: ack.data.room.game,
      playerId: ack.data.playerId,
      error: null,
      log: [`Joined room ${ack.data.room.roomId}`],
    }));
    return true;
  }, [callAck, deviceId]);

  const startOnlineGame = useCallback(async (rules: Partial<GameRules>) => {
    if (!state.room) return false;
    const ack = await callAck<{ room: RoomSnapshot }>('room:start', { roomId: state.room.roomId, rules });
    if (!ack.ok) {
      setState((prev) => ({ ...prev, error: ack.error }));
      return false;
    }

    setState((prev) => ({
      ...prev,
      room: ack.data.room,
      game: ack.data.room.game,
      error: null,
      log: ['Game started', ...prev.log].slice(0, 30),
    }));
    return true;
  }, [callAck, state.room]);

  const kickPlayer = useCallback(async (targetPlayerId: string) => {
    if (!state.room) return false;
    const ack = await callAck<{ room: RoomSnapshot }>('room:kick', {
      roomId: state.room.roomId,
      targetPlayerId,
    });
    if (!ack.ok) {
      setState((prev) => ({ ...prev, error: ack.error }));
      return false;
    }

    setState((prev) => ({
      ...prev,
      room: ack.data.room,
      game: ack.data.room.game,
      error: null,
      log: ['Player removed by host', ...prev.log].slice(0, 30),
    }));
    return true;
  }, [callAck, state.room]);

  const addBotToRoom = useCallback(async () => {
    if (!state.room) return false;
    const ack = await callAck<{ room: RoomSnapshot }>('room:add-bot', {
      roomId: state.room.roomId,
    });
    if (!ack.ok) {
      setState((prev) => ({ ...prev, error: ack.error }));
      return false;
    }

    setState((prev) => ({
      ...prev,
      room: ack.data.room,
      game: ack.data.room.game,
      error: null,
      log: ['Bot seat added', ...prev.log].slice(0, 30),
    }));
    return true;
  }, [callAck, state.room]);

  const sendFriendInvite = useCallback(async (targetFriendCode: string, playerName: string) => {
    const ack = await callAck<{ room: RoomSnapshot; playerId: string; invite: FriendInvite }>('friend:invite', {
      targetFriendCode,
      playerName,
      deviceId,
      friendCode,
    });
    if (!ack.ok) {
      setState((prev) => ({ ...prev, error: ack.error }));
      return false;
    }

    setState((prev) => ({
      ...prev,
      room: ack.data.room,
      game: ack.data.room.game,
      playerId: ack.data.playerId,
      error: null,
      log: [`Invite sent to ${targetFriendCode.toUpperCase()}`, ...prev.log].slice(0, 30),
    }));
    return true;
  }, [callAck, deviceId, friendCode]);

  const acceptFriendInvite = useCallback(async (inviteId: string, playerName: string) => {
    const ack = await callAck<{ room: RoomSnapshot; playerId: string }>('friend:invite:accept', {
      inviteId,
      playerName,
      deviceId,
      friendCode,
    });
    if (!ack.ok) {
      setState((prev) => ({ ...prev, error: ack.error }));
      return false;
    }

    setState((prev) => ({
      ...prev,
      room: ack.data.room,
      game: ack.data.room.game,
      playerId: ack.data.playerId,
      incomingInvites: prev.incomingInvites.filter((invite) => invite.inviteId !== inviteId),
      error: null,
      log: [`Joined ${ack.data.room.roomId} from invite`, ...prev.log].slice(0, 30),
    }));
    return true;
  }, [callAck, deviceId, friendCode]);

  const declineFriendInvite = useCallback(async (inviteId: string) => {
    const ack = await callAck<{ inviteId: string }>('friend:invite:decline', { inviteId });
    if (!ack.ok) {
      setState((prev) => ({ ...prev, error: ack.error }));
      return false;
    }

    setState((prev) => ({
      ...prev,
      incomingInvites: prev.incomingInvites.filter((invite) => invite.inviteId !== inviteId),
      error: null,
    }));
    return true;
  }, [callAck]);

  const leaveRoom = useCallback(async () => {
    if (state.room) {
      const ack = await callAck<{ left: true }>('room:leave', { roomId: state.room.roomId });
      if (!ack.ok) {
        setState((prev) => ({ ...prev, error: ack.error }));
        return false;
      }
    }

    setState((prev) => ({
      ...prev,
      room: null,
      game: null,
      playerId: null,
      pendingWild: null,
      drawnThisTurn: false,
      log: [],
      error: null,
    }));

    return true;
  }, [callAck, state.room]);

  const sendAction = useCallback(async (action: MultiplayerAction) => {
    if (!state.room) return;
    const ack = await callAck<{ room: RoomSnapshot }>('game:action', {
      roomId: state.room.roomId,
      action,
    });

    if (!ack.ok) {
      setState((prev) => ({ ...prev, error: ack.error }));
    }
  }, [callAck, state.room]);

  const game = state.game;
  const localPlayerIndex = useMemo(() => {
    if (!game || !state.playerId) return 0;
    const idx = game.players.findIndex((p) => p.id === state.playerId);
    return idx >= 0 ? idx : 0;
  }, [game, state.playerId]);

  const currentPlayer = game?.players[game.currentPlayerIndex] ?? null;
  const localPlayer = game?.players[localPlayerIndex] ?? null;
  const isLocalTurn = !!game && game.currentPlayerIndex === localPlayerIndex;

  const playableCardIds = useMemo(
    () => new Set(
      game && localPlayer && isLocalTurn
        ? getPlayableCards(localPlayer.hand, game, localPlayerIndex).map((c) => c.id)
        : [],
    ),
    [game, localPlayer, isLocalTurn, localPlayerIndex],
  );

  const canPass = state.drawnThisTurn && (game?.pendingDraw ?? 0) === 0;
  const hasPendingStackOption = !!(
    game && localPlayer && isLocalTurn && game.pendingDraw > 0 && playableCardIds.size > 0
  );

  useEffect(() => {
    if (!state.connected || !game || !localPlayer || !isLocalTurn) return;
    if (!state.drawnThisTurn) return;
    if ((game.pendingDraw ?? 0) > 0) return;
    if (playableCardIds.size > 0) return;

    const timer = window.setTimeout(() => {
      void sendAction({ type: 'pass' });
    }, 900);

    return () => window.clearTimeout(timer);
  }, [
    state.connected,
    state.drawnThisTurn,
    game,
    localPlayer,
    isLocalTurn,
    playableCardIds,
    sendAction,
  ]);

  const selectCard = useCallback((card: Card) => {
    if (!game) return;
    if (card.color === 'wild') {
      setState((prev) => ({ ...prev, pendingWild: card }));
      return;
    }
    void sendAction({ type: 'play', cardId: card.id });
  }, [game, sendAction]);

  const confirmWildColor = useCallback((color: CardColor) => {
    setState((prev) => {
      if (!prev.pendingWild) return prev;
      void sendAction({ type: 'play', cardId: prev.pendingWild.id, chosenColor: color });
      return { ...prev, pendingWild: null };
    });
  }, [sendAction]);

  const cancelWild = useCallback(() => {
    setState((prev) => ({ ...prev, pendingWild: null }));
  }, []);

  const drawCard = useCallback(() => {
    void sendAction({ type: 'draw' });
  }, [sendAction]);

  const pass = useCallback(() => {
    void sendAction({ type: 'pass' });
  }, [sendAction]);

  const sayUno = useCallback(() => {
    void sendAction({ type: 'sayUno' });
  }, [sendAction]);

  const callOut = useCallback((_callerIndex: number, targetIndex: number) => {
    if (!game) return;
    const target = game.players[targetIndex];
    if (!target) return;
    void sendAction({ type: 'callOut', targetPlayerId: target.id });
  }, [game, sendAction]);

  const resetGame = useCallback(() => {
    void (async () => {
      await leaveRoom();
    })();
  }, [leaveRoom]);

  useEffect(() => {
    if (!state.connected || !game || game.winnerId || !localPlayer || !isLocalTurn) return;

    const timeoutMs = state.pendingWild
      ? HUMAN_IDLE_WILD_PICK_TIMEOUT_MS
      : state.drawnThisTurn
        ? HUMAN_IDLE_AFTER_DRAW_TIMEOUT_MS
        : HUMAN_IDLE_TIMEOUT_MS;

    const timer = setTimeout(() => {
      // Wild chosen but color not confirmed: auto-pick preferred color.
      if (state.pendingWild) {
        const color = getBotPreferredColor(localPlayer.hand);
        setState((prev) => ({ ...prev, pendingWild: null }));
        void sendAction({ type: 'play', cardId: state.pendingWild.id, chosenColor: color });
        return;
      }

      // If player already drew this turn, end turn by passing unless they
      // explicitly choose to play from the UI.
      if (state.drawnThisTurn) {
        void sendAction({ type: 'pass' });
        return;
      }

      // Normal turn auto-resolution.
      const move = getBotMove(game, localPlayerIndex);
      if (move.action === 'play') {
        void sendAction({ type: 'play', cardId: move.cardId, chosenColor: move.chosenColor });
      } else if (move.action === 'drawRequired' || move.action === 'draw') {
        void sendAction({ type: 'draw' });
      } else {
        void sendAction({ type: 'pass' });
      }
    }, timeoutMs);

    return () => clearTimeout(timer);
  }, [
    state.connected,
    state.pendingWild,
    state.drawnThisTurn,
    game,
    localPlayer,
    localPlayerIndex,
    isLocalTurn,
    sendAction,
  ]);

  const startGame = useCallback(() => {
    // No-op for compatibility with GameBoard typing.
  }, []);

  return {
    game,
    localPlayerIndex,
    pendingWild: state.pendingWild,
    drawnThisTurn: state.drawnThisTurn,
    botThinking: false,
    log: state.log,
    currentPlayer,
    localPlayer,
    isLocalTurn,
    playableCardIds,
    canPass,
    hasPendingStackOption,
    startGame,
    selectCard,
    confirmWildColor,
    cancelWild,
    drawCard,
    pass,
    sayUno,
    callOut,
    resetGame,
    connected: state.connected,
    room: state.room,
    playerId: state.playerId,
    error: state.error,
    friendCode,
    incomingInvites: state.incomingInvites,
    syncPresence,
    createRoom,
    joinRoom,
    startOnlineGame,
    kickPlayer,
    addBotToRoom,
    sendFriendInvite,
    acceptFriendInvite,
    declineFriendInvite,
    leaveRoom,
  };
}
