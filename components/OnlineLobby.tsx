'use client';

import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import type { FriendInvite, RoomSnapshot } from '../types/multiplayer';
import { toast } from 'sonner';
import SetupShell from './SetupShell';
import { CountBadge, PrimaryButton, SectionDivider, SegmentedToggle, SetupIntro, UtilityButton } from './ui/PageChrome';

const ONLINE_PLAYER_NAME_KEY = 'uno.online.playerName';
const ONLINE_ROOM_CODE_KEY = 'uno.online.roomCode';
const ONLINE_PANEL_KEY = 'uno.online.panel';
const ONLINE_FRIENDS_KEY = 'uno.online.friends';
const ONLINE_PREFILL_FRIEND_CODE_KEY = 'uno.online.prefill.friendCode';
const MAX_FRIENDS = 16;

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
  onCheckFriendOnline: (friendCodes: string[]) => Promise<Record<string, boolean>>;
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
  const [onlineMap, setOnlineMap] = useState<Record<string, boolean>>({});
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
      setOnlineMap({});
      return;
    }

    let disposed = false;
    const refreshStatuses = async () => {
      const statuses = await onCheckFriendOnline(friends.map((friend) => friend.friendCode));
      if (!disposed) {
        setOnlineMap(statuses);
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
      const aOnline = onlineMap[a.friendCode] ? 1 : 0;
      const bOnline = onlineMap[b.friendCode] ? 1 : 0;
      if (aOnline !== bOnline) return bOnline - aOnline;
      return b.lastSeenAt - a.lastSeenAt;
    }),
    [friends, onlineMap],
  );

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
        eyebrow="01 / Setup"
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
              {sortedFriends.map((friend) => (
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
                    color: onlineMap[friend.friendCode] ? 'var(--ui-accent-green)' : 'var(--ui-muted)',
                    whiteSpace: 'nowrap',
                  }}>{onlineMap[friend.friendCode] ? 'Online' : 'Offline'}</span>

                  <button
                    type="button"
                    disabled={busy || !displayName || !onlineMap[friend.friendCode]}
                    onClick={() => wrap(() => sendInviteToFriend(friend.friendCode, friend.name))}
                    style={{
                      padding: '7px 9px',
                      border: '1px solid var(--ui-line)',
                      background: 'transparent',
                      color: onlineMap[friend.friendCode] ? 'var(--ui-text)' : 'var(--ui-muted)',
                      fontSize: 10,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      cursor: busy || !displayName || !onlineMap[friend.friendCode] ? 'default' : 'pointer',
                      opacity: busy || !displayName || !onlineMap[friend.friendCode] ? 0.5 : 1,
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
              ))}
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
    </SetupShell>
  );
}
