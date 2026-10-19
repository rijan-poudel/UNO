// A deliberate upward release plays; horizontal scrolling and small lifts do not.
export function canReleaseCard(dx: number, dy: number): boolean {
  return (
    [dx, dy].every(Number.isFinite) &&
    dy < -65 &&
    Math.abs(dy) > Math.abs(dx) * 0.8
  );
}
