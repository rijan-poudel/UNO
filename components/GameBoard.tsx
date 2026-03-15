"use client";

import { useEffect, useRef, useState, useCallback, type CSSProperties, type ReactNode } from "react";
import type { Card, CardColor } from "../types/card";
import type { GameState, Player } from "../types/game";
import type { useUnoGame } from "../hooks/useUnoGame";
import UnoCard from "./UnoCard";
import ColorPicker from "./ColorPicker";

export type GameApi = ReturnType<typeof useUnoGame>;

interface GameBoardProps {
  gameApi: GameApi;
  onReset: () => void;
  onDealAgain: () => void;
  onOpenSettings: () => void;
  onCycleTheme: () => void;
  currentThemeLabel: string;
}

const ACTIVE_COLOR_META: Record<
  "red" | "yellow" | "green" | "blue",
  { label: string; bg: string; fg: string }
> = {
  red:    { label: "RED",    bg: "var(--ui-accent-red)",    fg: "#fff8f0" },
  yellow: { label: "YELLOW", bg: "var(--ui-accent-yellow)", fg: "#1a0f00" },
  green:  { label: "GREEN",  bg: "var(--ui-accent-green)",  fg: "#fff8f0" },
  blue:   { label: "BLUE",   bg: "var(--ui-accent-blue)",   fg: "#fff8f0" },
};

const COLOR_ORDER: Record<string, number> = { red: 0, yellow: 1, green: 2, blue: 3, wild: 4 };
const VALUE_ORDER: Record<string, number> = {
  "0": 0, "1": 1, "2": 2, "3": 3, "4": 4,
  "5": 5, "6": 6, "7": 7, "8": 8, "9": 9,
  skip: 10, reverse: 11, draw2: 12, discardAll: 13, wild: 14, wild4: 15, shuffle: 16,
};

const BOT_THINK_DELAY_MS = 10000;
const HUMAN_IDLE_TIMEOUT_MS = 10000;
const HUMAN_IDLE_AFTER_DRAW_TIMEOUT_MS = 10000;
const HUMAN_IDLE_WILD_PICK_TIMEOUT_MS = 10000;
const ACTION_FLASH_HOLD_MS = 980;
const DEAL_ANIMATION_STAGGER_MS = 55;
const DEAL_ANIMATION_DURATION_MS = 320;

function sortHand(cards: Card[]): Card[] {
  return [...cards].sort((a, b) => {
    const cd = (COLOR_ORDER[a.color] ?? 9) - (COLOR_ORDER[b.color] ?? 9);
    return cd !== 0 ? cd : (VALUE_ORDER[a.value] ?? 9) - (VALUE_ORDER[b.value] ?? 9);
  });
}

// ── Live feed ──────────────────────────────────────────────────────────────────
interface FeedEntry { id: number; text: string }

type ActionFlashTone = "red" | "yellow" | "green" | "blue" | "text";

interface ActionFlashState {
  text: string;
  tone: ActionFlashTone;
}

type UiSfx =
  | "cardPlay"
  | "draw"
  | "draw2"
  | "wild4"
  | "shuffleMotion"
  | "skip"
  | "reverse"
  | "wild"
  | "shuffle"
  | "uno"
  | "callOut"
  | "deal"
  | "win"
  | "lose";

const FILE_SFX_SOURCES: Partial<Record<UiSfx, string[]>> = {
  draw2: ["/sfx/%2B2.wav", "/sfx/%2B4.wav"],
  wild4: ["/sfx/%2B4.wav"],
  reverse: ["/sfx/reverse.wav"],
  skip: ["/sfx/skip.wav"],
  win: ["/sfx/victory.wav"],
  lose: ["/sfx/lost.wav"],
};

const FILE_SFX_VOLUME: Partial<Record<UiSfx, number>> = {
  draw2: 0.34,
  wild4: 0.34,
  reverse: 0.3,
  skip: 0.3,
  win: 0.42,
  lose: 0.38,
};

const SYNTH_SFX_GAIN: Partial<Record<UiSfx, number>> = {
  cardPlay: 0.9,
  draw: 0.85,
  draw2: 0.9,
  wild4: 0.85,
  shuffleMotion: 0.7,
  skip: 0.9,
  reverse: 0.9,
  wild: 0.88,
  shuffle: 0.86,
  uno: 0.9,
  callOut: 0.9,
  deal: 0.72,
  win: 0.88,
  lose: 0.82,
};

interface TravelAnimation {
  id: number;
  card: Card;
  faceDown: boolean;
  from: { x: number; y: number };
  to: { x: number; y: number };
  rotationFrom: number;
  rotationTo: number;
  scale: number;
  duration: number;
  started: boolean;
}

function LiveFeed({ entries }: { entries: FeedEntry[] }) {
  if (!entries.length) return null;
  return (
    <div style={{
      position: "fixed", top: 82, right: 14, zIndex: 40,
      display: "flex", flexDirection: "column", alignItems: "flex-end",
      gap: 10, pointerEvents: "none", maxWidth: 320,
    }}>
      {entries.map((e, i) => (
        <div key={e.id} style={{
          fontFamily: "'Courier Prime', monospace",
          fontSize: 10,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: i === 0 ? "var(--ui-text)" : "color-mix(in srgb, var(--ui-muted) 78%, var(--ui-text) 22%)",
          opacity: i === 0 ? 1 : Math.max(0.22, 1 - i * 0.26),
          textShadow: "0 2px 8px rgba(26,15,0,0.22)",
          animation: i === 0 ? "feedIn 0.2s ease" : "none",
          transition: "opacity 0.25s ease",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          maxWidth: "100%",
        }}>{e.text}</div>
      ))}
    </div>
  );
}

function ActionTray({ children }: { children: ReactNode }) {
  return (
    <div style={{
      position: "absolute",
      left: "50%",
      bottom: "calc(100% + 12px)",
      transform: "translateX(-50%)",
      zIndex: 24,
      width: "min(560px, calc(100vw - 16px))",
      background: "var(--ui-surface)",
      border: "1px solid var(--ui-line)",
      padding: "10px 12px",
      display: "grid",
      gap: 10,
      animation: "none",
    }}>
      {children}
    </div>
  );
}

function AnimatedCards({ animations }: { animations: TravelAnimation[] }) {
  if (!animations.length) return null;

  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 50 }}>
      {animations.map((animation) => (
        <div
          key={animation.id}
          style={{
            position: "fixed",
            left: animation.started ? animation.to.x : animation.from.x,
            top: animation.started ? animation.to.y : animation.from.y,
            transform: `translate(-50%, -50%) rotate(${animation.started ? animation.rotationTo : animation.rotationFrom}deg) scale(${animation.scale})`,
            transformOrigin: "center center",
            transition: `left ${animation.duration}ms cubic-bezier(0.22,1,0.36,1), top ${animation.duration}ms cubic-bezier(0.22,1,0.36,1), transform ${animation.duration}ms cubic-bezier(0.22,1,0.36,1), opacity ${animation.duration}ms ease`,
            opacity: animation.started ? 0.92 : 1,
          }}
        >
          <UnoCard card={animation.card} faceDown={animation.faceDown} sizeMultiplier={0.78} />
        </div>
      ))}
    </div>
  );
}

// ── Score tracker ──────────────────────────────────────────────────────────────
// Persists wins per player name across rounds within the same session
function useScoreTracker() {
  const [scores, setScores] = useState<Record<string, number>>({});
  const recordWin = useCallback((name: string) => {
    setScores(prev => ({ ...prev, [name]: (prev[name] ?? 0) + 1 }));
  }, []);
  const reset = useCallback(() => setScores({}), []);
  return { scores, recordWin, reset };
}

// ── Call-out flash overlay ─────────────────────────────────────────────────────
// Big centred flash when you catch someone who forgot UNO
function CallOutFlash({ name }: { name: string }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 87, pointerEvents: "none",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        fontFamily: "'Bebas Neue', cursive",
        fontSize: "clamp(40px, 10vw, 80px)",
        lineHeight: 1,
        color: "var(--ui-accent-red)",
        textAlign: "center",
        animation: "callOutPop 1.1s cubic-bezier(0.22,1,0.36,1) forwards",
      }}>
        😤 {name}<br />forgot UNO!
      </div>
    </div>
  );
}

function ActionFlash({ text, tone }: { text: string; tone: ActionFlashTone }) {
  const colorByTone: Record<ActionFlashTone, string> = {
    red: "var(--ui-accent-red)",
    yellow: "var(--ui-accent-yellow)",
    green: "var(--ui-accent-green)",
    blue: "var(--ui-accent-blue)",
    text: "var(--ui-text)",
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 86,
      pointerEvents: "none",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <div style={{
        fontFamily: "'Bebas Neue', cursive",
        fontSize: "clamp(60px, 16vw, 170px)",
        lineHeight: 0.9,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        color: colorByTone[tone],
        textShadow: "0 10px 26px rgba(0,0,0,0.30), 0 0 24px color-mix(in srgb, var(--ui-surface) 45%, var(--ui-bg) 55%)",
        animation: "actionFlashPop 1s cubic-bezier(0.22,1,0.36,1) forwards",
      }}>{text}</div>
    </div>
  );
}

function VictoryConfetti() {
  const palette = ["#c0392b", "#d4a017", "#1e6b3a", "#1a4f8a", "#fff8f0"];
  const pieces = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    left: `${(i * 97) % 100}%`,
    delay: `${(i % 9) * 0.11}s`,
    duration: `${2.1 + ((i % 7) * 0.22)}s`,
    color: palette[i % palette.length],
    size: 8 + (i % 5),
    rotate: (i * 29) % 360,
  }));

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 58,
      pointerEvents: "none",
      overflow: "hidden",
    }}>
      {pieces.map((piece) => (
        <span
          key={piece.id}
          style={{
            position: "absolute",
            left: piece.left,
            top: "-12%",
            width: piece.size,
            height: piece.size * 2.4,
            background: piece.color,
            borderRadius: 2,
            opacity: 0.92,
            transform: `rotate(${piece.rotate}deg)`,
            animation: `confettiFall ${piece.duration} linear ${piece.delay} infinite`,
            boxShadow: "0 2px 8px rgba(0,0,0,0.16)",
          }}
        />
      ))}
    </div>
  );
}

