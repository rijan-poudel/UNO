// ============================================================
// types/card.ts
// Core card model for the UNO engine.
// All card data is plain, serializable, and immutable by convention.
// ============================================================

/** The four standard UNO colors plus "wild" for color-agnostic cards. */
export type CardColor = "red" | "yellow" | "green" | "blue" | "wild";

/** Every possible face value a card can have. */
export type CardValue =
  | "0"
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "skip"
  | "reverse"
  | "draw2"
  | "draw4"
  | "skipEveryone"
  | "discardAll"
  | "wild"
  | "wild4"
  | "wildReverseDraw4"
  | "wildDraw6"
  | "wildDraw10"
  | "wildColorRoulette"
  | "wildSkip2"
  | "wildTargetDraw2"
  | "wildForcedSwap"
  | "shuffle";

/** A single UNO card. IDs are unique within a deck and stable across turns. */
export interface Card {
  /** Unique identifier for this specific physical card instance. */
  id: string;
  /** The color printed on the card. Wild cards always have color "wild". */
  color: CardColor;
  /** The face value of the card. */
  value: CardValue;
}

// ── Value category constants ─────────────────────────────────────────────────

export const NUMBER_VALUES: ReadonlyArray<CardValue> = [
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
];

export const ACTION_VALUES: ReadonlyArray<CardValue> = [
  "skip",
  "reverse",
  "draw2",
  "draw4",
  "skipEveryone",
  "discardAll",
  "wild",
  "wild4",
  "wildReverseDraw4",
  "wildDraw6",
  "wildDraw10",
  "wildColorRoulette",
  "wildSkip2",
  "wildTargetDraw2",
  "wildForcedSwap",
  "shuffle",
];

export const DRAW_VALUES: ReadonlyArray<CardValue> = [
  "draw2",
  "draw4",
  "wild4",
  "wildReverseDraw4",
  "wildDraw6",
  "wildDraw10",
];

export function getCardDrawPenalty(value: CardValue): number {
  switch (value) {
    case "draw2":
    case "wildTargetDraw2":
      return 2;
    case "draw4":
    case "wild4":
    case "wildReverseDraw4":
      return 4;
    case "wildDraw6":
      return 6;
    case "wildDraw10":
      return 10;
    default:
      return 0;
  }
}

export const STANDARD_COLORS: ReadonlyArray<CardColor> = [
  "red",
  "yellow",
  "green",
  "blue",
];

// ── Card classification helpers ──────────────────────────────────────────────

/** True for cards 0–9. Numeric cards do not trigger any special effect. */
export function isNumberCard(card: Card): boolean {
  return NUMBER_VALUES.includes(card.value);
}

/** True for any card that triggers a game effect (skip, reverse, draw2, wilds). */
export function isActionCard(card: Card): boolean {
  return ACTION_VALUES.includes(card.value);
}

/** True for draw2 and wild4 cards, which add cards to the pending draw pool. */
export function isDrawCard(card: Card): boolean {
  return DRAW_VALUES.includes(card.value);
}

/** True for wild and wild4 — cards that let the player choose the active color. */
export function isWildCard(card: Card): boolean {
  return card.color === "wild";
}

const CARD_LABELS: Partial<Record<CardValue, string>> = {
  skip: "Skip",
  reverse: "Reverse",
  draw2: "Draw two",
  draw4: "Draw four",
  skipEveryone: "Skip everyone",
  discardAll: "Discard all",
  wild: "Wild",
  wild4: "Wild draw four",
  wildReverseDraw4: "Wild reverse draw four",
  wildDraw6: "Wild draw six",
  wildDraw10: "Wild draw ten",
  wildColorRoulette: "Wild color roulette",
  wildSkip2: "Wild skip two",
  wildTargetDraw2: "Wild targeted draw two",
  wildForcedSwap: "Wild forced swap",
  shuffle: "Shuffle hands",
};

/** Shared visible and accessible card names, including every edition action. */
export function getCardLabel(card: Card): string {
  return `${card.color === "wild" ? "" : `${card.color} `}${CARD_LABELS[card.value] ?? card.value}`;
}
