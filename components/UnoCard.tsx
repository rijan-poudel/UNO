'use client';

import type { Card } from '../types/card';

interface UnoCardProps {
  card: Card;
  isPlayable?: boolean;
  isSelected?: boolean;
  faceDown?: boolean;
  /** Scale factor. 1 = default (82×122). Use 0.65 for piles, 1.3 for hand. */
  sizeMultiplier?: number;
  onClick?: () => void;
}

const CARD_COLORS: Record<string, { bg: string; text: string; border: string; oval: string }> = {
  red:    { bg: '#c0392b', text: '#fff8f0', border: '#922b21', oval: 'rgba(255,248,240,0.92)' },
  yellow: { bg: '#d4a017', text: '#1a0f00', border: '#a07810', oval: 'rgba(255,248,240,0.92)' },
  green:  { bg: '#1e6b3a', text: '#fff8f0', border: '#145228', oval: 'rgba(255,248,240,0.92)' },
  blue:   { bg: '#1a4f8a', text: '#fff8f0', border: '#103460', oval: 'rgba(255,248,240,0.92)' },
  wild:   { bg: '#1a0f00', text: '#fff8f0', border: '#3a2a14', oval: 'rgba(255,248,240,0.1)'  },
};

const VALUE_LABELS: Record<string, string> = {
  skip: '⊘', reverse: '↺', draw2: '+2', discardAll: 'ALL', wild: '★', wild4: '+4', shuffle: 'S',
};

function getDisplayValue(value: string): string {
  return VALUE_LABELS[value] ?? value;
}

function getCenterDisplayValue(value: string): string {
  if (value === 'shuffle') return 'SHUFFLE';
  return getDisplayValue(value);
}

function getAccessibleLabel(color: string, value: string): string {
  const colorName = color === 'wild' ? '' : color + ' ';
  const valueName: Record<string, string> = {
    skip: 'skip', reverse: 'reverse', draw2: 'draw two', discardAll: 'discard all', wild: 'wild', wild4: 'wild draw four', shuffle: 'wild shuffle',
  };
  return `${colorName}${valueName[value] ?? value}`;
}

