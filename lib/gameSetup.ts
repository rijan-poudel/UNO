// ============================================================
// lib/gameSetup.ts
// Initialises a fresh GameState from player names and optional rule overrides.
// ============================================================

import type { GameState, Player } from '../types/game';
import type { GameRules } from '../types/rules';
import type { Card, CardColor } from '../types/card';
import { isActionCard, isWildCard, STANDARD_COLORS } from '../types/card';
import { validateGameRules } from './validateGameRules';
import {
  createStandardUnoDeck,
  createNoMercyDeck,
  createAllWildDeck,
  shuffleDeck,
  dealCards,
  resetCardIdCounter,
} from './deck';

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

    // There is no player choosing a color before the opening turn. Keep wilds
    // in the deck; the opening discard must establish a real playable color.
    const isInvalid =
      isWildCard(candidate) || (!allowAction && isActionCard(candidate));
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
 * The opening-card selector excludes wilds, so a normal game always starts
 * with one of the four playable colors.
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
  // ── 0. Reset card ID counter for a clean game ──────────────────────────
  resetCardIdCounter();

  // ── 1. Merge rules ───────────────────────────────────────────────────────
  const mergedRules = validateGameRules(rules);

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
  let deck = createGameDeck(mergedRules);

  // Reserve opening candidate(s) so dealing doesn't starve the deck.
  const openingReserve =
    mergedRules.gameMode === 'all_wild'
      ? 1
      : deck.filter(
          (card) =>
            isWildCard(card) ||
            ((mergedRules.gameMode === 'no_mercy' ||
              !mergedRules.allowStartingActionCard) &&
              isActionCard(card)),
        ).length + 1;

  if (
    playerNames.length * mergedRules.startingHandSize >
    deck.length - openingReserve
  ) {
    throw new Error(
      'Not enough cards for these starting hands. Choose fewer cards or players.',
    );
  }
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
  let startCard: Card;
  if (mergedRules.gameMode === 'all_wild') {
    // In All Wild, top card begins discard pile; its special action is ignored.
    startCard = deck[deck.length - 1];
    deck = deck.slice(0, -1);
  } else {
    const {
      card,
      deck: deckAfterStart,
      rejected,
    } = drawStartingCard(
      deck,
      mergedRules.gameMode === 'no_mercy'
        ? false
        : mergedRules.allowStartingActionCard,
    );
    startCard = card;
    // Rejected cards go back to the bottom of the draw pile so nothing is lost.
    deck = [...rejected, ...deckAfterStart];
  }

  // ── 7. Derive initial active color ────────────────────────────────────────
  const activeColor =
    mergedRules.gameMode === 'all_wild'
      ? null
      : getInitialActiveColor(startCard);

  // ── 8. Assemble initial state ─────────────────────────────────────────────
  const isActionStart =
    mergedRules.gameMode !== 'all_wild' && startCard.value !== '0';
  const state: GameState = {
    players,
    currentPlayerIndex:
      isActionStart && startCard.value === 'skip'
        ? 1
        : isActionStart && startCard.value === 'reverse'
          ? players.length - 1
          : 0,
    direction: isActionStart && startCard.value === 'reverse' ? -1 : 1,
    drawPile: deck,
    discardPile: [startCard],
    activeColor,
    pendingDraw: isActionStart && startCard.value === 'draw2' ? 2 : 0,
    pendingDrawType:
      isActionStart && startCard.value === 'draw2' ? 'draw2' : null,
    drawnThisTurn: false,
    winnerId: null,
    rules: mergedRules,
    turnCount: 0,
    lastAction: { type: 'init' },
  };

  return state;
}

/** One deck definition shared by fresh deals and saved-round validation. */
export function createGameDeck(rules: GameRules): Card[] {
  let deck =
    rules.gameMode === 'no_mercy'
      ? createNoMercyDeck()
      : rules.gameMode === 'all_wild'
        ? createAllWildDeck()
        : createStandardUnoDeck();
  if (rules.gameMode === 'no_mercy' && rules.allowShuffleCard) {
    deck = [
      ...deck,
      ...createStandardUnoDeck().filter((card) => card.value === 'shuffle'),
    ];
  }
  return deck.filter(
    (card) =>
      (card.value !== 'discardAll' || rules.allowDiscardAll) &&
      (card.value !== 'shuffle' || rules.allowShuffleCard),
  );
}
