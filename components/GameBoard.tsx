'use client';

import { useEffect, useRef, useState } from 'react';
import type { Card } from '../types/card';
import type { Player } from '../types/game';
import type { useUnoGame } from '../hooks/useUnoGame';
import UnoCard from './UnoCard';
import ColorPicker from './ColorPicker';

export type GameApi = ReturnType<typeof useUnoGame>;

interface GameBoardProps {
  gameApi: GameApi;
  onReset: () => void;
  onOpenSettings: () => void;
}

const COLOR_ORDER: Record<string, number> = { red: 0, yellow: 1, green: 2, blue: 3, wild: 4 };
const VALUE_ORDER: Record<string, number> = {
  '0':0,'1':1,'2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,
  skip:10, reverse:11, draw2:12, wild:13, wild4:14,
};

function sortHand(cards: Card[]): Card[] {
  return [...cards].sort((a, b) => {
    const cd = (COLOR_ORDER[a.color] ?? 9) - (COLOR_ORDER[b.color] ?? 9);
    return cd !== 0 ? cd : (VALUE_ORDER[a.value] ?? 9) - (VALUE_ORDER[b.value] ?? 9);
  });
}

// ── Live notification feed (top-right, YouTube-style) ─────────────────────────

interface FeedEntry { id: number; text: string }

function LiveFeed({ entries }: { entries: FeedEntry[] }) {
  return (
    <div style={{
      position: 'fixed',
      top: 50,
      right: 10,
      zIndex: 40,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      gap: 5,
      pointerEvents: 'none',
      maxWidth: 220,
    }}>
      {entries.map((e, i) => (
        <div
          key={e.id}
          style={{
            fontFamily: "'Courier Prime', monospace",
            fontSize: 10,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            background: 'rgba(255,248,240,0.92)',
            border: '1px solid rgba(26,15,0,0.12)',
            padding: '4px 9px',
            color: i === 0 ? 'rgba(26,15,0,0.7)' : 'rgba(26,15,0,0.35)',
            animation: i === 0 ? 'feedIn 0.2s ease' : 'none',
            transition: 'opacity 0.3s',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '100%',
          }}
        >
          {e.text}
        </div>
      ))}
    </div>
  );
}

// ── Opponent strip ─────────────────────────────────────────────────────────────

function OpponentStrip({
  player, isCurrentTurn, showCallOut, onCallOut,
}: {
  player: Player;
  isCurrentTurn: boolean;
  showCallOut: boolean;
  onCallOut: () => void;
}) {
  const n = player.hand.length;
  const fans = Math.min(n, 8);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 5,
      opacity: isCurrentTurn ? 1 : 0.38,
      transition: 'opacity 0.25s ease',
    }}>
      {/* Name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {isCurrentTurn && (
          <span style={{
            width: 5, height: 5, borderRadius: '50%',
            background: '#c0392b', display: 'inline-block',
            animation: 'dot 1.1s ease-in-out infinite', flexShrink: 0,
          }} />
        )}
        <span style={{
          fontFamily: "'Bebas Neue', cursive",
          fontSize: 16, letterSpacing: '0.05em', color: '#1a0f00',
        }}>
          {player.isBot ? '⌘ ' : ''}{player.name}
        </span>
        {player.saidUno && n === 1 && (
          <span style={{
            fontFamily: "'Courier Prime', monospace",
            fontSize: 8, fontWeight: 700, letterSpacing: '0.12em',
            background: '#c0392b', color: '#fff8f0', padding: '2px 5px',
            animation: 'blink 0.9s step-end infinite',
          }}>UNO</span>
        )}
      </div>

      {/* Fanned face-down cards */}
      <div style={{ position: 'relative', height: 44, width: Math.max(30, 18 + fans * 10) }}>
        {fans === 0 ? (
          <span style={{ fontFamily: "'Courier Prime', monospace", fontSize: 9, color: 'rgba(26,15,0,0.22)' }}>empty</span>
        ) : Array.from({ length: fans }).map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: i * 10,
            top: Math.abs(i - (fans - 1) / 2) * 1.5,
            width: 26, height: 38,
            background: '#fff8f0',
            border: '1px solid rgba(26,15,0,0.22)',
            borderRadius: 2,
            transform: `rotate(${(i - (fans - 1) / 2) * 5}deg)`,
            transformOrigin: 'bottom center',
            boxShadow: '1px 1px 0 rgba(26,15,0,0.07)',
            zIndex: i,
          }}>
            <div style={{
              position: 'absolute', inset: 2,
              border: '1px solid rgba(26,15,0,0.09)',
              background: 'repeating-linear-gradient(45deg, rgba(26,15,0,0.025) 0, rgba(26,15,0,0.025) 1px, transparent 1px, transparent 5px)',
            }} />
          </div>
        ))}
      </div>

      <span style={{
        fontFamily: "'Courier Prime', monospace", fontSize: 9,
        color: 'rgba(26,15,0,0.35)', letterSpacing: '0.06em',
      }}>{n} {n === 1 ? 'card' : 'cards'}</span>

      {showCallOut && (
        <button onClick={onCallOut} style={{
          fontFamily: "'Courier Prime', monospace",
          fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
          background: 'transparent', border: '1px solid #c0392b', color: '#c0392b',
          padding: '3px 8px', cursor: 'pointer',
          animation: 'blink 1s step-end infinite',
        }}>CALL OUT</button>
      )}
    </div>
  );
}

