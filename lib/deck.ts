// ============================================================
// lib/deck.ts
// Deck generation and shuffling utilities.
// ============================================================

import type { Card, CardColor, CardValue } from '../types/card';
import { STANDARD_COLORS } from '../types/card';

// ── Internal ID generation ────────────────────────────────────────────────────

/**
 * Module-level counter. Because decks are created once per game and the IDs
 * are never compared across different game instances, a simple integer suffix
 * is sufficient and keeps the output deterministic within a single run.
 */
let _cardIdCounter = 0;

/** Reset the counter — useful in test environments to get predictable IDs. */
export function resetCardIdCounter(): void {
  _cardIdCounter = 0;
}

function makeCardId(): string {
  return `c${++_cardIdCounter}`;
}

function makeCard(color: CardColor, value: CardValue): Card {
  return { id: makeCardId(), color, value };
}

// ── Standard deck composition ────────────────────────────────────────────────

const COLOR_ACTION_VALUES: ReadonlyArray<CardValue> = ['skip', 'reverse', 'draw2'];

/**
 * Creates a fresh, unshuffled 108-card standard UNO deck:
 *   - 4 colors × 1 zero       = 4
 *   - 4 colors × 9 values × 2 = 72  (1–9)
 *   - 4 colors × 3 actions × 2 = 24  (skip, reverse, draw2)
 *   - 4 wild cards
 *   - 4 wild-draw-4 cards
 *   ─────────────────────────────
 *   Total: 108 cards
 */
export function createStandardUnoDeck(): Card[] {
  const cards: Card[] = [];

  for (const color of STANDARD_COLORS) {
    // One 0 per color
    cards.push(makeCard(color, '0'));

    // Two copies of 1–9
    for (const n of ['1', '2', '3', '4', '5', '6', '7', '8', '9'] as CardValue[]) {
      cards.push(makeCard(color, n));
      cards.push(makeCard(color, n));
    }

    // Two copies of each action card per color
    for (const action of COLOR_ACTION_VALUES) {
      cards.push(makeCard(color, action));
      cards.push(makeCard(color, action));
    }
  }

  // Four wilds
  for (let i = 0; i < 4; i++) {
    cards.push(makeCard('wild', 'wild'));
  }

  // Four wild-draw-4s
  for (let i = 0; i < 4; i++) {
    cards.push(makeCard('wild', 'wild4'));
  }

  return cards;
}

// ── Shuffle ───────────────────────────────────────────────────────────────────

/**
 * Returns a new array with the same cards in a randomly shuffled order.
 * Uses the Fisher-Yates algorithm for an unbiased shuffle.
 * Does NOT mutate the input array.
 */
export function shuffleDeck(cards: Card[]): Card[] {
  const shuffled = [...cards];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    // Swap
    const temp = shuffled[i];
    shuffled[i] = shuffled[j];
    shuffled[j] = temp;
  }
  return shuffled;
}

/**
 * Returns the top N cards from the pile (last N elements) and the remaining pile.
 * Treats the array as a stack where index (length-1) is the top.
 */
export function dealCards(
  pile: Card[],
  count: number,
): { dealt: Card[]; remaining: Card[] } {
  const safeCount = Math.min(count, pile.length);
  const remaining = pile.slice(0, pile.length - safeCount);
  const dealt = pile.slice(pile.length - safeCount);
  return { dealt, remaining };
}
