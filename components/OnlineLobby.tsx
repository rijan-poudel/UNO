'use client';

import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import type { RoomSnapshot } from '../types/multiplayer';
import SetupShell from './SetupShell';

const ONLINE_PLAYER_NAME_KEY = 'uno.online.playerName';
const ONLINE_ROOM_CODE_KEY = 'uno.online.roomCode';
const ONLINE_PANEL_KEY = 'uno.online.panel';
const ONLINE_RECENT_ROOMS_KEY = 'uno.online.recentRooms';
const MAX_RECENT_ROOMS = 8;

interface RecentRoomEntry {
  roomId: string;
  label: string;
  lastVisitedAt: number;
  lastPlayerName: string;
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

function formatVisitedTime(ts: number): string {
  const date = new Date(ts);
  if (Number.isNaN(date.getTime())) return 'recently';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

interface OnlineLobbyProps {
  connected: boolean;
  room: RoomSnapshot | null;
  playerId: string | null;
  error: string | null;
  controls?: ReactNode;
  onCreateRoom: (playerName: string) => Promise<boolean>;
  onJoinRoom: (roomId: string, playerName: string) => Promise<boolean>;
  onStartGame: () => Promise<boolean>;
  onPlayWithComputer: (playerName: string) => void;
  onKickPlayer: (targetPlayerId: string) => Promise<boolean>;
}

export default function OnlineLobby({
  connected,
  room,
  playerId,
  error,
  controls,
  onCreateRoom,
  onJoinRoom,
  onStartGame,
  onPlayWithComputer,
  onKickPlayer,
}: OnlineLobbyProps) {
  const [playerName, setPlayerName] = useState('Player 1');
  const [roomCode, setRoomCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'code' | 'link' | null>(null);
  const [kickToast, setKickToast] = useState<string | null>(null);
  const [panel, setPanel] = useState<'create' | 'join'>('create');
  const [recentRooms, setRecentRooms] = useState<RecentRoomEntry[]>([]);
  const [roomLabel, setRoomLabel] = useState('');

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
      setRecentRooms(loadRecentRooms());
    } catch {
      // Ignore storage errors.
    }
  }, []);

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
    if (!kickToast) return;
    const timeout = window.setTimeout(() => setKickToast(null), 1800);
    return () => window.clearTimeout(timeout);
  }, [kickToast]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomFromUrl = params.get('room');
    if (roomFromUrl) {
      setRoomCode(roomFromUrl.toUpperCase().slice(0, 6));
      setPanel('join');
    }
  }, []);

  useEffect(() => {
    if (!room?.roomId) {
      setRoomLabel('');
      return;
    }

    const existing = recentRooms.find((entry) => entry.roomId === room.roomId);
    setRoomLabel(existing?.label ?? '');
  }, [room?.roomId, recentRooms]);

  const isHost = useMemo(() => room?.hostPlayerId === playerId, [room, playerId]);

  async function wrap(action: () => Promise<boolean>) {
    setBusy(true);
    try {
      await action();
    } finally {
      setBusy(false);
    }
  }

  const shareLink = room && typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?room=${room.roomId}`
    : '';

  async function copyText(value: string, type: 'code' | 'link') {
    try {
      await navigator.clipboard.writeText(value);
      setCopyStatus(type);
      window.setTimeout(() => setCopyStatus(null), 1500);
    } catch {
      setCopyStatus(null);
    }
  }

  const canSubmitRoomForm =
    !busy &&
    connected &&
    Boolean(playerName.trim()) &&
    (panel !== 'join' || Boolean(roomCode.trim()));

  const requestKick = (targetPlayerId: string, targetName: string) => {
    if (busy) return;
    const approved = window.confirm(`Remove ${targetName} from this room?`);
    if (!approved) return;

    void wrap(async () => {
      const removed = await onKickPlayer(targetPlayerId);
      if (removed) {
        setKickToast(`${targetName} removed from room.`);
      }
      return removed;
    });
  };

  const rememberRoomLabel = (nextLabelRaw: string) => {
    const nextLabel = nextLabelRaw.slice(0, 28);
    setRoomLabel(nextLabel);
    if (!room?.roomId) return;

    setRecentRooms((prev) => {
      const now = Date.now();
      const existing = prev.find((entry) => entry.roomId === room.roomId);
      const nextEntries = [
        {
          roomId: room.roomId,
          label: nextLabel.trim(),
          lastVisitedAt: now,
          lastPlayerName: playerName.trim() || existing?.lastPlayerName || 'Player',
        },
        ...prev.filter((entry) => entry.roomId !== room.roomId),
      ].slice(0, MAX_RECENT_ROOMS);

      saveRecentRooms(nextEntries);
      return nextEntries;
    });
  };

  return (
    <SetupShell
      subtitle="Multiplayer"
      footer={
        !room ? (
          <>
            <div style={{ height: 1, background: 'var(--ui-line)', marginBottom: 32 }} />
            <div style={{ display: 'grid', gap: 10 }}>
              <button
                type="button"
                disabled={!canSubmitRoomForm}
                onClick={() => wrap(() => panel === 'join'
                  ? onJoinRoom(roomCode.trim(), playerName.trim())
                  : onCreateRoom(playerName.trim()))}
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
              >{panel === 'join' ? 'JOIN ROOM' : 'CREATE ROOM'}</button>

              <button
                type="button"
                disabled={busy || !playerName.trim()}
                onClick={() => onPlayWithComputer(playerName.trim())}
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
                  cursor: busy || !playerName.trim() ? 'default' : 'pointer',
                  opacity: busy || !playerName.trim() ? 0.5 : 1,
                  width: '100%',
                }}
              >Play With Computer</button>
            </div>
          </>
        ) :
        room && !room.started && isHost ? (
          <>
            <div style={{ height: 1, background: 'var(--ui-line)', marginBottom: 32 }} />
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
            >START MATCH</button>
          </>
        ) : <div />
      }
    >
      {controls}

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
        Create or join a room to start
      </p>

      <p style={{ margin: 0, color: 'var(--ui-text)', fontSize: 13 }}>
        {connected ? 'Socket connected' : 'Connecting to multiplayer server...'}
      </p>

      {!room && (
        <>
          <div style={{ display: 'inline-flex', border: '1px solid var(--ui-line)', width: 'fit-content' }}>
            <button
              type="button"
              onClick={() => setPanel('create')}
              style={{
                border: 'none',
                padding: '8px 12px',
                cursor: 'pointer',
                background: panel === 'create' ? 'var(--ui-text)' : 'transparent',
                color: panel === 'create' ? 'var(--ui-surface)' : 'var(--ui-text)',
                fontSize: 11,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >Create</button>
            <button
              type="button"
              onClick={() => setPanel('join')}
              style={{
                border: 'none',
                padding: '8px 12px',
                cursor: 'pointer',
                background: panel === 'join' ? 'var(--ui-text)' : 'transparent',
                color: panel === 'join' ? 'var(--ui-surface)' : 'var(--ui-text)',
                fontSize: 11,
                letterSpacing: '0.08em',
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
          </div>

          {recentRooms.length > 0 && (
            <div style={{ display: 'grid', gap: 8, borderTop: '1px solid var(--ui-line)', paddingTop: 10 }}>
              <p style={{ margin: 0, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ui-muted)' }}>
                Recent Rooms
              </p>
              {recentRooms.slice(0, 5).map((entry) => (
                <button
                  key={entry.roomId}
                  type="button"
                  onClick={() => {
                    setRoomCode(entry.roomId);
                    setPanel('join');
                    if (!playerName.trim() && entry.lastPlayerName) {
                      setPlayerName(entry.lastPlayerName);
                    }
                  }}
                  style={{
                    border: '1px solid var(--ui-line)',
                    background: 'transparent',
                    color: 'var(--ui-text)',
                    padding: '8px 10px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'grid',
                    gap: 3,
                  }}
                >
                  <span style={{ fontFamily: "'Courier Prime', monospace", fontSize: 12, letterSpacing: '0.08em' }}>
                    {entry.roomId} {entry.label ? `· ${entry.label}` : ''}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--ui-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    {entry.lastPlayerName} · {formatVisitedTime(entry.lastVisitedAt)}
                  </span>
                </button>
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
                onClick={() => copyText(room.roomId, 'code')}
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
                onClick={() => copyText(shareLink, 'link')}
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

            {copyStatus && (
              <p style={{ margin: 0, fontSize: 11, color: '#1e6b3a', letterSpacing: '0.04em' }}>
                {copyStatus === 'code' ? 'Room code copied.' : 'Invite link copied.'}
              </p>
            )}

            <input
              value={roomLabel}
              onChange={(e) => rememberRoomLabel(e.target.value)}
              maxLength={28}
              placeholder="Give this room a nickname on this device"
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
              }}
            />
          </div>

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

          {kickToast && (
            <p style={{ margin: 0, fontSize: 11, color: '#1e6b3a', letterSpacing: '0.04em' }}>
              {kickToast}
            </p>
          )}
        </>
      )}

      {error && (
        <p style={{ margin: 0, color: '#c0392b', fontSize: 12 }}>{error}</p>
      )}
    </SetupShell>
  );
}
