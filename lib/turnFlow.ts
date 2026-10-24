// Shared pacing and automatic human-turn outcomes; sound never owns the clock.
import type { GameState } from '../types/game';
import { drawOneCard, drawRequiredCards, passTurn } from './gameActions';
import { getPlayableCards } from './gameRules';

export const HUMAN_TURN_MS = 30_000;
export const BOT_TURN_MS = 1150;
export const FORCED_DRAW_DELAY_MS = 1000;

export function hasForcedPenalty(game: GameState): boolean {
  return (
    !game.winnerId &&
    game.pendingDraw > 0 &&
    getPlayableCards(
      game.players[game.currentPlayerIndex].hand,
      game,
      game.currentPlayerIndex,
    ).length === 0
  );
}

export function withTurnDeadline(
  before: GameState | null,
  after: GameState,
  now = Date.now(),
): GameState {
  const human =
    !after.winnerId && !after.players[after.currentPlayerIndex].isBot;
  const sameTurn =
    before?.currentPlayerIndex === after.currentPlayerIndex &&
    before?.turnCount === after.turnCount &&
    !before?.winnerId &&
    !(after.lastAction.type === 'init' && after.turnDeadlineAt === undefined);
  const deadline = human
    ? ((sameTurn ? (after.turnDeadlineAt ?? before?.turnDeadlineAt) : null) ??
      now + HUMAN_TURN_MS)
    : null;
  return after.turnDeadlineAt === deadline
    ? after
    : { ...after, turnDeadlineAt: deadline };
}

export function expireTurn(game: GameState): GameState {
  if (game.winnerId) return game;
  const index = game.currentPlayerIndex;
  if (game.pendingDraw > 0) return drawRequiredCards(game, index);
  if (game.drawnThisTurn) return passTurn(game, index);
  const drawn = drawOneCard(game, index);
  if (drawn.currentPlayerIndex !== index) return drawn;
  // Keep the draw visible to presentation while concluding the expired turn.
  return { ...passTurn(drawn, index), lastAction: drawn.lastAction };
}
