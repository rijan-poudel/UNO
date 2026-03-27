"use client";

interface ProfileChipProps {
  name: string;
  seed: string;
  compact?: boolean;
  textColor?: string;
  maxNameWidth?: number;
  ringColor?: string;
  ringWidth?: number;
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
}: ProfileChipProps) {
  const safeName = name.trim() || "Player";
  const avatarSize = compact ? 20 : 26;

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: compact ? 6 : 8 }}>
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
          flexShrink: 0,
        }}
      >
        {safeName.charAt(0).toUpperCase()}
      </span>
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
