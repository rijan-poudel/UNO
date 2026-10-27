// Physical card face shared by the hand, table, and motion layer.
"use client";

import type { CSSProperties } from "react";
import {
  Ban,
  Repeat2,
  Layers,
  Shuffle,
  FastForward,
  ArrowLeftRight,
  Crosshair,
  Disc,
} from "lucide-react";
import { getCardLabel } from "../types/card";
import type { Card } from "../types/card";
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
  wildSkip2: "×2",
  wildTargetDraw2: "+2",
  wild: "",
  shuffle: "",
  discardAll: "",
};

function CardSymbol({ value }: { value: string }) {
  if (value === "skip") return <Ban aria-hidden="true" />;
  if (value === "skipEveryone") return <FastForward aria-hidden="true" />;
  if (value === "wildSkip2")
    return (
      <span className="card-skip-two">
        <Ban aria-hidden="true" />
        <small>2</small>
      </span>
    );
  if (value === "reverse") return <Repeat2 aria-hidden="true" />;
  if (value === "wildReverseDraw4")
    return (
      <span className="card-reverse-draw4">
        <Repeat2 aria-hidden="true" />
        <small>+4</small>
      </span>
    );
  if (value === "wildTargetDraw2")
    return (
      <span className="card-target-draw2">
        <Crosshair aria-hidden="true" />
        <small>+2</small>
      </span>
    );
  if (value === "wildForcedSwap") return <ArrowLeftRight aria-hidden="true" />;
  if (value === "wildColorRoulette") return <Disc aria-hidden="true" />;
  if (value === "shuffle") return <Shuffle aria-hidden="true" />;
  if (value === "discardAll") return <Layers aria-hidden="true" />;
  if (value === "wild")
    return (
      <span className="wild-symbol">
        <i />
        <i />
        <i />
        <i />
      </span>
    );
  return <>{SYMBOLS[value] ?? value}</>;
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
        <CardSymbol value={card.value} />
      </span>
      <span className="card-orbit" aria-hidden="true" />
      <span
        className={`card-value ${card.value.length > 1 ? "card-action-value" : ""}`}
      >
        {card.value === "wild4" ? (
          <span className={styles.drawFour} aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </span>
        ) : (
          <CardSymbol value={card.value} />
        )}
      </span>
      <span className="card-index bottom">
        <CardSymbol value={card.value} />
      </span>
    </>
  );
  const className = `uno-card ${styles.face} ${faceDown ? "card-back" : `card-${card.color}`} ${isPlayable ? "playable" : ""} ${isSelected ? "selected" : ""}`;
  return onClick ? (
    <button
      type="button"
      className={className}
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
    <div className={className} style={style} role="img" aria-label={label}>
      {content}
      <span className={styles.finish} aria-hidden="true" />
    </div>
  );
}
