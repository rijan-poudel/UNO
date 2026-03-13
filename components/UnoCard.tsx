'use client';

import type { Card } from '../types/card';

interface UnoCardProps {
  card: Card;
  isPlayable?: boolean;
  isSelected?: boolean;
  faceDown?: boolean;
  compact?: boolean;
  sizeMultiplier?: number;
  onClick?: () => void;
}

// ── Palette — warm, slightly desaturated to feel printed not digital ───────────

const CARD_COLORS: Record<string, { bg: string; text: string; border: string; oval: string }> = {
  red:    { bg: '#c0392b', text: '#fff8f0', border: '#922b21', oval: 'rgba(255,248,240,0.92)' },
  yellow: { bg: '#d4a017', text: '#1a0f00', border: '#a07810', oval: 'rgba(255,248,240,0.92)' },
  green:  { bg: '#1e6b3a', text: '#fff8f0', border: '#145228', oval: 'rgba(255,248,240,0.92)' },
  blue:   { bg: '#1a4f8a', text: '#fff8f0', border: '#103460', oval: 'rgba(255,248,240,0.92)' },
  wild:   { bg: '#1a0f00', text: '#fff8f0', border: '#3a2a14', oval: 'rgba(255,248,240,0.1)'  },
};

// ── Value display labels ───────────────────────────────────────────────────────

const VALUE_LABELS: Record<string, string> = {
  skip:    '⊘',
  reverse: '↺',
  draw2:   '+2',
  wild:    '★',
  wild4:   '+4',
};

function getDisplayValue(value: string): string {
  return VALUE_LABELS[value] ?? value;
}

function getAccessibleLabel(color: string, value: string): string {
  const colorName = color === 'wild' ? '' : color + ' ';
  const valueName: Record<string, string> = {
    skip: 'skip', reverse: 'reverse', draw2: 'draw two',
    wild: 'wild', wild4: 'wild draw four',
  };
  return `${colorName}${valueName[value] ?? value}`;
}

// ── Wild card centre — four colour quadrants, very retro ──────────────────────

