// Brief action signals complement the cards without blocking the next move.
"use client";
import { Ban, ChevronsLeftRight, Shuffle } from "lucide-react";
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
      <ChevronsLeftRight />
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
      "+2"
    ) : value === "discardAll" ? (
      "ALL!"
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
  return (
    <div className="victory-burst" aria-hidden="true">
      {Array.from({ length: 18 }, (_, i) => (
        <i
          key={i}
          style={
            {
              "--piece": i,
              "--piece-x": `${((i * 67) % 340) - 170}px`,
              "--piece-y": `${-80 - ((i * 37) % 190)}px`,
              "--piece-rotation": `${i * 67}deg`,
              background: [
                "#e2694d",
                "#7da7df",
                "#dfbd49",
                "#9ebf83",
                "#b29bd8",
              ][i % 5],
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
