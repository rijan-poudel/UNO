'use client';

import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import type { FriendInvite, RoomSnapshot } from '../types/multiplayer';
import { toast } from 'sonner';
import SetupShell from './SetupShell';

const ONLINE_PLAYER_NAME_KEY = 'uno.online.playerName';
const ONLINE_ROOM_CODE_KEY = 'uno.online.roomCode';
const ONLINE_PANEL_KEY = 'uno.online.panel';
const ONLINE_FRIENDS_KEY = 'uno.online.friends';
const MAX_FRIENDS = 16;

interface FriendEntry {
  friendCode: string;
  name: string;
  lastSeenAt: number;
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
        name: item.name.trim().slice(0, 20),
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
  error: string | null;
  controls?: ReactNode;
  onSyncPresence: (playerName: string) => Promise<boolean>;
  onCreateRoom: (playerName: string) => Promise<boolean>;
  onJoinRoom: (roomId: string, playerName: string) => Promise<boolean>;
  onSendFriendInvite: (targetFriendCode: string, playerName: string) => Promise<boolean>;
  onAcceptFriendInvite: (inviteId: string, playerName: string) => Promise<boolean>;
  onDeclineFriendInvite: (inviteId: string) => Promise<boolean>;
  onLeaveRoom: () => Promise<boolean>;
  onStartGame: () => Promise<boolean>;
  onPlayWithComputer: (playerName: string) => void;
  onKickPlayer: (targetPlayerId: string) => Promise<boolean>;
}

