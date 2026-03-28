"use client";

interface ProfileChipProps {
  name: string;
  seed: string;
  compact?: boolean;
  textColor?: string;
  maxNameWidth?: number;
  ringColor?: string;
  ringWidth?: number;
  progressRing?: number;
}

const AVATAR_PALETTE = [
  "var(--ui-accent-blue)",
  "var(--ui-accent-green)",
  "var(--ui-accent-yellow)",
  "var(--ui-accent-red)",
];

function avatarColorForSeed(seed: string): string {
  const hash = Array.from(seed).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

export default function ProfileChip({
  name,
  seed,
  compact = false,
  textColor = "var(--ui-text)",
  maxNameWidth,
  ringColor,
  ringWidth = 2,
  progressRing,
}: ProfileChipProps) {
  const safeName = name.trim() || "Player";
  const avatarSize = compact ? 20 : 26;
  const outerAvatarSize = avatarSize + ringWidth * 2;
  const clampedProgress =
    typeof progressRing === "number" ? Math.max(0, Math.min(1, progressRing)) : null;
  const ringSweepDeg = clampedProgress !== null ? Math.round(clampedProgress * 360) : 0;
  const ringTrack = "color-mix(in srgb, var(--ui-line) 78%, transparent)";

  const avatarNode = clampedProgress !== null ? (
    <span
      style={{
        width: outerAvatarSize,
        height: outerAvatarSize,
        borderRadius: 999,
        background: `conic-gradient(var(--ui-accent-red) ${ringSweepDeg}deg, ${ringTrack} 0deg)`,
        display: "grid",
        placeItems: "center",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          width: avatarSize,
          height: avatarSize,
          borderRadius: 999,
          background: avatarColorForSeed(seed),
          color: "var(--ui-surface)",
          display: "grid",
          placeItems: "center",
          fontFamily: "'Bebas Neue', cursive",
          fontSize: compact ? 11 : 12,
          lineHeight: 1,
        }}
      >
        {safeName.charAt(0).toUpperCase()}
      </span>
    </span>
  ) : (
    <span
      style={{
        width: outerAvatarSize,
        height: outerAvatarSize,
        borderRadius: 999,
        display: "grid",
        placeItems: "center",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          width: avatarSize,
          height: avatarSize,
          borderRadius: 999,
          background: avatarColorForSeed(seed),
          border: ringColor ? `${ringWidth}px solid ${ringColor}` : "none",
          color: "var(--ui-surface)",
          display: "grid",
          placeItems: "center",
          fontFamily: "'Bebas Neue', cursive",
          fontSize: compact ? 11 : 12,
          lineHeight: 1,
        }}
      >
        {safeName.charAt(0).toUpperCase()}
      </span>
    </span>
  );

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: compact ? 6 : 8 }}>
      {avatarNode}
      <span
        style={{
          fontFamily: "'Bebas Neue', cursive",
          fontSize: compact ? 13 : 14,
          letterSpacing: "0.03em",
          color: textColor,
          maxWidth: maxNameWidth,
          overflow: maxNameWidth ? "hidden" : undefined,
          textOverflow: maxNameWidth ? "ellipsis" : undefined,
          whiteSpace: maxNameWidth ? "nowrap" : undefined,
        }}
      >
        {safeName}
      </span>
    </span>
  );
}
