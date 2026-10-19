// Physical card face shared by the hand, table, and motion layer.
"use client";

import type { CSSProperties } from "react";
import { Ban, Repeat2, Layers, Shuffle } from "lucide-react";
import type { Card } from "../types/card";

interface UnoCardProps {
  card: Card;
  isPlayable?: boolean;
  isSelected?: boolean;
  faceDown?: boolean;
  sizeMultiplier?: number;
  onClick?: () => void;
  ariaLabel?: string;
}
const LABELS: Record<string, string> = {
  skip: "Skip",
  reverse: "Reverse",
  draw2: "Draw two",
  wild: "Wild",
  wild4: "Wild draw four",
  shuffle: "Shuffle hands",
  discardAll: "Discard all",
};
const SYMBOLS: Record<string, string> = {
  draw2: "+2",
  wild4: "+4",
  wild: "",
  shuffle: "",
  discardAll: "",
};

function CardSymbol({ value }: { value: string }) {
  if (value === "skip") return <Ban aria-hidden="true" />;
  if (value === "reverse") return <Repeat2 aria-hidden="true" />;
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
  faceDown = false,
  sizeMultiplier = 1,
  onClick,
  ariaLabel,
}: UnoCardProps) {
  const label = faceDown
    ? "Face-down card"
    : `${card.color === "wild" ? "" : `${card.color} `}${LABELS[card.value] ?? card.value}`;
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
        {card.value === "wild4" && (
          <span className="four-color-mark" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </span>
        )}
        <CardSymbol value={card.value} />
      </span>
      <span className="card-index bottom">
        <CardSymbol value={card.value} />
      </span>
    </>
  );
  const className = `uno-card ${faceDown ? "card-back" : `card-${card.color}`} ${isPlayable ? "playable" : ""} ${isSelected ? "selected" : ""}`;
  return onClick ? (
    <button
      type="button"
      className={className}
      style={style}
      onClick={onClick}
      aria-label={ariaLabel ?? `Play ${label}`}
      aria-pressed={isSelected}
    >
      {content}
    </button>
  ) : (
    <div className={className} style={style} role="img" aria-label={label}>
      {content}
    </div>
  );
}
