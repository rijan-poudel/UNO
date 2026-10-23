"use client";

import type { CSSProperties, ReactNode } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

export function UnoWordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`wordmark ${compact ? "compact" : ""}`} aria-label="UNO">
      UNO
      <span className="brand-colors" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </span>
    </span>
  );
}
export function PageShell({ children }: { children: ReactNode }) {
  return <main className="page-shell">{children}</main>;
}
export function UtilityButton({
  children,
  onClick,
  disabled = false,
  style,
  title,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  style?: CSSProperties;
  title?: string;
}) {
  return (
    <button
      type="button"
      className="button secondary small"
      onClick={onClick}
      disabled={disabled}
      style={style}
      title={title}
    >
      {children}
    </button>
  );
}
export function PrimaryButton({
  children,
  onClick,
  disabled = false,
  style,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  style?: CSSProperties;
}) {
  return (
    <button
      type="button"
      className="button primary"
      onClick={onClick}
      disabled={disabled}
      style={style}
    >
      {children}
      <ArrowRight size={18} />
    </button>
  );
}
export function SectionDivider({ style }: { style?: CSSProperties }) {
  return <hr className="divider" style={style} />;
}
export function CountBadge({
  current,
  total,
}: {
  current: number;
  total: number;
  alert?: boolean;
}) {
  return (
    <span className="count-badge">
      {current} / {total} seats
    </span>
  );
}
export function SetupIntro({
  title,
  description,
  onBack,
  trailing,
}: {
  title: string;
  description: string;
  onBack?: () => void;
  trailing?: ReactNode;
}) {
  return (
    <div className="setup-intro">
      {onBack && (
        <button className="text-button" onClick={onBack}>
          <ArrowLeft size={16} /> Back to home
        </button>
      )}
      <div className="section-heading">
        <h1>{title}</h1>
        {trailing}
      </div>
      <p>{description}</p>
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
    <div className="segmented">
      {options.map((option) => (
        <button
          type="button"
          key={option.value}
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
export function ModeRow({
  label,
  desc,
  onClick,
}: {
  label: string;
  desc: string;
  onClick: () => void;
  last?: boolean;
}) {
  return (
    <button className="mode-row" onClick={onClick}>
      <span>
        <strong>{label}</strong>
        <small>{desc}</small>
      </span>
      <ArrowRight size={20} />
    </button>
  );
}
