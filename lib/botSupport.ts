// ============================================================
// lib/botSupport.ts
// Simple deterministic bot strategy layer.
//
// The bot does NOT execute actions — it returns a recommendation
// that the game loop can pass to the appropriate action function.
// This keeps AI logic decoupled from state mutation and makes it
// trivial to swap in smarter strategies later (minimax, MCTS, etc.).
// ============================================================

import type { Card, CardColor } from '../types/card';
import type { GameState } from '../types/game';
import { STANDARD_COLORS } from '../types/card';
import { getPlayableCards } from './gameRules';

// ── Bot action descriptor ─────────────────────────────────────────────────────

/**
 * A serializable recommendation returned by getBotMove().
 *
 * action 'play'  → call playCard(state, playerIndex, cardId, chosenColor)
 * action 'draw'  → call drawOneCard(state, playerIndex), then passTurn()
 * action 'drawRequired' → call drawRequiredCards(state, playerIndex)
 */
export type BotAction =
  | { action: 'play'; cardId: string; chosenColor?: CardColor }
  | { action: 'draw' }
  | { action: 'drawRequired' };

// ── Color preference helper ───────────────────────────────────────────────────

/**
 * Returns the non-wild color the bot holds the most of.
 * Ties are broken in color-array order (red > yellow > green > blue).
 * Falls back to 'red' when the hand contains only wild cards.
 */
export function getBotPreferredColor(hand: Card[]): CardColor {
  const counts: Record<string, number> = {
    red: 0, yellow: 0, green: 0, blue: 0,
  };

  for (const card of hand) {
    if (card.color !== 'wild') {
      counts[card.color] = (counts[card.color] ?? 0) + 1;
    }
  }

  let best: CardColor = 'red';
  let bestCount = -1;

  for (const color of STANDARD_COLORS) {
    if (counts[color] > bestCount) {
      bestCount = counts[color];
      best = color;
    }
  }

  return best;
}

// ── Card scoring heuristics ───────────────────────────────────────────────────

/**
 * A simple scoring function to rank cards by desirability.
 * Higher score = play this card sooner.
 *
 * Priority order:
 *   draw4 > draw2 > skip > reverse > wild > numbered cards (higher number = better)
 *
 * A more sophisticated bot can replace this with utility-based scoring.
 */
function scoreCard(card: Card): number {
  switch (card.value) {
    case 'wild4':   return 100;
    case 'shuffle': return 92;
    case 'draw2':   return 80;
    case 'discardAll': return 76;
    case 'skip':    return 70;
    case 'reverse': return 60;
    case 'wild':    return 50;
    default: {
      // Number cards: prefer higher numbers (more points removed from hand)
      const n = parseInt(card.value, 10);
      return isNaN(n) ? 0 : n;
    }
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Returns the bot's recommended action for `playerIndex` in the given state.
 *
 * Strategy (greedy):
 *   1. If there is a pending forced draw — recommend drawing required cards.
 *   2. Find all playable cards in the bot's hand.
 *   3. If at least one exists, play the highest-scoring playable card.
 *      - If it is a wild, choose the color the bot holds the most of.
 *   4. If no card is playable, recommend drawing one card.
 *
 * The bot's recommendation is pure data — it does not mutate state.
 */
export function getBotMove(state: GameState, playerIndex: number): BotAction {
  if (playerIndex !== state.currentPlayerIndex) {
    throw new Error(`It is not player ${playerIndex}'s turn.`);
  }

  const player = state.players[playerIndex];

  // ── Forced draw takes priority ────────────────────────────────────────────
  if (state.pendingDraw > 0) {
    const playable = getPlayableCards(player.hand, state, playerIndex);
    if (playable.length === 0) {
      // No valid stack card — must draw.
      return { action: 'drawRequired' };
    }
    // Has a valid stack card — fall through to the play-card logic below.
  }

  // ── Find best playable card ───────────────────────────────────────────────
  const playable = getPlayableCards(player.hand, state, playerIndex);

  if (playable.length === 0) {
    return { action: 'draw' };
  }

  // Sort descending by score and pick the best.
  const sorted = [...playable].sort((a, b) => scoreCard(b) - scoreCard(a));
  const best = sorted[0];

  const chosenColor =
    best.color === 'wild'
      ? getBotPreferredColor(player.hand)
      : undefined;

  return { action: 'play', cardId: best.id, chosenColor };
}
