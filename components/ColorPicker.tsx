'use client';

import type { CardColor } from '../types/card';

interface ColorPickerProps {
  onSelect: (color: CardColor) => void;
  onCancel: () => void;
}

const COLORS: Array<{ color: CardColor; bg: string; text: string; border: string; label: string }> = [
  { color: 'red',    bg: 'var(--ui-accent-red)',    text: '#fff8f0',       border: 'color-mix(in srgb, var(--ui-accent-red) 72%, #000 28%)', label: 'Red'    },
  { color: 'yellow', bg: 'var(--ui-accent-yellow)', text: 'var(--ui-text)', border: 'color-mix(in srgb, var(--ui-accent-yellow) 72%, #000 28%)', label: 'Yellow' },
  { color: 'green',  bg: 'var(--ui-accent-green)',  text: '#fff8f0',       border: 'color-mix(in srgb, var(--ui-accent-green) 72%, #000 28%)', label: 'Green'  },
  { color: 'blue',   bg: 'var(--ui-accent-blue)',   text: '#fff8f0',       border: 'color-mix(in srgb, var(--ui-accent-blue) 72%, #000 28%)', label: 'Blue'   },
];

export default function ColorPicker({ onSelect, onCancel }: ColorPickerProps) {
  return (
    <>
      <style>{`
        @keyframes cpFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes cpSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .cp-btn {
          transition: opacity 0.12s ease;
          cursor: pointer;
        }
        .cp-btn:hover { opacity: 0.82; }
        .cp-btn:active { opacity: 0.6; }
        .cp-cancel:hover { color: var(--ui-text) !important; }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={onCancel}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 60,
          background: 'color-mix(in srgb, var(--ui-bg) 22%, #000 8%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          animation: 'cpFadeIn 0.18s ease',
        }}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{
            width: 'min(480px, 100%)',
            background: 'var(--ui-surface)',
            border: '1px solid var(--ui-line)',
            padding: '32px 28px 24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 28,
            animation: 'cpSlideUp 0.2s ease',
          }}
        >

          {/* Heading */}
          <div style={{ textAlign: 'center' }}>
            <p style={{
              margin: 0,
              fontFamily: "'Courier Prime', Courier, monospace",
              fontSize: 10,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--ui-muted)',
            }}>Wild card played</p>
            <h2 style={{
              margin: '8px 0 0',
              fontFamily: "'Bebas Neue', cursive",
              fontSize: 32,
              letterSpacing: '0.04em',
              color: 'var(--ui-text)',
              lineHeight: 1,
            }}>Choose a colour</h2>
          </div>

          {/* 2×2 colour grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
            width: '100%',
          }}>
            {COLORS.map(({ color, bg, text, border, label }) => (
              <button
                key={color}
                onClick={() => onSelect(color)}
                className="cp-btn"
                style={{
                  height: 96,
                  background: bg,
                  color: text,
                  border: `2px solid ${border}`,
                  borderRadius: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: "'Bebas Neue', cursive",
                  fontSize: 22,
                  letterSpacing: '0.1em',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Divider + cancel */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{ width: '100%', height: 1, background: 'var(--ui-line)' }} />
            <button
              onClick={onCancel}
              className="cp-cancel"
              style={{
                fontFamily: "'Courier Prime', Courier, monospace",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                background: 'transparent',
                border: 'none',
                color: 'var(--ui-muted)',
                cursor: 'pointer',
                padding: '4px 0',
                transition: 'color 0.12s',
              }}
            >Cancel</button>
          </div>

        </div>
      </div>
    </>
  );
}
