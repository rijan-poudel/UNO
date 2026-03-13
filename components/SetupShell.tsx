'use client';

import type { ReactNode } from 'react';

interface SetupShellProps {
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}

export default function  SetupShell({ subtitle, children, footer }: SetupShellProps) {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Courier+Prime:wght@400;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        .setup-input::placeholder { color: rgba(26,15,0,0.22); }
        .setup-input:focus { outline: none; border-bottom-color: rgba(26,15,0,0.45) !important; }
        .player-row:last-child { border-bottom: none !important; }
        .bot-btn:hover { opacity: 0.55; }
        .remove-btn:hover { color: #c0392b !important; }
        .add-btn:hover { border-color: rgba(26,15,0,0.32) !important; color: rgba(26,15,0,0.5) !important; }
        .setup-primary-btn:hover { opacity: 0.75; }
      `}</style>

      <div
        style={{
          height: '100dvh',
          overflow: 'hidden',
          color: '#1a0f00',
          fontFamily: "'Courier Prime', monospace",
          padding: 'clamp(14px, 2.4vh, 28px) clamp(12px, 2.6vw, 28px)',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
      <div
        style={{
          width: 'min(1040px, 100%)',
          height: '100%',
          display: 'grid',
          gridTemplateRows: 'auto auto minmax(0, 1fr) auto',
          gap: 'clamp(12px, 2.2vh, 30px)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <h1
            style={{
              margin: 0,
              fontFamily: "'Bebas Neue', cursive",
              fontSize: 'clamp(72px, 14vw, 120px)',
              letterSpacing: '0.02em',
              lineHeight: 1,
            }}
          >
            <span style={{ color: '#c0392b' }}>U</span>
            <span style={{ color: '#d4a017' }}>N</span>
            <span style={{ color: '#1e6b3a' }}>O</span>
          </h1>
          <p
            style={{
              margin: '12px 0 0',
              fontSize: 11,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'rgba(26,15,0,0.28)',
            }}
          >
            {subtitle}
          </p>
        </div>

        <div style={{ height: 1, background: 'rgba(26,15,0,0.1)', marginTop: -48 }} />

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
    </>
  );
}
