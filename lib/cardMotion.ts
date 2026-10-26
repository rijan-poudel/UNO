import type { GameState } from '../types/game';

/** Public faces in landing order; the last one stays on top of the pile. */
export function getPlayedCards(game: GameState) {
  const action = game.lastAction;
  if (action.type !== 'play') return [];
  return game.discardPile.slice(
    -(action.playedCards?.length ?? 1 + (action.discardAllCount ?? 0)),
  );
}

/** One short throw, even when Discard All clears a large hand. */
export function getMultiPlayDelay(index: number, count: number): number {
  return count < 2
    ? 0
    : Math.round((index / (count - 1)) * Math.min(120, (count - 1) * 35));
}

// Card flight geometry is independent of React and never controls game timing.
export interface CardPose {
  x: number;
  y: number;
  width: number;
  angle: number;
}

export const CARD_MOTION_EASE = 'cubic-bezier(.22,.68,0,1)';
export type CardFlightKind = 'play' | 'draw' | 'deal' | 'return';

export function getCardFlight(
  from: CardPose,
  to: CardPose,
  kind: CardFlightKind = 'play',
) {
  const dx = from.x - to.x;
  const dy = from.y - to.y;
  const scale = from.width / to.width;
  const distance = Math.min(600, Math.hypot(dx, dy));
  const lift = Math.min(kind === 'deal' ? 38 : 24, distance * 0.09);
  // Sample one shallow arc: exact pickup and contact poses, no rebound at rest.
  const angle = ((to.angle - from.angle + 540) % 360) - 180;
  return {
    duration: Math.round(
      (kind === 'return' ? 180 : kind === 'deal' ? 300 : 240) + distance * 0.1,
    ),
    keyframes: [0, 0.25, 0.5, 0.75, 1].map((progress) => {
      const arc = 4 * progress * (1 - progress);
      return {
        offset: progress,
        transform: `translate(${dx * (1 - progress)}px, ${dy * (1 - progress) - lift * arc}px) rotate(${from.angle + angle * progress}deg) scale(${scale + (1 - scale) * progress + arc * Math.min(distance / 600, 1) * 0.035})`,
      };
    }),
  };
}

// A full table deals in short rounds, capped even for unusually large hands.
export function getDealDelay(cardIndex: number, seatIndex = 0): number {
  return Math.min(320, cardIndex * 42 + seatIndex * 8);
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
