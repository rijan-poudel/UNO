'use client';

import { useEffect, useMemo, useState } from 'react';
import FriendInviteInput from '../FriendInviteInput';
import { HomeUtilityBar, ModeRow, PageShell, SectionDivider, UnoWordmark } from '../ui/PageChrome';

const ONLINE_FRIENDS_KEY = 'uno.online.friends';
const MAX_FRIENDS = 3;

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

interface HomeScreenProps {
  themeLabel: string;
  onTheme: () => void;
  onSettings: () => void;
  onComputer: () => void;
  onFriends: () => void;
  onFriendQuickInvite: (friendCode: string) => Promise<boolean>;
  onCheckFriendOnline: (friendCodes: string[]) => Promise<Record<string, boolean>>;
}

export default function HomeScreen({
  themeLabel,
  onTheme,
  onSettings,
  onComputer,
  onFriends,
  onFriendQuickInvite,
  onCheckFriendOnline,
}: HomeScreenProps) {
  const [friends] = useState<FriendEntry[]>(() => loadFriends());
  const [friendCodeInput, setFriendCodeInput] = useState('');
  const [onlineMap, setOnlineMap] = useState<Record<string, boolean>>({});
  const [invitingCode, setInvitingCode] = useState<string | null>(null);

  const inviteFromInput = async () => {
    const code = normalizeCode(friendCodeInput);
    if (code.length < 4) return;
    setInvitingCode(code);
    try {
      const invited = await onFriendQuickInvite(code);
      if (invited) {
        setFriendCodeInput('');
      }
    } finally {
      setInvitingCode(null);
    }
  };

  const shownFriends = useMemo(
    () => [...friends]
      .sort((a, b) => {
        const aOnline = onlineMap[a.friendCode] ? 1 : 0;
        const bOnline = onlineMap[b.friendCode] ? 1 : 0;
        if (aOnline !== bOnline) return bOnline - aOnline;
        return b.lastSeenAt - a.lastSeenAt;
      })
      .slice(0, MAX_FRIENDS),
    [friends, onlineMap],
  );

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

  const inviteFriend = async (friendCode: string) => {
    const normalized = normalizeCode(friendCode);
    if (!normalized || !onlineMap[normalized]) return;
    setInvitingCode(normalized);
    try {
      await onFriendQuickInvite(normalized);
    } finally {
      setInvitingCode(null);
    }
  };

  return (
    <PageShell>
      <style>{`
        .home-main-grid {
          display: grid;
          grid-template-columns: minmax(0, 3fr) 1px minmax(220px, 1fr);
          gap: 20px;
          align-items: start;
        }

        .home-main-divider {
          width: 1px;
          min-height: 100%;
          background: var(--ui-line);
        }

        @media (max-width: 900px) {
          .home-main-grid {
            grid-template-columns: 1fr;
            gap: 14px;
          }

          .home-main-divider {
            width: 100%;
            height: 1px;
            min-height: 1px;
          }
        }
      `}</style>

      <HomeUtilityBar themeLabel={themeLabel} onTheme={onTheme} onSettings={onSettings} />

      <section style={{ width: 'min(980px, 100%)', margin: '0 auto', display: 'grid', gap: 32 }}>
        <div>
          <UnoWordmark />
          <p
            style={{
              margin: '12px 0 0',
              fontFamily: "'Courier Prime', monospace",
              fontSize: 11,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--ui-muted)',
            }}
          >
            Online Play · House rules
          </p>
        </div>

        <SectionDivider />

        <div>
          <p
            style={{
              margin: 0,
              fontFamily: "'Courier Prime', monospace",
              fontSize: 10,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--ui-muted)',
            }}
          >
            01 / Start
          </p>
          <h2
            style={{
              margin: '8px 0 0',
              fontFamily: "'Bebas Neue', cursive",
              fontSize: 34,
              letterSpacing: '0.04em',
              lineHeight: 1,
            }}
          >
            Choose Your Table
          </h2>
        </div>

        <div className="home-main-grid">
          <div>
            <ModeRow label="With Computer" desc="Play against bots on this device" onClick={onComputer} />
            <ModeRow label="With Friends" desc="Create or join a room with friends" onClick={onFriends} last />
          </div>

          <div className="home-main-divider" />

          <aside style={{ display: 'grid', gap: 10, alignContent: 'start' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <p
                style={{
                  margin: 0,
                  fontFamily: "'Bebas Neue', cursive",
                  fontSize: 20,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--ui-text)',
                  lineHeight: 1,
                }}
              >
                Friends
              </p>

              {friends.length > MAX_FRIENDS && (
                <button
                  type="button"
                  onClick={onFriends}
                  style={{
                    border: '1px solid var(--ui-line)',
                    background: 'transparent',
                    color: 'var(--ui-muted)',
                    padding: '5px 8px',
                    fontFamily: "'Courier Prime', monospace",
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                  }}
                >See more</button>
              )}
            </div>

            <FriendInviteInput
              value={friendCodeInput}
              onChange={setFriendCodeInput}
              onSend={() => { void inviteFromInput(); }}
              disabled={normalizeCode(friendCodeInput).length < 4 || invitingCode === normalizeCode(friendCodeInput)}
              buttonLabel="Invite"
              autoFocus
            />

            {shownFriends.length === 0 ? (
              <p
                style={{
                  margin: 0,
                  fontFamily: "'Courier Prime', monospace",
                  fontSize: 11,
                  letterSpacing: '0.06em',
                  color: 'var(--ui-muted)',
                  lineHeight: 1.5,
                }}
              >
                No saved friends yet.
              </p>
            ) : (
              <div style={{ display: 'grid' }}>
                {shownFriends.map((friend, index) => (
                  <button
                    key={friend.friendCode}
                    type="button"
                    onClick={() => { void inviteFriend(friend.friendCode); }}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr auto',
                      gap: 2,
                      padding: '8px 0',
                      borderBottom: index < shownFriends.length - 1 ? '1px solid var(--ui-line)' : 'none',
                      background: 'transparent',
                      borderTop: 'none',
                      borderLeft: 'none',
                      borderRight: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
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
                      <span
                        style={{
                          fontFamily: "'Courier Prime', monospace",
                          fontSize: 9,
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          color: 'var(--ui-muted)',
                        }}
                      >
                        {friend.friendCode}
                      </span>
                    </div>

                    <div style={{ display: 'grid', justifyItems: 'end', alignContent: 'center', gap: 6 }}>
                      <span style={{
                        fontFamily: "'Courier Prime', monospace",
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: onlineMap[friend.friendCode] ? 'var(--ui-accent-green)' : 'var(--ui-muted)',
                      }}>{onlineMap[friend.friendCode] ? 'Online' : 'Offline'}</span>
                      <span style={{
                        border: '1px solid var(--ui-line)',
                        padding: '4px 8px',
                        fontFamily: "'Courier Prime', monospace",
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: onlineMap[friend.friendCode] ? 'var(--ui-text)' : 'var(--ui-muted)',
                        opacity: onlineMap[friend.friendCode] && invitingCode !== friend.friendCode ? 1 : 0.5,
                      }}>Invite</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </aside>
        </div>

        <SectionDivider />

        <p
          style={{
            margin: 0,
            fontFamily: "'Courier Prime', monospace",
            fontSize: 10,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--ui-muted)',
          }}
        >
          Ad-free · No account required · Press settings for rules
        </p>
      </section>
    </PageShell>
  );
}