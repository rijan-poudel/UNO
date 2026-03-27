'use client';

import type { ReactNode } from 'react';

interface SetupShellProps {
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
  controls?: ReactNode;
}

export default function SetupShell({ subtitle, children, footer, controls }: SetupShellProps) {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Courier+Prime:wght@400;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        .setup-input::placeholder { color: var(--ui-muted); }
        .setup-input:focus { outline: none; border-bottom-color: var(--ui-text) !important; }
        .player-row:last-child { border-bottom: none !important; }
        .bot-btn:hover { opacity: 0.55; }
        .remove-btn:hover { color: var(--ui-accent-red) !important; }
        .add-btn:hover { border-color: var(--ui-line) !important; color: var(--ui-text) !important; }
        .setup-primary-btn:hover { opacity: 0.75; }
      `}</style>

      <div
        style={{
          height: '100dvh',
          overflow: 'hidden',
          color: 'var(--ui-text)',
          background: 'var(--ui-bg)',
          fontFamily: "'Courier Prime', monospace",
          display: 'grid',
          gridTemplateRows: 'auto minmax(0, 1fr)',
        }}
      >
        <div>{controls}</div>

        <div style={{ padding: 'clamp(14px, 2.4vh, 28px) clamp(12px, 2.6vw, 28px)' }}>
          <div
            aria-label={subtitle}
            style={{
              width: 'min(1040px, 100%)',
              height: '100%',
              marginInline: 'auto',
              display: 'grid',
              gridTemplateRows: 'minmax(0, 1fr) auto',
              gap: 'clamp(12px, 2.2vh, 30px)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'start',
                minHeight: 0,
                overflowY: 'auto',
                paddingRight: 2,
              }}
            >
              <div style={{ width: 'min(620px, 100%)', display: 'grid', gap: 22 }}>{children}</div>
            </div>

            <div>{footer}</div>
          </div>
        </div>
      </div>
    </>
  );
}
