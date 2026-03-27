'use client';

import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import type { FriendInvite, FriendPresenceState, RoomSnapshot } from '../types/multiplayer';
import { toast } from 'sonner';
import SetupShell from './SetupShell';
import { CountBadge, PrimaryButton, SectionDivider, SegmentedToggle, SetupIntro, UtilityButton } from './ui/PageChrome';
import { ChevronDown } from 'lucide-react';

const ONLINE_PLAYER_NAME_KEY = 'uno.online.playerName';
const ONLINE_ROOM_CODE_KEY = 'uno.online.roomCode';
const ONLINE_PANEL_KEY = 'uno.online.panel';
const ONLINE_FRIENDS_KEY = 'uno.online.friends';
const ONLINE_PREFILL_FRIEND_CODE_KEY = 'uno.online.prefill.friendCode';
const MAX_FRIENDS = 16;
const FRIEND_RAIL_LIMIT = 4;

const AVATAR_PALETTE = [
  { fg: '#102A43', bg: '#F0B429' },
  { fg: '#2D132C', bg: '#F49D6E' },
  { fg: '#12355B', bg: '#66C7F4' },
  { fg: '#1B4332', bg: '#95D5B2' },
  { fg: '#3D0C02', bg: '#FF9F1C' },
  { fg: '#2B2D42', bg: '#CDB4DB' },
  { fg: '#0B3954', bg: '#BFD7EA' },
  { fg: '#3A0CA3', bg: '#FEC5BB' },
];

interface FriendEntry {
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

function normalizeCode(value: string): string {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
}

function loadFriends(): FriendEntry[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(ONLINE_FRIENDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item): item is FriendEntry => {
        if (typeof item !== 'object' || item === null) return false;
        const candidate = item as Partial<FriendEntry>;
        return typeof candidate.friendCode === 'string'
          && typeof candidate.name === 'string'
          && typeof candidate.lastSeenAt === 'number';
      })
      .map((item) => ({
        friendCode: normalizeCode(item.friendCode),
        name: cleanFriendName(item.name, normalizeCode(item.friendCode)),
        lastSeenAt: item.lastSeenAt,
      }))
      .filter((item) => Boolean(item.friendCode))
      .sort((a, b) => b.lastSeenAt - a.lastSeenAt)
      .slice(0, MAX_FRIENDS);
  } catch {
    return [];
  }
}

function saveFriends(entries: FriendEntry[]) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(ONLINE_FRIENDS_KEY, JSON.stringify(entries.slice(0, MAX_FRIENDS)));
  } catch {
    // Ignore storage errors.
  }
}

