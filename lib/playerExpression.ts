// Decorative expressions follow the published game; they never own turn state.
import type { GameState } from '../types/game';

export type PlayerExpression =
  'neutral' | 'thinking' | 'happy' | 'surprised' | 'celebrate' | 'uno';

export function getPlayerExpression(
  game: GameState,
  playerId: string,
): PlayerExpression {
  if (game.winnerId)
    return game.winnerId === playerId ? 'celebrate' : 'neutral';
  const action = game.lastAction;
  if (
    (action.type === 'draw' &&
      action.playerId === playerId &&
      action.count > 1) ||
    (action.type === 'callOut' && action.targetId === playerId)
  )
    return 'surprised';
  if (
    (action.type === 'declareUno' ||
      (action.type === 'play' && action.declaredUno)) &&
    action.playerId === playerId
  )
    return 'uno';
  if (game.players[game.currentPlayerIndex]?.id === playerId)
    return game.pendingDraw > 0 ? 'surprised' : 'thinking';
  if (action.type === 'play' && action.playerId === playerId) return 'happy';
  return 'neutral';
}
