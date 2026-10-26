// A player token joins the character, name and real remaining-card count.
"use client";
import type { CSSProperties } from "react";
import type { Player } from "../types/game";
import type { PlayerExpression } from "../lib/playerExpression";
import PlayerAvatar from "./PlayerAvatar";
import UnoCard from "./UnoCard";
import styles from "./OpponentSeat.module.css";

export default function OpponentSeat({
  player,
  active,
  expression,
  position,
  offline,
  canCatch,
  onCatch,
}: {
  player: Player;
  active: boolean;
  expression: PlayerExpression;
  position: string;
  offline: boolean;
  canCatch: boolean;
  onCatch: () => void;
}) {
  const SeatLabel = canCatch ? "button" : "div";
  const count = player.hand.length;
  const status = canCatch
    ? "Catch!"
    : offline
      ? "Offline"
      : player.saidUno && count === 1
        ? "UNO!"
        : null;
  return (
    <div
      className={`${styles.seat} opponent ${position} ${active ? "active-seat" : ""} ${count === 1 ? "last-card-seat" : ""}`}
      data-seat={player.id}
    >
      <div className="opponent-hand" aria-hidden="true">
        {Array.from({ length: Math.min(5, count) }, (_, i) => (
          <span
            key={i}
            style={
              {
                "--back-i": i,
                "--back-count": Math.min(5, count),
              } as CSSProperties
            }
          >
            <UnoCard
              card={{ id: "back", color: "wild", value: "wild" }}
              faceDown
              sizeMultiplier={0.55}
            />
          </span>
        ))}
      </div>
      <SeatLabel
        className={`${styles.label} opponent-label ${canCatch ? "catch-seat" : ""}`}
        type={canCatch ? "button" : undefined}
        onClick={canCatch ? onCatch : undefined}
        aria-label={canCatch ? `Catch ${player.name}’s missed UNO` : undefined}
      >
        <PlayerAvatar
          seed={player.id}
          avatarId={player.avatarId}
          isBot={player.isBot}
          expression={offline ? "neutral" : expression}
        />
        <span className={styles.name}>
          <strong title={player.name}>{player.name}</strong>
          <span className={styles.details}>
            <span
              className={styles.count}
              role="img"
              aria-label={`${count} ${count === 1 ? "card" : "cards"}`}
              data-count={count}
            >
              <span aria-hidden="true">
                {count}
                <span className={styles.countUnit}>
                  {count === 1 ? " card" : " cards"}
                </span>
              </span>
            </span>
            {status && (
              <small aria-label={offline ? "Reconnecting" : undefined}>
                {status}
              </small>
            )}
          </span>
        </span>
        {active && <span className="sr-only">Current turn</span>}
      </SeatLabel>
    </div>
  );
}
