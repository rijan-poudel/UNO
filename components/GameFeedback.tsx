// A persistent action receipt lets players follow play without a covering flash.
"use client";
import { describeGameAction } from "../lib/gameActivity";
import type { GameState } from "../types/game";

export default function GameFeedback({ game }: { game: GameState }) {
  if (game.lastAction.type === "init") return null;
  const description = describeGameAction(game);
  return (
    <div className="game-feedback" aria-hidden="true" title={description}>
      <span>{description}</span>
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
