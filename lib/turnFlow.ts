// Shared pacing and automatic human-turn outcomes; sound never owns the clock.
import type { GameState } from '../types/game';
import { playBotStep } from './botSupport';
import { getPlayableCards } from './gameRules';

export const HUMAN_TURN_MS = 30_000;
export const AUTO_PLAY_TURN_MS = 10_000;
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
      now +
        (after.autoPlayPlayerIds?.includes(
          after.players[after.currentPlayerIndex].id,
        )
          ? AUTO_PLAY_TURN_MS
          : HUMAN_TURN_MS))
    : null;
  return after.turnDeadlineAt === deadline
    ? after
    : { ...after, turnDeadlineAt: deadline };
}

export function expireTurn(game: GameState, now = Date.now()): GameState {
  if (game.winnerId) return game;
  const playerId = game.players[game.currentPlayerIndex].id;
  const autoPlayPlayerIds = game.autoPlayPlayerIds ?? [];
  const next = playBotStep({
    ...game,
    autoPlayPlayerIds: autoPlayPlayerIds.includes(playerId)
      ? autoPlayPlayerIds
      : [...autoPlayPlayerIds, playerId],
  });
  // A voluntary draw is its own published snapshot, then the bot finishes it.
  return next.turnCount === game.turnCount && !next.winnerId
    ? { ...next, turnDeadlineAt: now + BOT_TURN_MS }
    : next;
}

export function resumePlayerControl(
  game: GameState,
  playerId: string,
  now = Date.now(),
): GameState {
  if (!game.autoPlayPlayerIds?.includes(playerId)) return game;
  return {
    ...game,
    autoPlayPlayerIds: game.autoPlayPlayerIds.filter((id) => id !== playerId),
    turnDeadlineAt:
      !game.winnerId && game.players[game.currentPlayerIndex].id === playerId
        ? now + HUMAN_TURN_MS
        : game.turnDeadlineAt,
  };
}
