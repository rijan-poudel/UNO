'use client';

import { useEffect, useState } from 'react';
import type { GameRules } from '../types/rules';
import { useUnoGame } from '../hooks/useUnoGame';
import { useUnoOnlineGame } from '../hooks/useUnoOnlineGame';
import GameBoard from '../components/GameBoard';
import OnlineLobby from '../components/OnlineLobby';
import SettingsModal from '../components/SettingsModal';
import { toast } from 'sonner';

const SHARED_RULES_KEY = 'uno.shared.rules';
const PREFERRED_THEME_KEY = 'uno.preferred.theme';

type ThemeName = 'paper' | 'midnight' | 'forest' | 'sunset';

const THEMES: Record<ThemeName, {
  label: string;
  vars: Record<string, string>;
}> = {
  paper: {
    label: 'Light',
    vars: {
      '--ui-bg': '#fafafa',
      '--ui-surface': '#ffffff',
      '--ui-text': '#212121',
      '--ui-muted': 'rgba(33,33,33,0.54)',
      '--ui-line': 'rgba(0,0,0,0.12)',
      '--ui-accent-red': '#e53935',
      '--ui-accent-yellow': '#f9a825',
      '--ui-accent-green': '#43a047',
      '--ui-accent-blue': '#1e88e5',
    },
  },
  midnight: {
    label: 'Dark',
    vars: {
      '--ui-bg': '#121212',
      '--ui-surface': '#1e1e1e',
      '--ui-text': '#e0e0e0',
      '--ui-muted': 'rgba(224,224,224,0.6)',
      '--ui-line': 'rgba(255,255,255,0.12)',
      '--ui-accent-red': '#ef5350',
      '--ui-accent-yellow': '#fdd835',
      '--ui-accent-green': '#66bb6a',
      '--ui-accent-blue': '#42a5f5',
    },
  },
  forest: {
    label: 'Teal',
    vars: {
      '--ui-bg': '#e0f2f1',
      '--ui-surface': '#ffffff',
      '--ui-text': '#004d40',
      '--ui-muted': 'rgba(0,77,64,0.6)',
      '--ui-line': 'rgba(0,77,64,0.15)',
      '--ui-accent-red': '#e53935',
      '--ui-accent-yellow': '#f9a825',
      '--ui-accent-green': '#00897b',
      '--ui-accent-blue': '#1e88e5',
    },
  },
  sunset: {
    label: 'Purple',
    vars: {
      '--ui-bg': '#1a0033',
      '--ui-surface': '#2d0057',
      '--ui-text': '#ede7f6',
      '--ui-muted': 'rgba(237,231,246,0.65)',
      '--ui-line': 'rgba(237,231,246,0.18)',
      '--ui-accent-red': '#ef9a9a',
      '--ui-accent-yellow': '#fff59d',
      '--ui-accent-green': '#a5d6a7',
      '--ui-accent-blue': '#ce93d8',
    },
  },
};

const DEFAULT_SHARED_RULES: Partial<GameRules> = {
  stackDraw2: false,
  stackWild4: false,
  allowWild4OnDraw2: false,
  drawUntilPlayable: false,
  reverseActsAsSkipInTwoPlayer: true,
  mustDeclareUno: true,
  allowStartingActionCard: true,
  allowDoublePlaySameNumber: false,
  maxPlayers: 4,
};

function getInitialSharedRules(): Partial<GameRules> {
  if (typeof window === 'undefined') return DEFAULT_SHARED_RULES;
  try {
    const raw = window.localStorage.getItem(SHARED_RULES_KEY);
    if (!raw) return DEFAULT_SHARED_RULES;
    const parsed = JSON.parse(raw) as Partial<GameRules>;
    return { ...DEFAULT_SHARED_RULES, ...parsed };
  } catch {
    return DEFAULT_SHARED_RULES;
  }
}

function getInitialTheme(): ThemeName {
  if (typeof window === 'undefined') return 'paper';
  try {
    const raw = window.localStorage.getItem(PREFERRED_THEME_KEY);
    return raw === 'midnight' || raw === 'forest' || raw === 'sunset' ? raw : 'paper';
  } catch {
    return 'paper';
  }
}

/**
 * Root page — decides whether to show the pre-game setup screen
 * or the live game board.  A single useUnoGame() call at the top
 * level ensures both children share the same state instance.
 */
