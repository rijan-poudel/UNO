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
  onAccept,
  onDecline,
  onOpenFriends,
}: {
  invites: FriendInvite[];
  requests: FriendRequest[];
  connected: boolean;
  onAccept: (id: string) => Promise<boolean>;
  onDecline: (id: string) => Promise<boolean>;
  onOpenFriends: () => void;
}) {
  const seen = useRef(new Set<string>());
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [busy, setBusy] = useState("");
  const pending = useRef(false);
  const [host, setHost] = useState<HTMLElement | null>(null);
  const active = invites.some((invite) => !dismissed.includes(invite.inviteId));
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
  const act = async (id: string, action: (id: string) => Promise<boolean>) => {
    if (pending.current) return;
    pending.current = true;
    setBusy(id);
    try {
      if (await action(id)) setDismissed((current) => [...current, id]);
    } finally {
      pending.current = false;
      setBusy("");
    }
  };
  const visible = invites
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
              setDismissed((current) => [...current, invite.inviteId])
            }
          >
            <X size={16} />
          </button>
          <Users size={22} aria-hidden="true" />
          <div>
            <strong>{invite.fromName} saved you a seat</strong>
            <p>Join room {invite.roomId}?</p>
          </div>
          <div className="invite-notice-actions">
            <button
              className="button secondary small"
              disabled={!!busy || !connected}
              onClick={() => void act(invite.inviteId, onDecline)}
            >
              Decline
            </button>
            <button
              className="button primary small"
              disabled={!!busy || !connected}
              onClick={() => void act(invite.inviteId, onAccept)}
            >
              {busy === invite.inviteId ? "Joining…" : "Accept"}
              <ArrowRight size={17} />
            </button>
          </div>
        </section>
      ))}
    </aside>,
    host,
  );
}
