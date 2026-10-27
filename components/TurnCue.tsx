// A compact cue ties the real actor, legal decision and authoritative clock together.
"use client";
import { useEffect, useState } from "react";
import type { GameState } from "../types/game";
import { HUMAN_TURN_MS, hasForcedPenalty } from "../lib/turnFlow";
const VALUE_LABELS: Record<string, string> = {
  draw2: "+2",
  wild4: "+4",
  skip: "Skip",
  reverse: "Reverse",
  discardAll: "Discard all",
};
export default function TurnCue({
  game,
  local,
  choosing,
  playableCount,
  connected = true,
}: {
  game: GameState;
  local: boolean;
  choosing: boolean;
  playableCount: number;
  connected?: boolean;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(timer);
  }, []);
  if (game.winnerId) return null;
  const player = game.players[game.currentPlayerIndex];
  const seconds = game.turnDeadlineAt
    ? Math.max(0, Math.min(30, Math.ceil((game.turnDeadlineAt - now) / 1000)))
    : null;
  const remaining = game.turnDeadlineAt
    ? Math.max(0, Math.min(1, (game.turnDeadlineAt - now) / HUMAN_TURN_MS))
    : 1;
  const top = game.discardPile.at(-1);
  const forced = hasForcedPenalty(game);
  const value = top ? (VALUE_LABELS[top.value] ?? top.value) : null;
  const hint = !connected
    ? "Reconnecting to the table"
    : choosing
      ? "Choose your next color"
      : !local
        ? "Get your next card ready"
        : game.pendingDraw
          ? forced
            ? `Taking +${game.pendingDraw} automatically`
            : `Stack a draw card or take +${game.pendingDraw}`
          : game.drawnThisTurn
            ? playableCount > 0
              ? "Play a lifted card or pass"
              : "No match · Passing automatically"
            : playableCount === 0
              ? "No match · Tap the deck to draw"
              : game.rules.gameMode === "all_wild"
                ? "Play any one card"
                : `Match ${game.activeColor}${top?.color !== "wild" && value ? ` or ${value}` : ""}`;
  return (
    <div
      className={`turn-cue ${local ? "turn-cue-local" : ""} ${seconds !== null && seconds <= 5 ? "turn-urgent" : ""}`}
    >
      <div className="turn-message">
        {seconds !== null && connected ? (
          <span
            className="turn-countdown"
            role="timer"
            aria-label={`${seconds} seconds remaining`}
          >
            <svg viewBox="0 0 44 44" aria-hidden="true">
              <circle cx="22" cy="22" r="19" />
              <circle
                cx="22"
                cy="22"
                r="19"
                pathLength="1"
                strokeDasharray="1"
                strokeDashoffset={1 - remaining}
              />
            </svg>
            <b aria-hidden="true">{seconds}</b>
          </span>
        ) : (
          <span className="thinking-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        )}
        <span>
          <strong title={local ? "Your turn" : `${player.name}’s turn`}>
            {local ? "Your turn" : `${player.name}’s turn`}
          </strong>
          <small className="sr-only">{hint}</small>
        </span>
      </div>
    </div>
  );
}