export default function Home() {
  const [activeGameMode, setActiveGameMode] = useState<'online' | 'computer'>('online');
  const [theme, setTheme] = useState<ThemeName>(getInitialTheme);
  const [showSettings, setShowSettings] = useState(false);
  const [sharedRules, setSharedRules] = useState<Partial<GameRules>>(getInitialSharedRules);

  const localGameApi = useUnoGame();
  const onlineGameApi = useUnoOnlineGame();
  const gameApi = activeGameMode === 'computer' ? localGameApi : onlineGameApi;

  useEffect(() => {
    try {
      window.localStorage.setItem(SHARED_RULES_KEY, JSON.stringify(sharedRules));
    } catch {
      // Ignore storage errors.
    }
  }, [sharedRules]);

  useEffect(() => {
    try {
      window.localStorage.setItem(PREFERRED_THEME_KEY, theme);
    } catch {
      // Ignore storage errors.
    }

    const root = document.documentElement;
    const vars = THEMES[theme].vars;
    for (const [name, value] of Object.entries(vars)) {
      root.style.setProperty(name, value);
    }
  }, [theme]);

  const cycleTheme = () => {
    const order: ThemeName[] = ['paper', 'midnight', 'forest', 'sunset'];
    const idx = order.indexOf(theme);
    setTheme(order[(idx + 1) % order.length]);
  };

  const copyFriendCode = async () => {
    if (!onlineGameApi.friendCode) return;
    try {
      await navigator.clipboard.writeText(onlineGameApi.friendCode);
      toast.success('Friend code copied.');
    } catch {
      toast.error('Could not copy friend code.');
    }
  };

  const setupControls = (
    <div className="setup-top-controls">
      <style>{`
        .setup-top-controls {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 28px;
        }
        .setup-top-friend {
          width: fit-content;
          min-width: 0;
          border: 1px solid var(--ui-line);
          background: var(--ui-surface);
          padding: 10px 12px;
          display: grid;
          gap: 4px;
        }
        .setup-top-friend-row {
          display: grid;
          grid-template-columns: auto auto auto;
          justify-content: start;
          align-items: center;
          gap: 14px;
        }
        .setup-top-actions {
          display: flex;
          gap: 14px;
          margin-left: 0;
          flex-shrink: 0;
        }
        .setup-top-btn {
          border: 1px solid var(--ui-line);
          background: var(--ui-surface);
          color: var(--ui-text);
          padding: 9px 16px;
          cursor: pointer;
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          white-space: nowrap;
          width: auto;
        }
        @media (max-width: 860px) {
          .setup-top-controls {
            width: 100%;
            display: grid;
            grid-template-columns: 1fr;
            justify-content: center;
            gap: 14px;
          }
          .setup-top-actions {
            justify-content: center;
            margin-left: 0;
            display: grid;
            grid-template-columns: 1fr 1fr;
          }
        }
        @media (max-width: 560px) {
          .setup-top-actions {
            grid-template-columns: 1fr 1fr;
            gap: 12px;
          }
          .setup-top-btn {
            width: 100%;
            padding: 8px 12px;
          }
        }
      `}</style>

      <div className="setup-top-friend">
        <div className="setup-top-friend-row">
          <span style={{
            fontSize: 10,
            letterSpacing: '0.09em',
            textTransform: 'uppercase',
            color: 'var(--ui-muted)',
          }}>
            Friend
          </span>

          <span style={{
            fontFamily: "'Courier Prime', monospace",
            fontSize: 12,
            letterSpacing: '0.08em',
            color: 'var(--ui-text)',
            maxWidth: '180px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {onlineGameApi.friendCode || '...'}
          </span>

          <button
            type="button"
            onClick={copyFriendCode}
            className="setup-top-btn"
            style={{
              background: 'transparent',
              padding: '4px 8px',
              fontSize: 10,
            }}
          >Copy</button>
        </div>

      </div>

      <div className="setup-top-actions">
        <button
          type="button"
          onClick={cycleTheme}
          className="setup-top-btn"
        >
          Theme: {THEMES[theme].label}
        </button>

        <button
          type="button"
          onClick={() => setShowSettings(true)}
          className="setup-top-btn"
        >
          Settings
        </button>
      </div>
    </div>
  );

  if (!gameApi.game) {
    return (
      <>
        <OnlineLobby
          controls={setupControls}
          connected={onlineGameApi.connected}
          room={onlineGameApi.room}
          playerId={onlineGameApi.playerId}
          friendCode={onlineGameApi.friendCode}
          incomingInvites={onlineGameApi.incomingInvites}
          error={onlineGameApi.error}
          onSyncPresence={onlineGameApi.syncPresence}
          onCreateRoom={onlineGameApi.createRoom}
          onJoinRoom={onlineGameApi.joinRoom}
          onSendFriendInvite={onlineGameApi.sendFriendInvite}
          onAcceptFriendInvite={onlineGameApi.acceptFriendInvite}
          onDeclineFriendInvite={onlineGameApi.declineFriendInvite}
          onLeaveRoom={onlineGameApi.leaveRoom}
          onStartGame={() => {
            setActiveGameMode('online');
            return onlineGameApi.startOnlineGame(sharedRules);
          }}
          onPlayWithComputer={(playerName) => {
            setActiveGameMode('computer');
            localGameApi.startGame([playerName, 'Computer'], sharedRules, [false, true]);
          }}
          onKickPlayer={onlineGameApi.kickPlayer}
        />

        <SettingsModal
          open={showSettings}
          rules={sharedRules}
          onChange={setSharedRules}
          onClose={() => setShowSettings(false)}
        />
      </>
    );
  }

  return (
    <>
      <GameBoard
        gameApi={gameApi as ReturnType<typeof useUnoGame>}
        onReset={() => {
          gameApi.resetGame();
          setActiveGameMode('online');
        }}
        onOpenSettings={() => setShowSettings(true)}
        onCycleTheme={cycleTheme}
        currentThemeLabel={THEMES[theme].label}
      />
      <SettingsModal
        open={showSettings}
        rules={sharedRules}
        onChange={setSharedRules}
        onClose={() => setShowSettings(false)}
      />
    </>
  );
}
