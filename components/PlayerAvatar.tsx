// Original illustrated portrait sheet shared by seats, setup and round results.
import type { CSSProperties } from "react";
import { UserRound, Smile, Sparkles } from "lucide-react";
import { isAvatarId } from "../lib/playerAvatars";
import type { PlayerExpression } from "../lib/playerExpression";
import styles from "./PlayerAvatar.module.css";
export default function PlayerAvatar({
  seed,
  avatarId,
  isBot = false,
  large = false,
  expression = "neutral",
}: {
  seed: string;
  avatarId?: string;
  isBot?: boolean;
  large?: boolean;
  expression?: PlayerExpression;
}) {
  const hash = Array.from(seed).reduce((n, char) => n + char.charCodeAt(0), 0);
  const chosen = isAvatarId(avatarId)
    ? avatarId
    : isBot
      ? `portrait-${hash % 6}`
      : "initials";
  const index =
    chosen === "initials" ? null : Number(chosen.slice("portrait-".length));
  const cell = index === null ? 0 : index % 6;
  return (
    <span
      key={expression}
      className={`${styles.portrait} player-avatar ${large ? "large" : ""}`}
      data-expression={expression}
      aria-hidden="true"
      style={
        {
          ...(index !== null
            ? {
                backgroundImage: `url("/artwork/${index >= 6 ? "player-portraits-extended" : "player-portraits"}.webp")`,
                backgroundPosition: `${(cell % 3) * 50}% ${Math.floor(cell / 3) * 100}%`,
              }
            : {}),
        } as CSSProperties
      }
    >
      {index === null && <UserRound size="58%" strokeWidth={2} />}
      {(expression === "uno" ||
        expression === "surprised" ||
        expression === "celebrate" ||
        expression === "happy") && (
        <span className={styles.reaction}>
          {expression === "uno" ? (
            "UNO!"
          ) : expression === "surprised" ? (
            "!"
          ) : expression === "celebrate" ? (
            <Sparkles size={13} />
          ) : (
            <Smile size={13} />
          )}
        </span>
      )}
    </span>
  );
}
