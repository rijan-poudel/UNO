import type { GameState } from '../types/game';

// Card flight geometry is independent of React and never controls game timing.
export interface CardPose {
  x: number;
  y: number;
  width: number;
  angle: number;
}

export function getCardFlight(from: CardPose, to: CardPose) {
  const dx = from.x - to.x;
  const dy = from.y - to.y;
  const scale = from.width / to.width;
  return {
    duration: Math.round(190 + Math.min(600, Math.hypot(dx, dy)) * 0.12),
    keyframes: [
      {
        transform: `translate(${dx}px, ${dy}px) rotate(${from.angle}deg) scale(${scale})`,
      },
      { transform: `translate(0, 0) rotate(${to.angle}deg) scale(1)` },
    ],
  };
}

// Equivalent online snapshots and UNO metadata must not interrupt a card in flight.
export function hasCardLayoutChanged(
  before: GameState,
  after: GameState,
): boolean {
  return (
    before.discardPile.at(-1)?.id !== after.discardPile.at(-1)?.id ||
    before.drawPile.length !== after.drawPile.length ||
    before.players.length !== after.players.length ||
    before.players.some((player, index) => {
      const next = after.players[index];
      return (
        player.id !== next.id ||
        player.hand.length !== next.hand.length ||
        player.hand.some(
          (card, cardIndex) => card.id !== next.hand[cardIndex].id,
        )
      );
    })
  );
}
