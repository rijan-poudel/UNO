"use client";
import { useEffect, useRef } from "react";
import type { Card, CardColor } from "../types/card";
import Modal from "./Modal";
import { UnoActionSymbol } from "./icons/UnoActionSymbol";
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
      title={roulette ? "Color roulette" : "Choose a color"}
      onClose={onCancel}
      className={`color-picker-modal ${roulette ? "color-roulette-modal" : ""}`}
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
        {roulette && (
          <div className="roulette-wheel-badge" aria-hidden="true">
            <UnoActionSymbol value="wildColorRoulette" size={38} />
          </div>
        )}
        {roulette && (
          <p className="muted">
            Pick a color. Draw until it appears, keep the cards, and miss this
            turn.
          </p>
        )}
        <div
          className="color-choices"
          ref={choices}
          role="group"
          aria-label={
            playerName ? `${playerName}’s color choice` : "Color choice"
          }
          onKeyDown={(event) => {
            if (event.ctrlKey || event.altKey || event.metaKey) return;
            const columns = getComputedStyle(
              event.currentTarget,
            ).gridTemplateColumns.split(/\s+/).length;
            const offset = (
              {
                ArrowRight: 1,
                ArrowLeft: -1,
                ArrowDown: columns,
                ArrowUp: -columns,
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
                  ? buttons.length - 1
                  : (index + offset + 4) % 4;
            buttons[next]?.focus();
          }}
        >
          {COLORS.map((color) => {
            const count = hand.filter((card) => card.color === color).length;
            return (
              <button
                key={color}
                type="button"
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
          <button type="button" className="text-button" onClick={onCancel}>
            Keep the wild card
          </button>
        )}
      </div>
    </Modal>
  );
}
