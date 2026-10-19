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
      {
        transform: `translate(${dx * 0.28}px, ${dy * 0.28 - 14}px) rotate(${to.angle - 3}deg) scale(1.025)`,
        offset: 0.72,
      },
      { transform: `translate(0, 0) rotate(${to.angle}deg) scale(1)` },
    ],
  };
}
