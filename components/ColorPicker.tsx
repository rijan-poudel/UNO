"use client";
import type { CardColor } from "../types/card";
import Modal from "./Modal";
export default function ColorPicker({
  onSelect,
  onCancel,
  playerName,
}: {
  onSelect: (color: CardColor) => void;
  onCancel?: () => void;
  playerName?: string;
}) {
  return (
    <Modal
      title="Your wild. Your color."
      onClose={onCancel}
      className="color-picker-modal"
    >
      <p className="muted">
        {playerName ? `${playerName}, choose` : "Choose"} the color for the next
        play.
      </p>
      <div className="color-choices">
        {(["red", "yellow", "green", "blue"] as const).map((color) => (
          <button
            key={color}
            className={`color-choice choose-${color}`}
            onClick={() => onSelect(color)}
          >
            <span />
            {color}
          </button>
        ))}
      </div>
      {onCancel && (
        <button className="text-button" onClick={onCancel}>
          Keep the wild card
        </button>
      )}
    </Modal>
  );
}
