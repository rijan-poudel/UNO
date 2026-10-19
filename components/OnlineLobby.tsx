// Room creation, joining, invitations, and seats share a single lobby flow.
"use client";
import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowRight,
  Bot,
  Check,
  Copy,
  Link,
  Plus,
  User,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type {
  FriendInvite,
  FriendPresenceState,
  RoomSnapshot,
} from "../types/multiplayer";
import type { GameRules } from "../types/rules";
import { parseRoomCode, isRoomCode } from "../lib/roomCodes";
import TableRules from "./TableRules";
import {
  getPlayerName,
  savePlayerName,
  subscribePlayerName,
} from "../lib/playerNames";
import SetupShell from "./SetupShell";
import { SegmentedToggle, SetupIntro } from "./ui/PageChrome";
interface Props {
  rules: Partial<GameRules>;
  onRulesChange: (rules: Partial<GameRules>) => void;
  onOpenRules: () => void;
  connected: boolean;
  room: RoomSnapshot | null;
  playerId: string | null;
  friendCode: string;
  incomingInvites: FriendInvite[];
  outgoingInvites: Array<{
    inviteId: string;
    targetFriendCode: string;
    targetName?: string;
  }>;
  error: string | null;
  initialPanel?: "create" | "join";
  controls?: ReactNode;
  onBack?: () => void;
  onPlayBots?: () => void;
  onSyncPresence: (name: string) => Promise<boolean>;
  onCheckFriendOnline: (
    codes: string[],
  ) => Promise<Record<string, FriendPresenceState>>;
  onCreateRoom: (name: string) => Promise<boolean>;
  onJoinRoom: (room: string, name: string) => Promise<boolean>;
  onSendFriendInvite: (code: string, name: string) => Promise<boolean>;
  onAcceptFriendInvite: (id: string, name: string) => Promise<boolean>;
  onDeclineFriendInvite: (id: string) => Promise<boolean>;
  onLeaveRoom: () => Promise<boolean>;
  onStartGame: () => Promise<boolean>;
  onAddBotSeat: () => Promise<boolean>;
  onKickPlayer: (id: string) => Promise<boolean>;
}
interface Friend {
  friendCode: string;
  name: string;
  lastSeenAt: number;
}
function read(key: string, fallback = "") {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}
function loadFriends(): Friend[] {
  try {
    const value: unknown = JSON.parse(read("uno.online.friends", "[]"));
    return Array.isArray(value)
      ? value
          .filter(
            (f): f is Friend =>
              f &&
              typeof f.friendCode === "string" &&
              typeof f.name === "string",
          )
          .slice(0, 16)
      : [];
  } catch {
    return [];
  }
}
function normalize(code: string) {
  return code
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8);
}
export default function OnlineLobby(props: Props) {
  const {
    room,
    connected,
    playerId,
    error,
    incomingInvites,
    outgoingInvites,
    onSyncPresence,
    onCheckFriendOnline,
  } = props;
  const [name, setName] = useState(getPlayerName);
  const [code, setCode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return parseRoomCode(params.get("room") ?? read("uno.online.roomCode"));
  });
  const [panel, setPanel] = useState<"create" | "join">(() =>
    new URLSearchParams(window.location.search).has("room")
      ? "join"
      : (props.initialPanel ?? "create"),
  );
  const [friendCode, setFriendCode] = useState(() =>
    read("uno.online.prefill.friendCode"),
  );
  const [friends, setFriends] = useState(loadFriends);
  const [presence, setPresence] = useState<Record<string, FriendPresenceState>>(
    {},
  );
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState("");
  const isHost = room?.hostPlayerId === playerId;
  useEffect(() => subscribePlayerName(() => setName(getPlayerName())), []);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (name.trim()) void onSyncPresence(name.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [name, onSyncPresence]);
  useEffect(() => {
    try {
      localStorage.setItem("uno.online.playerName", name.trim());
      localStorage.setItem("uno.online.roomCode", code);
    } catch {}
  }, [name, code]);
  useEffect(() => {
    if (!friends.length) return;
    let alive = true;
    const refresh = async () => {
      try {
        const statuses = await onCheckFriendOnline(
          friends.map((f) => f.friendCode),
        );
        if (alive) setPresence(statuses);
      } catch {}
    };
    void refresh();
    const timer = setInterval(refresh, 15000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [friends, onCheckFriendOnline]);
  const remember = (friendCode: string, friendName?: string) => {
    setFriends((prev) => {
      const existing = prev.find((f) => f.friendCode === friendCode);
      const next = [
        {
          friendCode,
          name: friendName ?? existing?.name ?? friendCode,
          lastSeenAt: Date.now(),
        },
        ...prev.filter((f) => f.friendCode !== friendCode),
      ].slice(0, 16);
      try {
        localStorage.setItem("uno.online.friends", JSON.stringify(next));
        localStorage.removeItem("uno.online.prefill.friendCode");
      } catch {}
      return next;
    });
  };
  const run = async (action: () => Promise<boolean>) => {
    setBusy(true);
    setLocalError("");
    try {
      return await action();
    } catch {
      setLocalError("That didn’t go through. Please try again.");
      return false;
    } finally {
      setBusy(false);
    }
  };
  const invite = async (targetCode: string) => {
    const ok = await run(() =>
      props.onSendFriendInvite(targetCode, name.trim() || "You"),
    );
    if (ok) {
      remember(targetCode);
      setFriendCode("");
      toast.success("Invitation sent.");
    }
  };
  const copy = async (value: string, message: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(message);
    } catch {
      setLocalError(
        `Couldn’t copy automatically. Your code is ${room?.roomId ?? props.friendCode}.`,
      );
    }
  };
  const leave = async () => {
    if (!room || (await run(props.onLeaveRoom))) props.onBack?.();
  };
  return (
    <SetupShell
      subtitle="Friends’ table"
      controls={props.controls}
      footer={
        room ? (
          <>
            <p className="muted">
              {isHost
                ? "Everyone here? You can add bots to fill the table."
                : "Your host will deal when everyone is here."}
            </p>
            {isHost ? (
              <button
                className="button primary wide"
                disabled={busy || !connected || room.players.length < 2}
                onClick={() => void run(props.onStartGame)}
              >
                {busy
                  ? "Getting ready…"
                  : room.players.length < 2
                    ? "Waiting for another player"
                    : "Deal everyone in"}
                <ArrowRight size={19} />
              </button>
            ) : (
              <div className="waiting-host">
                <span className="presence-dot online" />
                Waiting for the host to deal
              </div>
            )}
          </>
        ) : (
          <p className="setup-hint">
            Your room is private. Share the code with the people you want at
            your table.
          </p>
        )
      }
    >
      <SetupIntro
        title={room ? "Your table is open." : "Bring your people."}
        description={
          room
            ? "A little rivalry is better together."
            : "Same game. Different places. Get everyone around one table."
        }
        onBack={() => void leave()}
        trailing={
          <span
            className={`connection-state ${connected ? "online" : "offline"}`}
          >
            <i className={`presence-dot ${connected ? "online" : "offline"}`} />
            {connected ? "Connected" : error ? "Offline" : "Connecting…"}
          </span>
        }
      />
      {(error || localError) && (
        <div className="error-message connection-recovery" role="alert">
          <p>{localError || error}</p>
          {!connected && !room && props.onPlayBots && (
            <button className="text-button" onClick={props.onPlayBots}>
              Play with bots
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      )}
      {!room && (
        <>
          <SegmentedToggle
            value={panel}
            options={[
              { value: "create", label: "Create a room" },
              { value: "join", label: "Join a room" },
            ]}
            onChange={setPanel}
          />
          <form
            className="room-form"
            onSubmit={(e) => {
              e.preventDefault();
              void run(() =>
                panel === "create"
                  ? props.onCreateRoom(name.trim())
                  : props.onJoinRoom(code, name.trim()),
              );
            }}
          >
            <label className="field-label" htmlFor="online-name">
              Your name
            </label>
            <input
              id="online-name"
              value={name}
              maxLength={18}
              autoComplete="nickname"
              onBlur={() => setName(savePlayerName(name))}
              onChange={(e) => setName(e.target.value)}
              required
            />
            {panel === "join" && (
              <>
                <label className="field-label" htmlFor="room-code">
                  Room code
                </label>
                <input
                  id="room-code"
                  className="room-code-input"
                  aria-describedby="room-code-help"
                  aria-invalid={code.length > 0 && !isRoomCode(code)}
                  value={code}
                  placeholder="6-letter code or invitation link"
                  autoComplete="off"
                  autoCapitalize="characters"
                  onChange={(e) => setCode(parseRoomCode(e.target.value))}
                  required
                />
                <p id="room-code-help" className="muted">
                  {code && !isRoomCode(code)
                    ? "Use the 6-character room code, or paste the full invitation link."
                    : "Room codes have 6 characters. Friend codes are in Friends & invitations."}
                </p>
              </>
            )}
            <button
              className="button primary wide"
              disabled={
                busy ||
                !connected ||
                !name.trim() ||
                (panel === "join" && !isRoomCode(code))
              }
            >
              {busy
                ? "One moment…"
                : panel === "create"
                  ? "Open a table"
                  : "Join the table"}
              <ArrowRight size={18} />
            </button>
          </form>
        </>
      )}
      {room && (
        <>
          <div className="room-code-panel">
            <div>
              <span>Room code</span>
              <strong>{room.roomId}</strong>
            </div>
            <div className="room-share-actions">
              <button
                className="button secondary small"
                onClick={() => void copy(room.roomId, "Room code copied.")}
              >
                <Copy size={16} />
                Copy code
              </button>
              <button
                className="button secondary small"
                aria-label="Copy invitation link"
                onClick={() =>
                  void copy(
                    `${window.location.origin}/?room=${room.roomId}`,
                    "Room link copied.",
                  )
                }
              >
                <Link size={18} /> Copy link
              </button>
            </div>
          </div>
          <div className="seat-list">
            {room.players.map((p, i) => (
              <div className="seat-row" key={p.playerId}>
                <span className={`avatar seat-avatar seat-${i % 6}`}>
                  {p.isBot ? <Bot size={20} /> : <User size={20} />}
                </span>
                <span className="lobby-seat-name">
                  <strong>
                    {p.name}
                    {p.playerId === playerId ? " (you)" : ""}
                  </strong>
                  <small>
                    {p.isBot
                      ? "Bot · ready to play"
                      : !p.connected
                        ? "Reconnecting…"
                        : p.playerId === room.hostPlayerId
                          ? "Host"
                          : "At the table"}
                  </small>
                </span>
                {isHost && p.playerId !== playerId ? (
                  <button
                    className="icon-button"
                    aria-label={`Remove ${p.name}`}
                    disabled={busy}
                    onClick={() =>
                      void run(() => props.onKickPlayer(p.playerId))
                    }
                  >
                    <X size={17} />
                  </button>
                ) : (
                  <Check size={17} className="muted" />
                )}
              </div>
            ))}
          </div>
          {isHost && room.players.length < 6 && (
            <button
              className="button secondary"
              disabled={busy}
              onClick={() => void run(props.onAddBotSeat)}
            >
              <Plus size={17} />
              Add a bot
            </button>
          )}
        </>
      )}
      {room && isHost && (
        <TableRules
          rules={props.rules}
          onChange={props.onRulesChange}
          onOpenRules={props.onOpenRules}
        />
      )}
      {room && !isHost && (
        <p className="muted">The host chooses this table’s rules.</p>
      )}
      <details
        className="lobby-friends setup-disclosure"
        key={outgoingInvites.length ? "invited" : "friends"}
        open={outgoingInvites.length ? true : undefined}
      >
        <summary>Friends & invitations</summary>
        <form
          className="inline-form"
          onSubmit={(e) => {
            e.preventDefault();
            void invite(friendCode);
          }}
        >
          <label className="sr-only" htmlFor="lobby-friend-code">
            Friend code
          </label>
          <input
            id="lobby-friend-code"
            value={friendCode}
            placeholder="Their friend code"
            maxLength={8}
            autoCapitalize="characters"
            onChange={(e) => setFriendCode(normalize(e.target.value))}
          />
          <button
            className="button secondary"
            disabled={busy || !connected || friendCode.length < 4}
          >
            Invite
            <ArrowRight size={17} />
          </button>
        </form>
        {outgoingInvites.map((i) => (
          <p key={i.inviteId} className="muted">
            Invitation sent to {i.targetName ?? i.targetFriendCode}.
          </p>
        ))}
        {friends.length > 0 && (
          <div className="saved-friends">
            {friends.slice(0, 4).map((f) => (
              <div className="saved-friend" key={f.friendCode}>
                <span className="avatar">{f.name[0]}</span>
                <span>
                  <strong>{f.name}</strong>
                  <small>{presence[f.friendCode] ?? "offline"}</small>
                </span>
                <button
                  className="icon-button"
                  aria-label={`Invite ${f.name}`}
                  disabled={busy || !connected}
                  onClick={() => void invite(f.friendCode)}
                >
                  <Plus size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="your-code">
          <span>Your friend code</span>
          <button
            className="text-button"
            disabled={!props.friendCode}
            onClick={() => void copy(props.friendCode, "Friend code copied.")}
          >
            {props.friendCode || "Connecting…"}
            <Copy size={14} />
          </button>
        </div>
      </details>
      {incomingInvites.length > 0 && (
        <section>
          <h2>You’re invited.</h2>
          {incomingInvites.map((inv) => (
            <div className="invite-row" key={inv.inviteId}>
              <div>
                <strong>{inv.fromName}</strong>
                <p>Has a seat for you.</p>
              </div>
              <button
                className="icon-button"
                disabled={busy}
                aria-label={`Decline invite from ${inv.fromName}`}
                onClick={() =>
                  void run(() => props.onDeclineFriendInvite(inv.inviteId))
                }
              >
                <X size={17} />
              </button>
              <button
                className="button primary small"
                disabled={busy || !connected}
                onClick={async () => {
                  if (
                    await run(() =>
                      props.onAcceptFriendInvite(
                        inv.inviteId,
                        name.trim() || "You",
                      ),
                    )
                  )
                    remember(inv.fromFriendCode, inv.fromName);
                }}
              >
                Join
              </button>
            </div>
          ))}
        </section>
      )}
    </SetupShell>
  );
}
