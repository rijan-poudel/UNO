'use client';

import { useState, type CSSProperties, type MouseEvent, type ReactNode } from 'react';

const SECONDARY_BUTTON_STYLE: CSSProperties = {
  fontFamily: "'Courier Prime', monospace",
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  background: 'var(--ui-surface)',
  border: '1px solid var(--ui-line)',
  color: 'var(--ui-muted)',
  padding: '6px 11px',
  cursor: 'pointer',
  transition: 'color 0.12s, border-color 0.12s, opacity 0.12s',
};

const PRIMARY_BUTTON_STYLE: CSSProperties = {
  fontFamily: "'Bebas Neue', cursive",
  fontSize: 22,
  letterSpacing: '0.18em',
  background: 'var(--ui-text)',
  color: 'var(--ui-surface)',
  border: 'none',
  padding: '18px 0',
  cursor: 'pointer',
  width: '100%',
  transition: 'opacity 0.12s',
};

function handleButtonMouseEnter(event: MouseEvent<HTMLButtonElement>) {
  if (event.currentTarget.disabled) return;
  event.currentTarget.style.color = 'var(--ui-text)';
  event.currentTarget.style.borderColor = 'var(--ui-text)';
}

function handleButtonMouseLeave(event: MouseEvent<HTMLButtonElement>) {
  event.currentTarget.style.color = 'var(--ui-muted)';
  event.currentTarget.style.borderColor = 'var(--ui-line)';
}

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Courier+Prime:wght@400;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        body { margin: 0; background: var(--ui-bg); }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
        @keyframes rowSlideIn { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
        .shell-enter { animation: fadeUp 0.28s ease; }
      `}</style>
      <div
        className="shell-enter"
        style={{
          minHeight: '100vh',
          background: 'var(--ui-bg)',
          color: 'var(--ui-text)',
          fontFamily: "'Courier Prime', monospace",
          padding: 'clamp(40px,5vh,64px) clamp(24px,4vw,48px)',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div style={{ width: 'min(1040px, 100%)', display: 'flex', flexDirection: 'column' }}>
          {children}
        </div>
      </div>
    </>
  );
}

export function UtilityButton({
  children,
  disabled = false,
  onClick,
  style,
  type = 'button',
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  style?: CSSProperties;
  type?: 'button' | 'submit' | 'reset';
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={handleButtonMouseEnter}
      onMouseLeave={handleButtonMouseLeave}
      style={{
        ...SECONDARY_BUTTON_STYLE,
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'default' : SECONDARY_BUTTON_STYLE.cursor,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export function PrimaryButton({
  children,
  disabled = false,
  onClick,
  style,
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  style?: CSSProperties;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="setup-primary-btn"
      style={{
        ...PRIMARY_BUTTON_STYLE,
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'default' : PRIMARY_BUTTON_STYLE.cursor,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export function UnoWordmark({ compact = false }: { compact?: boolean }) {
  return (
    <h1
      style={{
        margin: 0,
        fontFamily: "'Bebas Neue', cursive",
        fontSize: compact ? 38 : 'clamp(72px,14vw,120px)',
        letterSpacing: '0.02em',
        lineHeight: 1,
      }}
    >
      <span style={{ color: 'var(--ui-accent-red)' }}>U</span>
      <span style={{ color: 'var(--ui-accent-yellow)' }}>N</span>
      <span style={{ color: 'var(--ui-accent-green)' }}>O</span>
    </h1>
  );
}

export function HomeUtilityBar({
  themeLabel,
  onTheme,
  onSettings,
}: {
  themeLabel: string;
  onTheme: () => void;
  onSettings: () => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '14px 0',
        borderBottom: '1px solid var(--ui-line)',
        marginBottom: 16,
      }}
    >
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
        <UtilityButton onClick={onTheme}>Theme: {themeLabel}</UtilityButton>
        <UtilityButton onClick={onSettings}>Settings</UtilityButton>
      </div>
    </div>
  );
}

export function SetupUtilityBar({
  themeLabel,
  onTheme,
  onSettings,
}: {
  themeLabel: string;
  onTheme: () => void;
  onSettings: () => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 8,
        padding: '10px 0',
        borderBottom: '1px solid var(--ui-line)',
        marginBottom: 8,
      }}
    >
      <UnoWordmark compact />

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
        <UtilityButton onClick={onTheme}>Theme: {themeLabel}</UtilityButton>
        <UtilityButton onClick={onSettings}>Settings</UtilityButton>
      </div>
    </div>
  );
}

export function SectionDivider({ style }: { style?: CSSProperties }) {
  return <div style={{ height: 1, background: 'var(--ui-line)', ...style }} />;
}

export function CountBadge({
  current,
  total,
  alert = false,
}: {
  current: number;
  total: number;
  alert?: boolean;
}) {
  return (
    <span
      style={{
        fontFamily: "'Courier Prime', monospace",
        fontSize: 11,
        letterSpacing: '0.1em',
        color: alert ? 'var(--ui-accent-red)' : 'var(--ui-muted)',
        paddingBottom: 2,
        whiteSpace: 'nowrap',
      }}
    >
      {current} / {total}
    </span>
  );
}

export function SetupIntro({
  eyebrow,
  title,
  description,
  onBack,
  trailing,
}: {
  eyebrow: string;
  title: string;
  description: string;
  onBack?: () => void;
  trailing?: ReactNode;
}) {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {onBack ? (
        <div>
          <UtilityButton onClick={onBack}>← Back</UtilityButton>
        </div>
      ) : null}

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'grid', gap: 8 }}>
          <p
            style={{
              margin: 0,
              fontSize: 10,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--ui-muted)',
            }}
          >
            {eyebrow}
          </p>
          <h2
            style={{
              margin: 0,
              fontFamily: "'Bebas Neue', cursive",
              fontSize: 34,
              letterSpacing: '0.04em',
              lineHeight: 1,
            }}
          >
            {title}
          </h2>
        </div>

        {trailing}
      </div>

      <p
        style={{
          margin: 0,
          color: 'var(--ui-muted)',
          fontSize: 11,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}
      >
        {description}
      </p>
    </div>
  );
}

export function SegmentedToggle<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${options.length}, 1fr)`, border: '2px solid var(--ui-line)', width: '100%' }}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            style={{
              border: 'none',
              padding: '14px 12px',
              cursor: 'pointer',
              background: selected ? 'var(--ui-text)' : 'transparent',
              color: selected ? 'var(--ui-surface)' : 'var(--ui-text)',
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              fontFamily: "'Courier Prime', monospace",
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function ModeRow({
  label,
  desc,
  onClick,
  last,
}: {
  label: string;
  desc: string;
  onClick: () => void;
  last?: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        padding: '20px 22px',
        border: '1px solid var(--ui-line)',
        marginBottom: last ? 0 : 8,
        background: hovered ? 'var(--ui-surface)' : 'transparent',
        cursor: 'pointer',
        textAlign: 'left',
        width: '100%',
        transition: 'background 0.12s, border-color 0.12s',
        borderColor: hovered ? 'var(--ui-text)' : 'var(--ui-line)',
        animation: 'rowSlideIn 0.24s ease',
      }}
    >
      <div>
        <p
          style={{
            margin: 0,
            fontFamily: "'Bebas Neue', cursive",
            fontSize: 26,
            letterSpacing: '0.04em',
            color: 'var(--ui-text)',
            lineHeight: 1,
          }}
        >
          {label}
        </p>
        <p
          style={{
            margin: '8px 0 0',
            fontFamily: "'Courier Prime', monospace",
            fontSize: 11,
            letterSpacing: '0.12em',
            color: 'var(--ui-muted)',
            textTransform: 'uppercase',
          }}
        >
          {desc}
        </p>
      </div>
      <span
        style={{
          fontFamily: "'Courier Prime', monospace",
          fontSize: 16,
          color: 'var(--ui-muted)',
          flexShrink: 0,
          transition: 'transform 0.14s',
          transform: hovered ? 'translateX(3px)' : 'none',
        }}
      >
        →
      </span>
    </button>
  );
}