function WildCenter({ value }: { value: string }) {
  // Four triangles meeting at centre — like old card game jokers
  return (
    <div style={{
      position: 'relative',
      width: '68%',
      height: '68%',
      borderRadius: '50%',
      overflow: 'hidden',
      transform: 'rotate(-15deg)',
      border: '2px solid rgba(255,248,240,0.18)',
    }}>
      {/* Four quadrant fills */}
      <div style={{ position: 'absolute', inset: 0, background: '#c0392b', clipPath: 'polygon(50% 50%, 0 0, 100% 0)' }} />
      <div style={{ position: 'absolute', inset: 0, background: '#1a4f8a', clipPath: 'polygon(50% 50%, 100% 0, 100% 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, background: '#1e6b3a', clipPath: 'polygon(50% 50%, 100% 100%, 0 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, background: '#d4a017', clipPath: 'polygon(50% 50%, 0 100%, 0 0)' }} />
      {/* Centre circle */}
      <div style={{
        position: 'absolute',
        inset: '28%',
        borderRadius: '50%',
        background: '#1a0f00',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: 'rotate(15deg)',
      }}>
        <span style={{
          fontSize: 13,
          fontWeight: 700,
          color: '#fff8f0',
          fontFamily: "'Courier Prime', Courier, monospace",
          letterSpacing: '-0.02em',
        }}>
          {getDisplayValue(value)}
        </span>
      </div>
    </div>
  );
}

// ── Main card component ────────────────────────────────────────────────────────

export default function UnoCard({
  card,
  isPlayable = false,
  isSelected = false,
  faceDown = false,
  compact = false,
  sizeMultiplier = 1.2,
  onClick,
}: UnoCardProps) {
  const palette   = CARD_COLORS[card.color] ?? CARD_COLORS.wild;
  const display   = getDisplayValue(card.value);
  const isAction  = ['skip','reverse','draw2','wild','wild4'].includes(card.value);
  const interactive = !!onClick && isPlayable;

  const wBase = compact ? 52 : 82;
  const hBase = compact ? 78 : 122;
  const rBase = compact ? 4 : 6;   // border-radius — keep it subtle, not pill-shaped
  const cornerBase = compact ? 10 : 13;
  const centreBase = compact ? (isAction ? 18 : 22) : (isAction ? 26 : 34);

  const w = wBase * sizeMultiplier;
  const h = hBase * sizeMultiplier;
  const r = rBase * sizeMultiplier;
  const corner = cornerBase * sizeMultiplier;
  const centre = centreBase * sizeMultiplier;

  // ── Face-down card ──────────────────────────────────────────────────────────

  if (faceDown) {
    return (
      <div style={{
        width: w, height: h,
        borderRadius: r,
        background: '#1a0f00',
        border: '1.5px solid rgba(255,248,240,0.15)',
        flexShrink: 0,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '1px 2px 6px rgba(26,15,0,0.22)',
      }}>
        {/* crosshatch pattern — same as opponent fan cards */}
        <div style={{
          position: 'absolute',
          inset: 4,
          border: '1px solid rgba(255,248,240,0.1)',
          borderRadius: r - 1,
          background: 'repeating-linear-gradient(45deg, rgba(255,248,240,0.03) 0, rgba(255,248,240,0.03) 1px, transparent 1px, transparent 6px)',
        }} />
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <span style={{
            fontFamily: "'Bebas Neue', cursive",
            fontSize: compact ? 10 : 13,
            letterSpacing: '0.1em',
            color: 'rgba(255,248,240,0.28)',
          }}>UNO</span>
        </div>
      </div>
    );
  }

  // ── Face-up card ────────────────────────────────────────────────────────────

  return (
    <div
      onClick={interactive ? onClick : undefined}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={getAccessibleLabel(card.color, card.value)}
      onKeyDown={e => { if (e.key === 'Enter' && interactive) onClick?.(); }}
      style={{
        width: w,
        height: h,
        borderRadius: r,
        background: palette.bg,
        color: palette.text,
        border: `2px solid ${isSelected ? '#fff8f0' : palette.border}`,
        boxShadow: isSelected
          ? `0 0 0 3px #1a0f00, 0 0 0 5px #fff8f0, 2px 4px 10px rgba(26,15,0,0.3)`
          : isPlayable
            ? `inset 0 0 0 2px rgba(255,248,240,0.35), 2px 4px 10px rgba(26,15,0,0.25)`
            : `1px 3px 8px rgba(26,15,0,0.18)`,
        transform: isSelected ? 'translateY(-10px)' : 'translateY(0)',
        transition: 'transform 0.15s cubic-bezier(0.22,1,0.36,1), box-shadow 0.15s ease',
        cursor: interactive ? 'pointer' : 'default',
        userSelect: 'none',
        position: 'relative',
        flexShrink: 0,
        overflow: 'hidden',
      }}
      onMouseEnter={e => {
        if (!interactive) return;
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-14px)';
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          `inset 0 0 0 2px rgba(255,248,240,0.55), 2px 8px 18px rgba(26,15,0,0.32)`;
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.transform =
          isSelected ? 'translateY(-10px)' : 'translateY(0)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = isSelected
          ? `0 0 0 3px #1a0f00, 0 0 0 5px #fff8f0, 2px 4px 10px rgba(26,15,0,0.3)`
          : isPlayable
            ? `inset 0 0 0 2px rgba(255,248,240,0.35), 2px 4px 10px rgba(26,15,0,0.25)`
            : `1px 3px 8px rgba(26,15,0,0.18)`;
      }}
    >
      {/* Thin inner border — like a real printed card */}
      <div style={{
        position: 'absolute',
        inset: 4,
        borderRadius: Math.max(r - 2, 2),
        border: '1px solid rgba(255,255,255,0.12)',
        pointerEvents: 'none',
      }} />

      {/* Top-left corner value */}
      <span style={{
        position: 'absolute',
        top: compact ? 5 : 7,
        left: compact ? 5 : 7,
        fontSize: corner,
        fontWeight: 700,
        lineHeight: 1,
        fontFamily: "'Courier Prime', Courier, monospace",
        color: palette.text,
      }}>{display}</span>

      {/* Centre — oval containing the value, same as classic UNO */}
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {card.color === 'wild' ? (
          <WildCenter value={card.value} />
        ) : (
          <div style={{
            width: '68%',
            height: '68%',
            borderRadius: '50%',
            background: palette.oval,
            transform: 'rotate(-20deg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(255,255,255,0.14)',
          }}>
            <span style={{
              transform: 'rotate(20deg)',
              fontSize: centre,
              fontWeight: 700,
              fontFamily: "'Courier Prime', Courier, monospace",
              letterSpacing: '-0.03em',
              color: palette.bg,
            }}>{display}</span>
          </div>
        )}
      </div>

      {/* Bottom-right corner value (rotated 180°) */}
      <span style={{
        position: 'absolute',
        right: compact ? 5 : 7,
        bottom: compact ? 5 : 7,
        fontSize: corner,
        fontWeight: 700,
        lineHeight: 1,
        fontFamily: "'Courier Prime', Courier, monospace",
        color: palette.text,
        transform: 'rotate(180deg)',
        display: 'inline-block',
      }}>{display}</span>

      {/* Playable indicator — a subtle top-edge highlight line, no glow */}
      {isPlayable && !isSelected && (
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: 3,
          background: 'rgba(255,248,240,0.6)',
          borderRadius: `${r}px ${r}px 0 0`,
        }} />
      )}
    </div>
  );
}