// ── Winner screen ──────────────────────────────────────────────────────────────

function WinnerScreen({ winner, onReset }: { winner: Player; onReset: () => void }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 60,
      background: '#fff8f0',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 32,
      animation: 'fadeUp 0.28s ease',
    }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{
          fontFamily: "'Courier Prime', monospace", fontSize: 11,
          letterSpacing: '0.22em', textTransform: 'uppercase',
          color: 'rgba(26,15,0,0.32)', margin: '0 0 16px',
        }}>— game over —</p>
        <h1 style={{
          fontFamily: "'Bebas Neue', cursive",
          fontSize: 'clamp(56px, 13vw, 100px)',
          letterSpacing: '0.04em', color: '#1a0f00', margin: 0, lineHeight: 1,
        }}>{winner.name}</h1>
        <p style={{
          fontFamily: "'Courier Prime', monospace", fontSize: 13,
          color: 'rgba(26,15,0,0.38)', margin: '14px 0 0', letterSpacing: '0.08em',
        }}>wins the round</p>
      </div>
      <div style={{ width: 1, height: 40, background: 'rgba(26,15,0,0.1)' }} />
      <button onClick={onReset} style={{
        fontFamily: "'Bebas Neue', cursive", fontSize: 22, letterSpacing: '0.14em',
        background: '#1a0f00', color: '#fff8f0', border: 'none',
        padding: '14px 56px', cursor: 'pointer', transition: 'opacity 0.12s',
      }}
        onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.opacity = '0.7'}
        onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.opacity = '1'}
      >DEAL AGAIN</button>
    </div>
  );
}

