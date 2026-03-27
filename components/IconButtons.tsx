'use client';

import { ReactNode, useRef, useEffect, useState } from 'react';

// SVG Icons
export function GearIcon({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m5.08 5.08l4.24 4.24M1 12h6m6 0h6M4.22 19.78l4.24-4.24m5.08-5.08l4.24-4.24" />
    </svg>
  );
}

export function PaletteIcon({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="13" cy="13" r="8" />
      <path d="M5 9a4 4 0 0 0 8 0" />
      <path d="M9 17c-2.8-1.4-3-4-3-6" />
      <path d="M17 9c0-2 1-3 2-3" />
    </svg>
  );
}

export function UserIcon({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export function JoystickIcon({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 8h12M8 6v4m4-4v4m4-4v4M4 14a4 4 0 0 0 4 4h8a4 4 0 0 0 4-4" />
    </svg>
  );
}

export function VolumeIcon({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a7 7 0 0 1 0 9.9M19.07 4.93a11 11 0 0 1 0 15.66" />
    </svg>
  );
}

export function CloseIcon({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// Popover component
interface PopoverProps {
  trigger: ReactNode;
  children: ReactNode;
  align?: 'left' | 'right' | 'center';
}

export function Popover({ trigger, children, align = 'right' }: PopoverProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        contentRef.current &&
        triggerRef.current &&
        !contentRef.current.contains(event.target as Node) &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        ref={triggerRef}
        onClick={() => setOpen(!open)}
        style={{
          background: 'var(--ui-surface)',
          border: '1px solid var(--ui-line)',
          color: 'var(--ui-muted)',
          padding: '6px 8px',
          cursor: 'pointer',
          transition: 'color 0.12s, border-color 0.12s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 32,
          height: 32,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'var(--ui-text)';
          e.currentTarget.style.borderColor = 'var(--ui-text)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'var(--ui-muted)';
          e.currentTarget.style.borderColor = 'var(--ui-line)';
        }}
      >
        {trigger}
      </button>

      {open && (
        <div
          ref={contentRef}
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            [align === 'left' ? 'left' : align === 'center' ? 'left' : 'right']: 0,
            transform: align === 'center' ? 'translateX(-50%)' : undefined,
            minWidth: 200,
            background: 'var(--ui-surface)',
            border: '1px solid var(--ui-line)',
            boxShadow: '0 10px 32px color-mix(in srgb, var(--ui-bg) 40%, #000 60%)',
            zIndex: 1000,
            display: 'grid',
            gap: 0,
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function PopoverItem({
  onClick,
  children,
  icon,
  selected,
}: {
  onClick: () => void;
  children: ReactNode;
  icon?: ReactNode;
  selected?: boolean;
}) {
  return (
    <button
      onClick={() => {
        onClick();
      }}
      style={{
        background: selected ? 'var(--ui-text)' : 'transparent',
        color: selected ? 'var(--ui-bg)' : 'var(--ui-text)',
        border: 'none',
        borderBottom: '1px solid var(--ui-line)',
        padding: '12px 16px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        fontSize: 13,
        fontFamily: "'Courier Prime', monospace",
        textAlign: 'left',
        transition: 'all 0.12s',
      }}
      onMouseEnter={(e) => {
        if (!selected) {
          e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
        }
      }}
      onMouseLeave={(e) => {
        if (!selected) {
          e.currentTarget.style.background = 'transparent';
        }
      }}
    >
      {icon && (
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 20,
            height: 20,
            color: 'currentColor',
          }}
        >
          {icon}
        </span>
      )}
      <span>{children}</span>
    </button>
  );
}

