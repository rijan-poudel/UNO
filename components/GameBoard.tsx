"use client";

import { useEffect, useRef, useState, useCallback, type CSSProperties, type ReactNode } from "react";
import type { Card, CardColor } from "../types/card";
import type { GameState, Player } from "../types/game";
import type { useUnoGame } from "../hooks/useUnoGame";
import UnoCard from "./UnoCard";
import ColorPicker from "./ColorPicker";
import ProfileChip from "./ProfileChip";
import { announceBoardFromTransition, announceBoardWinner, getBoardVoiceRemainingMs } from "../lib/voiceAnnouncer";
import { playShuffleMotionChime, playTableChime, primeTableAudioFromUserGesture } from "../lib/tableChimes";
import { useAudioManager } from "../hooks/useAudioManager";
import { isMusicEnabledForContext, setMusicEnabledForContext } from "../lib/audioSettings";
import { AudioLines, Gamepad2, LogOut, Settings, User, Volume2, VolumeX } from "lucide-react";

export type GameApi = ReturnType<typeof useUnoGame>;

interface GameBoardProps {
  gameApi: GameApi;
  onReset: () => void;
  onDealAgain: () => void;
  onOpenSettings: (tab?: "profile" | "controls" | "audio") => void;
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

const BOT_THINK_DELAY_MS = 1500;
const HUMAN_IDLE_TIMEOUT_MS = 12000;
const HUMAN_IDLE_AFTER_DRAW_TIMEOUT_MS = 12000;
const HUMAN_IDLE_WILD_PICK_TIMEOUT_MS = 12000;
const ACTION_FLASH_HOLD_MS = 520;
const DEAL_ANIMATION_STAGGER_MS = 55;
const DEAL_ANIMATION_DURATION_MS = 320;
const EASE_OUT = "cubic-bezier(0.23, 1, 0.32, 1)";
const EASE_OUT_SOFT = "cubic-bezier(0.22, 1, 0.36, 1)";

function sortHand(cards: Card[]): Card[] {
  return [...cards].sort((a, b) => {
    const cd = (COLOR_ORDER[a.color] ?? 9) - (COLOR_ORDER[b.color] ?? 9);
    return cd !== 0 ? cd : (VALUE_ORDER[a.value] ?? 9) - (VALUE_ORDER[b.value] ?? 9);
  });
}

// ── Main board ─────────────────────────────────────────────────────────────────
// ...existing code...

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
      transition: `opacity 0.18s ${EASE_OUT_SOFT}, transform 0.2s ${EASE_OUT}`,
    }}>
      {children}
    </div>
  );
}

function GameCard({
  card,
  scale,
  faceDown = false,
  isPlayable = false,
  isSelected = false,
  onClick,
}: {
  card: Card;
  scale: number;
  faceDown?: boolean;
  isPlayable?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
}) {
  return (
    <UnoCard
      card={card}
      faceDown={faceDown}
      sizeMultiplier={scale}
      isPlayable={isPlayable}
      isSelected={isSelected}
      onClick={onClick}
    />
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
            transition: `left ${animation.duration}ms ${EASE_OUT}, top ${animation.duration}ms ${EASE_OUT}, transform ${animation.duration}ms ${EASE_OUT}, opacity ${animation.duration}ms ${EASE_OUT_SOFT}`,
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
        animation: "actionFlashPop 1s cubic-bezier(0.23, 1, 0.32, 1) forwards",
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
  player, isCurrentTurn, canCallOut, onCallOut, cardScale, compact = false, angle = 0, turnProgress = 0,
}: {
  player: Player; isCurrentTurn: boolean;
  canCallOut: boolean; onCallOut: () => void; cardScale: number;
  compact?: boolean;
  angle?: number;
  turnProgress?: number;
}) {
  const n = player.hand.length;
  const opponentCardScale = cardScale;
  const fans = Math.min(n, compact ? 4 : 6);
  const extraFanCards = Math.max(0, fans - 4);
  const fanCompaction = extraFanCards > 0 ? Math.max(0.6, 1 - (extraFanCards * 0.18)) : 1;
  const effectiveFanScale = opponentCardScale * fanCompaction;
  const overlap = Math.round((compact ? 18 : 26) * effectiveFanScale * (extraFanCards > 0 ? 0.84 : 1));
  const fanWidth = Math.max(28, (82 * effectiveFanScale) + Math.max(0, fans - 1) * overlap);
  const fanHeight = 122 * effectiveFanScale + 8;
  const fanMid = (fans - 1) / 2;
  const turnBoost = isCurrentTurn ? 1.08 : 1;
  const callOutHintHeight = compact ? 10 : 12;
  const cornerNameClearance = Math.abs(angle) >= 30 ? (compact ? 12 : 16) : 0;
  const isSideSeat = Math.abs(angle) >= 80;
  const profileSideOffset = compact ? 8 : 10;

  return (
    <button
      type="button"
      onClick={canCallOut ? onCallOut : undefined}
      style={{
      background: "transparent",
      border: "none",
      padding: compact ? "0 4px 2px" : "0 6px 4px",
      cursor: canCallOut ? "pointer" : "default",
      textAlign: "center",
      display: "grid",
      gridTemplateRows: isSideSeat
        ? `${Math.round(fanHeight + cornerNameClearance)}px ${callOutHintHeight}px`
        : `${Math.round(fanHeight + cornerNameClearance)}px auto ${callOutHintHeight}px`,
      alignItems: "start",
      justifyItems: "center",
      rowGap: 3,
      opacity: canCallOut ? 1 : isCurrentTurn ? 1 : 0.38,
      transition: `opacity 0.22s ${EASE_OUT_SOFT}, background-color 0.22s ${EASE_OUT_SOFT}, box-shadow 0.22s ${EASE_OUT_SOFT}, transform 0.24s ${EASE_OUT}`,
      position: "relative",
      borderRadius: "8px",
      boxShadow: "none",
      animation: "none",
      transform: `rotate(${angle}deg)`,
      transformOrigin: "center center",
    }}>

      {/* Fanned face-down cards */}
      <div style={{
        position: "relative",
        height: fanHeight,
        width: fanWidth,
        marginTop: 0,
        flexShrink: 0,
        borderRadius: 10,
        boxShadow: canCallOut
          ? "0 0 0 1px color-mix(in srgb, var(--ui-accent-red) 75%, transparent), 0 0 20px rgba(192,57,43,0.42), inset 0 0 18px rgba(192,57,43,0.2)"
          : "none",
        animation: canCallOut ? "mustDrawPulse 1s ease-in-out infinite" : "none",
      }}>
        {fans === 0 ? (
          <span style={{ fontFamily: "'Courier Prime', monospace", fontSize: 9, color: "var(--ui-muted)" }}>empty</span>
        ) : Array.from({ length: fans }).map((_, i) => (
          <div key={i} style={{
            position: "absolute",
            left: i * overlap,
            top: -Math.abs(i - fanMid) * (2.2 * effectiveFanScale),
            transform: `rotate(${(i - fanMid) * -7}deg) scale(${turnBoost})`,
            transformOrigin: "bottom center",
            zIndex: isCurrentTurn ? i + 30 : i,
            transition: `transform 0.18s ${EASE_OUT}, opacity 0.16s ${EASE_OUT_SOFT}`,
          }}>
            <GameCard
              card={{ id: `_opp-${player.id}-${i}`, color: "wild", value: "wild" }}
              faceDown
              scale={effectiveFanScale}
            />
          </div>
        ))}
      </div>

      {/* Name row */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        minHeight: compact ? 18 : 20,
        marginTop: cornerNameClearance > 0 ? 2 : 0,
        transform: `rotate(${-angle}deg)`,
        transformOrigin: "center center",
        ...(isSideSeat
          ? {
              position: "absolute" as const,
              top: "50%",
              left: angle < 0 ? `calc(100% + ${profileSideOffset}px)` : `-${profileSideOffset}px`,
              transform: angle < 0
                ? `translate(0, -50%) rotate(${-angle}deg)`
                : `translate(-100%, -50%) rotate(${-angle}deg)`,
              marginTop: 0,
              zIndex: 5,
            }
          : {}),
      }}>
        {isCurrentTurn && (
          <span style={{
            width: 5, height: 5, borderRadius: "50%",
            background: "var(--ui-accent-red)", display: "inline-block",
            animation: "dot 1.1s ease-in-out infinite", flexShrink: 0,
          }} />
        )}

        <div style={{ position: "relative" }}>
          <ProfileChip
            name={player.name}
            seed={player.id}
            compact
            textColor={canCallOut ? "var(--ui-accent-red)" : "var(--ui-text)"}
            maxNameWidth={compact ? 96 : 126}
            ringColor={player.saidUno && n === 1 ? "var(--ui-accent-red)" : undefined}
            progressRing={isCurrentTurn ? turnProgress : undefined}
          />
        </div>

        {player.saidUno && n === 1 && (
          <span style={{
            fontFamily: "'Courier Prime', monospace",
            fontSize: 8, fontWeight: 700, letterSpacing: "0.12em",
            background: "var(--ui-accent-red)", color: "#fff", padding: "2px 5px",
            animation: isCurrentTurn ? "blink 0.9s step-end infinite" : "none",
          }}>UNO</span>
        )}
      </div>

      <span style={{ minHeight: callOutHintHeight, visibility: "hidden" }} />
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
        <button className="winner-secondary-btn" onClick={onReset} style={{
          fontFamily: "'Courier Prime', monospace", fontSize: 11, fontWeight: 700,
          letterSpacing: "0.1em", textTransform: "uppercase",
          background: "transparent", border: "1px solid var(--ui-line)",
          color: "var(--ui-muted)", padding: "12px 20px", cursor: "pointer",
          transition: `color 0.14s ${EASE_OUT_SOFT}, transform 0.12s ${EASE_OUT}`,
        }}
        >New players</button>
        <button className="winner-primary-btn" onClick={onDealAgain} style={{
          fontFamily: "'Bebas Neue', cursive", fontSize: 22, letterSpacing: "0.14em",
          background: "var(--ui-text)", color: "var(--ui-bg)",
          border: "none", padding: "12px 36px", cursor: "pointer", transition: `opacity 0.14s ${EASE_OUT_SOFT}, transform 0.12s ${EASE_OUT}`,
        }}
        >Deal again</button>
      </div>
    </div>
  );
}

