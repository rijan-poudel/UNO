// A compact cue ties the real actor, legal decision and authoritative clock together.
"use client";
import { useEffect, useState } from "react";
import type { GameState } from "../types/game";
import { HUMAN_TURN_MS, hasForcedPenalty } from "../lib/turnFlow";
import { getStackResponseLabel } from "../lib/gameRules";
import GameFeedback from "./GameFeedback";
const VALUE_LABELS: Record<string, string> = {
  draw2: "+2",
  draw4: "+4",
  wild4: "+4",
  wildReverseDraw4: "Reverse +4",
  wildDraw6: "+6",
  wildDraw10: "+10",
  wildColorRoulette: "Roulette",
  skip: "Skip",
  skipEveryone: "Skip everyone",
  wildSkip2: "Skip two",
  reverse: "Reverse",
  discardAll: "Discard all",
};
export default function TurnCue({
  game,
  local,
  choosing,
  playableCount,
  connected = true,
  targetAction,
}: {
  game: GameState;
  local: boolean;
  choosing: boolean;
  playableCount: number;
  connected?: boolean;
  targetAction?: string;
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
  const stack =
    local && !choosing && connected && game.pendingDraw > 0 && !forced
      ? getStackResponseLabel(game)
      : null;
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
            : `Stack ${stack ?? "a matching draw card"}, or draw ${game.pendingDraw} cards total`
          : game.drawnThisTurn
            ? playableCount > 0
              ? game.rules.gameMode === "no_mercy"
                ? "Play your drawn card (cannot pass)"
                : "Play a lifted card or pass"
              : "No match · Passing automatically"
            : playableCount === 0
              ? "No match · Tap the deck to draw"
              : game.rules.gameMode === "all_wild"
                ? "Play any one card"
                : `Match ${game.activeColor}${top?.color !== "wild" && value ? ` or ${value}` : ""}`;
  const shortHint = !connected
    ? "Reconnecting…"
    : choosing
      ? "Choose a color"
      : forced && local
        ? "Taking the penalty"
        : local && game.drawnThisTurn
          ? playableCount === 0
            ? "Passing…"
            : game.rules.gameMode === "no_mercy"
              ? "Play your drawn card"
              : "Play or pass"
          : local && playableCount === 0
            ? "Tap the deck to draw"
            : "Play a card";
  return (
    <div
      className={`turn-cue ${local && connected ? "turn-cue-local" : ""} ${local && connected && seconds !== null && seconds <= 5 ? "turn-urgent" : ""}`}
    >
      <div
        key={`${game.currentPlayerIndex}:${game.turnCount}`}
        className="turn-message"
      >
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
          <strong title={hint} role="status" aria-atomic="true">
            {!connected
              ? "Reconnecting…"
              : (targetAction ??
                (stack
                  ? `Stack ${stack}`
                  : local
                    ? "Your turn"
                    : `${player.name}’s turn`))}
          </strong>
          <small className={local || !connected ? undefined : "sr-only"}>
            {targetAction
              ? "Choose a player"
              : stack
                ? `or draw ${game.pendingDraw} total`
                : local || !connected
                  ? shortHint
                  : hint}
          </small>
        </span>
      </div>
      <GameFeedback game={game} />
    </div>
  );
}
