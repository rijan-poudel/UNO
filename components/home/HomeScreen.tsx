"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  FriendInvite,
  FriendPresenceState,
} from "../../types/multiplayer";
import NotificationPanel from "../NotificationPanel";
import FriendInviteInput from "../FriendInviteInput";
import {
  ModeRow,
  PageShell,
  SectionDivider,
  UnoWordmark,
} from "../ui/PageChrome";

const ONLINE_FRIENDS_KEY = "uno.online.friends";
const MAX_FRIENDS = 4;

const AVATAR_PALETTE = [
  { fg: "#102A43", bg: "#F0B429" },
  { fg: "#2D132C", bg: "#F49D6E" },
  { fg: "#12355B", bg: "#66C7F4" },
  { fg: "#1B4332", bg: "#95D5B2" },
  { fg: "#3D0C02", bg: "#FF9F1C" },
  { fg: "#2B2D42", bg: "#CDB4DB" },
  { fg: "#0B3954", bg: "#BFD7EA" },
  { fg: "#3A0CA3", bg: "#FEC5BB" },
];

interface FriendEntry {
  friendCode: string;
  name: string;
  lastSeenAt: number;
}

interface HomeScreenProps {
  themeLabel: string;
  onSelectTheme?: (themeName: string) => void;
  onSettings: () => void;
  onOpenProfileSettings?: () => void;
  onComputer: () => void;
  onFriends: () => void;
  onFriendQuickInvite: (friendCode: string) => Promise<boolean>;
  onCheckFriendOnline: (
    friendCodes: string[],
  ) => Promise<Record<string, FriendPresenceState>>;
  incomingInvites: FriendInvite[];
}

function cleanFriendName(
  rawName: string | undefined,
  fallbackCode: string,
): string {
  const trimmed = (rawName ?? "").trim().slice(0, 20);
  const normalized = trimmed.toLowerCase();
  const blocked = new Set(["friend", "friends", "player", "unknown", "guest"]);
  if (!trimmed || blocked.has(normalized)) return fallbackCode;
  return trimmed;
}

function normalizeCode(value: string): string {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8);
}

function firstAvatarLetter(friend: FriendEntry): string {
  const source = friend.name.trim() || friend.friendCode;
  const first = source.charAt(0).toUpperCase();
  return /[A-Z0-9]/.test(first) ? first : "#";
}

function presenceRank(state: FriendPresenceState | undefined): number {
  if (state === "playing") return 2;
  if (state === "online") return 1;
  return 0;
}