function Thinking({ name }: { name: string }) {
  return (
    <div style={{
      fontFamily: "'Courier Prime', monospace", fontSize: 11,
      color: 'rgba(26,15,0,0.36)', letterSpacing: '0.12em', textTransform: 'uppercase',
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      <span style={{ animation: 'blink 1.1s step-end infinite' }}>■</span>
      {name} is thinking
      <span style={{ animation: 'blink 1.1s step-end 0.55s infinite' }}>■</span>
    </div>
  );
}

// ── Main board ─────────────────────────────────────────────────────────────────

export default function GameBoard({ gameApi, onReset, onOpenSettings }: GameBoardProps) {
  const {
    game, localPlayerIndex, pendingWild, drawnThisTurn, botThinking,
    log, currentPlayer, localPlayer, isLocalTurn,
    playableCardIds, canPass, hasPendingStackOption,
    selectCard, confirmWildColor, cancelWild,
    drawCard, pass, sayUno, callOut, resetGame,
  } = gameApi;

  // Live feed state — mirrors log but as timed entries
  const [feed, setFeed] = useState<FeedEntry[]>([]);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isPortraitMobile, setIsPortraitMobile] = useState(false);
  const [isCompactBoard, setIsCompactBoard] = useState(false);
  const [boardScale, setBoardScale] = useState(1);
  const feedCounter = useRef(0);
  const prevLogRef = useRef<string[]>([]);

  useEffect(() => {
    if (!log.length) return;
    const newest = log[0];
    if (newest && newest !== prevLogRef.current[0]) {
      feedCounter.current += 1;
      const id = feedCounter.current;
      setFeed(prev => [{ id, text: newest }, ...prev].slice(0, 5));
      prevLogRef.current = log;
      // Fade out after 4s
      const t = window.setTimeout(() => {
        setFeed(prev => prev.filter(e => e.id !== id));
      }, 4000);
      return () => window.clearTimeout(t);
    }
  }, [log]);

  useEffect(() => {
    const updateLayoutState = () => {
      const portrait = window.matchMedia('(orientation: portrait)').matches;
      const mobileLike = Math.min(window.innerWidth, window.innerHeight) <= 900;
      const shortViewport = window.innerHeight < 760;
      const narrowViewport = window.innerWidth < 1100;
      const tinyViewport = window.innerHeight < 680;

      setIsPortraitMobile(portrait && mobileLike);
      setIsCompactBoard(shortViewport || narrowViewport);
      setBoardScale(tinyViewport ? 0.82 : (shortViewport || narrowViewport) ? 0.9 : 1);
    };

    updateLayoutState();
    window.addEventListener('resize', updateLayoutState);
    window.addEventListener('orientationchange', updateLayoutState);
    return () => {
      window.removeEventListener('resize', updateLayoutState);
      window.removeEventListener('orientationchange', updateLayoutState);
    };
  }, []);

  if (!game || !localPlayer || !currentPlayer) return null;

  const topDiscard   = game.discardPile[game.discardPile.length - 1];
  const winner       = game.winnerId ? game.players.find(p => p.id === game.winnerId) : null;
  const humanTurn    = isLocalTurn && !localPlayer.isBot && !game.winnerId;
  const drawDisabled = botThinking || !!game.winnerId || (drawnThisTurn && game.pendingDraw === 0) || !humanTurn;
  const sortedHand   = sortHand(localPlayer.hand);
  const opponents    = game.players.filter((_, i) => i !== localPlayerIndex);
  const pileCardScale = boardScale;
  const handCardScale = boardScale < 1 ? 0.95 : 1.12;

  const unoReady  = humanTurn && localPlayer.hand.length >= 1 && localPlayer.hand.length <= 2 && !localPlayer.saidUno && game.rules.mustDeclareUno;
  const passReady = humanTurn && canPass;
  const mustDrawNow = humanTurn && !drawDisabled && playableCardIds.size === 0;

  const hint = !humanTurn
    ? `Waiting for ${currentPlayer.name}`
    : game.pendingDraw > 0
      ? playableCardIds.size > 0 ? 'Counter the draw, or accept it' : `No counter — draw +${game.pendingDraw}`
      : drawnThisTurn ? 'Play the drawn card, or pass'
      : playableCardIds.size > 0 ? 'Tap a card to play it'
      : 'No playable cards — draw to continue';

  // Arc fan: each card rotates slightly around a point far below,
  // mimicking how you physically fan cards in your hand.
  const handCount = sortedHand.length;
  const ARC_SPREAD = 3.5;   // degrees between cards
  const ARC_LIFT   = 2.5;   // px vertical shift per degree from centre

  const confirmExitGame = () => {
    setShowExitConfirm(false);
    resetGame();
    onReset();
  };

  const requestLandscapeMode = async () => {
    try {
      const root = document.documentElement as HTMLElement & {
        webkitRequestFullscreen?: () => Promise<void> | void;
      };
      if (!document.fullscreenElement) {
        if (root.requestFullscreen) {
          await root.requestFullscreen();
        } else if (root.webkitRequestFullscreen) {
          root.webkitRequestFullscreen();
        }
      }

      const orientationApi = (screen.orientation as ScreenOrientation & {
        lock?: (orientation: 'portrait' | 'landscape' | 'portrait-primary' | 'portrait-secondary' | 'landscape-primary' | 'landscape-secondary' | 'natural' | 'any') => Promise<void>;
      });
      if (orientationApi.lock) {
        await orientationApi.lock('landscape');
      }
    } catch {
      // Lock may fail on unsupported browsers; overlay still instructs manual rotate.
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Courier+Prime:wght@400;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; }

        @keyframes blink   { 0%,100%{opacity:1}  50%{opacity:0.15} }
        @keyframes dot     { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.3;transform:scale(0.6)} }
        @keyframes cardIn  { from{opacity:0;transform:translateY(-8px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes feedIn  { from{opacity:0;transform:translateX(12px)} to{opacity:1;transform:translateX(0)} }
        @keyframes modalIn { from{opacity:0;transform:translateY(14px) scale(0.98)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes mustDrawPulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(192,57,43,0.45); transform: translateY(-2px) scale(1); }
          50% { box-shadow: 0 0 0 10px rgba(192,57,43,0.06); transform: translateY(-6px) scale(1.04); }
        }

        .playable-card:hover {
          transform: translateY(-16px) !important;
          z-index: 99 !important;
        }
        .draw-pile-btn:hover:not(:disabled) { transform: translateY(-3px); }
        .pass-btn:hover  { opacity: 0.65 !important; }
        .uno-btn:hover   { opacity: 0.82 !important; }
        .menu-btn:hover  { color: #c0392b !important; }
      `}</style>

      {/* Live feed — top right, fixed */}
      <LiveFeed entries={feed} />

      <div style={{
        height: '100dvh',
        overflow: 'hidden',
        color: '#1a0f00',
        fontFamily: "'Courier Prime', monospace",
        display: 'flex',
        flexDirection: 'column',
      }}>

        {/* ── Floating top bar: logo left, menu right ── */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30,
          padding: isCompactBoard ? '6px 8px' : '10px 12px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          pointerEvents: 'none',
        }}>
          <h1 style={{
            margin: isCompactBoard ? 6 : 10, pointerEvents: 'auto',
            fontFamily: "'Bebas Neue', cursive",
            fontSize: isCompactBoard ? 24 : 28, letterSpacing: '0.02em', lineHeight: 1,
          }}>
            <span style={{ color: '#c0392b' }}>U</span>
            <span style={{ color: '#d4a017' }}>N</span>
            <span style={{ color: '#1e6b3a' }}>O</span>
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, pointerEvents: 'auto' }}>
            <button
              onClick={onOpenSettings}
              style={{
                fontFamily: "'Courier Prime', monospace",
                fontSize: isCompactBoard ? 9 : 10,
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                background: 'rgba(255,248,240,0.9)',
                border: '1px solid rgba(26,15,0,0.18)',
                color: 'rgba(26,15,0,0.4)',
                padding: isCompactBoard ? '5px 9px' : '6px 11px',
                cursor: 'pointer',
                transition: 'color 0.12s',
              }}
            >SETTINGS</button>
            <button className="menu-btn" onClick={() => setShowExitConfirm(true)} style={{
              fontFamily: "'Courier Prime', monospace",
              fontSize: isCompactBoard ? 9 : 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase',
              background: 'rgba(255,248,240,0.9)', border: '1px solid rgba(26,15,0,0.18)',
              color: 'rgba(26,15,0,0.4)', padding: isCompactBoard ? '5px 9px' : '6px 11px', cursor: 'pointer',
              transition: 'color 0.12s',
            }}>MENU</button>
          </div>
        </div>

        {/* ════════════════════════════════════════
            OPPONENTS — flush to top with pt for the logo bar
        ════════════════════════════════════════ */}
        <section style={{
          paddingTop: isCompactBoard ? 32 : 44,
          paddingBottom: isCompactBoard ? 4 : 8,
          paddingInline: 12,
          display: 'flex',
          flexWrap: 'wrap',
          gap: isCompactBoard ? '4px 14px' : '8px 20px',
          justifyContent: 'center',
          alignItems: 'flex-start',
          flexShrink: 0,
        }}>
          {opponents.map(player => {
            const idx = game.players.findIndex(p => p.id === player.id);
            const showCallOut = humanTurn && player.hand.length === 1 && !player.saidUno && game.rules.mustDeclareUno;
            return (
              <OpponentStrip
                key={player.id}
                player={player}
                isCurrentTurn={idx === game.currentPlayerIndex}
                showCallOut={showCallOut}
                onCallOut={() => callOut(localPlayerIndex, idx)}
              />
            );
          })}
        </section>

        {/* ════════════════════════════════════════
            TABLE — draw pile + discard pile only (NO duplicate)
        ════════════════════════════════════════ */}
        <main style={{
          flex: 1, minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: isCompactBoard ? 6 : 12,
          padding: isCompactBoard ? '0 8px' : '0 16px',
          overflow: 'hidden',
        }}>

          {/* Thinking / pending draw alert */}
          <div style={{ minHeight: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {botThinking
              ? <Thinking name={currentPlayer.name} />
              : game.pendingDraw > 0 && humanTurn
                ? <span style={{
                    fontFamily: "'Courier Prime', monospace", fontSize: 11,
                    color: '#c0392b', letterSpacing: '0.1em', textTransform: 'uppercase',
                    border: '1px solid #c0392b', padding: '3px 12px',
                    animation: 'blink 2s step-end infinite',
                  }}>+{game.pendingDraw} incoming</span>
                : null
            }
          </div>

          {/* Active colour pill */}
          {/* <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '6px 16px',
            background: activeColor ? activeColor.bg : 'rgba(26,15,0,0.06)',
            color: activeColor ? activeColor.fg : 'rgba(26,15,0,0.35)',
            transition: 'background 0.3s ease, color 0.3s ease',
          }}>
            <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 15, letterSpacing: '0.15em' }}>
              {activeColor ? activeColor.label : 'NO COLOUR'}
            </span>
            <span style={{ fontSize: 10, letterSpacing: '0.1em', opacity: 0.75 }}>
              T–{String(game.turnCount).padStart(3, '0')} {game.direction === 1 ? '→' : '←'}
            </span>
          </div> */}

          {/* Draw pile + discard pile — ONE of each, side by side */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: isCompactBoard ? 14 : 32 }}>

            {/* Draw pile */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <span style={{
                fontFamily: "'Courier Prime', monospace", fontSize: 9,
                letterSpacing: '0.16em', textTransform: 'uppercase',
                color: 'rgba(26,15,0,0.28)',
              }}>DRAW PILE</span>
              <button
                className="draw-pile-btn"
                onClick={drawDisabled ? undefined : drawCard}
                disabled={drawDisabled}
                style={{
                  background: 'none', border: 'none', padding: 0,
                  cursor: drawDisabled ? 'default' : 'pointer',
                  opacity: drawDisabled ? 0.28 : 1,
                  filter: mustDrawNow
                    ? 'drop-shadow(0 0 12px rgba(192,57,43,0.68))'
                    : game.pendingDraw > 0 && humanTurn
                      ? 'drop-shadow(0 0 7px rgba(192,57,43,0.55))'
                      : 'none',
                  transform: mustDrawNow ? 'translateY(-3px)' : 'translateY(0)',
                  animation: mustDrawNow ? 'mustDrawPulse 1.2s ease-in-out infinite' : 'none',
                  borderRadius: 10,
                  transition: 'filter 0.2s, opacity 0.2s, transform 0.12s',
                }}
              >
                <UnoCard card={{ id: '_draw', color: 'wild', value: 'wild' }} faceDown sizeMultiplier={pileCardScale} />
              </button>
              <span style={{
                fontFamily: "'Courier Prime', monospace", fontSize: 10,
                letterSpacing: '0.08em', color: 'rgba(26,15,0,0.34)',
              }}>{game.drawPile.length} left</span>
            </div>

            {/* Thin divider */}
            <div style={{ width: 1, height: isCompactBoard ? 54 : 70, background: 'rgba(26,15,0,0.1)', alignSelf: 'center' }} />

            {/* Discard pile — only here, nowhere else */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <span style={{
                fontFamily: "'Courier Prime', monospace", fontSize: 9,
                letterSpacing: '0.16em', textTransform: 'uppercase',
                color: 'rgba(26,15,0,0.28)',
              }}>DISCARD</span>
              {topDiscard && (
                <div key={topDiscard.id} style={{ animation: 'cardIn 0.18s ease' }}>
                  <UnoCard card={topDiscard} sizeMultiplier={pileCardScale} />
                </div>
              )}
            </div>
          </div>

          {humanTurn && game.pendingDraw > 0 && hasPendingStackOption && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
              marginTop: 2,
            }}>
              <button
                onClick={drawDisabled ? undefined : drawCard}
                disabled={drawDisabled}
                style={{
                  fontFamily: "'Bebas Neue', cursive",
                  fontSize: 18,
                  letterSpacing: '0.12em',
                  background: '#c0392b',
                  color: '#fff8f0',
                  border: '2px solid #922b21',
                  padding: '8px 24px',
                  cursor: drawDisabled ? 'default' : 'pointer',
                  opacity: drawDisabled ? 0.4 : 1,
                }}
              >TAKE +{game.pendingDraw}</button>
              <span style={{
                fontFamily: "'Courier Prime', monospace",
                fontSize: 10,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'rgba(26,15,0,0.4)',
              }}>
                or play {game.pendingDrawType === 'draw2' ? '+2' : '+4'} to stack
              </span>
            </div>
          )}
        </main>

        {/* ════════════════════════════════════════
            PLAYER PANEL — bottom, with safe bottom padding
        ════════════════════════════════════════ */}
        <section style={{
          flexShrink: 0,
          borderTop: '1px solid rgba(26,15,0,0.1)',
          padding: isCompactBoard ? '6px 8px 8px' : '10px 12px 20px',
          maxHeight: isCompactBoard ? '38dvh' : '44dvh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          gap: isCompactBoard ? 4 : 8,
        }}>

          {/* Player name + status + secondary actions */}
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', gap: 10,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                fontFamily: "'Bebas Neue', cursive", fontSize: isCompactBoard ? 17 : 20,
                letterSpacing: '0.05em', color: '#1a0f00',
              }}>{localPlayer.name}</span>
              <span style={{
                fontSize: isCompactBoard ? 9 : 10, letterSpacing: '0.12em', textTransform: 'uppercase',
                color: 'rgba(26,15,0,0.28)',
              }}>{humanTurn ? '— your turn' : '— waiting'}</span>
              {localPlayer.saidUno && localPlayer.hand.length <= 2 && (
                <span style={{
                  fontFamily: "'Courier Prime', monospace",
                  fontSize: 8, fontWeight: 700, letterSpacing: '0.14em',
                  background: '#c0392b', color: '#fff8f0', padding: '2px 6px',
                  animation: 'blink 0.9s step-end infinite',
                }}>UNO</span>
              )}
            </div>

            <div style={{ display: 'flex', gap: 6 }}>
              {/* UNO button */}
              <button className="uno-btn"
                onClick={unoReady ? () => sayUno(localPlayerIndex) : undefined}
                disabled={!unoReady}
                style={{
                  fontFamily: "'Bebas Neue', cursive", fontSize: isCompactBoard ? 15 : 18, letterSpacing: '0.1em',
                  background: '#c0392b', color: '#fff8f0',
                  border: '2px solid #922b21', padding: isCompactBoard ? '4px 10px' : '6px 14px',
                  cursor: unoReady ? 'pointer' : 'default',
                  opacity: unoReady ? 1 : 0.28,
                  animation: unoReady ? 'blink 1.4s ease-in-out infinite' : 'none',
                  transition: 'opacity 0.12s',
                }}>UNO!</button>

              {/* Pass button */}
              <button className="pass-btn"
                onClick={passReady ? pass : undefined}
                disabled={!passReady}
                style={{
                  fontFamily: "'Bebas Neue', cursive", fontSize: isCompactBoard ? 15 : 18, letterSpacing: '0.1em',
                  background: 'transparent', color: 'rgba(26,15,0,0.55)',
                  border: '2px solid rgba(26,15,0,0.22)', padding: isCompactBoard ? '4px 10px' : '6px 14px',
                  cursor: passReady ? 'pointer' : 'default',
                  opacity: passReady ? 1 : 0.28,
                  transition: 'opacity 0.12s',
                }}>PASS</button>
            </div>
          </div>

          {/* Card fan — arc-shaped like held in hand */}
          <div style={{ overflowX: 'hidden', width: '100%' }}>
            <div style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              minWidth: 'max-content',
              paddingInline: isCompactBoard ? 8 : 16,
              paddingTop: isCompactBoard ? 10 : 20,
              paddingBottom: isCompactBoard ? 8 : 20,
              minHeight: isCompactBoard ? '6.1rem' : '8rem',
            }}>
              {sortedHand.map((card, i) => {
                const playable  = humanTurn && !botThinking && playableCardIds.has(card.id);
                const isSelected = pendingWild?.id === card.id;

                // Arc calculation
                const mid    = (handCount - 1) / 2;
                const offset = i - mid;
                const rotateDeg  = offset * ARC_SPREAD;
                const liftPx     = Math.abs(offset) * ARC_LIFT;

                return (
                  <div
                    key={card.id}
                    className={playable ? 'playable-card' : ''}
                    style={{
                      marginLeft: i === 0 ? 0 : (isCompactBoard ? -26 : -20),
                      zIndex: i,
                      position: 'relative',
                      // Arc: rotate around bottom-centre + lift edge cards down
                      transform: isSelected
                        ? `rotate(${rotateDeg}deg) translateY(${liftPx - 14}px)`
                        : `rotate(${rotateDeg}deg) translateY(${liftPx}px)`,
                      transformOrigin: 'bottom center',
                      transition: 'transform 0.15s cubic-bezier(0.22,1,0.36,1)',
                      cursor: playable ? 'pointer' : 'default',
                      outline: isSelected ? '2px solid #1a0f00' : 'none',
                      outlineOffset: 3,
                    }}
                    onClick={playable ? () => selectCard(card) : undefined}
                  >
                    <UnoCard
                      card={card}
                      sizeMultiplier={handCardScale}
                      isPlayable={playable}
                      isSelected={isSelected}
                      onClick={undefined}
                    />
                  </div>
                );
              })}
            </div>
          </div>


          {/* Hint */}
          <p style={{
            margin: 0, textAlign: 'center',
            fontFamily: "'Courier Prime', monospace",
            fontSize: isCompactBoard ? 9 : 10, letterSpacing: '0.08em', textTransform: 'uppercase',
            color: 'rgba(26,15,0,0.24)',
          }}>{hint}</p>

        </section>
      </div>

      {showExitConfirm && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 90,
          background: 'rgba(26,15,0,0.42)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
        }}>
          <div style={{
            width: 'min(460px, 100%)',
            background: '#fff8f0',
            border: '2px solid rgba(26,15,0,0.15)',
            padding: 20,
            display: 'grid',
            gap: 14,
            animation: 'modalIn 0.16s ease',
          }}>
            <p style={{
              margin: 0,
              fontFamily: "'Bebas Neue', cursive",
              fontSize: 30,
              letterSpacing: '0.05em',
              color: '#1a0f00',
            }}>
              Leave This Match?
            </p>
            <p style={{
              margin: 0,
              fontFamily: "'Courier Prime', monospace",
              fontSize: 12,
              letterSpacing: '0.04em',
              color: 'rgba(26,15,0,0.6)',
              lineHeight: 1.5,
            }}>
              Your current round will end and you will return to the main menu.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                onClick={() => setShowExitConfirm(false)}
                style={{
                  border: '1px solid rgba(26,15,0,0.2)',
                  background: 'transparent',
                  color: 'rgba(26,15,0,0.65)',
                  padding: '10px 14px',
                  cursor: 'pointer',
                  fontSize: 11,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  fontFamily: "'Courier Prime', monospace",
                }}
              >Stay</button>
              <button
                onClick={confirmExitGame}
                style={{
                  border: 'none',
                  background: '#c0392b',
                  color: '#fff8f0',
                  padding: '10px 16px',
                  cursor: 'pointer',
                  fontSize: 18,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  fontFamily: "'Bebas Neue', cursive",
                }}
              >Exit</button>
            </div>
          </div>
        </div>
      )}

      {isPortraitMobile && !winner && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 85,
          background: 'rgba(255,248,240,0.96)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
          textAlign: 'center',
        }}>
          <div style={{ display: 'grid', gap: 12, maxWidth: 420 }}>
            <p style={{
              margin: 0,
              fontFamily: "'Bebas Neue', cursive",
              fontSize: 38,
              letterSpacing: '0.05em',
              color: '#1a0f00',
            }}>
              Rotate To Landscape
            </p>
            <p style={{
              margin: 0,
              fontFamily: "'Courier Prime', monospace",
              fontSize: 12,
              letterSpacing: '0.04em',
              color: 'rgba(26,15,0,0.62)',
              lineHeight: 1.6,
            }}>
              This board is optimized for wide layout. Rotate your phone sideways for the best play experience.
            </p>
            <button
              onClick={requestLandscapeMode}
              style={{
                border: 'none',
                background: '#1a0f00',
                color: '#fff8f0',
                padding: '12px 16px',
                cursor: 'pointer',
                fontSize: 18,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                fontFamily: "'Bebas Neue', cursive",
              }}
            >Rotate / Fullscreen</button>
          </div>
        </div>
      )}

      {pendingWild && <ColorPicker onSelect={confirmWildColor} onCancel={cancelWild} />}
      {winner && <WinnerScreen winner={winner} onReset={() => { resetGame(); onReset(); }} />}
    </>
  );
}