"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { Card, CardColor } from "../types/card";
import type { GameState, Player } from "../types/game";
import type { useUnoGame } from "../hooks/useUnoGame";
import UnoCard from "./UnoCard";
import ColorPicker from "./ColorPicker";

export type GameApi = ReturnType<typeof useUnoGame>;

interface GameBoardProps {
  gameApi: GameApi;
  onReset: () => void;
  onOpenSettings: () => void;
  onCycleTheme: () => void;
  currentThemeLabel: string;
}

interface OnlineWinnerActions {
  enabled: boolean;
  isHost: boolean;
  busy: boolean;
  onPlayAgain: () => void;
}

const MATCH_TARGET_POINTS = 500;

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
  skip: 10, reverse: 11, draw2: 12, wild: 13, wild4: 14,
};

function sortHand(cards: Card[]): Card[] {
  return [...cards].sort((a, b) => {
    const cd = (COLOR_ORDER[a.color] ?? 9) - (COLOR_ORDER[b.color] ?? 9);
    return cd !== 0 ? cd : (VALUE_ORDER[a.value] ?? 9) - (VALUE_ORDER[b.value] ?? 9);
  });
}

// ── Live feed ──────────────────────────────────────────────────────────────────
interface FeedEntry { id: number; text: string }

function LiveFeed({ entries }: { entries: FeedEntry[] }) {
  if (!entries.length) return null;
  return (
    <div style={{
      position: "fixed", top: 60, right: 10, zIndex: 40,
      display: "flex", flexDirection: "column", alignItems: "flex-end",
      gap: 5, pointerEvents: "none", maxWidth: 240,
    }}>
      {entries.map((e, i) => (
        <div key={e.id} style={{
          fontFamily: "'Courier Prime', monospace",
          fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase",
          background: "var(--ui-surface)", border: "1px solid var(--ui-line)",
          padding: "4px 10px",
          color: i === 0 ? "var(--ui-text)" : "var(--ui-muted)",
          opacity: i === 0 ? 1 : Math.max(0.18, 1 - i * 0.28),
          animation: i === 0 ? "feedIn 0.2s ease" : "none",
          transition: "opacity 0.4s ease",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          maxWidth: "100%",
        }}>{e.text}</div>
      ))}
    </div>
  );
}

function getCardPoints(card: Card): number {
  switch (card.value) {
    case "skip":
    case "reverse":
    case "draw2":
      return 20;
    case "wild":
    case "wild4":
      return 50;
    default:
      return Number(card.value);
  }
}

function getRoundPoints(game: GameState, winnerId: string): number {
  return game.players
    .filter((player) => player.id !== winnerId)
    .reduce(
      (total, player) => total + player.hand.reduce((handTotal, card) => handTotal + getCardPoints(card), 0),
      0,
    );
}

function useMatchScoreTracker() {
  const [pointsByPlayerId, setPointsByPlayerId] = useState<Record<string, number>>({});
  const addRoundPoints = useCallback((playerId: string, points: number) => {
    setPointsByPlayerId((prev) => ({
      ...prev,
      [playerId]: (prev[playerId] ?? 0) + points,
    }));
  }, []);
  const reset = useCallback(() => setPointsByPlayerId({}), []);
  return { pointsByPlayerId, addRoundPoints, reset };
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

// ── Opponent strip ─────────────────────────────────────────────────────────────
function OpponentStrip({
  player, isCurrentTurn, cardScale,
}: {
  player: Player; isCurrentTurn: boolean;
  cardScale: number;
}) {
  const n = player.hand.length;
  const fans = Math.min(n, 6);
  const overlap = Math.round(26 * cardScale);
  const fanWidth = Math.max(28, (82 * cardScale) + Math.max(0, fans - 1) * overlap);
  const fanHeight = 122 * cardScale + 12;
  const fanMid = (fans - 1) / 2;
  const hiddenTop = fanHeight * 0.48;

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
      opacity: isCurrentTurn ? 1 : 0.38,
      transition: "opacity 0.3s ease",
      position: "relative",
    }}>
      {/* Fanned face-down cards */}
      <div style={{
        position: "relative", height: fanHeight, width: fanWidth,
        marginTop: -hiddenTop, flexShrink: 0,
      }}>
        {fans === 0 ? (
          <span style={{ fontFamily: "'Courier Prime', monospace", fontSize: 9, color: "var(--ui-muted)" }}>empty</span>
        ) : Array.from({ length: fans }).map((_, i) => (
          <div key={i} style={{
            position: "absolute",
            left: i * overlap,
            top: (10 * cardScale) - Math.abs(i - fanMid) * (2.6 * cardScale),
            transform: `rotate(${(i - fanMid) * -7}deg)`,
            transformOrigin: "top center",
            zIndex: i,
            transition: "transform 0.2s ease, opacity 0.2s ease",
          }}>
            <UnoCard
              card={{ id: `_opp-${player.id}-${i}`, color: "wild", value: "wild" }}
              faceDown sizeMultiplier={cardScale}
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
          fontSize: 16, letterSpacing: "0.05em", color: "var(--ui-text)",
        }}>
          {player.isBot ? "⌘ " : ""}{player.name}
        </span>
        {player.saidUno && n === 1 && (
          <span style={{
            fontFamily: "'Courier Prime', monospace",
            fontSize: 8, fontWeight: 700, letterSpacing: "0.12em",
            background: "var(--ui-accent-red)", color: "#fff", padding: "2px 5px",
            animation: "blink 0.9s step-end infinite",
          }}>UNO</span>
        )}
      </div>

      <span style={{
        fontFamily: "'Courier Prime', monospace",
        fontSize: 9, color: "var(--ui-muted)", letterSpacing: "0.06em",
      }}>{n} {n === 1 ? "card" : "cards"}</span>
    </div>
  );
}

