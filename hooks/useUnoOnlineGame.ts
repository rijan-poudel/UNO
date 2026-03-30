'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import type { GameState } from '../types/game';
import type { Card, CardColor } from '../types/card';
import type { GameRules } from '../types/rules';
import type {
  Ack,
  FriendInvite,
  FriendPresenceState,
  MultiplayerAction,
  RoomSnapshot,
} from '../types/multiplayer';
import { toast } from 'sonner';
import { getPlayableCards } from '../lib/gameRules';
import { resolvePlayerName } from '../lib/playerNames';
import { getBoardVoiceRemainingMs } from '../lib/voiceAnnouncer';
import { voiceUiConnected, voiceUiDisconnected, voiceUiRoomJoined } from '../lib/voiceAnnouncer';

const AUTO_PASS_AFTER_DRAW_MS = 1000;
const POST_ACTION_HANDOFF_DELAY_MS = 1000;
const ONLINE_DEVICE_ID_KEY = 'uno.online.deviceId';
const ONLINE_FRIEND_CODE_KEY = 'uno.online.friendCode';
const ONLINE_RECENT_ROOMS_KEY = 'uno.online.recentRooms';
const ONLINE_FRIENDS_KEY = 'uno.online.friends';
const MAX_RECENT_ROOMS = 8;
const MAX_FRIENDS = 16;

interface RecentRoomEntry {
  roomId: string;
  label: string;
  lastVisitedAt: number;
  lastPlayerName: string;
}

interface SavedFriendEntry {
  friendCode: string;
  name: string;
  lastSeenAt: number;
}

function cleanFriendName(rawName: string | undefined, fallbackCode: string): string {
  const trimmed = (rawName ?? '').trim().slice(0, 20);
  const normalized = trimmed.toLowerCase();
  const blocked = new Set(['friend', 'friends', 'player', 'unknown', 'guest']);
  if (!trimmed || blocked.has(normalized)) return fallbackCode;
  return trimmed;
}

interface OutgoingInvitePending {
  inviteId: string;
  targetFriendCode: string;
  targetName?: string;
}

function normalizeFriendCode(value: string): string {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
}

function loadSavedFriends(): SavedFriendEntry[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(ONLINE_FRIENDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item): item is SavedFriendEntry => {
        if (typeof item !== 'object' || item === null) return false;
        const candidate = item as Partial<SavedFriendEntry>;
        return typeof candidate.friendCode === 'string'
          && typeof candidate.name === 'string'
          && typeof candidate.lastSeenAt === 'number';
      })
      .map((item) => ({
        friendCode: normalizeFriendCode(item.friendCode),
        name: cleanFriendName(item.name, normalizeFriendCode(item.friendCode)),
        lastSeenAt: item.lastSeenAt,
      }))
      .filter((item) => Boolean(item.friendCode))
      .sort((a, b) => b.lastSeenAt - a.lastSeenAt)
      .slice(0, MAX_FRIENDS);
  } catch {
    return [];
  }
}

