'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import type { GameState } from '../types/game';
import type { Card, CardColor } from '../types/card';
import type { GameRules } from '../types/rules';
import type { PlayOptions } from '../lib/gameActions';
import type {
  Ack,
  FriendInvite,
  SocialSnapshot,
  MultiplayerAction,
  RoomSnapshot,
} from '../types/multiplayer';
import { toast } from 'sonner';
import { getProfileIdForRules } from '../lib/customRuleProfiles';
import { getPlayableCards } from '../lib/gameRules';
import { toPresentationGame } from '../lib/gameView';
import {
  getPlayerName,
  resolvePlayerName,
  subscribePlayerName,
} from '../lib/playerNames';
import { getPlayerAvatar, subscribePlayerAvatar } from '../lib/playerAvatars';
import { usePlayerActivity } from './usePlayerActivity';
import {
  ONLINE_UNAVAILABLE_MESSAGE,
  resolveSocketEndpoint,
} from '../lib/socketConnection';

const AUTO_PASS_AFTER_DRAW_MS = 650;
const ACTIVE_ROOM_KEY = 'uno.online.activeRoom';
const ONLINE_DEVICE_ID_KEY = 'uno.online.deviceId';
const ONLINE_FRIEND_CODE_KEY = 'uno.online.friendCode';

interface OutgoingInvitePending {
  inviteId: string;
  createdAt: number;
  targetFriendCode: string;
  targetName?: string;
}

function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return 'server-device';

  try {
    const existing = window.localStorage.getItem(ONLINE_DEVICE_ID_KEY);
    if (existing && existing.trim()) return existing.trim();

    const generated =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
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
      return existing
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, 8);
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

