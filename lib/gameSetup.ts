// ============================================================
// lib/gameSetup.ts
// Initialises a fresh GameState from player names and optional rule overrides.
// ============================================================

import type { GameState, Player } from '../types/game';
import type { GameRules } from '../types/rules';
import type { Card, CardColor } from '../types/card';
import { defaultRules } from '../types/rules';
import { isActionCard, isWildCard, STANDARD_COLORS } from '../types/card';
import { createStandardUnoDeck, shuffleDeck, dealCards } from './deck';

// ── Internal helpers ──────────────────────────────────────────────────────────

/**
 * Draw the first valid starting card from the front of the deck.
 * Cards that are rejected (because allowStartingActionCard=false) are
 * collected and returned so they can be placed back at the bottom of the pile.
 */
function drawStartingCard(
  deck: Card[],
  allowAction: boolean,
): { card: Card; deck: Card[]; rejected: Card[] } {
  const rejected: Card[] = [];
  let remaining = [...deck];

  while (remaining.length > 0) {
    // Pop from the end (top of pile)
    const candidate = remaining[remaining.length - 1];
    remaining = remaining.slice(0, -1);

    const isInvalid = !allowAction && (isActionCard(candidate) || isWildCard(candidate));
    if (isInvalid) {
      rejected.push(candidate);
      continue;
    }

    return { card: candidate, deck: remaining, rejected };
  }

  throw new Error(
    'Could not find a valid starting card. ' +
    'Try allowStartingActionCard: true or add more cards.',
  );
}

/**
 * Derive the active color from the starting discard card.
 * Wild cards don't carry a color, so activeColor starts as null when a
 * wild is the first card — though this should not happen when allowStartingActionCard
 * is false, and the rules should ideally handle it.
 */
function getInitialActiveColor(card: Card): CardColor | null {
  return STANDARD_COLORS.includes(card.color as CardColor)
    ? (card.color as CardColor)
    : null;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Creates a fully initialised GameState ready for the first turn.
 *
 * @param playerNames   Display names for each player, in seat order.
 * @param rules         Optional partial rule overrides merged on top of defaultRules.
 * @param botFlags      Parallel array to playerNames — true marks a seat as bot-controlled.
 */
export function initializeGame(
  playerNames: string[],
  rules?: Partial<GameRules>,
  botFlags?: boolean[],
): GameState {
  // ── 1. Merge rules ───────────────────────────────────────────────────────
  const mergedRules: GameRules = {
    ...defaultRules,
    ...rules,
    // Guard against stale persisted configs forcing old 4-player caps.
    maxPlayers: Math.max(6, rules?.maxPlayers ?? defaultRules.maxPlayers),
  };

  // ── 2. Validate player count ─────────────────────────────────────────────
  if (playerNames.length < 2) {
    throw new Error('UNO requires at least 2 players.');
  }
  if (playerNames.length > mergedRules.maxPlayers) {
    throw new Error(
      `Too many players (${playerNames.length}). ` +
      `This game's rules allow a maximum of ${mergedRules.maxPlayers}.`,
    );
  }

  // ── 3. Create players (hands empty for now) ───────────────────────────────
  const players: Player[] = playerNames.map((name, i) => ({
    id: `player_${i}`,
    name,
    hand: [],
    saidUno: false,
    isBot: botFlags?.[i] ?? false,
  }));

  // ── 4. Create and shuffle deck ────────────────────────────────────────────
  let deck = createStandardUnoDeck().filter((card) => {
    if (card.value === 'discardAll' && !mergedRules.allowDiscardAll) return false;
    if (card.value === 'shuffle' && !mergedRules.allowShuffleCard) return false;
    return true;
  });
  deck = shuffleDeck(deck);

  // ── 5. Deal starting hands ────────────────────────────────────────────────
  // Deal one card at a time around the table, matching physical UNO dealing.
  for (let round = 0; round < mergedRules.startingHandSize; round++) {
    for (const player of players) {
      const { dealt, remaining } = dealCards(deck, 1);
      player.hand.push(...dealt);
      deck = remaining;
    }
  }

  // ── 6. Flip starting card ─────────────────────────────────────────────────
  const { card: startCard, deck: deckAfterStart, rejected } = drawStartingCard(
    deck,
    mergedRules.allowStartingActionCard,
  );

  // Rejected cards go back to the bottom of the draw pile so nothing is lost.
  deck = [...rejected, ...deckAfterStart];

  // ── 7. Derive initial active color ────────────────────────────────────────
  const activeColor = getInitialActiveColor(startCard);

  // ── 8. Assemble initial state ─────────────────────────────────────────────
  const state: GameState = {
    players,
    currentPlayerIndex: 0,
    direction: 1,
    drawPile: deck,
    discardPile: [startCard],
    activeColor,
    pendingDraw: 0,
    pendingDrawType: null,
    winnerId: null,
    rules: mergedRules,
    turnCount: 0,
    lastAction: { type: 'init' },
  };

  return state;
}
