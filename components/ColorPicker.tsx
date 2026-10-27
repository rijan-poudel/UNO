"use client";
import { useEffect, useRef } from "react";
import type { Card, CardColor } from "../types/card";
import Modal from "./Modal";
const COLORS = ["red", "yellow", "green", "blue"] as const;
export default function ColorPicker({
  onSelect,
  onCancel,
  playerName,
  hand = [],
  roulette = false,
}: {
  onSelect: (color: CardColor) => void;
  onCancel?: () => void;
  playerName?: string;
  hand?: Card[];
  roulette?: boolean;
}) {
  const choices = useRef<HTMLDivElement>(null);
  useEffect(() => {
    choices.current?.querySelector<HTMLButtonElement>("button")?.focus();
  }, []);
  return (
    <Modal
      title={roulette ? "Color roulette" : "Your wild. Your color."}
      onClose={onCancel}
      className="color-picker-modal"
    >
      <div
        onKeyDown={(event) => {
          if (event.repeat || event.ctrlKey || event.altKey || event.metaKey)
            return;
          const color = COLORS.find(
            (entry) => entry[0] === event.key.toLowerCase(),
          );
          if (color) {
            event.preventDefault();
            onSelect(color);
          }
        }}
      >
        <p className="muted">
          {roulette
            ? "Choose a color. Reveal cards until it appears, take them all, then skip this turn."
            : `${playerName ? `${playerName}, choose` : "Choose"} the color for the next play.`}
        </p>
        <div
          className="color-choices"
          ref={choices}
          onKeyDown={(event) => {
            const offset = (
              {
                ArrowRight: 1,
                ArrowLeft: -1,
                ArrowDown: 2,
                ArrowUp: -2,
              } as Record<string, number>
            )[event.key];
            if (!offset && event.key !== "Home" && event.key !== "End") return;
            const buttons = Array.from(
              event.currentTarget.querySelectorAll("button"),
            );
            const index = buttons.indexOf(event.target as HTMLButtonElement);
            if (index < 0) return;
            event.preventDefault();
            const next =
              event.key === "Home"
                ? 0
                : event.key === "End"
                  ? 3
                  : (index + offset + 4) % 4;
            buttons[next]?.focus();
          }}
        >
          {COLORS.map((color) => {
            const count = hand.filter((card) => card.color === color).length;
            return (
              <button
                key={color}
                className={`color-choice choose-${color}`}
                onClick={() => onSelect(color)}
                aria-label={`Choose ${color}, ${count} ${count === 1 ? "card" : "cards"} in your hand`}
                aria-keyshortcuts={color[0].toUpperCase()}
              >
                <span aria-hidden="true" />
                <span className="color-choice-name">
                  {color}
                  <small>{count} in hand</small>
                </span>
                <kbd aria-hidden="true">{color[0].toUpperCase()}</kbd>
              </button>
            );
          })}
        </div>
        {onCancel && (
          <button className="text-button" onClick={onCancel}>
            Keep the wild card
          </button>
        )}
      </div>
    </Modal>
  );
}
