// Physical card face shared by the hand, table, and motion layer.
"use client";

import type { CSSProperties } from "react";
import { UnoActionSymbol } from "./icons/UnoActionSymbol";
import { getCardLabel } from "../types/card";
import type { Card, CardValue } from "../types/card";
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
const SYMBOLS: Record<string, string> = {
  draw2: "+2",
  draw4: "+4",
  wild4: "+4",
  wildDraw6: "+6",
  wildDraw10: "+10",
  wildColorRoulette: "?",
  wild: "",
  shuffle: "",
  discardAll: "",
};

function CardSymbol({
  value,
  corner = false,
}: {
  value: CardValue;
  corner?: boolean;
}) {
  if (corner && value === "wildReverseDraw4") {
    return (
      <span className={styles.cornerRev4} aria-hidden="true">
        <UnoActionSymbol value="reverse" isCorner />
        <span>+4</span>
      </span>
    );
  }
  if (corner && SYMBOLS[value]) return <>{SYMBOLS[value]}</>;
  if (value === "wild")
    return (
      <span className="wild-symbol">
        <i />
        <i />
        <i />
        <i />
      </span>
    );
  if (/^[0-9]$/.test(value)) return <>{value}</>;
  return <UnoActionSymbol value={value} isCorner={corner} />;
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
  const wildAction =
    card.color === "wild" &&
    [
      "skip",
      "reverse",
      "draw2",
      "wildSkip2",
      "wildTargetDraw2",
      "wildForcedSwap",
    ].includes(card.value);
  const style = { "--card-scale": sizeMultiplier } as CSSProperties;
  const content = faceDown ? (
    <>
      <span className="card-back-stripes" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </span>
      <div className="card-back-mark" aria-hidden="true">
        uno<span>.</span>
      </div>
    </>
  ) : (
    <>
      <span className="card-index top">
        <CardSymbol value={card.value} corner />
      </span>
      <span className="card-orbit" aria-hidden="true" />
      <span
        className={`card-value ${card.value.length > 1 ? "card-action-value" : ""}`}
      >
        <CardSymbol value={card.value} />
      </span>
      <span className="card-index bottom">
        <CardSymbol value={card.value} corner />
      </span>
    </>
  );
  const className = `uno-card ${styles.face} ${faceDown ? "card-back" : `card-${card.color}`} ${isPlayable ? "playable" : ""} ${isSelected ? "selected" : ""}`;
  return onClick ? (
    <button
      type="button"
      className={className}
      data-wild-action={wildAction || undefined}
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
      <span className={styles.finish} aria-hidden="true" />
    </button>
  ) : (
    <div
      className={className}
      data-wild-action={wildAction || undefined}
      style={style}
      role="img"
      aria-label={label}
    >
      {content}
      <span className={styles.finish} aria-hidden="true" />
    </div>
  );
}
