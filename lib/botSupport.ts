// ============================================================
// lib/botSupport.ts
// Simple deterministic bot strategy layer.
//
// Strategy returns recommendations; playBotStep applies one through
// the immutable engine for local, online and unattended human seats.
// ============================================================

import type { Card, CardColor } from '../types/card';
import type { GameState } from '../types/game';
import { STANDARD_COLORS } from '../types/card';
import { getPlayableCards } from './gameRules';
import { getNextPlayerIndex } from './turns';
import {
  callOutUno,
  chooseRouletteColor,
  declareUno,
  drawOneCard,
  drawRequiredCards,
  passTurn,
  playCard,
} from './gameActions';
import type { BotDifficulty } from '../types/rules';

export const BOT_DIFFICULTY_OPTIONS = [
  {
    value: 'casual',
    label: 'Casual',
    description: 'Plays the first matching card.',
  },
  {
    value: 'standard',
    label: 'Standard',
    description: 'Favors action cards and high numbers.',
  },
  {
    value: 'tactical',
    label: 'Tactical',
    description: 'Saves wilds, builds color runs and watches hand counts.',
  },
] satisfies Array<{ value: BotDifficulty; label: string; description: string }>;

export function getBotDifficultyLabel(
  value: BotDifficulty = 'standard',
): string {
  return (
    BOT_DIFFICULTY_OPTIONS.find((option) => option.value === value)?.label ??
    'Standard'
  );
}

// ── Bot action descriptor ─────────────────────────────────────────────────────

/**
 * A serializable recommendation returned by getBotMove().
 *
 * action 'play'  → call playCard(state, playerIndex, cardId, chosenColor)
 * action 'draw'  → call drawOneCard(state, playerIndex), then passTurn()
 * action 'drawRequired' → call drawRequiredCards(state, playerIndex)
 */
export type BotAction =
  | {
      action: 'play';
      cardId: string;
      chosenColor?: CardColor;
      targetPlayerId?: string;
    }
  | { action: 'draw' }
  | { action: 'pass' }
  | { action: 'drawRequired' };

// ── Color preference helper ───────────────────────────────────────────────────

/**
 * Returns the non-wild color the bot holds the most of.
 * Ties are broken in color-array order (red > yellow > green > blue).
 * Falls back to 'red' when the hand contains only wild cards.
 */
export function getBotPreferredColor(hand: Card[]): CardColor {
  const counts: Record<string, number> = {
    red: 0,
    yellow: 0,
    green: 0,
    blue: 0,
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
    case 'wildDraw10':
      return 120;
    case 'wildDraw6':
      return 110;
    case 'wildReverseDraw4':
      return 105;
    case 'wild4':
      return 100;
    case 'draw4':
      return 95;
    case 'shuffle':
      return 92;
    case 'skipEveryone':
      return 90;
    case 'wildColorRoulette':
      return 88;
    case 'wildTargetDraw2':
      return 85;
    case 'wildForcedSwap':
      return 84;
    case 'draw2':
      return 80;
    case 'discardAll':
      return 76;
    case 'wildSkip2':
      return 75;
    case 'skip':
      return 70;
    case 'reverse':
      return 60;
    case 'wild':
      return 50;
    default: {
      // Number cards: prefer higher numbers (more points removed from hand)
      const n = parseInt(card.value, 10);
      return isNaN(n) ? 0 : n;
    }
  }
}

