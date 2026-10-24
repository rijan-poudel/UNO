// Original illustrated portrait sheet shared by seats, setup and round results.
import type { CSSProperties } from "react";
import type { PlayerExpression } from "../lib/playerExpression";
import styles from "./PlayerAvatar.module.css";
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
  const index = hash % 6;
  return (
    <span
      key={expression}
      className={`${styles.portrait} player-avatar ${large ? "large" : ""}`}
      data-expression={expression}
      aria-hidden="true"
      style={
        {
          backgroundImage: 'url("/artwork/player-portraits.webp")',
          backgroundPosition: `${(index % 3) * 50}% ${Math.floor(index / 3) * 100}%`,
        } as CSSProperties
      }
    />
  );
}