function describeAction(game: {
  lastAction: GameState['lastAction'];
  players: Array<{ id: string; name: string }>;
}): string {
  const action = game.lastAction;

  switch (action.type) {
    case 'play': {
      const extras: string[] = [];
      if (action.playedCards) extras.push('played both matching numbers');
      if (action.declaredUno) extras.push('called UNO');
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
  const membershipRevision = useRef(0);
  const discardStaleMembership = useCallback(
    (revision: number, room?: RoomSnapshot) => {
      if (revision === membershipRevision.current) return false;
      // A cancelled join may still have created server membership. Release only that room.
      if (room) socketRef.current?.emit('room:leave', { roomId: room.roomId });
      return true;
    },
    [],
  );
  const [deviceId] = useState<string>(getOrCreateDeviceId);
  const [friendCode, setFriendCode] = useState<string>(getOrCreateFriendCode);
  const [social, setSocial] = useState<SocialSnapshot>({
    friends: [],
    incomingRequests: [],
    outgoingRequests: [],
  });
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
    const socketUrl = resolveSocketEndpoint(
      process.env.NEXT_PUBLIC_SOCKET_URL,
      window.location,
      process.env.NODE_ENV === 'development',
    );
    if (!socketUrl) {
      const timeout = window.setTimeout(
        () =>
          setState((prev) => ({
            ...prev,
            connected: false,
            error: ONLINE_UNAVAILABLE_MESSAGE,
          })),
        0,
      );
      return () => window.clearTimeout(timeout);
    }

    const socket = io(socketUrl, {
      transports: ['websocket'],
      auth: { protocolVersion: 2, avatarId: getPlayerAvatar() },
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setState((prev) => ({ ...prev, connected: true, error: null }));
      try {
        const saved = JSON.parse(
          sessionStorage.getItem(ACTIVE_ROOM_KEY) ?? 'null',
        ) as { roomId?: string; playerName?: string } | null;
        if (saved?.roomId && typeof saved.roomId === 'string') {
          const revision = ++membershipRevision.current;
          socket.timeout(6000).emit(
            'room:join',
            {
              roomId: saved.roomId,
              playerName: getPlayerName(saved.playerName || 'You'),
              deviceId,
            },
            (
              error: Error | null,
              ack?: Ack<{ room: RoomSnapshot; playerId: string }>,
            ) => {
              if (
                discardStaleMembership(
                  revision,
                  ack?.ok ? ack.data.room : undefined,
                )
              )
                return;
              if (error || !ack?.ok) {
                // A vanished server/room ends this session; don't send actions with stale membership.
                try {
                  sessionStorage.removeItem(ACTIVE_ROOM_KEY);
                } catch {}
                setState((prev) => ({
                  ...prev,
                  room: null,
                  game: null,
                  playerId: null,
                  error: error
                    ? 'Could not reconnect. Join the room again.'
                    : ack && !ack.ok
                      ? ack.error
                      : 'Could not restore your table.',
                }));
                return;
              }
              setState((prev) => ({
                ...prev,
                room: ack.data.room,
                game: toPresentationGame(ack.data.room.game),
                playerId: ack.data.playerId,
                drawnThisTurn: Boolean(
                  ack.data.room.game?.drawnThisTurn &&
                  ack.data.room.game.players[
                    ack.data.room.game.currentPlayerIndex
                  ]?.id === ack.data.playerId,
                ),
                error: null,
              }));
            },
          );
        }
      } catch {
        /* Session storage is optional. */
      }
    });

    socket.on('connect_error', () => {
      setState((prev) => ({
        ...prev,
        connected: false,
        error: prev.room ? null : ONLINE_UNAVAILABLE_MESSAGE,
      }));
    });

    socket.on('disconnect', () => {
      setState((prev) => ({ ...prev, connected: false }));
    });

    socket.on('room:update', (room: RoomSnapshot) => {
      setState((prev) => {
        // Late bot/action broadcasts cannot re-open a table after leaving.
        if (!prev.room || prev.room.roomId !== room.roomId) return prev;
        let nextLog = room.started ? prev.log : [];
        if (room.game) {
          const actionLine = describeAction(room.game);
          nextLog = [
            actionLine,
            ...prev.log.filter((entry) => entry !== actionLine),
          ].slice(0, 30);
        }

        const drawnThisTurn = Boolean(
          room.game?.drawnThisTurn &&
          room.game.players[room.game.currentPlayerIndex]?.id === prev.playerId,
        );

        return {
          ...prev,
          room,
          game: toPresentationGame(room.game),
          log: nextLog,
          drawnThisTurn,
          error: null,
        };
      });
    });

    socket.on('room:kicked', (payload?: { message?: string }) => {
      membershipRevision.current++;
      try {
        sessionStorage.removeItem(ACTIVE_ROOM_KEY);
      } catch {}
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

    socket.on('social:update', (snapshot: SocialSnapshot) =>
      setSocial(snapshot),
    );

    socket.on('friend:invite', (invite: FriendInvite) => {
      setState((prev) => ({
        ...prev,
        incomingInvites: [
          invite,
          ...prev.incomingInvites.filter(
            (entry) => entry.inviteId !== invite.inviteId,
          ),
        ]
          .sort((a, b) => b.createdAt - a.createdAt)
          .slice(0, 10),
      }));
    });

    socket.on('friend:invite:removed', (payload?: { inviteId?: string }) => {
      if (!payload?.inviteId) return;
      setState((prev) => ({
        ...prev,
        incomingInvites: prev.incomingInvites.filter(
          (invite) => invite.inviteId !== payload.inviteId,
        ),
        outgoingInvites: prev.outgoingInvites.filter(
          (invite) => invite.inviteId !== payload.inviteId,
        ),
      }));
    });

    socket.on(
      'friend:invite:accepted',
      (payload?: {
        inviteId?: string;
        targetFriendCode?: string;
        targetName?: string;
      }) => {
        if (!payload?.inviteId || !payload?.targetFriendCode) return;
        setState((prev) => ({
          ...prev,
          outgoingInvites: prev.outgoingInvites.filter(
            (invite) => invite.inviteId !== payload.inviteId,
          ),
          log: [
            `${payload.targetName ?? payload.targetFriendCode} accepted your invite`,
            ...prev.log,
          ].slice(0, 30),
        }));
      },
    );

    socket.on(
      'friend:invite:declined',
      (payload?: { inviteId?: string; targetFriendCode?: string }) => {
        if (!payload?.inviteId) return;
        setState((prev) => ({
          ...prev,
          outgoingInvites: prev.outgoingInvites.filter(
            (invite) => invite.inviteId !== payload.inviteId,
          ),
          log: [
            `${payload.targetFriendCode ?? 'Friend'} declined invite`,
            ...prev.log,
          ].slice(0, 30),
        }));
      },
    );

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [deviceId, discardStaleMembership]);

  useEffect(
    () =>
      subscribePlayerAvatar(() => {
        const socket = socketRef.current;
        if (!socket) return;
        const avatarId = getPlayerAvatar();
        socket.auth = { ...socket.auth, avatarId };
        if (socket.connected)
          socket
            .timeout(6000)
            .emit(
              'profile:avatar',
              { avatarId },
              (error: Error | null, ack?: Ack<{ updated: true }>) => {
                if (error || !ack?.ok)
                  setState((prev) => ({
                    ...prev,
                    error: error
                      ? 'Could not update your avatar. Reconnect to try again.'
                      : ack && !ack.ok
                        ? ack.error
                        : 'Could not update your avatar.',
                  }));
              },
            );
      }),
    [],
  );

  useEffect(() => {
    if (!state.room || !state.playerId) return;
    try {
      sessionStorage.setItem(
        ACTIVE_ROOM_KEY,
        JSON.stringify({
          roomId: state.room.roomId,
          playerName:
            state.room.players.find((p) => p.playerId === state.playerId)
              ?.name ?? 'You',
        }),
      );
    } catch {}
  }, [state.room, state.playerId]);

  useEffect(() => {
    const id = state.room?.roomId ?? null;
    if (!id) {
      announcedRoomIdRef.current = null;
      return;
    }
    if (announcedRoomIdRef.current === id) return;
    announcedRoomIdRef.current = id;
  }, [state.room?.roomId]);

  const callAck = useCallback(
    <T>(event: string, payload: object): Promise<Ack<T>> => {
      const socket = socketRef.current;
      if (!socket?.connected)
        return Promise.resolve({
          ok: false,
          error: ONLINE_UNAVAILABLE_MESSAGE,
        });

      return new Promise((resolve) => {
        socket
          .timeout(6000)
          .emit(event, payload, (error: Error | null, ack?: Ack<T>) =>
            resolve(
              error
                ? { ok: false, error: 'That took too long. Please try again.' }
                : (ack ?? { ok: false, error: 'No response from the table.' }),
            ),
          );
      });
    },
    [],
  );

  const syncPresence = useCallback(
    async (playerName: string) => {
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
          window.localStorage.setItem(
            ONLINE_FRIEND_CODE_KEY,
            ack.data.friendCode,
          );
        } catch {
          // Ignore storage errors.
        }
      }

      setState((prev) => ({
        ...prev,
        error: null,
        friendCode: ack.data.friendCode,
      }));
      return true;
    },
    [callAck, deviceId, friendCode],
  );

  useEffect(() => {
    if (!state.connected) return;
    const sync = () => void syncPresence(getPlayerName());
    sync();
    const unsubscribe = subscribePlayerName(sync);
    const timer = window.setInterval(sync, 60_000);
    return () => {
      unsubscribe();
      window.clearInterval(timer);
    };
  }, [state.connected, syncPresence]);

  const socialAction = useCallback(
    async (event: string, payload: object) => {
      const ack = await callAck(event, payload);
      if (!ack.ok) {
        toast.error(ack.error);
        return false;
      }
      return true;
    },
    [callAck],
  );
  const sendFriendRequest = useCallback(
    (targetFriendCode: string) =>
      socialAction('social:request', { targetFriendCode }),
    [socialAction],
  );
  const respondToFriendRequest = useCallback(
    (requestId: string, accept: boolean) =>
      socialAction('social:respond', { requestId, accept }),
    [socialAction],
  );
  const removeFriend = useCallback(
    (friendCode: string) => socialAction('social:remove', { friendCode }),
    [socialAction],
  );

  useEffect(() => {
    const timer = window.setInterval(
      () =>
        setState((prev) => {
          const fresh = prev.incomingInvites.filter(
            (invite) => Date.now() - invite.createdAt < 120_000,
          );
          const outgoing = prev.outgoingInvites.filter(
            (invite) => Date.now() - invite.createdAt < 120_000,
          );
          return fresh.length === prev.incomingInvites.length &&
            outgoing.length === prev.outgoingInvites.length
            ? prev
            : { ...prev, incomingInvites: fresh, outgoingInvites: outgoing };
        }),
      15_000,
    );
    return () => window.clearInterval(timer);
  }, []);

  const createRoom = useCallback(
    async (playerName: string, rules?: Partial<GameRules>) => {
      const revision = ++membershipRevision.current;
      const ack = await callAck<{ room: RoomSnapshot; playerId: string }>(
        'room:create',
        { playerName, deviceId, rules, profileId: getProfileIdForRules(rules) },
      );
      if (discardStaleMembership(revision, ack.ok ? ack.data.room : undefined))
        return false;
      if (!ack.ok) {
        setState((prev) => ({ ...prev, error: ack.error }));
        return false;
      }

      setState((prev) => ({
        ...prev,
        room: ack.data.room,
        game: toPresentationGame(ack.data.room.game),
        playerId: ack.data.playerId,
        error: null,
        log: ['Room created'],
      }));
      return true;
    },
    [callAck, discardStaleMembership, deviceId],
  );

  const updateRoomRules = useCallback(
    async (rules: Partial<GameRules>) => {
      if (!state.room) return false;
      const revision = membershipRevision.current;
      const ack = await callAck<{ room: RoomSnapshot }>('room:set-rules', {
        roomId: state.room.roomId,
        rules,
        profileId: getProfileIdForRules(rules),
      });
      if (discardStaleMembership(revision)) return false;
      if (!ack.ok) {
        setState((prev) => ({ ...prev, error: ack.error }));
        return false;
      }

      setState((prev) => ({
        ...prev,
        room: ack.data.room,
        game: toPresentationGame(ack.data.room.game),
        error: null,
      }));
      return true;
    },
    [callAck, discardStaleMembership, state.room],
  );

  const joinRoom = useCallback(
    async (roomId: string, playerName: string) => {
      const revision = ++membershipRevision.current;
      const ack = await callAck<{ room: RoomSnapshot; playerId: string }>(
        'room:join',
        { roomId, playerName, deviceId },
      );
      if (discardStaleMembership(revision, ack.ok ? ack.data.room : undefined))
        return false;
      if (!ack.ok) {
        setState((prev) => ({ ...prev, error: ack.error }));
        return false;
      }

      setState((prev) => ({
        ...prev,
        room: ack.data.room,
        game: toPresentationGame(ack.data.room.game),
        playerId: ack.data.playerId,
        error: null,
        log: [`Joined room ${ack.data.room.roomId}`],
      }));
      return true;
    },
    [callAck, discardStaleMembership, deviceId],
  );

  const startOnlineGame = useCallback(
    async (rules: Partial<GameRules>) => {
      if (!state.room) return false;
      const revision = membershipRevision.current;
      const ack = await callAck<{ room: RoomSnapshot }>('room:start', {
        roomId: state.room.roomId,
        rules,
        profileId: state.room.profileId,
      });
      if (discardStaleMembership(revision)) return false;
      if (!ack.ok) {
        setState((prev) => ({ ...prev, error: ack.error }));
        return false;
      }

      setState((prev) => ({
        ...prev,
        room: ack.data.room,
        game: toPresentationGame(ack.data.room.game),
        error: null,
        log: ['Game started', ...prev.log].slice(0, 30),
      }));
      return true;
    },
    [callAck, discardStaleMembership, state.room],
  );

  const kickPlayer = useCallback(
    async (targetPlayerId: string) => {
      if (!state.room) return false;
      const revision = membershipRevision.current;
      const ack = await callAck<{ room: RoomSnapshot }>('room:kick', {
        roomId: state.room.roomId,
        targetPlayerId,
      });
      if (discardStaleMembership(revision)) return false;
      if (!ack.ok) {
        setState((prev) => ({ ...prev, error: ack.error }));
        return false;
      }

      setState((prev) => ({
        ...prev,
        room: ack.data.room,
        game: toPresentationGame(ack.data.room.game),
        error: null,
        log: ['Player removed by host', ...prev.log].slice(0, 30),
      }));
      return true;
    },
    [callAck, discardStaleMembership, state.room],
  );

  const addBotToRoom = useCallback(async () => {
    if (!state.room) return false;
    const revision = membershipRevision.current;
    const ack = await callAck<{ room: RoomSnapshot }>('room:add-bot', {
      roomId: state.room.roomId,
    });
    if (discardStaleMembership(revision)) return false;
    if (!ack.ok) {
      setState((prev) => ({ ...prev, error: ack.error }));
      return false;
    }

    setState((prev) => ({
      ...prev,
      room: ack.data.room,
      game: toPresentationGame(ack.data.room.game),
      error: null,
      log: ['Bot seat added', ...prev.log].slice(0, 30),
    }));
    return true;
  }, [callAck, discardStaleMembership, state.room]);

  const toggleReady = useCallback(async () => {
    if (!state.room) return false;
    const revision = membershipRevision.current;
    const ack = await callAck<{ room: RoomSnapshot }>('room:ready', {
      roomId: state.room.roomId,
    });
    if (discardStaleMembership(revision)) return false;
    if (!ack.ok) {
      setState((prev) => ({ ...prev, error: ack.error }));
      return false;
    }

    setState((prev) => ({
      ...prev,
      room: ack.data.room,
      game: toPresentationGame(ack.data.room.game),
      error: null,
    }));
    return true;
  }, [callAck, discardStaleMembership, state.room]);

  const returnToLobby = useCallback(async () => {
    if (!state.room) return false;
    const revision = membershipRevision.current;
    const ack = await callAck<{ room: RoomSnapshot }>('room:return-to-lobby', {
      roomId: state.room.roomId,
    });
    if (discardStaleMembership(revision)) return false;
    if (!ack.ok) {
      setState((prev) => ({ ...prev, error: ack.error }));
      return false;
    }
    // The ordered room:update broadcast owns the transition. A delayed reply
    // must not overwrite a new round dealt from the returned lobby.
    return true;
  }, [callAck, discardStaleMembership, state.room]);

  const sendFriendInvite = useCallback(
    async (targetFriendCode: string, playerName: string) => {
      const revision = ++membershipRevision.current;
      const ack = await callAck<{
        room: RoomSnapshot;
        playerId: string;
        invite: FriendInvite;
      }>('friend:invite', {
        targetFriendCode,
        playerName,
        deviceId,
        friendCode,
      });
      if (discardStaleMembership(revision, ack.ok ? ack.data.room : undefined))
        return false;
      if (!ack.ok) {
        setState((prev) => ({ ...prev, error: ack.error }));
        return false;
      }

      setState((prev) => ({
        ...prev,
        room: ack.data.room,
        game: toPresentationGame(ack.data.room.game),
        playerId: ack.data.playerId,
        outgoingInvites: [
          {
            inviteId: ack.data.invite.inviteId,
            createdAt: ack.data.invite.createdAt,
            targetFriendCode: targetFriendCode.toUpperCase(),
            targetName: undefined,
          },
          ...prev.outgoingInvites.filter(
            (invite) => invite.inviteId !== ack.data.invite.inviteId,
          ),
        ].slice(0, 10),
        error: null,
        log: [
          `Invite sent to ${targetFriendCode.toUpperCase()}`,
          ...prev.log,
        ].slice(0, 30),
      }));
      return true;
    },
    [callAck, discardStaleMembership, deviceId, friendCode],
  );

  const acceptFriendInvite = useCallback(
    async (inviteId: string, playerName: string) => {
      const revision = ++membershipRevision.current;
      const ack = await callAck<{ room: RoomSnapshot; playerId: string }>(
        'friend:invite:accept',
        {
          inviteId,
          playerName,
          deviceId,
          friendCode,
        },
      );
      if (discardStaleMembership(revision, ack.ok ? ack.data.room : undefined))
        return false;
      if (!ack.ok) {
        setState((prev) => ({ ...prev, error: ack.error }));
        return false;
      }

      setState((prev) => ({
        ...prev,
        room: ack.data.room,
        game: toPresentationGame(ack.data.room.game),
        playerId: ack.data.playerId,
        incomingInvites: prev.incomingInvites.filter(
          (invite) => invite.inviteId !== inviteId,
        ),
        error: null,
        log: [`Joined ${ack.data.room.roomId} from invite`, ...prev.log].slice(
          0,
          30,
        ),
      }));

      return true;
    },
    [callAck, discardStaleMembership, deviceId, friendCode],
  );

  const declineFriendInvite = useCallback(
    async (inviteId: string) => {
      const ack = await callAck<{ inviteId: string }>('friend:invite:decline', {
        inviteId,
      });
      if (!ack.ok) {
        setState((prev) => ({ ...prev, error: ack.error }));
        return false;
      }

      setState((prev) => ({
        ...prev,
        incomingInvites: prev.incomingInvites.filter(
          (invite) => invite.inviteId !== inviteId,
        ),
        error: null,
      }));
      return true;
    },
    [callAck],
  );

  const leaveRoom = useCallback(async () => {
    membershipRevision.current++;
    const roomId = state.room?.roomId;
    try {
      sessionStorage.removeItem(ACTIVE_ROOM_KEY);
    } catch {}
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
    // Leaving must always work locally, including after a server restart.
    if (roomId && socketRef.current?.connected)
      await callAck<{ left: true }>('room:leave', { roomId });
    return true;
  }, [callAck, state.room]);

  const sendAction = useCallback(
    async (action: MultiplayerAction) => {
      if (!state.room) return;
      const ack = await callAck<{ room: RoomSnapshot }>('game:action', {
        roomId: state.room.roomId,
        action,
      });

      if (!ack.ok) {
        setState((prev) => ({ ...prev, error: ack.error }));
      }
    },
    [callAck, state.room],
  );

  const game = state.game;
  const localPlayerIndex = useMemo(() => {
    if (!game || !state.playerId) return 0;
    const idx = game.players.findIndex((p) => p.id === state.playerId);
    return idx >= 0 ? idx : 0;
  }, [game, state.playerId]);

  const currentPlayer = game?.players[game.currentPlayerIndex] ?? null;
  const localPlayer = game?.players[localPlayerIndex] ?? null;
  const isLocalTurn = !!game && game.currentPlayerIndex === localPlayerIndex;

  const resumeControl = useCallback(() => {
    void sendAction({ type: 'resumeControl' });
  }, [sendAction]);
  usePlayerActivity(
    state.connected &&
      !!state.playerId &&
      !!game?.autoPlayPlayerIds?.includes(state.playerId),
    resumeControl,
  );

  const playableCardIds = useMemo(
    () =>
      new Set(
        game && localPlayer
          ? getPlayableCards(localPlayer.hand, game, localPlayerIndex).map(
              (c) => c.id,
            )
          : [],
      ),
    [game, localPlayer, localPlayerIndex],
  );

  const canPass =
    state.drawnThisTurn &&
    !game?.pendingRoulette &&
    (game?.pendingDraw ?? 0) === 0 &&
    !(
      game?.rules.gameMode === 'no_mercy' &&
      game.rules.drawUntilPlayable &&
      playableCardIds.size > 0
    );
  const pendingColorChoice = state.room?.pendingColorChoice ?? null;
  const pendingWild = useMemo(() => {
    if (game?.pendingRoulette?.playerId === state.playerId)
      return game?.discardPile.at(-1) ?? null;
    if (!pendingColorChoice || !game || !state.playerId) return null;
    if (pendingColorChoice.playerId !== state.playerId) return null;
    const localSeat = game.players.findIndex(
      (player) => player.id === state.playerId,
    );
    if (localSeat < 0) return null;
    return (
      game.players[localSeat].hand.find(
        (card) => card.id === pendingColorChoice.cardId,
      ) ?? null
    );
  }, [pendingColorChoice, game, state.playerId]);

  const wildPickerPlayerName = useMemo(() => {
    if (!pendingColorChoice || !state.room) return null;
    return (
      state.room.players.find(
        (player) => player.playerId === pendingColorChoice.playerId,
      )?.name ?? null
    );
  }, [pendingColorChoice, state.room]);
  const hasPendingStackOption = !!(
    game &&
    localPlayer &&
    isLocalTurn &&
    game.pendingDraw > 0 &&
    playableCardIds.size > 0
  );

  useEffect(() => {
    if (!state.connected || !game || !localPlayer || !isLocalTurn) return;
    if (game.autoPlayPlayerIds?.includes(localPlayer.id)) return;
    if (!state.drawnThisTurn) return;
    if ((game.pendingDraw ?? 0) > 0) return;
    if (playableCardIds.size > 0) return;

    const coordinatedAutoPassDelay = AUTO_PASS_AFTER_DRAW_MS;

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

  const selectCard = useCallback(
    (card: Card, options: PlayOptions = {}) => {
      if (!game) return;
      if (
        card.color === 'wild' &&
        game.rules.gameMode !== 'all_wild' &&
        card.value !== 'wildColorRoulette'
      ) {
        void sendAction({ type: 'prepareWild', cardId: card.id });
        return;
      }
      void sendAction({ type: 'play', cardId: card.id, ...options });
    },
    [game, sendAction],
  );

  const confirmWildColor = useCallback(
    (color: CardColor) => {
      if (game?.pendingRoulette) {
        void sendAction({ type: 'chooseRouletteColor', color });
        return;
      }
      if (!pendingWild) return;
      void sendAction({
        type: 'play',
        cardId: pendingWild.id,
        chosenColor: color,
      });
    },
    [pendingWild, game, sendAction],
  );

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

  const callOut = useCallback(
    (_callerIndex: number, targetIndex: number) => {
      if (!game) return;
      const target = game.players[targetIndex];
      if (!target) return;
      void sendAction({ type: 'callOut', targetPlayerId: target.id });
    },
    [game, sendAction],
  );

  const resetGame = useCallback(() => {
    void (async () => {
      await leaveRoom();
    })();
  }, [leaveRoom]);

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
    social,
    sendFriendRequest,
    respondToFriendRequest,
    removeFriend,
    incomingInvites: state.incomingInvites,
    outgoingInvites: state.outgoingInvites,
    createRoom,
    updateRoomRules,
    joinRoom,
    startOnlineGame,
    kickPlayer,
    addBotToRoom,
    toggleReady,
    returnToLobby,
    sendFriendInvite,
    acceptFriendInvite,
    declineFriendInvite,
    leaveRoom,
  };
}
