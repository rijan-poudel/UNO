// Optional visual reference: the same card faces used on the live table.
"use client";
import { useState } from "react";
import type { CardValue } from "../types/card";
import UnoCard from "./UnoCard";
import styles from "./CardSymbolGuide.module.css";

const COMMON: Array<[CardValue, string, string]> = [
  ["reverse", "Reverse", "Change the direction of play."],
  ["skip", "Skip", "The next player misses a turn."],
  [
    "draw2",
    "Draw Two",
    "The next player draws two and misses a turn, unless your table allows stacking.",
  ],
];
const MERCY: Array<[CardValue, string, string]> = [
  ...COMMON,
  [
    "draw4",
    "Draw Four",
    "The next player takes four or stacks an equal or higher draw card.",
  ],
  [
    "discardAll",
    "Discard All",
    "Throw this card and every other card of its color together.",
  ],
  [
    "skipEveryone",
    "Skip Everyone",
    "Everyone else is skipped. You play again.",
  ],
  [
    "wildReverseDraw4",
    "Wild Reverse Draw Four",
    "Reverse, then give four cards to the next player in the new direction. With two players, you take the penalty unless you stack.",
  ],
  [
    "wildDraw6",
    "Wild Draw Six",
    "The next player takes six or stacks a draw card worth six or more.",
  ],
  [
    "wildDraw10",
    "Wild Draw Ten",
    "The next player takes ten or stacks another ten.",
  ],
  [
    "wildColorRoulette",
    "Color Roulette",
    "The next player picks a color, draws until it appears, keeps all those cards and misses a turn.",
  ],
];
const WILD: Array<[CardValue, string, string]> = [
  ["wild", "Wild", "Play it without matching a color or choosing one."],
  ...COMMON,
  ["wild4", "Wild Draw Four", "The next player draws four and misses a turn."],
  ["wildSkip2", "Wild Skip Two", "The next two players miss their turns."],
  [
    "wildTargetDraw2",
    "Wild Targeted Draw Two",
    "Choose anyone to draw two. They keep their next turn.",
  ],
  [
    "wildForcedSwap",
    "Wild Forced Swap",
    "Choose another player and exchange your whole hands.",
  ],
];

export default function CardSymbolGuide({
  mode,
}: {
  mode: "no_mercy" | "all_wild";
}) {
  const [open, setOpen] = useState(false);
  return (
    <details
      className={styles.guide}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary>Card symbols</summary>
      {open && (
        <>
          <p className="muted">Original edition reference.</p>
          <dl aria-label="Original edition card reference">
            {(mode === "no_mercy" ? MERCY : WILD).map(
              ([value, label, description]) => (
                <div className={styles.row} key={value}>
                  <span className={styles.preview} aria-hidden="true">
                    <UnoCard
                      sizeMultiplier={0.5}
                      card={{
                        id: `guide-${value}`,
                        value,
                        color:
                          mode === "all_wild" || value.startsWith("wild")
                            ? "wild"
                            : "red",
                      }}
                    />
                  </span>
                  <div>
                    <dt>
                      {mode === "all_wild" && !label.startsWith("Wild")
                        ? `Wild ${label}`
                        : label}
                    </dt>
                    <dd>{description}</dd>
                  </div>
                </div>
              ),
            )}
          </dl>
        </>
      )}
    </details>
  );
}
