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
  const player = state.players[playerIndex];
  if (!player || state.winnerId) return false;
  const { activeColor, pendingDraw, pendingDrawType, rules, discardPile } =
    state;
  const topDiscard = discardPile[discardPile.length - 1];
  if (!topDiscard) return false;
  if (card.value === 'discardAll' && !rules.allowDiscardAll) return false;
  if (card.value === 'shuffle' && !rules.allowShuffleCard) return false;
  // These restrictions apply equally to normal plays, stacks and jump-ins.
  if (
    !rules.canFinishWithActionCard &&
    isActionCard(card) &&
    (player.hand.length === 1 ||
      (card.value === 'discardAll' &&
        player.hand.every((entry) => entry.color === card.color)))
  )
    return false;
  if (playerIndex !== state.currentPlayerIndex)
    return canJumpInPlay(card, state);
  if (pendingDraw > 0) {
    return (
      pendingDrawType !== null && isValidStackCard(card, pendingDrawType, rules)
    );
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

export interface CardPlayChoice {
  cards: Card[];
  remaining: number;
  secondCardId?: string;
}

/** A compact, truthful cue for special moves available on this card now. */
export function getCardPlayHint(
  state: GameState,
  playerIndex: number,
  card: Card,
): { badge: string; description: string } | undefined {
  const choices = getCardPlayChoices(state, playerIndex, card);
  if (choices.some((choice) => choice.secondCardId))
    return {
      badge: '×2',
      description: choices.some((choice) => !choice.secondCardId)
        ? 'Matching pair · play one or both'
        : 'Matching pair · play both together',
    };
  const choice = choices[0];
  if (card.value !== 'discardAll' || !choice || choice.cards.length < 2)
    return undefined;
  return {
    badge: `−${choice.cards.length}`,
    description: `${choice.cards.length} out · ${choice.remaining === 0 ? 'empty hand — you win' : `${choice.remaining} left${choice.remaining === 1 && state.rules.mustDeclareUno && !state.players[playerIndex].saidUno ? ' · call UNO' : ''}`}`,
  };
}

/** Legal outcomes for one activated card, including optional number pairs. */
export function getCardPlayChoices(
  state: GameState,
  playerIndex: number,
  card: Card,
): CardPlayChoice[] {
  const player = state.players[playerIndex];
  if (
    !player ||
    !player.hand.some((entry) => entry.id === card.id) ||
    state.winnerId
  )
    return [];
  const removed =
    card.value === 'discardAll' && state.rules.allowDiscardAll
      ? player.hand.filter((entry) => entry.color === card.color)
      : [card];
  const singlePlayable = canPlayCard(card, state, playerIndex);
  const choices: CardPlayChoice[] = singlePlayable
    ? [{ cards: removed, remaining: player.hand.length - removed.length }]
    : [];
  const top = state.discardPile.at(-1);
  if (playerIndex !== state.currentPlayerIndex || state.pendingDraw > 0 || !top)
    return choices;
  for (const pair of getPlayableMultiCardCombos(
    player.hand,
    top,
    state.activeColor,
    state.rules,
  )) {
    if (!pair.some((entry) => entry.id === card.id)) continue;
    const second = pair.find((entry) => entry.id !== card.id);
    if (second)
      choices.push({
        cards: singlePlayable ? [card, second] : [second, card],
        remaining: player.hand.length - 2,
        secondCardId: singlePlayable ? second.id : card.id,
      });
  }
  return choices;
}

/** Rule-specific guidance for inspection; legal plays never need an extra tap. */
export function getCardPlayBlockReason(
  state: GameState,
  playerIndex: number,
  card: Card,
): string | undefined {
  if (getCardPlayChoices(state, playerIndex, card).length > 0) return undefined;
  const player = state.players[playerIndex];
  if (!player || !player.hand.some((entry) => entry.id === card.id))
    return 'That card is no longer in your hand.';
  if (state.winnerId) return 'This round is over. Deal again to play.';
  if (card.value === 'discardAll' && !state.rules.allowDiscardAll)
    return 'Discard All is off at this table.';
  if (card.value === 'shuffle' && !state.rules.allowShuffleCard)
    return 'Shuffle Hands is off at this table.';
  if (
    !state.rules.canFinishWithActionCard &&
    isActionCard(card) &&
    (player.hand.length === 1 ||
      (card.value === 'discardAll' &&
        player.hand.every((entry) => entry.color === card.color)))
  ) {
    return 'Finish with a number card.';
  }
  if (playerIndex !== state.currentPlayerIndex)
    return !state.rules.allowJumpIn
      ? 'Jump-ins are off here.'
      : state.pendingDraw > 0
        ? `Jump-in blocked by +${state.pendingDraw}.`
        : 'Jump-in needs an exact match.';
  if (state.pendingDraw > 0) {
    const stackingAllowed =
      state.pendingDrawType === 'draw2'
        ? state.rules.stackDraw2 || state.rules.allowWild4OnDraw2
        : state.rules.stackWild4;
    if (!stackingAllowed) return `Stacking is off. Draw ${state.pendingDraw}.`;
    return getPlayableCards(player.hand, state, playerIndex).length > 0
      ? 'Only draw cards can stack.'
      : `No stack. Draw ${state.pendingDraw}.`;
  }
  if (
    NUMBER_VALUES.includes(card.value) &&
    player.hand.some(
      (entry) =>
        entry.id !== card.id &&
        entry.value === card.value &&
        canPlayCard(entry, state, playerIndex),
    )
  ) {
    if (!state.rules.allowDoublePlaySameNumber)
      return 'Pairs are off. Play a match or draw.';
    if (state.rules.allowDoublePlayExactMatchOnly)
      return 'Pairs need the same color.';
  }
  return undefined;
}

/** Pre-calls also cover pairs and Discard All plays that leave one card. */
export function canDeclareUno(state: GameState, playerIndex: number): boolean {
  const player = state.players[playerIndex];
  if (
    !player ||
    state.winnerId ||
    !state.rules.mustDeclareUno ||
    player.saidUno
  )
    return false;
  return (
    (player.hand.length >= 1 && player.hand.length <= 2) ||
    player.hand.some((card) =>
      getCardPlayChoices(state, playerIndex, card).some(
        (choice) => choice.remaining === 1,
      ),
    )
  );
}
