// Brief action signals complement the cards without blocking the next move.
"use client";
import { RotateCw } from "lucide-react";
import { UnoActionSymbol } from "./icons/UnoActionSymbol";
import { RouletteWheelIcon, NoMercyIcon } from "./icons/NoMercyIcons";
import type { GameState } from "../types/game";
export default function GameFeedback({ game }: { game: GameState }) {
  const action = game.lastAction;
  const value =
    action.type === "play"
      ? action.declaredUno
        ? "uno"
        : game.rules.sevenZero && action.card.value === "7"
          ? "swap"
          : game.rules.sevenZero && action.card.value === "0"
            ? "passAll"
            : action.card.value
      : action.type === "declareUno"
        ? "uno"
        : action.type === "callOut"
          ? "caught"
          : action.type === "draw" && action.count > 1
            ? "penalty"
            : action.type === "mercyElimination"
              ? "mercyElimination"
              : null;
  const visual =
    value === "reverse" ? (
      <UnoActionSymbol value="reverse" />
    ) : value === "skip" ? (
      <UnoActionSymbol value="skip" />
    ) : value === "skipEveryone" ? (
      <UnoActionSymbol value="skipEveryone" />
    ) : value === "wildSkip2" ? (
      <UnoActionSymbol value="wildSkip2" />
    ) : value === "wildReverseDraw4" ? (
      <span className="feedback-reverse-draw4">
        <UnoActionSymbol value="wildReverseDraw4" />
        <small>+4</small>
      </span>
    ) : value === "wildTargetDraw2" ? (
      <UnoActionSymbol value="wildTargetDraw2" />
    ) : value === "wildForcedSwap" || value === "swap" ? (
      <span className="feedback-swap">
        <UnoActionSymbol value="wildForcedSwap" />
        <small>SWAP</small>
      </span>
    ) : value === "passAll" ? (
      <span className="feedback-pass-all">
        <RotateCw />
        <small>PASS ALL</small>
      </span>
    ) : value === "wildColorRoulette" ? (
      <RouletteWheelIcon size={52} />
    ) : value === "shuffle" ? (
      <UnoActionSymbol value="shuffle" />
    ) : value === "draw2" ? (
      `+${game.pendingDraw || 2}`
    ) : value === "draw4" ? (
      `+${game.pendingDraw || 4}`
    ) : value === "wildDraw6" ? (
      `+${game.pendingDraw || 6}`
    ) : value === "wildDraw10" ? (
      `+${game.pendingDraw || 10}`
    ) : value === "wild4" ? (
      `+${game.pendingDraw || 4}`
    ) : value === "mercyElimination" ? (
      <span className="feedback-mercy-elimination">
        <NoMercyIcon size={44} />
        <small>KNOCKOUT</small>
      </span>
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
      {(game.pendingDraw > 0 ||
        value === "penalty" ||
        action.type === "mercyElimination") && (
        <small>
          {action.type === "mercyElimination"
            ? `${game.players.find((player) => player.id === action.playerId)?.name ?? "Player"} knocked out`
            : value === "penalty" && action.type === "draw"
              ? `${game.players.find((player) => player.id === action.playerId)?.name} takes the cards`
              : `${game.players[game.currentPlayerIndex].name} is up next`}
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
