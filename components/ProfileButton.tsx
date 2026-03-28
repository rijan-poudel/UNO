'use client';

import { useState, useEffect, useRef } from 'react';
import ProfileChip from './ProfileChip';
const ONLINE_PLAYER_NAME_KEY = 'uno.online.playerName';
const PLAYER_NAME_UPDATED_EVENT = 'uno:player-name-updated';
const FALLBACK_PLAYER_NAME = 'Player 1';

function sanitizePlayerName(value: unknown): string {
  if (typeof value !== 'string') return FALLBACK_PLAYER_NAME;
  const normalized = value.trim().slice(0, 18);
  const lowered = normalized.toLowerCase();
  if (!normalized || lowered === 'null' || lowered === 'undefined') {
    return FALLBACK_PLAYER_NAME;
  }
  return normalized;
}

interface ProfileButtonProps {
  playerName?: string;
  onNameChange?: (name: string) => void;
  onOpenProfileSettings?: () => void;
}

export default function ProfileButton({
  playerName: initialName = FALLBACK_PLAYER_NAME,
  onNameChange,
  onOpenProfileSettings,
}: ProfileButtonProps) {
  const readStoredName = () => {
    try {
      const stored = window.localStorage.getItem(ONLINE_PLAYER_NAME_KEY);
      return sanitizePlayerName(stored);
    } catch {
      return FALLBACK_PLAYER_NAME;
    }
  };

  const [playerName, setPlayerName] = useState(() => sanitizePlayerName(initialName));

  const [isEditing, setIsEditing] = useState(false);
  const [lastSavedName, setLastSavedName] = useState(playerName);
  const inputRef = useRef<HTMLInputElement>(null);

  const persistPlayerName = (nextRaw: string) => {
    const normalized = sanitizePlayerName(nextRaw);
    try {
      window.localStorage.setItem(ONLINE_PLAYER_NAME_KEY, normalized);
      window.dispatchEvent(new CustomEvent(PLAYER_NAME_UPDATED_EVENT, { detail: { name: normalized } }));
    } catch {
      // Ignore storage errors
    }
    setPlayerName(normalized);
    setLastSavedName(normalized);
    onNameChange?.(normalized);
  };

  useEffect(() => {
    const nextInitial = sanitizePlayerName(initialName);
    const nextValue = nextInitial !== FALLBACK_PLAYER_NAME ? nextInitial : readStoredName();
    const timer = window.setTimeout(() => {
      setPlayerName(nextValue);
      setLastSavedName(nextValue);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [initialName]);

  useEffect(() => {
    const syncName = () => {
      const stored = readStoredName();
      setPlayerName(stored);
      setLastSavedName(stored);
    };

    window.addEventListener(PLAYER_NAME_UPDATED_EVENT, syncName as EventListener);
    window.addEventListener('storage', syncName);
    return () => {
      window.removeEventListener(PLAYER_NAME_UPDATED_EVENT, syncName as EventListener);
      window.removeEventListener('storage', syncName);
    };
  }, []);

  const displayName = sanitizePlayerName(playerName);
  const hasChanges = playerName !== lastSavedName;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 12px',
        borderRadius: '4px',
        transition: 'background-color 0.15s',
        cursor: isEditing ? 'default' : 'pointer',
      }}
      onMouseEnter={(e) => {
        if (!isEditing) e.currentTarget.style.background = 'color-mix(in oklab, var(--ui-text) 4%, transparent)';
      }}
      onMouseLeave={(e) => {
        if (!isEditing) e.currentTarget.style.background = 'transparent';
      }}
    >
      {/* Name Input or Display */}
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value.slice(0, 18))}
          onBlur={() => {
            persistPlayerName(playerName);
            setIsEditing(false);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              persistPlayerName(playerName);
              setIsEditing(false);
            }
            if (e.key === 'Escape') {
              setPlayerName(lastSavedName);
              setIsEditing(false);
            }
          }}
          style={{
            fontFamily: "'Courier Prime', monospace",
            fontSize: 13,
            background: 'var(--ui-bg)',
            color: 'var(--ui-text)',
            padding: '6px 8px',
            borderRadius: '3px',
            minWidth: 100,
            transition: 'border-color 0.15s',
            outline: 'none',
            boxShadow: 'none',
          }}
          maxLength={18}
          autoFocus
        />
      ) : (
        <button
          type="button"
          title="Click for more information"
          aria-label="Click for more information"
          onClick={() => {
            if (onOpenProfileSettings) {
              onOpenProfileSettings();
              return;
            }
            setIsEditing(true);
          }}
          style={{
            appearance: 'none',
            border: 'none',
            background: 'transparent',
            padding: 0,
            margin: 0,
            color: 'inherit',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <ProfileChip name={displayName} seed={displayName} />
          {hasChanges && (
            <span style={{ marginLeft: 6, fontSize: 10, color: 'var(--ui-accent-blue)', animation: 'pulse 0.8s infinite' }}>
              saving
            </span>
          )}
        </button>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
