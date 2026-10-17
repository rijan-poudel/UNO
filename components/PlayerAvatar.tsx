// Small card characters share the material language of the illustrated card pals.
import type { CSSProperties } from "react";
const COLORS = [
  "#ef755d",
  "#8db6ed",
  "#e4c455",
  "#a8c991",
  "#c5afe5",
  "#edae86",
];
export default function PlayerAvatar({
  seed,
  large = false,
}: {
  seed: string;
  large?: boolean;
}) {
  const hash = Array.from(seed).reduce((n, char) => n + char.charCodeAt(0), 0);
  return (
    <span
      className={`player-avatar ${large ? "large" : ""}`}
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
