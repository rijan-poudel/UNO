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

const COLOR_ACTION_VALUES: ReadonlyArray<CardValue> = [
  'skip',
  'reverse',
  'draw2',
  'discardAll',
];

/**
 * Creates a fresh, unshuffled standard UNO deck:
 *   - 4 colors × 1 zero       = 4
 *   - 4 colors × 9 values × 2 = 72  (1–9)
 *   - 4 colors × 3 actions × 2 = 24  (skip, reverse, draw2)
 *   - 4 wild cards
 *   - 4 wild-draw-4 cards
 *   - 4 wild-shuffle cards (filtered if rule disabled)
 *   - 8 discard-all cards (filtered if rule disabled)
 */
export function createStandardUnoDeck(): Card[] {
  const cards: Card[] = [];

  for (const color of STANDARD_COLORS) {
    // One 0 per color
    cards.push(makeCard(color, '0'));

    // Two copies of 1–9
    for (const n of [
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
    ] as CardValue[]) {
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

  // Four wild-shuffle cards
  for (let i = 0; i < 4; i++) {
    cards.push(makeCard('wild', 'shuffle'));
  }

  return cards;
}

/**
 * Creates a fresh 168-card UNO Show 'Em No Mercy deck matching Mattel's specifications:
 *   - 80 Number cards (Two 0s per color = 8; Two of 1-9 per color = 72)
 *   - 64 Color Action cards (Skip: 3/color, Skip Everyone: 2/color, Reverse: 3/color,
 *     Draw 2: 3/color, Draw 4: 2/color, Discard All: 3/color)
 *   - 24 Wild Action cards (Wild Reverse Draw 4: 8, Wild Draw 6: 4,
 *     Wild Draw 10: 4, Wild Color Roulette: 8)
 *   Total: 168 cards
 */
export function createNoMercyDeck(): Card[] {
  const cards: Card[] = [];

  for (const color of STANDARD_COLORS) {
    // Two 0s per color (pass hands rule)
    cards.push(makeCard(color, '0'));
    cards.push(makeCard(color, '0'));

    // Two copies of 1–9 (7 is hand-swap rule)
    for (const n of [
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
    ] as CardValue[]) {
      cards.push(makeCard(color, n));
      cards.push(makeCard(color, n));
    }

    // 3 Skips per color
    for (let i = 0; i < 3; i++) cards.push(makeCard(color, 'skip'));
    // 2 Skip Everyone per color
    for (let i = 0; i < 2; i++) cards.push(makeCard(color, 'skipEveryone'));
    // 3 Reverses per color
    for (let i = 0; i < 3; i++) cards.push(makeCard(color, 'reverse'));
    // 3 Draw 2s per color
    for (let i = 0; i < 3; i++) cards.push(makeCard(color, 'draw2'));
    // 2 Draw 4s (colored) per color
    for (let i = 0; i < 2; i++) cards.push(makeCard(color, 'draw4'));
    // 3 Discard All per color
    for (let i = 0; i < 3; i++) cards.push(makeCard(color, 'discardAll'));
  }

  // 8 Wild Reverse Draw 4
  for (let i = 0; i < 8; i++) cards.push(makeCard('wild', 'wildReverseDraw4'));
  // 4 Wild Draw 6
  for (let i = 0; i < 4; i++) cards.push(makeCard('wild', 'wildDraw6'));
  // 4 Wild Draw 10
  for (let i = 0; i < 4; i++) cards.push(makeCard('wild', 'wildDraw10'));
  // 8 Wild Color Roulette
  for (let i = 0; i < 8; i++) cards.push(makeCard('wild', 'wildColorRoulette'));

  return cards;
}

/**
 * Creates a fresh 112-card UNO All Wild deck matching Mattel's specifications:
 * Every single card is wild (color: 'wild'):
 *   - 54 Standard Wild cards
 *   - 14 Wild Skip
 *   - 14 Wild Reverse
 *   - 10 Wild Draw 2
 *   - 6 Wild Skip Two
 *   - 6 Wild Draw 4
 *   - 4 Wild Targeted Draw 2
 *   - 4 Wild Forced Swap
 *   Total: 112 cards
 */
export function createAllWildDeck(): Card[] {
  const cards: Card[] = [];

  for (let i = 0; i < 54; i++) cards.push(makeCard('wild', 'wild'));
  for (let i = 0; i < 14; i++) cards.push(makeCard('wild', 'skip'));
  for (let i = 0; i < 14; i++) cards.push(makeCard('wild', 'reverse'));
  for (let i = 0; i < 10; i++) cards.push(makeCard('wild', 'draw2'));
  for (let i = 0; i < 6; i++) cards.push(makeCard('wild', 'wildSkip2'));
  for (let i = 0; i < 6; i++) cards.push(makeCard('wild', 'wild4'));
  for (let i = 0; i < 4; i++) cards.push(makeCard('wild', 'wildTargetDraw2'));
  for (let i = 0; i < 4; i++) cards.push(makeCard('wild', 'wildForcedSwap'));

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
