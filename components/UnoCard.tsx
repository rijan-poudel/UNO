// Physical card face shared by the hand, table, and motion layer.
"use client";

import type { CSSProperties } from "react";
import { DRAW_AMOUNTS, UnoActionSymbol } from "./icons/UnoActionSymbol";
import { getCardLabel } from "../types/card";
import type { Card, CardColor, CardValue } from "../types/card";
import styles from "./UnoCard.module.css";

interface UnoCardProps {
  card: Card;
  isPlayable?: boolean;
  isSelected?: boolean;
  disabled?: boolean;
  faceDown?: boolean;
  sizeMultiplier?: number;
  onClick?: () => void;
  ariaLabel?: string;
  tabIndex?: number;
  cornerHint?: string;
}
function CardSymbol({
  value,
  color,
  corner = false,
}: {
  value: CardValue;
  color: CardColor;
  corner?: boolean;
}) {
  const amount = DRAW_AMOUNTS[value];
  if (corner && amount)
    return (
      <span className={styles.penaltyIndex}>
        {value === "wildReverseDraw4" && (
          <UnoActionSymbol value="reverse" isCorner />
        )}
        {value === "wildTargetDraw2" && (
          <UnoActionSymbol value={value} isCorner />
        )}
        <span>+{amount}</span>
      </span>
    );
  if (/^[0-9]$/.test(value))
    return (
      <span
        className={
          value === "6" || value === "9" ? styles.underlined : undefined
        }
      >
        {value}
      </span>
    );
  return <UnoActionSymbol value={value} color={color} isCorner={corner} />;
}

export default function UnoCard({
  card,
  isPlayable = false,
  isSelected = false,
  disabled = false,
  faceDown = false,
  sizeMultiplier = 1,
  onClick,
  ariaLabel,
  tabIndex,
  cornerHint,
}: UnoCardProps) {
  const label = faceDown ? "Face-down card" : getCardLabel(card);
  const style = { "--card-scale": sizeMultiplier } as CSSProperties;
  const content = faceDown ? (
    <span className={styles.backFrame} aria-hidden="true">
      <span className={styles.backMark}>
        uno<span>.</span>
      </span>
    </span>
  ) : (
    <>
      <span className="card-index top" aria-hidden="true">
        <CardSymbol value={card.value} color={card.color} corner />
      </span>
      <span className="card-value" aria-hidden="true">
        <CardSymbol value={card.value} color={card.color} />
      </span>
      <span className="card-index bottom" aria-hidden="true">
        <CardSymbol value={card.value} color={card.color} corner />
      </span>
    </>
  );
  const className = `uno-card ${styles.face} ${faceDown ? "card-back" : `card-${card.color}`} ${isPlayable ? "playable" : ""} ${isSelected ? "selected" : ""}`;
  return onClick ? (
    <button
      type="button"
      className={className}
      data-face={
        faceDown ? "back" : /^[0-9]$/.test(card.value) ? "number" : "action"
      }
      style={style}
      onClick={() => {
        if (!disabled) onClick();
      }}
      aria-disabled={disabled || undefined}
      aria-label={ariaLabel ?? `Play ${label}`}
      tabIndex={tabIndex}
    >
      {content}
      {cornerHint && (
        <span className={styles.playHint} data-card-hint aria-hidden="true">
          {cornerHint}
        </span>
      )}
    </button>
  ) : (
    <div
      className={className}
      data-face={
        faceDown ? "back" : /^[0-9]$/.test(card.value) ? "number" : "action"
      }
      style={style}
      role="img"
      aria-label={label}
    >
      {content}
    </div>
  );
}