// ── Opponent strip ─────────────────────────────────────────────────────────────
function OpponentStrip({
  player, isCurrentTurn, canCallOut, onCallOut, cardScale, compact = false,
}: {
  player: Player; isCurrentTurn: boolean;
  canCallOut: boolean; onCallOut: () => void; cardScale: number;
  compact?: boolean;
}) {
  const n = player.hand.length;
  const opponentCardScale = cardScale * (compact ? 0.72 : 0.88);
  const fans = Math.min(n, compact ? 4 : 6);
  const overlap = Math.round((compact ? 18 : 26) * opponentCardScale);
  const fanWidth = Math.max(28, (82 * opponentCardScale) + Math.max(0, fans - 1) * overlap);
  const fanHeight = 122 * opponentCardScale + 8;
  const fanMid = (fans - 1) / 2;

  return (
    <button
      type="button"
      onClick={canCallOut ? onCallOut : undefined}
      style={{
      background: "transparent",
      border: canCallOut ? "1px solid var(--ui-accent-red)" : "1px solid transparent",
      padding: canCallOut ? "0 6px 4px" : "0 6px 4px",
      cursor: canCallOut ? "pointer" : "default",
      textAlign: "center",
      display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
      opacity: canCallOut ? 1 : isCurrentTurn ? 1 : 0.38,
      transition: "opacity 0.3s ease",
      position: "relative",
      animation: canCallOut ? "callOutAttention 0.7s ease-in-out infinite alternate" : "none",
    }}>

      {/* Fanned face-down cards */}
      <div style={{
        position: "relative",
        height: fanHeight,
        width: fanWidth,
        marginTop: 0,
        flexShrink: 0,
      }}>
        {fans === 0 ? (
          <span style={{ fontFamily: "'Courier Prime', monospace", fontSize: 9, color: "var(--ui-muted)" }}>empty</span>
        ) : Array.from({ length: fans }).map((_, i) => (
          <div key={i} style={{
            position: "absolute",
            left: i * overlap,
            top: -Math.abs(i - fanMid) * (2.4 * opponentCardScale),
            transform: `rotate(${(i - fanMid) * -7}deg)`,
            transformOrigin: "top center",
            zIndex: i,
            transition: "transform 0.2s ease, opacity 0.2s ease",
          }}>
            <UnoCard
              card={{ id: `_opp-${player.id}-${i}`, color: "wild", value: "wild" }}
              faceDown sizeMultiplier={opponentCardScale}
            />
          </div>
        ))}
      </div>

      {/* Name row */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {isCurrentTurn && (
          <span style={{
            width: 5, height: 5, borderRadius: "50%",
            background: "var(--ui-accent-red)", display: "inline-block",
            animation: "dot 1.1s ease-in-out infinite", flexShrink: 0,
          }} />
        )}
        <span style={{
          fontFamily: "'Bebas Neue', cursive",
          fontSize: compact ? 13 : 16,
          letterSpacing: "0.05em",
          color: canCallOut ? "var(--ui-accent-red)" : "var(--ui-text)",
        }}>
          {player.isBot ? "⌘ " : ""}{player.name}
        </span>
        {player.saidUno && n === 1 && (
          <span style={{
            fontFamily: "'Courier Prime', monospace",
            fontSize: 8, fontWeight: 700, letterSpacing: "0.12em",
            background: "var(--ui-accent-red)", color: "#fff", padding: "2px 5px",
            animation: isCurrentTurn ? "blink 0.9s step-end infinite" : "none",
          }}>UNO</span>
        )}
      </div>

      <span style={{
        fontFamily: "'Courier Prime', monospace",
        fontSize: compact ? 8 : 9,
        color: canCallOut ? "var(--ui-accent-red)" : "var(--ui-muted)",
        letterSpacing: "0.06em",
      }}>{n} {n === 1 ? "card" : "cards"}</span>
      {canCallOut && (
        <span style={{
          fontFamily: "'Courier Prime', monospace",
          fontSize: compact ? 7 : 8,
          fontWeight: 700,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "var(--ui-accent-red)",
        }}>Click to call UNO</span>
      )}
    </button>
  );
}

// ── Winner screen ──────────────────────────────────────────────────────────────
function WinnerScreen({
  winner, onReset, onDealAgain, scores, players,
}: {
  winner: Player; onReset: () => void; onDealAgain: () => void; scores: Record<string, number>; players: string[];
}) {
  const leaders = players
    .map((name) => [name, scores[name] ?? 0] as const)
    .sort((a, b) => b[1] - a[1]);
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 60, background: "var(--ui-bg)",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexDirection: "column", gap: 24, animation: "fadeUp 0.28s ease",
      padding: 24,
    }}>
      <div style={{ textAlign: "center" }}>
        <p style={{
          fontFamily: "'Courier Prime', monospace", fontSize: 11,
          letterSpacing: "0.22em", textTransform: "uppercase",
          color: "var(--ui-muted)", margin: "0 0 16px",
        }}>— round over —</p>
        <h1 style={{
          fontFamily: "'Bebas Neue', cursive", fontSize: "clamp(56px, 13vw, 100px)",
          letterSpacing: "0.04em", color: "var(--ui-text)", margin: 0, lineHeight: 1,
        }}>{winner.name}</h1>
        <p style={{
          fontFamily: "'Courier Prime', monospace", fontSize: 13,
          color: "var(--ui-muted)", margin: "14px 0 0", letterSpacing: "0.08em",
        }}>wins the round</p>
      </div>

      {/* Session scoreboard */}
      {leaders.length > 0 && (
        <div style={{
          width: "min(360px, 100%)",
          border: "1px solid var(--ui-line)",
        }}>
          <p style={{
            fontFamily: "'Courier Prime', monospace", fontSize: 9,
            letterSpacing: "0.2em", textTransform: "uppercase",
            color: "var(--ui-muted)", margin: 0,
            padding: "6px 12px",
            borderBottom: "1px solid var(--ui-line)",
          }}>Session scores</p>
          {leaders.map(([name, wins]) => (
            <div key={name} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "8px 12px",
              borderBottom: "1px solid var(--ui-line)",
            }}>
              <span style={{
                fontFamily: "'Bebas Neue', cursive", fontSize: 18,
                letterSpacing: "0.04em", color: "var(--ui-text)",
              }}>{name}</span>
              <span style={{
                fontFamily: "'Courier Prime', monospace", fontSize: 13,
                fontWeight: 700, color: "var(--ui-text)",
              }}>{wins} {wins === 1 ? "win" : "wins"}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={onReset} style={{
          fontFamily: "'Courier Prime', monospace", fontSize: 11, fontWeight: 700,
          letterSpacing: "0.1em", textTransform: "uppercase",
          background: "transparent", border: "1px solid var(--ui-line)",
          color: "var(--ui-muted)", padding: "12px 20px", cursor: "pointer",
          transition: "color 0.12s",
        }}
          onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = "var(--ui-text)")}
          onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = "var(--ui-muted)")}
        >New players</button>
        <button onClick={onDealAgain} style={{
          fontFamily: "'Bebas Neue', cursive", fontSize: 22, letterSpacing: "0.14em",
          background: "var(--ui-text)", color: "var(--ui-bg)",
          border: "none", padding: "12px 36px", cursor: "pointer", transition: "opacity 0.12s",
        }}
          onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.opacity = "0.7")}
          onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.opacity = "1")}
        >Deal again</button>
      </div>
    </div>
  );
}

