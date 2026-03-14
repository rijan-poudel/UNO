// ============================================================
// types/rules.ts
// House-rule configuration model.
// All fields have explicit meanings documented below.
// ============================================================

/**
 * GameRules is the single source of truth for every configurable behaviour.
 * Pass a Partial<GameRules> to initializeGame() to override only what you need.
 */
export interface GameRules {
  // ── Hand size ────────────────────────────────────────────────────────────
  /** How many cards each player receives at the start of the game. Default: 7. */
  startingHandSize: number;

  // ── Draw stacking ────────────────────────────────────────────────────────
  /**
   * If true, a player who is targeted by draw2 may play their own draw2 to
   * pass the penalty (plus 2 more) on to the next player.
   */
  stackDraw2: boolean;

  /**
   * If true, a player who is targeted by wild4 may play their own wild4 to
   * pass the penalty (plus 4 more) on to the next player.
   */
  stackWild4: boolean;

  /**
   * If true, a player targeted by draw2 may play a wild4 to escape the penalty
   * and shift it (plus 4) on to the next player.
   * Only relevant when stackDraw2 is false and this option is independently set.
   */
  allowWild4OnDraw2: boolean;

  // ── Double-play ──────────────────────────────────────────────────────────
  /**
   * If true, a player may play two number cards in the same turn if they share
   * the same face value (e.g., two 7s of different colors).
   */
  allowDoublePlaySameNumber: boolean;

  /**
   * Used together with allowDoublePlaySameNumber.
   * If true, the two cards must also share the same color in addition to the
   * same value ("exact match"). If false, only the same value is required.
   */
  allowDoublePlayExactMatchOnly: boolean;

  // ── Jump-in ──────────────────────────────────────────────────────────────
  /**
   * If true, any player holding an exact duplicate of the current top card
   * (same color AND value) may "jump in" out of turn.
   * TODO: jump-in interrupt logic is not yet fully implemented in game actions.
   */
  allowJumpIn: boolean;

  // ── Two-player special cases ──────────────────────────────────────────────
  /**
   * In a 2-player game, playing a Reverse effectively skips the opponent's turn
   * (since reversing direction still points back to you). Default: true.
   */
  reverseActsAsSkipInTwoPlayer: boolean;

  // ── UNO declaration ───────────────────────────────────────────────────────
  /**
   * If true, a player who plays down to 1 card must explicitly call declareUno()
   * before their turn ends or risk being called out by opponents.
   */
  mustDeclareUno: boolean;

  // ── Drawing behaviour ─────────────────────────────────────────────────────
  /**
   * If true, when a player cannot play they must keep drawing cards from the
   * draw pile until they pick up a card they can legally play.
   * If false, they draw exactly one card and then pass.
   */
  drawUntilPlayable: boolean;

  // ── Starting card restrictions ────────────────────────────────────────────
  /**
   * If false, the initial flip to start the discard pile will skip any
   * action or wild card until a number card is found.
   */
  allowStartingActionCard: boolean;

  // ── Player limits ─────────────────────────────────────────────────────────
  /** The maximum number of players allowed in a game. */
  maxPlayers: number;

  // ── Win condition ─────────────────────────────────────────────────────────
  /**
   * If false, a player may NOT win by playing an action or wild card as their
   * last card. The card is simply blocked — they must play a number card to go out.
   * Default: true (standard UNO allows finishing on any card).
   */
  canFinishWithActionCard: boolean;
}

/** Sensible defaults matching standard UNO rules. */
export const defaultRules: GameRules = {
  startingHandSize: 7,
  stackDraw2: false,
  stackWild4: false,
  allowWild4OnDraw2: false,
  allowDoublePlaySameNumber: false,
  allowDoublePlayExactMatchOnly: false,
  allowJumpIn: false,
  reverseActsAsSkipInTwoPlayer: true,
  mustDeclareUno: true,
  drawUntilPlayable: false,
  allowStartingActionCard: true,
  maxPlayers: 10,
  canFinishWithActionCard: true,
};
