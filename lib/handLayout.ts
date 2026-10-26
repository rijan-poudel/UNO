// A readable exposed strip takes priority over fitting every card on screen.
export function getHandOverlap(
  available: number,
  count: number,
  width: number,
): number {
  if (
    !Number.isFinite(available) ||
    !Number.isFinite(width) ||
    width <= 0 ||
    count < 2
  )
    return 0;
  const minimum = Math.min(width, Math.max(44, width * 0.4));
  const preferred = Math.max(minimum, width * 0.65);
  const advance = Math.max(
    minimum,
    Math.min(preferred, (available - width) / (count - 1)),
  );
  return Math.round((advance - width) * 10) / 10;
}

// Shared fan geometry keeps the crop budget in step with the rendered hand.
export function getHandFan(index: number, count: number) {
  const fromCenter = count < 2 ? 0 : index - (count - 1) / 2;
  const half = Math.max(1, (count - 1) / 2);
  const angle = fromCenter * Math.min(5, 12 / half);
  const edge = fromCenter / half;
  const drop = 520 * (1 - Math.cos((angle * Math.PI) / 180)) + edge * edge * 16;
  return { angle, drop };
}

// The deepest resting corner loses at most one quarter. The scrollport still
// contains complete faces, so keyboard focus cannot reveal a second vertical row.
export function getHandCropMargin(
  count: number,
  width: number,
  height: number,
  depth: number,
  rotation: number,
): number {
  if (
    ![width, height, depth, rotation].every(Number.isFinite) ||
    width <= 0 ||
    height <= 0 ||
    count < 1
  )
    return 0;
  const fan = getHandFan(0, count);
  const angle = (Math.abs(fan.angle * rotation) * Math.PI) / 180;
  // HandCard rotates around 50% 120%; include the lower corner's excursion.
  const extra =
    fan.drop * depth +
    (width / 2) * Math.sin(angle) +
    height * 0.2 * (1 - Math.cos(angle));
  return Math.max(0, Math.round((height * 0.25 + 26 - extra) * 10) / 10);
}