// ── Winner screen ──────────────────────────────────────────────────────────────
function WinnerScreen({
  winner,
  onExit,
  onDealAgain,
  dealAgainLabel,
  dealAgainDisabled,
  roundPoints,
  winnerTotalPoints,
  matchWinnerName,
  scoreRows,
  onlineActions,
}: {
  winner: Player;
  onExit: () => void;
  onDealAgain: () => void;
  dealAgainLabel: string;
  dealAgainDisabled: boolean;
  roundPoints: number;
  winnerTotalPoints: number;
  matchWinnerName: string | null;
  scoreRows: Array<{ playerId: string; name: string; points: number }>;
  onlineActions?: OnlineWinnerActions;
}) {
  const rematchEnabled = onlineActions?.enabled ?? false;
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
        }}>
          wins the round (+{roundPoints} points)
        </p>
        <p style={{
          fontFamily: "'Courier Prime', monospace", fontSize: 12,
          color: "var(--ui-muted)", margin: "8px 0 0", letterSpacing: "0.06em",
          textTransform: "uppercase",
        }}>{winnerTotalPoints} / {MATCH_TARGET_POINTS} points</p>
      </div>

      {matchWinnerName && (
        <p style={{
          margin: 0,
          fontFamily: "'Bebas Neue', cursive",
          fontSize: "clamp(28px, 6vw, 40px)",
          letterSpacing: "0.05em",
          color: "var(--ui-accent-red)",
          textTransform: "uppercase",
          textAlign: "center",
        }}>
          {matchWinnerName} wins the match!
        </p>
      )}

      {/* Session scoreboard */}
      {scoreRows.length > 0 && (
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
          }}>Match points</p>
          {scoreRows.map(({ playerId, name, points }) => (
            <div key={playerId} style={{
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
              }}>{points} pts</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ width: 1, height: 32, background: "var(--ui-line)" }} />
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={onExit} style={{
          fontFamily: "'Courier Prime', monospace", fontSize: 11, fontWeight: 700,
          letterSpacing: "0.1em", textTransform: "uppercase",
          background: "transparent", border: "1px solid var(--ui-line)",
          color: "var(--ui-muted)", padding: "12px 20px", cursor: "pointer",
          transition: "color 0.12s",
        }}
          onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = "var(--ui-text)")}
          onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = "var(--ui-muted)")}
        >Exit</button>
        <button
          onClick={onDealAgain}
          disabled={dealAgainDisabled || Boolean(rematchEnabled && (!onlineActions?.isHost || onlineActions.busy))}
          style={{
          fontFamily: "'Bebas Neue', cursive", fontSize: 22, letterSpacing: "0.14em",
          background: "var(--ui-text)", color: "var(--ui-bg)",
          border: "none", padding: "12px 36px",
          cursor: dealAgainDisabled || (rematchEnabled && (!onlineActions?.isHost || onlineActions.busy)) ? "default" : "pointer",
          transition: "opacity 0.12s",
          opacity: dealAgainDisabled || (rematchEnabled && (!onlineActions?.isHost || onlineActions.busy)) ? 0.5 : 1,
        }}
          onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.opacity = "0.7")}
          onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.opacity = "1")}
        >{dealAgainLabel}</button>
      </div>
      {rematchEnabled && (
        <p style={{
          margin: 0,
          fontFamily: "'Courier Prime', monospace",
          fontSize: 11,
          color: "var(--ui-muted)",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          textAlign: "center",
        }}>
          {onlineActions?.isHost
            ? "Play again starts a new round with the same room and players"
            : "Only the room host can start the rematch"}
        </p>
      )}
    </div>
  );
}

