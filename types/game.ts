// ============================================================
// types/game.ts
// The complete, serializable game state model.
// Every field must survive JSON.stringify / JSON.parse round-trips
// to support saving, network transport, and time-travel debugging.
// ============================================================

import type { Card, CardColor } from './card';
import type { GameRules } from './rules';

// ── Player ────────────────────────────────────────────────────────────────────

export interface Player {
  /** Stable unique identifier. Use "player_0", "player_1", … by default. */
  id: string;
  /** Display name shown in the UI. */
  name: string;
  /** Cards currently held by this player. */
  hand: Card[];
  /** Whether this player has declared "UNO!" this turn cycle. */
  saidUno: boolean;
  /** If true, a bot controller should drive this player's decisions. */
  isBot: boolean;
}

// ── Last-action union ────────────────────────────────────────────────────────
// Structured union makes it easy to render action log entries in the UI
// without parsing strings, and safe to branch on in reducers.

export type LastAction =
  | { type: 'init' }
  | { type: 'play'; playerId: string; card: Card; chosenColor?: CardColor }
  | { type: 'draw'; playerId: string; count: number }
  | { type: 'pass'; playerId: string }
  | { type: 'declareUno'; playerId: string }
  | { type: 'callOut'; callerId: string; targetId: string; penalty: number };

// ── Game State ────────────────────────────────────────────────────────────────

/**
 * GameState is the single immutable snapshot of everything needed to render
 * the game and compute the next state. Pure functions in the lib/ layer
 * accept a GameState and return a new one — never mutating in place.
 *
 * This design makes it trivial to:
 *   - Undo / redo moves
 *   - Serialize over a websocket
 *   - Run server-authoritative multiplayer
 *   - Replay games from a move log
 */
export interface GameState {
  /** All participants in order. Index positions are stable for the game's life. */
  players: Player[];

  /** Index into players[] for whose turn it currently is. */
  currentPlayerIndex: number;

  /**
   * Turn direction:
   *   1  → clockwise    (index increases)
   *  -1  → counter-clockwise (index decreases)
   */
  direction: 1 | -1;

  /** Remaining cards available to draw. Top of pile is the last element. */
  drawPile: Card[];

  /**
   * Cards that have been played. The current top is the last element.
   * When the draw pile runs out, all but the top discard are reshuffled back.
   */
  discardPile: Card[];

  /**
   * The color that must be matched for the next play.
   * Differs from the top discard's color when a wild was just played.
   * Null only at game initialisation before a starting card is determined.
   */
  activeColor: CardColor | null;

  /**
   * Number of cards the current player is forced to draw before they can do
   * anything else (caused by unresolved draw2 or wild4 chains).
   * 0 means no pending punishment.
   */
  pendingDraw: number;

  /**
   * Which draw card type created the current pendingDraw, so stacking rules
   * can be checked correctly. Null when pendingDraw === 0.
   */
  pendingDrawType: 'draw2' | 'wild4' | null;

  /** Set to the winning player's id the moment a player empties their hand. */
  winnerId: string | null;

  /** The merged rule set active for this game instance. */
  rules: GameRules;

  /**
   * Increments each time a logical turn concludes (after effects resolve).
   * Useful for UI animations, history indexing, and anti-replay guards.
   */
  turnCount: number;

  /** Structured description of the most recent player action. */
  lastAction: LastAction;
}
