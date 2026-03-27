'use client';

import { useState, useEffect, useRef } from 'react';
import ProfileButton from './ProfileButton';
import {
  isMusicEnabledForContext,
  setMusicEnabledForContext,
} from '../lib/audioSettings';

export interface Notification {
  id: string;
  type: 'invite' | 'message' | 'status';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
}

interface NotificationPanelProps {
  themeLabel?: string;
  onSelectTheme?: (themeName: string) => void;
  onSettings?: () => void;
  notifications?: Notification[];
  onNotificationDismiss?: (notificationId: string) => void;
  incomingInviteCount?: number;
}

export default function NotificationPanel({
  themeLabel = 'Dark',
  onSelectTheme,
  onSettings,
  notifications = [],
  onNotificationDismiss,
  incomingInviteCount = 0,
}: NotificationPanelProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showThemeOptions, setShowThemeOptions] = useState(false);
  const [lobbyMusicEnabled, setLobbyMusicEnabled] = useState<boolean>(() =>
    typeof window === 'undefined' ? true : isMusicEnabledForContext('lobby'),
  );
  const notificationsRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);

  // Close notification panel when clicking outside
  useEffect(() => {
    function handleClickOutside(e: Event) {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    }
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showNotifications]);

  // Close theme menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e: Event) {
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) {
        setShowThemeMenu(false);
        setShowThemeOptions(false);
      }
    }
    if (showThemeMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showThemeMenu]);

  useEffect(() => {
    const sync = () => {
      setLobbyMusicEnabled(isMusicEnabledForContext('lobby'));
    };
    window.addEventListener('uno:audio-settings', sync);
    return () => window.removeEventListener('uno:audio-settings', sync);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;
  const totalNotifications = incomingInviteCount + unreadCount;

  return (
    <div
      style={{
        width: '100%',
        padding: '12px 20px',
        borderBottom: '1px solid var(--ui-line)',
        background: 'var(--ui-surface)',
        display: 'grid',
        gridTemplateColumns: 'auto 1fr auto auto auto',
        alignItems: 'center',
        gap: 16,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
      }}
    >
      <style>{`
        .np-icon-btn {
          width: 36px;
          height: 36px;
          border: 1px solid var(--ui-line);
          background: transparent;
          color: var(--ui-text);
          cursor: pointer;
          display: grid;
          place-items: center;
          font-size: 18px;
          transition: background-color 0.15s, border-color 0.15s, transform 0.1s;
          position: relative;
        }

        .np-icon-btn:hover {
          background: color-mix(in oklab, var(--ui-text) 8%, transparent);
          border-color: var(--ui-text);
          transform: scale(1.05);
        }

        .np-icon-btn:active {
          transform: scale(0.98);
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
          padding: 12px 16px;
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
          padding: 10px 16px;
          border-bottom: 1px solid var(--ui-line);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--ui-muted);
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


      {/* Profile Button */}
      <ProfileButton />

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Notification Icon */}
      <div ref={notificationsRef} style={{ position: 'relative' }}>
        <button
          className="np-icon-btn"
          onClick={() => setShowNotifications(!showNotifications)}
          title="Notifications"
        >
          🔔
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
                  onClick={() => {
                    onNotificationDismiss?.(notif.id);
                  }}
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

      {/* Lobby Music Toggle */}
      <button
        className="np-icon-btn"
        onClick={() => {
          const next = !lobbyMusicEnabled;
          setMusicEnabledForContext('lobby', next);
          setLobbyMusicEnabled(next);
        }}
        title={lobbyMusicEnabled ? 'Turn lobby music off' : 'Turn lobby music on'}
        style={{
          color: lobbyMusicEnabled ? 'var(--ui-text)' : 'var(--ui-accent-red)',
        }}
      >
        {lobbyMusicEnabled ? '🔊' : '🔇'}
      </button>

      {/* Settings Icon */}
      <div ref={themeRef} style={{ position: 'relative' }}>
        <button
          className="np-icon-btn"
          onClick={() => {
            setShowThemeMenu(!showThemeMenu);
            if (showThemeMenu) {
              setShowThemeOptions(false);
            }
          }}
          title="Settings"
        >
          ⚙️
        </button>

        {showThemeMenu && (
          <div className="np-popup" style={{ minWidth: 240 }}>
            <div className="np-popup-header">Settings</div>

            <div
              className="np-popup-item"
              onClick={() => {
                setShowThemeOptions(!showThemeOptions);
              }}
            >
              <span>Theme</span>
              <span style={{ color: 'var(--ui-muted)' }}>{showThemeOptions ? '▴' : '▾'}</span>
            </div>

            {showThemeOptions && (
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--ui-line)' }}>
                <div className="np-theme-grid">
                  {[
                    { name: 'Light', id: 'paper', colors: ['#fafafa', '#ffffff'] },
                    { name: 'Dark', id: 'midnight', colors: ['#121212', '#1e1e1e'] },
                    { name: 'Teal', id: 'forest', colors: ['#e0f2f1', '#ffffff'] },
                    { name: 'Purple', id: 'sunset', colors: ['#1a0033', '#2d0057'] },
                  ].map((theme) => (
                    <div
                      key={theme.id}
                      className={`np-theme-card ${theme.name === themeLabel ? 'active' : ''}`}
                      onClick={() => {
                        onSelectTheme?.(theme.id);
                        setShowThemeOptions(false);
                        setShowThemeMenu(false);
                      }}
                    >
                      <div className="np-theme-card-preview">
                        {theme.colors.map((color, idx) => (
                          <div
                            key={idx}
                            className="np-theme-card-color"
                            style={{ background: color }}
                          />
                        ))}
                      </div>
                      <p className="np-theme-card-name">{theme.name}</p>
                      {theme.name === themeLabel && (
                        <div className="np-theme-card-checkmark">✓</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Controls Option */}
            <div
              className="np-popup-item"
              onClick={() => {
                onSettings?.();
                setShowThemeOptions(false);
                setShowThemeMenu(false);
              }}
            >
              <span>Controls</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