function formatInviteTime(ts: number): string {
  const date = new Date(ts);
  if (Number.isNaN(date.getTime())) return 'just now';
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function formatLastSeen(ts: number): string {
  const date = new Date(ts);
  if (Number.isNaN(date.getTime())) return 'recently';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function firstAvatarLetter(friend: FriendEntry): string {
  const source = friend.name.trim() || friend.friendCode;
  const first = source.charAt(0).toUpperCase();
  return /[A-Z0-9]/.test(first) ? first : '#';
}

interface OnlineLobbyProps {
  connected: boolean;
  room: RoomSnapshot | null;
  playerId: string | null;
  friendCode: string;
  incomingInvites: FriendInvite[];
  outgoingInvites: Array<{ inviteId: string; targetFriendCode: string; targetName?: string }>;
  error: string | null;
  initialPanel?: 'create' | 'join';
  controls?: ReactNode;
  onBack?: () => void;
  onSyncPresence: (playerName: string) => Promise<boolean>;
  onCheckFriendOnline: (friendCodes: string[]) => Promise<Record<string, FriendPresenceState>>;
  onCreateRoom: (playerName: string) => Promise<boolean>;
  onJoinRoom: (roomId: string, playerName: string) => Promise<boolean>;
  onSendFriendInvite: (targetFriendCode: string, playerName: string) => Promise<boolean>;
  onAcceptFriendInvite: (inviteId: string, playerName: string) => Promise<boolean>;
  onDeclineFriendInvite: (inviteId: string) => Promise<boolean>;
  onLeaveRoom: () => Promise<boolean>;
  onStartGame: () => Promise<boolean>;
  onAddBotSeat: () => Promise<boolean>;
  onKickPlayer: (targetPlayerId: string) => Promise<boolean>;
}

export default function OnlineLobby({
  connected,
  room,
  playerId,
  friendCode,
  incomingInvites,
  outgoingInvites,
  error,
  initialPanel = 'create',
  controls,
  onBack,
  onSyncPresence,
  onCheckFriendOnline,
  onCreateRoom,
  onJoinRoom,
  onSendFriendInvite,
  onAcceptFriendInvite,
  onDeclineFriendInvite,
  onLeaveRoom,
  onStartGame,
  onAddBotSeat,
  onKickPlayer,
}: OnlineLobbyProps) {
  const [playerName, setPlayerName] = useState('Player 1');
  const [roomCode, setRoomCode] = useState('');
  const [panel, setPanel] = useState<'create' | 'join'>('create');
  const [friendCodeInput, setFriendCodeInput] = useState('');
  const [friends, setFriends] = useState<FriendEntry[]>([]);
  const [presenceMap, setPresenceMap] = useState<Record<string, FriendPresenceState>>({});
  const [busy, setBusy] = useState(false);

  const displayName = playerName.trim() || 'Player 1';

  useEffect(() => {
    try {
      const savedName = window.localStorage.getItem(ONLINE_PLAYER_NAME_KEY);
      if (savedName && savedName.trim()) {
        setPlayerName(savedName.trim());
      }

      const savedCode = window.localStorage.getItem(ONLINE_ROOM_CODE_KEY);
      if (savedCode && savedCode.trim()) {
        setRoomCode(savedCode.trim().toUpperCase().slice(0, 6));
      }

      const savedPanel = window.localStorage.getItem(ONLINE_PANEL_KEY);
      if (savedPanel === 'join' || savedPanel === 'create') {
        setPanel(savedPanel);
      }

      const prefillFriendCode = window.localStorage.getItem(ONLINE_PREFILL_FRIEND_CODE_KEY);
      if (prefillFriendCode && prefillFriendCode.trim()) {
        setFriendCodeInput(prefillFriendCode.trim().toUpperCase().slice(0, 8));
        window.localStorage.removeItem(ONLINE_PREFILL_FRIEND_CODE_KEY);
      }

      setFriends(loadFriends());
    } catch {
      // Ignore storage errors.
    }
  }, []);

  useEffect(() => {
    setPanel(initialPanel);
  }, [initialPanel]);

  useEffect(() => {
    if (!connected || !playerName.trim()) return;
    const timeout = window.setTimeout(() => {
      void onSyncPresence(playerName.trim());
    }, 180);
    return () => window.clearTimeout(timeout);
  }, [connected, playerName, onSyncPresence]);

  useEffect(() => {
    try {
      window.localStorage.setItem(ONLINE_ROOM_CODE_KEY, roomCode.trim().toUpperCase());
    } catch {
      // Ignore storage errors.
    }
  }, [roomCode]);

  useEffect(() => {
    try {
      window.localStorage.setItem(ONLINE_PANEL_KEY, panel);
    } catch {
      // Ignore storage errors.
    }
  }, [panel]);

  useEffect(() => {
    if (!error) return;
    toast.error(error);
  }, [error]);

  useEffect(() => {
    if (!friends.length) {
      setPresenceMap({});
      return;
    }

    let disposed = false;
    const refreshStatuses = async () => {
      const statuses = await onCheckFriendOnline(friends.map((friend) => friend.friendCode));
      if (!disposed) {
        setPresenceMap(statuses);
      }
    };

    void refreshStatuses();
    const timer = window.setInterval(() => {
      void refreshStatuses();
    }, 12000);

    return () => {
      disposed = true;
      window.clearInterval(timer);
    };
  }, [friends, onCheckFriendOnline]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomFromUrl = params.get('room');
    if (roomFromUrl) {
      setRoomCode(roomFromUrl.toUpperCase().slice(0, 6));
      setPanel('join');
    }
  }, []);

  const isHost = useMemo(() => room?.hostPlayerId === playerId, [room, playerId]);
  const isRoomFull = (room?.players.length ?? 0) >= 4;
  const sortedFriends = useMemo(
    () => [...friends].sort((a, b) => {
      const rank = (state: FriendPresenceState | undefined) => {
        if (state === 'playing') return 2;
        if (state === 'online') return 1;
        return 0;
      };
      const aOnline = rank(presenceMap[a.friendCode]);
      const bOnline = rank(presenceMap[b.friendCode]);
      if (aOnline !== bOnline) return bOnline - aOnline;
      return b.lastSeenAt - a.lastSeenAt;
    }),
    [friends, presenceMap],
  );

  const railFriends = useMemo(() => sortedFriends.slice(0, FRIEND_RAIL_LIMIT), [sortedFriends]);
  const railFriendsWithAvatar = useMemo(() => {
    const usageByLetter: Record<string, number> = {};
    return railFriends.map((friend) => {
      const letter = firstAvatarLetter(friend);
      const usage = usageByLetter[letter] ?? 0;
      usageByLetter[letter] = usage + 1;
      return {
        friend,
        letter,
        avatarColor: AVATAR_PALETTE[usage % AVATAR_PALETTE.length],
        presence: presenceMap[friend.friendCode] ?? 'offline',
      };
    });
  }, [railFriends, presenceMap]);

  async function wrap(action: () => Promise<boolean>) {
    setBusy(true);
    try {
      await action();
    } finally {
      setBusy(false);
    }
  }

  async function copyText(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied.`);
    } catch {
      toast.error('Could not copy text.');
    }
  }

  const canSubmitRoomForm =
    !busy &&
    connected &&
    Boolean(displayName) &&
    (panel !== 'join' || Boolean(roomCode.trim()));

  const canSendInvite =
    !busy &&
    connected &&
    Boolean(displayName) &&
    normalizeCode(friendCodeInput).length >= 4;

  const rememberFriend = (rawCode: string, rawName?: string) => {
    const normalizedCode = normalizeCode(rawCode);
    if (!normalizedCode || normalizedCode === friendCode) return;

    setFriends((prev) => {
      const existing = prev.find((entry) => entry.friendCode === normalizedCode);
      const nextEntries = [
        {
          friendCode: normalizedCode,
          name: cleanFriendName(rawName?.trim() || existing?.name, normalizedCode),
          lastSeenAt: Date.now(),
        },
        ...prev.filter((entry) => entry.friendCode !== normalizedCode),
      ].slice(0, MAX_FRIENDS);
      saveFriends(nextEntries);
      return nextEntries;
    });
  };

  const removeFriend = (rawCode: string) => {
    const normalizedCode = normalizeCode(rawCode);
    setFriends((prev) => {
      const nextEntries = prev.filter((entry) => entry.friendCode !== normalizedCode);
      saveFriends(nextEntries);
      return nextEntries;
    });
  };

  const sendInviteToFriend = async (targetCode: string, targetName?: string) => {
    const normalizedCode = normalizeCode(targetCode);
    const invited = await onSendFriendInvite(normalizedCode, displayName);
    if (invited) {
      toast.success(`Invite sent to ${targetName ?? normalizedCode}.`);
    }
    return invited;
  };

  const requestKick = (targetPlayerId: string, targetName: string) => {
    if (busy) return;
    const approved = window.confirm(`Remove ${targetName} from this room?`);
    if (!approved) return;

    void wrap(async () => {
      const removed = await onKickPlayer(targetPlayerId);
      if (removed) {
        toast.success(`${targetName} removed from room.`);
      }
      return removed;
    });
  };

  const shareLink = room && typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?room=${room.roomId}`
    : '';

  const roomActions = room && !room.started ? (
    <div style={{ display: 'grid', gap: 8 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }}>
        <input
          value={room.roomId}
          readOnly
          style={{
            padding: '10px 12px',
            border: '1px solid var(--ui-line)',
            background: 'var(--ui-surface)',
            fontFamily: "'Courier Prime', monospace",
            letterSpacing: '0.08em',
            color: 'var(--ui-text)',
          }}
        />
        <UtilityButton onClick={() => { void copyText(room.roomId, 'Room code'); }} style={{ padding: '10px 14px' }}>Copy Code</UtilityButton>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }}>
        <input
          value={shareLink}
          readOnly
          style={{
            padding: '10px 12px',
            border: '1px solid var(--ui-line)',
            background: 'var(--ui-surface)',
            fontSize: 12,
            color: 'var(--ui-text)',
          }}
        />
        <UtilityButton onClick={() => { void copyText(shareLink, 'Invite link'); }} style={{ padding: '10px 14px' }}>Copy Link</UtilityButton>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }}>
        <input
          value={friendCodeInput}
          onChange={(e) => setFriendCodeInput(e.target.value.toUpperCase())}
          maxLength={8}
          placeholder="INVITE FRIEND CODE"
          className="setup-input"
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: '1px solid var(--ui-line)',
            fontFamily: "'Courier Prime', monospace",
            fontSize: 13,
            color: 'var(--ui-text)',
            padding: '2px 0',
            width: '100%',
            transition: 'border-bottom-color 0.12s',
            textTransform: 'uppercase',
          }}
        />
        <button
          type="button"
          disabled={!canSendInvite}
          onClick={() => wrap(async () => {
            const invited = await sendInviteToFriend(friendCodeInput.trim());
            if (invited) {
              setFriendCodeInput('');
            }
            return invited;
          })}
          style={{
            padding: '10px 14px',
            border: '1px solid var(--ui-line)',
            background: 'var(--ui-surface)',
            cursor: canSendInvite ? 'pointer' : 'default',
            fontSize: 11,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--ui-text)',
            opacity: canSendInvite ? 1 : 0.5,
          }}
        >Invite Friend</button>
      </div>

    </div>
  ) : null;

  return (
    <SetupShell
      subtitle="Multiplayer"
      controls={controls}
      footer={
        !room ? (
          <>
            <SectionDivider style={{ marginBottom: 24 }} />
            <div style={{ display: 'grid', gap: 10 }}>
              <PrimaryButton
                disabled={!canSubmitRoomForm}
                onClick={() => {
                  void wrap(async () => {
                    const ok = panel === 'join'
                      ? await onJoinRoom(roomCode.trim(), displayName)
                      : await onCreateRoom(displayName);

                    if (ok) {
                      toast.success(panel === 'join'
                        ? `Joined room ${roomCode.trim().toUpperCase()}`
                        : 'Room created.');
                    }

                    return ok;
                  });
                }}
                style={{ fontSize: 24, letterSpacing: '0.2em' }}
              >{panel === 'join' ? 'JOIN ROOM' : 'CREATE ROOM'}</PrimaryButton>
            </div>
          </>
        ) : room && !room.started ? (
          <>
            <SectionDivider style={{ marginBottom: 24 }} />
            <div style={{ display: 'grid', gap: 10, gridTemplateColumns: isHost ? '1fr 1fr' : '1fr' }}>
              <UtilityButton
                disabled={busy}
                onClick={() => {
                  void wrap(async () => {
                    const left = await onLeaveRoom();
                    if (left) {
                      toast.success('Left room.');
                    }
                    return left;
                  });
                }}
                style={{ width: '100%', padding: '12px 0', color: 'var(--ui-text)', background: 'transparent' }}
              >Leave Room</UtilityButton>

              {isHost && (
                <PrimaryButton
                  disabled={busy || room.players.length < 2}
                  onClick={() => {
                    void wrap(onStartGame);
                  }}
                >Start Match</PrimaryButton>
              )}
            </div>
          </>
        ) : <div />
      }
    >
      <SetupIntro
        title="Play with Friends"
        description={room
          ? 'Manage seats, room code, and invites before the match starts'
          : panel === 'join'
            ? 'Join by room code'
            : 'Create a room'}
        onBack={onBack}
        trailing={room ? <CountBadge current={room.players.length} total={4} alert={isRoomFull} /> : undefined}
      />

      {!room && (
        <>
          <SegmentedToggle
            value={panel}
            onChange={setPanel}
            options={[
              { value: 'create', label: 'Create' },
              { value: 'join', label: 'Join' },
            ]}
          />

          <div style={{ display: 'grid', gap: 12, borderTop: '1px solid var(--ui-line)', paddingTop: 12 }}>
            {panel === 'join' && (
              <input
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                maxLength={6}
                placeholder="ROOM CODE"
                className="setup-input"
                style={{
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid var(--ui-line)',
                  fontFamily: "'Courier Prime', monospace",
                  fontSize: 15,
                  fontWeight: 700,
                  color: 'var(--ui-text)',
                  padding: '2px 0',
                  width: '100%',
                  transition: 'border-bottom-color 0.12s',
                  textTransform: 'uppercase',
                }}
              />
            )}

          </div>

          {incomingInvites.length > 0 && (
            <div style={{ display: 'grid', gap: 8, borderTop: '1px solid var(--ui-line)', paddingTop: 10 }}>
              <p style={{ margin: 0, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ui-muted)' }}>
                Incoming invites
              </p>
              {incomingInvites.slice(0, 5).map((invite) => (
                <div
                  key={invite.inviteId}
                  style={{
                    border: '1px solid var(--ui-line)',
                    background: 'transparent',
                    color: 'var(--ui-text)',
                    padding: '10px 12px',
                    display: 'grid',
                    gap: 8,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <span style={{ fontFamily: "'Courier Prime', monospace", fontSize: 12, letterSpacing: '0.08em' }}>
                      {invite.fromName} · {invite.fromFriendCode}
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--ui-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                      {formatInviteTime(invite.createdAt)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => wrap(async () => {
                        const declined = await onDeclineFriendInvite(invite.inviteId);
                        if (declined) {
                          toast.message('Invite declined.');
                        }
                        return declined;
                      })}
                      style={{
                        padding: '8px 10px',
                        border: '1px solid var(--ui-line)',
                        background: 'transparent',
                        color: 'var(--ui-muted)',
                        fontSize: 10,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        cursor: busy ? 'default' : 'pointer',
                        opacity: busy ? 0.5 : 1,
                      }}
                    >Decline</button>
                    <button
                      type="button"
                      disabled={busy || !displayName}
                      onClick={() => wrap(async () => {
                        rememberFriend(invite.fromFriendCode, invite.fromName);
                        const accepted = await onAcceptFriendInvite(invite.inviteId, displayName);
                        if (accepted) {
                          toast.success('Invite accepted.');
                        }
                        return accepted;
                      })}
                      style={{
                        padding: '8px 12px',
                        border: 'none',
                        background: 'var(--ui-text)',
                        color: 'var(--ui-surface)',
                        fontSize: 10,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        cursor: busy || !displayName ? 'default' : 'pointer',
                        opacity: busy || !displayName ? 0.5 : 1,
                      }}
                    >Accept</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {outgoingInvites.length > 0 && (
            <div style={{ display: 'grid', gap: 8, borderTop: '1px solid var(--ui-line)', paddingTop: 10 }}>
              <p style={{ margin: 0, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ui-muted)' }}>
                Pending requests
              </p>
              {outgoingInvites.slice(0, 4).map((invite) => (
                <div
                  key={invite.inviteId}
                  style={{
                    border: '1px solid var(--ui-line)',
                    background: 'transparent',
                    color: 'var(--ui-text)',
                    padding: '10px 12px',
                    display: 'grid',
                    gap: 6,
                  }}
                >
                  <span style={{ fontFamily: "'Courier Prime', monospace", fontSize: 12, letterSpacing: '0.06em' }}>
                    Waiting for {(invite.targetName ?? invite.targetFriendCode)} to accept...
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--ui-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    Invite sent
                  </span>
                </div>
              ))}
            </div>
          )}

          {sortedFriends.length > 0 && (
            <div style={{ display: 'grid', gap: 8, borderTop: '1px solid var(--ui-line)', paddingTop: 10 }}>
              <p style={{ margin: 0, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ui-muted)' }}>
                Friends
              </p>
              {sortedFriends.map((friend) => {
                const presence = presenceMap[friend.friendCode] ?? 'offline';
                const isInviteAllowed = presence !== 'offline';
                const statusColor = presence === 'playing'
                  ? 'var(--ui-accent-blue)'
                  : presence === 'online'
                    ? 'var(--ui-accent-green)'
                    : 'var(--ui-muted)';
                const statusLabel = presence === 'playing'
                  ? 'Playing'
                  : presence === 'online'
                    ? 'Online'
                    : 'Offline';

                return (
                <div
                  key={friend.friendCode}
                  style={{
                    border: '1px solid var(--ui-line)',
                    padding: '8px 10px',
                    display: 'grid',
                    gridTemplateColumns: '1fr auto auto auto',
                    gap: 8,
                    alignItems: 'center',
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontFamily: "'Courier Prime', monospace", fontSize: 12, letterSpacing: '0.08em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {friend.name}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: 10, color: 'var(--ui-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                      {friend.friendCode} · seen {formatLastSeen(friend.lastSeenAt)}
                    </p>
                  </div>

                  <span style={{
                    fontFamily: "'Courier Prime', monospace",
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: statusColor,
                    whiteSpace: 'nowrap',
                  }}>{statusLabel}</span>

                  <button
                    type="button"
                    disabled={busy || !displayName || !isInviteAllowed}
                    onClick={() => wrap(() => sendInviteToFriend(friend.friendCode, friend.name))}
                    style={{
                      padding: '7px 9px',
                      border: '1px solid var(--ui-line)',
                      background: 'transparent',
                      color: isInviteAllowed ? 'var(--ui-text)' : 'var(--ui-muted)',
                      fontSize: 10,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      cursor: busy || !displayName || !isInviteAllowed ? 'default' : 'pointer',
                      opacity: busy || !displayName || !isInviteAllowed ? 0.5 : 1,
                    }}
                  >Invite</button>

                  <button
                    type="button"
                    onClick={() => removeFriend(friend.friendCode)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--ui-muted)',
                      fontSize: 16,
                      lineHeight: 1,
                      cursor: 'pointer',
                      padding: '2px 4px',
                    }}
                    title={`Remove ${friend.name}`}
                  >×</button>
                </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {room && !room.started && (
        <>
          {roomActions}

          <div style={{ display: 'grid', gap: 6, borderTop: '1px solid var(--ui-line)', paddingTop: 10 }}>
            {room.players.map((player, i) => (
              <div
                key={player.playerId}
                className="player-row"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr auto auto',
                  gap: 12,
                  alignItems: 'center',
                  borderBottom: '1px solid var(--ui-line)',
                  padding: '13px 0',
                }}
              >
                <span style={{
                  fontFamily: "'Courier Prime', monospace",
                  fontSize: 10,
                  color: 'var(--ui-muted)',
                  letterSpacing: '0.06em',
                  minWidth: 16,
                  textAlign: 'right',
                }}>{i + 1}</span>

                <span style={{
                  fontFamily: "'Courier Prime', monospace",
                  fontSize: 15,
                  fontWeight: 700,
                  color: 'var(--ui-text)',
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>{player.name}</span>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    fontFamily: "'Courier Prime', monospace",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    background: player.isBot ? 'var(--ui-text)' : 'transparent',
                    color: player.isBot ? 'var(--ui-bg)' : 'var(--ui-muted)',
                    border: `1px solid ${player.isBot ? 'var(--ui-text)' : 'var(--ui-line)'}`,
                    padding: '5px 10px',
                    whiteSpace: 'nowrap',
                  }}>
                    {player.isBot ? 'Bot' : player.connected ? 'Online' : 'Offline'}
                  </span>
                </div>

                {isHost && player.playerId !== playerId ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => requestKick(player.playerId, player.name)}
                    title={`Remove ${player.name}`}
                    className="remove-btn"
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--ui-muted)',
                      fontSize: 20,
                      lineHeight: 1,
                      cursor: busy ? 'default' : 'pointer',
                      padding: '4px',
                    }}
                  >×</button>
                ) : <div style={{ width: 24 }} />}
              </div>
            ))}

            {isHost && (
              <button
                type="button"
                className="add-btn"
                disabled={busy || room.players.length >= 4}
                onClick={() => wrap(onAddBotSeat)}
                style={{
                  marginTop: 8,
                  padding: '10px 12px',
                  border: '1px dashed var(--ui-line)',
                  background: 'transparent',
                  color: 'var(--ui-muted)',
                  fontFamily: "'Courier Prime', monospace",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  cursor: busy || room.players.length >= 4 ? 'default' : 'pointer',
                  opacity: busy || room.players.length >= 4 ? 0.5 : 1,
                  width: '100%',
                }}
              >+ Add Seat (Bot)</button>
            )}
          </div>

          {!isHost && (
            <p style={{ margin: 0, fontSize: 12, color: 'var(--ui-muted)' }}>
              Waiting for host to start the game...
            </p>
          )}
        </>
      )}

      <style>{`
        .lobby-friend-rail {
          position: fixed;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          width: 64px;
          border: 1px solid var(--ui-line);
          background: color-mix(in oklab, var(--ui-surface) 90%, transparent);
          backdrop-filter: blur(8px);
          padding: 10px 8px;
          display: grid;
          gap: 8px;
          z-index: 24;
          overflow: hidden;
          transition: width 0.28s cubic-bezier(0.2, 0.95, 0.2, 1);
          box-shadow: 0 10px 26px rgba(0, 0, 0, 0.14);
          transform-origin: right center;
        }

        .lobby-friend-rail:hover,
        .lobby-friend-rail:focus-within {
          width: min(320px, calc(100vw - 20px));
          animation: lobby-rail-pop 0.22s ease-out;
        }

        .lobby-friend-collapsed {
          display: grid;
          justify-items: center;
          gap: 7px;
          margin-top: 2px;
        }

        .lobby-friend-expand {
          display: none;
          gap: 8px;
          animation: lobby-fade-up 0.2s ease;
        }

        .lobby-friend-rail:hover .lobby-friend-expand,
        .lobby-friend-rail:focus-within .lobby-friend-expand {
          display: grid;
        }

        .lobby-friend-rail:hover .lobby-friend-collapsed,
        .lobby-friend-rail:focus-within .lobby-friend-collapsed {
          display: none;
        }

        .lobby-friend-row {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          align-items: center;
          gap: 10px;
          border: 1px solid var(--ui-line);
          padding: 8px;
          background: transparent;
          transition: transform 0.12s ease, border-color 0.12s ease, opacity 0.12s ease;
        }

        .lobby-friend-row:hover {
          transform: translateX(-2px);
          border-color: color-mix(in oklab, var(--ui-text) 46%, var(--ui-line));
        }

        .lobby-friend-row.offline {
          opacity: 0.52;
        }

        .lobby-friend-avatar {
          width: 34px;
          height: 34px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          font-family: 'Bebas Neue', cursive;
          font-size: 19px;
          letter-spacing: 0.03em;
          border: 1px solid rgba(0, 0, 0, 0.14);
          flex: 0 0 auto;
        }

        .lobby-friend-status {
          font-family: 'Courier Prime', monospace;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.09em;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .lobby-friend-status.playing {
          color: var(--ui-accent-blue);
        }

        .lobby-friend-status.online {
          color: var(--ui-accent-green);
        }

        .lobby-friend-status.offline {
          color: var(--ui-muted);
        }

        .lobby-friend-invite-btn {
          width: 28px;
          height: 28px;
          border: 1px solid var(--ui-line);
          background: transparent;
          color: var(--ui-text);
          font-size: 16px;
          line-height: 1;
          cursor: pointer;
          transition: transform 0.12s ease, opacity 0.12s ease;
        }

        .lobby-friend-invite-btn:hover {
          transform: scale(1.04);
        }

        .lobby-friend-invite-btn:disabled {
          cursor: default;
          opacity: 0.45;
        }

        @keyframes lobby-rail-pop {
          0% { transform: translateY(-50%) scale(0.97); }
          70% { transform: translateY(-50%) scale(1.01); }
          100% { transform: translateY(-50%) scale(1); }
        }

        @keyframes lobby-fade-up {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 900px) {
          .lobby-friend-rail {
            position: static;
            transform: none;
            width: 100%;
            animation: none;
            margin-top: 8px;
          }

          .lobby-friend-collapsed {
            display: none;
          }

          .lobby-friend-expand {
            display: grid;
          }
        }
      `}</style>

      <aside className="lobby-friend-rail" aria-label="Top friends">
        <div className="lobby-friend-collapsed" aria-hidden>
          <ChevronDown size={18} />
          {railFriendsWithAvatar.length === 0 && (
            <span
              style={{
                fontFamily: "'Courier Prime', monospace",
                fontSize: 9,
                letterSpacing: '0.08em',
                color: 'var(--ui-muted)',
                textTransform: 'uppercase',
              }}
            >
              None
            </span>
          )}
          {railFriendsWithAvatar.map(({ friend, letter, avatarColor, presence }) => (
            <span
              key={friend.friendCode}
              className="lobby-friend-avatar"
              style={{
                color: avatarColor.fg,
                background: avatarColor.bg,
                opacity: presence === 'offline' ? 0.48 : 1,
              }}
              title={friend.name}
            >
              {letter}
            </span>
          ))}
        </div>

        <div className="lobby-friend-expand">
          <div style={{ display: 'grid', gap: 2, padding: '2px 4px 4px' }}>
            <p
              style={{
                margin: 0,
                fontFamily: "'Courier Prime', monospace",
                fontSize: 9,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--ui-muted)',
                whiteSpace: 'nowrap',
              }}
            >
              {incomingInvites.length > 0
                ? `${incomingInvites.length} invite${incomingInvites.length > 1 ? 's' : ''} waiting`
                : 'No incoming invites'}
            </p>
            <h4
              style={{
                margin: 0,
                fontFamily: "'Bebas Neue', cursive",
                fontSize: 22,
                letterSpacing: '0.08em',
                color: 'var(--ui-text)',
                lineHeight: 1,
                whiteSpace: 'nowrap',
              }}
            >
              Friends
            </h4>
          </div>

          {railFriendsWithAvatar.length === 0 ? (
            <p
              style={{
                margin: 0,
                fontFamily: "'Courier Prime', monospace",
                fontSize: 11,
                color: 'var(--ui-muted)',
                lineHeight: 1.5,
              }}
            >
              No saved friends yet.
            </p>
          ) : (
            railFriendsWithAvatar.map(({ friend, letter, avatarColor, presence }) => {
              const canInvite = presence !== 'offline' && !busy && Boolean(displayName);
              return (
                <div
                  key={friend.friendCode}
                  className={`lobby-friend-row ${presence === 'offline' ? 'offline' : ''}`}
                >
                  <span
                    className="lobby-friend-avatar"
                    style={{
                      color: avatarColor.fg,
                      background: avatarColor.bg,
                    }}
                  >
                    {letter}
                  </span>

                  <div style={{ minWidth: 0, display: 'grid', gap: 2 }}>
                    <span
                      style={{
                        fontFamily: "'Courier Prime', monospace",
                        fontSize: 12,
                        fontWeight: 700,
                        color: 'var(--ui-text)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {friend.name}
                    </span>
                    <span className={`lobby-friend-status ${presence}`}>
                      {presence === 'playing' ? 'Playing' : presence === 'online' ? 'Online' : 'Offline'}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="lobby-friend-invite-btn"
                    disabled={!canInvite}
                    onClick={() => {
                      void wrap(() => sendInviteToFriend(friend.friendCode, friend.name));
                    }}
                    title={`Invite ${friend.name}`}
                    aria-label={`Invite ${friend.name}`}
                  >
                    +
                  </button>
                </div>
              );
            })
          )}
        </div>
      </aside>
    </SetupShell>
  );
}
