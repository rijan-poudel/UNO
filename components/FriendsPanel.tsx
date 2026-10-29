// Friendship is accepted explicitly; a room invitation never creates a friendship.
"use client";
import { useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  Copy,
  LoaderCircle,
  UserPlus,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { FriendInvite, SocialSnapshot } from "../types/multiplayer";
import PlayerAvatar from "./PlayerAvatar";

export interface FriendsPanelProps {
  social: SocialSnapshot;
  friendCode: string;
  connected: boolean;
  incomingInvites: FriendInvite[];
  canInvite: boolean;
  seatedCodes: string[];
  invitedCodes?: string[];
  onRequest: (code: string) => Promise<boolean>;
  onRespond: (id: string, accept: boolean) => Promise<boolean>;
  onRemove: (code: string) => Promise<boolean>;
  onInvite: (code: string) => Promise<boolean>;
  onAcceptInvite: (id: string) => Promise<boolean>;
  onDeclineInvite: (id: string) => Promise<boolean>;
}
export default function FriendsPanel(props: FriendsPanelProps) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState("");
  const pending = useRef(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const removeTrigger = useRef<HTMLButtonElement | null>(null);
  const removeDecision = useRef<HTMLButtonElement>(null);
  const friendsHeading = useRef<HTMLHeadingElement>(null);
  const [manualCopy, setManualCopy] = useState(false);
  const cancelRemoval = () => {
    setRemoving(null);
    removeTrigger.current?.focus({ preventScroll: true });
  };
  const run = async (key: string, action: () => Promise<boolean>) => {
    if (pending.current) return false;
    pending.current = true;
    setBusy(key);
    try {
      return await action();
    } catch {
      toast.error("That didn’t go through. Please try again.");
      return false;
    } finally {
      pending.current = false;
      setBusy("");
    }
  };
  return (
    <div
      className="friends-panel"
      onKeyDown={(event) => {
        if (event.key === "Escape" && removing) {
          event.preventDefault();
          event.stopPropagation();
          if (!pending.current) cancelRemoval();
        }
      }}
    >
      {!props.connected && (
        <p role="status" className="muted">
          Reconnecting…
        </p>
      )}
      <section aria-label="Add a friend">
        <h3>Add a friend</h3>
        <form
          className="friend-add-form"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!props.connected || code.length < 4) return;
            const submittedCode = code;
            if (await run("request", () => props.onRequest(submittedCode))) {
              setCode((current) => (current === submittedCode ? "" : current));
              toast.success("Friend request sent.");
            }
          }}
        >
          <label className="sr-only" htmlFor="add-friend-code">
            Their friend code
          </label>
          <input
            id="add-friend-code"
            value={code}
            placeholder="Their friend code"
            autoCapitalize="characters"
            autoComplete="off"
            maxLength={8}
            onChange={(e) =>
              setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))
            }
          />
          <button
            className="button primary small"
            disabled={!props.connected || !!busy || code.length < 4}
            aria-busy={busy === "request"}
          >
            <UserPlus size={18} />
            {busy === "request" ? "Sending…" : "Send request"}
          </button>
        </form>
        <div className="friend-own-code">
          <span className="muted">Your code</span>
          <button
            className="text-button"
            disabled={!props.friendCode}
            aria-label={`Copy friend code ${props.friendCode}`}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(props.friendCode);
                toast.success("Friend code copied.");
              } catch {
                setManualCopy(true);
              }
            }}
          >
            {props.friendCode}
            <Copy size={16} />
          </button>
        </div>
        {manualCopy && (
          <input
            autoFocus
            readOnly
            value={props.friendCode}
            aria-label="Your friend code"
            onFocus={(e) => e.target.select()}
          />
        )}
      </section>
      {props.incomingInvites.length > 0 && (
        <section aria-label="Room invitations">
          <h3>Room invitations</h3>
          {props.incomingInvites.map((invite) => (
            <div className="friend-row" key={invite.inviteId}>
              <div>
                <strong>{invite.fromName}</strong>
                <small>Room {invite.roomId}</small>
              </div>
              <button
                className="icon-button"
                aria-label={`Decline invitation from ${invite.fromName}`}
                disabled={!!busy || !props.connected}
                onClick={() =>
                  void run(`decline-invite:${invite.inviteId}`, () =>
                    props.onDeclineInvite(invite.inviteId),
                  )
                }
              >
                {busy === `decline-invite:${invite.inviteId}` ? (
                  <LoaderCircle size={18} className="animate-spin" />
                ) : (
                  <X size={18} />
                )}
              </button>
              <button
                className="button primary small"
                aria-label={`Accept invitation from ${invite.fromName}`}
                disabled={!!busy || !props.connected}
                onClick={() =>
                  void run(`accept-invite:${invite.inviteId}`, () =>
                    props.onAcceptInvite(invite.inviteId),
                  )
                }
              >
                {busy === `accept-invite:${invite.inviteId}`
                  ? "Joining…"
                  : "Accept"}
                <ArrowRight size={16} />
              </button>
            </div>
          ))}
        </section>
      )}
      {props.social.incomingRequests.length > 0 && (
        <section aria-label="Friend requests">
          <h3>
            Friend requests{" "}
            <span className="count-badge">
              {props.social.incomingRequests.length}
            </span>
          </h3>
          {props.social.incomingRequests.map((request) => (
            <div className="friend-row" key={request.requestId}>
              <PlayerAvatar
                seed={request.from.friendCode}
                avatarId={request.from.avatarId}
              />
              <div>
                <strong>{request.from.name}</strong>
              </div>
              <button
                className="icon-button"
                aria-label={`Decline ${request.from.name}'s friend request`}
                disabled={!!busy || !props.connected}
                onClick={() =>
                  void run(`decline-request:${request.requestId}`, () =>
                    props.onRespond(request.requestId, false),
                  )
                }
              >
                {busy === `decline-request:${request.requestId}` ? (
                  <LoaderCircle size={18} className="animate-spin" />
                ) : (
                  <X size={18} />
                )}
              </button>
              <button
                className="button primary small"
                aria-label={`Accept ${request.from.name}'s friend request`}
                disabled={!!busy || !props.connected}
                onClick={() =>
                  void run(`accept-request:${request.requestId}`, () =>
                    props.onRespond(request.requestId, true),
                  )
                }
              >
                <Check size={16} />
                {busy === `accept-request:${request.requestId}`
                  ? "Accepting…"
                  : "Accept"}
              </button>
            </div>
          ))}
        </section>
      )}
      <section aria-label="Your friends">
        <h3 ref={friendsHeading} tabIndex={-1}>
          Your friends{" "}
          <span className="muted">{props.social.friends.length}</span>
        </h3>
        {props.social.friends.length === 0 && (
          <p className="empty-copy">
            Add a friend with their code, or from your room.
          </p>
        )}
        {props.social.friends.map((friend) => (
          <div key={friend.friendCode}>
            <div className="friend-row">
              <PlayerAvatar
                seed={friend.friendCode}
                avatarId={friend.avatarId}
              />
              <div>
                <strong>{friend.name}</strong>
                <small>
                  <i
                    className={`presence-dot ${friend.status === "offline" ? "offline" : "online"}`}
                  />
                  {friend.status === "playing"
                    ? "At a table"
                    : friend.status === "online"
                      ? "Online"
                      : "Offline"}
                </small>
              </div>
              <button
                className="icon-button"
                aria-label={`Remove ${friend.name} from friends`}
                disabled={!!busy || !props.connected}
                aria-expanded={removing === friend.friendCode}
                onClick={(event) => {
                  removeTrigger.current = event.currentTarget;
                  setRemoving(friend.friendCode);
                }}
              >
                <X size={16} />
              </button>
              {props.canInvite && (
                <button
                  className="button secondary small"
                  aria-label={
                    props.seatedCodes.includes(friend.friendCode)
                      ? `${friend.name} is at your table`
                      : props.invitedCodes?.includes(friend.friendCode)
                        ? `Invitation sent to ${friend.name}`
                        : `Invite ${friend.name}`
                  }
                  disabled={
                    !!busy ||
                    !props.connected ||
                    friend.status === "offline" ||
                    props.invitedCodes?.includes(friend.friendCode) ||
                    props.seatedCodes.includes(friend.friendCode)
                  }
                  onClick={async () => {
                    if (
                      await run(`invite:${friend.friendCode}`, () =>
                        props.onInvite(friend.friendCode),
                      )
                    )
                      toast.success(`Invited ${friend.name}.`);
                  }}
                >
                  {props.seatedCodes.includes(friend.friendCode)
                    ? "At table"
                    : props.invitedCodes?.includes(friend.friendCode)
                      ? "Invited"
                      : busy === `invite:${friend.friendCode}`
                        ? "Sending…"
                        : "Invite"}
                  <ArrowRight size={16} />
                </button>
              )}
            </div>
            {removing === friend.friendCode && (
              <div
                className="friend-remove-confirm"
                role="group"
                aria-label={`Remove ${friend.name} from friends?`}
              >
                <p>
                  Remove <strong>{friend.name}</strong> from friends?
                </p>
                <div>
                  <button
                    className="button secondary small"
                    autoFocus
                    disabled={!!busy}
                    onClick={cancelRemoval}
                  >
                    Keep friend
                  </button>
                  <button
                    ref={removeDecision}
                    className="button secondary small"
                    disabled={!!busy || !props.connected}
                    aria-busy={busy === `remove:${friend.friendCode}`}
                    onClick={async () => {
                      if (
                        await run(`remove:${friend.friendCode}`, () =>
                          props.onRemove(friend.friendCode),
                        )
                      ) {
                        setRemoving(null);
                        friendsHeading.current?.focus({ preventScroll: true });
                        toast.success(`Removed ${friend.name} from friends.`);
                      } else {
                        requestAnimationFrame(() =>
                          removeDecision.current?.focus({
                            preventScroll: true,
                          }),
                        );
                      }
                    }}
                  >
                    {busy === `remove:${friend.friendCode}`
                      ? "Removing…"
                      : "Remove friend"}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </section>
      {props.social.outgoingRequests.length > 0 && (
        <section aria-label="Sent friend requests">
          <h3>Sent requests</h3>
          {props.social.outgoingRequests.map((request) => (
            <div className="friend-row" key={request.requestId}>
              <PlayerAvatar
                seed={request.to.friendCode}
                avatarId={request.to.avatarId}
              />
              <div>
                <strong>{request.to.name}</strong>
              </div>
              <span className="muted">Pending</span>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
