// Join first. Once inside, share the room and fill its seats.
"use client";
import dynamic from "next/dynamic";
import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  ArrowRight,
  Check,
  Copy,
  Link,
  Plus,
  SlidersHorizontal,
  UserPlus,
  Users,
  WifiOff,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { getRuleSetLabel } from "../lib/customRuleProfiles";
import type { RoomSnapshot, SocialSnapshot } from "../types/multiplayer";
import type { GameRules } from "../types/rules";
import { parseRoomCode, isRoomCode } from "../lib/roomCodes";
import { getPlayerName, subscribePlayerName } from "../lib/playerNames";
import { getTableMood } from "../lib/rulePresets";
import SetupShell from "./SetupShell";
import { CountBadge, SetupIntro } from "./ui/PageChrome";
import PlayerAvatar from "./PlayerAvatar";
const FriendInvitePicker = dynamic(() => import("./FriendInvitePicker"), {
  loading: () => null,
});
interface Props {
  rules: Partial<GameRules>;
  savingRules?: boolean;
  onOpenRules: () => void;
  connected: boolean;
  room: RoomSnapshot | null;
  playerId: string | null;
  social: SocialSnapshot;
  invitedCodes: string[];
  error: string | null;
  initialPanel?: "create" | "join";
  controls?: ReactNode;
  onBack?: () => void;
  onPlayBots?: () => void;
  onCreateRoom: (name: string) => Promise<boolean>;
  onJoinRoom: (room: string, name: string) => Promise<boolean>;
  onRequestFriend: (code: string) => Promise<boolean>;
  onInviteFriend: (code: string) => Promise<boolean>;
  onOpenFriends: () => void;
  onLeaveRoom: () => Promise<boolean>;
  onStartGame: () => Promise<boolean>;
  onAddBotSeat: () => Promise<boolean>;
  onKickPlayer: (id: string) => Promise<boolean>;
}
function readRoomCode(): string {
  try {
    return parseRoomCode(
      new URLSearchParams(window.location.search).get("room") ??
        localStorage.getItem("uno.online.roomCode") ??
        "",
    );
  } catch {
    return "";
  }
}
export default function OnlineLobby(props: Props) {
  const { room, connected, playerId, social } = props;
  const [code, setCode] = useState(readRoomCode);
  const [panel] = useState(
    () =>
      props.initialPanel ??
      (typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).has("room")
        ? "join"
        : "create"),
  );
  const [busy, setBusy] = useState("");
  const pending = useRef(false);
  const [error, setError] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [copied, setCopied] = useState("");
  const [manualCopy, setManualCopy] = useState<{
    label: string;
    value: string;
  } | null>(null);
  const formId = useId();
  const isHost = room?.hostPlayerId === playerId;
  const publishedRules = room?.rules ?? props.rules;
  const name = useSyncExternalStore(
    subscribePlayerName,
    getPlayerName,
    () => "You",
  );
  const roomStatus = !connected
    ? "Reconnecting to your room…"
    : room && room.players.some((player) => !player.isBot && !player.connected)
      ? isHost
        ? "Someone is reconnecting. You can wait or deal."
        : "Someone is reconnecting."
      : room && isHost && room.players.length < 2
        ? "Share your code or add a bot to start."
        : null;
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(""), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const run = async (label: string, action: () => Promise<boolean>) => {
    if (pending.current) return false;
    pending.current = true;
    setBusy(label);
    setError("");
    try {
      return await action();
    } catch {
      setError("That didn’t go through. Please try again.");
      return false;
    } finally {
      pending.current = false;
      setBusy("");
    }
  };
  const leave = async () => {
    if (!room) {
      void props.onLeaveRoom();
      props.onBack?.();
    } else if (await run("Leaving room…", props.onLeaveRoom)) props.onBack?.();
  };
  const copy = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      setManualCopy(null);
      toast.success(`${label} copied.`);
    } catch {
      setManualCopy({ label, value });
    }
  };
  return (
    <SetupShell
      className={`focused-room mood-${getTableMood(publishedRules)}${room ? "" : " room-entry"}`}
      subtitle={
        room ? "Your room" : panel === "join" ? "Join a room" : "Create a room"
      }
      controls={props.controls}
      footer={
        room ? (
          <>
            {roomStatus && (
              <p className="muted" role="status">
                {roomStatus}
              </p>
            )}
            {isHost ? (
              <button
                className="button primary wide"
                disabled={
                  !!busy ||
                  props.savingRules ||
                  !connected ||
                  room.players.length < 2
                }
                onClick={() => void run("Dealing cards…", props.onStartGame)}
                aria-busy={busy === "Dealing cards…"}
              >
                {(busy === "Dealing cards…" ? busy : "") ||
                  (room.players.length < 2
                    ? "Waiting for another player"
                    : "Deal everyone in")}
                <ArrowRight size={19} />
              </button>
            ) : (
              <p className="waiting-host" role="status">
                Waiting for the host to deal
              </p>
            )}
          </>
        ) : (
          <button
            type="submit"
            form={formId}
            className="button primary wide"
            disabled={
              !!busy || !connected || (panel === "join" && !isRoomCode(code))
            }
            aria-busy={!!busy}
          >
            {busy || (panel === "join" ? "Join the room" : "Create room")}
            <ArrowRight size={20} />
          </button>
        )
      }
    >
      <SetupIntro
        title={
          room
            ? "Your room"
            : panel === "join"
              ? "Join a room"
              : "Create a room"
        }
        onBack={() => void leave()}
        backDisabled={!!room && !!busy}
        trailing={
          !connected && (
            <span className="connection-state offline" role="status">
              <i className="presence-dot offline" />
              Connecting…
            </span>
          )
        }
      />
      {(error || props.error) && (
        <p className="error-message" role="alert">
          {error || props.error}
        </p>
      )}
      {!connected && !room && props.onPlayBots && (
        <div className="room-connection-note" role="status">
          <WifiOff size={20} />
          <p>Connecting to rooms. You can play with bots while we reconnect.</p>
          <button className="text-button" onClick={props.onPlayBots}>
            Play with bots
            <ArrowRight size={16} />
          </button>
        </div>
      )}
      {!room && (
        <form
          id={formId}
          className="room-form focused-room-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!connected || (panel === "join" && !isRoomCode(code))) return;
            if (panel === "join")
              try {
                localStorage.setItem("uno.online.roomCode", code);
              } catch {}
            void run(
              panel === "join" ? "Joining room…" : "Creating room…",
              () =>
                panel === "join"
                  ? props.onJoinRoom(code, getPlayerName())
                  : props.onCreateRoom(getPlayerName()),
            );
          }}
        >
          {panel === "join" && (
            <>
              <label className="field-label" htmlFor="room-code">
                Room code
              </label>
              <input
                id="room-code"
                className="room-code-input"
                value={code}
                autoFocus
                placeholder="Code or invitation link"
                autoComplete="off"
                autoCapitalize="characters"
                aria-describedby={
                  code && !isRoomCode(code) ? "room-code-help" : undefined
                }
                aria-invalid={code.length > 0 && !isRoomCode(code)}
                spellCheck={false}
                onChange={(e) => setCode(parseRoomCode(e.target.value))}
                required
              />
              {code && !isRoomCode(code) && (
                <p id="room-code-help" className="muted">
                  Use the 6-character code or paste the invitation link.
                </p>
              )}
            </>
          )}
          <p className="room-joining-as muted">
            Playing as <strong>{name}</strong>
          </p>
        </form>
      )}
      {manualCopy && (
        <div
          className="manual-copy-box"
          role="region"
          aria-label={`Manual copy ${manualCopy.label}`}
        >
          <label className="field-label" htmlFor="manual-room-copy">
            Select and copy {manualCopy.label.toLowerCase()}
          </label>
          <input
            id="manual-room-copy"
            autoFocus
            readOnly
            value={manualCopy.value}
            onFocus={(e) => e.target.select()}
          />
          <button className="text-button" onClick={() => setManualCopy(null)}>
            Close
          </button>
        </div>
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
                className="icon-button"
                aria-label="Copy room code"
                onClick={() => void copy("Room code", room.roomId)}
              >
                {copied === "Room code" ? (
                  <Check size={19} />
                ) : (
                  <Copy size={19} />
                )}
              </button>
              <button
                className="icon-button"
                aria-label="Copy invitation link"
                onClick={() =>
                  void copy(
                    "Room link",
                    `${window.location.origin}/?room=${room.roomId}`,
                  )
                }
              >
                {copied === "Room link" ? (
                  <Check size={19} />
                ) : (
                  <Link size={19} />
                )}
              </button>
            </div>
          </div>
          <div className="section-heading room-seats-heading">
            <h2>At the table</h2>
            <CountBadge current={room.players.length} total={6} />
          </div>
          <div className="room-seat-actions">
            {isHost && (
              <button
                className="button secondary"
                disabled={!!busy || !connected || room.players.length >= 6}
                onClick={() => void run("Adding bot…", props.onAddBotSeat)}
                aria-busy={busy === "Adding bot…"}
              >
                <Plus size={18} />
                {busy === "Adding bot…" ? "Adding…" : "Add a bot"}
              </button>
            )}
            <button
              className="button secondary"
              disabled={!!busy || !connected || room.players.length >= 6}
              onClick={() => setInviteOpen(true)}
            >
              <Users size={18} />
              Invite friends
            </button>
          </div>
          <div
            className="seat-list room-seat-list"
            role="list"
            aria-label="Players at this table"
          >
            {room.players.map((player) => {
              const isMe = player.playerId === playerId;
              const code = player.friendCode;
              const accepted = social.friends.some(
                (friend) => friend.friendCode === code,
              );
              const requested = social.outgoingRequests.some(
                (request) => request.to.friendCode === code,
              );
              const incoming = social.incomingRequests.some(
                (request) => request.from.friendCode === code,
              );
              return (
                <div className="seat-row" role="listitem" key={player.playerId}>
                  <PlayerAvatar
                    seed={player.playerId}
                    avatarId={player.avatarId}
                    isBot={player.isBot}
                  />
                  <span className="lobby-seat-name">
                    <strong>
                      {player.name}
                      {isMe && player.name.toLowerCase() !== "you"
                        ? " (you)"
                        : ""}
                    </strong>
                    <small>
                      {player.isBot
                        ? "Bot"
                        : !player.connected
                          ? "Reconnecting…"
                          : player.playerId === room.hostPlayerId
                            ? "Host"
                            : "Ready"}
                    </small>
                  </span>
                  {!isMe && !player.isBot && code && (
                    <button
                      className="icon-button room-add-friend"
                      aria-label={
                        accepted
                          ? `${player.name} is your friend`
                          : requested
                            ? `Friend request sent to ${player.name}`
                            : incoming
                              ? `Review ${player.name}'s friend request`
                              : `Add ${player.name} as a friend`
                      }
                      disabled={!!busy || !connected || accepted || requested}
                      onClick={() => {
                        if (incoming) props.onOpenFriends();
                        else
                          void run("Sending request…", async () => {
                            const ok = await props.onRequestFriend(code);
                            if (ok) toast.success("Friend request sent.");
                            return ok;
                          });
                      }}
                    >
                      {accepted ? <Check size={18} /> : <UserPlus size={18} />}
                    </button>
                  )}
                  {isHost && !isMe && (
                    <button
                      className="icon-button"
                      aria-label={`Remove ${player.name}`}
                      disabled={!!busy || !connected}
                      onClick={() =>
                        void run("Removing player…", () =>
                          props.onKickPlayer(player.playerId),
                        )
                      }
                    >
                      <X size={17} />
                    </button>
                  )}
                  {!player.connected && !player.isBot && (
                    <WifiOff size={17} aria-label="Reconnecting" />
                  )}
                </div>
              );
            })}
          </div>
          <button
            className="room-rules-link text-button"
            disabled={!!busy || props.savingRules}
            onClick={props.onOpenRules}
          >
            <SlidersHorizontal size={17} />
            <span>
              {getRuleSetLabel(publishedRules)} ·{" "}
              {publishedRules.startingHandSize ?? 7} cards each
            </span>
            <ArrowRight size={16} />
          </button>
        </>
      )}
      {inviteOpen && room && (
        <FriendInvitePicker
          friends={social.friends}
          seatedCodes={room.players.flatMap((player) =>
            player.friendCode ? [player.friendCode] : [],
          )}
          invitedCodes={props.invitedCodes}
          connected={connected}
          onInvite={props.onInviteFriend}
          onClose={() => setInviteOpen(false)}
          onOpenFriends={() => {
            setInviteOpen(false);
            props.onOpenFriends();
          }}
        />
      )}
    </SetupShell>
  );
}