export default function OnlineLobby({
  connected,
  room,
  playerId,
  friendCode,
  incomingInvites,
  error,
  controls,
  onSyncPresence,
  onCreateRoom,
  onJoinRoom,
  onSendFriendInvite,
  onAcceptFriendInvite,
  onDeclineFriendInvite,
  onLeaveRoom,
  onStartGame,
  onPlayWithComputer,
  onKickPlayer,
}: OnlineLobbyProps) {
  const [playerName, setPlayerName] = useState('Player 1');
  const [roomCode, setRoomCode] = useState('');
  const [panel, setPanel] = useState<'create' | 'join'>('create');
  const [friendCodeInput, setFriendCodeInput] = useState('');
  const [friends, setFriends] = useState<FriendEntry[]>([]);
  const [busy, setBusy] = useState(false);

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

      setFriends(loadFriends());
    } catch {
      // Ignore storage errors.
    }
  }, []);

  useEffect(() => {
    if (!connected || !playerName.trim()) return;
    const timeout = window.setTimeout(() => {
      void onSyncPresence(playerName.trim());
    }, 180);
    return () => window.clearTimeout(timeout);
  }, [connected, playerName, onSyncPresence]);

  useEffect(() => {
    try {
      if (playerName.trim()) {
        window.localStorage.setItem(ONLINE_PLAYER_NAME_KEY, playerName.trim());
      }
    } catch {
      // Ignore storage errors.
    }
  }, [playerName]);

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
    const params = new URLSearchParams(window.location.search);
    const roomFromUrl = params.get('room');
    if (roomFromUrl) {
      setRoomCode(roomFromUrl.toUpperCase().slice(0, 6));
      setPanel('join');
    }
  }, []);

  const isHost = useMemo(() => room?.hostPlayerId === playerId, [room, playerId]);

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
    Boolean(playerName.trim()) &&
    (panel !== 'join' || Boolean(roomCode.trim()));

  const canSendInvite =
    !busy &&
    connected &&
    Boolean(playerName.trim()) &&
    normalizeCode(friendCodeInput).length >= 4;

  const rememberFriend = (rawCode: string, rawName?: string) => {
    const normalizedCode = normalizeCode(rawCode);
    if (!normalizedCode || normalizedCode === friendCode) return;

    setFriends((prev) => {
      const existing = prev.find((entry) => entry.friendCode === normalizedCode);
      const nextEntries = [
        {
          friendCode: normalizedCode,
          name: (rawName?.trim() || existing?.name || 'Friend').slice(0, 20),
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
    const invited = await onSendFriendInvite(normalizedCode, playerName.trim());
    if (invited) {
      rememberFriend(normalizedCode, targetName);
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
            border: '1px solid rgba(26,15,0,0.25)',
            background: '#fff8f0',
            fontFamily: "'Courier Prime', monospace",
            letterSpacing: '0.08em',
            color: 'rgba(26,15,0,0.7)'
          }}
        />
        <button
          onClick={() => copyText(room.roomId, 'Room code')}
          style={{
            padding: '10px 14px',
            border: '1px solid rgba(26,15,0,0.3)',
            background: '#fff8f0',
            cursor: 'pointer',
            fontSize: 11,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'rgba(26,15,0,0.7)'
          }}
        >Copy Code</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }}>
        <input
          value={shareLink}
          readOnly
          style={{
            padding: '10px 12px',
            border: '1px solid rgba(26,15,0,0.25)',
            background: '#fff8f0',
            fontSize: 12,
            color: 'rgba(26,15,0,0.7)',
          }}
        />
        <button
          onClick={() => copyText(shareLink, 'Invite link')}
          style={{
            padding: '10px 14px',
            border: '1px solid rgba(26,15,0,0.3)',
            background: '#fff8f0',
            cursor: 'pointer',
            fontSize: 11,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'rgba(26,15,0,0.7)'
          }}
        >Copy Link</button>
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
            borderBottom: '1px solid rgba(26,15,0,0.2)',
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
            border: '1px solid rgba(26,15,0,0.3)',
            background: '#fff8f0',
            cursor: canSendInvite ? 'pointer' : 'default',
            fontSize: 11,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'rgba(26,15,0,0.7)',
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
            <div style={{ height: 1, background: 'var(--ui-line)', marginBottom: 24 }} />
            <div style={{ display: 'grid', gap: 10 }}>
              <button
                type="button"
                disabled={!canSubmitRoomForm}
                onClick={() => wrap(async () => {
                  const ok = panel === 'join'
                    ? await onJoinRoom(roomCode.trim(), playerName.trim())
                    : await onCreateRoom(playerName.trim());

                  if (ok) {
                    toast.success(panel === 'join'
                      ? `Joined room ${roomCode.trim().toUpperCase()}`
                      : 'Room created.');
                  }
                  return ok;
                })}
                className="setup-primary-btn"
                style={{
                  padding: '18px 0',
                  border: 'none',
                  background: 'var(--ui-text)',
                  color: 'var(--ui-surface)',
                  fontFamily: "'Bebas Neue', cursive",
                  fontSize: 24,
                  letterSpacing: '0.2em',
                  cursor: 'pointer',
                  width: '100%',
                }}
              >{panel === 'join' ? 'JOIN ROOM' : 'CREATE ROOM'}</button>

              <button
                type="button"
                disabled={busy || !playerName.trim()}
                onClick={() => onPlayWithComputer(playerName.trim())}
                style={{
                  padding: '13px 0',
                  border: '2px solid color-mix(in srgb, var(--ui-accent-blue) 55%, var(--ui-line))',
                  background: 'color-mix(in srgb, var(--ui-accent-blue) 14%, var(--ui-surface))',
                  color: 'var(--ui-text)',
                  fontFamily: "'Courier Prime', monospace",
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.13em',
                  textTransform: 'uppercase',
                  cursor: busy || !playerName.trim() ? 'default' : 'pointer',
                  opacity: busy || !playerName.trim() ? 0.5 : 1,
                  boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--ui-accent-blue) 30%, transparent)',
                  width: '100%',
                }}
              >Quick Play vs Computer</button>
            </div>
          </>
        ) : room && !room.started ? (
          <>
            <div style={{ height: 1, background: 'var(--ui-line)', marginBottom: 24 }} />
            <div style={{ display: 'grid', gap: 10, gridTemplateColumns: isHost ? '1fr 1fr' : '1fr' }}>
              <button
                type="button"
                disabled={busy}
                onClick={() => wrap(async () => {
                  const left = await onLeaveRoom();
                  if (left) {
                    toast.success('Left room.');
                  }
                  return left;
                })}
                style={{
                  padding: '12px 0',
                  border: '1px solid var(--ui-line)',
                  background: 'transparent',
                  color: 'var(--ui-text)',
                  fontFamily: "'Courier Prime', monospace",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.11em',
                  textTransform: 'uppercase',
                  cursor: busy ? 'default' : 'pointer',
                  opacity: busy ? 0.5 : 1,
                  width: '100%',
                }}
              >Back</button>

              {isHost && (
                <button
                  type="button"
                  disabled={busy || room.players.length < 2}
                  onClick={() => wrap(onStartGame)}
                  className="setup-primary-btn"
                  style={{
                    padding: '18px 0',
                    border: 'none',
                    background: 'var(--ui-text)',
                    color: 'var(--ui-surface)',
                    fontFamily: "'Bebas Neue', cursive",
                    fontSize: 22,
                    letterSpacing: '0.18em',
                    cursor: 'pointer',
                    width: '100%',
                  }}
                >Start Match</button>
              )}
            </div>
          </>
        ) : <div />
      }
    >
      <div>
        <p style={{ margin: 0, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--ui-muted)' }}>
          01 / Players
        </p>
        <h2 style={{
          margin: '8px 0 0',
          fontFamily: "'Bebas Neue', cursive",
          fontSize: 34,
          letterSpacing: '0.04em',
          lineHeight: 1,
        }}>Join the Table</h2>
      </div>

      <p style={{ margin: 0, color: 'var(--ui-muted)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        Create a room, join by code, or invite directly from your friends list
      </p>

      <p style={{ margin: 0, color: 'var(--ui-text)', fontSize: 13 }}>
        {connected ? 'Socket connected' : 'Connecting to multiplayer server...'}
      </p>

      {!room && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', border: '2px solid var(--ui-line)', width: '100%' }}>
            <button
              type="button"
              onClick={() => setPanel('create')}
              style={{
                border: 'none',
                padding: '14px 12px',
                cursor: 'pointer',
                background: panel === 'create' ? 'var(--ui-text)' : 'transparent',
                color: panel === 'create' ? 'var(--ui-surface)' : 'var(--ui-text)',
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >Create</button>
            <button
              type="button"
              onClick={() => setPanel('join')}
              style={{
                border: 'none',
                padding: '14px 12px',
                cursor: 'pointer',
                background: panel === 'join' ? 'var(--ui-text)' : 'transparent',
                color: panel === 'join' ? 'var(--ui-surface)' : 'var(--ui-text)',
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >Join</button>
          </div>

          <div style={{ display: 'grid', gap: 12, borderTop: '1px solid var(--ui-line)', paddingTop: 12 }}>
            <input
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              maxLength={18}
              placeholder="Your name"
              className="setup-input"
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: '1px solid rgba(26,15,0,0.2)',
                fontFamily: "'Courier Prime', monospace",
                fontSize: 15,
                fontWeight: 700,
                color: 'var(--ui-text)',
                padding: '2px 0',
                width: '100%',
                transition: 'border-bottom-color 0.12s',
              }}
            />

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
                  borderBottom: '1px solid rgba(26,15,0,0.2)',
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }}>
              <input
                value={friendCodeInput}
                onChange={(e) => setFriendCodeInput(e.target.value.toUpperCase())}
                maxLength={8}
                placeholder="FRIEND CODE"
                className="setup-input"
                style={{
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid rgba(26,15,0,0.2)',
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
                  background: 'transparent',
                  color: 'var(--ui-text)',
                  fontSize: 11,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  cursor: canSendInvite ? 'pointer' : 'default',
                  opacity: canSendInvite ? 1 : 0.5,
                }}
              >Send Invite</button>
            </div>

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
                      disabled={busy || !playerName.trim()}
                      onClick={() => wrap(async () => {
                        rememberFriend(invite.fromFriendCode, invite.fromName);
                        const accepted = await onAcceptFriendInvite(invite.inviteId, playerName.trim());
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
                        cursor: busy || !playerName.trim() ? 'default' : 'pointer',
                        opacity: busy || !playerName.trim() ? 0.5 : 1,
                      }}
                    >Accept</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {friends.length > 0 && (
            <div style={{ display: 'grid', gap: 8, borderTop: '1px solid var(--ui-line)', paddingTop: 10 }}>
              <p style={{ margin: 0, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ui-muted)' }}>
                Friends
              </p>
              {friends.slice(0, 8).map((friend) => (
                <div
                  key={friend.friendCode}
                  style={{
                    border: '1px solid var(--ui-line)',
                    padding: '8px 10px',
                    display: 'grid',
                    gridTemplateColumns: '1fr auto auto',
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

                  <button
                    type="button"
                    disabled={busy || !playerName.trim()}
                    onClick={() => wrap(() => sendInviteToFriend(friend.friendCode, friend.name))}
                    style={{
                      padding: '7px 9px',
                      border: '1px solid var(--ui-line)',
                      background: 'transparent',
                      color: 'var(--ui-text)',
                      fontSize: 10,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      cursor: busy || !playerName.trim() ? 'default' : 'pointer',
                      opacity: busy || !playerName.trim() ? 0.5 : 1,
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
          <p style={{ margin: 0, fontSize: 14 }}>
            Room code: <strong>{room.roomId}</strong>
          </p>

          {roomActions}

          <div style={{ display: 'grid', gap: 6, borderTop: '1px solid var(--ui-line)', paddingTop: 10 }}>
            {room.players.map((player, i) => (
              <div key={player.playerId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span>{i + 1}. {player.name}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: player.connected ? '#1e6b3a' : '#c0392b' }}>
                    {player.connected ? 'online' : 'offline'}
                  </span>
                  {isHost && player.playerId !== playerId && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => requestKick(player.playerId, player.name)}
                      title={`Remove ${player.name}`}
                      style={{
                        border: '1px solid rgba(192,57,43,0.45)',
                        background: '#fff8f0',
                        color: '#c0392b',
                        width: 22,
                        height: 22,
                        padding: 0,
                        lineHeight: 1,
                        fontSize: 14,
                        cursor: busy ? 'default' : 'pointer',
                      }}
                    >x</button>
                  )}
                </div>
              </div>
            ))}
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