// Tactical strategy uses only this hand and public counts, never opponents'
// faces or the draw pile. No simulation through the authoritative hidden deck.
function scoreTacticalCard(card: Card, hand: Card[], state: GameState): number {
  const remaining = hand.filter(
    (entry) =>
      entry.id !== card.id &&
      !(card.value === 'discardAll' && entry.color === card.color),
  );
  if (remaining.length === 0) return 10_000;
  if (card.value === 'shuffle') {
    const total =
      state.players.reduce((sum, player) => sum + player.hand.length, 0) - 1;
    return 45 * (hand.length - Math.ceil(total / state.players.length));
  }
  const color =
    card.color === 'wild' ? getBotPreferredColor(remaining) : card.color;
  let score = (hand.length - remaining.length) * 50;
  score += remaining.filter((entry) => entry.color === color).length * 6;
  if (card.value === 'wild') score -= 25;
  else if (card.value === 'wild4') score -= 12;
  else if (['draw2', 'skip', 'reverse'].includes(card.value)) score += 8;
  else if (/^\d$/.test(card.value)) score += Number(card.value);

  const nextCount = state.players[getNextPlayerIndex(state)].hand.length;
  const previousCount =
    state.players[getNextPlayerIndex(state, -1)].hand.length;
  if (nextCount <= 2) {
    if (card.value === 'draw2' || card.value === 'wild4') score += 65;
    if (card.value === 'skip') score += 60;
    if (
      card.value === 'reverse' &&
      (state.players.length === 2
        ? state.rules.reverseActsAsSkipInTwoPlayer
        : previousCount > 2)
    )
      score += 60;
  } else if (
    card.value === 'reverse' &&
    state.players.length > 2 &&
    previousCount <= 2
  ) {
    score -= 30;
  }
  return score;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Returns the bot's recommended action for `playerIndex` in the given state.
 *
 * Standard strategy (greedy):
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
    return { action: state.drawnThisTurn ? 'pass' : 'draw' };
  }

  const difficulty = state.rules.botDifficulty ?? 'standard';
  const best =
    difficulty === 'casual'
      ? playable[0]
      : [...playable].sort((a, b) =>
          difficulty === 'tactical'
            ? scoreTacticalCard(b, player.hand, state) -
              scoreTacticalCard(a, player.hand, state)
            : scoreCard(b) - scoreCard(a),
        )[0];

  const chosenColor =
    best.color === 'wild' && state.rules.gameMode !== 'all_wild'
      ? getBotPreferredColor(player.hand)
      : undefined;

  let targetPlayerId: string | undefined;
  if (
    (state.rules.sevenZero && best.value === '7') ||
    best.value === 'wildForcedSwap' ||
    best.value === 'wildTargetDraw2'
  ) {
    let minCards = Infinity;
    for (let i = 0; i < state.players.length; i++) {
      if (i === playerIndex || state.players[i].eliminated) continue;
      if (state.players[i].hand.length < minCards) {
        minCards = state.players[i].hand.length;
        targetPlayerId = state.players[i].id;
      }
    }
  }

  return {
    action: 'play',
    cardId: best.id,
    chosenColor,
    ...(targetPlayerId ? { targetPlayerId } : {}),
  };
}

// Public round/seat data keeps the decision deterministic across controllers.
function botRemembersUno(game: GameState, index: number): boolean {
  const player = game.players[index];
  if (!player.isBot) return true; // Unattended human seats keep the existing safety net.
  let hash = 2166136261;
  for (const character of `${game.roundId ?? ''}:${game.turnCount}:${player.id}`) {
    hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  }
  const missPercent = { casual: 35, standard: 15, tactical: 5 }[
    game.rules.botDifficulty ?? 'standard'
  ];
  return (hash >>> 0) % 100 >= missPercent;
}

/** Execute one recommendation, publishing draws before any follow-up play. */
export function playBotStep(game: GameState): GameState {
  if (game.winnerId) return game;
  const index = game.currentPlayerIndex;
  if (game.pendingRoulette)
    return chooseRouletteColor(
      game,
      index,
      getBotPreferredColor(game.players[index].hand),
    );
  const target = game.players.findIndex(
    (player, seat) =>
      seat !== index && player.hand.length === 1 && !player.saidUno,
  );
  const state = target < 0 ? game : callOutUno(game, index, target);
  if (state.winnerId) return state;
  const move = getBotMove(state, index);
  let next: GameState;
  if (move.action === 'drawRequired') next = drawRequiredCards(state, index);
  else if (move.action === 'pass') next = passTurn(state, index);
  else if (move.action === 'draw') next = drawOneCard(state, index);
  else
    next = playCard(state, index, move.cardId, move.chosenColor, {
      targetPlayerId: move.targetPlayerId,
    });

  if (
    !next.winnerId &&
    next.rules.mustDeclareUno &&
    next.players[index].hand.length === 1 &&
    !next.players[index].saidUno &&
    botRemembersUno(game, index)
  ) {
    const declared = declareUno(next, index);
    return next.lastAction.type === 'play'
      ? { ...declared, lastAction: { ...next.lastAction, declaredUno: true } }
      : declared;
  }
  return next;
}
