// Only accepted friends belong in the room's one-tap invite picker.
"use client";
import { useRef, useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import type { FriendProfile } from "../types/multiplayer";
import { toast } from "sonner";
import Modal from "./Modal";
import PlayerAvatar from "./PlayerAvatar";
export default function FriendInvitePicker({
  friends,
  invitedCodes,
  seatedCodes,
  connected,
  onInvite,
  onClose,
  onOpenFriends,
}: {
  friends: FriendProfile[];
  invitedCodes: string[];
  seatedCodes: string[];
  connected: boolean;
  onInvite: (code: string) => Promise<boolean>;
  onClose: () => void;
  onOpenFriends: () => void;
}) {
  const [busy, setBusy] = useState("");
  const pending = useRef(false);
  return (
    <Modal
      title="Invite friends"
      className="friend-picker-modal"
      onClose={onClose}
    >
      {friends.length === 0 ? (
        <>
          <p className="muted">
            Your accepted friends will appear here. Add someone from your room,
            or send them a friend request.
          </p>
          <button className="button secondary" onClick={onOpenFriends}>
            Open Friends
            <ArrowRight size={18} />
          </button>
        </>
      ) : (
        <div className="friend-picker-list">
          {friends.map((friend) => {
            const seated = seatedCodes.includes(friend.friendCode);
            const invited = invitedCodes.includes(friend.friendCode);
            return (
              <div className="friend-row" key={friend.friendCode}>
                <PlayerAvatar
                  seed={friend.friendCode}
                  avatarId={friend.avatarId}
                />
                <div>
                  <strong>{friend.name}</strong>
                  <small>
                    {seated
                      ? "Already here"
                      : friend.status === "offline"
                        ? "Offline"
                        : friend.status === "playing"
                          ? "At a table"
                          : "Online"}
                  </small>
                </div>
                <button
                  className="button secondary small"
                  disabled={
                    !connected ||
                    !!busy ||
                    seated ||
                    invited ||
                    friend.status === "offline"
                  }
                  onClick={async () => {
                    if (pending.current) return;
                    pending.current = true;
                    setBusy(friend.friendCode);
                    try {
                      if (await onInvite(friend.friendCode))
                        toast.success(`Invited ${friend.name}.`);
                    } finally {
                      pending.current = false;
                      setBusy("");
                    }
                  }}
                >
                  {seated ? (
                    "At table"
                  ) : invited ? (
                    <>
                      <Check size={16} />
                      Invited
                    </>
                  ) : busy === friend.friendCode ? (
                    "Sending…"
                  ) : (
                    <>
                      Invite
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
