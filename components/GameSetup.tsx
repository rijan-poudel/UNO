'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import SetupShell from './SetupShell';

interface PlayerRow {
  name: string;
  isBot: boolean;
}

interface GameSetupProps {
  onStart: (names: string[], botFlags: boolean[]) => void;
  controls?: ReactNode;
}

const MAX_PLAYERS = 8;
const LOCAL_PLAYER_NAMES_KEY = 'uno.local.playerNames';

function getInitialPlayers(): PlayerRow[] {
  const defaults: PlayerRow[] = [
    { name: 'Player 1', isBot: false },
    { name: 'Player 2', isBot: true },
  ];

  if (typeof window === 'undefined') return defaults;

  try {
    const raw = window.localStorage.getItem(LOCAL_PLAYER_NAMES_KEY);
    if (!raw) return defaults;

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return defaults;

    const names = parsed
      .filter((item): item is string => typeof item === 'string')
      .map((name) => name.trim())
      .filter((name) => name.length > 0)
      .slice(0, MAX_PLAYERS);

    if (names.length < 2) return defaults;

    return names.map((name, index) => ({ name, isBot: index === 1 }));
  } catch {
    return defaults;
  }
}

export default function GameSetup({ onStart, controls }: GameSetupProps) {
  const [players, setPlayers] = useState<PlayerRow[]>(getInitialPlayers);

  const addPlayer = () => {
    if (players.length >= MAX_PLAYERS) return;
    setPlayers(prev => [...prev, { name: `Player ${prev.length + 1}`, isBot: false }]);
  };
  const removePlayer = (i: number) => {
    if (players.length <= 2) return;
    setPlayers(prev => prev.filter((_, idx) => idx !== i));
  };
  const updateName = (i: number, name: string) =>
    setPlayers(prev => prev.map((p, idx) => idx === i ? { ...p, name } : p));
  const toggleBot = (i: number) =>
    setPlayers(prev => prev.map((p, idx) => idx === i ? { ...p, isBot: !p.isBot } : p));

  useEffect(() => {
    try {
      const names = players.map((p, i) => p.name.trim() || `Player ${i + 1}`);
      window.localStorage.setItem(LOCAL_PLAYER_NAMES_KEY, JSON.stringify(names));
    } catch {
      // Ignore storage errors (private mode or blocked storage).
    }
  }, [players]);

  const handleStart = () => {
    const names = players.map((p, i) => p.name.trim() || `Player ${i + 1}`);
    onStart(names, players.map(p => p.isBot));
  };

  return (
    <SetupShell
        subtitle="Local multiplayer"
        footer={(
          <>
            <div style={{ height: 1, background: 'rgba(26,15,0,0.1)', marginBottom: 32 }} />
            <button
              type="button"
              onClick={handleStart}
              className="setup-primary-btn"
              style={{
                fontFamily: "'Bebas Neue', cursive",
                fontSize: 22,
                letterSpacing: '0.18em',
                background: '#1a0f00',
                color: '#fff8f0',
                border: 'none',
                padding: '18px 0',
                cursor: 'pointer',
                width: '100%',
                transition: 'opacity 0.12s',
              }}
            >
              DEAL CARDS
            </button>
          </>
        )}
      >
        {controls}

        <div>
          <p style={{ margin: 0, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(26,15,0,0.3)' }}>
            01 / Players
          </p>
          <h2 style={{
            margin: '8px 0 0',
            fontFamily: "'Bebas Neue', cursive",
            fontSize: 34,
            letterSpacing: '0.04em',
            lineHeight: 1,
          }}>Seat the Table</h2>
        </div>

        <div>
          {players.map((player, index) => (
            <div
              key={index}
              className="player-row"
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto auto',
                gap: 12,
                alignItems: 'center',
                borderBottom: '1px solid rgba(26,15,0,0.08)',
                padding: '14px 0',
              }}
            >
              <input
                type="text"
                value={player.name}
                maxLength={18}
                onChange={e => updateName(index, e.target.value)}
                placeholder={`Player ${index + 1}`}
                className="setup-input"
                style={{
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid transparent',
                  fontFamily: "'Courier Prime', monospace",
                  fontSize: 15,
                  fontWeight: 700,
                  color: '#1a0f00',
                  padding: '2px 0',
                  width: '100%',
                  transition: 'border-bottom-color 0.12s',
                }}
              />
              <button
                type="button"
                onClick={() => toggleBot(index)}
                className="bot-btn"
                style={{
                  fontFamily: "'Courier Prime', monospace",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  background: 'transparent',
                  color: player.isBot ? '#1a0f00' : 'rgba(26,15,0,0.28)',
                  border: `1px solid ${player.isBot ? 'rgba(26,15,0,0.4)' : 'rgba(26,15,0,0.14)'}`,
                  padding: '5px 10px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.12s',
                }}
              >
                {player.isBot ? '⌘ BOT' : 'HUMAN'}
              </button>
              {players.length > 2 ? (
                <button
                  type="button"
                  onClick={() => removePlayer(index)}
                  className="remove-btn"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'rgba(26,15,0,0.2)',
                    fontSize: 20,
                    lineHeight: 1,
                    cursor: 'pointer',
                    padding: '4px',
                    transition: 'color 0.12s',
                  }}
                >×</button>
              ) : <div style={{ width: 24 }} />}
            </div>
          ))}

          {players.length < MAX_PLAYERS && (
            <button
              type="button"
              onClick={addPlayer}
              className="add-btn"
              style={{
                width: '100%',
                marginTop: 16,
                fontFamily: "'Courier Prime', monospace",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                background: 'transparent',
                color: 'rgba(26,15,0,0.26)',
                border: '1px dashed rgba(26,15,0,0.14)',
                padding: '13px 16px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.12s',
              }}
            >+ Add player</button>
          )}
        </div>
      </SetupShell>
  );
}