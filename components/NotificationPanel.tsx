'use client';

import { useState, useEffect, useRef, type ReactNode } from 'react';
import ProfileButton from './ProfileButton';
import { Bell, LogOut, Volume2, VolumeX } from 'lucide-react';
import {
  isMusicEnabledForContext,
  setMusicEnabledForContext,
} from '../lib/audioSettings';

/** Notification object with metadata for display in the notification panel */
export interface Notification {
  id: string;
  type: 'invite' | 'message' | 'status';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
}

/** Props for the NotificationPanel component */
interface NotificationPanelProps {
  themeLabel?: string;
  onSelectTheme?: (themeName: string) => void;
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
  musicContext?: 'lobby' | 'game';
  notifications?: Notification[];
  onNotificationDismiss?: (notificationId: string) => void;
  incomingInviteCount?: number;
}

/**
 * NotificationPanel - Header component with notifications, music toggle, and settings
 * Displays notifications, manages music context settings, and provides quick access to settings menus
 */
export default function NotificationPanel({
  themeLabel = 'Dark',
  onSelectTheme,
  onCycleTheme,
  onOpenControlsSettings,
  onOpenAudioSettings,
  onOpenProfileSettings,
  showLogoLeft = false,
  compact = false,
  showNotificationsButton = true,
  onMenuClick,
  musicEnabled,
  onMusicToggle,
  musicContext = 'lobby',
  notifications = [],
  onNotificationDismiss,
  incomingInviteCount = 0,
}: NotificationPanelProps): ReactNode {
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [showThemeMenu, setShowThemeMenu] = useState<boolean>(false);
  const [lobbyMusicEnabled, setLobbyMusicEnabled] = useState<boolean>(() =>
    typeof window === 'undefined' ? true : isMusicEnabledForContext(musicContext),
  );
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Close notification panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: Event): void => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showNotifications]);

  useEffect(() => {
    const sync = (): void => {
      setLobbyMusicEnabled(isMusicEnabledForContext(musicContext));
    };
    window.addEventListener('uno:audio-settings', sync);
    return () => window.removeEventListener('uno:audio-settings', sync);
  }, [musicContext]);

  const unreadCount = notifications.filter(n => !n.read).length;
  const totalNotifications = incomingInviteCount + unreadCount;
  const effectiveMusicEnabled = typeof musicEnabled === 'boolean' ? musicEnabled : lobbyMusicEnabled;

  const handleMusicToggle = (): void => {
    if (onMusicToggle) {
      onMusicToggle();
      return;
    }
    const next = !effectiveMusicEnabled;
    // Keep lobby and game music states aligned so playback doesn't stop on view transitions.
    setMusicEnabledForContext('lobby', next);
    setMusicEnabledForContext('game', next);
    setLobbyMusicEnabled(next);
  };

  return (
    <div
      style={{
        width: '100%',
        padding: compact ? '6px 12px' : '8px 16px',
        borderBottom: '1px solid var(--ui-line)',
        background: 'var(--ui-bg)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        boxShadow: '0 1px 0 rgba(0, 0, 0, 0.08)',
      }}
    >
      <style>{`
        .np-icon-btn {
          width: ${compact ? '32px' : '34px'};
          height: ${compact ? '32px' : '34px'};
          border: none;
          background: transparent;
          color: var(--ui-text);
          cursor: pointer;
          display: grid;
          place-items: center;
          font-size: 18px;
          transition: background-color 0.12s, transform 0.08s;
          position: relative;
        }

        .np-icon-btn svg {
          width: 16px;
          height: 16px;
          stroke-width: 2.5;
          shape-rendering: geometricPrecision;
        }

        .np-icon-btn:hover {
          background: color-mix(in oklab, var(--ui-text) 8%, transparent);
          transform: translateY(-1px);
        }

        .np-icon-btn:active {
          transform: translateY(0);
        }

        .np-retro-glyph {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 14px;
          height: 14px;
          color: var(--ui-text);
          flex-shrink: 0;
        }

        .np-retro-glyph svg {
          width: 14px;
          height: 14px;
          stroke-width: 2.6;
        }

        .np-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          background: var(--ui-accent-red);
          color: var(--ui-surface);
          font-size: 10px;
          font-weight: 700;
          width: 20px;
          height: 20px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          border: 2px solid var(--ui-surface);
        }

        .np-popup {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 6px;
          background: var(--ui-surface);
          color: var(--ui-text);
          border: 1px solid var(--ui-line);
          border-radius: 4px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
          z-index: 99;
          min-width: 220px;
          animation: np-fade-down 0.16s ease;
        }

        @keyframes np-fade-down {
          from {
            opacity: 0;
            transform: translateY(-6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .np-popup-item {
          padding: 14px 18px;
          color: var(--ui-text);
          border-bottom: 1px solid var(--ui-line);
          cursor: pointer;
          transition: background-color 0.12s;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .np-popup-item:last-child {
          border-bottom: none;
        }

        .np-popup-item:hover {
          background: color-mix(in oklab, var(--ui-text) 4%, transparent);
        }

        .np-popup-header {
          padding: 12px 18px;
          border-bottom: 1px solid var(--ui-line);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: color-mix(in oklab, var(--ui-text) 72%, transparent);
          font-family: 'Courier Prime', monospace;
        }

        .np-empty-state {
          padding: 20px 16px;
          text-align: center;
          color: var(--ui-muted);
          font-size: 12px;
          font-family: 'Courier Prime', monospace;
        }

        .np-notification-item {
          padding: 10px 16px;
          border-bottom: 1px solid var(--ui-line);
          cursor: pointer;
          transition: background-color 0.12s;
        }

        .np-notification-item:hover {
          background: color-mix(in oklab, var(--ui-text) 4%, transparent);
        }

        .np-notification-time {
          font-size: 10px;
          color: var(--ui-muted);
          margin-top: 4px;
          font-family: 'Courier Prime', monospace;
        }

        .np-theme-popup {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 8px;
          background: var(--ui-surface);
          border: 1px solid var(--ui-line);
          border-radius: 6px;
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.24);
          z-index: 100;
          padding: 16px;
          min-width: 320px;
          animation: np-fade-down 0.16s ease;
        }

        .np-theme-popup-title {
          margin: 0 0 12px 0;
          font-family: 'Bebas Neue', cursive;
          font-size: 18px;
          letter-spacing: 0.05em;
          color: var(--ui-text);
          text-transform: uppercase;
        }

        .np-theme-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .np-theme-card {
          padding: 8px;
          border: 2px solid var(--ui-line);
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.15s;
          text-align: center;
          position: relative;
        }

        .np-theme-card:hover {
          border-color: var(--ui-text);
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
        }

        .np-theme-card.active {
          border-color: var(--ui-accent-green);
          border-width: 2px;
          box-shadow: 0 0 0 2px color-mix(in oklab, var(--ui-accent-green) 20%, transparent);
        }

        .np-theme-card-preview {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 3px;
          margin-bottom: 6px;
          border-radius: 3px;
          overflow: hidden;
          height: 24px;
        }

        .np-theme-card-color {
          height: 100%;
          transition: flex 0.12s;
        }

        .np-theme-card-name {
          font-family: 'Courier Prime', monospace;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.06em;
          color: var(--ui-text);
          text-transform: uppercase;
          margin: 0;
        }

        .np-theme-card-checkmark {
          position: absolute;
          top: 1px;
          right: 3px;
          font-size: 12px;
          color: var(--ui-accent-green);
          font-weight: 700;
        }
      `}</style>


      {showLogoLeft ? (
        <h1
          style={{
            margin: 0,
            fontFamily: "'Bebas Neue', cursive",
            fontSize: compact ? 24 : 28,
            letterSpacing: '0.02em',
            lineHeight: 1,
            userSelect: 'none',
          }}
        >
          <span style={{ color: 'var(--ui-accent-red)' }}>U</span>
          <span style={{ color: 'var(--ui-accent-yellow)' }}>N</span>
          <span style={{ color: 'var(--ui-accent-green)' }}>O</span>
        </h1>
      ) : (
        <ProfileButton onOpenProfileSettings={onOpenProfileSettings} />
      )}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {showNotificationsButton ? (
        <div ref={notificationsRef} style={{ position: 'relative' }}>
          <button
            className="np-icon-btn"
            onClick={() => setShowNotifications(!showNotifications)}
            title="Notifications"
          >
            <Bell />
            {totalNotifications > 0 && <span className="np-badge">{totalNotifications}</span>}
          </button>

          {showNotifications && (
            <div className="np-popup" style={{ minWidth: 280 }}>
              <div className="np-popup-header">Notifications</div>
              {incomingInviteCount > 0 && (
                <div className="np-popup-item">
                  <div>
                    <strong>{incomingInviteCount}</strong>&nbsp;
                    {incomingInviteCount === 1 ? 'Game invite' : 'Game invites'} waiting
                  </div>
                </div>
              )}
              {notifications.length > 0 ? (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className="np-notification-item"
                    onClick={() => onNotificationDismiss?.(notif.id)}
                  >
                    <div style={{ fontWeight: notif.read ? 400 : 700 }}>{notif.title}</div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: 'var(--ui-muted)',
                        marginTop: 2,
                      }}
                    >
                      {notif.message}
                    </div>
                    <div className="np-notification-time">
                      {new Date(notif.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))
              ) : (
                <div className="np-empty-state">
                  {incomingInviteCount > 0 ? 'Check the lobby for details' : 'No notifications yet'}
                </div>
              )}
            </div>
          )}
        </div>
      ) : null}

      {/* Lobby Music Toggle */}
      <button
        className="np-icon-btn"
        onClick={handleMusicToggle}
        title={effectiveMusicEnabled ? 'Turn music off' : 'Turn music on'}
        style={{
          color: effectiveMusicEnabled ? 'var(--ui-text)' : 'var(--ui-accent-red)',
        }}
      >
        {effectiveMusicEnabled ? (
          <Volume2 />
        ) : (
          <VolumeX />
        )}
      </button>

      {onMenuClick ? (
        <button
          className="np-icon-btn"
          onClick={onMenuClick}
          title="Exit"
        >
          <LogOut />
        </button>
      ) : null}
    </div>
  );
}
