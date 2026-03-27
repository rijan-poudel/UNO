'use client';

import { useState, useEffect, useRef } from 'react';
const ONLINE_PLAYER_NAME_KEY = 'uno.online.playerName';

interface ProfileButtonProps {
  playerName?: string;
  onNameChange?: (name: string) => void;
  onOpenProfileSettings?: () => void;
}

export default function ProfileButton({
  playerName: initialName = 'Player 1',
  onNameChange,
  onOpenProfileSettings,
}: ProfileButtonProps) {
  const [playerName, setPlayerName] = useState(() => {
    if (initialName && initialName !== 'Player 1') return initialName;
    try {
      const stored = window.localStorage.getItem(ONLINE_PLAYER_NAME_KEY);
      return stored && stored.trim() ? stored.trim().slice(0, 18) : 'Player 1';
    } catch {
      return 'Player 1';
    }
  });

  const [isEditing, setIsEditing] = useState(false);
  const [lastSavedName, setLastSavedName] = useState(playerName);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-save with debounce
  useEffect(() => {
    if (playerName === lastSavedName) return;

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(() => {
      const trimmed = playerName.trim().slice(0, 18) || 'Player 1';
      try {
        window.localStorage.setItem(ONLINE_PLAYER_NAME_KEY, trimmed);
      } catch {
        // Ignore storage errors
      }
      setLastSavedName(trimmed);
      onNameChange?.(trimmed);
    }, 400);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [playerName, lastSavedName, onNameChange]);

  const displayName = playerName.trim().slice(0, 18) || 'Player 1';
  const initial = displayName.charAt(0).toUpperCase();
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
      {/* Avatar */}
      <button
        type="button"
        style={{
          width: 32,
          height: 32,
          borderRadius: '999px',
          background: 'var(--ui-accent-blue)',
          color: 'var(--ui-surface)',
          display: 'grid',
          placeItems: 'center',
          fontFamily: "'Bebas Neue', cursive",
          fontSize: 14,
          fontWeight: 700,
          border: '1px solid var(--ui-line)',
          flexShrink: 0,
        }}
        onClick={() => {
          if (onOpenProfileSettings) {
            onOpenProfileSettings();
            return;
          }
          setIsEditing(true);
        }}
      >
        {initial}
      </button>

      {/* Name Input or Display */}
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          onBlur={() => setIsEditing(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') setIsEditing(false);
            if (e.key === 'Escape') {
              setPlayerName(lastSavedName);
              setIsEditing(false);
            }
          }}
          style={{
            fontFamily: "'Courier Prime', monospace",
            fontSize: 13,
            background: 'var(--ui-bg)',
            border: '1px solid var(--ui-text)',
            color: 'var(--ui-text)',
            padding: '6px 8px',
            borderRadius: '3px',
            minWidth: 100,
            transition: 'border-color 0.15s',
          }}
          maxLength={18}
          autoFocus
        />
      ) : (
        <div
          onClick={() => setIsEditing(true)}
          style={{
            fontFamily: "'Bebas Neue', cursive",
            fontSize: 14,
            letterSpacing: '0.03em',
            color: 'var(--ui-text)',
          }}
        >
          {displayName}
          {hasChanges && (
            <span style={{ marginLeft: 6, fontSize: 10, color: 'var(--ui-accent-blue)', animation: 'pulse 0.8s infinite' }}>
              saving
            </span>
          )}
        </div>
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
