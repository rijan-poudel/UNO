// ============================================================
// lib/gameRules.ts
// Play-validation logic and double-play combo detection.
// Pure functions — no state mutation.
// ============================================================

import type { Card, CardColor } from '../types/card';
import type { GameState } from '../types/game';
import type { GameRules } from '../types/rules';
import { isWildCard, isActionCard, NUMBER_VALUES } from '../types/card';

export function canJumpInPlay(card: Card, state: GameState): boolean {
  if (!state.rules.allowJumpIn) return false;
  if (state.pendingDraw > 0) return false;

  const topDiscard = state.discardPile[state.discardPile.length - 1];
  if (!topDiscard) return false;

  return card.color === topDiscard.color && card.value === topDiscard.value;
}

// ── Single-card play validation ───────────────────────────────────────────────

/**
 * Determines whether `card` is legally playable by `playerIndex` given the
 * current game state.
 *
 * Rule branches:
 *   1. If it's not the player's turn → false (jump-in is checked separately).
 *   2. If there is a pending draw pile:
 *      - Only draw-stacking cards or forced draw are allowed.
 *   3. Otherwise standard playability:
 *      - Wilds are always playable.
 *      - Cards matching the active color are playable.
 *      - Cards matching the top discard's value are playable.
 */
export function canPlayCard(
  card: Card,
  state: GameState,
  playerIndex: number,
): boolean {
  // Rule branch 1 — turn guard
  if (playerIndex !== state.currentPlayerIndex) {
    return canJumpInPlay(card, state);
  }

  const { activeColor, pendingDraw, pendingDrawType, rules, discardPile } =
    state;
  const topDiscard = discardPile[discardPile.length - 1];
  if (!topDiscard) return false;

  if (card.value === 'discardAll' && !rules.allowDiscardAll) return false;
  if (card.value === 'shuffle' && !rules.allowShuffleCard) return false;

  // Rule branch 2 — pending draw means the player must resolve it before playing,
  // UNLESS stacking rules permit a valid counter-card.
  if (pendingDraw > 0 && pendingDrawType !== null) {
    return isValidStackCard(card, pendingDrawType, rules);
  }

  // Rule branch 3 — standard playability

  // If the player is down to their last card and canFinishWithActionCard is false,
  // block action/wild cards from being played as the final card.
  const playerHand = state.players[playerIndex]?.hand ?? [];
  if (
    !rules.canFinishWithActionCard &&
    playerHand.length === 1 &&
    isActionCard(card)
  ) {
    return false;
  }

  // Wild cards (wild / wild4) are always playable when there is no pending draw.
  if (isWildCard(card)) return true;

  // Same active color (may differ from top card's printed color after a wild play)
  if (activeColor !== null && card.color === activeColor) return true;

  // Same value as the top discard (cross-color plays)
  if (card.value === topDiscard.value) return true;

  return false;
}

/**
 * Whether `card` qualifies as a legal stack response to an incoming `pendingDrawType`.
 */
function isValidStackCard(
  card: Card,
  pendingDrawType: 'draw2' | 'wild4',
  rules: GameRules,
): boolean {
  if (pendingDrawType === 'draw2') {
    // Player may play their own draw2 if stackDraw2 is enabled.
    if (rules.stackDraw2 && card.value === 'draw2') return true;
    // Player may also escape a draw2 with a wild4 if allowWild4OnDraw2 is enabled.
    if (rules.allowWild4OnDraw2 && card.value === 'wild4') return true;
    return false;
  }

  if (pendingDrawType === 'wild4') {
    // Player may play their own wild4 if stackWild4 is enabled.
    if (rules.stackWild4 && card.value === 'wild4') return true;
    return false;
  }

  return false;
}

/**
 * Convenience: filters a player's hand to cards playable right now.
 */
export function getPlayableCards(
  hand: Card[],
  state: GameState,
  playerIndex: number,
): Card[] {
  return hand.filter((card) => canPlayCard(card, state, playerIndex));
}

// ── Double-play combo detection ────────────────────────────────────────────────

/**
 * Returns all valid pairs of cards from `hand` that can be played together in
 * one turn under the active double-play rules.
 *
 * Rules applied:
 *   - allowDoublePlaySameNumber must be true (otherwise returns []).
 *   - Both cards must be number cards with the same face value.
 *   - At least one of the two cards must be individually playable
 *     (matches activeColor or matches topCard.value).
 *   - If allowDoublePlayExactMatchOnly is also true, both cards must share
 *     the same color in addition to the same value ("exact match").
 *
 * This helper is designed to be consumed by a future playMultipleCards() action
 * without modification.
 *
 * @returns An array of [Card, Card] pairs, each representing a valid double-play.
 */
export function getPlayableMultiCardCombos(
  hand: Card[],
  topCard: Card,
  activeColor: CardColor | null,
  rules: GameRules,
): [Card, Card][] {
  if (!rules.allowDoublePlaySameNumber) return [];

  // Restrict to number cards only (action / wild double-plays are not supported).
  const numberCards = hand.filter((c) => NUMBER_VALUES.includes(c.value));

  // Group cards by their face value.
  const byValue = new Map<string, Card[]>();
  for (const card of numberCards) {
    const group = byValue.get(card.value) ?? [];
    byValue.set(card.value, [...group, card]);
  }

  const combos: [Card, Card][] = [];

  for (const group of byValue.values()) {
    if (group.length < 2) continue;

    // Generate all pairs within the value group.
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const a = group[i];
        const b = group[j];

        // At least one card in the pair must be playable as the "lead" card.
        const eitherPlayable =
          (activeColor !== null &&
            (a.color === activeColor || b.color === activeColor)) ||
          a.value === topCard.value; // value always matches within the group

        if (!eitherPlayable) continue;

        // Exact-match mode: both cards must also share the same color.
        if (rules.allowDoublePlayExactMatchOnly && a.color !== b.color)
          continue;

        combos.push([a, b]);
      }
    }
  }

  return combos;
}