// ── Main board ─────────────────────────────────────────────────────────────────
export default function GameBoard({
  gameApi, onReset, onDealAgain, onOpenSettings, onCycleTheme, currentThemeLabel,
}: GameBoardProps) {
  // Audio manager for SFX and shared background music control
  const { playCardMixing, stopCardMixing, playCardThrowing } = useAudioManager();

  const {
    game, localPlayerIndex, pendingWild, drawnThisTurn, botThinking,
    currentPlayer, localPlayer, isLocalTurn, playableCardIds,
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

  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showGameSettingsMenu, setShowGameSettingsMenu] = useState(false);
  const [showUnoFlash, setShowUnoFlash] = useState(false);
  const [showUnoDeclaredBadge, setShowUnoDeclaredBadge] = useState(false);
  const [actionFlash, setActionFlash] = useState<ActionFlashState | null>(null);
  const [musicEnabled, setMusicEnabled] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return isMusicEnabledForContext("game");
  });
  const [isNarrowMobile, setIsNarrowMobile] = useState(false);
  const [isCompactBoard, setIsCompactBoard] = useState(false);
  const [boardScale, setBoardScale] = useState(1);
  const [drawnCardId, setDrawnCardId] = useState<string | null>(null);
  const [highlightedDrawnCardId, setHighlightedDrawnCardId] = useState<string | null>(null);
  const [drawDecisionCardId, setDrawDecisionCardId] = useState<string | null>(null);
  const [hoveredHandPosition, setHoveredHandPosition] = useState<number | null>(null);
  const [animations, setAnimations] = useState<TravelAnimation[]>([]);
  const [turnCountdownSeconds, setTurnCountdownSeconds] = useState(0);
  const turnTransitionLocked = actionFlash !== null;

  const { scores, recordWin } = useScoreTracker();
  const prevWinnerRef = useRef<string | null>(null);
  const prevActionKeyRef = useRef<string | null>(null);
  const prevGameRef = useRef<GameState | null>(null);
  const actionFlashTimerRef = useRef<number | null>(null);
  const autoActionExecuteTimerRef = useRef<number | null>(null);
  const unoBadgeResetTimerRef = useRef<number | null>(null);
  const turnTimerKeyRef = useRef<string | null>(null);
  const turnTimerDeadlineRef = useRef<number>(0);
  const autoTurnHandledRef = useRef<string | null>(null);
  const prevLocalHandIdsRef = useRef<string[]>([]);
  const prevLocalHandCountRef = useRef<number | null>(null);
  const pendingPlayRectRef = useRef<{ cardId: string; x: number; y: number } | null>(null);
  const animationCounterRef = useRef(0);
  const dealAnimationKeyRef = useRef<string | null>(null);
  const drawPileRef = useRef<HTMLButtonElement | null>(null);
  const discardPileRef = useRef<HTMLDivElement | null>(null);
  const localHandRef = useRef<HTMLDivElement | null>(null);
  const gameSettingsRef = useRef<HTMLDivElement | null>(null);
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
    // Play card throwing sound for each card played
    playCardThrowing();
  }, [getElementCenter, localPlayer?.id, queueAnimation, playCardThrowing]);

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
          if (stepIndex === 0) {
            playTableChime("deal");
          }
          const isShuffleDeal = source === "discard";
          if (isShuffleDeal || stepIndex % 3 === 0) {
            playCardMixing(isShuffleDeal ? 170 : 130);
          }
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

    const totalSteps = Math.max(0, step);
    if (totalSteps > 0) {
      const stopDelay = (totalSteps * DEAL_ANIMATION_STAGGER_MS) + DEAL_ANIMATION_DURATION_MS + 40;
      window.setTimeout(() => {
        stopCardMixing();
      }, stopDelay);
    }
  }, [getElementCenter, localPlayer?.id, queueAnimation, playCardMixing, stopCardMixing]);

  const animateCollectLocalHandForShuffle = useCallback((cards: Card[]): number => {
    const from = getElementCenter(localHandRef.current);
    const to = getElementCenter(discardPileRef.current) ?? getElementCenter(drawPileRef.current);

    if (!from || !to || cards.length === 0) return 0;

    const visibleCount = Math.min(cards.length, 9);
    const staggerMs = 44;
    const travelMs = 280;

    for (let index = 0; index < visibleCount; index += 1) {
      const card = cards[cards.length - 1 - index] ?? cards[cards.length - 1];
      const fan = (index - ((visibleCount - 1) / 2)) * 11;

      window.setTimeout(() => {
        if (index === 0) {
          playTableChime("shuffle");
        }
        playCardMixing(160);
        queueAnimation({
          card,
          faceDown: false,
          from: {
            x: from.x + fan,
            y: from.y - (Math.abs(fan) * 0.14),
          },
          to: {
            x: to.x + (fan * 0.38),
            y: to.y - ((index % 3) * 2),
          },
          rotationFrom: -10 + (index * 4),
          rotationTo: -5 + (index * 3),
          scale: 0.86,
          duration: travelMs,
        });
      }, index * staggerMs);
    }

    const totalDuration = ((visibleCount - 1) * staggerMs) + travelMs;
    window.setTimeout(() => {
      stopCardMixing();
    }, totalDuration + 48);

    return totalDuration;
  }, [getElementCenter, queueAnimation, playCardMixing, stopCardMixing]);

  const handleSelectCard = useCallback((card: Card, element: HTMLDivElement | null) => {
    if (element) {
      const rect = element.getBoundingClientRect();
      pendingPlayRectRef.current = {
        cardId: card.id,
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    }

    if (showUnoDeclaredBadge) {
      if (unoBadgeResetTimerRef.current !== null) {
        window.clearTimeout(unoBadgeResetTimerRef.current);
      }
      unoBadgeResetTimerRef.current = window.setTimeout(() => {
        setShowUnoDeclaredBadge(false);
        unoBadgeResetTimerRef.current = null;
      }, 1000);
    }

    selectCard(card);
  }, [showUnoDeclaredBadge, selectCard]);

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
      if (unoBadgeResetTimerRef.current !== null) {
        window.clearTimeout(unoBadgeResetTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!localPlayer || localPlayer.isBot) {
      prevLocalHandCountRef.current = null;
      return;
    }

    const currentHandCount = localPlayer.hand.length;
    const previousHandCount = prevLocalHandCountRef.current;

    if (!localPlayer.saidUno) {
      if (unoBadgeResetTimerRef.current !== null) {
        window.clearTimeout(unoBadgeResetTimerRef.current);
        unoBadgeResetTimerRef.current = null;
      }
      const hideTimer = window.setTimeout(() => {
        setShowUnoDeclaredBadge(false);
      }, 0);
      prevLocalHandCountRef.current = currentHandCount;
      return () => window.clearTimeout(hideTimer);
    }

    if (previousHandCount !== null && currentHandCount < previousHandCount) {
      if (unoBadgeResetTimerRef.current !== null) {
        window.clearTimeout(unoBadgeResetTimerRef.current);
      }
      unoBadgeResetTimerRef.current = window.setTimeout(() => {
        setShowUnoDeclaredBadge(false);
        unoBadgeResetTimerRef.current = null;
      }, 1000);
    }

    prevLocalHandCountRef.current = currentHandCount;
  }, [localPlayer]);

  useEffect(() => {
    if (!showUnoDeclaredBadge || !game) return;
    if (game.currentPlayerIndex === localPlayerIndex) return;

    if (unoBadgeResetTimerRef.current !== null) {
      window.clearTimeout(unoBadgeResetTimerRef.current);
      unoBadgeResetTimerRef.current = null;
    }
    const hideTimer = window.setTimeout(() => {
      setShowUnoDeclaredBadge(false);
    }, 0);
    return () => window.clearTimeout(hideTimer);
  }, [showUnoDeclaredBadge, game?.currentPlayerIndex, localPlayerIndex, game]);

  // Record wins as they happen
  useEffect(() => {
    if (game?.winnerId) {
      const winner = game.players.find(p => p.id === game.winnerId);
      if (winner && prevWinnerRef.current !== game.winnerId) {
        prevWinnerRef.current = game.winnerId;
        recordWin(winner.name);
        playTableChime(winner.id === localPlayer?.id ? "win" : "lose");
        announceBoardWinner(game.winnerId, localPlayer?.id ?? null, game.turnCount * 17 + 9);
      }
    } else {
      prevWinnerRef.current = null;
    }
  }, [game?.winnerId, game?.players, game?.turnCount, localPlayer?.id, recordWin]);

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

    const timer = window.setTimeout(() => {
      animateDealSequence(
        game.players.map((player) => player.id),
        game.players.map((player) => player.hand.length),
        'draw',
      );
    }, 120);

    return () => window.clearTimeout(timer);
  }, [game, animateDealSequence]);

  useEffect(() => {
    if (!game) return;
    const previous = prevGameRef.current;

    const actionKey = `${game.turnCount}:${JSON.stringify(game.lastAction)}`;
    if (prevActionKeyRef.current === actionKey) return;
    prevActionKeyRef.current = actionKey;

    announceBoardFromTransition(previous, game, localPlayer?.id ?? null, actionKey);

    const action = game.lastAction;
    if (action.type === "draw") {
      playTableChime("draw");
      const drawTransferDelay = Math.max(40, getBoardVoiceRemainingMs() + 40);
      const timer = window.setTimeout(() => {
        animateDrawToPlayer(action.playerId, action.count);
      }, drawTransferDelay);
      return () => window.clearTimeout(timer);
    }

    if (action.type === "callOut") {
      playTableChime("callOut");
      const callOutFlashDelay = action.callerId === action.targetId
        ? ACTION_FLASH_HOLD_MS + 40
        : (ACTION_FLASH_HOLD_MS * 2) + 80;
      const drawTransferDelay = Math.max(callOutFlashDelay, getBoardVoiceRemainingMs() + 40);
      const timer = window.setTimeout(() => {
        animateDrawToPlayer(action.targetId, action.penalty);
      }, drawTransferDelay);
      return () => window.clearTimeout(timer);
    }

    if (action.type === "play") {
      playShuffleMotionChime();
      animatePlayToDiscard(action.playerId, action.card);

      if (action.card.value === "skip") playTableChime("skip");
      else if (action.card.value === "reverse") playTableChime("reverse");
      else if (action.card.value === "draw2") playTableChime("draw2");
      else if (action.card.value === "wild4") playTableChime("wild4");
      else if (action.card.value === "wild") playTableChime("wild");
      else if (action.card.value === "shuffle") playTableChime("shuffle");
      else playTableChime("cardPlay");

      if (action.card.value === 'discardAll' && action.discardAllCount && action.discardAllCount > 0) {
        playShuffleMotionChime();
        const timer = window.setTimeout(() => {
          animateDiscardAllToDiscard(action.playerId, action.card.color, action.discardAllCount ?? 0);
        }, 120);
        return () => window.clearTimeout(timer);
      }

      if (action.shuffledHands && previous) {
        const actorIndex = previous.players.findIndex((player) => player.id === action.playerId);
        if (actorIndex >= 0) {
          const previousLocalHand = previous.players.find((player) => player.id === localPlayer?.id)?.hand ?? [];
          const collectCards = action.playerId === localPlayer?.id
            ? previousLocalHand.filter((card) => card.id !== action.card.id)
            : previousLocalHand;
          const collectDuration = animateCollectLocalHandForShuffle(collectCards);

          const order = Array.from({ length: game.players.length }, (_, index) => {
            const seat = (actorIndex + previous.direction + (index * previous.direction) + game.players.length * 4) % game.players.length;
            return game.players[seat]?.id;
          }).filter((playerId): playerId is string => Boolean(playerId));

          const counts = order.map((playerId) => game.players.find((player) => player.id === playerId)?.hand.length ?? 0);
          const timer = window.setTimeout(() => {
            animateDealSequence(order, counts, 'discard');
          }, 120 + collectDuration);
          return () => window.clearTimeout(timer);
        }
      }
    }
  }, [game, localPlayer?.id, animateCollectLocalHandForShuffle, animateDealSequence, animateDiscardAllToDiscard, animateDrawToPlayer, animatePlayToDiscard]);

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
        const total = Math.max(2, game.pendingDraw || 0);
        queueActionFlash(`+${total}`, "yellow");
        return;
      }

      if (action.card.value === "wild4") {
        const total = Math.max(4, game.pendingDraw || 0);
        queueActionFlash(`+${total}`, "red");
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
        queueActionFlash("Shuffle", "blue");
      }
      return;
    }

    if (action.type === "declareUno") {
      playTableChime("uno");
      let showTimer: number | null = null;
      if (action.playerId === localPlayer.id) {
        if (unoBadgeResetTimerRef.current !== null) {
          window.clearTimeout(unoBadgeResetTimerRef.current);
        }
        showTimer = window.setTimeout(() => {
          setShowUnoDeclaredBadge(true);
        }, 0);
        unoBadgeResetTimerRef.current = window.setTimeout(() => {
          setShowUnoDeclaredBadge(false);
          unoBadgeResetTimerRef.current = null;
        }, 1200);
      }
      queueActionFlash("UNO", "red");
      return () => {
        if (showTimer !== null) {
          window.clearTimeout(showTimer);
        }
      };
    }

    if (action.type === "callOut") {
      if (action.callerId === action.targetId) {
        queueActionFlash(`FALSE CALL +${action.penalty}`, "red");
        return;
      }
      queueActionFlash("UNO", "red");
      const timer = window.setTimeout(() => {
        triggerActionFlash(`+${action.penalty}`, "yellow");
      }, ACTION_FLASH_HOLD_MS + 40);
      return () => window.clearTimeout(timer);
    }

  }, [game, localPlayer, triggerActionFlash]);

  const confirmExitGame = () => { setShowExitConfirm(false); resetGame(); onReset(); };

  const declareUno = useCallback(() => {
    if (!game || !localPlayer || game.winnerId) return;
    if (localPlayer.isBot) return;
    sayUno(localPlayerIndex);
    if (unoBadgeResetTimerRef.current !== null) {
      window.clearTimeout(unoBadgeResetTimerRef.current);
      unoBadgeResetTimerRef.current = null;
    }
    setShowUnoDeclaredBadge(true);
    setShowUnoFlash(true);
    window.setTimeout(() => setShowUnoFlash(false), 900);
  }, [game, localPlayer, sayUno, localPlayerIndex]);

  const autoDeclareUnoIfNeeded = useCallback(() => {
    if (!game || !localPlayer || localPlayer.isBot) return;
    if (!game.rules.mustDeclareUno || localPlayer.saidUno) return;
    // Dialog play actions can immediately drop the hand to one card.
    // Mirror pressing the UNO button right before the play resolves.
    if (localPlayer.hand.length <= 2) {
      declareUno();
    }
  }, [game, localPlayer, declareUno]);

  const pickAutoWildColor = useCallback((hand: Card[]): CardColor => {
    const colors: Array<Exclude<CardColor, "wild">> = ["red", "yellow", "green", "blue"];
    const counts: Record<Exclude<CardColor, "wild">, number> = { red: 0, yellow: 0, green: 0, blue: 0 };

    for (const card of hand) {
      if (card.color === "red" || card.color === "yellow" || card.color === "green" || card.color === "blue") {
        counts[card.color] += 1;
      }
    }

    let best: CardColor = "red";
    let bestCount = -1;
    for (const color of colors) {
      if (counts[color] > bestCount) {
        best = color;
        bestCount = counts[color];
      }
    }
    return best;
  }, []);

  const handleCallOut = useCallback((callerIdx: number, targetIdx: number) => {
    callOut(callerIdx, targetIdx);
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
      }, 40);
    }, 160);
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

    if (turnTransitionLocked) {
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
    turnTransitionLocked,
  ]);

  useEffect(() => {
    if (!game || !localPlayer || !currentPlayer) return;
    if (!isLocalTurn || localPlayer.isBot || game.winnerId) return;
    if (turnTransitionLocked) return;

    const turnKey = `${game.turnCount}:${game.currentPlayerIndex}`;
    if (turnCountdownSeconds > 0) {
      if (autoTurnHandledRef.current !== turnKey) {
        autoTurnHandledRef.current = null;
      }
      return;
    }

    if (autoTurnHandledRef.current === turnKey) return;

    const timer = window.setTimeout(() => {
      if (autoTurnHandledRef.current === turnKey) return;
      autoTurnHandledRef.current = turnKey;

      setDrawDecisionCardId(null);
      if (pendingWild) {
        confirmWildColor(pickAutoWildColor(localPlayer.hand));
        return;
      }

      const playableCards = localPlayer.hand.filter((card) => playableCardIds.has(card.id));
      if (playableCards.length > 0) {
        const chosen = playableCards.find((card) => card.color !== "wild") ?? playableCards[0];
        autoDeclareUnoIfNeeded();
        selectCard(chosen);
        return;
      }

      if (game.pendingDraw > 0 || !drawnThisTurn) {
        drawCard();
        return;
      }

      pass();
    }, 140);

    return () => window.clearTimeout(timer);
  }, [
    game,
    localPlayer,
    currentPlayer,
    isLocalTurn,
    turnTransitionLocked,
    turnCountdownSeconds,
    pendingWild,
    drawnThisTurn,
    playableCardIds,
    autoDeclareUnoIfNeeded,
    pickAutoWildColor,
    confirmWildColor,
    selectCard,
    drawCard,
    pass,
  ]);

  useEffect(() => {
    const isHumanTurnSafe = Boolean(
      game
      && localPlayer
      && currentPlayer
      && isLocalTurn
      && !localPlayer.isBot
      && !game.winnerId,
    );

    const stackOpen = Boolean(game && isHumanTurnSafe && game.pendingDraw > 0 && hasPendingStackOption);

    const revealed = drawnCardId && localPlayer
      ? localPlayer.hand.find((card) => card.id === drawnCardId) ?? null
      : null;
    const drawnOpen = Boolean(
      isHumanTurnSafe
      && drawnThisTurn
      && revealed
      && playableCardIds.has(revealed.id)
      && drawDecisionCardId === revealed.id,
    );

    const overlayOpen = stackOpen || drawnOpen || !!pendingWild || showExitConfirm;
    if (!overlayOpen && isHumanTurnSafe) return;
    const resetTimer = window.setTimeout(() => {
      setHoveredHandPosition(null);
    }, 0);
    return () => window.clearTimeout(resetTimer);
  }, [
    game,
    localPlayer,
    currentPlayer,
    isLocalTurn,
    hasPendingStackOption,
    drawnCardId,
    drawnThisTurn,
    playableCardIds,
    drawDecisionCardId,
    pendingWild,
    showExitConfirm,
  ]);

  useEffect(() => {
    if (!showGameSettingsMenu) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (gameSettingsRef.current && !gameSettingsRef.current.contains(event.target as Node)) {
        setShowGameSettingsMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showGameSettingsMenu]);

  useEffect(() => {
    const syncMusicState = () => {
      setMusicEnabled(isMusicEnabledForContext("game"));
    };
    window.addEventListener("uno:audio-settings", syncMusicState);
    return () => window.removeEventListener("uno:audio-settings", syncMusicState);
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;

    // Keep viewport metrics stable while playing to avoid modal-triggered screen shifts.
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";

    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
    };
  }, []);

  const handleToggleMusic = useCallback(() => {
    const next = !musicEnabled;
    // Keep both contexts aligned so music continues across home/game transitions.
    setMusicEnabledForContext("lobby", next);
    setMusicEnabledForContext("game", next);
    setMusicEnabled(next);
  }, [musicEnabled]);

  if (!game || !localPlayer || !currentPlayer) return null;

  const topDiscard = game.discardPile[game.discardPile.length - 1];
  const winner = game.winnerId ? game.players.find(p => p.id === game.winnerId) : null;
  const humanTurn = isLocalTurn && !localPlayer.isBot && !game.winnerId;
  const drawDisabled = botThinking || turnTransitionLocked || !!game.winnerId || (drawnThisTurn && game.pendingDraw === 0) || !humanTurn;
  const sortedHand = sortHand(localPlayer.hand);
  const handCount = sortedHand.length;
  const opponentSeatOrder = Array.from({ length: Math.max(0, game.players.length - 1) }, (_, step) => {
    const playerIndex = (localPlayerIndex + 1 + step) % game.players.length;
    return {
      playerIndex,
      player: game.players[playerIndex],
    };
  });

  interface SeatLayout {
    top: string;
    left: string;
    angle: number;
    translateX?: string;
    translateY?: string;
  }

  const getOpponentSeatLayouts = (count: number): SeatLayout[] => {
    const TOP_CENTER_Y = "10%";
    const TOP_CORNER_Y = "16%";
    const SIDE_CENTER_Y = "50%";
    const TOP_LEFT_X = "24%";
    const TOP_RIGHT_X = "76%";
    const SIDE_LEFT_X = "0%";
    const SIDE_RIGHT_X = "100%";
    const SIDE_LEFT_TRANSLATE_X = "0%";
    const SIDE_RIGHT_TRANSLATE_X = "-100%";

    const layouts: Record<number, SeatLayout[]> = {
      1: [
        // 2 players total: top-center on vertical axis
        { top: TOP_CENTER_Y, left: "50%", angle: 0, translateX: "-50%", translateY: "-50%" },
      ],
      2: [
        // 3 players total, clockwise from local(bottom): left-adjacent -> right-adjacent
        { top: TOP_CORNER_Y, left: TOP_LEFT_X, angle: -45, translateX: "-50%", translateY: "-50%" },
        { top: TOP_CORNER_Y, left: TOP_RIGHT_X, angle: 45, translateX: "-50%", translateY: "-50%" },
      ],
      3: [
        // 4 players total, clockwise from local(bottom): left -> top -> right
        { top: SIDE_CENTER_Y, left: SIDE_LEFT_X, angle: -90, translateX: SIDE_LEFT_TRANSLATE_X, translateY: "-50%" },
        { top: TOP_CENTER_Y, left: "50%", angle: 0, translateX: "-50%", translateY: "-50%" },
        { top: SIDE_CENTER_Y, left: SIDE_RIGHT_X, angle: 90, translateX: SIDE_RIGHT_TRANSLATE_X, translateY: "-50%" },
      ],
      4: [
        // 5 players total, clockwise from local(bottom): left -> top-left -> top-right -> right
        { top: SIDE_CENTER_Y, left: SIDE_LEFT_X, angle: -90, translateX: SIDE_LEFT_TRANSLATE_X, translateY: "-50%" },
        { top: TOP_CORNER_Y, left: TOP_LEFT_X, angle: -45, translateX: "-50%", translateY: "-50%" },
        { top: TOP_CORNER_Y, left: TOP_RIGHT_X, angle: 45, translateX: "-50%", translateY: "-50%" },
        { top: SIDE_CENTER_Y, left: SIDE_RIGHT_X, angle: 90, translateX: SIDE_RIGHT_TRANSLATE_X, translateY: "-50%" },
      ],
      5: [
        // 6 players total, clockwise from local(bottom): left -> top-left -> top -> top-right -> right
        { top: SIDE_CENTER_Y, left: SIDE_LEFT_X, angle: -90, translateX: SIDE_LEFT_TRANSLATE_X, translateY: "-50%" },
        { top: TOP_CORNER_Y, left: TOP_LEFT_X, angle: -45, translateX: "-50%", translateY: "-50%" },
        { top: TOP_CENTER_Y, left: "50%", angle: 0, translateX: "-50%", translateY: "-50%" },
        { top: TOP_CORNER_Y, left: TOP_RIGHT_X, angle: 45, translateX: "-50%", translateY: "-50%" },
        { top: SIDE_CENTER_Y, left: SIDE_RIGHT_X, angle: 90, translateX: SIDE_RIGHT_TRANSLATE_X, translateY: "-50%" },
      ],
      6: [
        // Fallback clockwise order from local(bottom): left -> top-left -> top -> top-right -> right -> bottom
        { top: SIDE_CENTER_Y, left: SIDE_LEFT_X, angle: -90, translateX: SIDE_LEFT_TRANSLATE_X, translateY: "-50%" },
        { top: TOP_CORNER_Y, left: TOP_LEFT_X, angle: -45, translateX: "-50%", translateY: "-50%" },
        { top: TOP_CENTER_Y, left: "50%", angle: 0, translateX: "-50%", translateY: "-50%" },
        { top: TOP_CORNER_Y, left: TOP_RIGHT_X, angle: 45, translateX: "-50%", translateY: "-50%" },
        { top: SIDE_CENTER_Y, left: SIDE_RIGHT_X, angle: 90, translateX: SIDE_RIGHT_TRANSLATE_X, translateY: "-50%" },
        { top: "88%", left: "50%", angle: 0, translateX: "-50%", translateY: "-50%" },
      ],
    };

    return layouts[Math.min(count, 6)] ?? layouts[6];
  };

  const opponentSeatLayouts = getOpponentSeatLayouts(opponentSeatOrder.length);

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
  const cardBudgetPx = viewportH - 100 - 180 - 36 - 20;
  const scaledByHeight = Math.max(0.75, Math.min(1.5, (cardBudgetPx - 40) / 122));
  const reservedRightPx = 0;
  const availableHandWidth = Math.max(220, viewportW - (isCompactBoard ? 34 : 52) - reservedRightPx);
  const requiredHandWidthAtScale1 = 82 + Math.max(0, handCount - 1) * 26;
  const scaledByWidth = availableHandWidth / Math.max(1, requiredHandWidthAtScale1);
  // Keep center table and opponent sizes stable; only hand fan reacts to hand count/width.
  const tableCardScale = boardScale < 1
    ? Math.max(0.50, Math.min(scaledByHeight, 1.2))
    : Math.max(0.50, Math.min(scaledByHeight, 1.5));
  const localHandCardScale = boardScale < 1
    ? Math.max(0.50, Math.min(scaledByHeight, scaledByWidth, 1.2))
    : Math.max(0.50, Math.min(scaledByHeight, scaledByWidth, 1.5));
  const localTurnBoost = isLocalTurn ? 1.08 : 1;
  const pileCardScale = tableCardScale;
  const pileCardColumnWidth = Math.round((82 * pileCardScale) + (22 * pileCardScale));
  const turnColumnWidth = Math.round((isCompactBoard ? 44 : 54) * pileCardScale);
  const localHandAreaHeightPx = isCompactBoard
    ? Math.round(122 * localHandCardScale) + (isNarrowMobile ? 20 : 28)
    : Math.round(122 * localHandCardScale) + 36;

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
  const currentTurnTimerMs = currentPlayer.isBot
    ? BOT_THINK_DELAY_MS
    : isLocalTurn
      ? pendingWild
        ? HUMAN_IDLE_WILD_PICK_TIMEOUT_MS
        : drawnThisTurn
          ? HUMAN_IDLE_AFTER_DRAW_TIMEOUT_MS
          : HUMAN_IDLE_TIMEOUT_MS
      : 0;
  const currentTurnTimerSeconds = Math.max(1, Math.ceil(currentTurnTimerMs / 1000));
  const currentTurnProgress = currentTurnTimerMs > 0
    ? Math.max(0, Math.min(1, (currentTurnTimerSeconds - turnCountdownSeconds) / currentTurnTimerSeconds))
    : 0;

  const handOverlap = Math.round(26 * localHandCardScale);
  const localHandSidePadding = isCompactBoard ? (isNarrowMobile ? 82 : 120) : 132;
  const ARC_SPREAD = 3.5;
  const ARC_LIFT   = 2.5;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Courier+Prime:wght@400;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; }

        /* Emil's custom easing curves for responsive UI */
        --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
        --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
        --ease-out-soft: cubic-bezier(0.22, 1, 0.36, 1);

        @keyframes blink   { 0%,100%{opacity:1} 50%{opacity:0.15} }
        @keyframes dot     { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.3;transform:scale(0.6)} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes modalIn { from{opacity:0;transform:translateY(12px) scale(0.95);} to{opacity:1;transform:translateY(0) scale(1);} }
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
          0%  { opacity:0; transform:translate(-50%,-50%) scale(0.8); }
          20% { opacity:1; transform:translate(-50%,-50%) scale(1.08); }
          75% { opacity:1; transform:translate(-50%,-50%) scale(1);    }
          100%{ opacity:0; transform:translate(-50%,-50%) scale(1.12);  }
        }
        @keyframes actionFlashPop {
          0%  { opacity:0; transform:scale(0.75); }
          18% { opacity:1; transform:scale(1.06); }
          74% { opacity:1; transform:scale(1); }
          100%{ opacity:0; transform:scale(1.1); }
        }
        @keyframes discardLand {
          0%  { transform:translateY(-16px) rotate(-10deg) scale(0.92); opacity:0.4; }
          65% { transform:translateY(2px) rotate(-1deg) scale(1.02); opacity:1; }
          100%{ transform:translateY(0) rotate(-2deg) scale(1); opacity:1; }
        }
        /* Call out button pulses up and down to demand attention */
        @keyframes callOutAttention {
          from { transform: translateY(0) scale(1); }
          to   { transform: translateY(-4px) scale(1.04); }
        }
        @keyframes turnRingFlow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        /* Call out flash centre screen */
        @keyframes callOutPop {
          0%  { opacity:0; transform:scale(0.75); }
          18% { opacity:1; transform:scale(1.06); }
          75% { opacity:1; transform:scale(1); }
          100%{ opacity:0; transform:scale(1.1); }
        }
        @keyframes confettiFall {
          0% { transform: translateY(-16vh) rotate(0deg); opacity: 0; }
          10% { opacity: 0.96; }
          100% { transform: translateY(118vh) rotate(760deg); opacity: 0.9; }
        }

        .hand-card { transition: transform 0.18s var(--ease-out-soft), filter 0.18s ease !important; }

        .draw-pile-btn { 
          transition: filter 0.2s ease, opacity 0.2s ease, transform 0.15s var(--ease-out);
        }
        .draw-pile-btn:active:not(:disabled) { 
          transform: scale(0.97);
        }
        .draw-pile-btn:hover:not(:disabled) { 
          transform: translateY(-4px);
        }

        .uno-btn { 
          transition: opacity 0.12s, transform 0.12s var(--ease-out) !important;
        }
        .uno-btn:hover { 
          opacity: 0.82 !important;
          transform: translateY(-2px);
        }
        .uno-btn:active {
          transform: scale(0.97);
        }

        .winner-secondary-btn:hover {
          color: var(--ui-text) !important;
          transform: translateY(-1px);
        }
        .winner-secondary-btn:active {
          transform: scale(0.97);
        }

        .winner-primary-btn:hover {
          opacity: 0.76 !important;
          transform: translateY(-1px);
        }
        .winner-primary-btn:active {
          transform: scale(0.97);
        }

        button {
          transition: transform 0.1s var(--ease-out), opacity 0.1s ease, color 0.12s ease;
        }
        button:active:not(:disabled) {
          transform: scale(0.97);
        }

        /* Responsive opponent strip on hover */
        [role="button"]:has(> div > [class*="fan"]):hover {
          filter: brightness(1.05);
        }
      `}</style>

      <AnimatedCards animations={animations} />
      {actionFlash && <ActionFlash text={actionFlash.text} tone={actionFlash.tone} />}

      <div
        onPointerDownCapture={() => primeTableAudioFromUserGesture()}
        style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100svh",
        overflow: "clip",
        color: "var(--ui-text)", background: "var(--ui-bg)",
        fontFamily: "'Courier Prime', monospace",
        display: "grid",
        gridTemplateRows: "auto minmax(0, 1fr) auto",
        overscrollBehavior: "none",
        contain: "layout paint",
      }}
      >
        <div
          ref={gameSettingsRef}
          style={{
            position: "absolute",
            bottom: isNarrowMobile ? 12 : 16,
            right: isNarrowMobile ? 8 : 12,
            zIndex: 44,
            display: "flex",
            alignItems: "center",
            gap: isNarrowMobile ? 8 : 10,
          }}
        >
          <div
            style={{
              pointerEvents: "none",
              position: "relative",
              display: "flex",
              alignItems: "center",
              transform: "scale(1.2)",
              transformOrigin: "center right",
            }}
          >
            <ProfileChip
              name={localPlayer.name}
              seed={localPlayer.id}
              compact={false}
              maxNameWidth={isNarrowMobile ? 110 : 144}
              ringColor={localPlayer.saidUno && localPlayer.hand.length === 1 ? "var(--ui-accent-red)" : undefined}
              ringWidth={2.5}
              progressRing={isLocalTurn ? currentTurnProgress : undefined}
            />

            <span
              style={{
                position: "absolute",
                right: `calc(100% + ${isNarrowMobile ? 6 : 8}px)`,
                top: "50%",
                transform: "translateY(-50%)",
                fontFamily: "'Bebas Neue', cursive",
                fontSize: isNarrowMobile ? 14 : 16,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                background: "var(--ui-accent-red)",
                color: "#fff",
                border: "1px solid color-mix(in srgb, var(--ui-accent-red) 78%, #fff 22%)",
                padding: isNarrowMobile ? "2px 8px" : "3px 10px",
                lineHeight: 1,
                animation: showUnoDeclaredBadge ? "blink 0.85s step-end infinite" : "none",
                boxShadow: "0 0 10px rgba(192,57,43,0.45)",
                opacity: showUnoDeclaredBadge ? 1 : 0,
                transition: "opacity 0.14s ease",
                pointerEvents: "none",
              }}
            >
              UNO
            </span>
          </div>

          <button
            type="button"
            onClick={handleToggleMusic}
            title={musicEnabled ? "Mute music" : "Unmute music"}
            style={{
              width: isNarrowMobile ? 40 : 44,
              height: isNarrowMobile ? 40 : 44,
              border: "none",
              background: "transparent",
              color: musicEnabled ? "var(--ui-text)" : "var(--ui-accent-red)",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
              boxShadow: "none",
              transition: "transform 0.12s cubic-bezier(0.23, 1, 0.32, 1), background-color 0.15s ease, box-shadow 0.15s ease, color 0.15s ease",
            }}
          >
            {musicEnabled ? <Volume2 size={18} strokeWidth={2.4} /> : <VolumeX size={18} strokeWidth={2.4} />}
          </button>

          <button
            type="button"
            onClick={() => setShowGameSettingsMenu((prev) => !prev)}
            title="Settings"
            style={{
              width: isNarrowMobile ? 40 : 44,
              height: isNarrowMobile ? 40 : 44,
              border: "none",
              background: "transparent",
              color: "var(--ui-text)",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
              boxShadow: "none",
              transition: "transform 0.12s cubic-bezier(0.23, 1, 0.32, 1), background-color 0.15s ease, box-shadow 0.15s ease",
            }}
          >
            <Settings size={18} strokeWidth={2.4} />
          </button>

          {showGameSettingsMenu ? (
            <div
              style={{
                position: "absolute",
                bottom: "calc(100% + 8px)",
                right: 0,
                minWidth: 220,
                border: "1px solid var(--ui-line)",
                background: "var(--ui-surface)",
                boxShadow: "0 12px 28px rgba(0,0,0,0.24)",
                display: "grid",
                zIndex: 45,
              }}
            >
              <div
                style={{
                  padding: "12px 18px",
                  borderBottom: "1px solid var(--ui-line)",
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: "color-mix(in oklab, var(--ui-text) 72%, transparent)",
                  fontFamily: "'Courier Prime', monospace",
                }}
              >
                Settings
              </div>
              <button
                type="button"
                onClick={() => {
                  onOpenSettings("profile");
                  setShowGameSettingsMenu(false);
                }}
                style={{
                  border: "none",
                  borderBottom: "1px solid var(--ui-line)",
                  background: "transparent",
                  color: "var(--ui-text)",
                  padding: "10px 12px",
                  textAlign: "left",
                  fontFamily: "'Courier Prime', monospace",
                  fontSize: 11,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  transition: "color 0.12s ease, background-color 0.12s ease",
                  width: "100%",
                }}
              >
                <User size={14} strokeWidth={2.5} />
                Profile
              </button>
              <button
                type="button"
                onClick={() => {
                  onOpenSettings("controls");
                  setShowGameSettingsMenu(false);
                }}
                style={{
                  border: "none",
                  borderBottom: "1px solid var(--ui-line)",
                  background: "transparent",
                  color: "var(--ui-text)",
                  padding: "10px 12px",
                  textAlign: "left",
                  fontFamily: "'Courier Prime', monospace",
                  fontSize: 11,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  transition: "color 0.12s ease, background-color 0.12s ease",
                  width: "100%",
                }}
              >
                <Gamepad2 size={14} strokeWidth={2.5} />
                Controls
              </button>
              <button
                type="button"
                onClick={() => {
                  onOpenSettings("audio");
                  setShowGameSettingsMenu(false);
                }}
                style={{
                  border: "none",
                  borderBottom: "1px solid var(--ui-line)",
                  background: "transparent",
                  color: "var(--ui-text)",
                  padding: "10px 12px",
                  textAlign: "left",
                  fontFamily: "'Courier Prime', monospace",
                  fontSize: 11,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  transition: "color 0.12s ease, background-color 0.12s ease",
                  width: "100%",
                }}
              >
                <AudioLines size={14} strokeWidth={2.5} />
                Audio settings
              </button>
              <button
                type="button"
                onClick={() => {
                  onCycleTheme();
                  setShowGameSettingsMenu(false);
                }}
                style={{
                  border: "none",
                  borderBottom: "1px solid var(--ui-line)",
                  background: "transparent",
                  color: "var(--ui-text)",
                  padding: "10px 12px",
                  textAlign: "left",
                  fontFamily: "'Courier Prime', monospace",
                  fontSize: 11,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  transition: "color 0.12s ease, background-color 0.12s ease",
                  width: "100%",
                }}
              >
                Theme: {currentThemeLabel}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowGameSettingsMenu(false);
                  setShowExitConfirm(true);
                }}
                style={{
                  border: "none",
                  background: "color-mix(in oklab, var(--ui-accent-red) 14%, transparent)",
                  color: "var(--ui-accent-red)",
                  padding: "10px 12px",
                  textAlign: "left",
                  fontFamily: "'Courier Prime', monospace",
                  fontSize: 11,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  transition: "color 0.12s ease, background-color 0.12s ease, transform 0.1s cubic-bezier(0.23, 1, 0.32, 1)",
                  width: "100%",
                }}
              >
                <LogOut size={14} strokeWidth={2.5} />
                Leave game
              </button>
            </div>
          ) : null}
        </div>

        {/* ── Opponent Seat Overlay ── */}
        <section
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 2,
            pointerEvents: "none",
          }}
        >
          {opponentSeatOrder.map(({ player, playerIndex }, index) => {
            const seat = opponentSeatLayouts[index] ?? {
              top: "20%",
              left: "50%",
              angle: 0,
              translateX: "-50%",
              translateY: "-50%",
            };
            const canCallOut =
              game.rules.mustDeclareUno &&
              !game.winnerId &&
              player.hand.length === 1 &&
              !player.saidUno;

            const isCurrentTurn = game.currentPlayerIndex === playerIndex;

            return (
              <div
                key={player.id}
                ref={(node) => {
                  playerZoneRefs.current[player.id] = node;
                }}
                style={{
                  position: "absolute",
                  top: seat.top,
                  left: seat.left,
                  transform: `translate(${seat.translateX ?? "-50%"}, ${seat.translateY ?? "-50%"})`,
                  transformOrigin: "center center",
                  zIndex: isCurrentTurn ? 12 : 4,
                  // Avoid intercepting clicks on draw/play controls when more seats are visible.
                  pointerEvents: canCallOut ? "auto" : "none",
                }}
              >
                <OpponentStrip
                  player={player}
                  isCurrentTurn={isCurrentTurn}
                  canCallOut={canCallOut}
                  onCallOut={() => handleCallOut(localPlayerIndex, playerIndex)}
                  cardScale={tableCardScale}
                  compact={isCompactBoard}
                  angle={seat.angle}
                  turnProgress={isCurrentTurn ? currentTurnProgress : 0}
                />
              </div>
            );
          })}
        </section>

        {/* ── Table ── */}
        <main style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
        }}>

          {game.pendingDraw > 0 && humanTurn ? (
            <div style={{
              position: "absolute",
              left: "50%",
              top: isCompactBoard ? (isNarrowMobile ? "calc(50% - 110px)" : "calc(50% - 124px)") : "calc(50% - 132px)",
              transform: "translateX(-50%)",
              pointerEvents: "none",
              zIndex: 6,
            }}>
              <span style={{
                fontFamily: "'Courier Prime', monospace", fontSize: 11,
                color: "var(--ui-accent-red)", letterSpacing: "0.1em", textTransform: "uppercase",
                border: "1px solid var(--ui-accent-red)", padding: "3px 12px",
                animation: "blink 2s step-end infinite",
                background: "color-mix(in srgb, var(--ui-bg) 82%, transparent)",
              }}>{hasPendingStackOption ? `+${game.pendingDraw} incoming` : `taking +${game.pendingDraw}`}</span>
            </div>
          ) : null}

          <div style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            display: "grid",
            gridTemplateColumns: `${pileCardColumnWidth}px ${turnColumnWidth}px ${pileCardColumnWidth}px`,
            alignItems: "end",
            justifyItems: "center",
            columnGap: isCompactBoard ? (isNarrowMobile ? 8 : 14) : 32,
            pointerEvents: "auto",
            zIndex: 5,
          }}>

            {/* Draw pile */}
            <div style={{ width: pileCardColumnWidth, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
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
                  transition: "transform 0.15s cubic-bezier(0.23, 1, 0.32, 1), opacity 0.2s ease, filter 0.2s ease",
                }}
              >
                <GameCard card={{ id: "_draw", color: "wild", value: "wild" }} faceDown scale={pileCardScale} />
              </button>
              <span style={{
                fontFamily: "'Courier Prime', monospace", fontSize: 10,
                letterSpacing: "0.08em", color: "var(--ui-muted)",
              }}>{game.drawPile.length} left</span>
            </div>

            {/* Direction indicator (aligned with piles) */}
            <div style={{ width: turnColumnWidth, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
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
            <div style={{ width: pileCardColumnWidth, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <span style={{
                fontFamily: "'Courier Prime', monospace", fontSize: 9,
                letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--ui-muted)",
              }}>DISCARD</span>
              {topDiscard && (
                <div
                  ref={discardPileRef}
                  style={{
                    position: "relative",
                    width: Math.round((82 * pileCardScale) + (18 * pileCardScale)),
                    height: Math.round((122 * pileCardScale) + (20 * pileCardScale)),
                  }}
                >
                  {game.discardPile.slice(-4).map((card, idx, arr) => {
                    const isTop = idx === arr.length - 1;
                    const displayCard = isTop && discardDisplayCard ? discardDisplayCard : card;
                    const offset = arr.length - 1 - idx;
                    const horizontalShift = isTop ? 0 : (offset % 2 === 0 ? -1 : 1) * (2 + offset * 2);
                    return (
                      <div key={card.id} style={{
                        position: "absolute", inset: 0,
                        display: "flex", justifyContent: "center", alignItems: "center",
                        transform: `translate(${horizontalShift}px, ${offset * -2}px) rotate(${isTop ? -2 : -6 + idx * 3}deg)`,
                        opacity: isTop ? 1 : 0.78,
                        zIndex: idx + 1,
                        animation: isTop ? "discardLand 0.24s cubic-bezier(0.22,1,0.36,1)" : "none",
                        willChange: isTop ? "transform, opacity" : "auto",
                      }}>
                        <GameCard card={displayCard} scale={pileCardScale} />
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
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          overflow: "visible",
          zIndex: 12,
          paddingTop: isCompactBoard ? 12 : 16,
          paddingBottom: isCompactBoard ? 12 : 16,
        }}>

          {unoButtonVisible && (
            <button
              type="button"
              onClick={declareUno}
              className="uno-btn"
              style={{
                position: "absolute",
                left: isNarrowMobile ? "68%" : "72%",
                top: isNarrowMobile ? 6 : 8,
                transform: "translate(-50%, -30%)",
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
                transition: "transform 0.12s cubic-bezier(0.23, 1, 0.32, 1), opacity 0.12s ease",
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
                    autoDeclareUnoIfNeeded();
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
                    transition: "transform 0.1s cubic-bezier(0.23, 1, 0.32, 1), opacity 0.1s ease",
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
                    transition: "color 0.12s ease, border-color 0.12s ease, transform 0.1s cubic-bezier(0.23, 1, 0.32, 1)",
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
                      autoDeclareUnoIfNeeded();
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
                      transition: "transform 0.1s cubic-bezier(0.23, 1, 0.32, 1), opacity 0.1s ease",
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
                    transition: "color 0.12s ease, border-color 0.12s ease, transform 0.1s cubic-bezier(0.23, 1, 0.32, 1)",
                  }}
                >{drawnPlayableCard ? "Pass" : "Pass now"}</button>
              </div>
            </ActionTray>
          )}

          {/* Card fan — scrollable, full height */}
          <div style={{ overflow: "visible", width: "100%", position: "relative", zIndex: 13, height: `${localHandAreaHeightPx}px` }}>
            <div ref={localHandRef} style={{
              position: "absolute",
              left: "50%",
              bottom: 0,
              transform: "translateX(-50%)",
              display: "flex",
              alignItems: "flex-end",
              width: "max-content",
              paddingLeft:  localHandSidePadding,
              paddingRight: localHandSidePadding,
              paddingTop:   isCompactBoard ? (isNarrowMobile ? 8 : 12) : 16,
              paddingBottom: 0,
              height: `${localHandAreaHeightPx}px`,
              overflow: "visible",
            }}
              onMouseMove={(event) => {
                if (event.target === event.currentTarget) {
                  setHoveredHandPosition(null);
                }
              }}
              onMouseLeave={() => {
                setHoveredHandPosition(null);
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
                const baseTransform = `translateX(${horizontalPush}px) rotate(${rotateDeg}deg) translateY(${baseLift - dockLift}px) scale(${dockScale * localTurnBoost})`;

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
                      transition: "transform 0.18s cubic-bezier(0.23, 1, 0.32, 1), filter 0.18s ease",
                      cursor: playable ? "pointer" : "default",
                      outline: isSelected ? "2px solid var(--ui-text)" : "none",
                      outlineOffset: 3,
                      filter: isFreshDraw
                        ? "drop-shadow(0 0 16px rgba(192,57,43,0.45))"
                        : playable ? "drop-shadow(0 2px 4px rgba(26,15,0,0.14))" : "none",
                      animation: isFreshDraw ? "drewCardGlow 0.6s cubic-bezier(0.23, 1, 0.32, 1)" : "none",
                    } as CSSProperties & Record<string, string | number>}
                    onClick={playable ? (event) => handleSelectCard(card, event.currentTarget) : undefined}
                    onMouseEnter={() => {
                      setHoveredHandPosition(i);
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
                    <GameCard
                      card={card}
                      scale={localHandCardScale}
                      isPlayable={playable}
                      isSelected={isSelected}
                    />
                  </div>
                );
              })}
            </div>
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
            <p style={{
              margin: 0,
              fontFamily: "'Bebas Neue', cursive",
              fontSize: 30,
              letterSpacing: "0.05em",
              color: "var(--ui-text)",
            }}>
              Leave This Match?
            </p>
            <p style={{
              margin: 0,
              fontFamily: "'Courier Prime', monospace",
              fontSize: 12,
              letterSpacing: "0.04em",
              color: "var(--ui-muted)",
              lineHeight: 1.5,
            }}>
              Your current round will end and you will return to the main menu.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button onClick={() => setShowExitConfirm(false)} style={{
                border: "1px solid var(--ui-line)", background: "transparent",
                color: "var(--ui-muted)", padding: "10px 14px", cursor: "pointer",
                fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase",
                fontFamily: "'Courier Prime', monospace", 
                transition: "color 0.12s ease, transform 0.1s cubic-bezier(0.23, 1, 0.32, 1)",
              }}>Stay</button>
              <button onClick={confirmExitGame} style={{
                border: "none", background: "var(--ui-accent-red)", color: "#fff",
                padding: "10px 16px", cursor: "pointer",
                fontSize: 18, letterSpacing: "0.1em", textTransform: "uppercase",
                fontFamily: "'Bebas Neue', cursive",
                transition: "transform 0.1s cubic-bezier(0.23, 1, 0.32, 1)",
              }}>Exit</button>
            </div>
          </div>
        </div>
      )}

      {pendingWild && (
        <ColorPicker
          onSelect={(color) => {
            autoDeclareUnoIfNeeded();
            confirmWildColor(color);
          }}
          onCancel={cancelWild}
        />
      )}

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

type ActionFlashTone = "red" | "yellow" | "green" | "blue" | "text";
interface ActionFlashState {
  text: string;
  tone: ActionFlashTone;
}
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

