// Actionable invitations remain visible without interrupting the current screen.
"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, Users, X } from "lucide-react";
import type { FriendInvite, FriendRequest } from "../types/multiplayer";
import { playTableChime } from "../lib/tableChimes";
import { toast } from "sonner";

export default function InvitationNotifications({
  invites,
  requests,
  connected,
  suspended = false,
  onAccept,
  onDecline,
  onOpenFriends,
}: {
  invites: FriendInvite[];
  requests: FriendRequest[];
  connected: boolean;
  suspended?: boolean;
  onAccept: (id: string) => Promise<boolean>;
  onDecline: (id: string) => Promise<boolean>;
  onOpenFriends: () => void;
}) {
  const seen = useRef(new Set<string>());
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [busy, setBusy] = useState<{ id: string; accepting: boolean } | null>(
    null,
  );
  const pending = useRef(false);
  const [host, setHost] = useState<HTMLElement | null>(null);
  const active =
    !suspended &&
    invites.some((invite) => !dismissed.includes(invite.inviteId));
  useEffect(() => {
    if (!active) return;
    const update = () =>
      setHost(
        Array.from(
          document.querySelectorAll<HTMLDialogElement>("dialog[open]"),
        ).at(-1) ?? document.body,
      );
    const observer = new MutationObserver(update);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["open"],
    });
    const frame = requestAnimationFrame(update);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [active]);
  useEffect(() => {
    let fresh = false;
    const currentIds = new Set([
      ...invites.map((invite) => invite.inviteId),
      ...requests.map((request) => request.requestId),
    ]);
    seen.current = new Set(
      [...seen.current].filter((id) => currentIds.has(id)),
    );
    for (const invite of invites)
      if (!seen.current.has(invite.inviteId)) {
        seen.current.add(invite.inviteId);
        fresh = true;
      }
    for (const request of requests)
      if (!seen.current.has(request.requestId)) {
        seen.current.add(request.requestId);
        fresh = true;
        toast.message(`${request.from.name} sent a friend request`, {
          action: { label: "View", onClick: onOpenFriends },
        });
      }
    if (fresh) playTableChime("notification");
  }, [invites, requests, onOpenFriends]);
  const act = async (id: string, accepting: boolean) => {
    if (pending.current) return;
    pending.current = true;
    setBusy({ id, accepting });
    try {
      if (await (accepting ? onAccept(id) : onDecline(id)))
        setDismissed((current) => [
          ...current.filter((entry) =>
            invites.some((invite) => invite.inviteId === entry),
          ),
          id,
        ]);
    } catch {
      toast.error("Couldn’t update that invitation. Please try again.");
    } finally {
      pending.current = false;
      setBusy(null);
    }
  };
  const visible = suspended
    ? []
    : invites
        .filter((invite) => !dismissed.includes(invite.inviteId))
        .slice(0, 2);
  if (!visible.length || !host) return null;
  return createPortal(
    <aside
      className="invitation-notices"
      aria-label="Room invitations"
      aria-live="polite"
    >
      {visible.map((invite) => (
        <section className="invite-notice" key={invite.inviteId}>
          <button
            className="icon-button invite-notice-close"
            aria-label="Dismiss invitation popup"
            onClick={() =>
              setDismissed((current) => [
                ...current.filter((entry) =>
                  invites.some((item) => item.inviteId === entry),
                ),
                invite.inviteId,
              ])
            }
          >
            <X size={16} />
          </button>
          <Users size={22} aria-hidden="true" />
          <div>
            <strong>{invite.fromName} invited you</strong>
            <p>
              Room {invite.roomId}
              {!connected && " · Reconnecting…"}
            </p>
          </div>
          <div className="invite-notice-actions">
            <button
              className="button secondary small"
              aria-label={`Decline invitation from ${invite.fromName}`}
              disabled={!!busy || !connected}
              onClick={() => void act(invite.inviteId, false)}
            >
              {busy?.id === invite.inviteId && !busy.accepting
                ? "Declining…"
                : "Decline"}
            </button>
            <button
              className="button primary small"
              aria-label={`Accept invitation from ${invite.fromName}`}
              disabled={!!busy || !connected}
              onClick={() => void act(invite.inviteId, true)}
            >
              {busy?.id === invite.inviteId && busy.accepting
                ? "Joining…"
                : "Accept"}
              <ArrowRight size={17} />
            </button>
          </div>
        </section>
      ))}
    </aside>,
    host,
  );
}
