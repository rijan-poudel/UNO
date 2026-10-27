// Separate the authoritative deck from a recipient's public table view.
import type { Card } from '../types/card';
import type { GameState } from '../types/game';
import type { GameView } from '../types/multiplayer';

export function toGameView(game: GameState, viewerId: string): GameView {
  return {
    roundId: game.roundId,
    tableScore: game.tableScore,
    players: game.players.map(
      ({ hand, id, name, avatarId, saidUno, isBot, eliminated }) => ({
        id,
        name,
        avatarId,
        saidUno,
        isBot,
        eliminated,
        handCount: hand.length,
        ...(id === viewerId ? { hand } : {}),
      }),
    ),
    drawPileCount: game.drawPile.length,
    discardPile: game.discardPile,
    currentPlayerIndex: game.currentPlayerIndex,
    direction: game.direction,
    activeColor: game.activeColor,
    pendingDraw: game.pendingDraw,
    pendingRoulette: game.pendingRoulette,
    pendingDrawType: game.pendingDrawType,
    drawnThisTurn: game.drawnThisTurn,
    winnerId: game.winnerId,
    rules: game.rules,
    turnCount: game.turnCount,
    turnDeadlineAt: game.turnDeadlineAt,
    autoPlayPlayerIds: game.autoPlayPlayerIds,
    lastAction: game.lastAction,
  };
}

function cardBacks(count: number, prefix: string): Card[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `${prefix}:${index}`,
    color: 'wild',
    value: 'wild',
  }));
}

/** Presentation compatibility only. These backs must never enter engine actions.
 * Online actions send card IDs to the authoritative server, not this object.
 * Accept legacy servers during a rolling frontend/backend deployment.
 */
export function toPresentationGame(
  game: GameView | GameState | null,
): GameState | null {
  if (!game) return null;
  if ('drawPile' in game) return game;
  const { drawPileCount, ...publicGame } = game;
  return {
    ...publicGame,
    players: game.players.map(({ handCount, hand, ...player }) => ({
      ...player,
      hand: hand ?? cardBacks(handCount, `hidden:${player.id}`),
    })),
    drawPile: cardBacks(drawPileCount, 'hidden:stock'),
  };
}
