'use client';

import { useEffect, useState } from 'react';
import type { GameRules } from '../types/rules';
import { useUnoGame } from '../hooks/useUnoGame';
import { useUnoOnlineGame } from '../hooks/useUnoOnlineGame';
import GameSetup from '../components/GameSetup';
import GameBoard from '../components/GameBoard';
import OnlineLobby from '../components/OnlineLobby';
import SettingsModal from '../components/SettingsModal';

const SHARED_RULES_KEY = 'uno.shared.rules';
const PREFERRED_MODE_KEY = 'uno.preferred.mode';

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

function getInitialMode(): 'local' | 'online' {
  if (typeof window === 'undefined') return 'local';
  try {
    const raw = window.localStorage.getItem(PREFERRED_MODE_KEY);
    return raw === 'online' ? 'online' : 'local';
  } catch {
    return 'local';
  }
}

/**
 * Root page — decides whether to show the pre-game setup screen
 * or the live game board.  A single useUnoGame() call at the top
 * level ensures both children share the same state instance.
 */
export default function Home() {
  const [mode, setMode] = useState<'local' | 'online'>(getInitialMode);
  const [showSettings, setShowSettings] = useState(false);
  const [sharedRules, setSharedRules] = useState<Partial<GameRules>>(getInitialSharedRules);

  const localGameApi = useUnoGame();
  const onlineGameApi = useUnoOnlineGame();
  const gameApi = mode === 'online' ? onlineGameApi : localGameApi;

  useEffect(() => {
    try {
      window.localStorage.setItem(SHARED_RULES_KEY, JSON.stringify(sharedRules));
    } catch {
      // Ignore storage errors.
    }
  }, [sharedRules]);

  useEffect(() => {
    try {
      window.localStorage.setItem(PREFERRED_MODE_KEY, mode);
    } catch {
      // Ignore storage errors.
    }
  }, [mode]);

  const setupControls = (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 12,
      flexWrap: 'wrap',
    }}>
      <div style={{
        display: 'inline-flex',
        border: '1px solid rgba(26,15,0,0.24)',
        background: 'rgba(255,248,240,0.95)',
      }}>
        <button
          onClick={() => setMode('local')}
          style={{
            border: 'none',
            background: mode === 'local' ? '#1a0f00' : 'transparent',
            color: mode === 'local' ? '#fff8f0' : '#1a0f00',
            padding: '8px 12px',
            cursor: 'pointer',
            fontSize: 11,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          Play Local
        </button>
        <button
          onClick={() => setMode('online')}
          style={{
            border: 'none',
            background: mode === 'online' ? '#1a0f00' : 'transparent',
            color: mode === 'online' ? '#fff8f0' : '#1a0f00',
            padding: '8px 12px',
            cursor: 'pointer',
            fontSize: 11,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          Play Online
        </button>
      </div>

      <button
        onClick={() => setShowSettings(true)}
        style={{
          border: '1px solid rgba(26,15,0,0.24)',
          background: 'rgba(255,248,240,0.95)',
          color: '#1a0f00',
          padding: '8px 12px',
          cursor: 'pointer',
          fontSize: 11,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        Settings
      </button>
    </div>
  );

  if (!gameApi.game) {
    return (
      <>
        {mode === 'local' ? (
          <GameSetup
            controls={setupControls}
            onStart={(names, botFlags) =>
              localGameApi.startGame(names, sharedRules, botFlags)
            }
          />
        ) : (
          <OnlineLobby
            controls={setupControls}
            connected={onlineGameApi.connected}
            room={onlineGameApi.room}
            playerId={onlineGameApi.playerId}
            error={onlineGameApi.error}
            onCreateRoom={onlineGameApi.createRoom}
            onJoinRoom={onlineGameApi.joinRoom}
            onStartGame={() => onlineGameApi.startOnlineGame(sharedRules)}
          />
        )}

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
        onReset={() => gameApi.resetGame()}
        onOpenSettings={() => setShowSettings(true)}
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
