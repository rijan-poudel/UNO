// Small original card-face badges identify players without image downloads.
import type { CSSProperties } from "react";
import type { PlayerExpression } from "../lib/playerExpression";
const COLORS = [
  "#ff6942",
  "#4892ff",
  "#ffcf18",
  "#43ce7d",
  "#a67aff",
  "#ffae36",
];
export default function PlayerAvatar({
  seed,
  large = false,
  expression = "neutral",
}: {
  seed: string;
  large?: boolean;
  expression?: PlayerExpression;
}) {
  const hash = Array.from(seed).reduce((n, char) => n + char.charCodeAt(0), 0);
  return (
    <span
      key={expression}
      className={`player-avatar ${large ? "large" : ""}`}
      data-expression={expression}
      aria-hidden="true"
      style={
        {
          "--avatar-color": COLORS[hash % COLORS.length],
          "--avatar-tilt": `${hash % 2 ? 8 : -8}deg`,
        } as CSSProperties
      }
    >
      <span className="avatar-eyes">
        <i />
        <i />
      </span>
      <span className={`avatar-smile ${hash % 3 === 0 ? "cheeky" : ""}`} />
    </span>
  );
}
