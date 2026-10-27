// One quiet entry point for identity, friends, and game preferences.
"use client";
import { useId, useRef, useSyncExternalStore } from "react";
import { ArrowRight, Settings, UserRound, Users } from "lucide-react";
import { getPlayerAvatar, subscribePlayerAvatar } from "../lib/playerAvatars";
import { getPlayerName, subscribePlayerName } from "../lib/playerNames";
import PlayerAvatar from "./PlayerAvatar";

export interface ProfileMenuProps {
  onOpenProfile: () => void;
  onOpenFriends: () => void;
  onOpenSettings: () => void;
  notificationCount?: number;
}
export default function ProfileMenu({
  onOpenProfile,
  onOpenFriends,
  onOpenSettings,
  notificationCount = 0,
}: ProfileMenuProps) {
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const avatar = useSyncExternalStore(
    subscribePlayerAvatar,
    getPlayerAvatar,
    () => "initials" as const,
  );
  const name = useSyncExternalStore(
    subscribePlayerName,
    getPlayerName,
    () => "You",
  );
  const open = (action: () => void) => {
    ref.current?.hidePopover();
    trigger.current?.focus({ preventScroll: true });
    action();
  };
  return (
    <div className="profile-menu">
      <button
        ref={trigger}
        type="button"
        className="profile-menu-trigger"
        popoverTarget={id}
        aria-label={
          notificationCount
            ? `Open profile menu, ${notificationCount} new`
            : "Open profile menu"
        }
      >
        <PlayerAvatar seed="profile-menu" avatarId={avatar} />
        {notificationCount > 0 && (
          <span className="profile-menu-badge" aria-hidden="true">
            {notificationCount > 9 ? "9+" : notificationCount}
          </span>
        )}
      </button>
      <div popover="auto" id={id} ref={ref} className="profile-popover">
        <div className="profile-popover-identity">
          <PlayerAvatar seed="profile" avatarId={avatar} />
          <strong>{name}</strong>
        </div>
        <nav aria-label="Your account">
          <button onClick={() => open(onOpenProfile)}>
            <UserRound size={18} />
            Edit profile
            <ArrowRight size={16} />
          </button>
          <button onClick={() => open(onOpenFriends)}>
            <Users size={18} />
            Friends
            {notificationCount > 0 && (
              <span className="count-badge">{notificationCount}</span>
            )}
            <ArrowRight size={16} />
          </button>
          <button onClick={() => open(onOpenSettings)}>
            <Settings size={18} />
            Game settings
            <ArrowRight size={16} />
          </button>
        </nav>
      </div>
    </div>
  );
}