// ── Main board ─────────────────────────────────────────────────────────────────
export default function GameBoard({
  gameApi, onReset, onDealAgain, onOpenSettings, onCycleTheme, currentThemeLabel,
}: GameBoardProps) {
  const {
    game, localPlayerIndex, pendingWild, drawnThisTurn, botThinking,
    log, currentPlayer, localPlayer, isLocalTurn, playableCardIds,
    selectCard, confirmWildColor, cancelWild, drawCard, pass, sayUno, callOut, resetGame,
  } = gameApi;

  const hasPendingStackOption =
    "hasPendingStackOption" in gameApi
      ? Boolean((gameApi as { hasPendingStackOption?: boolean }).hasPendingStackOption)
      : false;

  const wildPickerPlayerName =
    "wildPickerPlayerName" in gameApi
      ? ((gameApi as { wildPickerPlayerName?: string | null }).wildPickerPlayerName ?? null)
      : null;

  const [feed, setFeed] = useState<FeedEntry[]>([]);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showUnoFlash, setShowUnoFlash] = useState(false);
  const [actionFlash, setActionFlash] = useState<ActionFlashState | null>(null);
  const [callOutFlashName, setCallOutFlashName] = useState<string | null>(null);
  const [isNarrowMobile, setIsNarrowMobile] = useState(false);
  const [isCompactBoard, setIsCompactBoard] = useState(false);
  const [boardScale, setBoardScale] = useState(1);
  const [drawnCardId, setDrawnCardId] = useState<string | null>(null);
  const [highlightedDrawnCardId, setHighlightedDrawnCardId] = useState<string | null>(null);
  const [drawDecisionCardId, setDrawDecisionCardId] = useState<string | null>(null);
  const [hoveredHandPosition, setHoveredHandPosition] = useState<number | null>(null);
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [animations, setAnimations] = useState<TravelAnimation[]>([]);
  const [turnCountdownSeconds, setTurnCountdownSeconds] = useState(0);
  const turnTransitionLocked = actionFlash !== null;

  const { scores, recordWin } = useScoreTracker();
  const feedCounter = useRef(0);
  const prevLogRef = useRef<string[]>([]);
  const prevWinnerRef = useRef<string | null>(null);
  const prevActionKeyRef = useRef<string | null>(null);
  const prevGameRef = useRef<GameState | null>(null);
  const actionFlashTimerRef = useRef<number | null>(null);
  const autoActionExecuteTimerRef = useRef<number | null>(null);
  const turnTimerKeyRef = useRef<string | null>(null);
  const turnTimerDeadlineRef = useRef<number>(0);
  const prevLocalHandIdsRef = useRef<string[]>([]);
  const pendingPlayRectRef = useRef<{ cardId: string; x: number; y: number } | null>(null);
  const animationCounterRef = useRef(0);
  const dealAnimationKeyRef = useRef<string | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const fileSfxRef = useRef<Record<string, HTMLAudioElement>>({});
  const lastMotionSfxAtRef = useRef(0);
  const drawPileRef = useRef<HTMLButtonElement | null>(null);
  const discardPileRef = useRef<HTMLDivElement | null>(null);
  const localHandRef = useRef<HTMLDivElement | null>(null);
  const playerZoneRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const handCardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const getElementCenter = useCallback((element: HTMLElement | null) => {
    if (!element) return null;
    const rect = element.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }, []);

  const queueAnimation = useCallback((animation: Omit<TravelAnimation, "id" | "started">) => {
    animationCounterRef.current += 1;
    const id = animationCounterRef.current;

    setAnimations((prev) => [...prev, { ...animation, id, started: false }]);

    window.setTimeout(() => {
      setAnimations((prev) => prev.map((item) => (item.id === id ? { ...item, started: true } : item)));
    }, 16);

    window.setTimeout(() => {
      setAnimations((prev) => prev.filter((item) => item.id !== id));
    }, animation.duration + 120);
  }, []);

  const animateDrawToPlayer = useCallback((playerId: string, count: number) => {
    const from = getElementCenter(drawPileRef.current);
    const to = playerId === localPlayer?.id
      ? getElementCenter(localHandRef.current)
      : getElementCenter(playerZoneRefs.current[playerId] ?? null);

    if (!from || !to) return;

    const visibleCount = Math.min(count, 4);
    for (let index = 0; index < visibleCount; index += 1) {
      const offset = (index - (visibleCount - 1) / 2) * 12;
      window.setTimeout(() => {
        queueAnimation({
          card: { id: `_anim-draw-${playerId}-${index}`, color: "wild", value: "wild" },
          faceDown: true,
          from: { x: from.x + offset * 0.4, y: from.y - index * 2 },
          to: { x: to.x + offset, y: to.y + (playerId === localPlayer?.id ? -18 : 0) },
          rotationFrom: -10 + index * 4,
          rotationTo: 6 - index * 3,
          scale: 0.9,
          duration: 300,
        });
      }, index * 70);
    }
  }, [getElementCenter, localPlayer?.id, queueAnimation]);

  const animatePlayToDiscard = useCallback((playerId: string, card: Card) => {
    const to = getElementCenter(discardPileRef.current);
    if (!to) return;

    const pendingLocal = pendingPlayRectRef.current;
    const from = playerId === localPlayer?.id && pendingLocal && pendingLocal.cardId === card.id
      ? { x: pendingLocal.x, y: pendingLocal.y }
      : playerId === localPlayer?.id
        ? getElementCenter(localHandRef.current)
        : getElementCenter(playerZoneRefs.current[playerId] ?? null);

    pendingPlayRectRef.current = null;
    if (!from) return;

    queueAnimation({
      card,
      faceDown: false,
      from,
      to,
      rotationFrom: playerId === localPlayer?.id ? 0 : -8,
      rotationTo: -4,
      scale: 0.92,
      duration: 280,
    });
  }, [getElementCenter, localPlayer?.id, queueAnimation]);

  const animateDiscardAllToDiscard = useCallback((playerId: string, color: CardColor, count: number) => {
    if (count <= 0) return;

    const to = getElementCenter(discardPileRef.current);
    const from = playerId === localPlayer?.id
      ? getElementCenter(localHandRef.current)
      : getElementCenter(playerZoneRefs.current[playerId] ?? null);

    if (!from || !to) return;

    const visibleCount = Math.min(count, 7);
    for (let index = 0; index < visibleCount; index += 1) {
      const spread = (index - (visibleCount - 1) / 2) * 10;
      window.setTimeout(() => {
        queueAnimation({
          card: { id: `_anim-discard-all-${playerId}-${index}`, color, value: '0' },
          faceDown: false,
          from: {
            x: from.x + spread,
            y: from.y - Math.abs(spread) * 0.22,
          },
          to: {
            x: to.x + (spread * 0.45),
            y: to.y - (index % 3),
          },
          rotationFrom: -18 + (index * 5),
          rotationTo: -5 + (index * 3),
          scale: 0.88,
          duration: 260,
        });
      }, index * 58);
    }
  }, [getElementCenter, localPlayer?.id, queueAnimation]);

  const animateDealSequence = useCallback((
    playerOrder: string[],
    cardsPerPlayer: number[],
    source: 'draw' | 'discard' = 'draw',
  ) => {
    const sourceElement = source === 'discard' ? discardPileRef.current : drawPileRef.current;
    const fallbackSource = source === 'discard' ? drawPileRef.current : discardPileRef.current;
    const from = getElementCenter(sourceElement) ?? getElementCenter(fallbackSource);

    if (!from) return;

    const maxCards = Math.max(0, ...cardsPerPlayer);
    let step = 0;

    for (let round = 0; round < maxCards; round += 1) {
      playerOrder.forEach((playerId, playerIndex) => {
        const count = cardsPerPlayer[playerIndex] ?? 0;
        if (round >= count) return;

        const to = playerId === localPlayer?.id
          ? getElementCenter(localHandRef.current)
          : getElementCenter(playerZoneRefs.current[playerId] ?? null);
        if (!to) return;

        const fanOffset = ((round % 5) - 2) * 10;
        const stepIndex = step;
        step += 1;

        window.setTimeout(() => {
          queueAnimation({
            card: { id: `_anim-deal-${playerId}-${round}-${stepIndex}`, color: 'wild', value: 'wild' },
            faceDown: true,
            from: { x: from.x, y: from.y },
            to: {
              x: to.x + fanOffset,
              y: to.y + (playerId === localPlayer?.id ? -14 : 0) - ((round % 3) * 2),
            },
            rotationFrom: -12 + ((stepIndex % 4) * 4),
            rotationTo: -6 + ((round % 5) * 3),
            scale: 0.86,
            duration: DEAL_ANIMATION_DURATION_MS,
          });
        }, stepIndex * DEAL_ANIMATION_STAGGER_MS);
      });
    }
  }, [getElementCenter, localPlayer?.id, queueAnimation]);

  const handleSelectCard = useCallback((card: Card, element: HTMLDivElement | null) => {
    if (element) {
      const rect = element.getBoundingClientRect();
      pendingPlayRectRef.current = {
        cardId: card.id,
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    }

    selectCard(card);
  }, [selectCard]);

  const playSynthSfx = useCallback((event: UiSfx) => {
    try {
      const AC = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      if (!audioCtxRef.current) audioCtxRef.current = new AC();
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        void ctx.resume();
      }
      const now = ctx.currentTime;
      const gainScale = SYNTH_SFX_GAIN[event] ?? 0.85;

      const playTone = (
        at: number,
        freq: number,
        duration: number,
        type: OscillatorType,
        gainPeak: number,
        slideTo?: number,
      ) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, at);
        if (slideTo) {
          osc.frequency.exponentialRampToValueAtTime(slideTo, at + duration);
        }
        gain.gain.setValueAtTime(0.0001, at);
        gain.gain.exponentialRampToValueAtTime(gainPeak * gainScale, at + Math.min(0.02, duration * 0.4));
        gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(at);
        osc.stop(at + duration + 0.01);
      };

      switch (event) {
        case "cardPlay":
          playTone(now, 420, 0.08, "triangle", 0.024, 360);
          break;
        case "draw":
          playTone(now, 270, 0.09, "sine", 0.02, 210);
          break;
        case "draw2":
          playTone(now, 290, 0.08, "square", 0.02, 240);
          playTone(now + 0.08, 240, 0.08, "square", 0.02, 190);
          break;
        case "wild4":
          playTone(now, 360, 0.1, "sawtooth", 0.02, 220);
          playTone(now + 0.11, 220, 0.12, "sawtooth", 0.022, 150);
          break;
        case "shuffleMotion":
          playTone(now, 330, 0.055, "sawtooth", 0.016, 270);
          playTone(now + 0.045, 260, 0.055, "sawtooth", 0.016, 320);
          playTone(now + 0.09, 360, 0.06, "triangle", 0.014, 290);
          break;
        case "skip":
          playTone(now, 640, 0.07, "square", 0.02);
          playTone(now + 0.08, 520, 0.07, "square", 0.018);
          break;
        case "reverse":
          playTone(now, 260, 0.09, "triangle", 0.02, 480);
          playTone(now + 0.09, 480, 0.08, "triangle", 0.018, 300);
          break;
        case "wild":
          playTone(now, 320, 0.08, "sine", 0.018, 520);
          playTone(now + 0.09, 560, 0.09, "triangle", 0.018, 700);
          break;
        case "shuffle":
          playTone(now, 280, 0.07, "sawtooth", 0.016, 460);
          playTone(now + 0.07, 360, 0.07, "sawtooth", 0.016, 240);
          playTone(now + 0.14, 300, 0.08, "triangle", 0.018, 520);
          break;
        case "uno":
          playTone(now, 610, 0.09, "triangle", 0.024);
          playTone(now + 0.1, 760, 0.1, "triangle", 0.022);
          break;
        case "callOut":
          playTone(now, 210, 0.1, "sawtooth", 0.02, 170);
          playTone(now + 0.1, 170, 0.12, "sawtooth", 0.02, 140);
          break;
        case "deal":
          playTone(now, 360, 0.05, "triangle", 0.013, 300);
          break;
        case "win":
          playTone(now, 520, 0.12, "triangle", 0.022, 760);
          playTone(now + 0.12, 760, 0.14, "triangle", 0.022, 980);
          break;
        case "lose":
          playTone(now, 260, 0.11, "triangle", 0.02, 180);
          playTone(now + 0.12, 180, 0.16, "triangle", 0.02, 120);
          break;
      }
    } catch {
      // Audio can fail due to browser policies; ignore gracefully.
    }
  }, []);

  const playUiSfx = useCallback((event: UiSfx) => {
    const fileCandidates = FILE_SFX_SOURCES[event] ?? [];
    if (typeof window !== "undefined" && typeof Audio !== "undefined" && fileCandidates.length > 0) {
      for (const src of fileCandidates) {
        let audio = fileSfxRef.current[src];
        if (!audio) {
          audio = new Audio(src);
          audio.preload = "auto";
          fileSfxRef.current[src] = audio;
        }
        audio.volume = FILE_SFX_VOLUME[event] ?? 0.34;

        audio.currentTime = 0;
        const playResult = audio.play();
        if (playResult && typeof playResult.then === "function") {
          void playResult.catch(() => {
            // If file playback fails, keep UX stable with synth fallback.
            playSynthSfx(event);
          });
        }
        return;
      }
    }

    playSynthSfx(event);
  }, [playSynthSfx]);

  const playMotionShuffleSfx = useCallback(() => {
    const now = Date.now();
    if (now - lastMotionSfxAtRef.current < 120) return;
    lastMotionSfxAtRef.current = now;
    playUiSfx("shuffleMotion");
  }, [playUiSfx]);

  const triggerActionFlash = useCallback((text: string, tone: ActionFlashTone) => {
    if (actionFlashTimerRef.current !== null) {
      window.clearTimeout(actionFlashTimerRef.current);
    }
    setActionFlash({ text, tone });
    actionFlashTimerRef.current = window.setTimeout(() => {
      setActionFlash(null);
      actionFlashTimerRef.current = null;
    }, ACTION_FLASH_HOLD_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (actionFlashTimerRef.current !== null) {
        window.clearTimeout(actionFlashTimerRef.current);
      }
      if (autoActionExecuteTimerRef.current !== null) {
        window.clearTimeout(autoActionExecuteTimerRef.current);
      }
    };
  }, []);

  // Record wins as they happen
  useEffect(() => {
    if (game?.winnerId) {
      const winner = game.players.find(p => p.id === game.winnerId);
      if (winner && prevWinnerRef.current !== game.winnerId) {
        prevWinnerRef.current = game.winnerId;
        recordWin(winner.name);
        playUiSfx(winner.id === localPlayer?.id ? "win" : "lose");
      }
    } else {
      prevWinnerRef.current = null;
    }
  }, [game?.winnerId, game?.players, localPlayer?.id, playUiSfx, recordWin]);

  useEffect(() => {
    if (!log.length) return;
    const newest = log[0];
    if (newest && newest !== prevLogRef.current[0]) {
      feedCounter.current += 1;
      const id = feedCounter.current;
      setFeed(prev => [{ id, text: newest }, ...prev].slice(0, 5));
      prevLogRef.current = log;
      const t = window.setTimeout(() => setFeed(prev => prev.filter(e => e.id !== id)), 4000);
      return () => window.clearTimeout(t);
    }
  }, [log]);

  useEffect(() => {
    const update = () => {
      const portrait = window.matchMedia("(orientation: portrait)").matches;
      const mobileLike = Math.min(window.innerWidth, window.innerHeight) <= 900;
      const shortViewport = window.innerHeight < 760;
      const narrowViewport = window.innerWidth < 1100;
      const tinyViewport = window.innerHeight < 680;
      const narrowPhone = window.innerWidth < 720;
      setIsNarrowMobile(mobileLike && narrowPhone);
      setIsCompactBoard(shortViewport || narrowViewport || (portrait && mobileLike));
      setBoardScale(
        portrait && mobileLike
          ? (tinyViewport ? 0.64 : 0.72)
          : tinyViewport
            ? 0.82
            : shortViewport || narrowViewport
              ? 0.9
              : 1,
      );
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => { window.removeEventListener("resize", update); window.removeEventListener("orientationchange", update); };
  }, []);

  useEffect(() => {
    if (!game || !localPlayer) return;

    const currentIds = localPlayer.hand.map((card) => card.id);
    const previousIds = prevLocalHandIdsRef.current;

    if (previousIds.length > 0 && currentIds.length > previousIds.length) {
      const newCard = localPlayer.hand.find((card) => !previousIds.includes(card.id)) ?? null;
      if (newCard) {
        prevLocalHandIdsRef.current = currentIds;
        const revealTimer = window.setTimeout(() => {
          setDrawnCardId(newCard.id);
          setHighlightedDrawnCardId(newCard.id);
        }, 0);
        const glowTimer = window.setTimeout(() => {
          setHighlightedDrawnCardId((active) => (active === newCard.id ? null : active));
        }, 1800);
        return () => {
          window.clearTimeout(revealTimer);
          window.clearTimeout(glowTimer);
        };
      }
    }

    prevLocalHandIdsRef.current = currentIds;
  }, [game, localPlayer]);

  useEffect(() => {
    if (!drawnCardId) return;
    const element = handCardRefs.current[drawnCardId];
    if (!element) return;
    element.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [drawnCardId]);

  useEffect(() => {
    if (!game) return;
    if (game.lastAction.type !== 'init') return;

    const animationKey = game.players
      .map((player) => `${player.id}:${player.hand.map((card) => card.id).join(',')}`)
      .join('|');

    if (dealAnimationKeyRef.current === animationKey) return;
    dealAnimationKeyRef.current = animationKey;
    playUiSfx("deal");
    playMotionShuffleSfx();

    const timer = window.setTimeout(() => {
      animateDealSequence(
        game.players.map((player) => player.id),
        game.players.map((player) => player.hand.length),
        'draw',
      );
    }, 120);

    return () => window.clearTimeout(timer);
  }, [game, animateDealSequence, playMotionShuffleSfx, playUiSfx]);

  useEffect(() => {
    if (!game) return;
    const previous = prevGameRef.current;

    const actionKey = `${game.turnCount}:${JSON.stringify(game.lastAction)}`;
    if (prevActionKeyRef.current === actionKey) return;
    prevActionKeyRef.current = actionKey;

    const action = game.lastAction;
    if (action.type === "draw") {
      playUiSfx("draw");
      animateDrawToPlayer(action.playerId, action.count);
      return;
    }

    if (action.type === "callOut") {
      playUiSfx("callOut");
      const timer = window.setTimeout(() => {
        animateDrawToPlayer(action.targetId, action.penalty);
      }, ACTION_FLASH_HOLD_MS + 40);
      return () => window.clearTimeout(timer);
    }

    if (action.type === "play") {
      playMotionShuffleSfx();
      animatePlayToDiscard(action.playerId, action.card);

      if (action.card.value === "skip") playUiSfx("skip");
      else if (action.card.value === "reverse") playUiSfx("reverse");
      else if (action.card.value === "draw2") playUiSfx("draw2");
      else if (action.card.value === "wild4") playUiSfx("wild4");
      else if (action.card.value === "wild") playUiSfx("wild");
      else if (action.card.value === "shuffle") playUiSfx("shuffle");
      else playUiSfx("cardPlay");

      if (action.card.value === 'discardAll' && action.discardAllCount && action.discardAllCount > 0) {
        playMotionShuffleSfx();
        const timer = window.setTimeout(() => {
          animateDiscardAllToDiscard(action.playerId, action.card.color, action.discardAllCount ?? 0);
        }, 120);
        return () => window.clearTimeout(timer);
      }

      if (action.shuffledHands && previous) {
        const actorIndex = previous.players.findIndex((player) => player.id === action.playerId);
        if (actorIndex >= 0) {
          const order = Array.from({ length: game.players.length }, (_, index) => {
            const seat = (actorIndex + previous.direction + (index * previous.direction) + game.players.length * 4) % game.players.length;
            return game.players[seat]?.id;
          }).filter((playerId): playerId is string => Boolean(playerId));

          const counts = order.map((playerId) => game.players.find((player) => player.id === playerId)?.hand.length ?? 0);
          const timer = window.setTimeout(() => {
            playMotionShuffleSfx();
            animateDealSequence(order, counts, 'discard');
          }, 120);
          return () => window.clearTimeout(timer);
        }
      }
    }
  }, [game, animateDealSequence, animateDiscardAllToDiscard, animateDrawToPlayer, animatePlayToDiscard, playMotionShuffleSfx, playUiSfx]);

  useEffect(() => {
    if (!game || !localPlayer) return;

    const previous = prevGameRef.current;
    prevGameRef.current = game;
    if (!previous) return;

    const action = game.lastAction;
    const queueActionFlash = (text: string, tone: ActionFlashTone) => {
      window.setTimeout(() => {
        triggerActionFlash(text, tone);
      }, 0);
    };

    if (action.type === "play") {
      const chosenColor = action.chosenColor && action.chosenColor !== "wild" ? action.chosenColor : null;
      const chosenTone = (chosenColor ?? "text") as ActionFlashTone;
      const chosenLabel = chosenColor ? chosenColor.toUpperCase() : null;

      if (action.card.value === "reverse") {
        queueActionFlash("Reverse", "blue");
        return;
      }

      if (action.card.value === "skip") {
        queueActionFlash("SKIP", "yellow");
        return;
      }

      if (action.card.value === "draw2") {
        return;
      }

      if (action.card.value === "wild4") {
        return;
      }

      if (action.card.value === "wild") {
        queueActionFlash(chosenLabel ?? "Wild", chosenTone);
        return;
      }

      if (action.card.value === "discardAll") {
        return;
      }

      if (action.card.value === "shuffle") {
        queueActionFlash(chosenLabel ? `Shuffle • ${chosenLabel}` : "Shuffle", chosenLabel ? chosenTone : "blue");
      }
      return;
    }

    if (action.type === "declareUno") {
      playUiSfx("uno");
      queueActionFlash("UNO", "red");
      return;
    }

    if (action.type === "callOut") {
      if (action.callerId === action.targetId) {
        queueActionFlash(`FALSE CALL +${action.penalty}`, "red");
        return;
      }
      const callerName = game.players.find((player) => player.id === action.callerId)?.name ?? "Player";
      const targetName = game.players.find((player) => player.id === action.targetId)?.name ?? "Player";
      const calledYou = action.targetId === localPlayer.id;
      queueActionFlash(
        calledYou ? `CALLED OUT +${action.penalty}` : `${callerName} CALLED ${targetName}`,
        "red",
      );
      return;
    }

  }, [game, localPlayer, playUiSfx, triggerActionFlash]);

  const confirmExitGame = () => { setShowExitConfirm(false); resetGame(); onReset(); };

  const declareUno = useCallback(() => {
    if (!game || !localPlayer || game.winnerId) return;
    if (localPlayer.isBot) return;
    sayUno(localPlayerIndex);
    setShowUnoFlash(true);
    window.setTimeout(() => setShowUnoFlash(false), 900);
  }, [game, localPlayer, sayUno, localPlayerIndex]);

  // Wrap callOut to also show the flash
  const handleCallOut = useCallback((callerIdx: number, targetIdx: number, targetName: string) => {
    callOut(callerIdx, targetIdx);
    setCallOutFlashName(targetName);
    window.setTimeout(() => setCallOutFlashName(null), 1100);
  }, [callOut]);

  // Keyboard shortcuts: Space = draw, U = UNO
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Don't fire if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        if (!game || !localPlayer || !currentPlayer || game.winnerId) return;
        const isHumanTurn = isLocalTurn && !localPlayer.isBot;
        const isDrawDisabled = botThinking || turnTransitionLocked || (drawnThisTurn && game.pendingDraw === 0) || !isHumanTurn;
        if (!isDrawDisabled) drawCard();
      }
      if (e.key === "u" || e.key === "U") {
        e.preventDefault();
        declareUno();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    game,
    localPlayer,
    currentPlayer,
    isLocalTurn,
    botThinking,
    turnTransitionLocked,
    drawnThisTurn,
    drawCard,
    declareUno,
  ]);

  useEffect(() => {
    if (!game || !localPlayer || !currentPlayer) return;
    if (turnTransitionLocked) return;
    if (autoActionExecuteTimerRef.current !== null) return;
    const isHumanTurn = isLocalTurn && !localPlayer.isBot && !game.winnerId;
    const mustAutoDrawRequiredNow = isHumanTurn && game.pendingDraw > 0 && !hasPendingStackOption;
    if (!mustAutoDrawRequiredNow) return;

    const timer = window.setTimeout(() => {
      autoActionExecuteTimerRef.current = window.setTimeout(() => {
        autoActionExecuteTimerRef.current = null;
        drawCard();
      }, 120);
    }, 650);
    return () => {
      window.clearTimeout(timer);
    };
  }, [
    game,
    localPlayer,
    currentPlayer,
    isLocalTurn,
    turnTransitionLocked,
    hasPendingStackOption,
    triggerActionFlash,
    drawCard,
  ]);

  useEffect(() => {
    if (!game || !localPlayer || !currentPlayer || !drawnCardId) return;

    const revealedCard = localPlayer.hand.find((card) => card.id === drawnCardId) ?? null;
    if (!revealedCard) return;
    const isPlayableDrawnCard = playableCardIds.has(revealedCard.id);
    const shouldShowDrawDecision = Boolean(
      isLocalTurn
      && !localPlayer.isBot
      && drawnThisTurn
      && isPlayableDrawnCard
    );

    if (!shouldShowDrawDecision) {
      const clearTimer = window.setTimeout(() => setDrawDecisionCardId(null), 0);
      return () => window.clearTimeout(clearTimer);
    }

    const revealedCardId = revealedCard.id;
    const timer = window.setTimeout(() => setDrawDecisionCardId(revealedCardId), 0);
    return () => window.clearTimeout(timer);
  }, [
    game,
    localPlayer,
    currentPlayer,
    drawnCardId,
    isLocalTurn,
    drawnThisTurn,
    playableCardIds,
  ]);

  useEffect(() => {
    if (drawnThisTurn) return;
    const timer = window.setTimeout(() => setDrawDecisionCardId(null), 0);
    return () => window.clearTimeout(timer);
  }, [drawnThisTurn, game?.turnCount, game?.currentPlayerIndex]);

  useEffect(() => {
    if (!game || !currentPlayer || game.winnerId) {
      turnTimerKeyRef.current = null;
      turnTimerDeadlineRef.current = 0;
      const clearTimer = window.setTimeout(() => setTurnCountdownSeconds(0), 0);
      return () => window.clearTimeout(clearTimer);
    }

    const turnKey = `${game.turnCount}:${game.currentPlayerIndex}`;
    let durationMs = 0;
    if (currentPlayer.isBot) {
      durationMs = BOT_THINK_DELAY_MS;
    } else if (isLocalTurn) {
      durationMs = pendingWild
        ? HUMAN_IDLE_WILD_PICK_TIMEOUT_MS
        : drawnThisTurn
          ? HUMAN_IDLE_AFTER_DRAW_TIMEOUT_MS
          : HUMAN_IDLE_TIMEOUT_MS;
    }

    const now = Date.now();
    const candidateDeadline = now + durationMs;

    if (turnTimerKeyRef.current !== turnKey) {
      turnTimerKeyRef.current = turnKey;
      turnTimerDeadlineRef.current = candidateDeadline;
    } else if (durationMs === 0) {
      turnTimerDeadlineRef.current = now;
    } else if (turnTimerDeadlineRef.current === 0) {
      turnTimerDeadlineRef.current = candidateDeadline;
    } else {
      // Never extend the same turn timer (avoids "restart" feeling). Only shorten.
      turnTimerDeadlineRef.current = Math.min(turnTimerDeadlineRef.current, candidateDeadline);
    }

    const sync = () => {
      const nextSeconds = Math.max(0, Math.ceil((turnTimerDeadlineRef.current - Date.now()) / 1000));
      setTurnCountdownSeconds(nextSeconds);
    };

    const initialTimer = window.setTimeout(sync, 0);
    const tickTimer = window.setInterval(sync, 1000);

    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(tickTimer);
    };
  }, [
    game,
    game?.turnCount,
    game?.currentPlayerIndex,
    game?.winnerId,
    currentPlayer,
    isLocalTurn,
    pendingWild,
    drawnThisTurn,
  ]);

  if (!game || !localPlayer || !currentPlayer) return null;

  const topDiscard = game.discardPile[game.discardPile.length - 1];
  const winner = game.winnerId ? game.players.find(p => p.id === game.winnerId) : null;
  const humanTurn = isLocalTurn && !localPlayer.isBot && !game.winnerId;
  const drawDisabled = botThinking || turnTransitionLocked || !!game.winnerId || (drawnThisTurn && game.pendingDraw === 0) || !humanTurn;
  const sortedHand = sortHand(localPlayer.hand);
  const handCount = sortedHand.length;
  const opponents = game.players.filter((_, i) => i !== localPlayerIndex);

  const discardDisplayCard: Card | null = topDiscard
    ? topDiscard.color === "wild" && game.activeColor && game.activeColor !== "wild"
      ? { ...topDiscard, color: game.activeColor as CardColor }
      : topDiscard
    : null;

  const activeColorMeta =
    game.activeColor && game.activeColor !== "wild"
      ? ACTIVE_COLOR_META[game.activeColor as "red" | "yellow" | "green" | "blue"]
      : null;
  void activeColorMeta;

  const pileCardScale = boardScale;

  // Dynamic hand card scale: shrink cards so they always fit above the info row.
  // Budget = total viewport height
  //   minus opponents section (~120px typical)
  //   minus table area (piles ~170px + status ~20px + gaps ~30px = ~220px)
  //   minus info row (~36px)
  //   minus border + padding (~20px)
  // That leaves the remaining space for the card fan.
  // Card height at scale s = 122 * s. We add 40px for top padding + arc lift.
  // Solve: 122 * s + 40 <= budget  →  s = (budget - 40) / 122
  // Clamp between 0.65 (min readable) and 1.3 (max comfortable).
  const unoButtonVisible = !localPlayer.isBot && !game.winnerId;

  const viewportH = typeof window !== "undefined" ? window.innerHeight : 700;
  const viewportW = typeof window !== "undefined" ? window.innerWidth : 1200;
  const cardBudgetPx = viewportH - 120 - 220 - 36 - 20;
  const scaledByHeight = Math.max(0.65, Math.min(1.3, (cardBudgetPx - 40) / 122));
  const reservedRightPx = 0;
  const availableHandWidth = Math.max(220, viewportW - (isCompactBoard ? 34 : 52) - reservedRightPx);
  const requiredHandWidthAtScale1 = 82 + Math.max(0, handCount - 1) * 26;
  const scaledByWidth = availableHandWidth / Math.max(1, requiredHandWidthAtScale1);
  const handCardScale = boardScale < 1
    ? Math.max(0.42, Math.min(scaledByHeight, scaledByWidth, 1.0))   // compact viewport: cap at 1.0
    : Math.max(0.42, Math.min(scaledByHeight, scaledByWidth, 1.3));  // full viewport: allow up to 1.3

  const mustDrawNow = humanTurn && !turnTransitionLocked && !drawDisabled && playableCardIds.size === 0;
  const mustAutoDrawRequired = humanTurn && !turnTransitionLocked && game.pendingDraw > 0 && !hasPendingStackOption;
  const stackChoiceOpen = humanTurn && !turnTransitionLocked && game.pendingDraw > 0 && hasPendingStackOption;
  const stackableDraw2Card = sortedHand.find((card) => playableCardIds.has(card.id) && card.value === "draw2") ?? null;
  const stackableWild4Card = sortedHand.find((card) => playableCardIds.has(card.id) && card.value === "wild4") ?? null;
  const preferredStackCard = stackableDraw2Card ?? stackableWild4Card;
  const preferredStackLabel = preferredStackCard?.value === "wild4" ? "+4" : "+2";
  const revealedDrawnCard = drawnCardId
    ? localPlayer.hand.find((card) => card.id === drawnCardId) ?? null
    : null;
  const drawnPlayableCard = drawnThisTurn && revealedDrawnCard && playableCardIds.has(revealedDrawnCard.id)
    ? revealedDrawnCard
    : null;
  const drawnChoiceOpen = humanTurn && !turnTransitionLocked && drawnThisTurn && !!revealedDrawnCard && drawDecisionCardId === revealedDrawnCard.id;
  const directionLabel = game.direction === 1 ? "Clockwise" : "Counter-clockwise";
  const directionSymbol = game.direction === 1 ? "⟳" : "⟲";
  const showCountdown = turnCountdownSeconds > 0;
  const timerUrgent = turnCountdownSeconds > 0 && turnCountdownSeconds <= 6;
  const barHeight = isCompactBoard ? 42 : 50;
  const headerPadding = isCompactBoard ? "4px 8px" : "6px 12px";
  const footerPadding = isCompactBoard ? "4px 14px" : "6px 18px";
  const themeButtonLabel = isNarrowMobile ? "Theme" : `Theme: ${currentThemeLabel}`;
  const settingsButtonLabel = isNarrowMobile ? "Prefs" : "Settings";

  const hint = !humanTurn
    ? `Waiting for ${currentPlayer.name}`
    : game.pendingDraw > 0
      ? playableCardIds.size > 0 ? "Add to the stack, or take the cards" : `No counter — taking +${game.pendingDraw}`
      : drawnThisTurn
        ? drawnPlayableCard ? "Choose to play the drawn card, or pass" : "No playable draw — passing in a moment"
        : playableCardIds.size > 0 ? "Tap a highlighted card to play · Space to draw · U for UNO"
        : "No playable cards — draw from pile";

  const hoveredCard = hoveredCardId
    ? sortedHand.find((card) => card.id === hoveredCardId) ?? null
    : null;

  const hoveredCardHint = hoveredCard
    ? `${hoveredCard.color === "wild" ? "" : `${hoveredCard.color} `}${hoveredCard.value}`.toUpperCase().replace("WILD4", "WILD +4")
    : null;

  const infoLine = hoveredCardHint ? `CARD: ${hoveredCardHint}` : hint;

  const handOverlap = Math.round(26 * handCardScale);
  const ARC_SPREAD = 3.5;
  const ARC_LIFT   = 2.5;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Courier+Prime:wght@400;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; }

        @keyframes blink   { 0%,100%{opacity:1} 50%{opacity:0.15} }
        @keyframes dot     { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.3;transform:scale(0.6)} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes feedIn  { from{opacity:0;transform:translateX(10px)} to{opacity:1;transform:translateX(0)} }
        @keyframes modalIn { from{opacity:0;transform:translateY(12px) scale(0.98)} to{opacity:1;transform:none} }
        @keyframes timerPulse {
          0%,100% { filter: drop-shadow(0 0 0 rgba(192,57,43,0.00)); }
          50% { filter: drop-shadow(0 0 12px rgba(192,57,43,0.62)); }
        }
        @keyframes drewCardGlow {
          0%   { transform: rotate(var(--card-rot, 0deg)) translateY(var(--card-lift, 0px)) scale(0.92); filter: drop-shadow(0 0 0 rgba(192,57,43,0)); }
          35%  { transform: rotate(var(--card-rot, 0deg)) translateY(calc(var(--card-lift, 0px) - 18px)) scale(1.02); filter: drop-shadow(0 0 18px rgba(192,57,43,0.58)); }
          100% { transform: rotate(var(--card-rot, 0deg)) translateY(var(--card-lift, 0px)) scale(1); filter: drop-shadow(0 0 0 rgba(192,57,43,0)); }
        }

        @keyframes mustDrawPulse {
          0%,100% { filter: drop-shadow(0 0 0px rgba(192,57,43,0)); }
          50%      { filter: drop-shadow(0 0 14px rgba(192,57,43,0.75)); }
        }
        @keyframes unoFlashPop {
          0%  { opacity:0; transform:translate(-50%,-50%) scale(0.65); }
          20% { opacity:1; transform:translate(-50%,-50%) scale(1.06); }
          75% { opacity:1; transform:translate(-50%,-50%) scale(1);    }
          100%{ opacity:0; transform:translate(-50%,-50%) scale(1.1);  }
        }
        @keyframes actionFlashPop {
          0%  { opacity:0; transform:scale(0.68); }
          18% { opacity:1; transform:scale(1.04); }
          74% { opacity:1; transform:scale(1); }
          100%{ opacity:0; transform:scale(1.08); }
        }
        @keyframes discardLand {
          0%  { transform:translateY(-16px) rotate(-10deg) scale(0.94); opacity:0.4; }
          65% { transform:translateY(2px) rotate(-1deg) scale(1.02); opacity:1; }
          100%{ transform:translateY(0) rotate(-2deg) scale(1); opacity:1; }
        }
        /* Call out button pulses up and down to demand attention */
        @keyframes callOutAttention {
          from { transform: translateX(-50%) translateY(0) scale(1); }
          to   { transform: translateX(-50%) translateY(-4px) scale(1.04); }
        }
        /* Call out flash centre screen */
        @keyframes callOutPop {
          0%  { opacity:0; transform:scale(0.7); }
          18% { opacity:1; transform:scale(1.05); }
          75% { opacity:1; transform:scale(1); }
          100%{ opacity:0; transform:scale(1.08); }
        }
        @keyframes confettiFall {
          0% { transform: translateY(-16vh) rotate(0deg); opacity: 0; }
          10% { opacity: 0.96; }
          100% { transform: translateY(118vh) rotate(760deg); opacity: 0.9; }
        }

        .hand-card { transition: transform 0.18s cubic-bezier(0.22,1,0.36,1), filter 0.18s ease !important; }

        .draw-pile-btn { transition: filter 0.2s ease, opacity 0.2s ease, transform 0.15s ease; }
        .draw-pile-btn:hover:not(:disabled) { transform: translateY(-4px); }

        .uno-btn { transition: opacity 0.12s; }
        .uno-btn:hover { opacity: 0.82 !important; }
        .menu-btn { transition: color 0.12s; }
        .menu-btn:hover { color: var(--ui-accent-red) !important; }
      `}</style>

      <LiveFeed entries={feed} />
      <AnimatedCards animations={animations} />
      {actionFlash && <ActionFlash text={actionFlash.text} tone={actionFlash.tone} />}
      {callOutFlashName && <CallOutFlash name={callOutFlashName} />}

      <div style={{
        height: "100dvh", overflow: "hidden",
        color: "var(--ui-text)", background: "var(--ui-bg)",
        fontFamily: "'Courier Prime', monospace",
        display: "flex", flexDirection: "column",
      }}>

        {/* ── Header ── */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, zIndex: 30,
          padding: headerPadding,
          minHeight: barHeight,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          pointerEvents: "none",
          background: "var(--ui-bg)",
          borderBottom: "1px solid var(--ui-line)",
        }}>
          <h1 style={{
            margin: 0, pointerEvents: "auto",
            fontFamily: "'Bebas Neue', cursive",
            fontSize: isCompactBoard ? 26 : 32, letterSpacing: "0.02em", lineHeight: 1,
          }}>
            <span style={{ color: "var(--ui-accent-red)" }}>U</span>
            <span style={{ color: "var(--ui-accent-yellow)" }}>N</span>
            <span style={{ color: "var(--ui-accent-green)" }}>O</span>
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 6, pointerEvents: "auto" }}>
            <button type="button" onClick={onCycleTheme} style={{
              fontFamily: "'Courier Prime', monospace",
              fontSize: isCompactBoard ? 10 : 11, fontWeight: 700,
              letterSpacing: "0.14em", textTransform: "uppercase",
              background: "var(--ui-surface)", border: "1px solid var(--ui-line)",
              color: "var(--ui-muted)", padding: isCompactBoard ? "6px 10px" : "8px 13px",
              cursor: "pointer", transition: "color 0.12s",
            }}>{themeButtonLabel}</button>
            <button onClick={onOpenSettings} style={{
              fontFamily: "'Courier Prime', monospace",
              fontSize: isCompactBoard ? 10 : 11, fontWeight: 700,
              letterSpacing: "0.14em", textTransform: "uppercase",
              background: "var(--ui-surface)", border: "1px solid var(--ui-line)",
              color: "var(--ui-muted)", padding: isCompactBoard ? "6px 10px" : "8px 13px",
              cursor: "pointer", transition: "color 0.12s",
            }}>{settingsButtonLabel}</button>
            <button className="menu-btn" onClick={() => setShowExitConfirm(true)} style={{
              fontFamily: "'Courier Prime', monospace",
              fontSize: isCompactBoard ? 10 : 11, fontWeight: 700,
              letterSpacing: "0.14em", textTransform: "uppercase",
              background: "var(--ui-surface)", border: "1px solid var(--ui-line)",
              color: "var(--ui-muted)", padding: isCompactBoard ? "6px 10px" : "8px 13px",
              cursor: "pointer",
            }}>MENU</button>
          </div>
        </div>

        {/* ── Opponents — paddingTop clears floating header ── */}
        <section style={{
          paddingTop: isCompactBoard ? 40 : 48,
          paddingBottom: isCompactBoard ? 4 : 8,
          paddingInline: isNarrowMobile ? 6 : 12,
          display: "flex", flexWrap: "wrap",
          gap: isCompactBoard ? (isNarrowMobile ? "3px 8px" : "4px 14px") : "8px 20px",
          justifyContent: "center", alignItems: "flex-start",
          flexShrink: 0,
          borderBottom: "1px solid var(--ui-line)",
        }}>
          {opponents.map(player => {
            const idx = game.players.findIndex(p => p.id === player.id);
            const canCallOut = humanTurn && player.hand.length === 1 && !player.saidUno && game.rules.mustDeclareUno;
            return (
              <div key={player.id} ref={(node) => { playerZoneRefs.current[player.id] = node; }}>
                <OpponentStrip
                  player={player}
                  isCurrentTurn={idx === game.currentPlayerIndex}
                  canCallOut={canCallOut}
                  onCallOut={() => handleCallOut(localPlayerIndex, idx, player.name)}
                  cardScale={handCardScale}
                  compact={isNarrowMobile}
                />
              </div>
            );
          })}
        </section>

        {/* ── Table ── */}
        <main style={{
          flex: 1, minHeight: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          gap: isCompactBoard ? 6 : 12,
          padding: isCompactBoard ? (isNarrowMobile ? "0 4px" : "0 8px") : "0 16px",
          overflow: "hidden",
          transform: isCompactBoard ? (isNarrowMobile ? "translateY(-1px)" : "translateY(-4px)") : "translateY(-10px)",
        }}>

          <div style={{
            minHeight: 20,
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingLeft: isCompactBoard ? 4 : 8,
            paddingRight: isCompactBoard ? 6 : 10,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {game.pendingDraw > 0 && humanTurn ? (
                <span style={{
                  fontFamily: "'Courier Prime', monospace", fontSize: 11,
                  color: "var(--ui-accent-red)", letterSpacing: "0.1em", textTransform: "uppercase",
                  border: "1px solid var(--ui-accent-red)", padding: "3px 12px",
                  animation: "blink 2s step-end infinite",
                }}>{hasPendingStackOption ? `+${game.pendingDraw} incoming` : `taking +${game.pendingDraw}`}</span>
              ) : null}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "flex-end", gap: isCompactBoard ? (isNarrowMobile ? 8 : 14) : 32 }}>

            {/* Draw pile */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <span style={{
                fontFamily: "'Courier Prime', monospace", fontSize: 9,
                letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--ui-muted)",
              }}>DRAW PILE</span>
              <button
                ref={drawPileRef}
                className="draw-pile-btn"
                onClick={drawDisabled ? undefined : drawCard}
                disabled={drawDisabled}
                style={{
                  background: "none", border: "none", padding: 0,
                  cursor: drawDisabled ? "default" : "pointer",
                  opacity: drawDisabled ? 0.28 : 1,
                  animation: mustDrawNow || mustAutoDrawRequired ? "mustDrawPulse 1.0s ease-in-out infinite" : "none",
                  filter: !mustDrawNow && !mustAutoDrawRequired && game.pendingDraw > 0 && humanTurn
                    ? "drop-shadow(0 0 7px rgba(192,57,43,0.55))" : "none",
                }}
              >
                <UnoCard card={{ id: "_draw", color: "wild", value: "wild" }} faceDown sizeMultiplier={pileCardScale} />
              </button>
              <span style={{
                fontFamily: "'Courier Prime', monospace", fontSize: 10,
                letterSpacing: "0.08em", color: "var(--ui-muted)",
              }}>{game.drawPile.length} left</span>
            </div>

            {/* Direction indicator (aligned with piles) */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <span style={{
                fontFamily: "'Courier Prime', monospace", fontSize: 9,
                letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--ui-muted)",
              }}>{isNarrowMobile ? "DIR" : "TURN"}</span>
              <span title={directionLabel} style={{
                fontFamily: "'Courier Prime', monospace",
                fontSize: Math.round((isCompactBoard ? 26 : 32) * pileCardScale),
                lineHeight: 1,
                color: "var(--ui-text)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: Math.round((isCompactBoard ? 34 : 42) * pileCardScale),
                height: Math.round((isCompactBoard ? 34 : 42) * pileCardScale),
                flexShrink: 0,
              }}>{directionSymbol}</span>
            </div>

            {/* Discard pile */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <span style={{
                fontFamily: "'Courier Prime', monospace", fontSize: 9,
                letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--ui-muted)",
              }}>DISCARD</span>
              {topDiscard && (
                <div ref={discardPileRef} style={{ position: "relative", width: 120 * pileCardScale, height: 160 * pileCardScale }}>
                  {game.discardPile.slice(-4).map((card, idx, arr) => {
                    const isTop = idx === arr.length - 1;
                    const displayCard = isTop && discardDisplayCard ? discardDisplayCard : card;
                    const offset = arr.length - 1 - idx;
                    return (
                      <div key={card.id} style={{
                        position: "absolute", inset: 0,
                        display: "flex", justifyContent: "center", alignItems: "center",
                        transform: `translate(${offset * -4}px, ${offset * -2}px) rotate(${isTop ? -2 : -6 + idx * 3}deg)`,
                        opacity: isTop ? 1 : 0.78,
                        zIndex: idx + 1,
                        animation: isTop ? "discardLand 0.24s cubic-bezier(0.22,1,0.36,1)" : "none",
                        willChange: isTop ? "transform, opacity" : "auto",
                      }}>
                        <UnoCard card={displayCard} sizeMultiplier={pileCardScale} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

        </main>

        {/* ── Player panel ── */}
        <div style={{
          flexShrink: 0,
          borderTop: "1px solid var(--ui-line)",
          position: "relative",
          overflow: "visible",
          zIndex: 12,
        }}>

          {unoButtonVisible && (
            <button
              type="button"
              onClick={declareUno}
              className="uno-btn"
              style={{
                position: "absolute",
                left: "82%",
                top: 0,
                transform: "translate(-50%, -50%)",
                zIndex: 40,
                fontFamily: "'Bebas Neue', cursive",
                fontSize: isNarrowMobile ? 20 : isCompactBoard ? 24 : 28,
                letterSpacing: "0.1em",
                background: "var(--ui-accent-red)",
                color: "#fff",
                border: "1px solid var(--ui-accent-red)",
                padding: isNarrowMobile ? "4px 14px 3px" : isCompactBoard ? "5px 16px 4px" : "7px 20px 6px",
                cursor: "pointer",
                opacity: 1,
                animation: "none",
                lineHeight: 1,
                boxShadow: "0 6px 14px rgba(26,15,0,0.28)",
              }}
              title="Say UNO"
            >UNO</button>
          )}

          {stackChoiceOpen && (
            <ActionTray>
              <div style={{ display: "grid", gap: 4 }}>
                <p style={{
                  margin: 0,
                  fontFamily: "'Courier Prime', monospace",
                  fontSize: 10,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "var(--ui-muted)",
                }}>Draw stack</p>
                <p style={{
                  margin: 0,
                  fontFamily: "'Bebas Neue', cursive",
                  fontSize: 28,
                  letterSpacing: "0.04em",
                  color: "var(--ui-text)",
                  lineHeight: 1,
                }}>+{game.pendingDraw} incoming</p>
                <p style={{
                  margin: 0,
                  fontFamily: "'Courier Prime', monospace",
                  fontSize: 11,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: "var(--ui-muted)",
                  }}>
                    {preferredStackCard?.value === "wild4"
                      ? "You can counter with +4."
                      : "You can counter with +2."} Stack now, or take the cards.
                  </p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => {
                    if (turnTransitionLocked) return;
                    if (!preferredStackCard) {
                      drawCard();
                      return;
                    }
                    if (game.rules.mustDeclareUno && !localPlayer.saidUno && localPlayer.hand.length === 2) {
                      sayUno(localPlayerIndex);
                    }
                    handleSelectCard(preferredStackCard, handCardRefs.current[preferredStackCard.id] ?? null);
                  }}
                  style={{
                    fontFamily: "'Bebas Neue', cursive",
                    fontSize: 20,
                    letterSpacing: "0.12em",
                    background: "var(--ui-text)",
                    color: "var(--ui-bg)",
                    border: "none",
                    padding: "12px 14px",
                    cursor: "pointer",
                  }}
                >Add {preferredStackLabel}</button>
                <button
                  type="button"
                  onClick={() => {
                    if (turnTransitionLocked) return;
                    drawCard();
                  }}
                  style={{
                    fontFamily: "'Courier Prime', monospace",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    background: "transparent",
                    border: "1px solid var(--ui-line)",
                    color: "var(--ui-muted)",
                    padding: "12px 14px",
                    cursor: "pointer",
                  }}
                >Take +{game.pendingDraw}</button>
              </div>
            </ActionTray>
          )}

          {drawnChoiceOpen && revealedDrawnCard && (
            <ActionTray>
              <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 12, alignItems: "center" }}>
                <UnoCard card={revealedDrawnCard} sizeMultiplier={0.78} />
                <div style={{ display: "grid", gap: 4 }}>
                  <p style={{
                    margin: 0,
                    fontFamily: "'Courier Prime', monospace",
                    fontSize: 10,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: "var(--ui-muted)",
                  }}>Card drawn</p>
                  <p style={{
                    margin: 0,
                    fontFamily: "'Bebas Neue', cursive",
                    fontSize: 28,
                    letterSpacing: "0.04em",
                    color: "var(--ui-text)",
                    lineHeight: 1,
                  }}>{drawnPlayableCard ? "You can play this" : "No playable draw"}</p>
                  <p style={{
                    margin: 0,
                    fontFamily: "'Courier Prime', monospace",
                    fontSize: 11,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: "var(--ui-muted)",
                  }}>{drawnPlayableCard
                    ? "The new card is highlighted in your hand. Play it, or pass."
                    : "Passing shortly unless you end the turn now."}</p>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: drawnPlayableCard ? "1fr 1fr" : "1fr", gap: 8 }}>
                {drawnPlayableCard && (
                  <button
                    type="button"
                    onClick={() => {
                      if (turnTransitionLocked) return;
                      if (game.rules.mustDeclareUno && !localPlayer.saidUno && localPlayer.hand.length === 2) {
                        sayUno(localPlayerIndex);
                      }
                      handleSelectCard(drawnPlayableCard, handCardRefs.current[drawnPlayableCard.id] ?? null);
                    }}
                    style={{
                      fontFamily: "'Bebas Neue', cursive",
                      fontSize: 20,
                      letterSpacing: "0.12em",
                      background: "var(--ui-text)",
                      color: "var(--ui-bg)",
                      border: "none",
                      padding: "12px 14px",
                      cursor: "pointer",
                    }}
                  >Play card</button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (turnTransitionLocked) return;
                    pass();
                  }}
                  style={{
                    fontFamily: "'Courier Prime', monospace",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    background: "transparent",
                    border: "1px solid var(--ui-line)",
                    color: "var(--ui-muted)",
                    padding: "12px 14px",
                    cursor: "pointer",
                  }}
                >{drawnPlayableCard ? "Pass" : "Pass now"}</button>
              </div>
            </ActionTray>
          )}

          {/* Card fan — scrollable, full height */}
          <div style={{ overflow: "visible", width: "100%", position: "relative", zIndex: 13 }}>
            <div ref={localHandRef} style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
              minWidth: "max-content",
              paddingLeft:  isCompactBoard ? (isNarrowMobile ? 8 : 16) : 24,
              paddingRight: isCompactBoard ? (isNarrowMobile ? 8 : 16) : 24,
              paddingTop:   isCompactBoard ? (isNarrowMobile ? 8 : 12) : 16,
              paddingBottom: 0,
              height: isCompactBoard
                ? `${Math.round(122 * handCardScale) + (isNarrowMobile ? 20 : 28)}px`
                : `${Math.round(122 * handCardScale) + 36}px`,
              overflow: "visible",
            }}
              onMouseMove={(event) => {
                if (event.target === event.currentTarget) {
                  setHoveredHandPosition(null);
                  setHoveredCardId(null);
                }
              }}
              onMouseLeave={() => {
                setHoveredHandPosition(null);
                setHoveredCardId(null);
              }}
            >
              {sortedHand.map((card, i) => {
                const playable = humanTurn && !botThinking && !turnTransitionLocked && playableCardIds.has(card.id);
                const isSelected = pendingWild?.id === card.id;
                const isFreshDraw = card.id === highlightedDrawnCardId;
                const mid = (handCount - 1) / 2;
                const offset = i - mid;
                const rotateDeg = offset * ARC_SPREAD;
                const liftPx = Math.abs(offset) * ARC_LIFT;
                const hoverDistance = hoveredHandPosition === null ? 99 : Math.abs(i - hoveredHandPosition);
                const gaussian = hoveredHandPosition === null
                  ? 0
                  : Math.exp(-((hoverDistance * hoverDistance) / (2 * 0.95 * 0.95)));
                const dockScale = 1 + (0.22 * gaussian);
                const dockLift = 15 * gaussian;
                const horizontalPush = hoveredHandPosition === null
                  ? 0
                  : Math.sign(i - hoveredHandPosition) * (8 * gaussian);
                const baseLift = isSelected ? liftPx - 14 : liftPx;
                const baseTransform = `translateX(${horizontalPush}px) rotate(${rotateDeg}deg) translateY(${baseLift - dockLift}px) scale(${dockScale})`;

                return (
                  <div
                    key={card.id}
                    className="hand-card"
                    ref={(node) => { handCardRefs.current[card.id] = node; }}
                    style={{
                      "--card-rot": `${rotateDeg}deg`,
                      "--card-lift": `${isSelected ? liftPx - 14 : liftPx}px`,
                      marginLeft: i === 0 ? 0 : -handOverlap,
                      zIndex: hoveredHandPosition === null
                        ? (playable ? i + 1 : i)
                        : i + Math.round(gaussian * 180),
                      position: "relative",
                      transform: baseTransform,
                      transformOrigin: "bottom center",
                      transition: "transform 0.18s cubic-bezier(0.22,1,0.36,1)",
                      cursor: playable ? "pointer" : "default",
                      outline: isSelected ? "2px solid var(--ui-text)" : "none",
                      outlineOffset: 3,
                      filter: isFreshDraw
                        ? "drop-shadow(0 0 16px rgba(192,57,43,0.45))"
                        : playable ? "drop-shadow(0 2px 4px rgba(26,15,0,0.14))" : "none",
                      animation: isFreshDraw ? "drewCardGlow 0.6s cubic-bezier(0.22,1,0.36,1)" : "none",
                    } as CSSProperties & Record<string, string | number>}
                    onClick={playable ? (event) => handleSelectCard(card, event.currentTarget) : undefined}
                    onMouseEnter={() => {
                      setHoveredHandPosition(i);
                      setHoveredCardId(card.id);
                    }}
                    onMouseMove={(event) => {
                      const rect = event.currentTarget.getBoundingClientRect();
                      const normalized = (event.clientX - rect.left) / Math.max(1, rect.width);
                      const finePosition = i + (normalized - 0.5) * 0.9;
                      setHoveredHandPosition(finePosition);
                    }}
                  >
                    {isFreshDraw && (
                      <span style={{
                        position: "absolute",
                        left: "50%",
                        top: -18,
                        transform: "translateX(-50%)",
                        fontFamily: "'Courier Prime', monospace",
                        fontSize: 8,
                        fontWeight: 700,
                        letterSpacing: "0.16em",
                        textTransform: "uppercase",
                        color: "var(--ui-accent-red)",
                        whiteSpace: "nowrap",
                        zIndex: 3,
                      }}>DREW</span>
                    )}
                    <UnoCard
                      card={card} sizeMultiplier={handCardScale}
                      isPlayable={playable} isSelected={isSelected} onClick={undefined}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Info row — always below cards, never covered ── */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: footerPadding,
            minHeight: isNarrowMobile ? 58 : barHeight,
            position: "relative",
            zIndex: 320,
            background: "var(--ui-bg)",
            borderTop: "1px solid var(--ui-line)",
            flexWrap: isNarrowMobile ? "wrap" : "nowrap",
          }}>
            {/* Name */}
            <span style={{
              fontFamily: "'Bebas Neue', cursive",
              fontSize: isCompactBoard ? 16 : 19,
              letterSpacing: "0.05em",
              color: "var(--ui-text)",
              lineHeight: 1,
              flexShrink: 0,
            }}>{localPlayer.name}</span>

            {/* Turn status */}
            <span style={{
              fontFamily: "'Courier Prime', monospace",
              fontSize: isNarrowMobile ? 8 : isCompactBoard ? 9 : 10,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--ui-muted)",
              flexShrink: 0,
            }}>{humanTurn ? "— your turn" : "— waiting"}</span>

            {/* UNO declared badge */}
            {localPlayer.saidUno && localPlayer.hand.length <= 2 && (
              <span style={{
                fontFamily: "'Courier Prime', monospace", fontSize: 8, fontWeight: 700,
                letterSpacing: "0.14em", background: "var(--ui-accent-red)", color: "#fff",
                padding: "2px 6px", animation: isLocalTurn ? "blink 0.9s step-end infinite" : "none",
                flexShrink: 0,
              }}>UNO</span>
            )}

            {/* Session wins */}
            {(scores[localPlayer.name] ?? 0) > 0 && (
              <span style={{
                fontFamily: "'Courier Prime', monospace", fontSize: 9,
                color: "var(--ui-muted)", letterSpacing: "0.06em", flexShrink: 0,
              }}>{scores[localPlayer.name]}W</span>
            )}

            {/* Separator dot */}
            {!isNarrowMobile && <span style={{ color: "var(--ui-line)", flexShrink: 0 }}>·</span>}

            {/* Hint — takes remaining space, truncates if needed */}
            {!isNarrowMobile && (
              <span style={{
                fontFamily: "'Courier Prime', monospace",
                fontSize: isCompactBoard ? 9 : 10,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "var(--ui-muted)",
                flex: 1,
                minWidth: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}>{infoLine}</span>
            )}

            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              {showCountdown && (
                <div title="Turn timer" style={{
                border: "none",
                background: timerUrgent
                  ? "var(--ui-accent-red)"
                  : "var(--ui-accent-blue)",
                color: "#fff8f0",
                padding: isNarrowMobile ? "2px 8px 1px" : isCompactBoard ? "3px 10px 2px" : "4px 12px 3px",
                minWidth: isNarrowMobile ? 38 : isCompactBoard ? 44 : 52,
                textAlign: "center",
                boxShadow: timerUrgent
                  ? "0 0 0 1px color-mix(in srgb, var(--ui-accent-red) 72%, #000 28%), 0 6px 16px rgba(192,57,43,0.38)"
                  : "0 0 0 1px color-mix(in srgb, var(--ui-accent-blue) 72%, #000 28%), 0 6px 16px rgba(26,79,138,0.30)",
                animation: timerUrgent ? "timerPulse 0.75s ease-in-out infinite" : "none",
              }}>
                <span style={{
                  fontFamily: "'Bebas Neue', cursive",
                  fontSize: isNarrowMobile ? 20 : isCompactBoard ? 24 : 30,
                  lineHeight: 1,
                  letterSpacing: "0.04em",
                }}>{turnCountdownSeconds}</span>
                </div>
              )}
            </div>

            {isNarrowMobile && (
              <span style={{
                width: "100%",
                fontFamily: "'Courier Prime', monospace",
                fontSize: 8,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "var(--ui-muted)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}>{infoLine}</span>
            )}
          </div>

        </div>
      </div>

      {/* Exit confirm */}
      {showExitConfirm && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 90, background: "rgba(0,0,0,0.55)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
        }}>
          <div style={{
            width: "min(460px, 100%)", background: "var(--ui-surface)",
            border: "2px solid var(--ui-line)", padding: 20,
            display: "grid", gap: 14, animation: "none",
          }}>
            <p style={{ margin: 0, fontFamily: "'Bebas Neue', cursive", fontSize: 30, letterSpacing: "0.05em", color: "var(--ui-text)" }}>
              Leave This Match?
            </p>
            <p style={{ margin: 0, fontFamily: "'Courier Prime', monospace", fontSize: 12, letterSpacing: "0.04em", color: "var(--ui-muted)", lineHeight: 1.5 }}>
              Your current round will end and you will return to the main menu.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button onClick={() => setShowExitConfirm(false)} style={{
                border: "1px solid var(--ui-line)", background: "transparent",
                color: "var(--ui-muted)", padding: "10px 14px", cursor: "pointer",
                fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase",
                fontFamily: "'Courier Prime', monospace", transition: "color 0.12s",
              }}>Stay</button>
              <button onClick={confirmExitGame} style={{
                border: "none", background: "var(--ui-accent-red)", color: "#fff",
                padding: "10px 16px", cursor: "pointer",
                fontSize: 18, letterSpacing: "0.1em", textTransform: "uppercase",
                fontFamily: "'Bebas Neue', cursive",
              }}>Exit</button>
            </div>
          </div>
        </div>
      )}

      {pendingWild && <ColorPicker onSelect={confirmWildColor} onCancel={cancelWild} />}

      {!pendingWild && wildPickerPlayerName && (
        <div style={{
          position: "fixed",
          inset: 0,
          zIndex: 61,
          background: "color-mix(in srgb, var(--ui-bg) 22%, #000 8%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          pointerEvents: "none",
        }}>
          <div style={{
            width: "min(460px, 100%)",
            background: "var(--ui-surface)",
            border: "1px solid var(--ui-line)",
            padding: "24px 20px",
            textAlign: "center",
            display: "grid",
            gap: 8,
          }}>
            <p style={{
              margin: 0,
              fontFamily: "'Courier Prime', monospace",
              fontSize: 10,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--ui-muted)",
            }}>Color selection</p>
            <p style={{
              margin: 0,
              fontFamily: "'Bebas Neue', cursive",
              fontSize: 32,
              letterSpacing: "0.05em",
              color: "var(--ui-text)",
            }}>{wildPickerPlayerName} is choosing a color</p>
          </div>
        </div>
      )}

      {showUnoFlash && (
        <div style={{ position: "fixed", inset: 0, zIndex: 86, pointerEvents: "none" }}>
          <div style={{
            position: "absolute", left: "50%", top: "50%",
            transform: "translate(-50%, -50%)",
            fontFamily: "'Bebas Neue', cursive",
            fontSize: "clamp(64px, 18vw, 180px)", lineHeight: 0.9,
            color: "var(--ui-accent-red)",
            textShadow: "0 10px 26px rgba(0,0,0,0.34), 0 0 24px color-mix(in srgb, var(--ui-accent-red) 72%, var(--ui-accent-yellow) 28%)",
            animation: "unoFlashPop 0.9s cubic-bezier(0.22,1,0.36,1) forwards",
          }}>UNO</div>
        </div>
      )}

      {winner && (
        <>
          <VictoryConfetti />
          <WinnerScreen
            winner={winner}
            scores={scores}
            players={game.players.map((player) => player.name)}
            onReset={() => { resetGame(); onReset(); }}
            onDealAgain={onDealAgain}
          />
        </>
      )}
    </>
  );
}
