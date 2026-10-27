// Brief action signals complement the cards without blocking the next move.
"use client";
import {
  Ban,
  Repeat2,
  Shuffle,
  FastForward,
  Crosshair,
  ArrowLeftRight,
  Disc,
} from "lucide-react";
import type { GameState } from "../types/game";
export default function GameFeedback({ game }: { game: GameState }) {
  const action = game.lastAction;
  const value =
    action.type === "play"
      ? action.declaredUno
        ? "uno"
        : action.card.value
      : action.type === "declareUno"
        ? "uno"
        : action.type === "callOut"
          ? "caught"
          : action.type === "draw" && action.count > 1
            ? "penalty"
            : null;
  const visual =
    value === "reverse" ? (
      <Repeat2 />
    ) : value === "skip" ? (
      <Ban />
    ) : value === "skipEveryone" ? (
      <FastForward />
    ) : value === "wildSkip2" ? (
      <span className="feedback-skip-two">
        <Ban />
        <small>×2</small>
      </span>
    ) : value === "wildReverseDraw4" ? (
      <span className="feedback-reverse-draw4">
        <Repeat2 />
        <small>+4</small>
      </span>
    ) : value === "wildTargetDraw2" ? (
      <span className="feedback-target-draw2">
        <Crosshair />
        <small>+2</small>
      </span>
    ) : value === "wildForcedSwap" ? (
      <ArrowLeftRight />
    ) : value === "wildColorRoulette" ? (
      <Disc />
    ) : value === "shuffle" ? (
      <Shuffle />
    ) : value === "draw2" ? (
      `+${game.pendingDraw || 2}`
    ) : value === "wildDraw6" ? (
      `+${game.pendingDraw || 6}`
    ) : value === "wildDraw10" ? (
      `+${game.pendingDraw || 10}`
    ) : value === "wild4" ? (
      `+${game.pendingDraw || 4}`
    ) : value === "uno" ? (
      "UNO!"
    ) : value === "penalty" && action.type === "draw" ? (
      `+${action.count}`
    ) : value === "caught" ? (
      action.type === "callOut" ? (
        `+${action.penalty}`
      ) : null
    ) : value === "discardAll" ? (
      action.type === "play" ? (
        `−${1 + (action.discardAllCount ?? 0)}`
      ) : (
        "ALL!"
      )
    ) : value === "wild" ? (
      <span className="wild-burst">
        <i />
        <i />
        <i />
        <i />
      </span>
    ) : null;
  if (!visual) return null;
  return (
    <div
      key={`${game.turnCount}:${JSON.stringify(action)}`}
      className={`game-feedback feedback-${value}`}
      aria-hidden="true"
    >
      <span>{visual}</span>
      {(game.pendingDraw > 0 || value === "penalty") && (
        <small>
          {value === "penalty" && action.type === "draw"
            ? game.players.find((player) => player.id === action.playerId)?.name
            : game.players[game.currentPlayerIndex].name}
          {value === "penalty" ? " takes the cards" : " is up next"}
        </small>
      )}
    </div>
  );
}
export function VictoryBurst() {
  // More pieces, wider spread, rounder confetti shapes for more Duolingo energy
  const pieces = 28;
  return (
    <div className="victory-burst" aria-hidden="true">
      {Array.from({ length: pieces }, (_, i) => {
        const angle = (i / pieces) * 360;
        const dist = 90 + ((i * 53) % 130);
        const rad = (angle * Math.PI) / 180;
        const x = Math.round(Math.cos(rad) * dist);
        const y = Math.round(
          -Math.abs(Math.sin(rad) * dist) - 40 - ((i * 23) % 80),
        );
        const isCircle = i % 3 === 0;
        return (
          <i
            key={i}
            style={
              {
                "--piece": i,
                "--piece-x": `${x}px`,
                "--piece-y": `${y}px`,
                "--piece-rotation": `${i * 73}deg`,
                background: [
                  "#e2694d",
                  "#7da7df",
                  "#dfbd49",
                  "#9ebf83",
                  "#b29bd8",
                  "#f7c934",
                  "#e73442",
                ][i % 7],
                borderRadius: isCircle ? "50%" : "3px",
                width: isCircle ? "10px" : `${6 + (i % 3) * 3}px`,
                height: isCircle ? "10px" : `${14 + (i % 4) * 4}px`,
              } as React.CSSProperties
            }
          />
        );
      })}
    </div>
  );
}
