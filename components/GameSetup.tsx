'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import SetupShell from './SetupShell';
import { CountBadge, PrimaryButton, SectionDivider, SetupIntro } from './ui/PageChrome';

interface PlayerRow {
  name: string;
  isBot: boolean;
  uid: number; // stable key for animation, independent of index
}

interface GameSetupProps {
  onStart: (names: string[], botFlags: boolean[]) => void;
  controls?: ReactNode;
  onBack?: () => void;
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
    return names.map((name, i) => ({ name, isBot: i !== 0, uid: nextUid() }));
  } catch {
    return defaults;
  }
}

export default function GameSetup({ onStart, controls, onBack }: GameSetupProps) {
  const [players, setPlayers] = useState<PlayerRow[]>(getInitialPlayers);
  // Track newly added row ids for one-shot enter animation.
  const [justAddedIds, setJustAddedIds] = useState<Set<number>>(new Set());

  const addPlayer = () => {
    if (players.length >= MAX_PLAYERS) return;
    const uid = nextUid();
    setJustAddedIds((prev) => new Set(prev).add(uid));
    setPlayers(prev => [...prev, { name: `Player ${prev.length + 1}`, isBot: true, uid }]);
    // Clear the "just added" flag after animation completes
    setTimeout(() => {
      setJustAddedIds((prev) => {
        const next = new Set(prev);
        next.delete(uid);
        return next;
      });
    }, 320);
  };

  const removePlayer = (i: number) => {
    if (players.length <= 2) return;
    setPlayers(prev => prev.filter((_, idx) => idx !== i));
  };

  const updateName = (i: number, name: string) =>
    setPlayers(prev => prev.map((p, idx) => idx === i ? { ...p, name } : p));

  useEffect(() => {
    try {
      const names = players.map((p, i) => p.name.trim() || `Player ${i + 1}`);
      window.localStorage.setItem(LOCAL_PLAYER_NAMES_KEY, JSON.stringify(names));
    } catch { /* ignore */ }
  }, [players]);

  const handleStart = () => {
    const names = players.map((p, i) => p.name.trim() || `Player ${i + 1}`);
    onStart(names, players.map((_, idx) => idx !== 0));
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
        .remove-btn:hover { color: var(--ui-accent-red) !important; }
        .add-btn:hover   { border-color: var(--ui-text) !important; color: var(--ui-text) !important; }
        .setup-primary-btn:hover { opacity: 0.78 !important; }
        .player-row:last-of-type { border-bottom: none !important; }
      `}</style>

      <SetupShell
        subtitle="Local multiplayer"
        controls={controls}
        footer={(
          <>
            <SectionDivider style={{ marginBottom: 32 }} />
            <PrimaryButton onClick={handleStart}>DEAL CARDS</PrimaryButton>
          </>
        )}
      >
        <SetupIntro
          title="Play with Computer"
          description="Choose local seats and bot players for this device"
          onBack={onBack}
          trailing={<CountBadge current={players.length} total={MAX_PLAYERS} alert={atMax} />}
        />

        {/* Player rows */}
        <div>
          {players.map((player, index) => {
            const isNew = justAddedIds.has(player.uid);
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

                <span
                  style={{
                    fontFamily: "'Courier Prime', monospace",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    background: index === 0 ? 'transparent' : 'var(--ui-text)',
                    color: index === 0 ? 'var(--ui-muted)' : 'var(--ui-bg)',
                    border: `1px solid ${index === 0 ? 'var(--ui-line)' : 'var(--ui-text)'}`,
                    padding: '5px 10px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {index === 0 ? 'You' : 'Bot'}
                </span>

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