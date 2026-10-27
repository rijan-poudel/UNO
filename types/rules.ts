// ============================================================
// types/rules.ts
// House-rule configuration model.
// All fields have explicit meanings documented below.
// ============================================================

/**
 * GameRules is the single source of truth for every configurable behaviour.
 * Pass a Partial<GameRules> to initializeGame() to override only what you need.
 */
export type BotDifficulty = "casual" | "standard" | "tactical";
export type GameMode = "classic" | "no_mercy" | "all_wild";

export interface GameRules {
  /** The core game edition: Classic, Show 'Em No Mercy, or All Wild. */
  gameMode: GameMode;
  /** Card-selection strategy for bot seats; does not change turn timing. */
  botDifficulty: BotDifficulty;
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
   */
  allowJumpIn: boolean;

  /** Sevens swap hands; zeroes pass all active hands in the play direction. */
  sevenZero: boolean;

  /** If true, an invalid UNO call-out penalizes the caller by +2 cards. */
  penalizeFalseCallOut: boolean;

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

  // ── Extra house rules ──────────────────────────────────────────────────────
  /** If true, include and enable the Discard All card rule. */
  allowDiscardAll: boolean;

  /**
   * If true, include and enable the Wild Shuffle Hands card rule.
   * Playing this card shuffles all players' hands and re-deals from the
   * next player seat, then applies chosen color.
   */
  allowShuffleCard: boolean;

  // ── Win condition & penalties ─────────────────────────────────────────────
  /**
   * If false, a player may NOT win by playing an action or wild card as their
   * last card. The card is simply blocked — they must play a number card to go out.
   * Default: true (standard UNO allows finishing on any card).
   */
  canFinishWithActionCard: boolean;

  /** Number of cards drawn when caught without declaring UNO. Default: 2. */
  missedUnoDrawPenalty: number;

  /** Maximum cards in hand before instant elimination (Mercy rule). 0 = disabled. */
  eliminationHandLimit: number;
}

/** Sensible defaults matching standard UNO rules. */
export const defaultRules: GameRules = {
  gameMode: "classic",
  botDifficulty: "standard",
  startingHandSize: 7,
  stackDraw2: false,
  stackWild4: false,
  allowWild4OnDraw2: false,
  allowDoublePlaySameNumber: false,
  allowDoublePlayExactMatchOnly: false,
  allowJumpIn: false,
  sevenZero: false,
  penalizeFalseCallOut: false,
  reverseActsAsSkipInTwoPlayer: true,
  mustDeclareUno: true,
  drawUntilPlayable: false,
  allowStartingActionCard: true,
  maxPlayers: 10,
  allowDiscardAll: false,
  allowShuffleCard: false,
  canFinishWithActionCard: true,
  missedUnoDrawPenalty: 2,
  eliminationHandLimit: 0,
};

/** Immutable official Classic UNO rules. */
export const CLASSIC_RULES: Readonly<GameRules> = Object.freeze({
  ...defaultRules,
  gameMode: "classic",
});

/** Immutable official UNO Show 'Em No Mercy rules. */
export const NO_MERCY_RULES: Readonly<GameRules> = Object.freeze({
  ...defaultRules,
  gameMode: "no_mercy",
  maxPlayers: 6,
  stackDraw2: true,
  stackWild4: true,
  allowWild4OnDraw2: true,
  drawUntilPlayable: true,
  allowStartingActionCard: false,
  allowDiscardAll: true,
  eliminationHandLimit: 25,
  sevenZero: true,
});

/** Immutable official UNO All Wild rules. */
export const ALL_WILD_RULES: Readonly<GameRules> = Object.freeze({
  ...defaultRules,
  gameMode: "all_wild",
  allowStartingActionCard: false,
});
