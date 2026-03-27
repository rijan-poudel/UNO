'use client';

import { useState, useEffect, useRef } from 'react';

const ONLINE_PLAYER_NAME_KEY = 'uno.online.playerName';
const AUTO_SAVE_DELAY = 500; // ms

interface PlayerNameEditorProps {
  initialName?: string;
  onNameChange?: (name: string) => void;
}

export default function PlayerNameEditor({
  initialName = 'Player 1',
  onNameChange,
}: PlayerNameEditorProps) {
  const [playerName, setPlayerName] = useState(() => {
    if (initialName && initialName !== 'Player 1') return initialName;
    try {
      const stored = window.localStorage.getItem(ONLINE_PLAYER_NAME_KEY);
      return stored && stored.trim() ? stored.trim().slice(0, 18) : 'Player 1';
    } catch {
      return 'Player 1';
    }
  });

  const [isExpanded, setIsExpanded] = useState(false);
  const [lastSavedName, setLastSavedName] = useState(playerName);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
    }, AUTO_SAVE_DELAY);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [playerName, lastSavedName, onNameChange]);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: Event) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsExpanded(false);
      }
    }
    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isExpanded]);

  const hasChanges = playerName !== lastSavedName;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        right: 14,
        bottom: 20,
        zIndex: 23,
      }}
    >
      <style>{`
        .pne-container {
          display: grid;
          gap: 8px;
          padding: 12px;
          border: 1px solid var(--ui-line);
          background: color-mix(in oklab, var(--ui-surface) 90%, transparent);
          backdrop-filter: blur(8px);
          border-radius: 4px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.14);
          min-width: 200px;
          animation: pne-slide-up 0.2s ease;
        }

        @keyframes pne-slide-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .pne-label {
          font-family: 'Courier Prime', monospace;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.09em;
          text-transform: uppercase;
          color: var(--ui-muted);
          margin: 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .pne-status {
          font-size: 9px;
          letter-spacing: 0.06em;
          color: var(--ui-muted);
        }

        .pne-status.saving {
          color: var(--ui-accent-blue);
          animation: pne-pulse 0.8s ease-in-out infinite;
        }

        .pne-status.saved {
          color: var(--ui-accent-green);
        }

        @keyframes pne-pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }

        .pne-input {
          font-family: 'Courier Prime', monospace;
          font-size: 14px;
          background: var(--ui-bg);
          border: 1px solid var(--ui-line);
          color: var(--ui-text);
          padding: 10px 12px;
          border-radius: 3px;
          transition: border-color 0.15s, box-shadow 0.15s;
          width: 100%;
          box-sizing: border-box;
        }

        .pne-input:focus {
          outline: none;
          border-color: var(--ui-text);
          box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
        }

        .pne-toggle-btn {
          width: 48px;
          height: 48px;
          border: 1px solid var(--ui-line);
          background: transparent;
          color: var(--ui-text);
          cursor: pointer;
          display: grid;
          place-items: center;
          font-size: 20px;
          transition: transform 0.1s, background-color 0.15s, border-color 0.15s;
          position: relative;
        }

        .pne-toggle-btn:hover {
          background: color-mix(in oklab, var(--ui-text) 8%, transparent);
          border-color: var(--ui-text);
          transform: scale(1.05);
        }

        .pne-toggle-btn:active {
          transform: scale(0.98);
        }

        .pne-saving-indicator {
          position: absolute;
          top: 2px;
          right: 2px;
          width: 6px;
          height: 6px;
          background: var(--ui-accent-blue);
          border-radius: 999px;
          animation: pne-pulse 0.8s ease-in-out infinite;
        }

        .pne-saved-indicator {
          position: absolute;
          top: 2px;
          right: 2px;
          width: 6px;
          height: 6px;
          background: var(--ui-accent-green);
          border-radius: 999px;
        }
      `}</style>

      {isExpanded ? (
        <div className="pne-container">
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter your name"
            className="pne-input"
            maxLength={18}
            autoFocus
          />
        </div>
      ) : (
        <button
          className="pne-toggle-btn"
          onClick={() => setIsExpanded(true)}
          title="Edit player name"
          aria-label="Edit player name"
        >
          ✎
          {hasChanges && <span className="pne-saving-indicator" />}
          {!hasChanges && <span className="pne-saved-indicator" />}
        </button>
      )}
    </div>
  );
}
