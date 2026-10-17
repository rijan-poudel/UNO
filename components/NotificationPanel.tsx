// Shared app header and invitation inbox.
"use client";
import { useState } from "react";
import { Bell, Check, Settings, X } from "lucide-react";
import type { FriendInvite } from "../types/multiplayer";
import { UnoWordmark } from "./ui/PageChrome";
import Modal from "./Modal";

export interface Notification {
  id: string;
  type: "invite" | "message" | "status";
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
}
interface Props {
  themeLabel?: string;
  onSelectTheme?: (theme: string) => void;
  onCycleTheme?: () => void;
  onOpenControlsSettings?: () => void;
  onOpenAudioSettings?: () => void;
  onOpenProfileSettings?: () => void;
  showLogoLeft?: boolean;
  compact?: boolean;
  showNotificationsButton?: boolean;
  onMenuClick?: () => void;
  musicEnabled?: boolean;
  onMusicToggle?: () => void;
  musicContext?: "lobby" | "game";
  notifications?: Notification[];
  onNotificationDismiss?: (id: string) => void;
  incomingInviteCount?: number;
  incomingInvites?: FriendInvite[];
  onAcceptFriendInvite?: (id: string) => Promise<boolean>;
  onDeclineFriendInvite?: (id: string) => Promise<boolean>;
}
export default function NotificationPanel({
  onOpenControlsSettings,
  onMenuClick,
  showNotificationsButton = true,
  incomingInviteCount = 0,
  incomingInvites = [],
  onAcceptFriendInvite,
  onDeclineFriendInvite,
  notifications = [],
  onNotificationDismiss,
}: Props) {
  const [inbox, setInbox] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const count =
    incomingInviteCount + notifications.filter((n) => !n.read).length;
  const act = async (id: string, fn?: (id: string) => Promise<boolean>) => {
    if (!fn) return;
    setBusy(id);
    try {
      await fn(id);
    } finally {
      setBusy(null);
    }
  };
  return (
    <>
      <header className="app-header">
        <div className="header-brand">
          <UnoWordmark compact />
        </div>
        <nav className="header-actions" aria-label="Game preferences">
          {showNotificationsButton && count > 0 && (
            <button
              className="icon-button"
              aria-label={`Invitations${count ? `, ${count} new` : ""}`}
              onClick={() => setInbox(true)}
            >
              <Bell size={19} />
              {count > 0 && <span className="notification-dot">{count}</span>}
            </button>
          )}
          <button
            className="button secondary small settings-trigger"
            aria-label="Settings"
            onClick={onMenuClick ?? onOpenControlsSettings}
          >
            <Settings size={17} />
            <span>Settings</span>
          </button>
        </nav>
      </header>
      {inbox && (
        <Modal title="Your invitations" onClose={() => setInbox(false)}>
          {incomingInvites.length === 0 && notifications.length === 0 && (
            <p className="empty-copy">
              No invitations just yet. Open a friends’ room to invite someone.
            </p>
          )}
          {incomingInvites.map((invite) => (
            <div className="invite-row" key={invite.inviteId}>
              <div>
                <strong>{invite.fromName}</strong>
                <p>Invited you to their table</p>
              </div>
              <button
                className="icon-button"
                aria-label={`Decline ${invite.fromName}'s invitation`}
                disabled={busy === invite.inviteId || !onDeclineFriendInvite}
                onClick={() => void act(invite.inviteId, onDeclineFriendInvite)}
              >
                <X size={18} />
              </button>
              <button
                className="button primary small"
                disabled={busy === invite.inviteId || !onAcceptFriendInvite}
                onClick={() => void act(invite.inviteId, onAcceptFriendInvite)}
              >
                <Check size={16} /> Join
              </button>
            </div>
          ))}
          {notifications.map((n) => (
            <div className="invite-row" key={n.id}>
              <div>
                <strong>{n.title}</strong>
                <p>{n.message}</p>
              </div>
              <button
                className="icon-button"
                aria-label="Dismiss notification"
                onClick={() => onNotificationDismiss?.(n.id)}
              >
                <X size={18} />
              </button>
            </div>
          ))}
        </Modal>
      )}
    </>
  );
}
