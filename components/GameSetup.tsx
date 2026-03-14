'use client';

import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import SetupShell from './SetupShell';

interface PlayerRow {
  name: string;
  isBot: boolean;
  uid: number; // stable key for animation, independent of index
}

interface GameSetupProps {
  onStart: (names: string[], botFlags: boolean[]) => void;
  controls?: ReactNode;
}

const MAX_PLAYERS = 8;
const LOCAL_PLAYER_NAMES_KEY = 'uno.local.playerNames';
let uidCounter = 0;
const nextUid = () => ++uidCounter;

function getInitialPlayers(): PlayerRow[] {
  const defaults: PlayerRow[] = [
    { name: 'Player 1', isBot: false, uid: nextUid() },
    { name: 'Player 2', isBot: true,  uid: nextUid() },
  ];

  if (typeof window === 'undefined') return defaults;

  try {
    const raw = window.localStorage.getItem(LOCAL_PLAYER_NAMES_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return defaults;
    const names = parsed
      .filter((item): item is string => typeof item === 'string')
      .map(n => n.trim()).filter(n => n.length > 0).slice(0, MAX_PLAYERS);
    if (names.length < 2) return defaults;
    return names.map((name, i) => ({ name, isBot: i === 1, uid: nextUid() }));
  } catch {
    return defaults;
  }
}

export default function GameSetup({ onStart, controls }: GameSetupProps) {
  const [players, setPlayers] = useState<PlayerRow[]>(getInitialPlayers);
  // Track which rows were just added so we can animate them in
  const justAdded = useRef<Set<number>>(new Set());

  const addPlayer = () => {
    if (players.length >= MAX_PLAYERS) return;
    const uid = nextUid();
    justAdded.current.add(uid);
    setPlayers(prev => [...prev, { name: `Player ${prev.length + 1}`, isBot: false, uid }]);
    // Clear the "just added" flag after animation completes
    setTimeout(() => justAdded.current.delete(uid), 320);
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
    } catch { /* ignore */ }
  }, [players]);

  const handleStart = () => {
    const names = players.map((p, i) => p.name.trim() || `Player ${i + 1}`);
    onStart(names, players.map(p => p.isBot));
  };

  const atMax = players.length >= MAX_PLAYERS;

  return (
    <>
      <style>{`
        @keyframes rowSlideIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .setup-input { outline: none !important; }
        .setup-input::placeholder { color: var(--ui-muted); opacity: 0.5; }
        .setup-input:focus { border-bottom-color: var(--ui-text) !important; }
        .bot-btn:hover   { opacity: 0.65; }
        .remove-btn:hover { color: var(--ui-accent-red) !important; }
        .add-btn:hover   { border-color: var(--ui-text) !important; color: var(--ui-text) !important; }
        .setup-primary-btn:hover { opacity: 0.78 !important; }
        .player-row:last-of-type { border-bottom: none !important; }
      `}</style>

      <SetupShell
        subtitle="Local multiplayer"
        footer={(
          <>
            <div style={{ height: 1, background: 'var(--ui-line)', marginBottom: 32 }} />
            <button
              type="button"
              onClick={handleStart}
              className="setup-primary-btn"
              style={{
                fontFamily: "'Bebas Neue', cursive",
                fontSize: 22,
                letterSpacing: '0.18em',
                background: 'var(--ui-text)',
                color: 'var(--ui-surface)',
                border: 'none',
                padding: '18px 0',
                cursor: 'pointer',
                width: '100%',
                transition: 'opacity 0.12s',
              }}
            >DEAL CARDS</button>
          </>
        )}
      >
        {controls}

        {/* Section header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <p style={{
              margin: 0, fontSize: 10, letterSpacing: '0.22em',
              textTransform: 'uppercase', color: 'var(--ui-muted)',
            }}>01 / Players</p>
            <h2 style={{
              margin: '8px 0 0',
              fontFamily: "'Bebas Neue', cursive",
              fontSize: 34, letterSpacing: '0.04em', lineHeight: 1,
            }}>Seat the Table</h2>
          </div>

          {/* Player count badge — always visible, changes colour at max */}
          <span style={{
            fontFamily: "'Courier Prime', monospace",
            fontSize: 11,
            letterSpacing: '0.1em',
            color: atMax ? 'var(--ui-accent-red)' : 'var(--ui-muted)',
            paddingBottom: 2,
            transition: 'color 0.2s',
          }}>
            {players.length} / {MAX_PLAYERS}
          </span>
        </div>

        {/* Player rows */}
        <div>
          {players.map((player, index) => {
            const isNew = justAdded.current.has(player.uid);
            return (
              <div
                key={player.uid}
                className="player-row"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr auto auto',
                  gap: 12,
                  alignItems: 'center',
                  borderBottom: '1px solid var(--ui-line)',
                  padding: '13px 0',
                  animation: isNew ? 'rowSlideIn 0.28s ease' : 'none',
                }}
              >
                {/* Index number — subtle, helps orientation */}
                <span style={{
                  fontFamily: "'Courier Prime', monospace",
                  fontSize: 10,
                  color: 'var(--ui-muted)',
                  letterSpacing: '0.06em',
                  userSelect: 'none',
                  minWidth: 16,
                  textAlign: 'right',
                }}>{index + 1}</span>

                {/* Name input */}
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
                    color: 'var(--ui-text)',
                    padding: '2px 0',
                    width: '100%',
                    transition: 'border-bottom-color 0.12s',
                  }}
                />

                {/* Human / Bot toggle — clearer label */}
                <button
                  type="button"
                  onClick={() => toggleBot(index)}
                  className="bot-btn"
                  title={player.isBot ? 'Switch to human' : 'Switch to bot'}
                  style={{
                    fontFamily: "'Courier Prime', monospace",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    background: player.isBot ? 'var(--ui-text)' : 'transparent',
                    color: player.isBot ? 'var(--ui-bg)' : 'var(--ui-muted)',
                    border: `1px solid ${player.isBot ? 'var(--ui-text)' : 'var(--ui-line)'}`,
                    padding: '5px 10px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s',
                  }}
                >
                  {player.isBot ? '⌘ Bot' : 'Human'}
                </button>

                {/* Remove — only when > 2 players */}
                {players.length > 2 ? (
                  <button
                    type="button"
                    onClick={() => removePlayer(index)}
                    className="remove-btn"
                    title="Remove player"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--ui-muted)',
                      fontSize: 20,
                      lineHeight: 1,
                      cursor: 'pointer',
                      padding: '4px',
                      transition: 'color 0.12s',
                    }}
                  >×</button>
                ) : <div style={{ width: 24 }} />}
              </div>
            );
          })}

          {/* Add player — dims and shows "max reached" when full */}
          <button
            type="button"
            onClick={addPlayer}
            disabled={atMax}
            className={atMax ? '' : 'add-btn'}
            style={{
              width: '100%',
              marginTop: 16,
              fontFamily: "'Courier Prime', monospace",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              background: 'transparent',
              color: atMax ? 'var(--ui-muted)' : 'var(--ui-muted)',
              border: `1px dashed ${atMax ? 'transparent' : 'var(--ui-line)'}`,
              padding: '13px 16px',
              cursor: atMax ? 'default' : 'pointer',
              textAlign: 'left',
              opacity: atMax ? 0.35 : 1,
              transition: 'all 0.12s',
            }}
          >
            {atMax ? `Maximum ${MAX_PLAYERS} players` : '+ Add player'}
          </button>
        </div>
      </SetupShell>
    </>
  );
}