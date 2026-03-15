'use client';

import { useEffect, useState, useMemo } from 'react';
import { toast } from 'sonner';
import type { FriendInvite } from '../../types/multiplayer';

const ONLINE_PLAYER_NAME_KEY = 'uno.online.playerName';
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
    return (parsed as Partial<FriendEntry>[])
      .filter(item => typeof item?.friendCode === 'string' && typeof item?.name === 'string' && typeof item?.lastSeenAt === 'number')
      .map(item => ({
        friendCode: normalizeCode(item.friendCode!),
        name: item.name!.trim().slice(0, 20),
        lastSeenAt: item.lastSeenAt!,
      }))
      .filter(item => Boolean(item.friendCode))
      .sort((a, b) => b.lastSeenAt - a.lastSeenAt)
      .slice(0, MAX_FRIENDS);
  } catch { return []; }
}

function saveFriends(entries: FriendEntry[]) {
  if (typeof window === 'undefined') return;
  try { window.localStorage.setItem(ONLINE_FRIENDS_KEY, JSON.stringify(entries.slice(0, MAX_FRIENDS))); }
  catch { /* ignore */ }
}

interface HomeHubProps {
  themeLabel: string;
  incomingInvites: FriendInvite[];
  onCycleTheme: () => void;
  onOpenSettings: () => void;
  onPlayWithComputer: () => void;
  onPlayWithFriendsCreate: () => void;
  onPlayWithFriendsJoin: () => void;
  onSyncPresence: (playerName: string) => Promise<boolean>;
  onSendFriendInvite: (targetFriendCode: string, playerName: string) => Promise<boolean>;
}