function persistAcceptedFriend(rawCode: string, rawName?: string): void {
  if (typeof window === 'undefined') return;

  const code = normalizeFriendCode(rawCode);
  if (!code) return;

  const prev = loadSavedFriends();
  const existing = prev.find((entry) => entry.friendCode === code);
  const next = [
    {
      friendCode: code,
      name: cleanFriendName(rawName?.trim() || existing?.name, code),
      lastSeenAt: Date.now(),
    },
    ...prev.filter((entry) => entry.friendCode !== code),
  ].slice(0, MAX_FRIENDS);

  try {
    window.localStorage.setItem(ONLINE_FRIENDS_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage errors.
  }
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
  outgoingInvites: OutgoingInvitePending[];
  drawnThisTurn: boolean;
  log: string[];
  error: string | null;
  connected: boolean;
}

function describeAction(game: GameState): string {
  const action = game.lastAction;

  switch (action.type) {
    case 'play': {
      const extras: string[] = [];
      if (action.discardAllCount && action.discardAllCount > 0) {
        extras.push(`discarded ${action.discardAllCount} extra`);
      }
      if (action.shuffledHands) {
        extras.push('shuffled all hands');
      }
      return `${resolvePlayerName(game.players, action.playerId)} played ${action.card.color} ${action.card.value}${
        action.chosenColor ? ` -> chose ${action.chosenColor}` : ''
      }${extras.length ? ` (${extras.join(', ')})` : ''}`;
    }
    case 'draw':
      return `${resolvePlayerName(game.players, action.playerId)} drew ${action.count} card${action.count !== 1 ? 's' : ''}`;
    case 'pass':
      return `${resolvePlayerName(game.players, action.playerId)} passed`;
    case 'declareUno':
      return `${resolvePlayerName(game.players, action.playerId)} said UNO`;
    case 'callOut':
      return `${resolvePlayerName(game.players, action.callerId)} called out ${resolvePlayerName(game.players, action.targetId)}`;
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
    outgoingInvites: [],
    drawnThisTurn: false,
    log: [],
    error: null,
    connected: false,
  });

  const announcedRoomIdRef = useRef<string | null>(null);

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
      voiceUiConnected();
    });

    socket.on('disconnect', () => {
      setState((prev) => ({ ...prev, connected: false }));
      voiceUiDisconnected();
    });

    socket.on('room:update', (room: RoomSnapshot) => {
      setState((prev) => {
        let nextLog = prev.log;
        if (room.game) {
          const actionLine = describeAction(room.game);
          nextLog = [actionLine, ...prev.log.filter((entry) => entry !== actionLine)].slice(0, 30);
        }

        // Derive drawnThisTurn purely from server state to avoid desync
        let drawnThisTurn = false;
        if (room.game && prev.playerId) {
          const localIndex = room.game.players.findIndex((p) => p.id === prev.playerId);
          if (
            localIndex >= 0 &&
            room.game.lastAction.type === 'draw' &&
            room.game.lastAction.playerId === prev.playerId &&
            room.game.pendingDraw === 0 &&
            room.game.currentPlayerIndex === localIndex
          ) {
            drawnThisTurn = true;
          }
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
        outgoingInvites: [],
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
      toast.message(`Invite from ${invite.fromName}`, {
        description: `Room ${invite.roomId} · ${invite.fromFriendCode}`,
      });
    });

    socket.on('friend:invite:removed', (payload?: { inviteId?: string }) => {
      if (!payload?.inviteId) return;
      setState((prev) => ({
        ...prev,
        incomingInvites: prev.incomingInvites.filter((invite) => invite.inviteId !== payload.inviteId),
        outgoingInvites: prev.outgoingInvites.filter((invite) => invite.inviteId !== payload.inviteId),
      }));
    });

    socket.on('friend:invite:accepted', (payload?: {
      inviteId?: string;
      targetFriendCode?: string;
      targetName?: string;
    }) => {
      if (!payload?.inviteId || !payload?.targetFriendCode) return;
      persistAcceptedFriend(payload.targetFriendCode, payload.targetName);
      setState((prev) => ({
        ...prev,
        outgoingInvites: prev.outgoingInvites.filter((invite) => invite.inviteId !== payload.inviteId),
        log: [`${payload.targetName ?? payload.targetFriendCode} accepted your invite`, ...prev.log].slice(0, 30),
      }));
    });

    socket.on('friend:invite:declined', (payload?: { inviteId?: string; targetFriendCode?: string }) => {
      if (!payload?.inviteId) return;
      setState((prev) => ({
        ...prev,
        outgoingInvites: prev.outgoingInvites.filter((invite) => invite.inviteId !== payload.inviteId),
        log: [`${payload.targetFriendCode ?? 'Friend'} declined invite`, ...prev.log].slice(0, 30),
      }));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  useEffect(() => {
    const id = state.room?.roomId ?? null;
    if (!id) {
      announcedRoomIdRef.current = null;
      return;
    }
    if (announcedRoomIdRef.current === id) return;
    announcedRoomIdRef.current = id;
    voiceUiRoomJoined();
  }, [state.room?.roomId]);

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
      outgoingInvites: [
        {
          inviteId: ack.data.invite.inviteId,
          targetFriendCode: targetFriendCode.toUpperCase(),
          targetName: undefined,
        },
        ...prev.outgoingInvites.filter((invite) => invite.inviteId !== ack.data.invite.inviteId),
      ].slice(0, 10),
      error: null,
      log: [`Invite sent to ${targetFriendCode.toUpperCase()}`, ...prev.log].slice(0, 30),
    }));
    return true;
  }, [callAck, deviceId, friendCode]);

  const acceptFriendInvite = useCallback(async (inviteId: string, playerName: string) => {
    const acceptedInvite = state.incomingInvites.find((invite) => invite.inviteId === inviteId) ?? null;
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

    if (acceptedInvite) {
      persistAcceptedFriend(acceptedInvite.fromFriendCode, acceptedInvite.fromName);
    }

    return true;
  }, [callAck, deviceId, friendCode, state.incomingInvites]);

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
      outgoingInvites: [],
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

  const checkFriendOnline = useCallback(async (friendCodes: string[]) => {
    const normalized = Array.from(new Set(friendCodes.map((code) => normalizeFriendCode(code)).filter(Boolean)));
    if (!normalized.length) return {} as Record<string, FriendPresenceState>;

    const ack = await callAck<{ statuses: Record<string, FriendPresenceState> }>('friend:status', {
      friendCodes: normalized,
    });

    if (!ack.ok) {
      setState((prev) => ({ ...prev, error: ack.error }));
      return {} as Record<string, FriendPresenceState>;
    }

    return ack.data.statuses;
  }, [callAck]);

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
  const pendingColorChoice = state.room?.pendingColorChoice ?? null;
  const pendingWild = useMemo(() => {
    if (!pendingColorChoice || !game || !state.playerId) return null;
    if (pendingColorChoice.playerId !== state.playerId) return null;
    const localSeat = game.players.findIndex((player) => player.id === state.playerId);
    if (localSeat < 0) return null;
    return game.players[localSeat].hand.find((card) => card.id === pendingColorChoice.cardId) ?? null;
  }, [pendingColorChoice, game, state.playerId]);

  const wildPickerPlayerName = useMemo(() => {
    if (!pendingColorChoice || !state.room) return null;
    return state.room.players.find((player) => player.playerId === pendingColorChoice.playerId)?.name ?? null;
  }, [pendingColorChoice, state.room]);
  const hasPendingStackOption = !!(
    game && localPlayer && isLocalTurn && game.pendingDraw > 0 && playableCardIds.size > 0
  );

  useEffect(() => {
    if (!state.connected || !game || !localPlayer || !isLocalTurn) return;
    if (!state.drawnThisTurn) return;
    if ((game.pendingDraw ?? 0) > 0) return;
    if (playableCardIds.size > 0) return;

    const coordinatedAutoPassDelay = Math.max(
      AUTO_PASS_AFTER_DRAW_MS,
      getBoardVoiceRemainingMs() + POST_ACTION_HANDOFF_DELAY_MS,
    );

    const timer = window.setTimeout(() => {
      void sendAction({ type: 'pass' });
    }, coordinatedAutoPassDelay);

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
      void sendAction({ type: 'prepareWild', cardId: card.id });
      return;
    }
    void sendAction({ type: 'play', cardId: card.id });
  }, [game, sendAction]);

  const confirmWildColor = useCallback((color: CardColor) => {
    if (!pendingWild) return;
    void sendAction({ type: 'play', cardId: pendingWild.id, chosenColor: color });
  }, [pendingWild, sendAction]);

  const cancelWild = useCallback(() => {
    void sendAction({ type: 'cancelWildChoice' });
  }, [sendAction]);

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

  const startGame = useCallback(() => {
    // No-op for compatibility with GameBoard typing.
  }, []);

  return {
    game,
    localPlayerIndex,
    pendingWild,
    wildPickerPlayerName,
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
    outgoingInvites: state.outgoingInvites,
    syncPresence,
    checkFriendOnline,
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