function loadFriends(): FriendEntry[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(ONLINE_FRIENDS_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item): item is FriendEntry => {
        if (typeof item !== "object" || item === null) return false;
        const candidate = item as Partial<FriendEntry>;
        return (
          typeof candidate.friendCode === "string" &&
          typeof candidate.name === "string" &&
          typeof candidate.lastSeenAt === "number"
        );
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

export default function HomeScreen({
  themeLabel,
  onSelectTheme,
  onSettings,
  onOpenProfileSettings,
  onComputer,
  onFriends,
  onFriendQuickInvite,
  onCheckFriendOnline,
  incomingInvites,
}: HomeScreenProps) {
  const [friends] = useState<FriendEntry[]>(() => loadFriends());
  const [friendCodeInput, setFriendCodeInput] = useState("");
  const [presenceMap, setPresenceMap] = useState<
    Record<string, FriendPresenceState>
  >({});
  const [invitingCode, setInvitingCode] = useState<string | null>(null);

  const inviteFromInput = async () => {
    const code = normalizeCode(friendCodeInput);
    if (code.length < 4) return;
    setInvitingCode(code);
    try {
      const invited = await onFriendQuickInvite(code);
      if (invited) setFriendCodeInput("");
    } finally {
      setInvitingCode(null);
    }
  };

  const shownFriends = useMemo(
    () =>
      [...friends]
        .sort((a, b) => {
          const aPresence = presenceRank(presenceMap[a.friendCode]);
          const bPresence = presenceRank(presenceMap[b.friendCode]);
          if (aPresence !== bPresence) return bPresence - aPresence;
          return b.lastSeenAt - a.lastSeenAt;
        })
        .slice(0, MAX_FRIENDS),
    [friends, presenceMap],
  );

  const friendsWithAvatar = useMemo(() => {
    const usageByLetter: Record<string, number> = {};
    return shownFriends.map((friend) => {
      const letter = firstAvatarLetter(friend);
      const usage = usageByLetter[letter] ?? 0;
      usageByLetter[letter] = usage + 1;
      const avatarColor = AVATAR_PALETTE[usage % AVATAR_PALETTE.length];
      return {
        friend,
        letter,
        avatarColor,
        presence: presenceMap[friend.friendCode] ?? "offline",
      };
    });
  }, [shownFriends, presenceMap]);

  useEffect(() => {
    if (!friends.length) {
      setPresenceMap({});
      return;
    }

    let disposed = false;
    const refreshStatuses = async () => {
      const statuses = await onCheckFriendOnline(
        friends.map((friend) => friend.friendCode),
      );
      if (!disposed) setPresenceMap(statuses);
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
    if (!normalized || (presenceMap[normalized] ?? "offline") === "offline") {
      return;
    }

    setInvitingCode(normalized);
    try {
      await onFriendQuickInvite(normalized);
    } finally {
      setInvitingCode(null);
    }
  };

  const incomingCount = incomingInvites.length;

  return (
    <>
      <NotificationPanel
        themeLabel={themeLabel}
        onSelectTheme={onSelectTheme}
        onSettings={onSettings}
        onOpenProfileSettings={onOpenProfileSettings}
        incomingInviteCount={incomingCount}
      />
      <PageShell>
        <style>{`
        .home-main-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(260px, 340px);
          gap: 24px;
          align-items: start;
        }

        .play-focus-card {
          border: 1px solid var(--ui-line);
          background:
            radial-gradient(circle at 16% 18%, rgba(255,255,255,0.04), transparent 42%),
            linear-gradient(140deg, rgba(255,255,255,0.02), transparent 54%);
          padding: 18px 20px;
          display: grid;
          gap: 12px;
        }

        .friend-rail {
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

        .friend-rail:hover,
        .friend-rail:focus-within {
          width: min(320px, calc(100vw - 20px));
          animation: rail-pop 0.22s ease-out;
        }

        .friend-rail-head {
          display: grid;
          gap: 2px;
          padding: 2px 4px 4px;
        }

        .friend-rail-title {
          margin: 0;
          font-family: 'Bebas Neue', cursive;
          font-size: 22px;
          letter-spacing: 0.08em;
          color: var(--ui-text);
          line-height: 1;
          white-space: nowrap;
        }

        .friend-rail-sub {
          margin: 0;
          font-family: 'Courier Prime', monospace;
          font-size: 9px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--ui-muted);
          white-space: nowrap;
        }

        .friend-collapsed-icons {
          display: grid;
          justify-items: center;
          gap: 7px;
          margin-top: 2px;
        }

        .friend-row {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          align-items: center;
          gap: 10px;
          border: 1px solid var(--ui-line);
          padding: 8px;
          background: transparent;
          transition: transform 0.12s ease, border-color 0.12s ease, opacity 0.12s ease;
        }

        .friend-row:hover {
          transform: translateX(-2px);
          border-color: color-mix(in oklab, var(--ui-text) 46%, var(--ui-line));
        }

        .friend-row.offline {
          opacity: 0.52;
        }

        .friend-status {
          font-family: 'Courier Prime', monospace;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.09em;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .friend-status.playing {
          color: var(--ui-accent-blue);
        }

        .friend-status.online {
          color: var(--ui-accent-green);
        }

        .friend-status.offline {
          color: var(--ui-muted);
        }

        .friend-avatar {
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

        .friend-invite-btn {
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

        .friend-invite-btn:hover {
          transform: scale(1.04);
        }

        .friend-invite-btn:disabled {
          cursor: default;
          opacity: 0.45;
        }

        .friend-expand-content {
          display: none;
          gap: 8px;
          animation: fade-up 0.2s ease;
        }

        .friend-rail:hover .friend-expand-content,
        .friend-rail:focus-within .friend-expand-content {
          display: grid;
        }

        .friend-rail:hover .friend-collapsed-icons,
        .friend-rail:focus-within .friend-collapsed-icons {
          display: none;
        }

        @keyframes rail-pop {
          0% { transform: translateY(-50%) scale(0.97); }
          70% { transform: translateY(-50%) scale(1.01); }
          100% { transform: translateY(-50%) scale(1); }
        }

        @keyframes fade-up {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 900px) {
          .home-main-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .friend-rail {
            position: static;
            transform: none;
            width: 100%;
            animation: none;
            margin-top: 8px;
          }

          .friend-collapsed-icons {
            display: none;
          }

          .friend-expand-content {
            display: grid;
          }
        }
      `}</style>

      <section
        style={{
          width: "min(980px, 100%)",
          margin: "0 auto",
          display: "grid",
          gap: 32,
        }}
      >
        <div>
          <UnoWordmark />
          <p
            style={{
              margin: "12px 0 0",
              fontFamily: "'Courier Prime', monospace",
              fontSize: 11,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "var(--ui-muted)",
            }}
          >
            Play Fast · Invite Faster
          </p>
        </div>

        <SectionDivider />

        <div>
          <p
            style={{
              margin: 0,
              fontFamily: "'Courier Prime', monospace",
              fontSize: 10,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "var(--ui-muted)",
            }}
          >
            01 / Start
          </p>
          <h2
            style={{
              margin: "8px 0 0",
              fontFamily: "'Bebas Neue', cursive",
              fontSize: 34,
              letterSpacing: "0.04em",
              lineHeight: 1,
            }}
          >
            Start Playing Right Away
          </h2>
        </div>

        <div className="home-main-grid">
          <div>
            <ModeRow
              label="With Computer"
              desc="Play against bots on this device"
              onClick={onComputer}
            />
            <ModeRow
              label="With Friends"
              desc="Create or join a room with friends"
              onClick={onFriends}
              last
            />
          </div>
        </div>

        <aside className="friend-rail" aria-label="Top friends">
          <div className="friend-collapsed-icons" aria-hidden>
            {friendsWithAvatar.length === 0 && (
              <span
                style={{
                  fontFamily: "'Courier Prime', monospace",
                  fontSize: 9,
                  letterSpacing: "0.08em",
                  color: "var(--ui-muted)",
                  textTransform: "uppercase",
                }}
              >
                None
              </span>
            )}
            {friendsWithAvatar.map(
              ({ friend, letter, avatarColor, presence }) => (
                <span
                  key={friend.friendCode}
                  className="friend-avatar"
                  style={{
                    color: avatarColor.fg,
                    background: avatarColor.bg,
                    opacity: presence === "offline" ? 0.48 : 1,
                  }}
                  title={friend.name}
                >
                  {letter}
                </span>
              ),
            )}
          </div>

          <div className="friend-expand-content">
            <div className="friend-rail-head">
              <p className="friend-rail-sub">
                {incomingCount > 0
                  ? `${incomingCount} invite${incomingCount > 1 ? "s" : ""} waiting`
                  : "No incoming invites"}
              </p>
              <h4 className="friend-rail-title">Friends</h4>
            </div>
            {friendsWithAvatar.length === 0 ? (
              <p
                style={{
                  margin: 0,
                  fontFamily: "'Courier Prime', monospace",
                  fontSize: 11,
                  color: "var(--ui-muted)",
                  lineHeight: 1.5,
                }}
              >
                No saved friends yet.
              </p>
            ) : (
              friendsWithAvatar.map(
                ({ friend, letter, avatarColor, presence }) => {
                  const canInvite =
                    presence !== "offline" &&
                    invitingCode !== friend.friendCode;
                  return (
                    <div
                      key={friend.friendCode}
                      className={`friend-row ${presence === "offline" ? "offline" : ""}`}
                    >
                      <span
                        className="friend-avatar"
                        style={{
                          color: avatarColor.fg,
                          background: avatarColor.bg,
                        }}
                      >
                        {letter}
                      </span>

                      <div style={{ minWidth: 0, display: "grid", gap: 2 }}>
                        <span
                          style={{
                            fontFamily: "'Courier Prime', monospace",
                            fontSize: 12,
                            fontWeight: 700,
                            color: "var(--ui-text)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {friend.name}
                        </span>
                        <span className={`friend-status ${presence}`}>
                          {presence === "playing"
                            ? "Playing"
                            : presence === "online"
                              ? "Online"
                              : "Offline"}
                        </span>
                      </div>

                      <button
                        type="button"
                        className="friend-invite-btn"
                        disabled={!canInvite}
                        onClick={() => {
                          void inviteFriend(friend.friendCode);
                        }}
                        title={`Invite ${friend.name}`}
                        aria-label={`Invite ${friend.name}`}
                      >
                        +
                      </button>
                    </div>
                  );
                },
              )
            )}

            <FriendInviteInput
              value={friendCodeInput}
              onChange={setFriendCodeInput}
              onSend={() => {
                void inviteFromInput();
              }}
              disabled={
                normalizeCode(friendCodeInput).length < 4 ||
                invitingCode === normalizeCode(friendCodeInput)
              }
              buttonLabel="Quick Invite"
            />

            <button
              type="button"
              onClick={onFriends}
              style={{
                border: "1px solid var(--ui-line)",
                background: "transparent",
                color: "var(--ui-muted)",
                padding: "8px 10px",
                fontFamily: "'Courier Prime', monospace",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                cursor: "pointer",
                justifySelf: "start",
              }}
            >
              Open Lobby
            </button>
          </div>
        </aside>

        <SectionDivider />

        <p
          style={{
            margin: 0,
            fontFamily: "'Courier Prime', monospace",
            fontSize: 10,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--ui-muted)",
          }}
        >
          Ad-free · No account required · Press settings for rules
        </p>
      </section>
    </PageShell>
    </>
  );
}