function WildCenter({ value, s }: { value: string; s: number }) {
  const displayValue = getCenterDisplayValue(value);
  const fontSize = value === 'shuffle' ? Math.round(8 * s) : Math.round(13 * s);
  const isShuffle = value === 'shuffle';

  return (
    <div style={{
      position: 'relative', width: '68%', height: '68%',
      borderRadius: '50%', overflow: 'hidden',
      transform: 'rotate(-15deg)',
      border: `${Math.max(1, Math.round(2 * s))}px solid rgba(255,248,240,0.18)`,
    }}>
      <div style={{ position: 'absolute', inset: 0, background: '#c0392b', clipPath: 'polygon(50% 50%, 0 0, 100% 0)' }} />
      <div style={{ position: 'absolute', inset: 0, background: '#1a4f8a', clipPath: 'polygon(50% 50%, 100% 0, 100% 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, background: '#1e6b3a', clipPath: 'polygon(50% 50%, 100% 100%, 0 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, background: '#d4a017', clipPath: 'polygon(50% 50%, 0 100%, 0 0)' }} />
      <div style={{
        position: 'absolute', inset: '28%', borderRadius: '50%', background: isShuffle ? '#fff8f0' : '#1a0f00',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transform: 'rotate(15deg)',
      }}>
        <span style={{
          fontSize,
          fontWeight: 700,
          color: isShuffle ? '#1a0f00' : '#fff8f0',
          fontFamily: "'Courier Prime', Courier, monospace", letterSpacing: '-0.02em',
        }}>
          {displayValue}
        </span>
      </div>
    </div>
  );
}

export default function UnoCard({
  card,
  isPlayable = false,
  isSelected = false,
  faceDown = false,
  sizeMultiplier = 1,
  onClick,
}: UnoCardProps) {
  const s = sizeMultiplier;
  const palette = CARD_COLORS[card.color] ?? CARD_COLORS.wild;
  const display = getDisplayValue(card.value);
  const isAction = ['skip', 'reverse', 'draw2', 'wild', 'wild4'].includes(card.value);
  const interactive = !!onClick && isPlayable;

  const BASE_W = 82, BASE_H = 122;
  const w = Math.round(BASE_W * s);
  const h = Math.round(BASE_H * s);
  const r = Math.max(2, Math.round(6 * s));
  const corner = Math.round(13 * s);
  const centre = Math.round((isAction ? 26 : 34) * s);
  const pad = Math.round(7 * s);
  const innerPad = Math.round(4 * s);

  // ── Face-down ─────────────────────────────────────────────────────────────────
  if (faceDown) {
    return (
      <div style={{
        width: w, height: h, borderRadius: r,
        background: 'linear-gradient(160deg, #1a0f00 0%, #2a1806 100%)',
        border: `${Math.max(1, Math.round(1.5 * s))}px solid rgba(255,248,240,0.2)`,
        flexShrink: 0, position: 'relative', overflow: 'hidden',
        boxShadow: `${Math.round(1 * s)}px ${Math.round(2 * s)}px ${Math.round(8 * s)}px rgba(26,15,0,0.26)`,
      }}>
        <div style={{
          position: 'absolute', inset: Math.round(4 * s),
          border: '1px solid rgba(255,248,240,0.16)',
          borderRadius: Math.max(1, r - 1),
          background: 'radial-gradient(circle at 30% 20%, rgba(255,248,240,0.08), transparent 55%)',
        }} />
        <div style={{
          position: 'absolute',
          inset: Math.round(7 * s),
          borderRadius: Math.max(1, r - 3),
          overflow: 'hidden',
          opacity: 0.9,
        }}>
          <div style={{
            position: 'absolute',
            top: '-20%',
            left: '-12%',
            width: '48%',
            height: '140%',
            transform: 'rotate(-25deg)',
            background: 'linear-gradient(180deg, #ef5350, #c0392b)',
          }} />
          <div style={{
            position: 'absolute',
            top: '-20%',
            left: '24%',
            width: '48%',
            height: '140%',
            transform: 'rotate(-25deg)',
            background: 'linear-gradient(180deg, #fdd835, #d4a017)',
          }} />
          <div style={{
            position: 'absolute',
            top: '-20%',
            left: '60%',
            width: '48%',
            height: '140%',
            transform: 'rotate(-25deg)',
            background: 'linear-gradient(180deg, #42a5f5, #1a4f8a)',
          }} />
        </div>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            width: `${Math.round(54 * s)}px`,
            height: `${Math.round(34 * s)}px`,
            borderRadius: '999px',
            background: 'rgba(26,15,0,0.78)',
            border: `${Math.max(1, Math.round(2 * s))}px solid rgba(255,248,240,0.9)`,
            transform: 'rotate(-18deg)',
            display: 'grid',
            placeItems: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.28)',
          }}>
            <span style={{
              fontFamily: "'Bebas Neue', cursive",
              fontSize: Math.round(15 * s),
              letterSpacing: '0.12em',
              color: '#fff8f0',
              textShadow: '0 1px 2px rgba(0,0,0,0.3)',
            }}>UNO</span>
          </div>
        </div>
      </div>
    );
  }

  // ── Face-up ───────────────────────────────────────────────────────────────────
  return (
    <div
      onClick={interactive ? onClick : undefined}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={getAccessibleLabel(card.color, card.value)}
      onKeyDown={e => { if (e.key === 'Enter' && interactive) onClick?.(); }}
      style={{
        width: w, height: h, borderRadius: r,
        background: palette.bg,
        color: palette.text,
        border: `${Math.max(1, Math.round(2 * s))}px solid ${isSelected ? '#fff8f0' : palette.border}`,
        boxShadow: isSelected
          ? `0 0 0 ${Math.round(3 * s)}px #1a0f00, 0 0 0 ${Math.round(5 * s)}px #fff8f0, ${Math.round(2 * s)}px ${Math.round(4 * s)}px ${Math.round(10 * s)}px rgba(26,15,0,0.3)`
          : isPlayable
            ? `inset 0 0 0 ${Math.round(2 * s)}px rgba(255,248,240,0.35), ${Math.round(2 * s)}px ${Math.round(4 * s)}px ${Math.round(10 * s)}px rgba(26,15,0,0.25)`
            : `${Math.round(1 * s)}px ${Math.round(3 * s)}px ${Math.round(8 * s)}px rgba(26,15,0,0.18)`,
        transition: 'box-shadow 0.15s ease',
        cursor: interactive ? 'pointer' : 'default',
        userSelect: 'none',
        position: 'relative',
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      {/* Inner border — like a real printed card */}
      <div style={{
        position: 'absolute', inset: innerPad,
        borderRadius: Math.max(1, r - 2),
        border: '1px solid rgba(255,255,255,0.12)',
        pointerEvents: 'none',
      }} />

      {/* Top-left corner */}
      <span style={{
        position: 'absolute', top: pad, left: pad,
        fontSize: corner, fontWeight: 700, lineHeight: 1,
        fontFamily: "'Courier Prime', Courier, monospace",
        color: palette.text,
      }}>{display}</span>

      {/* Centre */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {card.color === 'wild' ? (
          <WildCenter value={card.value} s={s} />
        ) : (
          <div style={{
            width: '68%', height: '68%', borderRadius: '50%',
            background: palette.oval, transform: 'rotate(-20deg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid rgba(255,255,255,0.14)',
          }}>
            <span style={{
              transform: 'rotate(20deg)', fontSize: centre, fontWeight: 700,
              fontFamily: "'Courier Prime', Courier, monospace",
              letterSpacing: '-0.03em', color: palette.bg,
            }}>{display}</span>
          </div>
        )}
      </div>

      {/* Bottom-right corner */}
      <span style={{
        position: 'absolute', right: pad, bottom: pad,
        fontSize: corner, fontWeight: 700, lineHeight: 1,
        fontFamily: "'Courier Prime', Courier, monospace",
        color: palette.text, transform: 'rotate(180deg)', display: 'inline-block',
      }}>{display}</span>

      {/* Playable top-edge highlight */}
      {isPlayable && !isSelected && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: Math.round(3 * s),
          background: 'rgba(255,248,240,0.65)',
          borderRadius: `${r}px ${r}px 0 0`,
        }} />
      )}
    </div>
  );
}