function Thinking({ name }: { name: string }) {
  return (
    <div style={{
      fontFamily: "'Courier Prime', monospace", fontSize: 11,
      color: "var(--ui-muted)", letterSpacing: "0.12em", textTransform: "uppercase",
      display: "flex", alignItems: "center", gap: 8,
    }}>
      <span style={{ animation: "blink 1.1s step-end infinite" }}>■</span>
      {name} is thinking
      <span style={{ animation: "blink 1.1s step-end 0.55s infinite" }}>■</span>
    </div>
  );
}

// ── Main board ─────────────────────────────────────────────────────────────────
export default function GameBoard({
  gameApi, onReset, onOpenSettings, onCycleTheme, currentThemeLabel,
}: GameBoardProps) {
  const {
    game, localPlayerIndex, pendingWild, drawnThisTurn, botThinking,
    log, currentPlayer, localPlayer, isLocalTurn, playableCardIds,
    selectCard, confirmWildColor, cancelWild, drawCard, sayUno, callOut, resetGame,
  } = gameApi;

  const hasPendingStackOption = Boolean(
    (gameApi as unknown as { hasPendingStackOption?: boolean }).hasPendingStackOption,
  );

  const [feed, setFeed] = useState<FeedEntry[]>([]);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showUnoFlash, setShowUnoFlash] = useState(false);
  const [callOutFlashName, setCallOutFlashName] = useState<string | null>(null);
  const [isPortraitMobile, setIsPortraitMobile] = useState(false);
  const [isCompactBoard, setIsCompactBoard] = useState(false);
  const [boardScale, setBoardScale] = useState(1);
  const [rematchBusy, setRematchBusy] = useState(false);
  const [lastRoundPoints, setLastRoundPoints] = useState(0);

  const { pointsByPlayerId, addRoundPoints, reset: resetScores } = useMatchScoreTracker();
  const feedCounter = useRef(0);
  const prevLogRef = useRef<string[]>([]);
  const prevWinnerRef = useRef<string | null>(null);
  const completedMatchRef = useRef(false);

  const onlineApi = gameApi as unknown as {
    room?: { hostPlayerId: string } | null;
    playerId?: string | null;
    startOnlineGame?: (rules: Record<string, unknown>) => Promise<boolean>;
  };
  const isOnlineMatch = Boolean(onlineApi.room);
  const isOnlineHost = Boolean(onlineApi.room && onlineApi.playerId === onlineApi.room.hostPlayerId);

  const handleOnlineRematch = useCallback(async () => {
    if (!isOnlineMatch || !isOnlineHost || !onlineApi.startOnlineGame || !game) return;

    setRematchBusy(true);
    try {
      await onlineApi.startOnlineGame(game.rules as unknown as Record<string, unknown>);
    } finally {
      setRematchBusy(false);
    }
  }, [isOnlineMatch, isOnlineHost, onlineApi, game]);

  const handleLocalDealAgain = useCallback(() => {
    if (!game) return;
    gameApi.startGame(
      game.players.map((player) => player.name),
      game.rules,
      game.players.map((player) => player.isBot),
    );
  }, [game, gameApi]);

  // Record round points as they happen.
  useEffect(() => {
    if (game?.winnerId) {
      if (prevWinnerRef.current !== game.winnerId) {
        prevWinnerRef.current = game.winnerId;
        const roundPoints = getRoundPoints(game, game.winnerId);
        setLastRoundPoints(roundPoints);
        addRoundPoints(game.winnerId, roundPoints);
      }
    } else {
      prevWinnerRef.current = null;
      setLastRoundPoints(0);
      if (completedMatchRef.current) {
        resetScores();
        completedMatchRef.current = false;
      }
    }
  }, [game, addRoundPoints, resetScores]);

  const scoreRows = game
    ? game.players
      .map((player) => ({
        playerId: player.id,
        name: player.name,
        points: pointsByPlayerId[player.id] ?? 0,
      }))
      .sort((a, b) => b.points - a.points)
    : [];

  const matchWinner = scoreRows.find((row) => row.points >= MATCH_TARGET_POINTS) ?? null;

  useEffect(() => {
    if (game?.winnerId && matchWinner) {
      completedMatchRef.current = true;
    }
  }, [game?.winnerId, matchWinner]);

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
      setIsPortraitMobile(portrait && mobileLike);
      setIsCompactBoard(shortViewport || narrowViewport);
      setBoardScale(tinyViewport ? 0.82 : shortViewport || narrowViewport ? 0.9 : 1);
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => { window.removeEventListener("resize", update); window.removeEventListener("orientationchange", update); };
  }, []);

  const humanTurn = Boolean(game && localPlayer && isLocalTurn && !localPlayer.isBot && !game.winnerId);
  const drawDisabled = !game || botThinking || !!game.winnerId || (drawnThisTurn && game.pendingDraw === 0) || !humanTurn;

  const unoReady = Boolean(
    game && localPlayer && !localPlayer.isBot && !game.winnerId &&
    localPlayer.hand.length >= 1 && localPlayer.hand.length <= 2 &&
    !localPlayer.saidUno && game.rules.mustDeclareUno,
  );

  const canDeclareUnoNow = humanTurn && unoReady;

  const callOutTarget = !humanTurn && game
    ? game.players.find((p, idx) => idx !== localPlayerIndex && p.hand.length === 1 && !p.saidUno)
    : undefined;
  const callOutTargetIndex = callOutTarget && game
    ? game.players.findIndex((p) => p.id === callOutTarget.id)
    : -1;
  const canCallOutNow = !humanTurn && Boolean(callOutTarget);
  const hasPrimaryActionButton = canDeclareUnoNow || canCallOutNow;

  const declareUno = useCallback(() => {
    if (!unoReady) return;
    sayUno(localPlayerIndex);
    setShowUnoFlash(true);
    window.setTimeout(() => setShowUnoFlash(false), 900);
  }, [unoReady, sayUno, localPlayerIndex]);

  // Wrap callOut to also show the flash
  const handleCallOut = useCallback((callerIdx: number, targetIdx: number, targetName: string) => {
    callOut(callerIdx, targetIdx);
    setCallOutFlashName(targetName);
    window.setTimeout(() => setCallOutFlashName(null), 1100);
  }, [callOut]);

  const triggerCallOut = useCallback(() => {
    if (!callOutTarget || callOutTargetIndex < 0) return;
    handleCallOut(localPlayerIndex, callOutTargetIndex, callOutTarget.name);
  }, [callOutTarget, callOutTargetIndex, handleCallOut, localPlayerIndex]);

  // Keyboard shortcuts: Space = draw, U = UNO / call-out
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Don't fire if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        if (humanTurn && !drawDisabled) drawCard();
      }
      if (e.key === "u" || e.key === "U") {
        e.preventDefault();
        if (canDeclareUnoNow) {
          declareUno();
        } else if (canCallOutNow) {
          triggerCallOut();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [humanTurn, drawDisabled, drawCard, declareUno, canDeclareUnoNow, canCallOutNow, triggerCallOut]);

  if (!game || !localPlayer || !currentPlayer) return null;

  const topDiscard = game.discardPile[game.discardPile.length - 1];
  const winner = game.winnerId ? game.players.find(p => p.id === game.winnerId) : null;
  const sortedHand = sortHand(localPlayer.hand);
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
  const viewportH = typeof window !== "undefined" ? window.innerHeight : 700;
  const cardBudgetPx = viewportH - 120 - 220 - 36 - 20;
  const scaledByHeight = Math.max(0.65, Math.min(1.3, (cardBudgetPx - 40) / 122));
  const handCardScale = boardScale < 1
    ? Math.min(scaledByHeight, 1.0)   // compact viewport: cap at 1.0
    : Math.min(scaledByHeight, 1.3);  // full viewport: allow up to 1.3

  const mustDrawNow = humanTurn && !drawDisabled && playableCardIds.size === 0;

  const hint = !humanTurn
    ? `Waiting for ${currentPlayer.name}`
    : game.pendingDraw > 0
      ? playableCardIds.size > 0 ? "Counter the draw, or accept it" : `No counter — draw +${game.pendingDraw}`
      : drawnThisTurn ? "Play the drawn card, or auto-pass in a moment"
      : playableCardIds.size > 0 ? "Tap a highlighted card to play · Space to draw · U for UNO"
      : "No playable cards — draw to continue · Space to draw";

  const handCount = sortedHand.length;
  const handOverlap = Math.round(26 * handCardScale);
  const ARC_SPREAD = 3.5;
  const ARC_LIFT   = 2.5;

  const confirmExitGame = () => {
    setShowExitConfirm(false);
    resetScores();
    completedMatchRef.current = false;
    resetGame();
    onReset();
  };

  const requestLandscapeMode = async () => {
    try {
      const root = document.documentElement as HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void };
      if (!document.fullscreenElement) {
        if (root.requestFullscreen) await root.requestFullscreen();
        else if (root.webkitRequestFullscreen) root.webkitRequestFullscreen();
      }
      const ori = screen.orientation as ScreenOrientation & {
        lock?: (o: "portrait" | "landscape" | "portrait-primary" | "portrait-secondary" | "landscape-primary" | "landscape-secondary" | "natural" | "any") => Promise<void>;
      };
      if (ori.lock) await ori.lock("landscape");
    } catch { /* silently fail */ }
  };

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

        .playable-card { transition: transform 0.15s cubic-bezier(0.22,1,0.36,1) !important; }
        .playable-card:hover { z-index: 99 !important; }

        .draw-pile-btn { transition: filter 0.2s ease, opacity 0.2s ease, transform 0.15s ease; }
        .draw-pile-btn:hover:not(:disabled) { transform: translateY(-4px); }

        .uno-btn { transition: opacity 0.12s; }
        .uno-btn:hover { opacity: 0.82 !important; }
        .menu-btn { transition: color 0.12s; }
        .menu-btn:hover { color: var(--ui-accent-red) !important; }

        /* Keep the hand scrollbar inside the card zone (top edge), not at the panel bottom. */
        .player-hand-scroll {
          width: 100%;
          overflow-x: auto;
          overflow-y: hidden;
          transform: rotateX(180deg);
          scrollbar-gutter: stable both-edges;
          scrollbar-width: thin;
          scrollbar-color: color-mix(in srgb, var(--ui-muted) 55%, transparent) transparent;
        }
        .player-hand-scroll::-webkit-scrollbar { height: 10px; }
        .player-hand-scroll::-webkit-scrollbar-track { background: transparent; }
        .player-hand-scroll::-webkit-scrollbar-thumb {
          background: color-mix(in srgb, var(--ui-muted) 55%, transparent);
          border-radius: 999px;
        }
        .player-hand-scroll-content {
          transform: rotateX(180deg);
        }
      `}</style>

      <LiveFeed entries={feed} />
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
          padding: isCompactBoard ? "6px 8px" : "10px 12px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          pointerEvents: "none",
        }}>
          <h1 style={{
            margin: isCompactBoard ? 6 : 10, pointerEvents: "auto",
            fontFamily: "'Bebas Neue', cursive",
            fontSize: isCompactBoard ? 30 : 38, letterSpacing: "0.02em", lineHeight: 1,
          }}>
            <span style={{ color: "var(--ui-accent-red)" }}>U</span>
            <span style={{ color: "var(--ui-accent-yellow)" }}>N</span>
            <span style={{ color: "var(--ui-accent-green)" }}>O</span>
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 6, pointerEvents: "auto" }}>
            <button type="button" onClick={onCycleTheme} style={{
              fontFamily: "'Courier Prime', monospace",
              fontSize: isCompactBoard ? 9 : 10, fontWeight: 700,
              letterSpacing: "0.14em", textTransform: "uppercase",
              background: "var(--ui-surface)", border: "1px solid var(--ui-line)",
              color: "var(--ui-muted)", padding: isCompactBoard ? "5px 9px" : "6px 11px",
              cursor: "pointer", transition: "color 0.12s",
            }}>Theme: {currentThemeLabel}</button>
            <button onClick={onOpenSettings} style={{
              fontFamily: "'Courier Prime', monospace",
              fontSize: isCompactBoard ? 9 : 10, fontWeight: 700,
              letterSpacing: "0.14em", textTransform: "uppercase",
              background: "var(--ui-surface)", border: "1px solid var(--ui-line)",
              color: "var(--ui-muted)", padding: isCompactBoard ? "5px 9px" : "6px 11px",
              cursor: "pointer", transition: "color 0.12s",
            }}>SETTINGS</button>
            <button className="menu-btn" onClick={() => setShowExitConfirm(true)} style={{
              fontFamily: "'Courier Prime', monospace",
              fontSize: isCompactBoard ? 9 : 10, fontWeight: 700,
              letterSpacing: "0.14em", textTransform: "uppercase",
              background: "var(--ui-surface)", border: "1px solid var(--ui-line)",
              color: "var(--ui-muted)", padding: isCompactBoard ? "5px 9px" : "6px 11px",
              cursor: "pointer",
            }}>MENU</button>
          </div>
        </div>

        {/* ── Opponents — paddingTop clears floating header ── */}
        <section style={{
          paddingTop: isCompactBoard ? 48 : 58,
          paddingBottom: isCompactBoard ? 4 : 8,
          paddingInline: 12,
          display: "flex", flexWrap: "wrap",
          gap: isCompactBoard ? "4px 14px" : "8px 20px",
          justifyContent: "center", alignItems: "flex-start",
          flexShrink: 0,
        }}>
          {opponents.map(player => {
            const idx = game.players.findIndex(p => p.id === player.id);
            return (
              <OpponentStrip
                key={player.id}
                player={player}
                isCurrentTurn={idx === game.currentPlayerIndex}
                cardScale={handCardScale}
              />
            );
          })}
        </section>

        {/* ── Table ── */}
        <main style={{
          flex: 1, minHeight: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          gap: isCompactBoard ? 6 : 12,
          padding: isCompactBoard ? "0 8px" : "0 16px",
          overflow: "hidden",
        }}>

          <div style={{ minHeight: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {botThinking ? (
              <Thinking name={currentPlayer.name} />
            ) : game.pendingDraw > 0 && humanTurn ? (
              <span style={{
                fontFamily: "'Courier Prime', monospace", fontSize: 11,
                color: "var(--ui-accent-red)", letterSpacing: "0.1em", textTransform: "uppercase",
                border: "1px solid var(--ui-accent-red)", padding: "3px 12px",
                animation: "blink 2s step-end infinite",
              }}>+{game.pendingDraw} incoming</span>
            ) : null}
          </div>

          <div style={{ display: "flex", alignItems: "flex-end", gap: isCompactBoard ? 14 : 32 }}>

            {/* Draw pile */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <span style={{
                fontFamily: "'Courier Prime', monospace", fontSize: 9,
                letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--ui-muted)",
              }}>DRAW PILE</span>
              <button
                className="draw-pile-btn"
                onClick={drawDisabled ? undefined : drawCard}
                disabled={drawDisabled}
                style={{
                  background: "none", border: "none", padding: 0,
                  cursor: drawDisabled ? "default" : "pointer",
                  opacity: drawDisabled ? 0.28 : 1,
                  animation: mustDrawNow ? "mustDrawPulse 1.2s ease-in-out infinite" : "none",
                  filter: !mustDrawNow && game.pendingDraw > 0 && humanTurn
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

            <div style={{
              width: 1, height: isCompactBoard ? 54 : 70,
              background: "var(--ui-line)", alignSelf: "center",
            }} />

            {/* Discard pile */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <span style={{
                fontFamily: "'Courier Prime', monospace", fontSize: 9,
                letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--ui-muted)",
              }}>DISCARD</span>
              {topDiscard && (
                <div style={{ position: "relative", width: 120 * pileCardScale, height: 160 * pileCardScale }}>
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

          {humanTurn && game.pendingDraw > 0 && hasPendingStackOption && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, marginTop: 2 }}>
              <button onClick={drawDisabled ? undefined : drawCard} disabled={drawDisabled} style={{
                fontFamily: "'Bebas Neue', cursive", fontSize: 18, letterSpacing: "0.12em",
                background: "var(--ui-accent-red)", color: "#fff",
                border: "2px solid var(--ui-accent-red)", padding: "8px 24px",
                cursor: drawDisabled ? "default" : "pointer", opacity: drawDisabled ? 0.4 : 1,
              }}>TAKE +{game.pendingDraw}</button>
              <span style={{
                fontFamily: "'Courier Prime', monospace", fontSize: 10,
                letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ui-muted)",
              }}>or play {game.pendingDrawType === "draw2" ? "+2" : "+4"} to stack</span>
            </div>
          )}

        </main>

        {/* ── Player panel ── */}
        <div style={{
          flexShrink: 0,
          borderTop: "1px solid var(--ui-line)",
          position: "relative",
        }}>

          {/* UNO button — only shown on your own turn */}
          {canDeclareUnoNow && (
            <button
              className="uno-btn"
              onClick={declareUno}
              style={{
              position: "absolute",
              right: isCompactBoard ? 34 : 46,
              top: isCompactBoard ? 8 : 10,
              zIndex: 22,
              fontFamily: "'Bebas Neue', cursive",
              fontSize: isCompactBoard ? 15 : 18, letterSpacing: "0.1em",
              background: "var(--ui-accent-red)", color: "#fff",
              border: "2px solid var(--ui-accent-red)",
              padding: isCompactBoard ? "5px 11px" : "7px 15px",
              cursor: "pointer", opacity: 1,
              animation: "blink 1.4s ease-in-out infinite",
            }}
            >UNO! (U)</button>
          )}

          {/* Call-out button — only shown while waiting on opponents */}
          {canCallOutNow && (
            <button
              className="uno-btn"
              onClick={triggerCallOut}
              style={{
              position: "absolute",
              right: isCompactBoard ? 34 : 46,
              top: isCompactBoard ? 8 : 10,
              zIndex: 22,
              fontFamily: "'Bebas Neue', cursive",
              fontSize: isCompactBoard ? 15 : 18, letterSpacing: "0.1em",
              background: "var(--ui-accent-red)", color: "#fff",
              border: "2px solid var(--ui-accent-red)",
              padding: isCompactBoard ? "5px 11px" : "7px 15px",
              cursor: "pointer", opacity: 1,
              animation: "blink 1.4s ease-in-out infinite",
            }}
            >CALL OUT! (U)</button>
          )}

          {/* Card fan — scrollable, full height */}
          <div className="player-hand-scroll">
            <div className="player-hand-scroll-content" style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
              minWidth: "max-content",
              paddingLeft:  isCompactBoard ? 16 : 24,
              paddingRight: hasPrimaryActionButton ? (isCompactBoard ? 112 : 136) : (isCompactBoard ? 16 : 24),
              paddingTop:   isCompactBoard ? 12 : 16,
              paddingBottom: 0,
              height: isCompactBoard
                ? `${Math.round(122 * handCardScale) + 28}px`
                : `${Math.round(122 * handCardScale) + 36}px`,
            }}>
              {sortedHand.map((card, i) => {
                const playable = humanTurn && !botThinking && playableCardIds.has(card.id);
                const isSelected = pendingWild?.id === card.id;
                const mid = (handCount - 1) / 2;
                const offset = i - mid;
                const rotateDeg = offset * ARC_SPREAD;
                const liftPx = Math.abs(offset) * ARC_LIFT;
                const baseTransform = `rotate(${rotateDeg}deg) translateY(${isSelected ? liftPx - 14 : liftPx}px)`;

                return (
                  <div
                    key={card.id}
                    className={playable ? "playable-card" : ""}
                    style={{
                      marginLeft: i === 0 ? 0 : -handOverlap,
                      zIndex: playable ? i + 1 : i,
                      position: "relative",
                      transform: baseTransform,
                      transformOrigin: "bottom center",
                      transition: "transform 0.15s cubic-bezier(0.22,1,0.36,1)",
                      cursor: playable ? "pointer" : "default",
                      outline: isSelected ? "2px solid var(--ui-text)" : "none",
                      outlineOffset: 3,
                      filter: playable ? "drop-shadow(0 2px 4px rgba(26,15,0,0.14))" : "none",
                    }}
                    onClick={playable ? () => selectCard(card) : undefined}
                    onMouseEnter={e => {
                      if (!playable) return;
                      (e.currentTarget as HTMLDivElement).style.transform =
                        `rotate(${rotateDeg}deg) translateY(${liftPx - 20}px)`;
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLDivElement).style.transform = baseTransform;
                    }}
                  >
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
            padding: isCompactBoard ? "6px 14px 8px" : "8px 18px 12px",
            borderTop: "1px solid var(--ui-line)",
            flexWrap: "wrap",
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
              fontSize: isCompactBoard ? 9 : 10,
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
                padding: "2px 6px", animation: "blink 0.9s step-end infinite",
                flexShrink: 0,
              }}>UNO</span>
            )}

            {/* Match points */}
            {(pointsByPlayerId[localPlayer.id] ?? 0) > 0 && (
              <span style={{
                fontFamily: "'Courier Prime', monospace", fontSize: 9,
                color: "var(--ui-muted)", letterSpacing: "0.06em", flexShrink: 0,
              }}>{pointsByPlayerId[localPlayer.id]} pts</span>
            )}

            {/* Separator dot */}
            <span style={{ color: "var(--ui-line)", flexShrink: 0 }}>·</span>

            {/* Hint — takes remaining space, truncates if needed */}
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
            }}>{hint}</span>
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
            display: "grid", gap: 14, animation: "modalIn 0.16s ease",
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

      {isPortraitMobile && !winner && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 85, background: "var(--ui-bg)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 20, textAlign: "center",
        }}>
          <div style={{ display: "grid", gap: 12, maxWidth: 420 }}>
            <p style={{ margin: 0, fontFamily: "'Bebas Neue', cursive", fontSize: 38, letterSpacing: "0.05em", color: "var(--ui-text)" }}>
              Rotate To Landscape
            </p>
            <p style={{ margin: 0, fontFamily: "'Courier Prime', monospace", fontSize: 12, letterSpacing: "0.04em", color: "var(--ui-muted)", lineHeight: 1.6 }}>
              This board is optimized for wide layout. Rotate your phone sideways for the best play experience.
            </p>
            <button onClick={requestLandscapeMode} style={{
              border: "none", background: "var(--ui-text)", color: "var(--ui-bg)",
              padding: "12px 16px", cursor: "pointer",
              fontSize: 18, letterSpacing: "0.1em", textTransform: "uppercase",
              fontFamily: "'Bebas Neue', cursive",
            }}>Rotate / Fullscreen</button>
          </div>
        </div>
      )}

      {pendingWild && <ColorPicker onSelect={confirmWildColor} onCancel={cancelWild} />}

      {showUnoFlash && (
        <div style={{ position: "fixed", inset: 0, zIndex: 86, pointerEvents: "none" }}>
          <div style={{
            position: "absolute", left: "50%", top: "50%",
            transform: "translate(-50%, -50%)",
            fontFamily: "'Bebas Neue', cursive",
            fontSize: "clamp(64px, 18vw, 180px)", lineHeight: 0.9,
            color: "var(--ui-text)",
            textShadow: "0 1px 0 color-mix(in srgb, var(--ui-bg) 70%, black), 0 10px 26px rgba(0,0,0,0.42), 0 0 28px color-mix(in srgb, var(--ui-accent-red) 70%, transparent)",
            animation: "unoFlashPop 0.9s cubic-bezier(0.22,1,0.36,1) forwards",
          }}>UNO!</div>
        </div>
      )}

      {winner && (
        <WinnerScreen
          winner={winner}
          roundPoints={lastRoundPoints}
          winnerTotalPoints={pointsByPlayerId[winner.id] ?? 0}
          matchWinnerName={matchWinner?.name ?? null}
          scoreRows={scoreRows}
          onExit={() => {
            resetScores();
            completedMatchRef.current = false;
            resetGame();
            onReset();
          }}
          onDealAgain={() => {
            if (isOnlineMatch) {
              void handleOnlineRematch();
              return;
            }
            handleLocalDealAgain();
          }}
          dealAgainDisabled={isOnlineMatch && (!isOnlineHost || rematchBusy)}
          dealAgainLabel={
            isOnlineMatch
              ? isOnlineHost
                ? (rematchBusy ? "Starting..." : matchWinner ? "New Match" : "Play Again")
                : "Waiting Host"
              : matchWinner ? "New Match" : "Deal again"
          }
          onlineActions={isOnlineMatch ? {
            enabled: true,
            isHost: isOnlineHost,
            busy: rematchBusy,
            onPlayAgain: () => { void handleOnlineRematch(); },
          } : undefined}
        />
      )}
    </>
  );
}