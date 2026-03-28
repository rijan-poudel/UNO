"use client";

import { useEffect, useMemo, useState } from "react";
import type {
    FriendInvite,
    FriendPresenceState,
} from "../../types/multiplayer";
import NotificationPanel from "../NotificationPanel";
import FriendInviteInput from "../FriendInviteInput";
import { PageShell, SectionDivider, UnoWordmark } from "../ui/PageChrome";

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
    onOpenControlsSettings: () => void;
    onOpenAudioSettings: () => void;
    onOpenProfileSettings?: () => void;
    onComputer: () => void;
    onFriends: () => void;
    onFriendQuickInvite: (friendCode: string) => Promise<boolean>;
    onCheckFriendOnline: (
        friendCodes: string[],
    ) => Promise<Record<string, FriendPresenceState>>;
    incomingInvites: FriendInvite[];
    onAcceptFriendInvite?: (inviteId: string) => Promise<boolean>;
    onDeclineFriendInvite?: (inviteId: string) => Promise<boolean>;
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
    onOpenControlsSettings,
    onOpenAudioSettings,
    onOpenProfileSettings,
    onComputer,
    onFriends,
    onFriendQuickInvite,
    onCheckFriendOnline,
    incomingInvites,
    onAcceptFriendInvite,
    onDeclineFriendInvite,
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
                onOpenControlsSettings={onOpenControlsSettings}
                onOpenAudioSettings={onOpenAudioSettings}
                onOpenProfileSettings={onOpenProfileSettings}
              incomingInvites={incomingInvites}
              onAcceptFriendInvite={onAcceptFriendInvite}
              onDeclineFriendInvite={onDeclineFriendInvite}
                incomingInviteCount={incomingCount}
            />

            <PageShell>
                <style>{`
          .home-wrap {
            width: min(1120px, 100%);
            margin: 0 auto;
            display: grid;
            gap: 20px;
            padding-bottom: 16px;
          }

          .hero-shell {
            position: relative;
            border: 2px solid var(--ui-line);
            background:
              linear-gradient(
                180deg,
                color-mix(in oklab, var(--ui-surface) 94%, white 6%),
                color-mix(in oklab, var(--ui-surface) 98%, black 2%)
              );
            overflow: hidden;
            box-shadow:
              8px 8px 0 color-mix(in oklab, var(--ui-line) 60%, transparent),
              0 0 0 1px color-mix(in oklab, var(--ui-line) 35%, transparent) inset;
          }

          .hero-shell::before {
            content: "";
            position: absolute;
            inset: 0;
            pointer-events: none;
            background:
              linear-gradient(
                to right,
                transparent 0,
                transparent calc(100% - 1px),
                color-mix(in oklab, var(--ui-line) 25%, transparent) calc(100% - 1px),
                color-mix(in oklab, var(--ui-line) 25%, transparent) 100%
              ),
              linear-gradient(
                to bottom,
                transparent 0,
                transparent calc(100% - 1px),
                color-mix(in oklab, var(--ui-line) 18%, transparent) calc(100% - 1px),
                color-mix(in oklab, var(--ui-line) 18%, transparent) 100%
              );
            background-size: 24px 24px;
            opacity: 0.22;
          }

          .hero-grid {
            position: relative;
            z-index: 1;
            display: grid;
            grid-template-columns: minmax(0, 1.15fr) minmax(280px, 0.85fr);
            gap: 20px;
            padding: 22px;
            align-items: stretch;
          }

          .hero-left {
            display: grid;
            gap: 14px;
            align-content: start;
          }

          .hero-kicker {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            width: fit-content;
            border: 1px solid var(--ui-line);
            background: color-mix(in oklab, var(--ui-surface) 88%, white 12%);
            padding: 5px 9px;
            font-family: "Courier Prime", monospace;
            font-size: 9px;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: var(--ui-muted);
          }

          .hero-kicker-dot {
            width: 8px;
            height: 8px;
            background: var(--ui-accent-green);
            border-radius: 999px;
          }

          .hero-copy {
            display: grid;
            gap: 10px;
          }

          .hero-title {
            margin: 0;
            font-family: "Bebas Neue", cursive;
            font-size: clamp(38px, 7vw, 82px);
            line-height: 0.92;
            letter-spacing: 0.02em;
            color: var(--ui-text);
            text-transform: uppercase;
          }

          .hero-subtitle {
            margin: 0;
            font-family: "Courier Prime", monospace;
            font-size: clamp(11px, 1.5vw, 14px);
            line-height: 1.5;
            color: var(--ui-muted);
            max-width: 46ch;
          }

          .cta-row {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
          }

          .arcade-btn {
            position: relative;
            border: 2px solid var(--ui-line);
            background:
              linear-gradient(
                180deg,
                color-mix(in oklab, var(--ui-surface) 86%, white 14%),
                color-mix(in oklab, var(--ui-surface) 96%, black 4%)
              );
            color: var(--ui-text);
            padding: 14px;
            text-align: left;
            cursor: pointer;
            transition:
              transform 0.14s ease,
              box-shadow 0.14s ease,
              border-color 0.14s ease;
            box-shadow: 6px 6px 0 color-mix(in oklab, var(--ui-line) 55%, transparent);
          }

          .arcade-btn:hover {
            transform: translate(-2px, -2px);
            box-shadow: 8px 8px 0 color-mix(in oklab, var(--ui-line) 60%, transparent);
            border-color: color-mix(in oklab, var(--ui-text) 50%, var(--ui-line));
          }

          .arcade-btn.primary {
            background:
              linear-gradient(
                180deg,
                color-mix(in oklab, var(--ui-accent-blue) 28%, var(--ui-surface)),
                color-mix(in oklab, var(--ui-surface) 86%, black 14%)
              );
          }

          .arcade-btn.secondary {
            background:
              linear-gradient(
                180deg,
                color-mix(in oklab, var(--ui-accent-green) 18%, var(--ui-surface)),
                color-mix(in oklab, var(--ui-surface) 88%, black 12%)
              );
          }

          .btn-topline {
            display: block;
            font-family: "Courier Prime", monospace;
            font-size: 9px;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: var(--ui-muted);
            margin-bottom: 4px;
          }

          .btn-title {
            display: block;
            font-family: "Bebas Neue", cursive;
            font-size: 24px;
            line-height: 0.96;
            letter-spacing: 0.04em;
            text-transform: uppercase;
            color: var(--ui-text);
          }

          .btn-desc {
            display: block;
            margin-top: 6px;
            font-family: "Courier Prime", monospace;
            font-size: 10px;
            line-height: 1.4;
            color: var(--ui-muted);
          }

          .hero-right {
            display: flex;
            min-height: 100%;
          }

          .showcase-card {
            flex: 1;
            position: relative;
            height: 100%;
            min-height: 280px;
            border: 2px solid var(--ui-line);
            background:
              radial-gradient(circle at 75% 18%, rgba(255,255,255,0.08), transparent 28%),
              linear-gradient(
                180deg,
                color-mix(in oklab, var(--ui-surface) 92%, white 8%),
                color-mix(in oklab, var(--ui-surface) 97%, black 3%)
              );
            overflow: hidden;
            box-shadow: 6px 6px 0 color-mix(in oklab, var(--ui-line) 45%, transparent);
          }

          .pixel-stack {
            position: absolute;
            inset: 0;
            display: grid;
            place-items: center;
            padding: 22px;
          }

          .pixel-stage {
            position: relative;
            width: min(100%, 300px);
            aspect-ratio: 1 / 1;
          }

          .pixel {
            position: absolute;
            border: 2px solid rgba(0,0,0,0.18);
            box-shadow: 4px 4px 0 rgba(0,0,0,0.08);
          }

          .pixel.red { background: #c0392b; }
          .pixel.yellow { background: #f4b400; }
          .pixel.blue { background: #2f80ed; }
          .pixel.green { background: #2e7d32; }

          .pixel.p1 { width: 72px; height: 72px; top: 14%; left: 8%; }
          .pixel.p2 { width: 72px; height: 72px; top: 14%; left: 32%; }
          .pixel.p3 { width: 72px; height: 72px; top: 38%; left: 32%; }
          .pixel.p4 { width: 72px; height: 72px; top: 8%; right: 10%; }
          .pixel.p5 { width: 72px; height: 72px; top: 32%; right: 10%; }
          .pixel.p6 { width: 72px; height: 72px; top: 56%; right: 10%; }
          .pixel.p7 { width: 72px; height: 72px; bottom: 10%; left: 14%; }
          .pixel.p8 { width: 72px; height: 72px; bottom: 10%; left: 38%; }

          .mini-card {
            position: absolute;
            width: 106px;
            height: 144px;
            border: 2px solid rgba(0,0,0,0.16);
            box-shadow: 8px 8px 0 rgba(0,0,0,0.08);
          }

          .mini-card.one {
            top: 18%;
            left: 28%;
            transform: rotate(-12deg);
            background-color: color-mix(in oklab, var(--ui-accent-blue) 25%, white 75%);
          }

          .mini-card.two {
            bottom: 14%;
            right: 18%;
            transform: rotate(9deg);
            background-color: color-mix(in oklab, var(--ui-accent-green) 18%, white 82%);
          }

          .mini-card-inner {
            position: absolute;
            inset: 10px;
            border: 2px solid rgba(0,0,0,0.12);
            display: grid;
            place-items: center;
            font-family: "Bebas Neue", cursive;
            font-size: 48px;
            color: rgba(0,0,0,0.55);
          }

          .friends-panel {
  border: 2px solid var(--ui-line);
  background:
    linear-gradient(
      180deg,
      color-mix(in oklab, var(--ui-surface) 92%, white 8%),
      color-mix(in oklab, var(--ui-surface) 97%, black 3%)
    );
  padding: 14px;
  display: grid;
  gap: 12px;
  box-shadow: 6px 6px 0 color-mix(in oklab, var(--ui-line) 34%, transparent);
}

.friends-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.friends-kicker {
  margin: 0;
  font-family: 'Courier Prime', monospace;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ui-muted);
}

.friends-title {
  margin: 2px 0 0;
  font-family: 'Bebas Neue', cursive;
  font-size: 24px;
  line-height: 1;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--ui-text);
}

.invite-badge {
  border: 1px solid var(--ui-line);
  background: color-mix(in oklab, var(--ui-surface) 88%, white 12%);
  padding: 6px 10px;
  font-family: 'Courier Prime', monospace;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ui-muted);
  white-space: nowrap;
}

.friends-empty {
  margin: 0;
  border: 1px dashed var(--ui-line);
  background: color-mix(in oklab, var(--ui-surface) 94%, white 6%);
  padding: 12px;
  font-family: 'Courier Prime', monospace;
  font-size: 11px;
  line-height: 1.5;
  color: var(--ui-muted);
}

.friends-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.friend-card {
  border: 1px solid var(--ui-line);
  background: color-mix(in oklab, var(--ui-surface) 94%, white 6%);
  padding: 8px;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  min-width: 0;
  min-height: 56px;
  transition:
    transform 0.12s ease,
    border-color 0.12s ease,
    opacity 0.12s ease;
}

.friend-card:hover {
  transform: translateY(-1px);
  border-color: color-mix(in oklab, var(--ui-text) 40%, var(--ui-line));
}

.friend-card.offline {
  opacity: 0.56;
}

.friend-avatar {
  width: 34px;
  height: 34px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  font-family: 'Bebas Neue', cursive;
  font-size: 18px;
  line-height: 1;
  border: 1px solid rgba(0, 0, 0, 0.14);
  flex: 0 0 auto;
}

.friend-meta {
  min-width: 0;
  display: grid;
  gap: 2px;
}

.friend-name {
  font-family: 'Courier Prime', monospace;
  font-size: 11px;
  font-weight: 700;
  color: var(--ui-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.friend-status {
  font-family: 'Courier Prime', monospace;
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  line-height: 1;
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

.friend-invite-btn {
  width: 28px;
  height: 28px;
  border: 1px solid var(--ui-line);
  background: transparent;
  color: var(--ui-text);
  font-family: 'Bebas Neue', cursive;
  font-size: 18px;
  line-height: 1;
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: transform 0.12s ease, opacity 0.12s ease;
}

.friend-invite-btn:hover {
  transform: scale(1.04);
}

.friend-invite-btn:disabled {
  opacity: 0.45;
  cursor: default;
}

.friends-actions {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  align-items: stretch;
}

.lobby-btn {
  border: 2px solid var(--ui-line);
  background:
    linear-gradient(
      180deg,
      color-mix(in oklab, var(--ui-surface) 86%, white 14%),
      color-mix(in oklab, var(--ui-surface) 96%, black 4%)
    );
  color: var(--ui-text);
  padding: 0 14px;
  min-height: 44px;
  font-family: 'Courier Prime', monospace;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
  white-space: nowrap;
  box-shadow: 4px 4px 0 color-mix(in oklab, var(--ui-line) 28%, transparent);
  transition: transform 0.12s ease, box-shadow 0.12s ease;
}

.lobby-btn:hover {
  transform: translate(-1px, -1px);
  box-shadow: 5px 5px 0 color-mix(in oklab, var(--ui-line) 34%, transparent);
}

@media (max-width: 980px) {
  .friends-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .friends-panel {
    padding: 12px;
    gap: 10px;
  }

  .friends-grid {
    grid-template-columns: 1fr;
  }

  .friends-actions {
    grid-template-columns: 1fr;
  }

  .lobby-btn {
    min-height: 42px;
  }
          .footer-strip {
            border: 2px solid var(--ui-line);
            background: color-mix(in oklab, var(--ui-surface) 94%, white 6%);
            padding: 8px 12px;
            font-family: "Courier Prime", monospace;
            font-size: 9px;
            font-weight: 700;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: var(--ui-muted);
            display: flex;
            flex-wrap: wrap;
            gap: 8px 14px;
            justify-content: space-between;
          }

          .footer-left,
          .footer-right {
            display: flex;
            flex-wrap: wrap;
            gap: 8px 12px;
          }

          @media (max-width: 980px) {
            .hero-grid {
              grid-template-columns: 1fr;
            }

            .showcase-card {
              min-height: 240px;
            }

            .friends-grid {
              grid-template-columns: 1fr;
            }
          }

          @media (max-width: 720px) {
            .home-wrap {
              gap: 14px;
            }

            .hero-grid {
              padding: 16px;
              gap: 16px;
            }

            .cta-row {
              grid-template-columns: 1fr;
            }

            .hero-title {
              font-size: clamp(32px, 13vw, 52px);
            }

            .friends-panel {
              padding: 12px;
            }

            .friends-title {
              font-size: 24px;
            }

            .footer-strip {
              justify-content: flex-start;
            }
          }
        `}</style>

                <section className="home-wrap">
                    <div>
                        <UnoWordmark />
                    </div>

                    <section className="hero-shell" aria-label="Home hero">
                        <div className="hero-grid">
                            <div className="hero-left">
                                <div className="hero-copy">
                                    <h1 className="hero-title">
                                        Pick a mode.
                                        <br />
                                        Start a match.
                                    </h1>

                                    <p className="hero-subtitle">
                                        Fast UNO with quick invites and instant rounds.
                                    </p>
                                </div>

                                <div className="cta-row">
                                    <button
                                        type="button"
                                        className="arcade-btn primary"
                                        onClick={onComputer}
                                    >
                                        <span className="btn-topline">Solo</span>
                                        <span className="btn-title">Play vs CPU</span>
                                        <span className="btn-desc">Start a local game.</span>
                                    </button>

                                    <button
                                        type="button"
                                        className="arcade-btn secondary"
                                        onClick={onFriends}
                                    >
                                        <span className="btn-topline">Online</span>
                                        <span className="btn-title">Play with Friends</span>
                                        <span className="btn-desc">Create or join a room.</span>
                                    </button>
                                </div>
                            </div>

                            <div className="hero-right">
                                <div className="showcase-card" aria-hidden="true">
                                    <div className="pixel-stack">
                                        <div className="pixel-stage">
                                            <div className="pixel red p1" />
                                            <div className="pixel yellow p2" />
                                            <div className="pixel blue p3" />
                                            <div className="pixel green p4" />
                                            <div className="pixel red p5" />
                                            <div className="pixel yellow p6" />
                                            <div className="pixel blue p7" />
                                            <div className="pixel green p8" />

                                            <div className="mini-card one">
                                                <div className="mini-card-inner">U</div>
                                            </div>

                                            <div className="mini-card two">
                                                <div className="mini-card-inner">NO</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <SectionDivider />

                    <section
                        className="friends-panel"
                        aria-label="Friends and quick invite"
                    >
                        <div className="friends-head">
                            <div className="friends-title-wrap">
                                <p className="friends-kicker">Friends</p>
                                <h2 className="friends-title">Quick Invite</h2>
                            </div>

                            <div className="invite-badge">
                                {incomingCount > 0 ? `${incomingCount} waiting` : "No invites"}
                            </div>
                        </div>

                        {friendsWithAvatar.length === 0 ? (
                            <p className="friends-empty">
                                No saved friends yet. Enter a code to invite.
                            </p>
                        ) : (
                            <div className="friends-grid">
                                {friendsWithAvatar.map(
                                    ({ friend, letter, avatarColor, presence }) => {
                                        const canInvite =
                                            presence !== "offline" &&
                                            invitingCode !== friend.friendCode;

                                        return (
                                            <div
                                                key={friend.friendCode}
                                                className={`friend-card ${presence === "offline" ? "offline" : ""}`}
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

                                                <div className="friend-meta">
                                                    <span className="friend-name">{friend.name}</span>
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
                                )}
                            </div>
                        )}

                        <div className="friends-actions">
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
                                buttonLabel="Invite"
                            />

                            <button type="button" className="lobby-btn" onClick={onFriends}>
                                Open Lobby
                            </button>
                        </div>
                    </section>
                </section>
            </PageShell>
        </>
    );
}
