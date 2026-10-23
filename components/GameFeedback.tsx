// Brief action signals complement the cards without blocking the next move.
"use client";
import { Ban, Repeat2, Shuffle } from "lucide-react";
import type { GameState } from "../types/game";
export default function GameFeedback({ game }: { game: GameState }) {
  const action = game.lastAction;
  const value =
    action.type === "play"
      ? action.card.value
      : action.type === "declareUno"
        ? "uno"
        : action.type === "callOut"
          ? "caught"
          : null;
  const visual =
    value === "reverse" ? (
      <Repeat2 />
    ) : value === "skip" ? (
      <Ban />
    ) : value === "shuffle" ? (
      <Shuffle />
    ) : value === "draw2" ? (
      "+2"
    ) : value === "wild4" ? (
      "+4"
    ) : value === "uno" ? (
      "UNO!"
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