export default function HomeHub({
  themeLabel,
  incomingInvites,
  onCycleTheme,
  onOpenSettings,
  onPlayWithComputer,
  onPlayWithFriendsCreate,
  onPlayWithFriendsJoin,
  onSyncPresence,
  onSendFriendInvite,
}: HomeHubProps) {
  const [playerName, setPlayerName] = useState('Player 1');
  const [friendCodeInput, setFriendCodeInput] = useState('');
  const [friends, setFriends] = useState<FriendEntry[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(ONLINE_PLAYER_NAME_KEY);
      if (saved?.trim()) setPlayerName(saved.trim());
      setFriends(loadFriends());
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    try {
      if (playerName.trim()) window.localStorage.setItem(ONLINE_PLAYER_NAME_KEY, playerName.trim());
    } catch { /* ignore */ }
  }, [playerName]);

  useEffect(() => {
    if (!playerName.trim()) return;
    const t = window.setTimeout(() => { void onSyncPresence(playerName.trim()); }, 160);
    return () => window.clearTimeout(t);
  }, [playerName, onSyncPresence]);

  const canInvite = useMemo(
    () => !busy && Boolean(playerName.trim()) && normalizeCode(friendCodeInput).length >= 4,
    [busy, playerName, friendCodeInput],
  );

  const rememberFriend = (rawCode: string) => {
    const code = normalizeCode(rawCode);
    if (!code) return;
    setFriends(prev => {
      const existing = prev.find(e => e.friendCode === code);
      const next = [
        { friendCode: code, name: existing?.name || 'Friend', lastSeenAt: Date.now() },
        ...prev.filter(e => e.friendCode !== code),
      ].slice(0, MAX_FRIENDS);
      saveFriends(next);
      return next;
    });
  };

  const removeFriend = (rawCode: string) => {
    const code = normalizeCode(rawCode);
    setFriends(prev => {
      const next = prev.filter(e => e.friendCode !== code);
      saveFriends(next);
      return next;
    });
  };

  const sendInvite = async (rawCode: string) => {
    const code = normalizeCode(rawCode);
    if (!code || !playerName.trim()) return;
    setBusy(true);
    try {
      const ok = await onSendFriendInvite(code, playerName.trim());
      if (ok) {
        rememberFriend(code);
        setFriendCodeInput('');
        toast.success(`Invite sent to ${code}.`);
      }
    } finally { setBusy(false); }
  };

  const incomingCount = incomingInvites.length;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Courier+Prime:wght@400;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; }

        /* input resets */
        .hub-input { outline: none !important; }
        .hub-input::placeholder { color: var(--ui-muted); opacity: 0.55; }
        .hub-input:focus { border-bottom-color: var(--ui-text) !important; }

        /* play buttons */
        .hub-play-btn {
          display: flex; flex-direction: column;
          align-items: flex-start; justify-content: flex-end;
          gap: 6px;
          padding: 18px 20px;
          border: 1px solid var(--ui-line);
          background: transparent;
          color: var(--ui-text);
          cursor: pointer;
          text-align: left;
          width: 100%;
          transition: border-color 0.15s, background 0.15s;
          min-height: 130px;
        }
        .hub-play-btn:hover {
          border-color: var(--ui-text);
        }

        /* small action buttons */
        .hub-btn {
          border: 1px solid var(--ui-line);
          background: transparent;
          color: var(--ui-muted);
          padding: 6px 11px;
          cursor: pointer;
          font-family: 'Courier Prime', monospace;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          white-space: nowrap;
          transition: color 0.12s, border-color 0.12s;
        }
        .hub-btn:hover { color: var(--ui-text); border-color: var(--ui-text); }
        .hub-btn:disabled { opacity: 0.38; cursor: default; }

        .hub-section-label {
          font-family: 'Courier Prime', monospace;
          font-size: 10px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--ui-muted);
          margin: 0 0 8px;
        }

        .hub-friend-row {
          display: grid;
          grid-template-columns: 1fr auto auto;
          gap: 8px;
          align-items: center;
          padding: 10px 0;
          border-bottom: 1px solid var(--ui-line);
        }
        .hub-friend-row:last-child { border-bottom: none; }

        .hub-remove-btn {
          background: transparent; border: none;
          color: var(--ui-muted); cursor: pointer;
          font-size: 16px; line-height: 1; padding: 2px 4px;
          transition: color 0.12s;
        }
        .hub-remove-btn:hover { color: var(--ui-accent-red); }
      `}</style>

      <div style={{
        minHeight: '100dvh',
        color: 'var(--ui-text)',
        fontFamily: "'Courier Prime', monospace",
        padding: 'clamp(24px,4vh,48px) clamp(20px,4vw,48px)',
        display: 'grid',
        gridTemplateRows: 'auto auto 1fr',
        gap: 'clamp(24px,4vh,40px)',
        maxWidth: 900,
        margin: '0 auto',
      }}>

        {/* ── Header row ── */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
          <h1 style={{
            margin: 0,
            fontFamily: "'Bebas Neue', cursive",
            fontSize: 'clamp(64px, 12vw, 108px)',
            letterSpacing: '0.02em',
            lineHeight: 1,
          }}>
            <span style={{ color: 'var(--ui-accent-red)' }}>U</span>
            <span style={{ color: 'var(--ui-accent-yellow)' }}>N</span>
            <span style={{ color: 'var(--ui-accent-green)' }}>O</span>
          </h1>

          {/* top-right controls */}
          <div style={{ display: 'flex', gap: 6, paddingBottom: 4 }}>
            <button type="button" className="hub-btn" onClick={onCycleTheme}>
              {themeLabel}
            </button>
            <button type="button" className="hub-btn" onClick={onOpenSettings}>
              Settings
            </button>
          </div>
        </div>

        {/* ── Thin rule ── */}
        <div style={{ height: 1, background: 'var(--ui-line)', marginTop: -8 }} />

        {/* ── Body: two columns on wide, stack on narrow ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)',
          gap: 'clamp(24px,4vw,56px)',
          alignItems: 'start',
        }}>

          {/* ── Left column ── */}
          <div style={{ display: 'grid', gap: 40 }}>

            {/* Player name */}
            <div>
              <p className="hub-section-label">Your name</p>
              <input
                value={playerName}
                onChange={e => setPlayerName(e.target.value)}
                maxLength={18}
                placeholder="Player 1"
                className="hub-input"
                style={{
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid var(--ui-line)',
                  fontFamily: "'Courier Prime', monospace",
                  fontSize: 18,
                  fontWeight: 700,
                  color: 'var(--ui-text)',
                  padding: '4px 0',
                  width: '100%',
                  transition: 'border-bottom-color 0.12s',
                }}
              />
              {incomingCount > 0 && (
                <p style={{
                  margin: '8px 0 0',
                  fontFamily: "'Courier Prime', monospace",
                  fontSize: 11,
                  color: 'var(--ui-accent-red)',
                  letterSpacing: '0.06em',
                  animation: 'none',
                }}>
                  {incomingCount} incoming invite{incomingCount > 1 ? 's' : ''}
                </p>
              )}
            </div>

            {/* Play modes */}
            <div>
              <p className="hub-section-label">Play</p>
              <div style={{ display: 'grid', gap: 10 }}>

                <button type="button" className="hub-play-btn" onClick={onPlayWithComputer}>
                  <span style={{
                    fontFamily: "'Courier Prime', monospace",
                    fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase',
                    color: 'var(--ui-muted)',
                  }}>Local · Solo</span>
                  <span style={{
                    fontFamily: "'Bebas Neue', cursive",
                    fontSize: 32, letterSpacing: '0.04em', lineHeight: 1,
                  }}>Play with computer</span>
                  <span style={{
                    fontFamily: "'Courier Prime', monospace",
                    fontSize: 11, color: 'var(--ui-muted)', lineHeight: 1.5,
                  }}>Set up players and bots, deal cards locally.</span>
                </button>

                <button type="button" className="hub-play-btn" onClick={onPlayWithFriendsCreate}>
                  <span style={{
                    fontFamily: "'Courier Prime', monospace",
                    fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase',
                    color: 'var(--ui-muted)',
                  }}>Online · Multiplayer</span>
                  <span style={{
                    fontFamily: "'Bebas Neue', cursive",
                    fontSize: 32, letterSpacing: '0.04em', lineHeight: 1,
                  }}>Play with friends</span>
                  <span style={{
                    fontFamily: "'Courier Prime', monospace",
                    fontSize: 11, color: 'var(--ui-muted)', lineHeight: 1.5,
                  }}>Create a room or join one with a code.</span>
                </button>

              </div>
            </div>
          </div>

          {/* ── Right column: friends ── */}
          <div style={{ display: 'grid', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p className="hub-section-label" style={{ margin: 0 }}>Friends</p>
              <button type="button" className="hub-btn" onClick={onPlayWithFriendsJoin}>
                Join with code
              </button>
            </div>

            {/* Send invite input */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, alignItems: 'flex-end' }}>
              <div>
                <p style={{
                  margin: '0 0 4px',
                  fontFamily: "'Courier Prime', monospace",
                  fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase',
                  color: 'var(--ui-muted)',
                }}>Friend code</p>
                <input
                  value={friendCodeInput}
                  onChange={e => setFriendCodeInput(e.target.value.toUpperCase())}
                  maxLength={8}
                  placeholder="XXXXXXXX"
                  className="hub-input"
                  style={{
                    background: 'transparent', border: 'none',
                    borderBottom: '1px solid var(--ui-line)',
                    fontFamily: "'Courier Prime', monospace",
                    fontSize: 14, fontWeight: 700,
                    color: 'var(--ui-text)', padding: '4px 0', width: '100%',
                    textTransform: 'uppercase',
                    transition: 'border-bottom-color 0.12s',
                  }}
                />
              </div>
              <button
                type="button"
                className="hub-btn"
                disabled={!canInvite}
                onClick={() => { void sendInvite(friendCodeInput); }}
              >Send</button>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: 'var(--ui-line)' }} />

            {/* Friend list */}
            {friends.length === 0 ? (
              <p style={{
                margin: 0,
                fontFamily: "'Courier Prime', monospace",
                fontSize: 12, color: 'var(--ui-muted)', letterSpacing: '0.04em',
              }}>No saved friends yet.</p>
            ) : (
              <div>
                {friends.slice(0, 8).map(friend => (
                  <div key={friend.friendCode} className="hub-friend-row">
                    <div style={{ minWidth: 0 }}>
                      <p style={{
                        margin: 0,
                        fontFamily: "'Courier Prime', monospace",
                        fontSize: 13, fontWeight: 700,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        color: 'var(--ui-text)',
                      }}>{friend.name}</p>
                      <p style={{
                        margin: '2px 0 0',
                        fontFamily: "'Courier Prime', monospace",
                        fontSize: 10, color: 'var(--ui-muted)',
                        letterSpacing: '0.1em', textTransform: 'uppercase',
                      }}>{friend.friendCode}</p>
                    </div>
                    <button
                      type="button"
                      className="hub-btn"
                      disabled={busy || !playerName.trim()}
                      onClick={() => { void sendInvite(friend.friendCode); }}
                    >Invite</button>
                    <button
                      type="button"
                      className="hub-remove-btn"
                      onClick={() => removeFriend(friend.friendCode)}
                      title={`Remove ${friend.name}`}
                    >×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
